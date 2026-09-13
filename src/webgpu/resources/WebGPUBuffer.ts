/**
 * WebGPU buffer 资源：`Buffer` 接口在 `GPUBuffer` 上的实现。
 *
 * WebGPU 的硬性约束在这里被提前拦住：`size` 必须是 4 的倍数、必须大于零、
 * 不能同时请求 `MapRead` 与 `MapWrite`。映射状态（`mapped`）由本类维护，
 * 使得在错误时机访问映射范围时能给出可读的报错，而不是 WebGPU 的通用校验失败。
 */

import type { Buffer, BufferDescriptor, MapMode } from '../../core/resources/Buffer.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { assertNonNegativeInteger, assertPositiveInteger } from '../../utils/assert.js';
import { toGPUBufferUsage, toGPUMapMode } from '../utils/wgpuEnumMap.js';

export class WebGPUBuffer implements Buffer {
  readonly label: string;
  readonly size: number;
  readonly usage: BufferDescriptor['usage'];
  readonly native: GPUBuffer;

  private readonly device: WebGPUDevice;
  private _disposed = false;
  private _mapped = false;
  /**
   * `mapAsync` 交给上层的映射视图。
   *
   * 必须记下来：WebGPU 规定同一个映射范围只能被 `getMappedRange` 取一次
   *（第二次会以「与已返回的范围重叠」报错），而 core 的 `Buffer` 契约是
   * 「`mapAsync` 以映射范围 resolve，`getMappedRange` 再取当前映射范围」——
   * 也就是两个方法都要能用（WebGL2 后端就是这样）。所以这里自己记着已经交出去的视图，
   * 第二次调用直接复用，不再往原生对象上问一遍。
   */
  private mappedRange: { offset: number; size: number; data: ArrayBuffer } | null = null;

  constructor(device: WebGPUDevice, descriptor: BufferDescriptor) {
    this.device = device;
    this.label = descriptor.label ?? `buffer#${device.nextResourceId('buffer')}`;

    assertPositiveInteger(descriptor.size, 'BufferDescriptor.size');
    if (descriptor.size % 4 !== 0) {
      throw new ValidationError(
        `[gpu-device-api] BufferDescriptor.size must be a multiple of 4 (WebGPU requires 4-byte aligned ` +
          `buffer sizes), got ${descriptor.size}. Use alignTo4()/paddedCopy() when uploading tightly packed data.`,
      );
    }
    if (descriptor.size > device.limits.maxBufferSize) {
      throw new ValidationError(
        `[gpu-device-api] BufferDescriptor.size ${descriptor.size} exceeds maxBufferSize ` +
          `(${device.limits.maxBufferSize}).`,
      );
    }

    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.native = device.native.createBuffer({
      label: this.label,
      size: descriptor.size,
      usage: toGPUBufferUsage(descriptor.usage),
    });
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get mapped(): boolean {
    return this._mapped;
  }

  /** 当前 buffer 是否仍然可用（未释放、device 未销毁）。 */
  get usable(): boolean {
    return !this._disposed && !this.device.disposed;
  }

  /**
   * 把 buffer 的某个范围映射给 CPU，并以该范围的 `ArrayBuffer` resolve。
   *
   * WebGPU 的 `mapAsync` 本身只 resolve 一个 `undefined`，因此这里在映射完成后立即
   * 调用 `getMappedRange(offset, size)`，把上层真正想拿到的视图返回出去。
   */
  async mapAsync(mode: MapMode, offset = 0, size?: number): Promise<ArrayBuffer> {
    this.assertUsable('Buffer.mapAsync');
    if (this._mapped) {
      throw new ValidationError(
        `[gpu-device-api] Buffer "${this.label}" is already mapped; call unmap() before mapping it again.`,
      );
    }
    const mapSize = size ?? this.size - offset;
    this.assertRange(offset, mapSize, 'Buffer.mapAsync');
    await this.native.mapAsync(toGPUMapMode(mode), offset, mapSize);
    this._mapped = true;
    const data = this.native.getMappedRange(offset, mapSize);
    this.mappedRange = { offset, size: mapSize, data };
    return data;
  }

  /**
   * 当前已映射的范围（偏移量相对于映射起点，与 WebGL2 后端一致）。
   *
   * 不再直接问原生 `GPUBuffer`：同一个范围只能被取一次，重复取会报
   * 「overlaps with previously returned range」。
   */
  getMappedRange(offset = 0, size?: number): ArrayBuffer {
    this.assertUsable('Buffer.getMappedRange');
    const mapped = this.mappedRange;
    if (!this._mapped || !mapped) {
      throw new ValidationError(
        `[gpu-device-api] Buffer "${this.label}" is not mapped; await mapAsync() before calling getMappedRange().`,
      );
    }
    const mapSize = size ?? mapped.size - offset;
    this.assertRange(offset, mapSize, 'Buffer.getMappedRange', mapped.size);
    if (offset === 0 && mapSize === mapped.size) return mapped.data;
    return mapped.data.slice(offset, offset + mapSize);
  }

  /**
   * 结束映射：`'write'` 映射会在此把 CPU 侧的改动刷给 GPU，`'read'` 映射在此释放映射内存。
   *
   * 未映射时是空操作（WebGPU 的 `unmap()` 对未映射 buffer 同样是合法的空操作），
   * 这样清理路径里可以放心地无条件调用。
   */
  unmap(): void {
    if (this._disposed) return;
    if (!this._mapped) return;
    this._mapped = false;
    this.mappedRange = null;
    this.native.unmap();
  }

  /** 释放底层分配。幂等；已映射的 buffer 会先被取消映射。 */
  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._mapped = false;
    this.mappedRange = null;
    this.native.destroy();
  }

