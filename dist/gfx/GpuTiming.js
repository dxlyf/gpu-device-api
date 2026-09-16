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
import { QueryType } from '../core/resources/QuerySet.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { timestampDeltaToMilliseconds } from '../core/sync/QueryResult.js';
/** GPU 计时需要的 feature 名（WebGPU 的 device feature；WebGL2 侧由扩展探测成同名 feature）。 */
export const GPU_TIMING_FEATURE = 'timestamp-query';
/**
 * 这台设备上 gfx 帧计时该走哪条路；`'none'` 表示做不到。
 *
 * ## 为什么不能只看 `features.has('timestamp-query')`
 *
 * feature 名只说明「这个后端声称支持时间戳查询」，**不保证调用面真的存在**。实测的 Chrome 就是
 * 反例：设备启用了 `timestamp-query`（`device.createQuerySet()` 正常返回），但原生
 * `GPUCommandEncoder` 上没有 `writeTimestamp` 方法。只看 feature 会把这种设备判成「可用」，
 * 于是计时被打开，直到**真正写时间戳的那一刻**才抛错 —— 而那一刻在帧循环里，一个**可选**的
 * 性能分析能力把整页渲染（`examples/gfx-benchmark.html`）搞成了 fail。
 *
 * 所以这里读后端探测出来的**真实 API 表面**（{@link Device.timing}）：方法在不在、扩展拿没拿到。
 * 后端没上报（第三方 `Device` 实现、测试桩）一律按「不可用」处理 —— 拿不准就别开，
 * 这正是本次修复的原则。
 */
