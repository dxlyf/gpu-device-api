/**
 * WebGPU 固定功能渲染状态：把 core 的 `RenderState` 翻译成 `GPURenderPipelineDescriptor` 的
 * 各个片段（primitive / depthStencil / multisample / color targets）。
 *
 * 之所以单独成类：WebGPU 的固定功能状态**烘焙进 pipeline**，所以同一份 `RenderState` 会被
 * 多个 pipeline（不同 attachment 格式 / sample count）复用；把这些翻译规则集中在这里，
 * `WebGPURenderPipeline` 就只需要关心 variant 与缓存。
 *
 * 几处与 WebGPU 校验规则直接相关的处理：
 * - `stripIndexFormat`：WebGPU 要求 strip 拓扑**必须**带该字段、非 strip 拓扑**必须不带**。
 *   core 允许省略，省略时按 `'uint32'` 处理（否则根本建不出 strip pipeline）。
 * - `depthStencil`：`depthStencil` 未声明、或 `format: null` 都表示「这条管线不使用深度/模板」，
 *   此时翻译成**恒通过、不写**的状态（`depthCompare: 'always'` + `depthWriteEnabled: false`），
 *   而不是 `DEFAULT_DEPTH_STATE`（理由见 `usesDepthStencil()` 与 `toGPUDepthStencilState()`）。
 *   真正使用深度时，depth 字段只在格式有 depth aspect 时写入，stencil 字段只在有 stencil
 *   aspect 时写入 —— WebGPU 不允许给没有对应 aspect 的格式设置这些字段。
 * - `unclippedDepth` 需要 `depth-clip-control` feature。
 */
