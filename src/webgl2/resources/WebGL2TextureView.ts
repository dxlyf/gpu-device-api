/**
 * WebGL2 的 texture view。
 *
 * WebGL2 没有 view 对象：同一个 `WebGLTexture` 句柄可以按不同 mip / 层范围去采样或作为附件。
 * 所以这里是个**轻量记录器** —— 保存子资源范围，`native` 直接返回底层 GL 纹理，
 * 真正用到范围的地方（framebuffer 附件、`texSubImage3D` 的 z 偏移）由调用方读取这些字段。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import {
  resolveTextureViewDescriptor,
  type TextureView,
  type TextureViewDescriptor,
} from '../../core/resources/TextureView.js';
import { nextId } from '../../utils/id.js';
import type { WebGL2Texture } from './WebGL2Texture.js';

export class WebGL2TextureView implements TextureView {
  readonly label: string;
  readonly texture: WebGL2Texture;
  readonly descriptor: TextureView['descriptor'];
  private _disposed = false;

  constructor(texture: WebGL2Texture, descriptor: TextureViewDescriptor) {
    const resolved = resolveTextureViewDescriptor(texture, descriptor);
    if (resolved.baseMipLevel + resolved.mipLevelCount > texture.mipLevelCount) {
      throw new ValidationError(
        `[gpu-device-api] texture view 的 mip 范围 [${resolved.baseMipLevel}, ${resolved.baseMipLevel + resolved.mipLevelCount}) ` +
          `超出了纹理「${texture.label}」的 ${texture.mipLevelCount} 层。`,
      );
    }
    if (resolved.baseArrayLayer + resolved.arrayLayerCount > texture.depthOrArrayLayers) {
      throw new ValidationError(
        `[gpu-device-api] texture view 的层范围 [${resolved.baseArrayLayer}, ${resolved.baseArrayLayer + resolved.arrayLayerCount}) ` +
          `超出了纹理「${texture.label}」的 ${texture.depthOrArrayLayers} 层。`,
      );
    }
    this.texture = texture;
    this.descriptor = resolved;
    this.label = descriptor.label ?? nextId('textureView');
  }

  /** WebGL2 里 view 就是纹理本身，所以直接返回 GL 纹理句柄。 */
  get native(): WebGLTexture {
    return this.texture.native;
  }

  /** 底层 GL 纹理（与 `native` 相同，语义更明确）。 */
  get glTexture(): WebGLTexture {
    return this.texture.native;
  }

  /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
  get target(): number {
    return this.texture.target;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 纹理销毁时由纹理统一调用，避免 view 继续被使用。 */
  markDestroyed(): void {
    this._disposed = true;
  }

  dispose(): void {
    // view 不持有独立资源，销毁由纹理负责。
    this._disposed = true;
  }
}
