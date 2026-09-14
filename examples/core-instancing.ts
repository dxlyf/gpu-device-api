/**
 * core 层示例：**实例化**（一次 draw call 画 N 个图形）。
 *
 * 与批量示例的分工很清楚：这里 N 个图形的差异全部放在**顶点缓冲**里，
 * 每个实例读一份（`stepMode: 'instance'`），所以 draw call 恒为 1。
 *
 * core 层要自己做的两件事：
 * 1. `VertexBufferLayout` 里给实例属性写 `stepMode: 'instance'`（WebGL2 后端据此调用
 *    `vertexAttribDivisor`，WebGPU 后端据此填 `GPUVertexBufferLayout.stepMode`）；
 * 2. 绑定实例缓冲时给出**准确的 size**（WebGPU 会校验「实例数 × 步长」有没有超出绑定范围）。
 *
 * 布局为什么是「正对相机的 2D 格点面」而不是「3D 立体格点云」，见 {@link GRID_HALF_HEIGHT} 上的长注释。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&count=4096&spin=0&verify=1`
 */

import { BufferUsage, mat4, vec3 } from '../src/index.js';
import {
  backendFromQuery,
  buildQuadMesh,
  createCoreExample,
  createUniformBinding,
  reportVerify,
  requireElement,
  setData,
  startFrameLoop,
  verifyOffscreen,
} from './core-shared.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

const CLEAR: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];
const UNIFORM_BYTES = 96; // mat4 projectionView(64) + f32 pointSize(4) + 12 字节填充 … 见下方打包注释
const MAX_COUNT = 20000;
const DEFAULT_COUNT = 4096;
/** 相机到格点面的距离；视锥在格点面上的可见半高 = `CAMERA_DISTANCE * tan(FOV / 2)`。 */
const CAMERA_DISTANCE = 16;

/**
 * 实例格点铺开成「扁的矩形」，而不是正方形或立方体。
 *
 * 格点要**铺满相机视锥**，而视锥在 16:9 / 21:9 这类窗口里就是扁的（可见范围约等于
 * `高 × 宽高比`）。正方形格点会有一半实例落在画面外白画；立体格点则必然在层间露出背景色
 * （见 {@link buildInstanceData} 的长注释）。
 *
 * 决定画面成败的是**竖直方向的铺开范围**：相机在 `(0, 0, {@link CAMERA_DISTANCE})`、垂直 FOV 45°，
 * 于是 z=0 处可见半高 `16 * tan(22.5°) ≈ 6.63`。格子只要比这个矮一点，画布上下就会各留一条
 * 纯清屏色的横带（比左右黑边显眼得多），所以 {@link GRID_HALF_HEIGHT} 取 13（约 2 倍余量，
 * 也盖得住 {@link SWAY_ANGLE} 把画面角转到更远处的部分）。
 *
 * 格距 = `2 * GRID_HALF_HEIGHT / 行数`、行数 ≈ `sqrt(实例数 / GRID_ASPECT)`：实例越多格距越小、
 * 画面越细密，而**铺开范围几乎不随实例数变化** —— 这正是「小 count 也铺满、大 count 不稀疏」
 * 的原因。代价是超大 count 时横向会铺到视锥之外（那部分只是被裁掉，不影响画面）。
 */
const GRID_HALF_HEIGHT = 13;
/** 扁矩形的目标宽高比（列数 ÷ 行数）。 */
const GRID_ASPECT = 2.4;
/**
 * 每实例在**格子内**的位移（单位：格子，x / y 两个方向）。
 *
 * 抖动让画面不像印刷网格，但它把相邻实例推开了：两个抖动到极端的邻居会相距 `1 + 2 * JITTER`
 * 个格距，四边形只有不小于这个值才可能压住缝。最小尺寸是 `QUAD_SCALE * SCALE_MIN`，所以
 * 无缝条件是 `QUAD_SCALE * SCALE_MIN > 1 + 2 * JITTER`。实测（`scripts/analyze-screenshot.mjs`
 * 统计真实合成截图里的清屏色像素，4096 实例、画布 940×431）与公式一致：
 *
 * - `QUAD_SCALE = 0.5`（边界 0.425）：8.31% 的像素是背景色，846 处缝；
 * - `QUAD_SCALE = 0.7`（边界 0.595）：0.02%；
 * - `QUAD_SCALE = 0.85`（边界 0.7225，刚好越线）：0%；
 * - `QUAD_SCALE = 1.9`（本例取值）：0%，且对抖动幅度有 1.6 倍余量。
 *
 * 缝隙不会因为「画更多实例」而消失：抖动方向逐实例随机，四边形压不住那道缝时，单个格点在
 * 任何缩放倍数下都会漏底。
 */
