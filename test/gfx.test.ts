import { describe, expect, it, vi } from 'vitest';

import {
  createUniforms,
  defineUniforms,
  UniformLayout,
} from '../src/gfx/Uniforms.js';
import { defineMaterial, type MaterialDesc } from '../src/gfx/Material.js';
import { Geometry, STANDARD_ATTRIBUTE_FORMATS } from '../src/gfx/Geometry.js';
import { ValidationError } from '../src/core/errors/index.js';
import type { Device } from '../src/core/Device.js';
import type { Buffer, BufferDescriptor } from '../src/core/resources/Buffer.js';

/* ------------------------------------------------------------------------------------------------ */
/* 一个最小的假 device：只实现 Geometry 用到的 createBuffer + queue.writeBuffer                       */
/* ------------------------------------------------------------------------------------------------ */

interface FakeWrite {
  buffer: string;
  offset: number;
  bytes: Uint8Array;
}

function createFakeDevice(): { device: Device; writes: FakeWrite[]; buffers: Map<string, number> } {
  const writes: FakeWrite[] = [];
  const buffers = new Map<string, number>();
  let counter = 0;

  const device = {
    createBuffer(descriptor: BufferDescriptor): Buffer {
      const label = descriptor.label ?? `buffer#${counter++}`;
      buffers.set(label, descriptor.size);
      const buffer = {
        label,
        size: descriptor.size,
        usage: descriptor.usage,
        native: null,
        disposed: false,
        mapped: false,
        mapAsync: async () => new ArrayBuffer(descriptor.size),
        getMappedRange: () => new ArrayBuffer(descriptor.size),
        unmap: () => {},
        destroy: () => {},
        dispose: () => {},
      } as unknown as Buffer;
      return buffer;
    },
    // 下面三个只是为了能让 Material.createPipelineDescriptor() 跑通，逻辑不参与断言。
    createShaderModule: (descriptor: { label?: string }) => ({
      label: descriptor.label ?? 'shader',
      source: {},
      defines: {},
      disposed: false,
      dispose: () => {},
    }),
    createBindGroupLayout: (descriptor: { label?: string; entries: unknown[] }) => ({
      label: descriptor.label ?? 'bgl',
      entries: descriptor.entries,
      sortedEntries: descriptor.entries,
      native: null,
      disposed: false,
      entry: () => undefined,
      dispose: () => {},
    }),
    createPipelineLayout: (descriptor: { label?: string; bindGroupLayouts: unknown[] }) => ({
      label: descriptor.label ?? 'pl',
      bindGroupLayouts: descriptor.bindGroupLayouts,
      native: null,
      isAuto: false,
      disposed: false,
      dispose: () => {},
    }),
    queue: {
      writeBuffer(buffer: Buffer, offset: number, data: ArrayBufferView): void {
        writes.push({
          buffer: buffer.label,
          offset,
          bytes: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
        });
      },
    },
  } as unknown as Device;

  return { device, writes, buffers };
}

/* ------------------------------------------------------------------------------------------------ */

