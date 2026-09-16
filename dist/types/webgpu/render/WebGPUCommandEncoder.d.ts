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
import type { QuerySet } from '../../core/resources/QuerySet.js';
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
    /**
     * 把 query set 的一段结果解析进 `destination`（需要 `BufferUsage.QueryResolve`）。
     *
     * 注意读回路径：`MAP_READ` 不能与 `QUERY_RESOLVE` 组合，所以想读回必须再
     * `copyBufferToBuffer` 到一个 `MAP_READ | COPY_DST` 的 buffer（`Device.readQuerySet()` 已经封装好）。
     */
    resolveQuerySet(querySet: QuerySet, firstQuery: number, queryCount: number, destination: BufferLike, destinationOffset: number): void;
    /**
     * 在命令流里写一个 GPU 时间戳（只需要 `timestamp-query`，不需要 `timestamp-query-inside-passes`）。
     *
     * 必须在任何 pass **之外**调用：WebGPU 规定 encoder 上写时间戳时不能有打开的 pass。
     * 未启用 feature、或实现没有暴露这个方法时明确报错（后者实测存在于部分实现里）。
     */
    writeTimestamp(querySet: QuerySet, queryIndex: number): void;
    /** 调试分组：直接转发给原生的 `GPUCommandEncoder`。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    /**
     * 结束录制并返回 command buffer。
     *
     * 如果有 pass 还开着，会先隐式 `end()` —— 与 WebGPU 原生的 `finish()` 行为一致
     * （否则留在录制中的 pass 会被静默丢弃）。
     *
     * ## 为什么在 finish() 里就 untrack
     *
     * 之前只有 `dispose()` 才把 encoder 从设备的资源追踪集合里摘掉，而 core 的 `CommandEncoder`
     * 接口**没有** `dispose()`（见 `core/render/CommandEncoder.ts`），于是「每帧建一个 encoder、
     * `finish()` 之后丢掉」这种最标准的用法会让 `WebGPUDevice.resources` 无上限增长：
     * 每个包装对象连同它的原生 `GPUCommandEncoder` 一直被强引用到 `device.dispose()`。
     * command encoder 是每帧都建的东西，这是一次实打实的每帧泄漏。
     *
     * **语义安全性**：`finish()` 之后本对象上的**每一个**方法都会先过 `assertRecording()` 抛错
     * （`beginRenderPass` / `beginComputePass` / 全部 copy / `clearBuffer` / `resolveQuerySet` /
     * `writeTimestamp` / 三个 debug marker 方法 / `finish` 自身），唯一还允许调用的是幂等的
     * `dispose()`；`beginRenderPass` / `beginComputePass` 返回的 pass 也会在 finish 之前被
     * `closeOpenPass()` 结束掉（pass 的 `end()` 之后同样不可再用）。也就是说 finish 之后这个
     * encoder 不可能再产生任何设备侧工作，设备追踪集合存在的唯一目的
     * （`device.dispose()` 时统一释放）对它已经没有意义，提前摘掉不会留下任何可用的悬空引用。
     */
    finish(): CommandBuffer;
    /**
     * 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。
     *
     * 幂等：`finish()` 已经摘过一次追踪，这里再摘一次是空操作；重复调用也不会抛错。
     */
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