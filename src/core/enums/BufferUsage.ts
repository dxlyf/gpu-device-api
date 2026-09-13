/**
 * {@link Buffer} 的可用用途。取值为位标志，与 WebGPU 保持一致，因此 WebGPU 后端可以直接转发，
 * WebGL2 后端可以将它们转换为绑定目标。
 */
export const BufferUsage = {
  None: 0x0000,
  /** 可映射用于读取。 */
  MapRead: 0x0001,
  /** 可映射用于写入。 */
  MapWrite: 0x0002,
  /** 可作为拷贝源。 */
  CopySrc: 0x0004,
  /** 可作为拷贝目标（`queue.writeBuffer`）。 */
  CopyDst: 0x0008,
  /** 可用作 index buffer。 */
  Index: 0x0010,
  /** 可用作 vertex buffer。 */
  Vertex: 0x0020,
  /** 可绑定为 uniform buffer。 */
  Uniform: 0x0040,
  /** 可绑定为 storage buffer。 */
  Storage: 0x0080,
  /** 可用作间接绘制/派发的参数 buffer。 */
  Indirect: 0x0100,
  /** 可接收查询结果。 */
  QueryResolve: 0x0200,
} as const;

/** {@link BufferUsage} 取值的按位或。 */
export type BufferUsage = number;
