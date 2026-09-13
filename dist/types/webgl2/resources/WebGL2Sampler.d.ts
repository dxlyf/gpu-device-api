/**
 * WebGL2 sampler 资源，包装 GL 的 **sampler 对象**。
 *
 * WebGL2 原生支持 `gl.createSampler()`，这正好对应 WebGPU 的 sampler：
 * 采样参数与纹理解耦，可以复用一个 sampler 采样多张纹理。
 * 绑定时用 `gl.bindSampler(unit, sampler)`，采样器状态就作用在该纹理单元上。
 *
 * 深度比较采样器（`compare` 有值）会把 `TEXTURE_COMPARE_MODE` 设为
 * `COMPARE_REF_TO_TEXTURE` —— GL 要求它与着色器里声明的 sampler 类型一致
 * （`sampler2DShadow` 必须配比较模式，`sampler2D` 必须不配），否则采样结果是未定义的。
 */
import { type Sampler, type SamplerDescriptor } from '../../core/resources/Sampler.js';
import type { GlStateCache } from '../utils/glStateCache.js';
export declare class WebGL2Sampler implements Sampler {
    readonly label: string;
    readonly descriptor: Sampler['descriptor'];
    readonly native: WebGLSampler;
    private readonly gl;
    private readonly state;
    private _disposed;
    constructor(gl: WebGL2RenderingContext, state: GlStateCache, descriptor?: SamplerDescriptor);
    get disposed(): boolean;
    destroy(): void;
    dispose(): void;
}
//# sourceMappingURL=WebGL2Sampler.d.ts.map