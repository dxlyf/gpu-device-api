/**
 * WebGL2 的 command encoder。
 *
 * WebGL2 是立即模式：`beginRenderPass()` 会立刻绑定 framebuffer 并清屏，绘制也在录制时下发。
 * 所以这里的 `finish()` 只是一个**记账动作**，返回的 command buffer 里记录了本次编码期间
 * 下发过多少次绘制，供 `Queue.submit()` 校验与统计使用 —— 而不是一份待执行的指令列表。
 *
 * 复制类命令同样是立即生效的（`copyBufferSubData` / `blitFramebuffer`），
 * 这一点与 WebGPU 的「录制后统一提交」不同，已在 `core/sync/Queue.ts` 里写明差异。
 *
 * 生命周期上它与 WebGPU 的 encoder **没有同形缺陷**：这里的 encoder 不持有任何 GL 资源
 * （命令已经下发完了），因此 `WebGL2Device.createCommandEncoder()` 从不把它登记进设备的
 * 资源追踪集合，也没有 `dispose()`；`finish()` 只是把记账对象置为终态。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import { glFormat } from '../utils/glFormatMap.js';
import type {
  BufferCopyView,
  CommandBuffer,
  CommandEncoder,
  CommandEncoderDescriptor,
  TextureCopyView,
} from '../../core/render/CommandEncoder.js';
import type { QuerySet } from '../../core/resources/QuerySet.js';
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

    /*
     * 索引缓冲（`ELEMENT_ARRAY_BUFFER`）**不能**当 `copyBufferSubData` 的源或目标：
     * WebGL2 里一个 buffer 的绑定目标在第一次绑定时就永久确定（见 `WebGL2Buffer` 的类注释），
     * 而 `ELEMENT_ARRAY_BUFFER` 同时是 **VAO 状态**的一部分 —— 让拷贝去动它就必须在默认 VAO 上
     * 重新绑定，等于改掉当前 VAO 记录的索引缓冲，之后的 draw 会拿错误的索引去解引用顶点。
     * 所以这一路保留 CPU 中转（`download` / `upload` 各自走 buffer 自己的目标）。
     */
    if (sourceBuffer.isIndexBuffer || destinationBuffer.isIndexBuffer) {
      const bytes = new Uint8Array(size);
      sourceBuffer.download(sourceOffset, bytes);
      destinationBuffer.upload(destinationOffset, bytes);
      return;
    }

    /*
     * 区间重叠时也回退 CPU：`gl.copyBufferSubData` 要求两个区间**不重叠**（重叠是 INVALID_VALUE），
     * 而 CPU 中转天然是「先把整段读出来、再写回去」，与 memmove 一致。WebGPU 的
     * `copyBufferToBuffer` 允许重叠区间（结果由实现决定），这里选保守的那条路，
     * 保证两个后端的可观察行为都不变。
     */
    if (
      sourceBuffer === destinationBuffer &&
      sourceOffset < destinationOffset + size &&
      destinationOffset < sourceOffset + size
    ) {
      const bytes = new Uint8Array(size);
      sourceBuffer.download(sourceOffset, bytes);
      destinationBuffer.upload(destinationOffset, bytes);
      return;
    }

    /*
     * WebGL2 **有** `copyBufferSubData`（原生探针实测 `typeof gl.copyBufferSubData === 'function'`，
     * 见 `.tmp-probe/gl-probe.ts`）：让这段拷贝留在 GPU 侧，不再绕一圈 CPU 内存。
     * 这里原先写着「WebGL2 没有 copyBufferSubData」，那句话是错的。
     *
     * 两个绑定槽（`COPY_READ_BUFFER` / `COPY_WRITE_BUFFER`）复用 `GlStateCache` 的记录。
     * **先绑写槽、再绑读槽**：非索引 buffer 的绑定目标被永久固定在 `COPY_WRITE_BUFFER` 上
     * （见 `WebGL2Buffer`），而这个顺序可以保证拷贝结束后写槽留下的仍然是**目标缓冲** ——
     * 这正是 `WebGL2Buffer.upload()` 依赖的那条不变量（它直接往 `COPY_WRITE_BUFFER` 上写）。
     */
    this.state.bindCopyWriteBuffer(destinationBuffer.native);
    this.state.bindCopyReadBuffer(sourceBuffer.native);
    this.gl.copyBufferSubData(
      this.gl.COPY_READ_BUFFER,
      this.gl.COPY_WRITE_BUFFER,
      sourceOffset,
      destinationOffset,
      size,
    );
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

    /*
     * `bytesPerRow` 是**请求的行距**（WebGPU 语义：相邻两行第一个字节之间的距离），
     * 而 `gl.readPixels` 永远按紧凑行距写入（下面还把 PACK_ALIGNMENT 设成 1）。
     * 所以这里必须先紧凑读回，再在 JS 里按请求行距重排。
     *
     * 之前的实现只用 `bytesPerRow` 给 Uint8Array 定大小、然后直接 readPixels，
     * 于是任何按 WebGPU 规范传 256 对齐行距的调用方（例如 width=96 传 512）
     * 都会读到整体错位的数据：读回结果被当成「紧凑 384 字节一行」写进一块按 512 行距解释的缓冲，
     * 第 1 行之后全部对不上，缓冲后半段只剩 0。
     *
     * `rowsPerImage` 不参与：WebGL2 的 readPixels 只支持二维读回，没有「一个 image 几行」的概念。
     */
    const tightRowBytes = copySize.width * info.bytesPerPixel;
    const bytesPerRow = destination.bytesPerRow ?? tightRowBytes;
    if (!Number.isInteger(bytesPerRow) || bytesPerRow < tightRowBytes) {
      throw new ValidationError(
        `[gpu-device-api] copyTextureToBuffer: bytesPerRow must be an integer >= ${tightRowBytes} ` +
          `(one row of ${copySize.width} "${texture.format}" pixels), got ${String(bytesPerRow)}.`,
      );
    }
    const data = new Uint8Array(bytesPerRow * copySize.height);
    // 紧凑读回的暂存区：行距就是 tightRowBytes，与请求的行距无关。
    const tight = new Uint8Array(tightRowBytes * copySize.height);

    /*
     * 用 framebuffer 把纹理当附件读回：WebGL2 没有直接的 getTexImage。
     *
     * framebuffer 是**复用**的（`GlStateCache.readbackFramebuffer`）：读回只需要一个临时挂附件的
     * 容器，内容每次都会被重设，所以每次 `createFramebuffer` + `deleteFramebuffer` 是白付的
     * 对象 churn。挂新附件前会先把上一个附件摘掉（同一个纹理挂在两个附着点上会让 framebuffer 不完整）。
     */
    const previous = this.state.currentFramebuffer();
    const attachment = info.depth ? gl.DEPTH_ATTACHMENT : gl.COLOR_ATTACHMENT0;
    this.state.attachReadbackTexture(texture.native, attachment, source.mipLevel ?? 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      // 读回失败也要把绑定还原：这个 framebuffer 是复用对象，不能留在「已绑定」的状态上。
      this.state.bindFramebuffer(previous);
      throw new ValidationError(
        `[gpu-device-api] 无法把纹理「${texture.label}」作为附件读回（framebuffer 不完整，0x${status.toString(16)}）。` +
          '请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。',
      );
    }

    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    const { x: readX, y: readY } = resolveOrigin(source.origin);
    gl.readPixels(readX, readY, copySize.width, copySize.height, info.format, info.type, tight);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
    this.state.bindFramebuffer(previous);
    /*
     * 这条读回路径临时切过 framebuffer，所以只作废 **framebuffer 绑定**这一项记录。
     *
     * 原来的写法是整体 `invalidate()`：那会把 program / blend / depth / cull / VAO / 纹理单元
     * 一起丢掉，于是**紧随其后的那一次 draw 要把固定功能状态全部重下发一遍** ——
     * 而读回并没有改动它们中的任何一个，这笔开销完全是白付的。
     */
    this.state.invalidateFramebufferBinding();

    // 按请求的行距重排。行距等于紧凑行距时就是一次整体拷贝，不需要逐行。
    // 填充字节保持 0（`new Uint8Array` 的初值）：WebGPU 不写这些字节，但给出确定的值
    // 比留下上一次读回的残留更好排查，也与本方法修复前的行为一致。
    if (bytesPerRow === tightRowBytes) {
      data.set(tight);
    } else {
      for (let row = 0; row < copySize.height; row += 1) {
        data.set(
          tight.subarray(row * tightRowBytes, (row + 1) * tightRowBytes),
          row * bytesPerRow,
        );
      }
    }

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
    // 走 buffer 自己的目标：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
    // 零数据来自**共享的分块暂存**：小清零（≤ 4KB，绝大多数用法）连分配都省掉，
    // 大清零按块复用同一块内存，不再一次分配 `length` 字节。
    for (const chunk of zeroChunks(length)) {
      target.upload(offset, chunk);
      offset += chunk.length;
    }
  }

  /**
   * WebGL2 没有对应能力：GL 的查询结果不能写进 buffer，只能 `getQueryParameter()` 读回。
   * 调用它明确报错，并指出替代方案（`Device.readQuerySet()`）。
   */
  resolveQuerySet(
    querySet: QuerySet,
    firstQuery: number,
    queryCount: number,
    destination: { readonly size: number },
    destinationOffset: number,
  ): void {
    this.assertOpen('resolveQuerySet');
    void querySet;
    void firstQuery;
    void queryCount;
    void destination;
    void destinationOffset;
    throw new ValidationError(
      '[gpu-device-api] WebGL2 has no resolveQuerySet(): GL query results cannot be copied into a buffer, ' +
        'they can only be read back one by one with gl.getQueryParameter(). Use Device.readQuerySet() ' +
        'instead — it polls QUERY_RESULT_AVAILABLE and returns the same QueryResult shape as WebGPU.',
    );
  }

  /**
   * WebGL2 没有「单个时刻的时间戳」：GL 的时间查询是 `beginQuery → endQuery` 的**区间**测量。
   * 请改用 `RenderPassDescriptor.timestampWrites`（后端会用 beginQuery/endQuery 包住整个通道）。
   */
  writeTimestamp(querySet: QuerySet, queryIndex: number): void {
    this.assertOpen('writeTimestamp');
    void querySet;
    void queryIndex;
    throw new ValidationError(
      '[gpu-device-api] WebGL2 has no CommandEncoder.writeTimestamp(): GL timer queries measure an ' +
        'interval (beginQuery → endQuery), not a single instant. Use RenderPassDescriptor.timestampWrites ' +
        'with an EXT_disjoint_timer_query_webgl2 query set instead.',
    );
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

  /**
   * 结束记账并返回 command buffer。
   *
   * 不需要（也没有）从设备追踪集合里摘自己：本类从不被登记（见类注释），
   * 与 WebGPU 后端在 `finish()` 里 `untrack()` 的处理对应的是同一个生命周期终点 ——
   * finish 之后本对象的其它方法都会经 `assertOpen()` 抛错。
   */
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

/** 共享零暂存块的块大小（字节）。必须是 4 的倍数，见 {@link zeroChunks}。 */
const ZERO_CHUNK_BYTES = 4096;

/**
 * 共享的零暂存块。
 *
 * 只在这里读取、从不写入，所以「共享」不会让它变成可被外部改动的可变状态：
 * 它的消费者是 `gl.bufferSubData`（只读源）。即便同一块内存被并发/重入地用于多次 `clearBuffer`，
 * 每次调用读到的都是同样的全零字节，结果与「每次新建一块」完全相同。
 */
const ZERO_CHUNK = new Uint8Array(ZERO_CHUNK_BYTES);

/**
 * 把长度为 `length` 的区间切成若干个「全零块」，块之间不重叠。
 *
 * 为什么分块：`clearBuffer` 原先每次调用都 `new Uint8Array(length)` —— 分配 + 清零，
 * 对大区间（例如每帧清 16MB 的 uniform arena）是每帧一次的实打实开销。分块之后
 * ≤ 4KB 的小清零**连分配都没有**，大清零也只是一次次复用同一块内存。
 *
 * 每块长度都必须是 4 的倍数（且块起点随之 4 对齐）：`WebGL2Buffer` 要求 buffer 大小是 4 的
 * 倍数，而 `bufferSubData` 的偏移是任意的，所以这里按 4 对齐切分即可覆盖任意合法的
 * `(offset, length)` 组合（两者都是 4 的倍数）。
 */
function* zeroChunks(length: number): Generator<Uint8Array> {
  if (length <= 0) {
    // 与 `new Uint8Array(0)` 的上传行为一致：不产生任何字节。
    return;
  }
  let remaining = length;
  while (remaining > 0) {
    const take = Math.min(remaining, ZERO_CHUNK_BYTES);
    yield take === ZERO_CHUNK_BYTES ? ZERO_CHUNK : ZERO_CHUNK.subarray(0, take);
    remaining -= take;
  }
}
