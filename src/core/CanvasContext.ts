/**
 * The swap chain surface.
 *
 * WebGPU requires a canvas context to be configured against a device before a frame texture can be
 * acquired; WebGL2 has an implicit default framebuffer. Both are hidden behind this interface so
 * that `RenderPassEncoder` only ever sees a {@link FrameTarget}.
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
  /** Preferred back buffer format; defaults to the backend's preferred format. */
  format?: TextureFormat;
  alphaMode?: CanvasAlphaMode;
  colorSpace?: CanvasColorSpace;
  /** Extra usages for the back buffer texture (e.g. `CopySrc` for screenshots). */
  usage?: TextureUsage;
  /** MSAA sample count for the back buffer. Defaults to the device's `defaultSampleCount`. */
  sampleCount?: number;
}

export interface FrameTarget {
  readonly texture: Texture;
  readonly view: TextureView;
  /** Size in device pixels. */
  readonly width: number;
  readonly height: number;
  readonly format: TextureFormat;
  /**
   * True when this target is the canvas back buffer. Backends use it to decide whether the frame
   * must be presented at the end of the frame.
   */
  readonly isDefaultFramebuffer: boolean;
}

export interface CanvasContext {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Back buffer width in device pixels. */
  readonly width: number;
  /** Back buffer height in device pixels. */
  readonly height: number;
  /** Ratio between CSS pixels and device pixels. */
  readonly pixelRatio: number;
  readonly format: TextureFormat;
  readonly configured: boolean;
  readonly device: Device | null;

  configure(config: CanvasConfig): void;
  unconfigure(): void;

  /** Sizes the canvas in CSS pixels (multiplied by the pixel ratio internally). */
  setSize(width: number, height: number, updateStyle?: boolean): void;
  setPixelRatio(ratio: number): void;
  /** Re-reads the element size; returns true when the back buffer changed. */
  resize(updateStyle?: boolean): boolean;

  /** Acquires the frame texture. Only valid between the start and end of a frame. */
  getCurrentFrameTarget(): FrameTarget;

  dispose(): void;
}

/** Reads the CSS size of a canvas element, falling back to its attribute size. */
export function measureCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): { width: number; height: number } {
  const element = canvas as HTMLCanvasElement;
  if (typeof element.clientWidth === 'number' && typeof element.clientHeight === 'number') {
    return { width: element.clientWidth || element.width || 1, height: element.clientHeight || element.height || 1 };
  }
  return { width: canvas.width || 1, height: canvas.height || 1 };
}

/** `devicePixelRatio`, clamped to a sane range, or 1 outside the browser. */
export function defaultPixelRatio(): number {
  const ratio = typeof globalThis !== 'undefined' ? (globalThis as { devicePixelRatio?: number }).devicePixelRatio : 1;
  return ratio && ratio > 0 ? Math.min(ratio, 4) : 1;
}
