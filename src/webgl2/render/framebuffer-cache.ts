/**
 * framebuffer 缓存（本文件不在原始目录清单里，是为支持「用原始 colorAttachments /
 * depthStencilAttachment 而不是 RenderTarget 开启渲染通道」而必须补的一小块）。
 *
 * `RenderTarget` 自己持有 framebuffer，但 WebGPU 形状的 `beginRenderPass` 允许直接传
 * attachment 的 texture view。WebGL2 的 framebuffer 是独立对象，必须按附件组合临时拼一个。
 * 每帧重建 framebuffer 会造成明显的对象churn，所以这里按「附件签名」缓存，
 * 被释放的纹理对应的条目在 `release()` 时清理。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { glFormat } from '../utils/glFormatMap.js';
import type { ColorAttachment, DepthStencilAttachment } from '../../core/render/RenderTarget.js';
import type { RenderPassDescriptor } from '../../core/render/RenderPassEncoder.js';
import type { WebGL2TextureView } from '../resources/WebGL2TextureView.js';

function signatureOf(descriptor: RenderPassDescriptor): string {
  const colors = descriptor.colorAttachments
    .map((attachment) => (attachment ? viewSignature(attachment) : '-'))
    .join(',');
  const depth = descriptor.depthStencilAttachment ? viewSignature(descriptor.depthStencilAttachment) : '-';
  return `${colors}|${depth}`;
}

function viewSignature(attachment: ColorAttachment | DepthStencilAttachment): string {
  const view = attachment.view as WebGL2TextureView;
  const texture = view.texture;
  return `${view.label}@${texture.label}#${texture.width}x${texture.height}`;
}

export class FramebufferCache {
  private readonly gl: WebGL2RenderingContext;
  private readonly framebuffers = new Map<string, WebGLFramebuffer>();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
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

    let colorIndex = 0;
    for (const attachment of descriptor.colorAttachments) {
      if (!attachment) continue;
      const view = attachment.view as WebGL2TextureView;
      const target = view.target;
      if (target === gl.TEXTURE_2D) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + colorIndex, target, view.glTexture, 0);
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
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, view.glTexture, 0);
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
    return framebuffer;
  }

  clear(): void {
    for (const framebuffer of this.framebuffers.values()) {
      this.gl.deleteFramebuffer(framebuffer);
    }
    this.framebuffers.clear();
  }

  dispose(): void {
    this.clear();
  }
}
