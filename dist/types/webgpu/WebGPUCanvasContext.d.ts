/**
 * WebGPU canvas 上下文：`CanvasContext` 接口在 `GPUCanvasContext` 上的实现。
 *
 * 与 WebGL2 的隐式默认帧缓冲不同，WebGPU 必须先把 context `configure()` 到某个 device 上，
 * 之后每帧通过 `getCurrentTexture()` 拿 back buffer。本类把后者包成 core 的
 * {@link FrameTarget}，并把「同一帧返回同一个 target」做实：`getCurrentTexture()` 在 present
 * 之前会一直返回同一个 `GPUTexture`，因此按原生对象身份做缓存就够了。
 *
 * **超出 core 的扩展**：core 的 `FrameTarget` 没有地方表达 MSAA 的多重采样 attachment，
 * `RenderPassDescriptor` 又只能给 attachment 列表。因此这里额外提供
 * {@link WebGPUCanvasContext.createPassDescriptor} 与 {@link WebGPUCanvasContext.multisampleView}：
 * 配置了 `sampleCount > 1` 时会创建一张同尺寸的多重采样 texture，并把它作为 `view`、
 * 把 canvas 纹理作为 `resolveTarget`。
 */
import type { CanvasConfig, CanvasContext, FrameTarget } from '../core/CanvasContext.js';
import type { Color, ColorAttachment } from '../core/render/RenderTarget.js';
import type { LoadOp } from '../core/enums/LoadOp.js';
import type { StoreOp } from '../core/enums/StoreOp.js';
import type { TextureFormat } from '../core/enums/TextureFormat.js';
import type { Device } from '../core/Device.js';
import type { WebGPUTextureView } from './resources/WebGPUTextureView.js';
export interface WebGPUCanvasContextOptions {
    /** 初始 pixel ratio；默认为 `devicePixelRatio`（上限 4）。 */
    pixelRatio?: number;
    /** 自动为 back buffer 追加 `CopySrc` usage（截图 / readback 用）。 */
    copySrc?: boolean;
}
/** {@link WebGPUCanvasContext.createPassDescriptor} 的选项。 */
export interface WebGPUCanvasPassOptions {
    loadOp?: LoadOp;
    storeOp?: StoreOp;
    clearValue?: Color;
}
export declare class WebGPUCanvasContext implements CanvasContext {
    readonly canvas: HTMLCanvasElement | OffscreenCanvas;
    private readonly options;
    private gpuContext;
    private currentDevice;
    private formatValue;
    private usageValue;
    private alphaModeValue;
    private colorSpaceValue;
    private sampleCountValue;
    private widthValue;
    private heightValue;
    private pixelRatioValue;
    private configuredValue;
    private frameTexture;
    private frameView;
    private frameNative;
    private frameTarget;
    private multisampleTexture;
    private multisampleViewValue;
    private _disposed;
    constructor(canvas: HTMLCanvasElement | OffscreenCanvas, options?: WebGPUCanvasContextOptions);
    get width(): number;
    get height(): number;
    get pixelRatio(): number;
    get format(): TextureFormat;
    get configured(): boolean;
    get device(): Device | null;
    /** 原生 `GPUCanvasContext`；configure 之后才有值。 */
    get native(): GPUCanvasContext | null;
    /** 本上下文使用的 MSAA 采样数（1 或 4）。 */
    get sampleCount(): number;
    /** 当前帧 canvas 纹理的 view（MSAA 时是 resolve target）；未取帧时为 `null`。 */
    get frameTextureView(): WebGPUTextureView | null;
    /** 配置了 MSAA 且已取过一次帧时，当前帧的多重采样 view；否则为 `null`。 */
    get multisampleView(): WebGPUTextureView | null;
    get disposed(): boolean;
    /** 把 context 配置到某个 device 上。会丢弃当前帧的缓存。 */
    configure(config: CanvasConfig): void;
    /** 解除配置；之后 `getCurrentFrameTarget()` 会抛错。 */
    unconfigure(): void;
    /** 以 CSS 像素设置画布尺寸（内部会乘以 pixel ratio）。 */
    setSize(width: number, height: number, updateStyle?: boolean): void;
    /** 设置 CSS 像素与设备像素之间的比例。 */
    setPixelRatio(ratio: number): void;
    /** 重新读取元素尺寸；back buffer 发生变化时返回 true。 */
    resize(updateStyle?: boolean): boolean;
    /**
     * 获取当前帧纹理。
     *
     * WebGPU 在 present 之前会一直返回同一个 `GPUTexture`，因此这里按原生对象身份缓存包装
     * 对象；present（提交了写 canvas 的 render pass）之后身份变化，包装对象会被自动重建。
     */
    getCurrentFrameTarget(): FrameTarget;
    /**
     * 生成可以直接交给 `beginRenderPass` 的 color attachment 列表。
     *
     * `sampleCount > 1` 时会创建/复用一个同尺寸的多重采样 texture，把它作为 `view`，
     * 而把 canvas 纹理作为 `resolveTarget`。
     */
    createPassDescriptor(options?: WebGPUCanvasPassOptions): {
        colorAttachments: readonly ColorAttachment[];
        depthStencilAttachment: null;
    };
    /** 释放 context 相关资源。幂等。 */
    dispose(): void;
    private ensureMultisampleTarget;
    private releaseFrame;
    private releaseMultisampleTarget;
}
/** 该对象是否为 WebGPU 后端的 canvas context。 */
export declare function isWebGPUCanvasContext(value: unknown): value is WebGPUCanvasContext;
//# sourceMappingURL=WebGPUCanvasContext.d.ts.map