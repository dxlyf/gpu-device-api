/** 命令录制。对应 WebGPU 的 `GPUCommandEncoder` / `GPUCommandBuffer`。 */
import type { Disposable } from '../../utils/Disposable.js';
import type { QuerySet } from '../resources/QuerySet.js';
import type { TextureAspect } from '../resources/TextureView.js';
import type { Extent3D, Origin3D, TexelCopyBufferLayout } from '../../types/internal.js';
/**
 * 命令层用到的 {@link Buffer} 结构子集。刻意保持最小，
 * 使命令接口不依赖资源类的继承体系。
 */
export interface BufferLike {
    readonly size: number;
    readonly native?: unknown;
}
export interface TextureLike {
    readonly width: number;
    readonly height: number;
    readonly depthOrArrayLayers: number;
    readonly native?: unknown;
}
export interface CommandEncoderDescriptor {
    label?: string;
}
export interface CommandBuffer extends Disposable {
    readonly label: string;
    readonly native: unknown;
}
export interface TextureCopyView {
    texture: TextureLike;
    mipLevel?: number;
    origin?: Partial<Origin3D>;
    aspect?: TextureAspect;
}
export interface BufferCopyView {
    buffer: BufferLike;
    offset?: number;
    bytesPerRow?: number;
    rowsPerImage?: number;
}
export interface CommandEncoder {
    readonly label: string;
    /** 开始一个 render pass。同一时间只能有一个 pass 处于打开状态。 */
    beginRenderPass(descriptor: import('./RenderPassEncoder.js').RenderPassDescriptor): import('./RenderPassEncoder.js').RenderPassEncoder;
    /** 开始一个 compute pass（仅 WebGPU；WebGL2 后端会抛错）。 */
    beginComputePass(descriptor?: import('./ComputePassEncoder.js').ComputePassDescriptor): import('./ComputePassEncoder.js').ComputePassEncoder;
    copyBufferToBuffer(source: BufferLike, sourceOffset: number, destination: BufferLike, destinationOffset: number, size: number): void;
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void;
    copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    /** 将 buffer 的一段范围清零。 */
    clearBuffer(buffer: BufferLike, offset?: number, size?: number): void;
    /**
     * 把 query set 里的一段结果**解析**（resolve）进一个 buffer。
     *
     * 对应 WebGPU 的 `GPUCommandEncoder.resolveQuerySet()`：`destination` 必须声明了
     * `BufferUsage.QueryResolve`，结果按 u64 依次写入。
     *
     * WebGL2 后端没有对应概念（GL 的查询结果只能同步读回，没有结果缓冲区的概念），
     * 调用它会抛 `ValidationError`；跨后端请改用 `Device.readQuerySet()`。
     */
    resolveQuerySet(querySet: QuerySet, firstQuery: number, queryCount: number, destination: BufferLike, destinationOffset: number): void;
    /**
     * 在命令流里打一个 GPU 时间戳（对应 WebGPU 的 `GPUCommandEncoder.writeTimestamp()`）。
     *
     * 与 pass 的 `timestampWrites` 相比，它只需要 `timestamp-query`，不需要
     * `timestamp-query-inside-passes`，而且可以精确框住「一次提交」的 GPU 时间
     * （begin 之前写一次、所有 pass 结束之后写一次）。因此 gfx 层的 GPU 计时用它实现。
     *
     * WebGL2 后端会抛错：GL 的时间查询是「beginQuery → endQuery」的区间测量，
     * 没有「单个时刻」的表达方式；请改用 `RenderPassDescriptor.timestampWrites`。
     */
    writeTimestamp(querySet: QuerySet, queryIndex: number): void;
    /**
     * 打一个调试分组（对应 WebGPU 的 `pushDebugGroup` / WebGL2 的 `EXT_debug_marker`）。
     *
     * 用途是让 RenderDoc / PIX / Xcode 的抓帧按「一帧里的哪个阶段」分组显示，不改变渲染结果。
     * WebGL2 上没有该扩展时是**空操作**（不是错误）：调试标记缺失不影响正确性。
     */
    pushDebugGroup(label: string): void;
    /** 结束最近一次 {@link pushDebugGroup}。 */
    popDebugGroup(): void;
    /** 插入一个瞬时标记（不配对）。 */
    insertDebugMarker(label: string): void;
    finish(): CommandBuffer;
}
export type { TexelCopyBufferLayout };
//# sourceMappingURL=CommandEncoder.d.ts.map