/**
 * 二维向量（Float32Array，长度 2）。
 *
 * 约定与说明：
 * - 所有运算函数的第一个参数都是 `out`（输出），并把结果写回 `out` 后返回它；
 *   这样可以复用缓冲区，避免每帧产生垃圾对象。
 * - `out` 允许与输入参数是同一个数组（原地运算）。
 * - 标量返回值（length、dot 等）函数不需要 `out`。
 */
export type Vec2 = Float32Array;
/** 创建一个零向量。 */
export declare function create(): Vec2;
/** 复制出一个新向量。 */
export declare function clone(a: Vec2): Vec2;
/** 由分量创建新向量。 */
export declare function fromValues(x: number, y: number): Vec2;
/** 把 `a` 复制到 `out`。 */
export declare function copy(out: Vec2, a: Vec2): Vec2;
/** 直接设置分量。 */
export declare function set(out: Vec2, x: number, y: number): Vec2;
/** 置零。 */
export declare function zero(out: Vec2): Vec2;
export declare function add(out: Vec2, a: Vec2, b: Vec2): Vec2;
export declare function sub(out: Vec2, a: Vec2, b: Vec2): Vec2;
/** 逐分量相乘。 */
export declare function mul(out: Vec2, a: Vec2, b: Vec2): Vec2;
/** 逐分量相除。 */
export declare function div(out: Vec2, a: Vec2, b: Vec2): Vec2;
/** 乘以标量。 */
export declare function scale(out: Vec2, a: Vec2, scalar: number): Vec2;
/** `out = a + b * scalar`，常用于沿方向累加位移。 */
export declare function scaleAndAdd(out: Vec2, a: Vec2, b: Vec2, scalar: number): Vec2;
/** 取负。 */
export declare function negate(out: Vec2, a: Vec2): Vec2;
/** 归一化；长度接近 0 时写入 (0, 0)，不会产生 NaN。 */
export declare function normalize(out: Vec2, a: Vec2): Vec2;
/** 向量长度。 */
export declare function length(a: Vec2): number;
/** 长度平方，比较长度时用它可省一次开方。 */
export declare function squaredLength(a: Vec2): number;
/** 两点距离。 */
export declare function distance(a: Vec2, b: Vec2): number;
/** 两点距离平方。 */
export declare function squaredDistance(a: Vec2, b: Vec2): number;
/** 点积。 */
export declare function dot(a: Vec2, b: Vec2): number;
/**
 * 二维叉积的标量结果（z 分量），即 `a × b = a.x * b.y - a.y * b.x`。
 * 符号表示 `b` 在 `a` 的左侧还是右侧。
 */
export declare function cross(a: Vec2, b: Vec2): number;
/** 线性插值：`t = 0` 取 `a`，`t = 1` 取 `b`。 */
export declare function lerp(out: Vec2, a: Vec2, b: Vec2, t: number): Vec2;
export declare function min(out: Vec2, a: Vec2, b: Vec2): Vec2;
export declare function max(out: Vec2, a: Vec2, b: Vec2): Vec2;
/** 近似相等判断（浮点比较必须带容差）。 */
export declare function equals(a: Vec2, b: Vec2, epsilon?: number): boolean;
/**
 * 用 3x3 矩阵做二维仿射变换（平移项取自矩阵第三列）：
 * `out = m * (x, y, 1)`。
 */
export declare function transformMat3(out: Vec2, a: Vec2, m: Float32Array): Vec2;
/** 转成普通数组，便于日志与断言。 */
export declare function toArray(a: Vec2): number[];
/** 字符串形式，便于调试输出。 */
export declare function toString(a: Vec2): string;
//# sourceMappingURL=vec2.d.ts.map