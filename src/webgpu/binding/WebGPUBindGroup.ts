/**
 * WebGPU bind group：`BindGroup` 接口在 `GPUBindGroup` 上的实现。
 *
 * core 的 `BindingResource` 是一个「看起来像什么就是什么」的联合（`buffer` / `sampler` /
 * `view` / `source`），因此这里做三件事：
 *
 * 1. 把资源收窄成原生对象（顺便拦住「把别的后端的资源交给 WebGPU」这类错误）；
 * 2. 用 layout entry 校验资源种类与关键约束（buffer 范围、sampleType 是否可过滤、
 *    viewDimension / multisampled 是否匹配、storage texture 格式是否一致）；
 * 3. 补齐缺省值（buffer 的 `offset` / `size`），并把 dynamic offset 的校验交给
 *    {@link validateDynamicOffsets}，供 pass encoder 在 `setBindGroup` 时使用。
 */

import type { BindGroup, BindGroupDescriptor } from '../../core/binding/BindGroup.js';
import type { BindGroupEntry, BindGroupLayoutEntry } from '../../core/binding/BindingTypes.js';
import type { BindGroupLayout } from '../../core/binding/BindGroupLayout.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { isBufferBinding, isSamplerBinding } from '../../core/enums/BindingType.js';
import { asGPUBuffer, describeUnknown } from '../resources/WebGPUBuffer.js';
import { asGPUSampler, isWebGPUSampler } from '../resources/WebGPUSampler.js';
import { asGPUTextureView, isWebGPUTextureView } from '../resources/WebGPUTextureView.js';
import { asGPUBindGroupLayout } from './WebGPUBindGroupLayout.js';
import {
  isFilterableFormat,
  textureFormatCapabilities,
  toGPUTextureFormat,
} from '../utils/wgpuFormatMap.js';

export class WebGPUBindGroup implements BindGroup {
  readonly label: string;
  readonly layout: BindGroupLayout;
  readonly entries: readonly BindGroupEntry[];
  readonly native: GPUBindGroup;

  private readonly device: WebGPUDevice;
  private readonly byBinding: Map<number, BindGroupEntry>;
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: BindGroupDescriptor) {
    this.device = device;
    this.label = descriptor.label ?? `bindGroup#${device.nextResourceId('bindGroup')}`;
    this.layout = descriptor.layout;
    this.entries = descriptor.entries;
    this.byBinding = new Map(descriptor.entries.map((entry) => [entry.binding, entry]));

    for (const entry of descriptor.entries) {
      if (!this.layout.entry(entry.binding)) {
        throw new ValidationError(
          `[gpu-device-api] BindGroup "${this.label}": binding ${entry.binding} is not declared by layout ` +
            `"${this.layout.label}".`,
        );
      }
    }

    const nativeLayout = asGPUBindGroupLayout(this.layout, `BindGroup "${this.label}"`);
    const entries: GPUBindGroupEntry[] = descriptor.entries.map((entry) =>
      toGPUBindGroupEntry(entry, this.layout, device, this.label),
    );

    this.native = device.native.createBindGroup({
      label: this.label,
      layout: nativeLayout,
      entries,
    });
  }

  entry(binding: number): BindGroupEntry | undefined {
    return this.byBinding.get(binding);
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** GPUBindGroup 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose(): void {
    this._disposed = true;
    this.device.untrack(this);
  }
}

