/**
 * 「渲染到纹理再采样上屏」的行序对照页（**跨后端一致性的决定性证据页**）。
 *
 * ## 这一页要证明什么
 *
 * 本库的纹理约定是「纹素 (0, 0) 在左上角，纹理坐标 `v = 0` 是图像顶部」
 * （见 `src/core/resources/Texture.ts`）。这条约定必须对**渲染出来**的纹理同样成立 ——
 * 否则「先渲染到纹理、再把这张纹理采样上屏」这条最常见的后处理链路会在两个后端给出
 * 上下颠倒的画面（而两个后端的**上屏**本来就是逐像素一致的，见 `docs/backend-limits.md`）。
 *
 * 所以这一页刻意做成一条**典型的离屏后处理链路**，而且画面刻意上下不对称：
 *
 * 1. **离屏 pass**：把「四象限 + 两个只在单侧出现的白色标记」画进一张 `SIZE×SIZE` 的纹理。
 *    顶点着色器用「图像坐标」写法（`uv.y = 0` → 裁剪空间顶部），这正是库里推荐的写法：
 *    `v = 0` 是图像顶部，所以它出现在画面顶部。
 * 2. **上屏 pass**：用同一个四边形的顶点着色器把这张纹理 1:1 最近邻贴到 canvas 上。
 *    这一步不引入任何滤波，画布上每个像素就是纹理里对应纹素的颜色。
 * 3. **读回**：`copyTextureToBuffer` 把这张纹理读回主机内存，直接报出**纹素第 0 行 / 最后一行**
 *    的颜色（不做任何翻转）。于是「纹素行序」这件事本身也有可抓取的量化结论。
 *
 * ## 两条路径 + 一份对照（同一页给全）
 *
 * - `?layer=core`（默认）—— **core 层显式统一**：core 不代劳，页面自己用公开 helper
 *   `mat4.flipClipY` 在**渲染进纹理**时把投影在裁剪空间 Y 取反（只在
 *   `target.rowOrder === 'bottomUp'` 时做，也就是 WebGL2）。同一页还额外渲染一份**不翻**的
 *   「对照目标」并读回它 —— 那一份在 WebGL2 上必须是 `false`（「加 helper 之前」的表现），
 *   在 WebGPU 上本来就是 `true`。
 * - `?layer=gfx` —— **gfx 层自动统一**：用 `Renderer` 把同一个图案画进同一个离屏目标，
 *   **页面不为行序写任何代码**。`Renderer` 在「附件是纹理」的通道上自动做上面那件事，
 *   并且自动把同一通道的 `frontFace` 换过来（这个材质的 `cullMode` 保持默认的 `'back'`，
 *   所以只要投影翻了而 `frontFace` 没跟着翻，整块会被剔除、读回立刻失败）。
 * - 上屏那一趟两条路径都走 core 的 1:1 贴图管线：**canvas 默认帧缓冲永远不翻**
 *   （浏览器合成本来就是对的），所以它两个后端用的是同一份着色器、同一个 uv 公式。
 *
 * 判据（`scripts/capture-screenshot.mjs` + `scripts/compare-screenshots.mjs` 抓真实合成截图）：
 *
 * - 修复前：WebGL2 的渲染目标自下而上存储（GL 的窗口原点在左下），两个后端的截图**互为上下翻转**
 *   （原样一致率很低、翻转一致率接近 100%）；
 * - 修复后：原样一致率接近 100%，而上下翻转的一致率明显更低。
 *
 * ## 页面自报的结论（`<html data-*>`）
 *
 * - `rttResult`：`pass` / `fail`（`fail` 时 `rttError` 是原文）
 * - `rttLayer`：`core` / `gfx`
 * - `rttBackend` / `rttAdapter`：实际后端与 adapter
 * - `rttTargetRowOrder`：离屏目标的后端原生行序（`topLeft` / `bottomUp`）
 * - `rttProjectionFlipped`：core 路径下表示「页面有没有用 helper 翻投影」
 *   （`true` = 翻了，`false` = 没翻）；gfx 路径下恒为 `gfx-auto`（页面没有写翻转代码）
 * - `rttTexelTopLeftPixel` / `rttTexelTopRightPixel`：**统一后**纹素第 0 行左右两个采样列的颜色
 * - `rttTexelBottomLeftPixel` / `rttTexelBottomRightPixel`：统一后纹素**最后一行**同样两列的颜色
 * - `rttRowOrderOk`：`true` 表示「纹素第 0 行 = 图案顶部」（本库的行序契约），两个后端都必须是 true
 * - `rttRawRowOrderOk` / `rttRawTexelTopLeftPixel` / `rttRawTexelBottomLeftPixel`：
 *   **不翻**的那一份对照目标的行序结论与首/末行颜色（WebGL2 上必须是 `false`）；
 *   gfx 路径没有这一份（这是它的卖点），报 `n/a`
 * - `rttCanvasSize`：画布边长
 *
 * 查询参数：`?backend=webgl2|webgpu|auto`（默认 `auto`）、`?layer=core|gfx`（默认 `core`）、
 * `?canvas=unified|raw`（core 路径专用，默认 `unified`）：
 * **`?canvas=raw` 就是「修复前」的对照** —— 上屏贴的是那份**不翻**的对照目标，
 * 于是两个后端的截图互为上下翻转（`scripts/compare-screenshots.mjs` 上表现为
 * 「原样一致率很低、上下翻转一致率接近 100%」）。
 */

