/**
 * Unified texture format names. The WebGPU names are canonical; the WebGL2 backend maps them onto
 * `internalFormat` / `format` / `type` triples, and the WebGPU backend forwards them verbatim.
 */
export type TextureFormat =
  // 8-bit single channel
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  // 16-bit single channel
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  // 8-bit dual channel
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  // 32-bit single channel
  | 'r32uint'
  | 'r32sint'
  | 'r32float'
  // 16-bit dual channel
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  // 8-bit quad channel
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  // packed
  | 'rgb9e5ufloat'
  | 'rgb10a2unorm'
  | 'rg11b10ufloat'
  // 32-bit dual channel
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float'
  // 16-bit quad channel
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  // 32-bit quad channel
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float'
  // depth / stencil
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  | 'stencil8';

/** All formats that carry depth and/or stencil information. */
export const DEPTH_STENCIL_FORMATS: readonly TextureFormat[] = [
  'depth16unorm',
  'depth24plus',
  'depth24plus-stencil8',
  'depth32float',
  'stencil8',
];

/** Formats that can be used as a render pass attachment. */
export const RENDERABLE_FORMATS: readonly TextureFormat[] = [
  'r8unorm',
  'r8uint',
  'r8sint',
  'r16uint',
  'r16sint',
  'r16float',
  'rg8unorm',
  'rg8uint',
  'rg8sint',
  'r32uint',
  'r32sint',
  'r32float',
  'rg16uint',
  'rg16sint',
  'rg16float',
  'rgba8unorm',
  'rgba8unorm-srgb',
  'rgba8uint',
  'rgba8sint',
  'bgra8unorm',
  'bgra8unorm-srgb',
  'rgb10a2unorm',
  'rg32uint',
  'rg32sint',
  'rg32float',
  'rgba16uint',
  'rgba16sint',
  'rgba16float',
  'rgba32uint',
  'rgba32sint',
  'rgba32float',
  ...DEPTH_STENCIL_FORMATS,
];

export function isDepthStencilFormat(format: TextureFormat): boolean {
  return DEPTH_STENCIL_FORMATS.includes(format);
}

export function isSrgbFormat(format: TextureFormat): boolean {
  return format === 'rgba8unorm-srgb' || format === 'bgra8unorm-srgb';
}
