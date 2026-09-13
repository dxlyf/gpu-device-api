/**
 * 着色器编译调度：按后端选语言，并补上每种语言必需的样板。
 *
 * 这里**不做声明注入**：uniform block、bind group、顶点属性位置都由用户在源码里自己写，
 * core 只保证「同一份 ShaderSource 在两种后端下都能拿到可编译的最终源码」。
 *
 * GLSL 侧会自动补 `#version 300 es` 与默认精度限定符，并允许通过 `defines` 注入宏；
 * WGSL 侧没有版本指令，`defines` 会生成为顶层 `const`。
 */

import type { BackendKind } from '../core/Adapter.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import type { ShaderStage } from '../core/enums/ShaderStage.js';
import type { ShaderSource } from '../core/resources/ShaderModule.js';
import { languageForBackend, missingSourceMessage, stageSource, type ShaderLanguage } from './ShaderSource.js';

export interface ShaderCompileRequest {
  backend: BackendKind;
  source: ShaderSource;
  stage: ShaderStage;
  /** 仅用于报错信息，通常是 pipeline 的 label。 */
  label?: string;
  defines?: Record<string, string | number | boolean>;
}

export interface CompiledShaderStage {
  language: ShaderLanguage;
  stage: ShaderStage;
  /** 最终交给后端编译的完整源码。 */
  code: string;
  /** 是否为 GLSL 补过前言（便于调试输出时说明）。 */
  hasPreamble: boolean;
}

/** GLSL ES 3.00 必需的前言：版本号必须在第一行，其余为默认精度。 */
export const GLSL_PREAMBLE =
  '#version 300 es\n' +
  'precision highp float;\n' +
  'precision highp int;\n' +
  'precision highp sampler2D;\n' +
  'precision highp samplerCube;\n' +
  'precision highp sampler3D;\n' +
  'precision highp sampler2DArray;\n';

const GLSL_VERSION_LINE = /^\s*#version[^\n]*\n?/;

/** 把 `defines` 渲染成 GLSL 的 `#define`。 */
export function glslDefines(defines: ShaderCompileRequest['defines']): string {
  if (!defines) return '';
  return Object.entries(defines)
    .map(([key, value]) => {
      if (typeof value === 'boolean') return `#define ${key} ${value ? 1 : 0}`;
      return `#define ${key} ${value}`;
    })
    .join('\n');
}

/** 把 `defines` 渲染成 WGSL 的顶层 `const`。 */
export function wgslDefines(defines: ShaderCompileRequest['defines']): string {
  if (!defines) return '';
  return Object.entries(defines)
    .map(([key, value]) => {
      if (typeof value === 'boolean') return `const ${key}: bool = ${value};`;
      if (typeof value === 'number') {
        return Number.isInteger(value) ? `const ${key}: i32 = ${value};` : `const ${key}: f32 = ${value};`;
      }
      return `const ${key}: f32 = ${value};`;
    })
    .join('\n');
}

/**
 * 把用户写的 GLSL 主体包成可编译的完整源码：
 * `#version` → `#define` → 默认精度 → 用户源码。
 *
 * 用户源码里如果自带 `#version`，会被剥掉（版本由本库统一指定），
 * 但如果写的不是 300 es，会直接报错而不是静默替换 —— 否则很容易出现
 * 「本地能编译、上线编译不过」这种难查的问题。
 */
export function wrapGlslSource(body: string, defines?: ShaderCompileRequest['defines'], label = 'shader'): string {
  const versionMatch = /^\s*#version\s+([^\n]*)/.exec(body);
  if (versionMatch) {
    const declared = versionMatch[1]!.trim();
    if (!/^300\s+es\b/.test(declared)) {
      throw new ValidationError(
        `[gpu-device-api] ShaderModule「${label}」声明了 \`#version ${declared}\`，` +
          '但 WebGL2 后端只接受 GLSL ES 3.00（`#version 300 es`）。请删掉 `#version` 行，或改为 `#version 300 es`。',
      );
    }
  }
  const stripped = body.replace(GLSL_VERSION_LINE, '');
  const defineBlock = glslDefines(defines);
  return `${GLSL_PREAMBLE}${defineBlock ? `${defineBlock}\n` : ''}${stripped.trim()}\n`;
}

/** 把用户写的 WGSL 主体与 `defines` 拼成完整源码。 */
export function wrapWgslSource(body: string, defines?: ShaderCompileRequest['defines']): string {
  const defineBlock = wgslDefines(defines);
  return defineBlock ? `${defineBlock}\n\n${body.trim()}\n` : `${body.trim()}\n`;
}

/**
 * 生成某个 stage 的最终源码。缺少对应语言源码时抛出带完整上下文的
 * {@link ValidationError}（而不是让后端抛一句看不懂的编译错误）。
 */
export function compileShaderStage(request: ShaderCompileRequest): CompiledShaderStage {
  const { backend, source, stage, label = 'shader' } = request;
  const language = languageForBackend(backend);
  const raw = stageSource(source, language, stage);
  if (raw === undefined) {
    throw new ValidationError(missingSourceMessage(backend, stage, source, label));
  }
  const code =
    language === 'glsl'
      ? wrapGlslSource(raw, request.defines, label)
      : wrapWgslSource(raw, request.defines);
  return { language, stage, code, hasPreamble: language === 'glsl' };
}

/**
 * 从 WebGL 的编译/链接日志里抽出出错行，并把对应源码行贴出来。
 * WebGL 的日志格式形如 `ERROR: 0:12: 'x' : undeclared identifier`。
 */
export function formatShaderErrorLog(log: string, code: string, label: string): string {
  const lines = code.split('\n');
  const header = `[gpu-device-api] 着色器「${label}」编译失败：\n${log.trim()}\n`;
  const mentioned = new Set<number>();
  const pattern = /ERROR:\s*\d+:(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(log)) !== null) {
    const lineNumber = Number(match[1]);
    if (lineNumber > 0) mentioned.add(lineNumber);
  }
  if (mentioned.size === 0) {
    return `${header}\n----- 完整源码 -----\n${withLineNumbers(lines)}\n`;
  }
  const context: string[] = [];
  for (const lineNumber of [...mentioned].sort((a, b) => a - b)) {
    context.push(`----- 第 ${lineNumber} 行附近 -----`);
    const from = Math.max(1, lineNumber - 3);
    const to = Math.min(lines.length, lineNumber + 3);
    context.push(withLineNumbers(lines.slice(from - 1, to), from));
  }
  return `${header}\n${context.join('\n')}\n`;
}

function withLineNumbers(lines: readonly string[], startAt = 1): string {
  const width = String(startAt + lines.length - 1).length;
  return lines.map((line, index) => `${String(startAt + index).padStart(width, ' ')} | ${line}`).join('\n');
}

/** 便于调试：把源码按行号打印出来。 */
export function numberLines(code: string): string {
  return withLineNumbers(code.split('\n'));
}
