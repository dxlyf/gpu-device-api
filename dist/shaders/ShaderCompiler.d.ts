/**
 * 着色器编译调度：按后端选语言，并补上每种语言必需的样板。
 *
 * 这里**不做声明注入**：uniform block、bind group、顶点属性位置都由用户在源码里自己写，
 * core 只保证「同一份 ShaderSource 在两种后端下都能拿到可编译的最终源码」。
 *
 * GLSL 侧默认会自动补 `#version 300 es` 与默认精度限定符，并允许通过 `defines` 注入宏；
 * 这套自动包装可以通过 `ShaderModuleDescriptor.glsl` 关掉（见 {@link GlslWrapOptions}）。
 * WGSL 侧没有版本指令、也不需要精度声明，`defines` 会生成为顶层 `const`。
 */
import type { BackendKind } from '../core/Adapter.js';
import type { ShaderStage } from '../core/enums/ShaderStage.js';
import type { GlslWrapOptions, ShaderSource } from '../core/resources/ShaderModule.js';
import { type ShaderLanguage } from './ShaderSource.js';
export interface ShaderCompileRequest {
    backend: BackendKind;
    source: ShaderSource;
    stage: ShaderStage;
    /** 仅用于报错信息，通常是 pipeline 的 label。 */
    label?: string;
    defines?: Record<string, string | number | boolean>;
    /** GLSL 自动包装开关（只影响 WebGL2 后端）。默认两项都开启。 */
    glsl?: GlslWrapOptions;
}
export interface CompiledShaderStage {
    language: ShaderLanguage;
    stage: ShaderStage;
    /** 最终交给后端编译的完整源码。 */
    code: string;
    /** 是否为 GLSL 补过前言（便于调试输出时说明）。 */
    hasPreamble: boolean;
}
/** GLSL ES 3.00 的版本指令；必须是源码的第一行。 */
export declare const GLSL_VERSION_DIRECTIVE = "#version 300 es\n";
/** 默认精度前言（不含版本指令）。 */
export declare const GLSL_PRECISION_PREAMBLE: string;
/** GLSL ES 3.00 必需的前言：版本号必须在第一行，其余为默认精度。 */
export declare const GLSL_PREAMBLE: string;
/** 归一化后的 GLSL 包装选项：`preamble` 已在解析阶段折成「字符串或 false」。 */
export interface ResolvedGlslWrapOptions {
    version: boolean;
    preamble: string | false;
}
/**
 * 把 {@link GlslWrapOptions} 的缺省值补齐：
 * `version` 默认 `true`，`preamble` 默认 `true`（即 {@link GLSL_PRECISION_PREAMBLE}）。
 */
export declare function resolveGlslWrapOptions(options?: GlslWrapOptions): ResolvedGlslWrapOptions;
/** 把 `defines` 渲染成 GLSL 的 `#define`。 */
export declare function glslDefines(defines: ShaderCompileRequest['defines']): string;
/** 把 `defines` 渲染成 WGSL 的顶层 `const`。 */
export declare function wgslDefines(defines: ShaderCompileRequest['defines']): string;
/**
 * 把用户写的 GLSL 主体包成可编译的完整源码，默认顺序是：
 * `#version` → 精度前言 → `#define` → 用户源码。
 *
 * 两个可以独立关掉的自动动作（见 {@link GlslWrapOptions}）：
 *
 * - `version: true`（默认）：剥掉用户写的 `#version`，首行注入 `#version 300 es`；
 *   如果写的不是 300 es，会直接报错而不是静默替换 —— 否则很容易出现
 *   「本地能编译、上线编译不过」这种难查的问题。
 *   `version: false`：`#version` 原样保留，若有则仍排在第一位，前言/defines 插到它后面。
 * - `preamble: true`（默认）：拼接默认精度前言；传字符串则用自定义前言；`false` 则不拼。
 *
 * 两者都关掉且没有 `defines` 时**逐字节透传**，连首尾空白都不动。
 */
export declare function wrapGlslSource(body: string, defines?: ShaderCompileRequest['defines'], label?: string, options?: GlslWrapOptions): string;
/** 把用户写的 WGSL 主体与 `defines` 拼成完整源码。 */
export declare function wrapWgslSource(body: string, defines?: ShaderCompileRequest['defines']): string;
/**
 * 生成某个 stage 的最终源码。缺少对应语言源码时抛出带完整上下文的
 * {@link ValidationError}（而不是让后端抛一句看不懂的编译错误）。
 */
export declare function compileShaderStage(request: ShaderCompileRequest): CompiledShaderStage;
/**
 * 从 WebGL 的编译/链接日志里抽出出错行，并把对应源码行贴出来。
 * WebGL 的日志格式形如 `ERROR: 0:12: 'x' : undeclared identifier`。
 */
export declare function formatShaderErrorLog(log: string, code: string, label: string): string;
/** 便于调试：把源码按行号打印出来。 */
export declare function numberLines(code: string): string;
//# sourceMappingURL=ShaderCompiler.d.ts.map