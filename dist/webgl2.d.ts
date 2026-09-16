/// <reference types="@webgpu/types" />
/**
 * 子入口 `@dxyl/gpu-device-api/webgl2` —— core + utils + **WebGL2 后端**（不含 WebGPU）。
 *
 * 用途：使用方在编译期就确定只跑 WebGL2（例如目标环境没有 WebGPU，或明确要避开它的初始化开销），
 * 于是不必把整个 WebGPU 后端打进自己的 bundle。实测（esbuild 口径，见 `.tmp-14/RESULT.md`）：
 * 同一个最小消费方从 **291 738 B / gzip 81 464** 降到 **167 843 B / gzip 49 543**。
 *
 * ```ts
 * import { WebGL2Adapter, BufferUsage } from '@dxyl/gpu-device-api/webgl2';
 *
 * const adapter = await WebGL2Adapter.request({ canvas });
 * const device = await adapter.requestDevice({ label: 'app' });
 * ```
 *
 * 与主入口的差别（务必看清）：
 *
 * - 主入口的 `createDevice({ backend: 'webgl2' })` 走的是 `detectBackend` + 内置注册表，
 *   **注册表里同时有 WebGPU**，所以打包器无法把 WebGPU 后端摇掉（与 `backend: 'auto'` 同体积）；
 * - 本入口是「直接建 WebGL2 adapter」，因此**没有**自动探测、没有回退、没有 `detectBackend` 的诊断信息。
 *   需要在运行时二选一时，请继续用主入口的 `createDevice`。
 *
 * 类型上同样导出 `src/core` 的全部 API，所以 `import type { Device } from '@dxyl/gpu-device-api/webgl2'`
 * 与从主入口导入是同一份声明。
 */
export * from './core/index.js';
export * from './utils/index.js';
export * from './webgl2/index.js';
//# sourceMappingURL=webgl2.d.ts.map