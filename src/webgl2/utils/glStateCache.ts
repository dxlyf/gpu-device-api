/**
 * GL 状态缓存：避免每帧重复调用同一个 `gl.*` 设置。
 *
 * 为什么值得做：WebGL 每次状态调用都要过一遍 JS→WebGL 绑定层的校验，一次 draw 前动辄十几次
 * `enable`/`disable`/`blendFunc`，在 draw call 上千的场景里这是实打实的开销。
 *
 * 使用时必须注意：**通过 `device.native` 从外部改动 GL 状态后要调用 {@link GlStateCache.invalidate}**，
 * 否则缓存会与实际状态不一致（这是本层唯一无法自动兜住的情况）。
 *
 * 它还替设备持有唯一一个**读回用的 framebuffer**（{@link GlStateCache.readbackFramebuffer}）：
 * 这个 GL 对象不属于任何用户资源，放在这里才能有明确的释放点（{@link GlStateCache.dispose}）。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';

export interface UniformBufferBinding {
  buffer: WebGLBuffer | null;
  /** `size === -1` 表示使用 `bindBufferBase`（整块绑定）。 */
  offset: number;
  size: number;
}

/**
 * 混合状态里**参与去重比较**的全部分量（GL 枚举），与 `ResolvedRenderState.blend` 同形。
 *
 * 它同时是 {@link GlStateCache.setBlend} 去重键的字段清单：下面的 {@link UncomparedBlendField}
 * 用 `keyof` 对它做编译期穷尽检查，所以「加了一个字段却忘了比较」不可能编译通过。
 */
export interface GlBlendState {
  readonly colorSrc: number;
  readonly colorDst: number;
  readonly colorOp: number;
  readonly alphaSrc: number;
  readonly alphaDst: number;
  readonly alphaOp: number;
}

/**
 * 编译期穷尽检查：{@link GlBlendState} 里**没有**参与 {@link GlStateCache.setBlend} 比较的字段。
 *
 * 必须是空集（`never`）。给 `GlBlendState`（以及别名为它的 `ResolvedBlendState`）加字段时，
 * 只要忘了在 `setBlend` 里比较，这里的类型就不再是 `never`，
 * {@link assertAllBlendFieldsCompared} 的调用会立刻编译失败。
 *
 * 为什么值得加这道编译期闸门：漏一个字段 = 状态被误判成「没变」而漏下发，症状是
 * 「换条管线之后画面偶尔不对」，没有异常也没有日志，只有像素是错的。
 */
type UncomparedBlendField = Exclude<
  keyof GlBlendState,
  'colorSrc' | 'colorDst' | 'colorOp' | 'alphaSrc' | 'alphaDst' | 'alphaOp'
>;

/**
 * 只用来承载编译期检查：类型参数必须满足 `never`，`UncomparedBlendField` 非空时调用不成立。
 * 函数体永远不执行（模块求值阶段调用一次，什么也不做）。
 */
function assertAllBlendFieldsCompared<T extends never>(): T | null {
  return null;
}

assertAllBlendFieldsCompared<UncomparedBlendField>();

/**
 * GL 枚举表示的单面模板状态：比较函数 + 三种操作。
 *
 * 正面与背面各有一份 —— GLES 3.0 的 `stencilFuncSeparate` / `stencilOpSeparate` 本来就支持
 * 两个面各自独立，与 WebGPU 的 `stencilFront` / `stencilBack` 一一对应。
 */
export interface GlStencilFaceState {
  /** `GL_COMPARE_FUNCS` 里的比较函数。 */
  readonly compare: number;
  /** 模板测试失败时执行的操作（`GL_STENCIL_OPS`）→ `stencilOpSeparate` 的第一个操作。 */
  readonly failOp: number;
  /** 模板通过、深度测试失败时执行的操作 → `stencilOpSeparate` 的第二个操作。 */
  readonly depthFailOp: number;
  /** 模板与深度都通过时执行的操作 → `stencilOpSeparate` 的第三个操作。 */
  readonly passOp: number;
}

/**
 * 一次完整的模板状态：开关 + 参考值 + 两个面各自的比较/操作 + 读写掩码。
 *
 * 参考值与两个掩码都是**单值**（两个面共用），这与 WebGPU 的 `setStencilReference()` /
 * `stencilReadMask` / `stencilWriteMask` 语义一致；GLES 3.0 同样是「比较函数与掩码按面传给
 * `stencilFuncSeparate`，而引用值全局只有一个」。
 */
export interface GlStencilState {
  enabled: boolean;
  /** `setStencilReference()` 给出的参考值。 */
  reference: number;
  front: GlStencilFaceState;
  back: GlStencilFaceState;
  /** 读掩码：与参考值和模板缓冲值相与之后再做比较。 */
  readMask: number;
  /** 写掩码：`stencilMaskSeparate` 的参数。 */
  writeMask: number;
}

