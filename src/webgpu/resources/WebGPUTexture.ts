/**
 * WebGPU texture 资源：`Texture` 接口在 `GPUTexture` 上的实现。
 *
 * 两条创建路径：
 * - {@link WebGPUTexture.create}：由 `device.createTexture()` 走正常流程，usage / format /
 *   sampleCount 会在进入 WebGPU 之前按能力表校验；
 * - {@link WebGPUTexture.adopt}：把已经存在的原生 `GPUTexture`（典型例子是 canvas
 *   back buffer 的帧纹理）包起来。这类 texture 由 canvas 拥有，`destroy()` 不会销毁它。
 *
 * view 的创建与缓存也在本类：同一个 subresource 组合只建一次 view，并随 texture 一起释放。
 * mip 降采样逐级用到的原生 view / bind group 同样按**级**缓存在实例上（见 `generateMipmaps`）。
 *
 * **行序（本后端就是「基准」那一侧）**：WebGPU 规定纹素 (0, 0) 在左上角，纹理坐标 `v = 0`
 * 指向纹素第 0 行。`queue.writeTexture` 不翻数据（数据第 0 行 → 纹素第 0 行），
 * `copyExternalImageToTexture` 的 `flipY` 显式控制是否把来源的上下翻过来，
 * `copyTextureToBuffer` 的缓冲区第 0 行 = 纹素行 `origin.y`。本库的整体约定以这套语义为准
 * （见 `core/resources/Texture.ts` 的说明），WebGL2 后端在上传与读回上已经对齐，
 * 只有「渲染进纹理」还差一处（GL 的渲染目标自下而上存储）。
 */

import type { Texture, TextureDescriptor, TextureDimension } from '../../core/resources/Texture.js';
import type { TextureFormat } from '../../core/enums/TextureFormat.js';
import { TextureUsage } from '../../core/enums/TextureUsage.js';
import type { TextureView, TextureViewDescriptor } from '../../core/resources/TextureView.js';
import type { Extent3D } from '../../types/internal.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { fullMipLevelCount, resolveTextureSize } from '../../core/resources/Texture.js';
import { resolveTextureViewDescriptor } from '../../core/resources/TextureView.js';
import { cacheKey } from '../../core/pipeline/PipelineCache.js';
import { GPU_SHADER_STAGE, toGPUTextureUsage } from '../utils/wgpuEnumMap.js';
import {
  assertRenderableFormat,
  assertTextureUsageSupported,
  fromGPUTextureFormat,
  isFilterableFormat,
  toGPUTextureFormat,
} from '../utils/wgpuFormatMap.js';
import { WebGPUTextureView } from './WebGPUTextureView.js';
import { describeUnknown } from './WebGPUBuffer.js';

/** 已解析的 texture 描述，便于 resize / 调试时复用。 */
export interface ResolvedTextureDescriptor {
  readonly label: string;
  readonly size: Extent3D;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly dimension: TextureDimension;
  readonly format: TextureFormat;
  readonly usage: TextureUsage;
  readonly viewFormats: readonly TextureFormat[];
}

export class WebGPUTexture implements Texture {
  readonly label: string;
  readonly dimension: TextureDimension;
  readonly format: TextureFormat;
  readonly usage: TextureUsage;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly native: GPUTexture;
  /** 创建时声明的额外 view 格式。 */
  readonly viewFormats: readonly TextureFormat[];

  private readonly device: WebGPUDevice;
  private readonly owned: boolean;
  private readonly extent: Extent3D;
  private readonly viewCache = new Map<string, WebGPUTextureView>();
  private readonly viewList: WebGPUTextureView[] = [];
  /** 无参 `createView()` 的解析结果与 cache key：这是最常见的热路径，只需算一次。 */
  private defaultViewResolved: TextureView['descriptor'] | null = null;
  private defaultViewKey: string | null = null;
  /**
   * mip 降采样每一级、每一层用到的原生对象缓存，键是 **`"<级>:<层>"` 复合键**。
   *
   * 这三样东西只由 (本纹理, 级, 层, 格式) 决定，与「第几次调用 `generateMipmaps()`」无关：反复调用
   * 时它们逐字段相同，重建纯属浪费（原生 view 的创建与 bind group 的校验都不便宜）。
   *
   * ## 为什么键必须带上「层」（本批最容易改出的静默错误）
   *
   * 数组 / 3D 纹理要**逐层**各降一遍，每一层的源 view、目标 view、bind group 都不同。
   * 如果键仍然只有级号，第 2 层就会命中第 1 层留下的条目 —— 这一层渲染时采样的还是第 1 层的
   * 源、写进的还是第 1 层的目标：**跨层串味**，而且 GPU 不会报任何错，只是画面悄悄错。
   * 这与 `#32`（FBO 缓存键改对象身份）是同一类教训：**键漏字段 = 静默画错**。
   * 单层 2d 纹理只有 `(级, 0)`，所以这个复合键对它**不多不少**就是「按级缓存」。
   *
   * 缓存**挂在纹理实例上**而不是模块级：view 是这张 texture 的 subresource，只有它自己能采样 /
   * 渲染，跨纹理共享必然是错的；生命周期也与纹理一致，`destroy()` 时清掉。
   * 条目数上限是「所有级 × 该级的层数」，创建后不再变化，不会随调用次数增长。
   */
  private readonly mipPassCache = new Map<string, MipDownsamplePass>();
  private _disposed = false;

