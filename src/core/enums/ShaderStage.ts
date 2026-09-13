/** Shader stages a {@link ShaderModule} can be compiled for. Bit flags mirroring WebGPU. */
export const ShaderStage = {
  None: 0x0000,
  Vertex: 0x0001,
  Fragment: 0x0002,
  Compute: 0x0004,
} as const;

/** Bitwise OR of {@link ShaderStage} values. */
export type ShaderStage = number;

export const SHADER_STAGE_NAMES: Readonly<Record<number, string>> = {
  [ShaderStage.Vertex]: 'vertex',
  [ShaderStage.Fragment]: 'fragment',
  [ShaderStage.Compute]: 'compute',
};
