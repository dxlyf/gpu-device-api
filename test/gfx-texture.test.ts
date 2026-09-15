/**
 * gfx 纹理层的单测：格式表、mipLevelCount 计算、非 2 的幂 / 非正方形、srgb 语义、
 * 通道重排、以及 `createImageBitmap` 异步路径（含 `close()` 是否被调用）。
 *
 * node 环境里没有真的 WebGL2 / WebGPU，所以这里用的是一台**假 device**：它只记录
 * `createTexture` / `writeTexture` / `copyExternalImageToTexture` / `createSampler` 收到的参数，
 * 并按描述符回一个带 `generateMipmaps()` 计数的假纹理。断言的是**便捷层交给后端的东西**
 * 是否正确，真正的 GPU 行为由 `examples/core-texture-mipmap.ts` 的两后端实测覆盖。
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { GfxTexture, GFX_UPLOAD_FORMATS, buildMipChain } from '../src/gfx/Texture.js';
import { ValidationError } from '../src/core/errors/index.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { resolveSamplerDescriptor, type Sampler, type SamplerDescriptor } from '../src/core/resources/Sampler.js';
import type { Device } from '../src/core/Device.js';
import type { Texture, TextureDescriptor } from '../src/core/resources/Texture.js';
import type { TextureCopyView } from '../src/core/render/CommandEncoder.js';
import type { TextureView, TextureViewDescriptor } from '../src/core/resources/TextureView.js';
import type { Extent3D, TexelCopyBufferLayout } from '../src/types/internal.js';
import type { ExternalImageSource } from '../src/core/sync/Queue.js';

/* ------------------------------------------------------------------------------------------------ */
/* 假 device                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

interface FakeTextureRecord {
  readonly descriptor: TextureDescriptor;
  destroyed: boolean;
  generatedMipmaps: number;
  readonly views: number[];
}

interface FakeWrite {
  readonly destination: TextureCopyView;
  readonly data: ArrayBufferView;
  readonly layout: TexelCopyBufferLayout;
  readonly size: Extent3D;
}

interface FakeCopy {
  readonly source: ExternalImageSource;
  readonly destination: TextureCopyView;
  readonly size: Extent3D;
  readonly flipY: boolean;
}

interface FakeDevice {
  readonly device: Device;
  readonly records: FakeTextureRecord[];
  readonly writes: FakeWrite[];
  readonly copies: FakeCopy[];
  readonly samplers: SamplerDescriptor[];
  /** 下一次 `generateMipmaps()` 要抛的错（模拟后端做不到的情形）。 */
  generateError: Error | null;
}

