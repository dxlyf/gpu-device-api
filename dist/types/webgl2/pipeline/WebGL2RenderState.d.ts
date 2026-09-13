/**
 * 把 core 的渲染状态翻译成一组可缓存的 GL 状态设置。
 *
 * 分两步：`resolveRenderState()` 把描述（可能带缺省值）解析成纯数字/布尔的最终状态，
 * `applyRenderState()` 再把它写进 {@link GlStateCache}。
 * 这样状态解析只做一次（创建管线时），每帧只做廉价的前后比较。
 *
 * 注意拓扑不从状态里读：GL 的图元模式是 draw 调用的参数，不是状态。
 */
import type { RenderPipelineDescriptor } from '../../core/pipeline/RenderPipeline.js';
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
export declare function resolveRenderState(descriptor: RenderPipelineDescriptor, target: {
    depth: boolean;
    stencil: boolean;
}): ResolvedRenderState;
/** 把解析好的状态写进 GL 状态缓存（内部会跳过没变化的设置）。 */
export declare function applyRenderState(cache: GlStateCache, state: ResolvedRenderState, stencilReference?: number): void;
//# sourceMappingURL=WebGL2RenderState.d.ts.map