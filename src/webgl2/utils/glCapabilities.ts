/**
 * WebGL2 能力探测：把 `gl.getParameter` 查到的上限整理成 core 的 {@link DeviceLimits}。
 *
 * WebGPU 专有的 limits（bind group 数量、storage buffer 大小等）在 WebGL2 下没有对应概念，
 * 这里给**保守的默认值**，让上层共享代码可以无条件读取任意一个 limit 而不必先判断后端。
 * 保守的意思是：宁可让上层的自动策略偏保守，也不要给出一个 WebGL2 达不到的数字。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import type { DeviceLimits } from '../../core/Device.js';

/** WebGPU 专有 limits 的保守取值（WebGL2 后端用）。 */
export const WEBGL2_SYNTHETIC_LIMITS: Readonly<Record<string, number>> = Object.freeze({
  maxBindGroups: 4,
  maxBindGroupsPlusVertexBuffers: 4,
  maxBindingsPerBindGroup: 16,
  maxDynamicUniformBuffersPerPipelineLayout: 4,
  maxDynamicStorageBuffersPerPipelineLayout: 0,
  maxStorageBuffersPerShaderStage: 0,
  maxStorageTexturesPerShaderStage: 0,
  minStorageBufferOffsetAlignment: 256,
  maxStorageBufferBindingSize: 0,
  maxComputeWorkgroupStorageSize: 0,
  maxComputeInvocationsPerWorkgroup: 0,
  maxComputeWorkgroupSizeX: 0,
  maxComputeWorkgroupSizeY: 0,
  maxComputeWorkgroupSizeZ: 0,
  maxComputeWorkgroupsPerDimension: 0,
  maxColorAttachmentBytesPerSample: 32,
  maxVertexBuffers: 16,
});

/** 从 GL 上下文查询到的真实上限。 */
export interface GlLimits {
  maxTextureSize: number;
  max3dTextureSize: number;
  maxArrayTextureLayers: number;
  maxSamples: number;
  maxUniformBufferBindings: number;
  maxUniformBlockSize: number;
  maxUniformBufferOffsetAlignment: number;
  maxVertexAttribs: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  maxTextureImageUnits: number;
  maxCombinedTextureImageUnits: number;
  maxCubeMapTextureSize: number;
  maxRenderbufferSize: number;
  maxElementIndex: number;
  maxElementsVertices: number;
  maxElementsIndices: number;
}

function param(gl: WebGL2RenderingContext, name: number, fallback: number): number {
  const value = gl.getParameter(name) as number | null;
  return typeof value === 'number' && value > 0 ? value : fallback;
}

/**
 * `MAX_ELEMENT_INDEX` 的保守下限。
 *
 * GLES 3.0 要求它至少是 2^24 - 1，但 WebGL2 没有把它放进 `getParameter` 的可查询表里：
 * Chrome / ANGLE 上查它只会得到一个 INVALID_ENUM（`invalid parameter name`）。
 * 这个错误标志会一直留在上下文里，把**后面真正的绘制错误**（例如本可以立刻发现的
 * INVALID_OPERATION）顶掉，让调试变成猜谜 —— 所以这里干脆不查，直接用规范下限。
 */
const MAX_ELEMENT_INDEX_FLOOR = 0xffffff;

/** 查询 WebGL2 上限。fallback 用的是 GLES 3.0 规范下限，保证不会高估。 */
export function queryGlLimits(gl: WebGL2RenderingContext): GlLimits {
  return {
    maxTextureSize: param(gl, 0x0d33 /* MAX_TEXTURE_SIZE */, 2048),
    max3dTextureSize: param(gl, 0x8073 /* MAX_3D_TEXTURE_SIZE */, 256),
    maxArrayTextureLayers: param(gl, 0x88ff /* MAX_ARRAY_TEXTURE_LAYERS */, 256),
    maxSamples: param(gl, 0x8d57 /* MAX_SAMPLES */, 4),
    maxUniformBufferBindings: param(gl, 0x8a2f /* MAX_UNIFORM_BUFFER_BINDINGS */, 12),
    maxUniformBlockSize: param(gl, 0x8a30 /* MAX_UNIFORM_BLOCK_SIZE */, 16384),
    maxUniformBufferOffsetAlignment: param(gl, 0x8a34 /* UNIFORM_BUFFER_OFFSET_ALIGNMENT */, 256),
    maxVertexAttribs: param(gl, 0x8869 /* MAX_VERTEX_ATTRIBS */, 16),
    maxVertexUniformVectors: param(gl, 0x8dfb /* MAX_VERTEX_UNIFORM_VECTORS */, 128),
    maxFragmentUniformVectors: param(gl, 0x8dfd /* MAX_FRAGMENT_UNIFORM_VECTORS */, 128),
    maxVaryingVectors: param(gl, 0x8dfc /* MAX_VARYING_VECTORS */, 8),
    maxTextureImageUnits: param(gl, 0x8872 /* MAX_TEXTURE_IMAGE_UNITS */, 16),
    maxCombinedTextureImageUnits: param(gl, 0x8b4d /* MAX_COMBINED_TEXTURE_IMAGE_UNITS */, 32),
    maxCubeMapTextureSize: param(gl, 0x851c /* MAX_CUBE_MAP_TEXTURE_SIZE */, 2048),
    maxRenderbufferSize: param(gl, 0x84e8 /* MAX_RENDERBUFFER_SIZE */, 2048),
    maxElementIndex: MAX_ELEMENT_INDEX_FLOOR,
    maxElementsVertices: param(gl, 0x80e9 /* MAX_ELEMENTS_VERTICES */, 0x7fffffff),
    maxElementsIndices: param(gl, 0x80e8 /* MAX_ELEMENTS_INDICES */, 0x7fffffff),
  };
}

