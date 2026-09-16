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
import { ValidationError } from '../../core/errors/ValidationError.js';
import { assertNonNegativeInteger } from '../../utils/assert.js';
import { nextId } from '../../utils/id.js';
import { glFormat } from '../utils/glFormatMap.js';
import { repackRows, resolveReadbackLayout, resolveUploadLayout, uploadTextureData, } from '../utils/copyLayout.js';
import { WebGL2RenderPassEncoder } from './WebGL2RenderPassEncoder.js';
import { WebGL2ComputePassEncoder } from './WebGL2ComputePassEncoder.js';
import { insertDebugMarker as insertGlDebugMarker, popDebugGroup as popGlDebugGroup, pushDebugGroup as pushGlDebugGroup, } from '../utils/debugMarkers.js';
/*
 * 零拷贝上传路径的兜底暂存区（惰性分配）。只在「传给 `texSubImage*` 的视图起点不在元素边界上」
 * 时才需要搬一次内存（例如把 `Uint8Array` 的 `subarray(2, ...)` 交给 `rgba32float`）。
 * 正常情况下 `Uint8Array` → `TypedArray` 是零拷贝重解释，这块内存直到用上之前都不分配。
 */
const UPLOAD_SCRATCH_BYTES = 64 * 1024;
export class WebGL2CommandEncoder {
    label;
    gl;
    state;
    passOptions;
    openPass = null;
    drawCalls = 0;
    passCount = 0;
    finished = false;
    /** 见 {@link UPLOAD_SCRATCH_BYTES}。 */
    scratch = null;
    constructor(descriptor, gl, state, passOptions) {
        this.label = descriptor?.label ?? nextId('commandEncoder');
        this.gl = gl;
        this.state = state;
        this.passOptions = passOptions;
    }
    /** 由渲染通道回调，用于统计。 */
    noteDrawCall() {
        this.drawCalls += 1;
    }
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
    beginRenderPass(descriptor) {
        this.assertOpen('beginRenderPass');
        this.closeOpenPass();
        const pass = new WebGL2RenderPassEncoder(descriptor, this.passOptions);
        this.openPass = pass;
        this.passCount += 1;
        return pass;
    }
    beginComputePass() {
        this.assertOpen('beginComputePass');
        // WebGL2 没有 compute pass（构造器会抛错），但隐式结束上一个 pass 的语义先对齐（`#12`）。
        this.closeOpenPass();
        return new WebGL2ComputePassEncoder();
    }
    copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size) {
        this.assertOpen('copyBufferToBuffer');
        const sourceBuffer = source;
        const destinationBuffer = destination;
        /*
         * 索引缓冲（`ELEMENT_ARRAY_BUFFER`）**不能**当 `copyBufferSubData` 的源或目标：
         * WebGL2 里一个 buffer 的绑定目标在第一次绑定时就永久确定（见 `WebGL2Buffer` 的类注释），
         * 而 `ELEMENT_ARRAY_BUFFER` 同时是 **VAO 状态**的一部分 —— 让拷贝去动它就必须在默认 VAO 上
         * 重新绑定，等于改掉当前 VAO 记录的索引缓冲，之后的 draw 会拿错误的索引去解引用顶点。
         * 所以这一路保留 CPU 中转（`download` / `upload` 各自走 buffer 自己的目标）。
         */
        if (sourceBuffer.isIndexBuffer || destinationBuffer.isIndexBuffer) {
            const bytes = new Uint8Array(size);
            sourceBuffer.download(sourceOffset, bytes);
            destinationBuffer.upload(destinationOffset, bytes);
            return;
        }
        /*
         * 区间重叠时也回退 CPU：`gl.copyBufferSubData` 要求两个区间**不重叠**（重叠是 INVALID_VALUE），
         * 而 CPU 中转天然是「先把整段读出来、再写回去」，与 memmove 一致。WebGPU 的
         * `copyBufferToBuffer` 允许重叠区间（结果由实现决定），这里选保守的那条路，
         * 保证两个后端的可观察行为都不变。
         */
        if (sourceBuffer === destinationBuffer &&
            sourceOffset < destinationOffset + size &&
            destinationOffset < sourceOffset + size) {
            const bytes = new Uint8Array(size);
            sourceBuffer.download(sourceOffset, bytes);
            destinationBuffer.upload(destinationOffset, bytes);
            return;
        }
        /*
         * WebGL2 **有** `copyBufferSubData`（原生探针实测 `typeof gl.copyBufferSubData === 'function'`，
         * 见 `.tmp-probe/gl-probe.ts`）：让这段拷贝留在 GPU 侧，不再绕一圈 CPU 内存。
         * 这里原先写着「WebGL2 没有 copyBufferSubData」，那句话是错的。
         *
         * 两个绑定槽（`COPY_READ_BUFFER` / `COPY_WRITE_BUFFER`）复用 `GlStateCache` 的记录。
         * **先绑写槽、再绑读槽**：非索引 buffer 的绑定目标被永久固定在 `COPY_WRITE_BUFFER` 上
         * （见 `WebGL2Buffer`），而这个顺序可以保证拷贝结束后写槽留下的仍然是**目标缓冲** ——
         * 这正是 `WebGL2Buffer.upload()` 依赖的那条不变量（它直接往 `COPY_WRITE_BUFFER` 上写）。
         */
        this.state.bindCopyWriteBuffer(destinationBuffer.native);
        this.state.bindCopyReadBuffer(sourceBuffer.native);
        this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, sourceOffset, destinationOffset, size);
    }
    /**
     * buffer → texture。**一次 `texSubImage3D` 上传整叠 image**（3D / 数组纹理的全部层），
     * 而不是逐层调用 —— GL 的 `texSubImage3D` 本来就是这样消费主机内存的
     * （层距由 `UNPACK_IMAGE_HEIGHT` = `rowsPerImage` 决定）。
     *
     * 修复前的写法只按 `bytesPerRow * height` 分配源数据，却把 `copySize.depthOrArrayLayers`
     * 原样交给 `texSubImage3D`：GL 会按「层距 = height」去读第 1 层之后的数据，读到的是缓冲区
     * 之外的内容（实测报 `INVALID_OPERATION`，而本后端默认不查 GL 错误 → 静默）。
     */
    copyBufferToTexture(source, destination, copySize) {
        this.assertOpen('copyBufferToTexture');
        const gl = this.gl;
        const texture = destination.texture;
        const sourceBuffer = source.buffer;
        const info = glFormat(texture.format);
        assertAspectSupported('copyBufferToTexture', texture, destination.aspect);
        const { x: ox, y: oy, z: oz } = resolveOrigin(destination.origin);
        const offset = source.offset ?? 0;
        const layout = resolveUploadLayout(source, copySize, info, 'copyBufferToTexture', texture.format, texture.label);
        if (offset + layout.requiredBytes > sourceBuffer.size) {
            throw new ValidationError(`[gpu-device-api] copyBufferToTexture: the source range [${offset}, ${offset + layout.requiredBytes}) ` +
                `exceeds buffer「${sourceBuffer.label}」's ${sourceBuffer.size} bytes — ` +
                `${copySize.width}x${copySize.height}x${copySize.depthOrArrayLayers} pixels need ` +
                `bytesPerRow=${layout.bytesPerRow} and rowsPerImage=${layout.rowsPerImage}.`);
        }
        // 逐行从 buffer 读出来再上传：WebGL2 的 texSubImage* 不支持「从 buffer 读」，
        // 必须把数据放到 CPU 内存里。像素解包参数用来处理行距与图距。
        const data = new Uint8Array(layout.requiredBytes);
        // 走 buffer 自己的目标读回：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
        sourceBuffer.download(offset, data);
        uploadTextureData(gl, texture.target, texture.native, destination.mipLevel ?? 0, { x: ox, y: oy, z: oz }, copySize, info, texture.format, data, layout, () => this.uploadScratch(), 'copyBufferToTexture');
        // 只绕过缓存直接改了一个纹理单元的绑定，作废纹理单元缓存即可；
        // invalidate() 会把 program/blend/depth/VAO/UBO 一起丢掉，下一次 draw 要全部重下。
        this.state.invalidateTextureUnits();
    }
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
    copyTextureToBuffer(source, destination, copySize) {
        this.assertOpen('copyTextureToBuffer');
        const gl = this.gl;
        const texture = source.texture;
        const info = glFormat(texture.format);
        assertCopyTextureToBufferSupported(texture, source.aspect, copySize.depthOrArrayLayers);
        /*
         * `bytesPerRow` 是**请求的行距**（WebGPU 语义：相邻两行第一个字节之间的距离），
         * 而 `gl.readPixels` 永远按紧凑行距写入（下面还把 PACK_ALIGNMENT 设成 1）。
         * 所以这里必须先紧凑读回，再在 JS 里按请求行距重排。
         *
         * 之前的实现只用 `bytesPerRow` 给 Uint8Array 定大小、然后直接 readPixels，
         * 于是任何按 WebGPU 规范传 256 对齐行距的调用方（例如 width=96 传 512）
         * 都会读到整体错位的数据：读回结果被当成「紧凑 384 字节一行」写进一块按 512 行距解释的缓冲，
         * 第 1 行之后全部对不上，缓冲后半段只剩 0。
         */
        const layout = resolveReadbackLayout(destination, copySize, info, 'copyTextureToBuffer', texture.format, texture.label);
        const offset = destination.offset ?? 0;
        const buffer = destination.buffer;
        if (offset + layout.requiredBytes > buffer.size) {
            throw new ValidationError(`[gpu-device-api] copyTextureToBuffer: the destination range ` +
                `[${offset}, ${offset + layout.requiredBytes}) exceeds buffer「${buffer.label}」's ` +
                `${buffer.size} bytes (${copySize.width}x${copySize.height}x${copySize.depthOrArrayLayers}, ` +
                `bytesPerRow=${layout.bytesPerRow}, rowsPerImage=${layout.rowsPerImage}).`);
        }
        const tightRowBytes = copySize.width * info.bytesPerPixel;
        const data = new Uint8Array(layout.requiredBytes);
        /*
         * 用 framebuffer 把纹理当附件读回：WebGL2 没有直接的 getTexImage。
         *
         * framebuffer 是**复用**的（`GlStateCache.readbackFramebuffer`）：读回只需要一个临时挂附件的
         * 容器，内容每次都会被重设，所以每次 `createFramebuffer` + `deleteFramebuffer` 是白付的
         * 对象 churn。挂新附件前会先把上一个附件摘掉（同一个纹理挂在两个附着点上会让 framebuffer 不完整）。
         */
        const previous = this.state.currentFramebuffer();
        const attachment = info.depth ? gl.DEPTH_ATTACHMENT : gl.COLOR_ATTACHMENT0;
        const mipLevel = source.mipLevel ?? 0;
        const { x: readX, y: readY, z: readZ } = resolveOrigin(source.origin);
        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        // 紧凑读回的暂存区：行距就是 tightRowBytes，与请求的行距无关；每层复用同一块。
        const tight = new Uint8Array(tightRowBytes * copySize.height);
        for (let layer = 0; layer < copySize.depthOrArrayLayers; layer += 1) {
            attachReadbackLayer(this.state, gl, texture, attachment, mipLevel, readZ + layer);
            /*
             * `checkFramebufferStatus` 是一次**同步**查询（要等 GL 命令队列），所以只在第一次
             * （也就是「这个附着点组合是不是完整」这件事上）查一次。换层不会改变完整性 ——
             * 数组纹理的各层尺寸与格式完全相同（`texStorage3D` 分配的），层号越界由
             * `attachReadbackLayer` 自己校验。
             */
            if (layer === 0) {
                const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== gl.FRAMEBUFFER_COMPLETE) {
                    // 读回失败也要把绑定还原：这个 framebuffer 是复用对象，不能留在「已绑定」的状态上。
                    gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
                    this.state.bindFramebuffer(previous);
                    this.state.invalidateFramebufferBinding();
                    this.state.forgetReadbackTexture();
                    throw new ValidationError(`[gpu-device-api] 无法把纹理「${texture.label}」的第 ${readZ} 层作为附件读回` +
                        `（framebuffer 不完整，0x${status.toString(16)}）。` +
                        '请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。');
                }
            }
            gl.readPixels(readX, readY, copySize.width, copySize.height, info.format, info.type, tight);
            // 层在目标 buffer 里的起点：`rowsPerImage` 行 × `bytesPerRow` 字节。
            repackRows(tight, data, layer * layout.rowsPerImage * layout.bytesPerRow, tightRowBytes, layout.bytesPerRow, copySize.height);
        }
        gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
        this.state.bindFramebuffer(previous);
        this.state.forgetReadbackTexture();
        /*
         * 这条读回路径临时切过 framebuffer，所以只作废 **framebuffer 绑定**这一项记录。
         *
         * 原来的写法是整体 `invalidate()`：那会把 program / blend / depth / cull / VAO / 纹理单元
         * 一起丢掉，于是**紧随其后的那一次 draw 要把固定功能状态全部重下发一遍** ——
         * 而读回并没有改动它们中的任何一个，这笔开销完全是白付的。
         */
        this.state.invalidateFramebufferBinding();
        // 按请求的行距重排。行间填充保持 0（`new Uint8Array` 的初值）：WebGPU 不写这些字节，
        // 但给出确定的值比留下上一次读回的残留更好排查，也与本方法修复前的行为一致。
        // 走 buffer 自己的目标写回：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
        buffer.upload(offset, data);
    }
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
    copyTextureToTexture(source, destination, copySize) {
        this.assertOpen('copyTextureToTexture');
        const gl = this.gl;
        const sourceTexture = source.texture;
        const destinationTexture = destination.texture;
        const info = glFormat(destinationTexture.format);
        const sourceInfo = glFormat(sourceTexture.format);
        if (sourceInfo.internalFormat !== info.internalFormat) {
            throw new ValidationError(`[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${sourceTexture.format}」，` +
                `目标是「${destinationTexture.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`);
        }
        if (sourceTexture.dimension !== destinationTexture.dimension) {
            throw new ValidationError(`[gpu-device-api] copyTextureToTexture 要求源与目标维度一致：源是「${sourceTexture.dimension}」，` +
                `目标是「${destinationTexture.dimension}」。WebGL2 的 blitFramebuffer 只能在同种目标之间搬纹素。`);
        }
        const sourceMip = source.mipLevel ?? 0;
        const destinationMip = destination.mipLevel ?? 0;
        assertAspectSupported('copyTextureToTexture(source)', sourceTexture, source.aspect);
        assertAspectSupported('copyTextureToTexture(destination)', destinationTexture, destination.aspect);
        assertMipLevelSupported(sourceTexture, sourceMip, source.origin);
        assertMipLevelSupported(destinationTexture, destinationMip, destination.origin);
        const { x: sourceX, y: sourceY, z: sourceZ } = resolveOrigin(source.origin);
        const { x: destinationX, y: destinationY, z: destinationZ } = resolveOrigin(destination.origin);
        const layered = isLayeredTexture(gl, sourceTexture);
        if (!layered && copySize.depthOrArrayLayers !== 1) {
            throw new ValidationError(`[gpu-device-api] copyTextureToTexture: depthOrArrayLayers=${copySize.depthOrArrayLayers} 需要 ` +
                `3D 或数组纹理，但「${sourceTexture.label}」是单层 2D 纹理。`);
        }
        /*
         * 深度/模板：GLES 3.0 只允许 blit 深度位（`DEPTH_BUFFER_BIT`；没有 `STENCIL_BUFFER_BIT`），
         * 而且要求两端的格式在深度/模板位上兼容。这里按格式选附着点，并把 mask 放宽到
         * 「DEPTH_BUFFER_BIT」——`depth24plus-stencil8` 的深度与模板是同一个附着点上的两个面，
         * GL 会在 blit 时一起搬运。
         */
        const isDepth = sourceInfo.depth;
        const attachment = isDepth
            ? sourceInfo.stencil
                ? gl.DEPTH_STENCIL_ATTACHMENT
                : gl.DEPTH_ATTACHMENT
            : gl.COLOR_ATTACHMENT0;
        const mask = isDepth ? gl.DEPTH_BUFFER_BIT : gl.COLOR_BUFFER_BIT;
        const readFramebuffer = gl.createFramebuffer();
        const drawFramebuffer = gl.createFramebuffer();
        if (!readFramebuffer || !drawFramebuffer) {
            throw new ValidationError('[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。');
        }
        const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        try {
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFramebuffer);
            attachCopyAttachment(gl, gl.READ_FRAMEBUFFER, sourceTexture, attachment, sourceMip, sourceZ);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawFramebuffer);
            attachCopyAttachment(gl, gl.DRAW_FRAMEBUFFER, destinationTexture, attachment, destinationMip, destinationZ);
            const layers = layered ? copySize.depthOrArrayLayers : 1;
            for (let layer = 0; layer < layers; layer += 1) {
                if (layers > 1) {
                    attachCopyAttachment(gl, gl.READ_FRAMEBUFFER, sourceTexture, attachment, sourceMip, sourceZ + layer);
                    attachCopyAttachment(gl, gl.DRAW_FRAMEBUFFER, destinationTexture, attachment, destinationMip, destinationZ + layer);
                }
                gl.blitFramebuffer(sourceX, sourceY, sourceX + copySize.width, sourceY + copySize.height, destinationX, destinationY, destinationX + copySize.width, destinationY + copySize.height, mask, gl.NEAREST);
            }
        }
        finally {
            gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
            gl.deleteFramebuffer(readFramebuffer);
            gl.deleteFramebuffer(drawFramebuffer);
        }
        // 同上：blit 前后切了 READ/DRAW framebuffer，保留整体作废（非热路径）。
        this.state.invalidate();
    }
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
    clearBuffer(buffer, offset = 0, size) {
        this.assertOpen('clearBuffer');
        assertNonNegativeInteger(offset, `${this.label}.clearBuffer offset`);
        const resolvedSize = size ?? buffer.size - offset;
        if (offset % 4 !== 0) {
            throw new ValidationError(`[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${offset}.`);
        }
        if (resolvedSize <= 0) {
            throw new ValidationError(`[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${resolvedSize}.`);
        }
        if (resolvedSize % 4 !== 0) {
            throw new ValidationError(`[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${resolvedSize}.`);
        }
        if (offset + resolvedSize > buffer.size) {
            throw new ValidationError(`[gpu-device-api] ${this.label}.clearBuffer: range [${offset}, ${offset + resolvedSize}) exceeds the ` +
                `buffer size ${buffer.size}.`);
        }
        const target = buffer;
        // 走 buffer 自己的目标：索引缓冲只能是 ELEMENT_ARRAY_BUFFER（见 WebGL2Buffer）。
        // 零数据来自**共享的分块暂存**：小清零（≤ 4KB，绝大多数用法）连分配都省掉，
        // 大清零按块复用同一块内存，不再一次分配 `size` 字节。
        let cursor = offset;
        for (const chunk of zeroChunks(resolvedSize)) {
            target.upload(cursor, chunk);
            cursor += chunk.length;
        }
    }
    /**
     * WebGL2 没有对应能力：GL 的查询结果不能写进 buffer，只能 `getQueryParameter()` 读回。
     * 调用它明确报错，并指出替代方案（`Device.readQuerySet()`）。
     */
    resolveQuerySet(querySet, firstQuery, queryCount, destination, destinationOffset) {
        this.assertOpen('resolveQuerySet');
        void querySet;
        void firstQuery;
        void queryCount;
        void destination;
        void destinationOffset;
        throw new ValidationError('[gpu-device-api] WebGL2 has no resolveQuerySet(): GL query results cannot be copied into a buffer, ' +
            'they can only be read back one by one with gl.getQueryParameter(). Use Device.readQuerySet() ' +
            'instead — it polls QUERY_RESULT_AVAILABLE and returns the same QueryResult shape as WebGPU.');
    }
    /**
     * WebGL2 没有「单个时刻的时间戳」：GL 的时间查询是 `beginQuery → endQuery` 的**区间**测量。
     * 请改用 `RenderPassDescriptor.timestampWrites`（后端会用 beginQuery/endQuery 包住整个通道）。
     */
    writeTimestamp(querySet, queryIndex) {
        this.assertOpen('writeTimestamp');
        void querySet;
        void queryIndex;
        throw new ValidationError('[gpu-device-api] WebGL2 has no CommandEncoder.writeTimestamp(): GL timer queries measure an ' +
            'interval (beginQuery → endQuery), not a single instant. Use RenderPassDescriptor.timestampWrites ' +
            'with an EXT_disjoint_timer_query_webgl2 query set instead.');
    }
    /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
    pushDebugGroup(label) {
        pushGlDebugGroup(this.gl, label);
    }
    popDebugGroup() {
        popGlDebugGroup(this.gl);
    }
    insertDebugMarker(label) {
        insertGlDebugMarker(this.gl, label);
    }
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
    finish() {
        this.assertOpen('finish');
        this.closeOpenPass();
        this.finished = true;
        return {
            label: `${this.label}:commandBuffer`,
            native: null,
            drawCalls: this.drawCalls,
            passCount: this.passCount,
            disposed: false,
            dispose: () => {
                // command buffer 不持有 GL 资源（命令已经执行完了）。
            },
        };
    }
    assertOpen(operation) {
        if (this.finished) {
            throw new ValidationError(`[gpu-device-api] encoder「${this.label}」已经 finish()，不能再调用 ${operation}()。`);
        }
    }
    /**
     * 隐式结束当前打开的渲染通道（`#12`，与 WebGPU 后端的 `closeOpenPass()` 同形）。
     *
     * 幂等：没有打开的通道、或它已经 `end()` 过，都是空操作。
     */
    closeOpenPass() {
        if (this.openPass && !this.openPass.ended) {
            this.openPass.end();
        }
        this.openPass = null;
    }
    /** 取（必要时分配）零拷贝上传路径的兜底暂存区。 */
    uploadScratch() {
        this.scratch ??= new ArrayBuffer(UPLOAD_SCRATCH_BYTES);
        return this.scratch;
    }
}
/** `Partial<Origin3D>`（每个分量都可选）补齐成确定数值。 */
function resolveOrigin(origin) {
    return { x: origin?.x ?? 0, y: origin?.y ?? 0, z: origin?.z ?? 0 };
}
/** 纹理是被 GL 的 `*3D` 入口寻址的吗（3D 纹理或数组纹理）。 */
function isLayeredTexture(gl, texture) {
    return texture.target === gl.TEXTURE_3D || texture.target === gl.TEXTURE_2D_ARRAY;
}
/**
 * 校验 `aspect` 被如实支持。
 *
 * WebGL2 里「color 纹理的 aspect」只有 `'all'` 一种含义；深度/模板纹理则是
 * `DEPTH_STENCIL` 附着点上的一个整体，没有单独读某一面的入口（模板更是完全读不出来）。
 * 修复前这些字段**从不被读取**，所以传什么都「成功」，行为与传默认值完全一样。
 */
