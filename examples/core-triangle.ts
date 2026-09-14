/**
 * core 层示例：**一个三角形**。
 *
 * 只用 `src/index.js` 的公开 API（core + factories + utils），**不经过 `src/gfx` 便捷层**：
 * 着色器模块、顶点缓冲、渲染管线、command encoder、渲染通道、提交，全部手写。
 * 这一页刻意做得最小 —— 没有 uniform、没有 bind group，正好说明「一次绘制最少需要什么」：
 * 一份 GLSL + 一份 WGSL、一个顶点缓冲、一条管线、一次 `draw()`。
 *
 * 与 `src/gfx` 的对照：便捷层里的 `Geometry` 是「一个属性一个 buffer」，
 * 这里故意用**交织**存储（position 与 color 在同一个 buffer 里），两种都能工作。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&verify=1`
 */

import { BufferUsage } from '../src/index.js';
import {
  backendFromQuery,
  createCoreExample,
  reportVerify,
  requireElement,
  setData,
  startFrameLoop,
  verifyOffscreen,
} from './core-shared.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

const CLEAR: readonly [number, number, number, number] = [0.043, 0.055, 0.075, 1];

/** 顶点着色器：位置直接给的是裁剪空间坐标（没有相机、没有矩阵）。 */
const VERTEX_GLSL = `
layout(location = 0) in vec2 position;
layout(location = 1) in vec3 color;

out vec3 vColor;

void main() {
  vColor = color;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_GLSL = `
in vec3 vColor;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

/** WGSL 侧是**一个模块**（顶点与片元两个入口），与 `createShaderModule` 的形状一致。 */
const MODULE_WGSL = `
struct VertexInput {
  @location(0) position: vec2f,
  @location(1) color: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.color = v.color;
  out.position = vec4f(v.position, 0.0, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return vec4f(in.color, 1.0);
}
`;

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-triangle');
  const { device, context } = example;

  /* ---- 顶点缓冲：position(vec2) + color(vec3) 交织，步长 8 + 12 = 20 字节 ------------- */
  const vertices = new Float32Array([
    //  position      color
    0.0, 0.75, 0.98, 0.32, 0.28,
    -0.75, -0.65, 0.32, 0.72, 0.98,
    0.75, -0.65, 0.55, 0.92, 0.55,
  ]);
  const vertexBuffer = device.createBuffer({
    label: 'triangle:vertices',
    size: vertices.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  /* ---- 着色器与管线 ----------------------------------------------------------------------- */
  const module = device.createShaderModule({
    label: 'triangle:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipeline = device.createRenderPipeline({
    label: 'triangle:pipeline',
    // 这一页没有任何 bind group，所以 layout 用 'auto' 就够了（两个后端都支持）。
    layout: 'auto',
    vertex: {
      module,
      entryPoint: 'vsMain',
      buffers: [
        {
          arrayStride: 20,
          stepMode: 'vertex',
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x3' },
          ],
        },
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list' },
    // `format: null` 表示不需要深度状态；画布通道本来也没有深度附件。
    depthStencil: { format: null },
  });

  /* ---- 一次绘制：录制 + 提交 ---------------------------------------------------------------- */
  const drawTriangle = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer, 0, vertexBuffer.size);
    pass.draw({ vertexCount: 3 });
  };

  const drawToCanvas = (): void => {
    context.resize();
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'triangle:frame' });
    const pass = encoder.beginRenderPass({
      label: 'triangle:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawTriangle(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas();
  setData('triangleResult', 'ok');
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　1 次 draw call / 1 个三角形 / 没有 uniform`;

  startFrameLoop({
    draw: () => drawToCanvas(),
    onFps: (fps) => {
      statsEl.textContent = `${context.width}×${context.height}　${fps.toFixed(0)} FPS　顶点 3　draw calls 1`;
    },
  });

  /* ---- 可选自检：画进离屏目标读回像素 -------------------------------------------------------- */
  if (query.get('verify') === '1') {
    const stats = await verifyOffscreen(device, 64, 64, CLEAR, drawTriangle);
    reportVerify('triangle', stats, true);
  }
}

main().catch((error: unknown) => {
  setData('triangleError', (error as Error).message);
  setData('triangleResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
