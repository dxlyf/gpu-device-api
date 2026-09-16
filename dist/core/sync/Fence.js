/**
 * CPU/GPU 同步点。
 *
 * WebGPU 使用 `onSubmittedWorkDone`；WebGL2 没有 fence 对象，因此后端在可用时走
 * `WebGL2RenderingContext.fenceSync` 路径，否则回退为已 resolve 的 promise。
 */
export {};
//# sourceMappingURL=Fence.js.map