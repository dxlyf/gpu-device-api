/**
 * core 层示例：**纹理创建的四条路径**（异步 `createImageBitmap` vs 同步 `getImageData`）。
 *
 * `GfxTexture` 现在有两条创建入口：
 * - **异步** `GfxTexture.fromImage()`：`createImageBitmap` 解码（可在主线程之外），直接吃
 *   `Blob` / `File` / URL / 任何 `ImageBitmapSource`，4 通道格式走
 *   `queue.copyExternalImageToTexture`（不经过主机内存）；
 * - **同步** `GfxTexture.create()`：数据已在手上（原始像素 / `ImageData` / canvas / `ImageBitmap`）。
 *
 * 这一页把**同一个已知图案**分别用四条路径送进 GPU，再用 `copyTextureToBuffer` 把纹理第 0 级的
 * 真实字节读回来，和 JS 里那份「标准答案」逐字节比对：
 *
 * 1. `blob`：`canvas.toBlob()` → `fromImage()`（PNG 编码/解码往返）；
 * 2. `url`：`URL.createObjectURL()` → `fetch` → `fromImage()`；
 * 3. `bitmap-sync`：`createImageBitmap()` 之后交给同步入口；
 * 4. `canvas-sync`：直接把 canvas 交给同步入口（走 `drawImage` + `getImageData`）。
 *
 * 四条路径的字节都应当与标准答案**完全一致**（`maxDiff = 0`）。画布上把四张纹理并排铺开，
 * 真实合成截图里四块的颜色也必须一致 —— 这是「解码 → 上传」整条链路端到端的证据。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&verify=1`
 */

import { BindingType, BufferUsage, ShaderStage, GfxTexture } from '../src/index.js';
import {
  backendFromQuery,
  buildQuadMesh,
  createCoreExample,
  requireElement,
  setData,
  startFrameLoop,
} from './core-shared.js';
import type { Device } from '../src/core/Device.js';
import type { Texture } from '../src/core/resources/Texture.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

const CLEAR: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];
const SIZE = 64;
/** uniform 块：vec4 rect，std140 下 16 字节。 */
const UNIFORM_BYTES = 16;

/* ------------------------------------------------------------------------------------------------ */
/* 一张「已知内容」的图：4x2 个纯色块（整数坐标 fillRect，2D canvas 不会做任何重采样）                    */
/* ------------------------------------------------------------------------------------------------ */

const BLOCK_WIDTH = SIZE / 4;
const BLOCK_HEIGHT = SIZE / 2;

function blockColor(column: number, row: number): readonly [number, number, number] {
  return [10 + column * 60, 20 + row * 120, 200 - column * 40];
}

/** JS 里的标准答案：紧凑 RGBA8。 */
function expectedPixels(): Uint8Array {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const color = blockColor(Math.floor(x / BLOCK_WIDTH), Math.floor(y / BLOCK_HEIGHT));
      const index = (y * SIZE + x) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}

/** 把同一图案画进一张 2D canvas。 */
function drawPattern(): HTMLCanvasElement | OffscreenCanvas {
  const canvas =
    typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(SIZE, SIZE) : document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!context) throw new Error('[gpu-device-api] core-texture-async: could not acquire a 2D context.');
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 4; column++) {
      const color = blockColor(column, row);
      context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      context.fillRect(column * BLOCK_WIDTH, row * BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT);
    }
  }
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('[gpu-device-api] core-texture-async: canvas.toBlob() returned null.'));
    }, 'image/png');
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* 读回第 0 级的真实字节（行距按后端区分，见 core-texture-mipmap 里的同一处说明）                        */
/* ------------------------------------------------------------------------------------------------ */

function readbackPitch(width: number, backend: string): number {
  const tight = width * 4;
  return backend === 'webgl2' ? tight : Math.ceil(tight / 256) * 256;
}

