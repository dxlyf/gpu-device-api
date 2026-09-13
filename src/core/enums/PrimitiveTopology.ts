/** vertex 如何组装为图元。 */
export const PrimitiveTopology = {
  PointList: 'point-list',
  LineList: 'line-list',
  LineStrip: 'line-strip',
  TriangleList: 'triangle-list',
  TriangleStrip: 'triangle-strip',
} as const;

export type PrimitiveTopology = (typeof PrimitiveTopology)[keyof typeof PrimitiveTopology];

/** 当该拓扑组装三角形时返回 true。 */
export function isTriangleTopology(topology: PrimitiveTopology): boolean {
  return topology === 'triangle-list' || topology === 'triangle-strip';
}

/** 给定拓扑下，由 `count` 个 vertex/index 生成的图元数量。 */
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
