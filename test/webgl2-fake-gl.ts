/**
 * node 环境下的假 WebGL2 上下文，供不需要真实 GPU 的 WebGL2 单测使用。
 *
 * 只实现「创建设备 + 创建/销毁资源 + 单采样/多重采样渲染目标」这条路径真正会碰到的入口，
 * 并把每一次调用记进 `calls`。这样测的是**这一层到底下发了什么 GL 调用**，
 * 而不是「假 GL 有没有被调用」这种同义反复。
 *
 * 关键设计：`gl.getInternalformatParameter(RENDERBUFFER, format, SAMPLES)` 返回 `supportedSamples`，
 * 可以用它精确模拟「这个格式支持哪些采样数」，从而验证「不支持时明确报错，而不是静默降级」。
 */

/* GL 枚举（写死数值，避免依赖真实上下文实例）。 */
export const GL = {
  NO_ERROR: 0,
  TEXTURE_2D: 0x0de1,
  TEXTURE_3D: 0x806f,
  TEXTURE_2D_ARRAY: 0x8c1a,
  TEXTURE0: 0x84c0,
  NEAREST: 0x2600,
  LINEAR: 0x2601,
  CLAMP_TO_EDGE: 0x812f,
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  TEXTURE_WRAP_R: 0x8072,
  TEXTURE_BASE_LEVEL: 0x813c,
  TEXTURE_MAX_LEVEL: 0x813d,
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  COPY_READ_BUFFER: 0x8f36,
  COPY_WRITE_BUFFER: 0x8f37,
  DYNAMIC_DRAW: 0x88e8,
  FRAMEBUFFER: 0x8d40,
  READ_FRAMEBUFFER: 0x8ca8,
  DRAW_FRAMEBUFFER: 0x8ca9,
  RENDERBUFFER: 0x8d41,
  FRAMEBUFFER_BINDING: 0x8ca6,
  RENDERBUFFER_BINDING: 0x8ca7,
  COLOR_ATTACHMENT0: 0x8ce0,
  DEPTH_ATTACHMENT: 0x8d00,
  STENCIL_ATTACHMENT: 0x8d20,
  DEPTH_STENCIL_ATTACHMENT: 0x821a,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
  FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 0x8d56,
  COLOR_BUFFER_BIT: 0x4000,
  DEPTH_BUFFER_BIT: 0x100,
  DEPTH_COMPONENT24: 0x81a6,
  DEPTH24_STENCIL8: 0x88f0,
  RGBA8: 0x8058,
  MAX_SAMPLES: 0x8d57,
  SAMPLES: 0x80a9,
  SCISSOR_TEST: 0x0c11,
  ANY_SAMPLES_PASSED: 0x8c2f,
  QUERY_RESULT: 0x8866,
  QUERY_RESULT_AVAILABLE: 0x8867,
  NONE: 0,
  UNPACK_ALIGNMENT: 0x0cf5,
  UNPACK_ROW_LENGTH: 0x0cf2,
  UNPACK_IMAGE_HEIGHT: 0x806e,
  UNPACK_SKIP_ROWS: 0x0cf3,
  UNPACK_SKIP_PIXELS: 0x0cf4,
  UNPACK_SKIP_IMAGES: 0x806d,
  PACK_ALIGNMENT: 0x0d05,
  TEXTURE_COMPARE_MODE: 0x884c,
  TEXTURE_COMPARE_FUNC: 0x884d,
  COMPARE_REF_TO_TEXTURE: 0x884e,
  TEXTURE_MIN_LOD: 0x813a,
  TEXTURE_MAX_LOD: 0x813b,
} as const;

type Recorder = (call: string) => void;

