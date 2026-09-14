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

import { invert, multiply } from './mat4.js';
import {
  at,
  intersectBox as rayIntersectBox,
  intersectPlane as rayIntersectPlane,
  intersectSphere as rayIntersectSphere,
  intersectTriangle,
  set as setRay,
} from './ray.js';
import { distance, normalize, sub } from './vec3.js';
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

const INVERSE_SCRATCH: Mat4 = new Float32Array(16);
const PRODUCT_SCRATCH: Mat4 = new Float32Array(16);
const LOCAL_RAY: Ray = { origin: new Float32Array(3), direction: new Float32Array(3) };
const LOCAL_POINT = new Float32Array(3);
const EDGE_A = new Float32Array(3);
const EDGE_B = new Float32Array(3);
const EDGE_C = new Float32Array(3);
const DIRECTION_SCRATCH = new Float32Array(3);

export function create(originX = 0, originY = 0, originZ = 0, directionZ = -1): Raycaster {
  return {
    ray: { origin: new Float32Array([originX, originY, originZ]), direction: new Float32Array([0, 0, directionZ]) },
    near: 0,
    far: Number.POSITIVE_INFINITY,
    doubleSided: true,
  };
}

export function clone(a: Raycaster): Raycaster {
  return {
    ray: { origin: new Float32Array(a.ray.origin), direction: new Float32Array(a.ray.direction) },
    near: a.near,
    far: a.far,
    doubleSided: a.doubleSided,
  };
}

export function copy(out: Raycaster, a: Raycaster): Raycaster {
  setRay(out.ray, a.ray.origin, a.ray.direction);
  out.near = a.near;
  out.far = a.far;
  out.doubleSided = a.doubleSided;
  return out;
}

/** 设置射线（方向会被归一化）。 */
export function set(out: Raycaster, origin: Vec3, direction: Vec3): Raycaster {
  setRay(out.ray, origin, direction);
  return out;
}

/** 由「起点 + 目标点」设置射线：方向取两者之差。 */
export function setFromPoints(out: Raycaster, origin: Vec3, target: Vec3): Raycaster {
  return set(out, origin, sub(DIRECTION_SCRATCH, target, origin));
}

/**
 * 由**屏幕/NDC 坐标**与「投影 × 视图」的**逆矩阵**设置射线（也就是常说的 unproject）。
 *
 * `ndcX` / `ndcY` 是 [-1, 1]（y 向上，与 WebGL/WebGPU 的 NDC 一致）。
 * 近远两个裁剪面的 z 约定不同：`'gl'` 用 `-1..1`，`'zo'` 用 `0..1`，
 * 默认按 `'gl'`；WebGPU 用户传 `'zo'`（不然射线起点会落在错误的位置）。
 */
export function setFromNdc(
  out: Raycaster,
  ndcX: number,
  ndcY: number,
  inverseProjectionView: Mat4,
  depthRange: 'gl' | 'zo' = 'gl',
): Raycaster {
  const nearZ = depthRange === 'zo' ? 0 : -1;
  const farZ = 1;
  transformPoint(LOCAL_POINT, ndcX, ndcY, nearZ, inverseProjectionView);
  transformPoint(EDGE_A, ndcX, ndcY, farZ, inverseProjectionView);
  return set(out, LOCAL_POINT, sub(DIRECTION_SCRATCH, EDGE_A, LOCAL_POINT));
}

/** 齐次变换 + 透视除法（unproject 需要除以 w，所以不能直接用 `vec3.transformMat4` 的语义假设）。 */
function transformPoint(out: Vec3, x: number, y: number, z: number, m: Mat4): Vec3 {
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  const inverseW = w === 0 ? 1 : 1 / w;
  out[0] = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) * inverseW;
  out[1] = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) * inverseW;
  out[2] = (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) * inverseW;
  return out;
}

/** 与球求交：命中时返回距离，否则 `null`；同时套用 `near` / `far`。 */
export function intersectSphere(a: Raycaster, center: Vec3, radius: number): number | null {
  const t = rayIntersectSphere(a.ray, center, radius);
  return t !== null && withinRange(a, t) ? t : null;
}

/** 与轴对齐包围盒求交：命中时返回距离，否则 `null`。 */
export function intersectBox(a: Raycaster, box: Box3): number | null {
  const t = rayIntersectBox(a.ray, box);
  return t !== null && withinRange(a, t) ? t : null;
}

/** 与（无限大）平面求交：命中时返回距离，否则 `null`。 */
export function intersectPlane(a: Raycaster, plane: Plane): number | null {
  const t = rayIntersectPlane(a.ray, plane);
  return t !== null && withinRange(a, t) ? t : null;
}

