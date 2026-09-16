/**
 * 实测消费方 C5：从**真实**的子入口 `@dxyl/gpu-device-api/webgl2` 导入经 core 复用的
 * 公开 API 与 WebGL2 后端，并**在编译期**走 `WebGL2Adapter.request()`（不经过
 * `createDevice` 的自动探测；那条路径必然把 WebGPU 一起拉进来）。
 *
 * 语义上等价于批 14 之前 C1 的写法（core 层 + 只用 WebGL2），只是换成从 `/webgl2` 子入口拿类型。
 */

import { WebGL2Adapter, BufferUsage } from '@dxyl/gpu-device-api/webgl2';

export async function boot(canvas: HTMLCanvasElement): Promise<number> {
  const adapter = await WebGL2Adapter.request({ canvas });
  const device = await adapter.requestDevice({ label: 'consumer-c5' });
  const buffer = device.createBuffer({
    label: 'c5-vbo',
    size: 3 * 4 * 2,
    usage: BufferUsage.Vertex,
  });
  const target = device.createRenderTarget({ label: 'c5-target', width: 8, height: 8, depth: true });
  const encoder = device.createCommandEncoder({ label: 'c5-encoder' });
  const pass = encoder.beginRenderPass({
    colorAttachments: [],
    target,
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
  });
  pass.setVertexBuffer(0, buffer);
  pass.end();
  device.queue.submit([encoder.finish()]);
  const bytes = buffer.size + target.width;
  buffer.destroy();
  target.destroy();
  return bytes;
}

