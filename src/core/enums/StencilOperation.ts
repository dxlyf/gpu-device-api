/** Stencil operation applied when the stencil test passes/fails. */
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
