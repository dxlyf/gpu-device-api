/**
 * `Renderer`：便捷层的门面。目标是「五行画出东西」：
 *
 * ```ts
 * const renderer = await Renderer.create({ canvas });
 * const geometry = renderer.createGeometry(shapes.sphere());
 * const material = renderer.createMaterial(materials.lambert({ color: [1, 0.6, 0.2, 1] }));
 *
 * renderer.setCamera(new PerspectiveCamera({ position: [0, 0, 3] }));
 * renderer.beginFrame({ color: '#101418' });
 * renderer.draw(geometry, { material });
 * renderer.endFrame();
 * ```
 *
 * 它内部只调用 core 的 `Device` / `CommandEncoder` / `RenderPassEncoder`，
 * 但替使用者处理掉了几件必须做对的事：
 *
 * 1. **uniform arena + 动态偏移** —— 「改 uniform → draw → 再改 → 再 draw」在 WebGPU 上本来是错的
 *    （`writeBuffer` 在 submit 时才生效），arena 让它在两个后端都正确；
 * 2. **管线按材质缓存** —— 一条材质一条管线，几何体多带属性也不影响；
 * 3. **顶点缓冲槽位映射** —— 按材质声明的属性顺序绑定几何体的对应属性；
 * 4. **bind group 缓存** —— uniform 的 bind group 由 arena 管，纹理的按「材质 + 纹理集合」缓存；
 * 5. **相机 uniform** —— `projectionView` 按后端自动选用 GL 或 ZO 的深度约定。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { createDeviceWithAdapter } from '../factories/createDevice.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { mat3, mat4, type Mat4 } from '../utils/math/index.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasContext } from '../core/CanvasContext.js';
import type { Device } from '../core/Device.js';
import type { CommandEncoder, CommandBuffer } from '../core/render/CommandEncoder.js';
import type { RenderPassDescriptor, RenderPassEncoder } from '../core/render/RenderPassEncoder.js';
import type { RenderTarget, Color } from '../core/render/RenderTarget.js';
import type { RenderPipeline } from '../core/pipeline/RenderPipeline.js';
import type { BindGroup } from '../core/binding/BindGroup.js';
import type { PipelineLayout } from '../core/binding/PipelineLayout.js';
import { Material, defineMaterial, type MaterialDesc } from './Material.js';
import { Geometry, type GeometryDesc } from './Geometry.js';
import { GfxTexture, type TextureDesc } from './Texture.js';
import { UniformArenaPool } from './UniformArena.js';
import type { UniformValues } from './Uniforms.js';
import type { PerspectiveCamera, OrthographicCamera } from './Camera.js';

/** 便捷层支持的相机类型。 */
export type Camera = PerspectiveCamera | OrthographicCamera;

export interface RendererOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** `'auto'`（默认）优先 WebGPU，失败回退 WebGL2。 */
  backend?: BackendKind | 'auto';
  /** 抗锯齿。WebGL2 会传给 context 的 `antialias`；WebGPU 用于 canvas 的 MSAA。 */
  antialias?: boolean;
  alpha?: boolean;
  /** 是否创建深度缓冲。默认 `true`。 */
  depth?: boolean;
  /**
   * canvas 的 MSAA 采样数（1 或 4）。
   *
   * WebGPU：会用这个采样数 `configure()` canvas，并在画布渲染通道里做 MSAA resolve；
   * WebGL2：canvas 的采样数由创建 context 时的 `antialias` 决定、离屏目标不支持 MSAA，
   * 所以这里传 `> 1` 会直接抛 `ValidationError`（不会静默忽略）。
   */
  sampleCount?: number;
  pixelRatio?: number;
  powerPreference?: 'low-power' | 'high-performance';
  /** 每帧的默认清屏色。 */
  clearColor?: ColorInput;
  camera?: Camera;
  logger?: Logger;
  /** WebGL2 的 context 属性覆盖项（覆盖上面几个选项推导出来的默认值）。 */
  contextAttributes?: WebGLContextAttributes;
}

/** 便捷层接受的颜色写法（就是 core 的 `Color`，这里给个更友好的别名）。 */
export type ColorInput = Color;

