/**
 * 纯函数几何体生成器。
 *
 * 本模块零外部依赖，只用 `src/utils/math` 里的向量运算，输入参数全部是普通数字，
 * 输出是可以直接上传到 buffer 的 typed array。
 *
 * 统一约定：
 *
 * - 三角面网格返回 {@link ShapeData}：`position`（xyz）、`normal`（xyz）、`uv`、`indices`；
 *   线段返回 {@link LineData}：`position`（xyz，每两个顶点一条线段）与 `color`（rgba）。
 * - 坐标系是右手系。三角面绕序统一为 **CCW（逆时针）为正面**，也就是从物体外侧看过去
 *   顶点顺序是逆时针。
 * - 法线在写入时统一归一化，保证是单位向量；任何参数组合下都不会产生 NaN / Infinity。
 * - 退化参数（例如 `radialSegments < 3`、`width <= 0`、`divisions < 1`）**统一抛 RangeError**，
 *   不做静默夹紧。几何体的分段数写错时立刻失败，比悄悄给出一份残缺网格更容易定位。
 * - 分段数只改变顶点密度，不改变形状本身。每个函数上方都写明了「分段数到顶点数 / 索引数」
 *   的推导公式，索引数一律等于「三角形数乘 3」。
 */
import { vec3 } from '../utils/math/index.js';
/** 写入法线前先归一化用的临时向量。 */
const _normalScratch = vec3.create();
function createMesh() {
    return { position: [], normal: [], uv: [], index: [] };
}
function createLines() {
    return { position: [], color: [] };
}
/**
 * 写入一个顶点。法线会先归一化再写入，所以调用方可以放心传入未归一化的方向向量；
 * 长度为 0 的方向会被 `vec3.normalize` 写成零向量，不会产生 NaN。
 */
function pushVertex(mesh, x, y, z, nx, ny, nz, u, v) {
    vec3.set(_normalScratch, nx, ny, nz);
    vec3.normalize(_normalScratch, _normalScratch);
    mesh.position.push(x, y, z);
    mesh.normal.push(_normalScratch[0], _normalScratch[1], _normalScratch[2]);
    mesh.uv.push(u, v);
}
/** 写入一个线段顶点，颜色逐顶点保存。 */
function pushLineVertex(lines, x, y, z, r, g, b, a) {
    lines.position.push(x, y, z);
    lines.color.push(r, g, b, a);
}
function toShapeData(mesh) {
    return {
        position: Float32Array.from(mesh.position),
        normal: Float32Array.from(mesh.normal),
        uv: Float32Array.from(mesh.uv),
        indices: Uint32Array.from(mesh.index),
    };
}
function toLineData(lines) {
    return {
        position: Float32Array.from(lines.position),
        color: Float32Array.from(lines.color),
    };
}
/** 当前已经写入的顶点数（同时就是下一个顶点的索引）。 */
function vertexCount(mesh) {
    return mesh.position.length / 3;
}
function assertFinitePositive(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`[gpu-device-api] ${name} must be a finite positive number, got ${value}.`);
    }
    return value;
}
function assertFiniteNonNegative(value, name) {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`[gpu-device-api] ${name} must be a finite non-negative number, got ${value}.`);
    }
    return value;
}
function assertSegmentCount(value, minimum, name) {
    if (!Number.isInteger(value) || value < minimum) {
        throw new RangeError(`[gpu-device-api] ${name} must be an integer greater than or equal to ${minimum}, got ${value}.`);
    }
    return value;
}
/** 默认线段颜色（中灰）。 */
const DEFAULT_LINE_COLOR = [0.5, 0.5, 0.5, 1];
/**
 * 等边三角形，位于 XY 平面上、正面朝 +Z，几何中心在原点。
 *
 * 顶点数固定 3，索引数固定 3。三个顶点均匀分布在外接圆上（第一个顶点指向 +Y），
 * 因此从 +Z 方向看过去是 CCW。
 */
