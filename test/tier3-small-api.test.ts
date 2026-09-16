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
import { GPUInternalError } from '../src/core/errors/GPUInternalError.js';
import { OutOfMemoryError } from '../src/core/errors/OutOfMemoryError.js';
import { ValidationError } from '../src/core/errors/ValidationError.js';
import type { Device } from '../src/core/Device.js';
import type { Fence } from '../src/core/sync/Fence.js';
import type { TextureViewDescriptor } from '../src/core/resources/TextureView.js';
import type { RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import { resolvePipelineLayoutLike } from '../src/core/pipeline/RenderPipeline.js';
import * as coreErrors from '../src/core/errors/index.js';
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
    importExternalTexture: (descriptor: { source: unknown; label?: string }) => {
      externalSources.push(descriptor.source);
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
  /** 设备服务的那张假 canvas（`createCanvasContext()` 只接受同一个）。 */
  readonly canvas: HTMLCanvasElement;
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
    canvas: canvas.canvas,
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

/* ------------------------------------------------------------------ WebGL2 上传路径（#25） ---- */

/**
 * `UNPACK_FLIP_Y_WEBGL` / `UNPACK_PREMULTIPLY_ALPHA_WEBGL` 的 GL 枚举。
 *
 * 仓库自带的假 GL（`webgl2-fake-gl.ts`）的枚举表里还没有这两项，而 `WebGL2Queue` 是从
 * 上下文实例上读 `gl.UNPACK_FLIP_Y_WEBGL` 的（因此读到的会是 `undefined`）。
 * 为了让断言落在**真实枚举值**上，这里在建 harness 时把这两个常量补进假 GL —— 不改那个
 * 被别的批次共用的文件。
 */
const UNPACK_FLIP_Y_WEBGL = 0x9240;
const UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;

interface GlQueueHarness {
  readonly device: WebGL2Device;
  readonly fake: FakeWebGL2;
  readonly canvas: HTMLCanvasElement;
  readonly queue: import('../src/core/sync/Queue.js').Queue;
  /** 上一次 `copyExternalImageToTexture` 里两次 `pixelStorei` 的 `pname:value` 序列。 */
  unpackCalls(): string[];
  /** 某个 `UNPACK_*` 开关当前的值。 */
  currentPixelStore(pname: number): number | undefined;
  texSubImageCalls(): number;
  clearCalls(): void;
}

function createGlQueueHarness(): GlQueueHarness {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const gl = fake.gl as unknown as Record<string, unknown>;
  gl.UNPACK_FLIP_Y_WEBGL = UNPACK_FLIP_Y_WEBGL;
  gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL = UNPACK_PREMULTIPLY_ALPHA_WEBGL;

  const pixelStore = new Map<number, number>();
  const log: string[] = [];
  let texSubImage = 0;
  gl.pixelStorei = (pname: number, value: number) => {
    pixelStore.set(pname, value);
    // 只记这两个开关：`UNPACK_ALIGNMENT` 的进出不属于本项要验证的状态。
    if (pname === UNPACK_FLIP_Y_WEBGL || pname === UNPACK_PREMULTIPLY_ALPHA_WEBGL) {
      log.push(`${pname}:${value}`);
    }
  };
  gl.texSubImage2D = () => {
    texSubImage += 1;
  };
  gl.texSubImage3D = () => {
    texSubImage += 1;
  };

  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'tier3-queue' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });

  return {
    device,
    fake,
    canvas: canvas.canvas,
    queue: device.queue,
    unpackCalls: () => [...log],
    currentPixelStore: (pname) => pixelStore.get(pname),
    texSubImageCalls: () => texSubImage,
    clearCalls: () => {
      log.length = 0;
      // 状态也要清掉：不然「上一次调用留下的值」会被误读成「这一次下发的值」。
      pixelStore.clear();
    },
  };
}

