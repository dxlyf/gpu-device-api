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
    /*
     * `descriptor.format`（按 `viewFormats` 重解释格式）在 WebGL2 上**可以**表达，但本后端
     * 没有 texture view 对象 —— `createView()` 返回的只是一个范围记录器，真正采样时用的是
     * **源纹理自身的内部格式**（`gl.texStorage*` 时定下的那个）。所以一旦允许 view 声明
     * 另一个格式，采样就会按源格式解释数据：`sampler2D` 去读 `RGBA8UI`、`usampler2D` 去读
     * `RGBA8`，GL 不报错，结果由实现决定（正是「静默无效」最坏的一类）。
     *
     * 这里**明确拒绝**，并说明替代方案。WebGPU 侧本来就要求重解释格式必须列在该纹理的
     * `viewFormats` 里；WebGL2 做不到，所以两个后端的差异必须在这里显式暴露。
     */
    if (resolved.format !== undefined && resolved.format !== texture.format) {
      throw new ValidationError(
        `[gpu-device-api] texture view「${descriptor.label ?? '(unnamed)'}」要求把纹理` +
          `「${texture.label}」重解释成「${resolved.format}」，但 WebGL2 后端做不到：GL 没有 view ` +
          '对象，采样用的始终是源纹理自己的内部格式，于是着色器会按另一种格式去解释同一段内存' +
          '（不报错，数值无意义）。请为需要的格式单独创建一张纹理，或把数据拷进一张' +
          `「${resolved.format}」纹理后再采样。`,
      );
    }
    if (resolved.dimension !== expectedViewDimension(texture)) {
      throw new ValidationError(
        `[gpu-device-api] texture view 的 dimension「${resolved.dimension}」与纹理` +
          `「${texture.label}」的「${expectedViewDimension(texture)}」不一致；` +
          'WebGL2 没有 view 对象，维度的差别无法表达（GL 的纹理目标在分配时就定下了）。',
      );
    }
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

/**
 * 一张纹理**唯一**能表达的 view 维度。
 *
 * GL 的纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）在 `texStorage*` 时就定下了，
 * 所以维度不是一个可以在绑定点上切换的属性 —— 传入别的维度只能报错。
 */
function expectedViewDimension(texture: WebGL2Texture): string {
  if (texture.dimension === '3d') return '3d';
  return texture.depthOrArrayLayers > 1 ? '2d-array' : '2d';
}
