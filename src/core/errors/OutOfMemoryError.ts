import { GpuError, type GpuErrorOptions } from './GpuError.js';

/** 无法满足分配时抛出（buffer/texture 过大、池已耗尽）。 */
export class OutOfMemoryError extends GpuError {
  constructor(message: string, options: Omit<GpuErrorOptions, 'code'> = {}) {
    super(message, { ...options, code: 'OUT_OF_MEMORY' });
    this.name = 'OutOfMemoryError';
  }
}
