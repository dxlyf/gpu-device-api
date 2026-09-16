/** 两个后端共用的 typed array 检测与字节级辅助函数。 */
export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export declare function isTypedArray(value: unknown): value is TypedArray;
export declare function isArrayBufferView(value: unknown): value is ArrayBufferView;
/** 视图的字节大小；若传入的本身已是字节数，则原样返回。 */
export declare function byteLengthOf(value: ArrayBufferView | ArrayBuffer | number): number;
/** 覆盖 `view` 同一段内存的 `Uint8Array` 别名（不拷贝）。 */
export declare function toUint8View(view: ArrayBufferView): Uint8Array;
/** 将 `value` 向上取整到 `alignment` 的下一个倍数。 */
export declare function alignTo(value: number, alignment: number): number;
export declare function alignTo4(value: number): number;
/**
 * 将 `source` 的字节拷贝到新的、以零填充的 `Uint8Array` 中，其长度为 `source.byteLength`
 * 向上对齐到 `alignment`。WebGPU 要求 buffer 写入和 buffer 大小按 4 字节对齐，
 * 因此窄载荷（uint16 索引、`unorm8x2` 属性）都经过这里处理。
 */
export declare function paddedCopy(source: ArrayBufferView, alignment?: number): Uint8Array;
/** 任意 typed array 实例的元素字节大小。 */
export declare function typedArrayElementSize(view: ArrayBufferView): number;
/** 将同类型的多个 typed array 拼接为单个同类型数组。 */
export declare function concatTypedArrays<T extends TypedArray>(arrays: readonly T[]): T;
//# sourceMappingURL=typedArray.d.ts.map