import { describe, expect, it } from 'vitest';

import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';

/**
 * `GlStateCache.invalidateTextureUnits()` 是「纹理上传/拷贝之后只作废纹理单元缓存」用的。
 *
 * 这些用例锁住的正是它存在的理由：程序 / 采样器 / uniform buffer / VAO 的缓存必须留下来，
 * 否则每帧一次纹理上传就会让下一次 draw 把所有固定功能状态重下一遍（那正是被优化掉的 CPU 开销）。
 */

interface FakeGl {
  gl: WebGL2RenderingContext;
  calls: string[];
  make<T>(name: string): T;
}

function createFakeGl(): FakeGl {
  const calls: string[] = [];
  const names = new WeakMap<object, string>();
  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (names.get(value) ?? '?') : 'null';

  const gl = {
    TEXTURE0: 0,
    TEXTURE_2D: 0x0de1,
    BLEND: 0x0be2,
    UNIFORM_BUFFER: 0x8a11,
    activeTexture: (unit: number) => calls.push(`activeTexture:${unit}`),
    bindTexture: (target: number, texture: unknown) => calls.push(`bindTexture:${target}:${nameOf(texture)}`),
    bindSampler: (unit: number, sampler: unknown) => calls.push(`bindSampler:${unit}:${nameOf(sampler)}`),
    useProgram: (program: unknown) => calls.push(`useProgram:${nameOf(program)}`),
    bindVertexArray: (vao: unknown) => calls.push(`bindVertexArray:${nameOf(vao)}`),
    bindBufferBase: (_target: number, index: number, buffer: unknown) =>
      calls.push(`bindBufferBase:${index}:${nameOf(buffer)}`),
  } as unknown as WebGL2RenderingContext;

  return {
    gl,
    calls,
    make<T>(name: string): T {
      const value = {} as unknown as T;
      names.set(value as unknown as object, name);
      return value;
    },
  };
}

describe('GlStateCache.invalidateTextureUnits()', () => {
  it('只让「当前活动单元」的纹理绑定失效，其它缓存全部保留', () => {
    const { gl, calls, make } = createFakeGl();
    const state = new GlStateCache(gl);

    const textureA = make<WebGLTexture>('texA');
    const textureB = make<WebGLTexture>('texB');
    const program = make<WebGLProgram>('program');
    const sampler = make<WebGLSampler>('sampler');
    const uniformBuffer = make<WebGLBuffer>('ubo');
    const vertexArray = make<WebGLVertexArrayObject>('vao');

    state.bindTexture(0, gl.TEXTURE_2D, textureA);
    // 最后一个绑定的单元就是「当前活动单元」，绕过缓存的 gl.bindTexture 动的正是它。
    state.bindTexture(1, gl.TEXTURE_2D, textureB);
    state.useProgram(program);
    state.bindSampler(1, sampler);
    state.bindUniformBuffer(0, uniformBuffer);
    state.bindVertexArray(vertexArray);

    calls.length = 0;
    state.invalidateTextureUnits();

    // 活动单元 1 的记录被丢掉 → 需要重下发；单元 0 的记录还在 → 绑定被跳过。
    state.bindTexture(1, gl.TEXTURE_2D, textureB);
    state.bindTexture(0, gl.TEXTURE_2D, textureA);
    // 下面这些都不该产生任何 GL 调用（它们没有被动过）。
    state.useProgram(program);
    state.bindSampler(1, sampler);
    state.bindUniformBuffer(0, uniformBuffer);
    state.bindVertexArray(vertexArray);

    expect(calls).toEqual([`bindTexture:${gl.TEXTURE_2D}:texB`, 'activeTexture:0']);
  });

  it('整体 invalidate() 则会把它们全部丢掉（对比：这正是要避免的代价）', () => {
    const { gl, calls, make } = createFakeGl();
    const state = new GlStateCache(gl);

    const texture = make<WebGLTexture>('tex');
    const program = make<WebGLProgram>('program');
    const vertexArray = make<WebGLVertexArrayObject>('vao');

    state.bindTexture(0, gl.TEXTURE_2D, texture);
    state.useProgram(program);
    state.bindVertexArray(vertexArray);

    calls.length = 0;
    state.invalidate();
    state.bindTexture(0, gl.TEXTURE_2D, texture);
    state.useProgram(program);
    state.bindVertexArray(vertexArray);

    expect(calls).toEqual([
      'activeTexture:0',
      `bindTexture:${gl.TEXTURE_2D}:tex`,
      'useProgram:program',
      'bindVertexArray:vao',
    ]);
  });
});