describe('UniformLayout 字节布局', () => {
  it('按 std140 与 WGSL uniform 的交集排布', () => {
    const layout = defineUniforms({
      model: 'mat4x4f',
      lightDirection: 'vec3f',
      time: 'f32',
      color: 'vec4f',
      scale: 'vec2f',
    });
    const byName = new Map(layout.fields.map((field) => [field.name, field]));

    expect(byName.get('model')!.byteOffset).toBe(0);
    expect(byName.get('model')!.byteSize).toBe(64);
    // vec3 对齐 16：紧接 mat4 之后正好落在 64。
    expect(byName.get('lightDirection')!.byteOffset).toBe(64);
    expect(byName.get('lightDirection')!.byteSize).toBe(12);
    // f32 对齐 4，可以塞进 vec3 尾部剩下的 4 字节空洞里。
    expect(byName.get('time')!.byteOffset).toBe(76);
    // vec4 对齐 16，所以从 80 开始（跳过了 80 之前的 0 字节）。
    expect(byName.get('color')!.byteOffset).toBe(80);
    // vec2 对齐 8，从 96 开始。
    expect(byName.get('scale')!.byteOffset).toBe(96);
    // 总大小取整到 16 的倍数。
    expect(layout.byteLength).toBe(112);
  });

  it('数组元素步长取整到 16 的倍数', () => {
    const layout = defineUniforms({ bones: 'mat4x4f[8]', weights: 'vec3f[4]', flags: 'f32[4]' });
    const byName = new Map(layout.fields.map((field) => [field.name, field]));

    expect(byName.get('bones')!.byteStride).toBe(64);
    expect(byName.get('bones')!.byteOffset).toBe(0);
    expect(layout.fields[1]!.byteOffset).toBe(512);
    // vec3f[4] 的每个元素占 12 字节但步长是 16。
    expect(byName.get('weights')!.byteStride).toBe(16);
    expect(byName.get('weights')!.packed).toBe(false);
    // f32[4] 同样：步长 16 而不是 4。
    expect(byName.get('flags')!.byteStride).toBe(16);
    expect(byName.get('flags')!.packed).toBe(false);
  });

  it('mat3x3f 每列补齐到 16 字节，因此不是紧凑内存', () => {
    const layout = defineUniforms({ normalMatrix: 'mat3x3f' });
    const field = layout.fields[0]!;
    expect(field.info.columnStride).toBe(16);
    expect(field.info.columnSize).toBe(12);
    expect(field.byteSize).toBe(48);
    expect(field.packed).toBe(false);
  });

  it('拒绝 std140 与 WGSL 规则不一致的类型，并给出替代方案', () => {
    expect(() => defineUniforms({ bad: 'mat2x2f' } as never)).toThrowError(ValidationError);
    expect(() => defineUniforms({ bad: 'mat2x2f' } as never)).toThrowError(/mat4x4f/);
    expect(() => defineUniforms({ bad: 'mat3x3f[4]' } as never)).toThrowError(/mat4x4f\[4\]/);
    expect(() => defineUniforms({ bad: 'vec5f' } as never)).toThrowError(/不支持的 uniform 类型/);
  });

  it('拒绝非法字段名与 WGSL 保留字', () => {
    expect(() => defineUniforms({ '1bad': 'f32' })).toThrowError(/不是合法标识符/);
    expect(() => defineUniforms({ struct: 'f32' })).toThrowError(/WGSL 保留字/);
    expect(() => defineUniforms({})).toThrowError(/至少要有一个字段/);
  });

  it('相同描述复用同一个布局实例', () => {
    const a = defineUniforms({ mvp: 'mat4x4f', color: 'vec4f' });
    const b = defineUniforms({ mvp: 'mat4x4f', color: 'vec4f' });
    expect(a).toBe(b);
    expect(a.key).toBe(b.key);
    // 字段顺序不同 → 布局不同（偏移会变）。
    const c = defineUniforms({ color: 'vec4f', mvp: 'mat4x4f' });
    expect(c.key).not.toBe(a.key);
  });
});

describe('UniformLayout 代码生成', () => {
  const layout = defineUniforms({ projectionView: 'mat4x4f', baseColor: 'vec4f', time: 'f32', bones: 'mat4x4f[64]' });

  it('生成的 GLSL 是 std140 块，实例名 u 与 WGSL 一致', () => {
    const glsl = layout.glslDeclaration();
    expect(glsl).toContain('layout(std140) uniform Uniforms {');
    expect(glsl).toContain('  mat4 projectionView;');
    expect(glsl).toContain('  vec4 baseColor;');
    expect(glsl).toContain('  float time;');
    expect(glsl).toContain('  mat4 bones[64];');
    expect(glsl.trimEnd().endsWith('} u;')).toBe(true);
  });

  it('生成的 WGSL 是 struct + binding，成员访问同样是 u.*', () => {
    const wgsl = layout.wgslDeclaration();
    expect(wgsl).toContain('struct Uniforms {');
    expect(wgsl).toContain('  projectionView: mat4x4f,');
    expect(wgsl).toContain('  bones: array<mat4x4f, 64>,');
    expect(wgsl).toContain('@group(0) @binding(0) var<uniform> u: Uniforms;');
  });

  it('可以通过 options 指定结构体名、group 与 binding', () => {
    const custom = defineUniforms({ value: 'f32' }, { structName: 'MyBlock', group: 2, binding: 3 });
    expect(custom.glslDeclaration()).toContain('uniform MyBlock {');
    expect(custom.wgslDeclaration()).toContain('@group(2) @binding(3) var<uniform> u: MyBlock;');
  });
});

