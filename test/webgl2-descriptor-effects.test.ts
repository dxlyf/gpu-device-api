/**
 * 批 04 · `#13`：一批 descriptor 字段在 WebGL2 上不许**静默无效**。
 *
 * 已确证静默无效的字段与它们的落点：
 *
 * | 字段 | 落点 | 修复前的行为 |
 * | --- | --- | --- |
 * | `RenderTarget.mipLevelCount` | `WebGL2RenderTarget` | 只存进只读属性，附件纹理恒为 1 级 |
 * | view 的 `format` 重解释 | `WebGL2TextureView` | 完全丢弃，采样时按**源纹理**的格式解释 |
 * | `RenderTarget.sampled` | `WebGL2RenderTarget` | 未读取（WebGL2 的纹理总是可采样） |
 * | canvas 的 `alphaMode` / `colorSpace` | `WebGL2CanvasContext.configure` | 完全不读 |
 * | `MultisampleState.alphaToCoverageEnabled` | `WebGL2RenderPipeline` | 完全不读 |
 * | layout 的 `texture.sampleType` | 绑定计划 | `sampleTypeMatchesFormat` 写好了却无人调用 |
 *
 * 每个字段的处置（实现还是明确报错）与理由都写在对应用例的注释里。
 * 这里测的是**可观察后果**：要么 GL 状态真的被下发，要么抛出带 `[gpu-device-api] ` 前缀的错误。
 */

import { describe, expect, it } from 'vitest';

import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { sampleTypeMatchesFormat } from '../src/webgl2/utils/glFormatMap.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { BindingType } from '../src/core/enums/BindingType.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';
import { buildBindingPlan } from '../src/webgl2/binding/TextureUnitAllocator.js';
import type { WebGL2CanvasContext } from '../src/webgl2/WebGL2CanvasContext.js';
import type { WebGL2TextureView } from '../src/webgl2/resources/WebGL2TextureView.js';
import type { FakeWebGL2 } from './webgl2-fake-gl.js';
import { createFakeWebGL2 } from './webgl2-fake-gl.js';

function createDevice(fake: FakeWebGL2): WebGL2Device {
  return new WebGL2Device({
    gl: fake.gl,
    canvas: fake.canvasOfDevice,
    descriptor: { label: 'descriptor-effects-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
}

describe('#13 RenderTarget.mipLevelCount', () => {
  it('mipLevelCount > 1 明确报错：WebGL2 的 FBO 附件只用第 0 级', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);

    // 修复前：`this.mipLevelCount = descriptor.mipLevelCount ?? 1` 只存不用 ——
    // 目标对外宣称有 2 级 mip，附件纹理实际只有 1 级，而 `target.mipLevelCount` 与
    // `target.colors[0].mipLevelCount` 不一致这件事没有任何报错。
    expect(() =>
      device.createRenderTarget({
        label: 'mip-target',
        width: 8,
        height: 8,
        color: 'rgba8unorm',
        mipLevelCount: 2,
      }),
    ).toThrowError(/\[gpu-device-api\] createRenderTarget: mipLevelCount 2 is not supported by the WebGL2 backend/);
    device.dispose();
  });

  it('mipLevelCount = 1（或不填）仍然正常创建', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    const target = device.createRenderTarget({ label: 'ok-target', width: 8, height: 8, mipLevelCount: 1 });
    expect(target.mipLevelCount).toBe(1);
    expect(target.colors[0]!.mipLevelCount).toBe(1);
    device.dispose();
  });
});

describe('#13 texture view 的 format 重解释', () => {
  it('用不同 format 创建 view 时明确报错（而不是静默按源纹理格式采样）', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    const texture = device.createTexture({
      label: 'view-source',
      size: { width: 4, height: 4 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });

    // 修复前：`WebGL2TextureView` 只校验 mip / layer 范围，`descriptor.format` 被整个丢掉，
    // 于是 `rgba8unorm` 的纹理挂一个 `rgba8uint` 的 view 也能「成功」创建 ——
    // 采样时 GLSL 会按 view 声明的 `usampler2D` 去读一段 `RGBA8` 数据，取到的是无意义的整数。
    expect(() => texture.createView({ label: 'bad-view', format: 'rgba8uint' })).toThrowError(
      /\[gpu-device-api\] texture view「bad-view」要求把纹理「view-source」重解释成「rgba8uint」/,
    );
    device.dispose();
  });

  it('格式与纹理一致时正常创建，并且 view 如实暴露 descriptor.format', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    const texture = device.createTexture({
      label: 'view-source',
      size: { width: 4, height: 4 },
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    const view = texture.createView({ format: 'rgba8unorm' }) as WebGL2TextureView;
    expect(view.descriptor.format).toBe('rgba8unorm');
    device.dispose();
  });
});

describe('#13 RenderTarget.sampled', () => {
  it('sampled: false 明确报错（WebGL2 的纹理恒可采样，这个字段无法被尊重）', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);

    expect(() =>
      device.createRenderTarget({ label: 'unsampled', width: 4, height: 4, sampled: false }),
    ).toThrowError(/\[gpu-device-api\] createRenderTarget: sampled: false cannot be honoured on WebGL2/);
    device.dispose();
  });

  it('sampled: true 与不填都仍然正常创建', () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    expect(device.createRenderTarget({ label: 'a', width: 4, height: 4, sampled: true }).label).toBe('a');
    expect(device.createRenderTarget({ label: 'b', width: 4, height: 4 }).label).toBe('b');
    device.dispose();
  });
});

