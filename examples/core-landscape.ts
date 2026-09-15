/**
 * core 层示例：**一片风景**（天空 / 太阳 / 两层山脊 / 实例化树林 / 清澈的河）。
 *
 * 这一页是 core 层目前最长的一个例子，因为它要证明的是「多通道 + 多管线 + 透明混合」
 * 这些在便捷层里被包起来的东西，用 core 的原始 API 一样写得清楚：
 *
 * - **天空**：一个覆盖裁剪空间的大三角形，`depthStencil.format: null`（不要深度状态），
 *   在片元里按**视线方向**做地平线→天顶的渐变，所以整个视口必然被铺满 ——
 *   清屏色一像素都不会露出来（`CLEAR` 只是兜底，实际不可见）。
 * - **太阳**：`disc + 两层辉光` 在天空着色器里一起算（本体很亮，晕随角度快速衰减）。
 *   同一个 `sunDirection` 又被山脊 / 地形 / 树林的漫反射复用 —— 太阳就是主光源。
 * - **山**：两层「垂直幕布」网格（远山淡、近山深），高度来自哈希噪声 + 正弦叠加；
 *   顶点着色器用 `dFdx/dFdy` 求真实面法线（不用 `cross` 是为了同时兼容两个后端）。
 * - **树林**：树干与树冠各一个网格，每棵树的**模型矩阵 + 颜色走进实例缓冲**
 *   （`stepMode: 'instance'`），于是 500 多棵树只有 **2 次 draw call**。
 * - **河**：先画**河床**（单独的沙石色带网格 + 颗粒噪声），再画**水面**：
 *   `blend + depthWriteEnabled: false`，片元里用 fresnel 把「河床色」与「天空反射色」
 *   混合 —— 垂直看更透明（看得见河床），掠射角更反射天空，再叠一层随时间流动的波纹高光。
 *
 * 管线一共 6 条（天空 / 山脊 / 地形 / 河床 / 树木 / 水面），一帧 9 次 draw call。
 *
 * 查询参数：
 * `?backend=webgl2|webgpu|auto&verify=1&gui=0&t=<秒>&sun=<仰角弧度>&water=<透明度 0..1>&wspin=0`
 */

import GUI from 'lil-gui';

import { BufferUsage, TextureUsage, mat4, vec3 } from '../src/index.js';
import {
  backendFromQuery,
  createCoreExample,
  createUniformBinding,
  reportVerify,
  requireElement,
  setData,
  startFrameLoop,
  verifyOffscreen,
} from './core-shared.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

/* ------------------------------------------------------------------------------------------------ */
/* 常量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 清屏色：**故意选了一个和天空差得很远的颜色**。
 * 天空三角形铺满视口后它根本不可见；正因为它不可见，「截图中出现这个颜色」就成了
 * 「天空没铺满」的硬证据（`scripts/analyze-screenshot.mjs --clear 0.72,0.10,0.62`）。
 */
const CLEAR: readonly [number, number, number, number] = [0.72, 0.1, 0.62, 1];

/**
 * uniform 块的字节布局（**必须与 WGSL 那边的 `struct Uniforms` 完全一致**）：
 *
 * | 字段 | 偏移 |
 * | --- | --- |
 * | `viewProjection` mat4 | 0 |
 * | `inverseViewProjection` mat4 | 64 |
 * | `cameraPosition` vec4 | 128 |
 * | `sunDirection` vec4 | 144（xyz 是单位方向，w 留作强度） |
 * | `timeAndFog` vec4 | 160（x 时间、y 雾浓度、z 山脊雾系数、w 线框开关） |
 * | `water` vec4 | 176（x 透明度、y 反射强度） |
 *
 * 一共 192 字节。注意 WGSL 的 `mat4x4f` 需要 16 字节对齐，所以两个 mat4 之间没有空隙，
 * 但**第一个 mat4 之后的东西不能紧挨着放**（这正是上一版按 112 字节申请、`set()` 越界的坑）。
 */
const UNIFORM_BYTES = 192;
/** 离屏自检的分辨率（16:9，和画布的宽高比一致，探针的分区才可比）。 */
const VERIFY_WIDTH = 480;
const VERIFY_HEIGHT = 270;

/**
 * 相机：站在河岸上 9 单位高、视线下俯约 8.7°。
 *
 * 这个角度是量出来的。地平线在屏幕上的位置由俯角决定：
 * `y = 0.5 + tan(pitch) / (2 * tan(FOV/2))`，`pitch = atan(5.5 / 36) ≈ 8.7°` 时
 * 地平线落在 `y ≈ 0.21` —— 天空占上面两成，地面占下面八成，正好是「河边抬头看」的构图。
 * 相机的横向位置在河岸上（地形的高度函数在 `|x| > 河道半宽` 处才升高，见 {@link channelWeight}）。
 */
const CAMERA_EYE: readonly [number, number, number] = [0, 5, 8];
const CAMERA_TARGET: readonly [number, number, number] = [0, 3.2, -30];
const FOV = (42 * Math.PI) / 180;
const NEAR_PLANE = 0.1;
const FAR_PLANE = 1200;

/** 河面高度：地形在这里被切出河道，低于它的部分就是河床。 */
const WATER_LEVEL = 0;
/** 地形网格的近端深度（相机在 z=+6，所以这里约等于「脚下」）。 */
const TERRAIN_NEAR = 8;
/** 地形网格的远端深度：远到被雾吃掉、和山脊接上。 */
const TERRAIN_FAR = 430;
/** 地形沿深度的行数（行距按 v^TERRAIN_V_POWER 拉开：近处密、远处疏）。 */
const TERRAIN_ROWS = 46;
const TERRAIN_V_POWER = 0.72;
/** 地形每行的横向列数（列在哪由 hash 决定，见 {@link buildTerrainMesh}）。 */
const TERRAIN_COLS = 58;

/** 山脊的一层：深度、幕布底高、高度倍率、高度偏移、相位、颜色、雾强度。 */
interface RidgeSpec {
  readonly depth: number;
  readonly base: number;
  readonly scale: number;
  readonly offset: number;
  readonly phase: number;
  readonly color: readonly [number, number, number];
  readonly haze: number;
}

/**
 * 两层山脊。
 *
 * 高度是**按屏幕高度反推**出来的，不是随手填的：相机高 4.5、下俯 `atan(2 / 36) ≈ 17°` 时，
 * 世界高度 `H` 在深度 `d` 处投到屏幕上的纵向位置约为
 * `y = 0.5 + (H - 4.5) / (d * tan(17°)) * 0.5 / tan(21°)`（`tan(21°)` 来自 42° 的垂直 FOV）。
 * 取「远山最高到屏幕 0.24（地平线上约 12°）、近山到 0.375（约 7°）」这两个值，
 * 解出下面的 `scale + offset`：远山 118 + 40、近山 32 + 14。
 */
const RIDGES: readonly RidgeSpec[] = [
  // 远山：更远、更高、更淡（雾更重），颜色偏冷。
  { depth: 240, base: -60, scale: 118, offset: 40, phase: 0.0, color: [0.4, 0.47, 0.58], haze: 0.35 },
  // 近山：更近、更矮、更深，能看清受光面。
  { depth: 78, base: -20, scale: 32, offset: 14, phase: 2.3, color: [0.19, 0.28, 0.24], haze: 0.12 },
];

/** 山脊幕布网格的规模（列 × 行）。 */
const RIDGE_COLS = 150;
const RIDGE_ROWS = 5;
/** 幕布横向覆盖（世界单位）：远山的可见半宽约 394，取 430 保证铺出画面。 */
const RIDGE_HALF_WIDTH = 430;

/** 河床 / 河面沿深度的采样点数与横向采样点数。 */
const RIVER_ROWS = 40;
const RIVER_COLS = 22;

/** 树林：目标棵数（`?trees=` 调，上限见 {@link MAX_TREES}）。 */
const TREE_COUNT = 520;
const MAX_TREES = 4000;

/* ------------------------------------------------------------------------------------------------ */
/* 共用 GLSL 片段（噪声 / 雾 / 天空）                                                                    */
/* ------------------------------------------------------------------------------------------------ */


/**
 * uniform 块在 GLSL 里是**逐 stage 声明**的：片元着色器用到的字段必须在片元着色器里
 * 再写一遍（两个后端都要求这么做，`core-box.ts` 也是同一份写法）。
 */
const UNIFORM_BLOCK_GLSL = `
layout(std140) uniform Uniforms {
  mat4 viewProjection;
  mat4 inverseViewProjection;
  vec4 cameraPosition;
  vec4 sunDirection;
  vec4 timeAndFog;
  vec4 water;
} u;
`;


/** 与 GLSL 对应的 WGSL 常量与函数（入口不同、语言不同，公式逐行一致）。 */
const WGSL_COMMON = `
const SKY_HORIZON: vec3f = vec3f(0.62, 0.68, 0.7);
const SKY_ZENITH: vec3f = vec3f(0.14, 0.36, 0.74);

fn hash11(p: f32) -> f32 {
  var q = fract(p * 0.1031);
  q = q * (q + 33.33);
  q = q * (q + q);
  return fract(q);
}

fn hash21(p: vec2f) -> f32 {
  var q = fract(vec3f(p.x, p.y, p.x) * vec3f(0.1031, 0.1030, 0.0973));
  q = q + dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm3(p: vec2f) -> f32 {
  var total = 0.0;
  var amplitude = 0.5;
  var point = p;
  for (var i = 0; i < 3; i = i + 1) {
    total = total + valueNoise(point) * amplitude;
    point = point * 2.07 + vec2f(13.1, 7.3);
    amplitude = amplitude * 0.5;
  }
  return total;
}

fn gridLines(position: vec2f) -> f32 {
  let width = max(fwidth(position), vec2f(0.0001));
  let grid = abs(fract(position - 0.5) - 0.5) / width;
  return 1.0 - clamp(min(grid.x, grid.y), 0.0, 1.0);
}

fn fogMix(color: vec3f, distanceToCamera: f32, density: f32) -> vec3f {
  return mix(color, SKY_HORIZON, 1.0 - exp(-distanceToCamera * density));
}

`;

/* ------------------------------------------------------------------------------------------------ */
/* 天空                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** 天空基色：地平线（暖）与天顶（蓝）写在 GLSL 里，WGSL 那边是 {@link WGSL_COMMON} 的同名常量。 */
const SKY_COLORS_GLSL = `
const vec3 SKY_HORIZON = vec3(0.62, 0.68, 0.7);
const vec3 SKY_ZENITH = vec3(0.14, 0.36, 0.74);
`;

/**
 * 哈希与噪声：全部是**确定性的**，不依赖任何外部数据或随机种子 —— 每帧、每次刷新
 * 生成的几何体与颜色都一样，截图才能比对。
 *
 * 局部的 `fade` 变量名不能叫 `u`：`u` 是下面 uniform 块的名字，局部变量会把它遮住。
 */
