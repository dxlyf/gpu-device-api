import { describe, expect, it } from 'vitest';

import { defineMaterial, SCENE_BLOCK_INSTANCE, SCENE_UNIFORM_NAMES } from '../src/gfx/Material.js';
import { Geometry } from '../src/gfx/Geometry.js';
import { materials } from '../src/gfx/materials.js';
import type { Device } from '../src/core/Device.js';
import type { Buffer, BufferDescriptor } from '../src/core/resources/Buffer.js';

/* ------------------------------------------------------------------------------------------------ */
/* 假 device：只用得到 createBuffer + queue.writeBuffer（与 test/gfx.test.ts 里的同一套路）           */
/* ------------------------------------------------------------------------------------------------ */

function createFakeDevice(): { device: Device } {
  let counter = 0;
  const device = {
    createBuffer(descriptor: BufferDescriptor): Buffer {
      const label = descriptor.label ?? `buffer#${counter++}`;
      return {
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
    },
    queue: { writeBuffer: () => {} },
  } as unknown as Device;
  return { device };
}

/** 一个立方体的 8 个角（边长 2、中心在原点）——包围球应当是中心 (0,0,0)、半径 sqrt(3)。 */
const CUBE_CORNERS = new Float32Array([
  -1, -1, -1,
  1, -1, -1,
  -1, 1, -1,
  1, 1, -1,
  -1, -1, 1,
  1, -1, 1,
  -1, 1, 1,
  1, 1, 1,
]);

/* ------------------------------------------------------------------------------------------------ */
/* Geometry 的包围球                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

describe('Geometry 包围球', () => {
  it('按 position 顶点算一次：球心是 AABB 中心、半径是到球心的最远距离', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, { label: 'cube', position: CUBE_CORNERS });
    const sphere = geometry.boundingSphere!;
    expect(sphere).not.toBeNull();
    expect(Array.from(sphere.center)).toEqual([0, 0, 0]);
    expect(sphere.radius).toBeCloseTo(Math.sqrt(3), 5);
    expect(geometry.cullable).toBe(true);
    geometry.destroy();
  });

  it('球心取 AABB 中心而不是顶点平均值（分布不均时球更紧）', () => {
    const { device } = createFakeDevice();
    // 100 个顶点挤在原点、1 个顶点在 x = 10：AABB 中心是 5，半径是 5。
    const positions = new Float32Array(101 * 3);
    positions[300] = 10;
    const geometry = Geometry.create(device, { label: 'skewed', position: positions });
    expect(geometry.boundingSphere!.center[0]).toBeCloseTo(5, 5);
    expect(geometry.boundingSphere!.radius).toBeCloseTo(5, 5);
    geometry.destroy();
  });

  it('调用方显式给出的包围球优先（顶点着色器会位移顶点时必须能这么干）', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, {
      label: 'displaced',
      position: CUBE_CORNERS,
      boundingSphere: { center: [0, 3, 0], radius: 42 },
    });
    expect(Array.from(geometry.boundingSphere!.center)).toEqual([0, 3, 0]);
    expect(geometry.boundingSphere!.radius).toBe(42);
    geometry.destroy();
  });

  it('省略球心时按原点处理', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, {
      label: 'origin-sphere',
      position: CUBE_CORNERS,
      boundingSphere: { radius: 7 },
    });
    expect(Array.from(geometry.boundingSphere!.center)).toEqual([0, 0, 0]);
    expect(geometry.boundingSphere!.radius).toBe(7);
    geometry.destroy();
  });

  it('非法的显式包围球会被拦下', () => {
    const { device } = createFakeDevice();
    expect(() =>
      Geometry.create(device, { position: CUBE_CORNERS, boundingSphere: { radius: -1 } }),
    ).toThrowError(/半径必须是有限的非负数/);
    expect(() =>
      Geometry.create(device, { position: CUBE_CORNERS, boundingSphere: { center: [0, 0], radius: 1 } }),
    ).toThrowError(/至少要有 3 个分量/);
    expect(() =>
      Geometry.create(device, {
        position: CUBE_CORNERS,
        boundingSphere: { center: [0, Number.NaN, 0], radius: 1 },
      }),
    ).toThrowError(/必须是有限数/);
  });

  it('position 不是 float32x3 时算不出包围球（调用方显式给，否则 skip 剔除）', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, {
      label: 'quantized',
      attributes: { position: { data: new Uint16Array(8 * 4), format: 'unorm16x4' } },
      vertexCount: 8,
    });
    expect(geometry.boundingSphere).toBeNull();
    expect(geometry.cullable).toBe(false);
    geometry.destroy();
  });

  it('实例化几何体默认不可剔除（实例属性决定位置，基础顶点的球盖不住）', () => {
    const { device } = createFakeDevice();
    const geometry = Geometry.create(device, {
      label: 'instanced',
      position: CUBE_CORNERS,
      attributes: {
        instanceOffset: { data: new Float32Array(6 * 3), format: 'float32x3', perInstance: true },
      },
    });
    expect(geometry.boundingSphere).not.toBeNull();
    expect(geometry.cullable).toBe(false);

    // 显式给出包围球表示「调用方对实例分布负责」，这时允许剔除。
    const explicit = Geometry.create(device, {
      label: 'instanced-explicit',
      position: CUBE_CORNERS,
      attributes: {
        instanceOffset: { data: new Float32Array(6 * 3), format: 'float32x3', perInstance: true },
      },
      boundingSphere: { radius: 100 },
    });
    expect(explicit.cullable).toBe(true);

    geometry.destroy();
    explicit.destroy();
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* Material 的 scene / per-draw 拆分                                                                   */
/* ------------------------------------------------------------------------------------------------ */

describe('Material 的 uniform 拆分', () => {
  it('默认把场景字段挪进场景块，并保持 `material.uniforms` 仍是完整布局', () => {
    const material = defineMaterial(materials.lambert({ color: [1, 1, 1, 1] }));

    expect(material.sceneFieldNames).toEqual(['projectionView', 'lightDirection', 'ambient']);
    expect(material.sceneUniforms).not.toBeNull();
    expect(material.drawUniforms).not.toBeNull();

    // 完整布局照旧（公开 API 没变）。
    expect(material.uniforms!.has('projectionView')).toBe(true);
    expect(material.uniforms!.has('model')).toBe(true);

    // 场景块只有每帧不变的那三个；每 draw 块是剩下的全部。
    expect(material.sceneUniforms!.fields.map((field) => field.name)).toEqual([
      'projectionView',
      'lightDirection',
      'ambient',
    ]);
    expect(material.drawUniforms!.fields.map((field) => field.name)).toEqual([
      'model',
      'normalMatrix',
      'baseColor',
    ]);

    // binding 不能撞车：绘制块用原 binding，场景块用下一个。
    expect(material.drawUniforms!.binding).toBe(0);
    expect(material.sceneUniforms!.binding).toBe(1);

    // 相机字段由渲染器自动填，所以它现在每帧只写一次。
    expect(SCENE_UNIFORM_NAMES).toContain('projectionView');
    expect(SCENE_UNIFORM_NAMES).toContain('cameraPosition');
    expect(SCENE_UNIFORM_NAMES).not.toContain('model');
  });

  it('着色器源码里的 `u.<场景字段>` 被改写成 `uScene.<场景字段>`，其余保持 `u.`', () => {
    const material = defineMaterial(materials.lambert());
    expect(material.glsl.vs).toContain(`${SCENE_BLOCK_INSTANCE}.projectionView`);
    expect(material.glsl.vs).toContain('u.model');
    expect(material.glsl.vs).not.toContain('u.projectionView');
    expect(material.wgsl).toContain(`${SCENE_BLOCK_INSTANCE}.projectionView * u.model`);
    expect(material.wgsl).not.toContain('u.projectionView');
  });

  it('两个块都声明出来了，且实例名不重复（GLSL / WGSL 都不允许重名）', () => {
    const material = defineMaterial(materials.phong());

    // GLSL：块名是 structName / structNameScene，实例名 u / uScene。
    expect(material.glsl.vs).toContain('layout(std140) uniform Uniforms {');
    expect(material.glsl.vs).toContain('layout(std140) uniform UniformsScene {');
    expect(material.glsl.vs).toContain('} u;');
    expect(material.glsl.vs).toContain(`} ${SCENE_BLOCK_INSTANCE};`);

    // WGSL：binding 0 是每 draw 块、binding 1 是场景块。
    expect(material.wgsl).toContain('@group(0) @binding(0) var<uniform> u: Uniforms;');
    expect(material.wgsl).toContain(
      `@group(0) @binding(1) var<uniform> ${SCENE_BLOCK_INSTANCE}: UniformsScene;`,
    );

    // phong 用到 cameraPosition，它也必须被改写。
    expect(material.sceneFieldNames).toContain('cameraPosition');
    expect(material.glsl.fs).toContain(`${SCENE_BLOCK_INSTANCE}.cameraPosition`);
    expect(material.wgsl).toContain(`${SCENE_BLOCK_INSTANCE}.cameraPosition`);
  });

  it('不会误伤同前缀的字段名（`u.cameraPositionX` 不是 `u.cameraPosition`）', () => {
    const material = defineMaterial({
      name: 'prefix',
      attributes: { position: 'float32x3' },
      uniforms: { cameraPosition: 'vec3f', cameraPositionX: 'f32', model: 'mat4x4f' },
      glsl: {
        vs: 'void main() { gl_Position = u.model * vec4(position * u.cameraPositionX, 1.0); }',
        fs: 'void main() { fragColor = vec4(u.cameraPosition, 1.0); }',
      },
      wgsl: `@fragment fn fsMain() -> @location(0) vec4f {
  return vec4f(${SCENE_BLOCK_INSTANCE}.cameraPosition * u.cameraPositionX, 1.0);
}`,
    });
    // cameraPosition 进场景块并被改写；cameraPositionX 留在每 draw 块、保持 u. 前缀。
    expect(material.sceneFieldNames).toEqual(['cameraPosition']);
    expect(material.glsl.fs).toContain(`${SCENE_BLOCK_INSTANCE}.cameraPosition`);
    expect(material.glsl.vs).toContain('u.cameraPositionX');
  });

  it('`sceneFields: false` 完全不拆分（行为与拆分前逐字节一致）', () => {
    const material = defineMaterial({ ...materials.lambert(), sceneFields: false });
    expect(material.sceneUniforms).toBeNull();
    expect(material.sceneFieldNames).toEqual([]);
    // 绘制块就是原布局本身。
    expect(material.drawUniforms).toBe(material.uniforms);
    // 源码一个字都没改。
    expect(material.glsl.vs).toContain('u.projectionView');
    expect(material.glsl.vs).not.toContain(SCENE_BLOCK_INSTANCE);
  });

  it('布局里没有场景字段时不拆分（例如只声明 model + baseColor 的自定义材质）', () => {
    const material = defineMaterial({
      name: 'no-scene',
      attributes: { position: 'float32x3' },
      uniforms: { model: 'mat4x4f', baseColor: 'vec4f' },
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = u.baseColor; }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return u.baseColor; }',
    });
    expect(material.sceneUniforms).toBeNull();
    expect(material.drawUniforms).toBe(material.uniforms);
  });

  it('`model` 与 `normalMatrix` 永远留在每 draw 块（即使显式列进 sceneFields）', () => {
    const material = defineMaterial({
      ...materials.lambert(),
      sceneFields: ['model', 'normalMatrix', 'projectionView'],
    });
    expect(material.sceneFieldNames).toEqual(['projectionView']);
    expect(material.drawUniforms!.has('model')).toBe(true);
    expect(material.drawUniforms!.has('normalMatrix')).toBe(true);
  });

  it('所有字段都是场景字段时，场景块接管原 binding，绘制块为 null', () => {
    const material = defineMaterial({
      name: 'scene-only',
      attributes: { position: 'float32x3' },
      uniforms: { projectionView: 'mat4x4f', time: 'f32' },
      glsl: { vs: 'void main() {}', fs: 'void main() { fragColor = vec4(u.time); }' },
      wgsl: '@fragment fn fsMain() -> @location(0) vec4f { return vec4f(u.time); }',
    });
    expect(material.drawUniforms).toBeNull();
    expect(material.sceneUniforms).not.toBeNull();
    expect(material.sceneUniforms!.binding).toBe(0);
    expect(material.glsl.fs).toContain(`${SCENE_BLOCK_INSTANCE}.time`);
    // 没有绘制块时着色器里不该出现 `u.`（改成 uScene 之后就没有裸的 u 了）。
    expect(material.glsl.fs).not.toContain('u.time');
  });

  it('两个块各自创建的数值容器：默认值只落到它所属的那个块', () => {
    const material = defineMaterial(materials.lambert({ color: [0.25, 0.5, 0.75, 1] }));

    const scene = material.createSceneUniforms()!;
    expect(scene.layout).toBe(material.sceneUniforms!);
    expect(scene.has('baseColor')).toBe(false);
    expect(scene.has('projectionView')).toBe(true);

    const draw = material.createDrawUniforms()!;
    expect(draw.layout).toBe(material.drawUniforms!);
    expect(Array.from(draw.get('baseColor'))).toEqual([
      Math.fround(0.25),
      Math.fround(0.5),
      Math.fround(0.75),
      1,
    ]);
    expect(draw.has('projectionView')).toBe(false);

    // 整块布局的容器仍然可用（公开 API 没变）。
    expect(material.createUniforms().layout).toBe(material.uniforms!);
  });

  it('两个块合起来的字节数不超过拆分前（拆分只减少每 draw 上传的字节）', () => {
    const material = defineMaterial(materials.phong());
    expect(material.drawUniforms!.byteLength).toBeLessThan(material.uniforms!.byteLength);
    expect(material.drawUniforms!.byteLength + material.sceneUniforms!.byteLength).toBeGreaterThanOrEqual(
      material.uniforms!.byteLength,
    );
  });
});
