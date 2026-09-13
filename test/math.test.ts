import { describe, expect, it } from 'vitest';

import {
  DEG2RAD,
  EPSILON,
  clamp,
  degToRad,
  inverseLerp,
  lerp,
  mat3,
  mat4,
  radToDeg,
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
