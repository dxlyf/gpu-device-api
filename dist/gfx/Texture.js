/**
 * 纹理：把「图片 / 原始像素」变成可以直接绑定的 core 纹理 + 采样器。
 *
 * **两条创建路径**：
 *
 * - **同步** {@link GfxTexture.create}：数据已经在手上（原始像素、`ImageData`、canvas、
 *   `ImageBitmap`），或者愿意付一次 `getImageData()` 的同步解码代价（`HTMLImageElement` 等）；
 * - **异步** {@link GfxTexture.fromImage}：把解码交给 `createImageBitmap`，可以在主线程之外
 *   解码，直接吃 URL / `Blob` / `File`，并且能显式控制色彩空间转换与 alpha 预乘。
 *
 * **mipmap 一律交给后端在 GPU 上生成**（WebGL2 用 `gl.generateMipmap`，WebGPU 用 render pass
 * 逐级降采样），不再在 JS 里逐级做盒式滤波。原因：
 *
 * 1. JS 版本必须在主线程上把整条链跑完（2048×2048 意味着 22MB 的分配与约 560 万次像素运算），
 *    而后端版本只发一条命令、由 GPU 并行完成；
 * 2. JS 版本只能对**编码后的字节**求平均。对 `-srgb` 格式这是错的：正确的做法是解码到线性
 *    空间再平均（黑白棋盘的第 1 级，线性平均给出 sRGB 188，字节平均只有 128，肉眼可辨）；
 * 3. 后端版本不需要把每一级再回传主机内存，省掉一次完整的 CPU/GPU 往返。
 *
 * CPU 版本仍以 {@link buildMipChain} 导出：它现在是「对比基线 + 特殊场合的兜底」，
 * 不再被便捷层使用。实测差异见 `examples/core-texture-mipmap.ts`。
 */
import { ValidationError } from '../core/errors/ValidationError.js';
import { TextureUsage } from '../core/enums/TextureUsage.js';
import { defaultTextureUsage, fullMipLevelCount, resolveTextureSize } from '../core/resources/Texture.js';
import { nextId } from '../utils/id.js';
/**
 * gfx 便捷层支持**从主机内存上传**的格式。
 *
 * 这里只放「8 位、能直接从主机内存拷进去」的常用格式；其余格式（half float、深度、整数、
 * 打包格式……）请直接用 `device.createTexture()` + `queue.writeTexture()`，那条路没有限制。
 */
const UPLOAD_FORMATS = Object.freeze({
    rgba8unorm: { bytesPerPixel: 4, channels: 4 },
    'rgba8unorm-srgb': { bytesPerPixel: 4, channels: 4 },
    bgra8unorm: { bytesPerPixel: 4, channels: 4 },
    'bgra8unorm-srgb': { bytesPerPixel: 4, channels: 4 },
    r8unorm: { bytesPerPixel: 1, channels: 1 },
    rg8unorm: { bytesPerPixel: 2, channels: 2 },
});
/** {@link GfxTexture.create} 能接受的格式列表（便于调用方与文档引用）。 */
export const GFX_UPLOAD_FORMATS = Object.freeze(Object.keys(UPLOAD_FORMATS));
/**
 * WebGL2 没有 BGRA 纹理格式。
 *
 * BGRA 在 GL 里只是**默认帧缓冲的隐含排布**，不是可以 `texSubImage2D` 的存储格式
 * （`format = GL_BGRA` 属于扩展，WebGL2 核心不提供）。所以这两个格式在 WebGL2 后端上
 * 直接报错，而不是偷偷当成 RGBA 上传 —— 那会让通道顺序静默错位。
 */
