/**
 * core 枚举到 WebGL2 常量的映射。
 *
 * 大部分映射是「一个字符串对应一个 GL 常量」的直接查表；少数在 WebGL2 上无法表达的组合
 * （storage buffer、storage texture、非零 `baseVertex`、非零 `firstInstance`）会抛
 * {@link ValidationError} 并说明原因，绝不静默降级成错误的绘制结果。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import type { AddressMode } from '../../core/enums/AddressMode.js';
import type { BlendFactor } from '../../core/enums/BlendFactor.js';
import type { BlendOperation } from '../../core/enums/BlendOperation.js';
import type { CompareFunction } from '../../core/enums/CompareFunction.js';
import type { CullMode } from '../../core/enums/CullMode.js';
import type { FilterMode } from '../../core/enums/FilterMode.js';
import type { FrontFace } from '../../core/enums/FrontFace.js';
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { PrimitiveTopology } from '../../core/enums/PrimitiveTopology.js';
import type { StencilOperation } from '../../core/enums/StencilOperation.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import { vertexFormatInfo, type VertexFormat } from '../../core/enums/VertexFormat.js';
import type { Color } from '../../core/render/RenderTarget.js';

/** 拓扑到 GL 图元模式。strip 拓扑在 WebGL2 下不需要 `stripIndexFormat`。 */
export const GL_PRIMITIVE_MODES: Readonly<Record<PrimitiveTopology, number>> = {
  'point-list': 0x0000, // POINTS
  'line-list': 0x0001, // LINES
  'line-strip': 0x0003, // LINE_STRIP
  'triangle-list': 0x0004, // TRIANGLES
  'triangle-strip': 0x0005, // TRIANGLE_STRIP
};

export const GL_COMPARE_FUNCS: Readonly<Record<CompareFunction, number>> = {
  never: 0x0200,
  less: 0x0201,
  equal: 0x0202,
  'less-equal': 0x0203,
  greater: 0x0204,
  'not-equal': 0x0205,
  'greater-equal': 0x0206,
  always: 0x0207,
};

export const GL_BLEND_FACTORS: Readonly<Record<BlendFactor, number>> = {
  zero: 0x0000,
  one: 0x0001,
  src: 0x0300,
  'one-minus-src': 0x0301,
  'src-alpha': 0x0302,
  'one-minus-src-alpha': 0x0303,
  dst: 0x0304,
  'one-minus-dst': 0x0305,
  'dst-alpha': 0x0306,
  'one-minus-dst-alpha': 0x0307,
  'src-alpha-saturated': 0x0308,
  constant: 0x8001,
  'one-minus-constant': 0x8002,
};

export const GL_BLEND_OPERATIONS: Readonly<Record<BlendOperation, number>> = {
  add: 0x8006,
  subtract: 0x800a,
  'reverse-subtract': 0x800b,
  min: 0x8007,
  max: 0x8008,
};

/**
 * `StencilOperation` → GL 常量，供 `gl.stencilOpSeparate(face, sfail, dpfail, dppass)` 使用。
 *
 * 逐项与 GLES 3.0 的常量核对过：容易抄错的不是 `keep` / `replace` / 两个 clamp（它们连号），
 * 而是 `zero`（0x0000，不是 1e0x 系列）、`invert`（0x150a）以及两个 wrap（0x8507 / 0x8508）。
 *
 * ⚠️ 这张表曾经定义了却没有任何调用方 —— 因为 WebGL2 后端把整个模板状态丢掉了
 * （只下发硬编码的 `stencilFunc(ALWAYS, ref, 0xff)`）。现在它由
 * `WebGL2RenderState.resolveRenderState()` 解析、`GlStateCache.setStencilTest()` 下发。
 */
export const GL_STENCIL_OPS: Readonly<Record<StencilOperation, number>> = {
  keep: 0x1e00,
  zero: 0x0000,
  replace: 0x1e01,
  invert: 0x150a,
  'increment-clamp': 0x1e02,
  'decrement-clamp': 0x1e03,
  'increment-wrap': 0x8507,
  'decrement-wrap': 0x8508,
};

export const GL_CULL_FACES: Readonly<Record<Exclude<CullMode, 'none'>, number>> = {
  front: 0x0404,
  back: 0x0405,
};

export const GL_FRONT_FACES: Readonly<Record<FrontFace, number>> = {
  ccw: 0x0901,
  cw: 0x0900,
};

