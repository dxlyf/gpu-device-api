/**
 * WebGL2 的 command encoder。
 *
 * WebGL2 是立即模式：`beginRenderPass()` 会立刻绑定 framebuffer 并清屏，绘制也在录制时下发。
 * 所以这里的 `finish()` 只是一个**记账动作**，返回的 command buffer 里记录了本次编码期间
 * 下发过多少次绘制，供 `Queue.submit()` 校验与统计使用 —— 而不是一份待执行的指令列表。
 *
 * 复制类命令同样是立即生效的（`copyBufferSubData` / `blitFramebuffer`），
 * 这一点与 WebGPU 的「录制后统一提交」不同，已在 `core/sync/Queue.ts` 里写明差异。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import { alignTo } from '../../utils/typedArray.js';
import { glFormat } from '../utils/glFormatMap.js';
import type {
  BufferCopyView,
  CommandBuffer,
  CommandEncoder,
  CommandEncoderDescriptor,
  TextureCopyView,
} from '../../core/render/CommandEncoder.js';
import type { Extent3D } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';
import { WebGL2RenderPassEncoder, type WebGL2RenderPassOptions } from './WebGL2RenderPassEncoder.js';
import { WebGL2ComputePassEncoder } from './WebGL2ComputePassEncoder.js';
import {
  insertDebugMarker as insertGlDebugMarker,
  popDebugGroup as popGlDebugGroup,
  pushDebugGroup as pushGlDebugGroup,
} from '../utils/debugMarkers.js';

/** `finish()` 产出的 command buffer：记录本次编码期间的统计信息。 */
export interface WebGL2CommandBuffer extends CommandBuffer {
  readonly drawCalls: number;
  readonly passCount: number;
}

export class WebGL2CommandEncoder implements CommandEncoder {
  readonly label: string;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly passOptions: WebGL2RenderPassOptions;
  private openPass: WebGL2RenderPassEncoder | null = null;
  private drawCalls = 0;
  private passCount = 0;
  private finished = false;

  constructor(
    descriptor: CommandEncoderDescriptor | undefined,
    gl: WebGL2RenderingContext,
    state: GlStateCache,
    passOptions: WebGL2RenderPassOptions,
  ) {
    this.label = descriptor?.label ?? nextId('commandEncoder');
    this.gl = gl;
    this.state = state;
    this.passOptions = passOptions;
  }

  /** 由渲染通道回调，用于统计。 */
  noteDrawCall(): void {
    this.drawCalls += 1;
  }

  beginRenderPass(descriptor: Parameters<CommandEncoder['beginRenderPass']>[0]): WebGL2RenderPassEncoder {
    this.assertOpen('beginRenderPass');
    if (this.openPass && !this.openPass.ended) {
      throw new ValidationError(
        `[gpu-device-api] encoder「${this.label}」里已经有打开的渲染通道了。` +
          'WebGPU 也只允许同时打开一个通道，请先 end() 再开始下一个。',
      );
    }
    const pass = new WebGL2RenderPassEncoder(descriptor, this.passOptions);
    this.openPass = pass;
    this.passCount += 1;
    return pass;
  }

  beginComputePass(): WebGL2ComputePassEncoder {
    this.assertOpen('beginComputePass');
    return new WebGL2ComputePassEncoder();
  }

