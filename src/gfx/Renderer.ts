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
import type { CanvasContext, FrameTarget } from '../core/CanvasContext.js';
import type { Device } from '../core/Device.js';
import type { CommandEncoder, CommandBuffer } from '../core/render/CommandEncoder.js';
import type { RenderPassEncoder } from '../core/render/RenderPassEncoder.js';
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
  sampleCount?: number;
  pixelRatio?: number;
  powerPreference?: 'low-power' | 'high-performance';
  /** 每帧的默认清屏色。 */
  clearColor?: ColorInput;
  camera?: Camera;
  logger?: Logger;
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
  pipelineSwitches: number;
  /** 上一帧的 CPU 提交耗时（毫秒）。 */
  frameTime: number;
}

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
    const created = await createDeviceWithAdapter({
      canvas: options.canvas,
      backend: options.backend ?? 'auto',
      label: 'gfx-renderer',
      contextAttributes: {
        antialias: options.antialias ?? true,
        alpha: options.alpha ?? false,
        depth: options.depth ?? true,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: options.powerPreference ?? 'high-performance',
      },
    });

    if (!created.context) {
      throw new ValidationError('[gpu-device-api] 创建 Renderer 必须提供 canvas。');
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

    this.encoder = this.device.createCommandEncoder({ label: 'gfx-frame' });
    const clearColor = options.color ?? this._clearColor;

    let colorView;
    let depthStencilAttachment = null;
    if (options.target) {
      const descriptor = options.target.createPassDescriptor({
        loadOp: options.load ? 'load' : 'clear',
        storeOp: 'store',
        clearValue: clearColor,
        depthLoadOp: options.load ? 'load' : 'clear',
        depthClearValue: options.depth ?? 1,
      });
      colorView = descriptor.colorAttachments[0]?.view;
      depthStencilAttachment = descriptor.depthStencilAttachment;
    } else {
      const frame: FrameTarget = this.context.getCurrentFrameTarget();
      colorView = frame.view;
    }

    if (!colorView) {
      throw new ValidationError('[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。');
    }

    this.pass = this.encoder.beginRenderPass({
      label: 'gfx-pass',
      colorAttachments: [
        {
          view: colorView,
          loadOp: options.load ? 'load' : 'clear',
          storeOp: 'store',
          clearValue: clearColor,
        },
      ],
      ...(depthStencilAttachment ? { depthStencilAttachment } : {}),
    });

    this.commandBuffers = [];
    this.statsValue.drawCalls = 0;
    this.statsValue.triangles = 0;
    this.statsValue.instances = 0;
    this.statsValue.pipelineSwitches = 0;
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

    let colorView;
    let depthStencilAttachment = null;
    if (options.target) {
      const descriptor = options.target.createPassDescriptor({
        loadOp: options.load ? 'load' : 'clear',
        storeOp: 'store',
        clearValue: options.color ?? this._clearColor,
        depthLoadOp: options.load ? 'load' : 'clear',
        depthClearValue: options.depth ?? 1,
      });
      colorView = descriptor.colorAttachments[0]?.view;
      depthStencilAttachment = descriptor.depthStencilAttachment;
    } else {
      colorView = this.context.getCurrentFrameTarget().view;
    }
    if (!colorView) {
      throw new ValidationError('[gpu-device-api] 当前通道没有颜色附件。');
    }

    this.pass = encoder.beginRenderPass({
      label: 'gfx-pass',
      colorAttachments: [
        {
          view: colorView,
          loadOp: options.load ? 'load' : 'clear',
          storeOp: 'store',
          clearValue: options.color ?? this._clearColor,
        },
      ],
      ...(depthStencilAttachment ? { depthStencilAttachment } : {}),
    });
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
    const pipeline = this.acquirePipeline(state);
    this.pass.setPipeline(pipeline);
    this.statsValue.pipelineSwitches += 1;

    /* ---- group 0：uniform ------------------------------------------------------------------ */
    if (material.uniforms && state.values) {
      this.applyCameraUniforms(state.values, material);
      if (options.model) {
        this.setIfPresent(state.values, 'model', options.model);
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

  /** 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。 */
  private applyCameraUniforms(values: UniformValues, material: Material): void {
    const camera = this.camera;
    if (!camera) return;
    camera.aspect = this.aspect;
    camera.depthRange = this.backend === 'webgpu' ? 'zo' : 'gl';
    camera.update();

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
    if (material.uniforms?.has('model')) {
      // 默认单位矩阵；调用方用 `options.model` 覆盖。
      values.set('model' as never, mat4.create() as never);
    }
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
