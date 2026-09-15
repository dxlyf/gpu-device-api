/**
 * 逻辑设备：访问所有资源与管线的入口。
 *
 * 这个接口刻意设计成 WebGPU `GPUDevice` 的形状，因为那是两个后端都能遵循的模型。
 * WebGL2 后端会模拟 GL 中不存在的部分（bind group、pipeline layout、不可变管线），
 * 而不是把这些差异泄漏到上层。
 */

import type { BackendKind } from './Adapter.js';
import type { CanvasConfig, CanvasContext } from './CanvasContext.js';
import type { BindGroup, BindGroupDescriptor } from './binding/BindGroup.js';
import type { BindGroupLayout, BindGroupLayoutDescriptor } from './binding/BindGroupLayout.js';
import type { PipelineLayout, PipelineLayoutDescriptor } from './binding/PipelineLayout.js';
import type { GpuError } from './errors/GpuError.js';
import { ValidationError } from './errors/ValidationError.js';
import type { DeviceLostReason } from './errors/DeviceLostError.js';
import type { CommandEncoder, CommandEncoderDescriptor } from './render/CommandEncoder.js';
import type { RenderTarget, RenderTargetDescriptor } from './render/RenderTarget.js';
import type { ComputePipeline, ComputePipelineDescriptor } from './pipeline/ComputePipeline.js';
import type { RenderPipeline, RenderPipelineDescriptor } from './pipeline/RenderPipeline.js';
import type { Buffer, BufferDescriptor } from './resources/Buffer.js';
import type { QuerySet, QuerySetDescriptor } from './resources/QuerySet.js';
import type { Sampler, SamplerDescriptor } from './resources/Sampler.js';
import type { ShaderModule, ShaderModuleDescriptor } from './resources/ShaderModule.js';
import type { Texture, TextureDescriptor } from './resources/Texture.js';
import type { QueryResult, QuerySetReadOptions } from './sync/QueryResult.js';
import type { Queue } from './sync/Queue.js';

/**
 * 设备 limits，命名与 WebGPU 的 `GPUSupportedLimits` 完全一致。WebGL2 后端会填入
 * 它能查询到的值，其余使用保守的默认值，因此共享代码总能在不先判断后端的情况下
 * 读取某个 limit。
 */
export interface DeviceLimits {
  maxTextureDimension1D: number;
  maxTextureDimension2D: number;
  maxTextureDimension3D: number;
  maxTextureArrayLayers: number;
  maxBindGroups: number;
  maxBindGroupsPlusVertexBuffers: number;
  maxBindingsPerBindGroup: number;
  maxDynamicUniformBuffersPerPipelineLayout: number;
  maxDynamicStorageBuffersPerPipelineLayout: number;
  maxSampledTexturesPerShaderStage: number;
  maxSamplersPerShaderStage: number;
  maxStorageBuffersPerShaderStage: number;
  maxStorageTexturesPerShaderStage: number;
  maxUniformBuffersPerShaderStage: number;
  maxUniformBufferBindingSize: number;
  maxStorageBufferBindingSize: number;
  minUniformBufferOffsetAlignment: number;
  minStorageBufferOffsetAlignment: number;
  maxVertexBuffers: number;
  maxBufferSize: number;
  maxVertexAttributes: number;
  maxVertexBufferArrayStride: number;
  maxInterStageShaderVariables: number;
  maxColorAttachments: number;
  maxColorAttachmentBytesPerSample: number;
  maxComputeWorkgroupStorageSize: number;
  maxComputeInvocationsPerWorkgroup: number;
  maxComputeWorkgroupSizeX: number;
  maxComputeWorkgroupSizeY: number;
  maxComputeWorkgroupSizeZ: number;
  maxComputeWorkgroupsPerDimension: number;
}

/** {@link Device} 可查询的能力集合。 */
export interface DeviceFeatures {
  has(feature: string): boolean;
  readonly names: readonly string[];
}

export interface DeviceLostInfo {
  readonly reason: DeviceLostReason;
  readonly message: string;
}

export interface DeviceDescriptor {
  label?: string;
  /** 必须可用的特性名称，例如 `'texture-compression-bc'`。 */
  requiredFeatures?: readonly string[];
  /** 设备必须支持的 limits；高于 adapter 的取值会被拒绝。 */
  requiredLimits?: Partial<DeviceLimits>;
  /**
   * 开启开销较大的校验，例如在每条命令后轮询 `gl.getError()`、对每个 descriptor 检查两次。
   * 默认关闭，因为它会强制 GPU/CPU 同步。
   */
  debug?: boolean;
  /** `CanvasContext` 与 render target 使用的默认 MSAA 采样数。 */
  defaultSampleCount?: number;
}

export interface Device {
  readonly label: string;
  readonly backend: BackendKind;
  readonly features: DeviceFeatures;
  readonly limits: DeviceLimits;
  readonly queue: Queue;
  /** 请求了 `debug` 时为 true；在此期间后端会加入额外检查。 */
  readonly debug: boolean;