/** 在假 GL 上建一张可上传的 2D 纹理，作为 `copyExternalImageToTexture` 的目标。 */
function createGlUploadTarget(harness: GlQueueHarness): import('../src/core/resources/Texture.js').Texture {
  return harness.device.createTexture({
    label: 'gl-copy-external-target',
    size: { width: 2, height: 2, depthOrArrayLayers: 1 },
    format: 'rgba8unorm',
    usage: TextureUsage.CopyDst | TextureUsage.TextureBinding,
  });
}

/* ------------------------------------------------------------------ #22 importExternalTexture - */
describe('#22 device.importExternalTexture', () => {
  it('core 的 Device 上有 importExternalTexture（改动前：整个接口里没有这个成员）', () => {
    type HasImport = 'importExternalTexture' extends keyof Device ? true : false;
    const hasImport: HasImport = true;
    expect(hasImport).toBe(true);
    // 运行时层面：两个后端都实现了它 —— WebGPU 转发、WebGL2 明确报错，都不是 undefined。
    const fake = createFakeWebGpu();
    const webgpu = createWebGpuDevice(fake);
    const fence = createFenceHarness();
    expect((webgpu as unknown as Record<string, unknown>).importExternalTexture).toBeTypeOf('function');
    expect((fence.device as unknown as Record<string, unknown>).importExternalTexture).toBeTypeOf('function');
    webgpu.dispose();
    fence.device.dispose();
  });

  it('WebGPU 侧转发到原生 importExternalTexture（恰好 1 次调用，source/label 原样）', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const source = { label: 'frame' } as unknown as VideoFrame;
    const texture = device.importExternalTexture({ source, label: 'camera' });
    expect(fake.externalSources).toEqual([source]);
    expect(texture.native).toBeDefined();
    expect(texture.label).toBe('camera');
    expect(texture.expired).toBe(false);
    // 未给 label 时自动生成，与其它资源的约定一致。
    const generated = device.importExternalTexture({ source });
    expect(generated.label).toMatch(/^externalTexture#/);
    device.dispose();
  });

  it('外部纹理是设备的被追踪资源：dispose() 与 device.dispose() 都会摘掉它', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const source = { label: 'frame' } as unknown as VideoFrame;
    const baseline = device.trackedResourceCount;
    const texture = device.importExternalTexture({ source });
    expect(device.trackedResourceCount).toBe(baseline + 1);
    texture.dispose();
    expect(device.trackedResourceCount).toBe(baseline);
    const second = device.importExternalTexture({ source });
    device.dispose();
    expect(second.disposed).toBe(true);
  });

  it('原生实现没有 importExternalTexture 时给出带替代方案的明确报错', () => {
    const fake = createFakeWebGpu();
    delete (fake.device as unknown as Record<string, unknown>).importExternalTexture;
    const device = createWebGpuDevice(fake);
    expect(() => device.importExternalTexture({ source: {} as VideoFrame })).toThrow(
      /does not expose\s+GPUDevice\.importExternalTexture/,
    );
    expect(() => device.importExternalTexture({ source: {} as VideoFrame })).toThrow(ValidationError);
    device.dispose();
  });

  it('colorSpace 未实现：明确报错，不静默忽略', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    expect(() =>
      device.importExternalTexture({ source: {} as VideoFrame, colorSpace: 'display-p3' }),
    ).toThrow(/colorSpace/);
    // 报错发生在调用原生之前：一次原生调用都没有发生。
    expect(fake.externalSources).toEqual([]);
    device.dispose();
  });

  it('能力可提前判断：features.has("external-texture") 在 WebGPU 上为 true、WebGL2 上为 false', () => {
    /*
     * `importExternalTexture` **不是** WebGPU 的 feature（没有 requiredFeatures 要开），
     * 它在部分实现上根本不存在。上层要提前判断就得看真实的调用面，所以 WebGPU 后端按
     * 「原生有没有这个方法」上报这个能力名，WebGL2 后端恒为 false
     * （见 `queryGlFeatures` 里的说明）。
     */
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    expect(device.features.has('external-texture')).toBe(true);
    device.dispose();

    const withoutApi = createFakeWebGpu();
    delete (withoutApi.device as unknown as Record<string, unknown>).importExternalTexture;
    const limited = createWebGpuDevice(withoutApi);
    expect(limited.features.has('external-texture')).toBe(false);
    limited.dispose();

    const harness = createFenceHarness();
    expect(harness.device.features.has('external-texture')).toBe(false);
    harness.device.dispose();
  });

  it('WebGL2 侧明确报错（GL 没有外部纹理），并给出替代方案', () => {
    const harness = createFenceHarness();
    const device = harness.device as unknown as {
      importExternalTexture(options: { source: unknown }): unknown;
    };
    expect(() => device.importExternalTexture({ source: {} })).toThrow(ValidationError);
    expect(() => device.importExternalTexture({ source: {} })).toThrow(/external-texture|copyExternalImageToTexture/);
    // `source` 缺失是**参数错误**：两个后端给同一条错误。
    expect(() => device.importExternalTexture({} as { source: unknown })).toThrow(/source/);
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ #23 swizzle ----------------- */

describe('#23 TextureViewDescriptor.swizzle', () => {
  it('类型里有 swizzle 字段，且是四字符字符串（改动前：没有这个字段）', () => {
    type HasSwizzle = 'swizzle' extends keyof TextureViewDescriptor ? true : false;
    const hasSwizzle: HasSwizzle = true;
    expect(hasSwizzle).toBe(true);
  });

  it('传入 swizzle 时解析结果里带着它（改动前是被静默丢弃）', () => {
    const texture = {
      dimension: '2d' as const,
      depthOrArrayLayers: 1,
      mipLevelCount: 1,
      format: 'rgba8unorm' as const,
      label: 'swizzle-subject',
    };
    const resolved = resolveTextureViewDescriptor(
      texture as unknown as Parameters<typeof resolveTextureViewDescriptor>[0],
      { swizzle: 'r001' },
    );
    expect(resolved.swizzle).toBe('r001');
  });

  it('非法 swizzle（长度不对/含非法字符）在解析阶段就报错，带上下文', () => {
    const texture = {
      dimension: '2d' as const,
      depthOrArrayLayers: 1,
      mipLevelCount: 1,
      format: 'rgba8unorm' as const,
      label: 'swizzle-subject',
    };
    const resolve = (swizzle: unknown) =>
      resolveTextureViewDescriptor(
        texture as unknown as Parameters<typeof resolveTextureViewDescriptor>[0],
        { swizzle } as TextureViewDescriptor,
      );
    // 原生对错误取值只说一句 `must be exactly a four-character string`，没有上下文。
    expect(() => resolve('rgb')).toThrow(ValidationError);
    expect(() => resolve('rgbax')).toThrow(/four-character/);
    expect(() => resolve('xyz0')).toThrow(/four-character/);
    // 同一提案早期版本的 `{r,g,b,a}` 对象形状**不是**本库接受的输入（实测 Chrome 只吃字符串）。
    expect(() => resolve({ r: 'zero' })).toThrow(ValidationError);
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
    /*
     * 逐字段快照：加 swizzle 支持时不允许顺手改这些既有默认值。
     * 注意 `swizzle` 在未指定时是 `undefined`（不是 `'rgba'`）—— 这样「有没有指定」是可分辨的，
     * 后端才不会为默认情况平白多传一个字段给原生（那会改变既有调用形状）。
     */
    expect({
      format: resolved.format,
      dimension: resolved.dimension,
      baseMipLevel: resolved.baseMipLevel,
      mipLevelCount: resolved.mipLevelCount,
      baseArrayLayer: resolved.baseArrayLayer,
      arrayLayerCount: resolved.arrayLayerCount,
      aspect: resolved.aspect,
      swizzle: resolved.swizzle,
    }).toEqual({
      format: undefined,
      dimension: '2d',
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
      aspect: 'all',
      swizzle: undefined,
    });
  });

  it('WebGPU 侧把 swizzle 原样转给 createView；未指定时一个字段都不多传', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const texture = device.createTexture({
      label: 'swizzle-target',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    const view = texture.createView({ label: 'swizzle-view', swizzle: 'r001' });

    expect(view.descriptor.swizzle).toBe('r001');
    expect(view.swizzle).toBe('r001');
    expect(fake.viewDescriptors.at(-1)!.swizzle).toBe('r001');

    // 未指定时不向原生传 swizzle（保持改动前的调用形状），但对外读到的是原生默认值。
    const plain = texture.createView({ label: 'no-swizzle' });
    expect('swizzle' in fake.viewDescriptors.at(-1)!).toBe(false);
    expect(plain.descriptor.swizzle).toBeUndefined();
    expect(plain.swizzle).toBe('rgba');

    // 无参调用同样不多传字段（这是最热的那条路径）。
    texture.createView();
    expect('swizzle' in fake.viewDescriptors.at(-1)!).toBe(false);

    device.dispose();
  });

  it('swizzle 是 view 的一部分：不会命中「没写 swizzle」的缓存条目', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const texture = device.createTexture({
      label: 'swizzle-cache',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    const plain = texture.createView();
    const swizzled = texture.createView({ swizzle: 'rrr1' });
    expect(swizzled).not.toBe(plain);
    expect(swizzled.swizzle).toBe('rrr1');
    expect(plain.swizzle).toBe('rgba');
    // 同一个 swizzle 重复取仍然复用同一个 view。
    expect(texture.createView({ swizzle: 'rrr1' })).toBe(swizzled);
    device.dispose();
  });

  it('WebGL2 侧明确报错（GL 没有 swizzle），而不是静默忽略', () => {
    const harness = createFenceHarness();
    const texture = harness.device.createTexture({
      label: 'gl-swizzle-target',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    expect(() => texture.createView({ label: 'gl-swizzle-view', swizzle: 'r001' })).toThrow(ValidationError);
    // 报错必须说清根因与替代方案，而不是只说「不支持」。
    expect(() => texture.createView({ swizzle: 'r001' })).toThrow(/swizzle/);
    expect(() => texture.createView({ swizzle: 'r001' })).toThrow(/WebGPU/);
    // `'rgba'`（与默认值等价）不报错：它不是「要求重排」。
    expect(() => texture.createView({ swizzle: 'rgba' })).not.toThrow();
    // 未指定同样不报错（改动前的行为）。
    expect(() => texture.createView()).not.toThrow();
    harness.device.dispose();
  });

  it('WebGL2 的 canvas 帧纹理 view 走的是另一条路径，也必须明确报错', () => {
    const harness = createFenceHarness();
    const context = harness.device.createCanvasContext(harness.canvas);
    // canvas 帧目标由 getCurrentFrameTarget() 提供（webgl2 侧是手写的 DefaultFramebufferView）。
    const target = (context as unknown as {
      getCurrentFrameTarget(): { texture: { createView(descriptor?: TextureViewDescriptor): unknown } };
    }).getCurrentFrameTarget();
    expect(() => target.texture.createView({ swizzle: 'rrr1' })).toThrow(ValidationError);
    expect(() => target.texture.createView()).not.toThrow();
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ #25 premultipliedAlpha ---- */

describe('#25 copyExternalImageToTexture 的 premultipliedAlpha / colorSpace', () => {
  it('core 的 Queue 签名里有第 5 个参数 options（改动前只有 4 个）', () => {
    type Params = Parameters<import('../src/core/sync/Queue.js').Queue['copyExternalImageToTexture']>;
    type HasFifth = Params extends [unknown, unknown, unknown, unknown?, unknown?, ...unknown[]] ? true : false;
    const hasFifth: HasFifth = true;
    expect(hasFifth).toBe(true);
  });

  it('WebGPU 侧默认（未指定）不下发这两个字段：原生默认值即 premultipliedAlpha=true / colorSpace="srgb"', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    // 记录原生 queue 收到的参数（改动前是 `{ source, flipY }`，没有任何这两个字段）。
    const received: Record<string, unknown>[] = [];
    const destination: Record<string, unknown>[] = [];
    const queue = device.queue as unknown as { native: Record<string, unknown> };
    queue.native.copyExternalImageToTexture = (
      options: Record<string, unknown>,
      dest: Record<string, unknown>,
    ) => {
      received.push(options);
      destination.push(dest);
    };
    const texture = device.createTexture({
      label: 'copy-external-target',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.CopyDst | TextureUsage.TextureBinding,
    });
    const source = { label: 'bitmap' } as unknown as ImageBitmap;

    device.queue.copyExternalImageToTexture(source, { texture }, { width: 4, height: 4, depthOrArrayLayers: 1 });
    /*
     * 关键默认值断言：**未指定时一个字段都不多传**。
     *
     * 原生的 `GPUCopyExternalImageDestInfo` 里 `premultipliedAlpha` 默认 `true`、
     * `colorSpace` 默认 `'srgb'`（IDL 默认值，见 W3C WebGPU 的
     * #dictdef-gpucopyexternalimagedestinfo）。本库把「用默认值」实现成「不下发」——
     * 由原生实现去填它自己的默认值。这样「没写新参数」的调用形状与改动前**逐字段相同**，
     * 不存在「本库的默认值与原生的默认值哪天不一致」这种漂移。
     */
    expect(received.at(-1)).toEqual({ source, flipY: false });
    expect('premultipliedAlpha' in destination.at(-1)!).toBe(false);
    expect('colorSpace' in destination.at(-1)!).toBe(false);
    // 其余 destination 字段照旧（与改动前一致）。
    expect(destination.at(-1)!.mipLevel).toBeUndefined();
    expect(destination.at(-1)!.origin).toBeUndefined();
    expect(destination.at(-1)!.aspect).toBeUndefined();

    // 显式传值时如实转发到 destination（原生的这两个字段属于 destination）。
    device.queue.copyExternalImageToTexture(
      source,
      { texture },
      { width: 4, height: 4, depthOrArrayLayers: 1 },
      true,
      { premultipliedAlpha: false, colorSpace: 'display-p3' },
    );
    expect(received.at(-1)).toEqual({ source, flipY: true });
    expect(destination.at(-1)).toEqual({
      texture: (destination.at(-1)!.texture as GPUTexture | undefined),
      premultipliedAlpha: false,
      colorSpace: 'display-p3',
    });

    device.dispose();
  });

  it('WebGPU 侧只给其中一个字段时，另一个仍然不下发（沿用原生默认值）', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const destination: Record<string, unknown>[] = [];
    const queue = device.queue as unknown as { native: Record<string, unknown> };
    queue.native.copyExternalImageToTexture = (_options: Record<string, unknown>, dest: Record<string, unknown>) => {
      destination.push(dest);
    };
    const texture = device.createTexture({
      label: 'copy-external-partial',
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.CopyDst | TextureUsage.TextureBinding,
    });
    const source = { label: 'bitmap' } as unknown as ImageBitmap;
    const size = { width: 4, height: 4, depthOrArrayLayers: 1 };

    device.queue.copyExternalImageToTexture(source, { texture }, size, false, { premultipliedAlpha: false });
    expect(destination.at(-1)!.premultipliedAlpha).toBe(false);
    expect('colorSpace' in destination.at(-1)!).toBe(false);

    device.queue.copyExternalImageToTexture(source, { texture }, size, false, { colorSpace: 'display-p3' });
    expect(destination.at(-1)!.colorSpace).toBe('display-p3');
    expect('premultipliedAlpha' in destination.at(-1)!).toBe(false);

    device.dispose();
  });

  it('WebGL2 侧：premultipliedAlpha 走 UNPACK_PREMULTIPLY_ALPHA_WEBGL，且用后复原', () => {
    const harness = createGlQueueHarness();
    const texture = createGlUploadTarget(harness);
    const source = {} as TexImageSource;
    const size = { width: 2, height: 2, depthOrArrayLayers: 1 };

    // 省略 options：默认 true（与原生一致）；调用结束后两个开关都复原为 0。
    harness.queue.copyExternalImageToTexture(source, { texture }, size);
    expect(harness.unpackCalls()).toEqual([
      `${UNPACK_FLIP_Y_WEBGL}:0`,
      `${UNPACK_PREMULTIPLY_ALPHA_WEBGL}:1`,
      `${UNPACK_FLIP_Y_WEBGL}:0`,
      `${UNPACK_PREMULTIPLY_ALPHA_WEBGL}:0`,
    ]);

    // 显式 false。
    harness.clearCalls();
    harness.queue.copyExternalImageToTexture(source, { texture }, size, true, { premultipliedAlpha: false });
    expect(harness.unpackCalls()).toEqual([
      `${UNPACK_FLIP_Y_WEBGL}:1`,
      `${UNPACK_PREMULTIPLY_ALPHA_WEBGL}:0`,
      `${UNPACK_FLIP_Y_WEBGL}:0`,
      `${UNPACK_PREMULTIPLY_ALPHA_WEBGL}:0`,
    ]);

    // 复原：两个开关都回到 0（否则会污染后续 writeTexture 的像素解包状态）。
    expect(harness.currentPixelStore(UNPACK_FLIP_Y_WEBGL)).toBe(0);
    expect(harness.currentPixelStore(UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(0);

    harness.device.dispose();
  });

  it('WebGL2 侧：colorSpace 非 srgb 时明确报错，srgb（默认）照旧通过', () => {
    const harness = createGlQueueHarness();
    const texture = createGlUploadTarget(harness);
    const source = {} as TexImageSource;
    const size = { width: 2, height: 2, depthOrArrayLayers: 1 };

    expect(() =>
      harness.queue.copyExternalImageToTexture(source, { texture }, size, false, { colorSpace: 'display-p3' }),
    ).toThrow(ValidationError);
    expect(() =>
      harness.queue.copyExternalImageToTexture(source, { texture }, size, false, { colorSpace: 'display-p3' }),
    ).toThrow(/colorSpace/);
    // 报错发生在任何 GL 调用之前（不留半截状态）。
    expect(harness.texSubImageCalls()).toBe(0);
    // 显式 'srgb' 与省略等价：不报错。
    expect(() =>
      harness.queue.copyExternalImageToTexture(source, { texture }, size, false, { colorSpace: 'srgb' }),
    ).not.toThrow();
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ #26 createFence ------------ */

describe('#26 Device.createFence', () => {
  it('core 的 Device 上它是可选成员（改动前：成员不存在；可选=不破坏第三方实现）', () => {
    type HasCreateFence = 'createFence' extends keyof Device ? true : false;
    const hasCreateFence: HasCreateFence = true;
    expect(hasCreateFence).toBe(true);
    // 可选性：`createFence` 的值类型里包含 `undefined`，所以第三方实现可以不提供它。
    type Signature = NonNullable<Device['createFence']>;
    const callable: Signature = () => ({ signaled: true, wait: async () => {}, poll: () => true });
    expect(callable()).toBeDefined();
    type IsOptional = undefined extends Device['createFence'] ? true : false;
    const isOptional: IsOptional = true;
    expect(isOptional).toBe(true);
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

describe('#28 GPUInternalError', () => {
  it('errors 模块里导出了独立的 GPUInternalError', () => {
    expect((coreErrors as unknown as Record<string, unknown>).GPUInternalError).toBeTypeOf('function');
  });

  it('原生 GPUInternalError 被映射成独立类型（code 仍是 INTERNAL_ERROR）', () => {
    const native = Object.create(globalThis.GPUValidationError?.prototype ?? Object.prototype) as object;
    Object.defineProperty(native, 'constructor', { value: { name: 'GPUInternalError' } });
    (native as { message?: string }).message = 'internal boom';
    const error = toGpuError(native);
    expect(error).toBeInstanceOf(GpuError);
    // 关键：不再是基类，而是可以 `instanceof` 分辨的独立类型；message 仍然带前缀。
    expect(error).toBeInstanceOf(GPUInternalError);
    expect(error.constructor.name).toBe('GPUInternalError');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBe('[gpu-device-api] internal boom');
    // `name` 也应当是类名（`toString()` 会用到）。
    expect(error.name).toBe('GPUInternalError');
    expect(error.toString()).toBe('GPUInternalError [INTERNAL_ERROR]: [gpu-device-api] internal boom');
  });

  it('三类原生错误仍然各自映射到各自的类型（没有互相吞掉）', () => {
    const make = (className: string) => {
      const native = Object.create(Object.prototype) as object;
      Object.defineProperty(native, 'constructor', { value: { name: className } });
      (native as { message?: string }).message = 'boom';
      return native;
    };
    expect(toGpuError(make('GPUValidationError'))).toBeInstanceOf(ValidationError);
    expect(toGpuError(make('GPUOutOfMemoryError'))).toBeInstanceOf(OutOfMemoryError);
    expect(toGpuError(make('GPUInternalError'))).toBeInstanceOf(GPUInternalError);
    expect(toGpuError(make('GPUInternalError'))).not.toBeInstanceOf(OutOfMemoryError);
  });

  it('OutOfMemoryError 是现有独立类的范例（新类照它的形状来）', () => {
    const error = new OutOfMemoryError('[gpu-device-api] boom');
    expect(error).toBeInstanceOf(GpuError);
    expect(error.code).toBe('OUT_OF_MEMORY');
  });
});

/* ------------------------------------------------------------------ #39 layout 放宽 ------------ */

describe('#39 RenderPipelineDescriptor.layout 接受 BindGroupLayout', () => {
  it('类型上接受 BindGroupLayout 与 readonly BindGroupLayout[]（改动前只接受 PipelineLayout）', () => {
    type Layout = NonNullable<RenderPipelineDescriptor['layout']>;
    type Bgl = import('../src/core/binding/BindGroupLayout.js').BindGroupLayout;
    type AcceptsOne = Bgl extends Layout ? true : false;
    type AcceptsMany = readonly Bgl[] extends Layout ? true : false;
    const acceptsOne: AcceptsOne = true;
    const acceptsMany: AcceptsMany = true;
    expect(acceptsOne).toBe(true);
    expect(acceptsMany).toBe(true);
  });

  it('core 的归一化：单一 Bgl / 数组都合成一个 PipelineLayout，顺序即 bind group index', () => {
    const calls: (readonly unknown[])[] = [];
    const make = (label: string) =>
      ({
        label,
        entries: [],
        native: null,
        entry: () => undefined,
        sortedEntries: [],
        disposed: false,
        dispose: () => {},
      }) as unknown as import('../src/core/binding/BindGroupLayout.js').BindGroupLayout;
    const a = make('a');
    const b = make('b');
    const synthesize = (layouts: readonly import('../src/core/binding/BindGroupLayout.js').BindGroupLayout[]) => {
      calls.push(layouts);
      return {
        label: 'synthesized',
        bindGroupLayouts: layouts,
        native: null,
        isAuto: false,
        disposed: false,
        dispose: () => {},
      } as unknown as import('../src/core/binding/PipelineLayout.js').PipelineLayout;
    };
    const context = 'test';

    // 'auto' / undefined：不合成。
    expect(resolvePipelineLayoutLike(undefined, synthesize, context)).toEqual({
      layout: 'auto',
      synthesized: null,
    });
    expect(resolvePipelineLayoutLike('auto', synthesize, context)).toEqual({
      layout: 'auto',
      synthesized: null,
    });
    // 单个 Bgl：合成「只有一组」的 layout。
    const single = resolvePipelineLayoutLike(a, synthesize, context);
    expect(single.synthesized).not.toBeNull();
    expect(calls.at(-1)).toEqual([a]);
    // 数组：顺序原样传给原生（下标即 bind group index）。
    resolvePipelineLayoutLike([a, b], synthesize, context);
    expect(calls.at(-1)).toEqual([a, b]);
    // 空数组是用法错误，明确报错（原生会静默当成「没有布局」）。
    expect(() => resolvePipelineLayoutLike([], synthesize, context)).toThrow(ValidationError);
    // 真正的 PipelineLayout 原样通过，不合成。
    const pipelineLayout = synthesize([a]);
    const passed = resolvePipelineLayoutLike(pipelineLayout, synthesize, context);
    expect(passed.layout).toBe(pipelineLayout);
    expect(passed.synthesized).toBeNull();
  });

  it('WebGPU 后端：单个 BindGroupLayout 会被包成原生 GPUPipelineLayout（顺序一致）', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const layout = device.createBindGroupLayout({
      label: 'bgl',
      entries: [{ binding: 0, visibility: 1, type: 'uniform' }],
    });
    const pipeline = device.createRenderPipeline({
      label: 'inline-layout',
      layout,
      vertex: { module: device.createShaderModule({ code: '// vs' }) },
    });
    // core 的元数据：合成出来的 layout 里就是那一个 bind group layout。
    expect(pipeline.layout).not.toBe('auto');
    expect((pipeline.layout as { bindGroupLayouts: readonly unknown[] }).bindGroupLayouts).toEqual([layout]);
    device.dispose();
  });

  it('WebGPU 后端：合成的 layout 随管线 dispose 一起释放（不泄漏在设备上）', () => {
    const fake = createFakeWebGpu();
    const device = createWebGpuDevice(fake);
    const layout = device.createBindGroupLayout({
      label: 'bgl-leak',
      entries: [{ binding: 0, visibility: 1, type: 'uniform' }],
    });
    const before = device.trackedResourceCount;
    const pipeline = device.createRenderPipeline({
      label: 'inline-layout-leak',
      layout,
      vertex: { module: device.createShaderModule({ code: '// vs' }) },
    });
    const layoutObject = pipeline.layout;
    pipeline.dispose();
    expect((layoutObject as { disposed: boolean }).disposed).toBe(true);
    // 管线与合成的 layout 都从设备追踪表里摘掉了（调用方的 BindGroupLayout 还在）。
    expect(device.trackedResourceCount).toBeLessThan(before + 3);
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #40 asByteView -------------- */

describe('#40 asByteView()', () => {
  it('resources 模块导出了 asByteView', () => {
    expect((coreResources as unknown as Record<string, unknown>).asByteView).toBeTypeOf('function');
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

  it('asByteView(部分范围) 与 asByteView(整段) 都是视图，写入真的到达 buffer', async () => {
    const harness = createMappedBufferHarness();
    const buffer = harness.device.createBuffer({
      label: 'byte-view',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });
    const whole = await buffer.mapAsync('write');

    // 整段：与 mapAsync() 的返回值指向同一块内存（`buffer` 相同）。
    const wholeView = coreResources.asByteView(buffer.getMappedRange());
    expect(wholeView.buffer).toBe(whole);
    expect(wholeView.byteOffset).toBe(0);
    expect(wholeView.byteLength).toBe(16);

    // 部分范围：是映射内存上的子视图，不是拷贝。
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
