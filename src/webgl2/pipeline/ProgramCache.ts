/**
 * GL program 缓存。
 *
 * 一个 WebGL2 的 program = 一个 vertex shader + 一个 fragment shader 链接而来，
 * 所以缓存键就是这两份**已经包好前言的最终源码**（`src/shaders` 的 `compileShaderStage` 产出）。
 * 同一对源码只会编译链接一次，多条管线、多个材质共享同一个 program。
 *
 * 链接成功后还要做两件 GL 专属的收尾工作，这里一并完成：
 * 1. **绑定 uniform block**：把布局计划里的 block binding 点写进 program
 *    （`gl.uniformBlockBinding`）。GL 的 block 索引是 program 私有的，必须逐个 program 设置。
 * 2. **给 sampler uniform 赋纹理单元**：`gl.uniform1i(location, unit)`，同样只做一次。
 *
 * 最关键的是随后的**交叉校验**：把 program 的实际接口与布局计划对照，
 * 报出「着色器用了但布局没声明」和「布局声明了但着色器没用」。
 * 前者会让程序读到垃圾数据、画面全黑却毫无报错，是 WebGL 里最难查的一类问题。
 *
 * ## 同步 `acquire()` 与异步 {@link ProgramCache.compileAsync}
 *
 * `acquire()` 是**同步**的：`gl.getProgramParameter(program, LINK_STATUS)` 会一直阻塞到链接
 * 完成（这是 GL 规范规定的行为），所以「第一次用到某个变体」的那一帧要为编译 + 链接付卡顿。
 *
 * `compileAsync()` 用 `KHR_parallel_shader_compile` 的 `COMPLETION_STATUS_KHR` 做轮询：
 * 那个查询**不会阻塞**，返回 false 就说明还在编译，让出一轮事件循环再问。
 * 等它返回 true 之后再去查 `COMPILE_STATUS` / `LINK_STATUS`（这时才不会阻塞）。
 * 链接结果会写进与 `acquire()` **相同的缓存键**，于是后续 `device.createRenderPipeline()`
 * 里的 `acquire()` 直接命中、一次 GL 调用都不发生。
 *
 * 扩展不可用时**如实降级**：`compileAsync()` 仍然可用，但内部就是同步的，
 * 返回的 `mode` 是 `'sync'`、`reason` 说明缺 `KHR_parallel_shader_compile`。
 * 不会假装异步。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { ShaderStage } from '../../core/enums/ShaderStage.js';
import type {
  CompilationInfo,
  CompilationMessage,
  PrewarmMode,
  PrewarmOptions,
  PrewarmResult,
} from '../../core/pipeline/CompilationInfo.js';
import {
  DEFAULT_PREWARM_TIMEOUT_MS,
  createCompilationInfo,
  parseGlCompilationLog,
  nowMs,
  yieldToEventLoop,
} from '../../core/pipeline/CompilationInfo.js';
import {
  glslTypeName,
  isSamplerType,
  reflectGlslProgram,
  type GlslProgramReflection,
} from '../../shaders/reflection/GLSLReflector.js';
import type { WebGLBindingPlan } from '../binding/TextureUnitAllocator.js';
import type { GlStateCache } from '../utils/glStateCache.js';

export interface CompiledProgram {
  readonly program: WebGLProgram;
  readonly reflection: GlslProgramReflection;
  /** `group:binding` 到 gl.uniformBlockBinding 用的 block binding 点（`bindPlan` 之后填充）。 */
  blockBindings: ReadonlyMap<string, number>;
  /** `group:binding` 到 sampler uniform 的位置（`bindPlan` 之后填充）。 */
  samplerLocations: ReadonlyMap<string, WebGLUniformLocation>;
  /** 被优化掉的 uniform block 名字（着色器里声明了但没用到），仅用于诊断。 */
  optimizedOutBlocks: readonly string[];
  readonly label: string;
  /** 已经绑定过哪个计划；`null` 表示还没绑定。 */
  boundPlanKey: string | null;
  /** 这个 program 是怎么链接出来的：`'async'` 表示走过 {@link ProgramCache.compileAsync} 的真异步等待。 */
  readonly linkMode: PrewarmMode;
  /** 不是真异步时的原因（缺扩展 / 是同步 `acquire()` 链出来的）；真异步时为 `null`。 */
  readonly linkReason: string | null;
  /** 编译 + 链接阶段的诊断（WebGL 的日志原文与解析出的行号）。 */
  readonly compilationInfo: CompilationInfo;
}