  private constructor(
    device: WebGPUDevice,
    native: GPUTexture,
    descriptor: ResolvedTextureDescriptor,
    owned: boolean,
  ) {
    this.device = device;
    this.owned = owned;
    this.native = native;
    this.label = descriptor.label;
    this.extent = descriptor.size;
    this.dimension = descriptor.dimension;
    this.format = descriptor.format;
    this.usage = descriptor.usage;
    this.mipLevelCount = descriptor.mipLevelCount;
    this.sampleCount = descriptor.sampleCount;
    this.viewFormats = descriptor.viewFormats;
    this.width = descriptor.size.width;
    this.height = descriptor.size.height;
    this.depthOrArrayLayers = descriptor.size.depthOrArrayLayers;
  }

  /**
   * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
   *
   * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
   */
  static create(device: WebGPUDevice, descriptor: TextureDescriptor): WebGPUTexture {
    const size = resolveTextureSize(descriptor.size);
    const resolved: ResolvedTextureDescriptor = {
      label: descriptor.label ?? `texture#${device.nextResourceId('texture')}`,
      size,
      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      dimension: descriptor.dimension ?? '2d',
      format: descriptor.format,
      usage: descriptor.usage,
      viewFormats: descriptor.viewFormats ?? [],
    };

    assertTextureDescriptor(resolved, device);

    const native = device.native.createTexture({
      label: resolved.label,
      size: { width: size.width, height: size.height, depthOrArrayLayers: size.depthOrArrayLayers },
      mipLevelCount: resolved.mipLevelCount,
      sampleCount: resolved.sampleCount,
      dimension: resolved.dimension,
      format: toGPUTextureFormat(resolved.format),
      usage: toGPUTextureUsage(resolved.usage),
      viewFormats: resolved.viewFormats.map((format) => toGPUTextureFormat(format)),
    });
    return new WebGPUTexture(device, native, resolved, true);
  }

  /**
   * 包住一个已经存在的原生 `GPUTexture`（例如 canvas 的帧纹理）。
   *
   * `owned` 为 `false` 时 `destroy()` 只标记本包装对象失效，不会销毁底层 texture。
   * 未提供的字段会直接从原生对象读取（canvas 帧纹理的尺寸/格式只能这样拿到）。
   */
  static adopt(
    device: WebGPUDevice,
    native: GPUTexture,
    descriptor: Partial<ResolvedTextureDescriptor> = {},
    options: { owned?: boolean } = {},
  ): WebGPUTexture {
    const size: Extent3D = descriptor.size ?? {
      width: native.width,
      height: native.height,
      depthOrArrayLayers: native.depthOrArrayLayers,
    };
    const resolved: ResolvedTextureDescriptor = {
      label: descriptor.label ?? (native.label.length > 0 ? native.label : 'canvas-texture'),
      size,
      mipLevelCount: descriptor.mipLevelCount ?? native.mipLevelCount,
      sampleCount: descriptor.sampleCount ?? native.sampleCount,
      dimension: descriptor.dimension ?? native.dimension,
      format: descriptor.format ?? fromGPUTextureFormat(native.format),
      usage: descriptor.usage ?? native.usage,
      viewFormats: descriptor.viewFormats ?? [],
    };
    return new WebGPUTexture(device, native, resolved, options.owned ?? false);
  }

