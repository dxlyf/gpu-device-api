/** 一组共同绑定的资源。对应 WebGPU 的 `GPUBindGroup`。 */
import type { Disposable } from '../../utils/Disposable.js';
import type { BindGroupLayout } from './BindGroupLayout.js';
import type { BindGroupEntry } from './BindingTypes.js';
export interface BindGroupDescriptor {
    label?: string;
    layout: BindGroupLayout;
    entries: readonly BindGroupEntry[];
}
export interface BindGroup extends Disposable {
    readonly label: string;
    readonly layout: BindGroupLayout;
    readonly entries: readonly BindGroupEntry[];
    /** 原生句柄：WebGPU 上为 `GPUBindGroup`；WebGL2 上为解析后的绑定方案。 */
    readonly native: unknown;
    entry(binding: number): BindGroupEntry | undefined;
}
//# sourceMappingURL=BindGroup.d.ts.map