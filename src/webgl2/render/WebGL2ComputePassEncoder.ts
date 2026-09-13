/**
 * WebGL2 的 compute pass：**不支持**。
 *
 * 与 `WebGL2ComputePipeline` 对应 —— 计算能力需要 GLES 3.1，WebGL2 只有 GLES 3.0。
 * 在 `beginComputePass()` 调用时立即报错，并给出可执行的替代方案。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import type { BindGroup } from '../../core/binding/BindGroup.js';
import type { ComputePipeline } from '../../core/pipeline/ComputePipeline.js';
import type { ComputePassDescriptor, ComputePassEncoder } from '../../core/render/ComputePassEncoder.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { DispatchIndirectDescriptor } from '../../core/render/DrawCommands.js';

const MESSAGE =
  '[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。\n' +
  '可选方案：\n' +
  '  1) 切到 WebGPU 后端（createDevice({ backend: \'auto\' }) 会优先选它）；\n' +
  '  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，' +
  '用片元着色器当 kernel，结果渲染到另一张纹理。';

export class WebGL2ComputePassEncoder implements ComputePassEncoder {
  readonly label = 'computePass';

  constructor(_descriptor?: ComputePassDescriptor) {
    throw new ValidationError(MESSAGE);
  }

  get ended(): boolean {
    return true;
  }

  setPipeline(_pipeline: ComputePipeline): void {
    throw new ValidationError(MESSAGE);
  }

  setBindGroup(_index: number, _bindGroup: BindGroup | null, _dynamicOffsets?: readonly number[]): void {
    throw new ValidationError(MESSAGE);
  }

  dispatchWorkgroups(_x: number, _y?: number, _z?: number): void {
    throw new ValidationError(MESSAGE);
  }

  dispatchWorkgroupsIndirect(_indirect: DispatchIndirectDescriptor | BufferLike, _offset?: number): void {
    throw new ValidationError(MESSAGE);
  }

  end(): void {
    // 构造阶段已经抛错，这里不会被执行。
  }
}
