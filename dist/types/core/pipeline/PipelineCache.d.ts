/** 两个后端共用的通用 LRU（least-recently-used）cache，用于缓存 pipeline/program 对象。 */
export interface PipelineCache<T> {
    get(key: string): T | undefined;
    set(key: string, value: T): T;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    readonly size: number;
    /** 当前已缓存的值，最旧的在前。 */
    values(): T[];
}
/**
 * 创建 LRU cache。`onEvict` 会收到因容量上限而被淘汰的值，
 * 以便后端释放对应的 GPU 对象。
 */
export declare function createPipelineCache<T>(limit?: number, onEvict?: (value: T, key: string) => void): PipelineCache<T>;
/** 由字符串和数字拼出稳定的 cache key，跳过空片段。 */
export declare function cacheKey(...parts: (string | number | boolean | undefined | null)[]): string;
//# sourceMappingURL=PipelineCache.d.ts.map