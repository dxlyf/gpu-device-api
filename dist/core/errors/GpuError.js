export class GpuError extends Error {
    code;
    details;
    constructor(message, options = {}) {
        super(message, options.cause === undefined ? undefined : { cause: options.cause });
        this.name = 'GpuError';
        this.code = options.code ?? 'GPU_ERROR';
        if (options.details)
            this.details = options.details;
    }
    /** 包含错误码的单行描述，便于日志输出。 */
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
export function isGpuError(value) {
    return value instanceof GpuError;
}
//# sourceMappingURL=GpuError.js.map