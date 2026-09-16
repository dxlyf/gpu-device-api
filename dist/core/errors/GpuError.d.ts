/**
 * 库中所有错误的基类。后端会把各自的原生失败
 * （GL 错误码、WebGPU validation/out-of-memory/device-lost）转换到这套层级中，
 * 这样用户代码无需按后端分支处理。
 */
export interface GpuErrorOptions {
    /** 稳定的机器可读标识符，例如 `VALIDATION_ERROR`。 */
    code?: string;
    /** 为调试附加的自由格式详细信息（绝不用于控制流）。 */
    details?: Record<string, unknown>;
    /** 底层错误（如果有）。 */
    cause?: unknown;
}
export declare class GpuError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown>;
    constructor(message: string, options?: GpuErrorOptions);
    /** 包含错误码的单行描述，便于日志输出。 */
    toString(): string;
}
export declare function isGpuError(value: unknown): value is GpuError;
//# sourceMappingURL=GpuError.d.ts.map