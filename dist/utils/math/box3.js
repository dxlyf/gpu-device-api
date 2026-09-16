/**
 * 轴对齐包围盒（AABB）：`{ min, max }`，两个分量都是 `Vec3`。
 *
 * 空盒用 `min = +Infinity`、`max = -Infinity` 表示（与 three.js 一致），
 * {@link makeEmpty} 造出来、{@link isEmpty} 判断、{@link expandByPoint} 填充 ——
 * 这是「遍历一批点求包围盒」的标准流程。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 */
import { add, max, min, scale, squaredDistance, sub } from './vec3.js';
import { distanceToPoint as planeDistanceToPoint } from './plane.js';
const CORNER_SCRATCH = new Float32Array(3);
export function create() {
    return makeEmpty({ min: new Float32Array(3), max: new Float32Array(3) });
}
/** 空盒：`min = +Infinity`、`max = -Infinity`，任何 {@link expandByPoint} 都会替换掉它。 */
export function makeEmpty(out) {
    out.min[0] = Number.POSITIVE_INFINITY;
    out.min[1] = Number.POSITIVE_INFINITY;
    out.min[2] = Number.POSITIVE_INFINITY;
    out.max[0] = Number.NEGATIVE_INFINITY;
    out.max[1] = Number.NEGATIVE_INFINITY;
    out.max[2] = Number.NEGATIVE_INFINITY;
    return out;
}
export function isEmpty(a) {
    return a.max[0] < a.min[0] || a.max[1] < a.min[1] || a.max[2] < a.min[2];
}
export function clone(a) {
    return {
        min: new Float32Array([a.min[0], a.min[1], a.min[2]]),
        max: new Float32Array([a.max[0], a.max[1], a.max[2]]),
    };
}
export function copy(out, a) {
    out.min[0] = a.min[0];
    out.min[1] = a.min[1];
    out.min[2] = a.min[2];
    out.max[0] = a.max[0];
    out.max[1] = a.max[1];
    out.max[2] = a.max[2];
    return out;
}
export function set(out, minPoint, maxPoint) {
    out.min[0] = minPoint[0];
    out.min[1] = minPoint[1];
    out.min[2] = minPoint[2];
    out.max[0] = maxPoint[0];
    out.max[1] = maxPoint[1];
    out.max[2] = maxPoint[2];
    return out;
}
/** 由中心与「尺寸（不是半尺寸）」构造。 */
export function setFromCenterAndSize(out, center, size) {
    const halfX = size[0] * 0.5;
    const halfY = size[1] * 0.5;
    const halfZ = size[2] * 0.5;
    out.min[0] = center[0] - halfX;
    out.min[1] = center[1] - halfY;
    out.min[2] = center[2] - halfZ;
    out.max[0] = center[0] + halfX;
    out.max[1] = center[1] + halfY;
    out.max[2] = center[2] + halfZ;
    return out;
}
/** 由一组点求包围盒；空数组会得到空盒。 */
export function setFromPoints(out, points) {
    makeEmpty(out);
    for (const point of points)
        expandByPoint(out, point);
    return out;
}
/**
 * 由一段**扁平数组**求包围盒（`[x, y, z, x, y, z, …]`），例如 `shapes.createBox().position`
 * 这样的顶点数据。`stride` 是相邻顶点相隔的**分量**个数（顶点属性交织存放时可以大于 3）。
 */
