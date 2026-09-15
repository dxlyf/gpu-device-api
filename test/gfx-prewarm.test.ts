/**
 * gfx 便捷层的 `Renderer.prewarm()` / `Renderer.compilationInfo()` 单测。
 *
 * 这一层要证明的**不是**「后端能不能异步编译」（那是 `pipeline-prewarm.test.ts` 的事），
 * 而是「接线接对了没有」：
 *
 * 1. **按后端分派**：`Renderer` 内部按 `this.backend` 挑 helper，调用方不用写后端分支。
 *    WebGL2 的 helper 被换成一个纯假的记录器（这一层只关心「有没有分派对、返回的管线有没有
 *    被交回绘制路径」）；WebGPU 的 helper 保留**真实实现**，只套一层 spy，于是
 *    「预热后首次 `resolve(variant)` 不再产生任何 GPU 编译调用」是真跑出来的。
 * 2. **variant 与绘制时一致**：拿**真实的渲染通道解析器**当 oracle ——
 *    WebGPU 侧用 `toGPURenderPassDescriptor(...).layout`（渲染通道 `setPipeline` 时用的就是它）
 *    与 `renderer.prewarm()` 实际传下去的 variant 逐字段比对；两个后端都另外核对
 *    `vertexLayouts` 就是 `acquirePipeline()` 交给 `createRenderPipeline()` 的那份描述里的
 *    同一个数组（对象身份相同，不是「看起来相等」）。
 * 3. **不重复预热**：已建过管线的材质第二次预热必须跳过，helper 不再被调用。
 * 4. **失败不抛**：helper 返回 `ok: false` 时结果照常返回、诊断可读，且状态不被污染
 *    （之后 `draw()` / `compilationInfo()` 走正常路径自己建管线）。
 *
 * 渲染器用假的 canvas context + mock 的 `createDeviceWithAdapter` 拼出来，
 * 设备本体在 WebGPU 侧是**真的** `WebGPUDevice`（挂在 mock 原生 `GPUDevice` 上）。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 先声明 mock：工厂函数会被提升到文件顶部，所以只能用 `vi.fn()` 与动态 import，不能引用外部变量。
vi.mock('../src/factories/createDevice.js', () => ({
  createDeviceWithAdapter: vi.fn(),
}));

vi.mock('../src/webgl2/pipeline/Prewarm.js', () => ({
  prewarmWebGL2RenderPipeline: vi.fn(),
}));

vi.mock('../src/webgpu/pipeline/Prewarm.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/webgpu/pipeline/Prewarm.js')>();
  return {
    ...actual,
    prewarmWebGPURenderPipeline: vi.fn(actual.prewarmWebGPURenderPipeline),
  };
});

import { createDeviceWithAdapter, type CreatedDevice } from '../src/factories/createDevice.js';
import { prewarmWebGL2RenderPipeline } from '../src/webgl2/pipeline/Prewarm.js';
import { prewarmWebGPURenderPipeline } from '../src/webgpu/pipeline/Prewarm.js';
import { Renderer } from '../src/gfx/Renderer.js';
import { defineMaterial, type Material } from '../src/gfx/Material.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { toGPURenderPassDescriptor } from '../src/webgpu/render/WebGPURenderPassEncoder.js';
import {
  createCompilationInfo,
  createCompilationMessage,
  emptyCompilationInfo,
  type CompilationInfo,
  type PrewarmMode,
  type RenderPipelinePrewarmResult,
} from '../src/core/pipeline/CompilationInfo.js';
import type { BackendKind } from '../src/core/Adapter.js';
import type { CanvasContext, CanvasPassDescriptor } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPipeline, RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';
import type { ColorAttachment, DepthStencilAttachment, RenderTarget } from '../src/core/render/RenderTarget.js';

const CANVAS_FORMAT: TextureFormat = 'bgra8unorm';
const DEPTH_FORMAT: TextureFormat = 'depth24plus';

/* ------------------------------------------------------------------------------------------------ */
/* 假 canvas / 假 context                                                                             */
/* ------------------------------------------------------------------------------------------------ */