function withinRange(a: Raycaster, t: number): boolean {
  return t >= a.near && t <= a.far;
}

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
export function intersectTriangles(
  a: Raycaster,
  positions: ArrayLike<number>,
  indices?: ArrayLike<number> | null,
  matrix?: Mat4 | null,
  out: RaycastHit[] = [],
): RaycastHit[] {
  out.length = 0;

  const localRay = matrix ? toLocalRay(LOCAL_RAY, a.ray, matrix) : a.ray;
  // 模型矩阵不可逆（某轴缩放为 0）时局部空间没有定义，直接判定「没有命中」。
  if (!localRay) return out;
  const vertexCount = Math.floor(positions.length / 3);
  const triangleCount = indices ? Math.floor(indices.length / 3) : Math.floor(vertexCount / 3);
  const culling = !a.doubleSided;

  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const i0 = indices ? (indices[triangle * 3] ?? 0) : triangle * 3;
    const i1 = indices ? (indices[triangle * 3 + 1] ?? 0) : triangle * 3 + 1;
    const i2 = indices ? (indices[triangle * 3 + 2] ?? 0) : triangle * 3 + 2;
    if (i0 >= vertexCount || i1 >= vertexCount || i2 >= vertexCount) continue;

    readVertex(EDGE_A, positions, i0);
    readVertex(EDGE_B, positions, i1);
    readVertex(EDGE_C, positions, i2);

    const localT = intersectTriangle(localRay, EDGE_A, EDGE_B, EDGE_C, culling);
    if (localT === null) continue;

    // 交点：局部空间算出来，再用模型矩阵变回世界空间。
    at(LOCAL_POINT, localRay, localT);
    const point = new Float32Array([LOCAL_POINT[0]!, LOCAL_POINT[1]!, LOCAL_POINT[2]!]);
    if (matrix) transformPoint(point, point[0]!, point[1]!, point[2]!, matrix);

    const worldDistance = distance(a.ray.origin, point);
    if (!withinRange(a, worldDistance)) continue;

    out.push({ distance: worldDistance, point, triangleIndex: triangle, vertexIndices: [i0, i1, i2] });
  }

  out.sort((left, right) => left.distance - right.distance);
  return out;
}

/** 只关心最近一次命中时用这个：等价于取 `intersectTriangles(...)[0]`。 */
export function intersectTrianglesFirst(
  a: Raycaster,
  positions: ArrayLike<number>,
  indices?: ArrayLike<number> | null,
  matrix?: Mat4 | null,
): RaycastHit | null {
  const hits = intersectTriangles(a, positions, indices, matrix, []);
  return hits.length > 0 ? hits[0]! : null;
}

/** 把世界空间的射线搬到模型局部空间；矩阵不可逆时返回 `null`。 */
function toLocalRay(out: Ray, worldRay: Ray, matrix: Mat4): Ray | null {
  const inverse = invert(INVERSE_SCRATCH, matrix);
  if (!inverse) return null;
  const localOrigin = transformPoint(
    new Float32Array(3),
    worldRay.origin[0]!,
    worldRay.origin[1]!,
    worldRay.origin[2]!,
    inverse,
  );
  // 方向按住进 `/w = 0` 变换（忽略平移），再归一化。
  const localDirection = transformDirection3(new Float32Array(3), worldRay.direction, inverse);
  return setRay(out, localOrigin, localDirection);
}

/** 方向变换（忽略平移），结果归一化。 */
function transformDirection3(out: Vec3, direction: Vec3, m: Mat4): Vec3 {
  const x = direction[0]!;
  const y = direction[1]!;
  const z = direction[2]!;
  out[0] = m[0]! * x + m[4]! * y + m[8]! * z;
  out[1] = m[1]! * x + m[5]! * y + m[9]! * z;
  out[2] = m[2]! * x + m[6]! * y + m[10]! * z;
  return normalize(out, out);
}

function readVertex(out: Vec3, positions: ArrayLike<number>, index: number): Vec3 {
  out[0] = positions[index * 3] ?? 0;
  out[1] = positions[index * 3 + 1] ?? 0;
  out[2] = positions[index * 3 + 2] ?? 0;
  return out;
}

/** `projection * view` 的逆矩阵（`setFromNdc` 要用）；矩阵不可逆时返回 `null`。 */
export function inverseProjectionView(out: Mat4, projectionView: Mat4): Mat4 | null {
  return invert(out, projectionView);
}

/** 便捷：由「投影矩阵 + 视图矩阵」算出 P × V 的逆。 */
export function inverseProjectionViewOf(out: Mat4, projection: Mat4, view: Mat4): Mat4 | null {
  multiply(PRODUCT_SCRATCH, projection, view);
  return invert(out, PRODUCT_SCRATCH);
}
