/** texture 某个子范围上的 view。对应 WebGPU 的 `GPUTextureView`。 */
import { ValidationError } from '../errors/ValidationError.js';
/** `swizzle` 缺省时的取值，与原生一致。 */
export const DEFAULT_TEXTURE_SWIZZLE = 'rgba';
/**
 * 校验一个 swizzle 字符串是否是「四个合法字符」。
 *
 * 类型层面已经限定了形状，但类型可以被 `as` 绕开、JS 调用方也没有类型；而原生对错误取值的
 * 反应是一句 `TypeError: Swizzle ('xx') must be exactly a four-character string.`，
 * 没有任何上下文。这里提前给出带 label 的报错。
 */
export function assertTextureSwizzle(swizzle, context) {
    if (typeof swizzle !== 'string' || !/^[rgba01]{4}$/.test(swizzle)) {
        throw new ValidationError(`[gpu-device-api] ${context}: swizzle must be a four-character string made of "r", "g", "b", "a", ` +
            `"0" and "1" (e.g. "rgba", "rrr1", "bgra"), got ${JSON.stringify(swizzle)}.`);
    }
}
/**
 * 为 view descriptor 填入 WebGPU 的默认值。
 *
 * 除新增的 `swizzle` 之外，这里的每个字段与改动前**逐字段一致**（见
 * `test/tier3-small-api.test.ts` 里针对默认值的逐字段回归断言）。
 */
export function resolveTextureViewDescriptor(texture, descriptor = {}) {
    const dimension = descriptor.dimension ??
        (texture.dimension === '1d'
            ? '1d'
            : texture.dimension === '3d'
                ? '3d'
                : texture.depthOrArrayLayers > 1
                    ? '2d-array'
                    : '2d');
    if (descriptor.swizzle !== undefined) {
        assertTextureSwizzle(descriptor.swizzle, `Texture "${texture.label}".createView`);
    }
    return {
        format: descriptor.format,
        dimension,
        baseMipLevel: descriptor.baseMipLevel ?? 0,
        mipLevelCount: descriptor.mipLevelCount ?? texture.mipLevelCount,
        baseArrayLayer: descriptor.baseArrayLayer ?? 0,
        arrayLayerCount: descriptor.arrayLayerCount ?? texture.depthOrArrayLayers,
        aspect: descriptor.aspect ?? 'all',
        swizzle: descriptor.swizzle,
    };
}
//# sourceMappingURL=TextureView.js.map