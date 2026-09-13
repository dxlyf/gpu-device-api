/** sampler 资源。对应 WebGPU 的 `GPUSampler`。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { AddressMode } from '../enums/AddressMode.js';
import type { CompareFunction } from '../enums/CompareFunction.js';
import type { FilterMode } from '../enums/FilterMode.js';

export interface SamplerDescriptor {
  label?: string;
  addressModeU?: AddressMode;
  addressModeV?: AddressMode;
  addressModeW?: AddressMode;
  magFilter?: FilterMode;
  minFilter?: FilterMode;
  mipmapFilter?: FilterMode;
  lodMinClamp?: number;
  lodMaxClamp?: number;
  /** 使其成为用于阴影查找的比较 sampler。 */
  compare?: CompareFunction;
  /** WebGPU 会忽略大于 1 的值；WebGL2 后端使用 `EXT_texture_filter_anisotropic`。 */
  maxAnisotropy?: number;
}

export interface Sampler extends Disposable {
  readonly label: string;
  readonly descriptor: Required<Omit<SamplerDescriptor, 'label' | 'compare'>> & { compare?: CompareFunction };
  /** 原生句柄：WebGPU 上是 `GPUSampler`；WebGL2 上是解析后的 sampler 状态（按 texture 逐个应用）。 */
  readonly native: unknown;
}

/** 填入 WebGPU 会使用的默认值。 */
export function resolveSamplerDescriptor(descriptor: SamplerDescriptor = {}): Sampler['descriptor'] {
  return {
    addressModeU: descriptor.addressModeU ?? 'clamp-to-edge',
    addressModeV: descriptor.addressModeV ?? 'clamp-to-edge',
    addressModeW: descriptor.addressModeW ?? 'clamp-to-edge',
    magFilter: descriptor.magFilter ?? 'nearest',
    minFilter: descriptor.minFilter ?? 'nearest',
    mipmapFilter: descriptor.mipmapFilter ?? 'nearest',
    lodMinClamp: descriptor.lodMinClamp ?? 0,
    lodMaxClamp: descriptor.lodMaxClamp ?? 32,
    maxAnisotropy: descriptor.maxAnisotropy ?? 1,
    compare: descriptor.compare,
  };
}

/** 描述 sampler 状态的稳定缓存键。 */
export function samplerKey(descriptor: Sampler['descriptor']): string {
  return [
    descriptor.addressModeU,
    descriptor.addressModeV,
    descriptor.addressModeW,
    descriptor.magFilter,
    descriptor.minFilter,
    descriptor.mipmapFilter,
    descriptor.lodMinClamp,
    descriptor.lodMaxClamp,
    descriptor.maxAnisotropy,
    descriptor.compare ?? 'none',
  ].join('|');
}
