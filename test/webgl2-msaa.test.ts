/**
 * WebGL2 离屏目标的多重采样（MSAA）单测。
 *
 * 要证明的是**机制**而不是「有没有调用某函数」：
 * 1. `sampleCount > 1` 时颜色/深度附件都换成 `renderbufferStorageMultisample` 分配的 renderbuffer，
 *    绘制 FBO 与 resolve FBO 是两个不同的对象；
 * 2. `resolve()` 用 `blitFramebuffer`（读=绘制 FBO，写=resolve FBO，`NEAREST`）把结果解析到纹理里，
 *    且**只解析一次**（第二次是空操作）；
 * 3. `sampleCount === 1` 时不产生任何 renderbuffer / blit 调用（像素基线依赖这一点）；
 * 4. 采样数不被支持时抛带 `[gpu-device-api] ` 前缀的**英文**错误，并且**不静默降级**成 1。
 *
 * 真实渲染结果（抗锯齿是否真的生效）由 `examples/msaa-offscreen.html` 的合成截图 +
 * `scripts/analyze-screenshot.mjs` 量化，不在这里假装能用假 GL 证明。
 */

import { describe, expect, it } from 'vitest';

import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { webgl2RenderTargetOfView } from '../src/webgl2/render/WebGL2RenderTarget.js';
import type { WebGL2RenderTarget } from '../src/webgl2/render/WebGL2RenderTarget.js';
import type { RenderTarget } from '../src/core/render/RenderTarget.js';
import type { FakeWebGL2 } from './webgl2-fake-gl.js';
import { GL, createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';

/**
 * core 的 `RenderTarget` 接口不认识 WebGL2 后端的额外成员（`bind` / `resolve` / `drawTarget`），
 * 而本文件测的正是这些成员，所以这里显式向下转型一次。
 */
function asWebGL2Target(value: RenderTarget): WebGL2RenderTarget {
  return value as unknown as WebGL2RenderTarget;
}

function createDevice(fake: FakeWebGL2): WebGL2Device {
  return new WebGL2Device({
    gl: fake.gl,
    canvas: createFakeCanvas().canvas,
    descriptor: { label: 'msaa-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
}

/** 从调用记录里挑出某个前缀的调用。 */
function callsWith(fake: FakeWebGL2, prefix: string): string[] {
  return fake.calls.filter((call) => call.startsWith(prefix));
}

describe('WebGL2RenderTarget：sampleCount > 1 的 renderbuffer + blit 机制', () => {
  it('颜色与深度附件都用 renderbufferStorageMultisample 分配，绘制 FBO 与 resolve FBO 不同', () => {
    const fake = createFakeWebGL2({ maxSamples: 8, supportedSamples: [1, 2, 4, 8] });
    const device = createDevice(fake);
    fake.calls.length = 0;

    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'msaa',
        width: 32,
        height: 16,
        color: 'rgba8unorm',
        depth: 'depth24plus',
        sampleCount: 4,
      }),
    );

    expect(target.sampleCount).toBe(4);
    expect(target.multisampled).toBe(true);
    expect(target.drawTarget).not.toBe(target.native);

    const allocations = callsWith(fake, 'renderbufferStorageMultisample');
    // 颜色 RGBA8 + 深度 DEPTH_COMPONENT24，各一次，采样数都是请求的 4（不是 1）。
    expect(allocations).toHaveLength(2);
    expect(allocations[0]).toContain(`:4:${GL.RGBA8}:32x16`);
    expect(allocations[1]).toContain(`:4:${GL.DEPTH_COMPONENT24}:32x16`);
    // 两个 framebuffer：resolve（纹理附件）+ draw（renderbuffer 附件）。
    expect(callsWith(fake, 'createFramebuffer')).toHaveLength(2);
    device.dispose();
  });

  it('resolve() 用 blitFramebuffer 从绘制 FBO 解析到 resolve FBO，且只解析一次', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'msaa',
        width: 8,
        height: 4,
        color: 'rgba8unorm',
        depth: 'depth24plus',
        sampleCount: 4,
      }),
    );
    fake.calls.length = 0;

    target.bind({ clearColor: [0, 0, 0, 1] });
    expect(fake.calls.some((call) => call.startsWith('blitFramebuffer'))).toBe(false);

    target.resolve();
    const blits = callsWith(fake, 'blitFramebuffer');
    expect(blits).toHaveLength(1);
    // 读端是绘制 FBO、写端是 resolve FBO —— 这是「多重采样 renderbuffer → 单采样纹理」的唯一路径。
    expect(blits[0]).toContain('read=fbo2:draw=fbo1');
    expect(fake.lastBlit).toEqual([
      0, 0, 8, 4,
      0, 0, 8, 4,
      GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT,
      GL.NEAREST,
    ]);

    // 幂等：一次 bind 只会解析一次（没有新的绘制就不需要再 blit）。
    target.resolve();
    expect(callsWith(fake, 'blitFramebuffer')).toHaveLength(1);

    // 下一次 bind 之后又需要解析。
    target.bind({ loadOp: 'load' });
    target.resolve();
    expect(callsWith(fake, 'blitFramebuffer')).toHaveLength(2);
    device.dispose();
  });

  it('sampleCount = 1 时没有任何 renderbuffer / blit 调用（单采样路径逐字节不变）', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    fake.calls.length = 0;

    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'single',
        width: 8,
        height: 8,
        color: 'rgba8unorm',
        depth: 'depth24plus',
      }),
    );

    expect(target.sampleCount).toBe(1);
    expect(target.multisampled).toBe(false);
    expect(target.drawTarget).toBe(target.native);
    expect(callsWith(fake, 'createRenderbuffer')).toHaveLength(0);
    expect(callsWith(fake, 'renderbufferStorageMultisample')).toHaveLength(0);

    target.bind({});
    target.resolve();
    expect(callsWith(fake, 'blitFramebuffer')).toHaveLength(0);
    device.dispose();
  });

  it('resize() 会重建 renderbuffer（尺寸不可变，只能重建）', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'msaa',
        width: 8,
        height: 8,
        color: 'rgba8unorm',
        sampleCount: 2,
      }),
    );
    expect(callsWith(fake, 'renderbufferStorageMultisample')).toHaveLength(1);

    expect(target.resize(16, 16)).toBe(true);
    const allocations = callsWith(fake, 'renderbufferStorageMultisample');
    expect(allocations).toHaveLength(2);
    expect(allocations[1]).toContain(`:2:${GL.RGBA8}:16x16`);
    // 旧的 renderbuffer 被释放，不会泄漏。
    expect(callsWith(fake, 'deleteRenderbuffer')).toHaveLength(1);
    device.dispose();
  });

  it('destroy() 释放 renderbuffer 与两个 framebuffer，并把资源从设备追踪里摘掉', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const baseline = device.trackedResourceCount;
    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'msaa',
        width: 8,
        height: 8,
        color: 'rgba8unorm',
        depth: 'depth24plus',
        sampleCount: 4,
      }),
    );
    // 目标本身 + 颜色纹理 + 深度纹理。
    expect(device.trackedResourceCount).toBe(baseline + 3);

    const framebuffers = callsWith(fake, 'createFramebuffer').length;
    target.destroy();

    expect(callsWith(fake, 'deleteRenderbuffer')).toHaveLength(2);
    expect(callsWith(fake, 'deleteFramebuffer')).toHaveLength(framebuffers);
    expect(device.trackedResourceCount).toBe(baseline);
    device.dispose();
  });

  it('附件 view 能反查到自己的渲染目标（渲染通道靠它认出多重采样目标）', () => {
    const fake = createFakeWebGL2({ maxSamples: 8 });
    const device = createDevice(fake);
    const target = asWebGL2Target(
      device.createRenderTarget({
        label: 'msaa',
        width: 8,
        height: 8,
        color: 'rgba8unorm',
        depth: 'depth24plus',
        sampleCount: 4,
      }),
    );

    const colorView = target.colorView(0);
    expect(webgl2RenderTargetOfView(colorView)).toBe(target);
    expect(webgl2RenderTargetOfView(target.depthStencilView())).toBe(target);
    expect(webgl2RenderTargetOfView({ label: 'foreign' })).toBeNull();

    target.destroy();
    // 已销毁的目标不再被认领，免得渲染通道拿着失效对象去 blit。
    expect(webgl2RenderTargetOfView(colorView)).toBeNull();
    device.dispose();
  });
});

