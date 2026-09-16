/**
 * 纯函数几何体生成器。
 *
 * 本模块零外部依赖，只用 `src/utils/math` 里的向量运算，输入参数全部是普通数字，
 * 输出是可以直接上传到 buffer 的 typed array。
 *
 * 统一约定：
 *
 * - 三角面网格返回 {@link ShapeData}：`position`（xyz）、`normal`（xyz）、`uv`、`indices`；
 *   线段返回 {@link LineData}：`position`（xyz，每两个顶点一条线段）与 `color`（rgba）。
 * - 坐标系是右手系。三角面绕序统一为 **CCW（逆时针）为正面**，也就是从物体外侧看过去
 *   顶点顺序是逆时针。
 * - 法线在写入时统一归一化，保证是单位向量；任何参数组合下都不会产生 NaN / Infinity。
 * - 退化参数（例如 `radialSegments < 3`、`width <= 0`、`divisions < 1`）**统一抛 RangeError**，
 *   不做静默夹紧。几何体的分段数写错时立刻失败，比悄悄给出一份残缺网格更容易定位。
 * - 分段数只改变顶点密度，不改变形状本身。每个函数上方都写明了「分段数到顶点数 / 索引数」
 *   的推导公式，索引数一律等于「三角形数乘 3」。
 */
/** 三角面网格：position / normal / uv / indices 四个并行数组。 */
export interface ShapeData {
    /** 顶点位置，每 3 个 float 一个顶点（xyz）。 */
    position: Float32Array;
    /** 顶点法线，每 3 个 float 一个顶点（xyz），保证是单位向量。 */
    normal: Float32Array;
    /** 顶点 uv，每 2 个 float 一个顶点。 */
    uv: Float32Array;
    /** 三角形索引，`Uint32Array`，每 3 个索引一个三角形。 */
    indices: Uint32Array;
}
/** 线段集合：每两个顶点构成一条独立线段，颜色逐顶点给出。 */
export interface LineData {
    /** 顶点位置，每 3 个 float 一个顶点（xyz），第 2i / 2i+1 个顶点是第 i 条线段的两端。 */
    position: Float32Array;
    /** 顶点颜色 rgba，每 4 个 float 一个顶点，长度是顶点数的 4 倍。 */
    color: Float32Array;
}
/** {@link createTriangle} 的参数。 */
export interface TriangleOptions {
    /** 外接圆半径，默认 0.5。 */
    radius?: number;
}
/**
 * 等边三角形，位于 XY 平面上、正面朝 +Z，几何中心在原点。
 *
 * 顶点数固定 3，索引数固定 3。三个顶点均匀分布在外接圆上（第一个顶点指向 +Y），
 * 因此从 +Z 方向看过去是 CCW。
 */
export declare function createTriangle(options?: TriangleOptions): ShapeData;
/** {@link createPlane} 的参数。 */
export interface PlaneOptions {
    /** X 方向尺寸，默认 1。 */
    width?: number;
    /** Y 方向尺寸，默认 1。 */
    height?: number;
    /** X 方向分段数，默认 1。 */
    widthSegments?: number;
    /** Y 方向分段数，默认 1。 */
    heightSegments?: number;
}
/**
 * XY 平面上的矩形，中心在原点，法线朝 +Z。
 *
 * 顶点数 = (widthSegments + 1) * (heightSegments + 1)。
 * 三角形数 = widthSegments * heightSegments * 2（每个网格单元两个三角形），
 * 索引数 = 三角形数 * 3。uv 沿 +X / +Y 线性铺满 [0, 1]。
 */
