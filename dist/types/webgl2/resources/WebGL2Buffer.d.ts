/**
 * WebGL2 buffer 资源。
 *
 * GL 没有 WebGPU 那样的 buffer 映射：`mapAsync` / `getMappedRange` / `unmap` 这里用
 * **CPU 影子内存** 实现 ——
 * - `read`：立即用 `getBufferSubData` 读回一段内存；
 * - `write`：先分配一段内存，`unmap()` 时用 `bufferSubData` 上传。
 *
 * 因此 `unmap()` 在 WebGL2 上是**同步生效**的，而 WebGPU 是队列时序。这个差异只影响
 * 「同一帧里改同一块 buffer 再重复读回」这种极端用法，正常的上传/读回流程两者一致。
 */
import { BufferUsage } from '../../core/enums/BufferUsage.js';
import type { Buffer, BufferDescriptor, MapMode } from '../../core/resources/Buffer.js';
import type { GlStateCache } from '../utils/glStateCache.js';
export declare class WebGL2Buffer implements Buffer {
    readonly label: string;
    readonly size: number;
    readonly usage: BufferUsage;
    readonly native: WebGLBuffer;
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
    /** 该 buffer 创建时声明的 usage（只读，便于调试）。 */
    get usageFlags(): BufferUsage;
    get mapped(): boolean;
    mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
    unmap(): void;
    /** 直接上传一段数据（供 `Queue.writeBuffer` 使用，走同一个 binding point）。 */
    upload(offset: number, data: Uint8Array): void;
    /** 读回一段数据（供 `Queue` 的同步读回路径使用）。 */
    download(offset: number, target: Uint8Array): void;
    destroy(): void;
    dispose(): void;
    private assertUsable;
}
//# sourceMappingURL=WebGL2Buffer.d.ts.map