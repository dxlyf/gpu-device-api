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

import type {
  BufferCopyView,
  BufferLike,
  CommandBuffer,
  CommandEncoder,
  CommandEncoderDescriptor,
  TextureCopyView,
} from '../../core/render/CommandEncoder.js';
import type { RenderPassDescriptor, RenderPassEncoder } from '../../core/render/RenderPassEncoder.js';
import type { ComputePassDescriptor, ComputePassEncoder } from '../../core/render/ComputePassEncoder.js';
import type { Extent3D } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { assertNonNegativeInteger } from '../../utils/assert.js';
import { asGPUBuffer, describeUnknown } from '../resources/WebGPUBuffer.js';
import { asGPUTexture } from '../resources/WebGPUTexture.js';
import { toGPUExtent3D, toGPUOrigin3D, toGPUTextureAspect } from '../utils/wgpuEnumMap.js';
import {
  WebGPURenderPassEncoder,
  toGPURenderPassDescriptor,
} from './WebGPURenderPassEncoder.js';
import { WebGPUComputePassEncoder, toGPUComputePassDescriptor } from './WebGPUComputePassEncoder.js';

export class WebGPUCommandEncoder implements CommandEncoder {
  readonly label: string;
  readonly native: GPUCommandEncoder;

  private readonly device: WebGPUDevice;
  /** 唯一可能处于打开状态的 pass（render 或 compute）。 */
  private openPass: { end(): void; readonly ended: boolean } | null = null;
  private _finished = false;
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: CommandEncoderDescriptor = {}) {
    this.device = device;
    this.label = descriptor.label ?? `commandEncoder#${device.nextResourceId('commandEncoder')}`;
    this.native = device.native.createCommandEncoder({ label: this.label });
  }

  get finished(): boolean {
    return this._finished;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 开始一个 render pass。同一时间只能有一个 pass 处于打开状态。 */
  beginRenderPass(descriptor: RenderPassDescriptor): RenderPassEncoder {
    this.assertRecording('beginRenderPass');
    this.closeOpenPass();
    const { native, layout } = toGPURenderPassDescriptor(descriptor);
    const label = descriptor.label ?? this.label;
    const encoder = new WebGPURenderPassEncoder(
      this.device,
      this.native.beginRenderPass(native),
      layout,
      label,
      () => {
        if (this.openPass === encoder) this.openPass = null;
      },
    );
    this.openPass = encoder;
    return encoder;
  }

  /** 开始一个 compute pass。 */
  beginComputePass(descriptor?: ComputePassDescriptor): ComputePassEncoder {
    this.assertRecording('beginComputePass');
    this.closeOpenPass();
    const native = toGPUComputePassDescriptor(descriptor);
    const label = descriptor?.label ?? this.label;
    const encoder = new WebGPUComputePassEncoder(
      this.device,
      this.native.beginComputePass(native),
      label,
      () => {
        if (this.openPass === encoder) this.openPass = null;
      },
    );
    this.openPass = encoder;
    return encoder;
  }

  copyBufferToBuffer(
    source: BufferLike,
    sourceOffset: number,
    destination: BufferLike,
    destinationOffset: number,
    size: number,
  ): void {
    this.assertRecording('copyBufferToBuffer');
    this.native.copyBufferToBuffer(
      asGPUBuffer(source, `${this.label}.copyBufferToBuffer(source)`),
      sourceOffset,
      asGPUBuffer(destination, `${this.label}.copyBufferToBuffer(destination)`),
      destinationOffset,
      size,
    );
  }

  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    this.assertRecording('copyBufferToTexture');
    this.native.copyBufferToTexture(
      {
        buffer: asGPUBuffer(source.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: source.offset ?? 0,
        bytesPerRow: source.bytesPerRow,
        rowsPerImage: source.rowsPerImage,
      },
      toGPUTexelCopyTextureInfo(destination, `${this.label}.copyBufferToTexture(destination)`),
      toGPUExtent3D(copySize),
    );
  }

  copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void {
    this.assertRecording('copyTextureToBuffer');
    this.native.copyTextureToBuffer(
      toGPUTexelCopyTextureInfo(source, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: asGPUBuffer(destination.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: destination.offset ?? 0,
        bytesPerRow: destination.bytesPerRow,
        rowsPerImage: destination.rowsPerImage,
      },
      toGPUExtent3D(copySize),
    );
  }

  copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    this.assertRecording('copyTextureToTexture');
    this.native.copyTextureToTexture(
      toGPUTexelCopyTextureInfo(source, `${this.label}.copyTextureToTexture(source)`),
      toGPUTexelCopyTextureInfo(destination, `${this.label}.copyTextureToTexture(destination)`),
      toGPUExtent3D(copySize),
    );
  }

  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(buffer: BufferLike, offset = 0, size?: number): void {
    this.assertRecording('clearBuffer');
    assertNonNegativeInteger(offset, `${this.label}.clearBuffer offset`);
    const resolvedSize = size ?? buffer.size - offset;
    if (offset % 4 !== 0) {
      throw new ValidationError(
        `[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${offset}.`,
      );
    }
    if (resolvedSize <= 0) {
      throw new ValidationError(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${resolvedSize}.`,
      );
    }
    if (resolvedSize % 4 !== 0) {
      throw new ValidationError(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${resolvedSize}.`,
      );
    }
    if (offset + resolvedSize > buffer.size) {
      throw new ValidationError(
        `[gpu-device-api] ${this.label}.clearBuffer: range [${offset}, ${offset + resolvedSize}) exceeds the ` +
          `buffer size ${buffer.size}.`,
      );
    }
    this.native.clearBuffer(
      asGPUBuffer(buffer, `${this.label}.clearBuffer`),
      offset,
      resolvedSize,
    );
  }

  /**
   * 结束录制并返回 command buffer。
   *
   * 如果有 pass 还开着，会先隐式 `end()` —— 与 WebGPU 原生的 `finish()` 行为一致
   * （否则留在录制中的 pass 会被静默丢弃）。
   */
  finish(): CommandBuffer {
    this.assertRecording('finish');
    this.closeOpenPass();
    this._finished = true;
    return new WebGPUCommandBuffer(this.label, this.native.finish());
  }

  /** 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。 */
  dispose(): void {
    this._disposed = true;
  }

  private closeOpenPass(): void {
    if (this.openPass && !this.openPass.ended) {
      this.openPass.end();
    }
    this.openPass = null;
  }

  private assertRecording(context: string): void {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] CommandEncoder "${this.label}".${context}: already disposed.`);
    }
    if (this._finished) {
      throw new ValidationError(
        `[gpu-device-api] CommandEncoder "${this.label}".${context}: the encoder has already been finished.`,
      );
    }
  }
}

/** 已录制的命令缓冲区。对应 WebGPU 的 `GPUCommandBuffer`。 */
export class WebGPUCommandBuffer implements CommandBuffer {
  readonly label: string;
  readonly native: GPUCommandBuffer;

  private _disposed = false;

  constructor(label: string, native: GPUCommandBuffer) {
    this.label = label;
    this.native = native;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** `GPUCommandBuffer` 没有 destroy；释放只是标记本包装对象不可用（提交后本身就不可复用）。 */
  dispose(): void {
    this._disposed = true;
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

/** 把任意 command buffer 表示收窄为原生 `GPUCommandBuffer`（供 queue.submit 使用）。 */
export function asGPUCommandBuffer(value: unknown, context: string): GPUCommandBuffer {
  if (value instanceof WebGPUCommandBuffer) return value.native;
  if (value && typeof value === 'object' && !('native' in (value as object))) {
    return value as GPUCommandBuffer;
  }
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native ` +
      `GPUCommandBuffer), got ${describeUnknown(value)}.`,
  );
}
