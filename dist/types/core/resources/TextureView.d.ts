/** texture 某个子范围上的 view。对应 WebGPU 的 `GPUTextureView`。 */
import type { Disposable } from '../../utils/Disposable.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { Texture } from './Texture.js';
export type TextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
export type TextureAspect = 'all' | 'depth-only' | 'stencil-only';
export interface TextureViewDescriptor {
    label?: string;
    /** 重解释格式；必须列在该 texture 的 `viewFormats` 中。 */
    format?: TextureFormat;
    /** 默认为该 texture 的 dimension。 */
    dimension?: TextureViewDimension;
    baseMipLevel?: number;
    mipLevelCount?: number;
    baseArrayLayer?: number;
    arrayLayerCount?: number;
    aspect?: TextureAspect;
}
export interface TextureView extends Disposable {
    readonly label: string;
    readonly texture: Texture;
    readonly descriptor: Required<Omit<TextureViewDescriptor, 'label' | 'format'>> & {
        format?: TextureFormat;
    };
    /** 原生句柄：WebGPU 上是 `GPUTextureView`；WebGL2 上就是 texture 本身。 */
    readonly native: unknown;
}
/** 为 view descriptor 填入 WebGPU 的默认值。 */
export declare function resolveTextureViewDescriptor(texture: Texture, descriptor?: TextureViewDescriptor): TextureView['descriptor'];
//# sourceMappingURL=TextureView.d.ts.map