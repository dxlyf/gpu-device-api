/**
 * WebGPU 逻辑设备：`Device` 接口在 `GPUDevice` 上的实现。
 *
 * 职责有三块：
 *
 * 1. **资源工厂**：所有 `create*` 都会把创建出来的 core 资源登记到内部集合里，
 *    使 `dispose()` 能一次性释放设备创建的全部资源；
 * 2. **错误通道**：`device.onuncapturederror` 被路由到 `Device.onError` 注册的回调，
 *    原始 `GPUValidationError` / `GPUOutOfMemoryError` / `GPUInternalError` 会被翻译成
 *    core 的 `ValidationError` / `OutOfMemoryError` / `GPUInternalError`；
 * 3. **设备丢失**：`device.lost` 映射为 {@link DeviceLostInfo}，并在非主动销毁的情况下
 *    额外上报一个 {@link DeviceLostError}。
 *
 * ## 丢失之后能做什么、不能做什么
 *
 * 能：同步查询（{@link WebGPUDevice.lostInfo} / {@link WebGPUDevice.usable}）、`await device.lost`、
 * 通过 `onError` 收到通知，并且**所有后续提交都会明确报错**（`queue.submit` / `writeBuffer` /
 * 各 `create*`）而不是被实现静默丢弃。
 *
 * 不能：**恢复**。`GPUDevice` 一旦丢失就永久失效，本层拿不到任何可以重建它的东西
 * （`GPUAdapter` 也不在设备上）。正确的恢复流程是：`dispose()` → 用 adapter 重新
 * `requestDevice()` → 重建全部资源。本层不做这件事，也不假装 `usable` 会回到 true。
 *
 * 另外本类额外暴露了 `defaultSampleCount`：core 的 `DeviceDescriptor` 有这个字段，
 * 但 `Device` 接口没有把它读出来，而 `CanvasConfig.sampleCount` 的默认值又要求读设备默认值。
 */
