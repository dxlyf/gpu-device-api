/**
 * 射线：`{ origin, direction }`，`direction` 取**单位向量**。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 *
 * 相交类函数统一返回「沿射线方向的距离参数 `t`」（交点是 `origin + direction * t`），
 * 没有相交或交点在射线反向延长线上时返回 `null`。要拿交点用 {@link at}：
 *
 * ```ts
 * const t = ray.intersectSphere(ray, center, radius);
 * if (t !== null) ray.at(hitPoint, ray, t);
 * ```
 */
import type { Box3 } from './box3.js';
import type { Plane } from './plane.js';
import type { Vec3 } from './vec3.js';
export interface Ray {
    origin: Vec3;
    direction: Vec3;
}
export declare function create(originX?: number, originY?: number, originZ?: number, directionX?: number, directionY?: number, directionZ?: number): Ray;
export declare function clone(a: Ray): Ray;
export declare function copy(out: Ray, a: Ray): Ray;
/** 设置起点与方向；`direction` 会被归一化（零向量则保持原样，避免 NaN）。 */
export declare function set(out: Ray, origin: Vec3, direction: Vec3): Ray;
/** 射线上的点：`origin + direction * t`（`t` 允许为负，表示反向延长线）。 */
export declare function at(out: Vec3, a: Ray, t: number): Vec3;
/** 把起点沿方向推进 `t`，方向不变（例如射线打在某个面上后从该点继续）。 */
export declare function recast(out: Ray, a: Ray, t: number): Ray;
/** 点到射线上最近的点（`t < 0` 时夹到起点）。 */
export declare function closestPointToPoint(out: Vec3, a: Ray, point: Vec3): Vec3;
/** 点到射线的距离（垂直距离，不是沿射线的参数）。 */
export declare function distanceToPoint(a: Ray, point: Vec3): number;
/** 点到射线距离的平方。 */
export declare function squaredDistanceToPoint(a: Ray, point: Vec3): number;
/**
 * 用 4×4 矩阵变换射线：起点按点变换（含平移与透视除法），方向按方向变换（忽略平移）后重新归一化。
 * 这是「把世界空间的射线搬到模型局部空间」的标准做法。
 */
export declare function applyMat4(out: Ray, a: Ray, m: Float32Array): Ray;
/**
 * 与平面求交，返回 `t`（`t >= 0`）。射线与平面平行时返回 `null`
 *（射线落在平面上属于退化情形，也按 null 处理，避免无数组解）。
 */
export declare function intersectPlane(a: Ray, plane: Plane): number | null;
/** 与球求交，返回最近的 `t`（射线起点在球内时返回出射的 `t`）。 */
export declare function intersectSphere(a: Ray, center: Vec3, radius: number): number | null;
/**
 * 与轴对齐包围盒求交（slab 法），返回进入盒子的 `t`。
 * 射线起点已经在盒内时返回 0；完全不相交、或盒子为空时返回 `null`。
 */
export declare function intersectBox(a: Ray, box: Box3): number | null;
/**
 * 与三角形求交（Möller–Trumbore），返回 `t`。
 * `backfaceCulling` 为 true 时只接受正面（a → b → c 逆时针）命中，默认双面。
 */
export declare function intersectTriangle(a: Ray, v0: Vec3, v1: Vec3, v2: Vec3, backfaceCulling?: boolean): number | null;
/** 起点与方向都接近才算相等。 */
export declare function equals(a: Ray, b: Ray, epsilon?: number): boolean;
/** 仅用于调试。 */
export declare function toString(a: Ray): string;
/** 起点与方向是否都是有限值、且方向非零。拿外部输入构造射线前可以先过一遍。 */
export declare function isWellFormed(a: Ray): boolean;
//# sourceMappingURL=ray.d.ts.map