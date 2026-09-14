import { describe, expect, it } from 'vitest';

import {
  GLSL_PREAMBLE,
  compileShaderStage,
  formatShaderErrorLog,
  glslDefines,
  registerShader,
  registerShaders,
  clearShaders,
  hasShader,
  listShaderKeys,
  requireShader,
  unregisterShader,
  wgslDefines,
  wrapGlslSource,
  wrapWgslSource,
  describeShaderSource,
  languageForBackend,
  stageSource,
} from '../src/shaders/index.js';
import {
  reflectWgslBindings,
  reflectWgslEntryPoints,
  findWgslEntryPoint,
  stripWgslComments,
} from '../src/shaders/reflection/WGSLReflector.js';
import { ValidationError } from '../src/core/errors/index.js';
import { ShaderStage } from '../src/core/enums/ShaderStage.js';

const SAMPLE_WGSL = `
struct Uniforms { projection: mat4x4f, color: vec4f }
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(1) @binding(0) var albedo: texture_2d<f32>;
@group(1) @binding(1) var albedo_sampler: sampler;
@group(1) @binding(2) var shadowMap: texture_depth_2d;
@group(1) @binding(3) var shadowSampler: sampler_comparison;
@group(0) @binding(4) var<storage, read> instances: array<mat4x4f>;
@group(0) @binding(5) var<storage, read_write> counters: array<u32>;
@group(2) @binding(0) var msaa: texture_multisampled_2d<f32>;
@group(2) @binding(1) var storageImage: texture_storage_2d<rgba8unorm, write>;

struct VertexOutput { @builtin(position) position: vec4f, @location(0) uv: vec2f }

@vertex fn vsMain(@location(0) position: vec3f) -> VertexOutput {
  var out: VertexOutput;
  out.position = u.projection * vec4f(position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return textureSample(albedo, albedo_sampler, in.uv) * u.color;
}

@compute @workgroup_size(8, 4, 1)
fn csMain(@builtin(global_invocation_id) id: vec3u) {
  counters[id.x] = 1u;
}
`;

describe('WGSL 反射：资源绑定', () => {
  it('解析出全部 @group/@binding 资源', () => {
    const bindings = reflectWgslBindings(SAMPLE_WGSL);
    expect(bindings).toHaveLength(9);

    const byKey = new Map(bindings.map((b) => [`${b.group}:${b.binding}`, b]));
    expect(byKey.get('0:0')).toMatchObject({
      name: 'u',
      addressSpace: 'uniform',
      kind: 'uniform-buffer',
      type: 'Uniforms',
    });
    expect(byKey.get('1:0')).toMatchObject({ name: 'albedo', kind: 'texture', depth: false });
    expect(byKey.get('1:1')).toMatchObject({ name: 'albedo_sampler', kind: 'sampler' });
    expect(byKey.get('1:2')).toMatchObject({ kind: 'texture', depth: true });
    expect(byKey.get('1:3')).toMatchObject({ kind: 'comparison-sampler' });
    expect(byKey.get('0:4')).toMatchObject({
      kind: 'storage-buffer',
      access: 'read',
      type: 'array<mat4x4f>',
    });
    expect(byKey.get('0:5')).toMatchObject({ kind: 'storage-buffer', access: 'read_write' });
    expect(byKey.get('2:0')).toMatchObject({ kind: 'texture', multisampled: true });
    expect(byKey.get('2:1')).toMatchObject({ kind: 'storage-texture' });
  });

  it('结果按 group、binding 排序', () => {
    const bindings = reflectWgslBindings(SAMPLE_WGSL);
    for (let i = 1; i < bindings.length; i++) {
      const previous = bindings[i - 1]!;
      const current = bindings[i]!;
      expect(previous.group < current.group || (previous.group === current.group && previous.binding < current.binding)).toBe(true);
    }
  });

  it('识别 @binding 写在 @group 前面的顺序', () => {
    const source = `
      @binding(3) @group(1) var tex: texture_2d<f32>;
      @binding(4) @group(1) var texSampler: sampler;
    `;
    const bindings = reflectWgslBindings(source);
    expect(bindings).toHaveLength(2);
    expect(bindings[0]).toMatchObject({ group: 1, binding: 3, name: 'tex', kind: 'texture' });
    expect(bindings[1]).toMatchObject({ group: 1, binding: 4, kind: 'sampler' });
  });

  it('忽略注释里的绑定声明，避免被注释掉的代码影响校验', () => {
    const source = `
      // @group(0) @binding(0) var<uniform> removed: Uniforms;
      /* @group(0) @binding(1) var gone: texture_2d<f32>; */
      @group(0) @binding(2) var<uniform> kept: Uniforms;
    `;
    const bindings = reflectWgslBindings(source);
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({ binding: 2, name: 'kept' });
    expect(stripWgslComments('a // b\nc')).not.toContain('b');
  });

  it('同一个 (group, binding) 重复声明时只保留第一次', () => {
    const source = `
      @group(0) @binding(0) var<uniform> first: Uniforms;
      @group(0) @binding(0) var<uniform> second: Uniforms;
    `;
    const bindings = reflectWgslBindings(source);
    expect(bindings).toHaveLength(1);
    expect(bindings[0]!.name).toBe('first');
  });
});

