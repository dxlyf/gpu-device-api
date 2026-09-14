/**
 * gfx 层性能基准：**只用 `src/gfx` 便捷层**（矩阵来自 `src/utils/math`），一行 core 代码都不写。
 *
 * ## 为什么要有这一页（和 `examples/benchmark.ts` 的分工）
 *
 * `benchmark.ts` 测的是 core 层的吞吐：着色器、顶点/实例缓冲、uniform 打包、bind group layout、
 * 管线、command encoder 与通道全部手写。它测到的 CPU 时间几乎只剩「录制命令」本身，
 * **看不到便捷层的开销** —— 而日常代码走的是便捷层。
 *
 * 本页测的是 `src/gfx` 的**每次 draw 的 CPU 代价**。每个物体一次 `renderer.draw()`，
 * 每次 draw 都要经过便捷层替使用者做的事：
 * - 相机 uniform（`projectionView`）从相机写进 arena；
 * - 该物体自己的 `model`；
 * - `lambert` 声明了 `normalMatrix`，于是每 draw 一次 `mat3` 逆转置；
 * - 本次 draw 独占的 uniform 段（uniform arena + 动态偏移）；
 * - 每次 draw 一次 `setBindGroup`（带动态偏移的数组）；
 * - 按材质属性逐个绑定顶点缓冲（`lambert` 有 position / normal / uv，即每 draw 3 次 `setVertexBuffer`）。
 *
 * 两页共用同一套分档（2000 / 5000 / 10000 / 20000 / 40000）与同一个「每物体一次 draw call」的形状，
 * 所以 `gfxBenchmarkResults` 与 `benchmarkResults` 里同档的 CPU 帧耗时**可以直接相减**，
 * 差值就是便捷层的净开销。
 *
 * ## 计时口径（与 `benchmark.ts` 的关键差别）
 *
 * - 主角是 `frame=`：`beginFrame → 逐 draw → endFrame` 的 **CPU 时间**（录制 + 提交）；
 * - 帧与帧之间只 `await device.queue.onSubmittedWorkDone()`（WebGPU 是队列排空，WebGL2 是
 *   `gl.finish()`），**故意不做** `benchmark.ts` 里那个 1×1 `readPixels` 的强制同步：
 *   那个技巧存在的意义是把 GPU 时间算进「帧耗时」，代价是每帧都把 GPU 串行化，
 *   驱动排队的效应会混进数字里。本页要的是 CPU 每 draw 成本，所以不同步 GPU，
 *   另外给一列 `sync=`（含等待后端）当参考 —— 它只说明这一档的 GPU 负担有多重。
 * - 几何体、`model` 矩阵、颜色在整个测量过程中不变（只创建/预计算一次），
 *   避免把上传与分配的噪声算进来；每档先空跑几帧热身（arena 扩容也发生在热身的头一帧里）。
 *
 * ## 本页自带结论
 *
 * 跑完把所有分档写进 `<html data-gfx-benchmark-*>`（键名与 `benchmark.ts` 的 `data-benchmark-*`
 * 一一对应），全部测完再写 `gfxBenchmarkResult = ok`，之后页面**自己停下来**（不再排 rAF 循环）。
 * 每档还会核对 `renderer.stats`（drawCalls 必须等于物体数），用来证明这些 draw 真的发生了。
 *
 * ## 运行
 *
 * ```
 * pnpm dev
 * # 浏览器打开 http://localhost:5199/examples/gfx-benchmark.html?backend=webgl2&counts=2000,5000
 * ```
 *
 * 查询参数（解析方式与 `benchmark.ts` 一致）：
 * `?backend=webgl2|webgpu|auto&counts=2000,5000&frames=10`
 */

import { PerspectiveCamera, Renderer, materials, shapes } from '../src/gfx/index.js';
import { mat4, vec3 } from '../src/utils/math/index.js';
import type { Geometry } from '../src/gfx/Geometry.js';
import type { Material } from '../src/gfx/Material.js';

