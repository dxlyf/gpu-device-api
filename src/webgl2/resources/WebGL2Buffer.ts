/**
 * WebGL2 buffer 资源。
 *
 * ## 绑定目标是「一次性定死」的
 *
 * WebGL2 规定：一个 buffer 的绑定目标在**第一次绑定时确定，之后不能更改**。
 * Chrome / ANGLE 的实现会拒绝这两种操作，并给出 INVALID_OPERATION：
 *
 * - `buffers bound to non ELEMENT_ARRAY_BUFFER targets can not be bound to ELEMENT_ARRAY_BUFFER target`
 * - `element array buffers can not be bound to a different target`
 *
 * 连「先绑 `COPY_WRITE_BUFFER`、再解绑成 null、再绑 `ELEMENT_ARRAY_BUFFER`」也不行 ——
 * 目标一旦确定就是永久的。曾经这里把**所有** buffer 都绑到 `COPY_WRITE_BUFFER` 上做分配与上传，
 * 于是索引缓冲再也无法绑到 `ELEMENT_ARRAY_BUFFER`：VAO 里没有索引缓冲，
 * `drawElements*` 直接报 INVALID_OPERATION，索引几何体一个像素都画不出来。
 *
 * 因此现在按 `usage` 在创建时选好目标（见 {@link bindingTarget}）：
 * 声明了 `BufferUsage.Index` 的 buffer 用 `ELEMENT_ARRAY_BUFFER`，其余用 `COPY_WRITE_BUFFER`。
 * 索引缓冲因此只能当索引缓冲用（WebGL2 确实做不到「一个 buffer 两种用途」），
 * 误用时后端会给出明确的错误而不是静默画不出东西。
 *
 * ## 读写路径
 *
 * GL 没有 WebGPU 那样的 buffer 映射：`mapAsync` / `getMappedRange` / `unmap` 这里用
 * **CPU 影子内存** 实现 ——
 * - `read`：立即用 `getBufferSubData` 读回一段内存；
 * - `write`：先分配一段内存，`unmap()` 时用 `bufferSubData` 上传。
 *
 * 因此 `unmap()` 在 WebGL2 上是**同步生效**的，而 WebGPU 是队列时序。这个差异只影响
 * 「同一帧里改同一块 buffer 再重复读回」这种极端用法，正常的上传/读回流程两者一致。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { BufferUsage } from '../../core/enums/BufferUsage.js';
import { assertNonNegativeInteger, assertPositiveInteger } from '../../utils/assert.js';
import { nextId } from '../../utils/id.js';
import type { Buffer, BufferDescriptor, MapMode } from '../../core/resources/Buffer.js';
import type { GlStateCache } from '../utils/glStateCache.js';

/** WebGL2 无法表达的 usage 位，创建时直接拦下。 */
const UNSUPPORTED_USAGE: readonly { flag: number; name: string; reason: string }[] = [
  {
    flag: BufferUsage.Storage,
    name: 'Storage',
    reason: 'shader storage buffer 需要 GLES 3.1，WebGL2 只有 GLES 3.0。请改用 uniform buffer 传数据。',
  },
  {
    flag: BufferUsage.Indirect,
    name: 'Indirect',
    reason: 'WebGL2 没有 indirect draw。请改用一次性的 uniform 数据 + 普通 draw 调用。',
  },
  {
    flag: BufferUsage.QueryResolve,
    name: 'QueryResolve',
    reason: 'WebGL2 的遮挡查询结果只能同步读回，没有查询结果缓冲区的概念。',
  },
];

interface MappedRange {
  mode: MapMode;
  offset: number;
  size: number;
  data: ArrayBuffer;
  /** `write` 模式在 `unmap` 时据此决定上传范围。 */
  dirty: boolean;
}

