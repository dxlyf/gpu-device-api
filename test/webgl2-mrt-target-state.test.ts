/**
 * 批 05 · `#10`：WebGL2 把「逐附件 blend / writeMask」静默当成附件 0。
 *
 * ## 缺陷（改前实测）
 *
 * WebGPU 侧**逐 target** 下发混合与写掩码（`WebGPURenderState.toGPUColorTargets`：
 * `targets[i].blend` / `targets[i].writeMask` 各自进 `GPUFragmentState.targets[i]`）；
 * 而 WebGL2 侧改前只取「**第一个**带 `blend` 的 target」的 blend 与 `targets[0].writeMask`
 * 当作**整帧唯一的**全局状态：
 *
 * ```ts
 * const targetBlend = targets?.find((target) => target?.blend)?.blend;
 * const blendSource = targetBlend ?? blendDescriptor;
 * const writeMaskValue = targets?.[0]?.writeMask ?? descriptor.render?.writeMask ?? ColorWriteMask.All;
 * ```
 *
 * 于是 `targets: [{blend: alpha}, {blend: additive}]` 会把 alpha 混合**同时**施加到两个附件上
 * （第二个附件的结果静默错误），`targets: [null, {writeMask: Blue}]` 更是把写掩码退回 `All`。
 *
 * ## 为什么不能「实现」而是明确报错
 *
 * 逐附件的混合/写掩码在 WebGL2 里**没有表达方式**：GLES 3.0 需要
 * `blendFunci` / `blendEquationSeparatei` / `colorMaski`（这些在 GL 4.0 / ES 3.2 才有）。
 * 本机审计实测 `gl.blendFunci === undefined`、`gl.colorMaski === undefined`（见批 05 汇报）。
 * 而 GL 只有一组全局 `BLEND` / `blendFuncSeparate` / `colorMask` 状态，`drawBuffers` 也不影响它们。
 * 所以「不同的逐附件状态」在 WebGL2 上不可能被如实执行 —— 只能明确失败，
 * 绝不允许继续静默地按附件 0 执行。
 *
 * ## 可归约的情形必须放行
 *
 * 1. 所有**非空** target 的 blend / writeMask **逐字段相同**（含都从 `render.blend` /
 *    `render.writeMask` 缺省而来）→ 完全可表达，正常下发全局状态，不报错；
 * 2. `targets[i] === null` 表示「location i 没有输出」，它的 blend / writeMask 无意义，
 *    **不参与**比较（也正因如此，`[null, {writeMask: Blue}]` 是合法且可表达的）。
 */

import { describe, expect, it } from 'vitest';

import { resolveRenderState } from '../src/webgl2/pipeline/WebGL2RenderState.js';
import { BLEND_PRESETS, ColorWriteMask } from '../src/core/pipeline/RenderState.js';
import type { ColorTargetState, RenderState } from '../src/core/pipeline/RenderState.js';
import type { RenderPipelineDescriptor } from '../src/core/pipeline/RenderPipeline.js';
import type { ResolvedRenderState } from '../src/webgl2/pipeline/WebGL2RenderState.js';

const NO_DEPTH = { depth: false, stencil: false };

/** 一条只声明片元 target 的管线描述（本次测量只关心 fragment.targets）。 */
function pipeline(
  targets: readonly (ColorTargetState | null)[] | undefined,
  render?: RenderState,
): RenderPipelineDescriptor {
  return {
    label: 'mrt-state',
    vertex: { module: {} as never, entryPoint: 'vsMain' },
    fragment: { module: {} as never, entryPoint: 'fsMain', ...(targets ? { targets } : {}) },
    ...(render ? { render } : {}),
  };
}

function resolve(
  targets: readonly (ColorTargetState | null)[] | undefined,
  render?: RenderState,
): ResolvedRenderState {
  return resolveRenderState(pipeline(targets, render), NO_DEPTH);
}

/** 把「唯一一份逐附件状态」用单目标描述解析一次，当作全局状态的参照值。 */
function singleTargetReference(blend: RenderState['blend'], writeMask?: ColorWriteMask): ResolvedRenderState {
  return resolve(
    [{ ...(blend ? { blend } : {}), ...(writeMask === undefined ? {} : { writeMask }) }],
    blend ? { blend } : undefined,
  );
}