export function createTriangle(options = {}) {
    const radius = assertFinitePositive(options.radius ?? 0.5, 'options.radius');
    const mesh = createMesh();
    for (let corner = 0; corner < 3; corner++) {
        const angle = Math.PI / 2 + (corner * 2 * Math.PI) / 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        // 把外接圆内接正方形当作 uv 空间，保证 uv 落在 [0, 1]。
        pushVertex(mesh, x, y, 0, 0, 0, 1, x / (2 * radius) + 0.5, y / (2 * radius) + 0.5);
    }
    mesh.index.push(0, 1, 2);
    return toShapeData(mesh);
}
/**
 * XY 平面上的矩形，中心在原点，法线朝 +Z。
 *
 * 顶点数 = (widthSegments + 1) * (heightSegments + 1)。
 * 三角形数 = widthSegments * heightSegments * 2（每个网格单元两个三角形），
 * 索引数 = 三角形数 * 3。uv 沿 +X / +Y 线性铺满 [0, 1]。
 */
export function createPlane(options = {}) {
    const width = assertFinitePositive(options.width ?? 1, 'options.width');
    const height = assertFinitePositive(options.height ?? 1, 'options.height');
    const widthSegments = assertSegmentCount(options.widthSegments ?? 1, 1, 'options.widthSegments');
    const heightSegments = assertSegmentCount(options.heightSegments ?? 1, 1, 'options.heightSegments');
    const mesh = createMesh();
    const stride = widthSegments + 1;
    for (let iy = 0; iy <= heightSegments; iy++) {
        const v = iy / heightSegments;
        const y = -height / 2 + v * height;
        for (let ix = 0; ix <= widthSegments; ix++) {
            const u = ix / widthSegments;
            const x = -width / 2 + u * width;
            pushVertex(mesh, x, y, 0, 0, 0, 1, u, v);
        }
    }
    for (let iy = 0; iy < heightSegments; iy++) {
        for (let ix = 0; ix < widthSegments; ix++) {
            const a = iy * stride + ix;
            const b = a + 1;
            const c = a + stride + 1;
            const d = a + stride;
            // 先沿 +U 再沿 +V，cross(axisU, axisV) = +Z，符合 CCW。
            mesh.index.push(a, b, c, a, c, d);
        }
    }
    return toShapeData(mesh);
}
/**
 * 写入一个由 `axisU` / `axisV` 张成的矩形面（带分段）。
 *
 * `origin` 是 (u = 0, v = 0) 的那个角，两个轴向量是**整条边**的方向与长度，
 * 因此顶点位置 = origin + u * axisU + v * axisV。
 * 调用方必须保证 `cross(axisU, axisV)` 与 `normal` 同向，这样输出才是 CCW。
 */
function pushFace(mesh, origin, axisU, axisV, normal, segU, segV) {
    const base = vertexCount(mesh);
    const stride = segU + 1;
    for (let iv = 0; iv <= segV; iv++) {
        const v = iv / segV;
        for (let iu = 0; iu <= segU; iu++) {
            const u = iu / segU;
            pushVertex(mesh, origin[0] + axisU[0] * u + axisV[0] * v, origin[1] + axisU[1] * u + axisV[1] * v, origin[2] + axisU[2] * u + axisV[2] * v, normal[0], normal[1], normal[2], u, v);
        }
    }
    for (let iv = 0; iv < segV; iv++) {
        for (let iu = 0; iu < segU; iu++) {
            const a = base + iv * stride + iu;
            const b = a + 1;
            const c = a + stride + 1;
            const d = a + stride;
            mesh.index.push(a, b, c, a, c, d);
        }
    }
}
/**
 * 长方体，中心在原点，六个面各自持有独立顶点（法线朝外，不做顶点共享）。
 *
 * 记 w = widthSegments、h = heightSegments、d = depthSegments：
 *
 * - 每个面的顶点数 = (该面 U 方向分段数 + 1) * (该面 V 方向分段数 + 1)，
 *   六面合计 = 2 * [(d + 1)(h + 1) + (d + 1)(w + 1) + (h + 1)(w + 1)]；
 * - 每个面的三角形数 = 该面 segU * segV * 2，六面合计 **三角形数 = 4 * (w * h + w * d + h * d)**，
 *   索引数 = 三角形数 * 3。三个分段数都是 1 时就是经典的 12 个三角形。
 * - 每个面的 uv 都独立地铺满 [0, 1]，方便贴图。
 */
