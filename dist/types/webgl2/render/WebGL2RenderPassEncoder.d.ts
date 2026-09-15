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
    /**
     * 本通道画进的离屏渲染目标（没有就是 canvas 默认帧缓冲或临时拼的 FBO）。
     *
     * 它有两个用途：多重采样目标要在 `end()` 时做 resolve；以及决定 `variantShape.sampleCount`。
     */
    private renderTarget;
    private stencilReference;
    private _ended;
    /**
     * 本通道正在计时的时间查询（`beginQuery` 已在构造时下发，`end()` 时收尾）。
     *
     * GL 的时间查询是**区间**测量：`beginQuery(TIME_ELAPSED_EXT, q)` → `endQuery` 之间的 GPU
     * 时间会写进 q。所以它包住的是「通道开始清屏/绑定 framebuffer 之后到 end() 之前」这段，
     * 对单通道帧来说就是整个渲染阶段。
     */
    private pendingTimerQueries;
    /** 是否有正在进行的遮挡查询（GL 要求 beginQuery/endQuery 严格配对）。 */
    private occlusionQueryOpen;
    /** 本通道声明了 occlusionQuerySet 时的 query set（决定 beginOcclusionQuery 是否可用）。 */
    private occlusionQuerySet;
    /**
     * 变体请求对象：通道的颜色/深度格式在构造时就定了，生命周期内不会变，
     * 所以只分配一次（原来每次解析变体都要新建一个对象）。
     */
    private readonly variantShape;
    /** 变体解析结果的缓存：只跟当前管线对象走（见 {@link resolvedVariant}）。 */
    private variantPipeline;
    private variantValue;
    /** 当前顶点/索引绑定内容的版本号（见模块级 nextBindingRevision）。 */
    private bindingRevision;
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
    /**
     * 开始一条遮挡查询（对应 `gl.beginQuery(ANY_SAMPLES_PASSED, query)`）。
     *
     * `ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，不需要扩展；计数器记录的是「有多少个采样通过了
     * 深度/模板测试」（≥1 即表示「有东西可见」）。结果由 `Device.readQuerySet()` 读回。
     */
    beginOcclusionQuery(index: number): void;
    /** 结束最近一次 {@link beginOcclusionQuery}。 */
    endOcclusionQuery(): void;
    /**
     * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
     * （只影响抓帧工具的分组显示，不影响渲染结果）。
     */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    end(): void;
    /**
     * 判断这组原始附件是否**整体**来自同一个多重采样渲染目标。
     *
     * 为什么需要它：上层（`Renderer`）走的是 WebGPU 风格的写法 —— `target.createPassDescriptor()`
     * 拿到附件列表再交给 `beginRenderPass`，而不是把 `target` 直接传下来。没有这一步，
     * 多重采样目标会落到「按附件临时拼一个单采样 FBO」的分支，MSAA 被静默忽略。
     *
     * 返回值：
     * - `null`：不是多重采样目标（或者只是单采样目标的附件，此时行为与从前完全一致）；
     * - 目标：所有附件都属于同一个多重采样目标；
     * - 抛错：把一个多重采样目标的附件与别的目标的附件混在一起用 —— 这种组合本层无法正确
     *   表达（renderbuffer 与纹理不能挂在同一个 FBO 上），所以明确报错而不是画错。
     */
    private multisampleTargetOf;
    /**
     * 用渲染目标自己的 framebuffer 开始通道（多重采样路径）。
     *
     * 清屏参数从附件列表归并而来：GL 的 `clearBuffer*` 对同一帧的所有颜色附件用同一个颜色
     * （见 `WebGL2RenderTarget.bind`），所以这里要求各附件的 `loadOp` / `clearValue` 一致，
     * 不一致就明确报错，而不是悄悄只按第一个附件清屏。
     */
    private beginMultisampleTargetPass;
    /**
     * 处理 `RenderPassDescriptor.timestampWrites` 与 `occlusionQuerySet`。
     *
     * **WebGL2 的 timestamp 语义与 WebGPU 不同**（这一点必须看清）：
     * GL 的 `TIME_ELAPSED_EXT` 测量的是 `beginQuery` → `endQuery` 之间的**区间耗时**，
     * 而 WebGPU 写的是「通道开始的时刻」与「通道结束的时刻」两个独立时间戳。
     * 所以这里把区间耗时写进 `beginningOfPassWriteIndex`（只给了 end 时用 end 那个下标），
     * 另一个下标保持 0；读回后的解释也相应不同（见 gfx 的 `GpuTiming`）。
     */
    private beginQuerySetup;
    /** 收尾时间查询；没有正在进行的查询时是空操作。 */
    private endTimerQuery;
    /**
     * 取当前通道形态下已解析好的管线变体。
     *
     * 附件形态（颜色/深度格式、采样数）在通道生命周期内固定，变体只跟管线对象走，
     * 所以按管线记住解析结果就够了 —— 原先 `setPipeline` 与每个 `beginDraw` 都会重新解析一次，
     * 每次解析都要拼一遍含全部顶点布局的 O(属性数) 键字符串。
     * 管线被 dispose() 后变体缓存已被清空，这里重新解析以保持与原来一致的行为。
     */
    private resolvedVariant;
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