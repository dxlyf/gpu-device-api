/**
 * WebGL2 的 texture view。
 *
 * WebGL2 没有 view 对象：同一个 `WebGLTexture` 句柄可以按不同 mip / 层范围去采样或作为附件。
 * 所以这里是个**轻量记录器** —— 保存子资源范围，`native` 直接返回底层 GL 纹理，
 * 真正用到范围的地方（framebuffer 附件、`texSubImage3D` 的 z 偏移）由调用方读取这些字段。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { resolveTextureViewDescriptor, DEFAULT_TEXTURE_SWIZZLE, } from '../../core/resources/TextureView.js';
import { nextId } from '../../utils/id.js';
export class WebGL2TextureView {
    label;
    texture;
    descriptor;
    _disposed = false;
    constructor(texture, descriptor) {
        const resolved = resolveTextureViewDescriptor(texture, descriptor);
        /*
         * `#23`：`swizzle` 在 WebGL2 上**做不到**，必须明确报错。
         *
         * 为什么做不到：GLES 3.0 的纹理没有 view 对象，采样时各通道的取值由**内部格式**决定
         * （`RGBA8` 就是 r/g/b/a，`R8` 就是 r/0/0/1），没有任何调用能在绑定点上重排它们。
         * 桌面 GL 有 `GL_TEXTURE_SWIZZLE_R/G/B/A`，但那是 **GL 3.3 / GLES 3.1** 的
         * `glTextureParameteri` 路径，WebGL2（= GLES 3.0）既不暴露这些枚举、也不暴露
         * `glTextureParameteri`；本机无头 Chrome 实测 `gl.TEXTURE_SWIZZLE_R` 是 `undefined`、
         * 相关扩展（`EXT_texture_swizzle` / `WEBGL_texture_swizzle` / `OES_texture_view`）全部拿不到。
         *
         * 静默忽略的后果比报错严重得多：调用方以为「r8unorm 当灰度图用、rgb 都取自红通道」，
         * 实际采样到的是 `(r, 0, 0, 1)` —— 画面发黑但一切「正常」，正是最难查的一类。
         */
        if (resolved.swizzle !== undefined && resolved.swizzle !== DEFAULT_TEXTURE_SWIZZLE) {
            throw new ValidationError(`[gpu-device-api] texture view「${descriptor.label ?? '(unnamed)'}」要求 swizzle` +
                `「${resolved.swizzle}」，但 WebGL2 后端做不到：GLES 3.0 没有 view 对象，采样时各通道的` +
                '取值由纹理内部格式决定，没有任何调用能在绑定点上重排通道（桌面 GL 的' +
                ' GL_TEXTURE_SWIZZLE_* 是 GL 3.3 / GLES 3.1 的能力，WebGL2 不暴露这些枚举，' +
                '相关扩展在本机实测也全部拿不到）。替代方案：在着色器里直接写通道选择' +
                '（`texture(...).rrr` / `vec4(t.r, t.r, t.r, 1.0)`），或者先按需要的通道布局' +
                '重建一张纹理再采样，或者切到 WebGPU 后端（它有真正的 `swizzle`）。');
        }
        /*
         * `descriptor.format`（按 `viewFormats` 重解释格式）在 WebGL2 上**可以**表达，但本后端
         * 没有 texture view 对象 —— `createView()` 返回的只是一个范围记录器，真正采样时用的是
         * **源纹理自身的内部格式**（`gl.texStorage*` 时定下的那个）。所以一旦允许 view 声明
         * 另一个格式，采样就会按源格式解释数据：`sampler2D` 去读 `RGBA8UI`、`usampler2D` 去读
         * `RGBA8`，GL 不报错，结果由实现决定（正是「静默无效」最坏的一类）。
         *
         * 这里**明确拒绝**，并说明替代方案。WebGPU 侧本来就要求重解释格式必须列在该纹理的
         * `viewFormats` 里；WebGL2 做不到，所以两个后端的差异必须在这里显式暴露。
         */
        if (resolved.format !== undefined && resolved.format !== texture.format) {
            throw new ValidationError(`[gpu-device-api] texture view「${descriptor.label ?? '(unnamed)'}」要求把纹理` +
                `「${texture.label}」重解释成「${resolved.format}」，但 WebGL2 后端做不到：GL 没有 view ` +
                '对象，采样用的始终是源纹理自己的内部格式，于是着色器会按另一种格式去解释同一段内存' +
                '（不报错，数值无意义）。请为需要的格式单独创建一张纹理，或把数据拷进一张' +
                `「${resolved.format}」纹理后再采样。`);
        }
        /*
         * `#17`：`cube` / `cube-array` 单独拦下，给一条**说得清根因**的错误。
         *
         * 改前这两种维度会掉到下面那条「维度与纹理不一致」的通用校验里（`expectedViewDimension()`
         * 永远返回 `'2d'` / `'2d-array'` / `'3d'`），于是消息是：
         *
         * > texture view 的 dimension「cube」与纹理「...」的「2d-array」不一致；
         * > WebGL2 没有 view 对象，维度的差别无法表达
         *
         * 这条消息把「WebGL2 根本没有立方体贴图采样」说成了「你把纹理的维度配错了」，
         * 调用方会去改纹理的 `depthOrArrayLayers` / `dimension`（怎么改都还是错），
         * 而不是换方案 —— 对一个「做不到」的能力来说，指错方向比不报错更难查。
         *
         * 为什么确实做不到：WebGL2（GLES 3.0）的立方体贴图是**独立的纹理目标**
         * `TEXTURE_CUBE_MAP`，它有自己的 `texStorage2D` 分配与「6 个面各一个偏移」的寻址方式；
         * 本后端的纹理是按 `TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D` 分配的（见
         * `glTextureTarget()`），`GL_TEXTURE_2D_ARRAY` 在着色器里只能被 `sampler2DArray` 采样，
         * 没有任何方式把它当成 `samplerCube` 用。而且 core 的 `TextureDescriptor` 里也没有
         * 「立方体贴图」这个维度（只有 `1d` / `2d` / `3d`），所以连「创建一张 cube 纹理再建 cube view」
         * 这条路都不存在。
         */
        if (resolved.dimension === 'cube' || resolved.dimension === 'cube-array') {
            throw new ValidationError(`[gpu-device-api] texture view「${descriptor.label ?? '(unnamed)'}」要求 dimension` +
                `「${resolved.dimension}」，但 WebGL2 后端不支持立方体贴图采样：GLES 3.0 的立方体贴图是` +
                '独立的 TEXTURE_CUBE_MAP 纹理目标，而本后端的纹理按 TEXTURE_2D / TEXTURE_2D_ARRAY / ' +
                'TEXTURE_3D 分配（本后端的 TextureDescriptor 也没有 cube 维度），两者无法互相重解释。' +
                '替代方案：用 2D array 纹理（`size.depthOrArrayLayers = 6`）承载 6 个面，在着色器里用' +
                '`sampler2DArray` 手动按面选层（例如按主法线轴算层号），需要方向采样时自己做一次' +
                '坐标到「层 + uv」的换算；或者切到 WebGPU 后端（它有真正的 `cube` / `cube-array` view）。');
        }
        if (resolved.dimension !== expectedViewDimension(texture)) {
            throw new ValidationError(`[gpu-device-api] texture view 的 dimension「${resolved.dimension}」与纹理` +
                `「${texture.label}」的「${expectedViewDimension(texture)}」不一致；` +
                'WebGL2 没有 view 对象，维度的差别无法表达（GL 的纹理目标在分配时就定下了）。');
        }
        if (resolved.baseMipLevel + resolved.mipLevelCount > texture.mipLevelCount) {
            throw new ValidationError(`[gpu-device-api] texture view 的 mip 范围 [${resolved.baseMipLevel}, ${resolved.baseMipLevel + resolved.mipLevelCount}) ` +
                `超出了纹理「${texture.label}」的 ${texture.mipLevelCount} 层。`);
        }
        if (resolved.baseArrayLayer + resolved.arrayLayerCount > texture.depthOrArrayLayers) {
            throw new ValidationError(`[gpu-device-api] texture view 的层范围 [${resolved.baseArrayLayer}, ${resolved.baseArrayLayer + resolved.arrayLayerCount}) ` +
                `超出了纹理「${texture.label}」的 ${texture.depthOrArrayLayers} 层。`);
        }
        this.texture = texture;
        this.descriptor = resolved;
        this.label = descriptor.label ?? nextId('textureView');
    }
    /** WebGL2 里 view 就是纹理本身，所以直接返回 GL 纹理句柄。 */
    get native() {
        return this.texture.native;
    }
    /**
     * 实际生效的通道重排。
     *
     * WebGL2 上**唯一**能生效的值就是不重排（`'rgba'`）：构造函数已经拒绝了其它取值，
     * 所以这里恒为 `'rgba'`，与 WebGPU 后端的默认值一致。
     */
    get swizzle() {
        return DEFAULT_TEXTURE_SWIZZLE;
    }
    /** 底层 GL 纹理（与 `native` 相同，语义更明确）。 */
    get glTexture() {
        return this.texture.native;
    }
    /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
    get target() {
        return this.texture.target;
    }
    get disposed() {
        return this._disposed;
    }
    /** 纹理销毁时由纹理统一调用，避免 view 继续被使用。 */
    markDestroyed() {
        this._disposed = true;
    }
    dispose() {
        // view 不持有独立资源，销毁由纹理负责。
        this._disposed = true;
    }
}
/**
 * 一张纹理**唯一**能表达的 view 维度。
 *
 * GL 的纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）在 `texStorage*` 时就定下了，
 * 所以维度不是一个可以在绑定点上切换的属性 —— 传入别的维度只能报错。
 */
function expectedViewDimension(texture) {
    if (texture.dimension === '3d')
        return '3d';
    return texture.depthOrArrayLayers > 1 ? '2d-array' : '2d';
}
//# sourceMappingURL=WebGL2TextureView.js.map