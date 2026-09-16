/**
 * 统一枚举 → WebGPU 常量的显式映射。
 *
 * core 的枚举取值刻意与 WebGPU 原生常量对齐，因此大多数映射在数值/字符串上是恒等的。
 * 即便如此这里仍然写成**显式映射 + 断言**，原因有三：
 *
 * 1. 上层是 JS 调用方时枚举值可能非法，必须在进入 WebGPU 之前给出可读的报错，
 *    而不是让 WebGPU 抛一句 `is not a valid enum value`；
 * 2. core 里存在 WebGPU 不接受或需要额外条件的组合（例如 `MapRead | MapWrite`、
 *    独立的 `ShaderStage.None`），这些必须在映射层被拦住；
 * 3. 映射集中在一处，后续 core 新增枚举时编译期就能发现漏映射（穷尽性检查）。
 *
 * 这里刻意**不引用 `GPUShaderStage` 等全局常量对象**：映射层的单测/静态分析可能在
 * 没有 WebGPU 全局的环境里跑，读全局对象会直接 ReferenceError。下面的常量表是这些
 * 全局对象取值的镜像，并在注释里标出对应关系。
 */
import { BufferUsage } from '../../core/enums/BufferUsage.js';
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import { ShaderStage } from '../../core/enums/ShaderStage.js';
import { QueryType } from '../../core/resources/QuerySet.js';
import type { AddressMode } from '../../core/enums/AddressMode.js';
import type { BlendFactor } from '../../core/enums/BlendFactor.js';
import type { BlendOperation } from '../../core/enums/BlendOperation.js';
import type { CompareFunction } from '../../core/enums/CompareFunction.js';
import type { CullMode } from '../../core/enums/CullMode.js';
import type { FilterMode } from '../../core/enums/FilterMode.js';
import type { FrontFace } from '../../core/enums/FrontFace.js';
import type { IndexFormat } from '../../core/enums/IndexFormat.js';
import type { LoadOp } from '../../core/enums/LoadOp.js';
import type { PrimitiveTopology } from '../../core/enums/PrimitiveTopology.js';
import type { StencilOperation } from '../../core/enums/StencilOperation.js';
import type { StoreOp } from '../../core/enums/StoreOp.js';
import type { VertexFormat } from '../../core/enums/VertexFormat.js';
import type { VertexStepMode } from '../../core/enums/VertexStepMode.js';
import type { BindingType } from '../../core/enums/BindingType.js';
import type { ColorWriteMask as ColorWriteMaskValue } from '../../core/pipeline/RenderState.js';
import type { MapMode } from '../../core/resources/Buffer.js';
import type { SamplerBindingType, StorageTextureAccess, TextureSampleType } from '../../core/binding/BindingTypes.js';
import type { TextureAspect, TextureViewDimension } from '../../core/resources/TextureView.js';
import type { Color } from '../../core/render/RenderTarget.js';
import type { Extent3D, Origin3D, TexelCopyBufferLayout } from '../../types/internal.js';
/** `GPUShaderStage` 的取值镜像。 */
export declare const GPU_SHADER_STAGE: {
    readonly NONE: 0;
    readonly VERTEX: 1;
    readonly FRAGMENT: 2;
    readonly COMPUTE: 4;
};
/** `GPUColorWrite` 的取值镜像。 */
export declare const GPU_COLOR_WRITE: {
    readonly RED: 1;
    readonly GREEN: 2;
    readonly BLUE: 4;
    readonly ALPHA: 8;
    readonly ALL: 15;
};
/** `GPUBufferUsage` 的取值镜像。 */
export declare const GPU_BUFFER_USAGE: {
    readonly MAP_READ: 1;
    readonly MAP_WRITE: 2;
    readonly COPY_SRC: 4;
    readonly COPY_DST: 8;
    readonly INDEX: 16;
    readonly VERTEX: 32;
    readonly UNIFORM: 64;
    readonly STORAGE: 128;
    readonly INDIRECT: 256;
    readonly QUERY_RESOLVE: 512;
};
/** `GPUTextureUsage` 的取值镜像。 */
export declare const GPU_TEXTURE_USAGE: {
    readonly COPY_SRC: 1;
    readonly COPY_DST: 2;
    readonly TEXTURE_BINDING: 4;
    readonly STORAGE_BINDING: 8;
    readonly RENDER_ATTACHMENT: 16;
};
/** `GPUMapMode` 的取值镜像。 */
export declare const GPU_MAP_MODE: {
    readonly READ: 1;
    readonly WRITE: 2;
};
/**
 * `ShaderStage` → `GPUShaderStageFlags`。
 *
 * `ShaderStage.None` 没有对应语义：bind group layout 的 `visibility` 必须至少指明一个阶段。
 */