export function createBox(options = {}) {
    const width = assertFinitePositive(options.width ?? 1, 'options.width');
    const height = assertFinitePositive(options.height ?? 1, 'options.height');
    const depth = assertFinitePositive(options.depth ?? 1, 'options.depth');
    const widthSegments = assertSegmentCount(options.widthSegments ?? 1, 1, 'options.widthSegments');
    const heightSegments = assertSegmentCount(options.heightSegments ?? 1, 1, 'options.heightSegments');
    const depthSegments = assertSegmentCount(options.depthSegments ?? 1, 1, 'options.depthSegments');
    const hx = width / 2;
    const hy = height / 2;
    const hz = depth / 2;
    const mesh = createMesh();
    // 每个面的 axisU / axisV 都选取成 cross(axisU, axisV) 与该面外法线同向，
    // 于是 pushFace 内部的 (a, b, c) / (a, c, d) 从面外看过去一定是 CCW。
    pushFace(mesh, [hx, -hy, -hz], [0, height, 0], [0, 0, depth], [1, 0, 0], heightSegments, depthSegments);
    pushFace(mesh, [-hx, -hy, -hz], [0, 0, depth], [0, height, 0], [-1, 0, 0], depthSegments, heightSegments);
    pushFace(mesh, [-hx, hy, -hz], [0, 0, depth], [width, 0, 0], [0, 1, 0], depthSegments, widthSegments);
    pushFace(mesh, [-hx, -hy, -hz], [width, 0, 0], [0, 0, depth], [0, -1, 0], widthSegments, depthSegments);
    pushFace(mesh, [-hx, -hy, hz], [width, 0, 0], [0, height, 0], [0, 0, 1], widthSegments, heightSegments);
    pushFace(mesh, [-hx, -hy, -hz], [0, height, 0], [width, 0, 0], [0, 0, -1], heightSegments, widthSegments);
    return toShapeData(mesh);
}
/**
 * 经纬球，中心在原点，半径 `radius`。
 *
 * 顶点数 = (widthSegments + 1) * (heightSegments + 1)：多出的一列是 u = 1 的接缝（与
 * u = 0 位置重合但 uv 不同），两极各有一整行位置重合的顶点。
 * 三角形数 = widthSegments * heightSegments * 2，索引数 = 三角形数 * 3；
 * 两极那两行会产生零面积三角形，这是经纬球的固有代价。
 *
 * 法线直接取归一化后的位置方向：在极点处 `sin(phi)` 为 0，得到精确的 (0, ±1, 0)，
 * 因此两极法线不会出现 NaN。
 */
