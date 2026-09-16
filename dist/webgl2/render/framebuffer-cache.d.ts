/**
 * framebuffer 缓存（本文件不在原始目录清单里，是为支持「用原始 colorAttachments /
 * depthStencilAttachment 而不是 RenderTarget 开启渲染通道」而必须补的一小块）。
 *
 * `RenderTarget` 自己持有 framebuffer，但 WebGPU 形状的 `beginRenderPass` 允许直接传
 * attachment 的 texture view。WebGL2 的 framebuffer 是独立对象，必须按附件组合临时拼一个。
 * 每帧重建 framebuffer 会造成明显的对象 churn，所以这里按「附件组合」缓存。
 *
 * ## 键必须是**对象身份**，不能是 `label`
 *
 * 原来的键是 `${view.label}@${texture.label}#${width}x${height}`。`label` 是**用户可显式指定**的
 * （默认会被 `nextId` 自动唯一化，所以不是「人人中招」，但显式重名完全合法）：
 * 两张同尺寸、同显式 label 的纹理会被当成同一组附件，于是第二次 `acquire()` 直接返回第一张
 * 纹理的 framebuffer —— **画进了错误的纹理，而且不报任何错**。现在改成纹理的**对象身份**
 * （`nextId` 分配的进程内唯一 id）+ 真正影响附件语义的 mip / 层号，重名不再撞键。
 *
 * ## 淘汰必须**精准**
 *
 * 原来调用方（`WebGL2Device`）在**任意一张纹理销毁**时 `clear()` 整个缓存：一张临时纹理的
 * 生死就把全部 framebuffer 打回重建（抖动）。现在 `releaseTexture()` 只淘汰**引用了该纹理**
 * 的条目。
 *
 * ## 上限与「淘汰正在使用的条目」
 *
 * 缓存带 LRU 上限（复用 `core/pipeline/PipelineCache`）。淘汰条目时会 `deleteFramebuffer`，
 * 这是安全的 —— WebGL2 规定删除一个**当前绑定**的 framebuffer 时，该绑定点被自动重置成默认
 * 帧缓冲（WebGL2 里默认帧缓冲用 `null` 表示），所以不会留下「绑着一个已删除对象」的状态；
 * 而且本层每次 `beginRenderPass()` 与 `pass.end()` 都会重设 framebuffer 绑定
 * （见 `WebGL2RenderPassEncoder`），不会出现「以为还绑着旧对象」的情形。
 *
 * ## 下标语义：**数组下标就是片元 output location**（`#11`）
 *
 * `RenderPassDescriptor.colorAttachments` 允许出现 `null`，而 `null` **占位置**：它表示
 * 「这个 location 的片元输出被丢弃」，与 WebGPU 的
 * `GPURenderPassDescriptor.colorAttachments` 完全同形。所以这里的三件事必须一一对应：
 *
 * 1. 附件挂到 `COLOR_ATTACHMENT0 + 原始下标`（**不压缩**）；
 * 2. `drawBuffers[i]` 给出 `location i` 落到哪个附着点，空位给 `NONE`；
 * 3. 清屏用原始下标（见 `WebGL2RenderPassEncoder.clearRawAttachments`）。
 *
 * 改前第 1、2 项用的是「非空附件的压缩序号」而第 3 项用的是原始下标，于是
 * `[null, view]` 会把 `view` 挂在 attachment 0、却去清 attachment 1，
 * 而 `location 0` 的片元输出又写进 `view` —— 三处互相矛盾且**没有任何报错**。
 *
 * ## 为什么「建立时下发一次 drawBuffers」在复用（LRU 命中）时也是安全的
 *
 * `drawBuffers` 是 **framebuffer 对象自身的状态**（不像 `BLEND` 那样是上下文状态），
 * 而缓存里的每个 framebuffer 由本类独占、键里含**完整的位置信息**（空位记 `-`），
 * 所以同一组附件组合只会有一个 framebuffer、它的 `drawBuffers` 建立后不会被别人改写
 * （`WebGL2RenderTarget` 只对自己的 FBO 调 `drawBuffers`）。命中缓存时不重复下发不会跑偏。
 */
import type { RenderPassDescriptor } from '../../core/render/RenderPassEncoder.js';
import type { WebGL2Texture } from '../resources/WebGL2Texture.js';
export interface FramebufferCacheOptions {
    /** 缓存的 framebuffer 上限（LRU）。默认 64。 */
    limit?: number;
}
export declare class FramebufferCache {
    private readonly gl;
    private readonly framebuffers;
    /** 每个条目引用了哪些纹理，用于 `releaseTexture()` 的精准淘汰。 */
    private readonly references;
    /**
     * `MAX_DRAW_BUFFERS` 的惰性查询结果。
     *
     * `drawBuffers` 的参数个数不能超过它（GLES 3.0 的下限是 4），而本层现在按**逐位置**下发，
     * 所以附件槽数一旦超限就是「必然无效」的组合 —— 明确报错好过让 GL 报 `INVALID_VALUE`。
     * 查询一次就记住（与 `GlStateCache.uniformBufferOffsetAlignment()` 同样的做法）。
     */
    private maxDrawBuffersValue;
    constructor(gl: WebGL2RenderingContext, options?: FramebufferCacheOptions);
    get size(): number;
    /**
     * `MAX_DRAW_BUFFERS`：查询失败时退回 GLES 3.0 的下限 4。
     *
     * 退回而不是「放行」：一个实现没有暴露这个常量时，4 是**规范保证**的最小可用值，
     * 用 4 做上限不会误拒合法输入（超过 4 的组合在那种实现上本来就不保证成立）。
     */
    private maxDrawBuffers;
    /** 取得（必要时创建）与这组附件匹配的 framebuffer。 */
    acquire(descriptor: RenderPassDescriptor): WebGLFramebuffer;
    /**
     * 淘汰**引用了这张纹理**的条目（纹理销毁时调用）。
     *
     * 为什么不是整体 `clear()`：那会把与该纹理无关的附件组合也打回重建 —— 一张临时纹理的生死
     * 就能让整帧的 framebuffer 全部重建（抖动）。键里含纹理身份，所以只有真正引用它的条目会被摘掉。
     *
     * 被摘掉的条目对应的 framebuffer 会被 `deleteFramebuffer`：它引用的纹理已经删了，留着只会让
     * framebuffer 不完整（见类注释里「淘汰正在使用的条目」的安全性说明）。
     */
    releaseTexture(texture: WebGL2Texture): void;
    clear(): void;
    dispose(): void;
}
//# sourceMappingURL=framebuffer-cache.d.ts.map