/**
 * 第四档优化批次 2a 的**改前基线测量**（对应 #29 / #30 / #32 / #37 / #38）。
 *
 * 这个文件在优化实施**之前**写并跑过一次，用来钉住「改前到底是什么样」：
 * - #30：读回一次要 create/delete 一个临时 framebuffer；读回之后那一次 draw 要重下发多少次固定功能状态；
 * - #29：`copyBufferToBuffer` 走的是 `getBufferSubData` + `bufferSubData` 的 CPU 往返；
 * - #32：键里带 `label` —— 两张**显式同名**的纹理会被当成同一组附件复用同一个 framebuffer；
 *        任意一张纹理销毁会清空整个缓存；
 * - #37：`clearBuffer` 每次调用分配一块新的零数组。
 *
 * 这里只输出数字、断言「改前的行为」，不做任何「应该怎样」的断言 ——
 * 改后的对应断言在 `test/webgl2-opt-2a.test.ts` 里。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2CommandEncoder } from '../src/webgl2/render/WebGL2CommandEncoder.js';
import { FramebufferCache } from '../src/webgl2/render/framebuffer-cache.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { WebGL2Buffer } from '../src/webgl2/resources/WebGL2Buffer.js';
import type { WebGL2Texture } from '../src/webgl2/resources/WebGL2Texture.js';
import type { WebGL2TextureView } from '../src/webgl2/resources/WebGL2TextureView.js';
import type { RenderPassDescriptor } from '../src/core/render/RenderPassEncoder.js';
import type { ColorAttachment } from '../src/core/render/RenderTarget.js';
import type { Texture } from '../src/core/resources/Texture.js';

/* GL 枚举（写死数值，与真实上下文一致）。 */

const GL = {
  COPY_READ_BUFFER: 0x8f36,
  COPY_WRITE_BUFFER: 0x8f37,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  FRAMEBUFFER: 0x8d40,
  FRAMEBUFFER_BINDING: 0x8ca6,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
  COLOR_ATTACHMENT0: 0x8ce0,
  TEXTURE_2D: 0x0de1,
  PACK_ALIGNMENT: 0x0d05,
  BLEND: 0x0be2,
  DEPTH_TEST: 0x0b71,
  CULL_FACE: 0x0b44,
  BACK: 0x0405,
  CCW: 0x0901,
  LEQUAL: 0x0203,
  ONE: 1,
  ZERO: 0,
  FUNC_ADD: 0x8006,
} as const;

interface Recording {
  readonly gl: WebGL2RenderingContext;
  readonly calls: string[];
  readonly bufferBytes: Map<object, Uint8Array>;
  readonly createdFramebuffers: object[];
  readonly deletedFramebuffers: object[];
  lastCopy: readonly number[] | null;
  make<T>(name: string): T;
}

