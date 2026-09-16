/**
 * 四维向量（Float32Array，长度 4）。
 *
 * 约定同 `vec2` / `vec3`：`out` 在第一个参数，返回值就是 `out`，允许原地运算。
 * 颜色通常也用它表示，此时第四个分量是 alpha。
 */
export function create() {
    return new Float32Array(4);
}
export function clone(a) {
    const out = new Float32Array(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
}
export function fromValues(x, y, z, w) {
    const out = new Float32Array(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
}
export function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
}
export function set(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
}
export function zero(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
}
export function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
}
export function sub(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
}
export function mul(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
}
export function div(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
}
export function scale(out, a, scalar) {
    out[0] = a[0] * scalar;
    out[1] = a[1] * scalar;
    out[2] = a[2] * scalar;
    out[3] = a[3] * scalar;
    return out;
}
export function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
}
/** 归一化；长度接近 0 时写入零向量，不会产生 NaN。 */
export function normalize(out, a) {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];
    let length = Math.hypot(x, y, z, w);
    if (length > 0)
        length = 1 / length;
    out[0] = x * length;
    out[1] = y * length;
    out[2] = z * length;
    out[3] = w * length;
    return out;
}
export function length(a) {
    return Math.hypot(a[0], a[1], a[2], a[3]);
}
export function squaredLength(a) {
    return a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3];
}
export function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
export function lerp(out, a, b, t) {
    out[0] = a[0] + t * (b[0] - a[0]);
    out[1] = a[1] + t * (b[1] - a[1]);
    out[2] = a[2] + t * (b[2] - a[2]);
    out[3] = a[3] + t * (b[3] - a[3]);
    return out;
}
export function equals(a, b, epsilon = 1e-6) {
    return (Math.abs(a[0] - b[0]) <= epsilon &&
        Math.abs(a[1] - b[1]) <= epsilon &&
        Math.abs(a[2] - b[2]) <= epsilon &&
        Math.abs(a[3] - b[3]) <= epsilon);
}
/** 用 4x4 矩阵变换（不做透视除法，保留 `w`，需要投影到三维请用 `vec3.transformMat4`）。 */
export function transformMat4(out, a, m) {
    const x = a[0];
    const y = a[1];
    const z = a[2];
    const w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
}
export function toArray(a) {
    return [a[0], a[1], a[2], a[3]];
}
export function toString(a) {
    return `vec4(${a[0]}, ${a[1]}, ${a[2]}, ${a[3]})`;
}
//# sourceMappingURL=vec4.js.map