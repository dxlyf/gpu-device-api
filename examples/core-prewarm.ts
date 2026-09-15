/**
 * 异步管线预热 + `getCompilationInfo` 的实测页面（core 层）。
 *
 * 这个页面只做两件事，并把结论写进 `<html data-*>` 便于无头浏览器抓取：
 *
 * 1. **预热前 / 预热后的首帧耗时对比**：用一段「很重」的片元着色器（大量展开的语句），
 *    让编译耗时可见。冷路径量「`createRenderPipeline()` + 首个使用该管线的帧（含 `submit()`
 *    与 `queue.onSubmittedWorkDone()` 同步点）」，热路径先 `prewarm()` 再量同一段。
 *    两条路径用的是**两份不同的源码**（盐值不同），否则 WebGL2 的 program 缓存会直接命中，
 *    量出来的「冷路径」其实是热的。
 * 2. **编译诊断的真实行号**：故意写一个编译不过的着色器，把 `CompilationInfo` 里的
 *    `type` / `lineNum` / `linePos` 打出来，并和「标记在最终源码里的实际行号」比对。
 *
 * WebGL2 与 WebGPU 的**编译时机不同**，页面会把 `mode`（async / sync）与后端一起报出来：
 * WebGL2 只有拿到 `KHR_parallel_shader_compile` 才可能真异步；拿不到就是同步降级 ——
 * 这时「预热」的价值只剩「把编译挪到别的代码段里」，不会凭空变快，页面会如实说明。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto`、`?iters=<展开语句条数>`（默认 1200）。
 */

import { ShaderStage, createDeviceWithAdapter } from '../src/index.js';
import { prewarmWebGL2RenderPipeline, programCacheOf } from '../src/webgl2/pipeline/Prewarm.js';
import { prewarmWebGPURenderPipeline } from '../src/webgpu/pipeline/Prewarm.js';
import { compileShaderStage } from '../src/shaders/ShaderCompiler.js';
import { backendFromQuery, requireElement, setData } from './core-shared.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPipeline, RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';

const out = requireElement<HTMLPreElement>('out');
const status = requireElement<HTMLSpanElement>('status');
const stats = requireElement<HTMLSpanElement>('stats');

const lines: string[] = [];
function log(message: string): void {
  lines.push(message);
  out.textContent = lines.join('\n');
}

const query = new URLSearchParams(location.search);
const backend = backendFromQuery(query);
const iterations = Math.max(1, Number(query.get('iters') ?? '1200') || 1200);

/* ------------------------------------------------------------------------------------------------ */
/* 着色器源码                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** 全屏三角形：顶点完全由内置索引生成，不需要顶点缓冲。 */
const VERTEX_GLSL = [
  'void main() {',
  '  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));',
  '  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);',
  '}',
].join('\n');

const VERTEX_WGSL = [
  '@vertex fn vsMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {',
  '  let p = vec2f(f32((index << 1u) & 2u), f32(index & 2u));',
  '  return vec4f(p * 2.0 - 1.0, 0.0, 1.0);',
  '}',
].join('\n');

/**
 * 一段「很重」的片元着色器：`iterations` 条独立语句，每条都依赖上一条的结果，
 * 编译器无法把它们全部折叠掉；`salt` 用来做出内容不同的两份源码。
 */
