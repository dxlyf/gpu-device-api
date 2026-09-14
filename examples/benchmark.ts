/**
 * 性能基准：**只用 core 层**（`src/index.ts` 的公开入口），不经过 `src/gfx` 便捷层。
 *
 * 手写的东西包括：着色器（GLSL + WGSL 各一份）、顶点/索引/实例缓冲、uniform 块的字节打包、
 * bind group layout / bind group / pipeline layout、渲染管线、command encoder 与通道，
 * 以及整帧的提交与 GPU 同步。可以把它当成「不带便捷层时，这个库长什么样」的参考。
 *
 * ## 为什么旧版的 40000 档不算数（以及这一版改了什么）
 *
 * 旧版画的是「最简单的三角形」而且**整个测量过程里场景一动不动**：顶点只有 6 个、没有法线，
 * 矩阵只有一份、每帧都不变。于是 40000 个物体的数字只反映「一次 draw call 提交 + 一堆不动的
 * 顶点」，既不体现属性带宽与像素填充，也完全看不到动态场景每帧真正要付的那笔账。现在：
 *
 * 1. **真实几何体**：盒子（24 顶点 / 36 索引 / 12 三角形，position + normal + uv 三个属性），
 *    每个物体一次 `mat4` 变换；片元着色器做「方向光 + 半球环境光 + 一点基于 uv 的明暗」，
 *    所以顶点数、属性带宽、矩阵运算、填充率四项都有真实负载。
 * 2. **每帧真的在动**：每个物体有自己的角速度 / 相位 / 环绕半径 / 上下浮动幅度（确定性哈希，
 *    刷新后画面一致），每帧按 `time = 帧序号 / 60` 重算 `model = T * R * S`，
 *    **并把整段每物体矩阵重新上传**。这就是动态场景的真实代价。
 * 3. **静态对照**：`?motion=off` 时矩阵只在测量前写一次；默认 `?motion=on` 时页内还会自动跑
 *    一遍静态对照，于是同一档能直接给出「让物体动起来」多花的 ΔCPU / Δ帧耗时。
 * 4. **CPU 与 GPU 分开报**：每档测两轮 —— 一轮逐帧同步，一轮完全不同步。同步用
 *    1×1 `readPixels`（WebGL2，`gl.finish()` 在 WebGL 里并不保证 GPU 做完）或
 *    `queue.onSubmittedWorkDone()`（WebGPU）。**同步那一轮把 CPU/GPU 串行化，
 *    所以「含同步帧耗时」是偏悲观的上界**；不同步那一轮的 CPU 时间才是纯
 *    「重算矩阵 + 上传 + 录制 + 提交」（驱动队列满时会被反压，这一点如实标注）。
 *
 * ## 两种模式
 *
 * - `instanced`（默认）：1 次 draw call 画 N 个物体，每物体的 `model` 矩阵作为**实例化顶点属性**
 *   （4 个 `vec4`，location 3..6）每帧上传；
 * - `draws`：每个物体 1 次 draw call，每物体的 `model` + 颜色放进 **uniform 环形段**，
 *   用**动态偏移**（`setBindGroup(1, bindGroup, [offset])`）绑定。这与 `src/gfx` 的
 *   uniform arena 是同一条路，也避开了 WebGPU「同一帧内对同一段内存写两次只有最后一次生效」
 *   的坑（见 `core/sync/Queue.ts` 的时序契约）。
 *
 * ## 查询参数
 *
 * `?backend=webgl2|webgpu|auto&mode=instanced|draws&motion=on|off&frames=30&counts=2000,5000`
 *
 * ## 结论写在哪儿
 *
 * 全部结论写进 `<html data-benchmark-*>`（旧键名保留，新列新增键），页面里另有 `#out` 的人读版本，
 * 以及一次离屏 readback 自检：证明「真的画出了东西」以及「动态模式下前后两帧确实不一样」。
 * `benchmarkDone` **只在跑完后**写（成功 `1`，失败 `fail`）——旧版一启动就写 `0`，
 * 而无头脚本按「值非空即完成」判断，会在页面刚启动时就误判成已完成。
 */

import {
  BindingType,
  BufferUsage,
  ShaderStage,
  TextureUsage,
  createDeviceWithAdapter,
  describeAdapter,
  mat4,
  vec3,
} from '../src/index.js';
import type { BindGroup } from '../src/core/binding/BindGroup.js';
import type { CanvasContext } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPipeline } from '../src/core/pipeline/RenderPipeline.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';
import type { Buffer } from '../src/core/resources/Buffer.js';

/* ------------------------------------------------------------------------------------------------ */
/* 配置                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const DEFAULT_COUNTS: readonly number[] = [2000, 5000, 10000, 20000, 40000];
const MAX_COUNT = 40000;
const DEFAULT_FRAMES = 30;
const MIN_FRAMES = 3;
const MAX_FRAMES = 300;
/** 每档最多测这么多帧（大档还会再降，见 {@link framesForCount}）。 */
const MAX_MEASURED_FRAMES = 30;

/** 盒子的规模：24 顶点 / 36 索引 / 12 三角形，属性是 position + normal + uv。 */
const BOX_VERTEX_COUNT = 24;
const BOX_INDEX_COUNT = 36;
const BOX_TRIANGLES = 12;

/** 属性字节步长。 */
const POSITION_STRIDE = 12; // float32x3
const NORMAL_STRIDE = 12; // float32x3
const UV_STRIDE = 8; // float32x2
const MATRIX_STRIDE = 64; // 4 × float32x4（实例化的 model 矩阵）
const COLOR_STRIDE = 16; // float32x4

/**
 * 相机 uniform 块：`mat4 projectionView(64) + vec3 lightDirection(12 → std140 补到 16)` = 80 字节。
 */
const CAMERA_UNIFORM_BYTES = 80;
/** 每物体 uniform 块：`mat4 model(64) + vec4 color(16)` = 80 字节。 */
const OBJECT_UNIFORM_BYTES = 80;

/** 虚拟时钟每帧前进多少秒（与 60 FPS 对齐，与真实帧率无关，保证可复现）。 */
const FRAME_STEP_SECONDS = 1 / 60;
/** 探测帧（含同步）超过它就跳过该档，别把页面钉死（毫秒）。 */
const SLOW_FRAME_LIMIT_MS = 2000;
const CLEAR_VALUE: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];
/** 光照方向：与旧版一致的斜上方光源（着色器里取 `-lightDirection` 作为入射方向）。 */
const LIGHT_DIRECTION: readonly [number, number, number] = [-0.42, -0.86, -0.52];
/** 世界空间的立方体边长；各档物体数共用同一块空间，方便横向对比（与 gfx 基准相同）。 */
const SPREAD = 10;
/** 离屏自检的目标边长。 */
const VERIFY_SIZE = 256;

const query = new URLSearchParams(location.search);
const backendParam = query.get('backend');
const backend: 'auto' | 'webgl2' | 'webgpu' =
  backendParam === 'webgl2' || backendParam === 'webgpu' ? backendParam : 'auto';
let mode: 'instanced' | 'draws' = query.get('mode') === 'draws' ? 'draws' : 'instanced';

/**
 * `?motion=off` 只测静态（矩阵一次性上传），其余情况（含缺省与 `on`）都测动态。
 *
 * 注意默认是 **on**：旧版默认静态，等于把动态场景每帧的矩阵重算与上传成本藏起来了。
 */
let motion: boolean = query.get('motion') !== 'off';

/**
 * `?frames=` 的帧数。
 *
 * **这里是一个真实的 bug fix**：旧代码写的是
 * `clampInt(Number(query.get('frames')), 30, 3, 300)`，而参数缺席时 `Number(null)` 是 `0`
 * （有限数），于是 clamp 到下限 `3` —— 文档说默认 30，实际只测 3 帧。
 * 现在先判「参数在不在」，再 clamp（`gfx-benchmark.ts` 一直是这么写的）。
 */
let framesToMeasure = DEFAULT_FRAMES;
const framesParam = query.get('frames');
if (framesParam !== null) {
  framesToMeasure = clampInt(Number(framesParam), DEFAULT_FRAMES, MIN_FRAMES, MAX_FRAMES);
}

const countsParam = query.get('counts');
const counts: readonly number[] =
  countsParam && countsParam.length > 0
    ? countsParam
        .split(',')
        .map((part) => clampInt(Number(part.trim()), 0, 0, MAX_COUNT))
        .filter((value) => value > 0)
    : DEFAULT_COUNTS;

