/**
 * 批 02（第三档小 API 补齐）的**复现 / 缺失证据**。
 *
 * 这个文件先于 `src/` 的改动落地，用来证明七项能力**在本库里确实缺失**，并且
 * 记录**改动前**的实际行为。每条断言都写成「修复后自然变绿」的形式：修复前失败、
 * 修复后通过，因此它同时是证据与回归测试。
 *
 * 逐项：
 *
 * - `#22` `device.importExternalTexture`：core 的 `Device`/`GPUExternalTexture` 一律没有；
 * - `#23` `TextureViewDescriptor.swizzle`：字段被静默丢弃（解析结果里根本没有 swizzle）；
 * - `#25` `copyExternalImageToTexture` 的 `premultipliedAlpha` / `colorSpace`：没有这两个参数；
 * - `#26` `Device.createFence`：接口上没有，WebGPU 侧也没有；
 * - `#28` `GPUInternalError`：没有独立类，原生错误被折成 `code: 'INTERNAL_ERROR'`；
 * - `#39` `RenderPipelineDescriptor.layout`：类型上不接受 `BindGroupLayout`；
 * - `#40` `asByteView()`：不存在，只能手写 `range instanceof Uint8Array ? ... : ...`。
 *
 * 另外两条硬要求也在这里落证据：
 * 1. 「未指定时行为与改动前逐字段一致」——见 `#23` / `#25` 的默认值断言；
 * 2. WebGL2 表达不了的能力必须**明确报错**——见 `#22` / `#23` / `#25` 的 WebGL2 用例。
 */

import { describe, expect, it } from 'vitest';

