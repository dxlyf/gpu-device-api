/**
 * WebGPU query set：`QuerySet` 接口在 `GPUQuerySet` 上的实现。
 *
 * timestamp 查询在 WebGPU 里由 `timestamp-query` feature 控制；occlusion 查询是 core 功能。
 * 属于第二阶段的能力（`QueryResult` 回读需要 `CommandEncoder.resolveQuerySet`，core 尚未提供），
 * 因此这里只负责创建/销毁与 feature 校验。
 */

import type { QuerySet, QuerySetDescriptor, QueryType } from '../../core/resources/QuerySet.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { QueryType as QueryTypeValues } from '../../core/resources/QuerySet.js';
import { toGPUQueryType } from '../utils/wgpuEnumMap.js';

/** timestamp 查询需要的 feature 名。 */
export const TIMESTAMP_QUERY_FEATURE = 'timestamp-query';

export class WebGPUQuerySet implements QuerySet {
  readonly label: string;
  readonly type: QueryType;
  readonly count: number;
  readonly native: GPUQuerySet;

  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: QuerySetDescriptor) {
    this.label = descriptor.label ?? `querySet#${device.nextResourceId('querySet')}`;

    if (!Number.isInteger(descriptor.count) || descriptor.count <= 0) {
      throw new ValidationError(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(descriptor.count)}.`,
      );
    }
    if (descriptor.type === QueryTypeValues.Timestamp && !device.features.has(TIMESTAMP_QUERY_FEATURE)) {
      throw new ValidationError(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${TIMESTAMP_QUERY_FEATURE}" ` +
          'device feature; request it in DeviceDescriptor.requiredFeatures.',
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