describe('#13 canvas 的 alphaMode / colorSpace', () => {
  it("alphaMode: 'opaque' 明确报错（GL context 的 alpha 属性在创建后就改不了）", () => {
    const fake = createFakeWebGL2({ contextAttributes: { alpha: true, premultipliedAlpha: true } });
    const device = createDevice(fake);
    const context = device.createCanvasContext(fake.canvasOfDevice) as WebGL2CanvasContext;

    expect(() => context.configure({ device, alphaMode: 'opaque' })).toThrowError(
      /\[gpu-device-api\] canvas alphaMode "opaque" cannot be honoured on WebGL2/,
    );
    device.dispose();
  });

  it("alphaMode: 'premultiplied' 与 context 属性一致时通过；与 unpremultiplied context 不一致时报错", () => {
    const okFake = createFakeWebGL2({ contextAttributes: { alpha: true, premultipliedAlpha: true } });
    const okDevice = createDevice(okFake);
    const okContext = okDevice.createCanvasContext(okFake.canvasOfDevice) as WebGL2CanvasContext;
    expect(() => okContext.configure({ device: okDevice, alphaMode: 'premultiplied' })).not.toThrow();
    okDevice.dispose();

    const badFake = createFakeWebGL2({ contextAttributes: { alpha: true, premultipliedAlpha: false } });
    const badDevice = createDevice(badFake);
    const badContext = badDevice.createCanvasContext(badFake.canvasOfDevice) as WebGL2CanvasContext;
    expect(() => badContext.configure({ device: badDevice, alphaMode: 'premultiplied' })).toThrowError(
      /\[gpu-device-api\] canvas alphaMode "premultiplied"/,
    );
    badDevice.dispose();
  });

  it("colorSpace: 'display-p3' 明确报错（WebGL2 的默认帧缓冲只有 sRGB 一种解释）", () => {
    const fake = createFakeWebGL2();
    const device = createDevice(fake);
    const context = device.createCanvasContext(fake.canvasOfDevice) as WebGL2CanvasContext;

    expect(() => context.configure({ device, colorSpace: 'display-p3' })).toThrowError(
      /\[gpu-device-api\] canvas colorSpace "display-p3" is not supported by WebGL2/,
    );
    // sRGB 是唯一能被如实支持的值，必须通过。
    expect(() => context.configure({ device, colorSpace: 'srgb' })).not.toThrow();
    device.dispose();
  });
});

describe('#13 layout 的 texture.sampleType', () => {
  /**
   * 这一项**不需要假 GL**：决定「纹理格式与布局声明的 sampleType 是否匹配」的纯函数
   * 已经存在（`sampleTypeMatchesFormat`），只是从来没人调用。
   *
   * 处置是**实现**：把布局声明的 `sampleType` 带进绑定计划槽位，渲染通道在真正绑定纹理时校验。
   * 理由：GL 完全能表达这件事（整数纹理必须配 `isampler2D` / `usampler2D`），
   * 只是 WebGL2 的 program 是静态编译的、绑定点上看不到 sampler 类型，所以必须靠布局来校验。
   */
  it('sampleTypeMatchesFormat 对每种采样类型的判定与格式的 sampleType 一致', () => {
    // 浮点格式
    expect(sampleTypeMatchesFormat('rgba8unorm', 'float')).toBe(true);
    expect(sampleTypeMatchesFormat('rgba8unorm', 'unfilterable-float')).toBe(true);
    expect(sampleTypeMatchesFormat('rgba8unorm', 'uint')).toBe(false);
    expect(sampleTypeMatchesFormat('rgba8unorm', 'sint')).toBe(false);
    // 无符号整数格式
    expect(sampleTypeMatchesFormat('rgba8uint', 'uint')).toBe(true);
    expect(sampleTypeMatchesFormat('rgba8uint', 'float')).toBe(false);
    expect(sampleTypeMatchesFormat('rgba8uint', 'unfilterable-float')).toBe(false);
    // 有符号整数格式
    expect(sampleTypeMatchesFormat('rgba8sint', 'sint')).toBe(true);
    expect(sampleTypeMatchesFormat('rgba8sint', 'uint')).toBe(false);
    // 深度格式：`depth` 与 `unfilterable-float` 都接受（WebGPU 允许后者做非过滤采样）
    expect(sampleTypeMatchesFormat('depth24plus', 'depth')).toBe(true);
    expect(sampleTypeMatchesFormat('depth24plus', 'unfilterable-float')).toBe(true);
    expect(sampleTypeMatchesFormat('depth24plus', 'float')).toBe(false);
  });

  it('绑定计划把布局声明的 sampleType 带进纹理槽位', () => {
    const plan = buildBindingPlan(
      [
        [
          {
            binding: 0,
            visibility: ShaderStage.Fragment,
            type: BindingType.Texture,
            name: 'tex',
            texture: { sampleType: 'uint' },
          },
          { binding: 1, visibility: ShaderStage.Fragment, type: BindingType.Sampler, name: 'tex_sampler' },
        ],
      ],
      { maxTextureUnits: 16, maxUniformBufferBindings: 12 },
    );
    expect(plan.textures.get('0:0')?.sampleType).toBe('uint');
  });

  it('布局没声明 sampleType 时按 WebGPU 的默认值 float 处理', () => {
    const plan = buildBindingPlan(
      [
        [
          { binding: 0, visibility: ShaderStage.Fragment, type: BindingType.Texture, name: 'tex' },
          { binding: 1, visibility: ShaderStage.Fragment, type: BindingType.Sampler, name: 'tex_sampler' },
        ],
      ],
      { maxTextureUnits: 16, maxUniformBufferBindings: 12 },
    );
    expect(plan.textures.get('0:0')?.sampleType).toBe('float');
  });
});
