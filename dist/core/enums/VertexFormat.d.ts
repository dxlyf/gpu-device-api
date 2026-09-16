/**
 * vertex attribute 格式。名称与 WebGPU 完全一致；WebGL2 后端会将每一种
 * 转换为 `vertexAttribPointer`/`vertexAttribIPointer` 调用。
 */
export type VertexFormat = 'uint8x2' | 'uint8x4' | 'sint8x2' | 'sint8x4' | 'unorm8x2' | 'unorm8x4' | 'snorm8x2' | 'snorm8x4' | 'uint16x2' | 'uint16x4' | 'sint16x2' | 'sint16x4' | 'unorm16x2' | 'unorm16x4' | 'snorm16x2' | 'snorm16x4' | 'float16x2' | 'float16x4' | 'float32' | 'float32x2' | 'float32x3' | 'float32x4' | 'uint32' | 'uint32x2' | 'uint32x3' | 'uint32x4' | 'sint32' | 'sint32x2' | 'sint32x3' | 'sint32x4';
export interface VertexFormatInfo {
    /** 每个 vertex 读取的分量数量。 */
    readonly components: 1 | 2 | 3 | 4;
    /** 单个元素占用的字节数。 */
    readonly byteSize: number;
    /** 分量类型。 */
    readonly kind: 'float' | 'uint' | 'sint';
    /** 小数格式在读取时会被归一化到 [0,1] / [-1,1]。 */
    readonly normalized: boolean;
}
/** 所有 {@link VertexFormat} 的共享描述，与后端无关。 */
export declare const VERTEX_FORMAT_INFO: Readonly<Record<VertexFormat, VertexFormatInfo>>;
export declare function vertexFormatInfo(format: VertexFormat): VertexFormatInfo;
/** 用于声明该格式 attribute 的 GLSL ES 3.00 类型。 */
export declare function vertexFormatGlslType(format: VertexFormat): string;
/** 用于声明该格式 attribute 的 WGSL 类型。 */
export declare function vertexFormatWgslType(format: VertexFormat): string;
//# sourceMappingURL=VertexFormat.d.ts.map