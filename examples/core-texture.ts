/**
 * core 层示例：**贴图**。
 *
 * 这一页演示 core 的纹理路径，全部手写：
 * `createTexture`（`rgba8unorm`）→ `queue.writeTexture` 上传像素 → `createSampler` →
 * 把「纹理 + 采样器 + uniform」放进**同一个 bind group** 并绑到管线。
 *
 * 纹理图案是 CPU 现场生成的棋盘格，所以这一页不依赖任何图片文件。
 * 两个后端对绑定名字的要求在这里也看得到：GLSL 里的 sampler 变量名必须与
 * `BindGroupLayoutEntry.name` 一致，而 sampler 要按「`<纹理名>_sampler`」或
 * 「纹理 binding + 1」与纹理配对 —— 这里用的是 `albedo` + `albedo_sampler`。
 *
 * **纹理的 Y 方向约定（本页最容易看错的地方）**：
 *
 * - 纹理坐标 `v = 0` 指向纹素第 0 行；`buildCheckerPixels()` 写出来的**第 0 行就是数据的第 0 行**。
 * - `queue.writeTexture()` 两个后端**都不翻转**：WebGPU 的纹素 (0, 0) 在左上，GL 的纹素 (0, 0) 在
 *   「数据第一行」，两者落到同一个 `v = 0` 上，所以同一份像素在两个后端画出来是一样的。
 * - 本页的四边形按「图像式」UV 铺（`buildQuadMesh` 把 `v = 0` 放在屏幕上方），因此画面上方显示的
 *   就是数据第 0 行。逐像素实测两个后端的画布截图一致率 99.97%（容差 ±8），详见
 *   `scripts/verify-texture-parity.mjs`。
 * - 图像来源（`HTMLImageElement` / `ImageBitmap` 之类）要走 `copyExternalImageToTexture`，它的
 *   `flipY` 参数在两个后端语义相同：WebGL2 用 `UNPACK_FLIP_Y_WEBGL`，WebGPU 用原生 `flipY` 选项。
 *   gfx 便捷层（`src/gfx/Texture.ts`）默认给图像翻转、给裸像素不翻转。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&spin=0&verify=1`
 */

import { BindingType, BufferUsage, ShaderStage, mat4, vec3 } from '../src/index.js';
import {
  backendFromQuery,
  buildQuadMesh,
  createCoreExample,
  createUniformBinding,
  reportVerify,
  requireElement,
  setData,
  startFrameLoop,
  verifyOffscreen,
} from './core-shared.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

const CLEAR: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];
/** uniform 块：mat4(64) + mat4(64)。 */
const UNIFORM_BYTES = 128;
const TEXTURE_SIZE = 64;
const CHECKER_CELLS = 8;

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;

layout(std140) uniform Uniforms {
  mat4 projectionView;
  mat4 model;
} u;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}
`;

const FRAGMENT_GLSL = `
uniform sampler2D albedo;

in vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = texture(albedo, vUv);
}
`;

const MODULE_WGSL = `
struct Uniforms {
  projectionView: mat4x4f,
  model: mat4x4f,
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
  var out: VertexOutput;
  out.uv = v.uv;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return textureSample(albedo, albedo_sampler, in.uv);
}
`;

/** 现场生成一张棋盘格（每格交替两种颜色，边缘再叠一圈渐变的边框，方便看采样）。 */
function buildCheckerPixels(): Uint8Array {
  const pixels = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
  const cellSize = TEXTURE_SIZE / CHECKER_CELLS;
  for (let y = 0; y < TEXTURE_SIZE; y++) {
    for (let x = 0; x < TEXTURE_SIZE; x++) {
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const light = (cellX + cellY) % 2 === 0;
      const index = (y * TEXTURE_SIZE + x) * 4;
      pixels[index] = light ? 235 : 40;
      pixels[index + 1] = light ? 168 : 96;
      pixels[index + 2] = light ? 72 : 190;
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  let spinning = query.get('spin') !== '0';

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-texture');
  const { device, context } = example;

  /* ---- 四边形几何体：position(vec3) + uv(vec2)，两个 buffer -------------------------------- */
  const mesh = buildQuadMesh(2);
  const positionBuffer = device.createBuffer({
    label: 'texture:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const uvBuffer = device.createBuffer({
    label: 'texture:uvs',
    size: mesh.uvs.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(uvBuffer, 0, mesh.uvs);
  const indexBuffer = device.createBuffer({
    label: 'texture:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  /* ---- 纹理与采样器 --------------------------------------------------------------------------- */
  const pixels = buildCheckerPixels();
  const texture = device.createTexture({
    label: 'texture:checker',
    format: 'rgba8unorm',
    size: { width: TEXTURE_SIZE, height: TEXTURE_SIZE },
    usage: 0x0004 | 0x0002, // TextureBinding | CopyDst
  });
  device.queue.writeTexture(
    { texture, origin: { x: 0, y: 0 } },
    pixels,
    // WebGPU 在 height > 1 时要求给出行距（字节）。
    { offset: 0, bytesPerRow: TEXTURE_SIZE * 4 },
    { width: TEXTURE_SIZE, height: TEXTURE_SIZE, depthOrArrayLayers: 1 },
  );
  const textureView = texture.createView({ label: 'texture:checker-view' });
  const sampler = device.createSampler({
    label: 'texture:linear-repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });

  /* ---- uniform + bind group（uniform / texture / sampler 同组）-------------------------------- */
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'texture:bindGroupLayout',
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex | ShaderStage.Fragment,
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
        // 名字按「纹理名 + _sampler」来，WebGL2 后端就是靠这个（或 binding + 1）配对的。
        name: 'albedo_sampler',
        sampler: { type: 'filtering' },
      },
    ],
  });
  const bindGroup = device.createBindGroup({
    label: 'texture:bindGroup',
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniforms.buffer, offset: 0, size: UNIFORM_BYTES } },
      { binding: 1, resource: { view: textureView } },
      { binding: 2, resource: { sampler } },
    ],
  });

  /* ---- 着色器与管线 --------------------------------------------------------------------------- */
  const module = device.createShaderModule({
    label: 'texture:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'texture:pipelineLayout',
    bindGroupLayouts: [bindGroupLayout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'texture:pipeline',
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: 12,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: 8,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();

  const updateMatrices = (angle: number, aspectOverride?: number): void => {
    const aspect = aspectOverride ?? (context.height === 0 ? 1 : context.width / context.height);
    mat4.perspective(projectionGL, Math.PI / 4, aspect, 0.1, 100);
    mat4.perspectiveZO(projectionZO, Math.PI / 4, aspect, 0.1, 100);
    mat4.lookAt(view, vec3.fromValues(0, 0, 3), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);

    const model = mat4.create();
    mat4.rotateY(model, model, angle);
    mat4.rotateX(model, model, -0.2);

    uniformData.set(viewProjection, 0);
    uniformData.set(model, 16);
    uniforms.write(uniformData);
  };

  const drawQuad = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    pass.setVertexBuffer(1, uvBuffer, 0, uvBuffer.size);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    pass.drawIndexed({ indexCount: mesh.indices.length });
  };

  let angle = 0.5;
  const drawToCanvas = (): void => {
    context.resize();
    updateMatrices(angle);
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'texture:frame' });
    const pass = encoder.beginRenderPass({
      label: 'texture:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawQuad(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas();
  setData('textureResult', 'ok');
  setData('textureSize', `${TEXTURE_SIZE}x${TEXTURE_SIZE}`);
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　` +
    `${TEXTURE_SIZE}×${TEXTURE_SIZE} rgba8unorm 棋盘格　1 次 draw call`;

  startFrameLoop({
    draw: (delta) => {
      if (spinning) angle += delta * 0.4;
      drawToCanvas();
    },
    onFps: (fps) => {
      statsEl.textContent = `${context.width}×${context.height}　${fps.toFixed(0)} FPS　三角形 2　draw calls 1`;
    },
  });

  if (query.get('verify') === '1') {
    /*
     * 自检口径（跨后端可比的像素断言靠它）：
     *
     * 1. 棋盘格必然产生多种颜色：颜色只有一种就说明纹理没采样成功（`requireVariety`）。
     * 2. 离屏目标是 96×96 的正方形，所以这里**显式把宽高比钉成 1**，而不是用画布的宽高比。
     *    否则同一份代码在不同窗口尺寸下会投影出不同形状，`data-texture-pixel` 跟着漂
     *    （同一份代码实测：画布 940×431 时中心是 51,100,184，500×180 时是 50,100,184，
     *    1574×672 时也是 50,100,184）。像素自检要的是「画了什么」，不该随页面布局变。
     * 3. 读回的行序由 `verifyOffscreen` 统一成屏幕行序（见那里的说明）：WebGL2 的渲染目标是
     *    自下而上存储的，不翻的话读回的第 48 行其实是画面第 47 行，中心像素会从 204,157,91
     *    变成 51,100,184（正好是棋盘格相邻两格的颜色），而 WebGPU 一直是 208,158,89。
     */
    const stats = await verifyOffscreen(device, 96, 96, CLEAR, (pass) => {
      updateMatrices(angle, 1);
      drawQuad(pass);
    });
    reportVerify('texture', stats, true);
  }
}

main().catch((error: unknown) => {
  setData('textureError', (error as Error).message);
  setData('textureResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
