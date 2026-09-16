/**
 * WebGL2 的 render pipeline。
 *
 * 与 WebGPU 不同，WebGL2 的管线**可以立即编译**：顶点属性位置由 GLSL 里的
 * `layout(location = N)` 写死，附件格式也不影响 program 的链接结果。
 * 所以这里在 `createRenderPipeline()` 时就编译好 program，错误能尽早暴露；
 * `resolve(variant)` 只负责「按渲染目标解析固定功能状态 + 校验顶点布局」，非常廉价。
 *
 * VAO（顶点数组对象）也放在这里缓存：它记录的是「program 的属性槽 + 具体顶点缓冲」的组合，
 * 所以生命周期跟着管线走最自然。缓存键包含顶点缓冲对象、偏移、步长与索引缓冲，
 * 因此同一个几何体反复绘制时只需要建一次 VAO。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { validateVertexBufferLayout, vertexBufferLayoutsKey } from '../../core/pipeline/VertexLayout.js';
import { createPipelineCache } from '../../core/pipeline/PipelineCache.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import type {
  RenderPipeline,
  RenderPipelineDescriptor,
  RenderPipelineVariant,
} from '../../core/pipeline/RenderPipeline.js';
import type {
  CompilationInfo,
  PrewarmOptions,
  PrewarmResult,
} from '../../core/pipeline/CompilationInfo.js';
import { nowMs } from '../../core/pipeline/CompilationInfo.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import { assertNonNegativeInteger } from '../../utils/assert.js';
import { nextId } from '../../utils/id.js';
import { glVertexAttribute, GL_PRIMITIVE_MODES } from '../utils/glEnumMap.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGLBindingPlan } from '../binding/TextureUnitAllocator.js';
import type { WebGL2PipelineLayout } from '../binding/WebGL2PipelineLayout.js';
import { applyRenderState, resolveRenderState, type ResolvedRenderState } from './WebGL2RenderState.js';
import type { CompiledProgram } from './ProgramCache.js';

/** 某个渲染目标形态下解析出来的一份具体状态。 */
export interface ResolvedVariant {
  readonly key: string;
  readonly renderState: ResolvedRenderState;
  readonly depthFormat: string | null;
  readonly sampleCount: number;
  /**
   * 该形态使用的顶点布局。
   *
   * 之所以放进变体而不是只读描述里的：便捷层会为同一个材质服务多个几何体，
   * 属性集合不同则布局不同。放在变体里，`acquireVertexArray` 才会用**本次实际使用的**布局，
   * 否则会拿描述里的旧布局去建 VAO，属性指针就全错了。
   */
  readonly vertexLayouts: readonly VertexBufferLayout[];
  /** 该形态下已经建好的 VAO，键里含顶点缓冲组合；有上限的 LRU（见 {@link VertexArrayStore}）。 */
  readonly vertexArrays: VertexArrayStore;
  /**
   * 最近一次 VAO 查询的结果（一次只记一条）。
   *
   * `revision` 由渲染通道在每次顶点/索引绑定**真正变化**时更新，只增不减，
   * 所以「版本号相同」等价于「顶点缓冲与索引缓冲的绑定内容完全相同」。
   * 命中时可以直接返回上一次的 VAO，省掉每次 draw 重建 O(属性数) 键字符串的开销。
   */
  vertexArrayLookup: { revision: number; vertexArray: WebGLVertexArrayObject } | null;
}

/**
 * VAO 缓存需要的容器能力。
 *
 * 真正的实现是 core 的 LRU（`createPipelineCache`，带上限 + 最近使用刷新，见 {@link resolveVariant}）。
 * 类型写成结构化的而不是直接写 `PipelineCache<WebGLVertexArrayObject>`：这里只用到
 * 「按键取值 / 存值 / 报大小 / 遍历 / 清空」这几个操作，写成结构化形式后测试里的替身
 * （例如 `new Map()`）也能满足（`values()` 用 `Iterable` 是因为 `Map.values()` 是迭代器、
 * `PipelineCache.values()` 是数组，两者都满足）。
 */
export interface VertexArrayStore {
  get(key: string): WebGLVertexArrayObject | undefined;
  set(key: string, value: WebGLVertexArrayObject): unknown;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  readonly size: number;
  values(): Iterable<WebGLVertexArrayObject>;
}

