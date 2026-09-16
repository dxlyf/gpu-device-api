/**
 * core 层取证页：**`setViewport` / `setScissorRect` 的 Y 原点在两个后端是反的，而且同一个后端
 * 内部还不自洽**。
 *
 * 这一页不是「演示」，是**探针**：它在两个后端上真的画，把「同一个矩形落在附件的哪一半」读回成
 * 像素，并把数字写进 `data-*` 供无头浏览器抓取。
 *
 * ## 实测锚定的「视觉上下」（不靠推理）
 *
 * 两个半屏四边形：红的那半覆盖图像坐标 `v ∈ [0, 0.5]`，绿的那半覆盖 `v ∈ [0.5, 1]`
 * （`v = 0` 是图像的**顶端**）。真实合成截图（`scripts/capture-screenshot.mjs`，
 * `?probe=split`）实测：**canvas 上半 = 红 (255,0,0)、下半 = 绿 (0,255,0)**。
 * 这就是本页所有「视觉上下」判断的唯一基准。
 *
 * 每次测量都清成黑色，只让被 scissor 放行的部分留下，于是**「放行的是红还是绿」就等于
 * 「scissor 落在图像上半还是下半」**。行签名一律按**附件自己的纹素行序**报告，不做翻转。
 *
 * ## 两个必须分开的问题
 *
 * 1. **附件怎么存**（纹素行序）：WebGL2 的纹理附件是 `bottomUp`（`rowOrder` 如实上报），
 *    WebGPU 是 `topLeft`。
 * 2. **画面长什么样**（视觉上下）：取决于**投影有没有被翻**。同一条 WebGL2 纹理附件路径，
 *    投影没翻时 `v = 0` 落在高行号（画面顶），翻了投影之后落在低行号 —— 两者**上下颠倒**。
 *
 * 所以「附件第 0 行是画面顶端还是底端」**不是后端属性**，而是「这个通道怎么画的」的属性。
 * helper 的 `imageOrigin` 参数要的就是后者：
 *
 * - 画面顶落在**低**行号 → `'topLeft'`（helper 恒等）；
 * - 画面顶落在**高**行号 → `'bottomLeft'`（helper 做 `y' = H - (y + h)`）。
 *
 * 本页三条通道的实测取值：canvas 通道 = `'bottomLeft'`；离屏不翻投影 = `'bottomLeft'`；
 * 离屏翻投影（gfx 的 `rowOrder: 'unified'` 默认行为）= `'topLeft'`。**同一个后端里
 * canvas 与离屏取值相反**，这正是不能从单条路径反推规则的原因。
 * （改前这里把「离屏不翻投影」误写成 `'topLeft'`，与 `imageOriginOf()` 的实现和实测读数都相反。）
 *
 * ## 一个决定性的对照：把离屏纹理 1:1 blit 到 canvas
 *
 * 每个离屏测量都做两件事：(a) `copyTextureToBuffer` 读回纹素；(b) 把同一张纹理用一次 1:1、
 * 不翻 Y 的 blit 画到 canvas 再 `gl.readPixels`。blit 只搬纹素、不改行序，而 canvas 的
 * `readPixels` 第 0 行是**画面底端**（上面那条截图基准），因此「纹素第 0 行是上还是下」由这次
 * 对照直接给出，不需要任何先验假设。
 *
 * ## 为什么 canvas 那一组只有 WebGL2 有实测数字
 *
 * - **WebGL2**：默认帧缓冲可以直接 `gl.readPixels`（本页用 `preserveDrawingBuffer: true` 建
 *   context），于是 canvas 通道有实测；
 * - **WebGPU**：`GPUCanvasContext.getCurrentTexture()` 的纹理没有 `COPY_SRC` usage（本库的 canvas
 *   context 也不会给），页面里**没有任何办法**把它读回主机。
 *
 * WebGPU 那一侧的 canvas 结论来自规范（`setScissorRect` 原点在左上、与附件纹素 (0,0) 同向，
 * 于是「不转换 = 图像上半」），本页把它写进 `data-gpuCanvasExpected*` 作为**期望值**，不谎报成实测。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&probe=split`（`probe=split` 只把全屏画面留在 canvas 上，
 * 供合成截图当基准）。
 */

