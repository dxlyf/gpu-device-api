/**
 * WebGL2 的队列。
 *
 * **时序契约（务必与 `core/sync/Queue.ts` 的说明一起看）**：
 * `writeBuffer` 在 WebGL2 上是**立即生效**的，而 WebGPU 是「在之后提交的命令执行前生效」。
 * 两者只在「同一帧内对同一 buffer 的同一区间写两次再分别 draw」时才会产生差异。
 * 规避方式是 uniform arena + 动态偏移：每次 draw 用独立区间，两个后端结果完全一致。
 *
 * `submit()` 在 WebGL2 上没有实际工作（命令在录制时就执行了），它存在的意义是
 * 保持调用点一致，并作为「本帧结束」的语义锚点。
 */
import type { Queue, ExternalImageSource, CopyExternalImageOptions } from '../../core/sync/Queue.js';
import type { Buffer } from '../../core/resources/Buffer.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
export declare class WebGL2Queue implements Queue {
    readonly label: string;
    private readonly gl;
    private readonly state;
    private submittedCount;
    private pending;
    /**
     * 零拷贝路径的兜底暂存区（惰性分配）。
     *
     * 只在「传给 `writeTexture` 的视图起点不在元素边界上」时才需要搬一次内存
     * （例如 `Uint8Array` 的 `subarray(2, ...)` 交给 `rgba32float`）。正常情况下
     * `ArrayBufferView` → `TypedArray` 是零拷贝重解释，这块内存直到用上之前都不分配。
     */
    private scratch;
    constructor(gl: WebGL2RenderingContext, state: GlStateCache);
    /** 已提交的 command buffer 数量（用于测试与统计）。 */
    get submitted(): number;
    /**
     * 把主机端数据写进 buffer。
     *
     * ## `#15`：元素对齐校验与 WebGPU 对齐（改前 WebGL2 没有）
     *
     * core 的契约里 `dataOffset` / `size` 是**字节**，而 WebGPU 原生接口在 `data` 是 TypedArray 时
     * 按**元素**计，所以 `WebGPUQueue` 必须要求两者都是元素大小的倍数（否则换算出来的元素数
     * 不是整数，原生实现会直接抛）。改前 WebGL2 不检查这一条：`new Uint8Array(data.buffer,
     * byteOffset + 2)` 这种「起点落在元素中间」的视图照样能上传 —— 于是**同一段代码在 WebGL2 上
     * 通、在 WebGPU 上抛**，而在 WebGL2 上拿到的是一份半错位的重解释数据。
     *
     * 现在这里先做与 `WebGPUQueue.writeBuffer` **逐字相同**的检查（注意：报告的是**字节**数，
     * 因为 core 契约里这两个参数就是字节），再走本后端的补齐上传。
     */
    writeBuffer(buffer: Buffer, bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number): void;
    writeTexture(destination: TextureCopyView, data: ArrayBufferView, layout: TexelCopyBufferLayout, size: Extent3D): void;
    copyExternalImageToTexture(source: ExternalImageSource, destination: TextureCopyView, copySize: Extent3D, flipY?: boolean, options?: CopyExternalImageOptions): void;
    copyBufferToBuffer(source: Buffer, sourceOffset: number, destination: Buffer, destinationOffset: number, size: number): void;
    /**
     * `copyBufferToTexture`：先按**完整布局**（含 `rowsPerImage`）把源 buffer 读出来，
     * 再交给 {@link writeTexture} 上传。
     *
     * 为什么读这么多：`texSubImage3D` 一次要吃下整叠 image，层与层之间有 `rowsPerImage`
     * 这么大的间隔 —— 「每层各读一次、各上传一次」也可以，但那样每次 `texSubImage3D` 都得
     * 带上 `UNPACK_SKIP_IMAGES` 之类的状态，比一次读完更容易出错，而且 GPU 侧调用次数翻倍。
     */
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    submit(commandBuffers: readonly CommandBuffer[]): void;
    onSubmittedWorkDone(): Promise<void>;
    /**
     * 取（必要时分配）零拷贝路径的兜底暂存区。
     *
     * 惰性分配的理由：绝大多数上传的视图起点本来就是元素对齐的（`new Uint8Array(...)`、
     * `TypedArray` 的 `subarray` 也只按元素切），那条路径完全不需要这块内存。
     */
    private uploadScratch;
}
//# sourceMappingURL=WebGL2Queue.d.ts.map