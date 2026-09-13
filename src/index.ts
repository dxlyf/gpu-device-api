/// <reference types="@webgpu/types" />

/**
 * gpu-device-api — a unified WebGL2 / WebGPU abstraction.
 *
 * The public surface has two layers:
 *
 * - **core** — a WebGPU shaped interface (`Adapter`, `Device`, `Queue`, `BindGroup`, pipelines,
 *   command encoders) implemented by both backends, for people who want direct control.
 * - **factories** — backend detection and selection (`createDevice`, `detectBackend`).
 *
 * A convenience layer for every-day drawing ships on top of both; see `src/gfx`.
 */

export * from './core/index.js';
export * from './utils/index.js';
