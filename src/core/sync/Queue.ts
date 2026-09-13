/** 提交队列。对应 WebGPU 的 `GPUQueue`。 */

import type { Buffer } from '../resources/Buffer.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../render/CommandEncoder.js';

/** {@link Queue.copyExternalImageToTexture} 接受的浏览器图像来源。 */
export type ExternalImageSource =
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | OffscreenCanvas
  | ImageData
  | VideoFrame
  | HTMLVideoElement;

export interface Queue {
  /**
   * 将主机端数据写入 buffer。
   *
   * **时序契约：** 本次写入对本次调用之后提交的**所有**命令可见，包括已经录制进当前
   * 打开的 encoder 的命令。WebGPU 原生具备该行为；WebGL2 后端用延迟写入列表来模拟，
   * 在 `submit()` 时统一落地。因此上层可以任意交错调用 `writeBuffer` 与 `draw`，
   * 两个后端的结果完全一致。
   */
  writeBuffer(
    buffer: Buffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset?: number,
    size?: number,
  ): void;

  /** 将主机端像素上传到 texture（`texSubImage2D` 在 WebGPU 中的对应接口）。 */
  writeTexture(
    destination: TextureCopyView,
    data: ArrayBufferView,
    layout: TexelCopyBufferLayout,
    size: Extent3D,
  ): void;

  /** 直接上传图像来源；支持 WebGPU 无法以其他方式表达的 `flipY`。 */
  copyExternalImageToTexture(
    source: ExternalImageSource,
    destination: TextureCopyView,
    copySize: Extent3D,
    flipY?: boolean,
  ): void;

  copyBufferToBuffer(
    source: Buffer,
    sourceOffset: number,
    destination: Buffer,
    destinationOffset: number,
    size: number,
  ): void;

  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;

  /** 提交 command buffer。WebGL2 后端在此刷新挂起的写入和 GL 命令。 */
  submit(commandBuffers: readonly CommandBuffer[]): void;

  /** 先前提交的全部工作都在 GPU 上完成后 resolve。 */
  onSubmittedWorkDone(): Promise<void>;
}
