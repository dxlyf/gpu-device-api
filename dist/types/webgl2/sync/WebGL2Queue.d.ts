/**
 * WebGL2 的队列。
 *
 * **时序契约（务必与 `core/sync/Queue.ts` 的说明一起看）**：
 * `writeBuffer` 在 WebGL2 上是**立即生效**的，而 WebGPU 是「在之后提交的命令执行前生效」。
 * 两者只在「同一帧内对同一 buffer 的同一区间写两次再分别 draw」时才会产生差异。
 * 规避方式是 uniform arena + 动态偏移：每次 draw 用独立区间，两个后端结果完全一致。
 *
 * `submit()` 在 WebGL2 上没有实际工作（命令在录制时就执行了），它存在的意义是
 * 保持调用点一致，并作为「本帧结束」的语义锚点。
 */
import type { Queue, ExternalImageSource } from '../../core/sync/Queue.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
export declare class WebGL2Queue implements Queue {
    readonly label: string;
    private readonly gl;
    private readonly state;
    private submittedCount;
    private pending;
    constructor(gl: WebGL2RenderingContext, state: GlStateCache);
    /** 已提交的 command buffer 数量（用于测试与统计）。 */
    get submitted(): number;
    writeBuffer(buffer: Buffer, bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number): void;
    writeTexture(destination: TextureCopyView, data: ArrayBufferView, layout: TexelCopyBufferLayout, size: Extent3D): void;
    copyExternalImageToTexture(source: ExternalImageSource, destination: TextureCopyView, copySize: Extent3D, flipY?: boolean): void;
    copyBufferToBuffer(source: Buffer, sourceOffset: number, destination: Buffer, destinationOffset: number, size: number): void;
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    submit(commandBuffers: readonly CommandBuffer[]): void;
    onSubmittedWorkDone(): Promise<void>;
}
//# sourceMappingURL=WebGL2Queue.d.ts.map