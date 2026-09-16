/**
 * `BufferDescriptor.mappedAtCreation` 与 `Buffer.mapState` 的复现测试（`#24`）。
 *
 * ## 复现的是什么
 *
 * `grep` 全文 0 处 `mapState` / `mappedAtCreation`：core 的 `Buffer` 只暴露一个布尔 `mapped`，
 * 于是调用方**无法表达也观察不到**「创建即映射」这条 WebGPU 原生能力，更没法区分
 * `'unmapped' | 'pending' | 'mapped'` 三态 —— 而原生 `GPUBuffer` 的 `mapState` 正是这三态
 * （规范原文：`[[mapping]]` 非 null → `mapped`；`[[pending_map]]` 非 null → `pending`；
 * 否则 `unmapped`）。
 *
 * 后果不是「少个方便的 API」，而是**状态可能撒谎**：本会话已经反复修过「状态说一套、
 * 实际另一套」的缺陷（最典型的是缓存声称绑的是 A、实际绑的是 B）。`mapped` 是个派生的布尔，
 * 一旦 `mapAsync` 的 Promise 还没 settle 就被读成 `true`，调用方就会在不该取范围的时候取范围。
 *
 * ## 这里锁定的契约
 *
 * 1. **状态机的推移与原生一致**：
 *    `mappedAtCreation: true` → 创建后立刻 `'mapped'`（**不需要** `mapAsync`）；
 *    `mapAsync()` 调用后、Promise settle 前是 `'pending'`；
 *    settle 之后是 `'mapped'`；`unmap()` / `destroy()` 之后回到 `'unmapped'`。
 * 2. **`mapState` 不许撒谎**：`'mapped'` ⇔ `getMappedRange()` 一定拿得到一块**可用**的范围；
 *    `'unmapped'` / `'pending'` ⇔ `getMappedRange()` 抛 `ValidationError`。三者在任何时刻一致。
 * 3. **视图语义不退化**（`94c4bf3`）：`getMappedRange()` 返回视图而非拷贝、同一段范围重复取
 *    是**同一块内存**、`unmap()` 后视图 **detached**。`mappedAtCreation` 走的是同一条路径，
 *    不能因为「创建时就映射」而退回拷贝语义。
 * 4. **两个后端一致**：WebGL2 没有 `mappedAtCreation`，用影子缓冲模拟，对外行为要求一样
 *    （唯一差别见 `WebGL2Buffer` 的注释：GL 侧没有 `'pending'` 窗口）。
 *
 * 本文件在实现落地**之前**先跑来复现：`mapState` / `mappedAtCreation` 根本不存在，
 * `tsc --noEmit` 会报「属性不存在」，运行时断言也会失败。这是「先复现、再修」的那一步。
 */

import { describe, expect, it } from 'vitest';

import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { ValidationError } from '../src/core/errors/ValidationError.js';
import type { MappedRange } from '../src/core/resources/Buffer.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { createFakeCanvas, createFakeWebGL2, type FakeWebGL2 } from './webgl2-fake-gl.js';

/* ------------------------------------------------------------------ 通用 ---------------------- */

/** 把 `ArrayBuffer` 置为 detached（原生 WebGPU 的 `unmap()` 就是这么做的）。 */
function detach(buffer: ArrayBuffer): void {
  const transfer = (buffer as ArrayBuffer & { transfer?: (newByteLength?: number) => ArrayBuffer }).transfer;
  if (typeof transfer !== 'function') {
    throw new Error('this test needs ArrayBuffer.prototype.transfer (Node 22+ / Chrome 114+)');
  }
  transfer.call(buffer, 0);
}

/** 把 `getMappedRange()` 的返回值收成字节视图，且**不拷贝**（见 `Buffer.asByteView`）。 */
function byteView(range: MappedRange): Uint8Array {
  return range instanceof Uint8Array ? range : new Uint8Array(range);
}

function expectBytes(actual: Uint8Array, expected: readonly number[]): void {
  expect([...actual]).toEqual([...expected]);
}

/* ------------------------------------------------------------------ WebGPU -------------------- */

interface FakeBufferDescriptor {
  label: string;
  size: number;
  usage: number;
  mappedAtCreation?: boolean;
}

