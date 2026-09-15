/**
 * 异步管线预热 + 编译诊断的测试。
 *
 * 三个层面：
 * 1. **WebGL2 的 program 异步链接**（`ProgramCache.compileAsync`）：用假的
 *    `KHR_parallel_shader_compile` 验证 `COMPLETION_STATUS_KHR` 轮询确实**先于**
 *    `LINK_STATUS` 查询发生（那才是「没有阻塞」的机制证据），以及预热之后 `acquire()`
 *    是**零 GL 编译调用**的缓存命中；
 * 2. **WebGL2 设备级入口**（`prewarmWebGL2RenderPipeline`）：真的建出管线，并验证
 *    「预热后 `createRenderPipeline()` 不再产生任何 compileShader / linkProgram」；
 * 3. **WebGPU 入口**：`createRenderPipelineAsync` 被使用、结果进 variant 缓存、
 *    缺失该接口时如实降级为 `mode: 'sync'`；以及 `GPUShaderModule.getCompilationInfo()`
 *    的 `type` / `lineNum` / `linePos` 映射。
 *
 * 诊断的「真实行号」在两个后端都验证：WebGL2 侧由假 GL 从**实际交给 `gl.shaderSource`
 * 的最终源码**里找出错行（而不是写死一个数字）；WebGPU 侧断言原生 message 原样透传。
 */

import { describe, expect, it } from 'vitest';

