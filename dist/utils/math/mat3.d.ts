/**
 * 3x3 矩阵（Float32Array，长度 9），**列主序**存储，与 GLSL / WGSL 的内存布局一致。
 *
 * 内存布局映射到数学形式：
 * ```
 * m = [ m[0] m[3] m[6] ]
 *     [ m[1] m[4] m[7] ]
 *     [ m[2] m[5] m[8] ]
 * ```
 * 因此 `m[0..2]` 是**第一列**，而不是第一行。
 *
 * 约定同向量模块：`out` 在第一个参数，返回值就是 `out`，所有函数都允许 `out` 与输入同一对象。
 */
export type Mat3 = Float32Array;
/** 创建单位矩阵。 */
export declare function create(): Mat3;
/** 写入单位矩阵。 */
export declare function identity(out: Mat3): Mat3;
export declare function clone(a: Mat3): Mat3;
export declare function fromValues(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Mat3;
export declare function copy(out: Mat3, a: Mat3): Mat3;
/** 按列主序逐个写入 9 个分量。 */
export declare function set(out: Mat3, m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Mat3;
/** 取 4x4 矩阵左上角的 3x3 部分（常用于从模型矩阵取出线性变换部分）。 */
export declare function fromMat4(out: Mat3, a: Float32Array): Mat3;
/** 转置。 */
export declare function transpose(out: Mat3, a: Mat3): Mat3;
/** 行列式。 */
export declare function determinant(a: Mat3): number;
/**
 * 求逆。矩阵奇异（行列式为 0）时返回 `null`，不做静默的零矩阵填充，
 * 调用方必须显式处理失败分支。
 */
export declare function invert(out: Mat3, a: Mat3): Mat3 | null;
/** 矩阵乘法：`out = a * b`（先应用 `b`，再应用 `a`）。 */
export declare function multiply(out: Mat3, a: Mat3, b: Mat3): Mat3;
/** 逐列缩放：`b` 是每列各自的缩放系数（等价于二维绕原点缩放）。 */
export declare function scale(out: Mat3, a: Mat3, b: Float32Array): Mat3;
/** 在矩阵上叠加二维平移（`b` 为 `vec2`）。 */
export declare function translate(out: Mat3, a: Mat3, b: Float32Array): Mat3;
/** 在矩阵上叠加二维旋转（弧度，绕原点逆时针）。 */
export declare function rotate(out: Mat3, a: Mat3, rad: number): Mat3;
/**
 * 由 4x4 矩阵求**法线矩阵**，即左上 3x3 的「逆转置」。
 *
 * 非等比缩放会破坏法线方向，必须用它来变换法线：直接乘模型矩阵会让法线不再垂直于表面。
 * 左上 3x3 奇异（例如某个轴缩放为 0）时返回 `null`。
 *
 * ```ts
 * const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
 * ```
 */
export declare function normalFromMat4(out: Mat3, a: Float32Array): Mat3 | null;
export declare function equals(a: Mat3, b: Mat3, epsilon?: number): boolean;
export declare function toString(a: Mat3): string;
//# sourceMappingURL=mat3.d.ts.map