/**
 * 批 13 第一步：`WEBGL_multi_draw` 只读探针 + CPU 提交基准。
 *
 * ⚠️ 这是**开发者探针，不是使用示例**：它不导入本库（`src/`），只读原生 WebGL2 的扩展面与行为。
 *
 * 它回答四个问题，并把答案写进 `document.documentElement.dataset`（供
 * `scripts/verify-headless.mjs` 抓取）：
 *
 * 1. 本机是否暴露 `WEBGL_multi_draw`（连同历史上出现过的别名/前缀候选一起逐个试）；
 * 2. `multiDrawArraysWEBGL` / `multiDrawElementsWEBGL` 及其 instanced 变体，能否画出与
 *    「N 次单独 draw」**逐字节相同**的离屏画面（FBO + `readPixels` 全字节比对）；
 * 3. 单次 multi-draw 调用能承载多大的 drawcount（逐档试到 N = 10000，看是否抛错或画错）；
 * 4. N = 1000 / 10000 下「CPU 提交耗时」「帧延迟」「持续吞吐」的最小/中位/最大值。
 *    单帧 multi-draw 在真机上只要几十微秒，已经贴到 `performance.now()` 的量化下限（0.1ms），
 *    所以三种口径都做了处理：见下面第 6 节的注释。
 *
 * ## 本机实测结论（批 13 第一步，2026-09-16）
 *
 * 两个 WebGL2 后端都**暴露** `WEBGL_multi_draw`（无前缀/别名版本需要），
 * `getSupportedExtensions()` 里含它，且方法 arity 分别是 6/7/8/9 —— 即扩展注册表里的
 * **带 offset 的规范签名**（不是早期提案的短签名，`callNotes` 因此始终为空）。
 *
 * | 后端（无头 Chrome 152） | 扩展 | 4 个入口逐字节一致 | N=10000 逐字节一致 |
 * | --- | --- | --- | --- |
 * | ANGLE Intel UHD(D3D11) 硬件 | 有 | 是（4/4，256 个四边形） | 是 |
 * | SwiftShader（软件 Vulkan） | 有 | 是（4/4） | 是 |
 *
 * 一致性的对照还证明比对本身有分辨力：倒序绘制差 110055/262144 字节、空图差 195840 字节。
 * 真实合成截图（`capture-screenshot` + `compare-screenshots --crop 12,270,256,256 --tolerance 0`）
 * 对 arrays / elements / instanced 三组都是**原样 100.00% 逐字节相同**。
 *
 * 耗时（硬件 D3D11，每帧 10000 个物体）：「提交」18.6ms → ≤0.1ms（贴量化下限），
 * 「全程吞吐均值」32.8ms/帧 → 7.1ms/帧（约 4.6x）；N=1000 时吞吐 0.94ms/帧 → 0.0089ms/帧（约 106x）。
 * 即：**调用次数确实从 N 降到 1、CPU 侧提交成本降了一个数量级以上，但大 drawcount 下
 * 驱动侧仍有按 sub-draw 计的成本，端到端收益远小于调用次数的降幅。** 详见汇报与 `data-benchJson`。
 *
 * 另有两条**对照**用来证明比对本身有分辨力 —— 避免「两边都是空白所以一致」的假通过：
 * 把绘制顺序倒过来、以及什么都不画，两者的字节差都必须 > 0。
 *
 * 几个刻意的设计：
 *
 * - 场景里的四边形**刻意互相重叠 20%**，于是「绘制顺序」也会进最终像素：顺序被打乱的
 *   multi-draw 实现一定会被抓到；
 * - 每个四边形的颜色由 index 哈希得到（确定性，两个路径完全一致）；
 * - 离屏目标固定 256×256 的 `RGBA8` 纹理，`readPixels` 读回后逐字节比对；
 * - 顶点数（`quadCount * 6`）超过 65535 时自动改用 `UNSIGNED_INT` 索引；
 * - 可见 canvas 只受 `?mode=single|multi` 影响，供
 *   `scripts/capture-screenshot.mjs` + `scripts/compare-screenshots.mjs` 做真实合成截图的逐像素佐证。
 */

const outElement = document.getElementById('out');
const viewElement = document.getElementById('view');
const statusElement = document.getElementById('status');
if (!(outElement instanceof HTMLPreElement) || !(viewElement instanceof HTMLCanvasElement)) {
  throw new Error('[gpu-device-api] multi-draw 探针：页面缺少 #out / #view。');
}
const outPanel: HTMLPreElement = outElement;
const viewCanvas: HTMLCanvasElement = viewElement;

const logLines: string[] = [];
function log(message: string): void {
  logLines.push(message);
  outPanel.textContent = logLines.join('\n');
}
function note(message: string): void {
  if (statusElement) statusElement.textContent = message;
}
function set(key: string, value: string | number | boolean): void {
  document.documentElement.dataset[key] = String(value);
}
function finish(result: string): void {
  set('probeResult', result);
  log(`probeResult=${result}`);
}

/** 查询参数。 */
const params = new URLSearchParams(location.search);
function intParam(name: string, fallback: number): number {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}
const CASE_NAMES = ['arrays', 'elements', 'instanced', 'instanced-elements'] as const;
type CaseName = (typeof CASE_NAMES)[number];
const requestedCase = params.get('case') ?? 'arrays';
const caseName: CaseName = (CASE_NAMES as readonly string[]).includes(requestedCase) ? (requestedCase as CaseName) : 'arrays';
const shotMode: 'single' | 'multi' = params.get('mode') === 'multi' ? 'multi' : 'single';
const visibleQuads = Math.max(1, intParam('scene', 1024));
const benchEnabled = params.get('bench') !== '0';
const bigEnabled = params.get('big') !== '0';
const submitRepsOverride = intParam('submitReps', 0);
const finishRepsOverride = intParam('finishReps', 0);

