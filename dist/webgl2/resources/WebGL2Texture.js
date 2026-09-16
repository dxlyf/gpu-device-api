/**
 * WebGL2 纹理资源。
 *
 * 用不可变的 `texStorage2D` / `texStorage3D` 一次性分配存储，后续只用 `texSubImage2D` 上传内容。
 * 相比 `texImage2D` 每次都可能重新分配，这个组合在 WebGL2 上更快，也更接近 WebGPU
 * 「先创建不可变纹理、再 copy 数据进去」的模型。
 *
 * WebGL2 没有 texture view 对象，`createView()` 返回的是**记录子资源范围**的轻量包装，
 * 真正的 GL 纹理句柄还是同一个。
 *
 * **本后端的纹理行序（与 WebGPU 对齐的那一部分，以及没对齐的那一处）**
 *
 * - 上传：`gl.texSubImage2D` 把主机数据的第 0 行写进纹素第 0 行，**不翻**（本后端的
 *   `writeTexture` 从不设置 `UNPACK_FLIP_Y_WEBGL`；只有 `copyExternalImageToTexture` 会按它的
 *   `flipY` 参数设置它）。所以「数据第 0 行 = 纹素第 0 行 = `v = 0`」与 WebGPU 完全一致。
 * - 图像来源：`copyExternalImageToTexture` 显式设置 `UNPACK_FLIP_Y_WEBGL`，语义与 WebGPU 的
 *   `flipY` 选项一致（默认都关）。
 * - **渲染目标（未对齐）**：GL 的窗口原点在左下角，附着到 FBO 上的纹理因此是**自下而上**存的 ——
 *   纹素第 0 行是画面底端。WebGPU 的附件纹素 (0, 0) 在左上角。于是同一个渲染结果，
 *   WebGL2 读回 / 采样出来的行序与 WebGPU 相反。
 *   修法只能落在渲染路径（按目标类型把 Y 翻过来，例如给非默认帧缓冲注入 `gl_Position.y` 取反的
 *   顶点着色器变体或等价手段 —— WebGL2 不允许负高度的 `gl.viewport`），纹理资源这一层无能为力。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { assertPositiveInteger } from '../../utils/assert.js';
import { nextId } from '../../utils/id.js';
import { resolveTextureSize, TextureDimension, } from '../../core/resources/Texture.js';
import { glFormat } from '../utils/glFormatMap.js';
import { multisampleApi } from '../utils/glCapabilities.js';
import { WebGL2TextureView } from './WebGL2TextureView.js';
/**
 * WebGL2 里「32 位浮点」纹理格式。它们是 color-renderable 的前提是上下文带
 * `EXT_color_buffer_float` 扩展，而 `generateMipmap` 要求 base level 必须 color-renderable。
 */
