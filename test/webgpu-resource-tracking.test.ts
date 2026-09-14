/**
 * WebGPU 设备资源追踪的生命周期回归测试。
 *
 * 场景：每帧 create/destroy 的资源（uniform buffer、command encoder……）必须从
 * `WebGPUDevice` 的追踪集合里摘掉，否则包装对象与原生句柄会一直留到 `dispose()`。
 *
 * 这里用一个最小 mock 原生 `GPUDevice`（不依赖浏览器/真实 WebGPU），只验证
 * 「资源释放时有没有通知设备」。`trackedResourceCount` 是设备上的诊断用只读属性，
 * 不属于 core 的 `Device` 接口。
 */

import { describe, expect, it } from 'vitest';

import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';

function createMockDevice(): WebGPUDevice {
  let bufferId = 0;
  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: () => ({ label: `native-buffer#${(bufferId += 1)}`, destroy: () => {} }),
    createTexture: () => ({ destroy: () => {}, createView: () => ({}) }),
    createCommandEncoder: () => ({ label: 'native-encoder' }),
    destroy: () => {},
  } as unknown as GPUDevice;

  return new WebGPUDevice(native, {
    descriptor: { label: 'mock-device', defaultSampleCount: 1, requiredFeatures: [] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    adapterFeatures: new Set<string>(),
  });
}

describe('WebGPUDevice 资源追踪', () => {
  it('destroy 后的 buffer 会从追踪集合里移除（每帧 create/destroy 不再堆积）', () => {
    const device = createMockDevice();
    const baseline = device.trackedResourceCount;

    const buffers = Array.from({ length: 500 }, () => device.createBuffer({ size: 16, usage: BufferUsage.Vertex }));
    expect(device.trackedResourceCount).toBe(baseline + 500);

    for (const buffer of buffers) buffer.destroy();
    expect(device.trackedResourceCount).toBe(baseline);

    device.dispose();
  });

  it('texture 与 command encoder 释放后同样回落', () => {
    const device = createMockDevice();
    const texture = device.createTexture({
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: TextureUsage.RenderAttachment,
    });
    const encoder = device.createCommandEncoder();
    expect(device.trackedResourceCount).toBe(2);

    encoder.dispose();
    texture.destroy();
    expect(device.trackedResourceCount).toBe(0);

    device.dispose();
  });

  it('设备 dispose() 仍然会释放尚未手动销毁的资源', () => {
    const device = createMockDevice();
    const buffer = device.createBuffer({ size: 16, usage: BufferUsage.Vertex });

    device.dispose();

    expect(buffer.disposed).toBe(true);
    expect(device.trackedResourceCount).toBe(0);
    // 幂等：再 dispose 一次不会抛错。
    expect(() => device.dispose()).not.toThrow();
  });
});
