/** render pipeline：shader 及其运行时使用的固定功能状态。 */
import { ValidationError } from '../errors/ValidationError.js';
/**
 * 归一化 `layout`：`'auto'` / `PipelineLayout` 原样返回，`BindGroupLayout`（或它的数组）
 * 交给后端合成一个 `PipelineLayout`。
 *
 * 放在 core 而不是各后端各写一份：两个后端必须对同一份 descriptor 得出**同一个**语义
 * （「一组布局」= 数组下标即 bind group index；单个布局 = 「只有一组」），
 * 否则「WebGL2 上跑得通、WebGPU 上绑定错位」这类差异就会从这里长出来。
 *
 * `synthesize` 由后端提供，返回值必须是**已经登记到设备上**的 layout（这样它与手写的
 * `createPipelineLayout()` 有完全相同的生命周期）；本函数只负责决定「要不要调用它」。
 */
export function resolvePipelineLayoutLike(layout, synthesize, context) {
    if (layout === undefined || layout === 'auto')
        return { layout: 'auto', synthesized: null };
    if (Array.isArray(layout)) {
        const bindGroupLayouts = layout;
        // 空数组是明确的用法错误：「一个 bind group 都没有」应该写 'auto'（或干脆省略），
        // 而不是写一个空数组 —— 后者在 WebGPU 上会静默退化成「没有布局」。
        if (bindGroupLayouts.length === 0) {
            throw new ValidationError(`[gpu-device-api] ${context}: layout must not be an empty array; omit it (or pass 'auto') to let ` +
                'the backend infer the layout from the shader.');
        }
        const synthesized = synthesize(bindGroupLayouts);
        return { layout: synthesized, synthesized };
    }
    if (isBindGroupLayoutLike(layout)) {
        const synthesized = synthesize([layout]);
        return { layout: synthesized, synthesized };
    }
    return { layout: layout, synthesized: null };
}
/**
 * 形状判断：`PipelineLayout` 与 `BindGroupLayout` 在 core 里都是接口（无运行时标记），
 * 因此按两者**独有的**成员区分：
 *
 * - `BindGroupLayout` 有 `entry(binding)` 与 `sortedEntries`；
 * - `PipelineLayout` 有 `bindGroupLayouts`（数组）与 `isAuto`。
 *
 * 拿不准时按 `PipelineLayout` 处理（保持改动前的行为：直接交给后端，由它给出它自己的报错）。
 */
function isBindGroupLayoutLike(value) {
    const candidate = value;
    if (typeof candidate.entry !== 'function' || !Array.isArray(candidate.sortedEntries))
        return false;
    // `PipelineLayout` 也有 `bindGroupLayouts`：两者都像时以它是 pipeline layout 为准。
    return !Array.isArray(candidate.bindGroupLayouts);
}
//# sourceMappingURL=RenderPipeline.js.map