function heavyFragment(language: 'glsl' | 'wgsl', salt: number): string {
  const head =
    language === 'glsl'
      ? ['precision highp float;', 'out vec4 fragColor;', 'void main() {', `  float acc = ${salt}.5;`]
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
const BROKEN_GLSL_FS = [
  'precision highp float;',
  'out vec4 fragColor;',
  'void main() {',
  '  float value = brokenSymbol;',
  '  fragColor = vec4(value);',
  '}',
].join('\n');

const BROKEN_WGSL = [
  VERTEX_WGSL,
  '@fragment fn fsMain() -> @location(0) vec4f {',
  '  let value = brokenSymbol;',
  '  return vec4f(value);',
  '}',
].join('\n');

const BROKEN_MARKER = 'brokenSymbol';

/* ------------------------------------------------------------------------------------------------ */
/* 主体                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const created = await createDeviceWithAdapter({
    canvas,
    backend,
    label: 'prewarm-example',
    contextAttributes: { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: false },
  });
  if (!created.context) throw new Error('[gpu-device-api] 示例需要 canvas context。');
  const { device, context } = created;
  const device_: Device = device;
  setData('exampleBackend', created.backend);
  log(`后端：${created.backend}；展开语句：${iterations}`);

  // WebGL2 的异步能力取决于这个扩展：先如实报出来，避免把同步降级当异步讲。
  let parallelCompile = 'n/a';
  if (created.backend === 'webgl2') {
    const gl = (device_ as unknown as { native: WebGL2RenderingContext }).native;
    const extension = gl.getExtension('KHR_parallel_shader_compile') as {
      COMPLETION_STATUS_KHR?: number;
    } | null;
    parallelCompile = extension && typeof extension.COMPLETION_STATUS_KHR === 'number' ? 'yes' : 'no';
  }
  setData('prewarmParallelCompile', parallelCompile);

  const colorFormat = context.format;
  const variant = {
    colorFormats: [colorFormat as TextureFormat],
    sampleCount: 1,
    depthFormat: null,
    vertexLayouts: [],
  };

  const buildDescriptor = (salt: number): RenderPipelineDescriptor => {
    const module = device_.createShaderModule({
      label: `heavy-${salt}`,
      code: {
        vs: VERTEX_GLSL,
        fs: heavyFragment('glsl', salt),
        wgsl: `${VERTEX_WGSL}\n\n${heavyFragment('wgsl', salt)}`,
      },
    });
    return {
      label: `heavy-${salt}`,
      vertex: { module, buffers: [] },
      fragment: { module, targets: [{ format: colorFormat }] },
      colorFormats: [colorFormat],
    };
  };

  /** 画一帧并等 GPU 跟上；返回整段耗时。 */
  const drawFrame = async (pipeline: RenderPipeline): Promise<number> => {
    const started = performance.now();
    const encoder = device_.createCommandEncoder({ label: 'prewarm-frame' });
    const descriptor = context.createPassDescriptor({
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: '#101418',
    });
    const pass = encoder.beginRenderPass({
      label: 'prewarm-pass',
      colorAttachments: descriptor.colorAttachments,
      ...(descriptor.depthStencilAttachment
        ? { depthStencilAttachment: descriptor.depthStencilAttachment }
        : {}),
    });
    pass.setPipeline(pipeline);
    pass.draw({ vertexCount: 3 });
    pass.end();
    device_.queue.submit([encoder.finish()]);
    // WebGPU 上首次使用一条管线时编译可能发生在 device timeline 上，不 await 就量不到那段等待。
    await device_.queue.onSubmittedWorkDone();
    return performance.now() - started;
  };

  /* ---- 冷路径：不预热，建管线 + 首帧 ------------------------------------------------------ */
  const coldDescriptor = buildDescriptor(1);
  const coldCreateStart = performance.now();
  const coldPipeline = device_.createRenderPipeline(coldDescriptor);
  const coldCreateMs = performance.now() - coldCreateStart;
  const coldFrameMs = await drawFrame(coldPipeline);
  log(`冷路径：createRenderPipeline ${coldCreateMs.toFixed(1)}ms，首个使用该管线的帧 ${coldFrameMs.toFixed(1)}ms`);
  setData('prewarmColdCreateMs', coldCreateMs.toFixed(2));
  setData('prewarmColdFrameMs', coldFrameMs.toFixed(2));

  /* ---- 热路径：先预热，再建管线 + 首帧 ---------------------------------------------------- */
  const warmDescriptor = buildDescriptor(2);
  let mode = 'n/a';
  let reason: string | null = null;
  let warmPipeline: RenderPipeline;
  let programMs = 0;
  let helperMs = 0;

  if (created.backend === 'webgl2') {
    /*
     * WebGL2 的异步入口必须在 `createRenderPipeline()` **之前**：那个方法内部就会
     * compile + link，一旦进去就晚了。所以这里按「先 compileAsync，再建管线」两步走，
     * 并把两段分别计时 —— 这正是要证明的「卡顿被挪出了关键路径」。
     */
    const label = warmDescriptor.label ?? 'renderPipeline';
    const vertexCode = compileShaderStage({
      backend: 'webgl2',
      source: warmDescriptor.vertex.module.source,
      stage: ShaderStage.Vertex,
      label,
      defines: warmDescriptor.vertex.module.defines,
      glsl: warmDescriptor.vertex.module.glsl,
    }).code;
    const fragmentCode = compileShaderStage({
      backend: 'webgl2',
      source: warmDescriptor.fragment!.module.source,
      stage: ShaderStage.Fragment,
      label,
      defines: warmDescriptor.fragment!.module.defines,
      glsl: warmDescriptor.fragment!.module.glsl,
    }).code;

    const cache = programCacheOf(device_);
    const programStart = performance.now();
    const outcome = await cache.compileAsync(label, vertexCode, fragmentCode);
    programMs = performance.now() - programStart;
    mode = outcome.mode;
    reason = outcome.reason;
    if (!outcome.ok) throw new Error(`[gpu-device-api] 预热失败：${outcome.reason ?? 'unknown'}`);
    setData('prewarmOk', 'true');

    const pipelineStart = performance.now();
    warmPipeline = device_.createRenderPipeline(warmDescriptor);
    const pipelineMs = performance.now() - pipelineStart;
    log(`预热：compileAsync ${programMs.toFixed(1)}ms（mode=${mode}），随后建管线 ${pipelineMs.toFixed(2)}ms`);
    setData('prewarmPipelineMs', pipelineMs.toFixed(2));
  } else {
    // WebGPU：`createRenderPipeline()` 是同步返回、不编译的，异步入口是 createRenderPipelineAsync。
    const prewarmStart = performance.now();
    const result = await prewarmWebGPURenderPipeline(device_, warmDescriptor, variant);
    programMs = performance.now() - prewarmStart;
    mode = result.mode;
    reason = result.reason;
    if (!result.pipeline) throw new Error('[gpu-device-api] 预热没有产出管线。');
    setData('prewarmOk', String(result.ok));
    warmPipeline = result.pipeline;
    log(`预热：prewarmWebGPURenderPipeline ${programMs.toFixed(1)}ms（mode=${mode}）`);
  }

  setData('prewarmMode', mode);
  setData('prewarmPrewarmMs', programMs.toFixed(2));
  if (reason) {
    setData('prewarmReason', reason);
    log(`      降级原因：${reason}`);
  }

  // 首个使用**预热出来的**管线的帧：这是「卡顿有没有被挪出关键路径」最直接的读数。
  const warmFrameMs = await drawFrame(warmPipeline);
  log(`热路径：首个使用预热管线的帧 ${warmFrameMs.toFixed(1)}ms`);
  setData('prewarmWarmFrameMs', warmFrameMs.toFixed(2));

  // 再确认一次：预热之后 `createRenderPipeline()` 只是命中缓存。
  const warmCreateStart = performance.now();
  device_.createRenderPipeline(warmDescriptor);
  const warmCreateMs = performance.now() - warmCreateStart;
  setData('prewarmWarmCreateMs', warmCreateMs.toFixed(2));
  setData('prewarmDeltaCreateMs', (coldCreateMs - warmCreateMs).toFixed(2));
  setData('prewarmDeltaFrameMs', (coldFrameMs - warmFrameMs).toFixed(2));

  /* ---- 设备级封装入口（两段顺序差异被它包住）走一遍，证明它真的产出可用的管线 --------------- */
  const helperDescriptor = buildDescriptor(3);
  const helperStart = performance.now();
  const helperResult =
    created.backend === 'webgl2'
      ? await prewarmWebGL2RenderPipeline(device_, helperDescriptor)
      : await prewarmWebGPURenderPipeline(device_, helperDescriptor, variant);
  helperMs = performance.now() - helperStart;
  setData('prewarmHelperMs', helperMs.toFixed(2));
  setData('prewarmHelperOk', String(helperResult.ok && helperResult.pipeline !== null));
  setData('prewarmHelperMode', helperResult.mode);
  if (helperResult.pipeline) await drawFrame(helperResult.pipeline);
  log(`封装入口：ok=${helperResult.ok} mode=${helperResult.mode} 耗时 ${helperMs.toFixed(1)}ms`);

  /* ---- 诊断：故意编译不过的着色器 -------------------------------------------------------- */
  const source = { vs: VERTEX_GLSL, fs: BROKEN_GLSL_FS, wgsl: BROKEN_WGSL };
  const diagDescriptor: RenderPipelineDescriptor = {
    label: 'broken-shader',
    vertex: { module: device_.createShaderModule({ label: 'broken-shader', code: source }), buffers: [] },
    fragment: {
      module: device_.createShaderModule({ label: 'broken-shader', code: source }),
      targets: [{ format: colorFormat }],
    },
    colorFormats: [colorFormat],
  };

  const diagResult =
    created.backend === 'webgl2'
      ? await prewarmWebGL2RenderPipeline(device_, diagDescriptor)
      : await prewarmWebGPURenderPipeline(device_, diagDescriptor, variant);

  const message = diagResult.info.messages.find((entry) => entry.type === 'error') ?? null;
  setData('prewarmDiagType', message ? message.type : 'none');
  setData('prewarmDiagLine', message && message.lineNum !== null ? String(message.lineNum) : 'null');
  setData('prewarmDiagPos', message && message.linePos !== null ? String(message.linePos) : 'null');
  setData('prewarmDiagLabel', message ? message.label : 'none');
  setData('prewarmDiagOkFlag', String(diagResult.ok));
  setData('prewarmDiagCount', String(diagResult.info.messages.length));
  if (diagResult.reason) setData('prewarmDiagReason', diagResult.reason);
  log(
    `诊断原始：ok=${diagResult.ok} messages=${diagResult.info.messages.length} ` +
      `rawLogs=${diagResult.info.rawLogs.length} reason=${diagResult.reason ?? '-'}`,
  );
  if (diagResult.info.rawLogs[0]) log(`      raw: ${diagResult.info.rawLogs[0].split('\n')[0]}`);

  // 「期望行号」：用同一段包装逻辑算出最终源码，再找出标记所在的行（不是写死的常量）。
  const expectedLine = (() => {
    if (created.backend === 'webgl2') {
      const code = compileShaderStage({
        backend: 'webgl2',
        source: { fs: BROKEN_GLSL_FS },
        stage: ShaderStage.Fragment,
        label: 'broken-shader',
      }).code;
      return code.split('\n').findIndex((line) => line.includes(BROKEN_MARKER)) + 1;
    }
    return BROKEN_WGSL.split('\n').findIndex((line) => line.includes(BROKEN_MARKER)) + 1;
  })();
  setData('prewarmDiagExpectedLine', String(expectedLine));
  log(
    `诊断：type=${message?.type ?? 'none'} line=${message?.lineNum ?? 'null'} ` +
      `pos=${message?.linePos ?? 'null'}（最终源码里的实际行号 ${expectedLine}）`,
  );
  if (message) log(`      ${message.message}`);

  const diagOk = message !== null && message.type === 'error' && message.lineNum === expectedLine;
  setData('prewarmDiagOk', String(diagOk));

  /* ---- 结论 ------------------------------------------------------------------------------ */
  // 通过条件：诊断确实被拿到、行号与最终源码里的实际行号一致、失败没有被吞掉。
  const ok = diagResult.ok === false && diagOk;
  status.textContent = ok ? '完成' : '诊断不符合预期';
  status.className = ok ? '' : 'error';
  stats.textContent = `冷 ${coldFrameMs.toFixed(1)}ms / 热 ${warmFrameMs.toFixed(1)}ms`;
  setData('prewarmResult', ok ? 'pass' : 'fail');
  log(`结论：${ok ? 'pass' : 'fail'}（诊断行号${diagOk ? '匹配' : '不匹配'}）`);
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.message : String(error);
  status.textContent = '失败';
  status.className = 'error';
  log(`错误：${text}`);
  setData('prewarmError', text.split('\n')[0]!);
  setData('prewarmResult', 'fail');
});
