/** 面向一切持有 GPU 内存的对象的统一释放协议。 */
export function isDisposable(value) {
    return (!!value &&
        typeof value === 'object' &&
        typeof value.dispose === 'function');
}
/** 释放全部资源，并在最后收集（重新抛出）第一个失败。 */
export function disposeAll(resources) {
    let firstError;
    for (const resource of resources) {
        if (!isDisposable(resource))
            continue;
        try {
            resource.dispose();
        }
        catch (error) {
            firstError ??= error;
        }
    }
    if (firstError !== undefined)
        throw firstError;
}
/**
 * 为类跟踪可释放的辅助对象：在构造函数中调用 `this.track(resource)`，
 * 在 `dispose()` 中调用 `this.disposeTracked()`。
 */
export class DisposalScope {
    resources = new Set();
    _disposed = false;
    get disposed() {
        return this._disposed;
    }
    track(resource) {
        if (this._disposed) {
            resource.dispose();
            throw new Error('[gpu-device-api] Cannot track a resource on a disposed scope.');
        }
        this.resources.add(resource);
        return resource;
    }
    untrack(resource) {
        this.resources.delete(resource);
    }
    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        const resources = [...this.resources];
        this.resources.clear();
        disposeAll(resources);
    }
}
//# sourceMappingURL=Disposable.js.map