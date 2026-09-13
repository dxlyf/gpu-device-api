/** A render pipeline: shaders plus the fixed-function state they run with. */

import type { Disposable } from '../../utils/Disposable.js';
import type { PipelineLayout } from '../binding/PipelineLayout.js';
import type { ShaderModule } from '../resources/ShaderModule.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type {
  ColorTargetState,
  DepthStencilState,
  MultisampleState,
  PrimitiveState,
  RenderState,
} from './RenderState.js';
import type { VertexBufferLayout } from './VertexLayout.js';

export interface VertexState {
  module: ShaderModule;
  /** WGSL entry point name; defaults to `'vsMain'`. */
  entryPoint?: string;
  /**
   * Optional explicit vertex layouts. When omitted the backend derives them from the geometry at
   * the first draw, which lets one pipeline serve geometries with different interleavings.
   */
  buffers?: readonly VertexBufferLayout[];
}

export interface FragmentState {
  module: ShaderModule;
  /** WGSL entry point name; defaults to `'fsMain'`. */
  entryPoint?: string;
  /** Per-attachment state. Defaults to one target matching the render target's format. */
  targets?: readonly (ColorTargetState | null)[];
}

export interface RenderPipelineDescriptor {
  label?: string;
  /** Explicit layout, or `'auto'` to derive it from the bind groups in use. Defaults to `'auto'`. */
  layout?: PipelineLayout | 'auto';
  vertex: VertexState;
  /** Omit for depth-only pipelines. */
  fragment?: FragmentState;
  primitive?: PrimitiveState;
  depthStencil?: DepthStencilState;
  multisample?: MultisampleState;
  /**
   * Attachment formats the pipeline targets. When omitted, backends deduce them from the render
   * target at first use, which keeps pipelines reusable across targets.
   */
  colorFormats?: readonly TextureFormat[];
  /** Convenience bundle; individual fields above win over these. */
  render?: RenderState;
}

/** Extra state discovered at first use, part of the concrete pipeline cache key. */
export interface RenderPipelineVariant {
  colorFormats: readonly TextureFormat[];
  sampleCount: number;
  depthFormat: TextureFormat | null;
  vertexLayouts: readonly VertexBufferLayout[];
}

export interface RenderPipeline extends Disposable {
  readonly label: string;
  readonly descriptor: RenderPipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';
  /** Vertex layouts the pipeline was created with, when they were declared explicitly. */
  readonly vertexLayouts: readonly VertexBufferLayout[] | null;
  /**
   * True once a concrete backend pipeline exists. The WebGPU backend compiles lazily on the first
   * draw because it needs the vertex layouts and attachment formats.
   */
  readonly compiled: boolean;
  /** Native handle of the concrete pipeline; triggers compilation when needed. */
  readonly native: unknown;
  /** Resolves (and caches) the concrete pipeline for one target/variant. */
  resolve(variant?: Partial<RenderPipelineVariant>): unknown;
}
