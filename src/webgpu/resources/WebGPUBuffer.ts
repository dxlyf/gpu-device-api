/**
 * WebGPU buffer 资源：`Buffer` 接口在 `GPUBuffer` 上的实现。
 *
 * WebGPU 的硬性约束在这里被提前拦住：`size` 必须是 4 的倍数、必须大于零、
 * 不能同时请求 `MapRead` 与 `MapWrite`。映射状态（`mapped`）由本类维护，
 * 使得在错误时机访问映射范围时能给出可读的报错，而不是 WebGPU 的通用校验失败。
 */

import type { Buffer, BufferDescriptor, MapMode, MappedRange } from '../../core/resources/Buffer.js';
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
   * `mapAsync` 时向原生取到的**整段映射内存**（`GPUBuffer.getMappedRange()` 的返回值）。
   *
   * 必须记下来，两个原因：
   *
   * 1. WebGPU 规定同一个映射范围只能被原生 `getMappedRange()` 取一次，重复取（哪怕完全
   *    相同的范围）都会以「与已返回的范围重叠」报错，而 core 的 `Buffer` 契约是
   *    「`mapAsync` 以映射范围 resolve，`getMappedRange` 再取当前映射范围」——
   *    两个方法都要能用（WebGL2 后端就是这样）。所以这里自己记着已经交出去的那一块内存，
   *    后续一律在它上面建视图，不再往原生对象上问第二遍。
   * 2. 它是原生返回的、指向**映射内存**的 `ArrayBuffer`：在它上面建 TypedArray 视图就是
   *    「不拷贝地访问映射内存」，写入自然落到 buffer 上。
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
   * WebGPU 的 `mapAsync` 本身只 resolve 一个 `undefined`，因此这里在映射完成后立即调用原生
   * `getMappedRange()`，把它返回的**映射内存**交给上层 —— 那是视图而不是副本，写入会真正落到
   * buffer 上（`unmap()` 时刷给 GPU）。
   *
   * ## 传给原生的 `offset` 是**绝对偏移量**（这一点必须按实现实测，不能想当然）
   *
   * 规范的 `GPUBuffer.getMappedRange(offset, size)` 里 `offset` 是**相对 buffer 起点**的字节偏移
   * （2024 年规范原文：`Offset in bytes into the buffer to return buffer contents from`），
   * 且必须落在本次映射范围之内。Chrome 实测（无头 Chrome + `--enable-unsafe-webgpu`，Intel 适配器）：
   *
   * | 调用 | 结果 |
   * | --- | --- |
   * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(16, 32)` | OK |
   * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(0, 32)` | OperationError |
   * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(8, 4)` | OperationError（8 在映射范围之前） |
   *
   * 所以这里传的是 `mapAsync()` 收到的那个绝对 `offset`（与旧实现一致），而不是 0；
   * 传 0 在 `offset > 0` 时会直接报错。本类对外的 `getMappedRange(offset, size)` 则采用
   * 「相对映射起点」的约定（与 WebGL2 后端一致，见 {@link WebGPUBuffer.getMappedRange}），
   * 两者之间的平移只发生在这一处。
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
   * 当前已映射的范围里的一段（`offset` 相对映射起点，与 WebGL2 后端一致）。
   *
   * ## 返回的是视图，不是副本
   *
   * - 整段范围：直接返回 `mapAsync()` 给出去的那个 `ArrayBuffer`（原生映射内存本身）；
   * - 部分范围：返回**建在同一块内存上的 `Uint8Array` 视图**（`new Uint8Array(data, offset, size)`）。
   *
   * 绝不使用 `slice()`：那是拷贝，写进去的数据在 `unmap()` 时不会被上传 —— 这正是本次修复
   * 掉的缺陷（`mapAsync('write')` → `getMappedRange(offset, size)` → 写 → `unmap()` 静默失效）。
   *
   * ## 为什么不去问原生要子范围
   *
   * 原生 `getMappedRange()` 的每一段范围只能取一次，与已返回的范围重叠即报错；而 `mapAsync()`
   * 已经取走了整段映射内存，再取任何子范围都与之重叠（原生还会拒绝映射范围以外的偏移量）。
   * 所以子范围一律在已取到的那块内存上建视图 —— `data` 就是映射内存本身，视图是它的别名，
   * 重复调用同一段范围（`getMappedRange(4, 4)` 两次）也一定拿到 `view.buffer` 相同的视图，
   * 而不是各拿一份副本。
   *
   * 注意本方法的 `offset` 与原生不同：**这里相对映射起点**（`mapAsync()` 的 `offset`），
   * 原生则相对 buffer 起点（见 {@link WebGPUBuffer.mapAsync} 的实测表格）。因为建视图不需要
   * 再调原生，这个平移只在 `mapAsync()` 里发生一次。
   *
   * ## 生命周期（与原生一致）
   *
   * `unmap()` 会让原生映射内存 detach，之前取出的 `ArrayBuffer` 与建在它上面的视图一起失效：
   * `byteLength` / `length` 变成 0，读元素得到 `undefined`，写元素被**静默忽略**
   * （越界写按规范就是空操作），只有真正触碰底层内存的调用（`slice()` 等）会抛 `TypeError`。
   * 因此调用方必须在 `unmap()` **之前**把要留下的数据拷出来（`range.slice()`）；
   * `unmap()` 之后再访问这些视图是未定义行为，本库不保证任何结果。
   */
  getMappedRange(offset = 0, size?: number): MappedRange {
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
    return new Uint8Array(mapped.data, offset, mapSize);
  }

  /**
   * 结束映射：`'write'` 映射会在此把 CPU 侧的改动刷给 GPU，`'read'` 映射在此释放映射内存。
   *
   * 原生 `unmap()` 同时会 detach 掉之前 `getMappedRange()` 返回的映射内存，所以本类交出去的
   * `ArrayBuffer` 与它上面的视图在调用之后就失效了（见 {@link WebGPUBuffer.getMappedRange}）。
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
    // 通知设备取消追踪，否则每帧 create/destroy 的 buffer 包装对象会一直留在设备集合里。
    this.device.untrack(this);
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