export function createSphere(options = {}) {
    const radius = assertFinitePositive(options.radius ?? 0.5, 'options.radius');
    const widthSegments = assertSegmentCount(options.widthSegments ?? 32, 3, 'options.widthSegments');
    const heightSegments = assertSegmentCount(options.heightSegments ?? 16, 2, 'options.heightSegments');
    const mesh = createMesh();
    const stride = widthSegments + 1;
    for (let iy = 0; iy <= heightSegments; iy++) {
        const v = iy / heightSegments;
        const phi = v * Math.PI; // 0 = 北极（+Y），PI = 南极（-Y）
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        for (let ix = 0; ix <= widthSegments; ix++) {
            const u = ix / widthSegments;
            const theta = u * Math.PI * 2;
            const nx = sinPhi * Math.cos(theta);
            const ny = cosPhi;
            const nz = sinPhi * Math.sin(theta);
            pushVertex(mesh, nx * radius, ny * radius, nz * radius, nx, ny, nz, u, 1 - v);
        }
    }
    for (let iy = 0; iy < heightSegments; iy++) {
        for (let ix = 0; ix < widthSegments; ix++) {
            const a = iy * stride + ix;
            const b = a + 1;
            const c = a + stride + 1;
            const d = a + stride;
            // 沿 +theta 与 +phi 的切向量满足 cross(dTheta, dPhi) = 外法线，故 (a, b, c) / (a, c, d) 为 CCW。
            mesh.index.push(a, b, c, a, c, d);
        }
    }
    return toShapeData(mesh);
}
/**
 * 圆环（甜甜圈），躺在 XZ 平面上、中心在原点。
 *
 * 顶点数 = (tubularSegments + 1) * (radialSegments + 1)（含接缝重复列）。
 * 三角形数 = tubularSegments * radialSegments * 2，索引数 = 三角形数 * 3。
 *
 * 法线是解析解 (cos u cos v, sin u, cos u sin v)，天然是单位向量，不会出现 NaN。
 */
export function createTorus(options = {}) {
    const radius = assertFinitePositive(options.radius ?? 0.5, 'options.radius');
    const tube = assertFinitePositive(options.tube ?? 0.2, 'options.tube');
    const radialSegments = assertSegmentCount(options.radialSegments ?? 16, 3, 'options.radialSegments');
    const tubularSegments = assertSegmentCount(options.tubularSegments ?? 32, 3, 'options.tubularSegments');
    const mesh = createMesh();
    const stride = radialSegments + 1;
    for (let i = 0; i <= tubularSegments; i++) {
        const v = i / tubularSegments;
        const ringAngle = v * Math.PI * 2; // 绕主环
        const cosRing = Math.cos(ringAngle);
        const sinRing = Math.sin(ringAngle);
        for (let j = 0; j <= radialSegments; j++) {
            const u = j / radialSegments;
            const tubeAngle = u * Math.PI * 2; // 管子截面
            const cosTube = Math.cos(tubeAngle);
            const sinTube = Math.sin(tubeAngle);
            const ringRadius = radius + tube * cosTube;
            const nx = cosTube * cosRing;
            const ny = sinTube;
            const nz = cosTube * sinRing;
            pushVertex(mesh, ringRadius * cosRing, tube * sinTube, ringRadius * sinRing, nx, ny, nz, v, u);
        }
    }
    for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * stride + j;
            const b = a + 1;
            const c = a + stride + 1;
            const d = a + stride;
            // cross(dTube, dRing) = 外法线，故 (a, b, c) / (a, c, d) 为 CCW。
            mesh.index.push(a, b, c, a, c, d);
        }
    }
    return toShapeData(mesh);
}
/**
 * 写入一个圆盖（顶面或底面）。`outwardY` 为 +1 表示顶面、-1 表示底面。
 * 圆盖顶点数 = radialSegments + 2（圆心 1 个 + 外圈 radialSegments + 1 个，含接缝），
 * 三角形数 = radialSegments，索引数 = 三角形数 * 3。
 */
