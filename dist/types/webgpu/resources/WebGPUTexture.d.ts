/**
 * WebGPU texture 资源：`Texture` 接口在 `GPUTexture` 上的实现。
 *
 * 两条创建路径：
 * - {@link WebGPUTexture.create}：由 `device.createTexture()` 走正常流程，usage / format /
 *   sampleCount 会在进入 WebGPU 之前按能力表校验；
 * - {@link WebGPUTexture.adopt}：把已经存在的原生 `GPUTexture`（典型例子是 canvas
 *   back buffer 的帧纹理）包起来。这类 texture 由 canvas 拥有，`destroy()` 不会销毁它。
 *
 * view 的创建与缓存也在本类：同一个 subresource 组合只建一次 view，并随 texture 一起释放。
 */
import type { Texture, TextureDescriptor, TextureDimension } from '../../core/resources/Texture.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { TextureUsage } from '../../core/enums/TextureUsage.js';
import type { TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';
import type { Extent3D } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { WebGPUTextureView } from './WebGPUTextureView.js';
/** 已解析的 texture 描述，便于 resize / 调试时复用。 */
export interface ResolvedTextureDescriptor {
    readonly label: string;
    readonly size: Extent3D;
    readonly mipLevelCount: number;
    readonly sampleCount: number;
    readonly dimension: TextureDimension;
    readonly format: TextureFormat;
    readonly usage: TextureUsage;
    readonly viewFormats: readonly TextureFormat[];
}
export declare class WebGPUTexture implements Texture {
    readonly label: string;
    readonly dimension: TextureDimension;
    readonly format: TextureFormat;
    readonly usage: TextureUsage;
    readonly width: number;
    readonly height: number;
    readonly depthOrArrayLayers: number;
    readonly mipLevelCount: number;
    readonly sampleCount: number;
    readonly native: GPUTexture;
    /** 创建时声明的额外 view 格式。 */
    readonly viewFormats: readonly TextureFormat[];
    private readonly device;
    private readonly owned;
    private readonly extent;
    private readonly viewCache;
    private readonly viewList;
    private _disposed;
    private constructor();
    /**
     * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
     *
     * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
     */
    static create(device: WebGPUDevice, descriptor: TextureDescriptor): WebGPUTexture;
    /**
     * 包住一个已经存在的原生 `GPUTexture`（例如 canvas 的帧纹理）。
     *
     * `owned` 为 `false` 时 `destroy()` 只标记本包装对象失效，不会销毁底层 texture。
     * 未提供的字段会直接从原生对象读取（canvas 帧纹理的尺寸/格式只能这样拿到）。
     */
    static adopt(device: WebGPUDevice, native: GPUTexture, descriptor?: Partial<ResolvedTextureDescriptor>, options?: {
        owned?: boolean;
    }): WebGPUTexture;
    get size(): Extent3D;
    get disposed(): boolean;
    /** 当前 texture 是否仍然可用。 */
    get usable(): boolean;
    /** 按 subresource 选择创建（并缓存）view。 */
    createView(descriptor?: TextureViewDescriptor): WebGPUTextureView;
    /** 目前已创建的 view；随 texture 一同释放。 */
    get views(): readonly TextureView[];
    /** 销毁 texture（`owned` 为 false 时只标记包装对象失效）。幂等。 */
    destroy(): void;
    /** `Disposable` 的别名。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 texture。 */
export declare function isWebGPUTexture(value: unknown): value is WebGPUTexture;
/** 原生 `GPUTexture` 的形状识别。 */
export declare function isNativeGPUTexture(value: unknown): value is GPUTexture;
/**
 * 把 core 的 `TextureLike`（命令层用的最小结构）收窄为原生 `GPUTexture`。
 *
 * 命令层刻意只依赖 `{ native?: unknown }`，因此后端必须在这里补上运行时收窄；
 * 收不到合适的原生对象时抛 {@link ValidationError}，避免把 WebGL2 的资源交给 WebGPU。
 */
export declare function asGPUTexture(value: unknown, context: string): GPUTexture;
//# sourceMappingURL=WebGPUTexture.d.ts.map