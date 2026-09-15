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
 * 两页共用同一套分档（2000 / 5000 / 10000 / 20000 / 40000），所以可以和 core 页的对应档位对照。
 * 但要注意 `benchmark.ts` 已经改成**动态场景**（每帧重建 model 并重新上传实例矩阵），
 * 要和本页（静态、每 draw 一次 `renderer.draw`）比，请用它的静态档：
 * `benchmark.html?motion=off&mode=draws` —— 同档 CPU 帧耗时的差值才是便捷层的净开销。
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
 * ## GPU 时间是真测出来的，不是 CPU 的复制
 *
 * 页面用 `Renderer.create({ gpuTiming: true })` 打开 GPU 计时，于是多出一列 `gpu=`：
 * 它来自后端的 query 机制（WebGPU 的 `timestamp-query` + `encoder.writeTimestamp`，
 * WebGL2 的 `EXT_disjoint_timer_query_webgl2`），**与 CPU 那列完全无关**：
 * - 两列数字不相等（同一档通常差一个数量级）；
 * - GPU 那列随负载变化（2000 → 20000 会明显上升），而 CPU 那列按 draw 数线性上升；
 * - `gpu=` 与 `sync - frame`（整帧减去 CPU 提交）应当同量级 —— 后者是本页唯一另一个「包含
 *   GPU 执行时间」的量，用来交叉验证刻度的单位换算（`timestampPeriod`）没有搞错。
 * 拿不到 GPU 计时（后端缺 feature/扩展）时 `gpu=` 显示 `—`，原因写进 `data-bench-gpu-error`。
 *
 * ## 本页自带结论
 *
 * 跑完把所有分档写进 `<html data-gfx-benchmark-*>`（键名与 `benchmark.ts` 的 `data-benchmark-*`
 * 一一对应），全部测完再写 `gfxBenchmarkResult = ok`，之后页面**自己停下来**（不再排 rAF 循环）。
 * 每档还会核对 `renderer.stats`（drawCalls 必须等于物体数），用来证明这些 draw 真的发生了。
 *
 * ## 两个开关（都是查询参数，用来做「同一台机器、同一份代码」的 A/B）
 *
 * - `culling=0|1`（默认 0）：视锥剔除。打开后 `draw calls` 会少于物体数，
 *   差额写在 `data-bench-culled`（“物体数:剔除数”）里；
 * - `sort=none|opaque|all`（默认 none）：draw 排序模式。
 *   注意开启排序后本页的 `CPU 提交` 包含「排队 + 排序」的开销（本来就是为了看这个）。
 *
 * 无头抓取关心的是这几个 key：
 * `data-bench-cpu-ms`（每档 CPU 均值，`档:值;档:值`）、`data-bench-gpu-ms`（每档 GPU 均值）、
 * `data-bench-draws`（每档真实 draw calls）、`data-bench-culled`（每档剔除数）、
 * `data-bench-gpu-source`（`webgpu-timestamp-query` / `webgl2-EXT_disjoint_timer_query_webgl2` /
 * `unavailable`）、`data-bench-gpu-error`（拿不到时的原文错误）。
 *
 * ## 运行
 *
 * ```
 * pnpm dev
 * # 浏览器打开 http://localhost:5199/examples/gfx-benchmark.html?backend=webgl2&counts=2000,5000
 * # 打开剔除：…&culling=1   排序：…&sort=all
 * ```
 *
 * 查询参数（解析方式与 `benchmark.ts` 一致）：
 * `?backend=webgl2|webgpu|auto&counts=2000,5000&frames=10&culling=0&sort=none`
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
const DEFAULT_SPREAD = 10;
/** `shapes.createBox` 三个分段都为 1 时是 12 个三角形。 */
const TRIANGLES_PER_BOX = 12;
/** 最大档的格点边长；各档共用同一个盒子，所以档与档之间只差 draw 次数。 */
const GRID_SIDE = Math.max(1, Math.ceil(Math.cbrt(MAX_COUNT)));

const query = new URLSearchParams(location.search);
/**
 * 物体分布的空间边长（默认 10）。
 *
 * 调大它会让大部分物体落到视锥外 —— 那才是**视锥剔除**能省下东西的场景（`?spread=60`）。
 * 默认的 10 在无头浏览器那种超宽画布（横向 FOV 120°）下几乎所有物体都在视锥内，
 * 剔除数会是 0：这不是剔除失效，而是「确实没有东西可剔」。
 */
