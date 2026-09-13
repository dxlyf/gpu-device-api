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
import type { RenderPipeline } from '../../core/pipeline/RenderPipeline.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { asGPUBuffer } from '../resources/WebGPUBuffer.js';
import { asGPUTextureView } from '../resources/WebGPUTextureView.js';
import { asGPUQuerySet } from '../resources/WebGPUQuerySet.js';
import { asGPUBindGroup, validateDynamicOffsets } from '../binding/WebGPUBindGroup.js';
import { asGPURenderPipeline } from '../pipeline/WebGPURenderPipeline.js';
import { WebGPURenderTarget } from './WebGPURenderTarget.js';
import { resolveClearColor, toGPUIndexFormat, toGPULoadOp, toGPUStoreOp } from '../utils/wgpuEnumMap.js';
import { hasStencilAspect } from '../utils/wgpuFormatMap.js';

/** 一个 render pass 的 attachment 布局，pipeline variant 由它推导。 */
export interface WebGPURenderPassLayout {
  readonly colorFormats: readonly TextureFormat[];
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
 * - 多重采样 attachment 必须有 `resolveTarget`（或 `storeOp: 'discard'`）。
 */
export function toGPURenderPassDescriptor(descriptor: RenderPassDescriptor): {
  native: GPURenderPassDescriptor;
  layout: WebGPURenderPassLayout;
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

  const formats: TextureFormat[] = [];
  const nativeColors: (GPURenderPassColorAttachment | null)[] = [];
  const sampleCounts: number[] = [];

  for (const attachment of colorAttachments) {
    if (!attachment) {
      nativeColors.push(null);
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

  return {
    native,
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
  private _ended = false;

  constructor(
    device: WebGPUDevice,
    native: GPURenderPassEncoder,
    layout: WebGPURenderPassLayout,
    label: string,
    onEnd?: () => void,
  ) {
    this.device = device;
    this.native = native;
    this.layout = layout;
    this.label = label;
    this.onEnd = onEnd;
  }

  get ended(): boolean {
    return this._ended;
  }

  setPipeline(pipeline: RenderPipeline): void {
    this.assertOpen('setPipeline');
    this.native.setPipeline(
      asGPURenderPipeline(pipeline, `RenderPass "${this.label}".setPipeline`, {
        colorFormats: this.layout.colorFormats,
        sampleCount: this.layout.sampleCount,
        depthFormat: this.layout.depthFormat,
      }),
    );
  }

  setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void {
    this.assertOpen('setBindGroup');
    if (bindGroup) {
      validateDynamicOffsets(bindGroup, dynamicOffsets, this.device, `RenderPass "${this.label}".setBindGroup`);
      this.native.setBindGroup(index, asGPUBindGroup(bindGroup, `RenderPass "${this.label}".setBindGroup`));
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
    this.native.setVertexBuffer(slot, asGPUBuffer(buffer, `RenderPass "${this.label}".setVertexBuffer`), offset, size);
  }

  setIndexBuffer(buffer: Buffer, format: IndexFormat, offset?: number, size?: number): void {
    this.assertOpen('setIndexBuffer');
    this.native.setIndexBuffer(
      asGPUBuffer(buffer, `RenderPass "${this.label}".setIndexBuffer`),
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
    const resolved = resolveIndirect(indirect, indirectOffset, `RenderPass "${this.label}".drawIndirect`);
    this.native.drawIndirect(resolved.buffer, resolved.offset);
  }

  drawIndexedIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset = 0): void {
    this.assertOpen('drawIndexedIndirect');
    const resolved = resolveIndirect(indirect, indirectOffset, `RenderPass "${this.label}".drawIndexedIndirect`);
    this.native.drawIndexedIndirect(resolved.buffer, resolved.offset);
  }

  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end(): void {
    if (this._ended) return;
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
