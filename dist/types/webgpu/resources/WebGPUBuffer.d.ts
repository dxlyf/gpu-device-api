/**
 * WebGPU buffer 资源：`Buffer` 接口在 `GPUBuffer` 上的实现。
 *
 * WebGPU 的硬性约束在这里被提前拦住：`size` 必须是 4 的倍数、必须大于零、
 * 不能同时请求 `MapRead` 与 `MapWrite`。映射状态（`mapped`）由本类维护，
 * 使得在错误时机访问映射范围时能给出可读的报错，而不是 WebGPU 的通用校验失败。
 */
import type { Buffer, BufferDescriptor, BufferMapState, MapMode, MappedRange } from '../../core/resources/Buffer.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUBuffer implements Buffer {
    readonly label: string;
    readonly size: number;
    readonly usage: BufferDescriptor['usage'];
    readonly native: GPUBuffer;
    private readonly device;
    private _disposed;
    /**
     * 映射状态，与原生 `GPUBuffer.mapState` 同一套语义（`'unmapped' | 'pending' | 'mapped'`）。
     *
     * 用一个状态而不是 `mapped` 布尔，是为了**如实反映 `mapAsync()` 还没 settle 的那一段**：
     * 那时原生 `[[pending_map]]` 非 null、`[[mapping]]` 还是 null，`getMappedRange()` 必须报错。
     * 若只维护布尔，`mapAsync()` 一发出就可能被读成「已映射」，调用方就会在不该取范围的时候取
     * 范围 —— 那正是本会话反复修的「状态撒谎」。所以状态机是唯一真相，`mapped` 由它派生。
     */
    private _mapState;
    /**
     * `mapAsync` 时向原生取到的**整段映射内存**（`GPUBuffer.getMappedRange()` 的返回值）。
     *
     * 必须记下来，两个原因：
     *
     * 1. WebGPU 规定同一个映射范围只能被原生 `getMappedRange()` 取一次，重复取（哪怕完全
     *    相同的范围）都会以「与已返回的范围重叠」报错，而 core 的 `Buffer` 契约是
     *    「`mapAsync` 以映射范围 resolve，`getMappedRange` 再取当前映射范围」——
     *    两个方法都要能用（WebGL2 后端就是这样）。所以这里自己记着已经交出去的那一块内存，
     *    后续一律在它上面建视图，不再往原生对象上问第二遍。
     * 2. 它是原生返回的、指向**映射内存**的 `ArrayBuffer`：在它上面建 TypedArray 视图就是
     *    「不拷贝地访问映射内存」，写入自然落到 buffer 上。
     *
     * `mappedAtCreation: true` 时这块内存同样在构造期拿到（原生创建完就已映射）。
     */
    private mappedRange;
    constructor(device: WebGPUDevice, descriptor: BufferDescriptor);
    get disposed(): boolean;
    get mapState(): BufferMapState;
    /** 由 {@link WebGPUBuffer.mapState} 派生，两者任何时候都一致。 */
    get mapped(): boolean;
    /** 当前 buffer 是否仍然可用（未释放、device 未销毁）。 */
    get usable(): boolean;
    /**
     * 把 buffer 的某个范围映射给 CPU，并以该范围的 `ArrayBuffer` resolve。
     *
     * WebGPU 的 `mapAsync` 本身只 resolve 一个 `undefined`，因此这里在映射完成后立即调用原生
     * `getMappedRange()`，把它返回的**映射内存**交给上层 —— 那是视图而不是副本，写入会真正落到
     * buffer 上（`unmap()` 时刷给 GPU）。
     *
     * ## 传给原生的 `offset` 是**绝对偏移量**（这一点必须按实现实测，不能想当然）
     *
     * 规范的 `GPUBuffer.getMappedRange(offset, size)` 里 `offset` 是**相对 buffer 起点**的字节偏移
     * （2024 年规范原文：`Offset in bytes into the buffer to return buffer contents from`），
     * 且必须落在本次映射范围之内。Chrome 实测（无头 Chrome + `--enable-unsafe-webgpu`，Intel 适配器）：
     *
     * | 调用 | 结果 |
     * | --- | --- |
     * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(16, 32)` | OK |
     * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(0, 32)` | OperationError |
     * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(8, 4)` | OperationError（8 在映射范围之前） |
     *
     * 所以这里传的是 `mapAsync()` 收到的那个绝对 `offset`（与旧实现一致），而不是 0；
     * 传 0 在 `offset > 0` 时会直接报错。本类对外的 `getMappedRange(offset, size)` 则采用
     * 「相对映射起点」的约定（与 WebGL2 后端一致，见 {@link WebGPUBuffer.getMappedRange}），
     * 两者之间的平移只发生在这一处。
     *
     * ## 状态机
     *
     * `mapState` 在调用后立即变成 `'pending'`（原生 `[[pending_map]]` 已设置），原生 Promise
     * settle 之后变成 `'mapped'`。如果原生 `mapAsync()` reject（设备丢失、范围非法等），
     * 状态**回退到 `'unmapped'`** 并把错误抛出去 —— 绝不留下一个卡在 `'pending'` 的对象
     * （那样 `getMappedRange()` 永远报「还没映射」，而调用方又再也不能重新映射）。
     */
    mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>;
    /**
     * 当前已映射的范围里的一段（`offset` 相对映射起点，与 WebGL2 后端一致）。
     *
     * ## 返回的是视图，不是副本
     *
     * - 整段范围：直接返回 `mapAsync()` 给出去的那个 `ArrayBuffer`（原生映射内存本身）；
     * - 部分范围：返回**建在同一块内存上的 `Uint8Array` 视图**（`new Uint8Array(data, offset, size)`）。
     *
     * 绝不使用 `slice()`：那是拷贝，写进去的数据在 `unmap()` 时不会被上传 —— 这正是本次修复
     * 掉的缺陷（`mapAsync('write')` → `getMappedRange(offset, size)` → 写 → `unmap()` 静默失效）。
     *
     * ## 为什么不去问原生要子范围
     *
     * 原生 `getMappedRange()` 的每一段范围只能取一次，与已返回的范围重叠即报错；而 `mapAsync()`
     * 已经取走了整段映射内存，再取任何子范围都与之重叠（原生还会拒绝映射范围以外的偏移量）。
     * 所以子范围一律在已取到的那块内存上建视图 —— `data` 就是映射内存本身，视图是它的别名，
     * 重复调用同一段范围（`getMappedRange(4, 4)` 两次）也一定拿到 `view.buffer` 相同的视图，
     * 而不是各拿一份副本。
     *
     * 注意本方法的 `offset` 与原生不同：**这里相对映射起点**（`mapAsync()` 的 `offset`），
     * 原生则相对 buffer 起点（见 {@link WebGPUBuffer.mapAsync} 的实测表格）。因为建视图不需要
     * 再调原生，这个平移只在 `mapAsync()` 里发生一次。
     *
     * ## 生命周期（与原生一致）
     *
     * `unmap()` 会让原生映射内存 detach，之前取出的 `ArrayBuffer` 与建在它上面的视图一起失效：
     * `byteLength` / `length` 变成 0，读元素得到 `undefined`，写元素被**静默忽略**
     * （越界写按规范就是空操作），只有真正触碰底层内存的调用（`slice()` 等）会抛 `TypeError`。
     * 因此调用方必须在 `unmap()` **之前**把要留下的数据拷出来（`range.slice()`）；
     * `unmap()` 之后再访问这些视图是未定义行为，本库不保证任何结果。
     */
    getMappedRange(offset?: number, size?: number): MappedRange;
    /**
     * 结束映射：`'write'` 映射会在此把 CPU 侧的改动刷给 GPU，`'read'` 映射在此释放映射内存。
     *
     * 原生 `unmap()` 同时会 detach 掉之前 `getMappedRange()` 返回的映射内存，所以本类交出去的
     * `ArrayBuffer` 与它上面的视图在调用之后就失效了（见 {@link WebGPUBuffer.getMappedRange}）。
     *
     * 未映射时是空操作（WebGPU 的 `unmap()` 对未映射 buffer 同样是合法的空操作），
     * 这样清理路径里可以放心地无条件调用。
     *
     * ⚠️ `'pending'` 时**不**调用原生 `unmap()`：原生规定「映射请求还没 settle 时调用 unmap()
     * 会被忽略」（`[[pending_map]]` 还在，`[[mapping]]` 还是 null）。所以这里只把状态推回
     * `'unmapped'`；那次 `mapAsync()` settle 时会看到状态已经不是 `'pending'`，于是立刻把刚
     * 拿到的映射交还给原生，而不是把它泄漏成一块谁也不管的映射内存。这样 `mapState` 既不会停在
     * 一个用户已经放弃的 `'pending'` 上，底层资源也不会泄漏。
     */
    unmap(): void;
    /**
     * 释放底层分配。幂等；已映射的 buffer 会先被取消映射。
     *
     * 原生 `GPUBuffer.destroy()` 本身就会取消映射（并在创建时用了 `mappedAtCreation` 却没
     * `unmap()` 的情况下负责清理），所以这里**不**额外调 `native.unmap()`：那样会在 destroy
     * 之前把映射内存 detach 掉，而 destroy 的语义是「释放整个 buffer」，多余的一步只会让行为
     * 更难对齐。本类只负责把自己的状态推回 `'unmapped'`，保证 `mapState` / `mapped` 不撒谎。
     */
    destroy(): void;
    /** `Disposable` 的别名，语义与 {@link WebGPUBuffer.destroy} 相同。 */
    dispose(): void;
    private assertUsable;
    private assertRange;
}
/** 该对象是否为 WebGPU 后端的 buffer。 */
export declare function isWebGPUBuffer(value: unknown): value is WebGPUBuffer;
/** 原生 `GPUBuffer` 的形状识别：核心 `Buffer` 一定带 `native` 成员，原生对象没有。 */
export declare function isNativeGPUBuffer(value: unknown): value is GPUBuffer;
/**
 * 把任意 buffer 表示收窄为原生 `GPUBuffer`。
 *
 * 接受 `WebGPUBuffer`（core 资源）或直接由 escape hatch 拿到的原生 `GPUBuffer`；
 * 其它情况抛 {@link ValidationError}，避免把错误的后端资源交给 WebGPU。
 */
export declare function asGPUBuffer(value: unknown, context: string): GPUBuffer;
/** 统一的取值描述，便于报错时说明收到了什么。 */
export declare function describeUnknown(value: unknown): string;
//# sourceMappingURL=WebGPUBuffer.d.ts.map