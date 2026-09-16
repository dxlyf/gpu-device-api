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
import type { PerspectiveCamera } from './Camera.js';
/** {@link OrbitControls} 的构造参数。 */
export interface OrbitControlsOptions {
    /** 是否响应输入，默认 true。 */
    enabled?: boolean;
    /** 是否允许旋转，默认 true。 */
    enableRotate?: boolean;
    /** 是否允许缩放，默认 true。 */
    enableZoom?: boolean;
    /** 是否允许平移，默认 true。 */
    enablePan?: boolean;
    /** 是否启用阻尼（惯性），默认 true。 */
    enableDamping?: boolean;
    /** 阻尼系数，默认 0.08，会被夹到 [0, 1]。 */
    dampingFactor?: number;
    /** 旋转速度倍率，默认 1。 */
    rotateSpeed?: number;
    /** 缩放速度倍率，默认 1。 */
    zoomSpeed?: number;
    /** 平移速度倍率，默认 1。 */
    panSpeed?: number;
    /** 相机到 target 的最小距离，默认 0.1。 */
    minDistance?: number;
    /** 相机到 target 的最大距离，默认 1000。 */
    maxDistance?: number;
    /** 极角下限（弧度，0 表示相机在 target 正上方），默认 0。 */
    minPolarAngle?: number;
    /** 极角上限（弧度，PI 表示相机在 target 正下方），默认 Math.PI。 */
    maxPolarAngle?: number;
}
/**
 * 轨道相机控制器。
 *
 * 每帧调用一次 {@link OrbitControls.update}，它会把累积的输入（旋转 / 平移 / 缩放）
 * 应用到相机上并返回相机是否发生了变化；返回 false 时可以跳过重绘。
 */
export declare class OrbitControls {
    /** 是否响应输入；置为 false 时正在进行的拖拽会停止生效，但状态仍会正常清理。 */
    enabled: boolean;
    enableRotate: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    /** 是否启用阻尼。开启时输入不会立刻全部生效，而是每帧消耗 `dampingFactor` 的比例。 */
    enableDamping: boolean;
    /** 每帧消耗的阻尼比例，0 表示不动、1 表示没有阻尼。 */
    dampingFactor: number;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    minDistance: number;
    maxDistance: number;
    /** 极角下限，内部会再夹到 [POLAR_EPSILON, PI - POLAR_EPSILON]。 */
    minPolarAngle: number;
    /** 极角上限，内部会再夹到 [POLAR_EPSILON, PI - POLAR_EPSILON]。 */
    maxPolarAngle: number;
    private readonly camera;
    /** 统一存成 HTMLElement（HTMLCanvasElement 也是它的子类），这样事件重载能正常解析。 */
    private readonly element;
    /** 当前球坐标（每帧从相机位置重新推导，保证外部直接改 position 也有效）。 */
    private theta;
    private phi;
    /** 本帧待消耗的旋转增量。 */
    private deltaTheta;
    private deltaPhi;
    /** 本帧待消耗的缩放比例（乘在 radius 上，小于 1 表示拉近）。 */
    private scale;
    /** 本帧待消耗的平移增量（世界空间）。 */
    private readonly panOffset;
    /** `reset()` 要恢复到的初始状态。 */
    private readonly initialPosition;
    private readonly initialTarget;
    private readonly previousPosition;
    private readonly previousTarget;
    private readonly pointers;
    private mode;
    /** 双指捏合时，上一次两指之间的距离。 */
    private pinchDistance;
    private disposed;
    constructor(camera: PerspectiveCamera, element: HTMLElement | HTMLCanvasElement, options?: OrbitControlsOptions);
    /** 是否已经释放。 */
    get isDisposed(): boolean;
    /**
     * 每帧调用一次：消化累积的输入并写回相机。
     *
     * @returns 相机的位置或 target 是否发生了变化（false 表示本帧不需要重绘）。
     */
    update(): boolean;
    /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
    reset(): void;
    /** 移除全部事件监听。可重复调用，第二次开始是空操作。 */
    dispose(): void;
    /** 从相机当前位置反推 theta / phi；两者重合时保持原值。 */
    private readSpherical;
    /** 元素的可视高度；取不到（例如无布局的测试替身）时退回 1，避免除零。 */
    private clientHeight;
    /** 当前两指之间的距离。 */
    private currentPinchDistance;
    /** 所有活动指针是否都是触摸。 */
    private allPointersAreTouch;
    /** 旋转：把屏幕像素位移换算成 theta / phi 增量。 */
    private rotateBy;
    /**
     * 平移：沿**相机自身**的 right / up 轴移动。
     *
     * view 矩阵的第 0 / 1 行就是相机在世界空间的 right / up 轴；矩阵是列主序存储的，
     * 所以这两行分别是 (m[0], m[4], m[8]) 与 (m[1], m[5], m[9])。
     */
    private panBy;
    private readonly onPointerDown;
    private readonly onPointerMove;
    private readonly onPointerUp;
    private readonly onWheel;
    private readonly onContextMenu;
}
//# sourceMappingURL=OrbitControls.d.ts.map