const JITTER = 0.35;
/**
 * 每实例四边形相对格距的基准倍数（实际还会乘上 {@link SCALE_MIN} ~ {@link SCALE_MAX} 的逐实例系数）。
 *
 * 无缝下限是 {@link JITTER} 推出来的 `(1 + 2 * JITTER) / SCALE_MIN ≈ 1.18`；取 1.9 是为了给
 * 抖动、逐实例尺寸留够余量（也顺便让画面更像一片密铺的马赛克而不是一排排方格）。
 */
const QUAD_SCALE = 1.9;
/** 逐实例尺寸的乘数范围（乘在基准边长 {@link QUAD_SCALE} 上）：大小不一，画面才有层次。 */
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.25;
/**
 * 面内摆动（绕 Z 轴，也就是绕视线）的幅度与角速度。
 *
 * 只转**面内**角度：格点面仍然正对相机、投影是仿射的，格距与四边形边长同比例变化，铺满的
 * 性质在任意角度都成立。上一版让整片格点绕 Y 轴转出平面，转到 40° 以上时格点被投影压成一条
 * 斜带、画面上重新出现大片清屏色（实测 0.7 rad 时 10.3%、1.1 rad 时 26.9%、1.3 rad 时 33.8%）——
 * 平面格点一旦转出平面就会周期性露底。
 */
const SWAY_ANGLE = 0.12;
const SWAY_SPEED = 0.3;

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 instanceOffset;
layout(location = 2) in vec4 instanceColor;
layout(location = 3) in vec2 instanceRotation;

layout(std140) uniform Uniforms {
  mat4 projectionView;
  float pointSize;
} u;

out vec4 vColor;

void main() {
  // 每实例绕四边形自身法线转一个角度（同类属性的 vec2 打包，省一个顶点缓冲）。
  float sine = instanceRotation.x;
  float cosine = instanceRotation.y;
  vec2 corner = vec2(position.x * cosine - position.y * sine, position.x * sine + position.y * cosine);
  // 每实例尺寸借道 instanceColor.a（本来恒为 1、片元里丢掉）：存的是相对 u.pointSize 的乘数。
  // 顶点阵是 ±1 的正方形（见 buildQuadMesh(2)），所以顶点乘上 size 得到的边长正好是 size。
  float size = instanceColor.a * u.pointSize;
  vec3 world = vec3(corner, position.z) * size + instanceOffset;
  vColor = vec4(instanceColor.rgb, 1.0);
  gl_Position = u.projectionView * vec4(world, 1.0);
}
`;

const FRAGMENT_GLSL = `
in vec4 vColor;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;

const MODULE_WGSL = `
struct Uniforms {
  projectionView: mat4x4f,
  pointSize: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) instanceOffset: vec3f,
  @location(2) instanceColor: vec4f,
  @location(3) instanceRotation: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let sine = v.instanceRotation.x;
  let cosine = v.instanceRotation.y;
  let corner = vec2f(v.position.x * cosine - v.position.y * sine, v.position.x * sine + v.position.y * cosine);
  let world = vec3f(corner, v.position.z) * (v.instanceColor.a * u.pointSize) + v.instanceOffset;
  out.color = vec4f(v.instanceColor.rgb, 1.0);
  out.position = u.projectionView * vec4f(world, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return in.color;
}
`;

/** 确定性哈希 → [0,1)，布局每次刷新都一样，便于对比与自检。 */
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

interface InstanceData {
  readonly offsets: Float32Array;
  readonly colors: Float32Array;
  readonly rotations: Float32Array;
  /** 四边形基准边长（世界单位）；每个实例实际边长 = `colors` 的 alpha × 这个值。 */
  readonly baseSize: number;
}