const SHADER_COMMON_GLSL = `
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 fade = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, fade.x), mix(c, d, fade.x), fade.y);
}

float fbm3(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    total += valueNoise(p) * amplitude;
    p = p * 2.07 + vec2(13.1, 7.3);
    amplitude *= 0.5;
  }
  return total;
}

vec3 fogMix(vec3 color, float distanceToCamera, float density) {
  return mix(color, SKY_HORIZON, 1.0 - exp(-distanceToCamera * density));
}

`;

/**
 * 只有片元着色器能用的部分：`fwidth` 是**导数函数**，在顶点着色器里 GLSL ES 3.0 不允许
 * （所以它不能放进 {@link COMMON_GLSL}，否则天空的顶点着色器会编译失败）。
 */
const FRAGMENT_ONLY_GLSL = `
// 屏幕细网格：只给「线框」调试开关用。
float gridLines(vec2 position) {
  vec2 grid = abs(fract(position - 0.5) - 0.5) / max(fwidth(position), vec2(0.0001));
  return 1.0 - clamp(min(grid.x, grid.y), 0.0, 1.0);
}
`;

const LANDSCAPE_HELPERS_GLSL = `
// 与 buildTerrainMesh 里的高度函数逐字对应（地形网格、河床、种树都读同一份公式）。
float channelWeight(vec2 p) {
  float depth = max(u.cameraPosition.z - p.y, 4.0);
  float halfWidth = 0.105 * depth;
  float meander = sin(p.y * 0.021) * 0.34 * depth + sin(p.y * 0.0073) * 0.55 * depth;
  float lateral = abs(p.x - meander) / halfWidth;
  return 1.0 - smoothstep(0.62, 1.0, lateral);
}

float groundHeight(vec2 p) {
  float depth = max(u.cameraPosition.z - p.y, 4.0);
  float channel = channelWeight(p);
  float bed = -0.85 + fbm3(p * 0.42) * 0.34 + sin(p.x * 1.7 + p.y * 0.9) * 0.05;
  float terrain = (5.0 * depth) / 430.0 + 0.3 + fbm3(p * 0.022) * 4.0;
  // channelWeight 在河道中心是 1、在岸上是 0，所以「河岸权重」就是 1 - channel。
  // 反过来的话整片地形都会变成河床高度 —— 这一版最初就是这么写错的。
  return mix(bed, terrain, 1.0 - channel);
}
`;

const COMMON_GLSL = `${UNIFORM_BLOCK_GLSL}
${SKY_COLORS_GLSL}
${SHADER_COMMON_GLSL}
${LANDSCAPE_HELPERS_GLSL}`;

/** 片元着色器专用前缀：{@link COMMON_GLSL} + 依赖导数的网格函数。 */
const COMMON_FRAGMENT_GLSL = `${COMMON_GLSL}
${FRAGMENT_ONLY_GLSL}`;

const SKY_VERTEX_GLSL = `
layout(location = 0) in vec3 position;

${COMMON_GLSL}

out vec3 vRay;

void main() {
  // 逆矩阵的 w 分量给出「该屏幕位置对应的方向的齐次系数」，除以它才是真正的视线方向。
  // 注意：WebGPU 的逆矩阵是同一个（投影部分两后端的零到一区别已经包含在里面）。
  vec4 point = u.inverseViewProjection * vec4(position, 1.0);
  vRay = point.xyz / point.w - u.cameraPosition.xyz;
  gl_Position = vec4(position, 1.0);
}
`;

const SKY_FRAGMENT_GLSL = `
in vec3 vRay;

layout(location = 0) out vec4 fragColor;

${COMMON_FRAGMENT_GLSL}

void main() {
  vec3 ray = normalize(vRay);
  vec3 sun = normalize(u.sunDirection.xyz);
  float height = clamp(ray.y, -1.0, 1.0);

  // 地平线偏暖 → 天顶偏蓝：pow 让暖色只挤在地平线附近的一薄层里。
  vec3 color = mix(SKY_HORIZON, SKY_ZENITH, pow(clamp(height, 0.0, 1.0), 0.5));
  // 越贴地平线越亮（大气散射的廉价近似）。
  color += vec3(0.1, 0.09, 0.05) * pow(1.0 - clamp(abs(height), 0.0, 1.0), 6.0);

  // 太阳：本体 + 两层辉光。cos 越大越亮，宽度由幂次控制（幂次越大衰减越快）。
  float sunAngle = max(dot(ray, sun), 0.0);
  color += vec3(1.2, 1.0, 0.8) * pow(sunAngle, 900.0);   // 本体：一个很亮的圆盘
  color += vec3(0.5, 0.4, 0.26) * pow(sunAngle, 14.0);   // 近晕
  color += vec3(0.24, 0.2, 0.16) * pow(sunAngle, 3.0);   // 远晕

  // 地平线以下的半个球面也画上（地表会盖住它），保证任何视线都有颜色。
  fragColor = vec4(color, 1.0);
}
`;

const SKY_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct SkyVertexInput {
  @location(0) position: vec3f,
}

struct SkyVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) ray: vec3f,
}

@vertex fn vsMain(v: SkyVertexInput) -> SkyVertexOutput {
  var out: SkyVertexOutput;
  let point = u.inverseViewProjection * vec4f(v.position, 1.0);
  out.ray = point.xyz / point.w - u.cameraPosition.xyz;
  out.position = vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: SkyVertexOutput) -> @location(0) vec4f {
  let ray = normalize(in.ray);
  let sun = normalize(u.sunDirection.xyz);
  let height = clamp(ray.y, -1.0, 1.0);

  var color = mix(SKY_HORIZON, SKY_ZENITH, pow(clamp(height, 0.0, 1.0), 0.5));
  color = color + vec3f(0.1, 0.09, 0.05) * pow(1.0 - clamp(abs(height), 0.0, 1.0), 6.0);

  let sunAngle = max(dot(ray, sun), 0.0);
  color = color + vec3f(1.2, 1.0, 0.8) * pow(sunAngle, 900.0);
  color = color + vec3f(0.5, 0.4, 0.26) * pow(sunAngle, 14.0);
  color = color + vec3f(0.24, 0.2, 0.16) * pow(sunAngle, 3.0);

  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 山脊（垂直幕布）                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const RIDGE_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${COMMON_GLSL}

out vec3 vColor;
out vec3 vNormal;
out vec3 vWorld;
out float vDistance;

void main() {
  vColor = color;
  vNormal = normal;
  vWorld = position;
  vDistance = length(position - u.cameraPosition.xyz);
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const RIDGE_FRAGMENT_GLSL = `
in vec3 vColor;
in vec3 vNormal;
in vec3 vWorld;
in float vDistance;

layout(location = 0) out vec4 fragColor;

${COMMON_FRAGMENT_GLSL}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  // 背光面也留一点余地，山体才不会一边黑成剪影。
  float diffuse = 0.45 + 0.55 * max(dot(normal, sun), 0.0);
  vec3 color = vColor * diffuse;
  // 太阳方向的暖色描边：让山脊线在天空里更清楚。
  vec3 sunFlat = normalize(vec3(sun.x, 0.0, sun.z));
  float side = max(dot(normalize(vec3(normal.x, 0.0, normal.z)), sunFlat), 0.0);
  color += vec3(0.26, 0.17, 0.06) * pow(side, 2.0);
  // 山脚被自己的正面挡住、又离相机远，所以雾比山顶重。
  float haze = clamp(u.timeAndFog.z * 0.4 + vWorld.y * 0.0016, 0.0, 0.85);
  color = fogMix(color, vDistance, haze);
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3(0.95, 0.95, 1.0), 0.6 * gridLines(vWorld.xz * 0.25));
  }
  fragColor = vec4(color, 1.0);
}
`;

const RIDGE_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct RidgeVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct RidgeVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) normal: vec3f,
  @location(2) world: vec3f,
  @location(3) distance: f32,
}

@vertex fn vsMain(v: RidgeVertexInput) -> RidgeVertexOutput {
  var out: RidgeVertexOutput;
  out.color = v.color;
  out.normal = v.normal;
  out.world = v.position;
  out.distance = length(v.position - u.cameraPosition.xyz);
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: RidgeVertexOutput) -> @location(0) vec4f {
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  let diffuse = 0.45 + 0.55 * max(dot(normal, sun), 0.0);
  var color = in.color * diffuse;
  let sunFlat = normalize(vec3f(sun.x, 0.0, sun.z));
  let side = max(dot(normalize(vec3f(normal.x, 0.0, normal.z)), sunFlat), 0.0);
  color = color + vec3f(0.26, 0.17, 0.06) * pow(side, 2.0);
  let haze = clamp(u.timeAndFog.z * 0.4 + in.world.y * 0.0016, 0.0, 0.85);
  color = fogMix(color, in.distance, haze);
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3f(0.95, 0.95, 1.0), 0.6 * gridLines(in.world.xz * 0.25));
  }
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 地形（河岸 + 山坡），河道处 discard                                                                   */
/* ------------------------------------------------------------------------------------------------ */




/** 高度场网格的顶点着色器：解析法线（fbm3 的有限差分），比 dFdx 在陡坡上稳。 */
const TERRAIN_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${COMMON_GLSL}

out vec3 vColor;
out vec3 vNormal;
out vec3 vWorld;
out float vDistance;

void main() {
  vWorld = position;
  vDistance = length(position - u.cameraPosition.xyz);
  float epsilon = 0.18;
  float heightX = groundHeight(position.xz + vec2(epsilon, 0.0));
  float heightZ = groundHeight(position.xz + vec2(0.0, epsilon));
  vNormal = normalize(vec3(
    position.y - heightX,
    epsilon,
    position.y - heightZ));
  vColor = color;
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const TERRAIN_FRAGMENT_GLSL = `
in vec3 vColor;
in vec3 vNormal;
in vec3 vWorld;
in float vDistance;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  vec2 p = vWorld.xz;
  // 河床单独由河床管线画（沙石色 + 颗粒噪声），这里把河道整块挖掉：
  // 两个网格的边界都是同一条 channelWeight 等值线，所以拼缝严丝合缝。
  if (channelWeight(p) > 0.02) {
    discard;
  }
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  // 迎光坡亮、背光坡暗 —— 太阳方向能在地形上直接看出来。
  float diffuse = 0.2 + 0.9 * max(dot(normal, sun), 0.0);
  vec3 color = vColor * diffuse;
  color += vec3(0.2, 0.14, 0.05) * pow(max(dot(normal, sun), 0.0), 4.0);
  color = fogMix(color, vDistance, u.timeAndFog.z);
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3(0.95, 0.95, 1.0), 0.7 * gridLines(p * 0.5));
  }
  fragColor = vec4(color, 1.0);
}
`;

const TERRAIN_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

fn channelWeight(p: vec2f) -> f32 {
  let depth = max(u.cameraPosition.z - p.y, 4.0);
  let halfWidth = 0.105 * depth;
  let meander = sin(p.y * 0.021) * 0.34 * depth + sin(p.y * 0.0073) * 0.55 * depth;
  let lateral = abs(p.x - meander) / halfWidth;
  return 1.0 - smoothstep(0.62, 1.0, lateral);
}

fn groundHeight(p: vec2f) -> f32 {
  let depth = max(u.cameraPosition.z - p.y, 4.0);
  let channel = channelWeight(p);
  let bed = -0.85 + fbm3(p * 0.42) * 0.34 + sin(p.x * 1.7 + p.y * 0.9) * 0.05;
  let terrain = (5.0 * depth) / 430.0 + 0.3 + fbm3(p * 0.022) * 4.0;
  // channelWeight 在河道中心是 1、在岸上是 0，所以「河岸权重」就是 1 - channel。
  // 反过来的话整片地形都会变成河床高度 —— 这一版最初就是这么写错的。
  return mix(bed, terrain, 1.0 - channel);
}

struct TerrainVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct TerrainVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) normal: vec3f,
  @location(2) world: vec3f,
  @location(3) distance: f32,
}