import {
  BindingType,
  BufferUsage,
  ShaderStage,
  TextureUsage,
  createDeviceWithAdapter,
  mat4,
} from '../src/index.js';
import { OrthographicCamera, Renderer, defineMaterial } from '../src/index.js';
import { createUniformBinding } from './core-shared.js';
import type { CanvasContext } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';

/** 离屏目标与画布共用边长（1:1 贴图，纹理纹素与画布像素一一对应）。 */
const SIZE = 384;

/**
 * 图案配色（0..1 线性无关的归一化值，直接写进着色器）。
 *
 * 上下两半用完全不同的色系，并且各有一个**只在上半 / 只在下半**出现的白色标记：
 * 只要行序反了，「纹素第 0 行」的颜色就会从上半色变成下半色，肉眼与像素统计都能立刻看出来。
 */
const COLORS = {
  topLeft: [0.85, 0.16, 0.16],
  topRight: [0.16, 0.65, 0.24],
  bottomLeft: [0.13, 0.32, 0.85],
  bottomRight: [0.93, 0.78, 0.12],
  marker: [1.0, 1.0, 1.0],
} as const;

/** 采样列：左右各 32 像素（避开中心线），于是同一行上的两个采样点分属左右两块。 */
const COLUMN_LEFT = 32;
const COLUMN_RIGHT = SIZE - 32;

/** GLSL 的 `vec3(...)` 字面量。 */
function glslVec3(color: readonly number[]): string {
  return `vec3(${color.map((value) => value.toFixed(3)).join(', ')})`;
}

/** WGSL 的 `vec3f(...)` 字面量。 */
function wgslVec3(color: readonly number[]): string {
  return `vec3f(${color.map((value) => value.toFixed(3)).join(', ')})`;
}

/**
 * 图案的判定逻辑（GLSL 与 WGSL 各写一遍，逐条一一对应）。
 *
 * `v = 0` 是图像顶部：所以 `v < 0.5` 是**上半部分**。白色横条只出现在上四分之一处，
 * 白色小方块只出现在下四分之一处的右侧。
 */
const PATTERN_GLSL = `
  vec3 color;
  if (vUv.y < 0.5) {
    color = vUv.x < 0.5 ? ${glslVec3(COLORS.topLeft)} : ${glslVec3(COLORS.topRight)};
  } else {
    color = vUv.x < 0.5 ? ${glslVec3(COLORS.bottomLeft)} : ${glslVec3(COLORS.bottomRight)};
  }
  // 只在上半部分出现的白色横条。
  if (vUv.y > 0.10 && vUv.y < 0.18) color = ${glslVec3(COLORS.marker)};
  // 只在下半部分右侧出现的白色小方块。
  if (vUv.y > 0.80 && vUv.y < 0.88 && vUv.x > 0.78 && vUv.x < 0.90) color = ${glslVec3(COLORS.marker)};
`;

const PATTERN_WGSL = `
  var color: vec3f;
  if (vUv.y < 0.5) {
    color = select(${wgslVec3(COLORS.topRight)}, ${wgslVec3(COLORS.topLeft)}, vUv.x < 0.5);
  } else {
    color = select(${wgslVec3(COLORS.bottomRight)}, ${wgslVec3(COLORS.bottomLeft)}, vUv.x < 0.5);
  }
  // 只在上半部分出现的白色横条。
  if (vUv.y > 0.10 && vUv.y < 0.18) { color = ${wgslVec3(COLORS.marker)}; }
  // 只在下半部分右侧出现的白色小方块。
  if (vUv.y > 0.80 && vUv.y < 0.88 && vUv.x > 0.78 && vUv.x < 0.90) { color = ${wgslVec3(COLORS.marker)}; }
`;

