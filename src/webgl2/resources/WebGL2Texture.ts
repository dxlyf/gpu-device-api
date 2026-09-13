/**
 * WebGL2 纹理资源。
 *
 * 用不可变的 `texStorage2D` / `texStorage3D` 一次性分配存储，后续只用 `texSubImage2D` 上传内容。
 * 相比 `texImage2D` 每次都可能重新分配，这个组合在 WebGL2 上更快，也更接近 WebGPU
 * 「先创建不可变纹理、再 copy 数据进去」的模型。
 *
 * WebGL2 没有 texture view 对象，`createView()` 返回的是**记录子资源范围**的轻量包装，
 * 真正的 GL 纹理句柄还是同一个。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import { assertPositiveInteger } from '../../utils/assert.js';
import { nextId } from '../../utils/id.js';
import {
  resolveTextureSize,
  TextureDimension,
  type Texture,
  type TextureDescriptor,
} from '../../core/resources/Texture.js';
import type { Extent3D } from '../../types/internal.js';
import { glFormat } from '../utils/glFormatMap.js';
import { multisampleApi } from '../utils/glCapabilities.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import { WebGL2TextureView } from './WebGL2TextureView.js';
import type { TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';

/** core 的维度映射到 GL 的纹理目标。 */
export function glTextureTarget(dimension: TextureDimension, depthOrArrayLayers: number): number {
  if (dimension === '1d') {
    throw new ValidationError(
      '[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。',
    );
  }
  if (dimension === '3d') return 0x806f; // TEXTURE_3D
  if (depthOrArrayLayers > 1) return 0x8c1a; // TEXTURE_2D_ARRAY
  return 0x0de1; // TEXTURE_2D
}

export class WebGL2Texture implements Texture {
  readonly label: string;
  readonly dimension: TextureDimension;
  readonly format: Texture['format'];
  readonly usage: TextureUsage;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly native: WebGLTexture;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly glTarget: number;
  private readonly onDestroy: (texture: WebGL2Texture) => void;
  /** 已创建的 view；随纹理一起失效。 */
  readonly views: WebGL2TextureView[] = [];
  private _disposed = false;

  constructor(
    gl: WebGL2RenderingContext,
    state: GlStateCache,
    descriptor: TextureDescriptor,
    onDestroy: (texture: WebGL2Texture) => void,
  ) {
    this.gl = gl;
    this.state = state;
    this.onDestroy = onDestroy;

    const extent = resolveTextureSize(descriptor.size);
    assertPositiveInteger(extent.width, 'TextureDescriptor.size.width');
    if (extent.height <= 0 || extent.depthOrArrayLayers <= 0) {
      throw new ValidationError(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${extent.width}x${extent.height}x${extent.depthOrArrayLayers}。`,
      );
    }

    const format = glFormat(descriptor.format);
    const dimension = descriptor.dimension ?? TextureDimension.D2;
    const sampleCount = descriptor.sampleCount ?? 1;
    const mipLevelCount = descriptor.mipLevelCount ?? 1;

    if (sampleCount > 1) {
      if (dimension !== TextureDimension.D2 || extent.depthOrArrayLayers > 1) {
        throw new ValidationError(
          '[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: \'2d\'` 且 `depthOrArrayLayers: 1`）。',
        );
      }
      if (mipLevelCount > 1) {
        throw new ValidationError('[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。');
      }
    }
    if (mipLevelCount > 1) {
      const maxLevels = Math.floor(Math.log2(Math.max(extent.width, extent.height))) + 1;
      if (mipLevelCount > maxLevels) {
        throw new ValidationError(
          `[gpu-device-api] mipLevelCount=${mipLevelCount} 超过了 ${extent.width}x${extent.height} 能容纳的最大层数 ${maxLevels}。`,
        );
      }
    }

    this.label = descriptor.label ?? nextId('texture');
    this.dimension = dimension;
    this.format = descriptor.format;
    this.usage = descriptor.usage;
    this.width = extent.width;
    this.height = extent.height;
    this.depthOrArrayLayers = extent.depthOrArrayLayers;
    this.mipLevelCount = mipLevelCount;
    this.sampleCount = sampleCount;
    this.glTarget = glTextureTarget(dimension, extent.depthOrArrayLayers);

    const texture = gl.createTexture();
    if (!texture) throw new ValidationError('[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。');
    this.native = texture;

    // 分配存储时不需要经过状态缓存：这里绑一次就好，之后所有操作都带显式目标。
    gl.bindTexture(this.glTarget, texture);
    if (sampleCount > 1) {
      // `lib.dom.d.ts` 目前没有声明 `texStorage2DMultisample`（较新的 WebGL2 接口），
      // 这里通过一个最小扩展接口调用，避免用 `as any` 把整个上下文变成无类型。
      multisampleApi(gl).texStorage2DMultisample(
        this.glTarget,
        sampleCount,
        format.internalFormat,
        extent.width,
        extent.height,
        false,
      );
    } else if (dimension === TextureDimension.D3) {
      gl.texStorage3D(
        this.glTarget,
        mipLevelCount,
        format.internalFormat,
        extent.width,
        extent.height,
        extent.depthOrArrayLayers,
      );
    } else if (extent.depthOrArrayLayers > 1) {
      gl.texStorage3D(
        this.glTarget,
        mipLevelCount,
        format.internalFormat,
        extent.width,
        extent.height,
        extent.depthOrArrayLayers,
      );
    } else {
      gl.texStorage2D(this.glTarget, mipLevelCount, format.internalFormat, extent.width, extent.height);
    }

    this.applyDefaultSamplerParameters();
  }

  get size(): Extent3D {
    return { width: this.width, height: this.height, depthOrArrayLayers: this.depthOrArrayLayers };
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
  get target(): number {
    return this.glTarget;
  }

  createView(descriptor: TextureViewDescriptor = {}): TextureView {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] 纹理「${this.label}」已销毁，不能再创建 view。`);
    }
    const view = new WebGL2TextureView(this, descriptor);
    this.views.push(view);
    return view;
  }

  /**
   * 使用 GL 内置的 `generateMipmap` 生成 mip 链。
   * 要求基础层已经填好内容，且纹理不是多重采样。
   *
   * 这里直接调用 `gl.bindTexture` 而不是走状态缓存 —— 因为不知道这张纹理此刻被绑在哪个单元上，
   * 与其猜测，不如改完之后把缓存整体作废（生成 mip 发生在加载阶段，代价可以忽略）。
   */
  generateMipmaps(): void {
    if (this.sampleCount > 1) return;
    if (this.mipLevelCount <= 1) return;
    this.gl.bindTexture(this.glTarget, this.native);
    this.gl.generateMipmap(this.glTarget);
    this.state.invalidate();
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const view of this.views) view.markDestroyed();
    this.views.length = 0;
    this.state.forgetTexture(this.native);
    this.gl.deleteTexture(this.native);
    this.onDestroy(this);
  }

  dispose(): void {
    this.destroy();
  }

  /**
   * 给纹理对象本身设置一套默认采样参数。
   *
   * 取值刻意与 **WebGPU 的默认值**一致（`nearest` + `clamp-to-edge`），这样即使使用者忘记
   * 提供 Sampler，两个后端的观感也相同。WebGL2 的 GL 默认值（`LINEAR_MIPMAP_LINEAR` +
   * `REPEAT`）反而会与 WebGPU 不一致。
   */
  private applyDefaultSamplerParameters(): void {
    const gl = this.gl;
    const target = this.glTarget;
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(target, gl.TEXTURE_MAX_LEVEL, this.mipLevelCount - 1);
  }
}
