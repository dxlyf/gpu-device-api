/**
 * 绑定计划：把 WebGPU 形状的 `PipelineLayout` 翻译成 WebGL2 能执行的一整套「槽位分配」。
 *
 * 这是 WebGL2 后端最关键的一块。WebGPU 的 bind group 是运行时的强绑定模型，而 GL 只有两种东西：
 * 全局的 **uniform block binding 点** 和全局的 **texture unit**。要让上层代码在两个后端写起来一样，
 * 必须在创建管线时就把 `(group, binding)` **静态**映射到具体的 block binding 点与 texture unit，
 * 之后 `setBindGroup` 才能只是「按计划把资源塞进对应的槽」。
 *
 * 分配结果的稳定性很重要：计划由 `PipelineLayout` 的内容（而不是对象身份）决定并缓存，
 * 因此同一个布局被多条管线复用时拿到的是同一份分配，避免同一帧里槽位来回抖动。
 *
 * 纹理与采样器的配对规则（按优先级）：
 * 1. 名字符合 `<纹理名>_sampler` 的 sampler 条目；
 * 2. 同一 group 内 binding 等于 `纹理 binding + 1` 的 sampler 条目。
 * 这与 WGSL 里 `@binding(2i)` / `@binding(2i+1)` 的常见写法天然吻合。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { BindingType } from '../../core/enums/BindingType.js';
export function bindingSlotKey(group, binding) {
    return `${group}:${binding}`;
}
/**
 * 由一组（按 group 索引的）布局条目构建绑定计划。
 *
 * @param groups 每个 group 的条目列表，索引即 group 序号
 */
