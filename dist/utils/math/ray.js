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
import { dot, squaredDistance, squaredLength, sub, transformDirection, transformMat4 } from './vec3.js';
import { isEmpty as isEmptyBox } from './box3.js';
import { distanceToPoint as planeDistanceToPoint } from './plane.js';
export function create(originX = 0, originY = 0, originZ = 0, directionX = 0, directionY = 0, directionZ = -1) {
    return {
        origin: new Float32Array([originX, originY, originZ]),
        direction: new Float32Array([directionX, directionY, directionZ]),
    };
}
export function clone(a) {
    return {
        origin: new Float32Array([a.origin[0], a.origin[1], a.origin[2]]),
        direction: new Float32Array([a.direction[0], a.direction[1], a.direction[2]]),
    };
}
export function copy(out, a) {
    out.origin[0] = a.origin[0];
    out.origin[1] = a.origin[1];
    out.origin[2] = a.origin[2];
    out.direction[0] = a.direction[0];
    out.direction[1] = a.direction[1];
    out.direction[2] = a.direction[2];
    return out;
}
/** 设置起点与方向；`direction` 会被归一化（零向量则保持原样，避免 NaN）。 */
export function set(out, origin, direction) {
    out.origin[0] = origin[0];
    out.origin[1] = origin[1];
    out.origin[2] = origin[2];
    const length = Math.hypot(direction[0], direction[1], direction[2]);
    const inverseLength = length > 1e-12 ? 1 / length : 1;
    out.direction[0] = direction[0] * inverseLength;
    out.direction[1] = direction[1] * inverseLength;
    out.direction[2] = direction[2] * inverseLength;
    return out;
}
/** 射线上的点：`origin + direction * t`（`t` 允许为负，表示反向延长线）。 */
export function at(out, a, t) {
    out[0] = a.origin[0] + a.direction[0] * t;
    out[1] = a.origin[1] + a.direction[1] * t;
    out[2] = a.origin[2] + a.direction[2] * t;
    return out;
}
/** 把起点沿方向推进 `t`，方向不变（例如射线打在某个面上后从该点继续）。 */
export function recast(out, a, t) {
    const ox = a.origin[0];
    const oy = a.origin[1];
    const oz = a.origin[2];
    out.direction[0] = a.direction[0];
    out.direction[1] = a.direction[1];
    out.direction[2] = a.direction[2];
    out.origin[0] = ox + out.direction[0] * t;
    out.origin[1] = oy + out.direction[1] * t;
    out.origin[2] = oz + out.direction[2] * t;
    return out;
}
/** 点到射线上最近的点（`t < 0` 时夹到起点）。 */
export function closestPointToPoint(out, a, point) {
    const t = Math.max(0, dot(sub(TEMP, point, a.origin), a.direction));
    return at(out, a, t);
}
/** 点到射线的距离（垂直距离，不是沿射线的参数）。 */
export function distanceToPoint(a, point) {
    return Math.sqrt(squaredDistanceToPoint(a, point));
}
/** 点到射线距离的平方。 */
export function squaredDistanceToPoint(a, point) {
    return squaredDistance(point, closestPointToPoint(TEMP, a, point));
}
const TEMP = new Float32Array(3);
/**
 * 用 4×4 矩阵变换射线：起点按点变换（含平移与透视除法），方向按方向变换（忽略平移）后重新归一化。
 * 这是「把世界空间的射线搬到模型局部空间」的标准做法。
 */
export function applyMat4(out, a, m) {
    transformMat4(out.origin, a.origin, m);
    transformDirection(out.direction, a.direction, m);
    const length = Math.hypot(out.direction[0], out.direction[1], out.direction[2]);
    const inverseLength = length > 1e-12 ? 1 / length : 1;
    out.direction[0] = out.direction[0] * inverseLength;
    out.direction[1] = out.direction[1] * inverseLength;
    out.direction[2] = out.direction[2] * inverseLength;
    return out;
}
/**
 * 与平面求交，返回 `t`（`t >= 0`）。射线与平面平行时返回 `null`
 *（射线落在平面上属于退化情形，也按 null 处理，避免无数组解）。
 */
export function intersectPlane(a, plane) {
    const denominator = dot(plane.normal, a.direction);
    if (Math.abs(denominator) < 1e-12)
        return null;
    const t = -planeDistanceToPoint(plane, a.origin) / denominator;
    return t >= 0 ? t : null;
}
/** 与球求交，返回最近的 `t`（射线起点在球内时返回出射的 `t`）。 */
export function intersectSphere(a, center, radius) {
    const ox = a.origin[0] - center[0];
    const oy = a.origin[1] - center[1];
    const oz = a.origin[2] - center[2];
    const dx = a.direction[0];
    const dy = a.direction[1];
    const dz = a.direction[2];
    const b = ox * dx + oy * dy + oz * dz;
    const c = ox * ox + oy * oy + oz * oz - radius * radius;
    const discriminant = b * b - c;
    if (discriminant < 0)
        return null;
    const root = Math.sqrt(discriminant);
    const near = -b - root;
    if (near >= 0)
        return near;
    const far = -b + root;
    return far >= 0 ? far : null;
}
/**
 * 与轴对齐包围盒求交（slab 法），返回进入盒子的 `t`。
 * 射线起点已经在盒内时返回 0；完全不相交、或盒子为空时返回 `null`。
 */
