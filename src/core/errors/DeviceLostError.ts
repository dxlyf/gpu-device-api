import { GpuError, type GpuErrorOptions } from './GpuError.js';

export type DeviceLostReason = 'destroyed' | 'unknown';

/** Raised (or emitted through `device.lost`) when the device can no longer be used. */
export class DeviceLostError extends GpuError {
  readonly reason: DeviceLostReason;

  constructor(message: string, options: Omit<GpuErrorOptions, 'code'> & { reason?: DeviceLostReason } = {}) {
    super(message, { ...options, code: 'DEVICE_LOST' });
    this.name = 'DeviceLostError';
    this.reason = options.reason ?? 'unknown';
  }

  /** A destroyed device is expected; an `unknown` loss usually means a driver reset. */
  get isExpected(): boolean {
    return this.reason === 'destroyed';
  }
}