import { GpuError, isGpuError } from '../core/errors/GpuError.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { OutOfMemoryError } from '../core/errors/OutOfMemoryError.js';
import { GPUInternalError } from '../core/errors/GPUInternalError.js';
import { DeviceLostError } from '../core/errors/DeviceLostError.js';
import { assertErrorScopeFilter, } from '../core/errors/ErrorScope.js';
import { BufferUsage } from '../core/enums/BufferUsage.js';
import { assertNonNegativeInteger } from '../utils/assert.js';
import { disposeAll } from '../utils/Disposable.js';
import { createLogger } from '../utils/logger.js';
import { nextId } from '../utils/id.js';
import { assertSampleCount } from './utils/wgpuEnumMap.js';
import { readDeviceLimits, readSupportedFeatures, WebGPUFeatures, } from './utils/wgpuCapabilities.js';
import { WebGPUBuffer } from './resources/WebGPUBuffer.js';
import { WebGPUTexture } from './resources/WebGPUTexture.js';
import { WebGPUExternalTexture } from './resources/WebGPUExternalTexture.js';
import { WebGPUSampler } from './resources/WebGPUSampler.js';
import { WebGPUShaderModule } from './resources/WebGPUShaderModule.js';
import { WebGPUQuerySet, asGPUQuerySet, TIMESTAMP_INSIDE_PASSES_FEATURES, TIMESTAMP_QUERY_FEATURE } from './resources/WebGPUQuerySet.js';
import { WebGPUQueryResult } from './sync/WebGPUQueryResult.js';
import { WebGPUBindGroup } from './binding/WebGPUBindGroup.js';
import { WebGPUBindGroupLayout } from './binding/WebGPUBindGroupLayout.js';
import { WebGPUPipelineLayout } from './binding/WebGPUPipelineLayout.js';
import { WebGPURenderPipeline } from './pipeline/WebGPURenderPipeline.js';
import { WebGPUComputePipeline } from './pipeline/WebGPUComputePipeline.js';
import { WebGPURenderTarget } from './render/WebGPURenderTarget.js';
import { WebGPUCommandEncoder } from './render/WebGPUCommandEncoder.js';
import { WebGPUCanvasContext } from './WebGPUCanvasContext.js';
import { WebGPUQueue } from './sync/WebGPUQueue.js';
export class WebGPUDevice {
    label;
    backend = 'webgpu';
    native;
    features;
    limits;
    queue;
    debug;
    lost;
    /** 请求设备时实际启用的 feature 名（`DeviceDescriptor.requiredFeatures`）。 */
    enabledFeatures;
    /**
     * 设备上**真正启用**的 feature 集合。
     *
     * 与 {@link WebGPUDevice.features}（adapter 支持什么）不是一回事：adapter 支持 `timestamp-query`
     * 但 `requiredFeatures` 里没写，设备上就没有这个能力。`native.features` 是权威来源；
     * 实现没有暴露它（或跑在 mock 上）时退回请求列表。
     */
    enabledFeatureSet;
    /** 创建本设备的 adapter 信息，便于日志与调试。 */
    adapterInfo;
    /**
     * GPU 计时能力的真实探测结果（见 {@link DeviceTimingSupport}）。
     *
     * 刻意在**创建设备时**算一次并缓存：能力判定必须落到真实的 API 表面（方法在不在），
     * 而不是 `features` 里的名字。探测结论在一台设备上不会变，所以不必每次问。
     */
    timing;
    /** `requiredLimits` 经校验后的完整 limits；`limits` 则来自实际创建出来的 device。 */
    requestedLimits;
    /** `DeviceDescriptor.defaultSampleCount` 的规范化结果（1 或 4）。 */
    defaultSampleCount;
    /** 请求设备时的原始 descriptor，便于诊断。 */
    descriptor;
    logger;
    resources = new Set();
    canvasContexts = new Map();
    errorCallbacks = new Set();
    /**
     * `#20` 已压入、尚未弹出的错误作用域（栈顶即最内层）。
     *
     * 与原生的 `[[errorScopeStack]]` **一一对应**：这里只在 push 成功、pop 成功时同步增删，
     * 任何原生调用失败都会把本地这一层回滚掉，因此 `scopeDepth` 永远不会与原生栈不一致
     * （「状态撒谎」是本库反复修过的一类问题）。
     */
    scopeStack = [];
    resolveLost;
    lostInfoValue = null;
    _disposed = false;
    constructor(native, init) {
        this.native = native;
        this.descriptor = init.descriptor;
        this.label = init.descriptor.label ?? (native.label.length > 0 ? native.label : 'webgpu-device');
        this.adapterInfo = init.adapterInfo;
        this.requestedLimits = init.resolvedLimits;
        this.debug = init.descriptor.debug ?? false;
        this.enabledFeatures = [...(init.descriptor.requiredFeatures ?? [])];
        this.enabledFeatureSet = readEnabledFeatures(native, this.enabledFeatures);
        this.features = new WebGPUFeatures(
        // 原生的 feature 名列表之外再补一个**纯调用面**的能力名：`importExternalTexture` 不是
        // WebGPU 的 feature（没有 `requiredFeatures` 要开），但它在部分实现上根本不存在，
        // 所以按「方法在不在」上报。上层就能用 `device.features.has('external-texture')`
        // 两个后端统一判断（WebGL2 上恒为 false），不必自己去看 `device.native`。
        typeof native.importExternalTexture === 'function'
            ? [...init.adapterFeatures, 'external-texture']
            : init.adapterFeatures);
        this.limits = readDeviceLimits(native.limits);
        this.defaultSampleCount = assertSampleCount(init.descriptor.defaultSampleCount ?? 1, 'DeviceDescriptor.defaultSampleCount');
        this.logger = createLogger(`webgpu:${this.label}`);
        let resolveLost = () => { };
        this.lost = new Promise((resolve) => {
            resolveLost = resolve;
        });
        this.resolveLost = resolveLost;
        this.queue = new WebGPUQueue(this);
        // 能力探测放在这里而不是字段初始化处：它会建一个原生 encoder 探路。
        // 先装好 `onuncapturederror`，探测期间万一出事也能走到正常的上报通道。
        native.onuncapturederror = (event) => {
            this.reportError(toGpuError(event.error));
        };
        this.timing = readTimingSupport(native, this.enabledFeatureSet, init.adapterFeatures);
        void native.lost.then((info) => this.handleDeviceLost(info));
        this.logger.debug(`created device (${this.adapterInfo.device || this.adapterInfo.vendor || 'unknown adapter'}, ` +
            `features: ${this.enabledFeatures.join(', ') || 'none'})`);
    }
    get disposed() {
        return this._disposed;
    }
    /** 设备是否仍然可用。 */
    get usable() {
        return !this._disposed && this.lostInfoValue === null;
    }
    /**
     * 已丢失时的信息；未丢失时为 `null`。
     *
     * 与 `lost` promise 表达同一件事，但可以同步查询 —— 帧循环里「现在还能不能提交」需要它。
     * 丢失一旦发生就**不可撤销**：`GPUDevice` 失效后没有任何原生手段把它救回来，
     * 恢复只能重新 `requestDevice` 并重建全部资源（本层不做这件事，见类文档）。
     */
    get lostInfo() {
        return this.lostInfoValue;
    }
    /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
    get trackedResourceCount() {
        return this.resources.size;
    }
    /**
     * 该 feature 是否**已经在本设备上启用**（不只是 adapter 支持）。
     *
     * 需要 feature 的能力（timestamp 查询等）必须查这个而不是 `features.has()`，
     * 否则会出现「adapter 支持 → 我们以为能用 → 原生校验失败」的静默失效。
     */
    hasEnabledFeature(feature) {
        return this.enabledFeatureSet.has(feature);
    }
    /**
     * GPU 时间戳的「纳秒 / 刻度」换算系数。
     *
     * 优先读 `queue.getTimestampPeriod()`（规范接口），再退回 `queue.timestampPeriod` 属性。
     * 本仓库实测的 Chrome（2025 年的 Windows 版本）两者都没有暴露，此时按规范默认值 1 处理 ——
     * 也就是刻度本身就是纳秒。**绝不能**因为拿不到这个值就把刻度直接当纳秒用而不做说明：
     * 那样在其它实现（例如 period 是 83.33 的某些移动 GPU）上会得到系统性偏小的数字。
     */
    get timestampPeriod() {
        const queue = this.native.queue;
        if (typeof queue.getTimestampPeriod === 'function') {
            const value = queue.getTimestampPeriod();
            if (typeof value === 'number' && Number.isFinite(value) && value > 0)
                return value;
        }
        if (typeof queue.timestampPeriod === 'number' && Number.isFinite(queue.timestampPeriod) && queue.timestampPeriod > 0) {
            return queue.timestampPeriod;
        }
        return 1;
    }
    /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
    nextResourceId(prefix) {
        return nextId(prefix);
    }
    /* ---------------------------------------------------------------- 资源 */
    createBuffer(descriptor) {
        this.assertUsable('createBuffer');
        return this.track(new WebGPUBuffer(this, descriptor));
    }
    createTexture(descriptor) {
        this.assertUsable('createTexture');
        return this.track(WebGPUTexture.create(this, descriptor));
    }
    createSampler(descriptor = {}) {
        this.assertUsable('createSampler');
        return this.track(new WebGPUSampler(this, descriptor));
    }
    createShaderModule(descriptor) {
        this.assertUsable('createShaderModule');
        return this.track(new WebGPUShaderModule(this, descriptor));
    }
    createQuerySet(descriptor) {
        this.assertUsable('createQuerySet');
        return this.track(new WebGPUQuerySet(this, descriptor));
    }
    /**
     * 把一个图像来源导入成外部纹理（原生 `GPUDevice.importExternalTexture`）。
     *
     * ## 为什么先探测方法在不在，而不是无脑转发
     *
     * `GPUDevice.importExternalTexture` 在**部分实现上没有**（原生接口本身也是可选的：
     * Chrome 很早就有了，其它实现未必）。直接调用会得到一句 `is not a function`，而调用方
     * 完全没有上下文。这里显式探测并给出一条带替代方案的消息 —— 这也是本库对
     * 「能力可能在也可能不在」的一贯做法（对照 `readTimingSupport()`）。
     *
     * ## 过期语义
     *
     * 返回的对象是**一帧有效**的：原生把它绑到自动过期任务源，之后任何使用都会失败。
     * 本类只提供 {@link ExternalTexture.expired} 的透传查询，不自己计时（见
     * `WebGPUExternalTexture` 的说明）。**每帧重新导入**是调用方的契约。
     *
     * ## `colorSpace` 明确报错而不是静默忽略
     *
     * `ExternalTextureDescriptor.colorSpace` 是**本库刻意保留但未实现**的字段
     * （规范的 `GPUExternalTextureDescriptor` 现在只有 `source` / `label`）。既然它在
     * 类型里存在，传了却什么都不做就是本库最忌讳的静默忽略，所以这里直接报错并给出替代方案。
     */
    importExternalTexture(descriptor) {
        this.assertUsable('importExternalTexture');
        if (descriptor.colorSpace !== undefined) {
            throw new ValidationError('[gpu-device-api] Device.importExternalTexture: "colorSpace" is not implemented by the WebGPU ' +
                'backend (the native GPUExternalTextureDescriptor has no such field, so forwarding it would be ' +
                'silently ignored). Convert the source into the wanted color space before importing it — for ' +
                'example draw it into an OffscreenCanvas and re-import that — or omit the option.');
        }
        const importNative = this.native.importExternalTexture;
        if (typeof importNative !== 'function') {
            throw new ValidationError(`[gpu-device-api] Device.importExternalTexture: this WebGPU implementation does not expose ` +
                'GPUDevice.importExternalTexture, so external textures cannot be imported on this device. ' +
                'Upload the frame into a regular texture instead (Queue.copyExternalImageToTexture) and sample ' +
                'that; it needs no external-texture support and behaves the same on both backends.');
        }
        const label = descriptor.label ?? `externalTexture#${this.nextResourceId('externalTexture')}`;
        const native = importNative.call(this.native, { source: descriptor.source, label });
        return this.track(new WebGPUExternalTexture(this, native, label));
    }
    /**
     * 读回 query set 的结果：`resolveQuerySet` → `copyBufferToBuffer` → `mapAsync`。
     *
     * 两个中转 buffer 都通过 `this.createBuffer()` 创建，因此被设备的资源追踪覆盖：
     * 正常路径由 `QueryResult.read()` 销毁，忘了读则在 `device.dispose()` 时统一释放。
     */
    readQuerySet(querySet, options = {}) {
        this.assertUsable('readQuerySet');
        // 先收窄原生对象（顺带校验这是本后端的 query set），早报错更清楚。
        asGPUQuerySet(querySet, `Device "${this.label}".readQuerySet(querySet)`);
        const first = options.firstQuery ?? 0;
        assertNonNegativeInteger(first, 'QuerySetReadOptions.firstQuery');
        const count = options.queryCount ?? querySet.count - first;
        if (!Number.isInteger(count) || count <= 0) {
            throw new ValidationError(`[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ` +
                `${String(count)}.`);
        }
        if (first + count > querySet.count) {
            throw new ValidationError(`[gpu-device-api] Device "${this.label}".readQuerySet: range [${first}, ${first + count}) exceeds the ` +
                `query set "${querySet.label}" count ${querySet.count}.`);
        }
        const label = options.label ?? `${querySet.label}:read`;
        const byteSize = count * 8;
        const staging = this.createBuffer({
            label: `${label}#resolve`,
            size: byteSize,
            usage: BufferUsage.QueryResolve | BufferUsage.CopySrc,
        });
        const readback = this.createBuffer({
            label: `${label}#readback`,
            size: byteSize,
            usage: BufferUsage.MapRead | BufferUsage.CopyDst,
        });
        const encoder = this.createCommandEncoder({ label });
        try {
            encoder.resolveQuerySet(querySet, first, count, staging, 0);
            encoder.copyBufferToBuffer(staging, 0, readback, 0, byteSize);
            this.queue.submit([encoder.finish()]);
        }
        catch (error) {
            readback.destroy();
            staging.destroy();
            throw error;
        }
        finally {
            encoder.dispose();
        }
        return new WebGPUQueryResult({
            type: querySet.type,
            count,
            timestampPeriod: this.timestampPeriod,
            staging,
            readback,
        });
    }
    /* ---------------------------------------------------------------- 绑定 */
    createBindGroupLayout(descriptor) {
        this.assertUsable('createBindGroupLayout');
        return this.track(new WebGPUBindGroupLayout(this, descriptor));
    }
    createBindGroup(descriptor) {
        this.assertUsable('createBindGroup');
        return this.track(new WebGPUBindGroup(this, descriptor));
    }
    createPipelineLayout(descriptor) {
        this.assertUsable('createPipelineLayout');
        return this.track(WebGPUPipelineLayout.create(this, descriptor));
    }
    /* ---------------------------------------------------------------- 管线 */
    createRenderPipeline(descriptor) {
        this.assertUsable('createRenderPipeline');
        return this.track(new WebGPURenderPipeline(this, descriptor));
    }
    createComputePipeline(descriptor) {
        this.assertUsable('createComputePipeline');
        return this.track(new WebGPUComputePipeline(this, descriptor));
    }
    /* ---------------------------------------------------------------- 渲染 */
    createRenderTarget(descriptor) {
        this.assertUsable('createRenderTarget');
        return this.track(new WebGPURenderTarget(this, descriptor));
    }
    createCommandEncoder(descriptor = {}) {
        this.assertUsable('createCommandEncoder');
        return this.track(new WebGPUCommandEncoder(this, descriptor));
    }
    /**
     * 为一个 canvas 建立（或取回）本设备的 swap chain 表面。
     *
     * 同一个 canvas 只会有一个 `GPUCanvasContext`，因此这里按 canvas 元素缓存
     * {@link WebGPUCanvasContext}；重复调用返回同一个对象。给了 `config`（或该 canvas 尚未
     * configure）时会重新 configure —— 也就是可以用它切换格式 / alphaMode / sampleCount。
     */
    createCanvasContext(canvas, config) {
        this.assertUsable('createCanvasContext');
        if (!canvas || typeof canvas.getContext !== 'function') {
            throw new ValidationError('[gpu-device-api] Device.createCanvasContext: expected an HTMLCanvasElement or OffscreenCanvas.');
        }
        let context = this.canvasContexts.get(canvas);
        if (!context || context.disposed) {
            context = this.track(new WebGPUCanvasContext(canvas));
            this.canvasContexts.set(canvas, context);
        }
        if (config !== undefined || !context.configured) {
            context.configure({ ...config, device: this });
        }
        return context;
    }
    /* ---------------------------------------------------------------- 错误 */
    /**
     * 注册错误回调，返回取消订阅函数。
     *
     * 设备丢失也会通过这个通道上报（见 {@link WebGPUDevice.lost}），因此即使只关心
     * 「设备还能不能用」，也应该注册一次。
     */
    onError(callback) {
        this.errorCallbacks.add(callback);
        return () => {
            this.errorCallbacks.delete(callback);
        };
    }
    /**
     * `#20` 压入错误作用域：**原生转发** `GPUDevice.pushErrorScope(filter)`。
     *
     * ## 为什么这一侧可以直接转发
     *
     * WebGPU 的错误作用域本来就是为这个场景设计的，栈、filter 匹配、不匹配时向外层穿透、
     * `pop` 的异步性全部由实现保证。本层**不重新实现**那套语义（那只会引入偏差），
     * 只做两件原生不做的事：
     *
     * 1. 记住**入栈顺序**（{@link WebGPUDevice.scopeStack}），这样未配对的 `pop` 能在本地
     *    被明确拒绝，而不是把原生那句 `OperationError` 原样漏给调用方；
     * 2. 让 `dispose()` 能把被遗弃的作用域一起清掉（否则它们会一直挂在栈上，
     *    并且原生栈也只在设备销毁时才消失）。
     *
     * ## 能力缺失时如实报错
     *
     * `GPUDevice.pushErrorScope` 在**部分实现上没有**（原生接口本身也是可选的，
     * mock / 残缺实现同样如此）。直接调用会得到一句 `is not a function`，调用方没有任何上下文，
     * 所以这里显式探测并按本库惯例给出带替代方案的英文错误 —— **不假装记录**，
     * 也不会退化成「本地记一个长度、`pop` 恒返回 null」那种会撒谎的等价物。
     */
    pushErrorScope(filter) {
        this.assertUsable('pushErrorScope');
        assertErrorScopeFilter(filter, `Device "${this.label}".pushErrorScope(filter)`);
        const native = this.native;
        if (typeof native.pushErrorScope !== 'function') {
            throw new ValidationError(`[gpu-device-api] Device "${this.label}".pushErrorScope: this WebGPU implementation does not ` +
                'expose GPUDevice.pushErrorScope, so device-level errors cannot be captured into a scope. ' +
                'Subscribe to Device.onError instead (it receives the native uncapturederror events, which is ' +
                'the same channel with coarser attribution), or run on an implementation that supports error scopes.');
        }
        native.pushErrorScope(filter);
        const scope = new WebGPUErrorScope(filter, this.scopeLabel(), () => this.popScope());
        this.scopeStack.push(scope);
        this.logger.debug(`pushed error scope "${filter}" (depth ${this.scopeStack.length})`);
        return scope;
    }
    /**
     * `#20` 弹出错误作用域：原生 `popErrorScope()` 的结果映射成本库错误类型。
     *
     * 归属由原生保证（入栈时的那一层），所以这里只处理「没有作用域可弹」这一种本地错误：
     * 它**拒绝**，而不是 resolve 成 `null` —— 后者会让「忘了配对」看起来像「作用域里没有错误」。
     */
    popErrorScope() {
        return this.popScope();
    }
    /** 当前仍在栈上的错误作用域层数（诊断与测试用）。 */
    get scopeDepth() {
        return this.scopeStack.length;
    }
    /** 作用域句柄的默认 label（与其它资源一样走 `nextResourceId`，便于日志对照）。 */
    scopeLabel() {
        return `webgpuErrorScope#${this.nextResourceId('scope')}`;
    }
    /** {@link WebGPUDevice.popErrorScope} 与作用域句柄 `pop()` 共用的唯一实现。 */
    popScope() {
        const scope = this.scopeStack.pop();
        if (!scope) {
            return Promise.reject(new ValidationError(`[gpu-device-api] Device "${this.label}".popErrorScope: there is no error scope on the stack ` +
                '(every popErrorScope() must be paired with a preceding pushErrorScope()).'));
        }
        const native = this.native;
        if (typeof native.popErrorScope !== 'function') {
            return Promise.reject(new ValidationError(`[gpu-device-api] Device "${this.label}".popErrorScope: this WebGPU implementation does not ` +
                'expose GPUDevice.popErrorScope, so the scope cannot be settled.'));
        }
        scope.close();
        return native.popErrorScope().then((error) => {
            if (error === null)
                return null;
            const mapped = toGpuError(error);
            scope.record(mapped);
            /*
             * `filterMatched` 按「交回来的错误类型是否与这一层的 filter 同类」判定，
             * 而不是无条件 true。
             *
             * 依据是**实测的原生行为**（本机无头 Chrome，见
             * `.tmp-07/probe/native-error-scope-probe.html?backend=webgpu`）：
             * `outer=validation / inner=out-of-memory /` 一条 `GPUValidationError` →
             * 内层 pop = null、外层 pop = GPUValidationError。也就是说**不匹配的错误会继续交给
             * 外层作用域**，而不是消失。反过来说，一个作用域完全可能拿到一条与它 filter 不同类的
             * 错误（只要没有更内层的作用域愿意接），那时如实报 `filterMatched = false`。
             */
            scope.markFilterMatched(nativeErrorMatchesFilter(error, scope.filter));
            return mapped;
        });
    }
    /** 通过已注册的回调上报错误，不抛异常。回调自身抛错不会影响其它回调。 */
    reportError(error) {
        if (this.errorCallbacks.size === 0) {
            // 没有订阅者时至少留下一条日志，避免错误被完全吞掉。
            this.logger.error(error.toString());
            return;
        }
        for (const callback of [...this.errorCallbacks]) {
            try {
                callback(error);
            }
            catch (callbackError) {
                this.logger.error(`error callback threw: ${String(callbackError)}`);
            }
        }
    }
    /** 释放设备创建的全部资源，然后销毁 device。幂等。 */
    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        this.native.onuncapturederror = null;
        /*
         * `#20`：被遗弃的错误作用域（push 了但没 pop）在设备销毁时一并作废。
         *
         * `native.destroy()` 会让原生作用域栈消失，所以这里必须把句柄标记成「无法再落定」，
         * 而不是只清空本地数组 —— 否则句柄的 `pop()` 会走原生那条已经失效的路径。用 `abandon()`
         * 而不是 `close()`：后者会让 `pop()` 报「已经 pop 过」，那是误导（它从来没被 pop 过）。
         */
        for (const scope of this.scopeStack)
            scope.abandon();
        this.scopeStack.length = 0;
        const resources = [...this.resources];
        this.resources.clear();
        this.canvasContexts.clear();
        try {
            disposeAll(resources);
        }
        catch (error) {
            this.logger.error(`failed to dispose some resources: ${String(error)}`);
        }
        this.errorCallbacks.clear();
        this.native.destroy();
        /*
         * `#16`：主动 dispose 也要让**同步可查询的丢失状态**与 `device.lost` 一致地落定
         * （`WebGL2Device.dispose()` 一直是这样做的，WebGPU 侧改前缺了这一步）。
         *
         * 为什么重要：跨后端的恢复代码基本都是「先看 `device.disposed` / `lostInfo` 判断该不该
         * 重建」，只有一侧填了信息时，同一段恢复逻辑在 WebGPU 上会看到 `lostInfo === null`
         * 而误判成「设备还在、只是没资源」。
         *
         * 顺序上刻意**先 `native.destroy()` 再 resolve**：`destroy()` 会让原生实现自己 resolve
         * `GPUDevice.lost`（reason `'destroyed'`），那条路径经 `handleDeviceLost()` 写入的信息更权威；
         * 这里的赋值只用于「原生实现不 resolve」的情况，且用的是同一个「主动销毁」原因。
         * 本层自己的 `lostInfoValue` 在 `_disposed` 之后不再被 `assertUsable()` 使用（它先判
         * `_disposed`），所以这里填的是给调用方读的，不会改变抛出的错误类型。
         */
        this.lostInfoValue = { reason: 'destroyed', message: 'Device.dispose() was called.' };
        this.resolveLost(this.lostInfoValue);
    }
    /* ---------------------------------------------------------------- 内部 */
    track(resource) {
        this.resources.add(resource);
        return resource;
    }
    /**
     * 资源在 `destroy()` / `dispose()` 时把自己从追踪集合里摘掉。
     *
     * 不做这一步的话，每帧 create/destroy 的工作负载（command encoder、buffer、texture、
     * bind group……）会让 `resources` 一直强引用这些已经释放的包装对象及其原生句柄，
     * 直到 `device.dispose()` 才释放 —— 这是实打实的泄漏。
     *
     * 幂等：对未追踪（或已摘掉）的资源调用是空操作。
     */
    untrack(resource) {
        this.resources.delete(resource);
    }
    /**
     * 在任何会创建资源 / 提交工作之前检查设备仍可用。
     *
     * 丢失后 `GPUDevice` 上的所有调用都会被实现**静默丢弃**（命令不执行、也不报错），
     * 表现就是「画不出来但一切正常」；所以这里必须主动抛出带 `[gpu-device-api] ` 前缀的
     * {@link DeviceLostError}，并带上丢失原因。
     *
     * ## `#16`：「已 dispose」抛的也是 `DeviceLostError`，两个后端一致
     *
     * 改前这里对 `_disposed` 抛的是 `ValidationError`，而 WebGL2 后端抛 `DeviceLostError`
     * —— 同一段上层代码（例如「拿旧 device 的资源去创建东西」的错误恢复分支）在 WebGPU 上
     * 只会看到 `ValidationError`，跨后端写 `instanceof DeviceLostError` 的恢复逻辑就会漏掉这一支。
     *
     * 「已 dispose」与「设备丢失」是两件事，但**归类**是同一类：设备已经不能再用、
     * 调用方该做的是丢弃它并重建。所以这里也抛 `DeviceLostError`，用 `reason: 'destroyed'`
     * 表示「是调用方主动释放的、属于预期情形」（`isExpected === true`），
     * 而真正的丢失（`GPUDevice.lost` / `webglcontextlost`）仍然带它自己的 reason。
     *
     * 公开（而不是 private）是因为 `WebGPUQueue` 的提交路径也要用它 —— 设备丢失后
     * `queue.submit()` 是唯一「静默无效」的提交入口，必须在那一层拦下。
     */
    assertUsable(operation) {
        if (this._disposed) {
            throw new DeviceLostError(`[gpu-device-api] Device.${operation}: device "${this.label}" has been disposed.`, { reason: 'destroyed' });
        }
        if (this.lostInfoValue) {
            throw new DeviceLostError(`[gpu-device-api] Device.${operation}: device "${this.label}" was lost (${this.lostInfoValue.reason}): ` +
                this.lostInfoValue.message, { reason: this.lostInfoValue.reason });
        }
    }
    handleDeviceLost(info) {
        const reason = info.reason === 'destroyed' ? 'destroyed' : 'unknown';
        const lostInfo = { reason, message: info.message };
        this.lostInfoValue = lostInfo;
        this.resolveLost(lostInfo);
        if (!this._disposed) {
            this.reportError(new DeviceLostError(`[gpu-device-api] WebGPU device lost (${reason}): ${info.message}`, { reason }));
        }
    }
}
/**
 * 把原生 `GPUError` 翻译成 core 的错误类型。
 *
 * 分类同时尝试 `instanceof`（浏览器里全局构造器存在）与 `constructor.name`（构造器被跨
 * realm / 被 polyfill 时的兜底），保证「不知道是哪一类」时也不会丢消息。
 */
