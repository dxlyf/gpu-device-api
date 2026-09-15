/**
 * WebGL2 的设备：所有 GL 资源的归属者，也是 core `Device` 接口的实现。
 *
 * 与 WebGPU 版本最大的区别在于**它是同步的**：`createBuffer` 等工作立即完成，
 * 因为 GL 没有「设备对象」这一层，`WebGL2RenderingContext` 本身就已经持有全部状态。
 *
 * 设备内部持有的共享设施：
 * - `GlStateCache`：避免重复的 GL 状态设置；
 * - `ProgramCache`：program 编译与链接缓存（可跨管线共享）；
 * - `BindingPlanCache`：`PipelineLayout` 到 GL 槽位分配的缓存；
 * - `FramebufferCache`：原始附件组合的 framebuffer 缓存；
 * - 资源登记表：`dispose()` 时统一释放。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { BufferUsage } from '../core/enums/BufferUsage.js';
import { ShaderStage } from '../core/enums/ShaderStage.js';
import { GpuError } from '../core/errors/GpuError.js';
import { DeviceLostError } from '../core/errors/DeviceLostError.js';
import { compileShaderStage } from '../shaders/ShaderCompiler.js';
import { inferBindGroupLayoutEntries } from '../shaders/reflection/GLSLReflector.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { nextId } from '../utils/id.js';
import { resolveLimits } from '../core/Device.js';
import type { Device, DeviceDescriptor, DeviceFeatures, DeviceLimits, DeviceLostInfo } from '../core/Device.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasConfig, CanvasContext } from '../core/CanvasContext.js';
import type { Buffer, BufferDescriptor } from '../core/resources/Buffer.js';
import type { Texture, TextureDescriptor } from '../core/resources/Texture.js';
import type { Sampler, SamplerDescriptor } from '../core/resources/Sampler.js';
import type { ShaderModule, ShaderModuleDescriptor } from '../core/resources/ShaderModule.js';
import type { QuerySet, QuerySetDescriptor } from '../core/resources/QuerySet.js';
import type { QueryResult, QuerySetReadOptions } from '../core/sync/QueryResult.js';
import type { BindGroup, BindGroupDescriptor } from '../core/binding/BindGroup.js';
import type { BindGroupLayout, BindGroupLayoutDescriptor } from '../core/binding/BindGroupLayout.js';
import type { PipelineLayout, PipelineLayoutDescriptor } from '../core/binding/PipelineLayout.js';
import type { RenderPipeline, RenderPipelineDescriptor } from '../core/pipeline/RenderPipeline.js';
import type { ComputePipeline, ComputePipelineDescriptor } from '../core/pipeline/ComputePipeline.js';
import type { CommandEncoder, CommandEncoderDescriptor } from '../core/render/CommandEncoder.js';
import type { RenderTarget, RenderTargetDescriptor } from '../core/render/RenderTarget.js';
import type { Disposable } from '../utils/Disposable.js';

import { GlStateCache } from './utils/glStateCache.js';
import { buildDeviceLimits, queryGlFeatures, queryGlRendererInfo } from './utils/glCapabilities.js';
import { WebGL2Buffer } from './resources/WebGL2Buffer.js';
import { WebGL2Texture } from './resources/WebGL2Texture.js';
import { WebGL2Sampler } from './resources/WebGL2Sampler.js';
import { WebGL2ShaderModule } from './resources/WebGL2ShaderModule.js';
import { WebGL2QuerySet, asWebGL2QuerySet } from './resources/WebGL2QuerySet.js';
import { WebGL2BindGroupLayout } from './binding/WebGL2BindGroupLayout.js';
import { WebGL2BindGroup } from './binding/WebGL2BindGroup.js';
import { WebGL2PipelineLayout } from './binding/WebGL2PipelineLayout.js';
import { BindingPlanCache } from './binding/TextureUnitAllocator.js';
import { ProgramCache } from './pipeline/ProgramCache.js';
import { WebGL2RenderPipeline } from './pipeline/WebGL2RenderPipeline.js';
import { WebGL2ComputePipeline } from './pipeline/WebGL2ComputePipeline.js';
import { WebGL2RenderTarget } from './render/WebGL2RenderTarget.js';
import { WebGL2CommandEncoder } from './render/WebGL2CommandEncoder.js';
import { FramebufferCache } from './render/framebuffer-cache.js';
import { WebGL2Queue } from './sync/WebGL2Queue.js';
import { WebGL2Fence } from './sync/WebGL2Fence.js';
import { WebGL2QueryResult } from './sync/WebGL2QueryResult.js';
import { WebGL2CanvasContext } from './WebGL2CanvasContext.js';

export interface WebGL2DeviceOptions {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  descriptor?: DeviceDescriptor;
  adapterLimits: DeviceLimits;
  adapterFeatures: ReadonlySet<string>;
  logger?: Logger;
}

export class WebGL2Device implements Device {
  readonly label: string;
  readonly backend: BackendKind = 'webgl2';
  readonly features: DeviceFeatures;
  readonly limits: DeviceLimits;
  readonly queue: WebGL2Queue;
  readonly debug: boolean;
  readonly native: WebGL2RenderingContext;

  /** 状态缓存；canvas context 等在外部改动 GL 状态后会调用 {@link WebGL2Device.invalidateState}。 */
  readonly state: GlStateCache;
  readonly planCache: BindingPlanCache;
  readonly programs: ProgramCache;
  readonly framebuffers: FramebufferCache;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;

  private readonly gl: WebGL2RenderingContext;
  private readonly logger: Logger;
  private readonly resources = new Set<Disposable>();
  private readonly errorCallbacks = new Set<(error: GpuError) => void>();
  private readonly canvasContexts = new Map<HTMLCanvasElement | OffscreenCanvas, WebGL2CanvasContext>();
  private lostResolve!: (info: DeviceLostInfo) => void;
  private lostPromise: Promise<DeviceLostInfo>;
  private _disposed = false;

  constructor(options: WebGL2DeviceOptions) {
    this.gl = options.gl;
    this.canvas = options.canvas;
    this.native = options.gl;
    this.debug = options.descriptor?.debug ?? false;
    this.logger = options.logger ?? createLogger('gpu-device-api/webgl2');
    this.label = options.descriptor?.label ?? nextId('webgl2Device');

    this.limits = resolveLimits(options.adapterLimits, options.descriptor?.requiredLimits, 'webgl2');

    const featureNames = [...options.adapterFeatures];
    const featureSet = new Set(featureNames);
    const missing = (options.descriptor?.requiredFeatures ?? []).filter((name) => !featureSet.has(name));
    if (missing.length > 0) {
      throw new ValidationError(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${missing.join('、')}。\n` +
          `当前可用特性：${featureNames.join('、') || '(无)'}。`,
      );
    }
    this.features = {
      has: (feature: string) => featureSet.has(feature),
      names: featureNames,
    };

    this.state = new GlStateCache(options.gl);
    this.planCache = new BindingPlanCache({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12),
    });
    this.programs = new ProgramCache({ gl: options.gl, state: this.state });
    this.framebuffers = new FramebufferCache(options.gl);
    this.queue = new WebGL2Queue(options.gl, this.state);

    this.lostPromise = new Promise<DeviceLostInfo>((resolve) => {
      this.lostResolve = resolve;
    });

    // WebGL2 的上下文丢失事件：把它转成与 WebGPU 一致的 device.lost。
    const canvasElement = options.canvas as HTMLCanvasElement;
    if (typeof canvasElement.addEventListener === 'function') {
      canvasElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.lostResolve({ reason: 'unknown', message: 'WebGL2 上下文丢失（通常是驱动重置或资源占用过高）。' });
      });
    }
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get lost(): Promise<DeviceLostInfo> {
    return this.lostPromise;
  }

  /** 让 GL 状态缓存失效；外部通过 escape hatch 改动状态后必须调用。 */
  invalidateState(): void {
    this.state.invalidate();
  }

  /* ------------------------------------------------------------------ 资源 ------------------- */

  createBuffer(descriptor: BufferDescriptor): Buffer {
    this.assertUsable('createBuffer');
    return this.track(
      new WebGL2Buffer(this.gl, this.state, descriptor, (buffer) => {
        void buffer;
      }),
    );
  }

  createTexture(descriptor: TextureDescriptor): Texture {
    this.assertUsable('createTexture');
    return this.track(
      new WebGL2Texture(this.gl, this.state, descriptor, () => {
        // 纹理销毁时清掉引用它的 framebuffer 缓存，避免复用到已经失效的附件。
        this.framebuffers.clear();
      }),
    );
  }

  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(
    format: TextureDescriptor['format'],
    width: number,
    height: number,
    usage: BufferUsage | number,
    label: string,
  ): WebGL2Texture {
    return this.track(
      new WebGL2Texture(
        this.gl,
        this.state,
        { format, size: { width, height }, usage: usage as TextureDescriptor['usage'], label },
        () => this.framebuffers.clear(),
      ),
    );
  }

  createSampler(descriptor: SamplerDescriptor = {}): Sampler {
    this.assertUsable('createSampler');
    return this.track(new WebGL2Sampler(this.gl, this.state, descriptor));
  }

  createShaderModule(descriptor: ShaderModuleDescriptor): ShaderModule {
    this.assertUsable('createShaderModule');
    return this.track(new WebGL2ShaderModule(descriptor));
  }

  /**
   * 创建 query set。
   *
   * - occlusion：`ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，直接用；
   * - timestamp：需要 `EXT_disjoint_timer_query_webgl2`，扩展缺失时抛带 `[gpu-device-api] ` 前缀的
   *   英文错误说明缺哪个扩展（而不是静默返回 0）。
   */
  createQuerySet(descriptor: QuerySetDescriptor): QuerySet {
    this.assertUsable('createQuerySet');
    return this.track(new WebGL2QuerySet(this.gl, descriptor, (querySet) => this.untrack(querySet)));
  }

  /**
   * 读回 query set 的结果：轮询 `QUERY_RESULT_AVAILABLE` 后逐条 `getQueryParameter`。
   *
   * 轮询本身是异步的（每轮让出一拍），不会像 `gl.finish()` 那样强制同步 GPU；
   * 但结果只有在 GPU 真正做完之后才可用，所以调用方应该**延迟若干帧**再读
   * （gfx 的 GPU 计时就是这么做的）。
   */
  readQuerySet(querySet: QuerySet, options: QuerySetReadOptions = {}): QueryResult {
    this.assertUsable('readQuerySet');
    const set = asWebGL2QuerySet(querySet, `Device "${this.label}".readQuerySet(querySet)`);

    const first = options.firstQuery ?? 0;
    if (!Number.isInteger(first) || first < 0) {
      throw new ValidationError(
        `[gpu-device-api] Device "${this.label}".readQuerySet: firstQuery must be a non-negative integer, got ` +
          `${String(first)}.`,
      );
    }
    const count = options.queryCount ?? set.count - first;
    if (!Number.isInteger(count) || count <= 0) {
      throw new ValidationError(
        `[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ` +
          `${String(count)}.`,
      );
    }
    if (first + count > set.count) {
      throw new ValidationError(
        `[gpu-device-api] Device "${this.label}".readQuerySet: range [${first}, ${first + count}) exceeds the ` +
          `query set "${set.label}" count ${set.count}.`,
      );
    }

    return new WebGL2QueryResult({
      gl: this.gl,
      querySet: set,
      type: set.type,
      first,
      count,
    });
  }

  /* ------------------------------------------------------------------ 绑定 ------------------- */

  createBindGroupLayout(descriptor: BindGroupLayoutDescriptor): BindGroupLayout {
    this.assertUsable('createBindGroupLayout');
    return this.track(new WebGL2BindGroupLayout(descriptor));
  }

  createBindGroup(descriptor: BindGroupDescriptor): BindGroup {
    this.assertUsable('createBindGroup');
    return this.track(new WebGL2BindGroup(descriptor));
  }

  createPipelineLayout(descriptor: PipelineLayoutDescriptor): PipelineLayout {
    this.assertUsable('createPipelineLayout');
    return this.track(new WebGL2PipelineLayout(descriptor, false, this));
  }

  /* ------------------------------------------------------------------ 管线 ------------------- */

  createRenderPipeline(descriptor: RenderPipelineDescriptor): RenderPipeline {
    this.assertUsable('createRenderPipeline');
    const label = descriptor.label ?? 'renderPipeline';

    const vertexCode = compileShaderStage({
      backend: 'webgl2',
      source: descriptor.vertex.module.source,
      stage: ShaderStage.Vertex,
      label,
      defines: descriptor.vertex.module.defines,
      glsl: descriptor.vertex.module.glsl,
    }).code;

    if (!descriptor.fragment) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n' +
          '只写深度时，可以在片元着色器里 `discard` 而不输出颜色。',
      );
    }
    const fragmentCode = compileShaderStage({
      backend: 'webgl2',
      source: descriptor.fragment.module.source,
      stage: ShaderStage.Fragment,
      label,
      defines: descriptor.fragment.module.defines,
      glsl: descriptor.fragment.module.glsl,
    }).code;

    const compiled = this.programs.acquire(label, vertexCode, fragmentCode);

    // 解析布局：显式布局直接用；'auto' 需要先链接出 program 才能反射接口。
    let layout: PipelineLayout | 'auto';
    if (descriptor.layout === undefined || descriptor.layout === 'auto') {
      const entries = inferBindGroupLayoutEntries(compiled.reflection, ShaderStage.Vertex | ShaderStage.Fragment);
      if (entries.length === 0) {
        // 着色器没有用到任何 binding（例如画一个纯色三角形）：此时没有布局可推断，
        // 保留 'auto' 即可 —— 绑定计划为 null，渲染通道也不会尝试绑定任何 bind group。
        layout = 'auto';
        this.programs.bindPlan(compiled, null);
      } else {
        const inferredLayout = new WebGL2BindGroupLayout({
          label: `${label}:autoLayout`,
          entries,
        });
        this.track(inferredLayout);
        layout = this.track(
          new WebGL2PipelineLayout(
            { label: `${label}:autoPipelineLayout`, bindGroupLayouts: [inferredLayout] },
            true,
            this,
          ),
        );
        this.programs.bindPlan(compiled, (layout as WebGL2PipelineLayout).bindingPlan);
      }
    } else {
      layout = descriptor.layout;
      this.programs.bindPlan(compiled, (layout as WebGL2PipelineLayout).bindingPlan);
    }

    const pipeline = new WebGL2RenderPipeline(descriptor, compiled, layout, {
      gl: this.gl,
      state: this.state,
      limits: {
        maxVertexAttributes: this.limits.maxVertexAttributes,
        maxVertexBufferArrayStride: this.limits.maxVertexBufferArrayStride,
      },
    });
    return this.track(pipeline);
  }

  createComputePipeline(descriptor: ComputePipelineDescriptor): ComputePipeline {
    this.assertUsable('createComputePipeline');
    return new WebGL2ComputePipeline(descriptor);
  }

  /* ------------------------------------------------------------------ 渲染 ------------------- */

  createRenderTarget(descriptor: RenderTargetDescriptor = {}): RenderTarget {
    this.assertUsable('createRenderTarget');
    return this.track(
      new WebGL2RenderTarget(descriptor, {
        gl: this.gl,
        state: this.state,
        createTexture: (format, width, height, usage, label) =>
          this.createAttachmentTexture(format, width, height, usage, label),
      }),
    );
  }

  createCommandEncoder(descriptor?: CommandEncoderDescriptor): CommandEncoder {
    this.assertUsable('createCommandEncoder');
    const encoder = new WebGL2CommandEncoder(descriptor, this.gl, this.state, {
      gl: this.gl,
      state: this.state,
      framebuffers: this.framebuffers,
      getDefaultSize: () => ({ width: this.gl.drawingBufferWidth, height: this.gl.drawingBufferHeight }),
      onDraw: () => {
        if (this.debug) this.checkGlError('draw');
      },
    });
    return encoder;
  }

  createCanvasContext(canvas: HTMLCanvasElement | OffscreenCanvas, config?: Omit<CanvasConfig, 'device'>): CanvasContext {
    this.assertUsable('createCanvasContext');
    if (canvas !== this.canvas) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 的 device 只能服务创建它的那个 canvas。\n' +
          'GL context 是从 canvas 上取的，一个 device 对应一个 canvas；' +
          '如果确实需要渲染到多个 canvas，请为每个 canvas 单独 createDevice()。',
      );
    }
    let context = this.canvasContexts.get(canvas);
    if (!context) {
      context = new WebGL2CanvasContext({ gl: this.gl, canvas, format: config?.format });
      this.canvasContexts.set(canvas, context);
    }
    context.configure({ ...config, device: this });
    this.state.invalidate();
    return context;
  }

  /** 创建一个进程内的同步点（fence）。 */
  createFence(): WebGL2Fence {
    return new WebGL2Fence(this.gl);
  }

  /* ------------------------------------------------------------------ 错误 ------------------- */

  onError(callback: (error: GpuError) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  reportError(error: GpuError): void {
    if (this.errorCallbacks.size === 0) {
      this.logger.error(error.message);
      return;
    }
    for (const callback of this.errorCallbacks) callback(error);
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    // 先释放资源（它们可能引用了缓存里的对象），再清空各缓存。
    const resources = [...this.resources];
    this.resources.clear();
    for (const resource of resources) {
      try {
        resource.dispose();
      } catch (error) {
        this.logger.warn('释放资源时出错', error);
      }
    }
    this.programs.dispose();
    this.framebuffers.dispose();
    this.planCache.clear();
    for (const context of this.canvasContexts.values()) context.dispose();
    this.canvasContexts.clear();
    this.state.invalidate();
    this.lostResolve({ reason: 'destroyed', message: '设备已调用 dispose()。' });
  }

  /**
   * 在 debug 模式下轮询 `gl.getError()` 并转成统一错误。
   * 注意这会强制 CPU/GPU 同步，所以只在 debug 打开时调用。
   */
  checkGlError(context: string): void {
    if (!this.debug) return;
    const error = this.gl.getError();
    if (error === this.gl.NO_ERROR) return;
    this.reportError(
      new GpuError(`[gpu-device-api] GL 错误 0x${error.toString(16)}（发生在 ${context} 之后）。`, {
        code: 'GL_ERROR',
        details: { glError: error, context },
      }),
    );
  }

  private track<T extends Disposable>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  /**
   * 资源在 `destroy()` 时把自己从追踪集合里摘掉（与 WebGPU 后端同一套机制）。
   *
   * 不做这一步，「每帧 create/destroy」的用法（query set、临时 buffer……）会让 `resources`
   * 一直强引用已经释放的包装对象与原生句柄，直到 `device.dispose()`。幂等。
   */
  untrack(resource: Disposable): void {
    this.resources.delete(resource);
  }

  private assertUsable(operation: string): void {
    if (this._disposed) {
      throw new DeviceLostError(`[gpu-device-api] 设备已 dispose()，不能再调用 ${operation}()。`, {
        reason: 'destroyed',
      });
    }
  }
}

/** 探测当前 canvas 上可用的 WebGL2 能力，供 adapter 使用。 */
export function describeGlAdapter(gl: WebGL2RenderingContext): {
  limits: DeviceLimits;
  features: Set<string>;
  vendor: string;
  device: string;
} {
  const info = queryGlRendererInfo(gl);
  return {
    limits: buildDeviceLimits(gl),
    features: queryGlFeatures(gl),
    vendor: info.vendor,
    device: info.device,
  };
}
