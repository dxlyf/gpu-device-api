/** 离屏 render target：一个或多个 color attachment，外加可选的 depth/stencil attachment。 */

import type { Disposable } from '../../utils/Disposable.js';
import type { LoadOp } from '../enums/LoadOp.js';
import type { StoreOp } from '../enums/StoreOp.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { TextureUsage } from '../enums/TextureUsage.js';
import type { Texture } from '../resources/Texture.js';
import type { TextureView } from '../resources/TextureView.js';

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
