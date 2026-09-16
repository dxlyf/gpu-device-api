/**
 * 把 core 的渲染状态翻译成一组可缓存的 GL 状态设置。
 *
 * 分两步：`resolveRenderState()` 把描述（可能带缺省值）解析成纯数字/布尔的最终状态，
 * `applyRenderState()` 再把它写进 {@link GlStateCache}。
 * 这样状态解析只做一次（创建管线时），每帧只做廉价的前后比较。
 *
 * 注意拓扑不从状态里读：GL 的图元模式是 draw 调用的参数，不是状态。
 *
 * 模板（stencil）这一段与 WebGPU 侧的 `WebGPURenderState.toGPUDepthStencilState()` 一一对应：
 * 正面/背面各自的 `compare` / `failOp` / `depthFailOp` / `passOp`，加上 `stencilReadMask` /
 * `stencilWriteMask` 全部落到 GL 的 `*Separate` 入口上（GLES 3.0 支持双面模板，
 * 单面的 `stencilFunc` / `stencilOp` / `stencilMask` 表达不了 WebGPU 的双面状态）。
 * 两边对「不使用深度/模板」的解析形状也刻意保持一致，详见 {@link resolveRenderState}。
 *
 * ## 逐附件状态（`#10`）：能归约就归约，不能归约就**明确报错**
 *
 * WebGPU 侧是**逐 target** 下发混合与写掩码的（见 {@link reduceColorTargetState} 的说明）；
 * WebGL2 只有一组全局的 `BLEND` / `blendFuncSeparate` / `colorMask` 状态，GLES 3.0 既没有
 * `blendFunci` 也没有 `colorMaski`，逐附件的混合/写掩码**根本表达不了**。
 * 所以这里把 `fragment.targets` 归约成一份全局状态：**所有非空 target 逐字段相同**时正常下发，
 * 只要有一项不同就抛带 `[gpu-device-api] ` 前缀的英文错误 —— 绝不静默按附件 0 执行。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { ColorWriteMask, STENCIL_FACE_DEFAULT } from '../../core/pipeline/RenderState.js';
import { GL_BLEND_FACTORS, GL_BLEND_OPERATIONS, GL_COMPARE_FUNCS, GL_CULL_FACES, GL_FRONT_FACES, GL_STENCIL_OPS, } from '../utils/glEnumMap.js';
/**
 * @param descriptor 管线描述
 * @param target 当前渲染目标的附件情况。没有深度附件时必须关掉 `DEPTH_TEST`，
 *        否则 GL 的行为是未定义的（WebGL2 会当作深度测试恒通过）。
 */
