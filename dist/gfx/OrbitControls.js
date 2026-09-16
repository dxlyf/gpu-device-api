/**
 * 轨道控制器：用球坐标（radius / theta / phi）让相机绕着 `camera.target` 转。
 *
 * 交互约定：
 *
 * - 左键拖拽 = 旋转（改变 theta / phi）；
 * - 右键或中键拖拽 = 平移（沿相机自身的 right / up 轴移动 target 与 position）；
 * - 滚轮 = 缩放（改变 radius）；
 * - 触摸：单指拖拽 = 旋转，双指捏合 = 缩放。
 *
 * 实现要点：
 *
 * - 不使用四元数，状态就是 radius / theta / phi 加上待消耗的增量；
 * - 指针事件用 `pointerdown` / `pointermove` / `pointerup` / `pointercancel`，
 *   并在按下时 `setPointerCapture`，拖出元素范围也不会丢事件；
 * - `wheel` 监听必须带 `{ passive: false }` 才能 `preventDefault()` 阻止页面滚动；
 * - 相机与 target 的位置即使退化（两者重合、radius 为 0）也不会产生 NaN；
 * - 模块本身不依赖任何 DOM 全局量，可以在没有 DOM 的环境里被导入；
 *   直到构造函数收到一个合法的 element 才会碰 DOM API。
 */
import { clamp, degToRad, vec3 } from '../utils/math/index.js';
/** 极角的内部夹紧余量：phi 贴近 0 或 PI 时视线与 up 平行，view 矩阵会退化并抖动。 */
const POLAR_EPSILON = 1e-4;
/** 判断「还有增量没消化完」以及「相机位置是否变化」的阈值。 */
const CHANGE_EPSILON = 1e-6;
/** 滚轮每格的缩放基数：每格把 radius 乘以 0.95 的 zoomSpeed 次方。 */
const ZOOM_BASE = 0.95;
/** 平移计算用临时量。 */
const _offset = vec3.create();
const _right = vec3.create();
const _upAxis = vec3.create();
function assertFiniteNumber(value, name) {
    if (!Number.isFinite(value)) {
        throw new RangeError(`[gpu-device-api] ${name} must be a finite number, got ${value}.`);
    }
    return value;
}
/**
 * 轨道相机控制器。
 *
 * 每帧调用一次 {@link OrbitControls.update}，它会把累积的输入（旋转 / 平移 / 缩放）
 * 应用到相机上并返回相机是否发生了变化；返回 false 时可以跳过重绘。
 */
