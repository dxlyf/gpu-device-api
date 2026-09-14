/**
 * 纹理：把「图片 / 原始像素」变成可以直接绑定的 core 纹理 + 采样器。
 *
 * 两个后端对 mipmap 的支持不一样（WebGL2 有 `generateMipmap`，WebGPU 没有），
 * 所以这里统一在 **CPU 上生成 mip 链**，再逐级 `queue.writeTexture` 上传。
 * 这样两个后端的观感完全一致，代价是上传时多一点 CPU 开销 —— 对便捷层是合适的取舍。
 */
import { resolveTextureSize } from '../core/resources/Texture.js';
import type { Device } from '../core/Device.js';
import type { Sampler } from '../core/resources/Sampler.js';
import type { Texture } from '../core/resources/Texture.js';
import type { TextureView } from '../core/resources/TextureView.js';
import type { AddressMode } from '../core/enums/AddressMode.js';
import type { FilterMode } from '../core/enums/FilterMode.js';
import type { TextureFormat } from '../core/enums/TextureFormat.js';
/** 能被接受的图片来源。 */
export type ImageSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | ImageData | VideoFrame | HTMLVideoElement;
export interface TextureDesc {
    label?: string;
    /** 原始像素，或浏览器图像来源。 */
    data: ArrayBufferView | ImageSource;
    width?: number;
    height?: number;
    format?: TextureFormat;
    /** 是否生成 mip 链。原始像素默认 `false`（省一次 CPU 开销），图像来源默认 `true`。 */
    mipmaps?: boolean;
    magFilter?: FilterMode;
    minFilter?: FilterMode;
    wrap?: AddressMode;
    wrapS?: AddressMode;
    wrapT?: AddressMode;
    /** 图像来源默认需要翻转 Y（图像左上为原点，GL 纹理左下为原点）。 */
    flipY?: boolean;
}
/** 一个可绑定的纹理（core 纹理 + 视图 + 采样器）。 */
export declare class GfxTexture {
    readonly label: string;
    readonly texture: Texture;
    readonly view: TextureView;
    readonly sampler: Sampler;
    readonly width: number;
    readonly height: number;
    readonly format: TextureFormat;
    readonly mipLevelCount: number;
    /** 进程内唯一标识，用于构建 bind group 缓存键。 */
    readonly id: string;
    private _disposed;
    private constructor();
    /** 创建纹理（含可选 mip 链）。 */
    static create(device: Device, desc: TextureDesc): GfxTexture;
    /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
    static solid(device: Device, color: readonly [number, number, number, number]): GfxTexture;
    get disposed(): boolean;
    destroy(): void;
}
export declare function isImageSource(value: unknown): value is ImageSource;
interface DecodedPixels {
    data: Uint8Array;
    width: number;
    height: number;
}
/**
 * 2×2 盒式滤波生成完整 mip 链。奇数尺寸时对边缘取样做夹紧处理，避免越界。
 * 返回的数组第 0 项就是原始数据。
 */
export declare function buildMipChain(data: Uint8Array, width: number, height: number): DecodedPixels[];
/** 供外部复用：把尺寸描述归一化。 */
export { resolveTextureSize };
//# sourceMappingURL=Texture.d.ts.map