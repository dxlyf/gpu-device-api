/**
 * WebGPU texture 资源：`Texture` 接口在 `GPUTexture` 上的实现。
 *
 * 两条创建路径：
 * - {@link WebGPUTexture.create}：由 `device.createTexture()` 走正常流程，usage / format /
 *   sampleCount 会在进入 WebGPU 之前按能力表校验；
 * - {@link WebGPUTexture.adopt}：把已经存在的原生 `GPUTexture`（典型例子是 canvas
 *   back buffer 的帧纹理）包起来。这类 texture 由 canvas 拥有，`destroy()` 不会销毁它。
 *
 * view 的创建与缓存也在本类：同一个 subresource 组合只建一次 view，并随 texture 一起释放。
 */

import type { Texture, TextureDescriptor, TextureDimension } from '../../core/resources/Texture.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { TextureUsage } from '../../core/enums/TextureUsage.js';
import type { TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';
import type { Extent3D } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { fullMipLevelCount, resolveTextureSize } from '../../core/resources/Texture.js';
import { resolveTextureViewDescriptor } from '../../core/resources/TextureView.js';
import { cacheKey } from '../../core/pipeline/PipelineCache.js';
import { toGPUTextureUsage } from '../utils/wgpuEnumMap.js';
import {
  assertTextureUsageSupported,
  fromGPUTextureFormat,
  toGPUTextureFormat,
} from '../utils/wgpuFormatMap.js';
import { WebGPUTextureView } from './WebGPUTextureView.js';
import { describeUnknown } from './WebGPUBuffer.js';

/** 已解析的 texture 描述，便于 resize / 调试时复用。 */
export interface ResolvedTextureDescriptor {
  readonly label: string;
  readonly size: Extent3D;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly dimension: TextureDimension;
  readonly format: TextureFormat;
  readonly usage: TextureUsage;
  readonly viewFormats: readonly TextureFormat[];
}

export class WebGPUTexture implements Texture {
  readonly label: string;
  readonly dimension: TextureDimension;
  readonly format: TextureFormat;
  readonly usage: TextureUsage;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly native: GPUTexture;
  /** 创建时声明的额外 view 格式。 */
  readonly viewFormats: readonly TextureFormat[];

  private readonly device: WebGPUDevice;
  private readonly owned: boolean;
  private readonly extent: Extent3D;
  private readonly viewCache = new Map<string, WebGPUTextureView>();
  private readonly viewList: WebGPUTextureView[] = [];
  private _disposed = false;

  private constructor(
    device: WebGPUDevice,
    native: GPUTexture,
    descriptor: ResolvedTextureDescriptor,
    owned: boolean,
  ) {
    this.device = device;
    this.owned = owned;
    this.native = native;
    this.label = descriptor.label;
    this.extent = descriptor.size;
    this.dimension = descriptor.dimension;
    this.format = descriptor.format;
    this.usage = descriptor.usage;
    this.mipLevelCount = descriptor.mipLevelCount;
    this.sampleCount = descriptor.sampleCount;
    this.viewFormats = descriptor.viewFormats;
    this.width = descriptor.size.width;
    this.height = descriptor.size.height;
    this.depthOrArrayLayers = descriptor.size.depthOrArrayLayers;
  }

  /**
   * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
   *
   * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
   */
  static create(device: WebGPUDevice, descriptor: TextureDescriptor): WebGPUTexture {
    const size = resolveTextureSize(descriptor.size);
    const resolved: ResolvedTextureDescriptor = {
      label: descriptor.label ?? `texture#${device.nextResourceId('texture')}`,
      size,
      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      dimension: descriptor.dimension ?? '2d',
      format: descriptor.format,
      usage: descriptor.usage,
      viewFormats: descriptor.viewFormats ?? [],
    };

    assertTextureDescriptor(resolved, device);

    const native = device.native.createTexture({
      label: resolved.label,
      size: { width: size.width, height: size.height, depthOrArrayLayers: size.depthOrArrayLayers },
      mipLevelCount: resolved.mipLevelCount,
      sampleCount: resolved.sampleCount,
      dimension: resolved.dimension,
      format: toGPUTextureFormat(resolved.format),
      usage: toGPUTextureUsage(resolved.usage),
      viewFormats: resolved.viewFormats.map((format) => toGPUTextureFormat(format)),
    });
    return new WebGPUTexture(device, native, resolved, true);
  }

  /**
   * 包住一个已经存在的原生 `GPUTexture`（例如 canvas 的帧纹理）。
   *
   * `owned` 为 `false` 时 `destroy()` 只标记本包装对象失效，不会销毁底层 texture。
   * 未提供的字段会直接从原生对象读取（canvas 帧纹理的尺寸/格式只能这样拿到）。
   */
  static adopt(
    device: WebGPUDevice,
    native: GPUTexture,
    descriptor: Partial<ResolvedTextureDescriptor> = {},
    options: { owned?: boolean } = {},
  ): WebGPUTexture {
    const size: Extent3D = descriptor.size ?? {
      width: native.width,
      height: native.height,
      depthOrArrayLayers: native.depthOrArrayLayers,
    };
    const resolved: ResolvedTextureDescriptor = {
      label: descriptor.label ?? (native.label.length > 0 ? native.label : 'canvas-texture'),
      size,
      mipLevelCount: descriptor.mipLevelCount ?? native.mipLevelCount,
      sampleCount: descriptor.sampleCount ?? native.sampleCount,
      dimension: descriptor.dimension ?? native.dimension,
      format: descriptor.format ?? fromGPUTextureFormat(native.format),
      usage: descriptor.usage ?? native.usage,
      viewFormats: descriptor.viewFormats ?? [],
    };
    return new WebGPUTexture(device, native, resolved, options.owned ?? false);
  }

  get size(): Extent3D {
    return { ...this.extent };
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 当前 texture 是否仍然可用。 */
  get usable(): boolean {
    return !this._disposed && !this.device.disposed;
  }

  /** 按 subresource 选择创建（并缓存）view。 */
  createView(descriptor: TextureViewDescriptor = {}): WebGPUTextureView {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] Texture.createView: texture "${this.label}" has been destroyed.`,
      );
    }
    // 先按解析后的 descriptor 查缓存，命中时不产生任何 GPUTextureView。
    const key = viewCacheKey(resolveTextureViewDescriptor(this, descriptor));
    const cached = this.viewCache.get(key);
    if (cached) return cached;
    const view = new WebGPUTextureView(this, descriptor);
    this.viewCache.set(key, view);
    this.viewList.push(view);
    return view;
  }

  /** 目前已创建的 view；随 texture 一同释放。 */
  get views(): readonly TextureView[] {
    return this.viewList;
  }

  /** 销毁 texture（`owned` 为 false 时只标记包装对象失效）。幂等。 */
  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const view of this.viewList) view.dispose();
    this.viewCache.clear();
    if (this.owned) this.native.destroy();
  }

  /** `Disposable` 的别名。 */
  dispose(): void {
    this.destroy();
  }
}

function viewCacheKey(d: TextureView['descriptor']): string {
  return cacheKey(
    d.format ?? '',
    d.dimension,
    d.baseMipLevel,
    d.mipLevelCount,
    d.baseArrayLayer,
    d.arrayLayerCount,
    d.aspect,
  );
}

function assertTextureDescriptor(descriptor: ResolvedTextureDescriptor, device: WebGPUDevice): void {
  const { width, height, depthOrArrayLayers } = descriptor.size;
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": width and height must be positive integers, ` +
        `got ${width}x${height}.`,
    );
  }
  if (!Number.isInteger(depthOrArrayLayers) || depthOrArrayLayers <= 0) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": depthOrArrayLayers must be a positive integer, ` +
        `got ${String(depthOrArrayLayers)}.`,
    );
  }
  if (!Number.isInteger(descriptor.mipLevelCount) || descriptor.mipLevelCount <= 0) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": mipLevelCount must be a positive integer.`,
    );
  }
  const maxMipLevels = fullMipLevelCount(descriptor.size);
  if (descriptor.mipLevelCount > maxMipLevels) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": mipLevelCount ${descriptor.mipLevelCount} is more than ` +
        `the maximum ${maxMipLevels} for a ${width}x${height}x${depthOrArrayLayers} texture.`,
    );
  }
  if (descriptor.dimension === '1d' && height !== 1) {
    // WebGPU 的 1d texture 高度固定为 1。
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": a "1d" texture must have height 1, got ${height}.`,
    );
  }
  if (descriptor.dimension === '1d' && descriptor.sampleCount > 1) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": a "1d" texture cannot be multisampled.`,
    );
  }

  const maxDimension =
    descriptor.dimension === '1d'
      ? device.limits.maxTextureDimension1D
      : descriptor.dimension === '3d'
        ? device.limits.maxTextureDimension3D
        : device.limits.maxTextureDimension2D;
  if (width > maxDimension || height > maxDimension || depthOrArrayLayers > maxDimension) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": ${width}x${height}x${depthOrArrayLayers} exceeds the ` +
        `${descriptor.dimension} limit ${maxDimension}.`,
    );
  }
  if (descriptor.dimension === '2d' && depthOrArrayLayers > device.limits.maxTextureArrayLayers) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": depthOrArrayLayers ${depthOrArrayLayers} exceeds ` +
        `maxTextureArrayLayers ${device.limits.maxTextureArrayLayers}.`,
    );
  }

  assertTextureUsageSupported(
    descriptor.format,
    descriptor.usage,
    {
      sampleCount: descriptor.sampleCount,
      mipLevelCount: descriptor.mipLevelCount,
      dimension: descriptor.dimension,
      features: device.features,
    },
    `Texture "${descriptor.label}"`,
  );

  for (const viewFormat of descriptor.viewFormats) {
    if (viewFormat === descriptor.format) continue;
    // WebGPU 只允许 srgb / 非 srgb 之间的重解释。
    const strip = (format: string): string => format.replace('-srgb', '');
    if (strip(viewFormat) !== strip(descriptor.format)) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${descriptor.label}": viewFormat "${viewFormat}" is not compatible with ` +
          `format "${descriptor.format}" (WebGPU only allows srgb <-> non-srgb reinterpretation).`,
      );
    }
  }
}

