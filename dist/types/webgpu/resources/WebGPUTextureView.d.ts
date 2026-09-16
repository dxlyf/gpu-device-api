/**
 * WebGPU texture view：`TextureView` 接口在 `GPUTextureView` 上的实现。
 *
 * `dimension` 与 `aspect` 需要显式映射（`'2d-array'` / `'depth-only'` 等），并且要校验
 * aspect 与 texture 格式是否匹配：`depth24plus` 没有 stencil aspect，`stencil8` 没有
 * depth aspect，WebGPU 对这两种情况的报错很难定位，因此在这里提前抛出。
 */
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { TextureSwizzleString, TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';
import type { WebGPUTexture } from './WebGPUTexture.js';
/** view descriptor 的完整形态（`resolveTextureViewDescriptor` 的返回值）。 */
export type ResolvedTextureViewDescriptor = TextureView['descriptor'];
export declare class WebGPUTextureView implements TextureView {
    readonly label: string;
    readonly texture: WebGPUTexture;
    readonly descriptor: ResolvedTextureViewDescriptor;
    readonly native: GPUTextureView;
    private _disposed;
    /**
     * `preResolved` 由 {@link WebGPUTexture.createView} 传入：它已经为查缓存解析过一次，
     * 这里不再重复解析（`resolveTextureViewDescriptor` 每次都会新建一个对象）。
     */
    constructor(texture: WebGPUTexture, descriptor?: TextureViewDescriptor, preResolved?: ResolvedTextureViewDescriptor);
    /** view 覆盖的格式（可能是重解释后的格式）。 */
    get format(): TextureFormat;
    /** 实际生效的通道重排；未指定时为 `'rgba'`（与原生默认值一致）。 */
    get swizzle(): TextureSwizzleString;
    get disposed(): boolean;
    /** GPUTextureView 没有 destroy；释放只是把本包装对象标记为不可用。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 texture view。 */
export declare function isWebGPUTextureView(value: unknown): value is WebGPUTextureView;
/** 原生 `GPUTextureView` 的形状识别：它没有任何自有方法，只能靠 `@@toStringTag` 判断。 */
export declare function isNativeGPUTextureView(value: unknown): value is GPUTextureView;
/**
 * 把任意 texture view 表示收窄为原生 `GPUTextureView`。
 *
 * 接受 `WebGPUTextureView`（core 资源）或直接由 escape hatch 拿到的原生 `GPUTextureView`；
 * 其余情况抛 {@link ValidationError}。
 */
export declare function asGPUTextureView(value: unknown, context: string): GPUTextureView;
//# sourceMappingURL=WebGPUTextureView.d.ts.map