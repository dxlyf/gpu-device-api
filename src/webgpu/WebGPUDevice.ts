/**
 * WebGPU 逻辑设备：`Device` 接口在 `GPUDevice` 上的实现。
 *
 * 职责有三块：
 *
 * 1. **资源工厂**：所有 `create*` 都会把创建出来的 core 资源登记到内部集合里，
 *    使 `dispose()` 能一次性释放设备创建的全部资源；
 * 2. **错误通道**：`device.onuncapturederror` 被路由到 `Device.onError` 注册的回调，
 *    原始 `GPUValidationError` / `GPUOutOfMemoryError` / `GPUInternalError` 会被翻译成
 *    core 的 `ValidationError` / `OutOfMemoryError` / `GpuError`；
 * 3. **设备丢失**：`device.lost` 映射为 {@link DeviceLostInfo}，并在非主动销毁的情况下
 *    额外上报一个 {@link DeviceLostError}。
 *
 * 另外本类额外暴露了 `defaultSampleCount`：core 的 `DeviceDescriptor` 有这个字段，
 * 但 `Device` 接口没有把它读出来，而 `CanvasConfig.sampleCount` 的默认值又要求读设备默认值。
 */

import type {
  Device,
  DeviceDescriptor,
  DeviceFeatures,
  DeviceLimits,
  DeviceLostInfo,
} from '../core/Device.js';
import type { BackendKind, AdapterInfo } from '../core/Adapter.js';
import type { CanvasConfig } from '../core/CanvasContext.js';
import type { BindGroupDescriptor } from '../core/binding/BindGroup.js';
import type { BindGroupLayoutDescriptor } from '../core/binding/BindGroupLayout.js';
import type { PipelineLayoutDescriptor } from '../core/binding/PipelineLayout.js';
import type { CommandEncoderDescriptor } from '../core/render/CommandEncoder.js';
import type { RenderTargetDescriptor } from '../core/render/RenderTarget.js';
import type { ComputePipelineDescriptor } from '../core/pipeline/ComputePipeline.js';
import type { RenderPipelineDescriptor } from '../core/pipeline/RenderPipeline.js';
import type { BufferDescriptor } from '../core/resources/Buffer.js';
import type { QuerySet, QuerySetDescriptor } from '../core/resources/QuerySet.js';
import type { QueryResult, QuerySetReadOptions } from '../core/sync/QueryResult.js';
import type { SamplerDescriptor } from '../core/resources/Sampler.js';
import type { ShaderModuleDescriptor } from '../core/resources/ShaderModule.js';
import type { TextureDescriptor } from '../core/resources/Texture.js';
import type { Disposable } from '../utils/Disposable.js';
import { GpuError, isGpuError } from '../core/errors/GpuError.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { OutOfMemoryError } from '../core/errors/OutOfMemoryError.js';
import { DeviceLostError, type DeviceLostReason } from '../core/errors/DeviceLostError.js';
import { BufferUsage } from '../core/enums/BufferUsage.js';
import { assertNonNegativeInteger } from '../utils/assert.js';
import { disposeAll } from '../utils/Disposable.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { nextId } from '../utils/id.js';
import { assertSampleCount } from './utils/wgpuEnumMap.js';
import {
  readDeviceLimits,
  readSupportedFeatures,
  WebGPUFeatures,
  type WebGPUAdapterRequestOptions,
} from './utils/wgpuCapabilities.js';
import { WebGPUBuffer } from './resources/WebGPUBuffer.js';
import { WebGPUTexture } from './resources/WebGPUTexture.js';
import { WebGPUSampler } from './resources/WebGPUSampler.js';
import { WebGPUShaderModule } from './resources/WebGPUShaderModule.js';
import { WebGPUQuerySet, asGPUQuerySet } from './resources/WebGPUQuerySet.js';
import { WebGPUQueryResult } from './sync/WebGPUQueryResult.js';
import { WebGPUBindGroup } from './binding/WebGPUBindGroup.js';
import { WebGPUBindGroupLayout } from './binding/WebGPUBindGroupLayout.js';
import { WebGPUPipelineLayout } from './binding/WebGPUPipelineLayout.js';
import { WebGPURenderPipeline } from './pipeline/WebGPURenderPipeline.js';
import { WebGPUComputePipeline } from './pipeline/WebGPUComputePipeline.js';
import { WebGPURenderTarget } from './render/WebGPURenderTarget.js';
import { WebGPUCommandEncoder } from './render/WebGPUCommandEncoder.js';
import { WebGPUCanvasContext } from './WebGPUCanvasContext.js';
import { WebGPUQueue } from './sync/WebGPUQueue.js';

