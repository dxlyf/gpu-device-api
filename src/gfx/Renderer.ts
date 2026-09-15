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
 * 5. **相机 uniform** —— `projectionView` 按后端自动选用 GL 或 ZO 的深度约定；
 * 6. **管线预热** —— `prewarm()` 把一批材质的编译/链接挪出渲染循环，两个后端同一段代码
 *    （见 {@link Renderer.prewarm} 与 {@link Renderer.compilationInfo}）。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { createDeviceWithAdapter } from '../factories/createDevice.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { mat3, mat4, vec3, type Mat4, type Vec3 } from '../utils/math/index.js';
import {
  createCompilationInfo,
  createCompilationMessage,
  nowMs,
  type CompilationInfo,
  type PrewarmMode,
  type PrewarmOptions,
} from '../core/pipeline/CompilationInfo.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasContext } from '../core/CanvasContext.js';
import type { Device } from '../core/Device.js';
import type { TextureFormat } from '../core/enums/TextureFormat.js';
import type { CommandEncoder, CommandBuffer } from '../core/render/CommandEncoder.js';
import type { PassTimestampWrites } from '../core/resources/QuerySet.js';
import type { RenderPassDescriptor, RenderPassEncoder } from '../core/render/RenderPassEncoder.js';
import type { RenderTarget, Color } from '../core/render/RenderTarget.js';
import type { TextureView } from '../core/resources/TextureView.js';
import type { RenderPipeline, RenderPipelineDescriptor, RenderPipelineVariant } from '../core/pipeline/RenderPipeline.js';
import type { BindGroup } from '../core/binding/BindGroup.js';
import type { PipelineLayout } from '../core/binding/PipelineLayout.js';
import { prewarmWebGL2RenderPipeline } from '../webgl2/pipeline/Prewarm.js';
import { prewarmWebGPURenderPipeline } from '../webgpu/pipeline/Prewarm.js';
import { Material, defineMaterial, type MaterialDesc } from './Material.js';
import { Geometry, type GeometryDesc } from './Geometry.js';
import { GfxTexture, type TextureDesc } from './Texture.js';
import { UniformArenaPool } from './UniformArena.js';
import { FrustumCuller } from './Culling.js';
import { sortDraws, type DrawSortMode } from './DrawSort.js';
import {
  GPU_TIMING_FEATURE,
  GpuTiming,
  describeGpuTimingFailure,
  type GpuTimingOptions,
  type GpuTimingStats,
} from './GpuTiming.js';
import type { UniformValues } from './Uniforms.js';
import { unwrapUniforms } from './Uniforms.js';
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
  /**
   * 创建设备时额外申请的 feature（例如 `'timestamp-query'`）。
   *
   * WebGPU 必须在 `requestDevice` 时就申请，事后无法补；WebGL2 会把这些名字当成
   * 「必须可用的扩展」校验，缺一个就抛错。
   */
  requiredFeatures?: readonly string[];
  /**
   * 打开 GPU 计时：会自动申请 `timestamp-query`，并在创建后尝试 `enableGpuTiming()`。
   *
   * 后端不支持时 **不会** 让 `Renderer.create()` 失败：`renderer.gpuTiming.enabled` 为 false、
   * `renderer.gpuTiming.error` 里给出原因（想「要不到就报错」请自己调用 `enableGpuTiming()`）。
   * 默认关闭 —— GPU 计时需要额外 feature、要做读回、本身有开销。
   */
  gpuTiming?: boolean | GpuTimingOptions;
  /** WebGL2 的 context 属性覆盖项（覆盖上面几个选项推导出来的默认值）。 */
  contextAttributes?: WebGLContextAttributes;
  /**
   * 视锥剔除（默认 **开**）：从相机的 view-projection 矩阵抽 6 个平面，绘制物整体在视锥外就跳过。
   *
   * 判定基于几何体的**包围球**（{@link Geometry.boundingSphere}，创建时算一次），是保守的
   * ——被剔除的一定不可见，不会画漏。两种东西会自动跳过剔除并计入 `stats.cullSkipped`：
   * 没有包围球的几何体、以及带按实例步进属性又没有显式给包围球的几何体
   *（实例位置由实例属性决定，基础顶点的球盖不住它们）。
   *
   * 顶点着色器自己位移顶点的场景（水面波动之类）请显式给
   * `GeometryDesc.boundingSphere`，或者干脆关掉剔除。
   */
  culling?: boolean;
  /**
   * draw 排序模式，默认 `'none'`（不排序）。
   *
   * 排序要把一帧的 draw 先排队、到 `endFrame()` 再按序提交，所以开启后
   * `renderer.stats.drawCalls` 之类要等 `endFrame()` 才完整；`'opaque'` 只对不透明物的
   * 连续段排序，半透明物的位置绝不会被挪动；`'all'` 会把不透明物整体提前、半透明物按深度
   * 从远到近排在后面（详见 `DrawSort`）。**默认关闭**：它会改变「半透明与不透明交错提交」
   * 时的绘制顺序，那是个需要调用方自己确认的语义变化。
   */
  sort?: DrawSortMode;
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
  /**
   * 上一帧的 **CPU 提交耗时**（毫秒）：`beginFrame → 逐 draw → endFrame` 里 CPU 花掉的时间，
   * 不含 GPU 执行时间。
   *
   * 它与 {@link RendererStats.gpuFrameTime} 是**两个不同的量**，不要混用：瓶颈在录制命令时
   * `frameTime` 大而 `gpuFrameTime` 小，瓶颈在 GPU 时反过来。
   */
  frameTime: number;
  /**
   * 上一帧的 **GPU 执行时间**（毫秒）；拿不到时为 `null`（不是 0）。
   *
   * 默认是 `null`：需要 `Renderer.enableGpuTiming()`（或 `Renderer.create({ gpuTiming: true })`）
   * 打开，而且后端要支持（WebGPU 的 `timestamp-query`、WebGL2 的时间查询扩展）。
   * 数值来自延迟若干帧的异步读回，所以它对应的是「最近一次拿到样本的那一帧」，见 `GpuTiming`。
   */
  gpuFrameTime: number | null;
  /**
   * 本帧被**视锥剔除**跳过的绘制数（没进命令缓冲）。
   *
   * 它与 {@link RendererStats.drawCalls} 的关系：`drawCalls + culled` 就是本帧调用
   * `draw()` 的次数（去掉没做剔除的那些，见 {@link RendererStats.cullSkipped}）。
   * 关掉剔除（`culling: false`）时恒为 0。
   */
  culled: number;
  /** 本帧真正做过视锥测试的绘制数（= `drawCalls + culled`）。 */
  cullTested: number;
  /** 本帧因为「几何体不适合剔除」而跳过测试的绘制数（没有包围球、或实例化几何体）。 */
  cullSkipped: number;
  /** 本帧进入待排序队列的绘制数；`sort` 为 `'none'` 时恒为 0。 */
  sorted: number;
}

