/**
 * WebGL2 上「没有 compute」这件事必须**明确报错**，而不是静默成功。
 *
 * 为什么值得单独钉一个测试：`createComputePipeline()` 若返回一个「什么都不做」的假管线，
 * 调用方会以为 kernel 跑过了、在别处看到莫名其妙的结果（本库一贯要避免的静默失败）。
 * 这里同时验证：
 * - 两条入口（`createComputePipeline` / `beginComputePass`）都抛带 `[gpu-device-api] ` 前缀的
 *   `ValidationError`，且消息里给出了替代方案；
 * - 失败的管线**不会**被登记进设备的资源追踪集合（不会留下一个假装存在的资源）。
 *
 * 真实的 WebGPU 计算数值证据由 `examples/compute.html` 在浏览器里跑出来
 * （逐元素严格比较 4096 个值 + 校验和），不在 node 里用假 GL 假装。
 */

import { describe, expect, it } from 'vitest';

import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { ValidationError } from '../src/core/errors/ValidationError.js';
import { createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';

function createDevice(): WebGL2Device {
  const fake = createFakeWebGL2();
  return new WebGL2Device({
    gl: fake.gl,
    canvas: createFakeCanvas().canvas,
    descriptor: { label: 'compute-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
}

describe('WebGL2 的 compute 限制：明确报错 + 给出替代方案', () => {
  it('createComputePipeline() 抛带前缀的 ValidationError，并说明替代方案', () => {
    const device = createDevice();
    const baseline = device.trackedResourceCount;
    const module = device.createShaderModule({
      label: 'kernel',
      code: { wgsl: '@compute @workgroup_size(1) fn csMain() {}' },
    });
    const afterModule = device.trackedResourceCount;

    let error: unknown = null;
    try {
      device.createComputePipeline({ label: 'nope', compute: { module, entryPoint: 'csMain' } });
    } catch (thrown) {
      error = thrown;
    }

    expect(error).toBeInstanceOf(ValidationError);
    const message = (error as ValidationError).message;
    expect(message.startsWith('[gpu-device-api] ')).toBe(true);
    expect(message).toMatch(/WebGL2/);
    expect(message).toMatch(/GLES 3\.1/);
    // 必须指出「怎么办」，而不是只说「不行」。
    expect(message).toMatch(/WebGPU|片元着色器/);
    // 失败的管线没有被登记（不会凭空多出一个资源）。
    expect(device.trackedResourceCount).toBe(afterModule);
    expect(device.trackedResourceCount).toBe(baseline + 1);
    device.dispose();
  });

  it('beginComputePass() 抛带前缀的 ValidationError', () => {
    const device = createDevice();
    const encoder = device.createCommandEncoder({ label: 'compute' });
    expect(() => encoder.beginComputePass({ label: 'kernel' })).toThrow(ValidationError);
    expect(() => encoder.beginComputePass({ label: 'kernel' })).toThrow(
      /\[gpu-device-api\] WebGL2 后端不支持 compute pass/,
    );
    device.dispose();
  });
});