export declare function toGPUShaderStage(visibility: ShaderStage): GPUShaderStageFlags;
/** `ColorWriteMask` → `GPUColorWriteFlags`。位定义与 WebGPU 完全一致。 */
export declare function toGPUColorWriteMask(mask: ColorWriteMaskValue): GPUColorWriteFlags;
/** `BufferUsage` → `GPUBufferUsageFlags`。 */
export declare function toGPUBufferUsage(usage: BufferUsage): GPUBufferUsageFlags;
/** `TextureUsage` → `GPUTextureUsageFlags`。格式相关的限制由 `wgpuFormatMap` 负责。 */
export declare function toGPUTextureUsage(usage: TextureUsage): GPUTextureUsageFlags;
/** `MapMode` → `GPUMapModeFlags`。 */
export declare function toGPUMapMode(mode: MapMode): GPUMapModeFlags;
/** `PrimitiveTopology` → `GPUPrimitiveTopology`。 */
export declare function toGPUPrimitiveTopology(topology: PrimitiveTopology): GPUPrimitiveTopology;
/** 是否为需要 `stripIndexFormat` 的 strip 拓扑。 */
export declare function isStripTopology(topology: PrimitiveTopology): boolean;
/** `IndexFormat` → `GPUIndexFormat`。 */
export declare function toGPUIndexFormat(format: IndexFormat): GPUIndexFormat;
/** `CompareFunction` → `GPUCompareFunction`。 */
export declare function toGPUCompareFunction(compare: CompareFunction): GPUCompareFunction;
/** `StencilOperation` → `GPUStencilOperation`。 */
export declare function toGPUStencilOperation(operation: StencilOperation): GPUStencilOperation;
/** `BlendFactor` → `GPUBlendFactor`。 */
export declare function toGPUBlendFactor(factor: BlendFactor): GPUBlendFactor;
/** `BlendOperation` → `GPUBlendOperation`。 */
export declare function toGPUBlendOperation(operation: BlendOperation): GPUBlendOperation;
/** `AddressMode` → `GPUAddressMode`。 */
export declare function toGPUAddressMode(mode: AddressMode): GPUAddressMode;
/** `FilterMode` → `GPUFilterMode`。 */
export declare function toGPUFilterMode(mode: FilterMode): GPUFilterMode;
/** `FilterMode` → `GPUMipmapFilterMode`（取值集合相同，但 WebGPU 里是两个类型）。 */
export declare function toGPUMipmapFilterMode(mode: FilterMode): GPUMipmapFilterMode;
/** `CullMode` → `GPUCullMode`。 */
export declare function toGPUCullMode(mode: CullMode): GPUCullMode;
/** `FrontFace` → `GPUFrontFace`。 */
export declare function toGPUFrontFace(face: FrontFace): GPUFrontFace;
/** `LoadOp` → `GPULoadOp`。 */
export declare function toGPULoadOp(loadOp: LoadOp): GPULoadOp;
/** `StoreOp` → `GPUStoreOp`。 */
export declare function toGPUStoreOp(storeOp: StoreOp): GPUStoreOp;
/** `TextureViewDimension` → `GPUTextureViewDimension`。 */
export declare function toGPUTextureViewDimension(dimension: TextureViewDimension): GPUTextureViewDimension;
/** `TextureAspect` → `GPUTextureAspect`。aspect 与 format 的匹配校验在 `wgpuFormatMap`。 */
export declare function toGPUTextureAspect(aspect: TextureAspect): GPUTextureAspect;
/** `VertexStepMode` → `GPUVertexStepMode`。 */
export declare function toGPUVertexStepMode(mode: VertexStepMode): GPUVertexStepMode;
/**
 * `VertexFormat` → `GPUVertexFormat`。
 *
 * core 的 VertexFormat 是 WebGPU 顶点格式的子集，因此每个取值都能直接映射；
 * WebGPU 里额外的格式（例如 `unorm10-10-10-2`、`uint8`）core 尚未提供。
 */
