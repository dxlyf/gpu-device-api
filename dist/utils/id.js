/** 单调递增的标识符，用于标记资源和构建缓存键。 */
let counter = 0;
/** 返回下一个唯一 id，例如 `buffer#12`。 */
export function nextId(prefix) {
    counter += 1;
    return `${prefix}#${counter}`;
}
/** 当前计数器值（主要用于测试和诊断）。 */
export function currentId() {
    return counter;
}
/** 重置计数器。仅用于需要确定性结果的测试。 */
export function resetIdCounter() {
    counter = 0;
}
//# sourceMappingURL=id.js.map