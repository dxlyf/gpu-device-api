/**
 * 内置材质：开箱即用的几种常用着色�? *
 * 每个函数返回的是**材质描述**（{@link MaterialDesc}），交给
 * `renderer.createMaterial(...)` �?`defineMaterial(...)` 使用�? *
 * ```ts
 * const lambert = renderer.createMaterial(materials.lambert({ color: [1, 0.6, 0.2, 1] }));
 * ```
 *
 * 所有内置材质共用同一套「场景字段」（`projectionView` / `model` / `normalMatrix`），
 * 渲染器会自动填充它们；材质各自额外的字段（颜色、光向…）由使用者通过
 * `renderer.draw(geometry, { uniforms: { ... } })` �?`material.createUniforms()` 覆盖�? *
 * 每种材质�?GLSL �?WGSL 都成对写好，**访问名保持一�?*（`u.*` �?`v.*`），
 * 所以同一份材质描述在 WebGL2 �?WebGPU 上表现相同�? */

import type { MaterialDesc } from './Material.js';
import type { UniformLayoutDesc } from './Uniforms.js';

/** 颜色写法：`[r, g, b]` �?`[r, g, b, a]`，取�?0..1�?*/
export type RgbColor = readonly [number, number, number] | readonly [number, number, number, number];

function colorToArray(color: RgbColor | undefined, fallback: [number, number, number, number]): number[] {
  if (!color) return [...fallback];
  return [color[0], color[1], color[2], color[3] ?? 1];
}

/** 所有内置材质共同依赖的场景字段�?*/
export const SCENE_UNIFORM_FIELDS = {
  projectionView: 'mat4x4f',
  model: 'mat4x4f',
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它�?*/
  normalMatrix: 'mat3x3f',
} as const satisfies UniformLayoutDesc;

/** 平行光的方向与颜色�?*/
export interface LightOptions {
  /** 光的方向（从物体指向光源），会归一化。默�?`[0.5, 1, 0.6]`�?*/
  direction?: readonly [number, number, number];
  /** 环境光强度，0..1。默�?0.18�?*/
  ambient?: number;
}

