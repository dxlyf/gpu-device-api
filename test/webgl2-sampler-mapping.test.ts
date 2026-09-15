/**
 * `WebGL2Sampler` 的 `(minFilter, mipmapFilter)` → `TEXTURE_MIN_FILTER` 映射表测试。
 *
 * 被修的 bug：原先 `minFilter: 'nearest' + mipmapFilter: 'nearest'` 被映射成**不带 mip 的**
 * `NEAREST`，而 WebGPU 的语义是「`mipmapFilter` 只管级间混合；只要纹理有 mip，采样就会用 mip」。
 * 于是显式的 `textureLod(..., 4.0)` 在 WebGL2 上静默只取第 0 级，两个后端结果不一致。
 *
 * 这里把 4 种组合 × 「有 mip / 无 mip」两种情形全部逐项验证，并覆盖 `magFilter`
 *（WebGPU 的放大过滤永远单级，直接映射即可）。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2Sampler, resolveGlMinFilter } from '../src/webgl2/resources/WebGL2Sampler.js';
import { ValidationError } from '../src/core/errors/index.js';
import type { FilterMode } from '../src/core/enums/FilterMode.js';

/* GL 枚举（写死数值）。 */
const GL_NEAREST = 0x2600;
const GL_LINEAR = 0x2601;
const GL_NEAREST_MIPMAP_NEAREST = 0x2700;
const GL_LINEAR_MIPMAP_NEAREST = 0x2701;
const GL_NEAREST_MIPMAP_LINEAR = 0x2702;
const GL_LINEAR_MIPMAP_LINEAR = 0x2703;

const GL_TEXTURE_MAG_FILTER = 0x2800;
const GL_TEXTURE_MIN_FILTER = 0x2801;
const GL_TEXTURE_WRAP_S = 0x2802;
const GL_TEXTURE_WRAP_T = 0x2803;
const GL_TEXTURE_WRAP_R = 0x8072;
const GL_TEXTURE_MIN_LOD = 0x813a;
const GL_TEXTURE_MAX_LOD = 0x813b;
const GL_TEXTURE_COMPARE_MODE = 0x884c;
const GL_TEXTURE_COMPARE_FUNC = 0x884d;

interface SamplerCall {
  pname: number;
  value: number;
}

interface FakeGl {
  readonly gl: WebGL2RenderingContext;
  /** 按 sampler 对象名分组的 `samplerParameteri` 调用。 */
  readonly calls: Map<string, SamplerCall[]>;
  readonly samplerNames: string[];
}

function createFakeGl(): FakeGl {
  const calls = new Map<string, SamplerCall[]>();
  const samplerNames: string[] = [];
  let nextId = 0;
  const named = new WeakMap<object, string>();

  const gl = {
    NEAREST: GL_NEAREST,
    LINEAR: GL_LINEAR,
    TEXTURE_MAG_FILTER: GL_TEXTURE_MAG_FILTER,
    TEXTURE_MIN_FILTER: GL_TEXTURE_MIN_FILTER,
    TEXTURE_WRAP_S: GL_TEXTURE_WRAP_S,
    TEXTURE_WRAP_T: GL_TEXTURE_WRAP_T,
    TEXTURE_WRAP_R: GL_TEXTURE_WRAP_R,
    TEXTURE_MIN_LOD: GL_TEXTURE_MIN_LOD,
    TEXTURE_MAX_LOD: GL_TEXTURE_MAX_LOD,
    TEXTURE_COMPARE_MODE: GL_TEXTURE_COMPARE_MODE,
    TEXTURE_COMPARE_FUNC: GL_TEXTURE_COMPARE_FUNC,
    NONE: 0,
    COMPARE_REF_TO_TEXTURE: 0x884e,
    createSampler: () => {
      const sampler = {};
      const name = `sampler${(nextId += 1)}`;
      named.set(sampler, name);
      samplerNames.push(name);
      calls.set(name, []);
      return sampler;
    },
    deleteSampler: () => {},
    samplerParameteri: (sampler: unknown, pname: number, value: number) => {
      const name = named.get(sampler as object)!;
      calls.get(name)!.push({ pname, value });
    },
    samplerParameterf: () => {},
    getExtension: () => null,
    getParameter: () => 0,
  } as unknown as WebGL2RenderingContext;

  return { gl, calls, samplerNames };
}

