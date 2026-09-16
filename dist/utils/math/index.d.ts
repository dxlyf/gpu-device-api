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
export type { Vec2 } from './vec2.js';
export type { Vec3 } from './vec3.js';
export type { Vec4 } from './vec4.js';
export type { Mat3 } from './mat3.js';
export type { Mat4 } from './mat4.js';
export type { Quat } from './quaternion.js';
export type { Euler, EulerOrder } from './euler.js';
export type { Plane } from './plane.js';
export type { Ray } from './ray.js';
export type { Box3 } from './box3.js';
export type { Frustum } from './frustum.js';
/**
 * 颜色的数值容器。名字不叫 `Color` 是因为包入口已经有一个 `Color`（core 的颜色输入联合类型），
 * 两个 `export *` 同名会冲突；它的结构正好是那个联合类型里的对象成员，可以直接当颜色输入用。
 */
export type { ColorValue } from './color.js';
export type { Raycaster, RaycastHit } from './raycaster.js';
/** 浮点比较默认容差。 */
export declare const EPSILON = 0.000001;
/** 角度转弧度的系数。 */
export declare const DEG2RAD: number;
/** 弧度转角度的系数。 */
export declare const RAD2DEG: number;
/** 角度转弧度。 */
export declare function degToRad(degrees: number): number;
/** 弧度转角度。 */
export declare function radToDeg(radians: number): number;
/** 把 `value` 限制在 `[min, max]` 内。 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * 把 `value` 从 `[min, max]` 线性映射到 `[0, 1]` 并夹紧。
 * 常用于把某个区间归一化成 0~1 的进度值。
 */
export declare function inverseLerp(min: number, max: number, value: number): number;
/** 线性插值；`t` 不夹紧，允许外插。 */
export declare function lerp(a: number, b: number, t: number): number;
/** 平滑阶跃插值（3t² - 2t³），在两端一阶导为 0。 */
export declare function smoothstep(edge0: number, edge1: number, value: number): number;
/** 取 `value` 在浮点上的下一个可表示值，用于避开边界（如阴影贴图深度比较）。 */
export declare function nextAfter(value: number, direction: number): number;
//# sourceMappingURL=index.d.ts.map