/**
 * WGSL 反射：从源码文本里解析出 `@group/@binding` 资源与 entry point。
 *
 * 用途有两个：
 * 1. **校验**：把管线声明的 `PipelineLayout` 与着色器里实际使用的 binding 做交叉检查，
 *    在创建管线前就报出「声明了但没用」「用了但没声明」这类问题（WebGPU 原生报错很难读）。
 * 2. **推断**：`layout: 'auto'` 时可以从源码直接推出 bind group layout，省掉手写。
 *
 * 实现是**纯文本解析**，不依赖 GPU，因此可以在 Node 里直接单测。
 * 它只覆盖资源绑定与 entry point 这两类信息，不试图做完整的 WGSL 语法分析。
 */
/** WGSL 资源变量所在的地址空间。 */
export type WgslAddressSpace = 'uniform' | 'storage' | 'handle';
/** 从 WGSL 类型推断出的资源种类。 */
export type WgslResourceKind = 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'comparison-sampler' | 'texture' | 'storage-texture';
export interface WgslBinding {
    group: number;
    binding: number;
    name: string;
    addressSpace: WgslAddressSpace;
    /** `storage` 地址空间下的访问模式。 */
    access?: 'read' | 'write' | 'read_write';
    kind: WgslResourceKind;
    /** 声明的完整类型文本，例如 `texture_2d<f32>`、`array<vec4f, 4>`。 */
    type: string;
    /** 是否为深度纹理（`texture_depth_*`）。 */
    depth: boolean;
    /** 是否为多重采样纹理。 */
    multisampled: boolean;
}
export type WgslEntryPointStage = 'vertex' | 'fragment' | 'compute';
export interface WgslEntryPoint {
    stage: WgslEntryPointStage;
    name: string;
    /** compute 入口的 workgroup_size，其它阶段为 `null`。 */
    workgroupSize: [number, number, number] | null;
}
/** 去掉行注释与块注释（WGSL 里没有字符串字面量，所以可以放心地按文本剔除）。 */
export declare function stripWgslComments(source: string): string;
/**
 * 解析源码里所有带 `@group/@binding` 的资源变量。
 * 两种属性书写顺序（`@group` 在前或 `@binding` 在前）都会识别。
 */
export declare function reflectWgslBindings(source: string): WgslBinding[];
/** 解析源码里的所有 entry point。 */
export declare function reflectWgslEntryPoints(source: string): WgslEntryPoint[];
/** 在源码里查找指定名字、指定阶段的 entry point。 */
export declare function findWgslEntryPoint(source: string, stage: WgslEntryPointStage, name: string): WgslEntryPoint | undefined;
/** 源码里出现的所有 binding，按 `group:binding` 归类，便于做集合比较。 */
export declare function wgslBindingKeys(bindings: readonly WgslBinding[]): Set<string>;
//# sourceMappingURL=WGSLReflector.d.ts.map