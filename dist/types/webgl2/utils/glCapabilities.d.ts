/**
 * WebGL2 能力探测：把 `gl.getParameter` 查到的上限整理成 core 的 {@link DeviceLimits}。
 *
 * WebGPU 专有的 limits（bind group 数量、storage buffer 大小等）在 WebGL2 下没有对应概念，
 * 这里给**保守的默认值**，让上层共享代码可以无条件读取任意一个 limit 而不必先判断后端。
 * 保守的意思是：宁可让上层的自动策略偏保守，也不要给出一个 WebGL2 达不到的数字。
 */
import type { DeviceLimits } from '../../core/Device.js';
/** WebGPU 专有 limits 的保守取值（WebGL2 后端用）。 */
export declare const WEBGL2_SYNTHETIC_LIMITS: Readonly<Record<string, number>>;
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
/** 查询 WebGL2 上限。fallback 用的是 GLES 3.0 规范下限，保证不会高估。 */
export declare function queryGlLimits(gl: WebGL2RenderingContext): GlLimits;
/**
 * 把 GL 上限与保守默认值合成一份完整的 {@link DeviceLimits}。
 * `MAX_ELEMENT_INDEX` 会限制 32 位索引实际能寻址的顶点数，所以 `maxBufferSize` 也据此收敛。
 */
export declare function buildDeviceLimits(gl: WebGL2RenderingContext): DeviceLimits;
/** WebGL2 后端支持的特性名（与 WebGPU 的 feature 名保持一致，便于上层统一判断）。 */
export declare const WEBGL2_FEATURE_NAMES: readonly string[];
/** 探测 WebGL2 实际可用的特性集合。 */
export declare function queryGlFeatures(gl: WebGL2RenderingContext): Set<string>;
/** 通过 `WEBGL_debug_renderer_info` 拿到 GPU 名称；扩展不可用时返回空串。 */
export declare function queryGlRendererInfo(gl: WebGL2RenderingContext): {
    vendor: string;
    device: string;
};
/** 查询纹理各向异性上限；扩展不可用时返回 1。 */
export declare function queryMaxAnisotropy(gl: WebGL2RenderingContext): number;
/** 取 WebGL2 context；拿不到时给出人类可读的原因。 */
export declare function requireWebGL2Context(canvas: HTMLCanvasElement | OffscreenCanvas, attributes?: WebGLContextAttributes): WebGL2RenderingContext;
/**
 * 多重采样纹理接口。
 *
 * TypeScript 的 `lib.dom.d.ts` 声明了 `renderbufferStorageMultisample`，却漏了
 * `texStorage2DMultisample`（以及 `texImage2DMultisample`）。这两个接口在 WebGL2 里是标准的一部分，
 * 所以这里补一个最小类型，调用点可以保持有类型。
 */
export interface WebGL2MultisampleApi {
    texStorage2DMultisample(target: number, samples: number, internalformat: number, width: number, height: number, fixedsamplelocations: boolean): void;
    texImage2DMultisample(target: number, samples: number, internalformat: number, width: number, height: number, fixedsamplelocations: boolean): void;
}
/** 取得多重采样接口。运行时不检查：WebGL2 环境下这些方法一定存在。 */
export declare function multisampleApi(gl: WebGL2RenderingContext): WebGL2MultisampleApi;
//# sourceMappingURL=glCapabilities.d.ts.map