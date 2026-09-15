/**
 * WebGPU render pipeline：`RenderPipeline` 接口在 `GPURenderPipeline` 上的实现。
 *
 * **惰性编译**是这里的核心：core 允许 pipeline 不声明 attachment 格式、sample count 和
 * vertex layout（这样同一个 pipeline 才能服务多个 render target），而 `GPURenderPipeline`
 * 必须把这些信息烘焙进去。因此真正的创建推迟到第一次 `resolve(variant)`：
 *
 * - cache key = `{ colorFormats, sampleCount, depthFormat, vertexLayouts }`；
 * - 每个 key 对应一个 `GPURenderPipeline`，同一个 pipeline 对象可以持有多个 variant；
 * - `compiled` / `native` 反映真实状态：`compiled` 只表示「至少编译过一个 variant」，
 *   `native` 会触发一次默认 variant 的编译（拒绝「为了看起来有值而瞎编」）。
 *
 * `layout: 'auto'` 原样透传给 WebGPU。
 *
 * 关于 vertex layout：core 的 `VertexState.buffers` 可以省略（注释里说「在第一次 draw 时从
 * geometry 推导」），但 WebGPU 后端**做不到**这件事 —— `setVertexBuffer(slot, buffer, ...)`
 * 只给 buffer，不携带 attribute 布局，`Buffer` 也不带布局信息。因此对读取 vertex attribute
 * 的着色器必须显式提供 `buffers`（或通过 `resolve({ vertexLayouts })` 传入）。
 */

import type {
  FragmentState,
  RenderPipeline,
  RenderPipelineDescriptor,
  RenderPipelineVariant,
  VertexState,
} from '../../core/pipeline/RenderPipeline.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { ShaderModule } from '../../core/resources/ShaderModule.js';
import type {
  CompilationInfo,
  PrewarmMode,
  PrewarmOptions,
  PrewarmResult,
} from '../../core/pipeline/CompilationInfo.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import type { PipelineCache } from './PipelineCache.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { ShaderStage } from '../../core/enums/ShaderStage.js';
import { cacheKey } from '../../core/pipeline/PipelineCache.js';
import {
  DEFAULT_PREWARM_TIMEOUT_MS,
  createCompilationMessage,
  describeCompilationInfo,
  mergeCompilationInfo,
  nowMs,
  withTimeout,
} from '../../core/pipeline/CompilationInfo.js';
import { createLogger, type Logger } from '../../utils/logger.js';
import { asGPUPipelineLayout } from '../binding/WebGPUPipelineLayout.js';
import { asWebGPUShaderModule } from '../resources/WebGPUShaderModule.js';
import { assertSampleCount } from '../utils/wgpuEnumMap.js';
import { toGPUTextureFormat } from '../utils/wgpuFormatMap.js';
import { WebGPURenderState } from './WebGPURenderState.js';
import { PipelineCache as WgpuPipelineCache, renderPipelineCacheKey } from './PipelineCache.js';

/** vertex / fragment 入口点缺省名，与 core 的文档一致。 */
export const DEFAULT_VERTEX_ENTRY_POINT = 'vsMain';
export const DEFAULT_FRAGMENT_ENTRY_POINT = 'fsMain';

/**
 * 共享的空值：解析 variant 时会用到「空入参 / 空 vertex layout / 空 color format」，
 * 原先每次 `resolve()` 都会为它们新建数组，属于每 draw 的纯分配。
 */
const EMPTY_VARIANT: Partial<RenderPipelineVariant> = Object.freeze({});
const EMPTY_VERTEX_LAYOUTS: readonly VertexBufferLayout[] = [];
const EMPTY_COLOR_FORMATS: readonly TextureFormat[] = [];

export class WebGPURenderPipeline implements RenderPipeline {
  readonly label: string;
  readonly descriptor: RenderPipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';
  readonly vertexLayouts: readonly VertexBufferLayout[] | null;

  private readonly device: WebGPUDevice;
  private readonly cache: PipelineCache<GPURenderPipeline>;
  private readonly logger: Logger;
  private readonly sampleCountContext: string;
  private _disposed = false;
  private warnedMissingVertexLayouts = false;

  /** `defaultColorFormats()` 的结果只依赖 readonly descriptor，缓存后避免每次解析都新建数组。 */
  private defaultColorFormatsCache: readonly TextureFormat[] | null = null;

