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
import { ColorWriteMask } from '../../core/pipeline/RenderState.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { assertNever } from '../../utils/assert.js';
import type {
  AddressMode,
} from '../../core/enums/AddressMode.js';
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
import type {
  SamplerBindingType,
  StorageTextureAccess,
  TextureSampleType,
} from '../../core/binding/BindingTypes.js';
import type { TextureAspect, TextureViewDimension } from '../../core/resources/TextureView.js';
import type { Color } from '../../core/render/RenderTarget.js';
import type { Extent3D, Origin3D, TexelCopyBufferLayout } from '../../types/internal.js';

/* ------------------------------------------------------------------ 常量镜像 -------------- */

/** `GPUShaderStage` 的取值镜像。 */
export const GPU_SHADER_STAGE = {
  NONE: 0x0000,
  VERTEX: 0x0001,
  FRAGMENT: 0x0002,
  COMPUTE: 0x0004,
} as const;

/** `GPUColorWrite` 的取值镜像。 */
export const GPU_COLOR_WRITE = {
  RED: 0x1,
  GREEN: 0x2,
  BLUE: 0x4,
  ALPHA: 0x8,
  ALL: 0xf,
} as const;

/** `GPUBufferUsage` 的取值镜像。 */
export const GPU_BUFFER_USAGE = {
  MAP_READ: 0x0001,
  MAP_WRITE: 0x0002,
  COPY_SRC: 0x0004,
  COPY_DST: 0x0008,
  INDEX: 0x0010,
  VERTEX: 0x0020,
  UNIFORM: 0x0040,
  STORAGE: 0x0080,
  INDIRECT: 0x0100,
  QUERY_RESOLVE: 0x0200,
} as const;

/** `GPUTextureUsage` 的取值镜像。 */
export const GPU_TEXTURE_USAGE = {
  COPY_SRC: 0x0001,
  COPY_DST: 0x0002,
  TEXTURE_BINDING: 0x0004,
  STORAGE_BINDING: 0x0008,
  RENDER_ATTACHMENT: 0x0010,
} as const;

/** `GPUMapMode` 的取值镜像。 */
export const GPU_MAP_MODE = {
  READ: 0x0001,
  WRITE: 0x0002,
} as const;

const KNOWN_SHADER_STAGE =
  GPU_SHADER_STAGE.VERTEX | GPU_SHADER_STAGE.FRAGMENT | GPU_SHADER_STAGE.COMPUTE;

const KNOWN_BUFFER_USAGE =
  GPU_BUFFER_USAGE.MAP_READ |
  GPU_BUFFER_USAGE.MAP_WRITE |
  GPU_BUFFER_USAGE.COPY_SRC |
  GPU_BUFFER_USAGE.COPY_DST |
  GPU_BUFFER_USAGE.INDEX |
  GPU_BUFFER_USAGE.VERTEX |
  GPU_BUFFER_USAGE.UNIFORM |
  GPU_BUFFER_USAGE.STORAGE |
  GPU_BUFFER_USAGE.INDIRECT |
  GPU_BUFFER_USAGE.QUERY_RESOLVE;

const KNOWN_TEXTURE_USAGE =
  GPU_TEXTURE_USAGE.COPY_SRC |
  GPU_TEXTURE_USAGE.COPY_DST |
  GPU_TEXTURE_USAGE.TEXTURE_BINDING |
  GPU_TEXTURE_USAGE.STORAGE_BINDING |
  GPU_TEXTURE_USAGE.RENDER_ATTACHMENT;

/* ------------------------------------------------------------------ 位标志 --------------- */

/**
 * `ShaderStage` → `GPUShaderStageFlags`。
 *
 * `ShaderStage.None` 没有对应语义：bind group layout 的 `visibility` 必须至少指明一个阶段。
 */
