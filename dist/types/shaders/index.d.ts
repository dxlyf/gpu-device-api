/**
 * 着色器管理：跨后端的关键模块。
 *
 * - {@link ShaderSource} 定义「一份源码如何在两种语言间对应」；
 * - {@link ShaderCompiler} 按后端挑语言并补上必需样板（GLSL 的 `#version` 与精度声明）；
 * - `reflection/` 提供两种语言的接口反射，用于 `layout: 'auto'` 与交叉校验。
 *
 * `translate/`（GLSL ↔ WGSL 自动转译）暂不实现：转译器要覆盖的语法面很大，
 * 与其做一个半可靠的转译器，不如把两种语言分别写好、由编译期校验兜住错误。
 */
export { describeShaderSource, glslFieldForStage, languageForBackend, missingSourceMessage, stageSource, type ShaderLanguage, type StageSource, } from './ShaderSource.js';
export { GLSL_PREAMBLE, compileShaderStage, formatShaderErrorLog, glslDefines, numberLines, wgslDefines, wrapGlslSource, wrapWgslSource, type CompiledShaderStage, type ShaderCompileRequest, } from './ShaderCompiler.js';
export { clearShaders, getShader, hasShader, listShaderKeys, registerShader, registerShaders, replaceShader, requireShader, unregisterShader, } from './ShaderRegistry.js';
export { findWgslEntryPoint, reflectWgslBindings, reflectWgslEntryPoints, stripWgslComments, wgslBindingKeys, type WgslAddressSpace, type WgslBinding, type WgslEntryPoint, type WgslEntryPointStage, type WgslResourceKind, } from './reflection/WGSLReflector.js';
export { GLSL_SAMPLER_TYPES, GLSL_TYPE_NAMES, glslTypeName, inferBindGroupLayoutEntries, isSamplerType, reflectGlslProgram, reflectSamplerUniforms, type GlslActiveAttribute, type GlslActiveUniform, type GlslActiveUniformBlock, type GlslProgramReflection, } from './reflection/GLSLReflector.js';
//# sourceMappingURL=index.d.ts.map