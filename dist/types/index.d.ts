/// <reference types="@webgpu/types" />
/**
 * gpu-device-api —— 统一的 WebGL2 / WebGPU 抽象。
 *
 * 公开接口分为四层，**全部从这一个入口导出**：
 *
 * - **core** —— 一个 WebGPU 风格的接口（`Adapter`、`Device`、`Queue`、`BindGroup`、pipelines、
 *   command encoder），由两个后端共同实现，面向希望直接控制的用户；
 * - **shaders** —— 着色器源码管理：按后端选语言、补 GLSL 样板、两种语言的接口反射；
 * - **factories** —— 后端探测与选择（`createDevice`、`detectBackend`）；
 * - **gfx** —— 便捷绘制层：`Renderer`、声明式 uniform、`Material`、`Geometry`、
 *   相机与轨道控制、几何体生成、内置材质。日常绘制用这一层。
 *
 * 想直接控制底层：`device.native` 是逃生口（WebGL2 给 `WebGL2RenderingContext`，
 * WebGPU 给 `GPUDevice`）。
 *
 * ```ts
 * import { Renderer, PerspectiveCamera, OrbitControls, shapes, materials } from 'gpu-device-api';
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
export * from './core/index.js';
export * from './utils/index.js';
export * from './shaders/index.js';
export * from './factories/index.js';
export * from './gfx/index.js';
//# sourceMappingURL=index.d.ts.map