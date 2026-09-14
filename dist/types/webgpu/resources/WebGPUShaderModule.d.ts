/**
 * WebGPU shader module：`ShaderModule` 接口的实现。
 *
 * 本类**只保存原始源码**（与 core 的设计一致）：真正调 `device.createShaderModule` 发生在
 * 第一次需要原生模块时（也就是创建管线时），因为：
 *
 * - WGSL 源里包含全部 entry point，一个 module 只需要编译一次；
 * - `compileShaderStage` 需要知道「是哪个 stage」才能给出准确的缺源码报错，
 *   而 stage 只有在创建管线时才确定；
 * - core 的 `ShaderModule` 没有 `native` 成员，编译时机属于后端内部细节。
 *
 * 编译入口是 {@link WebGPUShaderModule.compile}；`native` 反映真实状态：尚未编译时为 `null`，
 * 不会为了「看起来有值」而凭空编译。
 */
import type { GlslWrapOptions, ShaderModule, ShaderModuleDescriptor, ShaderSource } from '../../core/resources/ShaderModule.js';
import type { ShaderStage } from '../../core/enums/ShaderStage.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUShaderModule implements ShaderModule {
    readonly label: string;
    readonly source: ShaderSource;
    readonly defines: Record<string, string | number | boolean>;
    /** GLSL 自动包装开关：WGSL 没有版本指令与精度前言，这里只保存不生效。 */
    readonly glsl: GlslWrapOptions;
    private readonly device;
    private readonly modulesByStage;
    private _disposed;
    constructor(device: WebGPUDevice, descriptor: ShaderModuleDescriptor);
    get disposed(): boolean;
    /** 是否已经为某个 stage 编译过原生模块。 */
    get compiled(): boolean;
    /**
     * 原生 `GPUShaderModule`；尚未编译时为 `null`。
     *
     * 编译需要 stage（core 的 module 里可能同时含 vertex / fragment / compute 入口），
     * 所以这里不代劳；创建管线的路径会先调用 {@link WebGPUShaderModule.compile}。
     */
    get native(): GPUShaderModule | null;
    /** 按 stage 得到最终 WGSL 源码（补齐 `defines` 与防御性包装），不触发 GPU 编译。 */
    finalSource(stage: ShaderStage): string;
    /**
     * 取得（必要时创建）原生 `GPUShaderModule`。
     *
     * WGSL 里含所有 entry point，因此不同 stage 复用同一个编译结果；缓存仍然按 stage 记录，
     * 以便 `finalSource()` 的报错信息与实际使用一致。
     */
    compile(stage: ShaderStage): GPUShaderModule;
    /** GPUShaderModule 没有 destroy；释放只是把本包装对象标记为不可用。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 shader module。 */
export declare function isWebGPUShaderModule(value: unknown): value is WebGPUShaderModule;
/** 把 core 的 `ShaderModule` 收窄为 WebGPU 实现。 */
export declare function asWebGPUShaderModule(value: unknown, context: string): WebGPUShaderModule;
//# sourceMappingURL=WebGPUShaderModule.d.ts.map