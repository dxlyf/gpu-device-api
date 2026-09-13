/** Vertex buffer layouts. Mirrors WebGPU's `GPUVertexBufferLayout`. */

import type { VertexFormat } from '../enums/VertexFormat.js';
import { vertexFormatInfo } from '../enums/VertexFormat.js';
import type { VertexStepMode } from '../enums/VertexStepMode.js';

export interface VertexAttribute {
  /** Matches `layout(location = N)` in GLSL / `@location(N)` in WGSL. */
  shaderLocation: number;
  /** Byte offset of the attribute inside the vertex (or instance) record. */
  offset: number;
  format: VertexFormat;
}

export interface VertexBufferLayout {
  /** Byte distance between consecutive vertices (or instances). Multiple of 4. */
  arrayStride: number;
  /** Defaults to `'vertex'`. */
  stepMode?: VertexStepMode;
  attributes: readonly VertexAttribute[];
}

/** Validates a layout against the device limits, throwing a descriptive error. */
export function validateVertexBufferLayout(
  layout: VertexBufferLayout,
  limits: { maxVertexAttributes: number; maxVertexBufferArrayStride: number },
): void {
  if (!Number.isInteger(layout.arrayStride) || layout.arrayStride <= 0) {
    throw new Error(`[gpu-device-api] VertexBufferLayout.arrayStride must be a positive integer, got ${layout.arrayStride}.`);
  }
  if (layout.arrayStride % 4 !== 0) {
    throw new Error(`[gpu-device-api] VertexBufferLayout.arrayStride must be a multiple of 4, got ${layout.arrayStride}.`);
  }
  if (layout.arrayStride > limits.maxVertexBufferArrayStride) {
    throw new Error(
      `[gpu-device-api] VertexBufferLayout.arrayStride ${layout.arrayStride} exceeds maxVertexBufferArrayStride (${limits.maxVertexBufferArrayStride}).`,
    );
  }
  if (layout.attributes.length === 0) {
    throw new Error('[gpu-device-api] VertexBufferLayout needs at least one attribute.');
  }
  for (const attribute of layout.attributes) {
    const info = vertexFormatInfo(attribute.format);
    if (attribute.shaderLocation < 0 || attribute.shaderLocation >= limits.maxVertexAttributes) {
      throw new Error(
        `[gpu-device-api] VertexAttribute.shaderLocation ${attribute.shaderLocation} is outside [0, ${limits.maxVertexAttributes - 1}].`,
      );
    }
    if (attribute.offset < 0 || attribute.offset % 4 !== 0) {
      throw new Error(`[gpu-device-api] VertexAttribute.offset must be a non-negative multiple of 4, got ${attribute.offset}.`);
    }
    if (attribute.offset + info.byteSize > layout.arrayStride) {
      throw new Error(
        `[gpu-device-api] VertexAttribute at location ${attribute.shaderLocation} reads ${info.byteSize} bytes from offset ${attribute.offset}, ` +
          `which overflows arrayStride ${layout.arrayStride}.`,
      );
    }
  }
}

/** Stable key for pipeline caching. */
export function vertexBufferLayoutsKey(layouts: readonly VertexBufferLayout[]): string {
  return layouts
    .map((layout) => {
      const attributes = layout.attributes
        .map((a) => `${a.shaderLocation}@${a.offset}:${a.format}`)
        .join(',');
      return `${layout.arrayStride}/${layout.stepMode ?? 'vertex'}[${attributes}]`;
    })
    .join(';');
}
