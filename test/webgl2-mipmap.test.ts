/**
 * `WebGL2Texture.generateMipmaps()` 的单测。
 *
 * node 环境里没有真的 WebGL2，所以这里用一台**假 GL**：只实现纹理路径真正会碰到的那些方法，
 * 并把调用记下来。要验证的是「有没有把整条 mip 链交给 `gl.generateMipmap`」以及
 * 「做不到的格式/级别组合有没有在进入 GL 之前就被带 [gpu-device-api] 前缀的错误拦下」。
 */

import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { WebGL2Texture } from '../src/webgl2/resources/WebGL2Texture.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import { ValidationError } from '../src/core/errors/index.js';
import type { TextureDescriptor } from '../src/core/resources/Texture.js';

const GL_TEXTURE_2D = 0x0de1;
const GL_NEAREST = 0x2600;
const GL_CLAMP_TO_EDGE = 0x812f;
const GL_TEXTURE_MAG_FILTER = 0x2800;
const GL_TEXTURE_MIN_FILTER = 0x2801;
const GL_TEXTURE_WRAP_S = 0x2802;
const GL_TEXTURE_WRAP_T = 0x2803;
const GL_TEXTURE_WRAP_R = 0x8072;
const GL_TEXTURE_BASE_LEVEL = 0x813c;
const GL_TEXTURE_MAX_LEVEL = 0x813d;

interface FakeGl {
  readonly gl: WebGL2RenderingContext;
  readonly calls: string[];
  /** 让 `getExtension()` 返回给定名字的扩展。 */
  extensions: Set<string>;
}

function createFakeGl(): FakeGl {
  const calls: string[] = [];
  const extensions = new Set<string>();
  const named = new WeakMap<object, string>();
  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (named.get(value) ?? '?') : 'null';
  let textureId = 0;

  const gl = {
    TEXTURE_2D: GL_TEXTURE_2D,
    TEXTURE_3D: 0x806f,
    TEXTURE_2D_ARRAY: 0x8c1a,
    NEAREST: GL_NEAREST,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: GL_CLAMP_TO_EDGE,
    TEXTURE_MAG_FILTER: GL_TEXTURE_MAG_FILTER,
    TEXTURE_MIN_FILTER: GL_TEXTURE_MIN_FILTER,
    TEXTURE_WRAP_S: GL_TEXTURE_WRAP_S,
    TEXTURE_WRAP_T: GL_TEXTURE_WRAP_T,
    TEXTURE_WRAP_R: GL_TEXTURE_WRAP_R,
    TEXTURE_BASE_LEVEL: GL_TEXTURE_BASE_LEVEL,
    TEXTURE_MAX_LEVEL: GL_TEXTURE_MAX_LEVEL,
    TEXTURE0: 0x84c0,
    activeTexture: (unit: number) => calls.push(`activeTexture:${unit - 0x84c0}`),
    createTexture: () => {
      const texture = {};
      named.set(texture, `tex${(textureId += 1)}`);
      calls.push(`createTexture:${nameOf(texture)}`);
      return texture;
    },
    deleteTexture: (texture: unknown) => calls.push(`deleteTexture:${nameOf(texture)}`),
    bindTexture: (target: number, texture: unknown) => calls.push(`bindTexture:${target}:${nameOf(texture)}`),
    texStorage2D: (target: number, levels: number) => calls.push(`texStorage2D:${target}:${levels}`),
    texStorage3D: (target: number, levels: number) => calls.push(`texStorage3D:${target}:${levels}`),
    texStorage2DMultisample: (target: number, samples: number) =>
      calls.push(`texStorage2DMultisample:${target}:${samples}`),
    texParameteri: (target: number, pname: number, value: number) =>
      calls.push(`texParameteri:${target}:${pname}:${value}`),
    generateMipmap: (target: number) => calls.push(`generateMipmap:${target}`),
    getExtension: (name: string) => {
      calls.push(`getExtension:${name}`);
      return extensions.has(name) ? {} : null;
    },
  } as unknown as WebGL2RenderingContext;

  return { gl, calls, extensions };
}

