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
import { type Logger } from '../utils/logger.js';
import { type Mat4 } from '../utils/math/index.js';
import type { BackendKind } from '../core/Adapter.js';
import type { CanvasContext } from '../core/CanvasContext.js';
import type { Device } from '../core/Device.js';
import type { RenderTarget, Color } from '../core/render/RenderTarget.js';
import { Material, type MaterialDesc } from './Material.js';
import { Geometry, type GeometryDesc } from './Geometry.js';
import { GfxTexture, type TextureDesc } from './Texture.js';
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
    get material(): Material | null;
    get stats(): RendererStats;
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
     * 显式调用时**失败就抛错**（带 `[gpu-device-api] ` 前缀的英文消息，说明缺哪个 feature/扩展）——
     * 例如 WebGL2 上没有 `EXT_disjoint_timer_query_webgl2`、或 WebGPU 设备没启用 `timestamp-query`。
     * 想让失败静默降级请用 `Renderer.create({ gpuTiming: true })`（它会把原因写进 `gpuTiming.error`）。
     *
     * 实现方式是环形 query set + 延迟若干帧的异步读回，**不会每帧阻塞等待 GPU**；
     * 详见 `GpuTiming` 的说明。
     */
    enableGpuTiming(options?: GpuTimingOptions): void;
    /** 关闭 GPU 计时并释放 query set。 */
    disableGpuTiming(): void;
    beginFrame(options?: FrameOptions): void;
    endFrame(): void;
    get inFrame(): boolean;
    /**
     * 在上一帧的基础上再开一个通道（画到另一个目标、或做后处理）。
     * 必须在 `beginFrame()` 之后调用。
     */
    beginPass(options?: FrameOptions): void;
    /** 取出（必要时创建）本帧第一个 render pass 的 GPU 计时写入点。 */
    private timestampWritesForPass;
    /**
     * 「画到离屏 target」与「画到 canvas」走同一段代码，只是附件来源不同。
     *
     * 两条路径都返回同一形状的 {@link RenderPassDescriptor}（colorAttachments + depthStencilAttachment），
     * 所以深度附件不会被某一条路径漏掉 —— 之前的缺陷正是「画布路径自己拼 color attachment、
     * 从不传 depth attachment」，于是后端的状态解析器如实关掉了 DEPTH_TEST。
     */
    private createPassDescriptor;
    /** 绘制一个几何体。 */
    draw(geometry: Geometry, options?: DrawOptions): void;
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
    private acquirePipeline;
    /**
     * 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。
     *
     * 这里**不再**调用 `camera.update()`：相机矩阵每帧只需要算一次（见 {@link updateCamera}）。
     * 原先每 draw 都重算 lookAt + 两套 perspective + 一次乘法，40k draw 的场景下光这一步就是
     * 几十毫秒/帧的纯 CPU 开销，而且结果完全一样。
     */
    private applyCameraUniforms;
    /**
     * 按当前画布宽高比与后端深度约定刷新相机矩阵。
     *
     * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
     * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
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