/** A view onto a sub-range of a texture. Mirrors WebGPU's `GPUTextureView`. */

import type { Disposable } from '../../utils/Disposable.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { Texture } from './Texture.js';

export type TextureViewDimension =
  | '1d'
  | '2d'
  | '2d-array'
  | 'cube'
  | 'cube-array'
  | '3d';

export type TextureAspect = 'all' | 'depth-only' | 'stencil-only';

export interface TextureViewDescriptor {
  label?: string;
  /** Reinterpretation format; must be listed in the texture's `viewFormats`. */
  format?: TextureFormat;
  /** Defaults to the texture's dimension. */
  dimension?: TextureViewDimension;
  baseMipLevel?: number;
  mipLevelCount?: number;
  baseArrayLayer?: number;
  arrayLayerCount?: number;
  aspect?: TextureAspect;
}

export interface TextureView extends Disposable {
  readonly label: string;
  readonly texture: Texture;
  readonly descriptor: Required<Omit<TextureViewDescriptor, 'label' | 'format'>> & { format?: TextureFormat };
  /** Native handle: `GPUTextureView` on WebGPU; on WebGL2 the texture itself. */
  readonly native: unknown;
}

/** Fills in WebGPU's defaults for a view descriptor. */
export function resolveTextureViewDescriptor(
  texture: Texture,
  descriptor: TextureViewDescriptor = {},
): TextureView['descriptor'] {
  const dimension: TextureViewDimension =
    descriptor.dimension ??
    (texture.dimension === '1d'
      ? '1d'
      : texture.dimension === '3d'
        ? '3d'
        : texture.depthOrArrayLayers > 1
          ? '2d-array'
          : '2d');
  return {
    format: descriptor.format,
    dimension,
    baseMipLevel: descriptor.baseMipLevel ?? 0,
    mipLevelCount: descriptor.mipLevelCount ?? texture.mipLevelCount,
    baseArrayLayer: descriptor.baseArrayLayer ?? 0,
    arrayLayerCount: descriptor.arrayLayerCount ?? texture.depthOrArrayLayers,
    aspect: descriptor.aspect ?? 'all',
  };
}
