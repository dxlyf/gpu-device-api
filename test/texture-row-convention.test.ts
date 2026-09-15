/**
 * 纹理行序约定的回归测试：**同一份纹理数据，两个后端必须落在同一纹素行上**。
 *
 * 背景（这次查「同一个纹理示例在两个后端颜色不一致」时定位到的结论）：
 *
 * - 上屏的那一步两个后端本来就是一致的 —— 同一份棋盘格 + 同一套 UV，两个后端的真实合成截图
 *   逐像素一致率 99.97%（容差 ±8，`scripts/verify-texture-parity.mjs` 抓的是同一口径的 `data-*`）。
 * - 真正不一致的是「把渲染结果读回主机内存」的行序：WebGL2 的渲染目标自下而上存储（GL 的窗口
 *   原点在左下），WebGPU 自上而下，而两边的 `copyTextureToBuffer` 都**忠实**按纹素行序输出
 *   （缓冲区第 0 行 = 纹素行 `origin.y`）。于是同一个渲染结果在 WebGL2 上读回来整体上下颠倒。
 *
 * 读回本身没错（读回**上传过**的纹理时两个后端本来就一致，`examples/core-texture-mipmap.ts`
 * 就是靠这一点在两后端之间逐纹素比对 mip 的），错的是渲染目标的行序。所以这里钉死的是
 * 「上传不翻、读回不翻、flipY 语义一致」这三条**跨后端契约**，它们一变，
 * `core-texture` 的自检像素就会跟着翻，必须在 CI 里立刻炸出来。
 *
 * 这两条契约的说明写在 `src/core/resources/Texture.ts`、`src/webgl2/resources/WebGL2Texture.ts`。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2Queue } from '../src/webgl2/sync/WebGL2Queue.js';
import { WebGL2CommandEncoder } from '../src/webgl2/render/WebGL2CommandEncoder.js';
import { WebGPUQueue } from '../src/webgpu/sync/WebGPUQueue.js';
import { WebGPUCommandEncoder } from '../src/webgpu/render/WebGPUCommandEncoder.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { WebGL2Buffer } from '../src/webgl2/resources/WebGL2Buffer.js';
import type { WebGL2Texture } from '../src/webgl2/resources/WebGL2Texture.js';
import type { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import type { BufferLike } from '../src/core/render/CommandEncoder.js';

/* GL 枚举（写死数值，与真实上下文一致）。 */
const GL_TEXTURE_2D = 0x0de1;
const GL_UNPACK_FLIP_Y_WEBGL = 0x9240;
const GL_UNPACK_ALIGNMENT = 0x0cf5;
const GL_UNPACK_ROW_LENGTH = 0x0cf2;
const GL_RGBA = 0x1908;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_FRAMEBUFFER = 0x8d40;
const GL_COLOR_ATTACHMENT0 = 0x8ce0;
const GL_FRAMEBUFFER_COMPLETE = 0x8cd5;
const GL_FRAMEBUFFER_BINDING = 0x8ca6;
const GL_PACK_ALIGNMENT = 0x0d05;

interface PixelStoreCall {
  readonly pname: number;
  readonly value: number;
}

interface TexSubImageCall {
  readonly level: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** 传给 `texSubImage2D` 的对象（原始数据必须是同一个引用，没有被复制/重排过）。 */
  readonly source: unknown;
  /** 数据前 4 个字节 —— 也就是「第 0 行第 0 个像素」。 */
  readonly firstPixel: readonly number[];
}

interface FakeGl {
  readonly gl: WebGL2RenderingContext;
  readonly pixelStore: PixelStoreCall[];
  readonly texSubImage: TexSubImageCall[];
  readonly readPixels: { x: number; y: number; width: number; height: number }[];
}

/**
 * 假 GL 上下文：只实现本测试关心的几条通路，并把参数记下来。
 *
 * `readPixels` 按**纹素行序**（第 0 行就是 `y` 指到的那一行）填一个可预测的图案，
 * 这样读回缓冲里能看到实现到底有没有偷偷反序。
 */
