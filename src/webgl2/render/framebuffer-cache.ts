/**
 * framebuffer 缓存（本文件不在原始目录清单里，是为支持「用原始 colorAttachments /
 * depthStencilAttachment 而不是 RenderTarget 开启渲染通道」而必须补的一小块）。
 *
 * `RenderTarget` 自己持有 framebuffer，但 WebGPU 形状的 `beginRenderPass` 允许直接传
 * attachment 的 texture view。WebGL2 的 framebuffer 是独立对象，必须按附件组合临时拼一个。
 * 每帧重建 framebuffer 会造成明显的对象 churn，所以这里按「附件组合」缓存。
 *
 * ## 键必须是**对象身份**，不能是 `label`
 *
 * 原来的键是 `${view.label}@${texture.label}#${width}x${height}`。`label` 是**用户可显式指定**的
 * （默认会被 `nextId` 自动唯一化，所以不是「人人中招」，但显式重名完全合法）：
 * 两张同尺寸、同显式 label 的纹理会被当成同一组附件，于是第二次 `acquire()` 直接返回第一张
 * 纹理的 framebuffer —— **画进了错误的纹理，而且不报任何错**。现在改成纹理的**对象身份**
 * （`nextId` 分配的进程内唯一 id）+ 真正影响附件语义的 mip / 层号，重名不再撞键。
 *
 * ## 淘汰必须**精准**
 *
 * 原来调用方（`WebGL2Device`）在**任意一张纹理销毁**时 `clear()` 整个缓存：一张临时纹理的
 * 生死就把全部 framebuffer 打回重建（抖动）。现在 `releaseTexture()` 只淘汰**引用了该纹理**
 * 的条目。
 *
 * ## 上限与「淘汰正在使用的条目」
 *
 * 缓存带 LRU 上限（复用 `core/pipeline/PipelineCache`）。淘汰条目时会 `deleteFramebuffer`，
 * 这是安全的 —— WebGL2 规定删除一个**当前绑定**的 framebuffer 时，该绑定点被自动重置成默认
 * 帧缓冲（WebGL2 里默认帧缓冲用 `null` 表示），所以不会留下「绑着一个已删除对象」的状态；
 * 而且本层每次 `beginRenderPass()` 与 `pass.end()` 都会重设 framebuffer 绑定
 * （见 `WebGL2RenderPassEncoder`），不会出现「以为还绑着旧对象」的情形。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { createPipelineCache, type PipelineCache } from '../../core/pipeline/PipelineCache.js';
import { glFormat } from '../utils/glFormatMap.js';
import { nextId } from '../../utils/id.js';
import type { ColorAttachment, DepthStencilAttachment } from '../../core/render/RenderTarget.js';
import type { RenderPassDescriptor } from '../../core/render/RenderPassEncoder.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';
import type { WebGL2TextureView } from '../resources/WebGL2TextureView.js';

/**
 * 每个纹理对象的进程内唯一 id（`label` 可能被用户指定成重复值，不能当键）。
 *
 * 用 `WeakMap` 惰性分配：不动 `WebGL2Texture` 的公开形状，纹理被回收后 id 记录也跟着消失。
 */
const textureIds = new WeakMap<WebGL2Texture, string>();

function identityOf(texture: WebGL2Texture): string {
  let id = textureIds.get(texture);
  if (id === undefined) {
    id = nextId('tex');
    textureIds.set(texture, id);
  }
  return id;
}

/**
 * 一个附件的键：纹理身份 + 真正影响附件内容的参数。
 *
 * `baseMipLevel` / `baseArrayLayer` 必须进键 —— 同一个纹理的不同 mip / 层是**不同的附件组合**，
 * 共用一个 framebuffer 会让 `framebufferTextureLayer` 的绑定互相覆盖。
 */
function viewSignature(attachment: ColorAttachment | DepthStencilAttachment): string {
  const view = attachment.view as WebGL2TextureView;
  const texture = view.texture;
  const descriptor = view.descriptor;
  return `${identityOf(texture)}#${view.target}@${descriptor.baseMipLevel}:${descriptor.baseArrayLayer}`;
}

function signatureOf(descriptor: RenderPassDescriptor): string {
  let key = '';
  const colors = descriptor.colorAttachments;
  for (let index = 0; index < colors.length; index += 1) {
    const attachment = colors[index];
    // 用 '-' 占位：颜色附件里的 null 表示「这个附着点空着」，位置有意义，不能跳过。
    key = `${key}|${attachment ? viewSignature(attachment) : '-'}`;
  }
  const depth = descriptor.depthStencilAttachment;
  return depth ? `${key}|d${viewSignature(depth)}` : `${key}|-`;
}

