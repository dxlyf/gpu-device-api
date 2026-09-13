/**
 * Base class for every error raised by the library. Backends translate their native failures
 * (GL error codes, WebGPU validation/out-of-memory/device-lost) into this hierarchy so that user
 * code never has to branch on the backend.
 */
export interface GpuErrorOptions {
  /** Stable machine readable identifier, e.g. `VALIDATION_ERROR`. */
  code?: string;
  /** Free-form details attached for debugging (never used for control flow). */
  details?: Record<string, unknown>;
  /** The underlying error, if any. */
  cause?: unknown;
}

export class GpuError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: GpuErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'GpuError';
    this.code = options.code ?? 'GPU_ERROR';
    if (options.details) this.details = options.details;
  }

  /** Single-line description including the error code, useful for logs. */
  override toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}

export function isGpuError(value: unknown): value is GpuError {
  return value instanceof GpuError;
}