/**
 * 一条材质的预热结果。
 *
 * 字段与 core 的 `PrewarmResult` 对齐（`ok` / `mode` / `reason` / `durationMs` / `info`），
 * 另外带上材质本体、解析出来的管线，以及「这次是不是被跳过了」。
 */
export interface MaterialPrewarmResult {
  readonly material: Material;
  /** 管线 label（材质描述里生成的是 `<材质名>:pipeline`），方便在日志里对上号。 */
  readonly label: string;
  /** 这条材质的管线现在能不能用（`true` 表示编译/链接没有报错、也没有超时）。 */
  readonly ok: boolean;
  /**
   * `true` 表示这条材质的管线**早就建好了**，这次没有重复预热，直接复用了它。
   * 这时 {@link MaterialPrewarmResult.mode} 恒为 `null` —— 没有发生任何编译/链接。
   */
  readonly skipped: boolean;
  /**
   * 这次预热是**等出来**的还是**同步做掉**的；被跳过时为 `null`（没有发生编译）。
   *
   * `'sync'` 不是失败：它表示「编译确实做了，但占着调用线程做的」，具体缺什么在 `reason` 里。
   */
  readonly mode: PrewarmMode | null;
  /**
   * 为什么不是真异步、或者为什么没成功。
   *
   * 真异步且成功时为 `null`；同步降级（WebGL2 缺 `KHR_parallel_shader_compile`、
   * WebGPU 缺 `createRenderPipelineAsync`）与编译失败时都会给出具体原因；
   * 被跳过时说明「已建过管线，没有重复预热」。
   */
  readonly reason: string | null;
  /** 这条材质花掉的时间（毫秒），包含等待。 */
  readonly durationMs: number;
  /** 这条材质的编译诊断（真实行号在这里）。 */
  readonly info: CompilationInfo;
  /** 可直接用于绘制的管线；预热失败时为 `null`（被跳过时是那条已经存在的管线）。 */
  readonly pipeline: RenderPipeline | null;
  /** 这次用的管线变体（与真正绘制时解析出的那一份逐字段一致）；被跳过时为 `null`。 */
  readonly variant: RenderPipelineVariant | null;
}

/** `renderer.prewarm()` 的选项。 */
export interface RendererPrewarmOptions {
  /**
   * 要预热的材质；省略时预热这个渲染器**已经登记过的全部材质**
   *（`createMaterial()` / `setMaterial()` / 任何一次带该材质的 `draw()` 都会登记）。
   *
   * 清单里没登记过的材质会被自动登记（与 `draw()` 的行为一致）。
   */
  materials?: readonly Material[];
  /**
   * 这次预热针对哪个渲染目标：省略表示 **canvas**（与 `beginFrame()` 的默认路径一致）。
   *
   * 它决定管线变体里的 `colorFormats` / `sampleCount` / `depthFormat`（见
   * {@link Renderer.prewarm}）。之后要画进离屏目标就传那个 `RenderTarget`，
   * 否则预热到的是另一个变体 —— 预热会白做（不会出错，只是首次绘制仍然要付编译开销）。
   */
  target?: RenderTarget;
  /** 等待编译/链接完成的最长时间（毫秒）。省略用后端的默认值（30 秒）。 */
  timeoutMs?: number;
  /**
   * 出现 `error` 级诊断时是否抛 `ValidationError`。**默认 `false`**：
   * 预热是「尽量提前把活干掉」的路径，不该让渲染挂掉 —— 失败信息会放进每条结果的
   * `reason` / `info` 里返回，由调用方决定怎么办。
   */
  throwOnError?: boolean;
}