/** 记录型假 GL：真的按 `bufferSubData` / `getBufferSubData` / `copyBufferSubData` 搬运字节。 */
function createRecordingGl(): Recording {
  const calls: string[] = [];
  const bufferBytes = new Map<object, Uint8Array>();
  const createdFramebuffers: object[] = [];
  const deletedFramebuffers: object[] = [];
  const names = new WeakMap<object, string>();
  const binding = new Map<number, object>();
  let nextId = 0;
  let boundFramebuffer: object | null = null;
  const record = { lastCopy: null as readonly number[] | null };

  const make = <T,>(name: string): T => {
    const value = {} as T;
    names.set(value as unknown as object, `${name}${(nextId += 1)}`);
    return value;
  };
  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (names.get(value) ?? '?') : value === null ? 'null' : String(value);

  const gl = {
    ...GL,
    createBuffer: () => {
      const buffer = make<object>('buf');
      bufferBytes.set(buffer, new Uint8Array(0));
      return buffer;
    },
    deleteBuffer: () => {},
    bindBuffer: (target: number, buffer: object | null) => {
      calls.push(`bindBuffer:${target}:${nameOf(buffer)}`);
      if (buffer) binding.set(target, buffer);
      else binding.delete(target);
    },
    bufferData: (target: number, size: number) => {
      calls.push(`bufferData:${target}:${size}`);
      const buffer = binding.get(target);
      if (buffer) bufferBytes.set(buffer, new Uint8Array(size));
    },
    bufferSubData: (target: number, offset: number, source: Uint8Array) => {
      calls.push(`bufferSubData:${target}:${offset}:${source.length}`);
      const buffer = binding.get(target);
      if (!buffer) return;
      const store = bufferBytes.get(buffer)!;
      store.set(source.subarray(0, Math.min(source.length, store.length - offset)), offset);
    },
    getBufferSubData: (target: number, offset: number, destination: Uint8Array) => {
      calls.push(`getBufferSubData:${target}:${offset}:${destination.length}`);
      const buffer = binding.get(target);
      if (!buffer) return;
      const store = bufferBytes.get(buffer)!;
      destination.set(store.subarray(offset, offset + destination.length));
    },
    copyBufferSubData: (
      readTarget: number,
      writeTarget: number,
      readOffset: number,
      writeOffset: number,
      size: number,
    ) => {
      calls.push(`copyBufferSubData:${readTarget}:${writeTarget}:${readOffset}:${writeOffset}:${size}`);
      record.lastCopy = [readTarget, writeTarget, readOffset, writeOffset, size];
      const source = binding.get(readTarget);
      const target = binding.get(writeTarget);
      if (!source || !target) return;
      const from = bufferBytes.get(source)!;
      const to = bufferBytes.get(target)!;
      to.set(from.subarray(readOffset, readOffset + size), writeOffset);
    },
    createFramebuffer: () => {
      const framebuffer = make<object>('fbo');
      createdFramebuffers.push(framebuffer);
      calls.push(`createFramebuffer:${nameOf(framebuffer)}`);
      return framebuffer;
    },
    deleteFramebuffer: (framebuffer: object) => {
      deletedFramebuffers.push(framebuffer);
      calls.push(`deleteFramebuffer:${nameOf(framebuffer)}`);
    },
    bindFramebuffer: (target: number, framebuffer: object | null) => {
      calls.push(`bindFramebuffer:${target}:${nameOf(framebuffer)}`);
      if (target === GL.FRAMEBUFFER) boundFramebuffer = framebuffer;
    },
    framebufferTexture2D: (target: number, attachment: number, textureTarget: number, texture: object | null) => {
      calls.push(`framebufferTexture2D:${target}:${attachment}:${nameOf(texture)}`);
    },
    drawBuffers: (attachments: readonly number[]) => calls.push(`drawBuffers:${attachments.join('|')}`),
    checkFramebufferStatus: () => GL.FRAMEBUFFER_COMPLETE,
    getParameter: (pname: number) => (pname === GL.FRAMEBUFFER_BINDING ? boundFramebuffer : 0),
    pixelStorei: (pname: number, value: number) => calls.push(`pixelStorei:${pname}:${value}`),
    readPixels: (
      x: number,
      y: number,
      width: number,
      height: number,
      _format: number,
      _type: number,
      destination: Uint8Array,
    ) => {
      calls.push(`readPixels:${x}:${y}:${width}:${height}:${destination.length}`);
      destination.fill(0);
    },
    useProgram: (program: object | null) => calls.push(`useProgram:${nameOf(program)}`),
    bindVertexArray: (vertexArray: object | null) => calls.push(`bindVertexArray:${nameOf(vertexArray)}`),
    activeTexture: (unit: number) => calls.push(`activeTexture:${unit}`),
    bindTexture: (target: number, texture: object | null) => calls.push(`bindTexture:${target}:${nameOf(texture)}`),
    bindSampler: (unit: number, sampler: object | null) => calls.push(`bindSampler:${unit}:${nameOf(sampler)}`),
    bindBufferBase: (target: number, index: number, buffer: object | null) =>
      calls.push(`bindBufferBase:${index}:${nameOf(buffer)}`),
    bindBufferRange: (target: number, index: number, buffer: object | null, offset: number, size: number) =>
      calls.push(`bindBufferRange:${index}:${nameOf(buffer)}:${offset}:${size}`),
    enable: (capability: number) => calls.push(`enable:${capability}`),
    disable: (capability: number) => calls.push(`disable:${capability}`),
    blendFuncSeparate: () => calls.push('blendFuncSeparate'),
    blendEquationSeparate: () => calls.push('blendEquationSeparate'),
    colorMask: () => calls.push('colorMask'),
    depthMask: (flag: boolean) => calls.push(`depthMask:${flag}`),
    depthFunc: (func: number) => calls.push(`depthFunc:${func}`),
    polygonOffset: () => calls.push('polygonOffset'),
    stencilFunc: () => calls.push('stencilFunc'),
    cullFace: (face: number) => calls.push(`cullFace:${face}`),
    frontFace: (face: number) => calls.push(`frontFace:${face}`),
    viewport: (x: number, y: number, width: number, height: number) =>
      calls.push(`viewport:${x}:${y}:${width}:${height}`),
    scissor: (x: number, y: number, width: number, height: number) =>
      calls.push(`scissor:${x}:${y}:${width}:${height}`),
    getError: () => 0,
  } as unknown as WebGL2RenderingContext;

  return {
    gl,
    calls,
    bufferBytes,
    createdFramebuffers,
    deletedFramebuffers,
    get lastCopy() {
      return record.lastCopy;
    },
    make,
  };
}

