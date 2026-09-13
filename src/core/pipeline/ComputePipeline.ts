/** A compute pipeline. WebGPU supports it natively; the WebGL2 backend throws on creation. */

import type { Disposable } from '../../utils/Disposable.js';
import type { PipelineLayout } from '../binding/PipelineLayout.js';
import type { ShaderModule } from '../resources/ShaderModule.js';

export interface ComputeState {
  module: ShaderModule;
  /** WGSL entry point name; defaults to `'csMain'`. */
  entryPoint?: string;
}

export interface ComputePipelineDescriptor {
  label?: string;
  layout?: PipelineLayout | 'auto';
  compute: ComputeState;
}

export interface ComputePipeline extends Disposable {
  readonly label: string;
  readonly descriptor: ComputePipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';
  readonly native: unknown;
  resolve(): unknown;
}
