/** vertex buffer 是按 vertex 还是按 instance 前进。 */
export const VertexStepMode = {
  Vertex: 'vertex',
  Instance: 'instance',
} as const;

export type VertexStepMode = (typeof VertexStepMode)[keyof typeof VertexStepMode];
