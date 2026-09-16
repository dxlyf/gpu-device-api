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
import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import { QueryType } from '../../core/resources/QuerySet.js';
/** 提供时间查询能力的扩展名。 */
export const TIMER_QUERY_EXTENSION = 'EXT_disjoint_timer_query_webgl2';
/** `ANY_SAMPLES_PASSED` 的取值（WebGL2 核心常量，`gl.ANY_SAMPLES_PASSED`）。 */
export const ANY_SAMPLES_PASSED = 0x8c2f;
/** 取时间查询扩展；不存在时返回 null。 */
export function getTimerQueryExtension(gl) {
    const extension = gl.getExtension(TIMER_QUERY_EXTENSION);
    return extension ?? null;
}
export class WebGL2QuerySet {
    label;
    type;
    count;
    /** 原生表示：GL 的 query 对象数组（每条查询一个对象，见类注释）。 */
    native;
    /** 每条查询对应的 GL 目标（`TIME_ELAPSED_EXT` 或 `ANY_SAMPLES_PASSED`）。 */
    target;
    /** timestamp 查询用的扩展；occlusion 查询为 null。 */
    timerExtension;
    gl;
    onDestroy;
    _disposed = false;
    constructor(gl, descriptor, onDestroy = () => { }) {
        this.gl = gl;
        this.onDestroy = onDestroy;
        this.label = descriptor.label ?? nextId('querySet');
        if (!Number.isInteger(descriptor.count) || descriptor.count <= 0) {
            throw new ValidationError(`[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(descriptor.count)}.`);
        }
        if (descriptor.type === QueryType.Timestamp) {
            const extension = getTimerQueryExtension(gl);
            if (!extension) {
                throw new ValidationError(`[gpu-device-api] QuerySet "${this.label}": WebGL2 timestamp queries need the ` +
                    `"${TIMER_QUERY_EXTENSION}" extension, which this context does not expose. ` +
                    'That extension is the only way to measure GPU time on WebGL2; without it, GPU timing is ' +
                    'unavailable. Use the WebGPU backend (feature "timestamp-query") or a driver/browser build ' +
                    'that implements it.');
            }
            this.timerExtension = extension;
            this.target = extension.TIME_ELAPSED_EXT;
        }
        else {
            this.timerExtension = null;
            this.target = ANY_SAMPLES_PASSED;
        }
        const queries = [];
        for (let index = 0; index < descriptor.count; index++) {
            const query = gl.createQuery();
            if (!query) {
                for (const created of queries)
                    gl.deleteQuery(created);
                throw new ValidationError(`[gpu-device-api] QuerySet "${this.label}": gl.createQuery() returned null for entry ${index} ` +
                    '(the context ran out of query objects or was lost).');
            }
            queries.push(query);
        }
        this.type = descriptor.type;
        this.count = descriptor.count;
        this.native = queries;
    }
    get disposed() {
        return this._disposed;
    }
    /** 取第 index 条 GL query；越界时抛错。 */
    queryAt(index, context) {
        if (!Number.isInteger(index) || index < 0 || index >= this.count) {
            throw new ValidationError(`[gpu-device-api] ${context}: query index ${String(index)} is outside the query set "${this.label}" ` +
                `range [0, ${this.count}).`);
        }
        return this.native[index];
    }
    /** 销毁全部 GL query 对象。幂等。 */
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        for (const query of this.native)
            this.gl.deleteQuery(query);
        this.onDestroy(this);
    }
    /** `Disposable` 的别名。 */
    dispose() {
        this.destroy();
    }
}
/** 收窄为 WebGL2 后端的 query set（`readQuerySet` 需要读它的 GL 对象）。 */
export function asWebGL2QuerySet(value, context) {
    if (value instanceof WebGL2QuerySet)
        return value;
    throw new ValidationError(`[gpu-device-api] ${context}: expected a WebGL2 query set created by WebGL2Device.createQuerySet().`);
}
//# sourceMappingURL=WebGL2QuerySet.js.map