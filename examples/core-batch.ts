/**
 * core 层示例：**批量绘制**（N 次 draw call，每个物体一份自己的 uniform）。
 *
 * 与实例化示例正好互补：这里每个物体各录一次 `drawIndexed()`，但**共用同一条管线**；
 * 每个物体的 model 与颜色放在一块 uniform buffer 的**不同区间**里，
 * 用**动态偏移**绑定：`setBindGroup(1, bindGroup, [offset])`。
 *
 * 这正是 `src/gfx` 的 uniform arena 在 core 层的形态。为什么必须这么做：
 * WebGPU 的 `queue.writeBuffer` 在**提交时**才生效，如果 N 次 draw 都读同一段 uniform，
 * 画面上的物体会全部变成最后写入的那一份；而 WebGL2 是立即模式 —— 两个后端行为会不一致。
 * 动态偏移让每次 draw 指向自己的区间，两端就完全一致了（`hasDynamicOffset: true` 是前提，
 * 绑定布局里漏了这个标记，WebGPU 会直接判整条 command buffer 无效）。
 *
 * 查询参数：`?backend=webgl2|webgpu|auto&side=5&spin=0&verify=1`
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
/** group 0（每帧一次）：projectionView = mat4。 */
const FRAME_UNIFORM_BYTES = 64;
/** group 1（每个物体一次）：model = mat4 + baseColor = vec4。 */
const OBJECT_UNIFORM_BYTES = 80;
const MAX_SIDE = 10;
const DEFAULT_SIDE = 5;
const BOX_SIZE = 0.8;
const SPACING = 1.15;

const VERTEX_GLSL = `
layout(location = 0) in vec3 position;

layout(std140) uniform FrameUniforms {
  mat4 projectionView;
} frame;

layout(std140) uniform ObjectUniforms {
  mat4 model;
  vec4 baseColor;
} object;

void main() {
  gl_Position = frame.projectionView * object.model * vec4(position, 1.0);
}
`;

const FRAGMENT_GLSL = `
layout(std140) uniform ObjectUniforms {
  mat4 model;
  vec4 baseColor;
} object;

layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = object.baseColor;
}
`;

const MODULE_WGSL = `
struct FrameUniforms {
  projectionView: mat4x4f,
}

struct ObjectUniforms {
  model: mat4x4f,
  baseColor: vec4f,
}

@group(0) @binding(0) var<uniform> frame: FrameUniforms;
@group(1) @binding(0) var<uniform> object: ObjectUniforms;

struct VertexInput {
  @location(0) position: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f {
  return frame.projectionView * object.model * vec4f(v.position, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return object.baseColor;
}
`;

const PALETTE: readonly (readonly [number, number, number, number])[] = [
  [0.98, 0.42, 0.32, 1],
  [0.42, 0.78, 0.98, 1],
  [0.52, 0.92, 0.55, 1],
  [0.98, 0.82, 0.36, 1],
  [0.82, 0.55, 0.98, 1],
  [0.98, 0.55, 0.78, 1],
  [0.45, 0.9, 0.85, 1],
  [0.92, 0.92, 0.92, 1],
];

interface BatchItem {
  /** 该物体在「批」里的位置（不含整批旋转）。 */
  readonly localModel: Float32Array;
  readonly color: readonly [number, number, number, number];
  /** 每帧复用的世界矩阵。 */
  readonly worldModel: Float32Array;
  /** 该物体在 dynamic uniform buffer 里的槽位。 */
  readonly slot: number;
}

