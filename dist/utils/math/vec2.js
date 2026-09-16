/**
 * 二维向量（Float32Array，长度 2）。
 *
 * 约定与说明：
 * - 所有运算函数的第一个参数都是 `out`（输出），并把结果写回 `out` 后返回它；
 *   这样可以复用缓冲区，避免每帧产生垃圾对象。
 * - `out` 允许与输入参数是同一个数组（原地运算）。
 * - 标量返回值（length、dot 等）函数不需要 `out`。
 */
/** 创建一个零向量。 */
export function create() {
    return new Float32Array(2);
}
/** 复制出一个新向量。 */
export function clone(a) {
    const out = new Float32Array(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
}
/** 由分量创建新向量。 */
export function fromValues(x, y) {
    const out = new Float32Array(2);
    out[0] = x;
    out[1] = y;
    return out;
}
/** 把 `a` 复制到 `out`。 */
export function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
}
/** 直接设置分量。 */
export function set(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
}
/** 置零。 */
export function zero(out) {
    out[0] = 0;
    out[1] = 0;
    return out;
}
export function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
}
export function sub(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
}
/** 逐分量相乘。 */
export function mul(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
}
/** 逐分量相除。 */
export function div(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
}
/** 乘以标量。 */
export function scale(out, a, scalar) {
    out[0] = a[0] * scalar;
    out[1] = a[1] * scalar;
    return out;
}
/** `out = a + b * scalar`，常用于沿方向累加位移。 */
export function scaleAndAdd(out, a, b, scalar) {
    out[0] = a[0] + b[0] * scalar;
    out[1] = a[1] + b[1] * scalar;
    return out;
}
/** 取负。 */
export function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
}
/** 归一化；长度接近 0 时写入 (0, 0)，不会产生 NaN。 */
export function normalize(out, a) {
    const x = a[0];
    const y = a[1];
    let length = Math.hypot(x, y);
    if (length > 0)
        length = 1 / length;
    out[0] = x * length;
    out[1] = y * length;
    return out;
}
/** 向量长度。 */
export function length(a) {
    return Math.hypot(a[0], a[1]);
}
/** 长度平方，比较长度时用它可省一次开方。 */
export function squaredLength(a) {
    return a[0] * a[0] + a[1] * a[1];
}
/** 两点距离。 */
export function distance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
/** 两点距离平方。 */
export function squaredDistance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
}
/** 点积。 */
export function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
}
/**
 * 二维叉积的标量结果（z 分量），即 `a × b = a.x * b.y - a.y * b.x`。
 * 符号表示 `b` 在 `a` 的左侧还是右侧。
 */
export function cross(a, b) {
    return a[0] * b[1] - a[1] * b[0];
}
/** 线性插值：`t = 0` 取 `a`，`t = 1` 取 `b`。 */
export function lerp(out, a, b, t) {
    out[0] = a[0] + t * (b[0] - a[0]);
    out[1] = a[1] + t * (b[1] - a[1]);
    return out;
}
export function min(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
}
export function max(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
}
/** 近似相等判断（浮点比较必须带容差）。 */
export function equals(a, b, epsilon = 1e-6) {
    return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon;
}
/**
 * 用 3x3 矩阵做二维仿射变换（平移项取自矩阵第三列）：
 * `out = m * (x, y, 1)`。
 */
export function transformMat3(out, a, m) {
    const x = a[0];
    const y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
}
/** 转成普通数组，便于日志与断言。 */
export function toArray(a) {
    return [a[0], a[1]];
}
/** 字符串形式，便于调试输出。 */
export function toString(a) {
    return `vec2(${a[0]}, ${a[1]})`;
}
//# sourceMappingURL=vec2.js.map