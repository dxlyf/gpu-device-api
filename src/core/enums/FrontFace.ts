/** Winding order that is considered front-facing. */
export const FrontFace = {
  Ccw: 'ccw',
  Cw: 'cw',
} as const;

export type FrontFace = (typeof FrontFace)[keyof typeof FrontFace];