function assertAspectSupported(operation, texture, aspect) {
    const resolved = aspect ?? 'all';
    if (resolved === 'all')
        return;
    const info = glFormat(texture.format);
    if (!info.depth && !info.stencil) {
        throw new ValidationError(`[gpu-device-api] ${operation}: aspect "${resolved}" was requested for the non-depth format ` +
            `"${texture.format}" (texture "${texture.label}"). Use aspect "all" (or omit it).`);
    }
    if (resolved === 'stencil-only') {
        throw new ValidationError(`[gpu-device-api] ${operation}: aspect "stencil-only" is not supported by the WebGL2 backend. ` +
            'WebGL2 cannot address the stencil aspect on its own — the stencil is only reachable through ' +
            'the combined DEPTH_STENCIL attachment, and readPixels cannot read it at all. ' +
            'Workaround: write the stencil mask into a colour attachment in a shader and copy that.');
    }
    // 'depth-only' 与 'all' 在 GL 里是同一件事（附着点是 DEPTH_STENCIL），如实放行。
}
/**
 * 校验 blit 的 mip 级。
 *
 * GL 的 `blitFramebuffer` 只能搬**纹理基级**与 renderbuffer：它的矩形坐标没有「级」这一维，
 * 所以「blit 第 n mip 级」这件事 GL 根本表达不了（`framebufferTexture2D` 的 level 参数虽然
 * 能挂非 0 级，但 `blitFramebuffer` 的坐标仍然是从 `drawingBuffer` 那样从 0 开始的像素坐标，
 * 各级尺寸不同时结果毫无意义）。修复前这个参数被直接传下去，静默地搬错了级别。
 */
