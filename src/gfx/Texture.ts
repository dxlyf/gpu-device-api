/**
 * 纹理：把「图片 / 原始像素」变成可以直接绑定的 core 纹理 + 采样器。
 *
 * 两个后端对 mipmap 的支持不一样（WebGL2 有 `generateMipmap`，WebGPU 没有），
 * 所以这里统一在 **CPU 上生成 mip 链**，再逐级 `queue.writeTexture` 上传。
 * 这样两个后端的观感完全一致，代价是上传时多一点 CPU 开销 —— 对便捷层是合适的取舍。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { TextureUsage } from '../core/enums/TextureUsage.js';
import { defaultTextureUsage, resolveTextureSize } from '../core/resources/Texture.js';
import { nextId } from '../utils/id.js';
import type { Device } from '../core/Device.js';
import type { Sampler } from '../core/resources/Sampler.js';
import type { Texture, TextureDescriptor } from '../core/resources/Texture.js';
import type { TextureView } from '../core/resources/TextureView.js';
import type { AddressMode } from '../core/enums/AddressMode.js';
import type { FilterMode } from '../core/enums/FilterMode.js';
import type { TextureFormat } from '../core/enums/TextureFormat.js';

/** 能被接受的图片来源。 */
export type ImageSource =
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | OffscreenCanvas
  | ImageData
  | VideoFrame
  | HTMLVideoElement;

export interface TextureDesc {
  label?: string;
  /** 原始像素，或浏览器图像来源。 */
  data: ArrayBufferView | ImageSource;
  width?: number;
  height?: number;
  format?: TextureFormat;
  /** 是否生成 mip 链。原始像素默认 `false`（省一次 CPU 开销），图像来源默认 `true`。 */
  mipmaps?: boolean;
  magFilter?: FilterMode;
  minFilter?: FilterMode;
  wrap?: AddressMode;
  wrapS?: AddressMode;
  wrapT?: AddressMode;
  /** 图像来源默认需要翻转 Y（图像左上为原点，GL 纹理左下为原点）。 */
  flipY?: boolean;
}

/** 一个可绑定的纹理（core 纹理 + 视图 + 采样器）。 */
export class GfxTexture {
  readonly label: string;
  readonly texture: Texture;
  readonly view: TextureView;
  readonly sampler: Sampler;
  readonly width: number;
  readonly height: number;
  readonly format: TextureFormat;
  readonly mipLevelCount: number;
  /** 进程内唯一标识，用于构建 bind group 缓存键。 */
  readonly id: string;

  private _disposed = false;

  private constructor(init: {
    device: Device;
    label: string;
    texture: Texture;
    view: TextureView;
    sampler: Sampler;
    width: number;
    height: number;
    format: TextureFormat;
    mipLevelCount: number;
  }) {
    this.label = init.label;
    this.texture = init.texture;
    this.view = init.view;
    this.sampler = init.sampler;
    this.width = init.width;
    this.height = init.height;
    this.format = init.format;
    this.mipLevelCount = init.mipLevelCount;
    this.id = nextId('gfxTexture');
  }

  /** 创建纹理（含可选 mip 链）。 */
  static create(device: Device, desc: TextureDesc): GfxTexture {
    const label = desc.label ?? 'texture';
    const format = desc.format ?? 'rgba8unorm';
    const flipY = desc.flipY ?? isImageSource(desc.data);
    const mipmaps = desc.mipmaps ?? (isImageSource(desc.data) && format === 'rgba8unorm');

    if (format !== 'rgba8unorm') {
      throw new ValidationError(
        `[gpu-device-api] 便捷层的纹理目前只支持 rgba8unorm（收到「${format}」）。` +
          '需要其它格式请直接用 core 的 device.createTexture() + queue.writeTexture()。',
      );
    }

    const decoded = decodeSource(desc.data, desc.width, desc.height, flipY);
    const levels = mipmaps ? buildMipChain(decoded.data, decoded.width, decoded.height) : [decoded];

    const descriptor: TextureDescriptor = {
      label,
      size: { width: decoded.width, height: decoded.height },
      format,
      mipLevelCount: levels.length,
      usage: defaultTextureUsage(0) | TextureUsage.CopyDst,
    };
    const texture = device.createTexture(descriptor);

    // 逐级上传：第 0 级来自数据，其余来自 CPU 生成的 mip 链。
    for (let level = 0; level < levels.length; level++) {
      const entry = levels[level]!;
      device.queue.writeTexture(
        { texture, mipLevel: level, origin: { x: 0, y: 0, z: 0 } },
        entry.data,
        { offset: 0, bytesPerRow: entry.width * 4, rowsPerImage: entry.height },
        { width: entry.width, height: entry.height, depthOrArrayLayers: 1 },
      );
    }

    const sampler = device.createSampler({
      label: `${label}:sampler`,
      addressModeU: desc.wrapS ?? desc.wrap ?? 'clamp-to-edge',
      addressModeV: desc.wrapT ?? desc.wrap ?? 'clamp-to-edge',
      magFilter: desc.magFilter ?? 'linear',
      minFilter: desc.minFilter ?? 'linear',
      mipmapFilter: levels.length > 1 ? 'linear' : 'nearest',
    });

    return new GfxTexture({
      device,
      label,
      texture,
      view: texture.createView(),
      sampler,
      width: decoded.width,
      height: decoded.height,
      format,
      mipLevelCount: levels.length,
    });
  }