import {
  BufferUsage,
  ShaderStage,
  TextureUsage,
  createDeviceWithAdapter,
  describeAdapter,
  toNativeScissorRect,
} from '../src/index.js';
import type { BindGroup } from '../src/core/binding/BindGroup.js';
import type { BindGroupLayout } from '../src/core/binding/BindGroupLayout.js';
import type { CanvasContext } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';
import type { RenderPipeline } from '../src/core/pipeline/RenderPipeline.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import type { Buffer } from '../src/core/resources/Buffer.js';
import type { Sampler } from '../src/core/resources/Sampler.js';
import type { Texture } from '../src/core/resources/Texture.js';
import type { TextureView } from '../src/core/resources/TextureView.js';
import type { ScissorImageOrigin } from '../src/core/render/ScissorOrigin.js';

/* ------------------------------------------------------------------------------------------------ */
/* 常量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** 附件边长（正方形：`H/2` 是整数；也保证离屏读回行距满足 WebGPU 的 256 字节对齐）。 */
const SIZE = 64;
/** 黑色底：每次测量只让被 scissor 放行的部分留在附件上，剩下的就是它。 */
const CLEAR: readonly [number, number, number, number] = [0, 0, 0, 1];
const RED: readonly [number, number, number, number] = [1, 0, 0, 1];
const GREEN: readonly [number, number, number, number] = [0, 1, 0, 1];
/** uniform 块：`vec4 color` + `vec4 flip`（`flip.x = 1` 时在裁剪空间把 Y 取反）。 */
const UNIFORM_BYTES = 32;
/** 图像坐标 `v` 的两个半屏：红的上半、绿的下半（`v = 0` 是图像顶端）。 */
const HALVES: readonly {
  readonly v0: number;
  readonly v1: number;
  readonly color: readonly [number, number, number, number];
}[] = [
  { v0: 0, v1: 0.5, color: RED },
  { v0: 0.5, v1: 1, color: GREEN },
];

/* ------------------------------------------------------------------------------------------------ */
/* 着色器                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** 半屏四边形：位置来自顶点，颜色与「是否翻裁剪空间 Y」来自 uniform。 */
const VERTEX_GLSL = `
layout(location = 0) in vec2 position;

layout(std140) uniform Uniforms {
  vec4 color;
  vec4 flip;
} u;

void main() {
  // 裁剪空间 y ∈ [-1, 1]；u.flip.x = 1 时取反（等价于 mat4.flipClipY / gl_Position.y *= -1）。
  gl_Position = vec4(position.x, position.y * mix(1.0, -1.0, u.flip.x), 0.0, 1.0);
}
`;

const FRAGMENT_GLSL = `
layout(std140) uniform Uniforms {
  vec4 color;
  vec4 flip;
} u;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = u.color;
}
`;

const MODULE_WGSL = `
struct Uniforms {
  color: vec4f,
  flip: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex fn vsMain(@location(0) position: vec2f) -> @builtin(position) vec4f {
  return vec4f(position.x, position.y * mix(1.0, -1.0, u.flip.x), 0.0, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.color;
}
`;

/** blit：全屏三角形，用**不翻 Y** 的 uv 采样一张纹理，1:1 铺到附件上。 */
const BLIT_VERTEX_GLSL = `
out vec2 vUv;

void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

const BLIT_FRAGMENT_GLSL = `
uniform sampler2D source;

in vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  // 不翻 Y：纹理坐标 v 与附件坐标一一对应。
  fragColor = texture(source, vUv);
}
`;

const BLIT_MODULE_WGSL = `
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  var corner = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  var out: VertexOutput;
  out.position = vec4f(corner * 2.0 - 1.0, 0.0, 1.0);
  out.uv = corner;
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return textureSample(source, sourceSampler, in.uv);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 类型                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Quad {
  readonly vertices: Buffer;
  readonly indices: Buffer;
  readonly bindGroup: BindGroup;
  /** 颜色 + flip 的 uniform 缓冲：`[r, g, b, a, flip, 0, 0, 0]`。 */
  readonly uniforms: Buffer;
}

interface Scene {
  readonly pipeline: RenderPipeline;
  readonly blitPipeline: RenderPipeline;
  readonly blitLayout: BindGroupLayout;
  readonly quads: readonly Quad[];
  readonly sampler: Sampler;
}

/** 一次测量的结论。所有行号都是**该附件自己的纹素行号**（第 0 行 = 附件第 0 行）。 */
interface ProbeResult {
  /** 本次实际下发的 scissor 矩形。 */
  readonly scissor: string;
  /** 本次喂给 helper 的 `imageOrigin`（`scissor: 'full'` 时无意义）。 */
  readonly origin: string;
  /** 附件行签名（步进压缩）：`K` 黑 / `R` 红 / `G` 绿 / `?` 别的。 */
  readonly rows: string;
  /** 同一通道、同样投影下的全屏基准行签名（同一批行上红的行号范围由它给出）。 */
  readonly referenceRows: string;
  /** 把该附件 1:1 blit 到 canvas 后，默认帧缓冲读回的行签名（仅 WebGL2）。 */
  readonly canvasRows: string;
  /** 该附件的 `rowOrder`（离屏测量才有）。 */
  readonly rowOrder?: string;
}

/** 一次测量的输入。 */
interface ProbeRequest {
  readonly key: string;
  /** `'canvas'` = 直接画默认帧缓冲；`'texture'` = 画离屏纹理附件（再用 blit 上屏对照）。 */
  readonly surface: 'canvas' | 'texture';
  /** 是否在裁剪空间把 Y 取反（复刻 gfx 对纹理附件的默认行为）。 */
  readonly flip: boolean;
  /** `'full'` = 不设 scissor；`'raw'` = `(0,0,W,H/2)`；`'helper'` = 经 helper 转换。 */
  readonly scissor: 'full' | 'raw' | 'helper';
}