export class GlStateCache {
  private readonly gl: WebGL2RenderingContext;

  private program: WebGLProgram | null = null;
  private vertexArray: WebGLVertexArrayObject | null = null;
  private activeUnit = -1;
  private readonly textures = new Map<number, { target: number; texture: WebGLTexture | null }>();
  private readonly samplers = new Map<number, WebGLSampler | null>();
  private readonly uniformBuffers = new Map<number, UniformBufferBinding>();
  private arrayBuffer: WebGLBuffer | null = null;
  private copyReadBuffer: WebGLBuffer | null = null;
  private copyWriteBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;

  /**
   * 上一次真正下发的混合状态。
   *
   * `blendEnabled === null` 表示**未知**（从未下发过）；`false` 表示已下发 `disable(BLEND)`。
   * 关闭时下面六个分量**不再有意义**（GL 在 `BLEND` 关闭期间不会读它们），所以比较时跳过；
   * 重新打开时 `enabled` 一定与上一次不同，于是会完整重下发 `enable` + `blendFuncSeparate` +
   * `blendEquationSeparate` —— 与改前用 `'0'` / `'1:...'` 两条不同签名得到的语义完全一致。
   */
  private blendEnabled: boolean | null = null;
  private blendColorSrc = 0;
  private blendColorDst = 0;
  private blendColorOp = 0;
  private blendAlphaSrc = 0;
  private blendAlphaDst = 0;
  private blendAlphaOp = 0;
  private blendConstant: [number, number, number, number] | null = null;
  private colorMask: [boolean, boolean, boolean, boolean] | null = null;

  private depthEnabled: boolean | null = null;
  private depthWrite: boolean | null = null;
  private depthFunc: number | null = null;
  private depthBias: [number, number, number] | null = null;

  private stencil: GlStencilState | null = null;

  private cullEnabled: boolean | null = null;
  private cullFace: number | null = null;
  private frontFace: number | null = null;
  private scissorEnabled: boolean | null = null;

  private viewport: [number, number, number, number] | null = null;
  private scissor: [number, number, number, number] | null = null;
  /**
   * 最近一次 {@link setScissor} 看到的「整个附件」的矩形（`0, 0, width, height`）。
   *
   * 存在的意义是让 {@link resetScissor} 能在**已经处于复位状态**时一次 GL 调用都不发：
   * 只要「开关已关」且「当前矩形就是这个尺寸的整个附件」，复位就是空操作。
   * 初值 `null` 表示还不知道 —— 那就老老实实下发。
   */
  private scissorWholeBox: [number, number, number, number] | null = null;
  /** `UNIFORM_BUFFER_OFFSET_ALIGNMENT` 的记忆值（设备常量，见同名方法）。 */
  private uniformAlignment: number | null = null;
  /**
   * `FRAMEBUFFER_BINDING` 的记忆值。
   *
   * 为什么要记它：framebuffer 绑定不属于上面任何一个缓存，所以过去只要有人绕过缓存切了它，
   * 就只能整体 {@link invalidate}，代价是下一次 draw 把 program / blend / depth / cull / VAO
   * 全部重下发一遍（见 {@link invalidateFramebufferBinding} 的说明）。
   *
   * 初值 `undefined` 表示**未知**，与 `null`（默认帧缓冲）是两回事：未知时会在第一次需要时
   * 用一次 `getParameter(FRAMEBUFFER_BINDING)` 问出来。
   */
  private framebufferBinding: WebGLFramebuffer | null | undefined = undefined;
  /**
   * 读回纹理时复用的 framebuffer（见 {@link readbackFramebuffer}）。
   *
   * 它不承载任何用户资源，也不属于 `FramebufferCache`（那是「附件组合」的缓存），
   * 所以由状态缓存代为持有、由 {@link dispose} 释放 —— 否则这个 GL 对象既不在设备资源表里，
   * 也没有任何一处会删它。
   */
  private readbackFramebufferValue: WebGLFramebuffer | null = null;
  /** 读回 framebuffer 上当前挂着哪个纹理、挂在哪个附着点（避免重复挂载同一个附件）。 */
  private readbackAttachment: { texture: WebGLTexture; attachment: number } | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /** GL 上下文（便于调用方在需要时直接操作）。 */
  get context(): WebGL2RenderingContext {
    return this.gl;
  }

  /**
   * `UNIFORM_BUFFER_OFFSET_ALIGNMENT`（动态偏移的对齐要求）。
   *
   * 它是**设备常量**，但 `getParameter` 是一次同步的 GL 查询：每 draw 每个动态 uniform block
   * 都问一次，在几千 draw 的场景里就是几千次同步查询。这里按 context 记一次。
   */
  uniformBufferOffsetAlignment(): number {
    if (this.uniformAlignment === null) {
      const value = this.gl.getParameter(this.gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT) as number | null;
      this.uniformAlignment = Number(value ?? 0) || 0;
    }
    return this.uniformAlignment;
  }

