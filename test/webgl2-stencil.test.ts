/**
 * WebGL2 模板（stencil）语义回归测试。
 *
 * ## 缺陷回顾（本文件钉死的就是它）
 *
 * WebGPU 侧一直把完整的模板状态下发给 `GPUDepthStencilState`（`stencilFront` / `stencilBack`
 * 的 `compare` / `failOp` / `depthFailOp` / `passOp`，以及 `stencilReadMask` / `stencilWriteMask`），
 * 而 WebGL2 侧把除了「要不要开 `STENCIL_TEST`」之外的一切都丢掉了：
 * `ResolvedRenderState` 只带 `stencilEnabled`，下发时硬编码 `stencilFunc(ALWAYS, ref, 0xff)`，
 * 从不调用 `stencilOpSeparate` / `stencilMaskSeparate`（`GL_STENCIL_OPS` 定义了却无人使用）。
 *
 * 后果是**静默**的：`{ compare: 'equal', passOp: 'replace' }` 在 WebGL2 上退化成「恒通过、不写」，
 * 不报任何错，画面就是错的。像素级证据见 `examples/stencil.html`（修复前 WebGL2 的右半屏是满屏
 * 绿色、WebGPU 是底色），这里证明的是**机制**：每一个参数都被逐字下发、双面各自独立、
 * 且状态缓存的去重键对每一个字段的变化都敏感（少一个字段就会误判「状态没变」而漏下发）。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache, type GlStencilState } from '../src/webgl2/utils/glStateCache.js';
import { applyRenderState, resolveRenderState } from '../src/webgl2/pipeline/WebGL2RenderState.js';
import { WebGL2RenderPipeline } from '../src/webgl2/pipeline/WebGL2RenderPipeline.js';
import { GL_COMPARE_FUNCS, GL_STENCIL_OPS } from '../src/webgl2/utils/glEnumMap.js';
import { WebGPURenderState } from '../src/webgpu/pipeline/WebGPURenderState.js';
import { STENCIL_FACE_DEFAULT } from '../src/core/pipeline/RenderState.js';
import type { DepthStencilState, StencilFaceState } from '../src/core/pipeline/RenderState.js';
import type { CompareFunction } from '../src/core/enums/CompareFunction.js';
import type { StencilOperation } from '../src/core/enums/StencilOperation.js';
import type { RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { ResolvedVariant } from '../src/webgl2/pipeline/WebGL2RenderPipeline.js';

/* ------------------------------------------------------------------------------------------------ */
/* 假 GL：只实现本文件会碰到的入口，把每个参数都记下来                                                    */
/* ------------------------------------------------------------------------------------------------ */

/** GL 常量（写死数值，避免依赖真实上下文实例）。 */
const GL = {
  STENCIL_TEST: 0x0b90,
  FRONT: 0x0404,
  BACK: 0x0405,
  FRONT_AND_BACK: 0x0408,
  ALWAYS: 0x0207,
  BLEND: 0x0be2,
  DEPTH_TEST: 0x0b71,
  CULL_FACE: 0x0b44,
  POLYGON_OFFSET_FILL: 0x8037,
} as const;

const hex = (value: number): string => `0x${value.toString(16)}`;
const faceName = (face: number): string =>
  face === GL.FRONT ? 'FRONT' : face === GL.BACK ? 'BACK' : face === GL.FRONT_AND_BACK ? 'FRONT_AND_BACK' : hex(face);

interface FakeGl {
  readonly gl: WebGL2RenderingContext;
  readonly calls: string[];
}

/**
 * 造一台假 GL。
 *
 * 关键是**每个参数都进调用记录**（面、比较函数、引用值、读掩码、三种操作、写掩码），
 * 否则「参数对不对」就退回成「有没有调用」这种同义反复。
 * 单面的旧入口（`stencilFunc` / `stencilOp` / `stencilMask`）也一并记录：修复后它们不该再出现。
 */