const SPREAD = (() => {
  const raw = query.get('spread');
  if (raw === null) return DEFAULT_SPREAD;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SPREAD;
})();
const BOX_SIZE = (SPREAD / GRID_SIDE) * 0.9;

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

/**
 * 两个开关：是否剔除、排序模式。
 *
 * 默认 `culling=0`（不剔除）/ `sort=none`。
 * `culling` 默认关是为了保住本页「drawCalls === 物体数」这条自检（见 measure()），
 * 剔除的收益要单独用 `?culling=1` 量。
 */
function flag(name: string, fallback: boolean): boolean {
  const raw = query.get(name);
  if (raw === null) return fallback;
  return raw !== '0' && raw !== 'false';
}
const cullingEnabled = flag('culling', false);
/** 配对 A/B 模式：目前只有 `cull`（剔除开/关）；缺省不做配对测量。 */
const abParam = query.get('ab');
const abKind: 'cull' | null = abParam === 'cull' ? 'cull' : null;
/** 配对测量的轮数（每轮两种配置各测一遍，顺序交替）。 */
const abRounds = (() => {
  const raw = query.get('rounds');
  if (raw === null) return 3;
  return Math.max(1, Math.min(clampInt(Number(raw), 3, 1, 20), 20));
})();
const sortParam = query.get('sort');
const sortMode: 'none' | 'opaque' | 'all' =
  sortParam === 'opaque' || sortParam === 'all' ? sortParam : 'none';

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
    // GPU 计时：申请 timestamp-query 并尝试打开（后端不支持时不会让页面失败，原因进 error）。
    gpuTiming: true,
    // 剔除默认关：开了之后 drawCalls 会小于物体数，本页的 stats 自检就变成
    // 「drawCalls + culled === 物体数」（见 measure()）。要量剔除收益就加 ?culling=1。
    culling: cullingEnabled,
    sort: sortMode,
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
/* GPU 样本收集                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** 每档最多为「等 GPU 样本落地」画多久（毫秒）。WebGL2 + SwiftShader 上读回可能滞后好几秒。 */
const GPU_SAMPLE_DEADLINE_MS = 12000;
/** 每档期望拿到的样本数；够了就不再等。 */
const GPU_SAMPLE_TARGET = 3;

/** GPU 计时的来源说明，写进 `data-bench-gpu-source`。 */
function gpuTimingSource(): string {
  const active = scene;
  if (!active || !active.renderer.gpuTiming.enabled) return 'unavailable';
  return active.renderer.backend === 'webgpu'
    ? 'webgpu-timestamp-query'
    : 'webgl2-EXT_disjoint_timer_query_webgl2';
}

/**
 * 每档开始前重开一次 GPU 计时。
 *
 * 目的是**把档与档之间的样本彻底隔开**：上一档里那些「还没落地」的异步读回会随着 query set
 * 一起被丢弃，绝不会被算进下一档（WebGL2 上的读回延迟可达数秒，不隔离就会串档）。
 */
function restartGpuTiming(): void {
  const active = scene;
  if (!active) return;
  const wasEnabled = active.renderer.gpuTiming.enabled;
  if (!wasEnabled) return;
  active.renderer.disableGpuTiming();
  try {
    active.renderer.enableGpuTiming();
  } catch (error) {
    setData('benchGpuError', error instanceof Error ? error.message : String(error));
  }
}

/**
 * 收集当前档位的 GPU 帧耗时样本（毫秒）。
 *
 * `GpuTiming` 是「延迟若干帧 + 异步读回」，所以测量完 CPU 之后还要继续画**同一档**的帧，
 * 样本才会陆续落地：WebGPU 上一两帧就有，WebGL2（SwiftShader）上实测要等好几秒。
 * 直到凑够 {@link GPU_SAMPLE_TARGET} 个样本、或者超过 {@link GPU_SAMPLE_DEADLINE_MS} 为止。
 */
