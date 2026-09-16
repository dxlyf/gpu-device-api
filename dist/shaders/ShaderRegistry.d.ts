/**
 * 着色器注册表：按 key 登记 {@link ShaderSource}，让材质与示例代码可以「用名字引用着色器」，
 * 而不是到处传长字符串。
 *
 * 注册是全局的，key 冲突会直接报错（同名覆盖是 bug 的高发来源，不做静默覆盖）。
 */
import type { ShaderSource } from '../core/resources/ShaderModule.js';
/** 登记一份着色器源码；key 已存在时抛错。 */
export declare function registerShader(key: string, source: ShaderSource): ShaderSource;
/** 批量登记。 */
export declare function registerShaders(sources: Record<string, ShaderSource>): void;
/** 覆盖式登记（明确表示「我知道自己在替换」）。 */
export declare function replaceShader(key: string, source: ShaderSource): ShaderSource;
export declare function hasShader(key: string): boolean;
/** 取出着色器源码，不存在时返回 `undefined`。 */
export declare function getShader(key: string): ShaderSource | undefined;
/** 取出着色器源码，不存在时抛错并列出已注册的 key。 */
export declare function requireShader(key: string): ShaderSource;
export declare function unregisterShader(key: string): boolean;
/** 已注册的所有 key（按字典序）。 */
export declare function listShaderKeys(): string[];
/** 清空注册表。主要给测试用。 */
export declare function clearShaders(): void;
//# sourceMappingURL=ShaderRegistry.d.ts.map