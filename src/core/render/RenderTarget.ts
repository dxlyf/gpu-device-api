/** 离屏 render target：一个或多个 color attachment，外加可选的 depth/stencil attachment。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { LoadOp } from '../enums/LoadOp.js';
import type { StoreOp } from '../enums/StoreOp.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { TextureUsage } from '../enums/TextureUsage.js';
import type { Texture } from '../resources/Texture.js';
import type { TextureView } from '../resources/TextureView.js';

/**
 * 渲染目标的**原生行序**：渲染通道写进附件时，画面（裁剪空间的 +Y 方向）落在纹素的哪一端。
 *
 * 本库的纹理约定是「纹素 (0, 0) 在左上角」（见 `Texture.ts`），但两个后端**渲染进附件**时的
 * 原生行序并不一样，这一层不做任何自动转换，只如实暴露：
 *
 * - `'topLeft'`：纹素第 0 行就是画面**顶端**（WebGPU）—— 与上面的约定天然一致；
 * - `'bottomUp'`：纹素第 0 行是画面**底端**（WebGL2 的窗口原点在左下，附着到 FBO 上的纹理
 *   因此自下而上存储）—— 与上面的约定相反。
 *
 * 后果是「先渲染到纹理、再把这张纹理采样上屏」在两个后端会得到上下颠倒的画面，而
 * `CommandEncoder.copyTextureToBuffer` 与 `Queue.writeTexture` 都忠实按纹素行序工作
 * —— 于是读回来的行序也跟着相反。core 层**不代劳**，要统一请二选一：
 *
 * 1. 把相机投影矩阵在裁剪空间做 Y 取反（`mat4.flipClipY`，等价于 `gl_Position.y *= -1`），
 *    渲染结果就直接落在与 WebGPU 相同的行序上 —— **注意它同时会反转三角绕序**，
 *    开了背面剔除时要把 `frontFace` 一起换过来；
 * 2. 保留原生行序，在**读回**之后自己按 `target.rowOrder === 'bottomUp'` 反一次行序。
 *
 * 便捷层（`src/gfx`）的 `Renderer` 会在「渲染进纹理」的通道上自动用第 1 条，所以用 gfx 绘制时
 * 两个后端无感一致（见 `gfx` 的 `RendererOptions.rowOrder`）。
 */
export const RowOrder = {
  TopLeft: 'topLeft',
  BottomUp: 'bottomUp',
} as const;

export type RowOrder = (typeof RowOrder)[keyof typeof RowOrder];

/** 清除颜色。接受 CSS 字符串、`0xRRGGBB`、0..1 范围的 `[r,g,b,a]` 以及 `{ r, g, b, a }`。 */
export type Color =
  | string
  | number
  | readonly [number, number, number]
  | readonly [number, number, number, number]
  | { r: number; g: number; b: number; a?: number };

export interface ColorAttachment {
  view: TextureView;
  /** 多重采样 attachment 的 resolve 目标。 */
  resolveTarget?: TextureView;
  loadOp?: LoadOp;
  storeOp?: StoreOp;
  clearValue?: Color;
}

export interface DepthStencilAttachment {
  view: TextureView;
  depthLoadOp?: LoadOp;
  depthStoreOp?: StoreOp;
  depthClearValue?: number;
  depthReadOnly?: boolean;
  stencilLoadOp?: LoadOp;
  stencilStoreOp?: StoreOp;
  stencilClearValue?: number;
  stencilReadOnly?: boolean;
}

export interface RenderTargetDescriptor {
  label?: string;
  width?: number;
  height?: number;
  /** 可以是一个格式，也可以为每个 color attachment 各指定一个。默认为 `'rgba8unorm'`。 */
  color?: TextureFormat | readonly TextureFormat[];
  /**
   * 深度/模板格式。`true` 等价于 `'depth24plus'`；`false`/`null` 表示不要深度附件。
   */
  depth?: TextureFormat | boolean | null;
  /** MSAA 采样数；默认为 1。 */
  sampleCount?: number;
  mipLevelCount?: number;
  /** 追加 `TextureBinding` usage，使结果之后可以被采样。 */
  sampled?: boolean;
  /** 额外的 usage，例如用于 readback 的 `CopySrc`。 */
  usage?: TextureUsage;
}

export interface RenderTarget extends Disposable {
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly colorFormats: readonly TextureFormat[];
  readonly colorFormat: TextureFormat;
  readonly depthFormat: TextureFormat | null;
  readonly sampleCount: number;
  readonly mipLevelCount: number;
  /**
   * 这个目标的后端原生行序（见 {@link RowOrder}）。WebGPU 恒为 `'topLeft'`，
   * WebGL2 恒为 `'bottomUp'`；本层如实上报，不自动翻转。
   */
  readonly rowOrder: RowOrder;
  /** 颜色 texture；索引 0 为主 texture。 */
  readonly colors: readonly Texture[];
  readonly depth: Texture | null;
  /** 可直接交给 `beginRenderPass` 的 attachment view。 */
  readonly colorAttachments: readonly ColorAttachment[];
  readonly depthStencilAttachment: DepthStencilAttachment | null;

  /** 调整 target 尺寸并重建 texture。尺寸发生变化时返回 true。 */
  resize(width: number, height: number): boolean;
  /** 按给定的清除行为为该 target 创建 render pass descriptor。 */
  createPassDescriptor(options?: {
    loadOp?: LoadOp;
    storeOp?: StoreOp;
    clearValue?: Color;
    depthLoadOp?: LoadOp;
    depthClearValue?: number;
  }): { colorAttachments: readonly ColorAttachment[]; depthStencilAttachment: DepthStencilAttachment | null };
  destroy(): void;
}
