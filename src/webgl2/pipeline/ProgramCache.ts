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
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
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
}

/** 内部用来就地填充只读字段的辅助类型。 */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface ProgramCacheOptions {
  gl: WebGL2RenderingContext;
  state: GlStateCache;
}

export class ProgramCache {
  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly programs = new Map<string, CompiledProgram>();

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
   * @param vertexSource 已包好 `#version` 与精度声明的顶点着色器源码
   * @param fragmentSource 已包好的片元着色器源码
   */
  acquire(label: string, vertexSource: string, fragmentSource: string): CompiledProgram {
    const key = `${vertexSource}\u0000${fragmentSource}`;
    const cached = this.programs.get(key);
    if (cached) return cached;

    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource, `${label} / vertex`);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource, `${label} / fragment`);

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
    };
    this.programs.set(key, compiled);
    return compiled;
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
    for (const compiled of this.programs.values()) {
      this.gl.deleteProgram(compiled.program);
    }
    this.programs.clear();
    this.state.useProgram(null);
  }

  dispose(): void {
    this.clear();
  }

  private compileShader(type: number, source: string, label: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new ValidationError(`[gpu-device-api] gl.createShader() 返回 null（${label}）。`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!(gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean)) {
      const log = gl.getShaderInfoLog(shader) ?? '(无日志)';
      gl.deleteShader(shader);
      // 这里依赖 src/shaders 的 formatShaderErrorLog 把出错行贴出来，避免只给一串 GL 行号。
      throw new ValidationError(`[gpu-device-api] 着色器编译失败（${label}）：\n${log}\n\n----- 源码 -----\n${numberSource(source)}`);
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

/** 给 GL 日志里的行号加上源码正文，便于定位。 */
function numberSource(source: string): string {
  const lines = source.split('\n');
  const width = String(lines.length).length;
  return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')} | ${line}`).join('\n');
}
