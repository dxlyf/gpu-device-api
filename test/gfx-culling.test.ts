import { describe, expect, it } from 'vitest';

import { FrustumCuller } from '../src/gfx/Culling.js';
import { PerspectiveCamera } from '../src/gfx/Camera.js';
import { compareOpaque, compareTransparent, sortDraws, type SortableDraw } from '../src/gfx/DrawSort.js';
import { mat4, vec3 } from '../src/utils/math/index.js';
import type { BoundingSphere } from '../src/gfx/Geometry.js';

/* ------------------------------------------------------------------------------------------------ */
/* 视锥剔除                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** 一台看向 -Z 的相机：位置 (0,0,5)，近平面 1、远平面 11 —— 世界坐标里近平面在 z=4、远平面在 z=-6。 */
function testCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera({
    position: [0, 0, 5],
    target: [0, 0, 0],
    fov: 90,
    aspect: 1,
    near: 1,
    far: 11,
    depthRange: 'gl',
  });
  // 构造函数已经 update() 过一次，这里保持显式，避免以后构造函数行为变化悄悄影响用例。
  camera.update();
  return camera;
}

describe('FrustumCuller', () => {
  it('没有 update() 之前 ready 为 false（调用方据此跳过剔除）', () => {
    const culler = new FrustumCuller();
    expect(culler.ready).toBe(false);
    culler.update(testCamera().projectionViewMatrix, 'gl');
    expect(culler.ready).toBe(true);
  });

  it('正前方的球可见，相机背后与远平面之外的球被剔除', () => {
    const camera = testCamera();
    const culler = new FrustumCuller();
    culler.update(camera.projectionViewMatrix, 'gl');

    // 相机在 (0,0,5) 看向 -Z：原点在视锥内。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, 0), 0.5)).toBe(true);
    // 相机背后（比相机还远，z 更大）。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, 6), 0.5)).toBe(false);
    // 比远平面还远（世界 z < -6）。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, -7), 0.5)).toBe(false);
    // 比近平面还近（世界 z > 4）。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, 4.6), 0.2)).toBe(false);
    // 侧向超出 90° FOV。
    expect(culler.intersectsSphere(vec3.fromValues(50, 0, -10), 1)).toBe(false);
  });

  it('判定是保守的：与平面相切/略微越界的球仍然可见', () => {
    const camera = testCamera();
    const culler = new FrustumCuller();
    culler.update(camera.projectionViewMatrix, 'gl');

    // 远平面在 z = -6。球心正好落在平面上：可见（保守）。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, -6), 1)).toBe(true);
    // 球心越界 1 个单位、半径 1.01（略有交叠）：仍然可见。
    // 注意这里刻意留 1% 余量：平面参数是 float32，正好相切的情形会被舍入误差推到哪一侧并不确定，
    // 「相切仍然可见」不是可以逐比特断言的保证，能断言的是「有交叠就可见」。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, -7), 1.01)).toBe(true);
    // 半径明显小于越界距离：此时才剔除。
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, -7), 0.9)).toBe(false);
  });

  it('负半径按 0 处理（脏数据不该把可见物剔除掉）', () => {
    const camera = testCamera();
    const culler = new FrustumCuller();
    culler.update(camera.projectionViewMatrix, 'gl');
    expect(culler.intersectsSphere(vec3.fromValues(0, 0, 0), -5)).toBe(true);
  });

  it('gl 与 zo 的近平面约定不同，选错会剔除掉近处可见的物体', () => {
    const camera = testCamera();
    // 采一个「按 GL 约定在体内、按 ZO 约定被当成比近平面还近」的点（与 math.test.ts 同一构造）。
    const glMatrix = mat4.perspective(mat4.create(), (90 * Math.PI) / 180, 1, 1, 101);
    const glCuller = new FrustumCuller();
    glCuller.update(glMatrix, 'gl');
    const zoCuller = new FrustumCuller();
    zoCuller.update(glMatrix, 'zo');

    expect(glCuller.intersectsSphere(vec3.fromValues(0, 0, -1.05), 0)).toBe(true);
    expect(zoCuller.intersectsSphere(vec3.fromValues(0, 0, -1.05), 0)).toBe(false);

    // 用与后端一致的约定时又回到体内。
    const zoMatrix = mat4.perspectiveZO(mat4.create(), (90 * Math.PI) / 180, 1, 1, 101);
    const matched = new FrustumCuller();
    matched.update(zoMatrix, 'zo');
    expect(matched.intersectsSphere(vec3.fromValues(0, 0, -1.05), 0)).toBe(true);

    // 相机的 depthRange 也真的按后端切换（WebGPU 用 zo）。
    expect(camera.depthRange).toBe('gl');
  });

  it('局部包围球会先被 model 矩阵搬到世界空间', () => {
    const camera = testCamera();
    const culler = new FrustumCuller();
    culler.update(camera.projectionViewMatrix, 'gl');

    const sphere: BoundingSphere = { center: vec3.fromValues(0, 0, 0), radius: 0.5 };
    // 单位矩阵（传 null 表示不变换）：原点可见。
    expect(culler.intersectsLocalSphere(sphere, null)).toBe(true);

    // 平移到相机背后 → 剔除。
    const behind = mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 10));
    expect(culler.intersectsLocalSphere(sphere, behind)).toBe(false);

    // 平移到远处但仍然在视锥内（世界 z = -10 超出远平面 → 剔除）。
    const beyond = mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -10));
    expect(culler.intersectsLocalSphere(sphere, beyond)).toBe(false);
  });

  it('非等比缩放按最大轴放大半径（保守，不误剔除）', () => {
    const camera = testCamera();
    const culler = new FrustumCuller();
    culler.update(camera.projectionViewMatrix, 'gl');

    // 注意 model 也会变换球心：这里用「先缩放、再平移」的组合，让球心固定落在世界 z = -7
    //（远平面在 z = -6，越界 1 个单位），只让半径随缩放变化。
    const translate = mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -7));
    const compose = (scale: number): ReturnType<typeof mat4.create> =>
      mat4.multiply(
        mat4.create(),
        translate,
        mat4.fromScaling(mat4.create(), vec3.fromValues(scale, scale, scale)),
      );
    const sphere: BoundingSphere = { center: vec3.fromValues(0, 0, 0), radius: 0.5 };

    // 缩放 1：世界半径 0.5 < 越界距离 1 → 剔除。
    expect(culler.intersectsLocalSphere(sphere, compose(1))).toBe(false);
    // 缩放 4：世界半径 2 > 1 → 可见。
    expect(culler.intersectsLocalSphere(sphere, compose(4))).toBe(true);

    // 只在 X 轴上放大 4 倍：最大轴缩放仍是 4，判定与等比放大一致（保守）。
    const stretchX = mat4.multiply(
      mat4.create(),
      translate,
      mat4.fromScaling(mat4.create(), vec3.fromValues(4, 1, 1)),
    );
    expect(culler.intersectsLocalSphere(sphere, stretchX)).toBe(true);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* draw 排序                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

