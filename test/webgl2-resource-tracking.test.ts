/**
 * WebGL2 设备资源追踪的生命周期回归测试。
 *
 * 背景与 WebGPU 侧（`test/webgpu-resource-tracking.test.ts`）完全相同：`WebGL2Device` 会把
 * 每个 `create*` 出来的资源登记进内部集合，`dispose()` 时统一释放。如果资源在自己的
 * `destroy()` / `dispose()` 里不把自己摘掉，「每帧 create/destroy」的用法（临时 buffer、
 * texture、bind group、render target……）就会让集合一直强引用已经释放的包装对象与原生句柄，
 * 直到 `device.dispose()` —— 那是实打实的泄漏。
 *
 * 这里用假 GL（见 `webgl2-fake-gl.ts`）在 node 里跑，与浏览器无关，
 * 断言的是**追踪集合的计数**，不是「假 GL 收到过调用」。
 */

import { describe, expect, it } from 'vitest';

import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import { QueryType } from '../src/core/resources/QuerySet.js';
import type { Disposable } from '../src/utils/Disposable.js';
import { createFakeCanvas, createFakeWebGL2, type FakeCanvas, type FakeWebGL2 } from './webgl2-fake-gl.js';

interface Harness {
  device: WebGL2Device;
  fake: FakeWebGL2;
  canvas: FakeCanvas;
}

function createHarness(): Harness {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'tracking-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
  return { device, fake, canvas };
}

describe('WebGL2Device 资源追踪', () => {
  it('destroy 后的 buffer 会从追踪集合里移除（每帧 create/destroy 不再堆积）', () => {
    const { device } = createHarness();
    const baseline = device.trackedResourceCount;

    const buffers = Array.from({ length: 500 }, () =>
      device.createBuffer({ size: 16, usage: BufferUsage.Vertex }),
    );
    expect(device.trackedResourceCount).toBe(baseline + 500);

    for (const buffer of buffers) buffer.destroy();
    expect(device.trackedResourceCount).toBe(baseline);

    device.dispose();
  });

  it('每一类资源释放后计数都回落（texture / shader / bind group / layout / render target / query set）', () => {
    const { device } = createHarness();
    const baseline = device.trackedResourceCount;

    const texture = device.createTexture({
      label: 'tracking-texture',
      size: { width: 4, height: 4 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    const shader = device.createShaderModule({
      label: 'tracking-shader',
      code: { vs: 'void main() {}', fs: 'void main() {}' },
    });
    const layout = device.createBindGroupLayout({
      label: 'tracking-bgl',
      entries: [{ binding: 0, visibility: ShaderStage.Vertex, type: 'uniform', name: 'globals' }],
    });
    const buffer = device.createBuffer({ size: 64, usage: BufferUsage.Uniform | BufferUsage.CopyDst });
    const bindGroup = device.createBindGroup({
      label: 'tracking-bg',
      layout,
      entries: [{ binding: 0, resource: { buffer } }],
    });
    const pipelineLayout = device.createPipelineLayout({
      label: 'tracking-pl',
      bindGroupLayouts: [layout],
    });
    const target = device.createRenderTarget({
      label: 'tracking-target',
      width: 8,
      height: 8,
      color: 'rgba8unorm',
      depth: 'depth24plus',
    });
    const querySet = device.createQuerySet({ label: 'tracking-query', type: QueryType.Occlusion, count: 2 });
    const sampler = device.createSampler({ label: 'tracking-sampler', magFilter: 'nearest' });

    // 纹理 1 + shader 1 + layout 1 + buffer 1 + bindGroup 1 + pipelineLayout 1 +
    // render target 1（它自己）+ 颜色附件 1 + 深度附件 1 + query set 1 + sampler 1
    expect(device.trackedResourceCount).toBe(baseline + 11);

    querySet.destroy();
    target.destroy();
    pipelineLayout.dispose();
    bindGroup.dispose();
    sampler.dispose();
    buffer.destroy();
    layout.dispose();
    shader.dispose();
    texture.destroy();

    expect(device.trackedResourceCount).toBe(baseline);
    device.dispose();
  });

  it('重复 destroy / dispose 是幂等的（不会重复通知、计数不会变负）', () => {
    const { device } = createHarness();
    const baseline = device.trackedResourceCount;
    const buffer = device.createBuffer({ size: 16, usage: BufferUsage.Vertex });
    const layout = device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: ShaderStage.Fragment, type: 'sampler', name: 'texSampler' }],
    });
    const shader = device.createShaderModule({ code: { vs: 'void main() {}', fs: 'void main() {}' } });

    buffer.destroy();
    buffer.destroy();
    buffer.dispose();
    layout.dispose();
    layout.dispose();
    shader.dispose();
    shader.dispose();

    expect(device.trackedResourceCount).toBe(baseline);
    device.dispose();
    device.dispose();
    expect(device.trackedResourceCount).toBe(0);
  });

  it('untrack 从未登记过的对象不抛错，也不影响别人的计数', () => {
    const { device } = createHarness();
    const tracked = device.createBuffer({ size: 16, usage: BufferUsage.Vertex });
    const foreign: Disposable = { dispose: () => {}, disposed: false };

    expect(() => device.untrack(foreign)).not.toThrow();
    expect(device.trackedResourceCount).toBe(1);

    // 已经摘掉的对象再摘一次同样是空操作。
    device.untrack(tracked);
    expect(() => device.untrack(tracked)).not.toThrow();
    expect(device.trackedResourceCount).toBe(0);

    // dispose 之后再调也不该抛（清理顺序不总是调用方能控制的）。
    device.dispose();
    expect(() => device.untrack(tracked)).not.toThrow();
  });

  it('设备 dispose() 仍然会释放尚未手动销毁的资源', () => {
    const { device } = createHarness();
    const buffer = device.createBuffer({ size: 16, usage: BufferUsage.Vertex });
    const texture = device.createTexture({
      size: { width: 2, height: 2 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding,
    });

    device.dispose();

    expect(buffer.disposed).toBe(true);
    expect(texture.disposed).toBe(true);
    expect(device.trackedResourceCount).toBe(0);
  });
});
