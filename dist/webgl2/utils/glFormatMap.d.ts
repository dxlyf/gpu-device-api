/**
 * TextureFormat 到 WebGL2 三元组（internalFormat / format / type）的映射。
 *
 * WebGL2 上传纹理时必须给出三个值：内部格式决定**怎么存**，format+type 决定**主机数据怎么解析**。
 * 二者必须匹配，否则报 `INVALID_OPERATION` 而且错误信息极其难懂 —— 所以这里把三者绑在一张表里，
 * 由 {@link glFormat} 统一取出，并在 `writeTexture` 时校验传入的 TypedArray 类型。
 *
 * 明确不支持的格式会抛 {@link ValidationError} 并说明替代方案，不做静默降级。
 */
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
/** 采样这类纹理时 GLSL 里应该声明的 sampler 类型。 */
export type TextureSampleType = 'float' | 'sint' | 'uint' | 'depth';
export interface GlTextureFormatInfo {
    /** `texStorage2D` / `texStorage3D` 用的内部格式。 */
    readonly internalFormat: number;
    /** `texSubImage2D` 用的主机数据格式。 */
    readonly format: number;
    /** `texSubImage2D` 用的主机数据类型。 */
    readonly type: number;
    /** 每像素字节数。 */
    readonly bytesPerPixel: number;
    /** 可以作为颜色或深度附件。 */
    readonly attachment: boolean;
    readonly depth: boolean;
    readonly stencil: boolean;
    /** 是否是整数纹理（采样时必须用 `isampler2D` / `usampler2D`）。 */
    readonly sampleType: TextureSampleType;
    /** 上传时允许的 TypedArray 类型名字；`null` 表示该格式不支持从主机上传。 */
    readonly uploadType: string | null;
}
export declare const GL_TEXTURE_FORMATS: Readonly<Record<string, GlTextureFormatInfo>>;
/** 取出某个格式在 WebGL2 下的映射；不支持时抛出带替代方案的错误。 */
export declare function glFormat(format: TextureFormat): GlTextureFormatInfo;
/** 该格式能否用作 WebGL2 的颜色/深度附件。 */
export declare function glFormatIsAttachment(format: TextureFormat): boolean;
/** 采样器类型是否与纹理格式匹配（整数纹理必须配 `isampler2D` / `usampler2D`）。 */
export declare function sampleTypeMatchesFormat(format: TextureFormat, sampleType: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint'): boolean;
/**
 * 校验主机端像素数据的类型与格式是否匹配，并返回该数据的 TypedArray 类型名。
 * 例如 `rgba16float` 需要 `Uint16Array`（half float 位模式），传 `Float32Array` 会在这里被拦下。
 */
export declare function assertUploadDataType(format: TextureFormat, data: ArrayBufferView): void;
//# sourceMappingURL=glFormatMap.d.ts.map