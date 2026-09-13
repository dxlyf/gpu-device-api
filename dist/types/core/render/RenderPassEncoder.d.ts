/** render pass 录制。对应 WebGPU 的 `GPURenderPassEncoder`。 */
import type { IndexFormat } from '../enums/IndexFormat.js';
import type { BindGroup } from '../binding/BindGroup.js';
import type { RenderPipeline } from '../pipeline/RenderPipeline.js';
import type { Buffer } from '../resources/Buffer.js';
import type { QuerySet } from '../resources/QuerySet.js';
import type { ColorAttachment, Color, DepthStencilAttachment, RenderTarget } from './RenderTarget.js';
import type { DrawDescriptor, DrawIndexedDescriptor, DrawIndirectDescriptor } from './DrawCommands.js';
import type { BufferLike } from './CommandEncoder.js';
export interface RenderPassDescriptor {
    label?: string;
    colorAttachments: readonly (ColorAttachment | null)[];
    depthStencilAttachment?: DepthStencilAttachment | null;
    /** 便捷方式：直接由一个 render target 生成两份 attachment 列表。 */
    target?: RenderTarget;
    occlusionQuerySet?: QuerySet;
    /** 使用 `target` 时应用的清除值。 */
    clearValue?: Color;
    depthClearValue?: number;
}
export interface RenderPassEncoder {
    readonly label: string;
    readonly ended: boolean;
    setPipeline(pipeline: RenderPipeline): void;
    /**
     * 绑定 bind group。对声明了 `hasDynamicOffset` 的条目（uniform 环形分配），
     * 必须提供 `dynamicOffsets`。
     */
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
    /** 结束该 pass。此后再提交命令会抛错。 */
    end(): void;
}
//# sourceMappingURL=RenderPassEncoder.d.ts.map