function createFakeCanvas(): HTMLCanvasElement {
  return {
    width: 8,
    height: 8,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;
}

/**
 * 只实现 `Renderer` 会碰的那几个成员的假 canvas context。
 *
 * 附件列表由测试直接给（`pass()`），于是「variant 是从附件推导出来的」这件事可以被精确控制。
 */
function wrapCanvasContext(input: {
  canvas: HTMLCanvasElement;
  device: Device;
  format: TextureFormat;
  pass: () => CanvasPassDescriptor;
}): CanvasContext {
  return {
    canvas: input.canvas,
    width: 8,
    height: 8,
    pixelRatio: 1,
    format: input.format,
    configured: true,
    device: input.device,
    configure: () => {},
    unconfigure: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    resize: () => false,
    getCurrentFrameTarget: () => {
      throw new Error('[gpu-device-api] test: this fake canvas context has no frame target.');
    },
    createPassDescriptor: input.pass,
    dispose: () => {},
  } as unknown as CanvasContext;
}

/** 用一张「虚拟」纹理拼出的附件（WebGL2 侧只需要 `view.texture.format` / `sampleCount`）。 */
function fakeView(format: TextureFormat, sampleCount = 1): ColorAttachment['view'] {
  return {
    label: `fake:${format}`,
    texture: { format, sampleCount },
    descriptor: { format, dimension: '2d', baseMipLevel: 0, mipLevelCount: 1, baseArrayLayer: 0, arrayLayerCount: 1, aspect: 'all' },
    native: null,
    disposed: false,
    dispose: () => {},
  } as unknown as ColorAttachment['view'];
}

/* ------------------------------------------------------------------------------------------------ */
/* 假 WebGL2 设备                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

interface FakeGlDevice {
  readonly device: Device;
  /** 交给 `device.createRenderPipeline()` 的描述（预热路径**不该**碰它）。 */
  readonly pipelines: RenderPipelineDescriptor[];
}

/**
 * `Renderer` 在预热 WebGL2 时只做三件事：登记材质、算描述、调 helper。
 * 所以这里的假设备只需要「能把 `createPipelineDescriptor()` 跑通」+ 记录建管线调用。
 *
 * `makePipeline` 可以换成一条**没有** `getCompilationInfo` 的管线，用来验证「后端没有诊断能力时
 * 如实说明」这条分支。
 */
function createFakeGlDevice(
  makePipeline: (label: string) => RenderPipeline = (label) => sentinelPipeline(label, 'webgl2'),
): FakeGlDevice {
  const pipelines: RenderPipelineDescriptor[] = [];
  const device = {
    backend: 'webgl2',
    label: 'fake-gl-device',
    createShaderModule: (descriptor: { label?: string }) => ({
      label: descriptor.label ?? 'shader',
      source: {},
      defines: {},
      disposed: false,
      dispose: () => {},
    }),
    createPipelineLayout: (descriptor: { label?: string; bindGroupLayouts: unknown[] }) => ({
      label: descriptor.label ?? 'pipelineLayout',
      bindGroupLayouts: descriptor.bindGroupLayouts,
      native: null,
      isAuto: false,
      disposed: false,
      dispose: () => {},
    }),
    createRenderPipeline: (descriptor: RenderPipelineDescriptor) => {
      pipelines.push(descriptor);
      return makePipeline(descriptor.label ?? 'fake:pipeline');
    },
    queue: { writeBuffer: () => {} },
    dispose: () => {},
  } as unknown as Device;
  return { device, pipelines };
}

/** 一条只用来验证「身份是否被复用」的假管线。 */
function sentinelPipeline(label: string, backend: BackendKind): RenderPipeline {
  return {
    label,
    descriptor: { vertex: { module: {} as never } },
    layout: 'auto',
    vertexLayouts: null,
    compiled: true,
    native: null,
    resolve: () => null,
    dispose: () => {},
    getCompilationInfo: async () => emptyCompilationInfo(label, backend),
  } as unknown as RenderPipeline;
}

/** 一条**不提供** `getCompilationInfo` 的假管线（模拟"这个后端没有诊断能力"）。 */
function noDiagnosticsPipeline(label: string): RenderPipeline {
  return {
    label,
    descriptor: { vertex: { module: {} as never } },
    layout: 'auto',
    vertexLayouts: null,
    compiled: true,
    native: null,
    resolve: () => null,
    dispose: () => {},
  } as unknown as RenderPipeline;
}

