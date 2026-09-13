/** stencil 测试通过/失败时应用的 stencil 操作。 */
export const StencilOperation = {
  Keep: 'keep',
  Zero: 'zero',
  Replace: 'replace',
  Invert: 'invert',
  IncrementClamp: 'increment-clamp',
  DecrementClamp: 'decrement-clamp',
  IncrementWrap: 'increment-wrap',
  DecrementWrap: 'decrement-wrap',
} as const;

export type StencilOperation = (typeof StencilOperation)[keyof typeof StencilOperation];
