/**
 * gfx 层的 GPU 计时：把「两个后端各自的 query 机制」封成 `Renderer.stats.gpuFrameTime`。
 *
 * ## 为什么不能每帧阻塞读回
 *
 * GPU 时间只有在 GPU **真的执行完**那段命令之后才存在。每帧 `await` 一次读回，等于每帧都把
 * CPU 与 GPU 串行化：CPU 提交完就干等，队列里永远只有一帧在飞，测出来的「帧时间」会被
 * 同步开销主导（而且这种测法本身会改变被测对象）。所以这里的策略是：
 *
 * - **环形 query set**：`frames` 个槽位轮流写，写满一圈才会覆盖旧值；
 * - **延迟 `delay` 帧读回**：帧 k 提交完之后去读第 `k - delay` 帧的槽位（那时它早已落盘）；
 * - **按槽位记账**：某个槽位的读回还没落地时，**不会**再往那个槽位写、也不会重复读它 ——
 *   否则读到的可能是后来那帧的值（两个后端的读回都是异步的，WebGL2 上实测可以滞后好几秒）；
 * - **同时在飞的读回有上限**（{@link MAX_READBACKS_IN_FLIGHT}）：读回本身要提交命令、要映射
 *   内存，放任它每帧都发会把被测对象变得更忙。
 *
 * 因此 `gpuFrameTimeMs` 是「最近一次成功读回的那一帧」的值，`samples` 记录已经拿到多少个样本。
 *
 * ## 两个后端的差异（差异都在这里封掉）
 *
 * | | WebGPU | WebGL2 |
 * | --- | --- | --- |
 * | 机制 | `CommandEncoder.writeTimestamp()`（只需 `timestamp-query`） | `RenderPassDescriptor.timestampWrites`（`gl.beginQuery`/`endQuery`） |
 * | 每帧写什么 | 两个时刻：`slot` = 帧开始、`slot + 1` = 帧结束 | 一个值：`slot` = 该通道的耗时（纳秒） |
 * | 耗时 | `(end - begin) × timestampPeriod` | 直接就是纳秒 |
 * | 读回延迟 | `mapAsync` 在 GPU 写完后很快 resolve | 实测（SwiftShader）可达秒级，需要多帧后才读得到 |
 *
 * 无论哪条路径，最后都走 `Device.readQuerySet()` + `QueryResult.read()`，因此上层的降级行为一致。
 */
