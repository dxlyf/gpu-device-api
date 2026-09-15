/**
 * 离屏 MSAA 证据页：把「离屏渲染目标支持 `sampleCount > 1`」变成一个**可量化**的结论。
 *
 * ## 为什么需要这一页
 *
 * 单测只能证明「确实调用了 `renderbufferStorageMultisample` 与 `blitFramebuffer`」，
 * 证明不了「画面真的被抗锯齿了」。这里画一组**故意全是斜边**的长条（轴对齐的边在整数像素
 * 边界上不会产生任何中间色），然后：
 *
 * 1. 用 `sampleCount = ?samples=N` 渲染到离屏目标（WebGL2 走 renderbuffer + blit resolve，
 *    WebGPU 走多重采样纹理 + resolveTarget）；
 * 2. 把 resolve 出来的纹理用全屏三角形**1:1 最近邻**贴到 canvas（这一层不引入任何额外的滤波，
 *    所以画面上有多少中间色就完全取决于离屏目标有没有多重采样）；
 * 3. 由 `scripts/capture-screenshot.mjs` 抓**真实合成截图**，
 *    再由 `scripts/analyze-screenshot.mjs` 统计「介于前景与背景之间的颜色数」。
 *
 * 页面内的 `readPixels` / `drawImage` 在合成后不可信（`preserveDrawingBuffer: false` 时为黑），
 * 所以这一页**不做**页内读回，也不下任何像素结论 —— 结论只来自截图统计。
 *
 * ## 查询参数
 *
 * - `?backend=webgl2|webgpu|auto`（默认 `auto`，网页右上角会写明实际后端）
 * - `?samples=1|2|4|8`（默认 `4`）
 *
 * ## 结论写在哪
 *
 * - `data-msaa-result="pass"` —— 渲染完成（无论 MSAA 是否可用）；`unsupported` 表示采样数
 *   不被支持并给出了明确错误；`fail` 表示出现了非预期异常。
 * - `data-msaa-samples` / `data-msaa-actual-samples` / `data-msaa-max-samples` / `data-msaa-error`
 */

import { createDeviceWithAdapter } from '../src/factories/index.js';
import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import { BindingType } from '../src/core/enums/BindingType.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import type { Device } from '../src/core/Device.js';
import type { CanvasContext } from '../src/core/CanvasContext.js';

/** 离屏目标与 canvas 的边长（1:1 贴图，像素一一对应）。 */
const SIZE = 512;
/** 清屏色（暗蓝），与页面/画布底色一致。 */
const CLEAR: readonly [number, number, number, number] = [0.078, 0.102, 0.149, 1];
/** 长条颜色：纯白。于是「中间色」= 既不是白也不是底色。 */
const BAR_COLOR: readonly [number, number, number, number] = [1, 1, 1, 1];
/** 长条数量：每条都有长斜边，数量越多中间色像素越多，统计越稳。 */
const BAR_COUNT = 18;

const VERTEX_GLSL = `
layout(location = 0) in vec2 position;
layout(location = 1) in vec4 color;
out vec4 vColor;
void main() {
  vColor = color;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_GLSL = `
in vec4 vColor;
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = vColor;
}
`;

const SCENE_WGSL = `
struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) color: vec4f,
}

@vertex fn vsMain(@location(0) position: vec2f, @location(1) color: vec4f) -> VSOut {
  var out: VSOut;
  out.pos = vec4f(position, 0.0, 1.0);
  out.color = color;
  return out;
}

