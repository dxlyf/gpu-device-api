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
export { BackendRegistry, type BackendAvailability, type BackendCreateOptions, type BackendFactory, type BackendProbeResult, } from './BackendRegistry.js';
export { createDefaultBackendRegistry } from './default-registry.js';
export { DEFAULT_BACKEND_ORDER, detectBackend, isBackendAvailable, type BackendDetection, type DetectBackendOptions, } from './detectBackend.js';
export { createDevice, createDeviceWithAdapter, type CreateDeviceOptions, type CreatedDevice, } from './createDevice.js';
//# sourceMappingURL=index.d.ts.map