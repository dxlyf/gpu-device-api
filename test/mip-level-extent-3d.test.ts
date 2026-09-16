/**
 * 批 12：`mipLevelExtent` 在 **3D** 下的尺寸必须与 WebGPU 规范一致。
 *
 * WebGPU 的 `logical miplevel-specific texture extent` 按 `dimension` 分三支：
 *
 * - `"1d"`：`(max(1, w >> level), 1, 1)`；
 * - `"2d"`：`(max(1, w >> level), max(1, h >> level), depthOrArrayLayers)` ——
 *   这里的 `depthOrArrayLayers` 是**数组层数**，每层是彼此独立的 subresource，**不随级别变化**；
 * - `"3d"`：`(max(1, w >> level), max(1, h >> level), max(1, d >> level))` —— 深度**要减半**。
 *
 * `2d` 与 `3d` 在描述符里**共用同一个 `depthOrArrayLayers` 字段**，只能靠 `dimension` 区分。
 * 本库的 `TextureDimension` 只有 `'1d' | '2d' | '3d'`：WebGPU 的 `"2d-array"` 在本库里写作
 * `dimension: '2d'` + `depthOrArrayLayers > 1`（`"2d-array"` 是本库 `TextureViewDimension` 的值，
 * 不是 texture 的 dimension），所以「层数不减半」这一支就是 `'2d'`。
 *
 * 改动前的 `mipLevelExtent(size, level)` 没有 `dimension`，对三种维度一律把
 * `depthOrArrayLayers` 当作「不减半」—— 对 `2d` 正确，对 `3d` **少减了 depth**。
 * 该文件在修复前**失败**、修复后**通过**，且修复后不需要改动（见下面 `extentAt` 的说明）。
 *
 * 本文件只覆盖 `1d` 的**合法**描述符（`height = 1`）：`1d` 且 `height > 1` 是自相矛盾的输入，
 * `createTexture` 会直接拒绝，因此不在本批范围内（详见批 12 汇报里的「相邻发现」）。
 */

import { describe, expect, it } from 'vitest';

import type { TextureDimension, TextureSize } from '../src/core/resources/Texture.js';
import { mipLevelExtent } from '../src/core/resources/Texture.js';
import type { Extent3D } from '../src/types/internal.js';

/**
 * 复现提交里 `mipLevelExtent` 还只有两个参数（直接写三参会得到 TS2554），而复现测试本身
 * 也必须让 `tsc` 0 错误（`00-common.md` 第二节），所以这里按**目标签名**断言一次。
 * 修复后真实签名是 `(size, level, dimension?) => Extent3D`，与它一致，本文件因此不必再改。
 */
const extentAt = mipLevelExtent as (
  size: TextureSize,
  level: number,
  dimension: TextureDimension,
) => Extent3D;

/** 规范原文的独立实现（逐条对照 `Logical miplevel-specific texture extent`，不引用被测代码）。 */
function specMipExtent(size: TextureSize, level: number, dimension: TextureDimension): Extent3D {
  const base =
    typeof size === 'number'
      ? { width: size, height: size, depthOrArrayLayers: 1 }
      : { width: size.width, height: size.height ?? 1, depthOrArrayLayers: size.depthOrArrayLayers ?? 1 };
  const half = (value: number): number => Math.max(1, value >> level);
  if (dimension === '1d') {
    return { width: half(base.width), height: 1, depthOrArrayLayers: 1 };
  }
  if (dimension === '3d') {
    return { width: half(base.width), height: half(base.height), depthOrArrayLayers: half(base.depthOrArrayLayers) };
  }
  // "2d"（含本库的 2d-array）：层数不减半。
  return { width: half(base.width), height: half(base.height), depthOrArrayLayers: base.depthOrArrayLayers };
}

describe('mipLevelExtent：3d 的 depth 逐级减半（批 12）', () => {
  it('3d 8x4x8：每一维各自减半，下限为 1', () => {
    const size = { width: 8, height: 4, depthOrArrayLayers: 8 };
    expect([0, 1, 2, 3, 4].map((level) => extentAt(size, level, '3d'))).toEqual([
      { width: 8, height: 4, depthOrArrayLayers: 8 },
      { width: 4, height: 2, depthOrArrayLayers: 4 },
      { width: 2, height: 1, depthOrArrayLayers: 2 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
    ]);
  });

  it('3d 2x2x16：w/h 先到 1，depth 继续减半', () => {
    const size = { width: 2, height: 2, depthOrArrayLayers: 16 };
    expect([0, 1, 2, 3, 4, 5].map((level) => extentAt(size, level, '3d'))).toEqual([
      { width: 2, height: 2, depthOrArrayLayers: 16 },
      { width: 1, height: 1, depthOrArrayLayers: 8 },
      { width: 1, height: 1, depthOrArrayLayers: 4 },
      { width: 1, height: 1, depthOrArrayLayers: 2 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
    ]);
  });

  it('2d：depthOrArrayLayers 是数组层数，每一级都不减半', () => {
    const size = { width: 8, height: 8, depthOrArrayLayers: 6 };
    expect([0, 1, 2, 3].map((level) => extentAt(size, level, '2d'))).toEqual([
      { width: 8, height: 8, depthOrArrayLayers: 6 },
      { width: 4, height: 4, depthOrArrayLayers: 6 },
      { width: 2, height: 2, depthOrArrayLayers: 6 },
      { width: 1, height: 1, depthOrArrayLayers: 6 },
    ]);
  });

  it('同一个 depthOrArrayLayers 字段在 2d 与 3d 下解释相反（这就是本批要修的点）', () => {
    const size = { width: 8, height: 8, depthOrArrayLayers: 8 };
    expect(extentAt(size, 2, '2d').depthOrArrayLayers).toBe(8);
    expect(extentAt(size, 2, '3d').depthOrArrayLayers).toBe(2);
  });

  it('与 WebGPU 规范逐级一致（1d / 2d / 3d 穷举扫描）', () => {
    const sizes: TextureSize[] = [
      { width: 1, height: 1 },
      { width: 8, height: 8 },
      { width: 60, height: 36 },
      { width: 8, height: 2 },
      { width: 2, height: 8 },
      { width: 8, height: 8, depthOrArrayLayers: 6 },
      { width: 4, height: 4, depthOrArrayLayers: 1 },
      { width: 4, height: 4, depthOrArrayLayers: 8 },
      { width: 1, height: 1, depthOrArrayLayers: 16 },
      { width: 16, height: 8, depthOrArrayLayers: 5 },
      { width: 3, height: 3, depthOrArrayLayers: 3 },
      { width: 64, height: 1, depthOrArrayLayers: 1 },
    ];
    /** `1d` 的合法描述符必须是 `height = 1` 且没有数组层（`createTexture` 会拒绝其它值）。 */
    const isValidForDimension = (size: TextureSize, dimension: TextureDimension): boolean => {
      if (dimension !== '1d') return true;
      const base = typeof size === 'number' ? { height: size, depthOrArrayLayers: 1 } : size;
      return (base.height ?? 1) === 1 && (base.depthOrArrayLayers ?? 1) === 1;
    };
    for (const dimension of ['1d', '2d', '3d'] as const) {
      for (const size of sizes) {
        if (!isValidForDimension(size, dimension)) continue;
        for (let level = 0; level <= 8; level++) {
          expect(extentAt(size, level, dimension), `${dimension} ${JSON.stringify(size)} L${level}`).toEqual(
            specMipExtent(size, level, dimension),
          );
        }
      }
    }
  });
});
