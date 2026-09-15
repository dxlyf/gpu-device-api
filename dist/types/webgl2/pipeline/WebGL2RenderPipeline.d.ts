/**
 * WebGL2 的 render pipeline。
 *
 * 与 WebGPU 不同，WebGL2 的管线**可以立即编译**：顶点属性位置由 GLSL 里的
 * `layout(location = N)` 写死，附件格式也不影响 program 的链接结果。
 * 所以这里在 `createRenderPipeline()` 时就编译好 program，错误能尽早暴露；
 * `resolve(variant)` 只负责「按渲染目标解析固定功能状态 + 校验顶点布局」，非常廉价。
 *
 * VAO（顶点数组对象）也放在这里缓存：它记录的是「program 的属性槽 + 具体顶点缓冲」的组合，
 * 所以生命周期跟着管线走最自然。缓存键包含顶点缓冲对象、偏移、步长与索引缓冲，
 * 因此同一个几何体反复绘制时只需要建一次 VAO。
 */
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import type { RenderPipeline, RenderPipelineDescriptor, RenderPipelineVariant } from '../../core/pipeline/RenderPipeline.js';
import type { CompilationInfo, PrewarmOptions, PrewarmResult } from '../../core/pipeline/CompilationInfo.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGLBindingPlan } from '../binding/TextureUnitAllocator.js';
import { type ResolvedRenderState } from './WebGL2RenderState.js';
import type { CompiledProgram } from './ProgramCache.js';
/** 某个渲染目标形态下解析出来的一份具体状态。 */
export interface ResolvedVariant {
    readonly key: string;
    readonly renderState: ResolvedRenderState;
    readonly depthFormat: string | null;
    readonly sampleCount: number;
    /**
     * 该形态使用的顶点布局。
     *
     * 之所以放进变体而不是只读描述里的：便捷层会为同一个材质服务多个几何体，
     * 属性集合不同则布局不同。放在变体里，`acquireVertexArray` 才会用**本次实际使用的**布局，
     * 否则会拿描述里的旧布局去建 VAO，属性指针就全错了。
     */
    readonly vertexLayouts: readonly VertexBufferLayout[];
    /** 该形态下已经建好的 VAO，键里含顶点缓冲组合。 */
    readonly vertexArrays: Map<string, WebGLVertexArrayObject>;
    /**
     * 最近一次 VAO 查询的结果（一次只记一条）。
     *
     * `revision` 由渲染通道在每次顶点/索引绑定**真正变化**时更新，只增不减，
     * 所以「版本号相同」等价于「顶点缓冲与索引缓冲的绑定内容完全相同」。
     * 命中时可以直接返回上一次的 VAO，省掉每次 draw 重建 O(属性数) 键字符串的开销。
     */
    vertexArrayLookup: {
        revision: number;
        vertexArray: WebGLVertexArrayObject;
    } | null;
}
/** 一个顶点缓冲槽的绑定内容。 */
export interface VertexBufferBinding {
    buffer: WebGL2Buffer;
    offset: number;
    /** `-1` 表示一直到缓冲末尾。 */
    size: number;
}
export interface WebGL2RenderPipelineOptions {
    gl: WebGL2RenderingContext;
    state: GlStateCache;
    limits: {
        maxVertexAttributes: number;
        maxVertexBufferArrayStride: number;
    };
    /**
     * 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
     * （见 `WebGL2Device.untrack`）。不传时为空操作，管线仍可独立使用。
     */
    onDispose?: (pipeline: WebGL2RenderPipeline) => void;
}
export declare class WebGL2RenderPipeline implements RenderPipeline {
    readonly label: string;
    readonly descriptor: RenderPipelineDescriptor;
    readonly layout: PipelineLayout | 'auto';
    readonly vertexLayouts: readonly VertexBufferLayout[] | null;
    private readonly gl;
    private readonly state;
    private readonly limits;
    private readonly onDispose;
    private readonly program;
    private readonly plan;
    private readonly topologyMode;
    private readonly variantCache;
    private _disposed;
    constructor(descriptor: RenderPipelineDescriptor, program: CompiledProgram, layout: PipelineLayout | 'auto', options: WebGL2RenderPipelineOptions);
    /** WebGL2 在创建时就完成了编译。 */
    get compiled(): boolean;
    /** 已链接好的 program 等内部信息（供渲染通道与调试使用）。 */
    get compiledProgram(): CompiledProgram;
    /** GL 图元模式。 */
    get mode(): number;
    get bindingPlan(): WebGLBindingPlan | null;
    get disposed(): boolean;
    get native(): WebGLProgram;
    /**
     * 按渲染目标形态解析状态。同一形态只解析一次；顶点布局也在这里做一次校验。
     */
    resolveVariant(variant?: Partial<RenderPipelineVariant>): ResolvedVariant;
    /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
    resolve(variant?: Partial<RenderPipelineVariant>): unknown;
    /**
     * 预热报告。
     *
     * WebGL2 的编译 + 链接发生在 `createRenderPipeline()` 里（`ProgramCache.acquire()`），
     * 所以**管线对象存在时 program 一定已经链接完了**，这里没有东西可以再等 —— 能做的是
     * 如实汇报它是怎么等出来的，以及带上诊断（真实行号）。
     *
     * | 情况 | `mode` | 说明 |
     * | --- | --- | --- |
     * | 事先调用过 `ProgramCache.compileAsync()`（`KHR_parallel_shader_compile` 可用） | `'async'` | 链接真异步完成，管线创建时零 GL 调用 |
     * | 扩展缺失，`compileAsync()` 退化成同步 | `'sync'` | `reason` 说明缺扩展 |
     * | 直接 `device.createRenderPipeline()`（没预热过） | `'sync'` | `reason` 提示先在创建管线前调 `compileAsync()` |
     *
     * **真想异步就调 `prewarmWebGL2RenderPipeline(device, descriptor)`**（`src/webgl2/pipeline/Prewarm.ts`）：
     * 它在创建管线**之前**先把 program 链接好，之后 `createRenderPipeline()` 的 `acquire()` 直接命中缓存。
     */
    prewarm(_variant?: Partial<RenderPipelineVariant>, _options?: PrewarmOptions): Promise<PrewarmResult>;
    /**
     * 编译诊断：WebGL2 走的是 `getShaderInfoLog()` / `getProgramInfoLog()` 的原文，
     * 在 program 编译/链接的那一刻就解析好并挂在 `CompiledProgram.compilationInfo` 上。
     * `lineNum` 是真实的（从 GL 日志里解析出来的行号，指向**包好前言之后的最终源码**），
     * `linePos` 恒为 `null`（GL 的日志只有行号，没有列号）。
     */
    getCompilationInfo(): Promise<CompilationInfo>;
    /** 把该管线的固定功能状态写入 GL 状态缓存。 */
    applyState(variant: ResolvedVariant, stencilReference?: number): void;
    /**
     * 取得（必要时创建）一个顶点数组对象。
     *
     * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
     * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
     *
     * `bindingRevision` 由调用方（渲染通道）维护：同一个版本号必须对应同一份顶点/索引绑定内容。
     * 传 0 表示调用方不提供版本号，此时只走下面按内容构建的缓存键。
     */
    acquireVertexArray(variant: ResolvedVariant, bindings: readonly (VertexBufferBinding | null)[], indexBuffer: WebGLBuffer | null, bindingRevision?: number): WebGLVertexArrayObject | null;
    /** 当前缓存了多少个 VAO（跨全部形态）。 */
    get vertexArrayCount(): number;
    dispose(): void;
}
//# sourceMappingURL=WebGL2RenderPipeline.d.ts.map