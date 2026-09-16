/**
 * 第四档优化批次 2b 的**改前基线**测量（#31 / #33 / #35）。
 *
 * 这个文件只做测量：里面的数字是 `src/` 被改动**之前**的实测值，先单独提交一次（与 2a 的
 * `webgl2-opt-2a-baseline.test.ts`、2c 的测量测试同一做法），改动之后用同一段测量代码对照。
 * 修复完成后它会被 `test/webgl2-opt-2b.test.ts` 取代（后者带上改后的数字与安全断言）。
 *
 * 三项都只用 **node 侧的假 GL** 取证（调用次数、缓存条目数、构造次数都是纯记账），
 * 不需要真实 GL 上下文，也不需要浏览器。
 *
 * | 编号 | 测量对象 | 改前的量 |
 * | --- | --- | --- |
 * | #31 | 每 draw 的 `setBlend` 去重键 | 每次都拼一条 `1:c:s:o:...` 模板字符串（耗时对照） |
 * | #33 | `variant.vertexArrays` 的条目数 | 只 `set` 不淘汰，条目数随不同顶点绑定线性增长 |
 * | #35 | `beginRenderPass` 建立期的零碎分配 | `JSON.stringify(clearValue)` 与每个附件一块 `Float32Array` |
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2RenderPipeline } from '../src/webgl2/pipeline/WebGL2RenderPipeline.js';
import { WebGL2RenderPassEncoder } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import { FramebufferCache } from '../src/webgl2/render/framebuffer-cache.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { createCompilationInfo } from '../src/core/pipeline/CompilationInfo.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';
import type { FakeWebGL2 } from './webgl2-fake-gl.js';
import type { CompiledProgram } from '../src/webgl2/pipeline/ProgramCache.js';
import type { VertexBufferLayout } from '../src/core/pipeline/VertexLayout.js';
import type { ShaderModule } from '../src/core/resources/ShaderModule.js';
import type { WebGL2RenderTarget } from '../src/webgl2/render/WebGL2RenderTarget.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import type { WebGL2TextureView } from '../src/webgl2/resources/WebGL2TextureView.js';
import type { WebGL2Buffer } from '../src/webgl2/resources/WebGL2Buffer.js';

/* GL 枚举（写死数值，与真实上下文一致）。 */
const GL = {
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  BLEND: 0x0be2,
  COLOR: 0x1800,
  DEPTH: 0x1801,
  ONE: 1,
  ZERO: 0,
  SRC_ALPHA: 0x0302,
  ONE_MINUS_SRC_ALPHA: 0x0303,
  FUNC_ADD: 0x8006,
} as const;

function log(line: string): void {
  // eslint-disable-next-line no-console
  console.log(line);
}

/* ------------------------------------------------------------------------------------------------ */
/* 一台最小假 GL：只实现 #31 / #33 走到的入口，并模拟「删除当前绑定的 VAO 会解绑」                    */
/* ------------------------------------------------------------------------------------------------ */

interface MiniGl {
  readonly gl: WebGL2RenderingContext;
  readonly calls: string[];
  readonly createdVertexArrays: object[];
  readonly deletedVertexArrays: object[];
  /** 真实 GL 当前的 VAO 绑定（`deleteVertexArray` 删除当前绑定的那个会把它解绑）。 */
  readonly boundVertexArray: object | null;
}

