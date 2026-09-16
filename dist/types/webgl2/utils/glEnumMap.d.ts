/**
 * core 枚举到 WebGL2 常量的映射。
 *
 * 大部分映射是「一个字符串对应一个 GL 常量」的直接查表；少数在 WebGL2 上无法表达的组合
 * （storage buffer、storage texture、非零 `baseVertex`、非零 `firstInstance`）会抛
 * {@link ValidationError} 并说明原因，绝不静默降级成错误的绘制结果。
 */
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
import { type VertexFormat } from '../../core/enums/VertexFormat.js';
import type { Color } from '../../core/render/RenderTarget.js';
/** 拓扑到 GL 图元模式。strip 拓扑在 WebGL2 下不需要 `stripIndexFormat`。 */
export declare const GL_PRIMITIVE_MODES: Readonly<Record<PrimitiveTopology, number>>;
export declare const GL_COMPARE_FUNCS: Readonly<Record<CompareFunction, number>>;
export declare const GL_BLEND_FACTORS: Readonly<Record<BlendFactor, number>>;
export declare const GL_BLEND_OPERATIONS: Readonly<Record<BlendOperation, number>>;
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
export declare const GL_STENCIL_OPS: Readonly<Record<StencilOperation, number>>;
export declare const GL_CULL_FACES: Readonly<Record<Exclude<CullMode, 'none'>, number>>;
export declare const GL_FRONT_FACES: Readonly<Record<FrontFace, number>>;
export declare const GL_ADDRESS_MODES: Readonly<Record<AddressMode, number>>;
export declare const GL_FILTERS: Readonly<Record<FilterMode, number>>;
/** 索引类型：`uint16` 与 `uint32` 都是 GL 的顶点索引类型。 */
export declare const GL_INDEX_TYPES: Readonly<Record<IndexFormat, number>>;
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
/**
 * 顶点属性格式到 `vertexAttribPointer` / `vertexAttribIPointer` 参数的映射。
 *
 * 注意：整数格式（`uint32x2` 这类）必须用 `vertexAttribIPointer`，
 * 用 `vertexAttribPointer` 会得到 `INVALID_OPERATION`。
 */
export declare function glVertexAttribute(format: VertexFormat): GlVertexAttributeInfo;
/** 采样器的比较函数；`undefined` 表示普通采样器（`TEXTURE_COMPARE_MODE = NONE`）。 */
export declare function glCompareFunc(compare: CompareFunction | undefined): number | null;
/**
 * 解析 core 的 {@link Color} 为 GL 清屏用的 `[r, g, b, a]`（0..1 浮点）。
 * 支持 CSS 十六进制字符串、`rgb()/rgba()`、少量颜色名、`0xRRGGBB`、数组与对象。
 */
export declare function resolveClearColor(color: Color | undefined): [number, number, number, number];
/** WebGL2 不支持 storage buffer / storage texture，统一在这里给出解释。 */
export declare function assertNoStorageBinding(kind: string, binding: number, group: number): never;
/** 检查颜色附件格式能否作为颜色目标。 */
export declare function assertColorAttachmentFormat(format: TextureFormat): void;
//# sourceMappingURL=glEnumMap.d.ts.map