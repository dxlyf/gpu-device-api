/**
 * WebGL2 的 texture view。
 *
 * WebGL2 没有 view 对象：同一个 `WebGLTexture` 句柄可以按不同 mip / 层范围去采样或作为附件。
 * 所以这里是个**轻量记录器** —— 保存子资源范围，`native` 直接返回底层 GL 纹理，
 * 真正用到范围的地方（framebuffer 附件、`texSubImage3D` 的 z 偏移）由调用方读取这些字段。
 */
import { type TextureSwizzleString, type TextureView, type TextureViewDescriptor } from '../../core/resources/TextureView.js';
import type { WebGL2Texture } from './WebGL2Texture.js';
export declare class WebGL2TextureView implements TextureView {
    readonly label: string;
    readonly texture: WebGL2Texture;
    readonly descriptor: TextureView['descriptor'];
    private _disposed;
    constructor(texture: WebGL2Texture, descriptor: TextureViewDescriptor);
    /** WebGL2 里 view 就是纹理本身，所以直接返回 GL 纹理句柄。 */
    get native(): WebGLTexture;
    /**
     * 实际生效的通道重排。
     *
     * WebGL2 上**唯一**能生效的值就是不重排（`'rgba'`）：构造函数已经拒绝了其它取值，
     * 所以这里恒为 `'rgba'`，与 WebGPU 后端的默认值一致。
     */
    get swizzle(): TextureSwizzleString;
    /** 底层 GL 纹理（与 `native` 相同，语义更明确）。 */
    get glTexture(): WebGLTexture;
    /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
    get target(): number;
    get disposed(): boolean;
    /** 纹理销毁时由纹理统一调用，避免 view 继续被使用。 */
    markDestroyed(): void;
    dispose(): void;
}
//# sourceMappingURL=WebGL2TextureView.d.ts.map