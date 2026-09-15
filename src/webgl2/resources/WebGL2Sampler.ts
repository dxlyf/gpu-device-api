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

import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import {
  resolveSamplerDescriptor,
  type Sampler,
  type SamplerDescriptor,
} from '../../core/resources/Sampler.js';
import type { FilterMode } from '../../core/enums/FilterMode.js';
import { GL_ADDRESS_MODES, GL_COMPARE_FUNCS, GL_FILTERS } from '../utils/glEnumMap.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import { queryMaxAnisotropy } from '../utils/glCapabilities.js';

/*
 * GL 的 min 过滤枚举（写死数值，这样 {@link resolveGlMinFilter} 是纯函数、不需要 GL 上下文）。
 * 取值来自 OpenGL ES 3.0 规范表 3.13。
 */
const GL_NEAREST = 0x2600;
const GL_LINEAR = 0x2601;
const GL_NEAREST_MIPMAP_NEAREST = 0x2700;
const GL_LINEAR_MIPMAP_NEAREST = 0x2701;
const GL_NEAREST_MIPMAP_LINEAR = 0x2702;
const GL_LINEAR_MIPMAP_LINEAR = 0x2703;

/** 「纹理有 mip」的默认假设：即 WebGPU 语义里「有 mip 就用 mip」。 */
const MIPS_ASSUMED = Number.POSITIVE_INFINITY;

/**
 * `(minFilter, mipmapFilter, mipLevelCount)` → GL 的 `TEXTURE_MIN_FILTER`。
 *
 * 纯函数，方便把 4 种组合 × 有无 mip 的映射表逐项验证（见 `test/webgl2-sampler-mapping.test.ts`）。
 *
 * @param minFilter 单级 mip 内部的纹素混合方式
 * @param mipmapFilter 相邻 mip 之间的混合方式
 * @param mipLevelCount 纹理实际的 mip 级数；`<= 1` 表示没有 mip 链，必须退化成单级过滤
 */
export function resolveGlMinFilter(
  minFilter: FilterMode,
  mipmapFilter: FilterMode,
  mipLevelCount: number,
): number {
  if (mipLevelCount <= 1) {
    // 只有第 0 级：无从做级间混合，必须用不带 mip 的枚举（否则在没有 mip 链的纹理上不完整）。
    return minFilter === 'linear' ? GL_LINEAR : GL_NEAREST;
  }
  if (minFilter === 'linear') {
    return mipmapFilter === 'linear' ? GL_LINEAR_MIPMAP_LINEAR : GL_LINEAR_MIPMAP_NEAREST;
  }
  return mipmapFilter === 'linear' ? GL_NEAREST_MIPMAP_LINEAR : GL_NEAREST_MIPMAP_NEAREST;
}

export class WebGL2Sampler implements Sampler {
  readonly label: string;
  readonly descriptor: Sampler['descriptor'];
  readonly native: WebGLSampler;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  /**
   * 释放完成后的通知回调。
   *
   * `WebGL2Device` 用它把自己从资源追踪集合里摘掉（见 `WebGL2Device.untrack`）——
   * 不做这一步，「每帧 create/destroy」的用法会让追踪集合一直强引用已经删掉的 sampler 对象
   * 与原生句柄，直到 `device.dispose()`。不传时为空操作，sampler 仍可独立使用。
   */
  private readonly onDispose: (sampler: WebGL2Sampler) => void;
  private _disposed = false;
  /** 当前按几级 mip 映射 `TEXTURE_MIN_FILTER`；`MIPS_ASSUMED` 表示假定有 mip。 */
  private mipLevelCount = MIPS_ASSUMED;

