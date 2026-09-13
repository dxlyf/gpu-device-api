/**
 * How a {@link Buffer} may be used. Values are bit flags and mirror WebGPU so that the WebGPU
 * backend can forward them directly and the WebGL2 backend can translate them into binding targets.
 */
export const BufferUsage = {
  None: 0x0000,
  /** Can be mapped for reading. */
  MapRead: 0x0001,
  /** Can be mapped for writing. */
  MapWrite: 0x0002,
  /** Can be a copy source. */
  CopySrc: 0x0004,
  /** Can be a copy destination (`queue.writeBuffer`). */
  CopyDst: 0x0008,
  /** Can be used as an index buffer. */
  Index: 0x0010,
  /** Can be used as a vertex buffer. */
  Vertex: 0x0020,
  /** Can be bound as a uniform buffer. */
  Uniform: 0x0040,
  /** Can be bound as a storage buffer. */
  Storage: 0x0080,
  /** Can be used as an indirect draw/dispatch argument buffer. */
  Indirect: 0x0100,
  /** Can receive query results. */
  QueryResolve: 0x0200,
} as const;

/** Bitwise OR of {@link BufferUsage} values. */
export type BufferUsage = number;