  get size(): Extent3D {
    return { ...this.extent };
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 当前 texture 是否仍然可用。 */
  get usable(): boolean {
    return !this._disposed && !this.device.disposed;
  }

  /** 按 subresource 选择创建（并缓存）view。 */
  createView(descriptor?: TextureViewDescriptor): WebGPUTextureView {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] Texture.createView: texture "${this.label}" has been destroyed.`,
      );
    }
    // 解析后的 descriptor 与 cache key 都只与 subresource 组合有关：
    // - 无参调用是最常见的热路径，解析结果与 key 在 texture 生命周期内固定，缓存起来；
    // - 非默认调用解析一次就够，解析结果直接交给 view（原先 view 构造时又解析了一遍）。
    let resolved: TextureView['descriptor'];
    let key: string;
    if (descriptor === undefined) {
      resolved = this.defaultViewResolved ?? (this.defaultViewResolved = resolveTextureViewDescriptor(this, {}));
      key = this.defaultViewKey ?? (this.defaultViewKey = viewCacheKey(resolved));
    } else {
      resolved = resolveTextureViewDescriptor(this, descriptor);
      key = viewCacheKey(resolved);
    }
    const cached = this.viewCache.get(key);
    if (cached) return cached;
    const view = new WebGPUTextureView(this, descriptor, resolved);
    this.viewCache.set(key, view);
    this.viewList.push(view);
    return view;
  }

  /** 目前已创建的 view；随 texture 一同释放。 */
  get views(): readonly TextureView[] {
    return this.viewList;
  }

  /**
   * 用 render pass 逐级降采样生成 mip 链（第 1 级到第 `mipLevelCount - 1` 级）。
   *
   * WebGPU **没有** `generateMipmap`（`GPUQueue` 和 `GPUTexture` 都没有这个方法），所以这里
   * 自己实现：对 `level = 1 .. mipLevelCount - 1` 各开一个 render pass，把上一级当作纹理采样、
   * 把本级当作颜色附件。目标级别的每个像素用自己的中心去采样上一级，配一个 `linear` 采样器：
   * 当上一级正好是本级的两倍时，像素中心恰好落在源 2x2 纹素的正中，一次双线性采样就是标准的
   * 2x2 盒式平均。
   *
   * **非 2:1 的级别（非 2 的幂纹理降到最后几级）**：此时一次双线性采样是「以目标像素中心为
   * 中心的 tent 滤波」，不是严格的面积加权平均 —— 它会覆盖整个源范围，但权重不是均等的。
   * 这是 WebGPU 社区通行的 `generateMipmaps` 做法，实测结果与 WebGL2 的 `gl.generateMipmap`
   * 几乎一致（`examples/core-texture-mipmap.ts` 里 60x36 的第 5 级：本实现 66,189,131，
   * WebGL2 是 66,190,131，而 JS 盒式路径是 119,134,127）。要做到严格等权的面积平均需要
   * 逐级用 compute shader 按覆盖率加权，代价远大于收益；确实需要时可以先把纹理缩放成 2 的幂，
   * 或者离线生成 mip 链再用 `writeTexture` 逐级上传。
   *
   * **为什么用 render pass 而不是 compute shader**：
   * - 两者都能实现，但 render pass 版本**不需要 `StorageBinding`**（不必为此扩大纹理 usage），
   *   而且直接复用硬件的光栅化与纹理滤波，代码量与出错面都小得多；
   * - compute 版本要自己处理纹理存储格式的读写，每种格式（r8 / rg8 / bgra / srgb）都要单独
   *   写通道与色彩空间转换；更要命的是 `rgba8unorm-srgb` 在 storage texture 里**没有对应变体**，
   *   线性空间降采样根本写不对 —— 那不是「多写点代码」，而是做不出正确结果；
   * - render pass 写 `-srgb` 目标时由硬件负责「线性 → sRGB 编码」，颜色空间语义天然正确，
   *   与 WebGL2 的 `generateMipmap` 完全一致。
   *
   * 代价是逐级各一次 render pass（相邻级别有数据依赖，必须串行），对 2048x2048 就是 11 次
   * 很小的 draw —— 实测耗时见 `examples/core-texture-mipmap.ts`。
   *
   * 前置条件（不满足就抛 {@link ValidationError}，不做静默降级）：
   * - 单采样、`mipLevelCount > 1`；
   * - usage 必须带 `TextureUsage.RenderAttachment`，因为本方法要把它当颜色附件写；
   * - 格式必须**可渲染且可过滤**：`rgba8snorm`、`rgb9e5ufloat` 这类不可渲染的格式，以及整数
   *   格式（不能线性滤波）都走不了这条路径，需要改用 `rgba8unorm` 系列或自己上 compute。
   *
   * 这里刻意用**原生** WebGPU 对象（pipeline / bind group / encoder 都是临时的），
   * 而不是 core 的工厂：core 的 `create*` 会把资源登记到 `device` 上一直追踪到设备释放，
   * 为一次 mip 生成留下几个生命周期很长的包装对象并不划算。pipeline 按 (device, format)
   * 缓存在模块级 WeakMap 里，同一个格式只建一次；逐级逐层用到的 view / bind group 则按
   * **`"<级>:<层>"` 复合键**缓存在本实例上（见 {@link mipPassCache}），所以对同一张纹理
   * 反复调用不会重复创建，数组 / 3D 也不会跨层串味。
   *
   * ## 数组 / 3D 纹理怎么处理（`#27`）
   *
   * `2d-array` 的每一层是**互相独立**的 subresource，所以逐层各降一遍，源层与目标层是同号层
   * （第 s 层只由第 s 层降下来）—— 与 `gl.generateMipmap` 对数组纹理的语义一致。
   *
   * `3d` 的层数沿 z **减半**（WebGPU 规范：`max(1, depth >> mipLevel)`，层数组则不减半），
   * 所以第 `level` 级写 `max(1, depth >> level)` 片，目标第 s 片采样源第 `s >> 1` 片：
   * 同一片源的两次结果分别落到两片目标上，正好覆盖整条链。
   *
   * 每一层的降采样复用同一套「全屏三角形 + 双线性采样」逻辑，层级由 bind group 里的一个
   * uniform 传进着色器（**不能**靠默认的 0 层 —— 那样每一层都会采样到第 0 层的内容，
   * 这是本特性最容易犯的静默错误）。单层 2d 走的是**原来那条两绑定管线**，指令流逐字段不变。
   */
  generateMipmaps(): void {
    if (this._disposed) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: the texture has been destroyed.`,
      );
    }
    if (!this.usable) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: the owning device is not usable.`,
      );
    }
    if (this.sampleCount > 1) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: a multisampled texture ` +
          `(sampleCount=${this.sampleCount}) has no mip chain.`,
      );
    }
    if (this.mipLevelCount <= 1) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: mipLevelCount is 1, so there is no ` +
          'level to generate; allocate the texture with an explicit mipLevelCount (fullMipLevelCount(size)).',
      );
    }
    if ((this.usage & TextureUsage.RenderAttachment) === 0) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: WebGPU has no generateMipmap, so the ` +
          'backend downsamples with render passes; this texture was created without the ' +
          '"RenderAttachment" usage. Add TextureUsage.RenderAttachment (the gfx layer does this ' +
          'automatically when mipmaps are requested).',
      );
    }
    assertRenderableFormat(this.format, this.device.features, `Texture "${this.label}".generateMipmaps`);
    if (!isFilterableFormat(this.format, this.device.features)) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" is not ` +
          'filterable on this device, so the downsampling pass cannot average 2x2 texels. Use a ' +
          'unorm/float format such as rgba8unorm(-srgb), bgra8unorm(-srgb), r8unorm or rg8unorm.',
      );
    }

    const device = this.device.native;
    const generator = acquireMipmapGenerator(device, this.format);
    // 单层 2d 不需要层级 uniform（保留原来那条两绑定的管线，指令流与改动前逐字段一致）；
    // 只要还有第二层（2d-array 或 3d），就必须让着色器知道当前在降哪一层。
    const layered = this.dimension === '3d' || this.depthOrArrayLayers > 1;
    const encoder = device.createCommandEncoder({ label: `${this.label}:mipmap` });
    for (let level = 1; level < this.mipLevelCount; level++) {
      // `2d-array` 的层数不随级别变化；`3d` 的深度从第 0 级开始逐级减半（规范：max(1, depth >> level)）。
      const layers = layered ? layerCountAtLevel(this.dimension, this.depthOrArrayLayers, level) : 1;
      for (let layer = 0; layer < layers; layer++) {
        const pass = this.acquireMipPass(device, generator, level, layer, layered);
        const renderPass = encoder.beginRenderPass({
          label: `${this.label}:mip${level}`,
          colorAttachments: [
            {
              view: pass.target,
              // 目标级别会被完整覆盖（全屏三角形），clear 只是为了让 loadOp 合法。
              loadOp: 'clear',
              storeOp: 'store',
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
            },
          ],
        });
        renderPass.setPipeline(pass.pipeline);
        renderPass.setBindGroup(0, pass.bindGroup);
        renderPass.draw(3);
        renderPass.end();
      }
    }
    device.queue.submit([encoder.finish()]);
  }

  /**
   * 取出（必要时创建）某一级、某一层降采样要用的原生对象：源 view、目标 view、bind group
   * （数组 / 3D 时还包括传层号的 uniform buffer）。
   *
   * 创建参数与缓存引入前**逐字段一致**（label / dimension / 覆盖的 mip 范围 / 覆盖的层范围），
   * 否则会得到「看起来一样、其实范围或格式不同」的隐蔽错误。缓存的键是 `"<级>:<层>"` 复合键：
   * 同一个 (级, 层) 在每次调用里的源/目标/绑定完全相同，因此只有第一次调用会真的创建；
   * 而不同的层一定落在不同的条目上，不会互相冒充。
   *
   * `generator` 由 (device, 纹理格式) 唯一决定，而这两者对纹理是常量，所以缓存的 bind group
   * 永远与当前的管线布局匹配。
   */
  private acquireMipPass(
    device: GPUDevice,
    generator: MipmapGenerator,
    level: number,
    layer: number,
    layered: boolean,
  ): MipDownsamplePass {
    const key = mipPassCacheKey(level, layer);
    const cached = this.mipPassCache.get(key);
    if (cached !== undefined) return cached;
    // 源与目标各建一个只覆盖「单级单层」的 view：它们属于**不同的 subresource**，
    // 因此可以在相邻的 pass 里一个当采样纹理、一个当颜色附件（同一 pass 内互换才是非法的）。
    //
    // 源层的算法：
    // - `2d-array`：层数不随级别变化，第 s 层只由上一级的第 s 层降下来（逐层独立）；
    // - `3d`：目标第 s 层覆盖的是源 `[2s, 2s+1]` 两片，这里取其中**离采样点最近的那一片**
    //   （源第 `2s` 片，即 `layer << 1`）—— 与「把 3D 纹理的每一片当独立的 2D 纹理逐层降采样」
    //   这一通行做法一致，代价是 z 方向没有做面积平均（见方法注释）。
    const sourceLayer = this.dimension === '3d' ? layer << 1 : layer;
    const source = this.native.createView({
      label: `${this.label}:mip${level - 1}`,
      dimension: '2d',
      baseMipLevel: level - 1,
      mipLevelCount: 1,
      baseArrayLayer: sourceLayer,
      // 目标第 s 层对 `2d-array` 就是源第 s 层；对 `3d` 是源第 2s 片（两片里的一片）。
      arrayLayerCount: 1,
    });
    const target = this.native.createView({
      label: `${this.label}:mip${level}`,
      dimension: '2d',
      baseMipLevel: level,
      mipLevelCount: 1,
      baseArrayLayer: layer,
      arrayLayerCount: 1,
    });

    if (!layered) {
      const bindGroup = device.createBindGroup({
        label: `${this.label}:mip${level}`,
        layout: generator.bindGroupLayout,
        entries: [
          { binding: 0, resource: source },
          { binding: 1, resource: generator.sampler },
        ],
      });
      const pass: MipDownsamplePass = { source, target, bindGroup, pipeline: generator.pipeline };
      this.mipPassCache.set(key, pass);
      return pass;
    }

    /*
     * 层级 uniform：三个 f32 —— (源层号, 0, 0)。
     *
     * 着色器用 `textureSampleLevel(texture_2d_array<f32>, ...)` 时必须显式给出层号，
     * 否则默认采第 0 层：那样数组的每一层都会拿到第 0 层的内容，GPU 不报错、画面全错。
     * 参数只与 (级, 层) 有关，所以随 pass 一起缓存，不需要每次调用重写。
     */
    const layerUniform = device.createBuffer({
      label: `${this.label}:mip${level}:layer`,
      size: 16, // uniform buffer 的最小绑定大小是 16 字节（我们只用前 4 个）。
      usage: MIPMAP_UNIFORM_USAGE,
    });
    device.queue.writeBuffer(layerUniform, 0, new Float32Array([sourceLayer, 0, 0, 0]));
    // 数组 / 3D 才需要这条三绑定管线；`layered()` 首次调用时创建，之后复用。
    const layeredObjects = generator.layered();
    const bindGroup = device.createBindGroup({
      label: `${this.label}:mip${level}`,
      layout: layeredObjects.bindGroupLayout,
      entries: [
        { binding: 0, resource: source },
        { binding: 1, resource: generator.sampler },
        { binding: 2, resource: { buffer: layerUniform } },
      ],
    });
    const pass: MipDownsamplePass = {
      source,
      target,
      bindGroup,
      pipeline: layeredObjects.pipeline,
    };
    this.mipPassCache.set(key, pass);
    return pass;
  }

  /** 销毁 texture（`owned` 为 false 时只标记包装对象失效）。幂等。 */
  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const view of this.viewList) view.dispose();
    this.viewCache.clear();
    this.defaultViewResolved = null;
    this.defaultViewKey = null;
    // mip 降采样的 view / bind group 也指向这张纹理的 subresource，随纹理一起失效。
    // 原生 `GPUTextureView` 没有 destroy()，丢掉引用就是全部清理工作。
    this.mipPassCache.clear();
    if (this.owned) this.native.destroy();
    // 通知设备取消追踪；canvas 帧纹理（adopt）本来就没被追踪，delete 是空操作。
    this.device.untrack(this);
  }

  /** `Disposable` 的别名。 */
  dispose(): void {
    this.destroy();
  }
}