function assertMipLevelSupported(texture, mipLevel, origin) {
    void origin;
    if (mipLevel === 0)
        return;
    throw new ValidationError(`[gpu-device-api] copyTextureToTexture: mipLevel=${mipLevel}（纹理「${texture.label}」）无法表达 —— ` +
        'WebGL2 的 blitFramebuffer 只能搬纹理的基级。请为需要拷贝的 mip 级单独创建一张纹理，' +
        '或改用「逐级 copyTextureToBuffer + copyBufferToTexture」。');
}
/** 把纹理的某一层挂到 blit 用的 READ/DRAW framebuffer 上。 */
function attachCopyAttachment(gl, target, texture, attachment, mipLevel, layer) {
    if (isLayeredTexture(gl, texture)) {
        if (mipLevel !== 0) {
            throw new ValidationError(`[gpu-device-api] copyTextureToTexture: framebufferTextureLayer 不接受非 0 的 mip 级` +
                `（纹理「${texture.label}」请求了 mipLevel=${mipLevel}）。`);
        }
        gl.framebufferTextureLayer(target, attachment, texture.native, 0, layer);
        return;
    }
    if (layer !== 0) {
        throw new ValidationError(`[gpu-device-api] copyTextureToTexture: 纹理「${texture.label}」是单层 2D 纹理，` +
            `无法寻址第 ${layer} 层。`);
    }
    gl.framebufferTexture2D(target, attachment, gl.TEXTURE_2D, texture.native, mipLevel);
}
/**
 * `copyTextureToBuffer` 的前置校验：**深度/模板纹理在 WebGL2 上读不回来**。
 *
 * ## 为什么必须报错，而不是「尽力而为」
 *
 * WebGL2 规范的 `readPixels` 只允许 `RGBA`（`UNSIGNED_BYTE` / `FLOAT`）与 `RED`（`FLOAT`），
 * 而实现给深度附件报的 read format 是 `DEPTH_COMPONENT`/`UNSIGNED_INT` —— 两者永远对不上，
 * 所以任何深度读回都会以某个 GL 错误结束（本机实测 4 种格式 × 5 种组合全部 `0x500`）。
 * `WEBGL_depth_texture` 是 WebGL1 的扩展，WebGL2 里没有它。
 *
 * 由于本后端默认**不查 GL 错误**，修复前的表现是「静默地什么都不发生，缓冲里全是 0」——
 * 这比抛错危险得多：调用方拿到的是一份看起来完全正常的全 0 深度图。
 *
 * `aspect` 也必须被读取：`'stencil-only'` 在 GL 里同样是 `DEPTH_STENCIL`/`UNSIGNED_INT_24_8`
 * 组合（同样非法），而 `'all'` 在 `depth24plus-stencil8` 上按 WebGPU 的规则回落到 depth 那一半。
 *
 * 想读回深度请改走「**深度测试写进颜色附件**」：在片元着色器里输出
 * `gl_FragCoord.z`（或线性化后的深度），然后按普通颜色纹理读回 —— 这是 WebGL2 里唯一可行、
 * 也是两个后端都能用的做法。
 */
