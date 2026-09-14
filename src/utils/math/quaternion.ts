/**
 * 四元数（`Float32Array`，长度 4，顺序 `[x, y, z, w]`）。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`、允许原地运算
 * （`quat.multiply(q, q, r)` 是安全的）。单位四元数是 `(0, 0, 0, 1)`。
 *
 * 乘法约定：`multiply(out, a, b)` 得到 `a * b`（Hamilton 积），与 `mat4.multiply` 是同一套顺序 ——
 * 都是「**先施加右边的 b、再施加左边的 a**」（`R(a·b) = R(a)·R(b)`），
 * 所以「四元数转矩阵」之后变换顺序不会反过来。
 *
 * 用在哪：朝向的保存与插值（{@link slerp}）、把朝向交给渲染（{@link toMat4}）、
 * 旋转向量（{@link transformVec3}）；欧拉角的互转在 `euler` 模块。
 */

export type Quat = Float32Array;

export function create(): Quat {
  const out = new Float32Array(4);
  out[3] = 1;
  return out;
}

export function clone(a: Quat): Quat {
  const out = new Float32Array(4);
  return copy(out, a);
}

export function copy(out: Quat, a: Quat): Quat {
  out[0] = a[0]!;
  out[1] = a[1]!;
  out[2] = a[2]!;
  out[3] = a[3]!;
  return out;
}

export function set(out: Quat, x: number, y: number, z: number, w: number): Quat {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

export function fromValues(x: number, y: number, z: number, w: number): Quat {
  return set(new Float32Array(4), x, y, z, w);
}

export function identity(out: Quat): Quat {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/** 点积；单位四元数的点积就是「夹角余弦的一半」的度量，用来判断朝向接近程度。 */
export function dot(a: Quat, b: Quat): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]! + a[3]! * b[3]!;
}

export function squaredLength(a: Quat): number {
  return dot(a, a);
}

export function length(a: Quat): number {
  return Math.sqrt(squaredLength(a));
}

/** 归一化；长度过小时退化为单位四元数（避免产生 NaN）。 */
export function normalize(out: Quat, a: Quat): Quat {
  const len = length(a);
  if (len < 1e-8) return identity(out);
  const inverse = 1 / len;
  out[0] = a[0]! * inverse;
  out[1] = a[1]! * inverse;
  out[2] = a[2]! * inverse;
  out[3] = a[3]! * inverse;
  return out;
}

/** 共轭（单位四元数下就是逆旋转）。 */
export function conjugate(out: Quat, a: Quat): Quat {
  out[0] = -a[0]!;
  out[1] = -a[1]!;
  out[2] = -a[2]!;
  out[3] = a[3]!;
  return out;
}

/**
 * 求逆。只在**单位四元数**上有「共轭即逆」的结论，所以这里按一般情况除以模长平方；
 * 模长过小时退化为单位四元数。
 */
export function invert(out: Quat, a: Quat): Quat {
  const norm = squaredLength(a);
  if (norm < 1e-12) return identity(out);
  const inverse = 1 / norm;
  out[0] = -a[0]! * inverse;
  out[1] = -a[1]! * inverse;
  out[2] = -a[2]! * inverse;
  out[3] = a[3]! * inverse;
  return out;
}