import { ProgramCache } from '../src/webgl2/pipeline/ProgramCache.js';
import { programCacheOf, prewarmWebGL2RenderPipeline } from '../src/webgl2/pipeline/Prewarm.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { prewarmWebGPURenderPipeline } from '../src/webgpu/pipeline/Prewarm.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import { ValidationError } from '../src/core/errors/index.js';
import {
  formatCompilationMessage,
  parseGlCompilationLog,
} from '../src/core/pipeline/CompilationInfo.js';
import type { RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';

/* ------------------------------------------------------------------------------------------------ */
/* 假 WebGL2：shader / program / KHR_parallel_shader_compile                                          */
/* ------------------------------------------------------------------------------------------------ */

const GL_VERTEX_SHADER = 0x8b31;
const GL_FRAGMENT_SHADER = 0x8b30;
const GL_COMPILE_STATUS = 0x8b81;
const GL_LINK_STATUS = 0x8b82;
const GL_ACTIVE_ATTRIBUTES = 0x8b89;
const GL_ACTIVE_UNIFORMS = 0x8b86;
const GL_ACTIVE_UNIFORM_BLOCKS = 0x8a36;
const GL_COMPLETION_STATUS_KHR = 0x91b9;

/** 让某个 shader 编译失败的标记（大小写敏感，`VS` / `FS` 里不出现）。 */
const BROKEN_MARKER = 'brokenSymbol';

/** 假 GL 从**实际交给 `gl.shaderSource` 的源码**里算出出错行号。 */
function glLogFor(source: string): string {
  const lines = source.split('\n');
  const index = lines.findIndex((line) => line.includes(BROKEN_MARKER));
  if (index < 0) return '';
  return `ERROR: 0:${index + 1}: '${BROKEN_MARKER}' : undeclared identifier`;
}

interface FakeProgramGl {
  /** 建好之后回填（`make` 风格：先有 state 才能引用它自己）。 */
  gl: WebGL2RenderingContext;
  /** 按顺序记录的 GL 调用（用于验证 COMPLETION 查询与 LINK_STATUS 的先后）。 */
  readonly order: string[];
  readonly counters: {
    createShader: number;
    createProgram: number;
    linkProgram: number;
    shaderSource: number;
  };
  /** `gl.shaderSource` 收到过的全部源码（按顺序）—— 断言行号时用它的真实内容算。 */
  readonly allSources: string[];
  /** 每次 `LINK_STATUS` 查询之前，该 program 的 COMPLETION 查询是否已经返回过 true。 */
  readonly linkStatusOrder: string[];
  /** 关掉 `KHR_parallel_shader_compile`。 */
  extension: boolean;
  /** 让所有 COMPLETION 查询永远返回 false（用于超时测试）。 */
  neverCompletes: boolean;
}

function createFakeProgramGl(options: { extension: boolean } = { extension: true }): FakeProgramGl {
  const order: string[] = [];
  const linkStatusOrder: string[] = [];
  const allSources: string[] = [];
  const counters = { createShader: 0, createProgram: 0, linkProgram: 0, shaderSource: 0 };
  const pending = new WeakMap<object, number>();
  const sources = new WeakMap<object, string>();
  const names = new WeakMap<object, string>();
  const linked = new WeakMap<object, boolean>();
  let nextId = 0;

  const state: FakeProgramGl = {
    gl: null as unknown as WebGL2RenderingContext,
    order,
    counters,
    allSources,
    linkStatusOrder,
    extension: options.extension,
    neverCompletes: false,
  };

  function nameOf(value: object, kind: string): string {
    let name = names.get(value);
    if (!name) {
      name = `${kind}${(nextId += 1)}`;
      names.set(value, name);
    }
    return name;
  }

  /** COMPLETION 查询：还要「未完成」几次。 */
  function poll(value: object): boolean {
    if (state.neverCompletes) return false;
    const remaining = pending.get(value) ?? 0;
    if (remaining > 0) {
      pending.set(value, remaining - 1);
      return false;
    }
    return true;
  }

  const gl = {
    VERTEX_SHADER: GL_VERTEX_SHADER,
    FRAGMENT_SHADER: GL_FRAGMENT_SHADER,
    COMPILE_STATUS: GL_COMPILE_STATUS,
    LINK_STATUS: GL_LINK_STATUS,
    ACTIVE_ATTRIBUTES: GL_ACTIVE_ATTRIBUTES,
    ACTIVE_UNIFORMS: GL_ACTIVE_UNIFORMS,
    ACTIVE_UNIFORM_BLOCKS: GL_ACTIVE_UNIFORM_BLOCKS,
    INVALID_INDEX: 0xffffffff,

    createShader: (type: number) => {
      counters.createShader += 1;
      const shader = { type };
      nameOf(shader, 'shader');
      order.push(`createShader:${type}`);
      // 默认「要轮询两次才完成」，这样异步路径一定会经过 COMPLETION_STATUS_KHR 的循环。
      pending.set(shader, 2);
      return shader;
    },
    deleteShader: () => {},
    shaderSource: (shader: object, source: string) => {
      counters.shaderSource += 1;
      sources.set(shader, source);
      allSources.push(source);
    },
    compileShader: (shader: object) => {
      order.push(`compileShader:${nameOf(shader, 'shader')}`);
    },
    getShaderParameter: (shader: object, pname: number) => {
      if (pname === GL_COMPLETION_STATUS_KHR) {
        const complete = poll(shader);
        order.push(`completion(shader):${nameOf(shader, 'shader')}=${complete}`);
        return complete;
      }
      if (pname === GL_COMPILE_STATUS) {
        order.push(`compileStatus:${nameOf(shader, 'shader')}`);
        return !(sources.get(shader) ?? '').includes(BROKEN_MARKER);
      }
      return 0;
    },
    getShaderInfoLog: (shader: object) => glLogFor(sources.get(shader) ?? ''),

    createProgram: () => {
      counters.createProgram += 1;
      const program = {};
      nameOf(program, 'program');
      order.push('createProgram');
      pending.set(program, 2);
      linked.set(program, true);
      return program;
    },
    deleteProgram: () => {},
    attachShader: () => {},
    detachShader: () => {},
    linkProgram: (program: object) => {
      counters.linkProgram += 1;
      order.push(`linkProgram:${nameOf(program, 'program')}`);
    },
    getProgramParameter: (program: object, pname: number) => {
      if (pname === GL_COMPLETION_STATUS_KHR) {
        const complete = poll(program);
        order.push(`completion(program):${nameOf(program, 'program')}=${complete}`);
        return complete;
      }
      if (pname === GL_LINK_STATUS) {
        linkStatusOrder.push(
          order.includes(`completion(program):${nameOf(program, 'program')}=true`)
            ? 'after-completion'
            : 'before-completion',
        );
        return linked.get(program) ?? true;
      }
      return 0;
    },
    getProgramInfoLog: () => '',
    getActiveAttrib: () => null,
    getActiveUniform: () => null,
    getActiveUniformBlockName: () => null,
    getAttribLocation: () => -1,
    getUniformLocation: () => null,
    getExtension: (name: string) =>
      name === 'KHR_parallel_shader_compile' && state.extension
        ? { COMPLETION_STATUS_KHR: GL_COMPLETION_STATUS_KHR }
        : null,
    useProgram: () => {},
  } as unknown as WebGL2RenderingContext;

  state.gl = gl;
  return state;
}

/* ------------------------------------------------------------------------------------------------ */
/* WebGL2：ProgramCache.compileAsync                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const VS = '#version 300 es\nvoid main() { gl_Position = vec4(0.0); }\n';
const FS = '#version 300 es\nout vec4 c;\nvoid main() { c = vec4(1.0); }\n';
const BROKEN_FS = `#version 300 es\nout vec4 c;\nvoid main() {\n  c = vec4(1.0);\n  ${BROKEN_MARKER}();\n}\n`;

describe('ProgramCache.compileAsync（WebGL2 异步链接）', () => {
  it('有 KHR_parallel_shader_compile 时：用 COMPLETION_STATUS_KHR 轮询，且 LINK_STATUS 在完成之后才查', async () => {
    const fake = createFakeProgramGl({ extension: true });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const outcome = await cache.compileAsync('async-program', VS, FS);

    expect(outcome.ok).toBe(true);
    expect(outcome.mode).toBe('async');
    expect(outcome.reason).toBeNull();
    expect(outcome.compiled).not.toBeNull();
    expect(outcome.compiled!.linkMode).toBe('async');
    expect(outcome.info.hasErrors).toBe(false);

    // 机制证据：COMPLETION_STATUS_KHR 至少被问过一次，而且 LINK_STATUS 只出现在它返回 true 之后。
    // 如果实现直接查 LINK_STATUS，那次调用会阻塞到链接完成 —— 那就不是异步了。
    expect(fake.order.some((entry) => entry.startsWith('completion(program)'))).toBe(true);
    expect(fake.linkStatusOrder).toEqual(['after-completion']);
  });

  it('预热之后再 acquire() 是纯缓存命中：一次 GL 编译/链接调用都不发生', async () => {
    const fake = createFakeProgramGl({ extension: true });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const outcome = await cache.compileAsync('cache-hit', VS, FS);
    const afterPrewarm = { ...fake.counters };

    const acquired = cache.acquire('cache-hit', VS, FS);

    expect(acquired).toBe(outcome.compiled);
    expect(fake.counters).toEqual(afterPrewarm);
    expect(cache.size).toBe(1);
  });

  it('并发预热同一对源码只链接一次（按缓存键去重）', async () => {
    const fake = createFakeProgramGl({ extension: true });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const [first, second] = await Promise.all([
      cache.compileAsync('same-source', VS, FS),
      cache.compileAsync('same-source', VS, FS),
    ]);

    expect(first.compiled).toBe(second.compiled);
    expect(fake.counters.linkProgram).toBe(1);
    expect(fake.counters.createShader).toBe(2);
  });

  it('没有扩展时如实降级成同步（mode=sync + 说明缺什么），但仍然可用', async () => {
    const fake = createFakeProgramGl({ extension: false });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const outcome = await cache.compileAsync('sync-fallback', VS, FS);

    expect(outcome.ok).toBe(true);
    expect(outcome.mode).toBe('sync');
    expect(outcome.reason).toMatch(/KHR_parallel_shader_compile/);
    expect(outcome.compiled!.linkMode).toBe('sync');
    // 降级路径不查 COMPLETION_STATUS_KHR（扩展都不在）。
    expect(fake.order.some((entry) => entry.startsWith('completion('))).toBe(false);
  });

  it('降级路径不能把 COMPILE_STATUS 当“完成标志”去轮询（编译失败必须立刻报出来）', async () => {
    const fake = createFakeProgramGl({ extension: false });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    // timeoutMs=0：只要实现还在轮询「结果」而不是「完成标志」，这里就会退化成超时。
    const outcome = await cache.compileAsync('broken-sync', VS, BROKEN_FS, { timeoutMs: 0 });

    expect(outcome.ok).toBe(false);
    expect(outcome.mode).toBe('sync');
    expect(outcome.reason).toMatch(/shader compilation failed/);
    expect(outcome.reason).not.toMatch(/did not finish within/);
    expect(outcome.info.messages.some((message) => message.type === 'error')).toBe(true);
  });

  it('着色器编译失败：ok=false、带真实行号的诊断、不抛错', async () => {
    const fake = createFakeProgramGl({ extension: true });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const outcome = await cache.compileAsync('broken-program', VS, BROKEN_FS);

    expect(outcome.ok).toBe(false);
    expect(outcome.compiled).toBeNull();
    expect(outcome.info.hasErrors).toBe(true);
    expect(cache.size).toBe(0);

    const message = outcome.info.messages[0]!;
    expect(message.type).toBe('error');
    expect(message.backend).toBe('webgl2');
    // fs 是第二个编译的 shader，所以 stage 应当是 fragment。
    expect(message.stage).toBe(ShaderStage.Fragment);
    expect(message.label).toBe('broken-program / fragment');
    expect(message.linePos).toBeNull(); // GL 日志只有行号，没有列号。
    expect(message.message).toContain('undeclared identifier');

    // 「真实行号」：假 GL 从**实际交给 gl.shaderSource 的最终源码**里找出错行。
    // 这里的源码就是传进来的原文（本用例直接调 ProgramCache，没有经过 GLSL 前言包装），
    // 所以 brokenSymbol() 正好落在第 5 行 —— 行号是从源码算出来的，不是常量。
    const wrapped = fake.allSources.find((source) => source.includes(BROKEN_MARKER))!;
    const expectedLine = wrapped.split('\n').findIndex((line) => line.includes(BROKEN_MARKER)) + 1;
    expect(message.lineNum).toBe(expectedLine);
    expect(expectedLine).toBe(5);
    expect(expectedLine).toBeGreaterThan(1);

    // 可操作：格式化输出里带上 label、后端、阶段与行号。
    const text = formatCompilationMessage(message);
    expect(text).toMatch(/^\[gpu-device-api\] shader "broken-program \/ fragment" \(webgl2, fragment\) \d+:/);
    expect(text).toContain('error:');
    // 原始 GL 日志原文一并保留，便于排查驱动特有格式。
    expect(outcome.info.rawLogs[0]).toContain(`ERROR: 0:${expectedLine}`);
  });

  it('超时不会抛错，而是 ok=false + reason 说明（资源被清理，缓存不长东西）', async () => {
    const fake = createFakeProgramGl({ extension: true });
    fake.neverCompletes = true;
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const outcome = await cache.compileAsync('never-finishes', VS, FS, { timeoutMs: 0 });

    expect(outcome.ok).toBe(false);
    expect(outcome.mode).toBe('async');
    expect(outcome.reason).toMatch(/did not finish within/);
    expect(cache.size).toBe(0);
  });

  it('链接过程中 clear() 不会把结果写进已经清空的缓存', async () => {
    const fake = createFakeProgramGl({ extension: true });
    const cache = new ProgramCache({ gl: fake.gl, state: new GlStateCache(fake.gl) });

    const pending = cache.compileAsync('cleared-midway', VS, FS);
    cache.clear();
    const outcome = await pending;

    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toMatch(/cache was cleared/);
    expect(cache.size).toBe(0);
  });

  it('parseGlCompilationLog 兼容 ANGLE 与桌面驱动两种日志格式，认不出的行也不会被丢掉', () => {
    const angle = parseGlCompilationLog(
      "ERROR: 0:12: 'x' : undeclared identifier\nWARNING: 0:20: implicit cast",
      'label',
      'webgl2',
      ShaderStage.Fragment,
    );
    expect(angle).toHaveLength(2);
    expect(angle[0]).toMatchObject({ type: 'error', lineNum: 12, linePos: null });
    expect(angle[1]).toMatchObject({ type: 'warning', lineNum: 20 });
    expect(angle[1]!.message).toBe('implicit cast');

    const desktop = parseGlCompilationLog('0(7) : error C0000: syntax error', 'label', 'webgl2', null);
    expect(desktop).toHaveLength(1);
    expect(desktop[0]).toMatchObject({ type: 'error', lineNum: 7, stage: null });
    // 驱动自己的错误码（C0000）保留在正文里，不要吞掉。
    expect(desktop[0]!.message).toBe('C0000: syntax error');

    const unknown = parseGlCompilationLog('something went wrong', 'label', 'webgl2', null);
    expect(unknown).toHaveLength(1);
    expect(unknown[0]).toMatchObject({ type: 'error', lineNum: null });
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGL2：设备级入口 prewarmWebGL2RenderPipeline                                                      */
/* ------------------------------------------------------------------------------------------------ */

/** 支持到「建出 WebGL2Device + 建管线」这一步的假 GL（复用上面的 program 假实现）。 */
function createDeviceHarness(): { device: WebGL2Device; fake: FakeProgramGl } {
  const fake = createFakeProgramGl({ extension: true });
  const gl = fake.gl as unknown as Record<string, unknown>;
  gl.createVertexArray = () => ({});
  gl.deleteVertexArray = () => {};
  gl.bindVertexArray = () => {};
  gl.getParameter = () => 0;
  gl.getError = () => 0;
  gl.deleteFramebuffer = () => {};
  gl.deleteBuffer = () => {};
  gl.deleteTexture = () => {};
  gl.deleteQuery = () => {};
  gl.deleteSampler = () => {};

  const canvas = {
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;

  const device = new WebGL2Device({
    gl: fake.gl,
    canvas,
    descriptor: { label: 'prewarm-device' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
  return { device, fake };
}

function descriptorFor(device: WebGL2Device, fragment: string, label: string): RenderPipelineDescriptor {
  const module = device.createShaderModule({
    label: `${label}-shader`,
    code: {
      vs: 'layout(location = 0) in vec3 position;\nvoid main() { gl_Position = vec4(position, 1.0); }',
      fs: fragment,
    },
  });
  return {
    label,
    vertex: {
      module,
      buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
    },
    fragment: { module, targets: [{ format: 'rgba8unorm' }] },
    colorFormats: ['rgba8unorm' as TextureFormat],
  };
}

describe('prewarmWebGL2RenderPipeline（设备级异步预热入口）', () => {
  it('预热后建管线不再产生任何 compileShader / linkProgram（卡顿被挪出关键路径）', async () => {
    const { device, fake } = createDeviceHarness();

    const result = await prewarmWebGL2RenderPipeline(device, descriptorFor(device, FS, 'warm'));

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('async');
    expect(result.reason).toBeNull();
    expect(result.backend).toBe('webgl2');
    expect(result.pipeline).not.toBeNull();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(device.programs.size).toBe(1);

    const afterPrewarm = { ...fake.counters };
    expect(afterPrewarm.linkProgram).toBe(1);

    // 关键判据：再走一次正常的创建路径，GL 侧一次编译/链接都不发生（program 缓存命中）。
    const pipeline = device.createRenderPipeline(descriptorFor(device, FS, 'warm'));
    expect(fake.counters).toEqual(afterPrewarm);
    expect(pipeline.compiled).toBe(true);

    device.dispose();
  });

  it('管线对象上的 prewarm()/getCompilationInfo() 与设备级入口一致', async () => {
    const { device } = createDeviceHarness();
    const result = await prewarmWebGL2RenderPipeline(device, descriptorFor(device, FS, 'report'));
    const pipeline = result.pipeline!;

    expect(typeof pipeline.prewarm).toBe('function');
    const report = await pipeline.prewarm!({});
    expect(report.mode).toBe('async');
    expect(report.ok).toBe(true);
    expect(report.info.messages).toEqual([]);

    const info = await pipeline.getCompilationInfo!();
    expect(info.label).toBe('report');
    expect(info.backend).toBe('webgl2');
    expect(info.hasErrors).toBe(false);

    device.dispose();
  });

  it('没预热过就建管线时，pipeline.prewarm() 如实汇报 mode=sync 并给出建议', async () => {
    const { device } = createDeviceHarness();
    const pipeline = device.createRenderPipeline(descriptorFor(device, FS, 'cold'));

    const report = await pipeline.prewarm!({});
    expect(report.ok).toBe(true);
    expect(report.mode).toBe('sync');
    expect(report.reason).toMatch(/ProgramCache\.compileAsync/);

    device.dispose();
  });

  it('着色器有错时：ok=false、pipeline=null，诊断能指到真实行号', async () => {
    const { device, fake } = createDeviceHarness();
    const result = await prewarmWebGL2RenderPipeline(device, descriptorFor(device, BROKEN_FS, 'broken'));

    expect(result.ok).toBe(false);
    expect(result.pipeline).toBeNull();
    const message = result.info.messages[0]!;
    expect(message.type).toBe('error');
    expect(message.stage).toBe(ShaderStage.Fragment);
    expect(message.message).toContain('undeclared identifier');

    // 行号是从**实际交给 gl.shaderSource 的最终源码**里算出来的，不是写死的。
    const wrapped = fake.allSources.find((source) => source.includes(BROKEN_MARKER))!;
    const expectedLine = wrapped.split('\n').findIndex((line) => line.includes(BROKEN_MARKER)) + 1;
    expect(message.lineNum).toBe(expectedLine);
    expect(expectedLine).toBeGreaterThan(5); // #version + 精度前言把错行推到了第 6 行之后。

    // throwOnError 才会抛，默认不抛（预热不该让渲染挂掉）。
    await expect(
      prewarmWebGL2RenderPipeline(device, descriptorFor(device, BROKEN_FS, 'broken2'), { throwOnError: true }),
    ).rejects.toThrowError(/\[gpu-device-api\] compilation info/);

    device.dispose();
  });

  it('programCacheOf 对非 WebGL2 设备给出明确错误', () => {
    expect(() => programCacheOf({ backend: 'webgpu' } as never)).toThrowError(ValidationError);
    expect(() => programCacheOf({ backend: 'webgpu' } as never)).toThrowError(
      /expected a WebGL2 device created by this library/,
    );
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGPU                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

interface MockGpuDevice {
  /** 建好之后回填。 */
  device: WebGPUDevice;
  readonly counts: {
    createRenderPipeline: number;
    createRenderPipelineAsync: number;
    createShaderModule: number;
  };
  /** 关掉 `createRenderPipelineAsync`（模拟老实现）。 */
  enableAsync: boolean;
  /** 让 `createRenderPipelineAsync` 拒绝（模拟管线校验/编译失败）。 */
  failAsync: boolean;
  /** 每个 shader label 对应的编译诊断。 */
  messages: Record<string, GPUCompilationMessage[]>;
}

function createMockGpuDevice(): MockGpuDevice {
  const counts = { createRenderPipeline: 0, createRenderPipelineAsync: 0, createShaderModule: 0 };
  const state: MockGpuDevice = {
    device: null as unknown as WebGPUDevice,
    counts,
    enableAsync: true,
    failAsync: false,
    messages: {},
  };

  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    onuncapturederror: null,
    limits: undefined,
    createShaderModule: ({ label }: { label: string }) => {
      counts.createShaderModule += 1;
      return {
        label,
        getCompilationInfo: () => Promise.resolve({ messages: state.messages[label] ?? [] }),
      };
    },
    createRenderPipeline: (descriptor: { label?: string }) => {
      counts.createRenderPipeline += 1;
      return { label: descriptor.label, via: 'sync' };
    },
    destroy: () => {},
  } as unknown as Record<string, unknown>;

  Object.defineProperty(native, 'createRenderPipelineAsync', {
    configurable: true,
    get: () =>
      state.enableAsync
        ? (descriptor: { label?: string }) => {
            counts.createRenderPipelineAsync += 1;
            if (state.failAsync) {
              return Promise.reject(new Error('GPUPipelineError: shader module compilation failed'));
            }
            return Promise.resolve({ label: descriptor.label, via: 'async' });
          }
        : undefined,
  });

  state.device = new WebGPUDevice(native as unknown as GPUDevice, {
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
  return state;
}

function gpuDescriptor(device: WebGPUDevice, label: string): RenderPipelineDescriptor {
  const module = device.createShaderModule({
    label: `${label}-shader`,
    code: '/* wgsl */\n@vertex fn vsMain() -> @builtin(position) vec4f { return vec4f(0.0); }',
  });
  return {
    label,
    vertex: { module, buffers: [] },
    fragment: { module, targets: [{ format: 'rgba8unorm' }] },
    colorFormats: ['rgba8unorm'],
  };
}

const VARIANT = {
  colorFormats: ['rgba8unorm' as TextureFormat],
  sampleCount: 1,
  depthFormat: null,
  vertexLayouts: [],
};

describe('prewarmWebGPURenderPipeline（createRenderPipelineAsync）', () => {
  it('走 createRenderPipelineAsync，并把结果写进 variant 缓存（首次 resolve 零 GPU 编译调用）', async () => {
    const mock = createMockGpuDevice();
    const result = await prewarmWebGPURenderPipeline(
      mock.device,
      gpuDescriptor(mock.device, 'wgpu-warm'),
      VARIANT,
    );

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('async');
    expect(result.reason).toBeNull();
    expect(result.backend).toBe('webgpu');
    expect(result.pipeline).not.toBeNull();
    expect(mock.counts.createRenderPipelineAsync).toBe(1);
    expect(mock.counts.createRenderPipeline).toBe(0);

    const resolved = result.pipeline!.resolve(VARIANT) as { via?: string };
    expect(resolved.via).toBe('async');
    // 首次 resolve 没有产生新的编译调用 —— 这正是预热的意义。
    expect(mock.counts.createRenderPipeline).toBe(0);
    expect(mock.counts.createRenderPipelineAsync).toBe(1);

    mock.device.dispose();
  });

  it('实现没有 createRenderPipelineAsync 时如实降级为 mode=sync', async () => {
    const mock = createMockGpuDevice();
    mock.enableAsync = false;
    const result = await prewarmWebGPURenderPipeline(
      mock.device,
      gpuDescriptor(mock.device, 'wgpu-sync'),
      VARIANT,
    );

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('sync');
    expect(result.reason).toMatch(/createRenderPipelineAsync/);
    expect(mock.counts.createRenderPipeline).toBe(1);
    expect((result.pipeline!.resolve(VARIANT) as { via?: string }).via).toBe('sync');

    mock.device.dispose();
  });

  it('createRenderPipelineAsync 拒绝时不抛错：ok=false、reason 带原文、缓存里不留东西', async () => {
    const mock = createMockGpuDevice();
    mock.failAsync = true;
    const result = await prewarmWebGPURenderPipeline(
      mock.device,
      gpuDescriptor(mock.device, 'wgpu-fail'),
      VARIANT,
    );

    expect(result.ok).toBe(false);
    expect(result.pipeline).toBeNull();
    expect(result.reason).toContain('GPUPipelineError');
    expect(result.info.hasErrors).toBe(true);
    expect(result.info.messages.some((message) => message.type === 'error')).toBe(true);

    mock.device.dispose();
  });

  it('诊断：GPUShaderModule.getCompilationInfo 的 type/lineNum/linePos 被归一（0 视为未知）', async () => {
    const mock = createMockGpuDevice();
    mock.messages['diag-shader'] = [
      { type: 'error', lineNum: 7, linePos: 3, message: 'expected )' },
      { type: 'warning', lineNum: 0, linePos: 0, message: 'unused variable' },
      { type: 'info', lineNum: 12, linePos: 1, message: 'entry point vsMain' },
    ] as unknown as GPUCompilationMessage[];

    const result = await prewarmWebGPURenderPipeline(mock.device, gpuDescriptor(mock.device, 'diag'), VARIANT);
    const info = await result.pipeline!.getCompilationInfo!(VARIANT);

    expect(info.label).toBe('diag');
    expect(info.backend).toBe('webgpu');
    // 同一个 module 同时给 vertex / fragment 用时只报一次（WGSL 是「一个 module 含全部 entry point」）。
    expect(info.messages).toHaveLength(3);
    expect(info.messages[0]).toMatchObject({
      type: 'error',
      lineNum: 7,
      linePos: 3,
      message: 'expected )',
      stage: ShaderStage.Vertex,
      label: 'diag-shader',
      backend: 'webgpu',
    });
    // WebGPU 用 0 表示「不知道」，这里必须是 null 而不是 0。
    expect(info.messages[1]).toMatchObject({ type: 'warning', lineNum: null, linePos: null });
    expect(info.messages[2]).toMatchObject({ type: 'info', lineNum: 12, linePos: 1 });
    expect(info.hasErrors).toBe(true);

    mock.device.dispose();
  });

  it('throwOnError 会把诊断包成带前缀的 ValidationError', async () => {
    const mock = createMockGpuDevice();
    mock.failAsync = true;
    await expect(
      prewarmWebGPURenderPipeline(mock.device, gpuDescriptor(mock.device, 'wgpu-throw'), VARIANT, {
        throwOnError: true,
      }),
    ).rejects.toThrowError(/^\[gpu-device-api\] compilation info/);
    mock.device.dispose();
  });
});
