/** {@link QuerySet} 回读的结果（occlusion / timestamp 查询）。 */
import type { QueryType } from '../resources/QuerySet.js';
export interface QueryResult {
    readonly type: QueryType;
    readonly count: number;
    /** resolve 为原始查询值：采样计数或纳秒数。 */
    read(): Promise<BigUint64Array>;
}
//# sourceMappingURL=QueryResult.d.ts.map