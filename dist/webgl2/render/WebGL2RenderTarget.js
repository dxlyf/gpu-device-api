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
import { ValidationError } from '../../core/errors/ValidationError.js';
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import { RowOrder } from '../../core/render/RenderTarget.js';
import { nextId } from '../../utils/id.js';
import { glFormat } from '../utils/glFormatMap.js';
import { resolveClearColor } from '../utils/glEnumMap.js';
import { asWebGL2TextureView } from '../cast.js';
/**
 * 清屏用的共享暂存数组（#35）。
 *
 * 为什么可以共享：`clearBufferfv` 会**同步**把数组内容拷进 GL，调用返回之后这块数组
 * 与 GPU 状态再无关系，所以「每次清屏 new 一块」是纯粹的白付 —— 而每个渲染通道建立时
 * 都要清一次屏（多附件时每附件一次），长期运行就是每帧几块到十几块小数组。
 *
 * 唯一的使用纪律：只在本文件与 `WebGL2RenderPassEncoder` 的清屏代码里**临时写入后立刻调用**，
 * 不要跨调用保存它，也不要把它交给用户代码（那样才会出现别名问题）。
 * 这两块数组与 2a 的共享零缓冲（`WebGL2CommandEncoder.clearBuffer`）是同一个思路。
 */
export const CLEAR_COLOR_SCRATCH = new Float32Array(4);
/** 一维深度清屏值（`clearBufferfv(DEPTH, 0, ...)` 只取第一个元素）。 */
export const CLEAR_DEPTH_SCRATCH = new Float32Array(1);
/** 把 `[r, g, b, a]` 写进共享的颜色暂存数组并返回它（避免每次清屏都分配）。 */
export function writeClearColor(r, g, b, a) {
    CLEAR_COLOR_SCRATCH[0] = r;
    CLEAR_COLOR_SCRATCH[1] = g;
    CLEAR_COLOR_SCRATCH[2] = b;
    CLEAR_COLOR_SCRATCH[3] = a;
    return CLEAR_COLOR_SCRATCH;
}
/**
 * 附件 view → 它所属的渲染目标。
 *
 * 为什么要这张表：`Renderer` 这类上层代码走的是「用 `createPassDescriptor()` 拿附件列表、
 * 再交给 `beginRenderPass`」的路径（这也是 WebGPU 的写法），而不是把 `target` 直接传下去。
 * 渲染通道靠这张表才能认出「这组附件属于一个多重采样目标」，从而绑定 draw FBO 并在
 * `end()` 时 resolve —— 否则会静默地按单采样渲染（多重采样被无声忽略）。
 *
 * 用 `WeakMap`：不阻止渲染目标被回收，也不需要在 destroy 时手工反注册。
 */