import type { BlendState, ColorTargetState, DepthStencilState, MultisampleState, PrimitiveState, RenderState } from '../../core/pipeline/RenderState.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { DeviceFeatures } from '../../core/Device.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
/** strip 拓扑省略 `stripIndexFormat` 时使用的默认索引格式。 */
export declare const DEFAULT_STRIP_INDEX_FORMAT: "uint32";
export declare class WebGPURenderState implements RenderState {
    readonly primitive?: PrimitiveState;
    readonly depthStencil?: DepthStencilState;
    readonly multisample?: MultisampleState;
    readonly blend?: BlendState;
    readonly writeMask?: number;
    /** 逐位置的 attachment 格式（下标即 fragment output location，空位写 `null`）。 */
    readonly colorFormats?: readonly (TextureFormat | null)[];
    constructor(state: RenderState | undefined);
    /** 把 core 的 `PrimitiveState` 翻译为 WebGPU 的 `GPUPrimitiveState`。 */
    static toGPUPrimitiveState(state: PrimitiveState | undefined, features?: DeviceFeatures): GPUPrimitiveState;
    /**
     * 这条管线**是否使用 depth / stencil**（WebGPU 侧唯一的判定入口）。
     *
     * 语义（两个后端必须一致，WebGL2 的对应实现在 `WebGL2RenderState.resolveRenderState()`）：
     *
     * - `depthStencil` **未声明**：这条管线不使用深度/模板；
     * - `depthStencil: { format: null }`：同上，**明确**不使用（例如纯 2D 叠加、画天空的全屏三角形）；
     * - `depthStencil` 已声明且 `format` 不是 `null`（含省略 `format` 的写法）：使用深度/模板，
     *   此时缺省字段才落到 `DEFAULT_DEPTH_STATE`，深度格式由当前 render target 提供。
     *
     * 为什么必须集中成一个判断：`WebGPURenderPipeline` 在**两个地方**都要用它 —— 解析 variant 时
     * 校验「这条管线至少写了点什么」，以及真正翻译 `GPUDepthStencilState` 时决定用哪套字段
     * （见 {@link toGPUDepthStencilState}）。两处给不同答案就会退化成「静默写深度」那种缺陷。
     *
     * 为什么不能按「variant 里有 depth 格式」来判断是否使用深度：variant 的 depth 格式来自**当前
     * render target**，画布路径几乎总是带深度附件 —— 一条明确不要深度的管线照样会拿到
     * `depth24plus`。历史缺陷正是从这里来的：`{ format: null }` 落到了
     * `depthWriteEnabled: true` + `depthCompare: 'less'`，于是画天空的全屏三角形
     * （`gl_Position` 深度为 0）把整个深度缓冲写成 0，其后所有几何体的 `less` 全部失败，
     * 画面上只剩那一个元素、且**没有任何报错**。
     */
    static usesDepthStencil(state: DepthStencilState | undefined): boolean;
    /**
     * 把 core 的 `DepthStencilState` 翻译为 WebGPU 的 `GPUDepthStencilState`。
     *
     * `format` 由调用方给出（core 允许省略，此时用 render target 的 depth 格式）。
     *
     * **这条管线不使用深度**时（见 {@link usesDepthStencil}）不会返回 `null`，而是返回一个
     * 「恒通过、不写」的状态，理由有两条：
     *
     * 1. WebGPU 的 **attachment state** 要求管线与 render pass 的深度附件格式**一致**：pass 里有
     *    `depthStencilAttachment` 时，一条没有 `depthStencil` 状态的管线会直接校验失败
     *    （实测原文：`Attachment state of [RenderPipeline ...] is not compatible with
     *    [RenderPassEncoder ...]`，而且整条 command buffer 作废 —— 画面全黑、只在设备错误里看得到）。
     *    画布路径几乎总是带深度附件，所以「干脆不挂」这条路走不通。
     * 2. `depthCompare: 'always'` + `depthWriteEnabled: false` 与 GL 里**关掉 `DEPTH_TEST`** 完全等价：
     *    片元恒通过、且不更新深度缓冲。这正是 `{ format: null }` / 未声明 `depthStencil` 的语义，
     *    也修正了历史上「回落成 `depthWriteEnabled: true` + `less`」的缺陷（画天空的全屏三角形
     *    `gl_Position` 深度为 0，会把整个深度缓冲写成 0，其后所有几何体的 `less` 全部失败，
     *    画面上只剩它自己而且没有任何报错）。
     *
     * 模板面同理：`always` + `keep`（{@link STENCIL_FACE_DEFAULT}）等价于 GL 关掉 `STENCIL_TEST`。
     */
    static toGPUDepthStencilState(format: TextureFormat, state: DepthStencilState | undefined): GPUDepthStencilState;
    /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
    static toGPUMultisampleState(state: MultisampleState | undefined, sampleCount: number): GPUMultisampleState;
    /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
    static toGPUBlendState(blend: BlendState | undefined): GPUBlendState | undefined;
    /**
     * 组合出 `GPUFragmentState.targets`。
     *
     * `formats` 来自当前 variant（render target），**逐位置**：下标即 fragment output location，
     * 空位是 `null`（见 `RenderPipelineVariant.colorFormats`）。`targets` 来自 pipeline descriptor，
     * 形状与它逐位置对应。生成的原生数组同样是逐位置（每个位置都有一项，空位是 `null`）——
     * 原生实测接受两种形状（保留尾部空位、或只给到最后一个有输出的位置），这里选前者：
     * 位置信息完整保留，`[a, null]` 与 `[a]` 描述的就是两条不同的管线。
     *
     * `targets` 与 `formats` 的长度关系按**有效槽位**判定（有效槽位 = 最后一个非空格式的位置 + 1）：
     *
     * - `targets.length` 不能小于有效槽位数（有输出的位置必须有对应的 target 声明）；
     * - 也不能大于 `formats.length`（多出来的 target 没有位置可放）；
     * - 介于两者之间是允许的：`[a, null]` 的 pass 只声明一个 target
     *   （尾部空位不携带格式信息，把它的 target 省略掉是自然的写法）；
     * - 反过来，在**空位**处声明一个真实 target 会明确报错 —— 原生会以
     *   `Attachment state ... is not compatible`（或「该 location 没有 fragment 输出」）失败，
     *   而这里的报错能指出是哪一个 location。
     */
    static toGPUColorTargets(formats: readonly (TextureFormat | null)[], targets: readonly (ColorTargetState | null)[] | undefined, defaults?: {
        blend?: BlendState;
        writeMask?: number;
    }): (GPUColorTargetState | null)[];
    /** 校验并翻译 vertex buffer layout 列表。 */
    static toGPUVertexBufferLayouts(layouts: readonly VertexBufferLayout[], limits: {
        maxVertexAttributes: number;
        maxVertexBufferArrayStride: number;
        maxVertexBuffers: number;
    }): GPUVertexBufferLayout[];
}
//# sourceMappingURL=WebGPURenderState.d.ts.map