function toGPUBindGroupEntry(
  entry: BindGroupEntry,
  layout: BindGroupLayout,
  device: WebGPUDevice,
  groupLabel: string,
): GPUBindGroupEntry {
  const context = `BindGroup "${groupLabel}" binding ${entry.binding}`;
  const layoutEntry = layout.entry(entry.binding);
  if (!layoutEntry) {
    throw new ValidationError(`[gpu-device-api] ${context}: no matching layout entry.`);
  }
  const resource = entry.resource;

  if (isBufferBinding(layoutEntry.type)) {
    if (!('buffer' in resource)) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout declares a "${layoutEntry.type}" buffer binding, but the ` +
          `resource is ${describeUnknown(resource)}.`,
      );
    }
    const buffer = asGPUBuffer(resource.buffer, context);
    const offset = resource.offset ?? 0;
    const size = resource.size ?? resource.buffer.size - offset;
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError(`[gpu-device-api] ${context}: offset must be a non-negative integer.`);
    }
    if (!Number.isInteger(size) || size < 0) {
      throw new ValidationError(`[gpu-device-api] ${context}: size must be a non-negative integer.`);
    }
    if (offset + size > resource.buffer.size) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: binding range [${offset}, ${offset + size}) exceeds the buffer size ` +
          `${resource.buffer.size}.`,
      );
    }
    const minBindingSize = layoutEntry.buffer?.minBindingSize ?? 0;
    if (minBindingSize > 0 && size < minBindingSize) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout requires minBindingSize ${minBindingSize}, got ${size}.`,
      );
    }
    const native: GPUBufferBinding = { buffer, offset, size };
    return { binding: entry.binding, resource: native };
  }

  if (isSamplerBinding(layoutEntry.type)) {
    if (!('sampler' in resource)) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout declares a "${layoutEntry.type}" sampler binding, but the ` +
          `resource is ${describeUnknown(resource)}.`,
      );
    }
    const sampler = resource.sampler;
    const wantsComparison =
      (layoutEntry.sampler?.type ??
        (layoutEntry.type === 'comparison-sampler' ? 'comparison' : 'filtering')) === 'comparison';
    if (isWebGPUSampler(sampler)) {
      if (wantsComparison && !sampler.isComparison) {
        throw new ValidationError(
          `[gpu-device-api] ${context}: layout declares a comparison sampler, but the bound sampler has no ` +
            '`compare` function.',
        );
      }
      if (!wantsComparison && sampler.isComparison) {
        throw new ValidationError(
          `[gpu-device-api] ${context}: layout declares a filtering/non-filtering sampler, but the bound ` +
            'sampler is a comparison sampler (it has `compare`).',
        );
      }
    }
    return { binding: entry.binding, resource: asGPUSampler(sampler, context) };
  }

  if (layoutEntry.type === 'texture') {
    if (!('view' in resource)) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout declares a "texture" binding, but the resource is ` +
          `${describeUnknown(resource)}.`,
      );
    }
    validateTextureBinding(resource.view, layoutEntry, device, context);
    return { binding: entry.binding, resource: asGPUTextureView(resource.view, context) };
  }

  if (layoutEntry.type === 'storage-texture') {
    if (!('view' in resource)) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout declares a "storage-texture" binding, but the resource is ` +
          `${describeUnknown(resource)}.`,
      );
    }
    if (isWebGPUTextureView(resource.view)) {
      const expected = layoutEntry.storageTexture?.format;
      if (expected !== undefined && toGPUTextureFormat(resource.view.format) !== toGPUTextureFormat(expected)) {
        throw new ValidationError(
          `[gpu-device-api] ${context}: layout requires storage texture format "${expected}", but the bound ` +
            `view has format "${resource.view.format}".`,
        );
      }
    }
    return { binding: entry.binding, resource: asGPUTextureView(resource.view, context) };
  }

  if ('source' in resource) {
    // core 没有创建 external texture 的接口，这条路径只服务 escape hatch：用户自己用
    // device.native.importExternalTexture() 拿到 GPUExternalTexture 后直接塞进来。
    return { binding: entry.binding, resource: resource.source as GPUExternalTexture };
  }

  throw new ValidationError(
    `[gpu-device-api] ${context}: unsupported binding resource ${describeUnknown(resource)}.`,
  );
}

function validateTextureBinding(
  view: unknown,
  layoutEntry: BindGroupLayoutEntry,
  device: WebGPUDevice,
  context: string,
): void {
  if (!isWebGPUTextureView(view)) return;
  const layout = layoutEntry.texture ?? {};
  const format = view.format;
  const capabilities = textureFormatCapabilities(format);
  const expected = layout.sampleType ?? 'float';

  if (expected === 'depth') {
    if (capabilities.sampleScalar !== 'depth') {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout expects a depth texture, but the bound view has format "${format}".`,
      );
    }
  } else if (expected === 'uint' || expected === 'sint') {
    if (capabilities.sampleScalar !== expected) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout expects a "${expected}" sample type, but the bound view has format ` +
          `"${format}" (${capabilities.sampleScalar}).`,
      );
    }
  } else {
    if (capabilities.sampleScalar !== 'float') {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout expects a float sample type, but the bound view has format ` +
          `"${format}" (${capabilities.sampleScalar}).`,
      );
    }
    if (expected === 'float' && !isFilterableFormat(format, device.features)) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout declares sampleType "float" (filterable), but "${format}" is not ` +
          'filterable on this device; declare "unfilterable-float" or enable the required feature.',
      );
    }
  }

  const multisampled = view.texture.sampleCount > 1;
  if ((layout.multisampled ?? false) !== multisampled) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: layout declares multisampled=${String(layout.multisampled ?? false)}, but ` +
        `the bound texture has sampleCount ${view.texture.sampleCount}.`,
    );
  }

  const expectedDimension = layout.viewDimension ?? '2d';
  if (expectedDimension !== view.descriptor.dimension) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: layout declares viewDimension "${expectedDimension}", but the bound view ` +
        `is "${view.descriptor.dimension}".`,
    );
  }
}

/**
 * 共享的空 dynamic offset 数组。
 *
 * pass encoder 原先写 `dynamicOffsets ?? []`，于是每次 `setBindGroup` 都会多分配一个空数组
 * （绝大多数 bind group 根本没有动态偏移）。原生 `setBindGroup` 只读这个数组，复用一个即可。
 */
