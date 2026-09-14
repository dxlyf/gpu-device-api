/**
 * core 层示例：**一个会转的立方体**。
 *
 * 相比「三角形」这一页，这里多出来的都是 3D 绘制的必备件，全部手写：
 * 透视投影与视图矩阵（`mat4`，utils 里的数学库不算 gfx 便捷层）、
 * uniform 块的**字节打包**（std140 / WGSL uniform 的布局）、bind group layout / bind group /
 * pipeline layout、以及带深度状态的管线。
 *
 * 两个容易踩的点在这页里能直接看到：
 * 1. **uniform 块在两个 stage 都要声明**（GLSL 里 vs 与 fs 各写一份 `layout(std140) uniform`），
 *    `src/gfx` 会自动注入，core 层得自己写；
 * 2. **画布通道没有深度附件**（本抽象只给一个 color view），所以画到 canvas 时靠背面剔除也不会有
 *    穿帮（凸体正面的投影互不重叠）；离屏自检那张目标带 `depth32float`，深度测试才真正生效。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&spin=0&verify=1`
 */

import { BufferUsage, mat4, vec3 } from '../src/index.js';
import {
  backendFromQuery,
  buildBoxMesh,
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
/** uniform 块：mat4(64) + mat4(64) + vec3(12 → 补齐到 16)。 */
const UNIFORM_BYTES = 144;
const UNIFORM_FLOATS = UNIFORM_BYTES / 4;

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

layout(std140) uniform Uniforms {
  mat4 projectionView;
  mat4 model;
  vec3 lightDirection;
} u;

out vec3 vNormal;

void main() {
  vNormal = mat3(u.model) * normal;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}
`;

const FRAGMENT_GLSL = `
layout(std140) uniform Uniforms {
  mat4 projectionView;
  mat4 model;
  vec3 lightDirection;
} u;

in vec3 vNormal;

layout(location = 0) out vec4 fragColor;

void main() {
  float ndl = max(dot(normalize(vNormal), normalize(-u.lightDirection)), 0.0);
  vec3 base = vec3(0.98, 0.62, 0.25);
  fragColor = vec4(base * (0.25 + 0.75 * ndl), 1.0);
}
`;

const MODULE_WGSL = `
struct Uniforms {
  projectionView: mat4x4f,
  model: mat4x4f,
  lightDirection: vec3f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.normal = (u.model * vec4f(v.normal, 0.0)).xyz;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let ndl = max(dot(normalize(in.normal), normalize(-u.lightDirection)), 0.0);
  let base = vec3f(0.98, 0.62, 0.25);
  return vec4f(base * (0.25 + 0.75 * ndl), 1.0);
}
`;

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  let spinning = query.get('spin') !== '0';

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-box');
  const { device, context } = example;

  /* ---- 几何体：24 个顶点（每个面 4 个，法线是面法线）+ 36 个索引 ----------------------------- */
  const mesh = buildBoxMesh(1.4);
  const positionBuffer = device.createBuffer({
    label: 'box:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const normalBuffer = device.createBuffer({
    label: 'box:normals',
    size: mesh.normals.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(normalBuffer, 0, mesh.normals);
  const indexBuffer = device.createBuffer({
    label: 'box:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  /* ---- uniform：手写 std140 / WGSL uniform 的布局 ------------------------------------------ */
  // 偏移约定：projectionView 在 0，model 在 64，lightDirection 在 128（12 字节 + 4 字节填充）。
  const uniformData = new Float32Array(UNIFORM_FLOATS);
  uniformData[32] = 0.42;
  uniformData[33] = 0.86;
  uniformData[34] = 0.52;
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();

  /** 按当前画布宽高比重算投影，并把 P×V 写进 uniform 的前 16 个 float。 */
  const updateCamera = (): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    mat4.perspective(projectionGL, Math.PI / 4, aspect, 0.1, 100);
    mat4.perspectiveZO(projectionZO, Math.PI / 4, aspect, 0.1, 100);
    mat4.lookAt(view, vec3.fromValues(0, 1.7, 4.4), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    // 深度约定：WebGL2 的裁剪空间 z ∈ [-1,1]，WebGPU 是 [0,1]，投影矩阵必须跟着变。
    const projection = example.backend === 'webgpu' ? projectionZO : projectionGL;
    mat4.multiply(viewProjection, projection, view);
    uniformData.set(viewProjection, 0);
  };

  /* ---- 着色器与管线 ------------------------------------------------------------------------- */
  const module = device.createShaderModule({
    label: 'box:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'box:pipelineLayout',
    bindGroupLayouts: [uniforms.layout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'box:pipeline',
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
          arrayStride: 12,
          stepMode: 'vertex',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    // 画布通道没有深度附件；离屏目标有，所以深度状态的声明是必要的（WebGPU 会按目标形态取变体）。
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const drawBox = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, uniforms.bindGroup);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    pass.setVertexBuffer(1, normalBuffer, 0, normalBuffer.size);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    pass.drawIndexed({ indexCount: mesh.indices.length });
  };

  let angle = 0.4;
  const updateModel = (): void => {
    const model = mat4.create();
    mat4.rotateX(model, model, -0.25);
    mat4.rotateY(model, model, angle);
    uniformData.set(model, 16);
    uniforms.write(uniformData);
  };

  const drawToCanvas = (): void => {
    context.resize();
    updateCamera();
    updateModel();
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'box:frame' });
    const pass = encoder.beginRenderPass({
      label: 'box:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawBox(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas();
  setData('boxResult', 'ok');
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　24 顶点 / 36 索引 / 1 次 draw call　` +
    `uniform ${UNIFORM_BYTES} 字节`;

  startFrameLoop({
    draw: (delta) => {
      if (spinning) angle += delta * 0.6;
      drawToCanvas();
    },
    onFps: (fps) => {
      statsEl.textContent = `${context.width}×${context.height}　${fps.toFixed(0)} FPS　三角形 12　draw calls 1`;
    },
  });

  if (query.get('verify') === '1') {
    // 离屏目标带深度附件：这里渲染时深度测试是生效的。
    const stats = await verifyOffscreen(device, 96, 96, CLEAR, (pass) => {
      updateCamera();
      updateModel();
      drawBox(pass);
    });
    reportVerify('box', stats, false);
  }
}

main().catch((error: unknown) => {
  setData('boxError', (error as Error).message);
  setData('boxResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
