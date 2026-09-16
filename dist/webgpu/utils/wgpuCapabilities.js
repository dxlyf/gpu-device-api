/**
 * WebGPU 能力探测：`navigator.gpu` / adapter / device 的读取，以及 core 侧 `DeviceLimits`
 * 与 `DeviceFeatures` 的实现。
 *
 * 这一层刻意与 `WebGPUAdapter` / `WebGPUDevice` 解耦：它只处理「原生对象 → core 数据」的
 * 纯转换，既方便在 Node 里单测，也让 capabilities 的读取不必依赖具体类。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { toGPUTextureFormat } from './wgpuFormatMap.js';
/**
 * core 的 `DeviceLimits` 全部字段名，顺序与 WebGPU 的 `GPUSupportedLimits` 一致。
 * 用它来读取原生 limits：名称一一对应，所以不需要逐字段手抄。
 */
export const DEVICE_LIMIT_KEYS = [
    'maxTextureDimension1D',
    'maxTextureDimension2D',
    'maxTextureDimension3D',
    'maxTextureArrayLayers',
    'maxBindGroups',
    'maxBindGroupsPlusVertexBuffers',
    'maxBindingsPerBindGroup',
    'maxDynamicUniformBuffersPerPipelineLayout',
    'maxDynamicStorageBuffersPerPipelineLayout',
    'maxSampledTexturesPerShaderStage',
    'maxSamplersPerShaderStage',
    'maxStorageBuffersPerShaderStage',
    'maxStorageTexturesPerShaderStage',
    'maxUniformBuffersPerShaderStage',
    'maxUniformBufferBindingSize',
    'maxStorageBufferBindingSize',
    'minUniformBufferOffsetAlignment',
    'minStorageBufferOffsetAlignment',
    'maxVertexBuffers',
    'maxBufferSize',
    'maxVertexAttributes',
    'maxVertexBufferArrayStride',
    'maxInterStageShaderVariables',
    'maxColorAttachments',
    'maxColorAttachmentBytesPerSample',
    'maxComputeWorkgroupStorageSize',
    'maxComputeInvocationsPerWorkgroup',
    'maxComputeWorkgroupSizeX',
    'maxComputeWorkgroupSizeY',
    'maxComputeWorkgroupSizeZ',
    'maxComputeWorkgroupsPerDimension',
];
/**
 * WebGPU 的默认（保证可用）limits 中与 core 对应的部分。
 *
 * 只有浏览器实现较旧、缺少某个 limit 字段时才会用到它，因此取的是 WebGPU 规范里的
 * 「default limits」值，宁可保守也不要夸大。
 * `maxBindGroupsPlusVertexBuffers` 与 `maxInterStageShaderVariables` 在早期实现里可能缺失。
 */
export const FALLBACK_DEVICE_LIMITS = Object.freeze({
    maxTextureDimension1D: 8192,
    maxTextureDimension2D: 8192,
    maxTextureDimension3D: 2048,
    maxTextureArrayLayers: 256,
    maxBindGroups: 4,
    maxBindGroupsPlusVertexBuffers: 24,
    maxBindingsPerBindGroup: 640,
    maxDynamicUniformBuffersPerPipelineLayout: 8,
    maxDynamicStorageBuffersPerPipelineLayout: 4,
    maxSampledTexturesPerShaderStage: 16,
    maxSamplersPerShaderStage: 16,
    maxStorageBuffersPerShaderStage: 8,
    maxStorageTexturesPerShaderStage: 4,
    maxUniformBuffersPerShaderStage: 12,
    maxUniformBufferBindingSize: 65536,
    maxStorageBufferBindingSize: 134217728,
    minUniformBufferOffsetAlignment: 256,
    minStorageBufferOffsetAlignment: 256,
    maxVertexBuffers: 8,
    maxBufferSize: 268435456,
    maxVertexAttributes: 16,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: 16,
    maxColorAttachments: 8,
    maxColorAttachmentBytesPerSample: 32,
    maxComputeWorkgroupStorageSize: 16384,
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxComputeWorkgroupSizeY: 256,
    maxComputeWorkgroupSizeZ: 64,
    maxComputeWorkgroupsPerDimension: 65535,
});
/** 取 `navigator.gpu`；不可用时返回 `null`（不抛错，便于 `detectBackend` 静默回退）。 */
export function getWebGPU() {
    const navigatorLike = globalThis.navigator;
    const gpu = navigatorLike?.gpu;
    if (!gpu || typeof gpu.requestAdapter !== 'function')
        return null;
    return gpu;
}
/** 当前环境是否暴露可用的 WebGPU 入口。 */
export function isWebGPUSupported() {
    return getWebGPU() !== null;
}
/** 请求一个原生 adapter；`navigator.gpu` 不存在或没有可用 adapter 时返回 `null`。 */
export async function requestWebGPUAdapter(options = {}) {
    const gpu = getWebGPU();
    if (!gpu)
        return null;
    const request = {};
    if (options.powerPreference !== undefined)
        request.powerPreference = options.powerPreference;
    if (options.forceFallbackAdapter !== undefined)
        request.forceFallbackAdapter = options.forceFallbackAdapter;
    if (options.featureLevel !== undefined)
        request.featureLevel = options.featureLevel;
    if (options.xrCompatible !== undefined)
        request.xrCompatible = options.xrCompatible;
    return gpu.requestAdapter(request);
}
/** 读取 `GPUSupportedFeatures` 的集合形态；实现缺失时返回空集合。 */
export function readSupportedFeatures(features) {
    const result = new Set();
    if (!features)
        return result;
    const iterable = features;
    if (typeof iterable[Symbol.iterator] === 'function') {
        for (const feature of features)
            result.add(feature);
        return result;
    }
    const keys = features.keys;
    if (typeof keys === 'function') {
        for (const feature of keys.call(features))
            result.add(feature);
        return result;
    }
    const forEach = features.forEach;
    if (typeof forEach === 'function') {
        forEach.call(features, (value) => result.add(value));
    }
    return result;
}
/** 读取 `GPUSupportedLimits`；缺失的字段用 {@link FALLBACK_DEVICE_LIMITS} 补齐。 */
export function readDeviceLimits(limits) {
    const source = (limits ?? {});
    const resolved = {};
    for (const key of DEVICE_LIMIT_KEYS) {
        const value = source[key];
        resolved[key] = typeof value === 'number' && Number.isFinite(value) ? value : FALLBACK_DEVICE_LIMITS[key];
    }
    return resolved;
}
/** 把原生 adapter 信息读成 core 的 {@link AdapterInfo}。 */
export function describeWebGPUAdapter(adapter) {
    const info = adapter.info ?? {};
    return {
        backend: 'webgpu',
        vendor: info.vendor ?? '',
        architecture: info.architecture ?? '',
        device: info.device ?? '',
        description: info.description ?? '',
        isFallbackAdapter: info.isFallbackAdapter === true,
    };
}
/**
 * 校验请求的 features 是否都在可用集合里。
 *
 * WebGPU 自己会忽略不认识的 feature 名（旧实现），因此这里主动报错比让需求静默失效更好。
 */
