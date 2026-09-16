/** render pipeline：shader 及其运行时使用的固定功能状态。 */

import type { Disposable } from '../../utils/Disposable.js';
import { ValidationError } from '../errors/ValidationError.js';
import type { BindGroupLayout } from '../binding/BindGroupLayout.js';
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

/**
 * 一条管线可以接受的 `layout` 写法。
 *
 * ## 为什么不止 `PipelineLayout | 'auto'`（`#39`）
 *
 * 使用者手上最多的东西是 **`BindGroupLayout`** —— 各种 helper（例如 gfx 的
 * `createCompositeUniform()`）返回的都是它，而 `createBindGroup({ layout })` 收的也是它。
 * 只接受 `PipelineLayout` 的时候，「两条管线共用一份 layout」就必须额外手写一次
 * `device.createPipelineLayout({ bindGroupLayouts: [layout] })` 去包装（`examples/msaa-offscreen.ts`
 * 当初就是这么绕的），而那条包装一旦写错（比如 bind group index 与数组顺序不一致）不会报错，
 * 只会让绑定对不上。
 *
 * 这与原生 WebGPU 的形状一致：`GPUPipelineDescriptorBase.layout` 就是
 * `GPUPipelineLayout | GPUAutoLayoutMode`，而 `GPUPipelineLayoutDescriptor.bindGroupLayouts`
 * 是 layout 数组 —— 也就是说「一组 bind group layout」在原生里本来就是一个合法概念，
 * 只是它要么被包成 `GPUPipelineLayout`、要么内联在数组里。本库现在两种都收：
 *
 * | 写法 | 语义 |
 * | --- | --- |
 * | `'auto'`（默认） | 由后端从着色器反射推导（与改动前一致） |
 * | `PipelineLayout` | 直接用（与改动前一致） |
 * | `BindGroupLayout` | 等价于「只有一组」的 layout，即 `createPipelineLayout({ bindGroupLayouts: [它] })` |
 * | `readonly BindGroupLayout[]` | 按数组下标即 bind group index，等价于 `createPipelineLayout({ bindGroupLayouts })` |
 *
 * 后两种写法由**后端**在创建管线时合成一个 `PipelineLayout`（WebGL2 复用同一个
 * `BindingPlan` 推导路径，WebGPU 走 `createPipelineLayout`），合成的对象按设备资源追踪，
 * 与手写包装的生命周期相同。这是**公开 API 的放宽**：既有写法（`'auto'` / `PipelineLayout`）
 * 的类型与行为都没变。
 */
export type PipelineLayoutLike = PipelineLayout | BindGroupLayout | readonly BindGroupLayout[] | 'auto';

export interface RenderPipelineDescriptor {
  label?: string;
  /** 显式 layout；也接受单个 `BindGroupLayout` 或它的数组（见 {@link PipelineLayoutLike}）。默认为 `'auto'`。 */
  layout?: PipelineLayoutLike;
  vertex: VertexState;
  /** 仅含 depth 的 pipeline 可省略。 */
  fragment?: FragmentState;
  primitive?: PrimitiveState;
  /**
   * 深度/模板状态。**省略表示这条管线不使用深度/模板**（与 `{ format: null }` 同义）：
   * 两个后端都不会做深度测试、也不会写深度。
   *
   * 想用深度时至少声明这个对象（`format` 省略则由当前 render target 提供深度格式，
   * 于是同一条管线可以服务多个 target）：
   *
   * ```ts
   * depthStencil: { depthWriteEnabled: true, depthCompare: 'less' } // 用 target 的深度格式
   * depthStencil: { format: 'depth24plus', depthCompare: 'less' }   // 指定格式
   * depthStencil: { format: null }                                  // 明确不要深度
   * ```
   */
  depthStencil?: DepthStencilState;
  multisample?: MultisampleState;
  /**
   * pipeline 目标的 attachment 格式。省略时，后端在首次使用时从 render target 推导，
   * 从而保持 pipeline 可跨 target 复用。
   *
   * **逐位置**：下标即 fragment output location，空位（该 location 没有附件）写 `null`。
   * 通常写成密集列表（`['rgba8unorm', 'rgba16float']` 就是 location 0 / 1），
   * 只有确实要跳过某个 location 时才需要 `null` 占位（见
   * {@link RenderPipelineVariant.colorFormats}）。
   */
  colorFormats?: readonly (TextureFormat | null)[];
  /** 便捷组合；上面的各单独字段优先于这里的值。 */
  render?: RenderState;
}

/**
 * 归一化 `layout`：`'auto'` / `PipelineLayout` 原样返回，`BindGroupLayout`（或它的数组）
 * 交给后端合成一个 `PipelineLayout`。
 *
 * 放在 core 而不是各后端各写一份：两个后端必须对同一份 descriptor 得出**同一个**语义
 * （「一组布局」= 数组下标即 bind group index；单个布局 = 「只有一组」），
 * 否则「WebGL2 上跑得通、WebGPU 上绑定错位」这类差异就会从这里长出来。
 *
 * `synthesize` 由后端提供，返回值必须是**已经登记到设备上**的 layout（这样它与手写的
 * `createPipelineLayout()` 有完全相同的生命周期）；本函数只负责决定「要不要调用它」。
 */