export interface FrameOptions {
  /** 清屏色；覆盖 renderer 的默认值。 */
  color?: ColorInput;
  /** 清屏深度；默认 1。 */
  depth?: number;
  /** 画到离屏目标；省略时画到 canvas。 */
  target?: RenderTarget;
  /** 保留目标原内容（不清屏）。 */
  load?: boolean;
}

/** `draw()` 的选项。 */
export interface DrawOptions {
  /** 覆盖当前材质。 */
  material?: Material;
  /** 模型矩阵；会写进 uniform 的 `model` 字段。 */
  model?: Mat4;
  /** 按字段名覆盖 uniform（写进本次 draw 独占的那一段 arena）。 */
  uniforms?: Record<string, number | ArrayLike<number>>;
  /** 纹理覆盖（键是材质里声明的纹理名）。 */
  textures?: Record<string, GfxTexture>;
  /** 绘制数量覆盖。 */
  count?: number;
  first?: number;
  /** 实例数（配合 `perInstance` 属性）。 */
  instances?: number;
}

export interface RendererStats {
  drawCalls: number;
  triangles: number;
  instances: number;
  /**
   * 本帧真正发生的**管线切换**次数：相邻两次 draw 用了不同管线才计数。
   *
   * 注意它不是「setPipeline 调用次数」—— 同一个材质连续画 N 个物体共用一条管线，
   * 切换次数应该是 1（这正是「批量绘制用一条管线」的价值所在，也是这行统计的意义）。
   */
  pipelineSwitches: number;
  /** 上一帧的 CPU 提交耗时（毫秒）。 */
  frameTime: number;
}

/**
 * 共享的单位矩阵：`draw()` 没给 `options.model` 时写它。
 *
 * 它只会被 `UniformValues.set()` 拷进 uniform buffer，从不暴露给调用方，所以整个进程共用
 * 一份是安全的 —— 而每 draw `mat4.create()` 会白白产生 40k 个 Float32Array(16)/帧。
 */
const IDENTITY_MAT4 = mat4.create();

interface MaterialState {
  readonly material: Material;
  readonly layout: PipelineLayout | 'auto';
  pipeline: RenderPipeline | null;
  /** 该材质的数值容器模板：每次 draw 写进 arena。 */
  values: UniformValues | null;
}

export class Renderer {
  readonly backend: BackendKind;
  readonly device: Device;
  readonly context: CanvasContext;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly logger: Logger;

  camera: Camera | null;

  private readonly arenaPool: UniformArenaPool;
  private readonly materials = new Map<Material, MaterialState>();
  private readonly geometries = new Set<Geometry>();
  private readonly textures = new Set<GfxTexture>();
  private readonly bindGroups = new Map<string, BindGroup>();
  private readonly statsValue: RendererStats = {
    drawCalls: 0,
    triangles: 0,
    instances: 0,
    pipelineSwitches: 0,
    frameTime: 0,
  };

  private _clearColor: Color;
  private _pixelRatio: number;
  private _width: number;
  private _height: number;
  private _inFrame = false;
  private encoder: CommandEncoder | null = null;
  private pass: RenderPassEncoder | null = null;
  private commandBuffers: CommandBuffer[] = [];
  private currentMaterial: Material | null = null;
  /** 上一次 draw 用的管线，用来统计真正的「管线切换」次数（每个通道开头清空）。 */
  private currentPipeline: RenderPipeline | null = null;
  private defaultTexture: GfxTexture | null = null;
  private frameStart = 0;
  /** 计算法线矩阵时复用的暂存区，避免每帧分配。 */
  private readonly normalMatrixScratch = mat3.create();
  private _disposed = false;

