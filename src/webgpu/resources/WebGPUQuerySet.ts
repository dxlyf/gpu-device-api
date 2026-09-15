/**
 * WebGPU query set：`QuerySet` 接口在 `GPUQuerySet` 上的实现。
 *
 * timestamp 查询在 WebGPU 里由 `timestamp-query` feature 控制；occlusion 查询是 core 功能。
 * 这里除了创建/销毁，还负责两件容易踩空的事：
 *
 * 1. **feature 必须真的启用过** —— adapter 支持 `timestamp-query` 不等于设备启用了它，
 *    只看 adapter 的集合会让原生 `createQuerySet()` 抛校验错误、拿到一个不可用的对象，
 *    上层却以为一切正常（那正是「静默返回 0」的成因）。所以这里查的是
 *    `WebGPUDevice.hasEnabledFeature()`；
 * 2. **pass 内写时间戳还需要 `timestamp-query-inside-passes`** —— 见
 *    {@link toGPUTimestampWrites}，缺这个 feature 时明确报错而不是让原生校验在 submit 时才炸。
 */

import type { PassTimestampWrites, QuerySet, QuerySetDescriptor, QueryType as QueryTypeName } from '../../core/resources/QuerySet.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { QueryType as QueryTypeValues, assertPassTimestampWrites } from '../../core/resources/QuerySet.js';
import { toGPUQueryType } from '../utils/wgpuEnumMap.js';

/** timestamp 查询需要的 feature 名。 */
export const TIMESTAMP_QUERY_FEATURE = 'timestamp-query';

/**
 * 允许在 pass 内写时间戳的 feature 名。
 *
 * 标准名是 `timestamp-query-inside-passes`；Chrome 在这个能力还处于实验阶段时只暴露
 * `chromium-experimental-timestamp-query-inside-passes`（需要 `--enable-webgpu-developer-features`），
 * 两个都认，避免「实现明明支持却报不支持」。
 */
export const TIMESTAMP_INSIDE_PASSES_FEATURES: readonly string[] = [
  'timestamp-query-inside-passes',
  'chromium-experimental-timestamp-query-inside-passes',
];

export class WebGPUQuerySet implements QuerySet {
  readonly label: string;
  readonly type: QueryTypeName;
  readonly count: number;
  readonly native: GPUQuerySet;

  private readonly device: WebGPUDevice;
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: QuerySetDescriptor) {
    this.device = device;
    this.label = descriptor.label ?? device.nextResourceId('querySet');

    if (!Number.isInteger(descriptor.count) || descriptor.count <= 0) {
      throw new ValidationError(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(descriptor.count)}.`,
      );
    }
    if (descriptor.type === QueryTypeValues.Timestamp && !device.hasEnabledFeature(TIMESTAMP_QUERY_FEATURE)) {
      throw new ValidationError(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${TIMESTAMP_QUERY_FEATURE}" ` +
          'device feature, but it is not enabled on this device. Pass it in ' +
          `DeviceDescriptor.requiredFeatures (available on the adapter: ${device.features.has(TIMESTAMP_QUERY_FEATURE) ? 'yes' : 'no'}).`,
      );
    }

    this.type = descriptor.type;
    this.count = descriptor.count;
    this.native = device.native.createQuerySet({
      label: this.label,
      type: toGPUQueryType(descriptor.type),
      count: descriptor.count,
    });
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 销毁 query set。幂等。 */
  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.native.destroy();
    this.device.untrack(this);
  }

  /** `Disposable` 的别名。 */
  dispose(): void {
    this.destroy();
  }
}

/** 该对象是否为 WebGPU 后端的 query set。 */
export function isWebGPUQuerySet(value: unknown): value is WebGPUQuerySet {
  return value instanceof WebGPUQuerySet;
}

/** 把任意 query set 表示收窄为原生 `GPUQuerySet`。 */
export function asGPUQuerySet(value: unknown, context: string): GPUQuerySet {
  if (value instanceof WebGPUQuerySet) return value.native;
  if (value && typeof value === 'object' && !('native' in (value as object))) {
    const candidate = value as { destroy?: unknown; type?: unknown; count?: unknown };
    if (typeof candidate.destroy === 'function' && typeof candidate.count === 'number') {
      return value as GPUQuerySet;
    }
  }
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`,
  );
}

/**
 * 把 core 的 {@link PassTimestampWrites} 翻译成 WebGPU 的 `GPURenderPassTimestampWrites` /
 * `GPUComputePassTimestampWrites`（两者形状相同）。
 *
 * 先做**跨后端通用**的检查（{@link assertPassTimestampWrites}：类型、下标范围、两端不同），
 * 再检查 WebGPU 专有的 feature。缺 `timestamp-query-inside-passes` 时抛错 ——
 * 绝大多数 Chrome 版本默认不开这个能力，静默忽略会让人以为「时间戳写进去了、只是值为 0」。
 */
export function toGPUTimestampWrites(
  writes: PassTimestampWrites,
  device: WebGPUDevice,
  context: string,
): GPURenderPassTimestampWrites {
  assertPassTimestampWrites(writes, context);

  if (!device.hasEnabledFeature(TIMESTAMP_QUERY_FEATURE)) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: writing timestamps inside a pass needs the "${TIMESTAMP_QUERY_FEATURE}" ` +
        'device feature, but it is not enabled on this device.',
    );
  }
  const insidePasses = TIMESTAMP_INSIDE_PASSES_FEATURES.find((feature) => device.hasEnabledFeature(feature));
  if (insidePasses === undefined) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: this WebGPU implementation does not enable ` +
        `"${TIMESTAMP_INSIDE_PASSES_FEATURES[0]}" (tried: ${TIMESTAMP_INSIDE_PASSES_FEATURES.join(', ')}), so ` +
        'timestamps cannot be written inside a pass. Use CommandEncoder.writeTimestamp() around the pass ' +
        'instead, which only needs "timestamp-query" (that is what gfx GPU timing does).',
    );
  }

  const native: GPURenderPassTimestampWrites = {
    querySet: asGPUQuerySet(writes.querySet, `${context}.querySet`),
  };
  if (writes.beginningOfPassWriteIndex !== undefined) {
    native.beginningOfPassWriteIndex = writes.beginningOfPassWriteIndex;
  }
  if (writes.endOfPassWriteIndex !== undefined) {
    native.endOfPassWriteIndex = writes.endOfPassWriteIndex;
  }
  return native;
}
