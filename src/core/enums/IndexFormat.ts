/** Index buffer element type. */
export const IndexFormat = {
  Uint16: 'uint16',
  Uint32: 'uint32',
} as const;

export type IndexFormat = (typeof IndexFormat)[keyof typeof IndexFormat];

export function indexFormatByteSize(format: IndexFormat): number {
  return format === 'uint16' ? 2 : 4;
}

/** Picks the smallest index format that can address `vertexCount` vertices. */
export function smallestIndexFormat(vertexCount: number): IndexFormat {
  return vertexCount > 65535 ? 'uint32' : 'uint16';
}
