/**
 * 内置后端工厂：把两个具体后端适配成 {@link BackendFactory}。
 *
 * 单独放一个文件是为了打破依赖环：`detectBackend` 与 `createDevice` 都只需要注册表，
 * 而注册表不需要认识 WebGPU/WebGL2 的具体实现；只有这里同时引用两者。
 */
import { BackendRegistry } from './BackendRegistry.js';
/**
 * 探测 `requestAdapter()` 的超时时间（毫秒）。
 *
 * 为什么要超时：在部分环境里（无头模式、GPU 进程未就绪、驱动初始化很慢）
 * `requestAdapter()` 既不 resolve 也不 reject，而是**一直挂着**。
 * 那样整个 `createDevice` 就永远不返回，页面表现为「一直卡在启动中」——
 * 比明确回退到 WebGL2 糟糕得多。超过这个时间就当作不可用。
 */
export declare const WEBGPU_ADAPTER_PROBE_TIMEOUT_MS = 3000;
/** 内置后端注册表（`webgpu` + `webgl2`），进程内复用同一个实例。 */
export declare function createDefaultBackendRegistry(): BackendRegistry;
//# sourceMappingURL=default-registry.d.ts.map