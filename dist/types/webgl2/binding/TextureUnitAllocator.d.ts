/**
 * 绑定计划：把 WebGPU 形状的 `PipelineLayout` 翻译成 WebGL2 能执行的一整套「槽位分配」。
 *
 * 这是 WebGL2 后端最关键的一块。WebGPU 的 bind group 是运行时的强绑定模型，而 GL 只有两种东西：
 * 全局的 **uniform block binding 点** 和全局的 **texture unit**。要让上层代码在两个后端写起来一样，
 * 必须在创建管线时就把 `(group, binding)` **静态**映射到具体的 block binding 点与 texture unit，
 * 之后 `setBindGroup` 才能只是「按计划把资源塞进对应的槽」。
 *
 * 分配结果的稳定性很重要：计划由 `PipelineLayout` 的内容（而不是对象身份）决定并缓存，
 * 因此同一个布局被多条管线复用时拿到的是同一份分配，避免同一帧里槽位来回抖动。
 *
 * 纹理与采样器的配对规则（按优先级）：
 * 1. 名字符合 `<纹理名>_sampler` 的 sampler 条目；
 * 2. 同一 group 内 binding 等于 `纹理 binding + 1` 的 sampler 条目。
 * 这与 WGSL 里 `@binding(2i)` / `@binding(2i+1)` 的常见写法天然吻合。
 */
import type { BindGroupLayoutEntry } from '../../core/binding/BindingTypes.js';
/** 一个 uniform block 在 GL 里的落点。 */
export interface UniformBlockSlot {
    group: number;
    binding: number;
    /** GLSL 里 uniform block 的名字（来自 `BindGroupLayoutEntry.name`）。 */
    name: string;
    /** `gl.uniformBlockBinding` 使用的 binding 点。 */
    blockBinding: number;
    /** 是否用 `bindBufferRange` 配合动态偏移绑定（uniform arena）。 */
    dynamic: boolean;
    /** 绑定范围的最小字节数（来自 `minBindingSize`）。 */
    minBindingSize: number;
}
/** 一张纹理在 GL 里的落点。 */
export interface TextureSlot {
    group: number;
    binding: number;
    /** GLSL 里 sampler uniform 的名字。 */
    name: string;
    /** 分配到的纹理单元。 */
    unit: number;
    /** 配对 sampler 条目的 binding；没有声明 sampler 时为 `null`。 */
    samplerBinding: number | null;
    samplerName: string | null;
}
export interface BindingPlanLimits {
    /** 可用纹理单元上限（取 `MAX_COMBINED_TEXTURE_IMAGE_UNITS`）。 */
    maxTextureUnits: number;
    /** 可用 uniform block binding 点上限（取 `MAX_UNIFORM_BUFFER_BINDINGS`）。 */
    maxUniformBufferBindings: number;
}
export interface WebGLBindingPlan {
    /** key 为 `group:binding`。 */
    readonly uniformBlocks: ReadonlyMap<string, UniformBlockSlot>;
    /** key 为 `group:binding`，只包含纹理条目。 */
    readonly textures: ReadonlyMap<string, TextureSlot>;
    /**
     * 按 group 预分解的槽位（每个出现在布局里的 group 都有一份，可能是空数组）。
     *
     * `applyBindGroups()` 每 draw 都要「遍历本 group 的槽位」，如果每 draw 从 `uniformBlocks`
     * 里 `filter()` + `sort()`，40k draw 就是上万次短命数组。槽位分配在计划创建时就固定了，
     * 所以这些列表在构建时算一次即可 —— 而且 `groups.forEach` + 组内按 binding 排序保证了
     * 列表本身已经是升序，运行时不需要再排序。
     */
    readonly uniformBlocksByGroup: ReadonlyMap<number, readonly UniformBlockSlot[]>;
    /** 按 group 预分解的动态 uniform block（`hasDynamicOffset: true`）。 */
    readonly dynamicBlocksByGroup: ReadonlyMap<number, readonly UniformBlockSlot[]>;
    /** 按 group 预分解的纹理槽位。 */
    readonly texturesByGroup: ReadonlyMap<number, readonly TextureSlot[]>;
    /** 布局要求过的 group 序号（升序），用于 O(groups) 的「漏绑」检查。 */
    readonly requiredGroups: readonly number[];
    /** 计划内容指纹，用于缓存。 */
    readonly key: string;
    readonly textureUnitCount: number;
    readonly uniformBlockCount: number;
}
export declare function bindingSlotKey(group: number, binding: number): string;
/**
 * 由一组（按 group 索引的）布局条目构建绑定计划。
 *
 * @param groups 每个 group 的条目列表，索引即 group 序号
 */
export declare function buildBindingPlan(groups: readonly (readonly BindGroupLayoutEntry[])[], limits: BindingPlanLimits): WebGLBindingPlan;
/** 绑定计划缓存：相同布局内容复用同一份分配，保证同一帧内槽位不抖动。 */
export declare class BindingPlanCache {
    private readonly plans;
    private readonly limits;
    constructor(limits: BindingPlanLimits);
    /** 按布局内容取计划，未命中则构建。 */
    get(groups: readonly (readonly BindGroupLayoutEntry[])[]): WebGLBindingPlan;
    get size(): number;
    clear(): void;
}
//# sourceMappingURL=TextureUnitAllocator.d.ts.map