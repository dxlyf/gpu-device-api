/**
 * 颜色：`{ r, g, b, a }`，四个分量都是 **0..1 的线性浮点**（不预乘 alpha）。
 *
 * 与 `vec3` / `mat4` 相同的约定：`out` 是第一个参数、返回值就是 `out`。
 * 类型名叫 `ColorValue` 而不是 `Color`：`core` 里已经有一个 `Color`（清屏色/材质色的输入联合类型：
 * 字符串、数字、数组、对象都收），两者在包入口同名会冲突；而 `ColorValue` 的结构正好是那个
 * 联合类型里的对象成员，所以可以直接喂给 `Renderer` / `setClearColor` 之类的接口。
 *
 * 色彩空间：{@link setStyle} 按 **sRGB** 解析（CSS 的颜色都是 sRGB），
 * {@link convertSRGBToLinear} / {@link convertLinearToSRGB} 做显式的转换 ——
 * 需要线性空间计算（光照、混合）时先转过去，不要把 sRGB 数值直接当线性值用。
 */
export interface ColorValue {
    r: number;
    g: number;
    b: number;
    a: number;
}
export declare function create(r?: number, g?: number, b?: number, a?: number): ColorValue;
export declare function clone(a: ColorValue): ColorValue;
export declare function copy(out: ColorValue, a: ColorValue): ColorValue;
export declare function set(out: ColorValue, r: number, g: number, b: number, a?: number): ColorValue;
export declare function setRGB(out: ColorValue, r: number, g: number, b: number): ColorValue;
/** 由 `0xRRGGBB` 或 `0xRRGGBBAA` 构造（alpha 不传时保留 `out.a`）。 */
export declare function setHex(out: ColorValue, hex: number, alpha?: number): ColorValue;
/** 打包成 `0xRRGGBB`（不含 alpha）。 */
export declare function getHex(a: ColorValue): number;
/**
 * 解析 CSS 颜色：`#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa`、`rgb()` / `rgba()`、
 * 少量颜色名（与 WebGL2 后端的解析表一致）。无法识别时抛 `RangeError`。
 */
export declare function setStyle(out: ColorValue, style: string): ColorValue;
/** 转成 `#rrggbb`（或带 alpha 时的 `#rrggbbaa`）字符串。 */
export declare function getStyle(a: ColorValue, includeAlpha?: boolean): string;
/** 逐分量夹到 `[0, 1]`。 */
export declare function clampColor(out: ColorValue, a: ColorValue): ColorValue;
/** 线性插值（`t` 不夹紧）。 */
export declare function lerp(out: ColorValue, a: ColorValue, b: ColorValue, t: number): ColorValue;
/** 逐分量相加（不做夹紧；需要 0..1 结果时自己调 {@link clampColor}）。 */
export declare function add(out: ColorValue, a: ColorValue, b: ColorValue): ColorValue;
/** 逐分量相乘（调亮/调暗、与光颜色相乘时用）。 */
export declare function multiply(out: ColorValue, a: ColorValue, b: ColorValue): ColorValue;
/** 由 HSL 构造：`h` 取任意弧度（会绕回一圈），`s` / `l` 取 0..1。 */
export declare function setHSL(out: ColorValue, h: number, s: number, l: number, a?: number): ColorValue;
/** 转 HSL：`h` 是弧度，`s` / `l` 是 0..1。只处理 RGB，alpha 不动。 */
export declare function getHSL(out: Float32Array, a: ColorValue): Float32Array;
/** 写进长度为 3（RGB）或 4（RGBA）的扁平数组；`out` 省略时新建一个 `Float32Array(4)`。 */
export declare function toArray(a: ColorValue, out?: Float32Array, includeAlpha?: boolean): Float32Array;
/** 从长度为 3 或 4 的扁平数组读取。 */
export declare function fromArray(out: ColorValue, array: ArrayLike<number>, offset?: number): ColorValue;
/**
 * sRGB → 线性（精确的分段传递函数，不是 2.2 次幂的近似）。
 * 需要在线性空间做光照/混合时用；纯 UI 颜色不要转。
 */
export declare function convertSRGBToLinear(out: ColorValue, a: ColorValue): ColorValue;
/** 线性 → sRGB（{@link convertSRGBToLinear} 的逆）。 */
export declare function convertLinearToSRGB(out: ColorValue, a: ColorValue): ColorValue;
/** 是否在 0..1 内（用来判断「这个颜色能不能直接当清屏色/材质色」）。 */
export declare function isInGamut(a: ColorValue, epsilon?: number): boolean;
export declare function equals(a: ColorValue, b: ColorValue, epsilon?: number): boolean;
/** 仅用于调试：`rgba(0.2, 0.4, 0.6, 1)`。 */
export declare function toString(a: ColorValue): string;
//# sourceMappingURL=color.d.ts.map