  /** 上一次 `resolve()` 的入参与结果，用于按身份快速命中（见 {@link WebGPURenderPipeline.resolve}）。 */
  private lastVariantInput: Partial<RenderPipelineVariant> | null = null;
  private lastVariantColorFormats: readonly TextureFormat[] | undefined;
  private lastVariantSampleCount: number | undefined;
  private lastVariantDepthFormat: TextureFormat | null | undefined;
  private lastVariantVertexLayouts: readonly VertexBufferLayout[] | undefined;
  private lastVariantResolved: RenderPipelineVariant | null = null;
  private lastVariantKey: string | null = null;

  constructor(device: WebGPUDevice, descriptor: RenderPipelineDescriptor) {
    this.device = device;
    this.descriptor = descriptor;
    this.label = descriptor.label ?? `renderPipeline#${device.nextResourceId('renderPipeline')}`;
    this.layout = descriptor.layout ?? 'auto';
    this.vertexLayouts = descriptor.vertex.buffers ?? null;
    this.logger = createLogger(`webgpu:${this.label}`);
    this.sampleCountContext = `RenderPipeline "${this.label}": sampleCount`;
    this.cache = new WgpuPipelineCache<GPURenderPipeline>(64, (_value, key) => {
      this.logger.debug(`evicted render pipeline variant ${key}`);
    });
  }

  /** 至少编译过一个 variant 时为 true（不触发编译）。 */
  get compiled(): boolean {
    return this.cache.size > 0;
  }

  /** 原生句柄；会按默认 variant 触发一次编译。 */
  get native(): GPURenderPipeline {
    return this.resolve();
  }

  /** 当前已编译的 variant 数量。 */
  get variantCount(): number {
    return this.cache.size;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /**
   * 解析（并缓存）某个 target/variant 对应的具体 pipeline。
   *
   * `variant` 里未给出的字段按以下顺序取值：pipeline descriptor → `render` 预设 → 默认值。
   *
   * 同一个 render pass 内每次 `setPipeline` 传的都是同一个 variant 请求对象
   *（见 `WebGPURenderPassEncoder` 的 `variantRequest`），因此这里按「入参身份 + 字段值」
   * 复用上一次的解析结果与 cache key：命中时不再新建 resolved 对象、不再 `join` colorFormats、
   * 也不再重算 vertex layout key —— 这些原本都在每 draw 的路径上。
   */
  resolve(variant: Partial<RenderPipelineVariant> = EMPTY_VARIANT): GPURenderPipeline {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`,
      );
    }
    let resolved: RenderPipelineVariant;
    let key: string;
    if (
      variant === this.lastVariantInput &&
      variant.colorFormats === this.lastVariantColorFormats &&
      variant.sampleCount === this.lastVariantSampleCount &&
      variant.depthFormat === this.lastVariantDepthFormat &&
      variant.vertexLayouts === this.lastVariantVertexLayouts &&
      this.lastVariantResolved !== null &&
      this.lastVariantKey !== null
    ) {
      resolved = this.lastVariantResolved;
      key = this.lastVariantKey;
    } else {
      resolved = this.resolveVariant(variant);
      key = renderPipelineCacheKey(resolved);
      // 记住入参字段的当前值：调用方若换掉某个字段（而不是原地改数组内容），下一次就会重新解析。
      this.lastVariantInput = variant;
      this.lastVariantColorFormats = variant.colorFormats;
      this.lastVariantSampleCount = variant.sampleCount;
      this.lastVariantDepthFormat = variant.depthFormat;
      this.lastVariantVertexLayouts = variant.vertexLayouts;
      this.lastVariantResolved = resolved;
      this.lastVariantKey = key;
    }
    return this.cache.resolve(key, () => this.createNative(resolved));
  }

  /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
  get compiledVariants(): readonly string[] {
    return this.cache.keys();
  }

  /**
   * 异步预热一个 variant：优先 `createRenderPipelineAsync()`。
   *
   * 为什么这不只是「再调用一次 resolve()」：`createRenderPipeline` 是**同步**返回的，
   * 驱动在后台编译，第一次真正使用这条管线的那一帧要为编译付掉卡顿；
   * `createRenderPipelineAsync` 会等到编译完成才 resolve，于是这段等待落在预热调用里
   *（可以在加载界面、下一帧之前、甚至 `requestIdleCallback` 里做），而不是落在渲染循环里。
   *
   * 预热出来的原生管线会**写进与 `resolve()` 相同的 variant 缓存**，所以首次使用该 variant 时
   * `resolve()` 直接命中、不再产生任何 GPU 编译调用。
   *
   * 实现缺失 `createRenderPipelineAsync` 时退化成同步创建，`mode` 为 `'sync'` 且 `reason`
   * 说明原因 —— 不会假装异步。编译失败同样不抛错（除非 `throwOnError`），诊断在 `info` 里。
   */
  async prewarm(
    variant: Partial<RenderPipelineVariant> = EMPTY_VARIANT,
    options: PrewarmOptions = {},
  ): Promise<PrewarmResult> {
    const started = nowMs();
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`);
    }
    // `resolveVariant` 的报错是「描述本身不合法」（缺 colorFormat、格式不认识），
    // 那属于调用方的编程错误，和「着色器编译失败」不是一回事，所以这里让它原样抛出去。
    const resolved = this.resolveVariant(variant);
    const key = renderPipelineCacheKey(resolved);