export interface FakeWebGL2Options {
  /** `getParameter(MAX_SAMPLES)` 的返回值。 */
  maxSamples?: number;
  /** `getInternalformatParameter(RENDERBUFFER, format, SAMPLES)` 的返回值。 */
  supportedSamples?: readonly number[];
  /** `checkFramebufferStatus()` 的返回值；默认完整。 */
  framebufferStatus?: number;
  /**
   * 只让**最新创建的那个 framebuffer** 报 `framebufferStatus`，其余仍返回完整。
   *
   * 多重采样目标会创建两个 FBO（先 resolve 后 draw），而真实驱动只会说「draw FBO 不完整」
   * （`FRAMEBUFFER_INCOMPLETE_MULTISAMPLE`）。有了这个开关才能精确模拟那种情形。
   */
  incompleteOnLatestFramebufferOnly?: boolean;
  /**
   * `getContextAttributes()` 的返回值。
   *
   * GL context 的 `alpha` / `premultipliedAlpha` / `antialias` / `depth` 都是**创建时**定下的，
   * `configure()` 改不了 —— 所以画布路径必须读回来对照，这个开关用来模拟不同的 context。
   */
  contextAttributes?: WebGLContextAttributes;
}

export interface FakeWebGL2 {
  gl: WebGL2RenderingContext;
  /** 按发生顺序记录的调用，形如 `renderbufferStorageMultisample:RENDERBUFFER:4:RGBA8`。 */
  readonly calls: string[];
  /** 记下最后一次 `blitFramebuffer` 的参数（没有则为 null）。 */
  lastBlit: readonly number[] | null;
  /** 与 `gl` 一起被造出来的假 canvas（方便把同一个 canvas 交给 device 与 canvasContext）。 */
  readonly canvasOfDevice: HTMLCanvasElement;
  readonly counters: {
    buffers: number;
    textures: number;
    framebuffers: number;
    renderbuffers: number;
    queries: number;
    samplers: number;
    deletedRenderbuffers: number;
    deletedFramebuffers: number;
    deletedSamplers: number;
  };
  maxSamples: number;
  supportedSamples: number[];
  framebufferStatus: number;
}

/**
 * 造一台假 GL。
 *
 * 每个 GL 对象都是一个带函数式名字的普通对象，`name()` 会把它翻译成 `tex1` / `fbo2` 这样的字符串，
 * 于是测试既能看到「调用了几次」，也能看到「操作的是哪个对象」。
 */