describe('WGSL 反射：entry point', () => {
  it('解析三种阶段的入口，并取出 workgroup_size', () => {
    const entryPoints = reflectWgslEntryPoints(SAMPLE_WGSL);
    expect(entryPoints).toHaveLength(3);
    expect(entryPoints.find((e) => e.stage === 'vertex')).toMatchObject({ name: 'vsMain', workgroupSize: null });
    expect(entryPoints.find((e) => e.stage === 'fragment')).toMatchObject({ name: 'fsMain' });
    expect(entryPoints.find((e) => e.stage === 'compute')).toMatchObject({
      name: 'csMain',
      workgroupSize: [8, 4, 1],
    });
  });

  it('compute 缺省 workgroup_size 时按 1,1,1 处理', () => {
    const source = '@compute fn cs() { }';
    expect(reflectWgslEntryPoints(source)[0]).toMatchObject({ workgroupSize: [1, 1, 1] });
  });

  it('findWgslEntryPoint 按阶段与名字精确查找', () => {
    expect(findWgslEntryPoint(SAMPLE_WGSL, 'vertex', 'vsMain')?.stage).toBe('vertex');
    // 同名但阶段不同不应命中。
    expect(findWgslEntryPoint(SAMPLE_WGSL, 'compute', 'vsMain')).toBeUndefined();
    expect(findWgslEntryPoint(SAMPLE_WGSL, 'fragment', 'nope')).toBeUndefined();
  });
});

