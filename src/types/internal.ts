/**
 * Internal types shared between the core layer and the backends. These are not part of the public
 * API surface and may change without notice.
 *
 * (Kept as a real module rather than a `.d.ts` so that declaration emit copies it into `dist/types`.)
 */

/** Explicitly nullable. */
export type Nullable<T> = T | null;

/** Dimensions of a texture, render target or canvas frame. */
export interface Extent3D {
  width: number;
  height: number;
  depthOrArrayLayers: number;
}

/** Offset inside a texture for copy operations. */
export interface Origin3D {
  x: number;
  y: number;
  z: number;
}

/** Mip level / array layer selection for a texture subresource. */
export interface SubresourceRange {
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
}

/** Memory layout of host pixel data for a texture upload. */
export interface TexelCopyBufferLayout {
  offset: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
}

/** One entry of a pipeline's bind group layout, after validation and defaults. */
export interface ResolvedBinding {
  group: number;
  binding: number;
  type: string;
  /** Resource name used by shader code generation (textures/samplers). */
  name?: string;
}

/** A `(group, binding)` pair. */
export interface BindingLocation {
  group: number;
  binding: number;
}

export function bindingKey(group: number, binding: number): string {
  return `${group}:${binding}`;
}
