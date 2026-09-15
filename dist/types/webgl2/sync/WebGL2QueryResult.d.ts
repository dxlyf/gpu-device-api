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
import type { QueryResult } from '../../core/sync/QueryResult.js';
import type { QueryType as QueryTypeName } from '../../core/resources/QuerySet.js';
import type { WebGL2QuerySet } from '../resources/WebGL2QuerySet.js';
/**
 * 默认轮询上限（毫秒）。
 *
 * 定得偏大是因为 GL 查询的完成时间完全由驱动决定：实测 SwiftShader（ANGLE）上
 * 一次 `TIME_ELAPSED_EXT` 的结果可以滞后好几秒才可用（`gl.finish()` 只保证命令**提交**给
 * GPU 进程，不保证执行完）。超时意味着驱动一直没给出结果，此时报错比返回一个 0 更诚实。
 */
export declare const DEFAULT_QUERY_POLL_TIMEOUT_MS = 10000;
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
export declare class WebGL2QueryResult implements QueryResult {
    readonly type: QueryTypeName;
    readonly count: number;
    /** GL 的 `TIME_ELAPSED_EXT` 就是纳秒，因此恒为 1。 */
    readonly timestampPeriod = 1;
    private readonly gl;
    private readonly querySet;
    private readonly first;
    private readonly timeoutMs;
    private readonly yieldToEventLoop;
    private _read;
    constructor(init: WebGL2QueryResultInit);
    read(): Promise<BigUint64Array>;
    /** 轮询 `QUERY_RESULT_AVAILABLE`，每次询问之间让出一拍。 */
    private waitUntilAvailable;
    private assertNotDisjoint;
}
/** 该结果是否属于 timestamp 查询（便于调用方判断单位）。 */
export declare function isTimestampQueryResult(result: QueryResult): boolean;
//# sourceMappingURL=WebGL2QueryResult.d.ts.map