/** `renderer.prewarm()` 的汇总结果（同时给出每条材质的明细）。 */
export interface RendererPrewarmResult {
  readonly backend: BackendKind;
  /**
   * 这次实际预热用的管线变体；**没有任何材质被真正预热**（清单为空、或全部已跳过）时为 `null`。
   *
   * `colorFormats` / `sampleCount` / `depthFormat` 对所有材质是同一份（同一个通道）；
   * `vertexLayouts` 是第一条被预热的材质自己的（每条管线的顶点槽位可以不同），
   * 每条材质的完整变体在 `results[i].variant` 里。
   */
  readonly variant: RenderPipelineVariant | null;
  /**
   * 这次预热整体的等待方式：
   * `'async'` = 每条被预热的材质都是真异步等出来的；`'sync'` = 至少有一条是同步降级做的
   *（`reason` 给出第一个降级原因）；没有材质被预热时为 `null`。
   */
  readonly mode: PrewarmMode | null;
  /**
   * 汇总层面的补充说明：**失败时**是第一个失败原因；没有失败但发生了同步降级时，
   * 是第一个降级原因（例如 WebGL2 缺 `KHR_parallel_shader_compile`）；
   * 真异步且全部成功、以及没有材质被真正预热时为 `null`。逐条的原因在 `results[i].reason` 里。
   */
  readonly reason: string | null;
  /** 所有被预热的材质都成功（`ok`）才是 `true`；空清单与被跳过的材质不影响它。 */
  readonly ok: boolean;
  /** 本次真正做了预热的材质数。 */
  readonly prewarmed: number;
  /** 因为管线已经存在而跳过的材质数（没有重复预热）。 */
  readonly skipped: number;
  /** 预热失败的材质数（`ok` 为 false）。 */
  readonly failed: number;
  /** 整次调用花掉的时间（毫秒）。 */
  readonly durationMs: number;
  /** 每条材质的明细，顺序与 `materials` 一致。 */
  readonly results: readonly MaterialPrewarmResult[];
}

/**
 * 共享的单位矩阵：`draw()` 没给 `options.model` 时写它。
 *
 * 它只会被 `UniformValues.set()` 拷进 uniform buffer，从不暴露给调用方，所以整个进程共用
 * 一份是安全的 —— 而每 draw `mat4.create()` 会白白产生 40k 个 Float32Array(16)/帧。
 */
const IDENTITY_MAT4 = mat4.create();

/** 已有管线的材质被跳过时给调用方的说明（`prewarm()` 的结果里会带它）。 */
const SKIPPED_PREWARM_REASON =
  'the pipeline of this material was already built; prewarm skipped it so the compiled program is reused as-is';

interface MaterialState {
  readonly material: Material;
  readonly layout: PipelineLayout | 'auto';
  pipeline: RenderPipeline | null;
  /** 该材质的数值容器模板：每次 draw 写进 arena。 */
  values: UniformValues | null;
  /** 排序用的管线序号（同一材质恒定）。 */
  readonly pipelineId: number;
  /** 材质是否半透明（声明了混合）—— 决定它能不能被排序挪动。 */
  readonly transparent: boolean;
}

