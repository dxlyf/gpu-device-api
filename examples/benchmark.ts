/**
 * 性能基准：**只用 core 层**（`src/index.ts` 的公开入口），不经过 `src/gfx` 便捷层。
 *
 * 手写的东西包括：着色器（GLSL + WGSL 各一份）、顶点/实例缓冲、uniform 块的字节打包、
 * bind group layout / bind group / pipeline layout、渲染管线、command encoder 与通道，
 * 以及整帧的提交与 GPU 同步。可以把它当成「不带便捷层时，这个库长什么样」的参考。
 *
 * 测量对象是逐图形的吞吐：同一档内几何数据完全不变（只上传一次），
 * 每档先空跑几帧热身，再逐帧计时；每帧结束后用 `queue.onSubmittedWorkDone()` 等 GPU 做完
 *（WebGL2 后端是 `gl.finish()`，WebGPU 后端是队列排空），所以「帧耗时」把 GPU 时间算在内。
 *
 * 两种模式：
 * - `instanced`（默认）：一个形状网格 + 每实例属性，**1 次 draw call** 画 N 个图形；
 * - `draws`：同样画 N 个图形，但每个图形一次 draw call（每次用 setVertexBuffer 的偏移
 *   指向自己的那一份实例数据）。单帧超过阈值就跳过该档，避免把页面卡死。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&mode=instanced|draws&frames=30&counts=2000,5000`
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
import type { Buffer } from '../src/core/resources/Buffer.js';

/* ------------------------------------------------------------------------------------------------ */
/* 配置                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const DEFAULT_COUNTS: readonly number[] = [2000, 5000, 10000, 20000, 40000];
const MAX_COUNT = 40000;
/** 每个图形 8 个三角形（正八面体）。 */
const TRIANGLES_PER_SHAPE = 8;
/** 每实例属性的字节步长。 */
const OFFSET_STRIDE = 12; // float32x3
const COLOR_STRIDE = 16; // float32x4
const SCALE_STRIDE = 4; // float32
/** uniform 块：mat4 projectionView(64) + mat4 model(64) + vec3 lightDirection(12 → 补到 16)。 */
const UNIFORM_BYTES = 144;
/** 逐 draw 模式下，单帧探测耗时超过它就跳过该档（毫秒）。 */
const SLOW_FRAME_LIMIT_MS = 500;
const CLEAR_VALUE: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];

const query = new URLSearchParams(location.search);
const backendParam = query.get('backend');
const backend: 'auto' | 'webgl2' | 'webgpu' =
  backendParam === 'webgl2' || backendParam === 'webgpu' ? backendParam : 'auto';
let mode: 'instanced' | 'draws' = query.get('mode') === 'draws' ? 'draws' : 'instanced';
let framesToMeasure = clampInt(Number(query.get('frames')), 30, 3, 300);
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
const modeSelect = document.getElementById('mode') as HTMLSelectElement;
const framesInput = document.getElementById('frames') as HTMLInputElement;
const rerunButton = document.getElementById('rerun') as HTMLButtonElement;

function clampInt(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.trunc(value), max));
}

/* ------------------------------------------------------------------------------------------------ */
/* 着色器：GLSL 与 WGSL 各写一份（core 层不做自动转译）                                                  */
/* ------------------------------------------------------------------------------------------------ */

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 instanceOffset;
layout(location = 3) in vec4 instanceColor;
layout(location = 4) in float instanceScale;

layout(std140) uniform Uniforms {
  mat4 projectionView;
  mat4 model;
  vec3 lightDirection;
} u;

out vec3 vNormal;
out vec4 vColor;

void main() {
  vec3 worldPosition = position * instanceScale + instanceOffset;
  vNormal = mat3(u.model) * normal;
  vColor = instanceColor;
  gl_Position = u.projectionView * u.model * vec4(worldPosition, 1.0);
}
`;

const FRAGMENT_GLSL = `
layout(std140) uniform Uniforms {
  mat4 projectionView;
  mat4 model;
  vec3 lightDirection;
} u;

