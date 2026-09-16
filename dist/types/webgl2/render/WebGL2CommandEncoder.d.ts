/**
 * WebGL2 的 command encoder。
 *
 * WebGL2 是立即模式：`beginRenderPass()` 会立刻绑定 framebuffer 并清屏，绘制也在录制时下发。
 * 所以这里的 `finish()` 只是一个**记账动作**，返回的 command buffer 里记录了本次编码期间
 * 下发过多少次绘制，供 `Queue.submit()` 校验与统计使用 —— 而不是一份待执行的指令列表。
 *
 * 复制类命令同样是立即生效的（`copyBufferSubData` / `blitFramebuffer`），
 * 这一点与 WebGPU 的「录制后统一提交」不同，已在 `core/sync/Queue.ts` 里写明差异。
 *
 * 生命周期上它与 WebGPU 的 encoder **没有同形缺陷**：这里的 encoder 不持有任何 GL 资源
 * （命令已经下发完了），因此 `WebGL2Device.createCommandEncoder()` 从不把它登记进设备的
 * 资源追踪集合，也没有 `dispose()`；`finish()` 只是把记账对象置为终态。
 */
import type { BufferCopyView, CommandBuffer, CommandEncoder, CommandEncoderDescriptor, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { QuerySet } from '../../core/resources/QuerySet.js';
import type { Extent3D } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import { WebGL2RenderPassEncoder, type WebGL2RenderPassOptions } from './WebGL2RenderPassEncoder.js';
import { WebGL2ComputePassEncoder } from './WebGL2ComputePassEncoder.js';
/** `finish()` 产出的 command buffer：记录本次编码期间的统计信息。 */
export interface WebGL2CommandBuffer extends CommandBuffer {
    readonly drawCalls: number;
    readonly passCount: number;
}
export declare class WebGL2CommandEncoder implements CommandEncoder {
    readonly label: string;
    private readonly gl;
    private readonly state;
    private readonly passOptions;
    private openPass;
    private drawCalls;
    private passCount;
    private finished;
    constructor(descriptor: CommandEncoderDescriptor | undefined, gl: WebGL2RenderingContext, state: GlStateCache, passOptions: WebGL2RenderPassOptions);
    /** 由渲染通道回调，用于统计。 */
    noteDrawCall(): void;
    beginRenderPass(descriptor: Parameters<CommandEncoder['beginRenderPass']>[0]): WebGL2RenderPassEncoder;
    beginComputePass(): WebGL2ComputePassEncoder;
    copyBufferToBuffer(source: {
        readonly size: number;
    }, sourceOffset: number, destination: {
        readonly size: number;
    }, destinationOffset: number, size: number): void;
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void;
    copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    clearBuffer(buffer: {
        readonly size: number;
    }, offset?: number, size?: number): void;
    /**
     * WebGL2 没有对应能力：GL 的查询结果不能写进 buffer，只能 `getQueryParameter()` 读回。
     * 调用它明确报错，并指出替代方案（`Device.readQuerySet()`）。
     */
    resolveQuerySet(querySet: QuerySet, firstQuery: number, queryCount: number, destination: {
        readonly size: number;
    }, destinationOffset: number): void;
    /**
     * WebGL2 没有「单个时刻的时间戳」：GL 的时间查询是 `beginQuery → endQuery` 的**区间**测量。
     * 请改用 `RenderPassDescriptor.timestampWrites`（后端会用 beginQuery/endQuery 包住整个通道）。
     */
    writeTimestamp(querySet: QuerySet, queryIndex: number): void;
    /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    /**
     * 结束记账并返回 command buffer。
     *
     * 不需要（也没有）从设备追踪集合里摘自己：本类从不被登记（见类注释），
     * 与 WebGPU 后端在 `finish()` 里 `untrack()` 的处理对应的是同一个生命周期终点 ——
     * finish 之后本对象的其它方法都会经 `assertOpen()` 抛错。
     */
    finish(): WebGL2CommandBuffer;
    private assertOpen;
}
//# sourceMappingURL=WebGL2CommandEncoder.d.ts.map