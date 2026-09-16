/**
 * GLSL 反射：通过 WebGL2 的运行时查询接口拿到 program 的实际接口。
 *
 * 与 WGSL 不同，GLSL 不需要手写解析器 —— `gl.getActiveAttrib` / `gl.getActiveUniform` /
 * `gl.getUniformBlockIndex` 会直接给出编译器优化后的真实结果（被优化掉的变量不会出现）。
 * 因此 WebGL2 后端在 `layout: 'auto'` 时用它来自动推导绑定，并用于交叉校验。
 */
import type { BindGroupLayoutEntry } from '../../core/binding/BindingTypes.js';
import type { ShaderStage } from '../../core/enums/ShaderStage.js';
export interface GlslActiveAttribute {
    name: string;
    /** 顶点属性槽位。 */
    location: number;
    /** GL 类型常量，例如 `gl.FLOAT_VEC3`。 */
    glType: number;
    size: number;
}
export interface GlslActiveUniform {
    name: string;
    /** 采样器/普通 uniform 的位置；uniform block 的成员不会有位置。 */
    location: WebGLUniformLocation | null;
    glType: number;
    size: number;
    /** 数组 uniform 的完整名字形如 `bones[0]`。 */
    isArray: boolean;
}
export interface GlslActiveUniformBlock {
    name: string;
    index: number;
    /** 以字节为单位的数据大小（std140 布局）。 */
    dataSize: number;
    /** 块内成员数量。 */
    activeUniforms: number;
}
export interface GlslProgramReflection {
    attributes: GlslActiveAttribute[];
    uniforms: GlslActiveUniform[];
    uniformBlocks: GlslActiveUniformBlock[];
}
/**
 * GL 类型常量（WebGL2RenderingContext 上的值）到可读名字的映射。
 * 只覆盖 ESSL 3.00 会用到的类型，主要用于错误信息与采样器识别。
 */
export declare const GLSL_TYPE_NAMES: Readonly<Record<number, string>>;
/** GL 类型常量对应的可读名字，未知类型打印成十六进制。 */
export declare function glslTypeName(glType: number): string;
/** 采样器类型集合：这些 uniform 需要绑定纹理单元。 */
export declare const GLSL_SAMPLER_TYPES: readonly number[];
export declare function isSamplerType(glType: number): boolean;
/** 查询一个已链接 program 的全部接口信息。 */
export declare function reflectGlslProgram(gl: WebGL2RenderingContext, program: WebGLProgram): GlslProgramReflection;
/** 把采样器 uniform 名字列出来，供纹理单元分配使用。 */
export declare function reflectSamplerUniforms(reflection: GlslProgramReflection): GlslActiveUniform[];
/**
 * 由反射结果生成一份 bind group layout 条目列表（`layout: 'auto'` 用）。
 *
 * 由于 GLSL 源码里没有显式的 `@group/@binding`，自动布局只能落在 **group 0**，
 * binding 序号按「uniform block → 采样器」的顺序依次分配并保持稳定（按名字排序，
 * 避免因为编译器返回顺序不同导致两次运行拿到不同布局）。
 */
export declare function inferBindGroupLayoutEntries(reflection: GlslProgramReflection, visibility: ShaderStage): BindGroupLayoutEntry[];
//# sourceMappingURL=GLSLReflector.d.ts.map