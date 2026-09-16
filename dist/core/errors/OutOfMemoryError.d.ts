import { GpuError, type GpuErrorOptions } from './GpuError.js';
/** 无法满足分配时抛出（buffer/texture 过大、池已耗尽）。 */
export declare class OutOfMemoryError extends GpuError {
    constructor(message: string, options?: Omit<GpuErrorOptions, 'code'>);
}
//# sourceMappingURL=OutOfMemoryError.d.ts.map