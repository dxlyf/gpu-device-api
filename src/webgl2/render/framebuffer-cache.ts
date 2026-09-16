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
 *
 * ## 下标语义：**数组下标就是片元 output location**（`#11`）
 *
 * `RenderPassDescriptor.colorAttachments` 允许出现 `null`，而 `null` **占位置**：它表示
 * 「这个 location 的片元输出被丢弃」，与 WebGPU 的
 * `GPURenderPassDescriptor.colorAttachments` 完全同形。所以这里的三件事必须一一对应：
 *
 * 1. 附件挂到 `COLOR_ATTACHMENT0 + 原始下标`（**不压缩**）；
 * 2. `drawBuffers[i]` 给出 `location i` 落到哪个附着点，空位给 `NONE`；
 * 3. 清屏用原始下标（见 `WebGL2RenderPassEncoder.clearRawAttachments`）。
 *
 * 改前第 1、2 项用的是「非空附件的压缩序号」而第 3 项用的是原始下标，于是
 * `[null, view]` 会把 `view` 挂在 attachment 0、却去清 attachment 1，
 * 而 `location 0` 的片元输出又写进 `view` —— 三处互相矛盾且**没有任何报错**。
 *
 * ## 为什么「建立时下发一次 drawBuffers」在复用（LRU 命中）时也是安全的
 *
 * `drawBuffers` 是 **framebuffer 对象自身的状态**（不像 `BLEND` 那样是上下文状态），
 * 而缓存里的每个 framebuffer 由本类独占、键里含**完整的位置信息**（空位记 `-`），
 * 所以同一组附件组合只会有一个 framebuffer、它的 `drawBuffers` 建立后不会被别人改写
 * （`WebGL2RenderTarget` 只对自己的 FBO 调 `drawBuffers`）。命中缓存时不重复下发不会跑偏。
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
  /**
   * `MAX_DRAW_BUFFERS` 的惰性查询结果。
   *
   * `drawBuffers` 的参数个数不能超过它（GLES 3.0 的下限是 4），而本层现在按**逐位置**下发，
   * 所以附件槽数一旦超限就是「必然无效」的组合 —— 明确报错好过让 GL 报 `INVALID_VALUE`。
   * 查询一次就记住（与 `GlStateCache.uniformBufferOffsetAlignment()` 同样的做法）。
   */
  private maxDrawBuffersValue: number | null = null;

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

  /**
   * `MAX_DRAW_BUFFERS`：查询失败时退回 GLES 3.0 的下限 4。
   *
   * 退回而不是「放行」：一个实现没有暴露这个常量时，4 是**规范保证**的最小可用值，
   * 用 4 做上限不会误拒合法输入（超过 4 的组合在那种实现上本来就不保证成立）。
   */
  private maxDrawBuffers(): number {
    const cached = this.maxDrawBuffersValue;
    if (cached !== null) return cached;
    const queried = Number(this.gl.getParameter(this.gl.MAX_DRAW_BUFFERS));
    const limit = Number.isFinite(queried) && queried > 0 ? queried : 4;
    this.maxDrawBuffersValue = limit;
    return limit;
  }

  /** 取得（必要时创建）与这组附件匹配的 framebuffer。 */
  acquire(descriptor: RenderPassDescriptor): WebGLFramebuffer {
    const key = signatureOf(descriptor);
    const cached = this.framebuffers.get(key);
    if (cached) return cached;

    // 槽位数（含空位）必须在 `MAX_DRAW_BUFFERS` 之内：`drawBuffers` 的**下标即 location**，
    // 空位也要占一项，所以不能只数非空附件。
    const slots = descriptor.colorAttachments.length;
    const limit = this.maxDrawBuffers();
    if (slots > limit) {
      throw new ValidationError(
        `[gpu-device-api] 这次渲染通道有 ${slots} 个颜色附件槽位（含 null 空位），超过了本设备的 ` +
          `MAX_DRAW_BUFFERS（${limit}）。WebGL2 的 drawBuffers 下标就是片元 output location，` +
          '空位也必须占一项，所以超限的组合无法表达。请减少颜色附件数量。',
      );
    }

    const gl = this.gl;
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new ValidationError('[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。');
    }

    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const referenced: WebGL2Texture[] = [];
    /**
     * 逐位置的 draw buffer 列表：`drawBuffers[i]` 就是片元 output `location = i` 的去处，
     * 空位是 `NONE`（丢弃输出）。长度恒等于 `descriptor.colorAttachments.length`。
     */
    const drawBuffers: number[] = [];
    for (let index = 0; index < slots; index += 1) {
      const attachment = descriptor.colorAttachments[index];
      if (!attachment) {
        // 空位**占一项**（`NONE`）：跳过它会让后面所有附件整体前移一位。
        drawBuffers.push(gl.NONE);
        continue;
      }
      const view = attachment.view as WebGL2TextureView;
      const target = view.target;
      referenced.push(view.texture);
      if (target === gl.TEXTURE_2D) {
        // 挂 view 自己的 baseMipLevel，而不是固定 0：键里已经把 mip 区分开了，
        // 这里如果不跟着挂，指定了别的 mip 的 view 会悄悄读到错误的 mip 层。
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + index,
          target,
          view.glTexture,
          view.descriptor.baseMipLevel,
        );
      } else {
        gl.framebufferTextureLayer(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + index,
          view.glTexture,
          view.descriptor.baseMipLevel,
          view.descriptor.baseArrayLayer,
        );
      }
      drawBuffers.push(gl.COLOR_ATTACHMENT0 + index);
    }
    // 空数组（纯深度通道）时不下发：新建的 framebuffer 的 DRAW_BUFFER0 初值就是
    // `COLOR_ATTACHMENT0`，而它没有附件，效果与 `NONE` 相同。
    if (drawBuffers.length > 0) gl.drawBuffers(drawBuffers);

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
