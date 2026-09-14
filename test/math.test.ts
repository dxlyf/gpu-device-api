import { describe, expect, it } from 'vitest';

import {
  DEG2RAD,
  EPSILON,
  box3,
  clamp,
  color,
  degToRad,
  euler,
  frustum,
  inverseLerp,
  lerp,
  mat3,
  mat4,
  plane,
  quat,
  radToDeg,
  ray,
  raycaster,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from '../src/utils/math/index.js';

/** 同时断言 16 个分量与期望值接近。 */
function expectMat4Close(actual: Float32Array, expected: number[], precision = 5): void {
  for (let i = 0; i < 16; i++) {
    expect(actual[i], `m[${i}]`).toBeCloseTo(expected[i]!, precision);
  }
}

/** 同时断言 3 个分量与期望值接近。 */
function expectVec3Close(actual: Float32Array, expected: readonly [number, number, number], precision = 5): void {
  expect(actual[0], 'x').toBeCloseTo(expected[0], precision);
  expect(actual[1], 'y').toBeCloseTo(expected[1], precision);
  expect(actual[2], 'z').toBeCloseTo(expected[2], precision);
}

/** 取 4x4 矩阵变换后的裁剪空间坐标，并做透视除法得到 NDC。 */
function projectToNdc(m: Float32Array, x: number, y: number, z: number): number[] {
  const clip = vec4.transformMat4(vec4.create(), vec4.fromValues(x, y, z, 1), m);
  const w = clip[3]! === 0 ? 1 : clip[3]!;
  return [clip[0]! / w, clip[1]! / w, clip[2]! / w];
}

describe('mat4 基本运算', () => {
  it('单位矩阵乘以任意矩阵都不改变它', () => {
    const a = mat4.fromRotationTranslationScale(
      mat4.create(),
      0.7,
      vec3.fromValues(1, 2, 3),
      vec3.fromValues(4, 5, 6),
      vec3.fromValues(2, 3, 4),
    );
    const out = mat4.create();
    mat4.multiply(out, mat4.create(), a);
    expect(mat4.equals(out, a)).toBe(true);
  });

  it('multiply 的结果等价于先施加右矩阵再施加左矩阵', () => {
    const t = mat4.fromTranslation(mat4.create(), vec3.fromValues(1, 0, 0));
    const s = mat4.fromScaling(mat4.create(), vec3.fromValues(2, 2, 2));
    const m = mat4.create();
    mat4.multiply(m, t, s);

    // 顶点先被 s 缩放再被 t 平移： (3,0,0) -> (6,0,0) -> (7,0,0)
    const point = vec3.transformMat4(vec3.create(), vec3.fromValues(3, 0, 0), m);
    expect(point[0]).toBeCloseTo(7, 5);
    expect(point[1]).toBeCloseTo(0, 5);
    expect(point[2]).toBeCloseTo(0, 5);
  });

  it('multiplyAll 按参数顺序连乘', () => {
    const t = mat4.fromTranslation(mat4.create(), vec3.fromValues(1, 0, 0));
    const s = mat4.fromScaling(mat4.create(), vec3.fromValues(2, 2, 2));
    const expected = mat4.multiply(mat4.create(), t, s);
    const actual = mat4.multiplyAll(mat4.create(), t, s);
    expect(mat4.equals(actual, expected)).toBe(true);
  });

  it('行列式对已知矩阵取到期望值', () => {
    // 缩放矩阵的行列式等于三个缩放系数之积。
    const s = mat4.fromScaling(mat4.create(), vec3.fromValues(2, 3, 4));
    expect(mat4.determinant(s)).toBeCloseTo(24, 5);

    // 旋转不改变体积，行列式为 1。
    const r = mat4.fromRotation(mat4.create(), 1.1, vec3.fromValues(0.3, 1, 0.2));
    expect(mat4.determinant(r)).toBeCloseTo(1, 5);
  });

  it('invert 求出的逆矩阵与自身相乘得到单位矩阵', () => {
    const m = mat4.fromRotationTranslationScale(
      mat4.create(),
      0.9,
      vec3.fromValues(0.2, 1, -0.4),
      vec3.fromValues(3, -2, 7),
      vec3.fromValues(1.5, 2, 0.5),
    );
    const inv = mat4.invert(mat4.create(), m);
    expect(inv).not.toBeNull();

    const product = mat4.multiply(mat4.create(), m, inv!);
    expectMat4Close(product, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  });

  it('奇异矩阵求逆返回 null，而不是悄悄给出零矩阵', () => {
    const singular = mat4.fromScaling(mat4.create(), vec3.fromValues(1, 0, 1));
    expect(mat4.invert(mat4.create(), singular)).toBeNull();
    expect(mat3.invert(mat3.create(), mat3.fromValues(1, 2, 3, 2, 4, 6, 7, 8, 9))).toBeNull();
  });

  it('transpose 两次回到原矩阵', () => {
    const m = mat4.fromRotationTranslationScale(
      mat4.create(),
      0.4,
      vec3.fromValues(1, 1, 0),
      vec3.fromValues(1, 2, 3),
      vec3.fromValues(1, 2, 3),
    );
    const roundTrip = mat4.transpose(mat4.create(), mat4.transpose(mat4.create(), m));
    expect(mat4.equals(roundTrip, m)).toBe(true);
  });
});

describe('mat4 相机矩阵', () => {
  it('perspective 把近平面的 z 映射到 -1，远平面映射到 +1（GL 约定）', () => {
    const near = 0.5;
    const far = 100;
    const p = mat4.perspective(mat4.create(), degToRad(60), 16 / 9, near, far);

    expect(projectToNdc(p, 0, 0, -near)[2]).toBeCloseTo(-1, 5);
    expect(projectToNdc(p, 0, 0, -far)[2]).toBeCloseTo(1, 5);
  });

  it('perspectiveZO 把近平面的 z 映射到 0，远平面映射到 +1（WebGPU 约定）', () => {
    const near = 0.5;
    const far = 100;
    const p = mat4.perspectiveZO(mat4.create(), degToRad(60), 16 / 9, near, far);

    expect(projectToNdc(p, 0, 0, -near)[2]).toBeCloseTo(0, 5);
    expect(projectToNdc(p, 0, 0, -far)[2]).toBeCloseTo(1, 5);
    // 两套约定的差异必须真实存在，否则测试没有意义。
    const gl = mat4.perspective(mat4.create(), degToRad(60), 16 / 9, near, far);
    expect(Math.abs(projectToNdc(gl, 0, 0, -near)[2]! - projectToNdc(p, 0, 0, -near)[2]!)).toBeGreaterThan(0.9);
  });

  it('perspectiveZO 支持无限远平面', () => {
    const near = 1;
    const p = mat4.perspectiveZO(mat4.create(), degToRad(45), 1, near, Infinity);
    expect(projectToNdc(p, 0, 0, -near)[2]).toBeCloseTo(0, 5);
    // 无限远时深度单调逼近 1。
    expect(projectToNdc(p, 0, 0, -1e6)[2]).toBeCloseTo(1, 4);
  });

  it('orthoZO 把 near 映射到 0，far 映射到 1', () => {
    const o = mat4.orthoZO(mat4.create(), -1, 1, -1, 1, 1, 10);
    expect(projectToNdc(o, 0, 0, -1)[2]).toBeCloseTo(0, 5);
    expect(projectToNdc(o, 0, 0, -10)[2]).toBeCloseTo(1, 5);
  });

  it('lookAt 把视线中心投影到画面正中', () => {
    const eye = vec3.fromValues(0, 0, 5);
    const center = vec3.fromValues(0, 0, 0);
    const up = vec3.fromValues(0, 1, 0);

    const view = mat4.lookAt(mat4.create(), eye, center, up);
    const proj = mat4.perspective(mat4.create(), degToRad(60), 1, 0.1, 100);
    const viewProj = mat4.multiply(mat4.create(), proj, view);

    const ndc = projectToNdc(viewProj, 0, 0, 0);
    expect(ndc[0]).toBeCloseTo(0, 5);
    expect(ndc[1]).toBeCloseTo(0, 5);

    // 相机放在 +Z，所以原点应该在视线前方（视空间 z 为负）。
    const viewPoint = vec3.transformMat4(vec3.create(), center, view);
    expect(viewPoint[2]).toBeCloseTo(-5, 5);
  });

  it('lookAt 在朝向右上方的场景下仍然把目标点放在正中', () => {
    const eye = vec3.fromValues(3, 4, 5);
    const center = vec3.fromValues(1, 1, 1);
    const view = mat4.lookAt(mat4.create(), eye, center, vec3.fromValues(0, 1, 0));
    const proj = mat4.perspectiveZO(mat4.create(), degToRad(45), 1.5, 0.1, 100);
    const viewProj = mat4.multiply(mat4.create(), proj, view);
    const ndc = projectToNdc(viewProj, center[0]!, center[1]!, center[2]!);
    expect(ndc[0]).toBeCloseTo(0, 4);
    expect(ndc[1]).toBeCloseTo(0, 4);
  });

  it('lookAt 在相机与目标重合时退化为零矩阵', () => {
    const eye = vec3.fromValues(1, 1, 1);
    const m = mat4.lookAt(mat4.create(), eye, vec3.fromValues(1, 1, 1), vec3.fromValues(0, 1, 0));
    expect(mat4.determinant(m)).toBe(0);
  });
});

describe('mat4 分解', () => {
  it('getTranslation / getScaling 能从 TRS 矩阵里取回原始分量', () => {
    const translation = vec3.fromValues(3, -4, 5);
    const scaling = vec3.fromValues(2, 3, 4);
    const m = mat4.fromRotationTranslationScale(
      mat4.create(),
      0.8,
      vec3.fromValues(0, 1, 0),
      translation,
      scaling,
    );

    const t = mat4.getTranslation(vec3.create(), m);
    const s = mat4.getScaling(vec3.create(), m);
    expect(vec3.equals(t, translation, 1e-5)).toBe(true);
    expect(vec3.equals(s, scaling, 1e-5)).toBe(true);
  });

  it('getRotation 去掉缩放后与原始旋转一致', () => {
    const rad = 1.2;
    const axis = vec3.fromValues(1, 1, 0);
    const rotations = mat4.fromRotation(mat4.create(), rad, axis);
    const scaled = mat4.scale(
      mat4.create(),
      rotations,
      vec3.fromValues(2, 3, 4),
    );

    const extracted = mat4.getRotation(mat3.create(), scaled);
    const expected = mat3.fromMat4(mat3.create(), rotations);
    for (let i = 0; i < 9; i++) {
      expect(extracted[i], `m[${i}]`).toBeCloseTo(expected[i]!, 4);
    }
  });
});

describe('mat3 法线矩阵', () => {
  it('非等比缩放时，用 normalFromMat4 变换后的法线仍然垂直于切线', () => {
    // 用非轴对齐的法线与切线，这样「直接乘模型矩阵」一定会出错。
    const normal = vec3.fromValues(1, 1, 0);
    const tangent = vec3.fromValues(1, -1, 0);
    vec3.normalize(normal, normal);
    vec3.normalize(tangent, tangent);

    const model = mat4.fromScaling(mat4.create(), vec3.fromValues(1, 2, 1));

    const normalMatrix = mat3.normalFromMat4(mat3.create(), model)!;
    const transformedNormal = vec3.normalize(vec3.create(), vec3.transformMat3(vec3.create(), normal, normalMatrix));
    const transformedTangent = vec3.normalize(vec3.create(), vec3.transformMat4(vec3.create(), tangent, model));

    expect(Math.abs(vec3.dot(transformedNormal, transformedTangent))).toBeLessThan(1e-5);

    // 反例：直接乘模型矩阵的 3x3 部分会让法线歪掉，证明上面这个断言不是恒真的。
    const wrong = vec3.normalize(vec3.create(), vec3.transformDirection(vec3.create(), normal, model));
    expect(Math.abs(vec3.dot(wrong, transformedTangent))).toBeGreaterThan(0.5);
  });

  it('奇异矩阵返回 null（不影响调用方对失败分支的处理）', () => {
    const singular = mat4.fromScaling(mat4.create(), vec3.fromValues(1, 0, 1));
    expect(mat3.normalFromMat4(mat3.create(), singular)).toBeNull();
  });

  it('fromMat4 取的是左上角 3x3', () => {
    const m = mat4.fromRotationTranslationScale(
      mat4.create(),
      0.3,
      vec3.fromValues(0, 0, 1),
      vec3.fromValues(9, 9, 9),
      vec3.fromValues(1, 1, 1),
    );
    const m3 = mat3.fromMat4(mat3.create(), m);
    expect(m3[0]).toBeCloseTo(m[0]!, 6);
    expect(m3[4]).toBeCloseTo(m[5]!, 6);
    expect(m3[8]).toBeCloseTo(m[10]!, 6);
  });
});

describe('向量运算', () => {
  it('cross 遵循右手定则', () => {
    const x = vec3.fromValues(1, 0, 0);
    const y = vec3.fromValues(0, 1, 0);
    const z = vec3.cross(vec3.create(), x, y);
    expect(vec3.equals(z, vec3.fromValues(0, 0, 1), 1e-6)).toBe(true);
    // 交换顺序得到反向量。
    const negative = vec3.cross(vec3.create(), y, x);
    expect(vec3.equals(negative, vec3.fromValues(0, 0, -1), 1e-6)).toBe(true);
  });

  it('normalize 得到单位长度，零向量不产生 NaN', () => {
    const v = vec3.normalize(vec3.create(), vec3.fromValues(3, 4, 0));
    expect(vec3.length(v)).toBeCloseTo(1, 6);
    expect(v[0]).toBeCloseTo(0.6, 6);

    const zero = vec3.normalize(vec3.create(), vec3.create());
    expect(Number.isNaN(zero[0]!)).toBe(false);
    expect(vec3.length(zero)).toBe(0);
  });

  it('transformMat4 会做透视除法', () => {
    const p = mat4.perspective(mat4.create(), degToRad(90), 1, 1, 100);
    // 视空间 (0,0,-1) 正好在近平面上，除以 w 后 z 应为 -1。
    const result = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, -1), p);
    expect(result[2]).toBeCloseTo(-1, 5);
  });

  it('transformDirection 忽略平移', () => {
    const m = mat4.fromTranslation(mat4.create(), vec3.fromValues(100, 200, 300));
    const d = vec3.transformDirection(vec3.create(), vec3.fromValues(1, 2, 3), m);
    expect(vec3.equals(d, vec3.fromValues(1, 2, 3), 1e-6)).toBe(true);
  });

  it('vec2 的二维仿射变换包含平移项', () => {
    // 平移 (10, 20) 的 3x3 矩阵，平移量在第三列。
    const m = mat3.fromValues(1, 0, 0, 0, 1, 0, 10, 20, 1);
    const out = vec2.transformMat3(vec2.create(), vec2.fromValues(1, 2), m);
    expect(out[0]).toBeCloseTo(11, 6);
    expect(out[1]).toBeCloseTo(22, 6);
  });

  it('reflect 关于单位法线对称', () => {
    const n = vec3.fromValues(0, 1, 0);
    const incoming = vec3.normalize(vec3.create(), vec3.fromValues(1, -1, 0));
    const reflected = vec3.reflect(vec3.create(), incoming, n);
    expect(reflected[0]).toBeCloseTo(incoming[0]!, 6);
    expect(reflected[1]).toBeCloseTo(-incoming[1]!, 6);
  });

  it('原地运算（out 与输入同一对象）结果正确', () => {
    const a = vec3.fromValues(1, 2, 3);
    vec3.add(a, a, a);
    expect(vec3.equals(a, vec3.fromValues(2, 4, 6), 1e-6)).toBe(true);

    // m = 缩放 2 倍；m * m = 缩放 4 倍（不是 8 倍，因为只乘了一次）。
    const m = mat4.fromScaling(mat4.create(), vec3.fromValues(2, 2, 2));
    mat4.multiply(m, m, m);
    const point = vec3.transformMat4(vec3.create(), vec3.fromValues(1, 1, 1), m);
    expect(point[0]).toBeCloseTo(4, 5);
  });
});