/** 构造 `WebGPUDevice` 需要的信息（由 `WebGPUAdapter.requestDevice` 提供）。 */
export interface WebGPUDeviceInit {
  readonly descriptor: DeviceDescriptor;
  readonly resolvedLimits: DeviceLimits;
  readonly adapterInfo: AdapterInfo;
  readonly adapterFeatures: ReadonlySet<string>;
  readonly requestOptions?: WebGPUAdapterRequestOptions;
}

export class WebGPUDevice implements Device {
  readonly label: string;
  readonly backend: BackendKind = 'webgpu';
  readonly native: GPUDevice;
  readonly features: DeviceFeatures;
  readonly limits: DeviceLimits;
  readonly queue: WebGPUQueue;
  readonly debug: boolean;
  readonly lost: Promise<DeviceLostInfo>;

  /** 请求设备时实际启用的 feature 名（`DeviceDescriptor.requiredFeatures`）。 */
  readonly enabledFeatures: readonly string[];
  /**
   * 设备上**真正启用**的 feature 集合。
   *
   * 与 {@link WebGPUDevice.features}（adapter 支持什么）不是一回事：adapter 支持 `timestamp-query`
   * 但 `requiredFeatures` 里没写，设备上就没有这个能力。`native.features` 是权威来源；
   * 实现没有暴露它（或跑在 mock 上）时退回请求列表。
   */
  readonly enabledFeatureSet: ReadonlySet<string>;
  /** 创建本设备的 adapter 信息，便于日志与调试。 */
  readonly adapterInfo: AdapterInfo;
  /** `requiredLimits` 经校验后的完整 limits；`limits` 则来自实际创建出来的 device。 */
  readonly requestedLimits: DeviceLimits;
  /** `DeviceDescriptor.defaultSampleCount` 的规范化结果（1 或 4）。 */
  readonly defaultSampleCount: number;
  /** 请求设备时的原始 descriptor，便于诊断。 */
  readonly descriptor: DeviceDescriptor;

  private readonly logger: Logger;
  private readonly resources = new Set<Disposable>();
  private readonly canvasContexts = new Map<HTMLCanvasElement | OffscreenCanvas, WebGPUCanvasContext>();
  private readonly errorCallbacks = new Set<(error: GpuError) => void>();
  private readonly resolveLost: (info: DeviceLostInfo) => void;
  private lostInfo: DeviceLostInfo | null = null;
  private _disposed = false;