@vertex fn vsMain(v: TerrainVertexInput) -> TerrainVertexOutput {
  var out: TerrainVertexOutput;
  out.world = v.position;
  out.distance = length(v.position - u.cameraPosition.xyz);
  let epsilon = 0.18;
  let heightX = groundHeight(v.position.xz + vec2f(epsilon, 0.0));
  let heightZ = groundHeight(v.position.xz + vec2f(0.0, epsilon));
  out.normal = normalize(vec3f(
    v.position.y - heightX,
    epsilon,
    v.position.y - heightZ));
  out.color = v.color;
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: TerrainVertexOutput) -> @location(0) vec4f {
  let p = in.world.xz;
  if (channelWeight(p) > 0.02) {
    discard;
  }
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  let diffuse = 0.36 + 0.74 * max(dot(normal, sun), 0.0);
  var color = in.color * diffuse;
  color = color + vec3f(0.2, 0.14, 0.05) * pow(max(dot(normal, sun), 0.0), 4.0);
  color = fogMix(color, in.distance, u.timeAndFog.z);
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3f(0.95, 0.95, 1.0), 0.7 * gridLines(p * 0.5));
  }
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 河床（沙石 / 卵石）                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const RIVERBED_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${UNIFORM_BLOCK_GLSL}

out vec3 vNormal;
out vec3 vWorld;
out float vDistance;

void main() {
  vNormal = normal;
  vWorld = position;
  vDistance = length(position - u.cameraPosition.xyz);
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const RIVERBED_FRAGMENT_GLSL = `
in vec3 vNormal;
in vec3 vWorld;
in float vDistance;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  vec2 p = vWorld.xz;
  // 颗粒：大颗粒是「卵石」（一团团亮斑），小颗粒是砂砾。
  float pebbles = smoothstep(0.52, 1.0, fbm3(p * 0.95));
  float grit = fbm3(p * 3.6);
  // 沙石底：暖沙色 + 卵石偏青灰 + 砂砾的明暗。
  vec3 sand = vec3(0.82, 0.74, 0.55);
  vec3 stone = vec3(0.58, 0.6, 0.52);
  vec3 color = mix(sand, stone, pebbles * 0.85);
  color *= 0.6 + 0.7 * grit;
  // 水面波纹投在河床上的晃动光斑：让「透过水看到的河床」是活的。
  float ripple = sin(p.x * 2.3 + u.timeAndFog.x * 1.7) * sin(p.y * 1.9 - u.timeAndFog.x * 1.3);
  color += vec3(0.16, 0.17, 0.1) * ripple * 0.5;
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  color *= 0.45 + 0.75 * max(dot(normal, sun), 0.0);
  color = fogMix(color, vDistance, u.timeAndFog.z * 0.75);
  fragColor = vec4(color, 1.0);
}
`;

const RIVERBED_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct RiverbedVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct RiverbedVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) world: vec3f,
  @location(2) distance: f32,
}

