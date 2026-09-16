/**
 * WebGPU 离屏 render target：color（可多个）+ 可选 depth/stencil 的 texture 集合。
 *
 * MSAA 的处理方式与 WebGPU 一致：`sampleCount > 1` 时每路 color 各建两张 texture ——
 * 一张多重采样 texture 作为真正的 attachment（`view`），一张单采样 texture 作为 resolve
 * 目标（`resolveTarget`）。`colors[i]` 返回的是**单采样那张**，因为那才是可以被采样/拷贝的结果；
 * 多重采样 texture 通过 `multisampleTextures` 暴露。
 *
 * `createPassDescriptor()` 负责把 `loadOp` / `storeOp` / `clearValue` 填成 WebGPU 需要的形态
 * （`GPURenderPassColorAttachment` 要求 loadOp、storeOp 必填），而 `colorAttachments` 属性给出
 * 一份「默认 clear + store」的现成列表，可直接丢给 `beginRenderPass`。
 */
import type { Color, ColorAttachment, DepthStencilAttachment, RenderTarget, RenderTargetDescriptor } from '../../core/render/RenderTarget.js';
import { RowOrder } from '../../core/render/RenderTarget.js';
import type { LoadOp } from '../../core/enums/LoadOp.js';
import type { StoreOp } from '../../core/enums/StoreOp.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { Texture } from '../../core/resources/Texture.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPURenderTarget implements RenderTarget {
    readonly label: string;
    private readonly device;
    private readonly colorFormatsList;
    private readonly depthFormatValue;
    private readonly sampleCountValue;
    private readonly mipLevelCountValue;
    private readonly baseUsage;
    private readonly sampled;
    private _width;
    private _height;
    private colorTextures;
    private colorViews;
    private multisampleTextureList;
    private multisampleViews;
    private depthTexture;
    private depthView;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor: RenderTargetDescriptor);
    get width(): number;
    get height(): number;
    get colorFormats(): readonly TextureFormat[];
    get colorFormat(): TextureFormat;
    get depthFormat(): TextureFormat | null;
    get sampleCount(): number;
    get mipLevelCount(): number;
    /**
     * WebGPU 的原生行序：附件纹素 (0, 0) 在**左上角**，与 `Texture.ts` 的纹理约定天然一致。
     *
     * 所以这个后端不需要任何补偿；这个只读属性存在的意义是让跨后端代码能按
     * `target.rowOrder` 判断，而不是写 `backend === 'webgl2'`。
     */
    readonly rowOrder: RowOrder;
    /** 单采样 color texture（MSAA 时是 resolve 目标）；索引 0 为主 texture。 */
    get colors(): readonly Texture[];
    /** MSAA 时真正的 attachment texture；`sampleCount === 1` 时为空数组。 */
    get multisampleTextures(): readonly Texture[];
    get depth(): Texture | null;
    /** 现成的 attachment 列表：默认 `clear` + `store`，可直接交给 `beginRenderPass`。 */
    get colorAttachments(): readonly ColorAttachment[];
    get depthStencilAttachment(): DepthStencilAttachment | null;
    get disposed(): boolean;
    /** 调整尺寸并重建 texture；尺寸不变时返回 false（不重建）。 */
    resize(width: number, height: number): boolean;
    /** 按给定的清除行为创建 render pass descriptor 的两份 attachment 列表。 */
    createPassDescriptor(options?: {
        loadOp?: LoadOp;
        storeOp?: StoreOp;
        clearValue?: Color;
        depthLoadOp?: LoadOp;
        depthClearValue?: number;
    }): {
        colorAttachments: readonly ColorAttachment[];
        depthStencilAttachment: DepthStencilAttachment | null;
    };
    /** 销毁全部 texture。幂等。 */
    destroy(): void;
    /** `Disposable` 的别名。 */
    dispose(): void;
    private rebuild;
    private releaseTextures;
    private buildAttachments;
    private buildDepthAttachment;
}
//# sourceMappingURL=WebGPURenderTarget.d.ts.map