  private constructor(init: {
    backend: BackendKind;
    device: Device;
    context: CanvasContext;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    logger: Logger;
    options: RendererOptions;
  }) {
    this.backend = init.backend;
    this.device = init.device;
    this.context = init.context;
    this.canvas = init.canvas;
    this.logger = init.logger;
    this.camera = init.options.camera ?? null;
    this._clearColor = init.options.clearColor ?? '#0b0e13';
    this._pixelRatio = init.options.pixelRatio ?? init.context.pixelRatio;
    this._width = init.context.width;
    this._height = init.context.height;
    this.arenaPool = new UniformArenaPool(init.device);
  }

  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(options: RendererOptions): Promise<Renderer> {
    const logger = options.logger ?? createLogger('gpu-device-api/gfx');
    // `contextAttributes` 是逃生口：用户给了就以用户为准（逐字段覆盖），否则用上面几个选项推导。
    const contextAttributes: WebGLContextAttributes = {
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      depth: options.depth ?? true,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: options.powerPreference ?? 'high-performance',
      ...options.contextAttributes,
    };
    /** 本次渲染器是否需要深度附件（用户显式关掉时才是 false）。 */
    const wantDepth = contextAttributes.depth !== false;

    const created = await createDeviceWithAdapter({
      canvas: options.canvas,
      backend: options.backend ?? 'auto',
      label: 'gfx-renderer',
      contextAttributes,
    });

    if (!created.context) {
      throw new ValidationError('[gpu-device-api] 创建 Renderer 必须提供 canvas。');
    }

    /*
     * 深度与 MSAA 要在 canvas context 上说清楚，否则会出现「声明了却没生效」：
     * - WebGPU 的 canvas 纹理没有深度附件，不显式要就永远没有深度测试；MSAA 也只有在
     *   configure 时声明才会走多重采样 + resolve；
     * - WebGL2 的深度缓冲与采样数都由创建 context 时的属性决定，`configure()` 里只能如实核对
     *   （要不到就抛错，见 WebGL2CanvasContext.configure）。
     * 只在与默认值不同时才重新 configure 一次，避免无谓地丢弃当前帧。
     */
    /*
     * MSAA：WebGL2 由 context 的 `antialias` 决定，WebGPU 只能靠 `configure()` 声明，
     * 而 `device.defaultSampleCount` 默认是 1 —— 所以这里必须把 `antialias` 也映射过去，
     * 否则 `Renderer.create({ canvas })` 会在 WebGL2 上有 MSAA、在 WebGPU 上没有（静默差异）。
     */
    const canvasSampleCount =
      options.sampleCount ?? (created.backend === 'webgpu' && (options.antialias ?? true) ? 4 : undefined);
    if (canvasSampleCount !== undefined || !wantDepth) {
      created.device.createCanvasContext(options.canvas, {
        ...(canvasSampleCount !== undefined ? { sampleCount: canvasSampleCount } : {}),
        ...(wantDepth ? {} : { depth: false }),
      });
    }

    const renderer = new Renderer({
      backend: created.backend,
      device: created.device,
      context: created.context,
      canvas: options.canvas,
      logger,
      options,
    });

    // 设一次像素比，让 canvas 后备缓冲与显示尺寸匹配。
    if (options.pixelRatio) renderer.setPixelRatio(options.pixelRatio);
    renderer.resize();
    return renderer;
  }

  /* ------------------------------------------------------------------ 尺寸 ------------------- */

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get pixelRatio(): number {
    return this._pixelRatio;
  }

  /** 宽高比（相机常用）。 */
  get aspect(): number {
    return this._height === 0 ? 1 : this._width / this._height;
  }

  get clearColor(): Color {
    return this._clearColor;
  }

  setClearColor(color: Color): void {
    this._clearColor = color;
  }

  setPixelRatio(ratio: number): void {
    this._pixelRatio = ratio;
    this.context.setPixelRatio(ratio);
    this.context.resize();
    this.syncSize();
  }

  /** 按 CSS 尺寸重新设置后备缓冲大小。 */
  setSize(width: number, height: number, updateStyle = true): void {
    this.context.setSize(width, height, updateStyle);
    this.syncSize();
  }

  /** 重新读取 canvas 尺寸；返回是否发生变化。 */
  resize(): boolean {
    const changed = this.context.resize();
    this.syncSize();
    return changed;
  }

  private syncSize(): void {
    this._width = this.context.width;
    this._height = this.context.height;
  }

