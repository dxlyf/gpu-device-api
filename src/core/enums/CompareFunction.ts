/**
 * Depth/stencil comparison function.
 * `less` is the usual depth test; `less-equal` is common for shadow maps.
 */
export const CompareFunction = {
  Never: 'never',
  Less: 'less',
  Equal: 'equal',
  LessEqual: 'less-equal',
  Greater: 'greater',
  NotEqual: 'not-equal',
  GreaterEqual: 'greater-equal',
  Always: 'always',
} as const;

export type CompareFunction = (typeof CompareFunction)[keyof typeof CompareFunction];
