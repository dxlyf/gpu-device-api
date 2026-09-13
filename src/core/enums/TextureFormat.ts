/**
 * 统一的 texture 格式名称。以 WebGPU 名称为准；WebGL2 后端将它们映射为
 * `internalFormat` / `format` / `type` 三元组，WebGPU 后端则原样转发。
 */
export type TextureFormat =
  // 8 位单通道
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  // 16 位单通道
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  // 8 位双通道
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  // 32 位单通道
  | 'r32uint'
  | 'r32sint'
  | 'r32float'
  // 16 位双通道
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  // 8 位四通道
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  // 打包格式
  | 'rgb9e5ufloat'
  | 'rgb10a2unorm'
  | 'rg11b10ufloat'
  // 32 位双通道
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float'
  // 16 位四通道
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  // 32 位四通道
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float'
  // depth / stencil 相关格式
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  | 'stencil8';

/** 所有携带 depth 和/或 stencil 信息的格式。 */
export const DEPTH_STENCIL_FORMATS: readonly TextureFormat[] = [
  'depth16unorm',
  'depth24plus',
  'depth24plus-stencil8',
  'depth32float',
  'stencil8',
];

/** 可用作 render pass attachment 的格式。 */
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
