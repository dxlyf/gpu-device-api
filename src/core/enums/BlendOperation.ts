/** 混合方程。 */
export const BlendOperation = {
  Add: 'add',
  Subtract: 'subtract',
  ReverseSubtract: 'reverse-subtract',
  Min: 'min',
  Max: 'max',
} as const;

export type BlendOperation = (typeof BlendOperation)[keyof typeof BlendOperation];
