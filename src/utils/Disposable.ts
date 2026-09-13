/** 面向一切持有 GPU 内存的对象的统一释放协议。 */

export interface Disposable {
  /** 释放底层 GPU 资源。可重复调用。 */
  dispose(): void;
  /** 一旦执行过 {@link Disposable.dispose} 便为 true。 */
  readonly disposed: boolean;
}

export function isDisposable(value: unknown): value is Disposable {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Disposable).dispose === 'function'
  );
}

/** 释放全部资源，并在最后收集（重新抛出）第一个失败。 */
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
 * 为类跟踪可释放的辅助对象：在构造函数中调用 `this.track(resource)`，
 * 在 `dispose()` 中调用 `this.disposeTracked()`。
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