/**
 * 每个管线变体缓存的 VAO 上限。
 *
 * 为什么必须有上限（#33）：这个缓存键里含**顶点缓冲对象与索引缓冲**，长期运行的程序
 * （例如每帧换一块顶点缓冲的粒子系统）会让条目数无限增长，而每个 VAO 都占着驱动侧的状态对象。
 * 复用 `createPipelineCache` 的 LRU 之后，最坏情况是「多建几个 VAO」，不会再无界增长。
 *
 * 取 64 的理由与 `FramebufferCache` 的默认上限一致：正常场景里「一条管线 × 一个渲染目标形态」
 * 同时用到的顶点布局组合远少于此，而 64 个 VAO 的状态开销可以忽略。
 */
export const DEFAULT_VERTEX_ARRAY_CACHE_LIMIT = 64;

/** 一个顶点缓冲槽的绑定内容。 */
export interface VertexBufferBinding {
  buffer: WebGL2Buffer;
  offset: number;
  /** `-1` 表示一直到缓冲末尾。 */
  size: number;
}

export interface WebGL2RenderPipelineOptions {
  gl: WebGL2RenderingContext;
  state: GlStateCache;
  limits: { maxVertexAttributes: number; maxVertexBufferArrayStride: number };
  /**
   * 每个变体的 VAO 缓存上限（LRU）。默认 {@link DEFAULT_VERTEX_ARRAY_CACHE_LIMIT}。
   * 必须是 `>= 1` 的整数 —— 见 {@link WebGL2RenderPipeline.evictVertexArray} 的安全性论证（第 2 条）。
   */
  vertexArrayCacheLimit?: number;
  /**
   * 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   * （见 `WebGL2Device.untrack`）。不传时为空操作，管线仍可独立使用。
   */
  onDispose?: (pipeline: WebGL2RenderPipeline) => void;
}

export class WebGL2RenderPipeline implements RenderPipeline {
  readonly label: string;
  readonly descriptor: RenderPipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';
  readonly vertexLayouts: readonly VertexBufferLayout[] | null;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly limits: WebGL2RenderPipelineOptions['limits'];
  /** 每个变体的 VAO 缓存上限（构造时校验过，一定 `>= 1`）。 */
  private readonly vertexArrayCacheLimit: number;
  private readonly onDispose: ((pipeline: WebGL2RenderPipeline) => void) | null;
  private readonly program: CompiledProgram;
  private readonly plan: WebGLBindingPlan | null;
  private readonly topologyMode: number;
  /**
   * `MultisampleState.alphaToCoverageEnabled`（`#13`）。
   *
   * WebGPU 侧会把它翻成 `GPUMultisampleState.alphaToCoverageEnabled`，而 WebGL2 后端以前
   * **完全不读**这个字段 —— 于是「用 alpha 做覆盖率抗锯齿」的管线在 WebGL2 上静默地不生效
   * （画面上表现为边缘没有柔化，只有 MSAA 的普通效果）。GL 有 `SAMPLE_ALPHA_TO_COVERAGE`，
   * 能表达，所以这里**实现**它。
   */
  private readonly alphaToCoverage: boolean;
  /** 描述里声明的采样数（WebGPU 的默认值是 1）；`alphaToCoverage` 只能配 `> 1`。 */
  private readonly declaredSampleCount: number;
  private readonly variantCache = new Map<string, ResolvedVariant>();
  private _disposed = false;