export const GL_ADDRESS_MODES: Readonly<Record<AddressMode, number>> = {
  'clamp-to-edge': 0x812f,
  repeat: 0x2901,
  'mirror-repeat': 0x8370,
};

export const GL_FILTERS: Readonly<Record<FilterMode, number>> = {
  nearest: 0x2600,
  linear: 0x2601,
};

/** 索引类型：`uint16` 与 `uint32` 都是 GL 的顶点索引类型。 */
export const GL_INDEX_TYPES: Readonly<Record<IndexFormat, number>> = {
  uint16: 0x1403, // UNSIGNED_SHORT
  uint32: 0x1405, // UNSIGNED_INT
};

export interface GlVertexAttributeInfo {
  /** `vertexAttribPointer` / `vertexAttribIPointer` 的 size 参数。 */
  readonly size: 1 | 2 | 3 | 4;
  /** 组件类型。 */
  readonly type: number;
  /** 是否归一化（整数格式读成浮点）。 */
  readonly normalized: boolean;
  /** 浮点属性走 `vertexAttribPointer`，整数属性必须走 `vertexAttribIPointer`。 */
  readonly integer: boolean;
}

const GL_UNSIGNED_BYTE = 0x1401;
const GL_BYTE = 0x1400;
const GL_UNSIGNED_SHORT = 0x1403;
const GL_SHORT = 0x1402;
const GL_UNSIGNED_INT = 0x1405;
const GL_INT = 0x1404;
const GL_FLOAT = 0x1406;
const GL_HALF_FLOAT = 0x140b;

/**
 * 顶点格式前缀到 GL 组件的映射。
 *
 * 格式名本身就编码了「组件类型 + 是否归一化」，所以按前缀查表即可，
 * 比按字节数反推可靠得多（`unorm8x4` 与 `sint8x4` 的字节数完全相同，但 GL 参数完全相反）。
 */
const VERTEX_COMPONENTS: Readonly<Record<string, { type: number; normalized: boolean; integer: boolean }>> = {
  float32: { type: GL_FLOAT, normalized: false, integer: false },
  float16: { type: GL_HALF_FLOAT, normalized: false, integer: false },
  unorm8: { type: GL_UNSIGNED_BYTE, normalized: true, integer: false },
  snorm8: { type: GL_BYTE, normalized: true, integer: false },
  uint8: { type: GL_UNSIGNED_BYTE, normalized: false, integer: true },
  sint8: { type: GL_BYTE, normalized: false, integer: true },
  unorm16: { type: GL_UNSIGNED_SHORT, normalized: true, integer: false },
  snorm16: { type: GL_SHORT, normalized: true, integer: false },
  uint16: { type: GL_UNSIGNED_SHORT, normalized: false, integer: true },
  sint16: { type: GL_SHORT, normalized: false, integer: true },
  uint32: { type: GL_UNSIGNED_INT, normalized: false, integer: true },
  sint32: { type: GL_INT, normalized: false, integer: true },
};

const VERTEX_FORMAT_PATTERN = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;

/**
 * 顶点属性格式到 `vertexAttribPointer` / `vertexAttribIPointer` 参数的映射。
 *
 * 注意：整数格式（`uint32x2` 这类）必须用 `vertexAttribIPointer`，
 * 用 `vertexAttribPointer` 会得到 `INVALID_OPERATION`。
 */
export function glVertexAttribute(format: VertexFormat): GlVertexAttributeInfo {
  const match = VERTEX_FORMAT_PATTERN.exec(format);
  if (!match) {
    throw new ValidationError(`[gpu-device-api] WebGL2 后端不认识顶点格式「${format}」。`);
  }
  const components = VERTEX_COMPONENTS[match[1]!];
  if (!components) {
    throw new ValidationError(`[gpu-device-api] WebGL2 后端不认识顶点格式「${format}」。`);
  }
  const info = vertexFormatInfo(format);
  return {
    size: info.components,
    type: components.type,
    normalized: components.normalized,
    integer: components.integer,
  };
}

/** 采样器的比较函数；`undefined` 表示普通采样器（`TEXTURE_COMPARE_MODE = NONE`）。 */
export function glCompareFunc(compare: CompareFunction | undefined): number | null {
  if (compare === undefined) return null;
  return GL_COMPARE_FUNCS[compare];
}