export declare function createPlane(options?: PlaneOptions): ShapeData;
/** {@link createBox} 的参数。 */
export interface BoxOptions {
    /** X 方向尺寸，默认 1。 */
    width?: number;
    /** Y 方向尺寸，默认 1。 */
    height?: number;
    /** Z 方向尺寸，默认 1。 */
    depth?: number;
    /** X 方向分段数（只作用于 ±Y / ±Z 四个面），默认 1。 */
    widthSegments?: number;
    /** Y 方向分段数（只作用于 ±X / ±Z 四个面），默认 1。 */
    heightSegments?: number;
    /** Z 方向分段数（只作用于 ±X / ±Y 四个面），默认 1。 */
    depthSegments?: number;
}
/**
 * 长方体，中心在原点，六个面各自持有独立顶点（法线朝外，不做顶点共享）。
 *
 * 记 w = widthSegments、h = heightSegments、d = depthSegments：
 *
 * - 每个面的顶点数 = (该面 U 方向分段数 + 1) * (该面 V 方向分段数 + 1)，
 *   六面合计 = 2 * [(d + 1)(h + 1) + (d + 1)(w + 1) + (h + 1)(w + 1)]；
 * - 每个面的三角形数 = 该面 segU * segV * 2，六面合计 **三角形数 = 4 * (w * h + w * d + h * d)**，
 *   索引数 = 三角形数 * 3。三个分段数都是 1 时就是经典的 12 个三角形。
 * - 每个面的 uv 都独立地铺满 [0, 1]，方便贴图。
 */
export declare function createBox(options?: BoxOptions): ShapeData;
/** {@link createSphere} 的参数。 */
export interface SphereOptions {
    /** 半径，默认 0.5。 */
    radius?: number;
    /** 经线分段数（绕 Y 轴一圈的格子数），默认 32，最小 3。 */
    widthSegments?: number;
    /** 纬线分段数（从北极到南极的格子数），默认 16，最小 2。 */
    heightSegments?: number;
}
/**
 * 经纬球，中心在原点，半径 `radius`。
 *
 * 顶点数 = (widthSegments + 1) * (heightSegments + 1)：多出的一列是 u = 1 的接缝（与
 * u = 0 位置重合但 uv 不同），两极各有一整行位置重合的顶点。
 * 三角形数 = widthSegments * heightSegments * 2，索引数 = 三角形数 * 3；
 * 两极那两行会产生零面积三角形，这是经纬球的固有代价。
 *
 * 法线直接取归一化后的位置方向：在极点处 `sin(phi)` 为 0，得到精确的 (0, ±1, 0)，
 * 因此两极法线不会出现 NaN。
 */
export declare function createSphere(options?: SphereOptions): ShapeData;
/** {@link createTorus} 的参数。 */
export interface TorusOptions {
    /** 主环半径（圆心到管中心），默认 0.5。 */
    radius?: number;
    /** 管子半径，默认 0.2。 */
    tube?: number;
    /** 管子截面分段数，默认 16，最小 3。 */
    radialSegments?: number;
    /** 绕主环一圈的分段数，默认 32，最小 3。 */
    tubularSegments?: number;
}
/**
 * 圆环（甜甜圈），躺在 XZ 平面上、中心在原点。
 *
 * 顶点数 = (tubularSegments + 1) * (radialSegments + 1)（含接缝重复列）。
 * 三角形数 = tubularSegments * radialSegments * 2，索引数 = 三角形数 * 3。
 *
 * 法线是解析解 (cos u cos v, sin u, cos u sin v)，天然是单位向量，不会出现 NaN。
 */
