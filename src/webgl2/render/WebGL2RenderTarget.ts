/**
 * WebGL2 的渲染目标：一个 framebuffer object（FBO）加上它的附件纹理。
 *
 * 与 WebGPU 不同的是，WebGL2 **不支持多重采样的离屏纹理附件**（多重采样只能渲染到 renderbuffer，
 * 且无法 resolve 成纹理）。所以离屏目标一律 `sampleCount = 1`，抗锯齿只能靠：
 * - 默认帧缓冲（canvas 的 `antialias: true`，由浏览器做 MSAA）；
 * - 或后处理式的 FXAA / 超采样。
 * 这里选择如实报错，而不是假装支持，避免使用者以为自己拿到了 MSAA 的离屏目标。
 *
 * 清屏用 WebGL2 的 `clearBufferfv` / `clearBufferfi`，它们可以**按附件下标**清除，
 * 天然支持多颜色附件，不需要来回切 `drawBuffers`。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import { nextId } from '../../utils/id.js';
import { glFormat } from '../utils/glFormatMap.js';
import { resolveClearColor } from '../utils/glEnumMap.js';
import { asWebGL2TextureView } from '../cast.js';
import type {
  Color,
  ColorAttachment,
  DepthStencilAttachment,
  RenderTarget,
  RenderTargetDescriptor,
} from '../../core/render/RenderTarget.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { LoadOp } from '../../core/enums/LoadOp.js';
import type { StoreOp } from '../../core/enums/StoreOp.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';
import type { WebGL2TextureView } from '../resources/WebGL2TextureView.js';

export interface WebGL2RenderTargetOptions {
  gl: WebGL2RenderingContext;
  state: GlStateCache;
  createTexture: (
    format: TextureFormat,
    width: number,
    height: number,
    usage: TextureUsage,
    label: string,
  ) => WebGL2Texture;
}

/** 清屏参数。 */
export interface RenderTargetClearOptions {
  clearColor?: Color;
  clearDepth?: number;
  clearStencil?: number;
  /** 为 `'load'` 时保留颜色附件原内容。 */
  loadOp?: LoadOp;
  depthLoadOp?: LoadOp;
}

export class WebGL2RenderTarget implements RenderTarget {
  readonly label: string;
  readonly colorFormats: readonly TextureFormat[];
  readonly depthFormat: TextureFormat | null;
  readonly sampleCount = 1;
  readonly mipLevelCount: number;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly options: WebGL2RenderTargetOptions;
  private readonly framebuffer: WebGLFramebuffer;
  private colorTextures: WebGL2Texture[];
  private depthTexture: WebGL2Texture | null;
  private colorViews: WebGL2TextureView[] = [];
  private depthView: WebGL2TextureView | null = null;
  private _width: number;
  private _height: number;
  private _disposed = false;