export function intersectBox(a, box) {
    if (isEmptyBox(box))
        return null;
    let tMin = 0;
    let tMax = Number.POSITIVE_INFINITY;
    for (let axis = 0; axis < 3; axis++) {
        const origin = a.origin[axis];
        const direction = a.direction[axis];
        const min = box.min[axis];
        const max = box.max[axis];
        if (Math.abs(direction) < 1e-12) {
            // 该轴上不移动：起点必须落在区间内，否则永远进不去。
            if (origin < min || origin > max)
                return null;
            continue;
        }
        const inverse = 1 / direction;
        let near = (min - origin) * inverse;
        let far = (max - origin) * inverse;
        if (near > far) {
            const swap = near;
            near = far;
            far = swap;
        }
        if (near > tMin)
            tMin = near;
        if (far < tMax)
            tMax = far;
        if (tMin > tMax)
            return null;
    }
    return Number.isFinite(tMax) ? tMin : null;
}
/**
 * 与三角形求交（Möller–Trumbore），返回 `t`。
 * `backfaceCulling` 为 true 时只接受正面（a → b → c 逆时针）命中，默认双面。
 */
export function intersectTriangle(a, v0, v1, v2, backfaceCulling = false) {
    const edge1x = v1[0] - v0[0];
    const edge1y = v1[1] - v0[1];
    const edge1z = v1[2] - v0[2];
    const edge2x = v2[0] - v0[0];
    const edge2y = v2[1] - v0[1];
    const edge2z = v2[2] - v0[2];
    const dx = a.direction[0];
    const dy = a.direction[1];
    const dz = a.direction[2];
    // p = direction × edge2
    const px = dy * edge2z - dz * edge2y;
    const py = dz * edge2x - dx * edge2z;
    const pz = dx * edge2y - dy * edge2x;
    const determinant = edge1x * px + edge1y * py + edge1z * pz;
    if (backfaceCulling ? determinant < 1e-12 : Math.abs(determinant) < 1e-12)
        return null;
    const inverseDeterminant = 1 / determinant;
    // u：重心坐标之一
    const tx = a.origin[0] - v0[0];
    const ty = a.origin[1] - v0[1];
    const tz = a.origin[2] - v0[2];
    const u = (tx * px + ty * py + tz * pz) * inverseDeterminant;
    if (u < 0 || u > 1)
        return null;
    // q = t × edge1
    const qx = ty * edge1z - tz * edge1y;
    const qy = tz * edge1x - tx * edge1z;
    const qz = tx * edge1y - ty * edge1x;
    const v = (dx * qx + dy * qy + dz * qz) * inverseDeterminant;
    if (v < 0 || u + v > 1)
        return null;
    const t = (edge2x * qx + edge2y * qy + edge2z * qz) * inverseDeterminant;
    return t >= 0 ? t : null;
}
/** 起点与方向都接近才算相等。 */
export function equals(a, b, epsilon = 1e-6) {
    return (Math.abs(a.origin[0] - b.origin[0]) <= epsilon &&
        Math.abs(a.origin[1] - b.origin[1]) <= epsilon &&
        Math.abs(a.origin[2] - b.origin[2]) <= epsilon &&
        Math.abs(a.direction[0] - b.direction[0]) <= epsilon &&
        Math.abs(a.direction[1] - b.direction[1]) <= epsilon &&
        Math.abs(a.direction[2] - b.direction[2]) <= epsilon);
}
/** 仅用于调试。 */
export function toString(a) {
    return `ray(origin: ${a.origin[0]}, ${a.origin[1]}, ${a.origin[2]}; direction: ${a.direction[0]}, ${a.direction[1]}, ${a.direction[2]})`;
}
/** 起点与方向是否都是有限值、且方向非零。拿外部输入构造射线前可以先过一遍。 */
export function isWellFormed(a) {
    return (Number.isFinite(a.origin[0]) &&
        Number.isFinite(a.origin[1]) &&
        Number.isFinite(a.origin[2]) &&
        Number.isFinite(a.direction[0]) &&
        Number.isFinite(a.direction[1]) &&
        Number.isFinite(a.direction[2]) &&
        squaredLength(a.direction) > 1e-24);
}
//# sourceMappingURL=ray.js.map