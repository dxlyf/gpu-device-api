/**
 * GPU texture 资源。对应 WebGPU 的 `GPUTexture`。
 *
 * **纹理坐标与行序约定（两个后端必须一致，这是「换后端就能画」的前提）**
 *
 * - 纹理坐标 `v = 0` 对应纹素第 0 行，`v` 增大就是纹素行号增大；纹素 (0, 0) 在**左上角**。
 *   也就是说本库站在 **WebGPU 那一边**（`v = 0` 是图像顶部），而不是 GL 教科书里的「左下」。
 * - `Queue.writeTexture` / `CommandEncoder.copyBufferToTexture` **不翻转**：主机数据的第 0 行
 *   写进纹素第 0 行。WebGL2 的实现是 `texSubImage2D`（只设置 `UNPACK_ALIGNMENT` / `UNPACK_ROW_LENGTH`，
 *   从不设置 `UNPACK_FLIP_Y_WEBGL`），WebGPU 是原生 `writeTexture`，两边天然一致。
 * - `Queue.copyExternalImageToTexture(..., flipY)` 的 `flipY` 在两个后端语义相同：
 *   WebGL2 设 `UNPACK_FLIP_Y_WEBGL`，WebGPU 传原生 `flipY` 选项，默认都是 `false`。
 * - `CommandEncoder.copyTextureToBuffer` 的缓冲区第 0 行 = 纹素行 `origin.y`，两个后端一致
 *   （WebGL2 走 `gl.readPixels`，它就从 `origin.y` 起按纹素行序逐行读出，实现里不做任何翻转）。
 *
 * 这套约定对**上传过的**纹理已经两个后端一致（`examples/core-texture-mipmap.ts` 会把两级 mip
 * 的真实字节在两个后端上读回并逐纹素比对）。**唯一还没对齐的是「渲染进纹理」**：WebGL2 的渲染
 * 目标自下而上存储（GL 的窗口原点在左下），WebGPU 自上而下，于是同一个渲染结果的纹素行序在两个
 * 后端相反 —— 读回与采样都会上下颠倒。正解是在 WebGL2 的渲染路径里按目标类型翻转 Y（只翻渲染进
 * 纹理的那些 pass），在那之前，读回渲染结果的调用方必须自己按后端翻行序
 * （`examples/core-shared.ts` 的 `verifyOffscreen` 就是这么做的，并注明了修好后要删掉）。
 */

import type { Disposable } from '../../utils/Disposable.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import { TextureUsage } from '../enums/TextureUsage.js';
import { ValidationError } from '../errors/ValidationError.js';
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

  /**
   * 用 **GPU** 生成第 1 级到第 `mipLevelCount - 1` 级的 mip 链（第 0 级必须已经填好内容）。
   *
   * 两个后端的做法完全不同，但契约一致：
   *
   * - **WebGL2**：`gl.generateMipmap()` —— 核心功能，一次调用生成整条链。调用后如果要用到
   *   这些级别，采样器的 min filter 必须是 `*_MIPMAP_*` 组合（GL 在 min filter 不是 mipmap
   *   过滤时永远只取第 0 级）。gfx 便捷层会自动选对。
   * - **WebGPU**：**没有** `generateMipmap`，后端用 render pass 逐级把上一级降采样到下一级
   *   （见 `WebGPUTexture.generateMipmaps`）。因此 WebGPU 上的纹理必须带
   *   `TextureUsage.RenderAttachment`（并且格式可渲染、可过滤），否则抛
   *   {@link ValidationError} 并说明限制，而不是产出错误结果。
   *
   * 该成员是**可选**的：core 里还有 canvas 默认帧缓冲这类虚拟纹理，它们没有可写的 mip 链。
   * 后端确实实现了就一定存在；调用方取值后应先判空再调用。
   *
   * 生成是「提交到队列」的：本方法返回时 GPU 未必已经算完，但后续提交的命令一定看得到结果。
   */
  generateMipmaps?(): void;

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

/**
 * 第 `level` 级 mip 的尺寸。
 *
 * 每一维都**独立**减半并且下限为 1 —— 这两点都是规范要求，也是非 2 的幂 / 非正方形纹理
 * 最容易写错的地方：
 *
 * - `64x64` 的第 6 级是 `1x1`（第 6 级之后就不再有更小的级别，所以 64x64 一共 7 级）；
 * - `8x2` 的第 1 级是 `4x1`（高度先到 1，之后一直保持 1），一共 4 级；
 * - `60x36` 的第 1 级是 `30x18`，第 5 级是 `1x1`，一共 6 级。
 *
 * 深度 / 数组层数不参与减半。
 */
export function mipLevelExtent(size: TextureSize, level: number): Extent3D {
  if (!Number.isInteger(level) || level < 0) {
    throw new ValidationError(
      `[gpu-device-api] mipLevelExtent: level must be a non-negative integer, got ${String(level)}.`,
    );
  }
  const extent = resolveTextureSize(size);
  const shift = (value: number): number => Math.max(1, Math.trunc(value / 2 ** level));
  return {
    width: shift(extent.width),
    height: shift(extent.height),
    depthOrArrayLayers: extent.depthOrArrayLayers,
  };
}

/** 只上传一次并被采样的 texture 的默认 usage。 */
export function defaultTextureUsage(extra: TextureUsage = 0): TextureUsage {
  return TextureUsage.CopyDst | TextureUsage.TextureBinding | extra;
}