const viewOwners = new WeakMap();
/** 取某个附件 view 所属的渲染目标；不属于任何目标（或目标已销毁）时返回 null。 */
export function webgl2RenderTargetOfView(view) {
    if (!view || typeof view !== 'object')
        return null;
    const owner = viewOwners.get(view);
    return owner && !owner.disposed ? owner : null;
}
export class WebGL2RenderTarget {
    label;
    colorFormats;
    depthFormat;
    sampleCount;
    mipLevelCount;
    /**
     * GL 的原生行序：FBO 附着点的原点在左下，纹理自下而上存储，纹素第 0 行是画面底端。
     *
     * 本层如实上报，**不做翻转**（要统一请看 `RenderTarget.RowOrder` 的说明）。
     */
    rowOrder = RowOrder.BottomUp;
    gl;
    state;
    options;
    /** resolve 用的 framebuffer：附件是单采样纹理，`colors` / `depth` 就是它的附件。 */
    framebuffer;
    /**
     * 绘制用的 framebuffer。
     *
     * `sampleCount === 1` 时**就是** `framebuffer`（与从前完全一致）；
     * 多重采样时是另一个挂着 renderbuffer 的 FBO。
     */
    drawFramebuffer;
    colorTextures;
    depthTexture;
    colorViews = [];
    depthView = null;
    /** 多重采样的颜色附件；单采样时为空数组。 */
    colorRenderbuffers = [];
    /** 多重采样的深度附件；没有深度附件或单采样时为 null。 */
    depthRenderbuffer = null;
    /** 本帧的绘制内容还没解析到 resolve 附件里。 */
    needsResolve = false;
    _width;
    _height;
    _disposed = false;
    constructor(descriptor, options) {
        const gl = options.gl;
        const width = descriptor.width ?? gl.drawingBufferWidth;
        const height = descriptor.height ?? gl.drawingBufferHeight;
        if (width <= 0 || height <= 0) {
            throw new ValidationError(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${width}x${height}。` +
                '未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。');
        }
        const colorFormats = normalizeColorFormats(descriptor.color);
        if (colorFormats.length > 4) {
            throw new ValidationError(`[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${colorFormats.length} 个。`);
        }
        for (const format of colorFormats) {
            if (!glFormat(format).attachment) {
                throw new ValidationError(`[gpu-device-api] 纹理格式「${format}」在 WebGL2 下不能作为颜色附件。`);
            }
        }
        const depthFormat = normalizeDepthFormat(descriptor.depth);
        if (depthFormat !== null && !glFormat(depthFormat).depth) {
            throw new ValidationError(`[gpu-device-api] 深度附件格式「${depthFormat}」不是深度格式。`);
        }
        this.gl = gl;
        this.state = options.state;
        this.options = options;
        this.label = descriptor.label ?? nextId('renderTarget');
        this._width = width;
        this._height = height;
        /*
         * `mipLevelCount` 在 WebGL2 上**做不到**，所以这里是明确报错而不是静默忽略（`#13`）。
         *
         * 原因：GL 的 FBO 附件只寻址第 0 mip 级（`framebufferTexture2D` 的 `level` 参数是有的，
         * 但一个 FBO 只能挂某一级，而渲染通道的绘制目标就是它），所以
         * 「渲染进第 1 级」这件事在 WebGL2 里没有任何表达方式；而附件纹理上虽然可以用
         * `texStorage2D` 分配出整条 mip 链，但本后端的 `createAttachmentTexture` 拿不到这个字段，
         * 于是 `target.mipLevelCount` 会对外宣称有 2 级、实际只有 1 级 —— 又是一次静默不一致。
         *
         * WebGPU 侧对「多重采样目标 + mipLevelCount > 1」本来也是拒绝的（见 `WebGPURenderTarget`），
         * 两个后端在这里保持一致。
         *
         * 需要 mip 链请自己建一张带 mip 的纹理（`device.createTexture({ mipLevelCount })`）并
         * `generateMipmaps()`，或渲染到单级目标后再拷贝。
         */
        if (descriptor.mipLevelCount !== undefined && descriptor.mipLevelCount !== 1) {
            throw new ValidationError(`[gpu-device-api] createRenderTarget: mipLevelCount ${String(descriptor.mipLevelCount)} is not ` +
                'supported by the WebGL2 backend for render targets. A GL framebuffer attachment always ' +
                'addresses mip level 0, so a render target can never write into a higher mip level — the ' +
                'field would be silently ignored (and the attachments would still only have one level). ' +
                'Create a texture with an explicit mipLevelCount and call generateMipmaps() after rendering ' +
                'into level 0, or render into a single-level target and copy the result.');
        }
        /*
         * `sampled` 在 WebGL2 上也是**无法被尊重**的（`#13`）：GL 的纹理只要绑到纹理单元就能采样，
         * 没有「这张纹理不可采样」的表达方式。`sampled: true`（以及不填）与 WebGL2 的实际行为一致，
         * 如实放行；`sampled: false` 则会静默地失效 —— 报错说明。
         */
        if (descriptor.sampled === false) {
            throw new ValidationError('[gpu-device-api] createRenderTarget: sampled: false cannot be honoured on WebGL2. In GL, any ' +
                'texture can be bound to a texture unit and sampled — there is no per-texture "not ' +
                'sampleable" state, and this backend never validates TextureUsage. Leave the field out ' +
                '(sampled: true is already what WebGL2 does), or keep the render output in a texture you ' +
                'never bind.');
        }
        this.mipLevelCount = descriptor.mipLevelCount ?? 1;
        this.colorFormats = colorFormats;
        this.depthFormat = depthFormat;
        this.sampleCount = assertSampleCountSupported(gl, descriptor.sampleCount ?? 1, this.label, colorFormats, depthFormat);
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
            throw new ValidationError('[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。');
        }
        this.framebuffer = framebuffer;
        if (this.sampleCount > 1) {
            const drawFramebuffer = gl.createFramebuffer();
            if (!drawFramebuffer) {
                gl.deleteFramebuffer(this.framebuffer);
                throw new ValidationError('[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建多重采样的绘制 framebuffer。');
            }
            this.drawFramebuffer = drawFramebuffer;
        }
        else {
            this.drawFramebuffer = this.framebuffer;
        }
        this.colorTextures = [];
        this.depthTexture = null;
        this.createAttachments(descriptor.usage ?? 0);
        if (this.sampleCount > 1)
            this.createMultisampleAttachments();
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get colorFormat() {
        return this.colorFormats[0];
    }
    get colors() {
        return this.colorTextures;
    }
    get depth() {
        return this.depthTexture;
    }
    /** resolve 用的 framebuffer（`colors` / `depth` 是它的附件）。 */
    get native() {
        return this.framebuffer;
    }
    /** 绘制用的 framebuffer：多重采样时挂着 renderbuffer，单采样时与 `native` 相同。 */
    get drawTarget() {
        return this.drawFramebuffer;
    }
    /** 是否真的做了多重采样（`sampleCount > 1`）。 */
    get multisampled() {
        return this.sampleCount > 1;
    }
    get disposed() {
        return this._disposed;
    }
    get colorAttachments() {
        return this.colorViews.map((view) => ({
            view,
            loadOp: 'clear',
            storeOp: 'store',
        }));
    }
    get depthStencilAttachment() {
        if (!this.depthView)
            return null;
        return {
            view: this.depthView,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            depthClearValue: 1,
        };
    }
    createPassDescriptor(options = {}) {
        const colorAttachments = this.colorViews.map((view) => ({
            view,
            loadOp: options.loadOp ?? 'clear',
            storeOp: options.storeOp ?? 'store',
            clearValue: options.clearValue,
        }));
        const depthStencilAttachment = this.depthView
            ? {
                view: this.depthView,
                depthLoadOp: options.depthLoadOp ?? 'clear',
                depthStoreOp: 'store',
                depthClearValue: options.depthClearValue ?? 1,
            }
            : null;
        return { colorAttachments, depthStencilAttachment };
    }
    /**
     * 绑定 framebuffer 并按需清屏。渲染通道开始绘制前调用。
     *
     * 多重采样时绑定的是 draw FBO（renderbuffer 附件），内容要等到 {@link resolve} 才进纹理。
     *
     * ## `#14`：每个 pass 开始时 scissor 都必须是「整个附件、关闭」的已知状态
     *
     * 改前这一句 `setScissor(false, ...)` 只在 `needsClear` 分支里下发。于是「上一个 pass 设过
     * `setScissorRect` → 本 pass 的颜色与深度**都是** `load`」这条缝里，`SCISSOR_TEST` 会保持
     * 上一个 pass 留下的「开着 + 旧矩形」状态：
     *
     * - `WebGL2RenderPassEncoder.end()` 会 `state.invalidate()`，缓存因此**声称** scissor 是关的，
     *   而 GL 里其实是开的 —— 缓存与驱动不一致；
     * - 后果是后续所有绘制被静默裁进上一个 pass 的矩形里（WebGPU 的行为是每个 pass 重置成整个附件）。
     *
     * 所以现在**无条件**下发（清屏与不清屏两条路都走），不再依赖别的分支的副作用。
     * 关闭 `SCISSOR_TEST` 之后再把它设成整个附件：`GlStateCache` 的去重键只记「关」这一位，
     * 不重设矩形的话，某个 pass 里第一次 `setScissorRect` 可能因为「缓存说矩形没变」而漏掉
     * `gl.scissor()`，于是拿着更早那个 pass 的矩形去裁剪。
     *
     * 完整性（`checkFramebufferStatus`）不在这里查：附件只在构造与 resize() 时变，
     * 所以 attach 阶段已经查过了。原来每个渲染通道都做一次同步查询是白付的。
     */
    bind(clear = {}) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.drawFramebuffer);
        this.needsResolve = this.sampleCount > 1;
        this.resetScissor();
        const needsClear = clear.loadOp !== 'load' || (this.depthTexture !== null && clear.depthLoadOp !== 'load');
        if (needsClear) {
            if (clear.loadOp !== 'load') {
                const [r, g, b, a] = resolveClearColor(clear.clearColor);
                // 复用共享暂存数组（`clearBufferfv` 立刻拷贝，多附件因此可以共用同一块）。
                const values = writeClearColor(r, g, b, a);
                for (let index = 0; index < this.colorTextures.length; index++) {
                    gl.clearBufferfv(gl.COLOR, index, values);
                }
            }
            if (this.depthTexture && clear.depthLoadOp !== 'load') {
                const format = glFormat(this.depthFormat);
                // 深度与模板的写掩码必须临时打开，否则清屏会被静默忽略（GL 的清屏受写掩码限制）：
                // 上一条管线的 `stencilWriteMask` 为 0 时，清模板那一半是空操作。
                this.state.prepareClear(format.stencil);
                if (format.stencil) {
                    gl.clearBufferfi(gl.DEPTH_STENCIL, 0, clear.clearDepth ?? 1, clear.clearStencil ?? 0);
                }
                else {
                    CLEAR_DEPTH_SCRATCH[0] = clear.clearDepth ?? 1;
                    gl.clearBufferfv(gl.DEPTH, 0, CLEAR_DEPTH_SCRATCH);
                }
                this.state.invalidate();
            }
        }
        gl.viewport(0, 0, this._width, this._height);
        this.state.setViewport(0, 0, this._width, this._height);
    }
    /**
     * 把 scissor 状态复位成「关掉 + 整个附件」（`#14`）。
     *
     * 实现在 `GlStateCache.resetScissor()` 里（那里还能把「已经复位」的情况免掉 GL 调用），
     * 这里只是把本目标的尺寸传过去。
     */
    resetScissor() {
        this.state.resetScissor(this._width, this._height);
    }
    /**
     * 把多重采样的绘制结果解析（resolve）到 resolve 附件的纹理里。
     *
     * 渲染通道 `end()` 会调用它；单采样目标是空操作（`needsResolve` 恒为 false），
     * 所以不会给单采样路径加任何 GL 调用。
     *
     * `blitFramebuffer` 是 WebGL2 里唯一能把多重采样 renderbuffer 解析成单采样纹理的接口，
     * 且规范要求这种「多重采样 → 单采样」的 blit 必须用 `NEAREST`。
     */
    resolve() {
        if (!this.needsResolve || this._disposed)
            return;
        this.needsResolve = false;
        const gl = this.gl;
        const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.drawFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);
        const mask = this.depthRenderbuffer === null
            ? gl.COLOR_BUFFER_BIT
            : gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
        gl.blitFramebuffer(0, 0, this._width, this._height, 0, 0, this._width, this._height, mask, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
        // 改了 READ/DRAW 绑定与附件内容，状态缓存里的 viewport/scissor 记录仍然有效，
        // 但 framebuffer 本身不在缓存里 —— 与 attach() 一样作废一次，避免后续判断失准。
        this.state.invalidate();
    }
    resize(width, height) {
        if (width === this._width && height === this._height)
            return false;
        if (width <= 0 || height <= 0) {
            throw new ValidationError(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${width}x${height}。`);
        }
        this._width = width;
        this._height = height;
        // 纹理用的是不可变存储，改尺寸只能重建。
        for (const texture of this.colorTextures)
            texture.destroy();
        this.depthTexture?.destroy();
        this.colorTextures = [];
        this.depthTexture = null;
        this.colorViews = [];
        this.depthView = null;
        this.createAttachments(0);
        if (this.sampleCount > 1) {
            this.destroyRenderbuffers();
            this.createMultisampleAttachments();
        }
        return true;
    }
    /** 幂等：重复调用不会重复通知设备。 */
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        for (const texture of this.colorTextures)
            texture.destroy();
        this.depthTexture?.destroy();
        this.colorTextures = [];
        this.depthTexture = null;
        this.colorViews = [];
        this.depthView = null;
        this.destroyRenderbuffers();
        this.gl.deleteFramebuffer(this.framebuffer);
        if (this.drawFramebuffer !== this.framebuffer)
            this.gl.deleteFramebuffer(this.drawFramebuffer);
        this.options.onDispose?.(this);
    }
    /** `Disposable` 的别名；与 `destroy()` 等价。 */
    dispose() {
        this.destroy();
    }
    /** 取某个颜色附件的 view（后处理、调试读回时用）。 */
    colorView(index = 0) {
        const view = this.colorViews[index];
        if (!view) {
            throw new ValidationError(`[gpu-device-api] 渲染目标「${this.label}」没有第 ${index} 个颜色附件（共 ${this.colorViews.length} 个）。`);
        }
        return view;
    }
    /** 深度附件的 view；没有深度附件时抛错。 */
    depthStencilView() {
        if (!this.depthView) {
            throw new ValidationError(`[gpu-device-api] 渲染目标「${this.label}」没有深度附件。`);
        }
        return this.depthView;
    }
    /**
     * 创建单采样附件纹理并挂到 resolve framebuffer 上。
     *
     * 多重采样时这一步仍然要做：绘制发生在 draw FBO 的 renderbuffer 上，但结果必须有
     * 一张**纹理**来接（可采样、可读回），`blitFramebuffer` 的目标就是它。
     */
    createAttachments(extraUsage) {
        const colorUsage = TextureUsage.RenderAttachment | TextureUsage.TextureBinding | TextureUsage.CopySrc | extraUsage;
        this.colorTextures = this.colorFormats.map((format, index) => this.options.createTexture(format, this._width, this._height, colorUsage, `${this.label}:color${index}`));
        this.depthTexture =
            this.depthFormat === null
                ? null
                : this.options.createTexture(this.depthFormat, this._width, this._height, TextureUsage.RenderAttachment | TextureUsage.TextureBinding, `${this.label}:depth`);
        this.colorViews = this.colorTextures.map((texture) => asWebGL2TextureView(texture.createView()));
        this.depthView = this.depthTexture ? asWebGL2TextureView(this.depthTexture.createView()) : null;
        for (const view of this.colorViews)
            viewOwners.set(view, this);
        if (this.depthView)
            viewOwners.set(this.depthView, this);
        this.attachTextures();
    }
    /** 把纹理附件挂到 resolve framebuffer 上并校验完整性。 */
    attachTextures() {
        const gl = this.gl;
        const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.colorTextures.forEach((texture, index) => {
            const attachment = gl.COLOR_ATTACHMENT0 + index;
            if (texture.dimension === '3d' || texture.depthOrArrayLayers > 1) {
                gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, texture.native, 0, 0);
            }
            else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.native, 0);
            }
        });
        gl.drawBuffers(this.colorTextures.map((_texture, index) => gl.COLOR_ATTACHMENT0 + index));
        if (this.depthTexture) {
            const format = glFormat(this.depthFormat);
            const attachment = format.stencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, this.depthTexture.native, 0);
        }
        else {
            // 没有深度附件时必须显式解绑，否则 framebuffer 里可能残留上一次的附件。
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.TEXTURE_2D, null, 0);
        }
        this.checkComplete('framebuffer 不完整', previous);
    }
    /**
     * 分配多重采样的 renderbuffer 并挂到 draw framebuffer 上。
     *
     * GL 的多重采样 renderbuffer 只能是 `renderbufferStorageMultisample` 创建的，之后再
     * `resolve()` 到纹理 —— 这就是 `sampleCount > 1` 的全部机制。
     */
    createMultisampleAttachments() {
        const gl = this.gl;
        const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.drawFramebuffer);
        this.colorRenderbuffers = this.colorFormats.map((format) => {
            const renderbuffer = gl.createRenderbuffer();
            if (!renderbuffer) {
                throw new ValidationError(`[gpu-device-api] RenderTarget "${this.label}": gl.createRenderbuffer() returned null while ` +
                    'allocating the multisampled colour attachment.');
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.sampleCount, glFormat(format).internalFormat, this._width, this._height);
            return renderbuffer;
        });
        this.colorRenderbuffers.forEach((renderbuffer, index) => {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + index, gl.RENDERBUFFER, renderbuffer);
        });
        gl.drawBuffers(this.colorRenderbuffers.map((_renderbuffer, index) => gl.COLOR_ATTACHMENT0 + index));
        if (this.depthFormat !== null) {
            const format = glFormat(this.depthFormat);
            const renderbuffer = gl.createRenderbuffer();
            if (!renderbuffer) {
                throw new ValidationError(`[gpu-device-api] RenderTarget "${this.label}": gl.createRenderbuffer() returned null while ` +
                    'allocating the multisampled depth attachment.');
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.sampleCount, format.internalFormat, this._width, this._height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, format.stencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
            this.depthRenderbuffer = renderbuffer;
        }
        this.checkComplete('多重采样的 framebuffer 不完整', previous);
    }
    /** 校验当前绑定的 framebuffer，并把绑定恢复成 `previous`。 */
    checkComplete(reason, previous) {
        const gl = this.gl;
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
        // framebuffer 的绑定没有被状态缓存跟踪，这里作废缓存以免 drawBuffers 等状态判断失准。
        this.state.invalidate();
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            const hint = this.sampleCount > 1
                ? `\n多重采样目标（sampleCount=${this.sampleCount}）最常见的原因是：这个采样数不被该格式组合支持，` +
                    '或者颜色/深度附件的采样数、尺寸不一致。请换一个采样数（常见可用值：2、4），或降到 1。'
                : '';
            throw new ValidationError(`[gpu-device-api] 渲染目标「${this.label}」的 ${reason}（格式组合在 WebGL2 下不受支持）。` +
                `颜色附件：${this.colorFormats.join('、')}；深度附件：${this.depthFormat ?? '无'}。` +
                `GL 状态码：0x${status.toString(16)}。` +
                (status === gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE ? hint : ''));
        }
    }
    destroyRenderbuffers() {
        for (const renderbuffer of this.colorRenderbuffers)
            this.gl.deleteRenderbuffer(renderbuffer);
        this.colorRenderbuffers = [];
        if (this.depthRenderbuffer) {
            this.gl.deleteRenderbuffer(this.depthRenderbuffer);
            this.depthRenderbuffer = null;
        }
    }
}
function normalizeColorFormats(color) {
    if (color === undefined)
        return ['rgba8unorm'];
    if (typeof color === 'string')
        return [color];
    const list = [...color];
    if (list.length === 0) {
        throw new ValidationError('[gpu-device-api] 渲染目标的 color 数组不能为空。');
    }
    return list;
}
function normalizeDepthFormat(depth) {
    if (depth === undefined || depth === null || depth === false)
        return null;
    if (depth === true)
        return 'depth24plus';
    return depth;
}
/**
 * 校验请求的采样数，返回规范化后的值（1 或请求值）。
 *
 * 三道检查与顺序都和「明确报错」的目标一致：
 * 1. 必须是正整数；
 * 2. 不能超过 `MAX_SAMPLES`（`getParameter` 是一次同步查询，只在创建时做一次）；
 * 3. 必须在该格式通过 `getInternalformatParameter(RENDERBUFFER, internalFormat, SAMPLES)`
 *    报告的可用集合里 —— 这一步能提前拦下「MAX_SAMPLES 够大但某个格式不支持」的情况，
 *    否则错误会推迟到 attach 之后的 `FRAMEBUFFER_INCOMPLETE_MULTISAMPLE`（更难定位）。
 */
function assertSampleCountSupported(gl, sampleCount, label, colorFormats, depthFormat) {
    if (!Number.isInteger(sampleCount) || sampleCount < 1) {
        throw new ValidationError(`[gpu-device-api] RenderTarget "${label}": sampleCount must be a positive integer, got ` +
            `${String(sampleCount)}.`);
    }
    if (sampleCount === 1)
        return 1;
    const maxSamples = Number(gl.getParameter(gl.MAX_SAMPLES) ?? 0);
    if (!Number.isFinite(maxSamples) || maxSamples < sampleCount) {
        throw new ValidationError(`[gpu-device-api] RenderTarget "${label}": sampleCount ${sampleCount} is not supported by this ` +
            `device (MAX_SAMPLES = ${String(maxSamples) || 'unknown'}). WebGL2 has no fallback: the sample ` +
            'count of a render target is fixed at creation, so this library will not silently use 1. ' +
            'Use sampleCount 1, or a smaller supported sample count.');
    }
    const requested = [
        ...colorFormats.map((format) => ({ kind: 'colour', format })),
        ...(depthFormat === null ? [] : [{ kind: 'depth', format: depthFormat }]),
    ];
    for (const { kind, format } of requested) {
        const supported = gl.getInternalformatParameter(gl.RENDERBUFFER, glFormat(format).internalFormat, gl.SAMPLES);
        // 实现可能直接返回 null（查询失败）；那时交给 attach 之后的完整性检查兜底。
        if (!supported || supported.length === 0)
            continue;
        if (!Array.from(supported).includes(sampleCount)) {
            throw new ValidationError(`[gpu-device-api] RenderTarget "${label}": the ${kind} format "${format}" does not support ` +
                `sampleCount ${sampleCount} on this device (supported: ${Array.from(supported).join(', ')}). ` +
                'WebGL2 cannot resolve an unsupported multisample format, and this library will not silently ' +
                'fall back to 1. Pick one of the supported sample counts, or use sampleCount 1.');
        }
    }
    return sampleCount;
}
//# sourceMappingURL=WebGL2RenderTarget.js.map