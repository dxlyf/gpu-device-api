/**
 * WebGL2 的 pipeline layout。
 *
 * 它的职责是把「一组 bind group layout」转换为 {@link WebGLBindingPlan}，
 * 也就是 `(group, binding)` 到 GL 的 uniform block binding 点 / texture unit 的静态映射表。
 *
 * 计划本身按布局**内容**缓存（见 `BindingPlanCache`），因此同一个布局被多条管线复用时会拿到
 * 同一份分配，不会出现「同一帧里两次 draw 的纹理单元来回跳」的问题。
 *
 * `isAuto` 为 true 表示这是由 `layout: 'auto'` 推断出来的合成布局：
 * WebGL2 无法在拿到源码前推断，所以推断发生在链接 program 之后（见 `WebGL2RenderPipeline`）。
 */
import type { PipelineLayout, PipelineLayoutDescriptor } from '../../core/binding/PipelineLayout.js';
import type { BindGroupLayout } from '../../core/binding/BindGroupLayout.js';
import type { BindingPlanProvider } from './plan-provider.js';
import type { WebGLBindingPlan } from './TextureUnitAllocator.js';
export declare class WebGL2PipelineLayout implements PipelineLayout {
    readonly label: string;
    readonly bindGroupLayouts: readonly BindGroupLayout[];
    readonly isAuto: boolean;
    private readonly plan;
    constructor(descriptor: PipelineLayoutDescriptor, isAuto: boolean, planSource: BindingPlanProvider | null);
    get native(): WebGLBindingPlan | null;
    /** 该布局对应的绑定计划；没有 bind group 时为 `null`。 */
    get bindingPlan(): WebGLBindingPlan | null;
    get disposed(): boolean;
    /** 布局本身不持有 GL 资源，释放由 program 缓存负责。 */
    dispose(): void;
}
//# sourceMappingURL=WebGL2PipelineLayout.d.ts.map