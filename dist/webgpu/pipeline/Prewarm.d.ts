/**
 * WebGPU 的**异步管线预热**入口。
 *
 * WebGPU 的 `createRenderPipeline()` / `createComputePipeline()` 是同步返回的：驱动在后台编译，
 * 而「第一次真正使用这条管线」的那一帧要为编译付掉卡顿（`setPipeline` 之后的第一次 draw 会
 * 明显变慢）。`createRenderPipelineAsync()` 会等到编译完成才 resolve，于是这段等待可以落在
 * 预热调用里（加载界面、切场景的黑帧、`requestIdleCallback`……），而不是落在渲染循环里。
 *
 * 与 `prewarmWebGL2RenderPipeline()` 的**顺序差异**被封装在这里：
 * WebGPU 先建管线对象、再 `await pipeline.prewarm(variant)`；WebGL2 先把 program 链接好、再建管线。
 * 两个 helper 的返回值形状相同（{@link RenderPipelinePrewarmResult}），上层可以用同一段代码调用。
 *
 * 实现缺失 `createRenderPipelineAsync` 时退化成同步创建，`mode` 为 `'sync'` 且 `reason`
 * 说明原因 —— 不会假装异步。编译失败不抛错（除非 `throwOnError`），诊断在 `info` 里。
 */
import type { Device } from '../../core/Device.js';
import type { ComputePipelinePrewarmResult, PrewarmOptions, RenderPipelinePrewarmResult } from '../../core/pipeline/CompilationInfo.js';
import type { ComputePipelineDescriptor } from '../../core/pipeline/ComputePipeline.js';
import type { RenderPipelineDescriptor, RenderPipelineVariant } from '../../core/pipeline/RenderPipeline.js';
/**
 * 异步预热一条 render pipeline，返回可以直接使用的管线。
 *
 * `variant` 与 `RenderPipeline.resolve(variant)` 的形状一致（`colorFormats` / `sampleCount` /
 * `depthFormat` / `vertexLayouts`）。不传时用 descriptor 里声明的（`colorFormats`、
 * `multisample.count`、`depthStencil.format`、`vertex.buffers`）。
 */
export declare function prewarmWebGPURenderPipeline(device: Device, descriptor: RenderPipelineDescriptor, variant?: Partial<RenderPipelineVariant>, options?: PrewarmOptions): Promise<RenderPipelinePrewarmResult>;
/** 异步预热一条 compute pipeline（`createComputePipelineAsync`）。 */
export declare function prewarmWebGPUComputePipeline(device: Device, descriptor: ComputePipelineDescriptor, options?: PrewarmOptions): Promise<ComputePipelinePrewarmResult>;
//# sourceMappingURL=Prewarm.d.ts.map