const canvas = document.getElementById('view') as HTMLCanvasElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;
const rowsEl = document.getElementById('rows') as HTMLTableSectionElement;
const progressEl = document.getElementById('progress') as HTMLElement;
const outEl = document.getElementById('out') as HTMLElement;
const modeSelect = document.getElementById('mode') as HTMLSelectElement;
const motionSelect = document.getElementById('motion') as HTMLSelectElement;
const framesInput = document.getElementById('frames') as HTMLInputElement;
const rerunButton = document.getElementById('rerun') as HTMLButtonElement;

function clampInt(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.trunc(value), max));
}

/** 把结论写进 `<html data-...>`：沿用 `data-benchmark-*` 的命名风格。 */
function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

/** 重跑前清掉上一轮的结论，免得无头抓取拿到旧值。 */
function clearData(name: string): void {
  delete document.documentElement.dataset[name];
}

/* ------------------------------------------------------------------------------------------------ */
/* 着色器：GLSL 与 WGSL 各写一份（core 层不做自动转译）                                                  */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 被光照的顶点着色器（实例化版）：每物体的 model 矩阵来自 4 个 `vec4` 实例属性。
 *
 * 法线只用 `mat3(model)` 变换 —— 这里 model 只含**旋转 + 统一缩放**，没有非均匀缩放，
 * 所以不需要逆转置矩阵；真需要的话 `src/gfx` 的 lambert 材质会替使用者算。
 */
const GLSL_VERTEX_INSTANCED = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 uv;
layout(location = 3) in vec4 instanceModel0;
layout(location = 4) in vec4 instanceModel1;
layout(location = 5) in vec4 instanceModel2;
layout(location = 6) in vec4 instanceModel3;
layout(location = 7) in vec4 instanceColor;

layout(std140) uniform Camera {
  mat4 projectionView;
  vec3 lightDirection;
} camera;

out vec3 vNormal;
out vec2 vUv;
out vec4 vColor;

void main() {
  mat4 model = mat4(instanceModel0, instanceModel1, instanceModel2, instanceModel3);
  vNormal = mat3(model) * normal;
  vUv = uv;
  vColor = instanceColor;
  gl_Position = camera.projectionView * model * vec4(position, 1.0);
}
`;

/** 被光照的顶点着色器（逐 draw 版）：每物体的 model 与颜色来自带动态偏移的 uniform 段。 */
const GLSL_VERTEX_PER_DRAW = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 uv;

layout(std140) uniform Camera {
  mat4 projectionView;
  vec3 lightDirection;
} camera;

layout(std140) uniform Object {
  mat4 model;
  vec4 color;
} object;

out vec3 vNormal;
out vec2 vUv;
out vec4 vColor;

void main() {
  vNormal = mat3(object.model) * normal;
  vUv = uv;
  vColor = object.color;
  gl_Position = camera.projectionView * object.model * vec4(position, 1.0);
}
`;

/**
 * 片元着色器（两种模式共用）：方向光 + 半球环境光 + 基于 uv 的明暗变化。
 * uv 那一项让片元不再是纯色常量，填充率的代价更接近真实场景。
 */
const GLSL_FRAGMENT = `
layout(std140) uniform Camera {
  mat4 projectionView;
  vec3 lightDirection;
} camera;

in vec3 vNormal;
in vec2 vUv;
in vec4 vColor;
layout(location = 0) out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 toLight = normalize(-camera.lightDirection);
  float diffuse = max(dot(normal, toLight), 0.0);
  float hemisphere = 0.20 + 0.15 * (0.5 + 0.5 * normal.y);
  float panel = 0.88 + 0.12 * step(0.5, fract((vUv.x + vUv.y) * 3.0));
  fragColor = vec4(vColor.rgb * (hemisphere + 0.8 * diffuse) * panel, vColor.a);
}
`;

const WGSL_COMMON = `
struct Camera {
  projectionView: mat4x4f,
  lightDirection: vec3f,
}

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
  @location(2) color: vec4f,
}
`;

const WGSL_VERTEX_INSTANCED = `
struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) instanceModel0: vec4f,
  @location(4) instanceModel1: vec4f,
  @location(5) instanceModel2: vec4f,
  @location(6) instanceModel3: vec4f,
  @location(7) instanceColor: vec4f,
}

@vertex fn vsMain(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let model = mat4x4f(
    input.instanceModel0,
    input.instanceModel1,
    input.instanceModel2,
    input.instanceModel3,
  );
  out.normal = (model * vec4f(input.normal, 0.0)).xyz;
  out.uv = input.uv;
  out.color = input.instanceColor;
  out.position = camera.projectionView * model * vec4f(input.position, 1.0);
  return out;
}
`;

const WGSL_VERTEX_PER_DRAW = `
struct Object {
  model: mat4x4f,
  color: vec4f,
}

@group(1) @binding(0) var<uniform> object: Object;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
}

@vertex fn vsMain(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.normal = (object.model * vec4f(input.normal, 0.0)).xyz;
  out.uv = input.uv;
  out.color = object.color;
  out.position = camera.projectionView * object.model * vec4f(input.position, 1.0);
  return out;
}
`;

