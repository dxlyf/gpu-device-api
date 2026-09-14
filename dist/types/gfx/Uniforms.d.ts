/**
 * 声明式 uniform：**一份描述同时生成两种语言的内存布局与着色器代码**。
 *
 * 这是便捷层「很方便就能绘制」的关键。写一次：
 *
 * ```ts
 * const uniforms = defineUniforms({
 *   projectionView: 'mat4x4f',
 *   model: 'mat4x4f',
 *   baseColor: 'vec4f',
 *   lightDirection: 'vec3f',
 *   time: 'f32',
 *   bones: 'mat4x4f[64]',
 * });
 * ```
 *
 * 就能得到：
 * 1. **字节布局**（同时满足 GLSL `std140` 与 WGSL uniform 地址空间）；
 * 2. GLSL 的块声明与 WGSL 的 struct + binding 声明（**成员访问都是 `u.xxx`**）；
 * 3. JS 侧的类型化写入器（`uniforms.model.set(mat4)`、`uniforms.time[0] = t`）。
 *
 * ## 布局规则（取两种规范的**交集**）
 *
 * | 类型 | 对齐 | 大小 |
 * |---|---|---|
 * | `f32` / `i32` / `u32` | 4 | 4 |
 * | `vec2f` / `vec2i` / `vec2u` | 8 | 8 |
 * | `vec3f` / `vec3i` / `vec3u` | 16 | 12 |
 * | `vec4f` / `vec4i` / `vec4u` | 16 | 16 |
 * | `mat4x4f` | 16 | 64（4 列 × 16 字节） |
 * | `mat3x3f` | 16 | 48（**每列补齐到 16 字节**） |
 * | `T[N]` | 16 | 元素步长取整到 16 的倍数 |
 *
 * 块总大小取整到 16 的倍数。
 *
 * ## 两个刻意拒绝的类型
 *
 * - **`mat2x2f`**：std140 认为它是「align 16 / size 32」（矩阵按列数组处理，列步长取整到 16），
 *   而 WGSL uniform 认为它是「align 8 / size 16」。两者**不一致**，所以直接拒绝，
 *   并提示改用 `vec4f` 手工解包。
 * - **`mat3x3f[N]`**：每列有 4 字节填充，无法表示为扁平数组，拒绝并提示改用 `mat4x4f[N]`。
 */
export type UniformScalarType = 'f32' | 'i32' | 'u32';
export type UniformVectorType = 'vec2f' | 'vec3f' | 'vec4f' | 'vec2i' | 'vec3i' | 'vec4i' | 'vec2u' | 'vec3u' | 'vec4u';
export type UniformMatrixType = 'mat3x3f' | 'mat4x4f';
export type UniformElementType = UniformScalarType | UniformVectorType | UniformMatrixType;
/** 数组写法：`'vec4f[8]'`、`'mat4x4f[64]'`。 */
export type UniformArrayType = `${UniformElementType}[${number}]`;
export type UniformFieldType = UniformElementType | UniformArrayType;
export type UniformLayoutDesc = Record<string, UniformFieldType>;
interface TypeInfo {
    readonly align: number;
    readonly size: number;
    readonly glsl: string;
    readonly wgsl: string;
    readonly componentType: 'f32' | 'i32' | 'u32';
    /** 一个元素里的标量个数（`mat3x3f` 是 9）。 */
    readonly components: number;
    /** 矩阵的列信息；非矩阵为 `undefined`。 */
    readonly columnStride?: number;
    readonly columnSize?: number;
    readonly columns?: number;
}
/** 支持的 uniform 字段类型名，用于错误提示。 */
export declare const UNIFORM_FIELD_TYPES: readonly UniformElementType[];
export interface UniformFieldLayout {
    readonly name: string;
    readonly type: UniformFieldType;
    readonly info: TypeInfo;
    readonly byteOffset: number;
    /** 单个元素占用的字节数（矩阵含列内填充）。 */
    readonly byteSize: number;
    /** 数组相邻元素的字节步长；非数组等于 `byteSize`。 */
    readonly byteStride: number;
    /** 元素个数；非数组为 1。 */
    readonly count: number;
    /** 内存是否连续无空洞 —— 是的话可以直接给一个扁平的 TypedArray 视图。 */
    readonly packed: boolean;
}
/**
 * 一份 uniform 块的布局。同时供 GLSL 与 WGSL 使用，
 * 并对外暴露生成声明所需的一切信息。
 */