/* ------------------------------------------------------------------------------------------------ */
/* main                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const out = requireElement<HTMLPreElement>('out');
  const status = requireElement<HTMLSpanElement>('status');
  const query = new URLSearchParams(location.search);
  const requested = query.get('backend');
  // `?probe=split` 只把「全屏画面」留在 canvas 上不再改它，供合成截图当基准（见文件头说明）。
  const splitOnly = query.get('probe') === 'split';

  const created = await createDeviceWithAdapter({
    canvas,
    backend: requested === 'webgpu' || requested === 'webgl2' ? requested : 'auto',
    label: 'scissor-origin',
    // 与其它示例唯一不同的一处 context 属性：WebGL2 的默认帧缓冲等一下要被 `readPixels` 读回，
    // 不保留绘制缓冲的话读到的内容按规范是未定义的。
    contextAttributes: { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true },
  });
  const { device, backend } = created;
  const context = created.context;
  if (!context) {
    throw new Error('[gpu-device-api] scissor-origin: createDeviceWithAdapter 没有返回 canvas context。');
  }
  context.setSize(SIZE, SIZE, false);
  const readback = new CanvasReadback(context);

  const scene = createScene(device);

  // 三条通道各测四次：一次「全屏基准」（不设 scissor，用来给出该通道里红占哪些行），
  // 再加「不转换」「helper 转换后」，以及一次「不设 scissor 但单独读回」的对照。
  const channels: readonly ProbeRequest[] = [
    { key: 'canvas', surface: 'canvas', flip: false, scissor: 'full' },
    { key: 'texturePlain', surface: 'texture', flip: false, scissor: 'full' },
    { key: 'textureFlipped', surface: 'texture', flip: true, scissor: 'full' },
  ];
  const modes: readonly ProbeRequest['scissor'][] = ['full', 'raw', 'helper'];

  const results = new Map<string, ProbeResult>();
  const references = new Map<string, string>();
  for (const channel of channels) {
    // canvas 通道只有 WebGL2 能读回（见文件头）。
    if (channel.surface === 'canvas' && !readback.available) continue;
    // 先测全屏基准：同一通道、同样投影，只是不设 scissor。
    const reference = await measure(device, context, scene, readback, channel);
    references.set(channel.key, reference.rows);
    for (const mode of modes) {
      const request: ProbeRequest = { ...channel, scissor: mode };
      results.set(`${channel.key}${capitalize(mode)}`, await measure(device, context, scene, readback, request));
    }
  }
  // 基准模式：把最后一个 canvas 测量的画面换成全屏，方便合成截图核对「视觉上下」。
  if (splitOnly) draw(device, context, scene, false, null, null);

  setData('scissorBackend', backend);
  setData('scissorAdapter', describeAdapter(created.adapter.info));
  for (const [key, result] of results) {
    writeProbe(key, result, references.get(key.replace(/(Full|Raw|Helper)$/, '')) ?? '');
  }
  /*
   * 语义必须是「canvas 通道**有没有实测读数**」，不是「本后端是不是 webgpu」。
   *
   * 改前的写法是 `String(backend === 'webgpu')` —— 那正好把含义写反了：WebGPU 上交换链
   * 读不回主机（见文件头），所以 canvas 通道**恰恰没有**实测；写成 `true` 会让「如实上报」
   * 这条自我约束失效，也让 `scripts/verify-scissor-origin.mjs` 的对应断言必然失败。
   * 本页从来没有给 canvas 通道写 `canvas*Measured`（那由 `writeProbe` 按实测结果写），
   * 所以这里恒为 `'false'`；两个枚举值本身只是**规范期望**，一并如实标注。
   */
  setData('gpuCanvasMeasured', 'false');
  setData('gpuCanvasExpectedRaw', 'top');
  setData('gpuCanvasExpectedHelper', 'top');

  const lines: string[] = [];
  lines.push(`=== setScissorRect / setViewport Y 原点探针（backend=${backend}，附件 ${SIZE}×${SIZE}）===`);
  lines.push('画面：图像上半红（v 0..0.5）、下半绿（v 0.5..1），底黑；每次只让 scissor 放行的部分留下。');
  lines.push('行号一律是附件自己的纹素行序；全屏签名给出「图像的哪一半落在哪些行」的实测口径。');
  lines.push('');
  lines.push('--- canvas 通道（默认帧缓冲，不翻投影）---');
  lines.push(canvasProbeLine(results, 'canvasFull', '全屏（不设 scissor）'));
  lines.push(canvasProbeLine(results, 'canvasRaw', '不转换'));
  lines.push(canvasProbeLine(results, 'canvasHelper', 'helper 转换后'));
  lines.push('');
  lines.push('--- 离屏通道（纹理附件，不翻投影）---');
  lines.push(textureProbeLine(results, 'texturePlainFull', '全屏（不设 scissor）'));
  lines.push(textureProbeLine(results, 'texturePlainRaw', '不转换'));
  lines.push(textureProbeLine(results, 'texturePlainHelper', 'helper 转换后'));
  lines.push('');
  lines.push('--- 离屏通道（纹理附件，投影按 gfx 默认翻过 Y）---');
  lines.push(textureProbeLine(results, 'textureFlippedFull', '全屏（不设 scissor）'));
  lines.push(textureProbeLine(results, 'textureFlippedRaw', '不转换'));
  lines.push(textureProbeLine(results, 'textureFlippedHelper', 'helper 转换后'));
  lines.push('');
  lines.push(
    '每个离屏测量都带一份「该纹理 1:1 blit 到 canvas 之后」的行签名（canvas 的 readPixels 第 0 行',
  );
  lines.push(
    '是默认帧缓冲底端）—— 两者一比就知道这张纹理的第 0 行在视觉上是上还是下，不需要任何假设。',
  );
  out.textContent = lines.join('\n');
  status.textContent = `后端：${backend}　` + '详见下方读数';
  setData('scissorResult', 'ok');
}