  /* ------------------------------------------------------------------ 相机 ------------------- */

  setCamera(camera: Camera | null): void {
    this.camera = camera;
    // 立刻按当前宽高比/后端约定刷新一次，免得第一次 draw 用到的是别处留下的矩阵。
    this.updateCamera();
  }

  /* ------------------------------------------------------------------ 资源 ------------------- */

  createGeometry(desc: GeometryDesc): Geometry {
    const geometry = Geometry.create(this.device, desc);
    this.geometries.add(geometry);
    return geometry;
  }

  /** 创建（或直接登记）一个材质。 */
  createMaterial(material: Material | MaterialDesc): Material {
    const resolved = material instanceof Material ? material : defineMaterial(material);
    if (!this.materials.has(resolved)) {
      this.materials.set(resolved, {
        material: resolved,
        layout: resolved.createPipelineLayout(this.device),
        pipeline: null,
        values: resolved.uniforms ? resolved.createUniforms() : null,
      });
    }
    return resolved;
  }

  createTexture(desc: TextureDesc): GfxTexture {
    const texture = GfxTexture.create(this.device, desc);
    this.textures.add(texture);
    return texture;
  }

  /** 当前设置的材质（`draw()` 未显式指定时使用）。 */
  setMaterial(material: Material | null): void {
    this.currentMaterial = material;
    if (material) this.createMaterial(material);
  }

  get material(): Material | null {
    return this.currentMaterial;
  }

  get stats(): RendererStats {
    return this.statsValue;
  }

  /* ------------------------------------------------------------------ 帧 --------------------- */

  beginFrame(options: FrameOptions = {}): void {
    if (this._inFrame) this.endFrame();
    this.frameStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

    this.resize();
    this.arenaPool.beginFrame();
    // 相机矩阵每帧只算一次（宽高比/深度约定都依赖帧状态，所以放在这里最合适）。
    this.updateCamera();

    this.encoder = this.device.createCommandEncoder({ label: 'gfx-frame' });
    const clearColor = options.color ?? this._clearColor;
    const descriptor = this.createPassDescriptor(options, clearColor);

    if (!descriptor.colorAttachments[0]?.view) {
      throw new ValidationError('[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。');
    }

    /*
     * 直接使用后端给的 attachment 列表（而不是只取 `view` 再自己拼）：
     * canvas 路径的 MSAA resolveTarget 与两个后端的 depth attachment 都在里面，
     * 自己拼会把它们丢掉 —— 那正是「画布渲染没有深度测试」这个缺陷的成因。
     */
    this.pass = this.encoder.beginRenderPass({
      label: 'gfx-pass',
      colorAttachments: descriptor.colorAttachments,
      ...(descriptor.depthStencilAttachment ? { depthStencilAttachment: descriptor.depthStencilAttachment } : {}),
    });

    this.commandBuffers = [];
    this.statsValue.drawCalls = 0;
    this.statsValue.triangles = 0;
    this.statsValue.instances = 0;
    this.statsValue.pipelineSwitches = 0;
    this.currentPipeline = null;
    this._inFrame = true;
  }

  endFrame(): void {
    if (!this._inFrame) return;
    this.pass?.end();
    if (this.encoder) this.commandBuffers.push(this.encoder.finish());
    if (this.commandBuffers.length > 0) this.device.queue.submit(this.commandBuffers);

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.statsValue.frameTime = now - this.frameStart;

    this.pass = null;
    this.encoder = null;
    this.commandBuffers = [];
    this._inFrame = false;
  }

  get inFrame(): boolean {
    return this._inFrame;
  }

  /* ------------------------------------------------------------------ 绘制 ------------------- */

