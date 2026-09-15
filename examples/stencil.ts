/**
 * 模板（stencil）语义的双后端对照页：把「WebGL2 也真的实现了模板比较与写入」变成可量化结论。
 *
 * ## 为什么要这一页
 *
 * WebGL2 侧曾经把整个模板状态**丢掉**：`ResolvedRenderState` 只带 `stencilEnabled`，
 * 下发时硬编码 `stencilFunc(ALWAYS, ref, 0xff)`，从不调用 `stencilOpSeparate` /
 * `stencilMaskSeparate`。于是 `{ compare: 'equal', passOp: 'replace' }` 这类配置退化成
 * 「恒通过、不写」，画面错但一个错误都不报。单测可以钉住「调用参数正确」，但证明不了
 * 「画面上第二个物体真的只出现在模板为 1 的区域里」—— 那要靠真实光栅化的像素。
 *
 * ## 场景（每个场景一帧，全部画进离屏目标）
 *
 * 模板位只在带 stencil aspect 的深度格式上才有，而 `RenderTarget` 的深度附件按同一个 `usage`
 * 创建、`depth24plus-stencil8` 在 WebGPU 上既不能采样也不能拷贝 —— 所以这一页把**颜色附件**
 * 与**深度/模板附件**分开建：颜色走 `RenderTarget`（可采样、可读回），深度/模板用
 * `device.createTexture` 单独建一张，再在 `beginRenderPass` 里显式给出两者。
 * 这也是「原始附件」那条路径的示范。
 *
 * 一个渲染通道里画两趟：
 *
 * 1. **写模板**：只覆盖左半屏的蓝色四边形，`compare: 'always'` + `passOp: 'replace'`
 *    （参考值 1 由 `pass.setStencilReference(1)` 给出），于是左半屏的模板值变成 1；
 * 2. **被门控的第二个物体**：覆盖整屏的绿色四边形，`compare: 'equal'` + 全部 `keep`。
 *    模板测试生效时它只出现在左半屏。
 *
 * 四个场景分别只改一个字段，各自都有明确的期望像素（左半屏中心 / 右半屏中心）：
 *
 * | 场景 | 改动 | 期望左半屏 | 期望右半屏 |
 * | --- | --- | --- | --- |
 * | `gated` | 无（基准） | 绿 | 底色 |
 * | `control` | 第二个物体改成 `compare: 'always'` | 绿 | 绿 |
 * | `nowrite` | 写模板那趟 `stencilWriteMask = 0` | 蓝（只有它自己画出来） | 底色 |
 * | `noread` | 被门控那趟 `stencilReadMask = 0` | 绿 | 绿 |
 *
 * `control` 是防假通过的对照：它证明绿色四边形确实光栅化到了整屏，所以 `gated` 里右半屏
 * 「没有绿」只可能是模板比较拒绝了它。`nowrite` / `noread` 则分别钉住写掩码与读掩码真的生效
 * （掩码被忽略时它们的期望值会与 `gated` 相同）。
 *
 * ## 结论写在哪
 *
 * - `data-stencil-result="pass|fail"`：四个场景全部逐像素命中期望值；
 * - `data-stencil-<scene>-inside` / `-outside`：左/右半屏中心的像素（RGB）；
 * - `data-stencil-backend` / `data-stencil-depth-format` / `data-stencil-error`。
 *
 * 页面自己读回的是**离屏颜色附件**（两个后端都走 `copyTextureToBuffer`，与合成无关）；
 * 上屏那一份留给真实合成截图 + `scripts/analyze-screenshot.mjs`：
 * 默认停在 `gated` 场景，左半屏应全是绿、右半屏应 0 个前景像素。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto`（默认 `auto`）。
 */

