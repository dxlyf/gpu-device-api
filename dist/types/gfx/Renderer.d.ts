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
    beginFrame(options?: FrameOptions): void;
    endFrame(): void;
    get inFrame(): boolean;
    /**
     * 在上一帧的基础上再开一个通道（画到另一个目标、或做后处理）。
     * 必须在 `beginFrame()` 之后调用。
     */
    beginPass(options?: FrameOptions): void;
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
    /** 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。 */
    private applyCameraUniforms;
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