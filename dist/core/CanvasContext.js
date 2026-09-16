/**
 * swap chain 表面。
 *
 * WebGPU 需要先把 canvas context 配置到某个 device 上，然后才能获取帧纹理；
 * WebGL2 则有一个隐式的默认帧缓冲。两者都隐藏在这个接口之后，
 * 因此 `RenderPassEncoder` 只会看到 {@link FrameTarget}。
 */
/** 画布深度的默认格式；两个后端都用它（WebGL2 的默认帧缓冲深度不接受格式参数，这里只用于状态解析）。 */
export const CANVAS_DEPTH_FORMAT = 'depth24plus';
/** 读取 canvas 元素的 CSS 尺寸，读取不到时回退到其属性尺寸。 */
export function measureCanvas(canvas) {
    const element = canvas;
    if (typeof element.clientWidth === 'number' && typeof element.clientHeight === 'number') {
        return { width: element.clientWidth || element.width || 1, height: element.clientHeight || element.height || 1 };
    }
    return { width: canvas.width || 1, height: canvas.height || 1 };
}
/** `devicePixelRatio`，会被限制在合理范围内；在浏览器之外返回 1。 */
export function defaultPixelRatio() {
    const ratio = typeof globalThis !== 'undefined' ? globalThis.devicePixelRatio : 1;
    return ratio && ratio > 0 ? Math.min(ratio, 4) : 1;
}
//# sourceMappingURL=CanvasContext.js.map