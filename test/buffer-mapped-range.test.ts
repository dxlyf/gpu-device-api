/**
 * `Buffer.getMappedRange()` 的**视图语义**回归测试（两个后端各一套）。
 *
 * ## 被修复的缺陷
 *
 * 两个后端在返回「部分范围」时都用了 `ArrayBuffer.slice()`，那是**拷贝**：
 * 调用方拿到一块临时内存，往里写的数据在 `unmap()` 时没有任何东西被上传 ——
 * `mapAsync('write')` → `getMappedRange(offset, size)` → 写 → `unmap()` 这条最常见的
 * 写入路径**静默失效**。两个后端一致地错，所以任何后端对比都发现不了。
 *
 * ## 这里的断言为什么能抓住它
 *
 * 两个测试各自维护一份「GPU 侧」的内存，断言的是**数据真的到达了 buffer**，
 * 而不是「某个方法被调用过」：
 *
 * - WebGL2：假 GL 的 `bufferSubData` / `getBufferSubData` 落在真实的内存表上；
 * - WebGPU：假的原生 `GPUBuffer` 把「GPU 内存」建模成一块 `Uint8Array`，
 *   `getMappedRange()` 返回的就是映射内存本身（`unmap()` 时把映射内存刷回 GPU 内存，
 *   并按原生的语义把它 detach 掉）。
 *
 * 原生 `getMappedRange()` 的语义细节（也在两端实现的注释里写明）：
 * 1. `offset` 相对于**映射范围的起点**（`mapAsync(offset, size)` 的 `offset`），不是 buffer 起点；
 * 2. 同一段范围重复取只能取一次，重叠会报错；因此本库只在 `mapAsync()` 里调一次原生
 *    `getMappedRange()`，其余一律在它返回的内存上建视图；
 * 3. `unmap()` 会让之前取出的所有 `ArrayBuffer` **detach**，此后长度归零、写入被静默忽略
 *    （读元素得到 `undefined`），只有 `slice()` 这类真正触碰底层内存的调用抛 `TypeError`。
 *
 * ⚠️ 调用方注意：`getMappedRange()` 的返回值是 `ArrayBuffer | Uint8Array`，**不要**无脑写成
 * `new Uint8Array(range)` —— `range` 已经是 `Uint8Array` 时那个构造器会逐元素拷贝，
 * 写入就丢了（本文件的 {@link byteView} 是正确写法）。
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

/** `GPUMapMode` 的位标志值（库会把 `'read'` / `'write'` 翻译成它再交给原生 `mapAsync`）。 */
const GPU_MAP_MODE_READ = 1;

/** 把 `ArrayBuffer` 置为 detached（原生 WebGPU 的 `unmap()` 就是这么做的）。 */
function detach(buffer: ArrayBuffer): void {
  const transfer = (buffer as ArrayBuffer & { transfer?: (newByteLength?: number) => ArrayBuffer }).transfer;
  if (typeof transfer !== 'function') {
    throw new Error('this test needs ArrayBuffer.prototype.transfer (Node 22+ / Chrome 114+)');
  }
  transfer.call(buffer, 0);
}

/** 逐字节比较，失败时打印完整内容（比对象比较可读）。 */
function expectBytes(actual: Uint8Array, expected: readonly number[]): void {
  expect([...actual]).toEqual([...expected]);
}

/**
 * 把 `getMappedRange()` 的返回值收成字节视图，且**不拷贝**。
 *
 * 注意不能无脑写成 `new Uint8Array(range)`：`range` 是 `ArrayBuffer` 时那是「映射内存上的视图」，
 * 但 `range` 已经是 `Uint8Array` 时，这个构造器会**逐元素拷贝**，写进去的数据就丢了 ——
 * 正是本次缺陷的另一种表现形式。调用方拿到返回值后应当直接使用，或用这里的显式判断。
 */
function byteView(range: MappedRange): Uint8Array {
  return range instanceof Uint8Array ? range : new Uint8Array(range);
}

/* ------------------------------------------------------------------ WebGPU -------------------- */

interface FakeBufferDescriptor {
  label: string;
  size: number;
  usage: number;
}

/**
 * 假的原生 `GPUBuffer`（只实现本测试需要的映射路径）。
 *
 * 「GPU 内存」是 `contents`；`mapAsync()` 分配一块**独立的映射内存**（真实实现里
 * 它是 buffer 内存上的一块视图 —— 那种 ArrayBuffer 在纯 JS 里造不出来，但这不影响
 * 本测试要验证的性质：库只能通过 `getMappedRange()` 返回的那个 ArrayBuffer 访问映射内存，
 * 所以「往它里面写」与「往映射内存里写」等价）。
 */
class FakeNativeGpuBuffer {
  readonly label: string;
  readonly size: number;
  readonly usage: number;
  /** GPU 侧的内容。 */
  readonly contents: Uint8Array;
  private mapping: { readable: boolean; offset: number; memory: ArrayBuffer; returned: boolean } | null = null;

  constructor(descriptor: FakeBufferDescriptor) {
    this.label = descriptor.label;
    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.contents = new Uint8Array(descriptor.size);
  }

