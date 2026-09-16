/**
 * 一块物理或模拟的 GPU，可以创建出 {@link Device}。
 *
 * WebGPU 后端封装 `GPUAdapter`；WebGL2 后端根据其所能创建的 canvas context 的能力
 * 合成一个 adapter。上层只会看到这个接口，因此
 * `createDevice({ backend: 'auto' })` 可以从 WebGPU 透明地回退到 WebGL2。
 */
/** 便于遥测与错误信息使用的标签。 */
export function describeAdapter(info) {
    const fallback = info.isFallbackAdapter ? ' (fallback)' : '';
    return `${info.backend}: ${info.device || info.vendor || 'unknown'}${fallback}`;
}
//# sourceMappingURL=Adapter.js.map