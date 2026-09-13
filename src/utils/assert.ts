import { ValidationError } from '../core/errors/index.js';

/**
 * 当 `condition` 为假值时抛出 {@link ValidationError}。
 * 适合在公开 API 边界做低开销的契约检查。
 */
export function assert(
  condition: unknown,
  message: string,
  details?: Record<string, unknown>,
): asserts condition {
  if (!condition) throw new ValidationError(message, details ? { details } : {});
}

/** 排除 `null`/`undefined`，否则抛出 {@link ValidationError}。 */
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

/** 针对联合类型 `switch` 语句的穷尽性检查辅助函数。 */
export function assertNever(value: never, message?: string): never {
  throw new ValidationError(message ?? `[gpu-device-api] Unexpected value: ${String(value)}`);
}

/** 校验 `value` 为正的安全整数（尺寸、数量、stride 等）。 */
export function assertPositiveInteger(value: number, name: string): void {
  assert(
    Number.isSafeInteger(value) && value > 0,
    `[gpu-device-api] ${name} must be a positive integer, got ${String(value)}.`,
  );
}

/** 校验 `value` 为非负的安全整数（offset、index 等）。 */
export function assertNonNegativeInteger(value: number, name: string): void {
  assert(
    Number.isSafeInteger(value) && value >= 0,
    `[gpu-device-api] ${name} must be a non-negative integer, got ${String(value)}.`,
  );
}

/** 校验 `value` 为 2 的幂（采样数、对齐等）。 */
export function assertPowerOfTwo(value: number, name: string): void {
  assert(
    Number.isSafeInteger(value) && value > 0 && (value & (value - 1)) === 0,
    `[gpu-device-api] ${name} must be a power of two, got ${String(value)}.`,
  );
}
