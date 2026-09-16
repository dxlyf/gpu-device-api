/**
 * 相机：把 `position` / `target` / `up` 三个向量换算成 view / projection 矩阵。
 *
 * 深度范围有两套互不兼容的约定，两个后端各用一套：
 *
 * - `'gl'`：裁剪空间 z 落在 [-1, 1]，WebGL2 / OpenGL 使用，对应 `mat4.perspective` / `mat4.ortho`；
 * - `'zo'`：裁剪空间 z 落在 [0, 1]，WebGPU / D3D / Vulkan 使用，对应 `mat4.perspectiveZO` / `mat4.orthoZO`。
 *
 * 相机**只保留一份投影矩阵**（{@link PerspectiveCamera.projectionMatrix}）：`update()` 按当前
 * `depthRange` 选用上面两套函数中的一个算出来，`projectionViewMatrix` 也跟着它一起刷新。
 * 换到另一个后端时把 `depthRange` 改掉即可 —— **改动会让缓存的那一份失效**，下一次 `update()`
 * （或者任何一次读取 `projectionMatrix` / `projectionViewMatrix`）会按新的约定重算，
 * 所以绝不会读到「上一种约定留下的那一份」。改 `fov` / `aspect` / `near` / `far` 之后照旧要
 * 调用一次 `update()`：那是让这些改动生效的入口。
 *
 * 矩阵布局沿用 `src/utils/math` 的列主序约定；view 矩阵由 `mat4.lookAt` 生成，
 * 相机看向自身局部 -Z 方向，因此可以直接和投影矩阵相乘。
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
 * `update()` 会依次刷新 view 矩阵、**一份**投影矩阵（按当前 `depthRange` 算）、以及
 * `projectionMatrix * viewMatrix`。直接改 `position` / `target` / `up` / `fov` / `aspect` /
 * `near` / `far` 后记得调用一次 `update()`；只改 `depthRange` 时缓存会自动失效（见类文件头的说明）。
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
    readonly viewMatrix: Mat4;
    /** 唯一的那份投影矩阵缓冲（对外通过 {@link projectionMatrix} 读取）。 */
    private readonly projectionBuffer;
    /** 唯一的那份投影视图矩阵缓冲（对外通过 {@link projectionViewMatrix} 读取）。 */
    private readonly projectionViewBuffer;
    /** `depthRange` 的实际存储；见 {@link PerspectiveCamera.depthRange} 的说明。 */
    private _depthRange;
    /**
     * 上一次算投影矩阵用的是哪种深度约定；与 `_depthRange` 不一致就说明缓存失效
     * （读取时由 {@link PerspectiveCamera.ensureProjection} 重算，而不是把旧的读出去）。
     */
    private projectedDepthRange;
    constructor(options?: PerspectiveCameraOptions);
    /**
     * 使用哪一套深度范围约定。
     *
     * 换一个取值会让**缓存的那份投影矩阵立即失效**：下一次读取 {@link projectionMatrix} /
     * {@link projectionViewMatrix}（或下一次 `update()`）会按新的约定重算，所以不会出现
     * 「改了 `depthRange` 却还拿着上一种约定的矩阵」这种静默错误。
     */
    get depthRange(): DepthRangeConvention;
    set depthRange(value: DepthRangeConvention);
    /**
     * 按当前 `depthRange` 算出来的**那一份**投影矩阵（z ∈ [-1, 1] 或 z ∈ [0, 1]）。
     *
     * 返回的是相机内部那块缓冲**本身**（对象身份稳定，可直接上传 uniform、不需要每帧拷贝）。
     * 读取时如果 `depthRange` 换过而还没重算，会按新约定就地重算，所以它永远与 `depthRange` 一致。
     */
    get projectionMatrix(): Mat4;
    /** `projectionMatrix × viewMatrix`，与 {@link projectionMatrix} 同源（同一份投影、同一个对象）。 */
    get projectionViewMatrix(): Mat4;
    /** 重新计算 view / **一份** projection / projectionView 三组矩阵（按当前 `depthRange`）。 */
    update(): void;
    /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
    private computeProjection;
    /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
    private ensureProjection;
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
 * 投影矩阵由 `mat4.ortho` 与 `mat4.orthoZO` 按 `depthRange` 选一个生成（同样只有**一份**）。
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
    readonly viewMatrix: Mat4;
    /** 唯一的那份投影矩阵缓冲（对外通过 {@link projectionMatrix} 读取）。 */
    private readonly projectionBuffer;
    /** 唯一的那份投影视图矩阵缓冲（对外通过 {@link projectionViewMatrix} 读取）。 */
    private readonly projectionViewBuffer;
    /** `depthRange` 的实际存储；见 {@link OrthographicCamera.depthRange} 的说明。 */
    private _depthRange;
    /** 上一次算投影矩阵用的是哪种深度约定；不一致就说明缓存失效（见 `ensureProjection`）。 */
    private projectedDepthRange;
    constructor(options?: OrthographicCameraOptions);
    /**
     * 使用哪一套深度范围约定。
     *
     * 与 {@link PerspectiveCamera.depthRange} 完全同义：换取值会让缓存的那份投影矩阵失效，
     * 下次读取（或下一次 `update()`）按新约定重算。
     */
    get depthRange(): DepthRangeConvention;
    set depthRange(value: DepthRangeConvention);
    /**
     * 按当前 `depthRange` 算出来的**那一份**投影矩阵；返回内部缓冲本身（对象身份稳定）。
     * 读取时若 `depthRange` 换过而还没重算，会按新约定就地重算。
     */
    get projectionMatrix(): Mat4;
    /** `projectionMatrix × viewMatrix`，与 {@link projectionMatrix} 同源。 */
    get projectionViewMatrix(): Mat4;
    /** 重新计算 view / **一份** projection / projectionView 三组矩阵（按当前 `depthRange`）。 */
    update(): void;
    /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
    private computeProjection;
    /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
    private ensureProjection;
}
export {};
//# sourceMappingURL=Camera.d.ts.map