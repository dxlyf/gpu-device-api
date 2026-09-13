/** Typed array detection and byte-level helpers used by both backends. */

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

/** Byte size of a view, or the number itself when already a byte count. */
export function byteLengthOf(value: ArrayBufferView | ArrayBuffer | number): number {
  if (typeof value === 'number') return value;
  if (value instanceof ArrayBuffer) return value.byteLength;
  return value.byteLength;
}

/** A `Uint8Array` alias over the exact memory of `view` (no copy). */
export function toUint8View(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

/** Rounds `value` up to the next multiple of `alignment`. */
export function alignTo(value: number, alignment: number): number {
  if (alignment <= 1) return value;
  return Math.ceil(value / alignment) * alignment;
}

export function alignTo4(value: number): number {
  return (value + 3) & ~3;
}

/**
 * Copies `source` bytes into a new zero-filled `Uint8Array` whose length is `source.byteLength`
 * rounded up to `alignment`. WebGPU requires buffer writes and buffer sizes to be 4-byte aligned,
 * so narrow payloads (uint16 indices, `unorm8x2` attributes) go through here.
 */
export function paddedCopy(source: ArrayBufferView, alignment = 4): Uint8Array {
  const bytes = toUint8View(source);
  const size = alignTo(bytes.byteLength, alignment);
  if (size === bytes.byteLength) return bytes;
  const target = new Uint8Array(size);
  target.set(bytes);
  return target;
}

/** Element size in bytes for any typed array instance. */
export function typedArrayElementSize(view: ArrayBufferView): number {
  return (view as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT ?? 1;
}

/** Concatenates typed arrays of the same kind into a single array of that kind. */
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
