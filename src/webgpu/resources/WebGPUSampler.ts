/**
 * WebGPU sampler 资源：`Sampler` 接口在 `GPUSampler` 上的实现。
 *
 * WebGPU 的 sampler 是**格式无关**的不可变对象：能不能过滤取决于 texture 的 sampleType，
 * 因此这里不做「filtering sampler 配了不可过滤格式」的校验（那要在 bind group 那一层
 * 通过 `texture.sampleType` 表达）。本类只负责枚举映射与少量数值自检。
 */

import type { Sampler, SamplerDescriptor } from '../../core/resources/Sampler.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { resolveSamplerDescriptor } from '../../core/resources/Sampler.js';
import { toGPUAddressMode, toGPUCompareFunction, toGPUFilterMode, toGPUMipmapFilterMode } from '../utils/wgpuEnumMap.js';

export class WebGPUSampler implements Sampler {
  readonly label: string;
  readonly descriptor: Sampler['descriptor'];
  readonly native: GPUSampler;

  private readonly device: WebGPUDevice;
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: SamplerDescriptor = {}) {
    this.device = device;
    this.label = descriptor.label ?? `sampler#${device.nextResourceId('sampler')}`;
    const resolved = resolveSamplerDescriptor(descriptor);

    if (!Number.isFinite(resolved.lodMinClamp) || !Number.isFinite(resolved.lodMaxClamp)) {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp/lodMaxClamp must be finite numbers.`,
      );
    }
    if (resolved.lodMinClamp < 0) {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp must not be negative, got ${resolved.lodMinClamp}.`,
      );
    }
    if (resolved.lodMaxClamp < resolved.lodMinClamp) {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": lodMaxClamp (${resolved.lodMaxClamp}) must be >= ` +
          `lodMinClamp (${resolved.lodMinClamp}).`,
      );
    }
    if (!Number.isFinite(resolved.maxAnisotropy) || resolved.maxAnisotropy < 1) {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": maxAnisotropy must be >= 1, got ${String(resolved.maxAnisotropy)}.`,
      );
    }

    this.descriptor = resolved;

    const nativeDescriptor: GPUSamplerDescriptor = {
      label: this.label,
      addressModeU: toGPUAddressMode(resolved.addressModeU),
      addressModeV: toGPUAddressMode(resolved.addressModeV),
      addressModeW: toGPUAddressMode(resolved.addressModeW),
      magFilter: toGPUFilterMode(resolved.magFilter),
      minFilter: toGPUFilterMode(resolved.minFilter),
      mipmapFilter: toGPUMipmapFilterMode(resolved.mipmapFilter),
      lodMinClamp: resolved.lodMinClamp,
      lodMaxClamp: resolved.lodMaxClamp,
      maxAnisotropy: resolved.maxAnisotropy,
    };
    if (resolved.compare !== undefined) {
      nativeDescriptor.compare = toGPUCompareFunction(resolved.compare);
    }

    this.native = device.native.createSampler(nativeDescriptor);
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 是否为用于阴影查找的比较 sampler。 */
  get isComparison(): boolean {
    return this.descriptor.compare !== undefined;
  }

  /** GPUSampler 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose(): void {
    this._disposed = true;
    this.device.untrack(this);
  }
}

/** 该对象是否为 WebGPU 后端的 sampler。 */
export function isWebGPUSampler(value: unknown): value is WebGPUSampler {
  return value instanceof WebGPUSampler;
}

/** 原生 `GPUSampler` 的形状识别。 */
export function isNativeGPUSampler(value: unknown): value is GPUSampler {
  if (!value || typeof value !== 'object') return false;
  if ('native' in (value as object)) return false;
  return Object.prototype.toString.call(value) === '[object GPUSampler]';
}

/** 把任意 sampler 表示收窄为原生 `GPUSampler`。 */
export function asGPUSampler(value: unknown, context: string): GPUSampler {
  if (value instanceof WebGPUSampler) return value.native;
  if (isNativeGPUSampler(value)) return value;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`,
  );
}
