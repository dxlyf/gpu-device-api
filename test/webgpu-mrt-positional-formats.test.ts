/**
 * 批 10 · `#11.3` 完整修法：`RenderPipelineVariant.colorFormats` 改成**逐位置**（空位 `null` 占位）。
 *
 * ## 缺陷（批 05 实测坐实，本文件把它钉成回归测试）
 *
 * 批 05 之前，`toGPURenderPassDescriptor()` 推导 pass 布局时把非空附件**压缩**成密集列表：
 *
 * | pass 的 colorAttachments | 原生数组长度 | 改前的 `layout.colorFormats` |
 * | --- | --- | --- |
 * | `[a]` | 1 | `["rgba8unorm"]` |
 * | `[a, null]` | 2 | `["rgba8unorm"]` ← 压缩了 |
 * | `[null, a]` | 2 | `["rgba8unorm"]` ← 压缩了 |
 *
 * 密集列表丢失了「空位在哪个下标」这条信息，于是两件事同时发生：
 *
 * 1. **变体撞键 → 静默用错管线**：`[a, null]` 与 `[null, a]` 推导出同一个变体键
 *    `rgba8unorm|1|none`，`WebGPURenderPipeline.resolve()` 返回**同一条**原生管线
 *    （批 05 实测 `createRenderPipeline` 只调用 1 次、`samePipelineObject=true`）。
 *    而按 WebGPU 语义两者需要的 `GPUFragmentState.targets` 分别是 `[state, null]` 与
 *    `[null, state]` —— 一条管线不可能同时服务两者。
 * 2. **空位后面的 target 整体前移**：`[null, b]` 的 `targets[0]` 会被应用到 location 0
 *    （空位），真正的 location 1 拿不到自己的 target。
 *
 * 批 05 的处置是在 pass 建立期对「空位后面还有非空附件」**明确报错**（不静默错配），
 * 尾部空位继续放行。本批把变体改成逐位置之后，那条报错应当撤掉、组合应当真的可用。
 *
 * ## 本文件断言的四件事
 *
 * 1. **布局逐位置**：`[null, a]` 的 `layout.colorFormats` 是 `[null, 'rgba8unorm']`，
 *    下标即 location；尾部的空位同样占位（`['a', null]`）——不再压缩。
 * 2. **变体键与原生管线两两不同**：`[a]` / `[a, null]` / `[null, a]` / `[a, a]` 四个变体
 *    必须建出 **4 条**互不相同的原生管线。这是本批最容易改出的静默错误
 *    （少比一个字段就会让两条布局共用同一条管线，画错东西却没有任何报错）。
 * 3. **原生 `fragment.targets` 按位置对齐**：`[null, a]` → `[null, {format}]`（location 0
 *    丢弃输出、location 1 是那张附件的格式）；`[a, null]` → 尾部空位被剪掉（`[{format}]`），
 *    这正是批 05 用真实原生 WebGPU 验证过、原生接受的形状。
 * 4. **descriptor 侧同样逐位置**：`fragment.targets` / `colorFormats` 现在也接受 `null`
 *    占位，并且「在空位处声明了一个真实 target」会明确报错，而不是静默错位。
 *
 * 真实渲染（两后端逐像素一致）的证据不在单测里：node 侧 mock 的 `createShaderModule`
 * 永远返回 `{}`，着色器层面的错误这里发现不了，落点结论由只读原生探针给出
 *（`.tmp-10/mrt-positional-probe.*`，结论抄在批 10 汇报里）。
 */

import { describe, expect, it } from 'vitest';

import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { WebGPURenderPipeline } from '../src/webgpu/pipeline/WebGPURenderPipeline.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { ValidationError } from '../src/core/errors/ValidationError.js';
import { toGPURenderPassDescriptor } from '../src/webgpu/render/WebGPURenderPassEncoder.js';
import type { RenderPassDescriptor } from '../src/core/render/RenderPassEncoder.js';
import type { ColorAttachment } from '../src/core/render/RenderTarget.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';
import type { RenderPipelineVariant } from '../src/core/pipeline/RenderPipeline.js';