    if (this.cache.has(key)) {
      // 已经编译过了：预热退化成「把诊断取回来」，不产生新的 GPU 调用。
      const info = await this.getCompilationInfo();
      return {
        label: this.label,
        backend: 'webgpu',
        ok: !info.hasErrors,
        mode: 'async',
        reason: null,
        durationMs: nowMs() - started,
        info,
      };
    }

    const nativeDescriptor = this.toGPURenderPipelineDescriptor(resolved);
    const device = this.device.native as GPUDevice & {
      createRenderPipelineAsync?: (descriptor: GPURenderPipelineDescriptor) => Promise<GPURenderPipeline>;
    };
    const createAsync = device.createRenderPipelineAsync;

    let mode: PrewarmMode = 'async';
    let reason: string | null = null;
    let created: GPURenderPipeline | null = null;
    let failure: string | null = null;

    if (typeof createAsync !== 'function') {
      mode = 'sync';
      reason =
        'this WebGPU implementation does not expose GPUDevice.createRenderPipelineAsync(), ' +
        'so the pipeline was created synchronously and the compile cost stayed on the calling thread';
    }

    try {
      if (typeof createAsync === 'function') {
        created = await withTimeout(
          createAsync.call(device, nativeDescriptor),
          options.timeoutMs ?? DEFAULT_PREWARM_TIMEOUT_MS,
          `createRenderPipelineAsync("${this.label}")`,
        );
      } else {
        created = this.device.native.createRenderPipeline(nativeDescriptor);
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      if (reason === null) reason = failure;
    }

    if (created !== null && !this.cache.has(key)) {
      // 并发预热同一个 variant 时以先到者为准：缓存里已有就不再覆盖。
      this.cache.set(key, created);
    }

    const info = await this.collectCompilationInfo(failure);
    const ok = created !== null && failure === null;
    const result: PrewarmResult = {
      label: this.label,
      backend: 'webgpu',
      ok,
      mode,
      // 成功且是真异步时没有需要解释的东西；退化路径与失败路径都必须给出原因。
      reason: ok ? (mode === 'sync' ? reason : null) : (failure ?? 'shader compilation reported errors'),
      durationMs: nowMs() - started,
      info,
    };
    if (!result.ok && options.throwOnError) {
      throw new ValidationError(describeCompilationInfo(info));
    }
    return result;
  }

  /**
   * 编译诊断：把 vertex / fragment 两个 `GPUShaderModule` 的 `getCompilationInfo()` 合起来。
   *
   * WGSL 一份源码包含所有 entry point，诊断内容与 variant 无关，所以这里不需要 variant 参数
   *（保留它只是为了与 `resolve()` / `prewarm()` 的签名对齐）。
   */
  async getCompilationInfo(_variant: Partial<RenderPipelineVariant> = EMPTY_VARIANT): Promise<CompilationInfo> {
    return this.collectCompilationInfo(null);
  }

  /** 取两个阶段的诊断并合并；`failure` 是 `createRenderPipelineAsync` 抛出的原文。 */
  private async collectCompilationInfo(failure: string | null): Promise<CompilationInfo> {
    const infos: CompilationInfo[] = [];
    // WGSL 是「一个 module 含全部 entry point」，同一个 module 同时给 vertex / fragment 用时
    // 只报一次 —— 否则同一批诊断会被重复列两遍（`GPUShaderModule.getCompilationInfo()` 是
    // 按 module 而不是按 stage 计算的）。
    const collected = new Set<ShaderModule>();
    const collect = async (module: ShaderModule, stage: ShaderStage, context: string): Promise<void> => {
      if (collected.has(module)) return;
      collected.add(module);
      const shader = asWebGPUShaderModule(module, context);
      if (typeof shader.getCompilationInfo === 'function') {
        infos.push(await shader.getCompilationInfo(stage));
      }
    };

    await collect(this.descriptor.vertex.module, ShaderStage.Vertex, `RenderPipeline "${this.label}".vertex.module`);
    const fragmentState = this.descriptor.fragment;
    if (fragmentState) {
      await collect(
        fragmentState.module,
        ShaderStage.Fragment,
        `RenderPipeline "${this.label}".fragment.module`,
      );
    }

    const merged = mergeCompilationInfo(this.label, 'webgpu', infos);
    if (failure === null) return merged;
    // 同步创建失败、或原生 promise 以 `GPUPipelineError` 拒绝时的原文也要留下：
    // 有些实现把「entry point 不存在」这类错误只放在拒绝原因里，shader 诊断里看不到。
    return {
      ...merged,
      messages: [
        ...merged.messages,
        createCompilationMessage({
          type: 'error',
          message: failure,
          label: this.label,
          backend: 'webgpu',
        }),
      ],
      hasErrors: true,
    };
  }

