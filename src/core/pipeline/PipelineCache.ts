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
  /**
   * 最近一次 `get`/`set` 过的 key。Map 的插入顺序就是 LRU 顺序，
   * 所以「刚刚用过的那个」本来就已经在队尾，不必再 delete+set 刷新一遍 ——
   * 批量绘制时每帧会有几千次对**同一个** pipeline 的查询，省下的是两次 Map 变更/次。
   */
  let mostRecent: string | undefined;

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
      // 刷新最近使用顺序（已经是队尾就跳过，见 mostRecent 的说明）。
      if (mostRecent !== key) {
        map.delete(key);
        map.set(key, value);
        mostRecent = key;
      }
      return value;
    },
    set(key, value) {
      const existing = map.get(key);
      if (existing !== undefined) map.delete(key);
      map.set(key, value);
      mostRecent = key;
      evictIfNeeded();
      return value;
    },
    has(key) {
      return map.has(key);
    },
    delete(key) {
      if (mostRecent === key) mostRecent = undefined;
      return map.delete(key);
    },
    clear() {
      mostRecent = undefined;
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

/**
 * 由字符串和数字拼出稳定的 cache key，跳过空片段。
 *
 * 用手写循环而不是 `parts.filter(...).join('|')`：后者每次调用多分配一个中间数组，
 * 而两个后端的变体解析都会走到这里。
 */
export function cacheKey(...parts: (string | number | boolean | undefined | null)[]): string {
  let key = '';
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part === undefined || part === null || part === '') continue;
    key = key === '' ? `${part}` : `${key}|${part}`;
  }
  return key;
}
