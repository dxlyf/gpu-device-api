/**
 * WebGPU render pass 录制：`RenderPassEncoder` 接口在 `GPURenderPassEncoder` 上的实现。
 *
 * 本文件还负责 core `RenderPassDescriptor` → WebGPU `GPURenderPassDescriptor` 的翻译
 * （{@link toGPURenderPassDescriptor}），因为「一个 pass 的 attachment 布局」同时决定了
 * pipeline variant 的 `colorFormats` / `sampleCount` / `depthFormat`，两者放在一起才不会走散。
 *
 * 关于 `setPipeline`：core 允许 pipeline 不声明 attachment 格式（这样才能跨 target 复用），
 * 所以这里把当前 pass 的实际布局交给 `WebGPURenderPipeline.resolve(variant)` 去查/建对应的
 * `GPURenderPipeline`。这也是 WebGPU 后端唯一「惰性编译」的触发点。
 */

import type { RenderPassDescriptor, RenderPassEncoder } from '../../core/render/RenderPassEncoder.js';
import type { Color, ColorAttachment, DepthStencilAttachment } from '../../core/render/RenderTarget.js';
import type { DrawDescriptor, DrawIndexedDescriptor, DrawIndirectDescriptor } from '../../core/render/DrawCommands.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { BindGroup } from '../../core/binding/BindGroup.js';
import type { RenderPipeline, RenderPipelineVariant } from '../../core/pipeline/RenderPipeline.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { asGPUBuffer } from '../resources/WebGPUBuffer.js';
import { asGPUTextureView } from '../resources/WebGPUTextureView.js';
import { asGPUQuerySet, toGPUTimestampWrites } from '../resources/WebGPUQuerySet.js';
import { asGPUBindGroup, NO_DYNAMIC_OFFSETS, validateDynamicOffsets } from '../binding/WebGPUBindGroup.js';
import { asGPURenderPipeline } from '../pipeline/WebGPURenderPipeline.js';
import { WebGPURenderTarget } from './WebGPURenderTarget.js';
import { resolveClearColor, toGPUIndexFormat, toGPULoadOp, toGPUStoreOp } from '../utils/wgpuEnumMap.js';
import { hasStencilAspect } from '../utils/wgpuFormatMap.js';

/** 一个 render pass 的 attachment 布局，pipeline variant 由它推导。 */
export interface WebGPURenderPassLayout {
  /**
   * **逐位置**的颜色附件格式：下标即 fragment output location，空位（`colorAttachments[i] === null`）
   * 为 `null`。长度等于 `colorAttachments.length`（尾部空位也占位）。
   *
   * 逐位置是必须的：`[view, null]` 与 `[null, view]` 需要的 `fragment.targets` 不同，
   * 压缩成密集列表会让两者撞同一个变体键（批 05 实测 `createRenderPipeline` 只调用 1 次）。
   */
  readonly colorFormats: readonly (TextureFormat | null)[];
  readonly depthFormat: TextureFormat | null;
  readonly sampleCount: number;
}

/**
 * 把 core 的 `RenderPassDescriptor` 翻译成 WebGPU 需要的形态，并顺带算出 pass 布局。
 *
 * - `target` 便捷字段优先：直接使用 `WebGPURenderTarget.createPassDescriptor()` 的结果；
 * - `loadOp` / `storeOp` 省略时按 `'clear'` / `'store'` 处理（`GPURenderPassColorAttachment`
 *   要求这两个字段必填，而 core 里它们是可选的）；
 * - 所有 attachment 的 sampleCount 必须一致（WebGPU 的硬性要求），否则这里直接报错；
 * - 多重采样 attachment 必须有 `resolveTarget`（或 `storeOp: 'discard'`）；
 * - `timestampWrites` 需要 `timestamp-query` 与 `timestamp-query-inside-passes`，缺一个就报错
 *   （见 {@link toGPUTimestampWrites}）。
 */