const FLOAT32_FORMATS = new Set(['r32float', 'rg32float', 'rgba32float']);
/** core 的维度映射到 GL 的纹理目标。 */
export function glTextureTarget(dimension, depthOrArrayLayers) {
    if (dimension === '1d') {
        throw new ValidationError('[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。');
    }
    if (dimension === '3d')
        return 0x806f; // TEXTURE_3D
    if (depthOrArrayLayers > 1)
        return 0x8c1a; // TEXTURE_2D_ARRAY
    return 0x0de1; // TEXTURE_2D
}
export class WebGL2Texture {
    label;
    dimension;
    format;
    usage;
    width;
    height;
    depthOrArrayLayers;
    mipLevelCount;
    sampleCount;
    native;
    gl;
    state;
    glTarget;
    onDestroy;
    /** 已创建的 view；随纹理一起失效。 */
    views = [];
    _disposed = false;
    constructor(gl, state, descriptor, onDestroy) {
        this.gl = gl;
        this.state = state;
        this.onDestroy = onDestroy;
        const extent = resolveTextureSize(descriptor.size);
        assertPositiveInteger(extent.width, 'TextureDescriptor.size.width');
        if (extent.height <= 0 || extent.depthOrArrayLayers <= 0) {
            throw new ValidationError(`[gpu-device-api] 纹理尺寸必须为正数，实际是 ${extent.width}x${extent.height}x${extent.depthOrArrayLayers}。`);
        }
        const format = glFormat(descriptor.format);
        const dimension = descriptor.dimension ?? TextureDimension.D2;
        const sampleCount = descriptor.sampleCount ?? 1;
        const mipLevelCount = descriptor.mipLevelCount ?? 1;
        if (sampleCount > 1) {
            if (dimension !== TextureDimension.D2 || extent.depthOrArrayLayers > 1) {
                throw new ValidationError('[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: \'2d\'` 且 `depthOrArrayLayers: 1`）。');
            }
            if (mipLevelCount > 1) {
                throw new ValidationError('[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。');
            }
        }
        if (mipLevelCount > 1) {
            const maxLevels = Math.floor(Math.log2(Math.max(extent.width, extent.height))) + 1;
            if (mipLevelCount > maxLevels) {
                throw new ValidationError(`[gpu-device-api] mipLevelCount=${mipLevelCount} 超过了 ${extent.width}x${extent.height} 能容纳的最大层数 ${maxLevels}。`);
            }
        }
        this.label = descriptor.label ?? nextId('texture');
        this.dimension = dimension;
        this.format = descriptor.format;
        this.usage = descriptor.usage;
        this.width = extent.width;
        this.height = extent.height;
        this.depthOrArrayLayers = extent.depthOrArrayLayers;
        this.mipLevelCount = mipLevelCount;
        this.sampleCount = sampleCount;
        this.glTarget = glTextureTarget(dimension, extent.depthOrArrayLayers);
        const texture = gl.createTexture();
        if (!texture)
            throw new ValidationError('[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。');
        this.native = texture;
        // 分配存储时不需要经过状态缓存：这里绑一次就好，之后所有操作都带显式目标。
        gl.bindTexture(this.glTarget, texture);
        if (sampleCount > 1) {
            // `lib.dom.d.ts` 目前没有声明 `texStorage2DMultisample`（较新的 WebGL2 接口），
            // 这里通过一个最小扩展接口调用，避免用 `as any` 把整个上下文变成无类型。
            multisampleApi(gl).texStorage2DMultisample(this.glTarget, sampleCount, format.internalFormat, extent.width, extent.height, false);
        }
        else if (dimension === TextureDimension.D3) {
            gl.texStorage3D(this.glTarget, mipLevelCount, format.internalFormat, extent.width, extent.height, extent.depthOrArrayLayers);
        }
        else if (extent.depthOrArrayLayers > 1) {
            gl.texStorage3D(this.glTarget, mipLevelCount, format.internalFormat, extent.width, extent.height, extent.depthOrArrayLayers);
        }
        else {
            gl.texStorage2D(this.glTarget, mipLevelCount, format.internalFormat, extent.width, extent.height);
        }
        this.applyDefaultSamplerParameters();
    }
    get size() {
        return { width: this.width, height: this.height, depthOrArrayLayers: this.depthOrArrayLayers };
    }
    get disposed() {
        return this._disposed;
    }
    /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
    get target() {
        return this.glTarget;
    }
    createView(descriptor = {}) {
        if (this._disposed) {
            throw new ValidationError(`[gpu-device-api] 纹理「${this.label}」已销毁，不能再创建 view。`);
        }
        const view = new WebGL2TextureView(this, descriptor);
        this.views.push(view);
        return view;
    }
    /**
     * 用 GL 内置的 `generateMipmap` 生成 mip 链（第 1 级到第 `mipLevelCount - 1` 级）。
     *
     * 前提条件（不满足就抛 {@link ValidationError}，不做静默降级）：
     * - 单采样（多重采样纹理没有 mip 链）；
     * - `mipLevelCount > 1`（否则没有任何级别可生成）；
     * - 格式必须是「color-renderable 且可过滤」的 unorm / 浮点格式：`generateMipmap` 内部
     *   就是一次带滤波的降采样，整数格式（`*uint` / `*sint`）、snorm 与纯深度 / 模板格式在
     *   GL 里都不满足这个条件，硬调用只会在 `getError()` 里留下一条很难定位的
     *   `INVALID_OPERATION`。32 位浮点格式还需要 `EXT_color_buffer_float` 才是 color-renderable。
     *
     * **颜色空间（这里最容易写错）**：格式是 `rgba8unorm-srgb` 时，GL 会把纹素**先解码到线性
     * 空间**、在线性空间做盒式滤波，再把结果编码回 sRGB 写进各级 mip。这是唯一正确的做法：
     * 直接对 sRGB 编码字节求平均会系统性偏暗 —— 黑白棋盘的第 1 级，线性平均得到 sRGB 188，
     * 而对编码字节求平均只有 128。实测对比见 `examples/core-texture-mipmap.ts`。
     *
     * 调用后会 `invalidate()` 整个状态缓存：为了生成 mip 必须把这张纹理绑到当前活动单元，
     * 而状态缓存并不知道「当前活动单元」是哪一个，与其猜错不如整体作废。
     * 这是加载期的一次性操作，代价可以接受。
     */
    generateMipmaps() {
        if (this._disposed) {
            throw new ValidationError(`[gpu-device-api] Texture "${this.label}".generateMipmaps: the texture has been destroyed.`);
        }
        if (this.sampleCount > 1) {
            throw new ValidationError(`[gpu-device-api] Texture "${this.label}".generateMipmaps: a multisampled texture ` +
                `(sampleCount=${this.sampleCount}) has no mip chain.`);
        }
        if (this.mipLevelCount <= 1) {
            throw new ValidationError(`[gpu-device-api] Texture "${this.label}".generateMipmaps: mipLevelCount is 1, so there is no ` +
                'level to generate; allocate the texture with an explicit mipLevelCount (fullMipLevelCount(size)).');
        }
        const info = glFormat(this.format);
        if (!info.attachment || info.sampleType !== 'float') {
            throw new ValidationError(`[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" cannot be used ` +
                'with generateMipmap on WebGL2, which requires a color-renderable and filterable format ' +
                '(integer, snorm and pure depth/stencil formats are none of those). Use rgba8unorm, ' +
                'rgba8unorm-srgb, r8unorm or a float format instead.');
        }
        if (FLOAT32_FORMATS.has(this.format) && !this.gl.getExtension('EXT_color_buffer_float')) {
            throw new ValidationError(`[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" is only ` +
                'color-renderable (and therefore a valid generateMipmap target) when the context exposes ' +
                'EXT_color_buffer_float, which it does not.');
        }
        this.gl.bindTexture(this.glTarget, this.native);
        this.gl.generateMipmap(this.glTarget);
        this.state.invalidate();
    }
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        for (const view of this.views)
            view.markDestroyed();
        this.views.length = 0;
        this.state.forgetTexture(this.native);
        this.gl.deleteTexture(this.native);
        this.onDestroy(this);
    }
    dispose() {
        this.destroy();
    }
    /**
     * 给纹理对象本身设置一套默认采样参数。
     *
     * 取值刻意与 **WebGPU 的默认值**一致（`nearest` + `clamp-to-edge`），这样即使使用者忘记
     * 提供 Sampler，两个后端的观感也相同。WebGL2 的 GL 默认值（`LINEAR_MIPMAP_LINEAR` +
     * `REPEAT`）反而会与 WebGPU 不一致。
     */
    applyDefaultSamplerParameters() {
        const gl = this.gl;
        const target = this.glTarget;
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(target, gl.TEXTURE_MAX_LEVEL, this.mipLevelCount - 1);
    }
}
//# sourceMappingURL=WebGL2Texture.js.map