describe('UniformValues 类型化写入器', () => {
  it('紧凑字段直接是 TypedArray，可以按下标写', () => {
    const u = createUniforms({ color: 'vec4f', time: 'f32', index: 'i32', count: 'u32' });
    expect(u.color).toBeInstanceOf(Float32Array);
    expect(u.color.length).toBe(4);
    expect(u.time.length).toBe(1);
    expect(u.index).toBeInstanceOf(Int32Array);
    expect(u.count).toBeInstanceOf(Uint32Array);

    u.time[0] = 1.5;
    expect(u.get('time')[0]).toBeCloseTo(1.5, 6);
  });

  it('mat4x4f 是 Float32Array(16)，可以直接 set 矩阵', () => {
    const u = createUniforms({ model: 'mat4x4f' });
    const matrix = new Float32Array(16).map((_value, index) => index);
    u.model.set(matrix);
    expect(Array.from(u.get('model'))).toEqual(Array.from(matrix));
    // 写进的是真实内存：从 buffer 上取同样能看到。
    expect(new Float32Array(u.buffer, 0, 16)[5]).toBe(5);
  });

  it('带填充的字段返回访问器，set/get 收发紧凑数据', () => {
    const u = createUniforms({ normalMatrix: 'mat3x3f', weights: 'vec3f[3]' });

    // mat3：at(column) 是 3 个 float 的列视图，列之间有 4 字节填充。
    const normalMatrix = u.normalMatrix;
    expect(normalMatrix.count).toBe(3);
    expect(normalMatrix.byteStride).toBe(16);
    expect(normalMatrix.at(1).length).toBe(3);
    normalMatrix.set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Array.from(u.get('normalMatrix'))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // 第 0 列在偏移 0，第 1 列在偏移 16 字节处。
    expect(normalMatrix.at(0)[0]).toBe(1);
    expect(normalMatrix.at(1)[0]).toBe(4);

    // vec3f[3]：步长 16，同样用访问器。
    const weights = u.weights;
    expect(weights.count).toBe(3);
    weights.set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Array.from(u.get('weights'))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(weights.at(2)[2]).toBe(9);
  });

  it('set() 支持标量与数组，assign() 支持批量', () => {
    const u = createUniforms({ time: 'f32', color: 'vec4f', model: 'mat4x4f' });
    u.set('time', 2);
    u.set('color', [1, 0, 0, 1]);
    u.assign({ time: 3, model: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] });
    expect(u.get('time')[0]).toBe(3);
    expect(Array.from(u.get('color'))).toEqual([1, 0, 0, 1]);
    expect(u.get('model')[15]).toBe(1);
  });

  it('每次修改都会推进 version（渲染器据此跳过无谓上传）', () => {
    const u = createUniforms({ time: 'f32' });
    const before = u.version;
    u.set('time', 1);
    expect(u.version).toBeGreaterThan(before);
  });

  it('未知字段、标量传数组、越界下标都会报错', () => {
    const u = createUniforms({ time: 'f32', weights: 'vec3f[2]' });
    const looseSet = u.set as unknown as (name: string, value: unknown) => unknown;
    expect(() => looseSet.call(u, 'nope', 1)).toThrowError(/没有字段/);
    // 给非标量字段传单个数字应当被拦下（这里故意绕过类型检查来测运行时报错）。
    expect(() => looseSet.call(u, 'weights', 5)).toThrowError(/不是标量/);
    expect(() => u.weights.at(5)).toThrowError(/越界/);
  });

  it('同一个布局可以创建多个数值容器（每个物体一套 uniform）', () => {
    const layout = new UniformLayout({ model: 'mat4x4f' });
    const a = createUniforms(layout);
    const b = createUniforms(layout);
    a.set('model', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]);
    b.set('model', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1]);
    expect(a.get('model')[12]).toBe(1);
    expect(b.get('model')[12]).toBe(2);
  });
});

