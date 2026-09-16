/**
 * 绑定资源（Binding resources）。
 *
 * WebGL2 没有 bind group：uniform 逐个 program 设置，texture 占用全局 texture unit。
 * {@link BindGroupLayout} + {@link PipelineLayout} 为 WebGL2 后端提供所需的静态信息，
 * 让它能够预先分配 uniform block 索引和 texture unit，因此两个后端向上层暴露相同的
 * 绑定模型。
 */
export function isBufferBindingResource(resource) {
    return resource.buffer !== undefined;
}
export function isSamplerBindingResource(resource) {
    return resource.sampler !== undefined;
}
export function isTextureBindingResource(resource) {
    return resource.view !== undefined;
}
/** bind group layout entry 的默认值，与 WebGPU 一致。 */
export function resolveBindingLayoutEntry(entry) {
    return {
        ...entry,
        binding: entry.binding,
        visibility: entry.visibility,
        type: entry.type,
    };
}
//# sourceMappingURL=BindingTypes.js.map