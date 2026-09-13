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

export interface ShaderModuleDescriptor {
  label?: string;
  /** 一个 WGSL 字符串，或一份按语言/阶段给出的源码包。 */
  code: string | ShaderSource;
  /** 编译期常量（GLSL 生成 `#define`，WGSL 生成顶层 `const`）。 */
  defines?: Record<string, string | number | boolean>;
}

export interface ShaderModule extends Disposable {
  readonly label: string;
  readonly source: ShaderSource;
  readonly defines: Record<string, string | number | boolean>;
  dispose(): void;
}

/** 归一化 `code` 的两种写法：字符串按 WGSL 处理。 */
export function resolveShaderSource(code: string | ShaderSource): ShaderSource {
  if (typeof code === 'string') return { wgsl: code };
  return { ...code };
}