describe('标量工具', () => {
  it('角度与弧度互转', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
    expect(90 * DEG2RAD).toBeCloseTo(Math.PI / 2, 10);
  });

  it('clamp / lerp / inverseLerp / smoothstep', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(lerp(0, 10, 0.25)).toBeCloseTo(2.5, 6);
    expect(inverseLerp(0, 10, 5)).toBeCloseTo(0.5, 6);
    expect(inverseLerp(0, 10, 20)).toBe(1);
    expect(inverseLerp(3, 3, 3)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(EPSILON).toBeGreaterThan(0);
  });
});

describe('四元数', () => {
  it('单位四元数不改变向量', () => {
    const q = quat.create();
    expect(q[3]).toBe(1);
    expectVec3Close(quat.transformVec3(vec3.create(), q, vec3.fromValues(1, 2, 3)), [1, 2, 3]);
  });

  it('绕轴旋转遵循右手定则', () => {
    // 绕 +Z 转 90°：+X → +Y
    const q = quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), Math.PI / 2);
    expectVec3Close(quat.transformVec3(vec3.create(), q, vec3.fromValues(1, 0, 0)), [0, 1, 0]);
    // 绕 +X 转 90°：+Y → +Z
    const aboutX = quat.rotateX(quat.create(), quat.create(), Math.PI / 2);
    expectVec3Close(quat.transformVec3(vec3.create(), aboutX, vec3.fromValues(0, 1, 0)), [0, 0, 1]);
  });

  it('乘法顺序与 mat4.multiply 一致：先施加右边的旋转', () => {
    const aboutZ = quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), Math.PI / 2);
    const aboutX = quat.setAxisAngle(quat.create(), vec3.fromValues(1, 0, 0), Math.PI / 2);
    // q = aboutZ * aboutX ⇒ 先绕 X 再绕 Z
    const combined = quat.multiply(quat.create(), aboutZ, aboutX);
    const v = vec3.fromValues(0, 1, 0);
    const viaQuat = quat.transformVec3(vec3.create(), combined, v);

    // 用矩阵做同样的两步，结果必须一致。
    const mz = mat4.fromZRotation(mat4.create(), Math.PI / 2);
    const mx = mat4.fromXRotation(mat4.create(), Math.PI / 2);
    const m = mat4.multiply(mat4.create(), mz, mx);
    expectVec3Close(viaQuat, Array.from(vec3.transformMat4(vec3.create(), v, m)) as unknown as [number, number, number]);
  });

  it('toMat4 与 mat4 的旋转矩阵一致', () => {
    const q = quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), 0.9);
    expectMat4Close(quat.toMat4(mat4.create(), q), Array.from(mat4.fromZRotation(mat4.create(), 0.9)));
  });

  it('setFromRotationMatrix 与 toMat4 互为逆运算', () => {
    const original = mat4.fromYRotation(mat4.create(), 0.7);
    const q = quat.setFromRotationMatrix(quat.create(), original);
    expectMat4Close(quat.toMat4(mat4.create(), q), Array.from(original), 4);
  });

  it('invert / conjugate 给出反向旋转', () => {
    const q = quat.setAxisAngle(quat.create(), vec3.normalize(vec3.create(), vec3.fromValues(1, 2, 3)), 1.1);
    const inverse = quat.invert(quat.create(), q);
    expectVec3Close(quat.transformVec3(vec3.create(), inverse, quat.transformVec3(vec3.create(), q, vec3.fromValues(4, -2, 7))), [4, -2, 7]);
    expect(quat.equals(inverse, quat.conjugate(quat.create(), q), 1e-6)).toBe(true);
    expect(quat.length(quat.normalize(quat.create(), quat.fromValues(0, 0, 0, 5)))!).toBeCloseTo(1, 6);
  });

  it('slerp 给出恒定角速度的中间朝向', () => {
    const from = quat.create();
    const to = quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), Math.PI / 2);
    const middle = quat.slerp(quat.create(), from, to, 0.5);
    // 一半的角度（45°）作用在 +X 上
    expectVec3Close(
      quat.transformVec3(vec3.create(), middle, vec3.fromValues(1, 0, 0)),
      [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0],
    );
  });

  it('setFromUnitVectors 能把一个单位向量转到另一个', () => {
    const q = quat.setFromUnitVectors(quat.create(), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 1, 0));
    expectVec3Close(quat.transformVec3(vec3.create(), q, vec3.fromValues(1, 0, 0)), [0, 1, 0]);

    // 反向（夹角 180°）时旋转轴不唯一，但必须仍然是有效旋转。
    const opposite = quat.setFromUnitVectors(quat.create(), vec3.fromValues(1, 0, 0), vec3.fromValues(-1, 0, 0));
    expectVec3Close(quat.transformVec3(vec3.create(), opposite, vec3.fromValues(1, 0, 0)), [-1, 0, 0]);
  });
});

