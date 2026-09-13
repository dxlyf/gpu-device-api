/**
 * Vertex attribute formats. Names match WebGPU exactly; the WebGL2 backend translates each one
 * into a `vertexAttribPointer`/`vertexAttribIPointer` call.
 */
export type VertexFormat =
  | 'uint8x2'
  | 'uint8x4'
  | 'sint8x2'
  | 'sint8x4'
  | 'unorm8x2'
  | 'unorm8x4'
  | 'snorm8x2'
  | 'snorm8x4'
  | 'uint16x2'
  | 'uint16x4'
  | 'sint16x2'
  | 'sint16x4'
  | 'unorm16x2'
  | 'unorm16x4'
  | 'snorm16x2'
  | 'snorm16x4'
  | 'float16x2'
  | 'float16x4'
  | 'float32'
  | 'float32x2'
  | 'float32x3'
  | 'float32x4'
  | 'uint32'
  | 'uint32x2'
  | 'uint32x3'
  | 'uint32x4'
  | 'sint32'
  | 'sint32x2'
  | 'sint32x3'
  | 'sint32x4';

export interface VertexFormatInfo {
  /** Number of components read per vertex. */
  readonly components: 1 | 2 | 3 | 4;
  /** Bytes occupied by one element. */
  readonly byteSize: number;
  /** Component domain. */
  readonly kind: 'float' | 'uint' | 'sint';
  /** Fractional formats are normalized into [0,1] / [-1,1] when read. */
  readonly normalized: boolean;
}

function info(components: 1 | 2 | 3 | 4, byteSize: number, kind: VertexFormatInfo['kind'], normalized = false): VertexFormatInfo {
  return { components, byteSize, kind, normalized };
}

/** Shared, backend-independent description of every {@link VertexFormat}. */
export const VERTEX_FORMAT_INFO: Readonly<Record<VertexFormat, VertexFormatInfo>> = Object.freeze({
  uint8x2: info(2, 2, 'uint'),
  uint8x4: info(4, 4, 'uint'),
  sint8x2: info(2, 2, 'sint'),
  sint8x4: info(4, 4, 'sint'),
  unorm8x2: info(2, 2, 'float', true),
  unorm8x4: info(4, 4, 'float', true),
  snorm8x2: info(2, 2, 'float', true),
  snorm8x4: info(4, 4, 'float', true),
  uint16x2: info(2, 4, 'uint'),
  uint16x4: info(4, 8, 'uint'),
  sint16x2: info(2, 4, 'sint'),
  sint16x4: info(4, 8, 'sint'),
  unorm16x2: info(2, 4, 'float', true),
  unorm16x4: info(4, 8, 'float', true),
  snorm16x2: info(2, 4, 'float', true),
  snorm16x4: info(4, 8, 'float', true),
  float16x2: info(2, 4, 'float'),
  float16x4: info(4, 8, 'float'),
  float32: info(1, 4, 'float'),
  float32x2: info(2, 8, 'float'),
  float32x3: info(3, 12, 'float'),
  float32x4: info(4, 16, 'float'),
  uint32: info(1, 4, 'uint'),
  uint32x2: info(2, 8, 'uint'),
  uint32x3: info(3, 12, 'uint'),
  uint32x4: info(4, 16, 'uint'),
  sint32: info(1, 4, 'sint'),
  sint32x2: info(2, 8, 'sint'),
  sint32x3: info(3, 12, 'sint'),
  sint32x4: info(4, 16, 'sint'),
});

export function vertexFormatInfo(format: VertexFormat): VertexFormatInfo {
  const value = VERTEX_FORMAT_INFO[format];
  if (!value) throw new Error(`[gpu-device-api] Unknown vertex format "${format}".`);
  return value;
}

/** GLSL ES 3.00 type used to declare an attribute of this format. */
export function vertexFormatGlslType(format: VertexFormat): string {
  const value = vertexFormatInfo(format);
  const table =
    value.kind === 'float'
      ? ['float', 'vec2', 'vec3', 'vec4']
      : value.kind === 'uint'
        ? ['uint', 'uvec2', 'uvec3', 'uvec4']
        : ['int', 'ivec2', 'ivec3', 'ivec4'];
  return table[value.components - 1]!;
}

/** WGSL type used to declare an attribute of this format. */
export function vertexFormatWgslType(format: VertexFormat): string {
  const value = vertexFormatInfo(format);
  const table =
    value.kind === 'float'
      ? ['f32', 'vec2f', 'vec3f', 'vec4f']
      : value.kind === 'uint'
        ? ['u32', 'vec2u', 'vec3u', 'vec4u']
        : ['i32', 'vec2i', 'vec3i', 'vec4i'];
  return table[value.components - 1]!;
}
