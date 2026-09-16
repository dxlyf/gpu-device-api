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
import { TextureUsage as TextureUsageFlags } from '../../core/enums/TextureUsage.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { isDepthStencilFormat } from '../../core/enums/TextureFormat.js';
/** core 的 `TextureFormat` → `GPUTextureFormat` 的显式映射表。 */
const GPU_FORMATS = Object.freeze({
    // 8 位单通道
    r8unorm: 'r8unorm',
    r8snorm: 'r8snorm',
    r8uint: 'r8uint',
    r8sint: 'r8sint',
    // 16 位单通道
    r16uint: 'r16uint',
    r16sint: 'r16sint',
    r16float: 'r16float',
    // 8 位双通道
    rg8unorm: 'rg8unorm',
    rg8snorm: 'rg8snorm',
    rg8uint: 'rg8uint',
    rg8sint: 'rg8sint',
    // 32 位单通道
    r32uint: 'r32uint',
    r32sint: 'r32sint',
    r32float: 'r32float',
    // 16 位双通道
    rg16uint: 'rg16uint',
    rg16sint: 'rg16sint',
    rg16float: 'rg16float',
    // 8 位四通道
    rgba8unorm: 'rgba8unorm',
    'rgba8unorm-srgb': 'rgba8unorm-srgb',
    rgba8snorm: 'rgba8snorm',
    rgba8uint: 'rgba8uint',
    rgba8sint: 'rgba8sint',
    bgra8unorm: 'bgra8unorm',
    'bgra8unorm-srgb': 'bgra8unorm-srgb',
    // 打包格式
    rgb9e5ufloat: 'rgb9e5ufloat',
    rgb10a2unorm: 'rgb10a2unorm',
    rg11b10ufloat: 'rg11b10ufloat',
    // 32 位双通道
    rg32uint: 'rg32uint',
    rg32sint: 'rg32sint',
    rg32float: 'rg32float',
    // 16 位四通道
    rgba16uint: 'rgba16uint',
    rgba16sint: 'rgba16sint',
    rgba16float: 'rgba16float',
    // 32 位四通道
    rgba32uint: 'rgba32uint',
    rgba32sint: 'rgba32sint',
    rgba32float: 'rgba32float',
    // depth / stencil
    depth16unorm: 'depth16unorm',
    depth24plus: 'depth24plus',
    'depth24plus-stencil8': 'depth24plus-stencil8',
    depth32float: 'depth32float',
    stencil8: 'stencil8',
});
function caps(format, kind, bytesPerTexel, options = {}) {
    const sampleScalar = kind === 'depth' || kind === 'stencil' ? 'depth' : kind === 'uint' ? 'uint' : kind === 'sint' ? 'sint' : 'float';
    return {
        gpuFormat: GPU_FORMATS[format],
        kind,
        bytesPerTexel,
        renderable: options.renderable ?? false,
        depthStencilAttachment: options.depthStencilAttachment ?? false,
        sampleable: options.sampleable ?? true,
        storage: options.storage ?? false,
        copyable: options.copyable ?? true,
        filterable: options.filterable ?? false,
        renderFeature: options.renderFeature,
        storageFeature: options.storageFeature,
        filterFeature: options.filterFeature,
        sampleScalar,
    };
}
/** 全部 core 格式的能力表。 */
export const TEXTURE_FORMAT_CAPABILITIES = Object.freeze({
    r8unorm: caps('r8unorm', 'unorm', 1, { renderable: true, filterable: true }),
    r8snorm: caps('r8snorm', 'snorm', 1, { filterable: false }),
    r8uint: caps('r8uint', 'uint', 1, { renderable: true }),
    r8sint: caps('r8sint', 'sint', 1, { renderable: true }),
    r16uint: caps('r16uint', 'uint', 2, { renderable: true }),
    r16sint: caps('r16sint', 'sint', 2, { renderable: true }),
    r16float: caps('r16float', 'float', 2, { renderable: true, filterable: true }),
    rg8unorm: caps('rg8unorm', 'unorm', 2, { renderable: true, filterable: true }),
    rg8snorm: caps('rg8snorm', 'snorm', 2, {}),
    rg8uint: caps('rg8uint', 'uint', 2, { renderable: true }),
    rg8sint: caps('rg8sint', 'sint', 2, { renderable: true }),
    r32uint: caps('r32uint', 'uint', 4, { renderable: true, storage: true }),
    r32sint: caps('r32sint', 'sint', 4, { renderable: true, storage: true }),
    r32float: caps('r32float', 'float', 4, {
        renderable: true,
        storage: true,
        filterFeature: 'float32-filterable',
    }),
    rg16uint: caps('rg16uint', 'uint', 4, { renderable: true }),
    rg16sint: caps('rg16sint', 'sint', 4, { renderable: true }),
    rg16float: caps('rg16float', 'float', 4, { renderable: true, filterable: true }),
    rgba8unorm: caps('rgba8unorm', 'unorm', 4, { renderable: true, storage: true, filterable: true }),
    'rgba8unorm-srgb': caps('rgba8unorm-srgb', 'unorm', 4, { renderable: true, filterable: true }),
    rgba8snorm: caps('rgba8snorm', 'snorm', 4, { storage: true }),
    rgba8uint: caps('rgba8uint', 'uint', 4, { renderable: true, storage: true }),
    rgba8sint: caps('rgba8sint', 'sint', 4, { renderable: true, storage: true }),
    bgra8unorm: caps('bgra8unorm', 'unorm', 4, {
        renderable: true,
        filterable: true,
        storageFeature: 'bgra8unorm-storage',
    }),
    'bgra8unorm-srgb': caps('bgra8unorm-srgb', 'unorm', 4, { renderable: true, filterable: true }),
    rgb9e5ufloat: caps('rgb9e5ufloat', 'float', 4, {}),
    rgb10a2unorm: caps('rgb10a2unorm', 'unorm', 4, { renderable: true, filterable: true }),
    rg11b10ufloat: caps('rg11b10ufloat', 'float', 4, { renderFeature: 'rg11b10ufloat-renderable' }),
    rg32uint: caps('rg32uint', 'uint', 8, { renderable: true, storage: true }),
    rg32sint: caps('rg32sint', 'sint', 8, { renderable: true, storage: true }),
    rg32float: caps('rg32float', 'float', 8, {
        renderable: true,
        storage: true,
        filterFeature: 'float32-filterable',
    }),
    rgba16uint: caps('rgba16uint', 'uint', 8, { renderable: true, storage: true }),
    rgba16sint: caps('rgba16sint', 'sint', 8, { renderable: true, storage: true }),
    rgba16float: caps('rgba16float', 'float', 8, { renderable: true, storage: true, filterable: true }),
    rgba32uint: caps('rgba32uint', 'uint', 16, { renderable: true, storage: true }),
    rgba32sint: caps('rgba32sint', 'sint', 16, { renderable: true, storage: true }),
    rgba32float: caps('rgba32float', 'float', 16, {
        renderable: true,
        storage: true,
        filterFeature: 'float32-filterable',
    }),
    depth16unorm: caps('depth16unorm', 'depth', 2, {
        depthStencilAttachment: true,
        filterable: true,
    }),
    // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
    // 因此没有确定的内存布局：既不能采样，也不能拷贝。
    depth24plus: caps('depth24plus', 'depth', 4, {
        depthStencilAttachment: true,
        sampleable: false,
        copyable: false,
    }),
    'depth24plus-stencil8': caps('depth24plus-stencil8', 'depth', 4, {
        depthStencilAttachment: true,
        sampleable: false,
        copyable: false,
    }),
    depth32float: caps('depth32float', 'depth', 4, {
        depthStencilAttachment: true,
        filterFeature: 'float32-filterable',
    }),
    stencil8: caps('stencil8', 'stencil', 1, {
        depthStencilAttachment: true,
        sampleable: false,
    }),
});
/** 取出格式能力；未知格式（运行时的非法值）会抛错。 */
export function textureFormatCapabilities(format) {
    const capabilities = TEXTURE_FORMAT_CAPABILITIES[format];
    if (!capabilities) {
        throw new ValidationError(`[gpu-device-api] Unknown or unsupported TextureFormat "${String(format)}".`);
    }
    return capabilities;
}
/** `TextureFormat` → `GPUTextureFormat`。 */
export function toGPUTextureFormat(format) {
    const mapped = GPU_FORMATS[format];
    if (!mapped) {
        throw new ValidationError(`[gpu-device-api] Unknown or unsupported TextureFormat "${String(format)}"; ` +
            'the WebGPU backend only accepts formats declared by core.');
    }
    return mapped;
}
/** `GPUTextureFormat` → `TextureFormat`；压缩格式等 core 未声明的格式会抛错。 */
export function fromGPUTextureFormat(format) {
    for (const [core, gpu] of Object.entries(GPU_FORMATS)) {
        if (gpu === format)
            return core;
    }
    throw new ValidationError(`[gpu-device-api] GPU texture format "${format}" has no core TextureFormat counterpart ` +
        '(compressed formats and the extra WebGPU-only formats are not part of core).');
}
/** 是否含有 depth aspect。 */
export function hasDepthAspect(format) {
    return format === 'depth16unorm' || format === 'depth24plus' || format === 'depth24plus-stencil8' || format === 'depth32float';
}
/** 是否含有 stencil aspect。 */
export function hasStencilAspect(format) {
    return format === 'depth24plus-stencil8' || format === 'stencil8';
}
/** 是否为 depth 或 stencil 格式。 */
export function isDepthOrStencilFormat(format) {
    return isDepthStencilFormat(format);
}
/** 线性过滤是否需要额外的 feature。 */
export function filterFeatureFor(format) {
    return textureFormatCapabilities(format).filterFeature;
}
/** 在给定设备能力下是否可被线性过滤。 */
export function isFilterableFormat(format, features) {
    const capabilities = textureFormatCapabilities(format);
    if (capabilities.filterable)
        return true;
    if (!capabilities.filterFeature)
        return false;
    return features ? features.has(capabilities.filterFeature) : false;
}
/** 在给定设备能力下是否可作为 render attachment（color 或 depth/stencil）。 */
export function isRenderableFormat(format, features) {
    const capabilities = textureFormatCapabilities(format);
    if (capabilities.renderable || capabilities.depthStencilAttachment)
        return true;
    if (!capabilities.renderFeature)
        return false;
    return features ? features.has(capabilities.renderFeature) : false;
}
/** 在给定设备能力下是否可作为 storage texture。 */
export function isStorageTextureFormat(format, features) {
    const capabilities = textureFormatCapabilities(format);
    if (!capabilities.storage && !capabilities.storageFeature)
        return false;
    if (!capabilities.storageFeature)
        return true;
    return features ? features.has(capabilities.storageFeature) : false;
}
/** 断言格式可作为 render attachment（color 或 depth/stencil）。 */
export function assertRenderableFormat(format, features, context) {
    const capabilities = textureFormatCapabilities(format);
    if (capabilities.renderable || capabilities.depthStencilAttachment)
        return;
    if (capabilities.renderFeature) {
        const enabled = features ? features.has(capabilities.renderFeature) : false;
        if (enabled)
            return;
        throw new ValidationError(`[gpu-device-api] ${context}: "${format}" requires the "${capabilities.renderFeature}" device feature ` +
            'to be used as a render attachment (it is not enabled on this device).');
    }
    throw new ValidationError(`[gpu-device-api] ${context}: "${format}" cannot be used as a render attachment in WebGPU ` +
        '(snorm color formats and rgb9e5ufloat have no renderable support).');
}
/** 断言格式可以作为 `TextureBinding` 被采样。 */
export function assertSampleableFormat(format, context, multisampled = false) {
    const capabilities = textureFormatCapabilities(format);
    if (multisampled) {
        throw new ValidationError(`[gpu-device-api] ${context}: a multisampled texture ("${format}", sampleCount > 1) cannot be used as a ` +
            'TextureBinding; WebGPU only allows multisampled textures as render attachments.');
    }
    if (capabilities.sampleable)
        return;
    if (capabilities.kind === 'stencil') {
        throw new ValidationError(`[gpu-device-api] ${context}: "stencil8" has no sampleable aspect; bind a depth format instead.`);
    }
    throw new ValidationError(`[gpu-device-api] ${context}: "${format}" can only be used as a depth/stencil attachment and cannot be ` +
        'sampled (its memory layout is implementation defined). Use "depth32float" or "depth16unorm" when the ' +
        'depth texture has to be read in a shader.');
}
/** 断言格式可以作为 storage texture。 */
export function assertStorageTextureFormat(format, features, context) {
    const capabilities = textureFormatCapabilities(format);
    if (capabilities.storage)
        return;
    if (capabilities.storageFeature) {
        if (features?.has(capabilities.storageFeature))
            return;
        throw new ValidationError(`[gpu-device-api] ${context}: "${format}" requires the "${capabilities.storageFeature}" device feature ` +
            'to be used as a storage texture (it is not enabled on this device).');
    }
    throw new ValidationError(`[gpu-device-api] ${context}: "${format}" cannot be used as a storage texture. WebGPU only allows ` +
        'r32uint/r32sint/r32float, rg32*, rgba8unorm(-snorm/uint/sint), rgba16*, rgba32* and bgra8unorm ' +
        '(with the bgra8unorm-storage feature).');
}
/** 断言格式可以被 copy（`CopySrc` / `CopyDst`）。 */
export function assertCopyableFormat(format, context) {
    const capabilities = textureFormatCapabilities(format);
    if (capabilities.copyable)
        return;
    throw new ValidationError(`[gpu-device-api] ${context}: "${format}" is not copy-compatible in WebGPU (its memory layout is ` +
        'implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.');
}
/** 断言 aspect 与格式匹配。 */
export function assertTextureAspectForFormat(format, aspect, context) {
    if (aspect === 'all')
        return;
    if (aspect === 'depth-only' && !hasDepthAspect(format)) {
        throw new ValidationError(`[gpu-device-api] ${context}: aspect "depth-only" is invalid for format "${format}", which has no depth aspect.`);
    }
    if (aspect === 'stencil-only' && !hasStencilAspect(format)) {
        throw new ValidationError(`[gpu-device-api] ${context}: aspect "stencil-only" is invalid for format "${format}", which has no stencil aspect.`);
    }
}
/** 从格式推导 WebGPU texture binding 的默认 sampleType。 */
export function defaultTextureSampleType(format) {
    const capabilities = textureFormatCapabilities(format);
    switch (capabilities.sampleScalar) {
        case 'uint':
            return 'uint';
        case 'sint':
            return 'sint';
        case 'depth':
            return 'depth';
        case 'float':
            return capabilities.filterable ? 'float' : 'unfilterable-float';
        default:
            return 'float';
    }
}
/** 校验 texture descriptor 里「usage 与格式/sampleCount 是否自洽」。 */
export function assertTextureUsageSupported(format, usage, options, context) {
    // 先确认格式本身合法（未知格式会在这里抛错），再做 usage 组合校验。
    textureFormatCapabilities(format);
    const sampleCount = options.sampleCount ?? 1;
    if ((usage & TextureUsageFlags.RenderAttachment) !== 0) {
        assertRenderableFormat(format, options.features, context);
    }
    if ((usage & TextureUsageFlags.TextureBinding) !== 0) {
        assertSampleableFormat(format, context, sampleCount > 1);
    }
    if ((usage & TextureUsageFlags.StorageBinding) !== 0) {
        assertStorageTextureFormat(format, options.features, context);
    }
    if ((usage & (TextureUsageFlags.CopySrc | TextureUsageFlags.CopyDst)) !== 0) {
        assertCopyableFormat(format, context);
    }
    if (sampleCount > 1) {
        if (sampleCount !== 4) {
            throw new ValidationError(`[gpu-device-api] ${context}: sampleCount must be 1 or 4, got ${String(sampleCount)}.`);
        }
        if ((options.mipLevelCount ?? 1) > 1) {
            throw new ValidationError(`[gpu-device-api] ${context}: a multisampled texture must have exactly one mip level.`);
        }
        if (options.dimension !== undefined && options.dimension !== '2d') {
            throw new ValidationError(`[gpu-device-api] ${context}: a multisampled texture must be "2d", got "${options.dimension}".`);
        }
        if ((usage & (TextureUsageFlags.CopySrc | TextureUsageFlags.CopyDst)) !== 0) {
            throw new ValidationError(`[gpu-device-api] ${context}: a multisampled texture cannot be a copy source or destination; ` +
                'resolve it into a single-sampled texture first.');
        }
        if ((usage & (TextureUsageFlags.TextureBinding | TextureUsageFlags.StorageBinding)) !== 0) {
            throw new ValidationError(`[gpu-device-api] ${context}: a multisampled texture can only be used as a render attachment.`);
        }
    }
}
//# sourceMappingURL=wgpuFormatMap.js.map