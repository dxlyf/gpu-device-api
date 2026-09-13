/** 固定功能渲染状态：blend、depth/stencil、图元装配、多重采样。 */
import type { BlendFactor } from '../enums/BlendFactor.js';
import type { BlendOperation } from '../enums/BlendOperation.js';
import type { CompareFunction } from '../enums/CompareFunction.js';
import type { CullMode } from '../enums/CullMode.js';
import type { FrontFace } from '../enums/FrontFace.js';
import type { IndexFormat } from '../enums/IndexFormat.js';
import type { PrimitiveTopology } from '../enums/PrimitiveTopology.js';
import type { StencilOperation } from '../enums/StencilOperation.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
/** color attachment 的逐通道写掩码。位标志与 WebGPU 的 `GPUColorWrite` 一致。 */
export declare const ColorWriteMask: {
    readonly None: 0;
    readonly Red: 1;
    readonly Green: 2;
    readonly Blue: 4;
    readonly Alpha: 8;
    readonly All: 15;
};
export type ColorWriteMask = number;
export interface BlendComponent {
    srcFactor: BlendFactor;
    dstFactor: BlendFactor;
    operation?: BlendOperation;
}
export interface BlendState {
    color: BlendComponent;
    alpha: BlendComponent;
}
export interface ColorTargetState {
    format?: TextureFormat;
    blend?: BlendState;
    writeMask?: ColorWriteMask;
}
export interface StencilFaceState {
    compare?: CompareFunction;
    failOp?: StencilOperation;
    depthFailOp?: StencilOperation;
    passOp?: StencilOperation;
}
export interface DepthStencilState {
    /**
     * 可选：省略时，后端采用该 pipeline 首次使用时所用 render target 的 depth 格式，
     * 因此一个 pipeline 可以服务多个 target。
     * 传 `null` 表示这条管线**明确不要深度测试**（例如纯 2D 叠加）。
     */
    format?: TextureFormat | null;
    depthWriteEnabled?: boolean;
    depthCompare?: CompareFunction;
    depthBias?: number;
    depthBiasSlopeScale?: number;
    depthBiasClamp?: number;
    stencilFront?: StencilFaceState;
    stencilBack?: StencilFaceState;
    stencilReadMask?: number;
    stencilWriteMask?: number;
}
export interface PrimitiveState {
    topology?: PrimitiveTopology;
    /** WebGPU 对索引化的 strip 拓扑要求必须提供。 */
    stripIndexFormat?: IndexFormat;
    frontFace?: FrontFace;
    cullMode?: CullMode;
    /** 在 `depth-clip-control` feature 可用时关闭近平面裁剪。 */
    unclippedDepth?: boolean;
}
export interface MultisampleState {
    count?: number;
    mask?: number;
    alphaToCoverageEnabled?: boolean;
}
/** 上述各状态的组合，便于在多个 pipeline 之间共享状态。 */
export interface RenderState {
    primitive?: PrimitiveState;
    depthStencil?: DepthStencilState;
    multisample?: MultisampleState;
    blend?: BlendState;
    writeMask?: ColorWriteMask;
    colorFormats?: readonly TextureFormat[];
}
export declare const DEFAULT_PRIMITIVE_STATE: Required<Pick<PrimitiveState, 'topology' | 'frontFace' | 'cullMode'>>;
export declare const DEFAULT_DEPTH_STATE: {
    depthWriteEnabled: boolean;
    depthCompare: CompareFunction;
};
export declare const DEFAULT_BLEND_COMPONENT: BlendComponent;
export declare const STENCIL_FACE_DEFAULT: Required<StencilFaceState>;
/** 按预设名索引的现成 blend 状态。 */
export declare const BLEND_PRESETS: Readonly<Record<string, BlendState>>;
/** 将预设名或完整状态解析为 {@link BlendState}。 */
export declare function resolveBlendState(blend: BlendState | keyof typeof BLEND_PRESETS | false | undefined): BlendState | null;
//# sourceMappingURL=RenderState.d.ts.map