/**
 * 批 06 · 第二档「行为与校验的一致性对齐」的复现测试（七项）。
 *
 * **本文件的第一版是「先落复现证据」的提交**：写它的时候 `src/` 还没改，
 * 因此每个 `it` 分成两类：
 *
 * | 组 | 含义 |
 * | --- | --- |
 * | `改前差异（复现）` | 把**改前实测**的两后端差异钉住（`git show` 那一次提交可复核） |
 * | `目标契约` | 修完之后必须成立的断言（改前必然失败） |
 *
 * 覆盖的七项：
 * - `#12` 有 pass 打开时 `beginRenderPass` / `finish()` 的行为（WebGPU 隐式结束 vs WebGL2 抛错）
 * - `#14` 上一个 pass 的 scissor 漏进「color 与 depth 都是 load」的 pass
 * - `#15` `clearBuffer` 的范围/4 对齐、`writeBuffer` 的元素对齐只有 WebGPU 有
 * - `#16` disposed 设备上的错误类型（WebGPU `ValidationError` vs WebGL2 `DeviceLostError`）
 * - `#17` WebGL2 `createView({ dimension: 'cube' })` 报的是**误导性的**「维度不一致」
 * - `#18` WebGL2 的 `limits.maxTextureDimension1D` 与实际能力不符
 * - `#19` 给了 `target` 时 `colorAttachments` 非空：WebGPU 静默忽略 vs WebGL2 抛错
 *
 * 全部用 node 侧的假 GL / mock 原生设备取证（不占 GPU、可离线跑，见 00-common 第四节）。
 */

import { describe, expect, it } from 'vitest';

