/**
 * 三维向量（Float32Array，长度 3）。
 *
 * 与 `vec2` 相同的约定：`out` 在第一个参数，返回值就是 `out`，允许原地运算。
 * 位置变换请用 {@link transformMat4}（会做透视除法），方向变换请用
 * {@link transformDirection}（忽略平移，不做除法）。
 */

export type Vec3 = Float32Array;

export function create(): Vec3 {
  return new Float32Array(3);
}

export function clone(a: Vec3): Vec3 {
  const out = new Float32Array(3);
  out[0] = a[0]!;
  out[1] = a[1]!;
  out[2] = a[2]!;
  return out;
}

export function fromValues(x: number, y: number, z: number): Vec3 {
  const out = new Float32Array(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

export function copy(out: Vec3, a: Vec3): Vec3 {
  out[0] = a[0]!;
  out[1] = a[1]!;
  out[2] = a[2]!;
  return out;
}

export function set(out: Vec3, x: number, y: number, z: number): Vec3 {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

export function zero(out: Vec3): Vec3 {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  return out;
}

export function add(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0]! + b[0]!;
  out[1] = a[1]! + b[1]!;
  out[2] = a[2]! + b[2]!;
  return out;
}

export function sub(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0]! - b[0]!;
  out[1] = a[1]! - b[1]!;
  out[2] = a[2]! - b[2]!;
  return out;
}

export function mul(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0]! * b[0]!;
  out[1] = a[1]! * b[1]!;
  out[2] = a[2]! * b[2]!;
  return out;
}

export function div(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0]! / b[0]!;
  out[1] = a[1]! / b[1]!;
  out[2] = a[2]! / b[2]!;
  return out;
}

export function scale(out: Vec3, a: Vec3, scalar: number): Vec3 {
  out[0] = a[0]! * scalar;
  out[1] = a[1]! * scalar;
  out[2] = a[2]! * scalar;
  return out;
}

/** `out = a + b * scalar`。 */
export function scaleAndAdd(out: Vec3, a: Vec3, b: Vec3, scalar: number): Vec3 {
  out[0] = a[0]! + b[0]! * scalar;
  out[1] = a[1]! + b[1]! * scalar;
  out[2] = a[2]! + b[2]! * scalar;
  return out;
}

export function negate(out: Vec3, a: Vec3): Vec3 {
  out[0] = -a[0]!;
  out[1] = -a[1]!;
  out[2] = -a[2]!;
  return out;
}

/** 归一化；长度接近 0 时写入零向量，不会产生 NaN。 */
export function normalize(out: Vec3, a: Vec3): Vec3 {
  const x = a[0]!;
  const y = a[1]!;
  const z = a[2]!;
  let length = Math.hypot(x, y, z);
  if (length > 0) length = 1 / length;
  out[0] = x * length;
  out[1] = y * length;
  out[2] = z * length;
  return out;
}

export function length(a: Vec3): number {
  return Math.hypot(a[0]!, a[1]!, a[2]!);
}

export function squaredLength(a: Vec3): number {
  return a[0]! * a[0]! + a[1]! * a[1]! + a[2]! * a[2]!;
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}

export function squaredDistance(a: Vec3, b: Vec3): number {
  const dx = a[0]! - b[0]!;
  const dy = a[1]! - b[1]!;
  const dz = a[2]! - b[2]!;
  return dx * dx + dy * dy + dz * dz;
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

/** 叉积。注意叉积不满足交换律：`a × b = -(b × a)`。 */
export function cross(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ax = a[0]!;
  const ay = a[1]!;
  const az = a[2]!;
  const bx = b[0]!;
  const by = b[1]!;
  const bz = b[2]!;
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

export function lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out[0] = a[0]! + t * (b[0]! - a[0]!);
  out[1] = a[1]! + t * (b[1]! - a[1]!);
  out[2] = a[2]! + t * (b[2]! - a[2]!);
  return out;
}

export function min(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = Math.min(a[0]!, b[0]!);
  out[1] = Math.min(a[1]!, b[1]!);
  out[2] = Math.min(a[2]!, b[2]!);
  return out;
}

export function max(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = Math.max(a[0]!, b[0]!);
  out[1] = Math.max(a[1]!, b[1]!);
  out[2] = Math.max(a[2]!, b[2]!);
  return out;
}

export function equals(a: Vec3, b: Vec3, epsilon = 1e-6): boolean {
  return (
    Math.abs(a[0]! - b[0]!) <= epsilon &&
    Math.abs(a[1]! - b[1]!) <= epsilon &&
    Math.abs(a[2]! - b[2]!) <= epsilon
  );
}

/** 镜面反射：`out = a - 2 * dot(n, a) * n`，`n` 必须是单位向量。 */
export function reflect(out: Vec3, a: Vec3, n: Vec3): Vec3 {
  const d = dot(n, a) * 2;
  out[0] = a[0]! - n[0]! * d;
  out[1] = a[1]! - n[1]! * d;
  out[2] = a[2]! - n[2]! * d;
  return out;
}

/** 用 3x3 矩阵变换（不含平移），用于法线方向。 */
export function transformMat3(out: Vec3, a: Vec3, m: Float32Array): Vec3 {
  const x = a[0]!;
  const y = a[1]!;
  const z = a[2]!;
  out[0] = m[0]! * x + m[3]! * y + m[6]! * z;
  out[1] = m[1]! * x + m[4]! * y + m[7]! * z;
  out[2] = m[2]! * x + m[5]! * y + m[8]! * z;
  return out;
}

/**
 * 用 4x4 矩阵变换点：`out = (m * (x, y, z, 1)).xyz / w`。
 * `w` 为 0 时按 1 处理，避免除零产生 NaN。
 */
export function transformMat4(out: Vec3, a: Vec3, m: Float32Array): Vec3 {
  const x = a[0]!;
  const y = a[1]!;
  const z = a[2]!;
  let w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  w = w || 1;
  out[0] = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w;
  out[1] = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w;
  out[2] = (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w;
  return out;
}

/**
 * 用 4x4 矩阵变换方向：只取左上 3x3，忽略平移，不做透视除法。
 * 适合方向光、相机朝向这类「无位置」的量。
 */
export function transformDirection(out: Vec3, a: Vec3, m: Float32Array): Vec3 {
  const x = a[0]!;
  const y = a[1]!;
  const z = a[2]!;
  out[0] = m[0]! * x + m[4]! * y + m[8]! * z;
  out[1] = m[1]! * x + m[5]! * y + m[9]! * z;
  out[2] = m[2]! * x + m[6]! * y + m[10]! * z;
  return out;
}

export function toArray(a: Vec3): number[] {
  return [a[0]!, a[1]!, a[2]!];
}

export function toString(a: Vec3): string {
  return `vec3(${a[0]}, ${a[1]}, ${a[2]})`;
}
