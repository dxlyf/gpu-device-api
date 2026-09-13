/** index buffer 的元素类型。 */
export const IndexFormat = {
  Uint16: 'uint16',
  Uint32: 'uint32',
} as const;

export type IndexFormat = (typeof IndexFormat)[keyof typeof IndexFormat];

export function indexFormatByteSize(format: IndexFormat): number {
  return format === 'uint16' ? 2 : 4;
}

/** 选择能够寻址 `vertexCount` 个 vertex 的最小 index 格式。 */
export function smallestIndexFormat(vertexCount: number): IndexFormat {
  return vertexCount > 65535 ? 'uint32' : 'uint16';
}