export function setFromArray(out, array, stride = 3) {
    makeEmpty(out);
    const step = Math.max(1, Math.trunc(stride));
    for (let i = 0; i + 2 < array.length; i += step) {
        out.min[0] = Math.min(out.min[0], array[i]);
        out.min[1] = Math.min(out.min[1], array[i + 1]);
        out.min[2] = Math.min(out.min[2], array[i + 2]);
        out.max[0] = Math.max(out.max[0], array[i]);
        out.max[1] = Math.max(out.max[1], array[i + 1]);
        out.max[2] = Math.max(out.max[2], array[i + 2]);
    }
    return out;
}
export function getCenter(out, a) {
    if (isEmpty(a))
        return out;
    out[0] = (a.min[0] + a.max[0]) * 0.5;
    out[1] = (a.min[1] + a.max[1]) * 0.5;
    out[2] = (a.min[2] + a.max[2]) * 0.5;
    return out;
}
/** 尺寸（`max - min`）；空盒得到全 0。 */
export function getSize(out, a) {
    if (isEmpty(a)) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        return out;
    }
    return sub(out, a.max, a.min);
}
/** 能包住这个盒子的球：把球心和半径写进 `outCenter`，返回半径。空盒得到半径 -1。 */
export function getBoundingSphere(outCenter, a) {
    if (isEmpty(a)) {
        outCenter[0] = 0;
        outCenter[1] = 0;
        outCenter[2] = 0;
        return -1;
    }
    getCenter(outCenter, a);
    return Math.hypot(a.max[0] - outCenter[0], a.max[1] - outCenter[1], a.max[2] - outCenter[2]);
}
export function expandByPoint(out, point) {
    min(out.min, out.min, point);
    max(out.max, out.max, point);
    return out;
}
export function expandByVector(out, vector) {
    add(out.min, out.min, vector);
    add(out.max, out.max, vector);
    return out;
}
export function expandByScalar(out, scalar) {
    out.min[0] = out.min[0] - scalar;
    out.min[1] = out.min[1] - scalar;
    out.min[2] = out.min[2] - scalar;
    out.max[0] = out.max[0] + scalar;
    out.max[1] = out.max[1] + scalar;
    out.max[2] = out.max[2] + scalar;
    return out;
}
export function containsPoint(a, point) {
    return (point[0] >= a.min[0] &&
        point[0] <= a.max[0] &&
        point[1] >= a.min[1] &&
        point[1] <= a.max[1] &&
        point[2] >= a.min[2] &&
        point[2] <= a.max[2]);
}
export function containsBox(a, b) {
    return (a.min[0] <= b.min[0] &&
        b.max[0] <= a.max[0] &&
        a.min[1] <= b.min[1] &&
        b.max[1] <= a.max[1] &&
        a.min[2] <= b.min[2] &&
        b.max[2] <= a.max[2]);
}
/** 两个盒子是否相交；任意一个为空盒时为 false。 */
export function intersectsBox(a, b) {
    if (isEmpty(a) || isEmpty(b))
        return false;
    return (b.max[0] >= a.min[0] &&
        b.min[0] <= a.max[0] &&
        b.max[1] >= a.min[1] &&
        b.min[1] <= a.max[1] &&
        b.max[2] >= a.min[2] &&
        b.min[2] <= a.max[2]);
}
/** 盒子与球是否相交（用「离盒子最近的点」判断，比用外接球更紧）。 */
export function intersectsSphere(a, center, radius) {
    if (isEmpty(a))
        return false;
    return squaredDistance(clampPoint(CORNER_SCRATCH, a, center), center) <= radius * radius;
}
/**
 * 盒子是否与平面相交（平面与盒子的两个极值顶点距离异号，或有一侧贴住）。
 * 注意：要判断「盒子是否在平面的某一侧之外」，请直接用 `plane.distanceToPoint`。
 */
