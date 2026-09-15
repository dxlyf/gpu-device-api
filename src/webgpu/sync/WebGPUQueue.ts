/**
 * WebGPU 提交队列：`Queue` 接口在 `GPUQueue` 上的实现。
 *
 * WebGPU 的 queue 是「延迟提交」模型：`writeBuffer` / `writeTexture` 立即入队，GPU 侧在之后
 * 提交的命令**执行前**统一生效。因此本后端的时序契约与 WebGL2 不同（详见
 * {@link WebGPUQueue.writeBuffer} 的说明），core 在 `Queue` 的文档里已经如实记录了这个差异。
 */

import type { Queue, ExternalImageSource } from '../../core/sync/Queue.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { asGPUBuffer } from '../resources/WebGPUBuffer.js';
import { asGPUTexture } from '../resources/WebGPUTexture.js';
import { asGPUCommandBuffer } from '../render/WebGPUCommandEncoder.js';
import {
  toGPUExtent3D,
  toGPUOrigin3D,
  toGPUTexelCopyBufferLayout,
  toGPUTextureAspect,
} from '../utils/wgpuEnumMap.js';

export class WebGPUQueue implements Queue {
  readonly native: GPUQueue;

  private readonly device: WebGPUDevice;

  constructor(device: WebGPUDevice) {
    this.device = device;
    this.native = device.native.queue;
  }

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
  writeBuffer(
    buffer: Buffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset = 0,
    size?: number,
  ): void {
    // 设备丢失后原生 queue 的调用会被静默丢弃，这里必须主动报错（见 WebGPUDevice.assertUsable）。
    this.device.assertUsable('Queue.writeBuffer');
    // DataView 没有「元素」概念，按字节计；TypedArray 用它的 BYTES_PER_ELEMENT。
    const bytesPerElement =
      data instanceof DataView
        ? 1
        : ((data as unknown as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT ?? 1);
    const byteSize = size ?? data.byteLength - dataOffset;
    if (dataOffset % bytesPerElement !== 0 || byteSize % bytesPerElement !== 0) {
      throw new ValidationError(
        `[gpu-device-api] Queue.writeBuffer: dataOffset (${dataOffset}) and size (${byteSize}) are measured in ` +
          `bytes, so both must be multiples of the element size (${bytesPerElement}) of the given ${data.constructor.name}.`,
      );
    }
    this.native.writeBuffer(
      asGPUBuffer(buffer, 'Queue.writeBuffer'),
      bufferOffset,
      toAllowSharedBufferSource(data),
      dataOffset / bytesPerElement,
      byteSize / bytesPerElement,
    );
  }

  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(
    destination: TextureCopyView,
    data: ArrayBufferView,
    layout: TexelCopyBufferLayout,
    size: Extent3D,
  ): void {
    this.device.assertUsable('Queue.writeTexture');
    this.native.writeTexture(
      toGPUTexelCopyTextureInfo(destination, 'Queue.writeTexture'),
      toAllowSharedBufferSource(data),
      toGPUTexelCopyBufferLayout(layout),
      toGPUExtent3D(size),
    );
  }

  /**
   * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
   *
   * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
   * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
   */
  copyExternalImageToTexture(
    source: ExternalImageSource,
    destination: TextureCopyView,
    copySize: Extent3D,
    flipY = false,
  ): void {
    this.device.assertUsable('Queue.copyExternalImageToTexture');
    this.native.copyExternalImageToTexture(
      { source, flipY },
      toGPUTexelCopyTextureInfo(destination, 'Queue.copyExternalImageToTexture'),
      toGPUExtent3D(copySize),
    );
  }

  /**
   * buffer → buffer 的拷贝。
   *
   * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
   * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
   */
  copyBufferToBuffer(
    source: Buffer,
    sourceOffset: number,
    destination: Buffer,
    destinationOffset: number,
    size: number,
  ): void {
    this.device.assertUsable('Queue.copyBufferToBuffer');
    const encoder = this.device.native.createCommandEncoder({ label: 'Queue.copyBufferToBuffer' });
    encoder.copyBufferToBuffer(
      asGPUBuffer(source, 'Queue.copyBufferToBuffer(source)'),
      sourceOffset,
      asGPUBuffer(destination, 'Queue.copyBufferToBuffer(destination)'),
      destinationOffset,
      size,
    );
    this.native.submit([encoder.finish()]);
  }

  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    this.device.assertUsable('Queue.copyBufferToTexture');
    const encoder = this.device.native.createCommandEncoder({ label: 'Queue.copyBufferToTexture' });
    encoder.copyBufferToTexture(
      {
        buffer: asGPUBuffer(source.buffer, 'Queue.copyBufferToTexture(source)'),
        offset: source.offset ?? 0,
        bytesPerRow: source.bytesPerRow,
        rowsPerImage: source.rowsPerImage,
      },
      toGPUTexelCopyTextureInfo(destination, 'Queue.copyBufferToTexture(destination)'),
      toGPUExtent3D(copySize),
    );
    this.native.submit([encoder.finish()]);
  }

  /**
   * 提交 command buffer；提交后这些 buffer 不可再次使用。
   *
   * **设备丢失后会抛 `DeviceLostError`**：WebGPU 规定丢失设备上的提交被静默丢弃，
   * 不检查的话就是「每帧都在提交、画面永远不动、一行错误都没有」。这是本层唯一能
   * 把这件事变成明确错误的地方。
   */
  submit(commandBuffers: readonly CommandBuffer[]): void {
    this.device.assertUsable('Queue.submit');
    this.native.submit(commandBuffers.map((commandBuffer) => asGPUCommandBuffer(commandBuffer, 'Queue.submit')));
  }

  /** 先前提交的全部工作都在 GPU 上完成后 resolve。 */
  async onSubmittedWorkDone(): Promise<void> {
    await this.native.onSubmittedWorkDone();
  }

  /** 本队列所属设备，便于调试。 */
  get owner(): WebGPUDevice {
    return this.device;
  }
}

function toGPUTexelCopyTextureInfo(view: TextureCopyView, context: string): GPUTexelCopyTextureInfo {
  const info: GPUTexelCopyTextureInfo = {
    texture: asGPUTexture(view.texture, context),
  };
  if (view.mipLevel !== undefined) info.mipLevel = view.mipLevel;
  if (view.origin !== undefined) info.origin = toGPUOrigin3D(view.origin);
  if (view.aspect !== undefined) info.aspect = toGPUTextureAspect(view.aspect);
  return info;
}

/**
 * 收窄 `ArrayBufferView` 的类型。
 *
 * TS 的 `ArrayBufferView` 默认参数化在 `ArrayBufferLike` 上（含 `SharedArrayBuffer`），
 * 而 WebGPU 的 `GPUAllowSharedBufferSource` 用更严格的成员联合表达同一件事；运行时形状相同，
 * 因此这里只做一次类型层面的收窄，不做任何数据转换。
 */
function toAllowSharedBufferSource(data: ArrayBufferView): GPUAllowSharedBufferSource {
  return data as GPUAllowSharedBufferSource;
}