function createMiniGl(): MiniGl {
  const calls: string[] = [];
  const createdVertexArrays: object[] = [];
  const deletedVertexArrays: object[] = [];
  const names = new WeakMap<object, string>();
  const binding = { vertexArray: null as object | null };
  let nextId = 0;

  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (names.get(value) ?? '?') : String(value);

  const gl = {
    ...GL,
    createVertexArray: () => {
      const vertexArray: object = {};
      names.set(vertexArray, `vao${(nextId += 1)}`);
      createdVertexArrays.push(vertexArray);
      return vertexArray;
    },
    deleteVertexArray: (vertexArray: object) => {
      deletedVertexArrays.push(vertexArray);
      // GLES 3.0：删除当前绑定的 VAO 会把该绑定点复位成「没有 VAO」（默认 VAO 生效）。
      if (binding.vertexArray === vertexArray) binding.vertexArray = null;
      calls.push(`deleteVertexArray:${nameOf(vertexArray)}`);
    },
    bindVertexArray: (vertexArray: object | null) => {
      binding.vertexArray = vertexArray;
      calls.push(`bindVertexArray:${nameOf(vertexArray)}`);
    },
    bindBuffer: (target: number, buffer: unknown) => calls.push(`bindBuffer:${target}:${nameOf(buffer)}`),
    enableVertexAttribArray: (location: number) => calls.push(`enableVertexAttribArray:${location}`),
    vertexAttribPointer: (location: number) => calls.push(`vertexAttribPointer:${location}`),
    vertexAttribIPointer: (location: number) => calls.push(`vertexAttribIPointer:${location}`),
    vertexAttribDivisor: (location: number, divisor: number) =>
      calls.push(`vertexAttribDivisor:${location}:${divisor}`),
    enable: (capability: number) => calls.push(`enable:${capability}`),
    disable: (capability: number) => calls.push(`disable:${capability}`),
    blendFuncSeparate: () => calls.push('blendFuncSeparate'),
    blendEquationSeparate: () => calls.push('blendEquationSeparate'),
    getError: () => 0,
  } as unknown as WebGL2RenderingContext;

  return {
    gl,
    calls,
    createdVertexArrays,
    deletedVertexArrays,
    get boundVertexArray() {
      return binding.vertexArray;
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* #31：每次 setBlend 都拼签名字符串                                                                  */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 同一份状态的重复 `setBlend`（真实场景里这是**绝大多数** draw 的情形：同一条管线连续画很多次）。
 * 改前每次都要拼出 `1:1:0:32774:1:0:32774` 这条字符串再比较。
 */
describe('#31 改前基线：混合状态去重键是每次现拼的字符串', () => {
  const iterations = 1_000_000;

  function measureSameState(): number {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    state.setBlend(true, GL.ONE, GL.ZERO, GL.FUNC_ADD, GL.ONE, GL.ZERO, GL.FUNC_ADD);
    mini.calls.length = 0;

    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      state.setBlend(true, GL.ONE, GL.ZERO, GL.FUNC_ADD, GL.ONE, GL.ZERO, GL.FUNC_ADD);
    }
    const elapsed = performance.now() - started;
    // 状态完全没变 → 一次 GL 调用都不该发生（这既是正确性也是本次测量的前提）。
    expect(mini.calls).toEqual([]);
    return elapsed;
  }

  it('100 万次同值 setBlend 的耗时（同值 = 只比较、不下发）', () => {
    measureSameState(); // 预热
    const samples = [measureSameState(), measureSameState(), measureSameState()];
    const best = Math.min(...samples);
    log(
      `[#31 改前] ${iterations} 次同值 setBlend：` +
        samples.map((value) => `${value.toFixed(1)}ms`).join(' / ') +
        `，最好 ${best.toFixed(1)}ms（${((best * 1e6) / iterations).toFixed(1)} ns/次，每次都要拼 7 段模板字符串）`,
    );
    expect(best).toBeGreaterThan(0);
  });

  it('状态来回切换时每次都下发（去重的另一边：变了必须重下发）', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    state.setBlend(true, GL.ONE, GL.ZERO, GL.FUNC_ADD, GL.ONE, GL.ZERO, GL.FUNC_ADD);
    mini.calls.length = 0;
    state.setBlend(true, GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.FUNC_ADD, GL.ONE, GL.ZERO, GL.FUNC_ADD);
    log(`[#31 改前] 改一个混合因子后的下发 = ${mini.calls.join(' | ')}`);
    expect(mini.calls).toEqual([`enable:${GL.BLEND}`, 'blendFuncSeparate', 'blendEquationSeparate']);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* #33：VAO 缓存没有上限                                                                             */
/* ------------------------------------------------------------------------------------------------ */

function compiledProgramStub(layouts: readonly VertexBufferLayout[]): CompiledProgram {
  return {
    program: {} as WebGLProgram,
    reflection: {
      attributes: layouts.flatMap((layout) =>
        layout.attributes.map((attribute) => ({
          name: `a${attribute.shaderLocation}`,
          location: attribute.shaderLocation,
          glType: 0x8b51,
          size: 3,
        })),
      ),
      uniforms: [],
      uniformBlocks: [],
    },
    blockBindings: new Map<string, number>(),
    samplerLocations: new Map<string, WebGLUniformLocation>(),
    optimizedOutBlocks: [],
    label: 'stub-program',
    boundPlanKey: null,
    linkMode: 'sync',
    linkReason: null,
    compilationInfo: createCompilationInfo({ label: 'stub-program', backend: 'webgl2' }),
  };
}

const TEST_LAYOUT: VertexBufferLayout = {
  arrayStride: 12,
  attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
};

function createTestPipeline(gl: WebGL2RenderingContext, state: GlStateCache): WebGL2RenderPipeline {
  const layouts: readonly VertexBufferLayout[] = [TEST_LAYOUT];
  return new WebGL2RenderPipeline(
    {
      label: 'stub-pipeline',
      vertex: { module: {} as ShaderModule, buffers: layouts },
      fragment: { module: {} as ShaderModule },
    },
    compiledProgramStub(layouts),
    'auto',
    { gl, state, limits: { maxVertexAttributes: 16, maxVertexBufferArrayStride: 2048 } },
  );
}

/** 造一个只带 `id` / `native` 的顶点缓冲替身（键里只用这两个）。 */
function fakeVertexBuffer(id: number, native: object): WebGL2Buffer {
  return { id, native } as unknown as WebGL2Buffer;
}

describe('#33 改前基线：VAO 缓存的条目数只增不减', () => {
  it('连续 80 组不同顶点绑定：条目数线性增长到 80，一次 deleteVertexArray 都没有', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state);
    const variant = pipeline.resolveVariant();
    const checkpoints = [1, 2, 3, 4, 8, 16, 64, 65, 80];
    const curve: string[] = [];

    for (let index = 1; index <= 80; index += 1) {
      const buffer = fakeVertexBuffer(index, { buffer: index });
      pipeline.acquireVertexArray(variant, [{ buffer, offset: 0, size: 12 }], null);
      if (checkpoints.includes(index)) curve.push(`${index}->${variant.vertexArrays.size}`);
    }

    log(
      `[#33 改前] 80 组不同顶点绑定的条目数曲线（ acquire 次数->size ）：${curve.join(', ')}；` +
        `共 createVertexArray=${mini.createdVertexArrays.length}、deleteVertexArray=${mini.deletedVertexArrays.length}`,
    );
    expect(variant.vertexArrays.size).toBe(80);
    expect(mini.createdVertexArrays).toHaveLength(80);
    expect(mini.deletedVertexArrays).toHaveLength(0);
    // 改前没有任何淘汰，所以「删除当前绑定 VAO」这个隐患根本不会发生 —— 改后必须补上论证。
    expect(mini.boundVertexArray).toBe(state.currentVertexArray);
    pipeline.dispose();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* #35：pass 建立期的零碎分配                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** 统计 `action()` 期间 `Float32Array` 的构造次数（与 2a 统计零数组的做法一致）。 */
function countFloat32Allocations<T>(action: () => T): { result: T; constructed: number } {
  let constructed = 0;
  const Original = globalThis.Float32Array;
  class CountingFloat32Array extends Original {
    constructor(source?: number | ArrayLike<number>) {
      super(source as unknown as number);
      constructed += 1;
    }
  }
  (globalThis as unknown as { Float32Array: unknown }).Float32Array = CountingFloat32Array;
  try {
    return { result: action(), constructed };
  } finally {
    (globalThis as unknown as { Float32Array: unknown }).Float32Array = Original;
  }
}

/** 统计 `action()` 期间 `JSON.stringify` 的调用次数。 */
function countJsonStringify<T>(action: () => T): { result: T; calls: number } {
  let calls = 0;
  const original = JSON.stringify;
  const patched = (...args: unknown[]): string | undefined => {
    calls += 1;
    return (original as unknown as (...inner: unknown[]) => string | undefined)(...args);
  };
  (JSON as unknown as { stringify: unknown }).stringify = patched;
  try {
    return { result: action(), calls };
  } finally {
    (JSON as unknown as { stringify: unknown }).stringify = original;
  }
}

function createDevice(fake: FakeWebGL2): WebGL2Device {
  return new WebGL2Device({
    gl: fake.gl,
    canvas: createFakeCanvas().canvas,
    descriptor: { label: 'opt-2b' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
}

function createPassOptions(fake: FakeWebGL2, state: GlStateCache): WebGL2RenderPassOptions {
  return {
    gl: fake.gl,
    state,
    framebuffers: new FramebufferCache(fake.gl),
    getDefaultSize: () => ({ width: 8, height: 8 }),
  };
}

function asWebGL2Target(value: RenderTarget): WebGL2RenderTarget {
  return value as unknown as WebGL2RenderTarget;
}

describe('#35 改前基线：beginRenderPass 建立期的分配', () => {
  it('多重采样目标 + 2 个颜色附件：2 次 JSON.stringify + 2 块 Float32Array', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const state = new GlStateCache(fake.gl);
    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'msaa',
        width: 8,
        height: 8,
        color: ['rgba8unorm', 'rgba8unorm'],
        depth: 'depth24plus',
        sampleCount: 4,
      }),
    );
    const options = createPassOptions(fake, state);
    const descriptor = {
      label: 'msaa-pass',
      colorAttachments: [
        { view: target.colorView(0) as WebGL2TextureView, clearValue: '#123456' },
        { view: target.colorView(1) as WebGL2TextureView, clearValue: '#123456' },
      ],
      depthStencilAttachment: { view: target.depthStencilView() as WebGL2TextureView, depthClearValue: 1 },
    };

    const floats = countFloat32Allocations(() => countJsonStringify(() => new WebGL2RenderPassEncoder(descriptor, options)));
    log(
      `[#35 改前] 多重采样 pass（2 颜色 + 深度）：JSON.stringify=${floats.result.calls} 次` +
        `（每个后续附件两侧各拼一次）、Float32Array=${floats.constructed} 块、` +
        `clearBufferfv=${countClearCalls(fake, 'clearBufferfv')}`,
    );
    expect(floats.result.calls).toBe(2);
    expect(floats.constructed).toBe(2);
    device.dispose();
  });

  it('原始附件路径 + 1 个颜色附件：2 块 Float32Array（每附件各一块）', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const state = new GlStateCache(fake.gl);
    const color = device.createTexture({
      label: 'color',
      format: 'rgba8unorm',
      size: { width: 8, height: 8 },
      usage: TextureUsage.RenderAttachment | TextureUsage.CopySrc,
    });
    const depth = device.createTexture({
      label: 'depth',
      format: 'depth24plus',
      size: { width: 8, height: 8 },
      usage: TextureUsage.RenderAttachment,
    });
    const options = createPassOptions(fake, state);
    const descriptor = {
      label: 'raw-pass',
      colorAttachments: [{ view: color.createView() as WebGL2TextureView, clearValue: 'red' }],
      depthStencilAttachment: { view: depth.createView() as WebGL2TextureView, depthClearValue: 0.5 },
    };

    const floats = countFloat32Allocations(() => new WebGL2RenderPassEncoder(descriptor, options));
    log(
      `[#35 改前] 原始附件 pass（1 颜色 + 深度）：Float32Array=${floats.constructed} 块、` +
        `JSON.stringify=0 次（这条路径本来就逐个附件各清一次）、` +
        `clearBufferfv=${countClearCalls(fake, 'clearBufferfv')}`,
    );
    expect(floats.constructed).toBe(2);
    device.dispose();
  });
});

function countClearCalls(fake: FakeWebGL2, prefix: string): number {
  return fake.calls.filter((call) => call.startsWith(prefix)).length;
}
