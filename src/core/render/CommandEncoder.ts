/** Command recording. Mirrors WebGPU's `GPUCommandEncoder` / `GPUCommandBuffer`. */

import type { Disposable } from '../../utils/Disposable.js';
import type { TextureAspect } from '../resources/TextureView.js';
import type { Extent3D, Origin3D, TexelCopyBufferLayout } from '../../types/internal.js';

/**
 * Structural subset of {@link Buffer} used by the command layer. Kept minimal so the command
 * interfaces stay free of the resource class hierarchy.
 */
export interface BufferLike {
  readonly size: number;
  readonly native?: unknown;
}

export interface TextureLike {
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly native?: unknown;
}

export interface CommandEncoderDescriptor {
  label?: string;
}

export interface CommandBuffer extends Disposable {
  readonly label: string;
  readonly native: unknown;
}

export interface TextureCopyView {
  texture: TextureLike;
  mipLevel?: number;
  origin?: Partial<Origin3D>;
  aspect?: TextureAspect;
}

export interface BufferCopyView {
  buffer: BufferLike;
  offset?: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
}

export interface CommandEncoder {
  readonly label: string;
  /** Begins a render pass. Only one pass may be open at a time. */
  beginRenderPass(descriptor: import('./RenderPassEncoder.js').RenderPassDescriptor): import('./RenderPassEncoder.js').RenderPassEncoder;
  /** Begins a compute pass (WebGPU only; the WebGL2 backend throws). */
  beginComputePass(descriptor?: import('./ComputePassEncoder.js').ComputePassDescriptor): import('./ComputePassEncoder.js').ComputePassEncoder;

  copyBufferToBuffer(
    source: BufferLike,
    sourceOffset: number,
    destination: BufferLike,
    destinationOffset: number,
    size: number,
  ): void;
  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;
  copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: Extent3D): void;
  copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: Extent3D): void;
  /** Zero-fills a buffer range. */
  clearBuffer(buffer: BufferLike, offset?: number, size?: number): void;

  finish(): CommandBuffer;
}

export type { TexelCopyBufferLayout };
