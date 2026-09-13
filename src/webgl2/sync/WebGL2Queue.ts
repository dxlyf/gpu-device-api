/**
 * WebGL2 的队列。
 *
 * **时序契约（务必与 `core/sync/Queue.ts` 的说明一起看）**：
 * `writeBuffer` 在 WebGL2 上是**立即生效**的，而 WebGPU 是「在之后提交的命令执行前生效」。
 * 两者只在「同一帧内对同一 buffer 的同一区间写两次再分别 draw」时才会产生差异。
 * 规避方式是 uniform arena + 动态偏移：每次 draw 用独立区间，两个后端结果完全一致。
 *
 * `submit()` 在 WebGL2 上没有实际工作（命令在录制时就执行了），它存在的意义是
 * 保持调用点一致，并作为「本帧结束」的语义锚点。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import { paddedCopy } from '../../utils/typedArray.js';
import { assertUploadDataType, glFormat } from '../utils/glFormatMap.js';
import type { Queue, ExternalImageSource } from '../../core/sync/Queue.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';

export class WebGL2Queue implements Queue {
  readonly label = nextId('queue');

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private submittedCount = 0;
  private pending: Promise<void> = Promise.resolve();

  constructor(gl: WebGL2RenderingContext, state: GlStateCache) {
    this.gl = gl;
    this.state = state;
  }

  /** 已提交的 command buffer 数量（用于测试与统计）。 */
  get submitted(): number {
    return this.submittedCount;
  }

  writeBuffer(
    buffer: Buffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset = 0,
    size?: number,
  ): void {
    const target = buffer as WebGL2Buffer;
    const bytes = size ?? data.byteLength - dataOffset;
    if (bufferOffset + bytes > target.size) {
      throw new ValidationError(
        `[gpu-device-api] writeBuffer 越界：写入范围 [${bufferOffset}, ${bufferOffset + bytes}) ` +
          `超出了 buffer「${target.label}」的 ${target.size} 字节。`,
      );
    }
    const view = new Uint8Array(data.buffer, data.byteOffset + dataOffset, bytes);
    // WebGL2 的 bufferSubData 要求数据长度是 4 的倍数的情况并不存在，
    // 但 WebGPU 侧要求 4 对齐；这里统一补齐，保证两端写入的字节完全一致。
    target.upload(bufferOffset, paddedCopy(view));
  }

  writeTexture(
    destination: TextureCopyView,
    data: ArrayBufferView,
    layout: TexelCopyBufferLayout,
    size: Extent3D,
  ): void {
    const texture = destination.texture as WebGL2Texture;
    const info = glFormat(texture.format);
    assertUploadDataType(texture.format, data);

    const origin = resolveOrigin(destination.origin);
    const bytesPerRow = layout.bytesPerRow ?? size.width * info.bytesPerPixel;
    const gl = this.gl;

    gl.bindTexture(texture.target, texture.native);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (bytesPerRow !== size.width * info.bytesPerPixel) {
      gl.pixelStorei(gl.UNPACK_ROW_LENGTH, bytesPerRow / info.bytesPerPixel);
    }
    const source = new Uint8Array(data.buffer, data.byteOffset + layout.offset, data.byteLength - layout.offset);

    if (texture.target === gl.TEXTURE_3D || texture.target === gl.TEXTURE_2D_ARRAY) {
      gl.texSubImage3D(
        texture.target,
        destination.mipLevel ?? 0,
        origin.x,
        origin.y,
        origin.z,
        size.width,
        size.height,
        size.depthOrArrayLayers,
        info.format,
        info.type,
        source,
      );
    } else {
      gl.texSubImage2D(
        texture.target,
        destination.mipLevel ?? 0,
        origin.x,
        origin.y,
        size.width,
        size.height,
        info.format,
        info.type,
        source,
      );
    }

    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    this.state.invalidate();
  }

  copyExternalImageToTexture(
    source: ExternalImageSource,
    destination: TextureCopyView,
    copySize: Extent3D,
    flipY = false,
  ): void {
    const texture = destination.texture as WebGL2Texture;
    const info = glFormat(texture.format);
    const gl = this.gl;
    const origin = resolveOrigin(destination.origin);

    gl.bindTexture(texture.target, texture.native);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    // WebGPU 的 copyExternalImageToTexture 默认把图像按「左上角为原点」处理，
    // 而 GL 的纹理坐标原点在左下角，所以默认需要翻转；flipY 显式传入时以其为准。
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
    try {
      if (texture.target === gl.TEXTURE_3D || texture.target === gl.TEXTURE_2D_ARRAY) {
        gl.texSubImage3D(
          texture.target,
          destination.mipLevel ?? 0,
          origin.x,
          origin.y,
          origin.z,
          copySize.width,
          copySize.height,
          copySize.depthOrArrayLayers,
          info.format,
          info.type,
          source as TexImageSource,
        );
      } else {
        gl.texSubImage2D(
          texture.target,
          destination.mipLevel ?? 0,
          origin.x,
          origin.y,
          copySize.width,
          copySize.height,
          info.format,
          info.type,
          source as TexImageSource,
        );
      }
    } finally {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    }
    this.state.invalidate();
  }

  copyBufferToBuffer(
    source: Buffer,
    sourceOffset: number,
    destination: Buffer,
    destinationOffset: number,
    size: number,
  ): void {
    const gl = this.gl;
    const sourceBuffer = source as WebGL2Buffer;
    const destinationBuffer = destination as WebGL2Buffer;
    const bytes = new Uint8Array(size);

    if (sourceBuffer.isIndexBuffer || destinationBuffer.isIndexBuffer) {
      // 索引缓冲被永久固定在 ELEMENT_ARRAY_BUFFER 上（见 WebGL2Buffer），而两个 buffer
      // 不能同时绑在同一个目标上，所以这里各自走自己的目标、用 CPU 中转一次。
      sourceBuffer.download(sourceOffset, bytes);
      destinationBuffer.upload(destinationOffset, bytes);
      return;
    }

    this.state.bindCopyReadBuffer(sourceBuffer.native);
    gl.getBufferSubData(gl.COPY_READ_BUFFER, sourceOffset, bytes);
    this.state.bindCopyWriteBuffer(destinationBuffer.native);
    gl.bufferSubData(gl.COPY_WRITE_BUFFER, destinationOffset, bytes);
  }

  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    const info = glFormat((destination.texture as WebGL2Texture).format);
    const bytesPerRow = source.bytesPerRow ?? copySize.width * info.bytesPerPixel;
    const bytes = new Uint8Array(bytesPerRow * copySize.height);
    // 走 buffer 自己的目标读回：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
    (source.buffer as WebGL2Buffer).download(source.offset ?? 0, bytes);
    this.writeTexture(destination, bytes, { offset: 0, bytesPerRow }, copySize);
  }

  submit(commandBuffers: readonly CommandBuffer[]): void {
    // WebGL2 的命令在录制时就已经执行，这里只做记账。
    this.submittedCount += commandBuffers.length;
    // GL 没有「提交」这一步，但 flush 可以让驱动尽早开始工作，减少下一帧的等待。
    if (commandBuffers.length > 0) this.gl.flush();
  }

  async onSubmittedWorkDone(): Promise<void> {
    // 用一次同步查询把 GPU 管线排空：`getError` 会强制与驱动同步。
    // 这是 WebGL2 里最接近「等待 GPU 完成」的做法。
    await this.pending;
    this.gl.finish();
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