@vertex fn vsMain(v: RiverbedVertexInput) -> RiverbedVertexOutput {
  var out: RiverbedVertexOutput;
  out.normal = v.normal;
  out.world = v.position;
  out.distance = length(v.position - u.cameraPosition.xyz);
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: RiverbedVertexOutput) -> @location(0) vec4f {
  let p = in.world.xz;
  let pebbles = smoothstep(0.52, 1.0, fbm3(p * 0.95));
  let grit = fbm3(p * 3.6);
  let sand = vec3f(0.82, 0.74, 0.55);
  let stone = vec3f(0.58, 0.6, 0.52);
  var color = mix(sand, stone, pebbles * 0.85);
  color = color * (0.6 + 0.7 * grit);
  let ripple = sin(p.x * 2.3 + u.timeAndFog.x * 1.7) * sin(p.y * 1.9 - u.timeAndFog.x * 1.3);
  color = color + vec3f(0.16, 0.17, 0.1) * ripple * 0.5;
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  color = color * (0.45 + 0.75 * max(dot(normal, sun), 0.0));
  color = fogMix(color, in.distance, u.timeAndFog.z * 0.75);
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 树林（实例化：树干与树冠各一次 draw call）                                                            */
/* ------------------------------------------------------------------------------------------------ */

const TREE_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 extra;
layout(location = 3) in mat4 instanceMatrix;
layout(location = 7) in vec3 instanceColor;
layout(location = 8) in vec2 instanceInfo;

${UNIFORM_BLOCK_GLSL}

out vec3 vNormal;
out vec3 vColor;
out vec3 vWorld;
out float vDistance;
out float vLocalY;
out float vPart;

void main() {
  vec4 world = instanceMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(instanceMatrix) * normal);
  vColor = instanceColor;
  vDistance = length(world.xyz - u.cameraPosition.xyz);
  vLocalY = position.y;
  vPart = instanceInfo.x;
  gl_Position = u.viewProjection * world;
}
`;

const TREE_FRAGMENT_GLSL = `
in vec3 vNormal;
in vec3 vColor;
in vec3 vWorld;
in float vDistance;
in float vLocalY;
in float vPart;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  float diffuse = 0.38 + 0.62 * max(dot(normal, sun), 0.0);
  vec3 color = vColor;

  // 树冠上点几道斜纹，远看才有「枝叶」的层次；树干则沿高度略微变暗。
  if (vPart > 0.5) {
    float branch = sin((vWorld.x + vWorld.z) * 2.6 + vLocalY * 7.0);
    color *= 0.86 + 0.22 * smoothstep(-0.15, 0.75, branch);
  } else {
    color *= 0.78 + 0.3 * clamp(vLocalY * 1.6, 0.0, 1.0);
  }

  color *= diffuse;
  color = fogMix(color, vDistance, u.timeAndFog.z * 0.7);
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3(0.95, 0.95, 1.0), 0.7 * gridLines(vWorld.xz * 0.4));
  }
  fragColor = vec4(color, 1.0);
}
`;

const TREE_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct TreeVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) extra: vec2f,
  @location(3) instanceMatrix0: vec4f,
  @location(4) instanceMatrix1: vec4f,
  @location(5) instanceMatrix2: vec4f,
  @location(6) instanceMatrix3: vec4f,
  @location(7) instanceColor: vec3f,
  @location(8) instanceInfo: vec2f,
}

struct TreeVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec3f,
  @location(2) world: vec3f,
  @location(3) distance: f32,
  @location(4) localY: f32,
  @location(5) part: f32,
}

@vertex fn vsMain(v: TreeVertexInput) -> TreeVertexOutput {
  let instanceMatrix = mat4x4f(v.instanceMatrix0, v.instanceMatrix1, v.instanceMatrix2, v.instanceMatrix3);
  var out: TreeVertexOutput;
  let world = instanceMatrix * vec4f(v.position, 1.0);
  out.world = world.xyz;
  out.normal = normalize((instanceMatrix * vec4f(v.normal, 0.0)).xyz);
  out.color = v.instanceColor;
  out.distance = length(world.xyz - u.cameraPosition.xyz);
  out.localY = v.position.y;
  out.part = v.instanceInfo.x;
  out.position = u.viewProjection * world;
  return out;
}

@fragment fn fsMain(in: TreeVertexOutput) -> @location(0) vec4f {
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  let diffuse = 0.38 + 0.62 * max(dot(normal, sun), 0.0);
  var color = in.color;
  if (in.part > 0.5) {
    let branch = sin((in.world.x + in.world.z) * 2.6 + in.localY * 7.0);
    color = color * (0.86 + 0.22 * smoothstep(-0.15, 0.75, branch));
  } else {
    color = color * (0.78 + 0.3 * clamp(in.localY * 1.6, 0.0, 1.0));
  }
  color = color * diffuse;
  color = fogMix(color, in.distance, u.timeAndFog.z * 0.7);
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3f(0.95, 0.95, 1.0), 0.7 * gridLines(in.world.xz * 0.4));
  }
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 水面（透明 + fresnel + 波纹高光）                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const WATER_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${UNIFORM_BLOCK_GLSL}

out vec2 vWaterUv;
out vec3 vWorld;
out float vDistance;

void main() {
  vWorld = position;
  // 河道是沿 z 走的，所以用 (x, z) 当波纹的二维参数就够（无需 uv 属性）。
  vWaterUv = position.xz;
  vDistance = length(position - u.cameraPosition.xyz);
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const WATER_FRAGMENT_GLSL = `
in vec2 vWaterUv;
in vec3 vWorld;
in float vDistance;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  // 波纹：三层不同频率/方向的正弦叠加，只用来扰动法线，不改变几何。
  float wave = 0.0;
  wave += sin(vWaterUv.x * 1.5 + u.timeAndFog.x * 1.7) * 0.5;
  wave += sin(vWaterUv.y * 1.2 - u.timeAndFog.x * 1.1) * 0.4;
  wave += sin((vWaterUv.x + vWaterUv.y) * 2.6 + u.timeAndFog.x * 2.2) * 0.25;
  vec3 normal = normalize(vec3(wave * 0.09, 1.0, wave * 0.07));

  vec3 view = u.cameraPosition.xyz - vWorld;
  vec3 viewDir = normalize(view);
  vec3 sun = normalize(u.sunDirection.xyz);

  // fresnel：垂直看下去 → 小（看得见河床）；掠射角 → 大（反射天空）。
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  fresnel = 0.1 + 0.7 * fresnel;

  // 反射色：往太阳方向抬高一点再采天空，得到「水面上的天空」。
  vec3 reflected = normalize(reflect(-viewDir, normal));
  float height = clamp(reflected.y, 0.0, 1.0);
  vec3 sky = mix(SKY_HORIZON, SKY_ZENITH, pow(height, 0.5));
  float sunAngle = max(dot(reflected, sun), 0.0);
  sky += vec3(1.0, 0.9, 0.7) * pow(sunAngle, 64.0) * 0.7;

  // 水面自身的水色（青蓝），保证「河」即使全反射也还是条河。
  vec3 deep = vec3(0.06, 0.32, 0.42);
  // 水浅的地方（河床近）水色会被河床的暖色透上来，所以这里按 fresnel 补一点暖调。
  vec3 shallowTint = vec3(0.16, 0.2, 0.12) * (1.0 - fresnel);

  // 水面自身的颜色 = 水色 → 天空反射（fresnel 越高越像镜子）。
  vec3 color = mix(deep, sky, clamp(fresnel * u.water.y, 0.0, 0.85)) + shallowTint;
  // 掠射角的锐利镜面高光：水面的「闪光」。
  float glint = pow(max(dot(reflected, sun), 0.0), 180.0);
  color += vec3(1.0, 0.95, 0.85) * glint * 1.6;

  // 透明度就是「清澈」：垂直看下去 alpha 低（河床看得清），掠射角 alpha 高（反射天空）。
  // 上下限都留着，所以两个极端下河床与天空反射都还在，不会变成纯镜面或纯玻璃。
  float alpha = clamp(u.water.x * (0.34 + 0.66 * fresnel), 0.04, 0.9);
  color = fogMix(color, vDistance, u.timeAndFog.z * 0.8);
  fragColor = vec4(color, alpha);
}
`;

const WATER_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct WaterVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct WaterVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) waterUv: vec2f,
  @location(1) world: vec3f,
  @location(2) distance: f32,
}

@vertex fn vsMain(v: WaterVertexInput) -> WaterVertexOutput {
  var out: WaterVertexOutput;
  out.world = v.position;
  out.waterUv = v.position.xz;
  out.distance = length(v.position - u.cameraPosition.xyz);
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: WaterVertexOutput) -> @location(0) vec4f {
  var wave = 0.0;
  wave = wave + sin(in.waterUv.x * 1.5 + u.timeAndFog.x * 1.7) * 0.5;
  wave = wave + sin(in.waterUv.y * 1.2 - u.timeAndFog.x * 1.1) * 0.4;
  wave = wave + sin((in.waterUv.x + in.waterUv.y) * 2.6 + u.timeAndFog.x * 2.2) * 0.25;
  let normal = normalize(vec3f(wave * 0.09, 1.0, wave * 0.07));

  let view = u.cameraPosition.xyz - in.world;
  let viewDir = normalize(view);
  let sun = normalize(u.sunDirection.xyz);

  var fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  fresnel = 0.1 + 0.7 * fresnel;

  let reflected = normalize(reflect(-viewDir, normal));
  let height = clamp(reflected.y, 0.0, 1.0);
  let sky = mix(SKY_HORIZON, SKY_ZENITH, pow(height, 0.5));
  let sunAngle = max(dot(reflected, sun), 0.0);
  sky = sky + vec3f(1.0, 0.9, 0.7) * pow(sunAngle, 64.0) * 0.7;

  let deep = vec3f(0.06, 0.32, 0.42);
  let shallowTint = vec3f(0.16, 0.2, 0.12) * (1.0 - fresnel);

  var color = mix(deep, sky, clamp(fresnel * u.water.y, 0.0, 0.85)) + shallowTint;
  let glint = pow(max(dot(reflected, sun), 0.0), 180.0);
  color = color + vec3f(1.0, 0.95, 0.85) * glint * 1.6;

  let alpha = clamp(u.water.x * (0.34 + 0.66 * fresnel), 0.04, 0.9);
  color = fogMix(color, in.distance, u.timeAndFog.z * 0.8);
  return vec4f(color, alpha);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 几何体构建                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** 顶点属性：位置 / 法线 / 颜色 / 备用两通道（山脊放 `[相位, 高度比]`，其它当 0）。 */
type VertexWriter = (
  index: number,
  u: number,
  v: number,
) => {
  readonly position: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
  readonly color: readonly [number, number, number];
  readonly extra?: readonly [number, number];
};

/** 网格缓冲：索引统一用 `uint32`（顶点数会超过 65535）。 */
interface MeshBuffers {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly extras: Float32Array;
  readonly indices: Uint32Array;
  readonly vertexCount: number;
  readonly indexCount: number;
  readonly triangleCount: number;
}

/** 顶点属性步长（字节）：position 12 + normal 12 + color 12 + extra 8 = 44。 */
const MESH_STRIDE = 44;

/** 按 `(cols+1) × (rows+1)` 的规则网格调 {@link VertexWriter}，顺序索引成三角形列表。 */
function buildGridMesh(cols: number, rows: number, write: VertexWriter): MeshBuffers {
  const vertexCount = (cols + 1) * (rows + 1);
  const indices = new Uint32Array(cols * rows * 6);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const extras = new Float32Array(vertexCount * 2);
  let cursor = 0;
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const index = row * (cols + 1) + col;
      const vertex = write(index, cols === 0 ? 0 : col / cols, rows === 0 ? 0 : row / rows);
      positions[index * 3] = vertex.position[0];
      positions[index * 3 + 1] = vertex.position[1];
      positions[index * 3 + 2] = vertex.position[2];
      normals[index * 3] = vertex.normal[0];
      normals[index * 3 + 1] = vertex.normal[1];
      normals[index * 3 + 2] = vertex.normal[2];
      colors[index * 3] = vertex.color[0];
      colors[index * 3 + 1] = vertex.color[1];
      colors[index * 3 + 2] = vertex.color[2];
      extras[index * 2] = vertex.extra?.[0] ?? 0;
      extras[index * 2 + 1] = vertex.extra?.[1] ?? 0;
      if (col < cols && row < rows) {
        const next = index + cols + 1;
        indices[cursor++] = index;
        indices[cursor++] = index + 1;
        indices[cursor++] = next + 1;
        indices[cursor++] = index;
        indices[cursor++] = next + 1;
        indices[cursor++] = next;
      }
    }
  }
  return {
    positions,
    normals,
    colors,
    extras,
    indices,
    vertexCount,
    indexCount: indices.length,
    triangleCount: indices.length / 3,
  };
}

/** 确定性哈希 → [0,1)；几何布局每次刷新都一样，截图才能比对。 */
function hash(index: number, seed: number): number {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(seed + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000;
}

/** 与着色器里的 `channelWeight` **数值一致**：1 = 河道正中，0 = 完全在岸上。 */
function channelWeight(x: number, z: number, cameraZ: number): number {
  const depth = Math.max(cameraZ - z, 4);
  const halfWidth = 0.105 * depth;
  const meander = Math.sin(z * 0.021) * 0.34 * depth + Math.sin(z * 0.0073) * 0.55 * depth;
  const lateral = Math.abs(x - meander) / halfWidth;
  return 1 - smoothstep(0.62, 1, lateral);
}

/**
 * 地形网格：**横向范围随深度线性增长**。
 *
 * 这是这一页构图的关键：透视里「深度 d 处的可见半宽」正好正比于 d，所以只要让每行的
 * 横向覆盖也是 `常数 × d`，地形就永远铺满画面左右两侧（不会在近处露出画面外的空白，
 * 也不会在远处缩成一条）。河道宽度用同一个比例（{@link RIVER_WIDTH_RATIO}），
 * 于是「河占画面宽度的比例」从近到远基本恒定 —— 这才像一条流向地平线的河。
 */
function buildTerrainMesh(): MeshBuffers {
  const cameraZ = CAMERA_EYE[2];
  const depthAt = (v: number): number => TERRAIN_NEAR + (TERRAIN_FAR - TERRAIN_NEAR) * Math.pow(v, TERRAIN_V_POWER);
  return buildGridMesh(TERRAIN_COLS, TERRAIN_ROWS, (index, u, v) => {
    const depth = depthAt(v);
    // 列的位置由 hash 打散：均匀铺在远处会形成规则的四边形网格，看起来像「一块布」。
    const t = (u * 2 - 1) + (hash(index, 71) - 0.5) * (2 / TERRAIN_COLS);
    const sign = t < 0 ? -1 : 1;
    const magnitude = Math.pow(Math.abs(t), 1.12);
    // 1.45 倍可见半宽：远景的左右两端一定在画面之外，边缘的斜切面看不见。
    const x = sign * magnitude * 1.45 * 0.615 * depth;
    const z = cameraZ - depth;
    const channel = channelWeight(x, z, cameraZ);
    const height = groundHeightCpu(x, z, cameraZ);
    // 颜色：河岸是草地绿、坡上偏森林绿、高处偏灰（岩石），再叠一点噪声打散。
    const slope = clampMagnitude((fbm2(x * 0.34, z * 0.34) + noise2(x * 0.09, z * 0.09)) * 0.5);
    const rocky = smoothstep(3.2, 10, height);
    const grass: readonly [number, number, number] = [0.26, 0.45, 0.18];
    const forest: readonly [number, number, number] = [0.14, 0.3, 0.14];
    const rock: readonly [number, number, number] = [0.42, 0.4, 0.36];
    const green = mixColor(grass, forest, slope);
    const color = mixColor(green, rock, rocky * 0.8);
    // 备用通道：第 0 位是 channelWeight（调试/可视化用），第 1 位留 0。
    return {
      position: [x, height, z],
      normal: [0, 1, 0],
      color: [color[0], color[1], color[2]],
      extra: [channel, 0],
    };
  });
}

/** 与着色器里的 `groundHeight` **数值一致**：河道里是河床，河道外是河岸/山坡。 */
function groundHeightCpu(x: number, z: number, cameraZ: number): number {
  const depth = Math.max(cameraZ - z, 4);
  const channel = channelWeight(x, z, cameraZ);
  const bed = riverbedHeight(x, z);
  // 河岸高度正比于深度：远端（depth = TERRAIN_FAR）正好收敛到相机高度，地平线不会被顶穿。
  const terrain = (CAMERA_EYE[1] * depth) / TERRAIN_FAR + 0.3 + fbm2(x * 0.022, z * 0.022) * 4;
  return bed + (terrain - bed) * (1 - channel);
}

/**
 * 河床高度：只要比水面低就行，剩下的交给沙石着色器。
 * 与着色器里的常量逐字对应（水面高度是 {@link WATER_LEVEL}）。
 */
function riverbedHeight(x: number, z: number): number {
  return -0.85 + noise2(x * 0.42, z * 0.42) * 0.34 + Math.sin(x * 1.7 + z * 0.9) * 0.05;
}

/** 河道宽度占「该深度可见半宽」的比例（可见半宽 ≈ 0.615 × 深度）。 */
const RIVER_WIDTH_RATIO = 0.105;

/** 河床 / 河面的网格：沿深度的带状网格，横向按 `width(u)` 展宽。 */
function buildRiverMesh(flat: boolean): MeshBuffers {
  const cameraZ = CAMERA_EYE[2];
  const depthAt = (v: number): number => TERRAIN_NEAR + (TERRAIN_FAR * 0.62 - TERRAIN_NEAR) * Math.pow(v, TERRAIN_V_POWER);
  return buildGridMesh(RIVER_COLS, RIVER_ROWS, (_index, u, v) => {
    const depth = depthAt(v);
    const z = cameraZ - depth;
    const halfWidth = RIVER_WIDTH_RATIO * depth;
    const meander = Math.sin(z * 0.021) * 0.34 * depth + Math.sin(z * 0.0073) * 0.55 * depth;
    const x = meander + (u * 2 - 1) * halfWidth;
    if (flat) {
      // 水面是一块高度恒定的平板：透过它看河床，才谈得上「清澈」。
      return { position: [x, WATER_LEVEL, z], normal: [0, 1, 0], color: [0, 0, 0] };
    }
    const height = -0.85 + noise2(x * 0.42, z * 0.42) * 0.34 + Math.sin(x * 1.7 + z * 0.9) * 0.05;
    return {
      position: [x, height - 0.03, z],
      normal: [0, 1, 0],
      color: [1, 1, 1],
    };
  });
}

/** 山脊幕布：`x` 等距、`y` 从底到脊线，`extra = [雾强度, 高度比]`（背面自动更暗）。 */
function buildRidgeMesh(spec: RidgeSpec): MeshBuffers {
  const z = CAMERA_EYE[2] - spec.depth;
  return buildGridMesh(RIDGE_COLS, RIDGE_ROWS, (_index, u, v) => {
    const x = (u * 2 - 1) * RIDGE_HALF_WIDTH;
    const peak = spec.base + spec.offset + ridgeHeight(x, spec);
    const y = spec.base + (peak - spec.base) * v;
    // 法线由脊线斜率推：面朝相机的一侧朝上、背面朝下（背面自然更暗）。
    const dx = 3.5;
    const slope = (ridgeHeight(x + dx, spec) - ridgeHeight(x - dx, spec)) / (2 * dx);
    const normal = normalize3([-slope * spec.scale * 0.4, 1, 0.35]);
    // 山脚更暗更冷、脊线更亮更暖：不用额外光照就有了「山的体积感」。
    const dark: readonly [number, number, number] = [
      spec.color[0] * 0.62 + 0.06,
      spec.color[1] * 0.62 + 0.06,
      spec.color[2] * 0.7 + 0.1,
    ];
    const color = mixColor(dark, spec.color, v);
    const shade = 0.68 + 0.52 * v;
    return {
      position: [x, y, z],
      normal,
      color: [color[0] * shade, color[1] * shade, color[2] * shade],
      extra: [spec.haze, v],
    };
  });
}

/** 脊线高度（世界单位）：两层不同相位的正弦 + 一层噪声，得到连绵的山形。 */
function ridgeHeight(x: number, spec: RidgeSpec): number {
  const a = Math.sin(x * 0.0125 + spec.phase) * 0.5 + 0.5;
  const b = Math.sin(x * 0.031 + spec.phase * 1.7) * 0.5 + 0.5;
  const c = Math.sin(x * 0.0071 + spec.phase * 0.6) * 0.5 + 0.5;
  const n = fbm2(x * 0.004, spec.phase * 9);
  const shape = Math.pow(clampMagnitude(a * 0.4 + b * 0.25 + c * 0.2 + n * 0.5), 1.3);
  return shape * spec.scale;
}

/** 树干：六棱台（底 0.09、顶 0.05，高 0.6），12 个三角形。 */
function buildTrunkMesh(): MeshBuffers {
  const segments = 6;
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    vertices.push(x * 0.09, 0, z * 0.09, x * 0.05, 0.6, z * 0.05);
    normals.push(x, 0.15, z, x, 0.15, z);
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const a = i * 2;
    const b = i * 2 + 1;
    const c = next * 2;
    const d = next * 2 + 1;
    indices.push(a, b, d, a, d, c);
  }
  return fromAttributeLists(vertices, normals, indices, [0.72, 0.52, 0.36]);
}

/** 树冠：低面数球（6 段 × 4 环），顶点法线就是位置方向 —— 光照下自然分成明暗两半。 */
function buildCanopyMesh(): MeshBuffers {
  const segments = 6;
  const rings = 4;
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const phi = (ring / rings) * Math.PI;
    for (let segment = 0; segment <= segments; segment++) {
      const theta = (segment / segments) * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      vertices.push(x * 0.34, y * 0.34 + 0.7, z * 0.34);
      normals.push(x, y, z);
    }
  }
  const stride = segments + 1;
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = ring * stride + segment;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, d, a, d, b);
    }
  }
  return fromAttributeLists(vertices, normals, indices, [0.24, 0.46, 0.22]);
}

/** 把「已经排好的属性数组 + 颜色」包装成 {@link MeshBuffers}（树干与树冠用）。 */
function fromAttributeLists(
  vertices: number[],
  normals: number[],
  indices: number[],
  color: readonly [number, number, number],
): MeshBuffers {
  const vertexCount = vertices.length / 3;
  return {
    positions: Float32Array.from(vertices),
    normals: Float32Array.from(normals),
    colors: Float32Array.from({ length: vertexCount * 3 }, (_value, index) => color[index % 3]!),
    extras: new Float32Array(vertexCount * 2),
    indices: Uint32Array.from(indices),
    vertexCount,
    indexCount: indices.length,
    triangleCount: indices.length / 3,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 小工具（与着色器同名函数的 CPU 版本，只用于生成几何体）                                                  */
/* ------------------------------------------------------------------------------------------------ */

function fract(value: number): number {
  return value - Math.floor(value);
}

/**
 * 二维哈希 → [0,1)，与着色器里的 `hash21` **同一个公式**（CPU 用 double 算，末位会有差异；
 * 它只参与生成几何体与颜色，边界差一点点是亚像素级的影响）。
 */
function hash2(x: number, y: number): number {
  const qx = fract(x * 0.1031);
  const qy = fract(y * 0.103);
  const qz = fract(x * 0.0973);
  const dot = qx * qy + qy * qz + qz * qx + 33.33 * (qx + qy + qz);
  return fract((qx + qy) * (qz + dot));
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

function fbm2(x: number, y: number): number {
  let total = 0;
  let amplitude = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 3; i++) {
    total += noise2(px, py) * amplitude;
    px = px * 2.07 + 13.1;
    py = py * 2.07 + 7.3;
    amplitude *= 0.5;
  }
  return total;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function clampMagnitude(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function mixColor(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [left[0] + (right[0] - left[0]) * t, left[1] + (right[1] - left[1]) * t, left[2] + (right[2] - left[2]) * t];
}

function normalize3(value: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
}

/* ------------------------------------------------------------------------------------------------ */
/* 每棵树的实例数据                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

interface TreeInstances {
  readonly matrices: Float32Array;
  readonly colors: Float32Array;
  readonly infos: Float32Array;
  readonly count: number;
}

/**
 * 生成树林：位置撒在河两岸。
 *
 * 这里的采样不是「随便撒了再不合适就丢掉」，而是**先解出可行的横向区间再取随机值** ——
 * 因为要同时满足两个约束：
 *
 * 1. **不能长在河里**：离河道中心至少 1.02 倍河道半宽（再往外留一点，别贴着水边长）；
 * 2. **必须在画面里**：深度 d 处的可见半宽约 `0.615 * d`，所以 `|x|` 要小于 `0.6 * d`。
 *
 * 河道中心本身按 `meander` 左右摆（摆幅正比于深度），所以两个约束换算成「相对河道中心的
 * 横向倍数」之后是 `lateral >= 1.02` 与 `|meander ± lateral * halfWidth| <= 0.6 * d`。
 * 两者很可能**没有交集**（河摆到画面边框上的那一段），这时就换一侧再试 —— 这也正好是
 * 「树只种在可见的岸上」的那个意思。
 *
 * 每棵树的世界高度取自与着色器同一套地面高度公式（{@link groundHeightCpu}）。
 */
function buildTreeInstances(count: number): TreeInstances {
  const cameraZ = CAMERA_EYE[2];
  const matrices = new Float32Array(count * 16);
  const colors = new Float32Array(count * 3);
  const infos = new Float32Array(count * 2);
  let placed = 0;
  for (let attempt = 0; attempt < count * 40 && placed < count; attempt++) {
    const depth = 12 + Math.pow(hash(attempt, 3), 1.4) * (TERRAIN_FAR * 0.6 - 12);
    const z = cameraZ - depth;
    const halfWidth = RIVER_WIDTH_RATIO * depth;
    const meander = Math.sin(z * 0.021) * 0.34 * depth + Math.sin(z * 0.0073) * 0.55 * depth;
    const side = hash(attempt, 5) < 0.5 ? -1 : 1;
    // 解可行区间：minLateral 来自「别长在河里」，maxLateral 来自「别长出画面」。
    const minLateral = 1.02;
    const maxLateral = Math.min(3.2, (0.6 * depth - side * meander) / halfWidth);
    if (maxLateral <= minLateral) continue;
    const lateral = minLateral + Math.pow(hash(attempt, 7), 1.5) * (maxLateral - minLateral);
    const x = meander + side * lateral * halfWidth;
    if (channelWeight(x, z, cameraZ) > 0.12) continue;
    const height = groundHeightCpu(x, z, cameraZ);
    if (height < WATER_LEVEL + 0.5) continue;

    const scale = 0.7 + Math.pow(hash(attempt, 11), 1.6) * 1.5;
    const spin = hash(attempt, 13) * Math.PI * 2;
    const cosine = Math.cos(spin) * scale;
    const sine = Math.sin(spin) * scale;
    const matrix = matrices.subarray(placed * 16, placed * 16 + 16);
    // 列主序：绕 Y 轴旋转 + 缩放（矩阵元素按 glMatrix 的列主序摆放）。
    matrix[0] = cosine;
    matrix[1] = 0;
    matrix[2] = -sine;
    matrix[3] = 0;
    matrix[4] = 0;
    matrix[5] = scale;
    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = sine;
    matrix[9] = 0;
    matrix[10] = cosine;
    matrix[11] = 0;
    matrix[12] = x;
    matrix[13] = height;
    matrix[14] = z;
    matrix[15] = 1;

    const green = 0.75 + hash(attempt, 17) * 0.5;
    colors[placed * 3] = 0.12 * green;
    colors[placed * 3 + 1] = 0.34 * green;
    colors[placed * 3 + 2] = 0.16 * green;
    infos[placed * 2] = 0;
    infos[placed * 2 + 1] = scale;
    placed += 1;
  }
  return { matrices, colors, infos, count: placed };
}

/* ------------------------------------------------------------------------------------------------ */
/* 主流程                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

interface SceneParams {
  forest: boolean;
  waterClarity: number;
  waterReflect: number;
  sunElevation: number;
  sunAzimuth: number;
  animate: boolean;
  wireframe: boolean;
  fog: number;
  /** 调试用：`?only=terrain` 时只画某一层（`terrain` / `ridge` / `bed` / `water` / `sky`）。 */
  only: string;
  /** 调试用：`?ridges=0|1|2` 控制画几层山脊。 */
  ridges: number;
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-landscape');
  const { device, context } = example;

  /* ---- 参数：查询参数优先，其次 lil-gui 的默认值 ---------------------------------------------- */
  const timeParam = Number(query.get('t'));
  const fixedTime = query.has('t') && Number.isFinite(timeParam) ? timeParam : null;
  const params: SceneParams = {
    forest: query.get('forest') !== '0',
    waterClarity: clampRange(readSunOrWater(query.get('water')), 0.05, 1, 0.45),
    waterReflect: 0.62,
    sunElevation: clampRange(readSunOrWater(query.get('sun')), 0.08, 1.45, 0.52),
    sunAzimuth: 0.24,
    animate: query.get('wspin') !== '0',
    wireframe: query.get('wire') === '1',
    fog: query.get('fog') === '0' ? 0 : 0.0004,
    only: query.get('only') ?? '',
    ridges: clampRange(readSunOrWater(query.get('ridges')), 0, 2, 2),
  };

  /* ---- 几何体与缓冲 ---------------------------------------------------------------------------- */
  const terrain = buildTerrainMesh();
  const riverbed = buildRiverMesh(false);
  const water = buildRiverMesh(true);
  const ridgeMeshes = RIDGES.map((spec) => buildRidgeMesh(spec));
  const trunk = buildTrunkMesh();
  const canopy = buildCanopyMesh();
  let trees = buildTreeInstances(TREE_COUNT);

  const upload = (label: string, data: Float32Array | Uint32Array): ReturnType<typeof device.createBuffer> => {
    const buffer = device.createBuffer({
      label,
      size: data.byteLength,
      usage: BufferUsage.Vertex | BufferUsage.CopyDst,
    });
    device.queue.writeBuffer(buffer, 0, data);
    // 索引缓冲要用 Index | CopyDst，顶点用法的 buffer 不能绑成索引缓冲。
    return buffer;
  };
  const uploadIndex = (label: string, data: Uint32Array): ReturnType<typeof device.createBuffer> => {
    const buffer = device.createBuffer({
      label,
      size: data.byteLength,
      usage: BufferUsage.Index | BufferUsage.CopyDst,
    });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  };

  interface MeshGpu {
    readonly position: ReturnType<typeof device.createBuffer>;
    readonly normal: ReturnType<typeof device.createBuffer>;
    readonly color: ReturnType<typeof device.createBuffer>;
    readonly extra: ReturnType<typeof device.createBuffer>;
    readonly index: ReturnType<typeof device.createBuffer>;
    readonly mesh: MeshBuffers;
  }

  const toGpu = (label: string, mesh: MeshBuffers): MeshGpu => ({
    position: upload(`${label}:position`, mesh.positions),
    normal: upload(`${label}:normal`, mesh.normals),
    color: upload(`${label}:color`, mesh.colors),
    extra: upload(`${label}:extra`, mesh.extras),
    index: uploadIndex(`${label}:index`, mesh.indices),
    mesh,
  });

  const terrainGpu = toGpu('landscape:terrain', terrain);
  const riverbedGpu = toGpu('landscape:riverbed', riverbed);
  const waterGpu = toGpu('landscape:water', water);
  const ridgeGpu = ridgeMeshes.map((mesh, index) => toGpu(`landscape:ridge${index}`, mesh));
  // 树干 / 树冠共用同一份网格数据，但 extra 通道里要塞「这是哪个部件」（片元里区分枝叶与树干）。
  const trunkMesh = withPart(trunk, 0);
  const canopyMesh = withPart(canopy, 1);
  const trunkGpu = toGpu('landscape:trunk', trunkMesh);
  const canopyGpu = toGpu('landscape:canopy', canopyMesh);

  const instanceMatrixBuffer = device.createBuffer({
    label: 'landscape:treeMatrices',
    size: trees.matrices.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  const instanceColorBuffer = device.createBuffer({
    label: 'landscape:treeColors',
    size: trees.colors.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  const instanceInfoBuffer = device.createBuffer({
    label: 'landscape:treeInfos',
    size: trees.infos.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  const writeTreeBuffers = (): void => {
    device.queue.writeBuffer(instanceMatrixBuffer, 0, trees.matrices, 0, trees.count * 16);
    device.queue.writeBuffer(instanceColorBuffer, 0, trees.colors, 0, trees.count * 3);
    device.queue.writeBuffer(instanceInfoBuffer, 0, trees.infos, 0, trees.count * 2);
  };
  writeTreeBuffers();

  // 天空只用一个覆盖裁剪空间的大三角形（比四边形少一次对角线插值，且必然铺满）。
  const skyVertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  const skyBuffer = device.createBuffer({
    label: 'landscape:sky',
    size: skyVertices.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(skyBuffer, 0, skyVertices);

  /* ---- uniform -------------------------------------------------------------------------------- */
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  /* ---- 管线 ----------------------------------------------------------------------------------- */
  const meshLayout = (locations: readonly number[]): readonly { arrayStride: number; stepMode: 'vertex'; attributes: { shaderLocation: number; offset: number; format: 'float32x3' | 'float32x2' }[] }[] => [
    { arrayStride: MESH_STRIDE, stepMode: 'vertex', attributes: [{ shaderLocation: locations[0]!, offset: 0, format: 'float32x3' }] },
    { arrayStride: MESH_STRIDE, stepMode: 'vertex', attributes: [{ shaderLocation: locations[1]!, offset: 12, format: 'float32x3' }] },
    ...(locations.length > 2
      ? [
          { arrayStride: MESH_STRIDE, stepMode: 'vertex' as const, attributes: [{ shaderLocation: locations[2]!, offset: 24, format: 'float32x3' as const }] },
          { arrayStride: MESH_STRIDE, stepMode: 'vertex' as const, attributes: [{ shaderLocation: locations[3]!, offset: 36, format: 'float32x2' as const }] },
        ]
      : []),
  ];

  const layout = device.createPipelineLayout({
    label: 'landscape:pipelineLayout',
    bindGroupLayouts: [uniforms.layout],
  });

  const makeModule = (label: string, vs: string, fs: string, wgsl: string): ReturnType<typeof device.createShaderModule> =>
    device.createShaderModule({ label, code: { vs, fs, wgsl } });

  const skyModule = makeModule('landscape:skyShader', SKY_VERTEX_GLSL, SKY_FRAGMENT_GLSL, SKY_WGSL);
  const ridgeModule = makeModule('landscape:ridgeShader', RIDGE_VERTEX_GLSL, RIDGE_FRAGMENT_GLSL, RIDGE_WGSL);
  const terrainModule = makeModule('landscape:terrainShader', TERRAIN_VERTEX_GLSL, TERRAIN_FRAGMENT_GLSL, TERRAIN_WGSL);
  const riverbedModule = makeModule('landscape:riverbedShader', RIVERBED_VERTEX_GLSL, RIVERBED_FRAGMENT_GLSL, RIVERBED_WGSL);
  const treeModule = makeModule('landscape:treeShader', TREE_VERTEX_GLSL, TREE_FRAGMENT_GLSL, TREE_WGSL);
  const waterModule = makeModule('landscape:waterShader', WATER_VERTEX_GLSL, WATER_FRAGMENT_GLSL, WATER_WGSL);

  const skyPipeline = device.createRenderPipeline({
    label: 'landscape:skyPipeline',
    layout,
    vertex: {
      module: skyModule,
      entryPoint: 'vsMain',
      buffers: [{ arrayStride: 12, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
    },
    fragment: { module: skyModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    // 天空不需要深度状态：它最先画、铺满视口，后面的东西一律盖在它上面。
    depthStencil: { format: null },
  });

  const ridgePipeline = device.createRenderPipeline({
    label: 'landscape:ridgePipeline',
    layout,
    vertex: { module: ridgeModule, entryPoint: 'vsMain', buffers: meshLayout([0, 1, 2, 3]) },
    fragment: { module: ridgeModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const terrainPipeline = device.createRenderPipeline({
    label: 'landscape:terrainPipeline',
    layout,
    vertex: { module: terrainModule, entryPoint: 'vsMain', buffers: meshLayout([0, 1, 2, 3]) },
    fragment: { module: terrainModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const riverbedPipeline = device.createRenderPipeline({
    label: 'landscape:riverbedPipeline',
    layout,
    vertex: { module: riverbedModule, entryPoint: 'vsMain', buffers: meshLayout([0, 1, 2, 3]) },
    fragment: { module: riverbedModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const treePipeline = device.createRenderPipeline({
    label: 'landscape:treePipeline',
    layout,
    vertex: {
      module: treeModule,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: MESH_STRIDE,
          stepMode: 'vertex',
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 36, format: 'float32x2' },
          ],
        },
        // 每实例属性：模型矩阵占 4 个 location（matrix 在 GLSL 里按 4 列展开），再加颜色与信息。
        { arrayStride: 64, stepMode: 'instance', attributes: [
          { shaderLocation: 3, offset: 0, format: 'float32x4' },
          { shaderLocation: 4, offset: 16, format: 'float32x4' },
          { shaderLocation: 5, offset: 32, format: 'float32x4' },
          { shaderLocation: 6, offset: 48, format: 'float32x4' },
        ] },
        { arrayStride: 12, stepMode: 'instance', attributes: [{ shaderLocation: 7, offset: 0, format: 'float32x3' }] },
        { arrayStride: 8, stepMode: 'instance', attributes: [{ shaderLocation: 8, offset: 0, format: 'float32x2' }] },
      ],
    },
    fragment: { module: treeModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  /**
   * 水面管线：这是这一页唯一一条**带混合、且关掉深度写入**的管线。
   *
   * - `depthCompare: 'less'`：水面仍然要被河岸/树林挡住（深度测试开着）；
   * - `depthWriteEnabled: false`：水面自己不写深度 —— 河床是在它之前画的，
   *   如果水写了深度，后面的任何透明物体就没法再画了；更关键的是水面是一层薄壳，
   *   写深度会让它自遮挡出条纹。
   * - `blend`：直通 alpha，混合出「看得见河床」的效果。
   */
  const waterPipeline = device.createRenderPipeline({
    label: 'landscape:waterPipeline',
    layout,
    vertex: { module: waterModule, entryPoint: 'vsMain', buffers: meshLayout([0, 1, 2, 3]) },
    fragment: { module: waterModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: false, depthCompare: 'less' },
    render: {
      blend: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      },
    },
  });

  /* ---- 矩阵与 uniform 写入 --------------------------------------------------------------------- */
  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();
  const inverseViewProjection = mat4.create();
  const eye = vec3.fromValues(...CAMERA_EYE);
  const target = vec3.fromValues(...CAMERA_TARGET);
  const up = vec3.fromValues(0, 1, 0);

  const sunDirection = vec3.create();
  /** 上一帧算出的太阳屏幕坐标（`verify=1` 时写进 `data-landscape-sun-screen`）。 */
  let sunScreen: readonly [number, number] = [0, 0];

  const writeUniforms = (elapsed: number): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    // 两个后端的投影差别（NDC 的 z 范围）在这里选：WebGPU 用 0..1，WebGL2 用 -1..1。
    mat4.perspective(projectionGL, FOV, aspect, NEAR_PLANE, FAR_PLANE);
    mat4.perspectiveZO(projectionZO, FOV, aspect, NEAR_PLANE, FAR_PLANE);
    mat4.lookAt(view, eye, target, up);
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);
    // 天空着色器要把裁剪空间坐标反投影成视线方向，所以得把逆矩阵也传进去。
    mat4.invert(inverseViewProjection, viewProjection);

    const elevation = params.sunElevation;
    const azimuth = params.sunAzimuth;
    const cosElevation = Math.cos(elevation);
    const direction: [number, number, number] = [
      Math.cos(azimuth) * cosElevation,
      Math.sin(elevation),
      Math.sin(azimuth) * cosElevation,
    ];
    const length = Math.hypot(direction[0], direction[1], direction[2]) || 1;
    sunDirection[0] = direction[0] / length;
    sunDirection[1] = direction[1] / length;
    sunDirection[2] = direction[2] / length;

    uniformData.set(viewProjection, 0);
    uniformData.set(inverseViewProjection, 16);
    uniformData[32] = CAMERA_EYE[0];
    uniformData[33] = CAMERA_EYE[1];
    uniformData[34] = CAMERA_EYE[2];
    uniformData[35] = 0;
    uniformData[36] = sunDirection[0]!;
    uniformData[37] = sunDirection[1]!;
    uniformData[38] = sunDirection[2]!;
    uniformData[39] = 1;
    uniformData[40] = elapsed;
    uniformData[41] = params.fog;
    uniformData[42] = 1; // 山脊用的雾强度，1 表示用 params.fog
    uniformData[43] = params.wireframe ? 1 : 0;
    uniformData[44] = params.waterClarity;
    uniformData[45] = params.waterReflect;
    uniformData[46] = 0;
    uniformData[47] = 0;
    uniforms.write(uniformData);

    // 太阳的屏幕坐标：把「相机前方 100 单位、位于太阳方向上」的点投到 NDC 再换算成像素。
    // 自检的太阳区探针就用它的 0.5 倍位置当中心，不靠「猜画面哪里最亮」。
    const probe = vec3.create();
    vec3.scale(probe, sunDirection, 100);
    vec3.add(probe, eye, probe);
    const clip = [0, 0, 0, 0];
    const matrix = example.backend === 'webgpu' ? projectionZO : projectionGL;
    projectPoint(clip, probe, view, matrix);
    sunScreen = [
      (clip[0]! / clip[3]! * 0.5 + 0.5) * context.width,
      (0.5 - clip[1]! / clip[3]! * 0.5) * context.height,
    ];
  };

  /* ---- 绘制 ----------------------------------------------------------------------------------- */
  let drawCalls = 0;
  let triangles = 0;

  const bindMesh = (pass: RenderPassEncoder, mesh: MeshGpu): void => {
    pass.setVertexBuffer(0, mesh.position, 0, mesh.position.size);
    pass.setVertexBuffer(1, mesh.normal, 0, mesh.normal.size);
    pass.setVertexBuffer(2, mesh.color, 0, mesh.color.size);
    pass.setVertexBuffer(3, mesh.extra, 0, mesh.extra.size);
    pass.setIndexBuffer(mesh.index, 'uint32', 0, mesh.index.size);
  };

  const drawMesh = (pass: RenderPassEncoder, mesh: MeshGpu): void => {
    bindMesh(pass, mesh);
    pass.drawIndexed({ indexCount: mesh.mesh.indexCount });
    drawCalls += 1;
    triangles += mesh.mesh.triangleCount;
  };

  const drawScene = (pass: RenderPassEncoder): void => {
    drawCalls = 0;
    triangles = 0;
    // `?only=<层>` 只画其中一层（调试用：排查「画面里到底是哪一层铺满了」）。
    const only = params.only;
    const want = (name: string): boolean => only === '' || only === name;
    // 1) 天空：铺满视口，不打深度。
    if (want('sky')) {
      pass.setPipeline(skyPipeline);
      pass.setBindGroup(0, uniforms.bindGroup);
      pass.setVertexBuffer(0, skyBuffer, 0, skyBuffer.size);
      pass.draw({ vertexCount: 3 });
      drawCalls += 1;
      triangles += 1;
    }

    pass.setBindGroup(0, uniforms.bindGroup);
    // 2) 两层山脊（远 → 近，虽然深度测试本身就够，但这样读起来更清楚）。
    if (want('ridge')) {
      pass.setPipeline(ridgePipeline);
      for (const ridge of ridgeGpu.slice(0, params.ridges)) drawMesh(pass, ridge);
    }
    // 3) 地形（河岸 + 山坡；河道处 discard）。
    if (want('terrain')) {
      pass.setPipeline(terrainPipeline);
      drawMesh(pass, terrainGpu);
    }
    // 4) 河床：必须先于水面画，否则水面混合时底下什么都没有。
    if (want('bed')) {
      pass.setPipeline(riverbedPipeline);
      drawMesh(pass, riverbedGpu);
    }
    // 5) 树林：树干一次 draw call、树冠一次 draw call。
    if (params.forest && trees.count > 0 && want('tree')) {
      pass.setPipeline(treePipeline);
      for (const part of [trunkGpu, canopyGpu]) {
        bindMesh(pass, part);
        // 实例缓冲的 size 必须覆盖「实例数 × 步长」，否则 WebGPU 会校验失败。
        pass.setVertexBuffer(4, instanceMatrixBuffer, 0, trees.count * 64);
        pass.setVertexBuffer(5, instanceColorBuffer, 0, trees.count * 12);
        pass.setVertexBuffer(6, instanceInfoBuffer, 0, trees.count * 8);
        pass.drawIndexed({ indexCount: part.mesh.indexCount, instanceCount: trees.count });
        drawCalls += 1;
        triangles += part.mesh.triangleCount * trees.count;
      }
    }
    // 6) 水面：最后画，混合 + 不写深度。
    if (want('water')) {
      pass.setPipeline(waterPipeline);
      drawMesh(pass, waterGpu);
    }
  };

  let elapsed = 0;
  let frameTime = fixedTime ?? 0;

  const drawToCanvas = (delta: number): void => {
    context.resize();
    if (params.animate && fixedTime === null) frameTime += delta;
    elapsed = frameTime;
    writeUniforms(elapsed);
    // 走 `createPassDescriptor()`：两个后端的画布通道都带上深度附件（漏掉它深度测试会被静默关掉）。
    const descriptor = context.createPassDescriptor({
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: CLEAR,
      depthLoadOp: 'clear',
      depthClearValue: 1,
    });
    const encoder = device.createCommandEncoder({ label: 'landscape:frame' });
    const pass = encoder.beginRenderPass({
      label: 'landscape:pass',
      colorAttachments: descriptor.colorAttachments,
      depthStencilAttachment: descriptor.depthStencilAttachment,
    });
    drawScene(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
    setData('landscapeDrawCalls', String(drawCalls));
    setData('landscapeTriangles', String(triangles));
  };

  drawToCanvas(0);
  setData('landscapeResult', 'ok');
  setData('landscapeDiag', `trees=${trees.count} bedAtCenter=${groundHeightCpu(0, 6 - 50, 6).toFixed(2)} bankAt50=${groundHeightCpu(50, 6 - 50, 6).toFixed(2)}`);
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　` +
    `6 条管线 / 9 次 draw call　天空 1 + 山脊 2 + 地形 1 + 河床 1 + 树林 2 + 水面 1`;

  startFrameLoop({
    draw: (delta) => drawToCanvas(delta),
    onFps: (fps) => {
      statsEl.textContent =
        `${context.width}×${context.height}　${fps.toFixed(0)} FPS　三角形 ${triangles}　` +
        `draw calls ${drawCalls}　树 ${params.forest ? trees.count : 0}`;
    },
  });

  /* ---- lil-gui：调试面板（自检不依赖它，`?gui=0` 时完全不建） ------------------------------------ */
  if (query.get('gui') !== '0') {
    const gui = new GUI({ title: '风景参数' });
    gui.add(params, 'forest').name('树林').onChange(() => {
      if (params.forest) {
        trees = buildTreeInstances(TREE_COUNT);
        writeTreeBuffers();
      }
    });
    gui.add(params, 'waterClarity', 0.05, 1, 0.01).name('水面透明度');
    gui.add(params, 'waterReflect', 0, 1, 0.01).name('水面反射');
    gui.add(params, 'sunElevation', 0.08, 1.45, 0.01).name('太阳高度角');
    gui.add(params, 'sunAzimuth', -1.2, 1.2, 0.01).name('太阳方位角');
    gui.add(params, 'fog', 0, 0.01, 0.0005).name('雾');
    gui.add(params, 'animate').name('水面流动');
    gui.add(params, 'wireframe').name('线框');
  }

  /* ---- 离屏自检 + 分区探针 --------------------------------------------------------------------- */
  if (query.get('verify') === '1') {
    const pixels = await readOffscreen(device, VERIFY_WIDTH, VERIFY_HEIGHT, CLEAR, (pass) => {
      writeUniforms(fixedTime ?? 0);
      drawScene(pass);
    });
    const sky = regionStats(pixels, VERIFY_WIDTH, VERIFY_HEIGHT, 0.02, 0.22, 0.02, 0.98);
    const sun = brightestRegion(pixels, VERIFY_WIDTH, VERIFY_HEIGHT, 0, 0.45);
    const ridge = darkestRegion(pixels, VERIFY_WIDTH, VERIFY_HEIGHT, 0.25, 0.45, 0.55, 0.85);
    const river = regionStats(pixels, VERIFY_WIDTH, VERIFY_HEIGHT, 0.44, 0.58, 0.44, 0.56);

    setData('landscapeProbeSky', meanText(sky));
    setData('landscapeProbeSun', meanText(sun));
    setData('landscapeProbeSunAt', `${sun.x},${sun.y}`);
    setData('landscapeProbeRidge', meanText(ridge));
    setData('landscapeProbeRiver', meanText(river));
    setData('landscapeRiverDistinct', String(river.distinct));
    setData('landscapeRiverSpread', river.spread.toFixed(1));
    setData('landscapeSunScreen', `${sunScreen[0].toFixed(1)},${sunScreen[1].toFixed(1)}`);

    // 逐个判据（都是「天空铺满 + 五个元素都能认出来」的量化形式）：
    // 天空偏蓝（蓝 > 红）、且明显不是清屏色；
    const skyIsBlue = sky.mean[2] - sky.mean[0] > 12;
    const skyNotClear = Math.abs(sky.mean[0] - 184) + Math.abs(sky.mean[1] - 26) + Math.abs(sky.mean[2] - 158) > 60;
    // 太阳很亮；
    const sunIsBright = sun.mean[0] + sun.mean[1] + sun.mean[2] > 600;
    // 山脊比天空暗很多；
    const ridgeIsDarker = luminance(ridge.mean) < luminance(sky.mean) * 0.55;
    // 河面偏青蓝、而且有多种色调（说明河床透上来了，不是一块纯色）；
    const riverIsBlue = river.mean[2] - river.mean[0] > 10;
    const riverShowsBed = river.distinct >= 24 && river.spread >= 4;
    const checks: readonly (readonly [string, boolean])[] = [
      ['sky-blue', skyIsBlue],
      ['sky-not-clear', skyNotClear],
      ['sun-bright', sunIsBright],
      ['ridge-darker', ridgeIsDarker],
      ['river-blue', riverIsBlue],
      ['river-bed', riverShowsBed],
    ];
    const passed = checks.filter((entry) => entry[1]).map((entry) => entry[0]);
    const failed = checks.filter((entry) => !entry[1]).map((entry) => entry[0]);
    setData('landscapeChecks', passed.join('+') || 'none');
    setData('landscapeResult', failed.length === 0 ? 'ok' : 'fail');
    if (failed.length > 0) setData('landscapeFailed', failed.join('+'));

    // 顺带复用 core-shared 的通用统计（「画面上有东西、而且不止一种颜色」）。
    const stats = await verifyOffscreen(device, 128, 72, CLEAR, (pass) => {
      writeUniforms(fixedTime ?? 0);
      drawScene(pass);
    });
    reportVerify('landscape', stats, true);
  }
}

