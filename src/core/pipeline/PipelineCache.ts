/** A generic least-recently-used cache used by both backends for pipeline/program objects. */

export interface PipelineCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): T;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  readonly size: number;
  /** Values currently cached, oldest first. */
  values(): T[];
}

/**
 * Creates an LRU cache. `onEvict` receives values displaced by the size limit so backends can
 * release the corresponding GPU objects.
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
      // Refresh recency.
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

/** Builds a stable cache key from strings and numbers, skipping empty parts. */
export function cacheKey(...parts: (string | number | boolean | undefined | null)[]): string {
  return parts.filter((part) => part !== undefined && part !== null && part !== '').join('|');
}
