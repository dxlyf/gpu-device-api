/**
 * 批 05 · `#11.3`：WebGPU 侧 `colorAttachments` 的 `null` 空位与「只收非空附件」的 `formats`。
 *
 * ## 改前实测（node 侧，纯函数 / 变体缓存，无需 GPU）
 *
 * `toGPURenderPassDescriptor()` 原样保留 `null` 进原生
 * `GPURenderPassDescriptor.colorAttachments`（位置正确），但**推导 pass 布局时把非空附件压缩**：
 *
 * ```ts
 * for (const attachment of colorAttachments) {
 *   if (!attachment) { nativeColors.push(null); continue; }   // 原生数组保留空位
 *   formats.push(...);                                        // 而 formats 只收非空
 * }
 * ```
 *
 * 实测（node 侧临时测量块，修复前，`test/webgpu-mrt-null-slots.test.ts` 的一次性探针）：
 *
 * | pass 的 colorAttachments | 原生数组长度 | `layout.colorFormats` |
 * | --- | --- | --- |
 * | `[a]` | 1 | `["rgba8unorm"]` |
 * | `[a, b]` | 2 | `["rgba8unorm","rgba16float"]` |
 * | `[null, b]` | 2 | `["rgba8unorm"]` ← **压缩了** |
 * | `[a, null]` | 2 | `["rgba8unorm"]` |
 * | `[null, null, c]` | 3 | `["rgba8unorm"]` |
 *
 * `layout.colorFormats` 是 `RenderPipelineVariant.colorFormats` 的唯一来源，于是两件事发生了：
 *
 * 1. **变体错配（实测）**：`[a, null]` 与 `[null, a]` 推导出**同一个**变体键
 *    （都是 `["rgba8unorm"]` → 键 `rgba8unorm|1|none`），
 *    `WebGPURenderPipeline.resolve()` 因此返回**同一条原生管线**
 *    （实测 `createRenderPipeline=1`、`samePipelineObject=true`、该管线的
 *    `fragment.targets.length=1`）。而按 WebGPU 语义两者需要的
 *    `GPUFragmentState.targets` 分别是 `[state0, null]` 与 `[null, state0]` ——
 *    一条管线不可能同时正确服务两者。
 * 2. **空位后面的 target 整体前移**：`[null, b]` 的 `targets[0]` 会被应用到 location 0
 *    （空位），而 location 1（真正的附件 `b`）拿不到自己的 target。
 *
 * ## 处置：明确报错（不静默）
 *
 * 完整修法是让 `RenderPipelineVariant.colorFormats` 变成**逐位置**（空位用 `null` 占位）——
 * 那是**公开类型**（`core/pipeline/RenderPipeline.ts`）的加宽，还要同步改
 * `webgpu/pipeline/WebGPURenderPipeline.ts`（不在本批文件所有权内）与
 * `webgpu/pipeline/PipelineCache.ts` 的键，以及 gfx `Renderer` 里同样压缩的 `colorFormats` 推导。
 * 本批不做（避免范围交叉），所以这里改为**在 pass 建立期明确失败**：
 *
 * - 空位**后面还有非空附件**（位置映射会错位、变体键会撞车）→ 抛带 `[gpu-device-api] ` 前缀的
 *   英文错误，说清「变体只携带非空格式的密集列表，无法表达 location 空位」；
 * - 空位在**尾部**（`[a, null]`）→ 位置映射对**所有有输出的 location** 都是对的，
 *   继续放行（这也是原生 WebGPU 的合法写法，不该被本层拒绝）。
 *
 * ⚠️ 待办（交给后续批次）：把 `colorFormats` 全链路改成逐位置后，上面的报错应当撤掉。
 */

import { describe, expect, it } from 'vitest';