  async mapAsync(mode: number, offset = 0, size = this.size - offset): Promise<void> {
    if (this.mapping) throw new Error(`FakeNativeGpuBuffer "${this.label}": already mapped`);
    const readable = (mode & GPU_MAP_MODE_READ) !== 0;
    const memory = new ArrayBuffer(size);
    if (readable) new Uint8Array(memory).set(this.contents.subarray(offset, offset + size));
    this.mapping = { readable, offset, memory, returned: false };
  }

  /**
   * 原生语义：`offset` 相对映射起点；同一段范围只能取一次（重复取会以「重叠」报错）。
   * 本 mock 只支持「整段」这一次调用 —— 库若还去取子范围，说明它没有复用映射内存，测试会立刻炸。
   */
  getMappedRange(offset = 0, size = (this.mapping?.memory.byteLength ?? 0) - offset): ArrayBuffer {
    const mapping = this.mapping;
    if (!mapping) throw new Error(`FakeNativeGpuBuffer "${this.label}": not mapped`);
    if (offset !== 0 || size !== mapping.memory.byteLength) {
      throw new Error(
        `FakeNativeGpuBuffer "${this.label}": native getMappedRange(${offset}, ${size}) — the mock only ` +
          'supports the full mapped range once',
      );
    }
    if (mapping.returned) {
      throw new Error(`FakeNativeGpuBuffer "${this.label}": range overlaps with a previously returned range`);
    }
    mapping.returned = true;
    return mapping.memory;
  }

  unmap(): void {
    const mapping = this.mapping;
    if (!mapping) return;
    this.mapping = null;
    if (!mapping.readable) this.contents.set(new Uint8Array(mapping.memory), mapping.offset);
    // 原生 unmap() 会让之前 getMappedRange() 取出的 ArrayBuffer 全部 detach。
    detach(mapping.memory);
  }

  destroy(): void {
    this.mapping = null;
  }
}

