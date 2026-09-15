/**
 * GPU 计时 / 查询体系的 node 侧单测（不需要浏览器）。
 *
 * 覆盖四类东西：
 *
 * 1. **单位换算**：`timestampDeltaToMilliseconds` 必须把「刻度」乘上 `timestampPeriod`（纳秒/刻度）
 *    再除 1e6 —— 这是最容易搞错、也最难在浏览器里察觉的一步（错了只会得到一个系统性偏差的数字）；
 * 2. **拿不到 GPU 计时时的降级/报错行为**：WebGL2 缺 `EXT_disjoint_timer_query_webgl2`、
 *    WebGPU 设备没启用 `timestamp-query`、query set 下标越界等，都必须是带
 *    `[gpu-device-api] ` 前缀的英文错误，而不是静默返回 0；
 * 3. **WebGPU 的读回链路**（用 mock 原生 `GPUDevice`）：`resolveQuerySet → copyBufferToBuffer →
 *    mapAsync` 的参数是否正确、中转 buffer 有没有被释放、结果值能否拿到；
 * 4. **gfx 的环形 + 延迟读回**：槽位轮转、同一时刻只有一个读回在飞、两个后端各自的取值方式。
 */

import { describe, expect, it } from 'vitest';

import { QueryType } from '../src/core/resources/QuerySet.js';
import { assertPassTimestampWrites } from '../src/core/resources/QuerySet.js';
import { timestampDeltaToMilliseconds } from '../src/core/sync/QueryResult.js';
import { GpuError } from '../src/core/errors/GpuError.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { toGPUTimestampWrites } from '../src/webgpu/resources/WebGPUQuerySet.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import {
  TIMER_QUERY_EXTENSION,
  WebGL2QuerySet,
} from '../src/webgl2/resources/WebGL2QuerySet.js';
import { WebGL2QueryResult } from '../src/webgl2/sync/WebGL2QueryResult.js';
import { GpuTiming } from '../src/gfx/GpuTiming.js';
import type { Device } from '../src/core/Device.js';
import type { QuerySet, QuerySetDescriptor } from '../src/core/resources/QuerySet.js';
import type { QueryResult, QuerySetReadOptions } from '../src/core/sync/QueryResult.js';

/* ------------------------------------------------------------------------------------------------ */
/* 单位换算                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

describe('timestamp 刻度 → 毫秒的换算', () => {
  it('按 timestampPeriod（纳秒/刻度）换算，而不是把刻度当纳秒', () => {
    // period = 1：刻度就是纳秒，1e6 刻度 = 1 ms。
    expect(timestampDeltaToMilliseconds(0n, 1_000_000n, 1)).toBeCloseTo(1, 6);
    // period = 2：同样的刻度数表示两倍的时间。
    expect(timestampDeltaToMilliseconds(0n, 1_000_000n, 2)).toBeCloseTo(2, 6);
    // 某些移动 GPU 的 period 是 83.33 之类的小数：不乘就会把时间算小数百倍。
    expect(timestampDeltaToMilliseconds(0n, 1000n, 83.33)).toBeCloseTo((1000 * 83.33) / 1e6, 9);
  });

  it('先做 BigInt 减法再转 Number（大刻度值不丢精度）', () => {
    // 两个 2^53 量级的刻度值相减：如果先转 Number 再减，差值会被舍入成 0。
    const begin = 9_007_199_254_740_993n;
    const end = 9_007_199_254_740_993n + 1_000_000n;
    expect(timestampDeltaToMilliseconds(begin, end, 1)).toBeCloseTo(1, 6);
  });

  it('end 不大于 begin 时返回 0（乱序/未写入的槽位不会算成负数）', () => {
    expect(timestampDeltaToMilliseconds(5n, 5n, 1)).toBe(0);
    expect(timestampDeltaToMilliseconds(10n, 1n, 1)).toBe(0);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* timestampWrites 的跨后端校验                                                                        */
/* ------------------------------------------------------------------------------------------------ */

function fakeQuerySet(type: string, count: number): QuerySet {
  return {
    label: 'fake-query-set',
    type,
    count,
    native: null,
    disposed: false,
    destroy: () => {},
    dispose: () => {},
  } as unknown as QuerySet;
}

