/**
 * `createDevice`：统一入口。自动探测后端、创建 adapter 与 device，
 * 并在需要 canvas 时把 canvas context 一并配置好。
 *
 * ```ts
 * const { device, context } = await createRenderer({ canvas }); // gfx 层的写法
 * const device = await createDevice({ backend: 'auto', canvas }); // core 层的写法
 * ```
 */
import { type Logger } from '../utils/logger.js';
import { type BackendProbeResult } from './detectBackend.js';
import type { BackendCreateOptions, BackendRegistry } from './BackendRegistry.js';
import type { Adapter, BackendKind } from '../core/Adapter.js';
import type { Device, DeviceDescriptor } from '../core/Device.js';
import type { CanvasContext } from '../core/CanvasContext.js';
export interface CreateDeviceOptions extends DeviceDescriptor, BackendCreateOptions {
    /** `'auto'`（默认）优先 WebGPU，失败回退 WebGL2；也可以强制指定。 */
    backend?: BackendKind | 'auto';
    /** 尝试顺序，仅在 `backend: 'auto'` 时生效。 */
    order?: readonly BackendKind[];
    registry?: BackendRegistry;
    logger?: Logger;
    /**
     * 为 true 时禁止自动回退：指定的后端不可用就直接抛错。
     * 调试 WebGPU 专用功能（compute、storage buffer）时很有用 —— 免得悄悄跑在 WebGL2 上。
     */
    strictBackend?: boolean;
}
export interface CreatedDevice {
    device: Device;
    adapter: Adapter;
    /** 实际选中的后端。 */
    backend: BackendKind;
    /** 各候选后端的探测结果（用于诊断「为什么没跑在 WebGPU 上」）。 */
    probes: BackendProbeResult[];
    /** 传入 canvas 时附带已配置好的 canvas context。 */
    context: CanvasContext | null;
}
/**
 * 创建 device。
 *
 * @throws ValidationError 当所有候选后端都不可用，或 `strictBackend` 下所选后端不可用。
 */
export declare function createDevice(options?: CreateDeviceOptions): Promise<Device>;
/** 与 {@link createDevice} 相同，但把 adapter / 探测结果 / canvas context 一并返回。 */
export declare function createDeviceWithAdapter(options?: CreateDeviceOptions): Promise<CreatedDevice>;
//# sourceMappingURL=createDevice.d.ts.map