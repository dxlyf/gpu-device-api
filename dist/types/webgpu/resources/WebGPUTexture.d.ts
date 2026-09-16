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
import { WebGPUTextureView } from './WebGPUTextureView.js';
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
export declare class WebGPUTexture implements Texture {
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
    private readonly device;
    private readonly owned;
    private readonly extent;
    private readonly viewCache;
    private readonly viewList;
    /** 无参 `createView()` 的解析结果与 cache key：这是最常见的热路径，只需算一次。 */
    private defaultViewResolved;
    private defaultViewKey;
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
    private readonly mipPassCache;
    private _disposed;
    private constructor();
    /**
     * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
     *
     * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
     */
    static create(device: WebGPUDevice, descriptor: TextureDescriptor): WebGPUTexture;
    /**
     * 包住一个已经存在的原生 `GPUTexture`（例如 canvas 的帧纹理）。
     *
     * `owned` 为 `false` 时 `destroy()` 只标记本包装对象失效，不会销毁底层 texture。
     * 未提供的字段会直接从原生对象读取（canvas 帧纹理的尺寸/格式只能这样拿到）。
     */
    static adopt(device: WebGPUDevice, native: GPUTexture, descriptor?: Partial<ResolvedTextureDescriptor>, options?: {
        owned?: boolean;
    }): WebGPUTexture;
    get size(): Extent3D;
    get disposed(): boolean;
    /** 当前 texture 是否仍然可用。 */
    get usable(): boolean;
    /** 按 subresource 选择创建（并缓存）view。 */
    createView(descriptor?: TextureViewDescriptor): WebGPUTextureView;
    /** 目前已创建的 view；随 texture 一同释放。 */
    get views(): readonly TextureView[];
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
    generateMipmaps(): void;
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
    private acquireMipPass;
    /** 销毁 texture（`owned` 为 false 时只标记包装对象失效）。幂等。 */
    destroy(): void;
    /** `Disposable` 的别名。 */
    dispose(): void;
}
/** 该对象是否为 WebGPU 后端的 texture。 */
export declare function isWebGPUTexture(value: unknown): value is WebGPUTexture;
/** 原生 `GPUTexture` 的形状识别。 */
export declare function isNativeGPUTexture(value: unknown): value is GPUTexture;
/**
 * 把 core 的 `TextureLike`（命令层用的最小结构）收窄为原生 `GPUTexture`。
 *
 * 命令层刻意只依赖 `{ native?: unknown }`，因此后端必须在这里补上运行时收窄；
 * 收不到合适的原生对象时抛 {@link ValidationError}，避免把 WebGL2 的资源交给 WebGPU。
 */
export declare function asGPUTexture(value: unknown, context: string): GPUTexture;
//# sourceMappingURL=WebGPUTexture.d.ts.map