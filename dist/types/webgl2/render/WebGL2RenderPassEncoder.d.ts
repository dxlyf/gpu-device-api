/**
 * WebGL2 的渲染通道编码器。
 *
 * 这是「WebGPU 录制式 API」与「GL 立即模式」之间的桥。渲染通道在 WebGL2 上是**边录制边执行**的：
 * 每次 `draw()` 立刻下发 GL 调用。对绝大多数绘制流程来说两者结果一致，只有一处已知差异 ——
 * `Queue.writeBuffer` 的生效时机（详见 `core/sync/Queue.ts` 的文档）。
 *
 * 每个 draw 的固定流程：
 * 1. 解析管线在当前渲染目标形态下的状态（按变体缓存）；
 * 2. `useProgram` + 应用固定功能状态；
 * 3. 取得/创建 VAO（键里含顶点缓冲与索引缓冲，命中就跳过全部属性设置）；
 * 4. 按绑定计划把 bind group 落到 uniform block binding 点与纹理单元上；
 * 5. 下发 `drawArraysInstanced` / `drawElementsInstanced`。
 */
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { Color } from '../../core/render/RenderTarget.js';
import type { DrawDescriptor, DrawIndexedDescriptor, DrawIndirectDescriptor } from '../../core/render/DrawCommands.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { RenderPassDescriptor, RenderPassEncoder } from '../../core/render/RenderPassEncoder.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2BindGroup } from '../binding/WebGL2BindGroup.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGL2RenderPipeline } from '../pipeline/WebGL2RenderPipeline.js';
import type { FramebufferCache } from './framebuffer-cache.js';
export interface WebGL2RenderPassOptions {
    gl: WebGL2RenderingContext;
    state: GlStateCache;
    framebuffers: FramebufferCache;
    /** 默认帧缓冲的尺寸（未指定 target 时使用）。 */
    getDefaultSize: () => {
        width: number;
        height: number;
    };
    /** 每完成一次绘制回调一次，用于统计。 */
    onDraw?: () => void;
}
export declare class WebGL2RenderPassEncoder implements RenderPassEncoder {
    readonly label: string;
    private readonly gl;
    private readonly state;
    private readonly options;
    private readonly colorFormats;
    private readonly depthFormat;
    private pipeline;
    private readonly bindGroups;
    private readonly dynamicOffsets;
    private readonly vertexBuffers;
    private indexBuffer;
    private stencilReference;
    private _ended;
    constructor(descriptor: RenderPassDescriptor, options: WebGL2RenderPassOptions);
    get ended(): boolean;
    setPipeline(pipeline: WebGL2RenderPipeline): void;
    setBindGroup(index: number, bindGroup: WebGL2BindGroup | null, dynamicOffsets?: readonly number[]): void;
    setVertexBuffer(slot: number, buffer: WebGL2Buffer | null, offset?: number, size?: number): void;
    setIndexBuffer(buffer: WebGL2Buffer, format: IndexFormat, offset?: number, size?: number): void;
    setViewport(x: number, y: number, width: number, height: number, minDepth?: number, maxDepth?: number): void;
    setScissorRect(x: number, y: number, width: number, height: number): void;
    setBlendConstant(color: Color): void;
    setStencilReference(reference: number): void;
    draw(descriptor: DrawDescriptor): void;
    drawIndexed(descriptor: DrawIndexedDescriptor): void;
    drawIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    drawIndexedIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    end(): void;
    /** 当前渲染目标的形态信息，用于让管线解析出对应状态。 */
    private variantRequest;
    private requirePipeline;
    private assertNoUnsupportedInstancing;
    /** 一个 draw 之前必须完成的全部绑定工作。 */
    private beginDraw;
    private applyBindGroups;
    /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
    private assertAllGroupsBound;
    /**
     * WebGL2 无法表达「同一个纹理的不同 mip 子范围视图」：mip 范围是纹理对象自身的参数，
     * 不是绑定点状态。为了避免同一张纹理被两个 view 以不同 mip 范围采样时结果错乱，这里直接报错。
     */
    private assertViewRangeSupported;
    /** 原始附件（不走 RenderTarget）路径下的清屏。 */
    private clearRawAttachments;
    /**
     * 画进默认帧缓冲（canvas）。
     *
     * 默认帧缓冲只有 BACK 一个颜色缓冲，没有 FBO 对象，所以这里用最传统的
     * `clearColor` + `clear` 组合，而不是 `clearBufferfv`（后者对默认帧缓冲的行为各实现不一）。
     */
    private beginDefaultFramebufferPass;
    private assertOpen;
}
/** 便于其它模块判断某个 binding 类型是否需要纹理。 */
export declare function isTextureBindingType(type: string): boolean;
//# sourceMappingURL=WebGL2RenderPassEncoder.d.ts.map