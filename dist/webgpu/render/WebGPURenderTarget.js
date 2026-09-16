/**
 * WebGPU 离屏 render target：color（可多个）+ 可选 depth/stencil 的 texture 集合。
 *
 * MSAA 的处理方式与 WebGPU 一致：`sampleCount > 1` 时每路 color 各建两张 texture ——
 * 一张多重采样 texture 作为真正的 attachment（`view`），一张单采样 texture 作为 resolve
 * 目标（`resolveTarget`）。`colors[i]` 返回的是**单采样那张**，因为那才是可以被采样/拷贝的结果；
 * 多重采样 texture 通过 `multisampleTextures` 暴露。
 *
 * `createPassDescriptor()` 负责把 `loadOp` / `storeOp` / `clearValue` 填成 WebGPU 需要的形态
 * （`GPURenderPassColorAttachment` 要求 loadOp、storeOp 必填），而 `colorAttachments` 属性给出
 * 一份「默认 clear + store」的现成列表，可直接丢给 `beginRenderPass`。
 */
import { RowOrder } from '../../core/render/RenderTarget.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { TextureUsage as TextureUsageFlags } from '../../core/enums/TextureUsage.js';
import { isDepthStencilFormat } from '../../core/enums/TextureFormat.js';
import { assertSampleCount } from '../utils/wgpuEnumMap.js';
import { hasStencilAspect } from '../utils/wgpuFormatMap.js';
/** 默认清屏颜色：不透明黑（与 WebGPU 的 depth clear 默认值 1 不同，color 用黑更符合直觉）。 */
const DEFAULT_CLEAR_COLOR = [0, 0, 0, 1];
export class WebGPURenderTarget {
    label;
    device;
    colorFormatsList;
    depthFormatValue;
    sampleCountValue;
    mipLevelCountValue;
    baseUsage;
    sampled;
    _width;
    _height;
    colorTextures = [];
    colorViews = [];
    multisampleTextureList = [];
    multisampleViews = [];
    depthTexture = null;
    depthView = null;
    _disposed = false;
    constructor(device, descriptor) {
        this.device = device;
        this.label = descriptor.label ?? `renderTarget#${device.nextResourceId('renderTarget')}`;
        const formats = normalizeColorFormats(descriptor.color);
        this.colorFormatsList = formats;
        // `depth: true` 是 core 提供的简写，等价于 `'depth24plus'`。
        this.depthFormatValue =
            descriptor.depth === undefined || descriptor.depth === false || descriptor.depth === null
                ? null
                : descriptor.depth === true
                    ? 'depth24plus'
                    : descriptor.depth;
        this.sampleCountValue = assertSampleCount(descriptor.sampleCount ?? 1, `RenderTarget "${this.label}"`);
        this.mipLevelCountValue = descriptor.mipLevelCount ?? 1;
        this.baseUsage = descriptor.usage ?? 0;
        this.sampled = descriptor.sampled ?? false;
        this._width = resolveSize(descriptor.width, 'width', this.label);
        this._height = resolveSize(descriptor.height, 'height', this.label);
        if (this.colorFormatsList.length === 0 && this.depthFormatValue === null) {
            throw new ValidationError(`[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`);
        }
        if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1) {
            throw new ValidationError(`[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`);
        }
        if (this.depthFormatValue !== null && !isDepthStencilFormat(this.depthFormatValue)) {
            throw new ValidationError(`[gpu-device-api] RenderTarget "${this.label}": depth format "${this.depthFormatValue}" is not a ` +
                'depth/stencil format.');
        }
        this.rebuild();
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get colorFormats() {
        return this.colorFormatsList;
    }
    get colorFormat() {
        return this.colorFormatsList[0] ?? 'rgba8unorm';
    }
    get depthFormat() {
        return this.depthFormatValue;
    }
    get sampleCount() {
        return this.sampleCountValue;
    }
    get mipLevelCount() {
        return this.mipLevelCountValue;
    }
    /**
     * WebGPU 的原生行序：附件纹素 (0, 0) 在**左上角**，与 `Texture.ts` 的纹理约定天然一致。
     *
     * 所以这个后端不需要任何补偿；这个只读属性存在的意义是让跨后端代码能按
     * `target.rowOrder` 判断，而不是写 `backend === 'webgl2'`。
     */
    rowOrder = RowOrder.TopLeft;
    /** 单采样 color texture（MSAA 时是 resolve 目标）；索引 0 为主 texture。 */
    get colors() {
        return this.colorTextures;
    }
    /** MSAA 时真正的 attachment texture；`sampleCount === 1` 时为空数组。 */
    get multisampleTextures() {
        return this.multisampleTextureList;
    }
    get depth() {
        return this.depthTexture;
    }
    /** 现成的 attachment 列表：默认 `clear` + `store`，可直接交给 `beginRenderPass`。 */
    get colorAttachments() {
        return this.buildAttachments(undefined, undefined, undefined);
    }
    get depthStencilAttachment() {
        return this.buildDepthAttachment(undefined, undefined);
    }
    get disposed() {
        return this._disposed;
    }
    /** 调整尺寸并重建 texture；尺寸不变时返回 false（不重建）。 */
    resize(width, height) {
        if (this._disposed) {
            throw new ValidationError(`[gpu-device-api] RenderTarget "${this.label}" has been disposed.`);
        }
        const nextWidth = resolveSize(width, 'width', this.label);
        const nextHeight = resolveSize(height, 'height', this.label);
        if (nextWidth === this._width && nextHeight === this._height)
            return false;
        this._width = nextWidth;
        this._height = nextHeight;
        this.rebuild();
        return true;
    }
    /** 按给定的清除行为创建 render pass descriptor 的两份 attachment 列表。 */
    createPassDescriptor(options = {}) {
        return {
            colorAttachments: this.buildAttachments(options.loadOp, options.storeOp, options.clearValue),
            depthStencilAttachment: this.buildDepthAttachment(options.depthLoadOp, options.depthClearValue),
        };
    }
    /** 销毁全部 texture。幂等。 */
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        this.releaseTextures();
        this.device.untrack(this);
    }
    /** `Disposable` 的别名。 */
    dispose() {
        this.destroy();
    }
    /* ------------------------------------------------------------------ 内部 -------------- */
    rebuild() {
        this.releaseTextures();
        const size = { width: this._width, height: this._height };
        this.colorTextures = this.colorFormatsList.map((format, index) => {
            const sampled = this.sampled ? TextureUsageFlags.TextureBinding : TextureUsageFlags.None;
            return this.device.createTexture({
                label: `${this.label}#color${index}`,
                size,
                format,
                usage: TextureUsageFlags.RenderAttachment | sampled | this.baseUsage,
                mipLevelCount: this.mipLevelCountValue,
            });
        });
        this.colorViews = this.colorTextures.map((texture) => texture.createView({ label: `${texture.label}#view` }));
        if (this.sampleCountValue > 1) {
            this.multisampleTextureList = this.colorFormatsList.map((format, index) => this.device.createTexture({
                label: `${this.label}#msaa${index}`,
                size,
                format,
                usage: TextureUsageFlags.RenderAttachment,
                sampleCount: this.sampleCountValue,
            }));
            this.multisampleViews = this.multisampleTextureList.map((texture) => texture.createView({ label: `${texture.label}#view` }));
        }
        if (this.depthFormatValue !== null) {
            this.depthTexture = this.device.createTexture({
                label: `${this.label}#depth`,
                size,
                format: this.depthFormatValue,
                usage: TextureUsageFlags.RenderAttachment | this.baseUsage,
                sampleCount: this.sampleCountValue,
            });
            this.depthView = this.depthTexture.createView({ label: `${this.depthTexture.label}#view` });
        }
    }
    releaseTextures() {
        for (const texture of this.colorTextures)
            texture.destroy();
        for (const texture of this.multisampleTextureList)
            texture.destroy();
        this.depthTexture?.destroy();
        this.colorTextures = [];
        this.colorViews = [];
        this.multisampleTextureList = [];
        this.multisampleViews = [];
        this.depthTexture = null;
        this.depthView = null;
    }
    buildAttachments(loadOp, storeOp, clearValue) {
        const resolvedClear = clearValue === undefined ? DEFAULT_CLEAR_COLOR : clearValue;
        return this.colorFormatsList.map((_format, index) => {
            const msaaView = this.multisampleViews[index];
            const colorView = this.colorViews[index];
            const attachment = {
                view: msaaView ?? colorView,
                loadOp: loadOp ?? 'clear',
                storeOp: storeOp ?? 'store',
                clearValue: resolvedClear,
            };
            if (msaaView)
                attachment.resolveTarget = colorView;
            return attachment;
        });
    }
    buildDepthAttachment(depthLoadOp, depthClearValue) {
        if (!this.depthView || this.depthFormatValue === null)
            return null;
        const attachment = {
            view: this.depthView,
            depthLoadOp: depthLoadOp ?? 'clear',
            depthStoreOp: 'store',
            depthClearValue: depthClearValue ?? 1,
            depthReadOnly: false,
        };
        if (hasStencilAspect(this.depthFormatValue)) {
            attachment.stencilLoadOp = depthLoadOp ?? 'clear';
            attachment.stencilStoreOp = 'store';
            attachment.stencilClearValue = 0;
            attachment.stencilReadOnly = false;
        }
        return attachment;
    }
}
function normalizeColorFormats(color) {
    if (color === undefined)
        return ['rgba8unorm'];
    if (typeof color === 'string')
        return [color];
    if (color.length === 0)
        return [];
    return color;
}
function resolveSize(value, name, label) {
    if (value === undefined)
        return 1;
    if (!Number.isInteger(value) || value <= 0) {
        throw new ValidationError(`[gpu-device-api] RenderTarget "${label}": ${name} must be a positive integer, got ${String(value)}.`);
    }
    return value;
}
//# sourceMappingURL=WebGPURenderTarget.js.map