@fragment fn fsMain(in: VSOut) -> @location(0) vec4f {
  return in.color;
}
`;

/**
 * 全屏三角形的顶点着色器：三个角由顶点缓冲给出（`(0,0) (2,0) (0,2)`）。
 *
 * 三个顶点给出的 uv 在可见范围内恰好是 0..1，所以这是**像素一一对应**的拷贝：
 * 离屏纹理里的中间色会原样出现在画布上（不会因为缩放/滤波而新增或消失）。
 *
 * 这里刻意用显式顶点属性而不是 `gl_VertexID`：WebGL2 的顶点属性位置来自 GLSL 的
 * `layout(location = N)`，后端会拿反射结果去和 `vertex.buffers` 交叉校验；
 * 用属性就两边完全一致，也不会踩到「顶点着色器声明了 location -1」这类反射差异。
 */
const BLIT_VERTEX_GLSL = `
layout(location = 0) in vec2 corner;
out vec2 vUv;
void main() {
  vUv = corner;
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
  out.pos = vec4f(corner * 2.0 - 1.0, 0.0, 1.0);
  // WebGPU 的纹理原点在左上、裁剪空间 y 向上，所以这里翻转 v 让两个后端画面一致。
  out.uv = vec2f(corner.x, 1.0 - corner.y);
  return out;
}

