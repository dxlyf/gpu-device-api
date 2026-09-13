/**
 * Demo 页面：用**便捷层**（`src/gfx`）画一个带光照的场景，并用 lil-gui 实时调参。
 *
 * 这个页面的作用有两个：
 * 1. 演示「五行出图」的 DX 到底长什么样；
 * 2. 作为两个后端的对照实验台 —— 同一个材质描述、同一份几何体、同一套参数，
 *    切换 WebGL2 / WebGPU 后画面应当**基本一致**（差异只应来自抗锯齿等实现细节）。
 */

import GUI from 'lil-gui';

import {
  OrbitControls,
  PerspectiveCamera,
  Renderer,
  materials,
  shapes,
} from '../src/gfx/index.js';
import { mat4, vec3, degToRad } from '../src/utils/math/index.js';
import type { Geometry } from '../src/gfx/Geometry.js';
import type { Material } from '../src/gfx/Material.js';

/* ------------------------------------------------------------------------------------------------ */
/* 场景状态（lil-gui 直接改这里的字段）                                                                */
/* ------------------------------------------------------------------------------------------------ */

interface Params {
  backend: 'auto' | 'webgl2' | 'webgpu';
  shape: 'sphere' | 'box' | 'torus' | 'cylinder' | 'cone' | 'plane' | 'triangle';
  material: 'lambert' | 'phong' | 'unlit' | 'normalDebug';
  spin: boolean;
  color: string;
  lightAzimuth: number;
  lightElevation: number;
  ambient: number;
  shininess: number;
  clearColor: string;
  showGrid: boolean;
  fov: number;
}

const params: Params = {
  backend: 'auto',
  shape: 'sphere',
  material: 'lambert',
  spin: true,
  color: '#ff9f43',
  lightAzimuth: 40,
  lightElevation: 55,
  ambient: 0.18,
  shininess: 48,
  clearColor: '#0b0e13',
  showGrid: true,
  fov: 45,
};

/**
 * 允许用查询参数覆盖初始状态，方便无头浏览器与截图脚本：
 * `?backend=webgl2`、`?shape=box`、`?material=phong`、`?spin=0`、`?grid=0`。
 */
function applyQueryOverrides(): void {
  if (typeof location === 'undefined') return;
  const query = new URLSearchParams(location.search);
  const backend = query.get('backend');
  if (backend === 'webgl2' || backend === 'webgpu' || backend === 'auto') params.backend = backend;
  const shape = query.get('shape');
  if (shape && shape in { sphere: 1, box: 1, torus: 1, cylinder: 1, cone: 1, plane: 1, triangle: 1 }) {
    params.shape = shape as Params['shape'];
  }
  const material = query.get('material');
  if (material && material in { lambert: 1, phong: 1, unlit: 1, normalDebug: 1 }) {
    params.material = material as Params['material'];
  }
  if (query.get('spin') === '0') params.spin = false;
  if (query.get('grid') === '0') params.showGrid = false;
}

applyQueryOverrides();

/* ------------------------------------------------------------------------------------------------ */

const canvas = document.getElementById('view') as HTMLCanvasElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;

let renderer: Renderer | null = null;
let camera: PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let gui: GUI | null = null;

const geometries = new Map<string, Geometry>();
const materialCache = new Map<string, Material>();
let modelMatrix = mat4.create();
let angle = 0;

/** 光向：球坐标 → 单位向量。 */
function lightDirection(): [number, number, number] {
  const azimuth = degToRad(params.lightAzimuth);
  const elevation = degToRad(params.lightElevation);
  const cos = Math.cos(elevation);
  return [cos * Math.sin(azimuth), Math.sin(elevation), cos * Math.cos(azimuth)];
}

function hexToRgb(hex: string): [number, number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
    1,
  ];
}

