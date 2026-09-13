/** How a {@link Texture} may be used. Bit flags mirroring WebGPU. */
export const TextureUsage = {
  None: 0x0000,
  CopySrc: 0x0001,
  CopyDst: 0x0002,
  /** Can be sampled through a {@link TextureView}. */
  TextureBinding: 0x0004,
  /** Can be bound as a storage texture (WebGPU only). */
  StorageBinding: 0x0008,
  /** Can be used as a color/depth attachment of a render pass. */
  RenderAttachment: 0x0010,
} as const;

/** Bitwise OR of {@link TextureUsage} values. */
export type TextureUsage = number;
