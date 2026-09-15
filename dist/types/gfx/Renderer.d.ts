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
 * 6. **渲染进纹理的行序** —— WebGL2 的离屏目标原生自下而上（`RenderTarget.rowOrder === 'bottomUp'`），
 *    这里只在「附件是纹理（不是 canvas）」的通道上把相机投影在裁剪空间 Y 取反、并把 `frontFace`
 *    一起换过来，于是「渲染到纹理 → 采样上屏」两个后端一致，调用方不用写任何翻转代码
 *    （见 {@link RendererOptions.rowOrder} 与 `docs/backend-limits.md` 第五节）；
 * 7. **管线预热** —— `prewarm()` 把一批材质的编译/链接挪出渲染循环，两个后端同一段代码
 *    （见 {@link Renderer.prewarm} 与 {@link Renderer.compilationInfo}）。
 */
import { type Logger } from '../utils/logger.js';
import { type Mat4 } from '../utils/math/index.js';
import { type CompilationInfo, type PrewarmMode } from '../core/pipeline/CompilationInfo.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasContext } from '../core/CanvasContext.js';
import type { Device } from '../core/Device.js';
import type { RenderTarget, Color } from '../core/render/RenderTarget.js';
import type { RenderPipeline, RenderPipelineVariant } from '../core/pipeline/RenderPipeline.js';
import { Material, type MaterialDesc } from './Material.js';
import { Geometry, type GeometryDesc } from './Geometry.js';
import { GfxTexture, type TextureDesc } from './Texture.js';
import { type DrawSortMode } from './DrawSort.js';
import { type GpuTimingOptions, type GpuTimingStats } from './GpuTiming.js';
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
     * 渲染进纹理时的行序策略，默认 `'unified'`（用户无感统一）。
     *
     * - `'unified'`：**画到离屏目标**（`FrameOptions.target`）的通道上，如果该目标的后端原生行序是
     *   `'bottomUp'`（WebGL2 就是这样：GL 的窗口原点在左下，附着到 FBO 上的纹理自下而上存储），
     *   就把相机投影在裁剪空间做 Y 取反（`mat4.flipClipY`），并把同一条管线的 `frontFace`
     *   换过来（Y 取反会反转三角绕序，不换会把背面剔除剔错面）。这样「先渲染到纹理、再把这张
     *   纹理采样上屏」在两个后端得到**逐像素一致**的画面。**画布默认帧缓冲永远不翻** ——
     *   浏览器合成本来就是对的。
     * - `'backend'`：如实保留后端的原生行序，本层不做任何翻转。需要自己处理时用
     *   `target.rowOrder` 判断，配合 `mat4.flipClipY`（翻投影）或读回后反行序。
     *
     * ⚠️ 这条自动翻转**只对使用库提供的投影 uniform（`projection` / `projectionView`）的材质有效**
     * —— 因为翻转发生在「本层往这两个 uniform 里写的矩阵」上。顶点着色器把位置写死
     * （典型：全屏四边形、blit）的材质不受影响，需要自己在着色器里对 `gl_Position.y` 取反。
     * 详见 `docs/backend-limits.md` 第五节。
     */
    rowOrder?: RowOrderMode;
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
/**
 * 渲染进纹理时的行序策略（{@link RendererOptions.rowOrder}）。
 *
 * - `'unified'`：本层自动把 WebGL2 的离屏目标统一成与 WebGPU 相同的行序（默认，无感）；
 * - `'backend'`：如实保留后端原生行序，本层不翻。
 */
