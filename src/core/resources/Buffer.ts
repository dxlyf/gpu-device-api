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

/**
 * 把 {@link MappedRange} 收成 `Uint8Array` 字节视图，**两种情况都不拷贝**。
 *
 * ## 为什么必须有这个 helper
 *
 * `getMappedRange()` 的返回类型是 `ArrayBuffer | Uint8Array`，于是下面这种「看起来显然」的
 * 写法是个**静默丢写入**的陷阱：
 *
 * ```ts
 * const view = new Uint8Array(buffer.getMappedRange(4, 4)); // ← range 是 Uint8Array 时
 * view.set([1, 2, 3, 4]);                                  //   这是逐元素「拷贝」！
 * buffer.unmap();                                          //   写进的是临时内存，buffer 没变
 * ```
 *
 * `new Uint8Array(arrayBuffer)` 是「在整块内存上建视图」，而 `new Uint8Array(typedArray)`
 * 是「把元素逐个复制进一块新内存」—— 同一个构造器、两种完全不同的语义，靠参数类型区分。
 * 本库刚修掉的正是同一类缺陷（两个后端原先在部分范围上用 `slice()` 返回副本，
 * 见 `94c4bf3` 与 `test/buffer-mapped-range.test.ts`），而上面这行会把那个缺陷换个位置重现。
 *
 * 所以这里把「正确地取字节视图」固化成一处实现：整段 `ArrayBuffer` 走视图构造，
 * 部分范围的 `Uint8Array` **原样返回**（它本身就是映射内存上的视图）。
 *
 * ```ts
 * await buffer.mapAsync('write');
 * asByteView(buffer.getMappedRange(4, 4)).set([1, 2, 3, 4]);
 * buffer.unmap(); // 数据真的落到 buffer 上
 * ```
 *
 * 生命周期仍然与 `unmap()` 绑定：`unmap()` 之后返回的视图会失效（见
 * {@link Buffer.getMappedRange} 的说明）。
 */
export function asByteView(range: MappedRange): Uint8Array {
  /*
   * 只判断 `instanceof Uint8Array` 就够了，而且**必须保持这么简单**：
   * 走到下面那行的 `range` 已经被 TS 收窄成 `ArrayBuffer`（`MappedRange` 只有两种可能），
   * 而 `new Uint8Array(arrayBuffer)` 是在整块内存上建视图、不是拷贝。
   *
   * 反过来，如果这里对「看起来像 TypedArray 但不是本 realm 的 Uint8Array」也做特判，
   * 就得依赖 `ArrayBuffer.isView()` 之类的运行时鸭子判断，而那种判断一旦判错就会掉进拷贝分支 ——
   * 用一点点跨 realm 的便利换回本文件要消灭的那个缺陷，不划算。跨 realm 的视图在
   * `getMappedRange()` 的契约里不会出现（映射内存由本库创建）。
   */
  if (range instanceof Uint8Array) return range;
  return new Uint8Array(range);
}
