/**
 * WebGL2 的 bind group layout。
 *
 * GL 里并没有这样的对象，它的存在意义是**把布局信息固定下来**，供创建管线时构建
 * {@link import('./TextureUnitAllocator.js').WebGLBindingPlan} 使用。
 * `native` 直接返回标准化后的条目列表，方便调试时查看与上层复用。
 */

import { normalizeBindGroupLayoutEntries } from '../../core/binding/BindGroupLayout.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import type {
  BindGroupLayout,
  BindGroupLayoutDescriptor,
} from '../../core/binding/BindGroupLayout.js';
import type { BindGroupLayoutEntry } from '../../core/binding/BindingTypes.js';

export class WebGL2BindGroupLayout implements BindGroupLayout {
  readonly label: string;
  readonly entries: readonly BindGroupLayoutEntry[];
  readonly sortedEntries: readonly BindGroupLayoutEntry[];
  private readonly onDispose: () => void;
  private _disposed = false;

  /**
   * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   *   （见 `WebGL2Device.untrack`）。不传时为空操作。
   */
  constructor(descriptor: BindGroupLayoutDescriptor, onDispose: () => void = () => {}) {
    this.label = descriptor.label ?? nextId('bindGroupLayout');
    this.sortedEntries = normalizeBindGroupLayoutEntries(descriptor.entries);
    this.entries = this.sortedEntries;
    this.onDispose = onDispose;
  }

  /** GL 没有布局对象，这里把条目列表本身作为「原生句柄」暴露出来。 */
  get native(): readonly BindGroupLayoutEntry[] {
    return this.sortedEntries;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  entry(binding: number): BindGroupLayoutEntry | undefined {
    return this.sortedEntries.find((entry) => entry.binding === binding);
  }

  /** 幂等：重复调用不会重复通知设备。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.onDispose();
  }
}

/** 判断某个条目是否需要纹理（采样）资源，供 `auto` 布局推断复用。 */
export function isSampledTextureEntry(entry: BindGroupLayoutEntry): boolean {
  return entry.type === 'texture';
}

/** 布局里是否包含任何 WebGL2 无法表达的东西（storage buffer / storage texture）。 */
export function assertLayoutSupportedByWebGL2(layout: BindGroupLayout): void {
  for (const entry of layout.sortedEntries) {
    if (entry.type === 'storage' || entry.type === 'read-only-storage') {
      throw new ValidationError(
        `[gpu-device-api] BindGroupLayout「${layout.label}」的 binding ${entry.binding} 是 storage buffer，` +
          'WebGL2 不支持。请改用 uniform buffer。',
      );
    }
    if (entry.type === 'storage-texture') {
      throw new ValidationError(
        `[gpu-device-api] BindGroupLayout「${layout.label}」的 binding ${entry.binding} 是 storage texture，` +
          'WebGL2 不支持。请改用「渲染到纹理 + 采样」。',
      );
    }
  }
}
