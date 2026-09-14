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
import type { QuerySetDescriptor } from '../core/resources/QuerySet.js';
import type { SamplerDescriptor } from '../core/resources/Sampler.js';
import type { ShaderModuleDescriptor } from '../core/resources/ShaderModule.js';
import type { TextureDescriptor } from '../core/resources/Texture.js';
import type { Disposable } from '../utils/Disposable.js';
import { GpuError, isGpuError } from '../core/errors/GpuError.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { OutOfMemoryError } from '../core/errors/OutOfMemoryError.js';
import { DeviceLostError, type DeviceLostReason } from '../core/errors/DeviceLostError.js';
import { disposeAll } from '../utils/Disposable.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { nextId } from '../utils/id.js';
import { assertSampleCount } from './utils/wgpuEnumMap.js';
import { readDeviceLimits, WebGPUFeatures, type WebGPUAdapterRequestOptions } from './utils/wgpuCapabilities.js';
import { WebGPUBuffer } from './resources/WebGPUBuffer.js';
import { WebGPUTexture } from './resources/WebGPUTexture.js';
import { WebGPUSampler } from './resources/WebGPUSampler.js';
import { WebGPUShaderModule } from './resources/WebGPUShaderModule.js';
import { WebGPUQuerySet } from './resources/WebGPUQuerySet.js';
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
