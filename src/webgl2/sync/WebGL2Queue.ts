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
import { paddedCopy, typedArrayElementSize } from '../../utils/typedArray.js';
import { assertUploadDataType, glFormat } from '../utils/glFormatMap.js';
import { resolveUploadLayout, uploadTextureData } from '../utils/copyLayout.js';
import type { Queue, ExternalImageSource } from '../../core/sync/Queue.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';

/** 上传时用来「搬家」的暂存区大小：只在视图起点不满足元素对齐时才用得上。 */
const UPLOAD_SCRATCH_BYTES = 64 * 1024;

export class WebGL2Queue implements Queue {
  readonly label = nextId('queue');

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private submittedCount = 0;
  private pending: Promise<void> = Promise.resolve();
  /**
   * 零拷贝路径的兜底暂存区（惰性分配）。
   *
   * 只在「传给 `writeTexture` 的视图起点不在元素边界上」时才需要搬一次内存
   * （例如 `Uint8Array` 的 `subarray(2, ...)` 交给 `rgba32float`）。正常情况下
   * `ArrayBufferView` → `TypedArray` 是零拷贝重解释，这块内存直到用上之前都不分配。
   */
  private scratch: ArrayBuffer | null = null;

  constructor(gl: WebGL2RenderingContext, state: GlStateCache) {
    this.gl = gl;
    this.state = state;
  }

  /** 已提交的 command buffer 数量（用于测试与统计）。 */
  get submitted(): number {
    return this.submittedCount;
  }

  /**
   * 把主机端数据写进 buffer。
   *
   * ## `#15`：元素对齐校验与 WebGPU 对齐（改前 WebGL2 没有）
   *
   * core 的契约里 `dataOffset` / `size` 是**字节**，而 WebGPU 原生接口在 `data` 是 TypedArray 时
   * 按**元素**计，所以 `WebGPUQueue` 必须要求两者都是元素大小的倍数（否则换算出来的元素数
   * 不是整数，原生实现会直接抛）。改前 WebGL2 不检查这一条：`new Uint8Array(data.buffer,
   * byteOffset + 2)` 这种「起点落在元素中间」的视图照样能上传 —— 于是**同一段代码在 WebGL2 上
   * 通、在 WebGPU 上抛**，而在 WebGL2 上拿到的是一份半错位的重解释数据。
   *
   * 现在这里先做与 `WebGPUQueue.writeBuffer` **逐字相同**的检查（注意：报告的是**字节**数，
   * 因为 core 契约里这两个参数就是字节），再走本后端的补齐上传。
   */
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
    /*
     * `bufferOffset` 必须是 4 的倍数（`#15`，与 `WebGPUQueue` 一致）。
     *
     * 这一条比「元素对齐」更隐蔽：`paddedCopy()` 会把数据补齐到 4 的倍数，
     * 于是 `writeBuffer(buf, 2, new Float32Array(1))` 在本后端会**成功**，
     * 但真的写进 buffer 的是 `[offset 2, offset 6)`（多写了两字节的 0），
     * 而 WebGPU 侧会因为 `bufferOffset % 4 !== 0` 直接抛错 ——
     * 两端「能不能跑」与「写了几个字节」都不一样。
     */
    if (bufferOffset % 4 !== 0) {
      throw new ValidationError(
        `[gpu-device-api] Queue.writeBuffer: bufferOffset (${bufferOffset}) must be a multiple of 4.`,
      );
    }
    // DataView 没有「元素」概念，按字节计；TypedArray 用它的 BYTES_PER_ELEMENT。
    const bytesPerElement = typedArrayElementSize(data);
    if (dataOffset % bytesPerElement !== 0 || bytes % bytesPerElement !== 0) {
      throw new ValidationError(
        `[gpu-device-api] Queue.writeBuffer: dataOffset (${dataOffset}) and size (${bytes}) are measured in ` +
          `bytes, so both must be multiples of the element size (${bytesPerElement}) of the given ${data.constructor.name}.`,
      );
    }
    const view = new Uint8Array(data.buffer, data.byteOffset + dataOffset, bytes);
    // WebGL2 的 bufferSubData 不要求数据长度是 4 的倍数，但 WebGPU 侧要求 4 对齐；
    // 这里统一补齐，保证两端写入的字节完全一致（补齐的那几个字节写 0，不会读旧内容）。
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
    assertQueueAspectSupported(destination, texture);

    const origin = resolveOrigin(destination.origin);
    const gl = this.gl;
    const offset = layout.offset ?? 0;
    /*
     * 布局要在这里就算出来（而不是先 bindTexture 再校验）：校验失败时不能留下
     * 「已经绑好纹理 + 已经改过 pixelStorei」的半截状态。
     *
     * `availableBytes` 传的是**本次拷贝可用的字节数**（从 offset 起算），
     * 所以数据不足会在下发 GL 之前就报错 —— 而不是让驱动静默地记一条 INVALID_OPERATION。
     */
    const resolved = resolveUploadLayout(
      layout,
      size,
      info,
      'writeTexture',
      texture.format,
      texture.label,
      Math.max(0, data.byteLength - offset),
    );

