/**
 * WebGL2 buffer 资源。
 *
 * ## 绑定目标是「一次性定死」的
 *
 * WebGL2 规定：一个 buffer 的绑定目标在**第一次绑定时确定，之后不能更改**。
 * Chrome / ANGLE 的实现会拒绝这两种操作，并给出 INVALID_OPERATION：
 *
 * - `buffers bound to non ELEMENT_ARRAY_BUFFER targets can not be bound to ELEMENT_ARRAY_BUFFER target`
 * - `element array buffers can not be bound to a different target`
 *
 * 连「先绑 `COPY_WRITE_BUFFER`、再解绑成 null、再绑 `ELEMENT_ARRAY_BUFFER`」也不行 ——
 * 目标一旦确定就是永久的。曾经这里把**所有** buffer 都绑到 `COPY_WRITE_BUFFER` 上做分配与上传，
 * 于是索引缓冲再也无法绑到 `ELEMENT_ARRAY_BUFFER`：VAO 里没有索引缓冲，
 * `drawElements*` 直接报 INVALID_OPERATION，索引几何体一个像素都画不出来。
 *
 * 因此现在按 `usage` 在创建时选好目标（见 {@link bindingTarget}）：
 * 声明了 `BufferUsage.Index` 的 buffer 用 `ELEMENT_ARRAY_BUFFER`，其余用 `COPY_WRITE_BUFFER`。
 * 索引缓冲因此只能当索引缓冲用（WebGL2 确实做不到「一个 buffer 两种用途」），
 * 误用时后端会给出明确的错误而不是静默画不出东西。
 *
 * ## 读写路径
 *
 * GL 没有 WebGPU 那样的 buffer 映射：`mapAsync` / `getMappedRange` / `unmap` 这里用
 * **CPU 影子内存** 实现 ——
 * - `read`：立即用 `getBufferSubData` 读回一段内存；
 * - `write`：先分配一段内存，`unmap()` 时用 `bufferSubData` 上传。
 *
 * 影子内存与 WebGPU 的映射内存语义要对齐（否则「同一份代码两个后端」会出现静默差异）：
 * - `getMappedRange()` 返回的是影子 `ArrayBuffer` 上的**视图**（部分范围是 `Uint8Array` 视图，
 *   不是 `slice()` 出来的副本），写进视图就等于写进影子内存，`unmap()` 上传时自然带上；
 * - `unmap()` 之后影子内存会被 detach（见 {@link detachShadow}），与 WebGPU 的
 *   `GPUBuffer.unmap()` 一样让之前取出的视图失效。
 *
 * 因此 `unmap()` 在 WebGL2 上是**同步生效**的，而 WebGPU 是队列时序。这个差异只影响
 * 「同一帧里改同一块 buffer 再重复读回」这种极端用法，正常的上传/读回流程两者一致。
 */
import { BufferUsage } from '../../core/enums/BufferUsage.js';
import type { Buffer, BufferDescriptor, MapMode, MappedRange } from '../../core/resources/Buffer.js';
import type { GlStateCache } from '../utils/glStateCache.js';
export declare class WebGL2Buffer implements Buffer {
    readonly label: string;
    readonly size: number;
    readonly usage: BufferUsage;
    readonly native: WebGLBuffer;
    /**
     * 该 buffer 的绑定目标（`ELEMENT_ARRAY_BUFFER` 或 `COPY_WRITE_BUFFER`）。
     *
     * WebGL2 里这个目标是**永久**的（见类注释），所以只能在创建时按 usage 定一次：
     * 声明了 `Index` 的 buffer 走 `ELEMENT_ARRAY_BUFFER`，其余走 `COPY_WRITE_BUFFER`。
     * 其它模块（拷贝、清空、读回）都必须通过 {@link upload} / {@link download} 操作，
     * 而不是自己往 `COPY_*` 目标上绑。
     */
    readonly bindingTarget: number;
    /** 进程内唯一标识，用于构建 VAO 缓存键（`label` 可能被使用者指定成重复值）。 */
    readonly id: string;
    private readonly gl;
    private readonly state;
    private readonly onDestroy;
    /** 以 buffer 引用的形式登记 usage，便于调试时追踪（GL 本身不关心）。 */
    private readonly usages;
    private mapping;
    private _disposed;
    constructor(gl: WebGL2RenderingContext, state: GlStateCache, descriptor: BufferDescriptor, onDestroy: (buffer: WebGL2Buffer) => void);
    get disposed(): boolean;
    /** 该 buffer 是否被固定为索引缓冲（此时不能再当顶点/uniform/拷贝目标使用）。 */
    get isIndexBuffer(): boolean;
    /** 该 buffer 创建时声明的 usage（只读，便于调试）。 */
    get usageFlags(): BufferUsage;
    get mapped(): boolean;
    mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>;
    /**
     * 当前已映射范围里的一段（`offset` 相对映射起点，与 WebGPU 后端一致）。
     *
     * ## 返回的是影子内存上的视图，不是副本
     *
     * - 整段范围：直接返回 `mapAsync()` 给出去的那个影子 `ArrayBuffer`；
     * - 部分范围：返回**建在同一块影子内存上的 `Uint8Array` 视图**（等价于
     *   `new Uint8Array(mapping.data).subarray(offset, offset + length)`）。
     *
     * 之前这里用 `slice()` 返回副本，于是 `mapAsync('write')` → `getMappedRange(offset, size)` →
     * 写 → `unmap()` 的数据**上传的是零**（写进了临时副本），与 WebGPU 后端一致地错，
     * 任何后端对比都发现不了。现在两端都是视图语义。
     *
     * ## 生命周期
     *
     * `unmap()` 之后影子内存被 detach，视图随之失效（长度归零、读得到 `undefined`、写入被静默忽略，
     * `slice()` 之类的调用抛 `TypeError`），与 WebGPU 的 `unmap()` 一致。要在 `unmap()` **之前**
     * 把数据拷走（`range.slice()`）；之后再访问属于未定义行为。
     */
    getMappedRange(offset?: number, size?: number): MappedRange;
    /**
     * 结束映射：`write` 映射在此把影子内存上传到 GL buffer，然后让映射视图失效。
     *
     * 上传必须在 detach **之前**做（detach 之后影子内存就不可读了）；未映射时是空操作。
     */
    unmap(): void;
    /**
     * 直接上传一段数据（`Queue.writeBuffer` 与内部的拷贝/清空都走这里）。
     *
     * 必须用它而不是自己绑 `COPY_WRITE_BUFFER`：索引缓冲被固定在 `ELEMENT_ARRAY_BUFFER` 上，
     * 绑到别的目标会被 WebGL2 直接拒掉（见类注释）。
     */
    upload(offset: number, data: Uint8Array): void;
    /**
     * 读回一段数据（`Queue` 的同步读回、拷贝与映射读取都走这里）。
     *
     * `getBufferSubData` 接受任意 buffer 绑定目标，所以索引缓冲也能用 `ELEMENT_ARRAY_BUFFER` 读回。
     */
    download(offset: number, target: Uint8Array): void;
    destroy(): void;
    dispose(): void;
    /**
     * 把本 buffer 绑到它唯一允许的绑定目标上，然后执行一段操作。
     *
     * `ELEMENT_ARRAY_BUFFER` 是 VAO 状态，所以那一路必须在默认 VAO 上操作并恢复原 VAO，
     * 否则会改掉当前 VAO 记录的索引缓冲（见 {@link GlStateCache.withDefaultVertexArray}）。
     */
    private withTarget;
    private assertUsable;
}
//# sourceMappingURL=WebGL2Buffer.d.ts.map