  /**
   * 在上一帧的基础上再开一个通道（画到另一个目标、或做后处理）。
   * 必须在 `beginFrame()` 之后调用。
   */
  beginPass(options: FrameOptions = {}): void {
    if (!this._inFrame) {
      throw new ValidationError('[gpu-device-api] beginPass() 只能在 beginFrame() 之后调用。');
    }
    this.pass?.end();
    const encoder = this.encoder!;
    const descriptor = this.createPassDescriptor(options, options.color ?? this._clearColor);
    if (!descriptor.colorAttachments[0]?.view) {
      throw new ValidationError('[gpu-device-api] 当前通道没有颜色附件。');
    }

    this.pass = encoder.beginRenderPass({
      label: 'gfx-pass',
      colorAttachments: descriptor.colorAttachments,
      ...(descriptor.depthStencilAttachment ? { depthStencilAttachment: descriptor.depthStencilAttachment } : {}),
    });

    // 新通道开始时管线状态要重新绑定，所以第一个 draw 记作一次切换。
    this.currentPipeline = null;
  }

  /**
   * 「画到离屏 target」与「画到 canvas」走同一段代码，只是附件来源不同。
   *
   * 两条路径都返回同一形状的 {@link RenderPassDescriptor}（colorAttachments + depthStencilAttachment），
   * 所以深度附件不会被某一条路径漏掉 —— 之前的缺陷正是「画布路径自己拼 color attachment、
   * 从不传 depth attachment」，于是后端的状态解析器如实关掉了 DEPTH_TEST。
   */
  private createPassDescriptor(options: FrameOptions, clearColor: Color): RenderPassDescriptor {
    const clear = {
      loadOp: options.load ? ('load' as const) : ('clear' as const),
      storeOp: 'store' as const,
      clearValue: clearColor,
      depthLoadOp: options.load ? ('load' as const) : ('clear' as const),
      depthClearValue: options.depth ?? 1,
    };
    return options.target ? options.target.createPassDescriptor(clear) : this.context.createPassDescriptor(clear);
  }

  /** 绘制一个几何体。 */
  draw(geometry: Geometry, options: DrawOptions = {}): void {
    if (!this._inFrame || !this.pass) {
      throw new ValidationError(
        '[gpu-device-api] draw() 必须在 beginFrame() ... endFrame() 之间调用。',
      );
    }
    const material = options.material ?? this.currentMaterial;
    if (!material) {
      throw new ValidationError(
        '[gpu-device-api] draw() 之前必须先 setMaterial()，或在 draw() 里传 material。',
      );
    }
    const state = this.materials.get(material) ?? (this.createMaterial(material), this.materials.get(material)!);

    geometry.validateAgainst(material.attributes, material.name);
    this.assertInstanceCount(geometry, options.instances);
    const pipeline = this.acquirePipeline(state);
    this.pass.setPipeline(pipeline);
    // 只有「和上一次 draw 用的不是同一条管线」才算一次切换。
    if (this.currentPipeline !== pipeline) {
      this.currentPipeline = pipeline;
      this.statsValue.pipelineSwitches += 1;
    }

    /* ---- group 0：uniform ------------------------------------------------------------------ */
    if (material.uniforms && state.values) {
      this.applyCameraUniforms(state.values, material);
      // model 只写一次：没给 options.model 时写共享的单位矩阵常量。
      // （以前是「先写一个新 new 出来的单位矩阵、再被 options.model 覆盖」，每 draw 多一次
      //  Float32Array(16) 分配 + 一次 64 字节上传。）
      if (material.uniforms.has('model')) {
        state.values.set('model' as never, (options.model ?? IDENTITY_MAT4) as never);
      }
      this.updateNormalMatrix(state.values, material);
      if (options.uniforms) {
        for (const [name, value] of Object.entries(options.uniforms)) {
          this.setIfPresent(state.values, name, value);
        }
      }
      const layout = material.createUniformBindGroupLayout(this.device);
      if (layout) {
        const arena = this.arenaPool.acquire(material.uniforms);
        const dynamicOffset = arena.write(state.values);
        this.pass.setBindGroup(material.uniforms.group, arena.bindGroup(layout), [dynamicOffset]);
      }
    }

    /* ---- group 1：纹理 -------------------------------------------------------------------- */
    if (material.textures.length > 0) {
      const group = this.acquireTextureBindGroup(material, options.textures ?? {});
      if (group) this.pass.setBindGroup(material.textureGroup, group);
    }

    /* ---- 顶点与索引 ------------------------------------------------------------------------ */
    for (const attribute of material.attributes) {
      const provided = geometry.attributes.get(attribute.name)!;
      this.pass.setVertexBuffer(attribute.location, provided.buffer, 0, provided.buffer.size);
    }
    if (geometry.indexBuffer && geometry.indexFormat) {
      this.pass.setIndexBuffer(geometry.indexBuffer, geometry.indexFormat, 0, geometry.indexBuffer.size);
      this.pass.drawIndexed({
        indexCount: options.count ?? geometry.indexCount,
        ...(options.first !== undefined ? { firstIndex: options.first } : {}),
        ...(options.instances !== undefined ? { instanceCount: options.instances } : {}),
      });
    } else {
      this.pass.draw({
        vertexCount: options.count ?? geometry.vertexCount,
        ...(options.first !== undefined ? { firstVertex: options.first } : {}),
        ...(options.instances !== undefined ? { instanceCount: options.instances } : {}),
      });
    }

    this.statsValue.drawCalls += 1;
    this.statsValue.instances += options.instances ?? 1;
    this.statsValue.triangles += triangleCount(geometry, options) * (options.instances ?? 1);
  }