import { createDeviceWithAdapter } from '../src/factories/index.js';
import { BindingType } from '../src/core/enums/BindingType.js';
import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { mat4 } from '../src/utils/index.js';
import { createUniformBinding } from './core-shared.js';
import type { BindGroup } from '../src/core/binding/BindGroup.js';
import type { CanvasContext } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { CompareFunction } from '../src/core/enums/CompareFunction.js';
import type { PipelineLayout } from '../src/core/binding/PipelineLayout.js';
import type { ColorAttachment, DepthStencilAttachment } from '../src/core/render/RenderTarget.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';
import type { RenderPipeline, RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import type { ShaderModule } from '../src/core/resources/ShaderModule.js';
import type { StencilFaceState } from '../src/core/pipeline/RenderState.js';
import type { UniformBinding } from './core-shared.js';

/** 离屏目标与 canvas 的边长（1:1 贴图，像素一一对应）。 */
const SIZE = 256;
/** 模板深度格式：唯一带 stencil aspect 的可渲染格式。 */
const STENCIL_DEPTH_FORMAT = 'depth24plus-stencil8' as const;
/** 清屏色（与页面底色一致）：字节值 11,14,19，正是 analyze-screenshot 的默认背景色。 */
const CLEAR: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];
/** 写模板那趟的颜色（蓝）：用来区分「模板四边形画出来了」与「被门控的物体画出来了」。 */
const MASK_COLOR: readonly [number, number, number, number] = [0.2, 0.4, 1, 1];
/** 被门控的第二个物体的颜色（纯绿）。 */
const HIT_COLOR: readonly [number, number, number, number] = [0, 1, 0, 1];
/** `pass.setStencilReference()` 写进模板缓冲的参考值。 */
const STENCIL_REFERENCE = 1;
/** `SceneUniforms` 的字节数：mat4（64）+ vec4（16）。 */
const UNIFORM_BYTES = 80;

/** RGBA 读回后每行字节数：256 * 4 = 1024，已经是 256 的倍数，WebGPU 不需要额外填充。 */
const BYTES_PER_ROW = SIZE * 4;
const READBACK_BYTES = BYTES_PER_ROW * SIZE;

/** 探针位置（+x 向右）：左半屏中心落在写模板的区域里，右半屏中心落在外面。 */
const INSIDE_X = Math.floor(SIZE / 4);
const OUTSIDE_X = Math.floor((SIZE * 3) / 4);
const PROBE_Y = Math.floor(SIZE / 2);

type Rgb = readonly [number, number, number];

const GREEN: Rgb = [0, 255, 0];
const BLUE: Rgb = [
  Math.round(MASK_COLOR[0] * 255),
  Math.round(MASK_COLOR[1] * 255),
  Math.round(MASK_COLOR[2] * 255),
];
const BACKGROUND: Rgb = [
  Math.round(CLEAR[0] * 255),
  Math.round(CLEAR[1] * 255),
  Math.round(CLEAR[2] * 255),
];

interface SceneSpec {
  /** 写进 `data-stencil-<name>-*` 的名字。 */
  readonly name: string;
  /** 写模板那趟的 `stencilWriteMask`；`0` 表示「一个位都不写」。 */
  readonly maskWriteMask: number;
  /** 被门控那趟的 `stencilReadMask`；`0` 表示「读出来全是 0」（比较必然相等）。 */
  readonly testReadMask: number;
  /** 被门控那趟的 `compare`。 */
  readonly testCompare: CompareFunction;
  /** 期望的左半屏 / 右半屏中心像素。 */
  readonly inside: Rgb;
  readonly outside: Rgb;
}

const SCENES: readonly SceneSpec[] = [
  { name: 'gated', maskWriteMask: 0xff, testReadMask: 0xff, testCompare: 'equal', inside: GREEN, outside: BACKGROUND },
  { name: 'control', maskWriteMask: 0xff, testReadMask: 0xff, testCompare: 'always', inside: GREEN, outside: GREEN },
  { name: 'nowrite', maskWriteMask: 0x00, testReadMask: 0xff, testCompare: 'equal', inside: BLUE, outside: BACKGROUND },
  { name: 'noread', maskWriteMask: 0xff, testReadMask: 0x00, testCompare: 'equal', inside: GREEN, outside: GREEN },
];