  copyBufferToBuffer(
    source: { readonly size: number },
    sourceOffset: number,
    destination: { readonly size: number },
    destinationOffset: number,
    size: number,
  ): void {
    this.assertOpen('copyBufferToBuffer');
    const sourceBuffer = source as WebGL2Buffer;
    const destinationBuffer = destination as WebGL2Buffer;

    // WebGL2 没有 copyBufferSubData，只能借一段 CPU 内存中转。
    const bytes = new Uint8Array(size);
    if (sourceBuffer.isIndexBuffer || destinationBuffer.isIndexBuffer) {
      // 索引缓冲固定在 ELEMENT_ARRAY_BUFFER 上、且两个 buffer 不能同时占同一个目标
      // （见 WebGL2Buffer），所以各自走自己的目标。
      sourceBuffer.download(sourceOffset, bytes);
      destinationBuffer.upload(destinationOffset, bytes);
      return;
    }
    this.state.bindCopyReadBuffer(sourceBuffer.native);
    this.gl.getBufferSubData(this.gl.COPY_READ_BUFFER, sourceOffset, bytes);
    this.state.bindCopyWriteBuffer(destinationBuffer.native);
    this.gl.bufferSubData(this.gl.COPY_WRITE_BUFFER, destinationOffset, bytes);
  }

  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    this.assertOpen('copyBufferToTexture');
    const gl = this.gl;
    const sourceBuffer = source.buffer as WebGL2Buffer;
    const texture = (destination.texture as WebGL2Texture).native;
    const format = (destination.texture as WebGL2Texture).format;
    const info = glFormat(format);
    const { x: ox, y: oy, z: oz } = resolveOrigin(destination.origin);
    const bytesPerRow = source.bytesPerRow ?? copySize.width * info.bytesPerPixel;

    // 逐行从 buffer 读出来再上传：WebGL2 的 texSubImage2D 不支持「从 buffer 读」，
    // 必须把数据放到 CPU 内存里。像素解包参数用来处理行距与对齐。
    const rows = copySize.height;
    const data = new Uint8Array(bytesPerRow * rows);
    // 走 buffer 自己的目标读回：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
    sourceBuffer.download(source.offset ?? 0, data);

    gl.bindTexture((destination.texture as WebGL2Texture).target, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (bytesPerRow !== copySize.width * info.bytesPerPixel) {
      gl.pixelStorei(gl.UNPACK_ROW_LENGTH, bytesPerRow / info.bytesPerPixel);
    }
    const target = (destination.texture as WebGL2Texture).target;
    if (target === gl.TEXTURE_3D || target === gl.TEXTURE_2D_ARRAY) {
      gl.texSubImage3D(
        target,
        destination.mipLevel ?? 0,
        ox,
        oy,
        oz,
        copySize.width,
        copySize.height,
        copySize.depthOrArrayLayers,
        info.format,
        info.type,
        data,
      );
    } else {
      gl.texSubImage2D(
        target,
        destination.mipLevel ?? 0,
        ox,
        oy,
        copySize.width,
        copySize.height,
        info.format,
        info.type,
        data,
      );
    }
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    // 只绕过缓存直接改了一个纹理单元的绑定，作废纹理单元缓存即可；
    // invalidate() 会把 program/blend/depth/VAO/UBO 一起丢掉，下一次 draw 要全部重下。
    this.state.invalidateTextureUnits();
  }

  copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void {
    this.assertOpen('copyTextureToBuffer');
    const gl = this.gl;
    const texture = source.texture as WebGL2Texture;
    const info = glFormat(texture.format);
    const bytesPerRow = alignTo(
      destination.bytesPerRow ?? copySize.width * info.bytesPerPixel,
      4,
    );
    const data = new Uint8Array(bytesPerRow * copySize.height);

    // 用 framebuffer 把纹理当附件读回：WebGL2 没有直接的 getTexImage。
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new ValidationError('[gpu-device-api] gl.createFramebuffer() 返回 null，无法读回纹理。');
    }
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    const attachment = info.depth ? gl.DEPTH_ATTACHMENT : gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.native, source.mipLevel ?? 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
      gl.deleteFramebuffer(framebuffer);
      throw new ValidationError(
        `[gpu-device-api] 无法把纹理「${texture.label}」作为附件读回（framebuffer 不完整，0x${status.toString(16)}）。` +
          '请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。',
      );
    }

    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    const { x: readX, y: readY } = resolveOrigin(source.origin);
    gl.readPixels(readX, readY, copySize.width, copySize.height, info.format, info.type, data);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    gl.deleteFramebuffer(framebuffer);
    // 这条读回路径临时切了 framebuffer：framebuffer 绑定不在状态缓存里（见 WebGL2RenderTarget.attach），
    // 所以保留整体作废。它不在每 draw 的热路径上，不必为它冒状态失准的风险。
    this.state.invalidate();

    const buffer = destination.buffer as WebGL2Buffer;
    // 走 buffer 自己的目标写回：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
    buffer.upload(destination.offset ?? 0, data);
  }

  copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    this.assertOpen('copyTextureToTexture');
    const gl = this.gl;
    const sourceTexture = source.texture as WebGL2Texture;
    const destinationTexture = destination.texture as WebGL2Texture;
    const info = glFormat(destinationTexture.format);
    const { x: sourceX, y: sourceY } = resolveOrigin(source.origin);
    const { x: destinationX, y: destinationY } = resolveOrigin(destination.origin);

    // 用 blitFramebuffer 做 GPU 侧拷贝，避免绕 CPU 一圈。
    const readFramebuffer = gl.createFramebuffer();
    const drawFramebuffer = gl.createFramebuffer();
    if (!readFramebuffer || !drawFramebuffer) {
      throw new ValidationError('[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。');
    }
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFramebuffer);
    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      sourceTexture.native,
      source.mipLevel ?? 0,
    );
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawFramebuffer);
    gl.framebufferTexture2D(
      gl.DRAW_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      destinationTexture.native,
      destination.mipLevel ?? 0,
    );
    if (glFormat(sourceTexture.format).internalFormat !== info.internalFormat) {
      throw new ValidationError(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${sourceTexture.format}」，` +
          `目标是「${destinationTexture.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`,
      );
    }
    gl.blitFramebuffer(
      sourceX,
      sourceY,
      sourceX + copySize.width,
      sourceY + copySize.height,
      destinationX,
      destinationY,
      destinationX + copySize.width,
      destinationY + copySize.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    gl.deleteFramebuffer(readFramebuffer);
    gl.deleteFramebuffer(drawFramebuffer);
    // 同上：blit 前后切了 READ/DRAW framebuffer，保留整体作废（非热路径）。
    this.state.invalidate();
  }

  clearBuffer(buffer: { readonly size: number }, offset = 0, size?: number): void {
    this.assertOpen('clearBuffer');
    const target = buffer as WebGL2Buffer;
    const length = size ?? (buffer.size - offset);
    const zeros = new Uint8Array(length);
    // 走 buffer 自己的目标：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
    target.upload(offset, zeros);
  }

  /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
  pushDebugGroup(label: string): void {
    pushGlDebugGroup(this.gl, label);
  }

  popDebugGroup(): void {
    popGlDebugGroup(this.gl);
  }

  insertDebugMarker(label: string): void {
    insertGlDebugMarker(this.gl, label);
  }

  finish(): WebGL2CommandBuffer {
    this.assertOpen('finish');
    if (this.openPass && !this.openPass.ended) {
      // 与 WebGPU 一致：通道没结束就 finish 是错误用法。
      throw new ValidationError(
        `[gpu-device-api] encoder「${this.label}」还有未结束的渲染通道，请先调用 pass.end()。`,
      );
    }
    this.finished = true;
    return {
      label: `${this.label}:commandBuffer`,
      native: null,
      drawCalls: this.drawCalls,
      passCount: this.passCount,
      disposed: false,
      dispose: () => {
        // command buffer 不持有 GL 资源（命令已经执行完了）。
      },
    };
  }

  private assertOpen(operation: string): void {
    if (this.finished) {
      throw new ValidationError(
        `[gpu-device-api] encoder「${this.label}」已经 finish()，不能再调用 ${operation}()。`,
      );
    }
  }
}

/** `Partial<Origin3D>`（每个分量都可选）补齐成确定数值。 */
function resolveOrigin(origin: Partial<{ x: number; y: number; z: number }> | undefined): {
  x: number;
  y: number;
  z: number;
} {
  return { x: origin?.x ?? 0, y: origin?.y ?? 0, z: origin?.z ?? 0 };
}
