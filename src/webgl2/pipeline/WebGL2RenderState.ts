/**
 * 把 core 的渲染状态翻译成一组可缓存的 GL 状态设置。
 *
 * 分两步：`resolveRenderState()` 把描述（可能带缺省值）解析成纯数字/布尔的最终状态，
 * `applyRenderState()` 再把它写进 {@link GlStateCache}。
 * 这样状态解析只做一次（创建管线时），每帧只做廉价的前后比较。
 *
 * 注意拓扑不从状态里读：GL 的图元模式是 draw 调用的参数，不是状态。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { ColorWriteMask } from '../../core/pipeline/RenderState.js';
import type { RenderPipelineDescriptor } from '../../core/pipeline/RenderPipeline.js';
import {
  GL_BLEND_FACTORS,
  GL_BLEND_OPERATIONS,
  GL_COMPARE_FUNCS,
  GL_CULL_FACES,
  GL_FRONT_FACES,
} from '../utils/glEnumMap.js';
import type { GlStateCache } from '../utils/glStateCache.js';

export interface ResolvedBlendState {
  colorSrc: number;
  colorDst: number;
  colorOp: number;
  alphaSrc: number;
  alphaDst: number;
  alphaOp: number;
}

export interface ResolvedRenderState {
  depthTest: boolean;
  depthWrite: boolean;
  depthCompare: number;
  /** `[slopeScale, constant, clamp]`；全为 0 时不启用多边形偏移。 */
  depthBias: [number, number, number];
  /** 深度附件里是否带模板位；带则打开 `STENCIL_TEST`。 */
  stencilEnabled: boolean;
  blend: ResolvedBlendState | null;
  writeMask: [boolean, boolean, boolean, boolean];
  cullEnabled: boolean;
  cullFace: number;
  frontFace: number;
}

/**
 * @param descriptor 管线描述
 * @param target 当前渲染目标的附件情况。没有深度附件时必须关掉 `DEPTH_TEST`，
 *        否则 GL 的行为是未定义的（WebGL2 会当作深度测试恒通过）。
 */
export function resolveRenderState(
  descriptor: RenderPipelineDescriptor,
  target: { depth: boolean; stencil: boolean },
): ResolvedRenderState {
  const depth = descriptor.depthStencil;
  // 「这条管线是否使用深度/模板」唯一的判据：`depthStencil` **未声明**、或 `format` 为 `null`，
  // 两者同义，都表示不使用深度 —— 与 WebGPU 侧的 `WebGPURenderState.usesDepthStencil()` 是
  // 同一套语义（那边曾经把 `format: null` 回落成「写深度 + less」，只在 WebGPU 上露症状）。
  const depthRequested = depth !== undefined && depth.format !== null;
  const depthTest = depthRequested && target.depth;

  const blendDescriptor = descriptor.render?.blend;
  const targets = descriptor.fragment?.targets;
  const targetBlend = targets?.find((target) => target?.blend)?.blend;
  const blendSource = targetBlend ?? blendDescriptor;

  let blend: ResolvedBlendState | null = null;
  if (blendSource) {
    blend = {
      colorSrc: factor(blendSource.color.srcFactor, 'color.srcFactor'),
      colorDst: factor(blendSource.color.dstFactor, 'color.dstFactor'),
      colorOp: blendSource.color.operation ? GL_BLEND_OPERATIONS[blendSource.color.operation] : GL_BLEND_OPERATIONS.add,
      alphaSrc: factor(blendSource.alpha.srcFactor, 'alpha.srcFactor'),
      alphaDst: factor(blendSource.alpha.dstFactor, 'alpha.dstFactor'),
      alphaOp: blendSource.alpha.operation ? GL_BLEND_OPERATIONS[blendSource.alpha.operation] : GL_BLEND_OPERATIONS.add,
    };
  }

  const writeMaskValue = targets?.[0]?.writeMask ?? descriptor.render?.writeMask ?? ColorWriteMask.All;
  const cullMode = descriptor.primitive?.cullMode ?? 'none';

  return {
    depthTest,
    // 不使用深度时给 `false`，而不是 `depthWriteEnabled ?? true`：GL 在 `DEPTH_TEST` 关闭时本来
    // 就不更新深度缓冲（关着测试写深度是无效操作），但把 `depthWrite` 留在 `true` 会让这份解析
    // 结果读起来像「深度是开着的」，误导后续维护。`depthCompare` 同理会停在默认的 `less`，
    // 它只在 `depthTest` 为 true 时才被 glStateCache 写入。
    depthWrite: depthRequested && (depth?.depthWriteEnabled ?? true),
    depthCompare: GL_COMPARE_FUNCS[depth?.depthCompare ?? 'less'],
    depthBias: [depth?.depthBiasSlopeScale ?? 0, depth?.depthBias ?? 0, depth?.depthBiasClamp ?? 0],
    stencilEnabled: depthRequested && target.stencil,
    blend,
    writeMask: [
      (writeMaskValue & ColorWriteMask.Red) !== 0,
      (writeMaskValue & ColorWriteMask.Green) !== 0,
      (writeMaskValue & ColorWriteMask.Blue) !== 0,
      (writeMaskValue & ColorWriteMask.Alpha) !== 0,
    ],
    cullEnabled: cullMode !== 'none',
    cullFace: cullMode === 'none' ? GL_CULL_FACES.back : GL_CULL_FACES[cullMode],
    frontFace: GL_FRONT_FACES[descriptor.primitive?.frontFace ?? 'ccw'],
  };
}

/** 把解析好的状态写进 GL 状态缓存（内部会跳过没变化的设置）。 */
export function applyRenderState(
  cache: GlStateCache,
  state: ResolvedRenderState,
  stencilReference = 0,
): void {
  if (state.blend) {
    cache.setBlend(
      true,
      state.blend.colorSrc,
      state.blend.colorDst,
      state.blend.colorOp,
      state.blend.alphaSrc,
      state.blend.alphaDst,
      state.blend.alphaOp,
    );
  } else {
    // `setBlend(false, ...)` 的参数在关闭时会被忽略，用 0 占位即可。
    cache.setBlend(false, 0, 0, 0, 0, 0, 0);
  }

  cache.setColorMask(state.writeMask);
  cache.setDepthTest(state.depthTest, state.depthWrite, state.depthCompare, state.depthBias);
  // 模板引用值是运行时状态（`setStencilReference`），所以在这里一起写入。
  cache.setStencilTest(state.stencilEnabled, stencilReference);
  cache.setCull(state.cullEnabled, state.cullFace, state.frontFace);
}

function factor(value: string, path: string): number {
  const resolved = GL_BLEND_FACTORS[value as keyof typeof GL_BLEND_FACTORS];
  if (resolved === undefined) {
    throw new ValidationError(`[gpu-device-api] 未知的混合因子「${value}」（${path}）。`);
  }
  return resolved;
}
