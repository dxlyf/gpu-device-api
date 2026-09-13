/**
 * core 的 `TextureFormat` → WebGPU 的 `GPUTextureFormat` 映射，以及格式能力表。
 *
 * 映射本身是显式的表驱动，但**真正有价值的是能力表**：core 只描述「有哪些格式」，
 * 而 WebGPU 里每个格式能做什么是有限制的，且不少限制是「core 有、WebGPU 没有」的组合：
 *
 * - `depth24plus` / `depth24plus-stencil8` 只能做 depth/stencil attachment，**不能采样**
 *   （没有确定的深度精度就无法定义采样结果）；`stencil8` 只能做 stencil attachment。
 * - `depth24plus` 系列在 WebGPU 里**不是 copy-compatible**（没有定义好的内存布局），
 *   因此不能用于 `CopySrc` / `CopyDst`；需要回读深度请用 `depth32float`。
 * - `rgba8snorm`、`rg8snorm`、`r8snorm`、`rgb9e5ufloat` 不可作为 render attachment。
 * - `rg11b10ufloat` 只有开启 `rg11b10ufloat-renderable` 时才能作为 render attachment。
 * - `bgra8unorm` 只有开启 `bgra8unorm-storage` 时才能作为 storage texture。
 * - `rgba32float` / `rg32float` / `r32float` / `depth32float` 的过滤采样需要
 *   `float32-filterable`。
 * - 多重采样的 texture 只能做 render attachment，且不能有 mip、只能是 2d、不能有
 *   `TextureBinding` / `StorageBinding`、不能被拷贝。
 *
 * 这些判断以「进入 WebGPU 之前就抛 {@link ValidationError}」的方式集中在这里，
 * 而不是放任 WebGPU 抛一句难以定位的 validation error。
 */
import type { DeviceFeatures } from '../../core/Device.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { TextureUsage } from '../../core/enums/TextureUsage.js';
import type { TextureAspect } from '../../core/resources/TextureView.js';
/** 格式的分类信息，用于推导 WebGPU 的 sampleType / 可过滤性等。 */
export type TextureFormatKind = 'unorm' | 'snorm' | 'uint' | 'sint' | 'float' | 'depth' | 'stencil';
/** 单个格式的能力描述。 */
export interface TextureFormatCapabilities {
    readonly gpuFormat: GPUTextureFormat;
    readonly kind: TextureFormatKind;
    /** 每 texel（或 texel block）占用的字节数；`depth24plus` 为「至少 4」。 */
    readonly bytesPerTexel: number;
    /** 可作为 color render attachment。 */
    readonly renderable: boolean;
    /** 可作为 depth/stencil attachment。 */
    readonly depthStencilAttachment: boolean;
    /** 可作为 `TextureBinding` 采样（不含多重采样）。 */
    readonly sampleable: boolean;
    /** 可作为 storage texture。 */
    readonly storage: boolean;
    /** 可作为拷贝源/目标（copy-compatible）。 */
    readonly copyable: boolean;
    /** 普通（非 feature 增强）情况下是否可线性过滤。 */
    readonly filterable: boolean;
    /** 需要额外 feature 才能作为 render attachment 时给出 feature 名。 */
    readonly renderFeature?: string;
    /** 需要额外 feature 才能作为 storage texture 时给出 feature 名。 */
    readonly storageFeature?: string;
    /** 需要额外 feature 才能线性过滤时给出 feature 名。 */
    readonly filterFeature?: string;
    /** shader 里采样得到的标量类型。 */
    readonly sampleScalar: 'float' | 'sint' | 'uint' | 'depth';
}
/** 全部 core 格式的能力表。 */
export declare const TEXTURE_FORMAT_CAPABILITIES: Readonly<Record<TextureFormat, TextureFormatCapabilities>>;
/** 取出格式能力；未知格式（运行时的非法值）会抛错。 */
export declare function textureFormatCapabilities(format: TextureFormat): TextureFormatCapabilities;
/** `TextureFormat` → `GPUTextureFormat`。 */
export declare function toGPUTextureFormat(format: TextureFormat): GPUTextureFormat;
/** `GPUTextureFormat` → `TextureFormat`；压缩格式等 core 未声明的格式会抛错。 */
export declare function fromGPUTextureFormat(format: string): TextureFormat;
/** 是否含有 depth aspect。 */
export declare function hasDepthAspect(format: TextureFormat): boolean;
/** 是否含有 stencil aspect。 */
export declare function hasStencilAspect(format: TextureFormat): boolean;
/** 是否为 depth 或 stencil 格式。 */
export declare function isDepthOrStencilFormat(format: TextureFormat): boolean;
/** 线性过滤是否需要额外的 feature。 */
export declare function filterFeatureFor(format: TextureFormat): string | undefined;
/** 在给定设备能力下是否可被线性过滤。 */
export declare function isFilterableFormat(format: TextureFormat, features?: DeviceFeatures): boolean;
/** 在给定设备能力下是否可作为 render attachment（color 或 depth/stencil）。 */
export declare function isRenderableFormat(format: TextureFormat, features?: DeviceFeatures): boolean;
/** 在给定设备能力下是否可作为 storage texture。 */
export declare function isStorageTextureFormat(format: TextureFormat, features?: DeviceFeatures): boolean;
/** 断言格式可作为 render attachment（color 或 depth/stencil）。 */
export declare function assertRenderableFormat(format: TextureFormat, features: DeviceFeatures | undefined, context: string): void;
/** 断言格式可以作为 `TextureBinding` 被采样。 */
export declare function assertSampleableFormat(format: TextureFormat, context: string, multisampled?: boolean): void;
/** 断言格式可以作为 storage texture。 */
export declare function assertStorageTextureFormat(format: TextureFormat, features: DeviceFeatures | undefined, context: string): void;
/** 断言格式可以被 copy（`CopySrc` / `CopyDst`）。 */
export declare function assertCopyableFormat(format: TextureFormat, context: string): void;
/** 断言 aspect 与格式匹配。 */
export declare function assertTextureAspectForFormat(format: TextureFormat, aspect: TextureAspect, context: string): void;
/** 从格式推导 WebGPU texture binding 的默认 sampleType。 */
export declare function defaultTextureSampleType(format: TextureFormat): GPUTextureSampleType;
/** 校验 texture descriptor 里「usage 与格式/sampleCount 是否自洽」。 */
export declare function assertTextureUsageSupported(format: TextureFormat, usage: TextureUsage, options: {
    sampleCount?: number;
    mipLevelCount?: number;
    dimension?: '1d' | '2d' | '3d';
    features?: DeviceFeatures;
}, context: string): void;
//# sourceMappingURL=wgpuFormatMap.d.ts.map