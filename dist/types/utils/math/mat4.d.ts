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
/** 创建单位矩阵。 */
export declare function create(): Mat4;
/** 写入单位矩阵。 */
export declare function identity(out: Mat4): Mat4;
export declare function clone(a: Mat4): Mat4;
/** 全零矩阵（会退化为不可逆，仅作明确的初始值用）。 */
export declare function zero(out: Mat4): Mat4;
/** 按列主序传入 16 个分量。 */
export declare function fromValues(...values: number[]): Mat4;
export declare function copy(out: Mat4, a: Mat4): Mat4;
/** 按列主序逐个写入 16 个分量。 */
export declare function set(out: Mat4, ...values: number[]): Mat4;
/** 转置。 */
export declare function transpose(out: Mat4, a: Mat4): Mat4;
/** 行列式。 */
export declare function determinant(a: Mat4): number;
/**
 * 求逆。矩阵奇异（行列式为 0）时返回 `null`。
 * 调用方必须显式处理失败，避免把退化的零矩阵悄悄带进渲染流程。
 */
export declare function invert(out: Mat4, a: Mat4): Mat4 | null;
/**
 * 矩阵乘法：`out = a * b`。
 *
 * 顺序很重要：顶点先被 `b` 变换，再被 `a` 变换。所以
 * `multiply(mvp, projection, model)` 得到的是「先 model 后 projection」。
 */
export declare function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4;
/**
 * 把一串矩阵按顺序相乘：`multiplyAll(out, a, b, c)` 等于 `out = a * b * c`。
 * 用于链式组合投影、视图、模型矩阵，避免写层层嵌套的 `multiply`。
 */
export declare function multiplyAll(out: Mat4, ...matrices: Mat4[]): Mat4;
/** 由平移量构造矩阵。 */
export declare function fromTranslation(out: Mat4, v: Float32Array): Mat4;
/** 由缩放量构造矩阵。 */
export declare function fromScaling(out: Mat4, v: Float32Array): Mat4;
/**
 * 由「轴 + 角度」构造旋转矩阵（右手系，逆时针为正）。
 * 轴向量会被归一化；轴长度接近 0 时退化为单位矩阵。
 */
export declare function fromRotation(out: Mat4, rad: number, axis: Float32Array): Mat4;
export declare function fromXRotation(out: Mat4, rad: number): Mat4;
export declare function fromYRotation(out: Mat4, rad: number): Mat4;
export declare function fromZRotation(out: Mat4, rad: number): Mat4;
/** 由「旋转 + 平移」构造矩阵（先缩放旋转，再平移）。 */
export declare function fromRotationTranslation(out: Mat4, rad: number, axis: Float32Array, translation: Float32Array): Mat4;
/** 由「旋转 + 平移 + 缩放」构造矩阵，等价于 `T * R * S`。 */
export declare function fromRotationTranslationScale(out: Mat4, rad: number, axis: Float32Array, translation: Float32Array, scale: Float32Array): Mat4;
/**
 * 由「旋转 + 平移 + 缩放 + 旋转中心」构造矩阵：`T * origin * R * S * T(-origin)`。
 * 用于让物体绕自身某个点（而不是世界原点）旋转，例如绕关节旋转的骨骼。
 */
export declare function fromRotationTranslationScaleOrigin(out: Mat4, rad: number, axis: Float32Array, translation: Float32Array, scale: Float32Array, origin: Float32Array): Mat4;
/** 在矩阵上叠加平移：`out = a * T(v)`。 */
export declare function translate(out: Mat4, a: Mat4, v: Float32Array): Mat4;
/** 在矩阵上叠加缩放：`out = a * S(v)`。 */
export declare function scale(out: Mat4, a: Mat4, v: Float32Array): Mat4;
/** 在矩阵上叠加绕任意轴的旋转：`out = a * R(axis, rad)`。 */
export declare function rotate(out: Mat4, a: Mat4, rad: number, axis: Float32Array): Mat4;
export declare function rotateX(out: Mat4, a: Mat4, rad: number): Mat4;
export declare function rotateY(out: Mat4, a: Mat4, rad: number): Mat4;
export declare function rotateZ(out: Mat4, a: Mat4, rad: number): Mat4;
/** 取出平移分量写入 `out`（`vec3`）。 */
export declare function getTranslation(out: Float32Array, a: Mat4): Float32Array;
/** 取出三个轴向的缩放长度（长度即各列的模长）。 */
export declare function getScaling(out: Float32Array, a: Mat4): Float32Array;
/** 从矩阵中分离出旋转部分（去掉缩放），写入 3x3 矩阵。 */
export declare function getRotation(out: mat3.Mat3, a: Mat4): mat3.Mat3;
/**
 * 右手系透视投影，裁剪空间 **z ∈ [-1, 1]**（OpenGL / WebGL2）。
 *
 * @param fovy 垂直视场角，弧度
 * @param aspect 宽高比 `width / height`
 * @param near 近裁剪面距离，必须为正
 * @param far 远裁剪面距离；传 `Infinity` 得到无限远投影
 */
export declare function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4;
/**
 * 右手系透视投影，裁剪空间 **z ∈ [0, 1]**（WebGPU / D3D / Vulkan）。
 * 参数含义同 {@link perspective}，只是深度映射区间不同。
 */
export declare function perspectiveZO(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4;
/** 正交投影，裁剪空间 z ∈ [-1, 1]（OpenGL / WebGL2）。 */
export declare function ortho(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
/** 正交投影，裁剪空间 z ∈ [0, 1]（WebGPU / D3D / Vulkan）。 */
export declare function orthoZO(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
/** 由 6 个裁剪面构造透视投影矩阵，自定义投影（例如左右眼不对称的 VR）时用。 */
export declare function frustum(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
/**
 * 右手系观察矩阵：相机位于 `eye`，看向 `center`，`up` 为上方向。
 *
 * 变换后相机朝向 -Z，因此可以直接配合 {@link perspective} / {@link perspectiveZO} 使用。
 * `eye` 与 `center` 重合、或 `up` 与视线平行时会退化成零矩阵（与 gl-matrix 一致）。
 */
export declare function lookAt(out: Mat4, eye: Float32Array, center: Float32Array, up: Float32Array): Mat4;
/**
 * 变换一个**点**：`out = (m * (x, y, z, 1)).xyz / w`，会做透视除法。
 * `w` 为 0 时按 1 处理，避免 NaN。
 */
export declare function transformPoint(out: Float32Array, m: Mat4, v: Float32Array): Float32Array;
/** 变换一个**方向**：忽略平移、不做透视除法，用于方向光、相机朝向等。 */
export declare function transformDirection(out: Float32Array, m: Mat4, v: Float32Array): Float32Array;
export declare function equals(a: Mat4, b: Mat4, epsilon?: number): boolean;
export declare function toString(a: Mat4): string;
//# sourceMappingURL=mat4.d.ts.map