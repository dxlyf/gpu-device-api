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
 *
 * ## minFilter / mipmapFilter 的映射（这里是踩过坑的地方）
 *
 * WebGPU 把「缩小过滤」拆成两个正交的字段：
 *
 * - `minFilter` 只管**同一级 mip 内部**的纹素混合；
 * - `mipmapFilter` 只管**相邻两级 mip 之间**的混合。
 *
 * 而且 **是否使用 mip 不由这两个字段决定**：只要纹理有 mip 链、采样时的 LOD 落在有效范围内，
 * 采样就会走 mip。GL 却把这两件事合并进同一个 `TEXTURE_MIN_FILTER` 枚举，
 * 所以映射必须按「这张纹理到底有没有 mip」分成两套：
 *
 * - 有 mip（`mipLevelCount > 1`）：4 种组合分别落到
 *   `NEAREST_MIPMAP_NEAREST` / `NEAREST_MIPMAP_LINEAR` /
 *   `LINEAR_MIPMAP_NEAREST` / `LINEAR_MIPMAP_LINEAR`；
 * - 没有 mip（`mipLevelCount <= 1`）：纹理只有第 0 级，没有任何级间混合可做，
 *   必须退化成不带 mip 的 `NEAREST` / `LINEAR`。对没有 mip 链的纹理用 `*_MIPMAP_*`
 *   在 GL 里会得不到完整的纹理（采样结果未定义，通常是全黑），所以这里不能无条件选 mip 版本。
 *
 * `magFilter` 与 mip 无关：WebGPU 的放大过滤永远是单级的，直接映射到 GL 的 `TEXTURE_MAG_FILTER`
 * 即可（`sampler` 的 descriptor 类型也把它的取值限制成 `nearest` / `linear` 两种）。
 *
 * sampler 对象本身**拿不到**它将要采样的那张纹理（WebGL2 与 WebGPU 一样把两者解耦），
 * 所以「有没有 mip」在构造时按「假定有 mip」处理（这正是 WebGPU 的语义：有 mip 就用 mip），
 * 需要按单级纹理降级时由绑定层调用 {@link WebGL2Sampler.setMipLevelCount}。
 */
import { type Sampler, type SamplerDescriptor } from '../../core/resources/Sampler.js';
import type { FilterMode } from '../../core/enums/FilterMode.js';
import type { GlStateCache } from '../utils/glStateCache.js';
/**
 * `(minFilter, mipmapFilter, mipLevelCount)` → GL 的 `TEXTURE_MIN_FILTER`。
 *
 * 纯函数，方便把 4 种组合 × 有无 mip 的映射表逐项验证（见 `test/webgl2-sampler-mapping.test.ts`）。
 *
 * @param minFilter 单级 mip 内部的纹素混合方式
 * @param mipmapFilter 相邻 mip 之间的混合方式
 * @param mipLevelCount 纹理实际的 mip 级数；`<= 1` 表示没有 mip 链，必须退化成单级过滤
 */
export declare function resolveGlMinFilter(minFilter: FilterMode, mipmapFilter: FilterMode, mipLevelCount: number): number;
export declare class WebGL2Sampler implements Sampler {
    readonly label: string;
    readonly descriptor: Sampler['descriptor'];
    readonly native: WebGLSampler;
    private readonly gl;
    private readonly state;
    /**
     * 释放完成后的通知回调。
     *
     * `WebGL2Device` 用它把自己从资源追踪集合里摘掉（见 `WebGL2Device.untrack`）——
     * 不做这一步，「每帧 create/destroy」的用法会让追踪集合一直强引用已经删掉的 sampler 对象
     * 与原生句柄，直到 `device.dispose()`。不传时为空操作，sampler 仍可独立使用。
     */
    private readonly onDispose;
    private _disposed;
    /** 当前按几级 mip 映射 `TEXTURE_MIN_FILTER`；`MIPS_ASSUMED` 表示假定有 mip。 */
    private mipLevelCount;
    constructor(gl: WebGL2RenderingContext, state: GlStateCache, descriptor?: SamplerDescriptor, onDispose?: (sampler: WebGL2Sampler) => void);
    /**
     * 当前映射出来的 GL `TEXTURE_MIN_FILTER`（供调试与单测断言）。
     *
     * 默认按「纹理有 mip」算 —— WebGPU 的语义就是「只要有 mip 就用 mip」，
     * 而 sampler 对象在 WebGL2 里是先于纹理创建的。
     */
    get minFilter(): number;
    /** 当前是按几级 mip 映射的；`Infinity` 表示「假定有 mip」。 */
    get assumedMipLevelCount(): number;
    /**
     * 告诉 sampler 它要被用来采样一张有几级 mip 的纹理。
     *
     * 传 `<= 1` 会把 `TEXTURE_MIN_FILTER` 降级成不带 mip 的 `NEAREST` / `LINEAR`：
     * 只有第 0 级的纹理配上 `*_MIPMAP_*` 在 GL 里得不到完整纹理。
     * 传 `null` 回到「假定有 mip」（构造时的默认值）。
     *
     * 这是一个**显式**接口而不是自动探测：WebGL2 / WebGPU 都把 sampler 与纹理解耦，
     * sampler 对象在任何时刻都拿不到「将要采样哪张纹理」，只有绑定层知道。
     */
    setMipLevelCount(mipLevelCount: number | null): void;
    private applyMinFilter;
    get disposed(): boolean;
    destroy(): void;
    dispose(): void;
}
//# sourceMappingURL=WebGL2Sampler.d.ts.map