function viewCacheKey(d: TextureView['descriptor']): string {
  return cacheKey(
    d.format ?? '',
    d.dimension,
    d.baseMipLevel,
    d.mipLevelCount,
    d.baseArrayLayer,
    d.arrayLayerCount,
    d.aspect,
    // `#23`：swizzle 是 view 的一部分 —— 不把它算进 key 会让
    // `createView({ swizzle: 'rrr1' })` 直接命中此前 `createView()` 的缓存条目，
    // 于是「采样时重排通道」静默失效（拿到视图里的 descriptor 也不对）。
    d.swizzle ?? '',
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* mipmap 降采样管线                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 生成 mip 用的全屏三角形着色器（单层 2d）。
 *
 * 顶点着色器不发顶点缓冲：`@builtin(vertex_index)` 直接算出覆盖整个裁剪空间的大三角形，
 * 顺便把 uv 一起插值出来（三个角是 (0,0)、(2,0)、(0,2)，可见区就是 uv 的 [0,1]²）。
 */
const MIPMAP_DOWNSAMPLE_WGSL = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var sourceTexture: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let uv = vec2f(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
  var out: VertexOutput;
  out.uv = uv;
  out.position = vec4f(uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), 0.0, 1.0);
  return out;
}

@fragment
fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  // 全屏三角形把 uv 线性映射到整个目标级别，因此目标像素中心落在源级别 2x2 纹素的正中时，
  // 一次双线性采样恰好是这 4 个纹素的平均值（sRGB 格式会在滤波前先解码到线性空间）。
  return textureSampleLevel(sourceTexture, sourceSampler, in.uv, 0.0);
}
`;

/**
 * 数组 / 3D mip 降采样用的着色器：与上面逐字节相同，只多一个**层级 uniform**。
 *
 * 为什么必须显式传层号：`texture_2d_array<f32>` 的 `textureSampleLevel(..., vec2f uv, level)`
 * 重载**默认采第 0 层**，没有「当前附件层」这种隐式绑定（WGSL 的 `@builtin(layer)` 只在顶点
 * 阶段可用，片元阶段不能拿来当附件层）。如果不传层号，数组的每一层都会拿到第 0 层的内容 ——
 * GPU 不报任何错，只是画面全错。这是本特性最容易犯的静默错误，所以层号走 uniform 显式传进
 * 片元着色器。
 *
 * uniform 的 `x` 就是「本层要从源纹理的哪一层采样」（见 `WebGPUTexture.acquireMipPass`）；
 * `y` / `z` 留作扩展（目前恒为 0）。
 */
const MIPMAP_DOWNSAMPLE_LAYERED_WGSL = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

struct LayerParams {
  layer: vec3f,
}

@group(0) @binding(0) var sourceTexture: texture_2d_array<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
@group(0) @binding(2) var<uniform> params: LayerParams;

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let uv = vec2f(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
  var out: VertexOutput;
  out.uv = uv;
  out.position = vec4f(uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), 0.0, 1.0);
  return out;
}

@fragment
fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let coord = vec3f(in.uv, params.layer.x);
  return textureSampleLevel(sourceTexture, sourceSampler, coord, 0.0);
}
`;