export function toGPUShaderStage(visibility: ShaderStage): GPUShaderStageFlags {
  if (!Number.isInteger(visibility)) {
    throw new ValidationError(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(visibility)}.`,
    );
  }
  if ((visibility & ~KNOWN_SHADER_STAGE) !== 0) {
    throw new ValidationError(
      `[gpu-device-api] ShaderStage visibility 0x${(visibility >>> 0).toString(16)} contains unknown bits; ` +
        'expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).',
    );
  }
  let flags = 0;
  if ((visibility & ShaderStage.Vertex) !== 0) flags |= GPU_SHADER_STAGE.VERTEX;
  if ((visibility & ShaderStage.Fragment) !== 0) flags |= GPU_SHADER_STAGE.FRAGMENT;
  if ((visibility & ShaderStage.Compute) !== 0) flags |= GPU_SHADER_STAGE.COMPUTE;
  if (flags === 0) {
    throw new ValidationError(
      '[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage.',
    );
  }
  return flags;
}

/** `ColorWriteMask` → `GPUColorWriteFlags`。位定义与 WebGPU 完全一致。 */
export function toGPUColorWriteMask(mask: ColorWriteMaskValue): GPUColorWriteFlags {
  if (!Number.isInteger(mask) || (mask & ~GPU_COLOR_WRITE.ALL) !== 0) {
    throw new ValidationError(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) ` +
        `and Alpha (0x8); got ${String(mask)}.`,
    );
  }
  // 值一一对应，但仍逐位翻译，避免以后任一侧改动时静默错位。
  let flags = 0;
  if ((mask & ColorWriteMask.Red) !== 0) flags |= GPU_COLOR_WRITE.RED;
  if ((mask & ColorWriteMask.Green) !== 0) flags |= GPU_COLOR_WRITE.GREEN;
  if ((mask & ColorWriteMask.Blue) !== 0) flags |= GPU_COLOR_WRITE.BLUE;
  if ((mask & ColorWriteMask.Alpha) !== 0) flags |= GPU_COLOR_WRITE.ALPHA;
  return flags;
}

/** `BufferUsage` → `GPUBufferUsageFlags`。 */
export function toGPUBufferUsage(usage: BufferUsage): GPUBufferUsageFlags {
  if (!Number.isInteger(usage) || usage <= 0) {
    throw new ValidationError(
      `[gpu-device-api] BufferUsage must be a non-empty combination of usage flags, got ${String(usage)}.`,
    );
  }
  if ((usage & ~KNOWN_BUFFER_USAGE) !== 0) {
    throw new ValidationError(
      `[gpu-device-api] BufferUsage 0x${(usage >>> 0).toString(16)} contains unknown bits.`,
    );
  }
  if ((usage & BufferUsage.MapRead) !== 0 && (usage & BufferUsage.MapWrite) !== 0) {
    throw new ValidationError(
      '[gpu-device-api] BufferUsage cannot combine MapRead and MapWrite: WebGPU rejects a buffer that is ' +
        'both mappable for reading and for writing. Use two buffers (or CopyDst plus writeBuffer).',
    );
  }
  let flags = 0;
  if ((usage & BufferUsage.MapRead) !== 0) flags |= GPU_BUFFER_USAGE.MAP_READ;
  if ((usage & BufferUsage.MapWrite) !== 0) flags |= GPU_BUFFER_USAGE.MAP_WRITE;
  if ((usage & BufferUsage.CopySrc) !== 0) flags |= GPU_BUFFER_USAGE.COPY_SRC;
  if ((usage & BufferUsage.CopyDst) !== 0) flags |= GPU_BUFFER_USAGE.COPY_DST;
  if ((usage & BufferUsage.Index) !== 0) flags |= GPU_BUFFER_USAGE.INDEX;
  if ((usage & BufferUsage.Vertex) !== 0) flags |= GPU_BUFFER_USAGE.VERTEX;
  if ((usage & BufferUsage.Uniform) !== 0) flags |= GPU_BUFFER_USAGE.UNIFORM;
  if ((usage & BufferUsage.Storage) !== 0) flags |= GPU_BUFFER_USAGE.STORAGE;
  if ((usage & BufferUsage.Indirect) !== 0) flags |= GPU_BUFFER_USAGE.INDIRECT;
  if ((usage & BufferUsage.QueryResolve) !== 0) flags |= GPU_BUFFER_USAGE.QUERY_RESOLVE;
  return flags;
}