  constructor(
    gl: WebGL2RenderingContext,
    state: GlStateCache,
    descriptor: SamplerDescriptor = {},
    onDispose: (sampler: WebGL2Sampler) => void = () => {},
  ) {
    this.gl = gl;
    this.state = state;
    this.onDispose = onDispose;
    this.descriptor = resolveSamplerDescriptor(descriptor);
    this.label = descriptor.label ?? nextId('sampler');

    const sampler = gl.createSampler();
    if (!sampler) throw new ValidationError('[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。');
    this.native = sampler;

    const resolved = this.descriptor;
    // 取值校验：`magFilter` / `minFilter` / `mipmapFilter` 在 WebGPU 里都只有 nearest / linear
    // 两种（GL 那些带 `_MIPMAP_` 的名字在这里不是合法取值），JS 调用方可能硬塞进来。
    if (resolved.magFilter !== 'nearest' && resolved.magFilter !== 'linear') {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": magFilter must be "nearest" or "linear" ` +
          `(WebGPU never uses mipmaps for magnification), got "${String(resolved.magFilter)}".`,
      );
    }
    if (resolved.minFilter !== 'nearest' && resolved.minFilter !== 'linear') {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": minFilter must be "nearest" or "linear", ` +
          `got "${String(resolved.minFilter)}".`,
      );
    }
    if (resolved.mipmapFilter !== 'nearest' && resolved.mipmapFilter !== 'linear') {
      throw new ValidationError(
        `[gpu-device-api] Sampler "${this.label}": mipmapFilter must be "nearest" or "linear", ` +
          `got "${String(resolved.mipmapFilter)}".`,
      );
    }

    // `magFilter` 与 mip 无关：WebGPU 的放大过滤永远是单级的，直接映射。
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, GL_FILTERS[resolved.magFilter]);
    this.applyMinFilter();

    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, GL_ADDRESS_MODES[resolved.addressModeU]);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, GL_ADDRESS_MODES[resolved.addressModeV]);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, GL_ADDRESS_MODES[resolved.addressModeW]);

    // WebGPU 的 lodMinClamp/lodMaxClamp 对应 GL 的 TEXTURE_MIN_LOD / TEXTURE_MAX_LOD。
    gl.samplerParameterf(sampler, gl.TEXTURE_MIN_LOD, resolved.lodMinClamp);
    gl.samplerParameterf(sampler, gl.TEXTURE_MAX_LOD, resolved.lodMaxClamp);

    if (resolved.compare !== undefined) {
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_FUNC, GL_COMPARE_FUNCS[resolved.compare]);
    } else {
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.NONE);
    }

    if (resolved.maxAnisotropy > 1) {
      const extension = gl.getExtension('EXT_texture_filter_anisotropic');
      if (extension) {
        const max = queryMaxAnisotropy(gl);
        gl.samplerParameterf(
          sampler,
          extension.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(resolved.maxAnisotropy, max),
        );
      }
      // 扩展不可用时静默忽略：各向异性过滤只是画质优化，不影响正确性。
    }
  }

  /**
   * 当前映射出来的 GL `TEXTURE_MIN_FILTER`（供调试与单测断言）。
   *
   * 默认按「纹理有 mip」算 —— WebGPU 的语义就是「只要有 mip 就用 mip」，
   * 而 sampler 对象在 WebGL2 里是先于纹理创建的。
   */
  get minFilter(): number {
    return resolveGlMinFilter(
      this.descriptor.minFilter,
      this.descriptor.mipmapFilter,
      this.mipLevelCount,
    );
  }

  /** 当前是按几级 mip 映射的；`Infinity` 表示「假定有 mip」。 */
  get assumedMipLevelCount(): number {
    return this.mipLevelCount;
  }

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
  setMipLevelCount(mipLevelCount: number | null): void {
    const next = mipLevelCount === null ? MIPS_ASSUMED : mipLevelCount;
    if (next === this.mipLevelCount) return;
    this.mipLevelCount = next;
    if (this._disposed) return;
    this.applyMinFilter();
  }

  private applyMinFilter(): void {
    this.gl.samplerParameteri(this.native, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
  }

  get disposed(): boolean {
    return this._disposed;
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.gl.deleteSampler(this.native);
    // 被删掉的 sampler 对象如果还绑在某个单元上，GL 会自动解绑，但缓存需要同步清理。
    this.state.invalidate();
    // 幂等：上面的 `_disposed` 早退保证通知只发生一次（重复 destroy 不会让计数变负）。
    this.onDispose(this);
  }

  dispose(): void {
    this.destroy();
  }
}