import { toGPURenderPassDescriptor } from '../src/webgpu/render/WebGPURenderPassEncoder.js';
import type { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import type { RenderPassDescriptor } from '../src/core/render/RenderPassEncoder.js';
import type { ColorAttachment } from '../src/core/render/RenderTarget.js';
import type { TextureFormat } from '../src/core/enums/TextureFormat.js';

/**
 * 一张「原生形状」的假 texture view。
 *
 * `toGPURenderPassDescriptor()` 只要求它通过 `asGPUTextureView()` 的形状识别
 * （`@@toStringTag === 'GPUTextureView'` 且没有 `native` / `createView`），
 * 并能读出 `texture.format` / `texture.sampleCount` / `descriptor.format`。
 */
function fakeView(format: TextureFormat, sampleCount = 1): ColorAttachment['view'] {
  const texture = { format, sampleCount };
  const view: Record<string | symbol, unknown> = { texture, descriptor: {} };
  Object.defineProperty(view, Symbol.toStringTag, { value: 'GPUTextureView' });
  return view as unknown as ColorAttachment['view'];
}

/** 该测量只用到 pass 布局推导，`device` 只在 `timestampWrites` 上被读。 */
const DEVICE = {} as WebGPUDevice;

function pass(colorAttachments: readonly (ColorAttachment | null)[]): RenderPassDescriptor {
  return { label: 'mrt', colorAttachments };
}

/* ================================================================================== */

describe('#11.3 WebGPU：空位后面还有非空附件 → 明确报错（不再压缩成密集列表）', () => {
  it('[null, view]：报错，并说清变体无法表达 location 空位', () => {
    expect(() => toGPURenderPassDescriptor(pass([null, { view: fakeView('rgba8unorm') }]), DEVICE)).toThrowError(
      /\[gpu-device-api\]/,
    );
    expect(() => toGPURenderPassDescriptor(pass([null, { view: fakeView('rgba8unorm') }]), DEVICE)).toThrowError(
      /colorAttachments\[0\]/,
    );
  });

  it('[null, null, view] 与 [view, null, view]：同样报错', () => {
    expect(() =>
      toGPURenderPassDescriptor(
        pass([null, null, { view: fakeView('rgba8unorm') }]),
        DEVICE,
      ),
    ).toThrowError(/\[gpu-device-api\]/);
    expect(() =>
      toGPURenderPassDescriptor(
        pass([{ view: fakeView('rgba8unorm') }, null, { view: fakeView('rgba8unorm') }]),
        DEVICE,
      ),
    ).toThrowError(/\[gpu-device-api\]/);
  });

  it('错误消息是英文、带前缀，并给出可行的替代方案', () => {
    let message = '';
    try {
      toGPURenderPassDescriptor(pass([null, { view: fakeView('rgba8unorm') }]), DEVICE);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message.startsWith('[gpu-device-api] ')).toBe(true);
    expect(/[\u4e00-\u9fff]/.test(message)).toBe(false);
    expect(message).toMatch(/null/);
    expect(message).toMatch(/dense|compacted|non-null/i);
  });
});

describe('#11.3 无空位 / 只有尾部空位的写法不受影响', () => {
  it('[view]：布局逐字段与改前一致', () => {
    const layout = toGPURenderPassDescriptor(pass([{ view: fakeView('rgba8unorm') }]), DEVICE).layout;
    expect(layout.colorFormats).toEqual(['rgba8unorm']);
    expect(layout.sampleCount).toBe(1);
    expect(layout.depthFormat).toBeNull();
  });

  it('[viewA, viewB]：两个格式都进布局（含不同格式）', () => {
    const layout = toGPURenderPassDescriptor(
      pass([{ view: fakeView('rgba8unorm') }, { view: fakeView('rgba16float') }]),
      DEVICE,
    ).layout;
    expect(layout.colorFormats).toEqual(['rgba8unorm', 'rgba16float']);
  });

  it('[view, null]：尾部空位放行 —— 有输出的 location 位置映射本来就是对的', () => {
    const result = toGPURenderPassDescriptor(pass([{ view: fakeView('rgba8unorm') }, null]), DEVICE);
    // 原生数组仍然保留空位（这一层从来没有丢过 null）。
    // `GPURenderPassDescriptor.colorAttachments` 在 @webgpu/types 里是 `Iterable`，所以先摊开。
    const nativeColors = [...(result.native.colorAttachments ?? [])];
    expect(nativeColors).toHaveLength(2);
    expect(nativeColors[1]).toBeNull();
    // 密集格式列表与 location 0 一一对应：targets[0] 落在 location 0 = 那张 view。
    expect(result.layout.colorFormats).toEqual(['rgba8unorm']);
  });
});