function createFakeGl(): FakeGl {
  const pixelStore: PixelStoreCall[] = [];
  const texSubImage: TexSubImageCall[] = [];
  const readPixels: { x: number; y: number; width: number; height: number }[] = [];

  const gl = {
    TEXTURE_2D: GL_TEXTURE_2D,
    TEXTURE_3D: 0x806f,
    TEXTURE_2D_ARRAY: 0x8c1a,
    UNPACK_ALIGNMENT: GL_UNPACK_ALIGNMENT,
    UNPACK_ROW_LENGTH: GL_UNPACK_ROW_LENGTH,
    UNPACK_FLIP_Y_WEBGL: GL_UNPACK_FLIP_Y_WEBGL,
    RGBA: GL_RGBA,
    UNSIGNED_BYTE: GL_UNSIGNED_BYTE,
    FRAMEBUFFER: GL_FRAMEBUFFER,
    COLOR_ATTACHMENT0: GL_COLOR_ATTACHMENT0,
    DEPTH_ATTACHMENT: 0x8d00,
    FRAMEBUFFER_COMPLETE: GL_FRAMEBUFFER_COMPLETE,
    FRAMEBUFFER_BINDING: GL_FRAMEBUFFER_BINDING,
    PACK_ALIGNMENT: GL_PACK_ALIGNMENT,
    bindTexture: () => {},
    pixelStorei: (pname: number, value: number) => {
      pixelStore.push({ pname, value });
    },
    texSubImage2D: (
      _target: number,
      level: number,
      x: number,
      y: number,
      width: number,
      height: number,
      _format: number,
      _type: number,
      source: Uint8Array,
    ) => {
      texSubImage.push({
        level,
        x,
        y,
        width,
        height,
        source,
        firstPixel: [source[0] ?? -1, source[1] ?? -1, source[2] ?? -1, source[3] ?? -1],
      });
    },
    createFramebuffer: () => ({ id: 1 }),
    deleteFramebuffer: () => {},
    getParameter: (pname: number) => (pname === GL_FRAMEBUFFER_BINDING ? null : 0),
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    checkFramebufferStatus: () => GL_FRAMEBUFFER_COMPLETE,
    readPixels: (
      x: number,
      y: number,
      width: number,
      height: number,
      _format: number,
      _type: number,
      dst: Uint8Array,
    ) => {
      readPixels.push({ x, y, width, height });
      // 纹素行 r（相对读回窗口）第 c 个像素 = (r * 16 + c, 200, 100, 255)。
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

  return { gl, pixelStore, texSubImage, readPixels };
}

/** 一张 2×2 的 RGBA8 图案：第 0 行是红色系，第 1 行是蓝色系（一眼能看出有没有被翻）。 */
function makePixels(): Uint8Array {
  return Uint8Array.from([
    10, 0, 0, 255, 20, 0, 0, 255,
    0, 0, 30, 255, 0, 0, 40, 255,
  ]);
}

function fakeTexture(label: string): WebGL2Texture {
  return { label, format: 'rgba8unorm', target: GL_TEXTURE_2D, native: { texture: true } } as unknown as WebGL2Texture;
}

describe('WebGL2 后端的纹理行序', () => {
  it('writeTexture 不翻转 Y：数据第 0 行原样写进纹素第 0 行', () => {
    const fake = createFakeGl();
    const queue = new WebGL2Queue(fake.gl, new GlStateCache(fake.gl));
    const pixels = makePixels();

    queue.writeTexture(
      { texture: fakeTexture('row-order'), origin: { x: 0, y: 0 } },
      pixels,
      { offset: 0, bytesPerRow: 2 * 4 },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );

    // 关键断言：整条上传路径**从不**设置 UNPACK_FLIP_Y_WEBGL。
    expect(fake.pixelStore.filter((call) => call.pname === GL_UNPACK_FLIP_Y_WEBGL)).toEqual([]);
    // 上传的是同一块内存（后端只做了一层视图，没有复制/重排），第 0 行第 0 个像素就是源数据的第 0 个像素。
    expect(fake.texSubImage).toHaveLength(1);
    const source = fake.texSubImage[0]!.source as Uint8Array;
    expect(source.buffer).toBe(pixels.buffer);
    expect(source.byteOffset).toBe(pixels.byteOffset);
    expect(source.byteLength).toBe(pixels.byteLength);
    expect(fake.texSubImage[0]!.firstPixel).toEqual([10, 0, 0, 255]);
    expect(fake.texSubImage[0]!.y).toBe(0);
    // 贴着 GL 的默认状态收尾：UNPACK_ALIGNMENT 还原成 4。
    expect(fake.pixelStore.at(-1)).toEqual({ pname: GL_UNPACK_ALIGNMENT, value: 4 });
  });

  it('copyExternalImageToTexture 把 flipY 映射到 UNPACK_FLIP_Y_WEBGL，用完复位', () => {
    const fake = createFakeGl();
    const queue = new WebGL2Queue(fake.gl, new GlStateCache(fake.gl));
    const flips = (): number[] =>
      fake.pixelStore.filter((call) => call.pname === GL_UNPACK_FLIP_Y_WEBGL).map((call) => call.value);

    queue.copyExternalImageToTexture(
      { width: 2, height: 2 } as unknown as ImageBitmap,
      { texture: fakeTexture('flip-true'), origin: { x: 0, y: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
      true,
    );
    expect(flips()).toEqual([1, 0]);

    queue.copyExternalImageToTexture(
      { width: 2, height: 2 } as unknown as ImageBitmap,
      { texture: fakeTexture('flip-default'), origin: { x: 0, y: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );
    expect(flips()).toEqual([1, 0, 0, 0]);
  });

  it('copyTextureToBuffer 不反行序：缓冲区第 0 行 = 纹素行 origin.y', () => {
    const fake = createFakeGl();
    const state = new GlStateCache(fake.gl);
    const encoder = new WebGL2CommandEncoder(
      { label: 'row-order' },
      fake.gl,
      state,
      {} as WebGL2RenderPassOptions,
    );
    let uploaded: Uint8Array | null = null;
    const buffer = {
      upload: (_offset: number, data: Uint8Array) => {
        uploaded = data.slice();
      },
    } as unknown as WebGL2Buffer;

    // origin.y = 4：读回窗口的纹素第 4 行必须落在缓冲区第 0 行（不做上下翻转）。
    encoder.copyTextureToBuffer(
      { texture: fakeTexture('rendered'), origin: { x: 0, y: 4 } },
      { buffer, offset: 0, bytesPerRow: 8 },
      { width: 2, height: 3, depthOrArrayLayers: 1 },
    );

    expect(fake.readPixels).toEqual([{ x: 0, y: 4, width: 2, height: 3 }]);
    const data = uploaded!;
    // 第 0 行第 0 个像素（假 readPixels 的图案里 row = 0 就是它读到的第一行）。
    expect(Array.from(data.subarray(0, 4))).toEqual([0, 200, 100, 255]);
    // 第 1 行、第 2 行依次跟上（没有被倒过来）。
    expect(Array.from(data.subarray(8, 12))).toEqual([16, 200, 100, 255]);
    expect(Array.from(data.subarray(16, 20))).toEqual([32, 200, 100, 255]);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGPU 侧：语义就是基准，这里钉死「原样下发、不做任何隐式翻转」                                        */
/* ------------------------------------------------------------------------------------------------ */

interface FakeGpu {
  readonly device: WebGPUDevice;
  readonly queueCalls: { writeTexture: unknown[][]; copyExternalImageToTexture: unknown[][] };
  readonly encoderCalls: { copyTextureToBuffer: unknown[][] };
}

function createFakeGpu(): FakeGpu {
  const queueCalls = { writeTexture: [] as unknown[][], copyExternalImageToTexture: [] as unknown[][] };
  const encoderCalls = { copyTextureToBuffer: [] as unknown[][] };

  const nativeEncoder = {
    copyTextureToBuffer: (...args: unknown[]) => {
      encoderCalls.copyTextureToBuffer.push(args);
    },
    copyBufferToTexture: () => {},
    copyTextureToTexture: () => {},
    copyBufferToBuffer: () => {},
    finish: () => ({ commandBuffer: true }),
  };
  const nativeQueue = {
    writeTexture: (...args: unknown[]) => {
      queueCalls.writeTexture.push(args);
    },
    copyExternalImageToTexture: (...args: unknown[]) => {
      queueCalls.copyExternalImageToTexture.push(args);
    },
    writeBuffer: () => {},
    submit: () => {},
    onSubmittedWorkDone: async () => {},
  };
  const device = {
    native: {
      queue: nativeQueue,
      createCommandEncoder: () => nativeEncoder,
    },
    assertUsable: () => {},
    nextResourceId: () => 1,
  } as unknown as WebGPUDevice;

  return { device, queueCalls, encoderCalls };
}

/** 只满足 `asGPUTexture` 形状识别的假原生对象（`asGPUTexture` 会解包 `.native`）。 */
const nativeTexture = { createView: () => ({}), destroy: () => {} };

/** 命令层的 `TextureLike`：除了原生句柄还要报尺寸。 */
function gpuTexture(): { width: number; height: number; depthOrArrayLayers: number; native: unknown } {
  return { width: 2, height: 2, depthOrArrayLayers: 1, native: nativeTexture };
}

/** 命令层的 `BufferLike`。注意 `asGPUBuffer` 只认「原生 GPUBuffer 形状」的对象，不做嵌套解包。 */
function gpuBuffer(): BufferLike {
  return {
    size: 64,
    mapAsync: async () => {},
    getMappedRange: () => new ArrayBuffer(0),
    destroy: () => {},
  } as unknown as BufferLike;
}

describe('WebGPU 后端的纹理行序（本库的基准语义）', () => {
  it('writeTexture 原样下发 origin 与 bytesPerRow（数据第 0 行 → 纹素第 0 行）', () => {
    const fake = createFakeGpu();
    const queue = new WebGPUQueue(fake.device);
    const pixels = makePixels();

    queue.writeTexture(
      { texture: gpuTexture(), origin: { x: 0, y: 0, z: 0 } },
      pixels,
      { offset: 0, bytesPerRow: 8, rowsPerImage: 2 },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );

    expect(fake.queueCalls.writeTexture).toHaveLength(1);
    const [destination, data, layout, size] = fake.queueCalls.writeTexture[0]!;
    expect((destination as { origin: unknown }).origin).toEqual({ x: 0, y: 0, z: 0 });
    expect(data).toBe(pixels);
    expect((layout as { bytesPerRow: number }).bytesPerRow).toBe(8);
    expect(size).toEqual({ width: 2, height: 2, depthOrArrayLayers: 1 });
  });

  it('copyExternalImageToTexture 原样下发 flipY', () => {
    const fake = createFakeGpu();
    const queue = new WebGPUQueue(fake.device);
    const source = { width: 2, height: 2 } as unknown as ImageBitmap;

    queue.copyExternalImageToTexture(
      source,
      { texture: gpuTexture(), origin: { x: 0, y: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
      true,
    );
    queue.copyExternalImageToTexture(
      source,
      { texture: gpuTexture(), origin: { x: 0, y: 0 } },
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    );

    const calls = fake.queueCalls.copyExternalImageToTexture;
    expect(calls).toHaveLength(2);
    expect(calls[0]![0]).toEqual({ source, flipY: true });
    expect(calls[1]![0]).toEqual({ source, flipY: false });
  });

  it('copyTextureToBuffer 原样下发 origin 与 bytesPerRow（缓冲区第 0 行 = 纹素行 origin.y）', () => {
    const fake = createFakeGpu();
    const encoder = new WebGPUCommandEncoder(fake.device, { label: 'row-order' });

    encoder.copyTextureToBuffer(
      { texture: gpuTexture(), origin: { x: 0, y: 4, z: 0 } },
      { buffer: gpuBuffer(), offset: 0, bytesPerRow: 8 },
      { width: 2, height: 3, depthOrArrayLayers: 1 },
    );

    expect(fake.encoderCalls.copyTextureToBuffer).toHaveLength(1);
    const [source, destination, size] = fake.encoderCalls.copyTextureToBuffer[0]!;
    expect((source as { origin: unknown }).origin).toEqual({ x: 0, y: 4, z: 0 });
    expect((destination as { bytesPerRow: number }).bytesPerRow).toBe(8);
    expect(size).toEqual({ width: 2, height: 3, depthOrArrayLayers: 1 });
  });
});

describe('两个后端的行序契约（同一份数据 → 同一纹素行）', () => {
  it('上传：两端都「数据第 0 行 → 纹素第 0 行」，没有任何隐式翻转', () => {
    const glFake = createFakeGl();
    const glQueue = new WebGL2Queue(glFake.gl, new GlStateCache(glFake.gl));
    const gpuFake = createFakeGpu();
    const gpuQueue = new WebGPUQueue(gpuFake.device);
    const pixels = makePixels();
    const size = { width: 2, height: 2, depthOrArrayLayers: 1 } as const;
    const layout = { offset: 0, bytesPerRow: 8, rowsPerImage: 2 };

    glQueue.writeTexture(
      { texture: fakeTexture('parity'), origin: { x: 0, y: 0 } },
      pixels,
      layout,
      { ...size },
    );
    gpuQueue.writeTexture(
      { texture: gpuTexture(), origin: { x: 0, y: 0 } },
      pixels,
      layout,
      { ...size },
    );

    // 归一化后的「上传契约」：两端都是「不翻转 + 第 0 行对齐第 0 行 + 原样数据」。
    const glSource = glFake.texSubImage[0]!.source as Uint8Array;
    const glUpload = {
      flipsRows: glFake.pixelStore.some(
        (call) => call.pname === GL_UNPACK_FLIP_Y_WEBGL && call.value === 1,
      ),
      firstRowPixel: glFake.texSubImage[0]!.firstPixel,
      dataIsOriginal:
        glSource.buffer === pixels.buffer &&
        glSource.byteOffset === pixels.byteOffset &&
        glSource.byteLength === pixels.byteLength,
    };
    const gpuUpload = {
      flipsRows: (gpuFake.queueCalls.writeTexture[0]![0] as { flipY?: boolean }).flipY === true,
      firstRowPixel: Array.from(pixels.subarray(0, 4)),
      dataIsOriginal: gpuFake.queueCalls.writeTexture[0]![1] === pixels,
    };

    expect(glUpload).toEqual({ flipsRows: false, firstRowPixel: [10, 0, 0, 255], dataIsOriginal: true });
    expect(gpuUpload).toEqual(glUpload);
  });

  it('读回：两端都「缓冲区第 0 行 = 纹素行 origin.y」，没有反序', () => {
    const glFake = createFakeGl();
    const encoder = new WebGL2CommandEncoder(
      { label: 'parity' },
      glFake.gl,
      new GlStateCache(glFake.gl),
      {} as WebGL2RenderPassOptions,
    );
    const uploaded: Uint8Array[] = [];
    const buffer = {
      upload: (_offset: number, data: Uint8Array) => {
        uploaded.push(data.slice());
      },
    } as unknown as WebGL2Buffer;

    encoder.copyTextureToBuffer(
      { texture: fakeTexture('parity'), origin: { x: 0, y: 4 } },
      { buffer, offset: 0, bytesPerRow: 8 },
      { width: 2, height: 3, depthOrArrayLayers: 1 },
    );

    // WebGL2：readPixels 的起点就是纹素行 origin.y，写进缓冲区时不反序。
    expect(glFake.readPixels).toEqual([{ x: 0, y: 4, width: 2, height: 3 }]);
    expect(Array.from(uploaded[0]!.subarray(0, 4))).toEqual([0, 200, 100, 255]);
    expect(Array.from(uploaded[0]!.subarray(8, 12))).toEqual([16, 200, 100, 255]);

    // WebGPU：origin 原样交给原生实现，语义同样是「缓冲区第 0 行 = 纹素行 origin.y」。
    const gpuFake = createFakeGpu();
    const gpuEncoder = new WebGPUCommandEncoder(gpuFake.device, { label: 'parity' });
    gpuEncoder.copyTextureToBuffer(
      { texture: gpuTexture(), origin: { x: 0, y: 4, z: 0 } },
      { buffer: gpuBuffer(), offset: 0, bytesPerRow: 8 },
      { width: 2, height: 3, depthOrArrayLayers: 1 },
    );
    const source = gpuFake.encoderCalls.copyTextureToBuffer[0]![0] as { origin: { y: number } };
    expect(source.origin.y).toBe(4);
  });
});
