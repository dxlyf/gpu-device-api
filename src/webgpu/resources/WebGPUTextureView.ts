/**
 * WebGPU texture view：`TextureView` 接口在 `GPUTextureView` 上的实现。
 *
 * `dimension` 与 `aspect` 需要显式映射（`'2d-array'` / `'depth-only'` 等），并且要校验
 * aspect 与 texture 格式是否匹配：`depth24plus` 没有 stencil aspect，`stencil8` 没有
 * depth aspect，WebGPU 对这两种情况的报错很难定位，因此在这里提前抛出。
 */

import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';
import type { WebGPUTexture } from './WebGPUTexture.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { resolveTextureViewDescriptor } from '../../core/resources/TextureView.js';
import { describeUnknown } from './WebGPUBuffer.js';
import { assertTextureAspectForFormat, toGPUTextureFormat } from '../utils/wgpuFormatMap.js';
import { toGPUTextureAspect, toGPUTextureViewDimension } from '../utils/wgpuEnumMap.js';

/** view descriptor 的完整形态（`resolveTextureViewDescriptor` 的返回值）。 */
export type ResolvedTextureViewDescriptor = TextureView['descriptor'];

export class WebGPUTextureView implements TextureView {
  readonly label: string;
  readonly texture: WebGPUTexture;
  readonly descriptor: ResolvedTextureViewDescriptor;
  readonly native: GPUTextureView;

  private _disposed = false;

  /**
   * `preResolved` 由 {@link WebGPUTexture.createView} 传入：它已经为查缓存解析过一次，
   * 这里不再重复解析（`resolveTextureViewDescriptor` 每次都会新建一个对象）。
   */
  constructor(
    texture: WebGPUTexture,
    descriptor: TextureViewDescriptor = {},
    preResolved?: ResolvedTextureViewDescriptor,
  ) {
    this.texture = texture;
    const resolved = preResolved ?? resolveTextureViewDescriptor(texture, descriptor);
    this.label = descriptor.label ?? `${texture.label}#view`;

    const aspect = resolved.aspect;
    assertTextureAspectForFormat(texture.format, aspect, `Texture "${texture.label}".createView`);

    if (resolved.baseMipLevel + resolved.mipLevelCount > texture.mipLevelCount) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${texture.label}".createView: mip range ` +
          `[${resolved.baseMipLevel}, ${resolved.baseMipLevel + resolved.mipLevelCount}) exceeds ` +
          `mipLevelCount ${texture.mipLevelCount}.`,
      );
    }
    if (resolved.baseArrayLayer + resolved.arrayLayerCount > texture.depthOrArrayLayers) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${texture.label}".createView: array layer range ` +
          `[${resolved.baseArrayLayer}, ${resolved.baseArrayLayer + resolved.arrayLayerCount}) exceeds ` +
          `depthOrArrayLayers ${texture.depthOrArrayLayers}.`,
      );
    }
    if (resolved.dimension === 'cube' || resolved.dimension === 'cube-array') {
      if (resolved.arrayLayerCount % 6 !== 0) {
        throw new ValidationError(
          `[gpu-device-api] Texture "${texture.label}".createView: a "${resolved.dimension}" view needs a ` +
            `multiple of 6 array layers, got ${resolved.arrayLayerCount}.`,
        );
      }
      if (texture.width !== texture.height) {
        throw new ValidationError(
          `[gpu-device-api] Texture "${texture.label}".createView: a "${resolved.dimension}" view needs a ` +
            `square texture, got ${texture.width}x${texture.height}.`,
        );
      }
    }

    this.descriptor = resolved;

    // `format` 重解释必须列在 texture 的 viewFormats 里，WebGPU 会校验，
    // 但先给出带上下文的报错更省事。
    let viewFormat: GPUTextureFormat | undefined;
    if (resolved.format !== undefined) {
      viewFormat = toGPUTextureFormat(resolved.format);
      if (resolved.format !== texture.format && !texture.viewFormats.includes(resolved.format)) {
        throw new ValidationError(
          `[gpu-device-api] Texture "${texture.label}".createView: view format "${resolved.format}" was not ` +
            `listed in the texture's viewFormats (${texture.viewFormats.join(', ') || 'none'}).`,
        );
      }
    }

    this.native = texture.native.createView({
      label: this.label,
      format: viewFormat,
      dimension: toGPUTextureViewDimension(resolved.dimension),
      aspect: toGPUTextureAspect(resolved.aspect),
      baseMipLevel: resolved.baseMipLevel,
      mipLevelCount: resolved.mipLevelCount,
      baseArrayLayer: resolved.baseArrayLayer,
      arrayLayerCount: resolved.arrayLayerCount,
    });
  }

  /** view 覆盖的格式（可能是重解释后的格式）。 */
  get format(): TextureFormat {
    return this.descriptor.format ?? this.texture.format;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** GPUTextureView 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose(): void {
    this._disposed = true;
  }
}

/** 该对象是否为 WebGPU 后端的 texture view。 */
export function isWebGPUTextureView(value: unknown): value is WebGPUTextureView {
  return value instanceof WebGPUTextureView;
}

/** 原生 `GPUTextureView` 的形状识别：它没有任何自有方法，只能靠 `@@toStringTag` 判断。 */
export function isNativeGPUTextureView(value: unknown): value is GPUTextureView {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as object;
  if ('native' in candidate || 'createView' in candidate) return false;
  if (Object.prototype.toString.call(value) === '[object GPUTextureView]') return true;
  // 少数实现不暴露 @@toStringTag：退化为「不像任何 core 资源对象」即接受。
  return !('texture' in candidate) && !('format' in candidate) && !('mapAsync' in candidate);
}

/**
 * 把任意 texture view 表示收窄为原生 `GPUTextureView`。
 *
 * 接受 `WebGPUTextureView`（core 资源）或直接由 escape hatch 拿到的原生 `GPUTextureView`；
 * 其余情况抛 {@link ValidationError}。
 */
export function asGPUTextureView(value: unknown, context: string): GPUTextureView {
  if (value instanceof WebGPUTextureView) return value.native;
  if (isNativeGPUTextureView(value)) return value;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU texture view (WebGPUTextureView or a native ` +
      `GPUTextureView), got ${describeUnknown(value)}.`,
  );
}