const WEBGL2_UNSUPPORTED_FORMATS = new Set(['bgra8unorm', 'bgra8unorm-srgb']);
/** 解析并校验格式；不支持的格式给出可直接照做的替代方案。 */
function resolveUploadFormat(format, device) {
    const info = UPLOAD_FORMATS[format];
    if (!info) {
        throw new ValidationError(`[gpu-device-api] The gfx texture layer cannot upload "${format}" from host memory. ` +
            `Supported formats: ${GFX_UPLOAD_FORMATS.join(', ')}. ` +
            'Use device.createTexture() + queue.writeTexture() for any other format.');
    }
    if (device.backend === 'webgl2' && WEBGL2_UNSUPPORTED_FORMATS.has(format)) {
        throw new ValidationError(`[gpu-device-api] Texture format "${format}" has no WebGL2 equivalent: BGRA exists there only ` +
            'as the implicit default framebuffer layout. Use "rgba8unorm" / "rgba8unorm-srgb" on WebGL2, ' +
            'or swizzle the channels before uploading.');
    }
    return info;
}
/** 一个可绑定的纹理（core 纹理 + 视图 + 采样器）。 */
export class GfxTexture {
    label;
    texture;
    view;
    sampler;
    width;
    height;
    format;
    mipLevelCount;
    /** 进程内唯一标识，用于构建 bind group 缓存键。 */
    id;
    _disposed = false;
    constructor(init) {
        this.label = init.label;
        this.texture = init.texture;
        this.view = init.view;
        this.sampler = init.sampler;
        this.width = init.width;
        this.height = init.height;
        this.format = init.format;
        this.mipLevelCount = init.mipLevelCount;
        this.id = nextId('gfxTexture');
    }
    /**
     * 同步创建纹理（含可选 mip 链，mip 由后端生成）。
     *
     * `data` 是原始像素时必须给出 `width` / `height`；是图像来源时尺寸从来源读取（图像还没
     * 加载完会抛错，需要等 `load` 事件）。图像来源会走一次 canvas + `getImageData()`，
     * 那是同步的、也只能拿到 sRGB 字节 —— 想要真正的异步解码请用 {@link GfxTexture.fromImage}。
     */
    static create(device, desc) {
        const label = desc.label ?? 'texture';
        const format = desc.format ?? 'rgba8unorm';
        const info = resolveUploadFormat(format, device);
        const fromImage = isImageSource(desc.data);
        const flipY = desc.flipY ?? fromImage;
        const mipmaps = desc.mipmaps ?? fromImage;
        const decoded = decodeSource(desc.data, desc.width, desc.height, flipY, format, info);
        return GfxTexture.build(device, {
            label,
            format,
            width: decoded.width,
            height: decoded.height,
            mipmaps,
            magFilter: desc.magFilter,
            minFilter: desc.minFilter,
            wrapS: desc.wrapS ?? desc.wrap ?? 'clamp-to-edge',
            wrapT: desc.wrapT ?? desc.wrap ?? 'clamp-to-edge',
            upload: (texture) => {
                device.queue.writeTexture({ texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } }, decoded.data, { offset: 0, bytesPerRow: decoded.width * info.bytesPerPixel, rowsPerImage: decoded.height }, { width: decoded.width, height: decoded.height, depthOrArrayLayers: 1 });
            },
        });
    }
    /**
     * 异步创建纹理：用 `createImageBitmap` 解码，再直接把它拷进纹理。
     *
     * 相比 {@link GfxTexture.create}：
     * - 解码发生在**主线程之外**（`createImageBitmap` 是异步的），不会卡住渲染循环；
     * - 直接接受 URL / `Blob` / `File`，不需要先构造 `HTMLImageElement` 再等 `load`；
     * - 可以控制色彩空间转换与 alpha 预乘（见 {@link AsyncTextureDesc.imageOptions}）；
     * - 4 通道格式走 `queue.copyExternalImageToTexture`，**不经过主机内存**，没有 `getImageData`
     *   那一次「GPU → CPU → GPU」的往返；只有 `r8unorm` / `rg8unorm` 因为需要通道重排才会
     *   退回 canvas 中转。
     *
     * 由本方法创建的 `ImageBitmap` 一定会在结束前 `close()`（包括抛错路径），不会泄漏；
     * 即便 `source` 本身就是 `ImageBitmap`，`createImageBitmap` 也会先复制一份，
     * 因此关闭的始终是本方法自己的对象，调用方手里的 bitmap 不受影响。
     */
    static async fromImage(device, desc) {
        const label = desc.label ?? 'texture';
        const format = desc.format ?? 'rgba8unorm';
        const info = resolveUploadFormat(format, device);
        const flipY = desc.flipY ?? true;
        const mipmaps = desc.mipmaps ?? true;
        const bitmap = await loadImageBitmap(desc.source, desc.imageOptions);
        try {
            const width = bitmap.width;
            const height = bitmap.height;
            if (width <= 0 || height <= 0) {
                throw new ValidationError(`[gpu-device-api] GfxTexture.fromImage("${label}"): the decoded image is ${width}x${height}.`);
            }
            if ((desc.width !== undefined && desc.width !== width) || (desc.height !== undefined && desc.height !== height)) {
                throw new ValidationError(`[gpu-device-api] GfxTexture.fromImage("${label}"): width/height (${String(desc.width)}x${String(desc.height)}) ` +
                    `do not match the decoded image (${width}x${height}); copyExternalImageToTexture does not scale, ` +
                    'so resize the source (or draw it into a canvas) first.');
            }
            if (info.channels === 4) {
                return GfxTexture.build(device, {
                    label,
                    format,
                    width,
                    height,
                    mipmaps,
                    magFilter: desc.magFilter,
                    minFilter: desc.minFilter,
                    wrapS: desc.wrapS ?? desc.wrap ?? 'clamp-to-edge',
                    wrapT: desc.wrapT ?? desc.wrap ?? 'clamp-to-edge',
                    // WebGPU 规定 `copyExternalImageToTexture` 的目标纹理必须带 CopyDst **和**
                    // RenderAttachment（实现内部可能用 render pass 完成这次拷贝），所以即使不生成 mip
                    // 也要加上；WebGL2 忽略 usage，不受影响。
                    extraUsage: TextureUsage.RenderAttachment,
                    upload: (texture) => {
                        device.queue.copyExternalImageToTexture(bitmap, { texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } }, { width, height, depthOrArrayLayers: 1 }, flipY);
                    },
                });
            }
            // 1 / 2 通道格式没法从 ImageBitmap 直接拷（DOM 来源的 texSubImage2D 只接受 4 通道组合），
            // 退回一次 canvas 重排；解码本身仍然是异步完成的。
            const decoded = decodeSource(bitmap, width, height, flipY, format, info);
            return GfxTexture.build(device, {
                label,
                format,
                width,
                height,
                mipmaps,
                magFilter: desc.magFilter,
                minFilter: desc.minFilter,
                wrapS: desc.wrapS ?? desc.wrap ?? 'clamp-to-edge',
                wrapT: desc.wrapT ?? desc.wrap ?? 'clamp-to-edge',
                upload: (texture) => {
                    device.queue.writeTexture({ texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } }, decoded.data, { offset: 0, bytesPerRow: width * info.bytesPerPixel, rowsPerImage: height }, { width, height, depthOrArrayLayers: 1 });
                },
            });
        }
        finally {
            // ImageBitmap 占的是图像解码器的内存，不 close 的话只能等 GC —— 而它并不小。
            bitmap.close();
        }
    }
    /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
    static solid(device, color) {
        return GfxTexture.create(device, {
            label: 'solid',
            data: new Uint8Array([
                Math.round(color[0] * 255),
                Math.round(color[1] * 255),
                Math.round(color[2] * 255),
                Math.round(color[3] * 255),
            ]),
            width: 1,
            height: 1,
            mipmaps: false,
        });
    }
    /**
     * 两条创建路径的公共部分：分配纹理 → 上传第 0 级 → 让后端生成 mip → 建采样器。
     *
     * 中途任何一步抛错都会把已经创建的纹理销毁掉，不让半成品留在设备上。
     */
    static build(device, init) {
        const mipLevelCount = init.mipmaps ? fullMipLevelCount({ width: init.width, height: init.height }) : 1;
        const useRenderAttachment = mipLevelCount > 1;
        const extraUsage = init.extraUsage ?? TextureUsage.None;
        const descriptor = {
            label: init.label,
            size: { width: init.width, height: init.height },
            format: init.format,
            mipLevelCount,
            // usage 的三点说明：
            // 1. `defaultTextureUsage()` 已经给了 `TextureBinding | CopyDst`，上传就靠它；
            // 2. **额外加 `CopySrc`**：WebGPU 上不带这个标志的纹理不能作为 `copyTextureToBuffer` 的源，
            //    而且失败方式很隐蔽 —— 整条 command buffer 判为 invalid，读回来全是 0。gfx 创建的纹理
            //    应当能直接读回（截图/自检/调试都要用），所以在便捷层默认带上；
            // 3. WebGPU 的 mip 生成走 render pass、`copyExternalImageToTexture` 也要求目标是
            //    render attachment，两者都会通过 `extraUsage` 或 `useRenderAttachment` 加上
            //    `RenderAttachment`；WebGL2 完全忽略 usage。
            usage: defaultTextureUsage(0) | TextureUsage.CopySrc | extraUsage |
                (useRenderAttachment ? TextureUsage.RenderAttachment : 0),
        };
        const texture = device.createTexture(descriptor);
        let view;
        let sampler;
        try {
            init.upload(texture);
            if (useRenderAttachment)
                generateTextureMipmaps(texture, init.label, device.backend);
            view = texture.createView();
            sampler = device.createSampler({
                label: `${init.label}:sampler`,
                addressModeU: init.wrapS,
                addressModeV: init.wrapT,
                magFilter: init.magFilter ?? 'linear',
                minFilter: init.minFilter ?? 'linear',
                mipmapFilter: useRenderAttachment ? 'linear' : 'nearest',
            });
        }
        catch (error) {
            texture.destroy();
            throw error;
        }
        return new GfxTexture({
            label: init.label,
            texture,
            view,
            sampler,
            width: init.width,
            height: init.height,
            format: init.format,
            mipLevelCount,
        });
    }
    get disposed() {
        return this._disposed;
    }
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        this.sampler.dispose();
        this.texture.destroy();
    }
}
/**
 * 让后端生成 mip 链；后端没实现时给出明确错误而不是把半成品返回给调用方。
 *
 * 后端也可能因为「格式/级别组合做不到」而抛错（例如 WebGPU 上格式不可渲染或不可过滤），
 * 那些错误本身就是 `[gpu-device-api]` 开头的，直接向上抛。
 */
