/**
 * WebGPU adapter：`Adapter` 接口在 `GPUAdapter` 上的实现。
 *
 * 创建方式是静态的，因为拿到 `GPUAdapter` 本身是异步的：
 *
 * - `WebGPUAdapter.isSupported()` 同步判断环境有没有 WebGPU；
 * - `WebGPUAdapter.request(options)` 返回 `null` 表示「环境不支持 / 没有可用 adapter」，
 *   这是 `detectBackend` 需要的语义（静默回退到 WebGL2）；
 * - `WebGPUAdapter.create(options)` 在没有 adapter 时抛 {@link ValidationError}，
 *   这是「我明确要 WebGPU」时需要的语义。
 *
 * `requestDevice()` 会先用 core 的 `resolveLimits` 校验 `requiredLimits`（超出 adapter 能力
 * 直接报错，而不是静默降级），再检查 `requiredFeatures` 是否都在 adapter 支持集合里。
 */
import type { Adapter, AdapterInfo } from '../core/Adapter.js';
import type { DeviceDescriptor, DeviceLimits } from '../core/Device.js';
import { type WebGPUAdapterRequestOptions } from './utils/wgpuCapabilities.js';
import { WebGPUDevice } from './WebGPUDevice.js';
export declare class WebGPUAdapter implements Adapter {
    /** 原生 `GPUAdapter`，escape hatch。 */
    readonly native: GPUAdapter;
    readonly info: AdapterInfo;
    readonly features: ReadonlySet<string>;
    readonly limits: DeviceLimits;
    private readonly options;
    /** 排序后的 feature 名，便于调试与错误信息。 */
    readonly featureNames: readonly string[];
    private constructor();
    /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
    get requestOptions(): WebGPUAdapterRequestOptions;
    /** 当前环境是否暴露 WebGPU。 */
    static isSupported(): boolean;
    /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
    static request(options?: WebGPUAdapterRequestOptions): Promise<WebGPUAdapter | null>;
    /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
    static create(options?: WebGPUAdapterRequestOptions): Promise<WebGPUAdapter>;
    /** 创建逻辑设备。 */
    requestDevice(descriptor?: DeviceDescriptor): Promise<WebGPUDevice>;
}
/** 便捷函数：请求一个 `WebGPUAdapter`，不可用时返回 `null`。 */
export declare function createWebGPUAdapter(options?: WebGPUAdapterRequestOptions): Promise<WebGPUAdapter | null>;
//# sourceMappingURL=WebGPUAdapter.d.ts.map