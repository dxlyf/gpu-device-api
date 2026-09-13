/** 描述 bind group 各 entry 的排布方式。对应 WebGPU 的 `GPUBindGroupLayout`。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { BindGroupLayoutEntry } from './BindingTypes.js';

export interface BindGroupLayoutDescriptor {
  label?: string;
  entries: readonly BindGroupLayoutEntry[];
}

export interface BindGroupLayout extends Disposable {
  readonly label: string;
  readonly entries: readonly BindGroupLayoutEntry[];
  /**
   * 原生句柄。在 WebGPU 上为 `GPUBindGroupLayout`；WebGL2 后端暴露由各 entry 推导出的
   * uniform block 索引和 texture unit 分配。
   */
  readonly native: unknown;
  entry(binding: number): BindGroupLayoutEntry | undefined;
  /** 声明顺序下的各 binding，已按 binding 索引排序。 */
  readonly sortedEntries: readonly BindGroupLayoutEntry[];
}

/** 对 bind group layout 的各 entry 排序并校验。 */
export function normalizeBindGroupLayoutEntries(
  entries: readonly BindGroupLayoutEntry[],
): readonly BindGroupLayoutEntry[] {
  if (entries.length === 0) {
    throw new Error('[gpu-device-api] A BindGroupLayout needs at least one entry.');
  }
  const sorted = [...entries].sort((a, b) => a.binding - b.binding);
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]!;
    if (!Number.isInteger(entry.binding) || entry.binding < 0) {
      throw new Error(`[gpu-device-api] BindGroupLayout entry #${i} has an invalid binding index ${entry.binding}.`);
    }
    if (i > 0 && sorted[i - 1]!.binding === entry.binding) {
      throw new Error(`[gpu-device-api] Duplicate binding index ${entry.binding} in a BindGroupLayout.`);
    }
  }
  return sorted;
}