/* ================================================================================================ */
/* 位置式 colorFormats 的构造 helper                                                                  */
/* ================================================================================================ */

/**
 * 逐位置格式列表 → `resolve()` 的入参。
 *
 * 之所以要有这个 helper 而不是直接写字面量：`RenderPipelineVariant.colorFormats` 从密集列表
 * 改成逐位置（`(TextureFormat | null)[]`）之前，`null` 占位在类型上是不合法的，而本文件是
 * 「先落复现证据」的那一步 —— 证据提交时这里用一次 cast 让测试**在运行时**失败（而不是
 * 在 `tsc` 阶段失败）。修复提交把 cast 去掉，这个 helper 就只剩下「把列表包成 variant 入参」。
 */
function positional(
  colorFormats: readonly (TextureFormat | null)[],
  extra: Omit<Partial<RenderPipelineVariant>, 'colorFormats'> = {},
): Partial<RenderPipelineVariant> {
  return { colorFormats: colorFormats as readonly TextureFormat[], ...extra };
}

/* ================================================================================================ */
/* pass 布局：假 texture view + 一台最小 mock 原生设备                                                    */
/* ================================================================================================ */

/**
 * 一张「原生形状」的假 texture view。
 *
 * `toGPURenderPassDescriptor()` 只要求它通过 `asGPUTextureView()` 的形状识别
 * （`@@toStringTag === 'GPUTextureView'` 且没有 `native` / `createView`），
 * 并能读出 `texture.format` / `texture.sampleCount` / `descriptor.format`。
 */
function fakeView(format: TextureFormat, sampleCount = 1): ColorAttachment['view'] {
  const texture = { format, sampleCount };
  const view: Record<string | symbol, unknown> = { texture, descriptor: {} };
  Object.defineProperty(view, Symbol.toStringTag, { value: 'GPUTextureView' });
  return view as unknown as ColorAttachment['view'];
}

/** 该测量只用到 pass 布局推导，`device` 只在 `timestampWrites` 上被读。 */
const DEVICE = {} as WebGPUDevice;

function pass(colorAttachments: readonly (ColorAttachment | null)[]): RenderPassDescriptor {
  return { label: 'mrt', colorAttachments };
}

function layoutOf(colorAttachments: readonly (ColorAttachment | null)[]) {
  return toGPURenderPassDescriptor(pass(colorAttachments), DEVICE).layout;
}

