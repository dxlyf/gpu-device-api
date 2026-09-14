/**
 * 批量绘制示例：**N 次 draw call，每个物体有自己的 model 与 uniform**。
 *
 * 与「实例化」的分工：
 * - 实例化（`instancing.html`）：同一个网格、1 次 draw call，差异全在顶点缓冲里，实例数可以上万；
 * - 批量（本页）：每个物体各一次 draw call，可以给每个物体不同的 `model` 与任意 uniform
 *   （这里只改 `baseColor`），全部共用**同一条管线**（所以管线切换次数恒为 1）。
 *
 * 这条路径正好压在 uniform arena 的要害上：每次 draw 的 uniform 必须落在自己那段缓冲区里，
 * 否则（WebGPU 的写入是提交时生效）所有物体会一起变成最后一个物体的颜色。
 * 因此本页的自检除了「有没有画出东西」，还会统计**画面上出现过多少种颜色** ——
 * 颜色只剩一种，通常就意味着每 draw 的 uniform 串了。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&side=5&spin=0&verify=1`
 * 加 `verify=1` 会额外做一次离屏像素自检，把结果写在 `<html>` 的 `data-batch-*` 上。
 */

import { OrbitControls, PerspectiveCamera, Renderer, materials, shapes } from '../src/gfx/index.js';
import { mat4, vec3 } from '../src/utils/math/index.js';
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

const MAX_SIDE = 10;
const DEFAULT_SIDE = 5;
const sideParam = Number(query.get('side'));
let side = Number.isInteger(sideParam) && sideParam > 0 ? Math.min(sideParam, MAX_SIDE) : DEFAULT_SIDE;
let spinning = query.get('spin') !== '0';

const BOX_SIZE = 0.8;
const SPACING = 1.15;
const CLEAR_COLOR = '#0b0e13';
/** 与 `CLEAR_COLOR` 相同的 clear 值，自检时用来判定「哪些像素不是背景」。 */
const CLEAR_RGBA = [0.043, 0.055, 0.075, 1] as const;

const canvas = document.getElementById('view') as HTMLCanvasElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;
const sideInput = document.getElementById('side') as HTMLInputElement;
const sideLabel = document.getElementById('side-value') as HTMLElement;
const spinInput = document.getElementById('spin') as HTMLInputElement;

/* ------------------------------------------------------------------------------------------------ */
/* 模块级状态                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

let renderer: Renderer | null = null;
let geometry: Geometry | null = null;
let material: Material | null = null;
let controls: OrbitControls | null = null;
let angle = 0.35;
let lastTime = 0;
let framesInWindow = 0;
let fpsWindowStart = 0;

interface BatchItem {
  /** 该物体在「批」里的位置（不含整批旋转）。 */
  readonly localModel: Float32Array;
  /** 该物体本次 draw 的 uniform（`baseColor`）。 */
  readonly color: readonly [number, number, number, number];
  /** 每帧复用的矩阵，避免每帧分配。 */
  readonly worldModel: Float32Array;
}

let items: readonly BatchItem[] = [];

/** 把自检结果写进 `<html data-batch-...>`，便于无头浏览器抓取。 */
function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

/* ------------------------------------------------------------------------------------------------ */
/* 批的内容：side³ 个盒子，颜色按格点轮换调色板                                                          */
/* ------------------------------------------------------------------------------------------------ */

const PALETTE: readonly (readonly [number, number, number, number])[] = [
  [0.98, 0.42, 0.32, 1],
  [0.42, 0.78, 0.98, 1],
  [0.52, 0.92, 0.55, 1],
  [0.98, 0.82, 0.36, 1],
  [0.82, 0.55, 0.98, 1],
  [0.98, 0.55, 0.78, 1],
  [0.45, 0.9, 0.85, 1],
  [0.92, 0.92, 0.92, 1],
];

function buildItems(gridSide: number): readonly BatchItem[] {
  const half = (gridSide - 1) / 2;
  const built: BatchItem[] = [];
  for (let z = 0; z < gridSide; z++) {
    for (let y = 0; y < gridSide; y++) {
      for (let x = 0; x < gridSide; x++) {
        const localModel = mat4.fromTranslation(
          mat4.create(),
          vec3.fromValues((x - half) * SPACING, (y - half) * SPACING, (z - half) * SPACING),
        );
        built.push({
          localModel,
          color: PALETTE[(x + y + z) % PALETTE.length]!,
          worldModel: mat4.create(),
        });
      }
    }
  }
  return built;
}