/**
 * 假的原生 `GPUBuffer`，建模原生映射状态机。
 *
 * 「GPU 内存」是 `contents`；映射内存是另一块 `ArrayBuffer`（真实的映射内存是 GPU 分配的一块
 * 视图，纯 JS 造不出来；这不影响要验证的性质 —— 库只能通过 `getMappedRange()` 交出去的那块内存
 * 访问映射内存，所以「往它里面写」与「往映射内存里写」等价）。
 *
 * `mapAsync()` 的完成由测试通过 {@link FakeNativeGpuBuffer.releaseMap} 手动放行，
 * 这样才观察得到 `'pending'`。
 */
class FakeNativeGpuBuffer {
  readonly label: string;
  readonly size: number;
  readonly usage: number;
  readonly contents: Uint8Array;
  /** 每次 `mapAsync()` 都换一块新的映射内存，便于断言「上一次的视图不能冒充这一次」。 */
  memory: ArrayBuffer | null = null;

  private mode: 'read' | 'write' | null = null;
  private offset = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(descriptor: FakeBufferDescriptor) {
    this.label = descriptor.label;
    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.contents = new Uint8Array(descriptor.size);
    // 原生：`mappedAtCreation: true` ⇒ 创建完成即处于 mapped（`[[mapping]]` 非 null）。
    if (descriptor.mappedAtCreation === true) {
      this.mode = 'write';
      this.offset = 0;
      this.memory = new ArrayBuffer(descriptor.size);
    }
  }

  get mapState(): 'unmapped' | 'pending' | 'mapped' {
    if (this.memory) return 'mapped';
    if (this.waiting.length > 0) return 'pending';
    return 'unmapped';
  }

  async mapAsync(mode: number, offset = 0, size = this.size - offset): Promise<void> {
    if (this.memory) throw new Error(`FakeNativeGpuBuffer "${this.label}": already mapped`);
    if (this.waiting.length > 0) throw new Error(`FakeNativeGpuBuffer "${this.label}": map already pending`);
    this.mode = (mode & 1) !== 0 ? 'read' : 'write';
    this.offset = offset;
    await new Promise<void>((settle) => {
      this.waiting.push(settle);
    });
    // 放行后才分配映射内存并（read 模式）把 GPU 内容拷进去。
    this.memory = new ArrayBuffer(size);
    if (this.mode === 'read') new Uint8Array(this.memory).set(this.contents.subarray(offset, offset + size));
  }

  /** 测试用：放行所有等待中的 `mapAsync()`。 */
  releaseMap(): void {
    const pending = this.waiting.splice(0, this.waiting.length);
    for (const settle of pending) settle();
  }

  /** 原生：同一段范围只能取一次，重复取以「重叠」报错。 */
  getMappedRange(offset = 0, size = this.memory?.byteLength ?? 0): ArrayBuffer {
    const memory = this.memory;
    if (!memory) throw new Error(`FakeNativeGpuBuffer "${this.label}": not mapped`);
    if (offset !== this.offset || size !== memory.byteLength) {
      throw new Error(
        `FakeNativeGpuBuffer "${this.label}": native getMappedRange(${offset}, ${size}) — the mock only ` +
          `supports the mapped range [${this.offset}, ${this.offset + memory.byteLength}) once`,
      );
    }
    return memory;
  }

  unmap(): void {
    const memory = this.memory;
    if (!memory) return;
    this.memory = null;
    if (this.mode === 'write') this.contents.set(new Uint8Array(memory), this.offset);
    this.mode = null;
    // 原生 unmap() 让之前取出的映射内存 detach。
    detach(memory);
  }

  destroy(): void {
    this.memory = null;
    this.mode = null;
  }
}

interface WebGpuHarness {
  device: WebGPUDevice;
  nativeBuffer(label: string): FakeNativeGpuBuffer;
}

function createWebGpuHarness(): WebGpuHarness {
  const created = new Map<string, FakeNativeGpuBuffer>();
  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: (descriptor: FakeBufferDescriptor) => {
      const buffer = new FakeNativeGpuBuffer(descriptor);
      created.set(descriptor.label, buffer);
      return buffer;
    },
    createTexture: () => ({ destroy: () => {}, createView: () => ({}) }),
    createCommandEncoder: () => ({ label: 'native-encoder' }),
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
    nativeBuffer(label) {
      const buffer = created.get(label);
      if (!buffer) throw new Error(`no fake native buffer labelled "${label}"`);
      return buffer;
    },
  };
}

