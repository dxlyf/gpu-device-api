/** Draw and dispatch command descriptors. */

import type { BufferLike } from './CommandEncoder.js';

export interface DrawDescriptor {
  vertexCount: number;
  /** Defaults to 1. */
  instanceCount?: number;
  firstVertex?: number;
  firstInstance?: number;
}

export interface DrawIndexedDescriptor {
  indexCount: number;
  instanceCount?: number;
  firstIndex?: number;
  /** Offset added to every index before fetching vertex data. */
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