/** 按当前参数生成或取出几何体。 */
function geometryFor(kind: Params['shape']): Geometry {
  const cached = geometries.get(kind);
  if (cached) return cached;
  if (!renderer) throw new Error('renderer 尚未创建');

  const data =
    kind === 'sphere'
      ? shapes.createSphere({ radius: 0.8, widthSegments: 48, heightSegments: 32 })
      : kind === 'box'
        ? shapes.createBox({ width: 1.2, height: 1.2, depth: 1.2 })
        : kind === 'torus'
          ? shapes.createTorus({ radius: 0.7, tube: 0.28, radialSegments: 24, tubularSegments: 64 })
          : kind === 'cylinder'
            ? shapes.createCylinder({ radiusTop: 0.55, radiusBottom: 0.8, height: 1.4, radialSegments: 40 })
            : kind === 'cone'
              ? shapes.createCone({ radius: 0.8, height: 1.4, radialSegments: 40 })
              : kind === 'plane'
                ? shapes.createPlane({ width: 2, height: 2, widthSegments: 8, heightSegments: 8 })
                : shapes.createTriangle();

  const geometry = renderer.createGeometry({ label: kind, ...data });
  geometries.set(kind, geometry);
  return geometry;
}

/** 按当前参数生成或取出材质。颜色/光向等参数走 uniform，所以材质本身可以复用。 */
function materialFor(kind: Params['material']): Material {
  const cached = materialCache.get(kind);
  if (cached) return cached;
  if (!renderer) throw new Error('renderer 尚未创建');

  const color = hexToRgb(params.color);
  const material =
    kind === 'lambert'
      ? renderer.createMaterial(materials.lambert({ color }))
      : kind === 'phong'
        ? renderer.createMaterial(materials.phong({ color, shininess: params.shininess }))
        : kind === 'unlit'
          ? renderer.createMaterial(materials.unlit({ color }))
          : renderer.createMaterial(materials.normalDebug());

  materialCache.set(kind, material);
  return material;
}

/** 每次绘制真正传给材质的 uniform（覆盖材质默认值）。 */
function uniformsFor(): Record<string, number | ArrayLike<number>> {
  const values: Record<string, number | ArrayLike<number>> = {
    baseColor: hexToRgb(params.color),
  };
  if (params.material !== 'unlit' && params.material !== 'normalDebug') {
    values.lightDirection = lightDirection();
    values.ambient = params.ambient;
  }
  if (params.material === 'phong') values.shininess = params.shininess;
  return values;
}