async function collectGpuSamples(count: number): Promise<number[]> {
  const active = scene;
  if (!active) return [];
  const timing = active.renderer.gpuTiming;
  if (!timing.enabled) return [];

  const samples: number[] = [];
  let seen = timing.samples;
  const deadline = performance.now() + GPU_SAMPLE_DEADLINE_MS;
  while (performance.now() < deadline && samples.length < GPU_SAMPLE_TARGET) {
    drawFrame(count);
    await syncFrame();
    // 关键：每次循环都要让出宏任务。WebGL2 的读回用 `setTimeout(0)` 轮询
    // QUERY_RESULT_AVAILABLE，如果这里只 await 微任务（onSubmittedWorkDone 就是），
    // 定时器永远排不上队，样本一个都不会落地（实测踩过）。
    await yieldToBrowser();
    const now = active.renderer.gpuTiming;
    if (now.gpuFrameTimeMs !== null && now.samples > seen) {
      samples.push(now.gpuFrameTimeMs);
      seen = now.samples;
    }
    if (now.error !== null && document.documentElement.dataset.benchGpuError === undefined) {
      // 读回失败（例如 GPU_DISJOINT_EXT）时留证据，但不再刷屏。
      setData('benchGpuError', now.error.replace(/\s+/g, ' ').trim());
    }
  }
  return samples;
}

/* ------------------------------------------------------------------------------------------------ */
/* 测量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Measurement {
  readonly count: number;
  readonly drawCalls: number;
  /** 本帧被视锥剔除掉的绘制数（`culling=0` 时恒为 0）。 */
  readonly culled: number;
  /** 本帧因为几何体不适合剔除而没做测试的数量（本页的盒子有 float32x3 顶点，应恒为 0）。 */
  readonly cullSkipped: number;
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
  /** GPU 帧耗时均值（毫秒）；拿不到 GPU 计时时为 null（不是 0）。 */
  readonly gpuMsMean: number | null;
  readonly gpuSamples: number;
  /** 收集样本期间的诊断：跳过的读回次数 / 仍在飞的读回 / 读回错误。 */
  readonly gpuSkipped: number;
  readonly gpuInFlight: number;
  readonly gpuError: string | null;
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

  // 每档重开 GPU 计时：上一档还没落地的读回随 query set 一起丢弃，不会串到这一档。
  restartGpuTiming();

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
  const culled = stats.culled;
  const cullSkipped = stats.cullSkipped;
  const triangles = stats.triangles;
  const pipelineSwitches = stats.pipelineSwitches;
  // 关剔除时每个物体都必须真的画了；开剔除时「画了 + 剔了」才该等于物体数。
  const statsConsistent =
    drawCalls + culled === count && triangles === drawCalls * TRIANGLES_PER_BOX;
  if (!statsConsistent) {
    setData('gfxBenchmarkStatsOk', 'false');
  }

  // GPU 样本要在 CPU 测量之后单独收集（延迟若干帧的异步读回，见 collectGpuSamples）。
  const gpuSamples = await collectGpuSamples(count);

  return {
    count,
    drawCalls,
    culled,
    cullSkipped,
    triangles,
    pipelineSwitches,
    frameMsMean,
    frameMsMin: Math.min(...cpuSamples),
    frameMsMax: Math.max(...cpuSamples),
    perDrawUs: (frameMsMean * 1000) / Math.max(count, 1),
    drawsPerSecond: count / Math.max(frameMsMean / 1000, 1e-9),
    syncMsMean: mean(syncSamples),
    gpuMsMean: gpuSamples.length > 0 ? mean(gpuSamples) : null,
    gpuSamples: gpuSamples.length,
    gpuSkipped: active.renderer.gpuTiming.skipped,
    gpuInFlight: active.renderer.gpuTiming.inFlight,
    gpuError: active.renderer.gpuTiming.error,
    framesMeasured: measuredFrames,
    statsConsistent,
    note: active.renderer.backend === 'webgpu' ? 'WebGPU：队列排空' : 'WebGL2：gl.finish()',
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 结果展示                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

const COLUMN_COUNT = 13;

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
    for (let index = 1; index <= 11; index++) row.cells[index]!.textContent = '—';
    row.cells[12]!.textContent = result.skipped;
    return;
  }

  row.className = result.statsConsistent ? 'done' : 'bad';
  row.cells[1]!.textContent = String(result.drawCalls);
  row.cells[2]!.textContent = result.triangles.toLocaleString('en-US');
  row.cells[3]!.textContent = `${result.frameMsMean.toFixed(2)} ms`;
  row.cells[4]!.textContent = `${result.frameMsMin.toFixed(2)} ms`;
  row.cells[5]!.textContent = `${result.frameMsMax.toFixed(2)} ms`;
  // GPU 那列拿不到时显示「—」而不是 0：0 会被误读成「GPU 不花时间」。
  row.cells[6]!.textContent =
    result.gpuMsMean === null ? '—' : `${result.gpuMsMean.toFixed(3)} ms (${result.gpuSamples})`;
  row.cells[7]!.textContent = `${result.perDrawUs.toFixed(2)} µs`;
  row.cells[8]!.textContent = result.drawsPerSecond.toFixed(0);
  row.cells[9]!.textContent = String(result.pipelineSwitches);
  row.cells[10]!.textContent = `${result.syncMsMean.toFixed(2)} ms`;
  row.cells[11]!.textContent =
    `${result.culled} / ${result.cullSkipped}`;
  row.cells[12]!.textContent = result.statsConsistent
    ? result.note
    : `stats 不一致（drawCalls=${result.drawCalls}, culled=${result.culled}）`;
}