/**
 * 读 `?sun=` / `?water=`：支持弧度或角度（`?sun=30deg`），读不到就返回 null 走默认值。
 */
function readSunOrWater(text: string | null): number | null {
  if (text === null) return null;
  const trimmed = text.trim().toLowerCase();
  const degrees = trimmed.endsWith('deg');
  const value = Number(degrees ? trimmed.slice(0, -3) : trimmed);
  if (!Number.isFinite(value)) return null;
  return degrees ? (value * Math.PI) / 180 : value;
}

/** 夹到 `[min, max]`，`null` 时用 `fallback`。 */
function clampRange(value: number | null, min: number, max: number, fallback: number): number {
  if (value === null) return fallback;
  return Math.min(Math.max(value, min), max);
}

/** 把 `extra.x` 全部改成 `part`，片元据此区分树干（0）与树冠（1）。 */
function withPart(mesh: MeshBuffers, part: number): MeshBuffers {
  const extras = Float32Array.from(mesh.extras);
  for (let index = 0; index < extras.length; index += 2) extras[index] = part;
  return { ...mesh, extras };
}

/**
 * `clip = projection × view × point`（只投影一个点，不值得为此建矩阵）。
 *
 * 下标要小心：两个矩阵都是**列主序**，`m[column * 4 + row]`，所以
 * `result[i] = Σ_j m[j * 4 + i] * v[j]`。这里先把点乘进 view 得到视空间坐标，
 * 再乘 projection —— 「行」的下标是 `row`，不是 `row * 4`（写错的话投影结果会
 * 完全离谱，太阳的屏幕坐标能算出 -1815 这种值）。
 */
