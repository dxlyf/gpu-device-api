/**
 * 最小消费方 C1：只用 core 层，且**运行时**锁定 webgl2 后端。
 *
 * 用途：批 14 第一步测量 —— 一个只用 WebGL2 的使用方，到底有没有把整个 WebGPU 后端
 * 也打进自己的 bundle。注意 `backend: 'webgl2'` 是**运行时的字符串**，
 * 打包器无法据此静态裁掉 `default-registry.ts` 里的 `WebGPUFactory`。
 */

import { createDevice, BufferUsage } from '@dxyl/gpu-device-api';

export async function boot(canvas: HTMLCanvasElement): Promise<number> {
  const device = await createDevice({ backend: 'webgl2', canvas, label: 'consumer-c1' });
  const buffer = device.createBuffer({
    label: 'c1-vbo',
    size: 3 * 4 * 2,
    usage: BufferUsage.Vertex,
  });
  const target = device.createRenderTarget({ label: 'c1-target', width: 8, height: 8, depth: true });
  const encoder = device.createCommandEncoder({ label: 'c1-encoder' });
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
