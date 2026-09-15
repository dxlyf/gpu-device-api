/** render pipeline：shader 及其运行时使用的固定功能状态。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { PipelineLayout } from '../binding/PipelineLayout.js';
import type { ShaderModule } from '../resources/ShaderModule.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { CompilationInfo, PrewarmOptions, PrewarmResult } from './CompilationInfo.js';
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
  /** WGSL 入口点名；默认为 `'vsMain'`。 */
  entryPoint?: string;
  /**
   * 顶点缓冲布局。**必须提供**：两个后端都要靠它建立属性指针
   * （WebGL2 用它建 VAO，WebGPU 用它建 `GPUVertexBufferLayout`），
   * 而 `setVertexBuffer(slot, buffer, offset, size)` 本身不携带属性布局，无从推导。
   *
   * 便捷层（`src/gfx`）会从几何体的属性描述自动生成这份布局；直接用 core 时请自己写。
   * 这与 WebGPU 的 `GPUVertexState.buffers` 是可选字段不同 —— 那是原生 API 才能在 draw 时
   * 靠 `GPURenderPipeline` 内部状态补齐，我们的抽象层没有这份信息。
   */
  buffers?: readonly VertexBufferLayout[];
}

export interface FragmentState {
  module: ShaderModule;
  /** WGSL 入口点名；默认为 `'fsMain'`。 */
  entryPoint?: string;
  /** 逐 attachment 的状态。默认是一个与 render target 格式匹配的 target。 */
  targets?: readonly (ColorTargetState | null)[];
}

export interface RenderPipelineDescriptor {
  label?: string;
  /** 显式 layout，或 `'auto'` 表示从在用的 bind group 推导。默认为 `'auto'`。 */
  layout?: PipelineLayout | 'auto';
  vertex: VertexState;
  /** 仅含 depth 的 pipeline 可省略。 */
  fragment?: FragmentState;
  primitive?: PrimitiveState;
  depthStencil?: DepthStencilState;
  multisample?: MultisampleState;
  /**
   * pipeline 目标的 attachment 格式。省略时，后端在首次使用时从 render target 推导，
   * 从而保持 pipeline 可跨 target 复用。
   */
  colorFormats?: readonly TextureFormat[];
  /** 便捷组合；上面的各单独字段优先于这里的值。 */
  render?: RenderState;
}

/** 首次使用时才发现的其他状态，属于具体 pipeline 的 cache key 的一部分。 */
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
  /** pipeline 创建时声明的 vertex layout（仅在显式声明时非空）。 */
  readonly vertexLayouts: readonly VertexBufferLayout[] | null;
  /**
   * 具体的后端 pipeline 存在后为 true。WebGPU 后端在第一次 draw 时惰性编译，
   * 因为它需要 vertex layout 和 attachment 格式。
   */
  readonly compiled: boolean;
  /** 具体 pipeline 的原生句柄；需要时会触发编译。 */
  readonly native: unknown;
  /** 解析（并缓存）某个 target/variant 对应的具体 pipeline。 */
  resolve(variant?: Partial<RenderPipelineVariant>): unknown;

  /**
   * **可选**：异步预热一个 variant 的管线，把编译/链接从「第一次用到它的那一帧」挪走。
   *
   * 语义与 `resolve(variant)` 完全一致（同一个 variant 只会编译一次，结果进同一份缓存），
   * 区别只在于**等待方式**：
   *
   * - 后端有异步能力时（WebGPU 的 `createRenderPipelineAsync`、WebGL2 的
   *   `KHR_parallel_shader_compile`）不会阻塞调用方；
   * - 没有时退化成同步，并在 {@link PrewarmResult.reason} 里**如实说明**缺什么，
   *   `mode` 会是 `'sync'` 而不是假装异步。
   *
   * 使用方式与 `resolve` 的关系：`prewarm({...variant})` 之后再 `resolve({...同一个 variant})`
   * 应当直接命中缓存、不再产生任何 GL / GPU 编译调用。这是「预热有效」的判据。
   *
   * 预热失败（着色器编译错误、超时）**不会**抛错：诊断在 {@link PrewarmResult.info} 里，
   * `ok` 为 false。想直接抛错请传 `{ throwOnError: true }`。
   *
   * 后端不支持该能力时这个成员不存在，调用方应当用 `pipeline.prewarm?.(...)` 的可选调用写法。
   */
  prewarm?(variant?: Partial<RenderPipelineVariant>, options?: PrewarmOptions): Promise<PrewarmResult>;

  /**
   * **可选**：取得该管线的编译诊断（每条 message 带 `type` / `lineNum` / `linePos`）。
   *
   * WebGPU 走 `GPUShaderModule.getCompilationInfo()`；WebGL2 走
   * `getShaderInfoLog()` / `getProgramInfoLog()` 的原文解析。拿不到的字段是 `null`。
   */
  getCompilationInfo?(variant?: Partial<RenderPipelineVariant>): Promise<CompilationInfo>;
}
