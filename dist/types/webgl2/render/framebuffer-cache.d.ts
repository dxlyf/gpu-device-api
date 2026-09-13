/**
 * framebuffer 缓存（本文件不在原始目录清单里，是为支持「用原始 colorAttachments /
 * depthStencilAttachment 而不是 RenderTarget 开启渲染通道」而必须补的一小块）。
 *
 * `RenderTarget` 自己持有 framebuffer，但 WebGPU 形状的 `beginRenderPass` 允许直接传
 * attachment 的 texture view。WebGL2 的 framebuffer 是独立对象，必须按附件组合临时拼一个。
 * 每帧重建 framebuffer 会造成明显的对象churn，所以这里按「附件签名」缓存，
 * 被释放的纹理对应的条目在 `release()` 时清理。
 */
import type { RenderPassDescriptor } from '../../core/render/RenderPassEncoder.js';
export declare class FramebufferCache {
    private readonly gl;
    private readonly framebuffers;
    constructor(gl: WebGL2RenderingContext);
    get size(): number;
    /** 取得（必要时创建）与这组附件匹配的 framebuffer。 */
    acquire(descriptor: RenderPassDescriptor): WebGLFramebuffer;
    clear(): void;
    dispose(): void;
}
//# sourceMappingURL=framebuffer-cache.d.ts.map