const WGSL_FRAGMENT = `
@fragment fn fsMain(input: VertexOutput) -> @location(0) vec4f {
  let normal = normalize(input.normal);
  let toLight = normalize(-camera.lightDirection);
  let diffuse = max(dot(normal, toLight), 0.0);
  let hemisphere = 0.20 + 0.15 * (0.5 + 0.5 * normal.y);
  let panel = 0.88 + 0.12 * step(0.5, fract((input.uv.x + input.uv.y) * 3.0));
  return vec4f(input.color.rgb * (hemisphere + 0.8 * diffuse) * panel, input.color.a);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 几何体：24 顶点 / 36 索引的盒子（position + normal + uv）                                             */
/* ------------------------------------------------------------------------------------------------ */

interface MeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint16Array;
}

/**
 * 6 个面，每面 9 个数：法线 (3) + u 轴 (3) + v 轴 (3)，且保证 `u × v = 法线`。
 * 这样 4 个角按 (-u,-v) (+u,-v) (+u,+v) (-u,+v) 排列、索引按 (0,1,2) (0,2,3) 连时，
 * 从外面看就是逆时针（背面剔除要靠它）。
 */
const BOX_FACES: readonly number[] = [
  // +X
  1, 0, 0, 0, 0, -1, 0, 1, 0,
  // -X
  -1, 0, 0, 0, 0, 1, 0, 1, 0,
  // +Y
  0, 1, 0, 1, 0, 0, 0, 0, -1,
  // -Y
  0, -1, 0, 1, 0, 0, 0, 0, 1,
  // +Z
  0, 0, 1, 1, 0, 0, 0, 1, 0,
  // -Z
  0, 0, -1, -1, 0, 0, 0, 1, 0,
];

/** 单位盒子（边长 1，中心在原点）。每个面 4 个独立顶点，所以法线是硬边、uv 是 (0,0)..(1,1)。 */
function buildBox(): MeshData {
  const faces = BOX_FACES.length / 9;
  const positions = new Float32Array(faces * 4 * 3);
  const normals = new Float32Array(faces * 4 * 3);
  const uvs = new Float32Array(faces * 4 * 2);
  const indices = new Uint16Array(faces * 6);
  const corners: readonly (readonly [number, number])[] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];

  for (let face = 0; face < faces; face++) {
    const base = face * 9;
    const nx = BOX_FACES[base]!;
    const ny = BOX_FACES[base + 1]!;
    const nz = BOX_FACES[base + 2]!;
    const ux = BOX_FACES[base + 3]!;
    const uy = BOX_FACES[base + 4]!;
    const uz = BOX_FACES[base + 5]!;
    const vx = BOX_FACES[base + 6]!;
    const vy = BOX_FACES[base + 7]!;
    const vz = BOX_FACES[base + 8]!;

    for (let corner = 0; corner < 4; corner++) {
      const sign = corners[corner]!;
      const su = sign[0];
      const sv = sign[1];
      const vertex = face * 4 + corner;
      positions[vertex * 3] = 0.5 * (nx + su * ux + sv * vx);
      positions[vertex * 3 + 1] = 0.5 * (ny + su * uy + sv * vy);
      positions[vertex * 3 + 2] = 0.5 * (nz + su * uz + sv * vz);
      normals[vertex * 3] = nx;
      normals[vertex * 3 + 1] = ny;
      normals[vertex * 3 + 2] = nz;
      uvs[vertex * 2] = (su + 1) / 2;
      uvs[vertex * 2 + 1] = (sv + 1) / 2;
    }

    const origin = face * 4;
    indices[face * 6] = origin;
    indices[face * 6 + 1] = origin + 1;
    indices[face * 6 + 2] = origin + 2;
    indices[face * 6 + 3] = origin;
    indices[face * 6 + 4] = origin + 2;
    indices[face * 6 + 5] = origin + 3;
  }

  return { positions, normals, uvs, indices };
}

/* ------------------------------------------------------------------------------------------------ */
/* 每物体状态：位置/颜色只生成一次，运动参数每帧参与 model 矩阵                                                */
/* ------------------------------------------------------------------------------------------------ */

function hash(index: number, seed: number): number {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(seed + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000;
}

const PALETTE: readonly (readonly [number, number, number])[] = [
  [0.98, 0.62, 0.25],
  [0.35, 0.72, 0.98],
  [0.55, 0.92, 0.55],
  [0.95, 0.42, 0.55],
  [0.78, 0.6, 0.98],
  [0.98, 0.9, 0.45],
];

interface ObjectSet {
  /** 基础位置（世界空间）。 */
  readonly positions: Float32Array;
  readonly colors: Float32Array;
  readonly scales: Float32Array;
  /** 角速度（rad/s）。 */
  readonly spins: Float32Array;
  /** 初相位（rad）。 */
  readonly phases: Float32Array;
  /** 水平环绕半径。 */
  readonly orbits: Float32Array;
  /** 上下浮动幅度。 */
  readonly bobs: Float32Array;
}

/** 一次性生成 MAX_COUNT 个物体的状态（确定性哈希，刷新后画面一致）。 */
function buildObjects(): ObjectSet {
  const positions = new Float32Array(MAX_COUNT * 3);
  const colors = new Float32Array(MAX_COUNT * 4);
  const scales = new Float32Array(MAX_COUNT);
  const spins = new Float32Array(MAX_COUNT);
  const phases = new Float32Array(MAX_COUNT);
  const orbits = new Float32Array(MAX_COUNT);
  const bobs = new Float32Array(MAX_COUNT);
  const side = Math.max(1, Math.ceil(Math.cbrt(MAX_COUNT)));
  const cell = SPREAD / side;

  for (let i = 0; i < MAX_COUNT; i++) {
    const ix = i % side;
    const iy = Math.floor(i / side) % side;
    const iz = Math.floor(i / (side * side));
    positions[i * 3] = ((ix + 0.5) / side - 0.5 + (hash(i, 11) - 0.5) * 0.6) * SPREAD;
    positions[i * 3 + 1] = ((iy + 0.5) / side - 0.5 + (hash(i, 12) - 0.5) * 0.6) * SPREAD;
    positions[i * 3 + 2] = ((iz + 0.5) / side - 0.5 + (hash(i, 13) - 0.5) * 0.6) * SPREAD;
    scales[i] = cell * 0.9;
    // 每帧都在动：自转 + 水平环绕 + 上下浮动，三个频率互不相同，避免看起来像整体平移。
    spins[i] = 0.6 + hash(i, 21) * 1.6;
    phases[i] = hash(i, 22) * Math.PI * 2;
    orbits[i] = cell * (0.2 + hash(i, 23) * 0.5);
    bobs[i] = cell * (0.25 + hash(i, 24) * 0.6);
    const color = PALETTE[i % PALETTE.length]!;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    colors[i * 4 + 3] = 1;
  }

  return { positions, colors, scales, spins, phases, orbits, bobs };
}

/* ------------------------------------------------------------------------------------------------ */
/* 设备与资源                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

interface Scene {
  readonly device: Device;
  readonly context: CanvasContext;
  readonly instancedPipeline: RenderPipeline;
  readonly perDrawPipeline: RenderPipeline;
  readonly cameraBindGroup: BindGroup;
  readonly objectBindGroup: BindGroup;
  readonly cameraUniformBuffer: Buffer;
  readonly cameraUniformData: Float32Array;
  readonly positionBuffer: Buffer;
  readonly normalBuffer: Buffer;
  readonly uvBuffer: Buffer;
  readonly indexBuffer: Buffer;
  readonly instanceMatrixBuffer: Buffer;
  readonly instanceColorBuffer: Buffer;
  readonly objectUniformBuffer: Buffer;
  /** 每物体 uniform 段的字节步长（按设备对齐值取整）。 */
  readonly objectStride: number;
  /** 实例化模式：每物体 16 个 float 的 model 矩阵（交错，一次上传）。 */
  readonly matrixData: Float32Array;
  /** 逐 draw 模式：每物体 uniform 段（model 16 + color 4，段间按 objectStride 对齐）。 */
  readonly objectData: Float32Array;
  readonly projectionGL: Float32Array;
  readonly projectionZO: Float32Array;
  readonly objects: ObjectSet;
}

let scene: Scene | null = null;
const reportedErrors: string[] = [];
/** 画布通道是否真的带上了深度附件（见 {@link drawFrame}）。 */
let depthAttachmentKnown: boolean | null = null;

async function createScene(): Promise<Scene> {
  const created = await createDeviceWithAdapter({
    canvas,
    backend,
    label: 'benchmark',
    // 深度必须在这里要：WebGL2 的默认帧缓冲深度由创建 context 时的属性决定，configure() 改不了。
    contextAttributes: { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: false },
  });
  const { device } = created;
  const context = created.context;
  if (!context) throw new Error('[gpu-device-api] benchmark: createDeviceWithAdapter 没有返回 canvas context。');

  device.onError((error) => {
    reportedErrors.push(error.message);
    setData('benchmarkErrors', String(reportedErrors.length));
    if (reportedErrors.length === 1) {
      setData('benchmarkFirstError', error.message.replace(/\s+/g, ' ').trim());
    }
  });

  statusEl.textContent = `后端：${created.backend}　设备：${describeAdapter(created.adapter.info)}`;
  setData('benchmarkAdapter', describeAdapter(created.adapter.info));
  setData(
    'benchmarkSync',
    created.backend === 'webgpu' ? 'onSubmittedWorkDone' : 'readPixels-1x1',
  );

  const mesh = buildBox();
  const objects = buildObjects();

  /* ---- 顶点/索引缓冲（只上传一次）--------------------------------------------------------------- */
  const vertexUsage = BufferUsage.Vertex | BufferUsage.CopyDst;
  const positionBuffer = device.createBuffer({
    label: 'bench:positions',
    size: mesh.positions.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const normalBuffer = device.createBuffer({
    label: 'bench:normals',
    size: mesh.normals.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(normalBuffer, 0, mesh.normals);
  const uvBuffer = device.createBuffer({
    label: 'bench:uvs',
    size: mesh.uvs.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(uvBuffer, 0, mesh.uvs);
  const indexBuffer = device.createBuffer({
    label: 'bench:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  /* ---- 实例化模式的每物体矩阵 + 颜色（矩阵每帧重写，颜色只写一次）--------------------------------- */
  const matrixData = new Float32Array(MAX_COUNT * 16);
  const instanceMatrixBuffer = device.createBuffer({
    label: 'bench:instanceModel',
    size: matrixData.byteLength,
    usage: vertexUsage,
  });
  const instanceColorBuffer = device.createBuffer({
    label: 'bench:instanceColor',
    size: objects.colors.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(instanceColorBuffer, 0, objects.colors);

  /* ---- 逐 draw 模式的每物体 uniform 段（按设备对齐值取整；动态偏移必须是它的倍数）----------------- */
  const objectStride = alignTo(
    OBJECT_UNIFORM_BYTES,
    Math.max(4, device.limits.minUniformBufferOffsetAlignment),
  );
  const objectData = new Float32Array((MAX_COUNT * objectStride) / 4);
  const objectUniformBuffer = device.createBuffer({
    label: 'bench:objectUniforms',
    size: objectData.byteLength,
    usage: BufferUsage.Uniform | BufferUsage.CopyDst,
  });
  // 颜色是静态的：先写进每一段的后 4 个 float，之后每帧只需要刷新前 16 个。
  const floatsPerObject = objectStride / 4;
  for (let i = 0; i < MAX_COUNT; i++) {
    const base = i * floatsPerObject + 16;
    objectData[base] = objects.colors[i * 4]!;
    objectData[base + 1] = objects.colors[i * 4 + 1]!;
    objectData[base + 2] = objects.colors[i * 4 + 2]!;
    objectData[base + 3] = objects.colors[i * 4 + 3]!;
  }

  /* ---- uniform 块（手写 std140 布局）----------------------------------------------------------- */
  const cameraUniformData = new Float32Array(CAMERA_UNIFORM_BYTES / 4);
  cameraUniformData[16] = LIGHT_DIRECTION[0];
  cameraUniformData[17] = LIGHT_DIRECTION[1];
  cameraUniformData[18] = LIGHT_DIRECTION[2];
  const cameraUniformBuffer = device.createBuffer({
    label: 'bench:cameraUniforms',
    size: CAMERA_UNIFORM_BYTES,
    usage: BufferUsage.Uniform | BufferUsage.CopyDst,
  });

  const cameraLayout = device.createBindGroupLayout({
    label: 'bench:cameraLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex | ShaderStage.Fragment,
        type: BindingType.Uniform,
        name: 'Camera',
        buffer: { type: 'uniform', minBindingSize: CAMERA_UNIFORM_BYTES },
      },
    ],
  });
  const objectLayout = device.createBindGroupLayout({
    label: 'bench:objectLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex,
        type: BindingType.Uniform,
        name: 'Object',
        // 每物体一段，用动态偏移绑定；size 必须是**单段**的字节数，不是整个 buffer。
        buffer: { type: 'uniform', hasDynamicOffset: true, minBindingSize: OBJECT_UNIFORM_BYTES },
      },
    ],
  });
  const instancedLayout = device.createPipelineLayout({
    label: 'bench:instancedLayout',
    bindGroupLayouts: [cameraLayout],
  });
  const perDrawLayout = device.createPipelineLayout({
    label: 'bench:perDrawLayout',
    bindGroupLayouts: [cameraLayout, objectLayout],
  });
  const cameraBindGroup = device.createBindGroup({
    label: 'bench:cameraBindGroup',
    layout: cameraLayout,
    entries: [
      { binding: 0, resource: { buffer: cameraUniformBuffer, offset: 0, size: CAMERA_UNIFORM_BYTES } },
    ],
  });
  const objectBindGroup = device.createBindGroup({
    label: 'bench:objectBindGroup',
    layout: objectLayout,
    entries: [{ binding: 0, resource: { buffer: objectUniformBuffer, offset: 0, size: OBJECT_UNIFORM_BYTES } }],
  });

  /* ---- 管线：两条，属性位置与上面 shader 的 location 一致 ---------------------------------------- */
  const instancedModule = device.createShaderModule({
    label: 'bench:shaderInstanced',
    code: {
      vs: GLSL_VERTEX_INSTANCED,
      fs: GLSL_FRAGMENT,
      wgsl: `${WGSL_COMMON}${WGSL_VERTEX_INSTANCED}${WGSL_FRAGMENT}`,
    },
  });
  const instancedPipeline = device.createRenderPipeline({
    label: 'bench:instancedPipeline',
    layout: instancedLayout,
    vertex: {
      module: instancedModule,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: POSITION_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: NORMAL_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: UV_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }],
        },
        {
          arrayStride: MATRIX_STRIDE,
          stepMode: 'instance',
          attributes: [
            { shaderLocation: 3, offset: 0, format: 'float32x4' },
            { shaderLocation: 4, offset: 16, format: 'float32x4' },
            { shaderLocation: 5, offset: 32, format: 'float32x4' },
            { shaderLocation: 6, offset: 48, format: 'float32x4' },
          ],
        },
        {
          arrayStride: COLOR_STRIDE,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 7, offset: 0, format: 'float32x4' }],
        },
      ],
    },
    fragment: { module: instancedModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const perDrawModule = device.createShaderModule({
    label: 'bench:shaderPerDraw',
    code: {
      vs: GLSL_VERTEX_PER_DRAW,
      fs: GLSL_FRAGMENT,
      wgsl: `${WGSL_COMMON}${WGSL_VERTEX_PER_DRAW}${WGSL_FRAGMENT}`,
    },
  });
  const perDrawPipeline = device.createRenderPipeline({
    label: 'bench:perDrawPipeline',
    layout: perDrawLayout,
    vertex: {
      module: perDrawModule,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: POSITION_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: NORMAL_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: UV_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module: perDrawModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const built: Scene = {
    device,
    context,
    instancedPipeline,
    perDrawPipeline,
    cameraBindGroup,
    objectBindGroup,
    cameraUniformBuffer,
    cameraUniformData,
    positionBuffer,
    normalBuffer,
    uvBuffer,
    indexBuffer,
    instanceMatrixBuffer,
    instanceColorBuffer,
    objectUniformBuffer,
    objectStride,
    matrixData,
    objectData,
    projectionGL: mat4.create(),
    projectionZO: mat4.create(),
    objects,
  };
  updateProjection(context.width, context.height);
  return built;
}

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

/** 按给定画布尺寸重建投影矩阵，并写进相机 uniform 块（离屏自检也复用它）。 */
function updateProjection(width: number, height: number): void {
  const active = scene;
  if (!active) return;
  const aspect = height === 0 ? 1 : width / height;
  mat4.perspective(active.projectionGL, Math.PI / 4, aspect, 0.1, 200);
  mat4.perspectiveZO(active.projectionZO, Math.PI / 4, aspect, 0.1, 200);

  const eye = vec3.fromValues(0, 4.5, 16);
  const target = vec3.fromValues(0, 0, 0);
  const up = vec3.fromValues(0, 1, 0);
  const view = mat4.lookAt(mat4.create(), eye, target, up);
  const projection = active.device.backend === 'webgpu' ? active.projectionZO : active.projectionGL;
  const projectionView = mat4.multiply(mat4.create(), projection, view);

  active.cameraUniformData.set(projectionView, 0);
  active.device.queue.writeBuffer(active.cameraUniformBuffer, 0, active.cameraUniformData);
}

/* ------------------------------------------------------------------------------------------------ */
/* 每帧的模型矩阵：重算 + 整段上传（这才是动态场景每帧要付的钱）                                             */
/* ------------------------------------------------------------------------------------------------ */

/** 所有物体共用的自转轴（已归一化）——轴相同、但角速度/相位/环绕各不相同。 */
const MODEL_AXIS = vec3.normalize(vec3.fromValues(0.35, 1, 0.2), vec3.fromValues(0.35, 1, 0.2));
/** 复用的临时矩阵/向量：每帧 4 万次变换里不产生任何临时对象。 */
const modelScratch = mat4.create();
const translationScratch = vec3.create();
const scaleScratch = vec3.create();

/** 虚拟时钟：每画一帧前进 {@link FRAME_STEP_SECONDS}，与真实帧率无关，因此可复现。 */
let clockSeconds = 0;

function advanceClock(): number {
  clockSeconds += FRAME_STEP_SECONDS;
  return clockSeconds;
}

/**
 * 按给定时刻重算 `count` 个物体的 model 矩阵（`T * R * S`，用的是库自己的 `mat4` 变换），
 * 写进待上传的数组。这一函数本身就是「动态场景的矩阵工作」。
 */
function writeObjectModels(count: number, time: number): void {
  const active = scene;
  if (!active) return;
  const objects = active.objects;
  const instanced = mode === 'instanced';
  const floatsPerObject = active.objectStride / 4;

  for (let i = 0; i < count; i++) {
    const angle = objects.spins[i]! * time + objects.phases[i]!;
    const orbitAngle = angle * 0.7;
    translationScratch[0] = objects.positions[i * 3]! + Math.cos(orbitAngle) * objects.orbits[i]!;
    translationScratch[1] = objects.positions[i * 3 + 1]! + Math.sin(angle * 1.3) * objects.bobs[i]!;
    translationScratch[2] = objects.positions[i * 3 + 2]! + Math.sin(orbitAngle) * objects.orbits[i]!;
    const scale = objects.scales[i]!;
    scaleScratch[0] = scale;
    scaleScratch[1] = scale;
    scaleScratch[2] = scale;

    const model = mat4.fromRotationTranslationScale(
      modelScratch,
      angle,
      MODEL_AXIS,
      translationScratch,
      scaleScratch,
    );
    if (instanced) {
      active.matrixData.set(model, i * 16);
    } else {
      active.objectData.set(model, i * floatsPerObject);
    }
  }
}

/** 把每物体的 model 数据整段传上去（`count` 个物体，不含颜色）。 */
function uploadObjectModels(count: number): void {
  const active = scene;
  if (!active) return;
  if (mode === 'instanced') {
    active.device.queue.writeBuffer(active.instanceMatrixBuffer, 0, active.matrixData, 0, count * MATRIX_STRIDE);
  } else {
    active.device.queue.writeBuffer(
      active.objectUniformBuffer,
      0,
      active.objectData,
      0,
      count * active.objectStride,
    );
  }
}

/** 动态模式下的「一帧之前」：推进时钟、重算矩阵、上传。整段算进被测的 CPU 时间里。 */
function stepFrame(count: number): void {
  writeObjectModels(count, advanceClock());
  uploadObjectModels(count);
}

/* ------------------------------------------------------------------------------------------------ */
/* 录制一帧与「等到真的画完」                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** 强制同步用的 1 像素读回缓冲。 */
const pixelScratch = new Uint8Array(4);

/**
 * 等到这一帧真的画完，再返回。
 *
 * - WebGPU：`queue.onSubmittedWorkDone()` 就是队列排空，语义正确；
 * - WebGL2：**`gl.finish()` 在 WebGL 里并不保证 GPU 已经做完**（规范只要求把命令送出去），
 *   实测在 ANGLE/SwiftShader 上几乎立即返回 —— 那样测出来的就只是 CPU 录制时间，
 *   而且驱动队列会越积越多，数字完全不可比。所以这里用一次 1×1 的 `readPixels`
 *   强制同步：它是同步阻塞的，读回时这一帧的绘制必然已经完成。
 *
 * **代价要说清楚**：这样做会把 CPU/GPU 串行化，所以「含同步的帧耗时」是**偏悲观的上界**，
 * 不是「一帧在真实管线里的成本」。因此每档另外测一轮完全不同步的 CPU 时间。
 *
 * `readPixels` 走的是 core 的逃生口 `device.native`，这也是一个「core 层做不到、
 * 必须落到原生 API」的例子。
 */
async function syncFrame(): Promise<void> {
  const active = scene;
  if (!active) return;
  if (active.device.backend === 'webgpu') {
    await active.device.queue.onSubmittedWorkDone();
    return;
  }
  const gl = active.device.native as WebGL2RenderingContext;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelScratch);
}

/** 把当前场景录进给定的 pass：按模式选管线、绑顶点/索引缓冲，然后 draw。 */
function recordScene(active: Scene, pass: RenderPassEncoder, count: number): void {
  pass.setIndexBuffer(active.indexBuffer, 'uint16', 0, active.indexBuffer.size);

  if (mode === 'instanced') {
    pass.setPipeline(active.instancedPipeline);
    pass.setBindGroup(0, active.cameraBindGroup);
    pass.setVertexBuffer(0, active.positionBuffer, 0, active.positionBuffer.size);
    pass.setVertexBuffer(1, active.normalBuffer, 0, active.normalBuffer.size);
    pass.setVertexBuffer(2, active.uvBuffer, 0, active.uvBuffer.size);
    pass.setVertexBuffer(3, active.instanceMatrixBuffer, 0, count * MATRIX_STRIDE);
    pass.setVertexBuffer(4, active.instanceColorBuffer, 0, count * COLOR_STRIDE);
    pass.drawIndexed({ indexCount: BOX_INDEX_COUNT, instanceCount: count });
    return;
  }

  pass.setPipeline(active.perDrawPipeline);
  pass.setBindGroup(0, active.cameraBindGroup);
  pass.setVertexBuffer(0, active.positionBuffer, 0, active.positionBuffer.size);
  pass.setVertexBuffer(1, active.normalBuffer, 0, active.normalBuffer.size);
  pass.setVertexBuffer(2, active.uvBuffer, 0, active.uvBuffer.size);
  for (let i = 0; i < count; i++) {
    // 每物体一段 uniform（动态偏移），与 src/gfx 的 uniform arena 是同一条路。
    pass.setBindGroup(1, active.objectBindGroup, [i * active.objectStride]);
    pass.drawIndexed({ indexCount: BOX_INDEX_COUNT, instanceCount: 1 });
  }
}

/** 画一帧到画布。深度附件来自 `context.createPassDescriptor()`（见下方注释）。 */
function drawFrame(count: number): void {
  const active = scene;
  if (!active) return;
  /*
   * 深度附件必须由 context 给：`context.getCurrentFrameTarget().view` 只是颜色附件。
   * 旧版直接用它拼 colorAttachments，于是通道没有深度附件 —— WebGL2 会静默把 DEPTH_TEST 关掉，
   * WebGPU 则解析成「没有深度状态」的管线变体（见 CanvasContext.createPassDescriptor 的说明）。
   */
  const descriptor = active.context.createPassDescriptor({
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: CLEAR_VALUE,
    depthLoadOp: 'clear',
    depthClearValue: 1,
  });
  if (depthAttachmentKnown === null) {
    depthAttachmentKnown = descriptor.depthStencilAttachment !== null;
    setData('benchmarkDepthTest', depthAttachmentKnown ? 'on' : 'off');
  }

  const encoder = active.device.createCommandEncoder({ label: 'bench:frame' });
  const pass = encoder.beginRenderPass({
    label: 'bench:pass',
    colorAttachments: descriptor.colorAttachments,
    depthStencilAttachment: descriptor.depthStencilAttachment,
  });
  recordScene(active, pass, count);
  pass.end();
  active.device.queue.submit([encoder.finish()]);
}

/* ------------------------------------------------------------------------------------------------ */
/* 测量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface TierTiming {
  readonly frames: number;
  /** 不同步那一轮：重算矩阵 + 上传 + 录制 + 提交（纯 CPU；驱动队列满时会被反压）。 */
  readonly cpuNoSyncMsMean: number;
  readonly cpuNoSyncMsMin: number;
  readonly cpuNoSyncMsMax: number;
  /** 同步那一轮里的录制 + 提交时间（提交后还要等 GPU，所以它比上面那列略高）。 */
  readonly cpuSyncMsMean: number;
  /** 提交之后等 GPU 做完的时间。 */
  readonly gpuWaitMsMean: number;
  /** 同步那一轮的整帧耗时 = CPU + GPU（**被串行化，偏悲观**）。 */
  readonly frameMsMean: number;
  readonly frameMsMin: number;
  readonly frameMsMax: number;
}

interface TierMeasurement {
  readonly count: number;
  readonly drawCalls: number;
  readonly vertices: number;
  readonly triangles: number;
  readonly framesMeasured: number;
  /** 主测量：`motion=on` 时是动态，`motion=off` 时是静态。 */
  readonly primary: TierTiming;
  /** 静态对照（只有 `motion=on` 才测）。 */
  readonly control: TierTiming | null;
  /** 动态模式下每帧上传的字节数（静态模式为 0）。 */
  readonly uploadBytesPerFrame: number;
  readonly note: string;
}

interface SkippedTier {
  readonly count: number;
  readonly skipped: string;
}

type TierResult = TierMeasurement | SkippedTier;

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

/** 大档少测几帧：单帧几百毫秒时测 30 帧纯属浪费（CPU 均值早就稳定）。 */
function framesForCount(count: number): number {
  const cap = count >= 20000 ? 3 : count >= 10000 ? 5 : MAX_MEASURED_FRAMES;
  return Math.max(MIN_FRAMES, Math.min(framesToMeasure, cap));
}

/** 大档热身也少一点，但至少两帧（uniform/bind group 的首次状态解析都发生在头一帧）。 */
function warmupForCount(count: number): number {
  return count >= 10000 ? 2 : 3;
}

/**
 * 测一档的一轮：`dynamic` 为真时每帧都重算并上传 model 矩阵，为假时只测前上传一次。
 *
 * 两轮测量：
 * 1. **不同步**：`t0 → step → draw → t1`，只累加 CPU 时间；整轮结束后同步一次。
 *    队列空着起跑，所以这一列最接近「纯 CPU 成本」。
 * 2. **逐帧同步**：`t0 → step → draw → t1 → await sync → t2`，
 *    得到 CPU(t1-t0)、GPU 等待(t2-t1)、以及被串行化的整帧耗时(t2-t0)。
 */
async function timePhase(count: number, frames: number, dynamic: boolean): Promise<TierTiming> {
  const step = (): void => {
    if (dynamic) stepFrame(count);
  };

  if (!dynamic) {
    // 静态：测量前写一次就够。这一笔一次性成本不计入每帧数字（静态场景本来就只上传一次）。
    writeObjectModels(count, advanceClock());
    uploadObjectModels(count);
  }

  for (let i = 0; i < warmupForCount(count); i++) {
    step();
    drawFrame(count);
  }
  await syncFrame();

  const cpuNoSync: number[] = [];
  for (let i = 0; i < frames; i++) {
    const start = performance.now();
    step();
    drawFrame(count);
    cpuNoSync.push(performance.now() - start);
    progressEl.textContent = `测量中：${count} 个物体（${dynamic ? '动态' : '静态'} CPU ${i + 1}/${frames}）`;
  }
  await syncFrame();

  const cpuSync: number[] = [];
  const gpuWait: number[] = [];
  const frameTimes: number[] = [];
  for (let i = 0; i < frames; i++) {
    const start = performance.now();
    step();
    drawFrame(count);
    const submitted = performance.now();
    await syncFrame();
    const finished = performance.now();
    cpuSync.push(submitted - start);
    gpuWait.push(finished - submitted);
    frameTimes.push(finished - start);
    progressEl.textContent = `测量中：${count} 个物体（${dynamic ? '动态' : '静态'} 含同步 ${i + 1}/${frames}）`;
  }

  return {
    frames,
    cpuNoSyncMsMean: mean(cpuNoSync),
    cpuNoSyncMsMin: Math.min(...cpuNoSync),
    cpuNoSyncMsMax: Math.max(...cpuNoSync),
    cpuSyncMsMean: mean(cpuSync),
    gpuWaitMsMean: mean(gpuWait),
    frameMsMean: mean(frameTimes),
    frameMsMin: Math.min(...frameTimes),
    frameMsMax: Math.max(...frameTimes),
  };
}

/** 动态模式下的物体备注。 */
function modeNote(): string {
  const motionNote = motion ? '每帧重算+上传矩阵' : '矩阵只上传一次';
  return mode === 'instanced'
    ? `1 次 draw call（实例化矩阵属性），${motionNote}`
    : `每物体 1 次 draw call（uniform 动态偏移），${motionNote}`;
}

async function measureTier(count: number): Promise<TierResult> {
  const frames = framesForCount(count);

  // 探一帧（含同步）：太慢就跳过这一档，别把页面钉死。
  const probeStart = performance.now();
  if (motion) stepFrame(count);
  drawFrame(count);
  await syncFrame();
  const probeMs = performance.now() - probeStart;
  if (probeMs > SLOW_FRAME_LIMIT_MS) {
    return {
      count,
      skipped: `单帧探测 ${probeMs.toFixed(0)}ms > ${SLOW_FRAME_LIMIT_MS}ms，跳过（可用 ?counts= 只跑小档）`,
    };
  }

  const primary = await timePhase(count, frames, motion);
  // 默认（动态）时再测一遍静态对照，于是同一档就能给出「动起来多花多少」。
  const control = motion ? await timePhase(count, frames, false) : null;
  const active = scene;
  const bytesPerObject =
    mode === 'instanced' ? MATRIX_STRIDE : active?.objectStride ?? OBJECT_UNIFORM_BYTES;

  return {
    count,
    drawCalls: mode === 'instanced' ? 1 : count,
    vertices: count * BOX_VERTEX_COUNT,
    triangles: count * BOX_TRIANGLES,
    framesMeasured: frames,
    primary,
    control,
    uploadBytesPerFrame: motion ? count * bytesPerObject : 0,
    note: modeNote(),
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 结果展示                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

const COLUMN_COUNT = 18;

function rowFor(count: number): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.dataset.count = String(count);
  for (let i = 0; i < COLUMN_COUNT; i++) row.appendChild(document.createElement('td'));
  row.cells[0]!.textContent = String(count);
  return row;
}

function perDrawUs(timing: TierTiming, drawCalls: number): number {
  return (timing.cpuNoSyncMsMean * 1000) / Math.max(drawCalls, 1);
}

function perObjectUs(timing: TierTiming, count: number): number {
  return (timing.cpuNoSyncMsMean * 1000) / Math.max(count, 1);
}

function motionCostText(result: TierMeasurement): string {
  if (!result.control) return '—';
  const deltaCpu = result.primary.cpuNoSyncMsMean - result.control.cpuNoSyncMsMean;
  const deltaFrame = result.primary.frameMsMean - result.control.frameMsMean;
  return `+${deltaCpu.toFixed(2)} / +${deltaFrame.toFixed(2)} ms`;
}

function renderMeasurement(result: TierResult): void {
  const row = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${result.count}"]`) ?? rowFor(result.count);
  if (!row.isConnected) rowsEl.appendChild(row);
  row.className = '';

  if ('skipped' in result) {
    row.className = 'skipped';
    for (let i = 1; i <= COLUMN_COUNT - 2; i++) row.cells[i]!.textContent = '—';
    row.cells[COLUMN_COUNT - 1]!.textContent = result.skipped;
    return;
  }

  const timing = result.primary;
  row.className = 'done';
  row.cells[1]!.textContent = String(result.drawCalls);
  row.cells[2]!.textContent = result.vertices.toLocaleString('en-US');
  row.cells[3]!.textContent = result.triangles.toLocaleString('en-US');
  row.cells[4]!.textContent = `${timing.frameMsMean.toFixed(2)} ms`;
  row.cells[5]!.textContent = (1000 / Math.max(timing.frameMsMean, 1e-6)).toFixed(0);
  row.cells[6]!.textContent = `${timing.frameMsMin.toFixed(2)} ms`;
  row.cells[7]!.textContent = `${timing.frameMsMax.toFixed(2)} ms`;
  row.cells[8]!.textContent = `${timing.cpuNoSyncMsMean.toFixed(2)} ms`;
  row.cells[9]!.textContent = `${timing.cpuSyncMsMean.toFixed(2)} ms`;
  row.cells[10]!.textContent = `${timing.gpuWaitMsMean.toFixed(2)} ms`;
  row.cells[11]!.textContent = perDrawUs(timing, result.drawCalls).toFixed(2);
  row.cells[12]!.textContent = perObjectUs(timing, result.count).toFixed(2);
  row.cells[13]!.textContent = (result.drawCalls / Math.max(timing.cpuNoSyncMsMean / 1000, 1e-9)).toFixed(0);
  row.cells[14]!.textContent = `${((result.triangles / Math.max(timing.frameMsMean / 1000, 1e-9)) / 1e6).toFixed(2)} M/s`;
  row.cells[15]!.textContent = motionCostText(result);
  row.cells[16]!.textContent = String(result.framesMeasured);
  row.cells[17]!.textContent = result.note;
}

