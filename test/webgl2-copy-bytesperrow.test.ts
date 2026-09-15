/**
 * `WebGL2CommandEncoder.copyTextureToBuffer()` 的 `bytesPerRow` 回归测试。
 *
 * 被修的 bug：实现把 `gl.readPixels` 的结果**紧凑**写进一块按 `bytesPerRow` 决定大小的缓冲，
 * 而 `bytesPerRow` 只被用来 `new Uint8Array(...)` 定大小。于是任何按 WebGPU 规范传
 * 256 对齐行距的调用方（例如宽 96 → 传 512，而一行实际只有 384 字节）读到的数据整体错位：
 * 第 1 行被写在偏移 384 而不是 512，缓冲后半段只剩 0。
 *
 * 这里用一台假 GL 逐字节验证修复后的排布：假 `readPixels` 按**紧凑**行距填一个可预测的图案
 * （并记下收到的缓冲长度），断言上传到目标 buffer 的字节里
 * 「每行内容落在 `row * bytesPerRow`、行间填充为 0、且 readPixels 收到的是紧凑大小」。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2CommandEncoder } from '../src/webgl2/render/WebGL2CommandEncoder.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import { ValidationError } from '../src/core/errors/index.js';
import type { WebGL2Texture } from '../src/webgl2/resources/WebGL2Texture.js';
import type { WebGL2Buffer } from '../src/webgl2/resources/WebGL2Buffer.js';

/* GL 枚举（写死数值，与真实上下文一致）。 */
const GL_FRAMEBUFFER = 0x8d40;
const GL_COLOR_ATTACHMENT0 = 0x8ce0;
const GL_FRAMEBUFFER_COMPLETE = 0x8cd5;
const GL_FRAMEBUFFER_BINDING = 0x8ca6;
const GL_TEXTURE_2D = 0x0de1;
const GL_PACK_ALIGNMENT = 0x0d05;
const GL_RGBA = 0x1908;
const GL_UNSIGNED_BYTE = 0x1401;

interface ReadCall {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 交给 `readPixels` 的缓冲长度 —— 必须是紧凑大小，不能是按 bytesPerRow 算出来的大小。 */
  byteLength: number;
}

interface FakeGl {
  readonly gl: WebGL2RenderingContext;
  /** 每次 `readPixels` 的记录。 */
  readonly reads: ReadCall[];
  /** 每个时刻的 `PACK_ALIGNMENT` 值（按调用顺序）。 */
  readonly packAlignment: number[];
  /** readPixels 时观察到的 PACK_ALIGNMENT。 */
  readonly packAlignmentAtRead: number[];
  readonly deletes: string[];
}

function createFakeGl(): FakeGl {
  const reads: ReadCall[] = [];
  const packAlignment: number[] = [];
  const packAlignmentAtRead: number[] = [];
  const deletes: string[] = [];
  let alignment = 4;
  let nextId = 0;

  const gl = {
    FRAMEBUFFER: GL_FRAMEBUFFER,
    READ_FRAMEBUFFER: 0x8ca8,
    DRAW_FRAMEBUFFER: 0x8ca9,
    COLOR_ATTACHMENT0: GL_COLOR_ATTACHMENT0,
    DEPTH_ATTACHMENT: 0x8d00,
    FRAMEBUFFER_COMPLETE: GL_FRAMEBUFFER_COMPLETE,
    FRAMEBUFFER_BINDING: GL_FRAMEBUFFER_BINDING,
    TEXTURE_2D: GL_TEXTURE_2D,
    PACK_ALIGNMENT: GL_PACK_ALIGNMENT,
    RGBA: GL_RGBA,
    UNSIGNED_BYTE: GL_UNSIGNED_BYTE,
    createFramebuffer: () => ({ id: (nextId += 1) }),
    deleteFramebuffer: (framebuffer: unknown) => {
      deletes.push(`framebuffer${(framebuffer as { id: number }).id}`);
    },
    getParameter: (pname: number) => (pname === GL_FRAMEBUFFER_BINDING ? null : 0),
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    checkFramebufferStatus: () => GL_FRAMEBUFFER_COMPLETE,
    pixelStorei: (pname: number, value: number) => {
      if (pname === GL_PACK_ALIGNMENT) {
        alignment = value;
        packAlignment.push(value);
      }
    },
    readPixels: (
      x: number,
      y: number,
      width: number,
      height: number,
      _format: number,
      _type: number,
      dst: Uint8Array,
    ) => {
      reads.push({ x, y, width, height, byteLength: dst.length });
      packAlignmentAtRead.push(alignment);
      // 按**紧凑**行距填图案：第 row 行第 col 个像素 = (row * 16 + col, 200, 100, 255)。
      for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) {
          const at = (row * width + col) * 4;
          dst[at] = (row * 16 + col) & 0xff;
          dst[at + 1] = 200;
          dst[at + 2] = 100;
          dst[at + 3] = 255;
        }
      }
    },
  } as unknown as WebGL2RenderingContext;

  return { gl, reads, packAlignment, packAlignmentAtRead, deletes };
}

