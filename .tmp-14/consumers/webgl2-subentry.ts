/**
 * 反事实探针（counterfactual）：**假如**存在一个 `@dxyl/gpu-device-api/webgl2` 子入口，
 * 它只导出 core + WebGL2 后端（不引用 `factories/default-registry`，因此不触及 WebGPU），
 * 那么「只用 WebGL2」的消费方能省多少字节？
 *
 * 这条**不是**当前包的用法（当前包没有子入口），它只是用来给「切子入口值不值」定上限：
 * 如果连它的体积都和 C3 一样，那切子入口也没用；否则差值就是第二步能拿到的收益上界。
 *
 * 注意代码形状刻意与 C1 逐行对应，只把 `createDevice()` 换成
 * `WebGL2Adapter.request()` + `requestDevice()`。
 */

import { WebGL2Adapter, BufferUsage } from '@dxyl/gpu-device-api/webgl2';

export async function boot(canvas: HTMLCanvasElement): Promise<number> {
  const adapter = await WebGL2Adapter.request({ canvas });
  const device = await adapter.requestDevice({ label: 'consumer-c4' });
  const buffer = device.createBuffer({
    label: 'c4-vbo',
    size: 3 * 4 * 2,
    usage: BufferUsage.Vertex,
  });
  const target = device.createRenderTarget({ label: 'c4-target', width: 8, height: 8, depth: true });
  const encoder = device.createCommandEncoder({ label: 'c4-encoder' });
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