/** 内部用来就地填充只读字段的辅助类型。 */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface ProgramCacheOptions {
  gl: WebGL2RenderingContext;
  state: GlStateCache;
}

/** `KHR_parallel_shader_compile` 用到的部分（只需这一个常量）。 */
interface ParallelShaderCompileExtension {
  readonly COMPLETION_STATUS_KHR: number;
}

/** 扩展缺失时的降级说明（`mode` 为 `'sync'` 时写进 `reason`）。 */
const PARALLEL_COMPILE_MISSING =
  'KHR_parallel_shader_compile is not available on this WebGL2 context; gl.linkProgram() cannot be ' +
  'awaited asynchronously because querying LINK_STATUS blocks until linking finishes';

/** 同步 `acquire()` 链出来的 program 的说明。 */
const SYNC_ACQUIRE_REASON =
  'the program was linked synchronously by ProgramCache.acquire() while the pipeline was created; ' +
  'call ProgramCache.compileAsync() (or prewarmWebGL2RenderPipeline) before createRenderPipeline() ' +
  'to move the compile and link cost off the critical path';

/** `compileAsync()` 的结果。 */
export interface ProgramPrewarmOutcome {
  /** 链接成功的 program；失败或超时时为 `null`。 */
  readonly compiled: CompiledProgram | null;
  readonly ok: boolean;
  readonly mode: PrewarmMode;
  readonly reason: string | null;
  readonly durationMs: number;
  readonly info: CompilationInfo;
}

/** 缓存键：vertex 与 fragment 的最终源码，用一个不可能出现在源码里的分隔符拼起来。 */
export function programCacheKey(vertexSource: string, fragmentSource: string): string {
  return `${vertexSource}\u0000${fragmentSource}`;
}

export class ProgramCache {
  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly programs = new Map<string, CompiledProgram>();
  /** 正在进行中的异步链接，按缓存键去重（同一对源码并发预热只会链接一次）。 */
  private readonly pending = new Map<string, Promise<ProgramPrewarmOutcome>>();
  /** `KHR_parallel_shader_compile` 的探测结果；`undefined` 表示还没查过。 */
  private parallelExtension: ParallelShaderCompileExtension | null | undefined = undefined;
  /** `clear()` 会自增它：异步链接完成时若代数变了就不再往缓存里写（否则会泄漏一个没人释放的 program）。 */
  private generation = 0;

  constructor(options: ProgramCacheOptions) {
    this.gl = options.gl;
    this.state = options.state;
  }

  get size(): number {
    return this.programs.size;
  }

