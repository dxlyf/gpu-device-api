/**
 * WebGPU compute pipeline：`ComputePipeline` 接口在 `GPUComputePipeline` 上的实现。
 *
 * 与 render pipeline 不同，compute pipeline 不需要 attachment 格式或 vertex layout，
 * 因此没有 variant 的概念：第一次 `resolve()`（或访问 `native`）时编译一次并缓存。
 * `layout: 'auto'` 原样透传给 WebGPU。
 */
import type { ComputePipeline, ComputePipelineDescriptor } from '../../core/pipeline/ComputePipeline.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import type { CompilationInfo, PrewarmOptions, PrewarmResult } from '../../core/pipeline/CompilationInfo.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
/** compute 入口点缺省名，与 core 的文档一致。 */
export declare const DEFAULT_COMPUTE_ENTRY_POINT = "csMain";
export declare class WebGPUComputePipeline implements ComputePipeline {
    readonly label: string;
    readonly descriptor: ComputePipelineDescriptor;
    readonly layout: PipelineLayout | 'auto';
    private readonly device;
    private _native;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor: ComputePipelineDescriptor);
    /** 已经编译出原生 pipeline 时为 true（不触发编译）。 */
    get compiled(): boolean;
    /** 原生句柄；尚未编译时触发一次编译。 */
    get native(): GPUComputePipeline;
    get disposed(): boolean;
    /** 取得（必要时创建）原生 compute pipeline。 */
    resolve(): GPUComputePipeline;
    /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
    dispose(): void;
    /**
     * 异步预热：优先 `createComputePipelineAsync()`。
     *
     * 预热结果写进与 `resolve()` 相同的 `_native` 字段，所以之后第一次真正使用这条 compute
     * 管线时不再触发 GPU 编译。实现缺失 `createComputePipelineAsync` 时退化成同步创建，
     * `mode` 为 `'sync'`、`reason` 说明原因。失败不抛错（除非 `throwOnError`），诊断在 `info` 里。
     */
    prewarm(options?: PrewarmOptions): Promise<PrewarmResult>;
    /** 编译诊断：转发 `GPUShaderModule.getCompilationInfo()`。 */
    getCompilationInfo(): Promise<CompilationInfo>;
    /** 组装 `GPUComputePipelineDescriptor`（预热与 `resolve()` 走同一份，避免两处漂移）。 */
    private toGPUComputePipelineDescriptor;
    private collectCompilationInfo;
}
/** 该对象是否为 WebGPU 后端的 compute pipeline。 */
export declare function isWebGPUComputePipeline(value: unknown): value is WebGPUComputePipeline;
/** 把 core 的 `ComputePipeline` 收窄为原生 `GPUComputePipeline`。 */
export declare function asGPUComputePipeline(value: unknown, context: string): GPUComputePipeline;
//# sourceMappingURL=WebGPUComputePipeline.d.ts.map