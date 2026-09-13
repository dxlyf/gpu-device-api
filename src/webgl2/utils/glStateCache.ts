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

  private blendSignature: string | null = null;
  private blendConstant: [number, number, number, number] | null = null;
  private colorMask: [boolean, boolean, boolean, boolean] | null = null;

  private depthEnabled: boolean | null = null;
  private depthWrite: boolean | null = null;
  private depthFunc: number | null = null;
  private depthBias: [number, number, number] | null = null;

  private stencilEnabled: boolean | null = null;
  private stencilReference: number | null = null;

  private cullEnabled: boolean | null = null;
  private cullFace: number | null = null;
  private frontFace: number | null = null;
  private scissorEnabled: boolean | null = null;

  private viewport: [number, number, number, number] | null = null;
  private scissor: [number, number, number, number] | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /** GL 上下文（便于调用方在需要时直接操作）。 */
  get context(): WebGL2RenderingContext {
    return this.gl;
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
    this.blendSignature = null;
    this.blendConstant = null;
    this.colorMask = null;
    this.depthEnabled = null;
    this.depthWrite = null;
    this.depthFunc = null;
    this.depthBias = null;
    this.stencilEnabled = null;
    this.stencilReference = null;
    this.cullEnabled = null;
    this.cullFace = null;
    this.frontFace = null;
    this.scissorEnabled = null;
    this.viewport = null;
    this.scissor = null;
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
   * 用一条签名字符串做比较，避免为每个字段单独维护缓存。
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
    const signature = enabled
      ? `1:${colorSrc}:${colorDst}:${colorOp}:${alphaSrc}:${alphaDst}:${alphaOp}`
      : '0';
    if (this.blendSignature === signature) return;
    const gl = this.gl;
    if (enabled) {
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(colorSrc, colorDst, alphaSrc, alphaDst);
      gl.blendEquationSeparate(colorOp, alphaOp);
    } else {
      gl.disable(gl.BLEND);
    }
    this.blendSignature = signature;
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

  setStencilTest(enabled: boolean, reference: number): void {
    const gl = this.gl;
    if (this.stencilEnabled !== enabled) {
      if (enabled) gl.enable(gl.STENCIL_TEST);
      else gl.disable(gl.STENCIL_TEST);
      this.stencilEnabled = enabled;
    }
    if (enabled && this.stencilReference !== reference) {
      gl.stencilFunc(gl.ALWAYS, reference, 0xff);
      this.stencilReference = reference;
    }
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

  setScissor(
    enabled: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const gl = this.gl;
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
