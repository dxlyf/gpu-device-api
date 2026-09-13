/** What kind of resource a bind group layout entry describes. */
export const BindingType = {
  /** Uniform buffer (read-only, 16-byte aligned layout). */
  Uniform: 'uniform',
  /** Read-write storage buffer (WebGPU only). */
  Storage: 'storage',
  /** Read-only storage buffer. */
  ReadOnlyStorage: 'read-only-storage',
  /** Filtering sampler. */
  Sampler: 'sampler',
  /** Comparison sampler used by `textureSampleCompare` / shadow lookups. */
  ComparisonSampler: 'comparison-sampler',
  /** Sampled texture. */
  Texture: 'texture',
  /** Write-only storage texture (WebGPU only). */
  StorageTexture: 'storage-texture',
} as const;

export type BindingType = (typeof BindingType)[keyof typeof BindingType];

/** True when the binding describes a buffer resource. */
export function isBufferBinding(type: BindingType): boolean {
  return type === 'uniform' || type === 'storage' || type === 'read-only-storage';
}

/** True when the binding describes a texture resource. */
export function isTextureBinding(type: BindingType): boolean {
  return type === 'texture' || type === 'storage-texture';
}

/** True when the binding describes a sampler resource. */
export function isSamplerBinding(type: BindingType): boolean {
  return type === 'sampler' || type === 'comparison-sampler';
}
