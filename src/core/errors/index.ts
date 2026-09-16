export { GpuError, isGpuError, type GpuErrorOptions } from './GpuError.js';
export { ValidationError } from './ValidationError.js';
export { OutOfMemoryError } from './OutOfMemoryError.js';
export { GPUInternalError } from './GPUInternalError.js';
export { DeviceLostError, type DeviceLostReason } from './DeviceLostError.js';
export {
  ERROR_SCOPE_FILTERS,
  assertErrorScopeFilter,
  isErrorScopeFilter,
  type ErrorScopeFilter,
  type ErrorScopeHandle,
} from './ErrorScope.js';
