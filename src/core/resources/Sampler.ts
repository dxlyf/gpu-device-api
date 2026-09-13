/** Sampler resource. Mirrors WebGPU's `GPUSampler`. */

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
  /** Turns this into a comparison sampler for shadow lookups. */
  compare?: CompareFunction;
  /** WebGPU ignores values above 1; the WebGL2 backend uses `EXT_texture_filter_anisotropic`. */
  maxAnisotropy?: number;
}

export interface Sampler extends Disposable {
  readonly label: string;
  readonly descriptor: Required<Omit<SamplerDescriptor, 'label' | 'compare'>> & { compare?: CompareFunction };
  /** Native handle: `GPUSampler` on WebGPU; on WebGL2 the resolved sampler state (applied per texture). */
  readonly native: unknown;
}

/** Applies the defaults that WebGPU would apply. */
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

/** Stable cache key describing the sampler state. */
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
