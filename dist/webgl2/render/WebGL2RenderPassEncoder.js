/**
 * WebGL2 的渲染通道编码器。
 *
 * 这是「WebGPU 录制式 API」与「GL 立即模式」之间的桥。渲染通道在 WebGL2 上是**边录制边执行**的：
 * 每次 `draw()` 立刻下发 GL 调用。对绝大多数绘制流程来说两者结果一致，只有一处已知差异 ——
 * `Queue.writeBuffer` 的生效时机（详见 `core/sync/Queue.ts` 的文档）。
 *
 * 每个 draw 的固定流程：
 * 1. 解析管线在当前渲染目标形态下的状态（按变体缓存）；
 * 2. `useProgram` + 应用固定功能状态；
 * 3. 取得/创建 VAO（键里含顶点缓冲与索引缓冲，命中就跳过全部属性设置）；
 * 4. 按绑定计划把 bind group 落到 uniform block binding 点与纹理单元上；
 * 5. 下发 `drawArraysInstanced` / `drawElementsInstanced`。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { indexFormatByteSize } from '../../core/enums/IndexFormat.js';
import { BindingType } from '../../core/enums/BindingType.js';
import { assertPassTimestampWrites } from '../../core/resources/QuerySet.js';
import { ANY_SAMPLES_PASSED, asWebGL2QuerySet } from '../resources/WebGL2QuerySet.js';
import { GL_INDEX_TYPES, resolveClearColor } from '../utils/glEnumMap.js';
import { insertDebugMarker as insertGlDebugMarker, popDebugGroup as popGlDebugGroup, pushDebugGroup as pushGlDebugGroup, } from '../utils/debugMarkers.js';
import { webgl2RenderTargetOfView, CLEAR_DEPTH_SCRATCH, writeClearColor } from './WebGL2RenderTarget.js';
import { isDefaultFramebufferView } from '../WebGL2CanvasContext.js';
/**
 * 两个解析后的清屏颜色是否相同（#35，取代原来的 `JSON.stringify` 比较）。
 *
 * 逐分量按数值比较；`NaN` 视为相等 —— 改前的字符串比较里 `JSON.stringify(NaN)` 也是 `'null'`，
 * 两个 `NaN` 同样会被判成一致，这里保持同样的结论。`-0` 与 `0` 用 `===` 也判相等，
 * 与 `JSON.stringify(-0) === '0'` 一致。
 */
function sameClearColor(a, b) {
    for (let index = 0; index < 4; index += 1) {
        const left = a[index];
        const right = b[index];
        if (left !== right && !(Number.isNaN(left) && Number.isNaN(right)))
            return false;
    }
    return true;
}
/**
 * 动态槽位列表的兜底常量：`dynamicBlocksByGroup` 里每个 group 都有条目，理论上取不到空，
 * 但用共享空数组可以避免运行时写 `?? []`（那也是一次每 draw 的分配）。
 */
const EMPTY_DYNAMIC_SLOTS = [];
/**
 * 顶点/索引绑定的全局版本号。
 *
 * 每次绑定内容**真的**变化时取一个新值（只增不减），所以「版本号相同」严格等价于
 * 「顶点缓冲与索引缓冲的绑定内容完全相同」。`acquireVertexArray` 靠它做一次数字比较，
 * 就能跳过每次 draw 重建 VAO 缓存键字符串的 O(属性数) 开销。
 * 用全局计数器（而不是通道内自增）是为了让不同通道之间也不会撞号。
 */
