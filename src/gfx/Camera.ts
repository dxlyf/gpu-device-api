/**
 * 相机：把 `position` / `target` / `up` 三个向量换算成 view / projection 矩阵。
 *
 * 深度范围有两套互不兼容的约定，两个后端各用一套：
 *
 * - `'gl'`：裁剪空间 z 落在 [-1, 1]，WebGL2 / OpenGL 使用，对应 `mat4.perspective` / `mat4.ortho`；
 * - `'zo'`：裁剪空间 z 落在 [0, 1]，WebGPU / D3D / Vulkan 使用，对应 `mat4.perspectiveZO` / `mat4.orthoZO`。
 *
 * 相机永远同时算出两套投影矩阵（{@link PerspectiveCamera.projectionMatrixGL} 与
 * {@link PerspectiveCamera.projectionMatrixZO}），再用 `depthRange` 决定
 * `projectionMatrix` 暴露哪一套。这样同一个相机对象在切换后端时不需要重建，
 * `depthRange` 改完调用一次 `update()` 即可。
 *
 * 矩阵布局沿用 `src/utils/math` 的列主序约定；view 矩阵由 `mat4.lookAt` 生成，
 * 相机看向自身局部 -Z 方向，因此可以直接和两套投影矩阵相乘。
 */

import { degToRad, mat4, vec3, type Mat4, type Vec3 } from '../utils/math/index.js';

/** 裁剪空间深度范围的约定。 */
export type DepthRangeConvention = 'gl' | 'zo';

/** `position` 与 `target` 距离小于该值时认为两者重合。 */
const EYE_TARGET_EPSILON = 1e-6;

/** 长度为 3 的向量参数。 */
type Vec3Like = Vec3 | readonly number[];

/** 可读写 view 矩阵的相机基元，供模块内部共享 view 矩阵的推导。 */
interface CameraBasis {
  readonly position: Vec3;
  readonly target: Vec3;
  readonly up: Vec3;
  readonly viewMatrix: Mat4;
}

/** view 矩阵推导用临时量，避免每帧分配。 */
const _offset = vec3.create();
const _fallbackEye = vec3.create();

/**
 * 把外部传入的向量写进 `out`；`value` 为 undefined 时使用默认值。
 * 长度不足 3 或含非有限数时抛错，避免把 NaN 带进矩阵。
 */
function setVec3(out: Vec3, value: Vec3Like | undefined, dx: number, dy: number, dz: number): Vec3 {
  if (value === undefined) return vec3.set(out, dx, dy, dz);
  if (value.length < 3) {
    throw new RangeError('[gpu-device-api] A vector option needs at least 3 components.');
  }
  const x = value[0]!;
  const y = value[1]!;
  const z = value[2]!;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${x}, ${y}, ${z}).`);
  }
  return vec3.set(out, x, y, z);
}

/** aspect 非法时退回 1，保证投影矩阵里不出现 Infinity / NaN。 */
function safeAspect(aspect: number): number {
  return Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
}

/** 校验透视相机的视场角与裁剪面。 */
function validatePerspective(fov: number, near: number, far: number): void {
  if (!(fov > 0) || fov >= 180) {
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${fov}.`);
  }
  if (!(near > 0)) {
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${near}.`);
  }
  if (Number.isNaN(far) || far <= near) {
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${far}.`);
  }
}

/** 校验正交相机的视口高度与裁剪面。 */
function validateOrthographic(size: number, near: number, far: number): void {
  if (!Number.isFinite(size) || size <= 0) {
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${size}.`);
  }
  if (!Number.isFinite(near) || Number.isNaN(far) || far <= near) {
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${near}, far = ${far}.`);
  }
}

/**
 * 生成 view 矩阵。
 *
 * `position` 与 `target` 重合时无法确定视线方向，`mat4.lookAt` 会退化成全零矩阵
 * （画面直接消失）。这里改成把临时视点沿 +Z 挪开 1 个单位，得到一个可用且不含 NaN 的
 * view 矩阵；相机的 `position` / `target` 本身不会被修改。
 */
function updateViewMatrix(camera: CameraBasis): void {
  vec3.sub(_offset, camera.position, camera.target);
  if (vec3.length(_offset) < EYE_TARGET_EPSILON) {
    vec3.set(_fallbackEye, camera.target[0]!, camera.target[1]!, camera.target[2]! + 1);
    mat4.lookAt(camera.viewMatrix, _fallbackEye, camera.target, camera.up);
    return;
  }
  mat4.lookAt(camera.viewMatrix, camera.position, camera.target, camera.up);
}

/** {@link PerspectiveCamera} 的构造参数。 */
export interface PerspectiveCameraOptions {
  /** 垂直视场角，**角度制**，默认 60。 */
  fov?: number;
  /** 宽高比 `width / height`，默认 1。 */
  aspect?: number;
  /** 近裁剪面距离，默认 0.1，必须为正。 */
  near?: number;
  /** 远裁剪面距离，默认 1000，可以传 `Infinity`。 */
  far?: number;
  /** 深度范围约定，默认 `'gl'`。 */
  depthRange?: DepthRangeConvention;
  /** 相机位置，默认 (0, 0, 5)。 */
  position?: Vec3Like;
  /** 观察目标，默认原点。 */
  target?: Vec3Like;
  /** 上方向，默认 +Y。 */
  up?: Vec3Like;
}

/**
 * 透视相机。
 *
 * `update()` 会依次刷新 view 矩阵、两套投影矩阵、以及 `projectionMatrix * viewMatrix`。
 * 直接改 `position` / `target` / `up` / `fov` / `aspect` 后记得调用一次 `update()`。
 */