interface MockNativePipeline {
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
      const created: MockNativePipeline = { id: natives.length + 1 };
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

/**
 * 一条**不声明** attachment 格式的管线（格式全部由 variant 提供）。
 *
 * 这正是「同一个 pipeline 服务多个 target」的写法，也是本批要修的那条路径：
 * 只有 variant 携带逐位置的 colorFormats，才能区分 `[a]` / `[a, null]` / `[null, a]`。
 */
function createPipeline(mock: MockPipelineGpu, label = 'material'): WebGPURenderPipeline {
  const module = mock.device.createShaderModule({ label: `${label}-shader`, code: WGSL });
  return new WebGPURenderPipeline(mock.device, {
    label,
    layout: 'auto',
    vertex: { module, entryPoint: 'vsMain', buffers: [] },
    fragment: { module, entryPoint: 'fsMain' },
  });
}

/**
 * 读一条原生描述里的 `fragment.targets`（本文件的断言对象）。
 *
 * 元素类型带上 `undefined`：`@webgpu/types` 把 `GPUFragmentState.targets` 声明成
 * `Iterable<GPUColorTargetState | null | undefined>`，而本层生成的数组里不会有 `undefined`。
 */
function nativeTargets(
  descriptor: GPURenderPipelineDescriptor,
): readonly (GPUColorTargetState | null | undefined)[] {
  const collected: (GPUColorTargetState | null | undefined)[] = [];
  const targets = descriptor.fragment?.targets;
  if (targets) for (const target of targets) collected.push(target);
  return collected;
}

/* ================================================================================================ */
/* 1. 布局逐位置                                                                                      */
/* ================================================================================================ */

describe('#11.3 pass 布局：colorFormats 逐位置（下标即 fragment output location）', () => {
  it('[null, a]：不再报错，布局是 [null, format]（空位占位）', () => {
    // 改前：抛 `[gpu-device-api] mrt: colorAttachments[0] is null, but a later entry is not null.`。
    const layout = layoutOf([null, { view: fakeView('rgba8unorm') }]);
    expect(layout.colorFormats).toEqual([null, 'rgba8unorm']);
    expect(layout.sampleCount).toBe(1);
    expect(layout.depthFormat).toBeNull();
  });

  it('[null, null, a] 与 [a, null, b]：中间空位同样占位（不再压缩）', () => {
    expect(layoutOf([null, null, { view: fakeView('rgba8unorm') }]).colorFormats).toEqual([
      null,
      null,
      'rgba8unorm',
    ]);
    expect(
      layoutOf([{ view: fakeView('rgba8unorm') }, null, { view: fakeView('rgba16float') }]).colorFormats,
    ).toEqual(['rgba8unorm', null, 'rgba16float']);
  });

  it('[a, null]：尾部空位也占位（长度语义变了，位置信息不再丢失）', () => {
    // 改前这里是 ['rgba8unorm']（与 [a] 撞同一个变体键）。现在尾部的 null 保留下来，
    // 于是「两个槽位的 pass」与「一个槽位的 pass」是两个不同的变体。
    expect(layoutOf([{ view: fakeView('rgba8unorm') }, null]).colorFormats).toEqual([
      'rgba8unorm',
      null,
    ]);
  });

  it('原生 colorAttachments 仍然原样保留 null（这一层从来没有丢过空位）', () => {
    const result = toGPURenderPassDescriptor(pass([null, { view: fakeView('rgba8unorm') }]), DEVICE);
    const nativeColors = [...(result.native.colorAttachments ?? [])];
    expect(nativeColors).toHaveLength(2);
    expect(nativeColors[0]).toBeNull();
    expect(nativeColors[1]).not.toBeNull();
  });
});

/* ================================================================================================ */
/* 2. 变体键与原生管线两两不同（本批最危险的静默错误）                                                     */
/* ================================================================================================ */

describe('#11.3 变体：空位的位置必须进 cache key，四条布局必须拿到四条原生管线', () => {
  it('[a] / [a, null] / [null, a] / [a, a]：键两两不同，原生管线两两不同', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    const dense = positional(['rgba8unorm'], { sampleCount: 1, depthFormat: null });
    const trailing = positional(['rgba8unorm', null], { sampleCount: 1, depthFormat: null });
    const leading = positional([null, 'rgba8unorm'], { sampleCount: 1, depthFormat: null });
    const two = positional(['rgba8unorm', 'rgba8unorm'], { sampleCount: 1, depthFormat: null });

    const resolvedDense = pipeline.resolve(dense);
    const resolvedTrailing = pipeline.resolve(trailing);
    const resolvedLeading = pipeline.resolve(leading);
    const resolvedTwo = pipeline.resolve(two);

    // 改前：[a, null] 与 [null, a]（还有 [a]）都会解析成同一个键 `rgba8unorm|1|none`，
    // `createRenderPipeline` 只被调用 1 次，下面这几条里的 `not.toBe` 与长度断言全部失败。
    expect(mock.natives).toHaveLength(4);
    expect(pipeline.variantCount).toBe(4);
    expect(new Set([resolvedDense, resolvedTrailing, resolvedLeading, resolvedTwo]).size).toBe(4);
    expect(resolvedTrailing).not.toBe(resolvedDense);
    expect(resolvedLeading).not.toBe(resolvedDense);
    expect(resolvedLeading).not.toBe(resolvedTrailing);

    // 键必须逐条点明空位在哪：`none` 是空位占位符（没有任何真实格式叫这个名字）。
    expect([...pipeline.compiledVariants].sort()).toEqual([
      'none,rgba8unorm|1|none',
      'rgba8unorm,none|1|none',
      'rgba8unorm,rgba8unorm|1|none',
      'rgba8unorm|1|none',
    ]);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('三个位置的排列组合：键的数量等于不同布局的数量（不会互相吞掉）', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    const formats: readonly (TextureFormat | null)[][] = [
      ['rgba8unorm'],
      [null],
      ['rgba8unorm', null],
      [null, 'rgba8unorm'],
      ['rgba8unorm', 'rgba8unorm'],
      [null, null],
      ['rgba8unorm', null, null],
      [null, 'rgba8unorm', null],
      [null, null, 'rgba8unorm'],
      ['rgba8unorm', null, 'rgba8unorm'],
    ];

    const keys = formats.map((format) => {
      pipeline.resolve(positional(format, { sampleCount: 1, depthFormat: null }));
      return pipeline.compiledVariants[pipeline.compiledVariants.length - 1];
    });

    expect(new Set(keys).size).toBe(formats.length);
    // `[null]` 与 `[null, null]` 都是「没有颜色输出」的 pass，但键仍然不同（长度即槽位数）。
    expect(keys[1]).toBe('none|1|none');
    expect(keys[5]).toBe('none,none|1|none');

    pipeline.dispose();
    mock.device.dispose();
  });
});

/* ================================================================================================ */
/* 3. 原生 fragment.targets 按位置对齐                                                                 */
/* ================================================================================================ */

describe('#11.3 原生 targets：位置对齐（空位写 null、尾部空位剪掉）', () => {
  it('[null, a] → targets = [null, {rgba8unorm}]（location 0 丢弃输出）', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    pipeline.resolve(positional([null, 'rgba8unorm'], { sampleCount: 1, depthFormat: null }));
    const targets = nativeTargets(mock.descriptors[0]!);
    expect(targets).toHaveLength(2);
    expect(targets[0]).toBeNull();
    expect(targets[1]?.format).toBe('rgba8unorm');

    pipeline.dispose();
    mock.device.dispose();
  });

  it('[a, null] → targets 把尾部空位剪掉（批 05 实测原生接受的形状）', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    pipeline.resolve(positional(['rgba8unorm', null], { sampleCount: 1, depthFormat: null }));
    const targets = nativeTargets(mock.descriptors[0]!);
    // 尾部空位不携带信息（原生本来就允许管线的 targets 比 pass 的槽位短，
    // 前提是多出来的槽位是空的），所以剪掉它能让 `[a, null]` 沿用改前已被验证的形状。
    expect(targets).toHaveLength(1);
    expect(targets[0]?.format).toBe('rgba8unorm');

    pipeline.dispose();
    mock.device.dispose();
  });

