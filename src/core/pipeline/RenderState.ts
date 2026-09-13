/** Fixed-function render state: blend, depth/stencil, primitive assembly, multisampling. */

import type { BlendFactor } from '../enums/BlendFactor.js';
import type { BlendOperation } from '../enums/BlendOperation.js';
import type { CompareFunction } from '../enums/CompareFunction.js';
import type { CullMode } from '../enums/CullMode.js';
import type { FrontFace } from '../enums/FrontFace.js';
import type { IndexFormat } from '../enums/IndexFormat.js';
import type { PrimitiveTopology } from '../enums/PrimitiveTopology.js';
import type { StencilOperation } from '../enums/StencilOperation.js';
import type { TextureFormat } from '../enums/TextureFormat.js';

/** Per-channel write mask of a color attachment. Bit flags mirroring WebGPU's `GPUColorWrite`. */
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
   * Optional: when omitted the backend uses the depth format of the render target the pipeline is
   * first used with, so a single pipeline can serve several targets.
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
  /** Required by WebGPU for indexed strip topologies. */
  stripIndexFormat?: IndexFormat;
  frontFace?: FrontFace;
  cullMode?: CullMode;
  /** Disables near-plane clipping when the `depth-clip-control` feature is available. */
  unclippedDepth?: boolean;
}

export interface MultisampleState {
  count?: number;
  mask?: number;
  alphaToCoverageEnabled?: boolean;
}

/** Bundle of the states above, useful for sharing state between pipelines. */
export interface RenderState {
  primitive?: PrimitiveState;
  depthStencil?: DepthStencilState;
  multisample?: MultisampleState;
  blend?: BlendState;
  writeMask?: ColorWriteMask;
  colorFormats?: readonly TextureFormat[];
}

/* ------------------------------------------------------------------ defaults & presets --------- */

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

/** Ready-made blend states keyed by preset name. */
export const BLEND_PRESETS: Readonly<Record<string, BlendState>> = Object.freeze({
  /** Straight alpha: `rgb * a + dst * (1 - a)`. */
  alpha: {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  },
  /** Premultiplied alpha: `src + dst * (1 - a)`. */
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

/** Resolves a preset name or a full state into a {@link BlendState}. */
export function resolveBlendState(blend: BlendState | keyof typeof BLEND_PRESETS | false | undefined): BlendState | null {
  if (blend === false || blend === undefined) return null;
  if (typeof blend === 'string') {
    const preset = BLEND_PRESETS[blend];
    if (!preset) throw new Error(`[gpu-device-api] Unknown blend preset "${blend}".`);
    return preset;
  }
  return blend;
}
