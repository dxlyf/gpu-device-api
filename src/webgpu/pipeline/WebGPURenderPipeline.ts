/**
 * WebGPU render pipeline：`RenderPipeline` 接口在 `GPURenderPipeline` 上的实现。
 *
 * **惰性编译**是这里的核心：core 允许 pipeline 不声明 attachment 格式、sample count 和
 * vertex layout（这样同一个 pipeline 才能服务多个 render target），而 `GPURenderPipeline`
 * 必须把这些信息烘焙进去。因此真正的创建推迟到第一次 `resolve(variant)`：
 *
 * - cache key = `{ colorFormats, sampleCount, depthFormat, vertexLayouts }`；
 * - 每个 key 对应一个 `GPURenderPipeline`，同一个 pipeline 对象可以持有多个 variant；
 * - `compiled` / `native` 反映真实状态：`compiled` 只表示「至少编译过一个 variant」，
 *   `native` 会触发一次默认 variant 的编译（拒绝「为了看起来有值而瞎编」）。
 *
 * `layout: 'auto'` 原样透传给 WebGPU。
 *
 * 关于 vertex layout：core 的 `VertexState.buffers` 可以省略（注释里说「在第一次 draw 时从
 * geometry 推导」），但 WebGPU 后端**做不到**这件事 —— `setVertexBuffer(slot, buffer, ...)`
 * 只给 buffer，不携带 attribute 布局，`Buffer` 也不带布局信息。因此对读取 vertex attribute
 * 的着色器必须显式提供 `buffers`（或通过 `resolve({ vertexLayouts })` 传入）。
 */

import type {
  FragmentState,
  RenderPipeline,
  RenderPipelineDescriptor,
  RenderPipelineVariant,
  VertexState,
} from '../../core/pipeline/RenderPipeline.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import type { PipelineCache } from './PipelineCache.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { ShaderStage } from '../../core/enums/ShaderStage.js';
import { cacheKey } from '../../core/pipeline/PipelineCache.js';
import { createLogger, type Logger } from '../../utils/logger.js';
import { asGPUPipelineLayout } from '../binding/WebGPUPipelineLayout.js';
import { asWebGPUShaderModule } from '../resources/WebGPUShaderModule.js';
import { assertSampleCount } from '../utils/wgpuEnumMap.js';
import { toGPUTextureFormat } from '../utils/wgpuFormatMap.js';
import { WebGPURenderState } from './WebGPURenderState.js';
import { PipelineCache as WgpuPipelineCache, renderPipelineCacheKey } from './PipelineCache.js';

/** vertex / fragment 入口点缺省名，与 core 的文档一致。 */
export const DEFAULT_VERTEX_ENTRY_POINT = 'vsMain';
export const DEFAULT_FRAGMENT_ENTRY_POINT = 'fsMain';

export class WebGPURenderPipeline implements RenderPipeline {
  readonly label: string;
  readonly descriptor: RenderPipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';
  readonly vertexLayouts: readonly VertexBufferLayout[] | null;

  private readonly device: WebGPUDevice;
  private readonly cache: PipelineCache<GPURenderPipeline>;
  private readonly logger: Logger;
  private _disposed = false;
  private warnedMissingVertexLayouts = false;

  constructor(device: WebGPUDevice, descriptor: RenderPipelineDescriptor) {
    this.device = device;
    this.descriptor = descriptor;
    this.label = descriptor.label ?? `renderPipeline#${device.nextResourceId('renderPipeline')}`;
    this.layout = descriptor.layout ?? 'auto';
    this.vertexLayouts = descriptor.vertex.buffers ?? null;
    this.logger = createLogger(`webgpu:${this.label}`);
    this.cache = new WgpuPipelineCache<GPURenderPipeline>(64, (_value, key) => {
      this.logger.debug(`evicted render pipeline variant ${key}`);
    });
  }

  /** 至少编译过一个 variant 时为 true（不触发编译）。 */
  get compiled(): boolean {
    return this.cache.size > 0;
  }

  /** 原生句柄；会按默认 variant 触发一次编译。 */
  get native(): GPURenderPipeline {
    return this.resolve();
  }

