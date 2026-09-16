/**
 * 最小消费方 C2：只用 gfx 便捷层（真实使用方的常见形态），同样锁定 webgl2 后端。
 *
 * `Renderer` 内部走 `createDeviceWithAdapter` → `default-registry`，
 * 所以这条路径**必然**在模块图上触及 WebGPU 后端工厂。
 */

import { Renderer, PerspectiveCamera, shapes, materials } from '@dxyl/gpu-device-api';

export async function boot(canvas: HTMLCanvasElement): Promise<void> {
  const renderer = await Renderer.create({ canvas, backend: 'webgl2' });
  const camera = new PerspectiveCamera({ position: [0, 1.2, 3] });
  renderer.setCamera(camera);
  const sphere = renderer.createGeometry(shapes.createSphere());
  const lambert = renderer.createMaterial(materials.lambert({ color: [1, 0.6, 0.2, 1] }));
  renderer.beginFrame({ color: '#101418' });
  renderer.draw(sphere, { material: lambert });
  renderer.endFrame();
}
