/**
 * 三维向量（Float32Array，长度 3）。
 *
 * 与 `vec2` 相同的约定：`out` 在第一个参数，返回值就是 `out`，允许原地运算。
 * 位置变换请用 {@link transformMat4}（会做透视除法），方向变换请用
 * {@link transformDirection}（忽略平移，不做除法）。
 */
export type Vec3 = Float32Array;
export declare function create(): Vec3;
export declare function clone(a: Vec3): Vec3;
export declare function fromValues(x: number, y: number, z: number): Vec3;
export declare function copy(out: Vec3, a: Vec3): Vec3;
export declare function set(out: Vec3, x: number, y: number, z: number): Vec3;
export declare function zero(out: Vec3): Vec3;
export declare function add(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function sub(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function mul(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function div(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function scale(out: Vec3, a: Vec3, scalar: number): Vec3;
/** `out = a + b * scalar`。 */
export declare function scaleAndAdd(out: Vec3, a: Vec3, b: Vec3, scalar: number): Vec3;
export declare function negate(out: Vec3, a: Vec3): Vec3;
/** 归一化；长度接近 0 时写入零向量，不会产生 NaN。 */
export declare function normalize(out: Vec3, a: Vec3): Vec3;
export declare function length(a: Vec3): number;
export declare function squaredLength(a: Vec3): number;
export declare function distance(a: Vec3, b: Vec3): number;
export declare function squaredDistance(a: Vec3, b: Vec3): number;
export declare function dot(a: Vec3, b: Vec3): number;
/** 叉积。注意叉积不满足交换律：`a × b = -(b × a)`。 */
export declare function cross(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3;
export declare function min(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function max(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function equals(a: Vec3, b: Vec3, epsilon?: number): boolean;
/** 镜面反射：`out = a - 2 * dot(n, a) * n`，`n` 必须是单位向量。 */
export declare function reflect(out: Vec3, a: Vec3, n: Vec3): Vec3;
/** 用 3x3 矩阵变换（不含平移），用于法线方向。 */
export declare function transformMat3(out: Vec3, a: Vec3, m: Float32Array): Vec3;
/**
 * 用 4x4 矩阵变换点：`out = (m * (x, y, z, 1)).xyz / w`。
 * `w` 为 0 时按 1 处理，避免除零产生 NaN。
 */
export declare function transformMat4(out: Vec3, a: Vec3, m: Float32Array): Vec3;
/**
 * 用 4x4 矩阵变换方向：只取左上 3x3，忽略平移，不做透视除法。
 * 适合方向光、相机朝向这类「无位置」的量。
 */
export declare function transformDirection(out: Vec3, a: Vec3, m: Float32Array): Vec3;
export declare function toArray(a: Vec3): number[];
export declare function toString(a: Vec3): string;
//# sourceMappingURL=vec3.d.ts.map