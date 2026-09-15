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
 * 画面是**一整片绕竖直轴匀速转动的立体格点云**（4096 个小立方体）：布局怎么铺满视锥、
 * 怎么保证任意角度都不露出清屏色，见 {@link buildInstanceData} 上的长注释。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&count=4096&spin=0&angle=<弧度>&verify=1`
 */

import { BufferUsage, mat4, vec3 } from '../src/index.js';
import {
  backendFromQuery,
  buildBoxMesh,
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
const UNIFORM_BYTES = 96; // mat4 projectionView(64) + f32 pointSize(4) + vec3 cameraPosition(12) + 16 字节对齐填充
const MAX_COUNT = 20000;
const DEFAULT_COUNT = 4096;

/** 相机位置：与最初那版一致 —— 从斜上方 4.5 的高度俯视原点。 */
const CAMERA_POSITION: readonly [number, number, number] = [0, 4.5, 16];
/** 垂直视场角（透视投影）。 */
const FIELD_OF_VIEW = Math.PI / 4;
/** 转动角速度（弧度/秒）：每帧把角度加上 `delta × 这个值`，约 18 秒转一整圈。 */
const SPIN_SPEED = 0.35;
/** 起始角（弧度）：没给 `?angle=` 时从它开始转，`?spin=0` 时停在它上面。 */
const START_ANGLE = 0.5;

/**
 * 云的半径（世界单位）：格点云是一个**球**，球心在原点。
 *
 * 取球而不是立方体，是因为云要绕 Y 轴匀速转：球的轮廓在任何角度下都一样，不会有哪个角转到
 * 视锥外；立方体会转出「六边形轮廓」，转到对角线朝向相机时把画面四角露出来。
 *
 * 半径要满足两件事：
 *
 * 1. **轮廓盖住画布**：画布四角那根光线到球心的最近距离 ≈ 11.7（相机在 `(0,4.5,16)`、
 *    垂直 FOV 45°、画布 2.18:1 时，四角光线与相机夹角约 44.8°，`16.62 × sin(44.8°) ≈ 11.7`）。
 *    比它小，四角就是四块纯清屏色。
 * 2. **每根光线都要穿得够厚**：光线穿过云的路程越长、经过的格点层数就越多，而「每层都可能
 *    漏一点」是连乘的关系 —— 层数一多就趋近 0。相机到球心的距离是 `sqrt(4.5² + 16²) ≈ 16.62`，
 *    取半径 16 时相机**刚好贴在云外面**：每根画布光线几乎立刻进入云、再横穿约 32 个单位
 *    （≈ 20 层格点），所以任意角度都盖满。
 *
 * 上限也在这里：半径再大就轮到相机被包进云里，靠近相机的盒会落到近裁剪面（0.1）里面被裁掉，
 * 那才是真的漏底。取 16 时最外层格点加上抖动最多到 `16 + 0.5 × 1.61 / 2 ≈ 16.4`，
 * 离相机还有 0.2，而那里的盒边长只有 `0.083 × 0.2 ≈ 0.017`，远在近裁剪面之外。
 */
const CLOUD_RADIUS = 16;

/**
 * 单个立方体在**屏幕上**的基准边长（占画面高度的比例），0.1 ≈ 43 像素（画布高 431 时）。
 *
 * 这是这一版最关键的一个设计：盒的边长不是固定值，而是**正比于它到相机的距离**
 * （见 {@link VERTEX_GLSL} 里的透视补偿）。于是不管实例在云里的哪一层，它投到屏幕上的
 * 大小都一样 —— 透视只改变位置，不再把远处的盒缩小、把缝放大。
 *
 * 为什么必须这样：4096 个实例要盖住 940×431 的画布，平均每个实例只有约 99 像素的额度；
 * 如果按透视让近处的盒很大、远处的盒很小，那么**近处几层会挡住一切、而远处层间会漏缝**
 * （不做补偿时实测过：远处层间透出清屏色）。
 *
 * 0.1 是实测出来的下限（先用光线投射模型跑遍 16 个角度，再用真实截图核对）：
 * 0.09 时 68° 附近仍有 0.41% 的像素漏底，0.08 时 1.07%，0.1 时全部角度都是 0%。
 * 这个尺度也和上一版（2D 密铺那版）的 39 像素一个量级，画面粗细接近。
 */
const FOOTPRINT_FRACTION = 0.1;

/**
 * 每实例在格子里抖动的幅度（单位：格子，0.5 = 格内均匀随机）。
 *
 * 抖动不只是「不像印刷网格」，它直接决定覆盖率：每个格点是独立随机的，**上下层的缝就不会
 * 连成一条线**，一层漏掉的地方会被别的层补上。0.5 让格点在格内均匀分布（相当于把立方点阵
 * 打散成一团随机点云），把「沿格点对角线看」时才会出现的那种成片漏缝也一并消掉了 ——
 * 实测 0.3 时还有角度会漏 0.01%，0.5 时 16 个角度全为 0。
 */
const JITTER = 0.5;
/** 逐实例尺寸乘数范围（乘在基准边长上）：大小略有差异，画面才有层次。 */
const SCALE_MIN = 0.9;
const SCALE_MAX = 1.15;
/** 每实例绕自身 Z 轴的自转角范围（±这个值的一半），用来打散格点的规则感。 */
const SPIN_RANGE = 0.7;

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 instanceOffset;
layout(location = 2) in vec4 instanceColor;
layout(location = 3) in vec2 instanceRotation;
layout(location = 4) in vec3 normal;

layout(std140) uniform Uniforms {
  mat4 projectionView;
  float pointSize;
  vec3 cameraPosition;
} u;

out vec4 vColor;
out vec3 vNormal;
out vec3 vToCamera;

void main() {
  // 每实例绕自身 Z 轴转一个角度（把 sin / cos 打进顶点缓冲，省掉顶点着色器里的三角函数）。
  float sine = instanceRotation.x;
  float cosine = instanceRotation.y;
  // 顶点阵是 ±0.5 的立方体（见 buildBoxMesh(1)），所以顶点乘上 size 得到的边长正好是 size。
  vec2 corner = vec2(position.x * cosine - position.y * sine, position.x * sine + position.y * cosine);
  vNormal = vec3(normal.x * cosine - normal.y * sine, normal.x * sine + normal.y * cosine, normal.z);
  // 透视补偿：边长正比于到相机的距离 —— 投到屏幕上就是固定大小，缝不会随深度变大。
  // 距离在**物体空间**里量：绕 Y 轴旋转不改变距离，所以这个值不随转动变化。
  vec3 fromCamera = instanceOffset - u.cameraPosition;
  // 每实例尺寸借道 instanceColor.a（本来恒为 1、片元里丢掉）：存的是尺寸乘数。
  float size = u.pointSize * instanceColor.a * max(length(fromCamera), 0.001);
  vec3 world = vec3(corner, position.z) * size + instanceOffset;
  vToCamera = -fromCamera;
  vColor = vec4(instanceColor.rgb, 1.0);
  gl_Position = u.projectionView * vec4(world, 1.0);
}
`;

