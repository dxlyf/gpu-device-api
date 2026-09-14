/**
 * WebGPU bind group layout：`BindGroupLayout` 接口在 `GPUBindGroupLayout` 上的实现。
 *
 * core 的 layout entry 允许把 buffer / texture / storageTexture / sampler 的子描述都写在同一个
 * 对象里，而 WebGPU 要求「恰好一个」子对象被设置。本类的职责就是把 core 的宽松写法收敛成
 * WebGPU 的严格写法，并在此过程中校验那些 WebGPU 会拒绝的组合：
 *
 * - `visibility` 必须至少含一个 shader stage（`ShaderStage.None` 没有对应语义）；
 * - `sampleType: 'depth'` 只能配 `2d` / `2d-array` / `cube` / `cube-array`；
 * - storage texture 的格式必须在 WebGPU 允许的集合里（`bgra8unorm` 还需要 feature）。
 */
import type { BindGroupLayout, BindGroupLayoutDescriptor } from '../../core/binding/BindGroupLayout.js';
import type { BindGroupLayoutEntry } from '../../core/binding/BindingTypes.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUBindGroupLayout implements BindGroupLayout {
    readonly label: string;
    readonly entries: readonly BindGroupLayoutEntry[];
    readonly sortedEntries: readonly BindGroupLayoutEntry[];
    readonly native: GPUBindGroupLayout;
    private readonly device;
    private readonly byBinding;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor: BindGroupLayoutDescriptor);
    entry(binding: number): BindGroupLayoutEntry | undefined;
    get disposed(): boolean;
    /** GPUBindGroupLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 bind group layout。 */
export declare function isWebGPUBindGroupLayout(value: unknown): value is WebGPUBindGroupLayout;
/** 把任意 bind group layout 表示收窄为原生 `GPUBindGroupLayout`。 */
export declare function asGPUBindGroupLayout(value: unknown, context: string): GPUBindGroupLayout;
/**
 * 判断一个对象是否「像原生 WebGPU 对象」：带 `label`（`GPUObjectBase` 的成员）且不是本库的
 * core 资源包装（core 资源一定带 `native`）。
 */
export declare function isNativeGpuObject(value: unknown): boolean;
//# sourceMappingURL=WebGPUBindGroupLayout.d.ts.map