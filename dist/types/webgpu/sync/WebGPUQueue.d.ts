/**
 * WebGPU 提交队列：`Queue` 接口在 `GPUQueue` 上的实现。
 *
 * WebGPU 的 queue 是「延迟提交」模型：`writeBuffer` / `writeTexture` 立即入队，GPU 侧在之后
 * 提交的命令**执行前**统一生效。因此本后端的时序契约与 WebGL2 不同（详见
 * {@link WebGPUQueue.writeBuffer} 的说明），core 在 `Queue` 的文档里已经如实记录了这个差异。
 */
import type { Queue, ExternalImageSource } from '../../core/sync/Queue.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUQueue implements Queue {
    readonly native: GPUQueue;
    private readonly device;
    constructor(device: WebGPUDevice);
    /**
     * 将主机端数据写入 buffer。
     *
     * **时序契约（WebGPU 原生语义）**：这次写入对**之后提交的所有命令**可见 —— 包括已经录制进
     * 当前打开的 encoder、但直到这次 `writeBuffer()` 之后才 `submit()` 的命令。也就是说
     * 「先写 buffer → 录制 draw → 再写同一个 buffer → 提交」时，**两次 draw 都会看到后写入的数据**。
     *
     * 这与 WebGL2 后端的立即模式语义不同（那边只有之后录制的命令能看到新数据），需要
     * 「改 uniform → draw → 再改 → 再 draw」时请使用 uniform arena + dynamic offset
     * （`setBindGroup(index, bindGroup, [dynamicOffset])`），两个后端的结果才一致。
     */
    writeBuffer(buffer: Buffer, bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number): void;
    /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
    writeTexture(destination: TextureCopyView, data: ArrayBufferView, layout: TexelCopyBufferLayout, size: Extent3D): void;
    /**
     * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
     *
     * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
     * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
     */
    copyExternalImageToTexture(source: ExternalImageSource, destination: TextureCopyView, copySize: Extent3D, flipY?: boolean): void;
    /**
     * buffer → buffer 的拷贝。
     *
     * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
     * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
     */
    copyBufferToBuffer(source: Buffer, sourceOffset: number, destination: Buffer, destinationOffset: number, size: number): void;
    /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    /** 提交 command buffer；提交后这些 buffer 不可再次使用。 */
    submit(commandBuffers: readonly CommandBuffer[]): void;
    /** 先前提交的全部工作都在 GPU 上完成后 resolve。 */
    onSubmittedWorkDone(): Promise<void>;
    /** 本队列所属设备，便于调试。 */
    get owner(): WebGPUDevice;
}
//# sourceMappingURL=WebGPUQueue.d.ts.map