const FRAGMENT_GLSL = `
in vec4 vColor;
in vec3 vNormal;
in vec3 vToCamera;

layout(location = 0) out vec4 fragColor;

void main() {
  // 头灯式着色（光就是相机）：立方体三个可见面的法线不同 → 明暗不同，
  // 转动时每个面的明暗还会跟着变，一眼能看出是「立体的东西在转」。
  float ndl = max(dot(normalize(vNormal), normalize(vToCamera)), 0.0);
  fragColor = vec4(vColor.rgb * (0.35 + 0.65 * ndl), 1.0);
}
`;

const MODULE_WGSL = `
struct Uniforms {
  projectionView: mat4x4f,
  pointSize: f32,
  cameraPosition: vec3f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) instanceOffset: vec3f,
  @location(2) instanceColor: vec4f,
  @location(3) instanceRotation: vec2f,
  @location(4) normal: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) normal: vec3f,
  @location(2) toCamera: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let sine = v.instanceRotation.x;
  let cosine = v.instanceRotation.y;
  let corner = vec2f(v.position.x * cosine - v.position.y * sine, v.position.x * sine + v.position.y * cosine);
  let normal = vec3f(v.normal.x * cosine - v.normal.y * sine, v.normal.x * sine + v.normal.y * cosine, v.normal.z);
  let fromCamera = v.instanceOffset - u.cameraPosition;
  let size = u.pointSize * v.instanceColor.a * max(length(fromCamera), 0.001);
  let world = vec3f(corner, v.position.z) * size + v.instanceOffset;
  out.color = vec4f(v.instanceColor.rgb, 1.0);
  out.normal = normal;
  out.toCamera = -fromCamera;
  out.position = u.projectionView * vec4f(world, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let ndl = max(dot(normalize(in.normal), normalize(in.toCamera)), 0.0);
  return vec4f(in.color.rgb * (0.35 + 0.65 * ndl), 1.0);
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
  /** uniform 里的 `pointSize`：**距离 1** 处的盒边长（顶点着色器会乘上实际距离）。 */
  readonly sizeAtUnitDistance: number;
}

/**
 * 生成每实例数据：**球形的立体格点云**。
 *
 * ## 布局
 * 先把格点铺在一个立方点阵上（格距 1 格），再按到原点的距离**取最近的 `count` 个**，
 * 于是云的边界是球面、且实例数精确等于 `count`（不浪费、也不需要用「最后一个实例补洞」）。
 * 最后整体缩放到 {@link CLOUD_RADIUS}，并给每个格点加上 {@link JITTER} 的抖动。
 *
 * ## 为什么任意角度都不露清屏色
 * 四条一起保证的，缺一条都会在某个角度露出背景：
 *
 * 1. **云的轮廓盖住整块画布**：球的半径远大于「画布四角光线到球心」的最近距离（≈ 11.7）。
 * 2. **光线穿得够厚**：半径取到 16（相机到球心 16.62）时，每根画布光线都要横穿约 20 层格点，
 *    漏过去的概率是「每层漏一部分」连乘，层数一多就趋近 0。
 * 3. **每实例在屏幕上的大小固定**（透视补偿，见 {@link FOOTPRINT_FRACTION}）：缝不随深度变大。
 * 4. **格点在格内均匀随机**（{@link JITTER} = 0.5）：上下层的缝互不相关，不会连成一条线。
 *
 * 这四条是用一个光线投射模型（逐像素判断有没有打到任何实例盒）跑遍 16 个角度定下来的，
 * 再拿真实截图核对：0°…315° 每 45° 一测，两个后端、每个角度清屏色占比都是 0.00%。
 *
 * 每实例的 offset / color / 尺寸乘数 / 自转角照旧全部从顶点缓冲里读，draw call 仍是 1 次。
 */
function buildInstanceData(count: number): InstanceData {
  const offsets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const rotations = new Float32Array(count * 2);

  // 候选点阵的边长：球体积 ≈ count 个格点时球半径（格）是 cbrt(3 * count / (4π))，
  // 边长取 2 倍半径再补到奇数（保证原点正好是格点，实例 0 就落在云心）。
  const radiusInCells = Math.cbrt((3 * count) / (4 * Math.PI));
  const side = Math.max(1, 2 * Math.ceil(radiusInCells) + 1);
  const half = (side - 1) / 2;
  const candidates: { index: number; distanceSquared: number }[] = [];
  for (let z = 0; z < side; z++) {
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        const dx = x - half;
        const dy = y - half;
        const dz = z - half;
        candidates.push({ index: (z * side + y) * side + x, distanceSquared: dx * dx + dy * dy + dz * dz });
      }
    }
  }
  candidates.sort((left, right) => left.distanceSquared - right.distanceSquared);

  // 缩放到世界单位：让最外层格点正好落在 CLOUD_RADIUS 上（第 count 个候选点的半径即云半径）。
  const outerRadiusInCells = Math.sqrt(candidates[Math.min(count, candidates.length) - 1]!.distanceSquared);
  const cell = outerRadiusInCells > 0 ? CLOUD_RADIUS / outerRadiusInCells : 1;
  for (let i = 0; i < count; i++) {
    const candidate = candidates[i]!;
    const x = (candidate.index % side) - half;
    const y = (Math.floor(candidate.index / side) % side) - half;
    const z = Math.floor(candidate.index / (side * side)) - half;
    // 抖动单位是「格子」：同层的缝被推开，上下层的缝就不会连成一条线。
    offsets[i * 3] = (x + (hash(i, 11) - 0.5) * JITTER) * cell;
    offsets[i * 3 + 1] = (y + (hash(i, 12) - 0.5) * JITTER) * cell;
    offsets[i * 3 + 2] = (z + (hash(i, 13) - 0.5) * JITTER) * cell;
    const color = PALETTE[i % PALETTE.length]!;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    // 每实例尺寸借道 alpha：存相对基准边长的乘数（片元里丢掉 alpha）。
    colors[i * 4 + 3] = SCALE_MIN + hash(i, 19) * (SCALE_MAX - SCALE_MIN);
    // 把 sin / cos 打进顶点缓冲，顶点着色器里就不用再做三角函数。
    const spin = (hash(i, 17) - 0.5) * SPIN_RANGE;
    rotations[i * 2] = Math.sin(spin);
    rotations[i * 2 + 1] = Math.cos(spin);
  }
  // 第 0 个实例（点阵原点）固定在云心、尺寸取基准值：离屏自检的中心像素一定有东西。
  offsets[0] = 0;
  offsets[1] = 0;
  offsets[2] = 0;
  colors[3] = 1;

  // 顶点着色器里 `size = pointSize * 距离`，所以「距离 1 处盒的边长」就是让屏幕尺寸等于
  // FOOTPRINT_FRACTION × 画面高度的那个值：投影后边长 = pointSize / (2 * tan(FOV/2)) × 高度。
  const sizeAtUnitDistance = FOOTPRINT_FRACTION * 2 * Math.tan(FIELD_OF_VIEW / 2);
  return { offsets, colors, rotations, sizeAtUnitDistance };
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  const spinning = query.get('spin') !== '0';
  // `?angle=<弧度>`：把云固定在某个角度（截图比对用；转弯一整圈时逐个角度抓图最稳）。
  const angleParam = Number(query.get('angle'));
  const fixedAngle = query.has('angle') && Number.isFinite(angleParam) ? angleParam : null;
  const countParam = Number(query.get('count'));
  const count =
    Number.isInteger(countParam) && countParam > 0 ? Math.min(countParam, MAX_COUNT) : DEFAULT_COUNT;

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-instancing');
  const { device, context } = example;

  /* ---- 基础几何体 + 每实例数据 ---------------------------------------------------------------- */
  // 立方体取边长 1（顶点在 ±0.5），于是顶点着色器里「顶点 × size」得到的**世界边长正好是 size**。
  const mesh = buildBoxMesh(1);
  const positionBuffer = device.createBuffer({
    label: 'instancing:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const normalBuffer = device.createBuffer({
    label: 'instancing:normals',
    size: mesh.normals.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(normalBuffer, 0, mesh.normals);
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

  /* ---- uniform：projectionView(64) + pointSize(4) + 填充(12) + cameraPosition(12) + 填充(4) -- */
  // 偏移约定（std140 / WGSL uniform 都是这一套）：projectionView 在 0，pointSize 在 64，
  // cameraPosition 是 vec3、按 16 字节对齐所以落在 80。
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  uniformData[16] = instanceData.sizeAtUnitDistance;
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();
  const model = mat4.create();
  const inverseModel = mat4.create();
  const camera = vec3.fromValues(...CAMERA_POSITION);
  const cameraInObjectSpace = vec3.create();

  const updateUniforms = (angle: number): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    mat4.perspective(projectionGL, FIELD_OF_VIEW, aspect, 0.1, 200);
    mat4.perspectiveZO(projectionZO, FIELD_OF_VIEW, aspect, 0.1, 200);
    // 相机与最初那版一致：斜上方俯视原点。
    mat4.lookAt(view, camera, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    // 整个云绕竖直轴匀速转 —— 这就是最初那版的动效。
    mat4.identity(model);
    mat4.rotateY(model, model, angle);
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);
    mat4.multiply(viewProjection, viewProjection, model);
    uniformData.set(viewProjection, 0);
    // 顶点着色器在物体空间里量「实例到相机的距离」，所以把相机反变换回物体空间。
    mat4.invert(inverseModel, model);
    vec3.transformMat4(cameraInObjectSpace, camera, inverseModel);
    uniformData[20] = cameraInObjectSpace[0]!;
    uniformData[21] = cameraInObjectSpace[1]!;
    uniformData[22] = cameraInObjectSpace[2]!;
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
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 4, offset: 0, format: 'float32x3' }],
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
    // 立方体是凸的、绕序是逆时针，背面剔除省掉一半片元；深度测试让「里面的实例」被挡住，
    // 于是画面读起来是「一坨立体的小方块」，而不是一层层盖上去的薄片。
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const drawInstances = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, uniforms.bindGroup);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    pass.setVertexBuffer(1, normalBuffer, 0, normalBuffer.size);
    // 实例缓冲的 size 必须覆盖「实例数 × 步长」。
    pass.setVertexBuffer(2, offsetBuffer, 0, count * 12);
    pass.setVertexBuffer(3, colorBuffer, 0, count * 16);
    pass.setVertexBuffer(4, rotationBuffer, 0, count * 8);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    pass.drawIndexed({ indexCount: mesh.indices.length, instanceCount: count });
  };

  const drawToCanvas = (): void => {
    context.resize();
    updateUniforms(angle);
    // 走 `createPassDescriptor()`：两个后端的画布通道都带上深度附件（漏掉它深度测试会被静默关掉）。
    const descriptor = context.createPassDescriptor({
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: CLEAR,
      depthLoadOp: 'clear',
      depthClearValue: 1,
    });
    const encoder = device.createCommandEncoder({ label: 'instancing:frame' });
    const pass = encoder.beginRenderPass({
      label: 'instancing:pass',
      colorAttachments: descriptor.colorAttachments,
      depthStencilAttachment: descriptor.depthStencilAttachment,
    });
    drawInstances(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  // `?angle=` 给了就定在那个角度（截图比对用），否则从 START_ANGLE 开始按 SPIN_SPEED 匀速转。
  let angle = fixedAngle ?? START_ANGLE;
  drawToCanvas();
  setData('instancingResult', 'ok');
  setData('instancingCount', String(count));
  setData('instancingDrawCalls', '1');
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　${count} 个实例 = 1 次 draw call　` +
    `每个实例 12 个三角形`;

  startFrameLoop({
    draw: (delta) => {
      if (fixedAngle === null && spinning) angle += delta * SPIN_SPEED;
      drawToCanvas();
    },
    onFps: (fps) => {
      // 把当前角度写进 data-*：抓图脚本据此知道这一帧转到了哪个角度。
      setData('instancingAngle', angle.toFixed(3));
      statsEl.textContent =
        `${context.width}×${context.height}　${fps.toFixed(0)} FPS　实例 ${count}　` +
        `三角形 ${count * 12}　draw calls 1`;
    },
  });

  if (query.get('verify') === '1') {
    // 每实例颜色不同：只要画面出现多种颜色，就说明实例属性真的按实例步进了。
    const stats = await verifyOffscreen(device, 96, 96, CLEAR, (pass) => {
      updateUniforms(angle);
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
