/**
 * `src/gfx`：便捷绘制层。
 *
 * 分工：`src/core` 是 WebGPU 形状的底层镜像（显式、无魔法、两个后端语义一致），
 * 而这一层负责把日常绘制变短 —— 声明式 uniform、自动生成两种语言的声明、
 * uniform arena、按材质缓存管线、相机与轨道控制、几何体生成。
 *
 * ```ts
 * import { Renderer, PerspectiveCamera, OrbitControls, shapes, materials } from 'gpu-device-api';
 * ```
 *
 * 注意**从包根导入**：gfx 与 core / shaders / factories / utils 一起由 `src/index.ts` 统一导出。
 * （这里原先写的是 `gpu-device-api/gfx`，但 `package.json` 的 `exports` 只声明了 `"."`，
 * 照那个写法会解析失败。）
 *
 * const renderer = await Renderer.create({ canvas });
 * const camera = new PerspectiveCamera({ position: [0, 1.2, 3] });
 * new OrbitControls(camera, canvas);
 * renderer.setCamera(camera);
 *
 * const sphere = renderer.createGeometry(shapes.createSphere());
 * const lambert = renderer.createMaterial(materials.lambert({ color: [1, 0.6, 0.2, 1] }));
 *
 * renderer.beginFrame({ color: '#101418' });
 * renderer.draw(sphere, { material: lambert });
 * renderer.endFrame();
 * ```
 */
export { UNIFORM_PLACEHOLDER, ATTRIBUTE_PLACEHOLDER, TEXTURE_PLACEHOLDER, Material, defineMaterial, } from './Material.js';
export { ATTRIBUTE_PLACEHOLDER as MATERIAL_ATTRIBUTE_PLACEHOLDER, TEXTURE_PLACEHOLDER as MATERIAL_TEXTURE_PLACEHOLDER, UNIFORM_PLACEHOLDER as MATERIAL_UNIFORM_PLACEHOLDER, } from './Material.js';
export { UniformLayout, UniformValues, UNIFORM_FIELD_TYPES, createUniforms, defineUniforms, } from './Uniforms.js';
export { UniformArena, UniformArenaPool } from './UniformArena.js';
export { Geometry, STANDARD_ATTRIBUTE_FORMATS, createGeometry, } from './Geometry.js';
export { FrustumCuller } from './Culling.js';
export { compareOpaque, compareTransparent, sortDraws, } from './DrawSort.js';
export { GFX_UPLOAD_FORMATS, GfxTexture, buildMipChain, isImageSource, } from './Texture.js';
export { Renderer, } from './Renderer.js';
export { DEFAULT_GPU_TIMING_DELAY, DEFAULT_GPU_TIMING_FRAMES, GPU_TIMING_FEATURE, GpuTiming, describeGpuTimingFailure, describeGpuTimingUnavailable, gpuTimingPath, } from './GpuTiming.js';
export { PerspectiveCamera, OrthographicCamera, } from './Camera.js';
export { OrbitControls } from './OrbitControls.js';
/**
 * 几何体生成与内置材质用**命名空间导出**：
 * 调用形式是 `shapes.createSphere()` / `materials.lambert()`，一眼能看出来源，
 * 也避免与使用者自己的同名函数冲突。
 */
export * as shapes from './shapes.js';
export * as materials from './materials.js';
export { SCENE_UNIFORM_FIELDS, defaultUniformsOf, flatLine, lambert, normalDebug, phong, unlit, vertexColorLine, } from './materials.js';
export { createAxes, createBox, createCone, createCylinder, createGrid, createPlane, createSphere, createTorus, createTriangle, } from './shapes.js';
//# sourceMappingURL=index.js.map