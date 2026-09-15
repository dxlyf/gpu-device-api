/** GPU buffer 资源。对应 WebGPU 的 `GPUBuffer`。 */

import type { BufferUsage } from '../enums/BufferUsage.js';
import type { Disposable } from '../../utils/Disposable.js';

export interface BufferDescriptor {
  label?: string;
  /** 字节大小。必须大于零。 */
  size: number;
  usage: BufferUsage;
}

export type MapMode = 'read' | 'write';

/**
 * `getMappedRange()` 的返回值：**映射内存上的视图**，绝不是副本。
 *
 * - 整段映射范围返回 `ArrayBuffer` —— 就是 `mapAsync()` resolve 出来的那个对象；
 * - 部分范围返回建在同一块映射内存上的 `Uint8Array` 视图。
 *
 * 为什么是联合类型：`ArrayBuffer` 没有「子视图」这种 API（`slice()` 只会拷贝），
 * 想在 JS 里表达「同一块内存的一段」只能用 TypedArray 视图。之前两个后端都用 `slice()`
 * 返回拷贝，于是「`mapAsync('write')` → `getMappedRange(offset, size)` → 写 → `unmap()`」
 * 这条最常见的写入路径会**静默不生效**（写进了临时副本），因此这里把契约写死成视图语义。
 */
export type MappedRange = ArrayBuffer | Uint8Array;

export interface Buffer extends Disposable {
  readonly label: string;
  readonly size: number;
  readonly usage: BufferUsage;
  /** 原生句柄：WebGPU 上是 `GPUBuffer`，WebGL2 上是 `WebGLBuffer`。 */
  readonly native: unknown;

  /**
   * 将 buffer 映射给 CPU 访问，**以整段映射范围的 `ArrayBuffer` resolve**。
   *
   * 这个 `ArrayBuffer` 就是映射内存本身（不是拷贝），往里写会真正落到 buffer 上：
   * `'write'` 映射在 `unmap()` 时上传/刷新。WebGL2 用 CPU 影子 buffer 模拟 `write` 映射，
   * 并在 `unmap()` 时上传。
   */
  mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>;
  /**
   * 取当前映射范围里的一段。`offset` 相对**映射起点**（`mapAsync()` 的 `offset`），不是 buffer 起点。
   *
   * 返回的是映射内存上的**视图**（见 {@link MappedRange}），不是副本：通过它写数据会真正落到
   * buffer 上；同一段范围重复调用一定拿到指向**同一块内存**的视图（`view.buffer` 相同），
   * 因此 A 视图写入、B 视图立刻可见。
   *
   * 视图的生命周期与 `unmap()` 绑定：`unmap()` 之后底层 `ArrayBuffer` 会被 detach，已取出的视图随之
   * 失效 —— `length` / `byteLength` 变成 0，读元素得到 `undefined`，写元素被**静默忽略**，
   * 而任何真正触碰底层内存的操作（`slice()`、`new Uint8Array(view.buffer)`）会抛 `TypeError`。
   * 所以要在 `unmap()` **之前**把要留下的数据拷出来（例如 `range.slice()`）；`unmap()` 之后再用
   * 那些视图属于未定义行为，本库不保证任何结果。
   *
   * buffer 未映射、或范围超出映射范围时抛 `ValidationError`。
   */
  getMappedRange(offset?: number, size?: number): MappedRange;
  /** 刷新（write）或释放（read）映射，并让之前取出的映射视图失效（detach）。 */
  unmap(): void;
  readonly mapped: boolean;

  /** 释放底层分配。 */
  destroy(): void;
}
