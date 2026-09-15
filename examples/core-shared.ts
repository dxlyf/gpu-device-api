/**
 * core 层示例的公共脚手架。
 *
 * **只用 `src/index.js`（core + factories + utils），不依赖 `src/gfx`** —— 它封装的是每个示例
 * 都要写一遍、但与示例主题无关的样板：
 *
 * - 创建设备与 canvas context（`createDeviceWithAdapter`）；
 * - 把自检结论写进 `<html data-*>`，便于无头浏览器抓取；
 * - 离屏目标 + `copyTextureToBuffer` 的像素自检（证明「真的画出了东西」）；
 * - `requestAnimationFrame` 帧循环与 FPS 统计；
 * - uniform buffer / bind group 的机械创建（含动态偏移版本）。
 *
 * 每个示例真正要讲的东西 —— 着色器、顶点布局、管线、绘制命令 —— 都写在各自的 `core-*.ts` 里。
 */

import { BindingType, BufferUsage, ShaderStage, TextureUsage, createDeviceWithAdapter } from '../src/index.js';
import type { BindGroup } from '../src/core/binding/BindGroup.js';
import type { BindGroupLayout } from '../src/core/binding/BindGroupLayout.js';
import type { CanvasContext } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { Color } from '../src/core/render/RenderTarget.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';
import type { Buffer } from '../src/core/resources/Buffer.js';

export type BackendParam = 'auto' | 'webgl2' | 'webgpu';

/** 从 `?backend=` 读取后端参数；其它值按 `'auto'` 处理。 */
export function backendFromQuery(query: URLSearchParams): BackendParam {
  const value = query.get('backend');
  return value === 'webgl2' || value === 'webgpu' ? value : 'auto';
}

export interface CoreExample {
  readonly device: Device;
  readonly context: CanvasContext;
  /** 实际选中的后端。 */
  readonly backend: 'webgl2' | 'webgpu';
  /** adapter 名字（软件光栅化时会带 `(fallback)`）。 */
  readonly adapter: string;
}

/**
 * 创建示例用的设备：`backend: 'auto'` 时优先 WebGPU、失败回退 WebGL2，
 * 并把实际后端与 adapter 名字写进 `data-example-backend` / `data-example-adapter`。
 */
export async function createCoreExample(
  canvas: HTMLCanvasElement,
  backend: BackendParam,
  label: string,
): Promise<CoreExample> {
  const created = await createDeviceWithAdapter({
    canvas,
    backend,
    label,
    contextAttributes: { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: false },
  });
  if (!created.context) {
    throw new Error('[gpu-device-api] core-shared: createDeviceWithAdapter 没有返回 canvas context。');
  }
  const adapter = describeAdapterName(created.adapter.info);
  setData('exampleBackend', created.backend);
  setData('exampleAdapter', adapter);
  // 把设备报的错收集起来：WebGPU 的校验错误默认只进控制台，抓不到就只剩「画面全黑」。
  const errors: string[] = [];
  created.device.onError((error) => {
    errors.push(error.message);
    setData('exampleErrors', String(errors.length));
    setData('exampleLastError', error.message.split('\n')[0]!);
    console.error('[example] device error:', error.message);
  });
  return { device: created.device, context: created.context, backend: created.backend, adapter };
}

/** adapter 的一句话描述（后端 + 设备名，软件光栅化会标出来）。 */
function describeAdapterName(info: {
  readonly backend: string;
  readonly vendor: string;
  readonly device: string;
  readonly isFallbackAdapter: boolean;
}): string {
  const name = info.device || info.vendor || 'unknown';
  return `${info.backend}: ${name}${info.isFallbackAdapter ? ' (fallback)' : ''}`;
}

/** 把结论写进 `<html data-...>`（`camelCase` → `data-camel-case`）。 */
export function setData(name: string, value: string): void {
  document.documentElement.dataset[name] = value;
}

/* ------------------------------------------------------------------------------------------------ */
/* 离屏像素自检                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface PixelStats {
  readonly litPixels: number;
  readonly distinctColors: number;
  readonly center: readonly [number, number, number];
}

/** 颜色的字节表示，用来判定「哪些像素不是背景」。 */
function toBytes(color: Color): [number, number, number] {
  if (Array.isArray(color) || ArrayBuffer.isView(color)) {
    const list = color as ArrayLike<number>;
    return [
      Math.round((list[0] ?? 0) * 255),
      Math.round((list[1] ?? 0) * 255),
      Math.round((list[2] ?? 0) * 255),
    ];
  }
  if (typeof color === 'string') {
    const text = color.trim();
    const named: Record<string, string> = { black: '#000000', white: '#ffffff' };
    const value = named[text.toLowerCase()] ?? text;
    if (value.startsWith('#') && value.length >= 7) {
      return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
    }
    return [0, 0, 0];
  }
  return [0, 0, 0];
}