in vec3 vNormal;
in vec4 vColor;
layout(location = 0) out vec4 fragColor;

void main() {
  float ndl = max(dot(normalize(vNormal), normalize(-u.lightDirection)), 0.0);
  fragColor = vec4(vColor.rgb * (0.25 + 0.75 * ndl), vColor.a);
}
`;

const MODULE_WGSL = `
struct Uniforms {
  projectionView: mat4x4f,
  model: mat4x4f,
  lightDirection: vec3f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) instanceOffset: vec3f,
  @location(3) instanceColor: vec4f,
  @location(4) instanceScale: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let worldPosition = v.position * v.instanceScale + v.instanceOffset;
  out.normal = (u.model * vec4f(v.normal, 0.0)).xyz;
  out.color = v.instanceColor;
  out.position = u.projectionView * u.model * vec4f(worldPosition, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let ndl = max(dot(normalize(in.normal), normalize(-u.lightDirection)), 0.0);
  return vec4f(in.color.rgb * (0.25 + 0.75 * ndl), in.color.a);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 几何体与实例数据                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

interface ShapeData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint16Array;
}

/** 正八面体：6 个顶点、8 个三角形。索引按「从外面看逆时针」生成（背面剔除要靠它）。 */
function buildOctahedron(): ShapeData {
  // 顶点顺序：0 = +Y，1 = -Y，2 = +X，3 = -X，4 = +Z，5 = -Z
  const positions = new Float32Array([0, 1, 0, 0, -1, 0, 1, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, -1]);
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const length = Math.hypot(positions[i]!, positions[i + 1]!, positions[i + 2]!) || 1;
    normals[i] = positions[i]! / length;
    normals[i + 1] = positions[i + 1]! / length;
    normals[i + 2] = positions[i + 2]! / length;
  }

  const axisVertex = (axis: 0 | 1 | 2, sign: number): number => {
    if (axis === 1) return sign > 0 ? 0 : 1;
    if (axis === 0) return sign > 0 ? 2 : 3;
    return sign > 0 ? 4 : 5;
  };

  const indices: number[] = [];
  for (const sy of [1, -1]) {
    for (const sx of [1, -1]) {
      for (const sz of [1, -1]) {
        const y = axisVertex(1, sy);
        const z = axisVertex(2, sz);
        const x = axisVertex(0, sx);
        indices.push(...(isOutwardFacing(positions, y, z, x) ? [y, z, x] : [y, x, z]));
      }
    }
  }
  return { positions, normals, indices: Uint16Array.from(indices) };
}

/** 三角形 (a,b,c) 的法线是否朝外（对以原点为中心、向外凸的形体成立）。 */
function isOutwardFacing(positions: Float32Array, a: number, b: number, c: number): boolean {
  const ax = positions[a * 3]!, ay = positions[a * 3 + 1]!, az = positions[a * 3 + 2]!;
  const bx = positions[b * 3]!, by = positions[b * 3 + 1]!, bz = positions[b * 3 + 2]!;
  const cx = positions[c * 3]!, cy = positions[c * 3 + 1]!, cz = positions[c * 3 + 2]!;
  const ux = bx - ax, uy = by - ay, uz = bz - az;
  const vx = cx - ax, vy = cy - ay, vz = cz - az;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const centroidX = (ax + bx + cx) / 3;
  const centroidY = (ay + by + cy) / 3;
  const centroidZ = (az + bz + cz) / 3;
  return nx * centroidX + ny * centroidY + nz * centroidZ > 0;
}

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

/** 世界空间的立方体边长；各档图形数共用同一块空间，方便横向对比。 */
const SPREAD = 10;

interface InstanceBuffers {
  readonly offsets: Float32Array;
  readonly colors: Float32Array;
  readonly scales: Float32Array;
}