function generateTextureMipmaps(texture, label, backend) {
    const generate = texture.generateMipmaps;
    if (typeof generate !== 'function') {
        throw new ValidationError(`[gpu-device-api] Texture "${label}": the ${backend} backend does not implement ` +
            'Texture.generateMipmaps, so the gfx layer cannot build the mip chain on the GPU. ' +
            'Create the texture with { mipmaps: false } instead.');
    }
    generate.call(texture);
}
export function isImageSource(value) {
    if (!value || typeof value !== 'object')
        return false;
    const name = value.constructor?.name ?? '';
    return (name === 'ImageBitmap' ||
        name === 'HTMLImageElement' ||
        name === 'HTMLCanvasElement' ||
        name === 'OffscreenCanvas' ||
        name === 'ImageData' ||
        name === 'VideoFrame' ||
        name === 'HTMLVideoElement');
}
/** 把两种输入统一成目标格式的紧凑像素（原始像素按原样透传，图像来源先光栅化）。 */
function decodeSource(source, width, height, flipY, format, info) {
    if (!isImageSource(source)) {
        const view = source;
        const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        const w = width ?? 0;
        const h = height ?? 0;
        if (w <= 0 || h <= 0) {
            throw new ValidationError('[gpu-device-api] Creating a texture from raw pixels requires explicit width and height ' +
                '(the byte length alone cannot tell them apart).');
        }
        const expected = w * h * info.bytesPerPixel;
        if (bytes.byteLength < expected) {
            throw new ValidationError(`[gpu-device-api] Texture data has ${bytes.byteLength} bytes, but a ${w}x${h} ${format} ` +
                `texture needs ${expected} bytes (${info.bytesPerPixel} per pixel).`);
        }
        const pixels = bytes.subarray(0, expected);
        return { data: flipY ? flipRows(pixels, w, h, info.bytesPerPixel) : pixels, width: w, height: h };
    }
    // ImageData 不是 CanvasImageSource，`drawImage()` 不接受它；直接读它的像素即可，
    // 顺带省掉一次 canvas 往返。
    if (isImageData(source)) {
        const w = width ?? source.width;
        const h = height ?? source.height;
        if (w <= 0 || h <= 0) {
            throw new ValidationError('[gpu-device-api] The given ImageData has no size; pass width/height explicitly.');
        }
        const rgba = new Uint8Array(source.data.buffer, source.data.byteOffset, source.data.byteLength);
        const packed = packFromRgba(rgba, w, h, format, info);
        return { data: flipY ? flipRows(packed, w, h, info.bytesPerPixel) : packed, width: w, height: h };
    }
    if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined') {
        throw new ValidationError('[gpu-device-api] There is no canvas in this environment, so the image source cannot be ' +
            'decoded; pass raw pixels (with width/height) or use GfxTexture.fromImage().');
    }
    const image = source;
    const w = width ?? image.naturalWidth ?? image.videoWidth ?? image.width ?? 0;
    const h = height ??
        source.naturalHeight ??
        source.videoHeight ??
        source.height ??
        0;
    if (w <= 0 || h <= 0) {
        throw new ValidationError('[gpu-device-api] The image source has no size yet (the image probably has not finished ' +
            'loading). Create the texture after the load event, or use GfxTexture.fromImage().');
    }
    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext('2d');
    if (!context) {
        throw new ValidationError('[gpu-device-api] Could not acquire a 2D context to decode the image.');
    }
    context.drawImage(source, 0, 0, w, h);
    const imageData = context.getImageData(0, 0, w, h);
    // `getImageData()` 给的是 sRGB 编码的字节；写进 `-srgb` 纹理正好是硬件期望的输入，
    // 写进非 srgb 纹理则原样保留（不做任何隐式转换，两块后端的语义一致）。
    const rgba = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength);
    const packed = packFromRgba(rgba, w, h, format, info);
    return { data: flipY ? flipRows(packed, w, h, info.bytesPerPixel) : packed, width: w, height: h };
}
/** 该对象是否是 `ImageData`（node 环境里没有这个全局构造器，所以按名字判断）。 */
function isImageData(value) {
    return value.constructor?.name === 'ImageData';
}
/**
 * 把 RGBA8 重新打包成目标格式。
 *
 * `bgra8unorm` 需要交换 R/B 两个通道：它指的是**存储顺序**，采样出来的 `vec4` 仍然是
 * `(r, g, b, a)`，所以主机数据必须按 B、G、R、A 排列。
 */
