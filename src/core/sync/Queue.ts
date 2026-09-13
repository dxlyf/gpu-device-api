/** The submission queue. Mirrors WebGPU's `GPUQueue`. */

import type { Buffer } from '../resources/Buffer.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../render/CommandEncoder.js';

/** Browser image sources accepted by {@link Queue.copyExternalImageToTexture}. */
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
   * Writes host data into a buffer.
   *
   * **Timing contract:** the write becomes visible to *every* command submitted after this call,
   * including commands already recorded in an open encoder. WebGPU has this behaviour natively;
   * the WebGL2 backend emulates it with a deferred write list flushed on `submit()`. Upper layers
   * can therefore interleave `writeBuffer` and `draw` and get identical results on both backends.
   */
  writeBuffer(
    buffer: Buffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset?: number,
    size?: number,
  ): void;

  /** Uploads host pixels into a texture (the WebGPU name for `texSubImage2D`). */
  writeTexture(
    destination: TextureCopyView,
    data: ArrayBufferView,
    layout: TexelCopyBufferLayout,
    size: Extent3D,
  ): void;

  /** Uploads an image source directly; supports `flipY` which WebGPU cannot express otherwise. */
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

  /** Submits command buffers. The WebGL2 backend flushes pending writes and GL commands here. */
  submit(commandBuffers: readonly CommandBuffer[]): void;

  /** Resolves when all previously submitted work has completed on the GPU. */
  onSubmittedWorkDone(): Promise<void>;
}