/** 一个四边形 = 两个三角形 = 6 个顶点，每个顶点 5 个 float（x, y, r, g, b）。 */
const QUAD_VERTICES = 6;
const FLOATS_PER_VERTEX = 5;
/** 离屏目标边长（像素）。 */
const TARGET_SIZE = 256;

type MultiDrawFn = (...args: (number | Int32Array)[]) => void;
interface MultiDrawExtension {
  multiDrawArraysWEBGL?: MultiDrawFn;
  multiDrawElementsWEBGL?: MultiDrawFn;
  multiDrawArraysInstancedWEBGL?: MultiDrawFn;
  multiDrawElementsInstancedWEBGL?: MultiDrawFn;
}
type CallForm = 'offsets' | 'legacy';

const EXTENSION_CANDIDATES = [
  'WEBGL_multi_draw',
  'WEBGL_multi_draw_instanced',
  'WEBGL_multi_draw_instanced_arrays',
  'EXT_multi_draw',
  'MOZ_WEBGL_multi_draw',
] as const;
const FUNCTION_NAMES = [
  'multiDrawArraysWEBGL',
  'multiDrawElementsWEBGL',
  'multiDrawArraysInstancedWEBGL',
  'multiDrawElementsInstancedWEBGL',
] as const;

interface MultiArgs {
  readonly name: string;
  readonly fn: MultiDrawFn | undefined;
  /** 规范签名（WebGL 扩展注册表里的带 offset 版本）。 */
  readonly offsets: (number | Int32Array)[];
  /** 更早的提案签名（不带 offset），仅在规范签名抛错时才试。 */
  readonly legacy: (number | Int32Array)[];
}
interface Scene {
  readonly quadCount: number;
  readonly vao: WebGLVertexArrayObject;
  readonly vertexBuffer: WebGLBuffer;
  readonly indexBuffer: WebGLBuffer;
  readonly indexType: number;
  readonly indexBytes: number;
}
interface DiffReport {
  readonly totalBytes: number;
  readonly diffBytes: number;
  readonly maxChannelDiff: number;
  readonly firstDiffIndex: number;
}
interface Summary {
  min: number;
  median: number;
  max: number;
}
interface Comparison {
  readonly label: string;
  readonly caseName: CaseName;
  readonly quadCount: number;
  readonly match: boolean;
  readonly glError: string;
  readonly multiError: string | null;
  readonly form: CallForm;
  readonly diff: DiffReport;
  readonly baselinePixels: number;
  readonly centerSingle: string;
  readonly centerMulti: string;
  readonly legacyMatch: boolean | null;
}
interface BenchEntry {
  label: string;
  caseName: CaseName;
  quadCount: number;
  singleCallsPerFrame: number;
  multiCallsPerFrame: number;
  submitSamples: number;
  latencySamples: number;
  /** throughput 口径下每个时间样本包含多少帧（中位数；样本按「连续提交到 ~60ms」自适应）。 */
  throughputFramesSingle: number;
  throughputFramesMulti: number;
  submitSingle: Summary;
  submitMulti: Summary;
  latencySingle: Summary;
  latencyMulti: Summary;
  throughputSingle: Summary;
  throughputMulti: Summary;
  /** 整个吞吐阶段的总耗时 / 总帧数（比逐样本中位数稳，包含首样本的「延迟执行」效应）。 */
  throughputOverallSingle: number;
  throughputOverallMulti: number;
  glError: string;
  multiError: string | null;
  form: CallForm;
  wallMs: number;
}

/* ------------------------------------------------------------------------------------------------ */
/* 探针主体                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function runProbe(): void {
  const glOrNull = viewCanvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    premultipliedAlpha: false,
    powerPreference: 'default',
  });
  if (!glOrNull) throw new Error('webgl2 上下文创建失败');
  const gl: WebGL2RenderingContext = glOrNull;

  note('正在探测扩展…');
  set('probeNote', 'batch13-step1 webgl2-multi-draw-probe');
  set('shotCase', caseName);
  set('shotMode', shotMode);
  set('visibleQuads', visibleQuads);
  set('probeParams', JSON.stringify({ case: caseName, mode: shotMode, scene: visibleQuads, bench: benchEnabled, big: bigEnabled }));

  /* ---------------- 1. 扩展可用性 ---------------- */

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as {
    readonly UNMASKED_VENDOR_WEBGL: number;
    readonly UNMASKED_RENDERER_WEBGL: number;
  } | null;
  const vendor = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR));
  const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  const version = String(gl.getParameter(gl.VERSION));
  const supportedExtensions = gl.getSupportedExtensions() ?? [];
  const attributes = gl.getContextAttributes();

  let extension: MultiDrawExtension | null = null;
  const availability: string[] = [];
  for (const candidate of EXTENSION_CANDIDATES) {
    const obtained = gl.getExtension(candidate) as MultiDrawExtension | null;
    availability.push(`${candidate}=${obtained ? 'non-null' : 'null'}`);
    if (obtained && !extension) extension = obtained;
  }

  set('glVendor', vendor);
  set('glRenderer', renderer);
  set('glVersion', version);
  set('contextAttributes', attributes ? JSON.stringify({ antialias: attributes.antialias, alpha: attributes.alpha, depth: attributes.depth, preserveDrawingBuffer: attributes.preserveDrawingBuffer }) : 'null');
  set('candidateExtensions', availability.join(' '));
  set('supportedExtensionCount', supportedExtensions.length);
  set('supportedHasMultiDraw', supportedExtensions.includes('WEBGL_multi_draw'));

  log('==== 1. 扩展可用性 ====');
  log(`gl.VERSION   = ${version}`);
  log(`GL_VENDOR    = ${String(gl.getParameter(gl.VENDOR))}`);
  log(`GL_RENDERER  = ${String(gl.getParameter(gl.RENDERER))}`);
  log(`UNMASKED     = ${vendor} / ${renderer}`);
  log(`getSupportedExtensions() 共 ${supportedExtensions.length} 项，含 WEBGL_multi_draw = ${supportedExtensions.includes('WEBGL_multi_draw')}`);
  log(`候选逐个试：${availability.join('　')}`);

  if (!extension) {
    // 探针的「扩展不可用」结论路径：如实记录并停止，不做任何模拟。
    set('extSupported', 'false');
    set('verdict', 'extension-unavailable');
    set('multiDrawFunctions', JSON.stringify(Object.fromEntries(FUNCTION_NAMES.map((name) => [name, 'absent']))));
    log('结论：本机**未暴露** WEBGL_multi_draw → 按任务书要求停止，不模拟、不实现。');
    note('扩展不可用：探针到此为止。');
    finish('pass');
    return;
  }
  const multiDrawExtension: MultiDrawExtension = extension;
  const functionReports: Record<string, string> = {};
  for (const name of FUNCTION_NAMES) {
    const candidate = multiDrawExtension[name];
    functionReports[name] = typeof candidate === 'function' ? `function(arity=${candidate.length})` : 'absent';
  }
  set('extSupported', 'true');
  set('multiDrawFunctions', JSON.stringify(functionReports));
  log(`扩展对象上的四个方法：${JSON.stringify(functionReports)}`);

  /* ---------------- 2. 程序 / 场景 / 离屏目标 ---------------- */

  function compileShader(type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('createShader 返回 null');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`着色器编译失败：${String(gl.getShaderInfoLog(shader))}`);
    }
    return shader;
  }
  const FRAGMENT_SOURCE = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 outColor;
