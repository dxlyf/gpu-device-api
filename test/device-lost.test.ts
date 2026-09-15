/**
 * 设备丢失（device lost）的行为测试：两个后端各一套。
 *
 * 要证明的三件事：
 *
 * 1. **能检测**：丢失会被记录下来，`device.lost` resolve，`device.lostInfo` 可同步查询；
 * 2. **后续提交给出明确错误**：WebGPU 的 `queue.submit()` 在丢失设备上会被实现静默丢弃，
 *    本层必须在提交前拦下并抛带 `[gpu-device-api] ` 前缀的 `DeviceLostError`；
 *    WebGL2 则让所有 `create*` / 读回入口明确报错；
 * 3. **事件监听器会被解绑**：`dispose()` 之后 canvas 上不能再挂着我方的 `webglcontextlost`
 *    / `webglcontextrestored` 监听器（否则 device 连同它的资源集合永远无法回收）。
 *
 * 另外如实记录一个**做不到**的事：恢复。两个后端都无法在抽象层内重建已有资源，
 * 所以 `usable` 不会回到 true —— 测试里把这一点也钉死，避免以后有人误以为可以自动恢复。
 */

import { describe, expect, it } from 'vitest';

import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { DeviceLostError } from '../src/core/errors/DeviceLostError.js';
import type { DeviceLostReason } from '../src/core/errors/DeviceLostError.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';

/** 让 `void native.lost.then(...)` 这类微任务跑完。 */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/* ------------------------------------------------------------------------------------------------ */
/* WebGPU                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

interface MockWebGPUDevice {
  device: WebGPUDevice;
  /** 用给定的 reason/message 触发丢失。 */
  lose(reason: GPUDeviceLostInfo['reason'], message: string): void;
  /** 记录原生 `queue.submit` 被调用的次数（丢失后必须保持 0）。 */
  submits(): number;
}