export class WebGL2Buffer implements Buffer {
  readonly label: string;
  readonly size: number;
  readonly usage: BufferUsage;
  readonly native: WebGLBuffer;
  /**
   * 该 buffer 的绑定目标（`ELEMENT_ARRAY_BUFFER` 或 `COPY_WRITE_BUFFER`）。
   *
   * WebGL2 里这个目标是**永久**的（见类注释），所以只能在创建时按 usage 定一次：
   * 声明了 `Index` 的 buffer 走 `ELEMENT_ARRAY_BUFFER`，其余走 `COPY_WRITE_BUFFER`。
   * 其它模块（拷贝、清空、读回）都必须通过 {@link upload} / {@link download} 操作，
   * 而不是自己往 `COPY_*` 目标上绑。
   */
  readonly bindingTarget: number;
  /** 进程内唯一标识，用于构建 VAO 缓存键（`label` 可能被使用者指定成重复值）。 */
  readonly id: string;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly onDestroy: (buffer: WebGL2Buffer) => void;
  /** 以 buffer 引用的形式登记 usage，便于调试时追踪（GL 本身不关心）。 */
  private readonly usages: BufferUsage;
  private mapping: MappedRange | null = null;
  private _disposed = false;

  constructor(
    gl: WebGL2RenderingContext,
    state: GlStateCache,
    descriptor: BufferDescriptor,
    onDestroy: (buffer: WebGL2Buffer) => void,
  ) {
    assertPositiveInteger(descriptor.size, 'BufferDescriptor.size');
    if (descriptor.size % 4 !== 0) {
      throw new ValidationError(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${descriptor.size}。` +
          '（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）',
      );
    }
    for (const unsupported of UNSUPPORTED_USAGE) {
      if ((descriptor.usage & unsupported.flag) !== 0) {
        throw new ValidationError(
          `[gpu-device-api] BufferUsage.${unsupported.name} 在 WebGL2 后端不可用：${unsupported.reason}`,
        );
      }
    }

    this.gl = gl;
    this.state = state;
    this.onDestroy = onDestroy;
    this.label = descriptor.label ?? nextId('buffer');
    this.id = nextId('buf');
    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.usages = descriptor.usage;
    // 目标必须在第一次绑定前定下来 —— 之后再想换已经不可能了。
    this.bindingTarget =
      (descriptor.usage & BufferUsage.Index) !== 0 ? gl.ELEMENT_ARRAY_BUFFER : gl.COPY_WRITE_BUFFER;

    const buffer = gl.createBuffer();
    if (!buffer) throw new ValidationError('[gpu-device-api] gl.createBuffer() 返回 null，无法分配 buffer。');
    this.native = buffer;

    // 先用 bufferData 一次性分配（内容未定义），后续用 bufferSubData 填充。
    this.withTarget(() => gl.bufferData(this.bindingTarget, descriptor.size, gl.DYNAMIC_DRAW));
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 该 buffer 是否被固定为索引缓冲（此时不能再当顶点/uniform/拷贝目标使用）。 */
  get isIndexBuffer(): boolean {
    return this.bindingTarget === this.gl.ELEMENT_ARRAY_BUFFER;
  }

  /** 该 buffer 创建时声明的 usage（只读，便于调试）。 */
  get usageFlags(): BufferUsage {
    return this.usages;
  }

  get mapped(): boolean {
    return this.mapping !== null;
  }

  async mapAsync(mode: MapMode, offset = 0, size = this.size - offset): Promise<ArrayBuffer> {
    this.assertUsable('mapAsync');
    if (this.mapping) {
      throw new ValidationError(`[gpu-device-api] buffer「${this.label}」已经处于映射状态，请先 unmap()。`);
    }
    assertNonNegativeInteger(offset, 'mapAsync 的 offset');
    assertPositiveInteger(size, 'mapAsync 的 size');
    if (offset % 4 !== 0) {
      throw new ValidationError(
        `[gpu-device-api] mapAsync 的 offset 必须是 4 的倍数，实际是 ${offset}。（WebGPU 要求 8 的倍数，这里按更宽松的 4 处理。）`,
      );
    }
    if (offset + size > this.size) {
      throw new ValidationError(
        `[gpu-device-api] mapAsync 的范围 [${offset}, ${offset + size}) 超出了 buffer 大小 ${this.size}。`,
      );
    }

    if (mode === 'read') {
      const data = new ArrayBuffer(size);
      this.download(offset, new Uint8Array(data));
      // read 映射在 GL 侧可以立即结束：数据已经在 CPU 内存里了。
      this.mapping = { mode, offset, size, data, dirty: false };
    } else {
      this.mapping = { mode, offset, size, data: new ArrayBuffer(size), dirty: true };
    }
    return this.mapping.data;
  }

  getMappedRange(offset = 0, size?: number): ArrayBuffer {
    const mapping = this.mapping;
    if (!mapping) {
      throw new ValidationError(
        `[gpu-device-api] buffer「${this.label}」尚未映射，请先 await mapAsync()。`,
      );
    }
    if (offset === 0 && size === undefined) return mapping.data;
    const length = size ?? mapping.size - offset;
    if (offset < 0 || length <= 0 || offset + length > mapping.size) {
      throw new ValidationError(
        `[gpu-device-api] getMappedRange(${offset}, ${length}) 超出已映射范围 ${mapping.size}。`,
      );
    }
    return mapping.data.slice(offset, offset + length);
  }

  unmap(): void {
    const mapping = this.mapping;
    if (!mapping) return;
    this.mapping = null;
    if (mapping.mode === 'write' && mapping.dirty) {
      this.upload(mapping.offset, new Uint8Array(mapping.data));
    }
  }

  /**
   * 直接上传一段数据（`Queue.writeBuffer` 与内部的拷贝/清空都走这里）。
   *
   * 必须用它而不是自己绑 `COPY_WRITE_BUFFER`：索引缓冲被固定在 `ELEMENT_ARRAY_BUFFER` 上，
   * 绑到别的目标会被 WebGL2 直接拒掉（见类注释）。
   */
  upload(offset: number, data: Uint8Array): void {
    this.withTarget(() => this.gl.bufferSubData(this.bindingTarget, offset, data));
  }

  /**
   * 读回一段数据（`Queue` 的同步读回、拷贝与映射读取都走这里）。
   *
   * `getBufferSubData` 接受任意 buffer 绑定目标，所以索引缓冲也能用 `ELEMENT_ARRAY_BUFFER` 读回。
   */
  download(offset: number, target: Uint8Array): void {
    this.withTarget(() => this.gl.getBufferSubData(this.bindingTarget, offset, target));
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.mapping = null;
    this.state.forgetUniformBuffer(this.native);
    this.state.forgetIndexBuffer(this.native);
    this.gl.deleteBuffer(this.native);
    this.onDestroy(this);
  }

  dispose(): void {
    this.destroy();
  }

  /**
   * 把本 buffer 绑到它唯一允许的绑定目标上，然后执行一段操作。
   *
   * `ELEMENT_ARRAY_BUFFER` 是 VAO 状态，所以那一路必须在默认 VAO 上操作并恢复原 VAO，
   * 否则会改掉当前 VAO 记录的索引缓冲（见 {@link GlStateCache.withDefaultVertexArray}）。
   */
  private withTarget<T>(action: () => T): T {
    if (this.bindingTarget === this.gl.COPY_WRITE_BUFFER) {
      this.state.bindCopyWriteBuffer(this.native);
      return action();
    }
    return this.state.withDefaultVertexArray(() => {
      this.state.bindIndexBuffer(this.native);
      return action();
    });
  }

  private assertUsable(operation: string): void {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] buffer「${this.label}」已销毁，不能再调用 ${operation}()。` +
          '这种情况通常是资源在 device.dispose() 之后仍被使用。',
      );
    }
  }
}
