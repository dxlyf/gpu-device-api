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
import type { Device, DeviceDescriptor, DeviceFeatures, DeviceLimits, DeviceLostInfo } from '../core/Device.js';
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
import { GpuError } from '../core/errors/GpuError.js';
import { type WebGPUAdapterRequestOptions } from './utils/wgpuCapabilities.js';
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
    /** 创建本设备的 adapter 信息，便于日志与调试。 */
    readonly adapterInfo: AdapterInfo;
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
    private readonly resolveLost;
    private lostInfo;
    private _disposed;
    constructor(native: GPUDevice, init: WebGPUDeviceInit);
    get disposed(): boolean;
    /** 设备是否仍然可用。 */
    get usable(): boolean;
    /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
    get trackedResourceCount(): number;
    /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
    nextResourceId(prefix: string): string;
    createBuffer(descriptor: BufferDescriptor): WebGPUBuffer;
    createTexture(descriptor: TextureDescriptor): WebGPUTexture;
    createSampler(descriptor?: SamplerDescriptor): WebGPUSampler;
    createShaderModule(descriptor: ShaderModuleDescriptor): WebGPUShaderModule;
    createQuerySet(descriptor: QuerySetDescriptor): WebGPUQuerySet;
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
    private assertUsable;
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