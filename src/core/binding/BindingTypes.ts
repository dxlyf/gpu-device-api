/**
 * 绑定资源（Binding resources）。
 *
 * WebGL2 没有 bind group：uniform 逐个 program 设置，texture 占用全局 texture unit。
 * {@link BindGroupLayout} + {@link PipelineLayout} 为 WebGL2 后端提供所需的静态信息，
 * 让它能够预先分配 uniform block 索引和 texture unit，因此两个后端向上层暴露相同的
 * 绑定模型。
 */

import type { Disposable } from '../../utils/Disposable.js';
import type { BindingType } from '../enums/BindingType.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { ShaderStage } from '../enums/ShaderStage.js';
import type { Buffer } from '../resources/Buffer.js';
import type { Sampler } from '../resources/Sampler.js';
import type { TextureView, TextureViewDimension } from '../resources/TextureView.js';

/** shader 看到的 sampler/texture 组合数据类型。 */
export type TextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';

export type SamplerBindingType = 'filtering' | 'comparison' | 'non-filtering';

export type StorageTextureAccess = 'write-only' | 'read-only' | 'read-write';

export interface BufferBindingLayout {
  type?: 'uniform' | 'storage' | 'read-only-storage';
  /** 该 layout 需要 dynamic offset（uniform buffer 从 ring 分配中绑定）。 */
  hasDynamicOffset?: boolean;
  /** 绑定范围必须覆盖的最小尺寸。 */
  minBindingSize?: number;
}

export interface TextureBindingLayout {
  sampleType?: TextureSampleType;
  viewDimension?: TextureViewDimension;
  multisampled?: boolean;
}

export interface StorageTextureBindingLayout {
  access?: StorageTextureAccess;
  format: TextureFormat;
  viewDimension?: TextureViewDimension;
}

export interface SamplerBindingLayout {
  type?: SamplerBindingType;
}

export interface BindGroupLayoutEntry {
  binding: number;
  /** 哪些 shader stage 可以使用该 binding。 */
  visibility: ShaderStage;
  type: BindingType;
  buffer?: BufferBindingLayout;
  texture?: TextureBindingLayout;
  storageTexture?: StorageTextureBindingLayout;
  sampler?: SamplerBindingLayout;
  /**
   * 供 shader 代码生成使用的名称。texture/sampler 必须提供，以便编译器生成
   * `uniform sampler2D name;` / `@group(g) @binding(b) var name: texture_2d<f32>;`。
   */
  name?: string;
}

/* ------------------------------------------------------------------ 已绑定的资源 -------------- */

export interface BufferBinding {
  buffer: Buffer;
  offset?: number;
  /** 绑定范围的尺寸；默认为 `buffer.size - offset`。 */
  size?: number;
}

export interface SamplerBinding {
  sampler: Sampler;
}

export interface TextureBinding {
  view: TextureView;
}

export interface StorageTextureBinding {
  view: TextureView;
}

export interface ExternalTextureBinding {
  source: unknown;
}

export type BindingResource =
  | BufferBinding
  | SamplerBinding
  | TextureBinding
  | StorageTextureBinding
  | ExternalTextureBinding;

export interface BindGroupEntry {
  binding: number;
  resource: BindingResource;
}

export function isBufferBindingResource(resource: BindingResource): resource is BufferBinding {
  return (resource as BufferBinding).buffer !== undefined;
}

export function isSamplerBindingResource(resource: BindingResource): resource is SamplerBinding {
  return (resource as SamplerBinding).sampler !== undefined;
}

export function isTextureBindingResource(
  resource: BindingResource,
): resource is TextureBinding | StorageTextureBinding {
  return (resource as TextureBinding).view !== undefined;
}

/** bind group layout entry 的默认值，与 WebGPU 一致。 */
export function resolveBindingLayoutEntry(entry: BindGroupLayoutEntry): Required<Pick<BindGroupLayoutEntry, 'binding' | 'visibility' | 'type'>> & BindGroupLayoutEntry {
  return {
    ...entry,
    binding: entry.binding,
    visibility: entry.visibility,
    type: entry.type,
  };
}

/** 标记 layout 对象的释放契约。 */
export type BindingDisposable = Disposable;
