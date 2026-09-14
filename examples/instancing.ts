/**
 * 实例化示例：**一个几何体、一次 draw call、N 个实例**。
 *
 * 每个实例的位置、颜色、缩放在**顶点缓冲**里每实例读一次（`stepMode: 'instance'`），
 * 而不是靠 N 次 draw call 或 uniform 数组。这就是「实例化」相比「批量」的价值：
 * draw call 恒定，实例数可以上万。
 *
 * 三个关键点：
 * 1. 数据侧：`Geometry` 的属性写 `{ data, format, perInstance: true }`；
 * 2. 材质侧：`attributes` 里对应写 `{ format, stepMode: 'instance' }`（两边必须一致，
 *    不一致会在 draw 时报错，而不是画出乱码）；
 * 3. 绘制侧：`renderer.drawInstanced(geometry, count, { model })`，`model` 作用于整批实例。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&count=4096&spin=0&verify=1`
 * 加 `verify=1` 会额外做一次离屏像素自检，把结果写在 `<html>` 的 `data-instancing-*` 上。
 */

import { OrbitControls, PerspectiveCamera, Renderer, shapes } from '../src/gfx/index.js';
import { defineMaterial } from '../src/gfx/Material.js';
import { mat4 } from '../src/utils/math/index.js';
import { verifyOffscreen, type PixelStats } from './offscreen-verify.js';
import type { Geometry } from '../src/gfx/Geometry.js';
import type { Material } from '../src/gfx/Material.js';

/* ------------------------------------------------------------------------------------------------ */
/* 查询参数与页面元素                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const query = new URLSearchParams(location.search);
const backendParam = query.get('backend');
const backend: 'auto' | 'webgl2' | 'webgpu' =
  backendParam === 'webgl2' || backendParam === 'webgpu' ? backendParam : 'auto';
const verifyRequested = query.get('verify') === '1';

const MAX_COUNT = 20000;
const DEFAULT_COUNT = 4096;
const countParam = Number(query.get('count'));
let count = Number.isInteger(countParam) && countParam > 0 ? Math.min(countParam, MAX_COUNT) : DEFAULT_COUNT;
let spinning = query.get('spin') !== '0';

/** 实例云的整体尺寸（世界单位）。 */
const SPREAD = 6;
const CLEAR_COLOR = '#0b0e13';
/** 与 `CLEAR_COLOR` 相同的 clear 值，自检时用来判定「哪些像素不是背景」。 */
const CLEAR_RGBA = [0.043, 0.055, 0.075, 1] as const;

const canvas = document.getElementById('view') as HTMLCanvasElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;
const countInput = document.getElementById('count') as HTMLInputElement;
const countLabel = document.getElementById('count-value') as HTMLElement;
const spinInput = document.getElementById('spin') as HTMLInputElement;

/* ------------------------------------------------------------------------------------------------ */
/* 模块级状态（rAF 循环、交互回调、自检都要用）                                                          */
/* ------------------------------------------------------------------------------------------------ */

let renderer: Renderer | null = null;
let geometry: Geometry | null = null;
let material: Material | null = null;
let controls: OrbitControls | null = null;
let angle = 0.6;
let lastTime = 0;
let framesInWindow = 0;
let fpsWindowStart = 0;

/** 把自检结果写进 `<html data-instancing-...>`，便于无头浏览器抓取。 */
function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

/* ------------------------------------------------------------------------------------------------ */
/* 实例数据：一份确定性的伪随机分布                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** 整数哈希 → [0, 1)，用来生成确定性的「随机」布局（每次刷新画面一致，便于对比与自检）。 */
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
  readonly scales: Float32Array;
}