  it('[a, null, b] → targets 逐位置，中间空位写 null', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);

    pipeline.resolve(
      positional(['rgba8unorm', null, 'rgba16float'], { sampleCount: 1, depthFormat: null }),
    );
    const targets = nativeTargets(mock.descriptors[0]!);
    expect(targets).toHaveLength(3);
    expect(targets[0]?.format).toBe('rgba8unorm');
    expect(targets[1]).toBeNull();
    expect(targets[2]?.format).toBe('rgba16float');

    pipeline.dispose();
    mock.device.dispose();
  });

  it('pass 布局直接喂给 resolve：`[null, a]` 的 targets 落在 location 1', () => {
    const mock = createMockPipelineGpu();
    const pipeline = createPipeline(mock);
    const layout = layoutOf([null, { view: fakeView('rgba8unorm') }]);

    pipeline.resolve({
      colorFormats: layout.colorFormats,
      sampleCount: layout.sampleCount,
      depthFormat: layout.depthFormat,
    });

    const targets = nativeTargets(mock.descriptors[0]!);
    expect(targets[0]).toBeNull();
    expect(targets[1]?.format).toBe('rgba8unorm');

    pipeline.dispose();
    mock.device.dispose();
  });
});

/* ================================================================================================ */
/* 4. descriptor 侧：fragment.targets / colorFormats 也逐位置                                          */
/* ================================================================================================ */