interface Harness {
  readonly fake: FakeGl;
  create(
    minFilter: FilterMode,
    mipmapFilter: FilterMode,
    magFilter?: FilterMode,
  ): { sampler: WebGL2Sampler; name: string };
}

function createHarness(): Harness {
  const fake = createFakeGl();
  const state = new GlStateCache(fake.gl);
  return {
    fake,
    create(minFilter, mipmapFilter, magFilter) {
      const before = fake.samplerNames.length;
      const sampler = new WebGL2Sampler(fake.gl, state, {
        label: `sampler-${minFilter}-${mipmapFilter}`,
        minFilter,
        mipmapFilter,
        ...(magFilter ? { magFilter } : {}),
      });
      const name = fake.samplerNames[before]!;
      return { sampler, name };
    },
  };
}

/** 某个 sampler 对象上最后一次 `TEXTURE_MIN_FILTER` 的值。 */
function lastMinFilter(fake: FakeGl, name: string): number {
  const matching = fake.calls.get(name)!.filter((call) => call.pname === GL_TEXTURE_MIN_FILTER);
  expect(matching.length).toBeGreaterThan(0);
  return matching[matching.length - 1]!.value;
}

/** 某个 sampler 对象上 `TEXTURE_MAG_FILTER` 的值。 */
function magFilterOf(fake: FakeGl, name: string): number {
  const matching = fake.calls.get(name)!.filter((call) => call.pname === GL_TEXTURE_MAG_FILTER);
  expect(matching.length).toBe(1);
  return matching[0]!.value;
}

/** 4 种 `(minFilter, mipmapFilter)` 组合在有 mip（`mipLevelCount > 1`）时的期望 GL 枚举。 */
const MIP_TABLE: readonly {
  min: FilterMode;
  mipmap: FilterMode;
  expected: number;
  name: string;
}[] = [
  { min: 'nearest', mipmap: 'nearest', expected: GL_NEAREST_MIPMAP_NEAREST, name: 'NEAREST_MIPMAP_NEAREST' },
  { min: 'nearest', mipmap: 'linear', expected: GL_NEAREST_MIPMAP_LINEAR, name: 'NEAREST_MIPMAP_LINEAR' },
  { min: 'linear', mipmap: 'nearest', expected: GL_LINEAR_MIPMAP_NEAREST, name: 'LINEAR_MIPMAP_NEAREST' },
  { min: 'linear', mipmap: 'linear', expected: GL_LINEAR_MIPMAP_LINEAR, name: 'LINEAR_MIPMAP_LINEAR' },
];

