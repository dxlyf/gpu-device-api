/** 提交队列。对应 WebGPU 的 `GPUQueue`。 */

import type { Buffer } from '../resources/Buffer.js';
import type { Extent3D, TexelCopyBufferLayout } from '../../types/internal.js';
import type { BufferCopyView, CommandBuffer, TextureCopyView } from '../render/CommandEncoder.js';

/** {@link Queue.copyExternalImageToTexture} 接受的浏览器图像来源。 */
export type ExternalImageSource =
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | OffscreenCanvas
  | ImageData
  | VideoFrame
  | HTMLVideoElement;

/**
 * {@link Queue.copyExternalImageToTexture} 的编码参数。
 *
 * 对应原生 `GPUCopyExternalImageDestInfo` 的 `premultipliedAlpha` / `colorSpace` 两个字段
 * （`flipY` 在原生属于 **source** 那一侧，本库按既有签名把它单独作为一个位置参数保留）。
 */
export interface CopyExternalImageOptions {
  /**
   * 写进目标纹理的 RGB 是否先乘以 alpha。**默认 `true`**，与原生一致。
   *
   * 两端都能表达：
   * - WebGPU 原样转发（原生默认值也是 true）；
   * - WebGL2 走 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`（见 `WebGL2Queue` 的状态处理）。
   */
  premultipliedAlpha?: boolean;
  /**
   * 目标纹理的颜色空间（编码空间）。**默认 `'srgb'`**，与原生一致。
   *
   * - WebGPU 原样转发（原生默认值也是 `'srgb'`）；
   * - **WebGL2 无对应能力 → 传非 `'srgb'` 值时明确报错**，绝不静默忽略：
   *   `UNPACK_COLORSPACE_CONVERSION_WEBGL` 只能表达「要不要做浏览器默认的色彩空间转换」，
   *   表达不了「转成哪一个空间」；GL 侧的颜色空间由纹理内部格式（`-srgb` 后缀）决定。
   */
  colorSpace?: 'srgb' | 'display-p3';
}

export interface Queue {
  /**
   * 将主机端数据写入 buffer。
   *
   * **时序契约（两个后端存在一处已知差异，务必读完）：**
   *
   * - WebGPU：写入在本次调用**之后提交**的所有命令执行前统一生效。也就是说，即使某条 draw 已经
   *   录制进了当前打开的 encoder，只要它在这次 `writeBuffer` 之后才 `submit()`，它看到的就是
   *   新数据。
   * - WebGL2：立即模式，draw 在录制时就已发给 GL，因此写入只对**之后录制**的命令可见。
   *   要让 WebGL2 与 WebGPU 完全一致，需要把整条命令流缓存到 `submit()` 再回放（一整套软件
   *   command buffer），代价远大于收益，所以这里选择如实暴露差异。
   *
   * **实践结论：不要在同一帧内对同一个 buffer 的同一区间写两次再分别 draw。**
   * 需要「改 uniform → draw → 再改 → 再 draw」时，用 **uniform arena + 动态偏移**
   * （每次 draw 分配独立的 256 字节对齐区间，配合 `bindBufferRange` /
   * `setBindGroup(..., [dynamicOffset])`），两个后端的结果就完全一致 —— 这也是
   * `gfx` 便捷层的做法。
   *
   * **`dataOffset` / `size` 的单位是字节**（与 WebGL2 的 `bufferSubData` 一致）。
   * WebGPU 原生接口在 `data` 是 TypedArray 时按**元素**计，本库的 WebGPU 后端会替你换算，
   * 因此两个后端的语义一致。
   */
  writeBuffer(
    buffer: Buffer,
    bufferOffset: number,
    data: ArrayBufferView,
    /** 从 `data` 的第几个**字节**开始读，默认 0。 */
    dataOffset?: number,
    /** 写入多少**字节**，默认写到 `data` 末尾。 */
    size?: number,
  ): void;

  /** 将主机端像素上传到 texture（`texSubImage2D` 在 WebGPU 中的对应接口）。 */
  writeTexture(
    destination: TextureCopyView,
    data: ArrayBufferView,
    layout: TexelCopyBufferLayout,
    size: Extent3D,
  ): void;

  /**
   * 直接上传图像来源；支持 WebGPU 无法以其他方式表达的 `flipY`。
   *
   * `flipY` 之后是编码参数（见 {@link CopyExternalImageOptions}）：两个字段的默认值都与原生
   * 逐字段一致（`premultipliedAlpha: true`、`colorSpace: 'srgb'`），**省略时后端不向原生传
   * 这两个字段**，因此既有调用的行为与改动前完全相同。
   */
  copyExternalImageToTexture(
    source: ExternalImageSource,
    destination: TextureCopyView,
    copySize: Extent3D,
    flipY?: boolean,
    options?: CopyExternalImageOptions,
  ): void;

  copyBufferToBuffer(
    source: Buffer,
    sourceOffset: number,
    destination: Buffer,
    destinationOffset: number,
    size: number,
  ): void;

  copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: Extent3D): void;

  /** 提交 command buffer。WebGL2 后端在此刷新挂起的写入和 GL 命令。 */
  submit(commandBuffers: readonly CommandBuffer[]): void;

  /** 先前提交的全部工作都在 GPU 上完成后 resolve。 */
  onSubmittedWorkDone(): Promise<void>;
}
