import { GpuError, type GpuErrorOptions } from './GpuError.js';

/** Raised when an allocation cannot be satisfied (buffer/texture too large, pool exhausted). */
export class OutOfMemoryError extends GpuError {
  constructor(message: string, options: Omit<GpuErrorOptions, 'code'> = {}) {
    super(message, { ...options, code: 'OUT_OF_MEMORY' });
    this.name = 'OutOfMemoryError';
  }
}
