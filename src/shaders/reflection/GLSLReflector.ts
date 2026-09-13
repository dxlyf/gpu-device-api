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
export const GLSL_TYPE_NAMES: Readonly<Record<number, string>> = {
  0x1406: 'float',
  0x1404: 'int',
  0x1405: 'uint',
  0x8b50: 'vec2',
  0x8b51: 'vec3',
  0x8b52: 'vec4',
  0x8b53: 'ivec2',
  0x8b54: 'ivec3',
  0x8b55: 'ivec4',
  0x8dc6: 'uvec2',
  0x8dc7: 'uvec3',
  0x8dc8: 'uvec4',
  0x8b56: 'bool',
  0x8b57: 'bvec2',
  0x8b58: 'bvec3',
  0x8b59: 'bvec4',
  0x8b5a: 'mat2',
  0x8b5b: 'mat3',
  0x8b5c: 'mat4',
  0x8b65: 'mat2x3',
  0x8b66: 'mat2x4',
  0x8b67: 'mat3x2',
  0x8b68: 'mat3x4',
  0x8b69: 'mat4x2',
  0x8b6a: 'mat4x3',
  0x8b5e: 'sampler2D',
  0x8b5f: 'sampler3D',
  0x8b60: 'samplerCube',
  0x8b62: 'sampler2DShadow',
  0x8dc1: 'sampler2DArray',
  0x8dc4: 'sampler2DArrayShadow',
  0x8dc5: 'samplerCubeShadow',
  0x8dca: 'isampler2D',
  0x8dcb: 'isampler3D',
  0x8dcc: 'isamplerCube',
  0x8dcf: 'isampler2DArray',
  0x8dd2: 'usampler2D',
  0x8dd3: 'usampler3D',
  0x8dd4: 'usamplerCube',
  0x8dd7: 'usampler2DArray',
};

/** GL 类型常量对应的可读名字，未知类型打印成十六进制。 */
export function glslTypeName(glType: number): string {
  return GLSL_TYPE_NAMES[glType] ?? `0x${glType.toString(16)}`;
}

/** 采样器类型集合：这些 uniform 需要绑定纹理单元。 */
export const GLSL_SAMPLER_TYPES: readonly number[] = [
  0x8b5e, // sampler2D
  0x8b5f, // sampler3D
  0x8b60, // samplerCube
  0x8b62, // sampler2DShadow
  0x8dc1, // sampler2DArray
  0x8dc4, // sampler2DArrayShadow
  0x8dc5, // samplerCubeShadow
  0x8dca, // isampler2D
  0x8dcb, // isampler3D
  0x8dcc, // isamplerCube
  0x8dcf, // isampler2DArray
  0x8dd2, // usampler2D
  0x8dd3, // usampler3D
  0x8dd4, // usamplerCube
  0x8dd7, // usampler2DArray
];

export function isSamplerType(glType: number): boolean {
  return GLSL_SAMPLER_TYPES.includes(glType);
}

/** 查询一个已链接 program 的全部接口信息。 */
export function reflectGlslProgram(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): GlslProgramReflection {
  const attributes: GlslActiveAttribute[] = [];
  const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
  for (let i = 0; i < attributeCount; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (!info) continue;
    attributes.push({
      name: info.name,
      location: gl.getAttribLocation(program, info.name),
      glType: info.type,
      size: info.size,
    });
  }

  const uniforms: GlslActiveUniform[] = [];
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    uniforms.push({
      name: info.name,
      location: gl.getUniformLocation(program, info.name),
      glType: info.type,
      size: info.size,
      isArray: /\[\d+\]$/.test(info.name),
    });
  }

  const uniformBlocks: GlslActiveUniformBlock[] = [];
  const blockCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS) as number;
  for (let i = 0; i < blockCount; i++) {
    const name = gl.getActiveUniformBlockName(program, i) ?? `block${i}`;
    uniformBlocks.push({
      name,
      index: i,
      dataSize: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE) as number,
      activeUniforms: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS) as number,
    });
  }

  return { attributes, uniforms, uniformBlocks };
}

/** 把采样器 uniform 名字列出来，供纹理单元分配使用。 */
export function reflectSamplerUniforms(reflection: GlslProgramReflection): GlslActiveUniform[] {
  return reflection.uniforms.filter((uniform) => isSamplerType(uniform.glType));
}

/**
 * 由反射结果生成一份 bind group layout 条目列表（`layout: 'auto'` 用）。
 *
 * 由于 GLSL 源码里没有显式的 `@group/@binding`，自动布局只能落在 **group 0**，
 * binding 序号按「uniform block → 采样器」的顺序依次分配并保持稳定（按名字排序，
 * 避免因为编译器返回顺序不同导致两次运行拿到不同布局）。
 */
export function inferBindGroupLayoutEntries(
  reflection: GlslProgramReflection,
  visibility: ShaderStage,
): BindGroupLayoutEntry[] {
  const entries: BindGroupLayoutEntry[] = [];

  reflection.uniformBlocks
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((block, index) => {
      entries.push({
        binding: index,
        visibility,
        type: 'uniform',
        name: block.name,
        buffer: { type: 'uniform', minBindingSize: block.dataSize },
      });
    });

  const samplers = reflectSamplerUniforms(reflection).sort((a, b) => a.name.localeCompare(b.name));
  samplers.forEach((uniform, index) => {
    entries.push({
      binding: reflection.uniformBlocks.length + index,
      visibility,
      type: 'texture',
      name: uniform.name.replace(/\[\d+\]$/, ''),
      texture: { sampleType: 'float', viewDimension: '2d' },
    });
    entries.push({
      binding: reflection.uniformBlocks.length + samplers.length + index,
      visibility,
      type: 'sampler',
      name: `${uniform.name.replace(/\[\d+\]$/, '')}_sampler`,
      sampler: { type: 'filtering' },
    });
  });

  return entries;
}
