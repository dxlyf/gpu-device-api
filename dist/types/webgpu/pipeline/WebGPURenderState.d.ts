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
 * - `depthStencil`：depth 字段只在格式有 depth aspect 时写入，stencil 字段只在有 stencil
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
    readonly colorFormats?: readonly TextureFormat[];
    constructor(state: RenderState | undefined);
    /** 把 core 的 `PrimitiveState` 翻译为 WebGPU 的 `GPUPrimitiveState`。 */
    static toGPUPrimitiveState(state: PrimitiveState | undefined, features?: DeviceFeatures): GPUPrimitiveState;
    /**
     * 把 core 的 `DepthStencilState` 翻译为 WebGPU 的 `GPUDepthStencilState`。
     *
     * `format` 由调用方给出（core 允许省略，此时用 render target 的 depth 格式）。
     */
    static toGPUDepthStencilState(format: TextureFormat, state: DepthStencilState | undefined): GPUDepthStencilState;
    /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
    static toGPUMultisampleState(state: MultisampleState | undefined, sampleCount: number): GPUMultisampleState;
    /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
    static toGPUBlendState(blend: BlendState | undefined): GPUBlendState | undefined;
    /**
     * 组合出 `GPUFragmentState.targets`。
     *
     * `formats` 来自当前 variant（render target），`targets` 来自 pipeline descriptor；
     * 两者长度不一致时直接报错，因为那必然是用户的疏忽（WebGPU 的报错更难读）。
     */
    static toGPUColorTargets(formats: readonly TextureFormat[], targets: readonly (ColorTargetState | null)[] | undefined, defaults?: {
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