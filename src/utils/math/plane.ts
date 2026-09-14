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

import { normalFromMat4 } from './mat3.js';
import { cross, dot, transformMat3, transformMat4 } from './vec3.js';
import type { Vec3 } from './vec3.js';

export interface Plane {
  normal: Vec3;
  constant: number;
}

/** 三点共线 / 法线长度小于它时认为输入退化。 */
const DEGENERATE_LENGTH = 1e-12;

const POINT_SCRATCH = new Float32Array(3);
const MAT3_SCRATCH = new Float32Array(9);

export function create(normalX = 0, normalY = 0, normalZ = 1, constant = 0): Plane {
  return { normal: new Float32Array([normalX, normalY, normalZ]), constant };
}

export function clone(a: Plane): Plane {
  return { normal: new Float32Array([a.normal[0]!, a.normal[1]!, a.normal[2]!]), constant: a.constant };
}

export function copy(out: Plane, a: Plane): Plane {
  out.normal[0] = a.normal[0]!;
  out.normal[1] = a.normal[1]!;
  out.normal[2] = a.normal[2]!;
  out.constant = a.constant;
  return out;
}

/** 直接给「法线 + constant」。法线不会被归一化，需要时请用 {@link setFromNormalAndCoplanarPoint}。 */
export function set(out: Plane, normal: Vec3, constant: number): Plane {
  out.normal[0] = normal[0]!;
  out.normal[1] = normal[1]!;
  out.normal[2] = normal[2]!;
  out.constant = constant;
  return out;
}

export function setComponents(out: Plane, x: number, y: number, z: number, constant: number): Plane {
  out.normal[0] = x;
  out.normal[1] = y;
  out.normal[2] = z;
  out.constant = constant;
  return out;
}

/** 由「法线（会被归一化）+ 平面上的一个点」构造：`constant = -dot(normal, point)`。 */
export function setFromNormalAndCoplanarPoint(out: Plane, normal: Vec3, point: Vec3): Plane {
  const length = Math.hypot(normal[0]!, normal[1]!, normal[2]!);
  const inverseLength = length < DEGENERATE_LENGTH ? 1 : 1 / length;
  out.normal[0] = normal[0]! * inverseLength;
  out.normal[1] = normal[1]! * inverseLength;
  out.normal[2] = normal[2]! * inverseLength;
  out.constant = -dot(out.normal, point);
  return out;
}

/**
 * 由三个不共线的点构造：法线取 `(b - a) × (c - a)`（所以 a → b → c 逆时针时法线朝向观察者）。
 * 三点共线时法线长度为 0，返回 `null`。
 */
export function setFromCoplanarPoints(out: Plane, a: Vec3, b: Vec3, c: Vec3): Plane | null {
  const ab = new Float32Array([b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!]);
  const ac = new Float32Array([c[0]! - a[0]!, c[1]! - a[1]!, c[2]! - a[2]!]);
  cross(out.normal, ab, ac);
  const length = Math.hypot(out.normal[0]!, out.normal[1]!, out.normal[2]!);
  if (length < DEGENERATE_LENGTH) return null;
  out.normal[0] = out.normal[0]! / length;
  out.normal[1] = out.normal[1]! / length;
  out.normal[2] = out.normal[2]! / length;
  out.constant = -dot(out.normal, a);
  return out;
}

/** 归一化（`constant` 同步按比例缩放）；法线长度为 0 时返回 `null`。 */
export function normalize(out: Plane, a: Plane): Plane | null {
  const length = Math.hypot(a.normal[0]!, a.normal[1]!, a.normal[2]!);
  if (length < DEGENERATE_LENGTH) return null;
  const inverseLength = 1 / length;
  out.normal[0] = a.normal[0]! * inverseLength;
  out.normal[1] = a.normal[1]! * inverseLength;
  out.normal[2] = a.normal[2]! * inverseLength;
  out.constant = a.constant * inverseLength;
  return out;
}

/** 反向（法线与 constant 同时取反 —— 平面本身不变，但符号约定翻过来）。 */
export function negate(out: Plane, a: Plane): Plane {
  out.normal[0] = -a.normal[0]!;
  out.normal[1] = -a.normal[1]!;
  out.normal[2] = -a.normal[2]!;
  out.constant = -a.constant;
  return out;
}

/** 有符号距离：法线一侧为正。 */
export function distanceToPoint(a: Plane, point: Vec3): number {
  return dot(a.normal, point) + a.constant;
}