interface Harness {
  readonly encoder: WebGL2CommandEncoder;
  readonly fake: FakeGl;
  /** 目标 buffer（必须交给 encoder 的就是**这一个**，否则 `uploaded()` 看不到东西）。 */
  readonly buffer: WebGL2Buffer;
  /** 最近一次上传到目标 buffer 的字节。 */
  uploaded(): Uint8Array | null;
  uploadedOffset(): number;
}

function createHarness(): Harness {
  const fake = createFakeGl();
  const state = new GlStateCache(fake.gl);
  let last: Uint8Array | null = null;
  let lastOffset = -1;
  const buffer = {
    upload(offset: number, data: Uint8Array) {
      lastOffset = offset;
      last = data.slice();
    },
  } as unknown as WebGL2Buffer;
  const encoder = new WebGL2CommandEncoder(
    { label: 'bytes-per-row-test' },
    fake.gl,
    state,
    {} as WebGL2RenderPassOptions,
  );
  return {
    encoder,
    fake,
    buffer,
    uploaded: () => last,
    uploadedOffset: () => lastOffset,
  };
}

/** 期望的紧凑行内容：第 row 行第 col 个像素。 */
function expectedPixel(row: number, col: number): [number, number, number, number] {
  return [(row * 16 + col) & 0xff, 200, 100, 255];
}

function texture(label = 'src-texture'): WebGL2Texture {
  return { label, format: 'rgba8unorm', native: { texture: true } } as unknown as WebGL2Texture;
}

