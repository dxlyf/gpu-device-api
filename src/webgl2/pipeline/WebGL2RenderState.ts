/**
 * 把 core 的渲染状态翻译成一组可缓存的 GL 状态设置。
 *
 * 分两步：`resolveRenderState()` 把描述（可能带缺省值）解析成纯数字/布尔的最终状态，
 * `applyRenderState()` 再把它写进 {@link GlStateCache}。
 * 这样状态解析只做一次（创建管线时），每帧只做廉价的前后比较。
 *
 * 注意拓扑不从状态里读：GL 的图元模式是 draw 调用的参数，不是状态。
 *
 * 模板（stencil）这一段与 WebGPU 侧的 `WebGPURenderState.toGPUDepthStencilState()` 一一对应：
 * 正面/背面各自的 `compare` / `failOp` / `depthFailOp` / `passOp`，加上 `stencilReadMask` /
 * `stencilWriteMask` 全部落到 GL 的 `*Separate` 入口上（GLES 3.0 支持双面模板，
 * 单面的 `stencilFunc` / `stencilOp` / `stencilMask` 表达不了 WebGPU 的双面状态）。
 * 两边对「不使用深度/模板」的解析形状也刻意保持一致，详见 {@link resolveRenderState}。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { ColorWriteMask, STENCIL_FACE_DEFAULT } from '../../core/pipeline/RenderState.js';
import type { CompareFunction } from '../../core/enums/CompareFunction.js';
import type { StencilOperation } from '../../core/enums/StencilOperation.js';
import type { StencilFaceState } from '../../core/pipeline/RenderState.js';
import type { RenderPipelineDescriptor } from '../../core/pipeline/RenderPipeline.js';
import {
  GL_BLEND_FACTORS,
  GL_BLEND_OPERATIONS,
  GL_COMPARE_FUNCS,
  GL_CULL_FACES,
  GL_FRONT_FACES,
  GL_STENCIL_OPS,
} from '../utils/glEnumMap.js';
import type { GlStateCache, GlStencilFaceState } from '../utils/glStateCache.js';

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
  /**
   * 正面的模板比较与三种操作（GL 枚举）。
   *
   * `stencilEnabled` 为 false 时这里是「恒通过 + keep」的中性值（与 WebGPU 侧对
   * 「不使用深度/模板」的处理同形），**不是**描述里可能残留的模板配置 —— 不使用模板时
   * 那些字段不生效，如实关掉才是对的。
   */
  stencilFront: GlStencilFaceState;
  /** 背面的模板比较与三种操作（GL 枚举）；与 {@link stencilFront} 完全独立。 */
  stencilBack: GlStencilFaceState;
  /** 读掩码（与参考值、模板值相与后比较）。 */
  stencilReadMask: number;
  /** 写掩码。 */
  stencilWriteMask: number;
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
  const stencilEnabled = depthRequested && target.stencil;

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

  /*
   * 模板：真正用到时才解析描述里的字段，否则给中性值。
   *
   * 中性值（`always` + 三个 `keep` + 读掩码全 1 + 写掩码 0）与 WebGPU 的
   * `toGPUDepthStencilState()` 在「不使用深度/模板」时给出的形状**逐字段一致**：
   * 两边的解析结果因此可以直接对照，也保证「不使用」不会退化成描述里残留的某个模板配置
   * （那种退化没有任何报错，只有画面是错的）。
   */
  const stencil = stencilEnabled
    ? {
        front: stencilFace(depth?.stencilFront, 'stencilFront'),
        back: stencilFace(depth?.stencilBack, 'stencilBack'),
        readMask: stencilMask(depth?.stencilReadMask, 'stencilReadMask', 0xffff_ffff),
        writeMask: stencilMask(depth?.stencilWriteMask, 'stencilWriteMask', 0xffff_ffff),
      }
    : {
        front: stencilFace(undefined, 'stencilFront'),
        back: stencilFace(undefined, 'stencilBack'),
        readMask: 0xffff_ffff,
        writeMask: 0,
      };

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
    stencilEnabled,
    stencilFront: stencil.front,
    stencilBack: stencil.back,
    stencilReadMask: stencil.readMask,
    stencilWriteMask: stencil.writeMask,
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
  // 模板引用值是运行时状态（`setStencilReference`），所以在这里和解析好的模板状态一起写入。
  // 注意引用值必须**真的传进 `stencilFuncSeparate`**：它是「模板值 == 参考值」这类比较的另一半，
  // 丢了它 `compare: 'equal'` 就永远不成立（或者恒成立），而且是静默的。
  cache.setStencilTest({
    enabled: state.stencilEnabled,
    reference: stencilReference,
    front: state.stencilFront,
    back: state.stencilBack,
    readMask: state.stencilReadMask,
    writeMask: state.stencilWriteMask,
  });
  cache.setCull(state.cullEnabled, state.cullFace, state.frontFace);
}

/** 把 core 的单面模板描述解析成 GL 枚举；缺省值取 {@link STENCIL_FACE_DEFAULT}。 */
function stencilFace(face: StencilFaceState | undefined, path: string): GlStencilFaceState {
  return {
    compare: stencilCompare(face?.compare ?? STENCIL_FACE_DEFAULT.compare, `${path}.compare`),
    failOp: stencilOperation(face?.failOp ?? STENCIL_FACE_DEFAULT.failOp, `${path}.failOp`),
    depthFailOp: stencilOperation(face?.depthFailOp ?? STENCIL_FACE_DEFAULT.depthFailOp, `${path}.depthFailOp`),
    passOp: stencilOperation(face?.passOp ?? STENCIL_FACE_DEFAULT.passOp, `${path}.passOp`),
  };
}

function stencilCompare(value: CompareFunction, path: string): number {
  const resolved = GL_COMPARE_FUNCS[value];
  if (resolved === undefined) {
    throw new ValidationError(`[gpu-device-api] 未知的模板比较函数「${value}」（${path}）。`);
  }
  return resolved;
}

function stencilOperation(value: StencilOperation, path: string): number {
  const resolved = GL_STENCIL_OPS[value];
  if (resolved === undefined) {
    throw new ValidationError(`[gpu-device-api] 未知的模板操作「${value}」（${path}）。`);
  }
  return resolved;
}

/**
 * 模板掩码：与 WebGPU 一样是 32 位无符号整数，超范围就明确报错，不静默截断。
 *
 * ⚠️ WebGPU 的默认掩码是 `0xffffffff`，而 GLES 3.0 的模板缓冲在
 * `depth24plus-stencil8` 上只有 8 位：GL 自己会把掩码与 `2^s - 1` 相与，所以传 `0xffffffff`
 * 与传 `0xff` 在 GL 上是同一件事。这是**可表达的**差异（GL 负责截断），不是缺陷，
 * 也不需要在这里报错或改写用户给的值 —— 详见 `docs/backend-limits.md`。
 */
function stencilMask(value: number | undefined, path: string, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new ValidationError(
      `[gpu-device-api] 模板掩码 ${path} 必须是 0..0xffffffff 之间的整数，实际是 ${String(value)}。`,
    );
  }
  return value;
}

function factor(value: string, path: string): number {
  const resolved = GL_BLEND_FACTORS[value as keyof typeof GL_BLEND_FACTORS];
  if (resolved === undefined) {
    throw new ValidationError(`[gpu-device-api] 未知的混合因子「${value}」（${path}）。`);
  }
  return resolved;
}
