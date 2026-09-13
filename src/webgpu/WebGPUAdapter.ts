/**
 * WebGPU adapter：`Adapter` 接口在 `GPUAdapter` 上的实现。
 *
 * 创建方式是静态的，因为拿到 `GPUAdapter` 本身是异步的：
 *
 * - `WebGPUAdapter.isSupported()` 同步判断环境有没有 WebGPU；
 * - `WebGPUAdapter.request(options)` 返回 `null` 表示「环境不支持 / 没有可用 adapter」，
 *   这是 `detectBackend` 需要的语义（静默回退到 WebGL2）；
 * - `WebGPUAdapter.create(options)` 在没有 adapter 时抛 {@link ValidationError}，
 *   这是「我明确要 WebGPU」时需要的语义。
 *
 * `requestDevice()` 会先用 core 的 `resolveLimits` 校验 `requiredLimits`（超出 adapter 能力
 * 直接报错，而不是静默降级），再检查 `requiredFeatures` 是否都在 adapter 支持集合里。
 */

import type { Adapter, AdapterInfo } from '../core/Adapter.js';
import type { DeviceDescriptor, DeviceLimits } from '../core/Device.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { resolveLimits } from '../core/Device.js';
import {
  describeWebGPUAdapter,
  isWebGPUSupported,
  readDeviceLimits,
  readSupportedFeatures,
  requestWebGPUAdapter,
  validateRequiredFeatures,
  type WebGPUAdapterRequestOptions,
} from './utils/wgpuCapabilities.js';
import { WebGPUDevice } from './WebGPUDevice.js';

export class WebGPUAdapter implements Adapter {
  /** 原生 `GPUAdapter`，escape hatch。 */
  readonly native: GPUAdapter;
  readonly info: AdapterInfo;
  readonly features: ReadonlySet<string>;
  readonly limits: DeviceLimits;

  private readonly options: WebGPUAdapterRequestOptions;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  readonly featureNames: readonly string[];

  private constructor(adapter: GPUAdapter, options: WebGPUAdapterRequestOptions) {
    this.native = adapter;
    this.options = options;
    this.info = describeWebGPUAdapter(adapter);
    this.features = readSupportedFeatures(adapter.features);
    this.limits = readDeviceLimits(adapter.limits);
    this.featureNames = [...this.features].sort();
  }

  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions(): WebGPUAdapterRequestOptions {
    return this.options;
  }

  /** 当前环境是否暴露 WebGPU。 */
  static isSupported(): boolean {
    return isWebGPUSupported();
  }

  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(options: WebGPUAdapterRequestOptions = {}): Promise<WebGPUAdapter | null> {
    const adapter = await requestWebGPUAdapter(options);
    return adapter ? new WebGPUAdapter(adapter, options) : null;
  }

  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(options: WebGPUAdapterRequestOptions = {}): Promise<WebGPUAdapter> {
    const adapter = await WebGPUAdapter.request(options);
    if (adapter) return adapter;
    if (!isWebGPUSupported()) {
      throw new ValidationError(
        '[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing).',
      );
    }
    throw new ValidationError(
      '[gpu-device-api] No WebGPU adapter is available for the requested options ' +
        `(${JSON.stringify(options)}).`,
    );
  }

  /** 创建逻辑设备。 */
  async requestDevice(descriptor: DeviceDescriptor = {}): Promise<WebGPUDevice> {
    const limits = resolveLimits(this.limits, descriptor.requiredLimits, 'webgpu');
    const requiredFeatures = validateRequiredFeatures(
      this.features,
      descriptor.requiredFeatures,
      `WebGPUAdapter.requestDevice (${this.info.device || this.info.vendor || 'unknown adapter'})`,
    );

    const requiredLimits: Record<string, number> = {};
    for (const [key, value] of Object.entries(descriptor.requiredLimits ?? {})) {
      if (typeof value === 'number') requiredLimits[key] = value;
    }

    const native = await this.native.requestDevice({
      label: descriptor.label,
      requiredFeatures: [...requiredFeatures] as GPUFeatureName[],
      requiredLimits,
      defaultQueue: { label: descriptor.label ? `${descriptor.label}#queue` : undefined },
    });

    return new WebGPUDevice(native, {
      descriptor,
      resolvedLimits: limits,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options,
    });
  }
}

/** 便捷函数：请求一个 `WebGPUAdapter`，不可用时返回 `null`。 */
export function createWebGPUAdapter(options: WebGPUAdapterRequestOptions = {}): Promise<WebGPUAdapter | null> {
  return WebGPUAdapter.request(options);
}