describe('Material：声明注入', () => {
  const desc: MaterialDesc = {
    name: 'test-mat',
    attributes: { position: 'float32x3', uv: 'float32x2' },
    uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f', baseColor: 'vec4f' },
    textures: ['albedo'],
    glsl: {
      vs: `out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec2 vUv;
void main() {
  fragColor = texture(albedo, vUv) * u.baseColor;
}`,
    },
    wgsl: `struct Out { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn vsMain(v: VertexInput) -> Out {
  var out: Out;
  out.uv = v.uv;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}
@fragment fn fsMain(in: Out) -> @location(0) vec4f {
  return textureSample(albedo, albedo_sampler, in.uv) * u.baseColor;
}`,
  };

  it('GLSL 会自动补上 attribute、uniform 块与 sampler 声明', () => {
    const material = defineMaterial(desc);
    expect(material.glsl.vs).toContain('layout(location = 0) in vec3 position;');
    expect(material.glsl.vs).toContain('layout(location = 1) in vec2 uv;');
    expect(material.glsl.vs).toContain('layout(std140) uniform Uniforms {');
    expect(material.glsl.vs).toContain('uniform sampler2D albedo;');
    // 片元着色器不该出现顶点属性声明。
    expect(material.glsl.fs).not.toContain('in vec3 position;');
    expect(material.glsl.fs).toContain('uniform sampler2D albedo;');
  });

  it('WGSL 会自动补上 VertexInput、uniform struct 与纹理绑定', () => {
    const material = defineMaterial(desc);
    expect(material.wgsl).toContain('struct VertexInput {');
    expect(material.wgsl).toContain('@location(0) position: vec3f,');
    expect(material.wgsl).toContain('@location(1) uv: vec2f,');
    expect(material.wgsl).toContain('@group(0) @binding(0) var<uniform> u: Uniforms;');
    expect(material.wgsl).toContain('@group(1) @binding(0) var albedo: texture_2d<f32>;');
    expect(material.wgsl).toContain('@group(1) @binding(1) var albedo_sampler: sampler;');
    // 用户自己的源码必须原样保留。
    expect(material.wgsl).toContain('@vertex fn vsMain(v: VertexInput) -> Out');
    expect(material.wgsl).toContain('@fragment fn fsMain');
  });

  it('占位符可以控制注入位置', () => {
    const material = defineMaterial({
      name: 'placeholder',
      attributes: { position: 'float32x3' },
      glsl: { vs: '/*%attributes%*/\nvoid main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
      wgsl: '/*%attributes%*/\n@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
    });
    expect(material.glsl.vs.indexOf('layout(location = 0)')).toBeLessThan(material.glsl.vs.indexOf('void main()'));
    expect(material.wgsl.indexOf('struct VertexInput')).toBeLessThan(material.wgsl.indexOf('@fragment'));
  });

  it('顶点布局按属性顺序生成，每个属性一个缓冲槽', () => {
    const material = defineMaterial({
      name: 'layouts',
      attributes: { position: 'float32x3', color: 'unorm8x4' },
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
    });
    const layouts = material.vertexBufferLayouts();
    expect(layouts).toHaveLength(2);
    expect(layouts[0]).toMatchObject({ arrayStride: 12, stepMode: 'vertex' });
    expect(layouts[0]!.attributes[0]).toMatchObject({ shaderLocation: 0, offset: 0, format: 'float32x3' });
    expect(layouts[1]).toMatchObject({ arrayStride: 4 });
    expect(layouts[1]!.attributes[0]).toMatchObject({ shaderLocation: 1, format: 'unorm8x4' });
  });

  it('没有 uniform 时纹理落在 group 0，不会出现空的 group 0', () => {
    const material = defineMaterial({
      name: 'texture-only',
      attributes: { position: 'float32x3' },
      textures: ['albedo'],
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = texture(albedo, vec2(0.0)); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return textureSample(albedo, albedo_sampler, vec2f(0.0)); }',
    });
    expect(material.textureGroup).toBe(0);
    expect(material.wgsl).toContain('@group(0) @binding(0) var albedo: texture_2d<f32>;');
  });

  it('GLSL 的片元输出会自动声明，且不会重复声明', () => {
    const base: MaterialDesc = {
      name: 'fs-output',
      attributes: { position: 'float32x3' },
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
    };
    // 默认自动补 `fragColor`。
    expect(defineMaterial(base).glsl.fs).toContain('layout(location = 0) out vec4 fragColor;');

    // 可以改名。
    const renamed = defineMaterial({ ...base, fragmentOutput: 'color' });
    expect(renamed.glsl.fs).toContain('layout(location = 0) out vec4 color;');
    expect(renamed.glsl.fs).not.toContain('fragColor;');

    // 可以关掉（自己声明时用）。
    expect(defineMaterial({ ...base, fragmentOutput: false }).glsl.fs).not.toContain('out vec4');

    // 自己已经声明了就不重复注入。
    const declared = defineMaterial({
      ...base,
      glsl: {
        vs: 'void main() {}',
        fs: 'layout(location = 0) out vec4 fragColor;\nvoid main() { fragColor = vec4(1.0); }',
      },
    });
    expect(declared.glsl.fs.match(/out vec4 fragColor;/g)).toHaveLength(1);
  });

  it('WGSL 是单个模块字符串，同时包含顶点与片元入口', () => {    const material = defineMaterial(desc);
    expect(typeof material.wgsl).toBe('string');
    expect(material.wgsl).toContain('@vertex fn vsMain');
    expect(material.wgsl).toContain('@fragment fn fsMain');
  });

  it('没有顶点属性的材质会被拒绝（两个后端都需要显式布局）', () => {
    const { device } = createFakeDevice();
    expect(() =>
      defineMaterial({
        name: 'no-attrs',
        glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
        wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
      }).createPipelineDescriptor(device),
    ).toThrowError(/没有声明任何顶点属性/);
  });

  it('混合预设能解析，未知预设报错', () => {
    const base = {
      name: 'blend',
      attributes: { position: 'float32x3' as const },
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
    };
    expect(defineMaterial({ ...base, blend: 'alpha' }).resolveBlend()).toMatchObject({
      color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
    });
    expect(defineMaterial(base).resolveBlend()).toBeNull();
    expect(() => defineMaterial({ ...base, blend: 'nope' as never }).resolveBlend()).toThrowError(/未知的混合预设/);
  });

  it('depthTest: false 时产出 format: null 的深度状态', () => {
    const { device } = createFakeDevice();
    const material = defineMaterial({
      name: 'nodepth',
      attributes: { position: 'float32x3' },
      depthTest: false,
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
    });
    const { descriptor } = material.createPipelineDescriptor(device);
    expect(descriptor.depthStencil).toEqual({ format: null });
    expect(descriptor.primitive).toMatchObject({ topology: 'triangle-list', cullMode: 'back' });
  });

  it('createUniforms() 产出的容器与材质布局一致', () => {
    const material = defineMaterial(desc);
    const values = material.createUniforms();
    expect(values.layout).toBe(material.uniforms!);
    values.baseColor.set([1, 0, 0, 1]);
    expect(Array.from(values.get('baseColor'))).toEqual([1, 0, 0, 1]);
  });

  it('没有 uniform 的材质调用 createUniforms() 会报错', () => {
    const material = defineMaterial({
      name: 'plain',
      attributes: { position: 'float32x3' },
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(1.0); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(1.0); }',
    });
    expect(() => material.createUniforms()).toThrowError(/没有 uniform 布局/);
  });
});

