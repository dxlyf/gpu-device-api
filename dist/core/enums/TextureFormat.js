/** 所有携带 depth 和/或 stencil 信息的格式。 */
export const DEPTH_STENCIL_FORMATS = [
    'depth16unorm',
    'depth24plus',
    'depth24plus-stencil8',
    'depth32float',
    'stencil8',
];
/** 可用作 render pass attachment 的格式。 */
export const RENDERABLE_FORMATS = [
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
export function isDepthStencilFormat(format) {
    return DEPTH_STENCIL_FORMATS.includes(format);
}
export function isSrgbFormat(format) {
    return format === 'rgba8unorm-srgb' || format === 'bgra8unorm-srgb';
}
//# sourceMappingURL=TextureFormat.js.map