export declare function createTorus(options?: TorusOptions): ShapeData;
/** {@link createCylinder} 的参数。 */
export interface CylinderOptions {
    /** 顶面半径，默认 0.5；允许为 0（此时变成圆锥）。 */
    radiusTop?: number;
    /** 底面半径，默认 0.5；允许为 0。 */
    radiusBottom?: number;
    /** 高，默认 1。 */
    height?: number;
    /** 圆周分段数，默认 24，最小 3。 */
    radialSegments?: number;
    /** 侧面沿高度的分段数，默认 1，最小 1。 */
    heightSegments?: number;
    /** 是否生成顶面 / 底面圆盖，默认 true（半径为 0 的那一端自动跳过）。 */
    caps?: boolean;
}
/**
 * 圆柱 / 圆台，轴对齐 Y 轴，中心在原点。
 *
 * - 侧面顶点数 = (radialSegments + 1) * (heightSegments + 1)（含 theta = 2PI 的接缝列），
 *   三角形数 = radialSegments * heightSegments * 2，索引数 = 三角形数 * 3。
 * - 侧面法线按**母线斜率**计算：设顶面半径 rt、底面半径 rb、高 h，母线（底面到顶面）在
 *   (r, y) 平面内的方向是 (rt - rb, h)，外法线与之垂直且径向分量为正，即 (h, rb - rt)，
 *   归一化后得到径向分量 `nRadius = h / len` 与 `nY = (rb - rt) / len`（len = hypot(h, rb - rt)）。
 *   于是普通圆柱（rt = rb）退化为纯水平法线，圆锥（rt = 0）的法线则向外并向上倾斜。
 * - 圆盖：半径大于 0 的一端各加 (radialSegments + 2) 个顶点与 radialSegments 个三角形。
 *
 * 当 `radiusTop` 或 `radiusBottom` 为 0 时（圆锥），该端不生成圆盖，侧面顶端会出现一圈位置
 * 重合的顶点与零面积三角形；这是让极点法线保持圆周分布的常规做法。
 */
export declare function createCylinder(options?: CylinderOptions): ShapeData;
/** {@link createCone} 的参数。 */
export interface ConeOptions {
    /** 底面半径，默认 0.5。 */
    radius?: number;
    /** 高，默认 1。 */
    height?: number;
    /** 圆周分段数，默认 24，最小 3。 */
    radialSegments?: number;
    /** 是否生成底面圆盖，默认 true。 */
    caps?: boolean;
}
/**
 * 圆锥，顶点朝 +Y、底面朝 -Y、中心在原点，是 `radiusTop = 0` 的圆台特例。
 *
 * 顶点数 / 索引数公式与 {@link createCylinder} 一致，只是取 heightSegments = 1、radiusTop = 0：
 * 侧面 (radialSegments + 1) * 2 个顶点、radialSegments * 2 个三角形；
 * 底面圆盖 (radialSegments + 2) 个顶点、radialSegments 个三角形（caps 为 true 时）。
 * 侧面法线同样按母线斜率求出，在锥顶处形成沿圆周分布的单位法线，不会出现 NaN。
 */
export declare function createCone(options?: ConeOptions): ShapeData;
/** {@link createGrid} 支持的基准平面。 */
export type GridPlane = 'xz' | 'xy' | 'yz';
/** {@link createGrid} 的参数。 */
export interface GridOptions {
    /** 网格边长，默认 10。 */
    size?: number;
    /** 每个方向的等分数量，默认 10，最小 1。 */
    divisions?: number;
    /** 网格所在的平面，默认 'xz'（水平地面）。 */
    plane?: GridPlane;
    /** 线段颜色 rgba，默认中灰。 */
    color?: readonly [number, number, number, number];
}
/**
 * 规则网格线。
 *
 * 每个方向有 divisions + 1 条线，两个方向合计 2 * (divisions + 1) 条线段，
 * 也就是 4 * (divisions + 1) 个顶点，`position.length` = 12 * (divisions + 1)，
 * `color.length` = 16 * (divisions + 1)。
 */
export declare function createGrid(options?: GridOptions): LineData;
/** {@link createAxes} 的参数。 */
export interface AxesOptions {
    /** 每根轴的长度，默认 1。 */
    size?: number;
}
/**
 * 坐标轴指示线：+X 红色、+Y 绿色、+Z 蓝色，都从原点出发。
 *
 * 固定 3 条线段、6 个顶点，`position.length` = 18，`color.length` = 24，alpha 都是 1。
 */
export declare function createAxes(options?: AxesOptions): LineData;
//# sourceMappingURL=shapes.d.ts.map