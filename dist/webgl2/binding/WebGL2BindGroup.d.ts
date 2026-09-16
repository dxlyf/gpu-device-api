/**
 * WebGL2 的 bind group。
 *
 * 它本身不做任何 GL 调用 —— 只是**把资源与 binding 号绑定在一起并做校验**的容器。
 * 真正的绑定动作发生在 `WebGL2RenderPassEncoder.setBindGroup()`：
 * 那时才拿得到当前管线的 {@link import('./TextureUnitAllocator.js').WebGLBindingPlan}，
 * 从而知道这个 group 的每个 binding 该落到哪个 uniform block binding 点或纹理单元。
 *
 * 这样做的好处是同一个 BindGroup 对象可以在不同管线之间复用，
 * 因为「落到哪里」是管线的属性，而不是 bind group 的属性。
 */
import type { BindGroup, BindGroupDescriptor } from '../../core/binding/BindGroup.js';
import type { BindGroupEntry } from '../../core/binding/BindingTypes.js';
import type { WebGL2BindGroupLayout } from './WebGL2BindGroupLayout.js';
export declare class WebGL2BindGroup implements BindGroup {
    readonly label: string;
    readonly layout: WebGL2BindGroupLayout;
    readonly entries: readonly BindGroupEntry[];
    private readonly byBinding;
    private readonly onDispose;
    private _disposed;
    /**
     * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
     *   （见 `WebGL2Device.untrack`）。不传时为空操作。
     */
    constructor(descriptor: BindGroupDescriptor, onDispose?: () => void);
    /** GL 没有 bind group 对象，这里暴露校验后的条目映射。 */
    get native(): ReadonlyMap<number, BindGroupEntry>;
    get disposed(): boolean;
    entry(binding: number): BindGroupEntry | undefined;
    /**
     * GL 里没有 bind group 对象，释放只是把本包装对象标记为不可用并通知设备。
     * 幂等：重复调用不会重复通知设备。
     */
    dispose(): void;
    /** 校验：每个条目都能在布局里找到，且类型对得上。 */
    private validate;
}
//# sourceMappingURL=WebGL2BindGroup.d.ts.map