/**
 * `WebGPURenderPipeline.resolve()` 的变体解析复用回归测试（优化 #36）。
 *
 * 缺陷回顾：`resolve()` 只记住**上一次**的入参身份与解析结果。同一个材质既画画布通道、又画
 * 离屏通道（两个 render pass 各持有一个 `variantRequest` 对象，colorFormats / sampleCount /
 * depthFormat 都不同）时，两次 draw 交替就会**每次都不命中**：重新 `resolveVariant()`、
 * 重新拼 cache key（含 colorFormats 的 `join` 与 vertex layout 的 key 查询）。GPU 侧的
 * variant 缓存本身是命中的，浪费的纯粹是每 draw 的 CPU 与分配。
 *
 * 这里用一台最小 mock 原生设备 + 一个**白盒计量 seam**：`resolveVariant` 是私有方法
 * （`private` 只在编译期存在，运行时就是原型上的方法），`vi.spyOn` 包一层即可精确数出
 * 「解析了几次」。同一个 seam 在修复前后都能用，因此前后数字可以直接对比：
 *
 * - 两个变体交替 resolve 12 轮（24 次）：修复前解析 24 次，修复后解析 2 次；
 * - 原生 `createRenderPipeline()` 调用数前后都是 2（这条优化不该多建 GPU 对象）；
 * - 每个变体每次拿到的原生管线对象必须始终是同一条（正确性）。
 *
 * 命中判定与原来的单条快速路径**逐字段等价**这件事由「同一个入参对象原地改一个字段」的用例
 * 钉死：四个字段（colorFormats / sampleCount / depthFormat / vertexLayouts）任一变值都必须
 * 重新解析并建出新的原生管线 —— 少比一个字段就会静默命中错误变体，画错东西且极难查。
 */

import { describe, expect, it, vi } from 'vitest';

import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { WebGPURenderPipeline } from '../src/webgpu/pipeline/WebGPURenderPipeline.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import type { RenderPipelineVariant } from '../src/core/pipeline/RenderPipeline.js';
import type { VertexBufferLayout } from '../src/core/pipeline/VertexLayout.js';

/* ------------------------------------------------------------------------------------------------ */
/* 最小 mock 原生设备                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

interface MockNativePipeline {
  readonly label: string | undefined;
  readonly id: number;
}

interface MockPipelineGpu {
  readonly device: WebGPUDevice;
  /** 每一次 `native.createRenderPipeline()` 收到的描述（按发生顺序）。 */
  readonly descriptors: GPURenderPipelineDescriptor[];
  /** 每一次 `native.createRenderPipeline()` 返回的对象（按发生顺序）。 */
  readonly natives: MockNativePipeline[];
}

function createMockPipelineGpu(): MockPipelineGpu {
  const descriptors: GPURenderPipelineDescriptor[] = [];
  const natives: MockNativePipeline[] = [];
  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    onuncapturederror: null,
    limits: undefined,
    createShaderModule: ({ label, code }: { label?: string; code: string }) => ({ label, code }),
    createRenderPipeline: (descriptor: GPURenderPipelineDescriptor): MockNativePipeline => {
      descriptors.push(descriptor);
      const created: MockNativePipeline = { label: descriptor.label, id: natives.length + 1 };
      natives.push(created);
      return created;
    },
    destroy: () => {},
  } as unknown as GPUDevice;

  const device = new WebGPUDevice(native, {
    descriptor: { label: 'mock-device', defaultSampleCount: 1, requiredFeatures: [] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    adapterFeatures: new Set<string>(),
  });
  return { device, descriptors, natives };
}

const WGSL = '/* wgsl */\n@vertex fn vsMain() -> @builtin(position) vec4f { return vec4f(0.0); }';

