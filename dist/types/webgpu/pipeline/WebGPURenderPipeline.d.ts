/**
 * WebGPU render pipeline：`RenderPipeline` 接口在 `GPURenderPipeline` 上的实现。
 *
 * **惰性编译**是这里的核心：core 允许 pipeline 不声明 attachment 格式、sample count 和
 * vertex layout（这样同一个 pipeline 才能服务多个 render target），而 `GPURenderPipeline`
 * 必须把这些信息烘焙进去。因此真正的创建推迟到第一次 `resolve(variant)`：
 *
 * - cache key = `{ colorFormats, sampleCount, depthFormat, vertexLayouts }`；
 * - 每个 key 对应一个 `GPURenderPipeline`，同一个 pipeline 对象可以持有多个 variant；
 * - `compiled` / `native` 反映真实状态：`compiled` 只表示「至少编译过一个 variant」，
 *   `native` 会触发一次默认 variant 的编译（拒绝「为了看起来有值而瞎编」）。
 *
 * `layout: 'auto'` 原样透传给 WebGPU。
 *
 * 关于 vertex layout：core 的 `VertexState.buffers` 可以省略（注释里说「在第一次 draw 时从
 * geometry 推导」），但 WebGPU 后端**做不到**这件事 —— `setVertexBuffer(slot, buffer, ...)`
 * 只给 buffer，不携带 attribute 布局，`Buffer` 也不带布局信息。因此对读取 vertex attribute
 * 的着色器必须显式提供 `buffers`（或通过 `resolve({ vertexLayouts })` 传入）。
 */
import type { RenderPipeline, RenderPipelineDescriptor, RenderPipelineVariant } from '../../core/pipeline/RenderPipeline.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import type { CompilationInfo, PrewarmOptions, PrewarmResult } from '../../core/pipeline/CompilationInfo.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
/** vertex / fragment 入口点缺省名，与 core 的文档一致。 */
export declare const DEFAULT_VERTEX_ENTRY_POINT = "vsMain";
export declare const DEFAULT_FRAGMENT_ENTRY_POINT = "fsMain";
export declare class WebGPURenderPipeline implements RenderPipeline {
    readonly label: string;
    readonly descriptor: RenderPipelineDescriptor;
    readonly layout: PipelineLayout | 'auto';
    readonly vertexLayouts: readonly VertexBufferLayout[] | null;
    private readonly device;
    private readonly cache;
    private readonly logger;
    private readonly sampleCountContext;
    private _disposed;
    private warnedMissingVertexLayouts;
    /** `defaultColorFormats()` 的结果只依赖 readonly descriptor，缓存后避免每次解析都新建数组。 */
    private defaultColorFormatsCache;
    /** 上一次 `resolve()` 的入参与结果，用于按身份快速命中（见 {@link WebGPURenderPipeline.resolve}）。 */
    private lastVariantInput;
    private lastVariantColorFormats;
    private lastVariantSampleCount;
    private lastVariantDepthFormat;
    private lastVariantVertexLayouts;
    private lastVariantResolved;
    private lastVariantKey;
    constructor(device: WebGPUDevice, descriptor: RenderPipelineDescriptor);
    /** 至少编译过一个 variant 时为 true（不触发编译）。 */
    get compiled(): boolean;
    /** 原生句柄；会按默认 variant 触发一次编译。 */
    get native(): GPURenderPipeline;
    /** 当前已编译的 variant 数量。 */
    get variantCount(): number;
    get disposed(): boolean;
    /**
     * 解析（并缓存）某个 target/variant 对应的具体 pipeline。
     *
     * `variant` 里未给出的字段按以下顺序取值：pipeline descriptor → `render` 预设 → 默认值。
     *
     * 同一个 render pass 内每次 `setPipeline` 传的都是同一个 variant 请求对象
     *（见 `WebGPURenderPassEncoder` 的 `variantRequest`），因此这里按「入参身份 + 字段值」
     * 复用上一次的解析结果与 cache key：命中时不再新建 resolved 对象、不再 `join` colorFormats、
     * 也不再重算 vertex layout key —— 这些原本都在每 draw 的路径上。
     */
    resolve(variant?: Partial<RenderPipelineVariant>): GPURenderPipeline;
    /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
    get compiledVariants(): readonly string[];
    /**
     * 异步预热一个 variant：优先 `createRenderPipelineAsync()`。
     *
     * 为什么这不只是「再调用一次 resolve()」：`createRenderPipeline` 是**同步**返回的，
     * 驱动在后台编译，第一次真正使用这条管线的那一帧要为编译付掉卡顿；
     * `createRenderPipelineAsync` 会等到编译完成才 resolve，于是这段等待落在预热调用里
     *（可以在加载界面、下一帧之前、甚至 `requestIdleCallback` 里做），而不是落在渲染循环里。
     *
     * 预热出来的原生管线会**写进与 `resolve()` 相同的 variant 缓存**，所以首次使用该 variant 时
     * `resolve()` 直接命中、不再产生任何 GPU 编译调用。
     *
     * 实现缺失 `createRenderPipelineAsync` 时退化成同步创建，`mode` 为 `'sync'` 且 `reason`
     * 说明原因 —— 不会假装异步。编译失败同样不抛错（除非 `throwOnError`），诊断在 `info` 里。
     */
    prewarm(variant?: Partial<RenderPipelineVariant>, options?: PrewarmOptions): Promise<PrewarmResult>;
    /**
     * 编译诊断：把 vertex / fragment 两个 `GPUShaderModule` 的 `getCompilationInfo()` 合起来。
     *
     * WGSL 一份源码包含所有 entry point，诊断内容与 variant 无关，所以这里不需要 variant 参数
     *（保留它只是为了与 `resolve()` / `prewarm()` 的签名对齐）。
     */
    getCompilationInfo(_variant?: Partial<RenderPipelineVariant>): Promise<CompilationInfo>;
    /** 取两个阶段的诊断并合并；`failure` 是 `createRenderPipelineAsync` 抛出的原文。 */
    private collectCompilationInfo;
    /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
    dispose(): void;
    private resolveVariant;
    /**
     * descriptor 里声明的（或从 fragment targets 推导出的）color format 列表。
     *
     * 推导路径原先每次调用都新建一个数组；descriptor 是 readonly 的，结果缓存到实例上，
     * 与「共享空数组」一起消掉每 draw 的数组分配。
     */
    private defaultColorFormats;
    private createNative;
    /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
    toGPURenderPipelineDescriptor(variant: RenderPipelineVariant): GPURenderPipelineDescriptor;
}
/** 该对象是否为 WebGPU 后端的 render pipeline。 */
export declare function isWebGPURenderPipeline(value: unknown): value is WebGPURenderPipeline;
/**
 * 把 core 的 `RenderPipeline` 收窄为原生 `GPURenderPipeline`。
 *
 * 传入 `WebGPURenderPipeline` 时会走 `resolve(variant)`；如果是别的后端（或 escape hatch
 * 拿到的原生 pipeline），只能按「已经建好的对象」直接使用。
 */
export declare function asGPURenderPipeline(value: unknown, context: string, variant?: Partial<RenderPipelineVariant>): GPURenderPipeline;
/** 供 cache key 诊断使用：只列出会参与 key 的字段。 */
export declare function describeRenderPipelineVariant(variant: RenderPipelineVariant): string;
//# sourceMappingURL=WebGPURenderPipeline.d.ts.map