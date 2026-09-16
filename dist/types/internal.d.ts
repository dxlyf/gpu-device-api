/**
 * core 层与各后端之间共享的内部类型。它们不属于公开 API，
 * 可能随时变更。
 *
 * （保留为真实模块而非 `.d.ts`，以便声明生成时能将其拷贝到 `dist/types`。）
 */
/** 显式可空。 */
export type Nullable<T> = T | null;
/** texture、render target 或 canvas 帧的尺寸。 */
export interface Extent3D {
    width: number;
    height: number;
    depthOrArrayLayers: number;
}
/** 拷贝操作在 texture 内的偏移。 */
export interface Origin3D {
    x: number;
    y: number;
    z: number;
}
/** texture 子资源的 mip level / array layer 选择。 */
export interface SubresourceRange {
    baseMipLevel: number;
    mipLevelCount: number;
    baseArrayLayer: number;
    arrayLayerCount: number;
}
/** texture 上传时宿主像素数据的内存布局。 */
export interface TexelCopyBufferLayout {
    offset: number;
    bytesPerRow?: number;
    rowsPerImage?: number;
}
/** pipeline 的 bind group layout 经过校验和默认值填充后的一项。 */
export interface ResolvedBinding {
    group: number;
    binding: number;
    type: string;
    /** shader 代码生成使用的资源名（texture/sampler）。 */
    name?: string;
}
/** 一个 `(group, binding)` 组合。 */
export interface BindingLocation {
    group: number;
    binding: number;
}
export declare function bindingKey(group: number, binding: number): string;
//# sourceMappingURL=internal.d.ts.map