export type RowOrderMode = 'unified' | 'backend';
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
     * {@link Renderer.prewarm}），也决定要不要用**绕序翻转**的那条管线
     * （画进 `rowOrder === 'bottomUp'` 的离屏目标时要翻，见 {@link RendererOptions.rowOrder}）。
     * 之后要画进离屏目标就传那个 `RenderTarget`，否则预热到的是另一个变体 —— 预热会白做
     * （不会出错，只是首次绘制仍然要付编译开销）。
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
export declare class Renderer {
    readonly backend: BackendKind;
    readonly device: Device;
    readonly context: CanvasContext;
    readonly canvas: HTMLCanvasElement | OffscreenCanvas;
    readonly logger: Logger;
    camera: Camera | null;
    private readonly arenaPool;
    private readonly materials;
    private readonly geometries;
    private readonly textures;
    private readonly bindGroups;
    private readonly statsValue;
    /** GPU 计时；`enableGpuTiming()` 之前是 null（默认关闭：需要额外 feature、要读回、有开销）。 */
    private gpuTimingValue;
    /** 打开 GPU 计时失败的原因；供 `gpuTiming.error` 与诊断使用。 */
    private gpuTimingError;
    private _clearColor;
    private _pixelRatio;
    private _width;
    private _height;
    private _inFrame;
    /** 渲染进纹理时的行序策略；见 {@link RendererOptions.rowOrder}。 */
    private _rowOrder;
    /**
     * **当前通道**是否需要把相机投影在裁剪空间 Y 取反（并在同一通道内翻转 `frontFace`）。
     *
     * 由 `beginFrame()` / `beginPass()` 按该通道的附件决定：附件来自离屏目标且该目标原生行序是
     * `'bottomUp'`、同时 `rowOrder === 'unified'` 时为 true。它是**逐通道**的状态 ——
     * 切回画布通道时会被重新算成 false，于是下一个 draw 用的又是没翻过的那条管线。
     */
    private passFlipsRows;
    /** `passFlipsRows` 为 true 时用的翻转后投影矩阵（暂存，避免每 draw 分配）。 */
    private readonly flippedProjectionMatrix;
    /** `passFlipsRows` 为 true 时用的翻转后投影视图矩阵（暂存）。 */
    private readonly flippedProjectionViewMatrix;
    private encoder;
    private pass;
    private commandBuffers;
    private currentMaterial;
    /** 上一次 draw 用的管线，用来统计真正的「管线切换」次数（每个通道开头清空）。 */
    private currentPipeline;
    private defaultTexture;
    private frameStart;
    /** 计算法线矩阵时复用的暂存区，避免每帧分配。 */
    private readonly normalMatrixScratch;
    /** 排序时算「包围球中心的世界坐标」用的暂存区。 */
    private readonly sortPointScratch;
    /** 视锥剔除器：`updateCamera()` 里按当帧矩阵刷新。 */
    private readonly culler;
    private _culling;
    private _sortMode;
    /** 排序模式下本通道待提交的绘制。 */
    private readonly pending;
    private nextPipelineId;
    /**
     * 纹理 bind group → 排序序号。
     *
     * 用对象身份而不是拼字符串：排序键必须在每 draw 上是 O(1) 的，拼 `${name}|${id},${id}` 会
     * 在每个 draw 上产生一个短命字符串 —— 那正好是排序想省掉的开销。
     */
    private readonly textureGroupIds;
    private nextTextureGroupId;
    private _disposed;
    private constructor();
    /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
    static create(options: RendererOptions): Promise<Renderer>;
    get width(): number;
    get height(): number;
    get pixelRatio(): number;
    /** 宽高比（相机常用）。 */
    get aspect(): number;
    get clearColor(): Color;
    setClearColor(color: Color): void;
    setPixelRatio(ratio: number): void;
    /** 按 CSS 尺寸重新设置后备缓冲大小。 */
    setSize(width: number, height: number, updateStyle?: boolean): void;
    /** 重新读取 canvas 尺寸；返回是否发生变化。 */
    resize(): boolean;
    private syncSize;
    setCamera(camera: Camera | null): void;
    createGeometry(desc: GeometryDesc): Geometry;
    /** 创建（或直接登记）一个材质。 */
    createMaterial(material: Material | MaterialDesc): Material;
    createTexture(desc: TextureDesc): GfxTexture;
    /** 当前设置的材质（`draw()` 未显式指定时使用）。 */
    setMaterial(material: Material | null): void;
    /**
     * 渲染进纹理时的行序策略；默认 `'unified'`（本层自动统一，见 {@link RendererOptions.rowOrder}）。
     *
     * 改完在**下一个通道**生效（`beginFrame()` / `beginPass()` 会重新判定），当前通道不受影响。
     */
    get rowOrder(): RowOrderMode;
    set rowOrder(value: RowOrderMode);
    get material(): Material | null;
    get stats(): RendererStats;
    /** 是否开启视锥剔除（默认开）。打开时立刻按当前相机刷新一次视锥。 */
    get culling(): boolean;
    set culling(value: boolean);
    /** 是否已经有一个可用的视锥（相机存在、且剔除开着时才会是 true）。 */
    get cullingReady(): boolean;
    /** 当前排序模式。 */
    get sortMode(): DrawSortMode;
    set sortMode(value: DrawSortMode);
    /** 当前后端 + 设备是否具备 GPU 计时能力（不创建设备资源，可先判断再决定要不要开）。 */
    get supportsGpuTiming(): boolean;
    /**
     * GPU 计时状态。默认 `enabled: false`。
     *
     * 读 `gpuFrameTimeMs` 拿到最近一次成功读回的 GPU 帧耗时（毫秒），`samples` / `skipped`
     * 说明样本数量与跳过的读回次数；失败原因在 `error` 里。
     */
    get gpuTiming(): GpuTimingStats;
    /**
     * 打开 GPU 计时。
     *
     * 显式调用时**失败就抛错**，而且**在启用时就抛**（带 `[gpu-device-api] ` 前缀的英文消息，
     * 说明缺哪个 feature / 缺哪个方法 / 缺哪个扩展）—— 这正是本次修复的一个要点：以前的判定只看
     * 特性标志，会把「启用了 `timestamp-query` 但实现没暴露 `GPUCommandEncoder.writeTimestamp()`」
     * 的设备判成可用，于是异常拖到第一次记时间戳时才炸（那一炸在帧循环里，整页渲染跟着挂）。
     * 想让失败静默降级请用 `Renderer.create({ gpuTiming: true })`（它会把原因写进 `gpuTiming.error`）。
     *
     * 实现方式是环形 query set + 延迟若干帧的异步读回，**不会每帧阻塞等待 GPU**；
     * 详见 `GpuTiming` 的说明。
     */
    enableGpuTiming(options?: GpuTimingOptions): void;
    /** 关闭 GPU 计时并释放 query set。 */
    disableGpuTiming(): void;
    /**
     * 跑一步 GPU 计时调用；失败就**自动关掉计时、记下原因、渲染继续**。
     *
     * 为什么必须这样包：GPU 计时是**可选**的性能分析能力，它的任何失败都不该让渲染/页面失败。
     * 实测的事故正好相反 —— 设备启用了 `timestamp-query` 却没暴露 `writeTimestamp`，写时间戳抛出的
     * 异常逃进帧循环，`examples/gfx-benchmark.html` 整页 fail（连带 CPU 那几列也一起没了）。
     * 所以这里把失败降级成：`enabled: false` + `error`（可读）+ `stats.gpuFrameTime = null`，
     * 同时释放 query set；本帧与后续帧照常渲染，只是不再有 GPU 数据。
     */
    private runGpuTimingStep;
    /** 运行中失败后的降级收尾（见 {@link Renderer.runGpuTimingStep}）；绝不抛。 */
    private disableGpuTimingAfterFailure;
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
    prewarm(options?: RendererPrewarmOptions): Promise<RendererPrewarmResult>;
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
    compilationInfo(material: Material): Promise<CompilationInfo>;
    /** 由逐条明细汇总出的整体结论（`mode` / `reason` / `ok` 的口径见各自的类型注释）。 */
    private summarizePrewarm;
    /** 已建过管线时的结果：不重新预热，只把诊断读回来（结果形状与真预热一致）。 */
    private skippedPrewarmResult;
    /** 读一条管线的诊断；后端没提供这个能力时**如实说明**（而不是假装「编译干净」）。 */
    private readCompilationInfo;
    beginFrame(options?: FrameOptions): void;
    endFrame(): void;
    get inFrame(): boolean;
    /**
     * 在上一帧的基础上再开一个通道（画到另一个目标、或做后处理）。
     * 必须在 `beginFrame()` 之后调用。
     */
    beginPass(options?: FrameOptions): void;
    /**
     * 取出（必要时创建）本帧第一个 render pass 的 GPU 计时写入点。
     *
     * 取写入点这一步失败同样降级（见 {@link Renderer.runGpuTimingStep}），**通道照常开**：
     * 只是这一帧不带时间戳，绝不能让「拿不到计时」变成「这一帧画不出来」。
     */
    private timestampWritesForPass;
    /**
     * 「画到离屏 target」与「画到 canvas」走同一段代码，只是附件来源不同。
     *
     * 两条路径都返回同一形状的 {@link RenderPassDescriptor}（colorAttachments + depthStencilAttachment），
     * 所以深度附件不会被某一条路径漏掉 —— 之前的缺陷正是「画布路径自己拼 color attachment、
     * 从不传 depth attachment」，于是后端的状态解析器如实关掉了 DEPTH_TEST。
     */
    private createPassDescriptor;
    /**
     * 一个通道要不要把相机投影在裁剪空间 Y 取反（并翻转 `frontFace`）。
     *
     * 两条判据，缺一不可：
     *
     * 1. **附件是纹理，不是 canvas 默认帧缓冲** —— 只有离屏目标才有「纹素行序」这件事，
     *    画布那一侧浏览器的合成路径本来就是对的（真实合成截图证明两个后端的画布原样一致率
     *    是 100%），翻了反而上下颠倒。判定用的就是「这个通道有没有传 `target`」。
     * 2. **该目标的后端原生行序不是 `'topLeft'`** —— 直接读 core 暴露的
     *    {@link RenderTarget.rowOrder}（WebGPU = `'topLeft'`、WebGL2 = `'bottomUp'`），
     *    而不是写 `backend === 'webgl2'`：这样后端多一种行序时这里自动跟上。
     *
     * `rowOrder: 'backend'` 时恒为 false（调用方明确要求保留原生行序）。
     */
    private flipsRowsFor;
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
    draw(geometry: Geometry, options?: DrawOptions): void;
    /**
     * 视锥剔除判定。返回 `true` 表示「整体在视锥外，别画了」。
     *
     * 判定失败（没有相机、还没有视锥、几何体没有可用包围球）时一律返回 `false`
     * 并计入 `stats.cullSkipped` —— 剔除只能少画，绝不能多剔。
     */
    private isCulled;
    /** 排序模式：把这次绘制存进队列，算好排序键。 */
    private enqueueDraw;
    /** 把排队的绘制按当前模式排序后提交（`beginPass()` / `endFrame()` / 切模式时调用）。 */
    private flushPending;
    /** 真正把一次绘制写进命令缓冲。`draw()` 与排序队列的 flush 都走这里。 */
    private submitDraw;
    /** 一次画多个实例（需要材质配合 `perInstance` 属性）。 */
    drawInstanced(geometry: Geometry, instances: number, options?: DrawOptions): void;
    /**
     * 实例数与几何体提供的实例数据是否匹配。
     *
     * 实例属性的元素个数就是「最多能画多少个实例」：要多了，WebGL2 会静默地读到缓冲区之外的数据
     *（画面出错但不报错），WebGPU 会在 draw 时报校验错误 —— 两种都不好定位，所以这里提前拦下。
     */
    private assertInstanceCount;
    destroy(): void;
    get disposed(): boolean;
    /**
     * 登记（必要时）并取出一个材质的状态。
     *
     * `draw()` / `setMaterial()` / `prewarm()` / `compilationInfo()` 都走这里，
     * 「材质第一次出现时登记什么」只有一份实现。
     */
    private materialState;
    /**
     * 取得（必要时创建）本通道该用的管线。
     *
     * 画布通道与「绕序翻转」的离屏通道各有一条，选择只看**当前通道**的 {@link Renderer.passFlipsRows}
     * —— 于是切回画布通道后第一个 draw 就会用回没翻过的那条，`frontFace` 随之恢复正确
     * （每条管线的固定功能状态在每个 draw 上都会重新下发，见 `WebGL2RenderPipeline.applyState`）。
     */
    private acquirePipeline;
    /**
     * 一条材质要交给 `device.createRenderPipeline()` 的描述。
     *
     * `acquirePipeline()`（真正绘制时）与 `prewarm()` 走的是**同一个方法**，
     * 所以预热用的 `vertexLayouts` 就是从这份描述的 `vertex.buffers` 来的，
     * 不会出现「预热一套布局、绘制另一套」。
     *
     * `flipWinding` 为 true 时只改一个字段：把 `primitive.frontFace` 换到另一侧。
     * 渲染进「自下而上」的离屏目标时投影被 Y 取反、三角绕序跟着反了（见 `mat4.flipClipY`），
     * 所以背面剔除必须按反过来的正面判，否则会被剔除错面。**着色器一个字都不改** ——
     * 这也是为什么它可以和 `pipeline` 共用同一份 program，而不是第二条编译变体。
     */
    private pipelineDescriptorFor;
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
    private pipelineVariantFor;
    /**
     * 附件的实际格式。
     *
     * 两个后端的口径不同（照抄各自的渲染通道解析器）：WebGPU 的 view 可以重解释格式，
     * 所以 `view.descriptor.format` 优先；WebGL2 的附件格式就是纹理格式。
     */
    private attachmentFormat;
    /** WebGPU 的 variant `sampleCount`：这个通道所有附件纹理的采样数（WebGPU 要求它们一致）。 */
    private webgpuSampleCountFor;
    /**
     * WebGL2 的 variant `sampleCount`：只有**画进多重采样渲染目标**时才是目标的采样数，
     * 其余情况（含 canvas 默认帧缓冲）是 1 —— 与 `WebGL2RenderPassEncoder` 的
     * `this.renderTarget?.sampleCount ?? 1` 一致。
     */
    private webgl2SampleCountFor;
    /**
     * 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。
     *
     * 这里**不再**调用 `camera.update()`：相机矩阵每帧只需要算一次（见 {@link updateCamera}）。
     * 原先每 draw 都重算 lookAt + 两套 perspective + 一次乘法，40k draw 的场景下光这一步就是
     * 几十毫秒/帧的纯 CPU 开销，而且结果完全一样。
     *
     * **本通道要翻行序时**（{@link Renderer.passFlipsRows}）写入的是
     * {@link Renderer.flippedProjectionMatrix} / {@link Renderer.flippedProjectionViewMatrix}
     * —— 也就是把相机投影在裁剪空间 Y 取反的结果（`camera` 自己的矩阵**不被修改**，
     * 所以同一帧里画进画布的那部分照旧）。`view` 与 `cameraPosition` 与行序无关，原样写。
     * 顶点着色器不使用这两个 uniform 的材质不受影响 —— 这就是那条限制的来源。
     */
    private applyCameraUniforms;
    /** 纹理 bind group 的排序序号（对象身份 → 小整数，只在第一次见到时分配）。 */
    private textureGroupId;
    /**
     * 这次绘制离相机多远（视空间深度，越大越远），供半透明物按「从远到近」排序。
     *
     * 用包围球中心当代表值：单个物体内部的三角形顺序不归排序管（那是深度测试的事）。
     * 没有包围球或没有相机时返回 0 —— 排序仍然稳定，只是这一项不参与区分。
     */
    private depthOf;
    /**
     * 按当前画布宽高比与后端深度约定刷新相机矩阵。
     *
     * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
     * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
     *
     * 这里同时刷新视锥（剔除要用 P × V）。
     */
    updateCamera(): void;
    /**
     * 由当前 `model` 计算法线矩阵。
     *
     * 非等比缩放会破坏法线方向（法线不再垂直于表面），必须用「模型矩阵左上 3x3 的逆转置」。
     * 这里自动算好，材质只要声明了 `normalMatrix` 字段就能直接用。
     */
    private updateNormalMatrix;
    private setIfPresent;
    /**
     * 取得（必要时创建）纹理的 bind group。
     *
     * 缓存键由「材质 + 每个槽位实际用的纹理 id」组成：同一个材质换纹理时才会重建，
     * 反复用同一组纹理绘制不会重复创建。没给纹理的槽位绑一张 1×1 的白色占位纹理，
     * 这样「忘了传纹理」的表现是白色而不是未定义数据。
     */
    private acquireTextureBindGroup;
    /** 缺省纹理（材质声明了纹理但调用方没给时用，避免绑到未定义数据）。 */
    getDefaultTexture(): GfxTexture;
}
//# sourceMappingURL=Renderer.d.ts.map