  constructor(
    descriptor: RenderPipelineDescriptor,
    program: CompiledProgram,
    layout: PipelineLayout | 'auto',
    options: WebGL2RenderPipelineOptions,
  ) {
    if (!descriptor.fragment) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 后端不支持只有深度、没有片元着色器的管线（GL 的 program 必须同时链接两个阶段）。\n' +
          '请提供一个写深度或写颜色的片元着色器；若只想写深度，可以在片元着色器里 `discard` 而不输出颜色。',
      );
    }

    this.label = descriptor.label ?? nextId('renderPipeline');
    const cacheLimit = options.vertexArrayCacheLimit ?? DEFAULT_VERTEX_ARRAY_CACHE_LIMIT;
    // 上限 0 会让「刚建好、正绑着的那个 VAO」在自己插入时就被淘汰（见 evictVertexArray 第 2 条），
    // 所以这里明确拦下，而不是让那种情况悄悄发生。
    if (!Number.isInteger(cacheLimit) || cacheLimit < 1) {
      throw new ValidationError(
        `[gpu-device-api] vertexArrayCacheLimit 必须是 >= 1 的整数，实际是 ${String(cacheLimit)}。`,
      );
    }
    this.vertexArrayCacheLimit = cacheLimit;
    this.descriptor = descriptor;
    this.layout = layout;
    this.vertexLayouts = descriptor.vertex.buffers ? [...descriptor.vertex.buffers] : null;
    this.gl = options.gl;
    this.state = options.state;
    this.limits = options.limits;
    this.onDispose = options.onDispose ?? null;
    this.program = program;
    this.plan = layout === 'auto' ? null : ((layout as WebGL2PipelineLayout).bindingPlan ?? null);
    this.topologyMode = GL_PRIMITIVE_MODES[descriptor.primitive?.topology ?? 'triangle-list'];
    this.alphaToCoverage = descriptor.multisample?.alphaToCoverageEnabled ?? false;
    this.declaredSampleCount = descriptor.multisample?.count ?? 1;
  }

  /** WebGL2 在创建时就完成了编译。 */
  get compiled(): boolean {
    return true;
  }

  /** 已链接好的 program 等内部信息（供渲染通道与调试使用）。 */
  get compiledProgram(): CompiledProgram {
    return this.program;
  }

  /** GL 图元模式。 */
  get mode(): number {
    return this.topologyMode;
  }

  get bindingPlan(): WebGLBindingPlan | null {
    return this.plan;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get native(): WebGLProgram {
    return this.program.program;
  }

  /**
   * 按渲染目标形态解析状态。同一形态只解析一次；顶点布局也在这里做一次校验。
   */
  resolveVariant(variant: Partial<RenderPipelineVariant> = {}): ResolvedVariant {
    const depthFormat = variant.depthFormat ?? null;
    const sampleCount = variant.sampleCount ?? 1;
    const vertexLayouts = variant.vertexLayouts ?? this.vertexLayouts ?? [];
    const key = `${depthFormat ?? 'none'}|${sampleCount}|${vertexBufferLayoutsKey(vertexLayouts)}`;

    const cached = this.variantCache.get(key);
    if (cached) return cached;

    if (vertexLayouts.length > 0) {
      for (const layout of vertexLayouts) validateVertexBufferLayout(layout, this.limits);
    }
    const declaredLocations = new Set(vertexLayouts.flatMap((layout) => layout.attributes.map((a) => a.shaderLocation)));
    /*
     * 反射结果里 `location < 0` 的条目必须排除：ANGLE 会把 `gl_VertexID` / `gl_InstanceID`
     * 这类内建变量也报成 active attribute，而 `getAttribLocation()` 对它们返回 -1。
     * 它们本来就不需要（也无法）绑定顶点缓冲，如果当成「缺布局的属性」，
     * 「用 gl_VertexID 生成全屏三角形、不声明任何顶点属性」这种完全合法的写法会被误报。
     */
    const programLocations = new Set(
      this.program.reflection.attributes
        .map((attribute) => attribute.location)
        .filter((location) => location >= 0),
    );
    for (const location of programLocations) {
      if (!declaredLocations.has(location)) {
        throw new ValidationError(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${location}，` +
            '但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。',
        );
      }
    }

    const resolved: ResolvedVariant = {
      key,
      renderState: resolveRenderState(this.descriptor, {
        depth: depthFormat !== null,
        stencil: depthFormat === 'depth24plus-stencil8',
      }),
      depthFormat,
      sampleCount,
      vertexLayouts,
      /*
       * 带上限的 LRU（#33）：改前这里是裸 `Map`，只 `set` 从不淘汰。
       *
       * 回调里引用的 `resolved` 在对象字面量求值时还没绑定，但这个回调只可能在
       * `acquireVertexArray()` 之后触发（那时 `resolved` 早已初始化），所以是安全的。
       */
      vertexArrays: createPipelineCache<WebGLVertexArrayObject>(this.vertexArrayCacheLimit, (vertexArray) => {
        this.evictVertexArray(resolved, vertexArray);
      }),
      vertexArrayLookup: null,
    };
    this.variantCache.set(key, resolved);
    return resolved;
  }

  /**
   * LRU 淘汰一个 VAO 时的收尾（#33）。
   *
   * ## 为什么「淘汰一个正在使用的 VAO」不会让后续 draw 用错绑定点（安全性论证）
   *
   * 1. GLES 3.0 里 `deleteVertexArray` 删除**当前绑定**的 VAO 会把该绑定点复位
   *    （绑定变成「没有 VAO」，默认 VAO 生效）。所以真正的危险不是删除本身，
   *    而是「删除之后还有谁以为它还绑着」—— 那会让后续 draw 跳过重新绑定。
   * 2. 淘汰只发生在 `PipelineCache.set()` 里，而 `acquireVertexArray()` 的顺序一定是
   *    **先** `state.bindVertexArray(新建的 VAO)`（`gl.createVertexArray()` 之后立刻绑、
   *    再录属性和索引缓冲）、**后** `variant.vertexArrays.set(...)`。LRU 淘汰的是 `Map` 里
   *    最旧的那个，刚插入的排在队尾；在构造时已强制 `limit >= 1` 的前提下，
   *    被淘汰的**永远不是**当前绑定的那个。最坏情况只是「多建一个 VAO」。
   * 3. 会残留「以为还绑着」的地方只有两处，都在下面处理掉了：
   *    - {@link ResolvedVariant.vertexArrayLookup}：这条快速路径**绕过**缓存表直接返回上次的 VAO，
   *      被淘汰后它可能仍指着已删除的对象 —— 必须清掉，否则下一次同版本的 draw 会拿它去绑定。
   *    - `GlStateCache.vertexArray`：状态缓存里的「当前绑定」记录。GL 的删除已经解绑，
   *      缓存若不同步就会谎称「还绑着」，后续 draw 会跳过 `bindVertexArray`（不会报错，只是画错）。
   * 4. 被淘汰的键下次 `acquireVertexArray()` 会未命中并重建一个新对象，而 `bindVertexArray()`
   *    是按对象身份比较的，新旧不同 → 一定重新下发。所以「淘汰正在使用的 VAO」是安全的。
   */
  private evictVertexArray(variant: ResolvedVariant, vertexArray: WebGLVertexArrayObject): void {
    const lookup = variant.vertexArrayLookup;
    if (lookup !== null && lookup.vertexArray === vertexArray) variant.vertexArrayLookup = null;
    if (this.state.currentVertexArray === vertexArray) this.state.bindVertexArray(null);
    this.gl.deleteVertexArray(vertexArray);
  }

  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(variant: Partial<RenderPipelineVariant> = {}): unknown {
    return this.resolveVariant(variant).renderState;
  }

  /**
   * 预热报告。
   *
   * WebGL2 的编译 + 链接发生在 `createRenderPipeline()` 里（`ProgramCache.acquire()`），
   * 所以**管线对象存在时 program 一定已经链接完了**，这里没有东西可以再等 —— 能做的是
   * 如实汇报它是怎么等出来的，以及带上诊断（真实行号）。
   *
   * | 情况 | `mode` | 说明 |
   * | --- | --- | --- |
   * | 事先调用过 `ProgramCache.compileAsync()`（`KHR_parallel_shader_compile` 可用） | `'async'` | 链接真异步完成，管线创建时零 GL 调用 |
   * | 扩展缺失，`compileAsync()` 退化成同步 | `'sync'` | `reason` 说明缺扩展 |
   * | 直接 `device.createRenderPipeline()`（没预热过） | `'sync'` | `reason` 提示先在创建管线前调 `compileAsync()` |
   *
   * **真想异步就调 `prewarmWebGL2RenderPipeline(device, descriptor)`**（`src/webgl2/pipeline/Prewarm.ts`）：
   * 它在创建管线**之前**先把 program 链接好，之后 `createRenderPipeline()` 的 `acquire()` 直接命中缓存。
   */
  async prewarm(
    _variant: Partial<RenderPipelineVariant> = {},
    _options: PrewarmOptions = {},
  ): Promise<PrewarmResult> {
    const started = nowMs();
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`);
    }
    const info = this.program.compilationInfo;
    const mode = this.program.linkMode;
    return {
      label: this.label,
      backend: 'webgl2',
      ok: !info.hasErrors,
      mode,
      reason: mode === 'async' ? null : this.program.linkReason,
      durationMs: nowMs() - started,
      info,
    };
  }

  /**
   * 编译诊断：WebGL2 走的是 `getShaderInfoLog()` / `getProgramInfoLog()` 的原文，
   * 在 program 编译/链接的那一刻就解析好并挂在 `CompiledProgram.compilationInfo` 上。
   * `lineNum` 是真实的（从 GL 日志里解析出来的行号，指向**包好前言之后的最终源码**），
   * `linePos` 恒为 `null`（GL 的日志只有行号，没有列号）。
   */
  async getCompilationInfo(): Promise<CompilationInfo> {
    return this.program.compilationInfo;
  }

  /**
   * 把该管线的固定功能状态写入 GL 状态缓存。
   *
   * `SAMPLE_ALPHA_TO_COVERAGE`（`#13`）是个**上下文级**开关（不是逐 draw 状态的一部分），
   * 所以直接在这里下发：每次 draw 多一次廉价的 `enable/disable` 是刻意选的 ——
   * 走 `GlStateCache` 需要一个新字段，而这条路径的调用者（渲染通道）已经知道本帧的采样数，
   * 在这里判断不会有歧义。采样数不合法时明确报错（与 WebGPU 的
   * `toGPUMultisampleState` 同形：`alphaToCoverageEnabled` 要求 `sampleCount > 1`）。
   */
  applyState(variant: ResolvedVariant, stencilReference = 0): void {
    this.state.useProgram(this.program.program);
    applyRenderState(this.state, variant.renderState, stencilReference);

    if (this.alphaToCoverage) {
      if (this.declaredSampleCount <= 1 && variant.sampleCount <= 1) {
        throw new ValidationError(
          `[gpu-device-api] RenderPipeline "${this.label}": MultisampleState.alphaToCoverageEnabled ` +
            'requires sampleCount > 1, but both the pipeline descriptor and the current render target ' +
            `use sampleCount 1. WebGPU rejects this combination too. Create the render target with ` +
            'sampleCount 2 or 4 (WebGL2 cannot multisample a texture attachment, so use an offscreen ' +
            'RenderTarget).',
        );
      }
      setAlphaToCoverage(this.gl, true);
    } else {
      setAlphaToCoverage(this.gl, false);
    }
  }

  /**
   * 取得（必要时创建）一个顶点数组对象。
   *
   * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
   * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
   *
   * `bindingRevision` 由调用方（渲染通道）维护：同一个版本号必须对应同一份顶点/索引绑定内容。
   * 传 0 表示调用方不提供版本号，此时只走下面按内容构建的缓存键。
   */
  acquireVertexArray(
    variant: ResolvedVariant,
    bindings: readonly (VertexBufferBinding | null)[],
    indexBuffer: WebGLBuffer | null,
    bindingRevision = 0,
  ): WebGLVertexArrayObject | null {
    const layouts = variant.vertexLayouts;
    if (layouts.length === 0) return null;

    // 快速路径：绑定内容没变（版本号相同）就直接复用上一次的结果，
    // 连键字符串都不用拼 —— 构建键是 O(属性数) 的字符串拼接，而它原本每个 draw 都要做一次。
    const lookup = variant.vertexArrayLookup;
    if (bindingRevision > 0 && lookup !== null && lookup.revision === bindingRevision) {
      return lookup.vertexArray;
    }

    const key = buildVertexArrayKey(layouts, bindings, indexBuffer);
    const cached = variant.vertexArrays.get(key);
    if (cached) {
      if (bindingRevision > 0) variant.vertexArrayLookup = { revision: bindingRevision, vertexArray: cached };
      return cached;
    }

    const gl = this.gl;
    const vertexArray = gl.createVertexArray();
    if (!vertexArray) {
      throw new ValidationError('[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。');
    }

    // 通过状态缓存绑定，而不是直接调 GL：VAO 记录着「当前索引缓冲是谁」，
    // 而 `GlStateCache.withDefaultVertexArray()` 依赖缓存里的这个值来判断该恢复哪个 VAO。
    this.state.bindVertexArray(vertexArray);
    for (let slot = 0; slot < layouts.length; slot++) {
      const layout = layouts[slot];
      const binding = bindings[slot];
      if (!layout || !binding) continue;

      gl.bindBuffer(gl.ARRAY_BUFFER, binding.buffer.native);
      const divisor = layout.stepMode === 'instance' ? 1 : 0;
      for (const attribute of layout.attributes) {
        const info = glVertexAttribute(attribute.format);
        const offset = binding.offset + attribute.offset;
        gl.enableVertexAttribArray(attribute.shaderLocation);
        if (info.integer) {
          // 整数属性必须用 IPointer，否则 GL 会把整数值当作浮点解释（或者直接报错）。
          gl.vertexAttribIPointer(attribute.shaderLocation, info.size, info.type, layout.arrayStride, offset);
        } else {
          gl.vertexAttribPointer(
            attribute.shaderLocation,
            info.size,
            info.type,
            info.normalized,
            layout.arrayStride,
            offset,
          );
        }
        gl.vertexAttribDivisor(attribute.shaderLocation, divisor);
      }
    }
    if (indexBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // 这里绕过了状态缓存（ELEMENT_ARRAY_BUFFER 是 VAO 状态的一部分，必须在 VAO 内直接绑定），
    // 所以要把缓冲绑定缓存标记为失效，后续调用才会重新下发。
    this.state.invalidateBufferBindings();

    variant.vertexArrays.set(key, vertexArray);
    if (bindingRevision > 0) variant.vertexArrayLookup = { revision: bindingRevision, vertexArray };
    return vertexArray;
  }

  /** 当前缓存了多少个 VAO（跨全部形态）。 */
  get vertexArrayCount(): number {
    let total = 0;
    for (const variant of this.variantCache.values()) total += variant.vertexArrays.size;
    return total;
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    // program 由 ProgramCache 统一持有（可能被多条管线共享），这里只释放本管线独占的 VAO。
    for (const variant of this.variantCache.values()) {
      for (const vertexArray of variant.vertexArrays.values()) {
        // 走同一套收尾（而不是直接 deleteVertexArray）：被删的那一个可能正是当前绑定的 VAO，
        // GL 会把它解绑，必须让状态缓存同步，否则释放之后紧接着的 draw 会以为还绑着它。
        this.evictVertexArray(variant, vertexArray);
      }
      variant.vertexArrays.clear();
      // 快速路径的记忆指向的 VAO 刚被删掉，必须一起清，否则下次 draw 会拿到已删除的对象。
      variant.vertexArrayLookup = null;
    }
    this.variantCache.clear();
    // 幂等：上面的 `_disposed` 早退保证通知只发生一次。
    // 不通知的话，`WebGL2Device.resources` 会一直强引用已经释放的管线对象。
    this.onDispose?.(this);
  }
}

/** GL 的 `SAMPLE_ALPHA_TO_COVERAGE`（写死数值，避免依赖 `gl` 实例才能取到常量）。 */
const GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809e;

/**
 * 开关 `SAMPLE_ALPHA_TO_COVERAGE`。
 *
 * 写成「先查方法在不在」的形式：单元测试里有用结构化替身直接调用 `applyState` 的用例
 * （只关心模板状态），替身上没有这两个方法。真实的 `WebGL2RenderingContext` 一定有它们。
 */
function setAlphaToCoverage(gl: WebGL2RenderingContext, enabled: boolean): void {
  if (enabled) gl.enable(GL_SAMPLE_ALPHA_TO_COVERAGE);
  else if (typeof gl.disable === 'function') gl.disable(GL_SAMPLE_ALPHA_TO_COVERAGE);
}

function buildVertexArrayKey(  layouts: readonly VertexBufferLayout[],
  bindings: readonly (VertexBufferBinding | null)[],
  indexBuffer: WebGLBuffer | null,
): string {
  const parts: string[] = [];
  for (let slot = 0; slot < layouts.length; slot++) {
    const binding = bindings[slot];
    const layout = layouts[slot];
    if (!binding || !layout) {
      parts.push(`${slot}:-`);
      continue;
    }
    assertNonNegativeInteger(binding.offset, 'setVertexBuffer 的 offset');
    parts.push(`${slot}:${binding.buffer.id}:${binding.offset}:${binding.size}:${layout.arrayStride}:${layout.stepMode ?? 'vertex'}`);
  }
  // 索引缓冲也是 VAO 状态的一部分，必须进键，否则换索引缓冲会复用错误的 VAO。
  parts.push(`idx:${indexBuffer ? indexBufferId(indexBuffer) : '-'}`);
  return parts.join('|');
}

/** 给 GL 索引缓冲对象分配一个稳定 id（用 WeakMap 避免在对象上加属性）。 */
const indexBufferIds = new WeakMap<WebGLBuffer, number>();
let nextIndexBufferId = 1;
function indexBufferId(buffer: WebGLBuffer): number {
  let id = indexBufferIds.get(buffer);
  if (id === undefined) {
    id = nextIndexBufferId++;
    indexBufferIds.set(buffer, id);
  }
  return id;
}
