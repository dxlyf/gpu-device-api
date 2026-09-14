/**
 * WebGPU shader module：`ShaderModule` 接口的实现。
 *
 * 本类**只保存原始源码**（与 core 的设计一致）：真正调 `device.createShaderModule` 发生在
 * 第一次需要原生模块时（也就是创建管线时），因为：
 *
 * - WGSL 源里包含全部 entry point，一个 module 只需要编译一次；
 * - `compileShaderStage` 需要知道「是哪个 stage」才能给出准确的缺源码报错，
 *   而 stage 只有在创建管线时才确定；
 * - core 的 `ShaderModule` 没有 `native` 成员，编译时机属于后端内部细节。
 *
 * 编译入口是 {@link WebGPUShaderModule.compile}；`native` 反映真实状态：尚未编译时为 `null`，
 * 不会为了「看起来有值」而凭空编译。
 */

import type {
  GlslWrapOptions,
  ShaderModule,
  ShaderModuleDescriptor,
  ShaderSource,
} from '../../core/resources/ShaderModule.js';
import type { ShaderStage } from '../../core/enums/ShaderStage.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { resolveShaderSource } from '../../core/resources/ShaderModule.js';
import { compileShaderStage } from '../../shaders/ShaderCompiler.js';
import { describeUnknown } from './WebGPUBuffer.js';

export class WebGPUShaderModule implements ShaderModule {
  readonly label: string;
  readonly source: ShaderSource;
  readonly defines: Record<string, string | number | boolean>;
  /** GLSL 自动包装开关：WGSL 没有版本指令与精度前言，这里只保存不生效。 */
  readonly glsl: GlslWrapOptions;

  private readonly device: WebGPUDevice;
  private readonly modulesByStage = new Map<ShaderStage, GPUShaderModule>();
  private _disposed = false;

  constructor(device: WebGPUDevice, descriptor: ShaderModuleDescriptor) {
    this.device = device;
    this.label = descriptor.label ?? `shader#${device.nextResourceId('shader')}`;
    this.source = resolveShaderSource(descriptor.code);
    this.defines = { ...(descriptor.defines ?? {}) };
    this.glsl = descriptor.glsl ? { ...descriptor.glsl } : {};

    if (this.source.wgsl === undefined && this.source.vs === undefined && this.source.fs === undefined && this.source.cs === undefined) {
      throw new ValidationError(
        `[gpu-device-api] ShaderModule "${this.label}" has no source code (expected \`wgsl\`, or \`vs\`/\`fs\`/\`cs\`).`,
      );
    }
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 是否已经为某个 stage 编译过原生模块。 */
  get compiled(): boolean {
    return this.modulesByStage.size > 0;
  }

  /**
   * 原生 `GPUShaderModule`；尚未编译时为 `null`。
   *
   * 编译需要 stage（core 的 module 里可能同时含 vertex / fragment / compute 入口），
   * 所以这里不代劳；创建管线的路径会先调用 {@link WebGPUShaderModule.compile}。
   */
  get native(): GPUShaderModule | null {
    const first = this.modulesByStage.values().next();
    return first.done ? null : first.value;
  }

  /** 按 stage 得到最终 WGSL 源码（补齐 `defines` 与防御性包装），不触发 GPU 编译。 */
  finalSource(stage: ShaderStage): string {
    return compileShaderStage({
      backend: 'webgpu',
      source: this.source,
      stage,
      label: this.label,
      defines: this.defines,
      glsl: this.glsl, // WGSL 用不到，传下去只是让 request 与 module 保持一致
    }).code;
  }

  /**
   * 取得（必要时创建）原生 `GPUShaderModule`。
   *
   * WGSL 里含所有 entry point，因此不同 stage 复用同一个编译结果；缓存仍然按 stage 记录，
   * 以便 `finalSource()` 的报错信息与实际使用一致。
   */
  compile(stage: ShaderStage): GPUShaderModule {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] ShaderModule "${this.label}" has been disposed; it can no longer be compiled.`,
      );
    }
    if (this.device.disposed) {
      throw new ValidationError(
        `[gpu-device-api] ShaderModule "${this.label}" belongs to a disposed device.`,
      );
    }
    const cached = this.modulesByStage.get(stage);
    if (cached) return cached;
    const first = this.modulesByStage.values().next();
    if (!first.done) {
      // 已经用另一个 stage 编译过：WGSL 是同一份源码，直接复用并把结果登记到当前 stage。
      this.modulesByStage.set(stage, first.value);
      return first.value;
    }

    const code = this.finalSource(stage);
    const module = this.device.native.createShaderModule({ label: this.label, code });
    this.modulesByStage.set(stage, module);
    return module;
  }

  /** GPUShaderModule 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose(): void {
    this._disposed = true;
    this.modulesByStage.clear();
  }
}

/** 该对象是否为 WebGPU 后端的 shader module。 */
export function isWebGPUShaderModule(value: unknown): value is WebGPUShaderModule {
  return value instanceof WebGPUShaderModule;
}

/** 把 core 的 `ShaderModule` 收窄为 WebGPU 实现。 */
export function asWebGPUShaderModule(value: unknown, context: string): WebGPUShaderModule {
  if (value instanceof WebGPUShaderModule) return value;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPUShaderModule created by this device, got ` +
      `${describeUnknown(value)}.`,
  );
}
