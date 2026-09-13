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

import { ValidationError } from '../../core/errors/ValidationError.js';
import { nextId } from '../../utils/id.js';
import {
  resolveSamplerDescriptor,
  type Sampler,
  type SamplerDescriptor,
} from '../../core/resources/Sampler.js';
import { GL_ADDRESS_MODES, GL_COMPARE_FUNCS, GL_FILTERS } from '../utils/glEnumMap.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import { queryMaxAnisotropy } from '../utils/glCapabilities.js';

export class WebGL2Sampler implements Sampler {
  readonly label: string;
  readonly descriptor: Sampler['descriptor'];
  readonly native: WebGLSampler;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private _disposed = false;

  constructor(gl: WebGL2RenderingContext, state: GlStateCache, descriptor: SamplerDescriptor = {}) {
    this.gl = gl;
    this.state = state;
    this.descriptor = resolveSamplerDescriptor(descriptor);
    this.label = descriptor.label ?? nextId('sampler');

    const sampler = gl.createSampler();
    if (!sampler) throw new ValidationError('[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。');
    this.native = sampler;

    const resolved = this.descriptor;
    gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, GL_FILTERS[resolved.minFilter]);
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, GL_FILTERS[resolved.magFilter]);

    // GL 的 mip 过滤是与 min 过滤合并在一个枚举里的，所以只有当 min 不是 NEAREST 时
    // 才有必要区分「线性 mip」与「最近 mip」。
    if (resolved.minFilter === 'linear' && resolved.mipmapFilter === 'linear') {
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else if (resolved.minFilter === 'linear') {
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else if (resolved.mipmapFilter === 'linear') {
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    } else {
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

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

  get disposed(): boolean {
    return this._disposed;
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.gl.deleteSampler(this.native);
    // 被删掉的 sampler 对象如果还绑在某个单元上，GL 会自动解绑，但缓存需要同步清理。
    this.state.invalidate();
  }

  dispose(): void {
    this.destroy();
  }
}
