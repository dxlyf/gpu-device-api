/**
 * 工厂与后端选择层。
 *
 * 使用方式：
 * ```ts
 * import { createDeviceWithAdapter } from 'gpu-device-api';
 *
 * const { device, backend, context } = await createDeviceWithAdapter({ canvas });
 * // device  —— 实现 core `Device` 接口的对象
 * // backend —— 实际选中的 'webgpu' | 'webgl2'
 * // context —— 已配置好的 canvas 表面
 * ```
 */
export { BackendRegistry, } from './BackendRegistry.js';
export { createDefaultBackendRegistry } from './default-registry.js';
export { DEFAULT_BACKEND_ORDER, detectBackend, isBackendAvailable, } from './detectBackend.js';
export { createDevice, createDeviceWithAdapter, } from './createDevice.js';
//# sourceMappingURL=index.js.map