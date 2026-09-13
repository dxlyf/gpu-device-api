/**
 * WebGPU 后端的管线缓存。
 *
 * 薄薄一层包装 `src/core/pipeline/PipelineCache.ts` 的 `createPipelineCache`（LRU），加上两个
 * WebGPU 特有的能力：
 *
 * - `resolve(key, create)`：查不到就建，并保证同一个 key 只建一次；
 * - 淘汰/释放时回调 `onEvict`，让持有者有机会记录日志（`GPURenderPipeline` 本身没有 destroy，
 *   所以「释放」只是把它从缓存里摘掉）。
 *
 * `GPUShaderModule` 不在这里缓存：它按 `ShaderModule` 实例缓存在 `WebGPUShaderModule` 内部，
 * 因为「每个 module 只需要编译一次」是 module 自身的性质，与 pipeline variant 无关。
 */
import type { RenderPipelineVariant } from '../../core/pipeline/RenderPipeline.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
export declare class PipelineCache<T> {
    private readonly cache;
    private readonly created;
    private _disposed;
    constructor(limit?: number, onEvict?: (value: T, key: string) => void);
    get size(): number;
    get disposed(): boolean;
    has(key: string): boolean;
    get(key: string): T | undefined;
    set(key: string, value: T): T;
    delete(key: string): boolean;
    clear(): void;
    /** 当前已缓存的值，最旧的在前。 */
    values(): T[];
    /** 当前缓存过的全部 key（含被 LRU 淘汰后不再持有的 key 会即时移除）。 */
    keys(): string[];
    /**
     * 查 `key`；不存在则调用 `create` 建立并缓存。
     *
     * `create` 抛错时不会污染缓存（不会留下「半个」条目），错误原样向上抛。
     */
    resolve(key: string, create: () => T): T;
    /** 释放缓存本身（不负责销毁其中的对象，因为 WebGPU 的 pipeline 没有 destroy）。 */
    dispose(): void;
    /** 便于调试：缓存内容的 key 列表。 */
    toString(): string;
}
/** 按 core 的方式创建缓存（等价于 `new PipelineCache()`，便于外部保持风格一致）。 */
export declare function createWgpuPipelineCache<T>(limit?: number, onEvict?: (value: T, key: string) => void): PipelineCache<T>;
/**
 * render pipeline variant 的稳定 cache key。
 *
 * 组成与 `RenderPipelineVariant` 一一对应：`colorFormats`、`sampleCount`、`depthFormat`、
 * `vertexLayouts`。attachment 格式与 sample count 变了就必须换一个 `GPURenderPipeline`，
 * 而 vertex layout 会影响 vertex buffer 的解析方式，同样必须参与 key。
 */
export declare function renderPipelineCacheKey(variant: RenderPipelineVariant): string;
/** compute pipeline 只需要 entry point + layout，key 主要用于诊断。 */
export declare function computePipelineCacheKey(label: string, layoutKey: string): string;
/** 供调试输出：把 vertex layout 列表还原成可读文本。 */
export declare function describeVertexLayouts(layouts: readonly VertexBufferLayout[]): string;
//# sourceMappingURL=PipelineCache.d.ts.map