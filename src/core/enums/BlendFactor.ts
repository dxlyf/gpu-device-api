/** 混合方程中的源/目标因子。 */
export const BlendFactor = {
  Zero: 'zero',
  One: 'one',
  Src: 'src',
  OneMinusSrc: 'one-minus-src',
  SrcAlpha: 'src-alpha',
  OneMinusSrcAlpha: 'one-minus-src-alpha',
  Dst: 'dst',
  OneMinusDst: 'one-minus-dst',
  DstAlpha: 'dst-alpha',
  OneMinusDstAlpha: 'one-minus-dst-alpha',
  SrcAlphaSaturated: 'src-alpha-saturated',
  Constant: 'constant',
  OneMinusConstant: 'one-minus-constant',
} as const;

export type BlendFactor = (typeof BlendFactor)[keyof typeof BlendFactor];