  /** 一次画多个实例（需要材质配合 `perInstance` 属性）。 */
  drawInstanced(geometry: Geometry, instances: number, options: DrawOptions = {}): void {
    this.draw(geometry, { ...options, instances });
  }

  /**
   * 实例数与几何体提供的实例数据是否匹配。
   *
   * 实例属性的元素个数就是「最多能画多少个实例」：要多了，WebGL2 会静默地读到缓冲区之外的数据
   *（画面出错但不报错），WebGPU 会在 draw 时报校验错误 —— 两种都不好定位，所以这里提前拦下。
   */
  private assertInstanceCount(geometry: Geometry, instances: number | undefined): void {
    if (instances === undefined) return;
    if (!Number.isInteger(instances) || instances < 1) {
      throw new ValidationError(
        `[gpu-device-api] draw() 的 instances 必须是正整数，实际是 ${String(instances)}。`,
      );
    }
    const available = geometry.instanceCount;
    if (available !== null && instances > available) {
      throw new ValidationError(
        `[gpu-device-api] 几何体「${geometry.label}」只提供了 ${available} 份实例数据，` +
          `但要画 ${instances} 个实例。请把实例属性（perInstance: true）的数据补足到 ${instances} 份。`,
      );
    }
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    if (this._inFrame) this.endFrame();
    for (const state of this.materials.values()) {
      state.pipeline?.dispose();
      state.values = null;
    }
    this.materials.clear();
    for (const group of this.bindGroups.values()) group.dispose();
    this.bindGroups.clear();
    for (const geometry of this.geometries) geometry.destroy();
    this.geometries.clear();
    for (const texture of this.textures) texture.destroy();
    this.textures.clear();
    this.defaultTexture?.destroy();
    this.defaultTexture = null;
    this.arenaPool.destroy();
    this.context.dispose();
    this.device.dispose();
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /* ------------------------------------------------------------------ 内部 ------------------- */

  private acquirePipeline(state: MaterialState): RenderPipeline {
    if (state.pipeline) return state.pipeline;
    const { descriptor } = state.material.createPipelineDescriptor(this.device);
    state.pipeline = this.device.createRenderPipeline(descriptor);
    return state.pipeline;
  }

  /**
   * 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。
   *
   * 这里**不再**调用 `camera.update()`：相机矩阵每帧只需要算一次（见 {@link updateCamera}）。
   * 原先每 draw 都重算 lookAt + 两套 perspective + 一次乘法，40k draw 的场景下光这一步就是
   * 几十毫秒/帧的纯 CPU 开销，而且结果完全一样。
   */
  private applyCameraUniforms(values: UniformValues, material: Material): void {
    const camera = this.camera;
    if (!camera) return;

    if (material.uniforms?.has('projectionView')) {
      values.set('projectionView' as never, camera.projectionViewMatrix as never);
    }
    if (material.uniforms?.has('projection')) {
      values.set('projection' as never, camera.projectionMatrix as never);
    }
    if (material.uniforms?.has('view')) {
      values.set('view' as never, camera.viewMatrix as never);
    }
    if (material.uniforms?.has('cameraPosition')) {
      values.set('cameraPosition' as never, camera.position as never);
    }
  }

  /**
   * 按当前画布宽高比与后端深度约定刷新相机矩阵。
   *
   * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
   * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
   */
  updateCamera(): void {
    const camera = this.camera;
    if (!camera) return;
    camera.aspect = this.aspect;
    // 两个后端的裁剪空间 z 约定不同，切换后端时投影矩阵要跟着换（相机自己不知道后端）。
    camera.depthRange = this.backend === 'webgpu' ? 'zo' : 'gl';
    camera.update();
  }

  /**
   * 由当前 `model` 计算法线矩阵。
   *
   * 非等比缩放会破坏法线方向（法线不再垂直于表面），必须用「模型矩阵左上 3x3 的逆转置」。
   * 这里自动算好，材质只要声明了 `normalMatrix` 字段就能直接用。
   */
  private updateNormalMatrix(values: UniformValues, material: Material): void {
    if (!material.uniforms?.has('normalMatrix') || !material.uniforms.has('model')) return;
    const model = values.get('model') as Float32Array;
    const normalMatrix = mat3.normalFromMat4(this.normalMatrixScratch, model);
    if (!normalMatrix) {
      // 模型矩阵退化（某轴缩放为 0）时退回单位矩阵，避免把 NaN 送进着色器。
      mat3.identity(this.normalMatrixScratch);
    }
    values.set('normalMatrix' as never, this.normalMatrixScratch as never);
  }

  private setIfPresent(values: UniformValues, name: string, value: number | ArrayLike<number>): void {
    if (!values.has(name)) return;
    values.set(name as never, value as never);
  }

  /**
   * 取得（必要时创建）纹理的 bind group。
   *
   * 缓存键由「材质 + 每个槽位实际用的纹理 id」组成：同一个材质换纹理时才会重建，
   * 反复用同一组纹理绘制不会重复创建。没给纹理的槽位绑一张 1×1 的白色占位纹理，
   * 这样「忘了传纹理」的表现是白色而不是未定义数据。
   */
  private acquireTextureBindGroup(material: Material, overrides: Record<string, GfxTexture>): BindGroup | null {
    const layout = material.createTextureGroupLayout(this.device);
    if (!layout) return null;

    const resolved = material.textures.map((slot) => overrides[slot.name] ?? this.getDefaultTexture());
    const key = `${material.name}|${resolved.map((texture) => texture.id).join(',')}`;
    const cached = this.bindGroups.get(key);
    if (cached) return cached;

    const entries = material.textures.flatMap((slot, index) => {
      const texture = resolved[index]!;
      return [
        { binding: slot.binding, resource: { view: texture.view } },
        { binding: slot.samplerBinding, resource: { sampler: texture.sampler } },
      ];
    });

    const group = this.device.createBindGroup({
      label: `${material.name}:textures`,
      layout,
      entries,
    });
    this.bindGroups.set(key, group);
    return group;
  }

  /** 缺省纹理（材质声明了纹理但调用方没给时用，避免绑到未定义数据）。 */
  getDefaultTexture(): GfxTexture {
    if (!this.defaultTexture) {
      this.defaultTexture = GfxTexture.create(this.device, {
        label: 'default-white',
        data: new Uint8Array([255, 255, 255, 255]),
        width: 1,
        height: 1,
        mipmaps: false,
      });
    }
    return this.defaultTexture;
  }
}

/** 按几何体拓扑与绘制范围估算三角形数（用于性能面板）。 */
function triangleCount(geometry: Geometry, options: DrawOptions): number {
  const count = options.count ?? geometry.drawCount;
  switch (geometry.topology) {
    case 'triangle-list':
      return Math.floor(count / 3);
    case 'triangle-strip':
      return Math.max(0, count - 2);
    case 'line-list':
      return 0;
    case 'line-strip':
      return 0;
    case 'point-list':
      return 0;
    default:
      return 0;
  }
}
