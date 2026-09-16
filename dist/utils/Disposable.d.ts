/** 面向一切持有 GPU 内存的对象的统一释放协议。 */
export interface Disposable {
    /** 释放底层 GPU 资源。可重复调用。 */
    dispose(): void;
    /** 一旦执行过 {@link Disposable.dispose} 便为 true。 */
    readonly disposed: boolean;
}
export declare function isDisposable(value: unknown): value is Disposable;
/** 释放全部资源，并在最后收集（重新抛出）第一个失败。 */
export declare function disposeAll(resources: Iterable<unknown>): void;
/**
 * 为类跟踪可释放的辅助对象：在构造函数中调用 `this.track(resource)`，
 * 在 `dispose()` 中调用 `this.disposeTracked()`。
 */
export declare class DisposalScope implements Disposable {
    private readonly resources;
    private _disposed;
    get disposed(): boolean;
    track<T extends Disposable>(resource: T): T;
    untrack(resource: Disposable): void;
    dispose(): void;
}
//# sourceMappingURL=Disposable.d.ts.map