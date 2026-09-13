/** GPU buffer 资源。对应 WebGPU 的 `GPUBuffer`。 */
import type { BufferUsage } from '../enums/BufferUsage.js';
import type { Disposable } from '../../utils/Disposable.js';
export interface BufferDescriptor {
    label?: string;
    /** 字节大小。必须大于零。 */
    size: number;
    usage: BufferUsage;
}
export type MapMode = 'read' | 'write';
export interface Buffer extends Disposable {
    readonly label: string;
    readonly size: number;
    readonly usage: BufferUsage;
    /** 原生句柄：WebGPU 上是 `GPUBuffer`，WebGL2 上是 `WebGLBuffer`。 */
    readonly native: unknown;
    /**
     * 将 buffer 映射给 CPU 访问。以映射到的范围 resolve。
     * WebGL2 用 CPU 影子 buffer 模拟 `write` 映射，并在 `unmap()` 时上传。
     */
    mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>;
    /** 当前已映射的范围。buffer 未映射时抛错。 */
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
    /** 刷新（write）或释放（read）映射。 */
    unmap(): void;
    readonly mapped: boolean;
    /** 释放底层分配。 */
    destroy(): void;
}
//# sourceMappingURL=Buffer.d.ts.map