function item(overrides: Partial<SortableDraw> & { order: number }): SortableDraw {
  return {
    pipeline: 0,
    bindings: 0,
    depth: 0,
    transparent: false,
    ...overrides,
  };
}

/** 把结果压成 `pipeline:bindings:depth:透明?` 便于断言顺序。 */
function shape(items: readonly SortableDraw[]): string[] {
  return items.map(
    (entry) =>
      `${entry.pipeline}:${entry.bindings}:${entry.depth}:${entry.transparent ? 'T' : 'O'}#${entry.order}`,
  );
}

describe('draw 排序', () => {
  it("'none' 是空操作", () => {
    const items = [item({ order: 0, pipeline: 2 }), item({ order: 1, pipeline: 1 })];
    sortDraws(items, 'none');
    expect(shape(items)).toEqual(['2:0:0:O#0', '1:0:0:O#1']);
  });

  it("'all'：不透明物按 管线 → 绑定组 → 深度 排序，且排在前面", () => {
    const items = [
      item({ order: 0, pipeline: 2, bindings: 0, depth: 1 }),
      item({ order: 1, pipeline: 1, bindings: 1, depth: 5 }),
      item({ order: 2, pipeline: 1, bindings: 0, depth: 9 }),
      item({ order: 3, pipeline: 1, bindings: 0, depth: 3 }),
    ];
    sortDraws(items, 'all');
    // 管线 1 在前；绑定组 0 在绑定组 1 前；同绑定组内由近到远（3 < 9）。
    expect(shape(items)).toEqual(['1:0:3:O#3', '1:0:9:O#2', '1:1:5:O#1', '2:0:1:O#0']);
  });

  it("'all'：半透明物排在最后，只按深度从远到近", () => {
    const items = [
      item({ order: 0, transparent: true, pipeline: 1, depth: 2 }),
      item({ order: 1, transparent: false, pipeline: 9, depth: 8 }),
      item({ order: 2, transparent: true, pipeline: 3, depth: 7 }),
      item({ order: 3, transparent: true, pipeline: 2, depth: 4 }),
    ];
    sortDraws(items, 'all');
    // 不透明物（管线 9）先画；半透明物按深度 7 → 4 → 2（远到近），管线号完全不参与。
    expect(shape(items)).toEqual(['9:0:8:O#1', '3:0:7:T#2', '2:0:4:T#3', '1:0:2:T#0']);
  });

  it("'all'：深度相同时保持提交顺序（稳定）", () => {
    const items = [
      item({ order: 0, transparent: true, depth: 3 }),
      item({ order: 1, transparent: true, depth: 3 }),
      item({ order: 2, transparent: true, depth: 3 }),
    ];
    sortDraws(items, 'all');
    expect(shape(items)).toEqual(['0:0:3:T#0', '0:0:3:T#1', '0:0:3:T#2']);
  });

  it("'opaque'：只在不透明物的连续段内排序，半透明物既不参与也不被跨越", () => {
    const items = [
      item({ order: 0, pipeline: 3, depth: 1 }),
      item({ order: 1, pipeline: 1, depth: 2 }),
      // 半透明物是段边界：它前面的两段不透明物绝不越过它。
      item({ order: 2, transparent: true, depth: 4 }),
      item({ order: 3, pipeline: 5, depth: 1 }),
      item({ order: 4, pipeline: 2, depth: 2 }),
      item({ order: 5, transparent: true, depth: 9 }),
      item({ order: 6, pipeline: 4, depth: 0 }),
    ];
    sortDraws(items, 'opaque');

    // 半透明物仍然待在下标 2 与 5：位置（以及它与其它元素的先后关系）完全没动。
    expect(items[2]!.transparent).toBe(true);
    expect(items[2]!.order).toBe(2);
    expect(items[5]!.transparent).toBe(true);
    expect(items[5]!.order).toBe(5);

    // 段内排序生效：[0,1] 与 [3,4] 各自按管线号升序；末尾 [6] 只有一个元素。
    expect(items[0]!.order).toBe(1);
    expect(items[1]!.order).toBe(0);
    expect(items[3]!.order).toBe(4);
    expect(items[4]!.order).toBe(3);
    expect(items[6]!.order).toBe(6);
  });

  it("'opaque'：全是半透明物时完全不动", () => {
    const items = [
      item({ order: 0, transparent: true, pipeline: 2 }),
      item({ order: 1, transparent: true, pipeline: 1 }),
    ];
    sortDraws(items, 'opaque');
    expect(shape(items)).toEqual(['2:0:0:T#0', '1:0:0:T#1']);
  });

  it('比较函数把提交顺序当最后一级（不会把相等的项打乱）', () => {
    const a = item({ order: 1, pipeline: 0, bindings: 0, depth: 1 });
    const b = item({ order: 2, pipeline: 0, bindings: 0, depth: 1 });
    expect(compareOpaque(a, b)).toBeLessThan(0);
    expect(compareTransparent(a, b)).toBeLessThan(0);

    // 半透明只比深度：管线号更大的那个仍然先出（因为它更远）。
    const far = item({ order: 0, transparent: true, pipeline: 9, depth: 10 });
    const near = item({ order: 1, transparent: true, pipeline: 1, depth: 1 });
    expect(compareTransparent(far, near)).toBeLessThan(0);
    // 不透明则先比管线。
    expect(compareOpaque(near, far)).toBeLessThan(0);
  });

  it('空数组与单元素数组不会出问题', () => {
    const empty: SortableDraw[] = [];
    sortDraws(empty, 'all');
    expect(empty).toEqual([]);
    const single = [item({ order: 0 })];
    sortDraws(single, 'all');
    expect(single).toHaveLength(1);
  });
});
