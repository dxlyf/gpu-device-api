/**
 * WebGPU canvas 上下文：`CanvasContext` 接口在 `GPUCanvasContext` 上的实现。
 *
 * 与 WebGL2 的隐式默认帧缓冲不同，WebGPU 必须先把 context `configure()` 到某个 device 上，
 * 之后每帧通过 `getCurrentTexture()` 拿 back buffer。本类把后者包成 core 的
 * {@link FrameTarget}，并把「同一帧返回同一个 target」做实：`getCurrentTexture()` 在 present
 * 之前会一直返回同一个 `GPUTexture`，因此按原生对象身份做缓存就够了。
 *
 * **超出 core 的扩展**：core 的 `FrameTarget` 没有地方表达 MSAA 的多重采样 attachment 与
 * canvas 的深度附件，`RenderPassDescriptor` 又只能给 attachment 列表。因此
 * {@link WebGPUCanvasContext.createPassDescriptor} 一次把三件事说清楚：
 * `sampleCount > 1` 时创建/复用一张同尺寸的多重采样 texture（canvas 纹理作为 `resolveTarget`）；
 * 需要深度时创建/复用一张同尺寸的 `depth24plus` texture（尺寸变化时重建）；
 * 两者都不需要时就是一张普通的 canvas 纹理。
 */

import type {
  CanvasAlphaMode,
  CanvasColorSpace,
  CanvasConfig,
  CanvasContext,
  CanvasPassDescriptor,
  CanvasPassOptions,
  FrameTarget,
} from '../core/CanvasContext.js';
import type { ColorAttachment, DepthStencilAttachment } from '../core/render/RenderTarget.js';
import type { TextureFormat } from '../core/enums/TextureFormat.js';
import type { TextureUsage } from '../core/enums/TextureUsage.js';
import type { Device } from '../core/Device.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { TextureUsage as TextureUsageFlags } from '../core/enums/TextureUsage.js';
import { CANVAS_DEPTH_FORMAT, defaultPixelRatio, measureCanvas } from '../core/CanvasContext.js';
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

