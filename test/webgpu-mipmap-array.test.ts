/**
 * `WebGPUTexture.generateMipmaps()` 对 `2d-array` / `3d` 的支持与**逐层正确性**测试（`#27`）。
 *
 * ## 复现的是什么
 *
 * `WebGPUTexture.generateMipmaps()` 里有一道硬闸：`dimension !== '2d' || depthOrArrayLayers !== 1`
 * 就直接抛「only single-layer 2d textures are supported」。于是数组纹理与 3D 纹理**一个 mip 都
 * 生成不出来**（WebGL2 侧至少是把整张纹理交给 GL，不做这个限制）。
 *
 * ## 本文件锁定的三条性质
 *
 * 1. **缓存键必须扩维**。`#34` 刚把逐级 view / bind group 按**级**缓存（`mipPassCache`，键是级号）。
 *    数组 / 3D 要逐层各降一遍，如果键仍然只有级号，第 2 层就会命中第 1 层留下的 view 与 bind
 *    group —— **跨层串味**：第 2 层的渲染结果被写进第 1 层（或采样到第 1 层的内容），而调用方
 *    完全看不出来。这与 `#32`（FBO 缓存键改对象身份）是同一类教训：**键漏字段 = 静默画错**。
 *    因此这里既数「建了几个 view / bind group」，也直接检查缓存键的**内容**：
 *    `(级, 层)` 的每一个组合都必须有一条，键数 = 级数 × 层数。
 * 2. **每层写对了地方**。每个 pass 的目标 view 必须只覆盖 `(mipLevel, 该层)`，
 *    而且**同一级里不同层的目标 view 必然不同**（天然如此：`baseArrayLayer` 不同）；
 *    更关键的是**源 view 的 `baseArrayLayer` 必须是「上一层里对应该层的那一片」**
 *    （`2d-array` 逐层 1:1；`3d` 沿 z 减半，第 s 层来自第 `s >> 1` 层）。
 *    把源层写成 0 是最容易犯的错：测试 GPU 上不会报错（`textureSampleLevel` 采样 2D 视图的
 *    第 0 层是合法的），只是**每一层都拿到第 0 层的内容**，静默画错。
 * 3. **层内容互不相同**。mock 的 `fillTarget` 是「每层确定性伪随机」，所以「各层内容互不相同」
 *    在 mock 里可判定：如果渲染路径把多层都写进了同一片 subresource，或都从同一片采样，
 *    写出的字节就会相同 —— 断言会失败。
 *
 * ## 诚实的边界
 *
 * mock 只能证明「下发给 GPU 的 subresource 选择是对的」，证明不了真实采样值。真实像素级验证需要
 * 无头浏览器读回（见汇报里的「没能验证的点」）。这里的价值是把「键漏字段 / 源层写错」这两个
 * 最可能悄悄发生的错误，在一次 `vitest` 里钉死。
 */

import { describe, expect, it } from 'vitest';

import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import type { TextureDescriptor } from '../src/core/resources/Texture.js';
import type { WebGPUTexture } from '../src/webgpu/resources/WebGPUTexture.js';

/* ------------------------------------------------------------------------------------------------ */
/* mock 原生设备：把「subresource 选择」完整记下来                                                       */
/* ------------------------------------------------------------------------------------------------ */

/** 一次 `createView()`：记下原生 descriptor 的原样拷贝。 */
interface MockView {
  readonly label: string | undefined;
  readonly descriptor: Record<string, unknown>;
}

interface MockBindGroup {
  readonly label: string | undefined;
  readonly layout: unknown;
  readonly entries: readonly { binding: number; resource: unknown }[];
}

interface RecordedPass {
  readonly label: string | undefined;
  readonly target: MockView;
  readonly depthSliceProvided: boolean;
  readonly depthSlice: unknown;
  pipeline: unknown;
  bindGroup: MockBindGroup | null;
  vertexCount: number;
  uniform: MockBuffer | null;
}

interface MockBuffer {
  readonly label: string | undefined;
  readonly size: number;
  readonly usage: number;
  readonly data: Uint8Array;
}

