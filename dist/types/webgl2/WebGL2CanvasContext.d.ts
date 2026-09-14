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
import { type FrameTarget, type CanvasConfig, type CanvasContext, type CanvasPassDescriptor, type CanvasPassOptions } from '../core/CanvasContext.js';
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
    /** 默认帧缓冲的深度位数；0 表示这次 context 根本没有深度缓冲。 */
    private depthBits;
    /** `configure()` 里是否明确要求了深度；`undefined` 表示没表态（不校验）。 */
    private depthRequested;
    /** 默认帧缓冲的采样数；`SAMPLES` 是 context 创建时定下的常量，查一次即可（见 sampleCount()）。 */
    private samples;
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
    /**
     * 生成画布渲染通道的附件列表。
     *
     * 默认帧缓冲**自带深度缓冲**（只要创建 context 时 `contextAttributes.depth` 没关掉），
     * 所以这里如实把深度附件报出去 —— 有了它，渲染通道的 `depthFormat` 才不是 `null`，
     * `resolveRenderState()` 才不会把 `DEPTH_TEST` 关掉（关掉之后画布渲染会退化成画家算法）。
     *
     * 深度附件是一张「虚拟深度纹理」：它没有 GL 对象，只表示「framebuffer 0 的深度缓冲」，
     * 渲染通道据此走 `beginDefaultFramebufferPass()` 并用 `gl.clear(DEPTH_BUFFER_BIT)` 清深度。
     */
    createPassDescriptor(options?: CanvasPassOptions): CanvasPassDescriptor;
    dispose(): void;
    /**
     * 默认帧缓冲的深度附件。
     *
     * `depthRequested === false`（调用方明确不要深度）或这次 context 根本没有深度缓冲时返回 `null` ——
     * 上层会据此如实关掉深度测试，而不是让它「看起来开着」。
     */
    private createDepthAttachment;
    /**
     * 默认帧缓冲的采样数。
     *
     * `gl.getParameter(SAMPLES)` 是一次同步查询（要等 GL 命令队列），而它由创建 context 时的
     * `antialias` 决定、在 context 生命周期内不会变，所以这里只查一次并记住。
     */
    private sampleCount;
    private applyBackingSize;
}
//# sourceMappingURL=WebGL2CanvasContext.d.ts.map