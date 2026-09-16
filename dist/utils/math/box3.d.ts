/**
 * 轴对齐包围盒（AABB）：`{ min, max }`，两个分量都是 `Vec3`。
 *
 * 空盒用 `min = +Infinity`、`max = -Infinity` 表示（与 three.js 一致），
 * {@link makeEmpty} 造出来、{@link isEmpty} 判断、{@link expandByPoint} 填充 ——
 * 这是「遍历一批点求包围盒」的标准流程。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 */
import type { Plane } from './plane.js';
import type { Vec3 } from './vec3.js';
export interface Box3 {
    min: Vec3;
    max: Vec3;
}
export declare function create(): Box3;
/** 空盒：`min = +Infinity`、`max = -Infinity`，任何 {@link expandByPoint} 都会替换掉它。 */
export declare function makeEmpty(out: Box3): Box3;
export declare function isEmpty(a: Box3): boolean;
export declare function clone(a: Box3): Box3;
export declare function copy(out: Box3, a: Box3): Box3;
export declare function set(out: Box3, minPoint: Vec3, maxPoint: Vec3): Box3;
/** 由中心与「尺寸（不是半尺寸）」构造。 */
export declare function setFromCenterAndSize(out: Box3, center: Vec3, size: Vec3): Box3;
/** 由一组点求包围盒；空数组会得到空盒。 */
export declare function setFromPoints(out: Box3, points: readonly Vec3[]): Box3;
/**
 * 由一段**扁平数组**求包围盒（`[x, y, z, x, y, z, …]`），例如 `shapes.createBox().position`
 * 这样的顶点数据。`stride` 是相邻顶点相隔的**分量**个数（顶点属性交织存放时可以大于 3）。
 */
export declare function setFromArray(out: Box3, array: ArrayLike<number>, stride?: number): Box3;
export declare function getCenter(out: Vec3, a: Box3): Vec3;
/** 尺寸（`max - min`）；空盒得到全 0。 */
export declare function getSize(out: Vec3, a: Box3): Vec3;
/** 能包住这个盒子的球：把球心和半径写进 `outCenter`，返回半径。空盒得到半径 -1。 */
export declare function getBoundingSphere(outCenter: Vec3, a: Box3): number;
export declare function expandByPoint(out: Box3, point: Vec3): Box3;
export declare function expandByVector(out: Box3, vector: Vec3): Box3;
export declare function expandByScalar(out: Box3, scalar: number): Box3;
export declare function containsPoint(a: Box3, point: Vec3): boolean;
export declare function containsBox(a: Box3, b: Box3): boolean;
/** 两个盒子是否相交；任意一个为空盒时为 false。 */
export declare function intersectsBox(a: Box3, b: Box3): boolean;
/** 盒子与球是否相交（用「离盒子最近的点」判断，比用外接球更紧）。 */
export declare function intersectsSphere(a: Box3, center: Vec3, radius: number): boolean;
/**
 * 盒子是否与平面相交（平面与盒子的两个极值顶点距离异号，或有一侧贴住）。
 * 注意：要判断「盒子是否在平面的某一侧之外」，请直接用 `plane.distanceToPoint`。
 */
export declare function intersectsPlane(a: Box3, plane: Plane): boolean;
/** 把点夹到盒子内（逐分量取上下界）；空盒时不动 `out`。 */
export declare function clampPoint(out: Vec3, a: Box3, point: Vec3): Vec3;
/** 点到盒子的距离；点在盒内（或盒子为空）时为 0。 */
export declare function distanceToPoint(a: Box3, point: Vec3): number;
export declare function translate(out: Box3, a: Box3, offset: Vec3): Box3;
/** 并集（两个盒子都能装下）；与空盒求并集得到另一个盒子。 */
export declare function union(out: Box3, a: Box3, b: Box3): Box3;
/** 交集；不相交时得到空盒。 */
export declare function intersect(out: Box3, a: Box3, b: Box3): Box3;
/** 用 4×4 矩阵变换包围盒：变换 8 个角点后重新求包围盒（结果仍然是轴对齐的）。 */
export declare function applyMat4(out: Box3, a: Box3, m: Float32Array): Box3;
/** 缩放（绕原点）：`min * s`、`max * s`；`s` 为负时 min/max 会自动交换回正确顺序。 */
export declare function scaleBox(out: Box3, a: Box3, scalar: number): Box3;
export declare function equals(a: Box3, b: Box3, epsilon?: number): boolean;
/** 仅用于调试。 */
export declare function toString(a: Box3): string;
//# sourceMappingURL=box3.d.ts.map