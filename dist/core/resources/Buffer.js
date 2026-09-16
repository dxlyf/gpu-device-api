/** GPU buffer 资源。对应 WebGPU 的 `GPUBuffer`。 */
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
export function asByteView(range) {
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
    if (range instanceof Uint8Array)
        return range;
    return new Uint8Array(range);
}
//# sourceMappingURL=Buffer.js.map