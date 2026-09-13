/**
 * 3x3 矩阵（Float32Array，长度 9），**列主序**存储，与 GLSL / WGSL 的内存布局一致。
 *
 * 内存布局映射到数学形式：
 * ```
 * m = [ m[0] m[3] m[6] ]
 *     [ m[1] m[4] m[7] ]
 *     [ m[2] m[5] m[8] ]
 * ```
 * 因此 `m[0..2]` 是**第一列**，而不是第一行。
 *
 * 约定同向量模块：`out` 在第一个参数，返回值就是 `out`，所有函数都允许 `out` 与输入同一对象。
 */

export type Mat3 = Float32Array;

/** 创建单位矩阵。 */
export function create(): Mat3 {
  const out = new Float32Array(9);
  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}

/** 写入单位矩阵。 */
export function identity(out: Mat3): Mat3 {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

export function clone(a: Mat3): Mat3 {
  const out = new Float32Array(9);
  out.set(a);
  return out;
}

export function fromValues(
  m00: number, m01: number, m02: number,
  m10: number, m11: number, m12: number,
  m20: number, m21: number, m22: number,
): Mat3 {
  const out = new Float32Array(9);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

export function copy(out: Mat3, a: Mat3): Mat3 {
  out.set(a);
  return out;
}

/** 按列主序逐个写入 9 个分量。 */
export function set(
  out: Mat3,
  m00: number, m01: number, m02: number,
  m10: number, m11: number, m12: number,
  m20: number, m21: number, m22: number,
): Mat3 {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/** 取 4x4 矩阵左上角的 3x3 部分（常用于从模型矩阵取出线性变换部分）。 */
export function fromMat4(out: Mat3, a: Float32Array): Mat3 {
  out[0] = a[0]!;
  out[1] = a[1]!;
  out[2] = a[2]!;
  out[3] = a[4]!;
  out[4] = a[5]!;
  out[5] = a[6]!;
  out[6] = a[8]!;
  out[7] = a[9]!;
  out[8] = a[10]!;
  return out;
}

/** 转置。 */
export function transpose(out: Mat3, a: Mat3): Mat3 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;
  out[0] = a00;
  out[1] = a10;
  out[2] = a20;
  out[3] = a01;
  out[4] = a11;
  out[5] = a21;
  out[6] = a02;
  out[7] = a12;
  out[8] = a22;
  return out;
}

/** 行列式。 */
export function determinant(a: Mat3): number {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;
  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;
  return a00 * b01 + a01 * b11 + a02 * b21;
}

/**
 * 求逆。矩阵奇异（行列式为 0）时返回 `null`，不做静默的零矩阵填充，
 * 调用方必须显式处理失败分支。
 */
export function invert(out: Mat3, a: Mat3): Mat3 | null {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let det = a00 * b01 + a01 * b11 + a02 * b21;
  if (!det) return null;
  det = 1 / det;

  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}

/** 矩阵乘法：`out = a * b`（先应用 `b`，再应用 `a`）。 */
export function multiply(out: Mat3, a: Mat3, b: Mat3): Mat3 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;
  const b00 = b[0]!;
  const b01 = b[1]!;
  const b02 = b[2]!;
  const b10 = b[3]!;
  const b11 = b[4]!;
  const b12 = b[5]!;
  const b20 = b[6]!;
  const b21 = b[7]!;
  const b22 = b[8]!;

  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}

/** 逐列缩放：`b` 是每列各自的缩放系数（等价于二维绕原点缩放）。 */
export function scale(out: Mat3, a: Mat3, b: Float32Array): Mat3 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;
  const b00 = b[0]!;
  const b01 = b[1]!;
  const b02 = b[2]!;

  out[0] = b00 * a00;
  out[1] = b00 * a01;
  out[2] = b00 * a02;
  out[3] = b01 * a10;
  out[4] = b01 * a11;
  out[5] = b01 * a12;
  out[6] = b02 * a20;
  out[7] = b02 * a21;
  out[8] = b02 * a22;
  return out;
}

/** 在矩阵上叠加二维平移（`b` 为 `vec2`）。 */
export function translate(out: Mat3, a: Mat3, b: Float32Array): Mat3 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;
  const b00 = b[0]!;
  const b01 = b[1]!;

  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = a10;
  out[4] = a11;
  out[5] = a12;
  out[6] = b00 * a00 + b01 * a10 + a20;
  out[7] = b00 * a01 + b01 * a11 + a21;
  out[8] = b00 * a02 + b01 * a12 + a22;
  return out;
}

/** 在矩阵上叠加二维旋转（弧度，绕原点逆时针）。 */
export function rotate(out: Mat3, a: Mat3, rad: number): Mat3 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a10 = a[3]!;
  const a11 = a[4]!;
  const a12 = a[5]!;
  const a20 = a[6]!;
  const a21 = a[7]!;
  const a22 = a[8]!;
  const s = Math.sin(rad);
  const c = Math.cos(rad);

  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;
  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;
  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
}

/**
 * 由 4x4 矩阵求**法线矩阵**，即左上 3x3 的「逆转置」。
 *
 * 非等比缩放会破坏法线方向，必须用它来变换法线：直接乘模型矩阵会让法线不再垂直于表面。
 * 左上 3x3 奇异（例如某个轴缩放为 0）时返回 `null`。
 *
 * ```ts
 * const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
 * ```
 */
export function normalFromMat4(out: Mat3, a: Float32Array): Mat3 | null {
  fromMat4(out, a);
  if (!invert(out, out)) return null;
  transpose(out, out);
  return out;
}

export function equals(a: Mat3, b: Mat3, epsilon = 1e-6): boolean {
  for (let i = 0; i < 9; i++) {
    if (Math.abs(a[i]! - b[i]!) > epsilon) return false;
  }
  return true;
}

export function toString(a: Mat3): string {
  return `mat3(${a[0]}, ${a[1]}, ${a[2]} | ${a[3]}, ${a[4]}, ${a[5]} | ${a[6]}, ${a[7]}, ${a[8]})`;
}
