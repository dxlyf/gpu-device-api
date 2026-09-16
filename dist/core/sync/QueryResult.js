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
/**
 * 把两个 timestamp 刻度换算成毫秒。
 *
 * `timestampPeriod` 的单位是「纳秒 / 刻度」，所以毫秒 = 刻度 × 纳秒每刻度 ÷ 1e6。
 * 单独抽成函数是为了让「不能把刻度当纳秒」这件事只有一个实现，并且能在 node 里被测到。
 */
export function timestampDeltaToMilliseconds(begin, end, timestampPeriod = 1) {
    // 先减再转 Number：单个刻度值可能有 2^53 以上的量级，直接 Number() 会丢精度。
    const ticks = end - begin;
    if (ticks <= 0n)
        return 0;
    return (Number(ticks) * timestampPeriod) / 1e6;
}
//# sourceMappingURL=QueryResult.js.map