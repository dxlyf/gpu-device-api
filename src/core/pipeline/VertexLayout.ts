/** vertex buffer layout。对应 WebGPU 的 `GPUVertexBufferLayout`。 */

import type { VertexFormat } from '../enums/VertexFormat.js';
import { vertexFormatInfo } from '../enums/VertexFormat.js';
import type { VertexStepMode } from '../enums/VertexStepMode.js';

export interface VertexAttribute {
  /** 对应 GLSL 中的 `layout(location = N)` / WGSL 中的 `@location(N)`。 */
  shaderLocation: number;
  /** 该 attribute 在 vertex（或 instance）记录内的字节偏移。 */
  offset: number;
  format: VertexFormat;
}

export interface VertexBufferLayout {
  /** 相邻 vertex（或 instance）之间的字节距离。必须是 4 的倍数。 */
  arrayStride: number;
  /** 默认为 `'vertex'`。 */
  stepMode?: VertexStepMode;
  attributes: readonly VertexAttribute[];
}

/** 依据设备 limits 校验 layout，失败时抛出说明清晰的错误。 */
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

/**
 * 用于 pipeline 缓存的稳定 key。
 *
 * 结果按 layouts 数组的**对象身份**记忆（WeakMap）：顶点布局是管线描述的一部分、创建后不再变，
 * 而两个后端的每 draw 变体解析都会调到这里 —— 每次现拼一遍嵌套 `map/join` 在几千 draw 的
 * 场景里就是几千次无意义的字符串分配。命中缓存时不再重新拼接。
 */
const layoutsKeyCache = new WeakMap<readonly VertexBufferLayout[], string>();

export function vertexBufferLayoutsKey(layouts: readonly VertexBufferLayout[]): string {
  const cached = layoutsKeyCache.get(layouts);
  if (cached !== undefined) return cached;
  const key = layouts
    .map((layout) => {
      const attributes = layout.attributes
        .map((a) => `${a.shaderLocation}@${a.offset}:${a.format}`)
        .join(',');
      return `${layout.arrayStride}/${layout.stepMode ?? 'vertex'}[${attributes}]`;
    })
    .join(';');
  layoutsKeyCache.set(layouts, key);
  return key;
}
