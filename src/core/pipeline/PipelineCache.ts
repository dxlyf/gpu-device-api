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
export function createPipelineCache<T>(limit = 128, onEvict?: (value: T, key: string) => void): PipelineCache<T> {
  const map = new Map<string, T>();

  const evictIfNeeded = (): void => {
    while (map.size > limit) {
      const oldest = map.keys().next();
      if (oldest.done) return;
      const key = oldest.value;
      const value = map.get(key)!;
      map.delete(key);
      onEvict?.(value, key);
    }
  };

  return {
    get(key) {
      const value = map.get(key);
      if (value === undefined) return undefined;
      // 刷新最近使用顺序。
      map.delete(key);
      map.set(key, value);
      return value;
    },
    set(key, value) {
      const existing = map.get(key);
      if (existing !== undefined) map.delete(key);
      map.set(key, value);
      evictIfNeeded();
      return value;
    },
    has(key) {
      return map.has(key);
    },
    delete(key) {
      return map.delete(key);
    },
    clear() {
      map.clear();
    },
    get size() {
      return map.size;
    },
    values() {
      return [...map.values()];
    },
  };
}

/** 由字符串和数字拼出稳定的 cache key，跳过空片段。 */
export function cacheKey(...parts: (string | number | boolean | undefined | null)[]): string {
  return parts.filter((part) => part !== undefined && part !== null && part !== '').join('|');
}