  /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
  static solid(device: Device, color: readonly [number, number, number, number]): GfxTexture {
    return GfxTexture.create(device, {
      label: 'solid',
      data: new Uint8Array([
        Math.round(color[0] * 255),
        Math.round(color[1] * 255),
        Math.round(color[2] * 255),
        Math.round(color[3] * 255),
      ]),
      width: 1,
      height: 1,
      mipmaps: false,
    });
  }

  get disposed(): boolean {
    return this._disposed;
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.sampler.dispose();
    this.texture.destroy();
  }
}

export function isImageSource(value: unknown): value is ImageSource {
  if (!value || typeof value !== 'object') return false;
  const name = (value as { constructor?: { name?: string } }).constructor?.name ?? '';
  return (
    name === 'ImageBitmap' ||
    name === 'HTMLImageElement' ||
    name === 'HTMLCanvasElement' ||
    name === 'OffscreenCanvas' ||
    name === 'ImageData' ||
    name === 'VideoFrame' ||
    name === 'HTMLVideoElement'
  );
}

interface DecodedPixels {
  data: Uint8Array;
  width: number;
  height: number;
}

/** 把两种输入统一成紧凑的 RGBA8 像素。 */
function decodeSource(
  source: ArrayBufferView | ImageSource,
  width: number | undefined,
  height: number | undefined,
  flipY: boolean,
): DecodedPixels {
  if (!isImageSource(source)) {
    const view = source as ArrayBufferView;
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    const w = width ?? 0;
    const h = height ?? 0;
    if (w <= 0 || h <= 0) {
      throw new ValidationError(
        '[gpu-device-api] 用原始像素创建纹理时必须给出 width 与 height（无法从字节数推断）。',
      );
    }
    if (bytes.byteLength < w * h * 4) {
      throw new ValidationError(
        `[gpu-device-api] 纹理数据只有 ${bytes.byteLength} 字节，但 ${w}x${h} 的 RGBA8 需要 ${w * h * 4} 字节。`,
      );
    }
    return { data: flipY ? flipRows(bytes.subarray(0, w * h * 4), w, h) : bytes.subarray(0, w * h * 4), width: w, height: h };
  }

  if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined') {
    throw new ValidationError(
      '[gpu-device-api] 当前环境没有 canvas，无法解码图片来源；请改用原始像素（并给出 width/height）。',
    );
  }

  const image = source as { naturalWidth?: number; videoWidth?: number; width?: number };
  const w = width ?? image.naturalWidth ?? image.videoWidth ?? image.width ?? 0;
  const h = height ?? (source as { naturalHeight?: number; videoHeight?: number; height?: number }).naturalHeight ?? (source as { videoHeight?: number }).videoHeight ?? (source as { height?: number }).height ?? 0;
  if (w <= 0 || h <= 0) {
    throw new ValidationError(
      '[gpu-device-api] 图像来源还没有尺寸（图片可能尚未加载完成）。请等 load 事件之后再创建纹理。',
    );
  }

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(w, h)
      : document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!context) {
    throw new ValidationError('[gpu-device-api] 无法取得 2D context，图片解码失败。');
  }
  context.drawImage(source as CanvasImageSource, 0, 0, w, h);
  const imageData = context.getImageData(0, 0, w, h);
  const pixels = new Uint8Array(imageData.data.buffer.slice(0));
  return { data: flipY ? flipRows(pixels, w, h) : pixels, width: w, height: h };
}

/** 逐行上下翻转（图像坐标 → GL 纹理坐标）。 */
function flipRows(data: Uint8Array, width: number, height: number): Uint8Array {
  const rowBytes = width * 4;
  const out = new Uint8Array(data.byteLength);
  for (let y = 0; y < height; y++) {
    const source = y * rowBytes;
    const target = (height - 1 - y) * rowBytes;
    out.set(data.subarray(source, source + rowBytes), target);
  }
  return out;
}

/**
 * 2×2 盒式滤波生成完整 mip 链。奇数尺寸时对边缘取样做夹紧处理，避免越界。
 * 返回的数组第 0 项就是原始数据。
 */
export function buildMipChain(data: Uint8Array, width: number, height: number): DecodedPixels[] {
  const levels: DecodedPixels[] = [{ data, width, height }];
  let source = data;
  let sourceWidth = width;
  let sourceHeight = height;

  while (sourceWidth > 1 || sourceHeight > 1) {
    const targetWidth = Math.max(1, sourceWidth >> 1);
    const targetHeight = Math.max(1, sourceHeight >> 1);
    const target = new Uint8Array(targetWidth * targetHeight * 4);
    for (let y = 0; y < targetHeight; y++) {
      const y0 = Math.min(y * 2, sourceHeight - 1);
      const y1 = Math.min(y * 2 + 1, sourceHeight - 1);
      for (let x = 0; x < targetWidth; x++) {
        const x0 = Math.min(x * 2, sourceWidth - 1);
        const x1 = Math.min(x * 2 + 1, sourceWidth - 1);
        const i00 = (y0 * sourceWidth + x0) * 4;
        const i10 = (y0 * sourceWidth + x1) * 4;
        const i01 = (y1 * sourceWidth + x0) * 4;
        const i11 = (y1 * sourceWidth + x1) * 4;
        const index = (y * targetWidth + x) * 4;
        for (let channel = 0; channel < 4; channel++) {
          target[index + channel] =
            (source[i00 + channel]! + source[i10 + channel]! + source[i01 + channel]! + source[i11 + channel]!) >> 2;
        }
      }
    }
    levels.push({ data: target, width: targetWidth, height: targetHeight });
    source = target;
    sourceWidth = targetWidth;
    sourceHeight = targetHeight;
  }
  return levels;
}

/** 供外部复用：把尺寸描述归一化。 */
export { resolveTextureSize };
