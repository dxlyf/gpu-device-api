/**
 * 统一的 texture 格式名称。以 WebGPU 名称为准；WebGL2 后端将它们映射为
 * `internalFormat` / `format` / `type` 三元组，WebGPU 后端则原样转发。
 */
export type TextureFormat = 'r8unorm' | 'r8snorm' | 'r8uint' | 'r8sint' | 'r16uint' | 'r16sint' | 'r16float' | 'rg8unorm' | 'rg8snorm' | 'rg8uint' | 'rg8sint' | 'r32uint' | 'r32sint' | 'r32float' | 'rg16uint' | 'rg16sint' | 'rg16float' | 'rgba8unorm' | 'rgba8unorm-srgb' | 'rgba8snorm' | 'rgba8uint' | 'rgba8sint' | 'bgra8unorm' | 'bgra8unorm-srgb' | 'rgb9e5ufloat' | 'rgb10a2unorm' | 'rg11b10ufloat' | 'rg32uint' | 'rg32sint' | 'rg32float' | 'rgba16uint' | 'rgba16sint' | 'rgba16float' | 'rgba32uint' | 'rgba32sint' | 'rgba32float' | 'depth16unorm' | 'depth24plus' | 'depth24plus-stencil8' | 'depth32float' | 'stencil8';
/** 所有携带 depth 和/或 stencil 信息的格式。 */
export declare const DEPTH_STENCIL_FORMATS: readonly TextureFormat[];
/** 可用作 render pass attachment 的格式。 */
export declare const RENDERABLE_FORMATS: readonly TextureFormat[];
export declare function isDepthStencilFormat(format: TextureFormat): boolean;
export declare function isSrgbFormat(format: TextureFormat): boolean;
//# sourceMappingURL=TextureFormat.d.ts.map