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
/** 解析失败的 `setStyle` 会抛 `RangeError`，消息里带上原始输入。 */
const NAMED_COLORS = {
    transparent: [0, 0, 0],
    black: [0, 0, 0],
    white: [1, 1, 1],
    red: [1, 0, 0],
    green: [0, 0.5019607843137255, 0],
    lime: [0, 1, 0],
    blue: [0, 0, 1],
    yellow: [1, 1, 0],
    cyan: [0, 1, 1],
    aqua: [0, 1, 1],
    magenta: [1, 0, 1],
    fuchsia: [1, 0, 1],
    gray: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255],
    grey: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255],
    silver: [0.7529411764705882, 0.7529411764705882, 0.7529411764705882],
    orange: [1, 0.6470588235294118, 0],
    purple: [0.5019607843137255, 0, 0.5019607843137255],
    navy: [0, 0, 0.5019607843137255],
    teal: [0, 0.5019607843137255, 0.5019607843137255],
};
export function create(r = 0, g = 0, b = 0, a = 1) {
    return { r, g, b, a };
}
export function clone(a) {
    return { r: a.r, g: a.g, b: a.b, a: a.a };
}
export function copy(out, a) {
    out.r = a.r;
    out.g = a.g;
    out.b = a.b;
    out.a = a.a;
    return out;
}
export function set(out, r, g, b, a = 1) {
    out.r = r;
    out.g = g;
    out.b = b;
    out.a = a;
    return out;
}
export function setRGB(out, r, g, b) {
    out.r = r;
    out.g = g;
    out.b = b;
    return out;
}
/** 由 `0xRRGGBB` 或 `0xRRGGBBAA` 构造（alpha 不传时保留 `out.a`）。 */
export function setHex(out, hex, alpha) {
    const value = Math.trunc(hex);
    out.r = ((value >> 16) & 255) / 255;
    out.g = ((value >> 8) & 255) / 255;
    out.b = (value & 255) / 255;
    if (alpha !== undefined)
        out.a = alpha;
    return out;
}
/** 打包成 `0xRRGGBB`（不含 alpha）。 */
export function getHex(a) {
    const toByte = (value) => Math.round(Math.min(Math.max(value, 0), 1) * 255);
    return (toByte(a.r) << 16) | (toByte(a.g) << 8) | toByte(a.b);
}
/**
 * 解析 CSS 颜色：`#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa`、`rgb()` / `rgba()`、
 * 少量颜色名（与 WebGL2 后端的解析表一致）。无法识别时抛 `RangeError`。
 */
