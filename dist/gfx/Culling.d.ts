/**
 * 视锥剔除：从相机的 view-projection 矩阵抽出 6 个世界空间平面，再用**包围球**做保守判定。
 *
 * 判定是保守的（只要球还有一部分在视锥内就算可见），所以「被剔除的物体一定不可见」，
 * 不会出现该画的东西被丢掉 —— 这是剔除功能能默认打开的前提。
 *
 * 平面抽取与球判定的实现都在 `src/utils/math/frustum`（两个后端、两套深度约定都通用），
 * 这里只做三件渲染器真正需要的事：
 *
 * 1. **按后端选深度约定**：`'gl'`（WebGL2，裁剪空间 z ∈ [-1, 1]）与 `'zo'`（WebGPU，z ∈ [0, 1]）
 *    的近平面不同，选错会让近处的物体被误剔除；
 * 2. **把局部包围球搬到世界空间**：包围球由几何体创建时按顶点算好（局部空间），
 *    要先用 model 矩阵变换球心、并按**最大轴缩放**放大半径（非等比缩放会把球变成椭球，
 *    取最大轴是保守做法）；
 * 3. 复用暂存区，避免每 draw 分配。
 */
import type { DepthRangeConvention } from './Camera.js';
import type { BoundingSphere } from './Geometry.js';
import type { Mat4 } from '../utils/math/mat4.js';
import type { Vec3 } from '../utils/math/vec3.js';
/**
 * 一个可复用的视锥剔除器。
 *
 * 用法：`update()` 在相机刷新时调用一次（渲染器在 `updateCamera()` 里做），
 * `intersectsSphere()` / `intersectsLocalSphere()` 每次 draw 调用。
 * **没有调用过 `update()` 时 `ready` 为 false**，调用方必须跳过剔除 ——
 * 否则拿一个未初始化的视锥去判定会把所有东西都剔掉。
 */
export declare class FrustumCuller {
    /** 是否已经由某个相机矩阵初始化过。 */
    ready: boolean;
    private readonly planes;
    private readonly worldCenter;
    private readonly scaling;
    /** 按 view-projection 矩阵与深度约定重建 6 个平面。 */
    update(projectionView: Mat4, depthRange: DepthRangeConvention): void;
    /** 世界空间的球是否可能与视锥相交。 */
    intersectsSphere(center: Vec3, radius: number): boolean;
    /**
     * 局部空间的包围球经 `model` 变换后是否可能与视锥相交。
     *
     * `model` 为 `null` / `undefined` 表示单位矩阵，直接用局部球判定（省掉矩阵运算）。
     */
    intersectsLocalSphere(sphere: BoundingSphere, model: Mat4 | null | undefined): boolean;
}
//# sourceMappingURL=Culling.d.ts.map