  /** 当前已编译的 variant 数量。 */
  get variantCount(): number {
    return this.cache.size;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /**
   * 解析（并缓存）某个 target/variant 对应的具体 pipeline。
   *
   * `variant` 里未给出的字段按以下顺序取值：pipeline descriptor → `render` 预设 → 默认值。
   */
  resolve(variant: Partial<RenderPipelineVariant> = {}): GPURenderPipeline {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`,
      );
    }
    const resolved = this.resolveVariant(variant);
    return this.cache.resolve(renderPipelineCacheKey(resolved), () => this.createNative(resolved));
  }

  /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
  get compiledVariants(): readonly string[] {
    return this.cache.keys();
  }

  /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.cache.dispose();
  }

  private resolveVariant(partial: Partial<RenderPipelineVariant>): RenderPipelineVariant {
    const descriptor = this.descriptor;
    const colorFormats = partial.colorFormats ?? this.defaultColorFormats();
    const sampleCount = assertSampleCount(
      partial.sampleCount ?? descriptor.multisample?.count ?? descriptor.render?.multisample?.count ?? 1,
      `RenderPipeline "${this.label}": sampleCount`,
    );
    const depthFormat =
      partial.depthFormat !== undefined
        ? partial.depthFormat
        : descriptor.depthStencil?.format ?? null;
    const vertexLayouts = partial.vertexLayouts ?? descriptor.vertex.buffers ?? [];

    if (descriptor.fragment && colorFormats.length === 0) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. ` +
          'Declare `colorFormats` on the descriptor, or pass them per target via ' +
          'resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.',
      );
    }
    if (!descriptor.fragment && !descriptor.depthStencil?.format && depthFormat === null) {
      throw new ValidationError(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depth format; ` +
          'WebGPU cannot create a pipeline that writes to nothing.',
      );
    }
    if (vertexLayouts.length === 0 && !this.warnedMissingVertexLayouts) {
      this.warnedMissingVertexLayouts = true;
      this.logger.debug(
        'building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes',
      );
    }

    for (const format of colorFormats) {
      // 触发格式合法性校验（未知格式在这里就会抛错）。
      toGPUTextureFormat(format);
    }
    if (depthFormat !== null) toGPUTextureFormat(depthFormat);

    return { colorFormats, sampleCount, depthFormat, vertexLayouts };
  }

  private defaultColorFormats(): readonly TextureFormat[] {
    const { descriptor } = this;
    if (descriptor.colorFormats) return descriptor.colorFormats;
    if (descriptor.render?.colorFormats) return descriptor.render.colorFormats;
    const targets = descriptor.fragment?.targets;
    if (!targets) return [];
    const formats: TextureFormat[] = [];
    for (const target of targets) {
      if (target?.format === undefined) return [];
      formats.push(target.format);
    }
    return formats;
  }

  private createNative(variant: RenderPipelineVariant): GPURenderPipeline {
    const nativeDescriptor = this.toGPURenderPipelineDescriptor(variant);
    this.logger.debug(`creating render pipeline variant ${renderPipelineCacheKey(variant)}`);
    return this.device.native.createRenderPipeline(nativeDescriptor);
  }

  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(variant: RenderPipelineVariant): GPURenderPipelineDescriptor {
    const descriptor = this.descriptor;
    const limits = this.device.limits;

    const vertexState: VertexState = descriptor.vertex;
    const module = asWebGPUShaderModule(vertexState.module, `RenderPipeline "${this.label}".vertex.module`);
    const vertex: GPUVertexState = {
      module: module.compile(ShaderStage.Vertex),
      entryPoint: vertexState.entryPoint ?? DEFAULT_VERTEX_ENTRY_POINT,
      buffers: WebGPURenderState.toGPUVertexBufferLayouts(variant.vertexLayouts, limits),
    };

    const fragmentState: FragmentState | undefined = descriptor.fragment;
    let fragment: GPUFragmentState | undefined;
    if (fragmentState) {
      const fragmentModule = asWebGPUShaderModule(
        fragmentState.module,
        `RenderPipeline "${this.label}".fragment.module`,
      );
      fragment = {
        module: fragmentModule.compile(ShaderStage.Fragment),
        entryPoint: fragmentState.entryPoint ?? DEFAULT_FRAGMENT_ENTRY_POINT,
        targets: WebGPURenderState.toGPUColorTargets(variant.colorFormats, fragmentState.targets, {
          blend: descriptor.render?.blend,
          writeMask: descriptor.render?.writeMask,
        }),
      };
    }

    const primitiveState = descriptor.primitive ?? descriptor.render?.primitive;
    const depthState = descriptor.depthStencil ?? descriptor.render?.depthStencil;
    const multisampleState = descriptor.multisample ?? descriptor.render?.multisample;
    const depthFormat = variant.depthFormat;

    const nativeDescriptor: GPURenderPipelineDescriptor = {
      label: this.label,
      layout: asGPUPipelineLayout(this.layout, `RenderPipeline "${this.label}"`),
      vertex,
      primitive: WebGPURenderState.toGPUPrimitiveState(primitiveState, this.device.features),
      multisample: WebGPURenderState.toGPUMultisampleState(multisampleState, variant.sampleCount),
    };
    if (fragment) nativeDescriptor.fragment = fragment;
    if (depthFormat !== null) {
      nativeDescriptor.depthStencil = WebGPURenderState.toGPUDepthStencilState(depthFormat, depthState);
    } else if (depthState) {
      // depthFormat 为 null 表示当前 target 没有 depth attachment；此时不能写 depthStencil。
      this.logger.debug('depthStencil state declared but the variant has no depth format; ignoring it');
    }
    return nativeDescriptor;
  }
}

/** 该对象是否为 WebGPU 后端的 render pipeline。 */
export function isWebGPURenderPipeline(value: unknown): value is WebGPURenderPipeline {
  return value instanceof WebGPURenderPipeline;
}

/**
 * 把 core 的 `RenderPipeline` 收窄为原生 `GPURenderPipeline`。
 *
 * 传入 `WebGPURenderPipeline` 时会走 `resolve(variant)`；如果是别的后端（或 escape hatch
 * 拿到的原生 pipeline），只能按「已经建好的对象」直接使用。
 */
export function asGPURenderPipeline(
  value: unknown,
  context: string,
  variant?: Partial<RenderPipelineVariant>,
): GPURenderPipeline {
  if (value instanceof WebGPURenderPipeline) return value.resolve(variant);
  const native = (value as { native?: unknown } | null | undefined)?.native;
  if (native && typeof native === 'object' && typeof (native as { getBindGroupLayout?: unknown }).getBindGroupLayout === 'function') {
    return native as GPURenderPipeline;
  }
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native ` +
      `GPURenderPipeline).`,
  );
}

/** 供 cache key 诊断使用：只列出会参与 key 的字段。 */
export function describeRenderPipelineVariant(variant: RenderPipelineVariant): string {
  return cacheKey(variant.colorFormats.join(','), variant.sampleCount, variant.depthFormat ?? 'none');
}
