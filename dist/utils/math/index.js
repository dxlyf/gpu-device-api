/**
 * 自带数学库出口。
 *
 * 各模块的函数名大量重复（`create` / `clone` / `copy` …），所以用**命名空间导出**，
 * 调用形式是 `vec3.create()` / `mat4.perspective(...)`，不会互相冲突：
 *
 * ```ts
 * import { vec3, mat4 } from 'gpu-device-api';
 *
 * const mvp = mat4.create();
 * mat4.multiply(mvp, projection, view);
 * vec3.transformMat4(position, position, mvp);
 * ```
 *
 * 矩阵一律**列主序** `Float32Array`，可直接上传 uniform buffer 与顶点缓冲，无需转换。
 */
export * as vec2 from './vec2.js';
export * as vec3 from './vec3.js';
export * as vec4 from './vec4.js';
export * as mat3 from './mat3.js';
export * as mat4 from './mat4.js';
export * as quat from './quaternion.js';
export * as euler from './euler.js';
export * as plane from './plane.js';
export * as ray from './ray.js';
export * as box3 from './box3.js';
export * as frustum from './frustum.js';
export * as color from './color.js';
export * as raycaster from './raycaster.js';
/** 浮点比较默认容差。 */
export const EPSILON = 1e-6;
/** 角度转弧度的系数。 */
export const DEG2RAD = Math.PI / 180;
/** 弧度转角度的系数。 */
export const RAD2DEG = 180 / Math.PI;
/** 角度转弧度。 */
export function degToRad(degrees) {
    return degrees * DEG2RAD;
}
/** 弧度转角度。 */
export function radToDeg(radians) {
    return radians * RAD2DEG;
}
/** 把 `value` 限制在 `[min, max]` 内。 */
export function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
/**
 * 把 `value` 从 `[min, max]` 线性映射到 `[0, 1]` 并夹紧。
 * 常用于把某个区间归一化成 0~1 的进度值。
 */
export function inverseLerp(min, max, value) {
    if (max === min)
        return 0;
    return clamp((value - min) / (max - min), 0, 1);
}
/** 线性插值；`t` 不夹紧，允许外插。 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
/** 平滑阶跃插值（3t² - 2t³），在两端一阶导为 0。 */
export function smoothstep(edge0, edge1, value) {
    const t = inverseLerp(edge0, edge1, value);
    return t * t * (3 - 2 * t);
}
/** 取 `value` 在浮点上的下一个可表示值，用于避开边界（如阴影贴图深度比较）。 */
export function nextAfter(value, direction) {
    if (Number.isNaN(value) || Number.isNaN(direction))
        return Number.NaN;
    if (value === direction)
        return value;
    if (value === 0)
        return direction > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE;
    return value + (direction > value ? 1 : -1) * Math.abs(value) * Number.EPSILON;
}
//# sourceMappingURL=index.js.map