export function toGpuError(error) {
    if (isGpuError(error))
        return error;
    const rawMessage = typeof error?.message === 'string'
        ? error.message
        : String(error);
    const message = rawMessage.startsWith('[gpu-device-api]')
        ? rawMessage
        : `[gpu-device-api] ${rawMessage}`;
    if (isGpuErrorClass(error, 'GPUValidationError'))
        return new ValidationError(message);
    if (isGpuErrorClass(error, 'GPUOutOfMemoryError'))
        return new OutOfMemoryError(message);
    if (isGpuErrorClass(error, 'GPUInternalError'))
        return new GPUInternalError(message);
    if (error instanceof Error)
        return new GpuError(message, { code: 'GPU_ERROR', cause: error });
    return new GpuError(message);
}
/**
 * 原生的 `GPUError` 是哪一类 —— 用来判断它是否与某个作用域的 `filter` **同类**。
 *
 * 复用 {@link toGpuError} 的分类结果（`instanceof` + `constructor.name` 双路兜底），
 * 这样「翻译成 core 错误类型」与「判断 filter 是否命中」永远基于同一个判断，
 * 不会出现「翻译成 ValidationError 但被当成 out-of-memory 命中」这种自相矛盾。
 */
function nativeErrorMatchesFilter(error, filter) {
    const mapped = toGpuError(error);
    if (filter === 'out-of-memory')
        return mapped instanceof OutOfMemoryError;
    if (filter === 'internal')
        return mapped instanceof GPUInternalError;
    return mapped instanceof ValidationError;
}
/**
 * `#20` WebGPU 侧的错误作用域句柄。
 *
 * ## 为什么设备上还要记一层
 *
 * 原生的 `GPUDevice` 自己维护 `[[errorScopeStack]]`，语义（嵌套、filter 穿透、异步 pop）
 * 全部由它保证。本层记这一层**只为两件事**，都不是重新实现语义：
 *
 * 1. 未配对的 `pop` 能在本地被明确拒绝（否则只能把原生那句 `OperationError` 原样漏出去，
 *    调用方既不知道是本库的哪次调用、也拿不到 `[gpu-device-api] ` 前缀）；
 * 2. `dispose()` 时把被遗弃的作用域句柄标记为 inactive，避免 `scopeDepth` 撒谎。
 */