  /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.cache.dispose();
    this.device.untrack(this);
  }

  private resolveVariant(partial: Partial<RenderPipelineVariant>): RenderPipelineVariant {
    const descriptor = this.descriptor;
    const colorFormats = partial.colorFormats ?? this.defaultColorFormats();
    const sampleCount = assertSampleCount(
      partial.sampleCount ?? descriptor.multisample?.count ?? descriptor.render?.multisample?.count ?? 1,
      this.sampleCountContext,
    );
    const depthFormat =
      partial.depthFormat !== undefined
        ? partial.depthFormat
        : descriptor.depthStencil?.format ?? null;
    // 是否使用深度只看**管线自己的声明**（而不是 variant 里的 target 深度格式）：
    // 未声明 `depthStencil`、或 `format: null` 都表示「不使用深度」。
    const depthState = descriptor.depthStencil ?? descriptor.render?.depthStencil;
    // `descriptor.vertex.buffers ?? []` 原先每 draw 都会新建一个空数组；空列表共享一个常量即可。
    const vertexLayouts = partial.vertexLayouts ?? this.vertexLayouts ?? EMPTY_VERTEX_LAYOUTS;

    if (descriptor.fragment && colorFormats.length === 0) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. ` +
          'Declare `colorFormats` on the descriptor, or pass them per target via ' +
          'resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.',
      );
    }
    if (!descriptor.fragment && (depthFormat === null || !WebGPURenderState.usesDepthStencil(depthState))) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depthStencil ` +
          'state, so WebGPU cannot create a pipeline that writes to nothing. Declare `depthStencil` ' +
          '(for a depth-only pipeline, e.g. { depthWriteEnabled: true } — its format comes from the render ' +
          'target) or add a fragment stage. Note that omitting `depthStencil` or passing ' +
          '`{ format: null }` means "this pipeline does not use depth", it does not enable depth testing.',
      );
    }
    if (vertexLayouts.length === 0 && !this.warnedMissingVertexLayouts) {
      this.warnedMissingVertexLayouts = true;
      this.logger.debug(
        'building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes',
      );
    }

    for (const format of colorFormats) {
      // 触发格式合法性校验（未知格式在这里就会抛错）。
      toGPUTextureFormat(format);
    }
    if (depthFormat !== null) toGPUTextureFormat(depthFormat);

    return { colorFormats, sampleCount, depthFormat, vertexLayouts };
  }

  /**
   * descriptor 里声明的（或从 fragment targets 推导出的）color format 列表。
   *
   * 推导路径原先每次调用都新建一个数组；descriptor 是 readonly 的，结果缓存到实例上，
   * 与「共享空数组」一起消掉每 draw 的数组分配。
   */
  private defaultColorFormats(): readonly TextureFormat[] {
    const cached = this.defaultColorFormatsCache;
    if (cached !== null) return cached;
    const { descriptor } = this;
    let formats: readonly TextureFormat[];
    if (descriptor.colorFormats) {
      formats = descriptor.colorFormats;
    } else if (descriptor.render?.colorFormats) {
      formats = descriptor.render.colorFormats;
    } else {
      const targets = descriptor.fragment?.targets;
      const collected: TextureFormat[] = [];
      if (targets) {
        for (const target of targets) {
          if (target?.format === undefined) break;
          collected.push(target.format);
        }
      }
      // 任一 target 没写 format 时按「推导不出来」处理（与原先返回空数组一致）。
      formats = targets && collected.length === targets.length ? collected : EMPTY_COLOR_FORMATS;
    }
    this.defaultColorFormatsCache = formats;
    return formats;
  }

  private createNative(variant: RenderPipelineVariant): GPURenderPipeline {
    const nativeDescriptor = this.toGPURenderPipelineDescriptor(variant);
    this.logger.debug(`creating render pipeline variant ${renderPipelineCacheKey(variant)}`);
    return this.device.native.createRenderPipeline(nativeDescriptor);
  }

  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(variant: RenderPipelineVariant): GPURenderPipelineDescriptor {
    const descriptor = this.descriptor;
    const limits = this.device.limits;

    const vertexState: VertexState = descriptor.vertex;
    const module = asWebGPUShaderModule(vertexState.module, `RenderPipeline "${this.label}".vertex.module`);
    const vertex: GPUVertexState = {
      module: module.compile(ShaderStage.Vertex),
      entryPoint: vertexState.entryPoint ?? DEFAULT_VERTEX_ENTRY_POINT,
      buffers: WebGPURenderState.toGPUVertexBufferLayouts(variant.vertexLayouts, limits),
    };

    const fragmentState: FragmentState | undefined = descriptor.fragment;
    let fragment: GPUFragmentState | undefined;
    if (fragmentState) {
      const fragmentModule = asWebGPUShaderModule(
        fragmentState.module,
        `RenderPipeline "${this.label}".fragment.module`,
      );
      fragment = {
        module: fragmentModule.compile(ShaderStage.Fragment),
        entryPoint: fragmentState.entryPoint ?? DEFAULT_FRAGMENT_ENTRY_POINT,
        targets: WebGPURenderState.toGPUColorTargets(variant.colorFormats, fragmentState.targets, {
          blend: descriptor.render?.blend,
          writeMask: descriptor.render?.writeMask,
        }),
      };
    }

    const primitiveState = descriptor.primitive ?? descriptor.render?.primitive;
    const depthState = descriptor.depthStencil ?? descriptor.render?.depthStencil;
    const multisampleState = descriptor.multisample ?? descriptor.render?.multisample;
    const depthFormat = variant.depthFormat;

    const nativeDescriptor: GPURenderPipelineDescriptor = {
      label: this.label,
      layout: asGPUPipelineLayout(this.layout, `RenderPipeline "${this.label}"`),
      vertex,
      primitive: WebGPURenderState.toGPUPrimitiveState(primitiveState, this.device.features),
      multisample: WebGPURenderState.toGPUMultisampleState(multisampleState, variant.sampleCount),
    };
    if (fragment) nativeDescriptor.fragment = fragment;
    if (depthFormat !== null) {
      // 这条管线不使用深度时（未声明 `depthStencil` 或 `format: null`），这里拿到的是
      // 「恒通过 + 不写」的状态，而不是不挂 depthStencil —— WebGPU 的 attachment state 要求管线与
      // pass 的深度附件格式一致，pass 有深度附件时「不挂」会直接校验失败、整条 command buffer 作废。
      nativeDescriptor.depthStencil = WebGPURenderState.toGPUDepthStencilState(depthFormat, depthState);
      if (depthState && !WebGPURenderState.usesDepthStencil(depthState)) {
        this.logger.debug('depthStencil declared without a format; emitting an always-pass, no-write state');
      }
    } else if (depthState) {
      // depthFormat 为 null 表示当前 target 没有 depth attachment；此时不能写 depthStencil。
      this.logger.debug('depthStencil state declared but the variant has no depth format; ignoring it');
    }
    return nativeDescriptor;
  }
}

