/**
 * WebGL2 的 compute pass：**不支持**。
 *
 * 与 `WebGL2ComputePipeline` 对应 —— 计算能力需要 GLES 3.1，WebGL2 只有 GLES 3.0。
 * 在 `beginComputePass()` 调用时立即报错，并给出可执行的替代方案。
 */
import type { BindGroup } from '../../core/binding/BindGroup.js';
import type { ComputePipeline } from '../../core/pipeline/ComputePipeline.js';
import type { ComputePassDescriptor, ComputePassEncoder } from '../../core/render/ComputePassEncoder.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { DispatchIndirectDescriptor } from '../../core/render/DrawCommands.js';
export declare class WebGL2ComputePassEncoder implements ComputePassEncoder {
    readonly label = "computePass";
    constructor(_descriptor?: ComputePassDescriptor);
    get ended(): boolean;
    setPipeline(_pipeline: ComputePipeline): void;
    setBindGroup(_index: number, _bindGroup: BindGroup | null, _dynamicOffsets?: readonly number[]): void;
    dispatchWorkgroups(_x: number, _y?: number, _z?: number): void;
    dispatchWorkgroupsIndirect(_indirect: DispatchIndirectDescriptor | BufferLike, _offset?: number): void;
    pushDebugGroup(_label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(_label: string): void;
    end(): void;
}
//# sourceMappingURL=WebGL2ComputePassEncoder.d.ts.map