interface MipmapGenerator {
  /** 单层 2d 用的两绑定管线（纹理 + 采样器）。 */
  readonly pipeline: GPURenderPipeline;
  readonly bindGroupLayout: GPUBindGroupLayout;
  /** 采样器与层级无关，两条管线共用。 */
  readonly sampler: GPUSampler;
  /**
   * 数组 / 3D 用的三绑定管线（多一个层级 uniform），**首次需要时才创建**。
   *
   * 「按时创建」不是微优化：单层 2d 的调用方（绝大多数）不该因为这条路径付出一次额外的
   * `createBindGroupLayout` + `createRenderPipeline`，更不该在管线缓存计数上看到两条管线
   * （既有契约测试 `webgpu-mipmap.test.ts` 明确断言「同一格式只建一条管线」）。
   */
  layered(): { pipeline: GPURenderPipeline; bindGroupLayout: GPUBindGroupLayout };
}

/**
 * 一级、一层 mip 降采样需要的原生对象。
 *
 * 它们都是「这张纹理 + 这一级 + 这一层」的纯函数结果，所以可以整组缓存
 * （见 `WebGPUTexture.mipPassCache` 的复合键）。`source` 只覆盖 mip `level - 1` 的对应层、
 * `target` 只覆盖 mip `level` 的本层：它们必须是不同的 view，因为同一个 render pass 里不能
 * 既把某个 subresource 当采样源、又把它当颜色附件。
 */
