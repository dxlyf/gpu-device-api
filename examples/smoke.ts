/**
 * 后端冒烟测试：用 **core 层 API**（不依赖任何便捷层）真的画一帧，并把像素读回来断言。
 *
 * 为什么需要它：类型检查与单元测试只能证明「代码结构对」，无法证明「GL 调用序列真的能画出东西」。
 * 这个页面在真实浏览器里跑完整链路：shader 编译链接 → 顶点布局 / VAO → 渲染通道 → 清屏 → draw
 * → 像素回读，另外验证几条错误路径确实会报错。
 *
 * 无头自动化的判据：结果会写到 `<html data-smoke-result="pass|fail">`，
 * 配合 `chrome --headless --dump-dom` 直接抓取即可。
 */

import { createDeviceWithAdapter } from '../src/factories/index.js';

const lines: string[] = [];
let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function report(): void {
  const out = document.getElementById('out')!;
  out.textContent = lines.join('\n');
  out.className = failures === 0 ? 'pass' : 'fail';
  document.documentElement.dataset.smokeResult = failures === 0 ? 'pass' : 'fail';
}

function expectValidationError(name: string, action: () => void): void {
  try {
    action();
    check(name, false, '期望抛错但没抛');
  } catch (error) {
    const message = (error as Error).message.split('\n')[0] ?? '';
    check(name, (error as Error).name === 'ValidationError', message);
  }
}

const VERTEX_SHADER = `
layout(location = 0) in vec2 position;
layout(location = 1) in vec4 color;
out vec4 vColor;
void main() {
  vColor = color;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
in vec4 vColor;
layout(location = 0) out vec4 fragColor;
void main() {
  fragColor = vColor;
}
`;

