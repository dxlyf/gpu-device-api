/**
 * 欧拉角（`{ x, y, z, order }`，弧度）。
 *
 * 欧拉角是**给人看**的朝向表示（调参、调试输出），不适合插值：会遇到万向锁，而且
 * 同一个朝向有多组解。需要插值/组合时请转成 `quat`（{@link toQuaternion}）。
 *
 * `order` 决定三个旋转的施加顺序，语义是**内旋（intrinsic）**：
 * `'XYZ'` 表示先绕（当时的）X 轴转 x、再绕（已经转过去的）Y 轴转 y、最后绕 Z 轴转 z，
 * 对应的矩阵是 `Rx * Ry * Rz` —— 与 three.js 的 `Euler` 一致。
 */
import { type Quat } from './quaternion.js';
import type { Mat4 } from './mat4.js';
export type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';
/** 支持的顺序，按「常用程度」排列。 */
export declare const EULER_ORDERS: readonly EulerOrder[];
export interface Euler {
    x: number;
    y: number;
    z: number;
    order: EulerOrder;
}
export declare function create(x?: number, y?: number, z?: number, order?: EulerOrder): Euler;
export declare function clone(a: Euler): Euler;
export declare function copy(out: Euler, a: Euler): Euler;
export declare function set(out: Euler, x: number, y: number, z: number, order?: EulerOrder): Euler;
/** 分量与顺序都相同才算相等（同一个朝向的不同欧拉角表示不相等）。 */
export declare function equals(a: Euler, b: Euler, epsilon?: number): boolean;
/** 转成 4×4 旋转矩阵：按 `order` 内旋，结果是 `R_first * R_second * R_third`。 */
export declare function toMat4(out: Mat4, e: Euler): Mat4;
/**
 * 转成四元数：`q = q_first * q_second * q_third`，与 {@link toMat4} 的顺序完全一致
 * （所以「转四元数再转矩阵」与「直接转矩阵」得到同一个旋转）。
 */
export declare function toQuaternion(out: Quat, e: Euler): Quat;
/**
 * 从 4×4 旋转矩阵反解欧拉角（按 `out.order` 的约定）。
 *
 * 中间轴处于 ±90°（万向锁位置）时，另一条自由轴取 0 —— 这是数学上的病态点：
 * 两个角度会互相「吸收」，再加上中间结果是 Float32，往返回来可能有 ~1e-3 量级的偏差。
 * 需要精确还原朝向时请用四元数，不要依赖欧拉角的往返。
 */
export declare function fromRotationMatrix(out: Euler, m: Float32Array): Euler;
/** 从四元数反解欧拉角：先转成矩阵，再走 {@link fromRotationMatrix} 的分支。 */
export declare function fromQuaternion(out: Euler, q: Quat): Euler;
//# sourceMappingURL=euler.d.ts.map