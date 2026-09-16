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
/** 把 core 的 `ComputePassDescriptor` 翻译为 WebGPU 形态。 */
export declare function toGPUComputePassDescriptor(descriptor: ComputePassDescriptor | undefined, device: WebGPUDevice): GPUComputePassDescriptor;
export declare class WebGPUComputePassEncoder implements ComputePassEncoder {
    readonly label: string;
    readonly native: GPUComputePassEncoder;
    private readonly device;
    private readonly onEnd;
    private _ended;
    /** 同 render pass：label 在生命周期内不变，报错用的 context 只建一次，避免每次调用现拼。 */
    private readonly contextSetPipeline;
    private readonly contextSetBindGroup;
    private readonly contextDispatchIndirect;
    constructor(device: WebGPUDevice, native: GPUComputePassEncoder, label: string, onEnd?: () => void);
    get ended(): boolean;
    setPipeline(pipeline: ComputePipeline): void;
    setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void;
    dispatchWorkgroups(workgroupCountX: number, workgroupCountY?: number, workgroupCountZ?: number): void;
    dispatchWorkgroupsIndirect(indirect: DispatchIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    /** 调试分组：直接转发给原生的 `GPUComputePassEncoder`。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
    end(): void;
    private assertOpen;
}
//# sourceMappingURL=WebGPUComputePassEncoder.d.ts.map