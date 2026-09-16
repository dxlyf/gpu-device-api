/**
 * 着色器源码类型与「按后端选语言」的规则。
 *
 * core 采用的是 WebGPU 形状的着色器模型，所以源码是**自包含**的：
 * 用户自己写 `@group/@binding`、`layout(std140)`、`layout(location = N)` 等全部声明，
 * 本模块只负责把对应语言的源码挑出来交给后端，不做声明注入。
 *
 * 约定：
 * - GLSL 按 stage 分开（WebGL2 需要 vertex / fragment 分别编译再链接）；
 * - WGSL 是**一个**字符串，里面可以包含所有 entry point（与 WebGPU 一致）。
 */
/** 每种后端使用的着色器语言是固定的。 */
export function languageForBackend(backend) {
    return backend === 'webgl2' ? 'glsl' : 'wgsl';
}
/** 某个 stage 对应的 GLSL 源码在 {@link ShaderSource} 里的字段名。 */
export function glslFieldForStage(stage) {
    if (stage === 0x0001)
        return 'vs';
    if (stage === 0x0002)
        return 'fs';
    if (stage === 0x0004)
        return 'cs';
    return null;
}
/** 取出指定 stage 在指定语言下的源码；不存在时返回 `undefined`。 */
export function stageSource(source, language, stage) {
    if (language === 'wgsl')
        return source.wgsl;
    const field = glslFieldForStage(stage);
    return field ? source[field] : undefined;
}
/** 人类可读的源码清单，用于报错时告诉用户「你提供了什么」。 */
export function describeShaderSource(source) {
    const parts = [];
    if (source.vs)
        parts.push('vs（GLSL）');
    if (source.fs)
        parts.push('fs（GLSL）');
    if (source.cs)
        parts.push('cs（GLSL）');
    if (source.wgsl)
        parts.push('wgsl');
    return parts.length > 0 ? parts.join('、') : '空';
}
/**
 * 报错用的完整提示：缺少对应语言的源码时，说清缺哪个、当前有什么、另一个后端要什么。
 */
export function missingSourceMessage(backend, stage, source, label) {
    const stageName = stage === 0x0001 ? 'vertex' : stage === 0x0002 ? 'fragment' : 'compute';
    const language = languageForBackend(backend);
    const expected = language === 'glsl'
        ? `请在 \`code\` 里提供 \`${glslFieldForStage(stage) ?? 'vs/fs/cs'}\`（GLSL ES 3.00）`
        : '请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）';
    const other = backend === 'webgl2' ? 'WebGPU' : 'WebGL2';
    return (`[gpu-device-api] ShaderModule「${label}」缺少 ${backend} 后端需要的 ${stageName} 阶段源码。\n` +
        `  ${expected}；\n` +
        `  当前提供的源码：${describeShaderSource(source)}。\n` +
        `  （${other} 后端使用的语言与之不同，不能互相替代。）`);
}
//# sourceMappingURL=ShaderSource.js.map