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
import { assertPassTimestampWrites } from '../../core/resources/QuerySet.js';
import { ANY_SAMPLES_PASSED, asWebGL2QuerySet } from '../resources/WebGL2QuerySet.js';
import type { WebGL2QuerySet } from '../resources/WebGL2QuerySet.js';
import { GL_INDEX_TYPES, resolveClearColor } from '../utils/glEnumMap.js';
import {
  insertDebugMarker as insertGlDebugMarker,
  popDebugGroup as popGlDebugGroup,
  pushDebugGroup as pushGlDebugGroup,
} from '../utils/debugMarkers.js';
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { LoadOp } from '../../core/enums/LoadOp.js';
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
import type { WebGLBindingPlan, UniformBlockSlot } from '../binding/TextureUnitAllocator.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGL2Sampler } from '../resources/WebGL2Sampler.js';
import type { WebGL2TextureView } from '../resources/WebGL2TextureView.js';
import type {
  ResolvedVariant,
  WebGL2RenderPipeline,
  VertexBufferBinding,
} from '../pipeline/WebGL2RenderPipeline.js';
import type { RenderPipelineVariant } from '../../core/pipeline/RenderPipeline.js';
import { webgl2RenderTargetOfView } from './WebGL2RenderTarget.js';
import type { WebGL2RenderTarget } from './WebGL2RenderTarget.js';
import { isDefaultFramebufferView } from '../WebGL2CanvasContext.js';
import type { FramebufferCache } from './framebuffer-cache.js';

/**
 * 动态槽位列表的兜底常量：`dynamicBlocksByGroup` 里每个 group 都有条目，理论上取不到空，
 * 但用共享空数组可以避免运行时写 `?? []`（那也是一次每 draw 的分配）。
 */
const EMPTY_DYNAMIC_SLOTS: readonly UniformBlockSlot[] = [];

/**
 * 顶点/索引绑定的全局版本号。
 *
 * 每次绑定内容**真的**变化时取一个新值（只增不减），所以「版本号相同」严格等价于
 * 「顶点缓冲与索引缓冲的绑定内容完全相同」。`acquireVertexArray` 靠它做一次数字比较，
 * 就能跳过每次 draw 重建 VAO 缓存键字符串的 O(属性数) 开销。
 * 用全局计数器（而不是通道内自增）是为了让不同通道之间也不会撞号。
 */