/** 该对象是否为 WebGPU 后端的 render pipeline。 */
export function isWebGPURenderPipeline(value: unknown): value is WebGPURenderPipeline {
  return value instanceof WebGPURenderPipeline;
}

/**
 * 把 core 的 `RenderPipeline` 收窄为原生 `GPURenderPipeline`。
 *
 * 传入 `WebGPURenderPipeline` 时会走 `resolve(variant)`；如果是别的后端（或 escape hatch
 * 拿到的原生 pipeline），只能按「已经建好的对象」直接使用。
 */
export function asGPURenderPipeline(
  value: unknown,
  context: string,
  variant?: Partial<RenderPipelineVariant>,
): GPURenderPipeline {
  if (value instanceof WebGPURenderPipeline) return value.resolve(variant);
  const native = (value as { native?: unknown } | null | undefined)?.native;
  if (native && typeof native === 'object' && typeof (native as { getBindGroupLayout?: unknown }).getBindGroupLayout === 'function') {
    return native as GPURenderPipeline;
  }
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native ` +
      `GPURenderPipeline).`,
  );
}

/** 供 cache key 诊断使用：只列出会参与 key 的字段。 */
export function describeRenderPipelineVariant(variant: RenderPipelineVariant): string {
  return cacheKey(variant.colorFormats.join(','), variant.sampleCount, variant.depthFormat ?? 'none');
}
