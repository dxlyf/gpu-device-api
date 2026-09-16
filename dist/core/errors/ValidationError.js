import { GpuError } from './GpuError.js';
/** 当描述符、参数或状态转换违反 API 契约时抛出。 */
export class ValidationError extends GpuError {
    constructor(message, options = {}) {
        super(message, { ...options, code: 'VALIDATION_ERROR' });
        this.name = 'ValidationError';
    }
}
//# sourceMappingURL=ValidationError.js.map