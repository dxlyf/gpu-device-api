import { ValidationError } from '../core/errors/index.js';

/**
 * Throws a {@link ValidationError} when `condition` is falsy.
 * Use it for cheap contract checks on public API boundaries.
 */
export function assert(
  condition: unknown,
  message: string,
  details?: Record<string, unknown>,
): asserts condition {
  if (!condition) throw new ValidationError(message, details ? { details } : {});
}

/** Narrows away `null`/`undefined`, throwing a {@link ValidationError} otherwise. */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  details?: Record<string, unknown>,
): T {
  if (value === null || value === undefined) {
    throw new ValidationError(message, details ? { details } : {});
  }
  return value;
}

/** Exhaustiveness helper for `switch` statements over union types. */
export function assertNever(value: never, message?: string): never {
  throw new ValidationError(message ?? `[gpu-device-api] Unexpected value: ${String(value)}`);
}

/** Validates that `value` is a positive safe integer (sizes, counts, strides...). */
export function assertPositiveInteger(value: number, name: string): void {
  assert(
    Number.isSafeInteger(value) && value > 0,
    `[gpu-device-api] ${name} must be a positive integer, got ${String(value)}.`,
  );
}

/** Validates that `value` is a non-negative safe integer (offsets, indices...). */
export function assertNonNegativeInteger(value: number, name: string): void {
  assert(
    Number.isSafeInteger(value) && value >= 0,
    `[gpu-device-api] ${name} must be a non-negative integer, got ${String(value)}.`,
  );
}

/** Validates that `value` is a power of two (sample counts, alignments...). */
export function assertPowerOfTwo(value: number, name: string): void {
  assert(
    Number.isSafeInteger(value) && value > 0 && (value & (value - 1)) === 0,
    `[gpu-device-api] ${name} must be a power of two, got ${String(value)}.`,
  );
}
