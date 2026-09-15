/**
 * GPU 计时（gfx）的**能力判定**与**失败模式**单测 —— 对应一次实测缺陷。
 *
 * ## 缺陷原文
 *
 * 用户机器上打开 `examples/gfx-benchmark.html` **整页失败**，报：
 *
 * ```
 * [gpu-device-api] gfx-frame.writeTimestamp: this WebGPU implementation does not expose
 * GPUCommandEncoder.writeTimestamp(). Use RenderPassDescriptor.timestampWrites instead ...
 * ```
 *
 * ## 根因与两个要修的点
 *
 * 1. **能力误判**：那份 Chrome 上设备启用了 `timestamp-query`（`createQuerySet()` 正常），
 *    但 `GPUCommandEncoder` 上**没有** `writeTimestamp` 方法。旧判据只看特性标志，于是把这种
 *    设备判成「可用」；
 * 2. **失败模式**：可选的分析能力写时间戳失败时异常逃进帧循环，把整页渲染搞挂。
 *
 * 所以这里有四组测试：
 *
 * - 用桩把原生设备造成「特性已启用、但没有 `writeTimestamp`」的**确定性复现**（不依赖恰好遇到）；
 * - 新判据（真实 API 表面）与「可用路径没被改坏」；
 * - `Renderer.create({ gpuTiming: true })` 的尽力而为语义：不抛、`enabled: false`、`error` 可读；
 * - 运行中失败的自愈：计时自动关闭、`gpuFrameTime` 变 null、渲染与 draw call 计数不受影响。
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

// 先声明 mock：工厂函数会被提升到文件顶部，所以只能用 `vi.fn()`，不能引用外部变量。
vi.mock('../src/factories/createDevice.js', () => ({
  createDeviceWithAdapter: vi.fn(),
}));

import { createDeviceWithAdapter, type CreatedDevice } from '../src/factories/createDevice.js';
import { GpuTiming, gpuTimingPath, type GpuTimingOptions } from '../src/gfx/GpuTiming.js';
import { Renderer } from '../src/gfx/Renderer.js';
import { defineMaterial, type Material } from '../src/gfx/Material.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { QueryType } from '../src/core/resources/QuerySet.js';
import type { BackendKind } from '../src/core/Adapter.js';
import type { CanvasContext, CanvasPassDescriptor } from '../src/core/CanvasContext.js';
import type { Device, DeviceTimingSupport } from '../src/core/Device.js';
import type { RenderPipeline, RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';
import type { ColorAttachment } from '../src/core/render/RenderTarget.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------------------------------------ */
/* 一、确定性复现：设备启用了 timestamp-query，但实现没有 writeTimestamp                                  */
/* ------------------------------------------------------------------------------------------------ */

/** 原生 encoder 上 `writeTimestamp` 的三种状态：不存在 / 存在 / 存在但会抛。 */
type NativeWriteMode = 'absent' | 'present' | 'throwing';

interface MockGpuDevice {
  readonly device: WebGPUDevice;
  /** 原生 `writeTimestamp` 被调用的下标（不存在时永远不会增长）。 */
  readonly writes: number[];
}

/**
 * 造一个 mock 原生 `GPUDevice`，足以让 `WebGPUDevice` 建起来并跑到写时间戳那一步。
 *
 * `features` 里**始终包含** `timestamp-query`（也就是设备确实启用了它）：这正是用户那份 Chrome
 * 的状态，也是「只看特性标志就会误判」的那个状态。
 */
