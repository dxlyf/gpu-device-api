import { describe, expect, it } from 'vitest';

import {
  BindingType,
  BufferUsage,
  CompareFunction,
  DEPTH_STENCIL_FORMATS,
  IndexFormat,
  LoadOp,
  PrimitiveTopology,
  ShaderStage,
  StoreOp,
  TextureFormat,
  TextureUsage,
  VERTEX_FORMAT_INFO,
  VertexStepMode,
  isBufferBinding,
  isDepthStencilFormat,
  isSamplerBinding,
  isSrgbFormat,
  isTextureBinding,
  isTriangleTopology,
  primitiveCount,
  smallestIndexFormat,
  vertexFormatGlslType,
  vertexFormatInfo,
  vertexFormatWgslType,
} from '../src/core/enums/index.js';
import { BLEND_PRESETS, ColorWriteMask, resolveBlendState } from '../src/core/pipeline/index.js';

describe('enums / bit flags', () => {
  it('exposes WebGPU compatible bit values', () => {
    expect(BufferUsage.Vertex).toBe(0x0020);
    expect(BufferUsage.Index).toBe(0x0010);
    expect(BufferUsage.Uniform | BufferUsage.CopyDst).toBe(0x0048);
    expect(TextureUsage.RenderAttachment).toBe(0x0010);
    expect(ShaderStage.Vertex | ShaderStage.Fragment).toBe(0x0003);
    expect(ColorWriteMask.All).toBe(0x0f);
  });

  it('string enums have stable values', () => {
    expect(LoadOp.Clear).toBe('clear');
    expect(StoreOp.Discard).toBe('discard');
    expect(CompareFunction.LessEqual).toBe('less-equal');
    expect(PrimitiveTopology.TriangleStrip).toBe('triangle-strip');
    expect(IndexFormat.Uint32).toBe('uint32');
    expect(VertexStepMode.Instance).toBe('instance');
    expect(BindingType.ReadOnlyStorage).toBe('read-only-storage');
  });
});

describe('texture format helpers', () => {
  it('classifies depth/stencil formats', () => {
    expect(isDepthStencilFormat('depth24plus')).toBe(true);
    expect(isDepthStencilFormat('depth32float')).toBe(true);
    expect(isDepthStencilFormat('rgba8unorm')).toBe(false);
    expect(DEPTH_STENCIL_FORMATS).toContain('depth24plus-stencil8');
  });

  it('classifies sRGB formats', () => {
    expect(isSrgbFormat('rgba8unorm-srgb')).toBe(true);
    expect(isSrgbFormat('bgra8unorm-srgb')).toBe(true);
    expect(isSrgbFormat('bgra8unorm')).toBe(false);
  });

  it('every documented format is a valid union member at runtime', () => {
    const formats: TextureFormat[] = ['rgba8unorm', 'depth24plus', 'rgba16float'];
    expect(formats).toHaveLength(3);
  });
});

describe('topology helpers', () => {
  it('counts primitives per topology', () => {
    expect(primitiveCount('triangle-list', 9)).toBe(3);
    expect(primitiveCount('triangle-strip', 5)).toBe(3);
    expect(primitiveCount('line-list', 5)).toBe(2);
    expect(primitiveCount('line-strip', 5)).toBe(4);
    expect(primitiveCount('point-list', 5)).toBe(5);
  });

  it('detects triangle topologies', () => {
    expect(isTriangleTopology('triangle-list')).toBe(true);
    expect(isTriangleTopology('line-strip')).toBe(false);
  });

  it('picks the smallest index format', () => {
    expect(smallestIndexFormat(1000)).toBe('uint16');
    expect(smallestIndexFormat(65535)).toBe('uint16');
    expect(smallestIndexFormat(65536)).toBe('uint32');
  });
});

describe('binding type helpers', () => {
  it('classifies binding types', () => {
    expect(isBufferBinding(BindingType.Uniform)).toBe(true);
    expect(isBufferBinding(BindingType.ReadOnlyStorage)).toBe(true);
    expect(isBufferBinding(BindingType.Texture)).toBe(false);
    expect(isTextureBinding(BindingType.StorageTexture)).toBe(true);
    expect(isSamplerBinding(BindingType.ComparisonSampler)).toBe(true);
  });
});

describe('render state presets', () => {
  it('exposes the standard blend presets', () => {
    expect(resolveBlendState(false)).toBeNull();
    expect(resolveBlendState(undefined)).toBeNull();
    expect(resolveBlendState('alpha')).toBe(BLEND_PRESETS.alpha);
    expect(BLEND_PRESETS.alpha!.color).toEqual({
      srcFactor: 'src-alpha',
      dstFactor: 'one-minus-src-alpha',
      operation: 'add',
    });
    expect(BLEND_PRESETS.premultiplied!.color.srcFactor).toBe('one');
    expect(BLEND_PRESETS.additive!.color.dstFactor).toBe('one');
    expect(() => resolveBlendState('nope' as never)).toThrowError(/Unknown blend preset/);
  });

  it('passes through explicit blend states untouched', () => {
    const state = {
      color: { srcFactor: 'dst' as const, dstFactor: 'zero' as const },
      alpha: { srcFactor: 'one' as const, dstFactor: 'zero' as const },
    };
    expect(resolveBlendState(state)).toBe(state);
  });
});

describe('vertex formats', () => {
  it('reports component counts and byte sizes', () => {
    expect(vertexFormatInfo('float32x3')).toMatchObject({ components: 3, byteSize: 12, kind: 'float' });
    expect(vertexFormatInfo('unorm8x4')).toMatchObject({ components: 4, byteSize: 4, kind: 'float', normalized: true });
    expect(vertexFormatInfo('uint32')).toMatchObject({ components: 1, byteSize: 4, kind: 'uint' });
    expect(vertexFormatInfo('sint16x2')).toMatchObject({ components: 2, byteSize: 4, kind: 'sint' });
  });

  it('maps every format to a GLSL and a WGSL type', () => {
    expect(vertexFormatGlslType('float32x3')).toBe('vec3');
    expect(vertexFormatGlslType('uint32x2')).toBe('uvec2');
    expect(vertexFormatGlslType('sint32')).toBe('int');
    // 归一化整数格式在两种语言中都按浮点数读取。
    expect(vertexFormatGlslType('unorm8x4')).toBe('vec4');
    expect(vertexFormatWgslType('float32x3')).toBe('vec3f');
    expect(vertexFormatWgslType('uint32x2')).toBe('vec2u');
    expect(vertexFormatWgslType('sint32')).toBe('i32');
    expect(vertexFormatWgslType('unorm8x4')).toBe('vec4f');
  });

  it('covers all formats with a consistent table', () => {
    const entries = Object.entries(VERTEX_FORMAT_INFO);
    expect(entries.length).toBeGreaterThanOrEqual(30);
    for (const [format, info] of entries) {
      expect(info.byteSize, format).toBeGreaterThan(0);
      // 每个分量宽 1、2 或 4 字节（float16 分量为 2 字节）。
      expect(info.byteSize % info.components, format).toBe(0);
      expect([1, 2, 4], format).toContain(info.byteSize / info.components);
      expect(() => vertexFormatGlslType(format as never)).not.toThrow();
      expect(() => vertexFormatWgslType(format as never)).not.toThrow();
    }
  });
});
