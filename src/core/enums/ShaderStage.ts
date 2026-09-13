/** {@link ShaderModule} 可编译到的 shader 阶段。位标志与 WebGPU 保持一致。 */
export const ShaderStage = {
  None: 0x0000,
  Vertex: 0x0001,
  Fragment: 0x0002,
  Compute: 0x0004,
} as const;

/** {@link ShaderStage} 取值的按位或。 */
export type ShaderStage = number;

export const SHADER_STAGE_NAMES: Readonly<Record<number, string>> = {
  [ShaderStage.Vertex]: 'vertex',
  [ShaderStage.Fragment]: 'fragment',
  [ShaderStage.Compute]: 'compute',
};