    /*
     * 整段数据从 `offset` 起交给上传器；上传器只按布局里的偏移去取每一行，
     * 所以这里先把视图起点移到 `offset` 上（仍然零拷贝）。
     */
    const bytes = new Uint8Array(data.buffer, data.byteOffset + offset, data.byteLength - offset);
    uploadTextureData(
      gl,
      texture.target,
      texture.native,
      destination.mipLevel ?? 0,
      origin,
      size,
      info,
      texture.format,
      bytes,
      resolved,
      () => this.uploadScratch(),
    );
    // 这里只绕过缓存直接改了一个纹理单元的绑定，所以只作废纹理单元缓存；
    // 用 invalidate() 会顺带丢掉 program/blend/depth/VAO/UBO，下一次 draw 得全部重下。
    this.state.invalidateTextureUnits();
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
    // 只改了当前纹理单元的绑定（见 writeTexture 里的说明）。
    this.state.invalidateTextureUnits();
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

  /**
   * `copyBufferToTexture`：先按**完整布局**（含 `rowsPerImage`）把源 buffer 读出来，
   * 再交给 {@link writeTexture} 上传。
   *
   * 为什么读这么多：`texSubImage3D` 一次要吃下整叠 image，层与层之间有 `rowsPerImage`
   * 这么大的间隔 —— 「每层各读一次、各上传一次」也可以，但那样每次 `texSubImage3D` 都得
   * 带上 `UNPACK_SKIP_IMAGES` 之类的状态，比一次读完更容易出错，而且 GPU 侧调用次数翻倍。
   */
  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void {
    const texture = destination.texture as WebGL2Texture;
    const info = glFormat(texture.format);
    const buffer = source.buffer as WebGL2Buffer;
    const offset = source.offset ?? 0;
    // 只读「本次拷贝需要的那一段」：`requiredBytes` 由同一个函数给出（见 copyLayout.ts 的说明）。
    const resolved = resolveUploadLayout(
      source,
      copySize,
      info,
      'copyBufferToTexture',
      texture.format,
      texture.label,
    );
    if (offset + resolved.requiredBytes > buffer.size) {
      throw new ValidationError(
        `[gpu-device-api] copyBufferToTexture: the source range [${offset}, ${offset + resolved.requiredBytes}) ` +
          `exceeds buffer「${buffer.label}」's ${buffer.size} bytes (${copySize.width}x${copySize.height}` +
          `x${copySize.depthOrArrayLayers}, bytesPerRow=${resolved.bytesPerRow}, ` +
          `rowsPerImage=${resolved.rowsPerImage}).`,
      );
    }
    const bytes = new Uint8Array(resolved.requiredBytes);
    buffer.download(offset, bytes);
    this.writeTexture(destination, bytes, { offset: 0, bytesPerRow: resolved.bytesPerRow, rowsPerImage: resolved.rowsPerImage }, copySize);
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

  /**
   * 取（必要时分配）零拷贝路径的兜底暂存区。
   *
   * 惰性分配的理由：绝大多数上传的视图起点本来就是元素对齐的（`new Uint8Array(...)`、
   * `TypedArray` 的 `subarray` 也只按元素切），那条路径完全不需要这块内存。
   */
  private uploadScratch(): ArrayBuffer {
    this.scratch ??= new ArrayBuffer(UPLOAD_SCRATCH_BYTES);
    return this.scratch;
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

/**
 * `writeTexture` / `copyBufferToTexture` 的 `destination.aspect` 校验。
 *
 * 上传路径写的是「整个纹素」，GL 的 `texSubImage*` 也没有「只写深度那一面」的入口
 * （深度写进 `DEPTH_COMPONENT` 面、模板写进 `STENCIL` 面，一次调用只能表达一个）。
 * 修复前这个字段从不被读取，所以传什么都「成功」。
 */
function assertQueueAspectSupported(destination: TextureCopyView, texture: WebGL2Texture): void {
  const aspect = destination.aspect ?? 'all';
  if (aspect === 'all') return;
  throw new ValidationError(
    `[gpu-device-api] writeTexture: destination.aspect "${aspect}" is not supported by the WebGL2 ` +
      `backend (texture "${texture.label}", format "${texture.format}"). GL's texSubImage* entry ` +
      'points write whole texels, and a depth-stencil texture has a single combined attachment — ' +
      'there is no way to address one aspect on its own. Omit the aspect (or pass "all"), or keep ' +
      'depth and stencil in separate textures.',
  );
}