async function readLevel0(device: Device, texture: Texture, backend: string): Promise<Uint8Array> {
  const bytesPerRow = readbackPitch(SIZE, backend);
  const byteLength = bytesPerRow * SIZE;
  const buffer = device.createBuffer({
    label: `async:read:${texture.label}`,
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const encoder = device.createCommandEncoder({ label: 'async:read' });
  encoder.copyTextureToBuffer(
    { texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
    { buffer, offset: 0, bytesPerRow },
    { width: SIZE, height: SIZE, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish()]);
  await buffer.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(buffer.getMappedRange(0, byteLength)).slice();
  buffer.unmap();
  buffer.destroy();
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    pixels.set(raw.subarray(y * bytesPerRow, y * bytesPerRow + SIZE * 4), y * SIZE * 4);
  }
  return pixels;
}

/* ------------------------------------------------------------------------------------------------ */

interface VariantResult {
  readonly name: string;
  readonly maxDiff: number;
  readonly mismatchedPixels: number;
  readonly topLeft: string;
  readonly bottomRight: string;
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const outEl = requireElement<HTMLPreElement>('out');
  const query = new URLSearchParams(location.search);

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-texture-async');
  const { device, context } = example;

  const expected = expectedPixels();
  const source = drawPattern();
  const blob = await canvasToBlob(source);
  const objectUrl = URL.createObjectURL(blob);
  const bitmap = await createImageBitmap(blob);

  const created: GfxTexture[] = [];
  const results: VariantResult[] = [];

  const common = { label: 'async-texture', format: 'rgba8unorm' as const, mipmaps: false, flipY: false };

  try {
    // 1) Blob → createImageBitmap → copyExternalImageToTexture
    created.push(await GfxTexture.fromImage(device, { ...common, source: blob }));
    // 2) URL → fetch → createImageBitmap
    created.push(await GfxTexture.fromImage(device, { ...common, source: objectUrl }));
    // 3) 已经解码好的 ImageBitmap 交给同步入口（走 drawImage + getImageData）
    created.push(GfxTexture.create(device, { ...common, data: bitmap }));
    // 4) canvas 交给同步入口
    created.push(GfxTexture.create(device, { ...common, data: source as HTMLCanvasElement }));
  } finally {
    bitmap.close();
    URL.revokeObjectURL(objectUrl);
  }

  const names = ['blob', 'url', 'bitmap-sync', 'canvas-sync'];
  const lines: string[] = [];
  lines.push(`=== 纹理创建路径的字节一致性（backend=${example.backend}, adapter=${example.adapter}） ===`);
  lines.push(`源图案：${SIZE}x${SIZE} rgba8unorm，4x2 个纯色块；比对方式：copyTextureToBuffer 读回第 0 级逐字节比较`);

  let failed = false;
  for (let index = 0; index < created.length; index++) {
    const pixels = await readLevel0(device, created[index]!.texture, example.backend);
    let maxDiff = 0;
    let mismatchedPixels = 0;
    for (let texel = 0; texel < SIZE * SIZE; texel++) {
      let differs = false;
      for (let channel = 0; channel < 4; channel++) {
        const diff = Math.abs(pixels[texel * 4 + channel]! - expected[texel * 4 + channel]!);
        if (diff > maxDiff) maxDiff = diff;
        if (diff !== 0) differs = true;
      }
      if (differs) mismatchedPixels += 1;
    }
    if (maxDiff !== 0) failed = true;
    const sample = (x: number, y: number): string => {
      const offset = (y * SIZE + x) * 4;
      return `${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]},${pixels[offset + 3]}`;
    };
    const result: VariantResult = {
      name: names[index]!,
      maxDiff,
      mismatchedPixels,
      topLeft: sample(8, 8),
      bottomRight: sample(56, 56),
    };
    results.push(result);
    lines.push(
      `  ${result.name.padEnd(12)} 最大字节差 ${result.maxDiff}　不一致纹素 ${result.mismatchedPixels}　` +
        `左上块(8,8)=${result.topLeft}　右下块(56,56)=${result.bottomRight}`,
    );
  }

  // 顺带确认「异步入口 + mipmaps」也能拿到完整链：64x64 → 7 级。
  const withMips = await GfxTexture.fromImage(device, { ...common, source: blob, mipmaps: true });
  created.push(withMips);
  lines.push(`  异步入口 + mipmaps：mipLevelCount=${withMips.mipLevelCount}（期望 7），采样器 mipmapFilter 已交给后端`);

  /* ---- 画布渲染：四张纹理并排（nearest 放大）------------------------------------------------- */
  const mesh = buildQuadMesh(2);
  const positionBuffer = device.createBuffer({
    label: 'async:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const uvBuffer = device.createBuffer({
    label: 'async:uvs',
    size: mesh.uvs.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(uvBuffer, 0, mesh.uvs);
  const indexBuffer = device.createBuffer({
    label: 'async:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  const sampler = device.createSampler({
    label: 'async:nearest',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'async:bindGroupLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex,
        type: BindingType.Uniform,
        name: 'Uniforms',
        buffer: { type: 'uniform', minBindingSize: UNIFORM_BYTES },
      },
      {
        binding: 1,
        visibility: ShaderStage.Fragment,
        type: BindingType.Texture,
        name: 'albedo',
        texture: { sampleType: 'float', viewDimension: '2d' },
      },
      {
        binding: 2,
        visibility: ShaderStage.Fragment,
        type: BindingType.Sampler,
        name: 'albedo_sampler',
        sampler: { type: 'filtering' },
      },
    ],
  });

  const module = device.createShaderModule({
    label: 'async:shader',
    code: {
      vs: `layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;

layout(std140) uniform Uniforms {
  vec4 rect;
} u;

out vec2 vUv;

void main() {
  vec2 t = position.xy * 0.5 + 0.5;
  gl_Position = vec4(mix(u.rect.xy, u.rect.zw, t), 0.0, 1.0);
  vUv = uv;
}
`,
      fs: `uniform sampler2D albedo;

in vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = texture(albedo, vUv);
}
`,
      wgsl: `struct Uniforms {
  rect: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var albedo: texture_2d<f32>;
@group(0) @binding(2) var albedo_sampler: sampler;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  let t = v.position.xy * 0.5 + vec2f(0.5);
  var out: VertexOutput;
  out.position = vec4f(mix(u.rect.xy, u.rect.zw, t), 0.0, 1.0);
  out.uv = v.uv;
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return textureSample(albedo, albedo_sampler, in.uv);
}
`,
    },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'async:pipelineLayout',
    bindGroupLayouts: [bindGroupLayout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'async:pipeline',
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        { arrayStride: 12, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
        { arrayStride: 8, stepMode: 'vertex', attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }] },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const bindGroups = created.slice(0, 4).map((texture, index) => {
    const x0 = index / 4 + 0.01;
    const x1 = (index + 1) / 4 - 0.01;
    const uniforms = new Float32Array([x0 * 2 - 1, -0.98, x1 * 2 - 1, 0.98]);
    const buffer = device.createBuffer({
      label: `async:uniform:${names[index]}`,
      size: UNIFORM_BYTES,
      usage: BufferUsage.Uniform | BufferUsage.CopyDst,
    });
    device.queue.writeBuffer(buffer, 0, uniforms);
    return device.createBindGroup({
      label: `async:bindGroup:${names[index]}`,
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer, offset: 0, size: UNIFORM_BYTES } },
        { binding: 1, resource: { view: texture.view } },
        { binding: 2, resource: { sampler } },
      ],
    });
  });

  const drawTiles = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    pass.setVertexBuffer(1, uvBuffer, 0, uvBuffer.size);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    for (const bindGroup of bindGroups) {
      pass.setBindGroup(0, bindGroup);
      pass.drawIndexed({ indexCount: mesh.indices.length });
    }
  };

  const drawToCanvas = (): void => {
    context.resize();
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'async:frame' });
    const pass = encoder.beginRenderPass({
      label: 'async:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawTiles(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };
  drawToCanvas();

  outEl.textContent = lines.join('\n');
  setData('asyncBackend', example.backend);
  setData('asyncReport', JSON.stringify({ backend: example.backend, expected: '10,20,200,255', variants: results }));
  setData('asyncMaxDiff', String(Math.max(...results.map((result) => result.maxDiff))));
  setData('asyncResult', failed ? 'fail' : 'ok');
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　` +
    `四条路径（blob / url / bitmap-sync / canvas-sync）第 0 级字节全部一致的判据：maxDiff=0`;

  startFrameLoop({
    draw: () => drawToCanvas(),
    onFps: (fps) => {
      statsEl.textContent = `${context.width}×${context.height}　${fps.toFixed(0)} FPS　4 draw calls`;
    },
  });
}

main().catch((error: unknown) => {
  setData('asyncResult', 'fail');
  setData('asyncError', (error as Error).message);
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
  const outEl = document.getElementById('out');
  if (outEl) outEl.textContent = (error as Error).stack ?? (error as Error).message;
});
