/**
 * 着色器编译调度：按后端选语言，并补上每种语言必需的样板。
 *
 * 这里**不做声明注入**：uniform block、bind group、顶点属性位置都由用户在源码里自己写，
 * core 只保证「同一份 ShaderSource 在两种后端下都能拿到可编译的最终源码」。
 *
 * GLSL 侧会自动补 `#version 300 es` 与默认精度限定符，并允许通过 `defines` 注入宏；
 * WGSL 侧没有版本指令，`defines` 会生成为顶层 `const`。
 */
import type { BackendKind } from '../core/Adapter.js';
import type { ShaderStage } from '../core/enums/ShaderStage.js';
import type { ShaderSource } from '../core/resources/ShaderModule.js';
import { type ShaderLanguage } from './ShaderSource.js';
export interface ShaderCompileRequest {
    backend: BackendKind;
    source: ShaderSource;
    stage: ShaderStage;
    /** 仅用于报错信息，通常是 pipeline 的 label。 */
    label?: string;
    defines?: Record<string, string | number | boolean>;
}
export interface CompiledShaderStage {
    language: ShaderLanguage;
    stage: ShaderStage;
    /** 最终交给后端编译的完整源码。 */
    code: string;
    /** 是否为 GLSL 补过前言（便于调试输出时说明）。 */
    hasPreamble: boolean;
}
/** GLSL ES 3.00 必需的前言：版本号必须在第一行，其余为默认精度。 */
export declare const GLSL_PREAMBLE: string;
/** 把 `defines` 渲染成 GLSL 的 `#define`。 */
export declare function glslDefines(defines: ShaderCompileRequest['defines']): string;
/** 把 `defines` 渲染成 WGSL 的顶层 `const`。 */
export declare function wgslDefines(defines: ShaderCompileRequest['defines']): string;
/**
 * 把用户写的 GLSL 主体包成可编译的完整源码：
 * `#version` → `#define` → 默认精度 → 用户源码。
 *
 * 用户源码里如果自带 `#version`，会被剥掉（版本由本库统一指定），
 * 但如果写的不是 300 es，会直接报错而不是静默替换 —— 否则很容易出现
 * 「本地能编译、上线编译不过」这种难查的问题。
 */
export declare function wrapGlslSource(body: string, defines?: ShaderCompileRequest['defines'], label?: string): string;
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