/**
 * WebGPU query set：`QuerySet` 接口在 `GPUQuerySet` 上的实现。
 *
 * timestamp 查询在 WebGPU 里由 `timestamp-query` feature 控制；occlusion 查询是 core 功能。
 * 这里除了创建/销毁，还负责两件容易踩空的事：
 *
 * 1. **feature 必须真的启用过** —— adapter 支持 `timestamp-query` 不等于设备启用了它，
 *    只看 adapter 的集合会让原生 `createQuerySet()` 抛校验错误、拿到一个不可用的对象，
 *    上层却以为一切正常（那正是「静默返回 0」的成因）。所以这里查的是
 *    `WebGPUDevice.hasEnabledFeature()`；
 * 2. **pass 内写时间戳还需要 `timestamp-query-inside-passes`** —— 见
 *    {@link toGPUTimestampWrites}，缺这个 feature 时明确报错而不是让原生校验在 submit 时才炸。
 */
import type { PassTimestampWrites, QuerySet, QuerySetDescriptor, QueryType as QueryTypeName } from '../../core/resources/QuerySet.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
/** timestamp 查询需要的 feature 名。 */
export declare const TIMESTAMP_QUERY_FEATURE = "timestamp-query";
/**
 * 允许在 pass 内写时间戳的 feature 名。
 *
 * 标准名是 `timestamp-query-inside-passes`；Chrome 在这个能力还处于实验阶段时只暴露
 * `chromium-experimental-timestamp-query-inside-passes`（需要 `--enable-webgpu-developer-features`），
 * 两个都认，避免「实现明明支持却报不支持」。
 */
export declare const TIMESTAMP_INSIDE_PASSES_FEATURES: readonly string[];
export declare class WebGPUQuerySet implements QuerySet {
    readonly label: string;
    readonly type: QueryTypeName;
    readonly count: number;
    readonly native: GPUQuerySet;
    private readonly device;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor: QuerySetDescriptor);
    get disposed(): boolean;
    /** 销毁 query set。幂等。 */
    destroy(): void;
    /** `Disposable` 的别名。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 query set。 */
export declare function isWebGPUQuerySet(value: unknown): value is WebGPUQuerySet;
/** 把任意 query set 表示收窄为原生 `GPUQuerySet`。 */
export declare function asGPUQuerySet(value: unknown, context: string): GPUQuerySet;
/**
 * 把 core 的 {@link PassTimestampWrites} 翻译成 WebGPU 的 `GPURenderPassTimestampWrites` /
 * `GPUComputePassTimestampWrites`（两者形状相同）。
 *
 * 先做**跨后端通用**的检查（{@link assertPassTimestampWrites}：类型、下标范围、两端不同），
 * 再检查 WebGPU 专有的 feature。缺 `timestamp-query-inside-passes` 时抛错 ——
 * 绝大多数 Chrome 版本默认不开这个能力，静默忽略会让人以为「时间戳写进去了、只是值为 0」。
 */
export declare function toGPUTimestampWrites(writes: PassTimestampWrites, device: WebGPUDevice, context: string): GPURenderPassTimestampWrites;
//# sourceMappingURL=WebGPUQuerySet.d.ts.map