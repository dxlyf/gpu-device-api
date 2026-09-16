/**
 * WebGPU 后端：把 `src/core` 的接口实现到 WebGPU 原生 API 上。
 *
 * 结构：
 * - {@link WebGPUAdapter} / {@link WebGPUDevice} / {@link WebGPUCanvasContext}：入口对象；
 * - `resources/`：buffer、texture、texture view、sampler、shader module、query set；
 * - `binding/`：bind group layout / bind group / pipeline layout；
 * - `pipeline/`：render pipeline（惰性编译 + variant 缓存）、compute pipeline、固定功能状态；
 * - `render/`：render target、command encoder、render/compute pass encoder；
 * - `sync/`：queue、fence；
 * - `utils/`：枚举映射（`wgpuEnumMap`）、格式映射与能力表（`wgpuFormatMap`）、能力探测
 *   （`wgpuCapabilities`）。
 *
 * 命名约定：core 的接口名（`Device`、`Buffer`……）不带前缀，后端类一律加 `WebGPU` 前缀，
 * 这样 `implements` 关系在文件里一眼可见。
 */
export { WebGPUAdapter, createWebGPUAdapter } from './WebGPUAdapter.js';
export { WebGPUDevice, toGpuError, type WebGPUDeviceInit } from './WebGPUDevice.js';
export { WebGPUCanvasContext, isWebGPUCanvasContext, type WebGPUCanvasContextOptions, type WebGPUCanvasPassOptions, } from './WebGPUCanvasContext.js';
export { WebGPUBuffer, asGPUBuffer, describeUnknown, isNativeGPUBuffer, isWebGPUBuffer, } from './resources/WebGPUBuffer.js';
export { WebGPUTexture, asGPUTexture, isNativeGPUTexture, isWebGPUTexture, type ResolvedTextureDescriptor, } from './resources/WebGPUTexture.js';
export { WebGPUTextureView, asGPUTextureView, isNativeGPUTextureView, isWebGPUTextureView, type ResolvedTextureViewDescriptor, } from './resources/WebGPUTextureView.js';
export { WebGPUExternalTexture, asGPUExternalTexture, isNativeGPUExternalTexture, isWebGPUExternalTexture, } from './resources/WebGPUExternalTexture.js';
export { WebGPUSampler, asGPUSampler, isNativeGPUSampler, isWebGPUSampler, } from './resources/WebGPUSampler.js';
export { WebGPUShaderModule, asWebGPUShaderModule, isWebGPUShaderModule, } from './resources/WebGPUShaderModule.js';
export { WebGPUQuerySet, asGPUQuerySet, isWebGPUQuerySet, TIMESTAMP_INSIDE_PASSES_FEATURES, TIMESTAMP_QUERY_FEATURE, toGPUTimestampWrites, } from './resources/WebGPUQuerySet.js';
export { WebGPUBindGroupLayout, asGPUBindGroupLayout, isNativeGpuObject, isWebGPUBindGroupLayout, } from './binding/WebGPUBindGroupLayout.js';
export { WebGPUBindGroup, asGPUBindGroup, isWebGPUBindGroup, validateDynamicOffsets, } from './binding/WebGPUBindGroup.js';
export { WebGPUPipelineLayout, asGPUPipelineLayout, isWebGPUPipelineLayout, } from './binding/WebGPUPipelineLayout.js';
export { WebGPURenderPipeline, asGPURenderPipeline, describeRenderPipelineVariant, isWebGPURenderPipeline, DEFAULT_FRAGMENT_ENTRY_POINT, DEFAULT_VERTEX_ENTRY_POINT, } from './pipeline/WebGPURenderPipeline.js';
export { WebGPUComputePipeline, asGPUComputePipeline, isWebGPUComputePipeline, DEFAULT_COMPUTE_ENTRY_POINT, } from './pipeline/WebGPUComputePipeline.js';
export { WebGPURenderState, DEFAULT_STRIP_INDEX_FORMAT } from './pipeline/WebGPURenderState.js';
export { PipelineCache, computePipelineCacheKey, createWgpuPipelineCache, describeVertexLayouts, renderPipelineCacheKey, } from './pipeline/PipelineCache.js';
export { WebGPURenderTarget } from './render/WebGPURenderTarget.js';
export { WebGPUCommandBuffer, WebGPUCommandEncoder, asGPUCommandBuffer, } from './render/WebGPUCommandEncoder.js';
export { WebGPURenderPassEncoder, resolveIndirect, toGPURenderPassDescriptor, type WebGPURenderPassLayout, } from './render/WebGPURenderPassEncoder.js';
export { WebGPUComputePassEncoder, toGPUComputePassDescriptor, } from './render/WebGPUComputePassEncoder.js';
export { WebGPUFence } from './sync/WebGPUFence.js';
export { WebGPUQueue } from './sync/WebGPUQueue.js';
export { WebGPUQueryResult, type WebGPUQueryResultInit } from './sync/WebGPUQueryResult.js';
export { GPU_BUFFER_USAGE, GPU_COLOR_WRITE, GPU_MAP_MODE, GPU_SHADER_STAGE, GPU_TEXTURE_USAGE, assertSampleCount, assertSamplerBindingType, isStripTopology, resolveClearColor, toGPUAddressMode, toGPUBlendFactor, toGPUBlendOperation, toGPUBufferBindingType, toGPUBufferUsage, toGPUColorWriteMask, toGPUCompareFunction, toGPUCullMode, toGPUExtent3D, toGPUFilterMode, toGPUFrontFace, toGPUIndexFormat, toGPULoadOp, toGPUMapMode, toGPUMipmapFilterMode, toGPUOrigin3D, toGPUPrimitiveTopology, toGPUQueryType, toGPUSamplerBindingType, toGPUShaderStage, toGPUStencilOperation, toGPUStoreOp, toGPUTexelCopyBufferLayout, toGPUTextureAspect, toGPUTextureSampleType, toGPUTextureUsage, toGPUTextureViewDimension, toGPUVertexFormat, toGPUVertexStepMode, } from './utils/wgpuEnumMap.js';
export { TEXTURE_FORMAT_CAPABILITIES, assertCopyableFormat, assertRenderableFormat, assertSampleableFormat, assertStorageTextureFormat, assertTextureAspectForFormat, assertTextureUsageSupported, defaultTextureSampleType, filterFeatureFor, fromGPUTextureFormat, hasDepthAspect, hasStencilAspect, isDepthOrStencilFormat, isFilterableFormat, isRenderableFormat, isStorageTextureFormat, textureFormatCapabilities, toGPUTextureFormat, type TextureFormatCapabilities, type TextureFormatKind, } from './utils/wgpuFormatMap.js';
export { DEVICE_LIMIT_KEYS, FALLBACK_DEVICE_LIMITS, WebGPUFeatures, describeWebGPUAdapter, getWebGPU, getWebGPUCanvasContext, isWebGPUCanvasSupported, isWebGPUSupported, preferredCanvasFormat, readDeviceLimits, readSupportedFeatures, requestWebGPUAdapter, toCanvasFormat, validateRequiredFeatures, type WebGPUAdapterRequestOptions, } from './utils/wgpuCapabilities.js';
//# sourceMappingURL=index.d.ts.map