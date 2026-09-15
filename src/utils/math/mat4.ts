/**
 * 4x4 矩阵（Float32Array，长度 16），**列主序**存储，与 GLSL / WGSL 的内存布局一致。
 *
 * 内存布局映射到数学形式：
 * ```
 * m = [ m[0] m[4] m[8]  m[12] ]
 *     [ m[1] m[5] m[9]  m[13] ]
 *     [ m[2] m[6] m[10] m[14] ]
 *     [ m[3] m[7] m[11] m[15] ]
 * ```
 * 因此平移分量是 `m[12] / m[13] / m[14]`，而不是 `m[3]` 那一组。
 *
 * 约定同向量模块：`out` 在第一个参数，返回值就是 `out`，所有函数都允许 `out` 与输入同一对象。
 *
 * 深度范围有两套约定，**不要混用**：
 * - {@link perspective} / {@link ortho}：裁剪空间 z ∈ [-1, 1]，OpenGL / WebGL2 用这套；
 * - {@link perspectiveZO} / {@link orthoZO}：裁剪空间 z ∈ [0, 1]，WebGPU / D3D / Vulkan 用这套。
 *   拿 GL 的投影矩阵去喂 WebGPU，画面会因为深度全落在 [0,1] 之外而被裁掉。
 */

import * as mat3 from './mat3.js';

export type Mat4 = Float32Array;

/** 判断轴向量是否退化时使用的阈值。 */
const EPSILON = 1e-6;

/** 内部临时矩阵，避免 `rotate` / `translate` 等函数每次调用都分配内存。 */
const _tmp = new Float32Array(16);
/** 内部临时向量。 */
const _tmpVec3 = new Float32Array(3);