/** 该对象是否为 WebGPU 后端的 texture。 */
export function isWebGPUTexture(value: unknown): value is WebGPUTexture {
  return value instanceof WebGPUTexture;
}

/** 原生 `GPUTexture` 的形状识别。 */
export function isNativeGPUTexture(value: unknown): value is GPUTexture {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { createView?: unknown; destroy?: unknown; native?: unknown };
  return (
    typeof candidate.createView === 'function' &&
    typeof candidate.destroy === 'function' &&
    !('native' in candidate)
  );
}

/**
 * 把 core 的 `TextureLike`（命令层用的最小结构）收窄为原生 `GPUTexture`。
 *
 * 命令层刻意只依赖 `{ native?: unknown }`，因此后端必须在这里补上运行时收窄；
 * 收不到合适的原生对象时抛 {@link ValidationError}，避免把 WebGL2 的资源交给 WebGPU。
 */
export function asGPUTexture(value: unknown, context: string): GPUTexture {
  if (value instanceof WebGPUTexture) return value.native;
  if (isNativeGPUTexture(value)) return value;
  const nested = (value as { native?: unknown } | null | undefined)?.native;
  if (nested !== undefined && isNativeGPUTexture(nested)) return nested;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), ` +
      `got ${describeUnknown(value)}.`,
  );
}
