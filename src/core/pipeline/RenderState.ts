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
export const ColorWriteMask = {
  None: 0x0,
  Red: 0x1,
  Green: 0x2,
  Blue: 0x4,
  Alpha: 0x8,
  All: 0xf,
} as const;

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
   */
  format?: TextureFormat;
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

/* ------------------------------------------------------------------ 默认值与预设 --------- */

export const DEFAULT_PRIMITIVE_STATE: Required<Pick<PrimitiveState, 'topology' | 'frontFace' | 'cullMode'>> = {
  topology: 'triangle-list',
  frontFace: 'ccw',
  cullMode: 'none',
};

export const DEFAULT_DEPTH_STATE = {
  depthWriteEnabled: true,
  depthCompare: 'less' as CompareFunction,
};

export const DEFAULT_BLEND_COMPONENT: BlendComponent = {
  srcFactor: 'one',
  dstFactor: 'zero',
  operation: 'add',
};

export const STENCIL_FACE_DEFAULT: Required<StencilFaceState> = {
  compare: 'always',
  failOp: 'keep',
  depthFailOp: 'keep',
  passOp: 'keep',
};

/** 按预设名索引的现成 blend 状态。 */
export const BLEND_PRESETS: Readonly<Record<string, BlendState>> = Object.freeze({
  /** 直通 alpha：`rgb * a + dst * (1 - a)`。 */
  alpha: {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  },
  /** 预乘 alpha：`src + dst * (1 - a)`。 */
  premultiplied: {
    color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  },
  additive: {
    color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
  },
  multiply: {
    color: { srcFactor: 'dst', dstFactor: 'zero', operation: 'add' },
    alpha: { srcFactor: 'dst-alpha', dstFactor: 'zero', operation: 'add' },
  },
  screen: {
    color: { srcFactor: 'one', dstFactor: 'one-minus-src', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  },
});

/** 将预设名或完整状态解析为 {@link BlendState}。 */
export function resolveBlendState(blend: BlendState | keyof typeof BLEND_PRESETS | false | undefined): BlendState | null {
  if (blend === false || blend === undefined) return null;
  if (typeof blend === 'string') {
    const preset = BLEND_PRESETS[blend];
    if (!preset) throw new Error(`[gpu-device-api] Unknown blend preset "${blend}".`);
    return preset;
  }
  return blend;
}
