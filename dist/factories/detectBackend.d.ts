/**
 * 后端探测：优先 WebGPU，不可用时回退 WebGL2，并把「为什么回退」讲清楚。
 *
 * 为什么不只用 `'webgpu' in navigator` 判断：`navigator.gpu` 存在但
 * `requestAdapter()` 返回 null 是很常见的情况（无头模式、显卡被禁用、驱动黑名单），
 * 只看 API 是否存在会导致「以为能用 WebGPU，结果一创建设备就失败」。
 * 所以这里**真的去请求一次 adapter**。
 */
import { BackendRegistry, type BackendCreateOptions, type BackendProbeResult } from './BackendRegistry.js';
import type { BackendKind } from '../core/Adapter.js';
export type { BackendAvailability, BackendCreateOptions, BackendProbeResult } from './BackendRegistry.js';
/** 默认的尝试顺序：WebGPU 优先。 */
export declare const DEFAULT_BACKEND_ORDER: readonly BackendKind[];
export interface DetectBackendOptions extends BackendCreateOptions {
    /** 尝试顺序；默认 `['webgpu', 'webgl2']`。 */
    order?: readonly BackendKind[];
    /** 指定后只探测这一个后端。 */
    backend?: BackendKind | 'auto';
    registry?: BackendRegistry;
}
export interface BackendDetection {
    /** 选中的后端；全部不可用时为 `null`。 */
    backend: BackendKind | null;
    /** 每个候选后端的探测结果，顺序与尝试顺序一致。 */
    probes: BackendProbeResult[];
    /** 直接可以拼进错误信息的一句话总结。 */
    reason: string;
}
/** 探测并选出可用后端。 */
export declare function detectBackend(options?: DetectBackendOptions): Promise<BackendDetection>;
/** 只判断某个后端是否可用。 */
export declare function isBackendAvailable(backend: BackendKind, options?: DetectBackendOptions): Promise<boolean>;
//# sourceMappingURL=detectBackend.d.ts.map