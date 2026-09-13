/**
 * 后端注册表：把「有哪些后端」与「怎么探测/创建它们」解耦。
 *
 * 内置注册了 `webgpu` 与 `webgl2`。要让 `createDevice({ backend: 'auto' })` 也认得自定义后端
 * （例如将来基于 WebGL1 + 扩展的实现），只需 `registry.register(factory)` 即可，
 * 不必改动 `detectBackend` / `createDevice` 的逻辑。
 */

import type { Adapter, BackendKind } from '../core/Adapter.js';

/** 探测结果。`reason` 在失败时说明为什么不可用，会直接进错误信息。 */
export interface BackendAvailability {
  ok: boolean;
  reason?: string;
}

/** 某个后端的探测结论（带上后端名，便于直接汇报）。 */
export interface BackendProbeResult {
  backend: BackendKind;
  ok: boolean;
  reason?: string;
}

export interface BackendFactory {
  readonly kind: BackendKind;
  /** 该后端当前是否可用（浏览器能力、context 能否创建等）。 */
  isAvailable(options: BackendCreateOptions): Promise<BackendAvailability>;
  /** 创建 adapter；不可用时应抛错而不是返回 null。 */
  createAdapter(options: BackendCreateOptions): Promise<Adapter>;
}

export interface BackendCreateOptions {
  /** 创建探测/绘制用的 context 所必需的 canvas。 */
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  /** WebGL2 的 context 属性。 */
  contextAttributes?: WebGLContextAttributes;
  /** WebGPU 的 adapter 选项。 */
  powerPreference?: 'low-power' | 'high-performance';
  forceFallbackAdapter?: boolean;
}

export class BackendRegistry {
  private readonly factories = new Map<BackendKind, BackendFactory>();

  register(factory: BackendFactory): this {
    this.factories.set(factory.kind, factory);
    return this;
  }

  unregister(kind: BackendKind): boolean {
    return this.factories.delete(kind);
  }

  get(kind: BackendKind): BackendFactory | undefined {
    return this.factories.get(kind);
  }

  has(kind: BackendKind): boolean {
    return this.factories.has(kind);
  }

  /** 已注册的后端，按注册顺序。 */
  kinds(): BackendKind[] {
    return [...this.factories.keys()];
  }

  /** 按给定优先级逐个探测，返回第一个可用的后端。 */
  async firstAvailable(
    order: readonly BackendKind[],
    options: BackendCreateOptions,
  ): Promise<{ factory: BackendFactory; availability: BackendAvailability } | null> {
    for (const kind of order) {
      const factory = this.factories.get(kind);
      if (!factory) continue;
      const availability = await factory.isAvailable(options);
      if (availability.ok) return { factory, availability };
    }
    return null;
  }

  /** 逐个探测并记录每个后端的结果，用于生成「为什么回退了」的解释。 */
  async probeAll(
    order: readonly BackendKind[],
    options: BackendCreateOptions,
  ): Promise<BackendProbeResult[]> {
    const results: BackendProbeResult[] = [];
    for (const kind of order) {
      const factory = this.factories.get(kind);
      if (!factory) {
        results.push({ backend: kind, ok: false, reason: '该后端未注册。' });
        continue;
      }
      const availability = await factory.isAvailable(options);
      results.push({ backend: kind, ok: availability.ok, reason: availability.reason });
    }
    return results;
  }
}