let nextBindingRevision = 1;
export class WebGL2RenderPassEncoder {
    label;
    gl;
    state;
    options;
    colorFormats;
    depthFormat;
    pipeline = null;
    bindGroups = new Map();
    dynamicOffsets = new Map();
    vertexBuffers = [];
    indexBuffer = null;
    /**
     * 本通道画进的离屏渲染目标（没有就是 canvas 默认帧缓冲或临时拼的 FBO）。
     *
     * 它有两个用途：多重采样目标要在 `end()` 时做 resolve；以及决定 `variantShape.sampleCount`。
     */
    renderTarget = null;
    stencilReference = 0;
    _ended = false;
    /**
     * 本通道正在计时的时间查询（`beginQuery` 已在构造时下发，`end()` 时收尾）。
     *
     * GL 的时间查询是**区间**测量：`beginQuery(TIME_ELAPSED_EXT, q)` → `endQuery` 之间的 GPU
     * 时间会写进 q。所以它包住的是「通道开始清屏/绑定 framebuffer 之后到 end() 之前」这段，
     * 对单通道帧来说就是整个渲染阶段。
     */
    pendingTimerQueries = null;
    /** 是否有正在进行的遮挡查询（GL 要求 beginQuery/endQuery 严格配对）。 */
    occlusionQueryOpen = false;
    /** 本通道声明了 occlusionQuerySet 时的 query set（决定 beginOcclusionQuery 是否可用）。 */
    occlusionQuerySet = null;
    /**
     * 变体请求对象：通道的颜色/深度格式在构造时就定了，生命周期内不会变，
     * 所以只分配一次（原来每次解析变体都要新建一个对象）。
     */
    variantShape;
    /** 变体解析结果的缓存：只跟当前管线对象走（见 {@link resolvedVariant}）。 */
    variantPipeline = null;
    variantValue = null;
    /** 当前顶点/索引绑定内容的版本号（见模块级 nextBindingRevision）。 */
    bindingRevision = nextBindingRevision++;
    constructor(descriptor, options) {
        this.label = descriptor.label ?? 'renderPass';
        this.gl = options.gl;
        this.state = options.state;
        this.options = options;
        const target = descriptor.target;
        if (target) {
            if (descriptor.colorAttachments && descriptor.colorAttachments.length > 0) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」同时给了 target 与 colorAttachments。` +
                    '请只保留一种写法：用 target 表示「画进这个渲染目标」，或用 colorAttachments 明确指定附件。');
            }
            this.colorFormats = target.colorFormats;
            this.depthFormat = target.depthFormat;
            target.bind({
                clearColor: descriptor.clearValue,
                clearDepth: descriptor.depthClearValue,
                clearStencil: descriptor.depthClearValue === undefined ? undefined : 0,
                loadOp: descriptor.colorAttachments?.[0]?.loadOp,
                depthLoadOp: descriptor.depthStencilAttachment?.depthLoadOp,
            });
            this.state.invalidate();
            this.state.setViewport(0, 0, target.width, target.height);
            this.renderTarget = target;
        }
        else {
            const attachments = descriptor.colorAttachments.filter((attachment) => attachment !== null);
            if (attachments.length === 0 && !descriptor.depthStencilAttachment) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`);
            }
            this.colorFormats = attachments.map((attachment) => attachment.view.texture.format);
            this.depthFormat = descriptor.depthStencilAttachment?.view.texture.format ?? null;
            const usesDefaultFramebuffer = attachments.some((attachment) => isDefaultFramebufferView(attachment.view)) ||
                (descriptor.depthStencilAttachment !== undefined &&
                    descriptor.depthStencilAttachment !== null &&
                    isDefaultFramebufferView(descriptor.depthStencilAttachment.view));
            // 附件列表整体来自一个多重采样渲染目标时，必须走它的 draw FBO + resolve，
            // 否则多重采样会被静默忽略（见 WebGL2RenderTarget 的类注释）。
            const multisampled = this.multisampleTargetOf(descriptor, attachments);
            if (multisampled) {
                this.beginMultisampleTargetPass(descriptor, multisampled);
            }
            else if (usesDefaultFramebuffer) {
                this.beginDefaultFramebufferPass(descriptor);
            }
            else {
                const framebuffer = options.framebuffers.acquire(descriptor);
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
                this.state.invalidate();
                const first = attachments[0];
                const width = first.view.texture.width;
                const height = first.view.texture.height;
                this.clearRawAttachments(descriptor, framebuffer, first.view);
                this.gl.viewport(0, 0, width, height);
                this.state.setViewport(0, 0, width, height);
            }
        }
        // 附件形态到这里就定了：之后的 setPipeline / draw 都复用这一个请求对象。
        this.variantShape = {
            colorFormats: this.colorFormats,
            sampleCount: this.renderTarget?.sampleCount ?? 1,
            depthFormat: this.depthFormat,
        };
        // 查询必须在附件/清屏之后开始，否则时间戳会把「切 framebuffer、清屏」这段算在外面。
        this.beginQuerySetup(descriptor);
    }
    get ended() {
        return this._ended;
    }
    setPipeline(pipeline) {
        this.assertOpen('setPipeline');
        this.pipeline = pipeline;
        pipeline.applyState(this.resolvedVariant(pipeline), this.stencilReference);
    }
    setBindGroup(index, bindGroup, dynamicOffsets) {
        this.assertOpen('setBindGroup');
        if (index < 0 || index >= 4) {
            throw new ValidationError(`[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${index}。`);
        }
        const pipeline = this.pipeline;
        if (pipeline && pipeline.layout !== 'auto' && bindGroup) {
            const expected = pipeline.layout.bindGroupLayouts[index];
            if (expected && expected !== bindGroup.layout) {
                const same = expected.sortedEntries.length === bindGroup.layout.sortedEntries.length &&
                    expected.sortedEntries.every((entry, i) => {
                        const other = bindGroup.layout.sortedEntries[i];
                        return entry.binding === other.binding && entry.type === other.type && entry.name === other.name;
                    });
                if (!same) {
                    throw new ValidationError(`[gpu-device-api] setBindGroup(${index}, ...) 传入的 bind group 与管线「${pipeline.label}」` +
                        `在该 group 上声明的布局不一致（传入「${bindGroup.layout.label}」，期望「${expected.label}」）。`);
                }
            }
        }
        this.bindGroups.set(index, bindGroup);
        if (dynamicOffsets)
            this.dynamicOffsets.set(index, [...dynamicOffsets]);
        else
            this.dynamicOffsets.delete(index);
    }
    setVertexBuffer(slot, buffer, offset = 0, size = -1) {
        this.assertOpen('setVertexBuffer');
        if (slot < 0 || slot >= 16) {
            throw new ValidationError(`[gpu-device-api] setVertexBuffer 的 slot 必须在 0..15 之间，实际是 ${slot}。`);
        }
        if (buffer && buffer.isIndexBuffer) {
            throw new ValidationError(`[gpu-device-api] buffer「${buffer.label}」是以 \`BufferUsage.Index\` 创建的索引缓冲，` +
                'WebGL2 里一个 buffer 的绑定目标在创建时就永久固定（索引缓冲只能用 ELEMENT_ARRAY_BUFFER），' +
                '所以它不能再当顶点缓冲使用。请为顶点数据单独创建一个 buffer。');
        }
        const existing = this.vertexBuffers[slot];
        if (buffer === null) {
            if (!existing)
                return;
            this.vertexBuffers[slot] = null;
            this.bindingRevision = nextBindingRevision++;
            return;
        }
        // 便捷层每个 draw 都会把所有属性重新 set 一遍，内容没变时就别换对象、也别换版本号 ——
        // 这样既省掉每属性一次的分配，也让 acquireVertexArray 走「绑定没变」的快速路径。
        if (existing && existing.buffer === buffer && existing.offset === offset && existing.size === size)
            return;
        const binding = existing ?? { buffer, offset, size };
        binding.buffer = buffer;
        binding.offset = offset;
        binding.size = size;
        this.vertexBuffers[slot] = binding;
        this.bindingRevision = nextBindingRevision++;
    }
    setIndexBuffer(buffer, format, offset = 0, size = -1) {
        this.assertOpen('setIndexBuffer');
        if (!buffer.isIndexBuffer) {
            throw new ValidationError(`[gpu-device-api] buffer「${buffer.label}」的 usage 里没有 \`BufferUsage.Index\`，` +
                '而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），' +
                '它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 `BufferUsage.Index`。');
        }
        // 与 setVertexBuffer 同样的道理：内容没变就不换对象、不换版本号。
        const existing = this.indexBuffer;
        if (existing &&
            existing.buffer === buffer &&
            existing.format === format &&
            existing.offset === offset &&
            existing.size === size) {
            return;
        }
        if (existing) {
            existing.buffer = buffer;
            existing.format = format;
            existing.offset = offset;
            existing.size = size;
        }
        else {
            this.indexBuffer = { buffer, format, offset, size };
        }
        this.bindingRevision = nextBindingRevision++;
    }
    setViewport(x, y, width, height, minDepth = 0, maxDepth = 1) {
        this.assertOpen('setViewport');
        // WebGL2 的 viewport 没有 min/max depth；用深度范围表达时只能通过 depthRange，且只支持 [0,1]。
        if (minDepth !== 0 || maxDepth !== 1) {
            this.gl.depthRange(minDepth, maxDepth);
        }
        this.state.setViewport(x, y, width, height);
    }
    setScissorRect(x, y, width, height) {
        this.assertOpen('setScissorRect');
        this.state.setScissor(true, x, y, width, height);
    }
    setBlendConstant(color) {
        this.assertOpen('setBlendConstant');
        this.state.setBlendConstant(resolveClearColor(color));
    }
    setStencilReference(reference) {
        this.assertOpen('setStencilReference');
        this.stencilReference = reference;
        if (this.pipeline) {
            this.pipeline.applyState(this.resolvedVariant(this.pipeline), reference);
        }
    }
    draw(descriptor) {
        this.assertOpen('draw');
        const pipeline = this.requirePipeline('draw');
        this.assertNoUnsupportedInstancing(descriptor.firstInstance ?? 0, 0);
        const instances = descriptor.instanceCount ?? 1;
        this.beginDraw(pipeline, null);
        this.gl.drawArraysInstanced(pipeline.mode, descriptor.firstVertex ?? 0, descriptor.vertexCount, instances);
        this.options.onDraw?.();
    }
    drawIndexed(descriptor) {
        this.assertOpen('drawIndexed');
        const pipeline = this.requirePipeline('drawIndexed');
        const index = this.indexBuffer;
        if (!index) {
            throw new ValidationError('[gpu-device-api] drawIndexed() 之前必须先调用 setIndexBuffer()。');
        }
        this.assertNoUnsupportedInstancing(descriptor.firstInstance ?? 0, descriptor.baseVertex ?? 0);
        const instances = descriptor.instanceCount ?? 1;
        const byteOffset = index.offset + (descriptor.firstIndex ?? 0) * indexFormatByteSize(index.format);
        this.beginDraw(pipeline, index);
        this.gl.drawElementsInstanced(pipeline.mode, descriptor.indexCount, GL_INDEX_TYPES[index.format], byteOffset, instances);
        this.options.onDraw?.();
    }
    drawIndirect(indirect, indirectOffset = 0) {
        this.assertOpen('drawIndirect');
        void indirect;
        void indirectOffset;
        throw new ValidationError('[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 draw() 提交，' +
            '或改用 WebGPU 后端。');
    }
    drawIndexedIndirect(indirect, indirectOffset = 0) {
        this.assertOpen('drawIndexedIndirect');
        void indirect;
        void indirectOffset;
        throw new ValidationError('[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 drawIndexed() 提交，' +
            '或改用 WebGPU 后端。');
    }
    /**
     * 开始一条遮挡查询（对应 `gl.beginQuery(ANY_SAMPLES_PASSED, query)`）。
     *
     * `ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，不需要扩展；计数器记录的是「有多少个采样通过了
     * 深度/模板测试」（≥1 即表示「有东西可见」）。结果由 `Device.readQuerySet()` 读回。
     */
    beginOcclusionQuery(index) {
        this.assertOpen('beginOcclusionQuery');
        const set = this.occlusionQuerySet;
        if (!set) {
            throw new ValidationError(`[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: the pass was created without ` +
                'RenderPassDescriptor.occlusionQuerySet, so there is nowhere to store the sample count.');
        }
        if (this.occlusionQueryOpen) {
            throw new ValidationError(`[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: an occlusion query is already open; ` +
                'call endOcclusionQuery() first (GL allows only one active query per target).');
        }
        this.gl.beginQuery(ANY_SAMPLES_PASSED, set.queryAt(index, `${this.label}.beginOcclusionQuery`));
        this.occlusionQueryOpen = true;
    }
    /** 结束最近一次 {@link beginOcclusionQuery}。 */
    endOcclusionQuery() {
        this.assertOpen('endOcclusionQuery');
        if (!this.occlusionQueryOpen) {
            throw new ValidationError(`[gpu-device-api] RenderPass "${this.label}".endOcclusionQuery: no occlusion query is open.`);
        }
        this.gl.endQuery(ANY_SAMPLES_PASSED);
        this.occlusionQueryOpen = false;
    }
    /**
     * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
     * （只影响抓帧工具的分组显示，不影响渲染结果）。
     */
    pushDebugGroup(label) {
        pushGlDebugGroup(this.gl, label);
    }
    popDebugGroup() {
        popGlDebugGroup(this.gl);
    }
    insertDebugMarker(label) {
        insertGlDebugMarker(this.gl, label);
    }
    end() {
        if (this._ended)
            return;
        if (this.occlusionQueryOpen) {
            // GL 的查询必须配对；不配对会让后面的查询直接报 INVALID_OPERATION（而且报在别处，很难查）。
            throw new ValidationError(`[gpu-device-api] RenderPass "${this.label}".end: an occlusion query is still open; call ` +
                'endOcclusionQuery() before ending the pass.');
        }
        // 多重采样目标在这里 resolve（blit 到单采样纹理）。放在 endTimerQuery() 之前，
        // 这样时间查询测到的就是「含 resolve 在内」的整个通道耗时。
        this.renderTarget?.resolve();
        this.endTimerQuery();
        this._ended = true;
        // GL 没有「结束渲染通道」这一步：默认帧缓冲会在浏览器合成时自动呈现，
        // 离屏目标则已经写在纹理里（多重采样目标刚刚 resolve 过）。这里只需要把状态缓存作废，
        // 因为下一个通道会换 framebuffer / 附件组合。
        this.state.invalidate();
    }
    /* ------------------------------------------------------------------ 内部 ------------------- */
    /**
     * 判断这组原始附件是否**整体**来自同一个多重采样渲染目标。
     *
     * 为什么需要它：上层（`Renderer`）走的是 WebGPU 风格的写法 —— `target.createPassDescriptor()`
     * 拿到附件列表再交给 `beginRenderPass`，而不是把 `target` 直接传下来。没有这一步，
     * 多重采样目标会落到「按附件临时拼一个单采样 FBO」的分支，MSAA 被静默忽略。
     *
     * 返回值：
     * - `null`：不是多重采样目标（或者只是单采样目标的附件，此时行为与从前完全一致）；
     * - 目标：所有附件都属于同一个多重采样目标；
     * - 抛错：把一个多重采样目标的附件与别的目标的附件混在一起用 —— 这种组合本层无法正确
     *   表达（renderbuffer 与纹理不能挂在同一个 FBO 上），所以明确报错而不是画错。
     */
    multisampleTargetOf(descriptor, attachments) {
        const views = attachments.map((attachment) => attachment.view);
        if (descriptor.depthStencilAttachment)
            views.push(descriptor.depthStencilAttachment.view);
        let target = null;
        for (const view of views) {
            const owner = webgl2RenderTargetOfView(view);
            if (!owner)
                continue;
            if (target === null)
                target = owner;
            else if (target !== owner) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」把多个渲染目标的附件混在了一起。` +
                    '一个渲染通道的附件必须来自同一个渲染目标（多重采样的附件是 renderbuffer，' +
                    '无法与别的 target 的纹理挂在同一个 framebuffer 上）。');
            }
        }
        if (!target || target.sampleCount === 1)
            return null;
        for (const view of views) {
            if (webgl2RenderTargetOfView(view) !== target) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」把多重采样目标「${target.label}」的附件与其它附件` +
                    '混在了一起。多重采样目标的附件全部是 renderbuffer，只能整组使用；' +
                    '请传 `target`（或完整使用 `target.createPassDescriptor()` 的结果），' +
                    '或把该目标的 sampleCount 设为 1。');
            }
        }
        /*
         * 多重采样路径的下标也必须对得上（`#11` 的同类隐患）。
         *
         * 这条路径绑定的是目标**自己的** draw FBO：它的 `drawBuffers` 在创建时就固定成目标的附件顺序
         * （`createMultisampleAttachments`），`resolve()` 的 `blitFramebuffer` 也只认目标自己的附件。
         * 本层无法按 pass 描述里的空位/顺序重新映射，所以要求「每个非空槽位 i 的 view 就是目标的第 i 个
         * 颜色附件」，并且空位后面不能再有非空附件 —— 空位在这条路径里会被静默忽略
         *（draw 的 `location i` 照样写进目标的第 i 个附件），而不是像原始附件路径那样丢弃输出。
         * 违反时明确报错，绝不把片元输出画到另一个附件上。
         */
        const targetViews = target.colorAttachments.map((attachment) => attachment.view);
        let pendingNull = -1;
        for (let index = 0; index < descriptor.colorAttachments.length; index += 1) {
            const attachment = descriptor.colorAttachments[index];
            if (!attachment) {
                if (pendingNull < 0)
                    pendingNull = index;
                continue;
            }
            if (attachment.view !== targetViews[index]) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」的第 ${index} 个颜色附件不是多重采样目标` +
                    `「${target.label}」的第 ${index} 个颜色附件。多重采样目标只能整组、按原顺序使用` +
                    '（draw FBO 的 drawBuffers 与 resolve 的 blitFramebuffer 都固定在目标自己的附件顺序上）。' +
                    '请传 `target`，或完整使用 `target.createPassDescriptor()` 的结果。');
            }
            if (pendingNull >= 0) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」的 colorAttachments[${pendingNull}] 是 null，` +
                    '但后面还有非空附件。多重采样目标只能整组使用，空位无法表达' +
                    '（draw 的 location 会按位置写进目标的第 i 个附件，而不是丢弃输出）。' +
                    '请传 `target`，或完整使用 `target.createPassDescriptor()` 的结果。');
            }
        }
        return target;
    }
    /**
     * 用渲染目标自己的 framebuffer 开始通道（多重采样路径）。
     *
     * 清屏参数从附件列表归并而来：GL 的 `clearBuffer*` 对同一帧的所有颜色附件用同一个颜色
     * （见 `WebGL2RenderTarget.bind`），所以这里要求各附件的 `loadOp` / `clearValue` 一致，
     * 不一致就明确报错，而不是悄悄只按第一个附件清屏。
     *
     * 比较用**解析后的 RGBA 分量**，不再拼 `JSON.stringify`（#35）：改前每次比较要构造两条
     * JSON 字符串，而且判据是「字面量形状」——`'#ff0000'` 与 `0xff0000`、`[1,0,0]` 这几种写法
     * 指向同一个颜色却会被判成「不一致」而报错。清屏真正用的值是 `resolveClearColor` 的结果，
     * 所以按那个结果逐分量比较才是正确的等价关系。
     *
     * 逐字段等价性（含 `undefined`）：
     * - 「第一个**有值**的附件说了算」这条改前的判据（`clearValue === undefined`）原样保留 ——
     *   前导的缺省值不会被当成一个待比较的颜色，而是继续看后面的附件。
     * - 缺省值解析出来是 `[0, 0, 0, 1]`（默认黑），所以「缺省 vs 显式黑色」不再报错，
     *   而「缺省 vs 显式红」照样报错。前者是有意的放宽（两者的清屏结果本来就相同），
     *   后者与改前一致。
     * - `NaN` 分量视为相等：改前的字符串比较里 `JSON.stringify(NaN)` 也是 `'null'`，
     *   两个 `NaN` 同样会被判成一致。
     */
    beginMultisampleTargetPass(descriptor, target) {
        let loadOp = 'clear';
        let clearValue;
        /** `clearValue` 解析出来的 RGBA；`null` 表示还没有确定下来的颜色。 */
        let resolvedClear = null;
        for (const attachment of descriptor.colorAttachments) {
            if (!attachment)
                continue;
            const attachmentLoadOp = attachment.loadOp ?? 'clear';
            if (attachmentLoadOp === 'load') {
                loadOp = 'load';
                continue;
            }
            // 与改前逐字相同的判据：第一个**有值**的附件决定整帧的清除颜色。
            if (clearValue === undefined) {
                clearValue = attachment.clearValue;
                if (clearValue !== undefined)
                    resolvedClear = resolveClearColor(clearValue);
                continue;
            }
            const resolved = resolveClearColor(attachment.clearValue);
            if (resolvedClear === null || !sameClearColor(resolvedClear, resolved)) {
                throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」给多个颜色附件指定了不同的 clearValue，` +
                    '而 WebGL2 的清屏对整帧只有一个颜色。请让它们一致（或改用 sampleCount = 1 的目标）。');
            }
        }
        if (loadOp === 'clear' && descriptor.colorAttachments.some((item) => item?.loadOp === 'load')) {
            throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」给一部分颜色附件用了 loadOp: 'load'、另一部分用了 ` +
                "'clear'，WebGL2 无法在一次清屏里表达这种组合。请统一 loadOp。");
        }
        const depthStencil = descriptor.depthStencilAttachment;
        target.bind({
            clearColor: loadOp === 'load' ? undefined : clearValue,
            clearDepth: depthStencil?.depthClearValue,
            clearStencil: depthStencil?.stencilClearValue,
            loadOp,
            depthLoadOp: depthStencil?.depthLoadOp,
        });
        this.renderTarget = target;
        this.state.invalidate();
        this.state.setViewport(0, 0, target.width, target.height);
    }
    /**
     * 处理 `RenderPassDescriptor.timestampWrites` 与 `occlusionQuerySet`。
     *
     * **WebGL2 的 timestamp 语义与 WebGPU 不同**（这一点必须看清）：
     * GL 的 `TIME_ELAPSED_EXT` 测量的是 `beginQuery` → `endQuery` 之间的**区间耗时**，
     * 而 WebGPU 写的是「通道开始的时刻」与「通道结束的时刻」两个独立时间戳。
     * 所以这里把区间耗时写进 `beginningOfPassWriteIndex`（只给了 end 时用 end 那个下标），
     * 另一个下标保持 0；读回后的解释也相应不同（见 gfx 的 `GpuTiming`）。
     */
    beginQuerySetup(descriptor) {
        if (descriptor.occlusionQuerySet) {
            this.occlusionQuerySet = asWebGL2QuerySet(descriptor.occlusionQuerySet, `${this.label}.occlusionQuerySet`);
        }
        const writes = descriptor.timestampWrites;
        if (!writes)
            return;
        const context = `${this.label}.timestampWrites`;
        assertPassTimestampWrites(writes, context);
        const set = asWebGL2QuerySet(writes.querySet, `${context}.querySet`);
        const slot = writes.beginningOfPassWriteIndex ?? writes.endOfPassWriteIndex;
        if (slot === undefined) {
            // assertPassTimestampWrites 已经拦下这种情况，这里只是让类型收窄。
            throw new ValidationError(`[gpu-device-api] ${context}: no write index was given.`);
        }
        const query = set.queryAt(slot, context);
        this.gl.beginQuery(set.target, query);
        this.pendingTimerQueries = { target: set.target, query };
    }
    /** 收尾时间查询；没有正在进行的查询时是空操作。 */
    endTimerQuery() {
        const pending = this.pendingTimerQueries;
        if (!pending)
            return;
        this.pendingTimerQueries = null;
        this.gl.endQuery(pending.target);
    }
    /**
     * 取当前通道形态下已解析好的管线变体。
     *
     * 附件形态（颜色/深度格式、采样数）在通道生命周期内固定，变体只跟管线对象走，
     * 所以按管线记住解析结果就够了 —— 原先 `setPipeline` 与每个 `beginDraw` 都会重新解析一次，
     * 每次解析都要拼一遍含全部顶点布局的 O(属性数) 键字符串。
     * 管线被 dispose() 后变体缓存已被清空，这里重新解析以保持与原来一致的行为。
     */
    resolvedVariant(pipeline) {
        if (this.variantPipeline !== pipeline || pipeline.disposed) {
            this.variantValue = pipeline.resolveVariant(this.variantShape);
            this.variantPipeline = pipeline;
        }
        return this.variantValue;
    }
    requirePipeline(operation) {
        if (!this.pipeline) {
            throw new ValidationError(`[gpu-device-api] ${operation}() 之前必须先调用 setPipeline()。`);
        }
        return this.pipeline;
    }
    assertNoUnsupportedInstancing(firstInstance, baseVertex) {
        if (firstInstance !== 0) {
            throw new ValidationError('[gpu-device-api] WebGL2 不支持 `firstInstance`（缺少 drawArraysInstancedBaseInstance）。' +
                '请把实例数据整体前移，或改用 WebGPU 后端。');
        }
        if (baseVertex !== 0) {
            throw new ValidationError('[gpu-device-api] WebGL2 不支持 `baseVertex`（缺少 drawElementsInstancedBaseVertex）。' +
                '请把顶点偏移直接加到索引里，或改用 WebGPU 后端。');
        }
    }
    /** 一个 draw 之前必须完成的全部绑定工作。 */
    beginDraw(pipeline, index) {
        const variant = this.resolvedVariant(pipeline);
        pipeline.applyState(variant, this.stencilReference);
        const vertexArray = pipeline.acquireVertexArray(variant, this.vertexBuffers, index ? index.buffer.native : null, this.bindingRevision);
        this.state.bindVertexArray(vertexArray);
        if (vertexArray === null && index) {
            // 没有顶点属性（例如全屏三角形由 gl_VertexID 生成）时 VAO 为 null，
            // 索引缓冲需要在默认 VAO 上单独绑定。
            this.state.bindIndexBuffer(index.buffer.native);
        }
        this.applyBindGroups(pipeline);
    }
    applyBindGroups(pipeline) {
        const plan = pipeline.bindingPlan;
        if (!plan)
            return;
        for (const [groupIndex, group] of this.bindGroups) {
            if (!group)
                continue;
            // ---- uniform block --------------------------------------------------------------------
            // 槽位列表与动态槽位列表都是计划里预分解好的（构建时一次），这里不再 filter/sort。
            const blocks = plan.uniformBlocksByGroup.get(groupIndex);
            if (blocks) {
                const dynamicSlots = plan.dynamicBlocksByGroup.get(groupIndex) ?? EMPTY_DYNAMIC_SLOTS;
                // 没有动态槽位时连 Map 都不查（绝大多数管线走这条路径）。
                const dynamicValues = dynamicSlots.length > 0 ? this.dynamicOffsets.get(groupIndex) : undefined;
                if (dynamicSlots.length > 0 && (dynamicValues === undefined || dynamicValues.length < dynamicSlots.length)) {
                    throw new ValidationError(`[gpu-device-api] setBindGroup(${groupIndex}, ...) 缺少动态偏移：布局里有 ${dynamicSlots.length} 个` +
                        `带 hasDynamicOffset 的 uniform buffer，但只提供了 ${dynamicValues?.length ?? 0} 个偏移值。`);
                }
                let dynamicIndex = 0;
                for (const slot of blocks) {
                    const entry = group.entry(slot.binding);
                    if (!entry) {
                        throw new ValidationError(`[gpu-device-api] bind group「${group.label}」缺少 binding ${slot.binding}（布局要求提供 uniform buffer）。`);
                    }
                    const resource = entry.resource;
                    const buffer = resource.buffer;
                    const baseOffset = resource.offset ?? 0;
                    if (slot.dynamic) {
                        // 设备常量，按 context 记一次（原先每 draw 每个动态块都做一次同步 getParameter）。
                        const alignment = this.state.uniformBufferOffsetAlignment();
                        const dynamicOffset = dynamicValues[dynamicIndex++] ?? 0;
                        if (alignment > 0 && dynamicOffset % alignment !== 0) {
                            throw new ValidationError(`[gpu-device-api] 动态偏移 ${dynamicOffset} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${alignment}）的倍数。` +
                                'uniform arena 的每段长度必须按这个对齐值取整。');
                        }
                        const offset = baseOffset + dynamicOffset;
                        const size = resource.size ?? buffer.size - offset;
                        this.state.bindUniformBuffer(slot.blockBinding, buffer.native, offset, size);
                    }
                    else {
                        this.state.bindUniformBuffer(slot.blockBinding, buffer.native, 0, -1);
                    }
                }
            }
            // ---- 纹理与采样器 ---------------------------------------------------------------------
            const textures = plan.texturesByGroup.get(groupIndex);
            if (textures) {
                for (const slot of textures) {
                    const entry = group.entry(slot.binding);
                    if (!entry) {
                        throw new ValidationError(`[gpu-device-api] bind group「${group.label}」缺少 binding ${slot.binding}（布局要求提供纹理「${slot.name}」）。`);
                    }
                    const view = entry.resource.view;
                    this.assertViewRangeSupported(view);
                    this.state.bindTexture(slot.unit, view.target, view.glTexture);
                    if (slot.samplerBinding !== null) {
                        const samplerEntry = group.entry(slot.samplerBinding);
                        if (!samplerEntry) {
                            throw new ValidationError(`[gpu-device-api] bind group「${group.label}」缺少 binding ${slot.samplerBinding}` +
                                `（纹理「${slot.name}」配套的 sampler「${slot.samplerName ?? '未命名'}」）。`);
                        }
                        const sampler = samplerEntry.resource.sampler;
                        this.state.bindSampler(slot.unit, sampler.native);
                    }
                }
            }
        }
        this.assertAllGroupsBound(plan);
    }
    /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
    assertAllGroupsBound(plan) {
        let missing = null;
        for (const groupIndex of plan.requiredGroups) {
            if (this.bindGroups.get(groupIndex))
                continue;
            (missing ??= []).push(groupIndex);
        }
        if (missing) {
            throw new ValidationError(`[gpu-device-api] 管线需要 bind group ${missing.join('、')}，但本次绘制前没有调用 setBindGroup()。` +
                '缺少绑定会让着色器读到未定义的数据（画面通常全黑且没有任何报错），所以这里直接拦下。');
        }
    }
    /**
     * WebGL2 无法表达「同一个纹理的不同 mip 子范围视图」：mip 范围是纹理对象自身的参数，
     * 不是绑定点状态。为了避免同一张纹理被两个 view 以不同 mip 范围采样时结果错乱，这里直接报错。
     */
    assertViewRangeSupported(view) {
        const descriptor = view.descriptor;
        const texture = view.texture;
        if (descriptor.baseMipLevel !== 0 || descriptor.mipLevelCount !== texture.mipLevelCount) {
            throw new ValidationError(`[gpu-device-api] WebGL2 后端不支持在绑定时指定 mip 子范围（纹理「${texture.label}」的 view 指定了 ` +
                `baseMipLevel=${descriptor.baseMipLevel}, mipLevelCount=${descriptor.mipLevelCount}）。` +
                'mip 范围是纹理对象自身的状态，不是绑定点状态。请为需要的 mip 范围单独创建一张纹理。');
        }
    }
    /**
     * 原始附件（不走 RenderTarget）路径下的清屏。
     *
     * ## 下标语义（`#11`）：`clearBufferfv(COLOR, i)` 的 `i` 是 **location 下标**，不是附着点枚举
     *
     * `clearBuffer*` 的 `drawbuffer` 参数是「第几个 draw buffer」，清的是 `drawBuffers[i]` 指向的
     * 附着点。`FramebufferCache` 现在按**逐位置**挂附件（`drawBuffers[i] = COLOR_ATTACHMENT0 + i`，
     * 空位为 `NONE`），所以这里用**原始数组下标**清屏才是对的，三处必须一致：
     *
     * | 处 | 语义 |
     * | --- | --- |
     * | `FramebufferCache.acquire` 挂附件 | `COLOR_ATTACHMENT0 + 原始下标` |
     * | `FramebufferCache.acquire` 的 `drawBuffers` | 逐位置，空位 `NONE` |
     * | 这里 | `clearBufferfv(COLOR, 原始下标)` |
     *
     * 任何一处改用「非空附件的压缩序号」，`colorAttachments: [null, view]` 这类组合就会
     * 静默地画错（改前正是如此：附件挂在 0、清屏清 1、draw 的 location 0 又写进 view）。
     * `null` 空位**不清屏**：那个 location 没有片元输出，清它没有意义。
     */
    clearRawAttachments(descriptor, framebuffer, view) {
        const gl = this.gl;
        void framebuffer;
        /*
         * `#14`：scissor 复位成「整个附件、关闭」。
         *
         * 尺寸用**第一个附件**的大小，而不是 `drawingBufferWidth/Height`：这条分支画进的
         * 是按附件临时拼出来的 FBO，它的视口/清屏范围本来就由第一个附件决定（见构造器），
         * 拿默认帧缓冲的尺寸去复位等于给「整个附件」填了一个别的数。
         */
        this.state.resetScissor(view.texture.width, view.texture.height);
        const attachments = descriptor.colorAttachments;
        attachments.forEach((attachment, index) => {
            if (!attachment || attachment.loadOp === 'load')
                return;
            const [r, g, b, a] = resolveClearColor(attachment.clearValue);
            // 复用共享暂存数组（#35）：改前每个附件都 `new Float32Array([r, g, b, a])`。
            // `clearBufferfv` 会立刻拷贝内容，所以下一次写入不会影响已经下发的清屏。
            gl.clearBufferfv(gl.COLOR, index, writeClearColor(r, g, b, a));
        });
        const depthStencil = descriptor.depthStencilAttachment;
        if (depthStencil && depthStencil.depthLoadOp !== 'load') {
            const hasStencil = depthStencil.view.texture.format.includes('stencil');
            // 打开深度与模板的写掩码再清：GL 的清屏受写掩码限制，上一条管线把
            // `stencilWriteMask` 设成 0 时清模板会被静默跳过（模板值跨通道残留）。
            this.state.prepareClear(hasStencil);
            const depth = depthStencil.depthClearValue ?? 1;
            const stencilValue = depthStencil.stencilClearValue ?? 0;
            if (hasStencil) {
                gl.clearBufferfi(gl.DEPTH_STENCIL, 0, depth, stencilValue);
            }
            else {
                CLEAR_DEPTH_SCRATCH[0] = depth;
                gl.clearBufferfv(gl.DEPTH, 0, CLEAR_DEPTH_SCRATCH);
            }
        }
        this.state.invalidate();
    }
    /**
     * 画进默认帧缓冲（canvas）。
     *
     * 默认帧缓冲只有 BACK 一个颜色缓冲，没有 FBO 对象，所以这里用最传统的
     * `clearColor` + `clear` 组合，而不是 `clearBufferfv`（后者对默认帧缓冲的行为各实现不一）。
     */
    beginDefaultFramebufferPass(descriptor) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.state.invalidate();
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        this.state.setScissor(false, 0, 0, width, height);
        const attachment = descriptor.colorAttachments.find((item) => item !== null);
        if (attachment && attachment.loadOp !== 'load') {
            const [r, g, b, a] = resolveClearColor(attachment.clearValue);
            gl.clearColor(r, g, b, a);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        const depthStencil = descriptor.depthStencilAttachment;
        if (depthStencil && depthStencil.depthLoadOp !== 'load') {
            gl.depthMask(true);
            gl.clearDepth(depthStencil.depthClearValue ?? 1);
            gl.clear(gl.DEPTH_BUFFER_BIT);
        }
        gl.viewport(0, 0, width, height);
        this.state.setViewport(0, 0, width, height);
    }
    assertOpen(operation) {
        if (this._ended) {
            throw new ValidationError(`[gpu-device-api] 渲染通道「${this.label}」已经 end()，不能再调用 ${operation}()。`);
        }
    }
}
/** 便于其它模块判断某个 binding 类型是否需要纹理。 */
export function isTextureBindingType(type) {
    return type === BindingType.Texture || type === BindingType.StorageTexture;
}
//# sourceMappingURL=WebGL2RenderPassEncoder.js.map