/** texture 坐标的环绕模式。 */
export const AddressMode = {
  ClampToEdge: 'clamp-to-edge',
  Repeat: 'repeat',
  MirrorRepeat: 'mirror-repeat',
} as const;

export type AddressMode = (typeof AddressMode)[keyof typeof AddressMode];
