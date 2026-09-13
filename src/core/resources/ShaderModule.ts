/**
 * 一个编译单元。
 *
 * WebGPU 只消费单个包含所有 entry point 的 WGSL 字符串，而 WebGL2 需要为每个 program 编译
 * 并链接一个 vertex shader 加一个 fragment shader。因此 `ShaderModule` 会保存两种语言各自的
 * 原始源码；声明注入（binding、attribute、uniform block）则推迟到创建 pipeline、
 * 布局已知时进行。
 */

import type { Disposable } from '../../utils/Disposable.js';
import type { ShaderStage } from '../enums/ShaderStage.js';

export type ShaderLanguage = 'glsl' | 'wgsl';

export interface ShaderSource {
  /** GLSL ES 3.00 vertex shader。 */
  vs?: string;
  /** GLSL ES 3.00 fragment shader。 */
  fs?: string;
  /** GLSL ES 3.10+ compute shader（WebGL2 不支持 compute）。 */
  cs?: string;
  /** 包含所有 entry point 的 WGSL 源码。 */
  wgsl?: string;
}

export interface ShaderModuleDescriptor {
  label?: string;
  /** 单个 WGSL 字符串，或按语言组织的一组源码。 */
  code: string | ShaderSource;
  /** 类似预处理器的 define（GLSL 用 `#define`，WGSL 用 `const`）。 */
  defines?: Record<string, string | number | boolean>;
}

export interface ShaderModule extends Disposable {
  readonly label: string;
  readonly source: ShaderSource;
  readonly defines: Record<string, string | number | boolean>;
  dispose(): void;
}

/** 归一化可接受的 `code` 写法。 */
export function resolveShaderSource(code: string | ShaderSource): ShaderSource {
  if (typeof code === 'string') return { wgsl: code };
  return { ...code };
}

/** 指定语言下某个 stage 的源码；不存在时返回 `undefined`。 */
export function shaderSourceFor(
  source: ShaderSource,
  language: ShaderLanguage,
  stage: ShaderStage,
): string | undefined {
  if (language === 'wgsl') return source.wgsl;
  const vertex = 0x0001;
  const fragment = 0x0002;
  const compute = 0x0004;
  if (stage === vertex) return source.vs;
  if (stage === fragment) return source.fs;
  if (stage === compute) return source.cs;
  return undefined;
}

/** 便于阅读地列出该组源码提供了哪些内容，用于错误消息。 */
export function describeShaderSource(source: ShaderSource): string {
  const parts: string[] = [];
  if (source.vs) parts.push('glsl.vs');
  if (source.fs) parts.push('glsl.fs');
  if (source.cs) parts.push('glsl.cs');
  if (source.wgsl) parts.push('wgsl');
  return parts.length ? parts.join(', ') : 'empty';
}