/** 每档一条紧凑摘要；档与档之间用 `;` 分隔（与 `benchmark.ts` 的 `benchmarkResults` 同一写法）。 */
function summarize(results: readonly TierResult[]): string {
  return results
    .map((result) =>
      'skipped' in result
        ? `${result.count}:skipped(${result.skipped})`
        : `${result.count}:frame=${result.frameMsMean.toFixed(2)}ms,min=${result.frameMsMin.toFixed(2)}ms,` +
          `max=${result.frameMsMax.toFixed(2)}ms,gpu=${result.gpuMsMean === null ? 'n/a' : `${result.gpuMsMean.toFixed(3)}ms`},` +
          `gpuSamples=${result.gpuSamples},gpuSkipped=${result.gpuSkipped},gpuInFlight=${result.gpuInFlight},` +
          `gpuError=${result.gpuError === null ? 'none' : result.gpuError.replace(/\s+/g, ' ').trim()},` +
          `perDraw=${result.perDrawUs.toFixed(2)}us,` +
          `drawsPerSecond=${result.drawsPerSecond.toFixed(0)},sync=${result.syncMsMean.toFixed(2)}ms,` +
          `drawCalls=${result.drawCalls},culled=${result.culled},cullSkipped=${result.cullSkipped},` +
          `tris=${result.triangles},pipelineSwitches=${result.pipelineSwitches},` +
          `frames=${result.framesMeasured},stats=${result.statsConsistent ? 'ok' : 'mismatch'}`,
    )
    .join(';');
}

/** 每档一列数字，供无头抓取（`data-bench-cpu-ms` / `data-bench-gpu-ms`）。 */
function seriesOf(results: readonly TierResult[], pick: (result: Measurement) => number | null): string {
  return results
    .filter((result): result is Measurement => !('skipped' in result))
    .map((result) => {
      const value = pick(result);
      return `${result.count}:${value === null ? 'n/a' : value.toFixed(3)}`;
    })
    .join(';');
}

/** 每档一列整数，供无头抓取（剔除数 / 真实 draw calls）。 */
function integerSeriesOf(
  results: readonly TierResult[],
  pick: (result: Measurement) => number,
): string {
  return results
    .filter((result): result is Measurement => !('skipped' in result))
    .map((result) => `${result.count}:${pick(result)}`)
    .join(';');
}