export function resolveRenderState(descriptor, target) {
    const depth = descriptor.depthStencil;
    // 「这条管线是否使用深度/模板」唯一的判据：`depthStencil` **未声明**、或 `format` 为 `null`，
    // 两者同义，都表示不使用深度 —— 与 WebGPU 侧的 `WebGPURenderState.usesDepthStencil()` 是
    // 同一套语义（那边曾经把 `format: null` 回落成「写深度 + less」，只在 WebGPU 上露症状）。
    const depthRequested = depth !== undefined && depth.format !== null;
    const depthTest = depthRequested && target.depth;
    const stencilEnabled = depthRequested && target.stencil;
    const blendDescriptor = descriptor.render?.blend;
    const targets = descriptor.fragment?.targets;
    const global = reduceColorTargetState(descriptor.label ?? 'renderPipeline', targets, blendDescriptor, descriptor.render?.writeMask);
    const blendSource = global.blend;
    let blend = null;
    if (blendSource) {
        blend = {
            colorSrc: factor(blendSource.color.srcFactor, 'color.srcFactor'),
            colorDst: factor(blendSource.color.dstFactor, 'color.dstFactor'),
            colorOp: blendSource.color.operation ? GL_BLEND_OPERATIONS[blendSource.color.operation] : GL_BLEND_OPERATIONS.add,
            alphaSrc: factor(blendSource.alpha.srcFactor, 'alpha.srcFactor'),
            alphaDst: factor(blendSource.alpha.dstFactor, 'alpha.dstFactor'),
            alphaOp: blendSource.alpha.operation ? GL_BLEND_OPERATIONS[blendSource.alpha.operation] : GL_BLEND_OPERATIONS.add,
        };
    }
    /*
     * 模板：真正用到时才解析描述里的字段，否则给中性值。
     *
     * 中性值（`always` + 三个 `keep` + 读掩码全 1 + 写掩码 0）与 WebGPU 的
     * `toGPUDepthStencilState()` 在「不使用深度/模板」时给出的形状**逐字段一致**：
     * 两边的解析结果因此可以直接对照，也保证「不使用」不会退化成描述里残留的某个模板配置
     * （那种退化没有任何报错，只有画面是错的）。
     */
    const stencil = stencilEnabled
        ? {
            front: stencilFace(depth?.stencilFront, 'stencilFront'),
            back: stencilFace(depth?.stencilBack, 'stencilBack'),
            readMask: stencilMask(depth?.stencilReadMask, 'stencilReadMask', 0xffff_ffff),
            writeMask: stencilMask(depth?.stencilWriteMask, 'stencilWriteMask', 0xffff_ffff),
        }
        : {
            front: stencilFace(undefined, 'stencilFront'),
            back: stencilFace(undefined, 'stencilBack'),
            readMask: 0xffff_ffff,
            writeMask: 0,
        };
    const writeMaskValue = global.writeMask;
    const cullMode = descriptor.primitive?.cullMode ?? 'none';
    return {
        depthTest,
        // 不使用深度时给 `false`，而不是 `depthWriteEnabled ?? true`：GL 在 `DEPTH_TEST` 关闭时本来
        // 就不更新深度缓冲（关着测试写深度是无效操作），但把 `depthWrite` 留在 `true` 会让这份解析
        // 结果读起来像「深度是开着的」，误导后续维护。`depthCompare` 同理会停在默认的 `less`，
        // 它只在 `depthTest` 为 true 时才被 glStateCache 写入。
        depthWrite: depthRequested && (depth?.depthWriteEnabled ?? true),
        depthCompare: GL_COMPARE_FUNCS[depth?.depthCompare ?? 'less'],
        depthBias: [depth?.depthBiasSlopeScale ?? 0, depth?.depthBias ?? 0, depth?.depthBiasClamp ?? 0],
        stencilEnabled,
        stencilFront: stencil.front,
        stencilBack: stencil.back,
        stencilReadMask: stencil.readMask,
        stencilWriteMask: stencil.writeMask,
        blend,
        writeMask: [
            (writeMaskValue & ColorWriteMask.Red) !== 0,
            (writeMaskValue & ColorWriteMask.Green) !== 0,
            (writeMaskValue & ColorWriteMask.Blue) !== 0,
            (writeMaskValue & ColorWriteMask.Alpha) !== 0,
        ],
        cullEnabled: cullMode !== 'none',
        cullFace: cullMode === 'none' ? GL_CULL_FACES.back : GL_CULL_FACES[cullMode],
        frontFace: GL_FRONT_FACES[descriptor.primitive?.frontFace ?? 'ccw'],
    };
}
/** 把解析好的状态写进 GL 状态缓存（内部会跳过没变化的设置）。 */
export function applyRenderState(cache, state, stencilReference = 0) {
    if (state.blend) {
        cache.setBlend(true, state.blend.colorSrc, state.blend.colorDst, state.blend.colorOp, state.blend.alphaSrc, state.blend.alphaDst, state.blend.alphaOp);
    }
    else {
        // `setBlend(false, ...)` 的参数在关闭时会被忽略，用 0 占位即可。
        cache.setBlend(false, 0, 0, 0, 0, 0, 0);
    }
    cache.setColorMask(state.writeMask);
    cache.setDepthTest(state.depthTest, state.depthWrite, state.depthCompare, state.depthBias);
    // 模板引用值是运行时状态（`setStencilReference`），所以在这里和解析好的模板状态一起写入。
    // 注意引用值必须**真的传进 `stencilFuncSeparate`**：它是「模板值 == 参考值」这类比较的另一半，
    // 丢了它 `compare: 'equal'` 就永远不成立（或者恒成立），而且是静默的。
    cache.setStencilTest({
        enabled: state.stencilEnabled,
        reference: stencilReference,
        front: state.stencilFront,
        back: state.stencilBack,
        readMask: state.stencilReadMask,
        writeMask: state.stencilWriteMask,
    });
    cache.setCull(state.cullEnabled, state.cullFace, state.frontFace);
}
/**
 * 把 `fragment.targets` 的**逐附件** blend / writeMask 归约成 WebGL2 唯一的那一份全局状态（`#10`）。
 *
 * ## WebGPU 侧是逐 target 的
 *
 * `WebGPURenderState.toGPUColorTargets()` 把每个 `ColorTargetState` 的 `blend` / `writeMask`
 * 分别写进 `GPUFragmentState.targets[i]`，缺省值来自 `RenderState.blend` / `RenderState.writeMask`
 * （与 WebGPU 原生一致：某个 target 没写时回落到处方上的全局值，都没有就是「不混合」/ `All`）。
 * 所以「两个附件用不同混合」在 WebGPU 上是合法的、会真的生效。
 *
 * ## WebGL2 侧只有一份
 *
 * GLES 3.0 的 `BLEND` / `blendFuncSeparate` / `blendEquationSeparate` / `colorMask` 都是
 * **上下文级**状态，一次 draw 里对所有 draw buffer 一视同仁；逐附件的
 * `blendFunci` / `blendEquationSeparatei` / `colorMaski` 是 GL 4.0 / ES 3.2 才有的，
 * WebGL2 没有（本机审计实测 `gl.blendFunci === undefined`、`gl.colorMaski === undefined`）。
 * `drawBuffers` 也改不了这一点 —— 它只决定每个 location 落到哪个附着点。
 *
 * ## 因此：相同就放行，不同就报错
 *
 * - 所有**非空** target 的 (blend, writeMask) 逐字段相同（包括都从 `render.blend` /
 *   `render.writeMask` 缺省而来）→ 完全可表达，正常下发那一份全局状态；
 * - 只要有一项不同 → 抛错。**不**允许像以前那样取「第一个带 blend 的 target」与
 *   `targets[0].writeMask` 静默当成全局状态：那会让第二个附件按别人的状态绘制，
 *   画面错了却没有任何报错（`#10` 的原始缺陷）。
 * - `targets[i] === null` 表示「location i 没有输出」，它的状态没有意义，不参与比较 ——
 *   所以 `[{blend: A}, null]` 与 `[null, {blend: A}]` 都是可表达的，不该被拒绝。
 *
 * 比较用**结构**而不是解析后的 GL 数值：`GL_BLEND_FACTORS` / `GL_BLEND_OPERATIONS` 是单射，
 * 两者等价；用结构比较可以避免为了「比较」而把每个 target 的 blend 都解析一遍
 * （解析会对未知因子抛错，那会把「状态不一致」这个真正的问题盖掉）。
 */
