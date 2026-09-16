/**
 * WebGPU 逻辑设备：`Device` 接口在 `GPUDevice` 上的实现。
 *
 * 职责有三块：
 *
 * 1. **资源工厂**：所有 `create*` 都会把创建出来的 core 资源登记到内部集合里，
 *    使 `dispose()` 能一次性释放设备创建的全部资源；
 * 2. **错误通道**：`device.onuncapturederror` 被路由到 `Device.onError` 注册的回调，
 *    原始 `GPUValidationError` / `GPUOutOfMemoryError` / `GPUInternalError` 会被翻译成
 *    core 的 `ValidationError` / `OutOfMemoryError` / `GPUInternalError`；
 * 3. **设备丢失**：`device.lost` 映射为 {@link DeviceLostInfo}，并在非主动销毁的情况下
 *    额外上报一个 {@link DeviceLostError}。
 *
 * ## 丢失之后能做什么、不能做什么
 *
 * 能：同步查询（{@link WebGPUDevice.lostInfo} / {@link WebGPUDevice.usable}）、`await device.lost`、
 * 通过 `onError` 收到通知，并且**所有后续提交都会明确报错**（`queue.submit` / `writeBuffer` /
 * 各 `create*`）而不是被实现静默丢弃。
 *
 * 不能：**恢复**。`GPUDevice` 一旦丢失就永久失效，本层拿不到任何可以重建它的东西
 * （`GPUAdapter` 也不在设备上）。正确的恢复流程是：`dispose()` → 用 adapter 重新
 * `requestDevice()` → 重建全部资源。本层不做这件事，也不假装 `usable` 会回到 true。
 *
 * 另外本类额外暴露了 `defaultSampleCount`：core 的 `DeviceDescriptor` 有这个字段，
 * 但 `Device` 接口没有把它读出来，而 `CanvasConfig.sampleCount` 的默认值又要求读设备默认值。
 */