/* ------------------------------------------------------------------------------------------------ */
/* 启动与重建                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

async function boot(): Promise<void> {
  controls?.dispose();
  controls = null;
  renderer?.destroy();
  renderer = null;
  geometries.clear();
  materialCache.clear();

  statusEl.textContent = `正在创建 ${params.backend} 渲染器…`;

  const created = await Renderer.create({
    canvas,
    backend: params.backend,
    antialias: true,
    depth: true,
    clearColor: params.clearColor,
  });
  renderer = created;

  camera = new PerspectiveCamera({
    position: [0, 1.4, 3.6],
    target: [0, 0, 0],
    fov: 45,
    near: 0.1,
    far: 100,
  });
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  renderer.setCamera(camera);

  statusEl.textContent = `后端：${created.backend}　设备：${describeDevice(created)}`;
  // 立刻画一帧再进入 rAF 循环：这样即使环境里 rAF 不触发（无头浏览器、
  // 页面在后台标签页），第一帧也已经画出来了，截图/校验不会拿到空画布。
  frame(0);
}

function describeDevice(candidate: Renderer): string {
  // 用 core 的 limits，而不是 native 对象的内部字段 —— 两个后端都能读。
  return `${candidate.device.label}　最大纹理 ${candidate.device.limits.maxTextureDimension2D}`;
}

/* ------------------------------------------------------------------------------------------------ */
/* 每帧                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

let lastTime = 0;

function frame(time: number): void {
  if (!renderer || !camera) return;
  const delta = lastTime === 0 ? 0 : (time - lastTime) / 1000;
  lastTime = time;

  renderer.resize();
  if (params.spin) angle += delta * 0.6;
  if (camera.fov !== params.fov) camera.fov = params.fov;

  controls?.update();

  modelMatrix = mat4.create();
  if (params.spin) mat4.rotateY(modelMatrix, modelMatrix, angle);
  if (params.shape === 'plane') mat4.rotateX(modelMatrix, modelMatrix, -Math.PI / 2);

  renderer.beginFrame({ color: params.clearColor });

  renderer.setMaterial(materialFor(params.material));
  const geometry = geometryFor(params.shape);
  renderer.draw(geometry, {
    model: modelMatrix,
    uniforms: uniformsFor(),
  });

  if (params.showGrid && params.shape !== 'triangle') {
    const grid = gridGeometry();
    if (grid) {
      renderer.setMaterial(renderer.createMaterial(materials.vertexColorLine()));
      renderer.draw(grid, { model: mat4.fromTranslation(mat4.create(), vec3.fromValues(0, -1.001, 0)) });
    }
  }

  renderer.endFrame();

  const stats = renderer.stats;
  statsEl.textContent =
    `draw calls ${stats.drawCalls}　三角形 ${stats.triangles}　` +
    `管线切换 ${stats.pipelineSwitches}　帧耗时 ${stats.frameTime.toFixed(2)} ms　` +
    `画布 ${renderer.width}×${renderer.height}`;

  // 首帧画完就写下成功标记，便于无头浏览器抓取判断。
  if (!document.documentElement.dataset.demoResult) {
    document.documentElement.dataset.demoResult = 'ok';
    document.documentElement.dataset.demoBackend = renderer.backend;
  }

  requestAnimationFrame(frame);
}

/** 停止渲染循环（页面卸载时用，避免在已销毁的 renderer 上继续画）。 */
function stop(): void {
  controls?.dispose();
  controls = null;
  renderer?.destroy();
  renderer = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stop);
}

let gridCache: Geometry | null = null;
function gridGeometry(): Geometry | null {
  if (!renderer) return null;
  if (gridCache) return gridCache;
  const grid = shapes.createGrid({ size: 6, divisions: 12, plane: 'xz' });
  // `createGrid` 返回带颜色的线段；这里用 `color` 属性，所以材质是 vertexColorLine。
  gridCache = renderer.createGeometry({ label: 'grid', ...grid, topology: 'line-list' });
  return gridCache;
}

/* ------------------------------------------------------------------------------------------------ */
/* lil-gui                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------ */
/* 可选的自检：把场景画进离屏目标并读回中心像素                                                        */
/* ------------------------------------------------------------------------------------------------ */

/**
 * `?verify=1` 时执行：把场景画进一张 64×64 的离屏目标，再用 `copyTextureToBuffer` 读回中心像素，
 * 结果写进 `<html data-demo-pixel="r,g,b">`。
 *
 * 为什么值得内置：这是**后端无关**的像素级自检 —— 绘制走 gfx 层、读回走 core 的
 * `copyTextureToBuffer`，两个后端都由同一份实现覆盖。无头环境抓一下这个属性，
 * 就知道画面里到底有没有东西，而不是只看「没报错」。
 */
