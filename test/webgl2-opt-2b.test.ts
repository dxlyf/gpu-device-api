/**
 * 第四档优化批次 2b 的证据测试（对应 #31 / #33 / #35）。
 *
 * 与 `test/webgl2-opt-2a.test.ts` 的写法一致：**改前的数字**由
 * `test/webgl2-opt-2b-baseline.test.ts`（先单独提交的 `9b2dd8e`，同一套测量代码）钉住，
 * 这里给出改后的数字，并把「优化不许改变语义」的部分写成断言（逐字段重下发、LRU 安全、
 * 清屏值与附件一一对应）。
 *
 * 全部证据都在 **node 侧假 GL** 上取得：调用次数、缓存条目数、构造次数都是纯记账，
 * 不占 GPU、不受并发干扰，也不需要浏览器。
 *
 * | 编号 | 改前 | 改后 |
 * | --- | --- | --- |
 * | #31 | 100 万次同值 `setBlend`：三次 best-of-3 为 364.0 / 381.3 / 426.5ms（每次拼 7 段模板字符串） | 5.3~6.5ms（7 次数字比较，零分配） |
 * | #33 | 80 组顶点绑定 → 条目数 1..80 线性增长、`deleteVertexArray=0` | limit=64 → 条目数封顶 64、删除 16 个 |
 * | #35 | 多重采样 pass：`JSON.stringify` 2 次 + `Float32Array` 2 块；原始附件 pass：`Float32Array` 2 块 | 都是 0 |
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
import type { GlBlendState } from '../src/webgl2/utils/glStateCache.js';
import type { CompiledProgram } from '../src/webgl2/pipeline/ProgramCache.js';
import type { VertexBufferLayout } from '../src/core/pipeline/VertexLayout.js';
import type { ShaderModule } from '../src/core/resources/ShaderModule.js';
import type { WebGL2RenderTarget } from '../src/webgl2/render/WebGL2RenderTarget.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import type { WebGL2TextureView } from '../src/webgl2/resources/WebGL2TextureView.js';
import type { WebGL2Buffer } from '../src/webgl2/resources/WebGL2Buffer.js';
import type { Color } from '../src/core/render/RenderTarget.js';

/* GL 枚举（写死数值，与真实上下文一致；共享假 GL 的枚举表里没有 COLOR / DEPTH，见 captureClearValues）。 */
const GL = {
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  BLEND: 0x0be2,
  ONE: 1,
  ZERO: 0,
  SRC_ALPHA: 0x0302,
  ONE_MINUS_SRC_ALPHA: 0x0303,
  FUNC_ADD: 0x8006,
  FUNC_SUBTRACT: 0x800a,
  FUNC_REVERSE_SUBTRACT: 0x800b,
} as const;

function log(line: string): void {
  // eslint-disable-next-line no-console
  console.log(line);
}

/* ------------------------------------------------------------------------------------------------ */
/* 一台最小假 GL：只实现 #31 / #33 走到的入口，并**模拟**「删除当前绑定的 VAO 会解绑」                */
/* ------------------------------------------------------------------------------------------------ */

interface MiniGl {
  readonly gl: WebGL2RenderingContext;
  readonly calls: string[];
  readonly createdVertexArrays: object[];
  readonly deletedVertexArrays: object[];
  /** 被删除时**正绑着**的 VAO 个数（真实 GL 会把绑定点复位；这里用来验证淘汰不会碰到它）。 */
  readonly deletedWhileBound: number;
  /** 真实 GL 当前的 VAO 绑定（`null` = 默认 VAO）。 */
  readonly boundVertexArray: object | null;
}

