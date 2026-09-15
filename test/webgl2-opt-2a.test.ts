/**
 * 第四档优化批次 2a 的证据测试（对应 #29 / #30 / #32 / #37 / #38）。
 *
 * 这个文件同时承担两件事：
 * 1. **前后对照数字**：用一台记录型假 GL 统计「一次读回之后的那次 draw 要下发多少次固定功能状态」、
 *    `copyBufferToBuffer` 下发了哪些调用、`clearBuffer` 分配了几块零数组、读回创建/删除了几个
 *    framebuffer —— 改前的数字由 `test/webgl2-opt-2a-baseline.test.ts`（同一台假 GL）钉住；
 * 2. **语义断言**：优化不允许改变结果（逐字节一致、GL 调用形态正确、缓存键按对象身份、
 *    精准淘汰而不是整体清空）。
 *
 * 用假 GL 而不是真实上下文，是因为这里要测的是「本层下发了什么」，真实上下文看不到调用次数；
 * 真实上下文里的耗时与逐字节一致性由 `.tmp-probe/gl-probe.ts`（无头 Chrome + SwiftShader）负责。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2CommandEncoder } from '../src/webgl2/render/WebGL2CommandEncoder.js';
import { WebGL2Queue } from '../src/webgl2/sync/WebGL2Queue.js';
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
    bufferData: (target: number, size: number, _usage: number) => {
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
    framebufferTexture2D: (
      target: number,
      attachment: number,
      _textureTarget: number,
      texture: object | null,
      mipLevel: number,
    ) => {
      calls.push(`framebufferTexture2D:${target}:${attachment}:${nameOf(texture)}@${mipLevel}`);
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
    bindBufferBase: (_target: number, index: number, buffer: object | null) =>
      calls.push(`bindBufferBase:${index}:${nameOf(buffer)}`),
    bindBufferRange: (_target: number, index: number, buffer: object | null, offset: number, size: number) =>
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
  gl.bufferData(target, size, 0x88e8 /* DYNAMIC_DRAW */);
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

describe('优化后 #30：copyTextureToBuffer 的 FBO 复用与收窄的失效', () => {
  it('复用同一块读回 framebuffer：两次读回只 create 一次、不 delete', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
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
      `[#30 改后] 两次读回：createFramebuffer=${recording.createdFramebuffers.length}、` +
        `deleteFramebuffer=${recording.deletedFramebuffers.length}（改前是 2 / 2）`,
    );
    expect(recording.createdFramebuffers).toHaveLength(1);
    expect(recording.deletedFramebuffers).toHaveLength(0);
  });

  it('读回之后那一次 draw 一次固定功能状态都不重下发', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
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
    log(
      `[#30 改后] 读回后那次 draw 的状态下发次数 = ${stateCalls.length}` +
        `（改前 13：${stateCalls.length === 0 ? '全部命中缓存' : stateCalls.join(', ')}）`,
    );
    // 一次都不该重下发：读回只动过 framebuffer 绑定，program/blend/depth/cull/VAO 都没变。
    expect(stateCalls).toEqual([]);
  });

  it('读回之后 framebuffer 绑定记录被作废（下一次会如实重绑，而不是以为还绑着）', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const buffer = fakeBuffer(recording, 64);
    const target = recording.make<object>('user-fbo') as unknown as WebGLFramebuffer;

    state.bindFramebuffer(target);
    encoder.copyTextureToBuffer(
      { texture: fakeTexture('t'), origin: { x: 0, y: 0 } },
      { buffer, offset: 0 },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );
    // 读回把绑定恢复成进入前的那个 framebuffer（不会把它留在读回 framebuffer 上）。
    expect(state.currentFramebuffer()).toBe(target);
  });

  it('外部直接改过 framebuffer 绑定之后，缓存里的记录不能当成事实', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const target = recording.make<object>('user-fbo') as unknown as WebGLFramebuffer;
    const other = recording.make<object>('other-fbo') as unknown as WebGLFramebuffer;

    // 模拟「通过 device.native 绕过缓存」：先让缓存以为是 target，再直接绑到 other。
    state.bindFramebuffer(target);
    recording.gl.bindFramebuffer(GL.FRAMEBUFFER, other);
    // 缓存不知道被改过 → 绑 target 会被当成「已经是 target」而跳过。
    recording.calls.length = 0;
    state.bindFramebuffer(target);
    expect(recording.calls).toEqual([]);

    // 这正是读回路径要作废记录的原因：作废之后必须如实重绑。
    state.invalidateFramebufferBinding();
    recording.calls.length = 0;
    state.bindFramebuffer(target);
    expect(recording.calls.filter((call) => call.startsWith('bindFramebuffer'))).toHaveLength(1);
  });
});

