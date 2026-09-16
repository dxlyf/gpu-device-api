/** 由 `Device.importExternalTexture()` 导入的外部纹理。对应 WebGPU 的 `GPUExternalTexture`。 */

import type { Disposable } from '../../utils/Disposable.js';

/**
 * 可以导入为外部纹理的图像来源。
 *
 * 与 {@link import('../sync/Queue.js').ExternalImageSource} 的区别：拷进 texture 只要求
 * 「能当 `TexImageSource` 用」，而**导入**成一个可被 shader 采样的外部纹理还要求这份来源
 * **每帧重新给出**（视频帧、`ImageBitmap` 都属于这一类）。见
 * {@link ExternalTexture.expired} 的过期语义。
 */
export type ExternalTextureSource = HTMLVideoElement | VideoFrame | ImageBitmap;

/** `Device.importExternalTexture()` 的参数。对应 WebGPU 的 `GPUExternalTextureDescriptor`。 */
export interface ExternalTextureDescriptor {
  /** 导入的图像来源。 */
  source: ExternalTextureSource;
  /** 标签；省略时后端生成默认值（与其它资源一致）。 */
  label?: string;
  /**
   * 把来源重解释为这个颜色空间。
   *
   * **刻意留在这里但不实现**：规范的 `GPUExternalTextureDescriptor` 目前只有 `source` / `label`，
   * 而且实测的本机 Chrome 也不读这个字段。之所以不删掉而是显式留着：写了它却什么都不做才是
   * 本库最忌讳的「静默忽略」，所以 WebGPU 后端会**明确报错**告诉你它没被实现（见
   * `WebGPUDevice.importExternalTexture`）。需要颜色空间转换时请先用
   * `OffscreenCanvas` + `convertToBlob`（或自己画一遍）把来源转成目标空间再导入。
   */
  colorSpace?: 'srgb' | 'display-p3';
}

/**
 * 一次性（每帧）的外部纹理。
 *
 * ## 过期语义（这是它与普通 texture 最大的区别）
 *
 * WebGPU 的 `GPUExternalTexture` **会在导入后的若干任务内自动过期**：规范把它绑定到一个
 * 「自动过期任务源」，无论是否被销毁，过了那个时间点之后任何使用（绑定进 bind group、
 * 采样）都会失败。因此正确用法是**每帧重新导入**，而不是导入一次长期持有：
 *
 * ```ts
 * // 每帧：
 * const external = device.importExternalTexture({ source: video, label: 'camera' });
 * const bindGroup = device.createBindGroup({ layout, entries: [{ binding: 0, resource: { source: external } }] });
 * ```
 *
 * ## 本库如何校验过期
 *
 * **只在少数几个点校验，而且不假装能做到更多**：
 *
 * - {@link ExternalTexture.expired} 每次读取都去问原生对象（原生实现暴露了 `expired` 时），
 *   本层不自己计时 —— 那种「用 JS 定时器猜 GPU 任务边界」的做法一定会猜错；
 * - 绑定进 bind group 之前（`WebGPUBindGroup`）会检查一次，过期就明确报错，而不是把一份
 *   失效句柄交给原生实现去抛一句没有上下文的错误；
 * - **不**在校验之外拦截**已经绑定好的** bind group：原生调用的那一刻是否已过期只有实现知道，
 *   本层无法在 JS 侧同步地判断「这次 draw 用的 bind group 里的外部纹理现在过期了没有」。
 *   所以「每帧重新导入并重建 bind group」仍然是用的人要遵守的契约。
 */
export interface ExternalTexture extends Disposable {
  readonly label: string;
  /**
   * 该外部纹理是否已经过期（每次读取都向原生查询；原生不暴露时返回 `false`）。
   *
   * 「不知道」时返回 `false` 而不是 `true`：这个值只用于**提前给出更清楚的报错**，
   * 不是功能闸门 —— 拿不准就不要拦住一次本来可能成功的绑定。
   */
  readonly expired: boolean;
  /** 原生句柄：WebGPU 上是 `GPUExternalTexture`。 */
  readonly native: unknown;
}