/* ------------------------------------------------------------------------------------------------ */
/* 假 WebGPU 设备（原生 GPUDevice 是 mock，包装层是真的）                                              */
/* ------------------------------------------------------------------------------------------------ */

interface MockGpuDevice {
  /** 建好之后回填（`make` 风格）。 */
  device: WebGPUDevice;
  readonly counts: { createRenderPipeline: number; createRenderPipelineAsync: number };
  /** 关掉 `createRenderPipelineAsync`（模拟老实现）。 */
  enableAsync: boolean;
  /** 让 `createRenderPipelineAsync` 拒绝（模拟管线校验/编译失败）。 */
  failAsync: boolean;
}

function createMockGpuDevice(): MockGpuDevice {
  const counts = { createRenderPipeline: 0, createRenderPipelineAsync: 0 };
  const state: MockGpuDevice = { device: null as unknown as WebGPUDevice, counts, enableAsync: true, failAsync: false };

  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    onuncapturederror: null,
    limits: undefined,
    createShaderModule: ({ label }: { label: string }) => ({
      label,
      getCompilationInfo: () =>
        Promise.resolve({
          messages: [
            { type: 'warning', lineNum: 3, linePos: 1, message: 'unused variable', offset: 0, length: 1 },
          ],
        }),
    }),
    createTexture: () => ({ destroy: () => {}, createView: () => ({}) }),
    createRenderPipeline: (descriptor: { label?: string }) => {
      counts.createRenderPipeline += 1;
      return { label: descriptor.label, via: 'sync' };
    },
    destroy: () => {},
  } as unknown as Record<string, unknown>;

  Object.defineProperty(native, 'createRenderPipelineAsync', {
    configurable: true,
    get: () =>
      state.enableAsync
        ? (descriptor: { label?: string }) => {
            counts.createRenderPipelineAsync += 1;
            if (state.failAsync) {
              return Promise.reject(new Error('GPUPipelineError: shader module compilation failed'));
            }
            return Promise.resolve({ label: descriptor.label, via: 'async' });
          }
        : undefined,
  });

  state.device = new WebGPUDevice(native as unknown as GPUDevice, {
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
  return state;
}

/* ------------------------------------------------------------------------------------------------ */
/* 渲染器装配                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

async function createRenderer(input: {
  backend: BackendKind;
  device: Device;
  context: CanvasContext;
}): Promise<Renderer> {
  vi.mocked(createDeviceWithAdapter).mockResolvedValue({
    device: input.device,
    adapter: { backend: input.backend },
    backend: input.backend,
    probes: [],
    context: input.context,
  } as unknown as CreatedDevice);
  // `antialias: false` 是为数不多能让 `Renderer.create()` 不去 configure canvas 的组合之一，
  // 这里正好不需要（上下文是假的，configure 由测试自己控制）。
  return Renderer.create({ canvas: createFakeCanvas(), backend: input.backend, antialias: false });
}

/** 只有 position 一条属性的最小材质：不碰 uniform / 纹理，形状干净好断言。 */
function defineTestMaterial(name: string): Material {
  return defineMaterial({
    name,
    attributes: { position: 'float32x3' },
    glsl: {
      vs: 'void main() { gl_Position = vec4(position, 1.0); }',
      fs: 'void main() { fragColor = vec4(1.0); }',
    },
    wgsl:
      '@vertex fn vsMain(@location(0) position: vec3f) -> @builtin(position) vec4f { return vec4f(position, 1.0); }\n' +
      '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
  });
}

/** 期望的 `vertexLayouts`：`Material.vertexBufferLayouts()` 对单属性缓冲的形状。 */
const POSITION_LAYOUT = [
  { arrayStride: 12, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
];

function prewarmResult(input: {
  label: string;
  ok: boolean;
  mode: PrewarmMode;
  reason?: string | null;
  pipeline: RenderPipeline | null;
  backend?: BackendKind;
  info?: CompilationInfo;
  durationMs?: number;
}): RenderPipelinePrewarmResult {
  const backend = input.backend ?? 'webgl2';
  return {
    label: input.label,
    backend,
    ok: input.ok,
    mode: input.mode,
    reason: input.reason ?? null,
    durationMs: input.durationMs ?? 1,
    info: input.info ?? emptyCompilationInfo(input.label, backend),
    pipeline: input.pipeline,
  };
}

const webgl2Helper = vi.mocked(prewarmWebGL2RenderPipeline);
const webgpuHelper = vi.mocked(prewarmWebGPURenderPipeline);
const createDeviceMock = vi.mocked(createDeviceWithAdapter);

beforeEach(() => {
  webgl2Helper.mockReset();
  // webgpu 的 mock 包着真实实现，只清调用记录（不能 reset，否则真实实现会掉）。
  webgpuHelper.mockClear();
  createDeviceMock.mockReset();
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGL2：分派与「复用 helper 返回的管线」                                                             */
/* ------------------------------------------------------------------------------------------------ */

describe('Renderer.prewarm() 在 WebGL2 上的分派', () => {
  it('调用 prewarmWebGL2RenderPipeline，并把它的管线交给绘制路径（不自己再造一条）', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({
        // GL 的画布 context 开了 antialias，这里故意把纹理采样数写成 4：
        // WebGL2 的渲染通道解析器仍然按 1 解析 variant，预热必须跟它一致。
        colorAttachments: [{ view: fakeView('rgba8unorm', 4), loadOp: 'clear', storeOp: 'store' }],
        depthStencilAttachment: { view: fakeView(DEPTH_FORMAT), depthLoadOp: 'clear', depthStoreOp: 'store' },
      }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const material = defineTestMaterial('lambert');
    const pipeline = sentinelPipeline('lambert:pipeline', 'webgl2');
    webgl2Helper.mockResolvedValue(
      prewarmResult({ label: 'lambert:pipeline', ok: true, mode: 'async', pipeline, durationMs: 3.5 }),
    );

    const report = await renderer.prewarm({ materials: [material], timeoutMs: 1234 });

    // 分派：只碰 WebGL2 的 helper，且 options 原样透传。
    expect(webgl2Helper).toHaveBeenCalledTimes(1);
    expect(webgpuHelper).not.toHaveBeenCalled();
    const [deviceArgument, descriptor, prewarmOptions] = webgl2Helper.mock.calls[0]!;
    expect(deviceArgument).toBe(gl.device);
    expect(descriptor.label).toBe('lambert:pipeline');
    expect(prewarmOptions).toEqual({ timeoutMs: 1234 });

    // variant 与绘制时一致：顶点布局就是 `acquirePipeline()` 那份描述里的同一个数组。
    expect(report.variant!.vertexLayouts).toBe(descriptor.vertex.buffers);
    expect(report.variant!.vertexLayouts).toEqual(POSITION_LAYOUT);
    expect(report.variant).toEqual({
      colorFormats: ['rgba8unorm'],
      sampleCount: 1,
      depthFormat: DEPTH_FORMAT,
      vertexLayouts: POSITION_LAYOUT,
    });

    // 结果：helper 的管线被原样交回（绘制路径拿到的是同一条），而设备没有被要求再建一条。
    expect(report.backend).toBe('webgl2');
    expect(report.ok).toBe(true);
    expect(report.mode).toBe('async');
    expect(report.reason).toBeNull();
    expect(report.prewarmed).toBe(1);
    expect(report.skipped).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.results[0]!.pipeline).toBe(pipeline);
    expect(report.results[0]!.variant).toEqual(report.variant);
    expect(gl.pipelines).toHaveLength(0);

    renderer.destroy();
  });

  it('传 target 时 variant 用目标声明的采样数（多重采样目标）', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    // canvas 的附件是单采样的：如果预热错用了 canvas，sampleCount 会是 1。
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({
        colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }],
        depthStencilAttachment: null,
      }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const material = defineTestMaterial('offscreen');
    webgl2Helper.mockResolvedValue(
      prewarmResult({
        label: 'offscreen:pipeline',
        ok: true,
        mode: 'sync',
        reason: 'no extension',
        pipeline: sentinelPipeline('offscreen:pipeline', 'webgl2'),
      }),
    );

    // `Renderer.createPassDescriptor()` 会调用 `target.createPassDescriptor()`，假的也要有。
    const target = {
      label: 'offscreen',
      sampleCount: 4,
      createPassDescriptor: () => ({
        colorAttachments: [{ view: fakeView('rgba8unorm', 4), loadOp: 'clear', storeOp: 'store' }],
        depthStencilAttachment: null,
      }),
    } as unknown as RenderTarget;
    const report = await renderer.prewarm({ materials: [material], target });

    expect(webgl2Helper.mock.calls[0]![1].vertex.buffers).toEqual(POSITION_LAYOUT);
    expect(report.variant).toEqual({
      colorFormats: ['rgba8unorm'],
      sampleCount: 4,
      depthFormat: null,
      vertexLayouts: POSITION_LAYOUT,
    });
    // 同步降级要如实透出：mode 与原因都在汇总与明细里。
    expect(report.mode).toBe('sync');
    expect(report.reason).toBe('no extension');
    expect(report.results[0]!.mode).toBe('sync');
    expect(report.results[0]!.reason).toBe('no extension');

    renderer.destroy();
  });

  it('省略 materials 时预热全部已登记的材质', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({ colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }], depthStencilAttachment: null }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const first = renderer.createMaterial(defineTestMaterial('first'));
    const second = renderer.createMaterial(defineTestMaterial('second'));
    webgl2Helper.mockImplementation(async (_device, descriptor) =>
      prewarmResult({
        label: descriptor.label ?? 'pipeline',
        ok: true,
        mode: 'async',
        pipeline: sentinelPipeline(descriptor.label ?? 'pipeline', 'webgl2'),
      }),
    );

    const report = await renderer.prewarm();

    expect(webgl2Helper).toHaveBeenCalledTimes(2);
    expect(report.prewarmed).toBe(2);
    expect(report.results.map((result) => result.material)).toEqual([first, second]);

    renderer.destroy();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 不重复预热 / 失败不抛                                                                              */
/* ------------------------------------------------------------------------------------------------ */

describe('Renderer.prewarm() 的跳过与失败路径', () => {
  it('已建过管线的材质被跳过：helper 不再调用，管线对象原样复用', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({ colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }], depthStencilAttachment: null }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const warm = defineTestMaterial('warm');
    const cold = defineTestMaterial('cold');
    const pipeline = sentinelPipeline('warm:pipeline', 'webgl2');
    webgl2Helper.mockImplementation(async (_device, descriptor) =>
      prewarmResult({
        label: descriptor.label ?? 'pipeline',
        ok: true,
        mode: 'async',
        pipeline: descriptor.label === 'warm:pipeline' ? pipeline : sentinelPipeline('cold:pipeline', 'webgl2'),
      }),
    );

    const firstReport = await renderer.prewarm({ materials: [warm] });
    expect(firstReport.results[0]!.skipped).toBe(false);

    const secondReport = await renderer.prewarm({ materials: [warm, cold] });

    // warm 已经建过：跳过，不重复预热；cold 仍然被预热。
    expect(webgl2Helper).toHaveBeenCalledTimes(2);
    expect(secondReport.prewarmed).toBe(1);
    expect(secondReport.skipped).toBe(1);
    expect(secondReport.results[0]!.skipped).toBe(true);
    expect(secondReport.results[0]!.mode).toBeNull();
    expect(secondReport.results[0]!.reason).toMatch(/already built/);
    expect(secondReport.results[0]!.pipeline).toBe(pipeline);
    expect(secondReport.results[0]!.variant).toBeNull();
    // 跳过时仍然能拿到诊断（来自那条已有管线）。
    expect(secondReport.results[0]!.info.label).toBe('warm:pipeline');
    expect(secondReport.results[1]!.skipped).toBe(false);

    // 全部跳过时：没有发生任何编译，整体 mode 如实为 null。
    const thirdReport = await renderer.prewarm({ materials: [warm, cold] });
    expect(thirdReport.prewarmed).toBe(0);
    expect(thirdReport.skipped).toBe(2);
    expect(thirdReport.mode).toBeNull();
    expect(thirdReport.variant).toBeNull();
    expect(webgl2Helper).toHaveBeenCalledTimes(2);

    renderer.destroy();
  });

  it('helper 返回 ok:false 时不抛错、诊断可读，之后仍能走正常路径建管线', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({ colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }], depthStencilAttachment: null }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const broken = defineTestMaterial('broken');
    const info = createCompilationInfo({
      label: 'broken:pipeline',
      backend: 'webgl2',
      messages: [
        createCompilationMessage({
          type: 'error',
          label: 'broken:pipeline',
          backend: 'webgl2',
          message: "'brokenSymbol' : undeclared identifier",
          lineNum: 6,
        }),
      ],
      rawLogs: ['ERROR: 0:6: \'brokenSymbol\' : undeclared identifier'],
    });
    webgl2Helper.mockResolvedValue(
      prewarmResult({
        label: 'broken:pipeline',
        ok: false,
        mode: 'sync',
        reason: 'shader compilation failed (see info)',
        pipeline: null,
        info,
      }),
    );

    const report = await renderer.prewarm({ materials: [broken], throwOnError: false });

    expect(report.ok).toBe(false);
    expect(report.failed).toBe(1);
    expect(report.prewarmed).toBe(0);
    expect(report.mode).toBe('sync');
    expect(report.reason).toBe('shader compilation failed (see info)');
    expect(webgl2Helper.mock.calls[0]![2]).toEqual({ throwOnError: false });

    const result = report.results[0]!;
    expect(result.ok).toBe(false);
    expect(result.pipeline).toBeNull();
    expect(result.reason).toMatch(/compilation failed/);
    expect(result.info.hasErrors).toBe(true);
    expect(result.info.messages[0]).toMatchObject({
      type: 'error',
      lineNum: 6,
      message: "'brokenSymbol' : undeclared identifier",
    });

    // 失败没有污染状态：诊断入口会**再走一次预热路径**（WebGL2 上必须先真的链接一次 program
    // 才有日志可读），仍然不抛，并把同一份带行号的诊断交回。
    const diagnostic = await renderer.compilationInfo(broken);
    expect(webgl2Helper).toHaveBeenCalledTimes(2);
    expect(gl.pipelines).toHaveLength(0);
    expect(diagnostic.hasErrors).toBe(true);
    expect(diagnostic.messages[0]).toMatchObject({
      type: 'error',
      lineNum: 6,
      message: "'brokenSymbol' : undeclared identifier",
    });

    renderer.destroy();
  });

  it('后端不提供 getCompilationInfo 时如实说明（而不是假装「编译干净」）', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({ colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }], depthStencilAttachment: null }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const material = defineTestMaterial('plain');
    webgl2Helper.mockResolvedValue(
      prewarmResult({ label: 'plain:pipeline', ok: true, mode: 'async', pipeline: noDiagnosticsPipeline('plain:pipeline') }),
    );

    await renderer.prewarm({ materials: [material] });
    const diagnostic = await renderer.compilationInfo(material);

    // 管线已经在了：诊断入口不再预热一次。
    expect(webgl2Helper).toHaveBeenCalledTimes(1);
    expect(diagnostic.backend).toBe('webgl2');
    expect(diagnostic.hasErrors).toBe(false);
    expect(diagnostic.messages).toHaveLength(1);
    expect(diagnostic.messages[0]!.type).toBe('info');
    expect(diagnostic.messages[0]!.message).toMatch(/does not expose getCompilationInfo/);

    renderer.destroy();
  });

  it('throwOnError 只在显式要求时透传（默认永远是 false）', async () => {
    const gl = createFakeGlDevice();
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: gl.device,
      format: 'rgba8unorm',
      pass: () => ({ colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }], depthStencilAttachment: null }),
    });
    const renderer = await createRenderer({ backend: 'webgl2', device: gl.device, context });
    const first = defineTestMaterial('plain');
    const second = defineTestMaterial('thrower');
    webgl2Helper.mockImplementation(async (_device, descriptor) =>
      prewarmResult({
        label: descriptor.label ?? 'pipeline',
        ok: true,
        mode: 'async',
        pipeline: sentinelPipeline(descriptor.label ?? 'pipeline', 'webgl2'),
      }),
    );

    await renderer.prewarm({ materials: [first] });
    // 不传就是空对象：没有偷偷替调用方打开抛错。
    expect(webgl2Helper.mock.calls[0]![2]).toEqual({});

    await renderer.prewarm({ materials: [second], throwOnError: true });
    expect(webgl2Helper.mock.calls[1]![2]).toEqual({ throwOnError: true });

    renderer.destroy();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGPU：真实 helper + 真实渲染通道解析器当 oracle                                                    */