/**
 * 把 `draw()` 画进一张离屏目标并读回像素统计。
 *
 * 这套流程在 core 层要自己写：`createRenderTarget` → `createPassDescriptor` → 通道录制 →
 * `copyTextureToBuffer` → `mapAsync` → `getMappedRange`。三个容易踩的点也在这里处理掉了：
 * `usage` 要带 `CopySrc`（否则 WebGPU 不给拷）、深度格式用 `depth32float`（`usage` 会同时作用在
 * 深度附件上，而 `depth24plus` 在 WebGPU 里不能参与拷贝）、读回 buffer 用 `MapRead | CopyDst`
 *（WebGPU 规定 MapRead 只能与 CopyDst 组合）。
 *
 * **行序：两个后端唯一不一样的地方（务必读完）**
 *
 * - **WebGPU**：附件的纹素 (0, 0) 在左上角，渲染出来的画面第 0 行就落在纹素第 0 行；
 *   `copyTextureToBuffer` 从 `origin.y` 起按纹素行序往下写，所以读回缓冲的第 0 行是**画面顶端**。
 * - **WebGL2**：GL 的窗口原点在左下，附着在 FBO 上的纹理同理 —— 纹素第 0 行存的是画面**底端**。
 *   后端的 `copyTextureToBuffer` 用 `gl.readPixels` 从 `origin.y` 起逐行读出，写进缓冲时**不打乱
 *   行序**（这正是 WebGPU 的纹素拷贝语义：缓冲第 0 行 = 纹素行 `origin.y`；读回**上传过**的纹理时
 *   两个后端本来就完全一致），于是同一个「渲染进纹理」的画面，WebGL2 读回来会整体上下颠倒。
 *
 * 本函数回答的是「**画面上**中心是什么颜色、有多少像素被点亮」，所以在 WebGL2 上把读回的行序翻成
 * 屏幕行序，两个后端的 `data-*-pixel` / `data-*-lit-pixels` 才能直接对比
 * （`scripts/verify-texture-parity.mjs` 就按这个口径做跨后端断言）。真实合成截图
 * （`scripts/capture-screenshot.mjs`）永远是从上往下的那一份，口径一致。
 *
 * 注意这只补偿了**读回**这一处：「渲染进纹理之后再把这张纹理当纹理采样」在 WebGL2 上仍然是上下
 * 颠倒的（采样走纹理坐标，库层没有插手的余地）。根源在后端渲染路径（GL 的渲染目标自下而上存储），
 * 不是读回路径，已经作为后端缺陷单独反馈。一旦后端把渲染目标的行序修成与 WebGPU 一致，
 * **这里必须删掉这次翻转**，否则会翻两次。
 */
export async function verifyOffscreen(
  device: Device,
  width: number,
  height: number,
  clear: Color,
  draw: (pass: RenderPassEncoder) => void,
): Promise<PixelStats> {
  // WebGPU 要求 `copyTextureToBuffer` 的 bytesPerRow 是 **256 的倍数**，而一行像素只有 width*4 字节；
  // 所以按 256 对齐申请，读回后再逐行把填充去掉。（WebGL2 没有这条限制，但同样的写法也能用。）
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const rowBytes = width * 4;
  const byteLength = bytesPerRow * height;
  const target = device.createRenderTarget({
    label: 'example-verify',
    width,
    height,
    color: 'rgba8unorm',
    depth: 'depth32float',
    usage: TextureUsage.CopySrc,
  });
  const readback = device.createBuffer({
    label: 'example-verify-readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });

  const descriptor = target.createPassDescriptor({
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: clear,
    depthLoadOp: 'clear',
    depthClearValue: 1,
  });
  const encoder = device.createCommandEncoder({ label: 'example-verify' });
  const pass = encoder.beginRenderPass({
    label: 'example-verify-pass',
    colorAttachments: descriptor.colorAttachments,
    depthStencilAttachment: descriptor.depthStencilAttachment,
  });
  draw(pass);
  pass.end();

  const copyEncoder = device.createCommandEncoder({ label: 'example-copy' });
  copyEncoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish(), copyEncoder.finish()]);

  await readback.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
  readback.unmap();
  readback.destroy();
  target.destroy();

  // 去掉每行末尾为 256 对齐加的填充，得到紧凑的像素；WebGL2 上顺便翻成屏幕行序（理由见函数说明）。
  const flipRows = device.backend === 'webgl2';
  const pixels = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const targetRow = flipRows ? height - 1 - y : y;
    pixels.set(raw.subarray(y * bytesPerRow, y * bytesPerRow + rowBytes), targetRow * rowBytes);
  }

  const background = toBytes(clear);
  let litPixels = 0;
  const colors = new Set<number>();
  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index]!;
    const g = pixels[index + 1]!;
    const b = pixels[index + 2]!;
    if (
      Math.abs(r - background[0]) <= 4 &&
      Math.abs(g - background[1]) <= 4 &&
      Math.abs(b - background[2]) <= 4
    ) {
      continue;
    }
    litPixels += 1;
    colors.add((r << 16) | (g << 8) | b);
  }

  const centerIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
  return {
    litPixels,
    distinctColors: colors.size,
    center: [pixels[centerIndex]!, pixels[centerIndex + 1]!, pixels[centerIndex + 2]!],
  };
}

