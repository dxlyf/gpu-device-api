/**
 * 示例共用的离屏像素自检工具。
 *
 * 做法与 `examples/index.html` 的 `?verify=1` 一致：把场景画进一张小尺寸离屏目标，用 core 的
 * `copyTextureToBuffer` 读回像素，再统计「有多少像素不是清屏色」「出现过多少种颜色」。
 * 这套流程两个后端都走同一份实现，所以它既能验证「有没有画出东西」，也能验证
 * 「每个物体是否拿到了自己的 uniform」（颜色全都一样通常意味着 uniform 串了）。
 *
 * 三个容易踩的点已经在这里处理掉：
 * 1. `RenderTargetDescriptor.usage` 会同时作用在颜色与深度附件上，而 WebGPU 里 `depth24plus`
 *    的内存布局是实现定义的、不能参与拷贝 —— 所以这里用 `depth32float`；
 * 2. 要读回就必须声明 `TextureUsage.CopySrc`；
 * 3. WebGPU 规定 `MapRead` 只能与 `CopyDst` 组合。
 */

import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import type { Color } from '../src/core/render/RenderTarget.js';
import type { Renderer } from '../src/gfx/index.js';

export interface PixelStats {
  readonly width: number;
  readonly height: number;
  /** 与清屏色不同的像素个数。 */
  readonly litPixels: number;
  /** 出现过的不同颜色个数（不含清屏色）。 */
  readonly distinctColors: number;
  /** 画面中心像素。 */
  readonly center: readonly [number, number, number];
  /** 出现次数最多的那个非清屏色。 */
  readonly dominant: readonly [number, number, number];
}

/** 颜色的字节表示，用于和清屏色比较。 */
function toBytes(color: Color | undefined): [number, number, number] {
  if (color === undefined) return [0, 0, 0];
  if (Array.isArray(color) || ArrayBuffer.isView(color)) {
    const list = color as ArrayLike<number>;
    return [
      Math.round((list[0] ?? 0) * 255),
      Math.round((list[1] ?? 0) * 255),
      Math.round((list[2] ?? 0) * 255),
    ];
  }
  if (typeof color === 'string') {
    const named: Record<string, string> = { black: '#000000', white: '#ffffff' };
    const text = named[color] ?? color;
    if (text.startsWith('#') && text.length === 7) {
      return [
        parseInt(text.slice(1, 3), 16),
        parseInt(text.slice(3, 5), 16),
        parseInt(text.slice(5, 7), 16),
      ];
    }
    return [0, 0, 0];
  }
  if (typeof color === 'number') {
    return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
  }
  const value = color as { r: number; g: number; b: number };
  return [Math.round(value.r * 255), Math.round(value.g * 255), Math.round(value.b * 255)];
}

/**
 * 把 `draw()` 画进一张离屏目标并读回像素统计。
 *
 * @param draw 在已经打开的渲染通道里绘制场景（`renderer.beginFrame` 已由本函数调用）
 */
export async function verifyOffscreen(
  renderer: Renderer,
  width: number,
  height: number,
  clear: Color,
  draw: () => void,
): Promise<PixelStats> {
  const { device } = renderer;
  // WebGPU 要求 `copyTextureToBuffer` 的 bytesPerRow 是 **256 的倍数**（一行像素只有 width*4 字节），
  // 所以按 256 对齐申请，读回后逐行去掉填充。WebGL2 没这条限制，同样的写法也能用。
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const rowBytes = width * 4;
  const byteLength = bytesPerRow * height;
  const target = device.createRenderTarget({
    label: 'verify-target',
    width,
    height,
    color: 'rgba8unorm',
    depth: 'depth32float',
    usage: TextureUsage.CopySrc,
  });
  const readback = device.createBuffer({
    label: 'verify-readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });

  renderer.beginFrame({ target, color: clear });
  draw();
  renderer.endFrame();

  const encoder = device.createCommandEncoder({ label: 'verify-readback' });
  encoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish()]);

  await readback.mapAsync('read', 0, byteLength);
  // unmap 之后映射内存就失效了，所以先把像素拷出来。
  const raw = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
  readback.unmap();
  readback.destroy();
  target.destroy();

  const pixels = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    pixels.set(raw.subarray(y * bytesPerRow, y * bytesPerRow + rowBytes), y * rowBytes);
  }

  const background = toBytes(clear);
  const counts = new Map<number, number>();
  let litPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index]!;
    const g = pixels[index + 1]!;
    const b = pixels[index + 2]!;
    if (Math.abs(r - background[0]) <= 4 && Math.abs(g - background[1]) <= 4 && Math.abs(b - background[2]) <= 4) {
      continue;
    }
    litPixels += 1;
    const key = (r << 16) | (g << 8) | b;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let dominantKey = 0;
  let dominantCount = -1;
  for (const [key, value] of counts) {
    if (value > dominantCount) {
      dominantKey = key;
      dominantCount = value;
    }
  }

  const centerIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
  return {
    width,
    height,
    litPixels,
    distinctColors: counts.size,
    center: [pixels[centerIndex]!, pixels[centerIndex + 1]!, pixels[centerIndex + 2]!],
    dominant: [(dominantKey >> 16) & 255, (dominantKey >> 8) & 255, dominantKey & 255],
  };
}
