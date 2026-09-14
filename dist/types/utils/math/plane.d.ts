/**
 * 平面：`{ normal, constant }`，含义是 **`normal · p + constant = 0`** 的点集
 * （与 three.js 同一套约定）。`normal` 取单位向量。
 *
 * 因此：
 * - {@link distanceToPoint} 在法线一侧为正、另一侧为负；
 * - {@link coplanarPoint} 给出的平面上一点是 `normal * -constant`。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 * 输入退化（三点共线、法线为 0）时返回 `null` 或抛 `RangeError`，
 * 而不是悄悄算出一堆 NaN。
 */
import type { Vec3 } from './vec3.js';
export interface Plane {
    normal: Vec3;
    constant: number;
}
export declare function create(normalX?: number, normalY?: number, normalZ?: number, constant?: number): Plane;
export declare function clone(a: Plane): Plane;
export declare function copy(out: Plane, a: Plane): Plane;
/** 直接给「法线 + constant」。法线不会被归一化，需要时请用 {@link setFromNormalAndCoplanarPoint}。 */
export declare function set(out: Plane, normal: Vec3, constant: number): Plane;
export declare function setComponents(out: Plane, x: number, y: number, z: number, constant: number): Plane;
/** 由「法线（会被归一化）+ 平面上的一个点」构造：`constant = -dot(normal, point)`。 */
export declare function setFromNormalAndCoplanarPoint(out: Plane, normal: Vec3, point: Vec3): Plane;
/**
 * 由三个不共线的点构造：法线取 `(b - a) × (c - a)`（所以 a → b → c 逆时针时法线朝向观察者）。
 * 三点共线时法线长度为 0，返回 `null`。
 */
export declare function setFromCoplanarPoints(out: Plane, a: Vec3, b: Vec3, c: Vec3): Plane | null;
/** 归一化（`constant` 同步按比例缩放）；法线长度为 0 时返回 `null`。 */
export declare function normalize(out: Plane, a: Plane): Plane | null;
/** 反向（法线与 constant 同时取反 —— 平面本身不变，但符号约定翻过来）。 */
export declare function negate(out: Plane, a: Plane): Plane;
/** 有符号距离：法线一侧为正。 */
export declare function distanceToPoint(a: Plane, point: Vec3): number;
/** 把点投影到平面上。 */
export declare function projectPoint(out: Vec3, a: Plane, point: Vec3): Vec3;
/** 平面上离原点最近的点（`normal * -constant`）。 */
export declare function coplanarPoint(out: Vec3, a: Plane): Vec3;
/** 平移平面（点都变到 `point + offset`）：`constant -= dot(offset, normal)`。 */
export declare function translate(out: Plane, a: Plane, offset: Vec3): Plane;
/**
 * 线段与平面的交点参数：交点是 `start + t * (end - start)`，只有 `t ∈ [0, 1]` 才落在**线段**上。
 * 线段与平面平行、或交点在线段之外时返回 `null`；端点正好在平面上返回 0 / 1。
 */
export declare function intersectLineSegment(a: Plane, start: Vec3, end: Vec3): number | null;
/**
 * 用 4×4 矩阵变换平面（例如把世界空间的裁剪面搬到某个模型的局部空间）。
 *
 * 法线必须用「左上 3×3 的逆转置」变换（`mat3.normalFromMat4`），否则非等比缩放会让法线歪掉。
 * 矩阵退化（不可逆）时抛 `RangeError`：那种情况下平面的像没有意义，不该悄悄算出一个错的。
 */
export declare function applyMat4(out: Plane, a: Plane, m: Float32Array): Plane;
/** 两个平面是否表示同一个平面：法线与 constant 都接近，或整体取反后接近。 */
export declare function equals(a: Plane, b: Plane, epsilon?: number): boolean;
/** 仅用于调试：`plane(0, 1, 0, -3)` 这样的字符串。 */
export declare function toString(a: Plane): string;
//# sourceMappingURL=plane.d.ts.map