import { DeviceLostError } from '../src/core/errors/DeviceLostError.js';
import { ValidationError } from '../src/core/errors/ValidationError.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import type { RenderPassDescriptor } from '../src/core/render/RenderPassEncoder.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { FramebufferCache } from '../src/webgl2/render/framebuffer-cache.js';
import { WebGL2RenderPassEncoder } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { WebGL2TextureView } from '../src/webgl2/resources/WebGL2TextureView.js';
import type { FakeWebGL2 } from './webgl2-fake-gl.js';
import { GL, createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';

/* ------------------------------------------------------------------ 夹具 ---------------------- */

/** `GL_COLOR` / `GL_DEPTH`：真实 WebGL2 的常量，假 GL 的枚举表里没有（与批 05 的做法一致）。 */
const GL_COLOR = 0x1800;

interface Gl2Harness {
  fake: FakeWebGL2;
  device: WebGL2Device;
  state: GlStateCache;
  options: WebGL2RenderPassOptions;
}

function createGl2Harness(): Gl2Harness {
  const fake = createFakeWebGL2();
  Object.assign(fake.gl as unknown as Record<string, number>, { COLOR: GL_COLOR });
  const state = new GlStateCache(fake.gl);
  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: createFakeCanvas().canvas,
    descriptor: { label: 'consistency-06' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
  const options: WebGL2RenderPassOptions = {
    gl: fake.gl,
    state,
    framebuffers: new FramebufferCache(fake.gl),
    getDefaultSize: () => ({ width: 8, height: 8 }),
  };
  return { fake, device, state, options };
}

function colorView(device: WebGL2Device, label: string): WebGL2TextureView {
  return device.createTexture({
    label,
    format: 'rgba8unorm',
    size: { width: 8, height: 8 },
    usage: TextureUsage.RenderAttachment | TextureUsage.CopySrc,
  }).createView() as WebGL2TextureView;
}

function gl2PassDescriptor(device: WebGL2Device, label: string): RenderPassDescriptor {
  return { label, colorAttachments: [{ view: colorView(device, `${label}-color`) }] };
}

interface MockGpu {
  device: WebGPUDevice;
  /** 原生 `beginRenderPass()` / `beginComputePass()` 的调用次数。 */
  begunPasses(): number;
  /** 原生 `finish()` 的调用次数。 */
  finishedEncoders(): number;
  /** 原生 `clearBuffer()` 收到的 `[offset, size]` 列表。 */
  clearBufferCalls(): [number, number][];
  /** 原生 `queue.writeBuffer()` 收到的 `[bufferOffset, dataOffset, size]`（元素单位）。 */
  writeBufferCalls(): [number, number, number][];
}

function createMockGpu(): MockGpu {
  let begun = 0;
  let finished = 0;
  const clears: [number, number][] = [];
  const writes: [number, number, number][] = [];

  const native = {
    label: 'mock-device',
    queue: {
      submit: () => {},
      writeBuffer: (_buffer: unknown, bufferOffset: number, _data: unknown, dataOffset: number, size: number) => {
        writes.push([bufferOffset, dataOffset, size]);
      },
    },
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: () => ({ label: 'native-buffer', destroy: () => {} }),
    createTexture: () => ({
      label: 'native-texture',
      createView: () => ({ [Symbol.toStringTag]: 'GPUTextureView' }),
      destroy: () => {},
    }),
    createCommandEncoder: () => ({
      label: 'native-encoder',
      beginRenderPass: () => {
        begun += 1;
        return { end: () => {}, setPipeline: () => {} };
      },
      beginComputePass: () => {
        begun += 1;
        return { end: () => {} };
      },
      clearBuffer: (_buffer: unknown, offset: number, size: number) => {
        clears.push([offset, size]);
      },
      finish: () => {
        finished += 1;
        return { label: 'native-command-buffer' };
      },
    }),
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

  return {
    device,
    begunPasses: () => begun,
    finishedEncoders: () => finished,
    clearBufferCalls: () => clears,
    writeBufferCalls: () => writes,
  };
}

/** 直接构造一个 WebGPU `RenderTarget`（不碰原生，只为了拿到 `descriptor.target`）。 */
function gpuRenderTarget(mock: MockGpu): RenderTarget {
  return mock.device.createRenderTarget({
    label: 'gpu-target',
    color: 'rgba8unorm',
    width: 4,
    height: 4,
  });
}

/** WebGL2 上一个「不碰 GL、只记账」的 buffer 替身（校验路径只需要 `size` 与 `upload`）。 */
function gl2BufferStub(label = 'gl-buffer', size = 16): {
  label: string;
  size: number;
  isIndexBuffer: boolean;
  uploads: [number, number][];
  upload(offset: number, data: Uint8Array): void;
} {
  const uploads: [number, number][] = [];
  return {
    label,
    size,
    isIndexBuffer: false,
    uploads,
    upload(offset: number, data: Uint8Array) {
      uploads.push([offset, data.byteLength]);
    },
  };
}

/** 读出被测代码抛出的错误（没抛就返回 null）。 */
function capture(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}

/* ------------------------------------------------------------------ #12 ---------------------- */

describe('#12 有 pass 打开时：beginRenderPass / finish() 的行为', () => {
  it('改前差异（复现）：WebGPU 隐式结束，WebGL2 对「已有打开的 pass」抛 ValidationError', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder({ label: 'gpu-encoder' });
    const target = gpuRenderTarget(mock);
    encoder.beginRenderPass({ label: 'pass-1', colorAttachments: [], target });
    expect(() =>
      encoder.beginRenderPass({ label: 'pass-2', colorAttachments: [], target }),
    ).not.toThrow();
    expect(mock.begunPasses()).toBe(2);
    encoder.finish();
    mock.device.dispose();

    // WebGL2：同样的调用序列抛错 —— 同一份上层代码一边正常一边抛错。
    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: 'gl-encoder' });
    glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'gl-pass-1'));
    expect(() => glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'gl-pass-2'))).toThrow(
      ValidationError,
    );
    gl2.device.dispose();
  });

  it('目标契约：两后端都在 beginRenderPass 时隐式结束上一个 pass（对齐 WebGPU 原生语义）', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder();
    const target = gpuRenderTarget(mock);
    encoder.beginRenderPass({ label: 'p1', colorAttachments: [], target });
    expect(() => encoder.beginRenderPass({ label: 'p2', colorAttachments: [], target })).not.toThrow();
    expect(mock.begunPasses()).toBe(2);
    encoder.finish();
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'g1'));
    expect(() => glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'g2'))).not.toThrow();
    gl2.device.dispose();
  });

  it('改前差异（复现）：finish() 时有未结束的 pass，WebGPU 隐式 end，WebGL2 抛错', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder();
    encoder.beginRenderPass({ colorAttachments: [], target: gpuRenderTarget(mock) });
    expect(() => encoder.finish()).not.toThrow();
    expect(mock.finishedEncoders()).toBe(1);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'open'));
    expect(() => glEncoder.finish()).toThrow(ValidationError);
    gl2.device.dispose();
  });

  it('目标契约：两后端都在 finish() 时隐式结束打开的 pass', () => {
    const mock = createMockGpu();
    const gpuEncoder = mock.device.createCommandEncoder();
    gpuEncoder.beginRenderPass({ colorAttachments: [], target: gpuRenderTarget(mock) });
    expect(() => gpuEncoder.finish()).not.toThrow();
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'open'));
    expect(() => glEncoder.finish()).not.toThrow();
    gl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #14 ---------------------- */