describe('欧拉角', () => {
  it('单个轴的欧拉角与 mat4 的对应旋转一致', () => {
    expectMat4Close(
      euler.toMat4(mat4.create(), euler.create(0, 0.6, 0, 'XYZ')),
      Array.from(mat4.fromYRotation(mat4.create(), 0.6)),
    );
  });

  it('toQuaternion 与 toMat4 表示同一个旋转', () => {
    const e = euler.create(0.3, -0.5, 0.9, 'XYZ');
    const viaQuat = quat.toMat4(mat4.create(), euler.toQuaternion(quat.create(), e));
    expectMat4Close(viaQuat, Array.from(euler.toMat4(mat4.create(), e)), 5);
  });

  it('每种 order 都能从四元数还原出同一个旋转', () => {
    for (const order of ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'] as const) {
      const original = euler.create(0.31, -0.47, 0.62, order);
      const q = euler.toQuaternion(quat.create(), original);
      // `fromQuaternion` 按 out.order 解释，所以这里要用同一个 order 造输出对象。
      const restored = euler.fromQuaternion(euler.create(0, 0, 0, order), q);
      expect(restored.order).toBe(order);
      expectMat4Close(
        euler.toMat4(mat4.create(), restored),
        Array.from(euler.toMat4(mat4.create(), original)),
        4,
      );
    }
  });

  it('万向锁位置（中间轴 ±90°）不产生 NaN', () => {
    const locked = euler.create(0, Math.PI / 2, 0.7, 'XYZ');
    const q = euler.toQuaternion(quat.create(), locked);
    const restored = euler.fromQuaternion(euler.create(), q);
    expect(Number.isFinite(restored.x)).toBe(true);
    expect(Number.isFinite(restored.y)).toBe(true);
    expect(Number.isFinite(restored.z)).toBe(true);
    // 万向锁附近欧拉角本身是病态的（asin 在 1 附近导数趋于无穷），
    // 加上中间结果存在 Float32 里，角度还原会有 ~1e-3 量级的偏差 —— 这里只要求旋转大致一致。
    expectMat4Close(euler.toMat4(mat4.create(), restored), Array.from(euler.toMat4(mat4.create(), locked)), 2);
  });

  it('fromRotationMatrix 与 toMat4 互为逆运算（按 order 解释）', () => {
    const original = euler.create(0.2, 0.4, -0.3, 'YXZ');
    const m = euler.toMat4(mat4.create(), original);
    const restored = euler.fromRotationMatrix(euler.create(0, 0, 0, 'YXZ'), m);
    expectMat4Close(euler.toMat4(mat4.create(), restored), Array.from(m), 4);
  });

  it('clone / copy / equals 按分量与顺序比较', () => {
    const a = euler.create(0.1, 0.2, 0.3, 'ZYX');
    const b = euler.clone(a);
    expect(euler.equals(a, b)).toBe(true);
    const c = euler.create(0, 0, 0, 'ZYX');
    euler.copy(c, a);
    expect(euler.equals(a, c)).toBe(true);
    expect(euler.equals(a, euler.create(0.1, 0.2, 0.3, 'XYZ'))).toBe(false);
  });
});

