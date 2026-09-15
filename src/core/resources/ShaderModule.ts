/**
 * 编译单元。
 *
 * WebGPU 只接受**一个**包含所有 entry point 的 WGSL 字符串，而 WebGL2 需要为每个 program
 * 分别编译 vertex 与 fragment 着色器再链接。因此 `ShaderModule` 保存的是**原始源码**，
 * 真正的编译推迟到创建管线时（`src/shaders` 负责选语言与补样板，各后端负责编译缓存）。
 *
 * 关于声明：core 采用 WebGPU 形状的模型，源码是自包含的 —— `@group/@binding`、
 * `layout(std140)`、`layout(location = N)` 都由使用者自己写（详见 `src/shaders`）。
 */

import type { Disposable } from '../../utils/Disposable.js';
import type { ShaderStage } from '../enums/ShaderStage.js';
import type { CompilationInfo } from '../pipeline/CompilationInfo.js';

export interface ShaderSource {
  /** GLSL ES 3.00 顶点着色器。 */
  vs?: string;
  /** GLSL ES 3.00 片元着色器。 */
  fs?: string;
  /** GLSL ES 3.10+ 计算着色器（WebGL2 不支持 compute）。 */
  cs?: string;
  /** 包含所有 entry point 的 WGSL 源码。 */
  wgsl?: string;
}

/**
 * GLSL 自动包装的开关。**只影响 WebGL2 后端**（WGSL 没有版本指令，也不需要精度声明）。
 *
 * 两项都默认开启，也就是「剥掉你自己写的 `#version` → 首行注入 `#version 300 es`
 * → 拼接默认精度前言 → 拼接 `defines` → 你的源码」。
 * 当源码已经由别的工具预处理过、或者你就是要自己掌控这几行时，可以关掉其中任意一项；
 * 两项都关掉（且没有 `defines`）时是**逐字节透传**，本库一个字符都不改。
 */
export interface GlslWrapOptions {
  /**
   * 是否自动处理 `#version`，默认 `true`。
   *
   * - `true`：剥掉源码里的 `#version`，在首行注入 `#version 300 es`；
   *   如果你写的不是 `300 es`，会直接报错而不是静默替换（避免「本地能编译、上线编译不过」）。
   * - `false`：完全不碰 `#version` —— 不注入、不校验、不删除，版本行由你自己负责
   *   （WebGL2 只接受 `#version 300 es`，写别的版本会在后端编译时报错）。
   */
  version?: boolean;
  /**
   * 是否自动拼接精度前言（默认 `precision highp float;` 等），默认 `true`。
   * 传字符串则用你的前言替换默认前言（仍然算启用）。
   *
   * 片元着色器在 GLSL ES 3.00 里没有默认浮点精度，关掉它就必须自己在源码里写
   * `precision mediump float;`（或 highp），否则编译不过。
   */
  preamble?: boolean | string;
}

export interface ShaderModuleDescriptor {
  label?: string;
  /** 一个 WGSL 字符串，或一份按语言/阶段给出的源码包。 */
  code: string | ShaderSource;
  /** 编译期常量（GLSL 生成 `#define`，WGSL 生成顶层 `const`）。 */
  defines?: Record<string, string | number | boolean>;
  /** GLSL 自动包装开关（默认全开）。只影响 WebGL2 后端，见 {@link GlslWrapOptions}。 */
  glsl?: GlslWrapOptions;
}

export interface ShaderModule extends Disposable {
  readonly label: string;
  readonly source: ShaderSource;
  readonly defines: Record<string, string | number | boolean>;
  /** GLSL 自动包装开关；WebGPU 后端会保存它但不使用（WGSL 没有版本/精度前言）。 */
  readonly glsl: GlslWrapOptions;
  dispose(): void;

  /**
   * **可选**：取得这份源码的编译诊断。
   *
   * WebGPU 后端走 `GPUShaderModule.getCompilationInfo()`，每条 message 带
   * `type`（error/warning/info）、`lineNum`、`linePos`、`message`；
   * WebGL2 后端的编译单元是 program 而不是 module（两个 stage 链接在一起才知道结果），
   * 所以那里**不实现**本方法，诊断请从 `RenderPipeline.getCompilationInfo()` 取
   *（它给出的行号同样来自 `getShaderInfoLog()` 的原文）。
   *
   * @param stage 需要哪个阶段的模块。WGSL 是一份源码包含所有 entry point，
   *   所以不传时用 vertex 触发一次编译即可，诊断内容与 stage 无关。
   */
  getCompilationInfo?(stage?: ShaderStage): Promise<CompilationInfo>;
}

/** 归一化 `code` 的两种写法：字符串按 WGSL 处理。 */
export function resolveShaderSource(code: string | ShaderSource): ShaderSource {
  if (typeof code === 'string') return { wgsl: code };
  return { ...code };
}
