/** Which face(s) are discarded by the rasterizer. */
export const CullMode = {
  None: 'none',
  Front: 'front',
  Back: 'back',
} as const;

export type CullMode = (typeof CullMode)[keyof typeof CullMode];