/**
 * 把一次离屏自检的结果写进 `data-<prefix>-*`。
 * `requireVariety` 为 true 时还要求画面上出现多种颜色（用来抓「所有实例/物体读到同一份数据」）。
 */
export function reportVerify(prefix: string, stats: PixelStats, requireVariety = false): void {
  setData(`${prefix}Pixel`, stats.center.join(','));
  setData(`${prefix}LitPixels`, String(stats.litPixels));
  setData(`${prefix}Distinct`, String(stats.distinctColors));
  const ok = stats.litPixels > 0 && (!requireVariety || stats.distinctColors >= 2);
  setData(`${prefix}Lit`, String(ok));
}

/* ------------------------------------------------------------------------------------------------ */
/* uniform 绑定                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface UniformBinding {
  readonly buffer: Buffer;
  readonly layout: BindGroupLayout;
  readonly bindGroup: BindGroup;
  /** 动态偏移版本里每段占用的字节数（按 `minUniformBufferOffsetAlignment` 对齐）。 */
  readonly stride: number;
  /** 写第 `slot` 段（非动态版本只能写 slot 0）。 */
  write(data: Float32Array, slot?: number): void;
  /** 第 `slot` 段的动态偏移（非动态版本恒为 0）。 */
  offsetFor(slot: number): number;
}

/**
 * 建一块 uniform buffer 与对应的 bind group layout / bind group。
 *
 * `dynamic: true` 时会按 `minUniformBufferOffsetAlignment` 切成 `slots` 段，
 * 每次 draw 用 `setBindGroup(index, bindGroup, [offsetFor(slot)])` 指到自己的那一段 ——
 * 这就是 WebGPU 上「一帧内多次 draw，各读各的 uniform」的标准做法（`gfx` 的 uniform arena 同源）。
 */