/* ------------------------------------------------------------------------------------------------ */
/* 配置                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const DEFAULT_COUNTS: readonly number[] = [2000, 5000, 10000, 20000, 40000];
const MAX_COUNT = 40000;
const DEFAULT_FRAMES = 10;
/** 单档最多测这么多帧（大档还会再降，见 {@link framesForCount}）。 */
const MAX_MEASURED_FRAMES = 10;
/**
 * 探测帧超过它就跳过该档（毫秒）：逐 draw 的 4 万档在软件光栅化下可能真的很慢，别把页面钉死。
 *
 * 定在 8 秒而不是 core 基准的 500ms：那一页的 draws 模式每帧只写 3 个实例缓冲 + 1 次 draw，
 * 本页每次 draw 还要走 uniform arena / 法线矩阵 / 3 次 setVertexBuffer，本来就要慢一个量级；
 * 阈值只用来拦住「真的会挂住页面」的档位，正常 GPU 上永远碰不到。
 */
const SLOW_FRAME_LIMIT_MS = 8000;
/** 与 `benchmark.ts` 相同的清屏色，方便两页对照。 */
const CLEAR_COLOR = '#0b0e13';
/** 世界空间的立方体边长；与 core 基准共用同一块空间，方便横向对比。 */
const SPREAD = 10;
/** `shapes.createBox` 三个分段都为 1 时是 12 个三角形。 */
const TRIANGLES_PER_BOX = 12;
/** 最大档的格点边长；各档共用同一个盒子，所以档与档之间只差 draw 次数。 */
const GRID_SIDE = Math.max(1, Math.ceil(Math.cbrt(MAX_COUNT)));
const BOX_SIZE = (SPREAD / GRID_SIDE) * 0.9;

const query = new URLSearchParams(location.search);
const backendParam = query.get('backend');
const backend: 'auto' | 'webgl2' | 'webgpu' =
  backendParam === 'webgl2' || backendParam === 'webgpu' ? backendParam : 'auto';
let framesToMeasure = DEFAULT_FRAMES;
const framesParam = query.get('frames');
if (framesParam !== null) {
  // 注意不能直接 `Number(query.get('frames'))`：参数缺席时 `Number(null)` 是 0（有限数），
  // 会被 clamp 到下限 1 —— 那等于「没写 frames 就只测 1 帧」。
  framesToMeasure = clampInt(Number(framesParam), DEFAULT_FRAMES, 1, 200);
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
const framesInput = document.getElementById('frames') as HTMLInputElement;
const rerunButton = document.getElementById('rerun') as HTMLButtonElement;

function clampInt(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.trunc(value), max));
}

/** 把结论写进 `<html data-...>`，键名与 `benchmark.ts` 的 `data-benchmark-*` 保持同一套风格。 */
function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

/* ------------------------------------------------------------------------------------------------ */
/* 物体摆放：确定性伪随机位置（刷新后画面一致）                                                            */
/* ------------------------------------------------------------------------------------------------ */

