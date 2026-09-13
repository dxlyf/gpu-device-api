/** Describes how a bind group's entries are laid out. Mirrors WebGPU's `GPUBindGroupLayout`. */

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
   * Native handle. On WebGPU this is a `GPUBindGroupLayout`; the WebGL2 backend exposes the
   * uniform block indices and texture unit assignments it derived from the entries.
   */
  readonly native: unknown;
  entry(binding: number): BindGroupLayoutEntry | undefined;
  /** Bindings in declaration order, sorted by binding index. */
  readonly sortedEntries: readonly BindGroupLayoutEntry[];
}

/** Sorts and validates the entries of a bind group layout. */
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