/* ------------------------------------------------------------------------------------------------ */
/* unlit：纯�?                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export interface UnlitOptions {
  color?: RgbColor;
}

/** 纯色（不受光照影响）�?*/
export function unlit(options: UnlitOptions = {}): MaterialDesc {
  const color = colorToArray(options.color, [1, 1, 1, 1]);
  return {
    name: 'unlit',
    attributes: { position: 'float32x3', normal: 'float32x3', uv: 'float32x2' },
    uniforms: { ...SCENE_UNIFORM_FIELDS, baseColor: 'vec4f' },
    glsl: {
      vs: `void main() {
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `void main() {
  fragColor = u.baseColor;
}`,
    },
    wgsl: `@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f {
  return u.projectionView * u.model * vec4f(v.position, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.baseColor;
}`,
    defaults: { baseColor: color },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* lambert：漫反射                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

export interface LambertOptions extends LightOptions {
  color?: RgbColor;
}

/** 兰伯特漫反射�? 环境光）�?*/
export function lambert(options: LambertOptions = {}): MaterialDesc {
  const direction = normalize3(options.direction ?? [0.5, 1, 0.6]);
  const color = colorToArray(options.color, [1, 1, 1, 1]);
  return {
    name: 'lambert',
    attributes: { position: 'float32x3', normal: 'float32x3', uv: 'float32x2' },
    uniforms: {
      ...SCENE_UNIFORM_FIELDS,
      baseColor: 'vec4f',
      lightDirection: 'vec3f',
      ambient: 'f32',
    },
    glsl: {
      vs: `out vec3 vNormal;
void main() {
  vNormal = u.normalMatrix * normal;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  vec3 l = normalize(-u.lightDirection);
  float ndl = max(dot(n, l), 0.0);
  float lighting = u.ambient + (1.0 - u.ambient) * ndl;
  fragColor = vec4(u.baseColor.rgb * lighting, u.baseColor.a);
}`,
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.normal = u.normalMatrix * v.normal;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let n = normalize(in.normal);
  let l = normalize(-u.lightDirection);
  let ndl = max(dot(n, l), 0.0);
  let lighting = u.ambient + (1.0 - u.ambient) * ndl;
  return vec4f(u.baseColor.rgb * lighting, u.baseColor.a);
}`,
    defaults: { baseColor: color, lightDirection: direction, ambient: options.ambient ?? 0.18 },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* phong：高�?                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export interface PhongOptions extends LightOptions {
  color?: RgbColor;
  /** 高光颜色。默认偏白�?*/
  specular?: RgbColor;
  /** 高光指数，越大越集中。默�?48�?*/
  shininess?: number;
}

/** 兰伯�?+ Blinn-Phong 高光�?*/
export function phong(options: PhongOptions = {}): MaterialDesc {
  const direction = normalize3(options.direction ?? [0.5, 1, 0.6]);
  const color = colorToArray(options.color, [0.9, 0.9, 0.95, 1]);
  const specular = colorToArray(options.specular, [1, 1, 1, 1]);
  return {
    name: 'phong',
    attributes: { position: 'float32x3', normal: 'float32x3', uv: 'float32x2' },
    uniforms: {
      ...SCENE_UNIFORM_FIELDS,
      baseColor: 'vec4f',
      specularColor: 'vec4f',
      lightDirection: 'vec3f',
      cameraPosition: 'vec3f',
      ambient: 'f32',
      shininess: 'f32',
    },
    glsl: {
      vs: `out vec3 vNormal;
out vec3 vWorldPosition;
void main() {
  vec4 worldPosition = u.model * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = u.normalMatrix * normal;
  gl_Position = u.projectionView * worldPosition;
}`,
      fs: `in vec3 vNormal;
in vec3 vWorldPosition;
void main() {
  vec3 n = normalize(vNormal);
  vec3 l = normalize(-u.lightDirection);
  vec3 viewDir = normalize(u.cameraPosition - vWorldPosition);
  vec3 halfDir = normalize(l + viewDir);
  float ndl = max(dot(n, l), 0.0);
  float spec = pow(max(dot(n, halfDir), 0.0), u.shininess);
  vec3 diffuse = u.baseColor.rgb * (u.ambient + (1.0 - u.ambient) * ndl);
  vec3 result = diffuse + u.specularColor.rgb * spec * ndl;
  fragColor = vec4(result, u.baseColor.a);
}`,
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) worldPosition: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let worldPosition = u.model * vec4f(v.position, 1.0);
  out.worldPosition = worldPosition.xyz;
  out.normal = u.normalMatrix * v.normal;
  out.position = u.projectionView * worldPosition;
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let n = normalize(in.normal);
  let l = normalize(-u.lightDirection);
  let viewDir = normalize(u.cameraPosition - in.worldPosition);
  let halfDir = normalize(l + viewDir);
  let ndl = max(dot(n, l), 0.0);
  let spec = pow(max(dot(n, halfDir), 0.0), u.shininess);
  let diffuse = u.baseColor.rgb * (u.ambient + (1.0 - u.ambient) * ndl);
  return vec4f(diffuse + u.specularColor.rgb * spec * ndl, u.baseColor.a);
}`,
    defaults: {
      baseColor: color,
      specularColor: specular,
      lightDirection: direction,
      ambient: options.ambient ?? 0.16,
      shininess: options.shininess ?? 48,
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 调试材质                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** 用法线方向当颜色，用来检查朝向与是否法线出错�?*/
export function normalDebug(): MaterialDesc {
  return {
    name: 'normalDebug',
    attributes: { position: 'float32x3', normal: 'float32x3', uv: 'float32x2' },
    uniforms: { ...SCENE_UNIFORM_FIELDS },
    glsl: {
      vs: `out vec3 vNormal;
void main() {
  vNormal = u.normalMatrix * normal;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec3 vNormal;
void main() {
  fragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
}`,
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.normal = u.normalMatrix * v.normal;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return vec4f(normalize(in.normal) * 0.5 + 0.5, 1.0);
}`,
  };
}

/** 线框/网格线的颜色（配�?`line-list` 拓扑使用）�?*/
export interface FlatLineOptions {
  color?: RgbColor;
  /** 颜色是否随距离衰减（网格线用）。默�?`true`�?*/
  fadeWithDistance?: boolean;
}

/**
 * 纯色线段材质，用于网格线、坐标轴这类 LineData�? *
 * 与其它内置材质的区别：它�?`uv` 作为「衰减因子」（�?`createGrid`/`createAxes` 生成�? * 顶点色提供），所以属性只有一�?`position` 与一�?`uv`�? */
export function flatLine(options: FlatLineOptions = {}): MaterialDesc {
  const color = colorToArray(options.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: 'flatLine',
    topology: 'line-list',
    cullMode: 'none',
    attributes: { position: 'float32x3' },
    uniforms: { ...SCENE_UNIFORM_FIELDS, baseColor: 'vec4f' },
    glsl: {
      vs: `void main() {
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `void main() {
  fragColor = u.baseColor;
}`,
    },
    wgsl: `@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f {
  return u.projectionView * u.model * vec4f(v.position, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.baseColor;
}`,
    defaults: { baseColor: color },
  };
}

/**
 * 带顶点色的线段材质：顶点色来自几何体�?`color` 属性�? * `createGrid` / `createAxes` 生成的数据就是给它的（远端渐隐、坐标轴三色）�? */
export function vertexColorLine(): MaterialDesc {
  return {
    name: 'vertexColorLine',
    topology: 'line-list',
    cullMode: 'none',
    attributes: { position: 'float32x3', color: 'float32x4' },
    uniforms: { ...SCENE_UNIFORM_FIELDS },
    glsl: {
      vs: `out vec4 vColor;
void main() {
  vColor = color;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec4 vColor;
void main() {
  fragColor = vColor;
}`,
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.color = v.color;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return in.color;
}`,
  };
}

/* ------------------------------------------------------------------------------------------------ */

/** 内置材质集合，便于整体引用�?*/
export const materials = {
  unlit,
  lambert,
  phong,
  normalDebug,
  flatLine,
  vertexColorLine,
} as const;

/** 取出材质描述里携带的默认 uniform 值�?*/
export function defaultUniformsOf(desc: MaterialDesc): Record<string, number | ArrayLike<number>> {
  return desc.defaults ? { ...desc.defaults } : {};
}

function normalize3(vector: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}
