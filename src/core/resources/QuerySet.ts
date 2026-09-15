/** GPU query set（occlusion / timestamp 查询）。对应 WebGPU 的 `GPUQuerySet`。 */

import { ValidationError } from '../errors/ValidationError.js';
import type { Disposable } from '../../utils/Disposable.js';

export const QueryType = {
  Occlusion: 'occlusion',
  Timestamp: 'timestamp',
} as const;

export type QueryType = (typeof QueryType)[keyof typeof QueryType];

export interface QuerySetDescriptor {
  label?: string;
  type: QueryType;
  count: number;
}

/**
 * 一个 pass 的 timestamp 写入点，形状与 WebGPU 的 `GPURenderPassTimestampWrites` 一致。
 *
 * `beginningOfPassWriteIndex` / `endOfPassWriteIndex` 是 **query set 内的下标**，
 * 省略表示这一端不写。同一个 pass 里两个下标不能相同（写入的是两个不同的时刻）。
 */
export interface PassTimestampWrites {
  querySet: QuerySet;
  beginningOfPassWriteIndex?: number;
  endOfPassWriteIndex?: number;
}

export interface QuerySet extends Disposable {
  readonly label: string;
  readonly type: QueryType;
  readonly count: number;
  readonly native: unknown;
  /**
   * 销毁 query set。幂等；销毁后再用它录制命令是错误用法。
   *
   * 与其它资源一样，销毁时后端会把它从设备的资源追踪集合里摘掉（见各后端的 `untrack()`），
   * 否则「每帧建一个 query set」的用法会让设备一直强引用已经释放的对象。
   */
  destroy(): void;
}

/**
 * 校验 {@link PassTimestampWrites}，抛出的错误与后端无关。
 *
 * 两个后端都要做同一组检查（类型必须是 timestamp、下标必须在 query set 范围内、两端不能相同），
 * 因此放在 core 里；后端只需在此之上补各自的「这个能力在本后端是否可用」检查。
 */
export function assertPassTimestampWrites(writes: PassTimestampWrites, context: string): void {
  if (writes.querySet.type !== QueryType.Timestamp) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: timestampWrites.querySet must be a "timestamp" query set, got ` +
        `"${String(writes.querySet.type)}".`,
    );
  }
  const begin = writes.beginningOfPassWriteIndex;
  const end = writes.endOfPassWriteIndex;
  if (begin === undefined && end === undefined) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: timestampWrites needs at least one of beginningOfPassWriteIndex / ` +
        'endOfPassWriteIndex.',
    );
  }
  for (const [name, index] of [
    ['beginningOfPassWriteIndex', begin],
    ['endOfPassWriteIndex', end],
  ] as const) {
    if (index === undefined) continue;
    if (!Number.isInteger(index) || index < 0 || index >= writes.querySet.count) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: timestampWrites.${name} (${String(index)}) is outside the query set's ` +
          `range [0, ${writes.querySet.count}).`,
      );
    }
  }
  if (begin !== undefined && begin === end) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: beginningOfPassWriteIndex and endOfPassWriteIndex must differ (they are ` +
        `two different instants), got both = ${begin}.`,
    );
  }
}