function createFakeGl(): FakeGl {
  const calls: string[] = [];
  const gl = {
    ...GL,
    enable: (capability: number) => calls.push(`enable:${hex(capability)}`),
    disable: (capability: number) => calls.push(`disable:${hex(capability)}`),
    useProgram: () => calls.push('useProgram'),
    colorMask: () => calls.push('colorMask'),
    depthMask: () => calls.push('depthMask'),
    depthFunc: () => calls.push('depthFunc'),
    cullFace: () => calls.push('cullFace'),
    frontFace: () => calls.push('frontFace'),
    polygonOffset: () => calls.push('polygonOffset'),
    blendFuncSeparate: () => calls.push('blendFuncSeparate'),
    blendEquationSeparate: () => calls.push('blendEquationSeparate'),
    stencilFuncSeparate: (face: number, func: number, reference: number, mask: number) =>
      calls.push(`stencilFuncSeparate:${faceName(face)}:${hex(func)}:${reference}:${hex(mask)}`),
    stencilOpSeparate: (face: number, fail: number, depthFail: number, pass: number) =>
      calls.push(`stencilOpSeparate:${faceName(face)}:${hex(fail)}:${hex(depthFail)}:${hex(pass)}`),
    stencilMaskSeparate: (face: number, mask: number) =>
      calls.push(`stencilMaskSeparate:${faceName(face)}:${hex(mask)}`),
    stencilFunc: () => calls.push('stencilFunc(单面旧入口)'),
    stencilOp: () => calls.push('stencilOp(单面旧入口)'),
    stencilMask: () => calls.push('stencilMask(单面旧入口)'),
  } as unknown as WebGL2RenderingContext;
  return { gl, calls };
}

/**
 * 只保留模板相关的调用，便于逐字断言（其它固定功能状态不在本文件的讨论范围）。
 *
 * `STENCIL_TEST` 的开关走的是通用的 `enable` / `disable`，所以要把这两个调用一起挑出来。
 */
function stencilCalls(calls: readonly string[]): string[] {
  const capability = hex(GL.STENCIL_TEST);
  return calls.filter(
    (call) =>
      call.startsWith('stencil') || call === `enable:${capability}` || call === `disable:${capability}`,
  );
}

/** 一个「有深度附件、带模板位」的目标形态（`depth24plus-stencil8`）。 */
const STENCIL_TARGET = { depth: true, stencil: true } as const;

function descriptorWith(depthStencil: DepthStencilState | undefined): RenderPipelineDescriptor {
  return {
    ...(depthStencil === undefined ? {} : { depthStencil }),
    vertex: { module: {} as never },
  };
}

/** 用真正的 `resolveRenderState()` 解析一份模板状态。 */
function resolveStencil(depthStencil: DepthStencilState | undefined) {
  return resolveRenderState(descriptorWith(depthStencil), STENCIL_TARGET);
}

