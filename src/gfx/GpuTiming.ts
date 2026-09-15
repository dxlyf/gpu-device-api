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
import { timestampDeltaToMilliseconds } from '../core/sync/QueryResult.js';
import type { Device } from '../core/Device.js';
import type { BackendKind } from '../core/Adapter.js';
import type { PassTimestampWrites, QuerySet } from '../core/resources/QuerySet.js';

/** GPU 计时需要的 feature 名（WebGPU 的 device feature；WebGL2 侧由扩展探测成同名 feature）。 */
export const GPU_TIMING_FEATURE = 'timestamp-query';

/** 环形 query set 的默认槽数。 */
export const DEFAULT_GPU_TIMING_FRAMES = 32;
/** 默认延迟多少帧读回（见文件头「为什么不能每帧阻塞读回」）。 */
export const DEFAULT_GPU_TIMING_DELAY = 8;
/** 同时在飞的读回上限：读回本身也有开销，不能让它把被测对象压垮。 */
export const MAX_READBACKS_IN_FLIGHT = 4;

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

export class GpuTiming {
  /** 每个环形槽占用几个 query 下标：WebGPU 需要「开始 + 结束」，WebGL2 只需要一个区间结果。 */
  readonly slotStride: number;
  readonly frames: number;
  readonly delay: number;
  readonly backend: BackendKind;

  private readonly device: Device;
  private readonly querySet: QuerySet;
  private frameIndex = 0;
  /** 每个环形位置最近一次真正写入的槽位；null 表示那一帧没有写（见 {@link selectSlot}）。 */
  private readonly recentSlots: (number | null)[];
  /** 正在被读回的槽位：既不重写，也不重复读。 */
  private readonly busySlots = new Set<number>();
  /** 本帧选定的槽位；{@link slotChosen} 区分「还没选」与「选了但没有空槽」。 */
  private frameSlot: number | null = null;
  private slotChosen = false;
  private inFlight = 0;
  private lastMs: number | null = null;
  private sampleCount = 0;
  private skippedCount = 0;
  private lastError: string | null = null;
  private _disposed = false;

  /**
   * 该设备是否具备 GPU 计时能力。
   *
   * WebGL2 后端把「拿到 `EXT_disjoint_timer_query_webgl2`」映射成同名 feature（见
   * `glCapabilities.queryGlFeatures`），所以两个后端可以同一句话判断。
   * WebGPU 上它只表示 adapter 支持 —— 设备是否真的启用了该 feature 由 `createQuerySet()` 决定，
   * 那正是 {@link GpuTiming} 构造函数会立刻失败并给出精确原因的地方。
   */
  static isAvailable(device: Device): boolean {
    return device.features.has(GPU_TIMING_FEATURE);
  }

  constructor(device: Device, options: GpuTimingOptions = {}) {
    this.device = device;
    this.backend = device.backend;
    this.frames = clampInt(options.frames ?? DEFAULT_GPU_TIMING_FRAMES, DEFAULT_GPU_TIMING_FRAMES, 4, 256);
    this.delay = clampInt(options.delay ?? DEFAULT_GPU_TIMING_DELAY, DEFAULT_GPU_TIMING_DELAY, 1, this.frames - 1);
    this.slotStride = device.backend === 'webgl2' ? 1 : 2;
    this.recentSlots = new Array<number | null>(this.frames).fill(null);

    // 能力不足时这里就会抛错（WebGPU：feature 没启用；WebGL2：缺时间查询扩展），
    // 错误消息来自各自后端、带 [gpu-device-api] 前缀并说明缺什么。
    this.querySet = device.createQuerySet({
      label: 'gfx-gpu-timing',
      type: QueryType.Timestamp,
      count: this.frames * this.slotStride,
    });
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get stats(): GpuTimingStats {
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
  beforeFrame(encoder: { writeTimestamp(querySet: QuerySet, queryIndex: number): void }): void {
    if (this.slotStride < 2) return;
    const slot = this.selectSlot();
    if (slot === null) return;
    encoder.writeTimestamp(this.querySet, slot * this.slotStride);
  }

  /**
   * 本帧结束时的钩子：WebGPU 写「帧结束」时间戳。
   *
   * 必须在所有 pass 都 `end()` 之后、`finish()` 之前调用（WebGPU 规定 encoder 上写时间戳时
   * 不能有打开的 pass）。
   */
  afterFrameEncoding(encoder: { writeTimestamp(querySet: QuerySet, queryIndex: number): void }): void {
    if (this.slotStride < 2) return;
    const slot = this.selectSlot();
    if (slot === null) return;
    encoder.writeTimestamp(this.querySet, slot * this.slotStride + 1);
  }

  /**
   * 给本帧的 render pass 用的 `timestampWrites`；WebGPU 不需要（它用 encoder 级时间戳），
   * 因此返回 undefined。
   */
  passTimestampWrites(): PassTimestampWrites | undefined {
    if (this.slotStride !== 1) return undefined;
    const slot = this.selectSlot();
    if (slot === null) return undefined;
    return { querySet: this.querySet, beginningOfPassWriteIndex: slot * this.slotStride };
  }

  /**
   * 帧提交之后调用：延迟 `delay` 帧读回一次（如果条件允许）。
   *
   * 注意调用时机必须在 `device.queue.submit()` 之后 —— 读回本身会再提交一个小 command buffer
   * （WebGPU）或轮询 GL 查询（WebGL2），队列顺序保证它看到的是已经写完的时间戳。
   */
  onFrameSubmitted(): void {
    if (this._disposed) return;
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
      .catch((error: unknown) => {
        // 读回失败（disjoint、超时……）不抛给帧循环：把原因记下来，调用方读 stats.error。
        this.lastError = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        this.busySlots.delete(slot);
        this.inFlight -= 1;
      });
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.querySet.destroy();
  }

  /**
   * 选定本帧要写的槽位：从环形位置开始往后找第一个空闲的；都忙则返回 null（本帧不写时间戳）。
   *
   * 同一帧里 `beforeFrame` / `afterFrameEncoding` / `passTimestampWrites` 可能各问一次，
   * 所以要记住本帧的选择，不能让它们算出不同的槽位。
   */
  private selectSlot(): number | null {
    if (this.slotChosen) return this.frameSlot;
    this.slotChosen = true;
    this.frameSlot = null;
    for (let offset = 0; offset < this.frames; offset++) {
      const slot = (this.frameIndex + offset) % this.frames;
      if (this.busySlots.has(slot)) continue;
      this.frameSlot = slot;
      break;
    }
    return this.frameSlot;
  }
}

function clampInt(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.trunc(value), max));
}

/** 把任意错误整理成带 `[gpu-device-api] ` 前缀的一句话，供 Renderer 报告打开失败的原因。 */
export function describeGpuTimingFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith('[gpu-device-api]') ? message : `[gpu-device-api] ${message}`;
}