describe('WebGPU：mappedAtCreation 与 mapState（#24）', () => {
  it('mappedAtCreation: true 之后创建即映射，不需要 mapAsync 就能取范围', () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'wgpu-mac',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    // 复现前：`mapState` 不存在（`mappedAtCreation` 也不存在）；实现后这里必须是 'mapped'。
    expect(buffer.mapState).toBe('mapped');
    expect(buffer.mapped).toBe(true);

    const view = byteView(buffer.getMappedRange(4, 4));
    view.set([0xde, 0xad, 0xbe, 0xef]);
    buffer.unmap();

    expectBytes(harness.nativeBuffer('wgpu-mac').contents, [
      0, 0, 0, 0, 0xde, 0xad, 0xbe, 0xef, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(buffer.mapState).toBe('unmapped');

    buffer.destroy();
    harness.device.dispose();
  });

  it('普通创建的 buffer：mapState 从 unmapped → pending → mapped → unmapped', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'wgpu-states',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    expect(buffer.mapState).toBe('unmapped');
    expect(buffer.mapped).toBe(false);

    // 故意不 await：先观察 'pending'，再放行原生映射。
    const mapping = buffer.mapAsync('write');
    // 还没 settle：原生 `[[pending_map]]` 非 null，状态必须是 'pending'（绝不能已经是 'mapped'）。
    expect(buffer.mapState).toBe('pending');
    expect(buffer.mapped).toBe(false);

    harness.nativeBuffer('wgpu-states').releaseMap();
    await mapping;

    expect(buffer.mapState).toBe('mapped');
    expect(buffer.mapped).toBe(true);

    buffer.unmap();
    expect(buffer.mapState).toBe('unmapped');
    expect(buffer.mapped).toBe(false);

    buffer.destroy();
    harness.device.dispose();
  });

  it('mapState 与实际能力始终一致：pending / unmapped 时取范围必须抛 ValidationError', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'wgpu-honest',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    const assertConsistent = (): void => {
      // 先把「状态本身」钉死：不是三态之一就直接失败，免得下面的分支判断把
      // `undefined` 当成「非 mapped」而悄悄放过 —— 那样会出现「状态没实现但测试通过」。
      expect(['unmapped', 'pending', 'mapped']).toContain(buffer.mapState);
      if (buffer.mapState === 'mapped') {
        // 'mapped' 就必须真的拿得到范围。
        expect(buffer.getMappedRange()).toBeInstanceOf(ArrayBuffer);
      } else {
        expect(() => buffer.getMappedRange()).toThrowError(ValidationError);
      }
    };

    assertConsistent(); // unmapped

    // 故意不 await：这样才能在 Promise settle 之前观察 'pending'。
    const mapping = buffer.mapAsync('write');
    expect(buffer.mapState).toBe('pending');
    assertConsistent(); // pending

    harness.nativeBuffer('wgpu-honest').releaseMap();
    await mapping;
    assertConsistent(); // mapped

    buffer.unmap();
    assertConsistent(); // unmapped

    buffer.destroy();
    harness.device.dispose();
  });

  it('mappedAtCreation 的视图语义与 mapAsync 一致（视图 / 同一块内存 / unmap 后 detached）', () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'wgpu-mac-views',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    const mapped = harness.nativeBuffer('wgpu-mac-views').memory;
    const whole = buffer.getMappedRange();
    const first = byteView(buffer.getMappedRange(8, 4));
    const second = byteView(buffer.getMappedRange(8, 4));

    // 整段就是映射内存本身，不是拷贝。
    expect(whole).toBe(mapped);
    // 部分范围是同一块内存上的视图：偏移 8、底层 16 字节，两次调用同一块内存。
    expect(first.byteOffset).toBe(8);
    expect(first.buffer).toBe(whole);
    expect(second.buffer).toBe(first.buffer);

    first.set([1, 2, 3, 4]);
    expect([...second]).toEqual([1, 2, 3, 4]);

    buffer.unmap();

    // detach：宽度归零、写入被静默忽略、只有触碰底层内存的调用抛 TypeError。
    expect(whole.byteLength).toBe(0);
    expect(first.length).toBe(0);
    expect(first[0]).toBeUndefined();
    expect(() => first.slice()).toThrow(TypeError);
    expect(() => buffer.getMappedRange()).toThrow(ValidationError);

    buffer.destroy();
    harness.device.dispose();
  });

  it('mappedAtCreation 后没 unmap 就 destroy()：两个后端都不抛，且状态回到 unmapped', () => {
    const gpu = createWebGpuHarness();
    const buffer = gpu.device.createBuffer({
      label: 'wgpu-mac-destroy',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });
    expect(buffer.mapState).toBe('mapped');
    expect(() => buffer.destroy()).not.toThrow();
    // 原生 `GPUBuffer.destroy()` 会取消映射；本库的状态必须跟着回到 unmapped。
    expect(buffer.mapState).toBe('unmapped');
    expect(buffer.mapped).toBe(false);
    gpu.device.dispose();
  });

  it('mappedAtCreation 与 mapAsync 交叉使用：已映射时 mapAsync 报错，unmap 之后又能正常映射', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'wgpu-mac-then-async',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    // 复现前 `mappedAtCreation` 被忽略，buffer 其实是 unmapped：本库不会拦下这次 mapAsync，
    // 原生那边就真的挂上一份永远不会 settle 的映射（本用例会以超时失败）。
    // 实现后这里应当在**调用瞬间**就被拦下（reject），状态保持 'mapped'。
    const refused = buffer.mapAsync('write');
    await expect(refused).rejects.toThrowError(ValidationError);
    expect(buffer.mapState).toBe('mapped');
    // 被拒绝的那次映射绝不能挂到原生上（否则这里会是一份等待中的映射）。
    expect(harness.nativeBuffer('wgpu-mac-then-async').mapState).toBe('mapped');

    byteView(buffer.getMappedRange()).set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    buffer.unmap();
    expect(buffer.mapState).toBe('unmapped');

    // 解映射之后走正常的 mapAsync 路径，仍然是视图语义（这次真的到原生，mock 需要放行）。
    const remapped = buffer.mapAsync('write', 0, 8);
    harness.nativeBuffer('wgpu-mac-then-async').releaseMap();
    await remapped;
    byteView(buffer.getMappedRange(0, 8)).set([16, 15, 14, 13, 12, 11, 10, 9]);
    buffer.unmap();

    expectBytes(harness.nativeBuffer('wgpu-mac-then-async').contents, [
      16, 15, 14, 13, 12, 11, 10, 9, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('destroy() 之后 mapState 是 unmapped，且再取范围报「已销毁」', () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'wgpu-destroyed',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    buffer.destroy();
    expect(buffer.mapState).toBe('unmapped');
    expect(() => buffer.getMappedRange()).toThrowError(/has been destroyed/);
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ WebGL2 -------------------- */

interface WebGl2Harness {
  device: WebGL2Device;
  fake: FakeWebGL2;
  bytesOf(buffer: WebGLBuffer): Uint8Array;
}

/**
 * 假 GL 上叠加一层真实内存语义（`bufferData` 分配 / `bufferSubData` 写 / `getBufferSubData` 读）。
 *
 * `mappedAtCreation` 在 WebGL2 上是**影子缓冲模拟**，所以只有让假 GL 真的存数据，才验证得了
 * 「创建即映射 → 写 → unmap 上传」这条路径真的把字节送到了 GPU 侧。
 */
function createWebGl2Harness(): WebGl2Harness {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const storage = new Map<WebGLBuffer, Uint8Array>();
  const bound = new Map<number, WebGLBuffer | null>();
  const gl = fake.gl as unknown as Record<string, unknown>;

  gl.bindBuffer = (target: number, buffer: WebGLBuffer | null) => {
    bound.set(target, buffer);
  };
  gl.bufferData = (target: number, sizeOrData: number | Uint8Array) => {
    const buffer = bound.get(target);
    if (!buffer) throw new Error('fake gl: bufferData without a bound buffer');
    const byteLength = typeof sizeOrData === 'number' ? sizeOrData : sizeOrData.byteLength;
    storage.set(buffer, new Uint8Array(byteLength));
  };
  gl.bufferSubData = (target: number, offset: number, data: Uint8Array) => {
    const buffer = bound.get(target);
    const bytes = buffer ? storage.get(buffer) : undefined;
    if (!bytes) throw new Error('fake gl: bufferSubData on an unknown buffer');
    bytes.set(data, offset);
  };
  gl.getBufferSubData = (target: number, offset: number, destination: Uint8Array) => {
    const buffer = bound.get(target);
    const bytes = buffer ? storage.get(buffer) : undefined;
    if (!bytes) throw new Error('fake gl: getBufferSubData on an unknown buffer');
    destination.set(bytes.subarray(offset, offset + destination.byteLength));
  };

  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'map-state-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });

  return {
    device,
    fake,
    bytesOf(buffer: WebGLBuffer) {
      const bytes = storage.get(buffer);
      if (!bytes) throw new Error('fake gl: unknown buffer');
      return bytes;
    },
  };
}

describe('WebGL2：mappedAtCreation 与 mapState（#24，影子缓冲模拟）', () => {
  it('mappedAtCreation: true 之后创建即映射（影子缓冲），不需要 mapAsync 就能取范围', () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-mac',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    expect(buffer.mapState).toBe('mapped');
    expect(buffer.mapped).toBe(true);

    const view = byteView(buffer.getMappedRange(4, 4));
    expect(view.byteOffset).toBe(4);
    view.set([0xde, 0xad, 0xbe, 0xef]);
    buffer.unmap();

    expectBytes(harness.bytesOf(buffer.native as WebGLBuffer), [
      0, 0, 0, 0, 0xde, 0xad, 0xbe, 0xef, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(buffer.mapState).toBe('unmapped');

    buffer.destroy();
    harness.device.dispose();
  });

  it('普通创建的 buffer：mapState 从 unmapped → mapped → unmapped（GL 侧没有 pending 窗口）', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-states',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    expect(buffer.mapState).toBe('unmapped');
    await buffer.mapAsync('write');
    expect(buffer.mapState).toBe('mapped');
    buffer.unmap();
    expect(buffer.mapState).toBe('unmapped');

    buffer.destroy();
    harness.device.dispose();
  });

  it('mapState 与实际能力始终一致：unmapped 时取范围抛 ValidationError', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-honest',
      size: 8,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    expect(['unmapped', 'mapped']).toContain(buffer.mapState);
    expect(() => buffer.getMappedRange()).toThrowError(ValidationError);
    await buffer.mapAsync('write');
    expect(buffer.mapState).toBe('mapped');
    expect(buffer.getMappedRange()).toBeInstanceOf(ArrayBuffer);
    buffer.unmap();
    expect(() => buffer.getMappedRange()).toThrowError(ValidationError);

    buffer.destroy();
    expect(buffer.mapState).toBe('unmapped');
    harness.device.dispose();
  });

  it('mappedAtCreation 的视图语义与 mapAsync 一致（视图 / 同一块内存 / unmap 后 detached）', () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-mac-views',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    const whole = buffer.getMappedRange();
    const first = byteView(buffer.getMappedRange(8, 4));
    const second = byteView(buffer.getMappedRange(8, 4));

    expect(first.byteOffset).toBe(8);
    expect(first.buffer).toBe(whole);
    expect(second.buffer).toBe(first.buffer);

    first.set([1, 2, 3, 4]);
    expect([...second]).toEqual([1, 2, 3, 4]);

    buffer.unmap();

    expect(whole.byteLength).toBe(0);
    expect(first.length).toBe(0);
    expect(first[0]).toBeUndefined();
    expect(() => first.slice()).toThrow(TypeError);
    expect(() => buffer.getMappedRange()).toThrow(ValidationError);

    buffer.destroy();
    harness.device.dispose();
  });

  it('mappedAtCreation 后没 unmap 就 destroy()：不抛异常、状态回到 unmapped', () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-mac-destroy',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    byteView(buffer.getMappedRange(0, 4)).set([1, 2, 3, 4]);
    expect(() => buffer.destroy()).not.toThrow();
    expect(buffer.mapState).toBe('unmapped');
    expect(buffer.mapped).toBe(false);

    harness.device.dispose();
  });

  it('mappedAtCreation 与 mapAsync 交叉使用：已映射时 mapAsync 报错，unmap 之后又能正常映射', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-mac-then-async',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
      mappedAtCreation: true,
    });

    await expect(buffer.mapAsync('write')).rejects.toThrowError(ValidationError);
    expect(buffer.mapState).toBe('mapped');

    byteView(buffer.getMappedRange()).set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    buffer.unmap();

    await buffer.mapAsync('write', 0, 8);
    byteView(buffer.getMappedRange(0, 8)).set([16, 15, 14, 13, 12, 11, 10, 9]);
    buffer.unmap();

    expectBytes(harness.bytesOf(buffer.native as WebGLBuffer), [
      16, 15, 14, 13, 12, 11, 10, 9, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('mappedAtCreation 的内容能被后续 read 映射读回（影子缓冲上传真的生效）', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'gl2-mac-roundtrip',
      size: 8,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc | BufferUsage.MapRead,
      mappedAtCreation: true,
    });

    byteView(buffer.getMappedRange()).set([9, 8, 7, 6, 5, 4, 3, 2]);
    buffer.unmap();

    const read = [...new Uint8Array(await buffer.mapAsync('read', 0, 8))];
    buffer.unmap();
    expect(read).toEqual([9, 8, 7, 6, 5, 4, 3, 2]);

    buffer.destroy();
    harness.device.dispose();
  });
});