interface MipDownsamplePass {
  readonly source: GPUTextureView;
  readonly target: GPUTextureView;
  readonly bindGroup: GPUBindGroup;
  /** 本 pass 要用哪条管线（决定 bind group 的绑定数）。 */
  readonly pipeline: GPURenderPipeline;
}

/** 每个原生 device 一份，键是 GPU 纹理格式（render pipeline 的 target format 与它绑定）。 */
const mipmapGenerators = new WeakMap<GPUDevice, Map<string, MipmapGenerator>>();
/** 着色器模块与格式无关，每个 device 每种变体只建一次。 */
const mipmapShaderModules = new WeakMap<GPUDevice, { plain: GPUShaderModule; layered: GPUShaderModule }>();

/** 缓存键：**级与层都要在键里**，少一个字段就会跨层串味（见 `WebGPUTexture.mipPassCache`）。 */
function mipPassCacheKey(level: number, layer: number): string {
  return `${level}:${layer}`;
}

/**
 * 层级 uniform buffer 的 usage：`UNIFORM | COPY_DST`（0x40 | 0x08）。
 *
 * 这里刻意用字面量而不是全局的 `GPUBufferUsage`：本模块在 Node 侧（单测、SSR、离线工具）也会被
 * 导入，那时 `GPUBufferUsage` 根本不存在 —— 用全局会在「只是创建一张纹理、根本没走多维 mip 路径」
 * 的情况下就抛 `ReferenceError`。其它地方用全局是因为它们只在浏览器里跑，这里不是。
 */
