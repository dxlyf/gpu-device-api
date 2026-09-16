/**
 * 核心层：与后端无关的接口与词汇表。
 *
 * 上层只依赖这个模块。具体后端（`../webgl2`、`../webgpu`）
 * 实现它，并由 `../factories` 在两者之间选择。
 */
export * from './enums/index.js';
export * from './errors/index.js';
export * from './resources/index.js';
export * from './binding/index.js';
export * from './pipeline/index.js';
export * from './render/index.js';
export * from './sync/index.js';
export { describeAdapter } from './Adapter.js';
export { resolveLimits, } from './Device.js';
export { CANVAS_DEPTH_FORMAT, defaultPixelRatio, measureCanvas, } from './CanvasContext.js';
//# sourceMappingURL=index.js.map