describe('#11.3 descriptor 侧：逐位置的 targets 与 colorFormats', () => {
  function pipelineWith(
    mock: MockPipelineGpu,
    descriptor: {
      colorFormats?: readonly (TextureFormat | null)[];
      targets?: readonly ({ format?: TextureFormat } | null)[];
    },
  ): WebGPURenderPipeline {
    const module = mock.device.createShaderModule({ label: 'positional-shader', code: WGSL });
    return new WebGPURenderPipeline(mock.device, {
      label: 'positional',
      layout: 'auto',
      vertex: { module, entryPoint: 'vsMain', buffers: [] },
      fragment: { module, entryPoint: 'fsMain', targets: descriptor.targets as never },
      colorFormats: descriptor.colorFormats as never,
    });
  }

  it('fragment.targets 里的 null 占位会推导出逐位置的 colorFormats', () => {
    const mock = createMockPipelineGpu();
    const pipeline = pipelineWith(mock, { targets: [null, { format: 'rgba8unorm' }] });

    pipeline.resolve();
    const targets = nativeTargets(mock.descriptors[0]!);
    expect(targets).toHaveLength(2);
    expect(targets[0]).toBeNull();
    expect(targets[1]?.format).toBe('rgba8unorm');

    pipeline.dispose();
    mock.device.dispose();
  });

  it('descriptor.colorFormats 里的 null 占位同样生效', () => {
    const mock = createMockPipelineGpu();
    const pipeline = pipelineWith(mock, { colorFormats: [null, 'rgba8unorm'] });

    pipeline.resolve();
    const targets = nativeTargets(mock.descriptors[0]!);
    expect(targets[0]).toBeNull();
    expect(targets[1]?.format).toBe('rgba8unorm');

    pipeline.dispose();
    mock.device.dispose();
  });

  it('在空位处声明了真实 target → 明确报错（而不是静默错位）', () => {
    const mock = createMockPipelineGpu();
    // location 0 是空位（pass 里没有附件），却给它声明了一个 target：原生 attachment state
    // 也会拒绝这种组合，这里提前说清楚是哪一位。
    const withTargets = pipelineWith(mock, {
      targets: [{ format: 'rgba8unorm' }, { format: 'rgba8unorm' }],
    });
    expect(() =>
      withTargets.resolve(positional([null, 'rgba8unorm'], { sampleCount: 1, depthFormat: null })),
    ).toThrowError(ValidationError);
    expect(() =>
      withTargets.resolve(positional([null, 'rgba8unorm'], { sampleCount: 1, depthFormat: null })),
    ).toThrowError(/location 0/);

    withTargets.dispose();
    mock.device.dispose();
  });

  it('尾部空位：descriptor 只声明一个有输出的 target 仍然可用（长度按有效槽位比）', () => {
    const mock = createMockPipelineGpu();
    const pipeline = pipelineWith(mock, { targets: [{ format: 'rgba8unorm' }] });

    // pass 是 [a, null]（逐位置长度 2），而 descriptor 只声明了 1 个 target ——
    // 尾部的空位不携带信息，所以这条应该继续放行（改前也是放行的）。
    expect(() =>
      pipeline.resolve(positional(['rgba8unorm', null], { sampleCount: 1, depthFormat: null })),
    ).not.toThrow();
    expect(nativeTargets(mock.descriptors[0]!)).toHaveLength(1);

    pipeline.dispose();
    mock.device.dispose();
  });

  it('targets 比有效槽位多（非尾部空位）→ 仍然明确报错', () => {
    const mock = createMockPipelineGpu();
    const pipeline = pipelineWith(mock, {
      targets: [{ format: 'rgba8unorm' }, { format: 'rgba8unorm' }],
    });

    expect(() =>
      pipeline.resolve(positional(['rgba8unorm'], { sampleCount: 1, depthFormat: null })),
    ).toThrowError(/targets has 2 entries but the render target has 1 color/);

    pipeline.dispose();
    mock.device.dispose();
  });
});