describe('GLSL 源码包装', () => {
  it('补上 #version 300 es 与默认精度', () => {
    const code = wrapGlslSource('void main() { gl_Position = vec4(0.0); }', undefined, 'test');
    expect(code.startsWith(GLSL_PREAMBLE)).toBe(true);
    expect(code).toContain('void main()');
    expect(code.match(/#version/g)).toHaveLength(1);
  });

  it('剥离用户自己写的 #version 300 es，只保留一个', () => {
    const code = wrapGlslSource('#version 300 es\nvoid main() {}', undefined, 'test');
    expect(code.match(/#version/g)).toHaveLength(1);
    expect(code.indexOf('#version 300 es')).toBe(0);
  });

  it('用户写的是 100 之类的旧版本时直接报错，而不是静默替换', () => {
    expect(() => wrapGlslSource('#version 100\nvoid main() {}', undefined, 'legacy')).toThrowError(
      ValidationError,
    );
    expect(() => wrapGlslSource('#version 100\nvoid main() {}', undefined, 'legacy')).toThrowError(
      /只接受 GLSL ES 3\.00/,
    );
    // 带 es 后缀的 300 是允许的
    expect(() => wrapGlslSource('#version 300 es\nvoid main() {}', undefined, 'ok')).not.toThrow();
  });

  it('defines 渲染成 #define，布尔值用 1/0', () => {
    expect(glslDefines({ HAS_UV: true, MODE: 2, NOPE: false })).toBe(
      '#define HAS_UV 1\n#define MODE 2\n#define NOPE 0',
    );
    const code = wrapGlslSource('void main() {}', { HAS_UV: true }, 'test');
    expect(code).toContain('#define HAS_UV 1');
    // define 必须在 precision 之前、#version 之后
    expect(code.indexOf('#version 300 es')).toBeLessThan(code.indexOf('#define HAS_UV'));
  });

  it('WGSL 侧 defines 渲染成顶层 const，并按数值推断类型', () => {
    expect(wgslDefines({ COUNT: 4, SCALE: 0.5, FLAG: true })).toBe(
      'const COUNT: i32 = 4;\nconst SCALE: f32 = 0.5;\nconst FLAG: bool = true;',
    );
    const code = wrapWgslSource('@fragment fn fs() -> @location(0) vec4f { return vec4f(0.0); }', { COUNT: 4 });
    expect(code.startsWith('const COUNT: i32 = 4;')).toBe(true);
  });
});

describe('GLSL 包装开关（默认全开）', () => {
  const BODY = '#version 300 es\nprecision mediump float;\nvoid main() {}';

  it('默认：替换 #version 并拼接前言', () => {
    const code = wrapGlslSource('void main() {}', undefined, 'test', {});
    expect(code.startsWith(GLSL_PREAMBLE)).toBe(true);

    // 四项都是默认值时，输出与不传 options 完全一致
    expect(wrapGlslSource('void main() {}', undefined, 'test')).toBe(code);
    expect(wrapGlslSource(BODY, undefined, 'test', { version: true, preamble: true })).toBe(
      wrapGlslSource(BODY, undefined, 'test'),
    );
  });

  it('preamble: false：只注入 #version，不加精度前言', () => {
    const code = wrapGlslSource('void main() {}', undefined, 'test', { preamble: false });
    expect(code.startsWith('#version 300 es\n')).toBe(true);
    expect(code).not.toContain('precision highp float;');
    expect(code).toContain('void main() {}');
  });

  it('preamble 传字符串：用自定义前言替换默认前言', () => {
    const code = wrapGlslSource('void main() {}', undefined, 'test', { preamble: 'precision mediump float;\n' });
    expect(code).toBe('#version 300 es\nprecision mediump float;\nvoid main() {}\n');
    expect(code).not.toContain('precision highp int;');
  });

  it('version: false：原样保留用户写的 #version，且前言排在它后面', () => {
    const code = wrapGlslSource(BODY, undefined, 'test', { version: false });
    expect(code.match(/#version/g)).toHaveLength(1); // 不会被注入第二个
    expect(code.indexOf('#version 300 es')).toBe(0);
    expect(code.indexOf('precision highp float;')).toBeGreaterThan(code.indexOf('#version 300 es'));
    expect(code).toContain('void main() {}');
  });

  it('version: false 时不校验版本号（交给后端编译报错）', () => {
    const code = wrapGlslSource('#version 310 es\nvoid main() {}', undefined, 'test', { version: false });
    expect(code.startsWith('#version 310 es\n')).toBe(true);
    // 同样的源码在默认（自动替换）下仍然直接报错
    expect(() => wrapGlslSource('#version 310 es\nvoid main() {}', undefined, 'test')).toThrowError(
      /只接受 GLSL ES 3\.00/,
    );
  });

  it('version: false 且没有 #version 时，不会凭空注入一行', () => {
    const code = wrapGlslSource('void main() {}', undefined, 'test', { version: false });
    expect(code).not.toContain('#version');
    expect(code.startsWith('precision highp float;')).toBe(true);
  });

  it('两项都关掉：逐字节透传（连首尾空白都不动）', () => {
    expect(wrapGlslSource(BODY, undefined, 'test', { version: false, preamble: false })).toBe(BODY);
    const messy = '\n\n// 注释\nvoid main() {}\n\n';
    expect(wrapGlslSource(messy, undefined, 'test', { version: false, preamble: false })).toBe(messy);
  });

  it('两项都关掉但给了 defines：仍然注入宏，且排在 #version 之后', () => {
    const code = wrapGlslSource(BODY, { HAS_UV: true }, 'test', { version: false, preamble: false });
    expect(code.startsWith('#version 300 es\n')).toBe(true);
    expect(code).toContain('#define HAS_UV 1');
    expect(code.indexOf('#define HAS_UV')).toBeGreaterThan(code.indexOf('#version 300 es'));
    expect(code).not.toContain('precision highp float;');
  });

  it('version: false + preamble: false 的组合不会漏掉用户的 precision 行（源码原样）', () => {
    const code = wrapGlslSource(BODY, undefined, 'test', { version: false, preamble: false });
    expect(code).toBe(BODY);
    expect(code).toContain('precision mediump float;');
  });
});

describe('着色器编译调度', () => {
  const source = {
    vs: 'void main() { gl_Position = vec4(0.0); }',
    fs: 'void main() { fragColor = vec4(1.0); }',
    wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
  };

  it('WebGL2 取 GLSL，WebGPU 取 WGSL', () => {
    expect(languageForBackend('webgl2')).toBe('glsl');
    expect(languageForBackend('webgpu')).toBe('wgsl');

    const vertex = compileShaderStage({ backend: 'webgl2', source, stage: ShaderStage.Vertex, label: 'm' });
    expect(vertex.language).toBe('glsl');
    expect(vertex.code).toContain('gl_Position');

    const fragment = compileShaderStage({ backend: 'webgpu', source, stage: ShaderStage.Fragment, label: 'm' });
    expect(fragment.language).toBe('wgsl');
    expect(fragment.code).toContain('@fragment');
  });

  it('stageSource 按语言与阶段取源码', () => {
    expect(stageSource(source, 'glsl', ShaderStage.Vertex)).toBe(source.vs);
    expect(stageSource(source, 'glsl', ShaderStage.Fragment)).toBe(source.fs);
    expect(stageSource(source, 'wgsl', ShaderStage.Vertex)).toBe(source.wgsl);
    expect(stageSource({ wgsl: 'x' }, 'glsl', ShaderStage.Vertex)).toBeUndefined();
  });

  it('缺少对应语言源码时报错，并说清缺什么、现有什么', () => {
    const wgslOnly = { wgsl: '@vertex fn vsMain() {}' };
    expect(() =>
      compileShaderStage({ backend: 'webgl2', source: wgslOnly, stage: ShaderStage.Vertex, label: '材质A' }),
    ).toThrowError(/材质A/);
    try {
      compileShaderStage({ backend: 'webgl2', source: wgslOnly, stage: ShaderStage.Vertex, label: '材质A' });
      expect.unreachable('应当抛出');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('缺少 webgl2 后端需要的 vertex 阶段源码');
      expect(message).toContain('当前提供的源码：wgsl');
      expect(message).toContain('WebGPU 后端使用的语言与之不同');
    }
  });

  it('describeShaderSource 列出已提供的内容', () => {
    expect(describeShaderSource({})).toBe('空');
    expect(describeShaderSource(source)).toContain('vs（GLSL）');
    expect(describeShaderSource({ wgsl: 'x' })).toBe('wgsl');
  });

  it('glsl 包装开关会传到 GLSL 侧，并如实反映在 hasPreamble 上', () => {
    const raw = compileShaderStage({ backend: 'webgl2', source, stage: ShaderStage.Vertex, label: 'm' });
    expect(raw.hasPreamble).toBe(true);
    expect(raw.code.startsWith(GLSL_PREAMBLE)).toBe(true);

    const bare = compileShaderStage({
      backend: 'webgl2',
      source,
      stage: ShaderStage.Vertex,
      label: 'm',
      glsl: { version: false, preamble: false },
    });
    expect(bare.hasPreamble).toBe(false);
    expect(bare.code).toBe(source.vs); // 逐字节透传

    // WGSL 没有前言可言
    const wgsl = compileShaderStage({ backend: 'webgpu', source, stage: ShaderStage.Fragment, label: 'm' });
    expect(wgsl.hasPreamble).toBe(false);
  });
});

describe('着色器错误日志格式化', () => {
  it('抽出出错行并贴出上下文', () => {
    const code = ['#version 300 es', 'precision highp float;', 'void main() {', '  float x = y;', '}'].join('\n');
    const log = "ERROR: 0:4: 'y' : undeclared identifier";
    const formatted = formatShaderErrorLog(log, code, '材质A');
    expect(formatted).toContain('材质A');
    expect(formatted).toContain('undeclared identifier');
    expect(formatted).toContain('第 4 行附近');
    expect(formatted).toContain('4 |   float x = y;');
  });

  it('日志里没有行号时打印完整源码', () => {
    const formatted = formatShaderErrorLog('编译失败', 'void main() {}', 'm');
    expect(formatted).toContain('完整源码');
    expect(formatted).toContain('1 | void main() {}');
  });
});

describe('着色器注册表', () => {
  it('登记、查询、报错、清空', () => {
    clearShaders();
    expect(hasShader('a')).toBe(false);
    registerShader('a', { vs: 'v', fs: 'f' });
    expect(hasShader('a')).toBe(true);
    expect(requireShader('a').vs).toBe('v');
    expect(listShaderKeys()).toEqual(['a']);
    expect(unregisterShader('a')).toBe(true);
    expect(hasShader('a')).toBe(false);
  });

  it('重复 key 直接报错，不做静默覆盖', () => {
    clearShaders();
    registerShader('dup', { wgsl: 'x' });
    expect(() => registerShader('dup', { wgsl: 'y' })).toThrowError(/已经注册过/);
    expect(requireShader('dup').wgsl).toBe('x');
  });

  it('requireShader 找不到时列出已注册的 key', () => {
    clearShaders();
    registerShaders({ one: { wgsl: '1' }, two: { wgsl: '2' } });
    try {
      requireShader('three');
      expect.unreachable('应当抛出');
    } catch (error) {
      expect((error as Error).message).toContain('找不到 key 为「three」的着色器');
      expect((error as Error).message).toContain('one、two');
    }
    clearShaders();
  });
});