/* ------------------------------------------------------------------------------------------------ */
/* 映射表                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

describe('GL_STENCIL_OPS：core 枚举 → GL 常量', () => {
  /**
   * 这张表原来定义了却没有任何调用方。映射要逐项与 OpenGL ES 3.0 的常量对照：
   * 七个操作里有四个（`zero` / `invert` / 两个 wrap）不是「1e0x」序列，最容易抄错。
   */
  it('逐项等于 GLES 3.0 的常量', () => {
    expect(GL_STENCIL_OPS).toEqual({
      keep: 0x1e00,
      zero: 0x0000,
      replace: 0x1e01,
      invert: 0x150a,
      'increment-clamp': 0x1e02,
      'decrement-clamp': 0x1e03,
      'increment-wrap': 0x8507,
      'decrement-wrap': 0x8508,
    });
  });

  it('比较函数的映射覆盖全部 CompareFunction 且等于 GLES 3.0 的常量', () => {
    expect(GL_COMPARE_FUNCS).toEqual({
      never: 0x0200,
      less: 0x0201,
      equal: 0x0202,
      'less-equal': 0x0203,
      greater: 0x0204,
      'not-equal': 0x0205,
      'greater-equal': 0x0206,
      always: 0x0207,
    });
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* resolveRenderState：完整模板状态                                                                   */
/* ------------------------------------------------------------------------------------------------ */

describe('resolveRenderState：模板状态完整映射', () => {
  it('front / back 各自的 compare、三种操作与两侧掩码都进解析结果', () => {
    const resolved = resolveStencil({
      depthWriteEnabled: false,
      depthCompare: 'always',
      stencilFront: { compare: 'equal', failOp: 'increment-wrap', depthFailOp: 'decrement-clamp', passOp: 'replace' },
      stencilBack: { compare: 'greater', failOp: 'zero', depthFailOp: 'invert', passOp: 'decrement-wrap' },
      stencilReadMask: 0x0f,
      stencilWriteMask: 0x80,
    });

    expect(resolved.stencilEnabled).toBe(true);
    // 正面
    expect(resolved.stencilFront.compare).toBe(0x0202); // EQUAL
    expect(resolved.stencilFront.failOp).toBe(0x8507); // INCR_WRAP
    expect(resolved.stencilFront.depthFailOp).toBe(0x1e03); // DECR
    expect(resolved.stencilFront.passOp).toBe(0x1e01); // REPLACE
    // 背面：与正面完全不同，证明两个面各自独立解析（不是共用一份）
    expect(resolved.stencilBack.compare).toBe(0x0204); // GREATER
    expect(resolved.stencilBack.failOp).toBe(0x0000); // ZERO
    expect(resolved.stencilBack.depthFailOp).toBe(0x150a); // INVERT
    expect(resolved.stencilBack.passOp).toBe(0x8508); // DECR_WRAP
    // 掩码
    expect(resolved.stencilReadMask).toBe(0x0f);
    expect(resolved.stencilWriteMask).toBe(0x80);
  });

  it('省略的模板字段落到 STENCIL_FACE_DEFAULT 与全 1 掩码（与 WebGPU 同源）', () => {
    const resolved = resolveStencil({ depthWriteEnabled: true });
    for (const face of [resolved.stencilFront, resolved.stencilBack]) {
      expect(face.compare).toBe(GL_COMPARE_FUNCS[STENCIL_FACE_DEFAULT.compare]);
      expect(face.failOp).toBe(GL_STENCIL_OPS[STENCIL_FACE_DEFAULT.failOp]);
      expect(face.depthFailOp).toBe(GL_STENCIL_OPS[STENCIL_FACE_DEFAULT.depthFailOp]);
      expect(face.passOp).toBe(GL_STENCIL_OPS[STENCIL_FACE_DEFAULT.passOp]);
    }
    expect(resolved.stencilReadMask).toBe(0xffff_ffff);
    expect(resolved.stencilWriteMask).toBe(0xffff_ffff);
  });

  it('只有一个面写了状态时，另一个面独立地拿缺省值', () => {
    const resolved = resolveStencil({
      depthWriteEnabled: true,
      stencilFront: { compare: 'equal', passOp: 'replace' },
    });
    expect(resolved.stencilFront.compare).toBe(GL_COMPARE_FUNCS.equal);
    expect(resolved.stencilFront.passOp).toBe(GL_STENCIL_OPS.replace);
    expect(resolved.stencilBack.compare).toBe(GL_COMPARE_FUNCS.always);
    expect(resolved.stencilBack.passOp).toBe(GL_STENCIL_OPS.keep);
  });

  it('不使用模板时（format: null / 未声明 / target 无模板位）解析成「恒通过 + keep + 写掩码 0」', () => {
    const noop = {
      compare: GL_COMPARE_FUNCS.always,
      failOp: GL_STENCIL_OPS.keep,
      depthFailOp: GL_STENCIL_OPS.keep,
      passOp: GL_STENCIL_OPS.keep,
    };
    // 与 WebGPU 侧 `toGPUDepthStencilState()` 对「不使用深度/模板」的处理完全同形：
    // 这样做是为了让两个后端的解析结果可以直接对照，而不是一边给 keep、一边给描述里的值。
    const cases = [
      resolveStencil({ format: null }),
      resolveStencil(undefined),
      resolveRenderState(descriptorWith({ depthWriteEnabled: true }), { depth: true, stencil: false }),
    ];
    for (const resolved of cases) {
      expect(resolved.stencilEnabled).toBe(false);
      expect(resolved.stencilFront).toEqual(noop);
      expect(resolved.stencilBack).toEqual(noop);
      expect(resolved.stencilReadMask).toBe(0xffff_ffff);
      expect(resolved.stencilWriteMask).toBe(0x0000_0000);
    }
  });

  it('与 WebGPU 侧对同一份 DepthStencilState 的翻译逐字段一致', () => {
    const state: DepthStencilState = {
      depthWriteEnabled: false,
      depthCompare: 'always',
      stencilFront: { compare: 'less-equal', failOp: 'increment-clamp', depthFailOp: 'keep', passOp: 'replace' },
      stencilBack: { compare: 'not-equal', failOp: 'keep', depthFailOp: 'decrement-wrap', passOp: 'zero' },
      stencilReadMask: 0x0f,
      stencilWriteMask: 0x80,
    };
    const gpu = WebGPURenderState.toGPUDepthStencilState('depth24plus-stencil8', state);
    const gl = resolveStencil(state);

    expect(gpu.stencilReadMask).toBe(gl.stencilReadMask);
    expect(gpu.stencilWriteMask).toBe(gl.stencilWriteMask);
    for (const side of ['stencilFront', 'stencilBack'] as const) {
      const gpuFace = gpu[side];
      const glFace = gl[side];
      expect(GL_COMPARE_FUNCS[gpuFace?.compare as CompareFunction]).toBe(glFace.compare);
      expect(GL_STENCIL_OPS[gpuFace?.failOp as StencilOperation]).toBe(glFace.failOp);
      expect(GL_STENCIL_OPS[gpuFace?.depthFailOp as StencilOperation]).toBe(glFace.depthFailOp);
      expect(GL_STENCIL_OPS[gpuFace?.passOp as StencilOperation]).toBe(glFace.passOp);
    }
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* applyRenderState → 真实 GL 调用                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/** 一份双面完全不同的模板状态（GL 枚举已经是解析后的形式）。 */
const TWO_FACE_STATE: GlStencilState = {
  enabled: true,
  reference: 3,
  front: { compare: 0x0202, failOp: 0x1e00, depthFailOp: 0x1e00, passOp: 0x1e01 },
  back: { compare: 0x0204, failOp: 0x1e00, depthFailOp: 0x0000, passOp: 0x8508 },
  readMask: 0x0f,
  writeMask: 0x80,
};

describe('applyRenderState：把完整模板状态下发到 GL', () => {
  it('每个参数逐个下发，且双面各自独立（含顺序）', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    const resolved = resolveStencil({
      depthWriteEnabled: false,
      depthCompare: 'always',
      stencilFront: { compare: 'equal', passOp: 'replace' },
      stencilBack: { compare: 'greater', depthFailOp: 'zero', passOp: 'decrement-wrap' },
      stencilReadMask: 0x0f,
      stencilWriteMask: 0x80,
    });

    applyRenderState(cache, resolved, 3);

    expect(stencilCalls(calls)).toEqual([
      `enable:${hex(GL.STENCIL_TEST)}`,
      'stencilFuncSeparate:FRONT:0x202:3:0xf',
      'stencilFuncSeparate:BACK:0x204:3:0xf',
      'stencilOpSeparate:FRONT:0x1e00:0x1e00:0x1e01',
      'stencilOpSeparate:BACK:0x1e00:0x0:0x8508',
      'stencilMaskSeparate:FRONT:0x80',
      'stencilMaskSeparate:BACK:0x80',
    ]);
    // 单面旧入口一个都不许再出现：它们只能表达「一个面 + 恒通过」。
    expect(calls.filter((call) => call.includes('单面旧入口'))).toEqual([]);
  });

  it('setStencilReference 的引用值真的进 stencilFuncSeparate（两个面都带）', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    const resolved = resolveStencil({ depthWriteEnabled: true, stencilFront: { compare: 'equal' } });

    applyRenderState(cache, resolved, 7);

    const funcs = calls.filter((call) => call.startsWith('stencilFuncSeparate'));
    expect(funcs).toEqual([
      'stencilFuncSeparate:FRONT:0x202:7:0xffffffff',
      'stencilFuncSeparate:BACK:0x207:7:0xffffffff',
    ]);
  });

  it('引用值变化会重新下发 func（但操作与掩码不变时不下发）', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    const resolved = resolveStencil({
      depthWriteEnabled: true,
      stencilFront: { compare: 'equal', passOp: 'replace' },
    });

    applyRenderState(cache, resolved, 1);
    calls.length = 0;
    applyRenderState(cache, resolved, 4);

    expect(calls).toEqual([
      'stencilFuncSeparate:FRONT:0x202:4:0xffffffff',
      'stencilFuncSeparate:BACK:0x207:4:0xffffffff',
    ]);
  });

  it('不使用模板的管线只下发 disable(STENCIL_TEST)，不写任何模板状态', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);

    applyRenderState(cache, resolveStencil({ format: null }), 5);

    expect(stencilCalls(calls)).toEqual([`disable:${hex(GL.STENCIL_TEST)}`]);
  });

  it('真实的 WebGL2RenderPipeline.applyState() 会把引用值转发进 GL', () => {
    // 只借真正的 applyState() 走一遍转发链（它只用到 this.state 与 this.program.program），
    // 因此这里给一个结构化的替身，而不是伪造整条管线的编译结果。
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    const resolved = resolveStencil({ depthWriteEnabled: true, stencilFront: { compare: 'equal' } });
    const variant: ResolvedVariant = {
      key: 'test',
      renderState: resolved,
      depthFormat: 'depth24plus-stencil8',
      sampleCount: 1,
      vertexLayouts: [],
      vertexArrays: new Map(),
      vertexArrayLookup: null,
    };
    const stub = {
      state: cache,
      program: { program: {} as WebGLProgram },
      // `RenderPipelineVariant` 只用于类型收窄，这里不需要真的用到。
    } as unknown as WebGL2RenderPipeline;

    WebGL2RenderPipeline.prototype.applyState.call(stub, variant, 9);

    expect(calls.filter((call) => call.startsWith('stencilFuncSeparate'))).toEqual([
      'stencilFuncSeparate:FRONT:0x202:9:0xffffffff',
      'stencilFuncSeparate:BACK:0x207:9:0xffffffff',
    ]);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 状态缓存的去重键                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/** 可变的深拷贝，用来逐个字段改。 */
interface MutableStencil {
  enabled: boolean;
  reference: number;
  front: { compare: number; failOp: number; depthFailOp: number; passOp: number };
  back: { compare: number; failOp: number; depthFailOp: number; passOp: number };
  readMask: number;
  writeMask: number;
}

const cloneBase = (): MutableStencil => ({
  enabled: TWO_FACE_STATE.enabled,
  reference: TWO_FACE_STATE.reference,
  front: { ...TWO_FACE_STATE.front },
  back: { ...TWO_FACE_STATE.back },
  readMask: TWO_FACE_STATE.readMask,
  writeMask: TWO_FACE_STATE.writeMask,
});

describe('GlStateCache.setStencilTest：去重键必须覆盖全部字段', () => {
  it('状态完全没变时一次 GL 调用都不发', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    cache.setStencilTest(TWO_FACE_STATE);
    expect(stencilCalls(calls).length).toBeGreaterThan(0);

    calls.length = 0;
    cache.setStencilTest(cloneBase());
    cache.setStencilTest(cloneBase());
    expect(calls).toEqual([]);
  });

  /**
   * 逐个字段改一次，每次都必须产生 GL 调用。
   *
   * 这正是最容易出错的地方：漏掉任何一个字段（尤其是 `readMask` / `writeMask` 或背面的三个操作）
   * 都会让缓存误判「状态没变」而不下发，表现为「换条管线之后画面偶尔不对」——
   * 没有异常、没有日志，只有像素是错的。
   */
  const fieldMutations: readonly { name: string; mutate: (state: MutableStencil) => void; expect: string }[] = [
    { name: 'enabled', mutate: (s) => { s.enabled = false; }, expect: `disable:${hex(GL.STENCIL_TEST)}` },
    { name: 'reference', mutate: (s) => { s.reference = 4; }, expect: 'stencilFuncSeparate:FRONT:0x202:4:0xf' },
    { name: 'front.compare', mutate: (s) => { s.front.compare = 0x0203; }, expect: 'stencilFuncSeparate:FRONT:0x203:3:0xf' },
    { name: 'front.failOp', mutate: (s) => { s.front.failOp = 0x1e02; }, expect: 'stencilOpSeparate:FRONT:0x1e02:0x1e00:0x1e01' },
    { name: 'front.depthFailOp', mutate: (s) => { s.front.depthFailOp = 0x150a; }, expect: 'stencilOpSeparate:FRONT:0x1e00:0x150a:0x1e01' },
    { name: 'front.passOp', mutate: (s) => { s.front.passOp = 0x0000; }, expect: 'stencilOpSeparate:FRONT:0x1e00:0x1e00:0x0' },
    { name: 'back.compare', mutate: (s) => { s.back.compare = 0x0205; }, expect: 'stencilFuncSeparate:BACK:0x205:3:0xf' },
    { name: 'back.failOp', mutate: (s) => { s.back.failOp = 0x8507; }, expect: 'stencilOpSeparate:BACK:0x8507:0x0:0x8508' },
    { name: 'back.depthFailOp', mutate: (s) => { s.back.depthFailOp = 0x1e03; }, expect: 'stencilOpSeparate:BACK:0x1e00:0x1e03:0x8508' },
    { name: 'back.passOp', mutate: (s) => { s.back.passOp = 0x150a; }, expect: 'stencilOpSeparate:BACK:0x1e00:0x0:0x150a' },
    { name: 'readMask', mutate: (s) => { s.readMask = 0xff; }, expect: 'stencilFuncSeparate:FRONT:0x202:3:0xff' },
    { name: 'writeMask', mutate: (s) => { s.writeMask = 0xff; }, expect: 'stencilMaskSeparate:FRONT:0xff' },
  ];

  for (const field of fieldMutations) {
    it(`字段「${field.name}」变化后必定重新下发`, () => {
      const { gl, calls } = createFakeGl();
      const cache = new GlStateCache(gl);
      cache.setStencilTest(TWO_FACE_STATE);

      calls.length = 0;
      const next = cloneBase();
      field.mutate(next);
      cache.setStencilTest(next);

      expect(calls).toContain(field.expect);
    });
  }

  it('只改一个面时不会连带重下发另一个面（双面互不干扰）', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    cache.setStencilTest(TWO_FACE_STATE);

    calls.length = 0;
    const frontChanged = cloneBase();
    frontChanged.front.passOp = 0x0000;
    cache.setStencilTest(frontChanged);
    expect(calls).toEqual(['stencilOpSeparate:FRONT:0x1e00:0x1e00:0x0']);

    calls.length = 0;
    const backChanged = cloneBase();
    backChanged.back.compare = 0x0205;
    cache.setStencilTest(backChanged);
    // 顺序是「先两个面的 func、再两个面的 op、最后写掩码」；`cloneBase()` 把正面刚改过的
    // passOp 还原了，所以正面会重新下发 op，而背面只有 compare 变了、只重下发 func。
    expect(calls).toEqual([
      'stencilFuncSeparate:BACK:0x205:3:0xf',
      'stencilOpSeparate:FRONT:0x1e00:0x1e00:0x1e01',
    ]);
  });

  it('invalidate() 之后重新下发全部模板状态', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    cache.setStencilTest(TWO_FACE_STATE);

    calls.length = 0;
    cache.invalidate();
    cache.setStencilTest(cloneBase());

    expect(stencilCalls(calls)).toEqual([
      `enable:${hex(GL.STENCIL_TEST)}`,
      'stencilFuncSeparate:FRONT:0x202:3:0xf',
      'stencilFuncSeparate:BACK:0x204:3:0xf',
      'stencilOpSeparate:FRONT:0x1e00:0x1e00:0x1e01',
      'stencilOpSeparate:BACK:0x1e00:0x0:0x8508',
      'stencilMaskSeparate:FRONT:0x80',
      'stencilMaskSeparate:BACK:0x80',
    ]);
  });

  it('关掉再打开同一份状态时，只需重新 enable，不必重下发模板参数', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    cache.setStencilTest(TWO_FACE_STATE);

    calls.length = 0;
    const disabled = cloneBase();
    disabled.enabled = false;
    cache.setStencilTest(disabled);
    expect(calls).toEqual([`disable:${hex(GL.STENCIL_TEST)}`]);

    calls.length = 0;
    cache.setStencilTest(cloneBase());
    // GL 的模板参数在 `STENCIL_TEST` 关闭期间不会被重置，所以只需重新打开。
    expect(calls).toEqual([`enable:${hex(GL.STENCIL_TEST)}`]);
  });

  /**
   * 清屏与写掩码的交互（真机上踩到过的坑）。
   *
   * 像素级表现：`examples/stencil.html` 的 `nowrite` 场景里，写掩码 0 的那一趟之后，
   * 下一个通道本该是 0 的模板位仍然是上一次渲染留下的 1 —— 因为 `clearBufferfi` 清模板的部分
   * **受 `STENCIL_WRITEMASK` 限制**，而上一条管线刚好把写掩码设成了 0。
   * 这条用例钉住：清屏前必须把两个写掩码置成全写，并且清屏之后缓存要把真实掩码重新下发。
   */
  it('清屏前把两个写掩码置成全写，并让缓存忘掉旧掩码', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    cache.setStencilTest({ ...TWO_FACE_STATE, writeMask: 0 });

    calls.length = 0;
    cache.prepareClear(true);
    expect(calls).toEqual([
      'depthMask',
      'stencilMaskSeparate:FRONT:0xffffffff',
      'stencilMaskSeparate:BACK:0xffffffff',
    ]);

    // 清屏绕过了缓存，所以下一次下发必须把真实的写掩码重新写回去（否则模板永远写得进去）。
    calls.length = 0;
    cache.setStencilTest({ ...TWO_FACE_STATE, writeMask: 0 });
    expect(calls).toContain('stencilMaskSeparate:FRONT:0x0');
    expect(calls).toContain('stencilMaskSeparate:BACK:0x0');
  });

  it('没有模板位的附件清屏时不动模板掩码', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    cache.setStencilTest({ ...TWO_FACE_STATE, writeMask: 0x0f });

    calls.length = 0;
    cache.prepareClear(false);
    expect(calls).toEqual(['depthMask']);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* 双面的语义                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

describe('双面模板：front / back 完全独立', () => {
  it('同一份解析结果下发后，FRONT 与 BACK 的参数互不相同（不会被复制成一份）', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);
    const front: StencilFaceState = { compare: 'equal', failOp: 'zero', depthFailOp: 'keep', passOp: 'replace' };
    const back: StencilFaceState = { compare: 'not-equal', failOp: 'invert', depthFailOp: 'decrement-clamp', passOp: 'keep' };

    applyRenderState(cache, resolveStencil({ depthWriteEnabled: true, stencilFront: front, stencilBack: back }), 2);

    const funcs = calls.filter((call) => call.startsWith('stencilFuncSeparate'));
    const ops = calls.filter((call) => call.startsWith('stencilOpSeparate'));
    expect(funcs[0]).toContain('FRONT:0x202:2');
    expect(funcs[1]).toContain('BACK:0x205:2');
    expect(ops[0]).toBe('stencilOpSeparate:FRONT:0x0:0x1e00:0x1e01');
    expect(ops[1]).toBe('stencilOpSeparate:BACK:0x150a:0x1e03:0x1e00');
  });

  it('读掩码是被两个面共用的，写掩码也是（与 WebGPU 的单值语义一致）', () => {
    const { gl, calls } = createFakeGl();
    const cache = new GlStateCache(gl);

    cache.setStencilTest(TWO_FACE_STATE);

    expect(calls.filter((call) => call.startsWith('stencilFuncSeparate'))).toEqual([
      'stencilFuncSeparate:FRONT:0x202:3:0xf',
      'stencilFuncSeparate:BACK:0x204:3:0xf',
    ]);
    expect(calls.filter((call) => call.startsWith('stencilMaskSeparate'))).toEqual([
      'stencilMaskSeparate:FRONT:0x80',
      'stencilMaskSeparate:BACK:0x80',
    ]);
  });
});
