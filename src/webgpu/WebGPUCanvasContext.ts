/**
 * WebGPU canvas 上下文：`CanvasContext` 接口在 `GPUCanvasContext` 上的实现。
 *
 * 与 WebGL2 的隐式默认帧缓冲不同，WebGPU 必须先把 context `configure()` 到某个 device 上，
 * 之后每帧通过 `getCurrentTexture()` 拿 back buffer。本类把后者包成 core 的
 * {@link FrameTarget}，并把「同一帧返回同一个 target」做实：`getCurrentTexture()` 在 present
 * 之前会一直返回同一个 `GPUTexture`，因此按原生对象身份做缓存就够了。
 *
 * **超出 core 的扩展**：core 的 `FrameTarget` 没有地方表达 MSAA 的多重采样 attachment，
 * `RenderPassDescriptor` 又只能给 attachment 列表。因此这里额外提供
 * {@link WebGPUCanvasContext.createPassDescriptor} 与 {@link WebGPUCanvasContext.multisampleView}：
 * 配置了 `sampleCount > 1` 时会创建一张同尺寸的多重采样 texture，并把它作为 `view`、
 * 把 canvas 纹理作为 `resolveTarget`。
 */

import type {
  CanvasAlphaMode,
  CanvasColorSpace,
  CanvasConfig,
  CanvasContext,
  FrameTarget,
} from '../core/CanvasContext.js';
import type { Color, ColorAttachment } from '../core/render/RenderTarget.js';
import type { LoadOp } from '../core/enums/LoadOp.js';
import type { StoreOp } from '../core/enums/StoreOp.js';
import type { TextureFormat } from '../core/enums/TextureFormat.js';
import type { TextureUsage } from '../core/enums/TextureUsage.js';
import type { Device } from '../core/Device.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { TextureUsage as TextureUsageFlags } from '../core/enums/TextureUsage.js';
import { defaultPixelRatio, measureCanvas } from '../core/CanvasContext.js';
import { assertSampleCount, toGPUTextureUsage } from './utils/wgpuEnumMap.js';
import { getWebGPUCanvasContext, preferredCanvasFormat, toCanvasFormat } from './utils/wgpuCapabilities.js';
import { WebGPUDevice } from './WebGPUDevice.js';
import { WebGPUTexture } from './resources/WebGPUTexture.js';
import type { WebGPUTextureView } from './resources/WebGPUTextureView.js';

export interface WebGPUCanvasContextOptions {
  /** 初始 pixel ratio；默认为 `devicePixelRatio`（上限 4）。 */
  pixelRatio?: number;
  /** 自动为 back buffer 追加 `CopySrc` usage（截图 / readback 用）。 */
  copySrc?: boolean;
}

/** {@link WebGPUCanvasContext.createPassDescriptor} 的选项。 */
export interface WebGPUCanvasPassOptions {
  loadOp?: LoadOp;
  storeOp?: StoreOp;
  clearValue?: Color;
}

export class WebGPUCanvasContext implements CanvasContext {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;

  private readonly options: WebGPUCanvasContextOptions;
  private gpuContext: GPUCanvasContext | null = null;
  private currentDevice: WebGPUDevice | null = null;
  private formatValue: TextureFormat;
  private usageValue: TextureUsage;
  private alphaModeValue: CanvasAlphaMode = 'premultiplied';
  private colorSpaceValue: CanvasColorSpace | undefined;
  private sampleCountValue = 1;
  private widthValue = 1;
  private heightValue = 1;
  private pixelRatioValue: number;
  private configuredValue = false;

