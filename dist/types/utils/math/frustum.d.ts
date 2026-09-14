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
import type { Box3 } from './box3.js';
import type { Plane } from './plane.js';
import type { Vec3 } from './vec3.js';
export interface Frustum {
    /** 固定 6 个面：left / right / bottom / top / near / far。 */
    readonly planes: readonly Plane[];
}
/** 六个面的下标，避免调用方记数字。 */
export declare const FRUSTUM_PLANE: {
    readonly Left: 0;
    readonly Right: 1;
    readonly Bottom: 2;
    readonly Top: 3;
    readonly Near: 4;
    readonly Far: 5;
};
export declare function create(): Frustum;
export declare function clone(a: Frustum): Frustum;
export declare function copy(out: Frustum, a: Frustum): Frustum;
/**
 * 从「投影 × 视图」矩阵（也就是 `mat4.multiply(projectionView, projection, view)` 的结果）
 * 提取 6 个世界空间的裁剪面。
 *
 * `depthRange` 决定近裁剪面的取法：`'gl'` 对应裁剪空间 z ∈ [-1, 1]（WebGL2），
 * `'zo'` 对应 z ∈ [0, 1]（WebGPU / D3D / Vulkan）—— 两者的近平面不同，选错会让近处的物体被误剔除。
 * 传入的必须是 P × V（世界空间），只传投影矩阵得到的是**视图空间**的锥体，方向会更正。
 */
export declare function setFromProjectionView(out: Frustum, m: Float32Array, depthRange?: 'gl' | 'zo'): Frustum;
/** 点是否在视锥体内（6 个面都在内侧）。 */
export declare function containsPoint(a: Frustum, point: Vec3): boolean;
/** 球是否与视锥体相交（可能被看到）。 */
export declare function intersectsSphere(a: Frustum, center: Vec3, radius: number): boolean;
/**
 * 盒子是否与视锥体相交（可能被看到）。
 *
 * 每个面只测「沿该面法线最远的那个角点」（p-vertex）：它在面外侧时盒子必然整体在外侧。
 * 这是标准的保守判定，不做「盒子是否跨越平面」的额外工作。
 */
export declare function intersectsBox(a: Frustum, box: Box3): boolean;
/**
 * 平面是否与视锥体相交。
 *
 * 对视锥体这样的**凸体**，平面与它相交 ⟺ 8 个角点不全在同一侧（顶点分居两侧时，
 * 连接它们的线段必然穿过平面）。角点算不出来（有平面退化）时保守地返回 true。
 */
export declare function intersectsPlane(a: Frustum, other: Plane): boolean;
/** 6 个面都接近才算相等（顺序固定，所以逐面比较即可）。 */
export declare function equals(a: Frustum, b: Frustum, epsilon?: number): boolean;
//# sourceMappingURL=frustum.d.ts.map