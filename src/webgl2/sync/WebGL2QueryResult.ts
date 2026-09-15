/**
 * WebGL2 的查询结果回读。
 *
 * 与 WebGPU 侧完全不同：GL 没有可以映射的结果缓冲区，只能逐条询问
 * `gl.getQueryParameter(query, QUERY_RESULT_AVAILABLE)`，可用了再读 `QUERY_RESULT`。
 * 因此这里是一个**轮询**实现 —— 每轮询一次就让出一拍（`await` 一个宏任务），
 * 既不会把主线程钉死，也不会像 `gl.finish()` 那样强制与 GPU 同步。
 *
 * 两条必须处理的 GL 语义：
 * 1. GPU 还没做完时读 `QUERY_RESULT` 会返回 null 并留下 INVALID_OPERATION，所以必须先问
 *    `QUERY_RESULT_AVAILABLE`；
 * 2. `GPU_DISJOINT_EXT` 为真时结果无效（GPU 在两次查询之间被重置/抢占）。这种情况**必须报错**，
 *    而不是把 0 或某个偏小的值当成真实耗时 —— 那正是「GPU 时间看起来很小」的经典成因。
 */

import { GpuError } from '../../core/errors/GpuError.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { QueryType } from '../../core/resources/QuerySet.js';
import type { QueryResult } from '../../core/sync/QueryResult.js';
import type { QueryType as QueryTypeName } from '../../core/resources/QuerySet.js';
import type { WebGL2QuerySet, WebGL2TimerQueryExtension } from '../resources/WebGL2QuerySet.js';

/**
 * 默认轮询上限（毫秒）。
 *
 * 定得偏大是因为 GL 查询的完成时间完全由驱动决定：实测 SwiftShader（ANGLE）上
 * 一次 `TIME_ELAPSED_EXT` 的结果可以滞后好几秒才可用（`gl.finish()` 只保证命令**提交**给
 * GPU 进程，不保证执行完）。超时意味着驱动一直没给出结果，此时报错比返回一个 0 更诚实。
 */
export const DEFAULT_QUERY_POLL_TIMEOUT_MS = 10000;

export interface WebGL2QueryResultInit {
  gl: WebGL2RenderingContext;
  querySet: WebGL2QuerySet;
  type: QueryTypeName;
  /** 读回的起始下标。 */
  first: number;
  /** 读回条数。 */
  count: number;
  timeoutMs?: number;
  /** 让出事件循环用；测试里可以传一个立即 resolve 的实现。 */
  yieldToEventLoop?: () => Promise<void>;
}

export class WebGL2QueryResult implements QueryResult {
  readonly type: QueryTypeName;
  readonly count: number;
  /** GL 的 `TIME_ELAPSED_EXT` 就是纳秒，因此恒为 1。 */
  readonly timestampPeriod = 1;

  private readonly gl: WebGL2RenderingContext;
  private readonly querySet: WebGL2QuerySet;
  private readonly first: number;
  private readonly timeoutMs: number;
  private readonly yieldToEventLoop: () => Promise<void>;
  private _read = false;

  constructor(init: WebGL2QueryResultInit) {
    this.gl = init.gl;
    this.querySet = init.querySet;
    this.type = init.type;
    this.first = init.first;
    this.count = init.count;
    this.timeoutMs = init.timeoutMs ?? DEFAULT_QUERY_POLL_TIMEOUT_MS;
    this.yieldToEventLoop =
      init.yieldToEventLoop ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  }

  async read(): Promise<BigUint64Array> {
    if (this._read) {
      throw new ValidationError(
        '[gpu-device-api] QueryResult.read(): this result has already been read. Call ' +
          'Device.readQuerySet() again for a fresh result.',
      );
    }
    this._read = true;

    const gl = this.gl;
    if (this.querySet.disposed) {
      throw new ValidationError(
        `[gpu-device-api] QueryResult.read(): query set "${this.querySet.label}" has been destroyed.`,
      );
    }

    const values = new BigUint64Array(this.count);
    for (let index = 0; index < this.count; index++) {
      const query = this.querySet.queryAt(this.first + index, 'QueryResult.read');
      await this.waitUntilAvailable(query, this.first + index);
      // disjoint 要在读到结果之前检查：一旦置位，这期间的查询结果全部无效。
      this.assertNotDisjoint(this.first + index);
      const raw = gl.getQueryParameter(query, gl.QUERY_RESULT) as number | null;
      values[index] = BigInt(Math.round(raw ?? 0));
    }
    return values;
  }

  /** 轮询 `QUERY_RESULT_AVAILABLE`，每次询问之间让出一拍。 */
  private async waitUntilAvailable(query: WebGLQuery, index: number): Promise<void> {
    const gl = this.gl;
    const deadline = Date.now() + this.timeoutMs;
    for (;;) {
      if (gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) === true) return;
      if (this.querySet.disposed) {
        // query set 在等待期间被销毁：继续问已删除的 GL 查询只会留下 INVALID_OPERATION。
        throw new GpuError(
          `[gpu-device-api] QueryResult.read(): query set "${this.querySet.label}" was destroyed while ` +
            `waiting for query ${index}. The result of that frame is simply dropped.`,
          { code: 'QUERY_DISCARDED' },
        );
      }
      if (Date.now() >= deadline) {
        throw new GpuError(
          `[gpu-device-api] QueryResult.read(): query ${index} of "${this.querySet.label}" was still not ` +
            `available after ${this.timeoutMs} ms. The GL query is asynchronous; read it a few frames after ` +
            'the pass that wrote it (gfx GPU timing waits `delay` frames for exactly this reason).',
          { code: 'QUERY_TIMEOUT' },
        );
      }
      await this.yieldToEventLoop();
    }
  }

  private assertNotDisjoint(index: number): void {
    const extension: WebGL2TimerQueryExtension | null = this.querySet.timerExtension;
    if (!extension) return;
    const disjoint = this.gl.getParameter(extension.GPU_DISJOINT_EXT) as boolean | null;
    if (disjoint === true) {
      throw new GpuError(
        `[gpu-device-api] QueryResult.read(): GPU_DISJOINT_EXT is set, so the timer results of ` +
          `"${this.querySet.label}" (query ${index}) are undefined. A disjoint happens when the GPU is ` +
          'reset or preempted between the begin/end of the query; discard this sample instead of using it.',
        { code: 'QUERY_DISJOINT' },
      );
    }
  }
}

/** 该结果是否属于 timestamp 查询（便于调用方判断单位）。 */
export function isTimestampQueryResult(result: QueryResult): boolean {
  return result.type === QueryType.Timestamp;
}
