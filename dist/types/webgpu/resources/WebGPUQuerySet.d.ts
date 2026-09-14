/**
 * WebGPU query set：`QuerySet` 接口在 `GPUQuerySet` 上的实现。
 *
 * timestamp 查询在 WebGPU 里由 `timestamp-query` feature 控制；occlusion 查询是 core 功能。
 * 属于第二阶段的能力（`QueryResult` 回读需要 `CommandEncoder.resolveQuerySet`，core 尚未提供），
 * 因此这里只负责创建/销毁与 feature 校验。
 */
import type { QuerySet, QuerySetDescriptor, QueryType } from '../../core/resources/QuerySet.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
/** timestamp 查询需要的 feature 名。 */
export declare const TIMESTAMP_QUERY_FEATURE = "timestamp-query";
export declare class WebGPUQuerySet implements QuerySet {
    readonly label: string;
    readonly type: QueryType;
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
//# sourceMappingURL=WebGPUQuerySet.d.ts.map