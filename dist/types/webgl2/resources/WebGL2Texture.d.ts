/**
 * WebGL2 纹理资源。
 *
 * 用不可变的 `texStorage2D` / `texStorage3D` 一次性分配存储，后续只用 `texSubImage2D` 上传内容。
 * 相比 `texImage2D` 每次都可能重新分配，这个组合在 WebGL2 上更快，也更接近 WebGPU
 * 「先创建不可变纹理、再 copy 数据进去」的模型。
 *
 * WebGL2 没有 texture view 对象，`createView()` 返回的是**记录子资源范围**的轻量包装，
 * 真正的 GL 纹理句柄还是同一个。
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
     * 使用 GL 内置的 `generateMipmap` 生成 mip 链。
     * 要求基础层已经填好内容，且纹理不是多重采样。
     *
     * 这里直接调用 `gl.bindTexture` 而不是走状态缓存 —— 因为不知道这张纹理此刻被绑在哪个单元上，
     * 与其猜测，不如改完之后把缓存整体作废（生成 mip 发生在加载阶段，代价可以忽略）。
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