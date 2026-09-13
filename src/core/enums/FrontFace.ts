/** 被视为正面的环绕顺序。 */
export const FrontFace = {
  Ccw: 'ccw',
  Cw: 'cw',
} as const;

export type FrontFace = (typeof FrontFace)[keyof typeof FrontFace];