describe('#10 逐附件状态不同 → 明确报错（不再静默按附件 0 执行）', () => {
  it('两个 target 的 blend 不同：报错并说清 WebGL2 只有全局混合', () => {
    // 改前：`targets.find((t) => t?.blend)?.blend` 取到 alpha，把它当成**整帧**的混合，
    // 于是第二个附件被静默地按 alpha 混合（它的 additive 意图完全丢失）。
    expect(() => resolve([{ blend: BLEND_PRESETS.alpha }, { blend: BLEND_PRESETS.additive }])).toThrowError(
      /\[gpu-device-api\]/,
    );
    expect(() => resolve([{ blend: BLEND_PRESETS.alpha }, { blend: BLEND_PRESETS.additive }])).toThrowError(
      /WebGL2[\s\S]*global/i,
    );
  });

  it('两个 target 的 writeMask 不同：报错并给出路', () => {
    // 改前：取 `targets[0].writeMask`，第二个附件的 writeMask 被静默丢弃。
    expect(() =>
      resolve([{ writeMask: ColorWriteMask.Red }, { writeMask: ColorWriteMask.Blue }]),
    ).toThrowError(/\[gpu-device-api\]/);
    expect(() =>
      resolve([{ writeMask: ColorWriteMask.Red }, { writeMask: ColorWriteMask.Blue }]),
    ).toThrowError(/writeMask/i);
  });

  it('一个 target 开混合、另一个不开：报错（不是「按第一个有 blend 的算」）', () => {
    expect(() => resolve([{ blend: BLEND_PRESETS.alpha }, {}])).toThrowError(/\[gpu-device-api\]/);
  });

  it('三个 target 里只有中间一个不同：照样报错', () => {
    expect(() =>
      resolve([
        { blend: BLEND_PRESETS.alpha, writeMask: ColorWriteMask.All },
        { blend: BLEND_PRESETS.alpha, writeMask: ColorWriteMask.Red },
        { blend: BLEND_PRESETS.alpha, writeMask: ColorWriteMask.All },
      ]),
    ).toThrowError(/writeMask/i);
  });

  it('错误消息是英文、带前缀，并给出替代方案（统一状态或多趟渲染）', () => {
    let message = '';
    try {
      resolve([{ blend: BLEND_PRESETS.alpha }, { blend: BLEND_PRESETS.additive }]);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message.startsWith('[gpu-device-api] ')).toBe(true);
    // 不含 CJK：与 00-common 的「错误消息英文」一致（本批新增的报错按英文写）。
    expect(/[\u4e00-\u9fff]/.test(message)).toBe(false);
    expect(message).toMatch(/same|identical/i);
    expect(message).toMatch(/pass|render/i);
  });
});

describe('#10 可归约的情形必须正常放行', () => {
  it('两个 target 状态完全相同（同一对象）：全局状态就是它，不报错', () => {
    const blend = BLEND_PRESETS.alpha;
    const state = resolve([{ blend, writeMask: ColorWriteMask.All }, { blend, writeMask: ColorWriteMask.All }]);
    expect(state.blend).toEqual(singleTargetReference(blend, ColorWriteMask.All).blend);
    expect(state.writeMask).toEqual([true, true, true, true]);
  });

  it('两个 target 的结构相同但对象不同：按**值**比较也必须放行', () => {
    // `{...BLEND_PRESETS.alpha}` 与 `BLEND_PRESETS.alpha` 是不同对象、同一份状态。
    // 用对象身份比较会在这里误报，所以判据必须是逐字段的数值比较。
    const state = resolve([
      { blend: { ...BLEND_PRESETS.alpha, color: { ...BLEND_PRESETS.alpha.color } }, writeMask: ColorWriteMask.Red },
      { blend: BLEND_PRESETS.alpha, writeMask: ColorWriteMask.Red },
    ]);
    expect(state.blend).toEqual(singleTargetReference(BLEND_PRESETS.alpha, ColorWriteMask.Red).blend);
    expect(state.writeMask).toEqual([true, false, false, false]);
  });

  it('缺省的 blend / writeMask 由 render.blend / render.writeMask 补齐：相同就放行', () => {
    // target 1 只写了 writeMask，blend 落到 `render.blend`；target 0 显式写了同一个 blend。
    const state = resolve(
      [{ blend: BLEND_PRESETS.additive, writeMask: ColorWriteMask.All }, { writeMask: ColorWriteMask.All }],
      { blend: BLEND_PRESETS.additive },
    );
    expect(state.blend).toEqual(singleTargetReference(BLEND_PRESETS.additive, ColorWriteMask.All).blend);
    expect(state.writeMask).toEqual([true, true, true, true]);
  });

  it('空位 null 不参与比较：[null, {writeMask: Blue}] 是合法且可表达的', () => {
    // 改前这里把 writeMask 退回 `All`（`targets[0]` 是 null），第二个附件的写掩码被静默放宽 ——
    // 一个「只想写蓝通道」的 pass 会连 RGB 一起写。
    const state = resolve([null, { blend: BLEND_PRESETS.additive, writeMask: ColorWriteMask.Blue }]);
    expect(state.blend).toEqual(singleTargetReference(BLEND_PRESETS.additive, ColorWriteMask.Blue).blend);
    expect(state.writeMask).toEqual([false, false, true, false]);
  });

  it('[view, null]：尾部空位不影响全局状态', () => {
    const state = resolve([{ blend: BLEND_PRESETS.multiply, writeMask: ColorWriteMask.Green }, null]);
    expect(state.blend).toEqual(singleTargetReference(BLEND_PRESETS.multiply, ColorWriteMask.Green).blend);
    expect(state.writeMask).toEqual([false, true, false, false]);
  });

  it('全部是空位：退回 render 的全局状态（不报错）', () => {
    const state = resolve([null, null], { blend: BLEND_PRESETS.screen, writeMask: ColorWriteMask.Alpha });
    expect(state.blend).toEqual(singleTargetReference(BLEND_PRESETS.screen, ColorWriteMask.Alpha).blend);
    expect(state.writeMask).toEqual([false, false, false, true]);
  });

  it('单目标（最常见的形状）行为逐字段不变', () => {
    const state = resolve([{ blend: BLEND_PRESETS.premultiplied }]);
    expect(state.blend).toEqual(singleTargetReference(BLEND_PRESETS.premultiplied).blend);
    expect(state.writeMask).toEqual([true, true, true, true]);

    // 不声明 targets 时走 render 的全局状态（与改前一致）。
    const globalOnly = resolve(undefined, { blend: BLEND_PRESETS.alpha });
    expect(globalOnly.blend).toEqual(singleTargetReference(BLEND_PRESETS.alpha).blend);
  });

  it('没有任何 blend：全局混合关闭', () => {
    const state = resolve([{}, {}]);
    expect(state.blend).toBeNull();
    expect(state.writeMask).toEqual([true, true, true, true]);
  });
});