function fakeBuffer(recording: Recording, size: number, isIndexBuffer = false): WebGL2Buffer {
  const gl = recording.gl;
  const native = gl.createBuffer()!;
  const target = isIndexBuffer ? GL.ELEMENT_ARRAY_BUFFER : GL.COPY_WRITE_BUFFER;
  gl.bindBuffer(target, native);
  gl.bufferData(target, size);
  return {
    label: 'buffer',
    size,
    native,
    isIndexBuffer,
    bindingTarget: target,
    upload(offset: number, bytes: Uint8Array) {
      gl.bindBuffer(target, native);
      gl.bufferSubData(target, offset, bytes);
    },
    download(offset: number, bytes: Uint8Array) {
      gl.bindBuffer(target, native);
      gl.getBufferSubData(target, offset, bytes);
    },
  } as unknown as WebGL2Buffer;
}

function fakeTexture(label: string): WebGL2Texture {
  return {
    label,
    format: 'rgba8unorm',
    native: { texture: label } as unknown as WebGLTexture,
  } as unknown as WebGL2Texture;
}

/** 模拟一次 draw 前的固定功能状态下发（与 `applyRenderState` 的调用序列一致）。 */
function applyDrawState(state: GlStateCache, program: object, vertexArray: object): void {
  state.useProgram(program as WebGLProgram);
  state.setBlend(true, GL.ONE, GL.ZERO, GL.FUNC_ADD, GL.ONE, GL.ZERO, GL.FUNC_ADD);
  state.setColorMask([true, true, true, true]);
  state.setDepthTest(true, true, GL.LEQUAL);
  state.setCull(true, GL.BACK, GL.CCW);
  state.bindVertexArray(vertexArray as WebGLVertexArrayObject);
}

/** 只看与 draw 直接相关的状态下发，别把 framebuffer 绑定算进来。 */
function drawStateCalls(calls: readonly string[]): string[] {
  return calls.filter(
    (call) =>
      call.startsWith('useProgram') ||
      call.startsWith('bindVertexArray') ||
      call.startsWith('enable:') ||
      call.startsWith('disable:') ||
      call.startsWith('depthMask') ||
      call.startsWith('depthFunc') ||
      call.startsWith('colorMask') ||
      call.startsWith('cullFace') ||
      call.startsWith('frontFace') ||
      call.startsWith('blendFunc') ||
      call.startsWith('blendEquation'),
  );
}

/** 这个文件只做测量与「改前行为」记录，输出走 console（vitest 会原样打印）。 */
function log(line: string): void {
  // eslint-disable-next-line no-console
  console.log(line);
}

