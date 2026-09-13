/**
 * A CPU/GPU synchronisation point.
 *
 * WebGPU uses `onSubmittedWorkDone`; WebGL2 has no fence object, so the backend uses the
 * `WebGL2RenderingContext.fenceSync` path when available and falls back to a resolved promise.
 */

export interface Fence {
  readonly signaled: boolean;
  /** Resolves once the associated work has completed. */
  wait(): Promise<void>;
  /** Non-blocking check; flips {@link Fence.signaled} when the work is done. */
  poll(): boolean;
}