async function run(): Promise<void> {
  const canvas = document.getElementById('c') as HTMLCanvasElement;

  /* ---- 1. 设备与 canvas ------------------------------------------------------------------ */
  const created = await createDeviceWithAdapter({
    canvas,
    backend: 'webgl2',
    strictBackend: true,
    label: 'smoke',
    // 冒烟测试要读回 canvas 像素，所以必须保留绘制缓冲，否则合成之后内容就没了。
    contextAttributes: { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: true },
  });
  const { device, backend } = created;
  check('创建 WebGL2 设备', backend === 'webgl2', `backend=${backend}`);
  check('canvas context 已配置', created.context !== null, `format=${created.context?.format}`);

  const context = created.context!;
  const gl = device.native as WebGL2RenderingContext;
  check('escape hatch 能拿到 GL context', typeof gl.createBuffer === 'function');

  /* ---- 2. 管线与顶点缓冲 ------------------------------------------------------------------ */
  const module = device.createShaderModule({
    label: 'smoke-shader',
    code: { vs: VERTEX_SHADER, fs: FRAGMENT_SHADER },
  });

  // position(vec2) + color(vec4) 交织在同一个缓冲里，步长 24 字节。
  const vertexLayout = {
    arrayStride: 24,
    attributes: [
      { shaderLocation: 0, offset: 0, format: 'float32x2' as const },
      { shaderLocation: 1, offset: 8, format: 'float32x4' as const },
    ],
  };

  const pipeline = device.createRenderPipeline({
    label: 'smoke-pipeline',
    vertex: { module, buffers: [vertexLayout] },
    fragment: { module },
    primitive: { topology: 'triangle-list' },
    depthStencil: { format: null },
  });
  check('创建渲染管线（program 链接 + 接口交叉校验通过）', pipeline.compiled === true);

  const vertexData = new Float32Array([
    0.0, 0.9, 1.0, 0.0, 0.0, 1.0,
    -0.9, -0.9, 0.0, 1.0, 0.0, 1.0,
    0.9, -0.9, 0.0, 0.0, 1.0, 1.0,
  ]);
  const vertexBuffer = device.createBuffer({
    label: 'smoke-vertices',
    size: vertexData.byteLength,
    usage: 0x0020 | 0x0008, // Vertex | CopyDst
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  /* ---- 3. 渲染到 canvas ------------------------------------------------------------------ */
  const CLEAR: [number, number, number, number] = [0.05, 0.06, 0.08, 1];
  const frame = context.getCurrentFrameTarget();
  check('取得帧目标', frame.isDefaultFramebuffer === true, `${frame.width}x${frame.height}`);

  const encoder = device.createCommandEncoder({ label: 'smoke' });
  const pass = encoder.beginRenderPass({
    label: 'smoke-pass',
    colorAttachments: [{ view: frame.view, loadOp: 'clear', storeOp: 'store', clearValue: CLEAR }],
  });
  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer, 0, vertexData.byteLength);
  pass.draw({ vertexCount: 3 });
  pass.end();
  device.queue.submit([encoder.finish()]);

  // canvas 的默认帧缓冲没有 texture 对象，读回只能用 GL 原生接口 —— 这正是 escape hatch 的用途。
  const center = new Uint8Array(4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(Math.floor(frame.width / 2), Math.floor(frame.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, center);
  check(
    'canvas 中央像素被三角形着色（三顶点颜色插值，应为非零的混合色）',
    center[0]! > 20 && center[1]! > 20 && center[2]! > 20,
    `rgba=${Array.from(center).join(',')}`,
  );

  const corner = new Uint8Array(4);
  gl.readPixels(2, 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, corner);
  const expected = CLEAR.slice(0, 3).map((value) => Math.round(value * 255));
  check(
    '角落像素等于清屏色（clear 生效，且三角形未覆盖角落）',
    Math.abs(corner[0]! - expected[0]!) <= 2 &&
      Math.abs(corner[1]! - expected[1]!) <= 2 &&
      Math.abs(corner[2]! - expected[2]!) <= 2,
    `rgba=${Array.from(corner).join(',')} 期望≈${expected.join(',')}`,
  );

  /* ---- 4. 离屏渲染目标 + 读回 ------------------------------------------------------------- */
  const target = device.createRenderTarget({
    label: 'smoke-target',
    width: 64,
    height: 64,
    color: 'rgba8unorm',
    depth: 'depth24plus',
  });
  check('创建离屏渲染目标（含深度附件）', target.width === 64 && target.depthFormat === 'depth24plus');

  const passDescriptor = target.createPassDescriptor({
    loadOp: 'clear',
    clearValue: [0.25, 0.5, 0.75, 1],
    depthLoadOp: 'clear',
  });

  const encoder2 = device.createCommandEncoder({ label: 'smoke-offscreen' });
  const pass2 = encoder2.beginRenderPass({
    label: 'smoke-offscreen-pass',
    colorAttachments: passDescriptor.colorAttachments,
    depthStencilAttachment: passDescriptor.depthStencilAttachment,
  });
  pass2.setPipeline(
    device.createRenderPipeline({
      label: 'smoke-pipeline-depth',
      vertex: { module, buffers: [vertexLayout] },
      fragment: { module },
      depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    }),
  );
  pass2.setVertexBuffer(0, vertexBuffer, 0, vertexData.byteLength);
  pass2.draw({ vertexCount: 3 });
  pass2.end();

  const readback = device.createBuffer({
    label: 'smoke-readback',
    size: 64 * 64 * 4,
    usage: 0x0001 | 0x0004 | 0x0008, // MapRead | CopySrc | CopyDst
  });
  encoder2.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow: 64 * 4 },
    { width: 64, height: 64, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder2.finish()]);

  await readback.mapAsync('read', 0, 64 * 64 * 4);
  const pixels = new Uint8Array(readback.getMappedRange(0, 64 * 64 * 4));
  const centerIndex = (32 * 64 + 32) * 4;
  const offscreenCenter = [pixels[centerIndex]!, pixels[centerIndex + 1]!, pixels[centerIndex + 2]!];
  const cornerIndex = (2 * 64 + 2) * 4;
  const offscreenCorner = [pixels[cornerIndex]!, pixels[cornerIndex + 1]!, pixels[cornerIndex + 2]!];
  readback.unmap();

  check(
    '离屏目标中央像素被着色（说明 FBO 渲染成功）',
    offscreenCenter[0]! + offscreenCenter[1]! + offscreenCenter[2]! > 30,
    `rgb=${offscreenCenter.join(',')}`,
  );
  check(
    '离屏目标角落像素等于其清屏色',
    Math.abs(offscreenCorner[0]! - 64) <= 2 &&
      Math.abs(offscreenCorner[1]! - 128) <= 2 &&
      Math.abs(offscreenCorner[2]! - 191) <= 2,
    `rgb=${offscreenCorner.join(',')} 期望≈64,128,191`,
  );

  /* ---- 5. 错误路径必须真的报错 ------------------------------------------------------------ */
  expectValidationError('WebGL2 上创建 compute pipeline 应报 ValidationError', () => {
    device.createComputePipeline({ label: 'nope', compute: { module } });
  });

  expectValidationError('GLSL 写 #version 100 应报错，而不是静默替换', () => {
    const bad = device.createShaderModule({
      label: 'bad',
      code: { vs: '#version 100\nvoid main() {}', fs: FRAGMENT_SHADER },
    });
    device.createRenderPipeline({
      label: 'bad-version',
      vertex: { module: bad, buffers: [vertexLayout] },
      fragment: { module: bad },
    });
  });

  expectValidationError('顶点着色器用了 location 0/1 但没声明 vertex.buffers 应报错', () => {
    const noBuffers = device.createRenderPipeline({
      label: 'no-buffers',
      vertex: { module },
      fragment: { module },
      depthStencil: { format: null },
    });
    // 顶点布局是在第一次 resolve（首次 draw）时校验的，所以这里显式触发它。
    noBuffers.resolve({ colorFormats: ['rgba8unorm'], sampleCount: 1, depthFormat: null, vertexLayouts: [] });
  });

  expectValidationError('sampler 未配对的 BindGroupLayout 应在建计划时报错', () => {
    const layout = device.createBindGroupLayout({
      label: 'orphan-sampler',
      entries: [
        { binding: 0, visibility: 0x0002, type: 'sampler', name: 'lonely_sampler' },
      ],
    });
    device.createPipelineLayout({ label: 'orphan', bindGroupLayouts: [layout] });
  });

  device.dispose();
  check('device.dispose() 正常完成', device.disposed === true);
}

run()
  .catch((error: unknown) => {
    check('运行过程抛出未预期的异常', false, `${(error as Error).name}: ${(error as Error).message}`);
  })
  .finally(report);
