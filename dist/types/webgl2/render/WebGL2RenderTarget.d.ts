/**
 * WebGL2 的渲染目标：framebuffer object（FBO）加上它的附件。
 *
 * ## 多重采样（`sampleCount > 1`）
 *
 * GL 的多重采样**只能渲染到 renderbuffer**，不能渲染到纹理。所以一个多重采样的离屏目标
 * 由两个 framebuffer 组成：
 *
 * - **draw FBO**：颜色/深度附件是 `renderbufferStorageMultisample` 分配的 renderbuffer，绘制发生在这里；
 * - **resolve FBO**：附件是普通的单采样纹理（也就是 `colors` / `depth` 暴露出去的那些），
 *   可以被采样、可以被 `copyTextureToBuffer` 读回。
 *
 * 渲染通道 `end()` 时用 `blitFramebuffer`（`NEAREST`）把 draw FBO 解析到 resolve FBO ——
 * 这是 WebGL2 规范里唯一的多重采样 resolve 途径，也是 `sampleCount > 1` 能真正生效的原因。
 * （一个常见的误解是「WebGL2 无法把多重采样离屏目标 resolve 成纹理」，实际上
 * `blitFramebuffer` 就是为此存在的；以前这里正是按那个误解直接抛错的。）
 *
 * `sampleCount === 1` 时不创建任何 renderbuffer，draw FBO 就是 resolve FBO，
 * 走的是与从前逐字节相同的路径（像素基线因此不受影响）。
 *
 * ## 采样数不支持时明确报错
 *
 * 三道检查，任何一道不过都抛带 `[gpu-device-api] ` 前缀的英文错误，**绝不静默降级成 1**：
 * `MAX_SAMPLES`、`getInternalformatParameter(RENDERBUFFER, internalFormat, SAMPLES)`、
 * 以及 attach 之后的 `checkFramebufferStatus`（`FRAMEBUFFER_INCOMPLETE_MULTISAMPLE`）。
 *
 * 清屏用 WebGL2 的 `clearBufferfv` / `clearBufferfi`，它们可以**按附件下标**清除，
 * 天然支持多颜色附件，不需要来回切 `drawBuffers`。
 *
 * ## 行序：如实上报 `bottomUp`，本层不代劳
 *
 * GL 的窗口原点在**左下**，所以附着到 FBO 上的纹理是**自下而上**存储的：纹理第 0 行是画面**底端**。
 * WebGPU 的纹素原点在左上，同一个渲染结果的纹素行序在两个后端正好相反。这不是
 * `copyTextureToBuffer` 的错：两个后端都忠实按「纹素行序」拷贝（缓冲第 0 行 = 纹素行
 * `origin.y`，见 `src/core/resources/Texture.ts` 的行序约定）。实测（8x4 目标，上半红、下半蓝，
 * 同一份读回调用）：
 *
 * - WebGPU：缓冲区四行 = `red,黑,黑,blue`（第 0 行是画面顶端）；
 * - WebGL2：缓冲区四行 = `blue,黑,黑,red`（第 0 行是画面底端）。
 *
 * 本文件**不做任何翻转**：{@link WebGL2RenderTarget.rowOrder} 如实返回 `'bottomUp'`，
 * 由调用方决定要不要统一（core 层用 `mat4.flipClipY` 翻投影，或读回后自己反行序；
 * 便捷层 `Renderer` 默认自动翻投影）。为什么不在这一层翻：GL 不允许负高度的 `viewport`，
 * 唯一能表达「渲染进纹理时把 Y 翻过来」的地方是**投影矩阵或顶点着色器**，而渲染目标不掌握
 * 调用方的相机 —— 它翻不了，也不该假装翻了。
 */
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import { RowOrder } from '../../core/render/RenderTarget.js';
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
    /**
     * 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
     * （见 `WebGL2Device.untrack`）。不传时为空操作。
     */
    onDispose?: (target: WebGL2RenderTarget) => void;
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
/** 取某个附件 view 所属的渲染目标；不属于任何目标（或目标已销毁）时返回 null。 */
export declare function webgl2RenderTargetOfView(view: unknown): WebGL2RenderTarget | null;
export declare class WebGL2RenderTarget implements RenderTarget {
    readonly label: string;
    readonly colorFormats: readonly TextureFormat[];
    readonly depthFormat: TextureFormat | null;
    readonly sampleCount: number;
    readonly mipLevelCount: number;
    /**
     * GL 的原生行序：FBO 附着点的原点在左下，纹理自下而上存储，纹素第 0 行是画面底端。
     *
     * 本层如实上报，**不做翻转**（要统一请看 `RenderTarget.RowOrder` 的说明）。
     */
    readonly rowOrder: RowOrder;
    private readonly gl;
    private readonly state;
    private readonly options;
    /** resolve 用的 framebuffer：附件是单采样纹理，`colors` / `depth` 就是它的附件。 */
    private readonly framebuffer;
    /**
     * 绘制用的 framebuffer。
     *
     * `sampleCount === 1` 时**就是** `framebuffer`（与从前完全一致）；
     * 多重采样时是另一个挂着 renderbuffer 的 FBO。
     */
    private readonly drawFramebuffer;
    private colorTextures;
    private depthTexture;
    private colorViews;
    private depthView;
    /** 多重采样的颜色附件；单采样时为空数组。 */
    private colorRenderbuffers;
    /** 多重采样的深度附件；没有深度附件或单采样时为 null。 */
    private depthRenderbuffer;
    /** 本帧的绘制内容还没解析到 resolve 附件里。 */
    private needsResolve;
    private _width;
    private _height;
    private _disposed;
    constructor(descriptor: RenderTargetDescriptor, options: WebGL2RenderTargetOptions);
    get width(): number;
    get height(): number;
    get colorFormat(): TextureFormat;
    get colors(): readonly WebGL2Texture[];
    get depth(): WebGL2Texture | null;
    /** resolve 用的 framebuffer（`colors` / `depth` 是它的附件）。 */
    get native(): WebGLFramebuffer;
    /** 绘制用的 framebuffer：多重采样时挂着 renderbuffer，单采样时与 `native` 相同。 */
    get drawTarget(): WebGLFramebuffer;
    /** 是否真的做了多重采样（`sampleCount > 1`）。 */
    get multisampled(): boolean;
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
     * 多重采样时绑定的是 draw FBO（renderbuffer 附件），内容要等到 {@link resolve} 才进纹理。
     *
     * 清屏时临时关闭 `SCISSOR_TEST`：GL 的 `clearBuffer*` 会受裁剪框影响，
     * 而这里的语义应该是「清整个附件」。
     *
     * 完整性（`checkFramebufferStatus`）不在这里查：附件只在构造与 resize() 时变，
     * 所以 attach 阶段已经查过了。原来每个渲染通道都做一次同步查询是白付的。
     */
    bind(clear?: RenderTargetClearOptions): void;
    /**
     * 把多重采样的绘制结果解析（resolve）到 resolve 附件的纹理里。
     *
     * 渲染通道 `end()` 会调用它；单采样目标是空操作（`needsResolve` 恒为 false），
     * 所以不会给单采样路径加任何 GL 调用。
     *
     * `blitFramebuffer` 是 WebGL2 里唯一能把多重采样 renderbuffer 解析成单采样纹理的接口，
     * 且规范要求这种「多重采样 → 单采样」的 blit 必须用 `NEAREST`。
     */
    resolve(): void;
    resize(width: number, height: number): boolean;
    /** 幂等：重复调用不会重复通知设备。 */
    destroy(): void;
    /** `Disposable` 的别名；与 `destroy()` 等价。 */
    dispose(): void;
    /** 取某个颜色附件的 view（后处理、调试读回时用）。 */
    colorView(index?: number): WebGL2TextureView;
    /** 深度附件的 view；没有深度附件时抛错。 */
    depthStencilView(): WebGL2TextureView;
    /**
     * 创建单采样附件纹理并挂到 resolve framebuffer 上。
     *
     * 多重采样时这一步仍然要做：绘制发生在 draw FBO 的 renderbuffer 上，但结果必须有
     * 一张**纹理**来接（可采样、可读回），`blitFramebuffer` 的目标就是它。
     */
    private createAttachments;
    /** 把纹理附件挂到 resolve framebuffer 上并校验完整性。 */
    private attachTextures;
    /**
     * 分配多重采样的 renderbuffer 并挂到 draw framebuffer 上。
     *
     * GL 的多重采样 renderbuffer 只能是 `renderbufferStorageMultisample` 创建的，之后再
     * `resolve()` 到纹理 —— 这就是 `sampleCount > 1` 的全部机制。
     */
    private createMultisampleAttachments;
    /** 校验当前绑定的 framebuffer，并把绑定恢复成 `previous`。 */
    private checkComplete;
    private destroyRenderbuffers;
}
//# sourceMappingURL=WebGL2RenderTarget.d.ts.map