function packFromRgba(rgba, width, height, format, info) {
    const pixelCount = width * height;
    if (rgba.byteLength < pixelCount * 4) {
        throw new ValidationError(`[gpu-device-api] Expected at least ${pixelCount * 4} RGBA bytes for a ${width}x${height} image, ` +
            `got ${rgba.byteLength}.`);
    }
    if (info.channels === 4 && format !== 'bgra8unorm' && format !== 'bgra8unorm-srgb') {
        return rgba.subarray(0, pixelCount * 4);
    }
    const out = new Uint8Array(pixelCount * info.bytesPerPixel);
    if (format === 'r8unorm') {
        for (let index = 0; index < pixelCount; index++)
            out[index] = rgba[index * 4];
        return out;
    }
    if (format === 'rg8unorm') {
        for (let index = 0; index < pixelCount; index++) {
            out[index * 2] = rgba[index * 4];
            out[index * 2 + 1] = rgba[index * 4 + 1];
        }
        return out;
    }
    // bgra8unorm / bgra8unorm-srgb
    for (let index = 0; index < pixelCount; index++) {
        const source = index * 4;
        out[source] = rgba[source + 2];
        out[source + 1] = rgba[source + 1];
        out[source + 2] = rgba[source];
        out[source + 3] = rgba[source + 3];
    }
    return out;
}
/** 逐行上下翻转（图像坐标 → GL 纹理坐标）。 */
function flipRows(data, width, height, bytesPerPixel) {
    const rowBytes = width * bytesPerPixel;
    const out = new Uint8Array(data.byteLength);
    for (let y = 0; y < height; y++) {
        const source = y * rowBytes;
        const target = (height - 1 - y) * rowBytes;
        out.set(data.subarray(source, source + rowBytes), target);
    }
    return out;
}
/** 用 `createImageBitmap` 解码任意来源；URL 会先 fetch 成 Blob。 */
async function loadImageBitmap(source, options) {
    if (typeof createImageBitmap !== 'function') {
        throw new ValidationError('[gpu-device-api] GfxTexture.fromImage requires createImageBitmap, which this environment ' +
            'does not provide; use GfxTexture.create() with raw pixels or an ImageData source instead.');
    }
    const resolved = {
        colorSpaceConversion: 'none',
        premultiplyAlpha: 'none',
        ...options,
    };
    if (typeof source === 'string') {
        const response = await fetch(source);
        if (!response.ok) {
            throw new ValidationError(`[gpu-device-api] GfxTexture.fromImage: fetching "${source}" failed with HTTP ${response.status}.`);
        }
        return await createImageBitmap(await response.blob(), resolved);
    }
    return await createImageBitmap(source, resolved);
}
/**
 * 2×2 盒式滤波生成完整 mip 链。奇数尺寸时对边缘取样做夹紧处理，避免越界。
 * 返回的数组第 0 项就是原始数据。
 *
 * **这是旧的 CPU 实现**，gfx 便捷层已经不再使用它（见文件头的说明）。保留导出有两个原因：
 * 一是需要「不依赖后端能力」的兜底路径时可以直接用；二是它是
 * `examples/core-texture-mipmap.ts` 里用来和新路径做像素对比的基线。
 *
 * 注意它对每个通道独立求平均，**不做任何颜色空间转换** —— 用它处理 `-srgb` 数据会偏暗，
 * 这正是不再默认使用它的原因之一。
 */
