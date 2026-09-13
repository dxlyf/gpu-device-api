/**
 * WebGPU bind group：`BindGroup` 接口在 `GPUBindGroup` 上的实现。
 *
 * core 的 `BindingResource` 是一个「看起来像什么就是什么」的联合（`buffer` / `sampler` /
 * `view` / `source`），因此这里做三件事：
 *
 * 1. 把资源收窄成原生对象（顺便拦住「把别的后端的资源交给 WebGPU」这类错误）；
 * 2. 用 layout entry 校验资源种类与关键约束（buffer 范围、sampleType 是否可过滤、
 *    viewDimension / multisampled 是否匹配、storage texture 格式是否一致）；
 * 3. 补齐缺省值（buffer 的 `offset` / `size`），并把 dynamic offset 的校验交给
 *    {@link validateDynamicOffsets}，供 pass encoder 在 `setBindGroup` 时使用。
 */
import type { BindGroup, BindGroupDescriptor } from '../../core/binding/BindGroup.js';
import type { BindGroupEntry } from '../../core/binding/BindingTypes.js';
import type { BindGroupLayout } from '../../core/binding/BindGroupLayout.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUBindGroup implements BindGroup {
    readonly label: string;
    readonly layout: BindGroupLayout;
    readonly entries: readonly BindGroupEntry[];
    readonly native: GPUBindGroup;
    private readonly byBinding;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor: BindGroupDescriptor);
    entry(binding: number): BindGroupEntry | undefined;
    get disposed(): boolean;
    /** GPUBindGroup 没有 destroy；释放只是把本包装对象标记为不可用。 */
    dispose(): void;
}
/**
 * 校验 `setBindGroup` 的 dynamic offsets。
 *
 * WebGPU 要求：声明了 `hasDynamicOffset` 的 entry 恰好一个 offset，且每个 offset 是
 * 对应（uniform / storage）对齐值的倍数。缺 offset、多 offset 都会让 WebGPU 抛一句很难读的
 * 校验错误，因此在录制阶段就报出来。
 */
export declare function validateDynamicOffsets(bindGroup: BindGroup, dynamicOffsets: readonly number[] | undefined, device: WebGPUDevice, context: string): void;
/** 该对象是否为 WebGPU 后端的 bind group。 */
export declare function isWebGPUBindGroup(value: unknown): value is WebGPUBindGroup;
/**
 * 把 core 的 `BindGroup` 收窄为原生 `GPUBindGroup`。
 *
 * WebGPU 的 `GPUBindGroup` 没有任何自有方法，无法鸭子类型判断，因此除本库的包装对象外，
 * 只接受「带 label 且不是 core 资源包装」的对象（escape hatch 的正常形态）。
 */
export declare function asGPUBindGroup(value: unknown, context: string): GPUBindGroup;
//# sourceMappingURL=WebGPUBindGroup.d.ts.map