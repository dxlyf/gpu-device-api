/** {@link Texture} 的可用用途。位标志与 WebGPU 保持一致。 */
export declare const TextureUsage: {
    readonly None: 0;
    readonly CopySrc: 1;
    readonly CopyDst: 2;
    /** 可通过 {@link TextureView} 采样。 */
    readonly TextureBinding: 4;
    /** 可绑定为 storage texture（仅 WebGPU）。 */
    readonly StorageBinding: 8;
    /** 可用作 render pass 的 color/depth attachment。 */
    readonly RenderAttachment: 16;
};
/** {@link TextureUsage} 取值的按位或。 */
export type TextureUsage = number;
//# sourceMappingURL=TextureUsage.d.ts.map