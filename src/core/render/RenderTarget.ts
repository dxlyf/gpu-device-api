/** Off-screen render targets: color attachment(s) plus an optional depth/stencil attachment. */

import type { Disposable } from '../../utils/Disposable.js';
import type { LoadOp } from '../enums/LoadOp.js';
import type { StoreOp } from '../enums/StoreOp.js';
import type { TextureFormat } from '../enums/TextureFormat.js';
import type { TextureUsage } from '../enums/TextureUsage.js';
import type { Texture } from '../resources/Texture.js';
import type { TextureView } from '../resources/TextureView.js';

/** Clear color. Accepts CSS strings, `0xRRGGBB`, `[r,g,b,a]` in 0..1 and `{ r, g, b, a }`. */
export type Color =
  | string
  | number
  | readonly [number, number, number]
  | readonly [number, number, number, number]
  | { r: number; g: number; b: number; a?: number };

export interface ColorAttachment {
  view: TextureView;
  /** Resolve target for multisampled attachments. */
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
  /** One format, or one per color attachment. Defaults to `'rgba8unorm'`. */
  color?: TextureFormat | readonly TextureFormat[];
  /** Depth/stencil format, or `false`/`null` for a color-only target. */
  depth?: TextureFormat | false | null;
  /** MSAA sample count; defaults to 1. */
  sampleCount?: number;
  mipLevelCount?: number;
  /** Adds `TextureBinding` usage so the result can be sampled afterwards. */
  sampled?: boolean;
  /** Extra usages, e.g. `CopySrc` for readback. */
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
  /** Color textures; index 0 is the primary one. */
  readonly colors: readonly Texture[];
  readonly depth: Texture | null;
  /** Attachment views ready to be handed to `beginRenderPass`. */
  readonly colorAttachments: readonly ColorAttachment[];
  readonly depthStencilAttachment: DepthStencilAttachment | null;

  /** Resizes the target, recreating the textures. Returns true when the size changed. */
  resize(width: number, height: number): boolean;
  /** Creates a render pass descriptor for this target with the given clear behaviour. */
  createPassDescriptor(options?: {
    loadOp?: LoadOp;
    storeOp?: StoreOp;
    clearValue?: Color;
    depthLoadOp?: LoadOp;
    depthClearValue?: number;
  }): { colorAttachments: readonly ColorAttachment[]; depthStencilAttachment: DepthStencilAttachment | null };
  destroy(): void;
}