function assertCopyTextureToBufferSupported(texture, aspect, depthOrArrayLayers) {
    assertAspectSupported('copyTextureToBuffer', texture, aspect);
    const info = glFormat(texture.format);
    if (!info.depth && !info.stencil)
        return;
    throw new ValidationError(`[gpu-device-api] copyTextureToBuffer: the WebGL2 backend cannot read depth texture ` +
        `"${texture.label}" (format "${texture.format}") back into a buffer. WebGL2's readPixels has no ` +
        'legal depth format/type combination — the implementation-defined read format for a depth ' +
        'attachment (DEPTH_COMPONENT/UNSIGNED_INT) is never one of the accepted pairs ' +
        '(RGBA/UNSIGNED_BYTE, RGBA/FLOAT, RED/FLOAT), and WEBGL_depth_texture does not exist in WebGL2. ' +
        'Measured on ANGLE/SwiftShader: all 4 depth formats x 5 format/type combinations return ' +
        '0x500 INVALID_ENUM, and the destination buffer stays all zeros. ' +
        'Workaround: write the depth into a colour attachment (output gl_FragCoord.z or a linearised ' +
        `depth in the fragment shader) and copy that colour texture instead.${info.stencil && (aspect ?? 'all') === 'all'
            ? ' Note: WebGPU treats aspect "all" on a depth-stencil format as depth-only, so this call ' +
                'would have returned the depth samples — never the stencil ones.'
            : ''}`);
    void depthOrArrayLayers;
}
/**
 * 把某个纹理的**某一层**挂到读回 framebuffer 上。
 *
 * 为什么不用 `GlStateCache.attachReadbackTexture`：那个入口只做 `framebufferTexture2D`
 * （2D 附着），层号表达不了；而且它带「同一个纹理+附着点就跳过」的快速路径，
 * 逐层读回时正好会命中它而跳过换层。
 */