export declare class UniformLayout {
    readonly desc: UniformLayoutDesc;
    readonly fields: readonly UniformFieldLayout[];
    /** 块总字节数（16 的倍数）。 */
    readonly byteLength: number;
    /** 内容指纹，用于缓存与校验「管线与数值是否匹配」。 */
    readonly key: string;
    /** WGSL 结构体名；GLSL 的块名是 `${structName}Block` 之外，这里同时用作 GLSL 块名。 */
    readonly structName: string;
    /** 着色器里的实例名；两种语言都是 `u`，所以成员访问写法一致。 */
    readonly instanceName = "u";
    readonly group: number;
    readonly binding: number;
    constructor(desc: UniformLayoutDesc, options?: UniformOptions);
    field(name: string): UniformFieldLayout;
    has(name: string): boolean;
    /**
     * GLSL 里的元素类型（**不含数组后缀**）。
     * 注意 GLSL 的数组写法是 `mat4 bones[64];`（方括号跟在名字后面），
     * 与 WGSL 的 `array<mat4x4f, 64>` 不同，所以数组由 {@link glslDeclaration} 拼接。
     */
    glslMemberType(field: UniformFieldLayout): string;
    /** WGSL 里的成员类型（数组写成 `array<T, N>`）。 */
    wgslMemberType(field: UniformFieldLayout): string;
    /**
     * GLSL 的 `std140` 块声明。块名用 {@link structName}，实例名 `u`。
     * 之所以块名不叫 `UniformsBlock`：WebGL2 后端要靠**块名**去 `gl.getUniformBlockIndex` 定位，
     * 而 WGSL 的结构体名也是这个 —— 两边同名可以让 `BindGroupLayoutEntry.name` 只写一次。
     */
    glslDeclaration(): string;
    /** WGSL 的 struct + binding 声明。 */
    wgslDeclaration(): string;
    /** 调试用：逐字段打印偏移。 */
    describe(): string;
}
export interface UniformOptions {
    /** WGSL 结构体名 / GLSL 块名，默认 `'Uniforms'`。 */
    structName?: string;
    group?: number;
    binding?: number;
}
/**
 * 定义一份 uniform 布局。相同描述会复用同一个 {@link UniformLayout} 实例，
 * 因此「管线与写入器是否匹配」可以直接比较对象或 `key`。
 */
export declare function defineUniforms(desc: UniformLayoutDesc, options?: UniformOptions): UniformLayout;
type AnyTypedArray = Float32Array | Int32Array | Uint32Array;
/**
 * 字段内存**不连续**时（`mat3x3f`、`vec3f[N]`、`f32[N]`…）返回的访问器。
 * 用 `at(i)` 取元素视图，`set()/get()` 收发**紧凑打包**的数据。
 */