class WebGPUErrorScope {
    label;
    filter;
    errorsSeen = [];
    settle;
    activeValue = true;
    matched = false;
    /**
     * 设备在它还没被 `pop` 的时候就被 `dispose()` 了。
     *
     * 与 {@link WebGPUErrorScope.close} 刻意分开：`close()` 表示「正常出栈了」，
     * 这里表示「设备没了，这个作用域永远不会被落定」。两者对 `pop()` 的答复不同
     *（一个说「已经 pop 过」、一个说「设备已销毁、无法落定」），混成一个状态会给出误导性的
     * 消息 —— WebGL2 侧就是被自测抓到这一点才分开的。
     */
    abandoned = false;
    constructor(filter, label, settle) {
        this.filter = filter;
        this.label = label;
        this.settle = settle;
    }
    get active() {
        return this.activeValue;
    }
    /**
     * 返回的错误是否与这一层的 `filter` **同类**。
     *
     * 依据是**实测的原生行为**（本机无头 Chrome，见
     * `.tmp-07/probe/native-error-scope-probe.html?backend=webgpu` + `wgpuNested*` 那几行）：
     * 不匹配的错误会**继续交给外层作用域**，所以一个作用域可能拿到 filter 不同类的错误。
     * 那种情况下这里如实返回 false，而不是为了让调用方安心而报 true。
     *
     * 空作用域（`pop` 返回 `null`）时保持 false ——「没有错误」谈不上命中。
     */
    get filterMatched() {
        return this.matched;
    }
    get errors() {
        return this.errorsSeen;
    }
    pop() {
        if (this.abandoned) {
            return Promise.reject(new ValidationError(`[gpu-device-api] error scope "${this.label}" can no longer be settled: the device was disposed ` +
                'while this scope was still on the stack, so the native error scope is gone with it. ' +
                'This is NOT "no error in scope" — resolving null here would be a lie.'));
        }
        if (!this.activeValue) {
            return Promise.reject(new ValidationError(`[gpu-device-api] error scope "${this.label}" has already been popped; each pushErrorScope() ` +
                'must be popped at most once.'));
        }
        return this.settle();
    }
    /** 记录任务源交回来的那条错误（`pop` 时调用；`errors` 因此最多一条）。 */
    record(error) {
        this.errorsSeen.push(error);
    }
    /** 原生返回了非 null 的错误 → 这一层的 filter 命中了。 */
    markFilterMatched(matched) {
        this.matched = matched;
    }
    /** 设备销毁时对**被遗弃的**（还没 `pop` 的）作用域调用；语义见 `abandoned` 字段。 */
    abandon() {
        this.abandoned = true;
        this.activeValue = false;
    }
    /** 正常出栈后调用；幂等。 */
    close() {
        this.activeValue = false;
    }
}
function isGpuErrorClass(value, className) {
    const ctor = globalThis[className];
    if (typeof ctor === 'function') {
        const typed = ctor;
        try {
            if (value instanceof typed)
                return true;
        }
        catch {
            // 某些 polyfill 的构造器不支持 instanceof；继续走名字兜底。
        }
    }
    const name = value?.constructor?.name;
    return name === className;
}
/**
 * 读出设备上**真正启用**的 feature 集合。
 *
 * `GPUDevice.features` 是权威来源（它只列出已启用的），但它不是所有实现都提供，
 * mock 里也没有；拿不到时退回 `requiredFeatures`（`requestDevice` 已经校验过这些名字可用）。
 */
