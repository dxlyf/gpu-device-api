/**
 * WebGL2 的渲染通道编码器。
 *
 * 这是「WebGPU 录制式 API」与「GL 立即模式」之间的桥。渲染通道在 WebGL2 上是**边录制边执行**的：
 * 每次 `draw()` 立刻下发 GL 调用。对绝大多数绘制流程来说两者结果一致，只有一处已知差异 ——
 * `Queue.writeBuffer` 的生效时机（详见 `core/sync/Queue.ts` 的文档）。
 *
 * 每个 draw 的固定流程：
 * 1. 解析管线在当前渲染目标形态下的状态（按变体缓存）；
 * 2. `useProgram` + 应用固定功能状态；
 * 3. 取得/创建 VAO（键里含顶点缓冲与索引缓冲，命中就跳过全部属性设置）；
 * 4. 按绑定计划把 bind group 落到 uniform block binding 点与纹理单元上；
 * 5. 下发 `drawArraysInstanced` / `drawElementsInstanced`。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { indexFormatByteSize } from '../../core/enums/IndexFormat.js';
import { BindingType } from '../../core/enums/BindingType.js';
import { GL_INDEX_TYPES, resolveClearColor } from '../utils/glEnumMap.js';
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { Color } from '../../core/render/RenderTarget.js';
import type {
  DrawDescriptor,
  DrawIndexedDescriptor,
  DrawIndirectDescriptor,
} from '../../core/render/DrawCommands.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { RenderPassDescriptor, RenderPassEncoder } from '../../core/render/RenderPassEncoder.js';
import type { BindGroupEntry, BufferBinding, SamplerBinding, TextureBinding } from '../../core/binding/BindingTypes.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2BindGroup } from '../binding/WebGL2BindGroup.js';
import type { WebGLBindingPlan } from '../binding/TextureUnitAllocator.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGL2Sampler } from '../resources/WebGL2Sampler.js';
import type { WebGL2TextureView } from '../resources/WebGL2TextureView.js';
import type { WebGL2RenderPipeline, VertexBufferBinding } from '../pipeline/WebGL2RenderPipeline.js';
import type { WebGL2RenderTarget } from './WebGL2RenderTarget.js';
import { isDefaultFramebufferView } from '../WebGL2CanvasContext.js';
import type { FramebufferCache } from './framebuffer-cache.js';

export interface WebGL2RenderPassOptions {
  gl: WebGL2RenderingContext;
  state: GlStateCache;
  framebuffers: FramebufferCache;
  /** 默认帧缓冲的尺寸（未指定 target 时使用）。 */
  getDefaultSize: () => { width: number; height: number };
  /** 每完成一次绘制回调一次，用于统计。 */
  onDraw?: () => void;
}

interface IndexBufferBinding {
  buffer: WebGL2Buffer;
  format: IndexFormat;
  offset: number;
  size: number;
}

export class WebGL2RenderPassEncoder implements RenderPassEncoder {
  readonly label: string;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly options: WebGL2RenderPassOptions;
  private readonly colorFormats: readonly TextureFormat[];
  private readonly depthFormat: TextureFormat | null;

  private pipeline: WebGL2RenderPipeline | null = null;
  private readonly bindGroups = new Map<number, WebGL2BindGroup | null>();
  private readonly dynamicOffsets = new Map<number, readonly number[]>();
  private readonly vertexBuffers: (VertexBufferBinding | null)[] = [];
  private indexBuffer: IndexBufferBinding | null = null;
  private stencilReference = 0;
  private _ended = false;