/** 生成 `instanceCount` 份实例数据：带抖动的立方网格，颜色按索引轮换调色板。 */
function buildInstanceData(instanceCount: number): InstanceData {
  const offsets = new Float32Array(instanceCount * 3);
  const colors = new Float32Array(instanceCount * 4);
  const scales = new Float32Array(instanceCount);
  const side = Math.max(1, Math.ceil(Math.cbrt(instanceCount)));
  const cell = SPREAD / side;

  for (let i = 0; i < instanceCount; i++) {
    const ix = i % side;
    const iy = Math.floor(i / side) % side;
    const iz = Math.floor(i / (side * side));

    let x = ((ix + 0.5) / side - 0.5 + (hash(i, 11) - 0.5) * 0.6) * SPREAD;
    let y = ((iy + 0.5) / side - 0.5 + (hash(i, 12) - 0.5) * 0.6) * SPREAD;
    let z = ((iz + 0.5) / side - 0.5 + (hash(i, 13) - 0.5) * 0.6) * SPREAD;
    let scale = cell * (0.75 + hash(i, 14) * 0.5);
    let color = PALETTE[i % PALETTE.length]!;

    if (i === 0) {
      // 第 0 个实例固定在原点：画面中心一定被覆盖，离屏自检也就有了确定的锚点。
      x = 0;
      y = 0;
      z = 0;
      scale = cell * 1.1;
      color = PALETTE[0]!;
    }

    offsets[i * 3] = x;
    offsets[i * 3 + 1] = y;
    offsets[i * 3 + 2] = z;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    colors[i * 4 + 3] = 1;
    scales[i] = scale;
  }

  return { offsets, colors, scales };
}

/* ------------------------------------------------------------------------------------------------ */
/* 材质：实例属性就是普通的 in 属性，只是每实例前进一次                                                   */
/* ------------------------------------------------------------------------------------------------ */

const instancedMaterial = defineMaterial({
  name: 'instanced-lambert',
  attributes: {
    // 按顶点步进
    position: 'float32x3',
    normal: 'float32x3',
    // 按实例步进：每个实例读一次
    instanceOffset: { format: 'float32x3', stepMode: 'instance' },
    instanceColor: { format: 'float32x4', stepMode: 'instance' },
    instanceScale: { format: 'float32', stepMode: 'instance' },
  },
  uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f', lightDirection: 'vec3f' },
  defaults: { lightDirection: [0.42, 0.86, 0.52] },
  glsl: {
    vs: `out vec3 vNormal;
out vec4 vColor;
void main() {
  vec3 worldPosition = position * instanceScale + instanceOffset;
  vNormal = mat3(u.model) * normal;
  vColor = instanceColor;
  gl_Position = u.projectionView * u.model * vec4(worldPosition, 1.0);
}`,
    fs: `in vec3 vNormal;
in vec4 vColor;
void main() {
  float ndl = max(dot(normalize(vNormal), normalize(-u.lightDirection)), 0.0);
  fragColor = vec4(vColor.rgb * (0.28 + 0.72 * ndl), vColor.a);
}`,
  },
  wgsl: `struct VertexOutput {
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
  return vec4f(in.color.rgb * (0.28 + 0.72 * ndl), in.color.a);
}`,
});

/* ------------------------------------------------------------------------------------------------ */
/* 场景                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** 按当前实例数重建几何体（实例数据变了，顶点缓冲必须重新上传）。 */
function buildGeometry(instanceCount: number): Geometry {
  const active = renderer;
  if (!active) throw new Error('[gpu-device-api] 示例：renderer 尚未创建。');
  geometry?.destroy();
  const box = shapes.createBox({ width: 1, height: 1, depth: 1 });
  const data = buildInstanceData(instanceCount);
  return active.createGeometry({
    label: `instanced-box-${instanceCount}`,
    position: box.position,
    normal: box.normal,
    indices: box.indices,
    attributes: {
      instanceOffset: { data: data.offsets, format: 'float32x3', perInstance: true },
      instanceColor: { data: data.colors, format: 'float32x4', perInstance: true },
      instanceScale: { data: data.scales, format: 'float32', perInstance: true },
    },
  });
}

/** 整批实例共用的模型矩阵：只做刚体旋转，所以着色器里可以直接用 mat3(model) 变换法线。 */
function cloudModel(rotation: number): Float32Array {
  const model = mat4.create();
  mat4.rotateX(model, model, -0.18);
  mat4.rotateY(model, model, rotation);
  return model;
}

