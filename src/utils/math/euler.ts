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

import {
  multiply as multiplyQuat,
  setAxisAngle,
  toMat4 as quatToMat4,
  type Quat,
} from './quaternion.js';
import { fromXRotation, fromYRotation, fromZRotation, identity, multiply as multiplyMat4 } from './mat4.js';
import type { Mat4 } from './mat4.js';

export type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';

/** 支持的顺序，按「常用程度」排列。 */
export const EULER_ORDERS: readonly EulerOrder[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];

export interface Euler {
  x: number;
  y: number;
  z: number;
  order: EulerOrder;
}

export function create(x = 0, y = 0, z = 0, order: EulerOrder = 'XYZ'): Euler {
  return { x, y, z, order };
}

export function clone(a: Euler): Euler {
  return create(a.x, a.y, a.z, a.order);
}

export function copy(out: Euler, a: Euler): Euler {
  out.x = a.x;
  out.y = a.y;
  out.z = a.z;
  out.order = a.order;
  return out;
}

export function set(out: Euler, x: number, y: number, z: number, order: EulerOrder = out.order): Euler {
  out.x = x;
  out.y = y;
  out.z = z;
  out.order = order;
  return out;
}

/** 分量与顺序都相同才算相等（同一个朝向的不同欧拉角表示不相等）。 */
export function equals(a: Euler, b: Euler, epsilon = 1e-6): boolean {
  return (
    a.order === b.order &&
    Math.abs(a.x - b.x) <= epsilon &&
    Math.abs(a.y - b.y) <= epsilon &&
    Math.abs(a.z - b.z) <= epsilon
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* 内部：轴顺序表与复用暂存                                                                             */
/* ------------------------------------------------------------------------------------------------ */

type Axis = 'X' | 'Y' | 'Z';

const AXIS_ORDER: Readonly<Record<EulerOrder, readonly [Axis, Axis, Axis]>> = {
  XYZ: ['X', 'Y', 'Z'],
  YXZ: ['Y', 'X', 'Z'],
  ZXY: ['Z', 'X', 'Y'],
  ZYX: ['Z', 'Y', 'X'],
  YZX: ['Y', 'Z', 'X'],
  XZY: ['X', 'Z', 'Y'],
};

const AXIS_VECTORS: Readonly<Record<Axis, Float32Array>> = {
  X: new Float32Array([1, 0, 0]),
  Y: new Float32Array([0, 1, 0]),
  Z: new Float32Array([0, 0, 1]),
};

/** 模块级暂存，避免每次转换都分配矩阵/四元数。 */
const SCRATCH_X = identity(new Float32Array(16));
const SCRATCH_Y = identity(new Float32Array(16));
const SCRATCH_Z = identity(new Float32Array(16));
const SCRATCH_M = identity(new Float32Array(16));
const SCRATCH_Q1 = new Float32Array(4);
const SCRATCH_Q2 = new Float32Array(4);
const SCRATCH_Q3 = new Float32Array(4);
const SCRATCH_Q4 = new Float32Array(4);

function axisRadians(e: Euler, axis: Axis): number {
  return axis === 'X' ? e.x : axis === 'Y' ? e.y : e.z;
}

function axisRotationMatrix(axis: Axis, radians: number, out: Mat4): Mat4 {
  if (axis === 'X') return fromXRotation(out, radians);
  if (axis === 'Y') return fromYRotation(out, radians);
  return fromZRotation(out, radians);
}

/* ------------------------------------------------------------------------------------------------ */
/* 转换                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** 转成 4×4 旋转矩阵：按 `order` 内旋，结果是 `R_first * R_second * R_third`。 */
export function toMat4(out: Mat4, e: Euler): Mat4 {
  const axes = AXIS_ORDER[e.order];
  const first = axisRotationMatrix(axes[0], axisRadians(e, axes[0]), SCRATCH_X);
  const second = axisRotationMatrix(axes[1], axisRadians(e, axes[1]), SCRATCH_Y);
  const third = axisRotationMatrix(axes[2], axisRadians(e, axes[2]), SCRATCH_Z);
  multiplyMat4(SCRATCH_M, first, second);
  return multiplyMat4(out, SCRATCH_M, third);
}

/**
 * 转成四元数：`q = q_first * q_second * q_third`，与 {@link toMat4} 的顺序完全一致
 * （所以「转四元数再转矩阵」与「直接转矩阵」得到同一个旋转）。
 */
export function toQuaternion(out: Quat, e: Euler): Quat {
  const axes = AXIS_ORDER[e.order];
  const first = setAxisAngle(SCRATCH_Q1, AXIS_VECTORS[axes[0]], axisRadians(e, axes[0]));
  const second = setAxisAngle(SCRATCH_Q2, AXIS_VECTORS[axes[1]], axisRadians(e, axes[1]));
  const third = setAxisAngle(SCRATCH_Q3, AXIS_VECTORS[axes[2]], axisRadians(e, axes[2]));
  multiplyQuat(SCRATCH_Q4, first, second);
  return multiplyQuat(out, SCRATCH_Q4, third);
}

/**
 * 从 4×4 旋转矩阵反解欧拉角（按 `out.order` 的约定）。
 *
 * 中间轴处于 ±90°（万向锁位置）时，另一条自由轴取 0 —— 这是数学上的病态点：
 * 两个角度会互相「吸收」，再加上中间结果是 Float32，往返回来可能有 ~1e-3 量级的偏差。
 * 需要精确还原朝向时请用四元数，不要依赖欧拉角的往返。
 */
export function fromRotationMatrix(out: Euler, m: Float32Array): Euler {
  // 列主序：m[col * 4 + row]，所以 m13 是「第 1 行第 3 列」= m[8]。
  const m11 = m[0]!;
  const m21 = m[1]!;
  const m31 = m[2]!;
  const m12 = m[4]!;
  const m22 = m[5]!;
  const m32 = m[6]!;
  const m13 = m[8]!;
  const m23 = m[9]!;
  const m33 = m[10]!;
  const clampUnit = (value: number): number => (value < -1 ? -1 : value > 1 ? 1 : value);
  /** 中间轴接近 ±90° 的判定阈值：超过它时另一条自由轴不可信，取 0。 */
  const GIMBAL_LOCK = 0.9999999;

  switch (out.order) {
    case 'XYZ':
      out.y = Math.asin(clampUnit(m13));
      if (Math.abs(m13) < GIMBAL_LOCK) {
        out.x = Math.atan2(-m23, m33);
        out.z = Math.atan2(-m12, m11);
      } else {
        out.x = Math.atan2(m32, m22);
        out.z = 0;
      }
      break;
    case 'YXZ':
      out.x = Math.asin(-clampUnit(m23));
      if (Math.abs(m23) < GIMBAL_LOCK) {
        out.y = Math.atan2(m13, m33);
        out.z = Math.atan2(m21, m22);
      } else {
        out.y = Math.atan2(-m31, m11);
        out.z = 0;
      }
      break;
    case 'ZXY':
      out.x = Math.asin(clampUnit(m32));
      if (Math.abs(m32) < GIMBAL_LOCK) {
        out.y = Math.atan2(-m31, m33);
        out.z = Math.atan2(-m12, m22);
      } else {
        out.y = 0;
        out.z = Math.atan2(m21, m11);
      }
      break;
    case 'ZYX':
      out.y = Math.asin(-clampUnit(m31));
      if (Math.abs(m31) < GIMBAL_LOCK) {
        out.x = Math.atan2(m32, m33);
        out.z = Math.atan2(m21, m11);
      } else {
        out.x = 0;
        out.z = Math.atan2(-m12, m22);
      }
      break;
    case 'YZX':
      out.z = Math.asin(clampUnit(m21));
      if (Math.abs(m21) < GIMBAL_LOCK) {
        out.x = Math.atan2(-m23, m22);
        out.y = Math.atan2(-m31, m11);
      } else {
        out.x = 0;
        out.y = Math.atan2(m13, m33);
      }
      break;
    case 'XZY':
      out.z = Math.asin(-clampUnit(m12));
      if (Math.abs(m12) < GIMBAL_LOCK) {
        out.x = Math.atan2(m32, m22);
        out.y = Math.atan2(m13, m11);
      } else {
        out.x = Math.atan2(-m23, m33);
        out.y = 0;
      }
      break;
  }
  return out;
}

/** 从四元数反解欧拉角：先转成矩阵，再走 {@link fromRotationMatrix} 的分支。 */
export function fromQuaternion(out: Euler, q: Quat): Euler {
  return fromRotationMatrix(out, quatToMat4(SCRATCH_M, q));
}
