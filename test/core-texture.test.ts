/**
 * core 纹理尺寸辅助函数的单测：`fullMipLevelCount` / `mipLevelExtent` / `resolveTextureSize`。
 *
 * 这几条是「非 2 的幂、非正方形、尺寸小到不能继续降采样」三类边界情况的权威定义，
 * gfx 层与两个后端都按它们算 mip 链，所以单独锁一遍。
 */

import { describe, expect, it } from 'vitest';

import {
  fullMipLevelCount,
  mipLevelExtent,
  resolveTextureSize,
} from '../src/core/resources/Texture.js';
import { ValidationError } from '../src/core/errors/index.js';

describe('resolveTextureSize', () => {
  it('单个数字表示正方形', () => {
    expect(resolveTextureSize(8)).toEqual({ width: 8, height: 8, depthOrArrayLayers: 1 });
  });

  it('对象写法补默认高度与层数', () => {
    expect(resolveTextureSize({ width: 8 })).toEqual({ width: 8, height: 1, depthOrArrayLayers: 1 });
    expect(resolveTextureSize({ width: 8, height: 4, depthOrArrayLayers: 3 })).toEqual({
      width: 8,
      height: 4,
      depthOrArrayLayers: 3,
    });
  });
});

describe('fullMipLevelCount', () => {
  it('按最大维度取 2 的对数再加一', () => {
    expect(fullMipLevelCount({ width: 1, height: 1 })).toBe(1);
    expect(fullMipLevelCount({ width: 2, height: 2 })).toBe(2);
    expect(fullMipLevelCount({ width: 64, height: 64 })).toBe(7);
    expect(fullMipLevelCount({ width: 2048, height: 2048 })).toBe(12);
  });

  it('非正方形取较大的那一维', () => {
    expect(fullMipLevelCount({ width: 8, height: 2 })).toBe(4); // 8 → 4 → 2 → 1
    expect(fullMipLevelCount({ width: 2, height: 8 })).toBe(4);
  });

  it('非 2 的幂向下取整', () => {
    expect(fullMipLevelCount({ width: 60, height: 36 })).toBe(6); // 60 → 30 → 15 → 7 → 3 → 1
    expect(fullMipLevelCount({ width: 100, height: 50 })).toBe(7); // 100 → 50 → 25 → 12 → 6 → 3 → 1
    expect(fullMipLevelCount({ width: 3, height: 3 })).toBe(2);
  });
});

describe('mipLevelExtent', () => {
  it('每一维独立减半，下限为 1', () => {
    const size = { width: 60, height: 36 };
    expect([0, 1, 2, 3, 4, 5].map((level) => mipLevelExtent(size, level))).toEqual([
      { width: 60, height: 36, depthOrArrayLayers: 1 },
      { width: 30, height: 18, depthOrArrayLayers: 1 },
      { width: 15, height: 9, depthOrArrayLayers: 1 },
      { width: 7, height: 4, depthOrArrayLayers: 1 },
      { width: 3, height: 2, depthOrArrayLayers: 1 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
    ]);
  });

  it('非正方形：较短的那一维先到 1，之后一直保持 1', () => {
    const size = { width: 8, height: 2 };
    expect([0, 1, 2, 3].map((level) => mipLevelExtent(size, level))).toEqual([
      { width: 8, height: 2, depthOrArrayLayers: 1 },
      { width: 4, height: 1, depthOrArrayLayers: 1 },
      { width: 2, height: 1, depthOrArrayLayers: 1 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
    ]);
  });

  it('超出最大级别的请求返回 1x1（不会出现 0 或负数尺寸）', () => {
    expect(mipLevelExtent({ width: 8, height: 8 }, 4)).toEqual({
      width: 1,
      height: 1,
      depthOrArrayLayers: 1,
    });
    expect(mipLevelExtent(1, 12)).toEqual({ width: 1, height: 1, depthOrArrayLayers: 1 });
  });

  it('层数不参与减半', () => {
    expect(mipLevelExtent({ width: 8, height: 8, depthOrArrayLayers: 6 }, 2)).toEqual({
      width: 2,
      height: 2,
      depthOrArrayLayers: 6,
    });
  });

  it('非法 level 抛带前缀的错误', () => {
    expect(() => mipLevelExtent(8, -1)).toThrowError(ValidationError);
    expect(() => mipLevelExtent(8, -1)).toThrowError(/^\[gpu-device-api\] mipLevelExtent/);
    expect(() => mipLevelExtent(8, 1.5)).toThrowError(/non-negative integer/);
  });
});