  /**
   * 把全部缓存标记为未知，下一次设置会无条件写回 GL。
   * 外部通过 `device.native` 改过状态、或切换了 framebuffer 之后都应调用它。
   */
  invalidate(): void {
    this.program = null;
    this.vertexArray = null;
    this.activeUnit = -1;
    this.textures.clear();
    this.samplers.clear();
    this.uniformBuffers.clear();
    this.arrayBuffer = null;
    this.copyReadBuffer = null;
    this.copyWriteBuffer = null;
    this.indexBuffer = null;
    this.blendEnabled = null;
    this.blendColorSrc = 0;
    this.blendColorDst = 0;
    this.blendColorOp = 0;
    this.blendAlphaSrc = 0;
    this.blendAlphaDst = 0;
    this.blendAlphaOp = 0;
    this.blendConstant = null;
    this.colorMask = null;
    this.depthEnabled = null;
    this.depthWrite = null;
    this.depthFunc = null;
    this.depthBias = null;
    this.stencil = null;
    this.cullEnabled = null;
    this.cullFace = null;
    this.frontFace = null;
    this.scissorEnabled = null;
    this.viewport = null;
    this.scissor = null;
    this.framebufferBinding = undefined;
  }

  /**
   * 只把 framebuffer 绑定标记为未知，其它缓存全部保留。
   *
   * 用在「某段代码临时切了 framebuffer、之后已经恢复」的场合（例如读回纹理时的临时 framebuffer）。
   * 过去的做法是整体 `invalidate()`：那会把 program / blend / depth / cull / VAO / 纹理单元的
   * 记录一并丢掉，于是**紧随其后的那一次 draw 要把固定功能状态全部重下发一遍** ——
   * 在「每帧读回一次、之后照常画」的用法里，这笔开销是白付的（读回只动了 framebuffer 绑定）。
   */
  invalidateFramebufferBinding(): void {
    this.framebufferBinding = undefined;
  }

  /**
   * 记录「framebuffer 已经切到 `framebuffer`」（不调用 GL，只更新记忆值）。
   *
   * 用在已经**直接** `gl.bindFramebuffer()` 之后：调用方那次调用是必须的（要走 READ/DRAW
   * 这类缓存未覆盖的目标，或在默认 VAO 之类的前提下），这里把结果补记进缓存，
   * 免得之后被迫整体失效。
   */
  noteFramebufferBinding(framebuffer: WebGLFramebuffer | null): void {
    this.framebufferBinding = framebuffer;
  }

  /**
   * 绑定 `FRAMEBUFFER`（绑定目标同时作用于读/写两侧）；重复绑定同一个对象会被跳过。
   *
   * 与其它绑定一样，**帧缓冲相关的分帧状态**（`drawBuffers`、各附着点）不在这里检查 ——
   * 它们由 `FramebufferCache` 在创建时设置一次，同一个 framebuffer 对象不被别的路径改。
   */
  bindFramebuffer(framebuffer: WebGLFramebuffer | null): void {
    if (this.framebufferBinding !== undefined && this.framebufferBinding === framebuffer) return;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.framebufferBinding = framebuffer;
  }

  /**
   * 当前生效的 framebuffer（未知时会同步问一次 GL 并记下来）。
   *
   * WebGL2 的 `FRAMEBUFFER_BINDING` 查询返回的是默认帧缓冲之外的绑定对象，默认帧缓冲是 `null`；
   * 这个查询是同步的，所以只在缓存未知时做一次（`device.native` 外部改过状态后的
   * {@link invalidate} 会让它变回未知）。
   */
  currentFramebuffer(): WebGLFramebuffer | null {
    if (this.framebufferBinding === undefined) {
      this.framebufferBinding = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    }
    return this.framebufferBinding;
  }

