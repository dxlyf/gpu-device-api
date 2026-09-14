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
}
export declare class WebGL2RenderPipeline implements RenderPipeline {
    readonly label: string;
    readonly descriptor: RenderPipelineDescriptor;
    readonly layout: PipelineLayout | 'auto';
    readonly vertexLayouts: readonly VertexBufferLayout[] | null;
    private readonly gl;
    private readonly state;
    private readonly limits;
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