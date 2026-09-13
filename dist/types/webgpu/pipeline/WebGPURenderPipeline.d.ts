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
    private _disposed;
    private warnedMissingVertexLayouts;
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
     */
    resolve(variant?: Partial<RenderPipelineVariant>): GPURenderPipeline;
    /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
    get compiledVariants(): readonly string[];
    /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
    dispose(): void;
    private resolveVariant;
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