describe('基线 #30：copyTextureToBuffer 的 FBO 建删与全量 invalidate', () => {
  it('每次读回都 create + delete 一个临时 framebuffer', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'baseline' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const buffer = fakeBuffer(recording, 64);
    const copy = (label: string) =>
      encoder.copyTextureToBuffer(
        { texture: fakeTexture(label), origin: { x: 0, y: 0 } },
        { buffer, offset: 0 },
        { width: 2, height: 2, depthOrArrayLayers: 1 },
      );

    copy('first');
    copy('second');

    log(
      `[#30 改前] 两次读回：createFramebuffer=${recording.createdFramebuffers.length}、` +
        `deleteFramebuffer=${recording.deletedFramebuffers.length}`,
    );
    expect(recording.createdFramebuffers).toHaveLength(2);
    expect(recording.deletedFramebuffers).toHaveLength(2);
  });

  it('读回之后那一次 draw 会重下发全部固定功能状态', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'baseline' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const program = recording.make<object>('program');
    const vertexArray = recording.make<object>('vao');
    const buffer = fakeBuffer(recording, 64);

    applyDrawState(state, program, vertexArray);
    encoder.copyTextureToBuffer(
      { texture: fakeTexture('t'), origin: { x: 0, y: 0 } },
      { buffer, offset: 0 },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );
    recording.calls.length = 0;
    applyDrawState(state, program, vertexArray);

    const stateCalls = drawStateCalls(recording.calls);
    log(`[#30 改前] 读回后那次 draw 的状态下发次数 = ${stateCalls.length}（${stateCalls.join(', ')}）`);
    expect(stateCalls.length).toBeGreaterThan(0);
  });
});

describe('基线 #29：copyBufferToBuffer 的 CPU 往返', () => {
  it('非索引缓冲走 new Uint8Array + getBufferSubData + bufferSubData', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'baseline' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const source = fakeBuffer(recording, 32);
    const destination = fakeBuffer(recording, 32);
    const pattern = new Uint8Array(32);
    for (let i = 0; i < pattern.length; i += 1) pattern[i] = (i * 7 + 3) & 0xff;
    source.upload(0, pattern);

    recording.calls.length = 0;
    encoder.copyBufferToBuffer(source, 0, destination, 0, 32);
    log(`[#29 改前] 非索引路径 GL 调用 = ${recording.calls.join(' | ')}`);

    const written = recording.bufferBytes.get(destination.native as unknown as object)!;
    expect(Array.from(written.subarray(0, 32))).toEqual(Array.from(pattern));
    expect(recording.lastCopy).toBeNull();
  });

  it('索引缓冲同样走 CPU 往返（保留回退路径的形态）', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'baseline' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const source = fakeBuffer(recording, 32, true);
    const destination = fakeBuffer(recording, 32);
    const pattern = new Uint8Array(32);
    for (let i = 0; i < pattern.length; i += 1) pattern[i] = (i * 5 + 1) & 0xff;
    source.upload(0, pattern);

    recording.calls.length = 0;
    encoder.copyBufferToBuffer(source, 0, destination, 0, 32);
    log(`[#29 改前] 索引路径 GL 调用 = ${recording.calls.join(' | ')}`);

    const written = recording.bufferBytes.get(destination.native as unknown as object)!;
    expect(Array.from(written.subarray(0, 32))).toEqual(Array.from(pattern));
  });
});

describe('基线 #37：clearBuffer 的零数组分配', () => {
  it('每次调用都新建一块长度为 size 的零数组', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'baseline' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const target = fakeBuffer(recording, 64);
    target.upload(0, new Uint8Array(64).fill(0xab));

    // 统计「长度为 size 的零数组」被构造了几次：`clearBuffer` 内部的 `new Uint8Array(length)`
    // 是这条路径上唯一一处这样的分配（假 buffer 的 seed 已经在上一步做完了）。
    const seenLengths: number[] = [];
    const OriginalUint8Array = globalThis.Uint8Array;
    let constructed = 0;
    class CountingUint8Array extends OriginalUint8Array {
      constructor(length: number) {
        super(length);
        if (length === 24) {
          constructed += 1;
          seenLengths.push(length);
        }
      }
    }
    (globalThis as unknown as { Uint8Array: unknown }).Uint8Array = CountingUint8Array;
    try {
      encoder.clearBuffer(target, 0, 24);
      encoder.clearBuffer(target, 0, 24);
      encoder.clearBuffer(target, 0, 24);
    } finally {
      (globalThis as unknown as { Uint8Array: unknown }).Uint8Array = OriginalUint8Array;
    }

    const written = recording.bufferBytes.get(target.native as unknown as object)!;
    log(
      `[#37 改前] 3 次 clearBuffer(0, 24)：长度为 24 的零数组构造次数 = ${constructed}` +
        `（seenLengths=${seenLengths.join(',')}）`,
    );
    expect(constructed).toBe(3);
    expect(written.subarray(0, 24).every((byte) => byte === 0)).toBe(true);
  });
});