export function toGPURenderPassDescriptor(
  descriptor: RenderPassDescriptor,
  device: WebGPUDevice,
): {
  native: GPURenderPassDescriptor;
  layout: WebGPURenderPassLayout;
  /** 该 pass 是否声明了 occlusionQuerySet（决定 beginOcclusionQuery 是否可用）。 */
  hasOcclusionQuerySet: boolean;
} {
  const label = descriptor.label ?? 'renderPass';
  let colorAttachments: readonly (ColorAttachment | null)[];
  let depthStencilAttachment: DepthStencilAttachment | null;

  if (descriptor.target) {
    if (!(descriptor.target instanceof WebGPURenderTarget)) {
      throw new ValidationError(
        `[gpu-device-api] ${label}: descriptor.target must be a WebGPURenderTarget created by a WebGPU device.`,
      );
    }
    /*
     * `#19`：`target` 与**非空** `colorAttachments` 同时出现时明确报错（与 WebGL2 侧一致）。
     *
     * 改前这里把整个 colorAttachments 静默丢掉、只用 target 生成附件列表：调用方以为自己设的
     * 附件生效了（例如「用 target 定尺寸、用 colorAttachments 换一张 view」这种写法），
     * 实际画进的是 target 自己的附件 —— 画面不对，却一行错误都没有。
     * 空的 `[]` 不算「同时给两套附件」（`RenderPassDescriptor.colorAttachments` 是必填字段，
     * 用 `target` 时写 `[]` 是正常写法），所以只拦非空列表。
     */
    if (descriptor.colorAttachments.length > 0) {
      throw new ValidationError(
        `[gpu-device-api] ${label}: descriptor.target and a non-empty descriptor.colorAttachments were ` +
          'both given. Keep only one of them: use target to say "render into this render target", or ' +
          'use colorAttachments to name the attachments explicitly (pass an empty array alongside target).',
      );
    }
    const built = descriptor.target.createPassDescriptor({
      clearValue: descriptor.clearValue,
      depthClearValue: descriptor.depthClearValue,
    });
    colorAttachments = built.colorAttachments;
    depthStencilAttachment = built.depthStencilAttachment;
  } else {
    colorAttachments = descriptor.colorAttachments;
    depthStencilAttachment = descriptor.depthStencilAttachment ?? null;
  }

  /**
   * 逐位置的颜色格式：下标即 fragment output location，空位进 `null`（`#11.3`，批 10 修完）。
   *
   * 压缩成「非空附件的密集列表」曾经让空位后面的 target 整体前移，并让 `[view, null]` 与
   * `[null, view]` 撞成同一个变体键（批 05 实测 `createRenderPipeline` 只调用 1 次）。
   * 批 05 的处置是「空位后面还有非空附件」时明确报错；批 10 把
   * `RenderPipelineVariant.colorFormats` 改成逐位置之后，这条报错撤掉了 ——
   * 位置信息现在完整地传到了变体与原生 `fragment.targets`。
   */
  const formats: (TextureFormat | null)[] = [];
  const nativeColors: (GPURenderPassColorAttachment | null)[] = [];
  const sampleCounts: number[] = [];

  for (let index = 0; index < colorAttachments.length; index += 1) {
    const attachment = colorAttachments[index];
    if (!attachment) {
      nativeColors.push(null);
      // 空位占住它的下标：`formats[i]` 与 `colorAttachments[i]` 逐位置对应。
      formats.push(null);
      continue;
    }
    const view = asGPUTextureView(attachment.view, `${label}.colorAttachments`);
    const texture = attachment.view.texture;
    formats.push(attachment.view.descriptor.format ?? texture.format);
    sampleCounts.push(texture.sampleCount);

    const loadOp = attachment.loadOp ?? 'clear';
    const storeOp = attachment.storeOp ?? 'store';
    if (texture.sampleCount > 1 && !attachment.resolveTarget && storeOp !== 'discard') {
      throw new ValidationError(
        `[gpu-device-api] ${label}: a multisampled color attachment (sampleCount ${texture.sampleCount}) needs a ` +
          'resolveTarget, or storeOp must be "discard".',
      );
    }
    const native: GPURenderPassColorAttachment = {
      view,
      loadOp: toGPULoadOp(loadOp),
      storeOp: toGPUStoreOp(storeOp),
    };
    if (attachment.resolveTarget) {
      native.resolveTarget = asGPUTextureView(attachment.resolveTarget, `${label}.resolveTarget`);
    }
    if (loadOp === 'clear') {
      native.clearValue = resolveClearColor(attachment.clearValue);
    }
    nativeColors.push(native);
  }

  /*
   * 批 05 在这里加过一条闸门：空位后面还有非空附件 → 明确报错（`#11.3`）。
   *
   * 那条闸门存在的唯一理由是当时的 `layout.colorFormats` 是**非空附件的密集列表**，位置信息
   * 表达不了。批 10 把它改成**逐位置**（空位写 `null`）之后，`[view, null]` / `[null, view]` /
   * `[view, null, view]` 各自拿到自己的变体键与 `fragment.targets`，闸门就没有存在理由了 ——
   * 留着反而会把原生完全合法的写法（`[null, view]` 在原生 WebGPU 上可用，批 05 实测
   * location 1 正确收到绿色）拒掉。
   *
   * 它的覆盖没有丢：批 05 那几条「中间空位报错」的用例已按「不再报错且落点正确」改写，
   * 见 `test/webgpu-mrt-null-slots.test.ts` 与新增的 `test/webgpu-mrt-positional-formats.test.ts`。
   */

  const native: GPURenderPassDescriptor = { label, colorAttachments: nativeColors };
  let depthFormat: TextureFormat | null = null;

  if (depthStencilAttachment) {
    const view = asGPUTextureView(depthStencilAttachment.view, `${label}.depthStencilAttachment`);
    const format = depthStencilAttachment.view.descriptor.format ?? depthStencilAttachment.view.texture.format;
    depthFormat = format;
    sampleCounts.push(depthStencilAttachment.view.texture.sampleCount);

    const nativeDepth: GPURenderPassDepthStencilAttachment = { view };
    const depthLoadOp = depthStencilAttachment.depthLoadOp ?? 'clear';
    const depthStoreOp = depthStencilAttachment.depthStoreOp ?? 'store';
    nativeDepth.depthLoadOp = toGPULoadOp(depthLoadOp);
    nativeDepth.depthStoreOp = toGPUStoreOp(depthStoreOp);
    if (depthLoadOp === 'clear') {
      nativeDepth.depthClearValue = assertDepthClear(depthStencilAttachment.depthClearValue ?? 1, label);
    }
    if (depthStencilAttachment.depthReadOnly !== undefined) {
      nativeDepth.depthReadOnly = depthStencilAttachment.depthReadOnly;
    }
    if (hasStencilAspect(format)) {
      const stencilLoadOp = depthStencilAttachment.stencilLoadOp ?? depthLoadOp;
      nativeDepth.stencilLoadOp = toGPULoadOp(stencilLoadOp);
      nativeDepth.stencilStoreOp = toGPUStoreOp(depthStencilAttachment.stencilStoreOp ?? 'store');
      if (stencilLoadOp === 'clear') {
        nativeDepth.stencilClearValue = depthStencilAttachment.stencilClearValue ?? 0;
      }
      if (depthStencilAttachment.stencilReadOnly !== undefined) {
        nativeDepth.stencilReadOnly = depthStencilAttachment.stencilReadOnly;
      }
    } else if (
      depthStencilAttachment.stencilLoadOp !== undefined ||
      depthStencilAttachment.stencilStoreOp !== undefined
    ) {
      throw new ValidationError(
        `[gpu-device-api] ${label}: depth format "${format}" has no stencil aspect, so stencilLoadOp / ` +
          'stencilStoreOp must not be set.',
      );
    }
    native.depthStencilAttachment = nativeDepth;
  }

  if (descriptor.occlusionQuerySet) {
    native.occlusionQuerySet = asGPUQuerySet(descriptor.occlusionQuerySet, `${label}.occlusionQuerySet`);
  }
  if (descriptor.timestampWrites) {
    native.timestampWrites = toGPUTimestampWrites(
      descriptor.timestampWrites,
      device,
      `${label}.timestampWrites`,
    );
  }

  return {
    native,
    hasOcclusionQuerySet: descriptor.occlusionQuerySet !== undefined,
    layout: {
      colorFormats: formats,
      depthFormat,
      sampleCount: assertConsistentSampleCount(sampleCounts, label),
    },
  };
}

