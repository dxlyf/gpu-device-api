/**
 * `WebGPUTexture.generateMipmaps()` 的 view / bind group 复用回归测试（优化 #34）。
 *
 * 缺陷回顾：逐级降采样时，每一级都 `createView()` 两次 + `createBindGroup()` 一次。这些对象的
 * 参数只与 (纹理, 级别) 有关，与调用发生在哪一次 `generateMipmaps()` 无关，因此**同一张纹理
 * 反复调用**会一遍遍重建完全相同的东西（原生对象 + 绑定组校验的 CPU 开销）。
 *
 * 这里用一台最小 mock 原生设备**数调用次数**，并对下发给 GPU 的指令流做逐字段比对：
 * 复用之后第 N 次调用用的 view / bind group 与第 1 次是**同一批对象**，绑定的 subresource、
 * 附件格式、load/store、clear 值、draw 顶点数全部相同 —— 也就是说 GPU 收到的是同一份指令，
 * 采样结果必然逐字节一致。这是「结果不变」在 node 侧能给出的最强证据（不需要占 GPU）。
 *
 * 本文件只在 mock 上验证，不依赖浏览器：并发跑无头 Chrome 的其它代理不会影响它。
 */

import { describe, expect, it } from 'vitest';

import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import type { TextureDescriptor } from '../src/core/resources/Texture.js';
import type { WebGPUTexture } from '../src/webgpu/resources/WebGPUTexture.js';

/* ------------------------------------------------------------------------------------------------ */
/* 固定用例规模：16x16 + 5 级 → 每次调用 4 个 pass、8 个 view、4 个 bind group                          */
/* ------------------------------------------------------------------------------------------------ */

const MIP_LEVELS = 5;
const PASSES_PER_CALL = MIP_LEVELS - 1;
const VIEWS_PER_CALL = PASSES_PER_CALL * 2;
const GROUPS_PER_CALL = PASSES_PER_CALL;

/* ------------------------------------------------------------------------------------------------ */
/* 最小 mock 原生设备：记录每一次 createView / createBindGroup，以及每个 pass 的完整状态               */
/* ------------------------------------------------------------------------------------------------ */

/** 一次 `createView()` 的调用：原生描述的原样拷贝 + 便于断言的关键字段。 */
interface MockView {
  readonly label: string | undefined;
  readonly baseMipLevel: number;
  readonly mipLevelCount: number;
  readonly descriptor: Record<string, unknown>;
}

/** 一次 `createBindGroup()` 的调用。 */
interface MockBindGroup {
  readonly label: string | undefined;
  readonly layout: unknown;
  readonly entries: readonly { binding: number; resource: unknown }[];
}

/** 一个 mip pass 下发出去的全部状态（`setPipeline` / `setBindGroup` / `draw` 之后回填）。 */
interface RecordedPass {
  readonly label: string | undefined;
  readonly target: MockView;
  readonly loadOp: unknown;
  readonly storeOp: unknown;
  readonly clearValue: unknown;
  pipeline: unknown;
  bindGroup: MockBindGroup | null;
  vertexCount: number;
}

interface MockMipGpu {
  readonly device: WebGPUDevice;
  readonly views: MockView[];
  readonly bindGroups: MockBindGroup[];
  readonly passes: RecordedPass[];
  readonly counters: {
    createView: number;
    createBindGroup: number;
    createRenderPipeline: number;
    submits: number;
  };
}

