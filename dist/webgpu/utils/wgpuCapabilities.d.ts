/**
 * WebGPU 能力探测：`navigator.gpu` / adapter / device 的读取，以及 core 侧 `DeviceLimits`
 * 与 `DeviceFeatures` 的实现。
 *
 * 这一层刻意与 `WebGPUAdapter` / `WebGPUDevice` 解耦：它只处理「原生对象 → core 数据」的
 * 纯转换，既方便在 Node 里单测，也让 capabilities 的读取不必依赖具体类。
 */
import type { AdapterInfo } from '../../core/Adapter.js';
import type { DeviceFeatures, DeviceLimits } from '../../core/Device.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
/**
 * core 的 `DeviceLimits` 全部字段名，顺序与 WebGPU 的 `GPUSupportedLimits` 一致。
 * 用它来读取原生 limits：名称一一对应，所以不需要逐字段手抄。
 */
export declare const DEVICE_LIMIT_KEYS: readonly ["maxTextureDimension1D", "maxTextureDimension2D", "maxTextureDimension3D", "maxTextureArrayLayers", "maxBindGroups", "maxBindGroupsPlusVertexBuffers", "maxBindingsPerBindGroup", "maxDynamicUniformBuffersPerPipelineLayout", "maxDynamicStorageBuffersPerPipelineLayout", "maxSampledTexturesPerShaderStage", "maxSamplersPerShaderStage", "maxStorageBuffersPerShaderStage", "maxStorageTexturesPerShaderStage", "maxUniformBuffersPerShaderStage", "maxUniformBufferBindingSize", "maxStorageBufferBindingSize", "minUniformBufferOffsetAlignment", "minStorageBufferOffsetAlignment", "maxVertexBuffers", "maxBufferSize", "maxVertexAttributes", "maxVertexBufferArrayStride", "maxInterStageShaderVariables", "maxColorAttachments", "maxColorAttachmentBytesPerSample", "maxComputeWorkgroupStorageSize", "maxComputeInvocationsPerWorkgroup", "maxComputeWorkgroupSizeX", "maxComputeWorkgroupSizeY", "maxComputeWorkgroupSizeZ", "maxComputeWorkgroupsPerDimension"];
/**
 * WebGPU 的默认（保证可用）limits 中与 core 对应的部分。
 *
 * 只有浏览器实现较旧、缺少某个 limit 字段时才会用到它，因此取的是 WebGPU 规范里的
 * 「default limits」值，宁可保守也不要夸大。
 * `maxBindGroupsPlusVertexBuffers` 与 `maxInterStageShaderVariables` 在早期实现里可能缺失。
 */
export declare const FALLBACK_DEVICE_LIMITS: DeviceLimits;
/** 取 `navigator.gpu`；不可用时返回 `null`（不抛错，便于 `detectBackend` 静默回退）。 */
export declare function getWebGPU(): GPU | null;
/** 当前环境是否暴露可用的 WebGPU 入口。 */
export declare function isWebGPUSupported(): boolean;
/** adapter 请求选项。 */
export interface WebGPUAdapterRequestOptions {
    /** GPU 选择偏好；`undefined` 表示不表态。 */
    powerPreference?: GPUPowerPreference;
    /** 只要 fallback（软件）adapter。 */
    forceFallbackAdapter?: boolean;
    /** 特性级别，通常是 `'core'` 或 `'compatibility'`。 */
    featureLevel?: string;
    /** 与 canvas 兼容（`xrCompatible`），默认不设置。 */
    xrCompatible?: boolean;
}
/** 请求一个原生 adapter；`navigator.gpu` 不存在或没有可用 adapter 时返回 `null`。 */
export declare function requestWebGPUAdapter(options?: WebGPUAdapterRequestOptions): Promise<GPUAdapter | null>;
/** 读取 `GPUSupportedFeatures` 的集合形态；实现缺失时返回空集合。 */
export declare function readSupportedFeatures(features: GPUSupportedFeatures | undefined): ReadonlySet<string>;
/** 读取 `GPUSupportedLimits`；缺失的字段用 {@link FALLBACK_DEVICE_LIMITS} 补齐。 */
export declare function readDeviceLimits(limits: GPUSupportedLimits | undefined): DeviceLimits;
/** 把原生 adapter 信息读成 core 的 {@link AdapterInfo}。 */
export declare function describeWebGPUAdapter(adapter: GPUAdapter): AdapterInfo;
/**
 * 校验请求的 features 是否都在可用集合里。
 *
 * WebGPU 自己会忽略不认识的 feature 名（旧实现），因此这里主动报错比让需求静默失效更好。
 */
export declare function validateRequiredFeatures(available: ReadonlySet<string>, required: readonly string[] | undefined, context: string): readonly string[];
/** 基于一个字符串集合实现的 {@link DeviceFeatures}。 */
export declare class WebGPUFeatures implements DeviceFeatures {
    private readonly set;
    constructor(features: Iterable<string> | ReadonlySet<string>);
    has(feature: string): boolean;
    get names(): readonly string[];
    /** 便于调试的字符串形式。 */
    toString(): string;
}
/** 后端偏好的 canvas back buffer 格式；WebGPU 不可用时回退到 `bgra8unorm`。 */
export declare function preferredCanvasFormat(): TextureFormat;
/** 校验并转发 canvas 格式。 */
export declare function toCanvasFormat(format: TextureFormat): GPUTextureFormat;
/** 从 canvas 元素取 `GPUCanvasContext`；取不到（未启用 WebGPU）时返回 `null`。 */
export declare function getWebGPUCanvasContext(canvas: HTMLCanvasElement | OffscreenCanvas): GPUCanvasContext | null;
/** 该 canvas 元素是否支持 WebGPU context。 */
export declare function isWebGPUCanvasSupported(canvas: HTMLCanvasElement | OffscreenCanvas): boolean;
//# sourceMappingURL=wgpuCapabilities.d.ts.map