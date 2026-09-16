/** GPU query set（occlusion / timestamp 查询）。对应 WebGPU 的 `GPUQuerySet`。 */
import { ValidationError } from '../errors/ValidationError.js';
export const QueryType = {
    Occlusion: 'occlusion',
    Timestamp: 'timestamp',
};
/**
 * 校验 {@link PassTimestampWrites}，抛出的错误与后端无关。
 *
 * 两个后端都要做同一组检查（类型必须是 timestamp、下标必须在 query set 范围内、两端不能相同），
 * 因此放在 core 里；后端只需在此之上补各自的「这个能力在本后端是否可用」检查。
 */
export function assertPassTimestampWrites(writes, context) {
    if (writes.querySet.type !== QueryType.Timestamp) {
        throw new ValidationError(`[gpu-device-api] ${context}: timestampWrites.querySet must be a "timestamp" query set, got ` +
            `"${String(writes.querySet.type)}".`);
    }
    const begin = writes.beginningOfPassWriteIndex;
    const end = writes.endOfPassWriteIndex;
    if (begin === undefined && end === undefined) {
        throw new ValidationError(`[gpu-device-api] ${context}: timestampWrites needs at least one of beginningOfPassWriteIndex / ` +
            'endOfPassWriteIndex.');
    }
    for (const [name, index] of [
        ['beginningOfPassWriteIndex', begin],
        ['endOfPassWriteIndex', end],
    ]) {
        if (index === undefined)
            continue;
        if (!Number.isInteger(index) || index < 0 || index >= writes.querySet.count) {
            throw new ValidationError(`[gpu-device-api] ${context}: timestampWrites.${name} (${String(index)}) is outside the query set's ` +
                `range [0, ${writes.querySet.count}).`);
        }
    }
    if (begin !== undefined && begin === end) {
        throw new ValidationError(`[gpu-device-api] ${context}: beginningOfPassWriteIndex and endOfPassWriteIndex must differ (they are ` +
            `two different instants), got both = ${begin}.`);
    }
}
//# sourceMappingURL=QuerySet.js.map