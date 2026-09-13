/** texture 放大/缩小过滤方式。 */
export const FilterMode = {
  Nearest: 'nearest',
  Linear: 'linear',
} as const;

export type FilterMode = (typeof FilterMode)[keyof typeof FilterMode];