import type { Device, DeviceDescriptor, DeviceFeatures, DeviceLimits, DeviceLostInfo, DeviceTimingSupport } from '../core/Device.js';
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
import type { ExternalTextureDescriptor } from '../core/resources/ExternalTexture.js';
import type { QuerySet, QuerySetDescriptor } from '../core/resources/QuerySet.js';
import type { QueryResult, QuerySetReadOptions } from '../core/sync/QueryResult.js';
import type { SamplerDescriptor } from '../core/resources/Sampler.js';
import type { ShaderModuleDescriptor } from '../core/resources/ShaderModule.js';
import type { TextureDescriptor } from '../core/resources/Texture.js';
import type { Disposable } from '../utils/Disposable.js';
import { GpuError } from '../core/errors/GpuError.js';
import { type ErrorScopeFilter, type ErrorScopeHandle } from '../core/errors/ErrorScope.js';
import { type WebGPUAdapterRequestOptions } from './utils/wgpuCapabilities.js';
import { WebGPUBuffer } from './resources/WebGPUBuffer.js';
import { WebGPUTexture } from './resources/WebGPUTexture.js';
import { WebGPUExternalTexture } from './resources/WebGPUExternalTexture.js';
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
export declare class WebGPUDevice implements Device {
    readonly label: string;
    readonly backend: BackendKind;
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
    /**
     * GPU 计时能力的真实探测结果（见 {@link DeviceTimingSupport}）。
     *
     * 刻意在**创建设备时**算一次并缓存：能力判定必须落到真实的 API 表面（方法在不在），
     * 而不是 `features` 里的名字。探测结论在一台设备上不会变，所以不必每次问。
     */
    readonly timing: DeviceTimingSupport;
    /** `requiredLimits` 经校验后的完整 limits；`limits` 则来自实际创建出来的 device。 */
    readonly requestedLimits: DeviceLimits;
    /** `DeviceDescriptor.defaultSampleCount` 的规范化结果（1 或 4）。 */
    readonly defaultSampleCount: number;
    /** 请求设备时的原始 descriptor，便于诊断。 */
    readonly descriptor: DeviceDescriptor;
    private readonly logger;
    private readonly resources;
    private readonly canvasContexts;
    private readonly errorCallbacks;
    /**
     * `#20` 已压入、尚未弹出的错误作用域（栈顶即最内层）。
     *
     * 与原生的 `[[errorScopeStack]]` **一一对应**：这里只在 push 成功、pop 成功时同步增删，
     * 任何原生调用失败都会把本地这一层回滚掉，因此 `scopeDepth` 永远不会与原生栈不一致
     * （「状态撒谎」是本库反复修过的一类问题）。
     */
    private readonly scopeStack;
    private readonly resolveLost;
    private lostInfoValue;
    private _disposed;
    constructor(native: GPUDevice, init: WebGPUDeviceInit);
    get disposed(): boolean;
    /** 设备是否仍然可用。 */
    get usable(): boolean;
    /**
     * 已丢失时的信息；未丢失时为 `null`。
     *
     * 与 `lost` promise 表达同一件事，但可以同步查询 —— 帧循环里「现在还能不能提交」需要它。
     * 丢失一旦发生就**不可撤销**：`GPUDevice` 失效后没有任何原生手段把它救回来，
     * 恢复只能重新 `requestDevice` 并重建全部资源（本层不做这件事，见类文档）。
     */
    get lostInfo(): DeviceLostInfo | null;
    /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
    get trackedResourceCount(): number;
    /**
     * 该 feature 是否**已经在本设备上启用**（不只是 adapter 支持）。
     *
     * 需要 feature 的能力（timestamp 查询等）必须查这个而不是 `features.has()`，
     * 否则会出现「adapter 支持 → 我们以为能用 → 原生校验失败」的静默失效。
     */
    hasEnabledFeature(feature: string): boolean;
    /**
     * GPU 时间戳的「纳秒 / 刻度」换算系数。
     *
     * 优先读 `queue.getTimestampPeriod()`（规范接口），再退回 `queue.timestampPeriod` 属性。
     * 本仓库实测的 Chrome（2025 年的 Windows 版本）两者都没有暴露，此时按规范默认值 1 处理 ——
     * 也就是刻度本身就是纳秒。**绝不能**因为拿不到这个值就把刻度直接当纳秒用而不做说明：
     * 那样在其它实现（例如 period 是 83.33 的某些移动 GPU）上会得到系统性偏小的数字。
     */
    get timestampPeriod(): number;
    /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
    nextResourceId(prefix: string): string;
    createBuffer(descriptor: BufferDescriptor): WebGPUBuffer;
    createTexture(descriptor: TextureDescriptor): WebGPUTexture;
    createSampler(descriptor?: SamplerDescriptor): WebGPUSampler;
    createShaderModule(descriptor: ShaderModuleDescriptor): WebGPUShaderModule;
    createQuerySet(descriptor: QuerySetDescriptor): WebGPUQuerySet;
    /**
     * 把一个图像来源导入成外部纹理（原生 `GPUDevice.importExternalTexture`）。
     *
     * ## 为什么先探测方法在不在，而不是无脑转发
     *
     * `GPUDevice.importExternalTexture` 在**部分实现上没有**（原生接口本身也是可选的：
     * Chrome 很早就有了，其它实现未必）。直接调用会得到一句 `is not a function`，而调用方
     * 完全没有上下文。这里显式探测并给出一条带替代方案的消息 —— 这也是本库对
     * 「能力可能在也可能不在」的一贯做法（对照 `readTimingSupport()`）。
     *
     * ## 过期语义
     *
     * 返回的对象是**一帧有效**的：原生把它绑到自动过期任务源，之后任何使用都会失败。
     * 本类只提供 {@link ExternalTexture.expired} 的透传查询，不自己计时（见
     * `WebGPUExternalTexture` 的说明）。**每帧重新导入**是调用方的契约。
     *
     * ## `colorSpace` 明确报错而不是静默忽略
     *
     * `ExternalTextureDescriptor.colorSpace` 是**本库刻意保留但未实现**的字段
     * （规范的 `GPUExternalTextureDescriptor` 现在只有 `source` / `label`）。既然它在
     * 类型里存在，传了却什么都不做就是本库最忌讳的静默忽略，所以这里直接报错并给出替代方案。
     */
    importExternalTexture(descriptor: ExternalTextureDescriptor): WebGPUExternalTexture;
    /**
     * 读回 query set 的结果：`resolveQuerySet` → `copyBufferToBuffer` → `mapAsync`。
     *
     * 两个中转 buffer 都通过 `this.createBuffer()` 创建，因此被设备的资源追踪覆盖：
     * 正常路径由 `QueryResult.read()` 销毁，忘了读则在 `device.dispose()` 时统一释放。
     */
    readQuerySet(querySet: QuerySet, options?: QuerySetReadOptions): QueryResult;
    createBindGroupLayout(descriptor: BindGroupLayoutDescriptor): WebGPUBindGroupLayout;
    createBindGroup(descriptor: BindGroupDescriptor): WebGPUBindGroup;
    createPipelineLayout(descriptor: PipelineLayoutDescriptor): WebGPUPipelineLayout;
    createRenderPipeline(descriptor: RenderPipelineDescriptor): WebGPURenderPipeline;
    createComputePipeline(descriptor: ComputePipelineDescriptor): WebGPUComputePipeline;
    createRenderTarget(descriptor: RenderTargetDescriptor): WebGPURenderTarget;
    createCommandEncoder(descriptor?: CommandEncoderDescriptor): WebGPUCommandEncoder;
    /**
     * 为一个 canvas 建立（或取回）本设备的 swap chain 表面。
     *
     * 同一个 canvas 只会有一个 `GPUCanvasContext`，因此这里按 canvas 元素缓存
     * {@link WebGPUCanvasContext}；重复调用返回同一个对象。给了 `config`（或该 canvas 尚未
     * configure）时会重新 configure —— 也就是可以用它切换格式 / alphaMode / sampleCount。
     */
    createCanvasContext(canvas: HTMLCanvasElement | OffscreenCanvas, config?: Omit<CanvasConfig, 'device'>): WebGPUCanvasContext;
    /**
     * 注册错误回调，返回取消订阅函数。
     *
     * 设备丢失也会通过这个通道上报（见 {@link WebGPUDevice.lost}），因此即使只关心
     * 「设备还能不能用」，也应该注册一次。
     */
    onError(callback: (error: GpuError) => void): () => void;
    /**
     * `#20` 压入错误作用域：**原生转发** `GPUDevice.pushErrorScope(filter)`。
     *
     * ## 为什么这一侧可以直接转发
     *
     * WebGPU 的错误作用域本来就是为这个场景设计的，栈、filter 匹配、不匹配时向外层穿透、
     * `pop` 的异步性全部由实现保证。本层**不重新实现**那套语义（那只会引入偏差），
     * 只做两件原生不做的事：
     *
     * 1. 记住**入栈顺序**（{@link WebGPUDevice.scopeStack}），这样未配对的 `pop` 能在本地
     *    被明确拒绝，而不是把原生那句 `OperationError` 原样漏给调用方；
     * 2. 让 `dispose()` 能把被遗弃的作用域一起清掉（否则它们会一直挂在栈上，
     *    并且原生栈也只在设备销毁时才消失）。
     *
     * ## 能力缺失时如实报错
     *
     * `GPUDevice.pushErrorScope` 在**部分实现上没有**（原生接口本身也是可选的，
     * mock / 残缺实现同样如此）。直接调用会得到一句 `is not a function`，调用方没有任何上下文，
     * 所以这里显式探测并按本库惯例给出带替代方案的英文错误 —— **不假装记录**，
     * 也不会退化成「本地记一个长度、`pop` 恒返回 null」那种会撒谎的等价物。
     */
    pushErrorScope(filter: ErrorScopeFilter): ErrorScopeHandle;
    /**
     * `#20` 弹出错误作用域：原生 `popErrorScope()` 的结果映射成本库错误类型。
     *
     * 归属由原生保证（入栈时的那一层），所以这里只处理「没有作用域可弹」这一种本地错误：
     * 它**拒绝**，而不是 resolve 成 `null` —— 后者会让「忘了配对」看起来像「作用域里没有错误」。
     */
    popErrorScope(): Promise<GpuError | null>;
    /** 当前仍在栈上的错误作用域层数（诊断与测试用）。 */
    get scopeDepth(): number;
    /** 作用域句柄的默认 label（与其它资源一样走 `nextResourceId`，便于日志对照）。 */
    private scopeLabel;
    /** {@link WebGPUDevice.popErrorScope} 与作用域句柄 `pop()` 共用的唯一实现。 */
    private popScope;
    /** 通过已注册的回调上报错误，不抛异常。回调自身抛错不会影响其它回调。 */
    reportError(error: GpuError): void;
    /** 释放设备创建的全部资源，然后销毁 device。幂等。 */
    dispose(): void;
    private track;
    /**
     * 资源在 `destroy()` / `dispose()` 时把自己从追踪集合里摘掉。
     *
     * 不做这一步的话，每帧 create/destroy 的工作负载（command encoder、buffer、texture、
     * bind group……）会让 `resources` 一直强引用这些已经释放的包装对象及其原生句柄，
     * 直到 `device.dispose()` 才释放 —— 这是实打实的泄漏。
     *
     * 幂等：对未追踪（或已摘掉）的资源调用是空操作。
     */
    untrack(resource: Disposable): void;
    /**
     * 在任何会创建资源 / 提交工作之前检查设备仍可用。
     *
     * 丢失后 `GPUDevice` 上的所有调用都会被实现**静默丢弃**（命令不执行、也不报错），
     * 表现就是「画不出来但一切正常」；所以这里必须主动抛出带 `[gpu-device-api] ` 前缀的
     * {@link DeviceLostError}，并带上丢失原因。
     *
     * ## `#16`：「已 dispose」抛的也是 `DeviceLostError`，两个后端一致
     *
     * 改前这里对 `_disposed` 抛的是 `ValidationError`，而 WebGL2 后端抛 `DeviceLostError`
     * —— 同一段上层代码（例如「拿旧 device 的资源去创建东西」的错误恢复分支）在 WebGPU 上
     * 只会看到 `ValidationError`，跨后端写 `instanceof DeviceLostError` 的恢复逻辑就会漏掉这一支。
     *
     * 「已 dispose」与「设备丢失」是两件事，但**归类**是同一类：设备已经不能再用、
     * 调用方该做的是丢弃它并重建。所以这里也抛 `DeviceLostError`，用 `reason: 'destroyed'`
     * 表示「是调用方主动释放的、属于预期情形」（`isExpected === true`），
     * 而真正的丢失（`GPUDevice.lost` / `webglcontextlost`）仍然带它自己的 reason。
     *
     * 公开（而不是 private）是因为 `WebGPUQueue` 的提交路径也要用它 —— 设备丢失后
     * `queue.submit()` 是唯一「静默无效」的提交入口，必须在那一层拦下。
     */
    assertUsable(operation: string): void;
    private handleDeviceLost;
}
/**
 * 把原生 `GPUError` 翻译成 core 的错误类型。
 *
 * 分类同时尝试 `instanceof`（浏览器里全局构造器存在）与 `constructor.name`（构造器被跨
 * realm / 被 polyfill 时的兜底），保证「不知道是哪一类」时也不会丢消息。
 */
export declare function toGpuError(error: unknown): GpuError;
//# sourceMappingURL=WebGPUDevice.d.ts.map