function buildItems(side: number): readonly BatchItem[] {
  const half = (side - 1) / 2;
  const items: BatchItem[] = [];
  let slot = 0;
  for (let z = 0; z < side; z++) {
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        items.push({
          localModel: mat4.fromTranslation(
            mat4.create(),
            vec3.fromValues((x - half) * SPACING, (y - half) * SPACING, (z - half) * SPACING),
          ),
          color: PALETTE[(x + y + z) % PALETTE.length]!,
          worldModel: mat4.create(),
          slot: slot++,
        });
      }
    }
  }
  return items;
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  let spinning = query.get('spin') !== '0';
  const sideParam = Number(query.get('side'));
  const side = Number.isInteger(sideParam) && sideParam > 0 ? Math.min(sideParam, MAX_SIDE) : DEFAULT_SIDE;

  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-batch');
  const { device, context } = example;

  /* ---- 几何体：一个立方体，所有物体共用 -------------------------------------------------------- */
  const mesh = buildBoxMesh(BOX_SIZE);
  const positionBuffer = device.createBuffer({
    label: 'batch:positions',
    size: mesh.positions.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(positionBuffer, 0, mesh.positions);
  const indexBuffer = device.createBuffer({
    label: 'batch:indices',
    size: mesh.indices.byteLength,
    usage: BufferUsage.Index | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

  /* ---- 两块 uniform：每帧一份 + 每物体一份（动态偏移）----------------------------------------- */
  const items = buildItems(side);
  const frameUniformData = new Float32Array(FRAME_UNIFORM_BYTES / 4);
  const frameUniforms = createUniformBinding(device, {
    name: 'FrameUniforms',
    size: FRAME_UNIFORM_BYTES,
  });
  const objectUniformData = new Float32Array(OBJECT_UNIFORM_BYTES / 4);
  const objectUniforms = createUniformBinding(device, {
    name: 'ObjectUniforms',
    size: OBJECT_UNIFORM_BYTES,
    dynamic: true,
    slots: items.length,
  });

  // 每个物体的 model 与颜色只写一次；之后每帧只更新 frame。
  for (const item of items) {
    objectUniformData.set(item.localModel, 0);
    objectUniformData.set(item.color, 16);
    objectUniforms.write(objectUniformData, item.slot);
  }

  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();
  const rotation = mat4.create();

  const updateFrameUniform = (angle: number): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    mat4.perspective(projectionGL, Math.PI / 4, aspect, 0.1, 100);
    mat4.perspectiveZO(projectionZO, Math.PI / 4, aspect, 0.1, 100);
    mat4.lookAt(view, vec3.fromValues(4.4, 3.6, 7.6), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);
    frameUniformData.set(viewProjection, 0);
    frameUniforms.write(frameUniformData);
    mat4.identity(rotation);
    mat4.rotateY(rotation, rotation, angle);
  };

  /* ---- 管线：两个 bind group（0 = 每帧，1 = 每物体且带动态偏移）-------------------------------- */
  const module = device.createShaderModule({
    label: 'batch:shader',
    code: { vs: VERTEX_GLSL, fs: FRAGMENT_GLSL, wgsl: MODULE_WGSL },
  });
  const pipelineLayout = device.createPipelineLayout({
    label: 'batch:pipelineLayout',
    bindGroupLayouts: [frameUniforms.layout, objectUniforms.layout],
  });
  const pipeline = device.createRenderPipeline({
    label: 'batch:pipeline',
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
      ],
    },
    fragment: { module, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'back', frontFace: 'ccw' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const drawBatch = (pass: RenderPassEncoder): void => {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, frameUniforms.bindGroup);
    pass.setVertexBuffer(0, positionBuffer, 0, positionBuffer.size);
    pass.setIndexBuffer(indexBuffer, 'uint16', 0, indexBuffer.size);
    for (const item of items) {
      mat4.multiply(item.worldModel, rotation, item.localModel);
      // 动态偏移：这次 draw 读的是 objectUniforms 里属于它的那一槽。
      pass.setBindGroup(1, objectUniforms.bindGroup, [objectUniforms.offsetFor(item.slot)]);
      pass.drawIndexed({ indexCount: mesh.indices.length });
    }
  };

  let angle = 0.35;
  const drawToCanvas = (): void => {
    context.resize();
    updateFrameUniform(angle);
    const frame = context.getCurrentFrameTarget();
    const encoder = device.createCommandEncoder({ label: 'batch:frame' });
    const pass = encoder.beginRenderPass({
      label: 'batch:pass',
      colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
    });
    drawBatch(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  drawToCanvas();
  setData('batchResult', 'ok');
  setData('batchItems', String(items.length));
  setData('batchDrawCalls', String(items.length));
  setData('batchStride', String(objectUniforms.stride));
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　${items.length} 个物体 = ${items.length} 次 draw call　` +
    `1 条管线 / 2 个 bind group（group 1 用动态偏移，步长 ${objectUniforms.stride} 字节）`;

  startFrameLoop({
    draw: (delta) => {
      if (spinning) angle += delta * 0.25;
      drawToCanvas();
    },
    onFps: (fps) => {
      statsEl.textContent =
        `${context.width}×${context.height}　${fps.toFixed(0)} FPS　物体 ${items.length}　` +
        `三角形 ${items.length * 12}　draw calls ${items.length}`;
    },
  });

  if (query.get('verify') === '1') {
    // 每个物体颜色不同：多种颜色同时出现，就说明「每次 draw 读到了自己的那段 uniform」。
    const stats = await verifyOffscreen(device, 128, 128, CLEAR, (pass) => {
      updateFrameUniform(angle);
      drawBatch(pass);
    });
    reportVerify('batch', stats, true);
  }
}

main().catch((error: unknown) => {
  setData('batchError', (error as Error).message);
  setData('batchResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
