/// <reference types="@webgpu/types" />
/**
 * 子入口 `@dxyl/gpu-device-api/core` —— **core 层 + utils，不含任何后端实现**。
 *
 * 面向「要直接控制底层、并且在后端选择上不需要 `createDevice` 的自动探测」的使用方：
 * 拿一个 `Adapter`（自己 new 或用别处给的），然后只用 core 的类型与枚举。
 * 本入口**不引用** `src/factories`，因此**不会**把 WebGPU / WebGL2 任何一个后端带进来 ——
 * 实测只用两个枚举时消费方产物 **411 字节**（esbuild，gzip 286 B；见 `.tmp-14/RESULT.md`）。
 *
 * 需要「一个函数帮我探测并创建 device」时用主入口 `@dxyl/gpu-device-api`（`createDevice`），
 * 或直接用某个后端子入口（`/webgl2`、`/webgpu`）。
 *
 * **注意**：`src/factories` 不在本入口里。原因见 `.tmp-14/README.md`：
 * `default-registry.ts` 静态 import 了两个后端的 Adapter，一旦被引用，两个后端就都进 bundle，
 * 这正是批 14 要解决的问题。
 */
export * from './core/index.js';
export * from './utils/index.js';
//# sourceMappingURL=core.d.ts.map