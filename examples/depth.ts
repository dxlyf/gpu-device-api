/**
 * 画布渲染的**深度测试**回归页（两个后端都要过）。
 *
 * 回归的场景：先画近处红四边形、再画远处绿四边形，两个材质都是 `depthTest: true`。
 * 深度测试生效时，远处绿四边形在中心像素处应该被近处红四边形挡住（中心是红）；
 * 一旦渲染通道里没有 depth attachment，后端会关掉 DEPTH_TEST，画面退化成画家算法
 * （先画的被后画的覆盖），中心就变成绿 —— 这正是这个页面要抓的静默失效。
 *
 * 两条断言缺一不可：
 * 1. `occlusion`：近红 → 远绿，中心必须是**红**（深度测试在拒绝远处的像素）；
 * 2. `control`：只画远处绿，中心必须是**绿**（证明绿四边形确实被光栅化了，
 *    否则第 1 条会「因为绿根本没画出来」而假通过）。
 *
 * 为什么读回的是 **canvas 本身**（而不是离屏 RenderTarget）：这个缺陷只发生在
 * 画布路径上（离屏路径一直有 depth attachment）。WebGL2 用 `readPixels`（逃生口），
 * WebGPU 用 `copyTextureToBuffer` —— 后者要求 canvas 纹理带 `CopySrc`，所以页面上先
 * 重新 `configure()` 一次 canvas context。
 *
 * 无头判据：`<html data-depth-result="pass|fail">`，另外把中心像素、实际后端、
 * 深度附件格式分别写进 `data-depth-pixel` / `data-depth-backend` / `data-depth-depth-format`。
 *
 * ⚠️ 一个 canvas 只能绑定一种 context，所以这个页面**一次只跑一个后端**：
 * `depth.html?backend=webgl2` 或 `?backend=webgpu`（省略时用 `auto`）。
 */

import { BufferUsage, Renderer, TextureUsage, defineMaterial, mat4 } from '../src/index.js';
import type { Geometry, Material, RendererOptions } from '../src/index.js';

const lines: string[] = [];
let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

function report(): void {
  const out = document.getElementById('out');
  if (out) {
    out.textContent = lines.join('\n');
    out.className = failures === 0 ? 'pass' : 'fail';
  }
  setData('depthResult', failures === 0 ? 'pass' : 'fail');
}

/** 中心与角落像素，RGBA 顺序（读回时已经把 BGRA 换过来了）。 */
type Pixel = readonly [number, number, number, number];

interface Snapshot {
  readonly center: Pixel;
  readonly corner: Pixel;
}

/* ------------------------------------------------------------------ 场景 --------------------- */

// 顶点直接写在 NDC 里（projectionView 与 model 都传单位矩阵），这样两套深度约定下
// 「z 越大越远」都成立：GL 的窗口深度是 (z+1)/2，WebGPU 是 z，单调性一致。
const NEAR_Z = 0.25;
const FAR_Z = 0.75;

const RED: readonly [number, number, number, number] = [1, 0, 0, 1];
const GREEN: readonly [number, number, number, number] = [0, 1, 0, 1];

function quadPositions(z: number): Float32Array {
  // 两个三角形铺满整个 viewport（顶点在四个角上）。
  return new Float32Array([
    -1, -1, z, 1, -1, z, 1, 1, z,
    -1, -1, z, 1, 1, z, -1, 1, z,
  ]);
}

