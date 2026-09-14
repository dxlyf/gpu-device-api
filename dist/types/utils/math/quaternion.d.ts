/**
 * 四元数（`Float32Array`，长度 4，顺序 `[x, y, z, w]`）。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`、允许原地运算
 * （`quat.multiply(q, q, r)` 是安全的）。单位四元数是 `(0, 0, 0, 1)`。
 *
 * 乘法约定：`multiply(out, a, b)` 得到 `a * b`（Hamilton 积），与 `mat4.multiply` 是同一套顺序 ——
 * 都是「**先施加右边的 b、再施加左边的 a**」（`R(a·b) = R(a)·R(b)`），
 * 所以「四元数转矩阵」之后变换顺序不会反过来。
 *
 * 用在哪：朝向的保存与插值（{@link slerp}）、把朝向交给渲染（{@link toMat4}）、
 * 旋转向量（{@link transformVec3}）；欧拉角的互转在 `euler` 模块。
 */
export type Quat = Float32Array;
export declare function create(): Quat;
export declare function clone(a: Quat): Quat;
export declare function copy(out: Quat, a: Quat): Quat;
export declare function set(out: Quat, x: number, y: number, z: number, w: number): Quat;
export declare function fromValues(x: number, y: number, z: number, w: number): Quat;
export declare function identity(out: Quat): Quat;
/** 点积；单位四元数的点积就是「夹角余弦的一半」的度量，用来判断朝向接近程度。 */
export declare function dot(a: Quat, b: Quat): number;
export declare function squaredLength(a: Quat): number;
export declare function length(a: Quat): number;
/** 归一化；长度过小时退化为单位四元数（避免产生 NaN）。 */
export declare function normalize(out: Quat, a: Quat): Quat;
/** 共轭（单位四元数下就是逆旋转）。 */
export declare function conjugate(out: Quat, a: Quat): Quat;
/**
 * 求逆。只在**单位四元数**上有「共轭即逆」的结论，所以这里按一般情况除以模长平方；
 * 模长过小时退化为单位四元数。
 */
export declare function invert(out: Quat, a: Quat): Quat;
/** `out = a * b`：先施加 a、再施加 b。 */
export declare function multiply(out: Quat, a: Quat, b: Quat): Quat;
/** `out = b * a`（与 {@link multiply} 相反的顺序）。 */
export declare function premultiply(out: Quat, a: Quat, b: Quat): Quat;
/** 绕**本地** X 轴旋转：`out = a * Rx(rad)`。 */
export declare function rotateX(out: Quat, a: Quat, rad: number): Quat;
/** 绕**本地** Y 轴旋转：`out = a * Ry(rad)`。 */
export declare function rotateY(out: Quat, a: Quat, rad: number): Quat;
/** 绕**本地** Z 轴旋转：`out = a * Rz(rad)`。 */
export declare function rotateZ(out: Quat, a: Quat, rad: number): Quat;
/** 由「单位轴 + 弧度」构造（右手定则）。轴会被归一化；零轴退化为单位四元数。 */
export declare function setAxisAngle(out: Quat, axis: Float32Array, rad: number): Quat;
/**
 * 从 4×4 矩阵左上 3×3 提取旋转。
 *
 * 要求那部分是**纯旋转**（或带正均匀缩放）：提取用的是对角线迹法，
 * 非均匀缩放会得到偏差，此时调用方能做的话应先 `mat4.getScaling` 判断。
 * 退化矩阵（全 0）返回单位四元数。
 */
export declare function setFromRotationMatrix(out: Quat, m: Float32Array): Quat;
/**
 * 求把单位向量 `from` 转到 `to` 的最短旋转。
 * 两个向量相反时旋转轴不唯一，这里挑一个与 from 不平行的轴（与 three.js 的做法一致）。
 */
export declare function setFromUnitVectors(out: Quat, from: Float32Array, to: Float32Array): Quat;
/** 用四元数旋转向量：`out = q * v * q⁻¹`。 */
export declare function transformVec3(out: Float32Array, a: Quat, v: Float32Array): Float32Array;
/** 球面线性插值（朝向插值的正确做法，不会像欧拉角那样遇到万向锁）。 */
export declare function slerp(out: Quat, a: Quat, b: Quat, t: number): Quat;
/** 线性插值（比 {@link slerp} 便宜，但不保持角速度恒定；结果会归一化）。 */
export declare function lerp(out: Quat, a: Quat, b: Quat, t: number): Quat;
/**
 * 转成 4×4 旋转矩阵（列主序，右手系，与 `mat4.rotateX/Y/Z` 同一套约定）。
 * 平移分量为 0，可以直接 `mat4.multiply` 进模型矩阵。
 */
export declare function toMat4(out: Float32Array, a: Quat): Float32Array;
/** 分量比较；`epsilon` 默认取 `1e-6`。注意 `q` 与 `-q` 表示同一个旋转，这里**不做**这种等价判断。 */
export declare function equals(a: Quat, b: Quat, epsilon?: number): boolean;
export declare function toString(a: Quat): string;
//# sourceMappingURL=quaternion.d.ts.map