/** draw 与 dispatch 命令的 descriptor。 */

import type { BufferLike } from './CommandEncoder.js';

export interface DrawDescriptor {
  vertexCount: number;
  /** 默认为 1。 */
  instanceCount?: number;
  firstVertex?: number;
  firstInstance?: number;
}

export interface DrawIndexedDescriptor {
  indexCount: number;
  instanceCount?: number;
  firstIndex?: number;
  /** 在获取 vertex 数据之前，加到每个索引上的偏移。 */
  baseVertex?: number;
  firstInstance?: number;
}

export interface DrawIndirectDescriptor {
  indirectBuffer: BufferLike;
  indirectOffset?: number;
}

export interface DispatchDescriptor {
  workgroupCountX: number;
  workgroupCountY?: number;
  workgroupCountZ?: number;
}

export interface DispatchIndirectDescriptor {
  indirectBuffer: BufferLike;
  indirectOffset?: number;
}
