/** The collection of bind group layouts a pipeline uses. Mirrors WebGPU's `GPUPipelineLayout`. */

import type { Disposable } from '../../utils/Disposable.js';
import type { BindGroupLayout } from './BindGroupLayout.js';

export interface PipelineLayoutDescriptor {
  label?: string;
  bindGroupLayouts: readonly BindGroupLayout[];
}

export interface PipelineLayout extends Disposable {
  readonly label: string;
  readonly bindGroupLayouts: readonly BindGroupLayout[];
  /**
   * Native handle. On WebGPU this is a `GPUPipelineLayout`; on WebGL2 it carries the per-program
   * uniform block bindings and texture unit assignments resolved from the layouts.
   */
  readonly native: unknown;
  /** True when the pipeline asked for an automatically derived layout. */
  readonly isAuto: boolean;
}
