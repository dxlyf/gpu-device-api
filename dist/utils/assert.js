import { ValidationError } from '../core/errors/index.js';
/**
 * 当 `condition` 为假值时抛出 {@link ValidationError}。
 * 适合在公开 API 边界做低开销的契约检查。
 */
export function assert(condition, message, details) {
    if (!condition)
        throw new ValidationError(message, details ? { details } : {});
}
/** 排除 `null`/`undefined`，否则抛出 {@link ValidationError}。 */
export function assertDefined(value, message, details) {
    if (value === null || value === undefined) {
        throw new ValidationError(message, details ? { details } : {});
    }
    return value;
}
/** 针对联合类型 `switch` 语句的穷尽性检查辅助函数。 */
export function assertNever(value, message) {
    throw new ValidationError(message ?? `[gpu-device-api] Unexpected value: ${String(value)}`);
}
/** 校验 `value` 为正的安全整数（尺寸、数量、stride 等）。 */
export function assertPositiveInteger(value, name) {
    assert(Number.isSafeInteger(value) && value > 0, `[gpu-device-api] ${name} must be a positive integer, got ${String(value)}.`);
}
/** 校验 `value` 为非负的安全整数（offset、index 等）。 */
export function assertNonNegativeInteger(value, name) {
    assert(Number.isSafeInteger(value) && value >= 0, `[gpu-device-api] ${name} must be a non-negative integer, got ${String(value)}.`);
}
/** 校验 `value` 为 2 的幂（采样数、对齐等）。 */
export function assertPowerOfTwo(value, name) {
    assert(Number.isSafeInteger(value) && value > 0 && (value & (value - 1)) === 0, `[gpu-device-api] ${name} must be a power of two, got ${String(value)}.`);
}
//# sourceMappingURL=assert.js.map