void main() {
  outColor = vec4(vColor, 1.0);
}
`;
  const COLORED_VERTEX_SOURCE = `#version 300 es
in vec2 aPos;
in vec3 aColor;
out vec3 vColor;
void main() {
  vColor = aColor;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
  const INSTANCED_VERTEX_SOURCE = `#version 300 es
in vec2 aPos;
out vec3 vColor;
void main() {
  // 颜色只取决于实例号。InstanceID 每次 draw 都从 0 重新开始，所以
  // 「N 次 drawArraysInstanced」与「一次 multiDrawArraysInstancedWEBGL」必须完全一致。
  float t = float(gl_InstanceID) * 0.6180339887;
  vColor = vec3(fract(t), fract(t * 1.7 + 0.31), fract(t * 2.3 + 0.77));
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
  function buildProgram(vertexSource: string): WebGLProgram {
    const vertex = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    const program = gl.createProgram();
    if (!program) throw new Error('createProgram 返回 null');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    // 固定 attribute 位置：VAO 按位置配置。着色器里不存在的名字会被忽略。
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.bindAttribLocation(program, 1, 'aColor');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`程序链接失败：${String(gl.getProgramInfoLog(program))}`);
    }
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return program;
  }
  const coloredProgram = buildProgram(COLORED_VERTEX_SOURCE);
  const instancedProgram = buildProgram(INSTANCED_VERTEX_SOURCE);
  log('程序编译链接完成（colored / instanced）。');

  /** 确定性哈希：同一个 index 在两个路径里必须给出同一个字节。 */
  function hashByte(value: number, salt: number): number {
    let hash = (Math.imul(value, 2654435761) + Math.imul(salt, 40503)) >>> 0;
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0x5bd1e995) >>> 0;
    hash ^= hash >>> 15;
    return hash & 0xff;
  }
  function hashUnit(value: number, salt: number): number {
    return hashByte(value, salt) / 255;
  }

  let currentScene: Scene | null = null;
  function ensureScene(quadCount: number): Scene {
    if (currentScene && currentScene.quadCount === quadCount) return currentScene;
    if (currentScene) {
      gl.deleteVertexArray(currentScene.vao);
      gl.deleteBuffer(currentScene.vertexBuffer);
      gl.deleteBuffer(currentScene.indexBuffer);
      currentScene = null;
    }
    const columns = Math.max(1, Math.ceil(Math.sqrt(quadCount)));
    const rows = Math.max(1, Math.ceil(quadCount / columns));
    const cellWidth = 2 / columns;
    const cellHeight = 2 / rows;
    const vertices = new Float32Array(quadCount * QUAD_VERTICES * FLOATS_PER_VERTEX);
    const useUint32 = quadCount * QUAD_VERTICES > 65535;
    const indices: Uint16Array | Uint32Array = useUint32
      ? new Uint32Array(quadCount * QUAD_VERTICES)
      : new Uint16Array(quadCount * QUAD_VERTICES);
    for (let quad = 0; quad < quadCount; quad += 1) {
      const column = quad % columns;
      const row = Math.floor(quad / columns);
      const jitter = hashUnit(quad, 7);
      const x0 = -1 + column * cellWidth;
      const y0 = -1 + row * cellHeight;
      // 刻意放大约 20%：相邻四边形互相重叠，绘制顺序会进最终像素。
      const x1 = Math.min(1, x0 + cellWidth * 1.2);
      const y1 = Math.min(1, y0 + cellHeight * (1.2 + jitter * 0.6));
      const red = hashUnit(quad, 1);
      const green = hashUnit(quad, 2);
      const blue = hashUnit(quad, 3);
      const corners: readonly number[] = [x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1];
      for (let vertex = 0; vertex < QUAD_VERTICES; vertex += 1) {
        const base = (quad * QUAD_VERTICES + vertex) * FLOATS_PER_VERTEX;
        vertices[base] = corners[vertex * 2];
        vertices[base + 1] = corners[vertex * 2 + 1];
        vertices[base + 2] = red;
        vertices[base + 3] = green;
        vertices[base + 4] = blue;
        indices[quad * QUAD_VERTICES + vertex] = quad * QUAD_VERTICES + vertex;
      }
    }
    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    if (!vao || !vertexBuffer || !indexBuffer) throw new Error('创建 VAO / buffer 失败');
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const stride = FLOATS_PER_VERTEX * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 2 * 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const created: Scene = {
      quadCount,
      vao,
      vertexBuffer,
      indexBuffer,
      indexType: useUint32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      indexBytes: useUint32 ? 4 : 2,
    };
    currentScene = created;
    return created;
  }

  const targetTexture = gl.createTexture();
  const targetFramebuffer = gl.createFramebuffer();
  if (!targetTexture || !targetFramebuffer) throw new Error('创建离屏附件失败');
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, TARGET_SIZE, TARGET_SIZE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
  const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (framebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`离屏 FBO 不完整：0x${framebufferStatus.toString(16)}`);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  /** 统一的绘制前置状态：关掉一切会影响像素的开关。 */
  function resetDrawState(): void {
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    gl.colorMask(true, true, true, true);
  }

  function renderToTarget(draw: () => void): Uint8Array {
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
    gl.viewport(0, 0, TARGET_SIZE, TARGET_SIZE);
    resetDrawState();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw();
    const pixels = new Uint8Array(TARGET_SIZE * TARGET_SIZE * 4);
    gl.readPixels(0, 0, TARGET_SIZE, TARGET_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return pixels;
  }

  const GL_ERROR_NAMES = new Map<number, string>([
    [gl.NO_ERROR, 'NO_ERROR'],
    [gl.INVALID_ENUM, 'INVALID_ENUM'],
    [gl.INVALID_VALUE, 'INVALID_VALUE'],
    [gl.INVALID_OPERATION, 'INVALID_OPERATION'],
    [gl.INVALID_FRAMEBUFFER_OPERATION, 'INVALID_FRAMEBUFFER_OPERATION'],
    [gl.OUT_OF_MEMORY, 'OUT_OF_MEMORY'],
    [gl.CONTEXT_LOST_WEBGL, 'CONTEXT_LOST_WEBGL'],
  ]);
  function readGlError(): string {
    const code = gl.getError();
    return GL_ERROR_NAMES.get(code) ?? `0x${code.toString(16)}`;
  }
  function clearGlErrors(): void {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (gl.getError() === gl.NO_ERROR) return;
    }
  }

  /* ---------------- 3. 单次 draw vs multi-draw ---------------- */

  const argCache = new Map<string, Int32Array>();
  function int32ArrayFor(key: string, length: number, fill: (index: number) => number): Int32Array {
    const cached = argCache.get(key);
    if (cached && cached.length === length) return cached;
    const created = new Int32Array(length);
    for (let index = 0; index < length; index += 1) created[index] = fill(index);
    argCache.set(key, created);
    return created;
  }
  const instanceCountsFor = (quadCount: number): Int32Array =>
    int32ArrayFor(`instances:${quadCount}`, quadCount, (index) => 1 + (index % 3));

  function buildMultiArgs(target: Scene, quadCount: number, which: CaseName): MultiArgs {
    switch (which) {
      case 'arrays': {
        const firsts = int32ArrayFor(`firsts:${quadCount}`, quadCount, (index) => index * QUAD_VERTICES);
        const counts = int32ArrayFor(`counts:${quadCount}`, quadCount, () => QUAD_VERTICES);
        return {
          name: 'multiDrawArraysWEBGL',
          fn: multiDrawExtension.multiDrawArraysWEBGL,
          offsets: [gl.TRIANGLES, firsts, 0, counts, 0, quadCount],
          legacy: [gl.TRIANGLES, firsts, counts, quadCount],
        };
      }
      case 'elements': {
        const counts = int32ArrayFor(`counts:${quadCount}`, quadCount, () => QUAD_VERTICES);
        const byteOffsets = int32ArrayFor(`byteOffsets:${quadCount}`, quadCount, (index) => index * QUAD_VERTICES * target.indexBytes);
        return {
          name: 'multiDrawElementsWEBGL',
          fn: multiDrawExtension.multiDrawElementsWEBGL,
          offsets: [gl.TRIANGLES, counts, 0, target.indexType, byteOffsets, 0, quadCount],
          legacy: [gl.TRIANGLES, counts, target.indexType, byteOffsets, quadCount],
        };
      }
      case 'instanced': {
        // 每个 draw 画不同的四边形（first 逐 draw 递增），只有 instanceCount 逐 draw 不同：
        // 这样既能验证 instanceCounts 数组被真正遵守，也能覆盖整张画面。
        const firsts = int32ArrayFor(`firsts:${quadCount}`, quadCount, (index) => index * QUAD_VERTICES);
        const counts = int32ArrayFor(`counts:${quadCount}`, quadCount, () => QUAD_VERTICES);
        const instances = instanceCountsFor(quadCount);
        return {
          name: 'multiDrawArraysInstancedWEBGL',
          fn: multiDrawExtension.multiDrawArraysInstancedWEBGL,
          offsets: [gl.TRIANGLES, firsts, 0, counts, 0, instances, 0, quadCount],
          legacy: [gl.TRIANGLES, firsts, counts, instances, quadCount],
        };
      }
      case 'instanced-elements': {
        const counts = int32ArrayFor(`counts:${quadCount}`, quadCount, () => QUAD_VERTICES);
        const byteOffsets = int32ArrayFor(`byteOffsets:${quadCount}`, quadCount, (index) => index * QUAD_VERTICES * target.indexBytes);
        const instances = instanceCountsFor(quadCount);
        return {
          name: 'multiDrawElementsInstancedWEBGL',
          fn: multiDrawExtension.multiDrawElementsInstancedWEBGL,
          offsets: [gl.TRIANGLES, counts, 0, target.indexType, byteOffsets, 0, instances, 0, quadCount],
          legacy: [gl.TRIANGLES, counts, target.indexType, byteOffsets, instances, quadCount],
        };
      }
    }
  }

  /**
   * 只负责「调用 + 捕获抛错」，由调用方决定用哪种签名。
   *
   * 注意 `fn.call(multiDrawExtension, ...)`：WebGL 扩展对象上的方法是 WebIDL operation，
   * 必须带正确的 receiver —— 把方法摘下来裸调会得到 `TypeError: Illegal invocation`
   * （这个探针第一版就踩了，是它自己先把结论纠正过来的）。
   */
  function invokeMulti(fn: MultiDrawFn, form: CallForm, args: MultiArgs): string | null {
    try {
      if (form === 'offsets') fn.call(multiDrawExtension, ...args.offsets);
      else fn.call(multiDrawExtension, ...args.legacy);
      return null;
    } catch (error) {
      return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  }

  const chosenForm = new Map<string, CallForm>();
  const callNotes: string[] = [];

  /**
   * 用 multi-draw 画同一个场景。返回实际使用的签名形式与抛错信息。
   * 第一次调用时先试规范签名，抛错才回退旧签名，并把结论记下来。
   */
  function drawMulti(target: Scene, quadCount: number, which: CaseName, forcedForm?: CallForm): { form: CallForm; error: string | null } {
    const args = buildMultiArgs(target, quadCount, which);
    const fn = args.fn;
    if (!fn) return { form: 'offsets', error: `fn-absent:${args.name}` };
    if (forcedForm) return { form: forcedForm, error: invokeMulti(fn, forcedForm, args) };
    const cached = chosenForm.get(args.name);
    if (cached) return { form: cached, error: invokeMulti(fn, cached, args) };
    const offsetError = invokeMulti(fn, 'offsets', args);
    if (offsetError === null) {
      chosenForm.set(args.name, 'offsets');
      return { form: 'offsets', error: null };
    }
    callNotes.push(`${args.name}: 规范签名（带 offset）抛错 ${offsetError} → 改试旧签名`);
    const legacyError = invokeMulti(fn, 'legacy', args);
    if (legacyError === null) {
      chosenForm.set(args.name, 'legacy');
      return { form: 'legacy', error: null };
    }
    callNotes.push(`${args.name}: 旧签名也抛错 ${legacyError}`);
    chosenForm.set(args.name, 'offsets');
    return { form: 'offsets', error: offsetError };
  }

  function bindProgramAndScene(target: Scene, which: CaseName): void {
    const instanced = which === 'instanced' || which === 'instanced-elements';
    gl.useProgram(instanced ? instancedProgram : coloredProgram);
    gl.bindVertexArray(target.vao);
  }

  function drawSingle(target: Scene, quadCount: number, which: CaseName): void {
    bindProgramAndScene(target, which);
    const instanceCounts = instanceCountsFor(quadCount);
    for (let quad = 0; quad < quadCount; quad += 1) {
      switch (which) {
        case 'arrays':
          gl.drawArrays(gl.TRIANGLES, quad * QUAD_VERTICES, QUAD_VERTICES);
          break;
        case 'elements':
          gl.drawElements(gl.TRIANGLES, QUAD_VERTICES, target.indexType, quad * QUAD_VERTICES * target.indexBytes);
          break;
        case 'instanced':
          gl.drawArraysInstanced(gl.TRIANGLES, quad * QUAD_VERTICES, QUAD_VERTICES, instanceCounts[quad]);
          break;
        case 'instanced-elements':
          gl.drawElementsInstanced(gl.TRIANGLES, QUAD_VERTICES, target.indexType, quad * QUAD_VERTICES * target.indexBytes, instanceCounts[quad]);
          break;
      }
    }
    gl.bindVertexArray(null);
  }

  /* ---------------- 4. 逐字节比对 ---------------- */

  function compareBytes(left: Uint8Array, right: Uint8Array): DiffReport {
    const length = Math.min(left.length, right.length);
    let diffBytes = 0;
    let maxChannelDiff = 0;
    let firstDiffIndex = -1;
    for (let index = 0; index < length; index += 1) {
      const delta = Math.abs(left[index] - right[index]);
      if (delta === 0) continue;
      diffBytes += 1;
      if (firstDiffIndex < 0) firstDiffIndex = index;
      if (delta > maxChannelDiff) maxChannelDiff = delta;
    }
    return { totalBytes: length, diffBytes, maxChannelDiff, firstDiffIndex };
  }
  function nonBlackPixels(pixels: Uint8Array): number {
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] !== 0 || pixels[index + 1] !== 0 || pixels[index + 2] !== 0) count += 1;
    }
    return count;
  }
  function pixelAt(pixels: Uint8Array, x: number, y: number): string {
    const index = (y * TARGET_SIZE + x) * 4;
    return `${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${pixels[index + 3]}`;
  }

  function compareCase(label: string, quadCount: number, which: CaseName): Comparison {
    const target = ensureScene(quadCount);
    const baseline = renderToTarget(() => {
      drawSingle(target, quadCount, which);
    });
    clearGlErrors();
    const holder: { form: CallForm; error: string | null; legacyError: string | null } = {
      form: 'offsets',
      error: null,
      legacyError: null,
    };
    const multi = renderToTarget(() => {
      bindProgramAndScene(target, which);
      const result = drawMulti(target, quadCount, which);
      holder.form = result.form;
      holder.error = result.error;
      gl.bindVertexArray(null);
    });
    const diff = compareBytes(baseline, multi);
    const glError = readGlError();

    // 逐字节不一致时额外试一次「旧签名」：这样报告能区分
    // 「调用签名用错了」与「这个实现画出来的就是不一样」。
    let legacyMatch: boolean | null = null;
    if (diff.diffBytes > 0 && holder.error === null && holder.form === 'offsets') {
      const legacyPixels = renderToTarget(() => {
        bindProgramAndScene(target, which);
        const result = drawMulti(target, quadCount, which, 'legacy');
        holder.legacyError = result.error;
        gl.bindVertexArray(null);
      });
      legacyMatch = compareBytes(baseline, legacyPixels).diffBytes === 0;
    }

    return {
      label,
      caseName: which,
      quadCount,
      match: diff.diffBytes === 0,
      glError,
      multiError: holder.error,
      form: holder.form,
      diff,
      baselinePixels: nonBlackPixels(baseline),
      centerSingle: pixelAt(baseline, TARGET_SIZE >> 1, TARGET_SIZE >> 1),
      centerMulti: pixelAt(multi, TARGET_SIZE >> 1, TARGET_SIZE >> 1),
      legacyMatch,
    };
  }

  /* ---------------- 5. 一致性套件 ---------------- */

  note('正在跑一致性检查…');
  const comparisons: Comparison[] = [];
  const SMALL_QUADS = 256;
  for (const which of CASE_NAMES) {
    comparisons.push(compareCase(`${which}@${SMALL_QUADS}`, SMALL_QUADS, which));
  }
  if (bigEnabled) comparisons.push(compareCase('arrays@10000', 10000, 'arrays'));

  log('');
  log('==== 2. 逐字节一致性（离屏 FBO 256x256 RGBA8，readPixels 全字节比对）====');
  for (const entry of comparisons) {
    log(
      `  ${entry.label.padEnd(24)} 一致=${entry.match ? 'YES' : 'NO '}　形式=${entry.form}　` +
        `差异字节=${entry.diff.diffBytes}/${entry.diff.totalBytes}　最大通道差=${entry.diff.maxChannelDiff}　首个差异=${entry.diff.firstDiffIndex}　` +
        `非黑像素=${entry.baselinePixels}　glError=${entry.glError}` +
        (entry.multiError ? `　multi 抛错=${entry.multiError}` : '') +
        (entry.legacyMatch === null ? '' : `　旧签名也一致=${entry.legacyMatch}`),
    );
    log(`      中心像素：单独 draw=${entry.centerSingle}　multi-draw=${entry.centerMulti}`);
  }
  set(
    'consistencyJson',
    JSON.stringify(
      comparisons.map((entry) => ({
        label: entry.label,
        caseName: entry.caseName,
        quadCount: entry.quadCount,
        match: entry.match,
        form: entry.form,
        diffBytes: entry.diff.diffBytes,
        totalBytes: entry.diff.totalBytes,
        maxChannelDiff: entry.diff.maxChannelDiff,
        firstDiffIndex: entry.diff.firstDiffIndex,
        baselinePixels: entry.baselinePixels,
        glError: entry.glError,
        multiError: entry.multiError,
        legacyMatch: entry.legacyMatch,
      })),
    ),
  );
  for (const entry of comparisons) {
    const key = entry.label.replace(/[^A-Za-z0-9]/g, '');
    set(`${key}Match`, entry.match ? 'true' : 'false');
    set(`${key}DiffBytes`, entry.diff.diffBytes);
  }
  set(
    'maxWorkingDrawCount',
    String(
      comparisons
        .filter((entry) => entry.match && entry.glError === 'NO_ERROR' && entry.multiError === null)
        .reduce((best, entry) => Math.max(best, entry.quadCount), 0),
    ),
  );

  // 对照组：证明这套比对有分辨力（否则「两边都空白」也会显示一致）。
  const controlScene = ensureScene(SMALL_QUADS);
  const controlBaseline = renderToTarget(() => {
    drawSingle(controlScene, SMALL_QUADS, 'arrays');
  });
  const controlReversed = renderToTarget(() => {
    bindProgramAndScene(controlScene, 'arrays');
    for (let quad = SMALL_QUADS - 1; quad >= 0; quad -= 1) {
      gl.drawArrays(gl.TRIANGLES, quad * QUAD_VERTICES, QUAD_VERTICES);
    }
    gl.bindVertexArray(null);
  });
  const controlBlank = renderToTarget(() => {
    // 只清屏，什么都不画。
  });
  const controlOrderDiff = compareBytes(controlBaseline, controlReversed);
  const controlBlankDiff = compareBytes(controlBaseline, controlBlank);
  const controlPixels = nonBlackPixels(controlBaseline);
  set('controlOrderDiffBytes', controlOrderDiff.diffBytes);
  set('controlBlankDiffBytes', controlBlankDiff.diffBytes);
  set('controlDrawnPixels', controlPixels);
  log(
    `  对照组（必须 > 0）：倒序差异字节=${controlOrderDiff.diffBytes}　空图差异字节=${controlBlankDiff.diffBytes}　` +
      `基准非黑像素=${controlPixels}/${TARGET_SIZE * TARGET_SIZE}`,
  );

  /* ---------------- 6. CPU 提交耗时基准 ---------------- */

  function medianOf(values: number[]): number {
    if (values.length === 0) return Number.NaN;
    const sorted = [...values].sort((left, right) => left - right);
    const middle = sorted.length >> 1;
    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }
  function summarize(values: number[]): Summary {
    if (values.length === 0) return { min: Number.NaN, median: Number.NaN, max: Number.NaN };
    return { min: Math.min(...values), median: medianOf(values), max: Math.max(...values) };
  }
  const round4 = (value: number): number => (Number.isFinite(value) ? Math.round(value * 10000) / 10000 : -1);
  const roundedSummary = (values: number[]): Summary => {
    const summary = summarize(values);
    return { min: round4(summary.min), median: round4(summary.median), max: round4(summary.max) };
  };

  /**
   * 一小段「每帧成本」的测量。
   *
   * 三种口径，都是为了绕开 `performance.now()` 的量化下限（真机上单帧 multi-draw 只有
   * 几十微秒，直接测单帧全是 0/0.1）并区分「CPU 提交」与「真正跑完」：
   *
   * - `submit`：每个时间样本前先 `gl.finish()` 把队列排空，**只计调 GL 的时间**（不计 finish）
   *   —— 这是最接近「CPU 提交成本」的口径；队列空时驱动不会阻塞。
   * - `latency`：同样先排空队列，但**每帧都等到 `gl.finish()` 返回** —— 帧延迟口径。
   * - `throughput`：先排空队列，然后**连续 K 帧**（只在末尾 finish 一次）再除以 K
   *   —— 持续提交下的吞吐口径。K 由单帧延迟估出来（目标 ~60ms/样本）。
   *   实测每帧成本会随连续提交变长（驱动的延迟批处理/driver overhead），
   *   所以这一列通常明显高于 `latency`，两个都要看。
   */
  function measureFrames(submit: () => void, complete: boolean, frames: number, preFinish: boolean): number {
    if (preFinish) gl.finish();
    const start = performance.now();
    for (let frame = 0; frame < frames; frame += 1) {
      submit();
      if (complete) gl.finish();
    }
    return (performance.now() - start) / frames;
  }
  /**
   * 一直提交到累计耗时达到 `targetMs`（但不超过 `maxFrames` 帧），返回「每帧 ms」与实际帧数。
   *
   * 为什么不能先估 K 再跑固定帧数：多帧成本会随连续提交大幅上升（实测差到 90 倍），
   * 用「空闲队列的单帧成本」外推出来的 K 可能让一个样本跑到几分钟 —— 探针本身在
   * swiftshader 上就把自己挂死过一次。这个循环每帧都会重新看表，最多只会超出目标一帧。
   */
  function measureUntil(submit: () => void, complete: boolean, targetMs: number, maxFrames: number): { perFrame: number; frames: number } {
    gl.finish();
    const start = performance.now();
    let frames = 0;
    let elapsed = 0;
    do {
      submit();
      if (complete) gl.finish();
      frames += 1;
      elapsed = performance.now() - start;
    } while (elapsed < targetMs && frames < maxFrames);
    return { perFrame: elapsed / frames, frames };
  }
  /**
   * 「空闲队列」口径：每个样本前先 `gl.finish()` 排空，样本后**再排空一次但不计时**。
   *
   * 后一次排空很关键：不排空的话，10000 次 draw 的积压会让下一帧的「提交」在命令缓冲满时
   * 直接阻塞 —— swiftshader 上实测到过一个样本卡了 40 秒（那是队列背压，不是提交成本）。
   */
  function sampleIdle(submit: () => void, sampleCount: number, complete: boolean, budgetMs: number): number[] {
    const perFrame: number[] = [];
    const startedAt = performance.now();
    for (let sample = 0; sample < sampleCount; sample += 1) {
      gl.finish();
      const start = performance.now();
      submit();
      if (complete) gl.finish();
      perFrame.push(performance.now() - start);
      gl.finish();
      if (performance.now() - startedAt > budgetMs) break;
    }
    return perFrame;
  }
  /** 吞吐口径：每个样本都是「连续提交到 ~targetMs」，再除以帧数；样本数受 budgetMs 约束。 */
  function sampleThroughput(
    submit: () => void,
    targetMs: number,
    sampleCount: number,
    budgetMs: number,
  ): { perFrame: number[]; framesPerSample: number[]; perFrameOverall: number } {
    const perFrame: number[] = [];
    const framesPerSample: number[] = [];
    let totalFrames = 0;
    const startedAt = performance.now();
    for (let sample = 0; sample < sampleCount; sample += 1) {
      const measured = measureUntil(submit, false, targetMs, 512);
      perFrame.push(measured.perFrame);
      framesPerSample.push(measured.frames);
      totalFrames += measured.frames;
      if (performance.now() - startedAt > budgetMs) break;
    }
    const elapsed = performance.now() - startedAt;
    return { perFrame, framesPerSample, perFrameOverall: totalFrames > 0 ? elapsed / totalFrames : Number.NaN };
  }

  function benchCase(label: string, quadCount: number, which: CaseName): BenchEntry {
    const target = ensureScene(quadCount);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
    gl.viewport(0, 0, TARGET_SIZE, TARGET_SIZE);
    resetDrawState();
    gl.clearColor(0, 0, 0, 1);

    const submitSingle = (): void => {
      drawSingle(target, quadCount, which);
    };
    const holder: { form: CallForm; error: string | null } = { form: 'offsets', error: null };
    const submitMulti = (): void => {
      bindProgramAndScene(target, which);
      const result = drawMulti(target, quadCount, which);
      holder.form = result.form;
      holder.error = result.error;
      gl.bindVertexArray(null);
    };

    const wallStart = performance.now();
    // 预热：把管线状态、扩展方法的签名解析、显存分配都做掉。
    measureFrames(submitSingle, true, 2, true);
    measureFrames(submitMulti, true, 2, true);

    const submitSamples = submitRepsOverride > 0 ? submitRepsOverride : 11;
    const latencySamples = finishRepsOverride > 0 ? finishRepsOverride : 7;
    // 提交成本：队列排空后只测调用本身（不 finish；样本后再排空但不计时）。
    const submitTimesSingle = sampleIdle(submitSingle, submitSamples, false, 1500);
    const submitTimesMulti = sampleIdle(submitMulti, submitSamples, false, 1500);
    // 帧延迟：队列排空后每帧等到 finish 返回。
    const latencyTimesSingle = sampleIdle(submitSingle, latencySamples, true, 4000);
    const latencyTimesMulti = sampleIdle(submitMulti, latencySamples, true, 4000);
    // 吞吐：连续提交到 ~60ms 为一个样本；帧数由循环自己决定（慢后端不会挂死）。
    const throughputSingle = sampleThroughput(submitSingle, 60, 5, 2000);
    const throughputMulti = sampleThroughput(submitMulti, 60, 5, 2000);
    gl.finish();

    return {
      label,
      caseName: which,
      quadCount,
      singleCallsPerFrame: quadCount,
      multiCallsPerFrame: holder.error ? 0 : 1,
      submitSamples: submitTimesSingle.length,
      latencySamples: latencyTimesSingle.length,
      throughputFramesSingle: medianOf(throughputSingle.framesPerSample),
      throughputFramesMulti: medianOf(throughputMulti.framesPerSample),
      submitSingle: roundedSummary(submitTimesSingle),
      submitMulti: roundedSummary(submitTimesMulti),
      latencySingle: roundedSummary(latencyTimesSingle),
      latencyMulti: roundedSummary(latencyTimesMulti),
      throughputSingle: roundedSummary(throughputSingle.perFrame),
      throughputMulti: roundedSummary(throughputMulti.perFrame),
      throughputOverallSingle: round4(throughputSingle.perFrameOverall),
      throughputOverallMulti: round4(throughputMulti.perFrameOverall),
      glError: readGlError(),
      multiError: holder.error,
      form: holder.form,
      wallMs: round4(performance.now() - wallStart),
    };
  }

  const benchEntries: BenchEntry[] = [];
  if (benchEnabled) {
    note('正在跑 CPU 提交耗时基准…');
    for (const which of ['arrays', 'elements', 'instanced'] as const) {
      for (const quadCount of [1000, 10000]) {
        benchEntries.push(benchCase(`${which}@${quadCount}`, quadCount, which));
      }
    }
    log('');
    log('==== 3. 耗时（每帧 N 个物体；三种口径都是「每帧 ms」，min/中位/max 来自多次时间样本）====');
    log('     submit=队列排空后只调 GL；latency=队列排空后调 GL + gl.finish()；throughput=连续 K 帧只 finish 一次再除以 K');
    for (const entry of benchEntries) {
      const format = (summary: Summary): string => `${summary.min}/${summary.median}/${summary.max}`;
      log(
        `  ${entry.label.padEnd(20)} 调用/帧 ${entry.singleCallsPerFrame} vs ${entry.multiCallsPerFrame}　form=${entry.form}　glError=${entry.glError}　wall=${entry.wallMs}ms` +
          (entry.multiError ? `　multi 抛错=${entry.multiError}` : ''),
      );
      log(`      提交     单独=${format(entry.submitSingle)}　multi=${format(entry.submitMulti)}`);
      log(`      帧延迟   单独=${format(entry.latencySingle)}　multi=${format(entry.latencyMulti)}`);
      log(
        `      吞吐     单独=${format(entry.throughputSingle)}（${entry.throughputFramesSingle} 帧/样本，全程均值 ${entry.throughputOverallSingle}）　` +
          `multi=${format(entry.throughputMulti)}（${entry.throughputFramesMulti} 帧/样本，全程均值 ${entry.throughputOverallMulti}）`,
      );
    }
    set('benchVerdict', 'measured');
  } else {
    log('');
    log('==== 3. CPU 提交耗时基准：本次用 ?bench=0 跳过了 ====');
    set('benchVerdict', 'skipped');
  }

  set('benchJson', JSON.stringify(benchEntries));
  set('chosenForms', JSON.stringify(Object.fromEntries(chosenForm)));
  set('callNotes', callNotes.join(' | '));
  set('userAgent', navigator.userAgent);
  set('hardwareConcurrency', navigator.hardwareConcurrency);
  const navigatorWithMemory = navigator as Navigator & { readonly deviceMemory?: number };
  set('deviceMemory', String(navigatorWithMemory.deviceMemory ?? 'unknown'));

  const allMatch = comparisons.every((entry) => entry.match);
  set('allComparisonsMatch', allMatch ? 'true' : 'false');
  set('verdict', !allMatch ? 'pixels-differ' : benchEnabled ? 'available-and-consistent' : 'available-and-consistent-bench-skipped');

  /* ---------------- 7. 可见画面（真实合成截图的输入） ---------------- */

  function renderVisible(): void {
    const target = ensureScene(visibleQuads);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, viewCanvas.width, viewCanvas.height);
    resetDrawState();
    gl.clearColor(0.06, 0.07, 0.09, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (shotMode === 'multi') {
      bindProgramAndScene(target, caseName);
      drawMulti(target, visibleQuads, caseName);
      gl.bindVertexArray(null);
    } else {
      drawSingle(target, visibleQuads, caseName);
    }
  }
  let firstFrame = true;
  function frame(): void {
    renderVisible();
    if (firstFrame) {
      firstFrame = false;
      set('firstFrameRendered', 'true');
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  note(`完成：${caseName} / mode=${shotMode} / ${allMatch ? '逐字节一致' : '存在差异'}`);
  log('');
  log(`完成。一致性=${allMatch ? '全部逐字节相同' : '存在差异'}　耗时见上。`);
  finish('pass');
}

try {
  runProbe();
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  log(`探针抛异常：${message}`);
  set('probeFailure', error instanceof Error ? error.message : String(error));
  finish('fail');
}

export {};