function createQuadMaterial(name: string, color: readonly [number, number, number, number]): Material {
  return defineMaterial({
    name,
    attributes: { position: 'float32x3' },
    uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f', baseColor: 'vec4f' },
    glsl: {
      vs: `void main() {
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `void main() {
  fragColor = u.baseColor;
}`,
    },
    wgsl: `@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f {
  return u.projectionView * u.model * vec4f(v.position, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.baseColor;
}`,
    defaults: { baseColor: [color[0], color[1], color[2], color[3]] },
    depthTest: true,
    depthWrite: true,
    depthCompare: 'less',
    cullMode: 'none',
  });
}

/* ------------------------------------------------------------------ canvas 读回 -------------- */

const BYTES_PER_PIXEL = 4;

/** WebGPU 的 `copyTextureToBuffer` 要求 `bytesPerRow` 是 256 的倍数。 */
function paddedBytesPerRow(width: number): number {
  return Math.ceil((width * BYTES_PER_PIXEL) / 256) * 256;
}

/** 按 canvas 格式（可能是 bgra）把读回的一行像素换成 RGBA。 */
function toRgba(bytes: Uint8Array, offset: number, bgra: boolean): Pixel {
  const a = bytes[offset]!;
  const b = bytes[offset + 1]!;
  const c = bytes[offset + 2]!;
  return bgra ? [c, b, a, bytes[offset + 3]!] : [a, b, c, bytes[offset + 3]!];
}

/**
 * 读回 canvas 中心与角落像素。
 *
 * **必须在 `endFrame()` 之后的同一个任务里调用**（返回的闭包可以稍后再 await）：
 * - WebGL2 的默认帧缓冲在合成之后会被清空（`preserveDrawingBuffer: false`）；
 * - WebGPU 的 canvas 纹理在下一次 `getCurrentTexture()` 之前身份不变，
 *   拷贝命令要和渲染命令同在这一次任务里提交。
 */
function beginCanvasReadback(renderer: Renderer): () => Promise<Snapshot> {
  const width = renderer.width;
  const height = renderer.height;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const gl = renderer.backend === 'webgl2' ? (renderer.device.native as WebGL2RenderingContext) : null;

  if (gl) {
    // readPixels 一律按 RGBA 返回，不需要换通道。
    const center = new Uint8Array(BYTES_PER_PIXEL);
    const corner = new Uint8Array(BYTES_PER_PIXEL);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(centerX, centerY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, center);
    gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, corner);
    return () =>
      Promise.resolve({
        center: toRgba(center, 0, false),
        corner: toRgba(corner, 0, false),
      });
  }

  // WebGPU：整张读回（宽 128 时 bytesPerRow 已经是 256 的倍数），再挑中心与角落。
  const bgra = renderer.context.format.includes('bgra');
  const frame = renderer.context.getCurrentFrameTarget();
  const bytesPerRow = paddedBytesPerRow(frame.width);
  const buffer = renderer.device.createBuffer({
    label: 'depth-readback',
    size: bytesPerRow * frame.height,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const encoder = renderer.device.createCommandEncoder({ label: 'depth-readback' });
  encoder.copyTextureToBuffer(
    { texture: frame.texture, origin: { x: 0, y: 0 } },
    { buffer, offset: 0, bytesPerRow },
    { width: frame.width, height: frame.height, depthOrArrayLayers: 1 },
  );
  renderer.device.queue.submit([encoder.finish()]);

  return async () => {
    const byteLength = bytesPerRow * frame.height;
    await buffer.mapAsync('read', 0, byteLength);
    const raw = new Uint8Array(buffer.getMappedRange(0, byteLength)).slice();
    buffer.unmap();
    buffer.destroy();
    return {
      center: toRgba(raw, centerY * bytesPerRow + centerX * BYTES_PER_PIXEL, bgra),
      corner: toRgba(raw, bytesPerRow + BYTES_PER_PIXEL, bgra),
    };
  };
}

/* ------------------------------------------------------------------ 运行 --------------------- */

function backendFromQuery(): RendererOptions['backend'] {
  const value = new URLSearchParams(location.search).get('backend');
  return value === 'webgl2' || value === 'webgpu' ? value : 'auto';
}

async function run(): Promise<void> {
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const backend = backendFromQuery();

  const renderer = await Renderer.create({
    canvas,
    backend,
    antialias: false,
    depth: true,
    pixelRatio: 1,
    clearColor: [0, 0, 0, 1],
  });
  setData('depthBackend', renderer.backend);

  // WebGPU 的 canvas 纹理默认只有 RenderAttachment，读回需要额外的 CopySrc。
  // 重新 configure 一次只会补上 usage：格式与已经配好的 sampleCount 都会被沿用。
  if (renderer.backend === 'webgpu') {
    renderer.context.configure({ device: renderer.device, usage: TextureUsage.CopySrc });
  }

  const frame = renderer.context.getCurrentFrameTarget();
  check('取得画布帧目标', frame.isDefaultFramebuffer === true, `${renderer.width}x${renderer.height}`);

  const red = renderer.createMaterial(createQuadMaterial('depth-red', RED));
  const green = renderer.createMaterial(createQuadMaterial('depth-green', GREEN));
  const nearQuad: Geometry = renderer.createGeometry({
    label: 'near-quad',
    position: quadPositions(NEAR_Z),
    topology: 'triangle-list',
  });
  const farQuad: Geometry = renderer.createGeometry({
    label: 'far-quad',
    position: quadPositions(FAR_Z),
    topology: 'triangle-list',
  });

  const identity = mat4.create();
  const drawQuad = (geometry: Geometry, material: Material): void => {
    renderer.draw(geometry, { material, model: identity, uniforms: { projectionView: identity } });
  };

  /** 画一帧并立刻开始读回（读回的同步部分必须和 endFrame 在同一个任务里）。 */
  const renderAndRead = (drawScene: () => void): Promise<Snapshot> => {
    renderer.beginFrame({ color: [0, 0, 0, 1] });
    drawScene();
    renderer.endFrame();
    return beginCanvasReadback(renderer)();
  };

  // ① 只画远处的绿四边形：证明「绿确实被光栅化出来了」（对照，防止假通过）。
  const control = await renderAndRead(() => {
    drawQuad(farQuad, green);
  });
  setData('depthControlPixel', control.center.join(','));
  check(
    '对照：只画远处绿四边形时中心是绿（读回链路本身有效）',
    control.center[1]! >= 200 && control.center[0]! <= 40,
    `rgba=${control.center.join(',')}`,
  );

  // ② 近红先画、远绿后画：深度测试生效时中心必须还是红。
  const occluded = await renderAndRead(() => {
    drawQuad(nearQuad, red);
    drawQuad(farQuad, green);
  });
  setData('depthPixel', occluded.center.join(','));
  setData('depthCornerPixel', occluded.corner.join(','));
  // 后端如实汇报的画布深度附件：null 表示这个 pass 根本没有深度，深度测试会被（正确地）关掉。
  const depthAttachment = renderer.context.createPassDescriptor().depthStencilAttachment;
  const depthFormat = depthAttachment?.view.texture.format ?? 'none';
  setData('depthFormat', depthFormat);

  check(
    '近红先画 → 远绿后画：中心像素是红（深度测试在拒绝远处的绿）',
    occluded.center[0]! >= 200 && occluded.center[1]! <= 40 && occluded.center[2]! <= 40,
    `rgba=${occluded.center.join(',')}（若是 0,255,0 说明 DEPTH_TEST 被静默关闭）`,
  );
  check('画布路径的渲染通道带 depth attachment', depthFormat !== 'none', `depthFormat=${depthFormat}`);

  renderer.destroy();
  check('renderer.destroy() 正常完成', renderer.disposed === true);
}

/**
 * 顶层 await：把整段测试（含 WebGPU 侧的异步读回）跑完再结束模块求值，并把未预期的异常
 * 也写进 `data-depth-error`。
 *
 * 但**不要指望它能让 headless 的 `--dump-dom` 等到结论**：实测模块里的顶层 await 不会推迟
 * load 事件，`--virtual-time-budget` 也抢跑不了 GPU 的异步回调，所以 `--dump-dom` 抓到的
 * 往往还是「运行中…」。无头验证请用 `scripts/verify-headless.mjs`（CDP + 真实时间轮询
 * `data-depth-*`）。
 */
try {
  await run();
} catch (error: unknown) {
  const message = `${(error as Error).name}: ${(error as Error).message}`;
  setData('depthError', message);
  check('运行过程抛出未预期的异常', false, message);
} finally {
  report();
}
