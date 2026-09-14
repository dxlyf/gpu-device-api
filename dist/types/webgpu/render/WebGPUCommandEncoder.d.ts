/**
 * WebGPU 命令录制：`CommandEncoder` / `CommandBuffer` 接口在 `GPUCommandEncoder` /
 * `GPUCommandBuffer` 上的实现。
 *
 * 两个实现细节值得注意：
 * - 同一时间只有一个 pass 可以处于打开状态（core 的契约），这里用一个「当前打开的 pass」
 *   引用进行跟踪，并在 `finish()` 时隐式 `end()`（WebGPU 原生也是这个语义）；
 * - 拷贝命令里的 `TextureLike` / `BufferLike` 只有可选的 `native`，因此每次都要做运行时
 *   收窄；收不到原生对象时抛带上下文的 {@link ValidationError}。
 */
import type { BufferCopyView, BufferLike, CommandBuffer, CommandEncoder, CommandEncoderDescriptor, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { RenderPassDescriptor, RenderPassEncoder } from '../../core/render/RenderPassEncoder.js';
import type { ComputePassDescriptor, ComputePassEncoder } from '../../core/render/ComputePassEncoder.js';
import type { Extent3D } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUCommandEncoder implements CommandEncoder {
    readonly label: string;
    readonly native: GPUCommandEncoder;
    private readonly device;
    /** 唯一可能处于打开状态的 pass（render 或 compute）。 */
    private openPass;
    private _finished;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor?: CommandEncoderDescriptor);
    get finished(): boolean;
    get disposed(): boolean;
    /** 开始一个 render pass。同一时间只能有一个 pass 处于打开状态。 */
    beginRenderPass(descriptor: RenderPassDescriptor): RenderPassEncoder;
    /** 开始一个 compute pass。 */
    beginComputePass(descriptor?: ComputePassDescriptor): ComputePassEncoder;
    copyBufferToBuffer(source: BufferLike, sourceOffset: number, destination: BufferLike, destinationOffset: number, size: number): void;
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void;
    copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
    clearBuffer(buffer: BufferLike, offset?: number, size?: number): void;
    /** 调试分组：直接转发给原生的 `GPUCommandEncoder`。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    /**
     * 结束录制并返回 command buffer。
     *
     * 如果有 pass 还开着，会先隐式 `end()` —— 与 WebGPU 原生的 `finish()` 行为一致
     * （否则留在录制中的 pass 会被静默丢弃）。
     */
    finish(): CommandBuffer;
    /** 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。 */
    dispose(): void;
    private closeOpenPass;
    private assertRecording;
}
/** 已录制的命令缓冲区。对应 WebGPU 的 `GPUCommandBuffer`。 */
export declare class WebGPUCommandBuffer implements CommandBuffer {
    readonly label: string;
    readonly native: GPUCommandBuffer;
    private _disposed;
    constructor(label: string, native: GPUCommandBuffer);
    get disposed(): boolean;
    /** `GPUCommandBuffer` 没有 destroy；释放只是标记本包装对象不可用（提交后本身就不可复用）。 */
    dispose(): void;
}
/** 把任意 command buffer 表示收窄为原生 `GPUCommandBuffer`（供 queue.submit 使用）。 */
export declare function asGPUCommandBuffer(value: unknown, context: string): GPUCommandBuffer;
//# sourceMappingURL=WebGPUCommandEncoder.d.ts.map