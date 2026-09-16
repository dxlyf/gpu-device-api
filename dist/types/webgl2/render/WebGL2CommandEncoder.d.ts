/**
 * WebGL2 的 command encoder。
 *
 * WebGL2 是立即模式：`beginRenderPass()` 会立刻绑定 framebuffer 并清屏，绘制也在录制时下发。
 * 所以这里的 `finish()` 只是一个**记账动作**，返回的 command buffer 里记录了本次编码期间
 * 下发过多少次绘制，供 `Queue.submit()` 校验与统计使用 —— 而不是一份待执行的指令列表。
 *
 * 复制类命令同样是立即生效的（`copyBufferSubData` / `blitFramebuffer`），
 * 这一点与 WebGPU 的「录制后统一提交」不同，已在 `core/sync/Queue.ts` 里写明差异。
 *
 * 生命周期上它与 WebGPU 的 encoder **没有同形缺陷**：这里的 encoder 不持有任何 GL 资源
 * （命令已经下发完了），因此 `WebGL2Device.createCommandEncoder()` 从不把它登记进设备的
 * 资源追踪集合，也没有 `dispose()`；`finish()` 只是把记账对象置为终态。
 */
import type { BufferCopyView, CommandBuffer, CommandEncoder, CommandEncoderDescriptor, TextureCopyView } from '../../core/render/CommandEncoder.js';
import type { QuerySet } from '../../core/resources/QuerySet.js';
import type { Extent3D } from '../../types/internal.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import { WebGL2RenderPassEncoder, type WebGL2RenderPassOptions } from './WebGL2RenderPassEncoder.js';
import { WebGL2ComputePassEncoder } from './WebGL2ComputePassEncoder.js';
/** `finish()` 产出的 command buffer：记录本次编码期间的统计信息。 */
export interface WebGL2CommandBuffer extends CommandBuffer {
    readonly drawCalls: number;
    readonly passCount: number;
}
export declare class WebGL2CommandEncoder implements CommandEncoder {
    readonly label: string;
    private readonly gl;
    private readonly state;
    private readonly passOptions;
    private openPass;
    private drawCalls;
    private passCount;
    private finished;
    /** 见 {@link UPLOAD_SCRATCH_BYTES}。 */
    private scratch;
    constructor(descriptor: CommandEncoderDescriptor | undefined, gl: WebGL2RenderingContext, state: GlStateCache, passOptions: WebGL2RenderPassOptions);
    /** 由渲染通道回调，用于统计。 */
    noteDrawCall(): void;
    /**
     * 开始一个 render pass。
     *
     * ## `#12`：上一个 pass 还开着时**隐式结束**它（对齐 WebGPU 原生语义）
     *
     * 改前这里抛 `ValidationError`，而 WebGPU 后端（以及原生 `GPUCommandEncoder.beginRenderPass()`）
     * 是**隐式结束**上一个 pass。于是「忘了 `pass.end()`」的调用方在 WebGPU 上正常出图、
     * 在 WebGL2 上直接抛错 —— 同一份上层代码一边正常一边崩，这是本批要消掉的那类不一致。
     *
     * 选「对齐 WebGPU」而不是「两边都抛错」的理由：
     * core 层的定位是**显式镜像 WebGPU 形状**（见 `core/Device.ts` 与 `core/render/CommandEncoder.ts`），
     * 而 WebGPU 规范里「一个 encoder 同时只能有一个打开的 pass」这条约束的**执行方式**就是
     * 「开始新 pass 时隐式结束旧的」，不是在 `end()` 之外再加一个人造错误；
     * 让 WebGL2 严格到比它镜像的对象更严，等于把 core 变成另一个 API。
     *
     * ⚠️ **这有隐藏 bug 的风险**：忘记 `pass.end()` **不会报错**，那个通道的收尾动作
     * （多重采样 resolve、时间查询 end、状态作废）只会因为这里调用了 `end()` 才发生。
     * 换句话说，写错了以后表现是「少了一次 resolve / 少了一次查询收尾」，而不是一条异常。
     * 这是 WebGPU 原生语义本身的代价，不是本后端的额外缺陷；要自查可以对着
     * `WebGL2CommandBuffer.passCount` 与预期通道数对账。
     */
    beginRenderPass(descriptor: Parameters<CommandEncoder['beginRenderPass']>[0]): WebGL2RenderPassEncoder;
    beginComputePass(): WebGL2ComputePassEncoder;
    copyBufferToBuffer(source: {
        readonly size: number;
    }, sourceOffset: number, destination: {
        readonly size: number;
    }, destinationOffset: number, size: number): void;
    /**
     * buffer → texture。**一次 `texSubImage3D` 上传整叠 image**（3D / 数组纹理的全部层），
     * 而不是逐层调用 —— GL 的 `texSubImage3D` 本来就是这样消费主机内存的
     * （层距由 `UNPACK_IMAGE_HEIGHT` = `rowsPerImage` 决定）。
     *
     * 修复前的写法只按 `bytesPerRow * height` 分配源数据，却把 `copySize.depthOrArrayLayers`
     * 原样交给 `texSubImage3D`：GL 会按「层距 = height」去读第 1 层之后的数据，读到的是缓冲区
     * 之外的内容（实测报 `INVALID_OPERATION`，而本后端默认不查 GL 错误 → 静默）。
     */
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    /**
     * texture → buffer。
     *
     * 两个修复点：
     *
     * 1. **深度/模板纹理会明确报错**（`#9`）。WebGL2 的 `readPixels` 不支持任何深度组合：
     *    规范把 `format` 限制为 `RGBA`（`UNSIGNED_BYTE` / `FLOAT`）与 `RED`（`FLOAT`），
     *    而实现的「read format」对深度附件是 `DEPTH_COMPONENT`/`UNSIGNED_INT`，两者永远对不上。
     *    本机原生探针实测：4 种深度格式 × 5 种组合**全部** `0x500 INVALID_ENUM`
     *    （`WEBGL_depth_texture` 是 WebGL1 的扩展，WebGL2 没有它）。修复前的行为是
     *    「不查错误 → 缓冲里全是 0」，调用方拿到的是一份看起来正常的全 0 数据。
     *
     * 2. **按 `copySize.depthOrArrayLayers` 逐层读回**，层号真的落到附件上
     *    （`framebufferTextureLayer`），并按 `rowsPerImage` 决定每层在目标 buffer 里的起点。
     *    修复前只读第 0 层、`rowsPerImage` 被完全忽略。
     */
    copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void;
    /**
     * texture → texture，用 `blitFramebuffer` 走 GPU 侧，避免绕 CPU 一圈。
     *
     * 修复了三个静默错误（`#8`）：
     *
     * 1. **`origin.z` 被丢弃**。修复前只解构 `x`/`y`，`z` 直接没了 —— 用数组/3D 纹理时
     *    「拷贝第 3 层」实际拷贝的是第 0 层。
     * 2. **数组/3D 纹理被挂到 `TEXTURE_2D` 附着点上**。修复前固定调
     *    `framebufferTexture2D(..., TEXTURE_2D, ...)`：这在本机实测**报错**
     *    （`0x502` + `FRAMEBUFFER_INCOMPLETE_DIMENSIONS`），而审计在另一台机器上实测
     *    「不报错、FBO 还完整」—— 两种实现的报错不同，所以「靠 GL 报错兜底」不可靠，
     *    必须在库内用 `framebufferTextureLayer` 说清楚层级。
     * 3. **深度/模板纹理被当成颜色附件**（`COLOR_ATTACHMENT0` + `COLOR_BUFFER_BIT`）。
     *    深度格式挂颜色附着点是不合法的组合，blit 请求颜色位也没有意义。
     */
    copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void;
    /**
     * 将 buffer 的一段范围清零。
     *
     * ## `#15`：校验与 WebGPU 逐条对齐（改前 WebGL2 完全没有）
     *
     * 改前这里直接把 `(offset, length)` 传给 `bufferSubData`：`offset` 随意、`length` 为 0 或负数
     * 时连一次调用都不发（静默），超范围时驱动记一条 `INVALID_VALUE` 而本后端默认不查 GL 错误。
     * 于是**同一段代码在 WebGL2 上「成功」、在 WebGPU 上抛错**，而且在 WebGL2 上留下的还是
     * 未定义结果。现在按 `WebGPUCommandEncoder.clearBuffer` 的**同一顺序**做同一组检查
     * （消息逐字相同），两个后端对同一批非法输入给出同一个 `ValidationError`。
     *
     * 放行的一侧也一并核对过：WebGPU 允许「`size` 省略时清到末尾」并要求结果仍满足 4 对齐，
     * 而 `WebGL2Buffer` 的大小本身就是 4 的倍数（见它的构造校验），所以省略 `size` 的
     * 合法用法不会被误杀。
     */
    clearBuffer(buffer: {
        readonly size: number;
    }, offset?: number, size?: number): void;
    /**
     * WebGL2 没有对应能力：GL 的查询结果不能写进 buffer，只能 `getQueryParameter()` 读回。
     * 调用它明确报错，并指出替代方案（`Device.readQuerySet()`）。
     */
    resolveQuerySet(querySet: QuerySet, firstQuery: number, queryCount: number, destination: {
        readonly size: number;
    }, destinationOffset: number): void;
    /**
     * WebGL2 没有「单个时刻的时间戳」：GL 的时间查询是 `beginQuery → endQuery` 的**区间**测量。
     * 请改用 `RenderPassDescriptor.timestampWrites`（后端会用 beginQuery/endQuery 包住整个通道）。
     */
    writeTimestamp(querySet: QuerySet, queryIndex: number): void;
    /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    insertDebugMarker(label: string): void;
    /**
     * 结束记账并返回 command buffer。
     *
     * 不需要（也没有）从设备追踪集合里摘自己：本类从不被登记（见类注释），
     * 与 WebGPU 后端在 `finish()` 里 `untrack()` 的处理对应的是同一个生命周期终点 ——
     * finish 之后本对象的其它方法都会经 `assertOpen()` 抛错。
     *
     * `#12`：还有 pass 开着时**隐式结束**它（与 WebGPU 后端、以及原生
     * `GPUCommandEncoder.finish()` 一致），不再抛错。理由与风险见 {@link beginRenderPass}。
     */
    finish(): WebGL2CommandBuffer;
    private assertOpen;
    /**
     * 隐式结束当前打开的渲染通道（`#12`，与 WebGPU 后端的 `closeOpenPass()` 同形）。
     *
     * 幂等：没有打开的通道、或它已经 `end()` 过，都是空操作。
     */
    private closeOpenPass;
    /** 取（必要时分配）零拷贝上传路径的兜底暂存区。 */
    private uploadScratch;
}
//# sourceMappingURL=WebGL2CommandEncoder.d.ts.map