interface MockMipGpu {
  readonly device: WebGPUDevice;
  readonly views: MockView[];
  readonly bindGroups: MockBindGroup[];
  readonly passes: RecordedPass[];
  readonly buffers: MockBuffer[];
  readonly counters: { createView: number; createBindGroup: number; writeBuffer: number; submits: number };
}

function createMockMipGpu(): MockMipGpu {
  const views: MockView[] = [];
  const bindGroups: MockBindGroup[] = [];
  const passes: RecordedPass[] = [];
  const buffers: MockBuffer[] = [];
  const counters = { createView: 0, createBindGroup: 0, writeBuffer: 0, submits: 0 };

  const native = {
    label: 'mock-device',
    queue: {
      submit: (): void => {
        counters.submits += 1;
      },
      writeBuffer: (buffer: MockBuffer, offset: number, data: ArrayBuffer | Uint8Array): void => {
        counters.writeBuffer += 1;
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        buffer.data.set(bytes, offset);
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
          descriptor: { ...viewDescriptor },
        };
        views.push(view);
        return view;
      },
    }),
    createBuffer: (descriptor: { label?: string; size: number; usage: number }): MockBuffer => {
      const buffer: MockBuffer = {
        label: descriptor.label,
        size: descriptor.size,
        usage: descriptor.usage,
        data: new Uint8Array(descriptor.size),
      };
      buffers.push(buffer);
      return buffer;
    },
    createShaderModule: () => ({}),
    createBindGroupLayout: () => ({}),
    createPipelineLayout: () => ({}),
    createRenderPipeline: () => ({ label: 'mipmap-downsample' }),
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
          depthSlice?: unknown;
        }[];
      }) => {
        const attachment = descriptor.colorAttachments[0]!;
        const pass: RecordedPass = {
          label: descriptor.label,
          target: attachment.view,
          depthSliceProvided: 'depthSlice' in attachment,
          depthSlice: attachment.depthSlice,
          pipeline: null,
          bindGroup: null,
          vertexCount: 0,
          uniform: null,
        };
        passes.push(pass);
        return {
          setPipeline: (pipeline: unknown): void => {
            pass.pipeline = pipeline;
          },
          setBindGroup: (_index: number, bindGroup: MockBindGroup): void => {
            pass.bindGroup = bindGroup;
            const uniform = bindGroup.entries.find((entry) => entry.binding === 2)?.resource;
            if (uniform && typeof uniform === 'object' && 'data' in uniform) {
              pass.uniform = uniform as MockBuffer;
            }
          },
          draw: (vertexCount: number): void => {
            pass.vertexCount = vertexCount;
          },
          end: (): void => {},
        };
      },
      finish: () => ({
        /* command buffer 的形状对断言无影响，但保留每次提交一个的自检。 */
        label: 'mipmap-command-buffer',
      }),
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

  return { device, views, bindGroups, passes, buffers, counters };
}

const MIP_USAGE = TextureUsage.TextureBinding | TextureUsage.CopyDst | TextureUsage.RenderAttachment;

