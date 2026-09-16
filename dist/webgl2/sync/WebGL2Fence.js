/**
 * WebGL2 的 fence，基于 `WebGL2RenderingContext.fenceSync` / `clientWaitSync`。
 *
 * GL 的 fence 是一个「GPU 侧标记」：`fenceSync` 在命令流里插入一个标记，
 * `clientWaitSync` 可以查询它是否已经被 GPU 处理完。
 * 因为没有回调机制，`wait()` 只能用轮询实现 —— 优先用 `requestAnimationFrame` 让出主线程，
 * 在没有 rAF 的环境（如 Worker）里退回 `setTimeout`。
 */
import { nextId } from '../../utils/id.js';
export class WebGL2Fence {
    label = nextId('fence');
    gl;
    sync;
    _signaled = false;
    constructor(gl) {
        this.gl = gl;
        // SYNC_GPU_COMMANDS_COMPLETE 表示「之前下发的所有命令都已完成」。
        this.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        // 插入 fence 之后要 flush 一次，否则命令还在客户端队列里，fence 永远不会 signal。
        gl.flush();
    }
    get signaled() {
        return this._signaled;
    }
    /** 非阻塞检查。已经 signal 过或 fence 对象创建失败时都返回 true。 */
    poll() {
        if (this._signaled)
            return true;
        if (!this.sync) {
            this._signaled = true;
            return true;
        }
        const status = this.gl.clientWaitSync(this.sync, 0, 0);
        if (status === this.gl.ALREADY_SIGNALED || status === this.gl.CONDITION_SATISFIED) {
            this._signaled = true;
            this.gl.deleteSync(this.sync);
            return true;
        }
        if (status === this.gl.WAIT_FAILED) {
            // 上下文丢失之类的情况下，把 fence 视为已完成，避免调用方永久等待。
            this._signaled = true;
            return true;
        }
        return false;
    }
    async wait() {
        if (this._signaled)
            return;
        if (!this.sync) {
            this._signaled = true;
            return;
        }
        // 轮询等待：GL 没有 Promise 化的等待接口。
        for (;;) {
            if (this.poll())
                return;
            await nextTick();
        }
    }
}
function nextTick() {
    const requestFrame = globalThis
        .requestAnimationFrame;
    if (typeof requestFrame === 'function') {
        return new Promise((resolve) => requestFrame(() => resolve()));
    }
    return new Promise((resolve) => setTimeout(resolve, 1));
}
//# sourceMappingURL=WebGL2Fence.js.map