/** `out = a * b`：先施加 a、再施加 b。 */
export function multiply(out: Quat, a: Quat, b: Quat): Quat {
  const ax = a[0]!;
  const ay = a[1]!;
  const az = a[2]!;
  const aw = a[3]!;
  const bx = b[0]!;
  const by = b[1]!;
  const bz = b[2]!;
  const bw = b[3]!;
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/** `out = b * a`（与 {@link multiply} 相反的顺序）。 */
export function premultiply(out: Quat, a: Quat, b: Quat): Quat {
  return multiply(out, b, a);
}

/** 绕**本地** X 轴旋转：`out = a * Rx(rad)`。 */
export function rotateX(out: Quat, a: Quat, rad: number): Quat {
  const half = rad * 0.5;
  const sin = Math.sin(half);
  const cos = Math.cos(half);
  return multiply(out, a, set(AXIS_SCRATCH, sin, 0, 0, cos));
}

/** 绕**本地** Y 轴旋转：`out = a * Ry(rad)`。 */
export function rotateY(out: Quat, a: Quat, rad: number): Quat {
  const half = rad * 0.5;
  const sin = Math.sin(half);
  const cos = Math.cos(half);
  return multiply(out, a, set(AXIS_SCRATCH, 0, sin, 0, cos));
}

/** 绕**本地** Z 轴旋转：`out = a * Rz(rad)`。 */
export function rotateZ(out: Quat, a: Quat, rad: number): Quat {
  const half = rad * 0.5;
  const sin = Math.sin(half);
  const cos = Math.cos(half);
  return multiply(out, a, set(AXIS_SCRATCH, 0, 0, sin, cos));
}

const AXIS_SCRATCH = create();

/** 由「单位轴 + 弧度」构造（右手定则）。轴会被归一化；零轴退化为单位四元数。 */
export function setAxisAngle(out: Quat, axis: Float32Array, rad: number): Quat {
  const len = Math.hypot(axis[0]!, axis[1]!, axis[2]!);
  if (len < 1e-8) return identity(out);
  const half = rad * 0.5;
  const sin = Math.sin(half) / len;
  out[0] = axis[0]! * sin;
  out[1] = axis[1]! * sin;
  out[2] = axis[2]! * sin;
  out[3] = Math.cos(half);
  return out;
}

/**
 * 从 4×4 矩阵左上 3×3 提取旋转。
 *
 * 要求那部分是**纯旋转**（或带正均匀缩放）：提取用的是对角线迹法，
 * 非均匀缩放会得到偏差，此时调用方能做的话应先 `mat4.getScaling` 判断。
 * 退化矩阵（全 0）返回单位四元数。
 */
export function setFromRotationMatrix(out: Quat, m: Float32Array): Quat {
  // 列主序：m00 = m[0], m11 = m[5], m22 = m[10]，其余同理。
  const m00 = m[0]!;
  const m11 = m[5]!;
  const m22 = m[10]!;
  const trace = m00 + m11 + m22;

  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    out[3] = s * 0.25;
    out[0] = (m[6]! - m[9]!) / s;
    out[1] = (m[8]! - m[2]!) / s;
    out[2] = (m[1]! - m[4]!) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    out[3] = (m[6]! - m[9]!) / s;
    out[0] = s * 0.25;
    out[1] = (m[4]! + m[1]!) / s;
    out[2] = (m[8]! + m[2]!) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    out[3] = (m[8]! - m[2]!) / s;
    out[0] = (m[4]! + m[1]!) / s;
    out[1] = s * 0.25;
    out[2] = (m[9]! + m[6]!) / s;
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    out[3] = (m[1]! - m[4]!) / s;
    out[0] = (m[8]! + m[2]!) / s;
    out[1] = (m[9]! + m[6]!) / s;
    out[2] = s * 0.25;
  }
  return normalize(out, out);
}

/**
 * 求把单位向量 `from` 转到 `to` 的最短旋转。
 * 两个向量相反时旋转轴不唯一，这里挑一个与 from 不平行的轴（与 three.js 的做法一致）。
 */
export function setFromUnitVectors(out: Quat, from: Float32Array, to: Float32Array): Quat {
  const fx = from[0]!;
  const fy = from[1]!;
  const fz = from[2]!;
  const tx = to[0]!;
  const ty = to[1]!;
  const tz = to[2]!;
  let w = fx * tx + fy * ty + fz * tz + 1;

  if (w < 1e-8) {
    // 反向：绕任意一个与 from 垂直的轴转 180°。
    w = 0;
    if (Math.abs(fx) > Math.abs(fz)) {
      out[0] = -fy;
      out[1] = fx;
      out[2] = 0;
    } else {
      out[0] = 0;
      out[1] = -fz;
      out[2] = fy;
    }
    out[3] = w;
  } else {
    out[0] = fy * tz - fz * ty;
    out[1] = fz * tx - fx * tz;
    out[2] = fx * ty - fy * tx;
    out[3] = w;
  }
  return normalize(out, out);
}