describe('WebGL2RenderTarget：采样数不支持时明确报错（不静默降级）', () => {
  it('超过 MAX_SAMPLES 时抛英文错误并给出上限', () => {
    const fake = createFakeWebGL2({ maxSamples: 2 });
    const device = createDevice(fake);

    expect(() =>
      device.createRenderTarget({ label: 'bad', width: 8, height: 8, sampleCount: 4 }),
    ).toThrow(
      /\[gpu-device-api\] RenderTarget "bad": sampleCount 4 is not supported .*MAX_SAMPLES = 2/s,
    );

    // 不是「创建成功但实际是 1」：不支持的采样数根本创建不出目标。
    expect(() =>
      device.createRenderTarget({ label: 'ok', width: 8, height: 8, sampleCount: 2 }),
    ).not.toThrow();
    device.dispose();
  });

  it('格式不支持该采样数时，报错里列出可用采样数', () => {
    const fake = createFakeWebGL2({ maxSamples: 8, supportedSamples: [1, 2] });
    const device = createDevice(fake);

    expect(() =>
      device.createRenderTarget({ label: 'fmt', width: 8, height: 8, color: 'rgba8unorm', sampleCount: 4 }),
    ).toThrow(/the colour format "rgba8unorm" does not support sampleCount 4 .*supported: 1, 2/s);
    device.dispose();
  });

  it('framebuffer 不完整（INCOMPLETE_MULTISAMPLE）时给出带采样数提示的错误', () => {
    const fake = createFakeWebGL2({
      maxSamples: 8,
      framebufferStatus: GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE,
      incompleteOnLatestFramebufferOnly: true,
    });
    const device = createDevice(fake);

    expect(() =>
      device.createRenderTarget({ label: 'incomplete', width: 8, height: 8, sampleCount: 4 }),
    ).toThrow(/多重采样的 framebuffer 不完整[\s\S]*sampleCount=4/);
    device.dispose();
  });

  it('sampleCount 非法（0 / 小数）时立刻报错', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    expect(() => device.createRenderTarget({ width: 8, height: 8, sampleCount: 0 })).toThrow(
      /sampleCount must be a positive integer, got 0/,
    );
    expect(() => device.createRenderTarget({ width: 8, height: 8, sampleCount: 2.5 })).toThrow(
      /sampleCount must be a positive integer, got 2\.5/,
    );
    device.dispose();
  });
});