  constructor(descriptor: RenderTargetDescriptor, options: WebGL2RenderTargetOptions) {
    if ((descriptor.sampleCount ?? 1) > 1) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 后端不支持多重采样的离屏渲染目标（GL 的多重采样只能渲染到 renderbuffer，无法 resolve 成纹理）。\n' +
          '请把 sampleCount 设为 1，并改用默认帧缓冲的 antialias，或加一层 FXAA / 超采样后处理。',
      );
    }

    const width = descriptor.width ?? options.gl.drawingBufferWidth;
    const height = descriptor.height ?? options.gl.drawingBufferHeight;
    if (width <= 0 || height <= 0) {
      throw new ValidationError(
        `[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${width}x${height}。` +
          '未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。',
      );
    }

    this.gl = options.gl;
    this.state = options.state;
    this.options = options;
    this.label = descriptor.label ?? nextId('renderTarget');
    this._width = width;
    this._height = height;
    this.mipLevelCount = descriptor.mipLevelCount ?? 1;

    const colorFormats = normalizeColorFormats(descriptor.color);
    if (colorFormats.length > 4) {
      throw new ValidationError(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${colorFormats.length} 个。`,
      );
    }
    for (const format of colorFormats) {
      if (!glFormat(format).attachment) {
        throw new ValidationError(
          `[gpu-device-api] 纹理格式「${format}」在 WebGL2 下不能作为颜色附件。`,
        );
      }
    }
    this.colorFormats = colorFormats;

    const depthFormat = normalizeDepthFormat(descriptor.depth);
    if (depthFormat !== null && !glFormat(depthFormat).depth) {
      throw new ValidationError(`[gpu-device-api] 深度附件格式「${depthFormat}」不是深度格式。`);
    }
    this.depthFormat = depthFormat;

    const framebuffer = options.gl.createFramebuffer();
    if (!framebuffer) {
      throw new ValidationError('[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。');
    }
    this.framebuffer = framebuffer;

    this.colorTextures = [];
    this.depthTexture = null;
    this.createAttachments(descriptor.usage ?? 0);
    this.attach();
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get colorFormat(): TextureFormat {
    return this.colorFormats[0]!;
  }

  get colors(): readonly WebGL2Texture[] {
    return this.colorTextures;
  }

  get depth(): WebGL2Texture | null {
    return this.depthTexture;
  }

  /** GL 的 framebuffer 对象。 */
  get native(): WebGLFramebuffer {
    return this.framebuffer;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get colorAttachments(): readonly ColorAttachment[] {
    return this.colorViews.map((view) => ({
      view,
      loadOp: 'clear' as LoadOp,
      storeOp: 'store' as StoreOp,
    }));
  }

  get depthStencilAttachment(): DepthStencilAttachment | null {
    if (!this.depthView) return null;
    return {
      view: this.depthView,
      depthLoadOp: 'clear' as LoadOp,
      depthStoreOp: 'store' as StoreOp,
      depthClearValue: 1,
    };
  }

  createPassDescriptor(
    options: {
      loadOp?: LoadOp;
      storeOp?: StoreOp;
      clearValue?: Color;
      depthLoadOp?: LoadOp;
      depthClearValue?: number;
    } = {},
  ): { colorAttachments: readonly ColorAttachment[]; depthStencilAttachment: DepthStencilAttachment | null } {
    const colorAttachments = this.colorViews.map((view) => ({
      view,
      loadOp: options.loadOp ?? ('clear' as LoadOp),
      storeOp: options.storeOp ?? ('store' as StoreOp),
      clearValue: options.clearValue,
    }));
    const depthStencilAttachment = this.depthView
      ? {
          view: this.depthView,
          depthLoadOp: options.depthLoadOp ?? ('clear' as LoadOp),
          depthStoreOp: 'store' as StoreOp,
          depthClearValue: options.depthClearValue ?? 1,
        }
      : null;
    return { colorAttachments, depthStencilAttachment };
  }

  /**
   * 绑定 framebuffer 并按需清屏。渲染通道开始绘制前调用。
   *
   * 清屏时临时关闭 `SCISSOR_TEST`：GL 的 `clearBuffer*` 会受裁剪框影响，
   * 而这里的语义应该是「清整个附件」。
   *
   * 完整性（`checkFramebufferStatus`）不在这里查：附件只在构造与 resize() 时变，
   * 所以 {@link attach} 里已经查过了。原来每个渲染通道都做一次同步查询是白付的。
   */
  bind(clear: RenderTargetClearOptions = {}): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    const needsClear = clear.loadOp !== 'load' || (this.depthTexture !== null && clear.depthLoadOp !== 'load');
    if (needsClear) {
      this.state.setScissor(false, 0, 0, this._width, this._height);
      if (clear.loadOp !== 'load') {
        const [r, g, b, a] = resolveClearColor(clear.clearColor);
        const values = new Float32Array([r, g, b, a]);
        for (let index = 0; index < this.colorTextures.length; index++) {
          gl.clearBufferfv(gl.COLOR, index, values);
        }
      }
      if (this.depthTexture && clear.depthLoadOp !== 'load') {
        const format = glFormat(this.depthFormat!);
        // `depthMask` 必须临时打开，否则清深度会被静默忽略。
        gl.depthMask(true);
        if (format.stencil) {
          gl.clearBufferfi(gl.DEPTH_STENCIL, 0, clear.clearDepth ?? 1, clear.clearStencil ?? 0);
        } else {
          gl.clearBufferfv(gl.DEPTH, 0, new Float32Array([clear.clearDepth ?? 1]));
        }
        this.state.invalidate();
      }
    }

    gl.viewport(0, 0, this._width, this._height);
    this.state.setViewport(0, 0, this._width, this._height);
  }

  resize(width: number, height: number): boolean {
    if (width === this._width && height === this._height) return false;
    if (width <= 0 || height <= 0) {
      throw new ValidationError(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${width}x${height}。`);
    }
    this._width = width;
    this._height = height;

    // 纹理用的是不可变存储，改尺寸只能重建。
    for (const texture of this.colorTextures) texture.destroy();
    this.depthTexture?.destroy();
    this.colorTextures = [];
    this.depthTexture = null;

    this.createAttachments(0);
    this.attach();
    return true;
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const texture of this.colorTextures) texture.destroy();
    this.depthTexture?.destroy();
    this.colorTextures = [];
    this.depthTexture = null;
    this.colorViews = [];
    this.depthView = null;
    this.gl.deleteFramebuffer(this.framebuffer);
  }

  dispose(): void {
    this.destroy();
  }

  /** 取某个颜色附件的 view（后处理、调试读回时用）。 */
  colorView(index = 0): WebGL2TextureView {
    const view = this.colorViews[index];
    if (!view) {
      throw new ValidationError(
        `[gpu-device-api] 渲染目标「${this.label}」没有第 ${index} 个颜色附件（共 ${this.colorViews.length} 个）。`,
      );
    }
    return view;
  }

  /** 深度附件的 view；没有深度附件时抛错。 */
  depthStencilView(): WebGL2TextureView {
    if (!this.depthView) {
      throw new ValidationError(`[gpu-device-api] 渲染目标「${this.label}」没有深度附件。`);
    }
    return this.depthView;
  }

  private createAttachments(extraUsage: number): void {
    const colorUsage =
      TextureUsage.RenderAttachment | TextureUsage.TextureBinding | TextureUsage.CopySrc | extraUsage;
    this.colorTextures = this.colorFormats.map((format, index) =>
      this.options.createTexture(format, this._width, this._height, colorUsage, `${this.label}:color${index}`),
    );
    this.depthTexture =
      this.depthFormat === null
        ? null
        : this.options.createTexture(
            this.depthFormat,
            this._width,
            this._height,
            TextureUsage.RenderAttachment | TextureUsage.TextureBinding,
            `${this.label}:depth`,
          );
    this.colorViews = this.colorTextures.map((texture) => asWebGL2TextureView(texture.createView()));
    this.depthView = this.depthTexture ? asWebGL2TextureView(this.depthTexture.createView()) : null;
  }

  private attach(): void {
    const gl = this.gl;
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.colorTextures.forEach((texture, index) => {
      const attachment = gl.COLOR_ATTACHMENT0 + index;
      if (texture.dimension === '3d' || texture.depthOrArrayLayers > 1) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, texture.native, 0, 0);
      } else {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.native, 0);
      }
    });
    gl.drawBuffers(this.colorTextures.map((_texture, index) => gl.COLOR_ATTACHMENT0 + index));

    if (this.depthTexture) {
      const format = glFormat(this.depthFormat!);
      const attachment = format.stencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, this.depthTexture.native, 0);
    } else {
      // 没有深度附件时必须显式解绑，否则 framebuffer 里可能残留上一次的附件。
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.TEXTURE_2D, null, 0);
    }

    // 完整性只取决于附件组合与尺寸，而这两者只在构造 / resize() 时改（即只经过这里），
    // 所以在这里查一次就够 —— 原来的 bind() 每个渲染通道都要做一次同步的 checkFramebufferStatus。
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    // framebuffer 的绑定没有被状态缓存跟踪，这里作废缓存以免 drawBuffers 等状态判断失准。
    this.state.invalidate();

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new ValidationError(
        `[gpu-device-api] 渲染目标「${this.label}」的 framebuffer 不完整（格式组合在 WebGL2 下不受支持）。` +
          `颜色附件：${this.colorFormats.join('、')}；深度附件：${this.depthFormat ?? '无'}。` +
          `GL 状态码：0x${status.toString(16)}。`,
      );
    }
  }
}

function normalizeColorFormats(color: RenderTargetDescriptor['color']): TextureFormat[] {
  if (color === undefined) return ['rgba8unorm'];
  if (typeof color === 'string') return [color];
  const list = [...color];
  if (list.length === 0) {
    throw new ValidationError('[gpu-device-api] 渲染目标的 color 数组不能为空。');
  }
  return list;
}

function normalizeDepthFormat(depth: RenderTargetDescriptor['depth']): TextureFormat | null {
  if (depth === undefined || depth === null || depth === false) return null;
  if (depth === true) return 'depth24plus';
  return depth;
}