describe('WebGL2Sampler 的 mip 过滤映射', () => {
  it('纯函数映射表：有 mip 时 4 种组合分别落到 4 个 `_MIPMAP_` 枚举', () => {
    for (const row of MIP_TABLE) {
      expect(
        resolveGlMinFilter(row.min, row.mipmap, 4),
        `${row.min}/${row.mipmap} 应映射成 ${row.name}`,
      ).toBe(row.expected);
      // mipLevelCount 只要是 > 1 就与具体级数无关。
      expect(resolveGlMinFilter(row.min, row.mipmap, 12)).toBe(row.expected);
    }
  });

  it('纯函数映射表：只有第 0 级（mipLevelCount <= 1）时退化成不带 mip 的 NEAREST / LINEAR', () => {
    for (const row of MIP_TABLE) {
      expect(resolveGlMinFilter(row.min, row.mipmap, 1)).toBe(row.min === 'linear' ? GL_LINEAR : GL_NEAREST);
      expect(resolveGlMinFilter(row.min, row.mipmap, 0)).toBe(row.min === 'linear' ? GL_LINEAR : GL_NEAREST);
    }
  });

  it('回归：`nearest` + `nearest` 必须是 NEAREST_MIPMAP_NEAREST，不能是不带 mip 的 NEAREST', () => {
    const mapped = resolveGlMinFilter('nearest', 'nearest', 8);
    expect(mapped).toBe(GL_NEAREST_MIPMAP_NEAREST);
    // 修复前这里会得到 0x2600（GL_NEAREST），于是 textureLod(..., 4.0) 静默只取第 0 级。
    expect(mapped).not.toBe(GL_NEAREST);
  });

  it('构造 sampler 时按「假定有 mip」写入 TEXTURE_MIN_FILTER（与 WebGPU 语义一致）', () => {
    const harness = createHarness();
    for (const row of MIP_TABLE) {
      const { sampler, name } = harness.create(row.min, row.mipmap);
      expect(lastMinFilter(harness.fake, name), `${row.min}/${row.mipmap}`).toBe(row.expected);
      // 报告出来的映射值与实际写入 GL 的一致。
      expect(sampler.minFilter).toBe(row.expected);
      // 默认假设是「有 mip」。
      expect(sampler.assumedMipLevelCount).toBe(Number.POSITIVE_INFINITY);
    }
  });

  it('setMipLevelCount(1) 会把 TEXTURE_MIN_FILTER 降级、传 null 再升回来（幂等）', () => {
    const harness = createHarness();
    const { sampler, name } = harness.create('nearest', 'nearest');
    expect(harness.fake.calls.get(name)!.length).toBeGreaterThan(0);

    sampler.setMipLevelCount(1);
    expect(sampler.minFilter).toBe(GL_NEAREST);
    expect(lastMinFilter(harness.fake, name)).toBe(GL_NEAREST);

    // 同一个值再设一次不产生多余 GL 调用。
    const countAfterFirst = harness.fake.calls.get(name)!.length;
    sampler.setMipLevelCount(1);
    expect(harness.fake.calls.get(name)!.length).toBe(countAfterFirst);

    sampler.setMipLevelCount(null);
    expect(sampler.minFilter).toBe(GL_NEAREST_MIPMAP_NEAREST);
    expect(lastMinFilter(harness.fake, name)).toBe(GL_NEAREST_MIPMAP_NEAREST);

    // 传一个大于 1 的级数同样按「有 mip」处理。
    sampler.setMipLevelCount(7);
    expect(sampler.minFilter).toBe(GL_NEAREST_MIPMAP_NEAREST);
  });

  it('magFilter 永远是单级映射（nearest → NEAREST、linear → LINEAR）', () => {
    const harness = createHarness();
    const nearest = harness.create('nearest', 'nearest', 'nearest');
    expect(magFilterOf(harness.fake, nearest.name)).toBe(GL_NEAREST);

    const linear = harness.create('nearest', 'nearest', 'linear');
    expect(magFilterOf(harness.fake, linear.name)).toBe(GL_LINEAR);
  });

  it('非法过滤取值给出带前缀的英文错误（JS 调用方可能塞进带 mip 的名字）', () => {
    const fake = createFakeGl();
    const state = new GlStateCache(fake.gl);
    const make = (descriptor: Record<string, unknown>) =>
      new WebGL2Sampler(fake.gl, state, descriptor as never);

    expect(() => make({ magFilter: 'nearest-mipmap-nearest' })).toThrowError(ValidationError);
    expect(() => make({ magFilter: 'nearest-mipmap-nearest' })).toThrowError(
      /^\[gpu-device-api\] Sampler ".*": magFilter must be "nearest" or "linear"/,
    );
    expect(() => make({ minFilter: 'linear-mipmap-linear' })).toThrowError(/minFilter must be "nearest" or "linear"/);
    expect(() => make({ mipmapFilter: 'bogus' })).toThrowError(/mipmapFilter must be "nearest" or "linear"/);
  });

  it('destroy() 幂等且只通知一次（供设备 untrack）', () => {
    const fake = createFakeGl();
    const state = new GlStateCache(fake.gl);
    let notifications = 0;
    const sampler = new WebGL2Sampler(
      fake.gl,
      state,
      { label: 'sampler-untrack', minFilter: 'nearest', mipmapFilter: 'nearest' },
      () => {
        notifications += 1;
      },
    );

    expect(sampler.disposed).toBe(false);
    sampler.destroy();
    sampler.destroy();
    sampler.dispose();
    expect(sampler.disposed).toBe(true);
    expect(notifications).toBe(1);
  });
});
