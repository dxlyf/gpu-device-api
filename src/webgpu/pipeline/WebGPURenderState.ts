/**
 * WebGPU 固定功能渲染状态：把 core 的 `RenderState` 翻译成 `GPURenderPipelineDescriptor` 的
 * 各个片段（primitive / depthStencil / multisample / color targets）。
 *
 * 之所以单独成类：WebGPU 的固定功能状态**烘焙进 pipeline**，所以同一份 `RenderState` 会被
 * 多个 pipeline（不同 attachment 格式 / sample count）复用；把这些翻译规则集中在这里，
 * `WebGPURenderPipeline` 就只需要关心 variant 与缓存。
 *
 * 几处与 WebGPU 校验规则直接相关的处理：
 * - `stripIndexFormat`：WebGPU 要求 strip 拓扑**必须**带该字段、非 strip 拓扑**必须不带**。
 *   core 允许省略，省略时按 `'uint32'` 处理（否则根本建不出 strip pipeline）。
 * - `depthStencil`：depth 字段只在格式有 depth aspect 时写入，stencil 字段只在有 stencil
 *   aspect 时写入 —— WebGPU 不允许给没有对应 aspect 的格式设置这些字段。
 * - `unclippedDepth` 需要 `depth-clip-control` feature。
 */

import type {
  BlendComponent,
  BlendState,
  ColorTargetState,
  DepthStencilState,
  MultisampleState,
  PrimitiveState,
  RenderState,
  StencilFaceState,
} from '../../core/pipeline/RenderState.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { DeviceFeatures } from '../../core/Device.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import {
  DEFAULT_BLEND_COMPONENT,
  DEFAULT_DEPTH_STATE,
  DEFAULT_PRIMITIVE_STATE,
  STENCIL_FACE_DEFAULT,
} from '../../core/pipeline/RenderState.js';
import { validateVertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import {
  assertSampleCount,
  isStripTopology,
  toGPUBlendFactor,
  toGPUBlendOperation,
  toGPUColorWriteMask,
  toGPUCompareFunction,
  toGPUCullMode,
  toGPUFrontFace,
  toGPUIndexFormat,
  toGPUPrimitiveTopology,
  toGPUStencilOperation,
  toGPUVertexFormat,
  toGPUVertexStepMode,
} from '../utils/wgpuEnumMap.js';
import { hasDepthAspect, hasStencilAspect, toGPUTextureFormat } from '../utils/wgpuFormatMap.js';

/** strip 拓扑省略 `stripIndexFormat` 时使用的默认索引格式。 */
export const DEFAULT_STRIP_INDEX_FORMAT = 'uint32' as const;

export class WebGPURenderState implements RenderState {
  readonly primitive?: PrimitiveState;
  readonly depthStencil?: DepthStencilState;
  readonly multisample?: MultisampleState;
  readonly blend?: BlendState;
  readonly writeMask?: number;
  readonly colorFormats?: readonly TextureFormat[];

  constructor(state: RenderState | undefined) {
    if (!state) return;
    if (state.primitive) this.primitive = state.primitive;
    if (state.depthStencil) this.depthStencil = state.depthStencil;
    if (state.multisample) this.multisample = state.multisample;
    if (state.blend) this.blend = state.blend;
    if (state.writeMask !== undefined) this.writeMask = state.writeMask;
    if (state.colorFormats) this.colorFormats = state.colorFormats;
  }

  /** 把 core 的 `PrimitiveState` 翻译为 WebGPU 的 `GPUPrimitiveState`。 */
  static toGPUPrimitiveState(state: PrimitiveState | undefined, features?: DeviceFeatures): GPUPrimitiveState {
    const topology = state?.topology ?? DEFAULT_PRIMITIVE_STATE.topology;
    const native: GPUPrimitiveState = {
      topology: toGPUPrimitiveTopology(topology),
      frontFace: toGPUFrontFace(state?.frontFace ?? DEFAULT_PRIMITIVE_STATE.frontFace),
      cullMode: toGPUCullMode(state?.cullMode ?? DEFAULT_PRIMITIVE_STATE.cullMode),
    };
    if (isStripTopology(topology)) {
      // strip 拓扑必须带 stripIndexFormat；core 允许省略，此时按 uint32 处理。
      native.stripIndexFormat = toGPUIndexFormat(state?.stripIndexFormat ?? DEFAULT_STRIP_INDEX_FORMAT);
    } else if (state?.stripIndexFormat !== undefined) {
      throw new ValidationError(
        '[gpu-device-api] PrimitiveState.stripIndexFormat is only valid for strip topologies, but the topology ' +
          `is "${topology}".`,
      );
    }
    if (state?.unclippedDepth) {
      if (features && !features.has('depth-clip-control')) {
        throw new ValidationError(
          '[gpu-device-api] PrimitiveState.unclippedDepth needs the "depth-clip-control" device feature.',
        );
      }
      native.unclippedDepth = true;
    }
    return native;
  }

  /**
   * 把 core 的 `DepthStencilState` 翻译为 WebGPU 的 `GPUDepthStencilState`。
   *
   * `format` 由调用方给出（core 允许省略，此时用 render target 的 depth 格式）。
   */
  static toGPUDepthStencilState(format: TextureFormat, state: DepthStencilState | undefined): GPUDepthStencilState {
    const hasDepth = hasDepthAspect(format);
    const hasStencil = hasStencilAspect(format);
    if (!hasDepth && !hasStencil) {
      throw new ValidationError(
        `[gpu-device-api] DepthStencilState: "${format}" has neither a depth nor a stencil aspect.`,
      );
    }
    const native: GPUDepthStencilState = { format: toGPUTextureFormat(format) };

    if (hasDepth) {
      native.depthWriteEnabled = state?.depthWriteEnabled ?? DEFAULT_DEPTH_STATE.depthWriteEnabled;
      native.depthCompare = toGPUCompareFunction(state?.depthCompare ?? DEFAULT_DEPTH_STATE.depthCompare);
    }
    if (hasStencil) {
      native.stencilFront = toGPUStencilFaceState(state?.stencilFront);
      native.stencilBack = toGPUStencilFaceState(state?.stencilBack);
      native.stencilReadMask = state?.stencilReadMask ?? 0xffff_ffff;
      native.stencilWriteMask = state?.stencilWriteMask ?? 0xffff_ffff;
    }
    if (state?.depthBias !== undefined) native.depthBias = state.depthBias;
    if (state?.depthBiasSlopeScale !== undefined) native.depthBiasSlopeScale = state.depthBiasSlopeScale;
    if (state?.depthBiasClamp !== undefined) native.depthBiasClamp = state.depthBiasClamp;
    return native;
  }

  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(state: MultisampleState | undefined, sampleCount: number): GPUMultisampleState {
    const count = assertSampleCount(state?.count ?? sampleCount, 'MultisampleState.count');
    const native: GPUMultisampleState = { count, mask: state?.mask ?? 0xffff_ffff };
    const alphaToCoverage = state?.alphaToCoverageEnabled ?? false;
    if (alphaToCoverage && count === 1) {
      throw new ValidationError(
        '[gpu-device-api] MultisampleState.alphaToCoverageEnabled requires sampleCount > 1.',
      );
    }
    if (alphaToCoverage) native.alphaToCoverageEnabled = true;
    return native;
  }

  /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
  static toGPUBlendState(blend: BlendState | undefined): GPUBlendState | undefined {
    if (!blend) return undefined;
    return {
      color: toGPUBlendComponent(blend.color),
      alpha: toGPUBlendComponent(blend.alpha),
    };
  }

  /**
   * 组合出 `GPUFragmentState.targets`。
   *
   * `formats` 来自当前 variant（render target），`targets` 来自 pipeline descriptor；
   * 两者长度不一致时直接报错，因为那必然是用户的疏忽（WebGPU 的报错更难读）。
   */
  static toGPUColorTargets(
    formats: readonly TextureFormat[],
    targets: readonly (ColorTargetState | null)[] | undefined,
    defaults: { blend?: BlendState; writeMask?: number } = {},
  ): (GPUColorTargetState | null)[] {
    if (targets && targets.length !== formats.length) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline: fragment.targets has ${targets.length} entries but the render target ` +
          `has ${formats.length} color attachments.`,
      );
    }
    return formats.map((format, index) => {
      const target = targets ? targets[index] : undefined;
      if (target === null) return null;
      const native: GPUColorTargetState = { format: toGPUTextureFormat(target?.format ?? format) };
      const blend = target?.blend ?? defaults.blend;
      if (blend) native.blend = WebGPURenderState.toGPUBlendState(blend);
      const writeMask = target?.writeMask ?? defaults.writeMask;
      if (writeMask !== undefined) native.writeMask = toGPUColorWriteMask(writeMask);
      return native;
    });
  }

  /** 校验并翻译 vertex buffer layout 列表。 */
  static toGPUVertexBufferLayouts(
    layouts: readonly VertexBufferLayout[],
    limits: { maxVertexAttributes: number; maxVertexBufferArrayStride: number; maxVertexBuffers: number },
  ): GPUVertexBufferLayout[] {
    if (layouts.length > limits.maxVertexBuffers) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline: ${layouts.length} vertex buffer layouts exceed maxVertexBuffers ` +
          `(${limits.maxVertexBuffers}).`,
      );
    }
    return layouts.map((layout) => {
      try {
        validateVertexBufferLayout(layout, limits);
      } catch (error) {
        throw new ValidationError(
          `[gpu-device-api] RenderPipeline: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return {
        arrayStride: layout.arrayStride,
        stepMode: toGPUVertexStepMode(layout.stepMode ?? 'vertex'),
        attributes: layout.attributes.map((attribute) => ({
          shaderLocation: attribute.shaderLocation,
          offset: attribute.offset,
          format: toGPUVertexFormat(attribute.format),
        })),
      };
    });
  }
}

function toGPUBlendComponent(component: BlendComponent): GPUBlendComponent {
  const resolved = { ...DEFAULT_BLEND_COMPONENT, ...component };
  return {
    operation: toGPUBlendOperation(resolved.operation ?? 'add'),
    srcFactor: toGPUBlendFactor(resolved.srcFactor),
    dstFactor: toGPUBlendFactor(resolved.dstFactor),
  };
}

function toGPUStencilFaceState(face: StencilFaceState | undefined): GPUStencilFaceState {
  return {
    compare: toGPUCompareFunction(face?.compare ?? STENCIL_FACE_DEFAULT.compare),
    failOp: toGPUStencilOperation(face?.failOp ?? STENCIL_FACE_DEFAULT.failOp),
    depthFailOp: toGPUStencilOperation(face?.depthFailOp ?? STENCIL_FACE_DEFAULT.depthFailOp),
    passOp: toGPUStencilOperation(face?.passOp ?? STENCIL_FACE_DEFAULT.passOp),
  };
}
