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
 */
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
}
export interface ProgramCacheOptions {
    gl: WebGL2RenderingContext;
    state: GlStateCache;
}
export declare class ProgramCache {
    private readonly gl;
    private readonly state;
    private readonly programs;
    constructor(options: ProgramCacheOptions);
    get size(): number;
    /**
     * 取得（或编译）一个 program。
     *
     * 只做「编译 + 链接 + 反射」，**不绑定 binding** —— 因为 `layout: 'auto'` 需要先链接出
     * program 才能反射出接口、再据此推断布局。绑定是第二步，见 {@link ProgramCache.bindPlan}。
     *
     * @param vertexSource 已包好 `#version` 与精度声明的顶点着色器源码
     * @param fragmentSource 已包好的片元着色器源码
     */
    acquire(label: string, vertexSource: string, fragmentSource: string): CompiledProgram;
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
    private compileShader;
    /**
     * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
     */
    private bindResources;
}
//# sourceMappingURL=ProgramCache.d.ts.map