@fragment fn fsMain(in: VSOut) -> @location(0) vec4f {
  return textureSample(uSource, uSource_sampler, in.uv);
}
`;

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

function writeOut(lines: readonly string[], ok: boolean): void {
  const out = document.getElementById('out');
  if (!out) return;
  out.textContent = lines.join('\n');
  out.className = ok ? 'pass' : 'fail';
}

/**
 * 生成 `BAR_COUNT` 个旋转长条的顶点（每条两个三角形）。
 *
 * 旋转角刻意取遍 0..180°：斜边在像素网格上必然产生部分覆盖，
 * 这正是多重采样与非多重采样差别最大的地方（轴对齐的边两者完全一样）。
 */
function buildBars(): Float32Array {
  const data: number[] = [];
  for (let index = 0; index < BAR_COUNT; index++) {
    const angle = (index / BAR_COUNT) * Math.PI;
    const radius = 0.2 + (index % 3) * 0.26;
    // 用无理数倍数散开中心，避免几条长条重合在一起。
    const centerX = Math.cos(index * 2.399963) * radius;
    const centerY = Math.sin(index * 2.399963) * radius;
    const halfLength = 0.3 + (index % 4) * 0.06;
    const halfWidth = 0.05 + (index % 3) * 0.02;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const corner = (sx: number, sy: number): [number, number] => {
      const x = sx * halfLength;
      const y = sy * halfWidth;
      return [centerX + x * cos - y * sin, centerY + x * sin + y * cos];
    };
    const push = (point: readonly [number, number]): void => {
      data.push(point[0], point[1], BAR_COLOR[0], BAR_COLOR[1], BAR_COLOR[2], BAR_COLOR[3]);
    };

    const a = corner(-1, -1);
    const b = corner(1, -1);
    const c = corner(1, 1);
    const d = corner(-1, 1);
    push(a);
    push(b);
    push(c);
    push(a);
    push(c);
    push(d);
  }
  return new Float32Array(data);
}

const VERTEX_STRIDE = 24; // vec2 position + vec4 color

async function run(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const backend = params.get('backend') ?? 'auto';
  const requestedSamples = Number(params.get('samples') ?? '4');

  const canvas = document.getElementById('view') as HTMLCanvasElement;
  setData('msaaResult', 'running');
  setData('msaaRequestedSamples', String(requestedSamples));

  const created = await createDeviceWithAdapter({
    canvas,
    backend: backend === 'webgl2' || backend === 'webgpu' ? backend : 'auto',
    strictBackend: backend !== 'auto',
    label: 'msaa-offscreen',
    // 画布本身**关掉**抗锯齿：这样画面上出现的中间色只可能来自离屏多重采样目标。
    contextAttributes: { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: false },
  });
  const device: Device = created.device;
  const context: CanvasContext = created.context!;
  setData('msaaBackend', device.backend);

  // 让画布尺寸精确等于 SIZE，且与设备像素比为 1（DPI 缩放不会悄悄改变像素数）。
  context.setPixelRatio(1);
  context.setSize(SIZE, SIZE);

  const gl = device.backend === 'webgl2' ? (device.native as WebGL2RenderingContext) : null;
  const maxSamples = gl ? Number(gl.getParameter(gl.MAX_SAMPLES) ?? 0) : 4;
  setData('msaaMaxSamples', String(maxSamples));

  const diagnostics: string[] = [
    `backend=${device.backend}（数据页要求 ${backend}）`,
    `requested sampleCount=${requestedSamples}`,
    `MAX_SAMPLES=${maxSamples}`,
  ];

  /*
   * 订阅设备错误通道。WebGPU 的校验失败是**异步**上报的（`onuncapturederror`），不订阅的话
   * 表现就是「提交成功、画面全黑、没有任何异常」—— 正是本库要消掉的那种静默失败。
   * 这里把错误收进数组，提交后等一拍再判断结果。
   */
  const reported: string[] = [];
  device.onError((error) => {
    reported.push(`${error.name}: ${error.message}`);
  });

  const bars = buildBars();
  const vertexBuffer = device.createBuffer({
    label: 'bars',
    size: bars.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(vertexBuffer, 0, bars);

  const sceneModule = device.createShaderModule({
    label: 'scene',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: SCENE_WGSL },
  });
  const scenePipeline = device.createRenderPipeline({
    label: 'scene',
    vertex: {
      module: sceneModule,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: VERTEX_STRIDE,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x4' },
          ],
        },
      ],
    },
    fragment: { module: sceneModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  /* ---- 1. 离屏目标：请求 sampleCount > 1 ------------------------------------------------ */

  let target;
  try {
    target = device.createRenderTarget({
      label: 'msaa-target',
      width: SIZE,
      height: SIZE,
      color: 'rgba8unorm',
      sampleCount: requestedSamples,
      // 结果要被采样（全屏贴图那一趟），所以必须显式声明 TextureBinding：
      // WebGPU 会如实校验 usage，缺了它就是「提交成功但整条 command buffer 无效」。
      usage: TextureUsage.TextureBinding,
    });
  } catch (error) {
    // 「不支持就明确报错」这条路径也要能被无头脚本抓到原文，所以原样写进 data-*。
    const message = (error as Error).message;
    setData('msaaResult', 'unsupported');
    setData('msaaError', message.replace(/\s+/g, ' '));
    writeOut([...diagnostics, '', `离屏目标创建失败（未静默降级）：`, message], false);
    return;
  }
  setData('msaaActualSamples', String(target.sampleCount));
  diagnostics.push(`actual sampleCount=${target.sampleCount}`);

  /* ---- 2. 全屏贴图管线（采样 resolve 出来的纹理）------------------------------------------ */

  const sampler = device.createSampler({
    label: 'blit-sampler',
    // 最近邻：这一步必须是纯拷贝，不能自己引入滤波（否则统计出的中间色就不是 MSAA 产生的）。
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
  const blitPipelineLayout = device.createPipelineLayout({
    label: 'blit-pipeline-layout',
    bindGroupLayouts: [blitLayout],
  });
  const blitModule = device.createShaderModule({
    label: 'blit',
    code: { vs: BLIT_VERTEX_GLSL, fs: BLIT_FRAGMENT_GLSL, wgsl: BLIT_WGSL },
  });
  const blitPipeline = device.createRenderPipeline({
    label: 'blit',
    layout: blitPipelineLayout,
    vertex: {
      module: blitModule,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: 8,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module: blitModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });
  // 覆盖整个视口的大三角形：(0,0) (2,0) (0,2)。
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
      { binding: 0, resource: { view: target.colors[0]!.createView({ label: 'msaa-resolve' }) } },
      { binding: 1, resource: { sampler } },
    ],
  });

  /* ---- 3. 两个通道：离屏画长条 → 贴到画布 ------------------------------------------------ */

  const encoder = device.createCommandEncoder({ label: 'msaa-frame' });

  // 通道 A：画进离屏目标。用 target.createPassDescriptor()（而不是直接传 target），
  // 因为 gfx 层就是这么用的 —— 这条路径也必须能认得多重采样目标。
  const offscreen = target.createPassDescriptor({ loadOp: 'clear', clearValue: CLEAR });
  const passA = encoder.beginRenderPass({
    label: 'bars',
    colorAttachments: offscreen.colorAttachments,
  });
  passA.setPipeline(scenePipeline);
  passA.setVertexBuffer(0, vertexBuffer, 0, bars.byteLength);
  passA.draw({ vertexCount: bars.length / 6 });
  passA.end(); // WebGL2 在这里 blit resolve；WebGPU 在通道结束时自动 resolve

  // 通道 B：把 resolve 结果 1:1 贴到画布。
  const frame = context.getCurrentFrameTarget();
  const passB = encoder.beginRenderPass({
    label: 'blit',
    colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
  });
  passB.setPipeline(blitPipeline);
  passB.setBindGroup(0, blitBindGroup);
  passB.setVertexBuffer(0, cornerBuffer, 0, corners.byteLength);
  passB.draw({ vertexCount: 3 });
  passB.end();

  device.queue.submit([encoder.finish()]);

  // WebGPU 的错误是异步上报的：等两拍再下结论，否则会把校验失败当成成功。
  await new Promise((resolve) => setTimeout(resolve, 250));

  diagnostics.push(`离屏 ${SIZE}x${SIZE}，${BAR_COUNT} 条旋转长条，全屏 1:1 最近邻贴图`);
  if (reported.length > 0) {
    setData('msaaResult', 'fail');
    setData('msaaError', reported.join(' | ').replace(/\s+/g, ' '));
    writeOut([...diagnostics, '', '设备错误通道上报了错误：', ...reported], false);
    return;
  }

  /*
   * 顺带自检一次「渲染管线释放后会不会从设备的资源追踪集合里摘掉」。
   *
   * 为什么放在浏览器里做：`createRenderPipeline` 要先编译链接 program，用假 GL 测这件事
   * 需要伪造一整套 program 反射，代价大且容易测出「假 GL 的行为」而不是真实行为。
   * 这里用一条真实的管线跑一次 create → 计数 → dispose → 计数，代价只有几毫秒。
   * `trackedResourceCount` 是 WebGL2 后端的诊断属性（不属于 core 的 `Device` 接口）。
   */
  const trackedDevice = device as unknown as { trackedResourceCount?: number };
  if (typeof trackedDevice.trackedResourceCount === 'number') {
    try {
      const before = trackedDevice.trackedResourceCount;
      const probe = device.createRenderPipeline({
        label: 'blit-probe',
        layout: blitPipelineLayout,
        vertex: {
          module: blitModule,
          entryPoint: 'vsMain',
          buffers: [
            { arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
          ],
        },
        fragment: { module: blitModule, entryPoint: 'fsMain' },
        primitive: { topology: 'triangle-list', cullMode: 'none' },
        depthStencil: { format: null },
      });
      const during = trackedDevice.trackedResourceCount;
      probe.dispose();
      const after = trackedDevice.trackedResourceCount;
      setData('msaaPipelineUntrack', `${before}->${during}->${after}`);
      diagnostics.push(
        `管线释放自检：追踪数 ${before} → 创建后 ${during} → dispose 后 ${after}` +
          `（期望 ${before} → ${before + 1} → ${before}）`,
      );
    } catch (error) {
      setData('msaaPipelineUntrack', `error: ${(error as Error).message}`);
    }
  }

  setData('msaaResult', 'pass');
  writeOut([...diagnostics, '', '渲染完成：请用真实合成截图 + analyze-screenshot.mjs 统计中间色。'], true);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  setData('msaaResult', 'fail');
  setData('msaaError', message.replace(/\s+/g, ' '));
  writeOut([`非预期异常：`, message], false);
});