function createMockMipGpu(): MockMipGpu {
  const views: MockView[] = [];
  const bindGroups: MockBindGroup[] = [];
  const passes: RecordedPass[] = [];
  const counters = { createView: 0, createBindGroup: 0, createRenderPipeline: 0, submits: 0 };

  const native = {
    label: 'mock-device',
    queue: {
      submit: (): void => {
        counters.submits += 1;
      },
    },
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createTexture: (descriptor: { label?: string }) => ({
      label: descriptor.label ?? 'native-texture',
      destroy: () => {},
      createView: (viewDescriptor: Record<string, unknown> = {}): MockView => {
        counters.createView += 1;
        const view: MockView = {
          label: viewDescriptor['label'] as string | undefined,
          baseMipLevel: (viewDescriptor['baseMipLevel'] as number | undefined) ?? 0,
          mipLevelCount: (viewDescriptor['mipLevelCount'] as number | undefined) ?? 1,
          descriptor: { ...viewDescriptor },
        };
        views.push(view);
        return view;
      },
    }),
    createShaderModule: () => ({}),
    createBindGroupLayout: () => ({}),
    createPipelineLayout: () => ({}),
    createRenderPipeline: () => {
      counters.createRenderPipeline += 1;
      return { label: 'mipmap-downsample' };
    },
    createSampler: () => ({}),
    createBindGroup: (descriptor: {
      label?: string;
      layout?: unknown;
      entries?: readonly { binding: number; resource: unknown }[];
    }): MockBindGroup => {
      counters.createBindGroup += 1;
      const group: MockBindGroup = {
        label: descriptor.label,
        layout: descriptor.layout,
        entries: descriptor.entries ?? [],
      };
      bindGroups.push(group);
      return group;
    },
    createCommandEncoder: () => ({
      beginRenderPass: (descriptor: {
        label?: string;
        colorAttachments: readonly {
          view: MockView;
          loadOp: unknown;
          storeOp: unknown;
          clearValue: unknown;
        }[];
      }) => {
        const attachment = descriptor.colorAttachments[0]!;
        const pass: RecordedPass = {
          label: descriptor.label,
          target: attachment.view,
          loadOp: attachment.loadOp,
          storeOp: attachment.storeOp,
          clearValue: attachment.clearValue,
          pipeline: null,
          bindGroup: null,
          vertexCount: 0,
        };
        passes.push(pass);
        return {
          setPipeline: (pipeline: unknown): void => {
            pass.pipeline = pipeline;
          },
          setBindGroup: (_index: number, bindGroup: MockBindGroup): void => {
            pass.bindGroup = bindGroup;
          },
          draw: (vertexCount: number): void => {
            pass.vertexCount = vertexCount;
          },
          end: (): void => {},
        };
      },
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

  return { device, views, bindGroups, passes, counters };
}

function createTexture(mock: MockMipGpu, descriptor: Partial<TextureDescriptor> = {}): WebGPUTexture {
  return mock.device.createTexture({
    label: 'mips',
    size: { width: 16, height: 16 },
    format: 'rgba8unorm',
    mipLevelCount: MIP_LEVELS,
    usage: TextureUsage.TextureBinding | TextureUsage.CopyDst | TextureUsage.RenderAttachment,
    ...descriptor,
  });
}

/**
 * 白盒取用私有的 mip 缓存（`private` 只在编译期存在）。
 *
 * 「`destroy()` 会清掉缓存」这件事没有别的外部可观测点：原生 `GPUTextureView` 没有 `destroy()`，
 * 清理就是丢引用，只能直接看缓存容器本身。
 */
function mipCacheSeam(texture: WebGPUTexture): { mipPassCache: Map<number, unknown> } {
  return texture as unknown as { mipPassCache: Map<number, unknown> };
}

/* ------------------------------------------------------------------------------------------------ */

describe('WebGPUTexture.generateMipmaps()：view / bind group 复用（#34）', () => {
  it('同一张纹理连续 5 次调用：第 1 次建 8 个 view + 4 个 bind group，第 2 次起 0 次新建', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock);

    texture.generateMipmaps();
    // 修复前的第 1 次也是这个数（缓存只影响重复调用，首次照旧建全）。
    expect(mock.counters.createView).toBe(VIEWS_PER_CALL);
    expect(mock.counters.createBindGroup).toBe(GROUPS_PER_CALL);

    for (let call = 0; call < 4; call += 1) texture.generateMipmaps();

    // 修复前：createView = 40、createBindGroup = 20（5 次 × 每次全建）。
    expect(mock.counters.createView).toBe(VIEWS_PER_CALL);
    expect(mock.counters.createBindGroup).toBe(GROUPS_PER_CALL);
    // 每次调用仍然照常开 4 个 pass、提交 1 个 command buffer。
    expect(mock.passes).toHaveLength(5 * PASSES_PER_CALL);
    expect(mock.counters.submits).toBe(5);
    // mip 的 view 是原生 view，不进 core 的 view 缓存（`createView()` 仍然只建 core 包装）。
    expect(texture.views).toHaveLength(0);
    // 缓存条目数 == mipLevelCount - 1，不会随调用次数增长。
    expect(mipCacheSeam(texture).mipPassCache.size).toBe(PASSES_PER_CALL);

    texture.destroy();
  });

  it('createView 的参数与改动前逐字段一致（源 / 目标各一个，不多不少）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock);

    texture.generateMipmaps();

    const expected: Record<string, unknown>[] = [];
    for (let level = 1; level < MIP_LEVELS; level += 1) {
      expected.push({
        label: `mips:mip${level - 1}`,
        dimension: '2d',
        baseMipLevel: level - 1,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1,
      });
      expected.push({
        label: `mips:mip${level}`,
        dimension: '2d',
        baseMipLevel: level,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1,
      });
    }
    expect(mock.views.map((view) => view.descriptor)).toEqual(expected);
    // 「不多」：字段集合必须恰好是这 6 个（多传一个字段就可能改变 view 的语义）。
    expect(Object.keys(mock.views[0]!.descriptor).sort()).toEqual([
      'arrayLayerCount',
      'baseArrayLayer',
      'baseMipLevel',
      'dimension',
      'label',
      'mipLevelCount',
    ]);

    texture.destroy();
  });

  it('bind group 绑定的是本级源 view，且每个 pass 只有 0 号 binding 的纹理 + 1 号采样器', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock);

    texture.generateMipmaps();

    expect(mock.bindGroups).toHaveLength(GROUPS_PER_CALL);
    for (let index = 0; index < GROUPS_PER_CALL; index += 1) {
      const group = mock.bindGroups[index]!;
      expect(group.label).toBe(`mips:mip${index + 1}`);
      expect(group.entries.map((entry) => entry.binding)).toEqual([0, 1]);
      // 源 view 是「覆盖 mip index 的那一个」，也就是本 pass 的上一级。
      expect(group.entries[0]!.resource).toBe(mock.views[index * 2]);
      // 目标 view 绝不能出现在采样绑定里（同一 pass 里既是附件又是采样源 → 校验失败）。
      expect(group.entries[0]!.resource).not.toBe(mock.passes[index]!.target);
    }

    texture.destroy();
  });

  it('重复调用下发的指令流与第 1 次逐字段相同（同一批 view / bind group 对象）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock);

    texture.generateMipmaps();
    texture.generateMipmaps();
    texture.generateMipmaps();

    const first = mock.passes.slice(0, PASSES_PER_CALL);
    const third = mock.passes.slice(2 * PASSES_PER_CALL, 3 * PASSES_PER_CALL);
    expect(third).toHaveLength(PASSES_PER_CALL);

    third.forEach((pass, index) => {
      const reference = first[index]!;
      // 对象身份相同 ⇒ GPU 收到的 subresource / 绑定完全相同 ⇒ 采样结果逐字节一致。
      expect(pass.target).toBe(reference.target);
      expect(pass.bindGroup).toBe(reference.bindGroup);
      expect(pass.pipeline).toBe(reference.pipeline);
      // 其余随 pass 下发的状态也逐字段一致。
      expect(pass.label).toBe(reference.label);
      expect(pass.loadOp).toBe('clear');
      expect(pass.storeOp).toBe('store');
      expect(pass.clearValue).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      expect(pass.vertexCount).toBe(3);
      expect(pass.target.baseMipLevel).toBe(index + 1);
      expect(pass.target.mipLevelCount).toBe(1);
    });

    texture.destroy();
  });

  it('缓存挂在纹理实例上：两张同格式同尺寸的纹理互不共享 view / bind group', () => {
    const mock = createMockMipGpu();
    const first = createTexture(mock, { label: 'first' });
    const second = createTexture(mock, { label: 'second' });

    first.generateMipmaps();
    expect(mock.counters.createView).toBe(VIEWS_PER_CALL);
    second.generateMipmaps();
    // 第二张纹理必须自己建（不能命中第一张的缓存 —— 那会把 view 建在别的 texture 上）。
    expect(mock.counters.createView).toBe(VIEWS_PER_CALL * 2);
    expect(mock.counters.createBindGroup).toBe(GROUPS_PER_CALL * 2);

    const firstViews = mock.views.slice(0, VIEWS_PER_CALL);
    const secondViews = mock.views.slice(VIEWS_PER_CALL);
    for (const view of secondViews) expect(firstViews).not.toContain(view);
    expect(secondViews[0]!.label).toBe('second:mip0');

    // 各自再调一次：都不再新建。
    first.generateMipmaps();
    second.generateMipmaps();
    expect(mock.counters.createView).toBe(VIEWS_PER_CALL * 2);
    expect(mock.counters.createBindGroup).toBe(GROUPS_PER_CALL * 2);
    expect(mipCacheSeam(first).mipPassCache.size).toBe(PASSES_PER_CALL);
    expect(mipCacheSeam(second).mipPassCache.size).toBe(PASSES_PER_CALL);

    first.destroy();
    second.destroy();
  });

  it('destroy() 清空 mip 缓存（不留下指向已销毁 texture 的 view / bind group）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock);

    texture.generateMipmaps();
    expect(mipCacheSeam(texture).mipPassCache.size).toBe(PASSES_PER_CALL);

    texture.destroy();

    expect(mipCacheSeam(texture).mipPassCache.size).toBe(0);
  });

  it('缓存条目数恰好等于 mipLevelCount - 1（7 级 → 6 条，不随调用次数增长）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, { size: { width: 64, height: 64 }, mipLevelCount: 7 });

    for (let call = 0; call < 3; call += 1) texture.generateMipmaps();

    expect(mipCacheSeam(texture).mipPassCache.size).toBe(6);
    expect(mock.counters.createView).toBe(12);
    expect(mock.counters.createBindGroup).toBe(6);
    expect(mock.passes).toHaveLength(18);

    texture.destroy();
  });

  it('不同格式的纹理各自建 view / bind group（bind group 与各自的管线布局匹配）', () => {
    const mock = createMockMipGpu();
    const unorm = createTexture(mock, { label: 'unorm' });
    const srgb = createTexture(mock, { label: 'srgb', format: 'rgba8unorm-srgb' });

    unorm.generateMipmaps();
    srgb.generateMipmaps();
    unorm.generateMipmaps();
    srgb.generateMipmaps();

    expect(mock.counters.createView).toBe(VIEWS_PER_CALL * 2);
    expect(mock.counters.createBindGroup).toBe(GROUPS_PER_CALL * 2);
    expect(mock.counters.createRenderPipeline).toBe(2);
    // 两种格式各有一条管线，bind group 必须挂在各自格式的布局上（不能串味）。
    expect(mock.bindGroups[0]!.layout).toBeDefined();
    expect(mock.bindGroups[0]!.layout).not.toBe(mock.bindGroups[GROUPS_PER_CALL]!.layout);
    // 同一张纹理内部各级的 bind group 布局一致。
    expect(mock.bindGroups[0]!.layout).toBe(mock.bindGroups[1]!.layout);

    unorm.destroy();
    srgb.destroy();
  });
});