/** 每档一条紧凑摘要；档与档之间用 `;` 分隔（键名沿用旧版，另加新列）。 */
function summarize(
  results: readonly TierResult[],
  pick: (result: TierMeasurement) => TierTiming,
  staticPhase = false,
): string {
  return results
    .map((result) => {
      if ('skipped' in result) return `${result.count}:skipped(${result.skipped})`;
      const timing = pick(result);
      return (
        `${result.count}:frame=${timing.frameMsMean.toFixed(2)}ms,min=${timing.frameMsMin.toFixed(2)}ms,` +
        `max=${timing.frameMsMax.toFixed(2)}ms,fps=${(1000 / Math.max(timing.frameMsMean, 1e-6)).toFixed(1)},` +
        `cpu=${timing.cpuNoSyncMsMean.toFixed(2)}ms,cpuSync=${timing.cpuSyncMsMean.toFixed(2)}ms,` +
        `gpuWait=${timing.gpuWaitMsMean.toFixed(2)}ms,` +
        `perDraw=${perDrawUs(timing, result.drawCalls).toFixed(2)}us,` +
        `perObject=${perObjectUs(timing, result.count).toFixed(2)}us,` +
        `drawsPerSecond=${(result.drawCalls / Math.max(timing.cpuNoSyncMsMean / 1000, 1e-9)).toFixed(0)},` +
        `trisPerSecond=${(result.triangles / Math.max(timing.frameMsMean / 1000, 1e-9)).toFixed(0)},` +
        `draws=${result.drawCalls},vertices=${result.vertices},tris=${result.triangles},` +
        `uploadBytes=${staticPhase ? 0 : result.uploadBytesPerFrame},frames=${result.framesMeasured}`
      );
    })
    .join(';');
}