/** 排序模式下的待绘制记录（字段都在入队时算好，排序比较函数里不再做计算）。 */
interface PendingDraw {
  readonly geometry: Geometry;
  readonly material: Material;
  readonly state: MaterialState;
  readonly options: DrawOptions;
  readonly pipeline: number;
  readonly bindings: number;
  readonly depth: number;
  readonly transparent: boolean;
  readonly order: number;
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
    gpuFrameTime: null,
    culled: 0,
    cullTested: 0,
    cullSkipped: 0,
    sorted: 0,
  };

  /** GPU 计时；`enableGpuTiming()` 之前是 null（默认关闭：需要额外 feature、要读回、有开销）。 */
  private gpuTimingValue: GpuTiming | null = null;
  /** 打开 GPU 计时失败的原因；供 `gpuTiming.error` 与诊断使用。 */
  private gpuTimingError: string | null = null;

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
  /** 排序时算「包围球中心的世界坐标」用的暂存区。 */
  private readonly sortPointScratch: Vec3 = vec3.create();

  /** 视锥剔除器：`updateCamera()` 里按当帧矩阵刷新。 */
  private readonly culler = new FrustumCuller();
  private _culling: boolean;
  private _sortMode: DrawSortMode;
  /** 排序模式下本通道待提交的绘制。 */
  private readonly pending: PendingDraw[] = [];
  private nextPipelineId = 1;
  /**
   * 纹理 bind group → 排序序号。
   *
   * 用对象身份而不是拼字符串：排序键必须在每 draw 上是 O(1) 的，拼 `${name}|${id},${id}` 会
   * 在每个 draw 上产生一个短命字符串 —— 那正好是排序想省掉的开销。
   */
  private readonly textureGroupIds = new Map<BindGroup, number>();
  private nextTextureGroupId = 1;
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
    this._culling = init.options.culling ?? true;
    this._sortMode = init.options.sort ?? 'none';
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
      // GPU 计时需要 `timestamp-query`，而 WebGPU 只能在 requestDevice 时申请。
      // 用 optionalFeatures：后端不支持时忽略而不是让整个 Renderer.create 失败
      //（真正的失败原因由 enableGpuTiming() → createQuerySet() 给出）。
      ...(options.requiredFeatures ? { requiredFeatures: options.requiredFeatures } : {}),
      ...(options.gpuTiming ? { optionalFeatures: [GPU_TIMING_FEATURE] } : {}),
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

    if (options.gpuTiming) {
      // 失败不抛：这是一条「尽力而为」的路径，原因记在 renderer.gpuTiming.error 里。
      try {
        renderer.enableGpuTiming(typeof options.gpuTiming === 'object' ? options.gpuTiming : {});
      } catch (error) {
        renderer.gpuTimingError = describeGpuTimingFailure(error);
        logger.warn(`GPU 计时不可用：${renderer.gpuTimingError}`);
      }
    }
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
        // 还原掉 createUniforms() 的 Proxy：渲染器的每 draw 写入路径直接操作原始对象，
        // 免得每次 set()/has() 都穿一遍 Proxy 陷阱（见 unwrapUniforms 的说明）。
        values: resolved.uniforms ? unwrapUniforms(resolved.createUniforms()) : null,
        pipelineId: this.nextPipelineId++,
        // 半透明物不能被随意排序（见 DrawSort）：这里解析一次混合状态，之后只读这个布尔值。
        transparent: resolved.resolveBlend() !== null,
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

  /* ------------------------------------------------------- 剔除 / 排序 ------------------------ */

  /** 是否开启视锥剔除（默认开）。打开时立刻按当前相机刷新一次视锥。 */
  get culling(): boolean {
    return this._culling;
  }

  set culling(value: boolean) {
    this._culling = value;
    // 刚打开时 culler 可能还没初始化过（之前一直是关的），先按当前相机构造一次。
    if (value) this.updateCamera();
  }

  /** 是否已经有一个可用的视锥（相机存在、且剔除开着时才会是 true）。 */
  get cullingReady(): boolean {
    return this._culling && this.camera !== null && this.culler.ready;
  }

  /** 当前排序模式。 */
  get sortMode(): DrawSortMode {
    return this._sortMode;
  }

  set sortMode(value: DrawSortMode) {
    if (value === this._sortMode) return;
    // 切到 'none' 之前先把已经排队的绘制按当前模式提交掉，免得它们被忘在队列里。
    this.flushPending();
    this._sortMode = value;
  }

  /* ------------------------------------------------------------------ GPU 计时 --------------- */

  /** 当前后端 + 设备是否具备 GPU 计时能力（不创建设备资源，可先判断再决定要不要开）。 */
  get supportsGpuTiming(): boolean {
    return GpuTiming.isAvailable(this.device);
  }

  /**
   * GPU 计时状态。默认 `enabled: false`。
   *
   * 读 `gpuFrameTimeMs` 拿到最近一次成功读回的 GPU 帧耗时（毫秒），`samples` / `skipped`
   * 说明样本数量与跳过的读回次数；失败原因在 `error` 里。
   */
  get gpuTiming(): GpuTimingStats {
    if (this.gpuTimingValue) return this.gpuTimingValue.stats;
    return {
      enabled: false,
      available: GpuTiming.isAvailable(this.device),
      frames: 0,
      delay: 0,
      gpuFrameTimeMs: null,
      samples: 0,
      skipped: 0,
      inFlight: 0,
      error: this.gpuTimingError,
    };
  }

  /**
   * 打开 GPU 计时。
   *
   * 显式调用时**失败就抛错**（带 `[gpu-device-api] ` 前缀的英文消息，说明缺哪个 feature/扩展）——
   * 例如 WebGL2 上没有 `EXT_disjoint_timer_query_webgl2`、或 WebGPU 设备没启用 `timestamp-query`。
   * 想让失败静默降级请用 `Renderer.create({ gpuTiming: true })`（它会把原因写进 `gpuTiming.error`）。
   *
   * 实现方式是环形 query set + 延迟若干帧的异步读回，**不会每帧阻塞等待 GPU**；
   * 详见 `GpuTiming` 的说明。
   */
  enableGpuTiming(options: GpuTimingOptions = {}): void {
    if (this.gpuTimingValue) return;
    const timing = new GpuTiming(this.device, options);
    this.gpuTimingValue = timing;
    this.gpuTimingError = null;
  }

  /** 关闭 GPU 计时并释放 query set。 */
  disableGpuTiming(): void {
    this.gpuTimingValue?.destroy();
    this.gpuTimingValue = null;
    this.statsValue.gpuFrameTime = null;
  }

  /* ------------------------------------------------------ 预热 / 编译诊断 ---------------------- */

  /**
   * 预编译一批材质的管线变体，把编译/链接开销挪出渲染循环。
   *
   * ```ts
   * const renderer = await Renderer.create({ canvas });
   * const lamberts = [...];                       // 一批材质
   * const report = await renderer.prewarm({ materials: lamberts });
   * if (!report.ok) console.warn(report.results.map((r) => r.reason));
   * // 之后第一帧用这些材质绘制时，管线已经好了
   * ```
   *
   * ## 两个后端同一段代码
   *
   * 调用方**不需要**写「`this.backend === 'webgl2' ? ... : ...`」的分支：这里按
   * {@link Renderer.backend} 分派到后端的设备级入口
   *（`prewarmWebGL2RenderPipeline` / `prewarmWebGPURenderPipeline`）。
   * 两个后端的**顺序差异**（WebGPU 先建管线对象再 `await prewarm(variant)`；
   * WebGL2 先把 program 链接好再建管线）封在 helper 里，这里只负责
   * 「算出与绘制时一致的 variant」和「把 helper 返回的管线交回给绘制路径」。
   *
   * ## 为什么预热到的就是绘制时用的那一条
   *
   * 两个后端的编译成果都挂在**管线对象自己**的缓存上（WebGPU 的 variant 缓存、
   * WebGL2 的 program 缓存）。所以预热成功后这里会把 helper 返回的管线存进该材质的状态，
   * 之后 `draw()` → `acquirePipeline()` 直接复用它 —— 另建一条等于白预热。
   *
   * variant 的推导见 {@link Renderer.pipelineVariantFor}：它复用绘制路径的
   * `createPipelineDescriptor()` 与 `createPassDescriptor()`，不另写一套。
   *
   * ## 不重复预热、也不会让渲染挂掉
   *
   * - 已经有管线的材质**直接跳过**（结果里 `skipped: true`，`reason` 说明原因），
   *   只把已有管线的诊断读回来；
   * - 预热失败（着色器编译错误、超时）**不抛错**：结果里 `ok: false`、`pipeline: null`、
   *   详细诊断在 `reason` / `info` 里。想直接抛错请显式传 `{ throwOnError: true }`；
   * - WebGL2 缺 `KHR_parallel_shader_compile` 时会退化成同步（`mode: 'sync'`）并**如实说明**
   *   —— 这时它仍然有价值：同一段同步工作被提前到了调用 `prewarm()` 的时候。
   *
   * 建议在帧外（加载阶段、切场景之前）调用；在 `beginFrame()` 与 `endFrame()` 之间调用也能跑，
   * 但 `await` 期间整帧会挂在那里。
   */
  async prewarm(options: RendererPrewarmOptions = {}): Promise<RendererPrewarmResult> {
    const started = nowMs();
    const requested = options.materials ?? [...this.materials.keys()];
    const passOptions: FrameOptions = options.target ? { target: options.target } : {};
    const prewarmOptions: PrewarmOptions = {
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      ...(options.throwOnError !== undefined ? { throwOnError: options.throwOnError } : {}),
    };

    const results: MaterialPrewarmResult[] = [];
    let variant: RenderPipelineVariant | null = null;
    let prewarmed = 0;
    let skipped = 0;
    let failed = 0;

    for (const material of requested) {
      const state = this.materialState(material);

      // 已经建过管线：跳过，不重复预热（再热一次不会更快，只会白建一条）。
      if (state.pipeline) {
        skipped += 1;
        results.push(await this.skippedPrewarmResult(state));
        continue;
      }

      const descriptor = this.pipelineDescriptorFor(state);
      const materialVariant = this.pipelineVariantFor(descriptor, passOptions);
      variant ??= materialVariant;

      const outcome =
        this.backend === 'webgl2'
          ? await prewarmWebGL2RenderPipeline(this.device, descriptor, prewarmOptions)
          : await prewarmWebGPURenderPipeline(this.device, descriptor, materialVariant, prewarmOptions);

      /*
       * 把 helper 返回的管线存回材质状态：绘制时 `acquirePipeline()` 直接复用它，
       * 编译成果（WebGPU 的 variant 缓存 / WebGL2 的 program 缓存）才不会被丢掉。
       * 失败时 `outcome.pipeline` 是 null，状态保持为空 —— 之后 `draw()` 会照常自己建一条。
       */
      if (outcome.pipeline) state.pipeline = outcome.pipeline;
      if (outcome.ok) prewarmed += 1;
      else failed += 1;

      results.push({
        material,
        label: outcome.label,
        ok: outcome.ok,
        skipped: false,
        mode: outcome.mode,
        reason: outcome.reason,
        durationMs: outcome.durationMs,
        info: outcome.info,
        pipeline: outcome.pipeline,
        variant: materialVariant,
      });
    }

    return {
      backend: this.backend,
      variant,
      ...this.summarizePrewarm(results, prewarmed, skipped, failed),
      durationMs: nowMs() - started,
      results,
    };
  }

  /**
   * 某个材质的管线编译诊断（每条 message 带 `type` / `lineNum` / `linePos` / `stage`）。
   *
   * `CompilationInfo` 是 core 的公共结构，这里原样透出 —— WebGL2 的 `lineNum` 来自
   * `getShaderInfoLog()` / `getProgramInfoLog()` 的原文解析（`linePos` 恒为 `null`），
   * WebGPU 来自 `GPUShaderModule.getCompilationInfo()`（行列都有）。
   *
   * 诊断挂在管线上，所以这条材质**还没建过管线**时这里会走一次 `prewarm()`
   *（等价于 `(await this.prewarm({ materials: [material] })).results[0].info`）：
   *
   * - 编译成功：管线被留下，之后 `draw()` 直接用它（不白跑）；
   * - 编译失败：**不抛错**，把带真实行号的诊断交回 —— 这正是「着色器写错了想知道错在哪一行」
   *   最需要的路径（WebGL2 上 program 链接失败时 `acquirePipeline()` 会抛，所以这里不能走它）。
   *
   * 想自己控制超时/抛错行为就直接调 `prewarm()`。
   */
  async compilationInfo(material: Material): Promise<CompilationInfo> {
    const state = this.materialState(material);
    if (state.pipeline) return this.readCompilationInfo(state.pipeline);
    const report = await this.prewarm({ materials: [material] });
    return report.results[0]!.info;
  }

  /** 由逐条明细汇总出的整体结论（`mode` / `reason` / `ok` 的口径见各自的类型注释）。 */
  private summarizePrewarm(
    results: readonly MaterialPrewarmResult[],
    prewarmed: number,
    skipped: number,
    failed: number,
  ): Pick<RendererPrewarmResult, 'mode' | 'reason' | 'ok' | 'prewarmed' | 'skipped' | 'failed'> {
    const attempted = results.filter((result) => !result.skipped);
    let mode: PrewarmMode | null = null;
    if (attempted.length > 0) {
      mode = attempted.every((result) => result.mode === 'async') ? 'async' : 'sync';
    }
    // 失败优先于降级：调用方最需要先看到的是「为什么没成功」，而不是「为什么不是异步」。
    const failedReason = attempted.find((result) => !result.ok && result.reason !== null)?.reason ?? null;
    const syncReason =
      mode === 'sync' ? (attempted.find((result) => result.mode === 'sync')?.reason ?? null) : null;
    return { mode, reason: failedReason ?? syncReason, ok: failed === 0, prewarmed, skipped, failed };
  }

  /** 已建过管线时的结果：不重新预热，只把诊断读回来（结果形状与真预热一致）。 */
  private async skippedPrewarmResult(state: MaterialState): Promise<MaterialPrewarmResult> {
    const started = nowMs();
    const pipeline = state.pipeline!;
    const info = await this.readCompilationInfo(pipeline);
    return {
      material: state.material,
      label: pipeline.label,
      ok: !info.hasErrors,
      skipped: true,
      mode: null,
      reason: SKIPPED_PREWARM_REASON,
      durationMs: nowMs() - started,
      info,
      pipeline,
      variant: null,
    };
  }

  /** 读一条管线的诊断；后端没提供这个能力时**如实说明**（而不是假装「编译干净」）。 */
  private async readCompilationInfo(pipeline: RenderPipeline): Promise<CompilationInfo> {
    if (typeof pipeline.getCompilationInfo === 'function') return pipeline.getCompilationInfo();
    return createCompilationInfo({
      label: pipeline.label,
      backend: this.backend,
      messages: [
        createCompilationMessage({
          type: 'info',
          label: pipeline.label,
          backend: this.backend,
          message: 'this pipeline does not expose getCompilationInfo(); no diagnostics are available',
        }),
      ],
    });
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
    // WebGPU 走 encoder 级时间戳：它只需要 `timestamp-query`，而 pass 内的 timestampWrites
    // 还需要 `timestamp-query-inside-passes`（Chrome 默认不开）。WebGL2 是空操作，
    // 它的计时由下面 pass 的 timestampWrites 包住整个通道。
    this.gpuTimingValue?.beforeFrame(this.encoder);
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
      // GPU 计时只标在本帧第一个通道上：单通道帧（beginFrame 的默认形态）就是整帧；
      // 多通道时 beginPass() 开的通道不写时间戳，避免把不同通道混进同一个样本。
      ...this.timestampWritesForPass(),
    });

    this.commandBuffers = [];
    this.statsValue.drawCalls = 0;
    this.statsValue.triangles = 0;
    this.statsValue.instances = 0;
    this.statsValue.pipelineSwitches = 0;
    this.statsValue.culled = 0;
    this.statsValue.cullTested = 0;
    this.statsValue.cullSkipped = 0;
    this.statsValue.sorted = 0;
    this.currentPipeline = null;
    this._inFrame = true;
  }

  endFrame(): void {
    if (!this._inFrame) return;
    // 排序模式下这里才真正把本帧的 draw 提交出去（见 draw() 的说明）。
    this.flushPending();
    this.pass?.end();
    const encoder = this.encoder;
    if (encoder) {
      // WebGPU 的「帧结束」时间戳：必须在所有 pass 都 end() 之后、finish() 之前写。
      if (this.gpuTimingValue) this.gpuTimingValue.afterFrameEncoding(encoder);
      this.commandBuffers.push(encoder.finish());
    }
    if (this.commandBuffers.length > 0) this.device.queue.submit(this.commandBuffers);

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.statsValue.frameTime = now - this.frameStart;

    // 提交之后才安排读回：队列顺序保证它看到的时间戳已经写入（见 GpuTiming）。
    if (this.gpuTimingValue) {
      this.gpuTimingValue.onFrameSubmitted();
      this.statsValue.gpuFrameTime = this.gpuTimingValue.stats.gpuFrameTimeMs;
    }

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
    // 上一个通道里排队的绘制必须先在旧通道里提交，不能漂到新通道去。
    this.flushPending();
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

  /** 取出（必要时创建）本帧第一个 render pass 的 GPU 计时写入点。 */
  private timestampWritesForPass(): { timestampWrites?: PassTimestampWrites } {
    const writes = this.gpuTimingValue?.passTimestampWrites();
    return writes ? { timestampWrites: writes } : {};
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

  /**
   * 绘制一个几何体。
   *
   * 三件事按顺序发生：
   * 1. **校验**（属性和实例数）永远立刻做，错了就当行抛；
   * 2. **视锥剔除**：开了 `culling` 且几何体有包围球时，整体在视锥外就直接返回
   *   （只累加 `stats.culled`，不进命令缓冲）；
   * 3. **提交或排队**：`sort: 'none'`（默认）立刻提交；开了排序就先入队，
   *   到 `endFrame()` / 下一个 `beginPass()` 才按排序结果提交 —— 那时
   *   `stats.drawCalls` 之类才完整。
   */
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
    const state = this.materialState(material);

    geometry.validateAgainst(material.attributes, material.name);
    this.assertInstanceCount(geometry, options.instances);

    if (this.isCulled(geometry, options.model)) return;

    if (this._sortMode === 'none') {
      this.submitDraw(geometry, material, state, options);
      return;
    }
    this.enqueueDraw(geometry, material, state, options);
  }

  /**
   * 视锥剔除判定。返回 `true` 表示「整体在视锥外，别画了」。
   *
   * 判定失败（没有相机、还没有视锥、几何体没有可用包围球）时一律返回 `false`
   * 并计入 `stats.cullSkipped` —— 剔除只能少画，绝不能多剔。
   */
  private isCulled(geometry: Geometry, model: Mat4 | undefined): boolean {
    if (!this._culling) return false;
    this.statsValue.cullTested += 1;
    if (!this.camera || !this.culler.ready) {
      this.statsValue.cullTested -= 1;
      this.statsValue.cullSkipped += 1;
      return false;
    }
    const sphere = geometry.boundingSphere;
    if (!sphere || !geometry.cullable) {
      this.statsValue.cullTested -= 1;
      this.statsValue.cullSkipped += 1;
      return false;
    }
    if (!this.culler.intersectsLocalSphere(sphere, model)) {
      this.statsValue.culled += 1;
      return true;
    }
    return false;
  }

  /** 排序模式：把这次绘制存进队列，算好排序键。 */
  private enqueueDraw(
    geometry: Geometry,
    material: Material,
    state: MaterialState,
    options: DrawOptions,
  ): void {
    const textureGroup =
      material.textures.length > 0 ? this.acquireTextureBindGroup(material, options.textures ?? {}) : null;
    this.pending.push({
      geometry,
      material,
      state,
      options,
      pipeline: state.pipelineId,
      bindings: textureGroup ? this.textureGroupId(textureGroup) : 0,
      depth: this.depthOf(geometry, options.model),
      transparent: state.transparent,
      order: this.pending.length,
    });
    this.statsValue.sorted += 1;
  }

  /** 把排队的绘制按当前模式排序后提交（`beginPass()` / `endFrame()` / 切模式时调用）。 */
  private flushPending(): void {
    const items = this.pending;
    if (items.length === 0) return;
    try {
      sortDraws(items, this._sortMode);
      for (const item of items) {
        this.submitDraw(item.geometry, item.material, item.state, item.options);
      }
    } finally {
      // 提交中途抛错也要清队列：留着它只会在下一帧重复画出错的东西。
      items.length = 0;
    }
  }

  /** 真正把一次绘制写进命令缓冲。`draw()` 与排序队列的 flush 都走这里。 */
  private submitDraw(
    geometry: Geometry,
    material: Material,
    state: MaterialState,
    options: DrawOptions,
  ): void {
    const pipeline = this.acquirePipeline(state);
    this.pass!.setPipeline(pipeline);
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
        this.pass!.setBindGroup(material.uniforms.group, arena.bindGroup(layout), [dynamicOffset]);
      }
    }

    /* ---- group 1：纹理 -------------------------------------------------------------------- */
    if (material.textures.length > 0) {
      const group = this.acquireTextureBindGroup(material, options.textures ?? {});
      if (group) this.pass!.setBindGroup(material.textureGroup, group);
    }

    /* ---- 顶点与索引 ------------------------------------------------------------------------ */
    for (const attribute of material.attributes) {
      const provided = geometry.attributes.get(attribute.name)!;
      this.pass!.setVertexBuffer(attribute.location, provided.buffer, 0, provided.buffer.size);
    }
    if (geometry.indexBuffer && geometry.indexFormat) {
      this.pass!.setIndexBuffer(geometry.indexBuffer, geometry.indexFormat, 0, geometry.indexBuffer.size);
      this.pass!.drawIndexed({
        indexCount: options.count ?? geometry.indexCount,
        ...(options.first !== undefined ? { firstIndex: options.first } : {}),
        ...(options.instances !== undefined ? { instanceCount: options.instances } : {}),
      });
    } else {
      this.pass!.draw({
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
    this.gpuTimingValue?.destroy();
    this.gpuTimingValue = null;
    for (const state of this.materials.values()) {
      state.pipeline?.dispose();
      state.values = null;
    }
    this.materials.clear();
    this.pending.length = 0;
    this.textureGroupIds.clear();
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

  /**
   * 登记（必要时）并取出一个材质的状态。
   *
   * `draw()` / `setMaterial()` / `prewarm()` / `compilationInfo()` 都走这里，
   * 「材质第一次出现时登记什么」只有一份实现。
   */
  private materialState(material: Material): MaterialState {
    const existing = this.materials.get(material);
    if (existing) return existing;
    this.createMaterial(material);
    return this.materials.get(material)!;
  }

  private acquirePipeline(state: MaterialState): RenderPipeline {
    if (state.pipeline) return state.pipeline;
    state.pipeline = this.device.createRenderPipeline(this.pipelineDescriptorFor(state));
    return state.pipeline;
  }

  /**
   * 一条材质要交给 `device.createRenderPipeline()` 的描述。
   *
   * `acquirePipeline()`（真正绘制时）与 `prewarm()` 走的是**同一个方法**，
   * 所以预热用的 `vertexLayouts` 就是从这份描述的 `vertex.buffers` 来的，
   * 不会出现「预热一套布局、绘制另一套」。
   */
  private pipelineDescriptorFor(state: MaterialState): RenderPipelineDescriptor {
    return state.material.createPipelineDescriptor(this.device).descriptor;
  }

  /**
   * 一条管线在**真正绘制时**会被解析出的 variant。
   *
   * 这里刻意不另写一套推导，每个字段都与绘制路径同源：
   *
   * - `vertexLayouts`：来自 {@link pipelineDescriptorFor}，也就是 `acquirePipeline()` 交给
   *   `createRenderPipeline()` 的那份描述（材质声明几个属性就是几个槽位，顺序也一样）；
   * - `colorFormats` / `depthFormat` / `sampleCount`：来自 {@link createPassDescriptor} 的
   *   附件列表 —— 与 `beginFrame()` 调用的是同一个方法，附件来源同样是 canvas
   *   或 `options.target`。
   *
   * `sampleCount` 两个后端的解析口径不同，这里照抄各自的渲染通道解析器，而不是取「看起来对」的值：
   * WebGPU 取附件纹理的采样数（画布 MSAA 会体现在这里），WebGL2 取渲染目标声明的采样数、
   * canvas 路径恒为 1（见 `WebGL2RenderPassEncoder` 的 `variantShape`）。
   *
   * 附件的 `colorFormats` / `depthFormat` 对 WebGPU 是「variant 描述 target 的附件」，与管线自己
   * 是否使用深度无关（那是 `descriptor.depthStencil` 的事）—— 两处都按这个语义传。
   */
  private pipelineVariantFor(descriptor: RenderPipelineDescriptor, options: FrameOptions): RenderPipelineVariant {
    const pass = this.createPassDescriptor(options, this._clearColor);
    // `RenderPassDescriptor` 允许某个颜色附件是 null（跳过那个 attachment），格式列表要把它们去掉。
    const colorFormats: TextureFormat[] = [];
    for (const attachment of pass.colorAttachments) {
      if (attachment) colorFormats.push(this.attachmentFormat(attachment.view));
    }
    const depthView = pass.depthStencilAttachment?.view ?? null;
    return {
      colorFormats,
      sampleCount:
        this.backend === 'webgl2' ? this.webgl2SampleCountFor(options) : this.webgpuSampleCountFor(pass),
      depthFormat: depthView ? this.attachmentFormat(depthView) : null,
      vertexLayouts: descriptor.vertex.buffers ?? [],
    };
  }

  /**
   * 附件的实际格式。
   *
   * 两个后端的口径不同（照抄各自的渲染通道解析器）：WebGPU 的 view 可以重解释格式，
   * 所以 `view.descriptor.format` 优先；WebGL2 的附件格式就是纹理格式。
   */
  private attachmentFormat(view: TextureView): TextureFormat {
    return this.backend === 'webgpu' ? (view.descriptor.format ?? view.texture.format) : view.texture.format;
  }

  /** WebGPU 的 variant `sampleCount`：这个通道所有附件纹理的采样数（WebGPU 要求它们一致）。 */
  private webgpuSampleCountFor(pass: RenderPassDescriptor): number {
    for (const attachment of pass.colorAttachments) {
      if (attachment) return attachment.view.texture.sampleCount;
    }
    return pass.depthStencilAttachment?.view.texture.sampleCount ?? 1;
  }

  /**
   * WebGL2 的 variant `sampleCount`：只有**画进多重采样渲染目标**时才是目标的采样数，
   * 其余情况（含 canvas 默认帧缓冲）是 1 —— 与 `WebGL2RenderPassEncoder` 的
   * `this.renderTarget?.sampleCount ?? 1` 一致。
   */
  private webgl2SampleCountFor(options: FrameOptions): number {
    return options.target ? options.target.sampleCount : 1;
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

  /** 纹理 bind group 的排序序号（对象身份 → 小整数，只在第一次见到时分配）。 */
  private textureGroupId(group: BindGroup): number {
    let id = this.textureGroupIds.get(group);
    if (id === undefined) {
      id = this.nextTextureGroupId++;
      this.textureGroupIds.set(group, id);
    }
    return id;
  }

  /**
   * 这次绘制离相机多远（视空间深度，越大越远），供半透明物按「从远到近」排序。
   *
   * 用包围球中心当代表值：单个物体内部的三角形顺序不归排序管（那是深度测试的事）。
   * 没有包围球或没有相机时返回 0 —— 排序仍然稳定，只是这一项不参与区分。
   */
  private depthOf(geometry: Geometry, model: Mat4 | undefined): number {
    const sphere = geometry.boundingSphere;
    const camera = this.camera;
    if (!sphere || !camera) return 0;

    const point = this.sortPointScratch;
    if (model) mat4.transformPoint(point, model, sphere.center);
    else vec3.copy(point, sphere.center);

    // view 矩阵是列主序：第 2 行（z 行）是 (m[2], m[6], m[10], m[14])。
    // 相机前方 z 为负，取负号让「越大越远」。
    const view = camera.viewMatrix;
    return -(
      view[2]! * point[0]! +
      view[6]! * point[1]! +
      view[10]! * point[2]! +
      view[14]!
    );
  }

  /**
   * 按当前画布宽高比与后端深度约定刷新相机矩阵。
   *
   * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
   * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
   *
   * 这里同时刷新视锥（剔除要用 P × V）。
   */
  updateCamera(): void {
    const camera = this.camera;
    if (!camera) {
      this.culler.ready = false;
      return;
    }
    camera.aspect = this.aspect;
    // 两个后端的裁剪空间 z 约定不同，切换后端时投影矩阵要跟着换（相机自己不知道后端）。
    camera.depthRange = this.backend === 'webgpu' ? 'zo' : 'gl';
    camera.update();
    // 视锥用当帧的 P × V 与同一套深度约定：用错约定会把近处的物体误剔除。
    if (this._culling) this.culler.update(camera.projectionViewMatrix, camera.depthRange);
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
