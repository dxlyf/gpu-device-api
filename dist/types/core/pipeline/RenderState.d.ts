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
    /**
     * 只在「这条管线使用深度」时有意义：`depthWriteEnabled` / `depthCompare` 省略时落到
     * {@link DEFAULT_DEPTH_STATE}。
     *
     * ⚠️ `format` 为 `null`（或整个 `depthStencil` 都不声明）时，这两个字段**不生效** ——
     * 那条管线不使用深度，既不做深度测试也不写深度。
     */
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
/**
 * 「这条管线使用深度」而 `depthWriteEnabled` / `depthCompare` 没写时的缺省值。
 *
 * ⚠️ 它**只**适用于「`depthStencil` 已声明且 `format` 不为 `null`」的情形。
 * `depthStencil` 完全不声明、或写成 `{ format: null }`，含义都是「这条管线不使用深度/模板」：
 * 两个后端都必须如实关掉深度测试、并且绝不写深度，**绝不能**回落到这里的
 * `depthWriteEnabled: true`。
 *
 * 曾经的缺陷正是这里的回落造成的：一条声明 `{ format: null }` 的管线（画天空的全屏三角形，
 * `gl_Position` 的深度是 0）在 WebGPU 上照样拿到了「写深度 + `less`」，于是把整个深度缓冲写成 0，
 * 其后所有几何体的 `less` 判定全部失败、画面上只剩它自己，而且没有任何报错。
 * WebGL2 侧一直把这种情况解释为「关掉深度测试」，所以症状只在 WebGPU 上出现。
 */
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