/** GPU texture 资源。对应 WebGPU 的 `GPUTexture`。 */

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

/** texture 尺寸：单个数字表示正方形的 2D texture。 */
export type TextureSize = number | { width: number; height?: number; depthOrArrayLayers?: number };

export interface TextureDescriptor {
  label?: string;
  size: TextureSize;
  /** 默认为 1。 */
  mipLevelCount?: number;
  /** MSAA 采样数；`sampleCount > 1` 的 texture 不能被采样。默认为 1。 */
  sampleCount?: number;
  /** 默认为 `'2d'`。 */
  dimension?: TextureDimension;
  format: TextureFormat;
  usage: TextureUsage;
  /** 额外的 view 格式（例如为非 srgb texture 创建 `srgb` view）。 */
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
  /** 原生句柄：WebGPU 上是 `GPUTexture`，WebGL2 上是 `WebGLTexture`。 */
  readonly native: unknown;
  /** 以 {@link Extent3D} 表示的尺寸。 */
  readonly size: Extent3D;

  /** 按给定的 subresource 选择创建（并缓存）一个 view。 */
  createView(descriptor?: TextureViewDescriptor): TextureView;
  /** 目前已创建的 view；随 texture 一同释放。 */
  readonly views: readonly TextureView[];

  destroy(): void;
}

/** 归一化可接受的尺寸写法。 */
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

/** 覆盖最大维度所需的 mip 层级数。 */
export function fullMipLevelCount(size: TextureSize): number {
  const extent = resolveTextureSize(size);
  return Math.floor(Math.log2(Math.max(extent.width, extent.height, extent.depthOrArrayLayers))) + 1;
}

/** 只上传一次并被采样的 texture 的默认 usage。 */
export function defaultTextureUsage(extra: TextureUsage = 0): TextureUsage {
  return TextureUsage.CopyDst | TextureUsage.TextureBinding | extra;
}
