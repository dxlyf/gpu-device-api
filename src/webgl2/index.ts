/**
 * WebGL2 后端出口。
 *
 * 上层通常不需要直接引用这里的类：用 `src/factories` 的 `createDevice({ backend })`
 * 即可拿到一个实现了 core `Device` 接口的对象。这里导出具体类型，便于需要
 * 访问 WebGL2 专有能力的场景（例如 `device.state`、`device.programs` 的调试信息）。
 */

export { WebGL2Adapter, DEFAULT_WEBGL2_CONTEXT_ATTRIBUTES, type WebGL2AdapterOptions } from './WebGL2Adapter.js';
export { WebGL2Device, describeGlAdapter, type WebGL2DeviceOptions } from './WebGL2Device.js';
export {
  WebGL2CanvasContext,
  isDefaultFramebufferView,
  type DefaultFramebufferView,
  type WebGL2CanvasContextOptions,
} from './WebGL2CanvasContext.js';

export { WebGL2Buffer } from './resources/WebGL2Buffer.js';
export { WebGL2Texture, glTextureTarget } from './resources/WebGL2Texture.js';
export { WebGL2TextureView } from './resources/WebGL2TextureView.js';
export { WebGL2Sampler } from './resources/WebGL2Sampler.js';
export { WebGL2ShaderModule } from './resources/WebGL2ShaderModule.js';

export { WebGL2BindGroupLayout, assertLayoutSupportedByWebGL2 } from './binding/WebGL2BindGroupLayout.js';
export { WebGL2BindGroup } from './binding/WebGL2BindGroup.js';
export { WebGL2PipelineLayout } from './binding/WebGL2PipelineLayout.js';
export {
  BindingPlanCache,
  bindingSlotKey,
  buildBindingPlan,
  type BindingPlanLimits,
  type TextureSlot,
  type UniformBlockSlot,
  type WebGLBindingPlan,
} from './binding/TextureUnitAllocator.js';
export type { BindingPlanProvider } from './binding/plan-provider.js';

export { ProgramCache, type CompiledProgram, type ProgramCacheOptions } from './pipeline/ProgramCache.js';
export {
  WebGL2RenderPipeline,
  type ResolvedVariant,
  type VertexBufferBinding,
  type WebGL2RenderPipelineOptions,
} from './pipeline/WebGL2RenderPipeline.js';
export { WebGL2ComputePipeline } from './pipeline/WebGL2ComputePipeline.js';
export {
  applyRenderState,
  resolveRenderState,
  type ResolvedBlendState,
  type ResolvedRenderState,
} from './pipeline/WebGL2RenderState.js';

export { WebGL2RenderTarget, type RenderTargetClearOptions, type WebGL2RenderTargetOptions } from './render/WebGL2RenderTarget.js';
export { WebGL2CommandEncoder, type WebGL2CommandBuffer } from './render/WebGL2CommandEncoder.js';
export { WebGL2RenderPassEncoder, type WebGL2RenderPassOptions } from './render/WebGL2RenderPassEncoder.js';
export { WebGL2ComputePassEncoder } from './render/WebGL2ComputePassEncoder.js';
export { FramebufferCache } from './render/framebuffer-cache.js';

export { WebGL2Queue } from './sync/WebGL2Queue.js';
export { WebGL2Fence } from './sync/WebGL2Fence.js';

export {
  GL_ADDRESS_MODES,
  GL_BLEND_FACTORS,
  GL_BLEND_OPERATIONS,
  GL_COMPARE_FUNCS,
  GL_CULL_FACES,
  GL_FILTERS,
  GL_FRONT_FACES,
  GL_INDEX_TYPES,
  GL_PRIMITIVE_MODES,
  GL_STENCIL_OPS,
  assertColorAttachmentFormat,
  assertNoStorageBinding,
  glCompareFunc,
  glVertexAttribute,
  resolveClearColor,
  type GlVertexAttributeInfo,
} from './utils/glEnumMap.js';
export {
  GL_TEXTURE_FORMATS,
  assertUploadDataType,
  glFormat,
  glFormatIsAttachment,
  sampleTypeMatchesFormat,
  type GlTextureFormatInfo,
  type TextureSampleType,
} from './utils/glFormatMap.js';
export {
  WEBGL2_SYNTHETIC_LIMITS,
  buildDeviceLimits,
  queryGlFeatures,
  queryGlLimits,
  queryGlRendererInfo,
  queryMaxAnisotropy,
  requireWebGL2Context,
  type GlLimits,
} from './utils/glCapabilities.js';
export { GlStateCache, type UniformBufferBinding } from './utils/glStateCache.js';
