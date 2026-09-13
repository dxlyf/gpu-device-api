/**
 * WebGPU sampler 资源：`Sampler` 接口在 `GPUSampler` 上的实现。
 *
 * WebGPU 的 sampler 是**格式无关**的不可变对象：能不能过滤取决于 texture 的 sampleType，
 * 因此这里不做「filtering sampler 配了不可过滤格式」的校验（那要在 bind group 那一层
 * 通过 `texture.sampleType` 表达）。本类只负责枚举映射与少量数值自检。
 */
import type { Sampler, SamplerDescriptor } from '../../core/resources/Sampler.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUSampler implements Sampler {
    readonly label: string;
    readonly descriptor: Sampler['descriptor'];
    readonly native: GPUSampler;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor?: SamplerDescriptor);
    get disposed(): boolean;
    /** 是否为用于阴影查找的比较 sampler。 */
    get isComparison(): boolean;
    /** GPUSampler 没有 destroy；释放只是把本包装对象标记为不可用。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 sampler。 */
export declare function isWebGPUSampler(value: unknown): value is WebGPUSampler;
/** 原生 `GPUSampler` 的形状识别。 */
export declare function isNativeGPUSampler(value: unknown): value is GPUSampler;
/** 把任意 sampler 表示收窄为原生 `GPUSampler`。 */
export declare function asGPUSampler(value: unknown, context: string): GPUSampler;
//# sourceMappingURL=WebGPUSampler.d.ts.map