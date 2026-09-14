/**
 * core 层示例：**实例化**（一次 draw call 画 N 个图形）。
 *
 * 与批量示例的分工很清楚：这里 N 个图形的差异全部放在**顶点缓冲**里，
 * 每个实例读一份（`stepMode: 'instance'`），所以 draw call 恒为 1。
 *
 * core 层要自己做的两件事：
 * 1. `VertexBufferLayout` 里给实例属性写 `stepMode: 'instance'`（WebGL2 后端据此调用
 *    `vertexAttribDivisor`，WebGPU 后端据此填 `GPUVertexBufferLayout.stepMode`）；
 * 2. 绑定实例缓冲时给出**准确的 size**（WebGPU 会校验「实例数 × 步长」有没有超出绑定范围）。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&count=4096&spin=0&verify=1`
 */

import { BufferUsage, mat4, vec3 } from '../src/index.js';
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
const UNIFORM_BYTES = 96; // mat4 projectionView(64) + f32 scale(4) + vec3 padding(12) … 见下方打包注释
const MAX_COUNT = 20000;
const DEFAULT_COUNT = 4096;
const SPREAD = 10;

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 instanceOffset;
layout(location = 2) in vec4 instanceColor;

layout(std140) uniform Uniforms {
  mat4 projectionView;
  float pointSize;
} u;

out vec4 vColor;

void main() {
  vec3 world = position * u.pointSize + instanceOffset;
  vColor = instanceColor;
  gl_Position = u.projectionView * vec4(world, 1.0);
}
`;

const FRAGMENT_GLSL = `
in vec4 vColor;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;

const MODULE_WGSL = `
struct Uniforms {
  projectionView: mat4x4f,
  pointSize: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) instanceOffset: vec3f,
  @location(2) instanceColor: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let world = v.position * u.pointSize + v.instanceOffset;
  out.color = v.instanceColor;
  out.position = u.projectionView * vec4f(world, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return in.color;
}
`;

/** 确定性哈希 → [0,1)，布局每次刷新都一样，便于对比与自检。 */
function hash(index: number, seed: number): number {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(seed + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000;
}

const PALETTE: readonly (readonly [number, number, number])[] = [
  [0.98, 0.62, 0.25],
  [0.35, 0.72, 0.98],
  [0.55, 0.92, 0.55],
  [0.95, 0.42, 0.55],
  [0.78, 0.6, 0.98],
  [0.98, 0.9, 0.45],
];

interface InstanceData {
  readonly offsets: Float32Array;
  readonly colors: Float32Array;
}

function buildInstanceData(count: number): InstanceData {
  const offsets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const side = Math.max(1, Math.ceil(Math.cbrt(count)));
  for (let i = 0; i < count; i++) {
    const ix = i % side;
    const iy = Math.floor(i / side) % side;
    const iz = Math.floor(i / (side * side));
    offsets[i * 3] = ((ix + 0.5) / side - 0.5 + (hash(i, 11) - 0.5) * 0.6) * SPREAD;
    offsets[i * 3 + 1] = ((iy + 0.5) / side - 0.5 + (hash(i, 12) - 0.5) * 0.6) * SPREAD;
    offsets[i * 3 + 2] = ((iz + 0.5) / side - 0.5 + (hash(i, 13) - 0.5) * 0.6) * SPREAD;
    const color = PALETTE[i % PALETTE.length]!;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    colors[i * 4 + 3] = 1;
  }
  // 第 0 个实例固定在原点：画布中心一定被覆盖，离屏自检也就有了确定的锚点。
  offsets[0] = 0;
  offsets[1] = 0;
  offsets[2] = 0;
  return { offsets, colors };
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  let spinning = query.get('spin') !== '0';
  const countParam = Number(query.get('count'));
  const count =
    Number.isInteger(countParam) && countParam > 0 ? Math.min(countParam, MAX_COUNT) : DEFAULT_COUNT;

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-instancing');
  const { device, context } = example;

  /* ---- 基础几何体 + 每实例数据 ---------------------------------------------------------------- */
  const mesh = buildQuadMesh(1);
  const positionBuffer = device.createBuffer({
    label: 'instancing:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const indexBuffer = device.createBuffer({
    label: 'instancing:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  const instanceData = buildInstanceData(count);
  const offsetBuffer = device.createBuffer({
    label: 'instancing:offsets',
    size: instanceData.offsets.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(offsetBuffer, 0, instanceData.offsets);
  const colorBuffer = device.createBuffer({
    label: 'instancing:colors',
    size: instanceData.colors.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(colorBuffer, 0, instanceData.colors);

  /* ---- uniform：projectionView(64) + pointSize(4) + 12 字节填充 = 96 ------------------------- */
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  uniformData[16] = (SPREAD / Math.ceil(Math.cbrt(count))) * 0.8;
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();
  const model = mat4.create();

  const updateUniforms = (angle: number): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    mat4.perspective(projectionGL, Math.PI / 4, aspect, 0.1, 200);
    mat4.perspectiveZO(projectionZO, Math.PI / 4, aspect, 0.1, 200);
    mat4.lookAt(view, vec3.fromValues(0, 4.5, 16), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    mat4.identity(model);
    mat4.rotateY(model, model, angle);
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);
    mat4.multiply(viewProjection, viewProjection, model);
    uniformData.set(viewProjection, 0);
    uniforms.write(uniformData);
  };

  /* ---- 管线：实例属性就是 stepMode: 'instance' 的那个槽 ---------------------------------------- */
  const module = device.createShaderModule({
    label: 'instancing:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'instancing:pipelineLayout',
    bindGroupLayouts: [uniforms.layout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'instancing:pipeline',
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
          stepMode: 'instance',
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
        {
          arrayStride: 16,
          stepMode: 'instance',
          attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x4' }],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: null },
  });

  const drawInstances = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, uniforms.bindGroup);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    // 实例缓冲的 size 必须覆盖「实例数 × 步长」。
    pass.setVertexBuffer(1, offsetBuffer, 0, count * 12);
    pass.setVertexBuffer(2, colorBuffer, 0, count * 16);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    pass.drawIndexed({ indexCount: mesh.indices.length, instanceCount: count });
  };

  let angle = 0.5;
  const drawToCanvas = (): void => {
    context.resize();
    updateUniforms(angle);
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'instancing:frame' });
    const pass = encoder.beginRenderPass({
      label: 'instancing:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawInstances(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas();
  setData('instancingResult', 'ok');
  setData('instancingCount', String(count));
  setData('instancingDrawCalls', '1');
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　${count} 个实例 = 1 次 draw call　` +
    `每个实例 2 个三角形`;

  startFrameLoop({
    draw: (delta) => {
      if (spinning) angle += delta * 0.35;
      drawToCanvas();
    },
    onFps: (fps) => {
      statsEl.textContent =
        `${context.width}×${context.height}　${fps.toFixed(0)} FPS　实例 ${count}　三角形 ${count * 2}　draw calls 1`;
    },
  });

  if (query.get('verify') === '1') {
    // 每实例颜色不同：只要画面出现多种颜色，就说明实例属性真的按实例步进了。
    const stats = await verifyOffscreen(device, 96, 96, CLEAR, (pass) => {
      updateUniforms(angle);
      drawInstances(pass);
    });
    reportVerify('instancing', stats, true);
  }
}

main().catch((error: unknown) => {
  setData('instancingError', (error as Error).message);
  setData('instancingResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
