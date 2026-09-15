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

export {
  UNIFORM_PLACEHOLDER,
  ATTRIBUTE_PLACEHOLDER,
  TEXTURE_PLACEHOLDER,
  Material,
  defineMaterial,
  type MaterialDesc,
  type MaterialTextureDesc,
  type ResolvedMaterialTexture,
  type BlendPresetName,
} from './Material.js';
export {
  ATTRIBUTE_PLACEHOLDER as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  TEXTURE_PLACEHOLDER as MATERIAL_TEXTURE_PLACEHOLDER,
  UNIFORM_PLACEHOLDER as MATERIAL_UNIFORM_PLACEHOLDER,
} from './Material.js';

export {
  UniformLayout,
  UniformValues,
  UNIFORM_FIELD_TYPES,
  createUniforms,
  defineUniforms,
  type UniformArrayType,
  type UniformElementType,
  type UniformFieldAccessor,
  type UniformFieldLayout,
  type UniformFieldType,
  type UniformFieldValue,
  type UniformFieldValues,
  type UniformInput,
  type UniformInputValues,
  type UniformLayoutDesc,
  type UniformMatrixType,
  type UniformOptions,
  type UniformScalarType,
  type Uniforms,
  type UniformVectorType,
} from './Uniforms.js';

export { UniformArena, UniformArenaPool, type UniformArenaOptions } from './UniformArena.js';

export {
  Geometry,
  STANDARD_ATTRIBUTE_FORMATS,
  createGeometry,
  type BoundingSphere,
  type GeometryAttribute,
  type GeometryAttributeInput,
  type GeometryDesc,
} from './Geometry.js';

export { FrustumCuller } from './Culling.js';

export {
  compareOpaque,
  compareTransparent,
  sortDraws,
  type DrawSortMode,
  type SortableDraw,
} from './DrawSort.js';

export {
  GFX_UPLOAD_FORMATS,
  GfxTexture,
  buildMipChain,
  isImageSource,
  type AsyncTextureDesc,
  type DecodedPixels,
  type ImageSource,
  type TextureDesc,
} from './Texture.js';

export {
  Renderer,
  type Camera,
  type ColorInput,
  type DrawOptions,
  type FrameOptions,
  type RendererOptions,
  type RendererStats,
} from './Renderer.js';

export {
  DEFAULT_GPU_TIMING_DELAY,
  DEFAULT_GPU_TIMING_FRAMES,
  GPU_TIMING_FEATURE,
  GpuTiming,
  describeGpuTimingFailure,
  type GpuTimingOptions,
  type GpuTimingStats,
} from './GpuTiming.js';

export {
  PerspectiveCamera,
  OrthographicCamera,
  type DepthRangeConvention,
  type PerspectiveCameraOptions,
  type OrthographicCameraOptions,
} from './Camera.js';
export { OrbitControls, type OrbitControlsOptions } from './OrbitControls.js';

/**
 * 几何体生成与内置材质用**命名空间导出**：
 * 调用形式是 `shapes.createSphere()` / `materials.lambert()`，一眼能看出来源，
 * 也避免与使用者自己的同名函数冲突。
 */
export * as shapes from './shapes.js';
export * as materials from './materials.js';

export {
  SCENE_UNIFORM_FIELDS,
  defaultUniformsOf,
  flatLine,
  lambert,
  normalDebug,
  phong,
  unlit,
  vertexColorLine,
  type FlatLineOptions,
  type LambertOptions,
  type LightOptions,
  type PhongOptions,
  type RgbColor,
  type UnlitOptions,
} from './materials.js';

export {
  createAxes,
  createBox,
  createCone,
  createCylinder,
  createGrid,
  createPlane,
  createSphere,
  createTorus,
  createTriangle,
  type LineData,
  type ShapeData,
} from './shapes.js';