function readEnabledFeatures(native, requested) {
    const fromDevice = readSupportedFeatures(native.features);
    if (fromDevice.size > 0)
        return fromDevice;
    return new Set(requested);
}
/**
 * 读出本设备的 GPU 计时能力（见 {@link DeviceTimingSupport}）。
 *
 * 两条路都要求 `timestamp-query` **已经在本设备上启用**（adapter 支持不算，见类文档里的
 * 「静默返回 0」那段），在此之上再各自探测真实调用面：
 *
 * - `encoderTimestamps`：原生 `GPUCommandEncoder` 上真的有 `writeTimestamp` 吗 —— 这就是
 *   实测 Chrome 缺失的那一块，只看 feature 会误判；
 * - `passTimestamps`：是否有 pass 内写时间戳的 feature（标准名或 Chrome 的实验名）。
 */
function readTimingSupport(native, enabledFeatures, adapterFeatures) {
    const timestampQueryEnabled = enabledFeatures.has(TIMESTAMP_QUERY_FEATURE);
    const insidePasses = TIMESTAMP_INSIDE_PASSES_FEATURES.some((name) => enabledFeatures.has(name));
    const encoderTimestamps = timestampQueryEnabled && probeEncoderTimestamps(native);
    const passTimestamps = timestampQueryEnabled && insidePasses;
    return {
        encoderTimestamps,
        passTimestamps,
        unavailableReason: encoderTimestamps || passTimestamps ? null : describeTimingGap(timestampQueryEnabled, adapterFeatures),
    };
}
/**
 * 两条路都不可用时，把「缺什么」写成一句带 `[gpu-device-api] ` 前缀的英文（供上层原样转述）。
 *
 * 三种情况分开说，因为它们要采取的行动完全不同：feature 没申请 → 改 `requiredFeatures`；
 * 实现没暴露方法 → 换机制或放弃；adapter 压根不支持 → 换后端。
 */