/**
 * 四边形的顶点着色器体（离屏、上屏、gfx 三条管线共用同一套映射）。
 *
 * **这是「图像坐标」写法**：顶点属性 `corner` 就是 uv，`uv.y = 0`（图像顶部）落在裁剪空间
 * 顶部。两个后端对这个映射的解释完全一样（都是裁剪空间 y 向上），差别只在**纹素怎么存**
 * —— 而那一处由投影矩阵负责，不是顶点映射的事。
 */
const QUAD_VERTEX_GLSL_BODY = `
  vUv = corner;
  gl_Position = u.projection * vec4(corner.x * 2.0 - 1.0, 1.0 - corner.y * 2.0, 0.0, 1.0);
`;

const QUAD_VERTEX_WGSL_BODY = `
  out.uv = corner;
  out.pos = u.projection * vec4f(corner.x * 2.0 - 1.0, 1.0 - corner.y * 2.0, 0.0, 1.0);
`;

/** core 离屏管线的 GLSL（uniform 块名与 bind group layout 里的 `name` 一致）。 */
const CORE_SCENE_GLSL = {
  vs: `
layout(location = 0) in vec2 corner;
layout(std140) uniform SceneUniforms { mat4 projection; } u;
out vec2 vUv;
void main() {
${QUAD_VERTEX_GLSL_BODY}
}
`,
  fs: `
in vec2 vUv;
layout(location = 0) out vec4 fragColor;
void main() {
${PATTERN_GLSL}
  fragColor = vec4(color, 1.0);
}
`,
};

const CORE_SCENE_WGSL = `
struct SceneUniforms {
  projection: mat4x4f,
}

@group(0) @binding(0) var<uniform> u: SceneUniforms;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(@location(0) corner: vec2f) -> VSOut {
  var out: VSOut;
${QUAD_VERTEX_WGSL_BODY}
  return out;
}

@fragment fn fsMain(in: VSOut) -> @location(0) vec4f {
  let vUv = in.uv;
${PATTERN_WGSL}
  return vec4f(color, 1.0);
}
`;

/**
 * 上屏管线的顶点着色器：与离屏那份**同一套 uv 映射**，只是采样源换成纹理。
 *
 * 注意它画的是 **canvas**，画布那一侧两个后端本来就是一致的（浏览器合成路径永远是从上往下），
 * 所以这里不用任何翻转，两个后端共用同一份源码。
 */
const BLIT_VERTEX_GLSL = `
layout(location = 0) in vec2 corner;
layout(std140) uniform SceneUniforms { mat4 projection; } u;
out vec2 vUv;
void main() {
${QUAD_VERTEX_GLSL_BODY}
}
`;

const BLIT_VERTEX_WGSL = `
struct SceneUniforms {
  projection: mat4x4f,
}

@group(0) @binding(0) var<uniform> u: SceneUniforms;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(@location(0) corner: vec2f) -> VSOut {
  var out: VSOut;
${QUAD_VERTEX_WGSL_BODY}
  return out;
}
`;

/**
 * 上屏的片元着色器：**1:1 最近邻**采样离屏纹理。
 *
 * 采样用的 uv 就是顶点里那份「图像坐标」uv，所以纹素 (0, 0)（图像左上）落在画布左上 ——
 * 这正是本库的约定在两个后端都成立时该有的样子。改动前后这个着色器一个字都不变。
 */
const BLIT_FRAGMENT_GLSL = `
uniform sampler2D uSource;
in vec2 vUv;
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = texture(uSource, vUv);
}
`;

const BLIT_FRAGMENT_WGSL = `
@group(1) @binding(0) var uSource: texture_2d<f32>;
@group(1) @binding(1) var uSource_sampler: sampler;

@fragment fn fsMain(in: VSOut) -> @location(0) vec4f {
  return textureSample(uSource, uSource_sampler, in.uv);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* gfx 材质（`?layer=gfx` 专用）                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/**
 * gfx 材质的 GLSL 体：与 core 那份**同一套 uv 映射**，投影改由库提供的
 * `u.projectionView` / `u.model` 给出 —— 这正是「库能替你翻」的前提。
 */
const GFX_SCENE_GLSL = {
  vs: `