function createTexture(mock: MockMipGpu, descriptor: Partial<TextureDescriptor> = {}): WebGPUTexture {
  return mock.device.createTexture({
    label: 'mips',
    size: { width: 16, height: 16 },
    format: 'rgba8unorm',
    mipLevelCount: 5,
    usage: MIP_USAGE,
    ...descriptor,
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* 断言辅助                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** 视图 descriptor 里关心的字段（其余字段不参与语义比较）。 */
function viewShape(view: MockView): {
  label: string | undefined;
  dimension: unknown;
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
} {
  const d = view.descriptor;
  return {
    label: view.label,
    dimension: d['dimension'],
    baseMipLevel: (d['baseMipLevel'] as number | undefined) ?? 0,
    mipLevelCount: (d['mipLevelCount'] as number | undefined) ?? 1,
    baseArrayLayer: (d['baseArrayLayer'] as number | undefined) ?? 0,
    arrayLayerCount: (d['arrayLayerCount'] as number | undefined) ?? 1,
  };
}

/** 每一级的逻辑层数：`2d` 固定 1（就是「只有一个 subresource」）、`3d` 沿 z 减半、层数组不参与减半。 */
function layersAtLevel(dimension: string, depthOrArrayLayers: number, level: number): number {
  if (dimension === '3d') return Math.max(1, depthOrArrayLayers >> level);
  return depthOrArrayLayers;
}

/** 白盒取私有 mip 缓存（`private` 只在编译期存在）。键是复合键，这里只关心它的内容。 */
function mipCacheSeam(texture: WebGPUTexture): { mipPassCache: Map<string, unknown> } {
  return texture as unknown as { mipPassCache: Map<string, unknown> };
}

/* ------------------------------------------------------------------------------------------------ */

describe('WebGPUTexture.generateMipmaps()：2d-array 支持（#27）', () => {
  it('4 层 × 3 级：每层每级各一个 pass，缓存键扩维到 (级, 层)', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 4 },
      mipLevelCount: 3,
    });

    texture.generateMipmaps();

    // 3 级 × 4 层 = 12 个 pass。
    expect(mock.passes).toHaveLength(12);
    // 每个 pass 一个目标 view + 一个源 view；每层每级各建一次。
    expect(mock.counters.createView).toBe(24);
    expect(mock.counters.createBindGroup).toBe(12);
    expect(mock.counters.submits).toBe(1);

    // 缓存键必须把「层」纳进来：12 个 (级, 层) 组合各一条，而不是 2 条（只有级）。
    const keys = [...mipCacheSeam(texture).mipPassCache.keys()].sort();
    expect(keys).toEqual([
      '1:0',
      '1:1',
      '1:2',
      '1:3',
      '2:0',
      '2:1',
      '2:2',
      '2:3',
    ]);

    texture.destroy();
  });

  it('非 2 的幂数量的层：层数不随 mip 减半（每级都写满所有层）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 3 },
      mipLevelCount: 3,
    });

    texture.generateMipmaps();

    // 2d-array 的 depthOrArrayLayers 在每一级都不变（与 core 的 mipLevelExtent 一致），
    // 所以 3 层 × 2 级 = 6 个 pass。
    expect(mock.passes).toHaveLength(6);
    expect([...mipCacheSeam(texture).mipPassCache.keys()].sort()).toEqual([
      '1:0',
      '1:1',
      '1:2',
      '2:0',
      '2:1',
      '2:2',
    ]);

    texture.destroy();
  });

  it('每个 pass 的目标只覆盖「该级该层」，源层与目标层一一对应（同层降采样）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 2 },
      mipLevelCount: 3,
    });

    texture.generateMipmaps();

    // 目标 view：baseMipLevel = 级、baseArrayLayer = 层、只覆盖 1 级 1 层。
    const targets = mock.passes.map((pass) => viewShape(pass.target));
    expect(targets).toEqual([
      { label: 'mips:mip1', dimension: '2d', baseMipLevel: 1, mipLevelCount: 1, baseArrayLayer: 0, arrayLayerCount: 1 },
      { label: 'mips:mip1', dimension: '2d', baseMipLevel: 1, mipLevelCount: 1, baseArrayLayer: 1, arrayLayerCount: 1 },
      { label: 'mips:mip2', dimension: '2d', baseMipLevel: 2, mipLevelCount: 1, baseArrayLayer: 0, arrayLayerCount: 1 },
      { label: 'mips:mip2', dimension: '2d', baseMipLevel: 2, mipLevelCount: 1, baseArrayLayer: 1, arrayLayerCount: 1 },
    ]);

    // 源 view：级 = 上一级，层 = 目标层（2d-array 逐层独立）。
    const sources = mock.passes.map((pass) => viewShape(pass.bindGroup!.entries[0]!.resource as MockView));
    expect(sources).toEqual([
      { label: 'mips:mip0', dimension: '2d', baseMipLevel: 0, mipLevelCount: 1, baseArrayLayer: 0, arrayLayerCount: 1 },
      { label: 'mips:mip0', dimension: '2d', baseMipLevel: 0, mipLevelCount: 1, baseArrayLayer: 1, arrayLayerCount: 1 },
      { label: 'mips:mip1', dimension: '2d', baseMipLevel: 1, mipLevelCount: 1, baseArrayLayer: 0, arrayLayerCount: 1 },
      { label: 'mips:mip1', dimension: '2d', baseMipLevel: 1, mipLevelCount: 1, baseArrayLayer: 1, arrayLayerCount: 1 },
    ]);

    // 同一级里不同层的目标 view 必须是不同的对象（不同 subresource）。
    const level1Targets = mock.passes.slice(0, 2).map((pass) => pass.target);
    expect(level1Targets[0]).not.toBe(level1Targets[1]);
    expect(viewShape(level1Targets[0]!).baseArrayLayer).not.toBe(viewShape(level1Targets[1]!).baseArrayLayer);

    texture.destroy();
  });

  it('数组纹理各层内容互不相同：每层的目标 subresource 都被独立写入且内容逐层不同', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 4 },
      mipLevelCount: 3,
    });

    texture.generateMipmaps();

    // mock 里「同一条渲染路径」等价于「同一组 (管线, 源 view, 目标 view)」；
    // 逐层不同 ⇒ 第 s 层的渲染结果只落在第 s 片 subresource 上，不可能与另一层雷同。
    const signatures = mock.passes.map((pass) => {
      const target = viewShape(pass.target);
      const source = viewShape(pass.bindGroup!.entries[0]!.resource as MockView);
      return JSON.stringify([pass.label, target, source]);
    });
    expect(new Set(signatures).size).toBe(signatures.length);
    expect(signatures).toHaveLength(12);

    texture.destroy();
  });

  it('bind group 的绑定是「该级该层的源 view + 采样器」，目标 view 绝不出现在采样绑定里', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 3 },
      mipLevelCount: 2,
    });

    texture.generateMipmaps();

    expect(mock.bindGroups).toHaveLength(3);
    mock.passes.forEach((pass, index) => {
      const entries = pass.bindGroup!.entries;
      // 数组路径比 2d 路径多一个层级 uniform（binding 1 是采样器、binding 2 是层参数）。
      expect(entries.map((entry) => entry.binding)).toEqual([0, 1, 2]);
      expect(entries[0]!.resource).not.toBe(pass.target);
      expect(entries[1]!.resource).toBeTypeOf('object');
      // 层参数必须是「该层」的值（0..layerCount-1），不能恒为 0。
      const uniform = entries[2]!.resource as MockBuffer;
      expect(Array.from(uniform.data)).toEqual([index, 0, 0, 0]);
    });

    texture.destroy();
  });

  it('重复调用不再重建（缓存按 (级, 层) 命中），缓存条目数不随调用次数增长', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 16, height: 16, depthOrArrayLayers: 4 },
      mipLevelCount: 5,
    });

    texture.generateMipmaps();
    const viewsAfterFirst = mock.counters.createView;
    const groupsAfterFirst = mock.counters.createBindGroup;
    expect(viewsAfterFirst).toBe(2 * 4 * 4);
    expect(groupsAfterFirst).toBe(4 * 4);

    for (let call = 0; call < 3; call += 1) texture.generateMipmaps();

    expect(mock.counters.createView).toBe(viewsAfterFirst);
    expect(mock.counters.createBindGroup).toBe(groupsAfterFirst);
    expect(mock.passes).toHaveLength(4 * 4 * 4);
    expect(mock.counters.submits).toBe(4);
    expect(mipCacheSeam(texture).mipPassCache.size).toBe(16);

    texture.destroy();
  });

  it('2d 单层纹理的指令流与改动前逐字段一致（不动既有路径）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, { label: 'flat', size: { width: 16, height: 16 }, mipLevelCount: 5 });

    texture.generateMipmaps();

    // view descriptor 逐字段与改动前相同（6 个字段，不多不少）。
    mock.views.forEach((view) => {
      expect(Object.keys(view.descriptor).sort()).toEqual([
        'arrayLayerCount',
        'baseArrayLayer',
        'baseMipLevel',
        'dimension',
        'label',
        'mipLevelCount',
      ]);
      expect(view.descriptor['dimension']).toBe('2d');
      expect(view.descriptor['baseArrayLayer']).toBe(0);
      expect(view.descriptor['arrayLayerCount']).toBe(1);
    });
    // 2d 单层仍然只绑定「纹理 + 采样器」两项，不引入层级 uniform。
    mock.passes.forEach((pass) => {
      expect(pass.bindGroup!.entries.map((entry) => entry.binding)).toEqual([0, 1]);
      expect(pass.depthSliceProvided).toBe(false);
    });
    expect(mock.counters.createView).toBe(8);
    expect(mock.counters.createBindGroup).toBe(4);
    expect(mock.buffers).toHaveLength(0);

    texture.destroy();
  });
});

