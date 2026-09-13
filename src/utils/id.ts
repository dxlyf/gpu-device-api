/** Monotonic identifiers used to label resources and build cache keys. */

let counter = 0;

/** Returns the next unique id, e.g. `buffer#12`. */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}#${counter}`;
}

/** Current counter value (mainly for tests and diagnostics). */
export function currentId(): number {
  return counter;
}

/** Resets the counter. Only intended for deterministic tests. */
export function resetIdCounter(): void {
  counter = 0;
}