/** 生成 MAX_COUNT 份实例数据（确定性哈希，刷新后画面一致）。 */
function buildInstanceData(): InstanceBuffers {
  const offsets = new Float32Array(MAX_COUNT * 3);
  const colors = new Float32Array(MAX_COUNT * 4);
  const scales = new Float32Array(MAX_COUNT);
  const side = Math.max(1, Math.ceil(Math.cbrt(MAX_COUNT)));
  const cell = SPREAD / side;

  for (let i = 0; i < MAX_COUNT; i++) {
    const ix = i % side;
    const iy = Math.floor(i / side) % side;
    const iz = Math.floor(i / (side * side));
    offsets[i * 3] = ((ix + 0.5) / side - 0.5 + (hash(i, 11) - 0.5) * 0.6) * SPREAD;
    offsets[i * 3 + 1] = ((iy + 0.5) / side - 0.5 + (hash(i, 12) - 0.5) * 0.6) * SPREAD;
    offsets[i * 3 + 2] = ((iz + 0.5) / side - 0.5 + (hash(i, 13) - 0.5) * 0.6) * SPREAD;
    scales[i] = cell * 0.9;
    const color = PALETTE[i % PALETTE.length]!;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    colors[i * 4 + 3] = 1;
  }
  return { offsets, colors, scales };
}

