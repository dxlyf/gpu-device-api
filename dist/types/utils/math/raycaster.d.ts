/**
 * 射线拾取器（raycaster）：拿相机/屏幕坐标生成一条射线，再和几何体求交。
 *
 * 它的定位是**纯数学工具**：只认顶点数据（`positions` + 可选 `indices`）与一个模型矩阵，
 * 不认识 `gfx` 的 `Geometry`、也不认识场景树 —— 这个库里没有 `Object3D`，
 * 上层拿到 CPU 侧的顶点数据（例如 `shapes.createBox().position`）就能直接用它做点选。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 * `intersectTriangles` 会按距离升序返回命中列表（最近的在前），每条命中都带世界空间的交点。
 */
import type { Box3 } from './box3.js';
import type { Mat4 } from './mat4.js';
import type { Plane } from './plane.js';
import type { Ray } from './ray.js';
import type { Vec3 } from './vec3.js';
/** 一次命中。 */
export interface RaycastHit {
    /** 沿射线方向的距离（世界空间，≥ 0）。 */
    readonly distance: number;
    /** 世界空间的交点。 */
    readonly point: Vec3;
    /** 命中的三角形序号（`indices` 未提供时按顶点顺序每 3 个一组）。 */
    readonly triangleIndex: number;
    /** 三角形的三个顶点下标（顶点缓冲里的下标）。 */
    readonly vertexIndices: readonly [number, number, number];
}
export interface Raycaster {
    readonly ray: Ray;
    /** 只看这段距离内的命中（沿射线的距离）。 */
    near: number;
    far: number;
    /** 为 false 时只接受正面（三角形 a → b → c 的逆时针一侧）命中。 */
    doubleSided: boolean;
}
export declare function create(originX?: number, originY?: number, originZ?: number, directionZ?: number): Raycaster;
export declare function clone(a: Raycaster): Raycaster;
export declare function copy(out: Raycaster, a: Raycaster): Raycaster;
/** 设置射线（方向会被归一化）。 */
export declare function set(out: Raycaster, origin: Vec3, direction: Vec3): Raycaster;
/** 由「起点 + 目标点」设置射线：方向取两者之差。 */
export declare function setFromPoints(out: Raycaster, origin: Vec3, target: Vec3): Raycaster;
/**
 * 由**屏幕/NDC 坐标**与「投影 × 视图」的**逆矩阵**设置射线（也就是常说的 unproject）。
 *
 * `ndcX` / `ndcY` 是 [-1, 1]（y 向上，与 WebGL/WebGPU 的 NDC 一致）。
 * 近远两个裁剪面的 z 约定不同：`'gl'` 用 `-1..1`，`'zo'` 用 `0..1`，
 * 默认按 `'gl'`；WebGPU 用户传 `'zo'`（不然射线起点会落在错误的位置）。
 */
export declare function setFromNdc(out: Raycaster, ndcX: number, ndcY: number, inverseProjectionView: Mat4, depthRange?: 'gl' | 'zo'): Raycaster;
/** 与球求交：命中时返回距离，否则 `null`；同时套用 `near` / `far`。 */
export declare function intersectSphere(a: Raycaster, center: Vec3, radius: number): number | null;
/** 与轴对齐包围盒求交：命中时返回距离，否则 `null`。 */
export declare function intersectBox(a: Raycaster, box: Box3): number | null;
/** 与（无限大）平面求交：命中时返回距离，否则 `null`。 */
export declare function intersectPlane(a: Raycaster, plane: Plane): number | null;
/**
 * 与一堆三角形求交（三角形汤）。返回**按距离升序**排列的命中列表。
 *
 * - `positions` 是扁平的顶点位置（`[x, y, z, …]`），`indices` 省略时按「每 3 个顶点一个三角形」处理；
 * - `matrix` 是模型矩阵（省略即单位矩阵）：内部把射线搬进局部空间求交，再把交点变换回世界空间，
 *   所以 `distance` 与 `point` 都是**世界空间**的（不会像某些实现那样返回局部空间的长度）；
 * - `out` 传入数组时会先被清空再填充（便于复用），命中少时返回的数组就是它本身。
 *
 * 每次命中会分配一个交点 `Vec3`；拾取不是热路径，这里优先保证语义清晰。
 */
export declare function intersectTriangles(a: Raycaster, positions: ArrayLike<number>, indices?: ArrayLike<number> | null, matrix?: Mat4 | null, out?: RaycastHit[]): RaycastHit[];
/** 只关心最近一次命中时用这个：等价于取 `intersectTriangles(...)[0]`。 */
export declare function intersectTrianglesFirst(a: Raycaster, positions: ArrayLike<number>, indices?: ArrayLike<number> | null, matrix?: Mat4 | null): RaycastHit | null;
/** `projection * view` 的逆矩阵（`setFromNdc` 要用）；矩阵不可逆时返回 `null`。 */
export declare function inverseProjectionView(out: Mat4, projectionView: Mat4): Mat4 | null;
/** 便捷：由「投影矩阵 + 视图矩阵」算出 P × V 的逆。 */
export declare function inverseProjectionViewOf(out: Mat4, projection: Mat4, view: Mat4): Mat4 | null;
//# sourceMappingURL=raycaster.d.ts.map