/** `TextureUsage` → `GPUTextureUsageFlags`。格式相关的限制由 `wgpuFormatMap` 负责。 */
export function toGPUTextureUsage(usage: TextureUsage): GPUTextureUsageFlags {
  if (!Number.isInteger(usage) || usage <= 0) {
    throw new ValidationError(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(usage)}.`,
    );
  }
  if ((usage & ~KNOWN_TEXTURE_USAGE) !== 0) {
    throw new ValidationError(
      `[gpu-device-api] TextureUsage 0x${(usage >>> 0).toString(16)} contains unknown bits.`,
    );
  }
  let flags = 0;
  if ((usage & TextureUsage.CopySrc) !== 0) flags |= GPU_TEXTURE_USAGE.COPY_SRC;
  if ((usage & TextureUsage.CopyDst) !== 0) flags |= GPU_TEXTURE_USAGE.COPY_DST;
  if ((usage & TextureUsage.TextureBinding) !== 0) flags |= GPU_TEXTURE_USAGE.TEXTURE_BINDING;
  if ((usage & TextureUsage.StorageBinding) !== 0) flags |= GPU_TEXTURE_USAGE.STORAGE_BINDING;
  if ((usage & TextureUsage.RenderAttachment) !== 0) flags |= GPU_TEXTURE_USAGE.RENDER_ATTACHMENT;
  return flags;
}

/** `MapMode` → `GPUMapModeFlags`。 */
export function toGPUMapMode(mode: MapMode): GPUMapModeFlags {
  switch (mode) {
    case 'read':
      return GPU_MAP_MODE.READ;
    case 'write':
      return GPU_MAP_MODE.WRITE;
    default:
      return assertNever(mode, `[gpu-device-api] Unknown MapMode "${String(mode)}".`);
  }
}

/* ------------------------------------------------------------------ 字符串枚举 ------------ */

/** `PrimitiveTopology` → `GPUPrimitiveTopology`。 */
export function toGPUPrimitiveTopology(topology: PrimitiveTopology): GPUPrimitiveTopology {
  switch (topology) {
    case 'point-list':
      return 'point-list';
    case 'line-list':
      return 'line-list';
    case 'line-strip':
      return 'line-strip';
    case 'triangle-list':
      return 'triangle-list';
    case 'triangle-strip':
      return 'triangle-strip';
    default:
      return assertNever(topology, `[gpu-device-api] Unknown PrimitiveTopology "${String(topology)}".`);
  }
}

/** 是否为需要 `stripIndexFormat` 的 strip 拓扑。 */
export function isStripTopology(topology: PrimitiveTopology): boolean {
  return topology === 'line-strip' || topology === 'triangle-strip';
}

/** `IndexFormat` → `GPUIndexFormat`。 */
export function toGPUIndexFormat(format: IndexFormat): GPUIndexFormat {
  switch (format) {
    case 'uint16':
      return 'uint16';
    case 'uint32':
      return 'uint32';
    default:
      return assertNever(format, `[gpu-device-api] Unknown IndexFormat "${String(format)}".`);
  }
}

/** `CompareFunction` → `GPUCompareFunction`。 */
export function toGPUCompareFunction(compare: CompareFunction): GPUCompareFunction {
  switch (compare) {
    case 'never':
      return 'never';
    case 'less':
      return 'less';
    case 'equal':
      return 'equal';
    case 'less-equal':
      return 'less-equal';
    case 'greater':
      return 'greater';
    case 'not-equal':
      return 'not-equal';
    case 'greater-equal':
      return 'greater-equal';
    case 'always':
      return 'always';
    default:
      return assertNever(compare, `[gpu-device-api] Unknown CompareFunction "${String(compare)}".`);
  }
}

/** `StencilOperation` → `GPUStencilOperation`。 */
export function toGPUStencilOperation(operation: StencilOperation): GPUStencilOperation {
  switch (operation) {
    case 'keep':
      return 'keep';
    case 'zero':
      return 'zero';
    case 'replace':
      return 'replace';
    case 'invert':
      return 'invert';
    case 'increment-clamp':
      return 'increment-clamp';
    case 'decrement-clamp':
      return 'decrement-clamp';
    case 'increment-wrap':
      return 'increment-wrap';
    case 'decrement-wrap':
      return 'decrement-wrap';
    default:
      return assertNever(operation, `[gpu-device-api] Unknown StencilOperation "${String(operation)}".`);
  }
}

/** `BlendFactor` → `GPUBlendFactor`。 */
export function toGPUBlendFactor(factor: BlendFactor): GPUBlendFactor {
  switch (factor) {
    case 'zero':
      return 'zero';
    case 'one':
      return 'one';
    case 'src':
      return 'src';
    case 'one-minus-src':
      return 'one-minus-src';
    case 'src-alpha':
      return 'src-alpha';
    case 'one-minus-src-alpha':
      return 'one-minus-src-alpha';
    case 'dst':
      return 'dst';
    case 'one-minus-dst':
      return 'one-minus-dst';
    case 'dst-alpha':
      return 'dst-alpha';
    case 'one-minus-dst-alpha':
      return 'one-minus-dst-alpha';
    case 'src-alpha-saturated':
      return 'src-alpha-saturated';
    case 'constant':
      return 'constant';
    case 'one-minus-constant':
      return 'one-minus-constant';
    default:
      return assertNever(factor, `[gpu-device-api] Unknown BlendFactor "${String(factor)}".`);
  }
}

/** `BlendOperation` → `GPUBlendOperation`。 */
export function toGPUBlendOperation(operation: BlendOperation): GPUBlendOperation {
  switch (operation) {
    case 'add':
      return 'add';
    case 'subtract':
      return 'subtract';
    case 'reverse-subtract':
      return 'reverse-subtract';
    case 'min':
      return 'min';
    case 'max':
      return 'max';
    default:
      return assertNever(operation, `[gpu-device-api] Unknown BlendOperation "${String(operation)}".`);
  }
}

/** `AddressMode` → `GPUAddressMode`。 */
export function toGPUAddressMode(mode: AddressMode): GPUAddressMode {
  switch (mode) {
    case 'clamp-to-edge':
      return 'clamp-to-edge';
    case 'repeat':
      return 'repeat';
    case 'mirror-repeat':
      return 'mirror-repeat';
    default:
      return assertNever(mode, `[gpu-device-api] Unknown AddressMode "${String(mode)}".`);
  }
}

/** `FilterMode` → `GPUFilterMode`。 */
export function toGPUFilterMode(mode: FilterMode): GPUFilterMode {
  switch (mode) {
    case 'nearest':
      return 'nearest';
    case 'linear':
      return 'linear';
    default:
      return assertNever(mode, `[gpu-device-api] Unknown FilterMode "${String(mode)}".`);
  }
}

/** `FilterMode` → `GPUMipmapFilterMode`（取值集合相同，但 WebGPU 里是两个类型）。 */
export function toGPUMipmapFilterMode(mode: FilterMode): GPUMipmapFilterMode {
  switch (mode) {
    case 'nearest':
      return 'nearest';
    case 'linear':
      return 'linear';
    default:
      return assertNever(mode, `[gpu-device-api] Unknown mipmap filter mode "${String(mode)}".`);
  }
}

/** `CullMode` → `GPUCullMode`。 */
export function toGPUCullMode(mode: CullMode): GPUCullMode {
  switch (mode) {
    case 'none':
      return 'none';
    case 'front':
      return 'front';
    case 'back':
      return 'back';
    default:
      return assertNever(mode, `[gpu-device-api] Unknown CullMode "${String(mode)}".`);
  }
}

/** `FrontFace` → `GPUFrontFace`。 */
export function toGPUFrontFace(face: FrontFace): GPUFrontFace {
  switch (face) {
    case 'ccw':
      return 'ccw';
    case 'cw':
      return 'cw';
    default:
      return assertNever(face, `[gpu-device-api] Unknown FrontFace "${String(face)}".`);
  }
}

/** `LoadOp` → `GPULoadOp`。 */
export function toGPULoadOp(loadOp: LoadOp): GPULoadOp {
  switch (loadOp) {
    case 'load':
      return 'load';
    case 'clear':
      return 'clear';
    default:
      return assertNever(loadOp, `[gpu-device-api] Unknown LoadOp "${String(loadOp)}".`);
  }
}

/** `StoreOp` → `GPUStoreOp`。 */
export function toGPUStoreOp(storeOp: StoreOp): GPUStoreOp {
  switch (storeOp) {
    case 'store':
      return 'store';
    case 'discard':
      return 'discard';
    default:
      return assertNever(storeOp, `[gpu-device-api] Unknown StoreOp "${String(storeOp)}".`);
  }
}

/** `TextureViewDimension` → `GPUTextureViewDimension`。 */
export function toGPUTextureViewDimension(dimension: TextureViewDimension): GPUTextureViewDimension {
  switch (dimension) {
    case '1d':
      return '1d';
    case '2d':
      return '2d';
    case '2d-array':
      return '2d-array';
    case 'cube':
      return 'cube';
    case 'cube-array':
      return 'cube-array';
    case '3d':
      return '3d';
    default:
      return assertNever(dimension, `[gpu-device-api] Unknown TextureViewDimension "${String(dimension)}".`);
  }
}

/** `TextureAspect` → `GPUTextureAspect`。aspect 与 format 的匹配校验在 `wgpuFormatMap`。 */
export function toGPUTextureAspect(aspect: TextureAspect): GPUTextureAspect {
  switch (aspect) {
    case 'all':
      return 'all';
    case 'depth-only':
      return 'depth-only';
    case 'stencil-only':
      return 'stencil-only';
    default:
      return assertNever(aspect, `[gpu-device-api] Unknown TextureAspect "${String(aspect)}".`);
  }
}

/** `VertexStepMode` → `GPUVertexStepMode`。 */
export function toGPUVertexStepMode(mode: VertexStepMode): GPUVertexStepMode {
  switch (mode) {
    case 'vertex':
      return 'vertex';
    case 'instance':
      return 'instance';
    default:
      return assertNever(mode, `[gpu-device-api] Unknown VertexStepMode "${String(mode)}".`);
  }
}

/**
 * `VertexFormat` → `GPUVertexFormat`。
 *
 * core 的 VertexFormat 是 WebGPU 顶点格式的子集，因此每个取值都能直接映射；
 * WebGPU 里额外的格式（例如 `unorm10-10-10-2`、`uint8`）core 尚未提供。
 */
export function toGPUVertexFormat(format: VertexFormat): GPUVertexFormat {
  switch (format) {
    // 8 位
    case 'uint8x2':
      return 'uint8x2';
    case 'uint8x4':
      return 'uint8x4';
    case 'sint8x2':
      return 'sint8x2';
    case 'sint8x4':
      return 'sint8x4';
    case 'unorm8x2':
      return 'unorm8x2';
    case 'unorm8x4':
      return 'unorm8x4';
    case 'snorm8x2':
      return 'snorm8x2';
    case 'snorm8x4':
      return 'snorm8x4';
    // 16 位
    case 'uint16x2':
      return 'uint16x2';
    case 'uint16x4':
      return 'uint16x4';
    case 'sint16x2':
      return 'sint16x2';
    case 'sint16x4':
      return 'sint16x4';
    case 'unorm16x2':
      return 'unorm16x2';
    case 'unorm16x4':
      return 'unorm16x4';
    case 'snorm16x2':
      return 'snorm16x2';
    case 'snorm16x4':
      return 'snorm16x4';
    case 'float16x2':
      return 'float16x2';
    case 'float16x4':
      return 'float16x4';
    // 32 位
    case 'float32':
      return 'float32';
    case 'float32x2':
      return 'float32x2';
    case 'float32x3':
      return 'float32x3';
    case 'float32x4':
      return 'float32x4';
    case 'uint32':
      return 'uint32';
    case 'uint32x2':
      return 'uint32x2';
    case 'uint32x3':
      return 'uint32x3';
    case 'uint32x4':
      return 'uint32x4';
    case 'sint32':
      return 'sint32';
    case 'sint32x2':
      return 'sint32x2';
    case 'sint32x3':
      return 'sint32x3';
    case 'sint32x4':
      return 'sint32x4';
    default:
      return assertNever(format, `[gpu-device-api] Unknown VertexFormat "${String(format)}".`);
  }
}

/** `QueryType` → `GPUQueryType`。timestamp 查询还需要 `timestamp-query` feature。 */
export function toGPUQueryType(type: QueryType): GPUQueryType {
  switch (type) {
    case QueryType.Occlusion:
      return 'occlusion';
    case QueryType.Timestamp:
      return 'timestamp';
    default:
      return assertNever(type, `[gpu-device-api] Unknown QueryType "${String(type)}".`);
  }
}

/* ------------------------------------------------------------------ 绑定类型 ------------- */

/** `BindingType` → `GPUBufferBindingType`；非 buffer 绑定会抛错。 */
export function toGPUBufferBindingType(type: BindingType): GPUBufferBindingType {
  switch (type) {
    case 'uniform':
      return 'uniform';
    case 'storage':
      return 'storage';
    case 'read-only-storage':
      return 'read-only-storage';
    default:
      throw new ValidationError(
        `[gpu-device-api] BindingType "${String(type)}" is not a buffer binding; ` +
          'expected "uniform", "storage" or "read-only-storage".',
      );
  }
}

/** `BindingType` → `GPUSamplerBindingType`；非 sampler 绑定会抛错。 */
export function toGPUSamplerBindingType(type: BindingType): GPUSamplerBindingType {
  switch (type) {
    case 'sampler':
      return 'filtering';
    case 'comparison-sampler':
      return 'comparison';
    default:
      throw new ValidationError(
        `[gpu-device-api] BindingType "${String(type)}" is not a sampler binding; ` +
          'expected "sampler" or "comparison-sampler".',
      );
  }
}

/** `TextureSampleType` → `GPUTextureSampleType`。 */
export function toGPUTextureSampleType(sampleType: TextureSampleType): GPUTextureSampleType {
  switch (sampleType) {
    case 'float':
      return 'float';
    case 'unfilterable-float':
      return 'unfilterable-float';
    case 'depth':
      return 'depth';
    case 'sint':
      return 'sint';
    case 'uint':
      return 'uint';
    default:
      return assertNever(sampleType, `[gpu-device-api] Unknown TextureSampleType "${String(sampleType)}".`);
  }
}

/** `StorageTextureAccess` → `GPUStorageTextureAccess`。 */
export function toGPUStorageTextureAccess(access: StorageTextureAccess): GPUStorageTextureAccess {
  switch (access) {
    case 'write-only':
      return 'write-only';
    case 'read-only':
      return 'read-only';
    case 'read-write':
      return 'read-write';
    default:
      return assertNever(access, `[gpu-device-api] Unknown StorageTextureAccess "${String(access)}".`);
  }
}

/** `SamplerBindingType` 存在性校验（core 的类型未在 WebGPU 侧直接使用）。 */
export function assertSamplerBindingType(type: SamplerBindingType): SamplerBindingType {
  switch (type) {
    case 'filtering':
    case 'non-filtering':
    case 'comparison':
      return type;
    default:
      return assertNever(type, `[gpu-device-api] Unknown SamplerBindingType "${String(type)}".`);
  }
}

/* ------------------------------------------------------------------ 清屏颜色 ------------- */

/** CSS 颜色名（只覆盖常用的一小部分，不是完整的 CSS 命名色表）。 */
const NAMED_COLORS: Readonly<Record<string, readonly [number, number, number, number]>> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [1, 1, 1, 1],
  silver: [0.7529411764705882, 0.7529411764705882, 0.7529411764705882, 1],
  gray: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  grey: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  red: [1, 0, 0, 1],
  maroon: [0.5019607843137255, 0, 0, 1],
  orange: [1, 0.6470588235294118, 0, 1],
  yellow: [1, 1, 0, 1],
  olive: [0.5019607843137255, 0.5019607843137255, 0, 1],
  lime: [0, 1, 0, 1],
  green: [0, 0.5019607843137255, 0, 1],
  teal: [0, 0.5019607843137255, 0.5019607843137255, 1],
  aqua: [0, 1, 1, 1],
  cyan: [0, 1, 1, 1],
  blue: [0, 0, 1, 1],
  navy: [0, 0, 0.5019607843137255, 1],
  purple: [0.5019607843137255, 0, 0.5019607843137255, 1],
  magenta: [1, 0, 1, 1],
  fuchsia: [1, 0, 1, 1],
};

const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const FUNCTIONAL_COLOR = /^rgba?\(([^)]*)\)$/;

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
export function resolveClearColor(color?: Color): GPUColor {
  if (color === undefined) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof color === 'string') return parseColorString(color);
  if (typeof color === 'number') return parseColorNumber(color);
  if (Array.isArray(color)) {
    const values = color as readonly number[];
    if (values.length !== 3 && values.length !== 4) {
      throw new ValidationError(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${values.length}.`,
      );
    }
    return makeColor(values[0]!, values[1]!, values[2]!, values.length === 4 ? values[3]! : 1, color);
  }
  const dict = color as { r?: unknown; g?: unknown; b?: unknown; a?: unknown };
  if (typeof dict.r !== 'number' || typeof dict.g !== 'number' || typeof dict.b !== 'number') {
    throw new ValidationError(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.',
    );
  }
  return makeColor(dict.r, dict.g, dict.b, typeof dict.a === 'number' ? dict.a : 1, color);
}