function createFakeDevice(backend: 'webgl2' | 'webgpu' = 'webgpu'): FakeDevice {
  const records: FakeTextureRecord[] = [];
  const writes: FakeWrite[] = [];
  const copies: FakeCopy[] = [];
  const samplers: SamplerDescriptor[] = [];
  const state: { generateError: Error | null } = { generateError: null };

  const device = {
    backend,
    createTexture(descriptor: TextureDescriptor): Texture {
      const record: FakeTextureRecord = {
        descriptor,
        destroyed: false,
        generatedMipmaps: 0,
        views: [],
      };
      records.push(record);

      const texture = {
        label: descriptor.label ?? 'texture',
        dimension: '2d' as const,
        format: descriptor.format,
        usage: descriptor.usage,
        width: 0,
        height: 0,
        depthOrArrayLayers: 1,
        mipLevelCount: descriptor.mipLevelCount ?? 1,
        sampleCount: 1,
        native: null,
        size: { width: 0, height: 0, depthOrArrayLayers: 1 } as Extent3D,
        get views(): readonly TextureView[] {
          return [];
        },
        get disposed(): boolean {
          return record.destroyed;
        },
        createView(_descriptor?: TextureViewDescriptor): TextureView {
          record.views.push(record.views.length + 1);
          return {
            label: `${texture.label}#view`,
            texture,
            descriptor: {
              format: undefined,
              dimension: '2d',
              baseMipLevel: 0,
              mipLevelCount: texture.mipLevelCount,
              baseArrayLayer: 0,
              arrayLayerCount: 1,
              aspect: 'all',
            },
            native: null,
            disposed: false,
            dispose: () => {},
          } as unknown as TextureView;
        },
        generateMipmaps(): void {
          if (state.generateError) throw state.generateError;
          record.generatedMipmaps += 1;
        },
        destroy: () => {
          record.destroyed = true;
        },
        dispose: () => {
          record.destroyed = true;
        },
      } as unknown as Texture;

      return texture;
    },
    createSampler(descriptor: SamplerDescriptor = {}): Sampler {
      samplers.push(descriptor);
      return {
        label: descriptor.label ?? 'sampler',
        descriptor: resolveSamplerDescriptor(descriptor),
        native: null,
        disposed: false,
        destroy: () => {},
        dispose: () => {},
      } as unknown as Sampler;
    },
    queue: {
      writeTexture(
        destination: TextureCopyView,
        data: ArrayBufferView,
        layout: TexelCopyBufferLayout,
        size: Extent3D,
      ): void {
        writes.push({ destination, data, layout, size });
      },
      copyExternalImageToTexture(
        source: ExternalImageSource,
        destination: TextureCopyView,
        size: Extent3D,
        flipY = false,
      ): void {
        copies.push({ source, destination, size, flipY });
      },
    },
  } as unknown as Device;

  return {
    device,
    records,
    writes,
    copies,
    samplers,
    get generateError(): Error | null {
      return state.generateError;
    },
    set generateError(value: Error | null) {
      state.generateError = value;
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 格式表                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

describe('gfx 纹理格式表', () => {
  it('覆盖常用格式，并记录每像素字节数与通道数', () => {
    expect(GFX_UPLOAD_FORMATS).toEqual([
      'rgba8unorm',
      'rgba8unorm-srgb',
      'bgra8unorm',
      'bgra8unorm-srgb',
      'r8unorm',
      'rg8unorm',
    ]);
  });

  it('不支持的格式抛出带 [gpu-device-api] 前缀、并列出可用格式的错误', () => {
    const { device } = createFakeDevice();
    expect(() => GfxTexture.create(device, { data: new Uint8Array(16), width: 2, height: 2, format: 'rgba16float' }))
      .toThrowError(ValidationError);
    expect(() =>
      GfxTexture.create(device, { data: new Uint8Array(16), width: 2, height: 2, format: 'rgba16float' }),
    ).toThrowError(/^\[gpu-device-api\] The gfx texture layer cannot upload "rgba16float"/);
    expect(() =>
      GfxTexture.create(device, { data: new Uint8Array(16), width: 2, height: 2, format: 'rgba16float' }),
    ).toThrowError(/bgra8unorm, bgra8unorm-srgb, r8unorm, rg8unorm/);
  });

  it('bgra8unorm 在 WebGPU 上可用，在 WebGL2 上给出明确的「没有对应格式」错误', () => {
    const webgpu = createFakeDevice('webgpu');
    const texture = GfxTexture.create(webgpu.device, {
      data: new Uint8Array(2 * 2 * 4),
      width: 2,
      height: 2,
      format: 'bgra8unorm',
      mipmaps: false,
    });
    expect(webgpu.records[0]!.descriptor.format).toBe('bgra8unorm');
    texture.destroy();

    const webgl2 = createFakeDevice('webgl2');
    expect(() =>
      GfxTexture.create(webgl2.device, {
        data: new Uint8Array(2 * 2 * 4),
        width: 2,
        height: 2,
        format: 'bgra8unorm',
        mipmaps: false,
      }),
    ).toThrowError(/^\[gpu-device-api\] Texture format "bgra8unorm" has no WebGL2 equivalent/);
  });

  it('默认格式仍是 rgba8unorm，默认不生成 mip', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, { data: new Uint8Array(4 * 4 * 4), width: 4, height: 4 });
    expect(texture.format).toBe('rgba8unorm');
    expect(texture.mipLevelCount).toBe(1);
    expect(fake.records[0]!.generatedMipmaps).toBe(0);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* mipLevelCount 与后端 mip 生成                                                                       */
/* ------------------------------------------------------------------------------------------------ */

describe('gfx 纹理的 mipLevelCount 与后端 mip 生成', () => {
  it('2 的幂正方形：4x4 得到 3 级，只上传第 0 级，mip 交给后端', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, {
      label: 'pot',
      data: new Uint8Array(4 * 4 * 4),
      width: 4,
      height: 4,
      mipmaps: true,
    });

    expect(texture.mipLevelCount).toBe(3);
    expect(fake.records[0]!.descriptor.mipLevelCount).toBe(3);
    // usage 必须带 RenderAttachment：WebGPU 的 mip 生成是 render pass 写进去的。
    expect(fake.records[0]!.descriptor.usage & TextureUsage.RenderAttachment).toBe(TextureUsage.RenderAttachment);
    // usage 还必须带 CopySrc：否则 WebGPU 上 copyTextureToBuffer 读回整条命令都无效（读回全 0）。
    expect(fake.records[0]!.descriptor.usage & TextureUsage.CopySrc).toBe(TextureUsage.CopySrc);
    expect(fake.records[0]!.descriptor.usage & TextureUsage.CopyDst).toBe(TextureUsage.CopyDst);
    // 只上传第 0 级 —— 这正是「不再在 JS 里逐级上传」的证据。
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]!.destination.mipLevel).toBe(0);
    expect(fake.writes[0]!.layout.bytesPerRow).toBe(4 * 4);
    expect(fake.records[0]!.generatedMipmaps).toBe(1);
    // 有 mip 链时采样器的 mipmapFilter 必须是 linear，否则 GL 永远只取第 0 级。
    expect(fake.samplers[0]!.mipmapFilter).toBe('linear');
    texture.destroy();
  });

  it('1x1 只有一级：不生成 mip，也不带 RenderAttachment', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, {
      data: new Uint8Array(4),
      width: 1,
      height: 1,
      mipmaps: true,
    });
    expect(texture.mipLevelCount).toBe(1);
    expect(fake.records[0]!.descriptor.usage & TextureUsage.RenderAttachment).toBe(0);
    expect(fake.records[0]!.generatedMipmaps).toBe(0);
    expect(fake.samplers[0]!.mipmapFilter).toBe('nearest');
    texture.destroy();
  });

  it('非正方形：8x2 在高度到 1 之后仍然继续缩宽度，共 4 级', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, {
      data: new Uint8Array(8 * 2 * 4),
      width: 8,
      height: 2,
      mipmaps: true,
    });
    expect(texture.mipLevelCount).toBe(4); // 8x2 → 4x1 → 2x1 → 1x1
    texture.destroy();
  });

  it('非 2 的幂：60x36 的层数是按最大维度算的 6，上传行距用 1x 宽度', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, {
      data: new Uint8Array(60 * 36 * 4),
      width: 60,
      height: 36,
      format: 'rgba8unorm',
      mipmaps: true,
    });
    expect(texture.mipLevelCount).toBe(6); // 60 → 30 → 15 → 7 → 3 → 1
    expect(fake.writes[0]!.layout.bytesPerRow).toBe(60 * 4);
    expect(fake.writes[0]!.size.width).toBe(60);
    expect(fake.writes[0]!.size.height).toBe(36);
    texture.destroy();
  });

  it('r8unorm 的行距按 1 字节/像素计算', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, {
      data: new Uint8Array(5 * 3),
      width: 5,
      height: 3,
      format: 'r8unorm',
      mipmaps: false,
    });
    expect(fake.writes[0]!.layout.bytesPerRow).toBe(5);
    expect(fake.writes[0]!.data.byteLength).toBe(15);
    texture.destroy();
  });

  it('rg8unorm 的行距按 2 字节/像素计算', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.create(fake.device, {
      data: new Uint8Array(5 * 3 * 2),
      width: 5,
      height: 3,
      format: 'rg8unorm',
      mipmaps: false,
    });
    expect(fake.writes[0]!.layout.bytesPerRow).toBe(10);
    texture.destroy();
  });

  it('后端生成 mip 失败时销毁纹理并把错误抛出去（不留半成品）', () => {
    const fake = createFakeDevice();
    fake.generateError = new ValidationError('[gpu-device-api] nope');
    expect(() =>
      GfxTexture.create(fake.device, { data: new Uint8Array(4 * 4 * 4), width: 4, height: 4, mipmaps: true }),
    ).toThrowError(/nope/);
    expect(fake.records[0]!.destroyed).toBe(true);
  });

  it('后端没实现 generateMipmaps 时报错并销毁纹理', () => {
    const fake = createFakeDevice();
    type Mutable = { generateMipmaps?: () => void };
    const original = fake.device.createTexture.bind(fake.device);
    (fake.device as unknown as { createTexture: (d: TextureDescriptor) => Texture }).createTexture = (
      descriptor: TextureDescriptor,
    ): Texture => {
      const texture = original(descriptor);
      delete (texture as unknown as Mutable).generateMipmaps;
      return texture;
    };
    expect(() =>
      GfxTexture.create(fake.device, { data: new Uint8Array(4 * 4 * 4), width: 4, height: 4, mipmaps: true }),
    ).toThrowError(/does not implement Texture\.generateMipmaps/);
    expect(fake.records[0]!.destroyed).toBe(true);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 原始像素：长度校验、翻转、通道重排                                                                    */
/* ------------------------------------------------------------------------------------------------ */

describe('gfx 纹理的原始像素路径', () => {
  it('缺少 width/height 会报错', () => {
    const fake = createFakeDevice();
    expect(() => GfxTexture.create(fake.device, { data: new Uint8Array(16) })).toThrowError(
      /requires explicit width and height/,
    );
  });

  it('数据不足时按格式的每像素字节数报出期望长度', () => {
    const fake = createFakeDevice();
    expect(() =>
      GfxTexture.create(fake.device, { data: new Uint8Array(3), width: 2, height: 2, format: 'r8unorm' }),
    ).toThrowError(/needs 4 bytes \(1 per pixel\)/);
    expect(() =>
      GfxTexture.create(fake.device, { data: new Uint8Array(10), width: 2, height: 2, format: 'rgba8unorm' }),
    ).toThrowError(/needs 16 bytes \(4 per pixel\)/);
    expect(() =>
      GfxTexture.create(fake.device, { data: new Uint8Array(3), width: 2, height: 2, format: 'rg8unorm' }),
    ).toThrowError(/needs 8 bytes \(2 per pixel\)/);
  });

  it('flipY 对 r8unorm（1 字节/像素）逐行翻转', () => {
    const fake = createFakeDevice();
    GfxTexture.create(fake.device, {
      data: new Uint8Array([1, 2, 3, 4, 5, 6]),
      width: 3,
      height: 2,
      format: 'r8unorm',
      flipY: true,
      mipmaps: false,
    });
    expect(Array.from(fake.writes[0]!.data as Uint8Array)).toEqual([4, 5, 6, 1, 2, 3]);
  });

  it('flipY 对 rgba8unorm 逐行翻转且保持通道内顺序', () => {
    const fake = createFakeDevice();
    const pixels = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    GfxTexture.create(fake.device, { data: pixels, width: 2, height: 2, flipY: true, mipmaps: false });
    expect(Array.from(fake.writes[0]!.data as Uint8Array)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('ImageData 来源：r8unorm 取 R 通道，bgra8unorm 交换 R/B', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 40, 50, 60, 70, 80]);
    const imageData = createFakeImageData(2, 1, rgba);

    const red = createFakeDevice();
    GfxTexture.create(red.device, { data: imageData, format: 'r8unorm', mipmaps: false });
    expect(Array.from(red.writes[0]!.data as Uint8Array)).toEqual([10, 50]);

    const bgra = createFakeDevice();
    GfxTexture.create(bgra.device, { data: imageData, format: 'bgra8unorm', mipmaps: false });
    expect(Array.from(bgra.writes[0]!.data as Uint8Array)).toEqual([30, 20, 10, 40, 70, 60, 50, 80]);

    const rg = createFakeDevice();
    GfxTexture.create(rg.device, { data: imageData, format: 'rg8unorm', mipmaps: false });
    expect(Array.from(rg.writes[0]!.data as Uint8Array)).toEqual([10, 20, 50, 60]);
  });

  it('没有 canvas 时，未解码的图像来源给出明确错误', () => {
    const fake = createFakeDevice();
    expect(() =>
      GfxTexture.create(fake.device, { data: createFakeImageLike(4, 4) as unknown as ImageBitmap }),
    ).toThrowError(/There is no canvas in this environment|has no size yet/);
  });

  it('srgb 格式不改变上传的字节（颜色空间转换由采样时完成）', () => {
    const fake = createFakeDevice();
    const pixels = new Uint8Array([0, 128, 255, 255]);
    const texture = GfxTexture.create(fake.device, {
      data: pixels,
      width: 1,
      height: 1,
      format: 'rgba8unorm-srgb',
      mipmaps: false,
    });
    expect(texture.format).toBe('rgba8unorm-srgb');
    expect(fake.records[0]!.descriptor.format).toBe('rgba8unorm-srgb');
    expect(Array.from(fake.writes[0]!.data as Uint8Array)).toEqual([0, 128, 255, 255]);
    texture.destroy();
  });

  it('solid() 仍然是 1x1、无 mip 的纹理', () => {
    const fake = createFakeDevice();
    const texture = GfxTexture.solid(fake.device, [1, 0.5, 0, 1]);
    expect(texture.mipLevelCount).toBe(1);
    expect(Array.from(fake.writes[0]!.data as Uint8Array)).toEqual([255, 128, 0, 255]);
    texture.destroy();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 异步路径                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

interface FakeBitmap {
  readonly width: number;
  readonly height: number;
  readonly close: () => void;
}

/** 造一个 `constructor.name === 'ImageBitmap'` 的假 bitmap，这样 `isImageSource()` 认得它。 */
function createFakeBitmap(width: number, height: number, close: () => void): FakeBitmap {
  const FakeBitmap = class ImageBitmap {
    readonly width = width;
    readonly height = height;
    readonly close = close;
  };
  return new FakeBitmap();
}

const originalCreateImageBitmap = (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
const originalFetch = (globalThis as { fetch?: unknown }).fetch;

afterEach(() => {
  (globalThis as { createImageBitmap?: unknown }).createImageBitmap = originalCreateImageBitmap;
  (globalThis as { fetch?: unknown }).fetch = originalFetch;
  vi.restoreAllMocks();
});

function stubCreateImageBitmap(bitmap: FakeBitmap, onCall?: (options?: ImageBitmapOptions) => void): void {
  (globalThis as { createImageBitmap?: unknown }).createImageBitmap = async (
    _source: unknown,
    options?: ImageBitmapOptions,
  ): Promise<FakeBitmap> => {
    onCall?.(options);
    return bitmap;
  };
}

describe('GfxTexture.fromImage（createImageBitmap 异步路径）', () => {
  it('4 通道格式走 copyExternalImageToTexture，并在结束时 close() 掉 bitmap', async () => {
    const fake = createFakeDevice();
    const close = vi.fn();
    let options: ImageBitmapOptions | undefined;
    const bitmap = createFakeBitmap(64, 32, close);
    stubCreateImageBitmap(bitmap, (value) => {
      options = value;
    });

    const texture = await GfxTexture.fromImage(fake.device, {
      label: 'async',
      source: bitmap as unknown as ImageBitmapSource,
      format: 'rgba8unorm-srgb',
      flipY: true,
    });

    expect(options).toEqual({ colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    expect(fake.copies).toHaveLength(1);
    expect(fake.copies[0]!.size).toEqual({ width: 64, height: 32, depthOrArrayLayers: 1 });
    expect(fake.copies[0]!.flipY).toBe(true);
    expect(fake.copies[0]!.destination.mipLevel).toBe(0);
    expect(fake.writes).toHaveLength(0);
    expect(close).toHaveBeenCalledTimes(1);
    expect(texture.mipLevelCount).toBe(7); // 64x32 → 7 级
    expect(fake.records[0]!.generatedMipmaps).toBe(1);
    texture.destroy();
  });

  it('imageOptions 可以覆盖默认的色彩空间 / alpha 处理', async () => {
    const fake = createFakeDevice();
    let options: ImageBitmapOptions | undefined;
    stubCreateImageBitmap(createFakeBitmap(2, 2, vi.fn()), (value) => {
      options = value;
    });
    await GfxTexture.fromImage(fake.device, {
      source: createFakeImageLike(2, 2) as unknown as ImageBitmapSource,
      imageOptions: { colorSpaceConversion: 'default', premultiplyAlpha: 'premultiply' },
      mipmaps: false,
    });
    expect(options).toEqual({ colorSpaceConversion: 'default', premultiplyAlpha: 'premultiply' });
  });

  it('URL 来源会先 fetch 成 Blob', async () => {
    const fake = createFakeDevice();
    const close = vi.fn();
    const blob = { size: 1 };
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, blob: async () => blob }));
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
    let received: unknown;
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = async (
      source: unknown,
    ): Promise<FakeBitmap> => {
      received = source;
      return createFakeBitmap(4, 4, close);
    };

    await GfxTexture.fromImage(fake.device, { source: 'https://example.test/a.png', mipmaps: false });
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/a.png');
    expect(received).toBe(blob);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('HTTP 失败时报出 URL 与状态码，并且不会泄漏 bitmap', async () => {
    const fake = createFakeDevice();
    // createImageBitmap 必须先存在，否则会在 fetch 之前就被拦下（那条路径另有用例覆盖）。
    stubCreateImageBitmap(createFakeBitmap(1, 1, vi.fn()));
    (globalThis as { fetch?: unknown }).fetch = vi.fn(async () => ({ ok: false, status: 404 }));
    await expect(
      GfxTexture.fromImage(fake.device, { source: 'https://example.test/missing.png' }),
    ).rejects.toThrowError(/HTTP 404/);
  });

  it('显式 width/height 与解码结果不一致时报错（copyExternalImageToTexture 不做缩放）', async () => {
    const fake = createFakeDevice();
    const close = vi.fn();
    stubCreateImageBitmap(createFakeBitmap(8, 8, close));
    await expect(
      GfxTexture.fromImage(fake.device, {
        source: createFakeImageLike(8, 8) as unknown as ImageBitmapSource,
        width: 4,
        height: 4,
      }),
    ).rejects.toThrowError(/do not match the decoded image \(8x8\)/);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('r8unorm / rg8unorm 需要通道重排，退回 canvas 中转（本环境没有 canvas → 明确报错）', async () => {
    const fake = createFakeDevice();
    const close = vi.fn();
    stubCreateImageBitmap(createFakeBitmap(4, 4, close));
    await expect(
      GfxTexture.fromImage(fake.device, {
        source: createFakeImageLike(4, 4) as unknown as ImageBitmapSource,
        format: 'r8unorm',
      }),
    ).rejects.toThrowError(/There is no canvas in this environment/);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('没有 createImageBitmap 时给出明确错误', async () => {
    const fake = createFakeDevice();
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = undefined;
    await expect(
      GfxTexture.fromImage(fake.device, { source: createFakeImageLike(4, 4) as unknown as ImageBitmapSource }),
    ).rejects.toThrowError(/requires createImageBitmap/);
  });

  it('后端生成 mip 失败时也会 close() 掉 bitmap', async () => {
    const fake = createFakeDevice();
    const close = vi.fn();
    stubCreateImageBitmap(createFakeBitmap(8, 8, close));
    fake.generateError = new ValidationError('[gpu-device-api] mip failed');
    await expect(
      GfxTexture.fromImage(fake.device, { source: createFakeImageLike(8, 8) as unknown as ImageBitmapSource }),
    ).rejects.toThrowError(/mip failed/);
    expect(close).toHaveBeenCalledTimes(1);
    expect(fake.records[0]!.destroyed).toBe(true);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* CPU 基线实现                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

describe('buildMipChain（CPU 基线）', () => {
  it('2x2 的四个像素平均成 1x1', () => {
    const data = new Uint8Array([0, 100, 200, 255, 200, 0, 100, 255, 100, 200, 0, 255, 40, 40, 40, 255]);
    const levels = buildMipChain(data, 2, 2);
    expect(levels).toHaveLength(2);
    expect(levels[1]!.width).toBe(1);
    // 逐通道整数平均：(0+200+100+40)/4 = 85，依此类推。
    expect(Array.from(levels[1]!.data)).toEqual([85, 85, 85, 255]);
  });

  it('奇数尺寸向下取整：3x1 只平均前两个像素，最后一个被丢掉', () => {
    // 这条用例同时记录了 CPU 基线的**固有缺陷**（也是不再默认使用它的原因之一）：
    // 目标宽度取 `width >> 1`，索引是 `2x` / `2x+1`，所以奇数宽度时最后一列/最后一行
    // 完全不参与平均。GPU 侧的降采样是按整级尺寸做的，奇数尺寸下两者必然不一致。
    const data = new Uint8Array([0, 0, 0, 255, 0, 0, 0, 255, 200, 0, 0, 255]);
    const levels = buildMipChain(data, 3, 1);
    expect(levels.map((level) => level.width)).toEqual([3, 1]);
    expect(Array.from(levels[1]!.data)).toEqual([0, 0, 0, 255]);
  });

  it('1x1 不再继续降级', () => {
    expect(buildMipChain(new Uint8Array(4), 1, 1)).toHaveLength(1);
  });

  it('非 2 的幂会一路降到 1x1', () => {
    const levels = buildMipChain(new Uint8Array(60 * 36 * 4), 60, 36);
    expect(levels.map((level) => `${level.width}x${level.height}`)).toEqual([
      '60x36',
      '30x18',
      '15x9',
      '7x4',
      '3x2',
      '1x1',
    ]);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 小工具                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

/** 造一个 `constructor.name === 'ImageData'` 的对象（node 里没有这个全局构造器）。 */
function createFakeImageData(width: number, height: number, data: Uint8ClampedArray): ImageData {
  const FakeImageData = class ImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
    constructor() {
      this.width = width;
      this.height = height;
      this.data = data;
    }
  };
  return new FakeImageData() as unknown as ImageData;
}

/** 造一个 `constructor.name === 'HTMLImageElement'` 的对象。 */
function createFakeImageLike(width: number, height: number): object {
  const FakeImage = class HTMLImageElement {
    readonly width = width;
    readonly height = height;
    readonly naturalWidth = width;
    readonly naturalHeight = height;
  };
  return new FakeImage();
}
