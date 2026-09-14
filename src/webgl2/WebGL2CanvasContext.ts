/**
 * WebGL2 的 canvas 表面。
 *
 * WebGL2 与 WebGPU 最大的不同：**GL context 本身就从 canvas 上取**，一个 device 只能服务
 * 它自己的那个 canvas，默认帧缓冲也隐式存在。所以 `configure()` 在这里主要是记账与校验，
 * 而 `getCurrentFrameTarget()` 返回的是一张「虚拟纹理」—— 它代表默认帧缓冲，
 * `native` 为 `null`，渲染通道看到它会直接绑定 framebuffer 0 而不是某个 FBO。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { TextureDimension, type Texture } from '../core/resources/Texture.js';
import { TextureUsage } from '../core/enums/TextureUsage.js';
import type { TextureAspect, TextureView, TextureViewDescriptor } from '../core/resources/TextureView.js';
import {
  CANVAS_DEPTH_FORMAT,
  defaultPixelRatio,
  measureCanvas,
  type FrameTarget,
  type CanvasConfig,
  type CanvasContext,
  type CanvasPassDescriptor,
  type CanvasPassOptions,
} from '../core/CanvasContext.js';
import type { ColorAttachment, DepthStencilAttachment } from '../core/render/RenderTarget.js';
import { glFormatIsAttachment } from './utils/glFormatMap.js';
import type { WebGL2Device } from './WebGL2Device.js';

/** 标记：这个 view 代表默认帧缓冲。 */
export interface DefaultFramebufferView extends TextureView {
  readonly isDefaultFramebuffer: true;
}

/** 判断一个 view 是否代表默认帧缓冲（渲染通道据此决定绑定 framebuffer 0）。 */
export function isDefaultFramebufferView(view: unknown): view is DefaultFramebufferView {
  return !!view && typeof view === 'object' && (view as { isDefaultFramebuffer?: boolean }).isDefaultFramebuffer === true;
}

/**
 * 默认帧缓冲的虚拟纹理。
 *
 * 它不持有任何 GL 对象：`native` 为 `null`，所有操作都是空实现。
 * 存在的意义是让 `FrameTarget` 的类型在两个后端保持一致，
 * 让上层代码不必为 canvas 写特例。
 *
 * 同一张虚拟纹理也用来表达**默认帧缓冲自带的深度缓冲**（`label` / `format` / `aspect` 不同）：
 * 渲染通道只要看到这张 view，就知道这个 pass 走的是 framebuffer 0、并且有深度附件。
 */
class DefaultFramebufferTexture implements Texture {
  readonly label: string;
  readonly dimension = TextureDimension.D2;
  readonly format: Texture['format'];
  readonly usage: Texture['usage'];
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers = 1;
  readonly mipLevelCount = 1;
  readonly sampleCount: number;
  readonly native = null;

  private readonly aspect: TextureAspect;
  private destroyed = false;
  private cachedView: DefaultFramebufferView | null = null;

  constructor(
    width: number,
    height: number,
    format: Texture['format'],
    sampleCount: number,
    usage: Texture['usage'],
    label = 'canvas:defaultFramebuffer',
    aspect: TextureAspect = 'all',
  ) {
    this.width = width;
    this.height = height;
    this.format = format;
    this.sampleCount = sampleCount;
    this.usage = usage;
    this.label = label;
    this.aspect = aspect;
  }

  get size() {
    return { width: this.width, height: this.height, depthOrArrayLayers: 1 as const };
  }

  get views(): readonly TextureView[] {
    return this.cachedView ? [this.cachedView] : [];
  }

  get disposed(): boolean {
    return this.destroyed;
  }

  createView(descriptor: TextureViewDescriptor = {}): TextureView {
    if (!this.cachedView) {
      const view: DefaultFramebufferView = {
        label: descriptor.label ?? `${this.label}:view`,
        texture: this,
        descriptor: {
          format: this.format,
          dimension: '2d',
          baseMipLevel: 0,
          mipLevelCount: 1,
          baseArrayLayer: 0,
          arrayLayerCount: 1,
          aspect: this.aspect,
        },
        native: null,
        isDefaultFramebuffer: true,
        disposed: false,
        dispose: () => {},
      };
      this.cachedView = view;
    }
    return this.cachedView;
  }

