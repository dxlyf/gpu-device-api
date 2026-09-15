/**
 * command encoder 生命周期与设备资源追踪的回归测试。
 *
 * ## 被修复的缺陷（WebGPU）
 *
 * `WebGPUCommandEncoder.finish()` 不 `untrack(this)`，只有 `dispose()` 才摘。
 * 而 core 的 `CommandEncoder` 接口里**没有** `dispose()`（见 `src/core/render/CommandEncoder.ts`），
 * 所以「每帧 `createCommandEncoder()` → `finish()` → 丢掉」这种最标准的用法会让
 * `WebGPUDevice.resources` 无上限增长：每个 encoder 包装对象与它的原生 `GPUCommandEncoder`
 * 都被强引用到 `device.dispose()` 为止。这是每帧一次的泄漏。
 *
 * ## 语义安全性（为什么 finish() 里摘掉不会留下悬空引用）
 *
 * `finish()` 之后 encoder 的**每一个**方法都会先过 `assertRecording()` 并抛错
 * （`beginRenderPass` / `beginComputePass` / 所有 copy / `clearBuffer` / `resolveQuerySet` /
 * `writeTimestamp` / 三个 debug marker 方法 / `finish` 自身），唯一的例外是幂等的 `dispose()`。
 * 也就是说 finish 之后它不可能再产生任何设备侧的工作，设备追踪集合存在的唯一目的
 * （`device.dispose()` 时统一释放）对它已经没有意义，提前摘掉不会造成悬空引用。
 *
 * ## WebGL2 侧
 *
 * `WebGL2Device.createCommandEncoder()` **不**把 encoder 登记进追踪集合（它不持有任何 GL 资源，
 * 命令是立即下发的），也没有 `dispose()`。下面用同一个计数断言把它钉住：WebGL2 侧没有同形问题。
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../src/core/errors/ValidationError.js';
import type { CommandEncoder } from '../src/core/render/CommandEncoder.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';

/* ------------------------------------------------------------------ WebGPU -------------------- */

interface WebGpuEncoderHarness {
  device: WebGPUDevice;
  /** 原生 encoder 一共被创建了多少个（用于确认测试真的跑了 N 帧）。 */
  createdEncoders(): number;
}

function createWebGpuHarness(): WebGpuEncoderHarness {
  let encoders = 0;
  const native = {
    label: 'mock-device',
    queue: {},
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: () => ({ destroy: () => {} }),
    createTexture: () => ({ destroy: () => {}, createView: () => ({}) }),
    createCommandEncoder: () => {
      encoders += 1;
      return {
        label: `native-encoder#${encoders}`,
        finish: () => ({ label: `native-command-buffer#${encoders}` }),
      };
    },
    destroy: () => {},
  } as unknown as GPUDevice;

  const device = new WebGPUDevice(native, {
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

  return { device, createdEncoders: () => encoders };
}

describe('WebGPU：command encoder 每帧 create + finish 不堆积', () => {
  it('连续 120 帧 createCommandEncoder() + finish() 之后，追踪计数回到基线', () => {
    const harness = createWebGpuHarness();
    const device = harness.device;
    const baseline = device.trackedResourceCount;

    for (let frame = 0; frame < 120; frame += 1) {
      const encoder = device.createCommandEncoder({ label: `frame#${frame}` });
      expect(device.trackedResourceCount).toBe(baseline + 1);
      encoder.finish();
    }

    expect(harness.createdEncoders()).toBe(120);
    // 修复前这里是 baseline + 120（每帧一个 encoder 一直留到 device.dispose()）。
    expect(device.trackedResourceCount).toBe(baseline);

    device.dispose();
  });

  it('finish() 之后仍然可以安全地 dispose()（幂等，不抛错、计数不变）', () => {
    const harness = createWebGpuHarness();
    const device = harness.device;
    const encoder = device.createCommandEncoder();

    encoder.finish();
    expect(device.trackedResourceCount).toBe(0);

    expect(() => encoder.dispose()).not.toThrow();
    expect(() => encoder.dispose()).not.toThrow();
    expect(device.trackedResourceCount).toBe(0);
    expect(encoder.disposed).toBe(true);

    device.dispose();
  });

  it('尚未 finish 的 encoder 仍然被追踪（device.dispose() 会释放它）', () => {
    const harness = createWebGpuHarness();
    const device = harness.device;
    const encoder = device.createCommandEncoder();

    expect(device.trackedResourceCount).toBe(1);
    device.dispose();
    expect(encoder.disposed).toBe(true);
    expect(device.trackedResourceCount).toBe(0);
  });

  it('finish() 之后再调用它的任何方法都会抛错（提前摘掉追踪不会留下可用引用）', () => {
    const harness = createWebGpuHarness();
    const device = harness.device;
    const encoder = device.createCommandEncoder();

    encoder.finish();

    expect(() => encoder.finish()).toThrow(/already been finished/);
    expect(() => encoder.pushDebugGroup('late')).toThrow(/already been finished/);
    expect(() => encoder.popDebugGroup()).toThrow(/already been finished/);
    expect(() => encoder.insertDebugMarker('late')).toThrow(/already been finished/);
    expect(() => encoder.clearBuffer({ size: 16 }, 0, 16)).toThrow(/already been finished/);
    expect(() => encoder.beginRenderPass({ colorAttachments: [] })).toThrow(/already been finished/);
    expect(() => encoder.beginComputePass()).toThrow(/already been finished/);

    device.dispose();
  });
});

/* ------------------------------------------------------------------ WebGL2 -------------------- */

interface WebGl2Harness {
  device: WebGL2Device;
  createEncoder(): CommandEncoder;
}

function createWebGl2Harness(): WebGl2Harness {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'encoder-tracking-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
  return { device, createEncoder: () => device.createCommandEncoder() };
}

describe('WebGL2：command encoder 本来就不进追踪集合（无同形缺陷）', () => {
  it('createCommandEncoder() 与 finish() 都不改变追踪计数', () => {
    const harness = createWebGl2Harness();
    const device = harness.device;
    const baseline = device.trackedResourceCount;

    for (let frame = 0; frame < 120; frame += 1) {
      const encoder = harness.createEncoder();
      // WebGL2 的 encoder 是立即模式的记账对象，不持有 GL 资源，因此从不登记。
      expect(device.trackedResourceCount).toBe(baseline);
      encoder.finish();
      expect(device.trackedResourceCount).toBe(baseline);
    }

    expect(device.trackedResourceCount).toBe(baseline);
    device.dispose();
  });

  it('finish() 之后再调用它的方法同样抛错（与 WebGPU 一致的契约）', () => {
    const harness = createWebGl2Harness();
    const encoder = harness.createEncoder();
    encoder.finish();

    expect(() => encoder.beginRenderPass({ colorAttachments: [] })).toThrow(ValidationError);
    expect(() => encoder.finish()).toThrow(/finish\(\)/);

    harness.device.dispose();
  });
});
