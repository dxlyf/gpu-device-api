/**
 * 「渲染到纹理」行序的回归测试（方案 C：core 显式 + gfx 自动）。
 *
 * 这一轮把行序这件事分成两层，本文件按层钉死：
 *
 * 1. **core 层如实暴露、不代劳**：
 *    - `RenderTarget.rowOrder` 在两个后端给出各自的原生行序（WebGL2 = `'bottomUp'`、
 *      WebGPU = `'topLeft'`）；
 *    - 公开 helper `mat4.flipClipY` 的数学正确性 —— 它等于 `diag(1, -1, 1, 1) × a`，
 *      等价于在着色器里写 `gl_Position.y *= -1`，**并且会反转三角绕序**
 *      （最后这一条是「翻投影就必须同时翻 `frontFace`」的全部理由，所以它必须被钉死）。
 * 2. **gfx 层自动统一**：`Renderer` 只在「附件是纹理、且该目标原生行序是 `bottomUp`」时
 *    翻相机投影并翻转 `frontFace`，画布通道不翻，切回画布时状态自动恢复；
 *    `rowOrder: 'backend'` 能把这条自动行为关掉。
 *
 * 这里用假的 WebGL2 设备（记录 `createRenderPipeline` 的描述与 `queue.writeBuffer` 的内容）
 * 驱动**真实的 `Renderer`**：所以断言的是「渲染器实际下发了什么」，而不是「某个函数被调过」。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 工厂函数会被提升到文件顶部，所以只能引用 `vi.fn()` 与动态 import。
vi.mock('../src/factories/createDevice.js', () => ({
  createDeviceWithAdapter: vi.fn(),
}));

vi.mock('../src/webgl2/pipeline/Prewarm.js', () => ({
  prewarmWebGL2RenderPipeline: vi.fn(),
}));

import { createDeviceWithAdapter, type CreatedDevice } from '../src/factories/createDevice.js';
import { prewarmWebGL2RenderPipeline } from '../src/webgl2/pipeline/Prewarm.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { Renderer } from '../src/gfx/Renderer.js';
import { defineMaterial, type Material } from '../src/gfx/Material.js';
import { mat4 } from '../src/utils/math/index.js';
import { RowOrder } from '../src/core/render/RenderTarget.js';
import { createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';
import type { BackendKind } from '../src/core/Adapter.js';
import type { CanvasContext, CanvasPassDescriptor } from '../src/core/CanvasContext.js';
import type { Device } from '../src/core/Device.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import type { RenderPipeline, RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';
import type { ColorAttachment } from '../src/core/render/RenderTarget.js';

/* ------------------------------------------------------------------------------------------------ */
/* 一、mat4.flipClipY：数学正确性 + 「会反转绕序」                                                       */
/* ------------------------------------------------------------------------------------------------ */

/** 4x4 列主序矩阵乘 vec4（测试里自己写一份，避免与被测代码共用同一段实现）。 */
function transformVec4(m: ArrayLike<number>, x: number, y: number, z: number, w: number): number[] {
  const out: number[] = [];
  for (let row = 0; row < 4; row++) {
    out.push(m[row]! * x + m[4 + row]! * y + m[8 + row]! * z + m[12 + row]! * w);
  }
  return out;
}

/** 透视除法后的 NDC，取 x/y。 */
function ndcXy(m: ArrayLike<number>, point: readonly number[]): [number, number] {
  const clip = transformVec4(m, point[0]!, point[1]!, point[2]!, 1);
  const w = clip[3]! === 0 ? 1e-9 : clip[3]!;
  return [clip[0]! / w, clip[1]! / w];
}