  /**
   * 通往原生对象的 escape hatch：WebGPU 上是 `GPUDevice`，WebGL2 上是
   * `WebGL2RenderingContext`。通过它做的一切都不在本抽象层的保证范围内。
   */
  readonly native: GPUDevice | WebGL2RenderingContext;

  /** 设备丢失（或被销毁）后 resolve。永远不会 reject。 */
  readonly lost: Promise<DeviceLostInfo>;

  /** 调用 {@link Device.dispose} 之后为 true。 */
  readonly disposed: boolean;

  /* ---------------------------------------------------------------- 资源 */
  createBuffer(descriptor: BufferDescriptor): Buffer;
  createTexture(descriptor: TextureDescriptor): Texture;
  createSampler(descriptor?: SamplerDescriptor): Sampler;
  createShaderModule(descriptor: ShaderModuleDescriptor): ShaderModule;
  createQuerySet(descriptor: QuerySetDescriptor): QuerySet;

  /**
   * 把 query set 里的结果读回 CPU，并返回一个可 `await` 的结果对象。
   *
   * 为什么放在设备上而不是 `QuerySet` 的方法里：WebGPU 的读回要「resolve 进 buffer → 拷进
   * 可映射 buffer → mapAsync」，每一步都需要设备级的资源（buffer、command encoder、queue），
   * 而 `GPUQuerySet` 本身既没有 resolve 也没有 map。WebGL2 侧则是 `gl.getQueryParameter`
   * 的同步轮询 —— 两个后端唯一的共同点就是「由设备提供读回」。
   *
   * 读回**不会阻塞**在 GPU 上（WebGPU 是 `mapAsync`；WebGL2 每轮询一次就让出一拍），
   * 所以可以安全地放在帧循环里，只要延迟若干帧读、并且上一帧的读回完成后才发起下一次。
   *
   * 结果只能 `read()` 一次：读回用的中转 buffer 在读取后即销毁。
   */
  readQuerySet(querySet: QuerySet, options?: QuerySetReadOptions): QueryResult;

  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(descriptor: BindGroupLayoutDescriptor): BindGroupLayout;
  createBindGroup(descriptor: BindGroupDescriptor): BindGroup;
  createPipelineLayout(descriptor: PipelineLayoutDescriptor): PipelineLayout;

  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(descriptor: RenderPipelineDescriptor): RenderPipeline;
  createComputePipeline(descriptor: ComputePipelineDescriptor): ComputePipeline;

  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(descriptor: RenderTargetDescriptor): RenderTarget;
  createCommandEncoder(descriptor?: CommandEncoderDescriptor): CommandEncoder;

  /**
   * 为一个 canvas 建立（或取回）本设备的 swap chain 表面。
   *
   * WebGPU：在 canvas 上取 `webgpu` context 并用本设备 `configure` 它，
   * 因此同一个 canvas 只会有一个 context，重复调用返回同一个对象。
   * WebGL2：GL context 本身就来自某个 canvas，一个 device 只能服务它自己的那个 canvas，
   * 传入其它 canvas 会抛 `ValidationError`。
   */
  createCanvasContext(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    config?: Omit<CanvasConfig, 'device'>,
  ): CanvasContext;

  /**
   * 注册错误回调。WebGPU 把 `onuncapturederror` 路由到这里，WebGL2 把它轮询到的
   * `getError()` 结果（debug 模式）路由到这里，两者的内部校验失败也都走这里。
   * 返回一个取消订阅的函数。
   */
  onError(callback: (error: GpuError) => void): () => void;

  /** 通过已注册的回调上报错误，不抛异常。 */
  reportError(error: GpuError): void;

  /** 释放设备拥有的全部资源。幂等。 */
  dispose(): void;
}

/**
 * 在 adapter 的 limits 之上应用 `requiredLimits`。除 `min*` 对齐类 limits 之外，
 * 每个 limit 都是上界，因此只有高于 adapter 取值的请求才会被拒绝。
 */
export function resolveLimits(
  adapterLimits: DeviceLimits,
  required: Partial<DeviceLimits> | undefined,
  backend: BackendKind,
): DeviceLimits {
  if (!required) return { ...adapterLimits };
  const resolved: DeviceLimits = { ...adapterLimits };
  for (const [key, value] of Object.entries(required) as [keyof DeviceLimits, number][]) {
    if (typeof value !== 'number') continue;
    const available = adapterLimits[key];
    if (typeof available !== 'number') {
      throw new ValidationError(`[gpu-device-api] Unknown device limit "${String(key)}".`);
    }
    if (value > available) {
      throw new ValidationError(
        `[gpu-device-api] The ${backend} adapter cannot satisfy ${String(key)} = ${value} (available: ${available}).`,
      );
    }
    (resolved as unknown as Record<string, number>)[key] = value;
  }
  return resolved;
}
