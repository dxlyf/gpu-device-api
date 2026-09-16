/**
 * 当 `condition` 为假值时抛出 {@link ValidationError}。
 * 适合在公开 API 边界做低开销的契约检查。
 */
export declare function assert(condition: unknown, message: string, details?: Record<string, unknown>): asserts condition;
/** 排除 `null`/`undefined`，否则抛出 {@link ValidationError}。 */
export declare function assertDefined<T>(value: T | null | undefined, message: string, details?: Record<string, unknown>): T;
/** 针对联合类型 `switch` 语句的穷尽性检查辅助函数。 */
export declare function assertNever(value: never, message?: string): never;
/** 校验 `value` 为正的安全整数（尺寸、数量、stride 等）。 */
export declare function assertPositiveInteger(value: number, name: string): void;
/** 校验 `value` 为非负的安全整数（offset、index 等）。 */
export declare function assertNonNegativeInteger(value: number, name: string): void;
/** 校验 `value` 为 2 的幂（采样数、对齐等）。 */
export declare function assertPowerOfTwo(value: number, name: string): void;
//# sourceMappingURL=assert.d.ts.map