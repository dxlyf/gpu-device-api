/**
 * Core layer: backend independent interfaces and vocabulary.
 *
 * Upper layers depend on this module only. The concrete backends (`../webgl2`, `../webgpu`)
 * implement it, and `../factories` selects between them.
 */

export * from './enums/index.js';
export * from './errors/index.js';
export * from './resources/index.js';
export * from './binding/index.js';
export * from './pipeline/index.js';
export * from './render/index.js';
export * from './sync/index.js';

export { describeAdapter, type Adapter, type AdapterInfo, type BackendKind } from './Adapter.js';
export {
  resolveLimits,
  type Device,
  type DeviceDescriptor,
  type DeviceFeatures,
  type DeviceLimits,
  type DeviceLostInfo,
} from './Device.js';
export {
  defaultPixelRatio,
  measureCanvas,
  type CanvasAlphaMode,
  type CanvasColorSpace,
  type CanvasConfig,
  type CanvasContext,
  type FrameTarget,
} from './CanvasContext.js';
