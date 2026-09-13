/**
 * 内置后端工厂：把两个具体后端适配成 {@link BackendFactory}。
 *
 * 单独放一个文件是为了打破依赖环：`detectBackend` 与 `createDevice` 都只需要注册表，
 * 而注册表不需要认识 WebGPU/WebGL2 的具体实现；只有这里同时引用两者。
 */
import { BackendRegistry } from './BackendRegistry.js';
/** 内置后端注册表（`webgpu` + `webgl2`），进程内复用同一个实例。 */
export declare function createDefaultBackendRegistry(): BackendRegistry;
//# sourceMappingURL=default-registry.d.ts.map