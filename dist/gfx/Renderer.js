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
import { ValidationError } from '../core/errors/ValidationError.js';
import { createDeviceWithAdapter } from '../factories/createDevice.js';
import { createLogger } from '../utils/logger.js';
import { mat3, mat4, vec3 } from '../utils/math/index.js';
import { createCompilationInfo, createCompilationMessage, nowMs, } from '../core/pipeline/CompilationInfo.js';
import { prewarmWebGL2RenderPipeline } from '../webgl2/pipeline/Prewarm.js';
import { prewarmWebGPURenderPipeline } from '../webgpu/pipeline/Prewarm.js';
import { Material, defineMaterial } from './Material.js';
import { Geometry } from './Geometry.js';
import { GfxTexture } from './Texture.js';
import { UniformArenaPool } from './UniformArena.js';
import { FrustumCuller } from './Culling.js';
import { sortDraws } from './DrawSort.js';
import { GPU_TIMING_FEATURE, GpuTiming, describeGpuTimingFailure, } from './GpuTiming.js';
import { unwrapUniforms } from './Uniforms.js';
/**
 * 共享的单位矩阵：`draw()` 没给 `options.model` 时写它。
 *
 * 它只会被 `UniformValues.set()` 拷进 uniform buffer，从不暴露给调用方，所以整个进程共用
 * 一份是安全的 —— 而每 draw `mat4.create()` 会白白产生 40k 个 Float32Array(16)/帧。
 */
