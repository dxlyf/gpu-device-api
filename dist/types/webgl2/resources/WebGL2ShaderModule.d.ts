/**
 * WebGL2 的 shader module。
 *
 * 与 WebGPU 不同，WebGL2 的编译单元是 **program**（一个 vertex + 一个 fragment 链接在一起），
 * 而 `createShaderModule` 只拿到源码。所以这里**只保存原始源码、defines 与 GLSL 包装选项**，
 * 真正的 `compileShader` / `linkProgram` 由 `WebGL2RenderPipeline` 在创建管线时完成
 * （那时才同时握有 vertex 与 fragment 两份源码）。
 *
 * 这也让 `ShaderModule` 可以跨管线复用：同一个 module 被多个管线引用时，
 * 每个管线各自链接 program，而 GL 的 shader 对象由管线内部的 `ProgramCache` 管理。
 */
import type { GlslWrapOptions, ShaderModule, ShaderModuleDescriptor, ShaderSource } from '../../core/resources/ShaderModule.js';
export declare class WebGL2ShaderModule implements ShaderModule {
    readonly label: string;
    readonly source: ShaderSource;
    readonly defines: Record<string, string | number | boolean>;
    readonly glsl: GlslWrapOptions;
    private _disposed;
    constructor(descriptor: ShaderModuleDescriptor);
    get disposed(): boolean;
    /**
     * 释放 module。
     *
     * GL 的 shader 对象归属于已经链接出来的 program（链接成功后 shader 对象就可以删除，
     * 不会影响 program），所以这里没有需要立即释放的 GL 资源；已编译的 program 由
     * `ProgramCache` 统一管理生命周期。
     */
    dispose(): void;
}
//# sourceMappingURL=WebGL2ShaderModule.d.ts.map