function hash(index: number, seed: number): number {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(seed + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000;
}

const PALETTE: readonly (readonly [number, number, number, number])[] = [
  [0.98, 0.62, 0.25, 1],
  [0.35, 0.72, 0.98, 1],
  [0.55, 0.92, 0.55, 1],
  [0.95, 0.42, 0.55, 1],
  [0.78, 0.6, 0.98, 1],
  [0.98, 0.9, 0.45, 1],
];

interface Placement {
  /** 该物体自己的 `model` 矩阵：只含平移，位置来自确定性哈希。 */
  readonly model: Float32Array;
  /** 该物体本次 draw 独占的 uniform（`baseColor`）。 */
  readonly color: readonly [number, number, number, number];
}

/** 按最大档一次性算好所有摆放：测量期间不再分配矩阵。 */
function buildPlacements(): readonly Placement[] {
  const built: Placement[] = [];
  for (let index = 0; index < MAX_COUNT; index++) {
    const ix = index % GRID_SIDE;
    const iy = Math.floor(index / GRID_SIDE) % GRID_SIDE;
    const iz = Math.floor(index / (GRID_SIDE * GRID_SIDE));
    const x = ((ix + 0.5) / GRID_SIDE - 0.5 + (hash(index, 11) - 0.5) * 0.6) * SPREAD;
    const y = ((iy + 0.5) / GRID_SIDE - 0.5 + (hash(index, 12) - 0.5) * 0.6) * SPREAD;
    const z = ((iz + 0.5) / GRID_SIDE - 0.5 + (hash(index, 13) - 0.5) * 0.6) * SPREAD;
    built.push({
      model: mat4.fromTranslation(mat4.create(), vec3.fromValues(x, y, z)),
      color: PALETTE[index % PALETTE.length]!,
    });
  }
  return built;
}

/* ------------------------------------------------------------------------------------------------ */
/* 场景：一个渲染器 + 一个相机 + 一份几何 + 一条材质                                                       */
/* ------------------------------------------------------------------------------------------------ */

interface Scene {
  readonly renderer: Renderer;
  readonly geometry: Geometry;
  readonly material: Material;
  readonly placements: readonly Placement[];
}

let scene: Scene | null = null;
const reportedErrors: string[] = [];

async function createScene(): Promise<Scene> {
  const renderer = await Renderer.create({
    canvas,
    backend,
    // 本页量 CPU 每 draw 成本：关掉 MSAA，免得 GPU 的填充/解析时间主导整页耗时。
    antialias: false,
    depth: true,
    clearColor: CLEAR_COLOR,
  });

  renderer.device.onError((error) => {
    reportedErrors.push(error.message);
    setData('gfxBenchmarkErrors', String(reportedErrors.length));
    // 只留第一条原文（压成单行，方便无头抓取）：数字有效但设备在报错时，这一条是唯一的线索。
    if (reportedErrors.length === 1) {
      setData('gfxBenchmarkFirstError', error.message.replace(/\s+/g, ' ').trim());
    }
  });

  // 相机与 core 基准同一个视点/视场角。
  const camera = new PerspectiveCamera({
    position: [0, 7, 20],
    target: [0, 0, 0],
    fov: 45,
    near: 0.1,
    far: 200,
  });
  renderer.setCamera(camera);

  // 一份几何 + 一条材质，全部 draw 共用；`lambert` 带 normalMatrix 与 3 个属性，
  // 正好覆盖便捷层每 draw 的开销（法线矩阵、3 次 setVertexBuffer）。
  const geometry = renderer.createGeometry({
    label: 'gfx-bench-box',
    ...shapes.createBox({ width: BOX_SIZE, height: BOX_SIZE, depth: BOX_SIZE }),
  });
  const material = renderer.createMaterial(materials.lambert({ color: [1, 1, 1, 1] }));

  return { renderer, geometry, material, placements: buildPlacements() };
}

/* ------------------------------------------------------------------------------------------------ */
/* 一帧的绘制与「等后端做完」                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** 画一帧：N 次 `draw()`，各自带自己的 `model` 与 uniform。 */
function drawFrame(count: number): void {
  const active = scene;
  if (!active) return;

  active.renderer.beginFrame({ color: CLEAR_COLOR });
  // 一次 setMaterial，之后 N 次 draw 复用同一条管线（所以 stats.pipelineSwitches 应该恒为 1）。
  active.renderer.setMaterial(active.material);
  for (let index = 0; index < count; index++) {
    const placement = active.placements[index]!;
    active.renderer.draw(active.geometry, {
      model: placement.model,
      uniforms: { baseColor: placement.color },
    });
  }
  active.renderer.endFrame();
}

/**
 * 等到后端报告这一帧做完。
 *
 * WebGPU：`queue.onSubmittedWorkDone()` 是队列排空，语义正确；
 * WebGL2：core 的实现就是 `gl.finish()`（规范上不保证 GPU 真的做完，见 `benchmark.ts` 的说明）。
 *
 * 这里**不做** `benchmark.ts` 那个 1×1 `readPixels` 强制同步 —— 见文件头「计时口径」：
 * 本页要的是 CPU 每 draw 成本，每帧把 GPU 串行化反而会污染这个数字。
 */
async function syncFrame(): Promise<void> {
  const active = scene;
  if (!active) return;
  await active.renderer.device.queue.onSubmittedWorkDone();
}

/** 让出一帧，好让 #progress / #out 有机会重绘（测量本身不依赖 rAF）。 */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* 测量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Measurement {
  readonly count: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly pipelineSwitches: number;
  /** `beginFrame → endFrame` 的 CPU 帧耗时：本页的主角。 */
  readonly frameMsMean: number;
  readonly frameMsMin: number;
  readonly frameMsMax: number;
  readonly perDrawUs: number;
  readonly drawsPerSecond: number;
  /** 含 `onSubmittedWorkDone()` 等待的帧耗时，只作参考（说明 GPU 负担）。 */
  readonly syncMsMean: number;
  readonly framesMeasured: number;
  /** `renderer.stats.drawCalls` 是否等于物体数（证明这些 draw 真的发生了）。 */
  readonly statsConsistent: boolean;
  readonly note: string;
}

interface SkippedTier {
  readonly count: number;
  readonly skipped: string;
}

type TierResult = Measurement | SkippedTier;

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

/** 大档少测几帧：单帧就几百毫秒时，10 帧纯属浪费（CPU 均值早已稳定）。 */
function framesForCount(count: number): number {
  const cap = count >= 20000 ? 3 : count >= 10000 ? 5 : MAX_MEASURED_FRAMES;
  return Math.max(1, Math.min(framesToMeasure, cap));
}

/** 大档热身也少一点，但至少两帧：uniform arena 的扩容发生在头一帧里。 */
function warmupForCount(count: number): number {
  return count >= 10000 ? 2 : 3;
}

async function measure(count: number): Promise<TierResult> {
  const active = scene!;

  for (let index = 0; index < warmupForCount(count); index++) drawFrame(count);
  await syncFrame();

  // 探一帧：软件光栅化 / 软件 WebGPU 下大档可能非常慢，超过阈值就跳过，别把页面钉死。
  const probeStart = performance.now();
  drawFrame(count);
  await syncFrame();
  const probeMs = performance.now() - probeStart;
  if (probeMs > SLOW_FRAME_LIMIT_MS) {
    return {
      count,
      skipped: `单帧探测 ${probeMs.toFixed(0)}ms > ${SLOW_FRAME_LIMIT_MS}ms，跳过（可用 ?counts=... 只跑小档）`,
    };
  }

  const measuredFrames = framesForCount(count);
  const cpuSamples: number[] = [];
  const syncSamples: number[] = [];

  for (let index = 0; index < measuredFrames; index++) {
    const start = performance.now();
    drawFrame(count);
    const submitted = performance.now();
    await syncFrame();
    const finished = performance.now();
    // cpu = 录制 + 提交（便捷层的每 draw 开销都在这里）；sync = 从开始录制到后端报告做完。
    cpuSamples.push(submitted - start);
    syncSamples.push(finished - start);
    progressEl.textContent = `测量中：${count} 个物体（${index + 1}/${measuredFrames}）`;
  }

  const frameMsMean = mean(cpuSamples);
  const stats = active.renderer.stats;
  const drawCalls = stats.drawCalls;
  const triangles = stats.triangles;
  const pipelineSwitches = stats.pipelineSwitches;
  const statsConsistent = drawCalls === count && triangles === count * TRIANGLES_PER_BOX;
  if (!statsConsistent) {
    setData('gfxBenchmarkStatsOk', 'false');
  }

  return {
    count,
    drawCalls,
    triangles,
    pipelineSwitches,
    frameMsMean,
    frameMsMin: Math.min(...cpuSamples),
    frameMsMax: Math.max(...cpuSamples),
    perDrawUs: (frameMsMean * 1000) / Math.max(count, 1),
    drawsPerSecond: count / Math.max(frameMsMean / 1000, 1e-9),
    syncMsMean: mean(syncSamples),
    framesMeasured: measuredFrames,
    statsConsistent,
    note: active.renderer.backend === 'webgpu' ? 'WebGPU：队列排空' : 'WebGL2：gl.finish()',
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 结果展示                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

const COLUMN_COUNT = 11;

function rowFor(count: number): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.dataset.count = String(count);
  for (let index = 0; index < COLUMN_COUNT; index++) row.appendChild(document.createElement('td'));
  row.cells[0]!.textContent = String(count);
  return row;
}

function renderMeasurement(result: TierResult): void {
  const row = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${result.count}"]`) ?? rowFor(result.count);
  if (!row.isConnected) rowsEl.appendChild(row);
  row.className = '';

  if ('skipped' in result) {
    row.className = 'skipped';
    for (let index = 1; index <= 9; index++) row.cells[index]!.textContent = '—';
    row.cells[10]!.textContent = result.skipped;
    return;
  }

  row.className = result.statsConsistent ? 'done' : 'bad';
  row.cells[1]!.textContent = String(result.drawCalls);
  row.cells[2]!.textContent = result.triangles.toLocaleString('en-US');
  row.cells[3]!.textContent = `${result.frameMsMean.toFixed(2)} ms`;
  row.cells[4]!.textContent = `${result.frameMsMin.toFixed(2)} ms`;
  row.cells[5]!.textContent = `${result.frameMsMax.toFixed(2)} ms`;
  row.cells[6]!.textContent = `${result.perDrawUs.toFixed(2)} µs`;
  row.cells[7]!.textContent = result.drawsPerSecond.toFixed(0);
  row.cells[8]!.textContent = String(result.pipelineSwitches);
  row.cells[9]!.textContent = `${result.syncMsMean.toFixed(2)} ms`;
  row.cells[10]!.textContent = result.statsConsistent ? result.note : `stats 不一致（drawCalls=${result.drawCalls}）`;
}

/** 每档一条紧凑摘要；档与档之间用 `;` 分隔（与 `benchmark.ts` 的 `benchmarkResults` 同一写法）。 */
function summarize(results: readonly TierResult[]): string {
  return results
    .map((result) =>
      'skipped' in result
        ? `${result.count}:skipped(${result.skipped})`
        : `${result.count}:frame=${result.frameMsMean.toFixed(2)}ms,min=${result.frameMsMin.toFixed(2)}ms,` +
          `max=${result.frameMsMax.toFixed(2)}ms,perDraw=${result.perDrawUs.toFixed(2)}us,` +
          `drawsPerSecond=${result.drawsPerSecond.toFixed(0)},sync=${result.syncMsMean.toFixed(2)}ms,` +
          `drawCalls=${result.drawCalls},tris=${result.triangles},pipelineSwitches=${result.pipelineSwitches},` +
          `frames=${result.framesMeasured},stats=${result.statsConsistent ? 'ok' : 'mismatch'}`,
    )
    .join(';');
}

/** `#out` 里的人读版本：每档一行。 */
function describeLine(result: TierResult): string {
  return 'skipped' in result
    ? `${result.count} 个物体：跳过 —— ${result.skipped}`
    : `${result.count} 个物体：CPU 帧耗时 ${result.frameMsMean.toFixed(2)} ms（${result.perDrawUs.toFixed(2)} µs/draw，` +
        `${result.drawsPerSecond.toFixed(0)} draws/s），含等待后端 ${result.syncMsMean.toFixed(2)} ms，` +
        `draw calls ${result.drawCalls}，三角形 ${result.triangles}，管线切换 ${result.pipelineSwitches}，` +
        `测了 ${result.framesMeasured} 帧`;
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
  // 重跑时先把上一轮的结论清掉，免得无头抓取拿到旧值。
  document.documentElement.removeAttribute('data-gfx-benchmark-result');
  setData('gfxBenchmarkResults', '');
  setData('gfxBenchmarkStatsOk', 'true');
  setData('gfxBenchmarkFrames', String(framesToMeasure));

  const results: TierResult[] = [];
  for (const count of counts) {
    statusEl.textContent = `测量中：${count} 个物体（每物体一次 draw call）…`;
    renderMeasurement({ count, skipped: '测量中…' });
    const pending = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${count}"]`);
    if (pending) pending.className = 'pending';
    const result = await measure(count);
    renderMeasurement(result);
    results.push(result);
    setData('gfxBenchmarkResults', summarize(results));
    statsEl.textContent = `后端 ${active.renderer.backend}　画布 ${active.renderer.width}×${active.renderer.height}　物体 ${active.placements.length} 份摆放已就绪`;
    await yieldToBrowser();
  }

  const okTiers = results.filter((result): result is Measurement => !('skipped' in result));
  const allConsistent = okTiers.length > 0 && okTiers.every((result) => result.statsConsistent);
  setData('gfxBenchmarkStatsOk', String(allConsistent));
  setData('gfxBenchmarkResults', summarize(results));
  outEl.textContent =
    `后端 ${active.renderer.backend}　画布 ${active.renderer.width}×${active.renderer.height}　` +
    `几何 ${active.geometry.label}（${TRIANGLES_PER_BOX} 三角形）　材质 ${active.material.name}\n` +
    results.map(describeLine).join('\n');

  progressEl.textContent = '完成';
  statusEl.textContent = `完成：${results.length} 档（其中 ${okTiers.length} 档测到数字）`;
  rerunButton.disabled = false;
  running = false;
  finished = true;
  // 结论最后写：无头抓取看到 gfxBenchmarkResult 就说明上面所有 data-* 都已就位。
  setData('gfxBenchmarkResult', 'ok');
}

function failRun(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  statusEl.textContent = `失败：${message}`;
  statusEl.className = 'error';
  outEl.textContent = `失败：${message}`;
  setData('gfxBenchmarkError', message);
  setData('gfxBenchmarkResult', 'fail');
  finished = true;
  running = false;
  rerunButton.disabled = false;
}

/* ------------------------------------------------------------------------------------------------ */
/* 启动                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

framesInput.value = String(framesToMeasure);
framesInput.addEventListener('change', () => {
  framesToMeasure = clampInt(Number(framesInput.value), DEFAULT_FRAMES, 1, 200);
  framesInput.value = String(framesToMeasure);
});
rerunButton.addEventListener('click', () => {
  void runBenchmark().catch(failRun);
});
window.addEventListener('resize', () => {
  scene?.renderer.resize();
});
window.addEventListener('unhandledrejection', (event) => {
  if (!finished) failRun(event.reason);
});
window.addEventListener('error', (event) => {
  if (!finished) failRun(event.error ?? event.message);
});

setData('gfxBenchmarkCounts', counts.join(','));
setData('gfxBenchmarkFrames', String(framesToMeasure));
setData('gfxBenchmarkBackend', backend);

createScene()
  .then(async (created) => {
    scene = created;
    setData('gfxBenchmarkBackend', created.renderer.backend);
    statusEl.textContent =
      `后端：${created.renderer.backend}　${MAX_COUNT} 份摆放 / 1 份几何 / 1 条材质　分档 ${counts.join(', ')}`;
    await runBenchmark();
  })
  .catch(failRun);