export function gpuTimingPath(device) {
    const support = device.timing;
    if (!support)
        return 'none';
    // WebGL2 没有 encoder 级时间戳，只有 pass 级区间计时；WebGPU 反之（用 encoder 级，
    // 因为 pass 内的 timestampWrites 还要 `timestamp-query-inside-passes`，Chrome 默认不开）。
    if (device.backend === 'webgl2')
        return support.passTimestamps ? 'pass' : 'none';
    return support.encoderTimestamps ? 'encoder' : 'none';
}
/** 环形 query set 的默认槽数。 */
export const DEFAULT_GPU_TIMING_FRAMES = 32;
/** 默认延迟多少帧读回（见文件头「为什么不能每帧阻塞读回」）。 */
export const DEFAULT_GPU_TIMING_DELAY = 8;
/** 同时在飞的读回上限：读回本身也有开销，不能让它把被测对象压垮。 */
export const MAX_READBACKS_IN_FLIGHT = 4;
export class GpuTiming {
    /** 每个环形槽占用几个 query 下标：WebGPU 需要「开始 + 结束」，WebGL2 只需要一个区间结果。 */
    slotStride;
    /** 本设备实际走的写入路径（见 {@link gpuTimingPath}）。构造成功后不可能是 `'none'`。 */
    path;
    frames;
    delay;
    backend;
    device;
    querySet;
    frameIndex = 0;
    /** 每个环形位置最近一次真正写入的槽位；null 表示那一帧没有写（见 {@link selectSlot}）。 */
    recentSlots;
    /** 正在被读回的槽位：既不重写，也不重复读。 */
    busySlots = new Set();
    /** 本帧选定的槽位；{@link slotChosen} 区分「还没选」与「选了但没有空槽」。 */
    frameSlot = null;
    slotChosen = false;
    inFlight = 0;
    lastMs = null;
    sampleCount = 0;
    skippedCount = 0;
    lastError = null;
    _disposed = false;
    /**
     * 该设备是否具备 GPU 计时能力。
     *
     * 读的是后端在创建设备时对**真实 API 表面**的探测结果（`Device.timing`），不是
     * `features.has('timestamp-query')` —— 两者的差别以及为什么必须这样，见 {@link gpuTimingPath}。
     */
    static isAvailable(device) {
        return gpuTimingPath(device) !== 'none';
    }
    constructor(device, options = {}) {
        this.device = device;
        this.backend = device.backend;
        this.frames = clampInt(options.frames ?? DEFAULT_GPU_TIMING_FRAMES, DEFAULT_GPU_TIMING_FRAMES, 4, 256);
        this.delay = clampInt(options.delay ?? DEFAULT_GPU_TIMING_DELAY, DEFAULT_GPU_TIMING_DELAY, 1, this.frames - 1);
        this.recentSlots = new Array(this.frames).fill(null);
        /*
         * 能力不足时**在这里**就失败，而不是等到记时间戳的时候。
         *
         * 这是本文件最要紧的一条：显式调用 `Renderer.enableGpuTiming()` 的语义是「要不到就抛」，
         * 所以抛出点必须落在启用处（调用方一眼能看到原因）；而隐式路径
         *（`Renderer.create({ gpuTiming: true })`）会把这里的异常降级成 `enabled: false` + `error`。
         * 反过来（先放过去、第一次写时间戳才炸）会让异常逃进帧循环 —— 那正是实测事故的形态。
         */
        const path = gpuTimingPath(device);
        if (path === 'none') {
            throw new ValidationError(describeGpuTimingUnavailable(device));
        }
        this.path = path;
        this.slotStride = path === 'pass' ? 1 : 2;
        // 能力探测通过之后仍要走这道创建：它是「feature 真的在本设备上启用了 / 扩展真的还在」的最后校验，
        // 错误消息来自各自后端、带 [gpu-device-api] 前缀并说明缺什么。
        this.querySet = device.createQuerySet({
            label: 'gfx-gpu-timing',
            type: QueryType.Timestamp,
            count: this.frames * this.slotStride,
        });
    }
    get disposed() {
        return this._disposed;
    }
    get stats() {
        return {
            enabled: !this._disposed,
            available: GpuTiming.isAvailable(this.device),
            frames: this.frames,
            delay: this.delay,
            gpuFrameTimeMs: this.lastMs,
            samples: this.sampleCount,
            skipped: this.skippedCount,
            inFlight: this.inFlight,
            error: this.lastError,
        };
    }
    /**
     * 本帧开始时的钩子：WebGPU 在这里写「帧开始」时间戳。
     *
     * WebGL2 不用（它的计时由 pass 的 `timestampWrites` 包住整个通道）。
     * 本帧没有空闲槽位时是空操作 —— 那一帧就没有 GPU 样本，这是刻意的取舍：
     * 宁可少一个样本，也不要覆盖一个正在读的槽位而拿到错的数字。
     */
    beforeFrame(encoder) {
        if (this.path !== 'encoder')
            return;
        const slot = this.selectSlot();
        if (slot === null)
            return;
        encoder.writeTimestamp(this.querySet, slot * this.slotStride);
    }
    /**
     * 本帧结束时的钩子：WebGPU 写「帧结束」时间戳。
     *
     * 必须在所有 pass 都 `end()` 之后、`finish()` 之前调用（WebGPU 规定 encoder 上写时间戳时
     * 不能有打开的 pass）。
     */
    afterFrameEncoding(encoder) {
        if (this.path !== 'encoder')
            return;
        const slot = this.selectSlot();
        if (slot === null)
            return;
        encoder.writeTimestamp(this.querySet, slot * this.slotStride + 1);
    }
    /**
     * 给本帧的 render pass 用的 `timestampWrites`；WebGPU 不需要（它用 encoder 级时间戳），
     * 因此返回 undefined。
     */
    passTimestampWrites() {
        if (this.path !== 'pass')
            return undefined;
        const slot = this.selectSlot();
        if (slot === null)
            return undefined;
        return { querySet: this.querySet, beginningOfPassWriteIndex: slot * this.slotStride };
    }
    /**
     * 帧提交之后调用：延迟 `delay` 帧读回一次（如果条件允许）。
     *
     * 注意调用时机必须在 `device.queue.submit()` 之后 —— 读回本身会再提交一个小 command buffer
     * （WebGPU）或轮询 GL 查询（WebGL2），队列顺序保证它看到的是已经写完的时间戳。
     */
    onFrameSubmitted() {
        if (this._disposed)
            return;
        const frame = this.frameIndex;
        this.recentSlots[frame % this.frames] = this.slotChosen ? this.frameSlot : null;
        this.frameIndex += 1;
        this.frameSlot = null;
        this.slotChosen = false;
        const target = frame - this.delay;
        if (target < 0) {
            this.skippedCount += 1;
            return;
        }
        if (this.inFlight >= MAX_READBACKS_IN_FLIGHT) {
            this.skippedCount += 1;
            return;
        }
        const slot = this.recentSlots[target % this.frames];
        if (slot === null || slot === undefined) {
            // 那一帧本来就没写（当时没有空闲槽位）。
            this.skippedCount += 1;
            return;
        }
        if (this.busySlots.has(slot)) {
            this.skippedCount += 1;
            return;
        }
        const firstQuery = slot * this.slotStride;
        const result = this.device.readQuerySet(this.querySet, {
            label: `gfx-gpu-timing:frame${target}`,
            firstQuery,
            queryCount: this.slotStride,
        });
        const period = result.timestampPeriod;
        this.busySlots.add(slot);
        this.inFlight += 1;
        result
            .read()
            .then((values) => {
            const begin = values[0] ?? 0n;
            // WebGPU 写的是两个时刻，差值才是耗时；WebGL2 写的那一个值本身就是耗时（纳秒），
            // 等价于「从 0 开始的一段刻度」，所以两条路径可以走同一个换算函数。
            const end = this.slotStride === 2 ? (values[1] ?? begin) : begin;
            const from = this.slotStride === 2 ? begin : 0n;
            this.lastMs = timestampDeltaToMilliseconds(from, end, period);
            this.sampleCount += 1;
        })
            .catch((error) => {
            // 读回失败（disjoint、超时……）不抛给帧循环：把原因记下来，调用方读 stats.error。
            this.lastError = error instanceof Error ? error.message : String(error);
        })
            .finally(() => {
            this.busySlots.delete(slot);
            this.inFlight -= 1;
        });
    }
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        this.querySet.destroy();
    }
    /**
     * 选定本帧要写的槽位：从环形位置开始往后找第一个空闲的；都忙则返回 null（本帧不写时间戳）。
     *
     * 同一帧里 `beforeFrame` / `afterFrameEncoding` / `passTimestampWrites` 可能各问一次，
     * 所以要记住本帧的选择，不能让它们算出不同的槽位。
     */
    selectSlot() {
        if (this.slotChosen)
            return this.frameSlot;
        this.slotChosen = true;
        this.frameSlot = null;
        for (let offset = 0; offset < this.frames; offset++) {
            const slot = (this.frameIndex + offset) % this.frames;
            if (this.busySlots.has(slot))
                continue;
            this.frameSlot = slot;
            break;
        }
        return this.frameSlot;
    }
}
function clampInt(value, fallback, min, max) {
    if (!Number.isFinite(value))
        return fallback;
    return Math.max(min, Math.min(Math.trunc(value), max));
}
/**
 * 「这台设备为什么做不了 GPU 计时」的一句话（英文，带 `[gpu-device-api] ` 前缀）。
 *
 * 优先用后端上报的原因（缺哪个 feature、缺哪个方法、缺哪个扩展只有后端知道），
 * 后端没有上报能力时如实说「问不出来」—— 不假装它可用，也不编造具体缺什么。
 */
export function describeGpuTimingUnavailable(device) {
    const reported = device.timing?.unavailableReason;
    if (reported)
        return reported;
    return ('[gpu-device-api] gfx GPU timing: this device does not report a usable GPU timing path ' +
        '("encoder" via CommandEncoder.writeTimestamp(), or "pass" via pass timestamp writes), so timing ' +
        "cannot be enabled. Read GPU time from the backend's own profiler instead.");
}
/** 把任意错误整理成带 `[gpu-device-api] ` 前缀的一句话，供 Renderer 报告打开失败的原因。 */
export function describeGpuTimingFailure(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith('[gpu-device-api]') ? message : `[gpu-device-api] ${message}`;
}
//# sourceMappingURL=GpuTiming.js.map