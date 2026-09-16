/**
 * 四维向量（Float32Array，长度 4）。
 *
 * 约定同 `vec2` / `vec3`：`out` 在第一个参数，返回值就是 `out`，允许原地运算。
 * 颜色通常也用它表示，此时第四个分量是 alpha。
 */
export type Vec4 = Float32Array;
export declare function create(): Vec4;
export declare function clone(a: Vec4): Vec4;
export declare function fromValues(x: number, y: number, z: number, w: number): Vec4;
export declare function copy(out: Vec4, a: Vec4): Vec4;
export declare function set(out: Vec4, x: number, y: number, z: number, w: number): Vec4;
export declare function zero(out: Vec4): Vec4;
export declare function add(out: Vec4, a: Vec4, b: Vec4): Vec4;
export declare function sub(out: Vec4, a: Vec4, b: Vec4): Vec4;
export declare function mul(out: Vec4, a: Vec4, b: Vec4): Vec4;
export declare function div(out: Vec4, a: Vec4, b: Vec4): Vec4;
export declare function scale(out: Vec4, a: Vec4, scalar: number): Vec4;
export declare function negate(out: Vec4, a: Vec4): Vec4;
/** 归一化；长度接近 0 时写入零向量，不会产生 NaN。 */
export declare function normalize(out: Vec4, a: Vec4): Vec4;
export declare function length(a: Vec4): number;
export declare function squaredLength(a: Vec4): number;
export declare function dot(a: Vec4, b: Vec4): number;
export declare function lerp(out: Vec4, a: Vec4, b: Vec4, t: number): Vec4;
export declare function equals(a: Vec4, b: Vec4, epsilon?: number): boolean;
/** 用 4x4 矩阵变换（不做透视除法，保留 `w`，需要投影到三维请用 `vec3.transformMat4`）。 */
export declare function transformMat4(out: Vec4, a: Vec4, m: Float32Array): Vec4;
export declare function toArray(a: Vec4): number[];
export declare function toString(a: Vec4): string;
//# sourceMappingURL=vec4.d.ts.map