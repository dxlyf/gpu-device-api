/**
 * 双后端语义一致性回归页：**「这条管线不使用深度」该怎么写**。
 *
 * 背景（本页要钉死的缺陷）：`depthStencil: { format: null }`（以及干脆不声明 `depthStencil`）
 * 表示「这条管线不使用深度」，两个后端**必须**给出同一个结果。WebGPU 后端曾经在这里悄悄回落成
 * `depthWriteEnabled: true` + `depthCompare: 'less'`（即 `DEFAULT_DEPTH_STATE`）：真正建 pipeline 时
 * 深度格式来自当前 render target，于是「不要深度」的管线反而拿到了深度状态、把整个深度缓冲写成 0。
 *
 * 场景（两个后端跑同一段代码）：
 * 1. 管线 A：全屏三角形，`gl_Position` 深度为 **0**（最近），红；
 * 2. 管线 B：中心的正方形，深度为 0.5（比 A 远，但比清屏值 1.0 近），绿，`depthWriteEnabled: true`、
 *    `depthCompare: 'less'` —— 它**应当**在 A 之上可见（A 不写深度时深度缓冲仍是清屏的 1.0，B 的
 *    `less` 通过）。
 *
 * 于是「A 是否偷偷写了深度」有了一个可判定的可观测量：后画的 B 还在不在。
 * 四条断言缺一不可：
 *
 * - `control-green-only`：只画 B（绿）→ 中心必须是绿（B 真的被光栅化出来了）；
 * - `control-fullscreen-only`：只画 A（红）→ 中心必须是红（A 真的铺满了画面）；
 * - `write-control`：A 用**显式写深度**的管线时 → 中心必须是红（证明「B 被挡住」这个判据本身有效，
 *   否则下面两条会因为「B 根本画不出来」而假通过）；
 * - `null-format` / `undeclared`：A 用「不使用深度」的两种写法时 → 中心必须是绿（B 没被挡住）。
 *
 * 读回：WebGPU 走 `copyTextureToBuffer`，WebGL2 走 `gl.readPixels` 逃生口（默认帧缓冲是一张
 * 「虚拟纹理」，`native` 为 null，没法当 FBO 附件读回）。两边都**必须与绘制同在这一次任务里**开始
 *（`preserveDrawingBuffer: false`，默认帧缓冲合成后就作废）。
 * 页内的读回只用于判定；量化证据由真实合成截图 + `scripts/analyze-screenshot.mjs` 给出。
 *
 * 修在库里时还有一条 WebGPU 特有的约束（本页也顺带验证了）：WebGPU 的 **attachment state** 要求
 * 管线与 render pass 的深度附件格式一致，所以「不使用深度」**不能**翻译成「不挂 depthStencil」——
 * 那样在带深度附件的 pass 里会直接报 `Attachment state ... is not compatible ...`、整条 command
 * buffer 作废（画面全黑）。正确翻译是「恒通过 + 不写」：`depthCompare: 'always'` +
 * `depthWriteEnabled: false`，与 GL 关掉 `DEPTH_TEST` 完全等价。
 *
 * 无头判据：`<html data-depth-null-result="pass|fail">`，细节见 `data-depth-null-*`。
 *
 * ⚠️ 一张 canvas 只能绑定一种 context，所以这里一次只跑一个后端：
 * `depth-null-format.html?backend=webgl2` 或 `?backend=webgpu`（省略时 `auto`）。
 */

import { BufferUsage, TextureUsage, createDeviceWithAdapter } from '../src/index.js';
import type { CanvasContext, FrameTarget } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPipeline } from '../src/core/pipeline/RenderPipeline.js';
import type { DepthStencilState } from '../src/core/pipeline/RenderState.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';
import type { ShaderModule } from '../src/core/resources/ShaderModule.js';

/* ------------------------------------------------------------------ 页内报告 ------------------ */

const lines: string[] = [];
let failures = 0;

function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

function check(name: string, ok: boolean, detail = ''): void {
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function report(): void {
  const out = document.getElementById('out');
  if (out) {
    out.textContent = lines.join('\n');
    out.className = failures === 0 ? 'pass' : 'fail';
  }
  setData('depthNullResult', failures === 0 ? 'pass' : 'fail');
}

/* ------------------------------------------------------------------ 场景数据 ------------------ */

/** 清屏色：深蓝黑，和示例页的 body 底色接近，便于截图统计。 */
const CLEAR: readonly [number, number, number, number] = [0.02, 0.02, 0.04, 1];

/**
 * 全屏三角形：z 固定为 **0**。
 *
 * 注意两个后端的 NDC 深度约定不同（GL 是 `[-1, 1]`、窗口深度 `(z+1)/2`；WebGPU 是 `[0, 1]`），
 * 所以 `z = 0` 在 GL 是窗口深度 0.5、在 WebGPU 是 0 —— 但两边都是「已经画过的东西里最近的一个」，
 * 用来暴露「空 format 回落成写深度」这件事完全一致（WebGPU 写 0，随后 z = 0.5 的 B 判 `less` 失败）。
 * 之所以不用 z = -1：WebGPU 的 NDC z 必须落在 `[0, 1]`，越界会被裁掉。
 */
const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);