describe('优化后 #29：copyBufferToBuffer 走 GPU 侧拷贝', () => {
  it('非索引路径只剩 3 次调用（copyBufferSubData），且字节完全一致', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const source = fakeBuffer(recording, 32);
    const destination = fakeBuffer(recording, 32);
    const pattern = new Uint8Array(32);
    for (let i = 0; i < pattern.length; i += 1) pattern[i] = (i * 7 + 3) & 0xff;
    source.upload(0, pattern);

    recording.calls.length = 0;
    encoder.copyBufferToBuffer(source, 0, destination, 0, 32);
    log(`[#29 改后] 非索引路径 GL 调用 = ${recording.calls.join(' | ')}（改前 4 次，含 CPU 往返）`);

    // 先绑目标写槽、再绑源读槽、然后一次 GPU 侧拷贝。
    expect(recording.calls).toEqual([
      `bindBuffer:${GL.COPY_WRITE_BUFFER}:buf2`,
      `bindBuffer:${GL.COPY_READ_BUFFER}:buf1`,
      `copyBufferSubData:${GL.COPY_READ_BUFFER}:${GL.COPY_WRITE_BUFFER}:0:0:32`,
    ]);
    expect(recording.lastCopy).toEqual([GL.COPY_READ_BUFFER, GL.COPY_WRITE_BUFFER, 0, 0, 32]);

    const written = recording.bufferBytes.get(destination.native as unknown as object)!;
    expect(Array.from(written.subarray(0, 32))).toEqual(Array.from(pattern));
  });

  it('拷贝结束后 COPY_WRITE_BUFFER 上留下的仍然是目标缓冲（upload 的不变量）', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const source = fakeBuffer(recording, 32);
    const destination = fakeBuffer(recording, 32);
    source.upload(0, new Uint8Array(32).fill(7));

    recording.calls.length = 0;
    encoder.copyBufferToBuffer(source, 0, destination, 0, 32);
    log(`[#29 改后] 拷贝后写槽绑定 = ${recording.calls.join(' | ')}`);
    expect(recording.calls).toEqual([
      `bindBuffer:${GL.COPY_WRITE_BUFFER}:buf2`,
      `bindBuffer:${GL.COPY_READ_BUFFER}:buf1`,
      `copyBufferSubData:${GL.COPY_READ_BUFFER}:${GL.COPY_WRITE_BUFFER}:0:0:32`,
    ]);
    expect(destination).toBeTruthy();
  });

  it('偏移拷贝逐字节一致（源/目标各取一段）', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const source = fakeBuffer(recording, 64);
    const destination = fakeBuffer(recording, 64);
    const seed = new Uint8Array(64);
    for (let i = 0; i < seed.length; i += 1) seed[i] = (i * 11 + 5) & 0xff;
    source.upload(0, seed);
    destination.upload(0, new Uint8Array(64).fill(0xee));

    encoder.copyBufferToBuffer(source, 8, destination, 40, 16);
    const written = recording.bufferBytes.get(destination.native as unknown as object)!;
    expect(Array.from(written.subarray(40, 56))).toEqual(Array.from(seed.subarray(8, 24)));
    // 区间外一个字节都不能被碰。
    expect(written.subarray(0, 40).every((byte) => byte === 0xee)).toBe(true);
    expect(written.subarray(56).every((byte) => byte === 0xee)).toBe(true);
  });

  it('同一个 buffer 的重叠区间回退 CPU（GL 不允许重叠拷贝）', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const buffer = fakeBuffer(recording, 64);
    const seed = new Uint8Array(64);
    for (let i = 0; i < seed.length; i += 1) seed[i] = i & 0xff;
    buffer.upload(0, seed);

    encoder.copyBufferToBuffer(buffer, 0, buffer, 8, 16);
    log(`[#29 改后] 重叠区间走 CPU 回退，未调用 copyBufferSubData（lastCopy=${String(recording.lastCopy)}）`);
    expect(recording.lastCopy).toBeNull();
    // memmove 语义：先整段读出来再写回，源区间的内容原样搬过去。
    const written = recording.bufferBytes.get(buffer.native as unknown as object)!;
    expect(Array.from(written.subarray(8, 24))).toEqual(Array.from(seed.subarray(0, 16)));
  });

  it('索引缓冲仍然走 CPU 回退，两侧各自走自己的目标', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const source = fakeBuffer(recording, 32, true);
    const destination = fakeBuffer(recording, 32);
    const pattern = new Uint8Array(32);
    for (let i = 0; i < pattern.length; i += 1) pattern[i] = (i * 5 + 1) & 0xff;
    source.upload(0, pattern);

    recording.calls.length = 0;
    encoder.copyBufferToBuffer(source, 0, destination, 0, 32);
    log(`[#29 改后] 索引路径 GL 调用 = ${recording.calls.join(' | ')}（仍为 CPU 往返）`);

    // 读回走 ELEMENT_ARRAY_BUFFER，写回走 COPY_WRITE_BUFFER；绝不调用 copyBufferSubData。
    expect(recording.lastCopy).toBeNull();
    expect(recording.calls[1]).toBe(`getBufferSubData:${GL.ELEMENT_ARRAY_BUFFER}:0:32`);
    expect(recording.calls[3]).toBe(`bufferSubData:${GL.COPY_WRITE_BUFFER}:0:32`);

    const written = recording.bufferBytes.get(destination.native as unknown as object)!;
    expect(Array.from(written.subarray(0, 32))).toEqual(Array.from(pattern));
  });
});