/** 每档只取某一列的紧凑摘要。 */
function summarizeColumn(
  results: readonly TierResult[],
  field: (timing: TierTiming) => string,
): string {
  return results
    .map((result) =>
      'skipped' in result ? `${result.count}:skipped` : `${result.count}:${field(result.primary)}`,
    )
    .join(';');
}

function summarizeMotionCost(results: readonly TierResult[]): string {
  return results
    .map((result) => {
      if ('skipped' in result) return `${result.count}:skipped`;
      if (!result.control) return `${result.count}:n/a`;
      const deltaCpu = result.primary.cpuNoSyncMsMean - result.control.cpuNoSyncMsMean;
      const deltaFrame = result.primary.frameMsMean - result.control.frameMsMean;
      return (
        `${result.count}:deltaCpuMs=${deltaCpu.toFixed(2)},deltaFrameMs=${deltaFrame.toFixed(2)},` +
        `staticCpuMs=${result.control.cpuNoSyncMsMean.toFixed(2)},` +
        `staticFrameMs=${result.control.frameMsMean.toFixed(2)}`
      );
    })
    .join(';');
}

/** `#out` 里的人读版本：每档一段，动态档附上静态对照。 */
function describeLine(result: TierResult): string {
  if ('skipped' in result) return `${result.count} 个物体：跳过 —— ${result.skipped}`;
  const timing = result.primary;
  const head =
    `${result.count} 个物体：帧耗时(含同步) ${timing.frameMsMean.toFixed(2)} ms` +
    `（最小 ${timing.frameMsMin.toFixed(2)} / 最大 ${timing.frameMsMax.toFixed(2)}，` +
    `${(1000 / Math.max(timing.frameMsMean, 1e-6)).toFixed(0)} FPS）；` +
    `CPU 录制+提交 ${timing.cpuNoSyncMsMean.toFixed(2)} ms（不同步）/ ${timing.cpuSyncMsMean.toFixed(2)} ms（含同步），` +
    `GPU 同步等待 ${timing.gpuWaitMsMean.toFixed(2)} ms；${result.drawCalls} draw call，` +
    `每 draw ${perDrawUs(timing, result.drawCalls).toFixed(2)} µs，每物体 ${perObjectUs(timing, result.count).toFixed(2)} µs，` +
    `${(result.triangles / Math.max(timing.frameMsMean / 1000, 1e-9) / 1e6).toFixed(2)} M 三角形/s，` +
    `测了 ${result.framesMeasured} 帧`;

  if (!result.control) return head;
  const deltaCpu = result.primary.cpuNoSyncMsMean - result.control.cpuNoSyncMsMean;
  const deltaFrame = result.primary.frameMsMean - result.control.frameMsMean;
  return (
    `${head}\n    静态对照：帧耗时 ${result.control.frameMsMean.toFixed(2)} ms，` +
    `CPU 录制+提交 ${result.control.cpuNoSyncMsMean.toFixed(2)} ms` +
    `　→　让物体动起来多花 ΔCPU ${deltaCpu.toFixed(2)} ms、Δ帧 ${deltaFrame.toFixed(2)} ms`
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* 正确性自检：离屏渲染 + readback，确认「真的画了」以及「动态时前后两帧真的不一样」                            */
/* ------------------------------------------------------------------------------------------------ */

/** 把当前场景在给定时刻画进离屏目标并读回像素。 */
async function renderOffscreen(count: number, time: number): Promise<Uint8Array> {
  const active = scene;
  if (!active) throw new Error('[gpu-device-api] benchmark: 场景尚未创建。');

  // 静态模式不需要重写（写到同一个时刻的矩阵也无妨），动态模式则必须让两次读回时刻不同。
  writeObjectModels(count, time);
  uploadObjectModels(count);
  // 离屏目标是正方形，投影也按它算，免得画面被画布的长宽比裁掉。
  updateProjection(VERIFY_SIZE, VERIFY_SIZE);

  const byteLength = VERIFY_SIZE * VERIFY_SIZE * 4;
  const target = active.device.createRenderTarget({
    label: 'bench:verify',
    width: VERIFY_SIZE,
    height: VERIFY_SIZE,
    color: 'rgba8unorm',
    // usage 会同时作用到颜色与深度附件上：WebGPU 里 depth24plus 不能参与拷贝，所以用 depth32float。
    depth: 'depth32float',
    usage: TextureUsage.CopySrc,
  });
  const readback = active.device.createBuffer({
    label: 'bench:verifyReadback',
    size: byteLength,
    // WebGPU：MapRead 只能与 CopyDst 组合。
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });

  try {
    const descriptor = target.createPassDescriptor({
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: CLEAR_VALUE,
      depthLoadOp: 'clear',
      depthClearValue: 1,
    });
    const encoder = active.device.createCommandEncoder({ label: 'bench:verify' });
    const pass = encoder.beginRenderPass({
      label: 'bench:verifyPass',
      colorAttachments: descriptor.colorAttachments,
      depthStencilAttachment: descriptor.depthStencilAttachment,
    });
    recordScene(active, pass, count);
    pass.end();

    const copyEncoder = active.device.createCommandEncoder({ label: 'bench:verifyCopy' });
    copyEncoder.copyTextureToBuffer(
      { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
      { buffer: readback, offset: 0, bytesPerRow: VERIFY_SIZE * 4 },
      { width: VERIFY_SIZE, height: VERIFY_SIZE, depthOrArrayLayers: 1 },
    );
    active.device.queue.submit([encoder.finish(), copyEncoder.finish()]);

    await readback.mapAsync('read', 0, byteLength);
    const pixels = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
    readback.unmap();
    return pixels;
  } finally {
    readback.destroy();
    target.destroy();
  }
}

function countLitPixels(pixels: Uint8Array): { lit: number; distinctColors: number } {
  const background = CLEAR_VALUE.map((value) => Math.round(value * 255));
  let lit = 0;
  const colors = new Set<number>();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    if (
      Math.abs(r - background[0]!) <= 4 &&
      Math.abs(g - background[1]!) <= 4 &&
      Math.abs(b - background[2]!) <= 4
    ) {
      continue;
    }
    lit += 1;
    colors.add((r << 16) | (g << 8) | b);
  }
  return { lit, distinctColors: colors.size };
}

function countDifferingPixels(a: Uint8Array, b: Uint8Array): number {
  let differing = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) differing += 1;
  }
  return differing;
}