  constructor(native: GPUDevice, init: WebGPUDeviceInit) {
    this.native = native;
    this.descriptor = init.descriptor;
    this.label = init.descriptor.label ?? (native.label.length > 0 ? native.label : 'webgpu-device');
    this.adapterInfo = init.adapterInfo;
    this.requestedLimits = init.resolvedLimits;
    this.debug = init.descriptor.debug ?? false;
    this.enabledFeatures = [...(init.descriptor.requiredFeatures ?? [])];
    this.enabledFeatureSet = readEnabledFeatures(native, this.enabledFeatures);
    this.features = new WebGPUFeatures(init.adapterFeatures);
    this.limits = readDeviceLimits(native.limits);
    this.defaultSampleCount = assertSampleCount(
      init.descriptor.defaultSampleCount ?? 1,
      'DeviceDescriptor.defaultSampleCount',
    );
    this.logger = createLogger(`webgpu:${this.label}`);

    let resolveLost: (info: DeviceLostInfo) => void = () => {};
    this.lost = new Promise<DeviceLostInfo>((resolve) => {
      resolveLost = resolve;
    });
    this.resolveLost = resolveLost;

    this.queue = new WebGPUQueue(this);

    native.onuncapturederror = (event) => {
      this.reportError(toGpuError(event.error));
    };
    void native.lost.then((info) => this.handleDeviceLost(info));

    this.logger.debug(
      `created device (${this.adapterInfo.device || this.adapterInfo.vendor || 'unknown adapter'}, ` +
        `features: ${this.enabledFeatures.join(', ') || 'none'})`,
    );
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 设备是否仍然可用。 */
  get usable(): boolean {
    return !this._disposed && this.lostInfo === null;
  }

  /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
  get trackedResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 该 feature 是否**已经在本设备上启用**（不只是 adapter 支持）。
   *
   * 需要 feature 的能力（timestamp 查询等）必须查这个而不是 `features.has()`，
   * 否则会出现「adapter 支持 → 我们以为能用 → 原生校验失败」的静默失效。
   */
  hasEnabledFeature(feature: string): boolean {
    return this.enabledFeatureSet.has(feature);
  }

  /**
   * GPU 时间戳的「纳秒 / 刻度」换算系数。
   *
   * 优先读 `queue.getTimestampPeriod()`（规范接口），再退回 `queue.timestampPeriod` 属性。
   * 本仓库实测的 Chrome（2025 年的 Windows 版本）两者都没有暴露，此时按规范默认值 1 处理 ——
   * 也就是刻度本身就是纳秒。**绝不能**因为拿不到这个值就把刻度直接当纳秒用而不做说明：
   * 那样在其它实现（例如 period 是 83.33 的某些移动 GPU）上会得到系统性偏小的数字。
   */
  get timestampPeriod(): number {
    const queue = this.native.queue as GPUQueue & {
      timestampPeriod?: number;
      getTimestampPeriod?: () => number;
    };
    if (typeof queue.getTimestampPeriod === 'function') {
      const value = queue.getTimestampPeriod();
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    }
    if (typeof queue.timestampPeriod === 'number' && Number.isFinite(queue.timestampPeriod) && queue.timestampPeriod > 0) {
      return queue.timestampPeriod;
    }
    return 1;
  }

  /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
  nextResourceId(prefix: string): string {
    return nextId(prefix);
  }

  /* ---------------------------------------------------------------- 资源 */

  createBuffer(descriptor: BufferDescriptor): WebGPUBuffer {
    this.assertUsable('createBuffer');
    return this.track(new WebGPUBuffer(this, descriptor));
  }

  createTexture(descriptor: TextureDescriptor): WebGPUTexture {
    this.assertUsable('createTexture');
    return this.track(WebGPUTexture.create(this, descriptor));
  }

  createSampler(descriptor: SamplerDescriptor = {}): WebGPUSampler {
    this.assertUsable('createSampler');
    return this.track(new WebGPUSampler(this, descriptor));
  }

  createShaderModule(descriptor: ShaderModuleDescriptor): WebGPUShaderModule {
    this.assertUsable('createShaderModule');
    return this.track(new WebGPUShaderModule(this, descriptor));
  }

  createQuerySet(descriptor: QuerySetDescriptor): WebGPUQuerySet {
    this.assertUsable('createQuerySet');
    return this.track(new WebGPUQuerySet(this, descriptor));
  }

  /**
   * 读回 query set 的结果：`resolveQuerySet` → `copyBufferToBuffer` → `mapAsync`。
   *
   * 两个中转 buffer 都通过 `this.createBuffer()` 创建，因此被设备的资源追踪覆盖：
   * 正常路径由 `QueryResult.read()` 销毁，忘了读则在 `device.dispose()` 时统一释放。
   */
  readQuerySet(querySet: QuerySet, options: QuerySetReadOptions = {}): QueryResult {
    this.assertUsable('readQuerySet');
    // 先收窄原生对象（顺带校验这是本后端的 query set），早报错更清楚。
    asGPUQuerySet(querySet, `Device "${this.label}".readQuerySet(querySet)`);

    const first = options.firstQuery ?? 0;
    assertNonNegativeInteger(first, 'QuerySetReadOptions.firstQuery');
    const count = options.queryCount ?? querySet.count - first;
    if (!Number.isInteger(count) || count <= 0) {
      throw new ValidationError(
        `[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ` +
          `${String(count)}.`,
      );
    }
    if (first + count > querySet.count) {
      throw new ValidationError(
        `[gpu-device-api] Device "${this.label}".readQuerySet: range [${first}, ${first + count}) exceeds the ` +
          `query set "${querySet.label}" count ${querySet.count}.`,
      );
    }

    const label = options.label ?? `${querySet.label}:read`;
    const byteSize = count * 8;
    const staging = this.createBuffer({
      label: `${label}#resolve`,
      size: byteSize,
      usage: BufferUsage.QueryResolve | BufferUsage.CopySrc,
    });
    const readback = this.createBuffer({
      label: `${label}#readback`,
      size: byteSize,
      usage: BufferUsage.MapRead | BufferUsage.CopyDst,
    });

    const encoder = this.createCommandEncoder({ label });
    try {
      encoder.resolveQuerySet(querySet, first, count, staging, 0);
      encoder.copyBufferToBuffer(staging, 0, readback, 0, byteSize);
      this.queue.submit([encoder.finish()]);
    } catch (error) {
      readback.destroy();
      staging.destroy();
      throw error;
    } finally {
      encoder.dispose();
    }

    return new WebGPUQueryResult({
      type: querySet.type,
      count,
      timestampPeriod: this.timestampPeriod,
      staging,
      readback,
    });
  }

  /* ---------------------------------------------------------------- 绑定 */

  createBindGroupLayout(descriptor: BindGroupLayoutDescriptor): WebGPUBindGroupLayout {
    this.assertUsable('createBindGroupLayout');
    return this.track(new WebGPUBindGroupLayout(this, descriptor));
  }

  createBindGroup(descriptor: BindGroupDescriptor): WebGPUBindGroup {
    this.assertUsable('createBindGroup');
    return this.track(new WebGPUBindGroup(this, descriptor));
  }

  createPipelineLayout(descriptor: PipelineLayoutDescriptor): WebGPUPipelineLayout {
    this.assertUsable('createPipelineLayout');
    return this.track(WebGPUPipelineLayout.create(this, descriptor));
  }

  /* ---------------------------------------------------------------- 管线 */

  createRenderPipeline(descriptor: RenderPipelineDescriptor): WebGPURenderPipeline {
    this.assertUsable('createRenderPipeline');
    return this.track(new WebGPURenderPipeline(this, descriptor));
  }

  createComputePipeline(descriptor: ComputePipelineDescriptor): WebGPUComputePipeline {
    this.assertUsable('createComputePipeline');
    return this.track(new WebGPUComputePipeline(this, descriptor));
  }

  /* ---------------------------------------------------------------- 渲染 */

  createRenderTarget(descriptor: RenderTargetDescriptor): WebGPURenderTarget {
    this.assertUsable('createRenderTarget');
    return this.track(new WebGPURenderTarget(this, descriptor));
  }

  createCommandEncoder(descriptor: CommandEncoderDescriptor = {}): WebGPUCommandEncoder {
    this.assertUsable('createCommandEncoder');
    return this.track(new WebGPUCommandEncoder(this, descriptor));
  }

  /**
   * 为一个 canvas 建立（或取回）本设备的 swap chain 表面。
   *
   * 同一个 canvas 只会有一个 `GPUCanvasContext`，因此这里按 canvas 元素缓存
   * {@link WebGPUCanvasContext}；重复调用返回同一个对象。给了 `config`（或该 canvas 尚未
   * configure）时会重新 configure —— 也就是可以用它切换格式 / alphaMode / sampleCount。
   */
  createCanvasContext(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    config?: Omit<CanvasConfig, 'device'>,
  ): WebGPUCanvasContext {
    this.assertUsable('createCanvasContext');
    if (!canvas || typeof (canvas as { getContext?: unknown }).getContext !== 'function') {
      throw new ValidationError(
        '[gpu-device-api] Device.createCanvasContext: expected an HTMLCanvasElement or OffscreenCanvas.',
      );
    }
    let context = this.canvasContexts.get(canvas);
    if (!context || context.disposed) {
      context = this.track(new WebGPUCanvasContext(canvas));
      this.canvasContexts.set(canvas, context);
    }
    if (config !== undefined || !context.configured) {
      context.configure({ ...config, device: this });
    }
    return context;
  }

  /* ---------------------------------------------------------------- 错误 */

  /**
   * 注册错误回调，返回取消订阅函数。
   *
   * 设备丢失也会通过这个通道上报（见 {@link WebGPUDevice.lost}），因此即使只关心
   * 「设备还能不能用」，也应该注册一次。
   */
  onError(callback: (error: GpuError) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /** 通过已注册的回调上报错误，不抛异常。回调自身抛错不会影响其它回调。 */
  reportError(error: GpuError): void {
    if (this.errorCallbacks.size === 0) {
      // 没有订阅者时至少留下一条日志，避免错误被完全吞掉。
      this.logger.error(error.toString());
      return;
    }
    for (const callback of [...this.errorCallbacks]) {
      try {
        callback(error);
      } catch (callbackError) {
        this.logger.error(`error callback threw: ${String(callbackError)}`);
      }
    }
  }

  /** 释放设备创建的全部资源，然后销毁 device。幂等。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.native.onuncapturederror = null;

    const resources = [...this.resources];
    this.resources.clear();
    this.canvasContexts.clear();
    try {
      disposeAll(resources);
    } catch (error) {
      this.logger.error(`failed to dispose some resources: ${String(error)}`);
    }
    this.errorCallbacks.clear();
    this.native.destroy();
  }

  /* ---------------------------------------------------------------- 内部 */

  private track<T extends Disposable>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  /**
   * 资源在 `destroy()` / `dispose()` 时把自己从追踪集合里摘掉。
   *
   * 不做这一步的话，每帧 create/destroy 的工作负载（command encoder、buffer、texture、
   * bind group……）会让 `resources` 一直强引用这些已经释放的包装对象及其原生句柄，
   * 直到 `device.dispose()` 才释放 —— 这是实打实的泄漏。
   *
   * 幂等：对未追踪（或已摘掉）的资源调用是空操作。
   */
  untrack(resource: Disposable): void {
    this.resources.delete(resource);
  }

  private assertUsable(context: string): void {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] Device.${context}: device "${this.label}" has been disposed.`);
    }
    if (this.lostInfo) {
      throw new DeviceLostError(
        `[gpu-device-api] Device.${context}: device "${this.label}" was lost (${this.lostInfo.reason}): ` +
          this.lostInfo.message,
        { reason: this.lostInfo.reason },
      );
    }
  }

  private handleDeviceLost(info: GPUDeviceLostInfo): void {
    const reason: DeviceLostReason = info.reason === 'destroyed' ? 'destroyed' : 'unknown';
    const lostInfo: DeviceLostInfo = { reason, message: info.message };
    this.lostInfo = lostInfo;
    this.resolveLost(lostInfo);
    if (!this._disposed) {
      this.reportError(
        new DeviceLostError(`[gpu-device-api] WebGPU device lost (${reason}): ${info.message}`, { reason }),
      );
    }
  }
}

/**
 * 把原生 `GPUError` 翻译成 core 的错误类型。
 *
 * 分类同时尝试 `instanceof`（浏览器里全局构造器存在）与 `constructor.name`（构造器被跨
 * realm / 被 polyfill 时的兜底），保证「不知道是哪一类」时也不会丢消息。
 */
export function toGpuError(error: unknown): GpuError {
  if (isGpuError(error)) return error;
  const rawMessage =
    typeof (error as { message?: unknown } | null | undefined)?.message === 'string'
      ? (error as { message: string }).message
      : String(error);
  const message = rawMessage.startsWith('[gpu-device-api]')
    ? rawMessage
    : `[gpu-device-api] ${rawMessage}`;

  if (isGpuErrorClass(error, 'GPUValidationError')) return new ValidationError(message);
  if (isGpuErrorClass(error, 'GPUOutOfMemoryError')) return new OutOfMemoryError(message);
  if (isGpuErrorClass(error, 'GPUInternalError')) return new GpuError(message, { code: 'INTERNAL_ERROR' });
  if (error instanceof Error) return new GpuError(message, { code: 'GPU_ERROR', cause: error });
  return new GpuError(message);
}

function isGpuErrorClass(value: unknown, className: string): boolean {
  const ctor = (globalThis as unknown as Record<string, unknown>)[className];
  if (typeof ctor === 'function') {
    const typed = ctor as new (...args: never[]) => unknown;
    try {
      if (value instanceof typed) return true;
    } catch {
      // 某些 polyfill 的构造器不支持 instanceof；继续走名字兜底。
    }
  }
  const name = (value as { constructor?: { name?: string } } | null | undefined)?.constructor?.name;
  return name === className;
}

/**
 * 读出设备上**真正启用**的 feature 集合。
 *
 * `GPUDevice.features` 是权威来源（它只列出已启用的），但它不是所有实现都提供，
 * mock 里也没有；拿不到时退回 `requiredFeatures`（`requestDevice` 已经校验过这些名字可用）。
 */
function readEnabledFeatures(native: GPUDevice, requested: readonly string[]): ReadonlySet<string> {
  const fromDevice = readSupportedFeatures((native as { features?: GPUSupportedFeatures }).features);
  if (fromDevice.size > 0) return fromDevice;
  return new Set(requested);
}