describe('优化后 #37：clearBuffer 的共享零暂存', () => {
  it('不再为清零分配零数组，结果逐字节正确', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const target = fakeBuffer(recording, 64);
    target.upload(0, new Uint8Array(64).fill(0xab));

    // 统计「长度为 24 的零数组」被构造了几次：改前是每次 clearBuffer 一次。
    let constructed = 0;
    const OriginalUint8Array = globalThis.Uint8Array;
    class CountingUint8Array extends OriginalUint8Array {
      constructor(length: number) {
        super(length);
        if (length === 24) constructed += 1;
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
    log(`[#37 改后] 3 次 clearBuffer(0, 24)：长度为 24 的零数组构造次数 = ${constructed}（改前 3）`);
    expect(constructed).toBe(0);
    expect(written.subarray(0, 24).every((byte) => byte === 0)).toBe(true);
    // 清零不能越界：24 字节之后的内容原样保留。
    expect(written.subarray(24).every((byte) => byte === 0xab)).toBe(true);
  });

  it('大区间按块清零，结果仍然是全零', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const size = 4096 * 2 + 100; // 跨三个块：4096 + 4096 + 100
    const target = fakeBuffer(recording, size);
    target.upload(0, new Uint8Array(size).fill(0xcd));

    encoder.clearBuffer(target, 0);
    const written = recording.bufferBytes.get(target.native as unknown as object)!;
    const chunks = recording.calls.filter((call) => call.startsWith('bufferSubData'));
    log(`[#37 改后] clearBuffer(${size}) 的块数 = ${chunks.length}（每块 ≤ 4096，且每块起点 4 对齐）`);
    expect(written.every((byte) => byte === 0)).toBe(true);
    // 第一项是造数据用的整体上传，后三项才是 clearBuffer 的块。
    expect(chunks.slice(0)).toEqual([
      `bufferSubData:${GL.COPY_WRITE_BUFFER}:0:${size}`,
      `bufferSubData:${GL.COPY_WRITE_BUFFER}:0:4096`,
      `bufferSubData:${GL.COPY_WRITE_BUFFER}:4096:4096`,
      `bufferSubData:${GL.COPY_WRITE_BUFFER}:8192:100`,
    ]);
  });

  it('带偏移的清零只覆盖 [offset, offset + size)', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const encoder = new WebGL2CommandEncoder({ label: 'final' }, recording.gl, state, {} as WebGL2RenderPassOptions);
    const target = fakeBuffer(recording, 32);
    target.upload(0, new Uint8Array(32).fill(0x11));

    encoder.clearBuffer(target, 8, 12);
    const written = recording.bufferBytes.get(target.native as unknown as object)!;
    expect(Array.from(written.subarray(0, 8))).toEqual(new Array(8).fill(0x11));
    expect(Array.from(written.subarray(8, 20))).toEqual(new Array(12).fill(0));
    expect(Array.from(written.subarray(20))).toEqual(new Array(12).fill(0x11));
  });
});