  /**
   * 取得（或编译）一个 program。
   *
   * 只做「编译 + 链接 + 反射」，**不绑定 binding** —— 因为 `layout: 'auto'` 需要先链接出
   * program 才能反射出接口、再据此推断布局。绑定是第二步，见 {@link ProgramCache.bindPlan}。
   *
   * 这是**同步**路径：需要真正异步请用 {@link ProgramCache.compileAsync}。
   *
   * @param vertexSource 已包好 `#version` 与精度声明的顶点着色器源码
   * @param fragmentSource 已包好的片元着色器源码
   */
  acquire(label: string, vertexSource: string, fragmentSource: string): CompiledProgram {
    const key = programCacheKey(vertexSource, fragmentSource);
    const cached = this.programs.get(key);
    if (cached) return cached;

    const gl = this.gl;
    const messages: CompilationMessage[] = [];
    const rawLogs: string[] = [];

    const vertexShader = this.compileShader(
      ShaderStage.Vertex,
      gl.VERTEX_SHADER,
      vertexSource,
      `${label} / vertex`,
      messages,
      rawLogs,
    );
    const fragmentShader = this.compileShader(
      ShaderStage.Fragment,
      gl.FRAGMENT_SHADER,
      fragmentSource,
      `${label} / fragment`,
      messages,
      rawLogs,
    );

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new ValidationError('[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // 链接完成后 shader 对象就可以删除了：program 会持有编译结果。
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    collectLog(gl.getProgramInfoLog(program), label, null, messages, rawLogs);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
    if (!linked) {
      const log = gl.getProgramInfoLog(program) ?? '(无日志)';
      gl.deleteProgram(program);
      throw new ValidationError(
        `[gpu-device-api] program「${label}」链接失败。vertex 与 fragment 的 varying（in/out）名字、\n` +
          '类型与数量必须完全对应。\n' +
          `GL 日志：${log}`,
      );
    }

    const reflection = reflectGlslProgram(gl, program);

    const compiled: CompiledProgram = {
      program,
      reflection,
      blockBindings: new Map(),
      samplerLocations: new Map(),
      optimizedOutBlocks: [],
      label,
      boundPlanKey: null,
      linkMode: 'sync',
      linkReason: SYNC_ACQUIRE_REASON,
      compilationInfo: createCompilationInfo({ label, backend: 'webgl2', messages, rawLogs }),
    };
    this.programs.set(key, compiled);
    return compiled;
  }

  /**
   * **异步**编译 + 链接（管线预热的入口）。
   *
   * 与 `acquire()` 的语义完全一致（同一份缓存键、同一个 `CompiledProgram`），区别只在于等待方式：
   *
   * - 有 `KHR_parallel_shader_compile` 时用 `COMPLETION_STATUS_KHR` 轮询，**不阻塞**调用方
   *   （每次轮询之间让出一轮事件循环），`mode` 为 `'async'`；
   * - 没有该扩展时退化成同步，`mode` 为 `'sync'` 且 `reason` 说明原因；
   * - 超时（默认 30s）不算抛错：`ok` 为 false、`reason` 说明超时，资源会被清理。
   *
   * 编译/链接失败**不抛错**（预热不该让渲染挂掉）：`ok` 为 false，
   * 诊断（含真实行号）在 `info` 里；调用方想直接抛错可以看 `info.hasErrors` 自己决定。
   *
   * 成功时会写进与 `acquire()` 相同的缓存，所以随后 `device.createRenderPipeline()` 里的
   * `acquire()` 会直接命中 —— 这是「预热有效」的判据（可以数 GL 调用次数来验证）。
   */
  async compileAsync(
    label: string,
    vertexSource: string,
    fragmentSource: string,
    options: PrewarmOptions = {},
  ): Promise<ProgramPrewarmOutcome> {
    const key = programCacheKey(vertexSource, fragmentSource);
    const cached = this.programs.get(key);
    if (cached) {
      return {
        compiled: cached,
        ok: !cached.compilationInfo.hasErrors,
        mode: cached.linkMode,
        reason: cached.linkMode === 'sync' ? cached.linkReason : null,
        durationMs: 0,
        info: cached.compilationInfo,
      };
    }
    const pending = this.pending.get(key);
    if (pending) return pending;

    const task = this.linkAsync(label, vertexSource, fragmentSource, key, options);
    this.pending.set(key, task);
    try {
      return await task;
    } finally {
      this.pending.delete(key);
    }
  }

  /** 把一次预热结果转成通用的 {@link PrewarmResult}（供 pipeline / device 层转发）。 */
  static toPrewarmResult(label: string, outcome: ProgramPrewarmOutcome): PrewarmResult {
    return {
      label,
      backend: 'webgl2',
      ok: outcome.ok,
      mode: outcome.mode,
      reason: outcome.reason,
      durationMs: outcome.durationMs,
      info: outcome.info,
    };
  }

  /**
   * 把绑定计划写进 program：设置 uniform block 的 binding 点、给 sampler uniform 赋纹理单元，
   * 并把 program 的实际接口与计划做交叉校验。
   *
   * 可以安全地重复调用（同一个计划只生效一次），因为 `layout: 'auto'` 的流程里
   * 计划要等链接完才能算出来。
   */
  bindPlan(compiled: CompiledProgram, plan: WebGLBindingPlan | null): void {
    if (compiled.boundPlanKey !== null) return;
    const { blockBindings, samplerLocations, optimizedOutBlocks } = this.bindResources(
      compiled.program,
      compiled.reflection,
      plan,
      compiled.label,
    );
    (compiled as Mutable<CompiledProgram>).blockBindings = blockBindings;
    (compiled as Mutable<CompiledProgram>).samplerLocations = samplerLocations;
    (compiled as Mutable<CompiledProgram>).optimizedOutBlocks = optimizedOutBlocks;
    (compiled as Mutable<CompiledProgram>).boundPlanKey = plan ? plan.key : '';
  }

  /** 释放缓存里的全部 program。 */
  clear(): void {
    // 代数自增：正在进行中的异步链接完成时不会再往（已经清空的）缓存里写。
    this.generation += 1;
    for (const compiled of this.programs.values()) {
      this.gl.deleteProgram(compiled.program);
    }
    this.programs.clear();
    this.state.useProgram(null);
  }

  dispose(): void {
    this.clear();
  }

  /* ------------------------------------------------------------------------------------------------ */

  /** 探测 `KHR_parallel_shader_compile`（按 context 只查一次）。 */
  private parallelCompile(): ParallelShaderCompileExtension | null {
    if (this.parallelExtension !== undefined) return this.parallelExtension;
    const extension = this.gl.getExtension(
      'KHR_parallel_shader_compile',
    ) as ParallelShaderCompileExtension | null;
    this.parallelExtension =
      extension && typeof extension.COMPLETION_STATUS_KHR === 'number' ? extension : null;
    return this.parallelExtension;
  }

  /** `compileAsync()` 的实际实现：编译 → 等 → 链接 → 等 → 反射。 */
  private async linkAsync(
    label: string,
    vertexSource: string,
    fragmentSource: string,
    key: string,
    options: PrewarmOptions,
  ): Promise<ProgramPrewarmOutcome> {
    const gl = this.gl;
    const started = nowMs();
    // 记下当前代数：中途 `clear()` 会让它变化，那时不能把链接结果写进（已经清空的）缓存。
    const generation = this.generation;
    const timeoutMs = options.timeoutMs ?? DEFAULT_PREWARM_TIMEOUT_MS;
    const parallel = this.parallelCompile();
    const mode: PrewarmMode = parallel ? 'async' : 'sync';
    const messages: CompilationMessage[] = [];
    const rawLogs: string[] = [];

    const fail = (reason: string): ProgramPrewarmOutcome => ({
      compiled: null,
      ok: false,
      mode,
      reason,
      durationMs: nowMs() - started,
      info: createCompilationInfo({ label, backend: 'webgl2', messages, rawLogs }),
    });

    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    try {
      vertexShader = this.createShaderObject(gl.VERTEX_SHADER, vertexSource, `${label} / vertex`);
      fragmentShader = this.createShaderObject(gl.FRAGMENT_SHADER, fragmentSource, `${label} / fragment`);

      /*
       * 等两个 shader 编译完。
       *
       * **扩展可用时**：轮询 `COMPLETION_STATUS_KHR`（它才是「好了没有」这个标志，查询本身不阻塞）。
       * **扩展不可用时**：不轮询，直接查结果 —— `COMPILE_STATUS` 是**编译结果**而不是完成标志，
       * 编译失败时它永远是 false，拿它当完成条件会一直等到超时（这个坑实测踩过）。
       * 按 GL 规范，扩展缺失时这次 `COMPILE_STATUS` 查询本身会阻塞到编译结束，
       * 所以同步语义是对的，只是没有异步可言。
       */
      if (parallel) {
        const shadersReady = await this.waitFor(
          () =>
            (gl.getShaderParameter(vertexShader!, parallel.COMPLETION_STATUS_KHR) as boolean) &&
            (gl.getShaderParameter(fragmentShader!, parallel.COMPLETION_STATUS_KHR) as boolean),
          timeoutMs,
        );
        if (!shadersReady) {
          return fail(
            `shader compilation for "${label}" did not finish within ${String(timeoutMs)}ms ` +
              '(polling COMPLETION_STATUS_KHR)',
          );
        }
      }

      const vertexOk = (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) as boolean) === true;
      collectLog(gl.getShaderInfoLog(vertexShader), `${label} / vertex`, ShaderStage.Vertex, messages, rawLogs);
      const fragmentOk = (gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) as boolean) === true;
      collectLog(gl.getShaderInfoLog(fragmentShader), `${label} / fragment`, ShaderStage.Fragment, messages, rawLogs);
      if (!vertexOk || !fragmentOk) {
        const failed = [!vertexOk ? 'vertex' : null, !fragmentOk ? 'fragment' : null]
          .filter((value): value is string => value !== null)
          .join(' + ');
        return fail(`shader compilation failed for "${label}" (${failed} stage); see info.messages`);
      }

      program = gl.createProgram();
      if (!program) {
        return fail(`gl.createProgram() returned null while prewarming "${label}"`);
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
      // shader 对象已经捕获完日志，program 也持有编译结果，可以删了。
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      vertexShader = null;
      fragmentShader = null;

      // 同上：有扩展才轮询完成标志；没有扩展时 `LINK_STATUS` 的查询本身会阻塞到链接结束。
      if (parallel) {
        const linkedReady = await this.waitFor(
          () => gl.getProgramParameter(program!, parallel.COMPLETION_STATUS_KHR) as boolean,
          timeoutMs,
        );
        if (!linkedReady) {
          return fail(
            `program linking for "${label}" did not finish within ${String(timeoutMs)}ms ` +
              '(polling COMPLETION_STATUS_KHR)',
          );
        }
      }

      const linked = (gl.getProgramParameter(program, gl.LINK_STATUS) as boolean) === true;
      collectLog(gl.getProgramInfoLog(program), label, null, messages, rawLogs);
      if (!linked) {
        return fail(`program linking failed for "${label}"; see info.messages`);
      }

      const reflection = reflectGlslProgram(gl, program);
      const compiled: CompiledProgram = {
        program,
        reflection,
        blockBindings: new Map(),
        samplerLocations: new Map(),
        optimizedOutBlocks: [],
        label,
        boundPlanKey: null,
        linkMode: mode,
        linkReason: mode === 'sync' ? PARALLEL_COMPILE_MISSING : null,
        compilationInfo: createCompilationInfo({ label, backend: 'webgl2', messages, rawLogs }),
      };
      // 代数变了说明中途 clear() 过：这个 program 已经没人接管，直接删掉，绝不写进缓存。
      if (this.generation !== generation) {
        gl.deleteProgram(program);
        return fail(`the program cache was cleared while prewarming "${label}"`);
      }
      program = null;
      this.programs.set(key, compiled);
      return {
        compiled,
        ok: true,
        mode,
        reason: mode === 'sync' ? PARALLEL_COMPILE_MISSING : null,
        durationMs: nowMs() - started,
        info: compiled.compilationInfo,
      };
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error));
    } finally {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
    }
  }

  /** 轮询 `check()` 直到返回 true 或超时；每次轮询之间让出一轮事件循环。 */
  private async waitFor(check: () => boolean, timeoutMs: number): Promise<boolean> {
    const started = nowMs();
    for (;;) {
      if (check()) return true;
      if (nowMs() - started > timeoutMs) return false;
      await yieldToEventLoop();
    }
  }

  private createShaderObject(type: number, source: string, label: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new ValidationError(`[gpu-device-api] gl.createShader() 返回 null（${label}）。`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  private compileShader(
    stage: ShaderStage,
    type: number,
    source: string,
    label: string,
    messages: CompilationMessage[],
    rawLogs: string[],
  ): WebGLShader {
    const gl = this.gl;
    const shader = this.createShaderObject(type, source, label);
    const log = gl.getShaderInfoLog(shader) ?? '';
    collectLog(log, label, stage, messages, rawLogs);
    if (!(gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean)) {
      gl.deleteShader(shader);
      // 这里依赖 src/shaders 的 formatShaderErrorLog 把出错行贴出来，避免只给一串 GL 行号。
      throw new ValidationError(
        `[gpu-device-api] 着色器编译失败（${label}）：\n${log || '(无日志)'}\n\n----- 源码 -----\n${numberSource(source)}`,
      );
    }
    return shader;
  }

  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  private bindResources(
    program: WebGLProgram,
    reflection: GlslProgramReflection,
    plan: WebGLBindingPlan | null,
    label: string,
  ): {
    blockBindings: Map<string, number>;
    samplerLocations: Map<string, WebGLUniformLocation>;
    optimizedOutBlocks: string[];
  } {
    const gl = this.gl;
    const blockBindings = new Map<string, number>();
    const samplerLocations = new Map<string, WebGLUniformLocation>();
    const optimizedOutBlocks: string[] = [];

    // ---- uniform block -----------------------------------------------------------------------
    const activeBlocks = new Set(reflection.uniformBlocks.map((block) => block.name));
    if (plan) {
      for (const [slotKey, slot] of plan.uniformBlocks) {
        if (!activeBlocks.has(slot.name)) {
          // 着色器里没用到的块会被 GL 优化掉，这不是错误，只记录下来。
          optimizedOutBlocks.push(slot.name);
          continue;
        }
        const index = gl.getUniformBlockIndex(program, slot.name);
        if (index === gl.INVALID_INDEX) {
          optimizedOutBlocks.push(slot.name);
          continue;
        }
        gl.uniformBlockBinding(program, index, slot.blockBinding);
        blockBindings.set(slotKey, slot.blockBinding);
      }
    }

    // ---- sampler uniform --------------------------------------------------------------------
    const samplerUniforms = reflection.uniforms.filter((uniform) => isSamplerType(uniform.glType));
    if (plan) {
      for (const [, slot] of plan.textures) {
        const location =
          samplerUniforms.find((uniform) => uniform.name === slot.name)?.location ??
          gl.getUniformLocation(program, slot.name);
        if (!location) {
          // 采样器被优化掉（比如该纹理只在被裁剪掉的分支里用到）时也跳过。
          continue;
        }
        gl.uniform1i(location, slot.unit);
        // 反向记录：从 uniform 名字找到它所在的槽位，绑定纹理时要用。
        samplerLocations.set(slot.name, location);
      }
    }

    // ---- 交叉校验 ---------------------------------------------------------------------------
    if (plan) {
      const declaredBlocks = new Set([...plan.uniformBlocks.values()].map((slot) => slot.name));
      const missingBlocks = reflection.uniformBlocks
        .map((block) => block.name)
        .filter((name) => !declaredBlocks.has(name));
      if (missingBlocks.length > 0) {
        throw new ValidationError(
          `[gpu-device-api] program「${label}」使用了未声明的 uniform block：${missingBlocks.join('、')}。\n` +
            `布局里声明的块名：${[...declaredBlocks].join('、') || '(空)'}。\n` +
            'WebGL2 后端靠 `BindGroupLayoutEntry.name` 去定位 GLSL 的 uniform block，' +
            '请检查两边的名字是否一致（注意 GLSL 里块名与实例名是两回事，这里要的是**块名**）。',
        );
      }

      const declaredSamplers = new Set([...plan.textures.values()].map((slot) => slot.name));
      const missingSamplers = samplerUniforms
        .map((uniform) => uniform.name.replace(/\[0\]$/, ''))
        .filter((name) => !declaredSamplers.has(name));
      if (missingSamplers.length > 0) {
        throw new ValidationError(
          `[gpu-device-api] program「${label}」使用了未声明的 sampler：${missingSamplers.join('、')}。\n` +
            `布局里声明的纹理名：${[...declaredSamplers].join('、') || '(空)'}。\n` +
            '请为每个 sampler 增加一个 `type: \'texture\'` 的布局条目并填上 `name`。',
        );
      }
    } else {
      if (reflection.uniformBlocks.length > 0) {
        throw new ValidationError(
          `[gpu-device-api] program「${label}」使用了 uniform block（${reflection.uniformBlocks
            .map((block) => block.name)
            .join('、')}），但管线没有声明任何 bind group layout。`,
        );
      }
      if (samplerUniforms.length > 0) {
        throw new ValidationError(
          `[gpu-device-api] program「${label}」使用了 sampler（${samplerUniforms
            .map((uniform) => `${uniform.name}: ${glslTypeName(uniform.glType)}`)
            .join('、')}），但管线没有声明任何 bind group layout。`,
        );
      }
    }

    return { blockBindings, samplerLocations, optimizedOutBlocks };
  }
}

/** 把一段非空的 GL 日志收进诊断（原始文本 + 解析出的行号）。 */
function collectLog(
  log: string | null,
  label: string,
  stage: ShaderStage | null,
  messages: CompilationMessage[],
  rawLogs: string[],
): void {
  if (!log) return;
  const trimmed = log.trim();
  if (trimmed === '') return;
  rawLogs.push(trimmed);
  messages.push(...parseGlCompilationLog(trimmed, label, 'webgl2', stage));
}

/** 给 GL 日志里的行号加上源码正文，便于定位。 */
function numberSource(source: string): string {
  const lines = source.split('\n');
  const width = String(lines.length).length;
  return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')} | ${line}`).join('\n');
}
