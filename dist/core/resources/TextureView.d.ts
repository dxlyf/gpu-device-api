/** texture 某个子范围上的 view。对应 WebGPU 的 `GPUTextureView`。 */
import type { Disposable } from '../../utils/Disposable.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { Texture } from './Texture.js';
export type TextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
export type TextureAspect = 'all' | 'depth-only' | 'stencil-only';
/**
 * `swizzle` 字符串里的一个字符：从源纹理的哪个通道取值（`'0'` / `'1'` 表示强制常量）。
 *
 * 与原生（WebGPU 规范 `texture-component-swizzle`）一致：`swizzle` 是**长度 4 的字符串**，
 * 依次对应 view 的 r / g / b / a。`@webgpu/types@0.1.72` 里它就是 `string`，本库刻意沿用
 * 字符串形式而不是另造一个对象类型 —— 用对象表达「四个通道」是同一提案早期版本的形状，
 * 实测的本机 Chrome（SwiftShader + `--enable-unsafe-webgpu`）只接受字符串：
 *
 * ```
 * createView({ swizzle: { r: 'zero', ... } })  // TypeError: Swizzle ('[object Object]')
 *                                              // must be exactly a four-character string.
 * createView({ swizzle: 'rrr1' })              // OK
 * ```
 */
export type TextureSwizzleComponent = 'r' | 'g' | 'b' | 'a' | '0' | '1';
/**
 * 长度恰好为 4 的 swizzle 字符串（例如 `'rgba'`、`'rrr1'`、`'bgra'`）。
 *
 * 用模板字面量类型把「四个合法字符」写进类型里：写错长度或写了非法字符会在编译期报错，
 * 而不是等到 `createView()` 被原生实现扔一句 `TypeError`。运行时的校验仍然保留
 * （见 `WebGPUTextureView`）：类型可以被 `as` 绕过，报错信息要带上下文。
 */
export type TextureSwizzleString = `${TextureSwizzleComponent}${TextureSwizzleComponent}${TextureSwizzleComponent}${TextureSwizzleComponent}`;
export interface TextureViewDescriptor {
    label?: string;
    /** 重解释格式；必须列在该 texture 的 `viewFormats` 中。 */
    format?: TextureFormat;
    /** 默认为该 texture 的 dimension。 */
    dimension?: TextureViewDimension;
    baseMipLevel?: number;
    mipLevelCount?: number;
    baseArrayLayer?: number;
    arrayLayerCount?: number;
    aspect?: TextureAspect;
    /**
     * 采样式重排通道：长度 4 的字符串，依次对应 view 的 r / g / b / a。
     *
     * - `'r'` / `'g'` / `'b'` / `'a'`：取源纹理对应通道的值；
     * - `'0'` / `'1'`：强制为常量 0 / 1。
     *
     * 例如单通道 `r8unorm` 当灰度图用：`swizzle: 'rrr1'`（rgb 都取红、alpha 恒为 1）。
     *
     * **默认值是 `'rgba'`（不重排），与原生一致**：省略时后端不向原生传这个字段，
     * 因此「没写 swizzle」的调用形状与改动前逐字段相同。
     *
     * 需要 `texture-component-swizzle` feature 的**非默认**取值由原生实现校验（未启用该
     * feature 时传 `'rrr1'` 会失败）；本库不替它判断，只保证错误发生在同一处。
     *
     * **WebGL2 后端没有对应能力**：GLES 3.0 的纹素取值通道由内部格式决定，没有 view 概念、
     * 也没有任何扩展能表达「采样时重排通道」。传了这个字段（且不是 `'rgba'`）时 WebGL2 后端会
     * **明确报错**并给出替代方案，绝不静默忽略。
     */
    swizzle?: TextureSwizzleString;
}
export interface TextureView extends Disposable {
    readonly label: string;
    readonly texture: Texture;
    readonly descriptor: Required<Omit<TextureViewDescriptor, 'label' | 'format' | 'swizzle'>> & {
        format?: TextureFormat;
        /**
         * 解析后的 swizzle。
         *
         * **未指定时是 `undefined`**，不是 `'rgba'` —— 这样「有没有指定」在 descriptor 上是可分辨的，
         * 后端才不会为默认情况平白多传一个字段给原生（那会改变既有调用形状）。
         * 需要「实际生效的 swizzle」时读 {@link TextureView.swizzle}。
         */
        swizzle?: TextureSwizzleString;
    };
    /** 实际生效的通道重排；未指定时为 `'rgba'`（与原生默认值一致）。 */
    readonly swizzle: TextureSwizzleString;
    /** 原生句柄：WebGPU 上是 `GPUTextureView`；WebGL2 上就是 texture 本身。 */
    readonly native: unknown;
}
/** `swizzle` 缺省时的取值，与原生一致。 */
export declare const DEFAULT_TEXTURE_SWIZZLE: TextureSwizzleString;
/**
 * 校验一个 swizzle 字符串是否是「四个合法字符」。
 *
 * 类型层面已经限定了形状，但类型可以被 `as` 绕开、JS 调用方也没有类型；而原生对错误取值的
 * 反应是一句 `TypeError: Swizzle ('xx') must be exactly a four-character string.`，
 * 没有任何上下文。这里提前给出带 label 的报错。
 */
export declare function assertTextureSwizzle(swizzle: unknown, context: string): asserts swizzle is TextureSwizzleString;
/**
 * 为 view descriptor 填入 WebGPU 的默认值。
 *
 * 除新增的 `swizzle` 之外，这里的每个字段与改动前**逐字段一致**（见
 * `test/tier3-small-api.test.ts` 里针对默认值的逐字段回归断言）。
 */
export declare function resolveTextureViewDescriptor(texture: Texture, descriptor?: TextureViewDescriptor): TextureView['descriptor'];
//# sourceMappingURL=TextureView.d.ts.map