  private frameTexture: WebGPUTexture | null = null;
  private frameView: WebGPUTextureView | null = null;
  private frameNative: GPUTexture | null = null;
  private frameTarget: FrameTarget | null = null;
  private multisampleTexture: WebGPUTexture | null = null;
  private multisampleViewValue: WebGPUTextureView | null = null;
  private _disposed = false;

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas, options: WebGPUCanvasContextOptions = {}) {
    this.canvas = canvas;
    this.options = options;
    this.pixelRatioValue = options.pixelRatio ?? defaultPixelRatio();
    this.formatValue = preferredCanvasFormat();
    this.usageValue =
      TextureUsageFlags.RenderAttachment | (options.copySrc ? TextureUsageFlags.CopySrc : TextureUsageFlags.None);

    const measured = measureCanvas(canvas);
    this.widthValue = Math.max(1, Math.round(measured.width * this.pixelRatioValue));
    this.heightValue = Math.max(1, Math.round(measured.height * this.pixelRatioValue));
  }

  get width(): number {
    return this.widthValue;
  }

  get height(): number {
    return this.heightValue;
  }

  get pixelRatio(): number {
    return this.pixelRatioValue;
  }

  get format(): TextureFormat {
    return this.formatValue;
  }

  get configured(): boolean {
    return this.configuredValue;
  }

  get device(): Device | null {
    return this.currentDevice;
  }

  /** 原生 `GPUCanvasContext`；configure 之后才有值。 */
  get native(): GPUCanvasContext | null {
    return this.gpuContext;
  }

  /** 本上下文使用的 MSAA 采样数（1 或 4）。 */
  get sampleCount(): number {
    return this.sampleCountValue;
  }

  /** 当前帧 canvas 纹理的 view（MSAA 时是 resolve target）；未取帧时为 `null`。 */
  get frameTextureView(): WebGPUTextureView | null {
    return this.frameView;
  }

  /** 配置了 MSAA 且已取过一次帧时，当前帧的多重采样 view；否则为 `null`。 */
  get multisampleView(): WebGPUTextureView | null {
    return this.multisampleViewValue;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 把 context 配置到某个 device 上。会丢弃当前帧的缓存。 */
  configure(config: CanvasConfig): void {
    if (this._disposed) {
      throw new ValidationError('[gpu-device-api] CanvasContext.configure: the context has been disposed.');
    }
    if (!(config.device instanceof WebGPUDevice)) {
      throw new ValidationError(
        '[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice).',
      );
    }
    const context = getWebGPUCanvasContext(this.canvas);
    if (!context) {
      throw new ValidationError(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context ' +
          '(getContext("webgpu") returned null).',
      );
    }

    this.releaseFrame();
    this.releaseMultisampleTarget();
    this.gpuContext = context;
    this.currentDevice = config.device;
    this.formatValue = config.format ?? preferredCanvasFormat();
    this.usageValue =
      TextureUsageFlags.RenderAttachment |
      (config.usage ?? TextureUsageFlags.None) |
      (this.options.copySrc ? TextureUsageFlags.CopySrc : TextureUsageFlags.None);
    this.alphaModeValue = config.alphaMode ?? 'premultiplied';
    this.colorSpaceValue = config.colorSpace;
    this.sampleCountValue = assertSampleCount(
      config.sampleCount ?? config.device.defaultSampleCount,
      'CanvasConfig.sampleCount',
    );

    const configuration: GPUCanvasConfiguration = {
      device: config.device.native,
      format: toCanvasFormat(this.formatValue),
      usage: toGPUTextureUsage(this.usageValue),
      alphaMode: this.alphaModeValue,
    };
    if (this.colorSpaceValue !== undefined) configuration.colorSpace = this.colorSpaceValue;
    context.configure(configuration);

    this.configuredValue = true;
    this.setSize(this.widthValue / this.pixelRatioValue, this.heightValue / this.pixelRatioValue, false);
  }

  /** 解除配置；之后 `getCurrentFrameTarget()` 会抛错。 */
  unconfigure(): void {
    this.releaseFrame();
    this.releaseMultisampleTarget();
    const context = this.gpuContext as (GPUCanvasContext & { unconfigure?: () => void }) | null;
    if (context && typeof context.unconfigure === 'function') context.unconfigure();
    this.configuredValue = false;
    this.currentDevice = null;
    this.gpuContext = null;
  }

  /** 以 CSS 像素设置画布尺寸（内部会乘以 pixel ratio）。 */
  setSize(width: number, height: number, updateStyle = true): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new ValidationError(
        `[gpu-device-api] CanvasContext.setSize: width and height must be positive, got ${width}x${height}.`,
      );
    }
    const deviceWidth = Math.max(1, Math.round(width * this.pixelRatioValue));
    const deviceHeight = Math.max(1, Math.round(height * this.pixelRatioValue));
    this.canvas.width = deviceWidth;
    this.canvas.height = deviceHeight;
    if (updateStyle) {
      const style = (this.canvas as { style?: { width: string; height: string } }).style;
      if (style) {
        style.width = `${width}px`;
        style.height = `${height}px`;
      }
    }
    if (deviceWidth !== this.widthValue || deviceHeight !== this.heightValue) {
      this.widthValue = deviceWidth;
      this.heightValue = deviceHeight;
      this.releaseFrame();
      this.releaseMultisampleTarget();
    }
  }

  /** 设置 CSS 像素与设备像素之间的比例。 */
  setPixelRatio(ratio: number): void {
    if (!Number.isFinite(ratio) || ratio <= 0) {
      throw new ValidationError(
        `[gpu-device-api] CanvasContext.setPixelRatio: ratio must be positive, got ${String(ratio)}.`,
      );
    }
    if (ratio === this.pixelRatioValue) return;
    const cssWidth = this.widthValue / this.pixelRatioValue;
    const cssHeight = this.heightValue / this.pixelRatioValue;
    this.pixelRatioValue = ratio;
    this.setSize(cssWidth, cssHeight, false);
  }

  /** 重新读取元素尺寸；back buffer 发生变化时返回 true。 */
  resize(updateStyle = false): boolean {
    const measured = measureCanvas(this.canvas);
    const deviceWidth = Math.max(1, Math.round(measured.width * this.pixelRatioValue));
    const deviceHeight = Math.max(1, Math.round(measured.height * this.pixelRatioValue));
    if (deviceWidth === this.widthValue && deviceHeight === this.heightValue) return false;
    this.setSize(measured.width, measured.height, updateStyle);
    return true;
  }

  /**
   * 获取当前帧纹理。
   *
   * WebGPU 在 present 之前会一直返回同一个 `GPUTexture`，因此这里按原生对象身份缓存包装
   * 对象；present（提交了写 canvas 的 render pass）之后身份变化，包装对象会被自动重建。
   */
  getCurrentFrameTarget(): FrameTarget {
    const device = this.currentDevice;
    if (!this.configuredValue || !this.gpuContext || !device) {
      throw new ValidationError(
        '[gpu-device-api] CanvasContext.getCurrentFrameTarget: the context is not configured.',
      );
    }
    const native = this.gpuContext.getCurrentTexture();
    if (this.frameTarget && this.frameNative === native) return this.frameTarget;

    this.releaseFrame();
    const texture = WebGPUTexture.adopt(
      device,
      native,
      {
        label: `${device.label}#canvasTexture`,
        format: this.formatValue,
        usage: this.usageValue,
        size: { width: native.width, height: native.height, depthOrArrayLayers: 1 },
      },
      { owned: false },
    );
    const view = texture.createView({ label: `${texture.label}#view` });
    this.frameTexture = texture;
    this.frameView = view;
    this.frameNative = native;
    this.frameTarget = {
      texture,
      view,
      width: texture.width,
      height: texture.height,
      format: this.formatValue,
      isDefaultFramebuffer: true,
    };
    return this.frameTarget;
  }

  /**
   * 生成可以直接交给 `beginRenderPass` 的 color attachment 列表。
   *
   * `sampleCount > 1` 时会创建/复用一个同尺寸的多重采样 texture，把它作为 `view`，
   * 而把 canvas 纹理作为 `resolveTarget`。
   */
  createPassDescriptor(
    options: WebGPUCanvasPassOptions = {},
  ): { colorAttachments: readonly ColorAttachment[]; depthStencilAttachment: null } {
    const frame = this.getCurrentFrameTarget();
    const loadOp = options.loadOp ?? 'clear';
    const storeOp = options.storeOp ?? 'store';
    const clearValue = options.clearValue;
    if (this.sampleCountValue > 1) {
      return {
        colorAttachments: [
          {
            view: this.ensureMultisampleTarget(frame.width, frame.height),
            resolveTarget: frame.view,
            loadOp,
            storeOp,
            clearValue,
          },
        ],
        depthStencilAttachment: null,
      };
    }
    return {
      colorAttachments: [{ view: frame.view, loadOp, storeOp, clearValue }],
      depthStencilAttachment: null,
    };
  }

  /** 释放 context 相关资源。幂等。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.unconfigure();
  }

  /* ------------------------------------------------------------------ 内部 -------------- */

  private ensureMultisampleTarget(width: number, height: number): WebGPUTextureView {
    const device = this.currentDevice;
    if (!device) {
      throw new ValidationError('[gpu-device-api] CanvasContext: the context is not configured.');
    }
    const existing = this.multisampleTexture;
    if (existing && existing.width === width && existing.height === height && this.multisampleViewValue) {
      return this.multisampleViewValue;
    }
    this.releaseMultisampleTarget();
    const texture = WebGPUTexture.create(device, {
      label: `${device.label}#canvasMSAA`,
      size: { width, height },
      format: this.formatValue,
      usage: TextureUsageFlags.RenderAttachment,
      sampleCount: this.sampleCountValue,
    });
    this.multisampleTexture = texture;
    this.multisampleViewValue = texture.createView({ label: `${texture.label}#view` });
    return this.multisampleViewValue;
  }

  private releaseFrame(): void {
    this.frameTexture?.dispose();
    this.frameTexture = null;
    this.frameView = null;
    this.frameNative = null;
    this.frameTarget = null;
  }

  private releaseMultisampleTarget(): void {
    this.multisampleTexture?.destroy();
    this.multisampleTexture = null;
    this.multisampleViewValue = null;
  }
}

/** 该对象是否为 WebGPU 后端的 canvas context。 */
export function isWebGPUCanvasContext(value: unknown): value is WebGPUCanvasContext {
  return value instanceof WebGPUCanvasContext;
}
