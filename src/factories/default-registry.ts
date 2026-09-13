/**
 * 内置后端工厂：把两个具体后端适配成 {@link BackendFactory}。
 *
 * 单独放一个文件是为了打破依赖环：`detectBackend` 与 `createDevice` 都只需要注册表，
 * 而注册表不需要认识 WebGPU/WebGL2 的具体实现；只有这里同时引用两者。
 */

import { BackendRegistry, type BackendAvailability, type BackendCreateOptions, type BackendFactory } from './BackendRegistry.js';
import { WebGL2Adapter } from '../webgl2/WebGL2Adapter.js';
import { WebGPUAdapter } from '../webgpu/WebGPUAdapter.js';
import type { Adapter, BackendKind } from '../core/Adapter.js';

/** 探测用 canvas：优先用调用方给的，否则临时建一个（用完即弃，不插入 DOM）。 */
function probeCanvas(options: BackendCreateOptions): HTMLCanvasElement | OffscreenCanvas | null {
  if (options.canvas) return options.canvas;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(1, 1);
  return null;
}

class WebGPUFactory implements BackendFactory {
  readonly kind: BackendKind = 'webgpu';

  async isAvailable(options: BackendCreateOptions): Promise<BackendAvailability> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
      return { ok: false, reason: '当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）' };
    }
    if (options.forceFallbackAdapter && !('fallbackAdapter' in (navigator.gpu as object))) {
      // 只是提示，不阻断：不同实现的字段名略有差异。
    }
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: options.powerPreference ?? 'high-performance',
        forceFallbackAdapter: options.forceFallbackAdapter ?? false,
      });
      if (!adapter) {
        return {
          ok: false,
          reason: 'requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）',
        };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: `requestAdapter() 抛错：${(error as Error).message}` };
    }
  }

  async createAdapter(options: BackendCreateOptions): Promise<Adapter> {
    // `create` 在拿不到 adapter 时抛错（`request` 返回 null，适合「探测」语义）。
    return WebGPUAdapter.create({
      powerPreference: options.powerPreference,
      forceFallbackAdapter: options.forceFallbackAdapter,
    });
  }
}

class WebGL2Factory implements BackendFactory {
  readonly kind: BackendKind = 'webgl2';

  async isAvailable(options: BackendCreateOptions): Promise<BackendAvailability> {
    const canvas = probeCanvas(options);
    if (!canvas) {
      return { ok: false, reason: '没有可用的 canvas（既没有传入 canvas，也不在浏览器环境里）' };
    }
    try {
      // 直接用真实 canvas 探测：如果它已经被别的 context 占用，这里就会失败，
      // 这正是我们希望尽早发现的情况。
      const context = canvas.getContext('webgl2', options.contextAttributes) as WebGL2RenderingContext | null;
      if (!context) {
        return { ok: false, reason: 'canvas.getContext(\'webgl2\') 返回 null（不支持 WebGL2 或 canvas 已被占用）' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: `创建 WebGL2 context 时抛错：${(error as Error).message}` };
    }
  }

  async createAdapter(options: BackendCreateOptions): Promise<Adapter> {
    const canvas = probeCanvas(options);
    if (!canvas) {
      throw new Error('[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。');
    }
    return WebGL2Adapter.request({
      canvas,
      contextAttributes: options.contextAttributes,
    });
  }
}

let cached: BackendRegistry | null = null;

/** 内置后端注册表（`webgpu` + `webgl2`），进程内复用同一个实例。 */
export function createDefaultBackendRegistry(): BackendRegistry {
  if (!cached) {
    cached = new BackendRegistry().register(new WebGPUFactory()).register(new WebGL2Factory());
  }
  return cached;
}