/**
 * 读「GL 层面真正生效的 scissor 状态」。
 *
 * 不能读 `GlStateCache` 的记录：`invalidate()` 会把缓存清空（声称 scissor 已关），
 * 而 `gl.disable(SCISSOR_TEST)` 根本不会被调用 —— 缓存与 GL 不一致正是这一项的病灶。
 * 所以这里包一层假的 `enable` / `disable` / `scissor`，跟踪真实下发的状态。
 */
function trackScissor(fake: FakeWebGL2): { enabled(): boolean; box(): [number, number, number, number] } {
  const target = fake.gl as unknown as {
    enable: (capability: number) => void;
    disable: (capability: number) => void;
    scissor: (x: number, y: number, width: number, height: number) => void;
  };
  const originalEnable = target.enable.bind(fake.gl);
  const originalDisable = target.disable.bind(fake.gl);
  const originalScissor = target.scissor.bind(fake.gl);
  let enabled = false;
  let box: [number, number, number, number] = [0, 0, 0, 0];
  target.enable = (capability: number) => {
    if (capability === GL.SCISSOR_TEST) enabled = true;
    originalEnable(capability);
  };
  target.disable = (capability: number) => {
    if (capability === GL.SCISSOR_TEST) enabled = false;
    originalDisable(capability);
  };
  target.scissor = (x: number, y: number, width: number, height: number) => {
    box = [x, y, width, height];
    originalScissor(x, y, width, height);
  };
  return { enabled: () => enabled, box: () => box };
}

/**
 * 「上一个 pass 设了 scissor → 下一个 pass 颜色与深度都是 `load`」这个序列。
 *
 * 两个 pass 都用**原始附件**路径（与症状描述一致，且这条路径本来就在
 * `WebGL2RenderPassEncoder.clearRawAttachments` 里关 scissor）。
 */
function runScissorLeakSequence(gl2: Gl2Harness): RemoteScissor {
  const view = colorView(gl2.device, 'leak-color');
  const first = new WebGL2RenderPassEncoder({ label: 'first', colorAttachments: [{ view }] }, gl2.options);
  first.setScissorRect(2, 2, 4, 4);
  const scissor = trackScissor(gl2.fake);
  first.end();

  const second = new WebGL2RenderPassEncoder(
    {
      label: 'second',
      colorAttachments: [{ view, loadOp: 'load', storeOp: 'store' }],
    },
    gl2.options,
  );
  const result = { enabled: scissor.enabled(), box: scissor.box() };
  second.end();
  return result;
}

interface RemoteScissor {
  enabled: boolean;
  box: [number, number, number, number];
}

