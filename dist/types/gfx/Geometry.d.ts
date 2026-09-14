/**
 * 几何体：把「按属性名给出的顶点数据」变成可以直接绘制的 core buffer 集合。
 *
 * ## 为什么按属性拆成多个 buffer（de-interleaved）
 *
 * 交织存储看起来更省显存，但要求「材质需要的属性集合」与「几何体实际打包的布局」完全一致，
 * 否则步长就不同，管线得为每个几何体重建一次。便捷层选择**按属性分开存**：
 * 每个属性一个 buffer，步长就是它自己格式的字节数。
 * 于是顶点布局只由**材质**决定（见 `Material.vertexBufferLayouts()`），
 * 一个材质对应一条管线，几何体多带几个用不到的属性也完全无影响。
 *
 * 交织存储留作后续优化：等有了「按属性集合缓存布局」的机制再加。
 */
import { type IndexFormat } from '../core/enums/IndexFormat.js';
import { type VertexFormat } from '../core/enums/VertexFormat.js';
import type { PrimitiveTopology } from '../core/enums/PrimitiveTopology.js';
import type { Buffer } from '../core/resources/Buffer.js';
import type { Device } from '../core/Device.js';
/** 已知属性名的默认格式。自定义属性必须显式给 `format`。 */
export declare const STANDARD_ATTRIBUTE_FORMATS: Readonly<Record<string, VertexFormat>>;
/** 单个属性的输入。 */
export interface GeometryAttributeInput {
    data: ArrayBufferView;
    /** 省略时按属性名推断（见 {@link STANDARD_ATTRIBUTE_FORMATS}）。 */
    format?: VertexFormat;
    /** 每个实例步进一次（GPU instancing）。 */
    perInstance?: boolean;
}
export interface GeometryDesc {
    /** 常用属性的简写。 */
    position?: Float32Array;
    normal?: Float32Array;
    uv?: Float32Array;
    uv1?: Float32Array;
    color?: Float32Array;
    tangent?: Float32Array;
    /** 其它属性，或需要自定义格式的属性。 */
    attributes?: Record<string, ArrayBufferView | GeometryAttributeInput>;
    indices?: Uint16Array | Uint32Array | readonly number[];
    topology?: PrimitiveTopology;
    /** 显式指定顶点数；省略时按属性数据长度推断。 */
    vertexCount?: number;
    label?: string;
}
export interface GeometryAttribute {
    readonly name: string;
    readonly format: VertexFormat;
    /** 单个元素的字节数。 */
    readonly byteStride: number;
    readonly components: number;
    readonly perInstance: boolean;
    readonly buffer: Buffer;
}
/** 一份可以绘制的几何体。 */
export declare class Geometry {
    readonly label: string;
    readonly topology: PrimitiveTopology;
    readonly attributes: ReadonlyMap<string, GeometryAttribute>;
    readonly attributeNames: readonly string[];
    readonly vertexCount: number;
    readonly indexBuffer: Buffer | null;
    readonly indexFormat: IndexFormat | null;
    readonly indexCount: number;
    private _disposed;
    private constructor();
    /** 上传几何体数据到 GPU。 */
    static create(device: Device, desc: GeometryDesc): Geometry;
    get disposed(): boolean;
    /** 实际的绘制顶点/索引数。 */
    get drawCount(): number;
    /** 检查几何体是否提供了材质需要的所有属性，格式是否匹配。 */
    validateAgainst(required: readonly {
        name: string;
        format: VertexFormat;
    }[], materialName: string): void;
    destroy(): void;
}
/** 便捷入口。 */
export declare function createGeometry(device: Device, desc: GeometryDesc): Geometry;
//# sourceMappingURL=Geometry.d.ts.map