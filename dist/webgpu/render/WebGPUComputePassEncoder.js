/**
 * WebGPU compute pass 录制：`ComputePassEncoder` 接口在 `GPUComputePassEncoder` 上的实现。
 *
 * 除了 `setPipeline` 会用 `ComputePipeline.native` 触发一次惰性编译之外，几乎所有方法都是
 * 直接转发；`timestampWrites` 需要把 core 的 `QuerySet` 收窄成原生 `GPUQuerySet`。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { asGPUComputePipeline } from '../pipeline/WebGPUComputePipeline.js';
import { asGPUBindGroup, NO_DYNAMIC_OFFSETS, validateDynamicOffsets } from '../binding/WebGPUBindGroup.js';
import { asGPUBuffer } from '../resources/WebGPUBuffer.js';
import { toGPUTimestampWrites } from '../resources/WebGPUQuerySet.js';
/** 把 core 的 `ComputePassDescriptor` 翻译为 WebGPU 形态。 */
export function toGPUComputePassDescriptor(descriptor, device) {
    const label = descriptor?.label ?? 'computePass';
    const native = { label };
    if (descriptor?.timestampWrites) {
        // 与 render pass 同一套校验：下标范围 + timestamp-query + timestamp-query-inside-passes。
        native.timestampWrites = toGPUTimestampWrites(descriptor.timestampWrites, device, `${label}.timestampWrites`);
    }
    return native;
}
export class WebGPUComputePassEncoder {
    label;
    native;
    device;
    onEnd;
    _ended = false;
    /** 同 render pass：label 在生命周期内不变，报错用的 context 只建一次，避免每次调用现拼。 */
    contextSetPipeline;
    contextSetBindGroup;
    contextDispatchIndirect;
    constructor(device, native, label, onEnd) {
        this.device = device;
        this.native = native;
        this.label = label;
        this.onEnd = onEnd;
        const pass = `ComputePass "${label}"`;
        this.contextSetPipeline = `${pass}.setPipeline`;
        this.contextSetBindGroup = `${pass}.setBindGroup`;
        this.contextDispatchIndirect = `${pass}.dispatchWorkgroupsIndirect`;
    }
    get ended() {
        return this._ended;
    }
    setPipeline(pipeline) {
        this.assertOpen('setPipeline');
        this.native.setPipeline(asGPUComputePipeline(pipeline, this.contextSetPipeline));
    }
    setBindGroup(index, bindGroup, dynamicOffsets) {
        this.assertOpen('setBindGroup');
        if (bindGroup) {
            validateDynamicOffsets(bindGroup, dynamicOffsets, this.device, this.contextSetBindGroup);
            // 与渲染通道同理：dynamic offsets 必须真的传给原生调用，漏传会让整条 command buffer 失效。
            this.native.setBindGroup(index, asGPUBindGroup(bindGroup, this.contextSetBindGroup), dynamicOffsets ?? NO_DYNAMIC_OFFSETS);
            return;
        }
        if (dynamicOffsets && dynamicOffsets.length > 0) {
            throw new ValidationError(`[gpu-device-api] ComputePass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`);
        }
        this.native.setBindGroup(index, null);
    }
    dispatchWorkgroups(workgroupCountX, workgroupCountY = 1, workgroupCountZ = 1) {
        this.assertOpen('dispatchWorkgroups');
        this.native.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
    }
    dispatchWorkgroupsIndirect(indirect, indirectOffset = 0) {
        this.assertOpen('dispatchWorkgroupsIndirect');
        const context = this.contextDispatchIndirect;
        if ('indirectBuffer' in indirect) {
            this.native.dispatchWorkgroupsIndirect(asGPUBuffer(indirect.indirectBuffer, context), indirect.indirectOffset ?? 0);
            return;
        }
        this.native.dispatchWorkgroupsIndirect(asGPUBuffer(indirect, context), indirectOffset);
    }
    /** 调试分组：直接转发给原生的 `GPUComputePassEncoder`。 */
    pushDebugGroup(label) {
        this.assertOpen('pushDebugGroup');
        this.native.pushDebugGroup(label);
    }
    popDebugGroup() {
        this.assertOpen('popDebugGroup');
        this.native.popDebugGroup();
    }
    insertDebugMarker(label) {
        this.assertOpen('insertDebugMarker');
        this.native.insertDebugMarker(label);
    }
    /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
    end() {
        if (this._ended)
            return;
        this._ended = true;
        this.native.end();
        this.onEnd?.();
    }
    assertOpen(context) {
        if (this._ended) {
            throw new ValidationError(`[gpu-device-api] ComputePass "${this.label}".${context}: the pass has already ended.`);
        }
    }
}
//# sourceMappingURL=WebGPUComputePassEncoder.js.map