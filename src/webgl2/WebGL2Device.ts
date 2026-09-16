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
import {
  assertErrorScopeFilter,
  type ErrorScopeFilter,
  type ErrorScopeHandle,
} from '../core/errors/ErrorScope.js';
import { compileShaderStage } from '../shaders/ShaderCompiler.js';
import { inferBindGroupLayoutEntries } from '../shaders/reflection/GLSLReflector.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { nextId } from '../utils/id.js';
import { resolveLimits } from '../core/Device.js';
import { resolvePipelineLayoutLike } from '../core/pipeline/RenderPipeline.js';
import type { Device, DeviceDescriptor, DeviceFeatures, DeviceLimits, DeviceLostInfo, DeviceTimingSupport } from '../core/Device.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasConfig, CanvasContext } from '../core/CanvasContext.js';
import type { Buffer, BufferDescriptor } from '../core/resources/Buffer.js';
import type {
  ExternalTexture,
  ExternalTextureDescriptor,
} from '../core/resources/ExternalTexture.js';
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
import {
  GL_ERROR_CODES,
  WebGL2ErrorScope,
  classifyGlError,
  createGlError,
} from './utils/glErrorScope.js';
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
  /**
   * `#20` 已压入、尚未弹出的错误作用域（栈顶即最内层）。
   *
   * ## 为什么默认完全零开销
   *
   * 只有这个数组非空时，{@link WebGL2Device.drainGlErrors} 才会把读到的错误往作用域里记账。
   * 不调用 `pushErrorScope` 的代码路径上，唯一的额外工作是一次 `length === 0` 判断 ——
   * 既不多一次 `gl.getError()`，也不改变既有 debug 轮询的读取次数。
   */
  private readonly scopeStack: WebGL2ErrorScope[] = [];
  /** `gl.getError()` 真正被调用的次数（诊断与测试用：用来证明「默认零开销」与「只有一个消费者」）。 */
  private glErrorReads = 0;
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
        // 只淘汰**引用了它**的 framebuffer 条目，避免复用到已经失效的附件。
        // 整体 clear() 会把与该纹理无关的附件组合也一起打回重建（一张临时纹理的生死
        // 就能让整帧的 framebuffer 全部重建）。
        this.framebuffers.releaseTexture(texture);
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
        this.framebuffers.releaseTexture(destroyed);
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
   * `#22`：WebGL2 后端**做不到**导入外部纹理，这里明确报错并给出替代方案。
   *
   * 为什么做不到：GL 里没有「外部纹理」这个概念。`OES_EGL_image_external` 是
   * EGL / GLES 的扩展（把 EGLImage 包成 `GL_TEXTURE_EXTERNAL_OES`），浏览器端的
   * `WebGL2RenderingContext` **不暴露**它 —— 本机无头 Chrome + SwiftShader 实测：
   * `gl.importExternalTexture` 是 `undefined`，`OES_EGL_image_external` /
   * `OES_EGL_image_external_essl3` / `WEBGL_external_texture` 三个扩展名全部拿不到
   * （探针页 `.tmp-02/probe/api-surface.html?backend=webgl2`）。
   *
   * 也**不**退化成「把当前帧拷进一张普通纹理」：那个替代方案在语义上不等价
   * （每帧多一次全量上传、拿不到原生的平面/色彩空间处理，而且句柄不能跨帧复用），
   * 偷偷替调用方换实现正是本库明确拒绝的做法。想这么做的调用方可以自己调
   * `queue.copyExternalImageToTexture()`（两个后端都支持），差别是显式的。
   */
  importExternalTexture(descriptor: ExternalTextureDescriptor): ExternalTexture {
    this.assertUsable('importExternalTexture');
    /*
     * 先校验参数、再报「本后端做不到」：这样同一份非法输入在两个后端上得到的是**同一条**
     * 参数错误（`source` 缺失），而不是这里先报「不支持」、WebGPU 那边报「source 非法」。
     */
    if (descriptor === undefined || descriptor.source === undefined || descriptor.source === null) {
      throw new ValidationError(
        '[gpu-device-api] Device.importExternalTexture: "source" is required (an HTMLVideoElement, ' +
          'VideoFrame or ImageBitmap).',
      );
    }
    throw new ValidationError(
      '[gpu-device-api] Device.importExternalTexture is not supported by the WebGL2 backend: GL has no ' +
        'external-texture concept, and the extensions that could express it ' +
        '(OES_EGL_image_external / OES_EGL_image_external_essl3 / WEBGL_external_texture) are not exposed ' +
        'by WebGL2RenderingContext. Upload the frame into a regular texture instead ' +
        '(Queue.copyExternalImageToTexture, supported by both backends) and sample that; it costs one ' +
        'upload per frame but behaves identically on both backends.',
    );
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
    /** `#39` 里由 `layout: BindGroupLayout | BindGroupLayout[]` 合成的 layout；随管线一起释放。 */
    const synthesizedLayouts: PipelineLayout[] = [];
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
      /*
       * `#39`：`layout` 也接受单个 `BindGroupLayout` 或它的数组 —— 使用者手上的就是它们
       * （各种 helper 返回 `BindGroupLayout`，`createBindGroup({ layout })` 收的也是它），
       * 只接受 `PipelineLayout` 会逼着每个人手写一次包装。这里合成一个等价的 layout，
       * 走的是与 `createPipelineLayout()` **完全相同**的构造与追踪路径，
       * 因此绑定计划（uniform block / texture unit 分配）与手写包装逐字段一致。
       */
      const resolved = resolvePipelineLayoutLike(
        descriptor.layout,
        (bindGroupLayouts) => {
          const synthesized = new WebGL2PipelineLayout(
            { label: `${label}:inlinePipelineLayout`, bindGroupLayouts },
            false,
            this,
            () => this.untrack(synthesized),
          );
          return this.track(synthesized);
        },
        `WebGL2Device.createRenderPipeline("${label}").layout`,
      );
      layout = resolved.layout as PipelineLayout | 'auto';
      this.programs.bindPlan(compiled, (layout as WebGL2PipelineLayout).bindingPlan);
      // 合成的 layout 只为这一条管线而建，管线释放时一并释放（与手写包装的生命周期一致）。
      if (resolved.synthesized) synthesizedLayouts.push(resolved.synthesized);
    }

    const pipeline = new WebGL2RenderPipeline(descriptor, compiled, layout, {
      gl: this.gl,
      state: this.state,
      limits: {
        maxVertexAttributes: this.limits.maxVertexAttributes,
        maxVertexBufferArrayStride: this.limits.maxVertexBufferArrayStride,
      },
      onDispose: (destroyed) => {
        this.untrack(destroyed);
        for (const synthesized of synthesizedLayouts) synthesized.dispose();
        synthesizedLayouts.length = 0;
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

  /**
   * `#20` 压入错误作用域：WebGL2 **没有**这个概念，这里给出等价物。
   *
   * ## 与 WebGPU 侧的语义差异（先说清楚，不假装一样）
   *
   * - 作用域只覆盖「`getError()` 读到的错误」，而 GL 的错误是**异步**产生的：
   *   一次 `gl.getError()` 可能读到上一次无关调用留下的错误。所以这里回答的是
   *   「这段时间内出现过某类错误」，**不是**「就是那一行错了」；
   * - `filter` 无法真正筛选类型（GL 错误码分不出 validation / out-of-memory / internal），
   *   它只决定「这条错误留在这一层，还是穿透给外层作用域」；
   * - 每个作用域内 GL 只保留**一条**错误状态，所以 `errors` 的长度是下界而不是精确计数。
   *
   * 详见 `WebGL2ErrorScope` 与 `glErrorScope.ts` 的文件头。
   *
   * ## push 时先排空
   *
   * 入栈前把 GL 队列里**已有的**错误排掉（走既有的 `onError` 通道），否则上一段代码留下的
   * 错误会被算进新作用域，作用域就变成「永远有错」。这一步同时也是「不消费掉别人错误」的
   * 前提：排空走的是同一个消费者。
   */
  pushErrorScope(filter: ErrorScopeFilter): ErrorScopeHandle {
    this.assertUsable('pushErrorScope');
    assertErrorScopeFilter(filter, `Device "${this.label}".pushErrorScope(filter)`);

    /*
     * 入栈**之前**先把队列里残留的错误排掉（它们属于上一段代码，不属于这个作用域）。
     *
     * 顺序在这里是正确性问题，不是风格问题：`drainGlErrors` 把读到的错误记到**栈顶**作用域，
     * 所以如果在 push 之后才排空，上一段代码留下的错误会被算进新作用域 ——
     * 新作用域就变成「永远有错」，而那正是作用域最该避免的误报。
     *
     * 这一步**只在确实有人要看错误时才读**（栈上有作用域、或 debug 开着）：
     * 两者都不成立时一次 `gl.getError()` 都不产生，默认路径的零开销契约因此不变。
     */
    if (this.debug || this.scopeStack.length > 0) this.drainGlErrors('pushErrorScope');

    const scope = new WebGL2ErrorScope(filter, `webgl2ErrorScope#${nextId('scope')}`, (popped) =>
      this.settleScope(popped),
    );
    this.scopeStack.push(scope);
    this.logger.debug(`pushErrorScope("${filter}")：栈深 ${this.scopeStack.length}`);
    return scope;
  }

  /**
   * `#20` 弹出错误作用域：同步排空 GL 错误队列，再按 filter 决定错误留在哪一层。
   *
   * 栈为空时**拒绝**（而不是 resolve 成 `null`）——「没有作用域」与「作用域里没有错误」
   * 是两件必须区分的事，后者才是 `null`。
   *
   * 出栈动作放在 {@link WebGL2Device.settleScope} 里，且**必须**在排空之后 —— 这一层要
   * 留在栈顶才能接收「最后一次 `checkGlError` 到 `pop` 之间」产生的错误。
   */
  popErrorScope(): Promise<GpuError | null> {
    const scope = this.scopeStack[this.scopeStack.length - 1];
    if (!scope) {
      return Promise.reject(
        new ValidationError(
          `[gpu-device-api] Device "${this.label}".popErrorScope: there is no error scope on the stack ` +
            '(every popErrorScope() must be paired with a preceding pushErrorScope()).',
        ),
      );
    }
    return scope.pop();
  }

  /** 当前仍在栈上的错误作用域层数（诊断与测试用）。 */
  get scopeDepth(): number {
    return this.scopeStack.length;
  }

  /**
   * `gl.getError()` 被调用的总次数。
   *
   * 暴露它是为了能**断言**「默认零开销」与「只有一个消费者」这两条契约：
   * 不 push 作用域时不比改动前多读一次；push 之后 debug 轮询不会再多读一遍（那正是
   * 「两个消费者互相抢错误」的形态）。
   */
  get glErrorReadCount(): number {
    return this.glErrorReads;
  }

  /**
   * GL 错误**唯一**的读取入口。`#20` 之后所有 `gl.getError()` 调用都必须走这里。
   *
   * ## 为什么必须收敛成一个消费者
   *
   * GL 的错误是「读一次消费一条」的状态位。改动前有两个潜在消费者：
   * debug 模式下的轮询（{@link WebGL2Device.checkGlError}）与（本批新增的）错误作用域。
   * 如果各自直接调 `gl.getError()`，先跑的那个会把错误读走，后跑的那个读到 `NO_ERROR` ——
   * 于是**作用域会误报「无错」**（或 debug 轮询漏报），而两边都不会有任何异常。
   * 这正是本批最容易出的静默错误。收敛成一个消费者之后，读到什么就同时给两边记账，
   * 谁都不会把对方的结果吃掉。
   *
   * ## 记账规则
   *
   * - 读到错误时：交给栈顶作用域记账（若有），**并且**走 debug 上报通道（若 debug 打开），
   *   两边拿到的是**同一条**错误；
   * - 作用域是否「命中」由 `pop` 时按 filter 判定（见 {@link WebGL2Device.settleScope}），
   *   这里只负责如实记账；
   * - **本函数不做「要不要读」的判断**，那是调用方的事（`checkGlError` 看 `debug`、
   *   `pushErrorScope` 看是否需要清残留）。这样职责单一：一读就必然两边都记账，
   *   不会出现「守卫条件写错 → 读了却没人收」这种静默漏报
   *   （本批第一次实现就踩了：`settleScope` 先把作用域出栈，导致这里的守卫以为无人关心）。
   *
   * 无限循环不会发生：读到 `NO_ERROR` 就停，而驱动对空队列恒返回 `NO_ERROR`。
   */
  private drainGlErrors(observedBy: string): void {
    const debug = this.debug;
    for (;;) {
      this.glErrorReads += 1;
      const code = this.gl.getError();
      if (code === GL_ERROR_CODES.NO_ERROR) return;
      const scope = this.scopeStack[this.scopeStack.length - 1];
      if (scope) scope.record(createGlError(code, observedBy));
      /*
       * debug 通道继续用**改动前逐字相同**的那条消息与 `code: 'GL_ERROR'`。
       *
       * 不能趁这次改动把它换成作用域那套带前缀的英文消息：`code` 是机器可读的契约，
       * 既有调用方（以及本仓库的测试）按它做分支。两条通道给出**同一个错误码、两种措辞**，
       * 是刻意的：作用域那条要讲清楚「GL 分不出类型」，而 debug 日志那条只描述现象。
       */
      if (debug) this.reportError(createLegacyGlError(code, observedBy));
    }
  }

  /**
   * 作用域出栈时的归属判定（原生语义：错误归最内层；filter 不匹配则向外层穿透）。
   *
   * 返回本层 `pop()` 要交出去的那条错误；`null` 表示这一层没有可交的错误。
   * 没有被交出去的错误不会被吞掉：它们要么留给外层（穿透），要么作为**未捕获错误**
   * 走 `onError`（与 WebGPU 的 `uncapturederror` 同义）。
   *
   * ## 为什么「穿透」这件事在 GL 上仍然要做
   *
   * GL 本身没有 filter，但调用方写的是跨后端代码。若这里把 filter 当空气，
   * `pushErrorScope('out-of-memory')` 内层就会把一条 validation 错误吃掉，
   * 外层 `pushErrorScope('validation')` 拿到 `null` —— 同一段代码在 WebGPU 上拿得到错误、
   * 在 WebGL2 上拿不到，那是最难查的一类不一致。
   */
  private settleScope(scope: WebGL2ErrorScope): GpuError | null {
    /*
     * 顺序：**先排空、再出栈**。
     *
     * 排空必须发生在作用域还在栈顶的时候 —— 「上一次 `checkGlError` 到这次 `pop` 之间」
     * 产生的错误属于这一层，出栈后就没人接收了（第一次实现就是先出栈，结果这些错误
     * 一条都读不到，`pop` 恒返回 null）。
     */
    this.drainGlErrors('popErrorScope');

    // 出栈（句柄状态机与栈保持一致）。**注意：这里先不 close()** ——
    // 下面的归属判定要把错误交给外层，而外层是否「活着」是按 `active` 判的；
    // 过早 close 自己会影响不到外层，但为了顺序清楚，统一在判定结束后再收尾。
    const position = this.scopeStack.lastIndexOf(scope);
    if (position >= 0) this.scopeStack.splice(position, 1);

    const errors = scope.errors;
    const first = errors[0];
    if (!first) {
      scope.close();
      return null;
    }

    const classification = classifyGlError(first);
    if (classification === scope.filter) {
      scope.markFilterMatched(true);
      scope.close();
      this.reportUnconsumed(errors.slice(1));
      return first;
    }

    /*
     * filter 不匹配 → 交给外层作用域。两条规则，顺序不能反：
     *
     * 1. **先找 filter 相同的外层**：跨后端代码在 `pushErrorScope('validation')` 外层里
     *    看到的仍然是 validation 错误，这是调用方最可能想要的分类；
     * 2. 找不到同 filter 的外层时，**交给最近的外层**，而不是把它当成未捕获错误丢掉。
     *
     * 第 2 条是照**实测的原生行为**写的，不是猜的：本机无头 Chrome 的原生 WebGPU 探针
     * （`.tmp-07/probe/native-error-scope-probe.html?backend=webgpu`）实测
     * `outer=validation / inner=out-of-memory /` 一条 `GPUValidationError` →
     * 内层 pop = `null`，**外层 pop = `GPUValidationError`**。
     * 也就是说原生会把不匹配的错误继续交给外层作用域，而不是让它变成 uncapturederror。
     * 早期实现只做第 1 条，于是「内层 filter 写错 → 外层明明有作用域却什么都收不到」，
     * 与 WebGPU 的实际行为对不上。
     *
     * 两条合起来也天然避免「同一条错误被复制进多个外层」：错误只搬进**一个**外层，
     * 之后随那个外层一起出栈。
     */
    let fallback: WebGL2ErrorScope | null = null;
    for (let index = this.scopeStack.length - 1; index >= 0; index -= 1) {
      const outer = this.scopeStack[index]!;
      if (!outer.active) continue;
      fallback ??= outer;
      if (outer.filter === classification) {
        outer.record(first);
        scope.markFilterMatched(false);
        scope.close();
        this.reportUnconsumed(errors.slice(1));
        return null;
      }
    }
    if (fallback) {
      fallback.record(first);
      scope.markFilterMatched(false);
      scope.close();
      this.reportUnconsumed(errors.slice(1));
      return null;
    }

    // 没有任何外层能接收：作为未捕获错误上报（onError），绝不静默丢弃。
    scope.markFilterMatched(false);
    scope.close();
    this.reportUnconsumed(errors);
    return null;
  }

  /** 把作用域没有交出去的错误交给 `onError` 通道（与未捕获错误同一条路）。 */
  private reportUnconsumed(errors: readonly GpuError[]): void {
    for (const error of errors) this.reportError(error);
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    /*
     * `#20`：被遗弃的作用域（push 了但没 pop）随设备一起作废 —— 而且**必须**明确作废。
     *
     * 这里的 `abandon()` 不是可选的收尾：设备一销毁就再也读不到 GL 错误队列，此时若让句柄的
     * `pop()` 正常 resolve 成 `null`，等于告诉调用方「这个作用域里没有错误」——那是**撒谎**
     * （本批自测抓到过这个形态）。作废之后 `pop()` 会拒绝，并说明「设备已销毁、无法落定，
     * 这不等于无错」。
     *
     * 也不能用 `close()`：那会让消息变成「已经 pop 过」，同样是误导。
     */
    for (const scope of this.scopeStack) scope.abandon();
    this.scopeStack.length = 0;
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
    // 状态缓存也持有 GL 对象（复用的读回 framebuffer），必须在 context 还在时释放。
    this.state.dispose();
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
   *
   * ## `#20`：这里不再直接调 `gl.getError()`
   *
   * 读取收敛到 {@link WebGL2Device.drainGlErrors} 一个消费者，否则它与错误作用域会互相
   * 抢错误（先跑的读到错误、后跑的读到 `NO_ERROR`，于是其中一边静默误报）。语义不变：
   * 关掉 debug 时依旧一次 GL 调用都不产生；开着 debug 时读到的错误依旧逐条走 `onError`。
   *
   * 注意它会强制 CPU/GPU 同步，所以只在 debug 打开（或显式排空）时调用。
   */
  checkGlError(context: string): void {
    if (!this.debug) return;
    this.drainGlErrors(context);
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

/**
 * `#20`：debug 轮询通道（`checkGlError` → `onError`）用的错误构造函数。
 *
 * 消息与 `code` **与改动前逐字相同**（中文措辞、`0x` 十六进制、`details.glError`），
 * 因为 `code: 'GL_ERROR'` 是机器可读的既有契约，调用方按它分支。错误作用域那条通道用的是
 * `glErrorScope.ts` 里另一套更详细的消息 —— 同一个错误码、两种措辞，是刻意的：
 * 作用域那条要讲清楚「GL 分不出 validation / out-of-memory / internal」，debug 日志那条
 * 只描述现象。
 */
function createLegacyGlError(code: number, context: string): GpuError {
  return new GpuError(`[gpu-device-api] GL 错误 0x${code.toString(16)}（发生在 ${context} 之后）。`, {
    code: 'GL_ERROR',
    details: { glError: code, context },
  });
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