const MIPMAP_UNIFORM_USAGE = 0x0040 | 0x0008;

/**
 * 某一级的有多少层要降采样。
 *
 * - `2d`（含 `2d-array`）：`depthOrArrayLayers` **不随级别变化**（WebGPU 规范
 *   `Logical miplevel-specific texture extent`）—— 数组的层是彼此独立的 subresource；
 * - `3d`：深度沿 z 减半，第 `level` 级是 `max(1, depth >> level)`（同一处规范）。
 */
function layerCountAtLevel(dimension: TextureDimension, depthOrArrayLayers: number, level: number): number {
  if (dimension === '3d') return Math.max(1, depthOrArrayLayers >> level);
  return depthOrArrayLayers;
}

/**
 * 取出（必要时创建）某个纹理格式的降采样管线（单层 2d 与数组 / 3D 两条）。
 *
 * 用 WeakMap 挂在小写的原生 `GPUDevice` 上：设备被回收时缓存自然一起消失，不需要任何清理钩子。
 */
function acquireMipmapGenerator(device: GPUDevice, format: TextureFormat): MipmapGenerator {
  let generators = mipmapGenerators.get(device);
  if (!generators) {
    generators = new Map<string, MipmapGenerator>();
    mipmapGenerators.set(device, generators);
  }
  const cached = generators.get(format);
  if (cached) return cached;

  let shaderModules = mipmapShaderModules.get(device);
  if (!shaderModules) {
    shaderModules = {
      plain: device.createShaderModule({ label: 'mipmap-downsample', code: MIPMAP_DOWNSAMPLE_WGSL }),
      layered: device.createShaderModule({
        label: 'mipmap-downsample-layered',
        code: MIPMAP_DOWNSAMPLE_LAYERED_WGSL,
      }),
    };
    mipmapShaderModules.set(device, shaderModules);
  }

  const label = `mipmap-downsample:${format}`;
  const bindGroupLayout = device.createBindGroupLayout({
    label,
    entries: [
      {
        binding: 0,
        visibility: GPU_SHADER_STAGE.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: '2d' },
      },
      {
        binding: 1,
        visibility: GPU_SHADER_STAGE.FRAGMENT,
        sampler: { type: 'filtering' },
      },
    ],
  });
  const targetFormat = toGPUTextureFormat(format);
  const pipeline = device.createRenderPipeline({
    label,
    layout: device.createPipelineLayout({ label, bindGroupLayouts: [bindGroupLayout] }),
    vertex: { module: shaderModules.plain, entryPoint: 'vsMain' },
    fragment: {
      module: shaderModules.plain,
      entryPoint: 'fsMain',
      targets: [{ format: targetFormat }],
    },
    primitive: { topology: 'triangle-list' },
  });

  // 采样器固定为 linear + clamp：目标像素中心正对源 2x2 纹素的正中，双线性采样恰好是盒式平均；
  // clamp 避免边缘像素因浮点误差采到纹理外而受 wrap 模式影响。
  const sampler = device.createSampler({
    label: 'mipmap-downsample',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'nearest',
  });

  let layeredPair: { pipeline: GPURenderPipeline; bindGroupLayout: GPUBindGroupLayout } | null = null;
  const generator: MipmapGenerator = {
    pipeline,
    bindGroupLayout,
    sampler,
    layered() {
      if (layeredPair) return layeredPair;
      const layeredLabel = `${label}:layered`;
      const layeredBindGroupLayout = device.createBindGroupLayout({
        label: layeredLabel,
        entries: [
          {
            binding: 0,
            visibility: GPU_SHADER_STAGE.FRAGMENT,
            // 视图本身仍是单层的 2d view（逐层降采样），但绑定类型必须是 array ——
            // 这样着色器才能用层号索引，而不是被固定在第 0 层。
            texture: { sampleType: 'float', viewDimension: '2d-array' },
          },
          {
            binding: 1,
            visibility: GPU_SHADER_STAGE.FRAGMENT,
            sampler: { type: 'filtering' },
          },
          {
            binding: 2,
            visibility: GPU_SHADER_STAGE.FRAGMENT,
            buffer: { type: 'uniform', minBindingSize: 16 },
          },
        ],
      });
      const layeredPipeline = device.createRenderPipeline({
        label: layeredLabel,
        layout: device.createPipelineLayout({ label: layeredLabel, bindGroupLayouts: [layeredBindGroupLayout] }),
        vertex: { module: shaderModules.layered, entryPoint: 'vsMain' },
        fragment: {
          module: shaderModules.layered,
          entryPoint: 'fsMain',
          targets: [{ format: targetFormat }],
        },
        primitive: { topology: 'triangle-list' },
      });
      layeredPair = { pipeline: layeredPipeline, bindGroupLayout: layeredBindGroupLayout };
      return layeredPair;
    },
  };
  generators.set(format, generator);
  return generator;
}