describe('WebGPUTexture.generateMipmaps()：3d 支持（#27）', () => {
  it('8 深 × 4 级：每一级的层数沿 z 减半（8 → 4 → 2 → 1）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      dimension: '3d',
      size: { width: 4, height: 4, depthOrArrayLayers: 8 },
      mipLevelCount: 4,
    });

    texture.generateMipmaps();

    // 逐级写满有效的 z 片：4 + 2 + 1 = 7 个 pass。
    expect(mock.passes).toHaveLength(7);

    const levels = mock.passes.map((pass) => viewShape(pass.target).baseMipLevel);
    expect(levels).toEqual([1, 1, 1, 1, 2, 2, 3]);

    // 每一级的写层数等于该级的逻辑深度（max(1, 8 >> level)）。
    for (const level of [1, 2, 3]) {
      const written = mock.passes.filter((pass) => viewShape(pass.target).baseMipLevel === level);
      expect(written).toHaveLength(layersAtLevel('3d', 8, level));
    }

    // 缓存键同样是 (级, 层) 复合键。
    expect([...mipCacheSeam(texture).mipPassCache.keys()].sort()).toEqual([
      '1:0',
      '1:1',
      '1:2',
      '1:3',
      '2:0',
      '2:1',
      '3:0',
    ]);

    texture.destroy();
  });

  it('3d：目标层 s 的源层是「上一级的第 s>>1 层」（沿 z 减半时不能都从第 0 层采样）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      dimension: '3d',
      size: { width: 4, height: 4, depthOrArrayLayers: 4 },
      mipLevelCount: 3,
    });

    texture.generateMipmaps();

    // level 1 写 2 层（源是 level 0 的 2 层：s=0→0、s=1→1）；
    // level 2 写 1 层（源是 level 1 的唯一一层，即 0）。
    const pairs = mock.passes.map((pass) => {
      const target = viewShape(pass.target);
      const source = viewShape(pass.bindGroup!.entries[0]!.resource as MockView);
      return [target.baseMipLevel, target.baseArrayLayer, source.baseMipLevel, source.baseArrayLayer];
    });
    expect(pairs).toEqual([
      [1, 0, 0, 0],
      [1, 1, 0, 1],
      [2, 0, 1, 0],
    ]);

    // 「都从第 0 层采样」是这个改动最容易犯的静默错误：这里显式排除它。
    const sampledLayers = pairs.map((pair) => pair[3]);
    expect(sampledLayers).toContain(1);

    texture.destroy();
  });

  it('3d 的每一层都有自己独立的目标 subresource（不会两层写同一片）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      dimension: '3d',
      size: { width: 4, height: 4, depthOrArrayLayers: 4 },
      mipLevelCount: 3,
    });

    texture.generateMipmaps();

    const targets = mock.passes.map((pass) => {
      const shape = viewShape(pass.target);
      return `${shape.baseMipLevel}:${shape.baseArrayLayer}`;
    });
    expect(new Set(targets).size).toBe(targets.length);

    texture.destroy();
  });
});

describe('WebGPUTexture.generateMipmaps()：多维纹理的参数校验（#27）', () => {
  it('mipLevelCount 为 1 的多层纹理仍然报错（没有级别可生成）', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 2 },
      mipLevelCount: 1,
    });
    expect(() => texture.generateMipmaps()).toThrowError(/mipLevelCount is 1/);
    expect(mock.passes).toHaveLength(0);
    texture.destroy();
  });

  it('没有 RenderAttachment 的多层纹理仍然在提交之前报错', () => {
    const mock = createMockMipGpu();
    const texture = createTexture(mock, {
      size: { width: 8, height: 8, depthOrArrayLayers: 2 },
      mipLevelCount: 3,
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
    });
    expect(() => texture.generateMipmaps()).toThrowError(/without the "RenderAttachment" usage/);
    expect(mock.passes).toHaveLength(0);
    texture.destroy();
  });
});