/** `createPassDescriptor()` 的选项别名；正式类型是 core 的 {@link CanvasPassOptions}。 */
export type WebGPUCanvasPassOptions = CanvasPassOptions;

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
  private depthRequestedValue = true;
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
  private depthTexture: WebGPUTexture | null = null;
  private depthViewValue: WebGPUTextureView | null = null;
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

  /** 已创建（且已取过一次帧）的 canvas 深度 view；没有深度附件时为 `null`。 */
  get depthStencilView(): WebGPUTextureView | null {
    return this.depthViewValue;
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
    this.releaseDepthTarget();
    this.gpuContext = context;
    this.currentDevice = config.device;
    this.formatValue = config.format ?? preferredCanvasFormat();
    this.usageValue =
      TextureUsageFlags.RenderAttachment |
      (config.usage ?? TextureUsageFlags.None) |
      (this.options.copySrc ? TextureUsageFlags.CopySrc : TextureUsageFlags.None);
    this.alphaModeValue = config.alphaMode ?? 'premultiplied';
    this.colorSpaceValue = config.colorSpace;
    /*
     * 第二次 configure（例如只是要补一个 `CopySrc` usage 以便截图读回）如果没写 sampleCount，
     * 就沿用当前值：否则配好的 MSAA 会被悄悄关掉 —— canvas 纹理已经按 4x 渲染，
     * pipeline 却按 1x 解析，而画面看起来「差不多」，最难定位。要重置就显式写 `sampleCount: 1`。
     */
    const sampleCount =
      config.sampleCount ?? (this.configuredValue ? this.sampleCountValue : config.device.defaultSampleCount);
    this.sampleCountValue = assertSampleCount(sampleCount, 'CanvasConfig.sampleCount');
    this.depthRequestedValue = config.depth ?? true;

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
    this.releaseDepthTarget();
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
      this.releaseDepthTarget();
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
   * 生成可以直接交给 `beginRenderPass` 的附件列表。
   *
   * - `sampleCount > 1` 时创建/复用一个同尺寸的多重采样 texture，把它作为 `view`，
   *   而把 canvas 纹理作为 `resolveTarget`；
   * - 需要深度时（`CanvasConfig.depth`，默认 `true`）创建/复用一个同尺寸的 `depth24plus`
   *   texture。**canvas 纹理本身没有深度附件**，不像 WebGL2 的默认帧缓冲那样自带深度缓冲，
   *   所以这里必须显式给出来，否则渲染通道的 `depthFormat` 会是 `null`，
   *   pipeline 会解析成「没有深度状态」的变体，深度测试被静默关掉。
   *   多重采样时深度 texture 的 sampleCount 必须与颜色附件一致，这里共用 `sampleCountValue`。
   */
  createPassDescriptor(options: CanvasPassOptions = {}): CanvasPassDescriptor {
    const frame = this.getCurrentFrameTarget();
    const loadOp = options.loadOp ?? 'clear';
    const storeOp = options.storeOp ?? 'store';
    const clearValue = options.clearValue;

    let colorAttachments: readonly ColorAttachment[];
    if (this.sampleCountValue > 1) {
      colorAttachments = [
        {
          view: this.ensureMultisampleTarget(frame.width, frame.height),
          resolveTarget: frame.view,
          loadOp,
          storeOp,
          clearValue,
        },
      ];
    } else {
      colorAttachments = [{ view: frame.view, loadOp, storeOp, clearValue }];
    }

    let depthStencilAttachment: DepthStencilAttachment | null = null;
    if (this.depthRequestedValue) {
      depthStencilAttachment = {
        view: this.ensureDepthTarget(frame.width, frame.height),
        depthLoadOp: options.depthLoadOp ?? 'clear',
        depthStoreOp: options.depthStoreOp ?? 'store',
        depthClearValue: options.depthClearValue ?? 1,
      };
    }
    return { colorAttachments, depthStencilAttachment };
  }

  /** 释放 context 相关资源。幂等。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    // unconfigure() 会把 currentDevice 清空，所以先通知设备取消追踪。
    this.currentDevice?.untrack(this);
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

  /**
   * 取得（必要时创建）canvas 深度的 view。
   *
   * canvas 纹理没有深度附件，所以深度由本库自己维护：按尺寸缓存，尺寸变化时重建
   *（`setSize()` / `configure()` 里已经先 release 掉了旧的）。sampleCount 与颜色附件一致，
   * 否则 WebGPU 会因为「附件采样数不一致」让整条 command buffer 失效。
   */
  private ensureDepthTarget(width: number, height: number): WebGPUTextureView {
    const device = this.currentDevice;
    if (!device) {
      throw new ValidationError('[gpu-device-api] CanvasContext: the context is not configured.');
    }
    const existing = this.depthTexture;
    if (existing && existing.width === width && existing.height === height && this.depthViewValue) {
      return this.depthViewValue;
    }
    this.releaseDepthTarget();
    const texture = WebGPUTexture.create(device, {
      label: `${device.label}#canvasDepth`,
      size: { width, height },
      format: CANVAS_DEPTH_FORMAT,
      usage: TextureUsageFlags.RenderAttachment,
      sampleCount: this.sampleCountValue,
    });
    this.depthTexture = texture;
    this.depthViewValue = texture.createView({ label: `${texture.label}#view` });
    return this.depthViewValue;
  }

  private releaseDepthTarget(): void {
    this.depthTexture?.destroy();
    this.depthTexture = null;
    this.depthViewValue = null;
  }
}

/** 该对象是否为 WebGPU 后端的 canvas context。 */
export function isWebGPUCanvasContext(value: unknown): value is WebGPUCanvasContext {
  return value instanceof WebGPUCanvasContext;
}
