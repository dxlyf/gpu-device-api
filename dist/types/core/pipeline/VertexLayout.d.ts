/** vertex buffer layout。对应 WebGPU 的 `GPUVertexBufferLayout`。 */
import type { VertexFormat } from '../enums/VertexFormat.js';
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
export declare function validateVertexBufferLayout(layout: VertexBufferLayout, limits: {
    maxVertexAttributes: number;
    maxVertexBufferArrayStride: number;
}): void;
export declare function vertexBufferLayoutsKey(layouts: readonly VertexBufferLayout[]): string;
//# sourceMappingURL=VertexLayout.d.ts.map