/** 一条有 fragment stage、attachment 格式由 variant 决定的管线（画布 / 离屏两个 target 共用）。 */
function createPipeline(mock: MockPipelineGpu, label = 'material'): WebGPURenderPipeline {
  const module = mock.device.createShaderModule({ label: `${label}-shader`, code: WGSL });
  return new WebGPURenderPipeline(mock.device, {
    label,
    layout: 'auto',
    vertex: { module, entryPoint: 'vsMain', buffers: [] },
    fragment: { module, entryPoint: 'fsMain', targets: [{ format: 'rgba8unorm' }] },
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* 计量 seam：白盒数「解析了几次」                                                                      */
/* ------------------------------------------------------------------------------------------------ */

type VariantResolutionSeam = {
  resolveVariant(variant: Partial<RenderPipelineVariant>): RenderPipelineVariant;
};

/**
 * 包住私有的 `resolveVariant`（默认实现照旧调用原方法），返回的 spy 上可以读解析次数。
 *
 * 为什么用白盒：解析次数没有任何公开可观测点 —— 外部能看到的只有「建了几条原生管线」，
 * 而这条优化恰恰**不改变**它。`mock.calls.length` 修复前后语义一致，因此可以横向对比。
 */
function countVariantResolutions(pipeline: WebGPURenderPipeline) {
  return vi.spyOn(pipeline as unknown as VariantResolutionSeam, 'resolveVariant');
}

function resolutionCount(spy: { mock: { calls: readonly unknown[][] } }): number {
  return spy.mock.calls.length;
}

/** 白盒读私有的二级缓存（`private` 只在编译期存在）：用来验证容量上限与 dispose 清理。 */
function memoSeam(pipeline: WebGPURenderPipeline): { variantMemo: readonly unknown[] } {
  return pipeline as unknown as { variantMemo: readonly unknown[] };
}

/* ------------------------------------------------------------------------------------------------ */
/* 用例                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** 画布通道：bgra8unorm 目标 + depth24plus、单采样。 */
const CANVAS_FORMATS = ['bgra8unorm'] as const;
/** 离屏通道：rgba8unorm 目标、4x MSAA、无深度附件。 */
const OFFSCREEN_FORMATS = ['rgba8unorm'] as const;

function canvasRequest(): Partial<RenderPipelineVariant> {
  return { colorFormats: CANVAS_FORMATS, sampleCount: 1, depthFormat: 'depth24plus' };
}

function offscreenRequest(): Partial<RenderPipelineVariant> {
  return { colorFormats: OFFSCREEN_FORMATS, sampleCount: 4, depthFormat: null };
}

describe('WebGPURenderPipeline.resolve()：变体解析复用（#36）', () => {
  it('两个变体交替 resolve 24 次：只解析 2 次（修复前 24 次），原生管线仍然是 2 条', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const spy = countVariantResolutions(pipeline);

    const canvas = canvasRequest();
    const offscreen = offscreenRequest();
    const canvasResults: GPURenderPipeline[] = [];
    const offscreenResults: GPURenderPipeline[] = [];

    for (let draw = 0; draw < 12; draw += 1) {
      canvasResults.push(pipeline.resolve(canvas));
      offscreenResults.push(pipeline.resolve(offscreen));
    }

    // 修复前：交替使用时每次都重新解析 + 重新拼 key，这里是 24。
    expect(resolutionCount(spy)).toBe(2);
    // 原生管线仍然只有 2 条（这条优化不多建 GPU 对象）。
    expect(mock.descriptors).toHaveLength(2);
    expect(pipeline.variantCount).toBe(2);

    // 两个变体各自拿到的原生管线必须始终是同一条，且互不相同。
    for (const native of canvasResults) expect(native).toBe(canvasResults[0]);
    for (const native of offscreenResults) expect(native).toBe(offscreenResults[0]);
    expect(canvasResults[0]).not.toBe(offscreenResults[0]);

    // 两个变体确实不同（否则上面的断言没有意义）：采样数、深度附件、cache key 都不同。
    expect(mock.descriptors[0]!.multisample?.count).toBe(1);
    expect(mock.descriptors[0]!.depthStencil?.format).toBe('depth24plus');
    expect(mock.descriptors[1]!.multisample?.count).toBe(4);
    expect(mock.descriptors[1]!.depthStencil).toBeUndefined();
    // colorFormats / sampleCount / depthFormat 三个字段都进了 key：两个变体各占一条。
    expect(pipeline.compiledVariants).toEqual(['bgra8unorm|1|depth24plus', 'rgba8unorm|4|none']);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('单条快速路径仍在最前面：同一个入参连续 resolve 100 次只解析 1 次', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const spy = countVariantResolutions(pipeline);
    const request = canvasRequest();

    const first = pipeline.resolve(request);
    for (let call = 0; call < 100; call += 1) expect(pipeline.resolve(request)).toBe(first);

    expect(resolutionCount(spy)).toBe(1);
    expect(mock.natives).toHaveLength(1);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('无参 resolve 也走快速路径（共享的空入参常量，不重复解析）', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const spy = countVariantResolutions(pipeline);

    const first = pipeline.resolve();
    for (let call = 0; call < 50; call += 1) expect(pipeline.resolve()).toBe(first);

    expect(resolutionCount(spy)).toBe(1);
    expect(mock.descriptors).toHaveLength(1);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('命中判定与原来的快速路径完全等价：四个字段任一原地变化都必须重新解析', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const spy = countVariantResolutions(pipeline);

    const layout: VertexBufferLayout = {
      arrayStride: 12,
      attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
    };
    // 同一个入参对象：只在原地改字段（`input` 身份始终相同，只有字段比对能拦住错误命中）。
    const request: Partial<RenderPipelineVariant> = {
      colorFormats: CANVAS_FORMATS,
      sampleCount: 1,
      depthFormat: null,
      vertexLayouts: [],
    };

    const baseline = pipeline.resolve(request);
    expect(resolutionCount(spy)).toBe(1);
    expect(mock.natives).toHaveLength(1);

    request.colorFormats = ['rgba8unorm'];
    const byColorFormat = pipeline.resolve(request);
    expect(byColorFormat).not.toBe(baseline);

    request.sampleCount = 4;
    const bySampleCount = pipeline.resolve(request);
    expect(bySampleCount).not.toBe(baseline);

    request.depthFormat = 'depth24plus';
    const byDepthFormat = pipeline.resolve(request);
    expect(byDepthFormat).not.toBe(baseline);

    request.vertexLayouts = [layout];
    const byVertexLayouts = pipeline.resolve(request);
    expect(byVertexLayouts).not.toBe(baseline);

    // 四个字段各变一次 → 四次重新解析，四条新管线（加上 baseline 共 5 条）。
    expect(resolutionCount(spy)).toBe(5);
    expect(mock.natives).toHaveLength(5);
    expect(new Set([baseline, byColorFormat, bySampleCount, byDepthFormat, byVertexLayouts]).size).toBe(5);
    // 命中的解析结果必须与字段值对应：MSAA 那一条真的是 4 采样。
    expect(mock.descriptors[2]!.multisample?.count).toBe(4);

    // 字段改回原值 → cache key 相同 ⇒ 拿回同一条原生管线（但对象身份不同，所以会重新解析一次）。
    request.colorFormats = CANVAS_FORMATS;
    request.sampleCount = 1;
    request.depthFormat = null;
    request.vertexLayouts = [];
    expect(pipeline.resolve(request)).toBe(baseline);
    expect(resolutionCount(spy)).toBe(6);
    expect(mock.natives).toHaveLength(5);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('等价的另一个入参对象（新身份、同值）拿到同一条原生管线，不会多建', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    const first = pipeline.resolve({ colorFormats: ['bgra8unorm'], sampleCount: 1, depthFormat: null });
    // 新对象、同值：快速路径按身份不命中（与改动前一致），但 cache key 相同 → 同一条管线。
    const second = pipeline.resolve({ colorFormats: ['bgra8unorm'], sampleCount: 1, depthFormat: null });

    expect(second).toBe(first);
    expect(mock.natives).toHaveLength(1);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('三个变体交替时不会串味：每次都返回各自的原生管线', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    const requests: Partial<RenderPipelineVariant>[] = [
      { colorFormats: ['bgra8unorm'], sampleCount: 1, depthFormat: 'depth24plus' },
      { colorFormats: ['rgba8unorm'], sampleCount: 4, depthFormat: null },
      { colorFormats: ['rgba16float'], sampleCount: 1, depthFormat: 'depth32float' },
    ];
    const resolved = requests.map((request) => pipeline.resolve(request));
    expect(new Set(resolved).size).toBe(3);

    for (let round = 0; round < 5; round += 1) {
      requests.forEach((request, index) => {
        expect(pipeline.resolve(request)).toBe(resolved[index]);
      });
    }
    expect(mock.natives).toHaveLength(3);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('二级缓存有容量上限（4 条）：变体很多时不会无上限增长，被挤出也不会重建 GPU 管线', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const spy = countVariantResolutions(pipeline);

    const formats = ['bgra8unorm', 'rgba8unorm', 'rgba16float', 'rgba8unorm-srgb'] as const;
    const requests: Partial<RenderPipelineVariant>[] = formats.map((format, index) => ({
      colorFormats: [format],
      sampleCount: 1,
      depthFormat: index % 2 === 0 ? null : 'depth24plus',
    }));

    const resolved = requests.map((request) => pipeline.resolve(request));
    expect(mock.natives).toHaveLength(4);
    expect(resolutionCount(spy)).toBe(4);
    // 上限：缓存条目不会超过 4 条。
    expect(memoSeam(pipeline).variantMemo.length).toBe(4);

    // 最近使用的 4 个仍然命中（这里正好是全部 4 个）。
    requests.forEach((request, index) => expect(pipeline.resolve(request)).toBe(resolved[index]));
    expect(resolutionCount(spy)).toBe(4);

    // 第 5 个变体进来：memo 只留 4 条，最早的被挤掉；底层 variant 缓存仍然命中同一条管线。
    const fifth: Partial<RenderPipelineVariant> = {
      colorFormats: ['bgra8unorm'],
      sampleCount: 4,
      depthFormat: 'depth24plus',
    };
    const fifthNative = pipeline.resolve(fifth);
    expect(memoSeam(pipeline).variantMemo.length).toBe(4);
    expect(mock.natives).toHaveLength(5);
    // 被挤出 memo 的第一个变体：重新解析（CPU 侧），但不会重建原生管线（GPU 侧）。
    expect(pipeline.resolve(requests[0]!)).toBe(resolved[0]);
    expect(mock.natives).toHaveLength(5);
    // 4 次首建 + 第 5 个变体 1 次 + 被挤出 memo 的第 1 个变体 1 次重新解析。
    expect(resolutionCount(spy)).toBe(6);
    expect(fifthNative).not.toBe(resolved[0]);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('dispose() 清空二级缓存', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    pipeline.resolve(canvasRequest());
    pipeline.resolve(offscreenRequest());
    expect(memoSeam(pipeline).variantMemo.length).toBe(2);

    pipeline.dispose();

    expect(memoSeam(pipeline).variantMemo.length).toBe(0);
    mock.device.dispose();
  });

  it('dispose 之后 resolve 仍然明确报错（缓存没有掩盖失效状态）', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const request = canvasRequest();

    pipeline.resolve(request);
    pipeline.dispose();

    expect(() => pipeline.resolve(request)).toThrowError(/has been disposed/);
    expect(() => pipeline.resolve(canvasRequest())).toThrowError(/has been disposed/);
    mock.device.dispose();
  });
});