function projectPoint(
  out: number[],
  point: ArrayLike<number>,
  view: ArrayLike<number>,
  projection: ArrayLike<number>,
): void {
  const x = point[0]!;
  const y = point[1]!;
  const z = point[2]!;
  const viewX = view[0]! * x + view[4]! * y + view[8]! * z + view[12]!;
  const viewY = view[1]! * x + view[5]! * y + view[9]! * z + view[13]!;
  const viewZ = view[2]! * x + view[6]! * y + view[10]! * z + view[14]!;
  const viewW = view[3]! * x + view[7]! * y + view[11]! * z + view[15]!;
  for (let row = 0; row < 4; row++) {
    out[row] =
      projection[row]! * viewX +
      projection[4 + row]! * viewY +
      projection[8 + row]! * viewZ +
      projection[12 + row]! * viewW;
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* 离屏像素读回与分区统计                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 把一次绘制画进离屏目标并读回 **RGBA 像素**（不是 core-shared 的摘要统计）。
 *
 * 分区探针需要「同一帧里好几块区域各自的均值 / 最亮像素 / 颜色种类」，所以这里把整幅像素
 * 拿回来自己统计。三个踩过的坑与 `core-shared.verifyOffscreen` 相同：`usage` 要带 `CopySrc`、
 * 深度用 `depth32float`、读回 buffer 用 `MapRead | CopyDst`，另外 WebGPU 要求
 * `bytesPerRow` 是 256 的倍数（读回后再逐行去掉填充）。
 */
async function readOffscreen(
  device: Device,
  width: number,
  height: number,
  clear: readonly [number, number, number, number],
  draw: (pass: RenderPassEncoder) => void,
): Promise<Uint8Array> {
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const rowBytes = width * 4;
  const byteLength = bytesPerRow * height;
  // 这里用 createTexture + createRenderTarget 的等价写法（core-shared 用的是 RenderTarget）。
  const target = device.createRenderTarget({
    label: 'landscape-verify',
    width,
    height,
    color: 'rgba8unorm',
    depth: 'depth32float',
    usage: TextureUsage.CopySrc,
  });
  const readback = device.createBuffer({
    label: 'landscape-verify-readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const descriptor = target.createPassDescriptor({
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: clear,
    depthLoadOp: 'clear',
    depthClearValue: 1,
  });
  const encoder = device.createCommandEncoder({ label: 'landscape-verify' });
  const pass = encoder.beginRenderPass({
    label: 'landscape-verify-pass',
    colorAttachments: descriptor.colorAttachments,
    depthStencilAttachment: descriptor.depthStencilAttachment,
  });
  draw(pass);
  pass.end();
  const copyEncoder = device.createCommandEncoder({ label: 'landscape-copy' });
  copyEncoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish(), copyEncoder.finish()]);

  await readback.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
  readback.unmap();
  readback.destroy();
  target.destroy();

  const pixels = new Uint8Array(rowBytes * height);
  for (let row = 0; row < height; row++) {
    pixels.set(raw.subarray(row * bytesPerRow, row * bytesPerRow + rowBytes), row * rowBytes);
  }
  return pixels;
}