/** `#out` 里的人读版本：每档一行。 */
function describeLine(result: TierResult): string {
  if ('skipped' in result) return `${result.count} 个物体：跳过 —— ${result.skipped}`;
  const gpu =
    result.gpuMsMean === null
      ? `GPU 时间不可用（样本 0，跳过 ${result.gpuSkipped} 次读回` +
        `${result.gpuError === null ? '' : `，错误：${result.gpuError}`}）`
      : `GPU 执行 ${result.gpuMsMean.toFixed(3)} ms（${result.gpuSamples} 个样本，跳过 ${result.gpuSkipped} 次读回）`;
  return `${result.count} 个物体：CPU 提交 ${result.frameMsMean.toFixed(2)} ms（${result.perDrawUs.toFixed(2)} µs/draw，` +
    `${result.drawsPerSecond.toFixed(0)} draws/s），${gpu}，含等待后端 ${result.syncMsMean.toFixed(2)} ms，` +
    `draw calls ${result.drawCalls}（剔除 ${result.culled}，跳过测试 ${result.cullSkipped}），` +
    `三角形 ${result.triangles}，管线切换 ${result.pipelineSwitches}，` +
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
  document.documentElement.removeAttribute('data-bench-gpu-error');
  setData('gfxBenchmarkResults', '');
  setData('gfxBenchmarkStatsOk', 'true');
  setData('gfxBenchmarkFrames', String(framesToMeasure));
  // 开关也写进 data-*：抓取方一眼能看出这批数字是在哪种配置下测的。
  setData('benchSpread', String(SPREAD));
  setData('benchCulling', cullingEnabled ? 'on' : 'off');
  setData('benchSort', sortMode);

  const gpuStats = active.renderer.gpuTiming;
  setData('benchGpuSource', gpuTimingSource());
  setData('benchGpuEnabled', String(gpuStats.enabled));
  if (gpuStats.error !== null) setData('benchGpuError', gpuStats.error.replace(/\s+/g, ' ').trim());

  const results: TierResult[] = [];
  for (const count of counts) {    statusEl.textContent = `测量中：${count} 个物体（每物体一次 draw call）…`;
    renderMeasurement({ count, skipped: '测量中…' });
    const pending = rowsEl.querySelector<HTMLTableRowElement>(`tr[data-count="${count}"]`);
    if (pending) pending.className = 'pending';
    const result = await measure(count);
    renderMeasurement(result);
    results.push(result);
    setData('gfxBenchmarkResults', summarize(results));
    setData('benchCpuMs', seriesOf(results, (item) => item.frameMsMean));
    setData('benchGpuMs', seriesOf(results, (item) => item.gpuMsMean));
    setData('benchDraws', integerSeriesOf(results, (item) => item.drawCalls));
    setData('benchCulled', integerSeriesOf(results, (item) => item.culled));
    statsEl.textContent = `后端 ${active.renderer.backend}　画布 ${active.renderer.width}×${active.renderer.height}　物体 ${active.placements.length} 份摆放已就绪`;
    await yieldToBrowser();
  }

  const okTiers = results.filter((result): result is Measurement => !('skipped' in result));
  const allConsistent = okTiers.length > 0 && okTiers.every((result) => result.statsConsistent);
  setData('gfxBenchmarkStatsOk', String(allConsistent));
  setData('gfxBenchmarkResults', summarize(results));
  setData('benchCpuMs', seriesOf(results, (item) => item.frameMsMean));
  setData('benchGpuMs', seriesOf(results, (item) => item.gpuMsMean));
  setData('benchDraws', integerSeriesOf(results, (item) => item.drawCalls));
  setData('benchCulled', integerSeriesOf(results, (item) => item.culled));
  setData('benchGpuSource', gpuTimingSource());
  const gpuTierCount = okTiers.filter((result) => result.gpuMsMean !== null).length;
  outEl.textContent =
    `后端 ${active.renderer.backend}　画布 ${active.renderer.width}×${active.renderer.height}　` +
    `几何 ${active.geometry.label}（${TRIANGLES_PER_BOX} 三角形）　材质 ${active.material.name}\n` +
    `开关：视锥剔除 ${cullingEnabled ? '开' : '关'}　排序 ${sortMode}\n` +
    `GPU 计时：${gpuTimingSource()}（${gpuTierCount}/${okTiers.length} 档拿到样本）\n` +
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
/* 配对 A/B（?ab=cull）                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 在**同一个页面进程里交替**测两种配置，取各自的最小帧耗时。
 *
 * 为什么需要它：跨进程/跨次运行的数字受机器负载影响极大（本仓库实测同一档能在 9ms 与 278ms 之间
 * 摆动），单次运行之间相减根本说明不了问题。交替测量把「漂移」摊到两种配置上，再取最小值
 * （最小值最接近「没有外部干扰时的真实成本」），是比较 CPU 热路径的常规做法。
 *
 * 只测 CPU 提交耗时，不收集 GPU 样本（那一项另有 `runBenchmark()` 负责，而且它每档要等十几秒）。
 */
async function runAb(kind: 'cull'): Promise<void> {
  const active = scene;
  if (running || !active) return;
  running = true;
  rerunButton.disabled = true;
  rowsEl.replaceChildren();
  document.documentElement.removeAttribute('data-gfx-benchmark-result');
  setData('benchAbKind', kind);
  setData('benchAbRounds', String(abRounds));
  setData('benchAb', '');

  const lines: string[] = [];
  const rows: string[] = [];

  for (const count of counts) {
    const off: number[] = [];
    const on: number[] = [];
    for (let round = 0; round < abRounds; round++) {
      // 顺序逐轮翻转：这样两种配置各自都经历过「机器正忙」与「机器空闲」的位置。
      const order: boolean[] = round % 2 === 0 ? [false, true] : [true, false];
      for (const enabled of order) {
        applyAbConfig(active, enabled);
        // 热身：arena 扩容、管线创建都发生在头一帧里。
        for (let index = 0; index < 2; index++) {
          drawFrame(count);
          await syncFrame();
        }
        const samples: number[] = [];
        const frames = framesForCount(count);
        for (let index = 0; index < frames; index++) {
          const start = performance.now();
          drawFrame(count);
          const submitted = performance.now();
          await syncFrame();
          samples.push(submitted - start);
        }
        (enabled ? on : off).push(Math.min(...samples));
        progressEl.textContent = `${kind} 配对测量：${count} 个物体（第 ${round + 1}/${abRounds} 轮）`;
        await yieldToBrowser();
      }
    }

    const offMin = Math.min(...off);
    const onMin = Math.min(...on);
    const delta = offMin > 0 ? ((onMin - offMin) / offMin) * 100 : 0;
    const stats = active.renderer.stats;
    lines.push(
      `${count}：剔除关 ${offMin.toFixed(2)} ms / 剔除开 ${onMin.toFixed(2)} ms` +
        `（${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%），` +
        `draw calls ${stats.drawCalls}，剔除 ${stats.culled}`,
    );
    rows.push(
      `${count}:off=${offMin.toFixed(3)}ms,on=${onMin.toFixed(3)}ms,deltaPct=${delta.toFixed(1)},` +
        `drawCalls=${stats.drawCalls},culled=${stats.culled}`,
    );
    setData('benchAb', rows.join(';'));
  }

  outEl.textContent =
    `后端 ${active.renderer.backend}　配对 A/B（${kind}，每档 ${abRounds} 轮、每轮取最小帧耗时）\n` +
    `分布 ${SPREAD}　分档 ${counts.join(', ')}\n` +
    lines.join('\n');
  progressEl.textContent = '完成';
  statusEl.textContent = `配对 A/B 完成：${kind}（${counts.length} 档 × ${abRounds} 轮）`;
  setData('benchAb', rows.join(';'));
  setData('gfxBenchmarkBackend', active.renderer.backend);
  rerunButton.disabled = false;
  running = false;
  finished = true;
  setData('gfxBenchmarkResult', 'ok');
}

/** 切换配对测量用的配置。 */
function applyAbConfig(target: Scene, enabled: boolean): void {
  target.renderer.culling = enabled;
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
  void (abKind ? runAb(abKind) : runBenchmark()).catch(failRun);
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
setData('benchSpread', String(SPREAD));
setData('benchCulling', cullingEnabled ? 'on' : 'off');
setData('benchSort', sortMode);

createScene()
  .then(async (created) => {
    scene = created;
    setData('gfxBenchmarkBackend', created.renderer.backend);
    statusEl.textContent =
      `后端：${created.renderer.backend}　${MAX_COUNT} 份摆放 / 1 份几何 / 1 条材质　分档 ${counts.join(', ')}　` +
      `分布 ${SPREAD}　剔除 ${cullingEnabled ? '开' : '关'} / 排序 ${sortMode}`;
    if (abKind) await runAb(abKind);
    else await runBenchmark();
  })
  .catch(failRun);
