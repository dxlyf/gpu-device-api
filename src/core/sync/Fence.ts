/**
 * CPU/GPU 同步点。
 *
 * WebGPU 使用 `onSubmittedWorkDone`；WebGL2 没有 fence 对象，因此后端在可用时走
 * `WebGL2RenderingContext.fenceSync` 路径，否则回退为已 resolve 的 promise。
 */

export interface Fence {
  readonly signaled: boolean;
  /** 关联的工作完成后 resolve。 */
  wait(): Promise<void>;
  /** 非阻塞检查；工作完成时翻转 {@link Fence.signaled}。 */
  poll(): boolean;
}