function drawInstances(): void {
  const active = renderer;
  const activeGeometry = geometry;
  if (!active || !activeGeometry || !material) return;
  active.beginFrame({ color: CLEAR_COLOR });
  active.setMaterial(material);
  active.drawInstanced(activeGeometry, count, { model: cloudModel(angle) });
  active.endFrame();
}

function frame(time: number): void {
  const delta = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  if (spinning) angle += delta * 0.35;

  const active = renderer;
  if (!active) return;
  active.resize();
  controls?.update();
  drawInstances();

  const stats = active.stats;
  framesInWindow += 1;
  if (time - fpsWindowStart > 500) {
    const fps = (framesInWindow * 1000) / Math.max(time - fpsWindowStart, 1);
    statsEl.textContent =
      `draw calls ${stats.drawCalls}　实例 ${stats.instances}　三角形 ${stats.triangles}　` +
      `${fps.toFixed(0)} FPS　${active.width}×${active.height}`;
    framesInWindow = 0;
    fpsWindowStart = time;
  }
  setData('instancingDrawcalls', String(stats.drawCalls));
  setData('instancingInstances', String(stats.instances));
  requestAnimationFrame(frame);
}

function describeScene(active: Renderer): string {
  const activeGeometry = geometry;
  return (
    `后端：${active.backend}　几何体 ${activeGeometry?.vertexCount ?? 0} 顶点/` +
    `${activeGeometry?.indexCount ?? 0} 索引　${count} 个实例 = 1 次 draw call`
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* 离屏像素自检                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

async function runVerify(): Promise<void> {
  try {
    const stats: PixelStats = await verifyOffscreen(renderer!, 64, 64, CLEAR_RGBA, () => {
      renderer!.setMaterial(material!);
      renderer!.drawInstanced(geometry!, count, { model: cloudModel(angle) });
    });
    setData('instancingPixel', stats.center.join(','));
    setData('instancingLitPixels', String(stats.litPixels));
    setData('instancingDistinct', String(stats.distinctColors));
    // 实例化正常的判据：确实有像素被光栅化，并且同时出现了多种实例颜色
    //（只有一种颜色往往意味着实例属性没生效，所有实例都读到了同一份数据）。
    setData('instancingLit', String(stats.litPixels > 0 && stats.distinctColors >= 2));
  } catch (error: unknown) {
    setData('instancingError', (error as Error).message);
    setData('instancingLit', 'false');
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* 启动与交互                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

async function main(): Promise<void> {
  const created = await Renderer.create({
    canvas,
    backend,
    antialias: true,
    depth: true,
    clearColor: CLEAR_COLOR,
  });
  renderer = created;

  const camera = new PerspectiveCamera({
    position: [0, 3.2, 9.6],
    target: [0, 0, 0],
    fov: 45,
    near: 0.1,
    far: 200,
  });
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  created.setCamera(camera);

  material = created.createMaterial(instancedMaterial);
  geometry = buildGeometry(count);

  countInput.value = String(count);
  countLabel.textContent = String(count);
  spinInput.checked = spinning;
  statusEl.textContent = describeScene(created);
  setData('instancingBackend', created.backend);
  setData('instancingCount', String(count));
  setData('instancingResult', 'ok');

  // 先画一帧，再（可选）离屏自检，最后进 rAF 循环。
  drawInstances();
  if (verifyRequested) await runVerify();
  requestAnimationFrame(frame);
}

countInput.addEventListener('input', () => {
  const next = Math.max(1, Math.min(Number(countInput.value) || 1, MAX_COUNT));
  countLabel.textContent = String(next);
  if (next === count || !renderer) return;
  count = next;
  geometry = buildGeometry(count);
  setData('instancingCount', String(count));
  statusEl.textContent = describeScene(renderer);
});

spinInput.addEventListener('change', () => {
  spinning = spinInput.checked;
});

main().catch((error: unknown) => {
  statusEl.textContent = `启动失败：${(error as Error).message}`;
  statusEl.className = 'error';
  setData('instancingError', (error as Error).message);
  setData('instancingResult', 'fail');
});