function attachReadbackLayer(state, gl, texture, attachment, mipLevel, layer) {
    state.forgetReadbackTexture();
    const framebuffer = state.readbackFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    /*
     * 这次直接 `gl.bindFramebuffer` 之后必须**补记**进状态缓存。
     *
     * 不补记的话，缓存里仍留着「上一个 framebuffer」，于是读回结束时那句
     * `state.bindFramebuffer(previous)` 会因为「缓存说已经绑着它了」而被跳过 ——
     * 结果**读回 framebuffer 被留在绑定点上**，而缓存还声称是调用方的那个
     * （两者不一致，后续 draw 会画进错误的 framebuffer，且没有任何报错）。
     */
    state.noteFramebufferBinding(framebuffer);
    const layered = texture.target === gl.TEXTURE_3D || texture.target === gl.TEXTURE_2D_ARRAY;
    if (layered) {
        if (mipLevel !== 0) {
            throw new ValidationError(`[gpu-device-api] WebGL2 的 framebufferTextureLayer 不接受非 0 的 mip 级（纹理「${texture.label}」` +
                `请求了 mipLevel=${mipLevel}）。请为需要读回的 mip 级单独创建一张纹理。`);
        }
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, texture.native, 0, layer);
        return;
    }
    if (layer !== 0) {
        throw new ValidationError(`[gpu-device-api] copyTextureToBuffer: 纹理「${texture.label}」只有一层，` +
            `但 origin.z=${layer} 指向了第 ${layer} 层。`);
    }
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.native, mipLevel);
}
/** 共享零暂存块的块大小（字节）。必须是 4 的倍数，见 {@link zeroChunks}。 */
const ZERO_CHUNK_BYTES = 4096;
/**
 * 共享的零暂存块。
 *
 * 只在这里读取、从不写入，所以「共享」不会让它变成可被外部改动的可变状态：
 * 它的消费者是 `gl.bufferSubData`（只读源）。即便同一块内存被并发/重入地用于多次 `clearBuffer`，
 * 每次调用读到的都是同样的全零字节，结果与「每次新建一块」完全相同。
 */