import type { Device } from '../core/Device.js';
import type { BackendKind } from '../core/Adapter.js';
import type { PassTimestampWrites, QuerySet } from '../core/resources/QuerySet.js';
/** GPU 计时需要的 feature 名（WebGPU 的 device feature；WebGL2 侧由扩展探测成同名 feature）。 */
export declare const GPU_TIMING_FEATURE = "timestamp-query";
/** 环形 query set 的默认槽数。 */
export declare const DEFAULT_GPU_TIMING_FRAMES = 32;
/** 默认延迟多少帧读回（见文件头「为什么不能每帧阻塞读回」）。 */
export declare const DEFAULT_GPU_TIMING_DELAY = 8;
/** 同时在飞的读回上限：读回本身也有开销，不能让它把被测对象压垮。 */
export declare const MAX_READBACKS_IN_FLIGHT = 4;
export interface GpuTimingOptions {
    /** 环形槽数；默认 {@link DEFAULT_GPU_TIMING_FRAMES}，范围 [4, 256]。 */
    frames?: number;
    /** 延迟帧数；默认 {@link DEFAULT_GPU_TIMING_DELAY}，会被夹到 `[1, frames - 1]`。 */
    delay?: number;
}
/** GPU 计时的对外状态。关闭或不可用时 `enabled` 为 false，`gpuFrameTimeMs` 为 null。 */
export interface GpuTimingStats {
    readonly enabled: boolean;
    /** 后端 + 设备是否具备 GPU 计时能力（WebGPU：`timestamp-query`；WebGL2：时间查询扩展）。 */
    readonly available: boolean;
    /** 环形槽数；未启用时为 0。 */
    readonly frames: number;
    /** 延迟帧数；未启用时为 0。 */
    readonly delay: number;
    /** 最近一次成功读回的 GPU 帧耗时（毫秒）；还没有样本时为 null。 */
    readonly gpuFrameTimeMs: number | null;
    /** 已经拿到的样本数。 */
    readonly samples: number;
    /**
     * 「本该读回但没读」的帧数。两类原因都算：还没到 delay、在飞的读回已达上限、
     * 或者目标槽位正在被读（见文件头的按槽位记账）。GPU 越忙/读回越慢，这个数越大。
     */
    readonly skipped: number;
    /** 当前在飞的读回数量。测试与基准可以据此等样本落地。 */
    readonly inFlight: number;
    /** 最近一次失败的原因（打开失败或读回失败）；正常时为 null。 */
    readonly error: string | null;
}
export declare class GpuTiming {
    /** 每个环形槽占用几个 query 下标：WebGPU 需要「开始 + 结束」，WebGL2 只需要一个区间结果。 */
    readonly slotStride: number;
    readonly frames: number;
    readonly delay: number;
    readonly backend: BackendKind;
    private readonly device;
    private readonly querySet;
    private frameIndex;
    /** 每个环形位置最近一次真正写入的槽位；null 表示那一帧没有写（见 {@link selectSlot}）。 */
    private readonly recentSlots;
    /** 正在被读回的槽位：既不重写，也不重复读。 */
    private readonly busySlots;
    /** 本帧选定的槽位；{@link slotChosen} 区分「还没选」与「选了但没有空槽」。 */
    private frameSlot;
    private slotChosen;
    private inFlight;
    private lastMs;
    private sampleCount;
    private skippedCount;
    private lastError;
    private _disposed;
    /**
     * 该设备是否具备 GPU 计时能力。
     *
     * WebGL2 后端把「拿到 `EXT_disjoint_timer_query_webgl2`」映射成同名 feature（见
     * `glCapabilities.queryGlFeatures`），所以两个后端可以同一句话判断。
     * WebGPU 上它只表示 adapter 支持 —— 设备是否真的启用了该 feature 由 `createQuerySet()` 决定，
     * 那正是 {@link GpuTiming} 构造函数会立刻失败并给出精确原因的地方。
     */
    static isAvailable(device: Device): boolean;
    constructor(device: Device, options?: GpuTimingOptions);
    get disposed(): boolean;
    get stats(): GpuTimingStats;
    /**
     * 本帧开始时的钩子：WebGPU 在这里写「帧开始」时间戳。
     *
     * WebGL2 不用（它的计时由 pass 的 `timestampWrites` 包住整个通道）。
     * 本帧没有空闲槽位时是空操作 —— 那一帧就没有 GPU 样本，这是刻意的取舍：
     * 宁可少一个样本，也不要覆盖一个正在读的槽位而拿到错的数字。
     */
    beforeFrame(encoder: {
        writeTimestamp(querySet: QuerySet, queryIndex: number): void;
    }): void;
    /**
     * 本帧结束时的钩子：WebGPU 写「帧结束」时间戳。
     *
     * 必须在所有 pass 都 `end()` 之后、`finish()` 之前调用（WebGPU 规定 encoder 上写时间戳时
     * 不能有打开的 pass）。
     */
    afterFrameEncoding(encoder: {
        writeTimestamp(querySet: QuerySet, queryIndex: number): void;
    }): void;
    /**
     * 给本帧的 render pass 用的 `timestampWrites`；WebGPU 不需要（它用 encoder 级时间戳），
     * 因此返回 undefined。
     */
    passTimestampWrites(): PassTimestampWrites | undefined;
    /**
     * 帧提交之后调用：延迟 `delay` 帧读回一次（如果条件允许）。
     *
     * 注意调用时机必须在 `device.queue.submit()` 之后 —— 读回本身会再提交一个小 command buffer
     * （WebGPU）或轮询 GL 查询（WebGL2），队列顺序保证它看到的是已经写完的时间戳。
     */
    onFrameSubmitted(): void;
    destroy(): void;
    /**
     * 选定本帧要写的槽位：从环形位置开始往后找第一个空闲的；都忙则返回 null（本帧不写时间戳）。
     *
     * 同一帧里 `beforeFrame` / `afterFrameEncoding` / `passTimestampWrites` 可能各问一次，
     * 所以要记住本帧的选择，不能让它们算出不同的槽位。
     */
    private selectSlot;
}
/** 把任意错误整理成带 `[gpu-device-api] ` 前缀的一句话，供 Renderer 报告打开失败的原因。 */
export declare function describeGpuTimingFailure(error: unknown): string;
//# sourceMappingURL=GpuTiming.d.ts.map