/**
 * 用最小的一档做离屏自检：
 * - 画出来的像素确实不是清屏色（证明这些 draw 真的在画东西）；
 * - 动态模式下，相隔 0.5 秒的两个时刻读回的像素**确实不同**（证明每帧上传的矩阵真的在起作用，
 *   而不是「声明了动态、实际画面冻住」）。
 */
async function checkRendering(count: number): Promise<void> {
  const time = clockSeconds;
  const first = await renderOffscreen(count, time);
  const second = motion ? await renderOffscreen(count, time + 0.5) : first;

  const { lit, distinctColors } = countLitPixels(first);
  const moved = countDifferingPixels(first, second);
  setData('benchmarkLitPixels', String(lit));
  setData('benchmarkDistinctColors', String(distinctColors));
  setData('benchmarkMotionPixels', String(moved));
  setData('benchmarkMoved', motion ? String(moved > 0) : 'n/a');
  setData('benchmarkLit', String(lit > 0 && distinctColors >= 2));
  // 自检把投影改成了正方形，恢复成画布比例。
  updateProjection(scene?.context.width ?? 1, scene?.context.height ?? 1);
}

/* ------------------------------------------------------------------------------------------------ */
/* 跑一遍基准                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

let running = false;
let finished = false;

async function runBenchmark(): Promise<void> {
  const active = scene;
  if (running || !active) return;
  running = true;
  rerunButton.disabled = true;
  rowsEl.replaceChildren();
  outEl.textContent = '测量中…';
  // 重跑时先把上一轮的结论清掉，免得无头抓取拿到旧值（包括启动时写的 0）。
  clearData('benchmarkDone');
  clearData('benchmarkResult');
  clearData('benchmarkError');
  for (const key of [
    'benchmarkResults',
    'benchmarkResultsDynamic',
    'benchmarkResultsStatic',
    'benchmarkMotionCost',
    'benchmarkCpuSubmit',
    'benchmarkGpuSync',
    'benchmarkFrameTimes',
    'benchmarkThroughput',
    'benchmarkLit',
    'benchmarkMoved',
  ]) {
    clearData(key);
  }

  setData('benchmarkMode', mode);
  setData('benchmarkMotion', motion ? 'on' : 'off');
  setData('benchmarkFrames', String(framesToMeasure));
  setData('benchmarkSyncNote',
    '「含同步」列用 1×1 readPixels（WebGL2）/ onSubmittedWorkDone（WebGPU）逐帧等 GPU，' +
    '会把 CPU/GPU 串行化，因此帧耗时偏悲观；「无同步」列才是纯矩阵重算+上传+录制+提交（队列满时会被反压）。');

  active.context.resize();
  updateProjection(active.context.width, active.context.height);

  /*
   * 全局热身：把 JIT 与驱动的首次开销挤到测量之外。
   *
   * 为什么必须单独做一次：各档走的是同一条代码路径，一次性成本（矩阵循环的 JIT、着色器程序
   * 编译、uniform block 绑定计划、VAO 建立）会全部落在**第一档**的均值里 —— 实测第一档的
   * CPU 均值会被抬高一整个量级，看起来像「物体越少越慢」这种荒唐结论。
   */
  const warmCount = Math.min(counts[0] ?? DEFAULT_COUNTS[0]!, 2000);
  for (let i = 0; i < 5; i++) {
    if (motion) stepFrame(warmCount);
    drawFrame(warmCount);
  }
  await syncFrame();

  const results: TierResult[] = [];
  for (const count of counts) {
    statusEl.textContent =
      `测量中：${count} 个物体（${mode === 'instanced' ? '实例化' : '逐 draw'}，` +
      `${motion ? '动态' : '静态'}）…`;
    renderMeasurement({ count, skipped: '测量中…' });
    const pending = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${count}"]`);
    if (pending) pending.className = 'pending';
    const result = await measureTier(count);
    renderMeasurement(result);
    results.push(result);

    const pickDynamic = (item: TierMeasurement): TierTiming => item.primary;
    const pickStatic = (item: TierMeasurement): TierTiming => item.control ?? item.primary;
    setData('benchmarkResults', summarize(results, pickDynamic));
    setData('benchmarkResultsDynamic', summarize(results, pickDynamic));
    setData('benchmarkResultsStatic', summarize(results, pickStatic, true));
    setData('benchmarkMotionCost', summarizeMotionCost(results));
    setData(
      'benchmarkCpuSubmit',
      summarizeColumn(results, (timing) =>
        `cpuNoSync=${timing.cpuNoSyncMsMean.toFixed(2)}ms,min=${timing.cpuNoSyncMsMin.toFixed(2)}ms,` +
        `max=${timing.cpuNoSyncMsMax.toFixed(2)}ms,cpuSync=${timing.cpuSyncMsMean.toFixed(2)}ms`),
    );
    setData(
      'benchmarkGpuSync',
      summarizeColumn(results, (timing) =>
        `gpuWait=${timing.gpuWaitMsMean.toFixed(2)}ms,frames=${timing.frames}`),
    );
    setData(
      'benchmarkFrameTimes',
      summarizeColumn(results, (timing) =>
        `mean=${timing.frameMsMean.toFixed(2)}ms,min=${timing.frameMsMin.toFixed(2)}ms,` +
        `max=${timing.frameMsMax.toFixed(2)}ms`),
    );
    setData('benchmarkThroughput', summarizeThroughput(results));
    setData(
      'benchmarkUploadBytesPerFrame',
      results
        .filter((item): item is TierMeasurement => !('skipped' in item))
        .map((item) => `${item.count}:${item.uploadBytesPerFrame}`)
        .join(';'),
    );
    statsEl.textContent =
      `后端 ${active.device.backend}　画布 ${active.context.width}×${active.context.height}　` +
      `几何 box(${BOX_VERTEX_COUNT}v/${BOX_INDEX_COUNT}i/${BOX_TRIANGLES}tri)　${motion ? '动态' : '静态'}`;
    await yieldToBrowser();
  }

  try {
    await checkRendering(counts[0] ?? DEFAULT_COUNTS[0]!);
  } catch (error: unknown) {
    setData('benchmarkError', (error as Error).message);
  }

  const okTiers = results.filter((result): result is TierMeasurement => !('skipped' in result));
  setData('benchmarkFramesPerTier', okTiers.map((item) => `${item.count}:${item.framesMeasured}`).join(';'));
  setData('benchmarkTiersMeasured', String(okTiers.length));

  outEl.textContent =
    `后端 ${active.device.backend}　画布 ${active.context.width}×${active.context.height}　` +
    `几何 box(${BOX_VERTEX_COUNT} 顶点/${BOX_INDEX_COUNT} 索引/${BOX_TRIANGLES} 三角形，position+normal+uv)　` +
    `模式 ${mode === 'instanced' ? '实例化（1 draw call）' : '逐 draw（每物体 1 draw call）'}　` +
    `${motion ? '动态（每帧重算 + 上传模型矩阵）' : '静态（矩阵只上传一次）'}\n` +
    `每档测 ${framesToMeasure} 帧（大档按 framesForCount 降帧，见表格「测帧数」）　` +
    `同步方式 ${active.device.backend === 'webgpu' ? 'onSubmittedWorkDone' : '1×1 readPixels'}\n` +
    `注意：「含同步」列逐帧等 GPU，把 CPU/GPU 串行化，帧耗时偏悲观；「无同步」列是纯 CPU 成本。\n` +
    results.map(describeLine).join('\n');

  progressEl.textContent = '完成';
  statusEl.textContent =
    `完成：${results.length} 档（其中 ${okTiers.length} 档测到数字）　${motion ? '动态' : '静态'}`;
  rerunButton.disabled = false;
  running = false;
  finished = true;
  // 结论最后写：无头抓取看到 benchmarkDone 就说明上面所有 data-* 都已就位。
  setData('benchmarkDone', '1');
  setData('benchmarkResult', 'ok');
  startIdleLoop();
}