export declare function toGPUVertexFormat(format: VertexFormat): GPUVertexFormat;
/** `QueryType` → `GPUQueryType`。timestamp 查询还需要 `timestamp-query` feature。 */
export declare function toGPUQueryType(type: QueryType): GPUQueryType;
/** `BindingType` → `GPUBufferBindingType`；非 buffer 绑定会抛错。 */
export declare function toGPUBufferBindingType(type: BindingType): GPUBufferBindingType;
/** `BindingType` → `GPUSamplerBindingType`；非 sampler 绑定会抛错。 */
export declare function toGPUSamplerBindingType(type: BindingType): GPUSamplerBindingType;
/** `TextureSampleType` → `GPUTextureSampleType`。 */
export declare function toGPUTextureSampleType(sampleType: TextureSampleType): GPUTextureSampleType;
/** `StorageTextureAccess` → `GPUStorageTextureAccess`。 */
export declare function toGPUStorageTextureAccess(access: StorageTextureAccess): GPUStorageTextureAccess;
/** `SamplerBindingType` 存在性校验（core 的类型未在 WebGPU 侧直接使用）。 */
export declare function assertSamplerBindingType(type: SamplerBindingType): SamplerBindingType;
/**
 * 把 core 的 {@link Color} 解析为 WebGPU 的 `GPUColor`。
 *
 * 支持：`'#rgb'`/`'#rgba'`/`'#rrggbb'`/`'#rrggbbaa'`、`'rgb()'`/`'rgba()'`（分量用 0-255 或百分比，
 * alpha 用 0-1 或百分比）、少量 CSS 颜色名、`0xRRGGBB` 数字、`[r,g,b(,a)]` 数组（0..1）、
 * `{ r, g, b, a? }` 对象。省略时返回不透明黑。
 *
 * 分量只校验「是有限数字」，不做 0..1 截断：float 格式的 attachment 允许范围外的 clear value，
 * 越界与否交给 WebGPU 按目标格式校验。
 */
export declare function resolveClearColor(color?: Color): GPUColor;
/** core 的 {@link Extent3D} → `GPUExtent3DStrict`。 */
export declare function toGPUExtent3D(extent: Extent3D): GPUExtent3DDictStrict;
/** core 的 `Partial<Origin3D>` → `GPUOrigin3D`，缺省分量为 0。 */
export declare function toGPUOrigin3D(origin?: Partial<Origin3D>): GPUOrigin3DDict;
/** core 的 {@link TexelCopyBufferLayout} → `GPUTexelCopyBufferLayout`。 */
export declare function toGPUTexelCopyBufferLayout(layout: TexelCopyBufferLayout): GPUTexelCopyBufferLayout;
/** 校验采样数：WebGPU 只接受 1 或 4。 */
export declare function assertSampleCount(sampleCount: number, context: string): number;
//# sourceMappingURL=wgpuEnumMap.d.ts.map