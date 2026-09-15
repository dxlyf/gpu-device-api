/** compute pipeline。WebGPU 原生支持；WebGL2 后端在创建时抛出错误。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { PipelineLayout } from '../binding/PipelineLayout.js';
import type { ShaderModule } from '../resources/ShaderModule.js';
import type { CompilationInfo, PrewarmOptions, PrewarmResult } from './CompilationInfo.js';

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

  /**
   * **可选**：异步预热这条 compute pipeline（WebGPU 用 `createComputePipelineAsync`）。
   *
   * 语义与 {@link ComputePipeline.resolve} 一致：编译一次、结果进同一份缓存，
   * 之后的 `resolve()` 不再产生 GPU 编译调用。后端没有异步能力时 `mode` 为 `'sync'`，
   * `reason` 说明原因。失败不抛错，诊断在 {@link PrewarmResult.info} 里。
   */
  prewarm?(options?: PrewarmOptions): Promise<PrewarmResult>;

  /** **可选**：取得编译诊断（WebGPU 走 `GPUShaderModule.getCompilationInfo()`）。 */
  getCompilationInfo?(): Promise<CompilationInfo>;
}