/* ------------------------------------------------------------------------------------------------ */

describe('Renderer.prewarm() 在 WebGPU 上（真实 helper）', () => {
  /** 一套画布附件（MSAA 4x + 深度），既给假 context 用，也给真实的渲染通道解析器当 oracle。 */
  function createCanvasAttachments(device: WebGPUDevice): {
    colorAttachments: readonly ColorAttachment[];
    depthStencilAttachment: DepthStencilAttachment;
  } {
    const size = { width: 8, height: 8, depthOrArrayLayers: 1 };
    const multisampled = device.createTexture({
      label: 'canvas#msaa',
      size,
      format: CANVAS_FORMAT,
      usage: TextureUsage.RenderAttachment,
      sampleCount: 4,
    });
    const resolve = device.createTexture({
      label: 'canvas',
      size,
      format: CANVAS_FORMAT,
      usage: TextureUsage.RenderAttachment,
    });
    const depth = device.createTexture({
      label: 'canvas#depth',
      size,
      format: DEPTH_FORMAT,
      usage: TextureUsage.RenderAttachment,
      sampleCount: 4,
    });
    return {
      colorAttachments: [
        { view: multisampled.createView(), resolveTarget: resolve.createView(), loadOp: 'clear', storeOp: 'store' },
      ],
      depthStencilAttachment: {
        view: depth.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1,
      },
    };
  }

  it('variant 与渲染通道解析器（toGPURenderPassDescriptor.layout）逐字段一致，且预热后 resolve 零编译', async () => {
    const mock = createMockGpuDevice();
    const attachments = createCanvasAttachments(mock.device);
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({
      canvas,
      device: mock.device,
      format: CANVAS_FORMAT,
      pass: () => attachments,
    });
    const renderer = await createRenderer({ backend: 'webgpu', device: mock.device, context });
    const material = defineTestMaterial('lit');

    const report = await renderer.prewarm({ materials: [material] });

    // 分派到 WebGPU 的 helper，并且它收到的是真实实现。
    expect(webgpuHelper).toHaveBeenCalledTimes(1);
    expect(webgl2Helper).not.toHaveBeenCalled();
    const [, descriptor, variant, options] = webgpuHelper.mock.calls[0]!;
    expect(descriptor.label).toBe('lit:pipeline');
    expect(options).toEqual({});

    // oracle：渲染通道 `setPipeline` 时用的就是这份 layout。
    const oracle = toGPURenderPassDescriptor(
      {
        label: 'oracle',
        colorAttachments: attachments.colorAttachments,
        depthStencilAttachment: attachments.depthStencilAttachment,
      },
      mock.device,
    ).layout;

    expect(oracle).toEqual({ colorFormats: [CANVAS_FORMAT], sampleCount: 4, depthFormat: DEPTH_FORMAT });
    expect(variant).toEqual({
      colorFormats: oracle.colorFormats,
      sampleCount: oracle.sampleCount,
      depthFormat: oracle.depthFormat,
      vertexLayouts: POSITION_LAYOUT,
    });
    // 顶点布局与 `acquirePipeline()` 交给 `createRenderPipeline()` 的是同一个数组（对象身份）。
    expect(variant!.vertexLayouts).toBe(descriptor.vertex.buffers);
    expect(report.variant).toEqual(variant);

    // 结果：真异步、ok、拿到管线；原生侧只走了异步创建这条路。
    expect(report.ok).toBe(true);
    expect(report.mode).toBe('async');
    expect(report.reason).toBeNull();
    expect(report.prewarmed).toBe(1);
    expect(mock.counts.createRenderPipelineAsync).toBe(1);
    expect(mock.counts.createRenderPipeline).toBe(0);
    const pipeline = report.results[0]!.pipeline!;
    expect(pipeline).not.toBeNull();
    expect(report.results[0]!.variant).toEqual(variant);

    // 绘制路径解析同一个 variant：直接命中预热出来的原生管线，一次编译调用都不产生。
    expect((pipeline.resolve(variant) as { via?: string }).via).toBe('async');
    expect(mock.counts.createRenderPipeline).toBe(0);
    expect(mock.counts.createRenderPipelineAsync).toBe(1);

    // 诊断入口从 gfx 层直接可用，且不会再建管线。
    const info = await renderer.compilationInfo(material);
    expect(info.backend).toBe('webgpu');
    expect(info.messages.some((message) => message.type === 'warning')).toBe(true);
    expect(mock.counts.createRenderPipelineAsync).toBe(1);
    expect(mock.counts.createRenderPipeline).toBe(0);

    renderer.destroy();
  });

  it('createRenderPipelineAsync 拒绝时：不抛、ok=false、状态不被污染（下次预热会重试）', async () => {
    const mock = createMockGpuDevice();
    mock.failAsync = true;
    const attachments = createCanvasAttachments(mock.device);
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({ canvas, device: mock.device, format: CANVAS_FORMAT, pass: () => attachments });
    const renderer = await createRenderer({ backend: 'webgpu', device: mock.device, context });
    const material = defineTestMaterial('failing');

    const report = await renderer.prewarm({ materials: [material] });

    expect(report.ok).toBe(false);
    expect(report.failed).toBe(1);
    // 失败发生在**异步**创建里：`mode` 仍然如实是 'async'（它等的确实是那条异步路径），
    // 「为什么没成功」在 reason 里，而不是靠把 mode 改成 sync 来表达。
    expect(report.mode).toBe('async');
    expect(report.reason).toContain('GPUPipelineError');
    expect(report.results[0]!.pipeline).toBeNull();
    expect(report.results[0]!.reason).toContain('GPUPipelineError');
    expect(report.results[0]!.info.hasErrors).toBe(true);
    expect(mock.counts.createRenderPipelineAsync).toBe(1);

    // 没有留下管线 → 下一次预热会再试一次（而不是被当成"已建好"跳过）。
    const retry = await renderer.prewarm({ materials: [material] });
    expect(retry.results[0]!.skipped).toBe(false);
    expect(mock.counts.createRenderPipelineAsync).toBe(2);

    renderer.destroy();
  });

  it('传 throwOnError 时才抛（默认不抛），错误带 [gpu-device-api] 前缀', async () => {
    const mock = createMockGpuDevice();
    mock.failAsync = true;
    const attachments = createCanvasAttachments(mock.device);
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({ canvas, device: mock.device, format: CANVAS_FORMAT, pass: () => attachments });
    const renderer = await createRenderer({ backend: 'webgpu', device: mock.device, context });
    const material = defineTestMaterial('thrower');

    await expect(renderer.prewarm({ materials: [material], throwOnError: true })).rejects.toThrowError(
      /^\[gpu-device-api\] compilation info/,
    );

    renderer.destroy();
  });

  it('已建过管线时跳过（WebGPU 同样不重复预热）', async () => {
    const mock = createMockGpuDevice();
    const attachments = createCanvasAttachments(mock.device);
    const canvas = createFakeCanvas();
    const context = wrapCanvasContext({ canvas, device: mock.device, format: CANVAS_FORMAT, pass: () => attachments });
    const renderer = await createRenderer({ backend: 'webgpu', device: mock.device, context });
    const material = defineTestMaterial('twice');

    const first = await renderer.prewarm({ materials: [material] });
    const second = await renderer.prewarm({ materials: [material] });

    expect(first.results[0]!.skipped).toBe(false);
    expect(second.skipped).toBe(1);
    expect(second.prewarmed).toBe(0);
    expect(second.results[0]!.pipeline).toBe(first.results[0]!.pipeline);
    expect(webgpuHelper).toHaveBeenCalledTimes(1);
    expect(second.results[0]!.mode).toBeNull();

    renderer.destroy();
  });
});
