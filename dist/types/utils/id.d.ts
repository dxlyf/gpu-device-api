/** 单调递增的标识符，用于标记资源和构建缓存键。 */
/** 返回下一个唯一 id，例如 `buffer#12`。 */
export declare function nextId(prefix: string): string;
/** 当前计数器值（主要用于测试和诊断）。 */
export declare function currentId(): number;
/** 重置计数器。仅用于需要确定性结果的测试。 */
export declare function resetIdCounter(): void;
//# sourceMappingURL=id.d.ts.map