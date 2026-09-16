/**
 * GL program 缓存。
 *
 * 一个 WebGL2 的 program = 一个 vertex shader + 一个 fragment shader 链接而来，
 * 所以缓存键就是这两份**已经包好前言的最终源码**（`src/shaders` 的 `compileShaderStage` 产出）。
 * 同一对源码只会编译链接一次，多条管线、多个材质共享同一个 program。
 *
 * 链接成功后还要做两件 GL 专属的收尾工作，这里一并完成：
 * 1. **绑定 uniform block**：把布局计划里的 block binding 点写进 program
 *    （`gl.uniformBlockBinding`）。GL 的 block 索引是 program 私有的，必须逐个 program 设置。
 * 2. **给 sampler uniform 赋纹理单元**：`gl.uniform1i(location, unit)`，同样只做一次。
 *
 * 最关键的是随后的**交叉校验**：把 program 的实际接口与布局计划对照，
 * 报出「着色器用了但布局没声明」和「布局声明了但着色器没用」。
 * 前者会让程序读到垃圾数据、画面全黑却毫无报错，是 WebGL 里最难查的一类问题。
 *
 * ## 同步 `acquire()` 与异步 {@link ProgramCache.compileAsync}
 *
 * `acquire()` 是**同步**的：`gl.getProgramParameter(program, LINK_STATUS)` 会一直阻塞到链接
 * 完成（这是 GL 规范规定的行为），所以「第一次用到某个变体」的那一帧要为编译 + 链接付卡顿。
 *
 * `compileAsync()` 用 `KHR_parallel_shader_compile` 的 `COMPLETION_STATUS_KHR` 做轮询：
 * 那个查询**不会阻塞**，返回 false 就说明还在编译，让出一轮事件循环再问。
 * 等它返回 true 之后再去查 `COMPILE_STATUS` / `LINK_STATUS`（这时才不会阻塞）。
 * 链接结果会写进与 `acquire()` **相同的缓存键**，于是后续 `device.createRenderPipeline()`
 * 里的 `acquire()` 直接命中、一次 GL 调用都不发生。
 *
 * 扩展不可用时**如实降级**：`compileAsync()` 仍然可用，但内部就是同步的，
 * 返回的 `mode` 是 `'sync'`、`reason` 说明缺 `KHR_parallel_shader_compile`。
 * 不会假装异步。
 */