function reduceColorTargetState(label, targets, defaultBlend, defaultWriteMask) {
    const fallbackWriteMask = defaultWriteMask ?? ColorWriteMask.All;
    // 没有逐 target 声明时，`render` 上那一份就是全局状态（与改前一致）。
    if (!targets)
        return { blend: defaultBlend, writeMask: fallbackWriteMask };
    let blend = defaultBlend;
    let writeMask = fallbackWriteMask;
    let firstIndex = -1;
    for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index];
        if (!target)
            continue;
        const targetBlend = target.blend ?? defaultBlend;
        const targetWriteMask = target.writeMask ?? fallbackWriteMask;
        if (firstIndex < 0) {
            // 第一个**有输出**的 target 定下这一份全局状态。
            firstIndex = index;
            blend = targetBlend;
            writeMask = targetWriteMask;
            continue;
        }
        if (targetWriteMask !== writeMask) {
            throw new ValidationError(perTargetStateError(label, `writeMask differs between fragment.targets[${firstIndex}] and fragment.targets[${index}] ` +
                `(0x${writeMask.toString(16)} vs 0x${targetWriteMask.toString(16)})`));
        }
        if (!sameBlendState(blend, targetBlend)) {
            throw new ValidationError(perTargetStateError(label, `blend differs between fragment.targets[${firstIndex}] and fragment.targets[${index}]`));
        }
    }
    // 全部是空位（没有任何有输出的 target）时 `firstIndex` 仍是 -1，此时退回 `render` 上的全局状态。
    return { blend, writeMask };
}
/** 逐附件的 blend / writeMask 在 WebGL2 上无法表达时的错误消息。 */
function perTargetStateError(label, detail) {
    return (`[gpu-device-api] RenderPipeline "${label}": ${detail}. WebGL2 has only one global blend state ` +
        'and one global color write mask: GLES 3.0 has no blendFunci() / blendEquationSeparatei() / ' +
        'colorMaski(), so per-attachment blending and per-attachment write masks cannot be expressed at ' +
        'all. This library will not silently apply one target\'s state to every attachment. Give every ' +
        'non-null fragment target the same blend and writeMask, or move the differing attachment into a ' +
        'second render pass on the WebGL2 backend.');
}
/**
 * 两份 blend 描述是否**等价**（逐字段，含 `undefined` → `'add'` 的缺省）。
 *
 * 判定是结构比较：`GL_BLEND_FACTORS` / `GL_BLEND_OPERATIONS` 把枚举名一对一映射到 GL 数值，
 * 所以「结构相同」等价于「解析出的 GL 状态相同」。
 */
