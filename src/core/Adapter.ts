/**
 * 一块物理或模拟的 GPU，可以创建出 {@link Device}。
 *
 * WebGPU 后端封装 `GPUAdapter`；WebGL2 后端根据其所能创建的 canvas context 的能力
 * 合成一个 adapter。上层只会看到这个接口，因此
 * `createDevice({ backend: 'auto' })` 可以从 WebGPU 透明地回退到 WebGL2。
 */

import type { Device, DeviceDescriptor, DeviceLimits } from './Device.js';

/** 设备所属的渲染后端。 */
export type BackendKind = 'webgl2' | 'webgpu';

/** adapter 的可读标识信息，供调试工具展示。 */
export interface AdapterInfo {
  readonly backend: BackendKind;
  readonly vendor: string;
  readonly architecture: string;
  readonly device: string;
  readonly description: string;
  /** 当实现为软件光栅化器时为 true。 */
  readonly isFallbackAdapter: boolean;
}

export interface Adapter {
  readonly info: AdapterInfo;
  /** adapter 支持的特性名称；参见 `DeviceFeatures`。 */
  readonly features: ReadonlySet<string>;
  /** adapter 级别的 limits。请求设备时不会超出这些值。 */
  readonly limits: DeviceLimits;

  /**
   * 创建一个逻辑设备。当 `descriptor.requiredFeatures` / `requiredLimits` 要求的
   * 超过 adapter 所能提供的范围时，会抛出 `ValidationError`，而不是静默降级。
   */
  requestDevice(descriptor?: DeviceDescriptor): Promise<Device>;
}

/** 便于遥测与错误信息使用的标签。 */
export function describeAdapter(info: AdapterInfo): string {
  const fallback = info.isFallbackAdapter ? ' (fallback)' : '';
  return `${info.backend}: ${info.device || info.vendor || 'unknown'}${fallback}`;
}
