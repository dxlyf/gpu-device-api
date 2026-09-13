import { GpuError, type GpuErrorOptions } from './GpuError.js';

/** Raised when a descriptor, argument or state transition violates the API contract. */
export class ValidationError extends GpuError {
  constructor(message: string, options: Omit<GpuErrorOptions, 'code'> = {}) {
    super(message, { ...options, code: 'VALIDATION_ERROR' });
    this.name = 'ValidationError';
  }
}