function createMiniGl(): MiniGl {
  const calls: string[] = [];
  const createdVertexArrays: object[] = [];
  const deletedVertexArrays: object[] = [];
  const names = new WeakMap<object, string>();
  const counters = { deletedWhileBound: 0 };
  const binding = { vertexArray: null as object | null };
  let nextId = 0;

  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (names.get(value) ?? '?') : String(value);

  const gl = {
    ...GL,
    createVertexArray: () => {
      // 给每个 VAO 一个可区分的字段：断言里会用 `toBe`（对象身份）比较，
      // 但多一个字段也能让 `toEqual` 这类**结构化**比较不会把两个空对象判成相等。
      const vertexArray: object = { vaoId: (nextId += 1) };
      names.set(vertexArray, `vao${nextId}`);
      createdVertexArrays.push(vertexArray);
      return vertexArray;
    },
    deleteVertexArray: (vertexArray: object) => {
      deletedVertexArrays.push(vertexArray);
      // GLES 3.0：删除当前绑定的 VAO 会把该绑定点复位成「没有 VAO」（默认 VAO 生效）。
      if (binding.vertexArray === vertexArray) {
        counters.deletedWhileBound += 1;
        binding.vertexArray = null;
      }
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
    get deletedWhileBound() {
      return counters.deletedWhileBound;
    },
    get boundVertexArray() {
      return binding.vertexArray;
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* #31：混合状态去重键改成逐字段数字比较                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** 可变版本：用来逐字段改一个字段，其余保持不变。 */
type MutableBlend = { -readonly [K in keyof GlBlendState]: number } & { enabled: boolean };

const TWO_FACE_BLEND: MutableBlend = {
  enabled: true,
  colorSrc: GL.SRC_ALPHA,
  colorDst: GL.ONE_MINUS_SRC_ALPHA,
  colorOp: GL.FUNC_ADD,
  alphaSrc: GL.ONE,
  alphaDst: GL.ZERO,
  alphaOp: GL.FUNC_ADD,
};

function cloneBlend(): MutableBlend {
  return { ...TWO_FACE_BLEND };
}

function applyBlend(cache: GlStateCache, blend: MutableBlend): void {
  cache.setBlend(
    blend.enabled,
    blend.colorSrc,
    blend.colorDst,
    blend.colorOp,
    blend.alphaSrc,
    blend.alphaDst,
    blend.alphaOp,
  );
}

describe('#31 混合状态缓存：判据必须覆盖每一个参与下发的字段', () => {
  it('状态完全没变时一次 GL 调用都不发', () => {
    const mini = createMiniGl();
    const cache = new GlStateCache(mini.gl);
    applyBlend(cache, cloneBlend());
    expect(mini.calls.length).toBeGreaterThan(0);

    mini.calls.length = 0;
    applyBlend(cache, cloneBlend());
    applyBlend(cache, cloneBlend());
    expect(mini.calls).toEqual([]);
  });

  /**
   * 字段清单：`Record<keyof GlBlendState, ...>` 要求**列出每一个字段**，
   * 所以给 `GlBlendState` 加字段而忘了在这里加用例，测试代码直接编译不过
   * （与 `src` 里 `UncomparedBlendField` 的编译期闸门互相印证）。
   */
  const fieldMutations: Record<
    keyof GlBlendState,
    { mutate: (state: MutableBlend) => void; expectCall: string }
  > = {
    colorSrc: { mutate: (state) => { state.colorSrc = GL.ONE; }, expectCall: 'blendFuncSeparate' },
    colorDst: { mutate: (state) => { state.colorDst = GL.ZERO; }, expectCall: 'blendFuncSeparate' },
    colorOp: { mutate: (state) => { state.colorOp = GL.FUNC_SUBTRACT; }, expectCall: 'blendEquationSeparate' },
    alphaSrc: { mutate: (state) => { state.alphaSrc = GL.ZERO; }, expectCall: 'blendFuncSeparate' },
    alphaDst: { mutate: (state) => { state.alphaDst = GL.SRC_ALPHA; }, expectCall: 'blendFuncSeparate' },
    alphaOp: {
      mutate: (state) => { state.alphaOp = GL.FUNC_REVERSE_SUBTRACT; },
      expectCall: 'blendEquationSeparate',
    },
  };

  for (const field of Object.keys(fieldMutations) as (keyof GlBlendState)[]) {
    it(`字段「${field}」变化后必定重新下发`, () => {
      const mini = createMiniGl();
      const cache = new GlStateCache(mini.gl);
      applyBlend(cache, cloneBlend());

      mini.calls.length = 0;
      const next = cloneBlend();
      fieldMutations[field].mutate(next);
      applyBlend(cache, next);

      // 漏掉任何一个字段都会让这里变成「没下发」——那正是最危险的静默画面错误。
      expect(mini.calls).toContain(fieldMutations[field].expectCall);
    });
  }

  it('打开 -> 关闭 -> 再打开同一份状态：重新打开时会完整重下发（与改前一致）', () => {
    const mini = createMiniGl();
    const cache = new GlStateCache(mini.gl);
    applyBlend(cache, cloneBlend());

    mini.calls.length = 0;
    const disabled = cloneBlend();
    disabled.enabled = false;
    applyBlend(cache, disabled);
    expect(mini.calls).toEqual([`disable:${GL.BLEND}`]);

    mini.calls.length = 0;
    applyBlend(cache, cloneBlend());
    // 改前关闭状态用的是另一条签名（'0'），所以重新打开同样会走完整下发；这里保持同样的行为。
    expect(mini.calls).toEqual([`enable:${GL.BLEND}`, 'blendFuncSeparate', 'blendEquationSeparate']);
  });

  it('invalidate() 之后重新下发混合状态', () => {
    const mini = createMiniGl();
    const cache = new GlStateCache(mini.gl);
    applyBlend(cache, cloneBlend());

    mini.calls.length = 0;
    cache.invalidate();
    applyBlend(cache, cloneBlend());
    expect(mini.calls).toEqual([`enable:${GL.BLEND}`, 'blendFuncSeparate', 'blendEquationSeparate']);
  });

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
    expect(mini.calls).toEqual([]);
    return elapsed;
  }

  it('100 万次同值 setBlend 的耗时（改后：7 次数字比较，零分配）', () => {
    measureSameState();
    const samples = [measureSameState(), measureSameState(), measureSameState()];
    const best = Math.min(...samples);
    log(
      `[#31 改后] ${iterations} 次同值 setBlend：` +
        samples.map((value) => `${value.toFixed(1)}ms`).join(' / ') +
        `，最好 ${best.toFixed(1)}ms（${((best * 1e6) / iterations).toFixed(1)} ns/次；` +
        `改前同一段测量连跑三次的「最好值」是 364.0 / 381.3 / 426.5ms，每次都要拼 7 段模板字符串）`,
    );
    expect(best).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* #33：VAO 缓存复用 PipelineCache 的 LRU                                                            */
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

function createTestPipeline(
  gl: WebGL2RenderingContext,
  state: GlStateCache,
  vertexArrayCacheLimit?: number,
): WebGL2RenderPipeline {
  const layouts: readonly VertexBufferLayout[] = [TEST_LAYOUT];
  return new WebGL2RenderPipeline(
    {
      label: 'stub-pipeline',
      vertex: { module: {} as ShaderModule, buffers: layouts },
      fragment: { module: {} as ShaderModule },
    },
    compiledProgramStub(layouts),
    'auto',
    { gl, state, limits: { maxVertexAttributes: 16, maxVertexBufferArrayStride: 2048 }, vertexArrayCacheLimit },
  );
}

/** 造一个只带 `id` / `native` 的顶点缓冲替身（缓存键里只用这两个）。 */
function fakeVertexBuffer(id: number, native: object): WebGL2Buffer {
  return { id, native } as unknown as WebGL2Buffer;
}

describe('#33 VAO 缓存加上限（复用 core 的 LRU）', () => {
  it('上限 3 塞 4 个：size 恰为 3、删掉 1 个、最旧的被淘汰', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state, 3);
    const variant = pipeline.resolveVariant();

    const buffers = [1, 2, 3, 4].map((id) => fakeVertexBuffer(id, { buffer: id }));
    const vertexArrays = buffers.map(
      (buffer, index) => pipeline.acquireVertexArray(variant, [{ buffer, offset: 0, size: 12 }], null, index + 1)!,
    );

    log(
      `[#33 改后] limit=3 塞 4 个：size=${variant.vertexArrays.size}、` +
        `createVertexArray=${mini.createdVertexArrays.length}、deleteVertexArray=${mini.deletedVertexArrays.length}`,
    );
    expect(variant.vertexArrays.size).toBe(3);
    expect(mini.createdVertexArrays).toHaveLength(4);
    // 用对象身份比较（`toEqual` 是结构化比较，两个 VAO 替身会被判成相等）。
    expect(mini.deletedVertexArrays).toHaveLength(1);
    expect(mini.deletedVertexArrays[0]).toBe(vertexArrays[0]);
    // 最旧的（第 1 个）被淘汰：它的键再取会重建一个新对象；第 2~4 个保持原对象。
    expect(pipeline.acquireVertexArray(variant, [{ buffer: buffers[1]!, offset: 0, size: 12 }], null, 5)).toBe(
      vertexArrays[1],
    );
    expect(pipeline.acquireVertexArray(variant, [{ buffer: buffers[0]!, offset: 0, size: 12 }], null, 6)).not.toBe(
      vertexArrays[0],
    );
    pipeline.dispose();
  });

  it('LRU 语义：最近用过的那个不会先被淘汰', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state, 3);
    const variant = pipeline.resolveVariant();
    const buffers = [1, 2, 3, 4].map((id) => fakeVertexBuffer(id, { buffer: id }));
    const bindingsFor = (index: number) => [{ buffer: buffers[index]!, offset: 0, size: 12 }];

    const first = pipeline.acquireVertexArray(variant, bindingsFor(0), null, 1)!;
    pipeline.acquireVertexArray(variant, bindingsFor(1), null, 2);
    pipeline.acquireVertexArray(variant, bindingsFor(2), null, 3);
    // 再用一次最旧的（会把它刷成最近使用），随后插入第 4 个时该淘汰的就不是它。
    expect(pipeline.acquireVertexArray(variant, bindingsFor(0), null, 4)).toBe(first);
    pipeline.acquireVertexArray(variant, bindingsFor(3), null, 5);

    expect(mini.deletedVertexArrays).toHaveLength(1);
    expect(mini.deletedVertexArrays[0]).not.toBe(first);
    expect(pipeline.acquireVertexArray(variant, bindingsFor(0), null, 6)).toBe(first);
    pipeline.dispose();
  });

  /**
   * 这条用例是本次改动**安全性**的核心证据，且它在改前是失败的。
   *
   * `bindingRevision` 为 0 时（`acquireVertexArray()` 的默认参数）快速路径的记忆**不会**被刷新；
   * 此时「快速路径指着 A」+「A 因超上限被淘汰删除」会同时成立，于是下一次同版本的 draw 会拿到一个
   * **已删除的 VAO** 去绑定 —— GL 会报 `INVALID_OPERATION` 并保持旧绑定，画面静默出错。
   * 渲染通道自己永远传 `>= 1` 的版本号，所以这条路径只在直接调用 `acquireVertexArray()`
   * （或将来新增的调用点）时出现；`evictVertexArray()` 里的第一件事就是把它清掉。
   */
  it('快速路径不会返回已被淘汰的 VAO（bindingRevision 混用时）', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state, 1);
    const variant = pipeline.resolveVariant();
    const buffers = [1, 2].map((id) => fakeVertexBuffer(id, { buffer: id }));
    const bindingsFor = (index: number) => [{ buffer: buffers[index]!, offset: 0, size: 12 }];
    const acquire = (index: number, revision: number) => {
      const vertexArray = pipeline.acquireVertexArray(variant, bindingsFor(index), null, revision)!;
      state.bindVertexArray(vertexArray);
      return vertexArray;
    };

    const vaoA = acquire(0, 7); // 建 A，快速路径记忆 = {7, A}
    const vaoB = acquire(1, 0); // 默认参数：不刷新快速路径；插入 B 时把最旧的 A 淘汰掉
    expect(vaoB).not.toBe(vaoA);
    expect(mini.deletedVertexArrays).toHaveLength(1);
    expect(mini.deletedVertexArrays[0]).toBe(vaoA);

    const again = acquire(0, 7);
    log(
      `[#33 改后] 淘汰后同版本再取：返回已删除的 vaoA ? ${String(again === vaoA)}` +
        `（改前为 true —— 那条路径会拿删除过的 VAO 去绑定）`,
    );
    expect(again).not.toBe(vaoA);
    expect(mini.createdVertexArrays).toContain(again);
    pipeline.dispose();
  });

  it('淘汰永远不会删掉「当前绑定」的 VAO，且状态缓存的记录始终与 GL 一致', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state, 3);
    const variant = pipeline.resolveVariant();
    const buffers = [1, 2, 3, 4, 5, 6, 7].map((id) => fakeVertexBuffer(id, { buffer: id }));

    // 模拟渲染通道的每次 draw：acquire -> bindVertexArray，并来回切几个键。
    const order = [0, 1, 2, 2, 0, 3, 1, 4, 0, 5, 6, 2, 0];
    let revision = 1;
    for (const index of order) {
      const vertexArray = pipeline.acquireVertexArray(
        variant,
        [{ buffer: buffers[index]!, offset: 0, size: 12 }],
        null,
        revision++,
      );
      state.bindVertexArray(vertexArray);
      // 每一次 draw 之前，「状态缓存记着的 VAO」必须就是 GL 实际绑着的那个。
      expect(mini.boundVertexArray).toBe(state.currentVertexArray);
    }

    log(
      `[#33 改后] 13 次 draw（7 个键、limit=3）：createVertexArray=${mini.createdVertexArrays.length}、` +
        `deleteVertexArray=${mini.deletedVertexArrays.length}、删除时正绑着的次数=${mini.deletedWhileBound}`,
    );
    expect(mini.deletedVertexArrays.length).toBeGreaterThan(0);
    // 淘汰只会淘汰「不是当前绑定」的那个（安全性论证第 2 条）。
    expect(mini.deletedWhileBound).toBe(0);
    expect(mini.boundVertexArray).toBe(state.currentVertexArray);
    pipeline.dispose();
  });

  it('dispose() 释放缓存里剩下的 VAO，并且不让状态缓存继续以为它绑着', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state, 4);
    const variant = pipeline.resolveVariant();
    const buffers = [1, 2, 3].map((id) => fakeVertexBuffer(id, { buffer: id }));
    let last: WebGLVertexArrayObject | null = null;
    buffers.forEach((buffer, index) => {
      last = pipeline.acquireVertexArray(variant, [{ buffer, offset: 0, size: 12 }], null, index + 1);
      state.bindVertexArray(last);
    });

    pipeline.dispose();
    expect(mini.deletedVertexArrays).toHaveLength(3);
    // 被删的最后一个正是当前绑定的那个：收尾会**先**让状态缓存把它解绑（`bindVertexArray(null)`），
    // 所以 GL 从不会看到「删除当前绑定的 VAO」这一步（`deletedWhileBound === 0`），缓存也不会撒谎。
    expect(mini.deletedWhileBound).toBe(0);
    expect(state.currentVertexArray).toBeNull();
    expect(mini.boundVertexArray).toBeNull();
    expect(pipeline.vertexArrayCount).toBe(0);
  });

  it('默认上限 64：连续 80 组不同顶点绑定后条目数封顶', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    const pipeline = createTestPipeline(mini.gl, state);
    const variant = pipeline.resolveVariant();
    const checkpoints = [1, 2, 3, 4, 8, 16, 64, 65, 80];
    const curve: string[] = [];

    for (let index = 1; index <= 80; index += 1) {
      const buffer = fakeVertexBuffer(index, { buffer: index });
      pipeline.acquireVertexArray(variant, [{ buffer, offset: 0, size: 12 }], null, index);
      if (checkpoints.includes(index)) curve.push(`${index}->${variant.vertexArrays.size}`);
    }

    log(
      `[#33 改后] 80 组不同顶点绑定的条目数曲线（ acquire 次数->size ）：${curve.join(', ')}；` +
        `createVertexArray=${mini.createdVertexArrays.length}、deleteVertexArray=${mini.deletedVertexArrays.length}` +
        `（改前曲线是 1->1, ..., 80->80，删除 0 次）`,
    );
    expect(variant.vertexArrays.size).toBe(64);
    expect(pipeline.vertexArrayCount).toBe(64);
    // 80 次 acquire 会建 80 个 VAO，其中 16 个因超上限被立刻删掉。
    expect(mini.createdVertexArrays).toHaveLength(80);
    expect(mini.deletedVertexArrays).toHaveLength(16);
    pipeline.dispose();
  });

  it('上限必须是 >= 1 的整数（0 会让刚建好的 VAO 被自己淘汰掉）', () => {
    const mini = createMiniGl();
    const state = new GlStateCache(mini.gl);
    expect(() => createTestPipeline(mini.gl, state, 0)).toThrow(/\[gpu-device-api\] vertexArrayCacheLimit/);
    expect(() => createTestPipeline(mini.gl, state, 1.5)).toThrow(/\[gpu-device-api\] vertexArrayCacheLimit/);
    expect(createTestPipeline(mini.gl, state, 1)).toBeTruthy();
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

/**
 * 记下每次 `clearBufferfv` 传进去的**值**（共享暂存数组最容易出错的地方就是值被后一次覆盖）。
 *
 * 只记 `drawbuffer` 与数值：共享假 GL 的枚举表里没有 `COLOR` / `DEPTH`（真实 WebGL2 有，
 * 分别是 0x1800 / 0x1801），所以 `buffer` 参数在这里恒为 `undefined`，对本次测量没有意义。
 */
function captureClearValues(fake: FakeWebGL2): { drawbuffer: number; values: number[] }[] {
  const captured: { drawbuffer: number; values: number[] }[] = [];
  const target = fake.gl as unknown as {
    clearBufferfv: (buffer: number, drawbuffer: number, values: Float32Array) => void;
  };
  const original = target.clearBufferfv.bind(fake.gl);
  target.clearBufferfv = (buffer: number, drawbuffer: number, values: Float32Array) => {
    captured.push({ drawbuffer, values: Array.from(values) });
    original(buffer, drawbuffer, values);
  };
  return captured;
}

describe('#35 beginRenderPass 建立期：不再每次分配暂存数组', () => {
  it('多重采样 pass（2 颜色 + 深度）：JSON.stringify 与 Float32Array 都是 0', () => {
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

    const floats = countFloat32Allocations(() =>
      countJsonStringify(() => new WebGL2RenderPassEncoder(descriptor, options)),
    );
    log(
      `[#35 改后] 多重采样 pass（2 颜色 + 深度）：JSON.stringify=${floats.result.calls} 次、` +
        `Float32Array=${floats.constructed} 块、clearBufferfv=` +
        `${fake.calls.filter((call) => call.startsWith('clearBufferfv')).length}` +
        `（改前 2 / 2 / 3）`,
    );
    expect(floats.result.calls).toBe(0);
    expect(floats.constructed).toBe(0);
    // 清屏本身一次都不能少（2 个颜色附件 + 1 次深度）。
    expect(fake.calls.filter((call) => call.startsWith('clearBufferfv'))).toHaveLength(3);
    device.dispose();
  });

  it('原始附件 pass（2 颜色 + 深度）：0 块 Float32Array，且每个附件拿到自己的颜色', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const state = new GlStateCache(fake.gl);
    const color = (label: string) =>
      device.createTexture({
        label,
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
    const clearValues = captureClearValues(fake);
    const options = createPassOptions(fake, state);
    const descriptor = {
      label: 'raw-pass',
      colorAttachments: [
        { view: color('color-a').createView() as WebGL2TextureView, clearValue: [1, 0, 0, 1] as const },
        { view: color('color-b').createView() as WebGL2TextureView, clearValue: [0, 1, 0, 1] as const },
      ],
      depthStencilAttachment: { view: depth.createView() as WebGL2TextureView, depthClearValue: 0.5 },
    };

    const floats = countFloat32Allocations(() => new WebGL2RenderPassEncoder(descriptor, options));
    log(
      `[#35 改后] 原始附件 pass（2 颜色 + 深度）：Float32Array=${floats.constructed} 块、` +
        `clearBufferfv 的值=${clearValues.map((item) => item.values.join(',')).join(' | ')}（改前 2 块）`,
    );
    expect(floats.constructed).toBe(0);
    // 共享暂存数组必须每个附件都**按当时的值**下发（不能被后一次写入覆盖）。
    expect(clearValues).toEqual([
      { drawbuffer: 0, values: [1, 0, 0, 1] },
      { drawbuffer: 1, values: [0, 1, 0, 1] },
      { drawbuffer: 0, values: [0.5] },
    ]);
    device.dispose();
  });
});

describe('#35 clearValue 比较的语义（数值比较取代 JSON 字符串）', () => {
  function createMultisamplePassDevice(): { device: WebGL2Device; target: WebGL2RenderTarget; fake: FakeWebGL2 } {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
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
    return { device, target, fake };
  }

  function buildPass(
    fake: FakeWebGL2,
    target: WebGL2RenderTarget,
    first: Color | undefined,
    second: Color | undefined,
  ): () => WebGL2RenderPassEncoder {
    const state = new GlStateCache(fake.gl);
    const options = createPassOptions(fake, state);
    const descriptor = {
      label: 'msaa-pass',
      colorAttachments: [
        { view: target.colorView(0) as WebGL2TextureView, clearValue: first },
        { view: target.colorView(1) as WebGL2TextureView, clearValue: second },
      ],
    };
    return () => new WebGL2RenderPassEncoder(descriptor, options);
  }

  it('真正不同的颜色仍然报错（不能因为换了比较方式就漏判）', () => {
    const { device, target, fake } = createMultisamplePassDevice();
    expect(buildPass(fake, target, '#ff0000', '#00ff00')).toThrow(/不同的 clearValue/);
    // 只差一个通道也要报错。
    expect(buildPass(fake, target, [1, 0, 0, 1], [1, 0, 0, 0.5])).toThrow(/不同的 clearValue/);
    device.dispose();
  });

  it('同一个颜色的不同写法视为一致（改前会误报）', () => {
    const { device, target, fake } = createMultisamplePassDevice();
    // '#123456' / 0x123456 / [r,g,b] / {r,g,b} 解析出来是同一个 RGBA —— 清屏结果本来就一样。
    expect(buildPass(fake, target, '#123456', 0x123456)).not.toThrow();
    expect(buildPass(fake, target, [0.1, 0.2, 0.3], [0.1, 0.2, 0.3, 1])).not.toThrow();
    expect(buildPass(fake, target, { r: 0.1, g: 0.2, b: 0.3 }, { r: 0.1, g: 0.2, b: 0.3, a: 1 })).not.toThrow();
    device.dispose();
  });

  it('缺省值的语义与改前逐字一致：前导缺省由后面的显式值决定，缺省黑与显式黑等价', () => {
    const { device, target, fake } = createMultisamplePassDevice();
    // 两个都缺省：等价于默认黑，不报错。
    expect(buildPass(fake, target, undefined, undefined)).not.toThrow();
    // 改前的判据是 `clearValue === undefined`（「第一个**有值**的附件说了算」），
    // 所以前导缺省不会被当成一个待比较的颜色，后面的显式值直接生效 —— 这条怪癖原样保留。
    expect(buildPass(fake, target, undefined, '#ff0000')).not.toThrow();
    // 反过来（显式红在前、缺省在后）解析结果不同，照旧报错。
    expect(buildPass(fake, target, '#ff0000', undefined)).toThrow(/不同的 clearValue/);
    // 缺省解析出来是默认黑 [0,0,0,1]，与显式黑数值相同 —— 改前会把这种写法判成不一致（误报），
    // 现在不报错：两者清屏结果本来就一样。这是本项唯一有意的放宽。
    expect(buildPass(fake, target, [0, 0, 0, 1], undefined)).not.toThrow();
    device.dispose();
  });

  it('NaN 分量视为一致（与改前的字符串比较同结论）', () => {
    const { device, target, fake } = createMultisamplePassDevice();
    // 改前：JSON.stringify(NaN) 是 'null'，两条都是 'null' → 判为一致。
    expect(buildPass(fake, target, [Number.NaN, 0, 0, 1], [Number.NaN, 0, 0, 1])).not.toThrow();
    // 只有一个分量是 NaN 时两边不同 → 报错。
    expect(buildPass(fake, target, [Number.NaN, 0, 0, 1], [0, 0, 0, 1])).toThrow(/不同的 clearValue/);
    device.dispose();
  });
});
