/**
 * A compilation unit.
 *
 * WebGPU consumes a single WGSL string containing every entry point, while WebGL2 compiles and
 * links one vertex + one fragment shader per program. A `ShaderModule` therefore stores the *raw*
 * source for both languages; declaration injection (bindings, attributes, uniform blocks) happens
 * later, when the pipeline is created and its layout is known.
 */

import type { Disposable } from '../../utils/Disposable.js';
import type { ShaderStage } from '../enums/ShaderStage.js';

export type ShaderLanguage = 'glsl' | 'wgsl';

export interface ShaderSource {
  /** GLSL ES 3.00 vertex shader. */
  vs?: string;
  /** GLSL ES 3.00 fragment shader. */
  fs?: string;
  /** GLSL ES 3.10+ compute shader (WebGL2 does not support compute). */
  cs?: string;
  /** WGSL source containing every entry point. */
  wgsl?: string;
}

export interface ShaderModuleDescriptor {
  label?: string;
  /** A plain WGSL string, or a per-language source bag. */
  code: string | ShaderSource;
  /** Preprocessor-style defines (`#define` for GLSL, `const` for WGSL). */
  defines?: Record<string, string | number | boolean>;
}

export interface ShaderModule extends Disposable {
  readonly label: string;
  readonly source: ShaderSource;
  readonly defines: Record<string, string | number | boolean>;
  dispose(): void;
}

/** Normalizes the accepted `code` forms. */
export function resolveShaderSource(code: string | ShaderSource): ShaderSource {
  if (typeof code === 'string') return { wgsl: code };
  return { ...code };
}

/** Source for one stage in the requested language, or `undefined` when absent. */
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

/** Human readable list of what a source bag provides, used in error messages. */
export function describeShaderSource(source: ShaderSource): string {
  const parts: string[] = [];
  if (source.vs) parts.push('glsl.vs');
  if (source.fs) parts.push('glsl.fs');
  if (source.cs) parts.push('glsl.cs');
  if (source.wgsl) parts.push('wgsl');
  return parts.length ? parts.join(', ') : 'empty';
}
