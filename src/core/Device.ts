/**
 * The logical device: the entry point for every resource and pipeline.
 *
 * The interface is deliberately shaped like WebGPU's `GPUDevice`, because that is the model both
 * backends can honour. The WebGL2 backend emulates the parts GL has no concept of (bind groups,
 * pipeline layouts, immutable pipelines) instead of leaking those differences upward.
 */

import type { BackendKind } from './Adapter.js';
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
import type { Queue } from './sync/Queue.js';

/**
 * Device limits, named exactly like WebGPU's `GPUSupportedLimits`. The WebGL2 backend fills in the
 * values it can query and uses conservative defaults for the rest, so shared code can always read
 * a limit without checking the backend first.
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

/** Queryable capability set of a {@link Device}. */
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
  /** Feature names that must be available, e.g. `'texture-compression-bc'`. */
  requiredFeatures?: readonly string[];
  /** Limits the device must support; values above the adapter's are rejected. */
  requiredLimits?: Partial<DeviceLimits>;
  /**
   * Enables expensive validation such as polling `gl.getError()` after every command and checking
   * every descriptor twice. Off by default because it forces GPU/CPU synchronisation.
   */
  debug?: boolean;
  /** Default MSAA sample count used by `CanvasContext` and render targets. */
  defaultSampleCount?: number;
}

export interface Device {
  readonly label: string;
  readonly backend: BackendKind;
  readonly features: DeviceFeatures;
  readonly limits: DeviceLimits;
  readonly queue: Queue;
  /** True when `debug` was requested; backends add extra checks while it holds. */
  readonly debug: boolean;

  /**
   * Escape hatch to the native object: `GPUDevice` on WebGPU, `WebGL2RenderingContext` on WebGL2.
   * Anything done through it is outside the abstraction's guarantees.
   */
  readonly native: GPUDevice | WebGL2RenderingContext;

  /** Resolves once the device is lost (or disposed). Never rejects. */
  readonly lost: Promise<DeviceLostInfo>;

  /** True after {@link Device.dispose}. */
  readonly disposed: boolean;

  /* ---------------------------------------------------------------- resources */
  createBuffer(descriptor: BufferDescriptor): Buffer;
  createTexture(descriptor: TextureDescriptor): Texture;
  createSampler(descriptor?: SamplerDescriptor): Sampler;
  createShaderModule(descriptor: ShaderModuleDescriptor): ShaderModule;
  createQuerySet(descriptor: QuerySetDescriptor): QuerySet;

  /* ---------------------------------------------------------------- bindings */
  createBindGroupLayout(descriptor: BindGroupLayoutDescriptor): BindGroupLayout;
  createBindGroup(descriptor: BindGroupDescriptor): BindGroup;
  createPipelineLayout(descriptor: PipelineLayoutDescriptor): PipelineLayout;

  /* ---------------------------------------------------------------- pipelines */
  createRenderPipeline(descriptor: RenderPipelineDescriptor): RenderPipeline;
  createComputePipeline(descriptor: ComputePipelineDescriptor): ComputePipeline;

  /* ---------------------------------------------------------------- rendering */
  createRenderTarget(descriptor: RenderTargetDescriptor): RenderTarget;
  createCommandEncoder(descriptor?: CommandEncoderDescriptor): CommandEncoder;

  /**
   * Registers an error callback. WebGPU routes `onuncapturederror` here, WebGL2 routes its
   * polled `getError()` results (debug mode) and both route internal validation failures.
   * Returns an unsubscribe function.
   */
  onError(callback: (error: GpuError) => void): () => void;

  /** Reports an error through the registered callbacks without throwing. */
  reportError(error: GpuError): void;

  /** Releases every resource owned by the device. Idempotent. */
  dispose(): void;
}

/**
 * Applies `requiredLimits` on top of an adapter's limits. Every limit is an upper bound except the
 * `min*` alignment limits, so only requests above the adapter's value are rejected.
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
