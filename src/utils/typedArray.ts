/** 两个后端共用的 typed array 检测与字节级辅助函数。 */

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

const TYPED_ARRAY_CTORS = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
];

export function isTypedArray(value: unknown): value is TypedArray {
  return TYPED_ARRAY_CTORS.some((ctor) => value instanceof ctor);
}

export function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/** 视图的字节大小；若传入的本身已是字节数，则原样返回。 */
export function byteLengthOf(value: ArrayBufferView | ArrayBuffer | number): number {
  if (typeof value === 'number') return value;
  if (value instanceof ArrayBuffer) return value.byteLength;
  return value.byteLength;
}

/** 覆盖 `view` 同一段内存的 `Uint8Array` 别名（不拷贝）。 */
export function toUint8View(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

/** 将 `value` 向上取整到 `alignment` 的下一个倍数。 */
export function alignTo(value: number, alignment: number): number {
  if (alignment <= 1) return value;
  return Math.ceil(value / alignment) * alignment;
}

export function alignTo4(value: number): number {
  return (value + 3) & ~3;
}

/**
 * 将 `source` 的字节拷贝到新的、以零填充的 `Uint8Array` 中，其长度为 `source.byteLength`
 * 向上对齐到 `alignment`。WebGPU 要求 buffer 写入和 buffer 大小按 4 字节对齐，
 * 因此窄载荷（uint16 索引、`unorm8x2` 属性）都经过这里处理。
 */
export function paddedCopy(source: ArrayBufferView, alignment = 4): Uint8Array {
  const bytes = toUint8View(source);
  const size = alignTo(bytes.byteLength, alignment);
  if (size === bytes.byteLength) return bytes;
  const target = new Uint8Array(size);
  target.set(bytes);
  return target;
}

/** 任意 typed array 实例的元素字节大小。 */
export function typedArrayElementSize(view: ArrayBufferView): number {
  return (view as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT ?? 1;
}

/** 将同类型的多个 typed array 拼接为单个同类型数组。 */
export function concatTypedArrays<T extends TypedArray>(arrays: readonly T[]): T {
  if (arrays.length === 0) throw new RangeError('[gpu-device-api] concatTypedArrays() received no arrays.');
  const first = arrays[0]!;
  let total = 0;
  for (const array of arrays) total += array.length;
  const Ctor = first.constructor as new (length: number) => T;
  const result = new Ctor(total);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}
