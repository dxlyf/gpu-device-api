/**
 * WebGPU 命令录制：`CommandEncoder` / `CommandBuffer` 接口在 `GPUCommandEncoder` /
 * `GPUCommandBuffer` 上的实现。
 *
 * 两个实现细节值得注意：
 * - 同一时间只有一个 pass 可以处于打开状态（core 的契约），这里用一个「当前打开的 pass」
 *   引用进行跟踪，并在 `finish()` 时隐式 `end()`（WebGPU 原生也是这个语义）；
 * - 拷贝命令里的 `TextureLike` / `BufferLike` 只有可选的 `native`，因此每次都要做运行时
 *   收窄；收不到原生对象时抛带上下文的 {@link ValidationError}。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { assertNonNegativeInteger, assertPositiveInteger } from '../../utils/assert.js';
import { asGPUBuffer, describeUnknown } from '../resources/WebGPUBuffer.js';
import { asGPUTexture } from '../resources/WebGPUTexture.js';
import { asGPUQuerySet, TIMESTAMP_QUERY_FEATURE } from '../resources/WebGPUQuerySet.js';
import { toGPUExtent3D, toGPUOrigin3D, toGPUTextureAspect } from '../utils/wgpuEnumMap.js';
import { WebGPURenderPassEncoder, toGPURenderPassDescriptor, } from './WebGPURenderPassEncoder.js';
import { WebGPUComputePassEncoder, toGPUComputePassDescriptor } from './WebGPUComputePassEncoder.js';
export class WebGPUCommandEncoder {
    label;
    native;
    device;
    /** 唯一可能处于打开状态的 pass（render 或 compute）。 */
    openPass = null;
    _finished = false;
    _disposed = false;
    constructor(device, descriptor = {}) {
        this.device = device;
        this.label = descriptor.label ?? `commandEncoder#${device.nextResourceId('commandEncoder')}`;
        this.native = device.native.createCommandEncoder({ label: this.label });
    }
    get finished() {
        return this._finished;
    }
    get disposed() {
        return this._disposed;
    }
    /** 开始一个 render pass。同一时间只能有一个 pass 处于打开状态。 */
    beginRenderPass(descriptor) {
        this.assertRecording('beginRenderPass');
        this.closeOpenPass();
        const { native, layout, hasOcclusionQuerySet } = toGPURenderPassDescriptor(descriptor, this.device);
        const label = descriptor.label ?? this.label;
        const encoder = new WebGPURenderPassEncoder(this.device, this.native.beginRenderPass(native), layout, label, hasOcclusionQuerySet, () => {
            if (this.openPass === encoder)
                this.openPass = null;
        });
        this.openPass = encoder;
        return encoder;
    }
    /** 开始一个 compute pass。 */
    beginComputePass(descriptor) {
        this.assertRecording('beginComputePass');
        this.closeOpenPass();
        const native = toGPUComputePassDescriptor(descriptor, this.device);
        const label = descriptor?.label ?? this.label;
        const encoder = new WebGPUComputePassEncoder(this.device, this.native.beginComputePass(native), label, () => {
            if (this.openPass === encoder)
                this.openPass = null;
        });
        this.openPass = encoder;
        return encoder;
    }
    copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size) {
        this.assertRecording('copyBufferToBuffer');
        this.native.copyBufferToBuffer(asGPUBuffer(source, `${this.label}.copyBufferToBuffer(source)`), sourceOffset, asGPUBuffer(destination, `${this.label}.copyBufferToBuffer(destination)`), destinationOffset, size);
    }
    copyBufferToTexture(source, destination, copySize) {
        this.assertRecording('copyBufferToTexture');
        this.native.copyBufferToTexture({
            buffer: asGPUBuffer(source.buffer, `${this.label}.copyBufferToTexture(source)`),
            offset: source.offset ?? 0,
            bytesPerRow: source.bytesPerRow,
            rowsPerImage: source.rowsPerImage,
        }, toGPUTexelCopyTextureInfo(destination, `${this.label}.copyBufferToTexture(destination)`), toGPUExtent3D(copySize));
    }
    copyTextureToBuffer(source, destination, copySize) {
        this.assertRecording('copyTextureToBuffer');
        this.native.copyTextureToBuffer(toGPUTexelCopyTextureInfo(source, `${this.label}.copyTextureToBuffer(source)`), {
            buffer: asGPUBuffer(destination.buffer, `${this.label}.copyTextureToBuffer(destination)`),
            offset: destination.offset ?? 0,
            bytesPerRow: destination.bytesPerRow,
            rowsPerImage: destination.rowsPerImage,
        }, toGPUExtent3D(copySize));
    }
    copyTextureToTexture(source, destination, copySize) {
        this.assertRecording('copyTextureToTexture');
        this.native.copyTextureToTexture(toGPUTexelCopyTextureInfo(source, `${this.label}.copyTextureToTexture(source)`), toGPUTexelCopyTextureInfo(destination, `${this.label}.copyTextureToTexture(destination)`), toGPUExtent3D(copySize));
    }
    /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
    clearBuffer(buffer, offset = 0, size) {
        this.assertRecording('clearBuffer');
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
        this.native.clearBuffer(asGPUBuffer(buffer, `${this.label}.clearBuffer`), offset, resolvedSize);
    }
    /**
     * 把 query set 的一段结果解析进 `destination`（需要 `BufferUsage.QueryResolve`）。
     *
     * 注意读回路径：`MAP_READ` 不能与 `QUERY_RESOLVE` 组合，所以想读回必须再
     * `copyBufferToBuffer` 到一个 `MAP_READ | COPY_DST` 的 buffer（`Device.readQuerySet()` 已经封装好）。
     */
    resolveQuerySet(querySet, firstQuery, queryCount, destination, destinationOffset) {
        this.assertRecording('resolveQuerySet');
        const context = `${this.label}.resolveQuerySet`;
        assertNonNegativeInteger(firstQuery, `${context} firstQuery`);
        assertPositiveInteger(queryCount, `${context} queryCount`);
        assertNonNegativeInteger(destinationOffset, `${context} destinationOffset`);
        this.native.resolveQuerySet(asGPUQuerySet(querySet, `${context}(querySet)`), firstQuery, queryCount, asGPUBuffer(destination, `${context}(destination)`), destinationOffset);
    }
    /**
     * 在命令流里写一个 GPU 时间戳（只需要 `timestamp-query`，不需要 `timestamp-query-inside-passes`）。
     *
     * 必须在任何 pass **之外**调用：WebGPU 规定 encoder 上写时间戳时不能有打开的 pass。
     * 未启用 feature、或实现没有暴露这个方法时明确报错（后者实测存在于部分实现里）。
     */
    writeTimestamp(querySet, queryIndex) {
        this.assertRecording('writeTimestamp');
        const context = `${this.label}.writeTimestamp`;
        const nativeWrite = this.native.writeTimestamp;
        if (typeof nativeWrite !== 'function') {
            throw new ValidationError(`[gpu-device-api] ${context}: this WebGPU implementation does not expose ` +
                'GPUCommandEncoder.writeTimestamp(). Use RenderPassDescriptor.timestampWrites instead (it needs ' +
                '"timestamp-query-inside-passes"), or read GPU time from the backend\'s own profiler.');
        }
        if (!this.device.hasEnabledFeature(TIMESTAMP_QUERY_FEATURE)) {
            throw new ValidationError(`[gpu-device-api] ${context}: timestamp queries need the "${TIMESTAMP_QUERY_FEATURE}" device feature; ` +
                'request it in DeviceDescriptor.requiredFeatures.');
        }
        if (this.openPass && !this.openPass.ended) {
            throw new ValidationError(`[gpu-device-api] ${context}: a pass is still open. Call end() on it before writing a timestamp.`);
        }
        if (!Number.isInteger(queryIndex) || queryIndex < 0 || queryIndex >= querySet.count) {
            throw new ValidationError(`[gpu-device-api] ${context}: queryIndex ${String(queryIndex)} is outside the query set range ` +
                `[0, ${querySet.count}).`);
        }
        nativeWrite.call(this.native, asGPUQuerySet(querySet, `${context}(querySet)`), queryIndex);
    }
    /** 调试分组：直接转发给原生的 `GPUCommandEncoder`。 */
    pushDebugGroup(label) {
        this.assertRecording('pushDebugGroup');
        this.native.pushDebugGroup(label);
    }
    popDebugGroup() {
        this.assertRecording('popDebugGroup');
        this.native.popDebugGroup();
    }
    insertDebugMarker(label) {
        this.assertRecording('insertDebugMarker');
        this.native.insertDebugMarker(label);
    }
    /**
     * 结束录制并返回 command buffer。
     *
     * 如果有 pass 还开着，会先隐式 `end()` —— 与 WebGPU 原生的 `finish()` 行为一致
     * （否则留在录制中的 pass 会被静默丢弃）。
     *
     * ## 为什么在 finish() 里就 untrack
     *
     * 之前只有 `dispose()` 才把 encoder 从设备的资源追踪集合里摘掉，而 core 的 `CommandEncoder`
     * 接口**没有** `dispose()`（见 `core/render/CommandEncoder.ts`），于是「每帧建一个 encoder、
     * `finish()` 之后丢掉」这种最标准的用法会让 `WebGPUDevice.resources` 无上限增长：
     * 每个包装对象连同它的原生 `GPUCommandEncoder` 一直被强引用到 `device.dispose()`。
     * command encoder 是每帧都建的东西，这是一次实打实的每帧泄漏。
     *
     * **语义安全性**：`finish()` 之后本对象上的**每一个**方法都会先过 `assertRecording()` 抛错
     * （`beginRenderPass` / `beginComputePass` / 全部 copy / `clearBuffer` / `resolveQuerySet` /
     * `writeTimestamp` / 三个 debug marker 方法 / `finish` 自身），唯一还允许调用的是幂等的
     * `dispose()`；`beginRenderPass` / `beginComputePass` 返回的 pass 也会在 finish 之前被
     * `closeOpenPass()` 结束掉（pass 的 `end()` 之后同样不可再用）。也就是说 finish 之后这个
     * encoder 不可能再产生任何设备侧工作，设备追踪集合存在的唯一目的
     * （`device.dispose()` 时统一释放）对它已经没有意义，提前摘掉不会留下任何可用的悬空引用。
     */
    finish() {
        this.assertRecording('finish');
        this.closeOpenPass();
        this._finished = true;
        // 录完即从设备追踪里摘掉：finish 之后它不可再用（见上面的论证），
        // 继续留着就是每帧一份的泄漏。dispose() 之后仍可再调用（Set.delete 幂等）。
        this.device.untrack(this);
        return new WebGPUCommandBuffer(this.label, this.native.finish());
    }
    /**
     * 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。
     *
     * 幂等：`finish()` 已经摘过一次追踪，这里再摘一次是空操作；重复调用也不会抛错。
     */
    dispose() {
        this._disposed = true;
        this.device.untrack(this);
    }
    closeOpenPass() {
        if (this.openPass && !this.openPass.ended) {
            this.openPass.end();
        }
        this.openPass = null;
    }
    assertRecording(context) {
        if (this._disposed) {
            throw new ValidationError(`[gpu-device-api] CommandEncoder "${this.label}".${context}: already disposed.`);
        }
        if (this._finished) {
            throw new ValidationError(`[gpu-device-api] CommandEncoder "${this.label}".${context}: the encoder has already been finished.`);
        }
    }
}
/** 已录制的命令缓冲区。对应 WebGPU 的 `GPUCommandBuffer`。 */
export class WebGPUCommandBuffer {
    label;
    native;
    _disposed = false;
    constructor(label, native) {
        this.label = label;
        this.native = native;
    }
    get disposed() {
        return this._disposed;
    }
    /** `GPUCommandBuffer` 没有 destroy；释放只是标记本包装对象不可用（提交后本身就不可复用）。 */
    dispose() {
        this._disposed = true;
    }
}
function toGPUTexelCopyTextureInfo(view, context) {
    const info = {
        texture: asGPUTexture(view.texture, context),
    };
    if (view.mipLevel !== undefined)
        info.mipLevel = view.mipLevel;
    if (view.origin !== undefined)
        info.origin = toGPUOrigin3D(view.origin);
    if (view.aspect !== undefined)
        info.aspect = toGPUTextureAspect(view.aspect);
    return info;
}
/** 把任意 command buffer 表示收窄为原生 `GPUCommandBuffer`（供 queue.submit 使用）。 */
export function asGPUCommandBuffer(value, context) {
    if (value instanceof WebGPUCommandBuffer)
        return value.native;
    if (value && typeof value === 'object' && !('native' in value)) {
        return value;
    }
    throw new ValidationError(`[gpu-device-api] ${context}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native ` +
        `GPUCommandBuffer), got ${describeUnknown(value)}.`);
}
//# sourceMappingURL=WebGPUCommandEncoder.js.map