function assertConsistentSampleCount(sampleCounts: readonly number[], label: string): number {
  if (sampleCounts.length === 0) return 1;
  const first = sampleCounts[0]!;
  for (const count of sampleCounts) {
    if (count !== first) {
      throw new ValidationError(
        `[gpu-device-api] ${label}: all attachments of a render pass must share the same sampleCount, got ` +
          `${sampleCounts.join(', ')}.`,
      );
    }
  }
  return first;
}

function assertDepthClear(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ValidationError(
      `[gpu-device-api] ${label}: depthClearValue must be within [0, 1], got ${String(value)}.`,
    );
  }
  return value;
}

export class WebGPURenderPassEncoder implements RenderPassEncoder {
  readonly label: string;
  readonly layout: WebGPURenderPassLayout;
  readonly native: GPURenderPassEncoder;

  private readonly device: WebGPUDevice;
  private readonly onEnd: (() => void) | undefined;
  /** 该 pass 是否声明了 occlusionQuerySet；没声明时 beginOcclusionQuery 会明确报错。 */
  private readonly hasOcclusionQuerySet: boolean;
  private _ended = false;
  private occlusionQueryOpen = false;

  /**
   * 一个 pass 的 attachment 布局与 label 在生命周期内都不变，因此「pipeline variant 请求」
   * 与各处报错用的 context 字符串都在构造时建一次。
   *
   * 这些值原先每次 `setPipeline` / `setBindGroup` / `setVertexBuffer` 都会现拼：
   * 每 draw 一个对象 + 若干模板字符串，在几千个 draw 的帧里是纯浪费。
   */
  private readonly variantRequest: Partial<RenderPipelineVariant>;
  private readonly contextSetPipeline: string;
  private readonly contextSetBindGroup: string;
  private readonly contextSetVertexBuffer: string;
  private readonly contextSetIndexBuffer: string;
  private readonly contextDrawIndirect: string;
  private readonly contextDrawIndexedIndirect: string;