out vec2 vUv;
void main() {
  vUv = corner;
  gl_Position = u.projectionView * u.model * vec4(corner.x * 2.0 - 1.0, 1.0 - corner.y * 2.0, 0.0, 1.0);
}
`,
  fs: `
in vec2 vUv;
void main() {
${PATTERN_GLSL}
  fragColor = vec4(color, 1.0);
}
`,
};

const GFX_SCENE_WGSL = `
struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(v: VertexInput) -> VSOut {
  var out: VSOut;
  out.uv = v.corner;
  out.pos = u.projectionView * u.model * vec4f(v.corner.x * 2.0 - 1.0, 1.0 - v.corner.y * 2.0, 0.0, 1.0);
  return out;
}

@fragment fn fsMain(in: VSOut) -> @location(0) vec4f {
  let vUv = in.uv;
${PATTERN_WGSL}
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 公共小工具                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

function writeOut(lines: readonly string[], ok: boolean): void {
  const out = document.getElementById('out');
  if (!out) return;
  out.textContent = lines.join('\n');
  out.className = ok ? 'pass' : 'fail';
}

/** 0..1 的归一化颜色 → 0..255 的字节（与着色器里的字面量是同一份数据）。 */
function toBytes(color: readonly number[]): [number, number, number] {
  return [Math.round(color[0]! * 255), Math.round(color[1]! * 255), Math.round(color[2]! * 255)];
}

/** 从紧凑的 RGBA 像素里取某个像素的 `r,g,b`。 */
function pixelAt(pixels: Uint8Array, x: number, y: number): [number, number, number] {
  const index = (y * SIZE + x) * 4;
  return [pixels[index]!, pixels[index + 1]!, pixels[index + 2]!];
}

/** 逐通道差的绝对值是否都在容差内。 */
function matches(
  actual: readonly [number, number, number],
  expected: readonly [number, number, number],
  tolerance = 4,
): boolean {
  return actual.every((value, channel) => Math.abs(value - expected[channel]!) <= tolerance);
}

/** 一次「行序判定」的全部结果。 */
interface Orientation {
  readonly topLeft: readonly [number, number, number];
  readonly topRight: readonly [number, number, number];
  readonly bottomLeft: readonly [number, number, number];
  readonly bottomRight: readonly [number, number, number];
  /** `true` = 纹素第 0 行就是图案顶部（本库的行序契约）。 */
  readonly ok: boolean;
}

/** 按四个采样点判定行序。 */
function orientationOf(pixels: Uint8Array): Orientation {
  const topLeft = pixelAt(pixels, COLUMN_LEFT, 0);
  const topRight = pixelAt(pixels, COLUMN_RIGHT, 0);
  const bottomLeft = pixelAt(pixels, COLUMN_LEFT, SIZE - 1);
  const bottomRight = pixelAt(pixels, COLUMN_RIGHT, SIZE - 1);
  return {
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    ok:
      matches(topLeft, toBytes(COLORS.topLeft)) &&
      matches(topRight, toBytes(COLORS.topRight)) &&
      matches(bottomLeft, toBytes(COLORS.bottomLeft)) &&
      matches(bottomRight, toBytes(COLORS.bottomRight)),
  };
}

/**
 * 把离屏目标读回成**紧凑 RGBA**（保持纹素行序，绝不翻转）。
 *
 * 「缓冲区第 0 行 = 纹素第 0 行」这条语义两个后端一致（见 `src/core/resources/Texture.ts`），
 * 所以页面报出的 `rttTexelTopLeftPixel` 说的就是**纹素第 0 行**的颜色。
 */
async function readRows(device: Device, target: RenderTarget): Promise<Uint8Array> {
  const bytesPerRow = Math.ceil((SIZE * 4) / 256) * 256;
  const byteLength = bytesPerRow * SIZE;
  const readback = device.createBuffer({
    label: 'rtt-readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const copyEncoder = device.createCommandEncoder({ label: 'rtt-copy' });
  copyEncoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow },
    { width: SIZE, height: SIZE, depthOrArrayLayers: 1 },
  );
  device.queue.submit([copyEncoder.finish()]);

  await readback.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
  readback.unmap();
  readback.destroy();

  // 去掉每行 256 对齐的填充，得到紧凑像素（保持纹素行序）。
  const pixels = new Uint8Array(SIZE * 4 * SIZE);
  for (let row = 0; row < SIZE; row++) {
    pixels.set(raw.subarray(row * bytesPerRow, row * bytesPerRow + SIZE * 4), row * SIZE * 4);
  }
  return pixels;
}

/* ------------------------------------------------------------------------------------------------ */
/* 资源                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Quad {
  readonly corners: Float32Array;
  readonly indices: Uint16Array;
  readonly cornerBuffer: ReturnType<Device['createBuffer']>;
  readonly indexBuffer: ReturnType<Device['createBuffer']>;
}

/**
 * 建一份四边形：`corner` 既当位置（映射到裁剪空间）又当 uv。
 *
 * 索引刻意写成 **(0,2,1) (0,3,2) —— 在裁剪空间是逆时针**：gfx 路径的材质用默认的
 * `cullMode: 'back'`，于是「绕序」在那一侧是**真的被剔除规则检验**的（投影一翻绕序就反，
 * `Renderer` 必须把 `frontFace` 一起换过来，否则整块被剔除、读回一片黑）。
 */
function createQuad(device: Device): Quad {
  const corners = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  const indices = new Uint16Array([0, 2, 1, 0, 3, 2]);
  const cornerBuffer = device.createBuffer({
    label: 'quad-corners',
    size: corners.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(cornerBuffer, 0, corners);
  const indexBuffer = device.createBuffer({
    label: 'quad-indices',
    size: indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);
  return { corners, indices, cornerBuffer, indexBuffer };
}

/** 投影 uniform（块名 `SceneUniforms`，一个 mat4 = 64 字节）。 */
function createProjectionUniform(device: Device, projection: Float32Array): ReturnType<typeof createUniformBinding> {
  const binding = createUniformBinding(device, { name: 'SceneUniforms', size: 64 });
  binding.write(projection);
  return binding;
}

/** 离屏目标：既要能被采样（TextureBinding），也要能读回（CopySrc）。 */
function createTarget(device: Device, label: string): RenderTarget {
  return device.createRenderTarget({
    label,
    width: SIZE,
    height: SIZE,
    color: 'rgba8unorm',
    depth: false,
    usage: TextureUsage.TextureBinding | TextureUsage.CopySrc,
  });
}

/** 一条 1:1 最近邻贴图上屏的管线（两条路径共用；画布永远不翻）。 */
interface Blit {
  run(context: CanvasContext): void;
}

function createBlit(device: Device, quad: Quad, source: RenderTarget, projection: Float32Array): Blit {
  const sampler = device.createSampler({
    label: 'rtt-sampler',
    // 最近邻：上屏这一步必须是纯拷贝，画面上每个像素就是纹理里对应纹素的颜色。
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });
  const uniform = createProjectionUniform(device, projection);
  const textureLayout = device.createBindGroupLayout({
    label: 'rtt-blit-textures',
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
  const textureGroup = device.createBindGroup({
    label: 'rtt-blit-textures-bind-group',
    layout: textureLayout,
    entries: [
      { binding: 0, resource: { view: source.colors[0]!.createView({ label: 'rtt-source' }) } },
      { binding: 1, resource: { sampler } },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'rtt-blit-pipeline-layout',
    bindGroupLayouts: [uniform.layout, textureLayout],
  });
  const module = device.createShaderModule({
    label: 'rtt-blit',
    code: {
      vs: BLIT_VERTEX_GLSL,
      fs: BLIT_FRAGMENT_GLSL,
      wgsl: `${BLIT_VERTEX_WGSL}\n${BLIT_FRAGMENT_WGSL}`,
    },
  });
  const pipeline = device.createRenderPipeline({
    label: 'rtt-blit',
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }],
    },
    // 上屏那一路的附件格式由画布决定（WebGPU 上是 `bgra8unorm`，WebGL2 上是浏览器定），
    // 所以这里**不写** `targets`：让后端按渲染通道的附件格式解析（库里推荐的跨后端写法）。
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  return {
    run(context: CanvasContext): void {
      const frame = context.getCurrentFrameTarget();
      const encoder = device.createCommandEncoder({ label: 'rtt-blit' });
      const pass = encoder.beginRenderPass({
        label: 'rtt-blit-pass',
        colorAttachments: [
          { view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, uniform.bindGroup);
      pass.setBindGroup(1, textureGroup);
      pass.setVertexBuffer(0, quad.cornerBuffer, 0, quad.corners.byteLength);
      pass.setIndexBuffer(quad.indexBuffer, 'uint16', 0, quad.indices.byteLength);
      pass.drawIndexed({ indexCount: quad.indices.length });
      pass.end();
      device.queue.submit([encoder.finish()]);
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 两条路径                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** 一次运行的完整上下文，交给 {@link finish} 读回与下结论。 */
interface LayerReport {
  readonly layer: 'core' | 'gfx';
  readonly device: Device;
  readonly adapter: string;
  /** 统一后的目标（本页的主判据）。 */
  readonly unified: RenderTarget;
  /** 「不翻」的对照目标；gfx 路径没有这一份。 */
  readonly raw: RenderTarget | null;
  /** core 路径：页面有没有用 `mat4.flipClipY` 翻投影。 */
  readonly projectionFlipped: boolean;
  readonly notes: readonly string[];
}

/**
 * core 路径：**页面自己**用公开 helper 把投影翻过来。
 *
 * core 层只如实暴露 `RenderTarget.rowOrder`，不做任何自动翻转 —— 这正是这一层的分工：
 * 想统一就自己翻，翻法由 helper 给出。
 */
async function runCoreLayer(
  canvas: HTMLCanvasElement,
  backend: string,
  identity: Float32Array,
  canvasSource: 'unified' | 'raw',
): Promise<LayerReport> {
  const created = await createDeviceWithAdapter({
    canvas,
    backend: backend === 'webgl2' || backend === 'webgpu' ? backend : 'auto',
    strictBackend: backend !== 'auto',
    label: 'rtt-orientation',
    contextAttributes: { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: false },
  });
  const device: Device = created.device;
  const context: CanvasContext = created.context!;
  context.setPixelRatio(1);
  context.setSize(SIZE, SIZE);

  const quad = createQuad(device);
  const unified = createTarget(device, 'rtt-unified');
  const raw = createTarget(device, 'rtt-raw');

  /*
   * 想统一就自己来：用公开 helper `mat4.flipClipY` 把投影在**裁剪空间** Y 取反。
   * 它等价于在顶点着色器里写 `gl_Position.y *= -1`，并且**会反转三角绕序** ——
   * 页面这个四边形的索引是按「裁剪空间逆时针」选的，所以调用方（如果开了背面剔除）
   * 要把 `frontFace` 一起换过来。本页 core 的三条管线都是 `cullMode: 'none'`，
   * 真正检验绕序的是 gfx 那一侧（`?layer=gfx`，用默认的 `'back'`）。
   */
  const useHelper = unified.rowOrder === 'bottomUp';
  const flippedProjection = mat4.create();
  mat4.flipClipY(flippedProjection, identity);

  /*
   * 两份投影 uniform：一份是页面自己翻好的（统一目标），一份是原样的（对照目标）。
   * 管线布局直接复用这份 bind group layout —— 两个后端都要求 layout 是**同一个对象**
   * （元素逐个相等是不够的）。
   */
  const unifiedUniform = createProjectionUniform(device, useHelper ? flippedProjection : identity);
  const rawUniform = createProjectionUniform(device, identity);
  const uniformLayout = unifiedUniform.layout;

  const sceneModule = device.createShaderModule({
    label: 'rtt-scene',
    code: { vs: CORE_SCENE_GLSL.vs, fs: CORE_SCENE_GLSL.fs, wgsl: CORE_SCENE_WGSL },
  });
  const scenePipeline = device.createRenderPipeline({
    label: 'rtt-scene',
    layout: device.createPipelineLayout({ label: 'rtt-scene-pipeline-layout', bindGroupLayouts: [uniformLayout] }),
    vertex: {
      module: sceneModule,
      entryPoint: 'vsMain',
      buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] }],
    },
    fragment: { module: sceneModule, entryPoint: 'fsMain', targets: [{ format: 'rgba8unorm' }] },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const encoder = device.createCommandEncoder({ label: 'rtt-frame' });
  const drawInto = (target: RenderTarget, uniform: ReturnType<typeof createUniformBinding>): void => {
    const descriptor = target.createPassDescriptor({
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: [0, 0, 0, 1],
    });
    const pass = encoder.beginRenderPass({
      label: 'rtt-scene-pass',
      colorAttachments: descriptor.colorAttachments,
    });
    pass.setPipeline(scenePipeline);
    pass.setBindGroup(0, uniform.bindGroup);
    pass.setVertexBuffer(0, quad.cornerBuffer, 0, quad.corners.byteLength);
    pass.setIndexBuffer(quad.indexBuffer, 'uint16', 0, quad.indices.byteLength);
    pass.drawIndexed({ indexCount: quad.indices.length });
    pass.end();
  };
  drawInto(unified, unifiedUniform);
  drawInto(raw, rawUniform);
  device.queue.submit([encoder.finish()]);

  // 上屏：canvas 不翻（见 createBlit 的说明）。
  // `?canvas=raw` 时贴那份**不翻**的对照目标 —— 那就是「加 helper 之前」的画面。
  createBlit(device, quad, canvasSource === 'raw' ? raw : unified, identity).run(context);
  setData('rttCanvasSource', canvasSource);

  return {
    layer: 'core',
    device,
    adapter: created.adapter.info.device || created.adapter.info.vendor || 'unknown',
    unified,
    raw,
    projectionFlipped: useHelper,
    notes: [
      'core 路径：页面用公开 helper mat4.flipClipY 自己翻投影（core 不做自动翻转）。',
      '对照目标那一份**不翻**，它的行序结论就是「加 helper 之前」的表现。',
      canvasSource === 'raw'
        ? '本次上屏贴的是**不翻**的对照目标（?canvas=raw），也就是「修复前」的画面。'
        : `本次上屏贴的是统一后的目标（?canvas=${canvasSource}）。`,
    ],
  };
}

/**
 * gfx 路径：**一行翻转代码都没有**。
 *
 * 图案用 gfx 的材质画进离屏目标，投影来自 `Renderer` 写入的 `projectionView` ——
 * 于是「渲染进纹理」这件事完全由 `Renderer` 按目标的行序处理（含 `frontFace`）。
 */
async function runGfxLayer(canvas: HTMLCanvasElement, backend: string): Promise<LayerReport> {
  const renderer = await Renderer.create({
    canvas,
    backend: backend === 'webgl2' || backend === 'webgpu' ? backend : 'auto',
    antialias: false,
    depth: false,
    clearColor: [0, 0, 0, 1],
  });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE);

  /*
   * 正交相机覆盖裁剪空间的 [-1, 1]²：顶点里的 `corner` 于是直接就是「图像坐标」，
   * 与 core 路径的意义完全一样（`corner.y = 0` 是图像顶部）。
   */
  const camera = new OrthographicCamera({ size: 2, aspect: 1, near: 0.1, far: 100, position: [0, 0, 5] });
  renderer.setCamera(camera);

  /*
   * 材质用**默认的 `cullMode: 'back'`**：这不是随手写的 —— 它让「投影翻转后绕序反转」
   * 真的被剔除规则检验。`Renderer` 若只翻投影不翻 `frontFace`，这个四边形在 WebGL2 上
   * 会被整块剔除，读回一片黑、`rttRowOrderOk` 直接变 false。
   */
  const sceneMaterial = defineMaterial({
    name: 'rtt-scene-gfx',
    attributes: { corner: 'float32x2' },
    uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f' },
    glsl: GFX_SCENE_GLSL,
    wgsl: GFX_SCENE_WGSL,
  });

  const quad = createQuad(renderer.device);
  const geometry = renderer.createGeometry({
    label: 'rtt-quad',
    attributes: { corner: { data: quad.corners, format: 'float32x2' } },
    indices: quad.indices,
  });

  const unified = createTarget(renderer.device, 'rtt-unified-gfx');

  renderer.beginFrame({ target: unified, color: [0, 0, 0, 1] });
  renderer.draw(geometry, { material: sceneMaterial });
  renderer.endFrame();

  // 上屏：canvas 不翻，走的是与 core 路径同一份 1:1 贴图管线。
  createBlit(renderer.device, quad, unified, mat4.create()).run(renderer.context);
  setData('rttCanvasSource', 'unified');

  return {
    layer: 'gfx',
    device: renderer.device,
    adapter: 'gfx-renderer',
    unified,
    raw: null,
    projectionFlipped: false,
    notes: [
      `gfx 路径：rowOrder=${renderer.rowOrder}（默认 unified），离屏目标 rowOrder=${unified.rowOrder}。`,
      '页面没有写任何翻转代码：投影与 frontFace 都由 Renderer 在「附件是纹理」的通道上处理。',
      '材质用 cullMode: back —— 绕序处理错的话这个四边形会被整块剔除。',
    ],
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 读回、下结论、入口                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/** 把一份行序判定写成 `data-*` 与正文行。 */
function appendOrientation(lines: string[], prefix: string, title: string, orientation: Orientation): void {
  const expectedTop = toBytes(COLORS.topLeft);
  const expectedBottom = toBytes(COLORS.bottomLeft);
  setData(`${prefix}TexelTopLeftPixel`, orientation.topLeft.join(','));
  setData(`${prefix}TexelTopRightPixel`, orientation.topRight.join(','));
  setData(`${prefix}TexelBottomLeftPixel`, orientation.bottomLeft.join(','));
  setData(`${prefix}TexelBottomRightPixel`, orientation.bottomRight.join(','));
  setData(`${prefix}RowOrderOk`, String(orientation.ok));
  lines.push(
    `${title}：纹素第 0 行 左 ${orientation.topLeft.join(',')}（期望 ${expectedTop.join(',')}）` +
      ` / 右 ${orientation.topRight.join(',')}`,
    `${title}：纹素最后一行 左 ${orientation.bottomLeft.join(',')}（期望 ${expectedBottom.join(',')}）` +
      ` / 右 ${orientation.bottomRight.join(',')}`,
    `${title}：行序契约（纹素第 0 行 = 图案顶部）${orientation.ok ? 'ok' : 'broken'}`,
  );
}

/** 读回并下结论：`rttResult` 只看**统一后**的那一份。 */
async function finish(report: LayerReport): Promise<void> {
  const unified = orientationOf(await readRows(report.device, report.unified));
  const lines: string[] = [
    `layer=${report.layer} backend=${report.device.backend}`,
    `adapter=${report.adapter}`,
    `离屏 ${SIZE}x${SIZE} rgba8unorm → 全屏 1:1 最近邻贴图`,
    `离屏目标原生行序 rowOrder=${report.unified.rowOrder}（core 如实暴露，不自动翻转）`,
    `rttProjectionFlipped=${
      report.layer === 'gfx' ? 'gfx-auto（页面没有翻转代码）' : String(report.projectionFlipped)
    }`,
    '',
  ];
  appendOrientation(lines, '', '统一后', unified);

  if (report.raw) {
    const raw = orientationOf(await readRows(report.device, report.raw));
    lines.push('');
    appendOrientation(lines, 'Raw', '不翻的对照（加 helper 之前）', raw);
  } else {
    setData('rttRawRowOrderOk', 'n/a');
  }

  lines.push('', ...report.notes, '');
  lines.push('画布上的结论请看真实合成截图（preserveDrawingBuffer: false，页内读回一律是黑的）。');

  setData('rttResult', unified.ok ? 'pass' : 'fail');
  if (!unified.ok) {
    setData(
      'rttError',
      `texel row order broken: texel row 0 is ${unified.topLeft.join(',')} but the pattern top is ` +
        `${toBytes(COLORS.topLeft).join(',')}`,
    );
  }
  writeOut(lines, unified.ok);
}

async function run(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const backend = params.get('backend') ?? 'auto';
  const layer = params.get('layer') === 'gfx' ? 'gfx' : 'core';

  const canvas = document.getElementById('view') as HTMLCanvasElement;
  setData('rttResult', 'running');
  setData('rttCanvasSize', String(SIZE));
  setData('rttLayer', layer);

  // 本页所有投影矩阵都是「裁剪空间恒等 + 可选的行序翻转」，没有相机（core 路径用不上相机）。
  const identity = mat4.create();
  const canvasSource = params.get('canvas') === 'raw' ? 'raw' : 'unified';
  const report =
    layer === 'gfx'
      ? await runGfxLayer(canvas, backend)
      : await runCoreLayer(canvas, backend, identity, canvasSource);
  setData('rttBackend', report.device.backend);
  setData('rttAdapter', report.adapter);
  setData('rttTargetRowOrder', report.unified.rowOrder);

  // 两个后端的校验错误都是异步上报的：等一拍再下结论，否则会把校验失败当成成功。
  const reported: string[] = [];
  report.device.onError((error) => {
    reported.push(`${error.name}: ${error.message}`);
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (reported.length > 0) {
    setData('rttResult', 'fail');
    setData('rttError', reported.join(' | ').replace(/\s+/g, ' '));
    writeOut(['设备错误通道上报了错误：', ...reported], false);
    return;
  }

  await finish(report);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  setData('rttResult', 'fail');
  setData('rttError', message.replace(/\s+/g, ' '));
  writeOut(['非预期异常：', message], false);
});
