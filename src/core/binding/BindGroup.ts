/** A set of resources bound together. Mirrors WebGPU's `GPUBindGroup`. */

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
  /** Native handle: `GPUBindGroup` on WebGPU; on WebGL2 the resolved binding plan. */
  readonly native: unknown;
  entry(binding: number): BindGroupEntry | undefined;
}
