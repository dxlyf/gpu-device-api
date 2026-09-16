/**
 * 纹理：把「图片 / 原始像素」变成可以直接绑定的 core 纹理 + 采样器。
 *
 * **两条创建路径**：
 *
 * - **同步** {@link GfxTexture.create}：数据已经在手上（原始像素、`ImageData`、canvas、
 *   `ImageBitmap`），或者愿意付一次 `getImageData()` 的同步解码代价（`HTMLImageElement` 等）；
 * - **异步** {@link GfxTexture.fromImage}：把解码交给 `createImageBitmap`，可以在主线程之外
 *   解码，直接吃 URL / `Blob` / `File`，并且能显式控制色彩空间转换与 alpha 预乘。
 *
 * **mipmap 一律交给后端在 GPU 上生成**（WebGL2 用 `gl.generateMipmap`，WebGPU 用 render pass
 * 逐级降采样），不再在 JS 里逐级做盒式滤波。原因：
 *
 * 1. JS 版本必须在主线程上把整条链跑完（2048×2048 意味着 22MB 的分配与约 560 万次像素运算），
 *    而后端版本只发一条命令、由 GPU 并行完成；
 * 2. JS 版本只能对**编码后的字节**求平均。对 `-srgb` 格式这是错的：正确的做法是解码到线性
 *    空间再平均（黑白棋盘的第 1 级，线性平均给出 sRGB 188，字节平均只有 128，肉眼可辨）；
 * 3. 后端版本不需要把每一级再回传主机内存，省掉一次完整的 CPU/GPU 往返。
 *
 * CPU 版本仍以 {@link buildMipChain} 导出：它现在是「对比基线 + 特殊场合的兜底」，
 * 不再被便捷层使用。实测差异见 `examples/core-texture-mipmap.ts`。
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
    /** 纹理格式，默认 `'rgba8unorm'`；支持的范围见 {@link GFX_UPLOAD_FORMATS}。 */
    format?: TextureFormat;
    /** 是否生成 mip 链。原始像素默认 `false`，图像来源默认 `true`。 */
    mipmaps?: boolean;
    magFilter?: FilterMode;
    minFilter?: FilterMode;
    wrap?: AddressMode;
    wrapS?: AddressMode;
    wrapT?: AddressMode;
    /** 图像来源默认需要翻转 Y（图像左上为原点，GL 纹理左下为原点）。 */
    flipY?: boolean;
}
/** 异步创建路径的描述：数据来自 URL / Blob / 图像来源，由 `createImageBitmap` 解码。 */
export interface AsyncTextureDesc extends Omit<TextureDesc, 'data'> {
    /** 图片来源：URL 字符串、`Blob` / `File`，或任何 `ImageBitmapSource`。 */
    source: string | ImageBitmapSource;
    /**
     * 传给 `createImageBitmap` 的选项。
     *
     * 默认值刻意是 `{ colorSpaceConversion: 'none', premultiplyAlpha: 'none' }`：
     * 上传进纹理的字节应当与源文件一致。若让浏览器做色彩空间转换，一张 sRGB 图片会先被转到
     * 显示色彩空间，再写进 `-srgb` 纹理时就等于被解码了两次（画面会明显发亮/发灰）；
     * 预乘 alpha 则是不可逆的信息损失。
     */
    imageOptions?: ImageBitmapOptions;
}
/** {@link GfxTexture.create} 能接受的格式列表（便于调用方与文档引用）。 */
export declare const GFX_UPLOAD_FORMATS: readonly TextureFormat[];
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
    /**
     * 同步创建纹理（含可选 mip 链，mip 由后端生成）。
     *
     * `data` 是原始像素时必须给出 `width` / `height`；是图像来源时尺寸从来源读取（图像还没
     * 加载完会抛错，需要等 `load` 事件）。图像来源会走一次 canvas + `getImageData()`，
     * 那是同步的、也只能拿到 sRGB 字节 —— 想要真正的异步解码请用 {@link GfxTexture.fromImage}。
     */
    static create(device: Device, desc: TextureDesc): GfxTexture;
    /**
     * 异步创建纹理：用 `createImageBitmap` 解码，再直接把它拷进纹理。
     *
     * 相比 {@link GfxTexture.create}：
     * - 解码发生在**主线程之外**（`createImageBitmap` 是异步的），不会卡住渲染循环；
     * - 直接接受 URL / `Blob` / `File`，不需要先构造 `HTMLImageElement` 再等 `load`；
     * - 可以控制色彩空间转换与 alpha 预乘（见 {@link AsyncTextureDesc.imageOptions}）；
     * - 4 通道格式走 `queue.copyExternalImageToTexture`，**不经过主机内存**，没有 `getImageData`
     *   那一次「GPU → CPU → GPU」的往返；只有 `r8unorm` / `rg8unorm` 因为需要通道重排才会
     *   退回 canvas 中转。
     *
     * 由本方法创建的 `ImageBitmap` 一定会在结束前 `close()`（包括抛错路径），不会泄漏；
     * 即便 `source` 本身就是 `ImageBitmap`，`createImageBitmap` 也会先复制一份，
     * 因此关闭的始终是本方法自己的对象，调用方手里的 bitmap 不受影响。
     */
    static fromImage(device: Device, desc: AsyncTextureDesc): Promise<GfxTexture>;
    /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
    static solid(device: Device, color: readonly [number, number, number, number]): GfxTexture;
    /**
     * 两条创建路径的公共部分：分配纹理 → 上传第 0 级 → 让后端生成 mip → 建采样器。
     *
     * 中途任何一步抛错都会把已经创建的纹理销毁掉，不让半成品留在设备上。
     */
    private static build;
    get disposed(): boolean;
    destroy(): void;
}
export declare function isImageSource(value: unknown): value is ImageSource;
interface DecodedPixels {
    data: Uint8Array;
    width: number;
    height: number;
}
export type { DecodedPixels };
/**
 * 2×2 盒式滤波生成完整 mip 链。奇数尺寸时对边缘取样做夹紧处理，避免越界。
 * 返回的数组第 0 项就是原始数据。
 *
 * **这是旧的 CPU 实现**，gfx 便捷层已经不再使用它（见文件头的说明）。保留导出有两个原因：
 * 一是需要「不依赖后端能力」的兜底路径时可以直接用；二是它是
 * `examples/core-texture-mipmap.ts` 里用来和新路径做像素对比的基线。
 *
 * 注意它对每个通道独立求平均，**不做任何颜色空间转换** —— 用它处理 `-srgb` 数据会偏暗，
 * 这正是不再默认使用它的原因之一。
 */
export declare function buildMipChain(data: Uint8Array, width: number, height: number): DecodedPixels[];
/** 供外部复用：把尺寸描述归一化（历史上从本模块导出，保留以兼容既有调用方）。 */
export { resolveTextureSize };
//# sourceMappingURL=Texture.d.ts.map