  constructor(
    device: WebGPUDevice,
    native: GPURenderPassEncoder,
    layout: WebGPURenderPassLayout,
    label: string,
    hasOcclusionQuerySet: boolean,
    onEnd?: () => void,
  ) {
    this.device = device;
    this.native = native;
    this.layout = layout;
    this.label = label;
    this.hasOcclusionQuerySet = hasOcclusionQuerySet;
    this.onEnd = onEnd;

    const pass = `RenderPass "${label}"`;
    this.contextSetPipeline = `${pass}.setPipeline`;
    this.contextSetBindGroup = `${pass}.setBindGroup`;
    this.contextSetVertexBuffer = `${pass}.setVertexBuffer`;
    this.contextSetIndexBuffer = `${pass}.setIndexBuffer`;
    this.contextDrawIndirect = `${pass}.drawIndirect`;
    this.contextDrawIndexedIndirect = `${pass}.drawIndexedIndirect`;
    this.variantRequest = {
      colorFormats: layout.colorFormats,
      sampleCount: layout.sampleCount,
      depthFormat: layout.depthFormat,
    };
  }

  get ended(): boolean {
    return this._ended;
  }

  setPipeline(pipeline: RenderPipeline): void {
    this.assertOpen('setPipeline');
    this.native.setPipeline(asGPURenderPipeline(pipeline, this.contextSetPipeline, this.variantRequest));
  }

  setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void {
    this.assertOpen('setBindGroup');
    if (bindGroup) {
      validateDynamicOffsets(bindGroup, dynamicOffsets, this.device, this.contextSetBindGroup);
      // 必须把 dynamicOffsets 传给原生调用：布局里声明了 `hasDynamicOffset` 的 entry 要求
      // 这里恰好给出对应数量的偏移，漏传会让 WebGPU 判定「动态偏移数量 0 ≠ 动态 buffer 数量 1」，
      // 整条 command buffer 随之失效（`Invalid CommandBuffer ... due to a previous error`），
      // 于是画面只剩清屏色 —— 而且报错出现在 submit 上，非常难定位。
      this.native.setBindGroup(
        index,
        asGPUBindGroup(bindGroup, this.contextSetBindGroup),
        dynamicOffsets ?? NO_DYNAMIC_OFFSETS,
      );
      return;
    }
    if (dynamicOffsets && dynamicOffsets.length > 0) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`,
      );
    }
    this.native.setBindGroup(index, null);
  }

  setVertexBuffer(slot: number, buffer: Buffer | null, offset?: number, size?: number): void {
    this.assertOpen('setVertexBuffer');
    if (buffer === null) {
      this.native.setVertexBuffer(slot, null, offset, size);
      return;
    }
    this.native.setVertexBuffer(slot, asGPUBuffer(buffer, this.contextSetVertexBuffer), offset, size);
  }

  setIndexBuffer(buffer: Buffer, format: IndexFormat, offset?: number, size?: number): void {
    this.assertOpen('setIndexBuffer');
    this.native.setIndexBuffer(
      asGPUBuffer(buffer, this.contextSetIndexBuffer),
      toGPUIndexFormat(format),
      offset,
      size,
    );
  }

  setViewport(x: number, y: number, width: number, height: number, minDepth = 0, maxDepth = 1): void {
    this.assertOpen('setViewport');
    this.native.setViewport(x, y, width, height, minDepth, maxDepth);
  }

  setScissorRect(x: number, y: number, width: number, height: number): void {
    this.assertOpen('setScissorRect');
    this.native.setScissorRect(x, y, width, height);
  }

  setBlendConstant(color: Color): void {
    this.assertOpen('setBlendConstant');
    this.native.setBlendConstant(resolveClearColor(color));
  }

  setStencilReference(reference: number): void {
    this.assertOpen('setStencilReference');
    this.native.setStencilReference(reference);
  }

  draw(descriptor: DrawDescriptor): void {
    this.assertOpen('draw');
    this.native.draw(
      descriptor.vertexCount,
      descriptor.instanceCount ?? 1,
      descriptor.firstVertex ?? 0,
      descriptor.firstInstance ?? 0,
    );
  }

  drawIndexed(descriptor: DrawIndexedDescriptor): void {
    this.assertOpen('drawIndexed');
    this.native.drawIndexed(
      descriptor.indexCount,
      descriptor.instanceCount ?? 1,
      descriptor.firstIndex ?? 0,
      descriptor.baseVertex ?? 0,
      descriptor.firstInstance ?? 0,
    );
  }

  drawIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset = 0): void {
    this.assertOpen('drawIndirect');
    const resolved = resolveIndirect(indirect, indirectOffset, this.contextDrawIndirect);
    this.native.drawIndirect(resolved.buffer, resolved.offset);
  }

  drawIndexedIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset = 0): void {
    this.assertOpen('drawIndexedIndirect');
    const resolved = resolveIndirect(indirect, indirectOffset, this.contextDrawIndexedIndirect);
    this.native.drawIndexedIndirect(resolved.buffer, resolved.offset);
  }

  /**
   * 开始一条遮挡查询：这一段里绘制的图元有多少采样通过深度/模板测试，就累加到
   * `descriptor.occlusionQuerySet` 的第 `index` 个计数器里。
   *
   * WebGPU 要求 pass 在创建时就声明 `occlusionQuerySet`，没声明就报错（原生也会报，
   * 但这里报得更早、说的更清楚）。
   */
  beginOcclusionQuery(index: number): void {
    this.assertOpen('beginOcclusionQuery');
    if (!this.hasOcclusionQuerySet) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: the pass was created without ` +
          'RenderPassDescriptor.occlusionQuerySet, so there is nowhere to store the sample count.',
      );
    }
    if (this.occlusionQueryOpen) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: an occlusion query is already open; ` +
          'call endOcclusionQuery() first.',
      );
    }
    this.native.beginOcclusionQuery(index);
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
    this.occlusionQueryOpen = false;
    this.native.endOcclusionQuery();
  }

  /** 调试分组：直接转发给原生的 `GPURenderPassEncoder`（抓帧工具据此分组显示）。 */
  pushDebugGroup(label: string): void {
    this.assertOpen('pushDebugGroup');
    this.native.pushDebugGroup(label);
  }

  popDebugGroup(): void {
    this.assertOpen('popDebugGroup');
    this.native.popDebugGroup();
  }

  insertDebugMarker(label: string): void {
    this.assertOpen('insertDebugMarker');
    this.native.insertDebugMarker(label);
  }

  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end(): void {
    if (this._ended) return;
    if (this.occlusionQueryOpen) {
      // WebGPU 同样把「pass 结束时还有未闭合的遮挡查询」判为校验错误，这里提前报清楚。
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".end: an occlusion query is still open; call ` +
          'endOcclusionQuery() before ending the pass.',
      );
    }
    this._ended = true;
    this.native.end();
    this.onEnd?.();
  }

  private assertOpen(context: string): void {
    if (this._ended) {
      throw new ValidationError(
        `[gpu-device-api] RenderPass "${this.label}".${context}: the pass has already ended.`,
      );
    }
  }
}

/** 把 `DrawIndirectDescriptor | BufferLike` 归一成 (buffer, offset)。 */
export function resolveIndirect(
  indirect: DrawIndirectDescriptor | BufferLike,
  indirectOffset: number,
  context: string,
): { buffer: GPUBuffer; offset: number } {
  if ('indirectBuffer' in indirect) {
    return {
      buffer: asGPUBuffer(indirect.indirectBuffer, context),
      offset: indirect.indirectOffset ?? 0,
    };
  }
  return { buffer: asGPUBuffer(indirect, context), offset: indirectOffset };
}