describe('timestampWrites 的校验（两个后端共用）', () => {
  it('query set 必须是 timestamp 类型', () => {
    expect(() =>
      assertPassTimestampWrites(
        { querySet: fakeQuerySet(QueryType.Occlusion, 4), beginningOfPassWriteIndex: 0 },
        'pass.timestampWrites',
      ),
    ).toThrow(/must be a "timestamp" query set/);
  });

  it('下标必须落在 query set 范围内', () => {
    expect(() =>
      assertPassTimestampWrites(
        { querySet: fakeQuerySet(QueryType.Timestamp, 4), endOfPassWriteIndex: 4 },
        'pass.timestampWrites',
      ),
    ).toThrow(/outside the query set's range \[0, 4\)/);
  });

  it('两端不能是同一个下标，也不能两端都不给', () => {
    expect(() =>
      assertPassTimestampWrites(
        { querySet: fakeQuerySet(QueryType.Timestamp, 4), beginningOfPassWriteIndex: 1, endOfPassWriteIndex: 1 },
        'pass.timestampWrites',
      ),
    ).toThrow(/must differ/);
    expect(() =>
      assertPassTimestampWrites({ querySet: fakeQuerySet(QueryType.Timestamp, 4) }, 'pass.timestampWrites'),
    ).toThrow(/at least one of/);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGPU 侧的 feature 报错与读回链路                                                                   */
/* ------------------------------------------------------------------------------------------------ */

interface MockWebGPU {
  device: WebGPUDevice;
  calls: {
    resolve: unknown[][];
    copies: unknown[][];
    submits: number;
    destroyed: string[];
  };
  values: bigint[];
}

/** 造一个 mock 原生 `GPUDevice`，足以跑通 query set 的创建与读回。 */
function createMockWebGPUDevice(options: {
  enabledFeatures?: readonly string[];
  adapterFeatures?: readonly string[];
  timestampPeriod?: number;
  values?: bigint[];
} = {}): MockWebGPU {
  const enabled = options.enabledFeatures ?? [];
  const calls: MockWebGPU['calls'] = { resolve: [], copies: [], submits: 0, destroyed: [] };
  const values = options.values ?? [1_000_000n, 2_000_000n];
  let bufferId = 0;

  const native = {
    label: 'mock-device',
    queue: {
      submit: () => {
        calls.submits += 1;
      },
      getTimestampPeriod: () => options.timestampPeriod,
    },
    lost: new Promise(() => {}),
    limits: undefined,
    // GPUDevice.features 只列出**已启用**的 feature；这里用它来区分「adapter 支持」与「已启用」。
    features: new Set(enabled),
    onuncapturederror: null,
    createBuffer: (descriptor: { label?: string; size: number }) => {
      const label = descriptor.label ?? `native-buffer#${(bufferId += 1)}`;
      return {
        label,
        size: descriptor.size,
        mapAsync: async () => {},
        getMappedRange: () => new BigUint64Array(values).buffer,
        unmap: () => {},
        destroy: () => calls.destroyed.push(label),
      };
    },
    createCommandEncoder: () => ({
      label: 'mock-encoder',
      resolveQuerySet: (...args: unknown[]) => calls.resolve.push(args),
      copyBufferToBuffer: (...args: unknown[]) => calls.copies.push(args),
      finish: () => ({ label: 'mock-command-buffer' }),
    }),
    createQuerySet: (descriptor: { label?: string; type: string; count: number }) => ({
      label: descriptor.label,
      type: descriptor.type,
      count: descriptor.count,
      destroy: () => {},
    }),
    destroy: () => {},
  } as unknown as GPUDevice;

  const device = new WebGPUDevice(native, {
    descriptor: { label: 'mock-device', defaultSampleCount: 1, requiredFeatures: [...enabled] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    adapterFeatures: new Set(options.adapterFeatures ?? enabled),
  });

  return { device, calls, values };
}

describe('WebGPU：拿不到 GPU 计时时的报错行为', () => {
  it('设备没启用 timestamp-query 时，创建 timestamp query set 明确报错（不静默返回 0）', () => {
    // adapter 支持，但 requiredFeatures 里没写 → 设备上并没有这个能力。
    const { device } = createMockWebGPUDevice({
      enabledFeatures: [],
      adapterFeatures: ['timestamp-query'],
    });
    expect(device.features.has('timestamp-query')).toBe(true);
    expect(device.hasEnabledFeature('timestamp-query')).toBe(false);
    expect(() => device.createQuerySet({ type: QueryType.Timestamp, count: 2 })).toThrow(
      /\[gpu-device-api\] QuerySet .*timestamp queries need the "timestamp-query" device feature/,
    );
    device.dispose();
  });

  it('pass 内写时间戳缺少 timestamp-query-inside-passes 时报错，并指出替代方案', () => {
    const { device } = createMockWebGPUDevice({ enabledFeatures: ['timestamp-query'] });
    const querySet = device.createQuerySet({ type: QueryType.Timestamp, count: 2 });
    let message = '';
    try {
      toGPUTimestampWrites(
        { querySet, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 },
        device,
        'pass.timestampWrites',
      );
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/timestamp-query-inside-passes/);
    expect(message).toMatch(/writeTimestamp/);
    device.dispose();
  });

  it('启用后下标越界仍然报错（错误来自 core 的通用校验）', () => {
    const { device, calls } = createMockWebGPUDevice({
      enabledFeatures: ['timestamp-query', 'timestamp-query-inside-passes'],
    });
    const querySet = device.createQuerySet({ type: QueryType.Timestamp, count: 2 });
    expect(() => device.readQuerySet(querySet, { firstQuery: 1, queryCount: 2 })).toThrow(
      /exceeds the query set/,
    );
    expect(calls.resolve).toHaveLength(0);
    device.dispose();
  });
});

describe('WebGPU：resolveQuerySet → copyBufferToBuffer → mapAsync 的读回链路', () => {
  it('解析指定范围、拷到 MAP_READ buffer 后读回原始值', async () => {
    const { device, calls, values } = createMockWebGPUDevice({
      enabledFeatures: ['timestamp-query'],
      timestampPeriod: 2,
      values: [1_000_000n, 2_000_000n],
    });
    const querySet = device.createQuerySet({ type: QueryType.Timestamp, count: 4 });

    const result = device.readQuerySet(querySet, { firstQuery: 2, queryCount: 2 });
    expect(result.type).toBe(QueryType.Timestamp);
    expect(result.count).toBe(2);
    // timestampPeriod 来自 queue.getTimestampPeriod()：读回方据此换算，绝不是「刻度=纳秒」的假设。
    expect(result.timestampPeriod).toBe(2);

    // 一次 resolve（firstQuery=2, queryCount=2, 目标偏移 0）+ 一次拷贝（8 字节 × 2 = 16 字节）。
    // 参数顺序：resolveQuerySet(querySet, firstQuery, queryCount, destination, destinationOffset)。
    expect(calls.resolve).toHaveLength(1);
    expect(calls.resolve[0]![1]).toBe(2);
    expect(calls.resolve[0]![2]).toBe(2);
    expect(calls.resolve[0]![4]).toBe(0);
    expect(calls.copies).toHaveLength(1);
    // copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size)
    expect(calls.copies[0]![1]).toBe(0);
    expect(calls.copies[0]![3]).toBe(0);
    expect(calls.copies[0]![4]).toBe(16);
    expect(calls.submits).toBe(1);

    expect([...(await result.read())]).toEqual(values);
    // 读完之后两个中转 buffer 都要被释放（否则每帧读回都会泄漏）。
    expect(calls.destroyed).toHaveLength(2);
    expect(calls.destroyed.some((label) => label.includes('#resolve'))).toBe(true);
    expect(calls.destroyed.some((label) => label.includes('#readback'))).toBe(true);
    device.dispose();
  });

  it('结果只能读一次（mapAsync 只会给一次映射）', async () => {
    const { device } = createMockWebGPUDevice({ enabledFeatures: ['timestamp-query'] });
    const querySet = device.createQuerySet({ type: QueryType.Timestamp, count: 2 });
    const result = device.readQuerySet(querySet);
    await result.read();
    await expect(result.read()).rejects.toThrow(/already been read/);
    device.dispose();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGL2 侧：扩展探测、轮询读回、disjoint                                                                 */
/* ------------------------------------------------------------------------------------------------ */

interface FakeGl {
  gl: WebGL2RenderingContext;
  created: WebGLQuery[];
  deleted: WebGLQuery[];
  /** 每条 query 是否已经可用（测试里可以手工置位）。 */
  available: Map<WebGLQuery, boolean>;
  results: Map<WebGLQuery, number>;
  disjoint: boolean;
  setAvailable(query: WebGLQuery, value: boolean): void;
}

const GL_QUERY_RESULT = 0x8866;
const GL_QUERY_RESULT_AVAILABLE = 0x8867;
const GL_TIME_ELAPSED_EXT = 0x88bf;
const GL_GPU_DISJOINT_EXT = 0x8fbb;
const GL_ANY_SAMPLES_PASSED = 0x8c2f;

/** 造一个只实现查询相关入口的假 GL（`withExtension: false` 模拟缺扩展）。 */
function createFakeGl(withExtension: boolean): FakeGl {
  const created: WebGLQuery[] = [];
  const deleted: WebGLQuery[] = [];
  const available = new Map<WebGLQuery, boolean>();
  const results = new Map<WebGLQuery, number>();
  let nextId = 0;
  const state: FakeGl = {
    created,
    deleted,
    available,
    results,
    disjoint: false,
    gl: null as unknown as WebGL2RenderingContext,
    setAvailable(query, value) {
      available.set(query, value);
    },
  };

  const gl = {
    QUERY_RESULT: GL_QUERY_RESULT,
    QUERY_RESULT_AVAILABLE: GL_QUERY_RESULT_AVAILABLE,
    ANY_SAMPLES_PASSED: GL_ANY_SAMPLES_PASSED,
    getExtension: (name: string) =>
      withExtension && name === TIMER_QUERY_EXTENSION
        ? { TIME_ELAPSED_EXT: GL_TIME_ELAPSED_EXT, GPU_DISJOINT_EXT: GL_GPU_DISJOINT_EXT }
        : null,
    createQuery: () => {
      const query = { id: (nextId += 1) } as unknown as WebGLQuery;
      created.push(query);
      available.set(query, false);
      results.set(query, 0);
      return query;
    },
    deleteQuery: (query: WebGLQuery) => {
      deleted.push(query);
    },
    getQueryParameter: (query: WebGLQuery, name: number) => {
      if (name === GL_QUERY_RESULT_AVAILABLE) return available.get(query) === true;
      if (name === GL_QUERY_RESULT) return results.get(query) ?? 0;
      return null;
    },
    getParameter: (name: number) => (name === GL_GPU_DISJOINT_EXT ? state.disjoint : null),
  } as unknown as WebGL2RenderingContext;

  state.gl = gl;
  return state;
}

describe('WebGL2：缺扩展时的明确报错', () => {
  it('没有 EXT_disjoint_timer_query_webgl2 时，timestamp query set 抛错并说明缺哪个扩展', () => {
    const fake = createFakeGl(false);
    expect(() => new WebGL2QuerySet(fake.gl, { type: QueryType.Timestamp, count: 2 })).toThrow(
      new RegExp(`\\[gpu-device-api\\] QuerySet .*"${TIMER_QUERY_EXTENSION}"`),
    );
  });

  it('遮挡查询不需要扩展（ANY_SAMPLES_PASSED 是 WebGL2 核心功能）', () => {
    const fake = createFakeGl(false);
    const set = new WebGL2QuerySet(fake.gl, { type: QueryType.Occlusion, count: 2 });
    expect(set.count).toBe(2);
    expect(set.timerExtension).toBeNull();
    expect(fake.created).toHaveLength(2);
    set.destroy();
    expect(fake.deleted).toHaveLength(2);
  });

  it('gfx 的 GpuTiming 会把后端错误原样抛给调用方（这就是「拿不到就报错」的那条路径）', () => {
    const fake = createFakeGl(false);
    const device = {
      backend: 'webgl2',
      // WebGL2 后端在缺扩展时不会把 'timestamp-query' 放进 features 里。
      features: { has: () => false, names: [] },
      createQuerySet: (descriptor: QuerySetDescriptor) => new WebGL2QuerySet(fake.gl, descriptor),
    } as unknown as Device;

    expect(GpuTiming.isAvailable(device)).toBe(false);
    expect(() => new GpuTiming(device)).toThrow(/\[gpu-device-api\] QuerySet .*EXT_disjoint_timer_query_webgl2/);
  });
});

describe('WebGL2：异步轮询读回', () => {
  it('QUERY_RESULT_AVAILABLE 先 false 后 true：轮询到可用后返回原始值', async () => {
    const fake = createFakeGl(true);
    const set = new WebGL2QuerySet(fake.gl, { type: QueryType.Occlusion, count: 2 });
    fake.setAvailable(set.native[0]!, true);
    fake.results.set(set.native[0]!, 42);
    fake.setAvailable(set.native[1]!, true);
    fake.results.set(set.native[1]!, 7);

    let yields = 0;
    const result = new WebGL2QueryResult({
      gl: fake.gl,
      querySet: set,
      type: QueryType.Occlusion,
      first: 0,
      count: 2,
      // 让出的动作记一次数，顺便避免真的等 0ms 定时器。
      yieldToEventLoop: async () => {
        yields += 1;
      },
    });
    expect([...(await result.read())]).toEqual([42n, 7n]);
    expect(yields).toBe(0);
  });

  it('一直不可用时按超时报错，而不是返回 0', async () => {
    const fake = createFakeGl(true);
    const set = new WebGL2QuerySet(fake.gl, { type: QueryType.Timestamp, count: 1 });
    // timeoutMs = 0：第一次询问不可用就立刻判定超时（不必动全局的 Date.now）。
    const result = new WebGL2QueryResult({
      gl: fake.gl,
      querySet: set,
      type: QueryType.Timestamp,
      first: 0,
      count: 1,
      timeoutMs: 0,
      yieldToEventLoop: async () => {},
    });
    await expect(result.read()).rejects.toThrow(/still not available|asynchronous/);
  });

  it('disjoint 时结果无效：直接抛错而不是给出偏小的时间', async () => {
    const fake = createFakeGl(true);
    const set = new WebGL2QuerySet(fake.gl, { type: QueryType.Timestamp, count: 1 });
    fake.setAvailable(set.native[0]!, true);
    fake.results.set(set.native[0]!, 123);
    fake.disjoint = true;

    const result = new WebGL2QueryResult({
      gl: fake.gl,
      querySet: set,
      type: QueryType.Timestamp,
      first: 0,
      count: 1,
      yieldToEventLoop: async () => {},
    });
    await expect(result.read()).rejects.toThrow(GpuError);
    await expect(
      new WebGL2QueryResult({
        gl: fake.gl,
        querySet: set,
        type: QueryType.Timestamp,
        first: 0,
        count: 1,
        yieldToEventLoop: async () => {},
      }).read(),
    ).rejects.toThrow(/GPU_DISJOINT_EXT/);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* gfx 的环形 + 延迟读回                                                                               */
/* ------------------------------------------------------------------------------------------------ */

interface RecordingDevice {
  device: Device;
  /** 每次 readQuerySet 请求的范围。 */
  reads: { firstQuery: number; queryCount: number }[];
  /** 返回的原始值（按调用次序）。 */
  setValues(values: bigint[]): void;
  /** 只挡住**下一个** read()，返回放行函数。 */
  blockNextRead(): () => void;
  /** 挡住之后所有的 read()，返回放行函数。 */
  blockAllReads(): () => void;
}

function createRecordingDevice(backend: 'webgpu' | 'webgl2'): RecordingDevice {
  const reads: RecordingDevice['reads'] = [];
  let values: bigint[] = [1_000_000n, 2_000_000n];
  let blockNext = false;
  let blockAll = false;
  let gate: Promise<void> | null = null;
  let openGate: (() => void) | null = null;

  const arm = (): (() => void) => {
    if (!gate) {
      gate = new Promise<void>((resolve) => {
        openGate = resolve;
      });
    }
    return () => {
      blockNext = false;
      blockAll = false;
      openGate?.();
      gate = null;
      openGate = null;
    };
  };

  const device = {
    backend,
    features: { has: () => true, names: ['timestamp-query'] },
    createQuerySet: (descriptor: QuerySetDescriptor): QuerySet => ({
      label: descriptor.label ?? 'fake',
      type: descriptor.type,
      count: descriptor.count,
      native: null,
      disposed: false,
      destroy: () => {},
      dispose: () => {},
    }),
    readQuerySet: (_querySet: QuerySet, options: QuerySetReadOptions = {}): QueryResult => {
      reads.push({ firstQuery: options.firstQuery ?? 0, queryCount: options.queryCount ?? 1 });
      const payload = [...values];
      return {
        type: QueryType.Timestamp,
        count: options.queryCount ?? 1,
        timestampPeriod: 1,
        read: async () => {
          const wait = blockAll || blockNext ? gate : null;
          blockNext = false;
          if (wait) await wait;
          return new BigUint64Array(payload.slice(0, options.queryCount ?? 1));
        },
      };
    },
  } as unknown as Device;

  return {
    device,
    reads,
    setValues(next: bigint[]) {
      values = next;
    },
    blockNextRead() {
      blockNext = true;
      return arm();
    },
    blockAllReads() {
      blockAll = true;
      return arm();
    },
  };
}

/** 让 `.then/.finally` 链跑完。 */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('gfx GpuTiming：环形 query set + 延迟读回', () => {
  it('WebGPU：写两个时刻、延迟 delay 帧读回同一个槽位，按 period 换算成毫秒', async () => {
    const recorder = createRecordingDevice('webgpu');
    const timing = new GpuTiming(recorder.device, { frames: 4, delay: 1 });
    expect(timing.slotStride).toBe(2);
    // WebGPU 用 encoder 级时间戳，pass 上没有 timestampWrites。
    expect(timing.passTimestampWrites()).toBeUndefined();

    const writes: number[] = [];
    const encoder = { writeTimestamp: (_querySet: QuerySet, index: number) => writes.push(index) };

    const frame = () => {
      timing.beforeFrame(encoder);
      timing.afterFrameEncoding(encoder);
      timing.onFrameSubmitted();
    };

    frame();
    expect(writes).toEqual([0, 1]);
    // 第 0 帧提交后 target = 0 - 1 < 0，还没到能读的时候。
    expect(recorder.reads).toHaveLength(0);

    frame();
    expect(writes).toEqual([0, 1, 2, 3]);
    // 第 1 帧提交后读第 0 帧的槽位（firstQuery = 0，两条：开始 + 结束）。
    expect(recorder.reads).toEqual([{ firstQuery: 0, queryCount: 2 }]);

    await flush();
    // (2_000_000 - 1_000_000) 刻度 × 1 ns/刻度 = 1e6 ns = 1 ms
    expect(timing.stats.gpuFrameTimeMs).toBeCloseTo(1, 6);
    expect(timing.stats.samples).toBe(1);

    frame();
    await flush();
    expect(recorder.reads[1]).toEqual({ firstQuery: 2, queryCount: 2 });
    expect(timing.stats.samples).toBe(2);
  });

  it('没落地的读回：槽位不会被重写/重读，且在飞数量有上限', async () => {
    const recorder = createRecordingDevice('webgpu');
    const timing = new GpuTiming(recorder.device, { frames: 32, delay: 1 });
    const open = recorder.blockAllReads();
    const encoder = { writeTimestamp: () => {} };

    for (let index = 0; index < 20; index++) {
      timing.beforeFrame(encoder);
      timing.afterFrameEncoding(encoder);
      timing.onFrameSubmitted();
    }
    // 在飞上限：读回本身也有开销，不能每帧都发（见 GpuTiming 的文件头说明）。
    expect(recorder.reads).toHaveLength(4);
    expect(timing.stats.inFlight).toBe(4);
    expect(timing.stats.skipped).toBe(16);
    // 每个槽位最多被读一次（没有重复的范围）。
    expect(new Set(recorder.reads.map((read) => read.firstQuery)).size).toBe(4);

    open();
    await flush();
    expect(timing.stats.inFlight).toBe(0);
    expect(timing.stats.samples).toBe(4);
    // 放行之后槽位重新可用，可以继续发读回。
    timing.beforeFrame(encoder);
    timing.afterFrameEncoding(encoder);
    timing.onFrameSubmitted();
    expect(recorder.reads).toHaveLength(5);
  });

  it('正在被读的槽位会被跳过：那一帧改写到下一个空闲槽位', async () => {
    const recorder = createRecordingDevice('webgpu');
    const timing = new GpuTiming(recorder.device, { frames: 4, delay: 1 });
    const open = recorder.blockNextRead();
    const writes: number[] = [];
    const encoder = { writeTimestamp: (_querySet: QuerySet, index: number) => writes.push(index) };

    for (let index = 0; index < 5; index++) {
      timing.beforeFrame(encoder);
      timing.afterFrameEncoding(encoder);
      timing.onFrameSubmitted();
      await flush();
    }
    // 槽位 0 一直被挡着：第 5 帧（环形位置 0）改用了槽位 1 的下标 2/3。
    expect(writes.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(recorder.reads.map((read) => read.firstQuery)).toEqual([0, 2, 4, 6]);

    open();
    await flush();
    expect(timing.stats.samples).toBe(4);
    expect(timing.stats.inFlight).toBe(0);
  });

  it('WebGL2：一个槽位存的是区间耗时（纳秒），pass 上带 timestampWrites', async () => {
    const recorder = createRecordingDevice('webgl2');
    // GL 的 TIME_ELAPSED_EXT 就是纳秒：500000 ns = 0.5 ms
    recorder.setValues([500_000n]);
    const timing = new GpuTiming(recorder.device, { frames: 4, delay: 1 });
    expect(timing.slotStride).toBe(1);

    const writes: number[] = [];
    const encoder = { writeTimestamp: (_querySet: QuerySet, index: number) => writes.push(index) };
    const frame = () => {
      timing.beforeFrame(encoder);
      // WebGL2 的时间戳是 pass 级的（gl.beginQuery/endQuery 包住整个通道）。
      const passWrites = timing.passTimestampWrites();
      expect(passWrites).toEqual({
        querySet: expect.objectContaining({ type: QueryType.Timestamp }),
        beginningOfPassWriteIndex: expect.any(Number),
      });
      timing.onFrameSubmitted();
    };

    frame();
    frame();
    // WebGL2 不在 encoder 上写时间戳。
    expect(writes).toEqual([]);
    expect(recorder.reads).toEqual([{ firstQuery: 0, queryCount: 1 }]);

    await flush();
    expect(timing.stats.gpuFrameTimeMs).toBeCloseTo(0.5, 6);

    frame();
    await flush();
    expect(recorder.reads[1]).toEqual({ firstQuery: 1, queryCount: 1 });
  });

  it('环形槽位会回绕（frames=4 时第 4 帧读到槽位 0）', async () => {
    const recorder = createRecordingDevice('webgpu');
    const timing = new GpuTiming(recorder.device, { frames: 4, delay: 1 });
    const encoder = { writeTimestamp: () => {} };
    for (let index = 0; index < 6; index++) {
      timing.beforeFrame(encoder);
      timing.afterFrameEncoding(encoder);
      timing.onFrameSubmitted();
      await flush();
    }
    expect(recorder.reads.map((read) => read.firstQuery)).toEqual([0, 2, 4, 6, 0]);
  });

  it('读回失败（disjoint / 超时）只记录 error，不打断帧循环', async () => {
    const failing = {
      backend: 'webgl2',
      features: { has: () => true, names: ['timestamp-query'] },
      createQuerySet: (descriptor: QuerySetDescriptor) =>
        ({
          label: descriptor.label,
          type: descriptor.type,
          count: descriptor.count,
          native: null,
          disposed: false,
          destroy: () => {},
          dispose: () => {},
        }) as unknown as QuerySet,
      readQuerySet: (): QueryResult => ({
        type: QueryType.Timestamp,
        count: 1,
        timestampPeriod: 1,
        read: async () => {
          throw new Error('[gpu-device-api] GPU_DISJOINT_EXT is set');
        },
      }),
    } as unknown as Device;

    const timing = new GpuTiming(failing, { frames: 4, delay: 1 });
    for (let index = 0; index < 4; index++) {
      // WebGL2 的写入点是 pass 级的：必须先问一次 passTimestampWrites（Renderer 会问）。
      timing.passTimestampWrites();
      timing.onFrameSubmitted();
      await flush();
    }
    expect(timing.stats.gpuFrameTimeMs).toBeNull();
    expect(timing.stats.error).toMatch(/GPU_DISJOINT_EXT/);
    expect(timing.stats.samples).toBe(0);
  });

  it('请求的帧数/延迟会被夹到合法范围', () => {
    const recorder = createRecordingDevice('webgpu');
    const timing = new GpuTiming(recorder.device, { frames: 1, delay: 100 });
    expect(timing.frames).toBeGreaterThanOrEqual(4);
    expect(timing.delay).toBeGreaterThanOrEqual(1);
    expect(timing.delay).toBeLessThanOrEqual(timing.frames - 1);
  });
});
