import { GpuError } from './GpuError.js';
/** 无法满足分配时抛出（buffer/texture 过大、池已耗尽）。 */
export class OutOfMemoryError extends GpuError {
    constructor(message, options = {}) {
        super(message, { ...options, code: 'OUT_OF_MEMORY' });
        this.name = 'OutOfMemoryError';
    }
}
//# sourceMappingURL=OutOfMemoryError.js.map