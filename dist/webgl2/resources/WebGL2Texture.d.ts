/**
 * WebGL2 纹理资源。
 *
 * 用不可变的 `texStorage2D` / `texStorage3D` 一次性分配存储，后续只用 `texSubImage2D` 上传内容。
 * 相比 `texImage2D` 每次都可能重新分配，这个组合在 WebGL2 上更快，也更接近 WebGPU
 * 「先创建不可变纹理、再 copy 数据进去」的模型。
 *
 * WebGL2 没有 texture view 对象，`createView()` 返回的是**记录子资源范围**的轻量包装，
 * 真正的 GL 纹理句柄还是同一个。
 *
 * **本后端的纹理行序（与 WebGPU 对齐的那一部分，以及没对齐的那一处）**
 *
 * - 上传：`gl.texSubImage2D` 把主机数据的第 0 行写进纹素第 0 行，**不翻**（本后端的
 *   `writeTexture` 从不设置 `UNPACK_FLIP_Y_WEBGL`；只有 `copyExternalImageToTexture` 会按它的
 *   `flipY` 参数设置它）。所以「数据第 0 行 = 纹素第 0 行 = `v = 0`」与 WebGPU 完全一致。
 * - 图像来源：`copyExternalImageToTexture` 显式设置 `UNPACK_FLIP_Y_WEBGL`，语义与 WebGPU 的
 *   `flipY` 选项一致（默认都关）。
 * - **渲染目标（未对齐）**：GL 的窗口原点在左下角，附着到 FBO 上的纹理因此是**自下而上**存的 ——
 *   纹素第 0 行是画面底端。WebGPU 的附件纹素 (0, 0) 在左上角。于是同一个渲染结果，
 *   WebGL2 读回 / 采样出来的行序与 WebGPU 相反。
 *   修法只能落在渲染路径（按目标类型把 Y 翻过来，例如给非默认帧缓冲注入 `gl_Position.y` 取反的
 *   顶点着色器变体或等价手段 —— WebGL2 不允许负高度的 `gl.viewport`），纹理资源这一层无能为力。
 */
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import { TextureDimension, type Texture, type TextureDescriptor } from '../../core/resources/Texture.js';
import type { Extent3D } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import { WebGL2TextureView } from './WebGL2TextureView.js';
import type { TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';
/** core 的维度映射到 GL 的纹理目标。 */
export declare function glTextureTarget(dimension: TextureDimension, depthOrArrayLayers: number): number;
export declare class WebGL2Texture implements Texture {
    readonly label: string;
    readonly dimension: TextureDimension;
    readonly format: Texture['format'];
    readonly usage: TextureUsage;
    readonly width: number;
    readonly height: number;
    readonly depthOrArrayLayers: number;
    readonly mipLevelCount: number;
    readonly sampleCount: number;
    readonly native: WebGLTexture;
    private readonly gl;
    private readonly state;
    private readonly glTarget;
    private readonly onDestroy;
    /** 已创建的 view；随纹理一起失效。 */
    readonly views: WebGL2TextureView[];
    private _disposed;
    constructor(gl: WebGL2RenderingContext, state: GlStateCache, descriptor: TextureDescriptor, onDestroy: (texture: WebGL2Texture) => void);
    get size(): Extent3D;
    get disposed(): boolean;
    /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
    get target(): number;
    createView(descriptor?: TextureViewDescriptor): TextureView;
    /**
     * 用 GL 内置的 `generateMipmap` 生成 mip 链（第 1 级到第 `mipLevelCount - 1` 级）。
     *
     * 前提条件（不满足就抛 {@link ValidationError}，不做静默降级）：
     * - 单采样（多重采样纹理没有 mip 链）；
     * - `mipLevelCount > 1`（否则没有任何级别可生成）；
     * - 格式必须是「color-renderable 且可过滤」的 unorm / 浮点格式：`generateMipmap` 内部
     *   就是一次带滤波的降采样，整数格式（`*uint` / `*sint`）、snorm 与纯深度 / 模板格式在
     *   GL 里都不满足这个条件，硬调用只会在 `getError()` 里留下一条很难定位的
     *   `INVALID_OPERATION`。32 位浮点格式还需要 `EXT_color_buffer_float` 才是 color-renderable。
     *
     * **颜色空间（这里最容易写错）**：格式是 `rgba8unorm-srgb` 时，GL 会把纹素**先解码到线性
     * 空间**、在线性空间做盒式滤波，再把结果编码回 sRGB 写进各级 mip。这是唯一正确的做法：
     * 直接对 sRGB 编码字节求平均会系统性偏暗 —— 黑白棋盘的第 1 级，线性平均得到 sRGB 188，
     * 而对编码字节求平均只有 128。实测对比见 `examples/core-texture-mipmap.ts`。
     *
     * 调用后会 `invalidate()` 整个状态缓存：为了生成 mip 必须把这张纹理绑到当前活动单元，
     * 而状态缓存并不知道「当前活动单元」是哪一个，与其猜错不如整体作废。
     * 这是加载期的一次性操作，代价可以接受。
     */
    generateMipmaps(): void;
    destroy(): void;
    dispose(): void;
    /**
     * 给纹理对象本身设置一套默认采样参数。
     *
     * 取值刻意与 **WebGPU 的默认值**一致（`nearest` + `clamp-to-edge`），这样即使使用者忘记
     * 提供 Sampler，两个后端的观感也相同。WebGL2 的 GL 默认值（`LINEAR_MIPMAP_LINEAR` +
     * `REPEAT`）反而会与 WebGPU 不一致。
     */
    private applyDefaultSamplerParameters;
}
//# sourceMappingURL=WebGL2Texture.d.ts.map