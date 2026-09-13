/** GPU texture resource. Mirrors WebGPU's `GPUTexture`. */

import type { Disposable } from '../../utils/Disposable.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import { TextureUsage } from '../enums/TextureUsage.js';
import type { Extent3D } from '../../types/internal.js';
import type { TextureView, TextureViewDescriptor } from './TextureView.js';

export const TextureDimension = {
  D1: '1d',
  D2: '2d',
  D3: '3d',
} as const;

export type TextureDimension = (typeof TextureDimension)[keyof typeof TextureDimension];

/** Texture size: a single number means a square 2D texture. */
export type TextureSize = number | { width: number; height?: number; depthOrArrayLayers?: number };

export interface TextureDescriptor {
  label?: string;
  size: TextureSize;
  /** Defaults to 1. */
  mipLevelCount?: number;
  /** MSAA sample count; textures with `sampleCount > 1` cannot be sampled. Defaults to 1. */
  sampleCount?: number;
  /** Defaults to `'2d'`. */
  dimension?: TextureDimension;
  format: TextureFormat;
  usage: TextureUsage;
  /** Additional view formats (e.g. `srgb` views of a non-srgb texture). */
  viewFormats?: readonly TextureFormat[];
}

export interface Texture extends Disposable {
  readonly label: string;
  readonly dimension: TextureDimension;
  readonly format: TextureFormat;
  readonly usage: TextureUsage;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  /** Native handle: `GPUTexture` on WebGPU, `WebGLTexture` on WebGL2. */
  readonly native: unknown;
  /** The size as an {@link Extent3D}. */
  readonly size: Extent3D;

  /** Creates (and caches) a view with the given subresource selection. */
  createView(descriptor?: TextureViewDescriptor): TextureView;
  /** Views created so far; released together with the texture. */
  readonly views: readonly TextureView[];

  destroy(): void;
}

/** Normalizes the accepted size forms. */
export function resolveTextureSize(size: TextureSize): Extent3D {
  if (typeof size === 'number') {
    return { width: size, height: size, depthOrArrayLayers: 1 };
  }
  return {
    width: size.width,
    height: size.height ?? 1,
    depthOrArrayLayers: size.depthOrArrayLayers ?? 1,
  };
}

/** Number of mip levels needed to cover the largest dimension. */
export function fullMipLevelCount(size: TextureSize): number {
  const extent = resolveTextureSize(size);
  return Math.floor(Math.log2(Math.max(extent.width, extent.height, extent.depthOrArrayLayers))) + 1;
}

/** Default usage for a texture that is uploaded once and sampled. */
export function defaultTextureUsage(extra: TextureUsage = 0): TextureUsage {
  return TextureUsage.CopyDst | TextureUsage.TextureBinding | extra;
}
