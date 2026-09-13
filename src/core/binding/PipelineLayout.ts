/** pipeline 使用的 bind group layout 集合。对应 WebGPU 的 `GPUPipelineLayout`。 */

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
   * 原生句柄。在 WebGPU 上为 `GPUPipelineLayout`；在 WebGL2 上携带由各 layout 解析出的
   * 逐 program uniform block 绑定和 texture unit 分配。
   */
  readonly native: unknown;
  /** 当 pipeline 要求自动推导 layout 时为 true。 */
  readonly isAuto: boolean;
}