  constructor(descriptor: RenderPassDescriptor, options: WebGL2RenderPassOptions) {
    this.label = descriptor.label ?? 'renderPass';
    this.gl = options.gl;
    this.state = options.state;
    this.options = options;

    const target = descriptor.target as WebGL2RenderTarget | undefined;

    if (target) {
      if (descriptor.colorAttachments && descriptor.colorAttachments.length > 0) {
        throw new ValidationError(
          `[gpu-device-api] 渲染通道「${this.label}」同时给了 target 与 colorAttachments。` +
            '请只保留一种写法：用 target 表示「画进这个渲染目标」，或用 colorAttachments 明确指定附件。',
        );
      }
      this.colorFormats = target.colorFormats;
      this.depthFormat = target.depthFormat;
      target.bind({
        clearColor: descriptor.clearValue,
        clearDepth: descriptor.depthClearValue,
        clearStencil: descriptor.depthClearValue === undefined ? undefined : 0,
        loadOp: descriptor.colorAttachments?.[0]?.loadOp,
        depthLoadOp: descriptor.depthStencilAttachment?.depthLoadOp,
      });
      this.state.invalidate();
      this.state.setViewport(0, 0, target.width, target.height);
    } else {
      const attachments = descriptor.colorAttachments.filter((attachment) => attachment !== null);
      if (attachments.length === 0 && !descriptor.depthStencilAttachment) {
        throw new ValidationError(
          `[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`,
        );
      }
      this.colorFormats = attachments.map((attachment) => attachment.view.texture.format);
      this.depthFormat = descriptor.depthStencilAttachment?.view.texture.format ?? null;

      const usesDefaultFramebuffer =
        attachments.some((attachment) => isDefaultFramebufferView(attachment.view)) ||
        (descriptor.depthStencilAttachment !== undefined &&
          descriptor.depthStencilAttachment !== null &&
          isDefaultFramebufferView(descriptor.depthStencilAttachment.view));

      if (usesDefaultFramebuffer) {
        this.beginDefaultFramebufferPass(descriptor);
      } else {
        const framebuffer = options.framebuffers.acquire(descriptor);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.state.invalidate();

        const first = attachments[0]!;
        const width = first.view.texture.width;
        const height = first.view.texture.height;
        this.clearRawAttachments(descriptor, framebuffer);
        this.gl.viewport(0, 0, width, height);
        this.state.setViewport(0, 0, width, height);
      }
    }
  }

  get ended(): boolean {
    return this._ended;
  }

  setPipeline(pipeline: WebGL2RenderPipeline): void {
    this.assertOpen('setPipeline');
    this.pipeline = pipeline;
    pipeline.applyState(pipeline.resolveVariant(this.variantRequest()), this.stencilReference);
  }

  setBindGroup(index: number, bindGroup: WebGL2BindGroup | null, dynamicOffsets?: readonly number[]): void {
    this.assertOpen('setBindGroup');
    if (index < 0 || index >= 4) {
      throw new ValidationError(
        `[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${index}。`,
      );
    }
    const pipeline = this.pipeline;
    if (pipeline && pipeline.layout !== 'auto' && bindGroup) {
      const expected = pipeline.layout.bindGroupLayouts[index];
      if (expected && expected !== bindGroup.layout) {
        const same =
          expected.sortedEntries.length === bindGroup.layout.sortedEntries.length &&
          expected.sortedEntries.every((entry, i) => {
            const other = bindGroup.layout.sortedEntries[i]!;
            return entry.binding === other.binding && entry.type === other.type && entry.name === other.name;
          });
        if (!same) {
          throw new ValidationError(
            `[gpu-device-api] setBindGroup(${index}, ...) 传入的 bind group 与管线「${pipeline.label}」` +
              `在该 group 上声明的布局不一致（传入「${bindGroup.layout.label}」，期望「${expected.label}」）。`,
          );
        }
      }
    }
    this.bindGroups.set(index, bindGroup);
    if (dynamicOffsets) this.dynamicOffsets.set(index, [...dynamicOffsets]);
    else this.dynamicOffsets.delete(index);
  }

  setVertexBuffer(slot: number, buffer: WebGL2Buffer | null, offset = 0, size = -1): void {
    this.assertOpen('setVertexBuffer');
    if (slot < 0 || slot >= 16) {
      throw new ValidationError(`[gpu-device-api] setVertexBuffer 的 slot 必须在 0..15 之间，实际是 ${slot}。`);
    }
    this.vertexBuffers[slot] = buffer ? { buffer, offset, size } : null;
  }

  setIndexBuffer(buffer: WebGL2Buffer, format: IndexFormat, offset = 0, size = -1): void {
    this.assertOpen('setIndexBuffer');
    this.indexBuffer = { buffer, format, offset, size };
  }

  setViewport(
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth = 0,
    maxDepth = 1,
  ): void {
    this.assertOpen('setViewport');
    // WebGL2 的 viewport 没有 min/max depth；用深度范围表达时只能通过 depthRange，且只支持 [0,1]。
    if (minDepth !== 0 || maxDepth !== 1) {
      this.gl.depthRange(minDepth, maxDepth);
    }
    this.state.setViewport(x, y, width, height);
  }