describe('平面', () => {
  it('三点构造出正确的法线与 constant', () => {
    const p = plane.setFromCoplanarPoints(
      plane.create(),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(1, 0, 0),
      vec3.fromValues(0, 1, 0),
    )!;
    expectVec3Close(p.normal, [0, 0, 1]);
    expect(p.constant).toBeCloseTo(0, 6);
    // 法线一侧为正
    expect(plane.distanceToPoint(p, vec3.fromValues(0, 0, 2))).toBeCloseTo(2, 6);
    expect(plane.distanceToPoint(p, vec3.fromValues(0, 0, -2))).toBeCloseTo(-2, 6);
  });

  it('三点共线时返回 null', () => {
    expect(
      plane.setFromCoplanarPoints(
        plane.create(),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(1, 1, 1),
        vec3.fromValues(2, 2, 2),
      ),
    ).toBeNull();
  });

  it('由「法线 + 平面上一点」构造', () => {
    const p = plane.setFromNormalAndCoplanarPoint(
      plane.create(),
      vec3.fromValues(0, 1, 0),
      vec3.fromValues(0, 5, 0),
    );
    expectVec3Close(p.normal, [0, 1, 0]);
    expect(p.constant).toBeCloseTo(-5, 6);
    expect(plane.distanceToPoint(p, vec3.fromValues(0, 3, 0))).toBeCloseTo(-2, 6);
    expectVec3Close(plane.coplanarPoint(vec3.create(), p), [0, 5, 0]);
  });

  it('projectPoint / translate / normalize', () => {
    const ground = plane.create(0, 1, 0, 0);
    expectVec3Close(plane.projectPoint(vec3.create(), ground, vec3.fromValues(2, 3, 4)), [2, 0, 4]);

    const up = plane.translate(plane.create(), ground, vec3.fromValues(0, 5, 0));
    expect(up.constant).toBeCloseTo(-5, 6);
    expect(plane.distanceToPoint(up, vec3.fromValues(0, 5, 0))).toBeCloseTo(0, 6);

    // 非单位法线归一化后，距离才是真的距离。
    const scaled = plane.create(0, 0, 2, 4);
    const normalized = plane.normalize(plane.create(), scaled)!;
    expectVec3Close(normalized.normal, [0, 0, 1]);
    expect(normalized.constant).toBeCloseTo(2, 6);
    expect(plane.distanceToPoint(normalized, vec3.fromValues(0, 0, 1))).toBeCloseTo(3, 6);
    expect(plane.normalize(plane.create(), plane.create(0, 0, 0, 1))).toBeNull();
  });

  it('线段与平面求交', () => {
    const ground = plane.create(0, 1, 0, 0);
    const t = plane.intersectLineSegment(ground, vec3.fromValues(0, -1, 0), vec3.fromValues(0, 1, 0));
    expect(t).toBeCloseTo(0.5, 6);
    expect(
      plane.intersectLineSegment(ground, vec3.fromValues(0, 1, 0), vec3.fromValues(0, 2, 0)),
    ).toBeNull();
  });

  it('applyMat4 用逆转置变换法线', () => {
    const ground = plane.create(0, 1, 0, 0);
    const moved = plane.applyMat4(plane.create(), ground, mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 5, 0)));
    expect(plane.distanceToPoint(moved, vec3.fromValues(0, 5, 0))).toBeCloseTo(0, 5);
    expect(plane.distanceToPoint(moved, vec3.fromValues(0, 0, 0))).toBeCloseTo(-5, 5);

    // 退化矩阵必须报错，而不是给一个错的结果。
    const singular = mat4.fromScaling(mat4.create(), vec3.fromValues(0, 1, 1));
    expect(() => plane.applyMat4(plane.create(), ground, singular)).toThrowError(RangeError);
  });
});