/** 每 draw / 每物体 / draws/s / 三角形每秒 的紧凑摘要。 */
function summarizeThroughput(results: readonly TierResult[]): string {
  return results
    .map((result) => {
      if ('skipped' in result) return `${result.count}:skipped`;
      const timing = result.primary;
      return (
        `${result.count}:perDrawUs=${perDrawUs(timing, result.drawCalls).toFixed(2)},` +
        `perObjectUs=${perObjectUs(timing, result.count).toFixed(2)},` +
        `drawsPerSecond=${(result.drawCalls / Math.max(timing.cpuNoSyncMsMean / 1000, 1e-9)).toFixed(0)},` +
        `trisPerSecond=${(result.triangles / Math.max(timing.frameMsMean / 1000, 1e-9)).toFixed(0)}`
      );
    })
    .join(';');
}

function failRun(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  statusEl.textContent = `失败：${message}`;
  statusEl.className = 'error';
  outEl.textContent = `失败：${message}`;
  setData('benchmarkError', message);
  // 写成 `fail` 而不是 `1`：无头脚本按非空即「拿到结论」判断，`fail` 会同时把退出码变成 1，
  // 不会把一次失败伪装成成功。
  setData('benchmarkDone', 'fail');
  setData('benchmarkResult', 'fail');
  finished = true;
  running = false;
  rerunButton.disabled = false;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* 测完之后转起来，顺便显示实时帧率（动态模式下画面是真的在动）                                              */
/* ------------------------------------------------------------------------------------------------ */

let idleHandle = 0;
let idleFrames = 0;
let idleWindowStart = 0;

function startIdleLoop(): void {
  cancelAnimationFrame(idleHandle);
  idleFrames = 0;
  idleWindowStart = 0;
  // 演示阶段不要用逐 draw 模式的最大档，否则页面会卡住。
  const idleCount =
    mode === 'instanced'
      ? Math.min(20000, Math.max(...counts))
      : Math.min(500, Math.max(...counts));
  const loop = (time: number): void => {
    const active = scene;
    if (!active) return;
    active.context.resize();
    if (motion) stepFrame(idleCount);
    drawFrame(idleCount);
    idleFrames += 1;
    if (idleWindowStart === 0) {
      idleWindowStart = time;
    } else if (time - idleWindowStart > 500) {
      const fps = (idleFrames * 1000) / Math.max(time - idleWindowStart, 1);
      statsEl.textContent =
        `演示 ${idleCount} 个物体 / ${active.context.width}×${active.context.height}　` +
        `${fps.toFixed(0)} FPS（仅 CPU 提交，未等 GPU）　${motion ? '动态' : '静态'}`;
      idleFrames = 0;
      idleWindowStart = time;
    }
    idleHandle = requestAnimationFrame(loop);
  };
  idleHandle = requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------------------------------------ */
/* 启动                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

modeSelect.value = mode;
motionSelect.value = motion ? 'on' : 'off';
framesInput.value = String(framesToMeasure);

modeSelect.addEventListener('change', () => {
  mode = modeSelect.value === 'draws' ? 'draws' : 'instanced';
  void runBenchmark().catch(failRun);
});
motionSelect.addEventListener('change', () => {
  motion = motionSelect.value !== 'off';
  void runBenchmark().catch(failRun);
});
framesInput.addEventListener('change', () => {
  framesToMeasure = clampInt(Number(framesInput.value), DEFAULT_FRAMES, MIN_FRAMES, MAX_FRAMES);
  framesInput.value = String(framesToMeasure);
});
rerunButton.addEventListener('click', () => {
  void runBenchmark().catch(failRun);
});
window.addEventListener('resize', () => {
  const active = scene;
  if (!active) return;
  active.context.resize();
  updateProjection(active.context.width, active.context.height);
});
window.addEventListener('unhandledrejection', (event) => {
  if (!finished) failRun(event.reason);
});
window.addEventListener('error', (event) => {
  if (!finished) failRun(event.error ?? event.message);
});

setData('benchmarkCounts', counts.join(','));
setData('benchmarkBackend', backend);
setData('benchmarkMode', mode);
setData('benchmarkMotion', motion ? 'on' : 'off');
setData('benchmarkFrames', String(framesToMeasure));
setData('benchmarkGeometry', `box:${BOX_VERTEX_COUNT}v/${BOX_INDEX_COUNT}i/${BOX_TRIANGLES}tri:position+normal+uv`);
setData('benchmarkTrianglesPerObject', String(BOX_TRIANGLES));
setData('benchmarkVerticesPerObject', String(BOX_VERTEX_COUNT));
setData('benchmarkPerObjectMatrixBytes', String(MATRIX_STRIDE));
setData('benchmarkUploadBytesPerFrame', '');

createScene()
  .then(async (created) => {
    scene = created;
    setData('benchmarkBackend', created.device.backend);
    statusEl.textContent =
      `后端：${created.device.backend}　分档 ${counts.join(', ')}　${motion ? '动态' : '静态'}　${mode}`;
    await runBenchmark();
  })
  .catch(failRun);
