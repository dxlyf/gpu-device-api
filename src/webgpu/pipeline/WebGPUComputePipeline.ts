/**
 * WebGPU compute pipeline：`ComputePipeline` 接口在 `GPUComputePipeline` 上的实现。
 *
 * 与 render pipeline 不同，compute pipeline 不需要 attachment 格式或 vertex layout，
 * 因此没有 variant 的概念：第一次 `resolve()`（或访问 `native`）时编译一次并缓存。
 * `layout: 'auto'` 原样透传给 WebGPU。
 */

import type { ComputePipeline, ComputePipelineDescriptor } from '../../core/pipeline/ComputePipeline.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { ShaderStage } from '../../core/enums/ShaderStage.js';
import { asGPUPipelineLayout } from '../binding/WebGPUPipelineLayout.js';
import { asWebGPUShaderModule } from '../resources/WebGPUShaderModule.js';

/** compute 入口点缺省名，与 core 的文档一致。 */
export const DEFAULT_COMPUTE_ENTRY_POINT = 'csMain';

export class WebGPUComputePipeline implements ComputePipeline {
  readonly label: string;
  readonly descriptor: ComputePipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';

  private readonly device: WebGPUDevice;
  private _native: GPUComputePipeline | null = null;
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: ComputePipelineDescriptor) {
    this.device = device;
    this.descriptor = descriptor;
    this.label = descriptor.label ?? `computePipeline#${device.nextResourceId('computePipeline')}`;
    this.layout = descriptor.layout ?? 'auto';
  }

  /** 已经编译出原生 pipeline 时为 true（不触发编译）。 */
  get compiled(): boolean {
    return this._native !== null;
  }

  /** 原生句柄；尚未编译时触发一次编译。 */
  get native(): GPUComputePipeline {
    return this.resolve();
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 取得（必要时创建）原生 compute pipeline。 */
  resolve(): GPUComputePipeline {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
    }
    if (this._native) return this._native;
    const module = asWebGPUShaderModule(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`,
    );
    this._native = this.device.native.createComputePipeline({
      label: this.label,
      layout: asGPUPipelineLayout(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: module.compile(ShaderStage.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? DEFAULT_COMPUTE_ENTRY_POINT,
      },
    });
    return this._native;
  }

  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._native = null;
    this.device.untrack(this);
  }
}

/** 该对象是否为 WebGPU 后端的 compute pipeline。 */
export function isWebGPUComputePipeline(value: unknown): value is WebGPUComputePipeline {
  return value instanceof WebGPUComputePipeline;
}

/** 把 core 的 `ComputePipeline` 收窄为原生 `GPUComputePipeline`。 */
export function asGPUComputePipeline(value: unknown, context: string): GPUComputePipeline {
  if (value instanceof WebGPUComputePipeline) return value.resolve();
  const native = (value as { native?: unknown } | null | undefined)?.native;
  if (native && typeof native === 'object') return native as GPUComputePipeline;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native ` +
      'GPUComputePipeline).',
  );
}