/** 把点投影到平面上。 */
export function projectPoint(out: Vec3, a: Plane, point: Vec3): Vec3 {
  const distance = distanceToPoint(a, point);
  out[0] = point[0]! - a.normal[0]! * distance;
  out[1] = point[1]! - a.normal[1]! * distance;
  out[2] = point[2]! - a.normal[2]! * distance;
  return out;
}

/** 平面上离原点最近的点（`normal * -constant`）。 */
export function coplanarPoint(out: Vec3, a: Plane): Vec3 {
  out[0] = a.normal[0]! * -a.constant;
  out[1] = a.normal[1]! * -a.constant;
  out[2] = a.normal[2]! * -a.constant;
  return out;
}

/** 平移平面（点都变到 `point + offset`）：`constant -= dot(offset, normal)`。 */
export function translate(out: Plane, a: Plane, offset: Vec3): Plane {
  copy(out, a);
  out.constant -= dot(offset, a.normal);
  return out;
}

/**
 * 线段与平面的交点参数：交点是 `start + t * (end - start)`，只有 `t ∈ [0, 1]` 才落在**线段**上。
 * 线段与平面平行、或交点在线段之外时返回 `null`；端点正好在平面上返回 0 / 1。
 */
export function intersectLineSegment(a: Plane, start: Vec3, end: Vec3): number | null {
  const startDistance = distanceToPoint(a, start);
  const endDistance = distanceToPoint(a, end);
  if (startDistance === 0) return 0;
  if (endDistance === 0) return 1;
  if (startDistance > 0 === endDistance > 0) return null;
  return startDistance / (startDistance - endDistance);
}

/**
 * 用 4×4 矩阵变换平面（例如把世界空间的裁剪面搬到某个模型的局部空间）。
 *
 * 法线必须用「左上 3×3 的逆转置」变换（`mat3.normalFromMat4`），否则非等比缩放会让法线歪掉。
 * 矩阵退化（不可逆）时抛 `RangeError`：那种情况下平面的像没有意义，不该悄悄算出一个错的。
 */
export function applyMat4(out: Plane, a: Plane, m: Float32Array): Plane {
  const normalMatrix = normalFromMat4(MAT3_SCRATCH, m);
  if (!normalMatrix) {
    throw new RangeError(
      '[gpu-device-api] plane.applyMat4: the matrix is singular, so the transformed plane is undefined.',
    );
  }
  // 先取平面上的一点，用完整矩阵变换（含平移与透视除法），再由新法线与新点重建 constant。
  coplanarPoint(POINT_SCRATCH, a);
  transformMat4(POINT_SCRATCH, POINT_SCRATCH, m);
  transformMat3(out.normal, a.normal, normalMatrix);

  const length = Math.hypot(out.normal[0]!, out.normal[1]!, out.normal[2]!);
  if (length < DEGENERATE_LENGTH) {
    throw new RangeError(
      '[gpu-device-api] plane.applyMat4: the transformed normal is degenerate (the matrix collapses the plane).',
    );
  }
  out.normal[0] = out.normal[0]! / length;
  out.normal[1] = out.normal[1]! / length;
  out.normal[2] = out.normal[2]! / length;
  out.constant = -dot(out.normal, POINT_SCRATCH);
  return out;
}

/** 两个平面是否表示同一个平面：法线与 constant 都接近，或整体取反后接近。 */
export function equals(a: Plane, b: Plane, epsilon = 1e-6): boolean {
  const same =
    Math.abs(a.normal[0]! - b.normal[0]!) <= epsilon &&
    Math.abs(a.normal[1]! - b.normal[1]!) <= epsilon &&
    Math.abs(a.normal[2]! - b.normal[2]!) <= epsilon &&
    Math.abs(a.constant - b.constant) <= epsilon;
  const flipped =
    Math.abs(a.normal[0]! + b.normal[0]!) <= epsilon &&
    Math.abs(a.normal[1]! + b.normal[1]!) <= epsilon &&
    Math.abs(a.normal[2]! + b.normal[2]!) <= epsilon &&
    Math.abs(a.constant + b.constant) <= epsilon;
  return same || flipped;
}

/** 仅用于调试：`plane(0, 1, 0, -3)` 这样的字符串。 */
export function toString(a: Plane): string {
  return `plane(${a.normal[0]}, ${a.normal[1]}, ${a.normal[2]}, ${a.constant})`;
}