export class PerspectiveCamera {
  /** 相机位置（世界空间）。 */
  readonly position: Vec3;
  /** 视线落点（世界空间）。 */
  readonly target: Vec3;
  /** 上方向。 */
  readonly up: Vec3;

  /** 垂直视场角，角度制。 */
  fov: number;
  /** 近裁剪面距离。 */
  near: number;
  /** 远裁剪面距离。 */
  far: number;
  /** 宽高比 `width / height`。 */
  aspect: number;
  /** 使用哪一套深度范围约定，决定 `projectionMatrix` 指向两份矩阵中的哪一份。 */
  depthRange: DepthRangeConvention;

  readonly viewMatrix: Mat4 = mat4.create();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  readonly projectionMatrixGL: Mat4 = mat4.create();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  readonly projectionMatrixZO: Mat4 = mat4.create();
  readonly projectionViewMatrix: Mat4 = mat4.create();

  constructor(options: PerspectiveCameraOptions = {}) {
    this.position = setVec3(vec3.create(), options.position, 0, 0, 5);
    this.target = setVec3(vec3.create(), options.target, 0, 0, 0);
    this.up = setVec3(vec3.create(), options.up, 0, 1, 0);

    this.fov = options.fov ?? 60;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 1000;
    this.aspect = options.aspect ?? 1;
    this.depthRange = options.depthRange ?? 'gl';

    this.update();
  }

  /**
   * 按 `depthRange` 选出的那一套投影矩阵。
   * 返回的就是 {@link projectionMatrixGL} 或 {@link projectionMatrixZO} 本身（同一个对象），
   * 因此可以直接上传到 uniform buffer，不需要每帧拷贝。
   */
  get projectionMatrix(): Mat4 {
    return this.depthRange === 'zo' ? this.projectionMatrixZO : this.projectionMatrixGL;
  }

  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update(): void {
    validatePerspective(this.fov, this.near, this.far);

    updateViewMatrix(this);

    const fovy = degToRad(this.fov);
    const aspect = safeAspect(this.aspect);
    mat4.perspective(this.projectionMatrixGL, fovy, aspect, this.near, this.far);
    mat4.perspectiveZO(this.projectionMatrixZO, fovy, aspect, this.near, this.far);
    mat4.multiply(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}

/** {@link OrthographicCamera} 的构造参数。 */
export interface OrthographicCameraOptions {
  /** 视口在垂直方向覆盖的世界高度（上下各占 size / 2），默认 2；水平范围由 aspect 推出。 */
  size?: number;
  /** 宽高比 `width / height`，默认 1。 */
  aspect?: number;
  /** 近裁剪面距离，默认 0.1。 */
  near?: number;
  /** 远裁剪面距离，默认 1000。 */
  far?: number;
  /** 深度范围约定，默认 `'gl'`。 */
  depthRange?: DepthRangeConvention;
  /** 相机位置，默认 (0, 0, 5)。 */
  position?: Vec3Like;
  /** 观察目标，默认原点。 */
  target?: Vec3Like;
  /** 上方向，默认 +Y。 */
  up?: Vec3Like;
}

/**
 * 正交相机。字段与 {@link PerspectiveCamera} 完全对应，只是用 `size`（视口高度）代替了 `fov`，
 * 投影矩阵由 `mat4.ortho` 与 `mat4.orthoZO` 生成。
 */
export class OrthographicCamera {
  /** 相机位置（世界空间）。 */
  readonly position: Vec3;
  /** 视线落点（世界空间）。 */
  readonly target: Vec3;
  /** 上方向。 */
  readonly up: Vec3;

  /** 视口在垂直方向覆盖的世界高度。 */
  size: number;
  /** 近裁剪面距离。 */
  near: number;
  /** 远裁剪面距离。 */
  far: number;
  /** 宽高比 `width / height`。 */
  aspect: number;
  /** 使用哪一套深度范围约定，决定 `projectionMatrix` 指向两份矩阵中的哪一份。 */
  depthRange: DepthRangeConvention;

  readonly viewMatrix: Mat4 = mat4.create();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  readonly projectionMatrixGL: Mat4 = mat4.create();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  readonly projectionMatrixZO: Mat4 = mat4.create();
  readonly projectionViewMatrix: Mat4 = mat4.create();

  constructor(options: OrthographicCameraOptions = {}) {
    this.position = setVec3(vec3.create(), options.position, 0, 0, 5);
    this.target = setVec3(vec3.create(), options.target, 0, 0, 0);
    this.up = setVec3(vec3.create(), options.up, 0, 1, 0);

    this.size = options.size ?? 2;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 1000;
    this.aspect = options.aspect ?? 1;
    this.depthRange = options.depthRange ?? 'gl';

    this.update();
  }

  /**
   * 按 `depthRange` 选出的那一套投影矩阵，返回的是另外两份矩阵之一本身（同一个对象）。
   */
  get projectionMatrix(): Mat4 {
    return this.depthRange === 'zo' ? this.projectionMatrixZO : this.projectionMatrixGL;
  }

  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update(): void {
    validateOrthographic(this.size, this.near, this.far);

    updateViewMatrix(this);

    const halfHeight = this.size / 2;
    const halfWidth = halfHeight * safeAspect(this.aspect);
    mat4.ortho(this.projectionMatrixGL, -halfWidth, halfWidth, -halfHeight, halfHeight, this.near, this.far);
    mat4.orthoZO(this.projectionMatrixZO, -halfWidth, halfWidth, -halfHeight, halfHeight, this.near, this.far);
    mat4.multiply(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
