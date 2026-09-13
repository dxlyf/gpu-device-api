/** How vertices are assembled into primitives. */
export const PrimitiveTopology = {
  PointList: 'point-list',
  LineList: 'line-list',
  LineStrip: 'line-strip',
  TriangleList: 'triangle-list',
  TriangleStrip: 'triangle-strip',
} as const;

export type PrimitiveTopology = (typeof PrimitiveTopology)[keyof typeof PrimitiveTopology];

/** True when the topology assembles triangles. */
export function isTriangleTopology(topology: PrimitiveTopology): boolean {
  return topology === 'triangle-list' || topology === 'triangle-strip';
}

/** Primitives produced by `count` vertices/indices for a topology. */
export function primitiveCount(topology: PrimitiveTopology, count: number): number {
  switch (topology) {
    case 'point-list':
      return count;
    case 'line-list':
      return Math.floor(count / 2);
    case 'line-strip':
      return Math.max(0, count - 1);
    case 'triangle-list':
      return Math.floor(count / 3);
    case 'triangle-strip':
      return Math.max(0, count - 2);
  }
}
