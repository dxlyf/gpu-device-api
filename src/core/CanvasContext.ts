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

export type CanvasAlphaMode = 'opaque' | 'premultiplied';
export type CanvasColorSpace = 'srgb' | 'display-p3';

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
