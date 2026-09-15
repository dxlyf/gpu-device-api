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
 * - 资源登记表：`dispose()` 时统一释放。每个资源在自己的 `destroy()` / `dispose()` 里会通过
 *   {@link WebGL2Device.untrack} 把自己摘掉，所以「每帧 create/destroy」不会把登记表撑大。
 *
 * ## 上下文丢失（device lost）
 *
 * `webglcontextlost` / `webglcontextrestored` 都会被监听并**如实上报**（见 {@link WebGL2Device.lostInfo}、
 * {@link WebGL2Device.usable}、{@link WebGL2Device.onContextRestored}）。但**完整恢复做不到**：
 * 上下文丢失会让本设备创建过的每一个 GL 对象失效，而包装对象里只有作废的句柄、没有可重放的
 * descriptor，本层无法重建它们。所以丢失之后所有 `create*` / 读回入口都会抛带
 * `[gpu-device-api] ` 前缀的 `DeviceLostError`，恢复的正确做法是 `dispose()` 之后重新 `createDevice()`
 * 并重建全部资源 —— 详见 `docs/backend-limits.md`，不在本层偷偷假装可用。
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
import type { Device, DeviceDescriptor, DeviceFeatures, DeviceLimits, DeviceLostInfo, DeviceTimingSupport } from '../core/Device.js';
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
import { WebGL2QuerySet, asWebGL2QuerySet, TIMER_QUERY_EXTENSION } from './resources/WebGL2QuerySet.js';
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
  /**
   * GPU 计时能力的真实探测结果（见 {@link DeviceTimingSupport}）。
   *
   * WebGL2 只有一条路：pass 级区间计时（`gl.beginQuery(TIME_ELAPSED_EXT)` → `endQuery`），
   * 而它依赖 `EXT_disjoint_timer_query_webgl2` 扩展 —— 这里在创建设备时**真的去问一次**
   * `gl.getExtension()`，而不是相信 adapter 阶段记下来的 feature 名。
   */
  readonly timing: DeviceTimingSupport;

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
  /** 上下文恢复事件的订阅者；与 `errorCallbacks` 一样在 `dispose()` 时清空。 */
  private readonly contextRestoredCallbacks = new Set<(info: DeviceLostInfo) => void>();
  private readonly canvasContexts = new Map<HTMLCanvasElement | OffscreenCanvas, WebGL2CanvasContext>();
  private lostResolve!: (info: DeviceLostInfo) => void;
  private lostPromise: Promise<DeviceLostInfo>;
  /**
   * 设备丢失信息；未丢失（或只是 `dispose()`）时为 null。
   *
   * WebGL2 的「设备丢失」就是 GL context 丢失：`webglcontextlost` 一旦触发，
   * 本设备创建过的**每一个** GL 对象都已经失效，而且我们没有任何办法把它们重建
   * （包装对象里只有已经作废的句柄，没有可重放的 descriptor）—— 所以这里如实记录，
   * 让后续所有操作明确报错，而不是在失效句柄上静默地画不出东西。
   */
  private lostInfoValue: DeviceLostInfo | null = null;
  /** `webglcontextrestored` 触发的次数（诊断与测试用）。 */
  private contextRestoreCount = 0;
  /** 安装监听器的目标（canvas 或 OffscreenCanvas）；不支持事件时保持 null。 */
  private readonly eventTarget: EventTarget | null;
  private readonly handleContextLost: ((event: Event) => void) | null;
  private readonly handleContextRestored: ((event: Event) => void) | null;
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
    this.timing = readTimingSupport(options.gl);

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

    /*
     * WebGL2 的上下文丢失事件：把它转成与 WebGPU 一致的 device.lost。
     *
     * - `webglcontextlost`：`preventDefault()` 是**必须**的 —— 不调用它浏览器就不会再
     *   尝试恢复上下文（也就永远不会触发 restored），而且默认行为还会继续把错误抛到控制台。
     * - `webglcontextrestored`：GL context 对象本身又能用了，但**它创建过的所有对象都已经
     *   不存在**。本抽象层没有「重建全部资源」的能力（见 lostInfo 的说明），所以这里只如实上报。
     *
     * 两个监听器都保存在字段里，`dispose()` 会 removeEventListener —— 否则 device 被丢弃后
     * canvas 仍然强引用着它（连同它的资源集合），是实打实的监听器泄漏。
     */
    const candidate = options.canvas as unknown as Partial<EventTarget>;
    this.eventTarget =
      typeof candidate.addEventListener === 'function' && typeof candidate.removeEventListener === 'function'
        ? (options.canvas as unknown as EventTarget)
        : null;
    if (this.eventTarget) {
      this.handleContextLost = (event: Event) => {
        event.preventDefault();
        this.handleContextLostEvent();
      };
      this.handleContextRestored = () => this.handleContextRestoredEvent();
      this.eventTarget.addEventListener('webglcontextlost', this.handleContextLost);
      this.eventTarget.addEventListener('webglcontextrestored', this.handleContextRestored);
    } else {
      this.handleContextLost = null;
      this.handleContextRestored = null;
      this.logger.debug('canvas 上没有 addEventListener，跳过 webglcontextlost/restored 监听。');
    }
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get lost(): Promise<DeviceLostInfo> {
    return this.lostPromise;
  }

  /**
   * 设备是否仍然可用：没有 `dispose()`，也没有丢失过 GL context。
   *
   * 注意「上下文恢复」**不会**把这里变回 true：restored 只说明这个 canvas 又能取到可用的
   * GL context，本设备已经创建过的资源全部失效且无法重建（见 {@link lostInfo}）。
   */
  get usable(): boolean {
    return !this._disposed && this.lostInfoValue === null;
  }

  /** 设备丢失信息；未丢失时为 null。与 `lost` promise 表达同一件事，但可以直接查询。 */
  get lostInfo(): DeviceLostInfo | null {
    return this.lostInfoValue;
  }

  /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
  get trackedResourceCount(): number {
    return this.resources.size;
  }

  /** `webglcontextrestored` 已触发的次数；恢复只影响 canvas，不影响本设备持有的资源。 */
  get contextRestoredCount(): number {
    return this.contextRestoreCount;
  }

  /**
   * 订阅「GL context 被浏览器恢复」事件，返回取消订阅函数。
   *
   * 为什么需要它：`webglcontextlost` 会让 `device.lost` resolve（一次性的），而 restored 可能
   * 在其后任意时刻发生。恢复后 canvas 与 GL context 本身又能用了，但**本设备创建过的资源
   * 全部失效**（GL 对象随上下文一起消失，我们没有 descriptor 可以重建它们）。
   * 因此收到这个回调后应当：`device.dispose()` → 重新 `createDevice()` → 重建全部资源。
   */
  onContextRestored(callback: (info: DeviceLostInfo) => void): () => void {
    this.contextRestoredCallbacks.add(callback);
    return () => {
      this.contextRestoredCallbacks.delete(callback);
    };
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
        // 释放时把自己从追踪集合里摘掉，否则「每帧 create/destroy」会一直堆积到 device.dispose()。
        this.untrack(buffer);
      }),
    );
  }

  createTexture(descriptor: TextureDescriptor): Texture {
    this.assertUsable('createTexture');
    return this.track(
      new WebGL2Texture(this.gl, this.state, descriptor, (texture) => {
        // 纹理销毁时清掉引用它的 framebuffer 缓存，避免复用到已经失效的附件。
        this.framebuffers.clear();
        this.untrack(texture);
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
    const texture = new WebGL2Texture(
      this.gl,
      this.state,
      { format, size: { width, height }, usage: usage as TextureDescriptor['usage'], label },
      (destroyed) => {
        this.framebuffers.clear();
        this.untrack(destroyed);
      },
    );
    return this.track(texture);
  }

  createSampler(descriptor: SamplerDescriptor = {}): Sampler {
    this.assertUsable('createSampler');
    const sampler = new WebGL2Sampler(this.gl, this.state, descriptor, (destroyed) =>
      this.untrack(destroyed),
    );
    return this.track(sampler);
  }

  createShaderModule(descriptor: ShaderModuleDescriptor): ShaderModule {
    this.assertUsable('createShaderModule');
    // 回调只会在 dispose() 时执行，那时 `module` 早已初始化完毕。
    const module = new WebGL2ShaderModule(descriptor, () => this.untrack(module));
    return this.track(module);
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
    const layout = new WebGL2BindGroupLayout(descriptor, () => this.untrack(layout));
    return this.track(layout);
  }

  createBindGroup(descriptor: BindGroupDescriptor): BindGroup {
    this.assertUsable('createBindGroup');
    const bindGroup = new WebGL2BindGroup(descriptor, () => this.untrack(bindGroup));
    return this.track(bindGroup);
  }

  createPipelineLayout(descriptor: PipelineLayoutDescriptor): PipelineLayout {
    this.assertUsable('createPipelineLayout');
    const layout = new WebGL2PipelineLayout(descriptor, false, this, () => this.untrack(layout));
    return this.track(layout);
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
        const inferredLayout = new WebGL2BindGroupLayout(
          {
            label: `${label}:autoLayout`,
            entries,
          },
          () => this.untrack(inferredLayout),
        );
        this.track(inferredLayout);
        const synthesizedLayout = new WebGL2PipelineLayout(
          { label: `${label}:autoPipelineLayout`, bindGroupLayouts: [inferredLayout] },
          true,
          this,
          () => this.untrack(synthesizedLayout),
        );
        layout = this.track(synthesizedLayout);
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
      onDispose: (destroyed) => this.untrack(destroyed),
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
    const target = new WebGL2RenderTarget(descriptor, {
      gl: this.gl,
      state: this.state,
      createTexture: (format, width, height, usage, label) =>
        this.createAttachmentTexture(format, width, height, usage, label),
      onDispose: (destroyed) => this.untrack(destroyed),
    });
    return this.track(target);
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
    // 先摘掉 canvas 上的事件监听器：device 被丢弃后 canvas 不能再强引用它。
    if (this.eventTarget && this.handleContextLost) {
      this.eventTarget.removeEventListener('webglcontextlost', this.handleContextLost);
    }
    if (this.eventTarget && this.handleContextRestored) {
      this.eventTarget.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }
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
    this.contextRestoredCallbacks.clear();
    this.errorCallbacks.clear();
    this.state.invalidate();
    // 与 WebGPU 侧一致：主动销毁也是一种「设备不再可用」，原因记为 destroyed 以便查询。
    const destroyed: DeviceLostInfo = { reason: 'destroyed', message: 'Device.dispose() was called.' };
    this.lostInfoValue = destroyed;
    this.lostResolve(destroyed);
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

  /**
   * 在任何会创建资源 / 提交工作之前检查设备仍可用。
   *
   * 两条独立的失败路径，都给带 `[gpu-device-api] ` 前缀的英文错误：
   * - 已经 `dispose()`：消息说明设备已被释放；
   * - GL context 丢失：消息带上 `GPUDeviceLostInfo.reason` 与 message，说明「上下文丢失后
   *   GL 对象全部失效」，而不是让调用方在失效句柄上白画一帧。
   */
  assertUsable(operation: string): void {
    if (this._disposed) {
      throw new DeviceLostError(
        `[gpu-device-api] Device.${operation}: device "${this.label}" has been disposed.`,
        { reason: 'destroyed' },
      );
    }
    const lost = this.lostInfoValue;
    if (lost) {
      throw new DeviceLostError(
        `[gpu-device-api] Device.${operation}: device "${this.label}" lost its WebGL2 context ` +
          `(${lost.reason}): ${lost.message}`,
        { reason: lost.reason },
      );
    }
  }

  /**
   * `webglcontextlost` 的处理：记录丢失信息、resolve `lost`、并上报一个 `DeviceLostError`。
   *
   * 幂等：浏览器可能连续触发多次 lost（例如恢复流程里又丢一次），这里只处理第一次 ——
   * promise 只能 resolve 一次，丢失原因也应该保持最早的那一条。
   */
  private handleContextLostEvent(): void {
    if (this.lostInfoValue) return;
    const info: DeviceLostInfo = {
      reason: 'unknown',
      message:
        'the WebGL2 context was lost (webglcontextlost). Every GL object created by this device is now ' +
        'invalid; the device cannot rebuild them, so create a new device and recreate its resources.',
    };
    this.lostInfoValue = info;
    this.lostResolve(info);
    if (!this._disposed) {
      this.reportError(
        new DeviceLostError(
          `[gpu-device-api] WebGL2 context lost: ${info.message}`,
          { reason: info.reason },
        ),
      );
    }
  }

  /**
   * `webglcontextrestored` 的处理：只如实上报，**不**重建任何资源。
   *
   * 恢复的是「canvas 上的 GL context 本身」，不是本设备创建过的对象 —— GL 的对象命名空间
   * 随上下文一起消失，而我们的包装对象里只有已经作废的句柄（没有可重放的 descriptor），
   * 因此本抽象层无法做到「完整恢复」。调用方收到通知后应丢弃本设备并重新创建。
   */
  private handleContextRestoredEvent(): void {
    this.contextRestoreCount += 1;
    const info = this.lostInfoValue ?? {
      reason: 'unknown' as const,
      message: 'the WebGL2 context was restored without a preceding loss event.',
    };
    this.logger.warn(
      `WebGL2 context restored (第 ${this.contextRestoreCount} 次)：canvas 又能用了，但本设备创建过的` +
        '资源全部失效且无法重建，请 dispose() 后重新 createDevice()。',
    );
    for (const callback of [...this.contextRestoredCallbacks]) {
      try {
        callback(info);
      } catch (error) {
        this.logger.error(`context-restored callback threw: ${String(error)}`);
      }
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

/**
 * 读出 WebGL2 设备的 GPU 计时能力（见 {@link DeviceTimingSupport}）。
 *
 * 只看一条路：`EXT_disjoint_timer_query_webgl2` 扩展在不在。这里**当场向 context 再问一次**
 * `gl.getExtension()`（而不是复用 adapter 阶段记下的 feature 名）：判定依据必须是真实的 API 表面，
 * 而 `getExtension` 就是 WebGL2 上唯一能回答「这个能力有没有」的方法。GL 没有「单个时刻」的时间戳，
 * 所以 `encoderTimestamps` 恒为 false。
 */
function readTimingSupport(gl: WebGL2RenderingContext): DeviceTimingSupport {
  // 假的 GL（测试桩）可能连 getExtension 都没有：拿不到扩展一律按「没有」处理。
  const extension =
    typeof gl.getExtension === 'function' ? gl.getExtension(TIMER_QUERY_EXTENSION) : null;
  const passTimestamps = extension !== null && extension !== undefined;
  return {
    encoderTimestamps: false,
    passTimestamps,
    unavailableReason: passTimestamps
      ? null
      : `[gpu-device-api] this WebGL2 context does not expose the "${TIMER_QUERY_EXTENSION}" extension, ` +
        'so GL timer queries are unavailable. Use the WebGPU backend (feature "timestamp-query") or a ' +
        'driver/browser build that exposes the extension.',
  };
}
