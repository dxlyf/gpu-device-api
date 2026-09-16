/**
 * WebGPU compute pipeline：`ComputePipeline` 接口在 `GPUComputePipeline` 上的实现。
 *
 * 与 render pipeline 不同，compute pipeline 不需要 attachment 格式或 vertex layout，
 * 因此没有 variant 的概念：第一次 `resolve()`（或访问 `native`）时编译一次并缓存。
 * `layout: 'auto'` 原样透传给 WebGPU。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
import { ShaderStage } from '../../core/enums/ShaderStage.js';
import { DEFAULT_PREWARM_TIMEOUT_MS, createCompilationMessage, describeCompilationInfo, emptyCompilationInfo, nowMs, withTimeout, } from '../../core/pipeline/CompilationInfo.js';
import { asGPUPipelineLayout } from '../binding/WebGPUPipelineLayout.js';
import { asWebGPUShaderModule } from '../resources/WebGPUShaderModule.js';
/** compute 入口点缺省名，与 core 的文档一致。 */
export const DEFAULT_COMPUTE_ENTRY_POINT = 'csMain';
export class WebGPUComputePipeline {
    label;
    descriptor;
    layout;
    device;
    _native = null;
    _disposed = false;
    constructor(device, descriptor) {
        this.device = device;
        this.descriptor = descriptor;
        this.label = descriptor.label ?? `computePipeline#${device.nextResourceId('computePipeline')}`;
        this.layout = descriptor.layout ?? 'auto';
    }
    /** 已经编译出原生 pipeline 时为 true（不触发编译）。 */
    get compiled() {
        return this._native !== null;
    }
    /** 原生句柄；尚未编译时触发一次编译。 */
    get native() {
        return this.resolve();
    }
    get disposed() {
        return this._disposed;
    }
    /** 取得（必要时创建）原生 compute pipeline。 */
    resolve() {
        if (this._disposed) {
            throw new ValidationError(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
        }
        if (this._native)
            return this._native;
        this._native = this.device.native.createComputePipeline(this.toGPUComputePipelineDescriptor());
        return this._native;
    }
    /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        this._native = null;
        this.device.untrack(this);
    }
    /**
     * 异步预热：优先 `createComputePipelineAsync()`。
     *
     * 预热结果写进与 `resolve()` 相同的 `_native` 字段，所以之后第一次真正使用这条 compute
     * 管线时不再触发 GPU 编译。实现缺失 `createComputePipelineAsync` 时退化成同步创建，
     * `mode` 为 `'sync'`、`reason` 说明原因。失败不抛错（除非 `throwOnError`），诊断在 `info` 里。
     */
    async prewarm(options = {}) {
        const started = nowMs();
        if (this._disposed) {
            throw new ValidationError(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
        }
        if (this._native !== null) {
            const info = await this.getCompilationInfo();
            return {
                label: this.label,
                backend: 'webgpu',
                ok: !info.hasErrors,
                mode: 'async',
                reason: null,
                durationMs: nowMs() - started,
                info,
            };
        }
        const descriptor = this.toGPUComputePipelineDescriptor();
        const device = this.device.native;
        const createAsync = device.createComputePipelineAsync;
        let mode = 'async';
        let reason = null;
        let created = null;
        let failure = null;
        if (typeof createAsync !== 'function') {
            mode = 'sync';
            reason =
                'this WebGPU implementation does not expose GPUDevice.createComputePipelineAsync(), ' +
                    'so the pipeline was created synchronously and the compile cost stayed on the calling thread';
        }
        try {
            if (typeof createAsync === 'function') {
                created = await withTimeout(createAsync.call(device, descriptor), options.timeoutMs ?? DEFAULT_PREWARM_TIMEOUT_MS, `createComputePipelineAsync("${this.label}")`);
            }
            else {
                created = this.device.native.createComputePipeline(descriptor);
            }
        }
        catch (error) {
            failure = error instanceof Error ? error.message : String(error);
            if (reason === null)
                reason = failure;
        }
        if (created !== null && this._native === null)
            this._native = created;
        const info = await this.collectCompilationInfo(failure);
        const ok = created !== null && failure === null;
        const result = {
            label: this.label,
            backend: 'webgpu',
            ok,
            mode,
            reason: ok ? (mode === 'sync' ? reason : null) : (failure ?? 'shader compilation reported errors'),
            durationMs: nowMs() - started,
            info,
        };
        if (!result.ok && options.throwOnError) {
            throw new ValidationError(describeCompilationInfo(info));
        }
        return result;
    }
    /** 编译诊断：转发 `GPUShaderModule.getCompilationInfo()`。 */
    async getCompilationInfo() {
        return this.collectCompilationInfo(null);
    }
    /** 组装 `GPUComputePipelineDescriptor`（预热与 `resolve()` 走同一份，避免两处漂移）。 */
    toGPUComputePipelineDescriptor() {
        const module = asWebGPUShaderModule(this.descriptor.compute.module, `ComputePipeline "${this.label}".compute.module`);
        return {
            label: this.label,
            layout: asGPUPipelineLayout(this.layout, `ComputePipeline "${this.label}"`),
            compute: {
                module: module.compile(ShaderStage.Compute),
                entryPoint: this.descriptor.compute.entryPoint ?? DEFAULT_COMPUTE_ENTRY_POINT,
            },
        };
    }
    async collectCompilationInfo(failure) {
        const module = asWebGPUShaderModule(this.descriptor.compute.module, `ComputePipeline "${this.label}".compute.module`);
        const base = typeof module.getCompilationInfo === 'function'
            ? await module.getCompilationInfo(ShaderStage.Compute)
            : emptyCompilationInfo(this.label, 'webgpu');
        if (failure === null)
            return base;
        return {
            ...base,
            messages: [
                ...base.messages,
                createCompilationMessage({
                    type: 'error',
                    message: failure,
                    label: this.label,
                    backend: 'webgpu',
                }),
            ],
            hasErrors: true,
        };
    }
}
/** 该对象是否为 WebGPU 后端的 compute pipeline。 */
export function isWebGPUComputePipeline(value) {
    return value instanceof WebGPUComputePipeline;
}
/** 把 core 的 `ComputePipeline` 收窄为原生 `GPUComputePipeline`。 */
export function asGPUComputePipeline(value, context) {
    if (value instanceof WebGPUComputePipeline)
        return value.resolve();
    const native = value?.native;
    if (native && typeof native === 'object')
        return native;
    throw new ValidationError(`[gpu-device-api] ${context}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native ` +
        'GPUComputePipeline).');
}
//# sourceMappingURL=WebGPUComputePipeline.js.map