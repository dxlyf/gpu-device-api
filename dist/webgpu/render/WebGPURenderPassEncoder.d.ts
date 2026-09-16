/**
 * WebGPU render pass 录制：`RenderPassEncoder` 接口在 `GPURenderPassEncoder` 上的实现。
 *
 * 本文件还负责 core `RenderPassDescriptor` → WebGPU `GPURenderPassDescriptor` 的翻译
 * （{@link toGPURenderPassDescriptor}），因为「一个 pass 的 attachment 布局」同时决定了
 * pipeline variant 的 `colorFormats` / `sampleCount` / `depthFormat`，两者放在一起才不会走散。
 *
 * 关于 `setPipeline`：core 允许 pipeline 不声明 attachment 格式（这样才能跨 target 复用），
 * 所以这里把当前 pass 的实际布局交给 `WebGPURenderPipeline.resolve(variant)` 去查/建对应的
 * `GPURenderPipeline`。这也是 WebGPU 后端唯一「惰性编译」的触发点。
 */
import type { RenderPassDescriptor, RenderPassEncoder } from '../../core/render/RenderPassEncoder.js';
import type { Color } from '../../core/render/RenderTarget.js';
import type { DrawDescriptor, DrawIndexedDescriptor, DrawIndirectDescriptor } from '../../core/render/DrawCommands.js';
import type { BufferLike } from '../../core/render/CommandEncoder.js';
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { BindGroup } from '../../core/binding/BindGroup.js';
import type { RenderPipeline } from '../../core/pipeline/RenderPipeline.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
/** 一个 render pass 的 attachment 布局，pipeline variant 由它推导。 */
export interface WebGPURenderPassLayout {
    /**
     * **逐位置**的颜色附件格式：下标即 fragment output location，空位（`colorAttachments[i] === null`）
     * 为 `null`。长度等于 `colorAttachments.length`（尾部空位也占位）。
     *
     * 逐位置是必须的：`[view, null]` 与 `[null, view]` 需要的 `fragment.targets` 不同，
     * 压缩成密集列表会让两者撞同一个变体键（批 05 实测 `createRenderPipeline` 只调用 1 次）。
     */
    readonly colorFormats: readonly (TextureFormat | null)[];
    readonly depthFormat: TextureFormat | null;
    readonly sampleCount: number;
}
/**
 * 把 core 的 `RenderPassDescriptor` 翻译成 WebGPU 需要的形态，并顺带算出 pass 布局。
 *
 * - `target` 便捷字段优先：直接使用 `WebGPURenderTarget.createPassDescriptor()` 的结果；
 * - `loadOp` / `storeOp` 省略时按 `'clear'` / `'store'` 处理（`GPURenderPassColorAttachment`
 *   要求这两个字段必填，而 core 里它们是可选的）；
 * - 所有 attachment 的 sampleCount 必须一致（WebGPU 的硬性要求），否则这里直接报错；
 * - 多重采样 attachment 必须有 `resolveTarget`（或 `storeOp: 'discard'`）；
 * - `timestampWrites` 需要 `timestamp-query` 与 `timestamp-query-inside-passes`，缺一个就报错
 *   （见 {@link toGPUTimestampWrites}）。
 */
export declare function toGPURenderPassDescriptor(descriptor: RenderPassDescriptor, device: WebGPUDevice): {
    native: GPURenderPassDescriptor;
    layout: WebGPURenderPassLayout;
    /** 该 pass 是否声明了 occlusionQuerySet（决定 beginOcclusionQuery 是否可用）。 */
    hasOcclusionQuerySet: boolean;
};
export declare class WebGPURenderPassEncoder implements RenderPassEncoder {
    readonly label: string;
    readonly layout: WebGPURenderPassLayout;
    readonly native: GPURenderPassEncoder;
    private readonly device;
    private readonly onEnd;
    /** 该 pass 是否声明了 occlusionQuerySet；没声明时 beginOcclusionQuery 会明确报错。 */
    private readonly hasOcclusionQuerySet;
    private _ended;
    private occlusionQueryOpen;
    /**
     * 一个 pass 的 attachment 布局与 label 在生命周期内都不变，因此「pipeline variant 请求」
     * 与各处报错用的 context 字符串都在构造时建一次。
     *
     * 这些值原先每次 `setPipeline` / `setBindGroup` / `setVertexBuffer` 都会现拼：
     * 每 draw 一个对象 + 若干模板字符串，在几千个 draw 的帧里是纯浪费。
     */
    private readonly variantRequest;
    private readonly contextSetPipeline;
    private readonly contextSetBindGroup;
    private readonly contextSetVertexBuffer;
    private readonly contextSetIndexBuffer;
    private readonly contextDrawIndirect;
    private readonly contextDrawIndexedIndirect;
    constructor(device: WebGPUDevice, native: GPURenderPassEncoder, layout: WebGPURenderPassLayout, label: string, hasOcclusionQuerySet: boolean, onEnd?: () => void);
    get ended(): boolean;
    setPipeline(pipeline: RenderPipeline): void;
    setBindGroup(index: number, bindGroup: BindGroup | null, dynamicOffsets?: readonly number[]): void;
    setVertexBuffer(slot: number, buffer: Buffer | null, offset?: number, size?: number): void;
    setIndexBuffer(buffer: Buffer, format: IndexFormat, offset?: number, size?: number): void;
    setViewport(x: number, y: number, width: number, height: number, minDepth?: number, maxDepth?: number): void;
    setScissorRect(x: number, y: number, width: number, height: number): void;
    setBlendConstant(color: Color): void;
    setStencilReference(reference: number): void;
    draw(descriptor: DrawDescriptor): void;
    drawIndexed(descriptor: DrawIndexedDescriptor): void;
    drawIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    drawIndexedIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset?: number): void;
    /**
     * 开始一条遮挡查询：这一段里绘制的图元有多少采样通过深度/模板测试，就累加到
     * `descriptor.occlusionQuerySet` 的第 `index` 个计数器里。
     *
     * WebGPU 要求 pass 在创建时就声明 `occlusionQuerySet`，没声明就报错（原生也会报，
     * 但这里报得更早、说的更清楚）。
     */
    beginOcclusionQuery(index: number): void;
    /** 结束最近一次 {@link beginOcclusionQuery}。 */
    endOcclusionQuery(): void;
    /** 调试分组：直接转发给原生的 `GPURenderPassEncoder`（抓帧工具据此分组显示）。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
    end(): void;
    private assertOpen;
}
/** 把 `DrawIndirectDescriptor | BufferLike` 归一成 (buffer, offset)。 */
export declare function resolveIndirect(indirect: DrawIndirectDescriptor | BufferLike, indirectOffset: number, context: string): {
    buffer: GPUBuffer;
    offset: number;
};
//# sourceMappingURL=WebGPURenderPassEncoder.d.ts.map