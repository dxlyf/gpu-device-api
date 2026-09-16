import { GpuError, type GpuErrorOptions } from './GpuError.js';
export type DeviceLostReason = 'destroyed' | 'unknown';
/** 当 device 不再可用时抛出（或通过 `device.lost` 发出）。 */
export declare class DeviceLostError extends GpuError {
    readonly reason: DeviceLostReason;
    constructor(message: string, options?: Omit<GpuErrorOptions, 'code'> & {
        reason?: DeviceLostReason;
    });
    /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
    get isExpected(): boolean;
}
//# sourceMappingURL=DeviceLostError.d.ts.map