/** 默认停在哪个场景（截图统计用的那一份）。 */
const PRESENTED_SCENE = 'gated';

const VERTEX_GLSL = `
layout(location = 0) in vec2 position;
layout(std140) uniform SceneUniforms { mat4 projection; vec4 baseColor; } u;
void main() {
  gl_Position = u.projection * vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_GLSL = `
uniform SceneUniforms { mat4 projection; vec4 baseColor; } u;
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = u.baseColor;
}
`;

const SCENE_WGSL = `
struct SceneUniforms {
  projection: mat4x4f,
  baseColor: vec4f,
}

@group(0) @binding(0) var<uniform> u: SceneUniforms;

@vertex fn vsMain(@location(0) position: vec2f) -> @builtin(position) vec4f {
  return u.projection * vec4f(position, 0.0, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.baseColor;
}
`;

const BLIT_VERTEX_GLSL = `
layout(location = 0) in vec2 corner;
out vec2 vUv;
void main() {
  vUv = vec2(corner.x, 1.0 - corner.y);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

const BLIT_FRAGMENT_GLSL = `
uniform sampler2D uSource;
in vec2 vUv;
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = texture(uSource, vUv);
}
`;

const BLIT_WGSL = `
@group(0) @binding(0) var uSource: texture_2d<f32>;
@group(0) @binding(1) var uSource_sampler: sampler;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(@location(0) corner: vec2f) -> VSOut {
  var out: VSOut;
  // 与 GLSL 那边逐字一致：离屏那一趟已经统一过行序，上屏不翻，两个后端共用同一个 uv 公式。
  out.uv = vec2f(corner.x, 1.0 - corner.y);
  out.pos = vec4f(corner * 2.0 - 1.0, 0.0, 1.0);
  return out;
}

@fragment fn fsMain(in: VSOut) -> @location(0) vec4f {
  return textureSample(uSource, uSource_sampler, in.uv);
}
`;

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

const lines: string[] = [];
let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function writeOut(): void {
  const out = document.getElementById('out');
  if (!out) return;
  out.textContent = lines.join('\n');
  out.className = failures === 0 ? 'pass' : 'fail';
}

/** 两个像素是否在容差内相等（软件光栅化下 8 位量化足够稳定，取 ±6 只为防舍入）。 */
function matches(actual: Rgb, expected: Rgb, tolerance = 6): boolean {
  return (
    Math.abs(actual[0] - expected[0]) <= tolerance &&
    Math.abs(actual[1] - expected[1]) <= tolerance &&
    Math.abs(actual[2] - expected[2]) <= tolerance
  );
}

/** 覆盖左半屏的四边形（模板写入区域）。 */
const LEFT_HALF = new Float32Array([-1, -1, 0, -1, 0, 1, -1, -1, 0, 1, -1, 1]);
/** 覆盖整屏的四边形（被模板门控的第二个物体）。 */
const FULL_QUAD = new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);

/** 顶点步长：只有 vec2 position。 */
const VERTEX_STRIDE = 8;

/** 一个场景用到的两条管线与两个顶点缓冲。 */
interface SceneResources {
  readonly spec: SceneSpec;
  readonly maskPipeline: RenderPipeline;
  readonly hitPipeline: RenderPipeline;
  readonly maskVertices: { readonly buffer: ReturnType<Device['createBuffer']>; readonly byteLength: number };
  readonly hitVertices: { readonly buffer: ReturnType<Device['createBuffer']>; readonly byteLength: number };
}

/**
 * 建一条场景管线。
 *
 * `front` / `back` 两个模板面在这里**给同一份状态**：这一页只验证「比较 + 写入 + 掩码」，
 * 而 OpenGL 与 WebGPU 对「同一个三角形算正面还是背面」的判定受投影 Y 翻转影响（离屏纹理在
 * WebGL2 上是自下而上的，这一页会翻投影），刻意去踩那条差异只会让页面变脆。
 * 双面各自独立由单测钉住（断言 `stencilFuncSeparate` / `stencilOpSeparate` /
 * `stencilMaskSeparate` 的 FRONT 与 BACK 两组参数）。
 */
function createScenePipeline(
  device: Device,
  label: string,
  layout: PipelineLayout | 'auto',
  module: ShaderModule,
  stencilFace: StencilFaceState,
  readMask: number,
  writeMask: number,
): RenderPipeline {
  const descriptor: RenderPipelineDescriptor = {
    label,
    layout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: VERTEX_STRIDE,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none', frontFace: 'ccw' },
    // 声明 depthStencil（省略 format，格式由当前渲染目标提供）才会用到模板；
    // 深度本身写成「恒通过 + 不写」，让结论只可能来自模板测试。
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: 'always',
      stencilFront: stencilFace,
      stencilBack: stencilFace,
      stencilReadMask: readMask,
      stencilWriteMask: writeMask,
    },
  };
  return device.createRenderPipeline(descriptor);
}