describe('射线', () => {
  it('at / distanceToPoint / closestPointToPoint', () => {
    const a = ray.create();
    expectVec3Close(ray.at(vec3.create(), a, 2), [0, 0, -2]);
    expect(ray.distanceToPoint(a, vec3.fromValues(0, 3, 0))).toBeCloseTo(3, 6);
    // 射线不向反方向延伸，所以 (-5,0,0) 到射线的最近点就是起点。
    expect(ray.distanceToPoint(a, vec3.fromValues(-5, 0, 0))).toBeCloseTo(5, 6);

    // 沿 +X 的射线：最近点就是把点投影到射线上（t < 0 时夹到起点）。
    const xRay = ray.create(0, 0, 0, 1, 0, 0);
    expectVec3Close(ray.closestPointToPoint(vec3.create(), xRay, vec3.fromValues(3, 4, 0)), [3, 0, 0]);
    expectVec3Close(ray.closestPointToPoint(vec3.create(), xRay, vec3.fromValues(-5, 0, 0)), [0, 0, 0]);
    expect(ray.distanceToPoint(xRay, vec3.fromValues(3, 4, 0))).toBeCloseTo(4, 6);
  });

  it('与球求交', () => {
    const a = ray.create();
    expect(ray.intersectSphere(a, vec3.fromValues(0, 0, -10), 1)).toBeCloseTo(9, 6);
    expect(ray.intersectSphere(a, vec3.fromValues(0, 5, -10), 1)).toBeNull();
    // 起点在球内：返回出射点
    expect(ray.intersectSphere(a, vec3.fromValues(0, 0, -0.5), 1)).toBeCloseTo(1.5, 6);
    // 球在射线背后
    expect(ray.intersectSphere(a, vec3.fromValues(0, 0, 10), 1)).toBeNull();
  });

  it('与包围盒求交（slab）', () => {
    const a = ray.create(0, 0, 5, 0, 0, -1);
    const box = box3.set(box3.create(), vec3.fromValues(-1, -1, -1), vec3.fromValues(1, 1, 1));
    expect(ray.intersectBox(a, box)).toBeCloseTo(4, 6);
    // 起点在盒内
    expect(ray.intersectBox(ray.create(0, 0, 0, 0, 0, -1), box)).toBeCloseTo(0, 6);
    // 从旁边掠过
    expect(ray.intersectBox(ray.create(3, 0, 5, 0, 0, -1), box)).toBeNull();
    // 空盒
    expect(ray.intersectBox(a, box3.create())).toBeNull();
  });

  it('与三角形求交（含背面剔除）', () => {
    const v0 = vec3.fromValues(0, 0, 0);
    const v1 = vec3.fromValues(1, 0, 0);
    const v2 = vec3.fromValues(0, 1, 0);
    const front = ray.create(0.25, 0.25, 5, 0, 0, -1);
    expect(ray.intersectTriangle(front, v0, v1, v2)).toBeCloseTo(5, 5);
    expect(ray.intersectTriangle(ray.create(1.5, 1.5, 5, 0, 0, -1), v0, v1, v2)).toBeNull();
    // 背面：默认双面可见，开剔除后不可见
    const back = ray.create(0.25, 0.25, -5, 0, 0, 1);
    expect(ray.intersectTriangle(back, v0, v1, v2)).toBeCloseTo(5, 5);
    expect(ray.intersectTriangle(back, v0, v1, v2, true)).toBeNull();
  });

  it('applyMat4 / recast', () => {
    const a = ray.create(0, 0, 0, 0, 0, -1);
    const rotated = ray.applyMat4(ray.create(), a, mat4.fromYRotation(mat4.create(), Math.PI / 2));
    // 绕 +Y 转 90°：(0,0,-1) → (-1,0,0)
    expectVec3Close(rotated.direction, [-1, 0, 0]);
    expect(Math.hypot(rotated.direction[0]!, rotated.direction[1]!, rotated.direction[2]!)).toBeCloseTo(1, 6);

    const advanced = ray.recast(ray.create(), a, 3);
    expectVec3Close(advanced.origin, [0, 0, -3]);
    expectVec3Close(advanced.direction, [0, 0, -1]);
    expect(ray.isWellFormed(a)).toBe(true);
    expect(ray.isWellFormed(ray.create(0, 0, 0, 0, 0, 0))).toBe(false);
  });
});