export function intersectsPlane(a, plane) {
    if (isEmpty(a))
        return false;
    let minDistance = Number.POSITIVE_INFINITY;
    let maxDistance = Number.NEGATIVE_INFINITY;
    for (let corner = 0; corner < 8; corner++) {
        CORNER_SCRATCH[0] = corner & 1 ? a.max[0] : a.min[0];
        CORNER_SCRATCH[1] = corner & 2 ? a.max[1] : a.min[1];
        CORNER_SCRATCH[2] = corner & 4 ? a.max[2] : a.min[2];
        const distance = planeDistanceToPoint(plane, CORNER_SCRATCH);
        minDistance = Math.min(minDistance, distance);
        maxDistance = Math.max(maxDistance, distance);
    }
    return minDistance <= 0 && maxDistance >= 0;
}
/** 把点夹到盒子内（逐分量取上下界）；空盒时不动 `out`。 */
export function clampPoint(out, a, point) {
    if (isEmpty(a))
        return out;
    out[0] = Math.min(Math.max(point[0], a.min[0]), a.max[0]);
    out[1] = Math.min(Math.max(point[1], a.min[1]), a.max[1]);
    out[2] = Math.min(Math.max(point[2], a.min[2]), a.max[2]);
    return out;
}
/** 点到盒子的距离；点在盒内（或盒子为空）时为 0。 */
export function distanceToPoint(a, point) {
    if (isEmpty(a))
        return 0;
    return Math.sqrt(squaredDistance(clampPoint(CORNER_SCRATCH, a, point), point));
}
export function translate(out, a, offset) {
    copy(out, a);
    add(out.min, out.min, offset);
    add(out.max, out.max, offset);
    return out;
}
/** 并集（两个盒子都能装下）；与空盒求并集得到另一个盒子。 */
export function union(out, a, b) {
    if (isEmpty(a))
        return copy(out, b);
    if (isEmpty(b))
        return copy(out, a);
    min(out.min, a.min, b.min);
    max(out.max, a.max, b.max);
    return out;
}
/** 交集；不相交时得到空盒。 */
export function intersect(out, a, b) {
    if (!intersectsBox(a, b))
        return makeEmpty(out);
    max(out.min, a.min, b.min);
    min(out.max, a.max, b.max);
    return out;
}
/** 用 4×4 矩阵变换包围盒：变换 8 个角点后重新求包围盒（结果仍然是轴对齐的）。 */
export function applyMat4(out, a, m) {
    if (isEmpty(a))
        return makeEmpty(out);
    // 先把输入读进局部变量：`out` 允许就是 `a` 本身。
    const minX = a.min[0];
    const minY = a.min[1];
    const minZ = a.min[2];
    const maxX = a.max[0];
    const maxY = a.max[1];
    const maxZ = a.max[2];
    makeEmpty(out);
    for (let corner = 0; corner < 8; corner++) {
        const x = corner & 1 ? maxX : minX;
        const y = corner & 2 ? maxY : minY;
        const z = corner & 4 ? maxZ : minZ;
        const w = m[3] * x + m[7] * y + m[11] * z + m[15];
        const inverseW = w === 0 ? 1 : 1 / w;
        CORNER_SCRATCH[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) * inverseW;
        CORNER_SCRATCH[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) * inverseW;
        CORNER_SCRATCH[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) * inverseW;
        expandByPoint(out, CORNER_SCRATCH);
    }
    return out;
}
/** 缩放（绕原点）：`min * s`、`max * s`；`s` 为负时 min/max 会自动交换回正确顺序。 */
export function scaleBox(out, a, scalar) {
    scale(out.min, a.min, scalar);
    scale(out.max, a.max, scalar);
    if (scalar < 0) {
        const swappedX = out.min[0];
        const swappedY = out.min[1];
        const swappedZ = out.min[2];
        out.min[0] = out.max[0];
        out.min[1] = out.max[1];
        out.min[2] = out.max[2];
        out.max[0] = swappedX;
        out.max[1] = swappedY;
        out.max[2] = swappedZ;
    }
    return out;
}
export function equals(a, b, epsilon = 1e-6) {
    const emptyA = isEmpty(a);
    const emptyB = isEmpty(b);
    if (emptyA || emptyB)
        return emptyA === emptyB;
    return (Math.abs(a.min[0] - b.min[0]) <= epsilon &&
        Math.abs(a.min[1] - b.min[1]) <= epsilon &&
        Math.abs(a.min[2] - b.min[2]) <= epsilon &&
        Math.abs(a.max[0] - b.max[0]) <= epsilon &&
        Math.abs(a.max[1] - b.max[1]) <= epsilon &&
        Math.abs(a.max[2] - b.max[2]) <= epsilon);
}
/** 仅用于调试。 */
export function toString(a) {
    if (isEmpty(a))
        return 'box3(empty)';
    return `box3(${a.min[0]}, ${a.min[1]}, ${a.min[2]}) - (${a.max[0]}, ${a.max[1]}, ${a.max[2]})`;
}
//# sourceMappingURL=box3.js.map