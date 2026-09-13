/**
 * 内置后端工厂：把两个具体后端适配成 {@link BackendFactory}。
 *
 * 单独放一个文件是为了打破依赖环：`detectBackend` 与 `createDevice` 都只需要注册表，
 * 而注册表不需要认识 WebGPU/WebGL2 的具体实现；只有这里同时引用两者。
 */

import { BackendRegistry, type BackendAvailability, type BackendCreateOptions, type BackendFactory } from './BackendRegistry.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { WebGL2Adapter } from '../webgl2/WebGL2Adapter.js';
import { WebGPUAdapter } from '../webgpu/WebGPUAdapter.js';
import type { Adapter, BackendKind } from '../core/Adapter.js';

/** 创建 adapter 时用的 canvas：优先调用方给的（那个 canvas 就是要渲染的目标）。 */
function targetCanvas(options: BackendCreateOptions): HTMLCanvasElement | OffscreenCanvas | null {
  if (options.canvas) return options.canvas;
  return freshCanvas();
}

/**
 * 探测用的 canvas：**永远新建一个，绝不复用调用方的 canvas**。
 *
 * 原因是硬性的浏览器约束：一个 canvas 只能绑定一种 context，一旦在某张 canvas 上调过
 * `getContext('webgl2')`，之后再调 `getContext('webgpu')` 就永远返回 null。
 * `detectBackend` 为了给出「为什么回退」的诊断会**探测所有候选后端**，
 * 如果在真实 canvas 上探测 WebGL2，就会把 canvas 占掉 —— 于是明明选中的是 WebGPU，
 * 到了 `configure()` 却拿不到 webgpu context。
 */
function detectionCanvas(): HTMLCanvasElement | OffscreenCanvas | null {
  return freshCanvas();
}

function freshCanvas(): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(1, 1);
  return null;
}

/** 超时哨兵值，用来把「超时」与「返回 null」区分开。 */
const TIMED_OUT = Symbol('timeout');

/** 给一个 promise 加超时；超时时返回哨兵值而不是抛错。 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * 探测 `requestAdapter()` 的超时时间（毫秒）。
 *
 * 为什么要超时：在部分环境里（无头模式、GPU 进程未就绪、驱动初始化很慢）
 * `requestAdapter()` 既不 resolve 也不 reject，而是**一直挂着**。
 * 那样整个 `createDevice` 就永远不返回，页面表现为「一直卡在启动中」——
 * 比明确回退到 WebGL2 糟糕得多。超过这个时间就当作不可用。
 */
export const WEBGPU_ADAPTER_PROBE_TIMEOUT_MS = 3000;

class WebGPUFactory implements BackendFactory {
  readonly kind: BackendKind = 'webgpu';

  async isAvailable(options: BackendCreateOptions): Promise<BackendAvailability> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
      return { ok: false, reason: '当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）' };
    }
    try {
      const adapter = await withTimeout(
        navigator.gpu.requestAdapter({
          powerPreference: options.powerPreference ?? 'high-performance',
          forceFallbackAdapter: options.forceFallbackAdapter ?? false,
        }),
        WEBGPU_ADAPTER_PROBE_TIMEOUT_MS,
      );
      if (adapter === TIMED_OUT) {
        return {
          ok: false,
          reason: `requestAdapter() 超过 ${WEBGPU_ADAPTER_PROBE_TIMEOUT_MS}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`,
        };
      }
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
    // 这里同样要加超时：某些环境下 `requestAdapter()` 会一直挂着不返回，
    // 探测阶段有超时兜底，但「真正创建 adapter」这一步如果不管，页面就会永远卡在启动中。
    const created = await withTimeout(
      WebGPUAdapter.create({
        powerPreference: options.powerPreference,
        forceFallbackAdapter: options.forceFallbackAdapter,
      }),
      WEBGPU_ADAPTER_PROBE_TIMEOUT_MS,
    );
    if (created === TIMED_OUT) {
      throw new ValidationError(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${WEBGPU_ADAPTER_PROBE_TIMEOUT_MS}ms 没有返回。` +
          '这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。\n' +
          '可以稍后重试，或改用 WebGL2 后端。',
      );
    }
    return created;
  }
}

class WebGL2Factory implements BackendFactory {
  readonly kind: BackendKind = 'webgl2';

  async isAvailable(options: BackendCreateOptions): Promise<BackendAvailability> {
    // 关键：用**临时 canvas** 探测。见 `detectionCanvas()` 的注释 ——
    // 在真实 canvas 上探测 WebGL2 会让它之后再也拿不到 webgpu context。
    const canvas = detectionCanvas();
    if (!canvas) {
      return { ok: false, reason: '没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）' };
    }
    try {
      const context = canvas.getContext('webgl2', options.contextAttributes) as WebGL2RenderingContext | null;
      if (!context) {
        return { ok: false, reason: 'canvas.getContext(\'webgl2\') 返回 null（浏览器不支持 WebGL2）' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: `创建 WebGL2 context 时抛错：${(error as Error).message}` };
    }
  }

  async createAdapter(options: BackendCreateOptions): Promise<Adapter> {
    // 走到这里说明已经确定要用 WebGL2，此时才在真实 canvas 上真正建立 context。
    const canvas = targetCanvas(options);
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
