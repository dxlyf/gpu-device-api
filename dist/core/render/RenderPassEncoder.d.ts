/** render pass 录制。对应 WebGPU 的 `GPURenderPassEncoder`。 */
import type { IndexFormat } from '../enums/IndexFormat.js';
import type { BindGroup } from '../binding/BindGroup.js';
import type { RenderPipeline } from '../pipeline/RenderPipeline.js';
import type { Buffer } from '../resources/Buffer.js';
import type { PassTimestampWrites, QuerySet } from '../resources/QuerySet.js';
import type { ColorAttachment, Color, DepthStencilAttachment, RenderTarget } from './RenderTarget.js';
import type { DrawDescriptor, DrawIndexedDescriptor, DrawIndirectDescriptor } from './DrawCommands.js';
import type { BufferLike } from './CommandEncoder.js';
export interface RenderPassDescriptor {
    label?: string;
    /**
     * 附件列表（`null` 表示该 location 的片元输出被丢弃）。
     *
     * **给了 `target` 时必须为空数组**：两个后端都会对「`target` + 非空 `colorAttachments`」
     * 抛出 `ValidationError`（`#19`）。这个字段本身仍是必填的，用 `target` 时写 `[]` ——
     * 这样「有没有附件」这件事在两个后端只有一种表达方式，不会出现「一边静默忽略、一边报错」。
     */
    colorAttachments: readonly (ColorAttachment | null)[];
    depthStencilAttachment?: DepthStencilAttachment | null;
    /** 便捷方式：直接由一个 render target 生成两份 attachment 列表。与上面的 `[]` 搭配使用。 */
    target?: RenderTarget;
    occlusionQuerySet?: QuerySet;
    /**
     * 在通道的首尾各写一个 GPU 时间戳（形状与 WebGPU 的 `GPURenderPassTimestampWrites` 一致）。
     *
     * WebGPU：需要设备启用 `timestamp-query`，且实现支持 `timestamp-query-inside-passes`
     * （Chrome 里该能力默认不开，只暴露实验名 `chromium-experimental-timestamp-query-inside-passes`）；
     * 不满足时抛出带 `[gpu-device-api] ` 前缀的英文错误，而不是静默忽略。
     * WebGL2：用 `EXT_disjoint_timer_query_webgl2` 的 `beginQuery`/`endQuery` 包住整个通道。
     * **语义差异**：GL 测量的是区间耗时，所以 WebGL2 把「本通道耗时（纳秒）」写进
     * `beginningOfPassWriteIndex`（只给 end 时写进 end 那个下标），另一个下标保持 0；
     * WebGPU 写的则是两个时刻，差值才是耗时。跨后端代码要么自己分后端解释，
     * 要么直接用 gfx 的 GPU 计时（`Renderer.enableGpuTiming()`），它已经把差异封好了。
     */
    timestampWrites?: PassTimestampWrites;
    /** 使用 `target` 时应用的清除值。 */
    clearValue?: Color;
    depthClearValue?: number;
}
export interface RenderPassEncoder {
    readonly label: string;
    readonly ended: boolean;
    setPipeline(pipeline: RenderPipeline): void;
    /**
     * 绑定 bind group。对声明了 `hasDynamicOffset` 的条目（uniform 环形分配），
     * 必须提供 `dynamicOffsets`。
     */
    setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void;
    setVertexBuffer(slot: number, buffer: Buffer | null, offset?: number, size?: number): void;
    setIndexBuffer(buffer: Buffer, format: IndexFormat, offset?: number, size?: number): void;
    setViewport(x: number, y: number, width: number, height: number, minDepth?: number, maxDepth?: number): void;
    setScissorRect(x: number, y: number, width: number, height: number): void;
    setBlendConstant(color: Color): void;
    setStencilReference(reference: number): void;
    draw(descriptor: DrawDescriptor): void;
    drawIndexed(descriptor: DrawIndexedDescriptor): void;
    drawIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    drawIndexedIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    /**
     * 开始一条遮挡查询（对应 WebGPU 的 `GPURenderPassEncoder.beginOcclusionQuery()`）。
     *
     * `index` 是 `RenderPassDescriptor.occlusionQuerySet` 内的下标。这一段里画的图元有多少
     * 个采样通过深度/模板测试，就写进该下标的计数器 —— 典型用途是「先查询、再决定要不要
     * 画细节层次」。必须与 {@link endOcclusionQuery} 配对。
     *
     * 这一层暴露它是因为两个后端都能实现（WebGPU 原生支持；WebGL2 用 `ANY_SAMPLES_PASSED`），
     * 而「查询包围盒」这件事只有在录制命令的地方才知道边界，放到上层会退化成手工记账。
     */
    beginOcclusionQuery(index: number): void;
    /** 结束最近一次 {@link beginOcclusionQuery}；没有正在进行的查询时抛错。 */
    endOcclusionQuery(): void;
    /**
     * 打一个调试分组（对应 WebGPU 的 `pushDebugGroup` / WebGL2 的 `EXT_debug_marker`）。
     * 只影响抓帧工具的分组显示，不改变渲染结果；WebGL2 上没有扩展时是空操作。
     */
    pushDebugGroup(label: string): void;
    /** 结束最近一次 {@link pushDebugGroup}。 */
    popDebugGroup(): void;
    /** 插入一个瞬时标记（不配对）。 */
    insertDebugMarker(label: string): void;
    /** 结束该 pass。此后再提交命令会抛错。 */
    end(): void;
}
//# sourceMappingURL=RenderPassEncoder.d.ts.map