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
import { BufferUsage } from '../core/enums/BufferUsage.js';
import { GpuError } from '../core/errors/GpuError.js';
import { type Logger } from '../utils/logger.js';
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
    private readonly canvasContexts;
    private lostResolve;
    private lostPromise;
    private _disposed;
    constructor(options: WebGL2DeviceOptions);
    get disposed(): boolean;
    get lost(): Promise<DeviceLostInfo>;
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
    dispose(): void;
    /**
     * 在 debug 模式下轮询 `gl.getError()` 并转成统一错误。
     * 注意这会强制 CPU/GPU 同步，所以只在 debug 打开时调用。
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
    private assertUsable;
}
/** 探测当前 canvas 上可用的 WebGL2 能力，供 adapter 使用。 */
export declare function describeGlAdapter(gl: WebGL2RenderingContext): {
    limits: DeviceLimits;
    features: Set<string>;
    vendor: string;
    device: string;
};
//# sourceMappingURL=WebGL2Device.d.ts.map