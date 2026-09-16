/**
 * uniform 环形竞技场（uniform arena）。
 *
 * ## 为什么必须要有它
 *
 * 最自然的写法是「改一次 uniform → draw → 再改 → 再 draw」，复用同一个 uniform buffer。
 * 但这在 WebGPU 上是**错的**：`queue.writeBuffer` 在 `submit()` 时统一生效，
 * 所以一帧里对同一段内存的多次写入，最后只有最后一次生效 —— 前面所有 draw 都会读到最后一个物体的矩阵。
 * （WebGL2 是立即模式，同一个写法是对的。差异详见 `core/sync/Queue.ts` 的时序契约说明。）
 *
 * 解决办法是给每次 draw 分配**互不重叠**的一段内存，并用**动态偏移**绑定：
 * 这样无论写入何时落地，每个 draw 读到的都是自己那一段，两个后端的行为完全一致。
 *
 * ## 实现要点
 *
 * - 每段长度按 `minUniformBufferOffsetAlignment`（WebGPU/WebGL2 通常都是 256）对齐；
 * - 一帧内**不绕回**已经用过的区间，容量不够就直接扩容（绕回会让同一帧里的两次 draw 撞车）；
 * - 扩容时把本帧已经写过的内容重放到新 buffer 上，因此扩容对调用方完全透明；
 * - 每帧开始时把游标归零，所以容量只需覆盖「单帧最多同时使用的 uniform 总量」。
 */
import { createPipelineCache, type PipelineCache } from '../core/pipeline/PipelineCache.js';
import type { BindGroup } from '../core/binding/BindGroup.js';
import type { BindGroupLayout } from '../core/binding/BindGroupLayout.js';
import type { Buffer } from '../core/resources/Buffer.js';
import type { Device } from '../core/Device.js';
import type { UniformLayout, UniformValues } from './Uniforms.js';
export interface UniformArenaOptions {
    /** 初始容量（字节）。默认 64 KiB，约合 256 次 draw。 */
    initialCapacity?: number;
    /** 容量上限（字节）；超过就抛错而不是无限增长。默认 16 MiB。 */
    maxCapacity?: number;
    label?: string;
}
export declare class UniformArena {
    readonly layout: UniformLayout;
    readonly label: string;
    private readonly device;
    private readonly align;
    private readonly slotSize;
    private readonly maxCapacity;
    private bufferValue;
    private capacityValue;
    private head;
    private bindGroupValue;
    private bindGroupLayoutValue;
    /**
     * 本帧写入的 `(offset, data)` 对，只用于扩容时重放。
     *
     * 用两个平行数组而不是 `{offset, data}` 对象：这里每 draw 记录一次，40k draw 的场景下
     * 每帧 40k 个短命对象是白白送给 GC 的。
     */
    private readonly frameOffsets;
    private readonly frameData;
    /**
     * 扩容时退休的 buffer / bind group，等下一帧 `beginFrame()` 再销毁。
     *
     * 为什么不能立刻销毁：扩容发生在录制过程中，本帧已经录制了引用它们的 `setBindGroup`。
     * WebGPU 会因此在 `queue.submit` 时报「Buffer ... used in submit while destroyed」。
     */
    private readonly retired;
    private _disposed;
    constructor(device: Device, layout: UniformLayout, options?: UniformArenaOptions);
    get buffer(): Buffer;
    get capacity(): number;
    /** 每段占用的字节数（已按对齐值取整）。 */
    get stride(): number;
    get disposed(): boolean;
    /** 每帧开始前调用：把游标归零。 */
    beginFrame(): void;
    /**
     * 分配一段并写入数据，返回供 `setBindGroup(..., [offset])` 使用的动态偏移。
     * 必须在 {@link UniformArena.beginFrame} 之后调用。
     */
    write(values: UniformValues): number;
    /** 直接写入一段原始字节（高级用法：手写打包数据时）。 */
    writeBytes(bytes: Uint8Array): number;
    /** 记下本帧的写入，供扩容重放（两个平行数组，不产生每 draw 的对象）。 */
    private recordWrite;
    /**
     * 取得动态偏移用的 bind group。arena 扩容后会失效并按需重建。
     *
     * @param layout 材质创建的 bind group layout（必须与 arena 的布局一致）
     */
    bindGroup(layout: BindGroupLayout): BindGroup;
    destroy(): void;
    private allocate;
    /**
     * 真正销毁已经退休的 buffer / bind group。
     *
     * 只能在**下一帧的 `beginFrame()`**（那时上一帧已经 submit）或 `destroy()` 里调用 ——
     * 原因见 {@link grow}。
     */
    private releaseRetired;
    /**
     * 扩容并把本帧已写入的内容重放到新 buffer 上。
     * 这样做而不是「绕回旧区间」：绕回会让同一帧内前后两次 draw 读到彼此的数据，
     * 正是本模块要消除的问题。
     *
     * **旧 buffer / bind group 不能在这里销毁**：扩容发生在录制过程中，此时本帧已经录制了
     * 引用它们的 `setBindGroup`，WebGPU 会在 `queue.submit` 时报
     * 「Buffer ... used in submit while destroyed」（WebGL2 只是悄悄用到已删除的对象）。
     * 所以先放进 {@link retired}，等下一帧 `beginFrame()` 时上一帧已经提交完，再真正销毁。
     */
    private grow;
    private createBuffer;
}
/**
 * 按布局缓存 arena：同一个材质的多次绘制共用一个 arena，
 * 不同材质各有自己的 arena（因为布局不同，段长也不同）。
 */
export declare class UniformArenaPool {
    private readonly device;
    private readonly arenas;
    private readonly options;
    constructor(device: Device, options?: UniformArenaOptions);
    /** 取得（或创建）某个布局的 arena。 */
    acquire(layout: UniformLayout): UniformArena;
    beginFrame(): void;
    get size(): number;
    destroy(): void;
}
/** 管线/程序缓存的复用出口，便于上层按需缓存「材质 × 几何体」的组合。 */
export type { PipelineCache };
export { createPipelineCache };
//# sourceMappingURL=UniformArena.d.ts.map