export function validateRequiredFeatures(available, required, context) {
    if (!required || required.length === 0)
        return [];
    const requested = [];
    for (const feature of required) {
        if (typeof feature !== 'string' || feature.length === 0) {
            throw new ValidationError(`[gpu-device-api] ${context}: feature names must be non-empty strings.`);
        }
        if (requested.includes(feature))
            continue;
        requested.push(feature);
        if (!available.has(feature)) {
            throw new ValidationError(`[gpu-device-api] ${context}: the adapter does not support the "${feature}" feature. ` +
                `Available features: ${available.size > 0 ? [...available].sort().join(', ') : '(none)'}.`);
        }
    }
    return requested;
}
/** 基于一个字符串集合实现的 {@link DeviceFeatures}。 */
export class WebGPUFeatures {
    set;
    constructor(features) {
        this.set = features instanceof Set ? features : new Set(features);
    }
    has(feature) {
        return this.set.has(feature);
    }
    get names() {
        return [...this.set].sort();
    }
    /** 便于调试的字符串形式。 */
    toString() {
        return `WebGPUFeatures(${this.names.join(', ') || 'none'})`;
    }
}
/** 后端偏好的 canvas back buffer 格式；WebGPU 不可用时回退到 `bgra8unorm`。 */
export function preferredCanvasFormat() {
    const gpu = getWebGPU();
    if (!gpu)
        return 'bgra8unorm';
    // 规范保证只会返回 rgba8unorm / bgra8unorm，这里仍然显式判断一次，
    // 免得将来规范扩展时静默拿到 core 不认识的值。
    return gpu.getPreferredCanvasFormat() === 'rgba8unorm' ? 'rgba8unorm' : 'bgra8unorm';
}
/** 校验并转发 canvas 格式。 */
export function toCanvasFormat(format) {
    const gpuFormat = toGPUTextureFormat(format);
    if (gpuFormat !== 'rgba8unorm' && gpuFormat !== 'bgra8unorm') {
        throw new ValidationError(`[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the ` +
            `canvas format, got "${format}".`);
    }
    return gpuFormat;
}
/** 从 canvas 元素取 `GPUCanvasContext`；取不到（未启用 WebGPU）时返回 `null`。 */
export function getWebGPUCanvasContext(canvas) {
    // lib.dom 的 getContext 重载里没有 'webgpu'（由 @webgpu/types 提供 GPUCanvasContext 类型），
    // 因此按签名调用一次，再在运行时确认返回值的形状。
    const getContext = canvas.getContext;
    const context = getContext.call(canvas, 'webgpu');
    if (!context || typeof context.getCurrentTexture !== 'function')
        return null;
    return context;
}
/** 该 canvas 元素是否支持 WebGPU context。 */
export function isWebGPUCanvasSupported(canvas) {
    return getWebGPUCanvasContext(canvas) !== null;
}
//# sourceMappingURL=wgpuCapabilities.js.map