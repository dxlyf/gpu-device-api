/**
 * 批 06 · 第二档「行为与校验的一致性对齐」的回归测试（七项）。
 *
 * ## 证据链
 *
 * 本文件的**第一版**是单独的「先落复现证据」提交（`51be0cd`）：那一版里有 9 条
 * `改前差异（复现）` 用例，把改前两后端的差异逐条钉住（全部通过），另有 11 条
 * `目标契约` 用例是失败的 —— 那就是复现。修完之后：
 *
 * - `改前差异` 那 9 条**必然反转**（它们描述的就是被修掉的行为），所以在这个提交里
 *   整体替换成了「修复后的行为」；
 * - `目标契约` 全部转绿，也就是下面这些 `it`。
 * 两次提交对照着看，就能同时拿到「改前实测」与「改后实测」。
 *
 * ## 七项与选定方案
 *
 * | 项 | 改动 | 方案 |
 * | --- | --- | --- |
 * | `#12` | `WebGL2CommandEncoder` 打开着的 pass 改为**隐式结束** | 对齐 WebGPU（core 显式镜像它） |
 * | `#14` | 每个 pass 开始时 scissor 复位成「整个附件、关闭」 | 对齐 WebGPU（每个 pass 重置） |
 * | `#15` | `clearBuffer` 校验 + `writeBuffer` 元素对齐补齐到 WebGL2；`writeBuffer` 范围校验补齐到 WebGPU | 两后端同一批非法输入抛同一个错 |
 * | `#16` | disposed 设备抛 `DeviceLostError(reason: 'destroyed')`（WebGPU 侧原来抛 `ValidationError`） | 两后端同一类型 + `code` |
 * | `#17` | `cube` / `cube-array` view 单独报错并给替代方案 | 做不到就**明确报错**（原来报的是误导性的「维度不一致」） |
 * | `#18` | `limits.maxTextureDimension1D = 0` | limits 如实反映能力 |
 * | `#19` | `target` + 非空 `colorAttachments` 两后端都抛错 | 与既有文档契约一致（WebGPU 原来静默忽略） |
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

/** `GL_COLOR`：真实 WebGL2 的常量，假 GL 的枚举表里没有（与批 05 的做法一致）。 */
const GL_COLOR = 0x1800;

/**
 * 两个后端共用的 label（`#15` 要求「同一批非法输入抛同样的错」，而消息里带 encoder 的 label）。
 */
