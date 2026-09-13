/**
 * WebGPU pipeline layout：`PipelineLayout` 接口在 `GPUPipelineLayout` 上的实现。
 *
 * 除了显式 layout，WebGPU 还支持 `layout: 'auto'`：由 WebGPU 从 shader 反射出 binding 排布。
 * core 用 `isAuto` 表达这件事，并且 `'auto'` 的 pipeline layout 不能跨 pipeline 共享 bind group，
 * 因此 {@link WebGPUPipelineLayout.auto} 返回的对象 `native` 就是字符串 `'auto'`（可以直接喂给
 * `createRenderPipeline` / `createComputePipeline`），而不是一个 `GPUPipelineLayout`。
 */

import type { PipelineLayout, PipelineLayoutDescriptor } from '../../core/binding/PipelineLayout.js';
import type { BindGroupLayout } from '../../core/binding/BindGroupLayout.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { asGPUBindGroupLayout } from './WebGPUBindGroupLayout.js';

export class WebGPUPipelineLayout implements PipelineLayout {
  readonly label: string;
  readonly bindGroupLayouts: readonly BindGroupLayout[];
  /** `'auto'` 时为字符串 `'auto'`，否则为 `GPUPipelineLayout`。 */
  readonly native: GPUPipelineLayout | 'auto';
  readonly isAuto: boolean;

  private _disposed = false;

  private constructor(
    label: string,
    bindGroupLayouts: readonly BindGroupLayout[],
    native: GPUPipelineLayout | 'auto',
    isAuto: boolean,
  ) {
    this.label = label;
    this.bindGroupLayouts = bindGroupLayouts;
    this.native = native;
    this.isAuto = isAuto;
  }

  /** 创建显式 layout。 */
  static create(device: import('../WebGPUDevice.js').WebGPUDevice, descriptor: PipelineLayoutDescriptor): WebGPUPipelineLayout {
    const label = descriptor.label ?? `pipelineLayout#${device.nextResourceId('pipelineLayout')}`;
    if (descriptor.bindGroupLayouts.length > device.limits.maxBindGroups) {
      throw new ValidationError(
        `[gpu-device-api] PipelineLayout "${label}": ${descriptor.bindGroupLayouts.length} bind group layouts ` +
          `exceed maxBindGroups (${device.limits.maxBindGroups}).`,
      );
    }
    const native = device.native.createPipelineLayout({
      label,
      bindGroupLayouts: descriptor.bindGroupLayouts.map((layout) =>
        asGPUBindGroupLayout(layout, `PipelineLayout "${label}"`),
      ),
    });
    return new WebGPUPipelineLayout(label, descriptor.bindGroupLayouts, native, false);
  }

  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(label = 'auto'): WebGPUPipelineLayout {
    return new WebGPUPipelineLayout(label, [], 'auto', true);
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose(): void {
    this._disposed = true;
  }
}

/** 该对象是否为 WebGPU 后端的 pipeline layout。 */
export function isWebGPUPipelineLayout(value: unknown): value is WebGPUPipelineLayout {
  return value instanceof WebGPUPipelineLayout;
}

/**
 * 把 core 的 `PipelineLayout | 'auto'` 收窄为可以喂给 `createRenderPipeline` 的形式。
 */
export function asGPUPipelineLayout(
  layout: PipelineLayout | 'auto' | undefined,
  context: string,
): GPUPipelineLayout | 'auto' {
  if (layout === undefined || layout === 'auto') return 'auto';
  if (layout instanceof WebGPUPipelineLayout) return layout.native;
  const native = layout.native;
  if (native === 'auto') return 'auto';
  if (native && typeof native === 'object') return native as GPUPipelineLayout;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`,
  );
}
