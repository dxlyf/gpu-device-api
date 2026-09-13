/** bind group layout 条目描述的资源类型。 */
export declare const BindingType: {
    /** uniform buffer（只读，16 字节对齐布局）。 */
    readonly Uniform: "uniform";
    /** 读写 storage buffer（仅 WebGPU）。 */
    readonly Storage: "storage";
    /** 只读 storage buffer。 */
    readonly ReadOnlyStorage: "read-only-storage";
    /** 过滤 sampler。 */
    readonly Sampler: "sampler";
    /** 用于 `textureSampleCompare` / 阴影查找的比较 sampler。 */
    readonly ComparisonSampler: "comparison-sampler";
    /** 采样的 texture。 */
    readonly Texture: "texture";
    /** 只写 storage texture（仅 WebGPU）。 */
    readonly StorageTexture: "storage-texture";
};
export type BindingType = (typeof BindingType)[keyof typeof BindingType];
/** 当绑定描述 buffer 资源时返回 true。 */
export declare function isBufferBinding(type: BindingType): boolean;
/** 当绑定描述 texture 资源时返回 true。 */
export declare function isTextureBinding(type: BindingType): boolean;
/** 当绑定描述 sampler 资源时返回 true。 */
export declare function isSamplerBinding(type: BindingType): boolean;
//# sourceMappingURL=BindingType.d.ts.map