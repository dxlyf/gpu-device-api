/**
 * TextureFormat 到 WebGL2 三元组（internalFormat / format / type）的映射。
 *
 * WebGL2 上传纹理时必须给出三个值：内部格式决定**怎么存**，format+type 决定**主机数据怎么解析**。
 * 二者必须匹配，否则报 `INVALID_OPERATION` 而且错误信息极其难懂 —— 所以这里把三者绑在一张表里，
 * 由 {@link glFormat} 统一取出，并在 `writeTexture` 时校验传入的 TypedArray 类型。
 *
 * 明确不支持的格式会抛 {@link ValidationError} 并说明替代方案，不做静默降级。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
/* GL 常量（避免依赖 WebGL2RenderingContext 实例才能取到值）。 */
const GL_RED = 0x1903;
const GL_RG = 0x8227;
const GL_RGB = 0x1907;
const GL_RGBA = 0x1908;
const GL_RED_INTEGER = 0x8d94;
const GL_RG_INTEGER = 0x8228;
const GL_RGBA_INTEGER = 0x8d99;
const GL_DEPTH_COMPONENT = 0x1902;
const GL_DEPTH_STENCIL = 0x84f9;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_BYTE = 0x1400;
const GL_UNSIGNED_SHORT = 0x1403;
const GL_SHORT = 0x1402;
const GL_UNSIGNED_INT = 0x1405;
const GL_INT = 0x1404;
const GL_FLOAT = 0x1406;
const GL_HALF_FLOAT = 0x140b;
const GL_UNSIGNED_INT_2_10_10_10_REV = 0x8368;
const GL_UNSIGNED_INT_24_8 = 0x84fa;
const GL_R8 = 0x8229;
const GL_R8_SNORM = 0x8f94;
const GL_R8UI = 0x8232;
const GL_R8I = 0x8231;
const GL_R16UI = 0x8234;
const GL_R16I = 0x8233;
const GL_R16F = 0x822d;
const GL_RG8 = 0x822b;
const GL_RG8_SNORM = 0x8f95;
const GL_RG8UI = 0x8238;
const GL_RG8I = 0x8237;
const GL_R32UI = 0x8236;
const GL_R32I = 0x8235;
const GL_R32F = 0x822e;
const GL_RG16UI = 0x823a;
const GL_RG16I = 0x8239;
const GL_RG16F = 0x822f;
const GL_RGBA8 = 0x8058;
const GL_SRGB8_ALPHA8 = 0x8c43;
const GL_RGBA8_SNORM = 0x8f97;
const GL_RGBA8UI = 0x8d7c;
const GL_RGBA8I = 0x8d7e;
const GL_RGB10_A2 = 0x8059;
const GL_R11F_G11F_B10F = 0x8c3a;
const GL_RG32UI = 0x823c;
const GL_RG32I = 0x823b;
const GL_RG32F = 0x8230;
const GL_RGBA16UI = 0x8d76;
const GL_RGBA16I = 0x8d78;
const GL_RGBA16F = 0x881a;
const GL_RGBA32UI = 0x8d70;
const GL_RGBA32I = 0x8d82;
const GL_RGBA32F = 0x8814;
const GL_DEPTH_COMPONENT16 = 0x81a5;
const GL_DEPTH_COMPONENT24 = 0x81a6;
const GL_DEPTH24_STENCIL8 = 0x88f0;
const GL_DEPTH_COMPONENT32F = 0x8cac;
function entry(internalFormat, format, type, bytesPerPixel, options = {}) {
    return {
        internalFormat,
        format,
        type,
        bytesPerPixel,
        attachment: options.attachment ?? true,
        depth: options.depth ?? false,
        stencil: options.stencil ?? false,
        sampleType: options.sampleType ?? 'float',
        uploadType: options.uploadType === undefined ? 'Uint8Array' : options.uploadType,
    };
}
export const GL_TEXTURE_FORMATS = Object.freeze({
    r8unorm: entry(GL_R8, GL_RED, GL_UNSIGNED_BYTE, 1, { uploadType: 'Uint8Array' }),
    r8snorm: entry(GL_R8_SNORM, GL_RED, GL_BYTE, 1, { attachment: false, uploadType: 'Int8Array' }),
    r8uint: entry(GL_R8UI, GL_RED_INTEGER, GL_UNSIGNED_BYTE, 1, { sampleType: 'uint', uploadType: 'Uint8Array' }),
    r8sint: entry(GL_R8I, GL_RED_INTEGER, GL_BYTE, 1, { sampleType: 'sint', uploadType: 'Int8Array' }),
    r16uint: entry(GL_R16UI, GL_RED_INTEGER, GL_UNSIGNED_SHORT, 2, { sampleType: 'uint', uploadType: 'Uint16Array' }),
    r16sint: entry(GL_R16I, GL_RED_INTEGER, GL_SHORT, 2, { sampleType: 'sint', uploadType: 'Int16Array' }),
    r16float: entry(GL_R16F, GL_RED, GL_HALF_FLOAT, 2, { uploadType: 'Uint16Array' }),
    rg8unorm: entry(GL_RG8, GL_RG, GL_UNSIGNED_BYTE, 2, { uploadType: 'Uint8Array' }),
    rg8snorm: entry(GL_RG8_SNORM, GL_RG, GL_BYTE, 2, { attachment: false, uploadType: 'Int8Array' }),
    rg8uint: entry(GL_RG8UI, GL_RG_INTEGER, GL_UNSIGNED_BYTE, 2, { sampleType: 'uint', uploadType: 'Uint8Array' }),
    rg8sint: entry(GL_RG8I, GL_RG_INTEGER, GL_BYTE, 2, { sampleType: 'sint', uploadType: 'Int8Array' }),
    r32uint: entry(GL_R32UI, GL_RED_INTEGER, GL_UNSIGNED_INT, 4, { sampleType: 'uint', uploadType: 'Uint32Array' }),
    r32sint: entry(GL_R32I, GL_RED_INTEGER, GL_INT, 4, { sampleType: 'sint', uploadType: 'Int32Array' }),
    r32float: entry(GL_R32F, GL_RED, GL_FLOAT, 4, { attachment: false, uploadType: 'Float32Array' }),
    rg16uint: entry(GL_RG16UI, GL_RG_INTEGER, GL_UNSIGNED_SHORT, 4, { sampleType: 'uint', uploadType: 'Uint16Array' }),
    rg16sint: entry(GL_RG16I, GL_RG_INTEGER, GL_SHORT, 4, { sampleType: 'sint', uploadType: 'Int16Array' }),
    rg16float: entry(GL_RG16F, GL_RG, GL_HALF_FLOAT, 4, { uploadType: 'Uint16Array' }),
    rgba8unorm: entry(GL_RGBA8, GL_RGBA, GL_UNSIGNED_BYTE, 4, { uploadType: 'Uint8Array' }),
    'rgba8unorm-srgb': entry(GL_SRGB8_ALPHA8, GL_RGBA, GL_UNSIGNED_BYTE, 4, { uploadType: 'Uint8Array' }),
    rgba8snorm: entry(GL_RGBA8_SNORM, GL_RGBA, GL_BYTE, 4, { attachment: false, uploadType: 'Int8Array' }),
    rgba8uint: entry(GL_RGBA8UI, GL_RGBA_INTEGER, GL_UNSIGNED_BYTE, 4, { sampleType: 'uint', uploadType: 'Uint8Array' }),
    rgba8sint: entry(GL_RGBA8I, GL_RGBA_INTEGER, GL_BYTE, 4, { sampleType: 'sint', uploadType: 'Int8Array' }),
    rgb10a2unorm: entry(GL_RGB10_A2, GL_RGBA, GL_UNSIGNED_INT_2_10_10_10_REV, 4, { uploadType: 'Uint32Array' }),
    rg11b10ufloat: entry(GL_R11F_G11F_B10F, GL_RGB, GL_UNSIGNED_INT, 4, { attachment: false, uploadType: null }),
    rg32uint: entry(GL_RG32UI, GL_RG_INTEGER, GL_UNSIGNED_INT, 8, { sampleType: 'uint', uploadType: 'Uint32Array' }),
    rg32sint: entry(GL_RG32I, GL_RG_INTEGER, GL_INT, 8, { sampleType: 'sint', uploadType: 'Int32Array' }),
    rg32float: entry(GL_RG32F, GL_RG, GL_FLOAT, 8, { attachment: false, uploadType: 'Float32Array' }),
    rgba16uint: entry(GL_RGBA16UI, GL_RGBA_INTEGER, GL_UNSIGNED_SHORT, 8, { sampleType: 'uint', uploadType: 'Uint16Array' }),
    rgba16sint: entry(GL_RGBA16I, GL_RGBA_INTEGER, GL_SHORT, 8, { sampleType: 'sint', uploadType: 'Int16Array' }),
    rgba16float: entry(GL_RGBA16F, GL_RGBA, GL_HALF_FLOAT, 8, { uploadType: 'Uint16Array' }),
    rgba32uint: entry(GL_RGBA32UI, GL_RGBA_INTEGER, GL_UNSIGNED_INT, 16, { sampleType: 'uint', uploadType: 'Uint32Array' }),
    rgba32sint: entry(GL_RGBA32I, GL_RGBA_INTEGER, GL_INT, 16, { sampleType: 'sint', uploadType: 'Int32Array' }),
    rgba32float: entry(GL_RGBA32F, GL_RGBA, GL_FLOAT, 16, { uploadType: 'Float32Array' }),
    depth16unorm: entry(GL_DEPTH_COMPONENT16, GL_DEPTH_COMPONENT, GL_UNSIGNED_SHORT, 2, {
        depth: true, sampleType: 'depth', uploadType: 'Uint16Array',
    }),
    depth24plus: entry(GL_DEPTH_COMPONENT24, GL_DEPTH_COMPONENT, GL_UNSIGNED_INT, 4, {
        depth: true, sampleType: 'depth', uploadType: 'Uint32Array',
    }),
    'depth24plus-stencil8': entry(GL_DEPTH24_STENCIL8, GL_DEPTH_STENCIL, GL_UNSIGNED_INT_24_8, 4, {
        depth: true, stencil: true, sampleType: 'depth', uploadType: null,
    }),
    depth32float: entry(GL_DEPTH_COMPONENT32F, GL_DEPTH_COMPONENT, GL_FLOAT, 4, {
        depth: true, sampleType: 'depth', uploadType: 'Float32Array',
    }),
});
/** WebGL2 明确无法表达的格式，给出替代建议。 */
const UNSUPPORTED = Object.freeze({
    bgra8unorm: 'WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。',
    'bgra8unorm-srgb': 'WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。',
    rgb9e5ufloat: 'WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。',
    stencil8: 'WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。',
});
/** 取出某个格式在 WebGL2 下的映射；不支持时抛出带替代方案的错误。 */
export function glFormat(format) {
    const reason = UNSUPPORTED[format];
    if (reason) {
        throw new ValidationError(`[gpu-device-api] 纹理格式「${format}」在 WebGL2 后端不可用：${reason}`);
    }
    const info = GL_TEXTURE_FORMATS[format];
    if (!info) {
        throw new ValidationError(`[gpu-device-api] WebGL2 后端不认识纹理格式「${format}」。`);
    }
    return info;
}
/** 该格式能否用作 WebGL2 的颜色/深度附件。 */
export function glFormatIsAttachment(format) {
    return glFormat(format).attachment;
}
/** 采样器类型是否与纹理格式匹配（整数纹理必须配 `isampler2D` / `usampler2D`）。 */
export function sampleTypeMatchesFormat(format, sampleType) {
    const info = glFormat(format);
    if (info.sampleType === 'depth')
        return sampleType === 'depth' || sampleType === 'unfilterable-float';
    if (info.sampleType === 'uint')
        return sampleType === 'uint';
    if (info.sampleType === 'sint')
        return sampleType === 'sint';
    return sampleType === 'float' || sampleType === 'unfilterable-float';
}
/**
 * 校验主机端像素数据的类型与格式是否匹配，并返回该数据的 TypedArray 类型名。
 * 例如 `rgba16float` 需要 `Uint16Array`（half float 位模式），传 `Float32Array` 会在这里被拦下。
 */
export function assertUploadDataType(format, data) {
    const info = glFormat(format);
    if (info.uploadType === null) {
        throw new ValidationError(`[gpu-device-api] 纹理格式「${format}」不支持从主机内存上传。`);
    }
    const actual = data.constructor.name;
    if (actual !== info.uploadType) {
        const hint = format === 'rgba16float' || format === 'r16float' || format === 'rg16float'
            ? '（该格式是 half float，需要先把 Float32 转成 Uint16 位模式，可用 Float32Array 与 Uint16Array 共享同一段内存来做转换。）'
            : '';
        throw new ValidationError(`[gpu-device-api] 纹理格式「${format}」要求主机数据是 ${info.uploadType}，实际传入 ${actual}。${hint}`);
    }
}
//# sourceMappingURL=glFormatMap.js.map