/**
 * {@link Buffer} 的可用用途。取值为位标志，与 WebGPU 保持一致，因此 WebGPU 后端可以直接转发，
 * WebGL2 后端可以将它们转换为绑定目标。
 */
export declare const BufferUsage: {
    readonly None: 0;
    /** 可映射用于读取。 */
    readonly MapRead: 1;
    /** 可映射用于写入。 */
    readonly MapWrite: 2;
    /** 可作为拷贝源。 */
    readonly CopySrc: 4;
    /** 可作为拷贝目标（`queue.writeBuffer`）。 */
    readonly CopyDst: 8;
    /** 可用作 index buffer。 */
    readonly Index: 16;
    /** 可用作 vertex buffer。 */
    readonly Vertex: 32;
    /** 可绑定为 uniform buffer。 */
    readonly Uniform: 64;
    /** 可绑定为 storage buffer。 */
    readonly Storage: 128;
    /** 可用作间接绘制/派发的参数 buffer。 */
    readonly Indirect: 256;
    /** 可接收查询结果。 */
    readonly QueryResolve: 512;
};
/** {@link BufferUsage} 取值的按位或。 */
export type BufferUsage = number;
//# sourceMappingURL=BufferUsage.d.ts.map