function pushCaps(mesh, y, radius, outwardY, radialSegments) {
    const center = vertexCount(mesh);
    pushVertex(mesh, 0, y, 0, 0, outwardY, 0, 0.5, 0.5);
    for (let ix = 0; ix <= radialSegments; ix++) {
        const theta = (ix / radialSegments) * Math.PI * 2;
        const sin = Math.sin(theta);
        const cos = Math.cos(theta);
        // x = r * sin(theta)、z = r * cos(theta)，所以 uv 可以按同一个角度铺成圆盘。
        pushVertex(mesh, radius * sin, y, radius * cos, 0, outwardY, 0, 0.5 + sin * 0.5, 0.5 + cos * 0.5);
    }
    for (let ix = 0; ix < radialSegments; ix++) {
        const a = center + 1 + ix;
        const b = a + 1;
        if (outwardY > 0) {
            // 从 +Y 往下看，外圈 theta 递增方向为 CCW。
            mesh.index.push(center, a, b);
        }
        else {
            mesh.index.push(center, b, a);
        }
    }
}
/**
 * 圆柱 / 圆台，轴对齐 Y 轴，中心在原点。
 *
 * - 侧面顶点数 = (radialSegments + 1) * (heightSegments + 1)（含 theta = 2PI 的接缝列），
 *   三角形数 = radialSegments * heightSegments * 2，索引数 = 三角形数 * 3。
 * - 侧面法线按**母线斜率**计算：设顶面半径 rt、底面半径 rb、高 h，母线（底面到顶面）在
 *   (r, y) 平面内的方向是 (rt - rb, h)，外法线与之垂直且径向分量为正，即 (h, rb - rt)，
 *   归一化后得到径向分量 `nRadius = h / len` 与 `nY = (rb - rt) / len`（len = hypot(h, rb - rt)）。
 *   于是普通圆柱（rt = rb）退化为纯水平法线，圆锥（rt = 0）的法线则向外并向上倾斜。
 * - 圆盖：半径大于 0 的一端各加 (radialSegments + 2) 个顶点与 radialSegments 个三角形。
 *
 * 当 `radiusTop` 或 `radiusBottom` 为 0 时（圆锥），该端不生成圆盖，侧面顶端会出现一圈位置
 * 重合的顶点与零面积三角形；这是让极点法线保持圆周分布的常规做法。
 */
export function createCylinder(options = {}) {
    const radiusTop = assertFiniteNonNegative(options.radiusTop ?? 0.5, 'options.radiusTop');
    const radiusBottom = assertFiniteNonNegative(options.radiusBottom ?? 0.5, 'options.radiusBottom');
    const height = assertFinitePositive(options.height ?? 1, 'options.height');
    const radialSegments = assertSegmentCount(options.radialSegments ?? 24, 3, 'options.radialSegments');
    const heightSegments = assertSegmentCount(options.heightSegments ?? 1, 1, 'options.heightSegments');
    const caps = options.caps ?? true;
    if (radiusTop === 0 && radiusBottom === 0) {
        throw new RangeError('[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.');
    }
    const mesh = createMesh();
    const stride = radialSegments + 1;
    // 母线法线：见函数注释里的推导。
    const slantLength = Math.hypot(height, radiusBottom - radiusTop);
    const nRadius = height / slantLength;
    const nY = (radiusBottom - radiusTop) / slantLength;
    for (let iy = 0; iy <= heightSegments; iy++) {
        const t = iy / heightSegments; // 0 = 顶面，1 = 底面
        const y = height / 2 - t * height;
        const radius = radiusTop + (radiusBottom - radiusTop) * t;
        for (let ix = 0; ix <= radialSegments; ix++) {
            const u = ix / radialSegments;
            const theta = u * Math.PI * 2;
            const sin = Math.sin(theta);
            const cos = Math.cos(theta);
            pushVertex(mesh, radius * sin, y, radius * cos, nRadius * sin, nY, nRadius * cos, u, 1 - t);
        }
    }
    for (let iy = 0; iy < heightSegments; iy++) {
        for (let ix = 0; ix < radialSegments; ix++) {
            const a = iy * stride + ix;
            const b = a + 1;
            const c = a + stride + 1;
            const d = a + stride;
            // 这里的行索引向下增长（t 增大 -> y 减小），所以绕序要写成 (a, d, c) / (a, c, b)，
            // 等价于 cross(dDown, dTheta) = 外法线，从外面看才是 CCW。
            mesh.index.push(a, d, c, a, c, b);
        }
    }
    if (caps) {
        if (radiusTop > 0)
            pushCaps(mesh, height / 2, radiusTop, 1, radialSegments);
        if (radiusBottom > 0)
            pushCaps(mesh, -height / 2, radiusBottom, -1, radialSegments);
    }
    return toShapeData(mesh);
}
/**
 * 圆锥，顶点朝 +Y、底面朝 -Y、中心在原点，是 `radiusTop = 0` 的圆台特例。
 *
 * 顶点数 / 索引数公式与 {@link createCylinder} 一致，只是取 heightSegments = 1、radiusTop = 0：
 * 侧面 (radialSegments + 1) * 2 个顶点、radialSegments * 2 个三角形；
 * 底面圆盖 (radialSegments + 2) 个顶点、radialSegments 个三角形（caps 为 true 时）。
 * 侧面法线同样按母线斜率求出，在锥顶处形成沿圆周分布的单位法线，不会出现 NaN。
 */
