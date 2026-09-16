/** 固定功能渲染状态：blend、depth/stencil、图元装配、多重采样。 */
/** color attachment 的逐通道写掩码。位标志与 WebGPU 的 `GPUColorWrite` 一致。 */
export const ColorWriteMask = {
    None: 0x0,
    Red: 0x1,
    Green: 0x2,
    Blue: 0x4,
    Alpha: 0x8,
    All: 0xf,
};
/* ------------------------------------------------------------------ 默认值与预设 --------- */
export const DEFAULT_PRIMITIVE_STATE = {
    topology: 'triangle-list',
    frontFace: 'ccw',
    cullMode: 'none',
};
/**
 * 「这条管线使用深度」而 `depthWriteEnabled` / `depthCompare` 没写时的缺省值。
 *
 * ⚠️ 它**只**适用于「`depthStencil` 已声明且 `format` 不为 `null`」的情形。
 * `depthStencil` 完全不声明、或写成 `{ format: null }`，含义都是「这条管线不使用深度/模板」：
 * 两个后端都必须如实关掉深度测试、并且绝不写深度，**绝不能**回落到这里的
 * `depthWriteEnabled: true`。
 *
 * 曾经的缺陷正是这里的回落造成的：一条声明 `{ format: null }` 的管线（画天空的全屏三角形，
 * `gl_Position` 的深度是 0）在 WebGPU 上照样拿到了「写深度 + `less`」，于是把整个深度缓冲写成 0，
 * 其后所有几何体的 `less` 判定全部失败、画面上只剩它自己，而且没有任何报错。
 * WebGL2 侧一直把这种情况解释为「关掉深度测试」，所以症状只在 WebGPU 上出现。
 */
export const DEFAULT_DEPTH_STATE = {
    depthWriteEnabled: true,
    depthCompare: 'less',
};
export const DEFAULT_BLEND_COMPONENT = {
    srcFactor: 'one',
    dstFactor: 'zero',
    operation: 'add',
};
export const STENCIL_FACE_DEFAULT = {
    compare: 'always',
    failOp: 'keep',
    depthFailOp: 'keep',
    passOp: 'keep',
};
/** 按预设名索引的现成 blend 状态。 */
export const BLEND_PRESETS = Object.freeze({
    /** 直通 alpha：`rgb * a + dst * (1 - a)`。 */
    alpha: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
    /** 预乘 alpha：`src + dst * (1 - a)`。 */
    premultiplied: {
        color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
    additive: {
        color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    },
    multiply: {
        color: { srcFactor: 'dst', dstFactor: 'zero', operation: 'add' },
        alpha: { srcFactor: 'dst-alpha', dstFactor: 'zero', operation: 'add' },
    },
    screen: {
        color: { srcFactor: 'one', dstFactor: 'one-minus-src', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
});
/** 将预设名或完整状态解析为 {@link BlendState}。 */
export function resolveBlendState(blend) {
    if (blend === false || blend === undefined)
        return null;
    if (typeof blend === 'string') {
        const preset = BLEND_PRESETS[blend];
        if (!preset)
            throw new Error(`[gpu-device-api] Unknown blend preset "${blend}".`);
        return preset;
    }
    return blend;
}
//# sourceMappingURL=RenderState.js.map