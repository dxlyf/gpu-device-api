/**
 * gfx 便捷层 `Renderer.prewarm()` 的实测页面：**两个后端同一段代码**。
 *
 * 这个页面只做三件事，并把结论写进 `<html data-*>` 便于无头浏览器抓取：
 *
 * 1. **预热前 / 预热后的首帧耗时对比**：用一段「很重」的片元着色器（`iters` 条互相依赖的
 *    语句），让编译耗时可见。每一轮都新建**两份源码不同**的材质（salt 不同）：
 *    冷路径直接画那份新材质，热路径先 `await renderer.prewarm({ materials: [warm] })`
 *    再画同一段代码的另一份材质。两份源码不同是必须的 —— 否则两个后端的缓存会直接命中，
 *    量出来的「冷路径」其实是热的。
 * 2. **不重复预热**：对同一条材质再 `prewarm()` 一次，结果必须是 `skipped: true`
 *    （已建过管线的材质不会被重新编译），说明预热出来的管线真的被交给了绘制路径。
 * 3. **`renderer.compilationInfo()` 的诊断**：故意写一个编译不过的材质，从 gfx 层拿到的
 *    `CompilationInfo` 里应当有 `type: 'error'` 与**真实行号**；页面会用同一段包装逻辑算出
 *    期望行号并比对。
 *
 * WebGL2 与 WebGPU 的编译时机不同，页面把 `mode`（async / sync）与后端一起报出来：
 * WebGL2 只有拿到 `KHR_parallel_shader_compile` 才可能真异步；拿不到就是同步降级 ——
 * 这时「预热」的价值只剩「把同一段同步工作提前到调用 `prewarm()` 的时候」，页面会如实说明。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto`、`?iters=<展开语句条数>`（默认 1200）、
 * `?rounds=<轮数>`（默认 3，每轮一对新材质）。
 *
 * 无头抓取关心的键：
 * `data-gfx-prewarm-result`（`ok` / `no-speedup` / `fail`）、
 * `data-gfx-prewarm-cold-frame-ms` / `-warm-frame-ms` / `-delta-frame-ms`（各轮均值）、
 * `data-gfx-prewarm-cold-second-frame-ms` / `-warm-second-frame-ms`（第二帧，用来暴露被推迟的编译）、
 * `data-gfx-prewarm-speedup`（冷 / 热）、`data-gfx-prewarm-mode`、`data-gfx-prewarm-reason`、
 * `data-gfx-prewarm-prewarm-ms`、`data-gfx-prewarm-skipped`、`data-gfx-prewarm-variant`、
 * `data-gfx-prewarm-broken-line` / `-broken-expected-line` / `-broken-actionable`。
 */

import { Renderer, shapes } from '../src/gfx/index.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import { compileShaderStage } from '../src/shaders/ShaderCompiler.js';
import type { Geometry } from '../src/gfx/Geometry.js';
import type { Material } from '../src/gfx/Material.js';
import type { MaterialPrewarmResult } from '../src/gfx/Renderer.js';

const out = requireElement<HTMLPreElement>('out');
const status = requireElement<HTMLSpanElement>('status');
const stats = requireElement<HTMLSpanElement>('stats');

const lines: string[] = [];
function log(message: string): void {
  lines.push(message);
  out.textContent = lines.join('\n');
}

/**
 * 把结论写进 `<html data-...>`（`camelCase` → `data-camel-case`，与 `core-shared.ts` 同一套口径）。
 *
 * 必须走 `dataset`：`setAttribute('data-gfxPrewarmResult')` 会被 HTML 解析器统一成小写，
 * 抓取方按 `dataset.gfxPrewarmResult` 就取不到了（这个坑踩过一次）。
 */
function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`[gpu-device-api] gfx-prewarm example: #${id} is missing.`);
  return element as T;
}

const query = new URLSearchParams(location.search);
const backendParam = query.get('backend');
const backend: 'auto' | 'webgl2' | 'webgpu' =
  backendParam === 'webgl2' || backendParam === 'webgpu' ? backendParam : 'auto';
const iterations = intParam('iters', 1200, 1, 4000);
const rounds = intParam('rounds', 3, 1, 5);
const CLEAR_COLOR = '#101418';
/** 冷 / 热用的两份源码必须不同：每个「槽位」占两个 salt。 */
const SALT_STRIDE = 2;