/**
 * 把 GL 上限与保守默认值合成一份完整的 {@link DeviceLimits}。
 *
 * `maxBufferSize` 没有跟着 `MAX_ELEMENT_INDEX` 收敛：后者限制的是**索引值**能寻址的顶点序号，
 * 不是 buffer 的字节数，混用会让上限凭空变小（而且 WebGL2 反正也查不到它）。
 */
export function buildDeviceLimits(gl: WebGL2RenderingContext): DeviceLimits {
  const gl2 = queryGlLimits(gl);
  const maxBufferSize = 0x7fffffff;

  return {
    /*
     * `#18`：WebGL2 **没有** 1D 纹理，所以这个 limit 如实报 0。
     *
     * 改前报的是 `MAX_TEXTURE_SIZE`（本机实测 2048），而同一份能力探测的另一端
     *（`glTextureTarget()` / `WebGL2Texture` 构造）明确拒绝 `dimension: '1d'`。
     * 于是「先读 `device.limits` 再决定要不要用 1D 纹理」的调用方会读到 2048、
     * 据此做出「支持 1D」的决策，然后在 `createTexture()` 那里才吃到异常 ——
     * limits 撒谎属于本会话反复在修的那类「静默错误」（同一个事实有两个互相矛盾的来源）。
     *
     * 为什么不是「用 height = 1 的 2D 纹理模拟出来」：那确实能装下数据，但 `sampler2D` 与
     * `sampler1D` 是两个不同的着色器类型，本层没有「把 2D 纹理按 1D 采样」的表达方式，
     * 承诺一个做不到的 `dimension: '1d'` 会比报 0 更容易误导。
     *
     * 读数为 0 的统一含义（与 WebGPU 的 storage/compute 类 limit 在 WebGL2 上报 0 一致）：
     * **这个后端没有该能力**，请改用 `{ width: n, height: 1 }` 的 2D 纹理或切到 WebGPU。
     */
    maxTextureDimension1D: 0,
    maxTextureDimension2D: gl2.maxTextureSize,
    maxTextureDimension3D: gl2.max3dTextureSize,
    maxTextureArrayLayers: gl2.maxArrayTextureLayers,

    maxBindGroups: WEBGL2_SYNTHETIC_LIMITS.maxBindGroups!,
    maxBindGroupsPlusVertexBuffers: WEBGL2_SYNTHETIC_LIMITS.maxBindGroupsPlusVertexBuffers!,
    maxBindingsPerBindGroup: WEBGL2_SYNTHETIC_LIMITS.maxBindingsPerBindGroup!,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      WEBGL2_SYNTHETIC_LIMITS.maxDynamicUniformBuffersPerPipelineLayout!,
      gl2.maxUniformBufferBindings,
    ),
    maxDynamicStorageBuffersPerPipelineLayout: 0,
    maxSampledTexturesPerShaderStage: gl2.maxTextureImageUnits,
    maxSamplersPerShaderStage: gl2.maxTextureImageUnits,
    maxStorageBuffersPerShaderStage: 0,
    maxStorageTexturesPerShaderStage: 0,
    // WebGL2 里 uniform buffer 的最小绑定单位就是「块」，同时绑定的块数受 binding 数限制。
    maxUniformBuffersPerShaderStage: gl2.maxUniformBufferBindings,
    maxUniformBufferBindingSize: gl2.maxUniformBlockSize,
    maxStorageBufferBindingSize: 0,
    minUniformBufferOffsetAlignment: gl2.maxUniformBufferOffsetAlignment,
    minStorageBufferOffsetAlignment: WEBGL2_SYNTHETIC_LIMITS.minStorageBufferOffsetAlignment!,
    maxVertexBuffers: Math.min(WEBGL2_SYNTHETIC_LIMITS.maxVertexBuffers!, gl2.maxVertexAttribs),
    maxBufferSize,
    maxVertexAttributes: gl2.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: gl2.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: WEBGL2_SYNTHETIC_LIMITS.maxColorAttachmentBytesPerSample!,

    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0,
  };
}

