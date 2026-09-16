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
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
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
 * 逐位置 colorFormats 的 key 片段。
 *
 * 空位（`null`）写成 `none` —— 没有任何真实 `TextureFormat` 叫这个名字（`depthFormat ?? 'none'`
 * 已经在用同一个占位符）。**必须**给空位一个占位符而不是把它跳过：`[a, null]` / `[null, a]` /
 * `[a]` / `[a, null, null]` 是四种不同的附件布局，跳过空位就会让它们撞同一个键、
 * 共用同一条 `GPURenderPipeline`（批 05 实测过的静默错配）。
 *
 * 密集列表（没有空位）拼出来的串与改动前逐字相同（`['a','b']` → `'a,b'`），
 * 所以既有变体键不会因为这次变化而重排。
 */
export declare function colorFormatsKey(formats: readonly (TextureFormat | null)[]): string;
/**
 * render pipeline variant 的稳定 cache key。
 *
 * 组成与 `RenderPipelineVariant` 一一对应：`colorFormats`、`sampleCount`、`depthFormat`、
 * `vertexLayouts`。attachment 格式与 sample count 变了就必须换一个 `GPURenderPipeline`，
 * 而 vertex layout 会影响 vertex buffer 的解析方式，同样必须参与 key。
 *
 * `colorFormats` 是**逐位置**的（空位 `null`），这里按位置拼串（见 {@link colorFormatsKey}）：
 * 空位的位置必须体现在键里，否则 `[a, null]` 与 `[null, a]` 会共用同一条原生管线。
 */
export declare function renderPipelineCacheKey(variant: RenderPipelineVariant): string;
/** compute pipeline 只需要 entry point + layout，key 主要用于诊断。 */
export declare function computePipelineCacheKey(label: string, layoutKey: string): string;
/** 供调试输出：把 vertex layout 列表还原成可读文本。 */
export declare function describeVertexLayouts(layouts: readonly VertexBufferLayout[]): string;
//# sourceMappingURL=PipelineCache.d.ts.map