/**
 * {@link QuerySet} 回读的结果（occlusion / timestamp 查询）。
 *
 * 两个后端的「读回」机制完全不同，但都收敛到这个接口：
 *
 * - **WebGPU**：`CommandEncoder.resolveQuerySet()` 把结果解析进一个 `QUERY_RESOLVE | COPY_SRC`
 *   buffer，再 `copyBufferToBuffer` 到 `MAP_READ | COPY_DST` buffer，最后 `mapAsync` 读回。
 *   这一整条链路由 `Device.readQuerySet()` 打包好（MAP_READ 不能与 QUERY_RESOLVE 同时声明，
 *   所以中间那次拷贝是规范要求的，不是多余的一步）。
 * - **WebGL2**：没有「查询结果 buffer」这个概念，只能用 `gl.getQueryParameter()` 逐个读，
 *   而且 GL 查询是**异步**的（要先轮询 `QUERY_RESULT_AVAILABLE`）。
 */
import type { QueryType } from '../resources/QuerySet.js';
/** `Device.readQuerySet()` 的参数。 */
export interface QuerySetReadOptions {
    /** 诊断用标签；省略时由 query set 的 label 推导。 */
    label?: string;
    /** 从第几条查询开始读；默认 0。 */
    firstQuery?: number;
    /** 读多少条；默认读到末尾。 */
    queryCount?: number;
}
export interface QueryResult {
    readonly type: QueryType;
    readonly count: number;
    /**
     * 原始查询值的单位换算：**纳秒 / 刻度**。
     *
     * - WebGPU：`GPUQueue.getTimestampPeriod()` 的取值；实现没有暴露它时按规范默认值 1
     *   （也就是刻度本身就是纳秒）处理，绝不能把刻度直接当成纳秒而不乘这个系数。
     * - WebGL2：`EXT_disjoint_timer_query_webgl2` 的 `TIME_ELAPSED_EXT` 按规范就是纳秒，因此恒为 1。
     * - occlusion 查询没有时间概念，恒为 1。
     */
    readonly timestampPeriod: number;
    /**
     * 读回原始查询值：timestamp 查询是**刻度**（要乘 {@link QueryResult.timestampPeriod}
     * 才是纳秒），occlusion 查询是采样计数。
     *
     * 只能调用一次：WebGPU 侧的 `mapAsync` 映射在读取后就会解除并销毁中转 buffer。
     */
    read(): Promise<BigUint64Array>;
}
/**
 * 把两个 timestamp 刻度换算成毫秒。
 *
 * `timestampPeriod` 的单位是「纳秒 / 刻度」，所以毫秒 = 刻度 × 纳秒每刻度 ÷ 1e6。
 * 单独抽成函数是为了让「不能把刻度当纳秒」这件事只有一个实现，并且能在 node 里被测到。
 */
export declare function timestampDeltaToMilliseconds(begin: bigint, end: bigint, timestampPeriod?: number): number;
//# sourceMappingURL=QueryResult.d.ts.map