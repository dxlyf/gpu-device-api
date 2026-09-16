/**
 * `WebGPUTexture.generateMipmaps()` 的单测。
 *
 * WebGPU 没有 `generateMipmap`，所以后端用 render pass 逐级降采样。这里用一台最小 mock
 * 原生 `GPUDevice` 记录「开了几个 pass、每个 pass 的源/目标分别是哪一级」，验证：
 * - 级别数 = `mipLevelCount - 1`，且每级的目标 view 恰好是 `baseMipLevel = level`；
 * - 相邻两级的 view 不同（同一 pass 里一个当采样纹理、一个当附件，必须是不同 subresource）；
 * - 管线按格式缓存（同格式第二张纹理不再建管线）；
 * - 做不到的组合（没有 RenderAttachment / 不可过滤 / 级别为 1）在提交之前就报错。
 *
 * `#27` 之后数组 / 3D 纹理也走这条路径（逐级逐层），这里的多层用例断言的是「真的开了 pass」，
 * 逐层正确性与缓存键扩维的覆盖在 `webgpu-mipmap-array.test.ts`。
 */

import { describe, expect, it } from 'vitest';

import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { ValidationError } from '../src/core/errors/index.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import type { TextureDescriptor } from '../src/core/resources/Texture.js';

/* ------------------------------------------------------------------------------------------------ */
/* 最小 mock 原生设备                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

interface RecordedPass {
  readonly label: string;
  readonly colorAttachment: Record<string, unknown>;
  readonly pipeline: unknown;
  readonly bindGroup: unknown;
  readonly vertexCount: number;
}

interface MockGpu {
  readonly device: WebGPUDevice;
  readonly passes: RecordedPass[];
  readonly submits: number;
  readonly pipelines: string[];
  readonly bindGroups: number;
  readonly views: { label?: string; baseMipLevel: number; mipLevelCount: number }[];
}

function createMockGpu(): MockGpu {
  const passes: RecordedPass[] = [];
  const pipelines: string[] = [];
  const views: MockGpu['views'] = [];
  const state = { submits: 0, bindGroups: 0, writes: 0 };

  const native = {
    label: 'mock-device',
    queue: {
      submit: (): void => {
        state.submits += 1;
      },
      writeBuffer: (): void => {
        state.writes += 1;
      },
    },
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createTexture: (descriptor: { label?: string }) => ({
      label: descriptor.label ?? 'native-texture',
      destroy: () => {},
      createView: (viewDescriptor: { label?: string; baseMipLevel?: number; mipLevelCount?: number } = {}) => {
        const view = {
          label: viewDescriptor.label,
          baseMipLevel: viewDescriptor.baseMipLevel ?? 0,
          mipLevelCount: viewDescriptor.mipLevelCount ?? 1,
        };
        views.push(view);
        return view;
      },
    }),
    createShaderModule: () => ({}),
    createBindGroupLayout: () => ({}),
    createPipelineLayout: () => ({}),
    // `#27` 之后数组 / 3D 的降采样会为「层级 uniform」建一块小 buffer；2d 路径不会用到。
    createBuffer: (descriptor: { label?: string; size: number; usage: number }) => ({
      label: descriptor.label,
      size: descriptor.size,
      usage: descriptor.usage,
    }),
    createRenderPipeline: (descriptor: { label?: string }) => {
      pipelines.push(descriptor.label ?? 'pipeline');
      return { label: descriptor.label };
    },
    createSampler: () => ({}),
    createBindGroup: () => {
      state.bindGroups += 1;
      return { label: `bindGroup#${state.bindGroups}` };
    },
    createCommandEncoder: () => ({
      beginRenderPass: (descriptor: {
        label?: string;
        colorAttachments: Record<string, unknown>[];
      }) => ({
        setPipeline: (pipeline: unknown) => {
          passes.push({
            label: descriptor.label ?? 'pass',
            colorAttachment: descriptor.colorAttachments[0]!,
            pipeline,
            bindGroup: null,
            vertexCount: 0,
          });
        },
        setBindGroup: (_index: number, bindGroup: unknown) => {
          const current = passes[passes.length - 1]!;
          passes[passes.length - 1] = { ...current, bindGroup };
        },
        draw: (vertexCount: number) => {
          const current = passes[passes.length - 1]!;
          passes[passes.length - 1] = { ...current, vertexCount };
        },
        end: () => {},
      }),
      finish: () => ({}),
    }),
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
    passes,
    views,
    pipelines,
    get submits(): number {
      return state.submits;
    },
    get bindGroups(): number {
      return state.bindGroups;
    },
  };
}

function createTexture(mock: MockGpu, descriptor: Partial<TextureDescriptor> = {}) {
  return mock.device.createTexture({
    label: 'mips',
    size: { width: 16, height: 16 },
    format: 'rgba8unorm',
    mipLevelCount: 5,
    usage: TextureUsage.TextureBinding | TextureUsage.CopyDst | TextureUsage.RenderAttachment,
    ...descriptor,
  });
}

/* ------------------------------------------------------------------------------------------------ */