export class OrbitControls {
    /** 是否响应输入；置为 false 时正在进行的拖拽会停止生效，但状态仍会正常清理。 */
    enabled;
    enableRotate;
    enableZoom;
    enablePan;
    /** 是否启用阻尼。开启时输入不会立刻全部生效，而是每帧消耗 `dampingFactor` 的比例。 */
    enableDamping;
    /** 每帧消耗的阻尼比例，0 表示不动、1 表示没有阻尼。 */
    dampingFactor;
    rotateSpeed;
    zoomSpeed;
    panSpeed;
    minDistance;
    maxDistance;
    /** 极角下限，内部会再夹到 [POLAR_EPSILON, PI - POLAR_EPSILON]。 */
    minPolarAngle;
    /** 极角上限，内部会再夹到 [POLAR_EPSILON, PI - POLAR_EPSILON]。 */
    maxPolarAngle;
    camera;
    /** 统一存成 HTMLElement（HTMLCanvasElement 也是它的子类），这样事件重载能正常解析。 */
    element;
    /** 当前球坐标（每帧从相机位置重新推导，保证外部直接改 position 也有效）。 */
    theta = 0;
    phi = Math.PI / 2;
    /** 本帧待消耗的旋转增量。 */
    deltaTheta = 0;
    deltaPhi = 0;
    /** 本帧待消耗的缩放比例（乘在 radius 上，小于 1 表示拉近）。 */
    scale = 1;
    /** 本帧待消耗的平移增量（世界空间）。 */
    panOffset = vec3.create();
    /** `reset()` 要恢复到的初始状态。 */
    initialPosition = vec3.create();
    initialTarget = vec3.create();
    previousPosition = vec3.create();
    previousTarget = vec3.create();
    pointers = new Map();
    mode = 'none';
    /** 双指捏合时，上一次两指之间的距离。 */
    pinchDistance = 0;
    disposed = false;
    constructor(camera, element, options = {}) {
        // 构造函数是唯一碰 DOM 的地方：没有 element 就直接失败，而不是等到监听时报错。
        if (!element || typeof element.addEventListener !== 'function' || typeof element.removeEventListener !== 'function') {
            throw new TypeError('[gpu-device-api] OrbitControls requires a DOM element with addEventListener/removeEventListener.');
        }
        if (!camera || !camera.position || !camera.target || typeof camera.update !== 'function') {
            throw new TypeError('[gpu-device-api] OrbitControls requires a PerspectiveCamera instance.');
        }
        this.camera = camera;
        this.element = element;
        this.enabled = options.enabled ?? true;
        this.enableRotate = options.enableRotate ?? true;
        this.enableZoom = options.enableZoom ?? true;
        this.enablePan = options.enablePan ?? true;
        this.enableDamping = options.enableDamping ?? true;
        this.dampingFactor = clamp(options.dampingFactor ?? 0.08, 0, 1);
        this.rotateSpeed = assertFiniteNumber(options.rotateSpeed ?? 1, 'options.rotateSpeed');
        this.zoomSpeed = assertFiniteNumber(options.zoomSpeed ?? 1, 'options.zoomSpeed');
        this.panSpeed = assertFiniteNumber(options.panSpeed ?? 1, 'options.panSpeed');
        this.minDistance = assertFiniteNumber(options.minDistance ?? 0.1, 'options.minDistance');
        this.maxDistance = assertFiniteNumber(options.maxDistance ?? 1000, 'options.maxDistance');
        this.minPolarAngle = assertFiniteNumber(options.minPolarAngle ?? 0, 'options.minPolarAngle');
        this.maxPolarAngle = assertFiniteNumber(options.maxPolarAngle ?? Math.PI, 'options.maxPolarAngle');
        if (this.minDistance <= 0) {
            throw new RangeError(`[gpu-device-api] minDistance must be positive, got ${this.minDistance}.`);
        }
        if (this.maxDistance < this.minDistance) {
            throw new RangeError(`[gpu-device-api] maxDistance must not be smaller than minDistance, got ${this.maxDistance}.`);
        }
        if (this.minPolarAngle < 0 || this.maxPolarAngle > Math.PI || this.minPolarAngle > this.maxPolarAngle) {
            throw new RangeError(`[gpu-device-api] polar angles must satisfy 0 <= minPolarAngle <= maxPolarAngle <= PI, got ${this.minPolarAngle} and ${this.maxPolarAngle}.`);
        }
        if (this.rotateSpeed < 0 || this.zoomSpeed < 0 || this.panSpeed < 0) {
            throw new RangeError('[gpu-device-api] Speed options must be non-negative.');
        }
        vec3.copy(this.initialPosition, camera.position);
        vec3.copy(this.initialTarget, camera.target);
        vec3.copy(this.previousPosition, camera.position);
        vec3.copy(this.previousTarget, camera.target);
        this.readSpherical();
        this.element.addEventListener('pointerdown', this.onPointerDown);
        this.element.addEventListener('pointermove', this.onPointerMove);
        this.element.addEventListener('pointerup', this.onPointerUp);
        this.element.addEventListener('pointercancel', this.onPointerUp);
        this.element.addEventListener('wheel', this.onWheel, { passive: false });
        this.element.addEventListener('contextmenu', this.onContextMenu);
    }
    /** 是否已经释放。 */
    get isDisposed() {
        return this.disposed;
    }
    /**
     * 每帧调用一次：消化累积的输入并写回相机。
     *
     * @returns 相机的位置或 target 是否发生了变化（false 表示本帧不需要重绘）。
     */
    update() {
        if (this.disposed)
            return false;
        const camera = this.camera;
        const target = camera.target;
        const position = camera.position;
        vec3.copy(this.previousPosition, position);
        vec3.copy(this.previousTarget, target);
        vec3.sub(_offset, position, target);
        let radius = vec3.length(_offset);
        if (radius < CHANGE_EPSILON) {
            // 相机与 target 重合：无法从位置反推方向，沿用上一帧的 theta / phi，
            // 并把 radius 抬回 minDistance，让相机在下一帧回到合法轨道（不会出现 NaN）。
            radius = this.minDistance;
        }
        else {
            this.theta = Math.atan2(_offset[0], _offset[2]);
            this.phi = Math.acos(clamp(_offset[1] / radius, -1, 1));
        }
        const rotating = Math.abs(this.deltaTheta) > CHANGE_EPSILON || Math.abs(this.deltaPhi) > CHANGE_EPSILON;
        const zooming = Math.abs(this.scale - 1) > CHANGE_EPSILON;
        const panning = vec3.length(this.panOffset) > CHANGE_EPSILON;
        if (!rotating && !zooming && !panning) {
            return false;
        }
        // 关掉阻尼时相当于每帧把增量一次性用完。
        const consumption = this.enableDamping ? this.dampingFactor : 1;
        this.theta += this.deltaTheta * consumption;
        this.phi += this.deltaPhi * consumption;
        this.phi = clamp(this.phi, Math.max(this.minPolarAngle, POLAR_EPSILON), Math.min(this.maxPolarAngle, Math.PI - POLAR_EPSILON));
        radius = clamp(radius * this.scale, this.minDistance, this.maxDistance);
        vec3.scaleAndAdd(target, target, this.panOffset, consumption);
        const sinPhiRadius = Math.sin(this.phi) * radius;
        vec3.set(position, target[0] + sinPhiRadius * Math.sin(this.theta), target[1] + Math.cos(this.phi) * radius, target[2] + sinPhiRadius * Math.cos(this.theta));
        if (this.enableDamping) {
            this.deltaTheta *= 1 - this.dampingFactor;
            this.deltaPhi *= 1 - this.dampingFactor;
            vec3.scale(this.panOffset, this.panOffset, 1 - this.dampingFactor);
        }
        else {
            this.deltaTheta = 0;
            this.deltaPhi = 0;
            vec3.zero(this.panOffset);
        }
        this.scale = 1;
        camera.update();
        const moved = !vec3.equals(position, this.previousPosition, CHANGE_EPSILON);
        const retargeted = !vec3.equals(target, this.previousTarget, CHANGE_EPSILON);
        return moved || retargeted;
    }
    /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
    reset() {
        if (this.disposed)
            return;
        vec3.copy(this.camera.position, this.initialPosition);
        vec3.copy(this.camera.target, this.initialTarget);
        this.deltaTheta = 0;
        this.deltaPhi = 0;
        this.scale = 1;
        vec3.zero(this.panOffset);
        this.mode = 'none';
        this.pinchDistance = 0;
        this.pointers.clear();
        this.readSpherical();
        this.camera.update();
    }
    /** 移除全部事件监听。可重复调用，第二次开始是空操作。 */
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        const element = this.element;
        element.removeEventListener('pointerdown', this.onPointerDown);
        element.removeEventListener('pointermove', this.onPointerMove);
        element.removeEventListener('pointerup', this.onPointerUp);
        element.removeEventListener('pointercancel', this.onPointerUp);
        element.removeEventListener('wheel', this.onWheel);
        element.removeEventListener('contextmenu', this.onContextMenu);
        this.pointers.clear();
        this.mode = 'none';
        this.pinchDistance = 0;
    }
    /** 从相机当前位置反推 theta / phi；两者重合时保持原值。 */
    readSpherical() {
        vec3.sub(_offset, this.camera.position, this.camera.target);
        const radius = vec3.length(_offset);
        if (radius < CHANGE_EPSILON)
            return;
        this.theta = Math.atan2(_offset[0], _offset[2]);
        this.phi = Math.acos(clamp(_offset[1] / radius, -1, 1));
    }
    /** 元素的可视高度；取不到（例如无布局的测试替身）时退回 1，避免除零。 */
    clientHeight() {
        const height = this.element.clientHeight;
        return Number.isFinite(height) && height > 0 ? height : 1;
    }
    /** 当前两指之间的距离。 */
    currentPinchDistance() {
        const pointers = [...this.pointers.values()];
        const a = pointers[0];
        const b = pointers[1];
        if (a === undefined || b === undefined)
            return 0;
        return Math.hypot(a.x - b.x, a.y - b.y);
    }
    /** 所有活动指针是否都是触摸。 */
    allPointersAreTouch() {
        for (const pointer of this.pointers.values()) {
            if (pointer.type !== 'touch')
                return false;
        }
        return true;
    }
    /** 旋转：把屏幕像素位移换算成 theta / phi 增量。 */
    rotateBy(dx, dy) {
        const factor = (2 * Math.PI * this.rotateSpeed) / this.clientHeight();
        // 向右拖拽 -> theta 减小 -> 相机向左绕，画面跟着手指向右走。
        this.deltaTheta -= dx * factor;
        // 向下拖拽 -> phi 减小 -> 相机抬高，画面跟着手指向下走。
        this.deltaPhi -= dy * factor;
    }
    /**
     * 平移：沿**相机自身**的 right / up 轴移动。
     *
     * view 矩阵的第 0 / 1 行就是相机在世界空间的 right / up 轴；矩阵是列主序存储的，
     * 所以这两行分别是 (m[0], m[4], m[8]) 与 (m[1], m[5], m[9])。
     */
    panBy(dx, dy) {
        const camera = this.camera;
        const view = camera.viewMatrix;
        const height = this.clientHeight();
        vec3.sub(_offset, camera.position, camera.target);
        // 在该距离处，一屏高度对应的世界尺寸，用它把像素位移换算成世界位移。
        const targetDistance = vec3.length(_offset) * Math.tan(degToRad(camera.fov) / 2);
        const worldPerPixel = (2 * targetDistance * this.panSpeed) / height;
        vec3.set(_right, view[0], view[4], view[8]);
        vec3.set(_upAxis, view[1], view[5], view[9]);
        // 向右拖拽 -> 相机沿 -right 移动，于是画面内容跟着手指向右走。
        vec3.scaleAndAdd(this.panOffset, this.panOffset, _right, -dx * worldPerPixel);
        vec3.scaleAndAdd(this.panOffset, this.panOffset, _upAxis, dy * worldPerPixel);
    }
    onPointerDown = (event) => {
        if (!this.enabled)
            return;
        const element = this.element;
        if (typeof element.setPointerCapture === 'function') {
            element.setPointerCapture(event.pointerId);
        }
        this.pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            type: event.pointerType,
            button: event.button,
        });
        if (this.pointers.size === 1) {
            // 触摸没有可靠的 button，单指一律当作旋转；鼠标左键旋转、中键 / 右键平移。
            this.mode = event.pointerType === 'touch' || event.button === 0 ? 'rotate' : 'pan';
            this.pinchDistance = 0;
        }
        else if (this.pointers.size === 2 && this.allPointersAreTouch()) {
            this.mode = 'pinch';
            this.pinchDistance = this.currentPinchDistance();
        }
        if (event.cancelable)
            event.preventDefault();
    };
    onPointerMove = (event) => {
        if (!this.enabled)
            return;
        const pointer = this.pointers.get(event.pointerId);
        if (pointer === undefined)
            return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (this.mode === 'pinch' && this.pointers.size >= 2) {
            if (!this.enableZoom)
                return;
            const distance = this.currentPinchDistance();
            if (distance > 0 && this.pinchDistance > 0) {
                // 两指张开（distance 变大）-> scale 小于 1 -> radius 变小 -> 拉近。
                this.scale *= this.pinchDistance / distance;
            }
            this.pinchDistance = distance;
            return;
        }
        if (dx === 0 && dy === 0)
            return;
        if (this.mode === 'rotate' && this.enableRotate) {
            this.rotateBy(dx, dy);
        }
        else if (this.mode === 'pan' && this.enablePan) {
            this.panBy(dx, dy);
        }
    };
    onPointerUp = (event) => {
        // 这里不检查 enabled：拖拽中途被禁用时也必须把状态清理干净。
        if (!this.pointers.has(event.pointerId))
            return;
        this.pointers.delete(event.pointerId);
        const element = this.element;
        if (typeof element.hasPointerCapture === 'function' &&
            typeof element.releasePointerCapture === 'function' &&
            element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
        }
        if (this.pointers.size === 1) {
            // 双指变单指：重置基准，避免用捏合的距离当拖拽起点。
            for (const remaining of this.pointers.values()) {
                this.mode = remaining.type === 'touch' || remaining.button === 0 ? 'rotate' : 'pan';
                break;
            }
            this.pinchDistance = 0;
        }
        else if (this.pointers.size === 0) {
            this.mode = 'none';
            this.pinchDistance = 0;
        }
    };
    onWheel = (event) => {
        if (!this.enabled || !this.enableZoom)
            return;
        // 必须阻止默认行为，否则页面会跟着一起滚；因此注册时用了 { passive: false }。
        if (event.cancelable)
            event.preventDefault();
        const zoomScale = Math.pow(ZOOM_BASE, this.zoomSpeed);
        if (event.deltaY < 0) {
            this.scale *= zoomScale;
        }
        else if (event.deltaY > 0) {
            this.scale /= zoomScale;
        }
    };
    onContextMenu = (event) => {
        // 右键用来平移，所以要屏蔽浏览器菜单；不允许平移时保持默认行为。
        if (!this.enabled || !this.enablePan)
            return;
        if (event.cancelable)
            event.preventDefault();
    };
}
//# sourceMappingURL=OrbitControls.js.map