const ZERO_CHUNK = new Uint8Array(ZERO_CHUNK_BYTES);
/**
 * 把长度为 `length` 的区间切成若干个「全零块」，块之间不重叠。
 *
 * 为什么分块：`clearBuffer` 原先每次调用都 `new Uint8Array(length)` —— 分配 + 清零，
 * 对大区间（例如每帧清 16MB 的 uniform arena）是每帧一次的实打实开销。分块之后
 * ≤ 4KB 的小清零**连分配都没有**，大清零也只是一次次复用同一块内存。
 *
 * 每块长度都必须是 4 的倍数（且块起点随之 4 对齐）：`WebGL2Buffer` 要求 buffer 大小是 4 的
 * 倍数，而 `bufferSubData` 的偏移是任意的，所以这里按 4 对齐切分即可覆盖任意合法的
 * `(offset, length)` 组合（两者都是 4 的倍数）。
 */
function* zeroChunks(length) {
    if (length <= 0) {
        // 与 `new Uint8Array(0)` 的上传行为一致：不产生任何字节。
        return;
    }
    let remaining = length;
    while (remaining > 0) {
        const take = Math.min(remaining, ZERO_CHUNK_BYTES);
        yield take === ZERO_CHUNK_BYTES ? ZERO_CHUNK : ZERO_CHUNK.subarray(0, take);
        remaining -= take;
    }
}
//# sourceMappingURL=WebGL2CommandEncoder.js.map