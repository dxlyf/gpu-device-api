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
import { degToRad, mat4, vec3 } from '../utils/math/index.js';
/** `position` 与 `target` 距离小于该值时认为两者重合。 */
const EYE_TARGET_EPSILON = 1e-6;
/** view 矩阵推导用临时量，避免每帧分配。 */
const _offset = vec3.create();
const _fallbackEye = vec3.create();
/**
 * 把外部传入的向量写进 `out`；`value` 为 undefined 时使用默认值。
 * 长度不足 3 或含非有限数时抛错，避免把 NaN 带进矩阵。
 */
function setVec3(out, value, dx, dy, dz) {
    if (value === undefined)
        return vec3.set(out, dx, dy, dz);
    if (value.length < 3) {
        throw new RangeError('[gpu-device-api] A vector option needs at least 3 components.');
    }
    const x = value[0];
    const y = value[1];
    const z = value[2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${x}, ${y}, ${z}).`);
    }
    return vec3.set(out, x, y, z);
}
/** aspect 非法时退回 1，保证投影矩阵里不出现 Infinity / NaN。 */
function safeAspect(aspect) {
    return Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
}
/** 校验透视相机的视场角与裁剪面。 */
function validatePerspective(fov, near, far) {
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
function validateOrthographic(size, near, far) {
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
function updateViewMatrix(camera) {
    vec3.sub(_offset, camera.position, camera.target);
    if (vec3.length(_offset) < EYE_TARGET_EPSILON) {
        vec3.set(_fallbackEye, camera.target[0], camera.target[1], camera.target[2] + 1);
        mat4.lookAt(camera.viewMatrix, _fallbackEye, camera.target, camera.up);
        return;
    }
    mat4.lookAt(camera.viewMatrix, camera.position, camera.target, camera.up);
}
/**
 * 透视相机。
 *
 * `update()` 会依次刷新 view 矩阵、**一份**投影矩阵（按当前 `depthRange` 算）、以及
 * `projectionMatrix * viewMatrix`。直接改 `position` / `target` / `up` / `fov` / `aspect` /
 * `near` / `far` 后记得调用一次 `update()`；只改 `depthRange` 时缓存会自动失效（见类文件头的说明）。
 */
export class PerspectiveCamera {
    /** 相机位置（世界空间）。 */
    position;
    /** 视线落点（世界空间）。 */
    target;
    /** 上方向。 */
    up;
    /** 垂直视场角，角度制。 */
    fov;
    /** 近裁剪面距离。 */
    near;
    /** 远裁剪面距离。 */
    far;
    /** 宽高比 `width / height`。 */
    aspect;
    viewMatrix = mat4.create();
    /** 唯一的那份投影矩阵缓冲（对外通过 {@link projectionMatrix} 读取）。 */
    projectionBuffer = mat4.create();
    /** 唯一的那份投影视图矩阵缓冲（对外通过 {@link projectionViewMatrix} 读取）。 */
    projectionViewBuffer = mat4.create();
    /** `depthRange` 的实际存储；见 {@link PerspectiveCamera.depthRange} 的说明。 */
    _depthRange;
    /**
     * 上一次算投影矩阵用的是哪种深度约定；与 `_depthRange` 不一致就说明缓存失效
     * （读取时由 {@link PerspectiveCamera.ensureProjection} 重算，而不是把旧的读出去）。
     */
    projectedDepthRange = null;
    constructor(options = {}) {
        this.position = setVec3(vec3.create(), options.position, 0, 0, 5);
        this.target = setVec3(vec3.create(), options.target, 0, 0, 0);
        this.up = setVec3(vec3.create(), options.up, 0, 1, 0);
        this.fov = options.fov ?? 60;
        this.near = options.near ?? 0.1;
        this.far = options.far ?? 1000;
        this.aspect = options.aspect ?? 1;
        this._depthRange = options.depthRange ?? 'gl';
        this.update();
    }
    /**
     * 使用哪一套深度范围约定。
     *
     * 换一个取值会让**缓存的那份投影矩阵立即失效**：下一次读取 {@link projectionMatrix} /
     * {@link projectionViewMatrix}（或下一次 `update()`）会按新的约定重算，所以不会出现
     * 「改了 `depthRange` 却还拿着上一种约定的矩阵」这种静默错误。
     */
    get depthRange() {
        return this._depthRange;
    }
    set depthRange(value) {
        if (value === this._depthRange)
            return;
        this._depthRange = value;
        // 只标记失效，不在赋值时立刻算：真正读取（或下一次 update()）时才算一次，
        // 这样「先改 depthRange、再改 fov、最后 update()」只会算一遍。
        this.projectedDepthRange = null;
    }
    /**
     * 按当前 `depthRange` 算出来的**那一份**投影矩阵（z ∈ [-1, 1] 或 z ∈ [0, 1]）。
     *
     * 返回的是相机内部那块缓冲**本身**（对象身份稳定，可直接上传 uniform、不需要每帧拷贝）。
     * 读取时如果 `depthRange` 换过而还没重算，会按新约定就地重算，所以它永远与 `depthRange` 一致。
     */
    get projectionMatrix() {
        this.ensureProjection();
        return this.projectionBuffer;
    }
    /** `projectionMatrix × viewMatrix`，与 {@link projectionMatrix} 同源（同一份投影、同一个对象）。 */
    get projectionViewMatrix() {
        this.ensureProjection();
        return this.projectionViewBuffer;
    }
    /** 重新计算 view / **一份** projection / projectionView 三组矩阵（按当前 `depthRange`）。 */
    update() {
        validatePerspective(this.fov, this.near, this.far);
        updateViewMatrix(this);
        // 投影与 projectionView 是一体的（后者=前者×view），所以只算这一处。
        // `fov` / `aspect` / `near` / `far` 都是公开可变字段，`update()` 就是让它们生效的入口，
        // 所以这里**无条件**重算 —— 不存在「参数变了但命中旧缓存」的路径。
        this.computeProjection();
    }
    /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
    computeProjection() {
        const fovy = degToRad(this.fov);
        const aspect = safeAspect(this.aspect);
        if (this._depthRange === 'zo') {
            mat4.perspectiveZO(this.projectionBuffer, fovy, aspect, this.near, this.far);
        }
        else {
            mat4.perspective(this.projectionBuffer, fovy, aspect, this.near, this.far);
        }
        this.projectedDepthRange = this._depthRange;
        mat4.multiply(this.projectionViewBuffer, this.projectionBuffer, this.viewMatrix);
    }
    /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
    ensureProjection() {
        if (this.projectedDepthRange === this._depthRange)
            return;
        this.computeProjection();
    }
}
/**
 * 正交相机。字段与 {@link PerspectiveCamera} 完全对应，只是用 `size`（视口高度）代替了 `fov`，
 * 投影矩阵由 `mat4.ortho` 与 `mat4.orthoZO` 按 `depthRange` 选一个生成（同样只有**一份**）。
 */
export class OrthographicCamera {
    /** 相机位置（世界空间）。 */
    position;
    /** 视线落点（世界空间）。 */
    target;
    /** 上方向。 */
    up;
    /** 视口在垂直方向覆盖的世界高度。 */
    size;
    /** 近裁剪面距离。 */
    near;
    /** 远裁剪面距离。 */
    far;
    /** 宽高比 `width / height`。 */
    aspect;
    viewMatrix = mat4.create();
    /** 唯一的那份投影矩阵缓冲（对外通过 {@link projectionMatrix} 读取）。 */
    projectionBuffer = mat4.create();
    /** 唯一的那份投影视图矩阵缓冲（对外通过 {@link projectionViewMatrix} 读取）。 */
    projectionViewBuffer = mat4.create();
    /** `depthRange` 的实际存储；见 {@link OrthographicCamera.depthRange} 的说明。 */
    _depthRange;
    /** 上一次算投影矩阵用的是哪种深度约定；不一致就说明缓存失效（见 `ensureProjection`）。 */
    projectedDepthRange = null;
    constructor(options = {}) {
        this.position = setVec3(vec3.create(), options.position, 0, 0, 5);
        this.target = setVec3(vec3.create(), options.target, 0, 0, 0);
        this.up = setVec3(vec3.create(), options.up, 0, 1, 0);
        this.size = options.size ?? 2;
        this.near = options.near ?? 0.1;
        this.far = options.far ?? 1000;
        this.aspect = options.aspect ?? 1;
        this._depthRange = options.depthRange ?? 'gl';
        this.update();
    }
    /**
     * 使用哪一套深度范围约定。
     *
     * 与 {@link PerspectiveCamera.depthRange} 完全同义：换取值会让缓存的那份投影矩阵失效，
     * 下次读取（或下一次 `update()`）按新约定重算。
     */
    get depthRange() {
        return this._depthRange;
    }
    set depthRange(value) {
        if (value === this._depthRange)
            return;
        this._depthRange = value;
        this.projectedDepthRange = null;
    }
    /**
     * 按当前 `depthRange` 算出来的**那一份**投影矩阵；返回内部缓冲本身（对象身份稳定）。
     * 读取时若 `depthRange` 换过而还没重算，会按新约定就地重算。
     */
    get projectionMatrix() {
        this.ensureProjection();
        return this.projectionBuffer;
    }
    /** `projectionMatrix × viewMatrix`，与 {@link projectionMatrix} 同源。 */
    get projectionViewMatrix() {
        this.ensureProjection();
        return this.projectionViewBuffer;
    }
    /** 重新计算 view / **一份** projection / projectionView 三组矩阵（按当前 `depthRange`）。 */
    update() {
        validateOrthographic(this.size, this.near, this.far);
        updateViewMatrix(this);
        this.computeProjection();
    }
    /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
    computeProjection() {
        const halfHeight = this.size / 2;
        const halfWidth = halfHeight * safeAspect(this.aspect);
        if (this._depthRange === 'zo') {
            mat4.orthoZO(this.projectionBuffer, -halfWidth, halfWidth, -halfHeight, halfHeight, this.near, this.far);
        }
        else {
            mat4.ortho(this.projectionBuffer, -halfWidth, halfWidth, -halfHeight, halfHeight, this.near, this.far);
        }
        this.projectedDepthRange = this._depthRange;
        mat4.multiply(this.projectionViewBuffer, this.projectionBuffer, this.viewMatrix);
    }
    /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
    ensureProjection() {
        if (this.projectedDepthRange === this._depthRange)
            return;
        this.computeProjection();
    }
}
//# sourceMappingURL=Camera.js.map