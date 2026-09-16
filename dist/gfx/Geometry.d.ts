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
import { type Vec3 } from '../utils/math/index.js';
import type { VertexStepMode } from '../core/enums/VertexStepMode.js';
import type { PrimitiveTopology } from '../core/enums/PrimitiveTopology.js';
import type { Buffer } from '../core/resources/Buffer.js';
import type { Device } from '../core/Device.js';
/** 已知属性名的默认格式。自定义属性必须显式给 `format`。 */
export declare const STANDARD_ATTRIBUTE_FORMATS: Readonly<Record<string, VertexFormat>>;
/**
 * 包围球（局部空间）：视锥剔除与「按深度排序」都用它。
 *
 * 它由几何体创建时**算一次**（遍历顶点求 AABB 的中心，再取到中心最远的顶点距离），
 * 之后只读 —— 每帧重算包围体是纯粹的浪费，这里刻意不提供「每帧刷新」的接口：
 * 顶点数据在创建后就不变了（`Geometry` 是只读的）。
 */
export interface BoundingSphere {
    /** 球心（局部空间，3 个分量）。 */
    readonly center: Vec3;
    /** 半径。 */
    readonly radius: number;
}
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
    /**
     * 显式提供包围球，覆盖「按 `position` 顶点算出来的那个」。
     *
     * 两个场合非给不可：
     * - **position 不是 `float32x3`**（例如量化过的 `unorm16x4`）：这时无法从数据推断，自动计算会被跳过；
     * - **顶点着色器会位移顶点**（水面波动、草地摇摆…）：按原始顶点算出来的球可能盖不住实际的绘制范围，
     *   那种情况下必须由调用方给一个足够大的球（或者直接关掉剔除）。
     *
     * `center` 省略时按原点处理。
     */
    boundingSphere?: {
        center?: ArrayLike<number>;
        radius: number;
    };
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
    /**
     * 按实例步进的属性能提供多少个实例（取各实例属性里最少的那个）；没有实例属性时为 `null`。
     *
     * 它和 `vertexCount` 是两回事：实例属性的元素个数可以比顶点数少（典型情况：
     * 一个盒子的 36 个顶点 + 1000 份实例数据），所以两者分开推断、也分开校验。
     */
    readonly instanceCount: number | null;
    /**
     * 局部空间的包围球；推断不出来时为 `null`（例如 `position` 不是 `float32x3` 且调用方也没给）。
     * 创建时算一次，之后不再变。
     */
    readonly boundingSphere: BoundingSphere | null;
    /**
     * 这个几何体是否适合做视锥剔除。
     *
     * 有两种情况返回 `false`，都是为了让剔除**不会**画错：
     * - 没有包围球（见 {@link boundingSphere}）；
     * - 带按实例步进的属性、且包围球是**按基础顶点**算出来的：实例化绘制里每个实例的位置由
     *   实例属性决定，基础顶点的包围球完全盖不住它们（拿它剔除会把可见的实例整批丢掉）。
     *   显式传了 `boundingSphere` 时调用方已经对实例分布负责，这时仍然可剔除。
     */
    readonly cullable: boolean;
    private _disposed;
    /**
     * 已经校验过的「材质属性声明」集合，键是 `Material.attributes` 这个数组对象本身。
     *
     * 校验结果只取决于 (几何体, 材质声明) 这一对，而两者在创建后都不再变 —— 所以每 draw
     * 重复校验是纯浪费（40k draw 的场景下每帧几毫秒）。用数组身份当键，既拿到了
     * 「按材质缓存」的效果，又不用在渲染器里维护 WeakMap。
     */
    private readonly validatedAgainst;
    private constructor();
    /** 上传几何体数据到 GPU。 */
    static create(device: Device, desc: GeometryDesc): Geometry;
    get disposed(): boolean;
    /** 实际的绘制顶点/索引数。 */
    get drawCount(): number;
    /**
     * 检查几何体是否提供了材质需要的所有属性，格式与步进模式是否匹配。
     *
     * `stepMode` 必须与数据上传时的 `perInstance` 一致：步进模式对不上时，
     * 顶点缓冲会按错误的节奏被读取（画出来是乱码而不是报错），所以这里直接拦下。
     */
    validateAgainst(required: readonly {
        name: string;
        format: VertexFormat;
        stepMode?: VertexStepMode;
    }[], materialName: string): void;
    destroy(): void;
}
/** 便捷入口。 */
export declare function createGeometry(device: Device, desc: GeometryDesc): Geometry;
//# sourceMappingURL=Geometry.d.ts.map