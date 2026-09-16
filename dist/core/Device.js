/**
 * 逻辑设备：访问所有资源与管线的入口。
 *
 * 这个接口刻意设计成 WebGPU `GPUDevice` 的形状，因为那是两个后端都能遵循的模型。
 * WebGL2 后端会模拟 GL 中不存在的部分（bind group、pipeline layout、不可变管线），
 * 而不是把这些差异泄漏到上层。
 */
import { ValidationError } from './errors/ValidationError.js';
/**
 * 在 adapter 的 limits 之上应用 `requiredLimits`。除 `min*` 对齐类 limits 之外，
 * 每个 limit 都是上界，因此只有高于 adapter 取值的请求才会被拒绝。
 */
export function resolveLimits(adapterLimits, required, backend) {
    if (!required)
        return { ...adapterLimits };
    const resolved = { ...adapterLimits };
    for (const [key, value] of Object.entries(required)) {
        if (typeof value !== 'number')
            continue;
        const available = adapterLimits[key];
        if (typeof available !== 'number') {
            throw new ValidationError(`[gpu-device-api] Unknown device limit "${String(key)}".`);
        }
        if (value > available) {
            throw new ValidationError(`[gpu-device-api] The ${backend} adapter cannot satisfy ${String(key)} = ${value} (available: ${available}).`);
        }
        resolved[key] = value;
    }
    return resolved;
}
//# sourceMappingURL=Device.js.map