/** WebGL2 后端支持的特性名（与 WebGPU 的 feature 名保持一致，便于上层统一判断）。 */
export const WEBGL2_FEATURE_NAMES: readonly string[] = [
  'texture-anisotropy',
  'texture-float32-filterable',
  'color-buffer-float',
  'debug-renderer-info',
  /**
   * GPU 计时。WebGPU 上这是同名的 device feature；WebGL2 上它等价于「拿到了
   * `EXT_disjoint_timer_query_webgl2`」。用同一个名字是为了让上层（例如 gfx 的 GPU 计时入口）
   * 能用 `device.features.has('timestamp-query')` 统一判断，而不必分后端写两套探测。
   */
  'timestamp-query',
];

/** 探测 WebGL2 实际可用的特性集合。 */
export function queryGlFeatures(gl: WebGL2RenderingContext): Set<string> {
  const features = new Set<string>();
  if (gl.getExtension('EXT_texture_filter_anisotropic')) features.add('texture-anisotropy');
  if (gl.getExtension('OES_texture_float_linear')) features.add('texture-float32-filterable');
  if (gl.getExtension('EXT_color_buffer_float')) features.add('color-buffer-float');
  if (gl.getExtension('WEBGL_debug_renderer_info')) features.add('debug-renderer-info');
  // 时间查询扩展：它决定 timestamp query set 能不能建（见 WebGL2QuerySet）。
  if (gl.getExtension('EXT_disjoint_timer_query_webgl2')) features.add('timestamp-query');
  /*
   * 外部纹理：**恒不可用**，所以这里一个名字都不加。
   *
   * 为什么要有这条注释：这个特性名的存在意义是让上层能用
   * `device.features.has('external-texture')` 两个后端统一判断，而不是自己分后端写探测。
   * WebGL2 上没有「外部纹理」这个概念（`OES_EGL_image_external` 是 EGL / GLES 的扩展，
   * 浏览器端的 WebGL2RenderingContext 不暴露它；本机无头 Chrome 实测
   * `gl.importExternalTexture` 是 undefined、三个相关扩展名全部拿不到），
   * 所以 `WEBGL2_FEATURE_NAMES` 里也不列它 —— 列了就等于宣称一个永远拿不到的 feature，
   * 而 `WebGL2Device.importExternalTexture()` 会明确报错并给出替代方案。
   */
  return features;
}

/** 通过 `WEBGL_debug_renderer_info` 拿到 GPU 名称；扩展不可用时返回空串。 */
export function queryGlRendererInfo(gl: WebGL2RenderingContext): { vendor: string; device: string } {
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debug) return { vendor: '', device: '' };
  const vendor = (gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) as string | null) ?? '';
  const device = (gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) as string | null) ?? '';
  return { vendor, device };
}

/** 查询纹理各向异性上限；扩展不可用时返回 1。 */
export function queryMaxAnisotropy(gl: WebGL2RenderingContext): number {
  const extension = gl.getExtension('EXT_texture_filter_anisotropic');
  if (!extension) return 1;
  return (gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number | null) ?? 1;
}

/** 取 WebGL2 context；拿不到时给出人类可读的原因。 */
export function requireWebGL2Context(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  attributes?: WebGLContextAttributes,
): WebGL2RenderingContext {
  const context = canvas.getContext('webgl2', attributes) as WebGL2RenderingContext | null;
  if (!context) {
    throw new ValidationError(
      '[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、' +
        '该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、' +
        '或上下文数量已达上限。',
    );
  }
  return context;
}

/**
 * 多重采样纹理接口。
 *
 * TypeScript 的 `lib.dom.d.ts` 声明了 `renderbufferStorageMultisample`，却漏了
 * `texStorage2DMultisample`（以及 `texImage2DMultisample`）。这两个接口在 WebGL2 里是标准的一部分，
 * 所以这里补一个最小类型，调用点可以保持有类型。
 */
export interface WebGL2MultisampleApi {
  texStorage2DMultisample(
    target: number,
    samples: number,
    internalformat: number,
    width: number,
    height: number,
    fixedsamplelocations: boolean,
  ): void;
  texImage2DMultisample(
    target: number,
    samples: number,
    internalformat: number,
    width: number,
    height: number,
    fixedsamplelocations: boolean,
  ): void;
}

/** 取得多重采样接口。运行时不检查：WebGL2 环境下这些方法一定存在。 */
export function multisampleApi(gl: WebGL2RenderingContext): WebGL2MultisampleApi {
  return gl as unknown as WebGL2MultisampleApi;
}