export function buildBindingPlan(groups, limits) {
    const uniformBlocks = new Map();
    const textures = new Map();
    const keyParts = [];
    let nextBlockBinding = 0;
    let nextTextureUnit = 0;
    groups.forEach((entries, group) => {
        const sorted = [...entries].sort((a, b) => a.binding - b.binding);
        // 先收集本 group 的 sampler 条目，供纹理配对使用。
        const samplers = sorted.filter((entry) => entry.type === BindingType.Sampler || entry.type === BindingType.ComparisonSampler);
        for (const entry of sorted) {
            keyParts.push(`${group}:${entry.binding}:${entry.type}:${entry.name ?? ''}:${entry.buffer?.hasDynamicOffset ? 'dyn' : ''}`);
            switch (entry.type) {
                case BindingType.Uniform: {
                    if (!entry.name) {
                        throw new ValidationError(`[gpu-device-api] group ${group} 的 binding ${entry.binding} 是 uniform buffer，但没有给 \`name\`。` +
                            'WebGL2 后端必须靠名字去 `gl.getUniformBlockIndex` 定位 GLSL 里的 uniform block，' +
                            '请在 BindGroupLayoutEntry 上填上着色器里使用的块名。');
                    }
                    if (nextBlockBinding >= limits.maxUniformBufferBindings) {
                        throw new ValidationError(`[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${limits.maxUniformBufferBindings} 个 binding 点。` +
                            '请合并 uniform block，或减少同时使用的 bind group。');
                    }
                    uniformBlocks.set(bindingSlotKey(group, entry.binding), {
                        group,
                        binding: entry.binding,
                        name: entry.name,
                        blockBinding: nextBlockBinding++,
                        dynamic: entry.buffer?.hasDynamicOffset ?? false,
                        minBindingSize: entry.buffer?.minBindingSize ?? 0,
                    });
                    break;
                }
                case BindingType.Texture: {
                    if (!entry.name) {
                        throw new ValidationError(`[gpu-device-api] group ${group} 的 binding ${entry.binding} 是纹理，但没有给 \`name\`。` +
                            'WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。');
                    }
                    if (nextTextureUnit >= limits.maxTextureUnits) {
                        throw new ValidationError(`[gpu-device-api] 纹理数量超出了 WebGL2 的 ${limits.maxTextureUnits} 个纹理单元。` +
                            '请减少同时绑定的纹理，或把它们合并进纹理数组。');
                    }
                    const paired = findPairedSampler(entry, samplers);
                    textures.set(bindingSlotKey(group, entry.binding), {
                        group,
                        binding: entry.binding,
                        name: entry.name,
                        unit: nextTextureUnit++,
                        samplerBinding: paired ? paired.binding : null,
                        samplerName: paired ? paired.name ?? null : null,
                        // WebGPU 的默认值是 `'float'`，这里保持一致。
                        sampleType: entry.texture?.sampleType ?? 'float',
                    });
                    break;
                }
                case BindingType.Sampler:
                case BindingType.ComparisonSampler:
                    // 采样器不单独占纹理单元：它和纹理共用同一个单元（用 `gl.bindSampler` 绑上去）。
                    break;
                case BindingType.Storage:
                case BindingType.ReadOnlyStorage:
                    throw new ValidationError(`[gpu-device-api] group ${group} 的 binding ${entry.binding} 是 storage buffer，WebGL2 不支持` +
                        '（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。');
                case BindingType.StorageTexture:
                    throw new ValidationError(`[gpu-device-api] group ${group} 的 binding ${entry.binding} 是 storage texture，WebGL2 不支持。` +
                        '请改用「渲染到纹理 + 采样」的方式。');
                default: {
                    const exhaustive = entry.type;
                    throw new ValidationError(`[gpu-device-api] 未知的 binding 类型：${String(exhaustive)}`);
                }
            }
        }
    });
    // 有 sampler 条目但没有任何纹理与它配对，说明布局写错了 —— 早点说，别等渲染出黑图。
    const pairedSamplerBindings = new Set([...textures.values()].map((slot) => slot.samplerBinding).filter((value) => value !== null));
    for (const [group, entries] of groups.entries()) {
        for (const entry of entries) {
            const isSampler = entry.type === BindingType.Sampler || entry.type === BindingType.ComparisonSampler;
            if (isSampler && !pairedSamplerBindings.has(entry.binding)) {
                throw new ValidationError(`[gpu-device-api] group ${group} 的 sampler binding ${entry.binding}` +
                    (entry.name ? `（「${entry.name}」）` : '') +
                    ' 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，' +
                    '或把 sampler 的 binding 设为「纹理 binding + 1」。');
            }
        }
    }
    // 把槽位按 group 预分解一次（见 WebGLBindingPlan 上的说明）。
    const uniformBlocksByGroup = new Map();
    const dynamicBlocksByGroup = new Map();
    const texturesByGroup = new Map();
    const requiredGroups = new Set();
    for (const slot of uniformBlocks.values()) {
        groupSlots(uniformBlocksByGroup, slot.group).push(slot);
        if (slot.dynamic)
            groupSlots(dynamicBlocksByGroup, slot.group).push(slot);
        requiredGroups.add(slot.group);
    }
    for (const slot of textures.values()) {
        groupSlots(texturesByGroup, slot.group).push(slot);
        requiredGroups.add(slot.group);
    }
    // 每个 group 都补上空数组：运行时就不必写 `?? []`（那也是一次每 draw 的分配）。
    for (const group of requiredGroups) {
        groupSlots(uniformBlocksByGroup, group);
        groupSlots(dynamicBlocksByGroup, group);
        groupSlots(texturesByGroup, group);
    }
    return {
        uniformBlocks,
        textures,
        uniformBlocksByGroup,
        dynamicBlocksByGroup,
        texturesByGroup,
        requiredGroups: [...requiredGroups].sort((a, b) => a - b),
        key: keyParts.join('|'),
        textureUnitCount: nextTextureUnit,
        uniformBlockCount: nextBlockBinding,
    };
}
/** 取出（必要时创建）某个 group 的槽位列表。 */
function groupSlots(byGroup, group) {
    let slots = byGroup.get(group);
    if (!slots) {
        slots = [];
        byGroup.set(group, slots);
    }
    return slots;
}
function findPairedSampler(texture, samplers) {
    const name = texture.name ?? '';
    const byName = samplers.find((sampler) => sampler.name === `${name}_sampler`);
    if (byName)
        return byName;
    return samplers.find((sampler) => sampler.binding === texture.binding + 1);
}
/** 绑定计划缓存：相同布局内容复用同一份分配，保证同一帧内槽位不抖动。 */
export class BindingPlanCache {
    plans = new Map();
    limits;
    constructor(limits) {
        this.limits = limits;
    }
    /** 按布局内容取计划，未命中则构建。 */
    get(groups) {
        const key = groups
            .map((entries, group) => [...entries]
            .sort((a, b) => a.binding - b.binding)
            .map((entry) => `${group}:${entry.binding}:${entry.type}:${entry.name ?? ''}:${entry.buffer?.hasDynamicOffset ? 'dyn' : ''}`)
            .join(','))
            .join(';');
        const cached = this.plans.get(key);
        if (cached)
            return cached;
        const plan = buildBindingPlan(groups, this.limits);
        this.plans.set(key, plan);
        return plan;
    }
    get size() {
        return this.plans.size;
    }
    clear() {
        this.plans.clear();
    }
}
//# sourceMappingURL=TextureUnitAllocator.js.map