function createTexture(
  fake: FakeGl,
  descriptor: Partial<TextureDescriptor> = {},
): { texture: WebGL2Texture; state: GlStateCache } {
  const state = new GlStateCache(fake.gl);
  const texture = new WebGL2Texture(
    fake.gl,
    state,
    {
      label: 'test',
      size: { width: 8, height: 8 },
      format: 'rgba8unorm',
      mipLevelCount: 4,
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst,
      ...descriptor,
    },
    () => {},
  );
  return { texture, state };
}

describe('WebGL2Texture.generateMipmaps()', () => {
  it('绑一次纹理、调一次 gl.generateMipmap，并作废状态缓存', () => {
    const fake = createFakeGl();
    const { texture, state } = createTexture(fake);
    fake.calls.length = 0;

    texture.generateMipmaps();

    expect(fake.calls).toEqual([
      `bindTexture:${GL_TEXTURE_2D}:tex1`,
      `generateMipmap:${GL_TEXTURE_2D}`,
    ]);

    // 缓存确实被作废了：再绑同一个纹理到同一单元必须重新下发（否则说明缓存与实际状态不一致）。
    fake.calls.length = 0;
    state.bindTexture(0, GL_TEXTURE_2D, texture.native);
    expect(fake.calls).toEqual(['activeTexture:0', `bindTexture:${GL_TEXTURE_2D}:tex1`]);
  });

  it('构造函数已经按 mipLevelCount 设好 TEXTURE_MAX_LEVEL（GL 会据此截断 mip 范围）', () => {
    const fake = createFakeGl();
    createTexture(fake, { mipLevelCount: 4 });
    expect(fake.calls).toContain(`texParameteri:${GL_TEXTURE_2D}:${GL_TEXTURE_MAX_LEVEL}:3`);
    expect(fake.calls).toContain(`texParameteri:${GL_TEXTURE_2D}:${GL_TEXTURE_MIN_FILTER}:${GL_NEAREST}`);
  });

  it('多重采样纹理没有 mip 链，直接报错', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { sampleCount: 4, mipLevelCount: 1 });
    expect(() => texture.generateMipmaps()).toThrowError(ValidationError);
    expect(() => texture.generateMipmaps()).toThrowError(/^\[gpu-device-api\] Texture "test"\.generateMipmaps/);
    expect(() => texture.generateMipmaps()).toThrowError(/multisampled texture/);
  });

  it('mipLevelCount 为 1 时报错，并提示用 fullMipLevelCount 计算', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { mipLevelCount: 1 });
    expect(() => texture.generateMipmaps()).toThrowError(/mipLevelCount is 1/);
    expect(() => texture.generateMipmaps()).toThrowError(/fullMipLevelCount/);
  });

  it('整数格式不能 generateMipmap（不能被过滤）', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { format: 'rgba8uint' });
    expect(() => texture.generateMipmaps()).toThrowError(ValidationError);
    expect(() => texture.generateMipmaps()).toThrowError(/color-renderable and filterable/);
  });

  it('snorm 格式不是 color-renderable', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { format: 'rgba8snorm' });
    expect(() => texture.generateMipmaps()).toThrowError(/color-renderable and filterable/);
  });

  it('纯深度格式没有可过滤的颜色通道', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { format: 'depth32float', mipLevelCount: 4 });
    expect(() => texture.generateMipmaps()).toThrowError(/color-renderable and filterable/);
  });

  it('32 位浮点格式需要 EXT_color_buffer_float', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { format: 'rgba32float' });
    expect(() => texture.generateMipmaps()).toThrowError(/EXT_color_buffer_float/);

    fake.extensions.add('EXT_color_buffer_float');
    fake.calls.length = 0;
    texture.generateMipmaps();
    expect(fake.calls).toContain(`generateMipmap:${GL_TEXTURE_2D}`);
  });

  it('srgb 格式走的是同一套内部格式，颜色空间由 GL 在滤波时处理', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake, { format: 'rgba8unorm-srgb' });
    texture.generateMipmaps();
    expect(fake.calls).toContain(`generateMipmap:${GL_TEXTURE_2D}`);
  });

  it('纹理销毁后再生成 mip 会报错', () => {
    const fake = createFakeGl();
    const { texture } = createTexture(fake);
    texture.destroy();
    expect(() => texture.generateMipmaps()).toThrowError(/has been destroyed/);
  });
});
