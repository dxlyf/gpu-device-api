/**
 * WebGPU bind group layout：`BindGroupLayout` 接口在 `GPUBindGroupLayout` 上的实现。
 *
 * core 的 layout entry 允许把 buffer / texture / storageTexture / sampler 的子描述都写在同一个
 * 对象里，而 WebGPU 要求「恰好一个」子对象被设置。本类的职责就是把 core 的宽松写法收敛成
 * WebGPU 的严格写法，并在此过程中校验那些 WebGPU 会拒绝的组合：
 *
 * - `visibility` 必须至少含一个 shader stage（`ShaderStage.None` 没有对应语义）；
 * - `sampleType: 'depth'` 只能配 `2d` / `2d-array` / `cube` / `cube-array`；
 * - storage texture 的格式必须在 WebGPU 允许的集合里（`bgra8unorm` 还需要 feature）。
 */

import type {
  BindGroupLayout,
  BindGroupLayoutDescriptor,
} from '../../core/binding/BindGroupLayout.js';
import type {
  BindGroupLayoutEntry,
  BufferBindingLayout,
  SamplerBindingLayout,
  StorageTextureBindingLayout,
  TextureBindingLayout,
} from '../../core/binding/BindingTypes.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { normalizeBindGroupLayoutEntries } from '../../core/binding/BindGroupLayout.js';
import { isBufferBinding, isSamplerBinding, BindingType } from '../../core/enums/BindingType.js';
import {
  assertSamplerBindingType,
  toGPUBufferBindingType,
  toGPUSamplerBindingType,
  toGPUShaderStage,
  toGPUStorageTextureAccess,
  toGPUTextureSampleType,
  toGPUTextureViewDimension,
} from '../utils/wgpuEnumMap.js';
import { assertStorageTextureFormat, toGPUTextureFormat } from '../utils/wgpuFormatMap.js';

export class WebGPUBindGroupLayout implements BindGroupLayout {
  readonly label: string;
  readonly entries: readonly BindGroupLayoutEntry[];
  readonly sortedEntries: readonly BindGroupLayoutEntry[];
  readonly native: GPUBindGroupLayout;

  private readonly byBinding: Map<number, BindGroupLayoutEntry>;
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: BindGroupLayoutDescriptor) {
    this.label = descriptor.label ?? `bindGroupLayout#${device.nextResourceId('bindGroupLayout')}`;

    let sorted: readonly BindGroupLayoutEntry[];
    try {
      sorted = normalizeBindGroupLayoutEntries(descriptor.entries);
    } catch (error) {
      // core 的规范化函数抛的是普通 Error；这里统一成 ValidationError。
      throw new ValidationError(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.sortedEntries = sorted;
    this.entries = descriptor.entries;
    this.byBinding = new Map(sorted.map((entry) => [entry.binding, entry]));

    const entries: GPUBindGroupLayoutEntry[] = sorted.map((entry) =>
      toGPUBindGroupLayoutEntry(entry, device, this.label),
    );

    // bind group 数量上限由 device limit 约束，先按显式 layout 的数量做一次友好报错。
    if (entries.length > device.limits.maxBindingsPerBindGroup) {
      throw new ValidationError(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${entries.length} entries exceed ` +
          `maxBindingsPerBindGroup (${device.limits.maxBindingsPerBindGroup}).`,
      );
    }

    this.native = device.native.createBindGroupLayout({ label: this.label, entries });
  }

  entry(binding: number): BindGroupLayoutEntry | undefined {
    return this.byBinding.get(binding);
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** GPUBindGroupLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose(): void {
    this._disposed = true;
  }
}

function toGPUBindGroupLayoutEntry(
  entry: BindGroupLayoutEntry,
  device: WebGPUDevice,
  layoutLabel: string,
): GPUBindGroupLayoutEntry {
  const context = `BindGroupLayout "${layoutLabel}" binding ${entry.binding}`;
  const native: GPUBindGroupLayoutEntry = {
    binding: entry.binding,
    visibility: toGPUShaderStage(entry.visibility),
  };

  if (isBufferBinding(entry.type)) {
    const layout: BufferBindingLayout = entry.buffer ?? {};
    if (layout.type !== undefined && layout.type !== entry.type) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: buffer.type "${layout.type}" contradicts the entry type "${entry.type}".`,
      );
    }
    native.buffer = {
      type: toGPUBufferBindingType(entry.type),
      hasDynamicOffset: layout.hasDynamicOffset ?? false,
      minBindingSize: layout.minBindingSize ?? 0,
    };
    return native;
  }

  if (isSamplerBinding(entry.type)) {
    const layout: SamplerBindingLayout = entry.sampler ?? {};
    const defaultType = toGPUSamplerBindingType(entry.type);
    native.sampler = {
      type: layout.type === undefined ? defaultType : assertSamplerBindingType(layout.type),
    };
    return native;
  }

  if (entry.type === BindingType.Texture) {
    const layout: TextureBindingLayout = entry.texture ?? {};
    const sampleType = layout.sampleType ?? 'float';
    const viewDimension = layout.viewDimension ?? '2d';
    if (sampleType === 'depth' && (viewDimension === '1d' || viewDimension === '3d')) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: sampleType "depth" cannot be combined with viewDimension ` +
          `"${viewDimension}" (use "2d", "2d-array", "cube" or "cube-array").`,
      );
    }
    native.texture = {
      sampleType: toGPUTextureSampleType(sampleType),
      viewDimension: toGPUTextureViewDimension(viewDimension),
      multisampled: layout.multisampled ?? false,
    };
    return native;
  }

  if (entry.type === BindingType.StorageTexture) {
    const layout: StorageTextureBindingLayout | undefined = entry.storageTexture;
    if (!layout || layout.format === undefined) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: a storage-texture entry needs \`storageTexture.format\`.`,
      );
    }
    assertStorageTextureFormat(layout.format, device.features, context);
    native.storageTexture = {
      access: toGPUStorageTextureAccess(layout.access ?? 'write-only'),
      format: toGPUTextureFormat(layout.format),
      viewDimension: toGPUTextureViewDimension(layout.viewDimension ?? '2d'),
    };
    return native;
  }

  throw new ValidationError(
    `[gpu-device-api] ${context}: unsupported BindingType "${String(entry.type)}".`,
  );
}

/** 该对象是否为 WebGPU 后端的 bind group layout。 */
export function isWebGPUBindGroupLayout(value: unknown): value is WebGPUBindGroupLayout {
  return value instanceof WebGPUBindGroupLayout;
}

/** 把任意 bind group layout 表示收窄为原生 `GPUBindGroupLayout`。 */
export function asGPUBindGroupLayout(value: unknown, context: string): GPUBindGroupLayout {
  if (value instanceof WebGPUBindGroupLayout) return value.native;
  if (isNativeGpuObject(value)) return value as GPUBindGroupLayout;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native ` +
      'GPUBindGroupLayout).',
  );
}

/**
 * 判断一个对象是否「像原生 WebGPU 对象」：带 `label`（`GPUObjectBase` 的成员）且不是本库的
 * core 资源包装（core 资源一定带 `native`）。
 */
export function isNativeGpuObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { label?: unknown; native?: unknown };
  return typeof candidate.label === 'string' && !('native' in candidate);
}