/* ------------------------------------------------------------------------------------------------ */
/* 场景                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** 把「批」画一遍：N 次 `draw()`，各自带自己的 model 与 uniform。 */
function drawBatch(): void {
  const active = renderer;
  const activeGeometry = geometry;
  if (!active || !activeGeometry || !material) return;

  const rotation = mat4.create();
  mat4.rotateY(rotation, rotation, angle);

  active.beginFrame({ color: CLEAR_COLOR });
  active.setMaterial(material);
  for (const item of items) {
    mat4.multiply(item.worldModel, rotation, item.localModel);
    active.draw(activeGeometry, { model: item.worldModel, uniforms: { baseColor: item.color } });
  }
  active.endFrame();
}

function frame(time: number): void {
  const delta = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  if (spinning) angle += delta * 0.25;

  const active = renderer;
  if (!active) return;
  active.resize();
  controls?.update();
  drawBatch();

  const stats = active.stats;
  framesInWindow += 1;
  if (time - fpsWindowStart > 500) {
    const fps = (framesInWindow * 1000) / Math.max(time - fpsWindowStart, 1);
    // 「管线切换 1」正是批量的价值：N 次 draw call 共用一条管线。
    statsEl.textContent =
      `draw calls ${stats.drawCalls}　三角形 ${stats.triangles}　管线切换 ${stats.pipelineSwitches}　` +
      `${fps.toFixed(0)} FPS　${active.width}×${active.height}`;
    framesInWindow = 0;
    fpsWindowStart = time;
  }
  setData('batchDrawcalls', String(stats.drawCalls));
  setData('batchPipelineSwitches', String(stats.pipelineSwitches));
  requestAnimationFrame(frame);
}

function describeScene(active: Renderer): string {
  return (
    `后端：${active.backend}　${items.length} 个物体 = ${items.length} 次 draw call　` +
    '共用 1 条材质 / 1 条管线'
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* 离屏像素自检                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

async function runVerify(): Promise<void> {
  try {
    const stats: PixelStats = await verifyOffscreen(renderer!, 128, 128, CLEAR_RGBA, () => {
      renderer!.setMaterial(material!);
      const rotation = mat4.create();
      mat4.rotateY(rotation, rotation, angle);
      for (const item of items) {
        mat4.multiply(item.worldModel, rotation, item.localModel);
        renderer!.draw(geometry!, { model: item.worldModel, uniforms: { baseColor: item.color } });
      }
    });
    setData('batchPixel', stats.center.join(','));
    setData('batchLitPixels', String(stats.litPixels));
    setData('batchDistinct', String(stats.distinctColors));
    // 批量绘制正常的判据：有像素被光栅化，并且画面上出现了**多种**颜色
    //（只剩一种颜色通常意味着每次 draw 的 uniform 没落到各自的 arena 区间上）。
    setData('batchLit', String(stats.litPixels > 0 && stats.distinctColors >= 2));
  } catch (error: unknown) {
    setData('batchError', (error as Error).message);
    setData('batchLit', 'false');
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
    position: [4.2, 3.4, 7.4],
    target: [0, 0, 0],
    fov: 45,
    near: 0.1,
    far: 200,
  });
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  created.setCamera(camera);

  // 一次材质创建 → 一条管线，之后 N 次 draw 都复用它。
  material = created.createMaterial(materials.unlit());
  geometry = created.createGeometry({
    label: 'batch-box',
    ...shapes.createBox({ width: BOX_SIZE, height: BOX_SIZE, depth: BOX_SIZE }),
  });
  items = buildItems(side);

  sideInput.value = String(side);
  sideLabel.textContent = String(side);
  spinInput.checked = spinning;
  statusEl.textContent = describeScene(created);
  setData('batchBackend', created.backend);
  setData('batchItems', String(items.length));
  setData('batchResult', 'ok');

  // 先画一帧，再（可选）离屏自检，最后进 rAF 循环。
  drawBatch();
  if (verifyRequested) await runVerify();
  requestAnimationFrame(frame);
}

sideInput.addEventListener('input', () => {
  const next = Math.max(1, Math.min(Number(sideInput.value) || 1, MAX_SIDE));
  sideLabel.textContent = String(next);
  if (next === side || !renderer) return;
  side = next;
  items = buildItems(side);
  setData('batchItems', String(items.length));
  statusEl.textContent = describeScene(renderer);
});

spinInput.addEventListener('change', () => {
  spinning = spinInput.checked;
});

main().catch((error: unknown) => {
  statusEl.textContent = `启动失败：${(error as Error).message}`;
  statusEl.className = 'error';
  setData('batchError', (error as Error).message);
  setData('batchResult', 'fail');
});