export interface FramebufferCacheOptions {
  /** 缓存的 framebuffer 上限（LRU）。默认 64。 */
  limit?: number;
}

export class FramebufferCache {
  private readonly gl: WebGL2RenderingContext;
  private readonly framebuffers: PipelineCache<WebGLFramebuffer>;
  /** 每个条目引用了哪些纹理，用于 `releaseTexture()` 的精准淘汰。 */
  private readonly references = new Map<string, readonly WebGL2Texture[]>();

  constructor(gl: WebGL2RenderingContext, options: FramebufferCacheOptions = {}) {
    this.gl = gl;
    // 被淘汰（超出上限）的 framebuffer 必须真的删掉，否则 GL 对象会一直泄漏。
    this.framebuffers = createPipelineCache<WebGLFramebuffer>(options.limit ?? 64, (framebuffer, key) => {
      this.references.delete(key);
      gl.deleteFramebuffer(framebuffer);
    });
  }

  get size(): number {
    return this.framebuffers.size;
  }

  /** 取得（必要时创建）与这组附件匹配的 framebuffer。 */
  acquire(descriptor: RenderPassDescriptor): WebGLFramebuffer {
    const key = signatureOf(descriptor);
    const cached = this.framebuffers.get(key);
    if (cached) return cached;

    const gl = this.gl;
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new ValidationError('[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。');
    }

    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const referenced: WebGL2Texture[] = [];
    let colorIndex = 0;
    for (const attachment of descriptor.colorAttachments) {
      if (!attachment) continue;
      const view = attachment.view as WebGL2TextureView;
      const target = view.target;
      referenced.push(view.texture);
      if (target === gl.TEXTURE_2D) {
        // 挂 view 自己的 baseMipLevel，而不是固定 0：键里已经把 mip 区分开了，
        // 这里如果不跟着挂，指定了别的 mip 的 view 会悄悄读到错误的 mip 层。
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + colorIndex,
          target,
          view.glTexture,
          view.descriptor.baseMipLevel,
        );
      } else {
        gl.framebufferTextureLayer(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + colorIndex,
          view.glTexture,
          view.descriptor.baseMipLevel,
          view.descriptor.baseArrayLayer,
        );
      }
      colorIndex += 1;
    }
    if (colorIndex > 0) {
      gl.drawBuffers(
        Array.from({ length: colorIndex }, (_unused, index) => gl.COLOR_ATTACHMENT0 + index),
      );
    }

    const depthAttachment = descriptor.depthStencilAttachment;
    if (depthAttachment) {
      const view = depthAttachment.view as WebGL2TextureView;
      const format = glFormat(view.texture.format);
      const attachmentPoint = format.stencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
      referenced.push(view.texture);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentPoint,
        gl.TEXTURE_2D,
        view.glTexture,
        view.descriptor.baseMipLevel,
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);

    // 立即校验：不合格的附件组合在这里就能报出来，而不是等到第一次绘制出现黑屏。
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(framebuffer);
      throw new ValidationError(
        `[gpu-device-api] 这组渲染附件在 WebGL2 下不构成完整的 framebuffer（GL 状态码 0x${status.toString(16)}）。\n` +
          '常见原因：颜色附件格式不可渲染、多个附件的尺寸/采样数不一致、深度附件与颜色附件不匹配。',
      );
    }

    this.framebuffers.set(key, framebuffer);
    this.references.set(key, referenced);
    return framebuffer;
  }

  /**
   * 淘汰**引用了这张纹理**的条目（纹理销毁时调用）。
   *
   * 为什么不是整体 `clear()`：那会把与该纹理无关的附件组合也打回重建 —— 一张临时纹理的生死
   * 就能让整帧的 framebuffer 全部重建（抖动）。键里含纹理身份，所以只有真正引用它的条目会被摘掉。
   *
   * 被摘掉的条目对应的 framebuffer 会被 `deleteFramebuffer`：它引用的纹理已经删了，留着只会让
   * framebuffer 不完整（见类注释里「淘汰正在使用的条目」的安全性说明）。
   */
  releaseTexture(texture: WebGL2Texture): void {
    const doomed: string[] = [];
    for (const [key, referenced] of this.references) {
      if (referenced.includes(texture)) doomed.push(key);
    }
    for (const key of doomed) {
      const framebuffer = this.framebuffers.get(key);
      this.framebuffers.delete(key);
      this.references.delete(key);
      if (framebuffer) this.gl.deleteFramebuffer(framebuffer);
    }
  }

  clear(): void {
    const framebuffers = this.framebuffers.values();
    this.framebuffers.clear();
    this.references.clear();
    for (const framebuffer of framebuffers) this.gl.deleteFramebuffer(framebuffer);
  }

  dispose(): void {
    this.clear();
  }
}