interface Region {
  readonly mean: readonly [number, number, number];
  readonly distinct: number;
  /** 亮度标准差：越大说明这块区域的颜色越「花」，纯色区域接近 0。 */
  readonly spread: number;
  readonly x: number;
  readonly y: number;
}

/** 统计一块相对区域（`ux/uy` 都是 0..1 的比例）。 */
function regionStats(
  pixels: Uint8Array,
  width: number,
  height: number,
  ux0: number,
  ux1: number,
  uy0: number,
  uy1: number,
): Region {
  const x0 = Math.floor(ux0 * width);
  const x1 = Math.max(x0 + 1, Math.floor(ux1 * width));
  const y0 = Math.floor(uy0 * height);
  const y1 = Math.max(y0 + 1, Math.floor(uy1 * height));
  const colors = new Set<number>();
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumL = 0;
  let sumL2 = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      const r = pixels[index]!;
      const g = pixels[index + 1]!;
      const b = pixels[index + 2]!;
      sumR += r;
      sumG += g;
      sumB += b;
      const l = luminance([r, g, b]);
      sumL += l;
      sumL2 += l * l;
      colors.add((r << 16) | (g << 8) | b);
      count += 1;
    }
  }
  const meanL = count === 0 ? 0 : sumL / count;
  const variance = count === 0 ? 0 : Math.max(sumL2 / count - meanL * meanL, 0);
  return {
    mean: [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)],
    distinct: colors.size,
    spread: Math.sqrt(variance),
    x: Math.floor((x0 + x1) / 2),
    y: Math.floor((y0 + y1) / 2),
  };
}