  destroy(): void {
    this.destroyed = true;
  }

  dispose(): void {
    this.destroy();
  }
}

export interface WebGL2CanvasContextOptions {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** 首选的背景缓冲格式；WebGL2 的默认帧缓冲格式由浏览器决定，这里只用于类型对齐。 */
  format?: Texture['format'];
}

export class WebGL2CanvasContext implements CanvasContext {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly gl: WebGL2RenderingContext;

  private _device: WebGL2Device | null = null;
  private _format: Texture['format'];
  private _pixelRatio: number;
  private _width: number;
  private _height: number;
  /** 默认帧缓冲的深度位数；0 表示这次 context 根本没有深度缓冲。 */
  private depthBits = 0;
  /** `configure()` 里是否明确要求了深度；`undefined` 表示没表态（不校验）。 */
  private depthRequested: boolean | undefined = undefined;

  constructor(options: WebGL2CanvasContextOptions) {
    this.gl = options.gl;
    this.canvas = options.canvas;
    this._format = options.format ?? 'rgba8unorm';

    const ratio = defaultPixelRatio();
    const size = measureCanvas(options.canvas);
    this._pixelRatio = ratio;
    this._width = Math.max(1, Math.floor(size.width * ratio));
    this._height = Math.max(1, Math.floor(size.height * ratio));
    this.applyBackingSize();
  }

  get device(): WebGL2Device | null {
    return this._device;
  }

  get deviceRef(): WebGL2Device | null {
    return this._device;
  }

  get configured(): boolean {
    return this._device !== null;
  }