function makeColor(r: number, g: number, b: number, a: number, source: unknown): GPUColor {
  for (const [name, value] of [
    ['r', r],
    ['g', g],
    ['b', b],
    ['a', a],
  ] as const) {
    if (!Number.isFinite(value)) {
      throw new ValidationError(
        `[gpu-device-api] Clear color component "${name}" must be a finite number, got ${String(value)} ` +
          `(from ${JSON.stringify(source)}).`,
      );
    }
  }
  return { r, g, b, a };
}

function parseColorNumber(value: number): GPUColor {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 0xffffff) {
    throw new ValidationError(
      `[gpu-device-api] A numeric clear color must be an integer in 0x000000..0xFFFFFF (0xRRGGBB), got ${String(value)}.`,
    );
  }
  return {
    r: ((value >> 16) & 0xff) / 255,
    g: ((value >> 8) & 0xff) / 255,
    b: (value & 0xff) / 255,
    a: 1,
  };
}

function parseColorString(input: string): GPUColor {
  const text = input.trim().toLowerCase();
  const hex = HEX_COLOR.exec(text);
  if (hex) {
    const digits = hex[1]!;
    if (digits.length === 3 || digits.length === 4) {
      const r = parseInt(digits[0]! + digits[0]!, 16) / 255;
      const g = parseInt(digits[1]! + digits[1]!, 16) / 255;
      const b = parseInt(digits[2]! + digits[2]!, 16) / 255;
      const a = digits.length === 4 ? parseInt(digits[3]! + digits[3]!, 16) / 255 : 1;
      return { r, g, b, a };
    }
    const r = parseInt(digits.slice(0, 2), 16) / 255;
    const g = parseInt(digits.slice(2, 4), 16) / 255;
    const b = parseInt(digits.slice(4, 6), 16) / 255;
    const a = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const named = NAMED_COLORS[text];
  if (named) return { r: named[0], g: named[1], b: named[2], a: named[3] };

  const functional = FUNCTIONAL_COLOR.exec(text);
  if (functional) {
    const parts = functional[1]!.replace(/\//g, ' ').split(/[\s,]+/).filter((part) => part.length > 0);
    if (parts.length !== 3 && parts.length !== 4) {
      throw new ValidationError(
        `[gpu-device-api] Clear color "${input}" needs 3 or 4 components inside rgb()/rgba().`,
      );
    }
    const r = parseRgbComponent(parts[0]!, input);
    const g = parseRgbComponent(parts[1]!, input);
    const b = parseRgbComponent(parts[2]!, input);
    const a = parts.length === 4 ? parseAlphaComponent(parts[3]!, input) : 1;
    return { r, g, b, a };
  }

  throw new ValidationError(
    `[gpu-device-api] Unsupported clear color string "${input}". Expected "#rgb", "#rgba", "#rrggbb", ` +
      '"#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, ' +
      'or an { r, g, b, a } object.',
  );
}

function parseRgbComponent(part: string, source: string): number {
  if (part.endsWith('%')) {
    const percent = Number(part.slice(0, -1));
    if (!Number.isFinite(percent)) {
      throw new ValidationError(`[gpu-device-api] Clear color "${source}" has an invalid percentage "${part}".`);
    }
    return percent / 100;
  }
  const value = Number(part);
  if (!Number.isFinite(value)) {
    throw new ValidationError(`[gpu-device-api] Clear color "${source}" has an invalid component "${part}".`);
  }
  return value / 255;
}

function parseAlphaComponent(part: string, source: string): number {
  if (part.endsWith('%')) {
    const percent = Number(part.slice(0, -1));
    if (!Number.isFinite(percent)) {
      throw new ValidationError(`[gpu-device-api] Clear color "${source}" has an invalid alpha "${part}".`);
    }
    return percent / 100;
  }
  const value = Number(part);
  if (!Number.isFinite(value)) {
    throw new ValidationError(`[gpu-device-api] Clear color "${source}" has an invalid alpha "${part}".`);
  }
  return value;
}

/* ------------------------------------------------------------------ 拷贝结构 ------------- */

/** core 的 {@link Extent3D} → `GPUExtent3DStrict`。 */
export function toGPUExtent3D(extent: Extent3D): GPUExtent3DDictStrict {
  return {
    width: extent.width,
    height: extent.height,
    depthOrArrayLayers: extent.depthOrArrayLayers,
  };
}

/** core 的 `Partial<Origin3D>` → `GPUOrigin3D`，缺省分量为 0。 */
export function toGPUOrigin3D(origin?: Partial<Origin3D>): GPUOrigin3DDict {
  return {
    x: origin?.x ?? 0,
    y: origin?.y ?? 0,
    z: origin?.z ?? 0,
  };
}

/** core 的 {@link TexelCopyBufferLayout} → `GPUTexelCopyBufferLayout`。 */
export function toGPUTexelCopyBufferLayout(layout: TexelCopyBufferLayout): GPUTexelCopyBufferLayout {
  return {
    offset: layout.offset,
    bytesPerRow: layout.bytesPerRow,
    rowsPerImage: layout.rowsPerImage,
  };
}

/** 校验采样数：WebGPU 只接受 1 或 4。 */
export function assertSampleCount(sampleCount: number, context: string): number {
  if (sampleCount !== 1 && sampleCount !== 4) {
    throw new ValidationError(
      `[gpu-device-api] ${context}: sampleCount must be 1 or 4, got ${String(sampleCount)} ` +
        '(WebGPU core only guarantees 1 and 4).',
    );
  }
  return sampleCount;
}
