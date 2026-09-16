/**
 * 视锥体：由 6 个平面组成的凸体，用来做**视锥剔除**（把镜头外的物体整批丢掉）。
 *
 * 平面顺序固定为 `[left, right, bottom, top, near, far]`，法线都朝**视锥体内侧**，
 * 因此「在视锥体内」就是「到 6 个平面的有符号距离都 ≥ 0」。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 * 这里的判定是**保守**的：可能把「其实在外面」的物体判为可见，但绝不会把可见的判为不可见，
 * 所以拿它做剔除是安全的。
 */
import { copy as copyPlane, create as createPlane, distanceToPoint as planeDistanceToPoint, equals as planeEquals, normalize as normalizePlane, setComponents as setPlaneComponents, } from './plane.js';
/** 六个面的下标，避免调用方记数字。 */
export const FRUSTUM_PLANE = {
    Left: 0,
    Right: 1,
    Bottom: 2,
    Top: 3,
    Near: 4,
    Far: 5,
};
export function create() {
    return {
        planes: [
            createPlane(),
            createPlane(),
            createPlane(),
            createPlane(),
            createPlane(),
            createPlane(),
        ],
    };
}
export function clone(a) {
    const out = create();
    return copy(out, a);
}
export function copy(out, a) {
    for (let i = 0; i < 6; i++)
        copyPlane(out.planes[i], a.planes[i]);
    return out;
}
/**
 * 从「投影 × 视图」矩阵（也就是 `mat4.multiply(projectionView, projection, view)` 的结果）
 * 提取 6 个世界空间的裁剪面。
 *
 * `depthRange` 决定近裁剪面的取法：`'gl'` 对应裁剪空间 z ∈ [-1, 1]（WebGL2），
 * `'zo'` 对应 z ∈ [0, 1]（WebGPU / D3D / Vulkan）—— 两者的近平面不同，选错会让近处的物体被误剔除。
 * 传入的必须是 P × V（世界空间），只传投影矩阵得到的是**视图空间**的锥体，方向会更正。
 */
export function setFromProjectionView(out, m, depthRange = 'gl') {
    // 列主序：第 r 行第 c 列 = m[c * 4 + r]。平面由「行 3 ± 行 i」得到（Gribb–Hartmann）。
    const row0 = [m[0], m[4], m[8], m[12]];
    const row1 = [m[1], m[5], m[9], m[13]];
    const row2 = [m[2], m[6], m[10], m[14]];
    const row3 = [m[3], m[7], m[11], m[15]];
    const combined = (a, b, sign) => [
        a[0] + sign * b[0],
        a[1] + sign * b[1],
        a[2] + sign * b[2],
        a[3] + sign * b[3],
    ];
    const planes = [
        combined(row3, row0, 1), // left：row3 + row0
        combined(row3, row0, -1), // right
        combined(row3, row1, 1), // bottom
        combined(row3, row1, -1), // top
        // 近平面：GL 的 NDC 是 z ≥ -1（row3 + row2），ZO 的是 z ≥ 0（只看 row2）。
        depthRange === 'zo'
            ? [row2[0], row2[1], row2[2], row2[3]]
            : combined(row3, row2, 1),
        combined(row3, row2, -1), // far
    ];
    for (let i = 0; i < 6; i++) {
        const [x, y, z, constant] = planes[i];
        setPlaneComponents(out.planes[i], x, y, z, constant);
        normalizePlane(out.planes[i], out.planes[i]);
    }
    return out;
}
/** 点是否在视锥体内（6 个面都在内侧）。 */
export function containsPoint(a, point) {
    for (const frustumPlane of a.planes) {
        if (planeDistanceToPoint(frustumPlane, point) < 0)
            return false;
    }
    return true;
}
/** 球是否与视锥体相交（可能被看到）。 */
export function intersectsSphere(a, center, radius) {
    for (const frustumPlane of a.planes) {
        if (planeDistanceToPoint(frustumPlane, center) < -radius)
            return false;
    }
    return true;
}
/**
 * 盒子是否与视锥体相交（可能被看到）。
 *
 * 每个面只测「沿该面法线最远的那个角点」（p-vertex）：它在面外侧时盒子必然整体在外侧。
 * 这是标准的保守判定，不做「盒子是否跨越平面」的额外工作。
 */
