/** 光栅化阶段剔除哪些面。 */
export const CullMode = {
  None: 'none',
  Front: 'front',
  Back: 'back',
} as const;

export type CullMode = (typeof CullMode)[keyof typeof CullMode];
