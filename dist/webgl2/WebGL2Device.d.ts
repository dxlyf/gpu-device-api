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
import { BufferUsage } from '../core/enums/BufferUsage.js';
import { GpuError } from '../core/errors/GpuError.js';
import { type ErrorScopeFilter, type ErrorScopeHandle } from '../core/errors/ErrorScope.js';
import { type Logger } from '../utils/logger.js';
import type { Device, DeviceDescriptor, DeviceFeatures, DeviceLimits, DeviceLostInfo, DeviceTimingSupport } from '../core/Device.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasConfig, CanvasContext } from '../core/CanvasContext.js';
import type { Buffer, BufferDescriptor } from '../core/resources/Buffer.js';
import type { ExternalTexture, ExternalTextureDescriptor } from '../core/resources/ExternalTexture.js';
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
import { WebGL2Texture } from './resources/WebGL2Texture.js';
import { BindingPlanCache } from './binding/TextureUnitAllocator.js';
import { ProgramCache } from './pipeline/ProgramCache.js';
import { FramebufferCache } from './render/framebuffer-cache.js';
import { WebGL2Queue } from './sync/WebGL2Queue.js';
import { WebGL2Fence } from './sync/WebGL2Fence.js';
export interface WebGL2DeviceOptions {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    descriptor?: DeviceDescriptor;
    adapterLimits: DeviceLimits;
    adapterFeatures: ReadonlySet<string>;
    logger?: Logger;
}
export declare class WebGL2Device implements Device {
    readonly label: string;
    readonly backend: BackendKind;
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
    private readonly gl;
    private readonly logger;
    private readonly resources;
    private readonly errorCallbacks;
    /**
     * `#20` 已压入、尚未弹出的错误作用域（栈顶即最内层）。
     *
     * ## 为什么默认完全零开销
     *
     * 只有这个数组非空时，{@link WebGL2Device.drainGlErrors} 才会把读到的错误往作用域里记账。
     * 不调用 `pushErrorScope` 的代码路径上，唯一的额外工作是一次 `length === 0` 判断 ——
     * 既不多一次 `gl.getError()`，也不改变既有 debug 轮询的读取次数。
     */
    private readonly scopeStack;
    /** `gl.getError()` 真正被调用的次数（诊断与测试用：用来证明「默认零开销」与「只有一个消费者」）。 */
    private glErrorReads;
    /** 上下文恢复事件的订阅者；与 `errorCallbacks` 一样在 `dispose()` 时清空。 */
    private readonly contextRestoredCallbacks;
    private readonly canvasContexts;
    private lostResolve;
    private lostPromise;
    /**
     * 设备丢失信息；未丢失（或只是 `dispose()`）时为 null。
     *
     * WebGL2 的「设备丢失」就是 GL context 丢失：`webglcontextlost` 一旦触发，
     * 本设备创建过的**每一个** GL 对象都已经失效，而且我们没有任何办法把它们重建
     * （包装对象里只有已经作废的句柄，没有可重放的 descriptor）—— 所以这里如实记录，
     * 让后续所有操作明确报错，而不是在失效句柄上静默地画不出东西。
     */
    private lostInfoValue;
    /** `webglcontextrestored` 触发的次数（诊断与测试用）。 */
    private contextRestoreCount;
    /** 安装监听器的目标（canvas 或 OffscreenCanvas）；不支持事件时保持 null。 */
    private readonly eventTarget;
    private readonly handleContextLost;
    private readonly handleContextRestored;
    private _disposed;
    constructor(options: WebGL2DeviceOptions);
    get disposed(): boolean;
    get lost(): Promise<DeviceLostInfo>;
    /**
     * 设备是否仍然可用：没有 `dispose()`，也没有丢失过 GL context。
     *
     * 注意「上下文恢复」**不会**把这里变回 true：restored 只说明这个 canvas 又能取到可用的
     * GL context，本设备已经创建过的资源全部失效且无法重建（见 {@link lostInfo}）。
     */
    get usable(): boolean;
    /** 设备丢失信息；未丢失时为 null。与 `lost` promise 表达同一件事，但可以直接查询。 */
    get lostInfo(): DeviceLostInfo | null;
    /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
    get trackedResourceCount(): number;
    /** `webglcontextrestored` 已触发的次数；恢复只影响 canvas，不影响本设备持有的资源。 */
    get contextRestoredCount(): number;
    /**
     * 订阅「GL context 被浏览器恢复」事件，返回取消订阅函数。
     *
     * 为什么需要它：`webglcontextlost` 会让 `device.lost` resolve（一次性的），而 restored 可能
     * 在其后任意时刻发生。恢复后 canvas 与 GL context 本身又能用了，但**本设备创建过的资源
     * 全部失效**（GL 对象随上下文一起消失，我们没有 descriptor 可以重建它们）。
     * 因此收到这个回调后应当：`device.dispose()` → 重新 `createDevice()` → 重建全部资源。
     */
    onContextRestored(callback: (info: DeviceLostInfo) => void): () => void;
    /** 让 GL 状态缓存失效；外部通过 escape hatch 改动状态后必须调用。 */
    invalidateState(): void;
    createBuffer(descriptor: BufferDescriptor): Buffer;
    createTexture(descriptor: TextureDescriptor): Texture;
    /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
    createAttachmentTexture(format: TextureDescriptor['format'], width: number, height: number, usage: BufferUsage | number, label: string): WebGL2Texture;
    createSampler(descriptor?: SamplerDescriptor): Sampler;
    createShaderModule(descriptor: ShaderModuleDescriptor): ShaderModule;
    /**
     * 创建 query set。
     *
     * - occlusion：`ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，直接用；
     * - timestamp：需要 `EXT_disjoint_timer_query_webgl2`，扩展缺失时抛带 `[gpu-device-api] ` 前缀的
     *   英文错误说明缺哪个扩展（而不是静默返回 0）。
     */
    createQuerySet(descriptor: QuerySetDescriptor): QuerySet;
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
    importExternalTexture(descriptor: ExternalTextureDescriptor): ExternalTexture;
    /**
     * 读回 query set 的结果：轮询 `QUERY_RESULT_AVAILABLE` 后逐条 `getQueryParameter`。
     *
     * 轮询本身是异步的（每轮让出一拍），不会像 `gl.finish()` 那样强制同步 GPU；
     * 但结果只有在 GPU 真正做完之后才可用，所以调用方应该**延迟若干帧**再读
     * （gfx 的 GPU 计时就是这么做的）。
     */
    readQuerySet(querySet: QuerySet, options?: QuerySetReadOptions): QueryResult;
    createBindGroupLayout(descriptor: BindGroupLayoutDescriptor): BindGroupLayout;
    createBindGroup(descriptor: BindGroupDescriptor): BindGroup;
    createPipelineLayout(descriptor: PipelineLayoutDescriptor): PipelineLayout;
    createRenderPipeline(descriptor: RenderPipelineDescriptor): RenderPipeline;
    createComputePipeline(descriptor: ComputePipelineDescriptor): ComputePipeline;
    createRenderTarget(descriptor?: RenderTargetDescriptor): RenderTarget;
    createCommandEncoder(descriptor?: CommandEncoderDescriptor): CommandEncoder;
    createCanvasContext(canvas: HTMLCanvasElement | OffscreenCanvas, config?: Omit<CanvasConfig, 'device'>): CanvasContext;
    /** 创建一个进程内的同步点（fence）。 */
    createFence(): WebGL2Fence;
    onError(callback: (error: GpuError) => void): () => void;
    reportError(error: GpuError): void;
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
    pushErrorScope(filter: ErrorScopeFilter): ErrorScopeHandle;
    /**
     * `#20` 弹出错误作用域：同步排空 GL 错误队列，再按 filter 决定错误留在哪一层。
     *
     * 栈为空时**拒绝**（而不是 resolve 成 `null`）——「没有作用域」与「作用域里没有错误」
     * 是两件必须区分的事，后者才是 `null`。
     *
     * 出栈动作放在 {@link WebGL2Device.settleScope} 里，且**必须**在排空之后 —— 这一层要
     * 留在栈顶才能接收「最后一次 `checkGlError` 到 `pop` 之间」产生的错误。
     */
    popErrorScope(): Promise<GpuError | null>;
    /** 当前仍在栈上的错误作用域层数（诊断与测试用）。 */
    get scopeDepth(): number;
    /**
     * `gl.getError()` 被调用的总次数。
     *
     * 暴露它是为了能**断言**「默认零开销」与「只有一个消费者」这两条契约：
     * 不 push 作用域时不比改动前多读一次；push 之后 debug 轮询不会再多读一遍（那正是
     * 「两个消费者互相抢错误」的形态）。
     */
    get glErrorReadCount(): number;
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
    private drainGlErrors;
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
    private settleScope;
    /** 把作用域没有交出去的错误交给 `onError` 通道（与未捕获错误同一条路）。 */
    private reportUnconsumed;
    dispose(): void;
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
    checkGlError(context: string): void;
    private track;
    /**
     * 资源在 `destroy()` 时把自己从追踪集合里摘掉（与 WebGPU 后端同一套机制）。
     *
     * 不做这一步，「每帧 create/destroy」的用法（query set、临时 buffer……）会让 `resources`
     * 一直强引用已经释放的包装对象与原生句柄，直到 `device.dispose()`。幂等。
     */
    untrack(resource: Disposable): void;
    /**
     * 在任何会创建资源 / 提交工作之前检查设备仍可用。
     *
     * 两条独立的失败路径，都给带 `[gpu-device-api] ` 前缀的英文错误：
     * - 已经 `dispose()`：消息说明设备已被释放；
     * - GL context 丢失：消息带上 `GPUDeviceLostInfo.reason` 与 message，说明「上下文丢失后
     *   GL 对象全部失效」，而不是让调用方在失效句柄上白画一帧。
     */
    assertUsable(operation: string): void;
    /**
     * `webglcontextlost` 的处理：记录丢失信息、resolve `lost`、并上报一个 `DeviceLostError`。
     *
     * 幂等：浏览器可能连续触发多次 lost（例如恢复流程里又丢一次），这里只处理第一次 ——
     * promise 只能 resolve 一次，丢失原因也应该保持最早的那一条。
     */
    private handleContextLostEvent;
    /**
     * `webglcontextrestored` 的处理：只如实上报，**不**重建任何资源。
     *
     * 恢复的是「canvas 上的 GL context 本身」，不是本设备创建过的对象 —— GL 的对象命名空间
     * 随上下文一起消失，而我们的包装对象里只有已经作废的句柄（没有可重放的 descriptor），
     * 因此本抽象层无法做到「完整恢复」。调用方收到通知后应丢弃本设备并重新创建。
     */
    private handleContextRestoredEvent;
}
/** 探测当前 canvas 上可用的 WebGL2 能力，供 adapter 使用。 */
export declare function describeGlAdapter(gl: WebGL2RenderingContext): {
    limits: DeviceLimits;
    features: Set<string>;
    vendor: string;
    device: string;
};
//# sourceMappingURL=WebGL2Device.d.ts.map