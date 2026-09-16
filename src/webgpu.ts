/// <reference types="@webgpu/types" />

/**
 * 子入口 `@dxyl/gpu-device-api/webgpu` —— core + utils + **WebGPU 后端**（不含 WebGL2）。
 *
 * 与 `@dxyl/gpu-device-api/webgl2` 对称。用途是在编译期就确定只跑 WebGPU
 * （例如明确要用 compute / storage buffer，不需要回退到 WebGL2），
 * 从而不必把 WebGL2 后端打进 bundle。
 *
 * ```ts
 * import { WebGPUAdapter, BufferUsage } from '@dxyl/gpu-device-api/webgpu';
 *
 * const adapter = await WebGPUAdapter.create({ powerPreference: 'high-performance' });
 * const device = await adapter.requestDevice({ label: 'app' });
 * ```
 *
 * 同样**没有**自动探测与回退：`WebGPUAdapter.create()` 拿不到 adapter 时直接抛错。
 * 需要「优先 WebGPU、失败回退 WebGL2」时用主入口的 `createDevice({ backend: 'auto' })`。
 *
 * 本入口的 `WebGPUAdapter.create()` 没有主入口 `createDevice` 里那段
 * `requestAdapter()` 超时兜底（`WEBGPU_ADAPTER_PROBE_TIMEOUT_MS`）—— 那段逻辑在
 * `src/factories/default-registry.ts`，而本入口刻意不引用 `src/factories`。
 */

export * from './core/index.js';
export * from './utils/index.js';
export * from './webgpu/index.js';
