/**
 * A physical or emulated GPU that can produce a {@link Device}.
 *
 * The WebGPU backend wraps `GPUAdapter`; the WebGL2 backend synthesises an adapter from the
 * capabilities of the context it can create. Upper layers only ever see this interface, so
 * `createDevice({ backend: 'auto' })` can fall back from WebGPU to WebGL2 transparently.
 */

import type { Device, DeviceDescriptor, DeviceLimits } from './Device.js';

/** Which rendering backend a device belongs to. */
export type BackendKind = 'webgl2' | 'webgpu';

/** Human readable identification of the adapter, shown by debug tooling. */
export interface AdapterInfo {
  readonly backend: BackendKind;
  readonly vendor: string;
  readonly architecture: string;
  readonly device: string;
  readonly description: string;
  /** True when the implementation is a software rasteriser. */
  readonly isFallbackAdapter: boolean;
}

export interface Adapter {
  readonly info: AdapterInfo;
  /** Feature names the adapter supports; see `DeviceFeatures`. */
  readonly features: ReadonlySet<string>;
  /** Adapter level limits. Requesting a device never exceeds these. */
  readonly limits: DeviceLimits;

  /**
   * Creates a logical device. When `descriptor.requiredFeatures` / `requiredLimits` ask for more
   * than the adapter offers, a `ValidationError` is thrown instead of silently downgrading.
   */
  requestDevice(descriptor?: DeviceDescriptor): Promise<Device>;
}

/** Convenience label for telemetry and error messages. */
export function describeAdapter(info: AdapterInfo): string {
  const fallback = info.isFallbackAdapter ? ' (fallback)' : '';
  return `${info.backend}: ${info.device || info.vendor || 'unknown'}${fallback}`;
}