function sameBlendState(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    return (a.color.srcFactor === b.color.srcFactor &&
        a.color.dstFactor === b.color.dstFactor &&
        (a.color.operation ?? 'add') === (b.color.operation ?? 'add') &&
        a.alpha.srcFactor === b.alpha.srcFactor &&
        a.alpha.dstFactor === b.alpha.dstFactor &&
        (a.alpha.operation ?? 'add') === (b.alpha.operation ?? 'add'));
}
/** 把 core 的单面模板描述解析成 GL 枚举；缺省值取 {@link STENCIL_FACE_DEFAULT}。 */
function stencilFace(face, path) {
    return {
        compare: stencilCompare(face?.compare ?? STENCIL_FACE_DEFAULT.compare, `${path}.compare`),
        failOp: stencilOperation(face?.failOp ?? STENCIL_FACE_DEFAULT.failOp, `${path}.failOp`),
        depthFailOp: stencilOperation(face?.depthFailOp ?? STENCIL_FACE_DEFAULT.depthFailOp, `${path}.depthFailOp`),
        passOp: stencilOperation(face?.passOp ?? STENCIL_FACE_DEFAULT.passOp, `${path}.passOp`),
    };
}
function stencilCompare(value, path) {
    const resolved = GL_COMPARE_FUNCS[value];
    if (resolved === undefined) {
        throw new ValidationError(`[gpu-device-api] 未知的模板比较函数「${value}」（${path}）。`);
    }
    return resolved;
}
function stencilOperation(value, path) {
    const resolved = GL_STENCIL_OPS[value];
    if (resolved === undefined) {
        throw new ValidationError(`[gpu-device-api] 未知的模板操作「${value}」（${path}）。`);
    }
    return resolved;
}
/**
 * 模板掩码：与 WebGPU 一样是 32 位无符号整数，超范围就明确报错，不静默截断。
 *
 * ⚠️ WebGPU 的默认掩码是 `0xffffffff`，而 GLES 3.0 的模板缓冲在
 * `depth24plus-stencil8` 上只有 8 位：GL 自己会把掩码与 `2^s - 1` 相与，所以传 `0xffffffff`
 * 与传 `0xff` 在 GL 上是同一件事。这是**可表达的**差异（GL 负责截断），不是缺陷，
 * 也不需要在这里报错或改写用户给的值 —— 详见 `docs/backend-limits.md`。
 */
function stencilMask(value, path, fallback) {
    if (value === undefined)
        return fallback;
    if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
        throw new ValidationError(`[gpu-device-api] 模板掩码 ${path} 必须是 0..0xffffffff 之间的整数，实际是 ${String(value)}。`);
    }
    return value;
}
function factor(value, path) {
    const resolved = GL_BLEND_FACTORS[value];
    if (resolved === undefined) {
        throw new ValidationError(`[gpu-device-api] 未知的混合因子「${value}」（${path}）。`);
    }
    return resolved;
}
//# sourceMappingURL=WebGL2RenderState.js.map