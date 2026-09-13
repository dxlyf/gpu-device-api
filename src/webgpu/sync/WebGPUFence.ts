/**
 * WebGPU 同步点：`Fence` 接口基于 `queue.onSubmittedWorkDone()` 的实现。
 *
 * WebGPU 没有可复用的 fence 对象，每次「等待到此为止」都是一次新的 `onSubmittedWorkDone()`
 * 调用，因此本类就是「一个 promise 的一层壳」：
 *
 * - `signaled` 在 promise settle 后翻转为 true；
 * - `poll()` 非阻塞；
 * - `wait()` 返回同一个 promise，多次 await 不会重复提交等待。
 *
 * 队列永远不会完成时（例如 device 丢失），promise 也可能永远不 resolve；此时把它当作
 * 「已 signal」处理，避免上层为了同步而永久挂住 —— 错误本身会通过 `Device.onError` 报出。
 */

import type { Fence } from '../../core/sync/Fence.js';
import type { WebGPUQueue } from './WebGPUQueue.js';

export class WebGPUFence implements Fence {
  private readonly promise: Promise<void>;
  private _signaled = false;

  constructor(work: Promise<void> | Promise<unknown>) {
    this.promise = Promise.resolve(work).then(
      () => {
        this._signaled = true;
      },
      () => {
        // device 丢失等失败情况：等待不会再有结果，视为已 signal（错误另有上报通道）。
        this._signaled = true;
      },
    );
  }

  /** 队列上此刻之前提交的工作全部完成后创建一个 fence。 */
  static afterQueue(queue: WebGPUQueue): WebGPUFence {
    return new WebGPUFence(queue.onSubmittedWorkDone());
  }

  get signaled(): boolean {
    return this._signaled;
  }

  /** 关联的工作完成后 resolve。 */
  wait(): Promise<void> {
    return this.promise;
  }

  /** 非阻塞检查；工作完成时会翻转 {@link WebGPUFence.signaled}。 */
  poll(): boolean {
    return this._signaled;
  }
}
