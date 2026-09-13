/// <reference types="@webgpu/types" />

/**
 * gpu-device-api —— 统一的 WebGL2 / WebGPU 抽象。
 *
 * 公开接口分为两层：
 *
 * - **core** —— 一个 WebGPU 风格的接口（`Adapter`、`Device`、`Queue`、`BindGroup`、pipelines、
 *   command encoder），由两个后端共同实现，面向希望直接控制的用户。
 * - **factories** —— 后端探测与选择（`createDevice`、`detectBackend`）。
 *
 * 日常绘图的便捷层构建在两者之上；参见 `src/gfx`。
 */

export * from './core/index.js';
export * from './utils/index.js';