/**
 * 生成每实例数据：**正对相机的 2D 格点面**。
 *
 * 为什么不是 3D 立体格点云（上一版的做法）：平面四边形按 3D 格点排布时，投影到屏幕上的
 * 层间距会随深度缩小，而四边形尺寸固定 —— 从斜角看过去一定会在层与层之间露出背景色。
 * 这不是抖动缝，把四边形放大治不了。两条实证（都在本仓库实测过，脚本见
 * `scripts/analyze-screenshot.mjs`，统计口径是「真实合成截图里接近清屏色的像素」）：
 *
 * 1. **改成面向相机的 billboard 也没用**：同一个 3D 格点、同一套参数，固定朝向 35.38%
 *    对 billboard 35.28% —— 差 0.1 个百分点。空腔来自格点的**投影疏密**，不是四边形的朝向。
 * 2. 真正的变量是「格点投影到屏幕后还是不是一片铺满的网格」：把格点铺满视锥、四边形放大到
 *    压过抖动之后，清屏色占比从 35% 掉到 1% 以下。
 *
 * 实例数不变、仍是 1 次 draw call，每实例的 offset / color / 尺寸 / 自转角都照常从顶点缓冲里读。
 */
function buildInstanceData(count: number): InstanceData {
  const offsets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const rotations = new Float32Array(count * 2);
  // 格数与格距：由实例数推出「扁矩形」的格数，再用「铺开范围 ÷ 行数」定格距 —— 于是格距
  // 随实例数一起变小，铺开范围几乎不变（既不会小 count 时缩成一点，也不会大 count 时变稀疏）。
  const rows = Math.max(1, Math.ceil(Math.sqrt(count / GRID_ASPECT)));
  const cell = (2 * GRID_HALF_HEIGHT) / rows;
  const columns = Math.max(1, Math.ceil(count / rows));
  // 四边形边长 = 格距 × QUAD_SCALE。抖动最坏把邻居推开 `2 * JITTER` 个格距，而逐实例尺寸
  // 最小会缩到 SCALE_MIN 倍，所以 `QUAD_SCALE * SCALE_MIN` 必须大于 `1 + 2 * JITTER`。
  const baseSize = cell * QUAD_SCALE;
  for (let i = 0; i < count; i++) {
    const ix = i % columns;
    const iy = Math.floor(i / columns) % rows;
    // 格点世界坐标 =（格内归一化位置 - 0.5 + 抖动）× 格距；抖动单位是「格子」。
    offsets[i * 3] = (ix + 0.5 - columns / 2 + (hash(i, 11) - 0.5) * JITTER) * cell;
    offsets[i * 3 + 1] = (iy + 0.5 - rows / 2 + (hash(i, 12) - 0.5) * JITTER) * cell;
    offsets[i * 3 + 2] = 0;
    const color = PALETTE[i % PALETTE.length]!;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    // 每实例绕自身法线转 ±0.35 rad：打散格点的规则感。把 sin / cos 打进顶点缓冲，
    // 顶点着色器里就不用再做三角函数。
    const rotation = (hash(i, 17) - 0.5) * 0.7;
    rotations[i * 2] = Math.sin(rotation);
    rotations[i * 2 + 1] = Math.cos(rotation);
    // 每实例尺寸借道 alpha：存相对基准边长的乘数（片元里丢掉 alpha）。
    colors[i * 4 + 3] = SCALE_MIN + hash(i, 19) * (SCALE_MAX - SCALE_MIN);
  }
  // 第 0 个实例固定在原点、尺寸取基准值：画布中心一定被盖住，离屏自检也就有了确定的锚点。
  offsets[0] = 0;
  offsets[1] = 0;
  offsets[2] = 0;
  colors[3] = 1;
  return { offsets, colors, rotations, baseSize };
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  let spinning = query.get('spin') !== '0';
  const countParam = Number(query.get('count'));
  const count =
    Number.isInteger(countParam) && countParam > 0 ? Math.min(countParam, MAX_COUNT) : DEFAULT_COUNT;

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-instancing');
  const { device, context } = example;

  /* ---- 基础几何体 + 每实例数据 ---------------------------------------------------------------- */
  // 四边形取边长 2（顶点在 ±1），于是顶点着色器里「顶点 × 尺寸」得到的**世界边长正好就是尺寸**
  //（用边长 1 的阵会得到一半大小 —— 这个坑踩过一次，见 VERTEX_GLSL 里的尺寸注释）。
  const mesh = buildQuadMesh(2);
  const positionBuffer = device.createBuffer({
    label: 'instancing:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const indexBuffer = device.createBuffer({
    label: 'instancing:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  const instanceData = buildInstanceData(count);
  const offsetBuffer = device.createBuffer({
    label: 'instancing:offsets',
    size: instanceData.offsets.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(offsetBuffer, 0, instanceData.offsets);
  const colorBuffer = device.createBuffer({
    label: 'instancing:colors',
    size: instanceData.colors.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(colorBuffer, 0, instanceData.colors);
  const rotationBuffer = device.createBuffer({
    label: 'instancing:rotations',
    size: instanceData.rotations.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(rotationBuffer, 0, instanceData.rotations);

  /* ---- uniform：projectionView(64) + pointSize(4) + 12 字节填充 = 96 ------------------------- */
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  // mat4 projectionView(0..63) + f32 pointSize(64)；其余是 std140 对齐用的填充。
  uniformData[16] = instanceData.baseSize;
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();
  const model = mat4.create();

  const updateUniforms = (angle: number): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    mat4.perspective(projectionGL, Math.PI / 4, aspect, 0.1, 200);
    mat4.perspectiveZO(projectionZO, Math.PI / 4, aspect, 0.1, 200);
    // 相机正对格点面；格点面只绕视线（Z 轴）做面内摆动，投影始终是仿射的，格点不会被压出空腔。
    mat4.lookAt(
      view,
      vec3.fromValues(0, 0, CAMERA_DISTANCE),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0),
    );
    mat4.identity(model);
    mat4.rotateZ(model, model, angle);
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);
    mat4.multiply(viewProjection, viewProjection, model);
    uniformData.set(viewProjection, 0);
    uniforms.write(uniformData);
  };

  /* ---- 管线：实例属性就是 stepMode: 'instance' 的那个槽 ---------------------------------------- */
  const module = device.createShaderModule({
    label: 'instancing:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'instancing:pipelineLayout',
    bindGroupLayouts: [uniforms.layout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'instancing:pipeline',
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: 12,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: 12,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: 16,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }],
        },
        {
          arrayStride: 8,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 3, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const drawInstances = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, uniforms.bindGroup);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    // 实例缓冲的 size 必须覆盖「实例数 × 步长」。
    pass.setVertexBuffer(1, offsetBuffer, 0, count * 12);
    pass.setVertexBuffer(2, colorBuffer, 0, count * 16);
    pass.setVertexBuffer(3, rotationBuffer, 0, count * 8);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    pass.drawIndexed({ indexCount: mesh.indices.length, instanceCount: count });
  };

  // 摆动角：`spin=1` 时在 ±SWAY_ANGLE 之间往复；`spin=0`（截图比对用）固定在 0.12 rad，
  // 留一点透视倾斜，画面不至于像一张正对的印刷马赛克，同时远小于会露底的角度。
  const swayAt = (elapsed: number): number => (spinning ? Math.sin(elapsed * SWAY_SPEED) * SWAY_ANGLE : 0.12);
  const drawToCanvas = (angle: number): void => {
    context.resize();
    updateUniforms(angle);
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'instancing:frame' });
    const pass = encoder.beginRenderPass({
      label: 'instancing:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawInstances(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas(swayAt(0));
  setData('instancingResult', 'ok');
  setData('instancingCount', String(count));
  setData('instancingDrawCalls', '1');
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　${count} 个实例 = 1 次 draw call　` +
    `每个实例 2 个三角形`;

  startFrameLoop({
    draw: (_delta, elapsed) => {
      drawToCanvas(swayAt(elapsed));
    },
    onFps: (fps) => {
      statsEl.textContent =
        `${context.width}×${context.height}　${fps.toFixed(0)} FPS　实例 ${count}　三角形 ${count * 2}　draw calls 1`;
    },
  });

  if (query.get('verify') === '1') {
    // 每实例颜色不同：只要画面出现多种颜色，就说明实例属性真的按实例步进了。
    const stats = await verifyOffscreen(device, 96, 96, CLEAR, (pass) => {
      updateUniforms(swayAt(0));
      drawInstances(pass);
    });
    reportVerify('instancing', stats, true);
  }
}

main().catch((error: unknown) => {
  setData('instancingError', (error as Error).message);
  setData('instancingResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
