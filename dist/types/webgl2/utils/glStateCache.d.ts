/**
 * GL 状态缓存：避免每帧重复调用同一个 `gl.*` 设置。
 *
 * 为什么值得做：WebGL 每次状态调用都要过一遍 JS→WebGL 绑定层的校验，一次 draw 前动辄十几次
 * `enable`/`disable`/`blendFunc`，在 draw call 上千的场景里这是实打实的开销。
 *
 * 使用时必须注意：**通过 `device.native` 从外部改动 GL 状态后要调用 {@link GlStateCache.invalidate}**，
 * 否则缓存会与实际状态不一致（这是本层唯一无法自动兜住的情况）。
 */
export interface UniformBufferBinding {
    buffer: WebGLBuffer | null;
    /** `size === -1` 表示使用 `bindBufferBase`（整块绑定）。 */
    offset: number;
    size: number;
}
export declare class GlStateCache {
    private readonly gl;
    private program;
    private vertexArray;
    private activeUnit;
    private readonly textures;
    private readonly samplers;
    private readonly uniformBuffers;
    private arrayBuffer;
    private copyReadBuffer;
    private copyWriteBuffer;
    private indexBuffer;
    private blendSignature;
    private blendConstant;
    private colorMask;
    private depthEnabled;
    private depthWrite;
    private depthFunc;
    private depthBias;
    private stencilEnabled;
    private stencilReference;
    private cullEnabled;
    private cullFace;
    private frontFace;
    private scissorEnabled;
    private viewport;
    private scissor;
    /** `UNIFORM_BUFFER_OFFSET_ALIGNMENT` 的记忆值（设备常量，见同名方法）。 */
    private uniformAlignment;
    constructor(gl: WebGL2RenderingContext);
    /** GL 上下文（便于调用方在需要时直接操作）。 */
    get context(): WebGL2RenderingContext;
    /**
     * `UNIFORM_BUFFER_OFFSET_ALIGNMENT`（动态偏移的对齐要求）。
     *
     * 它是**设备常量**，但 `getParameter` 是一次同步的 GL 查询：每 draw 每个动态 uniform block
     * 都问一次，在几千 draw 的场景里就是几千次同步查询。这里按 context 记一次。
     */
    uniformBufferOffsetAlignment(): number;
    /**
     * 把全部缓存标记为未知，下一次设置会无条件写回 GL。
     * 外部通过 `device.native` 改过状态、或切换了 framebuffer 之后都应调用它。
     */
    invalidate(): void;
    useProgram(program: WebGLProgram | null): void;
    /**
     * 只把 buffer 绑定相关的缓存标记为未知。
     *
     * 用在「直接改动了 `ELEMENT_ARRAY_BUFFER` 绑定」的场合 —— 该绑定是 VAO 状态的一部分，
     * 构建 VAO 时必须直接调 GL，之后缓存里记录的绑定就不再可信。
     */
    invalidateBufferBindings(): void;
    bindVertexArray(vertexArray: WebGLVertexArrayObject | null): void;
    /**
     * 在「默认 VAO」上执行一段操作，结束后恢复原来绑定的 VAO。
     *
     * 为什么需要它：`ELEMENT_ARRAY_BUFFER` 的绑定是 **VAO 状态**的一部分（见 {@link bindIndexBuffer}）。
     * 给索引缓冲分配空间 / 上传数据 / 读回数据时都必须先绑到 `ELEMENT_ARRAY_BUFFER`，
     * 如果直接在当前 VAO 上绑定，就会悄悄改掉那个 VAO 记录的索引缓冲，
     * 之后的 draw 会拿错误的索引去解引用顶点。
     *
     * 这里不动 `state.vertexArray` 之外的状态：结束时会把它恢复成进入前的值，
     * 并把缓冲绑定缓存作废，所以缓存与实际 GL 状态始终一致。
     */
    withDefaultVertexArray<T>(action: () => T): T;
    /** 绑定 `ARRAY_BUFFER`（顶点属性与 `bufferSubData` 上传都走它）。 */
    bindArrayBuffer(buffer: WebGLBuffer | null): void;
    /** 绑定 `ELEMENT_ARRAY_BUFFER`（会被 VAO 记录，所以绑定 VAO 后必须重新调用）。 */
    bindIndexBuffer(buffer: WebGLBuffer | null): void;
    bindCopyReadBuffer(buffer: WebGLBuffer | null): void;
    bindCopyWriteBuffer(buffer: WebGLBuffer | null): void;
    /** 切换当前激活的纹理单元。 */
    activeTexture(unit: number): void;
    /** 把纹理绑到指定单元；同一个单元重复绑定同一纹理会被跳过。 */
    bindTexture(unit: number, target: number, texture: WebGLTexture | null): void;
    /** 把 sampler 对象绑到指定单元（WebGL2 的 sampler 对象承载采样参数）。 */
    bindSampler(unit: number, sampler: WebGLSampler | null): void;
    /** 绑定 uniform block：`size < 0` 用 `bindBufferBase`，否则用 `bindBufferRange`。 */
    bindUniformBuffer(index: number, buffer: WebGLBuffer | null, offset?: number, size?: number): void;
    /** 清掉某个 binding 点的 uniform buffer 记录（缓冲区被销毁时调用）。 */
    forgetUniformBuffer(buffer: WebGLBuffer): void;
    /** 忘掉 `ELEMENT_ARRAY_BUFFER` 的记录（索引缓冲被销毁时调用）。 */
    forgetIndexBuffer(buffer: WebGLBuffer): void;
    /** 忘掉某个纹理的所有单元记录（纹理被销毁时调用）。 */
    forgetTexture(texture: WebGLTexture): void;
    /**
     * 设置混合状态。参数是 GL 枚举（由 `glEnumMap` 翻译得到）。
     * 用一条签名字符串做比较，避免为每个字段单独维护缓存。
     */
    setBlend(enabled: boolean, colorSrc: number, colorDst: number, colorOp: number, alphaSrc: number, alphaDst: number, alphaOp: number): void;
    setBlendConstant(color: readonly [number, number, number, number]): void;
    setColorMask(mask: readonly [boolean, boolean, boolean, boolean]): void;
    /**
     * 设置深度测试。
     *
     * `bias` 的顺序是 `[slopeScale, constant, clamp]`，对应 WebGPU 的
     * `depthBiasSlopeScale` / `depthBias` / `depthBiasClamp`。GL 没有 clamp 的对应概念，
     * 因此 `clamp` 在 WebGL2 后端会被忽略（这是已知差异，不影响绝大多数用法）。
     */
    setDepthTest(enabled: boolean, write: boolean, func: number, bias?: readonly [number, number, number]): void;
    setStencilTest(enabled: boolean, reference: number): void;
    setCull(enabled: boolean, face: number, frontFace: number): void;
    setViewport(x: number, y: number, width: number, height: number): void;
    setScissor(enabled: boolean, x: number, y: number, width: number, height: number): void;
    /** 当前生效的 program（未设置时为 `null`）。 */
    get currentProgram(): WebGLProgram | null;
    /** 当前生效的顶点数组对象。 */
    get currentVertexArray(): WebGLVertexArrayObject | null;
}
//# sourceMappingURL=glStateCache.d.ts.map