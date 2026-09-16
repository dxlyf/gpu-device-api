/**
 * 着色器注册表：按 key 登记 {@link ShaderSource}，让材质与示例代码可以「用名字引用着色器」，
 * 而不是到处传长字符串。
 *
 * 注册是全局的，key 冲突会直接报错（同名覆盖是 bug 的高发来源，不做静默覆盖）。
 */
import { ValidationError } from '../core/errors/ValidationError.js';
const registry = new Map();
/** 登记一份着色器源码；key 已存在时抛错。 */
export function registerShader(key, source) {
    if (registry.has(key)) {
        throw new ValidationError(`[gpu-device-api] 着色器 key「${key}」已经注册过了。如需替换请先调用 unregisterShader('${key}')。`);
    }
    registry.set(key, source);
    return source;
}
/** 批量登记。 */
export function registerShaders(sources) {
    for (const [key, source] of Object.entries(sources))
        registerShader(key, source);
}
/** 覆盖式登记（明确表示「我知道自己在替换」）。 */
export function replaceShader(key, source) {
    registry.set(key, source);
    return source;
}
export function hasShader(key) {
    return registry.has(key);
}
/** 取出着色器源码，不存在时返回 `undefined`。 */
export function getShader(key) {
    return registry.get(key);
}
/** 取出着色器源码，不存在时抛错并列出已注册的 key。 */
export function requireShader(key) {
    const source = registry.get(key);
    if (!source) {
        const keys = listShaderKeys();
        throw new ValidationError(`[gpu-device-api] 找不到 key 为「${key}」的着色器。` +
            (keys.length > 0 ? `已注册：${keys.join('、')}。` : '当前注册表为空。'));
    }
    return source;
}
export function unregisterShader(key) {
    return registry.delete(key);
}
/** 已注册的所有 key（按字典序）。 */
export function listShaderKeys() {
    return [...registry.keys()].sort();
}
/** 清空注册表。主要给测试用。 */
export function clearShaders() {
    registry.clear();
}
//# sourceMappingURL=ShaderRegistry.js.map