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

import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import type { BindGroup, BindGroupDescriptor } from '../../core/binding/BindGroup.js';
import type { BindGroupEntry } from '../../core/binding/BindingTypes.js';
import type { WebGL2BindGroupLayout } from './WebGL2BindGroupLayout.js';

export class WebGL2BindGroup implements BindGroup {
  readonly label: string;
  readonly layout: WebGL2BindGroupLayout;
  readonly entries: readonly BindGroupEntry[];
  private readonly byBinding: Map<number, BindGroupEntry>;
  private _disposed = false;

  constructor(descriptor: BindGroupDescriptor) {
    this.label = descriptor.label ?? nextId('bindGroup');
    this.layout = descriptor.layout as WebGL2BindGroupLayout;
    this.entries = [...descriptor.entries];
    this.byBinding = new Map(this.entries.map((entry) => [entry.binding, entry]));
    this.validate();
  }

  /** GL 没有 bind group 对象，这里暴露校验后的条目映射。 */
  get native(): ReadonlyMap<number, BindGroupEntry> {
    return this.byBinding;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  entry(binding: number): BindGroupEntry | undefined {
    return this.byBinding.get(binding);
  }

  dispose(): void {
    this._disposed = true;
    this.byBinding.clear();
  }

  /** 校验：每个条目都能在布局里找到，且类型对得上。 */
  private validate(): void {
    const seen = new Set<number>();
    for (const entry of this.entries) {
      if (seen.has(entry.binding)) {
        throw new ValidationError(
          `[gpu-device-api] BindGroup「${this.label}」里 binding ${entry.binding} 出现了多次。`,
        );
      }
      seen.add(entry.binding);

      const layoutEntry = this.layout.entry(entry.binding);
      if (!layoutEntry) {
        throw new ValidationError(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${entry.binding} 在布局「${this.layout.label}」里没有声明。` +
            `布局声明的 binding：${this.layout.sortedEntries.map((item) => item.binding).join('、')}。`,
        );
      }

      // 资源类型只能靠结构判断（core 的 BindingResource 是联合类型，没有可辨识字段）。
      const resource = entry.resource as unknown as Record<string, unknown>;
      const actual = 'buffer' in resource ? 'buffer' : 'sampler' in resource ? 'sampler' : 'view' in resource ? 'texture' : 'unknown';
      const expected =
        layoutEntry.type === 'uniform' || layoutEntry.type === 'storage' || layoutEntry.type === 'read-only-storage'
          ? 'buffer'
          : layoutEntry.type === 'texture' || layoutEntry.type === 'storage-texture'
            ? 'texture'
            : 'sampler';
      if (actual !== expected) {
        throw new ValidationError(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${entry.binding} 类型不匹配：` +
            `布局要求 ${expected}，实际给了 ${actual}。`,
        );
      }
    }
  }
}