  get format(): Texture['format'] {
    return this._format;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get pixelRatio(): number {
    return this._pixelRatio;
  }

  /** 该 canvas 的 GL context（与 device 的 `native` 是同一个对象）。 */
  get context(): WebGL2RenderingContext {
    return this.gl;
  }

  configure(config: CanvasConfig): void {
    if (config.sampleCount !== undefined && config.sampleCount > 1) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2CanvasContext.configure: canvas MSAA is decided by the `antialias` ' +
          'attribute of the GL context, so sampleCount cannot be changed here. Create the device with ' +
          'createDevice({ contextAttributes: { antialias: true } }) instead, or use an offscreen ' +
          'RenderTarget (WebGL2 cannot multisample a texture attachment at all).',
      );
    }
    if (config.format !== undefined && !glFormatIsAttachment(config.format)) {
      throw new ValidationError(
        `[gpu-device-api] canvas 格式「${config.format}」不能作为颜色附件。`,
      );
    }
    const device = config.device as WebGL2Device;
    if (device.native !== this.gl) {
      throw new ValidationError(
        '[gpu-device-api] 这个 canvas 的 WebGL2 context 不是该 device 持有的那一个。\n' +
          'WebGL2 的 context 是从 canvas 上取的，一个 device 只能服务创建它的那个 canvas；' +
          '请用 createDevice({ canvas }) 传入同一个 canvas，或为另一个 canvas 单独创建 device。',
      );
    }
    // 默认帧缓冲有没有深度缓冲，由创建 context 时的 contextAttributes.depth 决定；
    // 这里只如实读一次，供 createPassDescriptor() 汇报。
    this.depthBits = Number(this.gl.getParameter(this.gl.DEPTH_BITS) ?? 0) || 0;
    this.depthRequested = config.depth;
    if (config.depth === true && this.depthBits === 0) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2CanvasContext.configure: depth was requested, but this canvas has no ' +
          'depth buffer (DEPTH_BITS is 0). The depth buffer comes from the GL context attributes, so ' +
          'create the device with createDevice({ contextAttributes: { depth: true } }).',
      );
    }
    this._device = device;
    if (config.format) this._format = config.format;
  }

  unconfigure(): void {
    this._device = null;
  }

  setSize(width: number, height: number, updateStyle = true): void {
    const cssWidth = Math.max(1, Math.round(width));
    const cssHeight = Math.max(1, Math.round(height));
    const element = this.canvas as HTMLCanvasElement;
    if (updateStyle && typeof element.style !== 'undefined') {
      element.style.width = `${cssWidth}px`;
      element.style.height = `${cssHeight}px`;
    }
    this._width = Math.max(1, Math.floor(cssWidth * this._pixelRatio));
    this._height = Math.max(1, Math.floor(cssHeight * this._pixelRatio));
    this.applyBackingSize();
  }

  setPixelRatio(ratio: number): void {
    if (!Number.isFinite(ratio) || ratio <= 0) {
      throw new RangeError(`[gpu-device-api] setPixelRatio() 需要正数，实际是 ${ratio}。`);
    }
    if (ratio === this._pixelRatio) return;
    this._pixelRatio = ratio;
    const size = measureCanvas(this.canvas);
    this._width = Math.max(1, Math.floor(size.width * ratio));
    this._height = Math.max(1, Math.floor(size.height * ratio));
    this.applyBackingSize();
  }

  resize(): boolean {
    const size = measureCanvas(this.canvas);
    const width = Math.max(1, Math.floor(size.width * this._pixelRatio));
    const height = Math.max(1, Math.floor(size.height * this._pixelRatio));
    if (width === this._width && height === this._height) return false;
    this._width = width;
    this._height = height;
    this.applyBackingSize();
    return true;
  }

  getCurrentFrameTarget(): FrameTarget {
    if (!this._device) {
      throw new ValidationError(
        '[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。',
      );
    }
    const sampleCount = Number(this.gl.getParameter(this.gl.SAMPLES) ?? 1) || 1;
    const texture = new DefaultFramebufferTexture(
      this._width,
      this._height,
      this._format,
      sampleCount,
      TextureUsage.RenderAttachment,
    );
    return {
      texture,
      view: texture.createView(),
      width: this._width,
      height: this._height,
      format: this._format,
      isDefaultFramebuffer: true,
    };
  }

  /**
   * 生成画布渲染通道的附件列表。
   *
   * 默认帧缓冲**自带深度缓冲**（只要创建 context 时 `contextAttributes.depth` 没关掉），
   * 所以这里如实把深度附件报出去 —— 有了它，渲染通道的 `depthFormat` 才不是 `null`，
   * `resolveRenderState()` 才不会把 `DEPTH_TEST` 关掉（关掉之后画布渲染会退化成画家算法）。
   *
   * 深度附件是一张「虚拟深度纹理」：它没有 GL 对象，只表示「framebuffer 0 的深度缓冲」，
   * 渲染通道据此走 `beginDefaultFramebufferPass()` 并用 `gl.clear(DEPTH_BUFFER_BIT)` 清深度。
   */
  createPassDescriptor(options: CanvasPassOptions = {}): CanvasPassDescriptor {
    const frame = this.getCurrentFrameTarget();
    const colorAttachments: ColorAttachment[] = [
      {
        view: frame.view,
        loadOp: options.loadOp ?? 'clear',
        storeOp: options.storeOp ?? 'store',
        clearValue: options.clearValue,
      },
    ];
    return { colorAttachments, depthStencilAttachment: this.createDepthAttachment(options) };
  }

  dispose(): void {
    this._device = null;
  }

  /**
   * 默认帧缓冲的深度附件。
   *
   * `depthRequested === false`（调用方明确不要深度）或这次 context 根本没有深度缓冲时返回 `null` ——
   * 上层会据此如实关掉深度测试，而不是让它「看起来开着」。
   */
  private createDepthAttachment(options: CanvasPassOptions): DepthStencilAttachment | null {
    if (this.depthRequested === false || this.depthBits === 0) return null;
    const texture = new DefaultFramebufferTexture(
      this._width,
      this._height,
      CANVAS_DEPTH_FORMAT,
      1,
      TextureUsage.RenderAttachment,
      'canvas:defaultFramebufferDepth',
      'depth-only',
    );
    return {
      view: texture.createView({ label: `${texture.label}:view` }),
      depthLoadOp: options.depthLoadOp ?? 'clear',
      depthStoreOp: options.depthStoreOp ?? 'store',
      depthClearValue: options.depthClearValue ?? 1,
    };
  }

  private applyBackingSize(): void {
    // 给 canvas 设置绘图缓冲尺寸会改变 drawingBufferWidth/Height，
    // 也会让默认帧缓冲的内容失效 —— 状态缓存必须作废。
    this.canvas.width = this._width;
    this.canvas.height = this._height;
    this._device?.invalidateState();
  }
}