describe('#14 上一个 pass 的 scissor 漏进「全 load」的 pass', () => {
  it('改前差异（复现）：全 load 的 pass 开始时 SCISSOR_TEST 仍然是开着的', () => {
    const gl2 = createGl2Harness();
    expect(runScissorLeakSequence(gl2).enabled).toBe(true);
    gl2.device.dispose();
  });

  it('目标契约：每个 pass 开始时 scissor 都处于「整个附件、关闭」的已知状态', () => {
    const gl2 = createGl2Harness();
    const leaked = runScissorLeakSequence(gl2);
    expect(leaked.enabled).toBe(false);
    expect(leaked.box).toEqual([0, 0, 8, 8]);
    gl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #15 ---------------------- */

describe('#15 clearBuffer 的范围 / 4 对齐：两后端同一批非法输入', () => {
  interface ClearCase {
    label: string;
    offset?: number;
    size?: number;
  }

  const cases: ClearCase[] = [
    { label: 'offset 不是 4 的倍数', offset: 2, size: 8 },
    { label: 'size 不是 4 的倍数', offset: 0, size: 6 },
    { label: 'size 为 0', offset: 0, size: 0 },
    { label: 'size 为负', offset: 0, size: -4 },
    { label: '超出 buffer 末尾', offset: 8, size: 16 },
  ];

  it('改前差异（复现）：同一批非法输入 WebGPU 抛错、WebGL2 静默接受', () => {
    const mock = createMockGpu();
    const gpuEncoder = mock.device.createCommandEncoder();
    for (const item of cases) {
      expect(() => gpuEncoder.clearBuffer({ size: 16 }, item.offset, item.size), item.label).toThrow(
        ValidationError,
      );
    }
    expect(mock.clearBufferCalls()).toHaveLength(0);

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    const buffer = gl2BufferStub();
    expect(() => glEncoder.clearBuffer(buffer, 2, 8)).not.toThrow();
    expect(() => glEncoder.clearBuffer(buffer, 0, 6)).not.toThrow();
    expect(() => glEncoder.clearBuffer(buffer, 8, 16)).not.toThrow();
    expect(buffer.uploads.length).toBeGreaterThan(0);
    gl2.device.dispose();
    mock.device.dispose();
  });

  it('目标契约：同一批非法输入在两后端抛同样的错（类型 + code + 文本）', () => {
    for (const item of cases) {
      const mock = createMockGpu();
      const gpuEncoder = mock.device.createCommandEncoder();
      const gpuError = capture(() => gpuEncoder.clearBuffer({ size: 16 }, item.offset, item.size));
      mock.device.dispose();

      const gl2 = createGl2Harness();
      const glEncoder = gl2.device.createCommandEncoder();
      const glError = capture(() => glEncoder.clearBuffer(gl2BufferStub(), item.offset, item.size));
      gl2.device.dispose();

      expect(gpuError, `${item.label}: WebGPU 应当抛错`).toBeInstanceOf(ValidationError);
      expect(glError, `${item.label}: WebGL2 应当抛错`).toBeInstanceOf(ValidationError);
      expect((glError as ValidationError).code, item.label).toBe((gpuError as ValidationError).code);
      expect((glError as ValidationError).message, item.label).toBe(
        (gpuError as ValidationError).message,
      );
    }
  });

  it('目标契约：合法输入（4 对齐、范围内）在两后端都放行', () => {
    const mock = createMockGpu();
    const gpuEncoder = mock.device.createCommandEncoder();
    expect(() => gpuEncoder.clearBuffer({ size: 16 }, 0, 16)).not.toThrow();
    expect(() => gpuEncoder.clearBuffer({ size: 16 }, 4, 12)).not.toThrow();
    expect(() => gpuEncoder.clearBuffer({ size: 16 })).not.toThrow();
    expect(mock.clearBufferCalls()).toEqual([
      [0, 16],
      [4, 12],
      [0, 16],
    ]);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    const buffer = gl2BufferStub();
    expect(() => glEncoder.clearBuffer(buffer, 0, 16)).not.toThrow();
    expect(() => glEncoder.clearBuffer(buffer, 4, 12)).not.toThrow();
    expect(() => glEncoder.clearBuffer(buffer)).not.toThrow();
    // 清的是 [0,16) / [4,16) / [0,16)：块起点与长度都必须落在被请求的区间里。
    expect(buffer.uploads).toEqual([
      [0, 16],
      [4, 12],
      [0, 16],
    ]);
    gl2.device.dispose();
  });
});

describe('#15 writeBuffer 的元素对齐：两后端同一批非法输入', () => {
  it('改前差异（复现）：dataOffset / size 不在元素边界时 WebGPU 抛错、WebGL2 静默补齐', () => {
    const mock = createMockGpu();
    const gpuBuffer = mock.device.createBuffer({ size: 16, usage: 1 });
    expect(() => mock.device.queue.writeBuffer(gpuBuffer, 0, new Float32Array(4), 2)).toThrow(
      ValidationError,
    );
    expect(() => mock.device.queue.writeBuffer(gpuBuffer, 0, new Float32Array(4), 0, 6)).toThrow(
      ValidationError,
    );
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const bytes = new Float32Array(4);
    expect(() => gl2.device.queue.writeBuffer(gl2BufferStub() as never, 0, bytes, 2)).not.toThrow();
    gl2.device.dispose();
  });

  it('目标契约：同一批非法输入在两后端抛同样的错', () => {
    interface WriteCase {
      label: string;
      dataOffset?: number;
      size?: number;
    }
    const cases: WriteCase[] = [
      { label: 'dataOffset 不是元素大小的倍数', dataOffset: 2 },
      { label: 'size 不是元素大小的倍数', size: 6 },
    ];

    for (const item of cases) {
      const data = new Float32Array(4);
      const mock = createMockGpu();
      const gpuBuffer = mock.device.createBuffer({ size: 16, usage: 1 });
      const gpuError = capture(() =>
        mock.device.queue.writeBuffer(gpuBuffer, 0, data, item.dataOffset, item.size),
      );
      mock.device.dispose();

      const gl2 = createGl2Harness();
      const glError = capture(() =>
        gl2.device.queue.writeBuffer(gl2BufferStub() as never, 0, data, item.dataOffset, item.size),
      );
      gl2.device.dispose();

      expect(gpuError, `${item.label}: WebGPU 应当抛错`).toBeInstanceOf(ValidationError);
      expect(glError, `${item.label}: WebGL2 应当抛错`).toBeInstanceOf(ValidationError);
      expect((glError as ValidationError).code, item.label).toBe((gpuError as ValidationError).code);
    }
  });

  it('目标契约：合法调用两后端都放行，且写入的字节范围一致', () => {
    const mock = createMockGpu();
    const gpuBuffer = mock.device.createBuffer({ size: 16, usage: 1 });
    expect(() => mock.device.queue.writeBuffer(gpuBuffer, 0, new Float32Array(4))).not.toThrow();
    expect(() => mock.device.queue.writeBuffer(gpuBuffer, 4, new Float32Array(4), 4, 8)).not.toThrow();
    expect(mock.writeBufferCalls()).toEqual([
      [0, 0, 4],
      [4, 1, 2],
    ]);
    mock.device.dispose();
  });
});

/* ------------------------------------------------------------------ #16 ---------------------- */

describe('#16 disposed 设备上的错误类型', () => {
  it('改前差异（复现）：WebGPU 抛 ValidationError、WebGL2 抛 DeviceLostError', () => {
    const mock = createMockGpu();
    mock.device.dispose();
    const gpuError = capture(() => mock.device.createBuffer({ size: 16, usage: 1 }));
    expect(gpuError).toBeInstanceOf(ValidationError);
    expect((gpuError as ValidationError).code).toBe('VALIDATION_ERROR');

    const gl2 = createGl2Harness();
    gl2.device.dispose();
    const glError = capture(() => gl2.device.createBuffer({ size: 16, usage: 1 }));
    expect(glError).toBeInstanceOf(DeviceLostError);
    expect((glError as DeviceLostError).code).toBe('DEVICE_LOST');
  });

  it('目标契约：disposed 后同一入口在两后端给出同一个错误类型与 code', () => {
    const entries: [string, (device: WebGPUDevice | WebGL2Device) => unknown][] = [
      ['createBuffer', (device) => device.createBuffer({ size: 16, usage: 1 })],
      [
        'createTexture',
        (device) =>
          device.createTexture({
            size: { width: 2, height: 2 },
            format: 'rgba8unorm',
            usage: TextureUsage.TextureBinding,
          }),
      ],
      ['createCommandEncoder', (device) => device.createCommandEncoder()],
    ];

    for (const [name, run] of entries) {
      const mock = createMockGpu();
      mock.device.dispose();
      const gpuError = capture(() => run(mock.device));

      const gl2 = createGl2Harness();
      gl2.device.dispose();
      const glError = capture(() => run(gl2.device));

      expect(gpuError, `${name}: WebGPU 应当抛 DeviceLostError`).toBeInstanceOf(DeviceLostError);
      expect(glError, `${name}: WebGL2 应当抛 DeviceLostError`).toBeInstanceOf(DeviceLostError);
      expect((gpuError as DeviceLostError).code, name).toBe((glError as DeviceLostError).code);
      expect((gpuError as DeviceLostError).reason, name).toBe('destroyed');
      expect((glError as DeviceLostError).reason, name).toBe('destroyed');
    }
  });
});

/* ------------------------------------------------------------------ #17 ---------------------- */

/**
 * `#17` 的**实测更正**（写复现时就发现，与任务书的描述不同）：
 *
 * 改前的 `WebGL2TextureView` 对 `dimension: 'cube'` **确实会抛错**，但抛的是
 * `expectedViewDimension()` 那条「维度不一致」的通用消息：
 *
 * 对 6 层的数组纹理：`texture view 的 dimension「cube」与纹理「...」的「2d-array」不一致`
 * 对单层 2D 纹理： `texture view 的 dimension「cube」与纹理「...」的「2d」不一致`
 *
 * 真正的问题不是「不报错」，而是**报错说的是另一件事**：这条消息把「WebGL2 根本没有立方体贴图
 * 采样」这个根因说成了「你给纹理的维度配错了」，于是调用方会去把纹理改成单层 / 改 dimension，
 * 也就是**往错的方向排查**。所以这一项要做的是把 cube / cube-array 单独识别出来、明确说清
 * 「WebGL2 做不到」并给出替代方案（而不是让通用的维度校验代劳）。
 */
describe('#17 WebGL2 createView({ dimension: "cube" })', () => {
  it('改前差异（复现）：报的是误导性的「维度不一致」，根因（没有立方体贴图采样）没被说出来', () => {
    const gl2 = createGl2Harness();
    const arrayTexture = gl2.device.createTexture({
      label: 'cube-source',
      format: 'rgba8unorm',
      size: { width: 4, height: 4, depthOrArrayLayers: 6 },
      usage: TextureUsage.TextureBinding,
    });
    const arrayError = capture(() => arrayTexture.createView({ dimension: 'cube' }));
    expect(arrayError).toBeInstanceOf(ValidationError);
    expect((arrayError as ValidationError).message).toContain('维度');

    const flatTexture = gl2.device.createTexture({
      label: 'flat-source',
      format: 'rgba8unorm',
      size: { width: 4, height: 4 },
      usage: TextureUsage.TextureBinding,
    });
    const flatError = capture(() => flatTexture.createView({ dimension: 'cube' }));
    expect(flatError).toBeInstanceOf(ValidationError);
    expect((flatError as ValidationError).message).toContain('维度');
    gl2.device.dispose();
  });

  it('目标契约：两种来源的 cube / cube-array view 都明确报「WebGL2 做不到」并给替代方案', () => {
    const gl2 = createGl2Harness();
    const arrayTexture = gl2.device.createTexture({
      label: 'cube-source',
      format: 'rgba8unorm',
      size: { width: 4, height: 4, depthOrArrayLayers: 6 },
      usage: TextureUsage.TextureBinding,
    });
    const flatTexture = gl2.device.createTexture({
      label: 'flat-source',
      format: 'rgba8unorm',
      size: { width: 4, height: 4 },
      usage: TextureUsage.TextureBinding,
    });

    for (const dimension of ['cube', 'cube-array'] as const) {
      for (const texture of [arrayTexture, flatTexture]) {
        const error = capture(() => texture.createView({ dimension }));
        expect(error, `${dimension} on ${texture.label}`).toBeInstanceOf(ValidationError);
        const message = (error as ValidationError).message;
        expect(message).toContain('[gpu-device-api]');
        expect(message).toContain('WebGL2');
        // 替代方案必须写在消息里，否则调用方只能自己猜。
        expect(message).toMatch(/2D array|2d-array/);
      }
    }
    gl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #18 ---------------------- */

describe('#18 WebGL2 limits.maxTextureDimension1D', () => {
  it('改前差异（复现）：报的是 2D 上限（声称能用），而创建 1D 纹理会被拒绝', () => {
    const gl2 = createGl2Harness();
    expect(gl2.device.limits.maxTextureDimension1D).toBeGreaterThan(0);
    expect(() =>
      gl2.device.createTexture({
        label: 'tex1d',
        dimension: '1d',
        format: 'rgba8unorm',
        size: { width: 4, height: 1 },
        usage: TextureUsage.TextureBinding,
      }),
    ).toThrow(ValidationError);
    gl2.device.dispose();
  });

  it('目标契约：该 limit 如实为 0（1D 纹理在 WebGL2 上不存在），WebGPU 仍为正数', () => {
    const gl2 = createGl2Harness();
    expect(gl2.device.limits.maxTextureDimension1D).toBe(0);
    gl2.device.dispose();

    const mock = createMockGpu();
    expect(mock.device.limits.maxTextureDimension1D).toBeGreaterThan(0);
    mock.device.dispose();
  });
});

/* ------------------------------------------------------------------ #19 ---------------------- */

describe('#19 给了 target 时 colorAttachments 非空', () => {
  it('改前差异（复现）：WebGPU 静默忽略、WebGL2 抛错', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder();
    const target = gpuRenderTarget(mock);
    expect(() =>
      encoder.beginRenderPass({
        label: 'both',
        target,
        colorAttachments: [{ view: target.colors[0]!.createView() }],
      }),
    ).not.toThrow();
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    const glTarget = gl2.device.createRenderTarget({
      label: 'gl-target',
      width: 4,
      height: 4,
      color: 'rgba8unorm',
    });
    expect(() =>
      glEncoder.beginRenderPass({
        label: 'both',
        target: glTarget,
        colorAttachments: [{ view: glTarget.colors[0]!.createView() }],
      }),
    ).toThrow(ValidationError);
    gl2.device.dispose();
  });

  it('目标契约：两后端都抛错（与「同时给 target 与 colorAttachments 会抛错」的文档契约一致）', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder();
    const target = gpuRenderTarget(mock);
    const gpuError = capture(() =>
      encoder.beginRenderPass({
        label: 'both',
        target,
        colorAttachments: [{ view: target.colors[0]!.createView() }],
      }),
    );
    expect(gpuError).toBeInstanceOf(ValidationError);
    // 空列表是「没有附件」而不是「两套附件」，两后端都必须放行。
    expect(() =>
      encoder.beginRenderPass({ label: 'target-only', target, colorAttachments: [] }),
    ).not.toThrow();
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder();
    const glTarget = gl2.device.createRenderTarget({
      label: 'gl-target',
      width: 4,
      height: 4,
      color: 'rgba8unorm',
    });
    const glError = capture(() =>
      glEncoder.beginRenderPass({
        label: 'both',
        target: glTarget,
        colorAttachments: [{ view: glTarget.colors[0]!.createView() }],
      }),
    );
    expect(glError).toBeInstanceOf(ValidationError);
    expect((glError as ValidationError).code).toBe((gpuError as ValidationError).code);
    expect(() =>
      glEncoder.beginRenderPass({ label: 'target-only', target: glTarget, colorAttachments: [] }),
    ).not.toThrow();
    gl2.device.dispose();
  });
});
