/**
 * WebGL2 的 command encoder。
 *
 * WebGL2 是立即模式：`beginRenderPass()` 会立刻绑定 framebuffer 并清屏，绘制也在录制时下发。
 * 所以这里的 `finish()` 只是一个**记账动作**，返回的 command buffer 里记录了本次编码期间
 * 下发过多少次绘制，供 `Queue.submit()` 校验与统计使用 —— 而不是一份待执行的指令列表。
 *
 * 复制类命令同样是立即生效的（`copyBufferSubData` / `blitFramebuffer`），
 * 这一点与 WebGPU 的「录制后统一提交」不同，已在 `core/sync/Queue.ts` 里写明差异。
 */
import type { BufferCopyView, CommandBuffer, CommandEncoder, CommandEncoderDescriptor, TextureCopyView } from '../../core/render/CommandEncoder.js';
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
    /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    finish(): WebGL2CommandBuffer;
    private assertOpen;
}
//# sourceMappingURL=WebGL2CommandEncoder.d.ts.map