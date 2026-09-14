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
import { type Mat4, type Vec3 } from '../utils/math/index.js';
/** 裁剪空间深度范围的约定。 */
export type DepthRangeConvention = 'gl' | 'zo';
/** 长度为 3 的向量参数。 */
type Vec3Like = Vec3 | readonly number[];
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
export declare class PerspectiveCamera {
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
    readonly viewMatrix: Mat4;
    /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
    readonly projectionMatrixGL: Mat4;
    /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
    readonly projectionMatrixZO: Mat4;
    readonly projectionViewMatrix: Mat4;
    constructor(options?: PerspectiveCameraOptions);
    /**
     * 按 `depthRange` 选出的那一套投影矩阵。
     * 返回的就是 {@link projectionMatrixGL} 或 {@link projectionMatrixZO} 本身（同一个对象），
     * 因此可以直接上传到 uniform buffer，不需要每帧拷贝。
     */
    get projectionMatrix(): Mat4;
    /** 重新计算 view / projection / projectionView 三组矩阵。 */
    update(): void;
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
export declare class OrthographicCamera {
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
    readonly viewMatrix: Mat4;
    /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
    readonly projectionMatrixGL: Mat4;
    /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
    readonly projectionMatrixZO: Mat4;
    readonly projectionViewMatrix: Mat4;
    constructor(options?: OrthographicCameraOptions);
    /**
     * 按 `depthRange` 选出的那一套投影矩阵，返回的是另外两份矩阵之一本身（同一个对象）。
     */
    get projectionMatrix(): Mat4;
    /** 重新计算 view / projection / projectionView 三组矩阵。 */
    update(): void;
}
export {};
//# sourceMappingURL=Camera.d.ts.map