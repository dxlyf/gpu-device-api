/**
 * 批 05 · `#11.3`：WebGPU 侧 `colorAttachments` 的 `null` 空位与 pass 布局的格式列表。
 *
 * ## 原始缺陷（批 05 改前实测，node 侧纯函数，无需 GPU）
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
 * | pass 的 colorAttachments | 原生数组长度 | 改前的 `layout.colorFormats` |
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
 *    （都是 `["rgba8unorm"]` → 键 `rgba8unorm|1|none`），`WebGPURenderPipeline.resolve()`
 *    因此返回**同一条原生管线**（实测 `createRenderPipeline=1`、`samePipelineObject=true`、
 *    该管线的 `fragment.targets.length=1`）；
 * 2. **空位后面的 target 整体前移**：`[null, b]` 的 `targets[0]` 会被应用到 location 0（空位）。
 *
 * ## 批 05 的处置 → 批 10 的完整修法（本文件为什么被改写）
 *
 * 批 05 因为文件所有权没动 `RenderPipelineVariant`，于是**临时**在 pass 建立期报错：
 * 「空位后面还有非空附件」→ 抛带前缀的英文错误；尾部空位继续放行。
 *
 * 批 10 把 `RenderPipelineVariant.colorFormats` 改成**逐位置**（下标即 fragment output
 * location，空位写 `null`）并同步了键、原生 `fragment.targets`、gfx 的推导，于是：
 *
 * - 那条**报错被撤掉**，`[null, view]` / `[null, null, view]` / `[view, null, view]` 现在
 *   真的可用（批 10 的原生探针实测：`targets: [null, {format}]` + `[null, view]` 接受且
 *   location 1 收到绿色；`[a, null, c]` + `[state, null, state]` 接受且两个落点都对）；
 * - `layout.colorFormats` 变成逐位置（尾部空位也占位），所以下面几条断言跟着更新。
 *
 * ⚠️ 这几条用例**不是被删掉**，而是按「不再报错且落点正确」改写的（有意改变的行为）。
 * 撞键本身的新覆盖在 `test/webgpu-mrt-positional-formats.test.ts`：
 * `[a]` / `[a, null]` / `[null, a]` / `[a, a]` 必须建出 **4** 条互不相同的原生管线、
 * 键两两不同、`fragment.targets` 逐位置对齐。真实渲染（两后端逐像素）见批 10 汇报里的
 * 原生探针与 `.tmp-10/` 的抓取。
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

describe('#11.3 中间空位不再报错：布局逐位置（批 10 撤掉了批 05 的临时闸门）', () => {
  it('[null, view]：不再报错，layout.colorFormats 是 [null, "rgba8unorm"]', () => {
    // 批 05：这里抛 `[gpu-device-api] mrt: colorAttachments[0] is null, but a later entry is not null.`
    // 批 10：修好之后放行，位置信息由逐位置列表承载（下标 0 就是 location 0）。
    const layout = toGPURenderPassDescriptor(pass([null, { view: fakeView('rgba8unorm') }]), DEVICE).layout;
    expect(layout.colorFormats).toEqual([null, 'rgba8unorm']);
    expect(layout.sampleCount).toBe(1);
    expect(layout.depthFormat).toBeNull();
  });

  it('[null, null, view] 与 [view, null, view]：不再报错，且每个下标各自对齐', () => {
    const twoHoles = toGPURenderPassDescriptor(
      pass([null, null, { view: fakeView('rgba8unorm') }]),
      DEVICE,
    ).layout;
    expect(twoHoles.colorFormats).toEqual([null, null, 'rgba8unorm']);

    const middle = toGPURenderPassDescriptor(
      pass([{ view: fakeView('rgba8unorm') }, null, { view: fakeView('rgba16float') }]),
      DEVICE,
    ).layout;
    // 中间空位后面的 `rgba16float` 留在下标 2（改前会被压缩到下标 1）。
    expect(middle.colorFormats).toEqual(['rgba8unorm', null, 'rgba16float']);
  });

  it('原生 colorAttachments 与逐位置列表的长度、下标一一对应', () => {
    const result = toGPURenderPassDescriptor(
      pass([null, { view: fakeView('rgba8unorm') }, null]),
      DEVICE,
    );
    // `GPURenderPassDescriptor.colorAttachments` 在 @webgpu/types 里是 `Iterable`，所以先摊开。
    const nativeColors = [...(result.native.colorAttachments ?? [])];
    expect(nativeColors).toHaveLength(3);
    expect(nativeColors[0]).toBeNull();
    expect(nativeColors[1]).not.toBeNull();
    expect(nativeColors[2]).toBeNull();
    // 尾部空位同样占位：`[null, view]`（长度 2）与 `[null, view, null]`（长度 3）是两个布局。
    expect(result.layout.colorFormats).toHaveLength(nativeColors.length);
  });
});

describe('#11.3 无空位 / 只有尾部空位的写法', () => {
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

  it('[view, null]：尾部空位放行，并且现在**占住自己的下标**', () => {
    const result = toGPURenderPassDescriptor(pass([{ view: fakeView('rgba8unorm') }, null]), DEVICE);
    // 原生数组仍然保留空位（这一层从来没有丢过 null）。
    const nativeColors = [...(result.native.colorAttachments ?? [])];
    expect(nativeColors).toHaveLength(2);
    expect(nativeColors[1]).toBeNull();
    // 批 05 时这里是 ['rgba8unorm']（与 `[view]` 撞同一个变体键）；
    // 批 10 逐位置之后尾部空位也占位 —— 这是有意的语义变化，见文件头。
    // 「有输出的 location 位置映射本来就是对的」这条性质仍然成立且更强：下标就是 location。
    expect(result.layout.colorFormats).toEqual(['rgba8unorm', null]);
  });
});