import type { CompilationInfo, PrewarmMode, PrewarmOptions, PrewarmResult } from '../../core/pipeline/CompilationInfo.js';
import { type GlslProgramReflection } from '../../shaders/reflection/GLSLReflector.js';
import type { WebGLBindingPlan } from '../binding/TextureUnitAllocator.js';
import type { GlStateCache } from '../utils/glStateCache.js';
export interface CompiledProgram {
    readonly program: WebGLProgram;
    readonly reflection: GlslProgramReflection;
    /** `group:binding` 到 gl.uniformBlockBinding 用的 block binding 点（`bindPlan` 之后填充）。 */
    blockBindings: ReadonlyMap<string, number>;
    /** `group:binding` 到 sampler uniform 的位置（`bindPlan` 之后填充）。 */
    samplerLocations: ReadonlyMap<string, WebGLUniformLocation>;
    /** 被优化掉的 uniform block 名字（着色器里声明了但没用到），仅用于诊断。 */
    optimizedOutBlocks: readonly string[];
    readonly label: string;
    /** 已经绑定过哪个计划；`null` 表示还没绑定。 */
    boundPlanKey: string | null;
    /** 这个 program 是怎么链接出来的：`'async'` 表示走过 {@link ProgramCache.compileAsync} 的真异步等待。 */
    readonly linkMode: PrewarmMode;
    /** 不是真异步时的原因（缺扩展 / 是同步 `acquire()` 链出来的）；真异步时为 `null`。 */
    readonly linkReason: string | null;
    /** 编译 + 链接阶段的诊断（WebGL 的日志原文与解析出的行号）。 */
    readonly compilationInfo: CompilationInfo;
}
export interface ProgramCacheOptions {
    gl: WebGL2RenderingContext;
    state: GlStateCache;
}
/** `compileAsync()` 的结果。 */
export interface ProgramPrewarmOutcome {
    /** 链接成功的 program；失败或超时时为 `null`。 */
    readonly compiled: CompiledProgram | null;
    readonly ok: boolean;
    readonly mode: PrewarmMode;
    readonly reason: string | null;
    readonly durationMs: number;
    readonly info: CompilationInfo;
}
/** 缓存键：vertex 与 fragment 的最终源码，用一个不可能出现在源码里的分隔符拼起来。 */
export declare function programCacheKey(vertexSource: string, fragmentSource: string): string;
export declare class ProgramCache {
    private readonly gl;
    private readonly state;
    private readonly programs;
    /** 正在进行中的异步链接，按缓存键去重（同一对源码并发预热只会链接一次）。 */
    private readonly pending;
    /** `KHR_parallel_shader_compile` 的探测结果；`undefined` 表示还没查过。 */
    private parallelExtension;
    /** `clear()` 会自增它：异步链接完成时若代数变了就不再往缓存里写（否则会泄漏一个没人释放的 program）。 */
    private generation;
    constructor(options: ProgramCacheOptions);
    get size(): number;
    /**
     * 取得（或编译）一个 program。
     *
     * 只做「编译 + 链接 + 反射」，**不绑定 binding** —— 因为 `layout: 'auto'` 需要先链接出
     * program 才能反射出接口、再据此推断布局。绑定是第二步，见 {@link ProgramCache.bindPlan}。
     *
     * 这是**同步**路径：需要真正异步请用 {@link ProgramCache.compileAsync}。
     *
     * @param vertexSource 已包好 `#version` 与精度声明的顶点着色器源码
     * @param fragmentSource 已包好的片元着色器源码
     */
    acquire(label: string, vertexSource: string, fragmentSource: string): CompiledProgram;
    /**
     * **异步**编译 + 链接（管线预热的入口）。
     *
     * 与 `acquire()` 的语义完全一致（同一份缓存键、同一个 `CompiledProgram`），区别只在于等待方式：
     *
     * - 有 `KHR_parallel_shader_compile` 时用 `COMPLETION_STATUS_KHR` 轮询，**不阻塞**调用方
     *   （每次轮询之间让出一轮事件循环），`mode` 为 `'async'`；
     * - 没有该扩展时退化成同步，`mode` 为 `'sync'` 且 `reason` 说明原因；
     * - 超时（默认 30s）不算抛错：`ok` 为 false、`reason` 说明超时，资源会被清理。
     *
     * 编译/链接失败**不抛错**（预热不该让渲染挂掉）：`ok` 为 false，
     * 诊断（含真实行号）在 `info` 里；调用方想直接抛错可以看 `info.hasErrors` 自己决定。
     *
     * 成功时会写进与 `acquire()` 相同的缓存，所以随后 `device.createRenderPipeline()` 里的
     * `acquire()` 会直接命中 —— 这是「预热有效」的判据（可以数 GL 调用次数来验证）。
     */
    compileAsync(label: string, vertexSource: string, fragmentSource: string, options?: PrewarmOptions): Promise<ProgramPrewarmOutcome>;
    /** 把一次预热结果转成通用的 {@link PrewarmResult}（供 pipeline / device 层转发）。 */
    static toPrewarmResult(label: string, outcome: ProgramPrewarmOutcome): PrewarmResult;
    /**
     * 把绑定计划写进 program：设置 uniform block 的 binding 点、给 sampler uniform 赋纹理单元，
     * 并把 program 的实际接口与计划做交叉校验。
     *
     * 可以安全地重复调用（同一个计划只生效一次），因为 `layout: 'auto'` 的流程里
     * 计划要等链接完才能算出来。
     */
    bindPlan(compiled: CompiledProgram, plan: WebGLBindingPlan | null): void;
    /** 释放缓存里的全部 program。 */
    clear(): void;
    dispose(): void;
    /** 探测 `KHR_parallel_shader_compile`（按 context 只查一次）。 */
    private parallelCompile;
    /** `compileAsync()` 的实际实现：编译 → 等 → 链接 → 等 → 反射。 */
    private linkAsync;
    /** 轮询 `check()` 直到返回 true 或超时；每次轮询之间让出一轮事件循环。 */
    private waitFor;
    private createShaderObject;
    private compileShader;
    /**
     * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
     */
    private bindResources;
}
//# sourceMappingURL=ProgramCache.d.ts.map