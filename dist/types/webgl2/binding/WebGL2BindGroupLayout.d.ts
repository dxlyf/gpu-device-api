/**
 * WebGL2 的 bind group layout。
 *
 * GL 里并没有这样的对象，它的存在意义是**把布局信息固定下来**，供创建管线时构建
 * {@link import('./TextureUnitAllocator.js').WebGLBindingPlan} 使用。
 * `native` 直接返回标准化后的条目列表，方便调试时查看与上层复用。
 */
import type { BindGroupLayout, BindGroupLayoutDescriptor } from '../../core/binding/BindGroupLayout.js';
import type { BindGroupLayoutEntry } from '../../core/binding/BindingTypes.js';
export declare class WebGL2BindGroupLayout implements BindGroupLayout {
    readonly label: string;
    readonly entries: readonly BindGroupLayoutEntry[];
    readonly sortedEntries: readonly BindGroupLayoutEntry[];
    private _disposed;
    constructor(descriptor: BindGroupLayoutDescriptor);
    /** GL 没有布局对象，这里把条目列表本身作为「原生句柄」暴露出来。 */
    get native(): readonly BindGroupLayoutEntry[];
    get disposed(): boolean;
    entry(binding: number): BindGroupLayoutEntry | undefined;
    dispose(): void;
}
/** 判断某个条目是否需要纹理（采样）资源，供 `auto` 布局推断复用。 */
export declare function isSampledTextureEntry(entry: BindGroupLayoutEntry): boolean;
/** 布局里是否包含任何 WebGL2 无法表达的东西（storage buffer / storage texture）。 */
export declare function assertLayoutSupportedByWebGL2(layout: BindGroupLayout): void;
//# sourceMappingURL=WebGL2BindGroupLayout.d.ts.map