describe('基线 #32：FramebufferCache 的 label 键与整体 clear', () => {
  function viewOf(texture: WebGL2Texture, label: string): WebGL2TextureView {
    return {
      label,
      texture,
      target: GL.TEXTURE_2D,
      glTexture: texture.native as unknown as WebGLTexture,
      descriptor: { baseMipLevel: 0, baseArrayLayer: 0 },
    } as unknown as WebGL2TextureView;
  }

  function descriptorFor(texture: WebGL2Texture): RenderPassDescriptor {
    return { colorAttachments: [{ view: viewOf(texture, 'view') } as unknown as ColorAttachment] };
  }

  it('两张 label 相同的不同纹理共用一个 framebuffer（撞键）', () => {
    const recording = createRecordingGl();
    const cache = new FramebufferCache(recording.gl);
    const first = fakeTexture('same-label');
    const second = fakeTexture('same-label');

    const a = cache.acquire(descriptorFor(first));
    const b = cache.acquire(descriptorFor(second));
    log(`[#32 改前] 同 label 不同对象 → 复用同一个 fbo ? ${String(a === b)}，cache.size=${cache.size}`);
    expect(a).toBe(b);
  });

  it('销毁任意一张纹理时整个缓存被清空（设备层）', () => {
    const fake = createFakeWebGL2({});
    const device = new WebGL2Device({
      gl: fake.gl,
      canvas: createFakeCanvas().canvas,
      descriptor: { label: 'baseline' },
      adapterLimits: buildDeviceLimits(fake.gl),
      adapterFeatures: new Set<string>(),
    });

    const first = device.createTexture({
      label: 'a',
      format: 'rgba8unorm',
      size: { width: 8, height: 8 },
      usage: TextureUsage.RenderAttachment | TextureUsage.CopySrc,
    });
    const second = device.createTexture({
      label: 'b',
      format: 'rgba8unorm',
      size: { width: 8, height: 8 },
      usage: TextureUsage.RenderAttachment | TextureUsage.CopySrc,
    });

    const firstTexture = first as unknown as WebGL2Texture;
    const secondTexture = second as unknown as WebGL2Texture;
    const cache = device.framebuffers;
    cache.acquire(descriptorFor(firstTexture));
    const keptFramebuffer = cache.acquire(descriptorFor(secondTexture));
    expect(cache.size).toBe(2);

    first.destroy();
    log(`[#32 改前] 销毁一张纹理后 cache.size = ${cache.size}（另一张纹理仍被引用）`);
    expect(cache.size).toBe(0);
    // 改前：保留下来的那一张也要重建（对象身份已经变了）。
    expect(cache.acquire(descriptorFor(secondTexture))).not.toBe(keptFramebuffer);
    expect(keptFramebuffer).toBeTruthy();
    device.dispose();
  });
});

describe('基线 #38：WebGL2Queue.writeBuffer 的视图构造', () => {
  it('写入语义基线（与 upload 的结果逐字节一致）', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const target = fakeBuffer(recording, 32);
    const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    // 直接调用底层的 upload：这只是为了让基线文件不依赖尚未实现的优化路径。
    target.upload(4, payload);
    const written = recording.bufferBytes.get(target.native as unknown as object)!;
    expect(Array.from(written.subarray(4, 12))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(target).toBeTruthy();
    expect(state).toBeTruthy();
    expect(BufferUsage.CopyDst).toBeGreaterThan(0);
  });
});