export interface UniformFieldAccessor<T extends AnyTypedArray = AnyTypedArray> {
    readonly type: UniformFieldType;
    /** 元素个数（数组长度，或矩阵的列数）。 */
    readonly count: number;
    /** 相邻元素的字节步长。 */
    readonly byteStride: number;
    at(index: number): T;
    set(value: ArrayLike<number>): void;
    get(out?: T): T;
}
/** 按字段类型推断写入器的具体类型，让 `u.model.set(...)` 有准确提示。 */
export type UniformFieldValue<T extends UniformFieldType> = T extends 'mat3x3f' ? UniformFieldAccessor<Float32Array> : T extends `${infer B}[${number}]` ? B extends 'vec4f' | 'mat4x4f' ? Float32Array : B extends 'vec4i' ? Int32Array : B extends 'vec4u' ? Uint32Array : B extends 'mat3x3f' | 'vec3f' | 'vec2f' | 'f32' ? UniformFieldAccessor<Float32Array> : B extends 'vec3i' | 'vec2i' | 'i32' ? UniformFieldAccessor<Int32Array> : B extends 'vec3u' | 'vec2u' | 'u32' ? UniformFieldAccessor<Uint32Array> : never : T extends 'f32' | 'vec2f' | 'vec3f' | 'vec4f' | 'mat4x4f' ? Float32Array : T extends 'i32' | 'vec2i' | 'vec3i' | 'vec4i' ? Int32Array : T extends 'u32' | 'vec2u' | 'vec3u' | 'vec4u' ? Uint32Array : never;
export type UniformFieldValues<D extends UniformLayoutDesc> = {
    readonly [K in keyof D]: UniformFieldValue<D[K]>;
};
/** 标量字段收 `number`，其余收紧凑的数字数组。 */
export type UniformInput<T extends UniformFieldType> = T extends UniformScalarType ? number : ArrayLike<number>;
export type UniformInputValues<D extends UniformLayoutDesc> = {
    readonly [K in keyof D]?: UniformInput<D[K]>;
};
/**
 * 一个 uniform 块的 CPU 侧数值容器。
 *
 * 用 {@link createUniforms} 创建，它会用 Proxy 把字段挂成直接可访问的属性：
 * ```ts
 * const u = createUniforms({ model: 'mat4x4f', color: 'vec4f', time: 'f32' });
 * u.model.set(modelMatrix);     // Float32Array(16)
 * u.color.set([1, 0, 0, 1]);
 * u.time[0] = performance.now() / 1000;
 * u.set('color', [0, 1, 0, 1]); // 也可以用 set()
 * ```
 */
export declare class UniformValues<D extends UniformLayoutDesc = UniformLayoutDesc> {
    readonly layout: UniformLayout;
    readonly buffer: ArrayBuffer;
    private readonly fieldValues;
    /** 每次修改自增；渲染器据此跳过没必要的上传。 */
    version: number;
    constructor(layout: UniformLayout);
    constructor(desc: D, options?: UniformOptions);
    private createFieldValue;
    /** 所有字段写入器。 */
    get fields(): UniformFieldValues<D>;
    has(name: string): boolean;
    /** 取单个字段的写入器。 */
    field<K extends keyof D & string>(name: K): UniformFieldValue<D[K]>;
    /** 写一个字段。标量收 `number`，其余收紧凑数组。 */
    set<K extends keyof D & string>(name: K, value: UniformInput<D[K]>): this;
    /** 批量写：`u.assign({ time: 1, color: [1, 0, 0, 1] })`。 */
    assign(values: UniformInputValues<D>): this;
    /** 读回字段的紧凑数据。 */
    get<K extends keyof D & string>(name: K, out?: AnyTypedArray): AnyTypedArray;
    /** 有效字节数的视图（上传时用，避免把尾部对齐填充也传上去）。 */
    get bytes(): Uint8Array;
    /** 复制一份紧凑的字节数据。 */
    toArrayBuffer(): ArrayBuffer;
}
/** {@link createUniforms} 的返回类型：既有方法，也能直接按字段名取值。 */
export type Uniforms<D extends UniformLayoutDesc> = UniformValues<D> & UniformFieldValues<D>;
/**
 * 创建 uniform 数值容器，字段可直接当属性访问。
 *
 * 传 {@link UniformLayout} 时会复用它（同一个布局可以创建多个数值容器，
 * 用于「每个物体一套 uniform」的写法）。
 */
export declare function createUniforms<D extends UniformLayoutDesc>(desc: D | UniformLayout, options?: UniformOptions): Uniforms<D>;
export {};
//# sourceMappingURL=Uniforms.d.ts.map