async function verifyOffscreenPixel(active: Renderer): Promise<void> {
  const { device } = active;
  const geometry = geometryFor(params.shape);
  const material = materialFor(params.material);

  const target = device.createRenderTarget({
    label: 'demo-verify',
    width: 64,
    height: 64,
    color: 'rgba8unorm',
    depth: 'depth24plus',
  });
  const readback = device.createBuffer({
    label: 'demo-verify-readback',
    size: 64 * 64 * 4,
    usage: 0x0001 | 0x0004 | 0x0008, // MapRead | CopySrc | CopyDst
  });

  // 复用 Renderer 的通道与绑定逻辑（arena、bind group、顶点缓冲都在里面）。
  active.beginFrame({ target, color: [0.05, 0.05, 0.08, 1] });
  active.setMaterial(material);
  active.draw(geometry, { model: mat4.create() });
  active.endFrame();

  const encoder = device.createCommandEncoder({ label: 'demo-verify-readback' });
  encoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow: 64 * 4 },
    { width: 64, height: 64, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish()]);

  await readback.mapAsync('read', 0, 64 * 64 * 4);
  const pixels = new Uint8Array(readback.getMappedRange(0, 64 * 64 * 4));
  const cornerIndex = (2 * 64 + 2) * 4;
  const centerIndex = (32 * 64 + 32) * 4;
  const center = [pixels[centerIndex]!, pixels[centerIndex + 1]!, pixels[centerIndex + 2]!];
  const corner = [pixels[cornerIndex]!, pixels[cornerIndex + 1]!, pixels[cornerIndex + 2]!];
  readback.unmap();
  readback.destroy();
  target.destroy();

  document.documentElement.dataset.demoPixel = center.join(',');
  document.documentElement.dataset.demoPixelCorner = corner.join(',');
  document.documentElement.dataset.demoPixelLit = String(
    center[0]! + center[1]! + center[2]! > 20 && center.join(',') !== corner.join(','),
  );

  // 顺便读一下 canvas 本身的像素：用来区分「绘制流程本身有问题」还是「只有离屏目标有问题」。
  if (active.backend === 'webgl2') {
    const gl = active.device.native as WebGL2RenderingContext;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const px = new Uint8Array(4);
    gl.readPixels(
      Math.floor(active.width / 2),
      Math.floor(active.height / 2),
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      px,
    );
    document.documentElement.dataset.demoCanvasPixel = [px[0], px[1], px[2]].join(',');
    document.documentElement.dataset.demoGlError = String(gl.getError());
  }
}

function buildGui(): void {  gui = new GUI({ title: 'gpu-device-api demo' });

  const backendFolder = gui.addFolder('后端');
  backendFolder
    .add(params, 'backend', ['auto', 'webgl2', 'webgpu'])
    .name('backend')
    .onChange(() => {
      gridCache = null;
      void boot();
    });

  const sceneFolder = gui.addFolder('场景');
  sceneFolder
    .add(params, 'shape', ['sphere', 'box', 'torus', 'cylinder', 'cone', 'plane', 'triangle'])
    .name('几何体');
  sceneFolder
    .add(params, 'material', ['lambert', 'phong', 'unlit', 'normalDebug'])
    .name('材质');
  sceneFolder.addColor(params, 'color').name('基色').onChange(() => materialCache.clear());
  sceneFolder.add(params, 'clearColor').name('清屏色').onChange((value: string) => {
    renderer?.setClearColor(value);
  });
  sceneFolder.add(params, 'spin').name('自转');
  sceneFolder.add(params, 'showGrid').name('显示网格');

  const lightFolder = gui.addFolder('光照');
  lightFolder.add(params, 'lightAzimuth', -180, 180, 1).name('方位角');
  lightFolder.add(params, 'lightElevation', -10, 90, 1).name('仰角');
  lightFolder.add(params, 'ambient', 0, 1, 0.01).name('环境光');
  lightFolder.add(params, 'shininess', 1, 256, 1).name('高光指数');

  const cameraFolder = gui.addFolder('相机');
  cameraFolder.add(params, 'fov', 20, 90, 1).name('视场角');
  cameraFolder.add({ reset: () => controls?.reset() }, 'reset').name('重置视角');

  gui.close();
}

/* ------------------------------------------------------------------------------------------------ */

boot()
  .then(() => {
    buildGui();
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('verify') === '1') {
      return verifyOffscreenPixel(renderer!);
    }
    return undefined;
  })
  .catch((error: unknown) => {
    const message = (error as Error).message;
    statusEl.textContent = `启动失败：${message}`;
    statusEl.className = 'error';
    // 把失败标记写到 DOM 上，便于无头浏览器抓取。
    document.documentElement.dataset.demoResult = 'fail';
  });