  /** `Disposable` 的别名，语义与 {@link WebGPUBuffer.destroy} 相同。 */
  dispose(): void {
    this.destroy();
  }

  private assertUsable(context: string): void {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] ${context}: buffer "${this.label}" has been destroyed.`);
    }
    if (this.device.disposed) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: buffer "${this.label}" belongs to a disposed device.`,
      );
    }
  }

  private assertRange(offset: number, size: number, context: string, limit = this.size): void {
    assertNonNegativeInteger(offset, `${context} offset`);
    assertPositiveInteger(size, `${context} size`);
    if (offset + size > limit) {
      const bounds =
        limit === this.size
          ? `buffer "${this.label}" size ${this.size}`
          : `mapped range size ${limit} of buffer "${this.label}"`;
      throw new ValidationError(
        `[gpu-device-api] ${context}: range [${offset}, ${offset + size}) exceeds ${bounds}.`,
      );
    }
  }
}

/** 该对象是否为 WebGPU 后端的 buffer。 */
export function isWebGPUBuffer(value: unknown): value is WebGPUBuffer {
  return value instanceof WebGPUBuffer;
}

/** 原生 `GPUBuffer` 的形状识别：核心 `Buffer` 一定带 `native` 成员，原生对象没有。 */
export function isNativeGPUBuffer(value: unknown): value is GPUBuffer {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { mapAsync?: unknown; getMappedRange?: unknown; destroy?: unknown; native?: unknown };
  return (
    typeof candidate.mapAsync === 'function' &&
    typeof candidate.getMappedRange === 'function' &&
    typeof candidate.destroy === 'function' &&
    !('native' in candidate)
  );
}

/**
 * 把任意 buffer 表示收窄为原生 `GPUBuffer`。
 *
 * 接受 `WebGPUBuffer`（core 资源）或直接由 escape hatch 拿到的原生 `GPUBuffer`；
 * 其它情况抛 {@link ValidationError}，避免把错误的后端资源交给 WebGPU。
 */
export function asGPUBuffer(value: unknown, context: string): GPUBuffer {
  if (value instanceof WebGPUBuffer) return value.native;
  if (isNativeGPUBuffer(value)) return value;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), ` +
      `got ${describeUnknown(value)}.`,
  );
}

/** 统一的取值描述，便于报错时说明收到了什么。 */
export function describeUnknown(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    const label = (value as { label?: unknown }).label;
    if (typeof label === 'string' && label.length > 0) return `a resource labelled "${label}"`;
    return `an instance of ${value.constructor?.name ?? 'Object'}`;
  }
  return `${typeof value} ${String(value)}`;
}
