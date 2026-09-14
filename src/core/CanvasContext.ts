/**
 * swap chain 表面。
 *
 * WebGPU 需要先把 canvas context 配置到某个 device 上，然后才能获取帧纹理；
 * WebGL2 则有一个隐式的默认帧缓冲。两者都隐藏在这个接口之后，
 * 因此 `RenderPassEncoder` 只会看到 {@link FrameTarget}。
 */

import type { Device } from './Device.js';
import type { Texture } from './resources/Texture.js';
import type { TextureView } from './resources/TextureView.js';
import type { TextureFormat } from './enums/TextureFormat.js';
import type { TextureUsage } from './enums/TextureUsage.js';
import type { LoadOp } from './enums/LoadOp.js';
import type { StoreOp } from './enums/StoreOp.js';
import type { Color, ColorAttachment, DepthStencilAttachment } from './render/RenderTarget.js';

export type CanvasAlphaMode = 'opaque' | 'premultiplied';
export type CanvasColorSpace = 'srgb' | 'display-p3';

/** 画布深度的默认格式；两个后端都用它（WebGL2 的默认帧缓冲深度不接受格式参数，这里只用于状态解析）。 */
export const CANVAS_DEPTH_FORMAT: TextureFormat = 'depth24plus';

export interface CanvasConfig {
  device: Device;
  /** 首选的 back buffer 格式；默认使用后端偏好的格式。 */
  format?: TextureFormat;
  alphaMode?: CanvasAlphaMode;
  colorSpace?: CanvasColorSpace;
  /** back buffer 纹理的额外 usage（例如用于截图的 `CopySrc`）。 */
  usage?: TextureUsage;
  /** back buffer 的 MSAA 采样数。默认为设备的 `defaultSampleCount`。 */
  sampleCount?: number;
  /**
   * 画布帧目标是否需要深度附件。默认 `true`。
   *
   * - WebGPU：canvas 纹理本身**没有**深度附件，后端据此为画布路径创建/复用一张同尺寸的
   *   `depth24plus` texture（尺寸变化时重建），作为渲染通道的 `depthStencilAttachment`；
   *   `false` 表示渲染通道不带深度附件（此时深度测试会被如实关掉）。
   * - WebGL2：默认帧缓冲的深度缓冲由创建 context 时的 `contextAttributes.depth` 决定，
   *   `configure()` 改不了它。这里显式要求 `depth: true`、但该默认帧缓冲确实没有深度缓冲时
   *   会抛 `ValidationError` —— 与其让深度测试悄悄失效，不如早报错。
   */
  depth?: boolean;
}

/** {@link CanvasContext.createPassDescriptor} 的选项；字段与 `RenderTarget.createPassDescriptor()` 对齐。 */
export interface CanvasPassOptions {
  loadOp?: LoadOp;
  storeOp?: StoreOp;
  clearValue?: Color;
  depthLoadOp?: LoadOp;
  depthStoreOp?: StoreOp;
  depthClearValue?: number;
}

/**
 * 画布路径的附件列表，与 `RenderTarget.createPassDescriptor()` **同一形状**。
 *
 * 这样上层（例如 `gfx` 的 `Renderer`）可以用同一段代码处理「画到离屏目标」与「画到 canvas」，
 * 不会因为两条路径的附件来源不同而让某一边悄悄少掉深度附件。
 */
export interface CanvasPassDescriptor {
  readonly colorAttachments: readonly ColorAttachment[];
  readonly depthStencilAttachment: DepthStencilAttachment | null;
}

export interface FrameTarget {
  readonly texture: Texture;
  readonly view: TextureView;
  /** 以设备像素为单位的尺寸。 */
  readonly width: number;
  readonly height: number;
  readonly format: TextureFormat;
  /**
   * 当该 target 是 canvas back buffer 时为 true。后端据此判断
   * 是否需要在帧结束时提交呈现。
   */
  readonly isDefaultFramebuffer: boolean;
}

export interface CanvasContext {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  /** back buffer 宽度，以设备像素为单位。 */
  readonly width: number;
  /** back buffer 高度，以设备像素为单位。 */
  readonly height: number;
  /** CSS 像素与设备像素之间的比例。 */
  readonly pixelRatio: number;
  readonly format: TextureFormat;
  readonly configured: boolean;
  readonly device: Device | null;

  configure(config: CanvasConfig): void;
  unconfigure(): void;

  /** 以 CSS 像素设置画布尺寸（内部会乘以 pixel ratio）。 */
  setSize(width: number, height: number, updateStyle?: boolean): void;
  setPixelRatio(ratio: number): void;
  /** 重新读取元素尺寸；当 back buffer 发生变化时返回 true。 */
  resize(updateStyle?: boolean): boolean;

  /** 获取当前帧纹理。仅在帧的开始与结束之间有效。 */
  getCurrentFrameTarget(): FrameTarget;

  /**
   * 为「画到 canvas」这一次渲染通道生成附件列表。
   *
   * 两个后端的差别在这里被抹平：WebGPU 的 canvas 纹理没有深度附件，所以后端会为它创建并
   * 复用一张同尺寸的深度 texture；WebGL2 的默认帧缓冲自带深度缓冲，后端用一张「虚拟深度纹理」
   * 如实汇报（没有深度缓冲时返回 `null`）。配置了 MSAA 时，`colorAttachments[0].view` 是多重采样
   * view，canvas 纹理作为 `resolveTarget` —— 因此调用方必须直接使用返回的 attachment 列表，
   * 不要只取 `view` 再自己拼一个 attachment，否则会丢掉 resolve 与深度。
   */
  createPassDescriptor(options?: CanvasPassOptions): CanvasPassDescriptor;

  dispose(): void;
}

/** 读取 canvas 元素的 CSS 尺寸，读取不到时回退到其属性尺寸。 */
export function measureCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): { width: number; height: number } {
  const element = canvas as HTMLCanvasElement;
  if (typeof element.clientWidth === 'number' && typeof element.clientHeight === 'number') {
    return { width: element.clientWidth || element.width || 1, height: element.clientHeight || element.height || 1 };
  }
  return { width: canvas.width || 1, height: canvas.height || 1 };
}

/** `devicePixelRatio`，会被限制在合理范围内；在浏览器之外返回 1。 */
export function defaultPixelRatio(): number {
  const ratio = typeof globalThis !== 'undefined' ? (globalThis as { devicePixelRatio?: number }).devicePixelRatio : 1;
  return ratio && ratio > 0 ? Math.min(ratio, 4) : 1;
}