function canvasProbeLine(results: Map<string, ProbeResult>, key: string, title: string): string {
  const result = results.get(key);
  if (!result) return `  ${title}：WebGPU 交换链无法读回，本页不实测（规范期望：不转换 = 图像上半）`;
  return `  ${title}：scissor=${result.scissor}　行签名=${result.rows}`;
}

function textureProbeLine(results: Map<string, ProbeResult>, key: string, title: string): string {
  const result = results.get(key);
  if (!result) return `  ${title}：(不可读回)`;
  return (
    `  ${title}：scissor=${result.scissor} imageOrigin=${result.origin} rowOrder=${result.rowOrder}　` +
    `纹素行签名=${result.rows}　blit 到 canvas 后=${result.canvasRows}`
  );
}

function writeProbe(prefix: string, result: ProbeResult, referenceRows: string): void {
  setData(`${prefix}Measured`, 'true');
  setData(`${prefix}Scissor`, result.scissor);
  setData(`${prefix}Origin`, result.origin);
  setData(`${prefix}Rows`, result.rows);
  setData(`${prefix}ReferenceRows`, referenceRows);
  setData(`${prefix}CanvasRows`, result.canvasRows);
  if (result.rowOrder) setData(`${prefix}RowOrder`, result.rowOrder);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ------------------------------------------------------------------------------------------------ */
/* 一次测量                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

async function measure(
  device: Device,
  context: CanvasContext,
  scene: Scene,
  readback: CanvasReadback,
  request: ProbeRequest,
): Promise<ProbeResult> {
  const width = context.width;
  const height = context.height;
  const half = Math.floor(height / 2);
  // `imageOrigin` 只描述**这个附件**：第 0 行对应图像的哪一端（'topLeft' = 第 0 行是图像顶端，
  // 恒等；'bottomLeft' = 第 0 行是图像底端，helper 要翻）。它不是「哪个后端」，甚至不是
  // 「哪个通道」—— 见各通道的取值推导：
  //   · canvas 通道：第 0 行是画面底端（真机截图为证）→ 'bottomLeft'；
  //   · 离屏不翻投影：不翻时 v = 0 落在高行号，第 0 行同样是底端 → 'bottomLeft'；
  //   · 离屏翻过投影：投影把画面翻了过来，第 0 行变成顶端 → 'topLeft'（helper 恒等）。
  const imageOrigin = imageOriginOf(request);
  const converted = toNativeScissorRect({ x: 0, y: 0, width, height: half }, height, imageOrigin);
  const rects: Record<ProbeRequest['scissor'], readonly [number, number, number, number] | null> = {
    full: null,
    raw: [0, 0, width, half],
    helper: [converted.x, converted.y, converted.width, converted.height],
  };
  const rect = rects[request.scissor];

  if (request.surface === 'canvas') {
    // 直接画默认帧缓冲；canvas 通道不翻投影（浏览器合成到屏幕那一侧本来就是对的）。
    draw(device, context, scene, request.flip, rect, null);
    const rows = rowSignature(readback.read(width, height), width, height);
    return {
      scissor: rect ? rect.join(',') : 'full',
      origin: rect ? imageOrigin : '-',
      rows,
      referenceRows: '',
      canvasRows: rows,
    };
  }

  const target = device.createRenderTarget({
    label: `scissor-origin:${request.key}`,
    width,
    height,
    color: 'rgba8unorm',
    depth: null,
    usage: TextureUsage.CopySrc,
  });
  draw(device, context, scene, request.flip, rect, target);
  const texels = await readTexture(device, target);
  // 再把同一张纹理 1:1、不翻 Y 地 blit 到 canvas，读回默认帧缓冲：这一步给出「视觉上下」的口径。
  // WebGPU 上默认帧缓冲读不回来（交换链没有 COPY_SRC），那就只报纹素行序。
  draw(device, context, scene, false, null, null, target.colors[0]!);
  const onCanvas = readback.available ? readback.read(width, height) : null;
  const rowOrder = target.rowOrder;
  target.destroy();

  return {
    scissor: rect ? rect.join(',') : 'full',
    origin: rect ? imageOrigin : '-',
    rows: rowSignature(texels, width, height),
    referenceRows: '',
    canvasRows: onCanvas ? rowSignature(onCanvas, width, height) : '（本后端无法读回默认帧缓冲）',
    rowOrder,
  };
}

/**
 * 该通道的 `imageOrigin` —— 也就是「这个附件的第 0 行对应图像的哪一端」。
 *
 * 取值由**通道**决定，不由后端决定：
 *
 * - `canvas`：默认帧缓冲第 0 行是画面底端（GL 的窗口原点在左下）→ `'bottomLeft'`；
 * - `texture` 不翻投影：`v = 0` 的那一半落在高行号，第 0 行同样是底端 → `'bottomLeft'`；
 * - `texture` 翻过投影：画面被翻到低行号，第 0 行变成顶端 → `'topLeft'`。
 */
function imageOriginOf(request: ProbeRequest): ScissorImageOrigin {
  if (request.surface === 'canvas') return 'bottomLeft';
  return request.flip ? 'topLeft' : 'bottomLeft';
}

/**
 * 画一帧。
 *
 * `target === null` 表示画默认帧缓冲；`blitSource` 不为空时改成「把那张纹理 1:1 铺满附件」。
 */
function draw(
  device: Device,
  context: CanvasContext,
  scene: Scene,
  flip: boolean,
  rect: readonly [number, number, number, number] | null,
  target: RenderTarget | null,
  blitSource?: Texture,
): void {
  const frame = context.getCurrentFrameTarget();
  const attachments = target
    ? target.createPassDescriptor({ loadOp: 'clear', storeOp: 'store', clearValue: CLEAR })
    : null;
  const encoder = device.createCommandEncoder({ label: 'scissor-origin:frame' });
  const pass = encoder.beginRenderPass({
    label: 'scissor-origin:pass',
    colorAttachments: attachments
      ? attachments.colorAttachments
      : [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    depthStencilAttachment: attachments ? attachments.depthStencilAttachment : undefined,
  });

  if (blitSource) {
    drawBlit(device, scene, pass, blitSource);
  } else {
    setFlip(device, scene, flip ? 1 : 0);
    pass.setPipeline(scene.pipeline);
    if (rect) pass.setScissorRect(rect[0], rect[1], rect[2], rect[3]);
    for (const quad of scene.quads) {
      pass.setBindGroup(0, quad.bindGroup);
      pass.setVertexBuffer(0, quad.vertices, 0, quad.vertices.size);
      pass.setIndexBuffer(quad.indices, 'uint16', 0, quad.indices.size);
      pass.drawIndexed({ indexCount: 6 });
    }
  }
  pass.end();
  device.queue.submit([encoder.finish()]);
}

/** 1:1 blit：全屏三角形 + 不翻 Y 的 uv。 */
function drawBlit(device: Device, scene: Scene, pass: RenderPassEncoder, source: Texture): void {
  pass.setPipeline(scene.blitPipeline);
  pass.setBindGroup(0, createBlitBindGroup(device, scene, source));
  pass.draw({ vertexCount: 3 });
}

/* ------------------------------------------------------------------------------------------------ */
/* 场景                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

function createScene(device: Device): Scene {
  const module = device.createShaderModule({
    label: 'scissor-origin:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const bindGroupLayout = device.createBindGroupLayout({
    label: 'scissor-origin:bindGroupLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex | ShaderStage.Fragment,
        type: 'uniform',
        name: 'Uniforms',
        buffer: { type: 'uniform', minBindingSize: UNIFORM_BYTES },
      },
    ],
  });
  const pipeline = device.createRenderPipeline({
    label: 'scissor-origin:pipeline',
    layout: device.createPipelineLayout({
      label: 'scissor-origin:pipelineLayout',
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: 8,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const blitModule = device.createShaderModule({
    label: 'scissor-origin:blitShader',
    code: { vs: BLIT_VERTEX_GLSL, fs: BLIT_FRAGMENT_GLSL, wgsl: BLIT_MODULE_WGSL },
  });
  const blitLayout = device.createBindGroupLayout({
    label: 'scissor-origin:blitLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Fragment,
        type: 'texture',
        name: 'source',
        texture: { sampleType: 'float', viewDimension: '2d' },
      },
      {
        binding: 1,
        visibility: ShaderStage.Fragment,
        type: 'sampler',
        name: 'sourceSampler',
        sampler: { type: 'filtering' },
      },
    ],
  });
  const blitPipeline = device.createRenderPipeline({
    label: 'scissor-origin:blitPipeline',
    layout: device.createPipelineLayout({
      label: 'scissor-origin:blitPipelineLayout',
      bindGroupLayouts: [blitLayout],
    }),
    vertex: { module: blitModule, entryPoint: 'vsMain' },
    fragment: { module: blitModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const sampler = device.createSampler({
    label: 'scissor-origin:blitSampler',
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  const quads = HALVES.map((half) => createQuad(device, bindGroupLayout, half.v0, half.v1, half.color));
  return { pipeline, blitPipeline, quads, sampler, blitLayout };
}

function createQuad(
  device: Device,
  layout: BindGroupLayout,
  v0: number,
  v1: number,
  color: readonly [number, number, number, number],
): Quad {
  // 图像坐标 v（0 = 图像顶端）→ 未翻投影的裁剪空间 y（+1 在顶）。通道的 `flip` 在这之上再作用。
  const y0 = 1 - 2 * v0;
  const y1 = 1 - 2 * v1;
  const vertices = new Float32Array([-1, y1, 1, y1, 1, y0, -1, y0]);
  const indices = Uint16Array.from([0, 1, 2, 0, 2, 3]);

  const vertexBuffer = createBuffer(device, `scissor-origin:vertices:${v0}`, vertices, BufferUsage.Vertex);
  const indexBuffer = createBuffer(device, `scissor-origin:indices:${v0}`, indices, BufferUsage.Index);
  const uniforms = device.createBuffer({
    label: `scissor-origin:uniform:${v0}`,
    size: UNIFORM_BYTES,
    usage: BufferUsage.Uniform | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(uniforms, 0, new Float32Array([...color, 0, 0, 0, 0]));
  const bindGroup = device.createBindGroup({
    label: `scissor-origin:bindGroup:${v0}`,
    layout,
    entries: [{ binding: 0, resource: { buffer: uniforms, offset: 0, size: UNIFORM_BYTES } }],
  });
  return { vertices: vertexBuffer, indices: indexBuffer, bindGroup, uniforms };
}

function createBuffer(device: Device, label: string, data: Float32Array | Uint16Array, usage: BufferUsage): Buffer {
  const buffer = device.createBuffer({
    label,
    size: Math.max(4, data.byteLength),
    usage: usage | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(buffer, 0, data);
  return buffer;
}

/** blit 的 bind group：每次都要按源纹理重建，所以不缓存。 */
function createBlitBindGroup(device: Device, scene: Scene, source: Texture): BindGroup {
  const view: TextureView = source.createView();
  return device.createBindGroup({
    label: 'scissor-origin:blitBindGroup',
    layout: scene.blitLayout,
    entries: [
      { binding: 0, resource: { view } },
      { binding: 1, resource: { sampler: scene.sampler } },
    ],
  });
}

/** 打开/关闭裁剪空间 Y 取反（复刻 `mat4.flipClipY`），在下一个通道生效。 */
function setFlip(device: Device, scene: Scene, flip: number): void {
  for (const quad of scene.quads) {
    device.queue.writeBuffer(quad.uniforms, 16, new Float32Array([flip, 0, 0, 0]));
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* 读回                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** `gl.readPixels` 的封装：行序**原样**保留（第 0 行 = 默认帧缓冲第 0 行，GL 约定下是画面底端）。 */
class CanvasReadback {
  private readonly gl: WebGL2RenderingContext | null;

  constructor(context: CanvasContext) {
    // `CanvasContext` 的公开接口里没有 `native`；WebGL2 的实现把它叫 `gl`，这里按结构判定。
    const candidate = (context as unknown as { readonly gl?: WebGL2RenderingContext }).gl;
    this.gl = candidate && typeof candidate.readPixels === 'function' ? candidate : null;
  }

  get available(): boolean {
    return this.gl !== null;
  }

  read(width: number, height: number): Uint8Array {
    const gl = this.gl;
    if (!gl) {
      throw new Error(
        '[gpu-device-api] scissor-origin: 本后端的 canvas 纹理无法读回（WebGPU 的交换链没有 COPY_SRC）。',
      );
    }
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }
}

/** 读回离屏纹理的纹素（缓冲第 0 行 = 纹素行 0，不做任何翻转）。 */
async function readTexture(device: Device, target: RenderTarget): Promise<Uint8Array> {
  const width = target.width;
  const height = target.height;
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const byteLength = bytesPerRow * height;
  const buffer = device.createBuffer({
    label: 'scissor-origin:readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const encoder = device.createCommandEncoder({ label: 'scissor-origin:copy' });
  encoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish()]);

  await buffer.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(buffer.getMappedRange(0, byteLength)).slice();
  buffer.unmap();
  buffer.destroy();

  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    pixels.set(raw.subarray(y * bytesPerRow, y * bytesPerRow + width * 4), y * width * 4);
  }
  return pixels;
}

/* ------------------------------------------------------------------------------------------------ */
/* 行签名                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** 每行第一个像素的代号，压成「代号 + 重复次数」：`K` 黑 / `R` 红 / `G` 绿 / `?` 别的。 */
function rowSignature(pixels: Uint8Array, width: number, height: number): string {
  let text = '';
  let current = '';
  let count = 0;
  for (let y = 0; y < height; y++) {
    const code = colorCode(pixels, width, y);
    if (code === current) {
      count += 1;
      continue;
    }
    if (current !== '') text += `${current}${count}`;
    current = code;
    count = 1;
  }
  return current === '' ? text : `${text}${current}${count}`;
}

function colorCode(pixels: Uint8Array, width: number, y: number): string {
  const index = y * width * 4;
  const r = pixels[index] ?? -1;
  const g = pixels[index + 1] ?? -1;
  const b = pixels[index + 2] ?? -1;
  if (r === 0 && g === 0 && b === 0) return 'K';
  if (r === 255 && g === 0 && b === 0) return 'R';
  if (r === 0 && g === 255 && b === 0) return 'G';
  return '?';
}

/* ------------------------------------------------------------------------------------------------ */
/* 小工具                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`[gpu-device-api] scissor-origin: 找不到元素 #${id}。`);
  return element as T;
}

function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

main().catch((error: unknown) => {
  setData('scissorResult', 'fail');
  setData('scissorError', (error as Error).message);
  const out = document.getElementById('out');
  if (out) out.textContent = (error as Error).stack ?? (error as Error).message;
});