/** 中心的正方形（NDC 半边长 0.5），z = 0.5：比 A 远，但比深度清屏值 1.0 近。 */
const CENTER_QUAD = new Float32Array([
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,
  -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
]);

const RED_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const RED_FRAGMENT_GLSL = `
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

const GREEN_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const GREEN_FRAGMENT_GLSL = `
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`;

const RED_WGSL = `
struct VertexInput {
  @location(0) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.position = vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;

const GREEN_WGSL = `
struct VertexInput {
  @location(0) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.position = vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain() -> @location(0) vec4f {
  return vec4f(0.0, 1.0, 0.0, 1.0);
}
`;

/* ------------------------------------------------------------------ 像素读回 ------------------ */

const BYTES_PER_PIXEL = 4;

interface PixelStats {
  readonly center: readonly [number, number, number];
  readonly green: number;
  readonly red: number;
}

function isGreen(pixel: readonly [number, number, number]): boolean {
  return pixel[1] > 200 && pixel[0] < 60 && pixel[2] < 60;
}

function isRed(pixel: readonly [number, number, number]): boolean {
  return pixel[0] > 200 && pixel[1] < 60 && pixel[2] < 60;
}

/**
 * 读回画布帧。
 *
 * **调用点必须在同一个任务里紧接着 `submit()`**：同步部分（读回本身，或申请 buffer + 提交拷贝命令）
 * 立即执行，返回的 promise 之后才 await —— WebGL2 的默认帧缓冲在合成后作废，WebGPU 的 canvas 纹理
 * 也在下一次 `getCurrentTexture()` 之前才有意义。
 *
 * 两个后端的读回入口不同（这不是本页要证明的东西，只是现实差异）：
 * WebGL2 的默认帧缓冲是一张「虚拟纹理」（`native` 为 null），`copyTextureToBuffer` 没法把它当附件
 * 读回，所以这一页照 `depth.ts` 的做法直接走 `gl.readPixels` 逃生口；WebGPU 走 `copyTextureToBuffer`。
 */
function readbackCanvas(device: Device, context: CanvasContext, frame: FrameTarget): Promise<PixelStats> {
  const width = frame.width;
  const height = frame.height;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  if (device.backend === 'webgl2') {
    const gl = device.native as WebGL2RenderingContext;
    // readPixels 一律按 RGBA 返回，不需要换通道；按紧凑行距读回。
    const tight = new Uint8Array(width * BYTES_PER_PIXEL * height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, tight);
    return Promise.resolve(countPixels(tight, width * BYTES_PER_PIXEL, width, height, centerX, centerY, false));
  }

  // WebGPU 要求 bytesPerRow 是 256 的倍数。
  const bytesPerRow = Math.ceil((width * BYTES_PER_PIXEL) / 256) * 256;
  const byteLength = bytesPerRow * height;
  const buffer = device.createBuffer({
    label: 'depth-null-format:readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const encoder = device.createCommandEncoder({ label: 'depth-null-format:copy' });
  encoder.copyTextureToBuffer(
    { texture: frame.texture, origin: { x: 0, y: 0 } },
    { buffer, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish()]);

  // canvas 的 back buffer 可能是 bgra 顺序（WebGPU 在多数平台上如此）。
  const bgra = context.format.includes('bgra');
  return (async (): Promise<PixelStats> => {
    await buffer.mapAsync('read', 0, byteLength);
    const raw = new Uint8Array(buffer.getMappedRange(0, byteLength)).slice();
    buffer.unmap();
    buffer.destroy();
    return countPixels(raw, bytesPerRow, width, height, centerX, centerY, bgra);
  })();
}

/** 统计红/绿像素与中心像素；`bytesPerRow` 是数据里相邻两行的距离（可能含填充）。 */
function countPixels(
  raw: Uint8Array,
  bytesPerRow: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  bgra: boolean,
): PixelStats {
  const at = (x: number, y: number): readonly [number, number, number] => {
    const offset = y * bytesPerRow + x * BYTES_PER_PIXEL;
    return bgra
      ? [raw[offset + 2]!, raw[offset + 1]!, raw[offset]!]
      : [raw[offset]!, raw[offset + 1]!, raw[offset + 2]!];
  };
  let green = 0;
  let red = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = at(x, y);
      if (isGreen(pixel)) green += 1;
      else if (isRed(pixel)) red += 1;
    }
  }
  return { center: at(centerX, centerY), green, red };
}

/* ------------------------------------------------------------------ 运行 --------------------- */

interface Scene {
  readonly device: Device;
  readonly context: CanvasContext;
}

/** 画一帧并立刻开始读回（读回的同步部分必须和这一次绘制在同一个任务里）。 */
function renderAndRead(
  scene: Scene,
  draw: (pass: RenderPassEncoder) => void,
): Promise<PixelStats> {
  const { device, context } = scene;
  context.resize();
  const frame = context.getCurrentFrameTarget();
  const descriptor = context.createPassDescriptor({
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: CLEAR,
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
    depthClearValue: 1,
  });
  const encoder = device.createCommandEncoder({ label: 'depth-null-format:frame' });
  const pass = encoder.beginRenderPass({
    label: 'depth-null-format:pass',
    colorAttachments: descriptor.colorAttachments,
    depthStencilAttachment: descriptor.depthStencilAttachment,
  });
  draw(pass);
  pass.end();
  device.queue.submit([encoder.finish()]);
  return readbackCanvas(device, context, frame);
}

function backendFromQuery(): 'auto' | 'webgl2' | 'webgpu' {
  const value = new URLSearchParams(location.search).get('backend');
  return value === 'webgl2' || value === 'webgpu' ? value : 'auto';
}

async function run(): Promise<void> {
  const canvas = document.getElementById('view') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('[gpu-device-api] depth-null-format: 找不到 #view。');

  const created = await createDeviceWithAdapter({
    canvas,
    backend: backendFromQuery(),
    label: 'depth-null-format',
    contextAttributes: { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: false },
  });
  const context = created.context;
  if (!context) throw new Error('[gpu-device-api] depth-null-format: 没有拿到 canvas context。');
  const device = created.device;
  setData('depthNullBackend', created.backend);
  // 把设备报的校验错误写进 `data-*`：WebGPU 的校验错误默认只进控制台，
  // 一旦整条 command buffer 作废，画面上只会剩「什么都没有」，看不出原因。
  const deviceErrors: string[] = [];
  device.onError((error) => {
    deviceErrors.push(error.message);
    setData('depthNullErrors', String(deviceErrors.length));
    // 第一条才是根因：后面往往只是「Invalid CommandBuffer ... due to a previous error」。
    setData('depthNullFirstError', deviceErrors[0]!.replace(/\s+/g, ' ').slice(0, 400));
    setData('depthNullLastError', error.message.split('\n')[0]!);
  });

  // WebGPU 的 canvas 纹理默认只有 RenderAttachment；读回要额外的 CopySrc。
  if (created.backend === 'webgpu') {
    context.configure({ device, usage: TextureUsage.CopySrc });
  }

  const scene: Scene = { device, context };

  const redModule = device.createShaderModule({
    label: 'depth-null-format:red',
    code: { vs: RED_VERTEX_GLSL, fs: RED_FRAGMENT_GLSL, wgsl: RED_WGSL },
  });
  const greenModule = device.createShaderModule({
    label: 'depth-null-format:green',
    code: { vs: GREEN_VERTEX_GLSL, fs: GREEN_FRAGMENT_GLSL, wgsl: GREEN_WGSL },
  });

  const vertexLayout = {
    arrayStride: 12,
    stepMode: 'vertex' as const,
    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' as const }],
  };

  const fullscreenBuffer = device.createBuffer({
    label: 'depth-null-format:fullscreen',
    size: FULLSCREEN_TRIANGLE.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(fullscreenBuffer, 0, FULLSCREEN_TRIANGLE);
  const quadBuffer = device.createBuffer({
    label: 'depth-null-format:quad',
    size: CENTER_QUAD.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(quadBuffer, 0, CENTER_QUAD);

  const createPipeline = (
    label: string,
    module: ShaderModule,
    depthStencil: DepthStencilState | undefined,
  ): RenderPipeline =>
    device.createRenderPipeline({
      label,
      layout: 'auto',
      vertex: { module, entryPoint: 'vsMain', buffers: [vertexLayout] },
      fragment: { module, entryPoint: 'fsMain' },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      // 关键：`depthStencil` **省略**与 `{ format: null }` 都表示「这条管线不使用深度」。
      ...(depthStencil === undefined ? {} : { depthStencil }),
    });

  // 三种 A 管线：唯一差别就是「怎么表达不使用深度」。
  const nullFormatPipeline = createPipeline('red:null-format', redModule, { format: null });
  const undeclaredPipeline = createPipeline('red:undeclared', redModule, undefined);
  const writingPipeline = createPipeline('red:writing', redModule, {
    depthWriteEnabled: true,
    depthCompare: 'less',
  });
  // B：显式带深度测试的绿正方形。
  const depthPipeline = createPipeline('green:depth', greenModule, {
    depthWriteEnabled: true,
    depthCompare: 'less',
  });

  const drawFullscreen = (pipeline: RenderPipeline) => (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, fullscreenBuffer, 0, fullscreenBuffer.size);
    pass.draw({ vertexCount: 3 });
  };
  const drawQuad = (pass: RenderPassEncoder): void => {
    pass.setPipeline(depthPipeline);
    pass.setVertexBuffer(0, quadBuffer, 0, quadBuffer.size);
    pass.draw({ vertexCount: 6 });
  };
  const drawBoth = (pipeline: RenderPipeline) => (pass: RenderPassEncoder): void => {
    drawFullscreen(pipeline)(pass);
    drawQuad(pass);
  };

  /* ---- ① 对照：只画绿正方形（证明 B 真的画得出来） ---------------------------------------- */
  const greenOnly = await renderAndRead(scene, drawQuad);
  setData('depthNullControlGreenOnly', greenOnly.center.join(','));
  check(
    '对照：只画绿正方形时中心是绿（绿管线与读回链路都有效）',
    isGreen(greenOnly.center) && greenOnly.green > 0,
    `rgba=${greenOnly.center.join(',')} green=${greenOnly.green}`,
  );

  /* ---- ② 对照：只画全屏红三角形 ------------------------------------------------------------ */
  const fullOnly = await renderAndRead(scene, drawFullscreen(nullFormatPipeline));
  setData('depthNullControlFullOnly', fullOnly.center.join(','));
  check(
    '对照：只画全屏红三角形时中心是红（A 真的铺满了画面）',
    isRed(fullOnly.center) && fullOnly.red > 0,
    `rgba=${fullOnly.center.join(',')} red=${fullOnly.red}`,
  );

  /* ---- ③ 判据自检：A 显式写深度时必须挡住 B（否则下面的断言会假通过） --------------------- */
  const writing = await renderAndRead(scene, drawBoth(writingPipeline));
  setData('depthNullWriteControl', writing.center.join(','));
  check(
    '判据自检：A 显式写深度时中心是红（B 被挡住 —— 遮挡判定本身有效）',
    isRed(writing.center),
    `rgba=${writing.center.join(',')}（两个后端都必须如此，否则本页的断言没有意义）`,
  );

  /* ---- ④ 不声明 depthStencil：必须与「不使用深度」同义 ------------------------------------ */
  const undeclared = await renderAndRead(scene, drawBoth(undeclaredPipeline));
  setData('depthNullUndeclaredCenter', undeclared.center.join(','));
  setData('depthNullUndeclaredGreen', String(undeclared.green));
  check(
    '不声明 depthStencil：中心是绿（B 没被挡住，说明这条管线没写深度）',
    isGreen(undeclared.center) && undeclared.green > 0,
    `rgba=${undeclared.center.join(',')} green=${undeclared.green}`,
  );

  /* ---- ⑤ format: null：同上（这一帧留在屏幕上，截图统计的就是它） -------------------------- */
  const nullFormat = await renderAndRead(scene, drawBoth(nullFormatPipeline));
  setData('depthNullNullFormatCenter', nullFormat.center.join(','));
  setData('depthNullNullFormatGreen', String(nullFormat.green));
  setData('depthNullNullFormatRed', String(nullFormat.red));
  check(
    'format: null：中心是绿（B 没被挡住，说明这条管线没写深度）',
    isGreen(nullFormat.center) && nullFormat.green > 0,
    `rgba=${nullFormat.center.join(',')} green=${nullFormat.green} red=${nullFormat.red}`,
  );

  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `后端：${created.backend}　5 条断言，失败 ${failures} 条`;
  }
  // 判据自检那一帧是红的：截图里必须有绿（④⑤ 任一），所以留最后画的 ⑤ 在屏幕上。
  setData('depthNullFinalFrame', 'null-format');
}

try {
  await run();
} catch (error: unknown) {
  const message = `${(error as Error).name}: ${(error as Error).message}`;
  setData('depthNullError', message);
  check('运行过程抛出未预期的异常', false, message);
} finally {
  report();
}