interface WebGpuHarness {
  device: WebGPUDevice;
  /** 取假的原生 buffer（即「GPU 侧」的内存）。 */
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

describe('WebGPU：getMappedRange 的视图语义', () => {
  it('部分范围写入会真正落到 buffer 上（修复前是写进副本、unmap 时静默丢弃）', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'webgpu-partial-write',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    const view = byteView(buffer.getMappedRange(4, 4));
    view.set([9, 8, 7, 6]);
    buffer.unmap();

    expectBytes(harness.nativeBuffer('webgpu-partial-write').contents, [
      0, 0, 0, 0, 9, 8, 7, 6, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('整段范围写入照旧落到 buffer 上（mapAsync 的返回值就是映射内存本身）', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'webgpu-full-write',
      size: 8,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    const whole = await buffer.mapAsync('write');
    new Uint8Array(whole).set([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(buffer.getMappedRange()).toBe(whole);
    buffer.unmap();

    expectBytes(harness.nativeBuffer('webgpu-full-write').contents, [1, 2, 3, 4, 5, 6, 7, 8]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('mapAsync(offset>0) 之后 getMappedRange 的偏移量相对映射起点（返回的仍是映射内存的视图）', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'webgpu-offset-map',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    // 只映射 [4, 8)：映射范围只有 4 字节，因此库必须把「0」交给原生 getMappedRange
    // （原生是相对映射起点的；传 4 会越界报错）。
    await buffer.mapAsync('write', 4, 4);
    const view = byteView(buffer.getMappedRange(0, 4));
    view.set([4, 3, 2, 1]);
    buffer.unmap();

    expectBytes(harness.nativeBuffer('webgpu-offset-map').contents, [
      0, 0, 0, 0, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('同一段范围重复调用 getMappedRange 得到的是同一块内存的视图（不是各拿一份副本）', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'webgpu-same-memory',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    const first = byteView(buffer.getMappedRange(8, 4));
    const second = byteView(buffer.getMappedRange(8, 4));

    // 同一块内存：底层 ArrayBuffer 与字节偏移都一致；偏移量说明它确实是映射内存上的子视图
    // （而不是另开的 4 字节拷贝）。
    expect(first.byteOffset).toBe(8);
    expect(first.buffer.byteLength).toBe(16);
    expect(second.buffer).toBe(first.buffer);
    expect(second.byteOffset).toBe(first.byteOffset);

    // 通过其中一个视图写，另一个视图立刻看到（证明是别名而不是副本）。
    first.set([0xaa, 0xbb, 0xcc, 0xdd]);
    expect([...second]).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);

    buffer.unmap();
    expect([...harness.nativeBuffer('webgpu-same-memory').contents.slice(8, 12)]).toEqual([
      0xaa, 0xbb, 0xcc, 0xdd,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('unmap() 之后取出的视图失效（detached），再取映射范围则明确报错', async () => {
    const harness = createWebGpuHarness();
    const buffer = harness.device.createBuffer({
      label: 'webgpu-detached',
      size: 16,
      usage: BufferUsage.MapWrite | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    const whole = buffer.getMappedRange();
    const slice = byteView(buffer.getMappedRange(4, 4));
    expect(whole.byteLength).toBe(16);
    expect(slice.length).toBe(4);

    buffer.unmap();

    // 原生 unmap() 会 detach 之前返回的 ArrayBuffer：长度归零。
    // （V8 实测：detach 之后写入是空操作、读元素得到 undefined，只有真正触碰底层内存的
    //   调用才抛 TypeError —— `slice()` 就是这类调用。）
    expect(whole.byteLength).toBe(0);
    expect(slice.length).toBe(0);
    expect(slice[0]).toBeUndefined();
    expect(() => {
      slice[0] = 1;
    }).not.toThrow();
    expect(() => slice.slice()).toThrow(TypeError);

    expect(() => buffer.getMappedRange()).toThrow(ValidationError);

    buffer.destroy();
    harness.device.dispose();
  });
});

/* ------------------------------------------------------------------ WebGL2 -------------------- */

interface WebGl2Harness {
  device: WebGL2Device;
  fake: FakeWebGL2;
  /** 取某个原生 buffer 的「GPU 侧」内容。 */
  bytesOf(buffer: WebGLBuffer): Uint8Array;
}

/**
 * 在假 GL 上补出**真实的内存语义**：`bufferData` 分配、`bufferSubData` 写、`getBufferSubData` 读。
 *
 * 仓库自带的假 GL（`webgl2-fake-gl.ts`）只记录调用、不存数据，因此没法验证「数据到没到 buffer」；
 * 这里在它之上叠加一层内存表，其余入口（设备创建、状态缓存、资源追踪）仍然复用原假 GL。
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
    descriptor: { label: 'mapped-range-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });

  return {
    device,
    fake,
    bytesOf(buffer) {
      const bytes = storage.get(buffer);
      if (!bytes) throw new Error('fake gl: unknown buffer');
      return bytes;
    },
  };
}

describe('WebGL2：getMappedRange 的视图语义（影子缓冲）', () => {
  it('部分范围写入会随 unmap() 上传（修复前是写进副本、上传的是零）', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'webgl2-partial-write',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    const view = byteView(buffer.getMappedRange(4, 4));
    expect(view.byteOffset).toBe(4);
    view.set([9, 8, 7, 6]);
    buffer.unmap();

    expectBytes(harness.bytesOf(buffer.native as WebGLBuffer), [
      0, 0, 0, 0, 9, 8, 7, 6, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('写入后再映射回头读，能读回刚才写进去的字节', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'webgl2-roundtrip',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    byteView(buffer.getMappedRange(4, 4)).set([1, 2, 3, 4]);
    buffer.unmap();

    // mapAsync 的返回值是整段映射范围的 ArrayBuffer（视图，不是拷贝），读回时立即拷走。
    const read = new Uint8Array(await buffer.mapAsync('read', 0, 16));
    const values = [...read];
    buffer.unmap();

    expect(values).toEqual([0, 0, 0, 0, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('同一段范围重复调用 getMappedRange 得到的是同一块影子内存的视图', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'webgl2-same-memory',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    const first = byteView(buffer.getMappedRange(8, 4));
    const second = byteView(buffer.getMappedRange(8, 4));

    expect(first.byteOffset).toBe(8);
    expect(first.buffer.byteLength).toBe(16);
    expect(second.buffer).toBe(first.buffer);
    expect(second.byteOffset).toBe(first.byteOffset);

    first.set([0xaa, 0xbb, 0xcc, 0xdd]);
    expect([...second]).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);

    buffer.unmap();
    expect([...harness.bytesOf(buffer.native as WebGLBuffer).slice(8, 12)]).toEqual([
      0xaa, 0xbb, 0xcc, 0xdd,
    ]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('整段范围仍然返回 mapAsync 的那个 ArrayBuffer（不改既有用法）', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'webgl2-full',
      size: 8,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    const whole = await buffer.mapAsync('write');
    expect(buffer.getMappedRange()).toBe(whole);
    new Uint8Array(whole).set([5, 6, 7, 8, 1, 2, 3, 4]);
    buffer.unmap();

    expectBytes(harness.bytesOf(buffer.native as WebGLBuffer), [5, 6, 7, 8, 1, 2, 3, 4]);

    buffer.destroy();
    harness.device.dispose();
  });

  it('unmap() 之后影子视图失效（detached），与 WebGPU 语义一致', async () => {
    const harness = createWebGl2Harness();
    const buffer = harness.device.createBuffer({
      label: 'webgl2-detached',
      size: 16,
      usage: BufferUsage.CopyDst | BufferUsage.CopySrc,
    });

    await buffer.mapAsync('write');
    const slice = byteView(buffer.getMappedRange(4, 4));
    buffer.unmap();

    expect(slice.length).toBe(0);
    expect(slice[0]).toBeUndefined();
    expect(() => {
      slice[0] = 1;
    }).not.toThrow();
    expect(() => slice.slice()).toThrow(TypeError);
    expect(() => buffer.getMappedRange()).toThrow(ValidationError);

    buffer.destroy();
    harness.device.dispose();
  });
});