function describeTimingGap(timestampQueryEnabled, adapterFeatures) {
    if (!timestampQueryEnabled) {
        return (`[gpu-device-api] this WebGPU device does not have the "${TIMESTAMP_QUERY_FEATURE}" feature enabled, ` +
            'so no GPU timestamp can be written. Request it in DeviceDescriptor.requiredFeatures (the adapter ' +
            `supports it: ${adapterFeatures.has(TIMESTAMP_QUERY_FEATURE) ? 'yes' : 'no'}).`);
    }
    return (`[gpu-device-api] this WebGPU device enables "${TIMESTAMP_QUERY_FEATURE}", but this implementation does ` +
        'not expose GPUCommandEncoder.writeTimestamp() and does not enable ' +
        `"${TIMESTAMP_INSIDE_PASSES_FEATURES[0]}" (tried: ${TIMESTAMP_INSIDE_PASSES_FEATURES.join(', ')}), ` +
        'so there is no way to write a GPU timestamp. Read GPU time from the backend\'s own profiler instead.');
}
/**
 * 探测原生实现是否**真的**暴露 `GPUCommandEncoder.writeTimestamp()`。
 *
 * ## 为什么必须探测方法本身
 *
 * 启用 `timestamp-query` 只说明「时间戳查询这个概念可用」（`createQuerySet()` 能成功），
 * **不保证** encoder 上有写时间戳的入口。实测的 Chrome 正处在这种状态：设备启用了
 * `timestamp-query`，但 `GPUCommandEncoder` 上没有 `writeTimestamp`（那个版本只暴露实验名的
 * pass 内时间戳）。只看 feature 会判成「可用」，于是要等到真正写时间戳时才抛错 ——
 * 而那一抛在帧循环里，一个可选的分析能力把整页渲染搞挂（见 `DeviceTimingSupport`）。
 *
 * ## 探测方式
 *
 * 先建一个 encoder 看**实例**上有没有这个方法：这才是真实的调用面（比查原型更忠实，
 * 因为有些实现可能把方法挂在实例上）。encoder 不提交、不分配 GPU 内存，成本可以忽略；
 * 创建失败（假的 / 残缺的实现）就退回查原型。两条路都拿不到时一律返回 false ——
 * **未知按不可用处理**，这正是本次修复的原则。
 */
function probeEncoderTimestamps(native) {
    try {
        const encoder = native.createCommandEncoder({ label: 'gpu-device-api:timestamp-probe' });
        if (typeof encoder.writeTimestamp === 'function')
            return true;
    }
    catch {
        // 探测本身失败不能让设备创建失败：下面退回原型查询。
    }
    const ctor = globalThis.GPUCommandEncoder;
    const prototype = ctor?.prototype;
    return typeof prototype?.writeTimestamp === 'function';
}
//# sourceMappingURL=WebGPUDevice.js.map