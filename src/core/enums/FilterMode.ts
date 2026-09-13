/** Texture magnification/minification filtering. */
export const FilterMode = {
  Nearest: 'nearest',
  Linear: 'linear',
} as const;

export type FilterMode = (typeof FilterMode)[keyof typeof FilterMode];