export const NO_DYNAMIC_OFFSETS: readonly number[] = Object.freeze([]);

/**
 * 一个 layout 的动态偏移摘要。
 *
 * 哪些 entry 带 `hasDynamicOffset`、每个 entry 的对齐值，都只由 layout 与 device limits 决定，
 * 而 `setBindGroup` 是每次 draw 都会走的路径：原先每次调用都要 `filter` 出一个（通常是空的）
 * 数组，并逐个 entry 重读 `device.limits`。按 layout 身份缓存后，每 draw 只剩一次命中判断。
 */
interface DynamicOffsetSummary {
  /** 带 `hasDynamicOffset` 的 entry 数量；为 0 时校验退化为「offset 必须为空」。 */
  readonly count: number;
  /** 各动态 entry 的对齐值（按 sortedEntries 顺序）。 */
  readonly alignments: readonly number[];
  /** 对齐值对应的 limit 名，仅用于报错。 */
  readonly limitNames: readonly string[];
}

const dynamicOffsetSummaries = new WeakMap<BindGroupLayout, DynamicOffsetSummary>();

function dynamicOffsetSummary(layout: BindGroupLayout, device: WebGPUDevice): DynamicOffsetSummary {
  const cached = dynamicOffsetSummaries.get(layout);
  if (cached) return cached;
  const alignments: number[] = [];
  const limitNames: string[] = [];
  for (const entry of layout.sortedEntries) {
    if (entry.buffer?.hasDynamicOffset !== true) continue;
    const uniform = entry.type === 'uniform';
    alignments.push(
      uniform ? device.limits.minUniformBufferOffsetAlignment : device.limits.minStorageBufferOffsetAlignment,
    );
    limitNames.push(uniform ? 'minUniformBufferOffsetAlignment' : 'minStorageBufferOffsetAlignment');
  }
  const summary: DynamicOffsetSummary = { count: alignments.length, alignments, limitNames };
  dynamicOffsetSummaries.set(layout, summary);
  return summary;
}

/**
 * 校验 `setBindGroup` 的 dynamic offsets。
 *
 * WebGPU 要求：声明了 `hasDynamicOffset` 的 entry 恰好一个 offset，且每个 offset 是
 * 对应（uniform / storage）对齐值的倍数。缺 offset、多 offset 都会让 WebGPU 抛一句很难读的
 * 校验错误，因此在录制阶段就报出来。
 */
export function validateDynamicOffsets(
  bindGroup: BindGroup,
  dynamicOffsets: readonly number[] | undefined,
  device: WebGPUDevice,
  context: string,
): void {
  const summary = dynamicOffsetSummary(bindGroup.layout, device);
  if (summary.count === 0) {
    if (dynamicOffsets !== undefined && dynamicOffsets.length > 0) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: bind group "${bindGroup.label}" has no entry with hasDynamicOffset, but ` +
          `${dynamicOffsets.length} dynamic offset(s) were supplied.`,
      );
    }
    return;
  }
  if (dynamicOffsets === undefined || dynamicOffsets.length !== summary.count) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: bind group "${bindGroup.label}" needs ${summary.count} dynamic ` +
        `offset(s) (declaration order of the entries with hasDynamicOffset), got ` +
        `${dynamicOffsets ? dynamicOffsets.length : 0}.`,
    );
  }
  for (let i = 0; i < summary.count; i++) {
    const offset = dynamicOffsets[i]!;
    const alignment = summary.alignments[i]!;
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: dynamic offset #${i} must be a non-negative integer, got ${String(offset)}.`,
      );
    }
    if (offset % alignment !== 0) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: dynamic offset #${i} (${offset}) must be a multiple of ${alignment} ` +
          `(${summary.limitNames[i]!}).`,
      );
    }
  }
}

/** 该对象是否为 WebGPU 后端的 bind group。 */
export function isWebGPUBindGroup(value: unknown): value is WebGPUBindGroup {
  return value instanceof WebGPUBindGroup;
}

/**
 * 把 core 的 `BindGroup` 收窄为原生 `GPUBindGroup`。
 *
 * WebGPU 的 `GPUBindGroup` 没有任何自有方法，无法鸭子类型判断，因此除本库的包装对象外，
 * 只接受「带 label 且不是 core 资源包装」的对象（escape hatch 的正常形态）。
 */
export function asGPUBindGroup(value: unknown, context: string): GPUBindGroup {
  if (value instanceof WebGPUBindGroup) return value.native;
  if (value && typeof value === 'object' && !('native' in (value as object))) {
    const candidate = value as { label?: unknown };
    if (typeof candidate.label === 'string') return value as GPUBindGroup;
  }
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`,
  );
}