function assertTextureDescriptor(descriptor: ResolvedTextureDescriptor, device: WebGPUDevice): void {
  const { width, height, depthOrArrayLayers } = descriptor.size;
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": width and height must be positive integers, ` +
        `got ${width}x${height}.`,
    );
  }
  if (!Number.isInteger(depthOrArrayLayers) || depthOrArrayLayers <= 0) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": depthOrArrayLayers must be a positive integer, ` +
        `got ${String(depthOrArrayLayers)}.`,
    );
  }
  if (!Number.isInteger(descriptor.mipLevelCount) || descriptor.mipLevelCount <= 0) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": mipLevelCount must be a positive integer.`,
    );
  }
  const maxMipLevels = fullMipLevelCount(descriptor.size);
  if (descriptor.mipLevelCount > maxMipLevels) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": mipLevelCount ${descriptor.mipLevelCount} is more than ` +
        `the maximum ${maxMipLevels} for a ${width}x${height}x${depthOrArrayLayers} texture.`,
    );
  }
  if (descriptor.dimension === '1d' && height !== 1) {
    // WebGPU 的 1d texture 高度固定为 1。
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": a "1d" texture must have height 1, got ${height}.`,
    );
  }
  if (descriptor.dimension === '1d' && descriptor.sampleCount > 1) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": a "1d" texture cannot be multisampled.`,
    );
  }

  const maxDimension =
    descriptor.dimension === '1d'
      ? device.limits.maxTextureDimension1D
      : descriptor.dimension === '3d'
        ? device.limits.maxTextureDimension3D
        : device.limits.maxTextureDimension2D;
  if (width > maxDimension || height > maxDimension || depthOrArrayLayers > maxDimension) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": ${width}x${height}x${depthOrArrayLayers} exceeds the ` +
        `${descriptor.dimension} limit ${maxDimension}.`,
    );
  }
  if (descriptor.dimension === '2d' && depthOrArrayLayers > device.limits.maxTextureArrayLayers) {
    throw new ValidationError(
      `[gpu-device-api] Texture "${descriptor.label}": depthOrArrayLayers ${depthOrArrayLayers} exceeds ` +
        `maxTextureArrayLayers ${device.limits.maxTextureArrayLayers}.`,
    );
  }

  assertTextureUsageSupported(
    descriptor.format,
    descriptor.usage,
    {
      sampleCount: descriptor.sampleCount,
      mipLevelCount: descriptor.mipLevelCount,
      dimension: descriptor.dimension,
      features: device.features,
    },
    `Texture "${descriptor.label}"`,
  );

  for (const viewFormat of descriptor.viewFormats) {
    if (viewFormat === descriptor.format) continue;
    // WebGPU 只允许 srgb / 非 srgb 之间的重解释。
    const strip = (format: string): string => format.replace('-srgb', '');
    if (strip(viewFormat) !== strip(descriptor.format)) {
      throw new ValidationError(
        `[gpu-device-api] Texture "${descriptor.label}": viewFormat "${viewFormat}" is not compatible with ` +
          `format "${descriptor.format}" (WebGPU only allows srgb <-> non-srgb reinterpretation).`,
      );
    }
  }
}

/** 该对象是否为 WebGPU 后端的 texture。 */
export function isWebGPUTexture(value: unknown): value is WebGPUTexture {
  return value instanceof WebGPUTexture;
}

/** 原生 `GPUTexture` 的形状识别。 */
export function isNativeGPUTexture(value: unknown): value is GPUTexture {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { createView?: unknown; destroy?: unknown; native?: unknown };
  return (
    typeof candidate.createView === 'function' &&
    typeof candidate.destroy === 'function' &&
    !('native' in candidate)
  );
}

/**
 * 把 core 的 `TextureLike`（命令层用的最小结构）收窄为原生 `GPUTexture`。
 *
 * 命令层刻意只依赖 `{ native?: unknown }`，因此后端必须在这里补上运行时收窄；
 * 收不到合适的原生对象时抛 {@link ValidationError}，避免把 WebGL2 的资源交给 WebGPU。
 */
export function asGPUTexture(value: unknown, context: string): GPUTexture {
  if (value instanceof WebGPUTexture) return value.native;
  if (isNativeGPUTexture(value)) return value;
  const nested = (value as { native?: unknown } | null | undefined)?.native;
  if (nested !== undefined && isNativeGPUTexture(nested)) return nested;
  throw new ValidationError(
    `[gpu-device-api] ${context}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), ` +
      `got ${describeUnknown(value)}.`,
  );
}
