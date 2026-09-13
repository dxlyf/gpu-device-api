/** Uniform release protocol for anything that owns GPU memory. */

export interface Disposable {
  /** Releases the underlying GPU resources. Safe to call more than once. */
  dispose(): void;
  /** True once {@link Disposable.dispose} has run. */
  readonly disposed: boolean;
}

export function isDisposable(value: unknown): value is Disposable {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Disposable).dispose === 'function'
  );
}

/** Disposes every resource, collecting (and re-throwing) the first failure afterwards. */
export function disposeAll(resources: Iterable<unknown>): void {
  let firstError: unknown;
  for (const resource of resources) {
    if (!isDisposable(resource)) continue;
    try {
      resource.dispose();
    } catch (error) {
      firstError ??= error;
    }
  }
  if (firstError !== undefined) throw firstError;
}

/**
 * Tracks disposable helpers for a class: `this.track(resource)` in the constructor and
 * `this.disposeTracked()` from `dispose()`.
 */
export class DisposalScope implements Disposable {
  private readonly resources = new Set<Disposable>();
  private _disposed = false;

  get disposed(): boolean {
    return this._disposed;
  }

  track<T extends Disposable>(resource: T): T {
    if (this._disposed) {
      resource.dispose();
      throw new Error('[gpu-device-api] Cannot track a resource on a disposed scope.');
    }
    this.resources.add(resource);
    return resource;
  }

  untrack(resource: Disposable): void {
    this.resources.delete(resource);
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    const resources = [...this.resources];
    this.resources.clear();
    disposeAll(resources);
  }
}
