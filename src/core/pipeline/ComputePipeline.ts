/** compute pipeline。WebGPU 原生支持；WebGL2 后端在创建时抛出错误。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { PipelineLayout } from '../binding/PipelineLayout.js';
import type { ShaderModule } from '../resources/ShaderModule.js';

export interface ComputeState {
  module: ShaderModule;
  /** WGSL 入口点名；默认为 `'csMain'`。 */
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
