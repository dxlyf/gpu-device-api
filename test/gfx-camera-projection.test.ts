/**
 * gfx 相机的投影矩阵语义（这一轮从「同时算两套」改成「只算一份、按 `depthRange` 选函数」）。
 *
 * 要钉死三件事：
 *
 * 1. **只有一份**：`projectionMatrix` 按 `depthRange` 选 `mat4.perspective` / `mat4.perspectiveZO`
 *    （正交是 `mat4.ortho` / `mat4.orthoZO`）算出来，`projectionViewMatrix` 与它同源；
 * 2. **切换 `depthRange` 后缓存失效**：哪怕中间没有调用 `update()`，读到的也必须是新约定算出来的
 *    那一份 —— 绝不能把「上一种约定留下的那一份」静默交出去；
 * 3. **改 `fov` / `size` 之后 `update()` 一定重算**：不存在「参数变了但命中旧缓存」的路径。
 *
 * 另外钉住公开面的收窄：原来的 `projectionMatrixGL` / `projectionMatrixZO` 两个属性已经不存在
 * （`Camera.ts` 之外没有任何引用，删掉它们不破坏本仓库）。
 */

import { describe, expect, it } from 'vitest';

import { OrthographicCamera, PerspectiveCamera } from '../src/gfx/Camera.js';
import { degToRad, mat4 } from '../src/utils/math/index.js';

/** 逐元素严格相等（两侧都是同一套数学函数算出来的 Float32，不需要容差）。 */
function expectSameMatrix(actual: ArrayLike<number>, expected: ArrayLike<number>): void {
  expect(Array.from(actual)).toEqual(Array.from(expected));
}

describe('gfx Camera：只算一份投影矩阵（按 depthRange 选函数）', () => {
  it('PerspectiveCamera：gl → mat4.perspective，zo → mat4.perspectiveZO', () => {
    const camera = new PerspectiveCamera({ fov: 45, aspect: 1.5, near: 0.5, far: 50 });
    expect(camera.depthRange).toBe('gl');

    const expectedGL = mat4.create();
    mat4.perspective(expectedGL, degToRad(45), 1.5, 0.5, 50);
    expectSameMatrix(camera.projectionMatrix, expectedGL);

    // 只改 depthRange、**不调用 update()**：缓存必须已经失效。
    camera.depthRange = 'zo';
    const expectedZO = mat4.create();
    mat4.perspectiveZO(expectedZO, degToRad(45), 1.5, 0.5, 50);
    expectSameMatrix(camera.projectionMatrix, expectedZO);
    expect(Array.from(expectedZO)).not.toEqual(Array.from(expectedGL));

    // projectionView 与投影同源（同一份矩阵、同一次刷新）。
    const expectedView = mat4.create();
    mat4.multiply(expectedView, expectedZO, camera.viewMatrix);
    expectSameMatrix(camera.projectionViewMatrix, expectedView);

    // 切回去同样立刻生效。
    camera.depthRange = 'gl';
    expectSameMatrix(camera.projectionMatrix, expectedGL);
  });

  it('OrthographicCamera：gl → mat4.ortho，zo → mat4.orthoZO', () => {
    const camera = new OrthographicCamera({ size: 4, aspect: 2, near: 0.1, far: 100 });
    const halfHeight = 2;
    const halfWidth = 4;

    const expectedGL = mat4.create();
    mat4.ortho(expectedGL, -halfWidth, halfWidth, -halfHeight, halfHeight, 0.1, 100);
    expectSameMatrix(camera.projectionMatrix, expectedGL);

    camera.depthRange = 'zo';
    const expectedZO = mat4.create();
    mat4.orthoZO(expectedZO, -halfWidth, halfWidth, -halfHeight, halfHeight, 0.1, 100);
    expectSameMatrix(camera.projectionMatrix, expectedZO);
    expect(Array.from(expectedZO)).not.toEqual(Array.from(expectedGL));
  });

  it('projectionMatrix / projectionViewMatrix 的对象身份稳定（同一份缓冲，反复读是同一个数组）', () => {
    const camera = new PerspectiveCamera();
    const projection = camera.projectionMatrix;
    const projectionView = camera.projectionViewMatrix;

    expect(camera.projectionMatrix).toBe(projection);
    expect(camera.projectionViewMatrix).toBe(projectionView);

    // 切约定、再 update()：还是同一块缓冲，只是内容被重算。
    camera.depthRange = 'zo';
    camera.update();
    expect(camera.projectionMatrix).toBe(projection);
    expect(camera.projectionViewMatrix).toBe(projectionView);
    // 同一份缓冲能直接上传 uniform（身份稳定是它的价值）。
    expect(projection).toBeInstanceOf(Float32Array);
    expect(projectionView).toBeInstanceOf(Float32Array);
  });

  it('改 fov / aspect / near / far 之后 update() 一定重算（没有「命中旧缓存」的路径）', () => {
    const camera = new PerspectiveCamera({ fov: 60, aspect: 1, near: 0.1, far: 100 });
    const before = Array.from(camera.projectionMatrix);

    camera.fov = 30;
    camera.aspect = 2;
    camera.update();

    const expected = mat4.create();
    mat4.perspective(expected, degToRad(30), 2, 0.1, 100);
    expectSameMatrix(camera.projectionMatrix, expected);
    expect(Array.from(camera.projectionMatrix)).not.toEqual(before);

    // 正交相机同理（改 size）。
    const ortho = new OrthographicCamera({ size: 2, aspect: 1 });
    const orthoBefore = Array.from(ortho.projectionMatrix);
    ortho.size = 8;
    ortho.update();
    const expectedOrtho = mat4.create();
    mat4.ortho(expectedOrtho, -4, 4, -4, 4, ortho.near, ortho.far);
    expectSameMatrix(ortho.projectionMatrix, expectedOrtho);
    expect(Array.from(ortho.projectionMatrix)).not.toEqual(orthoBefore);
  });

  it('公开面收窄：projectionMatrixGL / projectionMatrixZO 两个属性已经不存在', () => {
    const perspective = new PerspectiveCamera();
    const orthographic = new OrthographicCamera();
    expect('projectionMatrixGL' in perspective).toBe(false);
    expect('projectionMatrixZO' in perspective).toBe(false);
    expect('projectionMatrixGL' in orthographic).toBe(false);
    expect('projectionMatrixZO' in orthographic).toBe(false);
  });

  it('同一取值重复赋给 depthRange 不会让缓存来回失效（切回去仍然正确）', () => {
    const camera = new OrthographicCamera({ size: 2 });
    const glLike = Array.from(camera.projectionMatrix);
    camera.depthRange = 'zo';
    const zoLike = Array.from(camera.projectionMatrix);
    expect(zoLike).not.toEqual(glLike);
    camera.depthRange = 'gl';
    camera.depthRange = 'gl';
    expectSameMatrix(camera.projectionMatrix, glLike);
  });
});
