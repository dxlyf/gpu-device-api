import { GpuError, type GpuErrorOptions } from './GpuError.js';

export type DeviceLostReason = 'destroyed' | 'unknown';

/** 当 device 不再可用时抛出（或通过 `device.lost` 发出）。 */
export class DeviceLostError extends GpuError {
  readonly reason: DeviceLostReason;

  constructor(message: string, options: Omit<GpuErrorOptions, 'code'> & { reason?: DeviceLostReason } = {}) {
    super(message, { ...options, code: 'DEVICE_LOST' });
    this.name = 'DeviceLostError';
    this.reason = options.reason ?? 'unknown';
  }

  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected(): boolean {
    return this.reason === 'destroyed';
  }
}