describe('包围盒', () => {
  it('空盒与逐点扩展', () => {
    const box = box3.create();
    expect(box3.isEmpty(box)).toBe(true);
    box3.expandByPoint(box, vec3.fromValues(1, 2, 3));
    box3.expandByPoint(box, vec3.fromValues(-2, 0, 4));
    expect(box3.isEmpty(box)).toBe(false);
    expectVec3Close(box.min, [-2, 0, 3]);
    expectVec3Close(box.max, [1, 2, 4]);
    expectVec3Close(box3.getCenter(vec3.create(), box), [-0.5, 1, 3.5]);
    expectVec3Close(box3.getSize(vec3.create(), box), [3, 2, 1]);
  });

  it('setFromArray 从扁平顶点数据求包围盒', () => {
    const positions = new Float32Array([0, 0, 0, 2, 1, -1, -1, 3, 0.5]);
    const box = box3.setFromArray(box3.create(), positions);
    expectVec3Close(box.min, [-1, 0, -1]);
    expectVec3Close(box.max, [2, 3, 0.5]);
  });

  it('包含 / 相交 / 距离 / 夹紧', () => {
    const unit = box3.set(box3.create(), vec3.fromValues(-1, -1, -1), vec3.fromValues(1, 1, 1));
    expect(box3.containsPoint(unit, vec3.fromValues(0.5, 0.5, 0.5))).toBe(true);
    expect(box3.containsPoint(unit, vec3.fromValues(1.5, 0, 0))).toBe(false);
    expect(box3.distanceToPoint(unit, vec3.fromValues(3, 0, 0))).toBeCloseTo(2, 6);
    expect(box3.distanceToPoint(unit, vec3.fromValues(0, 0, 0))).toBeCloseTo(0, 6);
    expectVec3Close(box3.clampPoint(vec3.create(), unit, vec3.fromValues(3, 0, -5)), [1, 0, -1]);

    const shifted = box3.set(box3.create(), vec3.fromValues(0, 0, 0), vec3.fromValues(2, 2, 2));
    expect(box3.intersectsBox(unit, shifted)).toBe(true);
    expect(box3.intersectsBox(unit, box3.translate(box3.create(), shifted, vec3.fromValues(10, 0, 0)))).toBe(false);
    expect(box3.intersectsSphere(unit, vec3.fromValues(2, 0, 0), 1.5)).toBe(true);
    expect(box3.intersectsSphere(unit, vec3.fromValues(2, 0, 0), 0.5)).toBe(false);
    expect(box3.containsBox(shifted, unit)).toBe(false);
  });

  it('并集 / 交集 / 外接球', () => {
    const a = box3.set(box3.create(), vec3.fromValues(-1, -1, -1), vec3.fromValues(0, 0, 0));
    const b = box3.set(box3.create(), vec3.fromValues(0, 0, 0), vec3.fromValues(1, 1, 1));
    const merged = box3.union(box3.create(), a, b);
    expectVec3Close(merged.min, [-1, -1, -1]);
    expectVec3Close(merged.max, [1, 1, 1]);
    const overlap = box3.intersect(box3.create(), a, b);
    expectVec3Close(overlap.min, [0, 0, 0]);
    expectVec3Close(overlap.max, [0, 0, 0]);
    expect(box3.isEmpty(box3.intersect(box3.create(), a, box3.translate(box3.create(), b, vec3.fromValues(5, 0, 0))))).toBe(true);

    const center = vec3.create();
    const radius = box3.getBoundingSphere(center, merged);
    expectVec3Close(center, [0, 0, 0]);
    expect(radius).toBeCloseTo(Math.sqrt(3), 5);
  });

  it('applyMat4 变换 8 个角点', () => {
    const unit = box3.set(box3.create(), vec3.fromValues(-1, -1, -1), vec3.fromValues(1, 1, 1));
    const moved = box3.applyMat4(box3.create(), unit, mat4.fromTranslation(mat4.create(), vec3.fromValues(5, 0, 0)));
    expectVec3Close(moved.min, [4, -1, -1]);
    expectVec3Close(moved.max, [6, 1, 1]);

    // 绕 Y 转 90° 后，原本沿 X 的跨度变成沿 Z。
    const thin = box3.set(box3.create(), vec3.fromValues(-2, -1, -0.5), vec3.fromValues(2, 1, 0.5));
    const rotated = box3.applyMat4(box3.create(), thin, mat4.fromYRotation(mat4.create(), Math.PI / 2));
    expectVec3Close(rotated.min, [-0.5, -1, -2]);
    expectVec3Close(rotated.max, [0.5, 1, 2]);
  });

  it('isEmpty / scaleBox / equals', () => {
    expect(box3.equals(box3.create(), box3.makeEmpty(box3.create()))).toBe(true);
    const unit = box3.set(box3.create(), vec3.fromValues(-1, -1, -1), vec3.fromValues(1, 1, 1));
    expectVec3Close(box3.scaleBox(box3.create(), unit, 2).max, [2, 2, 2]);
    // 负缩放后 min/max 必须自动换回来
    const flipped = box3.scaleBox(box3.create(), unit, -1);
    expectVec3Close(flipped.min, [-1, -1, -1]);
    expectVec3Close(flipped.max, [1, 1, 1]);
    expect(box3.equals(unit, flipped)).toBe(true);
  });
});