export function createFakeWebGL2(options: FakeWebGL2Options = {}): FakeWebGL2 {
  const calls: string[] = [];
  const record: Recorder = (call) => {
    calls.push(call);
  };
  const names = new WeakMap<object, string>();
  let nextId = 0;
  /** 给一个对象起名并登记，返回该对象。 */
  function make(kind: string, fields: Record<string, unknown> = {}): Record<string, unknown> {
    const object: Record<string, unknown> = { ...fields };
    names.set(object, `${kind}${(nextId += 1)}`);
    return object;
  }
  const nameOf = (value: unknown): string =>
    value && typeof value === 'object' ? (names.get(value) ?? '?') : String(value);

  const state: FakeWebGL2 = {
    gl: null as unknown as WebGL2RenderingContext,
    calls,
    lastBlit: null,
    canvasOfDevice: createFakeCanvas().canvas,
    counters: {
      buffers: 0,
      textures: 0,
      framebuffers: 0,
      renderbuffers: 0,
      queries: 0,
      samplers: 0,
      deletedRenderbuffers: 0,
      deletedFramebuffers: 0,
      deletedSamplers: 0,
    },
    maxSamples: options.maxSamples ?? 8,
    supportedSamples: [...(options.supportedSamples ?? [1, 2, 4, 8])],
    framebufferStatus: options.framebufferStatus ?? GL.FRAMEBUFFER_COMPLETE,
  };

  let boundFramebuffer: unknown = null;
  let boundReadFramebuffer: unknown = null;
  let boundDrawFramebuffer: unknown = null;
  let boundRenderbuffer: unknown = null;
  let latestFramebuffer: unknown = null;
  /** 当前绑定的纹理（按目标记），用来把 `texSubImage3D` 归到某张纹理上。 */
  const boundTextures = new Map<number, unknown>();
  /** 当前的像素解包参数（`UNPACK_*`），供 `texSubImage3D` 的记录使用。 */
  const unpack = { rowLength: 0, imageHeight: 0, alignment: 4 };

  const gl = {
    ...GL,
    /*
     * 默认帧缓冲的尺寸。
     *
     * 真实上下文上这两个是**属性**（不是函数），本后端用它们算出「整个默认帧缓冲」的
     * scissor 矩形与 viewport（见 `WebGL2RenderPassEncoder.beginDefaultFramebufferPass`）。
     * 改前假 GL 没有这两个属性，于是那些调用收到的是 `undefined` —— 测试看到的是
     * `scissor:0,0,undefined,undefined` 这种在真实环境里不可能出现的参数。
     * 给一个具体的非零尺寸，才能让假 GL 上的断言与真实行为对得上。
     */
    drawingBufferWidth: 8,
    drawingBufferHeight: 8,

    /* ---- 纹理 ---------------------------------------------------------------------------- */
    createTexture: () => {
      state.counters.textures += 1;
      const texture = make('tex');
      record(`createTexture:${nameOf(texture)}`);
      return texture;
    },
    deleteTexture: (texture: unknown) => record(`deleteTexture:${nameOf(texture)}`),
    bindTexture: (target: number, texture: unknown) => {
      boundTextures.set(target, texture);
      record(`bindTexture:${target}:${nameOf(texture)}`);
    },
    activeTexture: (unit: number) => record(`activeTexture:${unit}`),
    texStorage2D: (target: number, levels: number) => record(`texStorage2D:${target}:${levels}`),
    texStorage3D: (target: number, levels: number) => record(`texStorage3D:${target}:${levels}`),
    texStorage2DMultisample: (target: number, samples: number) =>
      record(`texStorage2DMultisample:${target}:${samples}`),
    texParameteri: (target: number, pname: number) => record(`texParameteri:${target}:${pname}`),
    pixelStorei: (pname: number, value: number) => {
      if (pname === GL.UNPACK_ROW_LENGTH) unpack.rowLength = value;
      else if (pname === GL.UNPACK_IMAGE_HEIGHT) unpack.imageHeight = value;
      else if (pname === GL.UNPACK_ALIGNMENT) unpack.alignment = value;
      record(`pixelStorei:${pname}:${value}`);
    },
    texSubImage3D: (
      target: number,
      level: number,
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
      depth: number,
      format: number,
      type: number,
      data: ArrayBufferView,
    ) =>
      record(
        `texSubImage3D:${nameOf(boundTextures.get(target))}:level=${level}:xyz=${x},${y},${z}:` +
          `size=${width}x${height}x${depth}:format=${format}:type=${type}:` +
          `rowLength=${unpack.rowLength}:imageHeight=${unpack.imageHeight}:` +
          `alignment=${unpack.alignment}:bytes=${data.byteLength}`,
      ),
    texSubImage2D: (
      target: number,
      level: number,
      x: number,
      y: number,
      width: number,
      height: number,
      format: number,
      type: number,
      data: ArrayBufferView,
    ) =>
      record(
        `texSubImage2D:${nameOf(boundTextures.get(target))}:level=${level}:xy=${x},${y}:` +
          `size=${width}x${height}:format=${format}:type=${type}:bytes=${data.byteLength}`,
      ),

    /* ---- buffer -------------------------------------------------------------------------- */
    createBuffer: () => {
      state.counters.buffers += 1;
      const buffer = make('buf');
      record(`createBuffer:${nameOf(buffer)}`);
      return buffer;
    },
    deleteBuffer: (buffer: unknown) => record(`deleteBuffer:${nameOf(buffer)}`),
    bindBuffer: (target: number, buffer: unknown) => record(`bindBuffer:${target}:${nameOf(buffer)}`),
    bufferData: (target: number, size: number) => record(`bufferData:${target}:${String(size)}`),
    bindVertexArray: (array: unknown) => record(`bindVertexArray:${nameOf(array)}`),

    /* ---- framebuffer / renderbuffer ------------------------------------------------------ */
    createFramebuffer: () => {
      state.counters.framebuffers += 1;
      const framebuffer = make('fbo');
      latestFramebuffer = framebuffer;
      record(`createFramebuffer:${nameOf(framebuffer)}`);
      return framebuffer;
    },
    deleteFramebuffer: (framebuffer: unknown) => {
      state.counters.deletedFramebuffers += 1;
      record(`deleteFramebuffer:${nameOf(framebuffer)}`);
    },
    bindFramebuffer: (target: number, framebuffer: unknown) => {
      if (target === GL.FRAMEBUFFER) boundFramebuffer = framebuffer;
      else if (target === GL.READ_FRAMEBUFFER) boundReadFramebuffer = framebuffer;
      else if (target === GL.DRAW_FRAMEBUFFER) boundDrawFramebuffer = framebuffer;
      record(`bindFramebuffer:${target}:${nameOf(framebuffer)}`);
    },
    framebufferTexture2D: (target: number, attachment: number, texTarget: number, texture: unknown) =>
      record(`framebufferTexture2D:${target}:${attachment}:${texTarget}:${nameOf(texture)}`),
    framebufferTextureLayer: (target: number, attachment: number, texture: unknown, level: number, layer: number) =>
      record(`framebufferTextureLayer:${target}:${attachment}:${nameOf(texture)}:level=${level}:layer=${layer}`),
    framebufferRenderbuffer: (target: number, attachment: number, renderbufferTarget: number, renderbuffer: unknown) =>
      record(`framebufferRenderbuffer:${target}:${attachment}:${renderbufferTarget}:${nameOf(renderbuffer)}`),
    drawBuffers: (attachments: readonly number[]) => record(`drawBuffers:${attachments.join('|')}`),
    checkFramebufferStatus: () => {
      record('checkFramebufferStatus');
      if (options.incompleteOnLatestFramebufferOnly && boundFramebuffer !== latestFramebuffer) {
        return GL.FRAMEBUFFER_COMPLETE;
      }
      return state.framebufferStatus;
    },
    createRenderbuffer: () => {
      state.counters.renderbuffers += 1;
      const renderbuffer = make('rbo');
      record(`createRenderbuffer:${nameOf(renderbuffer)}`);
      return renderbuffer;
    },
    deleteRenderbuffer: (renderbuffer: unknown) => {
      state.counters.deletedRenderbuffers += 1;
      record(`deleteRenderbuffer:${nameOf(renderbuffer)}`);
    },
    bindRenderbuffer: (target: number, renderbuffer: unknown) => {
      boundRenderbuffer = renderbuffer;
      record(`bindRenderbuffer:${target}:${nameOf(renderbuffer)}`);
    },
    renderbufferStorageMultisample: (target: number, samples: number, internalFormat: number, width: number, height: number) =>
      record(`renderbufferStorageMultisample:${target}:${samples}:${internalFormat}:${width}x${height}`),
    blitFramebuffer: (
      srcX0: number,
      srcY0: number,
      srcX1: number,
      srcY1: number,
      dstX0: number,
      dstY0: number,
      dstX1: number,
      dstY1: number,
      mask: number,
      filter: number,
    ) => {
      state.lastBlit = [srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter];
      record(
        `blitFramebuffer:read=${nameOf(boundReadFramebuffer)}:draw=${nameOf(boundDrawFramebuffer)}:` +
          `${srcX0},${srcY0},${srcX1},${srcY1}->${dstX0},${dstY0},${dstX1},${dstY1}:mask=${mask}`,
      );
    },

    /* ---- sampler ------------------------------------------------------------------------- */
    createSampler: () => {
      state.counters.samplers += 1;
      const sampler = make('sampler');
      record(`createSampler:${nameOf(sampler)}`);
      return sampler;
    },
    deleteSampler: (sampler: unknown) => {
      state.counters.deletedSamplers += 1;
      record(`deleteSampler:${nameOf(sampler)}`);
    },
    samplerParameteri: (sampler: unknown, pname: number) =>
      record(`samplerParameteri:${nameOf(sampler)}:${pname}`),
    samplerParameterf: (sampler: unknown, pname: number) =>
      record(`samplerParameterf:${nameOf(sampler)}:${pname}`),

    /* ---- 查询（query set 用） ------------------------------------------------------------- */
    createQuery: () => {
      state.counters.queries += 1;
      const query = make('query');
      record(`createQuery:${nameOf(query)}`);
      return query;
    },
    deleteQuery: (query: unknown) => record(`deleteQuery:${nameOf(query)}`),

    /* ---- getParameter -------------------------------------------------------------------- */
    getParameter: (pname: number) => {
      record(`getParameter:${pname}`);
      if (pname === GL.MAX_SAMPLES) return state.maxSamples;
      if (pname === GL.FRAMEBUFFER_BINDING) return boundFramebuffer;
      if (pname === GL.RENDERBUFFER_BINDING) return boundRenderbuffer;
      if (pname === GL.SAMPLES) return 1;
      return 0;
    },
    getInternalformatParameter: (_target: number, _internalFormat: number, pname: number) => {
      record(`getInternalformatParameter:${pname}`);
      return pname === GL.SAMPLES ? Int32Array.from(state.supportedSamples) : null;
    },

    /* ---- 其它（渲染通道会用到，这里只需要存在） --------------------------------------------- */
    getError: () => GL.NO_ERROR,
    getExtension: () => null,
    getContextAttributes: () => ({
      alpha: true,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      desynchronized: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
      xrCompatible: false,
      ...(options.contextAttributes ?? {}),
    }),
    viewport: (x: number, y: number, width: number, height: number) =>
      record(`viewport:${x},${y},${width},${height}`),
    scissor: (x: number, y: number, width: number, height: number) =>
      record(`scissor:${x},${y},${width},${height}`),
    enable: (capability: number) => record(`enable:${capability}`),
    disable: (capability: number) => record(`disable:${capability}`),
    clearBufferfv: (buffer: number, drawbuffer: number) => record(`clearBufferfv:${buffer}:${drawbuffer}`),
    clearBufferfi: (buffer: number, drawbuffer: number) => record(`clearBufferfi:${buffer}:${drawbuffer}`),
    depthMask: (flag: boolean) => record(`depthMask:${flag}`),
    colorMask: () => record('colorMask'),
    /* ---- 固定功能状态（`applyRenderState` 会下发这些） ------------------------------------- */
    useProgram: () => record('useProgram'),
    depthFunc: () => record('depthFunc'),
    cullFace: () => record('cullFace'),
    frontFace: () => record('frontFace'),
    polygonOffset: () => record('polygonOffset'),
    blendFuncSeparate: () => record('blendFuncSeparate'),
    blendEquationSeparate: () => record('blendEquationSeparate'),
    stencilFuncSeparate: (face: number, func: number, reference: number, mask: number) =>
      record(`stencilFuncSeparate:${face}:${func}:${reference}:${mask}`),
    stencilOpSeparate: (face: number, fail: number, depthFail: number, pass: number) =>
      record(`stencilOpSeparate:${face}:${fail}:${depthFail}:${pass}`),
    stencilMaskSeparate: (face: number, mask: number) => record(`stencilMaskSeparate:${face}:${mask}`),
    createVertexArray: () => make('vao'),
    deleteVertexArray: () => {},
    flush: () => record('flush'),
    finish: () => record('finish'),
  } as unknown as WebGL2RenderingContext;

  state.gl = gl;
  return state;
}

