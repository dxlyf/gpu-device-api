/** Whether a vertex buffer advances per vertex or per instance. */
export const VertexStepMode = {
  Vertex: 'vertex',
  Instance: 'instance',
} as const;

export type VertexStepMode = (typeof VertexStepMode)[keyof typeof VertexStepMode];