  /**
   * 复用的读回 framebuffer：第一次调用时创建，之后一直返回同一个对象。
   *
   * 为什么复用而不是每次建删：`copyTextureToBuffer` 每次读回都 `createFramebuffer` +
   * `deleteFramebuffer` 是纯粹的对象 churn（还牵着驱动侧的分配/回收），而读回用的 framebuffer
   * 只需一个「临时挂附件」的容器，内容每次都会被重设。
   *
   * @throws ValidationError 当 `gl.createFramebuffer()` 返回 null（上下文丢失或资源耗尽）。
   */
  readbackFramebuffer(): WebGLFramebuffer {
    const existing = this.readbackFramebufferValue;
    if (existing) return existing;
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new ValidationError(
        '[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建读回用的 framebuffer。',
      );
    }
    this.readbackFramebufferValue = framebuffer;
    this.readbackAttachment = null;
    return framebuffer;
  }

  /**
   * 把某个纹理挂到读回 framebuffer 的指定附着点上（需要时先摘掉上一个附件）。
   *
   * **必须先摘掉上一个附件**：同一个纹理同时挂在同一个 framebuffer 的两个附着点上会让
   * framebuffer 不完整；而且旧实现每次新建 FBO 所以从没遇到这个问题 —— 复用之后必须显式处理。
   * 摘掉（`framebufferTexture2D(..., null)`）不影响纹理本身，只是解除引用。
   */
  attachReadbackTexture(texture: WebGLTexture, attachment: number, mipLevel: number): void {
    const framebuffer = this.readbackFramebuffer();
    // 每次都确保它是当前绑定的 FRAMEBUFFER：期间可能有人（例如 `copyTextureToTexture`）
    // 直接改过绑定，缓存里的记录不能当成事实。
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.framebufferBinding = framebuffer;
    const previous = this.readbackAttachment;
    if (previous && previous.texture === texture && previous.attachment === attachment) return;
    if (previous && previous.texture !== texture) {
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, previous.attachment, this.gl.TEXTURE_2D, null, 0);
    }
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, texture, mipLevel);
    this.readbackAttachment = { texture, attachment };
  }

  /**
   * 忘掉「读回 framebuffer 上挂着什么」的记录，**不动 GL 状态**。
   *
   * 给直接操作附着点的调用方用：`WebGL2CommandEncoder.copyTextureToBuffer` 要逐层读回，
   * 于是自己用 `framebufferTextureLayer` 换层号（那条路径不走 {@link attachReadbackTexture}）。
   * 不遗忘的话，下一次 `attachReadbackTexture` 会以为附件还是老样子而跳过重新挂载 ——
   * 实际附着点上已经是另一层（甚至另一张）纹理了。
   */
  forgetReadbackTexture(): void {
    this.readbackAttachment = null;
  }

  /**
   * 释放状态缓存自己持有的 GL 对象（目前只有复用的读回 framebuffer）。
   *
   * 只应在 `Device.dispose()` / 上下文丢失后调用。幂等。
   */
  dispose(): void {
    const framebuffer = this.readbackFramebufferValue;
    this.readbackFramebufferValue = null;
    this.readbackAttachment = null;
    if (framebuffer) this.gl.deleteFramebuffer(framebuffer);
  }

  /**
   * 只把纹理相关缓存标记为未知（当前活动单元的纹理绑定）。
   *
   * 用在「绕过缓存直接 `gl.bindTexture` 上传/拷贝纹理」之后：这类操作只改**当前活动单元**
   * 的纹理绑定，其它状态（program / blend / depth / VAO / UBO）都没动。
   * 用 {@link invalidate} 会把它们全部丢掉，于是下一次 draw 要把固定功能状态重下一遍 ——
   * 每帧都有纹理上传时这笔开销是白付的。
   *
   * sampler 不受 `bindTexture` 影响，所以这里保留 sampler 缓存。
   */
  invalidateTextureUnits(): void {
    // 只有 activeUnit 已知时才需要丢记录：textures 里的条目一定是设置过 activeUnit 之后写入的，
    // 所以 activeUnit < 0 意味着 textures 本来就是空的。
    if (this.activeUnit >= 0) this.textures.delete(this.activeUnit);
  }

  useProgram(program: WebGLProgram | null): void {
    if (this.program === program) return;
    this.gl.useProgram(program);
    this.program = program;
  }

  /**
   * 只把 buffer 绑定相关的缓存标记为未知。
   *
   * 用在「直接改动了 `ELEMENT_ARRAY_BUFFER` 绑定」的场合 —— 该绑定是 VAO 状态的一部分，
   * 构建 VAO 时必须直接调 GL，之后缓存里记录的绑定就不再可信。
   */
  invalidateBufferBindings(): void {
    this.arrayBuffer = null;
    this.indexBuffer = null;
  }

  bindVertexArray(vertexArray: WebGLVertexArrayObject | null): void {
    if (this.vertexArray === vertexArray) return;
    this.gl.bindVertexArray(vertexArray);
    this.vertexArray = vertexArray;
    // 绑定 VAO 会一并改变 ELEMENT_ARRAY_BUFFER 的绑定（它是 VAO 状态的一部分），
    // 所以缓冲绑定缓存必须作废。
    this.invalidateBufferBindings();
  }

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
  withDefaultVertexArray<T>(action: () => T): T {
    const previous = this.vertexArray;
    if (previous === null) return action();
    this.gl.bindVertexArray(null);
    this.vertexArray = null;
    this.invalidateBufferBindings();
    try {
      return action();
    } finally {
      this.gl.bindVertexArray(previous);
      this.vertexArray = previous;
      this.invalidateBufferBindings();
    }
  }

  /** 绑定 `ARRAY_BUFFER`（顶点属性与 `bufferSubData` 上传都走它）。 */
  bindArrayBuffer(buffer: WebGLBuffer | null): void {
    if (this.arrayBuffer === buffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.arrayBuffer = buffer;
  }

  /** 绑定 `ELEMENT_ARRAY_BUFFER`（会被 VAO 记录，所以绑定 VAO 后必须重新调用）。 */
  bindIndexBuffer(buffer: WebGLBuffer | null): void {
    if (this.indexBuffer === buffer) return;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.indexBuffer = buffer;
  }

  bindCopyReadBuffer(buffer: WebGLBuffer | null): void {
    if (this.copyReadBuffer === buffer) return;
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, buffer);
    this.copyReadBuffer = buffer;
  }

  bindCopyWriteBuffer(buffer: WebGLBuffer | null): void {
    if (this.copyWriteBuffer === buffer) return;
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, buffer);
    this.copyWriteBuffer = buffer;
  }

  /** 切换当前激活的纹理单元。 */
  activeTexture(unit: number): void {
    if (this.activeUnit === unit) return;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.activeUnit = unit;
  }

  /** 把纹理绑到指定单元；同一个单元重复绑定同一纹理会被跳过。 */
  bindTexture(unit: number, target: number, texture: WebGLTexture | null): void {
    this.activeTexture(unit);
    const current = this.textures.get(unit);
    if (current && current.target === target && current.texture === texture) return;
    this.gl.bindTexture(target, texture);
    this.textures.set(unit, { target, texture });
  }

  /** 把 sampler 对象绑到指定单元（WebGL2 的 sampler 对象承载采样参数）。 */
  bindSampler(unit: number, sampler: WebGLSampler | null): void {
    if (this.samplers.get(unit) === sampler) return;
    this.gl.bindSampler(unit, sampler);
    this.samplers.set(unit, sampler);
  }

  /** 绑定 uniform block：`size < 0` 用 `bindBufferBase`，否则用 `bindBufferRange`。 */
  bindUniformBuffer(index: number, buffer: WebGLBuffer | null, offset = 0, size = -1): void {
    const current = this.uniformBuffers.get(index);
    if (current && current.buffer === buffer && current.offset === offset && current.size === size) return;
    if (size < 0) {
      this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, index, buffer);
    } else {
      this.gl.bindBufferRange(this.gl.UNIFORM_BUFFER, index, buffer, offset, size);
    }
    this.uniformBuffers.set(index, { buffer, offset, size });
  }

  /** 清掉某个 binding 点的 uniform buffer 记录（缓冲区被销毁时调用）。 */
  forgetUniformBuffer(buffer: WebGLBuffer): void {
    for (const [index, binding] of this.uniformBuffers) {
      if (binding.buffer === buffer) this.uniformBuffers.delete(index);
    }
  }

  /** 忘掉 `ELEMENT_ARRAY_BUFFER` 的记录（索引缓冲被销毁时调用）。 */
  forgetIndexBuffer(buffer: WebGLBuffer): void {
    if (this.indexBuffer === buffer) this.indexBuffer = null;
  }

  /** 忘掉某个纹理的所有单元记录（纹理被销毁时调用）。 */
  forgetTexture(texture: WebGLTexture): void {
    for (const [unit, binding] of this.textures) {
      if (binding.texture === texture) this.textures.delete(unit);
    }
  }

  /**
   * 设置混合状态。参数是 GL 枚举（由 `glEnumMap` 翻译得到）。
   *
   * 去重（#31）：把各分量**逐个按数字比较**，而不是每次拼一条签名字符串。
   * 改前每次调用都要构造 `1:c:s:o:as:ad:ao` 这条模板字符串（7 段拼接 + 一次字符串比较），
   * 而混合状态是**变体不变量** —— 同一条管线连画几千次时这是纯粹的白付；现在每次调用
   * 只是 7 次数字/布尔比较，零分配。
   *
   * 正确性比性能重要得多：**判据必须覆盖每一个参与下发的字段**。漏一个就会出现
   * 「状态被误判成没变 → 漏下发 → 随机画面错误」。这件事由编译期闸门兜住
   * （见 {@link UncomparedBlendField}）：给 {@link GlBlendState} 加字段而忘了在这里比较，
   * 代码直接编译不过。
   */
  setBlend(
    enabled: boolean,
    colorSrc: number,
    colorDst: number,
    colorOp: number,
    alphaSrc: number,
    alphaDst: number,
    alphaOp: number,
  ): void {
    if (
      this.blendEnabled === enabled &&
      (!enabled ||
        (this.blendColorSrc === colorSrc &&
          this.blendColorDst === colorDst &&
          this.blendColorOp === colorOp &&
          this.blendAlphaSrc === alphaSrc &&
          this.blendAlphaDst === alphaDst &&
          this.blendAlphaOp === alphaOp))
    ) {
      return;
    }
    const gl = this.gl;
    if (enabled) {
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(colorSrc, colorDst, alphaSrc, alphaDst);
      gl.blendEquationSeparate(colorOp, alphaOp);
    } else {
      gl.disable(gl.BLEND);
    }
    // 存快照（六个数字），不持有调用方的对象引用：解析结果是共享的变体对象，不能被这里绑住。
    this.blendEnabled = enabled;
    this.blendColorSrc = colorSrc;
    this.blendColorDst = colorDst;
    this.blendColorOp = colorOp;
    this.blendAlphaSrc = alphaSrc;
    this.blendAlphaDst = alphaDst;
    this.blendAlphaOp = alphaOp;
  }

  setBlendConstant(color: readonly [number, number, number, number]): void {
    if (same4(this.blendConstant, color)) return;
    this.gl.blendColor(color[0], color[1], color[2], color[3]);
    this.blendConstant = [color[0], color[1], color[2], color[3]];
  }

  setColorMask(mask: readonly [boolean, boolean, boolean, boolean]): void {
    if (
      this.colorMask &&
      this.colorMask[0] === mask[0] &&
      this.colorMask[1] === mask[1] &&
      this.colorMask[2] === mask[2] &&
      this.colorMask[3] === mask[3]
    ) {
      return;
    }
    this.gl.colorMask(mask[0], mask[1], mask[2], mask[3]);
    this.colorMask = [mask[0], mask[1], mask[2], mask[3]];
  }

  /**
   * 设置深度测试。
   *
   * `bias` 的顺序是 `[slopeScale, constant, clamp]`，对应 WebGPU 的
   * `depthBiasSlopeScale` / `depthBias` / `depthBiasClamp`。GL 没有 clamp 的对应概念，
   * 因此 `clamp` 在 WebGL2 后端会被忽略（这是已知差异，不影响绝大多数用法）。
   */
  setDepthTest(
    enabled: boolean,
    write: boolean,
    func: number,
    bias?: readonly [number, number, number],
  ): void {
    const gl = this.gl;
    if (this.depthEnabled !== enabled) {
      if (enabled) gl.enable(gl.DEPTH_TEST);
      else gl.disable(gl.DEPTH_TEST);
      this.depthEnabled = enabled;
    }
    if (this.depthWrite !== write) {
      gl.depthMask(write);
      this.depthWrite = write;
    }
    if (this.depthFunc !== func) {
      gl.depthFunc(func);
      this.depthFunc = func;
    }
    const nextBias = bias ?? [0, 0, 0];
    if (!same3(this.depthBias, nextBias)) {
      // 只有真的需要用偏移时才 enable(POLYGON_OFFSET_FILL)，否则省掉一次状态切换。
      if (nextBias[0] !== 0 || nextBias[1] !== 0 || nextBias[2] !== 0) {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(nextBias[0], nextBias[1]);
      } else {
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      this.depthBias = [nextBias[0], nextBias[1], nextBias[2]];
    }
  }

  /**
   * 清深度/模板附件之前调用：把两个写掩码临时置成「全写」。
   *
   * 为什么必须做：**GL 的清屏受写掩码限制** —— `clearBufferfi` 清模板的部分会被
   * `STENCIL_WRITEMASK` 逐位过滤，写掩码为 0 的位上根本清不掉；深度那边同理
   *（`DEPTH_WRITEMASK` 关着时清深度是空操作，这一条代码里本来就处理了）。
   * 而缓存记的是「上一次下发的掩码」：上一条管线的 `stencilWriteMask` 是 0 时，
   * 下一次清模板就会**静默失效**，模板值跨通道残留（像素级复现见 `examples/stencil.html`
   * 的 `nowrite` 场景：写掩码 0 的那一趟之后，下一个通道本该是 0 的模板位还是上一帧的 1）。
   *
   * 清屏本来就绕过了状态缓存，所以这里顺手把相关记录标成未知，下一次
   * `setDepthTest()` / `setStencilTest()` 会重新下发真实值。
   *
   * @param hasStencil 当前附件是否带模板位。没有模板位时不碰模板掩码（少两次无效调用）。
   */
  prepareClear(hasStencil: boolean): void {
    const gl = this.gl;
    gl.depthMask(true);
    if (hasStencil) {
      // 全 1：GL 会把掩码与 `2^s - 1` 相与，所以在 8 位模板缓冲上等价于 0xff。
      gl.stencilMaskSeparate(gl.FRONT, 0xffff_ffff);
      gl.stencilMaskSeparate(gl.BACK, 0xffff_ffff);
      this.stencil = null;
    }
    this.depthWrite = null;
  }

  /**
   * 设置**完整**的模板状态：正/背面各自的比较函数与三种操作、读写掩码、参考值。
   *
   * 为什么必须用 `*Separate` 这一组入口：GLES 3.0 **支持双面模板**，
   * 而 `stencilFunc` / `stencilOp` / `stencilMask` 这组单面入口只能表达「两个面完全相同」。
   * WebGPU 的 `DepthStencilState` 里 `stencilFront` / `stencilBack` 是各自独立的，
   * 所以单面入口根本无法如实下发 —— 这正是这条路径原先的缺陷：整个模板状态被丢掉，
   * 只留下一句硬编码的 `stencilFunc(ALWAYS, ref, 0xff)`，于是 `{ compare: 'equal',
   * passOp: 'replace' }` 这类配置退化成「恒通过、不写」，不报任何错。
   *
   * 去重（这里最容易出错）：整份状态完全相同时一次 GL 调用都不发；只有真的变了的**部分**才重下发。
   * 判据覆盖每一个字段 —— 两个面各自的 `compare` / `failOp` / `depthFailOp` / `passOp`，
   * 加上 `reference` / `readMask` / `writeMask` / `enabled`。少一个字段就会误判「状态没变」而
   * 漏下发，症状是「换条管线之后画面偶尔不对」，没有异常也没有日志。
   *
   * 关掉 `STENCIL_TEST` 时只下发 `disable`，但**状态照旧记下来**：GL 在测试关闭期间不会重置
   * 这些参数，所以之后用同一份状态重新打开时只需要再 `enable` 一次。
   */
  setStencilTest(state: GlStencilState): void {
    const gl = this.gl;
    const previous = this.stencil;
    if (previous !== null && sameStencilState(previous, state)) return;

    if (previous === null || previous.enabled !== state.enabled) {
      if (state.enabled) gl.enable(gl.STENCIL_TEST);
      else gl.disable(gl.STENCIL_TEST);
    }

    if (state.enabled) {
      // 引用值与读掩码是**两个面共用**的（`stencilFuncSeparate` 每次都要把三者一起传），
      // 所以它们一变，两个面的 func 都得重下发；而 `compare` 只影响它自己那个面。
      const funcSharedChanged = previous?.reference !== state.reference || previous?.readMask !== state.readMask;
      const front = state.front;
      const back = state.back;
      if (funcSharedChanged || previous?.front.compare !== front.compare) {
        gl.stencilFuncSeparate(gl.FRONT, front.compare, state.reference, state.readMask);
      }
      if (funcSharedChanged || previous?.back.compare !== back.compare) {
        gl.stencilFuncSeparate(gl.BACK, back.compare, state.reference, state.readMask);
      }
      if (
        previous === null ||
        previous.front.failOp !== front.failOp ||
        previous.front.depthFailOp !== front.depthFailOp ||
        previous.front.passOp !== front.passOp
      ) {
        gl.stencilOpSeparate(gl.FRONT, front.failOp, front.depthFailOp, front.passOp);
      }
      if (
        previous === null ||
        previous.back.failOp !== back.failOp ||
        previous.back.depthFailOp !== back.depthFailOp ||
        previous.back.passOp !== back.passOp
      ) {
        gl.stencilOpSeparate(gl.BACK, back.failOp, back.depthFailOp, back.passOp);
      }
      if (previous?.writeMask !== state.writeMask) {
        gl.stencilMaskSeparate(gl.FRONT, state.writeMask);
        gl.stencilMaskSeparate(gl.BACK, state.writeMask);
      }
    }

    // 存一份快照：调用方（管线变体的解析结果）持有的是共享对象，不能被这里的引用绑住。
    this.stencil = {
      enabled: state.enabled,
      reference: state.reference,
      front: { ...state.front },
      back: { ...state.back },
      readMask: state.readMask,
      writeMask: state.writeMask,
    };
  }

  setCull(enabled: boolean, face: number, frontFace: number): void {
    const gl = this.gl;
    if (this.cullEnabled !== enabled) {
      if (enabled) gl.enable(gl.CULL_FACE);
      else gl.disable(gl.CULL_FACE);
      this.cullEnabled = enabled;
    }
    if (enabled && this.cullFace !== face) {
      gl.cullFace(face);
      this.cullFace = face;
    }
    if (this.frontFace !== frontFace) {
      gl.frontFace(frontFace);
      this.frontFace = frontFace;
    }
  }

  setViewport(x: number, y: number, width: number, height: number): void {
    if (same4(this.viewport, [x, y, width, height])) return;
    this.gl.viewport(x, y, width, height);
    this.viewport = [x, y, width, height];
  }

  /**
   * 设置 scissor 的开关与矩形（`setScissorRect` 与内部复位都走这里）。
   *
   * `enabled === false` 时只关开关、**不设矩形**（矩形交给 {@link resetScissor} 管理，
   * 因为 GL 的矩形只有在开关打开时才影响结果，而比较矩形也只在打开时才有意义）。
   */
  setScissor(
    enabled: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const gl = this.gl;
    // 记住「这个尺寸的整个附件」是什么，供 {@link resetScissor} 免掉多余的 GL 调用。
    if (enabled) this.scissorWholeBox = [0, 0, width, height];
    if (this.scissorEnabled !== enabled) {
      if (enabled) gl.enable(gl.SCISSOR_TEST);
      else gl.disable(gl.SCISSOR_TEST);
      this.scissorEnabled = enabled;
    }
    if (enabled && !same4(this.scissor, [x, y, width, height])) {
      gl.scissor(x, y, width, height);
      this.scissor = [x, y, width, height];
    }
  }

  /**
   * 把 scissor 复位成「**整个附件**、且关闭」（批 06 `#14`）。
   *
   * 每个渲染通道开始时调用一次（`WebGL2RenderTarget.bind()` 的三条目标路径 +
   * `WebGL2RenderPassEncoder` 的默认帧缓冲 / 原始附件两条路径）。
   *
   * ## 为什么必须每次复位
   *
   * WebGPU 的 `GPURenderPassEncoder` 在**每个 pass 开始时**把 scissor 重置成整个附件；
   * 而 WebGL2 这边 `SCISSOR_TEST` 与矩形都是**上下文状态**，会跨 pass 保留。改前的复位
   * 只在「要清屏」的分支里做，于是「上一个 pass 设过 `setScissorRect` → 本 pass 颜色与深度
   * 都是 `load`」这条缝里，上一个 pass 的矩形会继续生效 —— 而且
   * `WebGL2RenderPassEncoder.end()` 的 `invalidate()` 让缓存**声称** scissor 是关的，
   * 缓存与驱动不一致，后续绘制被静默裁进旧矩形。
   *
   * ## 为什么是「关闭」而不是「开着 + 整个附件」
   *
   * 两者对画面的效果相同（整个附件的裁剪框裁不掉任何像素），但「关闭」与本后端
   * 其余路径的默认状态一致（默认帧缓冲路径、原始附件路径改前就是关的），
   * 也不会让一条从未用过 scissor 的管线白白走上裁剪路径。
   * 关键的一点是**矩形必须同时被复位**：`setScissor()` 只在 `enabled === true` 时比较矩形，
   * 而 `invalidate()` 会清掉矩形记录，所以只关不设会让「矩形已经变了」这件事被漏掉 ——
   * 某个 pass 里第一次 `setScissorRect` 就可能跳过 `gl.scissor()`，继续用更早的矩形。
   *
   * 调用是**幂等且免 GL 调用**的：已经在复位状态上（矩形与「整个附件」相同 + 已经关掉）
   * 时直接返回，所以每个 pass 多加这一次调用不会带来任何 JS→GL 开销。
   */
  resetScissor(width: number, height: number): void {
    const gl = this.gl;
    const wholeBox: [number, number, number, number] = [0, 0, width, height];
    /*
     * 三个条件都要满足才算「已经在复位状态上」：
     * - 开关是关的；
     * - 我们记下的矩形就是「整个附件」；
     * - 而且这个矩形确实是**按当前尺寸**记下的（`same4` 里带了宽高）。
     * 少任何一个，就老老实实下发两条 GL 调用 —— 这里宁可多一次调用，也不留下一个
     * 「以为复位了、其实没有」的状态。
     */
    if (
      this.scissorEnabled === false &&
      same4(this.scissor, wholeBox) &&
      same4(this.scissorWholeBox, wholeBox)
    ) {
      return;
    }
    gl.disable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, width, height);
    this.scissorEnabled = false;
    this.scissor = wholeBox;
    this.scissorWholeBox = wholeBox;
  }

  /** 当前生效的 program（未设置时为 `null`）。 */
  get currentProgram(): WebGLProgram | null {
    return this.program;
  }

  /** 当前生效的顶点数组对象。 */
  get currentVertexArray(): WebGLVertexArrayObject | null {
    return this.vertexArray;
  }
}

function same4(
  a: readonly [number, number, number, number] | null,
  b: readonly [number, number, number, number] | number[],
): boolean {
  if (!a) return false;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function same3(a: readonly [number, number, number] | null, b: readonly [number, number, number]): boolean {
  if (!a) return false;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/** 两个模板面是否逐字段相同。 */
function sameStencilFace(a: GlStencilFaceState, b: GlStencilFaceState): boolean {
  return a.compare === b.compare && a.failOp === b.failOp && a.depthFailOp === b.depthFailOp && a.passOp === b.passOp;
}

/**
 * 两份模板状态是否逐字段相同（去重键）。
 *
 * 刻意不拼签名字符串：这里的字段都是小整数，逐个比较既没有分配，也不可能「漏掉某个字段还编译通过」
 * —— 漏字段正是这类缓存最典型的缺陷（状态没变 → 漏下发 → 随机画面错误）。
 */
function sameStencilState(a: GlStencilState, b: GlStencilState): boolean {
  return (
    a.enabled === b.enabled &&
    a.reference === b.reference &&
    a.readMask === b.readMask &&
    a.writeMask === b.writeMask &&
    sameStencilFace(a.front, b.front) &&
    sameStencilFace(a.back, b.back)
  );
}
