/** sampler 资源。对应 WebGPU 的 `GPUSampler`。 */
/** 填入 WebGPU 会使用的默认值。 */
export function resolveSamplerDescriptor(descriptor = {}) {
    return {
        addressModeU: descriptor.addressModeU ?? 'clamp-to-edge',
        addressModeV: descriptor.addressModeV ?? 'clamp-to-edge',
        addressModeW: descriptor.addressModeW ?? 'clamp-to-edge',
        magFilter: descriptor.magFilter ?? 'nearest',
        minFilter: descriptor.minFilter ?? 'nearest',
        mipmapFilter: descriptor.mipmapFilter ?? 'nearest',
        lodMinClamp: descriptor.lodMinClamp ?? 0,
        lodMaxClamp: descriptor.lodMaxClamp ?? 32,
        maxAnisotropy: descriptor.maxAnisotropy ?? 1,
        compare: descriptor.compare,
    };
}
/** 描述 sampler 状态的稳定缓存键。 */
export function samplerKey(descriptor) {
    return [
        descriptor.addressModeU,
        descriptor.addressModeV,
        descriptor.addressModeW,
        descriptor.magFilter,
        descriptor.minFilter,
        descriptor.mipmapFilter,
        descriptor.lodMinClamp,
        descriptor.lodMaxClamp,
        descriptor.maxAnisotropy,
        descriptor.compare ?? 'none',
    ].join('|');
}
//# sourceMappingURL=Sampler.js.map