  setScissorRect(x: number, y: number, width: number, height: number): void {
    this.assertOpen('setScissorRect');
    this.state.setScissor(true, x, y, width, height);
  }

  setBlendConstant(color: Color): void {
    this.assertOpen('setBlendConstant');
    this.state.setBlendConstant(resolveClearColor(color));
  }

  setStencilReference(reference: number): void {
    this.assertOpen('setStencilReference');
    this.stencilReference = reference;
    if (this.pipeline) {
      this.pipeline.applyState(this.pipeline.resolveVariant(this.variantRequest()), reference);
    }
  }

  draw(descriptor: DrawDescriptor): void {
    this.assertOpen('draw');
    const pipeline = this.requirePipeline('draw');
    this.assertNoUnsupportedInstancing(descriptor.firstInstance ?? 0, 0);
    const instances = descriptor.instanceCount ?? 1;
    this.beginDraw(pipeline, null);
    this.gl.drawArraysInstanced(
      pipeline.mode,
      descriptor.firstVertex ?? 0,
      descriptor.vertexCount,
      instances,
    );
    this.options.onDraw?.();
  }

  drawIndexed(descriptor: DrawIndexedDescriptor): void {
    this.assertOpen('drawIndexed');
    const pipeline = this.requirePipeline('drawIndexed');
    const index = this.indexBuffer;
    if (!index) {
      throw new ValidationError(
        '[gpu-device-api] drawIndexed() 之前必须先调用 setIndexBuffer()。',
      );
    }
    this.assertNoUnsupportedInstancing(descriptor.firstInstance ?? 0, descriptor.baseVertex ?? 0);
    const instances = descriptor.instanceCount ?? 1;
    const byteOffset = index.offset + (descriptor.firstIndex ?? 0) * indexFormatByteSize(index.format);
    this.beginDraw(pipeline, index);
    this.gl.drawElementsInstanced(
      pipeline.mode,
      descriptor.indexCount,
      GL_INDEX_TYPES[index.format],
      byteOffset,
      instances,
    );
    this.options.onDraw?.();
  }

  drawIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset = 0): void {
    this.assertOpen('drawIndirect');
    void indirect;
    void indirectOffset;
    throw new ValidationError(
      '[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 draw() 提交，' +
        '或改用 WebGPU 后端。',
    );
  }

  drawIndexedIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset = 0): void {
    this.assertOpen('drawIndexedIndirect');
    void indirect;
    void indirectOffset;
    throw new ValidationError(
      '[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 drawIndexed() 提交，' +
        '或改用 WebGPU 后端。',
    );
  }

  end(): void {
    if (this._ended) return;
    this._ended = true;
    // GL 没有「结束渲染通道」这一步：默认帧缓冲会在浏览器合成时自动呈现，
    // 离屏目标则已经写在纹理里。这里只需要把状态缓存作废，
    // 因为下一个通道会换 framebuffer / 附件组合。
    this.state.invalidate();
  }

  /* ------------------------------------------------------------------ 内部 ------------------- */

  /** 当前渲染目标的形态信息，用于让管线解析出对应状态。 */
  private variantRequest(): {
    colorFormats: readonly TextureFormat[];
    sampleCount: number;
    depthFormat: TextureFormat | null;
  } {
    return { colorFormats: this.colorFormats, sampleCount: 1, depthFormat: this.depthFormat };
  }

  private requirePipeline(operation: string): WebGL2RenderPipeline {
    if (!this.pipeline) {
      throw new ValidationError(
        `[gpu-device-api] ${operation}() 之前必须先调用 setPipeline()。`,
      );
    }
    return this.pipeline;
  }

  private assertNoUnsupportedInstancing(firstInstance: number, baseVertex: number): void {
    if (firstInstance !== 0) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 不支持 `firstInstance`（缺少 drawArraysInstancedBaseInstance）。' +
          '请把实例数据整体前移，或改用 WebGPU 后端。',
      );
    }
    if (baseVertex !== 0) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 不支持 `baseVertex`（缺少 drawElementsInstancedBaseVertex）。' +
          '请把顶点偏移直接加到索引里，或改用 WebGPU 后端。',
      );
    }
  }

  /** 一个 draw 之前必须完成的全部绑定工作。 */
  private beginDraw(pipeline: WebGL2RenderPipeline, index: IndexBufferBinding | null): void {
    const variant = pipeline.resolveVariant(this.variantRequest());
    pipeline.applyState(variant, this.stencilReference);

    const vertexArray = pipeline.acquireVertexArray(
      variant,
      this.vertexBuffers,
      index ? index.buffer.native : null,
    );
    this.state.bindVertexArray(vertexArray);
    if (vertexArray === null && index) {
      // 没有顶点属性（例如全屏三角形由 gl_VertexID 生成）时 VAO 为 null，
      // 索引缓冲需要在默认 VAO 上单独绑定。
      this.state.bindIndexBuffer(index.buffer.native);
    }

    this.applyBindGroups(pipeline);
  }

  private applyBindGroups(pipeline: WebGL2RenderPipeline): void {
    const plan = pipeline.bindingPlan;
    if (!plan) return;

    for (const [groupIndex, group] of this.bindGroups) {
      if (!group) continue;

      // ---- uniform block --------------------------------------------------------------------
      const dynamicSlots = [...plan.uniformBlocks.values()]
        .filter((slot) => slot.group === groupIndex && slot.dynamic)
        .sort((a, b) => a.binding - b.binding);
      const dynamicValues = this.dynamicOffsets.get(groupIndex) ?? [];
      if (dynamicSlots.length > 0 && dynamicValues.length < dynamicSlots.length) {
        throw new ValidationError(
          `[gpu-device-api] setBindGroup(${groupIndex}, ...) 缺少动态偏移：布局里有 ${dynamicSlots.length} 个` +
            `带 hasDynamicOffset 的 uniform buffer，但只提供了 ${dynamicValues.length} 个偏移值。`,
        );
      }

      let dynamicIndex = 0;
      for (const slot of plan.uniformBlocks.values()) {
        if (slot.group !== groupIndex) continue;
        const entry = group.entry(slot.binding);
        if (!entry) {
          throw new ValidationError(
            `[gpu-device-api] bind group「${group.label}」缺少 binding ${slot.binding}（布局要求提供 uniform buffer）。`,
          );
        }
        const resource = entry.resource as BufferBinding;
        const buffer = resource.buffer as WebGL2Buffer;
        const baseOffset = resource.offset ?? 0;

        if (slot.dynamic) {
          const alignment = this.state.context.getParameter(
            this.gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT,
          ) as number;
          const dynamicOffset = dynamicValues[dynamicIndex++] ?? 0;
          if (alignment > 0 && dynamicOffset % alignment !== 0) {
            throw new ValidationError(
              `[gpu-device-api] 动态偏移 ${dynamicOffset} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${alignment}）的倍数。` +
                'uniform arena 的每段长度必须按这个对齐值取整。',
            );
          }
          const offset = baseOffset + dynamicOffset;
          const size = resource.size ?? buffer.size - offset;
          this.state.bindUniformBuffer(slot.blockBinding, buffer.native, offset, size);
        } else {
          this.state.bindUniformBuffer(slot.blockBinding, buffer.native, 0, -1);
        }
      }

      // ---- 纹理与采样器 ---------------------------------------------------------------------
      for (const slot of plan.textures.values()) {
        if (slot.group !== groupIndex) continue;
        const entry = group.entry(slot.binding);
        if (!entry) {
          throw new ValidationError(
            `[gpu-device-api] bind group「${group.label}」缺少 binding ${slot.binding}（布局要求提供纹理「${slot.name}」）。`,
          );
        }
        const view = (entry.resource as TextureBinding).view as WebGL2TextureView;
        this.assertViewRangeSupported(view);
        this.state.bindTexture(slot.unit, view.target, view.glTexture);

        if (slot.samplerBinding !== null) {
          const samplerEntry: BindGroupEntry | undefined = group.entry(slot.samplerBinding);
          if (!samplerEntry) {
            throw new ValidationError(
              `[gpu-device-api] bind group「${group.label}」缺少 binding ${slot.samplerBinding}` +
                `（纹理「${slot.name}」配套的 sampler「${slot.samplerName ?? '未命名'}」）。`,
            );
          }
          const sampler = (samplerEntry.resource as SamplerBinding).sampler as WebGL2Sampler;
          this.state.bindSampler(slot.unit, sampler.native);
        }
      }
    }

    this.assertAllGroupsBound(plan);
  }

  /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
  private assertAllGroupsBound(plan: WebGLBindingPlan): void {
    const required = new Set<number>();
    for (const slot of plan.uniformBlocks.values()) required.add(slot.group);
    for (const slot of plan.textures.values()) required.add(slot.group);
    const missing = [...required].filter((groupIndex) => !this.bindGroups.get(groupIndex));
    if (missing.length > 0) {
      throw new ValidationError(
        `[gpu-device-api] 管线需要 bind group ${missing.join('、')}，但本次绘制前没有调用 setBindGroup()。` +
          '缺少绑定会让着色器读到未定义的数据（画面通常全黑且没有任何报错），所以这里直接拦下。',
      );
    }
  }

  /**
   * WebGL2 无法表达「同一个纹理的不同 mip 子范围视图」：mip 范围是纹理对象自身的参数，
   * 不是绑定点状态。为了避免同一张纹理被两个 view 以不同 mip 范围采样时结果错乱，这里直接报错。
   */
  private assertViewRangeSupported(view: WebGL2TextureView): void {
    const descriptor = view.descriptor;
    const texture = view.texture;
    if (descriptor.baseMipLevel !== 0 || descriptor.mipLevelCount !== texture.mipLevelCount) {
      throw new ValidationError(
        `[gpu-device-api] WebGL2 后端不支持在绑定时指定 mip 子范围（纹理「${texture.label}」的 view 指定了 ` +
          `baseMipLevel=${descriptor.baseMipLevel}, mipLevelCount=${descriptor.mipLevelCount}）。` +
          'mip 范围是纹理对象自身的状态，不是绑定点状态。请为需要的 mip 范围单独创建一张纹理。',
      );
    }
  }

  /** 原始附件（不走 RenderTarget）路径下的清屏。 */
  private clearRawAttachments(descriptor: RenderPassDescriptor, framebuffer: WebGLFramebuffer): void {
    const gl = this.gl;
    void framebuffer;
    this.state.setScissor(false, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const attachments = descriptor.colorAttachments;
    attachments.forEach((attachment, index) => {
      if (!attachment || attachment.loadOp === 'load') return;
      const [r, g, b, a] = resolveClearColor(attachment.clearValue);
      gl.clearBufferfv(gl.COLOR, index, new Float32Array([r, g, b, a]));
    });

    const depthStencil = descriptor.depthStencilAttachment;
    if (depthStencil && depthStencil.depthLoadOp !== 'load') {
      gl.depthMask(true);
      const depth = depthStencil.depthClearValue ?? 1;
      const stencilValue = depthStencil.stencilClearValue ?? 0;
      const hasStencil = depthStencil.view.texture.format.includes('stencil');
      if (hasStencil) {
        gl.clearBufferfi(gl.DEPTH_STENCIL, 0, depth, stencilValue);
      } else {
        gl.clearBufferfv(gl.DEPTH, 0, new Float32Array([depth]));
      }
    }
    this.state.invalidate();
  }

  /**
   * 画进默认帧缓冲（canvas）。
   *
   * 默认帧缓冲只有 BACK 一个颜色缓冲，没有 FBO 对象，所以这里用最传统的
   * `clearColor` + `clear` 组合，而不是 `clearBufferfv`（后者对默认帧缓冲的行为各实现不一）。
   */
  private beginDefaultFramebufferPass(descriptor: RenderPassDescriptor): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.state.invalidate();

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    this.state.setScissor(false, 0, 0, width, height);

    const attachment = descriptor.colorAttachments.find((item) => item !== null);
    if (attachment && attachment.loadOp !== 'load') {
      const [r, g, b, a] = resolveClearColor(attachment.clearValue);
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    const depthStencil = descriptor.depthStencilAttachment;
    if (depthStencil && depthStencil.depthLoadOp !== 'load') {
      gl.depthMask(true);
      gl.clearDepth(depthStencil.depthClearValue ?? 1);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    gl.viewport(0, 0, width, height);
    this.state.setViewport(0, 0, width, height);
  }

  private assertOpen(operation: string): void {
    if (this._ended) {
      throw new ValidationError(
        `[gpu-device-api] 渲染通道「${this.label}」已经 end()，不能再调用 ${operation}()。`,
      );
    }
  }
}

/** 便于其它模块判断某个 binding 类型是否需要纹理。 */
export function isTextureBindingType(type: string): boolean {
  return type === BindingType.Texture || type === BindingType.StorageTexture;
}
