/**
 * depth/stencil 比较函数。
 * `less` 是常用的 depth 测试；`less-equal` 常用于 shadow map。
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
