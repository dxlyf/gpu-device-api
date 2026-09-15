/**
 * WebGL2 的 query set：`QuerySet` 在 GL query 对象上的实现。
 *
 * 与 WebGPU 的根本差别：GL **没有查询结果缓冲区**。结果只能通过
 * `gl.getQueryParameter(query, QUERY_RESULT)` 逐条读回，所以一个 `count = N` 的 query set
 * 在这里就是 **N 个独立的 GL query 对象**，而不是「一块内存里的 N 个槽位」。
 * 因此 `CommandEncoder.resolveQuerySet()`（把结果解析进 buffer）在 WebGL2 上没有对应能力，
 * 调用它会明确报错（见 `WebGL2CommandEncoder.resolveQuerySet`）。
 *
 * 两种查询类型：
 * - **timestamp**（耗时）：需要 `EXT_disjoint_timer_query_webgl2`，`TIME_ELAPSED_EXT` 测量
 *   「beginQuery → endQuery」之间的 GPU 时间，规范规定单位是**纳秒**（所以
 *   `QueryResult.timestampPeriod` 恒为 1）；
 * - **occlusion**（遮挡）：`ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，不需要扩展。
 *
 * 结果的读回是**异步**的：GPU 还没做完时 `QUERY_RESULT_AVAILABLE` 是 false，
 * 此时读 `QUERY_RESULT` 只会拿到 null 并留下一个 INVALID_OPERATION。
 * 另外 `GPU_DISJOINT_EXT` 为真时结果无效（通常意味着 GPU 在两次查询之间被重置/切换），
 * 必须丢弃而不是当成一个偏小的时间。
 */
import type { QuerySet, QuerySetDescriptor, QueryType as QueryTypeName } from '../../core/resources/QuerySet.js';
/** 提供时间查询能力的扩展名。 */
export declare const TIMER_QUERY_EXTENSION = "EXT_disjoint_timer_query_webgl2";
/**
 * 该扩展暴露的常量。`lib.dom.d.ts` 没有为它生成类型（WebGL2 里它是扩展而不是核心接口），
 * 所以自己声明最小形状；取值来自扩展规范。
 */
export interface WebGL2TimerQueryExtension {
    /** 测量 `beginQuery` → `endQuery` 之间的 GPU 时间（纳秒）。 */
    readonly TIME_ELAPSED_EXT: number;
    /** 为真时表示两次查询之间发生了 disjoint，已有结果无效。 */
    readonly GPU_DISJOINT_EXT: number;
}
/** `ANY_SAMPLES_PASSED` 的取值（WebGL2 核心常量，`gl.ANY_SAMPLES_PASSED`）。 */
export declare const ANY_SAMPLES_PASSED = 35887;
/** 取时间查询扩展；不存在时返回 null。 */
export declare function getTimerQueryExtension(gl: WebGL2RenderingContext): WebGL2TimerQueryExtension | null;
export declare class WebGL2QuerySet implements QuerySet {
    readonly label: string;
    readonly type: QueryTypeName;
    readonly count: number;
    /** 原生表示：GL 的 query 对象数组（每条查询一个对象，见类注释）。 */
    readonly native: readonly WebGLQuery[];
    /** 每条查询对应的 GL 目标（`TIME_ELAPSED_EXT` 或 `ANY_SAMPLES_PASSED`）。 */
    readonly target: number;
    /** timestamp 查询用的扩展；occlusion 查询为 null。 */
    readonly timerExtension: WebGL2TimerQueryExtension | null;
    private readonly gl;
    private readonly onDestroy;
    private _disposed;
    constructor(gl: WebGL2RenderingContext, descriptor: QuerySetDescriptor, onDestroy?: (querySet: WebGL2QuerySet) => void);
    get disposed(): boolean;
    /** 取第 index 条 GL query；越界时抛错。 */
    queryAt(index: number, context: string): WebGLQuery;
    /** 销毁全部 GL query 对象。幂等。 */
    destroy(): void;
    /** `Disposable` 的别名。 */
    dispose(): void;
}
/** 收窄为 WebGL2 后端的 query set（`readQuerySet` 需要读它的 GL 对象）。 */
export declare function asWebGL2QuerySet(value: unknown, context: string): WebGL2QuerySet;
//# sourceMappingURL=WebGL2QuerySet.d.ts.map