/**
 * 假的 canvas：记录 `addEventListener` / `removeEventListener`。
 *
 * 之所以不用真的 `EventTarget`：这里要断言「监听器有没有被解绑」，需要一个可数的记账本，
 * 而且要能手工触发事件（真实 EventTarget 也可以，但拿不到「当前有几个监听器」）。
 */
export interface FakeCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly added: string[];
  readonly removed: string[];
  /** 某个类型当前还挂着几个监听器。 */
  listenerCount(type: string): number;
  /** 触发某个类型的事件；返回是否被 `preventDefault()`、以及有几个监听器被调用。 */
  fire(type: string): { defaultPrevented: boolean; handled: number };
}

export function createFakeCanvas(): FakeCanvas {
  const added: string[] = [];
  const removed: string[] = [];
  const listeners = new Map<string, Set<(event: Event) => void>>();

  const canvas = {
    addEventListener(type: string, handler: (event: Event) => void) {
      added.push(type);
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    removeEventListener(type: string, handler: (event: Event) => void) {
      removed.push(type);
      listeners.get(type)?.delete(handler);
    },
  } as unknown as HTMLCanvasElement;

  return {
    canvas,
    added,
    removed,
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
    fire(type: string) {
      let defaultPrevented = false;
      const event = {
        type,
        preventDefault() {
          defaultPrevented = true;
        },
      } as unknown as Event;
      const set = listeners.get(type);
      for (const handler of set ?? []) handler(event);
      return { defaultPrevented, handled: set?.size ?? 0 };
    },
  };
}