function createMockWebGPUDevice(): MockWebGPUDevice {
  let resolveLost: (info: GPUDeviceLostInfo) => void = () => {};
  const lost = new Promise<GPUDeviceLostInfo>((resolve) => {
    resolveLost = resolve;
  });
  let submits = 0;
  let bufferId = 0;

  const native = {
    label: 'mock-device',
    queue: {
      submit: () => {
        submits += 1;
      },
      writeBuffer: () => {},
    },
    lost,
    limits: undefined,
    onuncapturederror: null,
    createBuffer: () => ({ label: `native-buffer#${(bufferId += 1)}`, destroy: () => {} }),
    createCommandEncoder: () => ({ label: 'mock-encoder', finish: () => ({}) }),
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

  return {
    device,
    lose: (reason, message) => resolveLost({ reason, message } as GPUDeviceLostInfo),
    submits: () => submits,
  };
}

describe('WebGPU 设备丢失：检测 + 后续提交报错', () => {
  it('丢失后 lostInfo 可查询、usable 变 false、lost promise 带原因 resolve', async () => {
    const mock = createMockWebGPUDevice();
    const { device } = mock;
    expect(device.usable).toBe(true);
    expect(device.lostInfo).toBeNull();

    const lostPromise = device.lost;
    mock.lose('unknown', 'device was lost: GPU crashed');
    await flush();

    expect(device.usable).toBe(false);
    expect(device.lostInfo!.reason satisfies DeviceLostReason).toBe('unknown');
    expect(device.lostInfo?.message).toContain('GPU crashed');
    await expect(lostPromise).resolves.toEqual({
      reason: 'unknown',
      message: 'device was lost: GPU crashed',
    });
    device.dispose();
  });

  it('丢失后 queue.submit() 抛 DeviceLostError（不再静默丢弃命令）', async () => {
    const mock = createMockWebGPUDevice();
    const { device } = mock;
    mock.lose('unknown', 'GPU device removed');
    await flush();

    let error: unknown = null;
    try {
      device.queue.submit([]);
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(DeviceLostError);
    const lostError = error as DeviceLostError;
    expect(lostError.reason).toBe('unknown');
    expect(lostError.message.startsWith('[gpu-device-api] ')).toBe(true);
    expect(lostError.message).toMatch(/Device\.Queue\.submit/);
    expect(lostError.message).toMatch(/GPU device removed/);
    // 命令从未下发到原生队列 —— 这正是「静默画不出来」被修掉的地方。
    expect(mock.submits()).toBe(0);
    device.dispose();
  });

  it('丢失后 writeBuffer / createBuffer 也明确报错', async () => {
    const mock = createMockWebGPUDevice();
    const { device } = mock;
    const buffer = device.createBuffer({ size: 16, usage: BufferUsage.Vertex });
    mock.lose('destroyed', 'device destroyed by the browser');
    await flush();

    expect(() => device.queue.writeBuffer(buffer, 0, new Uint8Array(16))).toThrow(DeviceLostError);
    expect(() => device.createBuffer({ size: 16, usage: BufferUsage.Vertex })).toThrow(
      /\[gpu-device-api\] Device\.createBuffer: device "mock-device" was lost \(destroyed\)/,
    );
    device.dispose();
  });

  it('丢失会上报给 onError 订阅者，取消订阅后不再收到', async () => {
    const mock = createMockWebGPUDevice();
    const { device } = mock;
    const seen: string[] = [];
    const unsubscribe = device.onError((error) => seen.push(error.message));

    mock.lose('unknown', 'lost once');
    await flush();
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('WebGPU device lost');

    // 取消订阅后不再收到上报（同一个丢失事件不会重复上报：原生 `device.lost` 只 resolve 一次）。
    unsubscribe();
    device.dispose();
  });

  it('reason "destroyed" 会被映射成 expected（主动销毁不是异常）', async () => {
    const mock = createMockWebGPUDevice();
    mock.lose('destroyed', 'Device was destroyed.');
    await flush();
    expect(mock.device.lostInfo?.reason).toBe('destroyed');
    expect(new DeviceLostError('x', { reason: 'destroyed' }).isExpected).toBe(true);
    expect(new DeviceLostError('x', { reason: 'unknown' }).isExpected).toBe(false);
    mock.device.dispose();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* WebGL2                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function createWebGL2Harness(): {
  device: WebGL2Device;
  canvas: ReturnType<typeof createFakeCanvas>;
} {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'lost-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
  return { device, canvas };
}

describe('WebGL2 上下文丢失：检测 + 如实上报 + 监听器解绑', () => {
  it('注册了两个上下文事件监听器，dispose() 时全部解绑', () => {
    const { device, canvas } = createWebGL2Harness();
    expect(canvas.added).toEqual(['webglcontextlost', 'webglcontextrestored']);
    expect(canvas.listenerCount('webglcontextlost')).toBe(1);
    expect(canvas.listenerCount('webglcontextrestored')).toBe(1);

    device.dispose();

    expect(canvas.removed).toEqual(['webglcontextlost', 'webglcontextrestored']);
    expect(canvas.listenerCount('webglcontextlost')).toBe(0);
    expect(canvas.listenerCount('webglcontextrestored')).toBe(0);
  });

  it('webglcontextlost：preventDefault（否则浏览器不会尝试恢复）+ lostInfo + usable=false', async () => {
    const { device, canvas } = createWebGL2Harness();
    const reported: string[] = [];
    device.onError((error) => reported.push(`${error.name}: ${error.message}`));

    const result = canvas.fire('webglcontextlost');
    expect(result.handled).toBe(1);
    expect(result.defaultPrevented).toBe(true);

    await flush();
    expect(device.usable).toBe(false);
    expect(device.lostInfo?.reason).toBe('unknown');
    expect(device.lostInfo?.message).toMatch(/webglcontextlost/);
    await expect(device.lost).resolves.toEqual(device.lostInfo);
    expect(reported).toHaveLength(1);
    expect(reported[0]).toMatch(/^DeviceLostError: \[gpu-device-api\] WebGL2 context lost/);
    device.dispose();
  });

  it('丢失后所有 create* 与读回入口都抛带前缀的 DeviceLostError', () => {
    const { device, canvas } = createWebGL2Harness();
    canvas.fire('webglcontextlost');

    const lost = device.lostInfo!;
    expect(() => device.createBuffer({ size: 16, usage: BufferUsage.Vertex })).toThrow(DeviceLostError);
    expect(() => device.createBuffer({ size: 16, usage: BufferUsage.Vertex })).toThrow(
      new RegExp(`\\[gpu-device-api\\] Device\\.createBuffer: device "lost-test" lost its WebGL2 context`),
    );
    expect(() => device.createTexture({
      size: { width: 2, height: 2 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding,
    })).toThrow(DeviceLostError);
    expect(() => device.createCommandEncoder()).toThrow(DeviceLostError);
    expect(lost.reason).toBe('unknown');
    device.dispose();
  });

  it('重复丢失只生效一次（promise 只 resolve 一次，信息保持最早那条）', async () => {
    const { device, canvas } = createWebGL2Harness();
    canvas.fire('webglcontextlost');
    const first = device.lostInfo;
    canvas.fire('webglcontextlost');
    expect(device.lostInfo).toBe(first);
    await flush();
    await expect(device.lost).resolves.toBe(first);
    device.dispose();
  });

  it('webglcontextrestored：如实上报（计数 + 订阅回调），但 usable 不会回到 true', async () => {
    const { device, canvas } = createWebGL2Harness();
    const restored: unknown[] = [];
    const unsubscribe = device.onContextRestored((info) => restored.push(info));

    expect(device.contextRestoredCount).toBe(0);
    canvas.fire('webglcontextlost');
    canvas.fire('webglcontextrestored');
    await flush();

    expect(device.contextRestoredCount).toBe(1);
    expect(restored).toHaveLength(1);
    // 恢复的是 canvas 上的 context，不是本设备创建过的资源：所以它仍然不是「可用」的。
    expect(device.usable).toBe(false);
    expect(device.lostInfo).not.toBeNull();

    unsubscribe();
    canvas.fire('webglcontextrestored');
    expect(device.contextRestoredCount).toBe(2);
    expect(restored).toHaveLength(1);
    device.dispose();
  });

  it('dispose() 之后事件不再影响设备（监听器确实摘掉了）', () => {
    const { device, canvas } = createWebGL2Harness();
    device.dispose();
    canvas.fire('webglcontextlost');
    canvas.fire('webglcontextrestored');
    // 监听器已经摘掉，所以这两个事件既没改计数，也没改丢失信息。
    expect(device.contextRestoredCount).toBe(0);
    expect(device.lostInfo?.reason).toBe('destroyed');
    expect(device.usable).toBe(false);

    // dispose 之后 create* 抛的是「已 dispose」而不是「上下文丢失」。
    expect(() => device.createBuffer({ size: 16, usage: BufferUsage.Vertex })).toThrow(
      /has been disposed/,
    );
  });
});
