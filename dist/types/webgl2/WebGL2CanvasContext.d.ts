/**
 * WebGL2 的 canvas 表面。
 *
 * WebGL2 与 WebGPU 最大的不同：**GL context 本身就从 canvas 上取**，一个 device 只能服务
 * 它自己的那个 canvas，默认帧缓冲也隐式存在。所以 `configure()` 在这里主要是记账与校验，
 * 而 `getCurrentFrameTarget()` 返回的是一张「虚拟纹理」—— 它代表默认帧缓冲，
 * `native` 为 `null`，渲染通道看到它会直接绑定 framebuffer 0 而不是某个 FBO。
 */
import { type Texture } from '../core/resources/Texture.js';
import type { TextureView } from '../core/resources/TextureView.js';
import type { FrameTarget, CanvasConfig, CanvasContext } from '../core/CanvasContext.js';
import type { WebGL2Device } from './WebGL2Device.js';
/** 标记：这个 view 代表默认帧缓冲。 */
export interface DefaultFramebufferView extends TextureView {
    readonly isDefaultFramebuffer: true;
}
/** 判断一个 view 是否代表默认帧缓冲（渲染通道据此决定绑定 framebuffer 0）。 */
export declare function isDefaultFramebufferView(view: unknown): view is DefaultFramebufferView;
export interface WebGL2CanvasContextOptions {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    /** 首选的背景缓冲格式；WebGL2 的默认帧缓冲格式由浏览器决定，这里只用于类型对齐。 */
    format?: Texture['format'];
}
export declare class WebGL2CanvasContext implements CanvasContext {
    readonly canvas: HTMLCanvasElement | OffscreenCanvas;
    readonly gl: WebGL2RenderingContext;
    private _device;
    private _format;
    private _pixelRatio;
    private _width;
    private _height;
    constructor(options: WebGL2CanvasContextOptions);
    get device(): WebGL2Device | null;
    get deviceRef(): WebGL2Device | null;
    get configured(): boolean;
    get format(): Texture['format'];
    get width(): number;
    get height(): number;
    get pixelRatio(): number;
    /** 该 canvas 的 GL context（与 device 的 `native` 是同一个对象）。 */
    get context(): WebGL2RenderingContext;
    configure(config: CanvasConfig): void;
    unconfigure(): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setPixelRatio(ratio: number): void;
    resize(): boolean;
    getCurrentFrameTarget(): FrameTarget;
    dispose(): void;
    private applyBackingSize;
}
//# sourceMappingURL=WebGL2CanvasContext.d.ts.map