describe('优化后 #32：FramebufferCache 的对象身份键与精准淘汰', () => {
  function viewOf(texture: WebGL2Texture, label: string, baseMipLevel = 0): WebGL2TextureView {
    return {
      label,
      texture,
      target: GL.TEXTURE_2D,
      glTexture: texture.native as unknown as WebGLTexture,
      descriptor: { baseMipLevel, baseArrayLayer: 0 },
    } as unknown as WebGL2TextureView;
  }

  function descriptorFor(texture: WebGL2Texture, label = 'view', baseMipLevel = 0): RenderPassDescriptor {
    return {
      colorAttachments: [{ view: viewOf(texture, label, baseMipLevel) } as unknown as ColorAttachment],
    };
  }

  it('label 相同但对象不同的两张纹理必须拿到不同的 framebuffer（改前会复用同一个）', () => {
    const recording = createRecordingGl();
    const cache = new FramebufferCache(recording.gl);
    const first = fakeTexture('same-label');
    const second = fakeTexture('same-label');

    // 连 view 的 label 也完全相同：键只能靠对象身份区分。
    const a = cache.acquire(descriptorFor(first));
    const b = cache.acquire(descriptorFor(second));
    log(`[#32 改后] 同 label 不同对象 → 复用同一个 fbo ? ${String(a === b)}，cache.size=${cache.size}（改前 true / 1）`);

    expect(a).not.toBe(b);
    expect(cache.size).toBe(2);
    // 同一个对象再 acquire 必须命中缓存（身份键的一致性与 label 无关）。
    expect(cache.acquire(descriptorFor(first))).toBe(a);
    expect(cache.size).toBe(2);
  });

  it('同一个纹理的不同 mip 是不同的附件组合，且按各自的 mip 挂到附件上', () => {
    const recording = createRecordingGl();
    const cache = new FramebufferCache(recording.gl);
    // 用 recording.make 造 native：这样 framebufferTexture2D 的记录里能看到纹理名，
    // 否则 nameOf 会返回 '?'（对象没登记过名字）。
    const texture = {
      label: 'mips',
      format: 'rgba8unorm',
      native: recording.make<object>('tex'),
    } as unknown as WebGL2Texture;

    const mip0 = cache.acquire(descriptorFor(texture, 'view', 0));
    const mip1 = cache.acquire(descriptorFor(texture, 'view', 1));
    expect(mip0).not.toBe(mip1);
    expect(cache.size).toBe(2);

    // 两次挂附件用的是同一个纹理、但 mip 分别是 0 和 1（改前恒挂 0，键里区分 mip 就没意义）。
    const attachments = recording.calls.filter((call) => call.startsWith('framebufferTexture2D'));
    log(`[#32 改后] 两个 mip 的 framebufferTexture2D = ${attachments.join(' | ')}`);
    expect(attachments).toHaveLength(2);
    expect(attachments[0]?.endsWith('@0')).toBe(true);
    expect(attachments[1]?.endsWith('@1')).toBe(true);
  });

  it('销毁一张纹理只淘汰引用它的条目，另一个 framebuffer 保持对象身份（设备层）', () => {
    const fake = createFakeWebGL2({});
    const device = new WebGL2Device({
      gl: fake.gl,
      canvas: createFakeCanvas().canvas,
      descriptor: { label: 'final' },
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

    const deletedBefore = fake.counters.deletedFramebuffers;
    first.destroy();
    log(
      `[#32 改后] 销毁一张纹理后 cache.size = ${cache.size}（改前 0），` +
        `删掉的 framebuffer 数 = ${fake.counters.deletedFramebuffers - deletedBefore}`,
    );
    expect(cache.size).toBe(1);
    // 无关的那一个必须**原样留着**（改前会被整体 clear 掉，身份也变了）。
    expect(cache.acquire(descriptorFor(secondTexture))).toBe(keptFramebuffer);
    device.dispose();
  });

  it('超过上限时按 LRU 淘汰最旧的条目（并真的删除那个 framebuffer）', () => {
    const recording = createRecordingGl();
    const cache = new FramebufferCache(recording.gl, { limit: 3 });

    const textures = [fakeTexture('t0'), fakeTexture('t1'), fakeTexture('t2'), fakeTexture('t3')];
    const framebuffers = textures.map((texture) => cache.acquire(descriptorFor(texture, texture.label)));
    log(
      `[#32 改后] limit=3 塞 4 个：cache.size=${cache.size}，` +
        `deleteFramebuffer=${recording.deletedFramebuffers.length}`,
    );

    expect(cache.size).toBe(3);
    expect(recording.deletedFramebuffers).toHaveLength(1);
    // 最旧的 t0 被淘汰，其余保持原对象。
    expect(cache.acquire(descriptorFor(textures[1]!))).toBe(framebuffers[1]);
    expect(cache.acquire(descriptorFor(textures[0]!))).not.toBe(framebuffers[0]);
  });
});

describe('#38：WebGL2Queue.writeBuffer 的写入语义', () => {
  it('与直接 upload 同一段数据的字节完全一致', () => {
    const recording = createRecordingGl();
    const state = new GlStateCache(recording.gl);
    const queue = new WebGL2Queue(recording.gl, state);
    const target = fakeBuffer(recording, 32);

    const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    queue.writeBuffer(target as never, 4, payload);
    const written = recording.bufferBytes.get(target.native as unknown as object)!;
    expect(Array.from(written.subarray(4, 12))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(BufferUsage.CopyDst).toBeGreaterThan(0);
  });
});
