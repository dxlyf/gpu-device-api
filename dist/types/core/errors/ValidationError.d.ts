import { GpuError, type GpuErrorOptions } from './GpuError.js';
/** 当描述符、参数或状态转换违反 API 契约时抛出。 */
export declare class ValidationError extends GpuError {
    constructor(message: string, options?: Omit<GpuErrorOptions, 'code'>);
}
//# sourceMappingURL=ValidationError.d.ts.map