describe('WebGL2CommandEncoder.copyTextureToBuffer 的 bytesPerRow', () => {
  it('省略 bytesPerRow 时是紧凑排布（逐字节等于紧排图案）', () => {
    const { encoder, fake, buffer, uploaded } = createHarness();

    encoder.copyTextureToBuffer(
      { texture: texture(), origin: { x: 0, y: 0 } },
      { buffer, offset: 0 },
      { width: 3, height: 2, depthOrArrayLayers: 1 },
    );

    const data = uploaded()!;
    expect(data.length).toBe(24);
    expect(fake.reads).toEqual([{ x: 0, y: 0, width: 3, height: 2, byteLength: 24 }]);
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const at = (row * 3 + col) * 4;
        expect([data[at], data[at + 1], data[at + 2], data[at + 3]]).toEqual(expectedPixel(row, col));
      }
    }
  });

  it('按请求的行距重排：行内容落在 row * bytesPerRow，行间填充为 0', () => {
    const { encoder, fake, buffer, uploaded, uploadedOffset } = createHarness();

    // 宽 3（紧凑 12 字节一行）但请求 16 字节行距 —— 最小复现。
    encoder.copyTextureToBuffer(
      { texture: texture(), origin: { x: 0, y: 0 } },
      { buffer, offset: 128, bytesPerRow: 16 },
      { width: 3, height: 2, depthOrArrayLayers: 1 },
    );

    // 读回仍然是紧凑的 24 字节（不是 32），证明重排发生在读回之后的 JS 里。
    expect(fake.reads).toEqual([{ x: 0, y: 0, width: 3, height: 2, byteLength: 24 }]);
    // 并且读回时 PACK_ALIGNMENT 必须是 1。
    expect(fake.packAlignmentAtRead).toEqual([1]);

    const data = uploaded()!;
    expect(data.length).toBe(32);
    expect(uploadedOffset()).toBe(128);

    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const at = row * 16 + col * 4;
        expect([data[at], data[at + 1], data[at + 2], data[at + 3]]).toEqual(expectedPixel(row, col));
      }
      // 行尾 4 个填充字节为 0（确定性：不留上一次读回的残留）。
      expect([
        data[row * 16 + 12],
        data[row * 16 + 13],
        data[row * 16 + 14],
        data[row * 16 + 15],
      ]).toEqual([0, 0, 0, 0]);
    }
  });

  it('真实场景：宽 96 传 512 行距（verifyOffscreen 的写法）时第 1 行落在 512 而不是 384', () => {
    const { encoder, buffer, uploaded } = createHarness();

    const width = 96;
    const height = 3;
    const bytesPerRow = 512; // 256 对齐：Math.ceil((96 * 4) / 256) * 256
    encoder.copyTextureToBuffer(
      { texture: texture(), origin: { x: 0, y: 0 } },
      { buffer, offset: 0, bytesPerRow },
      { width, height, depthOrArrayLayers: 1 },
    );

    const data = uploaded()!;
    expect(data.length).toBe(bytesPerRow * height);

    // 第 0 行第 0 个像素：偏移 0。
    expect(Array.from(data.subarray(0, 4))).toEqual(expectedPixel(0, 0));
    // 第 1 行第 0 个像素必须在偏移 512。修复前它在 384，于是 512 处是第 1 行中间某个像素。
    expect(Array.from(data.subarray(512, 516))).toEqual(expectedPixel(1, 0));
    expect(Array.from(data.subarray(1024, 1028))).toEqual(expectedPixel(2, 0));
    // 行尾填充必须是 0。
    expect(data.subarray(96 * 4, 512).some((byte) => byte !== 0)).toBe(false);
    expect(data.subarray(512 + 96 * 4, 1024).some((byte) => byte !== 0)).toBe(false);

    // 每一行的每个像素都逐字节对齐（不是「只有开头对」）。
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const at = row * bytesPerRow + col * 4;
        expect([data[at], data[at + 1], data[at + 2], data[at + 3]]).toEqual(expectedPixel(row, col));
      }
    }
  });

  it('非 4 倍数行距也按字面生效（后端不做隐式对齐，免得改写调用方的索引）', () => {
    const { encoder, buffer, uploaded } = createHarness();

    encoder.copyTextureToBuffer(
      { texture: texture(), origin: { x: 0, y: 0 } },
      { buffer, offset: 0, bytesPerRow: 13 },
      { width: 3, height: 2, depthOrArrayLayers: 1 },
    );

    const data = uploaded()!;
    expect(data.length).toBe(26);
    expect(Array.from(data.subarray(0, 4))).toEqual(expectedPixel(0, 0));
    expect(Array.from(data.subarray(13, 17))).toEqual(expectedPixel(1, 0));
  });

  it('bytesPerRow 小于一行所需字节数时给出带前缀的英文错误', () => {
    const { encoder, buffer } = createHarness();

    const call = (bytesPerRow: number) =>
      encoder.copyTextureToBuffer(
        { texture: texture(), origin: { x: 0, y: 0 } },
        { buffer, offset: 0, bytesPerRow },
        { width: 3, height: 1, depthOrArrayLayers: 1 },
      );

    expect(() => call(8)).toThrowError(ValidationError);
    expect(() => call(8)).toThrowError(
      /^\[gpu-device-api\] copyTextureToBuffer: bytesPerRow must be an integer >= 12/,
    );
    expect(() => call(8)).toThrowError(/got 8\./);
    expect(() => call(-4)).toThrowError(/bytesPerRow must be an integer >= 12/);
    expect(() => call(12.5)).toThrowError(/bytesPerRow must be an integer >= 12/);
    // 恰好等于一行时是合法的（紧凑）。
    expect(() => call(12)).not.toThrow();
  });

  it('读回前后会把 PACK_ALIGNMENT 设成 1 再还原成 4', () => {
    const { encoder, fake, buffer } = createHarness();

    encoder.copyTextureToBuffer(
      { texture: texture(), origin: { x: 0, y: 0 } },
      { buffer, offset: 0, bytesPerRow: 16 },
      { width: 3, height: 2, depthOrArrayLayers: 1 },
    );

    expect(fake.packAlignment).toEqual([1, 4]);
    // framebuffer 是**复用**的（第四档优化 #30）：这里只创建、不删除。
    // 原先每次读回都 create + delete 一个临时 framebuffer，现在是同一块读回 framebuffer 反复用，
    // 释放点在 `Device.dispose()`（`GlStateCache.dispose()`）。复用与淘汰的断言在
    // `test/webgl2-opt-2a.test.ts` 里。
    expect(fake.deletes).toEqual([]);
  });
});
