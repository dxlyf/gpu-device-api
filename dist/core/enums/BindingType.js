/** bind group layout 条目描述的资源类型。 */
export const BindingType = {
    /** uniform buffer（只读，16 字节对齐布局）。 */
    Uniform: 'uniform',
    /** 读写 storage buffer（仅 WebGPU）。 */
    Storage: 'storage',
    /** 只读 storage buffer。 */
    ReadOnlyStorage: 'read-only-storage',
    /** 过滤 sampler。 */
    Sampler: 'sampler',
    /** 用于 `textureSampleCompare` / 阴影查找的比较 sampler。 */
    ComparisonSampler: 'comparison-sampler',
    /** 采样的 texture。 */
    Texture: 'texture',
    /** 只写 storage texture（仅 WebGPU）。 */
    StorageTexture: 'storage-texture',
};
/** 当绑定描述 buffer 资源时返回 true。 */
export function isBufferBinding(type) {
    return type === 'uniform' || type === 'storage' || type === 'read-only-storage';
}
/** 当绑定描述 texture 资源时返回 true。 */
export function isTextureBinding(type) {
    return type === 'texture' || type === 'storage-texture';
}
/** 当绑定描述 sampler 资源时返回 true。 */
export function isSamplerBinding(type) {
    return type === 'sampler' || type === 'comparison-sampler';
}
//# sourceMappingURL=BindingType.js.map