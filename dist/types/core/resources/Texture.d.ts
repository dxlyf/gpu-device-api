/** GPU texture 资源。对应 WebGPU 的 `GPUTexture`。 */
import type { Disposable } from '../../utils/Disposable.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import { TextureUsage } from '../enums/TextureUsage.js';
import type { Extent3D } from '../../types/internal.js';
import type { TextureView, TextureViewDescriptor } from './TextureView.js';
export declare const TextureDimension: {
    readonly D1: "1d";
    readonly D2: "2d";
    readonly D3: "3d";
};
export type TextureDimension = (typeof TextureDimension)[keyof typeof TextureDimension];
/** texture 尺寸：单个数字表示正方形的 2D texture。 */
export type TextureSize = number | {
    width: number;
    height?: number;
    depthOrArrayLayers?: number;
};
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
export declare function resolveTextureSize(size: TextureSize): Extent3D;
/** 覆盖最大维度所需的 mip 层级数。 */
export declare function fullMipLevelCount(size: TextureSize): number;
/** 只上传一次并被采样的 texture 的默认 usage。 */
export declare function defaultTextureUsage(extra?: TextureUsage): TextureUsage;
//# sourceMappingURL=Texture.d.ts.map