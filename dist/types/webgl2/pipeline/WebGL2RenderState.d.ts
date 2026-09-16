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
import type { RenderPipelineDescriptor } from '../../core/pipeline/RenderPipeline.js';
import type { GlBlendState, GlStateCache, GlStencilFaceState } from '../utils/glStateCache.js';
/**
 * 解析好的混合分量（GL 枚举）。
 *
 * 直接别名到 {@link GlBlendState}（`GlStateCache.setBlend` 的去重键用的同一份字段清单），
 * 于是「解析结果」与「缓存比较的字段」在类型上是同一件事：往解析结果里加一个字段，
 * `GlStateCache.setBlend` 的编译期穷尽检查会立刻报错，不会被静默漏掉。
 */
export type ResolvedBlendState = GlBlendState;
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
export declare function resolveRenderState(descriptor: RenderPipelineDescriptor, target: {
    depth: boolean;
    stencil: boolean;
}): ResolvedRenderState;
/** 把解析好的状态写进 GL 状态缓存（内部会跳过没变化的设置）。 */
export declare function applyRenderState(cache: GlStateCache, state: ResolvedRenderState, stencilReference?: number): void;
//# sourceMappingURL=WebGL2RenderState.d.ts.map