export function createCone(options = {}) {
    const radius = assertFinitePositive(options.radius ?? 0.5, 'options.radius');
    return createCylinder({
        radiusTop: 0,
        radiusBottom: radius,
        height: options.height ?? 1,
        radialSegments: options.radialSegments ?? 24,
        heightSegments: 1,
        caps: options.caps ?? true,
    });
}
/**
 * 规则网格线。
 *
 * 每个方向有 divisions + 1 条线，两个方向合计 2 * (divisions + 1) 条线段，
 * 也就是 4 * (divisions + 1) 个顶点，`position.length` = 12 * (divisions + 1)，
 * `color.length` = 16 * (divisions + 1)。
 */
export function createGrid(options = {}) {
    const size = assertFinitePositive(options.size ?? 10, 'options.size');
    const divisions = assertSegmentCount(options.divisions ?? 10, 1, 'options.divisions');
    const plane = options.plane ?? 'xz';
    const color = options.color ?? DEFAULT_LINE_COLOR;
    const [r, g, b, a] = color;
    const lines = createLines();
    const half = size / 2;
    const step = size / divisions;
    for (let i = 0; i <= divisions; i++) {
        const offset = -half + i * step;
        if (plane === 'xz') {
            // 平行于 X 的线：z 固定；平行于 Z 的线：x 固定。
            pushLineVertex(lines, -half, 0, offset, r, g, b, a);
            pushLineVertex(lines, half, 0, offset, r, g, b, a);
            pushLineVertex(lines, offset, 0, -half, r, g, b, a);
            pushLineVertex(lines, offset, 0, half, r, g, b, a);
        }
        else if (plane === 'xy') {
            // 平行于 X 的线：y 固定；平行于 Y 的线：x 固定。
            pushLineVertex(lines, -half, offset, 0, r, g, b, a);
            pushLineVertex(lines, half, offset, 0, r, g, b, a);
            pushLineVertex(lines, offset, -half, 0, r, g, b, a);
            pushLineVertex(lines, offset, half, 0, r, g, b, a);
        }
        else {
            // 平行于 Y 的线：z 固定；平行于 Z 的线：y 固定。
            pushLineVertex(lines, 0, -half, offset, r, g, b, a);
            pushLineVertex(lines, 0, half, offset, r, g, b, a);
            pushLineVertex(lines, 0, offset, -half, r, g, b, a);
            pushLineVertex(lines, 0, offset, half, r, g, b, a);
        }
    }
    return toLineData(lines);
}
/**
 * 坐标轴指示线：+X 红色、+Y 绿色、+Z 蓝色，都从原点出发。
 *
 * 固定 3 条线段、6 个顶点，`position.length` = 18，`color.length` = 24，alpha 都是 1。
 */
export function createAxes(options = {}) {
    const size = assertFinitePositive(options.size ?? 1, 'options.size');
    const lines = createLines();
    pushLineVertex(lines, 0, 0, 0, 1, 0, 0, 1);
    pushLineVertex(lines, size, 0, 0, 1, 0, 0, 1);
    pushLineVertex(lines, 0, 0, 0, 0, 1, 0, 1);
    pushLineVertex(lines, 0, size, 0, 0, 1, 0, 1);
    pushLineVertex(lines, 0, 0, 0, 0, 0, 1, 1);
    pushLineVertex(lines, 0, 0, size, 0, 0, 1, 1);
    return toLineData(lines);
}
//# sourceMappingURL=shapes.js.map