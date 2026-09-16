/** {@link Texture} 的可用用途。位标志与 WebGPU 保持一致。 */
export const TextureUsage = {
    None: 0x0000,
    CopySrc: 0x0001,
    CopyDst: 0x0002,
    /** 可通过 {@link TextureView} 采样。 */
    TextureBinding: 0x0004,
    /** 可绑定为 storage texture（仅 WebGPU）。 */
    StorageBinding: 0x0008,
    /** 可用作 render pass 的 color/depth attachment。 */
    RenderAttachment: 0x0010,
};
//# sourceMappingURL=TextureUsage.js.map