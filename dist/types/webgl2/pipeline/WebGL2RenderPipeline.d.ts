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
    /** 该形态下已经建好的 VAO，键里含顶点缓冲组合；有上限的 LRU（见 {@link VertexArrayStore}）。 */
    readonly vertexArrays: VertexArrayStore;
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
/**
 * VAO 缓存需要的容器能力。
 *
 * 真正的实现是 core 的 LRU（`createPipelineCache`，带上限 + 最近使用刷新，见 {@link resolveVariant}）。
 * 类型写成结构化的而不是直接写 `PipelineCache<WebGLVertexArrayObject>`：这里只用到
 * 「按键取值 / 存值 / 报大小 / 遍历 / 清空」这几个操作，写成结构化形式后测试里的替身
 * （例如 `new Map()`）也能满足（`values()` 用 `Iterable` 是因为 `Map.values()` 是迭代器、
 * `PipelineCache.values()` 是数组，两者都满足）。
 */
export interface VertexArrayStore {
    get(key: string): WebGLVertexArrayObject | undefined;
    set(key: string, value: WebGLVertexArrayObject): unknown;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    readonly size: number;
    values(): Iterable<WebGLVertexArrayObject>;
}
/**
 * 每个管线变体缓存的 VAO 上限。
 *
 * 为什么必须有上限（#33）：这个缓存键里含**顶点缓冲对象与索引缓冲**，长期运行的程序
 * （例如每帧换一块顶点缓冲的粒子系统）会让条目数无限增长，而每个 VAO 都占着驱动侧的状态对象。
 * 复用 `createPipelineCache` 的 LRU 之后，最坏情况是「多建几个 VAO」，不会再无界增长。
 *
 * 取 64 的理由与 `FramebufferCache` 的默认上限一致：正常场景里「一条管线 × 一个渲染目标形态」
 * 同时用到的顶点布局组合远少于此，而 64 个 VAO 的状态开销可以忽略。
 */
export declare const DEFAULT_VERTEX_ARRAY_CACHE_LIMIT = 64;
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
     * 每个变体的 VAO 缓存上限（LRU）。默认 {@link DEFAULT_VERTEX_ARRAY_CACHE_LIMIT}。
     * 必须是 `>= 1` 的整数 —— 见 {@link WebGL2RenderPipeline.evictVertexArray} 的安全性论证（第 2 条）。
     */
    vertexArrayCacheLimit?: number;
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
    /** 每个变体的 VAO 缓存上限（构造时校验过，一定 `>= 1`）。 */
    private readonly vertexArrayCacheLimit;
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
    /**
     * LRU 淘汰一个 VAO 时的收尾（#33）。
     *
     * ## 为什么「淘汰一个正在使用的 VAO」不会让后续 draw 用错绑定点（安全性论证）
     *
     * 1. GLES 3.0 里 `deleteVertexArray` 删除**当前绑定**的 VAO 会把该绑定点复位
     *    （绑定变成「没有 VAO」，默认 VAO 生效）。所以真正的危险不是删除本身，
     *    而是「删除之后还有谁以为它还绑着」—— 那会让后续 draw 跳过重新绑定。
     * 2. 淘汰只发生在 `PipelineCache.set()` 里，而 `acquireVertexArray()` 的顺序一定是
     *    **先** `state.bindVertexArray(新建的 VAO)`（`gl.createVertexArray()` 之后立刻绑、
     *    再录属性和索引缓冲）、**后** `variant.vertexArrays.set(...)`。LRU 淘汰的是 `Map` 里
     *    最旧的那个，刚插入的排在队尾；在构造时已强制 `limit >= 1` 的前提下，
     *    被淘汰的**永远不是**当前绑定的那个。最坏情况只是「多建一个 VAO」。
     * 3. 会残留「以为还绑着」的地方只有两处，都在下面处理掉了：
     *    - {@link ResolvedVariant.vertexArrayLookup}：这条快速路径**绕过**缓存表直接返回上次的 VAO，
     *      被淘汰后它可能仍指着已删除的对象 —— 必须清掉，否则下一次同版本的 draw 会拿它去绑定。
     *    - `GlStateCache.vertexArray`：状态缓存里的「当前绑定」记录。GL 的删除已经解绑，
     *      缓存若不同步就会谎称「还绑着」，后续 draw 会跳过 `bindVertexArray`（不会报错，只是画错）。
     * 4. 被淘汰的键下次 `acquireVertexArray()` 会未命中并重建一个新对象，而 `bindVertexArray()`
     *    是按对象身份比较的，新旧不同 → 一定重新下发。所以「淘汰正在使用的 VAO」是安全的。
     */
    private evictVertexArray;
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