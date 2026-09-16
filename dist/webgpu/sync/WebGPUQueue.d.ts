/**
 * WebGPU 提交队列：`Queue` 接口在 `GPUQueue` 上的实现。
 *
 * WebGPU 的 queue 是「延迟提交」模型：`writeBuffer` / `writeTexture` 立即入队，GPU 侧在之后
 * 提交的命令**执行前**统一生效。因此本后端的时序契约与 WebGL2 不同（详见
 * {@link WebGPUQueue.writeBuffer} 的说明），core 在 `Queue` 的文档里已经如实记录了这个差异。
 */
import type { Queue, ExternalImageSource, CopyExternalImageOptions } from '../../core/sync/Queue.js';
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
     *
     * **单位换算（容易踩）**：core 的契约里 `dataOffset` / `size` 是**字节**
     * （WebGL2 后端就是这么实现的），而 WebGPU 原生接口在 `data` 是 TypedArray 时按**元素**计
     * （`Float32Array` 的 `size = 4` 表示 4 个 float = 16 字节）。这里统一换算成元素再下发，
     * 否则同一个调用在两个后端会写入不同的范围 —— 通常表现为
     * `Number of bytes to write is too large`。
     */
    writeBuffer(buffer: Buffer, bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number): void;
    /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
    writeTexture(destination: TextureCopyView, data: ArrayBufferView, layout: TexelCopyBufferLayout, size: Extent3D): void;
    /**
     * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
     *
     * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
     * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
     *
     * ## `premultipliedAlpha` / `colorSpace`（`#25`）
     *
     * 两个参数都属于原生的 **destination**（`GPUCopyExternalImageDestInfo`），
     * 默认值与原生的 IDL 默认值逐字段一致：`premultipliedAlpha = true`、`colorSpace = 'srgb'`。
     *
     * **未指定时不下发这两个字段**：调用形状仍是改动前的 `{ source, flipY }`，
     * 于是「没写新参数」的行为与改动前逐字段相同（默认值由原生实现填，我们不去重复一遍
     * 再传回去）。只有在调用方显式给了值时，才把值原样放进 destination。
     */
    copyExternalImageToTexture(source: ExternalImageSource, destination: TextureCopyView, copySize: Extent3D, flipY?: boolean, options?: CopyExternalImageOptions): void;
    /**
     * buffer → buffer 的拷贝。
     *
     * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
     * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
     */
    copyBufferToBuffer(source: Buffer, sourceOffset: number, destination: Buffer, destinationOffset: number, size: number): void;
    /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    /**
     * 提交 command buffer；提交后这些 buffer 不可再次使用。
     *
     * **设备丢失后会抛 `DeviceLostError`**：WebGPU 规定丢失设备上的提交被静默丢弃，
     * 不检查的话就是「每帧都在提交、画面永远不动、一行错误都没有」。这是本层唯一能
     * 把这件事变成明确错误的地方。
     */
    submit(commandBuffers: readonly CommandBuffer[]): void;
    /** 先前提交的全部工作都在 GPU 上完成后 resolve。 */
    onSubmittedWorkDone(): Promise<void>;
    /** 本队列所属设备，便于调试。 */
    get owner(): WebGPUDevice;
}
//# sourceMappingURL=WebGPUQueue.d.ts.map