export function setStyle(out, style) {
    const text = style.trim().toLowerCase();
    const named = NAMED_COLORS[text];
    if (named) {
        out.r = named[0];
        out.g = named[1];
        out.b = named[2];
        if (text === 'transparent')
            out.a = 0;
        return out;
    }
    if (text.startsWith('#')) {
        const value = text.slice(1);
        if (/^[0-9a-f]+$/.test(value)) {
            const expand = (part) => parseInt(part + part, 16) / 255;
            if (value.length === 3 || value.length === 4) {
                out.r = expand(value[0]);
                out.g = expand(value[1]);
                out.b = expand(value[2]);
                if (value.length === 4)
                    out.a = expand(value[3]);
                return out;
            }
            if (value.length === 6 || value.length === 8) {
                const channel = (index) => parseInt(value.slice(index, index + 2), 16) / 255;
                out.r = channel(0);
                out.g = channel(2);
                out.b = channel(4);
                if (value.length === 8)
                    out.a = channel(6);
                return out;
            }
        }
        throw new RangeError(`[gpu-device-api] color.setStyle: cannot parse "${style}" as a hex color.`);
    }
    const functional = /^rgba?\(([^)]+)\)$/.exec(text);
    if (functional) {
        const parts = functional[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        if (parts.length >= 3 && parts.slice(0, 3).every((part) => Number.isFinite(part))) {
            out.r = parts[0] / 255;
            out.g = parts[1] / 255;
            out.b = parts[2] / 255;
            if (parts.length >= 4 && Number.isFinite(parts[3]))
                out.a = parts[3];
            return out;
        }
        throw new RangeError(`[gpu-device-api] color.setStyle: cannot parse "${style}" as an rgb()/rgba() color.`);
    }
    throw new RangeError(`[gpu-device-api] color.setStyle: unknown color "${style}". Supported: #rgb / #rrggbb / #rrggbbaa, ` +
        'rgb() / rgba(), and a small set of CSS color names.');
}
/** 转成 `#rrggbb`（或带 alpha 时的 `#rrggbbaa`）字符串。 */
export function getStyle(a, includeAlpha = false) {
    const toByte = (value) => Math.round(Math.min(Math.max(value, 0), 1) * 255);
    const hex = (value) => value.toString(16).padStart(2, '0');
    const base = `#${hex(toByte(a.r))}${hex(toByte(a.g))}${hex(toByte(a.b))}`;
    return includeAlpha ? `${base}${hex(toByte(a.a))}` : base;
}
/** 逐分量夹到 `[0, 1]`。 */
export function clampColor(out, a) {
    out.r = Math.min(Math.max(a.r, 0), 1);
    out.g = Math.min(Math.max(a.g, 0), 1);
    out.b = Math.min(Math.max(a.b, 0), 1);
    out.a = Math.min(Math.max(a.a, 0), 1);
    return out;
}
/** 线性插值（`t` 不夹紧）。 */
export function lerp(out, a, b, t) {
    out.r = a.r + (b.r - a.r) * t;
    out.g = a.g + (b.g - a.g) * t;
    out.b = a.b + (b.b - a.b) * t;
    out.a = a.a + (b.a - a.a) * t;
    return out;
}
/** 逐分量相加（不做夹紧；需要 0..1 结果时自己调 {@link clampColor}）。 */
export function add(out, a, b) {
    out.r = a.r + b.r;
    out.g = a.g + b.g;
    out.b = a.b + b.b;
    out.a = a.a + b.a;
    return out;
}
/** 逐分量相乘（调亮/调暗、与光颜色相乘时用）。 */
export function multiply(out, a, b) {
    out.r = a.r * b.r;
    out.g = a.g * b.g;
    out.b = a.b * b.b;
    out.a = a.a * b.a;
    return out;
}
/** 由 HSL 构造：`h` 取任意弧度（会绕回一圈），`s` / `l` 取 0..1。 */
export function setHSL(out, h, s, l, a = out.a) {
    const hue = ((h % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const saturation = Math.min(Math.max(s, 0), 1);
    const lightness = Math.min(Math.max(l, 0), 1);
    if (saturation === 0) {
        out.r = lightness;
        out.g = lightness;
        out.b = lightness;
        out.a = a;
        return out;
    }
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    const hueToChannel = (t) => {
        let value = t;
        if (value < 0)
            value += 1;
        if (value > 1)
            value -= 1;
        if (value < 1 / 6)
            return p + (q - p) * 6 * value;
        if (value < 1 / 2)
            return q;
        if (value < 2 / 3)
            return p + (q - p) * (2 / 3 - value) * 6;
        return p;
    };
    const hueRatio = hue / (Math.PI * 2);
    out.r = hueToChannel(hueRatio + 1 / 3);
    out.g = hueToChannel(hueRatio);
    out.b = hueToChannel(hueRatio - 1 / 3);
    out.a = a;
    return out;
}
/** 转 HSL：`h` 是弧度，`s` / `l` 是 0..1。只处理 RGB，alpha 不动。 */
export function getHSL(out, a) {
    const maxChannel = Math.max(a.r, a.g, a.b);
    const minChannel = Math.min(a.r, a.g, a.b);
    const lightness = (minChannel + maxChannel) / 2;
    const delta = maxChannel - minChannel;
    if (delta === 0) {
        out[0] = 0;
        out[1] = 0;
        out[2] = lightness;
        return out;
    }
    const saturation = lightness <= 0.5 ? delta / (maxChannel + minChannel) : delta / (2 - maxChannel - minChannel);
    let hue;
    if (maxChannel === a.r)
        hue = (a.g - a.b) / delta + (a.g < a.b ? 6 : 0);
    else if (maxChannel === a.g)
        hue = (a.b - a.r) / delta + 2;
    else
        hue = (a.r - a.g) / delta + 4;
    out[0] = (hue / 6) * Math.PI * 2;
    out[1] = saturation;
    out[2] = lightness;
    return out;
}
/** 写进长度为 3（RGB）或 4（RGBA）的扁平数组；`out` 省略时新建一个 `Float32Array(4)`。 */
export function toArray(a, out, includeAlpha = true) {
    const target = out ?? new Float32Array(includeAlpha ? 4 : 3);
    target[0] = a.r;
    target[1] = a.g;
    target[2] = a.b;
    if (includeAlpha && target.length >= 4)
        target[3] = a.a;
    return target;
}
/** 从长度为 3 或 4 的扁平数组读取。 */
export function fromArray(out, array, offset = 0) {
    out.r = array[offset] ?? 0;
    out.g = array[offset + 1] ?? 0;
    out.b = array[offset + 2] ?? 0;
    if (array.length > offset + 3)
        out.a = array[offset + 3];
    return out;
}
/**
 * sRGB → 线性（精确的分段传递函数，不是 2.2 次幂的近似）。
 * 需要在线性空间做光照/混合时用；纯 UI 颜色不要转。
 */
export function convertSRGBToLinear(out, a) {
    const channel = (value) => value < 0.04045 ? value * 0.0773993808 : Math.pow(value * 0.9478672986 + 0.0521327014, 2.4);
    out.r = channel(a.r);
    out.g = channel(a.g);
    out.b = channel(a.b);
    out.a = a.a;
    return out;
}
/** 线性 → sRGB（{@link convertSRGBToLinear} 的逆）。 */
export function convertLinearToSRGB(out, a) {
    const channel = (value) => value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 0.41666) - 0.055;
    out.r = channel(a.r);
    out.g = channel(a.g);
    out.b = channel(a.b);
    out.a = a.a;
    return out;
}
/** 是否在 0..1 内（用来判断「这个颜色能不能直接当清屏色/材质色」）。 */
export function isInGamut(a, epsilon = 1e-6) {
    return (a.r >= -epsilon &&
        a.r <= 1 + epsilon &&
        a.g >= -epsilon &&
        a.g <= 1 + epsilon &&
        a.b >= -epsilon &&
        a.b <= 1 + epsilon);
}
export function equals(a, b, epsilon = 1e-6) {
    return (Math.abs(a.r - b.r) <= epsilon &&
        Math.abs(a.g - b.g) <= epsilon &&
        Math.abs(a.b - b.b) <= epsilon &&
        Math.abs(a.a - b.a) <= epsilon);
}
/** 仅用于调试：`rgba(0.2, 0.4, 0.6, 1)`。 */
export function toString(a) {
    return `rgba(${a.r}, ${a.g}, ${a.b}, ${a.a})`;
}
//# sourceMappingURL=color.js.map