let nextBindingRevision = 1;

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
  /**
   * 本通道画进的离屏渲染目标（没有就是 canvas 默认帧缓冲或临时拼的 FBO）。
   *
   * 它有两个用途：多重采样目标要在 `end()` 时做 resolve；以及决定 `variantShape.sampleCount`。
   */
  private renderTarget: WebGL2RenderTarget | null = null;
  private stencilReference = 0;
  private _ended = false;
  /**
   * 本通道正在计时的时间查询（`beginQuery` 已在构造时下发，`end()` 时收尾）。
   *
   * GL 的时间查询是**区间**测量：`beginQuery(TIME_ELAPSED_EXT, q)` → `endQuery` 之间的 GPU
   * 时间会写进 q。所以它包住的是「通道开始清屏/绑定 framebuffer 之后到 end() 之前」这段，
   * 对单通道帧来说就是整个渲染阶段。
   */
  private pendingTimerQueries: { readonly target: number; readonly query: WebGLQuery } | null = null;
  /** 是否有正在进行的遮挡查询（GL 要求 beginQuery/endQuery 严格配对）。 */
  private occlusionQueryOpen = false;
  /** 本通道声明了 occlusionQuerySet 时的 query set（决定 beginOcclusionQuery 是否可用）。 */
  private occlusionQuerySet: WebGL2QuerySet | null = null;

  /**
   * 变体请求对象：通道的颜色/深度格式在构造时就定了，生命周期内不会变，
   * 所以只分配一次（原来每次解析变体都要新建一个对象）。
   */
  private readonly variantShape: Partial<RenderPipelineVariant>;
  /** 变体解析结果的缓存：只跟当前管线对象走（见 {@link resolvedVariant}）。 */
  private variantPipeline: WebGL2RenderPipeline | null = null;
  private variantValue: ResolvedVariant | null = null;
  /** 当前顶点/索引绑定内容的版本号（见模块级 nextBindingRevision）。 */
  private bindingRevision = nextBindingRevision++;

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
      this.renderTarget = target;
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

      // 附件列表整体来自一个多重采样渲染目标时，必须走它的 draw FBO + resolve，
      // 否则多重采样会被静默忽略（见 WebGL2RenderTarget 的类注释）。
      const multisampled = this.multisampleTargetOf(descriptor, attachments);
      if (multisampled) {
        this.beginMultisampleTargetPass(descriptor, multisampled);
      } else if (usesDefaultFramebuffer) {
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

    // 附件形态到这里就定了：之后的 setPipeline / draw 都复用这一个请求对象。
    this.variantShape = {
      colorFormats: this.colorFormats,
      sampleCount: this.renderTarget?.sampleCount ?? 1,
      depthFormat: this.depthFormat,
    };

    // 查询必须在附件/清屏之后开始，否则时间戳会把「切 framebuffer、清屏」这段算在外面。
    this.beginQuerySetup(descriptor);
  }

  get ended(): boolean {
    return this._ended;
  }

  setPipeline(pipeline: WebGL2RenderPipeline): void {
    this.assertOpen('setPipeline');
    this.pipeline = pipeline;
    pipeline.applyState(this.resolvedVariant(pipeline), this.stencilReference);
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
    if (buffer && buffer.isIndexBuffer) {
      throw new ValidationError(
        `[gpu-device-api] buffer「${buffer.label}」是以 \`BufferUsage.Index\` 创建的索引缓冲，` +
          'WebGL2 里一个 buffer 的绑定目标在创建时就永久固定（索引缓冲只能用 ELEMENT_ARRAY_BUFFER），' +
          '所以它不能再当顶点缓冲使用。请为顶点数据单独创建一个 buffer。',
      );
    }

    const existing = this.vertexBuffers[slot];
    if (buffer === null) {
      if (!existing) return;
      this.vertexBuffers[slot] = null;
      this.bindingRevision = nextBindingRevision++;
      return;
    }
    // 便捷层每个 draw 都会把所有属性重新 set 一遍，内容没变时就别换对象、也别换版本号 ——
    // 这样既省掉每属性一次的分配，也让 acquireVertexArray 走「绑定没变」的快速路径。
    if (existing && existing.buffer === buffer && existing.offset === offset && existing.size === size) return;
    const binding: VertexBufferBinding = existing ?? { buffer, offset, size };
    binding.buffer = buffer;
    binding.offset = offset;
    binding.size = size;
    this.vertexBuffers[slot] = binding;
    this.bindingRevision = nextBindingRevision++;
  }

  setIndexBuffer(buffer: WebGL2Buffer, format: IndexFormat, offset = 0, size = -1): void {
    this.assertOpen('setIndexBuffer');
    if (!buffer.isIndexBuffer) {
      throw new ValidationError(
        `[gpu-device-api] buffer「${buffer.label}」的 usage 里没有 \`BufferUsage.Index\`，` +
          '而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），' +
          '它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 `BufferUsage.Index`。',
      );
    }
    // 与 setVertexBuffer 同样的道理：内容没变就不换对象、不换版本号。
    const existing = this.indexBuffer;
    if (
      existing &&
      existing.buffer === buffer &&
      existing.format === format &&
      existing.offset === offset &&
      existing.size === size
    ) {
      return;
    }
    if (existing) {
      existing.buffer = buffer;
      existing.format = format;
      existing.offset = offset;
      existing.size = size;
    } else {
      this.indexBuffer = { buffer, format, offset, size };
    }
    this.bindingRevision = nextBindingRevision++;
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
      this.pipeline.applyState(this.resolvedVariant(this.pipeline), reference);
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

  /**
   * 开始一条遮挡查询（对应 `gl.beginQuery(ANY_SAMPLES_PASSED, query)`）。
   *
   * `ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，不需要扩展；计数器记录的是「有多少个采样通过了
   * 深度/模板测试」（≥1 即表示「有东西可见」）。结果由 `Device.readQuerySet()` 读回。
   */
  beginOcclusionQuery(index: number): void {
    this.assertOpen('beginOcclusionQuery');
    const set = this.occlusionQuerySet;
    if (!set) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: the pass was created without ` +
          'RenderPassDescriptor.occlusionQuerySet, so there is nowhere to store the sample count.',
      );
    }
    if (this.occlusionQueryOpen) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: an occlusion query is already open; ` +
          'call endOcclusionQuery() first (GL allows only one active query per target).',
      );
    }
    this.gl.beginQuery(ANY_SAMPLES_PASSED, set.queryAt(index, `${this.label}.beginOcclusionQuery`));
    this.occlusionQueryOpen = true;
  }

  /** 结束最近一次 {@link beginOcclusionQuery}。 */
  endOcclusionQuery(): void {
    this.assertOpen('endOcclusionQuery');
    if (!this.occlusionQueryOpen) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".endOcclusionQuery: no occlusion query is open.`,
      );
    }
    this.gl.endQuery(ANY_SAMPLES_PASSED);
    this.occlusionQueryOpen = false;
  }

  /**
   * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
   * （只影响抓帧工具的分组显示，不影响渲染结果）。
   */
  pushDebugGroup(label: string): void {
    pushGlDebugGroup(this.gl, label);
  }

  popDebugGroup(): void {
    popGlDebugGroup(this.gl);
  }

  insertDebugMarker(label: string): void {
    insertGlDebugMarker(this.gl, label);
  }

  end(): void {
    if (this._ended) return;
    if (this.occlusionQueryOpen) {
      // GL 的查询必须配对；不配对会让后面的查询直接报 INVALID_OPERATION（而且报在别处，很难查）。
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".end: an occlusion query is still open; call ` +
          'endOcclusionQuery() before ending the pass.',
      );
    }
    // 多重采样目标在这里 resolve（blit 到单采样纹理）。放在 endTimerQuery() 之前，
    // 这样时间查询测到的就是「含 resolve 在内」的整个通道耗时。
    this.renderTarget?.resolve();
    this.endTimerQuery();
    this._ended = true;
    // GL 没有「结束渲染通道」这一步：默认帧缓冲会在浏览器合成时自动呈现，
    // 离屏目标则已经写在纹理里（多重采样目标刚刚 resolve 过）。这里只需要把状态缓存作废，
    // 因为下一个通道会换 framebuffer / 附件组合。
    this.state.invalidate();
  }

  /* ------------------------------------------------------------------ 内部 ------------------- */

  /**
   * 判断这组原始附件是否**整体**来自同一个多重采样渲染目标。
   *
   * 为什么需要它：上层（`Renderer`）走的是 WebGPU 风格的写法 —— `target.createPassDescriptor()`
   * 拿到附件列表再交给 `beginRenderPass`，而不是把 `target` 直接传下来。没有这一步，
   * 多重采样目标会落到「按附件临时拼一个单采样 FBO」的分支，MSAA 被静默忽略。
   *
   * 返回值：
   * - `null`：不是多重采样目标（或者只是单采样目标的附件，此时行为与从前完全一致）；
   * - 目标：所有附件都属于同一个多重采样目标；
   * - 抛错：把一个多重采样目标的附件与别的目标的附件混在一起用 —— 这种组合本层无法正确
   *   表达（renderbuffer 与纹理不能挂在同一个 FBO 上），所以明确报错而不是画错。
   */
  private multisampleTargetOf(
    descriptor: RenderPassDescriptor,
    attachments: readonly NonNullable<RenderPassDescriptor['colorAttachments'][number]>[],
  ): WebGL2RenderTarget | null {
    const views: unknown[] = attachments.map((attachment) => attachment.view);
    if (descriptor.depthStencilAttachment) views.push(descriptor.depthStencilAttachment.view);

    let target: WebGL2RenderTarget | null = null;
    for (const view of views) {
      const owner = webgl2RenderTargetOfView(view);
      if (!owner) continue;
      if (target === null) target = owner;
      else if (target !== owner) {
        throw new ValidationError(
          `[gpu-device-api] 渲染通道「${this.label}」把多个渲染目标的附件混在了一起。` +
            '一个渲染通道的附件必须来自同一个渲染目标（多重采样的附件是 renderbuffer，' +
            '无法与别的 target 的纹理挂在同一个 framebuffer 上）。',
        );
      }
    }
    if (!target || target.sampleCount === 1) return null;

    for (const view of views) {
      if (webgl2RenderTargetOfView(view) !== target) {
        throw new ValidationError(
          `[gpu-device-api] 渲染通道「${this.label}」把多重采样目标「${target.label}」的附件与其它附件` +
            '混在了一起。多重采样目标的附件全部是 renderbuffer，只能整组使用；' +
            '请传 `target`（或完整使用 `target.createPassDescriptor()` 的结果），' +
            '或把该目标的 sampleCount 设为 1。',
        );
      }
    }
    return target;
  }

  /**
   * 用渲染目标自己的 framebuffer 开始通道（多重采样路径）。
   *
   * 清屏参数从附件列表归并而来：GL 的 `clearBuffer*` 对同一帧的所有颜色附件用同一个颜色
   * （见 `WebGL2RenderTarget.bind`），所以这里要求各附件的 `loadOp` / `clearValue` 一致，
   * 不一致就明确报错，而不是悄悄只按第一个附件清屏。
   */
  private beginMultisampleTargetPass(
    descriptor: RenderPassDescriptor,
    target: WebGL2RenderTarget,
  ): void {
    let loadOp: LoadOp = 'clear';
    let clearValue: Color | undefined;
    for (const attachment of descriptor.colorAttachments) {
      if (!attachment) continue;
      const attachmentLoadOp = attachment.loadOp ?? 'clear';
      if (attachmentLoadOp === 'load') {
        loadOp = 'load';
        continue;
      }
      if (clearValue === undefined) clearValue = attachment.clearValue;
      else if (JSON.stringify(clearValue) !== JSON.stringify(attachment.clearValue)) {
        throw new ValidationError(
          `[gpu-device-api] 渲染通道「${this.label}」给多个颜色附件指定了不同的 clearValue，` +
            '而 WebGL2 的清屏对整帧只有一个颜色。请让它们一致（或改用 sampleCount = 1 的目标）。',
        );
      }
    }
    if (loadOp === 'clear' && descriptor.colorAttachments.some((item) => item?.loadOp === 'load')) {
      throw new ValidationError(
        `[gpu-device-api] 渲染通道「${this.label}」给一部分颜色附件用了 loadOp: 'load'、另一部分用了 ` +
          "'clear'，WebGL2 无法在一次清屏里表达这种组合。请统一 loadOp。",
      );
    }

    const depthStencil = descriptor.depthStencilAttachment;
    target.bind({
      clearColor: loadOp === 'load' ? undefined : clearValue,
      clearDepth: depthStencil?.depthClearValue,
      clearStencil: depthStencil?.stencilClearValue,
      loadOp,
      depthLoadOp: depthStencil?.depthLoadOp,
    });
    this.renderTarget = target;
    this.state.invalidate();
    this.state.setViewport(0, 0, target.width, target.height);
  }

  /**
   * 处理 `RenderPassDescriptor.timestampWrites` 与 `occlusionQuerySet`。
   *
   * **WebGL2 的 timestamp 语义与 WebGPU 不同**（这一点必须看清）：
   * GL 的 `TIME_ELAPSED_EXT` 测量的是 `beginQuery` → `endQuery` 之间的**区间耗时**，
   * 而 WebGPU 写的是「通道开始的时刻」与「通道结束的时刻」两个独立时间戳。
   * 所以这里把区间耗时写进 `beginningOfPassWriteIndex`（只给了 end 时用 end 那个下标），
   * 另一个下标保持 0；读回后的解释也相应不同（见 gfx 的 `GpuTiming`）。
   */
  private beginQuerySetup(descriptor: RenderPassDescriptor): void {
    if (descriptor.occlusionQuerySet) {
      this.occlusionQuerySet = asWebGL2QuerySet(
        descriptor.occlusionQuerySet,
        `${this.label}.occlusionQuerySet`,
      );
    }

    const writes = descriptor.timestampWrites;
    if (!writes) return;
    const context = `${this.label}.timestampWrites`;
    assertPassTimestampWrites(writes, context);
    const set = asWebGL2QuerySet(writes.querySet, `${context}.querySet`);
    const slot = writes.beginningOfPassWriteIndex ?? writes.endOfPassWriteIndex;
    if (slot === undefined) {
      // assertPassTimestampWrites 已经拦下这种情况，这里只是让类型收窄。
      throw new ValidationError(`[gpu-device-api] ${context}: no write index was given.`);
    }
    const query = set.queryAt(slot, context);
    this.gl.beginQuery(set.target, query);
    this.pendingTimerQueries = { target: set.target, query };
  }

  /** 收尾时间查询；没有正在进行的查询时是空操作。 */
  private endTimerQuery(): void {
    const pending = this.pendingTimerQueries;
    if (!pending) return;
    this.pendingTimerQueries = null;
    this.gl.endQuery(pending.target);
  }

  /**
   * 取当前通道形态下已解析好的管线变体。
   *
   * 附件形态（颜色/深度格式、采样数）在通道生命周期内固定，变体只跟管线对象走，
   * 所以按管线记住解析结果就够了 —— 原先 `setPipeline` 与每个 `beginDraw` 都会重新解析一次，
   * 每次解析都要拼一遍含全部顶点布局的 O(属性数) 键字符串。
   * 管线被 dispose() 后变体缓存已被清空，这里重新解析以保持与原来一致的行为。
   */
  private resolvedVariant(pipeline: WebGL2RenderPipeline): ResolvedVariant {
    if (this.variantPipeline !== pipeline || pipeline.disposed) {
      this.variantValue = pipeline.resolveVariant(this.variantShape);
      this.variantPipeline = pipeline;
    }
    return this.variantValue!;
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
    const variant = this.resolvedVariant(pipeline);
    pipeline.applyState(variant, this.stencilReference);

    const vertexArray = pipeline.acquireVertexArray(
      variant,
      this.vertexBuffers,
      index ? index.buffer.native : null,
      this.bindingRevision,
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
      // 槽位列表与动态槽位列表都是计划里预分解好的（构建时一次），这里不再 filter/sort。
      const blocks = plan.uniformBlocksByGroup.get(groupIndex);
      if (blocks) {
        const dynamicSlots = plan.dynamicBlocksByGroup.get(groupIndex) ?? EMPTY_DYNAMIC_SLOTS;
        // 没有动态槽位时连 Map 都不查（绝大多数管线走这条路径）。
        const dynamicValues = dynamicSlots.length > 0 ? this.dynamicOffsets.get(groupIndex) : undefined;
        if (dynamicSlots.length > 0 && (dynamicValues === undefined || dynamicValues.length < dynamicSlots.length)) {
          throw new ValidationError(
            `[gpu-device-api] setBindGroup(${groupIndex}, ...) 缺少动态偏移：布局里有 ${dynamicSlots.length} 个` +
              `带 hasDynamicOffset 的 uniform buffer，但只提供了 ${dynamicValues?.length ?? 0} 个偏移值。`,
          );
        }

        let dynamicIndex = 0;
        for (const slot of blocks) {
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
            // 设备常量，按 context 记一次（原先每 draw 每个动态块都做一次同步 getParameter）。
            const alignment = this.state.uniformBufferOffsetAlignment();
            const dynamicOffset = dynamicValues![dynamicIndex++] ?? 0;
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
      }

      // ---- 纹理与采样器 ---------------------------------------------------------------------
      const textures = plan.texturesByGroup.get(groupIndex);
      if (textures) {
        for (const slot of textures) {
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
    }

    this.assertAllGroupsBound(plan);
  }

  /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
  private assertAllGroupsBound(plan: WebGLBindingPlan): void {
    let missing: number[] | null = null;
    for (const groupIndex of plan.requiredGroups) {
      if (this.bindGroups.get(groupIndex)) continue;
      (missing ??= []).push(groupIndex);
    }
    if (missing) {
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