describe('WebGPUTexture.generateMipmaps()', () => {
  it('为第 1..mipLevelCount-1 级各开一个 pass，目标正好是本级、源是上一级', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock);

    texture.generateMipmaps();

    expect(mock.passes).toHaveLength(4);
    mock.passes.forEach((pass, index) => {
      const level = index + 1;
      const target = pass.colorAttachment['view'] as { baseMipLevel: number; mipLevelCount: number };
      expect(target.baseMipLevel).toBe(level);
      expect(target.mipLevelCount).toBe(1);
      expect(pass.colorAttachment['loadOp']).toBe('clear');
      expect(pass.colorAttachment['storeOp']).toBe('store');
      expect(pass.vertexCount).toBe(3); // 全屏三角形
      expect(pass.bindGroup).not.toBeNull();
    });

    // 每一级都有一个源 view（baseMipLevel = level - 1）与一个目标 view（baseMipLevel = level）。
    const sourceLevels = mock.views.filter((view) => view.mipLevelCount === 1).map((view) => view.baseMipLevel);
    expect(sourceLevels).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
    // 源与目标必须是不同的 view 对象（不同 subresource）。
    expect(new Set(mock.views).size).toBe(mock.views.length);
    expect(mock.submits).toBe(1);
    texture.destroy();
  });

  it('管线按格式缓存：同一格式的第二张纹理不再建管线/着色器模块', () => {
    const mock = createMockGpu();
    const first = createTexture(mock, { label: 'first' });
    const second = createTexture(mock, { label: 'second' });

    first.generateMipmaps();
    second.generateMipmaps();

    expect(mock.pipelines).toHaveLength(1);
    expect(mock.pipelines[0]).toBe('mipmap-downsample:rgba8unorm');
    expect(mock.passes).toHaveLength(8);
    expect(mock.submits).toBe(2);
    first.destroy();
    second.destroy();
  });

  it('不同格式各建一条管线（srgb 与非 srgb 的 render target 格式不同）', () => {
    const mock = createMockGpu();
    const unorm = createTexture(mock, { label: 'unorm' });
    const srgb = createTexture(mock, { label: 'srgb', format: 'rgba8unorm-srgb' });

    unorm.generateMipmaps();
    srgb.generateMipmaps();

    expect(mock.pipelines).toEqual(['mipmap-downsample:rgba8unorm', 'mipmap-downsample:rgba8unorm-srgb']);
    unorm.destroy();
    srgb.destroy();
  });

  it('没有 RenderAttachment usage 时明确报错（WebGPU 的 mip 生成必须能当颜色附件）', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock, {
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    expect(() => texture.generateMipmaps()).toThrowError(ValidationError);
    expect(() => texture.generateMipmaps()).toThrowError(/^\[gpu-device-api\] Texture "mips"\.generateMipmaps/);
    expect(() => texture.generateMipmaps()).toThrowError(/without the "RenderAttachment" usage/);
    expect(mock.passes).toHaveLength(0);
  });

  it('mipLevelCount 为 1 时报错', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock, { mipLevelCount: 1 });
    expect(() => texture.generateMipmaps()).toThrowError(/mipLevelCount is 1/);
  });

  it('r32float 可渲染但不可过滤，报错并指出改用 unorm 格式', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock, { format: 'r32float', mipLevelCount: 2, size: { width: 4, height: 4 } });
    expect(() => texture.generateMipmaps()).toThrowError(/is not filterable/);
    expect(mock.passes).toHaveLength(0);
  });

  it('数组纹理（多层 2d）现在逐层生成 mip 链（#27 之前这里直接报错）', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock, {
      size: { width: 4, height: 4, depthOrArrayLayers: 2 },
      mipLevelCount: 2,
    });
    texture.generateMipmaps();
    // 1 级 × 2 层 = 2 个 pass，各自的目标层不同（逐层覆盖见 webgpu-mipmap-array.test.ts）。
    expect(mock.passes).toHaveLength(2);
    expect((mock.passes[0]!.colorAttachment['view'] as { baseMipLevel: number }).baseMipLevel).toBe(1);
    expect((mock.passes[1]!.colorAttachment['view'] as { baseMipLevel: number }).baseMipLevel).toBe(1);
    texture.destroy();
  });

  it('销毁后再生成 mip 会报错', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock);
    texture.destroy();
    expect(() => texture.generateMipmaps()).toThrowError(/has been destroyed/);
  });

  it('2x2 只有一级可降采样，只开一个 pass', () => {
    const mock = createMockGpu();
    const texture = createTexture(mock, { size: { width: 2, height: 2 }, mipLevelCount: 2 });
    texture.generateMipmaps();
    expect(mock.passes).toHaveLength(1);
    expect((mock.passes[0]!.colorAttachment['view'] as { baseMipLevel: number }).baseMipLevel).toBe(1);
    texture.destroy();
  });
});
