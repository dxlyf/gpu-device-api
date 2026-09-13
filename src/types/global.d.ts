/// <reference types="@webgpu/types" />

/**
 * The library targets both WebGL2 and WebGPU, so the WebGPU type definitions (`@webgpu/types`) are
 * always part of the program even when only the WebGL2 backend is used. This file exists so the
 * reference is loaded from a single, explicit place.
 */
export {};