/** 用四元数旋转向量：`out = q * v * q⁻¹`。 */
export function transformVec3(out: Float32Array, a: Quat, v: Float32Array): Float32Array {
  const x = v[0]!;
  const y = v[1]!;
  const z = v[2]!;
  const qx = a[0]!;
  const qy = a[1]!;
  const qz = a[2]!;
  const qw = a[3]!;

  // t = 2 * (q_vec × v)
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);

  // out = v + qw * t + q_vec × t
  out[0] = x + qw * tx + (qy * tz - qz * ty);
  out[1] = y + qw * ty + (qz * tx - qx * tz);
  out[2] = z + qw * tz + (qx * ty - qy * tx);
  return out;
}

/** 球面线性插值（朝向插值的正确做法，不会像欧拉角那样遇到万向锁）。 */
export function slerp(out: Quat, a: Quat, b: Quat, t: number): Quat {
  let bx = b[0]!;
  let by = b[1]!;
  let bz = b[2]!;
  let bw = b[3]!;
  let cos = dot(a, b);

  // 点积为负说明两个四元数代表「绕远路」的同一个旋转，先把 b 取反走短弧。
  if (cos < 0) {
    cos = -cos;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }

  if (cos > 0.9995) {
    // 夹角极小，sin 会趋于 0，改用线性插值再归一化。
    out[0] = a[0]! + (bx - a[0]!) * t;
    out[1] = a[1]! + (by - a[1]!) * t;
    out[2] = a[2]! + (bz - a[2]!) * t;
    out[3] = a[3]! + (bw - a[3]!) * t;
    return normalize(out, out);
  }

  const theta = Math.acos(cos);
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  out[0] = a[0]! * wa + bx * wb;
  out[1] = a[1]! * wa + by * wb;
  out[2] = a[2]! * wa + bz * wb;
  out[3] = a[3]! * wa + bw * wb;
  return normalize(out, out);
}

/** 线性插值（比 {@link slerp} 便宜，但不保持角速度恒定；结果会归一化）。 */
export function lerp(out: Quat, a: Quat, b: Quat, t: number): Quat {
  out[0] = a[0]! + (b[0]! - a[0]!) * t;
  out[1] = a[1]! + (b[1]! - a[1]!) * t;
  out[2] = a[2]! + (b[2]! - a[2]!) * t;
  out[3] = a[3]! + (b[3]! - a[3]!) * t;
  return normalize(out, out);
}

/**
 * 转成 4×4 旋转矩阵（列主序，右手系，与 `mat4.rotateX/Y/Z` 同一套约定）。
 * 平移分量为 0，可以直接 `mat4.multiply` 进模型矩阵。
 */
export function toMat4(out: Float32Array, a: Quat): Float32Array {
  const x = a[0]!;
  const y = a[1]!;
  const z = a[2]!;
  const w = a[3]!;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;

  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;

  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;

  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/** 分量比较；`epsilon` 默认取 `1e-6`。注意 `q` 与 `-q` 表示同一个旋转，这里**不做**这种等价判断。 */
export function equals(a: Quat, b: Quat, epsilon = 1e-6): boolean {
  return (
    Math.abs(a[0]! - b[0]!) <= epsilon &&
    Math.abs(a[1]! - b[1]!) <= epsilon &&
    Math.abs(a[2]! - b[2]!) <= epsilon &&
    Math.abs(a[3]! - b[3]!) <= epsilon
  );
}

export function toString(a: Quat): string {
  return `quat(${a[0]}, ${a[1]}, ${a[2]}, ${a[3]})`;
}