const ENCODER_LABEL = 'encoder';
const BUFFER_LABEL = 'buffer';

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
      writeBuffer: (
        _buffer: unknown,
        bufferOffset: number,
        _data: unknown,
        dataOffset: number,
        size: number,
      ) => {
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
function gl2BufferStub(label = BUFFER_LABEL, size = 16): {
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
  it('两个后端都在 beginRenderPass 时隐式结束上一个 pass（对齐 WebGPU 原生语义）', () => {
    // WebGPU：原生 `GPUCommandEncoder.beginRenderPass()` 本来就是「隐式结束上一个」。
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
    const target = gpuRenderTarget(mock);
    encoder.beginRenderPass({ label: 'p1', colorAttachments: [], target });
    expect(() => encoder.beginRenderPass({ label: 'p2', colorAttachments: [], target })).not.toThrow();
    expect(mock.begunPasses()).toBe(2);
    encoder.finish();
    expect(mock.finishedEncoders()).toBe(1);
    mock.device.dispose();

    // WebGL2：改前这里抛 ValidationError（同一份上层代码一边正常一边抛错）。
    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
    glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'g1'));
    expect(() => glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'g2'))).not.toThrow();
    gl2.device.dispose();
  });

  it('两个后端都在 finish() 时隐式结束打开的 pass', () => {
    const mock = createMockGpu();
    const gpuEncoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
    gpuEncoder.beginRenderPass({ colorAttachments: [], target: gpuRenderTarget(mock) });
    expect(() => gpuEncoder.finish()).not.toThrow();
    expect(mock.finishedEncoders()).toBe(1);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
    glEncoder.beginRenderPass(gl2PassDescriptor(gl2.device, 'open'));
    expect(() => glEncoder.finish()).not.toThrow();
    gl2.device.dispose();
  });

  it('被隐式结束的 pass 仍然走完 end() 的收尾（多重采样 resolve 不会被跳过）', () => {
    const gl2 = createGl2Harness();
    // 多重采样目标：`end()` 会 `blitFramebuffer` 做 resolve。
    const target = gl2.device.createRenderTarget({
      label: 'msaa-target',
      width: 8,
      height: 8,
      color: 'rgba8unorm',
      sampleCount: 4,
    });
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
    // 用目标自己的附件（`createPassDescriptor()`），通道才会被识别成「多重采样目标」。
    glEncoder.beginRenderPass({ label: 'msaa', ...target.createPassDescriptor() });
    gl2.fake.calls.length = 0;
    // 隐式结束（不显式 end()），然后 finish()：resolve 必须已经发生过。
    expect(() => glEncoder.finish()).not.toThrow();
    expect(gl2.fake.calls.some((call) => call.startsWith('blitFramebuffer'))).toBe(true);
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

/** GL 的 `SCISSOR_TEST`（假 GL 的枚举表里没有）。 */
const GL_SCISSOR_TEST = 0x0c11;

interface ScissorProbe {
  enabled: boolean;
  box: [number, number, number, number];
}

/**
 * 「上一个 pass 设了 scissor → 下一个 pass 颜色与深度**都是** `load`」这个序列。
 *
 * 两个 pass 都用**原始附件**路径（与症状描述一致：这条路径本来就在
 * `WebGL2RenderPassEncoder.clearRawAttachments` 里关 scissor，而中间那条缝没关）。
 */
function runScissorLeakSequence(gl2: Gl2Harness): ScissorProbe {
  const view = colorView(gl2.device, 'leak-color');
  const first = new WebGL2RenderPassEncoder({ label: 'first', colorAttachments: [{ view }] }, gl2.options);
  first.setScissorRect(2, 2, 4, 4);
  const scissor = trackScissor(gl2.fake);
  first.end();

  const second = new WebGL2RenderPassEncoder(
    { label: 'second', colorAttachments: [{ view, loadOp: 'load', storeOp: 'store' }] },
    gl2.options,
  );
  const probe: ScissorProbe = { enabled: scissor.enabled(), box: scissor.box() };
  second.end();
  return probe;
}

describe('#14 上一个 pass 的 scissor 不许漏进「全 load」的 pass', () => {
  it('全 load 的 pass 开始时 SCISSOR_TEST 是关的（改前是开着的）', () => {
    const gl2 = createGl2Harness();
    expect(runScissorLeakSequence(gl2).enabled).toBe(false);
    gl2.device.dispose();
  });

  it('scissor 矩形被复位成整个附件（不会留下上一个 pass 的矩形）', () => {
    const gl2 = createGl2Harness();
    // 附件是 8x8（`colorView`），所以整个附件的矩形就是 (0, 0, 8, 8)。
    expect(runScissorLeakSequence(gl2).box).toEqual([0, 0, 8, 8]);
    gl2.device.dispose();
  });

  it('复位之后第一次 setScissorRect 仍然会真的下发 gl.scissor', () => {
    const gl2 = createGl2Harness();
    const view = colorView(gl2.device, 'after-reset');
    const first = new WebGL2RenderPassEncoder({ label: 'first', colorAttachments: [{ view }] }, gl2.options);
    first.setScissorRect(2, 2, 4, 4);
    first.end();

    const second = new WebGL2RenderPassEncoder(
      { label: 'second', colorAttachments: [{ view, loadOp: 'load', storeOp: 'store' }] },
      gl2.options,
    );
    const scissor = trackScissor(gl2.fake);
    second.setScissorRect(1, 1, 2, 2);
    // 改前：缓存里 `scissorEnabled` 被 `invalidate()` 清成 false，而矩形仍是 (2,2,4,4)，
    // 于是 `setScissor(true, 1,1,2,2)` 会走 `gl.scissor`；但真正的问题是**没有复位的那一段**
    // 仍然开着 scissor。这里断言的是「复位之后矩形状态是已知的」，两条合起来才是完整契约。
    expect(scissor.enabled()).toBe(true);
    expect(scissor.box()).toEqual([1, 1, 2, 2]);
    expect(gl2.fake.calls).toContain(`enable:${GL_SCISSOR_TEST}`);
    second.end();
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

  it('同一批非法输入在两后端抛同样的错（类型 + code + 文本）', () => {
    for (const item of cases) {
      const mock = createMockGpu();
      const gpuEncoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
      const gpuError = capture(() => gpuEncoder.clearBuffer({ size: 16 }, item.offset, item.size));
      mock.device.dispose();

      const gl2 = createGl2Harness();
      const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
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

  it('非法输入在两后端都没有下发任何上传（改了校验就不再是「下发一半」）', () => {
    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
    const buffer = gl2BufferStub();
    for (const item of cases) {
      expect(() => glEncoder.clearBuffer(buffer, item.offset, item.size)).toThrow(ValidationError);
    }
    expect(buffer.uploads).toEqual([]);
    gl2.device.dispose();

    const mock = createMockGpu();
    const gpuEncoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
    // 这一段只测范围校验，所以用一个「只带 size」的替身：真的 `WebGPUBuffer` 会在
    // 范围校验之前就被原生句柄收窄拦下（`asGPUBuffer`），测不到想测的那条路径。
    const gpuBuffer = { size: 16 };
    for (const item of cases) {
      expect(() => gpuEncoder.clearBuffer(gpuBuffer, item.offset, item.size)).toThrow(ValidationError);
    }
    expect(mock.clearBufferCalls()).toEqual([]);
    mock.device.dispose();
  });

  it('合法输入（4 对齐、范围内）在两后端都放行，且清的范围一致', () => {
    const mock = createMockGpu();
    const gpuEncoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
    const gpuBuffer = mock.device.createBuffer({ label: BUFFER_LABEL, size: 16, usage: 1 });
    expect(() => gpuEncoder.clearBuffer(gpuBuffer, 0, 16)).not.toThrow();
    expect(() => gpuEncoder.clearBuffer(gpuBuffer, 4, 12)).not.toThrow();
    expect(() => gpuEncoder.clearBuffer(gpuBuffer)).not.toThrow();
    expect(mock.clearBufferCalls()).toEqual([
      [0, 16],
      [4, 12],
      [0, 16],
    ]);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
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

  it('大清零按 4KB 分块复用同一块暂存，且总长度等于请求长度', () => {
    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
    const buffer = gl2BufferStub(BUFFER_LABEL, 12288);
    glEncoder.clearBuffer(buffer, 0, 12288);
    const total = buffer.uploads.reduce((sum, [, length]) => sum + length, 0);
    expect(total).toBe(12288);
    expect(buffer.uploads.map(([offset]) => offset)).toEqual([0, 4096, 8192]);
    gl2.device.dispose();
  });
});

describe('#15 writeBuffer 的元素对齐与范围：两后端同一批非法输入', () => {
  interface WriteCase {
    label: string;
    bufferOffset?: number;
    dataOffset?: number;
    size?: number;
  }

  const cases: WriteCase[] = [
    { label: 'dataOffset 不是元素大小的倍数', dataOffset: 2 },
    { label: 'size 不是元素大小的倍数', size: 6 },
    { label: '超出 buffer 末尾', bufferOffset: 12, size: 8 },
  ];

  it('同一批非法输入在两后端抛同样的错（类型 + code + 文本）', () => {
    for (const item of cases) {
      const data = new Float32Array(4);
      const mock = createMockGpu();
      const gpuBuffer = mock.device.createBuffer({ label: BUFFER_LABEL, size: 16, usage: 1 });
      const gpuError = capture(() =>
        mock.device.queue.writeBuffer(gpuBuffer, item.bufferOffset ?? 0, data, item.dataOffset, item.size),
      );
      mock.device.dispose();

      const gl2 = createGl2Harness();
      const glError = capture(() =>
        gl2.device.queue.writeBuffer(
          gl2BufferStub() as never,
          item.bufferOffset ?? 0,
          data,
          item.dataOffset,
          item.size,
        ),
      );
      gl2.device.dispose();

      expect(gpuError, `${item.label}: WebGPU 应当抛错`).toBeInstanceOf(ValidationError);
      expect(glError, `${item.label}: WebGL2 应当抛错`).toBeInstanceOf(ValidationError);
      expect((glError as ValidationError).code, item.label).toBe((gpuError as ValidationError).code);
      expect((glError as ValidationError).message, item.label).toBe(
        (gpuError as ValidationError).message,
      );
    }
  });

  it('DataView 按字节计：任何字节偏移都放行（两后端一致）', () => {
    const view = new DataView(new ArrayBuffer(16));
    const mock = createMockGpu();
    const gpuBuffer = mock.device.createBuffer({ label: BUFFER_LABEL, size: 16, usage: 1 });
    expect(() => mock.device.queue.writeBuffer(gpuBuffer, 0, view, 2, 6)).not.toThrow();
    expect(mock.writeBufferCalls()).toEqual([[0, 2, 6]]);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const buffer = gl2BufferStub();
    expect(() => gl2.device.queue.writeBuffer(buffer as never, 0, view, 2, 6)).not.toThrow();
    gl2.device.dispose();
  });

  it('合法调用两后端都放行，且写入的字节范围一致', () => {
    const mock = createMockGpu();
    const gpuBuffer = mock.device.createBuffer({ label: BUFFER_LABEL, size: 16, usage: 1 });
    expect(() => mock.device.queue.writeBuffer(gpuBuffer, 0, new Float32Array(4))).not.toThrow();
    expect(() =>
      mock.device.queue.writeBuffer(gpuBuffer, 4, new Float32Array(4), 4, 8),
    ).not.toThrow();
    // 原生接口按元素计：dataOffset=4 字节 / 4 = 1 个 float，size=8 / 4 = 2 个 float。
    expect(mock.writeBufferCalls()).toEqual([
      [0, 0, 4],
      [4, 1, 2],
    ]);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const buffer = gl2BufferStub();
    expect(() => gl2.device.queue.writeBuffer(buffer as never, 0, new Float32Array(4))).not.toThrow();
    expect(() =>
      gl2.device.queue.writeBuffer(buffer as never, 4, new Float32Array(4), 4, 8),
    ).not.toThrow();
    expect(buffer.uploads).toEqual([
      [0, 16],
      [4, 8],
    ]);
    gl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #16 ---------------------- */

describe('#16 disposed 设备上的错误类型', () => {
  it('disposed 后同一入口在两后端给出同一个错误类型与 code', () => {
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
      ['createRenderTarget', (device) => device.createRenderTarget({ width: 4, height: 4, color: 'rgba8unorm' })],
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
      expect((gpuError as DeviceLostError).code, name).toBe('DEVICE_LOST');
      // 「已经 dispose」是**预期**情形（`isExpected === true`），与真正的设备丢失区分开。
      expect((gpuError as DeviceLostError).reason, name).toBe('destroyed');
      expect((glError as DeviceLostError).reason, name).toBe('destroyed');
      expect((gpuError as DeviceLostError).isExpected, name).toBe(true);
      expect((glError as DeviceLostError).isExpected, name).toBe(true);
    }
  });

  it('真正的设备丢失仍然抛 unknown 原因（不会被「已 dispose」的语义吞掉）', () => {
    const mock = createMockGpu();
    const device = mock.device;
    // 尚未 dispose，但丢失信息已记录：走的是另一条分支。
    (device as unknown as { lostInfoValue: unknown }).lostInfoValue = {
      reason: 'unknown',
      message: 'GPU device removed',
    };
    const error = capture(() => device.createBuffer({ size: 16, usage: 1 }));
    expect(error).toBeInstanceOf(DeviceLostError);
    expect((error as DeviceLostError).reason).toBe('unknown');
    expect((error as DeviceLostError).isExpected).toBe(false);
    device.dispose();
  });

  it('dispose() 之后同步的 lostInfo / lost 也落定（与 WebGL2 一致）', async () => {
    const mock = createMockGpu();
    expect(mock.device.lostInfo).toBeNull();
    mock.device.dispose();
    expect(mock.device.lostInfo?.reason).toBe('destroyed');
    await expect(mock.device.lost).resolves.toEqual(mock.device.lostInfo);

    const gl2 = createGl2Harness();
    gl2.device.dispose();
    expect(gl2.device.lostInfo?.reason).toBe('destroyed');
  });
});

/* ------------------------------------------------------------------ #17 ---------------------- */

/**
 * `#17` 的实测更正：改前的 `WebGL2TextureView` 对 `dimension: 'cube'` **是会抛错的**，
 * 但抛的是 `expectedViewDimension()` 那条通用消息 ——
 *
 * - 6 层数组纹理：`维度「cube」与纹理「...」的「2d-array」不一致`
 * - 单层 2D 纹理：`维度「cube」与纹理「...」的「2d」不一致`
 *
 * 根因（WebGL2 没有立方体贴图采样）被说成了「你把纹理的维度配错了」，调用方会去改纹理维度
 * 而不是换方案 —— 对「做不到」的能力来说，指错方向比不报错更难查。现在单独识别并写清根因。
 */
describe('#17 WebGL2 createView({ dimension: "cube" })', () => {
  it('两种来源的 cube / cube-array view 都明确报「WebGL2 做不到」并给替代方案', () => {
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
        // 根因：GLES 3.0 的立方体贴图是独立的 TEXTURE_CUBE_MAP 目标，与 2D 数组无法互解释。
        expect(message).toContain('TEXTURE_CUBE_MAP');
        // 替代方案必须写在消息里，否则调用方只能自己猜。
        expect(message).toMatch(/2D array|2d-array/);
        expect(message).toMatch(/WebGPU/);
      }
    }
    gl2.device.dispose();
  });

  it('其它维度不受影响：`2d-array` view 照常可用', () => {
    const gl2 = createGl2Harness();
    const texture = gl2.device.createTexture({
      label: 'array-source',
      format: 'rgba8unorm',
      size: { width: 4, height: 4, depthOrArrayLayers: 6 },
      usage: TextureUsage.TextureBinding,
    });
    expect(() => texture.createView({ dimension: '2d-array' })).not.toThrow();
    expect(() => texture.createView()).not.toThrow();
    gl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #18 ---------------------- */

describe('#18 WebGL2 limits.maxTextureDimension1D', () => {
  it('该 limit 如实为 0（1D 纹理在 WebGL2 上不存在），WebGPU 仍为正数', () => {
    const gl2 = createGl2Harness();
    expect(gl2.device.limits.maxTextureDimension1D).toBe(0);
    // 同一个设备上其它 limit 不受影响。
    expect(gl2.device.limits.maxTextureDimension2D).toBeGreaterThan(0);
    gl2.device.dispose();

    const mock = createMockGpu();
    expect(mock.device.limits.maxTextureDimension1D).toBeGreaterThan(0);
    mock.device.dispose();
  });

  it('「读 limits 判断能力」与「真的创建」这两个来源现在结论一致', () => {
    const gl2 = createGl2Harness();
    const limit = gl2.device.limits.maxTextureDimension1D;
    // 改前：limit 是 2048（看起来能用），创建却抛错 —— 两个来源互相矛盾。
    const creation = capture(() =>
      gl2.device.createTexture({
        label: 'tex1d',
        dimension: '1d',
        format: 'rgba8unorm',
        size: { width: 4, height: 1 },
        usage: TextureUsage.TextureBinding,
      }),
    );
    expect(limit).toBe(0);
    expect(creation).toBeInstanceOf(ValidationError);
    gl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #19 ---------------------- */

describe('#19 给了 target 时 colorAttachments 非空', () => {
  it('两后端都抛错（与「同时给 target 与 colorAttachments 会抛错」的文档契约一致）', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
    const target = gpuRenderTarget(mock);
    const gpuError = capture(() =>
      encoder.beginRenderPass({
        label: 'both',
        target,
        colorAttachments: [{ view: target.colors[0]!.createView() }],
      }),
    );
    expect(gpuError).toBeInstanceOf(ValidationError);
    // 改前这里静默忽略整个列表、只用 target 生成附件 —— 调用方以为自己的附件生效了。
    expect((gpuError as ValidationError).message).toContain('colorAttachments');
    expect(mock.begunPasses()).toBe(0);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
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
    gl2.device.dispose();
  });

  it('空的 colorAttachments 与 target 搭配是正常写法（两后端都放行）', () => {
    const mock = createMockGpu();
    const encoder = mock.device.createCommandEncoder({ label: ENCODER_LABEL });
    const target = gpuRenderTarget(mock);
    expect(() =>
      encoder.beginRenderPass({ label: 'target-only', target, colorAttachments: [] }),
    ).not.toThrow();
    expect(mock.begunPasses()).toBe(1);
    mock.device.dispose();

    const gl2 = createGl2Harness();
    const glEncoder = gl2.device.createCommandEncoder({ label: ENCODER_LABEL });
    const glTarget = gl2.device.createRenderTarget({
      label: 'gl-target',
      width: 4,
      height: 4,
      color: 'rgba8unorm',
    });
    expect(() =>
      glEncoder.beginRenderPass({ label: 'target-only', target: glTarget, colorAttachments: [] }),
    ).not.toThrow();
    gl2.device.dispose();
  });
});