/**
 * 在给定范围内找**最亮的 5×5 小块的均值**（太阳探针）。
 * 用小块均值而不是单像素，是为了不被一颗孤立的高光噪点骗到。
 */
function brightestRegion(
  pixels: Uint8Array,
  width: number,
  height: number,
  uy0: number,
  uy1: number,
): Region {
  const y0 = Math.floor(uy0 * height);
  const y1 = Math.max(y0 + 1, Math.floor(uy1 * height));
  let bestX = 2;
  let bestY = Math.max(2, y0);
  let best = -1;
  for (let y = Math.max(2, y0); y < Math.min(height - 2, y1); y++) {
    for (let x = 2; x < width - 2; x++) {
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const index = ((y + dy) * width + (x + dx)) * 4;
          sum += luminance([pixels[index]!, pixels[index + 1]!, pixels[index + 2]!]);
        }
      }
      if (sum > best) {
        best = sum;
        bestX = x;
        bestY = y;
      }
    }
  }
  return regionAt(pixels, width, height, bestX, bestY);
}

/** 在给定范围内找最暗的 5×5 小块（山脊探针）。 */
function darkestRegion(
  pixels: Uint8Array,
  width: number,
  height: number,
  ux0: number,
  ux1: number,
  uy0: number,
  uy1: number,
): Region {
  const x0 = Math.max(2, Math.floor(ux0 * width));
  const x1 = Math.min(width - 2, Math.floor(ux1 * width));
  const y0 = Math.max(2, Math.floor(uy0 * height));
  const y1 = Math.min(height - 2, Math.floor(uy1 * height));
  let bestX = x0;
  let bestY = y0;
  let best = Number.POSITIVE_INFINITY;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const index = ((y + dy) * width + (x + dx)) * 4;
          sum += luminance([pixels[index]!, pixels[index + 1]!, pixels[index + 2]!]);
        }
      }
      if (sum < best) {
        best = sum;
        bestX = x;
        bestY = y;
      }
    }
  }
  return regionAt(pixels, width, height, bestX, bestY);
}

/** 一块 5×5 小块的统计（中心坐标一起带出来，便于写进 `data-*` 定位）。 */
function regionAt(pixels: Uint8Array, width: number, height: number, centerX: number, centerY: number): Region {
  const colors = new Set<number>();
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumL = 0;
  let count = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = Math.min(Math.max(centerX + dx, 0), width - 1);
      const y = Math.min(Math.max(centerY + dy, 0), height - 1);
      const index = (y * width + x) * 4;
      const r = pixels[index]!;
      const g = pixels[index + 1]!;
      const b = pixels[index + 2]!;
      sumR += r;
      sumG += g;
      sumB += b;
      sumL += luminance([r, g, b]);
      colors.add((r << 16) | (g << 8) | b);
      count += 1;
    }
  }
  return {
    mean: [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)],
    distinct: colors.size,
    spread: 0,
    x: centerX,
    y: centerY,
  };
}

function meanText(region: Region): string {
  return region.mean.join(',');
}

function luminance(color: readonly [number, number, number]): number {
  return (color[0] + color[1] + color[2]) / 3;
}

main().catch((error: unknown) => {
  setData('landscapeError', (error as Error).message);
  setData('landscapeResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