describe('视锥体', () => {
  const near = 1;
  const far = 101;
  const glProjection = mat4.perspective(mat4.create(), degToRad(90), 1, near, far);
  const zoProjection = mat4.perspectiveZO(mat4.create(), degToRad(90), 1, near, far);
  const identityView = mat4.create();

  it('按 GL 约定（z ∈ [-1, 1]）提取裁剪面', () => {
    const projectionView = mat4.multiply(mat4.create(), glProjection, identityView);
    const cone = frustum.setFromProjectionView(frustum.create(), projectionView, 'gl');

    // 相机看向 -Z：正前方在锥体内，背后的点在外面
    expect(frustum.containsPoint(cone, vec3.fromValues(0, 0, -50))).toBe(true);
    expect(frustum.containsPoint(cone, vec3.fromValues(0, 0, 50))).toBe(false);
    // 比近平面更近 / 比远平面更远
    expect(frustum.containsPoint(cone, vec3.fromValues(0, 0, -0.5))).toBe(false);
    expect(frustum.containsPoint(cone, vec3.fromValues(0, 0, -500))).toBe(false);
    // 侧向超出 FOV 90°（距离 10 时半宽 = 10）
    expect(frustum.containsPoint(cone, vec3.fromValues(0, 0, -10))).toBe(true);
    expect(frustum.containsPoint(cone, vec3.fromValues(30, 0, -10))).toBe(false);
  });

  it('GL 与 ZO 的近平面约定不同', () => {
    const projectionView = mat4.multiply(mat4.create(), glProjection, identityView);
    const glCone = frustum.setFromProjectionView(frustum.create(), projectionView, 'gl');
    const misread = frustum.setFromProjectionView(frustum.create(), projectionView, 'zo');
    // GL 近平面之外、深度中点之内：按 gl 在体内，按 zo 会被当成「比近平面还近」而剔除
    expect(frustum.containsPoint(glCone, vec3.fromValues(0, 0, -1.05))).toBe(true);
    expect(frustum.containsPoint(misread, vec3.fromValues(0, 0, -1.05))).toBe(false);

    // 用 ZO 投影矩阵 + 'zo' 约定时，同一个点又回到体内
    const zoCone = frustum.setFromProjectionView(
      frustum.create(),
      mat4.multiply(mat4.create(), zoProjection, identityView),
      'zo',
    );
    expect(frustum.containsPoint(zoCone, vec3.fromValues(0, 0, -1.05))).toBe(true);
  });

  it('球与盒的可见性判定', () => {
    const cone = frustum.setFromProjectionView(
      frustum.create(),
      mat4.multiply(mat4.create(), glProjection, identityView),
      'gl',
    );
    expect(frustum.intersectsSphere(cone, vec3.fromValues(0, 0, -20), 1)).toBe(true);
    expect(frustum.intersectsSphere(cone, vec3.fromValues(0, 0, 20), 1)).toBe(false);
    expect(frustum.intersectsSphere(cone, vec3.fromValues(100, 0, -20), 1)).toBe(false);

    const visible = box3.set(box3.create(), vec3.fromValues(-1, -1, -21), vec3.fromValues(1, 1, -19));
    const behind = box3.set(box3.create(), vec3.fromValues(-1, -1, 19), vec3.fromValues(1, 1, 21));
    expect(frustum.intersectsBox(cone, visible)).toBe(true);
    expect(frustum.intersectsBox(cone, behind)).toBe(false);
  });
});