/**
 * 读一个整数查询参数。
 *
 * **不能**写成 `clampInt(Number(query.get(name)), ...)`：参数缺席时 `Number(null)` 是 0
 *（有限数），会被 clamp 到下限，于是「不写 iters」变成「iters=1」（踩过一次）。
 */
function intParam(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = query.get(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

/* ------------------------------------------------------------------------------------------------ */
/* 着色器源码                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** gfx 的材质只需要 position 一条属性；顶点位置直接当裁剪空间坐标用。 */
const VERTEX_GLSL = ['void main() {', '  gl_Position = vec4(position, 1.0);', '}'].join('\n');

const VERTEX_WGSL = [
  '@vertex fn vsMain(input: VertexInput) -> @builtin(position) vec4f {',
  '  return vec4f(input.position, 1.0);',
  '}',
].join('\n');

/**
 * 一段「很重」的片元着色器：`iterations` 条独立语句，每条都依赖上一条的结果，
 * 编译器无法把它们全部折叠掉；`salt` 用来做出内容不同的两份源码。
 *
 * 注意这里**不写** `precision highp float;`：`compileShaderStage()` 会补上 `#version 300 es`
 * 与精度前言，行号也就是「补完之后」的最终源码里的行号（诊断比对按同一口径算）。
 */
function heavyFragment(language: 'glsl' | 'wgsl', salt: number): string {
  const head =
    language === 'glsl'
      ? ['void main() {', `  float acc = ${salt}.5;`]
      : ['@fragment fn fsMain() -> @location(0) vec4f {', `  var acc = ${salt}.5;`];
  const body: string[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const k = (((index * 2654435761) % 1000) + 1) / 1000;
    body.push(`  acc = fract(sin(acc * ${k.toFixed(6)}) * 43758.5453);`);
  }
  const tail =
    language === 'glsl'
      ? ['  fragColor = vec4(acc, acc, acc, 1.0);', '}']
      : ['  return vec4f(acc, acc, acc, 1.0);', '}'];
  return [...head, ...body, ...tail].join('\n');
}

/** 故意编译不过的片元着色器：错误就在 `brokenSymbol` 那一行。 */
const BROKEN_MARKER = 'brokenSymbol';
const BROKEN_GLSL_FS = [
  'void main() {',
  `  float value = ${BROKEN_MARKER};`,
  '  fragColor = vec4(value);',
  '}',
].join('\n');
const BROKEN_WGSL_FS = [
  '@fragment fn fsMain() -> @location(0) vec4f {',
  `  let value = ${BROKEN_MARKER};`,
  '  return vec4f(value);',
  '}',
].join('\n');

/* ------------------------------------------------------------------------------------------------ */
/* 主体                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

interface FrameTiming {
  readonly coldMs: number;
  /** 冷路径的**第二帧**：驱动的编译有可能被推迟到真正使用它的那一刻，这一列用来暴露它。 */
  readonly coldSecondMs: number;
  readonly warmMs: number;
  readonly warmSecondMs: number;
  readonly prewarmMs: number;
  readonly mode: string;
  readonly reason: string | null;
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const renderer = await Renderer.create({
    canvas,
    backend,
    // 这张页面量的是「编译有没有被挪走」：关掉 MSAA，免得填充/解析时间主导整帧。
    antialias: false,
    depth: true,
    clearColor: CLEAR_COLOR,
  });
  setData('gfxPrewarmBackend', renderer.backend);
  log(`后端：${renderer.backend}；展开语句：${iterations}；轮数：${rounds}`);

  // 画布尺寸由页面 CSS 定死（`beginFrame()` 里的 resize() 会跟着 CSS 走）：
  // 重着色器在软件光栅化下每像素都很贵，页面只需要让"编译"这件事可见。
  renderer.setPixelRatio(1);

  const geometry: Geometry = renderer.createGeometry({
    label: 'gfx-prewarm-triangle',
    ...shapes.createTriangle({ radius: 0.95 }),
  });

  /** 画一帧并等后端跟上；返回整段耗时（含关键路径上的编译）。 */
  const drawAndWait = async (material: Material): Promise<number> => {
    const started = performance.now();
    renderer.beginFrame({ color: CLEAR_COLOR });
    renderer.draw(geometry, { material });
    renderer.endFrame();
    // WebGPU 上首次使用一条管线时编译在 device timeline 上，不 await 就量不到那段等待；
    // WebGL2 的 core 实现就是 gl.finish()。两个后端都画了同一个三角形。
    await renderer.device.queue.onSubmittedWorkDone();
    return performance.now() - started;
  };

  const defineHeavyMaterial = (salt: number): Material =>
    renderer.createMaterial({
      name: `heavy-${salt}`,
      attributes: { position: 'float32x3' },
      glsl: { vs: VERTEX_GLSL, fs: heavyFragment('glsl', salt) },
      wgsl: `${VERTEX_WGSL}\n\n${heavyFragment('wgsl', salt)}`,
    });

  /*
   * 先跑一帧便宜材质：把「渲染器第一次开帧」的开销（canvas 后备缓冲、uniform arena 扩容）
   * 从被测数字里剔出去，剩下的差异才真的是管线编译。这段着色器几乎不花编译时间，
   * 但顶点处理路径与正式材质完全一样（position 属性 + 直接输出裁剪空间坐标）。
   */
  const warmupMaterial = renderer.createMaterial({
    name: 'warmup',
    attributes: { position: 'float32x3' },
    glsl: { vs: VERTEX_GLSL, fs: 'void main() { fragColor = vec4(0.2, 0.3, 0.4, 1.0); }' },
    wgsl: `${VERTEX_WGSL}\n\n@fragment fn fsMain() -> @location(0) vec4f { return vec4f(0.2, 0.3, 0.4, 1.0); }`,
  });
  await drawAndWait(warmupMaterial);
  log(`启动帧（便宜材质）：${renderer.stats.drawCalls} draw call`);

  const timings: FrameTiming[] = [];
  let firstVariant: string | null = null;
  let skippedSecondCall = false;

  for (let round = 0; round < rounds; round += 1) {
    const coldMaterial = defineHeavyMaterial(round * SALT_STRIDE + 1);
    const warmMaterial = defineHeavyMaterial(round * SALT_STRIDE + 2);

    // 冷路径：不预热，直接画 —— 管线在 acquirePipeline() 里现建。
    const coldMs = await drawAndWait(coldMaterial);
    if (renderer.stats.drawCalls !== 1) {
      throw new Error(`[gpu-device-api] gfx-prewarm example: expected 1 draw call, got ${renderer.stats.drawCalls}.`);
    }
    // 再画一帧：驱动有可能把真正的编译推迟到"第一次用它"的时候，
    // 那一帧会被记在这里，避免把推迟的卡顿误当成"冷路径很快"。
    const coldSecondMs = await drawAndWait(coldMaterial);

    // 热路径：先预热，再画（用的是**预热出来的那条管线**）。
    const prewarmStart = performance.now();
    const report = await renderer.prewarm({ materials: [warmMaterial] });
    const prewarmMs = performance.now() - prewarmStart;
    const result = report.results[0]!;
    if (!result.ok || result.pipeline === null) {
      throw new Error(
        `[gpu-device-api] gfx-prewarm example: prewarm failed (mode=${result.mode}, reason=${result.reason ?? '-'}).`,
      );
    }
    if (firstVariant === null) {
      firstVariant = describeVariant(result);
      setData('gfxPrewarmMode', result.mode ?? 'null');
      setData('gfxPrewarmBackendMode', `${renderer.backend}:${result.mode ?? 'null'}`);
      if (result.reason !== null) setData('gfxPrewarmReason', result.reason);
      setData('gfxPrewarmOk', String(report.ok));
      setData('gfxPrewarmInfoMessages', String(result.info.messages.length));
      setData('gfxPrewarmInfoErrors', String(result.info.hasErrors));
    }

    const warmMs = await drawAndWait(warmMaterial);
    if (renderer.stats.drawCalls !== 1) {
      throw new Error(`[gpu-device-api] gfx-prewarm example: expected 1 draw call, got ${renderer.stats.drawCalls}.`);
    }
    const warmSecondMs = await drawAndWait(warmMaterial);

    // 同一条材质再预热一次：必须被跳过（不重复预热），否则说明预热出来的管线没被交回绘制路径。
    const again = await renderer.prewarm({ materials: [warmMaterial] });
    if (again.results[0]!.skipped) skippedSecondCall = true;

    timings.push({
      coldMs,
      coldSecondMs,
      warmMs,
      warmSecondMs,
      prewarmMs,
      mode: result.mode ?? 'null',
      reason: result.reason,
    });
    log(
      `第 ${round + 1} 轮：冷 ${coldMs.toFixed(1)}ms（第二帧 ${coldSecondMs.toFixed(1)}ms） / ` +
        `热 ${warmMs.toFixed(1)}ms（第二帧 ${warmSecondMs.toFixed(1)}ms）` +
        `（预热 ${prewarmMs.toFixed(1)}ms，mode=${result.mode ?? 'null'}，二次预热 skipped=${again.results[0]!.skipped}）`,
    );
  }

  const mean = (pick: (timing: FrameTiming) => number): number =>
    timings.reduce((total, timing) => total + pick(timing), 0) / timings.length;
  const coldMean = mean((timing) => timing.coldMs);
  const coldSecondMean = mean((timing) => timing.coldSecondMs);
  const warmMean = mean((timing) => timing.warmMs);
  const warmSecondMean = mean((timing) => timing.warmSecondMs);
  const prewarmMean = mean((timing) => timing.prewarmMs);
  const delta = coldMean - warmMean;
  const speedup = warmMean > 0 ? coldMean / warmMean : Number.POSITIVE_INFINITY;

  setData('gfxPrewarmColdFrameMs', coldMean.toFixed(2));
  setData('gfxPrewarmColdSecondFrameMs', coldSecondMean.toFixed(2));
  setData('gfxPrewarmWarmFrameMs', warmMean.toFixed(2));
  setData('gfxPrewarmWarmSecondFrameMs', warmSecondMean.toFixed(2));
  setData('gfxPrewarmDeltaFrameMs', delta.toFixed(2));
  setData('gfxPrewarmSpeedup', Number.isFinite(speedup) ? speedup.toFixed(2) : 'inf');
  setData('gfxPrewarmPrewarmMs', prewarmMean.toFixed(2));
  setData('gfxPrewarmRounds', String(rounds));
  setData('gfxPrewarmRoundsColdMs', timings.map((timing) => timing.coldMs.toFixed(1)).join(','));
  setData('gfxPrewarmRoundsColdSecondMs', timings.map((timing) => timing.coldSecondMs.toFixed(1)).join(','));
  setData('gfxPrewarmRoundsWarmMs', timings.map((timing) => timing.warmMs.toFixed(1)).join(','));
  setData('gfxPrewarmSkipped', String(skippedSecondCall));
  setData('gfxPrewarmFaster', String(delta > 0));
  if (firstVariant !== null) setData('gfxPrewarmVariant', firstVariant);
  log(
    `均值：冷 ${coldMean.toFixed(1)}ms → 热 ${warmMean.toFixed(1)}ms（省 ${delta.toFixed(1)}ms，` +
      `快 ${Number.isFinite(speedup) ? speedup.toFixed(2) : 'inf'}×）；冷路径第二帧 ${coldSecondMean.toFixed(1)}ms，` +
      `热路径第二帧 ${warmSecondMean.toFixed(1)}ms；预热本身 ${prewarmMean.toFixed(1)}ms`,
  );

  /* ---- 诊断：从 gfx 层拿编译诊断（含真实行号） --------------------------------------------- */
  const brokenMaterial = renderer.createMaterial({
    name: 'broken',
    attributes: { position: 'float32x3' },
    glsl: { vs: VERTEX_GLSL, fs: BROKEN_GLSL_FS },
    wgsl: `${VERTEX_WGSL}\n\n${BROKEN_WGSL_FS}`,
  });

  // 预热失败**不抛**：结果里 ok=false、pipeline=null，诊断在 info 里。
  const brokenReport = await renderer.prewarm({ materials: [brokenMaterial] });
  const brokenResult = brokenReport.results[0]!;
  setData('gfxPrewarmBrokenOk', String(brokenResult.ok));
  setData('gfxPrewarmBrokenMessages', String(brokenResult.info.messages.length));
  if (brokenResult.reason !== null) setData('gfxPrewarmBrokenReason', brokenResult.reason);

  // 期望行号：用**同一段包装逻辑**算出最终源码，再找出标记所在的行（不是写死的常量）。
  const expectedLine = (() => {
    if (renderer.backend === 'webgl2') {
      const code = compileShaderStage({
        backend: 'webgl2',
        source: { vs: brokenMaterial.glsl.vs, fs: brokenMaterial.glsl.fs },
        stage: ShaderStage.Fragment,
        label: brokenMaterial.name,
      }).code;
      return code.split('\n').findIndex((line) => line.includes(BROKEN_MARKER)) + 1;
    }
    return brokenMaterial.wgsl.split('\n').findIndex((line) => line.includes(BROKEN_MARKER)) + 1;
  })();

  // `renderer.compilationInfo()` 是 gfx 层的诊断入口：`CompilationInfo` 原样透出。
  const info = await renderer.compilationInfo(brokenMaterial);
  const error = info.messages.find((message) => message.type === 'error') ?? null;
  setData('gfxPrewarmBrokenExpectedLine', String(expectedLine));
  setData('gfxPrewarmBrokenLine', error && error.lineNum !== null ? String(error.lineNum) : 'null');
  setData('gfxPrewarmBrokenLabel', error ? error.label : 'none');
  setData('gfxPrewarmBrokenRawLogs', String(info.rawLogs.length));
  if (error) setData('gfxPrewarmBrokenMessage', error.message.replace(/\s+/g, ' ').trim().slice(0, 160));
  log(
    `诊断：ok=${brokenResult.ok} type=${error?.type ?? 'none'} line=${error?.lineNum ?? 'null'}` +
      `（最终源码里的实际行号 ${expectedLine}）`,
  );
  if (error) log(`      ${error.message}`);
  if (info.rawLogs[0]) log(`      raw: ${info.rawLogs[0].split('\n')[0]}`);

  /* ---- 结论 ------------------------------------------------------------------------------- */
  const diagnosticOk =
    brokenResult.ok === false &&
    brokenResult.pipeline === null &&
    error !== null &&
    error.lineNum === expectedLine;
  setData('gfxPrewarmDiagnosticOk', String(diagnosticOk));

  const skippedOk = skippedSecondCall;
  setData('gfxPrewarmSkipsOk', String(skippedOk));

  /*
   * 结论口径：
   * - `fail`：预热失败、诊断行号对不上、或者二次预热没有跳过 —— 这三条是**机制**错了；
   * - `no-speedup`：机制对，但这台机器上首帧没有变快（例如软件光栅化下填充时间主导）。
   *   它不算失败，数字本身会写进 data-*，由抓取方如实报告；
   * - `ok`：机制对，而且首帧确实变快了。
   */
  const mechanismOk = diagnosticOk && skippedOk;
  const result = mechanismOk ? (delta > 0 ? 'ok' : 'no-speedup') : 'fail';
  status.textContent =
    result === 'ok' ? '完成：首帧明显变快' : result === 'no-speedup' ? '机制通过，但首帧没变快' : '机制不符合预期';
  status.className = result === 'fail' ? 'error' : result === 'ok' ? 'ok' : '';
  stats.textContent = `冷 ${coldMean.toFixed(1)}ms → 热 ${warmMean.toFixed(1)}ms`;
  setData('gfxPrewarmResult', result);
  log(`结论：${result}`);
}

/** 把这次预热用的 variant 压成一行，方便无头抓取与肉眼核对。 */
function describeVariant(result: MaterialPrewarmResult): string {
  const variant = result.variant;
  if (!variant) return 'none';
  return (
    `colorFormats=${variant.colorFormats.join(',')}` +
    `;sampleCount=${variant.sampleCount}` +
    `;depthFormat=${variant.depthFormat ?? 'none'}` +
    `;vertexLayouts=${variant.vertexLayouts.length}`
  );
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.message : String(error);
  status.textContent = '失败';
  status.className = 'error';
  log(`错误：${text}`);
  setData('gfxPrewarmError', text.split('\n')[0]!);
  setData('gfxPrewarmResult', 'fail');
});