export function createUniformBinding(
  device: Device,
  options: { name: string; size: number; dynamic?: boolean; slots?: number },
): UniformBinding {
  const dynamic = options.dynamic ?? false;
  const slots = dynamic ? Math.max(1, Math.trunc(options.slots ?? 1)) : 1;
  const alignment = Math.max(1, device.limits.minUniformBufferOffsetAlignment);
  const stride = dynamic ? Math.ceil(options.size / alignment) * alignment : options.size;
  const buffer = device.createBuffer({
    label: `example:${options.name}`,
    size: stride * slots,
    usage: BufferUsage.Uniform | BufferUsage.CopyDst,
  });
  const layout = device.createBindGroupLayout({
    label: `example:${options.name}-layout`,
    entries: [
      {
        binding: 0,
        visibility: ShaderStage.Vertex | ShaderStage.Fragment,
        type: BindingType.Uniform,
        name: options.name,
        buffer: {
          type: 'uniform',
          hasDynamicOffset: dynamic,
          minBindingSize: options.size,
        },
      },
    ],
  });
  const bindGroup = device.createBindGroup({
    label: `example:${options.name}-bindGroup`,
    layout,
    entries: [{ binding: 0, resource: { buffer, offset: 0, size: stride } }],
  });

  return {
    buffer,
    layout,
    bindGroup,
    stride,
    offsetFor: (slot: number): number => (dynamic ? slot * stride : 0),
    write(data: Float32Array, slot = 0): void {
      device.queue.writeBuffer(buffer, slot * stride, data, 0, Math.min(options.size, data.byteLength));
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* 帧循环与 FPS                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface FrameLoopOptions {
  /** 每帧调用；`delta` 是上一帧到这一帧的秒数（首次为 0）。 */
  readonly draw: (delta: number, elapsed: number) => void;
  /** 大约每 500ms 回调一次实时帧率。 */
  readonly onFps?: (fps: number) => void;
}

/** 启动 rAF 循环，返回停止函数。 */
export function startFrameLoop(options: FrameLoopOptions): () => void {
  let handle = 0;
  let last = 0;
  let started = 0;
  let frames = 0;
  let windowStart = 0;

  const tick = (time: number): void => {
    if (started === 0) {
      started = time;
      windowStart = time;
    }
    const delta = last === 0 ? 0 : Math.min((time - last) / 1000, 0.1);
    last = time;
    frames += 1;
    options.draw(delta, (time - started) / 1000);
    if (options.onFps && time - windowStart > 500) {
      options.onFps((frames * 1000) / Math.max(time - windowStart, 1));
      frames = 0;
      windowStart = time;
    }
    handle = requestAnimationFrame(tick);
  };

  handle = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(handle);
}

/** 页面元素小工具：取元素并断言存在（省掉每处的 `as HTMLCanvasElement`）。 */
export function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`[gpu-device-api] core-shared: 找不到元素 #${id}。`);
  return element as T;
}

/* ------------------------------------------------------------------------------------------------ */
/* 示例用的简单几何体数据                                                                               */
/* ------------------------------------------------------------------------------------------------ */

export interface MeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint16Array;
}

interface Face {
  readonly normal: readonly [number, number, number];
  readonly corners: readonly (readonly [number, number, number])[];
}

/**
 * 一个立方体：**每个面 4 个顶点**（共 24 个，法线是面法线而不是顶点位置方向），
 * 36 个索引。按面复制顶点是「硬边」的标准做法。
 */
export function buildBoxMesh(size = 1): MeshData {
  const h = size / 2;
  const faces: readonly Face[] = [
    { normal: [0, 0, 1], corners: [[-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]] },
    { normal: [0, 0, -1], corners: [[h, -h, -h], [-h, -h, -h], [-h, h, -h], [h, h, -h]] },
    { normal: [1, 0, 0], corners: [[h, -h, h], [h, -h, -h], [h, h, -h], [h, h, h]] },
    { normal: [-1, 0, 0], corners: [[-h, -h, -h], [-h, -h, h], [-h, h, h], [-h, h, -h]] },
    { normal: [0, 1, 0], corners: [[-h, h, h], [h, h, h], [h, h, -h], [-h, h, -h]] },
    { normal: [0, -1, 0], corners: [[-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h]] },
  ];

  const positions = new Float32Array(faces.length * 4 * 3);
  const normals = new Float32Array(faces.length * 4 * 3);
  const uvs = new Float32Array(faces.length * 4 * 2);
  const indices = new Uint16Array(faces.length * 6);
  const uvCorners = [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ];

  faces.forEach((face, faceIndex) => {
    face.corners.forEach((corner, cornerIndex) => {
      const vertex = faceIndex * 4 + cornerIndex;
      positions[vertex * 3] = corner[0];
      positions[vertex * 3 + 1] = corner[1];
      positions[vertex * 3 + 2] = corner[2];
      normals[vertex * 3] = face.normal[0];
      normals[vertex * 3 + 1] = face.normal[1];
      normals[vertex * 3 + 2] = face.normal[2];
      uvs[vertex * 2] = uvCorners[cornerIndex]![0]!;
      uvs[vertex * 2 + 1] = uvCorners[cornerIndex]![1]!;
    });
    // 每个面两个三角形（保持 a → b → c 逆时针，正面朝外）
    const base = faceIndex * 4;
    const target = faceIndex * 6;
    indices[target] = base;
    indices[target + 1] = base + 1;
    indices[target + 2] = base + 2;
    indices[target + 3] = base;
    indices[target + 4] = base + 2;
    indices[target + 5] = base + 3;
  });

  return { positions, normals, uvs, indices };
}

/** 单位四边形（XY 平面，中心在原点，uv 0..1），6 个索引。 */
export function buildQuadMesh(size = 2): MeshData {
  const h = size / 2;
  const positions = new Float32Array([-h, -h, 0, h, -h, 0, h, h, 0, -h, h, 0]);
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
  const indices = Uint16Array.from([0, 1, 2, 0, 2, 3]);
  return { positions, normals, uvs, indices };
}
