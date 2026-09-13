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
import type { ShaderStage } from '../core/enums/ShaderStage.js';
import type { ShaderSource } from '../core/resources/ShaderModule.js';
export type { ShaderSource };
/** 着色器语言。 */
export type ShaderLanguage = 'glsl' | 'wgsl';
/** 单个 stage 的源码，按语言给出。 */
export interface StageSource {
    glsl?: string;
    wgsl?: string;
}
/** 每种后端使用的着色器语言是固定的。 */
export declare function languageForBackend(backend: 'webgl2' | 'webgpu'): ShaderLanguage;
/** 某个 stage 对应的 GLSL 源码在 {@link ShaderSource} 里的字段名。 */
export declare function glslFieldForStage(stage: ShaderStage): 'vs' | 'fs' | 'cs' | null;
/** 取出指定 stage 在指定语言下的源码；不存在时返回 `undefined`。 */
export declare function stageSource(source: ShaderSource, language: ShaderLanguage, stage: ShaderStage): string | undefined;
/** 人类可读的源码清单，用于报错时告诉用户「你提供了什么」。 */
export declare function describeShaderSource(source: ShaderSource): string;
/**
 * 报错用的完整提示：缺少对应语言的源码时，说清缺哪个、当前有什么、另一个后端要什么。
 */
export declare function missingSourceMessage(backend: 'webgl2' | 'webgpu', stage: ShaderStage, source: ShaderSource, label: string): string;
//# sourceMappingURL=ShaderSource.d.ts.map