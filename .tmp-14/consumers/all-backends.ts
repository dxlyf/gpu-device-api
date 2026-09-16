/**
 * 最小消费方 C3：对照组 —— 真正要用两个后端（`backend: 'auto'`，即默认行为）。
 *
 * 这条路径**必须**同时包含 WebGL2 与 WebGPU 两个后端。它是「C1 省下来的字节」
 * 的分母：如果 C1 与 C3 体积相同，说明树摇根本没起作用。
 * 与 C1 **只差一个字符串**（`'webgl2'` → `'auto'`），其它代码逐字相同。
 */

import { createDevice, BufferUsage } from '@dxyl/gpu-device-api';

export async function boot(canvas: HTMLCanvasElement): Promise<number> {
  const device = await createDevice({ backend: 'auto', canvas, label: 'consumer-c3' });
  const buffer = device.createBuffer({
    label: 'c3-vbo',
    size: 3 * 4 * 2,
    usage: BufferUsage.Vertex,
  });
  const target = device.createRenderTarget({ label: 'c3-target', width: 8, height: 8, depth: true });
  const encoder = device.createCommandEncoder({ label: 'c3-encoder' });
  const pass = encoder.beginRenderPass({
    colorAttachments: [],
    target,
    clearValue: { r: 1, g: 0, b: 0, a: 1 },
  });
  pass.setVertexBuffer(0, buffer);
  pass.end();
  device.queue.submit([encoder.finish()]);
  const bytes = buffer.size + target.width;
  buffer.destroy();
  target.destroy();
  return bytes;
}
