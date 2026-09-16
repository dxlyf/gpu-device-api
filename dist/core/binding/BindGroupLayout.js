/** 描述 bind group 各 entry 的排布方式。对应 WebGPU 的 `GPUBindGroupLayout`。 */
/** 对 bind group layout 的各 entry 排序并校验。 */
export function normalizeBindGroupLayoutEntries(entries) {
    if (entries.length === 0) {
        throw new Error('[gpu-device-api] A BindGroupLayout needs at least one entry.');
    }
    const sorted = [...entries].sort((a, b) => a.binding - b.binding);
    for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        if (!Number.isInteger(entry.binding) || entry.binding < 0) {
            throw new Error(`[gpu-device-api] BindGroupLayout entry #${i} has an invalid binding index ${entry.binding}.`);
        }
        if (i > 0 && sorted[i - 1].binding === entry.binding) {
            throw new Error(`[gpu-device-api] Duplicate binding index ${entry.binding} in a BindGroupLayout.`);
        }
    }
    return sorted;
}
//# sourceMappingURL=BindGroupLayout.js.map