/** 把场景的两趟绘制录进一个通道。 */
function recordScenePass(
  pass: RenderPassEncoder,
  scene: SceneResources,
  maskUniforms: BindGroup,
  hitUniforms: BindGroup,
): void {
  // ① 写模板：compare always + passOp replace，把左半屏的模板值写成参考值 1。
  pass.setPipeline(scene.maskPipeline);
  pass.setStencilReference(STENCIL_REFERENCE);
  pass.setBindGroup(0, maskUniforms);
  pass.setVertexBuffer(0, scene.maskVertices.buffer, 0, scene.maskVertices.byteLength);
  pass.draw({ vertexCount: 6 });

  // ② 被门控的第二个物体：只有模板值（与参考值相等）时才通过。
  pass.setPipeline(scene.hitPipeline);
  pass.setStencilReference(STENCIL_REFERENCE);
  pass.setBindGroup(0, hitUniforms);
  pass.setVertexBuffer(0, scene.hitVertices.buffer, 0, scene.hitVertices.byteLength);
  pass.draw({ vertexCount: 6 });
}

async function run(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const backend = params.get('backend') ?? 'auto';

  const canvas = document.getElementById('view') as HTMLCanvasElement;
  setData('stencilResult', 'running');

  const created = await createDeviceWithAdapter({
    canvas,
    backend: backend === 'webgl2' || backend === 'webgpu' ? backend : 'auto',
    strictBackend: backend !== 'auto',
    label: 'stencil-example',
    // 画布这一侧不需要深度/模板（模板只在离屏目标上做），也关掉抗锯齿。
    contextAttributes: { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: false },
  });
  const device: Device = created.device;
  const context: CanvasContext = created.context!;
  setData('stencilBackend', device.backend);

  context.setPixelRatio(1);
  context.setSize(SIZE, SIZE);

  // WebGPU 的校验失败是异步上报的，不订阅就只剩「画面全黑、没有异常」。
  const reported: string[] = [];
  device.onError((error) => {
    reported.push(`${error.name}: ${error.message}`);
  });

  /* ---- 离屏附件：颜色走 RenderTarget，深度/模板单独建一张 -------------------------------- */

  // 颜色附件：`sampled` 让它可以被上屏那趟采样，`CopySrc` 让它可以被读回。
  // **不能**在这里声明 `depth`：RenderTarget 的深度纹理挂在同一份 usage 下，而
  // `depth24plus-stencil8` 既不能采样也不能拷贝（WebGPU 会直接拒绝创建）。
  const colorTarget: RenderTarget = device.createRenderTarget({
    label: 'stencil-color',
    width: SIZE,
    height: SIZE,
    color: 'rgba8unorm',
    sampled: true,
    usage: TextureUsage.CopySrc,
  });
  const colorView = colorTarget.colors[0]!.createView({ label: 'stencil-color-view' });

  // 深度/模板附件：唯一带 stencil aspect 的可渲染格式，只需要 RenderAttachment。
  const depthStencilTexture = device.createTexture({
    label: 'stencil-depth-stencil',
    size: { width: SIZE, height: SIZE },
    format: STENCIL_DEPTH_FORMAT,
    usage: TextureUsage.RenderAttachment,
  });
  const depthStencilView = depthStencilTexture.createView({ label: 'stencil-depth-stencil-view' });
  setData('stencilDepthFormat', depthStencilTexture.format);

  /** 离屏通道的附件：颜色来自 RenderTarget，深度/模板来自单独创建的纹理。 */
  const offscreenAttachments = (): {
    colorAttachments: ColorAttachment[];
    depthStencilAttachment: DepthStencilAttachment;
  } => ({
    colorAttachments: [{ view: colorView, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    depthStencilAttachment: {
      view: depthStencilView,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      depthClearValue: 1,
      // 模板必须显式清成 0：通道开始时的 loadOp 决定模板缓冲的初值。
      stencilLoadOp: 'clear',
      stencilStoreOp: 'store',
      stencilClearValue: 0,
    },
  });

  /*
   * 行序：core 不代劳，这一页自己用公开 helper `mat4.flipClipY` 把投影在裁剪空间 Y 取反，
   * 于是离屏纹理的纹素行序两个后端一致，上屏那一趟（画 canvas，不翻）可以共用同一个 uv 公式。
   * 这一页的探针都在水平中线上，行序对结论没有影响 —— 但保持统一写法更不容易出错。
   */
  const projection = mat4.create();
  const flipRows = colorTarget.rowOrder === 'bottomUp';
  if (flipRows) mat4.flipClipY(projection, projection);
  setData('stencilRowOrder', colorTarget.rowOrder);

  /* ---- 资源 ------------------------------------------------------------------------------ */

  const sceneModule = device.createShaderModule({
    label: 'scene',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: SCENE_WGSL },
  });
  const blitModule = device.createShaderModule({
    label: 'blit',
    code: { vs: BLIT_VERTEX_GLSL, fs: BLIT_FRAGMENT_GLSL, wgsl: BLIT_WGSL },
  });

  // 两个 uniform 缓冲：写模板那趟用蓝、被门控那趟用绿。两者的 bind group 共用同一份 layout，
  // 这样两条管线可以共用一个 pipeline layout（WebGPU 对显式 layout 的兼容性按对象身份判定）。
  const maskUniforms: UniformBinding = createUniformBinding(device, { name: 'SceneUniforms', size: UNIFORM_BYTES });
  const hitUniforms: UniformBinding = createUniformBinding(device, { name: 'SceneUniforms', size: UNIFORM_BYTES });
  const scenePipelineLayout = device.createPipelineLayout({
    label: 'scene-pipeline-layout',
    bindGroupLayouts: [maskUniforms.layout],
  });
  const writeUniforms = (binding: UniformBinding, color: readonly [number, number, number, number]): void => {
    const data = new Float32Array(UNIFORM_BYTES / 4);
    data.set(projection, 0);
    data.set(color, 16);
    binding.write(data);
  };
  writeUniforms(maskUniforms, MASK_COLOR);
  writeUniforms(hitUniforms, HIT_COLOR);
  const hitBindGroup = device.createBindGroup({
    label: 'scene-uniforms-hit',
    layout: maskUniforms.layout,
    entries: [{ binding: 0, resource: { buffer: hitUniforms.buffer, offset: 0, size: UNIFORM_BYTES } }],
  });

  const leftHalfBuffer = device.createBuffer({
    label: 'stencil-left-half',
    size: LEFT_HALF.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(leftHalfBuffer, 0, LEFT_HALF);
  const fullQuadBuffer = device.createBuffer({
    label: 'stencil-full-quad',
    size: FULL_QUAD.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(fullQuadBuffer, 0, FULL_QUAD);

  const scenes: SceneResources[] = SCENES.map((spec) => ({
    spec,
    maskPipeline: createScenePipeline(
      device,
      `stencil-mask-${spec.name}`,
      scenePipelineLayout,
      sceneModule,
      { compare: 'always', failOp: 'keep', depthFailOp: 'keep', passOp: 'replace' },
      0xff,
      spec.maskWriteMask,
    ),
    hitPipeline: createScenePipeline(
      device,
      `stencil-hit-${spec.name}`,
      scenePipelineLayout,
      sceneModule,
      { compare: spec.testCompare, failOp: 'keep', depthFailOp: 'keep', passOp: 'keep' },
      spec.testReadMask,
      0x00,
    ),
    maskVertices: { buffer: leftHalfBuffer, byteLength: LEFT_HALF.byteLength },
    hitVertices: { buffer: fullQuadBuffer, byteLength: FULL_QUAD.byteLength },
  }));

  /* ---- 读回缓冲 -------------------------------------------------------------------------- */

  const readback = device.createBuffer({
    label: 'stencil-readback',
    size: READBACK_BYTES,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });

  /** 在一个通道里录下场景的两趟绘制（通道开始时按 loadOp 清掉颜色与模板）。 */
  const recordScene = (
    encoder: ReturnType<Device['createCommandEncoder']>,
    scene: SceneResources,
    label: string,
  ): void => {
    const attachments = offscreenAttachments();
    const pass = encoder.beginRenderPass({
      label,
      colorAttachments: attachments.colorAttachments,
      depthStencilAttachment: attachments.depthStencilAttachment,
    });
    // 注意：写模板与被门控的两次绘制必须在**同一个渲染通道**里 ——
    // 通道开始时按 loadOp 清模板，分成两个通道会把刚写进去的值清掉。
    recordScenePass(pass, scene, maskUniforms.bindGroup, hitBindGroup);
    pass.end();
  };

  /** 画一个场景并读回它的像素（离屏颜色附件，两个后端都走 copyTextureToBuffer）。 */
  const renderAndRead = async (scene: SceneResources): Promise<Uint8Array> => {
    const label = `stencil-${scene.spec.name}`;
    const encoder = device.createCommandEncoder({ label });
    recordScene(encoder, scene, label);
    const copy = device.createCommandEncoder({ label: `${label}-copy` });
    copy.copyTextureToBuffer(
      { texture: colorTarget.colors[0]!, origin: { x: 0, y: 0 } },
      { buffer: readback, offset: 0, bytesPerRow: BYTES_PER_ROW },
      { width: SIZE, height: SIZE, depthOrArrayLayers: 1 },
    );
    device.queue.submit([encoder.finish(), copy.finish()]);

    await readback.mapAsync('read', 0, READBACK_BYTES);
    const pixels = new Uint8Array(readback.getMappedRange(0, READBACK_BYTES)).slice();
    readback.unmap();
    return pixels;
  };

  const pixelAt = (pixels: Uint8Array, x: number, y: number): Rgb => {
    const index = (y * SIZE + x) * 4;
    return [pixels[index]!, pixels[index + 1]!, pixels[index + 2]!];
  };

  /* ---- 四个场景 -------------------------------------------------------------------------- */

  const results = new Map<string, Uint8Array>();
  for (const scene of scenes) {
    const pixels = await renderAndRead(scene);
    results.set(scene.spec.name, pixels);

    const inside = pixelAt(pixels, INSIDE_X, PROBE_Y);
    const outside = pixelAt(pixels, OUTSIDE_X, PROBE_Y);
    const key = capitalize(scene.spec.name);
    setData(`stencil${key}Inside`, inside.join(','));
    setData(`stencil${key}Outside`, outside.join(','));
    check(
      `[${scene.spec.name}] 左半屏中心 = 期望值`,
      matches(inside, scene.spec.inside),
      `实际 rgb=${inside.join(',')}，期望 ${scene.spec.inside.join(',')}`,
    );
    check(
      `[${scene.spec.name}] 右半屏中心 = 期望值`,
      matches(outside, scene.spec.outside),
      `实际 rgb=${outside.join(',')}，期望 ${scene.spec.outside.join(',')}`,
    );
  }

  /* ---- 上屏：停在基准场景，供真实合成截图统计 --------------------------------------------- */

  const presented = scenes.find((scene) => scene.spec.name === PRESENTED_SCENE) ?? scenes[0]!;
  const blitSampler = device.createSampler({
    label: 'blit-sampler',
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });
  const blitLayout = device.createBindGroupLayout({
    label: 'blit-layout',
    entries: [
      { binding: 0, visibility: ShaderStage.Fragment, type: BindingType.Texture, name: 'uSource' },
      {
        binding: 1,
        visibility: ShaderStage.Fragment,
        type: BindingType.Sampler,
        // 名字按「纹理名 + _sampler」：WebGL2 后端靠它把 sampler 与纹理配对。
        name: 'uSource_sampler',
        sampler: { type: 'filtering' },
      },
    ],
  });
  const blitPipeline = device.createRenderPipeline({
    label: 'blit',
    layout: device.createPipelineLayout({ label: 'blit-pipeline-layout', bindGroupLayouts: [blitLayout] }),
    vertex: {
      module: blitModule,
      entryPoint: 'vsMain',
      buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }],
    },
    fragment: { module: blitModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });
  const corners = new Float32Array([0, 0, 2, 0, 0, 2]);
  const cornerBuffer = device.createBuffer({
    label: 'blit-corners',
    size: corners.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(cornerBuffer, 0, corners);
  const blitBindGroup = device.createBindGroup({
    label: 'blit-bind-group',
    layout: blitLayout,
    entries: [
      { binding: 0, resource: { view: colorView } },
      { binding: 1, resource: { sampler: blitSampler } },
    ],
  });

  const presentEncoder = device.createCommandEncoder({ label: 'stencil-present' });
  recordScene(presentEncoder, presented, 'stencil-present-offscreen');

  const frame = context.getCurrentFrameTarget();
  const blitPass = presentEncoder.beginRenderPass({
    label: 'stencil-present-blit',
    colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
  });
  blitPass.setPipeline(blitPipeline);
  blitPass.setBindGroup(0, blitBindGroup);
  blitPass.setVertexBuffer(0, cornerBuffer, 0, corners.byteLength);
  blitPass.draw({ vertexCount: 3 });
  blitPass.end();
  device.queue.submit([presentEncoder.finish()]);

  // WebGPU 的错误是异步上报的：等两拍再下结论。
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (reported.length > 0) {
    setData('stencilError', reported.join(' | ').replace(/\s+/g, ' '));
    check('设备错误通道没有上报错误', false, reported.join(' | '));
  }

  /* ---- 对照结论 -------------------------------------------------------------------------- */

  const gated = results.get('gated')!;
  const control = results.get('control')!;
  const controlOutside = pixelAt(control, OUTSIDE_X, PROBE_Y);
  const gatedInside = pixelAt(gated, INSIDE_X, PROBE_Y);
  const gatedOutside = pixelAt(gated, OUTSIDE_X, PROBE_Y);
  check(
    '对照：第二个物体确实光栅化到了整屏（control 场景右半屏是绿）',
    matches(controlOutside, GREEN),
    `control 右半屏 rgb=${controlOutside.join(',')}`,
  );
  check(
    '基准场景：第二个物体只出现在模板为 1 的左半屏',
    matches(gatedInside, GREEN) && matches(gatedOutside, BACKGROUND),
    `inside=${gatedInside.join(',')} outside=${gatedOutside.join(',')}`,
  );

  lines.push('');
  lines.push(
    `backend=${device.backend}　离屏 ${SIZE}x${SIZE}（${STENCIL_DEPTH_FORMAT}）　参考值=${STENCIL_REFERENCE}`,
  );
  setData('stencilResult', failures === 0 ? 'pass' : 'fail');
  writeOut();
}

/** 把场景名首字母大写，拼 `data-*` 键名用。 */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  setData('stencilError', message.replace(/\s+/g, ' '));
  failures += 1;
  lines.push(`非预期异常：${message}`);
  setData('stencilResult', 'fail');
  writeOut();
});