const IDENTITY_MAT4 = mat4.create();
/** 已有管线的材质被跳过时给调用方的说明（`prewarm()` 的结果里会带它）。 */
const SKIPPED_PREWARM_REASON = 'the pipeline of this material was already built; prewarm skipped it so the compiled program is reused as-is';
export class Renderer {
    backend;
    device;
    context;
    canvas;
    logger;
    camera;
    arenaPool;
    materials = new Map();
    geometries = new Set();
    textures = new Set();
    bindGroups = new Map();
    statsValue = {
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
    gpuTimingValue = null;
    /** 打开 GPU 计时失败的原因；供 `gpuTiming.error` 与诊断使用。 */
    gpuTimingError = null;
    _clearColor;
    _pixelRatio;
    _width;
    _height;
    _inFrame = false;
    /** 渲染进纹理时的行序策略；见 {@link RendererOptions.rowOrder}。 */
    _rowOrder = 'unified';
    /**
     * **当前通道**是否需要把相机投影在裁剪空间 Y 取反（并在同一通道内翻转 `frontFace`）。
     *
     * 由 `beginFrame()` / `beginPass()` 按该通道的附件决定：附件来自离屏目标且该目标原生行序是
     * `'bottomUp'`、同时 `rowOrder === 'unified'` 时为 true。它是**逐通道**的状态 ——
     * 切回画布通道时会被重新算成 false，于是下一个 draw 用的又是没翻过的那条管线。
     */
    passFlipsRows = false;
    /** `passFlipsRows` 为 true 时用的翻转后投影矩阵（暂存，避免每 draw 分配）。 */
    flippedProjectionMatrix = mat4.create();
    /** `passFlipsRows` 为 true 时用的翻转后投影视图矩阵（暂存）。 */
    flippedProjectionViewMatrix = mat4.create();
    encoder = null;
    pass = null;
    commandBuffers = [];
    currentMaterial = null;
    /** 上一次 draw 用的管线，用来统计真正的「管线切换」次数（每个通道开头清空）。 */
    currentPipeline = null;
    defaultTexture = null;
    frameStart = 0;
    /** 计算法线矩阵时复用的暂存区，避免每帧分配。 */
    normalMatrixScratch = mat3.create();
    /** 排序时算「包围球中心的世界坐标」用的暂存区。 */
    sortPointScratch = vec3.create();
    /** 视锥剔除器：`updateCamera()` 里按当帧矩阵刷新。 */
    culler = new FrustumCuller();
    _culling;
    _sortMode;
    /** 排序模式下本通道待提交的绘制。 */
    pending = [];
    nextPipelineId = 1;
    /**
     * 纹理 bind group → 排序序号。
     *
     * 用对象身份而不是拼字符串：排序键必须在每 draw 上是 O(1) 的，拼 `${name}|${id},${id}` 会
     * 在每个 draw 上产生一个短命字符串 —— 那正好是排序想省掉的开销。
     */
    textureGroupIds = new Map();
    nextTextureGroupId = 1;
    _disposed = false;
    constructor(init) {
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
        this._rowOrder = init.options.rowOrder ?? 'unified';
        this.arenaPool = new UniformArenaPool(init.device);
    }
    /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
    static async create(options) {
        const logger = options.logger ?? createLogger('gpu-device-api/gfx');
        // `contextAttributes` 是逃生口：用户给了就以用户为准（逐字段覆盖），否则用上面几个选项推导。
        const contextAttributes = {
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
        const canvasSampleCount = options.sampleCount ?? (created.backend === 'webgpu' && (options.antialias ?? true) ? 4 : undefined);
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
        if (options.pixelRatio)
            renderer.setPixelRatio(options.pixelRatio);
        renderer.resize();
        if (options.gpuTiming) {
            // 失败不抛：这是一条「尽力而为」的路径，原因记在 renderer.gpuTiming.error 里。
            try {
                renderer.enableGpuTiming(typeof options.gpuTiming === 'object' ? options.gpuTiming : {});
            }
            catch (error) {
                renderer.gpuTimingError = describeGpuTimingFailure(error);
                logger.warn(`GPU 计时不可用：${renderer.gpuTimingError}`);
            }
        }
        return renderer;
    }
    /* ------------------------------------------------------------------ 尺寸 ------------------- */
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get pixelRatio() {
        return this._pixelRatio;
    }
    /** 宽高比（相机常用）。 */
    get aspect() {
        return this._height === 0 ? 1 : this._width / this._height;
    }
    get clearColor() {
        return this._clearColor;
    }
    setClearColor(color) {
        this._clearColor = color;
    }
    setPixelRatio(ratio) {
        this._pixelRatio = ratio;
        this.context.setPixelRatio(ratio);
        this.context.resize();
        this.syncSize();
    }
    /** 按 CSS 尺寸重新设置后备缓冲大小。 */
    setSize(width, height, updateStyle = true) {
        this.context.setSize(width, height, updateStyle);
        this.syncSize();
    }
    /** 重新读取 canvas 尺寸；返回是否发生变化。 */
    resize() {
        const changed = this.context.resize();
        this.syncSize();
        return changed;
    }
    syncSize() {
        this._width = this.context.width;
        this._height = this.context.height;
    }
    /* ------------------------------------------------------------------ 相机 ------------------- */
    setCamera(camera) {
        this.camera = camera;
        // 立刻按当前宽高比/后端约定刷新一次，免得第一次 draw 用到的是别处留下的矩阵。
        this.updateCamera();
    }
    /* ------------------------------------------------------------------ 资源 ------------------- */
    createGeometry(desc) {
        const geometry = Geometry.create(this.device, desc);
        this.geometries.add(geometry);
        return geometry;
    }
    /** 创建（或直接登记）一个材质。 */
    createMaterial(material) {
        const resolved = material instanceof Material ? material : defineMaterial(material);
        if (!this.materials.has(resolved)) {
            this.materials.set(resolved, {
                material: resolved,
                layout: resolved.createPipelineLayout(this.device),
                pipeline: null,
                pipelineFlipped: null,
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
    createTexture(desc) {
        const texture = GfxTexture.create(this.device, desc);
        this.textures.add(texture);
        return texture;
    }
    /** 当前设置的材质（`draw()` 未显式指定时使用）。 */
    setMaterial(material) {
        this.currentMaterial = material;
        if (material)
            this.createMaterial(material);
    }
    /**
     * 渲染进纹理时的行序策略；默认 `'unified'`（本层自动统一，见 {@link RendererOptions.rowOrder}）。
     *
     * 改完在**下一个通道**生效（`beginFrame()` / `beginPass()` 会重新判定），当前通道不受影响。
     */
    get rowOrder() {
        return this._rowOrder;
    }
    set rowOrder(value) {
        this._rowOrder = value;
    }
    get material() {
        return this.currentMaterial;
    }
    get stats() {
        return this.statsValue;
    }
    /* ------------------------------------------------------- 剔除 / 排序 ------------------------ */
    /** 是否开启视锥剔除（默认开）。打开时立刻按当前相机刷新一次视锥。 */
    get culling() {
        return this._culling;
    }
    set culling(value) {
        this._culling = value;
        // 刚打开时 culler 可能还没初始化过（之前一直是关的），先按当前相机构造一次。
        if (value)
            this.updateCamera();
    }
    /** 是否已经有一个可用的视锥（相机存在、且剔除开着时才会是 true）。 */
    get cullingReady() {
        return this._culling && this.camera !== null && this.culler.ready;
    }
    /** 当前排序模式。 */
    get sortMode() {
        return this._sortMode;
    }
    set sortMode(value) {
        if (value === this._sortMode)
            return;
        // 切到 'none' 之前先把已经排队的绘制按当前模式提交掉，免得它们被忘在队列里。
        this.flushPending();
        this._sortMode = value;
    }
    /* ------------------------------------------------------------------ GPU 计时 --------------- */
    /** 当前后端 + 设备是否具备 GPU 计时能力（不创建设备资源，可先判断再决定要不要开）。 */
    get supportsGpuTiming() {
        return GpuTiming.isAvailable(this.device);
    }
    /**
     * GPU 计时状态。默认 `enabled: false`。
     *
     * 读 `gpuFrameTimeMs` 拿到最近一次成功读回的 GPU 帧耗时（毫秒），`samples` / `skipped`
     * 说明样本数量与跳过的读回次数；失败原因在 `error` 里。
     */
    get gpuTiming() {
        if (this.gpuTimingValue)
            return this.gpuTimingValue.stats;
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
     * 显式调用时**失败就抛错**，而且**在启用时就抛**（带 `[gpu-device-api] ` 前缀的英文消息，
     * 说明缺哪个 feature / 缺哪个方法 / 缺哪个扩展）—— 这正是本次修复的一个要点：以前的判定只看
     * 特性标志，会把「启用了 `timestamp-query` 但实现没暴露 `GPUCommandEncoder.writeTimestamp()`」
     * 的设备判成可用，于是异常拖到第一次记时间戳时才炸（那一炸在帧循环里，整页渲染跟着挂）。
     * 想让失败静默降级请用 `Renderer.create({ gpuTiming: true })`（它会把原因写进 `gpuTiming.error`）。
     *
     * 实现方式是环形 query set + 延迟若干帧的异步读回，**不会每帧阻塞等待 GPU**；
     * 详见 `GpuTiming` 的说明。
     */
    enableGpuTiming(options = {}) {
        if (this.gpuTimingValue)
            return;
        const timing = new GpuTiming(this.device, options);
        this.gpuTimingValue = timing;
        this.gpuTimingError = null;
    }
    /** 关闭 GPU 计时并释放 query set。 */
    disableGpuTiming() {
        const timing = this.gpuTimingValue;
        this.gpuTimingValue = null;
        this.statsValue.gpuFrameTime = null;
        if (!timing)
            return;
        try {
            timing.destroy();
        }
        catch (error) {
            // 释放失败不上抛：调用方要的是「关掉」，关掉这件事已经完成了。
            this.logger.warn(`释放 GPU 计时资源失败：${describeGpuTimingFailure(error)}`);
        }
    }
    /**
     * 跑一步 GPU 计时调用；失败就**自动关掉计时、记下原因、渲染继续**。
     *
     * 为什么必须这样包：GPU 计时是**可选**的性能分析能力，它的任何失败都不该让渲染/页面失败。
     * 实测的事故正好相反 —— 设备启用了 `timestamp-query` 却没暴露 `writeTimestamp`，写时间戳抛出的
     * 异常逃进帧循环，`examples/gfx-benchmark.html` 整页 fail（连带 CPU 那几列也一起没了）。
     * 所以这里把失败降级成：`enabled: false` + `error`（可读）+ `stats.gpuFrameTime = null`，
     * 同时释放 query set；本帧与后续帧照常渲染，只是不再有 GPU 数据。
     */
    runGpuTimingStep(step) {
        const timing = this.gpuTimingValue;
        if (!timing)
            return;
        try {
            step(timing);
        }
        catch (error) {
            this.disableGpuTimingAfterFailure(timing, error);
        }
    }
    /** 运行中失败后的降级收尾（见 {@link Renderer.runGpuTimingStep}）；绝不抛。 */
    disableGpuTimingAfterFailure(timing, error) {
        this.gpuTimingValue = null;
        this.gpuTimingError = describeGpuTimingFailure(error);
        this.statsValue.gpuFrameTime = null;
        try {
            timing.destroy();
        }
        catch (cleanupError) {
            // 这时已经有失败原因了；清理再出错只记日志，绝不让它把帧循环搞挂。
            this.logger.warn(`释放 GPU 计时资源时又失败了一次：${describeGpuTimingFailure(cleanupError)}`);
        }
        this.logger.warn(`GPU 计时在运行中失败，已自动关闭（渲染继续）：${this.gpuTimingError}`);
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
    async prewarm(options = {}) {
        const started = nowMs();
        const requested = options.materials ?? [...this.materials.keys()];
        const passOptions = options.target ? { target: options.target } : {};
        // 与绘制时同一个判定：画进「自下而上」的离屏目标时，管线要的是绕序翻转的那一条。
        const flipsWinding = this.flipsRowsFor(passOptions);
        const prewarmOptions = {
            ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
            ...(options.throwOnError !== undefined ? { throwOnError: options.throwOnError } : {}),
        };
        const results = [];
        let variant = null;
        let prewarmed = 0;
        let skipped = 0;
        let failed = 0;
        for (const material of requested) {
            const state = this.materialState(material);
            // 已经建过**这一种绕序**的管线：跳过，不重复预热（再热一次不会更快，只会白建一条）。
            // 注意画布通道与离屏通道要的是两条不同的管线，所以这里按 `flipsWinding` 分别判断。
            const existing = flipsWinding ? state.pipelineFlipped : state.pipeline;
            if (existing) {
                skipped += 1;
                results.push(await this.skippedPrewarmResult(state, existing));
                continue;
            }
            const descriptor = this.pipelineDescriptorFor(state, flipsWinding);
            const materialVariant = this.pipelineVariantFor(descriptor, passOptions);
            variant ??= materialVariant;
            const outcome = this.backend === 'webgl2'
                ? await prewarmWebGL2RenderPipeline(this.device, descriptor, prewarmOptions)
                : await prewarmWebGPURenderPipeline(this.device, descriptor, materialVariant, prewarmOptions);
            /*
             * 把 helper 返回的管线存回材质状态：绘制时 `acquirePipeline()` 直接复用它，
             * 编译成果（WebGPU 的 variant 缓存 / WebGL2 的 program 缓存）才不会被丢掉。
             * 失败时 `outcome.pipeline` 是 null，状态保持为空 —— 之后 `draw()` 会照常自己建一条。
             */
            if (outcome.pipeline) {
                if (flipsWinding)
                    state.pipelineFlipped = outcome.pipeline;
                else
                    state.pipeline = outcome.pipeline;
            }
            if (outcome.ok)
                prewarmed += 1;
            else
                failed += 1;
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
    async compilationInfo(material) {
        const state = this.materialState(material);
        const existing = state.pipeline ?? state.pipelineFlipped;
        if (existing)
            return this.readCompilationInfo(existing);
        const report = await this.prewarm({ materials: [material] });
        return report.results[0].info;
    }
    /** 由逐条明细汇总出的整体结论（`mode` / `reason` / `ok` 的口径见各自的类型注释）。 */
    summarizePrewarm(results, prewarmed, skipped, failed) {
        const attempted = results.filter((result) => !result.skipped);
        let mode = null;
        if (attempted.length > 0) {
            mode = attempted.every((result) => result.mode === 'async') ? 'async' : 'sync';
        }
        // 失败优先于降级：调用方最需要先看到的是「为什么没成功」，而不是「为什么不是异步」。
        const failedReason = attempted.find((result) => !result.ok && result.reason !== null)?.reason ?? null;
        const syncReason = mode === 'sync' ? (attempted.find((result) => result.mode === 'sync')?.reason ?? null) : null;
        return { mode, reason: failedReason ?? syncReason, ok: failed === 0, prewarmed, skipped, failed };
    }
    /** 已建过管线时的结果：不重新预热，只把诊断读回来（结果形状与真预热一致）。 */
    async skippedPrewarmResult(state, pipeline) {
        const started = nowMs();
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
    async readCompilationInfo(pipeline) {
        if (typeof pipeline.getCompilationInfo === 'function')
            return pipeline.getCompilationInfo();
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
    beginFrame(options = {}) {
        if (this._inFrame)
            this.endFrame();
        this.frameStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.resize();
        this.arenaPool.beginFrame();
        // 相机矩阵每帧只算一次（宽高比/深度约定都依赖帧状态，所以放在这里最合适）。
        this.updateCamera();
        this.encoder = this.device.createCommandEncoder({ label: 'gfx-frame' });
        // WebGPU 走 encoder 级时间戳：它只需要 `timestamp-query`，而 pass 内的 timestampWrites
        // 还需要 `timestamp-query-inside-passes`（Chrome 默认不开）。WebGL2 是空操作，
        // 它的计时由下面 pass 的 timestampWrites 包住整个通道。
        // 写时间戳这一步即使在运行中失败也不会让本帧失败：见 runGpuTimingStep（失败即自动关闭计时）。
        this.runGpuTimingStep((timing) => timing.beforeFrame(this.encoder));
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
        // 本通道要不要翻行序（只看附件来自哪里，与后面的 draw 用什么材质无关）。
        this.passFlipsRows = this.flipsRowsFor(options);
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
    endFrame() {
        if (!this._inFrame)
            return;
        // 排序模式下这里才真正把本帧的 draw 提交出去（见 draw() 的说明）。
        this.flushPending();
        this.pass?.end();
        const encoder = this.encoder;
        if (encoder) {
            // WebGPU 的「帧结束」时间戳：必须在所有 pass 都 end() 之后、finish() 之前写。
            this.runGpuTimingStep((timing) => timing.afterFrameEncoding(encoder));
            this.commandBuffers.push(encoder.finish());
        }
        if (this.commandBuffers.length > 0)
            this.device.queue.submit(this.commandBuffers);
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.statsValue.frameTime = now - this.frameStart;
        // 提交之后才安排读回：队列顺序保证它看到的时间戳已经写入（见 GpuTiming）。
        if (this.gpuTimingValue) {
            this.runGpuTimingStep((timing) => timing.onFrameSubmitted());
            // 上一步失败时计时已经被关掉、`gpuFrameTime` 已被清成 null，所以这里用 `?.` 收口。
            this.statsValue.gpuFrameTime = this.gpuTimingValue?.stats.gpuFrameTimeMs ?? null;
        }
        this.pass = null;
        this.encoder = null;
        this.commandBuffers = [];
        this._inFrame = false;
    }
    get inFrame() {
        return this._inFrame;
    }
    /* ------------------------------------------------------------------ 绘制 ------------------- */
    /**
     * 在上一帧的基础上再开一个通道（画到另一个目标、或做后处理）。
     * 必须在 `beginFrame()` 之后调用。
     */
    beginPass(options = {}) {
        if (!this._inFrame) {
            throw new ValidationError('[gpu-device-api] beginPass() 只能在 beginFrame() 之后调用。');
        }
        // 上一个通道里排队的绘制必须先在旧通道里提交，不能漂到新通道去。
        this.flushPending();
        this.pass?.end();
        const encoder = this.encoder;
        const descriptor = this.createPassDescriptor(options, options.color ?? this._clearColor);
        if (!descriptor.colorAttachments[0]?.view) {
            throw new ValidationError('[gpu-device-api] 当前通道没有颜色附件。');
        }
        // 逐通道重判：切回 canvas 通道时这里会回到 false，于是下一个 draw 又用没翻过的那条管线
        // （`frontFace` 也随之恢复，见 `acquirePipeline()`）。
        this.passFlipsRows = this.flipsRowsFor(options);
        this.pass = encoder.beginRenderPass({
            label: 'gfx-pass',
            colorAttachments: descriptor.colorAttachments,
            ...(descriptor.depthStencilAttachment ? { depthStencilAttachment: descriptor.depthStencilAttachment } : {}),
        });
        // 新通道开始时管线状态要重新绑定，所以第一个 draw 记作一次切换。
        this.currentPipeline = null;
    }
    /**
     * 取出（必要时创建）本帧第一个 render pass 的 GPU 计时写入点。
     *
     * 取写入点这一步失败同样降级（见 {@link Renderer.runGpuTimingStep}），**通道照常开**：
     * 只是这一帧不带时间戳，绝不能让「拿不到计时」变成「这一帧画不出来」。
     */
    timestampWritesForPass() {
        let writes;
        this.runGpuTimingStep((timing) => {
            writes = timing.passTimestampWrites();
        });
        return writes ? { timestampWrites: writes } : {};
    }
    /**
     * 「画到离屏 target」与「画到 canvas」走同一段代码，只是附件来源不同。
     *
     * 两条路径都返回同一形状的 {@link RenderPassDescriptor}（colorAttachments + depthStencilAttachment），
     * 所以深度附件不会被某一条路径漏掉 —— 之前的缺陷正是「画布路径自己拼 color attachment、
     * 从不传 depth attachment」，于是后端的状态解析器如实关掉了 DEPTH_TEST。
     */
    createPassDescriptor(options, clearColor) {
        const clear = {
            loadOp: options.load ? 'load' : 'clear',
            storeOp: 'store',
            clearValue: clearColor,
            depthLoadOp: options.load ? 'load' : 'clear',
            depthClearValue: options.depth ?? 1,
        };
        return options.target ? options.target.createPassDescriptor(clear) : this.context.createPassDescriptor(clear);
    }
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
    flipsRowsFor(options) {
        if (this._rowOrder !== 'unified')
            return false;
        return options.target?.rowOrder === 'bottomUp';
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
    draw(geometry, options = {}) {
        if (!this._inFrame || !this.pass) {
            throw new ValidationError('[gpu-device-api] draw() 必须在 beginFrame() ... endFrame() 之间调用。');
        }
        const material = options.material ?? this.currentMaterial;
        if (!material) {
            throw new ValidationError('[gpu-device-api] draw() 之前必须先 setMaterial()，或在 draw() 里传 material。');
        }
        const state = this.materialState(material);
        geometry.validateAgainst(material.attributes, material.name);
        this.assertInstanceCount(geometry, options.instances);
        if (this.isCulled(geometry, options.model))
            return;
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
    isCulled(geometry, model) {
        if (!this._culling)
            return false;
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
    enqueueDraw(geometry, material, state, options) {
        const textureGroup = material.textures.length > 0 ? this.acquireTextureBindGroup(material, options.textures ?? {}) : null;
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
    flushPending() {
        const items = this.pending;
        if (items.length === 0)
            return;
        try {
            sortDraws(items, this._sortMode);
            for (const item of items) {
                this.submitDraw(item.geometry, item.material, item.state, item.options);
            }
        }
        finally {
            // 提交中途抛错也要清队列：留着它只会在下一帧重复画出错的东西。
            items.length = 0;
        }
    }
    /** 真正把一次绘制写进命令缓冲。`draw()` 与排序队列的 flush 都走这里。 */
    submitDraw(geometry, material, state, options) {
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
                state.values.set('model', (options.model ?? IDENTITY_MAT4));
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
            if (group)
                this.pass.setBindGroup(material.textureGroup, group);
        }
        /* ---- 顶点与索引 ------------------------------------------------------------------------ */
        for (const attribute of material.attributes) {
            const provided = geometry.attributes.get(attribute.name);
            this.pass.setVertexBuffer(attribute.location, provided.buffer, 0, provided.buffer.size);
        }
        if (geometry.indexBuffer && geometry.indexFormat) {
            this.pass.setIndexBuffer(geometry.indexBuffer, geometry.indexFormat, 0, geometry.indexBuffer.size);
            this.pass.drawIndexed({
                indexCount: options.count ?? geometry.indexCount,
                ...(options.first !== undefined ? { firstIndex: options.first } : {}),
                ...(options.instances !== undefined ? { instanceCount: options.instances } : {}),
            });
        }
        else {
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
    drawInstanced(geometry, instances, options = {}) {
        this.draw(geometry, { ...options, instances });
    }
    /**
     * 实例数与几何体提供的实例数据是否匹配。
     *
     * 实例属性的元素个数就是「最多能画多少个实例」：要多了，WebGL2 会静默地读到缓冲区之外的数据
     *（画面出错但不报错），WebGPU 会在 draw 时报校验错误 —— 两种都不好定位，所以这里提前拦下。
     */
    assertInstanceCount(geometry, instances) {
        if (instances === undefined)
            return;
        if (!Number.isInteger(instances) || instances < 1) {
            throw new ValidationError(`[gpu-device-api] draw() 的 instances 必须是正整数，实际是 ${String(instances)}。`);
        }
        const available = geometry.instanceCount;
        if (available !== null && instances > available) {
            throw new ValidationError(`[gpu-device-api] 几何体「${geometry.label}」只提供了 ${available} 份实例数据，` +
                `但要画 ${instances} 个实例。请把实例属性（perInstance: true）的数据补足到 ${instances} 份。`);
        }
    }
    destroy() {
        if (this._disposed)
            return;
        this._disposed = true;
        if (this._inFrame)
            this.endFrame();
        this.gpuTimingValue?.destroy();
        this.gpuTimingValue = null;
        for (const state of this.materials.values()) {
            state.pipeline?.dispose();
            state.pipelineFlipped?.dispose();
            state.values = null;
        }
        this.materials.clear();
        this.pending.length = 0;
        this.textureGroupIds.clear();
        for (const group of this.bindGroups.values())
            group.dispose();
        this.bindGroups.clear();
        for (const geometry of this.geometries)
            geometry.destroy();
        this.geometries.clear();
        for (const texture of this.textures)
            texture.destroy();
        this.textures.clear();
        this.defaultTexture?.destroy();
        this.defaultTexture = null;
        this.arenaPool.destroy();
        this.context.dispose();
        this.device.dispose();
    }
    get disposed() {
        return this._disposed;
    }
    /* ------------------------------------------------------------------ 内部 ------------------- */
    /**
     * 登记（必要时）并取出一个材质的状态。
     *
     * `draw()` / `setMaterial()` / `prewarm()` / `compilationInfo()` 都走这里，
     * 「材质第一次出现时登记什么」只有一份实现。
     */
    materialState(material) {
        const existing = this.materials.get(material);
        if (existing)
            return existing;
        this.createMaterial(material);
        return this.materials.get(material);
    }
    /**
     * 取得（必要时创建）本通道该用的管线。
     *
     * 画布通道与「绕序翻转」的离屏通道各有一条，选择只看**当前通道**的 {@link Renderer.passFlipsRows}
     * —— 于是切回画布通道后第一个 draw 就会用回没翻过的那条，`frontFace` 随之恢复正确
     * （每条管线的固定功能状态在每个 draw 上都会重新下发，见 `WebGL2RenderPipeline.applyState`）。
     */
    acquirePipeline(state) {
        if (this.passFlipsRows) {
            state.pipelineFlipped ??= this.device.createRenderPipeline(this.pipelineDescriptorFor(state, true));
            return state.pipelineFlipped;
        }
        state.pipeline ??= this.device.createRenderPipeline(this.pipelineDescriptorFor(state, false));
        return state.pipeline;
    }
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
    pipelineDescriptorFor(state, flipWinding = false) {
        const descriptor = state.material.createPipelineDescriptor(this.device).descriptor;
        if (!flipWinding)
            return descriptor;
        const frontFace = (descriptor.primitive?.frontFace ?? 'ccw') === 'ccw' ? 'cw' : 'ccw';
        // 浅拷贝：`vertex` / `fragment` 等子对象与里面那份 `vertex.buffers` 数组保持同一个身份，
        // 预热报告与绘制路径核对 `vertexLayouts` 时仍然对得上。
        return { ...descriptor, primitive: { ...descriptor.primitive, frontFace } };
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
     *   或 `options.target`。`colorFormats` 是**逐位置**的（空位写 `null`），与 core 的
     *   `WebGPURenderPassLayout.colorFormats` 同一套语义。
     *
     * `sampleCount` 两个后端的解析口径不同，这里照抄各自的渲染通道解析器，而不是取「看起来对」的值：
     * WebGPU 取附件纹理的采样数（画布 MSAA 会体现在这里），WebGL2 取渲染目标声明的采样数、
     * canvas 路径恒为 1（见 `WebGL2RenderPassEncoder` 的 `variantShape`）。
     *
     * 附件的 `colorFormats` / `depthFormat` 对 WebGPU 是「variant 描述 target 的附件」，与管线自己
     * 是否使用深度无关（那是 `descriptor.depthStencil` 的事）—— 两处都按这个语义传。
     */
    pipelineVariantFor(descriptor, options) {
        const pass = this.createPassDescriptor(options, this._clearColor);
        /*
         * `RenderPassDescriptor` 允许某个颜色附件是 null（该 location 的输出被丢弃），而
         * `RenderPipelineVariant.colorFormats` 是**逐位置**的（下标即 fragment output location），
         * 所以这里逐个下标填：空位写 `null` 占住位置，而不是把它跳过。
         *
         * 跳过（压缩成密集列表）会让 `[view, null]` 与 `[null, view]` 推导出同一个变体 ——
         * 那正是批 05 实测到的「两条布局共用同一条原生管线」。core 的 pass 布局与这里必须
         * 用同一套语义，否则同一个通道在 gfx 路径与 core 路径下会解析成不同的变体。
         */
        const colorFormats = [];
        for (const attachment of pass.colorAttachments) {
            colorFormats.push(attachment ? this.attachmentFormat(attachment.view) : null);
        }
        const depthView = pass.depthStencilAttachment?.view ?? null;
        return {
            colorFormats,
            sampleCount: this.backend === 'webgl2' ? this.webgl2SampleCountFor(options) : this.webgpuSampleCountFor(pass),
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
    attachmentFormat(view) {
        return this.backend === 'webgpu' ? (view.descriptor.format ?? view.texture.format) : view.texture.format;
    }
    /** WebGPU 的 variant `sampleCount`：这个通道所有附件纹理的采样数（WebGPU 要求它们一致）。 */
    webgpuSampleCountFor(pass) {
        for (const attachment of pass.colorAttachments) {
            if (attachment)
                return attachment.view.texture.sampleCount;
        }
        return pass.depthStencilAttachment?.view.texture.sampleCount ?? 1;
    }
    /**
     * WebGL2 的 variant `sampleCount`：只有**画进多重采样渲染目标**时才是目标的采样数，
     * 其余情况（含 canvas 默认帧缓冲）是 1 —— 与 `WebGL2RenderPassEncoder` 的
     * `this.renderTarget?.sampleCount ?? 1` 一致。
     */
    webgl2SampleCountFor(options) {
        return options.target ? options.target.sampleCount : 1;
    }
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
    applyCameraUniforms(values, material) {
        const camera = this.camera;
        if (!camera)
            return;
        const flip = this.passFlipsRows;
        if (material.uniforms?.has('projectionView')) {
            values.set('projectionView', (flip ? this.flippedProjectionViewMatrix : camera.projectionViewMatrix));
        }
        if (material.uniforms?.has('projection')) {
            values.set('projection', (flip ? this.flippedProjectionMatrix : camera.projectionMatrix));
        }
        if (material.uniforms?.has('view')) {
            values.set('view', camera.viewMatrix);
        }
        if (material.uniforms?.has('cameraPosition')) {
            values.set('cameraPosition', camera.position);
        }
    }
    /** 纹理 bind group 的排序序号（对象身份 → 小整数，只在第一次见到时分配）。 */
    textureGroupId(group) {
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
    depthOf(geometry, model) {
        const sphere = geometry.boundingSphere;
        const camera = this.camera;
        if (!sphere || !camera)
            return 0;
        const point = this.sortPointScratch;
        if (model)
            mat4.transformPoint(point, model, sphere.center);
        else
            vec3.copy(point, sphere.center);
        // view 矩阵是列主序：第 2 行（z 行）是 (m[2], m[6], m[10], m[14])。
        // 相机前方 z 为负，取负号让「越大越远」。
        const view = camera.viewMatrix;
        return -(view[2] * point[0] +
            view[6] * point[1] +
            view[10] * point[2] +
            view[14]);
    }
    /**
     * 按当前画布宽高比与后端深度约定刷新相机矩阵。
     *
     * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
     * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
     *
     * 这里同时刷新视锥（剔除要用 P × V）。
     */
    updateCamera() {
        const camera = this.camera;
        if (!camera) {
            this.culler.ready = false;
            return;
        }
        camera.aspect = this.aspect;
        // 两个后端的裁剪空间 z 约定不同，切换后端时投影矩阵要跟着换（相机自己不知道后端）。
        camera.depthRange = this.backend === 'webgpu' ? 'zo' : 'gl';
        camera.update();
        // 翻行序用的那两份矩阵跟着一起算：它们只依赖相机矩阵，而相机矩阵每帧只算这一次。
        // 无条件算（两次行取反）比在每个通道开头判断一次要便宜，也让 `applyCameraUniforms`
        // 永远是「取哪个字段」的纯选择，不再有隐藏状态。
        mat4.flipClipY(this.flippedProjectionMatrix, camera.projectionMatrix);
        mat4.flipClipY(this.flippedProjectionViewMatrix, camera.projectionViewMatrix);
        // 视锥用当帧的 P × V 与同一套深度约定：用错约定会把近处的物体误剔除。
        if (this._culling)
            this.culler.update(camera.projectionViewMatrix, camera.depthRange);
    }
    /**
     * 由当前 `model` 计算法线矩阵。
     *
     * 非等比缩放会破坏法线方向（法线不再垂直于表面），必须用「模型矩阵左上 3x3 的逆转置」。
     * 这里自动算好，材质只要声明了 `normalMatrix` 字段就能直接用。
     */
    updateNormalMatrix(values, material) {
        if (!material.uniforms?.has('normalMatrix') || !material.uniforms.has('model'))
            return;
        const model = values.get('model');
        const normalMatrix = mat3.normalFromMat4(this.normalMatrixScratch, model);
        if (!normalMatrix) {
            // 模型矩阵退化（某轴缩放为 0）时退回单位矩阵，避免把 NaN 送进着色器。
            mat3.identity(this.normalMatrixScratch);
        }
        values.set('normalMatrix', this.normalMatrixScratch);
    }
    setIfPresent(values, name, value) {
        if (!values.has(name))
            return;
        values.set(name, value);
    }
    /**
     * 取得（必要时创建）纹理的 bind group。
     *
     * 缓存键由「材质 + 每个槽位实际用的纹理 id」组成：同一个材质换纹理时才会重建，
     * 反复用同一组纹理绘制不会重复创建。没给纹理的槽位绑一张 1×1 的白色占位纹理，
     * 这样「忘了传纹理」的表现是白色而不是未定义数据。
     */
    acquireTextureBindGroup(material, overrides) {
        const layout = material.createTextureGroupLayout(this.device);
        if (!layout)
            return null;
        const resolved = material.textures.map((slot) => overrides[slot.name] ?? this.getDefaultTexture());
        const key = `${material.name}|${resolved.map((texture) => texture.id).join(',')}`;
        const cached = this.bindGroups.get(key);
        if (cached)
            return cached;
        const entries = material.textures.flatMap((slot, index) => {
            const texture = resolved[index];
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
    getDefaultTexture() {
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
function triangleCount(geometry, options) {
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
//# sourceMappingURL=Renderer.js.map