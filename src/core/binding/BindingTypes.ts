/**
 * Binding resources.
 *
 * WebGL2 has no bind groups: uniforms are set per program and textures occupy global texture units.
 * {@link BindGroupLayout} + {@link PipelineLayout} give the WebGL2 backend the static information it
 * needs to assign uniform block indices and texture units up front, so both backends expose the
 * same binding model to upper layers.
 */

import type { Disposable } from '../../utils/Disposable.js';
import type { BindingType } from '../enums/BindingType.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { ShaderStage } from '../enums/ShaderStage.js';
import type { Buffer } from '../resources/Buffer.js';
import type { Sampler } from '../resources/Sampler.js';
import type { TextureView, TextureViewDimension } from '../resources/TextureView.js';

/** Combined sampler/texture data type a shader sees. */
export type TextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';

export type SamplerBindingType = 'filtering' | 'comparison' | 'non-filtering';

export type StorageTextureAccess = 'write-only' | 'read-only' | 'read-write';

export interface BufferBindingLayout {
  type?: 'uniform' | 'storage' | 'read-only-storage';
  /** Layout requires a dynamic offset (uniform buffers bound from a ring allocation). */
  hasDynamicOffset?: boolean;
  /** Minimum size the bound range must cover. */
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
  /** Which shader stages may use this binding. */
  visibility: ShaderStage;
  type: BindingType;
  buffer?: BufferBindingLayout;
  texture?: TextureBindingLayout;
  storageTexture?: StorageTextureBindingLayout;
  sampler?: SamplerBindingLayout;
  /**
   * Name used by shader code generation. Required for textures/samplers so the compiler can emit
   * `uniform sampler2D name;` / `@group(g) @binding(b) var name: texture_2d<f32>;`.
   */
  name?: string;
}

/* ------------------------------------------------------------------ bound resources -------------- */

export interface BufferBinding {
  buffer: Buffer;
  offset?: number;
  /** Size of the bound range; defaults to `buffer.size - offset`. */
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

/** Defaults for a bind group layout entry, matching WebGPU. */
export function resolveBindingLayoutEntry(entry: BindGroupLayoutEntry): Required<Pick<BindGroupLayoutEntry, 'binding' | 'visibility' | 'type'>> & BindGroupLayoutEntry {
  return {
    ...entry,
    binding: entry.binding,
    visibility: entry.visibility,
    type: entry.type,
  };
}

/** Marks the disposal contract for layout objects. */
export type BindingDisposable = Disposable;