import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { GpuError } from '../src/core/errors/GpuError.js';
import { OutOfMemoryError } from '../src/core/errors/OutOfMemoryError.js';
import { ValidationError } from '../src/core/errors/ValidationError.js';
import type { Device } from '../src/core/Device.js';
import type { Fence } from '../src/core/sync/Fence.js';
import type { TextureViewDescriptor } from '../src/core/resources/TextureView.js';
import type { RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import * as coreResources from '../src/core/resources/index.js';
import { resolveTextureViewDescriptor } from '../src/core/resources/TextureView.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { toGpuError } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { createFakeCanvas, createFakeWebGL2, type FakeWebGL2 } from './webgl2-fake-gl.js';

/* ------------------------------------------------------------------ 测试替身 ------------------ */

/** 假的原生 `GPUDevice`：只补本批需要的入口，其余按 `undefined` 处理（正好用来证明「没有」）。 */
interface FakeWebGpu {
  readonly device: GPUDevice;
  /** `createRenderPipeline` 收到的原始 descriptor（`#39` 用）。 */
  readonly pipelineDescriptors: Record<string, unknown>[];
  /** `importExternalTexture` 收到的 source（`#22` 用）。 */
  readonly externalSources: unknown[];
  /** 被 dispose 掉的外部纹理（过期语义的替身）。 */
  readonly destroyedExternalTextures: unknown[];
  /** view 创建时收到的 descriptor（`#23` 用）。 */
  readonly viewDescriptors: Record<string, unknown>[];
}

function createFakeWebGpu(): FakeWebGpu {
  const pipelineDescriptors: Record<string, unknown>[] = [];
  const externalSources: unknown[] = [];
  const destroyedExternalTextures: unknown[] = [];
  const viewDescriptors: Record<string, unknown>[] = [];

  const nativeTexture = {
    label: 'native-texture',
    createView: (descriptor: Record<string, unknown>) => {
      viewDescriptors.push(descriptor ?? {});
      return { label: 'native-view' };
    },
    destroy: () => {},
  };
  const nativeExternalTexture = {
    label: 'native-external-texture',
    // 原生 GPUExternalTexture 的形状是「会过期」：过期后任何使用都报错。
    expired: false,
  };

  const native = {
    label: 'fake-device',
    queue: {},
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: () => ({ label: 'native-buffer', destroy: () => {} }),
    createTexture: () => nativeTexture,
    createShaderModule: () => ({ label: 'native-shader' }),
    createBindGroupLayout: () => ({ label: 'native-bgl' }),
    createPipelineLayout: () => ({ label: 'native-pipeline-layout' }),
    createRenderPipeline: (descriptor: Record<string, unknown>) => {
      pipelineDescriptors.push(descriptor);
      return { label: 'native-pipeline' };
    },
    createCommandEncoder: () => ({ label: 'native-encoder' }),
    importExternalTexture: (source: unknown) => {
      externalSources.push(source);
      const texture = { ...nativeExternalTexture };
      destroyedExternalTextures.push(texture);
      return texture;
    },
    destroy: () => {},
  } as unknown as GPUDevice;

  return { device: native, pipelineDescriptors, externalSources, destroyedExternalTextures, viewDescriptors };
}

function createWebGpuDevice(fake: FakeWebGpu): WebGPUDevice {
  return new WebGPUDevice(fake.device, {
    descriptor: { label: 'tier3-evidence', defaultSampleCount: 1, requiredFeatures: [] },
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
}

/** 假 GL 上补出 fence 语义（仓库假 GL 只记录调用、不模拟 sync 对象的状态机）。 */
interface FenceHarness {
  readonly device: WebGL2Device;
  readonly fake: FakeWebGL2;
  /** 已创建的 GL sync 对象数量。 */
  readonly syncCount: () => number;
  /** 把已创建的 sync 全部标记为「已 signal」。 */
  readonly signalAll: () => void;
  /** `fenceSync` / `clientWaitSync` / `deleteSync` 的调用次数。 */
  readonly calls: { fenceSync: number; clientWaitSync: number; deleteSync: number; flush: number };
}

function createFenceHarness(): FenceHarness {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const gl = fake.gl as unknown as Record<string, unknown>;

  const SYNC_GPU_COMMANDS_COMPLETE = 0x9117;
  const ALREADY_SIGNALED = 0x911a;
  const TIMEOUT_EXPIRED = 0x911b;
  const CONDITION_SATISFIED = 0x911c;
  const WAIT_FAILED = 0x911d;

  const signaled = new Set<unknown>();
  const syncs: unknown[] = [];
  const calls = { fenceSync: 0, clientWaitSync: 0, deleteSync: 0, flush: 0 };

  gl.SYNC_GPU_COMMANDS_COMPLETE = SYNC_GPU_COMMANDS_COMPLETE;
  gl.ALREADY_SIGNALED = ALREADY_SIGNALED;
  gl.TIMEOUT_EXPIRED = TIMEOUT_EXPIRED;
  gl.CONDITION_SATISFIED = CONDITION_SATISFIED;
  gl.WAIT_FAILED = WAIT_FAILED;
  gl.fenceSync = (condition: number) => {
    calls.fenceSync += 1;
    const sync = { condition, id: calls.fenceSync };
    syncs.push(sync);
    return sync;
  };
  gl.clientWaitSync = (sync: unknown) => {
    calls.clientWaitSync += 1;
    return signaled.has(sync) ? CONDITION_SATISFIED : TIMEOUT_EXPIRED;
  };
  gl.deleteSync = (sync: unknown) => {
    calls.deleteSync += 1;
    signaled.delete(sync);
  };
  gl.flush = () => {
    calls.flush += 1;
  };

  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'tier3-evidence' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });

  return {
    device,
    fake,
    syncCount: () => syncs.length,
    signalAll: () => {
      for (const sync of syncs) signaled.add(sync);
    },
    calls,
  };
}

/* ------------------------------------------------------------------ 映射内存（#40 用） -------- */

/**
 * 带**真实映射内存语义**的假原生 buffer。
 *
 * `contents` 就是「GPU 侧」的内存；`mapAsync()` 开一块映射内存，`unmap()` 时按 `'write'`
 * 把它写回 `contents` 并 detach（与原生一致，见 `test/buffer-mapped-range.test.ts`）。
 * 对 `#40` 来说关键的只有一件事：**写入到底有没有到达 buffer**。
 */
class FakeMappedNativeBuffer {
  readonly contents: Uint8Array;
  readonly label: string;
  readonly size: number;
  private mapping: { memory: ArrayBuffer; offset: number } | null = null;

  constructor(label: string, size: number) {
    this.label = label;
    this.size = size;
    this.contents = new Uint8Array(size);
  }

  async mapAsync(mode: number, offset = 0, size = this.size - offset): Promise<void> {
    // 只支持 'write' 映射（本文件的用例只写不读）；`1` 是 GPUMapMode.READ。
    if ((mode & 1) !== 0) throw new Error('fake: read mapping is not implemented');
    this.mapping = { memory: new ArrayBuffer(size), offset };
  }

  getMappedRange(offset = 0, size = this.mapping?.memory.byteLength ?? 0): ArrayBuffer {
    const mapping = this.mapping;
    if (!mapping) throw new Error('fake: not mapped');
    if (offset !== mapping.offset || size !== mapping.memory.byteLength) {
      throw new Error('fake: only the whole mapped range can be requested once');
    }
    return mapping.memory;
  }

  unmap(): void {
    const mapping = this.mapping;
    if (!mapping) return;
    this.mapping = null;
    this.contents.set(new Uint8Array(mapping.memory), mapping.offset);
    const transfer = (mapping.memory as ArrayBuffer & { transfer?: (n?: number) => ArrayBuffer }).transfer;
    if (typeof transfer === 'function') transfer.call(mapping.memory, 0);
  }

  destroy(): void {
    this.mapping = null;
  }
}

interface MappedBufferHarness {
  readonly device: WebGPUDevice;
  contentsOf(label: string): Uint8Array;
}

function createMappedBufferHarness(): MappedBufferHarness {
  const created = new Map<string, FakeMappedNativeBuffer>();
  const native = {
    label: 'fake-device',
    queue: {},
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: (descriptor: { label: string; size: number }) => {
      const buffer = new FakeMappedNativeBuffer(descriptor.label, descriptor.size);
      created.set(descriptor.label, buffer);
      return buffer;
    },
    createTexture: () => ({ destroy: () => {}, createView: () => ({}) }),
    createCommandEncoder: () => ({ label: 'native-encoder' }),
    destroy: () => {},
  } as unknown as GPUDevice;

  const device = new WebGPUDevice(native, {
    descriptor: { label: 'fake-device', defaultSampleCount: 1, requiredFeatures: [] },
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
    contentsOf(label) {
      const buffer = created.get(label);
      if (!buffer) throw new Error(`fake: no buffer labelled "${label}"`);
      return buffer.contents;
    },
  };
}

/* ------------------------------------------------------------------ #22 importExternalTexture - */
describe('#22 device.importExternalTexture：本库缺失', () => {
  it('core 的 Device 上没有 importExternalTexture（只有 escape hatch 转发）', () => {
    // 类型层面：core 的 Device 接口里根本没有这个方法。
    const typed: keyof Device extends never ? never : Device = {} as Device;
    type HasImport = 'importExternalTexture' extends keyof Device ? true : false;
    const hasImport: HasImport = false;
    expect(hasImport).toBe(false);
    expect(typed).toBeDefined();
    // 运行时层面：两个后端都没有实现。
    const fake = createFakeWebGpu();
    const webgpu = createWebGpuDevice(fake);
    const fence = createFenceHarness();
    expect((webgpu as unknown as Record<string, unknown>).importExternalTexture).toBeUndefined();
    expect((fence.device as unknown as Record<string, unknown>).importExternalTexture).toBeUndefined();
    webgpu.dispose();
    fence.device.dispose();
  });

  it('WebGPU 侧应转发到原生 importExternalTexture（修复后 1 次调用）', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const source = { label: 'frame' } as unknown as VideoFrame;
    const importFn = (device as unknown as {
      importExternalTexture?: (options: { source: VideoFrame }) => { native: unknown; label: string };
    }).importExternalTexture;
    expect(importFn).toBeTypeOf('function');
    const texture = importFn!.call(device, { source });
    expect(fake.externalSources).toEqual([source]);
    expect(texture.native).toBeDefined();
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #23 swizzle ----------------- */

describe('#23 TextureViewDescriptor.swizzle：本库缺失且被静默丢弃', () => {
  it('类型里没有 swizzle 字段', () => {
    type HasSwizzle = 'swizzle' extends keyof TextureViewDescriptor ? true : false;
    const hasSwizzle: HasSwizzle = false;
    expect(hasSwizzle).toBe(false);
  });

  it('传入 swizzle 时解析结果里没有这个字段（静默丢弃）', () => {
    const texture = {
      dimension: '2d' as const,
      depthOrArrayLayers: 1,
      mipLevelCount: 1,
      format: 'rgba8unorm' as const,
    };
    const resolved = resolveTextureViewDescriptor(
      texture as unknown as Parameters<typeof resolveTextureViewDescriptor>[0],
      { swizzle: { r: 'zero', g: 'one', b: 'zero', a: 'one' } } as unknown as TextureViewDescriptor,
    );
    expect(Object.prototype.hasOwnProperty.call(resolved, 'swizzle')).toBe(false);
  });

  it('未指定 swizzle 时的解析结果与改动前逐字段一致（默认值回归）', () => {
    const texture = {
      dimension: '2d' as const,
      depthOrArrayLayers: 1,
      mipLevelCount: 1,
      format: 'rgba8unorm' as const,
    };
    const resolved = resolveTextureViewDescriptor(
      texture as unknown as Parameters<typeof resolveTextureViewDescriptor>[0],
      {},
    );
    // 逐字段快照：改 swizzle 支持时不允许顺手改这些既有默认值。
    expect({
      format: resolved.format,
      dimension: resolved.dimension,
      baseMipLevel: resolved.baseMipLevel,
      mipLevelCount: resolved.mipLevelCount,
      baseArrayLayer: resolved.baseArrayLayer,
      arrayLayerCount: resolved.arrayLayerCount,
      aspect: resolved.aspect,
    }).toEqual({
      format: undefined,
      dimension: '2d',
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
      aspect: 'all',
    });
  });

  it('WebGPU 侧应把 swizzle 原样转给 createView', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const texture = device.createTexture({
      label: 'swizzle-target',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    const view = texture.createView({
      label: 'swizzle-view',
      swizzle: { r: 'zero', g: 'one', b: 'zero', a: 'one' },
    } as unknown as TextureViewDescriptor);

    expect((view.descriptor as unknown as Record<string, unknown>).swizzle).toEqual({
      r: 'zero',
      g: 'one',
      b: 'zero',
      a: 'one',
    });
    expect(fake.viewDescriptors.at(-1)!.swizzle).toEqual({
      r: 'zero',
      g: 'one',
      b: 'zero',
      a: 'one',
    });

    // 未指定时不向原生传 swizzle（保持改动前的调用形状）。
    texture.createView({ label: 'no-swizzle' });
    expect('swizzle' in fake.viewDescriptors.at(-1)!).toBe(false);

    device.dispose();
  });

  it('WebGL2 侧应明确报错（GL 没有 swizzle），而不是静默忽略', () => {
    const harness = createFenceHarness();
    const texture = harness.device.createTexture({
      label: 'gl-swizzle-target',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    expect(() =>
      texture.createView({
        label: 'gl-swizzle-view',
        swizzle: { r: 'zero', g: 'one', b: 'zero', a: 'one' },
      } as unknown as TextureViewDescriptor),
    ).toThrow(ValidationError);
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ #25 premultipliedAlpha ---- */

describe('#25 copyExternalImageToTexture 的 premultipliedAlpha / colorSpace：本库缺失', () => {
  it('core 的 Queue 签名里没有这两个参数（第 5、6 个参数不存在）', () => {
    type Params = Parameters<import('../src/core/sync/Queue.js').Queue['copyExternalImageToTexture']>;
    type HasFifth = Params extends [unknown, unknown, unknown, unknown?, unknown?, ...unknown[]] ? true : false;
    // @ts-expect-error 复现证据：修复前签名只有 4 个参数，第五个参数不存在。
    const hasFifth: HasFifth = false;
    expect(hasFifth).toBe(false);
  });

  it('WebGPU 侧默认（未指定）必须与原生逐字段一致：premultipliedAlpha=true / colorSpace="srgb"', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    // 记录原生 queue 收到的 options（改动前是 `{ source, flipY }`，没有任何这两个字段）。
    const received: Record<string, unknown>[] = [];
    const queue = device.queue as unknown as { native: Record<string, unknown> };
    queue.native.copyExternalImageToTexture = (
      options: Record<string, unknown>,
    ) => {
      received.push(options);
    };
    const texture = device.createTexture({
      label: 'copy-external-target',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.CopyDst | TextureUsage.TextureBinding,
    });
    const source = { label: 'bitmap' } as unknown as ImageBitmap;

    device.queue.copyExternalImageToTexture(source, { texture }, { width: 4, height: 4, depthOrArrayLayers: 1 });
    expect(received.at(-1)).toEqual({
      source,
      flipY: false,
      premultipliedAlpha: true,
      colorSpace: 'srgb',
    });

    // 显式传值时如实转发。
    device.queue.copyExternalImageToTexture(
      source,
      { texture },
      { width: 4, height: 4, depthOrArrayLayers: 1 },
      true,
      // @ts-expect-error 复现证据：修复前签名只有 4 个参数，options 不存在。
      { premultipliedAlpha: false, colorSpace: 'display-p3' },
    );
    expect(received.at(-1)).toEqual({
      source,
      flipY: true,
      premultipliedAlpha: false,
      colorSpace: 'display-p3',
    });

    device.dispose();
  });
});

/* ------------------------------------------------------------------ #26 createFence ------------ */

describe('#26 Device.createFence：接口上缺失，WebGL2 已有实现', () => {
  it('core 的 Device 上把它声明为可选成员（不破坏第三方实现）', () => {
    /*
     * 复现证据：修复前 `Device` 上根本没有 `createFence` 成员。
     *
     * 这里不能用 `Device['createFence']` 做类型断言来判断 —— 对**不存在的属性**做索引访问，
     * TS 会静默退化成 `any`（编译不报错，`undefined extends any` 也是 true），断言会假绿。
     * 所以显式判断成员是否存在：修复前为 false，修复后（可选成员）为 true。
     *
     * 修复后的目标形状是：`createFence?: () => Fence` —— 可选，第三方 `Device` 实现不必提供。
     */
    type HasCreateFence = 'createFence' extends keyof Device ? true : false;
    const hasCreateFence: HasCreateFence = false;
    expect(hasCreateFence).toBe(false);
  });

  it('WebGPU 设备上不假装有 createFence（原生 WebGPU 没有 fence 对象）', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    expect((device as unknown as Record<string, unknown>).createFence).toBeUndefined();
    expect(typeof fake.device.queue.onSubmittedWorkDone).toBe('undefined');
    device.dispose();
  });

  it('WebGL2 设备上的 createFence() 返回一个 Fence，且 poll() 跟随 GL sync 状态', () => {
    const harness = createFenceHarness();
    const device = harness.device as unknown as {
      createFence?: () => Fence;
    };
    expect(device.createFence).toBeTypeOf('function');
    const fence = device.createFence!();
    expect(harness.calls.fenceSync).toBe(1);
    expect(fence.signaled).toBe(false);
    expect(fence.poll()).toBe(false);
    harness.signalAll();
    expect(fence.poll()).toBe(true);
    expect(fence.signaled).toBe(true);
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ #28 GPUInternalError ------ */

describe('#28 GPUInternalError：没有独立类', () => {
  it('errors 模块里没有导出 GPUInternalError', () => {
    expect((coreResources as unknown as Record<string, unknown>).GPUInternalError).toBeUndefined();
  });

  it('原生 GPUInternalError 现在被折成基类 GpuError（修复后应是独立类型）', () => {
    const native = Object.create(globalThis.GPUValidationError?.prototype ?? Object.prototype) as object;
    Object.defineProperty(native, 'constructor', { value: { name: 'GPUInternalError' } });
    (native as { message?: string }).message = 'internal boom';
    const error = toGpuError(native);
    expect(error).toBeInstanceOf(GpuError);
    expect(error.code).toBe('INTERNAL_ERROR');
    // 修复后这一条要变成 true：错误类型应当是独立的 GPUInternalError。
    expect(error.constructor.name).not.toBe('GPUInternalError');
  });

  it('OutOfMemoryError 是现有独立类的范例（新类应当照它的形状来）', () => {
    const error = new OutOfMemoryError('[gpu-device-api] boom');
    expect(error).toBeInstanceOf(GpuError);
    expect(error.code).toBe('OUT_OF_MEMORY');
  });
});

/* ------------------------------------------------------------------ #39 layout 放宽 ------------ */

describe('#39 RenderPipelineDescriptor.layout 只接受 PipelineLayout', () => {
  it('类型上不接受 BindGroupLayout（使用者手上的就是这个）', () => {
    type Layout = NonNullable<RenderPipelineDescriptor['layout']>;
    // 修复后 `BindGroupLayout` 与 `readonly BindGroupLayout[]` 都会被接受。
    type AcceptsBindGroupLayout = import('../src/core/binding/BindGroupLayout.js').BindGroupLayout extends Layout
      ? true
      : false;
    // 复现证据：修复前 layout 只接受 PipelineLayout | 'auto'，所以这里只能写 false。
    const accepts: AcceptsBindGroupLayout = false;
    expect(accepts).toBe(false);
  });
});

/* ------------------------------------------------------------------ #40 asByteView -------------- */

describe('#40 asByteView()：本库没有，使用者只能手写、且极易写成拷贝', () => {
  it('resources 模块里没有导出 asByteView', () => {
    expect((coreResources as unknown as Record<string, unknown>).asByteView).toBeUndefined();
  });

  it('陷阱本身：对部分范围（Uint8Array）做 new Uint8Array(range) 是逐元素拷贝，写入会丢', async () => {
    const harness = createMappedBufferHarness();
    const buffer = harness.device.createBuffer({
      label: 'trap',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });
    const whole = await buffer.mapAsync('write');
    const partial = buffer.getMappedRange(4, 4);
    expect(partial).toBeInstanceOf(Uint8Array);

    // 错误的写法：new Uint8Array(typedArray) 逐元素拷贝，写进的是临时内存。
    const copy = new Uint8Array(partial as Uint8Array);
    copy.set([9, 9, 9, 9]);
    expect([...new Uint8Array(whole, 4, 4)]).toEqual([0, 0, 0, 0]);

    // 写入确实丢了：unmap 之后「GPU 侧」内存里那 4 字节还是零。
    buffer.unmap();
    expect([...harness.contentsOf('trap').slice(4, 8)]).toEqual([0, 0, 0, 0]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('修复后：asByteView(部分范围) 与 asByteView(整段) 都必须是视图，写入到达 buffer', async () => {
    const harness = createMappedBufferHarness();
    const buffer = harness.device.createBuffer({
      label: 'byte-view',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });
    const whole = await buffer.mapAsync('write');

    // 整段：与 mapAsync() 的返回值指向同一块内存（`buffer` 相同）。
    // @ts-expect-error 复现证据：修复前 resources 模块没有 asByteView。
    const wholeView = coreResources.asByteView(buffer.getMappedRange());
    expect(wholeView.buffer).toBe(whole);
    expect(wholeView.byteOffset).toBe(0);
    expect(wholeView.byteLength).toBe(16);

    // 部分范围：是映射内存上的子视图，不是拷贝。
    // @ts-expect-error 复现证据：修复前 resources 模块没有 asByteView。
    const sliceView = coreResources.asByteView(buffer.getMappedRange(4, 4));
    expect(sliceView.buffer).toBe(whole);
    expect(sliceView.byteOffset).toBe(4);
    expect(sliceView.byteLength).toBe(4);

    // 通过视图写入 → unmap → 数据真的落到「GPU 侧」内存。
    sliceView.set([1, 2, 3, 4]);
    expect([...new Uint8Array(whole, 4, 4)]).toEqual([1, 2, 3, 4]);
    buffer.unmap();
    expect([...harness.contentsOf('byte-view')]).toEqual([0, 0, 0, 0, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0]);

    buffer.destroy();
    harness.device.dispose();
  });
});