/* ------------------------------------------------------------------------------------------------ */
/* 设备与资源                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

interface Scene {
  readonly device: Device;
  readonly context: CanvasContext;
  readonly pipeline: RenderPipeline;
  readonly bindGroup: BindGroup;
  readonly uniformBuffer: Buffer;
  readonly positionBuffer: Buffer;
  readonly normalBuffer: Buffer;
  readonly indexBuffer: Buffer;
  readonly offsetBuffer: Buffer;
  readonly colorBuffer: Buffer;
  readonly scaleBuffer: Buffer;
  readonly uniformData: Float32Array;
  readonly projectionGL: Float32Array;
  readonly projectionZO: Float32Array;
}

let scene: Scene | null = null;
const reportedErrors: string[] = [];

async function createScene(): Promise<Scene> {
  const created = await createDeviceWithAdapter({
    canvas,
    backend,
    label: 'benchmark',
    contextAttributes: { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: false },
  });
  const { device } = created;
  const context = created.context;
  if (!context) throw new Error('[gpu-device-api] benchmark: createDeviceWithAdapter 没有返回 canvas context。');

  device.onError((error) => {
    reportedErrors.push(error.message);
    setData('benchmarkErrors', String(reportedErrors.length));
  });

  statusEl.textContent = `后端：${created.backend}　设备：${describeAdapter(created.adapter.info)}`;
  setData('benchmarkAdapter', describeAdapter(created.adapter.info));

  const shape = buildOctahedron();
  const instances = buildInstanceData();

  /* ---- 顶点/索引缓冲 ------------------------------------------------------------------------ */
  const vertexUsage = BufferUsage.Vertex | BufferUsage.CopyDst;
  const positionBuffer = device.createBuffer({
    label: 'bench:positions',
    size: shape.positions.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(positionBuffer, 0, shape.positions);
  const normalBuffer = device.createBuffer({
    label: 'bench:normals',
    size: shape.normals.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(normalBuffer, 0, shape.normals);
  const indexBuffer = device.createBuffer({
    label: 'bench:indices',
    size: shape.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, shape.indices);

  /* ---- 每实例缓冲（按最大档一次性分配 + 上传）--------------------------------------------------- */
  const offsetBuffer = device.createBuffer({
    label: 'bench:instanceOffset',
    size: instances.offsets.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(offsetBuffer, 0, instances.offsets);
  const colorBuffer = device.createBuffer({
    label: 'bench:instanceColor',
    size: instances.colors.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(colorBuffer, 0, instances.colors);
  const scaleBuffer = device.createBuffer({
    label: 'bench:instanceScale',
    size: instances.scales.byteLength,
    usage: vertexUsage,
  });
  device.queue.writeBuffer(scaleBuffer, 0, instances.scales);

  /* ---- uniform 块（手写 std140 布局：mat4 / mat4 / vec3 + padding）----------------------------- */
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  uniformData[32] = 0.42;
  uniformData[33] = 0.86;
  uniformData[34] = 0.52;
  const uniformBuffer = device.createBuffer({
    label: 'bench:uniforms',
    size: UNIFORM_BYTES,
    usage: BufferUsage.Uniform | BufferUsage.CopyDst,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'bench:uniformLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex | ShaderStage.Fragment,
        type: BindingType.Uniform,
        name: 'Uniforms',
        buffer: { type: 'uniform', minBindingSize: UNIFORM_BYTES },
      },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'bench:pipelineLayout',
    bindGroupLayouts: [bindGroupLayout],
  });
  const bindGroup = device.createBindGroup({
    label: 'bench:bindGroup',
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer, offset: 0, size: UNIFORM_BYTES } }],
  });

  /* ---- 管线：属性位置与上面的 location 一致，实例属性用 stepMode: 'instance' --------------------- */
  const module = device.createShaderModule({
    label: 'bench:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipeline = device.createRenderPipeline({
    label: 'bench:pipeline',
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: OFFSET_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: OFFSET_STRIDE,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: OFFSET_STRIDE,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: COLOR_STRIDE,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 3, offset: 0, format: 'float32x4' }],
        },
        {
          arrayStride: SCALE_STRIDE,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 4, offset: 0, format: 'float32' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const built: Scene = {
    device,
    context,
    pipeline,
    bindGroup,
    uniformBuffer,
    positionBuffer,
    normalBuffer,
    indexBuffer,
    offsetBuffer,
    colorBuffer,
    scaleBuffer,
    uniformData,
    projectionGL: mat4.create(),
    projectionZO: mat4.create(),
  };
  updateProjection(built);
  return built;
}

/** 按当前画布宽高比重建投影矩阵，并写进 uniform 块。 */
function updateProjection(active: Scene): void {
  const aspect = active.context.height === 0 ? 1 : active.context.width / active.context.height;
  mat4.perspective(active.projectionGL, Math.PI / 4, aspect, 0.1, 200);
  mat4.perspectiveZO(active.projectionZO, Math.PI / 4, aspect, 0.1, 200);

  const eye = vec3.fromValues(0, 4.5, 16);
  const target = vec3.fromValues(0, 0, 0);
  const up = vec3.fromValues(0, 1, 0);
  const view = mat4.lookAt(mat4.create(), eye, target, up);
  const projection = active.device.backend === 'webgpu' ? active.projectionZO : active.projectionGL;
  const projectionView = mat4.multiply(mat4.create(), projection, view);

  active.uniformData.set(projectionView, 0);
  mat4.identity(active.uniformData.subarray(16, 32));
  active.device.queue.writeBuffer(active.uniformBuffer, 0, active.uniformData);
}

/* ------------------------------------------------------------------------------------------------ */
/* 一帧的录制与「等到真的画完」                                                                          */
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
 * `readPixels` 走的是 core 的逃生口 `device.native`，这也是一个「core 层做不到、
 * 必须落到原生 API」的例子。
 */
async function syncFrame(): Promise<void> {
  const active = scene!;
  if (active.device.backend === 'webgpu') {
    await active.device.queue.onSubmittedWorkDone();
    return;
  }
  const gl = active.device.native as WebGL2RenderingContext;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelScratch);
}

function drawFrame(count: number): void {
  const active = scene;
  if (!active) return;
  const frame = active.context.getCurrentFrameTarget();
  const encoder = active.device.createCommandEncoder({ label: 'bench:frame' });
  const pass = encoder.beginRenderPass({
    label: 'bench:pass',
    colorAttachments: [
      { view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR_VALUE },
    ],
  });

  pass.setPipeline(active.pipeline);
  pass.setBindGroup(0, active.bindGroup);
  pass.setVertexBuffer(0, active.positionBuffer, 0, active.positionBuffer.size);
  pass.setVertexBuffer(1, active.normalBuffer, 0, active.normalBuffer.size);
  pass.setIndexBuffer(active.indexBuffer, 'uint16', 0, active.indexBuffer.size);

  const indexCount = 24; // 8 个三角形 × 3
  if (mode === 'instanced') {
    pass.setVertexBuffer(2, active.offsetBuffer, 0, count * OFFSET_STRIDE);
    pass.setVertexBuffer(3, active.colorBuffer, 0, count * COLOR_STRIDE);
    pass.setVertexBuffer(4, active.scaleBuffer, 0, count * SCALE_STRIDE);
    pass.drawIndexed({ indexCount, instanceCount: count });
  } else {
    // 每个图形一次 draw：用 setVertexBuffer 的 offset 指向自己那一份实例数据。
    for (let i = 0; i < count; i++) {
      pass.setVertexBuffer(2, active.offsetBuffer, i * OFFSET_STRIDE, OFFSET_STRIDE);
      pass.setVertexBuffer(3, active.colorBuffer, i * COLOR_STRIDE, COLOR_STRIDE);
      pass.setVertexBuffer(4, active.scaleBuffer, i * SCALE_STRIDE, SCALE_STRIDE);
      pass.drawIndexed({ indexCount, instanceCount: 1 });
    }
  }

  pass.end();
  active.device.queue.submit([encoder.finish()]);
}

/* ------------------------------------------------------------------------------------------------ */
/* 测量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Measurement {
  readonly count: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly frameMsMean: number;
  readonly frameMsMin: number;
  readonly frameMsMax: number;
  readonly cpuMsMean: number;
  readonly fps: number;
  readonly trianglesPerSecond: number;
  readonly note: string;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

async function measure(count: number): Promise<Measurement | { count: number; skipped: string }> {
  const warmup = mode === 'instanced' ? 5 : 2;

  for (let i = 0; i < warmup; i++) drawFrame(count);
  await syncFrame();

  if (mode === 'draws') {
    // 先探一帧：逐 draw 模式在大数量下可能非常慢，超过阈值就跳过，别把页面卡住。
    const probeStart = performance.now();
    drawFrame(count);
    await syncFrame();
    const probeMs = performance.now() - probeStart;
    if (probeMs > SLOW_FRAME_LIMIT_MS) {
      return { count, skipped: `单帧探测 ${probeMs.toFixed(0)}ms > ${SLOW_FRAME_LIMIT_MS}ms，跳过` };
    }
  }

  const frameSamples: number[] = [];
  const cpuSamples: number[] = [];
  const measuredFrames = mode === 'draws' ? Math.min(framesToMeasure, 10) : framesToMeasure;

  for (let i = 0; i < measuredFrames; i++) {
    const start = performance.now();
    drawFrame(count);
    const submitted = performance.now();
    await syncFrame();
    const finished = performance.now();
    // cpu = 录制 + 提交；frame = 从开始录制到这一帧真的画完（含同步等待）。
    cpuSamples.push(submitted - start);
    frameSamples.push(finished - start);
    progressEl.textContent = `测量中：${count}（${i + 1}/${measuredFrames}）`;
  }

  const frameMsMean = mean(frameSamples);
  const triangles = count * TRIANGLES_PER_SHAPE;
  return {
    count,
    drawCalls: mode === 'instanced' ? 1 : count,
    triangles,
    frameMsMean,
    frameMsMin: Math.min(...frameSamples),
    frameMsMax: Math.max(...frameSamples),
    cpuMsMean: mean(cpuSamples),
    fps: 1000 / Math.max(frameMsMean, 1e-6),
    trianglesPerSecond: triangles * (1000 / Math.max(frameMsMean, 1e-6)),
    note: mode === 'instanced' ? '1 次 draw call' : '每图形 1 次 draw call',
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 结果展示                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function rowFor(count: number): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.dataset.count = String(count);
  for (let i = 0; i < 10; i++) row.appendChild(document.createElement('td'));
  row.cells[0]!.textContent = String(count);
  return row;
}

function renderMeasurement(result: Measurement | { count: number; skipped: string }): void {
  const row = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${result.count}"]`) ?? rowFor(result.count);
  if (!row.isConnected) rowsEl.appendChild(row);
  row.className = '';

  if ('skipped' in result) {
    row.className = 'skipped';
    row.cells[1]!.textContent = '—';
    row.cells[2]!.textContent = '—';
    for (let i = 3; i <= 8; i++) row.cells[i]!.textContent = '—';
    row.cells[9]!.textContent = result.skipped;
    return;
  }

  row.className = 'done';
  row.cells[1]!.textContent = String(result.drawCalls);
  row.cells[2]!.textContent = result.triangles.toLocaleString('en-US');
  row.cells[3]!.textContent = `${result.frameMsMean.toFixed(2)} ms`;
  row.cells[4]!.textContent = `${result.frameMsMin.toFixed(2)} ms`;
  row.cells[5]!.textContent = `${result.frameMsMax.toFixed(2)} ms`;
  row.cells[6]!.textContent = `${result.cpuMsMean.toFixed(2)} ms`;
  row.cells[7]!.textContent = result.fps.toFixed(0);
  row.cells[8]!.textContent = `${(result.trianglesPerSecond / 1e6).toFixed(2)} M/s`;
  row.cells[9]!.textContent = result.note;
}

function summarize(results: readonly (Measurement | { count: number; skipped: string })[]): string {
  return results
    .map((result) =>
      'skipped' in result
        ? `${result.count}:skipped(${result.skipped})`
        : `${result.count}:frame=${result.frameMsMean.toFixed(2)}ms,fps=${result.fps.toFixed(1)},` +
          `cpu=${result.cpuMsMean.toFixed(2)}ms,draws=${result.drawCalls},tris=${result.triangles}`,
    )
    .join(';');
}

function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

/* ------------------------------------------------------------------------------------------------ */
/* 正确性自检：把当前一档画进离屏目标并读回像素，确认不是「空跑」                                          */
/* ------------------------------------------------------------------------------------------------ */

async function checkRendering(count: number): Promise<void> {
  const active = scene!;
  const size = 256;
  const byteLength = size * size * 4;
  const target = active.device.createRenderTarget({
    label: 'bench:verify',
    width: size,
    height: size,
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
  pass.setPipeline(active.pipeline);
  pass.setBindGroup(0, active.bindGroup);
  pass.setVertexBuffer(0, active.positionBuffer, 0, active.positionBuffer.size);
  pass.setVertexBuffer(1, active.normalBuffer, 0, active.normalBuffer.size);
  pass.setVertexBuffer(2, active.offsetBuffer, 0, count * OFFSET_STRIDE);
  pass.setVertexBuffer(3, active.colorBuffer, 0, count * COLOR_STRIDE);
  pass.setVertexBuffer(4, active.scaleBuffer, 0, count * SCALE_STRIDE);
  pass.setIndexBuffer(active.indexBuffer, 'uint16', 0, active.indexBuffer.size);
  pass.drawIndexed({ indexCount: 24, instanceCount: count });
  pass.end();

  const readbackEncoder = active.device.createCommandEncoder({ label: 'bench:copy' });
  readbackEncoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow: size * 4 },
    { width: size, height: size, depthOrArrayLayers: 1 },
  );
  active.device.queue.submit([encoder.finish(), readbackEncoder.finish()]);

  await readback.mapAsync('read', 0, byteLength);
  const pixels = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
  readback.unmap();
  readback.destroy();
  target.destroy();

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
  setData('benchmarkLitPixels', String(lit));
  setData('benchmarkDistinctColors', String(colors.size));
  setData('benchmarkLit', String(lit > 0 && colors.size >= 2));
}

/* ------------------------------------------------------------------------------------------------ */
/* 跑一遍基准                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

let running = false;

async function runBenchmark(): Promise<void> {
  if (running || !scene) return;
  running = true;
  rerunButton.disabled = true;
  rowsEl.replaceChildren();
  setData('benchmarkDone', '0');
  setData('benchmarkMode', mode);
  setData('benchmarkFrames', String(framesToMeasure));

  scene.context.resize();
  updateProjection(scene);

  const results: (Measurement | { count: number; skipped: string })[] = [];
  for (const count of counts) {
    statusEl.textContent = `测量中：${count} 个图形（${mode === 'instanced' ? '实例化' : '逐 draw'}）…`;
    renderMeasurement({ count, skipped: '测量中…' });
    const row = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${count}"]`);
    if (row) row.className = 'pending';
    const result = await measure(count);
    renderMeasurement(result);
    results.push(result);
    setData('benchmarkResults', summarize(results));
  }

  // 用最小的一档做一次离屏像素自检，确认这些 draw 真的在画东西。
  try {
    await checkRendering(counts[0] ?? 2000);
  } catch (error: unknown) {
    setData('benchmarkError', (error as Error).message);
  }

  setData('benchmarkDone', '1');
  progressEl.textContent = '完成';
  statusEl.textContent = `完成：${counts.length} 档测量（${mode === 'instanced' ? '实例化' : '逐 draw'}）`;
  rerunButton.disabled = false;
  running = false;
  startIdleLoop();
}

/* ------------------------------------------------------------------------------------------------ */
/* 测完之后转起来，顺便显示实时帧率                                                                      */
/* ------------------------------------------------------------------------------------------------ */

let idleHandle = 0;
let idleFrames = 0;
let idleWindowStart = 0;

function startIdleLoop(): void {
  cancelAnimationFrame(idleHandle);
  idleFrames = 0;
  idleWindowStart = 0;
  // 演示阶段不要用逐 draw 模式的最大档，否则页面会卡住。
  const idleCount = mode === 'instanced' ? Math.min(20000, Math.max(...counts)) : Math.min(500, Math.max(...counts));
  const loop = (time: number): void => {
    const active = scene;
    if (!active) return;
    active.context.resize();
    drawFrame(idleCount);
    idleFrames += 1;
    if (idleWindowStart === 0) {
      idleWindowStart = time;
    } else if (time - idleWindowStart > 500) {
      const fps = (idleFrames * 1000) / Math.max(time - idleWindowStart, 1);
      statsEl.textContent =
        `演示 ${idleCount} 个图形 / ${active.context.width}×${active.context.height}　` +
        `${fps.toFixed(0)} FPS（仅 CPU 提交，未等 GPU）`;
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
framesInput.value = String(framesToMeasure);
modeSelect.addEventListener('change', () => {
  mode = modeSelect.value === 'draws' ? 'draws' : 'instanced';
  void runBenchmark();
});
framesInput.addEventListener('change', () => {
  framesToMeasure = clampInt(Number(framesInput.value), 30, 3, 300);
  framesInput.value = String(framesToMeasure);
});
rerunButton.addEventListener('click', () => {
  void runBenchmark();
});
window.addEventListener('resize', () => {
  if (!scene) return;
  scene.context.resize();
  updateProjection(scene);
});

setData('benchmarkCounts', counts.join(','));
setData('benchmarkBackend', backend);

createScene()
  .then((created) => {
    scene = created;
    setData('benchmarkBackend', created.device.backend);
    void runBenchmark();
  })
  .catch((error: unknown) => {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
    setData('benchmarkError', (error as Error).message);
    setData('benchmarkDone', '1');
  });