function createMockGpuDevice(mode: NativeWriteMode): MockGpuDevice {
  const writes: number[] = [];
  const state = { writes };
  const nativeEncoder: Record<string, unknown> = {
    label: 'mock-encoder',
    resolveQuerySet: () => {},
    copyBufferToBuffer: () => {},
    finish: () => ({ label: 'mock-command-buffer' }),
  };
  if (mode !== 'absent') {
    nativeEncoder.writeTimestamp = (_querySet: unknown, index: number) => {
      if (mode === 'throwing') {
        throw new Error('[gpu-device-api] mock: this encoder cannot write timestamps.');
      }
      state.writes.push(index);
    };
  }

  const native = {
    label: 'mock-device',
    queue: { submit: () => {}, getTimestampPeriod: () => 1 },
    lost: new Promise(() => {}),
    limits: undefined,
    features: new Set(['timestamp-query']),
    onuncapturederror: null,
    createBuffer: (descriptor: { label?: string; size: number }) => ({
      label: descriptor.label ?? 'native-buffer',
      size: descriptor.size,
      destroy: () => {},
    }),
    createCommandEncoder: () => nativeEncoder,
    createQuerySet: (descriptor: { label?: string; type: string; count: number }) => ({
      label: descriptor.label,
      type: descriptor.type,
      count: descriptor.count,
      destroy: () => {},
    }),
    destroy: () => {},
  } as unknown as GPUDevice;

  const device = new WebGPUDevice(native, {
    descriptor: { label: 'mock-device', defaultSampleCount: 1, requiredFeatures: ['timestamp-query'] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    // adapter 支持，且设备也申请启用了它。
    adapterFeatures: new Set(['timestamp-query']),
  });

  return { device, writes };
}

describe('复现：设备启用了 timestamp-query，但实现没有 writeTimestamp', () => {
  it('旧的判据说「可用」，真实写入路径却必然抛 —— 这就是整页失败的根因', () => {
    const mock = createMockGpuDevice('absent');

    // 旧判据（`GpuTiming.isAvailable` 曾经就是这一句）：
    expect(mock.device.features.has('timestamp-query')).toBe(true);
    expect(mock.device.hasEnabledFeature('timestamp-query')).toBe(true);

    // 真实调用面：encoder 上没有这个方法，写时间戳必然抛（消息就是用户看到的那条）。
    const querySet = mock.device.createQuerySet({ type: QueryType.Timestamp, count: 2 });
    const encoder = mock.device.createCommandEncoder({ label: 'gfx-frame' });
    expect(() => encoder.writeTimestamp(querySet, 0)).toThrow(
      /does not expose GPUCommandEncoder\.writeTimestamp\(\)/,
    );
    expect(mock.writes).toEqual([]);
    mock.device.dispose();
  });

  it('新判据探测真实 API 表面：encoder 时间戳不可用，并给出「缺什么」的原因', () => {
    const mock = createMockGpuDevice('absent');
    expect(mock.device.timing.encoderTimestamps).toBe(false);
    // pass 内时间戳也没启用（那需要另一个 feature），所以两条路都不通。
    expect(mock.device.timing.passTimestamps).toBe(false);
    expect(mock.device.timing.unavailableReason).toMatch(/does not have the "timestamp-query" feature|does not expose/);
    expect(gpuTimingPath(mock.device)).toBe('none');
    expect(GpuTiming.isAvailable(mock.device)).toBe(false);
    mock.device.dispose();
  });

  it('构造 GpuTiming 时**在启用处**就抛，而不是等到记时间戳（消息带前缀、说明缺什么）', () => {
    const mock = createMockGpuDevice('absent');
    let message = '';
    try {
      new GpuTiming(mock.device);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/^\[gpu-device-api\] /);
    expect(message).toMatch(/writeTimestamp|timestamp-query/);
    // 一次时间戳都没写过：失败点前移到了启用处。
    expect(mock.writes).toEqual([]);
    mock.device.dispose();
  });

  it('可用路径没被改坏：writeTimestamp 存在时判定为可用，写入照常落到 encoder 上', () => {
    const mock = createMockGpuDevice('present');
    expect(mock.device.timing.encoderTimestamps).toBe(true);
    expect(mock.device.timing.unavailableReason).toBeNull();
    expect(gpuTimingPath(mock.device)).toBe('encoder');
    expect(GpuTiming.isAvailable(mock.device)).toBe(true);

    const timing = new GpuTiming(mock.device, { frames: 4, delay: 1 });
    expect(timing.path).toBe('encoder');
    expect(timing.slotStride).toBe(2);
    timing.beforeFrame({
      writeTimestamp: (querySet, index) => mock.device.createCommandEncoder().writeTimestamp(querySet, index),
    });
    timing.afterFrameEncoding({
      writeTimestamp: (querySet, index) => mock.device.createCommandEncoder().writeTimestamp(querySet, index),
    });
    expect(mock.writes).toEqual([0, 1]);
    timing.destroy();
    mock.device.dispose();
  });

  it('方法只挂在原型上（实例上没有）时也判为可用：探测会退回原型查询', () => {
    vi.stubGlobal('GPUCommandEncoder', { prototype: { writeTimestamp: () => {} } });
    const mock = createMockGpuDevice('absent');
    expect(mock.device.timing.encoderTimestamps).toBe(true);
    mock.device.dispose();
  });

  it('设备没启用 timestamp-query 时给出的原因指向 requiredFeatures（与「实现没暴露方法」分开）', () => {
    const mock = createMockGpuDevice('absent');
    const native = (mock.device as unknown as { native: GPUDevice }).native;
    (native as unknown as { features: Set<string> }).features = new Set<string>();
    // 重建一次设备，让探测在「features 为空」的状态下跑。
    const withoutFeature = new WebGPUDevice(native, {
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
      adapterFeatures: new Set(['timestamp-query']),
    });
    expect(withoutFeature.timing.encoderTimestamps).toBe(false);
    expect(withoutFeature.timing.unavailableReason).toMatch(/does not have the "timestamp-query" feature/);
    expect(withoutFeature.timing.unavailableReason).toMatch(/supports it: yes/);
    mock.device.dispose();
    withoutFeature.dispose();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 二、Renderer 的三条路径：创建时尽力而为 / 显式启用 / 运行中失败自愈                                     */
/* ------------------------------------------------------------------------------------------------ */

function createFakeCanvas(): HTMLCanvasElement {
  return {
    width: 64,
    height: 32,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;
}

/** 一张「虚拟」纹理的附件 view（渲染器只读它的 `texture.format` / `sampleCount` / `descriptor.format`）。 */
function fakeView(format: TextureFormat): ColorAttachment['view'] {
  return {
    label: `fake:${format}`,
    texture: { format, sampleCount: 1 },
    descriptor: {
      format,
      dimension: '2d',
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
      aspect: 'all',
    },
    native: null,
    disposed: false,
    dispose: () => {},
  } as unknown as ColorAttachment['view'];
}

/** 只实现渲染器会碰的那几个成员的假 canvas context。 */
function createFakeContext(device: Device): CanvasContext {
  return {
    canvas: createFakeCanvas(),
    width: 64,
    height: 32,
    pixelRatio: 1,
    format: 'bgra8unorm' as TextureFormat,
    configured: true,
    device,
    configure: () => {},
    unconfigure: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    resize: () => false,
    getCurrentFrameTarget: () => {
      throw new Error('[gpu-device-api] test: this fake canvas context has no frame target.');
    },
    createPassDescriptor: (): CanvasPassDescriptor => ({
      colorAttachments: [{ view: fakeView('bgra8unorm' as TextureFormat), loadOp: 'clear', storeOp: 'store' }],
      depthStencilAttachment: null,
    }),
    dispose: () => {},
  } as unknown as CanvasContext;
}

interface FakeFrameDevice {
  readonly device: Device;
  /** 原生 encoder 的 `writeTimestamp` 实际被调用的下标。 */
  readonly writes: number[];
  /** 渲染通道里真实发生的 draw 次数（证明渲染没有被计时拖累）。 */
  readonly draws: number;
  /** 让第 `call`（1 起）次原生 `writeTimestamp` 抛错；省略时下一次就抛。 */
  failWriteCall(call?: number): void;
}

/**
 * 造一个「足够跑完 beginFrame → draw → endFrame」的假设备（没有 GPU，只有记账）。
 *
 * `timing` 由测试给：于是「后端探测说什么」与「真正写时间戳会怎样」可以分别控制 ——
 * 这正是运行中失败（探测说可用、写的时候炸）所需要的组合。
 */
function createFakeFrameDevice(timing: DeviceTimingSupport): FakeFrameDevice {
  const writes: number[] = [];
  let callCount = 0;
  let failAt: number | null = null;
  let draws = 0;

  const makeBuffer = (label: string, size: number): Record<string, unknown> => ({
    label,
    size,
    usage: 0,
    destroy: () => {},
    dispose: () => {},
  });

  const pass = {
    setPipeline: () => {},
    setBindGroup: () => {},
    setVertexBuffer: () => {},
    setIndexBuffer: () => {},
    draw: () => {
      draws += 1;
    },
    drawIndexed: () => {
      draws += 1;
    },
    end: () => {},
  };

  const encoder = {
    label: 'gfx-frame',
    beginRenderPass: () => pass,
    finish: () => ({ label: 'fake-command-buffer' }),
    writeTimestamp: (_querySet: unknown, index: number) => {
      callCount += 1;
      if (failAt !== null && callCount === failAt) {
        failAt = null;
        throw new Error('[gpu-device-api] mock encoder: writeTimestamp failed at runtime.');
      }
      writes.push(index);
    },
  };

  const device = {
    label: 'fake-webgpu-device',
    backend: 'webgpu' as BackendKind,
    // 特性标志照旧「声称支持」，真实能力由 timing 表达 —— 两者故意不一致，用来钉死「只看标志」的错法。
    features: { has: () => true, names: ['timestamp-query'] },
    limits: { minUniformBufferOffsetAlignment: 256 },
    timing,
    createBuffer: (descriptor: { label?: string; size?: number }) =>
      makeBuffer(descriptor.label ?? 'buffer', descriptor.size ?? 256),
    createShaderModule: (descriptor: { label?: string }) => ({
      label: descriptor.label ?? 'shader',
      source: {},
      defines: {},
      disposed: false,
      dispose: () => {},
    }),
    createBindGroupLayout: (descriptor: { label?: string; entries: unknown[] }) => ({
      label: descriptor.label ?? 'layout',
      entries: descriptor.entries,
      group: 0,
      sortedEntries: descriptor.entries,
      native: null,
      disposed: false,
      dispose: () => {},
    }),
    createBindGroup: (descriptor: { label?: string; entries: unknown[] }) => ({
      label: descriptor.label ?? 'bindGroup',
      entries: descriptor.entries,
      native: null,
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
    createRenderPipeline: (descriptor: RenderPipelineDescriptor): RenderPipeline =>
      ({
        label: descriptor.label ?? 'pipeline',
        descriptor,
        layout: descriptor.layout ?? 'auto',
        vertexLayouts: null,
        compiled: true,
        native: null,
        resolve: () => null,
        dispose: () => {},
      }) as unknown as RenderPipeline,
    createCommandEncoder: () => encoder,
    createQuerySet: (descriptor: { label?: string; type: QueryType; count: number }) => ({
      label: descriptor.label ?? 'query-set',
      type: descriptor.type,
      count: descriptor.count,
      native: null,
      disposed: false,
      destroy: () => {},
      dispose: () => {},
    }),
    readQuerySet: () => ({
      type: QueryType.Timestamp,
      count: 1,
      timestampPeriod: 1,
      read: async () => new BigUint64Array([1_000_000n]),
    }),
    queue: { submit: () => {}, writeBuffer: () => {}, onSubmittedWorkDone: async () => {} },
    onError: () => () => {},
    reportError: () => {},
    dispose: () => {},
  } as unknown as Device;

  return {
    device,
    writes,
    get draws() {
      return draws;
    },
    failWriteCall(call?: number) {
      failAt = call ?? callCount + 1;
    },
  };
}

/** 只有 position 一条属性的最小材质：不碰 uniform / 纹理，形状干净好断言。 */
function defineTestMaterial(): Material {
  return defineMaterial({
    name: 'timing-test-material',
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

async function createRenderer(input: {
  device: Device;
  gpuTiming?: boolean | GpuTimingOptions;
}): Promise<Renderer> {
  vi.mocked(createDeviceWithAdapter).mockResolvedValue({
    device: input.device,
    adapter: { backend: input.device.backend },
    backend: input.device.backend,
    probes: [],
    context: createFakeContext(input.device),
  } as unknown as CreatedDevice);
  return Renderer.create({
    canvas: createFakeCanvas(),
    backend: input.device.backend,
    // `antialias: false` 让 `Renderer.create()` 不再去 configure canvas（上下文是假的）。
    antialias: false,
    culling: false,
    ...(input.gpuTiming === undefined ? {} : { gpuTiming: input.gpuTiming }),
  });
}

interface FakeScene {
  readonly geometry: ReturnType<Renderer['createGeometry']>;
  readonly material: Material;
}

function prepareScene(renderer: Renderer): FakeScene {
  return {
    geometry: renderer.createGeometry({
      label: 'timing-test-triangle',
      position: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    }),
    material: renderer.createMaterial(defineTestMaterial()),
  };
}

/** 画一帧（一个 draw），返回本帧是否真的画出去了。 */
function drawOneFrame(renderer: Renderer, scene: FakeScene): void {
  renderer.beginFrame({ color: '#000000' });
  renderer.setMaterial(scene.material);
  renderer.draw(scene.geometry);
  renderer.endFrame();
}

const UNAVAILABLE: DeviceTimingSupport = {
  encoderTimestamps: false,
  passTimestamps: false,
  unavailableReason:
    '[gpu-device-api] mock backend: this implementation does not expose GPUCommandEncoder.writeTimestamp().',
};

const ENCODER_OK: DeviceTimingSupport = {
  encoderTimestamps: true,
  passTimestamps: false,
  unavailableReason: null,
};

describe('Renderer.create({ gpuTiming: true })：尽力而为，绝不抛、绝不拖累渲染', () => {
  it('能力不可用时：不抛、enabled=false、error 可读，帧照常渲染且 draw call 计数正常', async () => {
    const fake = createFakeFrameDevice(UNAVAILABLE);
    const renderer = await createRenderer({ device: fake.device, gpuTiming: true });

    expect(renderer.gpuTiming.enabled).toBe(false);
    expect(renderer.gpuTiming.available).toBe(false);
    expect(renderer.gpuTiming.gpuFrameTimeMs).toBeNull();
    expect(renderer.gpuTiming.error).toMatch(/does not expose GPUCommandEncoder\.writeTimestamp/);
    expect(renderer.stats.gpuFrameTime).toBeNull();
    // 一次时间戳都没尝试写：判定发生在启用处。
    expect(fake.writes).toEqual([]);

    const scene = prepareScene(renderer);
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();
    expect(renderer.stats.drawCalls).toBe(1);
    expect(fake.draws).toBe(1);
    expect(renderer.stats.gpuFrameTime).toBeNull();
  });

  it('显式 enableGpuTiming() 在启用时就抛（而不是等到写时间戳才炸）', async () => {
    const fake = createFakeFrameDevice(UNAVAILABLE);
    const renderer = await createRenderer({ device: fake.device });

    expect(() => renderer.enableGpuTiming()).toThrow(
      /\[gpu-device-api\] mock backend: this implementation does not expose GPUCommandEncoder\.writeTimestamp/,
    );
    expect(renderer.gpuTiming.enabled).toBe(false);
    expect(fake.writes).toEqual([]);

    // 抛过之后渲染器仍然可用。
    const scene = prepareScene(renderer);
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();
    expect(renderer.stats.drawCalls).toBe(1);
  });
});

describe('运行中失败自愈：记时间戳抛错后计时被关掉，渲染继续', () => {
  it('帧开始的时间戳抛错：计时禁用、error 可读、gpuFrameTime=null、draw call 计数不受影响', async () => {
    const fake = createFakeFrameDevice(ENCODER_OK);
    const renderer = await createRenderer({ device: fake.device, gpuTiming: true });
    expect(renderer.gpuTiming.enabled).toBe(true);
    expect(renderer.gpuTiming.error).toBeNull();

    const scene = prepareScene(renderer);
    // 第一帧：`beforeFrame` 里的 writeTimestamp 抛错。
    fake.failWriteCall();
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();

    expect(renderer.gpuTiming.enabled).toBe(false);
    expect(renderer.gpuTiming.error).toMatch(/writeTimestamp failed at runtime/);
    expect(renderer.gpuTiming.gpuFrameTimeMs).toBeNull();
    expect(renderer.stats.gpuFrameTime).toBeNull();
    // 渲染与计数完全不受影响。
    expect(renderer.stats.drawCalls).toBe(1);
    expect(fake.draws).toBe(1);
    expect(renderer.stats.frameTime).toBeGreaterThanOrEqual(0);

    // 之后的帧继续渲染，且不再有 GPU 数据（也不会再碰 encoder）。
    drawOneFrame(renderer, scene);
    expect(renderer.stats.drawCalls).toBe(1);
    expect(fake.draws).toBe(2);
    expect(renderer.stats.gpuFrameTime).toBeNull();
    expect(fake.writes).toEqual([]);
  });

  it('帧结束的时间戳抛错（第一帧已成功写了一个）：同样自愈，帧循环不抛', async () => {
    const fake = createFakeFrameDevice(ENCODER_OK);
    const renderer = await createRenderer({ device: fake.device, gpuTiming: true });
    const scene = prepareScene(renderer);

    // 第 2 次调用（`afterFrameEncoding`）才抛：先写出去一个「帧开始」时间戳。
    fake.failWriteCall(2);
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();

    expect(fake.writes).toEqual([0]);
    expect(renderer.gpuTiming.enabled).toBe(false);
    expect(renderer.gpuTiming.error).toMatch(/writeTimestamp failed at runtime/);
    expect(renderer.stats.drawCalls).toBe(1);
    expect(renderer.stats.gpuFrameTime).toBeNull();
  });

  it('读回阶段抛错（onFrameSubmitted）：降级成关掉计时并记录 error，渲染继续', async () => {
    const fake = createFakeFrameDevice(ENCODER_OK);
    // delay=1 才能在第一帧之后就去读回（默认 delay 是 8，前几帧只写不读）。
    const renderer = await createRenderer({ device: fake.device, gpuTiming: { frames: 4, delay: 1 } });
    const scene = prepareScene(renderer);

    // 让 device.readQuerySet 同步抛错：Renderer 必须把它降级成「关掉计时」而不是断帧。
    (fake.device as unknown as { readQuerySet: () => never }).readQuerySet = () => {
      throw new Error('[gpu-device-api] mock: readQuerySet is unavailable.');
    };
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();
    // 第 1 帧只写时间戳、不读回；第 2 帧提交后才轮到读回，那里抛错。
    expect(renderer.gpuTiming.enabled).toBe(true);
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();

    expect(renderer.gpuTiming.enabled).toBe(false);
    expect(renderer.gpuTiming.error).toMatch(/readQuerySet is unavailable/);
    expect(renderer.stats.drawCalls).toBe(1);
    expect(renderer.stats.gpuFrameTime).toBeNull();

    // 之后照常渲染。
    expect(() => drawOneFrame(renderer, scene)).not.toThrow();
    expect(renderer.stats.drawCalls).toBe(1);
    expect(fake.draws).toBe(3);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 三、gpuTimingPath：后端 / 能力组合的映射                                                             */
/* ------------------------------------------------------------------------------------------------ */

describe('gpuTimingPath：按后端挑写入路径', () => {
  it('WebGPU 看 encoder 时间戳；WebGL2 看 pass 时间戳', () => {
    const webgpu = { backend: 'webgpu' as BackendKind, timing: ENCODER_OK } as unknown as Device;
    expect(gpuTimingPath(webgpu)).toBe('encoder');

    const webgl2 = {
      backend: 'webgl2' as BackendKind,
      timing: { encoderTimestamps: true, passTimestamps: true, unavailableReason: null },
    } as unknown as Device;
    // WebGL2 没有 encoder 级时间戳，即使上报里那一项是 true 也走 pass。
    expect(gpuTimingPath(webgl2)).toBe('pass');

    const webgpuPassOnly = {
      backend: 'webgpu' as BackendKind,
      timing: { encoderTimestamps: false, passTimestamps: true, unavailableReason: null },
    } as unknown as Device;
    // gfx 的帧计时在 WebGPU 上只会用 encoder 级时间戳，所以这条路仍然是不可用。
    expect(gpuTimingPath(webgpuPassOnly)).toBe('none');
  });

  it('后端没上报 timing（第三方 Device / 测试桩）时按不可用处理，不假设它能用', () => {
    const legacy = { backend: 'webgpu' as BackendKind } as unknown as Device;
    expect(gpuTimingPath(legacy)).toBe('none');
    expect(GpuTiming.isAvailable(legacy)).toBe(false);
    expect(() => new GpuTiming(legacy)).toThrow(/does not report a usable GPU timing path/);
  });
});