describe('颜色', () => {
  it('hex 与 CSS 字符串互转', () => {
    const c = color.setHex(color.create(), 0xff8800);
    expect(c.r).toBeCloseTo(1, 6);
    expect(c.g).toBeCloseTo(0.5333333, 5);
    expect(c.b).toBeCloseTo(0, 6);
    expect(color.getHex(c)).toBe(0xff8800);
    expect(color.getStyle(c)).toBe('#ff8800');

    color.setStyle(c, '#f80');
    expect(color.getHex(c)).toBe(0xff8800);
    color.setStyle(c, 'rgb(255, 136, 0)');
    expect(color.getHex(c)).toBe(0xff8800);
    color.setStyle(c, 'rgba(255, 136, 0, 0.5)');
    expect(c.a).toBeCloseTo(0.5, 6);
    color.setStyle(c, '#ff880080');
    expect(c.a).toBeCloseTo(0.5019607, 5);
    color.setStyle(c, 'white');
    expect(color.getHex(c)).toBe(0xffffff);
    color.setStyle(c, 'transparent');
    expect(c.a).toBe(0);
  });

  it('无法解析的颜色抛 RangeError', () => {
    expect(() => color.setStyle(color.create(), 'not-a-color')).toThrowError(RangeError);
    expect(() => color.setStyle(color.create(), '#12345')).toThrowError(RangeError);
  });

  it('HSL 往返', () => {
    const c = color.create();
    color.setHSL(c, Math.PI / 3, 0.5, 0.4);
    const hsl = color.getHSL(new Float32Array(3), c);
    expect(hsl[0]).toBeCloseTo(Math.PI / 3, 4);
    expect(hsl[1]).toBeCloseTo(0.5, 4);
    expect(hsl[2]).toBeCloseTo(0.4, 4);
    // 饱和度 0 就是灰阶
    color.setHSL(c, 1.23, 0, 0.25);
    expect(c.r).toBeCloseTo(0.25, 6);
    expect(c.g).toBeCloseTo(0.25, 6);
    expect(c.b).toBeCloseTo(0.25, 6);
  });

  it('sRGB 与线性空间互转是往返一致的', () => {
    const srgb = color.setStyle(color.create(), '#804020');
    const linear = color.convertSRGBToLinear(color.create(), srgb);
    // 中灰附近线性值明显小于 sRGB 值
    expect(linear.r).toBeLessThan(srgb.r);
    const back = color.convertLinearToSRGB(color.create(), linear);
    expect(color.equals(back, srgb, 1e-5)).toBe(true);
    // 端点保持不变
    const black = color.convertSRGBToLinear(color.create(), color.create(0, 0, 0, 1));
    expect(black.r).toBe(0);
    const white = color.convertSRGBToLinear(color.create(), color.create(1, 1, 1, 1));
    expect(white.r).toBeCloseTo(1, 5);
  });

  it('插值 / 相乘 / 夹紧 / 数组互转', () => {
    const a = color.create(0, 0, 0, 1);
    const b = color.create(1, 0.5, 0.25, 0.5);
    const middle = color.lerp(color.create(), a, b, 0.5);
    expect(middle.r).toBeCloseTo(0.5, 6);
    expect(middle.g).toBeCloseTo(0.25, 6);
    expect(middle.b).toBeCloseTo(0.125, 6);
    expect(middle.a).toBeCloseTo(0.75, 6);

    const product = color.multiply(color.create(), color.create(0.5, 0.5, 0.5, 1), color.create(0.5, 1, 0.25, 1));
    expect(product.r).toBeCloseTo(0.25, 6);
    expect(product.g).toBeCloseTo(0.5, 6);
    expect(product.b).toBeCloseTo(0.125, 6);

    const out = color.toArray(b);
    expect(out.length).toBe(4);
    expect(color.fromArray(color.create(), out).b).toBeCloseTo(0.25, 6);

    const wild = color.clampColor(color.create(), color.create(2, -1, 0.5, 1.5));
    expect(wild.r).toBe(1);
    expect(wild.g).toBe(0);
    expect(wild.a).toBe(1);
    expect(color.isInGamut(wild)).toBe(true);
    expect(color.isInGamut(color.create(1.5, 0, 0, 1))).toBe(false);
  });
});

describe('射线拾取', () => {
  // z = 0 平面上的一个三角形（正对 +Z）
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);

  it('命中三角形并给出世界空间的距离与交点', () => {
    const rc = raycaster.set(raycaster.create(), vec3.fromValues(0.25, 0.25, 5), vec3.fromValues(0, 0, -1));
    const hits = raycaster.intersectTriangles(rc, positions);
    expect(hits.length).toBe(1);
    expect(hits[0]!.distance).toBeCloseTo(5, 5);
    expectVec3Close(hits[0]!.point, [0.25, 0.25, 0]);
    expect(hits[0]!.triangleIndex).toBe(0);
    expect(hits[0]!.vertexIndices).toEqual([0, 1, 2]);
  });

  it('模型矩阵参与时距离与交点都是世界空间的', () => {
    const rc = raycaster.set(raycaster.create(), vec3.fromValues(10.25, 0.25, 5), vec3.fromValues(0, 0, -1));
    const model = mat4.fromTranslation(mat4.create(), vec3.fromValues(10, 0, 0));
    const hits = raycaster.intersectTriangles(rc, positions, null, model);
    expect(hits.length).toBe(1);
    expect(hits[0]!.distance).toBeCloseTo(5, 4);
    expectVec3Close(hits[0]!.point, [10.25, 0.25, 0], 4);
  });

  it('near / far 与双面开关', () => {
    const rc = raycaster.set(raycaster.create(), vec3.fromValues(0.25, 0.25, 5), vec3.fromValues(0, 0, -1));
    rc.far = 3;
    expect(raycaster.intersectTriangles(rc, positions).length).toBe(0);
    rc.far = 10;
    expect(raycaster.intersectTriangles(rc, positions).length).toBe(1);

    // 从背面打过来：默认双面可见，关掉之后不可见
    const fromBehind = raycaster.set(raycaster.create(), vec3.fromValues(0.25, 0.25, -5), vec3.fromValues(0, 0, 1));
    expect(raycaster.intersectTriangles(fromBehind, positions).length).toBe(1);
    fromBehind.doubleSided = false;
    expect(raycaster.intersectTriangles(fromBehind, positions).length).toBe(0);
  });

  it('setFromNdc 反投影出正确的射线', () => {
    const projection = mat4.perspective(mat4.create(), degToRad(90), 1, 0.1, 100);
    const view = mat4.create();
    const inverse = raycaster.inverseProjectionViewOf(mat4.create(), projection, view)!;
    const rc = raycaster.setFromNdc(raycaster.create(), 0, 0, inverse, 'gl');
    // 屏幕中心：起点在近平面上，方向朝 -Z
    expectVec3Close(rc.ray.origin, [0, 0, -0.1], 4);
    expectVec3Close(rc.ray.direction, [0, 0, -1], 4);

    // z = -10 处放一个三角形，命中距离应为 9.9
    const far = new Float32Array([-1, -1, -10, 3, -1, -10, -1, 3, -10]);
    const hit = raycaster.intersectTrianglesFirst(rc, far);
    expect(hit).not.toBeNull();
    expect(hit!.distance).toBeCloseTo(9.9, 3);
    expectVec3Close(hit!.point, [0, 0, -10], 3);
  });

  it('与球 / 盒 / 平面求交也走 near-far 过滤', () => {
    const rc = raycaster.set(raycaster.create(), vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, -1));
    expect(raycaster.intersectSphere(rc, vec3.fromValues(0, 0, 0), 1)).toBeCloseTo(4, 5);
    expect(raycaster.intersectBox(rc, box3.set(box3.create(), vec3.fromValues(-1, -1, -1), vec3.fromValues(1, 1, 1)))).toBeCloseTo(4, 5);
    expect(raycaster.intersectPlane(rc, plane.create(0, 0, 1, 0))).toBeCloseTo(5, 5);
    rc.near = 4.5;
    expect(raycaster.intersectSphere(rc, vec3.fromValues(0, 0, 0), 1)).toBeNull();
  });
});
