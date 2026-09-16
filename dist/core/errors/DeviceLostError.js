import { GpuError } from './GpuError.js';
/** 当 device 不再可用时抛出（或通过 `device.lost` 发出）。 */
export class DeviceLostError extends GpuError {
    reason;
    constructor(message, options = {}) {
        super(message, { ...options, code: 'DEVICE_LOST' });
        this.name = 'DeviceLostError';
        this.reason = options.reason ?? 'unknown';
    }
    /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
    get isExpected() {
        return this.reason === 'destroyed';
    }
}
//# sourceMappingURL=DeviceLostError.js.map