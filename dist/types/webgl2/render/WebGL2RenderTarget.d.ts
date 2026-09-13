/**
 * WebGL2 的渲染目标：一个 framebuffer object（FBO）加上它的附件纹理。
 *
 * 与 WebGPU 不同的是，WebGL2 **不支持多重采样的离屏纹理附件**（多重采样只能渲染到 renderbuffer，
 * 且无法 resolve 成纹理）。所以离屏目标一律 `sampleCount = 1`，抗锯齿只能靠：
 * - 默认帧缓冲（canvas 的 `antialias: true`，由浏览器做 MSAA）；
 * - 或后处理式的 FXAA / 超采样。
 * 这里选择如实报错，而不是假装支持，避免使用者以为自己拿到了 MSAA 的离屏目标。
 *
 * 清屏用 WebGL2 的 `clearBufferfv` / `clearBufferfi`，它们可以**按附件下标**清除，
 * 天然支持多颜色附件，不需要来回切 `drawBuffers`。
 */
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import type { Color, ColorAttachment, DepthStencilAttachment, RenderTarget, RenderTargetDescriptor } from '../../core/render/RenderTarget.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { LoadOp } from '../../core/enums/LoadOp.js';
import type { StoreOp } from '../../core/enums/StoreOp.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';
import type { WebGL2TextureView } from '../resources/WebGL2TextureView.js';
export interface WebGL2RenderTargetOptions {
    gl: WebGL2RenderingContext;
    state: GlStateCache;
    createTexture: (format: TextureFormat, width: number, height: number, usage: TextureUsage, label: string) => WebGL2Texture;
}
/** 清屏参数。 */
export interface RenderTargetClearOptions {
    clearColor?: Color;
    clearDepth?: number;
    clearStencil?: number;
    /** 为 `'load'` 时保留颜色附件原内容。 */
    loadOp?: LoadOp;
    depthLoadOp?: LoadOp;
}
export declare class WebGL2RenderTarget implements RenderTarget {
    readonly label: string;
    readonly colorFormats: readonly TextureFormat[];
    readonly depthFormat: TextureFormat | null;
    readonly sampleCount = 1;
    readonly mipLevelCount: number;
    private readonly gl;
    private readonly state;
    private readonly options;
    private readonly framebuffer;
    private colorTextures;
    private depthTexture;
    private colorViews;
    private depthView;
    private _width;
    private _height;
    private _disposed;
    constructor(descriptor: RenderTargetDescriptor, options: WebGL2RenderTargetOptions);
    get width(): number;
    get height(): number;
    get colorFormat(): TextureFormat;
    get colors(): readonly WebGL2Texture[];
    get depth(): WebGL2Texture | null;
    /** GL 的 framebuffer 对象。 */
    get native(): WebGLFramebuffer;
    get disposed(): boolean;
    get colorAttachments(): readonly ColorAttachment[];
    get depthStencilAttachment(): DepthStencilAttachment | null;
    createPassDescriptor(options?: {
        loadOp?: LoadOp;
        storeOp?: StoreOp;
        clearValue?: Color;
        depthLoadOp?: LoadOp;
        depthClearValue?: number;
    }): {
        colorAttachments: readonly ColorAttachment[];
        depthStencilAttachment: DepthStencilAttachment | null;
    };
    /**
     * 绑定 framebuffer 并按需清屏。渲染通道开始绘制前调用。
     *
     * 清屏时临时关闭 `SCISSOR_TEST`：GL 的 `clearBuffer*` 会受裁剪框影响，
     * 而这里的语义应该是「清整个附件」。
     */
    bind(clear?: RenderTargetClearOptions): void;
    resize(width: number, height: number): boolean;
    destroy(): void;
    dispose(): void;
    /** 取某个颜色附件的 view（后处理、调试读回时用）。 */
    colorView(index?: number): WebGL2TextureView;
    /** 深度附件的 view；没有深度附件时抛错。 */
    depthStencilView(): WebGL2TextureView;
    private createAttachments;
    private attach;
}
//# sourceMappingURL=WebGL2RenderTarget.d.ts.map