export function intersectsBox(a, box) {
    for (const frustumPlane of a.planes) {
        const nx = frustumPlane.normal[0];
        const ny = frustumPlane.normal[1];
        const nz = frustumPlane.normal[2];
        const x = nx >= 0 ? box.max[0] : box.min[0];
        const y = ny >= 0 ? box.max[1] : box.min[1];
        const z = nz >= 0 ? box.max[2] : box.min[2];
        if (nx * x + ny * y + nz * z + frustumPlane.constant < 0)
            return false;
    }
    return true;
}
/**
 * 平面是否与视锥体相交。
 *
 * 对视锥体这样的**凸体**，平面与它相交 ⟺ 8 个角点不全在同一侧（顶点分居两侧时，
 * 连接它们的线段必然穿过平面）。角点算不出来（有平面退化）时保守地返回 true。
 */
export function intersectsPlane(a, other) {
    const corners = frustumCorners(a);
    if (!corners)
        return true;
    let positive = false;
    let negative = false;
    for (const corner of corners) {
        const distance = planeDistanceToPoint(other, corner);
        if (distance > 0)
            positive = true;
        else if (distance < 0)
            negative = true;
        if (positive && negative)
            return true;
    }
    return false;
}
/**
 * 视锥体的 8 个角点（`null` 表示有平面退化、算不出来）。
 * 做法是「每 3 个面取交点」：远/近 × 上/下 × 左/右。
 */
function frustumCorners(a) {
    const [left, right, bottom, top, near, far] = a.planes;
    const corners = [];
    for (const nearOrFar of [near, far]) {
        for (const bottomOrTop of [bottom, top]) {
            for (const leftOrRight of [left, right]) {
                const corner = intersectThreePlanes(leftOrRight, bottomOrTop, nearOrFar);
                if (!corner)
                    return null;
                corners.push(corner);
            }
        }
    }
    return corners;
}
/** 三个平面的交点（行列式法）；三面共线（行列式为 0）时返回 `null`。 */
function intersectThreePlanes(a, b, c) {
    const a1 = a.normal[0];
    const a2 = a.normal[1];
    const a3 = a.normal[2];
    const b1 = b.normal[0];
    const b2 = b.normal[1];
    const b3 = b.normal[2];
    const c1 = c.normal[0];
    const c2 = c.normal[1];
    const c3 = c.normal[2];
    const determinant = a1 * (b2 * c3 - b3 * c2) - a2 * (b1 * c3 - b3 * c1) + a3 * (b1 * c2 - b2 * c1);
    if (Math.abs(determinant) < 1e-12)
        return null;
    const inverse = 1 / determinant;
    const d1 = -a.constant;
    const d2 = -b.constant;
    const d3 = -c.constant;
    return new Float32Array([
        (d1 * (b2 * c3 - b3 * c2) - a2 * (d2 * c3 - b3 * d3) + a3 * (d2 * c2 - b2 * d3)) * inverse,
        (a1 * (d2 * c3 - b3 * d3) - d1 * (b1 * c3 - b3 * c1) + a3 * (b1 * d3 - d2 * c1)) * inverse,
        (a1 * (b2 * d3 - d2 * c2) - a2 * (b1 * d3 - d2 * c1) + d1 * (b1 * c2 - b2 * c1)) * inverse,
    ]);
}
/** 6 个面都接近才算相等（顺序固定，所以逐面比较即可）。 */
export function equals(a, b, epsilon = 1e-6) {
    for (let i = 0; i < 6; i++) {
        if (!planeEquals(a.planes[i], b.planes[i], epsilon))
            return false;
    }
    return true;
}
//# sourceMappingURL=frustum.js.map