/**
 * WebGL2 的 fence，基于 `WebGL2RenderingContext.fenceSync` / `clientWaitSync`。
 *
 * GL 的 fence 是一个「GPU 侧标记」：`fenceSync` 在命令流里插入一个标记，
 * `clientWaitSync` 可以查询它是否已经被 GPU 处理完。
 * 因为没有回调机制，`wait()` 只能用轮询实现 —— 优先用 `requestAnimationFrame` 让出主线程，
 * 在没有 rAF 的环境（如 Worker）里退回 `setTimeout`。
 */
import type { Fence } from '../../core/sync/Fence.js';
export declare class WebGL2Fence implements Fence {
    readonly label: string;
    private readonly gl;
    private readonly sync;
    private _signaled;
    constructor(gl: WebGL2RenderingContext);
    get signaled(): boolean;
    /** 非阻塞检查。已经 signal 过或 fence 对象创建失败时都返回 true。 */
    poll(): boolean;
    wait(): Promise<void>;
}
//# sourceMappingURL=WebGL2Fence.d.ts.map