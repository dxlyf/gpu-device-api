/**
 * WebGPU compute pass 录制：`ComputePassEncoder` 接口在 `GPUComputePassEncoder` 上的实现。
 *
 * 除了 `setPipeline` 会用 `ComputePipeline.native` 触发一次惰性编译之外，几乎所有方法都是
 * 直接转发；`timestampWrites` 需要把 core 的 `QuerySet` 收窄成原生 `GPUQuerySet`。
 */

import type { ComputePassDescriptor, ComputePassEncoder } from '../../core/render/ComputePassEncoder.js';
import type { BindGroup } from '../../core/binding/BindGroup.js';
import type { ComputePipeline } from '../../core/pipeline/ComputePipeline.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { DispatchIndirectDescriptor } from '../../core/render/DrawCommands.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { asGPUComputePipeline } from '../pipeline/WebGPUComputePipeline.js';
import { asGPUBindGroup, validateDynamicOffsets } from '../binding/WebGPUBindGroup.js';
import { asGPUBuffer } from '../resources/WebGPUBuffer.js';
import { asGPUQuerySet } from '../resources/WebGPUQuerySet.js';

/** 把 core 的 `ComputePassDescriptor` 翻译为 WebGPU 形态。 */
export function toGPUComputePassDescriptor(descriptor?: ComputePassDescriptor): GPUComputePassDescriptor {
  const label = descriptor?.label ?? 'computePass';
  const native: GPUComputePassDescriptor = { label };
  if (descriptor?.timestampWrites) {
    const writes = descriptor.timestampWrites;
    native.timestampWrites = {
      querySet: asGPUQuerySet(writes.querySet, `${label}.timestampWrites.querySet`),
      beginningOfPassWriteIndex: writes.beginningOfPassWriteIndex,
      endOfPassWriteIndex: writes.endOfPassWriteIndex,
    };
  }
  return native;
}

export class WebGPUComputePassEncoder implements ComputePassEncoder {
  readonly label: string;
  readonly native: GPUComputePassEncoder;

  private readonly device: WebGPUDevice;
  private readonly onEnd: (() => void) | undefined;
  private _ended = false;

  constructor(
    device: WebGPUDevice,
    native: GPUComputePassEncoder,
    label: string,
    onEnd?: () => void,
  ) {
    this.device = device;
    this.native = native;
    this.label = label;
    this.onEnd = onEnd;
  }

  get ended(): boolean {
    return this._ended;
  }

  setPipeline(pipeline: ComputePipeline): void {
    this.assertOpen('setPipeline');
    this.native.setPipeline(asGPUComputePipeline(pipeline, `ComputePass "${this.label}".setPipeline`));
  }

  setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void {
    this.assertOpen('setBindGroup');
    if (bindGroup) {
      validateDynamicOffsets(bindGroup, dynamicOffsets, this.device, `ComputePass "${this.label}".setBindGroup`);
      this.native.setBindGroup(index, asGPUBindGroup(bindGroup, `ComputePass "${this.label}".setBindGroup`));
      return;
    }
    if (dynamicOffsets && dynamicOffsets.length > 0) {
      throw new ValidationError(
        `[gpu-device-api] ComputePass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`,
      );
    }
    this.native.setBindGroup(index, null);
  }

  dispatchWorkgroups(workgroupCountX: number, workgroupCountY = 1, workgroupCountZ = 1): void {
    this.assertOpen('dispatchWorkgroups');
    this.native.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
  }

  dispatchWorkgroupsIndirect(indirect: DispatchIndirectDescriptor | BufferLike, indirectOffset = 0): void {
    this.assertOpen('dispatchWorkgroupsIndirect');
    const context = `ComputePass "${this.label}".dispatchWorkgroupsIndirect`;
    if ('indirectBuffer' in indirect) {
      this.native.dispatchWorkgroupsIndirect(
        asGPUBuffer(indirect.indirectBuffer, context),
        indirect.indirectOffset ?? 0,
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(asGPUBuffer(indirect, context), indirectOffset);
  }

  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end(): void {
    if (this._ended) return;
    this._ended = true;
    this.native.end();
    this.onEnd?.();
  }

  private assertOpen(context: string): void {
    if (this._ended) {
      throw new ValidationError(
        `[gpu-device-api] ComputePass "${this.label}".${context}: the pass has already ended.`,
      );
    }
  }
}