/**
 * 解析 core 的 {@link Color} 为 GL 清屏用的 `[r, g, b, a]`（0..1 浮点）。
 * 支持 CSS 十六进制字符串、`rgb()/rgba()`、少量颜色名、`0xRRGGBB`、数组与对象。
 */
export function resolveClearColor(color: Color | undefined): [number, number, number, number] {
  if (color === undefined) return [0, 0, 0, 1];
  if (typeof color === 'number') {
    return [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255, 1];
  }
  if (typeof color === 'string') return parseCssColor(color);
  if (Array.isArray(color) || ArrayBuffer.isView(color)) {
    const list = color as ArrayLike<number>;
    return [list[0] ?? 0, list[1] ?? 0, list[2] ?? 0, list[3] ?? 1];
  }
  const value = color as { r: number; g: number; b: number; a?: number };
  return [value.r, value.g, value.b, value.a ?? 1];
}

const NAMED_COLORS: Readonly<Record<string, [number, number, number, number]>> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [1, 1, 1, 1],
  red: [1, 0, 0, 1],
  green: [0, 0.5019607843137255, 0, 1],
  lime: [0, 1, 0, 1],
  blue: [0, 0, 1, 1],
  yellow: [1, 1, 0, 1],
  cyan: [0, 1, 1, 1],
  aqua: [0, 1, 1, 1],
  magenta: [1, 0, 1, 1],
  fuchsia: [1, 0, 1, 1],
  gray: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  grey: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  silver: [0.7529411764705882, 0.7529411764705882, 0.7529411764705882, 1],
  orange: [1, 0.6470588235294118, 0, 1],
  purple: [0.5019607843137255, 0, 0.5019607843137255, 1],
  navy: [0, 0, 0.5019607843137255, 1],
  teal: [0, 0.5019607843137255, 0.5019607843137255, 1],
};

function parseCssColor(input: string): [number, number, number, number] {
  const text = input.trim().toLowerCase();
  const named = NAMED_COLORS[text];
  if (named) return named;

  if (text.startsWith('#')) {
    const value = text.slice(1);
    const expand = (part: string) => parseInt(part + part, 16) / 255;
    if (/^[0-9a-f]+$/.test(value)) {
      if (value.length === 3 || value.length === 4) {
        return [expand(value[0]!), expand(value[1]!), expand(value[2]!), value.length === 4 ? expand(value[3]!) : 1];
      }
      if (value.length === 6 || value.length === 8) {
        const channel = (index: number) => parseInt(value.slice(index, index + 2), 16) / 255;
        return [channel(0), channel(2), channel(4), value.length === 8 ? channel(6) : 1];
      }
    }
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
  if (rgb) {
    const parts = rgb[1]!.split(/[,\s/]+/).filter(Boolean).map(Number);
    return [(parts[0] ?? 0) / 255, (parts[1] ?? 0) / 255, (parts[2] ?? 0) / 255, parts[3] ?? 1];
  }

  // 无法识别时抛错，避免悄悄画成全黑却查不出原因。
  throw new ValidationError(
    `[gpu-device-api] 无法解析颜色「${input}」。支持 CSS 十六进制、rgb()/rgba()、少量颜色名、0xRRGGBB、[r,g,b,a] 与 { r, g, b, a }。`,
  );
}

/** WebGL2 不支持 storage buffer / storage texture，统一在这里给出解释。 */
export function assertNoStorageBinding(kind: string, binding: number, group: number): never {
  throw new ValidationError(
    `[gpu-device-api] WebGL2 不支持 ${kind}（bind group ${group} 的 binding ${binding}）：` +
      'shader storage buffer / storage texture 需要 GLES 3.1 及以上，WebGL2 只有 GLES 3.0。' +
      '请把它移到 WebGPU 后端，或改用 uniform buffer + 纹理来传递数据。',
  );
}

/** 检查颜色附件格式能否作为颜色目标。 */
export function assertColorAttachmentFormat(format: TextureFormat): void {
  // 这里只做「明显不可能」的拦截，真正的能力检测交给 glCapabilities 里的扩展查询。
  if (format.startsWith('depth') || format === 'stencil8') {
    throw new ValidationError(
      `[gpu-device-api] 纹理格式「${format}」是深度/模板格式，不能作为颜色附件。`,
    );
  }
}