export function resolvePipelineLayoutLike(
  layout: PipelineLayoutLike | undefined,
  synthesize: (bindGroupLayouts: readonly BindGroupLayout[]) => PipelineLayout,
  context: string,
): { layout: PipelineLayout | 'auto'; synthesized: PipelineLayout | null } {
  if (layout === undefined || layout === 'auto') return { layout: 'auto', synthesized: null };
  if (Array.isArray(layout)) {
    const bindGroupLayouts = layout as readonly BindGroupLayout[];
    // 空数组是明确的用法错误：「一个 bind group 都没有」应该写 'auto'（或干脆省略），
    // 而不是写一个空数组 —— 后者在 WebGPU 上会静默退化成「没有布局」。
    if (bindGroupLayouts.length === 0) {
      throw new ValidationError(
        `[gpu-device-api] ${context}: layout must not be an empty array; omit it (or pass 'auto') to let ` +
          'the backend infer the layout from the shader.',
      );
    }
    const synthesized = synthesize(bindGroupLayouts);
    return { layout: synthesized, synthesized };
  }
  if (isBindGroupLayoutLike(layout)) {
    const synthesized = synthesize([layout]);
    return { layout: synthesized, synthesized };
  }
  return { layout: layout as PipelineLayout, synthesized: null };
}

/**
 * 形状判断：`PipelineLayout` 与 `BindGroupLayout` 在 core 里都是接口（无运行时标记），
 * 因此按两者**独有的**成员区分：
 *
 * - `BindGroupLayout` 有 `entry(binding)` 与 `sortedEntries`；
 * - `PipelineLayout` 有 `bindGroupLayouts`（数组）与 `isAuto`。
 *
 * 拿不准时按 `PipelineLayout` 处理（保持改动前的行为：直接交给后端，由它给出它自己的报错）。
 */
function isBindGroupLayoutLike(
  value: PipelineLayout | BindGroupLayout | readonly BindGroupLayout[],
): value is BindGroupLayout {
  const candidate = value as unknown as Record<string, unknown>;
  if (typeof candidate.entry !== 'function' || !Array.isArray(candidate.sortedEntries)) return false;
  // `PipelineLayout` 也有 `bindGroupLayouts`：两者都像时以它是 pipeline layout 为准。
  return !Array.isArray(candidate.bindGroupLayouts);
}

/** 首次使用时才发现的其他状态，属于具体 pipeline 的 cache key 的一部分。 */
export interface RenderPipelineVariant {
  /**
   * 当前 render target 的颜色附件格式，**逐位置**：下标即 fragment output location，
   * 该 location 没有附件时是 `null`。
   *
   * ## 为什么必须是逐位置而不是「非空附件的密集列表」（公开语义变化）
   *
   * `RenderPassDescriptor.colorAttachments` 允许空位（`null` 表示该 location 的输出被丢弃，
   * 与原生 WebGPU 同一个语义），而**空位在哪个下标**是语义的一部分：
   * `[view, null]` 与 `[null, view]` 需要的 `fragment.targets` 分别是 `[state, null]` 与
   * `[null, state]`，也就是**两条不同的原生管线**。
   *
   * 改成逐位置之前，这一层只收非空格式，于是两者都变成 `['rgba8unorm']`：
   * 变体键相同 => 命中同一个缓存条目 => 两条布局拿到**同一条**原生管线
   * （实测 `createRenderPipeline` 只被调用 1 次），画面上表现为「附件错位」而没有任何报错。
   * 尾部的空位尤其隐蔽：`[a]` 与 `[a, null]` 也会撞成同一个变体。
   *
   * 因此：
   *
   * - **下标就是 location**，与原生 `GPUFragmentState.targets` / `GPURenderPassDescriptor.colorAttachments`
   *   的下标完全一致；
   * - `null` 表示「这个 location 没有附件」，后端会为该位置生成 `null` 的 target（输出被丢弃）；
   * - **尾部的 `null` 也是信息**（槽位数量不同就是不同的变体）。它不携带格式，但后端仍然
   *   按位置对齐（原生实测接受「管线 targets 比 pass 槽位短，只要多出来的槽位是空的」，
   *   而保留尾部空位同样被接受，见批 10 的原生探针）。
   *
   * 对既有代码来说这是**公开类型语义的变化**：密集列表的写法（`['rgba8unorm', 'rgba16float']`）
   * 含义不变（就是 location 0 / 1），只是列表元素类型放宽到 `TextureFormat | null`。
   * 类型上这是**放宽**（`readonly TextureFormat[]` 是它的子类型），但读取方必须按位置解释。
   */
  colorFormats: readonly (TextureFormat | null)[];
  sampleCount: number;
  /**
   * **当前 render target 的**深度附件格式，`null` 表示这次渲染通道没有深度附件。
   *
   * 它描述的是 target，不是「这条管线是否使用深度」：画布路径几乎总是带深度附件，
   * 所以一条明确声明 `depthStencil: { format: null }` 的管线一样会拿到非 null 的 `depthFormat`。
   * 是否使用深度只看 {@link RenderPipelineDescriptor.depthStencil}。
   */
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