describe('Geometry：数据打包与校验', () => {
  it('按属性分开上传，并推断标准属性的格式', () => {
    const { device, writes, buffers } = createFakeDevice();
    const geometry = Geometry.create(device, {
      label: 'quad',
      position: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
      uv: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: [0, 1, 2, 0, 2, 3],
    });

    expect(geometry.vertexCount).toBe(4);
    expect(geometry.indexCount).toBe(6);
    expect(geometry.attributes.get('position')!.format).toBe('float32x3');
    expect(geometry.attributes.get('uv')!.format).toBe('float32x2');
    // 索引用 Uint16Array（顶点数 4 < 65536），且 buffer 大小按 4 字节对齐。
    expect(writes.some((write) => write.buffer === 'quad:indices')).toBe(true);
    expect(buffers.get('quad:position')).toBe(48);
    expect(buffers.get('quad:uv')).toBe(32);
    expect(buffers.get('quad:indices')).toBe(12);
    geometry.destroy();
  });

  it('缺少材质需要的属性时报出双方信息', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, {
      label: 'points',
      position: new Float32Array([0, 0, 0]),
    });
    expect(() => geometry.validateAgainst([{ name: 'normal', format: 'float32x3' }], 'lambert')).toThrowError(
      /缺少材质「lambert」需要的属性「normal」/,
    );
    expect(() => geometry.validateAgainst([{ name: 'normal', format: 'float32x3' }], 'lambert')).toThrowError(
      /几何体现有属性：position/,
    );
    geometry.destroy();
  });

  it('格式不匹配时报错', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, { position: new Float32Array([0, 0, 0]) });
    expect(() =>
      geometry.validateAgainst([{ name: 'position', format: 'float32x2' }], 'mat'),
    ).toThrowError(/格式是 float32x3，但材质「mat」要求 float32x2/);
    geometry.destroy();
  });

  it('索引越界与非整数索引都会被拦下', () => {
    const { device } = createFakeDevice();
    expect(() =>
      Geometry.create(device, { position: new Float32Array([0, 0, 0]), indices: [0, 1, 2] }),
    ).toThrowError(/索引最大值 2 超过了顶点数 1/);
    expect(() =>
      Geometry.create(device, { position: new Float32Array([0, 0, 0]), indices: [0, -1, 0] }),
    ).toThrowError(/非法值 -1/);
  });

  it('属性长度不足时报错', () => {
    const { device } = createFakeDevice();
    expect(() =>
      Geometry.create(device, {
        position: new Float32Array([0, 0, 0, 1, 0, 0]),
        uv: new Float32Array([0, 0]),
      }),
    ).toThrowError(/所有属性必须提供同样多的顶点/);
  });

  it('无法推断的格式要求显式指定', () => {
    const { device } = createFakeDevice();
    expect(() =>
      Geometry.create(device, {
        attributes: { weight: { data: new Uint8Array([1, 2, 3, 4]) } },
        vertexCount: 1,
      }),
    ).toThrowError(/只有 x2、x4 两种写法/);

    const ok = Geometry.create(device, {
      attributes: { weight: { data: new Uint8Array([1, 2, 3, 4]), format: 'unorm8x4' } },
      vertexCount: 1,
    });
    expect(ok.attributes.get('weight')!.format).toBe('unorm8x4');
  });

  it('标准属性格式表覆盖常用名字', () => {
    expect(STANDARD_ATTRIBUTE_FORMATS.position).toBe('float32x3');
    expect(STANDARD_ATTRIBUTE_FORMATS.uv).toBe('float32x2');
    expect(STANDARD_ATTRIBUTE_FORMATS.color).toBe('float32x4');
  });

  it('destroy() 幂等且会释放全部 buffer', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, {
      position: new Float32Array([0, 0, 0]),
      indices: [0],
    });
    const destroySpy = vi.spyOn(geometry.attributes.get('position')!.buffer, 'destroy');
    geometry.destroy();
    geometry.destroy();
    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(geometry.disposed).toBe(true);
  });
});