/** 创建单位矩阵。 */
export function create(): Mat4 {
  const out = new Float32Array(16);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/** 写入单位矩阵。 */
export function identity(out: Mat4): Mat4 {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

export function clone(a: Mat4): Mat4 {
  const out = new Float32Array(16);
  out.set(a);
  return out;
}

/** 全零矩阵（会退化为不可逆，仅作明确的初始值用）。 */
export function zero(out: Mat4): Mat4 {
  out.fill(0);
  return out;
}

/** 按列主序传入 16 个分量。 */
export function fromValues(...values: number[]): Mat4 {
  const out = new Float32Array(16);
  for (let i = 0; i < 16; i++) out[i] = values[i] ?? 0;
  return out;
}

export function copy(out: Mat4, a: Mat4): Mat4 {
  out.set(a);
  return out;
}

/** 按列主序逐个写入 16 个分量。 */
export function set(out: Mat4, ...values: number[]): Mat4 {
  for (let i = 0; i < 16; i++) out[i] = values[i] ?? 0;
  return out;
}

/** 转置。 */
export function transpose(out: Mat4, a: Mat4): Mat4 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a03 = a[3]!;
  const a10 = a[4]!;
  const a11 = a[5]!;
  const a12 = a[6]!;
  const a13 = a[7]!;
  const a20 = a[8]!;
  const a21 = a[9]!;
  const a22 = a[10]!;
  const a23 = a[11]!;
  const a30 = a[12]!;
  const a31 = a[13]!;
  const a32 = a[14]!;
  const a33 = a[15]!;

  out[0] = a00;
  out[1] = a10;
  out[2] = a20;
  out[3] = a30;
  out[4] = a01;
  out[5] = a11;
  out[6] = a21;
  out[7] = a31;
  out[8] = a02;
  out[9] = a12;
  out[10] = a22;
  out[11] = a32;
  out[12] = a03;
  out[13] = a13;
  out[14] = a23;
  out[15] = a33;
  return out;
}

/** 行列式。 */
export function determinant(a: Mat4): number {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a03 = a[3]!;
  const a10 = a[4]!;
  const a11 = a[5]!;
  const a12 = a[6]!;
  const a13 = a[7]!;
  const a20 = a[8]!;
  const a21 = a[9]!;
  const a22 = a[10]!;
  const a23 = a[11]!;
  const a30 = a[12]!;
  const a31 = a[13]!;
  const a32 = a[14]!;
  const a33 = a[15]!;

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}

/**
 * 求逆。矩阵奇异（行列式为 0）时返回 `null`。
 * 调用方必须显式处理失败，避免把退化的零矩阵悄悄带进渲染流程。
 */
export function invert(out: Mat4, a: Mat4): Mat4 | null {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a03 = a[3]!;
  const a10 = a[4]!;
  const a11 = a[5]!;
  const a12 = a[6]!;
  const a13 = a[7]!;
  const a20 = a[8]!;
  const a21 = a[9]!;
  const a22 = a[10]!;
  const a23 = a[11]!;
  const a30 = a[12]!;
  const a31 = a[13]!;
  const a32 = a[14]!;
  const a33 = a[15]!;

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  det = 1 / det;

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

/**
 * 矩阵乘法：`out = a * b`。
 *
 * 顺序很重要：顶点先被 `b` 变换，再被 `a` 变换。所以
 * `multiply(mvp, projection, model)` 得到的是「先 model 后 projection」。
 */
export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const a00 = a[0]!;
  const a01 = a[1]!;
  const a02 = a[2]!;
  const a03 = a[3]!;
  const a10 = a[4]!;
  const a11 = a[5]!;
  const a12 = a[6]!;
  const a13 = a[7]!;
  const a20 = a[8]!;
  const a21 = a[9]!;
  const a22 = a[10]!;
  const a23 = a[11]!;
  const a30 = a[12]!;
  const a31 = a[13]!;
  const a32 = a[14]!;
  const a33 = a[15]!;
  const b00 = b[0]!;
  const b01 = b[1]!;
  const b02 = b[2]!;
  const b03 = b[3]!;
  const b10 = b[4]!;
  const b11 = b[5]!;
  const b12 = b[6]!;
  const b13 = b[7]!;
  const b20 = b[8]!;
  const b21 = b[9]!;
  const b22 = b[10]!;
  const b23 = b[11]!;
  const b30 = b[12]!;
  const b31 = b[13]!;
  const b32 = b[14]!;
  const b33 = b[15]!;

  out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
  out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
  out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
  out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  return out;
}

/**
 * 把一串矩阵按顺序相乘：`multiplyAll(out, a, b, c)` 等于 `out = a * b * c`。
 * 用于链式组合投影、视图、模型矩阵，避免写层层嵌套的 `multiply`。
 */
export function multiplyAll(out: Mat4, ...matrices: Mat4[]): Mat4 {
  if (matrices.length === 0) return identity(out);
  copy(out, matrices[0]!);
  for (let i = 1; i < matrices.length; i++) multiply(out, out, matrices[i]!);
  return out;
}

/** 由平移量构造矩阵。 */
export function fromTranslation(out: Mat4, v: Float32Array): Mat4 {
  identity(out);
  out[12] = v[0]!;
  out[13] = v[1]!;
  out[14] = v[2]!;
  return out;
}

/** 由缩放量构造矩阵。 */
export function fromScaling(out: Mat4, v: Float32Array): Mat4 {
  identity(out);
  out[0] = v[0]!;
  out[5] = v[1]!;
  out[10] = v[2]!;
  return out;
}

/**
 * 由「轴 + 角度」构造旋转矩阵（右手系，逆时针为正）。
 * 轴向量会被归一化；轴长度接近 0 时退化为单位矩阵。
 */
export function fromRotation(out: Mat4, rad: number, axis: Float32Array): Mat4 {
  let x = axis[0]!;
  let y = axis[1]!;
  let z = axis[2]!;
  let len = Math.hypot(x, y, z);
  if (len < EPSILON) return identity(out);
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const t = 1 - c;

  // 罗德里格斯旋转公式展开后的矩阵元素。
  const a00 = x * x * t + c;
  const a01 = y * x * t + z * s;
  const a02 = z * x * t - y * s;
  const a10 = x * y * t - z * s;
  const a11 = y * y * t + c;
  const a12 = z * y * t + x * s;
  const a20 = x * z * t + y * s;
  const a21 = y * z * t - x * s;
  const a22 = z * z * t + c;

  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = 0;
  out[4] = a10;
  out[5] = a11;
  out[6] = a12;
  out[7] = 0;
  out[8] = a20;
  out[9] = a21;
  out[10] = a22;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

export function fromXRotation(out: Mat4, rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  identity(out);
  out[5] = c;
  out[6] = s;
  out[9] = -s;
  out[10] = c;
  return out;
}

export function fromYRotation(out: Mat4, rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  identity(out);
  out[0] = c;
  out[2] = -s;
  out[8] = s;
  out[10] = c;
  return out;
}

export function fromZRotation(out: Mat4, rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  identity(out);
  out[0] = c;
  out[1] = s;
  out[4] = -s;
  out[5] = c;
  return out;
}

/** 由「旋转 + 平移」构造矩阵（先缩放旋转，再平移）。 */
export function fromRotationTranslation(out: Mat4, rad: number, axis: Float32Array, translation: Float32Array): Mat4 {
  return fromRotationTranslationScale(out, rad, axis, translation, ONE);
}

const ONE = new Float32Array([1, 1, 1]);

/** 由「旋转 + 平移 + 缩放」构造矩阵，等价于 `T * R * S`。 */
export function fromRotationTranslationScale(
  out: Mat4,
  rad: number,
  axis: Float32Array,
  translation: Float32Array,
  scale: Float32Array,
): Mat4 {
  let x = axis[0]!;
  let y = axis[1]!;
  let z = axis[2]!;
  let len = Math.hypot(x, y, z);
  if (len < EPSILON) {
    identity(out);
    out[12] = translation[0]!;
    out[13] = translation[1]!;
    out[14] = translation[2]!;
    return out;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const t = 1 - c;

  const a00 = x * x * t + c;
  const a01 = y * x * t + z * s;
  const a02 = z * x * t - y * s;
  const a10 = x * y * t - z * s;
  const a11 = y * y * t + c;
  const a12 = z * y * t + x * s;
  const a20 = x * z * t + y * s;
  const a21 = y * z * t - x * s;
  const a22 = z * z * t + c;

  const sx = scale[0]!;
  const sy = scale[1]!;
  const sz = scale[2]!;

  out[0] = a00 * sx;
  out[1] = a01 * sx;
  out[2] = a02 * sx;
  out[3] = 0;
  out[4] = a10 * sy;
  out[5] = a11 * sy;
  out[6] = a12 * sy;
  out[7] = 0;
  out[8] = a20 * sz;
  out[9] = a21 * sz;
  out[10] = a22 * sz;
  out[11] = 0;
  out[12] = translation[0]!;
  out[13] = translation[1]!;
  out[14] = translation[2]!;
  out[15] = 1;
  return out;
}

/**
 * 由「旋转 + 平移 + 缩放 + 旋转中心」构造矩阵：`T * origin * R * S * T(-origin)`。
 * 用于让物体绕自身某个点（而不是世界原点）旋转，例如绕关节旋转的骨骼。
 */
export function fromRotationTranslationScaleOrigin(
  out: Mat4,
  rad: number,
  axis: Float32Array,
  translation: Float32Array,
  scale: Float32Array,
  origin: Float32Array,
): Mat4 {
  fromRotationTranslationScale(out, rad, axis, translation, scale);
  const ox = origin[0]!;
  const oy = origin[1]!;
  const oz = origin[2]!;
  out[12] = translation[0]! + ox - (out[0]! * ox + out[4]! * oy + out[8]! * oz);
  out[13] = translation[1]! + oy - (out[1]! * ox + out[5]! * oy + out[9]! * oz);
  out[14] = translation[2]! + oz - (out[2]! * ox + out[6]! * oy + out[10]! * oz);
  return out;
}

/** 在矩阵上叠加平移：`out = a * T(v)`。 */
export function translate(out: Mat4, a: Mat4, v: Float32Array): Mat4 {
  fromTranslation(_tmp, v);
  return multiply(out, a, _tmp);
}

/** 在矩阵上叠加缩放：`out = a * S(v)`。 */
export function scale(out: Mat4, a: Mat4, v: Float32Array): Mat4 {
  const x = v[0]!;
  const y = v[1]!;
  const z = v[2]!;
  out[0] = a[0]! * x;
  out[1] = a[1]! * x;
  out[2] = a[2]! * x;
  out[3] = a[3]! * x;
  out[4] = a[4]! * y;
  out[5] = a[5]! * y;
  out[6] = a[6]! * y;
  out[7] = a[7]! * y;
  out[8] = a[8]! * z;
  out[9] = a[9]! * z;
  out[10] = a[10]! * z;
  out[11] = a[11]! * z;
  out[12] = a[12]!;
  out[13] = a[13]!;
  out[14] = a[14]!;
  out[15] = a[15]!;
  return out;
}

/** 在矩阵上叠加绕任意轴的旋转：`out = a * R(axis, rad)`。 */
export function rotate(out: Mat4, a: Mat4, rad: number, axis: Float32Array): Mat4 {
  fromRotation(_tmp, rad, axis);
  return multiply(out, a, _tmp);
}

export function rotateX(out: Mat4, a: Mat4, rad: number): Mat4 {
  fromXRotation(_tmp, rad);
  return multiply(out, a, _tmp);
}

export function rotateY(out: Mat4, a: Mat4, rad: number): Mat4 {
  fromYRotation(_tmp, rad);
  return multiply(out, a, _tmp);
}

export function rotateZ(out: Mat4, a: Mat4, rad: number): Mat4 {
  fromZRotation(_tmp, rad);
  return multiply(out, a, _tmp);
}

/** 取出平移分量写入 `out`（`vec3`）。 */
export function getTranslation(out: Float32Array, a: Mat4): Float32Array {
  out[0] = a[12]!;
  out[1] = a[13]!;
  out[2] = a[14]!;
  return out;
}

/** 取出三个轴向的缩放长度（长度即各列的模长）。 */
export function getScaling(out: Float32Array, a: Mat4): Float32Array {
  out[0] = Math.hypot(a[0]!, a[1]!, a[2]!);
  out[1] = Math.hypot(a[4]!, a[5]!, a[6]!);
  out[2] = Math.hypot(a[8]!, a[9]!, a[10]!);
  return out;
}

/** 从矩阵中分离出旋转部分（去掉缩放），写入 3x3 矩阵。 */
export function getRotation(out: mat3.Mat3, a: Mat4): mat3.Mat3 {
  const scaling = getScaling(_tmpVec3, a);
  // 行列式为负说明含镜像，第一列取反后再归一化。
  const sign = determinant(a) < 0 ? -1 : 1;
  const sx = scaling[0]! * sign;
  const sy = scaling[1]!;
  const sz = scaling[2]!;

  out[0] = a[0]! / sx;
  out[1] = a[1]! / sx;
  out[2] = a[2]! / sx;
  out[3] = a[4]! / sy;
  out[4] = a[5]! / sy;
  out[5] = a[6]! / sy;
  out[6] = a[8]! / sz;
  out[7] = a[9]! / sz;
  out[8] = a[10]! / sz;
  return out;
}

/**
 * 右手系透视投影，裁剪空间 **z ∈ [-1, 1]**（OpenGL / WebGL2）。
 *
 * @param fovy 垂直视场角，弧度
 * @param aspect 宽高比 `width / height`
 * @param near 近裁剪面距离，必须为正
 * @param far 远裁剪面距离；传 `Infinity` 得到无限远投影
 */
export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (Number.isFinite(far)) {
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * 右手系透视投影，裁剪空间 **z ∈ [0, 1]**（WebGPU / D3D / Vulkan）。
 * 参数含义同 {@link perspective}，只是深度映射区间不同。
 */
export function perspectiveZO(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (Number.isFinite(far)) {
    out[10] = far / (near - far);
    out[14] = (far * near) / (near - far);
  } else {
    out[10] = -1;
    out[14] = -near;
  }
  return out;
}

/**
 * 在**裁剪空间**把 Y 取反：`out = diag(1, -1, 1, 1) × a`。
 *
 * 传进来的 `a` 通常是**投影矩阵**或**投影视图矩阵**；结果就是把每个顶点变换出来的
 * `gl_Position.y` / `out.position.y` 全部取反 —— 与在着色器里手写 `gl_Position.y *= -1`
 * 逐位等价（本函数只改第 1、5、9、13 个分量，列主序下正好是各列的 Y 行）。
 * 因为 Y 取反是「过 xz 平面的一次镜像」，它同时会**反转三角形的绕序**：
 * 原本逆时针（`frontFace: 'ccw'`）的三角形会变成顺时针。所以调用方如果开了背面剔除，
 * 必须把 `frontFace` 一起换过来（`'ccw'` ↔ `'cw'`），否则会把正面剔掉。
 *
 * ## 什么时候需要它
 *
 * 只在**渲染进纹理**（离屏目标）时需要，而且只在 WebGL2 上：
 * GL 的窗口原点在左下，附着到 FBO 上的纹理自下而上存储，与 WebGPU 的
 * 「纹素 (0, 0) 在左上」相反（见 `RenderTarget.rowOrder`）。把投影翻一次之后，渲染结果就落在
 * WebGPU 那一套行序上，后面的采样与读回都不必再补偿。
 *
 * **画布默认帧缓冲不要翻**：浏览器合成到屏幕那一侧本来就是对的（真实合成截图可以证明
 * 两个后端的画布原样一致率是 100%），翻了反而上下颠倒。
 *
 * ```ts
 * const projection = mat4.create();
 * if (target.rowOrder === 'bottomUp') mat4.flipClipY(projection, camera.projectionMatrix);
 * else mat4.copy(projection, camera.projectionMatrix);
 * ```
 */
export function flipClipY(out: Mat4, a: Mat4): Mat4 {
  if (out !== a) out.set(a);
  out[1] = -out[1]!;
  out[5] = -out[5]!;
  out[9] = -out[9]!;
  out[13] = -out[13]!;
  return out;
}

/** 正交投影，裁剪空间 z ∈ [-1, 1]（OpenGL / WebGL2）。 */
export function ortho(
  out: Mat4,
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Mat4 {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}

/** 正交投影，裁剪空间 z ∈ [0, 1]（WebGPU / D3D / Vulkan）。 */
export function orthoZO(
  out: Mat4,
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Mat4 {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}

/** 由 6 个裁剪面构造透视投影矩阵，自定义投影（例如左右眼不对称的 VR）时用。 */
export function frustum(
  out: Mat4,
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Mat4 {
  const rl = 1 / (right - left);
  const tb = 1 / (top - bottom);
  const nf = 1 / (near - far);

  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = 2 * far * near * nf;
  out[15] = 0;
  return out;
}

/**
 * 右手系观察矩阵：相机位于 `eye`，看向 `center`，`up` 为上方向。
 *
 * 变换后相机朝向 -Z，因此可以直接配合 {@link perspective} / {@link perspectiveZO} 使用。
 * `eye` 与 `center` 重合、或 `up` 与视线平行时会退化成零矩阵（与 gl-matrix 一致）。
 */
export function lookAt(out: Mat4, eye: Float32Array, center: Float32Array, up: Float32Array): Mat4 {
  // 视线方向的反向（相机 +Z 轴）。
  let z0 = eye[0]! - center[0]!;
  let z1 = eye[1]! - center[1]!;
  let z2 = eye[2]! - center[2]!;
  let len = Math.hypot(z0, z1, z2);
  if (len < EPSILON) return zero(out);
  len = 1 / len;
  z0 *= len;
  z1 *= len;
  z2 *= len;

  // 相机 +X 轴 = up × z
  let x0 = up[1]! * z2 - up[2]! * z1;
  let x1 = up[2]! * z0 - up[0]! * z2;
  let x2 = up[0]! * z1 - up[1]! * z0;
  len = Math.hypot(x0, x1, x2);
  if (len < EPSILON) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  // 相机 +Y 轴 = z × x（因为两者已正交，无需再归一化）
  const y0 = z1 * x2 - z2 * x1;
  const y1 = z2 * x0 - z0 * x2;
  const y2 = z0 * x1 - z1 * x0;

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eye[0]! + x1 * eye[1]! + x2 * eye[2]!);
  out[13] = -(y0 * eye[0]! + y1 * eye[1]! + y2 * eye[2]!);
  out[14] = -(z0 * eye[0]! + z1 * eye[1]! + z2 * eye[2]!);
  out[15] = 1;
  return out;
}

/**
 * 变换一个**点**：`out = (m * (x, y, z, 1)).xyz / w`，会做透视除法。
 * `w` 为 0 时按 1 处理，避免 NaN。
 */
export function transformPoint(out: Float32Array, m: Mat4, v: Float32Array): Float32Array {
  const x = v[0]!;
  const y = v[1]!;
  const z = v[2]!;
  let w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  w = w || 1;
  out[0] = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w;
  out[1] = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w;
  out[2] = (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w;
  return out;
}

/** 变换一个**方向**：忽略平移、不做透视除法，用于方向光、相机朝向等。 */
export function transformDirection(out: Float32Array, m: Mat4, v: Float32Array): Float32Array {
  const x = v[0]!;
  const y = v[1]!;
  const z = v[2]!;
  out[0] = m[0]! * x + m[4]! * y + m[8]! * z;
  out[1] = m[1]! * x + m[5]! * y + m[9]! * z;
  out[2] = m[2]! * x + m[6]! * y + m[10]! * z;
  return out;
}

export function equals(a: Mat4, b: Mat4, epsilon = 1e-6): boolean {
  for (let i = 0; i < 16; i++) {
    if (Math.abs(a[i]! - b[i]!) > epsilon) return false;
  }
  return true;
}

export function toString(a: Mat4): string {
  const rows: string[] = [];
  for (let row = 0; row < 4; row++) {
    rows.push(
      `[${a[row]}, ${a[row + 4]}, ${a[row + 8]}, ${a[row + 12]}]`,
    );
  }
  return `mat4(${rows.join(', ')})`;
}