export function buildMipChain(data, width, height) {
    const levels = [{ data, width, height }];
    let source = data;
    let sourceWidth = width;
    let sourceHeight = height;
    while (sourceWidth > 1 || sourceHeight > 1) {
        const targetWidth = Math.max(1, sourceWidth >> 1);
        const targetHeight = Math.max(1, sourceHeight >> 1);
        const target = new Uint8Array(targetWidth * targetHeight * 4);
        for (let y = 0; y < targetHeight; y++) {
            const y0 = Math.min(y * 2, sourceHeight - 1);
            const y1 = Math.min(y * 2 + 1, sourceHeight - 1);
            for (let x = 0; x < targetWidth; x++) {
                const x0 = Math.min(x * 2, sourceWidth - 1);
                const x1 = Math.min(x * 2 + 1, sourceWidth - 1);
                const i00 = (y0 * sourceWidth + x0) * 4;
                const i10 = (y0 * sourceWidth + x1) * 4;
                const i01 = (y1 * sourceWidth + x0) * 4;
                const i11 = (y1 * sourceWidth + x1) * 4;
                const index = (y * targetWidth + x) * 4;
                for (let channel = 0; channel < 4; channel++) {
                    target[index + channel] =
                        (source[i00 + channel] + source[i10 + channel] + source[i01 + channel] + source[i11 + channel]) >> 2;
                }
            }
        }
        levels.push({ data: target, width: targetWidth, height: targetHeight });
        source = target;
        sourceWidth = targetWidth;
        sourceHeight = targetHeight;
    }
    return levels;
}
/** 供外部复用：把尺寸描述归一化（历史上从本模块导出，保留以兼容既有调用方）。 */
export { resolveTextureSize };
//# sourceMappingURL=Texture.js.map