/** compute pass 录制。仅 WebGPU；WebGL2 后端在 `beginComputePass` 时抛错。 */

import type { BindGroup } from '../binding/BindGroup.js';
import type { ComputePipeline } from '../pipeline/ComputePipeline.js';
import type { QuerySet } from '../resources/QuerySet.js';
import type { BufferLike } from './CommandEncoder.js';
import type { DispatchIndirectDescriptor } from './DrawCommands.js';

export interface ComputePassDescriptor {
  label?: string;
  timestampWrites?: {
    querySet: QuerySet;
    beginningOfPassWriteIndex?: number;
    endOfPassWriteIndex?: number;
  };
}

export interface ComputePassEncoder {
  readonly label: string;
  readonly ended: boolean;

  setPipeline(pipeline: ComputePipeline): void;
  setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void;

  dispatchWorkgroups(workgroupCountX: number, workgroupCountY?: number, workgroupCountZ?: number): void;
  dispatchWorkgroupsIndirect(indirect: DispatchIndirectDescriptor | BufferLike, indirectOffset?: number): void;

  end(): void;
}