/** 三角形在 NDC 里的有向面积（> 0 = 逆时针 = 正面，`frontFace: 'ccw'`）。 */
function signedArea(m: ArrayLike<number>, a: readonly number[], b: readonly number[], c: readonly number[]): number {
  const [ax, ay] = ndcXy(m, a);
  const [bx, by] = ndcXy(m, b);
  const [cx, cy] = ndcXy(m, c);
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

describe('mat4.flipClipY：在裁剪空间把 Y 取反', () => {
  it('等于 diag(1, -1, 1, 1) × a（也就是只把各列的 Y 行取反）', () => {
    const a = mat4.fromValues(
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    );
    const diagonal = mat4.fromValues(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    const expected = mat4.create();
    mat4.multiply(expected, diagonal, a);

    const actual = mat4.create();
    mat4.flipClipY(actual, a);

    expect(Array.from(actual)).toEqual(Array.from(expected));
    // 逐字确认「只改了 Y 行」：下标 1 / 5 / 9 / 13 取反，其余原样。
    expect(Array.from(actual)).toEqual([
      1, -2, 3, 4,
      5, -6, 7, 8,
      9, -10, 11, 12,
      13, -14, 15, 16,
    ]);
  });

  it('out 与 a 不是同一个矩阵时不动入参；相同时就地翻转', () => {
    const a = mat4.fromValues(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    const source = mat4.clone(a);
    const out = mat4.create();
    mat4.flipClipY(out, a);
    expect(Array.from(a)).toEqual(Array.from(source));

    mat4.flipClipY(a, a);
    expect(Array.from(a)).toEqual(Array.from(out));
  });

  it('把一个裁剪空间点 (x, y, z, w) 变成 (x, -y, z, w) —— 与 gl_Position.y *= -1 等价', () => {
    const projection = mat4.create();
    mat4.perspectiveZO(projection, Math.PI / 3, 1.5, 0.1, 100);
    const flipped = mat4.create();
    mat4.flipClipY(flipped, projection);

    const point = [0.4, -0.7, -3, 1];
    const before = transformVec4(projection, point[0]!, point[1]!, point[2]!, point[3]!);
    const after = transformVec4(flipped, point[0]!, point[1]!, point[2]!, point[3]!);

    expect(after[0]).toBeCloseTo(before[0]!, 6);
    expect(after[1]).toBeCloseTo(-before[1]!, 6);
    expect(after[2]).toBeCloseTo(before[2]!, 6);
    expect(after[3]).toBeCloseTo(before[3]!, 6);
  });

  it('会反转三角绕序：正面（ccw）翻完变成背面（cw）—— 所以必须同时翻 frontFace', () => {
    // 正投影：世界坐标就是 NDC，便于肉眼核对。
    const ortho = mat4.create();
    mat4.ortho(ortho, -1, 1, -1, 1, -1, 1);
    const flippedOrtho = mat4.create();
    mat4.flipClipY(flippedOrtho, ortho);

    const a = [-0.5, -0.5, 0];
    const b = [0.5, -0.5, 0];
    const c = [0, 0.5, 0];

    const before = signedArea(ortho, a, b, c);
    const after = signedArea(flippedOrtho, a, b, c);
    expect(before).toBeGreaterThan(0); // 逆时针 = 正面
    expect(after).toBeLessThan(0); // 顺时针 = 背面
    expect(after).toBeCloseTo(-before, 6); // 面积大小不变，只是符号反了

    // 透视投影（真正会用到的那种）同样成立。
    const perspective = mat4.create();
    mat4.perspective(perspective, Math.PI / 3, 1, 0.1, 100);
    const flippedPerspective = mat4.create();
    mat4.flipClipY(flippedPerspective, perspective);
    const pa = [-0.5, -0.5, -3];
    const pb = [0.5, -0.5, -3];
    const pc = [0, 0.5, -3];
    const perspectiveBefore = signedArea(perspective, pa, pb, pc);
    const perspectiveAfter = signedArea(flippedPerspective, pa, pb, pc);
    expect(perspectiveBefore).toBeGreaterThan(0);
    expect(perspectiveAfter).toBeLessThan(0);
    expect(Math.abs(perspectiveAfter)).toBeCloseTo(Math.abs(perspectiveBefore), 6);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 二、RenderTarget.rowOrder：两个后端各自的原生行序                                                    */
/* ------------------------------------------------------------------------------------------------ */

describe('RenderTarget.rowOrder：如实暴露后端原生行序', () => {
  it('WebGL2 的渲染目标自下而上（bottomUp）', () => {
    const fake = createFakeWebGL2();
    const device = new WebGL2Device({
      gl: fake.gl,
      canvas: createFakeCanvas().canvas,
      descriptor: { label: 'row-order-test' },
      adapterLimits: buildDeviceLimits(fake.gl),
      adapterFeatures: new Set<string>(),
    });

    const target = device.createRenderTarget({ label: 'offscreen', width: 8, height: 4 });
    expect(target.rowOrder).toBe('bottomUp');
    expect(target.rowOrder).toBe(RowOrder.BottomUp);

    device.dispose();
  });

  it('WebGPU 的附件纹素原点在左上（topLeft）', () => {
    const device = createMockGpuDevice();
    const target = device.createRenderTarget({ label: 'offscreen', width: 8, height: 4 });
    expect(target.rowOrder).toBe('topLeft');
    expect(target.rowOrder).toBe(RowOrder.TopLeft);
    device.dispose();
  });

  it('尺寸变化（resize）不会改变原生行序', () => {
    const fake = createFakeWebGL2();
    const device = new WebGL2Device({
      gl: fake.gl,
      canvas: createFakeCanvas().canvas,
      descriptor: { label: 'row-order-resize' },
      adapterLimits: buildDeviceLimits(fake.gl),
      adapterFeatures: new Set<string>(),
    });
    const target = device.createRenderTarget({ label: 'offscreen', width: 8, height: 4 });
    target.resize(16, 16);
    expect(target.rowOrder).toBe('bottomUp');
    device.dispose();
  });
});

/** 只够 `createRenderTarget` 用的假原生 WebGPU 设备。 */
function createMockGpuDevice(): WebGPUDevice {
  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    onuncapturederror: null,
    limits: undefined,
    createTexture: (descriptor: { label?: string; size: { width: number; height: number } }) => ({
      label: descriptor.label ?? 'texture',
      width: descriptor.size.width,
      height: descriptor.size.height,
      depthOrArrayLayers: 1,
      mipLevelCount: 1,
      sampleCount: 1,
      dimension: '2d',
      format: 'rgba8unorm',
      usage: 0,
      createView: () => ({ label: 'view', destroy: () => {} }),
      destroy: () => {},
    }),
    destroy: () => {},
  } as unknown as GPUDevice;

  return new WebGPUDevice(native, {
    descriptor: { label: 'mock-device', defaultSampleCount: 1, requiredFeatures: [] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    adapterFeatures: new Set<string>(),
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* 三、gfx：Renderer 自动统一（只翻纹理附件，画布不翻，切回时恢复）                                        */
/* ------------------------------------------------------------------------------------------------ */

/** 一次 `queue.writeBuffer` 的记录（`floats` 是拷贝，arena 之后会复用同一段内存）。 */
interface RecordedWrite {
  readonly bufferLabel: string;
  readonly offset: number;
  readonly floats: Float32Array;
}

/** 假的 pass encoder：记下每次 draw 用的是哪条管线。 */
interface FakePass {
  readonly draws: RenderPipeline[];
  readonly label: string;
  setPipeline(pipeline: RenderPipeline): void;
  setBindGroup(index: number, group: unknown, offsets?: readonly number[]): void;
  setVertexBuffer(slot: number, buffer: unknown, offset?: number, size?: number): void;
  setIndexBuffer(buffer: unknown, format: unknown, offset?: number, size?: number): void;
  draw(descriptor: { vertexCount: number }): void;
  drawIndexed(descriptor: { indexCount: number }): void;
  end(): void;
}

/** 建一个只记账的假 pass：`lastPipeline` 只在这个闭包里，避免 `this` 的类型麻烦。 */
function createFakePass(label: string): FakePass {
  let lastPipeline: RenderPipeline | null = null;
  const pass: FakePass = {
    label,
    draws: [],
    setPipeline(pipeline: RenderPipeline) {
      lastPipeline = pipeline;
    },
    setBindGroup: () => {},
    setVertexBuffer: () => {},
    setIndexBuffer: () => {},
    draw() {
      if (lastPipeline) pass.draws.push(lastPipeline);
    },
    drawIndexed() {
      if (lastPipeline) pass.draws.push(lastPipeline);
    },
    end: () => {},
  };
  return pass;
}

/**
 * 一台「够真实 Renderer 跑完一次 draw」的假 WebGL2 设备。
 *
 * 它记录的是**渲染器真正交给后端的东西**：`createRenderPipeline` 的完整描述、
 * `queue.writeBuffer` 写进去的字节、以及每次 draw 用的管线 —— 这正是「行序有没有被翻」
 * 与「绕序有没有跟着翻」的落地形态。
 */
interface FakeGfxDevice {
  readonly device: Device;
  readonly pipelines: RenderPipelineDescriptor[];
  readonly writes: RecordedWrite[];
  readonly passes: FakePass[];
  /** 建过几条管线（`pipelineFlipped` 是按需创建的，这个数字直接说明它有没有被建）。 */
  pipelineCount(): number;
  /** 第 `index` 次 pass 里第 `drawIndex` 次 draw 用的管线（越界返回 null）。 */
  pipelineOf(passIndex: number, drawIndex: number): RenderPipeline | null;
}

function createFakeGfxDevice(): FakeGfxDevice {
  const pipelines: RenderPipelineDescriptor[] = [];
  const writes: RecordedWrite[] = [];
  const passes: FakePass[] = [];
  let nextId = 0;

  const makeBuffer = (label: string, size = 256): Record<string, unknown> => ({
    label,
    size,
    usage: 0,
    id: (nextId += 1),
    destroy: () => {},
    dispose: () => {},
  });

  const device = {
    backend: 'webgl2',
    label: 'fake-gfx-gl-device',
    limits: { minUniformBufferOffsetAlignment: 256 },
    createBuffer: (descriptor: { label?: string; size?: number }) =>
      makeBuffer(descriptor.label ?? 'buffer', descriptor.size ?? 256),
    createShaderModule: (descriptor: { label?: string }) => ({
      label: descriptor.label ?? 'shader',
      source: {},
      defines: {},
      disposed: false,
      dispose: () => {},
    }),
    createBindGroupLayout: (descriptor: { label?: string; entries: unknown[] }) => ({
      label: descriptor.label ?? 'layout',
      entries: descriptor.entries,
      // WebGL2 的渲染通道会按 group 序号取布局；gfx 只按对象身份缓存，所以给个序号即可。
      group: 0,
      sortedEntries: descriptor.entries,
      native: null,
      disposed: false,
      dispose: () => {},
    }),
    createBindGroup: (descriptor: { label?: string; layout: unknown; entries: unknown[] }) => ({
      label: descriptor.label ?? 'bindGroup',
      layout: descriptor.layout,
      entries: descriptor.entries,
      entry: (binding: number) =>
        (descriptor.entries as { binding: number }[]).find((entry) => entry.binding === binding),
      native: null,
      disposed: false,
      dispose: () => {},
    }),
    createPipelineLayout: (descriptor: { label?: string; bindGroupLayouts: unknown[] }) => ({
      label: descriptor.label ?? 'pipelineLayout',
      bindGroupLayouts: descriptor.bindGroupLayouts,
      native: null,
      isAuto: false,
      disposed: false,
      dispose: () => {},
    }),
    createRenderPipeline: (descriptor: RenderPipelineDescriptor): RenderPipeline => {
      pipelines.push(descriptor);
      return {
        label: descriptor.label ?? 'pipeline',
        descriptor,
        layout: descriptor.layout ?? 'auto',
        vertexLayouts: null,
        compiled: true,
        native: null,
        resolve: () => null,
        dispose: () => {},
      } as unknown as RenderPipeline;
    },
    createCommandEncoder: () => ({
      label: 'encoder',
      beginRenderPass: (descriptor: { label?: string }) => {
        const pass = createFakePass(descriptor.label ?? 'pass');
        passes.push(pass);
        return pass;
      },
      finish: () => ({}),
    }),
    queue: {
      writeBuffer: (buffer: { label?: string }, offset: number, data: ArrayBufferView) => {
        // uniform arena 写的是 `UniformValues.bytes`（一个 Uint8Array 视图），顶点数据是
        // Float32Array —— 统一按**字节**拷一份再当 float 解释，两种来源都能读。
        const view = data as ArrayBufferView;
        const copied = new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength).slice();
        writes.push({
          bufferLabel: buffer?.label ?? '',
          offset,
          floats: new Float32Array(copied.buffer),
        });
      },
      submit: () => {},
    },
    onError: () => {},
    dispose: () => {},
  } as unknown as Device;

  return {
    device,
    pipelines,
    writes,
    passes,
    pipelineCount: () => pipelines.length,
    pipelineOf: (passIndex, drawIndex) => passes[passIndex]?.draws[drawIndex] ?? null,
  };
}

/** 假 canvas context：附件列表由测试给，于是「附件是不是纹理」这件事可以被精确控制。 */
function createFakeContext(device: Device, format: TextureFormat): CanvasContext {
  return {
    canvas: createFakeCanvas().canvas,
    width: 8,
    height: 8,
    pixelRatio: 1,
    format,
    configured: true,
    device,
    configure: () => {},
    unconfigure: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    resize: () => false,
    getCurrentFrameTarget: () => {
      throw new Error('[gpu-device-api] test: 假的 canvas context 没有帧目标。');
    },
    createPassDescriptor: (): CanvasPassDescriptor => ({
      colorAttachments: [{ view: fakeView(format), loadOp: 'clear', storeOp: 'store' }],
      depthStencilAttachment: null,
    }),
    dispose: () => {},
  } as unknown as CanvasContext;
}

/** 一张「虚拟」纹理的附件 view（fake 设备只需要它的 `texture.format` / `sampleCount`）。 */
function fakeView(format: TextureFormat, sampleCount = 1): ColorAttachment['view'] {
  return {
    label: `fake:${format}`,
    texture: { format, sampleCount },
    descriptor: {
      format,
      dimension: '2d',
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
      aspect: 'all',
    },
    native: null,
    disposed: false,
    dispose: () => {},
  } as unknown as ColorAttachment['view'];
}

/** 只实现 `Renderer` 会碰的那几个成员的假离屏目标（`rowOrder` 由测试指定）。 */
function fakeTarget(rowOrder: 'topLeft' | 'bottomUp'): RenderTarget {
  return {
    label: `fake-target:${rowOrder}`,
    width: 8,
    height: 8,
    colorFormats: ['rgba8unorm'],
    colorFormat: 'rgba8unorm',
    depthFormat: null,
    sampleCount: 1,
    mipLevelCount: 1,
    rowOrder,
    colors: [],
    depth: null,
    colorAttachments: [],
    depthStencilAttachment: null,
    resize: () => false,
    createPassDescriptor: () => ({
      colorAttachments: [{ view: fakeView('rgba8unorm'), loadOp: 'clear', storeOp: 'store' }],
      depthStencilAttachment: null,
    }),
    destroy: () => {},
    dispose: () => {},
  } as unknown as RenderTarget;
}

async function createRenderer(input: {
  backend: BackendKind;
  device: Device;
  context: CanvasContext;
  rowOrder?: 'unified' | 'backend';
}): Promise<Renderer> {
  vi.mocked(createDeviceWithAdapter).mockResolvedValue({
    device: input.device,
    adapter: { backend: input.backend },
    backend: input.backend,
    probes: [],
    context: input.context,
  } as unknown as CreatedDevice);
  return Renderer.create({
    canvas: createFakeCanvas().canvas,
    backend: input.backend,
    antialias: false,
    culling: false,
    ...(input.rowOrder ? { rowOrder: input.rowOrder } : {}),
  });
}

/** 带相机 uniform 的最小材质：`projectionView` / `model` 都是库提供的字段。 */
function defineCameraMaterial(name: string): Material {
  return defineMaterial({
    name,
    attributes: { position: 'float32x3' },
    uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f' },
    glsl: {
      vs: 'void main() { gl_Position = u.projectionView * u.model * vec4(position, 1.0); }',
      fs: 'void main() { fragColor = vec4(1.0); }',
    },
    wgsl:
      '@vertex fn vsMain(@location(0) position: vec3f) -> @builtin(position) vec4f ' +
      '{ return u.projectionView * u.model * vec4f(position, 1.0); }\n' +
      '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
  });
}

function triangleGeometry(renderer: Renderer): ReturnType<Renderer['createGeometry']> {
  return renderer.createGeometry({
    label: 'triangle',
    attributes: {
      position: { data: Float32Array.from([-1, -1, 0, 1, -1, 0, 0, 1, 0]), format: 'float32x3' },
    },
  });
}

/**
 * 取第 `index` 次 **uniform arena** 写入里的 `projectionView`（布局的前 16 个 float）。
 *
 * 只认 arena 的写入：`Geometry.create` 也会用 `queue.writeBuffer` 上传顶点数据，
 * 那些不是 uniform（buffer 的 label 前缀不同）。
 */
function projectionViewOf(writes: readonly RecordedWrite[], index: number): Float32Array {
  const uniforms = writes.filter((write) => write.bufferLabel.includes('uniformArena'));
  const write = uniforms[index];
  if (!write) throw new Error(`[gpu-device-api] test: 第 ${index} 次 uniform 写入不存在。`);
  return write.floats.slice(0, 16);
}

function expectMatrixClose(actual: ArrayLike<number>, expected: ArrayLike<number>, digits = 5): void {
  for (let index = 0; index < 16; index++) {
    expect(actual[index]!).toBeCloseTo(expected[index]!, digits);
  }
}

const FRONT_FACE_OF = (pipeline: RenderPipeline | null): string | undefined =>
  (pipeline?.descriptor.primitive?.frontFace ?? 'ccw') as string;

describe('gfx：渲染进纹理时自动统一行序（WebGL2）', () => {
  beforeEach(() => {
    vi.mocked(createDeviceWithAdapter).mockReset();
    vi.mocked(prewarmWebGL2RenderPipeline).mockReset();
  });

  it('离屏（bottomUp）通道：翻投影 + 翻 frontFace；同一帧切回画布通道后两者都恢复，相机矩阵始终没被改', async () => {
    const fake = createFakeGfxDevice();
    const renderer = await createRenderer({
      backend: 'webgl2',
      device: fake.device,
      context: createFakeContext(fake.device, 'rgba8unorm'),
    });
    const camera = renderer.camera;
    expect(camera).toBeNull();

    const { PerspectiveCamera } = await import('../src/gfx/Camera.js');
    const perspective = new PerspectiveCamera({ position: [0, 0, 5], fov: 45 });
    renderer.setCamera(perspective);
    const material = renderer.createMaterial(defineCameraMaterial('lit'));
    const geometry = triangleGeometry(renderer);

    /*
     * 别名（aliasing）防线：翻投影**必须**写进渲染器自己的 scratch，不能就地改相机的那两份矩阵。
     * `projectionMatrix` / `projectionViewMatrix` 是相机内部缓冲**本身**，就地改会让同一帧里
     * 紧接着的 canvas 通道也拿到翻转后的矩阵（而且相机的缓存被永久改坏）。这里在**帧前**拷快照，
     * 帧中、帧后各比对一次。
     */
    const cameraProjectionBefore = Array.from(perspective.projectionMatrix);
    const cameraProjectionViewBefore = Array.from(perspective.projectionViewMatrix);

    // 离屏目标：WebGL2 就是 `bottomUp` —— gfx 应当自动翻投影并翻转绕序。
    renderer.beginFrame({ target: fakeTarget('bottomUp') });
    renderer.draw(geometry, { material });
    // 帧中（离屏 pass 已经画完）：相机的矩阵必须还是原样。
    expect(Array.from(perspective.projectionMatrix)).toEqual(cameraProjectionBefore);
    expect(Array.from(perspective.projectionViewMatrix)).toEqual(cameraProjectionViewBefore);
    // 同一个通道里连续两次 draw：第二次不该再建管线（缓存命中）。
    renderer.draw(geometry, { material });
    // 切回画布通道（附件不是纹理）：这里开始必须不翻。
    renderer.beginPass();
    renderer.draw(geometry, { material });
    expect(Array.from(perspective.projectionMatrix)).toEqual(cameraProjectionBefore);
    expect(Array.from(perspective.projectionViewMatrix)).toEqual(cameraProjectionViewBefore);
    renderer.endFrame();
    // 帧后依然原样：翻转从来没有落到相机自己的缓冲上。
    expect(Array.from(perspective.projectionMatrix)).toEqual(cameraProjectionBefore);
    expect(Array.from(perspective.projectionViewMatrix)).toEqual(cameraProjectionViewBefore);

    const offscreenPipeline = fake.pipelineOf(0, 0);
    const canvasPipeline = fake.pipelineOf(1, 0);
    expect(fake.pipelineOf(0, 1)).toBe(offscreenPipeline);

    // 绕序：离屏那条是 cw（镜像反转绕序），画布那条回到材质声明的 ccw。
    expect(FRONT_FACE_OF(offscreenPipeline)).toBe('cw');
    expect(FRONT_FACE_OF(canvasPipeline)).toBe('ccw');
    // 两条管线是两个对象（不是同一条被临时改状态），材质也没被污染。
    expect(offscreenPipeline).not.toBe(canvasPipeline);
    expect(fake.pipelineCount()).toBe(2);

    // 投影：离屏那一份是翻过的，画布那一份是相机原样。
    const expectedFlipped = mat4.create();
    mat4.flipClipY(expectedFlipped, perspective.projectionViewMatrix);
    const offscreenWrite = projectionViewOf(fake.writes, 0);
    const canvasWrite = projectionViewOf(fake.writes, 2);
    expectMatrixClose(offscreenWrite, expectedFlipped);
    expectMatrixClose(canvasWrite, perspective.projectionViewMatrix);
    // 「翻过」这件事是真的发生了：两份矩阵不相等。
    expect(Array.from(offscreenWrite)).not.toEqual(Array.from(canvasWrite));

    // 画布那一份逐字节等于帧前的快照（相机的矩阵没有被那次翻转污染过）。
    expectMatrixClose(canvasWrite, cameraProjectionViewBefore, 6);

    renderer.destroy();
  });

  it('顶左（topLeft）的离屏目标不翻 —— 行序判定读的是 RenderTarget.rowOrder，不是后端名', async () => {
    const fake = createFakeGfxDevice();
    const renderer = await createRenderer({
      backend: 'webgl2',
      device: fake.device,
      context: createFakeContext(fake.device, 'rgba8unorm'),
    });
    const { PerspectiveCamera } = await import('../src/gfx/Camera.js');
    const perspective = new PerspectiveCamera();
    renderer.setCamera(perspective);
    const material = renderer.createMaterial(defineCameraMaterial('lit'));
    const geometry = triangleGeometry(renderer);

    renderer.beginFrame({ target: fakeTarget('topLeft') });
    renderer.draw(geometry, { material });
    renderer.endFrame();

    expect(FRONT_FACE_OF(fake.pipelineOf(0, 0))).toBe('ccw');
    expectMatrixClose(projectionViewOf(fake.writes, 0), perspective.projectionViewMatrix);
    // 只有一条管线：不需要绕序翻转版。
    expect(fake.pipelineCount()).toBe(1);

    renderer.destroy();
  });

  it("rowOrder: 'backend' 时离屏也不翻（开关生效）", async () => {
    const fake = createFakeGfxDevice();
    const renderer = await createRenderer({
      backend: 'webgl2',
      device: fake.device,
      context: createFakeContext(fake.device, 'rgba8unorm'),
      rowOrder: 'backend',
    });
    expect(renderer.rowOrder).toBe('backend');
    const { PerspectiveCamera } = await import('../src/gfx/Camera.js');
    const perspective = new PerspectiveCamera();
    renderer.setCamera(perspective);
    const material = renderer.createMaterial(defineCameraMaterial('lit'));
    const geometry = triangleGeometry(renderer);

    renderer.beginFrame({ target: fakeTarget('bottomUp') });
    renderer.draw(geometry, { material });
    renderer.endFrame();

    expect(FRONT_FACE_OF(fake.pipelineOf(0, 0))).toBe('ccw');
    expectMatrixClose(projectionViewOf(fake.writes, 0), perspective.projectionViewMatrix);
    expect(fake.pipelineCount()).toBe(1);

    renderer.destroy();
  });

  it('WebGPU 后端：离屏目标本来就是 topLeft，一条管线、投影不动', async () => {
    const fake = createFakeGfxDevice();
    const webgpuDevice = { ...fake.device, backend: 'webgpu' } as unknown as Device;
    const renderer = await createRenderer({
      backend: 'webgpu',
      device: webgpuDevice,
      context: createFakeContext(webgpuDevice, 'bgra8unorm'),
    });
    const { PerspectiveCamera } = await import('../src/gfx/Camera.js');
    const perspective = new PerspectiveCamera();
    renderer.setCamera(perspective);
    const material = renderer.createMaterial(defineCameraMaterial('lit'));
    const geometry = triangleGeometry(renderer);

    renderer.beginFrame({ target: fakeTarget('topLeft') });
    renderer.draw(geometry, { material });
    renderer.endFrame();

    expect(FRONT_FACE_OF(fake.pipelineOf(0, 0))).toBe('ccw');
    expectMatrixClose(projectionViewOf(fake.writes, 0), perspective.projectionViewMatrix);
    expect(fake.pipelineCount()).toBe(1);

    renderer.destroy();
  });

  it('prewarm({ target }) 预热的就是绘制时会用的那一条（含绕序翻转）', async () => {
    const fake = createFakeGfxDevice();
    const renderer = await createRenderer({
      backend: 'webgl2',
      device: fake.device,
      context: createFakeContext(fake.device, 'rgba8unorm'),
    });
    const material = renderer.createMaterial(defineCameraMaterial('warm'));
    const sentinel = {
      label: 'warm:pipeline',
      descriptor: { vertex: { module: {} as never } },
      layout: 'auto',
      vertexLayouts: null,
      compiled: true,
      native: null,
      resolve: () => null,
      dispose: () => {},
    } as unknown as RenderPipeline;
    vi.mocked(prewarmWebGL2RenderPipeline).mockResolvedValue({
      label: 'warm:pipeline',
      backend: 'webgl2',
      ok: true,
      mode: 'async',
      reason: null,
      durationMs: 1,
      info: { label: 'warm:pipeline', backend: 'webgl2', messages: [], rawLogs: [], hasErrors: false },
      pipeline: sentinel,
    });

    // 画布通道先预热一条（不翻），离屏通道再预热一条（翻）—— 两者互不覆盖。
    const canvasReport = await renderer.prewarm({ materials: [material] });
    expect(canvasReport.prewarmed).toBe(1);
    expect(vi.mocked(prewarmWebGL2RenderPipeline).mock.calls[0]![1].primitive?.frontFace).toBe('ccw');

    const offscreenReport = await renderer.prewarm({ materials: [material], target: fakeTarget('bottomUp') });
    expect(offscreenReport.prewarmed).toBe(1);
    expect(vi.mocked(prewarmWebGL2RenderPipeline).mock.calls[1]![1].primitive?.frontFace).toBe('cw');

    // 再热一次同一条：跳过（不重复编译）。
    const again = await renderer.prewarm({ materials: [material], target: fakeTarget('bottomUp') });
    expect(again.skipped).toBe(1);
    expect(vi.mocked(prewarmWebGL2RenderPipeline)).toHaveBeenCalledTimes(2);

    // 预热出来的管线被交给绘制路径：画进离屏目标时用的就是那条（不再自己建）。
    const { PerspectiveCamera } = await import('../src/gfx/Camera.js');
    renderer.setCamera(new PerspectiveCamera());
    const geometry = triangleGeometry(renderer);
    renderer.beginFrame({ target: fakeTarget('bottomUp') });
    renderer.draw(geometry, { material });
    renderer.endFrame();

    expect(fake.pipelineOf(0, 0)).toBe(sentinel);
    // 没有任何一条管线是绘制时新建的（预热确实省掉了那一步）。
    expect(fake.pipelineCount()).toBe(0);

    renderer.destroy();
  });
});
