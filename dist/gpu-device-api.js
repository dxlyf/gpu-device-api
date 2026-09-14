const O = {
  None: 0,
  /** 可映射用于读取。 */
  MapRead: 1,
  /** 可映射用于写入。 */
  MapWrite: 2,
  /** 可作为拷贝源。 */
  CopySrc: 4,
  /** 可作为拷贝目标（`queue.writeBuffer`）。 */
  CopyDst: 8,
  /** 可用作 index buffer。 */
  Index: 16,
  /** 可用作 vertex buffer。 */
  Vertex: 32,
  /** 可绑定为 uniform buffer。 */
  Uniform: 64,
  /** 可绑定为 storage buffer。 */
  Storage: 128,
  /** 可用作间接绘制/派发的参数 buffer。 */
  Indirect: 256,
  /** 可接收查询结果。 */
  QueryResolve: 512
}, y = {
  None: 0,
  CopySrc: 1,
  CopyDst: 2,
  /** 可通过 {@link TextureView} 采样。 */
  TextureBinding: 4,
  /** 可绑定为 storage texture（仅 WebGPU）。 */
  StorageBinding: 8,
  /** 可用作 render pass 的 color/depth attachment。 */
  RenderAttachment: 16
}, Kr = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], Gp = [
  "r8unorm",
  "r8uint",
  "r8sint",
  "r16uint",
  "r16sint",
  "r16float",
  "rg8unorm",
  "rg8uint",
  "rg8sint",
  "r32uint",
  "r32sint",
  "r32float",
  "rg16uint",
  "rg16sint",
  "rg16float",
  "rgba8unorm",
  "rgba8unorm-srgb",
  "rgba8uint",
  "rgba8sint",
  "bgra8unorm",
  "bgra8unorm-srgb",
  "rgb10a2unorm",
  "rg32uint",
  "rg32sint",
  "rg32float",
  "rgba16uint",
  "rgba16sint",
  "rgba16float",
  "rgba32uint",
  "rgba32sint",
  "rgba32float",
  ...Kr
];
function Hs(t) {
  return Kr.includes(t);
}
function Up(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const j = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, Op = {
  [j.Vertex]: "vertex",
  [j.Fragment]: "fragment",
  [j.Compute]: "compute"
}, Ip = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function Dp(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function Vp(t, e) {
  switch (t) {
    case "point-list":
      return e;
    case "line-list":
      return Math.floor(e / 2);
    case "line-strip":
      return Math.max(0, e - 1);
    case "triangle-list":
      return Math.floor(e / 3);
    case "triangle-strip":
      return Math.max(0, e - 2);
  }
}
const Np = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function Zs(t) {
  return t === "uint16" ? 2 : 4;
}
function Qs(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const zp = {
  Load: "load",
  Clear: "clear"
}, kp = {
  Store: "store",
  Discard: "discard"
}, Wp = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, jp = {
  Zero: "zero",
  One: "one",
  Src: "src",
  OneMinusSrc: "one-minus-src",
  SrcAlpha: "src-alpha",
  OneMinusSrcAlpha: "one-minus-src-alpha",
  Dst: "dst",
  OneMinusDst: "one-minus-dst",
  DstAlpha: "dst-alpha",
  OneMinusDstAlpha: "one-minus-dst-alpha",
  SrcAlphaSaturated: "src-alpha-saturated",
  Constant: "constant",
  OneMinusConstant: "one-minus-constant"
}, qp = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, Xp = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, Yp = {
  None: "none",
  Front: "front",
  Back: "back"
}, Hp = {
  Ccw: "ccw",
  Cw: "cw"
}, Zp = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, Qp = {
  Nearest: "nearest",
  Linear: "linear"
};
function T(t, e, n, r = !1) {
  return { components: t, byteSize: e, kind: n, normalized: r };
}
const Ks = Object.freeze({
  uint8x2: T(2, 2, "uint"),
  uint8x4: T(4, 4, "uint"),
  sint8x2: T(2, 2, "sint"),
  sint8x4: T(4, 4, "sint"),
  unorm8x2: T(2, 2, "float", !0),
  unorm8x4: T(4, 4, "float", !0),
  snorm8x2: T(2, 2, "float", !0),
  snorm8x4: T(4, 4, "float", !0),
  uint16x2: T(2, 4, "uint"),
  uint16x4: T(4, 8, "uint"),
  sint16x2: T(2, 4, "sint"),
  sint16x4: T(4, 8, "sint"),
  unorm16x2: T(2, 4, "float", !0),
  unorm16x4: T(4, 8, "float", !0),
  snorm16x2: T(2, 4, "float", !0),
  snorm16x4: T(4, 8, "float", !0),
  float16x2: T(2, 4, "float"),
  float16x4: T(4, 8, "float"),
  float32: T(1, 4, "float"),
  float32x2: T(2, 8, "float"),
  float32x3: T(3, 12, "float"),
  float32x4: T(4, 16, "float"),
  uint32: T(1, 4, "uint"),
  uint32x2: T(2, 8, "uint"),
  uint32x3: T(3, 12, "uint"),
  uint32x4: T(4, 16, "uint"),
  sint32: T(1, 4, "sint"),
  sint32x2: T(2, 8, "sint"),
  sint32x3: T(3, 12, "sint"),
  sint32x4: T(4, 16, "sint")
});
function ye(t) {
  const e = Ks[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function Js(t) {
  const e = ye(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function ea(t) {
  const e = ye(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const Kp = {
  Vertex: "vertex",
  Instance: "instance"
}, R = {
  /** uniform buffer（只读，16 字节对齐布局）。 */
  Uniform: "uniform",
  /** 读写 storage buffer（仅 WebGPU）。 */
  Storage: "storage",
  /** 只读 storage buffer。 */
  ReadOnlyStorage: "read-only-storage",
  /** 过滤 sampler。 */
  Sampler: "sampler",
  /** 用于 `textureSampleCompare` / 阴影查找的比较 sampler。 */
  ComparisonSampler: "comparison-sampler",
  /** 采样的 texture。 */
  Texture: "texture",
  /** 只写 storage texture（仅 WebGPU）。 */
  StorageTexture: "storage-texture"
};
function Jr(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function Jp(t) {
  return t === "texture" || t === "storage-texture";
}
function ei(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class fe extends Error {
  code;
  details;
  constructor(e, n = {}) {
    super(e, n.cause === void 0 ? void 0 : { cause: n.cause }), this.name = "GpuError", this.code = n.code ?? "GPU_ERROR", n.details && (this.details = n.details);
  }
  /** 包含错误码的单行描述，便于日志输出。 */
  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}
function ta(t) {
  return t instanceof fe;
}
class u extends fe {
  constructor(e, n = {}) {
    super(e, { ...n, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class na extends fe {
  constructor(e, n = {}) {
    super(e, { ...n, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class dn extends fe {
  reason;
  constructor(e, n = {}) {
    super(e, { ...n, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = n.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const wt = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function _n(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function ra(t) {
  const e = _n(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function ia(t = 0) {
  return y.CopyDst | y.TextureBinding | t;
}
function En(t, e = {}) {
  const n = e.dimension ?? (t.dimension === "1d" ? "1d" : t.dimension === "3d" ? "3d" : t.depthOrArrayLayers > 1 ? "2d-array" : "2d");
  return {
    format: e.format,
    dimension: n,
    baseMipLevel: e.baseMipLevel ?? 0,
    mipLevelCount: e.mipLevelCount ?? t.mipLevelCount,
    baseArrayLayer: e.baseArrayLayer ?? 0,
    arrayLayerCount: e.arrayLayerCount ?? t.depthOrArrayLayers,
    aspect: e.aspect ?? "all"
  };
}
function ti(t = {}) {
  return {
    addressModeU: t.addressModeU ?? "clamp-to-edge",
    addressModeV: t.addressModeV ?? "clamp-to-edge",
    addressModeW: t.addressModeW ?? "clamp-to-edge",
    magFilter: t.magFilter ?? "nearest",
    minFilter: t.minFilter ?? "nearest",
    mipmapFilter: t.mipmapFilter ?? "nearest",
    lodMinClamp: t.lodMinClamp ?? 0,
    lodMaxClamp: t.lodMaxClamp ?? 32,
    maxAnisotropy: t.maxAnisotropy ?? 1,
    compare: t.compare
  };
}
function em(t) {
  return [
    t.addressModeU,
    t.addressModeV,
    t.addressModeW,
    t.magFilter,
    t.minFilter,
    t.mipmapFilter,
    t.lodMinClamp,
    t.lodMaxClamp,
    t.maxAnisotropy,
    t.compare ?? "none"
  ].join("|");
}
function ni(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const pn = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function tm(t) {
  return t.buffer !== void 0;
}
function nm(t) {
  return t.sampler !== void 0;
}
function rm(t) {
  return t.view !== void 0;
}
function im(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function ri(t) {
  if (t.length === 0)
    throw new Error("[gpu-device-api] A BindGroupLayout needs at least one entry.");
  const e = [...t].sort((n, r) => n.binding - r.binding);
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    if (!Number.isInteger(r.binding) || r.binding < 0)
      throw new Error(`[gpu-device-api] BindGroupLayout entry #${n} has an invalid binding index ${r.binding}.`);
    if (n > 0 && e[n - 1].binding === r.binding)
      throw new Error(`[gpu-device-api] Duplicate binding index ${r.binding} in a BindGroupLayout.`);
  }
  return e;
}
function ii(t, e) {
  if (!Number.isInteger(t.arrayStride) || t.arrayStride <= 0)
    throw new Error(`[gpu-device-api] VertexBufferLayout.arrayStride must be a positive integer, got ${t.arrayStride}.`);
  if (t.arrayStride % 4 !== 0)
    throw new Error(`[gpu-device-api] VertexBufferLayout.arrayStride must be a multiple of 4, got ${t.arrayStride}.`);
  if (t.arrayStride > e.maxVertexBufferArrayStride)
    throw new Error(
      `[gpu-device-api] VertexBufferLayout.arrayStride ${t.arrayStride} exceeds maxVertexBufferArrayStride (${e.maxVertexBufferArrayStride}).`
    );
  if (t.attributes.length === 0)
    throw new Error("[gpu-device-api] VertexBufferLayout needs at least one attribute.");
  for (const n of t.attributes) {
    const r = ye(n.format);
    if (n.shaderLocation < 0 || n.shaderLocation >= e.maxVertexAttributes)
      throw new Error(
        `[gpu-device-api] VertexAttribute.shaderLocation ${n.shaderLocation} is outside [0, ${e.maxVertexAttributes - 1}].`
      );
    if (n.offset < 0 || n.offset % 4 !== 0)
      throw new Error(`[gpu-device-api] VertexAttribute.offset must be a non-negative multiple of 4, got ${n.offset}.`);
    if (n.offset + r.byteSize > t.arrayStride)
      throw new Error(
        `[gpu-device-api] VertexAttribute at location ${n.shaderLocation} reads ${r.byteSize} bytes from offset ${n.offset}, which overflows arrayStride ${t.arrayStride}.`
      );
  }
}
function si(t) {
  return t.map((e) => {
    const n = e.attributes.map((r) => `${r.shaderLocation}@${r.offset}:${r.format}`).join(",");
    return `${e.arrayStride}/${e.stepMode ?? "vertex"}[${n}]`;
  }).join(";");
}
const ae = {
  None: 0,
  Red: 1,
  Green: 2,
  Blue: 4,
  Alpha: 8,
  All: 15
}, kt = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, Jn = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, sa = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, st = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, aa = Object.freeze({
  /** 直通 alpha：`rgb * a + dst * (1 - a)`。 */
  alpha: {
    color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
  },
  /** 预乘 alpha：`src + dst * (1 - a)`。 */
  premultiplied: {
    color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
  },
  additive: {
    color: { srcFactor: "one", dstFactor: "one", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one", operation: "add" }
  },
  multiply: {
    color: { srcFactor: "dst", dstFactor: "zero", operation: "add" },
    alpha: { srcFactor: "dst-alpha", dstFactor: "zero", operation: "add" }
  },
  screen: {
    color: { srcFactor: "one", dstFactor: "one-minus-src", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
  }
});
function sm(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = aa[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function oa(t = 128, e) {
  const n = /* @__PURE__ */ new Map(), r = () => {
    for (; n.size > t; ) {
      const i = n.keys().next();
      if (i.done) return;
      const s = i.value, a = n.get(s);
      n.delete(s), e?.(a, s);
    }
  };
  return {
    get(i) {
      const s = n.get(i);
      if (s !== void 0)
        return n.delete(i), n.set(i, s), s;
    },
    set(i, s) {
      return n.get(i) !== void 0 && n.delete(i), n.set(i, s), r(), s;
    },
    has(i) {
      return n.has(i);
    },
    delete(i) {
      return n.delete(i);
    },
    clear() {
      n.clear();
    },
    get size() {
      return n.size;
    },
    values() {
      return [...n.values()];
    }
  };
}
function ai(...t) {
  return t.filter((e) => e != null && e !== "").join("|");
}
function am(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function oi(t, e, n) {
  if (!e) return { ...t };
  const r = { ...t };
  for (const [i, s] of Object.entries(e)) {
    if (typeof s != "number") continue;
    const a = t[i];
    if (typeof a != "number")
      throw new u(`[gpu-device-api] Unknown device limit "${String(i)}".`);
    if (s > a)
      throw new u(
        `[gpu-device-api] The ${n} adapter cannot satisfy ${String(i)} = ${s} (available: ${a}).`
      );
    r[i] = s;
  }
  return r;
}
function je(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function ci() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function Ln(t, e, n) {
  if (!t) throw new u(e, n ? { details: n } : {});
}
function om(t, e, n) {
  if (t == null)
    throw new u(e, n ? { details: n } : {});
  return t;
}
function L(t, e) {
  throw new u(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function Xe(t, e) {
  Ln(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function Mt(t, e) {
  Ln(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function cm(t, e) {
  Ln(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const ca = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array
];
function lm(t) {
  return ca.some((e) => t instanceof e);
}
function um(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function hm(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function la(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function li(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function fm(t) {
  return t + 3 & -4;
}
function ua(t, e = 4) {
  const n = la(t), r = li(n.byteLength, e);
  if (r === n.byteLength) return n;
  const i = new Uint8Array(r);
  return i.set(n), i;
}
function dm(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function pm(t) {
  if (t.length === 0) throw new RangeError("[gpu-device-api] concatTypedArrays() received no arrays.");
  const e = t[0];
  let n = 0;
  for (const a of t) n += a.length;
  const r = e.constructor, i = new r(n);
  let s = 0;
  for (const a of t)
    i.set(a, s), s += a.length;
  return i;
}
function mm(t, e) {
  return (t & e) === e;
}
function gm(t, e) {
  return (t & e) !== 0;
}
function bm(t, e) {
  return (t & e) === e;
}
function wm(...t) {
  let e = 0;
  for (const n of t) e |= n;
  return e;
}
function xm(t, e) {
  if (t === 0) return "None";
  const n = [];
  let r = 0;
  for (const [s, a] of Object.entries(e)) {
    const o = Number(s);
    o !== 0 && (t & o) === o && (n.push(a), r |= o);
  }
  const i = t & ~r;
  return i && n.push(`0x${i.toString(16)}`), n.join(" | ");
}
let $t = 0;
function G(t) {
  return $t += 1, `${t}#${$t}`;
}
function vm() {
  return $t;
}
function ym() {
  $t = 0;
}
const W = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, $m = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, ha = {
  silent: W.Silent,
  error: W.Error,
  warn: W.Warn,
  info: W.Info,
  debug: W.Debug,
  trace: W.Trace
};
let Pn = W.Warn;
function Tm(t) {
  Pn = typeof t == "string" ? ha[t] : t;
}
function Sm() {
  return Pn;
}
function Ke(t = "gpu-device-api", e) {
  const n = () => e ?? Pn, r = (i, s, a, o) => {
    n() < i || s(`[${t}] ${a}`, ...o);
  };
  return {
    get level() {
      return n();
    },
    error: (i, ...s) => r(W.Error, console.error, i, s),
    warn: (i, ...s) => r(W.Warn, console.warn, i, s),
    info: (i, ...s) => r(W.Info, console.info, i, s),
    debug: (i, ...s) => r(W.Debug, console.debug, i, s),
    trace: (i, ...s) => r(W.Trace, console.debug, i, s)
  };
}
const Am = {
  level: W.Silent,
  error: () => {
  },
  warn: () => {
  },
  info: () => {
  },
  debug: () => {
  },
  trace: () => {
  }
};
function fa(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function ui(t) {
  let e;
  for (const n of t)
    if (fa(n))
      try {
        n.dispose();
      } catch (r) {
        e ??= r;
      }
  if (e !== void 0) throw e;
}
class _m {
  resources = /* @__PURE__ */ new Set();
  _disposed = !1;
  get disposed() {
    return this._disposed;
  }
  track(e) {
    if (this._disposed)
      throw e.dispose(), new Error("[gpu-device-api] Cannot track a resource on a disposed scope.");
    return this.resources.add(e), e;
  }
  untrack(e) {
    this.resources.delete(e);
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = !0;
    const e = [...this.resources];
    this.resources.clear(), ui(e);
  }
}
function da() {
  return new Float32Array(2);
}
function pa(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function ma(t, e) {
  const n = new Float32Array(2);
  return n[0] = t, n[1] = e, n;
}
function ga(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function ba(t, e, n) {
  return t[0] = e, t[1] = n, t;
}
function wa(t) {
  return t[0] = 0, t[1] = 0, t;
}
function xa(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t;
}
function va(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t;
}
function ya(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t;
}
function $a(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t;
}
function Ta(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t;
}
function Sa(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t;
}
function Aa(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function _a(t, e) {
  const n = e[0], r = e[1];
  let i = Math.hypot(n, r);
  return i > 0 && (i = 1 / i), t[0] = n * i, t[1] = r * i, t;
}
function Ea(t) {
  return Math.hypot(t[0], t[1]);
}
function La(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function Pa(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function Ma(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1];
  return n * n + r * r;
}
function Ca(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function Fa(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function Ba(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t;
}
function Ra(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t;
}
function Ga(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t;
}
function Ua(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n;
}
function Oa(t, e, n) {
  const r = e[0], i = e[1];
  return t[0] = n[0] * r + n[3] * i + n[6], t[1] = n[1] * r + n[4] * i + n[7], t;
}
function Ia(t) {
  return [t[0], t[1]];
}
function Da(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const Em = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: xa,
  clone: pa,
  copy: ga,
  create: da,
  cross: Fa,
  distance: Pa,
  div: $a,
  dot: Ca,
  equals: Ua,
  fromValues: ma,
  length: Ea,
  lerp: Ba,
  max: Ga,
  min: Ra,
  mul: ya,
  negate: Aa,
  normalize: _a,
  scale: Ta,
  scaleAndAdd: Sa,
  set: ba,
  squaredDistance: Ma,
  squaredLength: La,
  sub: va,
  toArray: Ia,
  toString: Da,
  transformMat3: Oa,
  zero: wa
}, Symbol.toStringTag, { value: "Module" }));
function F() {
  return new Float32Array(3);
}
function Va(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function Na(t, e, n) {
  const r = new Float32Array(3);
  return r[0] = t, r[1] = e, r[2] = n, r;
}
function se(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function de(t, e, n, r) {
  return t[0] = e, t[1] = n, t[2] = r, t;
}
function mn(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function Ye(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t;
}
function oe(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t;
}
function za(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t;
}
function ka(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t;
}
function Tt(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t;
}
function xt(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t[2] = e[2] + n[2] * r, t;
}
function Wa(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function Mn(t, e) {
  const n = e[0], r = e[1], i = e[2];
  let s = Math.hypot(n, r, i);
  return s > 0 && (s = 1 / s), t[0] = n * s, t[1] = r * s, t[2] = i * s, t;
}
function Ge(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function hi(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function fi(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function Ct(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
  return n * n + r * r + i * i;
}
function ue(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function di(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], l = n[2];
  return t[0] = i * l - s * o, t[1] = s * a - r * l, t[2] = r * o - i * a, t;
}
function ja(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t;
}
function Ft(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t[2] = Math.min(e[2], n[2]), t;
}
function Bt(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t[2] = Math.max(e[2], n[2]), t;
}
function gn(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n;
}
function qa(t, e, n) {
  const r = ue(n, e) * 2;
  return t[0] = e[0] - n[0] * r, t[1] = e[1] - n[1] * r, t[2] = e[2] - n[2] * r, t;
}
function pi(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[3] * i + n[6] * s, t[1] = n[1] * r + n[4] * i + n[7] * s, t[2] = n[2] * r + n[5] * i + n[8] * s, t;
}
function Cn(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  let a = n[3] * r + n[7] * i + n[11] * s + n[15];
  return a = a || 1, t[0] = (n[0] * r + n[4] * i + n[8] * s + n[12]) / a, t[1] = (n[1] * r + n[5] * i + n[9] * s + n[13]) / a, t[2] = (n[2] * r + n[6] * i + n[10] * s + n[14]) / a, t;
}
function mi(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, t;
}
function Xa(t) {
  return [t[0], t[1], t[2]];
}
function Ya(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const Lm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ye,
  clone: Va,
  copy: se,
  create: F,
  cross: di,
  distance: fi,
  div: ka,
  dot: ue,
  equals: gn,
  fromValues: Na,
  length: Ge,
  lerp: ja,
  max: Bt,
  min: Ft,
  mul: za,
  negate: Wa,
  normalize: Mn,
  reflect: qa,
  scale: Tt,
  scaleAndAdd: xt,
  set: de,
  squaredDistance: Ct,
  squaredLength: hi,
  sub: oe,
  toArray: Xa,
  toString: Ya,
  transformDirection: mi,
  transformMat3: pi,
  transformMat4: Cn,
  zero: mn
}, Symbol.toStringTag, { value: "Module" }));
function Ha() {
  return new Float32Array(4);
}
function Za(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function Qa(t, e, n, r) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = n, i[3] = r, i;
}
function Ka(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function Ja(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function eo(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function to(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t[3] = e[3] + n[3], t;
}
function no(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t[3] = e[3] - n[3], t;
}
function ro(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t[3] = e[3] * n[3], t;
}
function io(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t[3] = e[3] / n[3], t;
}
function so(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t;
}
function ao(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function oo(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3];
  let a = Math.hypot(n, r, i, s);
  return a > 0 && (a = 1 / a), t[0] = n * a, t[1] = r * a, t[2] = i * a, t[3] = s * a, t;
}
function co(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function lo(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function uo(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function ho(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t[3] = e[3] + r * (n[3] - e[3]), t;
}
function fo(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function po(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = n[0] * r + n[4] * i + n[8] * s + n[12] * a, t[1] = n[1] * r + n[5] * i + n[9] * s + n[13] * a, t[2] = n[2] * r + n[6] * i + n[10] * s + n[14] * a, t[3] = n[3] * r + n[7] * i + n[11] * s + n[15] * a, t;
}
function mo(t) {
  return [t[0], t[1], t[2], t[3]];
}
function go(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const Pm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: to,
  clone: Za,
  copy: Ka,
  create: Ha,
  div: io,
  dot: uo,
  equals: fo,
  fromValues: Qa,
  length: co,
  lerp: ho,
  mul: ro,
  negate: ao,
  normalize: oo,
  scale: so,
  set: Ja,
  squaredLength: lo,
  sub: no,
  toArray: mo,
  toString: go,
  transformMat4: po,
  zero: eo
}, Symbol.toStringTag, { value: "Module" }));
function gi() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function bi(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function bo(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function wo(t, e, n, r, i, s, a, o, l) {
  const c = new Float32Array(9);
  return c[0] = t, c[1] = e, c[2] = n, c[3] = r, c[4] = i, c[5] = s, c[6] = a, c[7] = o, c[8] = l, c;
}
function xo(t, e) {
  return t.set(e), t;
}
function vo(t, e, n, r, i, s, a, o, l, c) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = l, t[8] = c, t;
}
function wi(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function xi(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8];
  return t[0] = n, t[1] = s, t[2] = l, t[3] = r, t[4] = a, t[5] = c, t[6] = i, t[7] = o, t[8] = h, t;
}
function yo(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = c * s - a * l, d = -c * i + a * o, f = l * i - s * o;
  return e * h + n * d + r * f;
}
function vi(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = h * a - o * c, f = -h * s + o * l, p = c * s - a * l;
  let m = n * d + r * f + i * p;
  return m ? (m = 1 / m, t[0] = d * m, t[1] = (-h * r + i * c) * m, t[2] = (o * r - i * a) * m, t[3] = f * m, t[4] = (h * n - i * l) * m, t[5] = (-o * n + i * s) * m, t[6] = p * m, t[7] = (-c * n + r * l) * m, t[8] = (a * n - r * s) * m, t) : null;
}
function $o(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = n[0], p = n[1], m = n[2], g = n[3], b = n[4], w = n[5], $ = n[6], S = n[7], A = n[8];
  return t[0] = f * r + p * a + m * c, t[1] = f * i + p * o + m * h, t[2] = f * s + p * l + m * d, t[3] = g * r + b * a + w * c, t[4] = g * i + b * o + w * h, t[5] = g * s + b * l + w * d, t[6] = $ * r + S * a + A * c, t[7] = $ * i + S * o + A * h, t[8] = $ * s + S * l + A * d, t;
}
function To(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = n[0], p = n[1], m = n[2];
  return t[0] = f * r, t[1] = f * i, t[2] = f * s, t[3] = p * a, t[4] = p * o, t[5] = p * l, t[6] = m * c, t[7] = m * h, t[8] = m * d, t;
}
function So(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = n[0], p = n[1];
  return t[0] = r, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = l, t[6] = f * r + p * a + c, t[7] = f * i + p * o + h, t[8] = f * s + p * l + d, t;
}
function Ao(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = Math.sin(n), p = Math.cos(n);
  return t[0] = p * r + f * a, t[1] = p * i + f * o, t[2] = p * s + f * l, t[3] = p * a - f * r, t[4] = p * o - f * i, t[5] = p * l - f * s, t[6] = c, t[7] = h, t[8] = d, t;
}
function Fn(t, e) {
  return wi(t, e), vi(t, t) ? (xi(t, t), t) : null;
}
function _o(t, e, n = 1e-6) {
  for (let r = 0; r < 9; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function Eo(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const Mm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: bo,
  copy: xo,
  create: gi,
  determinant: yo,
  equals: _o,
  fromMat4: wi,
  fromValues: wo,
  identity: bi,
  invert: vi,
  multiply: $o,
  normalFromMat4: Fn,
  rotate: Ao,
  scale: To,
  set: vo,
  toString: Eo,
  translate: So,
  transpose: xi
}, Symbol.toStringTag, { value: "Module" })), St = 1e-6, ie = new Float32Array(16), Lo = new Float32Array(3);
function ne() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function X(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Po(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function yi(t) {
  return t.fill(0), t;
}
function Mo(...t) {
  const e = new Float32Array(16);
  for (let n = 0; n < 16; n++) e[n] = t[n] ?? 0;
  return e;
}
function $i(t, e) {
  return t.set(e), t;
}
function Co(t, ...e) {
  for (let n = 0; n < 16; n++) t[n] = e[n] ?? 0;
  return t;
}
function Fo(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = e[9], f = e[10], p = e[11], m = e[12], g = e[13], b = e[14], w = e[15];
  return t[0] = n, t[1] = a, t[2] = h, t[3] = m, t[4] = r, t[5] = o, t[6] = d, t[7] = g, t[8] = i, t[9] = l, t[10] = f, t[11] = b, t[12] = s, t[13] = c, t[14] = p, t[15] = w, t;
}
function Ti(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = t[9], d = t[10], f = t[11], p = t[12], m = t[13], g = t[14], b = t[15], w = e * a - n * s, $ = e * o - r * s, S = e * l - i * s, A = n * o - r * a, _ = n * l - i * a, P = r * l - i * o, M = c * m - h * p, D = c * g - d * p, V = c * b - f * p, N = h * g - d * m, z = h * b - f * m, Y = d * b - f * g;
  return w * Y - $ * z + S * N + A * V - _ * D + P * M;
}
function Rt(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = e[9], f = e[10], p = e[11], m = e[12], g = e[13], b = e[14], w = e[15], $ = n * o - r * a, S = n * l - i * a, A = n * c - s * a, _ = r * l - i * o, P = r * c - s * o, M = i * c - s * l, D = h * g - d * m, V = h * b - f * m, N = h * w - p * m, z = d * b - f * g, Y = d * w - p * g, J = f * w - p * b;
  let E = $ * J - S * Y + A * z + _ * N - P * V + M * D;
  return E ? (E = 1 / E, t[0] = (o * J - l * Y + c * z) * E, t[1] = (i * Y - r * J - s * z) * E, t[2] = (g * M - b * P + w * _) * E, t[3] = (f * P - d * M - p * _) * E, t[4] = (l * N - a * J - c * V) * E, t[5] = (n * J - i * N + s * V) * E, t[6] = (b * A - m * M - w * S) * E, t[7] = (h * M - f * A + p * S) * E, t[8] = (a * Y - o * N + c * D) * E, t[9] = (r * N - n * Y - s * D) * E, t[10] = (m * P - g * A + w * $) * E, t[11] = (d * A - h * P - p * $) * E, t[12] = (o * V - a * z - l * D) * E, t[13] = (n * z - r * V + i * D) * E, t[14] = (g * S - m * _ - b * $) * E, t[15] = (h * _ - d * S + f * $) * E, t) : null;
}
function Q(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = e[9], p = e[10], m = e[11], g = e[12], b = e[13], w = e[14], $ = e[15], S = n[0], A = n[1], _ = n[2], P = n[3], M = n[4], D = n[5], V = n[6], N = n[7], z = n[8], Y = n[9], J = n[10], E = n[11], tt = n[12], nt = n[13], rt = n[14], it = n[15];
  return t[0] = S * r + A * o + _ * d + P * g, t[1] = S * i + A * l + _ * f + P * b, t[2] = S * s + A * c + _ * p + P * w, t[3] = S * a + A * h + _ * m + P * $, t[4] = M * r + D * o + V * d + N * g, t[5] = M * i + D * l + V * f + N * b, t[6] = M * s + D * c + V * p + N * w, t[7] = M * a + D * h + V * m + N * $, t[8] = z * r + Y * o + J * d + E * g, t[9] = z * i + Y * l + J * f + E * b, t[10] = z * s + Y * c + J * p + E * w, t[11] = z * a + Y * h + J * m + E * $, t[12] = tt * r + nt * o + rt * d + it * g, t[13] = tt * i + nt * l + rt * f + it * b, t[14] = tt * s + nt * c + rt * p + it * w, t[15] = tt * a + nt * h + rt * m + it * $, t;
}
function Bo(t, ...e) {
  if (e.length === 0) return X(t);
  $i(t, e[0]);
  for (let n = 1; n < e.length; n++) Q(t, t, e[n]);
  return t;
}
function Si(t, e) {
  return X(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function Ro(t, e) {
  return X(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function Ai(t, e, n) {
  let r = n[0], i = n[1], s = n[2], a = Math.hypot(r, i, s);
  if (a < St) return X(t);
  a = 1 / a, r *= a, i *= a, s *= a;
  const o = Math.sin(e), l = Math.cos(e), c = 1 - l, h = r * r * c + l, d = i * r * c + s * o, f = s * r * c - i * o, p = r * i * c - s * o, m = i * i * c + l, g = s * i * c + r * o, b = r * s * c + i * o, w = i * s * c - r * o, $ = s * s * c + l;
  return t[0] = h, t[1] = d, t[2] = f, t[3] = 0, t[4] = p, t[5] = m, t[6] = g, t[7] = 0, t[8] = b, t[9] = w, t[10] = $, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Bn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[5] = r, t[6] = n, t[9] = -n, t[10] = r, t;
}
function Rn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[0] = r, t[2] = -n, t[8] = n, t[10] = r, t;
}
function Gn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[0] = r, t[1] = n, t[4] = -n, t[5] = r, t;
}
function Go(t, e, n, r) {
  return Un(t, e, n, r, Uo);
}
const Uo = new Float32Array([1, 1, 1]);
function Un(t, e, n, r, i) {
  let s = n[0], a = n[1], o = n[2], l = Math.hypot(s, a, o);
  if (l < St)
    return X(t), t[12] = r[0], t[13] = r[1], t[14] = r[2], t;
  l = 1 / l, s *= l, a *= l, o *= l;
  const c = Math.sin(e), h = Math.cos(e), d = 1 - h, f = s * s * d + h, p = a * s * d + o * c, m = o * s * d - a * c, g = s * a * d - o * c, b = a * a * d + h, w = o * a * d + s * c, $ = s * o * d + a * c, S = a * o * d - s * c, A = o * o * d + h, _ = i[0], P = i[1], M = i[2];
  return t[0] = f * _, t[1] = p * _, t[2] = m * _, t[3] = 0, t[4] = g * P, t[5] = b * P, t[6] = w * P, t[7] = 0, t[8] = $ * M, t[9] = S * M, t[10] = A * M, t[11] = 0, t[12] = r[0], t[13] = r[1], t[14] = r[2], t[15] = 1, t;
}
function Oo(t, e, n, r, i, s) {
  Un(t, e, n, r, i);
  const a = s[0], o = s[1], l = s[2];
  return t[12] = r[0] + a - (t[0] * a + t[4] * o + t[8] * l), t[13] = r[1] + o - (t[1] * a + t[5] * o + t[9] * l), t[14] = r[2] + l - (t[2] * a + t[6] * o + t[10] * l), t;
}
function Io(t, e, n) {
  return Si(ie, n), Q(t, e, ie);
}
function Do(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function Vo(t, e, n, r) {
  return Ai(ie, n, r), Q(t, e, ie);
}
function No(t, e, n) {
  return Bn(ie, n), Q(t, e, ie);
}
function zo(t, e, n) {
  return Rn(ie, n), Q(t, e, ie);
}
function ko(t, e, n) {
  return Gn(ie, n), Q(t, e, ie);
}
function Wo(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function _i(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function jo(t, e) {
  const n = _i(Lo, e), r = Ti(e) < 0 ? -1 : 1, i = n[0] * r, s = n[1], a = n[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function Ei(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (r - i);
    t[10] = (i + r) * a, t[14] = 2 * i * r * a;
  } else
    t[10] = -1, t[14] = -2 * r;
  return t;
}
function Li(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (r - i), t[14] = i * r / (r - i)) : (t[10] = -1, t[14] = -r), t;
}
function Pi(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), l = 1 / (r - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * c, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * l, t[14] = (a + s) * c, t[15] = 1, t;
}
function Mi(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), l = 1 / (r - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = c, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * l, t[14] = s * c, t[15] = 1, t;
}
function qo(t, e, n, r, i, s, a) {
  const o = 1 / (n - e), l = 1 / (i - r), c = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * l, t[6] = 0, t[7] = 0, t[8] = (n + e) * o, t[9] = (i + r) * l, t[10] = (a + s) * c, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * c, t[15] = 0, t;
}
function bn(t, e, n, r) {
  let i = e[0] - n[0], s = e[1] - n[1], a = e[2] - n[2], o = Math.hypot(i, s, a);
  if (o < St) return yi(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let l = r[1] * a - r[2] * s, c = r[2] * i - r[0] * a, h = r[0] * s - r[1] * i;
  o = Math.hypot(l, c, h), o < St ? (l = 0, c = 0, h = 0) : (o = 1 / o, l *= o, c *= o, h *= o);
  const d = s * h - a * c, f = a * l - i * h, p = i * c - s * l;
  return t[0] = l, t[1] = d, t[2] = i, t[3] = 0, t[4] = c, t[5] = f, t[6] = s, t[7] = 0, t[8] = h, t[9] = p, t[10] = a, t[11] = 0, t[12] = -(l * e[0] + c * e[1] + h * e[2]), t[13] = -(d * e[0] + f * e[1] + p * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function Xo(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  let a = e[3] * r + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * r + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * r + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * r + e[6] * i + e[10] * s + e[14]) / a, t;
}
function Yo(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r + e[4] * i + e[8] * s, t[1] = e[1] * r + e[5] * i + e[9] * s, t[2] = e[2] * r + e[6] * i + e[10] * s, t;
}
function Ho(t, e, n = 1e-6) {
  for (let r = 0; r < 16; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function Zo(t) {
  const e = [];
  for (let n = 0; n < 4; n++)
    e.push(
      `[${t[n]}, ${t[n + 4]}, ${t[n + 8]}, ${t[n + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const Cm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Po,
  copy: $i,
  create: ne,
  determinant: Ti,
  equals: Ho,
  fromRotation: Ai,
  fromRotationTranslation: Go,
  fromRotationTranslationScale: Un,
  fromRotationTranslationScaleOrigin: Oo,
  fromScaling: Ro,
  fromTranslation: Si,
  fromValues: Mo,
  fromXRotation: Bn,
  fromYRotation: Rn,
  fromZRotation: Gn,
  frustum: qo,
  getRotation: jo,
  getScaling: _i,
  getTranslation: Wo,
  identity: X,
  invert: Rt,
  lookAt: bn,
  multiply: Q,
  multiplyAll: Bo,
  ortho: Pi,
  orthoZO: Mi,
  perspective: Ei,
  perspectiveZO: Li,
  rotate: Vo,
  rotateX: No,
  rotateY: zo,
  rotateZ: ko,
  scale: Do,
  set: Co,
  toString: Zo,
  transformDirection: Yo,
  transformPoint: Xo,
  translate: Io,
  transpose: Fo,
  zero: yi
}, Symbol.toStringTag, { value: "Module" }));
function Ci() {
  const t = new Float32Array(4);
  return t[3] = 1, t;
}
function Qo(t) {
  const e = new Float32Array(4);
  return Fi(e, t);
}
function Fi(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function Je(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function Ko(t, e, n, r) {
  return Je(new Float32Array(4), t, e, n, r);
}
function Gt(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 1, t;
}
function On(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function In(t) {
  return On(t, t);
}
function Bi(t) {
  return Math.sqrt(In(t));
}
function De(t, e) {
  const n = Bi(e);
  if (n < 1e-8) return Gt(t);
  const r = 1 / n;
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function Jo(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = e[3], t;
}
function ec(t, e) {
  const n = In(e);
  if (n < 1e-12) return Gt(t);
  const r = 1 / n;
  return t[0] = -e[0] * r, t[1] = -e[1] * r, t[2] = -e[2] * r, t[3] = e[3] * r, t;
}
function $e(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = n[0], l = n[1], c = n[2], h = n[3];
  return t[0] = r * h + a * o + i * c - s * l, t[1] = i * h + a * l + s * o - r * c, t[2] = s * h + a * c + r * l - i * o, t[3] = a * h - r * o - i * l - s * c, t;
}
function tc(t, e, n) {
  return $e(t, n, e);
}
function nc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return $e(t, e, Je(Dn, i, 0, 0, s));
}
function rc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return $e(t, e, Je(Dn, 0, i, 0, s));
}
function ic(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return $e(t, e, Je(Dn, 0, 0, i, s));
}
const Dn = Ci();
function vt(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]);
  if (r < 1e-8) return Gt(t);
  const i = n * 0.5, s = Math.sin(i) / r;
  return t[0] = e[0] * s, t[1] = e[1] * s, t[2] = e[2] * s, t[3] = Math.cos(i), t;
}
function sc(t, e) {
  const n = e[0], r = e[5], i = e[10], s = n + r + i;
  if (s > 0) {
    const a = Math.sqrt(s + 1) * 2;
    t[3] = a * 0.25, t[0] = (e[6] - e[9]) / a, t[1] = (e[8] - e[2]) / a, t[2] = (e[1] - e[4]) / a;
  } else if (n > r && n > i) {
    const a = Math.sqrt(1 + n - r - i) * 2;
    t[3] = (e[6] - e[9]) / a, t[0] = a * 0.25, t[1] = (e[4] + e[1]) / a, t[2] = (e[8] + e[2]) / a;
  } else if (r > i) {
    const a = Math.sqrt(1 + r - n - i) * 2;
    t[3] = (e[8] - e[2]) / a, t[0] = (e[4] + e[1]) / a, t[1] = a * 0.25, t[2] = (e[9] + e[6]) / a;
  } else {
    const a = Math.sqrt(1 + i - n - r) * 2;
    t[3] = (e[1] - e[4]) / a, t[0] = (e[8] + e[2]) / a, t[1] = (e[9] + e[6]) / a, t[2] = a * 0.25;
  }
  return De(t, t);
}
function ac(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], l = n[2];
  let c = r * a + i * o + s * l + 1;
  return c < 1e-8 ? (c = 0, Math.abs(r) > Math.abs(s) ? (t[0] = -i, t[1] = r, t[2] = 0) : (t[0] = 0, t[1] = -s, t[2] = i), t[3] = c) : (t[0] = i * l - s * o, t[1] = s * a - r * l, t[2] = r * o - i * a, t[3] = c), De(t, t);
}
function oc(t, e, n) {
  const r = n[0], i = n[1], s = n[2], a = e[0], o = e[1], l = e[2], c = e[3], h = 2 * (o * s - l * i), d = 2 * (l * r - a * s), f = 2 * (a * i - o * r);
  return t[0] = r + c * h + (o * f - l * d), t[1] = i + c * d + (l * h - a * f), t[2] = s + c * f + (a * d - o * h), t;
}
function cc(t, e, n, r) {
  let i = n[0], s = n[1], a = n[2], o = n[3], l = On(e, n);
  if (l < 0 && (l = -l, i = -i, s = -s, a = -a, o = -o), l > 0.9995)
    return t[0] = e[0] + (i - e[0]) * r, t[1] = e[1] + (s - e[1]) * r, t[2] = e[2] + (a - e[2]) * r, t[3] = e[3] + (o - e[3]) * r, De(t, t);
  const c = Math.acos(l), h = Math.sin(c), d = Math.sin((1 - r) * c) / h, f = Math.sin(r * c) / h;
  return t[0] = e[0] * d + i * f, t[1] = e[1] * d + s * f, t[2] = e[2] * d + a * f, t[3] = e[3] * d + o * f, De(t, t);
}
function lc(t, e, n, r) {
  return t[0] = e[0] + (n[0] - e[0]) * r, t[1] = e[1] + (n[1] - e[1]) * r, t[2] = e[2] + (n[2] - e[2]) * r, t[3] = e[3] + (n[3] - e[3]) * r, De(t, t);
}
function Ri(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = n + n, o = r + r, l = i + i, c = n * a, h = n * o, d = n * l, f = r * o, p = r * l, m = i * l, g = s * a, b = s * o, w = s * l;
  return t[0] = 1 - (f + m), t[1] = h + w, t[2] = d - b, t[3] = 0, t[4] = h - w, t[5] = 1 - (c + m), t[6] = p + g, t[7] = 0, t[8] = d + b, t[9] = p - g, t[10] = 1 - (c + f), t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function uc(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function hc(t) {
  return `quat(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const Fm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Qo,
  conjugate: Jo,
  copy: Fi,
  create: Ci,
  dot: On,
  equals: uc,
  fromValues: Ko,
  identity: Gt,
  invert: ec,
  length: Bi,
  lerp: lc,
  multiply: $e,
  normalize: De,
  premultiply: tc,
  rotateX: nc,
  rotateY: rc,
  rotateZ: ic,
  set: Je,
  setAxisAngle: vt,
  setFromRotationMatrix: sc,
  setFromUnitVectors: ac,
  slerp: cc,
  squaredLength: In,
  toMat4: Ri,
  toString: hc,
  transformVec3: oc
}, Symbol.toStringTag, { value: "Module" })), fc = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"];
function Gi(t = 0, e = 0, n = 0, r = "XYZ") {
  return { x: t, y: e, z: n, order: r };
}
function dc(t) {
  return Gi(t.x, t.y, t.z, t.order);
}
function pc(t, e) {
  return t.x = e.x, t.y = e.y, t.z = e.z, t.order = e.order, t;
}
function mc(t, e, n, r, i = t.order) {
  return t.x = e, t.y = n, t.z = r, t.order = i, t;
}
function gc(t, e, n = 1e-6) {
  return t.order === e.order && Math.abs(t.x - e.x) <= n && Math.abs(t.y - e.y) <= n && Math.abs(t.z - e.z) <= n;
}
const Ui = {
  XYZ: ["X", "Y", "Z"],
  YXZ: ["Y", "X", "Z"],
  ZXY: ["Z", "X", "Y"],
  ZYX: ["Z", "Y", "X"],
  YZX: ["Y", "Z", "X"],
  XZY: ["X", "Z", "Y"]
}, Wt = {
  X: new Float32Array([1, 0, 0]),
  Y: new Float32Array([0, 1, 0]),
  Z: new Float32Array([0, 0, 1])
}, bc = X(new Float32Array(16)), wc = X(new Float32Array(16)), xc = X(new Float32Array(16)), wn = X(new Float32Array(16)), vc = new Float32Array(4), yc = new Float32Array(4), $c = new Float32Array(4), er = new Float32Array(4);
function Ue(t, e) {
  return e === "X" ? t.x : e === "Y" ? t.y : t.z;
}
function jt(t, e, n) {
  return t === "X" ? Bn(n, e) : t === "Y" ? Rn(n, e) : Gn(n, e);
}
function Tc(t, e) {
  const n = Ui[e.order], r = jt(n[0], Ue(e, n[0]), bc), i = jt(n[1], Ue(e, n[1]), wc), s = jt(n[2], Ue(e, n[2]), xc);
  return Q(wn, r, i), Q(t, wn, s);
}
function Sc(t, e) {
  const n = Ui[e.order], r = vt(vc, Wt[n[0]], Ue(e, n[0])), i = vt(yc, Wt[n[1]], Ue(e, n[1])), s = vt($c, Wt[n[2]], Ue(e, n[2]));
  return $e(er, r, i), $e(t, er, s);
}
function Oi(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[4], a = e[5], o = e[6], l = e[8], c = e[9], h = e[10], d = (p) => p < -1 ? -1 : p > 1 ? 1 : p, f = 0.9999999;
  switch (t.order) {
    case "XYZ":
      t.y = Math.asin(d(l)), Math.abs(l) < f ? (t.x = Math.atan2(-c, h), t.z = Math.atan2(-s, n)) : (t.x = Math.atan2(o, a), t.z = 0);
      break;
    case "YXZ":
      t.x = Math.asin(-d(c)), Math.abs(c) < f ? (t.y = Math.atan2(l, h), t.z = Math.atan2(r, a)) : (t.y = Math.atan2(-i, n), t.z = 0);
      break;
    case "ZXY":
      t.x = Math.asin(d(o)), Math.abs(o) < f ? (t.y = Math.atan2(-i, h), t.z = Math.atan2(-s, a)) : (t.y = 0, t.z = Math.atan2(r, n));
      break;
    case "ZYX":
      t.y = Math.asin(-d(i)), Math.abs(i) < f ? (t.x = Math.atan2(o, h), t.z = Math.atan2(r, n)) : (t.x = 0, t.z = Math.atan2(-s, a));
      break;
    case "YZX":
      t.z = Math.asin(d(r)), Math.abs(r) < f ? (t.x = Math.atan2(-c, a), t.y = Math.atan2(-i, n)) : (t.x = 0, t.y = Math.atan2(l, h));
      break;
    case "XZY":
      t.z = Math.asin(-d(s)), Math.abs(s) < f ? (t.x = Math.atan2(o, a), t.y = Math.atan2(l, n)) : (t.x = Math.atan2(-c, h), t.y = 0);
      break;
  }
  return t;
}
function Ac(t, e) {
  return Oi(t, Ri(wn, e));
}
const Bm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EULER_ORDERS: fc,
  clone: dc,
  copy: pc,
  create: Gi,
  equals: gc,
  fromQuaternion: Ac,
  fromRotationMatrix: Oi,
  set: mc,
  toMat4: Tc,
  toQuaternion: Sc
}, Symbol.toStringTag, { value: "Module" })), Ut = 1e-12, at = new Float32Array(3), _c = new Float32Array(9);
function we(t = 0, e = 0, n = 1, r = 0) {
  return { normal: new Float32Array([t, e, n]), constant: r };
}
function Ec(t) {
  return { normal: new Float32Array([t.normal[0], t.normal[1], t.normal[2]]), constant: t.constant };
}
function Vn(t, e) {
  return t.normal[0] = e.normal[0], t.normal[1] = e.normal[1], t.normal[2] = e.normal[2], t.constant = e.constant, t;
}
function Lc(t, e, n) {
  return t.normal[0] = e[0], t.normal[1] = e[1], t.normal[2] = e[2], t.constant = n, t;
}
function Ii(t, e, n, r, i) {
  return t.normal[0] = e, t.normal[1] = n, t.normal[2] = r, t.constant = i, t;
}
function Pc(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]), i = r < Ut ? 1 : 1 / r;
  return t.normal[0] = e[0] * i, t.normal[1] = e[1] * i, t.normal[2] = e[2] * i, t.constant = -ue(t.normal, n), t;
}
function Mc(t, e, n, r) {
  const i = new Float32Array([n[0] - e[0], n[1] - e[1], n[2] - e[2]]), s = new Float32Array([r[0] - e[0], r[1] - e[1], r[2] - e[2]]);
  di(t.normal, i, s);
  const a = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  return a < Ut ? null : (t.normal[0] = t.normal[0] / a, t.normal[1] = t.normal[1] / a, t.normal[2] = t.normal[2] / a, t.constant = -ue(t.normal, e), t);
}
function Di(t, e) {
  const n = Math.hypot(e.normal[0], e.normal[1], e.normal[2]);
  if (n < Ut) return null;
  const r = 1 / n;
  return t.normal[0] = e.normal[0] * r, t.normal[1] = e.normal[1] * r, t.normal[2] = e.normal[2] * r, t.constant = e.constant * r, t;
}
function Cc(t, e) {
  return t.normal[0] = -e.normal[0], t.normal[1] = -e.normal[1], t.normal[2] = -e.normal[2], t.constant = -e.constant, t;
}
function ce(t, e) {
  return ue(t.normal, e) + t.constant;
}
function Fc(t, e, n) {
  const r = ce(e, n);
  return t[0] = n[0] - e.normal[0] * r, t[1] = n[1] - e.normal[1] * r, t[2] = n[2] - e.normal[2] * r, t;
}
function Vi(t, e) {
  return t[0] = e.normal[0] * -e.constant, t[1] = e.normal[1] * -e.constant, t[2] = e.normal[2] * -e.constant, t;
}
function Bc(t, e, n) {
  return Vn(t, e), t.constant -= ue(n, e.normal), t;
}
function Rc(t, e, n) {
  const r = ce(t, e), i = ce(t, n);
  return r === 0 ? 0 : i === 0 ? 1 : r > 0 == i > 0 ? null : r / (r - i);
}
function Gc(t, e, n) {
  const r = Fn(_c, n);
  if (!r)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the matrix is singular, so the transformed plane is undefined."
    );
  Vi(at, e), Cn(at, at, n), pi(t.normal, e.normal, r);
  const i = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  if (i < Ut)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the transformed normal is degenerate (the matrix collapses the plane)."
    );
  return t.normal[0] = t.normal[0] / i, t.normal[1] = t.normal[1] / i, t.normal[2] = t.normal[2] / i, t.constant = -ue(t.normal, at), t;
}
function Ni(t, e, n = 1e-6) {
  const r = Math.abs(t.normal[0] - e.normal[0]) <= n && Math.abs(t.normal[1] - e.normal[1]) <= n && Math.abs(t.normal[2] - e.normal[2]) <= n && Math.abs(t.constant - e.constant) <= n, i = Math.abs(t.normal[0] + e.normal[0]) <= n && Math.abs(t.normal[1] + e.normal[1]) <= n && Math.abs(t.normal[2] + e.normal[2]) <= n && Math.abs(t.constant + e.constant) <= n;
  return r || i;
}
function Uc(t) {
  return `plane(${t.normal[0]}, ${t.normal[1]}, ${t.normal[2]}, ${t.constant})`;
}
const Rm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Gc,
  clone: Ec,
  coplanarPoint: Vi,
  copy: Vn,
  create: we,
  distanceToPoint: ce,
  equals: Ni,
  intersectLineSegment: Rc,
  negate: Cc,
  normalize: Di,
  projectPoint: Fc,
  set: Lc,
  setComponents: Ii,
  setFromCoplanarPoints: Mc,
  setFromNormalAndCoplanarPoint: Pc,
  toString: Uc,
  translate: Bc
}, Symbol.toStringTag, { value: "Module" })), re = new Float32Array(3);
function Oc() {
  return Te({ min: new Float32Array(3), max: new Float32Array(3) });
}
function Te(t) {
  return t.min[0] = Number.POSITIVE_INFINITY, t.min[1] = Number.POSITIVE_INFINITY, t.min[2] = Number.POSITIVE_INFINITY, t.max[0] = Number.NEGATIVE_INFINITY, t.max[1] = Number.NEGATIVE_INFINITY, t.max[2] = Number.NEGATIVE_INFINITY, t;
}
function U(t) {
  return t.max[0] < t.min[0] || t.max[1] < t.min[1] || t.max[2] < t.min[2];
}
function Ic(t) {
  return {
    min: new Float32Array([t.min[0], t.min[1], t.min[2]]),
    max: new Float32Array([t.max[0], t.max[1], t.max[2]])
  };
}
function At(t, e) {
  return t.min[0] = e.min[0], t.min[1] = e.min[1], t.min[2] = e.min[2], t.max[0] = e.max[0], t.max[1] = e.max[1], t.max[2] = e.max[2], t;
}
function Dc(t, e, n) {
  return t.min[0] = e[0], t.min[1] = e[1], t.min[2] = e[2], t.max[0] = n[0], t.max[1] = n[1], t.max[2] = n[2], t;
}
function Vc(t, e, n) {
  const r = n[0] * 0.5, i = n[1] * 0.5, s = n[2] * 0.5;
  return t.min[0] = e[0] - r, t.min[1] = e[1] - i, t.min[2] = e[2] - s, t.max[0] = e[0] + r, t.max[1] = e[1] + i, t.max[2] = e[2] + s, t;
}
function Nc(t, e) {
  Te(t);
  for (const n of e) Nn(t, n);
  return t;
}
function zc(t, e, n = 3) {
  Te(t);
  const r = Math.max(1, Math.trunc(n));
  for (let i = 0; i + 2 < e.length; i += r)
    t.min[0] = Math.min(t.min[0], e[i]), t.min[1] = Math.min(t.min[1], e[i + 1]), t.min[2] = Math.min(t.min[2], e[i + 2]), t.max[0] = Math.max(t.max[0], e[i]), t.max[1] = Math.max(t.max[1], e[i + 1]), t.max[2] = Math.max(t.max[2], e[i + 2]);
  return t;
}
function zi(t, e) {
  return U(e) || (t[0] = (e.min[0] + e.max[0]) * 0.5, t[1] = (e.min[1] + e.max[1]) * 0.5, t[2] = (e.min[2] + e.max[2]) * 0.5), t;
}
function kc(t, e) {
  return U(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, t) : oe(t, e.max, e.min);
}
function Wc(t, e) {
  return U(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, -1) : (zi(t, e), Math.hypot(e.max[0] - t[0], e.max[1] - t[1], e.max[2] - t[2]));
}
function Nn(t, e) {
  return Ft(t.min, t.min, e), Bt(t.max, t.max, e), t;
}
function jc(t, e) {
  return Ye(t.min, t.min, e), Ye(t.max, t.max, e), t;
}
function qc(t, e) {
  return t.min[0] = t.min[0] - e, t.min[1] = t.min[1] - e, t.min[2] = t.min[2] - e, t.max[0] = t.max[0] + e, t.max[1] = t.max[1] + e, t.max[2] = t.max[2] + e, t;
}
function Xc(t, e) {
  return e[0] >= t.min[0] && e[0] <= t.max[0] && e[1] >= t.min[1] && e[1] <= t.max[1] && e[2] >= t.min[2] && e[2] <= t.max[2];
}
function Yc(t, e) {
  return t.min[0] <= e.min[0] && e.max[0] <= t.max[0] && t.min[1] <= e.min[1] && e.max[1] <= t.max[1] && t.min[2] <= e.min[2] && e.max[2] <= t.max[2];
}
function ki(t, e) {
  return U(t) || U(e) ? !1 : e.max[0] >= t.min[0] && e.min[0] <= t.max[0] && e.max[1] >= t.min[1] && e.min[1] <= t.max[1] && e.max[2] >= t.min[2] && e.min[2] <= t.max[2];
}
function Hc(t, e, n) {
  return U(t) ? !1 : Ct(zn(re, t, e), e) <= n * n;
}
function Zc(t, e) {
  if (U(t)) return !1;
  let n = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < 8; i++) {
    re[0] = i & 1 ? t.max[0] : t.min[0], re[1] = i & 2 ? t.max[1] : t.min[1], re[2] = i & 4 ? t.max[2] : t.min[2];
    const s = ce(e, re);
    n = Math.min(n, s), r = Math.max(r, s);
  }
  return n <= 0 && r >= 0;
}
function zn(t, e, n) {
  return U(e) || (t[0] = Math.min(Math.max(n[0], e.min[0]), e.max[0]), t[1] = Math.min(Math.max(n[1], e.min[1]), e.max[1]), t[2] = Math.min(Math.max(n[2], e.min[2]), e.max[2])), t;
}
function Qc(t, e) {
  return U(t) ? 0 : Math.sqrt(Ct(zn(re, t, e), e));
}
function Kc(t, e, n) {
  return At(t, e), Ye(t.min, t.min, n), Ye(t.max, t.max, n), t;
}
function Jc(t, e, n) {
  return U(e) ? At(t, n) : U(n) ? At(t, e) : (Ft(t.min, e.min, n.min), Bt(t.max, e.max, n.max), t);
}
function el(t, e, n) {
  return ki(e, n) ? (Bt(t.min, e.min, n.min), Ft(t.max, e.max, n.max), t) : Te(t);
}
function tl(t, e, n) {
  if (U(e)) return Te(t);
  const r = e.min[0], i = e.min[1], s = e.min[2], a = e.max[0], o = e.max[1], l = e.max[2];
  Te(t);
  for (let c = 0; c < 8; c++) {
    const h = c & 1 ? a : r, d = c & 2 ? o : i, f = c & 4 ? l : s, p = n[3] * h + n[7] * d + n[11] * f + n[15], m = p === 0 ? 1 : 1 / p;
    re[0] = (n[0] * h + n[4] * d + n[8] * f + n[12]) * m, re[1] = (n[1] * h + n[5] * d + n[9] * f + n[13]) * m, re[2] = (n[2] * h + n[6] * d + n[10] * f + n[14]) * m, Nn(t, re);
  }
  return t;
}
function nl(t, e, n) {
  if (Tt(t.min, e.min, n), Tt(t.max, e.max, n), n < 0) {
    const r = t.min[0], i = t.min[1], s = t.min[2];
    t.min[0] = t.max[0], t.min[1] = t.max[1], t.min[2] = t.max[2], t.max[0] = r, t.max[1] = i, t.max[2] = s;
  }
  return t;
}
function rl(t, e, n = 1e-6) {
  const r = U(t), i = U(e);
  return r || i ? r === i : Math.abs(t.min[0] - e.min[0]) <= n && Math.abs(t.min[1] - e.min[1]) <= n && Math.abs(t.min[2] - e.min[2]) <= n && Math.abs(t.max[0] - e.max[0]) <= n && Math.abs(t.max[1] - e.max[1]) <= n && Math.abs(t.max[2] - e.max[2]) <= n;
}
function il(t) {
  return U(t) ? "box3(empty)" : `box3(${t.min[0]}, ${t.min[1]}, ${t.min[2]}) - (${t.max[0]}, ${t.max[1]}, ${t.max[2]})`;
}
const Gm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: tl,
  clampPoint: zn,
  clone: Ic,
  containsBox: Yc,
  containsPoint: Xc,
  copy: At,
  create: Oc,
  distanceToPoint: Qc,
  equals: rl,
  expandByPoint: Nn,
  expandByScalar: qc,
  expandByVector: jc,
  getBoundingSphere: Wc,
  getCenter: zi,
  getSize: kc,
  intersect: el,
  intersectsBox: ki,
  intersectsPlane: Zc,
  intersectsSphere: Hc,
  isEmpty: U,
  makeEmpty: Te,
  scaleBox: nl,
  set: Dc,
  setFromArray: zc,
  setFromCenterAndSize: Vc,
  setFromPoints: Nc,
  toString: il,
  translate: Kc,
  union: Jc
}, Symbol.toStringTag, { value: "Module" }));
function sl(t = 0, e = 0, n = 0, r = 0, i = 0, s = -1) {
  return {
    origin: new Float32Array([t, e, n]),
    direction: new Float32Array([r, i, s])
  };
}
function al(t) {
  return {
    origin: new Float32Array([t.origin[0], t.origin[1], t.origin[2]]),
    direction: new Float32Array([t.direction[0], t.direction[1], t.direction[2]])
  };
}
function ol(t, e) {
  return t.origin[0] = e.origin[0], t.origin[1] = e.origin[1], t.origin[2] = e.origin[2], t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t;
}
function Ot(t, e, n) {
  t.origin[0] = e[0], t.origin[1] = e[1], t.origin[2] = e[2];
  const r = Math.hypot(n[0], n[1], n[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = n[0] * i, t.direction[1] = n[1] * i, t.direction[2] = n[2] * i, t;
}
function kn(t, e, n) {
  return t[0] = e.origin[0] + e.direction[0] * n, t[1] = e.origin[1] + e.direction[1] * n, t[2] = e.origin[2] + e.direction[2] * n, t;
}
function cl(t, e, n) {
  const r = e.origin[0], i = e.origin[1], s = e.origin[2];
  return t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t.origin[0] = r + t.direction[0] * n, t.origin[1] = i + t.direction[1] * n, t.origin[2] = s + t.direction[2] * n, t;
}
function Wi(t, e, n) {
  const r = Math.max(0, ue(oe(qi, n, e.origin), e.direction));
  return kn(t, e, r);
}
function ll(t, e) {
  return Math.sqrt(ji(t, e));
}
function ji(t, e) {
  return Ct(e, Wi(qi, t, e));
}
const qi = new Float32Array(3);
function ul(t, e, n) {
  Cn(t.origin, e.origin, n), mi(t.direction, e.direction, n);
  const r = Math.hypot(t.direction[0], t.direction[1], t.direction[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = t.direction[0] * i, t.direction[1] = t.direction[1] * i, t.direction[2] = t.direction[2] * i, t;
}
function Xi(t, e) {
  const n = ue(e.normal, t.direction);
  if (Math.abs(n) < 1e-12) return null;
  const r = -ce(e, t.origin) / n;
  return r >= 0 ? r : null;
}
function Yi(t, e, n) {
  const r = t.origin[0] - e[0], i = t.origin[1] - e[1], s = t.origin[2] - e[2], a = t.direction[0], o = t.direction[1], l = t.direction[2], c = r * a + i * o + s * l, h = r * r + i * i + s * s - n * n, d = c * c - h;
  if (d < 0) return null;
  const f = Math.sqrt(d), p = -c - f;
  if (p >= 0) return p;
  const m = -c + f;
  return m >= 0 ? m : null;
}
function Hi(t, e) {
  if (U(e)) return null;
  let n = 0, r = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 3; i++) {
    const s = t.origin[i], a = t.direction[i], o = e.min[i], l = e.max[i];
    if (Math.abs(a) < 1e-12) {
      if (s < o || s > l) return null;
      continue;
    }
    const c = 1 / a;
    let h = (o - s) * c, d = (l - s) * c;
    if (h > d) {
      const f = h;
      h = d, d = f;
    }
    if (h > n && (n = h), d < r && (r = d), n > r) return null;
  }
  return Number.isFinite(r) ? n : null;
}
function Zi(t, e, n, r, i = !1) {
  const s = n[0] - e[0], a = n[1] - e[1], o = n[2] - e[2], l = r[0] - e[0], c = r[1] - e[1], h = r[2] - e[2], d = t.direction[0], f = t.direction[1], p = t.direction[2], m = f * h - p * c, g = p * l - d * h, b = d * c - f * l, w = s * m + a * g + o * b;
  if (i ? w < 1e-12 : Math.abs(w) < 1e-12) return null;
  const $ = 1 / w, S = t.origin[0] - e[0], A = t.origin[1] - e[1], _ = t.origin[2] - e[2], P = (S * m + A * g + _ * b) * $;
  if (P < 0 || P > 1) return null;
  const M = A * o - _ * a, D = _ * s - S * o, V = S * a - A * s, N = (d * M + f * D + p * V) * $;
  if (N < 0 || P + N > 1) return null;
  const z = (l * M + c * D + h * V) * $;
  return z >= 0 ? z : null;
}
function hl(t, e, n = 1e-6) {
  return Math.abs(t.origin[0] - e.origin[0]) <= n && Math.abs(t.origin[1] - e.origin[1]) <= n && Math.abs(t.origin[2] - e.origin[2]) <= n && Math.abs(t.direction[0] - e.direction[0]) <= n && Math.abs(t.direction[1] - e.direction[1]) <= n && Math.abs(t.direction[2] - e.direction[2]) <= n;
}
function fl(t) {
  return `ray(origin: ${t.origin[0]}, ${t.origin[1]}, ${t.origin[2]}; direction: ${t.direction[0]}, ${t.direction[1]}, ${t.direction[2]})`;
}
function dl(t) {
  return Number.isFinite(t.origin[0]) && Number.isFinite(t.origin[1]) && Number.isFinite(t.origin[2]) && Number.isFinite(t.direction[0]) && Number.isFinite(t.direction[1]) && Number.isFinite(t.direction[2]) && hi(t.direction) > 1e-24;
}
const Um = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: ul,
  at: kn,
  clone: al,
  closestPointToPoint: Wi,
  copy: ol,
  create: sl,
  distanceToPoint: ll,
  equals: hl,
  intersectBox: Hi,
  intersectPlane: Xi,
  intersectSphere: Yi,
  intersectTriangle: Zi,
  isWellFormed: dl,
  recast: cl,
  set: Ot,
  squaredDistanceToPoint: ji,
  toString: fl
}, Symbol.toStringTag, { value: "Module" })), pl = {
  Left: 0,
  Right: 1,
  Bottom: 2,
  Top: 3,
  Near: 4,
  Far: 5
};
function Qi() {
  return {
    planes: [
      we(),
      we(),
      we(),
      we(),
      we(),
      we()
    ]
  };
}
function ml(t) {
  const e = Qi();
  return Ki(e, t);
}
function Ki(t, e) {
  for (let n = 0; n < 6; n++) Vn(t.planes[n], e.planes[n]);
  return t;
}
function gl(t, e, n = "gl") {
  const r = [e[0], e[4], e[8], e[12]], i = [e[1], e[5], e[9], e[13]], s = [e[2], e[6], e[10], e[14]], a = [e[3], e[7], e[11], e[15]], o = (c, h, d) => [
    c[0] + d * h[0],
    c[1] + d * h[1],
    c[2] + d * h[2],
    c[3] + d * h[3]
  ], l = [
    o(a, r, 1),
    // left：row3 + row0
    o(a, r, -1),
    // right
    o(a, i, 1),
    // bottom
    o(a, i, -1),
    // top
    // 近平面：GL 的 NDC 是 z ≥ -1（row3 + row2），ZO 的是 z ≥ 0（只看 row2）。
    n === "zo" ? [s[0], s[1], s[2], s[3]] : o(a, s, 1),
    o(a, s, -1)
    // far
  ];
  for (let c = 0; c < 6; c++) {
    const [h, d, f, p] = l[c];
    Ii(t.planes[c], h, d, f, p), Di(t.planes[c], t.planes[c]);
  }
  return t;
}
function bl(t, e) {
  for (const n of t.planes)
    if (ce(n, e) < 0) return !1;
  return !0;
}
function wl(t, e, n) {
  for (const r of t.planes)
    if (ce(r, e) < -n) return !1;
  return !0;
}
function xl(t, e) {
  for (const n of t.planes) {
    const r = n.normal[0], i = n.normal[1], s = n.normal[2], a = r >= 0 ? e.max[0] : e.min[0], o = i >= 0 ? e.max[1] : e.min[1], l = s >= 0 ? e.max[2] : e.min[2];
    if (r * a + i * o + s * l + n.constant < 0) return !1;
  }
  return !0;
}
function vl(t, e) {
  const n = yl(t);
  if (!n) return !0;
  let r = !1, i = !1;
  for (const s of n) {
    const a = ce(e, s);
    if (a > 0 ? r = !0 : a < 0 && (i = !0), r && i) return !0;
  }
  return !1;
}
function yl(t) {
  const [e, n, r, i, s, a] = t.planes, o = [];
  for (const l of [s, a])
    for (const c of [r, i])
      for (const h of [e, n]) {
        const d = $l(h, c, l);
        if (!d) return null;
        o.push(d);
      }
  return o;
}
function $l(t, e, n) {
  const r = t.normal[0], i = t.normal[1], s = t.normal[2], a = e.normal[0], o = e.normal[1], l = e.normal[2], c = n.normal[0], h = n.normal[1], d = n.normal[2], f = r * (o * d - l * h) - i * (a * d - l * c) + s * (a * h - o * c);
  if (Math.abs(f) < 1e-12) return null;
  const p = 1 / f, m = -t.constant, g = -e.constant, b = -n.constant;
  return new Float32Array([
    (m * (o * d - l * h) - i * (g * d - l * b) + s * (g * h - o * b)) * p,
    (r * (g * d - l * b) - m * (a * d - l * c) + s * (a * b - g * c)) * p,
    (r * (o * b - g * h) - i * (a * b - g * c) + m * (a * h - o * c)) * p
  ]);
}
function Tl(t, e, n = 1e-6) {
  for (let r = 0; r < 6; r++)
    if (!Ni(t.planes[r], e.planes[r], n)) return !1;
  return !0;
}
const Om = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FRUSTUM_PLANE: pl,
  clone: ml,
  containsPoint: bl,
  copy: Ki,
  create: Qi,
  equals: Tl,
  intersectsBox: xl,
  intersectsPlane: vl,
  intersectsSphere: wl,
  setFromProjectionView: gl
}, Symbol.toStringTag, { value: "Module" })), Sl = {
  transparent: [0, 0, 0],
  black: [0, 0, 0],
  white: [1, 1, 1],
  red: [1, 0, 0],
  green: [0, 0.5019607843137255, 0],
  lime: [0, 1, 0],
  blue: [0, 0, 1],
  yellow: [1, 1, 0],
  cyan: [0, 1, 1],
  aqua: [0, 1, 1],
  magenta: [1, 0, 1],
  fuchsia: [1, 0, 1],
  gray: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255],
  grey: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255],
  silver: [0.7529411764705882, 0.7529411764705882, 0.7529411764705882],
  orange: [1, 0.6470588235294118, 0],
  purple: [0.5019607843137255, 0, 0.5019607843137255],
  navy: [0, 0, 0.5019607843137255],
  teal: [0, 0.5019607843137255, 0.5019607843137255]
};
function Al(t = 0, e = 0, n = 0, r = 1) {
  return { r: t, g: e, b: n, a: r };
}
function _l(t) {
  return { r: t.r, g: t.g, b: t.b, a: t.a };
}
function El(t, e) {
  return t.r = e.r, t.g = e.g, t.b = e.b, t.a = e.a, t;
}
function Ll(t, e, n, r, i = 1) {
  return t.r = e, t.g = n, t.b = r, t.a = i, t;
}
function Pl(t, e, n, r) {
  return t.r = e, t.g = n, t.b = r, t;
}
function Ml(t, e, n) {
  const r = Math.trunc(e);
  return t.r = (r >> 16 & 255) / 255, t.g = (r >> 8 & 255) / 255, t.b = (r & 255) / 255, n !== void 0 && (t.a = n), t;
}
function Cl(t) {
  const e = (n) => Math.round(Math.min(Math.max(n, 0), 1) * 255);
  return e(t.r) << 16 | e(t.g) << 8 | e(t.b);
}
function Fl(t, e) {
  const n = e.trim().toLowerCase(), r = Sl[n];
  if (r)
    return t.r = r[0], t.g = r[1], t.b = r[2], n === "transparent" && (t.a = 0), t;
  if (n.startsWith("#")) {
    const s = n.slice(1);
    if (/^[0-9a-f]+$/.test(s)) {
      const a = (o) => parseInt(o + o, 16) / 255;
      if (s.length === 3 || s.length === 4)
        return t.r = a(s[0]), t.g = a(s[1]), t.b = a(s[2]), s.length === 4 && (t.a = a(s[3])), t;
      if (s.length === 6 || s.length === 8) {
        const o = (l) => parseInt(s.slice(l, l + 2), 16) / 255;
        return t.r = o(0), t.g = o(2), t.b = o(4), s.length === 8 && (t.a = o(6)), t;
      }
    }
    throw new RangeError(`[gpu-device-api] color.setStyle: cannot parse "${e}" as a hex color.`);
  }
  const i = /^rgba?\(([^)]+)\)$/.exec(n);
  if (i) {
    const s = i[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (s.length >= 3 && s.slice(0, 3).every((a) => Number.isFinite(a)))
      return t.r = s[0] / 255, t.g = s[1] / 255, t.b = s[2] / 255, s.length >= 4 && Number.isFinite(s[3]) && (t.a = s[3]), t;
    throw new RangeError(`[gpu-device-api] color.setStyle: cannot parse "${e}" as an rgb()/rgba() color.`);
  }
  throw new RangeError(
    `[gpu-device-api] color.setStyle: unknown color "${e}". Supported: #rgb / #rrggbb / #rrggbbaa, rgb() / rgba(), and a small set of CSS color names.`
  );
}
function Bl(t, e = !1) {
  const n = (s) => Math.round(Math.min(Math.max(s, 0), 1) * 255), r = (s) => s.toString(16).padStart(2, "0"), i = `#${r(n(t.r))}${r(n(t.g))}${r(n(t.b))}`;
  return e ? `${i}${r(n(t.a))}` : i;
}
function Rl(t, e) {
  return t.r = Math.min(Math.max(e.r, 0), 1), t.g = Math.min(Math.max(e.g, 0), 1), t.b = Math.min(Math.max(e.b, 0), 1), t.a = Math.min(Math.max(e.a, 0), 1), t;
}
function Gl(t, e, n, r) {
  return t.r = e.r + (n.r - e.r) * r, t.g = e.g + (n.g - e.g) * r, t.b = e.b + (n.b - e.b) * r, t.a = e.a + (n.a - e.a) * r, t;
}
function Ul(t, e, n) {
  return t.r = e.r + n.r, t.g = e.g + n.g, t.b = e.b + n.b, t.a = e.a + n.a, t;
}
function Ol(t, e, n) {
  return t.r = e.r * n.r, t.g = e.g * n.g, t.b = e.b * n.b, t.a = e.a * n.a, t;
}
function Il(t, e, n, r, i = t.a) {
  const s = (e % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), a = Math.min(Math.max(n, 0), 1), o = Math.min(Math.max(r, 0), 1);
  if (a === 0)
    return t.r = o, t.g = o, t.b = o, t.a = i, t;
  const l = o < 0.5 ? o * (1 + a) : o + a - o * a, c = 2 * o - l, h = (f) => {
    let p = f;
    return p < 0 && (p += 1), p > 1 && (p -= 1), p < 1 / 6 ? c + (l - c) * 6 * p : p < 1 / 2 ? l : p < 2 / 3 ? c + (l - c) * (2 / 3 - p) * 6 : c;
  }, d = s / (Math.PI * 2);
  return t.r = h(d + 1 / 3), t.g = h(d), t.b = h(d - 1 / 3), t.a = i, t;
}
function Dl(t, e) {
  const n = Math.max(e.r, e.g, e.b), r = Math.min(e.r, e.g, e.b), i = (r + n) / 2, s = n - r;
  if (s === 0)
    return t[0] = 0, t[1] = 0, t[2] = i, t;
  const a = i <= 0.5 ? s / (n + r) : s / (2 - n - r);
  let o;
  return n === e.r ? o = (e.g - e.b) / s + (e.g < e.b ? 6 : 0) : n === e.g ? o = (e.b - e.r) / s + 2 : o = (e.r - e.g) / s + 4, t[0] = o / 6 * Math.PI * 2, t[1] = a, t[2] = i, t;
}
function Vl(t, e, n = !0) {
  const r = e ?? new Float32Array(n ? 4 : 3);
  return r[0] = t.r, r[1] = t.g, r[2] = t.b, n && r.length >= 4 && (r[3] = t.a), r;
}
function Nl(t, e, n = 0) {
  return t.r = e[n] ?? 0, t.g = e[n + 1] ?? 0, t.b = e[n + 2] ?? 0, e.length > n + 3 && (t.a = e[n + 3]), t;
}
function zl(t, e) {
  const n = (r) => r < 0.04045 ? r * 0.0773993808 : Math.pow(r * 0.9478672986 + 0.0521327014, 2.4);
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function kl(t, e) {
  const n = (r) => r <= 31308e-7 ? r * 12.92 : 1.055 * Math.pow(r, 0.41666) - 0.055;
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function Wl(t, e = 1e-6) {
  return t.r >= -e && t.r <= 1 + e && t.g >= -e && t.g <= 1 + e && t.b >= -e && t.b <= 1 + e;
}
function jl(t, e, n = 1e-6) {
  return Math.abs(t.r - e.r) <= n && Math.abs(t.g - e.g) <= n && Math.abs(t.b - e.b) <= n && Math.abs(t.a - e.a) <= n;
}
function ql(t) {
  return `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
}
const Im = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ul,
  clampColor: Rl,
  clone: _l,
  convertLinearToSRGB: kl,
  convertSRGBToLinear: zl,
  copy: El,
  create: Al,
  equals: jl,
  fromArray: Nl,
  getHSL: Dl,
  getHex: Cl,
  getStyle: Bl,
  isInGamut: Wl,
  lerp: Gl,
  multiply: Ol,
  set: Ll,
  setHSL: Il,
  setHex: Ml,
  setRGB: Pl,
  setStyle: Fl,
  toArray: Vl,
  toString: ql
}, Symbol.toStringTag, { value: "Module" })), Xl = new Float32Array(16), tr = new Float32Array(16), Yl = { origin: new Float32Array(3), direction: new Float32Array(3) }, ve = new Float32Array(3), _t = new Float32Array(3), nr = new Float32Array(3), rr = new Float32Array(3), Ji = new Float32Array(3);
function Hl(t = 0, e = 0, n = 0, r = -1) {
  return {
    ray: { origin: new Float32Array([t, e, n]), direction: new Float32Array([0, 0, r]) },
    near: 0,
    far: Number.POSITIVE_INFINITY,
    doubleSided: !0
  };
}
function Zl(t) {
  return {
    ray: { origin: new Float32Array(t.ray.origin), direction: new Float32Array(t.ray.direction) },
    near: t.near,
    far: t.far,
    doubleSided: t.doubleSided
  };
}
function Ql(t, e) {
  return Ot(t.ray, e.ray.origin, e.ray.direction), t.near = e.near, t.far = e.far, t.doubleSided = e.doubleSided, t;
}
function Wn(t, e, n) {
  return Ot(t.ray, e, n), t;
}
function Kl(t, e, n) {
  return Wn(t, e, oe(Ji, n, e));
}
function Jl(t, e, n, r, i = "gl") {
  const s = i === "zo" ? 0 : -1, a = 1;
  return Et(ve, e, n, s, r), Et(_t, e, n, a, r), Wn(t, ve, oe(Ji, _t, ve));
}
function Et(t, e, n, r, i) {
  const s = i[3] * e + i[7] * n + i[11] * r + i[15], a = s === 0 ? 1 : 1 / s;
  return t[0] = (i[0] * e + i[4] * n + i[8] * r + i[12]) * a, t[1] = (i[1] * e + i[5] * n + i[9] * r + i[13]) * a, t[2] = (i[2] * e + i[6] * n + i[10] * r + i[14]) * a, t;
}
function eu(t, e, n) {
  const r = Yi(t.ray, e, n);
  return r !== null && It(t, r) ? r : null;
}
function tu(t, e) {
  const n = Hi(t.ray, e);
  return n !== null && It(t, n) ? n : null;
}
function nu(t, e) {
  const n = Xi(t.ray, e);
  return n !== null && It(t, n) ? n : null;
}
function It(t, e) {
  return e >= t.near && e <= t.far;
}
function es(t, e, n, r, i = []) {
  i.length = 0;
  const s = r ? iu(Yl, t.ray, r) : t.ray;
  if (!s) return i;
  const a = Math.floor(e.length / 3), o = Math.floor(n ? n.length / 3 : a / 3), l = !t.doubleSided;
  for (let c = 0; c < o; c++) {
    const h = n ? n[c * 3] ?? 0 : c * 3, d = n ? n[c * 3 + 1] ?? 0 : c * 3 + 1, f = n ? n[c * 3 + 2] ?? 0 : c * 3 + 2;
    if (h >= a || d >= a || f >= a) continue;
    qt(_t, e, h), qt(nr, e, d), qt(rr, e, f);
    const p = Zi(s, _t, nr, rr, l);
    if (p === null) continue;
    kn(ve, s, p);
    const m = new Float32Array([ve[0], ve[1], ve[2]]);
    r && Et(m, m[0], m[1], m[2], r);
    const g = fi(t.ray.origin, m);
    It(t, g) && i.push({ distance: g, point: m, triangleIndex: c, vertexIndices: [h, d, f] });
  }
  return i.sort((c, h) => c.distance - h.distance), i;
}
function ru(t, e, n, r) {
  const i = es(t, e, n, r, []);
  return i.length > 0 ? i[0] : null;
}
function iu(t, e, n) {
  const r = Rt(Xl, n);
  if (!r) return null;
  const i = Et(
    new Float32Array(3),
    e.origin[0],
    e.origin[1],
    e.origin[2],
    r
  ), s = su(new Float32Array(3), e.direction, r);
  return Ot(t, i, s);
}
function su(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, Mn(t, t);
}
function qt(t, e, n) {
  return t[0] = e[n * 3] ?? 0, t[1] = e[n * 3 + 1] ?? 0, t[2] = e[n * 3 + 2] ?? 0, t;
}
function au(t, e) {
  return Rt(t, e);
}
function ou(t, e, n) {
  return Q(tr, e, n), Rt(t, tr);
}
const Dm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Zl,
  copy: Ql,
  create: Hl,
  intersectBox: tu,
  intersectPlane: nu,
  intersectSphere: eu,
  intersectTriangles: es,
  intersectTrianglesFirst: ru,
  inverseProjectionView: au,
  inverseProjectionViewOf: ou,
  set: Wn,
  setFromNdc: Jl,
  setFromPoints: Kl
}, Symbol.toStringTag, { value: "Module" })), Vm = 1e-6, cu = Math.PI / 180, lu = 180 / Math.PI;
function ts(t) {
  return t * cu;
}
function Nm(t) {
  return t * lu;
}
function Re(t, e, n) {
  return t < e ? e : t > n ? n : t;
}
function uu(t, e, n) {
  return e === t ? 0 : Re((n - t) / (e - t), 0, 1);
}
function zm(t, e, n) {
  return t + (e - t) * n;
}
function km(t, e, n) {
  const r = uu(t, e, n);
  return r * r * (3 - 2 * r);
}
function Wm(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function ns(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function rs(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function hu(t, e, n) {
  if (e === "wgsl") return t.wgsl;
  const r = rs(n);
  return r ? t[r] : void 0;
}
function fu(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function du(t, e, n, r) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = ns(t) === "glsl" ? `请在 \`code\` 里提供 \`${rs(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${r}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${fu(n)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const pu = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, mu = /^\s*#version[^\n]*\n?/;
function gu(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `#define ${e} ${n ? 1 : 0}` : `#define ${e} ${n}`).join(`
`) : "";
}
function bu(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `const ${e}: bool = ${n};` : typeof n == "number" ? Number.isInteger(n) ? `const ${e}: i32 = ${n};` : `const ${e}: f32 = ${n};` : `const ${e}: f32 = ${n};`).join(`
`) : "";
}
function wu(t, e, n = "shader") {
  const r = /^\s*#version\s+([^\n]*)/.exec(t);
  if (r) {
    const a = r[1].trim();
    if (!/^300\s+es\b/.test(a))
      throw new u(
        `[gpu-device-api] ShaderModule「${n}」声明了 \`#version ${a}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。`
      );
  }
  const i = t.replace(mu, ""), s = gu(e);
  return `${pu}${s ? `${s}
` : ""}${i.trim()}
`;
}
function xu(t, e) {
  const n = bu(e);
  return n ? `${n}

${t.trim()}
` : `${t.trim()}
`;
}
function xn(t) {
  const { backend: e, source: n, stage: r, label: i = "shader" } = t, s = ns(e), a = hu(n, s, r);
  if (a === void 0)
    throw new u(du(e, r, n, i));
  const o = s === "glsl" ? wu(a, t.defines, i) : xu(a, t.defines);
  return { language: s, stage: r, code: o, hasPreamble: s === "glsl" };
}
function jm(t, e, n) {
  const r = e.split(`
`), i = `[gpu-device-api] 着色器「${n}」编译失败：
${t.trim()}
`, s = /* @__PURE__ */ new Set(), a = /ERROR:\s*\d+:(\d+)/g;
  let o;
  for (; (o = a.exec(t)) !== null; ) {
    const c = Number(o[1]);
    c > 0 && s.add(c);
  }
  if (s.size === 0)
    return `${i}
----- 完整源码 -----
${vn(r)}
`;
  const l = [];
  for (const c of [...s].sort((h, d) => h - d)) {
    l.push(`----- 第 ${c} 行附近 -----`);
    const h = Math.max(1, c - 3), d = Math.min(r.length, c + 3);
    l.push(vn(r.slice(h - 1, d), h));
  }
  return `${i}
${l.join(`
`)}
`;
}
function vn(t, e = 1) {
  const n = String(e + t.length - 1).length;
  return t.map((r, i) => `${String(e + i).padStart(n, " ")} | ${r}`).join(`
`);
}
function qm(t) {
  return vn(t.split(`
`));
}
const le = /* @__PURE__ */ new Map();
function vu(t, e) {
  if (le.has(t))
    throw new u(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return le.set(t, e), e;
}
function Xm(t) {
  for (const [e, n] of Object.entries(t)) vu(e, n);
}
function Ym(t, e) {
  return le.set(t, e), e;
}
function Hm(t) {
  return le.has(t);
}
function Zm(t) {
  return le.get(t);
}
function Qm(t) {
  const e = le.get(t);
  if (!e) {
    const n = yu();
    throw new u(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (n.length > 0 ? `已注册：${n.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function Km(t) {
  return le.delete(t);
}
function yu() {
  return [...le.keys()].sort();
}
function Jm() {
  le.clear();
}
function is(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const $u = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, Tu = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, ir = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function eg(t) {
  const e = is(t), n = [], r = [
    { regex: new RegExp(`${$u}\\s*${ir}`, "g"), swapped: !1 },
    { regex: new RegExp(`${Tu}\\s*${ir}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of r) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), l = Number(a[s ? 1 : 2]), c = (a[3] ?? "").trim(), h = a[4], d = a[5].trim().replace(/\s+/g, " ");
      n.some((f) => f.group === o && f.binding === l) || n.push(Su(o, l, c, h, d));
    }
  }
  return n.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function Su(t, e, n, r, i) {
  let s = "handle", a;
  if (n.startsWith("uniform"))
    s = "uniform";
  else if (n.startsWith("storage")) {
    s = "storage";
    const c = n.split(",").map((h) => h.trim())[1];
    c === "read" ? a = "read" : c === "read_write" ? a = "read_write" : c === "write" && (a = "write");
  }
  const o = Au(s, i);
  return {
    group: t,
    binding: e,
    name: r,
    addressSpace: s,
    access: a,
    kind: o,
    type: i,
    depth: i.startsWith("texture_depth"),
    multisampled: i.startsWith("texture_multisampled")
  };
}
function Au(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const sr = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, _u = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function Eu(t) {
  const e = is(t), n = [];
  let r;
  for (sr.lastIndex = 0; (r = sr.exec(e)) !== null; ) {
    const i = r[1], s = r[2] ?? "", a = r[3];
    let o = null;
    if (i === "compute") {
      const l = _u.exec(s);
      o = l ? [Number(l[1]), Number(l[2] ?? 1), Number(l[3] ?? 1)] : [1, 1, 1];
    }
    n.push({ stage: i, name: a, workgroupSize: o });
  }
  return n;
}
function tg(t, e, n) {
  return Eu(t).find((r) => r.stage === e && r.name === n);
}
function ng(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const Lu = {
  5126: "float",
  5124: "int",
  5125: "uint",
  35664: "vec2",
  35665: "vec3",
  35666: "vec4",
  35667: "ivec2",
  35668: "ivec3",
  35669: "ivec4",
  36294: "uvec2",
  36295: "uvec3",
  36296: "uvec4",
  35670: "bool",
  35671: "bvec2",
  35672: "bvec3",
  35673: "bvec4",
  35674: "mat2",
  35675: "mat3",
  35676: "mat4",
  35685: "mat2x3",
  35686: "mat2x4",
  35687: "mat3x2",
  35688: "mat3x4",
  35689: "mat4x2",
  35690: "mat4x3",
  35678: "sampler2D",
  35679: "sampler3D",
  35680: "samplerCube",
  35682: "sampler2DShadow",
  36289: "sampler2DArray",
  36292: "sampler2DArrayShadow",
  36293: "samplerCubeShadow",
  36298: "isampler2D",
  36299: "isampler3D",
  36300: "isamplerCube",
  36303: "isampler2DArray",
  36306: "usampler2D",
  36307: "usampler3D",
  36308: "usamplerCube",
  36311: "usampler2DArray"
};
function Pu(t) {
  return Lu[t] ?? `0x${t.toString(16)}`;
}
const Mu = [
  35678,
  // sampler2D
  35679,
  // sampler3D
  35680,
  // samplerCube
  35682,
  // sampler2DShadow
  36289,
  // sampler2DArray
  36292,
  // sampler2DArrayShadow
  36293,
  // samplerCubeShadow
  36298,
  // isampler2D
  36299,
  // isampler3D
  36300,
  // isamplerCube
  36303,
  // isampler2DArray
  36306,
  // usampler2D
  36307,
  // usampler3D
  36308,
  // usamplerCube
  36311
  // usampler2DArray
];
function ss(t) {
  return Mu.includes(t);
}
function Cu(t, e) {
  const n = [], r = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
  for (let l = 0; l < r; l++) {
    const c = t.getActiveAttrib(e, l);
    c && n.push({
      name: c.name,
      location: t.getAttribLocation(e, c.name),
      glType: c.type,
      size: c.size
    });
  }
  const i = [], s = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
  for (let l = 0; l < s; l++) {
    const c = t.getActiveUniform(e, l);
    c && i.push({
      name: c.name,
      location: t.getUniformLocation(e, c.name),
      glType: c.type,
      size: c.size,
      isArray: /\[\d+\]$/.test(c.name)
    });
  }
  const a = [], o = t.getProgramParameter(e, t.ACTIVE_UNIFORM_BLOCKS);
  for (let l = 0; l < o; l++) {
    const c = t.getActiveUniformBlockName(e, l) ?? `block${l}`;
    a.push({
      name: c,
      index: l,
      dataSize: t.getActiveUniformBlockParameter(e, l, t.UNIFORM_BLOCK_DATA_SIZE),
      activeUniforms: t.getActiveUniformBlockParameter(e, l, t.UNIFORM_BLOCK_ACTIVE_UNIFORMS)
    });
  }
  return { attributes: n, uniforms: i, uniformBlocks: a };
}
function Fu(t) {
  return t.uniforms.filter((e) => ss(e.glType));
}
function Bu(t, e) {
  const n = [];
  t.uniformBlocks.slice().sort((i, s) => i.name.localeCompare(s.name)).forEach((i, s) => {
    n.push({
      binding: s,
      visibility: e,
      type: "uniform",
      name: i.name,
      buffer: { type: "uniform", minBindingSize: i.dataSize }
    });
  });
  const r = Fu(t).sort((i, s) => i.name.localeCompare(s.name));
  return r.forEach((i, s) => {
    n.push({
      binding: t.uniformBlocks.length + s,
      visibility: e,
      type: "texture",
      name: i.name.replace(/\[\d+\]$/, ""),
      texture: { sampleType: "float", viewDimension: "2d" }
    }), n.push({
      binding: t.uniformBlocks.length + r.length + s,
      visibility: e,
      type: "sampler",
      name: `${i.name.replace(/\[\d+\]$/, "")}_sampler`,
      sampler: { type: "filtering" }
    });
  }), n;
}
class Ru {
  factories = /* @__PURE__ */ new Map();
  register(e) {
    return this.factories.set(e.kind, e), this;
  }
  unregister(e) {
    return this.factories.delete(e);
  }
  get(e) {
    return this.factories.get(e);
  }
  has(e) {
    return this.factories.has(e);
  }
  /** 已注册的后端，按注册顺序。 */
  kinds() {
    return [...this.factories.keys()];
  }
  /** 按给定优先级逐个探测，返回第一个可用的后端。 */
  async firstAvailable(e, n) {
    for (const r of e) {
      const i = this.factories.get(r);
      if (!i) continue;
      const s = await i.isAvailable(n);
      if (s.ok) return { factory: i, availability: s };
    }
    return null;
  }
  /** 逐个探测并记录每个后端的结果，用于生成「为什么回退了」的解释。 */
  async probeAll(e, n) {
    const r = [];
    for (const i of e) {
      const s = this.factories.get(i);
      if (!s) {
        r.push({ backend: i, ok: !1, reason: "该后端未注册。" });
        continue;
      }
      const a = await s.isAvailable(n);
      r.push({ backend: i, ok: a.ok, reason: a.reason });
    }
    return r;
  }
}
const me = Object.freeze({
  maxBindGroups: 4,
  maxBindGroupsPlusVertexBuffers: 4,
  maxBindingsPerBindGroup: 16,
  maxDynamicUniformBuffersPerPipelineLayout: 4,
  maxDynamicStorageBuffersPerPipelineLayout: 0,
  maxStorageBuffersPerShaderStage: 0,
  maxStorageTexturesPerShaderStage: 0,
  minStorageBufferOffsetAlignment: 256,
  maxStorageBufferBindingSize: 0,
  maxComputeWorkgroupStorageSize: 0,
  maxComputeInvocationsPerWorkgroup: 0,
  maxComputeWorkgroupSizeX: 0,
  maxComputeWorkgroupSizeY: 0,
  maxComputeWorkgroupSizeZ: 0,
  maxComputeWorkgroupsPerDimension: 0,
  maxColorAttachmentBytesPerSample: 32,
  maxVertexBuffers: 16
});
function B(t, e, n) {
  const r = t.getParameter(e);
  return typeof r == "number" && r > 0 ? r : n;
}
const Gu = 16777215;
function Uu(t) {
  return {
    maxTextureSize: B(t, 3379, 2048),
    max3dTextureSize: B(t, 32883, 256),
    maxArrayTextureLayers: B(t, 35071, 256),
    maxSamples: B(t, 36183, 4),
    maxUniformBufferBindings: B(t, 35375, 12),
    maxUniformBlockSize: B(t, 35376, 16384),
    maxUniformBufferOffsetAlignment: B(t, 35380, 256),
    maxVertexAttribs: B(t, 34921, 16),
    maxVertexUniformVectors: B(t, 36347, 128),
    maxFragmentUniformVectors: B(t, 36349, 128),
    maxVaryingVectors: B(t, 36348, 8),
    maxTextureImageUnits: B(t, 34930, 16),
    maxCombinedTextureImageUnits: B(t, 35661, 32),
    maxCubeMapTextureSize: B(t, 34076, 2048),
    maxRenderbufferSize: B(t, 34024, 2048),
    maxElementIndex: Gu,
    maxElementsVertices: B(t, 33001, 2147483647),
    maxElementsIndices: B(t, 33e3, 2147483647)
  };
}
function Ou(t) {
  const e = Uu(t);
  return {
    // WebGL2 没有 1D 纹理，用 2D 上限代替，上层代码读到的是一个安全的正数。
    maxTextureDimension1D: e.maxTextureSize,
    maxTextureDimension2D: e.maxTextureSize,
    maxTextureDimension3D: e.max3dTextureSize,
    maxTextureArrayLayers: e.maxArrayTextureLayers,
    maxBindGroups: me.maxBindGroups,
    maxBindGroupsPlusVertexBuffers: me.maxBindGroupsPlusVertexBuffers,
    maxBindingsPerBindGroup: me.maxBindingsPerBindGroup,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      me.maxDynamicUniformBuffersPerPipelineLayout,
      e.maxUniformBufferBindings
    ),
    maxDynamicStorageBuffersPerPipelineLayout: 0,
    maxSampledTexturesPerShaderStage: e.maxTextureImageUnits,
    maxSamplersPerShaderStage: e.maxTextureImageUnits,
    maxStorageBuffersPerShaderStage: 0,
    maxStorageTexturesPerShaderStage: 0,
    // WebGL2 里 uniform buffer 的最小绑定单位就是「块」，同时绑定的块数受 binding 数限制。
    maxUniformBuffersPerShaderStage: e.maxUniformBufferBindings,
    maxUniformBufferBindingSize: e.maxUniformBlockSize,
    maxStorageBufferBindingSize: 0,
    minUniformBufferOffsetAlignment: e.maxUniformBufferOffsetAlignment,
    minStorageBufferOffsetAlignment: me.minStorageBufferOffsetAlignment,
    maxVertexBuffers: Math.min(me.maxVertexBuffers, e.maxVertexAttribs),
    maxBufferSize: 2147483647,
    maxVertexAttributes: e.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: e.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: me.maxColorAttachmentBytesPerSample,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}
function Iu(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), e;
}
function Du(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const n = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", r = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: n, device: r };
}
function Vu(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function Nu(t, e) {
  const n = t.getContext("webgl2", e);
  if (!n)
    throw new u(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return n;
}
class zu {
  gl;
  program = null;
  vertexArray = null;
  activeUnit = -1;
  textures = /* @__PURE__ */ new Map();
  samplers = /* @__PURE__ */ new Map();
  uniformBuffers = /* @__PURE__ */ new Map();
  arrayBuffer = null;
  copyReadBuffer = null;
  copyWriteBuffer = null;
  indexBuffer = null;
  blendSignature = null;
  blendConstant = null;
  colorMask = null;
  depthEnabled = null;
  depthWrite = null;
  depthFunc = null;
  depthBias = null;
  stencilEnabled = null;
  stencilReference = null;
  cullEnabled = null;
  cullFace = null;
  frontFace = null;
  scissorEnabled = null;
  viewport = null;
  scissor = null;
  constructor(e) {
    this.gl = e;
  }
  /** GL 上下文（便于调用方在需要时直接操作）。 */
  get context() {
    return this.gl;
  }
  /**
   * 把全部缓存标记为未知，下一次设置会无条件写回 GL。
   * 外部通过 `device.native` 改过状态、或切换了 framebuffer 之后都应调用它。
   */
  invalidate() {
    this.program = null, this.vertexArray = null, this.activeUnit = -1, this.textures.clear(), this.samplers.clear(), this.uniformBuffers.clear(), this.arrayBuffer = null, this.copyReadBuffer = null, this.copyWriteBuffer = null, this.indexBuffer = null, this.blendSignature = null, this.blendConstant = null, this.colorMask = null, this.depthEnabled = null, this.depthWrite = null, this.depthFunc = null, this.depthBias = null, this.stencilEnabled = null, this.stencilReference = null, this.cullEnabled = null, this.cullFace = null, this.frontFace = null, this.scissorEnabled = null, this.viewport = null, this.scissor = null;
  }
  useProgram(e) {
    this.program !== e && (this.gl.useProgram(e), this.program = e);
  }
  /**
   * 只把 buffer 绑定相关的缓存标记为未知。
   *
   * 用在「直接改动了 `ELEMENT_ARRAY_BUFFER` 绑定」的场合 —— 该绑定是 VAO 状态的一部分，
   * 构建 VAO 时必须直接调 GL，之后缓存里记录的绑定就不再可信。
   */
  invalidateBufferBindings() {
    this.arrayBuffer = null, this.indexBuffer = null;
  }
  bindVertexArray(e) {
    this.vertexArray !== e && (this.gl.bindVertexArray(e), this.vertexArray = e, this.invalidateBufferBindings());
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
  withDefaultVertexArray(e) {
    const n = this.vertexArray;
    if (n === null) return e();
    this.gl.bindVertexArray(null), this.vertexArray = null, this.invalidateBufferBindings();
    try {
      return e();
    } finally {
      this.gl.bindVertexArray(n), this.vertexArray = n, this.invalidateBufferBindings();
    }
  }
  /** 绑定 `ARRAY_BUFFER`（顶点属性与 `bufferSubData` 上传都走它）。 */
  bindArrayBuffer(e) {
    this.arrayBuffer !== e && (this.gl.bindBuffer(this.gl.ARRAY_BUFFER, e), this.arrayBuffer = e);
  }
  /** 绑定 `ELEMENT_ARRAY_BUFFER`（会被 VAO 记录，所以绑定 VAO 后必须重新调用）。 */
  bindIndexBuffer(e) {
    this.indexBuffer !== e && (this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, e), this.indexBuffer = e);
  }
  bindCopyReadBuffer(e) {
    this.copyReadBuffer !== e && (this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, e), this.copyReadBuffer = e);
  }
  bindCopyWriteBuffer(e) {
    this.copyWriteBuffer !== e && (this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, e), this.copyWriteBuffer = e);
  }
  /** 切换当前激活的纹理单元。 */
  activeTexture(e) {
    this.activeUnit !== e && (this.gl.activeTexture(this.gl.TEXTURE0 + e), this.activeUnit = e);
  }
  /** 把纹理绑到指定单元；同一个单元重复绑定同一纹理会被跳过。 */
  bindTexture(e, n, r) {
    this.activeTexture(e);
    const i = this.textures.get(e);
    i && i.target === n && i.texture === r || (this.gl.bindTexture(n, r), this.textures.set(e, { target: n, texture: r }));
  }
  /** 把 sampler 对象绑到指定单元（WebGL2 的 sampler 对象承载采样参数）。 */
  bindSampler(e, n) {
    this.samplers.get(e) !== n && (this.gl.bindSampler(e, n), this.samplers.set(e, n));
  }
  /** 绑定 uniform block：`size < 0` 用 `bindBufferBase`，否则用 `bindBufferRange`。 */
  bindUniformBuffer(e, n, r = 0, i = -1) {
    const s = this.uniformBuffers.get(e);
    s && s.buffer === n && s.offset === r && s.size === i || (i < 0 ? this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, e, n) : this.gl.bindBufferRange(this.gl.UNIFORM_BUFFER, e, n, r, i), this.uniformBuffers.set(e, { buffer: n, offset: r, size: i }));
  }
  /** 清掉某个 binding 点的 uniform buffer 记录（缓冲区被销毁时调用）。 */
  forgetUniformBuffer(e) {
    for (const [n, r] of this.uniformBuffers)
      r.buffer === e && this.uniformBuffers.delete(n);
  }
  /** 忘掉 `ELEMENT_ARRAY_BUFFER` 的记录（索引缓冲被销毁时调用）。 */
  forgetIndexBuffer(e) {
    this.indexBuffer === e && (this.indexBuffer = null);
  }
  /** 忘掉某个纹理的所有单元记录（纹理被销毁时调用）。 */
  forgetTexture(e) {
    for (const [n, r] of this.textures)
      r.texture === e && this.textures.delete(n);
  }
  /**
   * 设置混合状态。参数是 GL 枚举（由 `glEnumMap` 翻译得到）。
   * 用一条签名字符串做比较，避免为每个字段单独维护缓存。
   */
  setBlend(e, n, r, i, s, a, o) {
    const l = e ? `1:${n}:${r}:${i}:${s}:${a}:${o}` : "0";
    if (this.blendSignature === l) return;
    const c = this.gl;
    e ? (c.enable(c.BLEND), c.blendFuncSeparate(n, r, s, a), c.blendEquationSeparate(i, o)) : c.disable(c.BLEND), this.blendSignature = l;
  }
  setBlendConstant(e) {
    Xt(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
  }
  setColorMask(e) {
    this.colorMask && this.colorMask[0] === e[0] && this.colorMask[1] === e[1] && this.colorMask[2] === e[2] && this.colorMask[3] === e[3] || (this.gl.colorMask(e[0], e[1], e[2], e[3]), this.colorMask = [e[0], e[1], e[2], e[3]]);
  }
  /**
   * 设置深度测试。
   *
   * `bias` 的顺序是 `[slopeScale, constant, clamp]`，对应 WebGPU 的
   * `depthBiasSlopeScale` / `depthBias` / `depthBiasClamp`。GL 没有 clamp 的对应概念，
   * 因此 `clamp` 在 WebGL2 后端会被忽略（这是已知差异，不影响绝大多数用法）。
   */
  setDepthTest(e, n, r, i) {
    const s = this.gl;
    this.depthEnabled !== e && (e ? s.enable(s.DEPTH_TEST) : s.disable(s.DEPTH_TEST), this.depthEnabled = e), this.depthWrite !== n && (s.depthMask(n), this.depthWrite = n), this.depthFunc !== r && (s.depthFunc(r), this.depthFunc = r);
    const a = i ?? [0, 0, 0];
    ku(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
  }
  setStencilTest(e, n) {
    const r = this.gl;
    this.stencilEnabled !== e && (e ? r.enable(r.STENCIL_TEST) : r.disable(r.STENCIL_TEST), this.stencilEnabled = e), e && this.stencilReference !== n && (r.stencilFunc(r.ALWAYS, n, 255), this.stencilReference = n);
  }
  setCull(e, n, r) {
    const i = this.gl;
    this.cullEnabled !== e && (e ? i.enable(i.CULL_FACE) : i.disable(i.CULL_FACE), this.cullEnabled = e), e && this.cullFace !== n && (i.cullFace(n), this.cullFace = n), this.frontFace !== r && (i.frontFace(r), this.frontFace = r);
  }
  setViewport(e, n, r, i) {
    Xt(this.viewport, [e, n, r, i]) || (this.gl.viewport(e, n, r, i), this.viewport = [e, n, r, i]);
  }
  setScissor(e, n, r, i, s) {
    const a = this.gl;
    this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !Xt(this.scissor, [n, r, i, s]) && (a.scissor(n, r, i, s), this.scissor = [n, r, i, s]);
  }
  /** 当前生效的 program（未设置时为 `null`）。 */
  get currentProgram() {
    return this.program;
  }
  /** 当前生效的顶点数组对象。 */
  get currentVertexArray() {
    return this.vertexArray;
  }
}
function Xt(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function ku(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
const Wu = [
  {
    flag: O.Storage,
    name: "Storage",
    reason: "shader storage buffer 需要 GLES 3.1，WebGL2 只有 GLES 3.0。请改用 uniform buffer 传数据。"
  },
  {
    flag: O.Indirect,
    name: "Indirect",
    reason: "WebGL2 没有 indirect draw。请改用一次性的 uniform 数据 + 普通 draw 调用。"
  },
  {
    flag: O.QueryResolve,
    name: "QueryResolve",
    reason: "WebGL2 的遮挡查询结果只能同步读回，没有查询结果缓冲区的概念。"
  }
];
class ju {
  label;
  size;
  usage;
  native;
  /**
   * 该 buffer 的绑定目标（`ELEMENT_ARRAY_BUFFER` 或 `COPY_WRITE_BUFFER`）。
   *
   * WebGL2 里这个目标是**永久**的（见类注释），所以只能在创建时按 usage 定一次：
   * 声明了 `Index` 的 buffer 走 `ELEMENT_ARRAY_BUFFER`，其余走 `COPY_WRITE_BUFFER`。
   * 其它模块（拷贝、清空、读回）都必须通过 {@link upload} / {@link download} 操作，
   * 而不是自己往 `COPY_*` 目标上绑。
   */
  bindingTarget;
  /** 进程内唯一标识，用于构建 VAO 缓存键（`label` 可能被使用者指定成重复值）。 */
  id;
  gl;
  state;
  onDestroy;
  /** 以 buffer 引用的形式登记 usage，便于调试时追踪（GL 本身不关心）。 */
  usages;
  mapping = null;
  _disposed = !1;
  constructor(e, n, r, i) {
    if (Xe(r.size, "BufferDescriptor.size"), r.size % 4 !== 0)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${r.size}。（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）`
      );
    for (const a of Wu)
      if (r.usage & a.flag)
        throw new u(
          `[gpu-device-api] BufferUsage.${a.name} 在 WebGL2 后端不可用：${a.reason}`
        );
    this.gl = e, this.state = n, this.onDestroy = i, this.label = r.label ?? G("buffer"), this.id = G("buf"), this.size = r.size, this.usage = r.usage, this.usages = r.usage, this.bindingTarget = r.usage & O.Index ? e.ELEMENT_ARRAY_BUFFER : e.COPY_WRITE_BUFFER;
    const s = e.createBuffer();
    if (!s) throw new u("[gpu-device-api] gl.createBuffer() 返回 null，无法分配 buffer。");
    this.native = s, this.withTarget(() => e.bufferData(this.bindingTarget, r.size, e.DYNAMIC_DRAW));
  }
  get disposed() {
    return this._disposed;
  }
  /** 该 buffer 是否被固定为索引缓冲（此时不能再当顶点/uniform/拷贝目标使用）。 */
  get isIndexBuffer() {
    return this.bindingTarget === this.gl.ELEMENT_ARRAY_BUFFER;
  }
  /** 该 buffer 创建时声明的 usage（只读，便于调试）。 */
  get usageFlags() {
    return this.usages;
  }
  get mapped() {
    return this.mapping !== null;
  }
  async mapAsync(e, n = 0, r = this.size - n) {
    if (this.assertUsable("mapAsync"), this.mapping)
      throw new u(`[gpu-device-api] buffer「${this.label}」已经处于映射状态，请先 unmap()。`);
    if (Mt(n, "mapAsync 的 offset"), Xe(r, "mapAsync 的 size"), n % 4 !== 0)
      throw new u(
        `[gpu-device-api] mapAsync 的 offset 必须是 4 的倍数，实际是 ${n}。（WebGPU 要求 8 的倍数，这里按更宽松的 4 处理。）`
      );
    if (n + r > this.size)
      throw new u(
        `[gpu-device-api] mapAsync 的范围 [${n}, ${n + r}) 超出了 buffer 大小 ${this.size}。`
      );
    if (e === "read") {
      const i = new ArrayBuffer(r);
      this.download(n, new Uint8Array(i)), this.mapping = { mode: e, offset: n, size: r, data: i, dirty: !1 };
    } else
      this.mapping = { mode: e, offset: n, size: r, data: new ArrayBuffer(r), dirty: !0 };
    return this.mapping.data;
  }
  getMappedRange(e = 0, n) {
    const r = this.mapping;
    if (!r)
      throw new u(
        `[gpu-device-api] buffer「${this.label}」尚未映射，请先 await mapAsync()。`
      );
    if (e === 0 && n === void 0) return r.data;
    const i = n ?? r.size - e;
    if (e < 0 || i <= 0 || e + i > r.size)
      throw new u(
        `[gpu-device-api] getMappedRange(${e}, ${i}) 超出已映射范围 ${r.size}。`
      );
    return r.data.slice(e, e + i);
  }
  unmap() {
    const e = this.mapping;
    e && (this.mapping = null, e.mode === "write" && e.dirty && this.upload(e.offset, new Uint8Array(e.data)));
  }
  /**
   * 直接上传一段数据（`Queue.writeBuffer` 与内部的拷贝/清空都走这里）。
   *
   * 必须用它而不是自己绑 `COPY_WRITE_BUFFER`：索引缓冲被固定在 `ELEMENT_ARRAY_BUFFER` 上，
   * 绑到别的目标会被 WebGL2 直接拒掉（见类注释）。
   */
  upload(e, n) {
    this.withTarget(() => this.gl.bufferSubData(this.bindingTarget, e, n));
  }
  /**
   * 读回一段数据（`Queue` 的同步读回、拷贝与映射读取都走这里）。
   *
   * `getBufferSubData` 接受任意 buffer 绑定目标，所以索引缓冲也能用 `ELEMENT_ARRAY_BUFFER` 读回。
   */
  download(e, n) {
    this.withTarget(() => this.gl.getBufferSubData(this.bindingTarget, e, n));
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.mapping = null, this.state.forgetUniformBuffer(this.native), this.state.forgetIndexBuffer(this.native), this.gl.deleteBuffer(this.native), this.onDestroy(this));
  }
  dispose() {
    this.destroy();
  }
  /**
   * 把本 buffer 绑到它唯一允许的绑定目标上，然后执行一段操作。
   *
   * `ELEMENT_ARRAY_BUFFER` 是 VAO 状态，所以那一路必须在默认 VAO 上操作并恢复原 VAO，
   * 否则会改掉当前 VAO 记录的索引缓冲（见 {@link GlStateCache.withDefaultVertexArray}）。
   */
  withTarget(e) {
    return this.bindingTarget === this.gl.COPY_WRITE_BUFFER ? (this.state.bindCopyWriteBuffer(this.native), e()) : this.state.withDefaultVertexArray(() => (this.state.bindIndexBuffer(this.native), e()));
  }
  assertUsable(e) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] buffer「${this.label}」已销毁，不能再调用 ${e}()。这种情况通常是资源在 device.dispose() 之后仍被使用。`
      );
  }
}
const ot = 6403, ct = 33319, qu = 6407, Ee = 6408, Le = 36244, Pe = 33320, Me = 36249, Yt = 6402, Xu = 34041, ge = 5121, Ce = 5120, lt = 5123, Ht = 5122, ze = 5125, Zt = 5124, ut = 5126, Qt = 5131, Yu = 33640, Hu = 34042, Zu = 33321, Qu = 36756, Ku = 33330, Ju = 33329, eh = 33332, th = 33331, nh = 33325, rh = 33323, ih = 36757, sh = 33336, ah = 33335, oh = 33334, ch = 33333, lh = 33326, uh = 33338, hh = 33337, fh = 33327, dh = 32856, ph = 35907, mh = 36759, gh = 36220, bh = 36222, wh = 32857, xh = 35898, vh = 33340, yh = 33339, $h = 33328, Th = 36214, Sh = 36216, Ah = 34842, _h = 36208, Eh = 36226, Lh = 34836, Ph = 33189, Mh = 33190, Ch = 35056, Fh = 36012;
function v(t, e, n, r, i = {}) {
  return {
    internalFormat: t,
    format: e,
    type: n,
    bytesPerPixel: r,
    attachment: i.attachment ?? !0,
    depth: i.depth ?? !1,
    stencil: i.stencil ?? !1,
    sampleType: i.sampleType ?? "float",
    uploadType: i.uploadType === void 0 ? "Uint8Array" : i.uploadType
  };
}
const Bh = Object.freeze({
  r8unorm: v(Zu, ot, ge, 1, { uploadType: "Uint8Array" }),
  r8snorm: v(Qu, ot, Ce, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: v(Ku, Le, ge, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: v(Ju, Le, Ce, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: v(eh, Le, lt, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: v(th, Le, Ht, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: v(nh, ot, Qt, 2, { uploadType: "Uint16Array" }),
  rg8unorm: v(rh, ct, ge, 2, { uploadType: "Uint8Array" }),
  rg8snorm: v(ih, ct, Ce, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: v(sh, Pe, ge, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: v(ah, Pe, Ce, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: v(oh, Le, ze, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: v(ch, Le, Zt, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: v(lh, ot, ut, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: v(uh, Pe, lt, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: v(hh, Pe, Ht, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: v(fh, ct, Qt, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: v(dh, Ee, ge, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": v(ph, Ee, ge, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: v(mh, Ee, Ce, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: v(gh, Me, ge, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: v(bh, Me, Ce, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: v(wh, Ee, Yu, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: v(xh, qu, ze, 4, { attachment: !1, uploadType: null }),
  rg32uint: v(vh, Pe, ze, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: v(yh, Pe, Zt, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: v($h, ct, ut, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: v(Th, Me, lt, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: v(Sh, Me, Ht, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: v(Ah, Ee, Qt, 8, { uploadType: "Uint16Array" }),
  rgba32uint: v(_h, Me, ze, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: v(Eh, Me, Zt, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: v(Lh, Ee, ut, 16, { uploadType: "Float32Array" }),
  depth16unorm: v(Ph, Yt, lt, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: v(Mh, Yt, ze, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": v(Ch, Xu, Hu, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: v(Fh, Yt, ut, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), Rh = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function k(t) {
  const e = Rh[t];
  if (e)
    throw new u(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const n = Bh[t];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return n;
}
function Gh(t) {
  return k(t).attachment;
}
function Uh(t, e) {
  const n = k(t);
  if (n.uploadType === null)
    throw new u(
      `[gpu-device-api] 纹理格式「${t}」不支持从主机内存上传。`
    );
  const r = e.constructor.name;
  if (r !== n.uploadType) {
    const i = t === "rgba16float" || t === "r16float" || t === "rg16float" ? "（该格式是 half float，需要先把 Float32 转成 Uint16 位模式，可用 Float32Array 与 Uint16Array 共享同一段内存来做转换。）" : "";
    throw new u(
      `[gpu-device-api] 纹理格式「${t}」要求主机数据是 ${n.uploadType}，实际传入 ${r}。${i}`
    );
  }
}
class as {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, n) {
    const r = En(e, n);
    if (r.baseMipLevel + r.mipLevelCount > e.mipLevelCount)
      throw new u(
        `[gpu-device-api] texture view 的 mip 范围 [${r.baseMipLevel}, ${r.baseMipLevel + r.mipLevelCount}) 超出了纹理「${e.label}」的 ${e.mipLevelCount} 层。`
      );
    if (r.baseArrayLayer + r.arrayLayerCount > e.depthOrArrayLayers)
      throw new u(
        `[gpu-device-api] texture view 的层范围 [${r.baseArrayLayer}, ${r.baseArrayLayer + r.arrayLayerCount}) 超出了纹理「${e.label}」的 ${e.depthOrArrayLayers} 层。`
      );
    this.texture = e, this.descriptor = r, this.label = n.label ?? G("textureView");
  }
  /** WebGL2 里 view 就是纹理本身，所以直接返回 GL 纹理句柄。 */
  get native() {
    return this.texture.native;
  }
  /** 底层 GL 纹理（与 `native` 相同，语义更明确）。 */
  get glTexture() {
    return this.texture.native;
  }
  /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
  get target() {
    return this.texture.target;
  }
  get disposed() {
    return this._disposed;
  }
  /** 纹理销毁时由纹理统一调用，避免 view 继续被使用。 */
  markDestroyed() {
    this._disposed = !0;
  }
  dispose() {
    this._disposed = !0;
  }
}
function Oh(t, e) {
  if (t === "1d")
    throw new u(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class ar {
  label;
  dimension;
  format;
  usage;
  width;
  height;
  depthOrArrayLayers;
  mipLevelCount;
  sampleCount;
  native;
  gl;
  state;
  glTarget;
  onDestroy;
  /** 已创建的 view；随纹理一起失效。 */
  views = [];
  _disposed = !1;
  constructor(e, n, r, i) {
    this.gl = e, this.state = n, this.onDestroy = i;
    const s = _n(r.size);
    if (Xe(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new u(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = k(r.format), o = r.dimension ?? wt.D2, l = r.sampleCount ?? 1, c = r.mipLevelCount ?? 1;
    if (l > 1) {
      if (o !== wt.D2 || s.depthOrArrayLayers > 1)
        throw new u(
          "[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: '2d'` 且 `depthOrArrayLayers: 1`）。"
        );
      if (c > 1)
        throw new u("[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。");
    }
    if (c > 1) {
      const d = Math.floor(Math.log2(Math.max(s.width, s.height))) + 1;
      if (c > d)
        throw new u(
          `[gpu-device-api] mipLevelCount=${c} 超过了 ${s.width}x${s.height} 能容纳的最大层数 ${d}。`
        );
    }
    this.label = r.label ?? G("texture"), this.dimension = o, this.format = r.format, this.usage = r.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = c, this.sampleCount = l, this.glTarget = Oh(o, s.depthOrArrayLayers);
    const h = e.createTexture();
    if (!h) throw new u("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = h, e.bindTexture(this.glTarget, h), l > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === wt.D3 ? e.texStorage3D(
      this.glTarget,
      c,
      a.internalFormat,
      s.width,
      s.height,
      s.depthOrArrayLayers
    ) : s.depthOrArrayLayers > 1 ? e.texStorage3D(
      this.glTarget,
      c,
      a.internalFormat,
      s.width,
      s.height,
      s.depthOrArrayLayers
    ) : e.texStorage2D(this.glTarget, c, a.internalFormat, s.width, s.height), this.applyDefaultSamplerParameters();
  }
  get size() {
    return { width: this.width, height: this.height, depthOrArrayLayers: this.depthOrArrayLayers };
  }
  get disposed() {
    return this._disposed;
  }
  /** GL 纹理目标（`TEXTURE_2D` / `TEXTURE_2D_ARRAY` / `TEXTURE_3D`）。 */
  get target() {
    return this.glTarget;
  }
  createView(e = {}) {
    if (this._disposed)
      throw new u(`[gpu-device-api] 纹理「${this.label}」已销毁，不能再创建 view。`);
    const n = new as(this, e);
    return this.views.push(n), n;
  }
  /**
   * 使用 GL 内置的 `generateMipmap` 生成 mip 链。
   * 要求基础层已经填好内容，且纹理不是多重采样。
   *
   * 这里直接调用 `gl.bindTexture` 而不是走状态缓存 —— 因为不知道这张纹理此刻被绑在哪个单元上，
   * 与其猜测，不如改完之后把缓存整体作废（生成 mip 发生在加载阶段，代价可以忽略）。
   */
  generateMipmaps() {
    this.sampleCount > 1 || this.mipLevelCount <= 1 || (this.gl.bindTexture(this.glTarget, this.native), this.gl.generateMipmap(this.glTarget), this.state.invalidate());
  }
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.views) e.markDestroyed();
      this.views.length = 0, this.state.forgetTexture(this.native), this.gl.deleteTexture(this.native), this.onDestroy(this);
    }
  }
  dispose() {
    this.destroy();
  }
  /**
   * 给纹理对象本身设置一套默认采样参数。
   *
   * 取值刻意与 **WebGPU 的默认值**一致（`nearest` + `clamp-to-edge`），这样即使使用者忘记
   * 提供 Sampler，两个后端的观感也相同。WebGL2 的 GL 默认值（`LINEAR_MIPMAP_LINEAR` +
   * `REPEAT`）反而会与 WebGPU 不一致。
   */
  applyDefaultSamplerParameters() {
    const e = this.gl, n = this.glTarget;
    e.texParameteri(n, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(n, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(n, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(n, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(n, e.TEXTURE_WRAP_R, e.CLAMP_TO_EDGE), e.texParameteri(n, e.TEXTURE_BASE_LEVEL, 0), e.texParameteri(n, e.TEXTURE_MAX_LEVEL, this.mipLevelCount - 1);
  }
}
const Ih = {
  "point-list": 0,
  // POINTS
  "line-list": 1,
  // LINES
  "line-strip": 3,
  // LINE_STRIP
  "triangle-list": 4,
  // TRIANGLES
  "triangle-strip": 5
  // TRIANGLE_STRIP
}, os = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, Dh = {
  zero: 0,
  one: 1,
  src: 768,
  "one-minus-src": 769,
  "src-alpha": 770,
  "one-minus-src-alpha": 771,
  dst: 772,
  "one-minus-dst": 773,
  "dst-alpha": 774,
  "one-minus-dst-alpha": 775,
  "src-alpha-saturated": 776,
  constant: 32769,
  "one-minus-constant": 32770
}, ht = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, or = {
  front: 1028,
  back: 1029
}, Vh = {
  ccw: 2305,
  cw: 2304
}, Kt = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, cr = {
  nearest: 9728,
  linear: 9729
}, Nh = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, lr = 5121, ur = 5120, hr = 5123, fr = 5122, zh = 5125, kh = 5124, Wh = 5126, jh = 5131, qh = {
  float32: { type: Wh, normalized: !1, integer: !1 },
  float16: { type: jh, normalized: !1, integer: !1 },
  unorm8: { type: lr, normalized: !0, integer: !1 },
  snorm8: { type: ur, normalized: !0, integer: !1 },
  uint8: { type: lr, normalized: !1, integer: !0 },
  sint8: { type: ur, normalized: !1, integer: !0 },
  unorm16: { type: hr, normalized: !0, integer: !1 },
  snorm16: { type: fr, normalized: !0, integer: !1 },
  uint16: { type: hr, normalized: !1, integer: !0 },
  sint16: { type: fr, normalized: !1, integer: !0 },
  uint32: { type: zh, normalized: !1, integer: !0 },
  sint32: { type: kh, normalized: !1, integer: !0 }
}, Xh = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function Yh(t) {
  const e = Xh.exec(t);
  if (!e)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const n = qh[e[1]];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: ye(t).components,
    type: n.type,
    normalized: n.normalized,
    integer: n.integer
  };
}
function yt(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return Zh(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const n = t;
    return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const Hh = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [1, 1, 1, 1],
  red: [1, 0, 0, 1],
  green: [0, 0.5019607843137255, 0, 1],
  lime: [0, 1, 0, 1],
  blue: [0, 0, 1, 1],
  yellow: [1, 1, 0, 1],
  cyan: [0, 1, 1, 1],
  aqua: [0, 1, 1, 1],
  magenta: [1, 0, 1, 1],
  fuchsia: [1, 0, 1, 1],
  gray: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  grey: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  silver: [0.7529411764705882, 0.7529411764705882, 0.7529411764705882, 1],
  orange: [1, 0.6470588235294118, 0, 1],
  purple: [0.5019607843137255, 0, 0.5019607843137255, 1],
  navy: [0, 0, 0.5019607843137255, 1],
  teal: [0, 0.5019607843137255, 0.5019607843137255, 1]
};
function Zh(t) {
  const e = t.trim().toLowerCase(), n = Hh[e];
  if (n) return n;
  if (e.startsWith("#")) {
    const i = e.slice(1), s = (a) => parseInt(a + a, 16) / 255;
    if (/^[0-9a-f]+$/.test(i)) {
      if (i.length === 3 || i.length === 4)
        return [s(i[0]), s(i[1]), s(i[2]), i.length === 4 ? s(i[3]) : 1];
      if (i.length === 6 || i.length === 8) {
        const a = (o) => parseInt(i.slice(o, o + 2), 16) / 255;
        return [a(0), a(2), a(4), i.length === 8 ? a(6) : 1];
      }
    }
  }
  const r = /^rgba?\(([^)]+)\)$/.exec(e);
  if (r) {
    const i = r[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return [(i[0] ?? 0) / 255, (i[1] ?? 0) / 255, (i[2] ?? 0) / 255, i[3] ?? 1];
  }
  throw new u(
    `[gpu-device-api] 无法解析颜色「${t}」。支持 CSS 十六进制、rgb()/rgba()、少量颜色名、0xRRGGBB、[r,g,b,a] 与 { r, g, b, a }。`
  );
}
class Qh {
  label;
  descriptor;
  native;
  gl;
  state;
  _disposed = !1;
  constructor(e, n, r = {}) {
    this.gl = e, this.state = n, this.descriptor = ti(r), this.label = r.label ?? G("sampler");
    const i = e.createSampler();
    if (!i) throw new u("[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。");
    this.native = i;
    const s = this.descriptor;
    if (e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, cr[s.minFilter]), e.samplerParameteri(i, e.TEXTURE_MAG_FILTER, cr[s.magFilter]), s.minFilter === "linear" && s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR) : s.minFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_NEAREST) : s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_LINEAR) : e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST), e.samplerParameteri(i, e.TEXTURE_WRAP_S, Kt[s.addressModeU]), e.samplerParameteri(i, e.TEXTURE_WRAP_T, Kt[s.addressModeV]), e.samplerParameteri(i, e.TEXTURE_WRAP_R, Kt[s.addressModeW]), e.samplerParameterf(i, e.TEXTURE_MIN_LOD, s.lodMinClamp), e.samplerParameterf(i, e.TEXTURE_MAX_LOD, s.lodMaxClamp), s.compare !== void 0 ? (e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(i, e.TEXTURE_COMPARE_FUNC, os[s.compare])) : e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.NONE), s.maxAnisotropy > 1) {
      const a = e.getExtension("EXT_texture_filter_anisotropic");
      if (a) {
        const o = Vu(e);
        e.samplerParameterf(
          i,
          a.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(s.maxAnisotropy, o)
        );
      }
    }
  }
  get disposed() {
    return this._disposed;
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.gl.deleteSampler(this.native), this.state.invalidate());
  }
  dispose() {
    this.destroy();
  }
}
class Kh {
  label;
  source;
  defines;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? G("shaderModule"), this.source = ni(e.code), this.defines = e.defines ? { ...e.defines } : {};
  }
  get disposed() {
    return this._disposed;
  }
  /**
   * 释放 module。
   *
   * GL 的 shader 对象归属于已经链接出来的 program（链接成功后 shader 对象就可以删除，
   * 不会影响 program），所以这里没有需要立即释放的 GL 资源；已编译的 program 由
   * `ProgramCache` 统一管理生命周期。
   */
  dispose() {
    this._disposed = !0;
  }
}
class dr {
  label;
  entries;
  sortedEntries;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? G("bindGroupLayout"), this.sortedEntries = ri(e.entries), this.entries = this.sortedEntries;
  }
  /** GL 没有布局对象，这里把条目列表本身作为「原生句柄」暴露出来。 */
  get native() {
    return this.sortedEntries;
  }
  get disposed() {
    return this._disposed;
  }
  entry(e) {
    return this.sortedEntries.find((n) => n.binding === e);
  }
  dispose() {
    this._disposed = !0;
  }
}
class Jh {
  label;
  layout;
  entries;
  byBinding;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? G("bindGroup"), this.layout = e.layout, this.entries = [...e.entries], this.byBinding = new Map(this.entries.map((n) => [n.binding, n])), this.validate();
  }
  /** GL 没有 bind group 对象，这里暴露校验后的条目映射。 */
  get native() {
    return this.byBinding;
  }
  get disposed() {
    return this._disposed;
  }
  entry(e) {
    return this.byBinding.get(e);
  }
  dispose() {
    this._disposed = !0, this.byBinding.clear();
  }
  /** 校验：每个条目都能在布局里找到，且类型对得上。 */
  validate() {
    const e = /* @__PURE__ */ new Set();
    for (const n of this.entries) {
      if (e.has(n.binding))
        throw new u(
          `[gpu-device-api] BindGroup「${this.label}」里 binding ${n.binding} 出现了多次。`
        );
      e.add(n.binding);
      const r = this.layout.entry(n.binding);
      if (!r)
        throw new u(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${n.binding} 在布局「${this.layout.label}」里没有声明。布局声明的 binding：${this.layout.sortedEntries.map((o) => o.binding).join("、")}。`
        );
      const i = n.resource, s = "buffer" in i ? "buffer" : "sampler" in i ? "sampler" : "view" in i ? "texture" : "unknown", a = r.type === "uniform" || r.type === "storage" || r.type === "read-only-storage" ? "buffer" : r.type === "texture" || r.type === "storage-texture" ? "texture" : "sampler";
      if (s !== a)
        throw new u(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${n.binding} 类型不匹配：布局要求 ${a}，实际给了 ${s}。`
        );
    }
  }
}
class pr {
  label;
  bindGroupLayouts;
  isAuto;
  plan;
  constructor(e, n, r) {
    if (this.label = e.label ?? G("pipelineLayout"), this.bindGroupLayouts = [...e.bindGroupLayouts], this.isAuto = n, this.bindGroupLayouts.length > 4)
      throw new u(
        `[gpu-device-api] pipeline layout 声明了 ${this.bindGroupLayouts.length} 个 bind group，WebGL2 后端最多支持 4 个（与 WebGPU 默认的 maxBindGroups 一致）。`
      );
    this.plan = r && this.bindGroupLayouts.length > 0 ? r.planCache.get(this.bindGroupLayouts.map((i) => i.sortedEntries)) : null;
  }
  get native() {
    return this.plan;
  }
  /** 该布局对应的绑定计划；没有 bind group 时为 `null`。 */
  get bindingPlan() {
    return this.plan;
  }
  get disposed() {
    return !1;
  }
  /** 布局本身不持有 GL 资源，释放由 program 缓存负责。 */
  dispose() {
  }
}
function mr(t, e) {
  return `${t}:${e}`;
}
function ef(t, e) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((l, c) => {
    const h = [...l].sort((f, p) => f.binding - p.binding), d = h.filter((f) => f.type === R.Sampler || f.type === R.ComparisonSampler);
    for (const f of h)
      switch (i.push(`${c}:${f.binding}:${f.type}:${f.name ?? ""}:${f.buffer?.hasDynamicOffset ? "dyn" : ""}`), f.type) {
        case R.Uniform: {
          if (!f.name)
            throw new u(
              `[gpu-device-api] group ${c} 的 binding ${f.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new u(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          n.set(mr(c, f.binding), {
            group: c,
            binding: f.binding,
            name: f.name,
            blockBinding: s++,
            dynamic: f.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: f.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case R.Texture: {
          if (!f.name)
            throw new u(
              `[gpu-device-api] group ${c} 的 binding ${f.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new u(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const p = tf(f, d);
          r.set(mr(c, f.binding), {
            group: c,
            binding: f.binding,
            name: f.name,
            unit: a++,
            samplerBinding: p ? p.binding : null,
            samplerName: p ? p.name ?? null : null
          });
          break;
        }
        case R.Sampler:
        case R.ComparisonSampler:
          break;
        case R.Storage:
        case R.ReadOnlyStorage:
          throw new u(
            `[gpu-device-api] group ${c} 的 binding ${f.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case R.StorageTexture:
          throw new u(
            `[gpu-device-api] group ${c} 的 binding ${f.binding} 是 storage texture，WebGL2 不支持。请改用「渲染到纹理 + 采样」的方式。`
          );
        default: {
          const p = f.type;
          throw new u(`[gpu-device-api] 未知的 binding 类型：${String(p)}`);
        }
      }
  });
  const o = new Set(
    [...r.values()].map((l) => l.samplerBinding).filter((l) => l !== null)
  );
  for (const [l, c] of t.entries())
    for (const h of c)
      if ((h.type === R.Sampler || h.type === R.ComparisonSampler) && !o.has(h.binding))
        throw new u(
          `[gpu-device-api] group ${l} 的 sampler binding ${h.binding}` + (h.name ? `（「${h.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  return {
    uniformBlocks: n,
    textures: r,
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function tf(t, e) {
  const n = t.name ?? "", r = e.find((i) => i.name === `${n}_sampler`);
  return r || e.find((i) => i.binding === t.binding + 1);
}
class nf {
  plans = /* @__PURE__ */ new Map();
  limits;
  constructor(e) {
    this.limits = e;
  }
  /** 按布局内容取计划，未命中则构建。 */
  get(e) {
    const n = e.map(
      (s, a) => [...s].sort((o, l) => o.binding - l.binding).map((o) => `${a}:${o.binding}:${o.type}:${o.name ?? ""}:${o.buffer?.hasDynamicOffset ? "dyn" : ""}`).join(",")
    ).join(";"), r = this.plans.get(n);
    if (r) return r;
    const i = ef(e, this.limits);
    return this.plans.set(n, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
class rf {
  gl;
  state;
  programs = /* @__PURE__ */ new Map();
  constructor(e) {
    this.gl = e.gl, this.state = e.state;
  }
  get size() {
    return this.programs.size;
  }
  /**
   * 取得（或编译）一个 program。
   *
   * 只做「编译 + 链接 + 反射」，**不绑定 binding** —— 因为 `layout: 'auto'` 需要先链接出
   * program 才能反射出接口、再据此推断布局。绑定是第二步，见 {@link ProgramCache.bindPlan}。
   *
   * @param vertexSource 已包好 `#version` 与精度声明的顶点着色器源码
   * @param fragmentSource 已包好的片元着色器源码
   */
  acquire(e, n, r) {
    const i = `${n}\0${r}`, s = this.programs.get(i);
    if (s) return s;
    const a = this.gl, o = this.compileShader(a.VERTEX_SHADER, n, `${e} / vertex`), l = this.compileShader(a.FRAGMENT_SHADER, r, `${e} / fragment`), c = a.createProgram();
    if (!c)
      throw a.deleteShader(o), a.deleteShader(l), new u("[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。");
    if (a.attachShader(c, o), a.attachShader(c, l), a.linkProgram(c), a.detachShader(c, o), a.detachShader(c, l), a.deleteShader(o), a.deleteShader(l), !a.getProgramParameter(c, a.LINK_STATUS)) {
      const p = a.getProgramInfoLog(c) ?? "(无日志)";
      throw a.deleteProgram(c), new u(
        `[gpu-device-api] program「${e}」链接失败。vertex 与 fragment 的 varying（in/out）名字、
类型与数量必须完全对应。
GL 日志：${p}`
      );
    }
    const d = Cu(a, c), f = {
      program: c,
      reflection: d,
      blockBindings: /* @__PURE__ */ new Map(),
      samplerLocations: /* @__PURE__ */ new Map(),
      optimizedOutBlocks: [],
      label: e,
      boundPlanKey: null
    };
    return this.programs.set(i, f), f;
  }
  /**
   * 把绑定计划写进 program：设置 uniform block 的 binding 点、给 sampler uniform 赋纹理单元，
   * 并把 program 的实际接口与计划做交叉校验。
   *
   * 可以安全地重复调用（同一个计划只生效一次），因为 `layout: 'auto'` 的流程里
   * 计划要等链接完才能算出来。
   */
  bindPlan(e, n) {
    if (e.boundPlanKey !== null) return;
    const { blockBindings: r, samplerLocations: i, optimizedOutBlocks: s } = this.bindResources(
      e.program,
      e.reflection,
      n,
      e.label
    );
    e.blockBindings = r, e.samplerLocations = i, e.optimizedOutBlocks = s, e.boundPlanKey = n ? n.key : "";
  }
  /** 释放缓存里的全部 program。 */
  clear() {
    for (const e of this.programs.values())
      this.gl.deleteProgram(e.program);
    this.programs.clear(), this.state.useProgram(null);
  }
  dispose() {
    this.clear();
  }
  compileShader(e, n, r) {
    const i = this.gl, s = i.createShader(e);
    if (!s)
      throw new u(`[gpu-device-api] gl.createShader() 返回 null（${r}）。`);
    if (i.shaderSource(s, n), i.compileShader(s), !i.getShaderParameter(s, i.COMPILE_STATUS)) {
      const a = i.getShaderInfoLog(s) ?? "(无日志)";
      throw i.deleteShader(s), new u(`[gpu-device-api] 着色器编译失败（${r}）：
${a}

----- 源码 -----
${sf(n)}`);
    }
    return s;
  }
  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  bindResources(e, n, r, i) {
    const s = this.gl, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), l = [], c = new Set(n.uniformBlocks.map((d) => d.name));
    if (r)
      for (const [d, f] of r.uniformBlocks) {
        if (!c.has(f.name)) {
          l.push(f.name);
          continue;
        }
        const p = s.getUniformBlockIndex(e, f.name);
        if (p === s.INVALID_INDEX) {
          l.push(f.name);
          continue;
        }
        s.uniformBlockBinding(e, p, f.blockBinding), a.set(d, f.blockBinding);
      }
    const h = n.uniforms.filter((d) => ss(d.glType));
    if (r)
      for (const [, d] of r.textures) {
        const f = h.find((p) => p.name === d.name)?.location ?? s.getUniformLocation(e, d.name);
        f && (s.uniform1i(f, d.unit), o.set(d.name, f));
      }
    if (r) {
      const d = new Set([...r.uniformBlocks.values()].map((g) => g.name)), f = n.uniformBlocks.map((g) => g.name).filter((g) => !d.has(g));
      if (f.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 uniform block：${f.join("、")}。
布局里声明的块名：${[...d].join("、") || "(空)"}。
WebGL2 后端靠 \`BindGroupLayoutEntry.name\` 去定位 GLSL 的 uniform block，请检查两边的名字是否一致（注意 GLSL 里块名与实例名是两回事，这里要的是**块名**）。`
        );
      const p = new Set([...r.textures.values()].map((g) => g.name)), m = h.map((g) => g.name.replace(/\[0\]$/, "")).filter((g) => !p.has(g));
      if (m.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 sampler：${m.join("、")}。
布局里声明的纹理名：${[...p].join("、") || "(空)"}。
请为每个 sampler 增加一个 \`type: 'texture'\` 的布局条目并填上 \`name\`。`
        );
    } else {
      if (n.uniformBlocks.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 uniform block（${n.uniformBlocks.map((d) => d.name).join("、")}），但管线没有声明任何 bind group layout。`
        );
      if (h.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 sampler（${h.map((d) => `${d.name}: ${Pu(d.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: l };
  }
}
function sf(t) {
  const e = t.split(`
`), n = String(e.length).length;
  return e.map((r, i) => `${String(i + 1).padStart(n, " ")} | ${r}`).join(`
`);
}
function af(t, e) {
  const n = t.depthStencil, r = n !== void 0 && n.format !== null, i = r && e.depth, s = t.render?.blend, a = t.fragment?.targets, l = a?.find((f) => f?.blend)?.blend ?? s;
  let c = null;
  l && (c = {
    colorSrc: ft(l.color.srcFactor, "color.srcFactor"),
    colorDst: ft(l.color.dstFactor, "color.dstFactor"),
    colorOp: l.color.operation ? ht[l.color.operation] : ht.add,
    alphaSrc: ft(l.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: ft(l.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: l.alpha.operation ? ht[l.alpha.operation] : ht.add
  });
  const h = a?.[0]?.writeMask ?? t.render?.writeMask ?? ae.All, d = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    depthWrite: n?.depthWriteEnabled ?? !0,
    depthCompare: os[n?.depthCompare ?? "less"],
    depthBias: [n?.depthBiasSlopeScale ?? 0, n?.depthBias ?? 0, n?.depthBiasClamp ?? 0],
    stencilEnabled: r && e.stencil,
    blend: c,
    writeMask: [
      (h & ae.Red) !== 0,
      (h & ae.Green) !== 0,
      (h & ae.Blue) !== 0,
      (h & ae.Alpha) !== 0
    ],
    cullEnabled: d !== "none",
    cullFace: d === "none" ? or.back : or[d],
    frontFace: Vh[t.primitive?.frontFace ?? "ccw"]
  };
}
function of(t, e, n = 0) {
  e.blend ? t.setBlend(
    !0,
    e.blend.colorSrc,
    e.blend.colorDst,
    e.blend.colorOp,
    e.blend.alphaSrc,
    e.blend.alphaDst,
    e.blend.alphaOp
  ) : t.setBlend(!1, 0, 0, 0, 0, 0, 0), t.setColorMask(e.writeMask), t.setDepthTest(e.depthTest, e.depthWrite, e.depthCompare, e.depthBias), t.setStencilTest(e.stencilEnabled, n), t.setCull(e.cullEnabled, e.cullFace, e.frontFace);
}
function ft(t, e) {
  const n = Dh[t];
  if (n === void 0)
    throw new u(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return n;
}
class cf {
  label;
  descriptor;
  layout;
  vertexLayouts;
  gl;
  state;
  limits;
  program;
  plan;
  topologyMode;
  variantCache = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, n, r, i) {
    if (!e.fragment)
      throw new u(
        "[gpu-device-api] WebGL2 后端不支持只有深度、没有片元着色器的管线（GL 的 program 必须同时链接两个阶段）。\n请提供一个写深度或写颜色的片元着色器；若只想写深度，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    this.label = e.label ?? G("renderPipeline"), this.descriptor = e, this.layout = r, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.program = n, this.plan = r === "auto" ? null : r.bindingPlan ?? null, this.topologyMode = Ih[e.primitive?.topology ?? "triangle-list"];
  }
  /** WebGL2 在创建时就完成了编译。 */
  get compiled() {
    return !0;
  }
  /** 已链接好的 program 等内部信息（供渲染通道与调试使用）。 */
  get compiledProgram() {
    return this.program;
  }
  /** GL 图元模式。 */
  get mode() {
    return this.topologyMode;
  }
  get bindingPlan() {
    return this.plan;
  }
  get disposed() {
    return this._disposed;
  }
  get native() {
    return this.program.program;
  }
  /**
   * 按渲染目标形态解析状态。同一形态只解析一次；顶点布局也在这里做一次校验。
   */
  resolveVariant(e = {}) {
    const n = e.depthFormat ?? null, r = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${n ?? "none"}|${r}|${si(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const h of i) ii(h, this.limits);
    const o = new Set(i.flatMap((h) => h.attributes.map((d) => d.shaderLocation))), l = new Set(this.program.reflection.attributes.map((h) => h.location));
    for (const h of l)
      if (!o.has(h))
        throw new u(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${h}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const c = {
      key: s,
      renderState: af(this.descriptor, {
        depth: n !== null,
        stencil: n === "depth24plus-stencil8"
      }),
      depthFormat: n,
      sampleCount: r,
      vertexLayouts: i,
      vertexArrays: /* @__PURE__ */ new Map()
    };
    return this.variantCache.set(s, c), c;
  }
  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(e = {}) {
    return this.resolveVariant(e).renderState;
  }
  /** 把该管线的固定功能状态写入 GL 状态缓存。 */
  applyState(e, n = 0) {
    this.state.useProgram(this.program.program), of(this.state, e.renderState, n);
  }
  /**
   * 取得（必要时创建）一个顶点数组对象。
   *
   * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
   * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
   */
  acquireVertexArray(e, n, r) {
    const i = e.vertexLayouts;
    if (i.length === 0) return null;
    const s = lf(i, n, r), a = e.vertexArrays.get(s);
    if (a) return a;
    const o = this.gl, l = o.createVertexArray();
    if (!l)
      throw new u("[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。");
    this.state.bindVertexArray(l);
    for (let c = 0; c < i.length; c++) {
      const h = i[c], d = n[c];
      if (!h || !d) continue;
      o.bindBuffer(o.ARRAY_BUFFER, d.buffer.native);
      const f = h.stepMode === "instance" ? 1 : 0;
      for (const p of h.attributes) {
        const m = Yh(p.format), g = d.offset + p.offset;
        o.enableVertexAttribArray(p.shaderLocation), m.integer ? o.vertexAttribIPointer(p.shaderLocation, m.size, m.type, h.arrayStride, g) : o.vertexAttribPointer(
          p.shaderLocation,
          m.size,
          m.type,
          m.normalized,
          h.arrayStride,
          g
        ), o.vertexAttribDivisor(p.shaderLocation, f);
      }
    }
    return r && o.bindBuffer(o.ELEMENT_ARRAY_BUFFER, r), this.state.invalidateBufferBindings(), e.vertexArrays.set(s, l), l;
  }
  /** 当前缓存了多少个 VAO（跨全部形态）。 */
  get vertexArrayCount() {
    let e = 0;
    for (const n of this.variantCache.values()) e += n.vertexArrays.size;
    return e;
  }
  dispose() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.variantCache.values()) {
        for (const n of e.vertexArrays.values())
          this.gl.deleteVertexArray(n);
        e.vertexArrays.clear();
      }
      this.variantCache.clear();
    }
  }
}
function lf(t, e, n) {
  const r = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      r.push(`${i}:-`);
      continue;
    }
    Mt(s.offset, "setVertexBuffer 的 offset"), r.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return r.push(`idx:${n ? hf(n) : "-"}`), r.join("|");
}
const gr = /* @__PURE__ */ new WeakMap();
let uf = 1;
function hf(t) {
  let e = gr.get(t);
  return e === void 0 && (e = uf++, gr.set(t, e)), e;
}
class ff {
  label;
  descriptor;
  layout = "auto";
  constructor(e) {
    throw this.label = e.label ?? "computePipeline", this.descriptor = e, new u(
      `[gpu-device-api] WebGL2 后端不支持 compute pipeline（管线「${this.label}」）。
计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算。`
    );
  }
  get native() {
    throw new u("[gpu-device-api] WebGL2 没有 compute pipeline。");
  }
  get disposed() {
    return !0;
  }
  resolve() {
    throw new u("[gpu-device-api] WebGL2 没有 compute pipeline。");
  }
  dispose() {
  }
}
function df(t, e, n) {
  throw new u(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${n}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function br(t) {
  return t instanceof as ? t : df("texture view", t, "WebGL2TextureView");
}
class pf {
  label;
  colorFormats;
  depthFormat;
  sampleCount = 1;
  mipLevelCount;
  gl;
  state;
  options;
  framebuffer;
  colorTextures;
  depthTexture;
  colorViews = [];
  depthView = null;
  _width;
  _height;
  _disposed = !1;
  constructor(e, n) {
    if ((e.sampleCount ?? 1) > 1)
      throw new u(
        `[gpu-device-api] WebGL2 后端不支持多重采样的离屏渲染目标（GL 的多重采样只能渲染到 renderbuffer，无法 resolve 成纹理）。
请把 sampleCount 设为 1，并改用默认帧缓冲的 antialias，或加一层 FXAA / 超采样后处理。`
      );
    const r = e.width ?? n.gl.drawingBufferWidth, i = e.height ?? n.gl.drawingBufferHeight;
    if (r <= 0 || i <= 0)
      throw new u(
        `[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${r}x${i}。未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。`
      );
    this.gl = n.gl, this.state = n.state, this.options = n, this.label = e.label ?? G("renderTarget"), this._width = r, this._height = i, this.mipLevelCount = e.mipLevelCount ?? 1;
    const s = mf(e.color);
    if (s.length > 4)
      throw new u(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${s.length} 个。`
      );
    for (const l of s)
      if (!k(l).attachment)
        throw new u(
          `[gpu-device-api] 纹理格式「${l}」在 WebGL2 下不能作为颜色附件。`
        );
    this.colorFormats = s;
    const a = gf(e.depth);
    if (a !== null && !k(a).depth)
      throw new u(`[gpu-device-api] 深度附件格式「${a}」不是深度格式。`);
    this.depthFormat = a;
    const o = n.gl.createFramebuffer();
    if (!o)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。");
    this.framebuffer = o, this.colorTextures = [], this.depthTexture = null, this.createAttachments(e.usage ?? 0), this.attach();
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get colorFormat() {
    return this.colorFormats[0];
  }
  get colors() {
    return this.colorTextures;
  }
  get depth() {
    return this.depthTexture;
  }
  /** GL 的 framebuffer 对象。 */
  get native() {
    return this.framebuffer;
  }
  get disposed() {
    return this._disposed;
  }
  get colorAttachments() {
    return this.colorViews.map((e) => ({
      view: e,
      loadOp: "clear",
      storeOp: "store"
    }));
  }
  get depthStencilAttachment() {
    return this.depthView ? {
      view: this.depthView,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      depthClearValue: 1
    } : null;
  }
  createPassDescriptor(e = {}) {
    const n = this.colorViews.map((i) => ({
      view: i,
      loadOp: e.loadOp ?? "clear",
      storeOp: e.storeOp ?? "store",
      clearValue: e.clearValue
    })), r = this.depthView ? {
      view: this.depthView,
      depthLoadOp: e.depthLoadOp ?? "clear",
      depthStoreOp: "store",
      depthClearValue: e.depthClearValue ?? 1
    } : null;
    return { colorAttachments: n, depthStencilAttachment: r };
  }
  /**
   * 绑定 framebuffer 并按需清屏。渲染通道开始绘制前调用。
   *
   * 清屏时临时关闭 `SCISSOR_TEST`：GL 的 `clearBuffer*` 会受裁剪框影响，
   * 而这里的语义应该是「清整个附件」。
   */
  bind(e = {}) {
    const n = this.gl;
    n.bindFramebuffer(n.FRAMEBUFFER, this.framebuffer);
    const r = n.checkFramebufferStatus(n.FRAMEBUFFER);
    if (r !== n.FRAMEBUFFER_COMPLETE)
      throw new u(
        `[gpu-device-api] 渲染目标「${this.label}」的 framebuffer 不完整（格式组合在 WebGL2 下不受支持）。颜色附件：${this.colorFormats.join("、")}；深度附件：${this.depthFormat ?? "无"}。GL 状态码：0x${r.toString(16)}。`
      );
    if (e.loadOp !== "load" || this.depthTexture !== null && e.depthLoadOp !== "load") {
      if (this.state.setScissor(!1, 0, 0, this._width, this._height), e.loadOp !== "load") {
        const [s, a, o, l] = yt(e.clearColor), c = new Float32Array([s, a, o, l]);
        for (let h = 0; h < this.colorTextures.length; h++)
          n.clearBufferfv(n.COLOR, h, c);
      }
      if (this.depthTexture && e.depthLoadOp !== "load") {
        const s = k(this.depthFormat);
        n.depthMask(!0), s.stencil ? n.clearBufferfi(n.DEPTH_STENCIL, 0, e.clearDepth ?? 1, e.clearStencil ?? 0) : n.clearBufferfv(n.DEPTH, 0, new Float32Array([e.clearDepth ?? 1])), this.state.invalidate();
      }
    }
    n.viewport(0, 0, this._width, this._height), this.state.setViewport(0, 0, this._width, this._height);
  }
  resize(e, n) {
    if (e === this._width && n === this._height) return !1;
    if (e <= 0 || n <= 0)
      throw new u(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${e}x${n}。`);
    this._width = e, this._height = n;
    for (const r of this.colorTextures) r.destroy();
    return this.depthTexture?.destroy(), this.colorTextures = [], this.depthTexture = null, this.createAttachments(0), this.attach(), !0;
  }
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.colorTextures) e.destroy();
      this.depthTexture?.destroy(), this.colorTextures = [], this.depthTexture = null, this.colorViews = [], this.depthView = null, this.gl.deleteFramebuffer(this.framebuffer);
    }
  }
  dispose() {
    this.destroy();
  }
  /** 取某个颜色附件的 view（后处理、调试读回时用）。 */
  colorView(e = 0) {
    const n = this.colorViews[e];
    if (!n)
      throw new u(
        `[gpu-device-api] 渲染目标「${this.label}」没有第 ${e} 个颜色附件（共 ${this.colorViews.length} 个）。`
      );
    return n;
  }
  /** 深度附件的 view；没有深度附件时抛错。 */
  depthStencilView() {
    if (!this.depthView)
      throw new u(`[gpu-device-api] 渲染目标「${this.label}」没有深度附件。`);
    return this.depthView;
  }
  createAttachments(e) {
    const n = y.RenderAttachment | y.TextureBinding | y.CopySrc | e;
    this.colorTextures = this.colorFormats.map(
      (r, i) => this.options.createTexture(r, this._width, this._height, n, `${this.label}:color${i}`)
    ), this.depthTexture = this.depthFormat === null ? null : this.options.createTexture(
      this.depthFormat,
      this._width,
      this._height,
      y.RenderAttachment | y.TextureBinding,
      `${this.label}:depth`
    ), this.colorViews = this.colorTextures.map((r) => br(r.createView())), this.depthView = this.depthTexture ? br(this.depthTexture.createView()) : null;
  }
  attach() {
    const e = this.gl, n = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.framebuffer), this.colorTextures.forEach((r, i) => {
      const s = e.COLOR_ATTACHMENT0 + i;
      r.dimension === "3d" || r.depthOrArrayLayers > 1 ? e.framebufferTextureLayer(e.FRAMEBUFFER, s, r.native, 0, 0) : e.framebufferTexture2D(e.FRAMEBUFFER, s, e.TEXTURE_2D, r.native, 0);
    }), e.drawBuffers(this.colorTextures.map((r, i) => e.COLOR_ATTACHMENT0 + i)), this.depthTexture) {
      const i = k(this.depthFormat).stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
      e.framebufferTexture2D(e.FRAMEBUFFER, i, e.TEXTURE_2D, this.depthTexture.native, 0);
    } else
      e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, null, 0), e.framebufferTexture2D(e.FRAMEBUFFER, e.STENCIL_ATTACHMENT, e.TEXTURE_2D, null, 0);
    e.bindFramebuffer(e.FRAMEBUFFER, n), this.state.invalidate();
  }
}
function mf(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new u("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function gf(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
function wr(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class bf {
  label = "canvas:defaultFramebuffer";
  dimension = wt.D2;
  format;
  usage;
  width;
  height;
  depthOrArrayLayers = 1;
  mipLevelCount = 1;
  sampleCount;
  native = null;
  destroyed = !1;
  cachedView = null;
  constructor(e, n, r, i, s) {
    this.width = e, this.height = n, this.format = r, this.sampleCount = i, this.usage = s;
  }
  get size() {
    return { width: this.width, height: this.height, depthOrArrayLayers: 1 };
  }
  get views() {
    return this.cachedView ? [this.cachedView] : [];
  }
  get disposed() {
    return this.destroyed;
  }
  createView(e = {}) {
    if (!this.cachedView) {
      const n = {
        label: e.label ?? `${this.label}:view`,
        texture: this,
        descriptor: {
          format: this.format,
          dimension: "2d",
          baseMipLevel: 0,
          mipLevelCount: 1,
          baseArrayLayer: 0,
          arrayLayerCount: 1,
          aspect: "all"
        },
        native: null,
        isDefaultFramebuffer: !0,
        disposed: !1,
        dispose: () => {
        }
      };
      this.cachedView = n;
    }
    return this.cachedView;
  }
  destroy() {
    this.destroyed = !0;
  }
  dispose() {
    this.destroy();
  }
}
class wf {
  canvas;
  gl;
  _device = null;
  _format;
  _pixelRatio;
  _width;
  _height;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this._format = e.format ?? "rgba8unorm";
    const n = ci(), r = je(e.canvas);
    this._pixelRatio = n, this._width = Math.max(1, Math.floor(r.width * n)), this._height = Math.max(1, Math.floor(r.height * n)), this.applyBackingSize();
  }
  get device() {
    return this._device;
  }
  get deviceRef() {
    return this._device;
  }
  get configured() {
    return this._device !== null;
  }
  get format() {
    return this._format;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get pixelRatio() {
    return this._pixelRatio;
  }
  /** 该 canvas 的 GL context（与 device 的 `native` 是同一个对象）。 */
  get context() {
    return this.gl;
  }
  configure(e) {
    if (e.sampleCount !== void 0 && e.sampleCount > 1)
      throw new u(
        "[gpu-device-api] WebGL2 的背景缓冲采样数由创建 context 时的 `antialias` 选项决定，不能在 configure() 里改。请在 createDevice({ contextAttributes: { antialias: true } }) 里设置。"
      );
    if (e.format !== void 0 && !Gh(e.format))
      throw new u(
        `[gpu-device-api] canvas 格式「${e.format}」不能作为颜色附件。`
      );
    const n = e.device;
    if (n.native !== this.gl)
      throw new u(
        `[gpu-device-api] 这个 canvas 的 WebGL2 context 不是该 device 持有的那一个。
WebGL2 的 context 是从 canvas 上取的，一个 device 只能服务创建它的那个 canvas；请用 createDevice({ canvas }) 传入同一个 canvas，或为另一个 canvas 单独创建 device。`
      );
    this._device = n, e.format && (this._format = e.format);
  }
  unconfigure() {
    this._device = null;
  }
  setSize(e, n, r = !0) {
    const i = Math.max(1, Math.round(e)), s = Math.max(1, Math.round(n)), a = this.canvas;
    r && typeof a.style < "u" && (a.style.width = `${i}px`, a.style.height = `${s}px`), this._width = Math.max(1, Math.floor(i * this._pixelRatio)), this._height = Math.max(1, Math.floor(s * this._pixelRatio)), this.applyBackingSize();
  }
  setPixelRatio(e) {
    if (!Number.isFinite(e) || e <= 0)
      throw new RangeError(`[gpu-device-api] setPixelRatio() 需要正数，实际是 ${e}。`);
    if (e === this._pixelRatio) return;
    this._pixelRatio = e;
    const n = je(this.canvas);
    this._width = Math.max(1, Math.floor(n.width * e)), this._height = Math.max(1, Math.floor(n.height * e)), this.applyBackingSize();
  }
  resize() {
    const e = je(this.canvas), n = Math.max(1, Math.floor(e.width * this._pixelRatio)), r = Math.max(1, Math.floor(e.height * this._pixelRatio));
    return n === this._width && r === this._height ? !1 : (this._width = n, this._height = r, this.applyBackingSize(), !0);
  }
  getCurrentFrameTarget() {
    if (!this._device)
      throw new u(
        "[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。"
      );
    const e = Number(this.gl.getParameter(this.gl.SAMPLES) ?? 1) || 1, n = new bf(
      this._width,
      this._height,
      this._format,
      e,
      y.RenderAttachment
    );
    return {
      texture: n,
      view: n.createView(),
      width: this._width,
      height: this._height,
      format: this._format,
      isDefaultFramebuffer: !0
    };
  }
  dispose() {
    this._device = null;
  }
  applyBackingSize() {
    this.canvas.width = this._width, this.canvas.height = this._height, this._device?.invalidateState();
  }
}
class xf {
  label;
  gl;
  state;
  options;
  colorFormats;
  depthFormat;
  pipeline = null;
  bindGroups = /* @__PURE__ */ new Map();
  dynamicOffsets = /* @__PURE__ */ new Map();
  vertexBuffers = [];
  indexBuffer = null;
  stencilReference = 0;
  _ended = !1;
  constructor(e, n) {
    this.label = e.label ?? "renderPass", this.gl = n.gl, this.state = n.state, this.options = n;
    const r = e.target;
    if (r) {
      if (e.colorAttachments && e.colorAttachments.length > 0)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」同时给了 target 与 colorAttachments。请只保留一种写法：用 target 表示「画进这个渲染目标」，或用 colorAttachments 明确指定附件。`
        );
      this.colorFormats = r.colorFormats, this.depthFormat = r.depthFormat, r.bind({
        clearColor: e.clearValue,
        clearDepth: e.depthClearValue,
        clearStencil: e.depthClearValue === void 0 ? void 0 : 0,
        loadOp: e.colorAttachments?.[0]?.loadOp,
        depthLoadOp: e.depthStencilAttachment?.depthLoadOp
      }), this.state.invalidate(), this.state.setViewport(0, 0, r.width, r.height);
    } else {
      const i = e.colorAttachments.filter((a) => a !== null);
      if (i.length === 0 && !e.depthStencilAttachment)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`
        );
      if (this.colorFormats = i.map((a) => a.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null, i.some((a) => wr(a.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && wr(e.depthStencilAttachment.view))
        this.beginDefaultFramebufferPass(e);
      else {
        const a = n.framebuffers.acquire(e);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, a), this.state.invalidate();
        const o = i[0], l = o.view.texture.width, c = o.view.texture.height;
        this.clearRawAttachments(e, a), this.gl.viewport(0, 0, l, c), this.state.setViewport(0, 0, l, c);
      }
    }
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.pipeline = e, e.applyState(e.resolveVariant(this.variantRequest()), this.stencilReference);
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), e < 0 || e >= 4)
      throw new u(
        `[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${e}。`
      );
    const i = this.pipeline;
    if (i && i.layout !== "auto" && n) {
      const s = i.layout.bindGroupLayouts[e];
      if (s && s !== n.layout && !(s.sortedEntries.length === n.layout.sortedEntries.length && s.sortedEntries.every((o, l) => {
        const c = n.layout.sortedEntries[l];
        return o.binding === c.binding && o.type === c.type && o.name === c.name;
      })))
        throw new u(
          `[gpu-device-api] setBindGroup(${e}, ...) 传入的 bind group 与管线「${i.label}」在该 group 上声明的布局不一致（传入「${n.layout.label}」，期望「${s.label}」）。`
        );
    }
    this.bindGroups.set(e, n), r ? this.dynamicOffsets.set(e, [...r]) : this.dynamicOffsets.delete(e);
  }
  setVertexBuffer(e, n, r = 0, i = -1) {
    if (this.assertOpen("setVertexBuffer"), e < 0 || e >= 16)
      throw new u(`[gpu-device-api] setVertexBuffer 的 slot 必须在 0..15 之间，实际是 ${e}。`);
    if (n && n.isIndexBuffer)
      throw new u(
        `[gpu-device-api] buffer「${n.label}」是以 \`BufferUsage.Index\` 创建的索引缓冲，WebGL2 里一个 buffer 的绑定目标在创建时就永久固定（索引缓冲只能用 ELEMENT_ARRAY_BUFFER），所以它不能再当顶点缓冲使用。请为顶点数据单独创建一个 buffer。`
      );
    this.vertexBuffers[e] = n ? { buffer: n, offset: r, size: i } : null;
  }
  setIndexBuffer(e, n, r = 0, i = -1) {
    if (this.assertOpen("setIndexBuffer"), !e.isIndexBuffer)
      throw new u(
        `[gpu-device-api] buffer「${e.label}」的 usage 里没有 \`BufferUsage.Index\`，而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 \`BufferUsage.Index\`。`
      );
    this.indexBuffer = { buffer: e, format: n, offset: r, size: i };
  }
  setViewport(e, n, r, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), (s !== 0 || a !== 1) && this.gl.depthRange(s, a), this.state.setViewport(e, n, r, i);
  }
  setScissorRect(e, n, r, i) {
    this.assertOpen("setScissorRect"), this.state.setScissor(!0, e, n, r, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(yt(e));
  }
  setStencilReference(e) {
    this.assertOpen("setStencilReference"), this.stencilReference = e, this.pipeline && this.pipeline.applyState(this.pipeline.resolveVariant(this.variantRequest()), e);
  }
  draw(e) {
    this.assertOpen("draw");
    const n = this.requirePipeline("draw");
    this.assertNoUnsupportedInstancing(e.firstInstance ?? 0, 0);
    const r = e.instanceCount ?? 1;
    this.beginDraw(n, null), this.gl.drawArraysInstanced(
      n.mode,
      e.firstVertex ?? 0,
      e.vertexCount,
      r
    ), this.options.onDraw?.();
  }
  drawIndexed(e) {
    this.assertOpen("drawIndexed");
    const n = this.requirePipeline("drawIndexed"), r = this.indexBuffer;
    if (!r)
      throw new u(
        "[gpu-device-api] drawIndexed() 之前必须先调用 setIndexBuffer()。"
      );
    this.assertNoUnsupportedInstancing(e.firstInstance ?? 0, e.baseVertex ?? 0);
    const i = e.instanceCount ?? 1, s = r.offset + (e.firstIndex ?? 0) * Zs(r.format);
    this.beginDraw(n, r), this.gl.drawElementsInstanced(
      n.mode,
      e.indexCount,
      Nh[r.format],
      s,
      i
    ), this.options.onDraw?.();
  }
  drawIndirect(e, n = 0) {
    throw this.assertOpen("drawIndirect"), new u(
      "[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 draw() 提交，或改用 WebGPU 后端。"
    );
  }
  drawIndexedIndirect(e, n = 0) {
    throw this.assertOpen("drawIndexedIndirect"), new u(
      "[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 drawIndexed() 提交，或改用 WebGPU 后端。"
    );
  }
  end() {
    this._ended || (this._ended = !0, this.state.invalidate());
  }
  /* ------------------------------------------------------------------ 内部 ------------------- */
  /** 当前渲染目标的形态信息，用于让管线解析出对应状态。 */
  variantRequest() {
    return { colorFormats: this.colorFormats, sampleCount: 1, depthFormat: this.depthFormat };
  }
  requirePipeline(e) {
    if (!this.pipeline)
      throw new u(
        `[gpu-device-api] ${e}() 之前必须先调用 setPipeline()。`
      );
    return this.pipeline;
  }
  assertNoUnsupportedInstancing(e, n) {
    if (e !== 0)
      throw new u(
        "[gpu-device-api] WebGL2 不支持 `firstInstance`（缺少 drawArraysInstancedBaseInstance）。请把实例数据整体前移，或改用 WebGPU 后端。"
      );
    if (n !== 0)
      throw new u(
        "[gpu-device-api] WebGL2 不支持 `baseVertex`（缺少 drawElementsInstancedBaseVertex）。请把顶点偏移直接加到索引里，或改用 WebGPU 后端。"
      );
  }
  /** 一个 draw 之前必须完成的全部绑定工作。 */
  beginDraw(e, n) {
    const r = e.resolveVariant(this.variantRequest());
    e.applyState(r, this.stencilReference);
    const i = e.acquireVertexArray(
      r,
      this.vertexBuffers,
      n ? n.buffer.native : null
    );
    this.state.bindVertexArray(i), i === null && n && this.state.bindIndexBuffer(n.buffer.native), this.applyBindGroups(e);
  }
  applyBindGroups(e) {
    const n = e.bindingPlan;
    if (n) {
      for (const [r, i] of this.bindGroups) {
        if (!i) continue;
        const s = [...n.uniformBlocks.values()].filter((l) => l.group === r && l.dynamic).sort((l, c) => l.binding - c.binding), a = this.dynamicOffsets.get(r) ?? [];
        if (s.length > 0 && a.length < s.length)
          throw new u(
            `[gpu-device-api] setBindGroup(${r}, ...) 缺少动态偏移：布局里有 ${s.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${a.length} 个偏移值。`
          );
        let o = 0;
        for (const l of n.uniformBlocks.values()) {
          if (l.group !== r) continue;
          const c = i.entry(l.binding);
          if (!c)
            throw new u(
              `[gpu-device-api] bind group「${i.label}」缺少 binding ${l.binding}（布局要求提供 uniform buffer）。`
            );
          const h = c.resource, d = h.buffer, f = h.offset ?? 0;
          if (l.dynamic) {
            const p = this.state.context.getParameter(
              this.gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT
            ), m = a[o++] ?? 0;
            if (p > 0 && m % p !== 0)
              throw new u(
                `[gpu-device-api] 动态偏移 ${m} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${p}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
              );
            const g = f + m, b = h.size ?? d.size - g;
            this.state.bindUniformBuffer(l.blockBinding, d.native, g, b);
          } else
            this.state.bindUniformBuffer(l.blockBinding, d.native, 0, -1);
        }
        for (const l of n.textures.values()) {
          if (l.group !== r) continue;
          const c = i.entry(l.binding);
          if (!c)
            throw new u(
              `[gpu-device-api] bind group「${i.label}」缺少 binding ${l.binding}（布局要求提供纹理「${l.name}」）。`
            );
          const h = c.resource.view;
          if (this.assertViewRangeSupported(h), this.state.bindTexture(l.unit, h.target, h.glTexture), l.samplerBinding !== null) {
            const d = i.entry(l.samplerBinding);
            if (!d)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${l.samplerBinding}（纹理「${l.name}」配套的 sampler「${l.samplerName ?? "未命名"}」）。`
              );
            const f = d.resource.sampler;
            this.state.bindSampler(l.unit, f.native);
          }
        }
      }
      this.assertAllGroupsBound(n);
    }
  }
  /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
  assertAllGroupsBound(e) {
    const n = /* @__PURE__ */ new Set();
    for (const i of e.uniformBlocks.values()) n.add(i.group);
    for (const i of e.textures.values()) n.add(i.group);
    const r = [...n].filter((i) => !this.bindGroups.get(i));
    if (r.length > 0)
      throw new u(
        `[gpu-device-api] 管线需要 bind group ${r.join("、")}，但本次绘制前没有调用 setBindGroup()。缺少绑定会让着色器读到未定义的数据（画面通常全黑且没有任何报错），所以这里直接拦下。`
      );
  }
  /**
   * WebGL2 无法表达「同一个纹理的不同 mip 子范围视图」：mip 范围是纹理对象自身的参数，
   * 不是绑定点状态。为了避免同一张纹理被两个 view 以不同 mip 范围采样时结果错乱，这里直接报错。
   */
  assertViewRangeSupported(e) {
    const n = e.descriptor, r = e.texture;
    if (n.baseMipLevel !== 0 || n.mipLevelCount !== r.mipLevelCount)
      throw new u(
        `[gpu-device-api] WebGL2 后端不支持在绑定时指定 mip 子范围（纹理「${r.label}」的 view 指定了 baseMipLevel=${n.baseMipLevel}, mipLevelCount=${n.mipLevelCount}）。mip 范围是纹理对象自身的状态，不是绑定点状态。请为需要的 mip 范围单独创建一张纹理。`
      );
  }
  /** 原始附件（不走 RenderTarget）路径下的清屏。 */
  clearRawAttachments(e, n) {
    const r = this.gl;
    this.state.setScissor(!1, 0, 0, r.drawingBufferWidth, r.drawingBufferHeight), e.colorAttachments.forEach((a, o) => {
      if (!a || a.loadOp === "load") return;
      const [l, c, h, d] = yt(a.clearValue);
      r.clearBufferfv(r.COLOR, o, new Float32Array([l, c, h, d]));
    });
    const s = e.depthStencilAttachment;
    if (s && s.depthLoadOp !== "load") {
      r.depthMask(!0);
      const a = s.depthClearValue ?? 1, o = s.stencilClearValue ?? 0;
      s.view.texture.format.includes("stencil") ? r.clearBufferfi(r.DEPTH_STENCIL, 0, a, o) : r.clearBufferfv(r.DEPTH, 0, new Float32Array([a]));
    }
    this.state.invalidate();
  }
  /**
   * 画进默认帧缓冲（canvas）。
   *
   * 默认帧缓冲只有 BACK 一个颜色缓冲，没有 FBO 对象，所以这里用最传统的
   * `clearColor` + `clear` 组合，而不是 `clearBufferfv`（后者对默认帧缓冲的行为各实现不一）。
   */
  beginDefaultFramebufferPass(e) {
    const n = this.gl;
    n.bindFramebuffer(n.FRAMEBUFFER, null), this.state.invalidate();
    const r = n.drawingBufferWidth, i = n.drawingBufferHeight;
    this.state.setScissor(!1, 0, 0, r, i);
    const s = e.colorAttachments.find((o) => o !== null);
    if (s && s.loadOp !== "load") {
      const [o, l, c, h] = yt(s.clearValue);
      n.clearColor(o, l, c, h), n.clear(n.COLOR_BUFFER_BIT);
    }
    const a = e.depthStencilAttachment;
    a && a.depthLoadOp !== "load" && (n.depthMask(!0), n.clearDepth(a.depthClearValue ?? 1), n.clear(n.DEPTH_BUFFER_BIT)), n.viewport(0, 0, r, i), this.state.setViewport(0, 0, r, i);
  }
  assertOpen(e) {
    if (this._ended)
      throw new u(
        `[gpu-device-api] 渲染通道「${this.label}」已经 end()，不能再调用 ${e}()。`
      );
  }
}
const ke = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class vf {
  label = "computePass";
  constructor(e) {
    throw new u(ke);
  }
  get ended() {
    return !0;
  }
  setPipeline(e) {
    throw new u(ke);
  }
  setBindGroup(e, n, r) {
    throw new u(ke);
  }
  dispatchWorkgroups(e, n, r) {
    throw new u(ke);
  }
  dispatchWorkgroupsIndirect(e, n) {
    throw new u(ke);
  }
  end() {
  }
}
class yf {
  label;
  gl;
  state;
  passOptions;
  openPass = null;
  drawCalls = 0;
  passCount = 0;
  finished = !1;
  constructor(e, n, r, i) {
    this.label = e?.label ?? G("commandEncoder"), this.gl = n, this.state = r, this.passOptions = i;
  }
  /** 由渲染通道回调，用于统计。 */
  noteDrawCall() {
    this.drawCalls += 1;
  }
  beginRenderPass(e) {
    if (this.assertOpen("beginRenderPass"), this.openPass && !this.openPass.ended)
      throw new u(
        `[gpu-device-api] encoder「${this.label}」里已经有打开的渲染通道了。WebGPU 也只允许同时打开一个通道，请先 end() 再开始下一个。`
      );
    const n = new xf(e, this.passOptions);
    return this.openPass = n, this.passCount += 1, n;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), new vf();
  }
  copyBufferToBuffer(e, n, r, i, s) {
    this.assertOpen("copyBufferToBuffer");
    const a = e, o = r, l = new Uint8Array(s);
    if (a.isIndexBuffer || o.isIndexBuffer) {
      a.download(n, l), o.upload(i, l);
      return;
    }
    this.state.bindCopyReadBuffer(a.native), this.gl.getBufferSubData(this.gl.COPY_READ_BUFFER, n, l), this.state.bindCopyWriteBuffer(o.native), this.gl.bufferSubData(this.gl.COPY_WRITE_BUFFER, i, l);
  }
  copyBufferToTexture(e, n, r) {
    this.assertOpen("copyBufferToTexture");
    const i = this.gl, s = e.buffer, a = n.texture.native, o = n.texture.format, l = k(o), { x: c, y: h, z: d } = dt(n.origin), f = e.bytesPerRow ?? r.width * l.bytesPerPixel, p = r.height, m = new Uint8Array(f * p);
    s.download(e.offset ?? 0, m), i.bindTexture(n.texture.target, a), i.pixelStorei(i.UNPACK_ALIGNMENT, 1), f !== r.width * l.bytesPerPixel && i.pixelStorei(i.UNPACK_ROW_LENGTH, f / l.bytesPerPixel);
    const g = n.texture.target;
    g === i.TEXTURE_3D || g === i.TEXTURE_2D_ARRAY ? i.texSubImage3D(
      g,
      n.mipLevel ?? 0,
      c,
      h,
      d,
      r.width,
      r.height,
      r.depthOrArrayLayers,
      l.format,
      l.type,
      m
    ) : i.texSubImage2D(
      g,
      n.mipLevel ?? 0,
      c,
      h,
      r.width,
      r.height,
      l.format,
      l.type,
      m
    ), i.pixelStorei(i.UNPACK_ROW_LENGTH, 0), i.pixelStorei(i.UNPACK_ALIGNMENT, 4), this.state.invalidate();
  }
  copyTextureToBuffer(e, n, r) {
    this.assertOpen("copyTextureToBuffer");
    const i = this.gl, s = e.texture, a = k(s.format), o = li(
      n.bytesPerRow ?? r.width * a.bytesPerPixel,
      4
    ), l = new Uint8Array(o * r.height), c = i.createFramebuffer();
    if (!c)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法读回纹理。");
    const h = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, c);
    const d = a.depth ? i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0;
    i.framebufferTexture2D(i.FRAMEBUFFER, d, i.TEXTURE_2D, s.native, e.mipLevel ?? 0);
    const f = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (f !== i.FRAMEBUFFER_COMPLETE)
      throw i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(c), new u(
        `[gpu-device-api] 无法把纹理「${s.label}」作为附件读回（framebuffer 不完整，0x${f.toString(16)}）。请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。`
      );
    i.pixelStorei(i.PACK_ALIGNMENT, 1);
    const { x: p, y: m } = dt(e.origin);
    i.readPixels(p, m, r.width, r.height, a.format, a.type, l), i.pixelStorei(i.PACK_ALIGNMENT, 4), i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(c), this.state.invalidate(), n.buffer.upload(n.offset ?? 0, l);
  }
  copyTextureToTexture(e, n, r) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = n.texture, o = k(a.format), { x: l, y: c } = dt(e.origin), { x: h, y: d } = dt(n.origin), f = i.createFramebuffer(), p = i.createFramebuffer();
    if (!f || !p)
      throw new u("[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。");
    const m = i.getParameter(i.FRAMEBUFFER_BINDING);
    if (i.bindFramebuffer(i.READ_FRAMEBUFFER, f), i.framebufferTexture2D(
      i.READ_FRAMEBUFFER,
      i.COLOR_ATTACHMENT0,
      i.TEXTURE_2D,
      s.native,
      e.mipLevel ?? 0
    ), i.bindFramebuffer(i.DRAW_FRAMEBUFFER, p), i.framebufferTexture2D(
      i.DRAW_FRAMEBUFFER,
      i.COLOR_ATTACHMENT0,
      i.TEXTURE_2D,
      a.native,
      n.mipLevel ?? 0
    ), k(s.format).internalFormat !== o.internalFormat)
      throw new u(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${s.format}」，目标是「${a.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`
      );
    i.blitFramebuffer(
      l,
      c,
      l + r.width,
      c + r.height,
      h,
      d,
      h + r.width,
      d + r.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, m), i.deleteFramebuffer(f), i.deleteFramebuffer(p), this.state.invalidate();
  }
  clearBuffer(e, n = 0, r) {
    this.assertOpen("clearBuffer");
    const i = e, s = r ?? e.size - n, a = new Uint8Array(s);
    i.upload(n, a);
  }
  finish() {
    if (this.assertOpen("finish"), this.openPass && !this.openPass.ended)
      throw new u(
        `[gpu-device-api] encoder「${this.label}」还有未结束的渲染通道，请先调用 pass.end()。`
      );
    return this.finished = !0, {
      label: `${this.label}:commandBuffer`,
      native: null,
      drawCalls: this.drawCalls,
      passCount: this.passCount,
      disposed: !1,
      dispose: () => {
      }
    };
  }
  assertOpen(e) {
    if (this.finished)
      throw new u(
        `[gpu-device-api] encoder「${this.label}」已经 finish()，不能再调用 ${e}()。`
      );
  }
}
function dt(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function $f(t) {
  const e = t.colorAttachments.map((r) => r ? xr(r) : "-").join(","), n = t.depthStencilAttachment ? xr(t.depthStencilAttachment) : "-";
  return `${e}|${n}`;
}
function xr(t) {
  const e = t.view, n = e.texture;
  return `${e.label}@${n.label}#${n.width}x${n.height}`;
}
class Tf {
  gl;
  framebuffers = /* @__PURE__ */ new Map();
  constructor(e) {
    this.gl = e;
  }
  get size() {
    return this.framebuffers.size;
  }
  /** 取得（必要时创建）与这组附件匹配的 framebuffer。 */
  acquire(e) {
    const n = $f(e), r = this.framebuffers.get(n);
    if (r) return r;
    const i = this.gl, s = i.createFramebuffer();
    if (!s)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。");
    const a = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, s);
    let o = 0;
    for (const h of e.colorAttachments) {
      if (!h) continue;
      const d = h.view, f = d.target;
      f === i.TEXTURE_2D ? i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + o, f, d.glTexture, 0) : i.framebufferTextureLayer(
        i.FRAMEBUFFER,
        i.COLOR_ATTACHMENT0 + o,
        d.glTexture,
        d.descriptor.baseMipLevel,
        d.descriptor.baseArrayLayer
      ), o += 1;
    }
    o > 0 && i.drawBuffers(
      Array.from({ length: o }, (h, d) => i.COLOR_ATTACHMENT0 + d)
    );
    const l = e.depthStencilAttachment;
    if (l) {
      const h = l.view, f = k(h.texture.format).stencil ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
      i.framebufferTexture2D(i.FRAMEBUFFER, f, i.TEXTURE_2D, h.glTexture, 0);
    }
    i.bindFramebuffer(i.FRAMEBUFFER, a), i.bindFramebuffer(i.FRAMEBUFFER, s);
    const c = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (i.bindFramebuffer(i.FRAMEBUFFER, a), c !== i.FRAMEBUFFER_COMPLETE)
      throw i.deleteFramebuffer(s), new u(
        `[gpu-device-api] 这组渲染附件在 WebGL2 下不构成完整的 framebuffer（GL 状态码 0x${c.toString(16)}）。
常见原因：颜色附件格式不可渲染、多个附件的尺寸/采样数不一致、深度附件与颜色附件不匹配。`
      );
    return this.framebuffers.set(n, s), s;
  }
  clear() {
    for (const e of this.framebuffers.values())
      this.gl.deleteFramebuffer(e);
    this.framebuffers.clear();
  }
  dispose() {
    this.clear();
  }
}
class Sf {
  label = G("queue");
  gl;
  state;
  submittedCount = 0;
  pending = Promise.resolve();
  constructor(e, n) {
    this.gl = e, this.state = n;
  }
  /** 已提交的 command buffer 数量（用于测试与统计）。 */
  get submitted() {
    return this.submittedCount;
  }
  writeBuffer(e, n, r, i = 0, s) {
    const a = e, o = s ?? r.byteLength - i;
    if (n + o > a.size)
      throw new u(
        `[gpu-device-api] writeBuffer 越界：写入范围 [${n}, ${n + o}) 超出了 buffer「${a.label}」的 ${a.size} 字节。`
      );
    const l = new Uint8Array(r.buffer, r.byteOffset + i, o);
    a.upload(n, ua(l));
  }
  writeTexture(e, n, r, i) {
    const s = e.texture, a = k(s.format);
    Uh(s.format, n);
    const o = vr(e.origin), l = r.bytesPerRow ?? i.width * a.bytesPerPixel, c = this.gl;
    c.bindTexture(s.target, s.native), c.pixelStorei(c.UNPACK_ALIGNMENT, 1), l !== i.width * a.bytesPerPixel && c.pixelStorei(c.UNPACK_ROW_LENGTH, l / a.bytesPerPixel);
    const h = new Uint8Array(n.buffer, n.byteOffset + r.offset, n.byteLength - r.offset);
    s.target === c.TEXTURE_3D || s.target === c.TEXTURE_2D_ARRAY ? c.texSubImage3D(
      s.target,
      e.mipLevel ?? 0,
      o.x,
      o.y,
      o.z,
      i.width,
      i.height,
      i.depthOrArrayLayers,
      a.format,
      a.type,
      h
    ) : c.texSubImage2D(
      s.target,
      e.mipLevel ?? 0,
      o.x,
      o.y,
      i.width,
      i.height,
      a.format,
      a.type,
      h
    ), c.pixelStorei(c.UNPACK_ROW_LENGTH, 0), c.pixelStorei(c.UNPACK_ALIGNMENT, 4), this.state.invalidate();
  }
  copyExternalImageToTexture(e, n, r, i = !1) {
    const s = n.texture, a = k(s.format), o = this.gl, l = vr(n.origin);
    o.bindTexture(s.target, s.native), o.pixelStorei(o.UNPACK_ALIGNMENT, 1), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, i ? 1 : 0);
    try {
      s.target === o.TEXTURE_3D || s.target === o.TEXTURE_2D_ARRAY ? o.texSubImage3D(
        s.target,
        n.mipLevel ?? 0,
        l.x,
        l.y,
        l.z,
        r.width,
        r.height,
        r.depthOrArrayLayers,
        a.format,
        a.type,
        e
      ) : o.texSubImage2D(
        s.target,
        n.mipLevel ?? 0,
        l.x,
        l.y,
        r.width,
        r.height,
        a.format,
        a.type,
        e
      );
    } finally {
      o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, 0), o.pixelStorei(o.UNPACK_ALIGNMENT, 4);
    }
    this.state.invalidate();
  }
  copyBufferToBuffer(e, n, r, i, s) {
    const a = this.gl, o = e, l = r, c = new Uint8Array(s);
    if (o.isIndexBuffer || l.isIndexBuffer) {
      o.download(n, c), l.upload(i, c);
      return;
    }
    this.state.bindCopyReadBuffer(o.native), a.getBufferSubData(a.COPY_READ_BUFFER, n, c), this.state.bindCopyWriteBuffer(l.native), a.bufferSubData(a.COPY_WRITE_BUFFER, i, c);
  }
  copyBufferToTexture(e, n, r) {
    const i = k(n.texture.format), s = e.bytesPerRow ?? r.width * i.bytesPerPixel, a = new Uint8Array(s * r.height);
    e.buffer.download(e.offset ?? 0, a), this.writeTexture(n, a, { offset: 0, bytesPerRow: s }, r);
  }
  submit(e) {
    this.submittedCount += e.length, e.length > 0 && this.gl.flush();
  }
  async onSubmittedWorkDone() {
    await this.pending, this.gl.finish();
  }
}
function vr(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
class Af {
  label = G("fence");
  gl;
  sync;
  _signaled = !1;
  constructor(e) {
    this.gl = e, this.sync = e.fenceSync(e.SYNC_GPU_COMMANDS_COMPLETE, 0), e.flush();
  }
  get signaled() {
    return this._signaled;
  }
  /** 非阻塞检查。已经 signal 过或 fence 对象创建失败时都返回 true。 */
  poll() {
    if (this._signaled) return !0;
    if (!this.sync)
      return this._signaled = !0, !0;
    const e = this.gl.clientWaitSync(this.sync, 0, 0);
    return e === this.gl.ALREADY_SIGNALED || e === this.gl.CONDITION_SATISFIED ? (this._signaled = !0, this.gl.deleteSync(this.sync), !0) : e === this.gl.WAIT_FAILED ? (this._signaled = !0, !0) : !1;
  }
  async wait() {
    if (!this._signaled) {
      if (!this.sync) {
        this._signaled = !0;
        return;
      }
      for (; ; ) {
        if (this.poll()) return;
        await _f();
      }
    }
  }
}
function _f() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
class Ef {
  label;
  backend = "webgl2";
  features;
  limits;
  queue;
  debug;
  native;
  /** 状态缓存；canvas context 等在外部改动 GL 状态后会调用 {@link WebGL2Device.invalidateState}。 */
  state;
  planCache;
  programs;
  framebuffers;
  canvas;
  gl;
  logger;
  resources = /* @__PURE__ */ new Set();
  errorCallbacks = /* @__PURE__ */ new Set();
  canvasContexts = /* @__PURE__ */ new Map();
  lostResolve;
  lostPromise;
  _disposed = !1;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? Ke("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? G("webgl2Device"), this.limits = oi(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const n = [...e.adapterFeatures], r = new Set(n), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !r.has(a));
    if (i.length > 0)
      throw new u(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${n.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => r.has(a),
      names: n
    }, this.state = new zu(e.gl), this.planCache = new nf({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new rf({ gl: e.gl, state: this.state }), this.framebuffers = new Tf(e.gl), this.queue = new Sf(e.gl, this.state), this.lostPromise = new Promise((a) => {
      this.lostResolve = a;
    });
    const s = e.canvas;
    typeof s.addEventListener == "function" && s.addEventListener("webglcontextlost", (a) => {
      a.preventDefault(), this.lostResolve({ reason: "unknown", message: "WebGL2 上下文丢失（通常是驱动重置或资源占用过高）。" });
    });
  }
  get disposed() {
    return this._disposed;
  }
  get lost() {
    return this.lostPromise;
  }
  /** 让 GL 状态缓存失效；外部通过 escape hatch 改动状态后必须调用。 */
  invalidateState() {
    this.state.invalidate();
  }
  /* ------------------------------------------------------------------ 资源 ------------------- */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(
      new ju(this.gl, this.state, e, (n) => {
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new ar(this.gl, this.state, e, () => {
        this.framebuffers.clear();
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, n, r, i, s) {
    return this.track(
      new ar(
        this.gl,
        this.state,
        { format: e, size: { width: n, height: r }, usage: i, label: s },
        () => this.framebuffers.clear()
      )
    );
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Qh(this.gl, this.state, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new Kh(e));
  }
  createQuerySet(e) {
    throw this.assertUsable("createQuerySet"), new u(
      `[gpu-device-api] WebGL2 后端暂不支持 query set（「${e.label ?? e.type}」）。WebGL2 的遮挡查询只能同步读回单个样本数，没有查询结果缓冲区的概念。`
    );
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new dr(e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Jh(e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(new pr(e, !1, this));
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const n = e.label ?? "renderPipeline", r = xn({
      backend: "webgl2",
      source: e.vertex.module.source,
      stage: j.Vertex,
      label: n,
      defines: e.vertex.module.defines
    }).code;
    if (!e.fragment)
      throw new u(
        "[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n只写深度时，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    const i = xn({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: j.Fragment,
      label: n,
      defines: e.fragment.module.defines
    }).code, s = this.programs.acquire(n, r, i);
    let a;
    if (e.layout === void 0 || e.layout === "auto") {
      const l = Bu(s.reflection, j.Vertex | j.Fragment);
      if (l.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const c = new dr({
          label: `${n}:autoLayout`,
          entries: l
        });
        this.track(c), a = this.track(
          new pr(
            { label: `${n}:autoPipelineLayout`, bindGroupLayouts: [c] },
            !0,
            this
          )
        ), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else
      a = e.layout, this.programs.bindPlan(s, a.bindingPlan);
    const o = new cf(e, s, a, {
      gl: this.gl,
      state: this.state,
      limits: {
        maxVertexAttributes: this.limits.maxVertexAttributes,
        maxVertexBufferArrayStride: this.limits.maxVertexBufferArrayStride
      }
    });
    return this.track(o);
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), new ff(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    return this.assertUsable("createRenderTarget"), this.track(
      new pf(e, {
        gl: this.gl,
        state: this.state,
        createTexture: (n, r, i, s, a) => this.createAttachmentTexture(n, r, i, s, a)
      })
    );
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new yf(e, this.gl, this.state, {
      gl: this.gl,
      state: this.state,
      framebuffers: this.framebuffers,
      getDefaultSize: () => ({ width: this.gl.drawingBufferWidth, height: this.gl.drawingBufferHeight }),
      onDraw: () => {
        this.debug && this.checkGlError("draw");
      }
    });
  }
  createCanvasContext(e, n) {
    if (this.assertUsable("createCanvasContext"), e !== this.canvas)
      throw new u(
        `[gpu-device-api] WebGL2 的 device 只能服务创建它的那个 canvas。
GL context 是从 canvas 上取的，一个 device 对应一个 canvas；如果确实需要渲染到多个 canvas，请为每个 canvas 单独 createDevice()。`
      );
    let r = this.canvasContexts.get(e);
    return r || (r = new wf({ gl: this.gl, canvas: e, format: n?.format }), this.canvasContexts.set(e, r)), r.configure({ ...n, device: this }), this.state.invalidate(), r;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new Af(this.gl);
  }
  /* ------------------------------------------------------------------ 错误 ------------------- */
  onError(e) {
    return this.errorCallbacks.add(e), () => this.errorCallbacks.delete(e);
  }
  reportError(e) {
    if (this.errorCallbacks.size === 0) {
      this.logger.error(e.message);
      return;
    }
    for (const n of this.errorCallbacks) n(e);
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = !0;
    const e = [...this.resources];
    this.resources.clear();
    for (const n of e)
      try {
        n.dispose();
      } catch (r) {
        this.logger.warn("释放资源时出错", r);
      }
    this.programs.dispose(), this.framebuffers.dispose(), this.planCache.clear();
    for (const n of this.canvasContexts.values()) n.dispose();
    this.canvasContexts.clear(), this.state.invalidate(), this.lostResolve({ reason: "destroyed", message: "设备已调用 dispose()。" });
  }
  /**
   * 在 debug 模式下轮询 `gl.getError()` 并转成统一错误。
   * 注意这会强制 CPU/GPU 同步，所以只在 debug 打开时调用。
   */
  checkGlError(e) {
    if (!this.debug) return;
    const n = this.gl.getError();
    n !== this.gl.NO_ERROR && this.reportError(
      new fe(`[gpu-device-api] GL 错误 0x${n.toString(16)}（发生在 ${e} 之后）。`, {
        code: "GL_ERROR",
        details: { glError: n, context: e }
      })
    );
  }
  track(e) {
    return this.resources.add(e), e;
  }
  assertUsable(e) {
    if (this._disposed)
      throw new dn(`[gpu-device-api] 设备已 dispose()，不能再调用 ${e}()。`, {
        reason: "destroyed"
      });
  }
}
const Lf = {
  antialias: !0,
  alpha: !1,
  depth: !0,
  stencil: !1,
  premultipliedAlpha: !0,
  preserveDrawingBuffer: !1,
  powerPreference: "high-performance",
  desynchronized: !1
};
class jn {
  info;
  features;
  limits;
  gl;
  canvas;
  logger;
  device = null;
  constructor(e, n, r, i, s) {
    this.gl = e, this.canvas = n, this.limits = r, this.features = i, this.logger = s;
    const a = Du(e);
    this.info = {
      backend: "webgl2",
      vendor: a.vendor,
      architecture: "",
      device: a.device || "WebGL2",
      description: a.device || "WebGL2 设备",
      // WebGL2 无法可靠判断是否为软件光栅化：SWIFTShader 之类通常也能通过 debug 扩展报出名字，
      // 但名字并不统一，所以这里保守地一律报 false，需要时可由使用方读取 info.device 自行判断。
      isFallbackAdapter: !1
    };
  }
  /**
   * 在给定 canvas 上探测 WebGL2 并返回 adapter。
   * 拿不到 context 时抛错（而不是返回 null），错误信息里会说明常见原因。
   */
  static async request(e) {
    const n = { ...Lf, ...e.contextAttributes }, r = Nu(e.canvas, n), i = Ou(r), s = Iu(r);
    return new jn(r, e.canvas, i, s, e.logger);
  }
  /** 已经为这个 canvas 创建过 GL context（用于避免重复初始化）。 */
  get context() {
    return this.gl;
  }
  async requestDevice(e = {}) {
    if (this.device && !this.device.disposed)
      throw new u(
        `[gpu-device-api] 这个 WebGL2 adapter 已经创建过 device 了。
GL context 与 canvas 是一一对应的，一个 adapter 只能产出一个 device；请复用已有的 device，或为另一个 canvas 单独 requestAdapter()。`
      );
    const n = new Ef({
      gl: this.gl,
      canvas: this.canvas,
      descriptor: e,
      adapterLimits: this.limits,
      adapterFeatures: this.features,
      logger: this.logger
    });
    return this.device = n, n;
  }
  /** 该 adapter 已经创建出的 device（未创建时为 `null`）。 */
  get currentDevice() {
    return this.device;
  }
}
const qn = Object.freeze({
  // 8 位单通道
  r8unorm: "r8unorm",
  r8snorm: "r8snorm",
  r8uint: "r8uint",
  r8sint: "r8sint",
  // 16 位单通道
  r16uint: "r16uint",
  r16sint: "r16sint",
  r16float: "r16float",
  // 8 位双通道
  rg8unorm: "rg8unorm",
  rg8snorm: "rg8snorm",
  rg8uint: "rg8uint",
  rg8sint: "rg8sint",
  // 32 位单通道
  r32uint: "r32uint",
  r32sint: "r32sint",
  r32float: "r32float",
  // 16 位双通道
  rg16uint: "rg16uint",
  rg16sint: "rg16sint",
  rg16float: "rg16float",
  // 8 位四通道
  rgba8unorm: "rgba8unorm",
  "rgba8unorm-srgb": "rgba8unorm-srgb",
  rgba8snorm: "rgba8snorm",
  rgba8uint: "rgba8uint",
  rgba8sint: "rgba8sint",
  bgra8unorm: "bgra8unorm",
  "bgra8unorm-srgb": "bgra8unorm-srgb",
  // 打包格式
  rgb9e5ufloat: "rgb9e5ufloat",
  rgb10a2unorm: "rgb10a2unorm",
  rg11b10ufloat: "rg11b10ufloat",
  // 32 位双通道
  rg32uint: "rg32uint",
  rg32sint: "rg32sint",
  rg32float: "rg32float",
  // 16 位四通道
  rgba16uint: "rgba16uint",
  rgba16sint: "rgba16sint",
  rgba16float: "rgba16float",
  // 32 位四通道
  rgba32uint: "rgba32uint",
  rgba32sint: "rgba32sint",
  rgba32float: "rgba32float",
  // depth / stencil
  depth16unorm: "depth16unorm",
  depth24plus: "depth24plus",
  "depth24plus-stencil8": "depth24plus-stencil8",
  depth32float: "depth32float",
  stencil8: "stencil8"
});
function x(t, e, n, r = {}) {
  const i = e === "depth" || e === "stencil" ? "depth" : e === "uint" ? "uint" : e === "sint" ? "sint" : "float";
  return {
    gpuFormat: qn[t],
    kind: e,
    bytesPerTexel: n,
    renderable: r.renderable ?? !1,
    depthStencilAttachment: r.depthStencilAttachment ?? !1,
    sampleable: r.sampleable ?? !0,
    storage: r.storage ?? !1,
    copyable: r.copyable ?? !0,
    filterable: r.filterable ?? !1,
    renderFeature: r.renderFeature,
    storageFeature: r.storageFeature,
    filterFeature: r.filterFeature,
    sampleScalar: i
  };
}
const Pf = Object.freeze({
  r8unorm: x("r8unorm", "unorm", 1, { renderable: !0, filterable: !0 }),
  r8snorm: x("r8snorm", "snorm", 1, { filterable: !1 }),
  r8uint: x("r8uint", "uint", 1, { renderable: !0 }),
  r8sint: x("r8sint", "sint", 1, { renderable: !0 }),
  r16uint: x("r16uint", "uint", 2, { renderable: !0 }),
  r16sint: x("r16sint", "sint", 2, { renderable: !0 }),
  r16float: x("r16float", "float", 2, { renderable: !0, filterable: !0 }),
  rg8unorm: x("rg8unorm", "unorm", 2, { renderable: !0, filterable: !0 }),
  rg8snorm: x("rg8snorm", "snorm", 2, {}),
  rg8uint: x("rg8uint", "uint", 2, { renderable: !0 }),
  rg8sint: x("rg8sint", "sint", 2, { renderable: !0 }),
  r32uint: x("r32uint", "uint", 4, { renderable: !0, storage: !0 }),
  r32sint: x("r32sint", "sint", 4, { renderable: !0, storage: !0 }),
  r32float: x("r32float", "float", 4, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rg16uint: x("rg16uint", "uint", 4, { renderable: !0 }),
  rg16sint: x("rg16sint", "sint", 4, { renderable: !0 }),
  rg16float: x("rg16float", "float", 4, { renderable: !0, filterable: !0 }),
  rgba8unorm: x("rgba8unorm", "unorm", 4, { renderable: !0, storage: !0, filterable: !0 }),
  "rgba8unorm-srgb": x("rgba8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgba8snorm: x("rgba8snorm", "snorm", 4, { storage: !0 }),
  rgba8uint: x("rgba8uint", "uint", 4, { renderable: !0, storage: !0 }),
  rgba8sint: x("rgba8sint", "sint", 4, { renderable: !0, storage: !0 }),
  bgra8unorm: x("bgra8unorm", "unorm", 4, {
    renderable: !0,
    filterable: !0,
    storageFeature: "bgra8unorm-storage"
  }),
  "bgra8unorm-srgb": x("bgra8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgb9e5ufloat: x("rgb9e5ufloat", "float", 4, {}),
  rgb10a2unorm: x("rgb10a2unorm", "unorm", 4, { renderable: !0, filterable: !0 }),
  rg11b10ufloat: x("rg11b10ufloat", "float", 4, { renderFeature: "rg11b10ufloat-renderable" }),
  rg32uint: x("rg32uint", "uint", 8, { renderable: !0, storage: !0 }),
  rg32sint: x("rg32sint", "sint", 8, { renderable: !0, storage: !0 }),
  rg32float: x("rg32float", "float", 8, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rgba16uint: x("rgba16uint", "uint", 8, { renderable: !0, storage: !0 }),
  rgba16sint: x("rgba16sint", "sint", 8, { renderable: !0, storage: !0 }),
  rgba16float: x("rgba16float", "float", 8, { renderable: !0, storage: !0, filterable: !0 }),
  rgba32uint: x("rgba32uint", "uint", 16, { renderable: !0, storage: !0 }),
  rgba32sint: x("rgba32sint", "sint", 16, { renderable: !0, storage: !0 }),
  rgba32float: x("rgba32float", "float", 16, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  depth16unorm: x("depth16unorm", "depth", 2, {
    depthStencilAttachment: !0,
    filterable: !0
  }),
  // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
  // 因此没有确定的内存布局：既不能采样，也不能拷贝。
  depth24plus: x("depth24plus", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  "depth24plus-stencil8": x("depth24plus-stencil8", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  depth32float: x("depth32float", "depth", 4, {
    depthStencilAttachment: !0,
    filterFeature: "float32-filterable"
  }),
  stencil8: x("stencil8", "stencil", 1, {
    depthStencilAttachment: !0,
    sampleable: !1
  })
});
function Ae(t) {
  const e = Pf[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function K(t) {
  const e = qn[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function Mf(t) {
  for (const [e, n] of Object.entries(qn))
    if (n === t) return e;
  throw new u(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function cs(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function Dt(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function Cf(t, e) {
  const n = Ae(t);
  return n.filterable ? !0 : n.filterFeature && e ? e.has(n.filterFeature) : !1;
}
function Ff(t, e, n) {
  const r = Ae(t);
  if (!(r.renderable || r.depthStencilAttachment)) {
    if (r.renderFeature) {
      if (e ? e.has(r.renderFeature) : !1) return;
      throw new u(
        `[gpu-device-api] ${n}: "${t}" requires the "${r.renderFeature}" device feature to be used as a render attachment (it is not enabled on this device).`
      );
    }
    throw new u(
      `[gpu-device-api] ${n}: "${t}" cannot be used as a render attachment in WebGPU (snorm color formats and rgb9e5ufloat have no renderable support).`
    );
  }
}
function Bf(t, e, n = !1) {
  const r = Ae(t);
  if (n)
    throw new u(
      `[gpu-device-api] ${e}: a multisampled texture ("${t}", sampleCount > 1) cannot be used as a TextureBinding; WebGPU only allows multisampled textures as render attachments.`
    );
  if (!r.sampleable)
    throw r.kind === "stencil" ? new u(
      `[gpu-device-api] ${e}: "stencil8" has no sampleable aspect; bind a depth format instead.`
    ) : new u(
      `[gpu-device-api] ${e}: "${t}" can only be used as a depth/stencil attachment and cannot be sampled (its memory layout is implementation defined). Use "depth32float" or "depth16unorm" when the depth texture has to be read in a shader.`
    );
}
function ls(t, e, n) {
  const r = Ae(t);
  if (!r.storage) {
    if (r.storageFeature) {
      if (e?.has(r.storageFeature)) return;
      throw new u(
        `[gpu-device-api] ${n}: "${t}" requires the "${r.storageFeature}" device feature to be used as a storage texture (it is not enabled on this device).`
      );
    }
    throw new u(
      `[gpu-device-api] ${n}: "${t}" cannot be used as a storage texture. WebGPU only allows r32uint/r32sint/r32float, rg32*, rgba8unorm(-snorm/uint/sint), rgba16*, rgba32* and bgra8unorm (with the bgra8unorm-storage feature).`
    );
  }
}
function Rf(t, e) {
  if (!Ae(t).copyable)
    throw new u(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function Gf(t, e, n) {
  if (e !== "all") {
    if (e === "depth-only" && !cs(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !Dt(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function Uf(t, e, n, r) {
  Ae(t);
  const i = n.sampleCount ?? 1;
  if (e & y.RenderAttachment && Ff(t, n.features, r), e & y.TextureBinding && Bf(t, r, i > 1), e & y.StorageBinding && ls(t, n.features, r), e & (y.CopySrc | y.CopyDst) && Rf(t, r), i > 1) {
    if (i !== 4)
      throw new u(
        `[gpu-device-api] ${r}: sampleCount must be 1 or 4, got ${String(i)}.`
      );
    if ((n.mipLevelCount ?? 1) > 1)
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture must have exactly one mip level.`
      );
    if (n.dimension !== void 0 && n.dimension !== "2d")
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture must be "2d", got "${n.dimension}".`
      );
    if (e & (y.CopySrc | y.CopyDst))
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture cannot be a copy source or destination; resolve it into a single-sampled texture first.`
      );
    if (e & (y.TextureBinding | y.StorageBinding))
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture can only be used as a render attachment.`
      );
  }
}
const Of = [
  "maxTextureDimension1D",
  "maxTextureDimension2D",
  "maxTextureDimension3D",
  "maxTextureArrayLayers",
  "maxBindGroups",
  "maxBindGroupsPlusVertexBuffers",
  "maxBindingsPerBindGroup",
  "maxDynamicUniformBuffersPerPipelineLayout",
  "maxDynamicStorageBuffersPerPipelineLayout",
  "maxSampledTexturesPerShaderStage",
  "maxSamplersPerShaderStage",
  "maxStorageBuffersPerShaderStage",
  "maxStorageTexturesPerShaderStage",
  "maxUniformBuffersPerShaderStage",
  "maxUniformBufferBindingSize",
  "maxStorageBufferBindingSize",
  "minUniformBufferOffsetAlignment",
  "minStorageBufferOffsetAlignment",
  "maxVertexBuffers",
  "maxBufferSize",
  "maxVertexAttributes",
  "maxVertexBufferArrayStride",
  "maxInterStageShaderVariables",
  "maxColorAttachments",
  "maxColorAttachmentBytesPerSample",
  "maxComputeWorkgroupStorageSize",
  "maxComputeInvocationsPerWorkgroup",
  "maxComputeWorkgroupSizeX",
  "maxComputeWorkgroupSizeY",
  "maxComputeWorkgroupSizeZ",
  "maxComputeWorkgroupsPerDimension"
], If = Object.freeze({
  maxTextureDimension1D: 8192,
  maxTextureDimension2D: 8192,
  maxTextureDimension3D: 2048,
  maxTextureArrayLayers: 256,
  maxBindGroups: 4,
  maxBindGroupsPlusVertexBuffers: 24,
  maxBindingsPerBindGroup: 640,
  maxDynamicUniformBuffersPerPipelineLayout: 8,
  maxDynamicStorageBuffersPerPipelineLayout: 4,
  maxSampledTexturesPerShaderStage: 16,
  maxSamplersPerShaderStage: 16,
  maxStorageBuffersPerShaderStage: 8,
  maxStorageTexturesPerShaderStage: 4,
  maxUniformBuffersPerShaderStage: 12,
  maxUniformBufferBindingSize: 65536,
  maxStorageBufferBindingSize: 134217728,
  minUniformBufferOffsetAlignment: 256,
  minStorageBufferOffsetAlignment: 256,
  maxVertexBuffers: 8,
  maxBufferSize: 268435456,
  maxVertexAttributes: 16,
  maxVertexBufferArrayStride: 2048,
  maxInterStageShaderVariables: 16,
  maxColorAttachments: 8,
  maxColorAttachmentBytesPerSample: 32,
  maxComputeWorkgroupStorageSize: 16384,
  maxComputeInvocationsPerWorkgroup: 256,
  maxComputeWorkgroupSizeX: 256,
  maxComputeWorkgroupSizeY: 256,
  maxComputeWorkgroupSizeZ: 64,
  maxComputeWorkgroupsPerDimension: 65535
});
function Xn() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function yr() {
  return Xn() !== null;
}
async function Df(t = {}) {
  const e = Xn();
  if (!e) return null;
  const n = {};
  return t.powerPreference !== void 0 && (n.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (n.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (n.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (n.xrCompatible = t.xrCompatible), e.requestAdapter(n);
}
function Vf(t) {
  const e = /* @__PURE__ */ new Set();
  if (!t) return e;
  if (typeof t[Symbol.iterator] == "function") {
    for (const s of t) e.add(s);
    return e;
  }
  const r = t.keys;
  if (typeof r == "function") {
    for (const s of r.call(t)) e.add(s);
    return e;
  }
  const i = t.forEach;
  return typeof i == "function" && i.call(t, (s) => e.add(s)), e;
}
function us(t) {
  const e = t ?? {}, n = {};
  for (const r of Of) {
    const i = e[r];
    n[r] = typeof i == "number" && Number.isFinite(i) ? i : If[r];
  }
  return n;
}
function Nf(t) {
  const e = t.info ?? {};
  return {
    backend: "webgpu",
    vendor: e.vendor ?? "",
    architecture: e.architecture ?? "",
    device: e.device ?? "",
    description: e.description ?? "",
    isFallbackAdapter: e.isFallbackAdapter === !0
  };
}
function zf(t, e, n) {
  if (!e || e.length === 0) return [];
  const r = [];
  for (const i of e) {
    if (typeof i != "string" || i.length === 0)
      throw new u(`[gpu-device-api] ${n}: feature names must be non-empty strings.`);
    if (!r.includes(i) && (r.push(i), !t.has(i)))
      throw new u(
        `[gpu-device-api] ${n}: the adapter does not support the "${i}" feature. Available features: ${t.size > 0 ? [...t].sort().join(", ") : "(none)"}.`
      );
  }
  return r;
}
class kf {
  set;
  constructor(e) {
    this.set = e instanceof Set ? e : new Set(e);
  }
  has(e) {
    return this.set.has(e);
  }
  get names() {
    return [...this.set].sort();
  }
  /** 便于调试的字符串形式。 */
  toString() {
    return `WebGPUFeatures(${this.names.join(", ") || "none"})`;
  }
}
function $r() {
  const t = Xn();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function Wf(t) {
  const e = K(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new u(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function jf(t) {
  const n = t.getContext.call(t, "webgpu");
  return !n || typeof n.getCurrentTexture != "function" ? null : n;
}
const Jt = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, pt = {
  RED: 1,
  GREEN: 2,
  BLUE: 4,
  ALPHA: 8
}, ee = {
  MAP_READ: 1,
  MAP_WRITE: 2,
  COPY_SRC: 4,
  COPY_DST: 8,
  INDEX: 16,
  VERTEX: 32,
  UNIFORM: 64,
  STORAGE: 128,
  INDIRECT: 256,
  QUERY_RESOLVE: 512
}, We = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, Tr = {
  READ: 1,
  WRITE: 2
};
function qf(t) {
  if (!Number.isInteger(t))
    throw new u(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new u(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & j.Vertex && (e |= Jt.VERTEX), t & j.Fragment && (e |= Jt.FRAGMENT), t & j.Compute && (e |= Jt.COMPUTE), e === 0)
    throw new u(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function Xf(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new u(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & ae.Red && (e |= pt.RED), t & ae.Green && (e |= pt.GREEN), t & ae.Blue && (e |= pt.BLUE), t & ae.Alpha && (e |= pt.ALPHA), e;
}
function Yf(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] BufferUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -1024)
    throw new u(
      `[gpu-device-api] BufferUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  if (t & O.MapRead && t & O.MapWrite)
    throw new u(
      "[gpu-device-api] BufferUsage cannot combine MapRead and MapWrite: WebGPU rejects a buffer that is both mappable for reading and for writing. Use two buffers (or CopyDst plus writeBuffer)."
    );
  let e = 0;
  return t & O.MapRead && (e |= ee.MAP_READ), t & O.MapWrite && (e |= ee.MAP_WRITE), t & O.CopySrc && (e |= ee.COPY_SRC), t & O.CopyDst && (e |= ee.COPY_DST), t & O.Index && (e |= ee.INDEX), t & O.Vertex && (e |= ee.VERTEX), t & O.Uniform && (e |= ee.UNIFORM), t & O.Storage && (e |= ee.STORAGE), t & O.Indirect && (e |= ee.INDIRECT), t & O.QueryResolve && (e |= ee.QUERY_RESOLVE), e;
}
function hs(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new u(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & y.CopySrc && (e |= We.COPY_SRC), t & y.CopyDst && (e |= We.COPY_DST), t & y.TextureBinding && (e |= We.TEXTURE_BINDING), t & y.StorageBinding && (e |= We.STORAGE_BINDING), t & y.RenderAttachment && (e |= We.RENDER_ATTACHMENT), e;
}
function Hf(t) {
  switch (t) {
    case "read":
      return Tr.READ;
    case "write":
      return Tr.WRITE;
    default:
      return L(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function Zf(t) {
  switch (t) {
    case "point-list":
      return "point-list";
    case "line-list":
      return "line-list";
    case "line-strip":
      return "line-strip";
    case "triangle-list":
      return "triangle-list";
    case "triangle-strip":
      return "triangle-strip";
    default:
      return L(t, `[gpu-device-api] Unknown PrimitiveTopology "${String(t)}".`);
  }
}
function Qf(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function fs(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return L(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
  }
}
function Yn(t) {
  switch (t) {
    case "never":
      return "never";
    case "less":
      return "less";
    case "equal":
      return "equal";
    case "less-equal":
      return "less-equal";
    case "greater":
      return "greater";
    case "not-equal":
      return "not-equal";
    case "greater-equal":
      return "greater-equal";
    case "always":
      return "always";
    default:
      return L(t, `[gpu-device-api] Unknown CompareFunction "${String(t)}".`);
  }
}
function en(t) {
  switch (t) {
    case "keep":
      return "keep";
    case "zero":
      return "zero";
    case "replace":
      return "replace";
    case "invert":
      return "invert";
    case "increment-clamp":
      return "increment-clamp";
    case "decrement-clamp":
      return "decrement-clamp";
    case "increment-wrap":
      return "increment-wrap";
    case "decrement-wrap":
      return "decrement-wrap";
    default:
      return L(t, `[gpu-device-api] Unknown StencilOperation "${String(t)}".`);
  }
}
function Sr(t) {
  switch (t) {
    case "zero":
      return "zero";
    case "one":
      return "one";
    case "src":
      return "src";
    case "one-minus-src":
      return "one-minus-src";
    case "src-alpha":
      return "src-alpha";
    case "one-minus-src-alpha":
      return "one-minus-src-alpha";
    case "dst":
      return "dst";
    case "one-minus-dst":
      return "one-minus-dst";
    case "dst-alpha":
      return "dst-alpha";
    case "one-minus-dst-alpha":
      return "one-minus-dst-alpha";
    case "src-alpha-saturated":
      return "src-alpha-saturated";
    case "constant":
      return "constant";
    case "one-minus-constant":
      return "one-minus-constant";
    default:
      return L(t, `[gpu-device-api] Unknown BlendFactor "${String(t)}".`);
  }
}
function Kf(t) {
  switch (t) {
    case "add":
      return "add";
    case "subtract":
      return "subtract";
    case "reverse-subtract":
      return "reverse-subtract";
    case "min":
      return "min";
    case "max":
      return "max";
    default:
      return L(t, `[gpu-device-api] Unknown BlendOperation "${String(t)}".`);
  }
}
function tn(t) {
  switch (t) {
    case "clamp-to-edge":
      return "clamp-to-edge";
    case "repeat":
      return "repeat";
    case "mirror-repeat":
      return "mirror-repeat";
    default:
      return L(t, `[gpu-device-api] Unknown AddressMode "${String(t)}".`);
  }
}
function Ar(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return L(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function Jf(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return L(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function ed(t) {
  switch (t) {
    case "none":
      return "none";
    case "front":
      return "front";
    case "back":
      return "back";
    default:
      return L(t, `[gpu-device-api] Unknown CullMode "${String(t)}".`);
  }
}
function td(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return L(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function nn(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return L(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function rn(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return L(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function yn(t) {
  switch (t) {
    case "1d":
      return "1d";
    case "2d":
      return "2d";
    case "2d-array":
      return "2d-array";
    case "cube":
      return "cube";
    case "cube-array":
      return "cube-array";
    case "3d":
      return "3d";
    default:
      return L(t, `[gpu-device-api] Unknown TextureViewDimension "${String(t)}".`);
  }
}
function Hn(t) {
  switch (t) {
    case "all":
      return "all";
    case "depth-only":
      return "depth-only";
    case "stencil-only":
      return "stencil-only";
    default:
      return L(t, `[gpu-device-api] Unknown TextureAspect "${String(t)}".`);
  }
}
function nd(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return L(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function rd(t) {
  switch (t) {
    case "uint8x2":
      return "uint8x2";
    case "uint8x4":
      return "uint8x4";
    case "sint8x2":
      return "sint8x2";
    case "sint8x4":
      return "sint8x4";
    case "unorm8x2":
      return "unorm8x2";
    case "unorm8x4":
      return "unorm8x4";
    case "snorm8x2":
      return "snorm8x2";
    case "snorm8x4":
      return "snorm8x4";
    case "uint16x2":
      return "uint16x2";
    case "uint16x4":
      return "uint16x4";
    case "sint16x2":
      return "sint16x2";
    case "sint16x4":
      return "sint16x4";
    case "unorm16x2":
      return "unorm16x2";
    case "unorm16x4":
      return "unorm16x4";
    case "snorm16x2":
      return "snorm16x2";
    case "snorm16x4":
      return "snorm16x4";
    case "float16x2":
      return "float16x2";
    case "float16x4":
      return "float16x4";
    case "float32":
      return "float32";
    case "float32x2":
      return "float32x2";
    case "float32x3":
      return "float32x3";
    case "float32x4":
      return "float32x4";
    case "uint32":
      return "uint32";
    case "uint32x2":
      return "uint32x2";
    case "uint32x3":
      return "uint32x3";
    case "uint32x4":
      return "uint32x4";
    case "sint32":
      return "sint32";
    case "sint32x2":
      return "sint32x2";
    case "sint32x3":
      return "sint32x3";
    case "sint32x4":
      return "sint32x4";
    default:
      return L(t, `[gpu-device-api] Unknown VertexFormat "${String(t)}".`);
  }
}
function id(t) {
  switch (t) {
    case pn.Occlusion:
      return "occlusion";
    case pn.Timestamp:
      return "timestamp";
    default:
      return L(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function sd(t) {
  switch (t) {
    case "uniform":
      return "uniform";
    case "storage":
      return "storage";
    case "read-only-storage":
      return "read-only-storage";
    default:
      throw new u(
        `[gpu-device-api] BindingType "${String(t)}" is not a buffer binding; expected "uniform", "storage" or "read-only-storage".`
      );
  }
}
function ad(t) {
  switch (t) {
    case "sampler":
      return "filtering";
    case "comparison-sampler":
      return "comparison";
    default:
      throw new u(
        `[gpu-device-api] BindingType "${String(t)}" is not a sampler binding; expected "sampler" or "comparison-sampler".`
      );
  }
}
function od(t) {
  switch (t) {
    case "float":
      return "float";
    case "unfilterable-float":
      return "unfilterable-float";
    case "depth":
      return "depth";
    case "sint":
      return "sint";
    case "uint":
      return "uint";
    default:
      return L(t, `[gpu-device-api] Unknown TextureSampleType "${String(t)}".`);
  }
}
function cd(t) {
  switch (t) {
    case "write-only":
      return "write-only";
    case "read-only":
      return "read-only";
    case "read-write":
      return "read-write";
    default:
      return L(t, `[gpu-device-api] Unknown StorageTextureAccess "${String(t)}".`);
  }
}
function ld(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return L(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const ud = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [1, 1, 1, 1],
  silver: [0.7529411764705882, 0.7529411764705882, 0.7529411764705882, 1],
  gray: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  grey: [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1],
  red: [1, 0, 0, 1],
  maroon: [0.5019607843137255, 0, 0, 1],
  orange: [1, 0.6470588235294118, 0, 1],
  yellow: [1, 1, 0, 1],
  olive: [0.5019607843137255, 0.5019607843137255, 0, 1],
  lime: [0, 1, 0, 1],
  green: [0, 0.5019607843137255, 0, 1],
  teal: [0, 0.5019607843137255, 0.5019607843137255, 1],
  aqua: [0, 1, 1, 1],
  cyan: [0, 1, 1, 1],
  blue: [0, 0, 1, 1],
  navy: [0, 0, 0.5019607843137255, 1],
  purple: [0.5019607843137255, 0, 0.5019607843137255, 1],
  magenta: [1, 0, 1, 1],
  fuchsia: [1, 0, 1, 1]
}, hd = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, fd = /^rgba?\(([^)]*)\)$/;
function ds(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return pd(t);
  if (typeof t == "number") return dd(t);
  if (Array.isArray(t)) {
    const n = t;
    if (n.length !== 3 && n.length !== 4)
      throw new u(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${n.length}.`
      );
    return _r(n[0], n[1], n[2], n.length === 4 ? n[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new u(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return _r(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function _r(t, e, n, r, i) {
  for (const [s, a] of [
    ["r", t],
    ["g", e],
    ["b", n],
    ["a", r]
  ])
    if (!Number.isFinite(a))
      throw new u(
        `[gpu-device-api] Clear color component "${s}" must be a finite number, got ${String(a)} (from ${JSON.stringify(i)}).`
      );
  return { r: t, g: e, b: n, a: r };
}
function dd(t) {
  if (!Number.isFinite(t) || !Number.isInteger(t) || t < 0 || t > 16777215)
    throw new u(
      `[gpu-device-api] A numeric clear color must be an integer in 0x000000..0xFFFFFF (0xRRGGBB), got ${String(t)}.`
    );
  return {
    r: (t >> 16 & 255) / 255,
    g: (t >> 8 & 255) / 255,
    b: (t & 255) / 255,
    a: 1
  };
}
function pd(t) {
  const e = t.trim().toLowerCase(), n = hd.exec(e);
  if (n) {
    const s = n[1];
    if (s.length === 3 || s.length === 4) {
      const h = parseInt(s[0] + s[0], 16) / 255, d = parseInt(s[1] + s[1], 16) / 255, f = parseInt(s[2] + s[2], 16) / 255, p = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: h, g: d, b: f, a: p };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, l = parseInt(s.slice(4, 6), 16) / 255, c = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: l, a: c };
  }
  const r = ud[e];
  if (r) return { r: r[0], g: r[1], b: r[2], a: r[3] };
  const i = fd.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((h) => h.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new u(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = sn(s[0], t), o = sn(s[1], t), l = sn(s[2], t), c = s.length === 4 ? md(s[3], t) : 1;
    return { r: a, g: o, b: l, a: c };
  }
  throw new u(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function sn(t, e) {
  if (t.endsWith("%")) {
    const r = Number(t.slice(0, -1));
    if (!Number.isFinite(r))
      throw new u(`[gpu-device-api] Clear color "${e}" has an invalid percentage "${t}".`);
    return r / 100;
  }
  const n = Number(t);
  if (!Number.isFinite(n))
    throw new u(`[gpu-device-api] Clear color "${e}" has an invalid component "${t}".`);
  return n / 255;
}
function md(t, e) {
  if (t.endsWith("%")) {
    const r = Number(t.slice(0, -1));
    if (!Number.isFinite(r))
      throw new u(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
    return r / 100;
  }
  const n = Number(t);
  if (!Number.isFinite(n))
    throw new u(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
  return n;
}
function Oe(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function ps(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function gd(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function et(t, e) {
  if (t !== 1 && t !== 4)
    throw new u(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class ms {
  label;
  size;
  usage;
  native;
  device;
  _disposed = !1;
  _mapped = !1;
  /**
   * `mapAsync` 交给上层的映射视图。
   *
   * 必须记下来：WebGPU 规定同一个映射范围只能被 `getMappedRange` 取一次
   *（第二次会以「与已返回的范围重叠」报错），而 core 的 `Buffer` 契约是
   * 「`mapAsync` 以映射范围 resolve，`getMappedRange` 再取当前映射范围」——
   * 也就是两个方法都要能用（WebGL2 后端就是这样）。所以这里自己记着已经交出去的视图，
   * 第二次调用直接复用，不再往原生对象上问一遍。
   */
  mappedRange = null;
  constructor(e, n) {
    if (this.device = e, this.label = n.label ?? `buffer#${e.nextResourceId("buffer")}`, Xe(n.size, "BufferDescriptor.size"), n.size % 4 !== 0)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size must be a multiple of 4 (WebGPU requires 4-byte aligned buffer sizes), got ${n.size}. Use alignTo4()/paddedCopy() when uploading tightly packed data.`
      );
    if (n.size > e.limits.maxBufferSize)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size ${n.size} exceeds maxBufferSize (${e.limits.maxBufferSize}).`
      );
    this.size = n.size, this.usage = n.usage, this.native = e.native.createBuffer({
      label: this.label,
      size: n.size,
      usage: Yf(n.usage)
    });
  }
  get disposed() {
    return this._disposed;
  }
  get mapped() {
    return this._mapped;
  }
  /** 当前 buffer 是否仍然可用（未释放、device 未销毁）。 */
  get usable() {
    return !this._disposed && !this.device.disposed;
  }
  /**
   * 把 buffer 的某个范围映射给 CPU，并以该范围的 `ArrayBuffer` resolve。
   *
   * WebGPU 的 `mapAsync` 本身只 resolve 一个 `undefined`，因此这里在映射完成后立即
   * 调用 `getMappedRange(offset, size)`，把上层真正想拿到的视图返回出去。
   */
  async mapAsync(e, n = 0, r) {
    if (this.assertUsable("Buffer.mapAsync"), this._mapped)
      throw new u(
        `[gpu-device-api] Buffer "${this.label}" is already mapped; call unmap() before mapping it again.`
      );
    const i = r ?? this.size - n;
    this.assertRange(n, i, "Buffer.mapAsync"), await this.native.mapAsync(Hf(e), n, i), this._mapped = !0;
    const s = this.native.getMappedRange(n, i);
    return this.mappedRange = { offset: n, size: i, data: s }, s;
  }
  /**
   * 当前已映射的范围（偏移量相对于映射起点，与 WebGL2 后端一致）。
   *
   * 不再直接问原生 `GPUBuffer`：同一个范围只能被取一次，重复取会报
   * 「overlaps with previously returned range」。
   */
  getMappedRange(e = 0, n) {
    this.assertUsable("Buffer.getMappedRange");
    const r = this.mappedRange;
    if (!this._mapped || !r)
      throw new u(
        `[gpu-device-api] Buffer "${this.label}" is not mapped; await mapAsync() before calling getMappedRange().`
      );
    const i = n ?? r.size - e;
    return this.assertRange(e, i, "Buffer.getMappedRange", r.size), e === 0 && i === r.size ? r.data : r.data.slice(e, e + i);
  }
  /**
   * 结束映射：`'write'` 映射会在此把 CPU 侧的改动刷给 GPU，`'read'` 映射在此释放映射内存。
   *
   * 未映射时是空操作（WebGPU 的 `unmap()` 对未映射 buffer 同样是合法的空操作），
   * 这样清理路径里可以放心地无条件调用。
   */
  unmap() {
    this._disposed || this._mapped && (this._mapped = !1, this.mappedRange = null, this.native.unmap());
  }
  /** 释放底层分配。幂等；已映射的 buffer 会先被取消映射。 */
  destroy() {
    this._disposed || (this._disposed = !0, this._mapped = !1, this.mappedRange = null, this.native.destroy());
  }
  /** `Disposable` 的别名，语义与 {@link WebGPUBuffer.destroy} 相同。 */
  dispose() {
    this.destroy();
  }
  assertUsable(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] ${e}: buffer "${this.label}" has been destroyed.`);
    if (this.device.disposed)
      throw new u(
        `[gpu-device-api] ${e}: buffer "${this.label}" belongs to a disposed device.`
      );
  }
  assertRange(e, n, r, i = this.size) {
    if (Mt(e, `${r} offset`), Xe(n, `${r} size`), e + n > i) {
      const s = i === this.size ? `buffer "${this.label}" size ${this.size}` : `mapped range size ${i} of buffer "${this.label}"`;
      throw new u(
        `[gpu-device-api] ${r}: range [${e}, ${e + n}) exceeds ${s}.`
      );
    }
  }
}
function bd(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function I(t, e) {
  if (t instanceof ms) return t.native;
  if (bd(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), got ${te(t)}.`
  );
}
function te(t) {
  if (t === null) return "null";
  if (t === void 0) return "undefined";
  if (typeof t == "object") {
    const e = t.label;
    return typeof e == "string" && e.length > 0 ? `a resource labelled "${e}"` : `an instance of ${t.constructor?.name ?? "Object"}`;
  }
  return `${typeof t} ${String(t)}`;
}
class Zn {
  label;
  texture;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, n = {}) {
    this.texture = e;
    const r = En(e, n);
    this.label = n.label ?? `${e.label}#view`;
    const i = r.aspect;
    if (Gf(e.format, i, `Texture "${e.label}".createView`), r.baseMipLevel + r.mipLevelCount > e.mipLevelCount)
      throw new u(
        `[gpu-device-api] Texture "${e.label}".createView: mip range [${r.baseMipLevel}, ${r.baseMipLevel + r.mipLevelCount}) exceeds mipLevelCount ${e.mipLevelCount}.`
      );
    if (r.baseArrayLayer + r.arrayLayerCount > e.depthOrArrayLayers)
      throw new u(
        `[gpu-device-api] Texture "${e.label}".createView: array layer range [${r.baseArrayLayer}, ${r.baseArrayLayer + r.arrayLayerCount}) exceeds depthOrArrayLayers ${e.depthOrArrayLayers}.`
      );
    if (r.dimension === "cube" || r.dimension === "cube-array") {
      if (r.arrayLayerCount % 6 !== 0)
        throw new u(
          `[gpu-device-api] Texture "${e.label}".createView: a "${r.dimension}" view needs a multiple of 6 array layers, got ${r.arrayLayerCount}.`
        );
      if (e.width !== e.height)
        throw new u(
          `[gpu-device-api] Texture "${e.label}".createView: a "${r.dimension}" view needs a square texture, got ${e.width}x${e.height}.`
        );
    }
    this.descriptor = r;
    let s;
    if (r.format !== void 0 && (s = K(r.format), r.format !== e.format && !e.viewFormats.includes(r.format)))
      throw new u(
        `[gpu-device-api] Texture "${e.label}".createView: view format "${r.format}" was not listed in the texture's viewFormats (${e.viewFormats.join(", ") || "none"}).`
      );
    this.native = e.native.createView({
      label: this.label,
      format: s,
      dimension: yn(r.dimension),
      aspect: Hn(r.aspect),
      baseMipLevel: r.baseMipLevel,
      mipLevelCount: r.mipLevelCount,
      baseArrayLayer: r.baseArrayLayer,
      arrayLayerCount: r.arrayLayerCount
    });
  }
  /** view 覆盖的格式（可能是重解释后的格式）。 */
  get format() {
    return this.descriptor.format ?? this.texture.format;
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUTextureView 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function gs(t) {
  return t instanceof Zn;
}
function wd(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function qe(t, e) {
  if (t instanceof Zn) return t.native;
  if (wd(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${te(t)}.`
  );
}
class Se {
  label;
  dimension;
  format;
  usage;
  width;
  height;
  depthOrArrayLayers;
  mipLevelCount;
  sampleCount;
  native;
  /** 创建时声明的额外 view 格式。 */
  viewFormats;
  device;
  owned;
  extent;
  viewCache = /* @__PURE__ */ new Map();
  viewList = [];
  _disposed = !1;
  constructor(e, n, r, i) {
    this.device = e, this.owned = i, this.native = n, this.label = r.label, this.extent = r.size, this.dimension = r.dimension, this.format = r.format, this.usage = r.usage, this.mipLevelCount = r.mipLevelCount, this.sampleCount = r.sampleCount, this.viewFormats = r.viewFormats, this.width = r.size.width, this.height = r.size.height, this.depthOrArrayLayers = r.size.depthOrArrayLayers;
  }
  /**
   * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
   *
   * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
   */
  static create(e, n) {
    const r = _n(n.size), i = {
      label: n.label ?? `texture#${e.nextResourceId("texture")}`,
      size: r,
      mipLevelCount: n.mipLevelCount ?? 1,
      sampleCount: n.sampleCount ?? 1,
      dimension: n.dimension ?? "2d",
      format: n.format,
      usage: n.usage,
      viewFormats: n.viewFormats ?? []
    };
    vd(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: r.width, height: r.height, depthOrArrayLayers: r.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: K(i.format),
      usage: hs(i.usage),
      viewFormats: i.viewFormats.map((a) => K(a))
    });
    return new Se(e, s, i, !0);
  }
  /**
   * 包住一个已经存在的原生 `GPUTexture`（例如 canvas 的帧纹理）。
   *
   * `owned` 为 `false` 时 `destroy()` 只标记本包装对象失效，不会销毁底层 texture。
   * 未提供的字段会直接从原生对象读取（canvas 帧纹理的尺寸/格式只能这样拿到）。
   */
  static adopt(e, n, r = {}, i = {}) {
    const s = r.size ?? {
      width: n.width,
      height: n.height,
      depthOrArrayLayers: n.depthOrArrayLayers
    }, a = {
      label: r.label ?? (n.label.length > 0 ? n.label : "canvas-texture"),
      size: s,
      mipLevelCount: r.mipLevelCount ?? n.mipLevelCount,
      sampleCount: r.sampleCount ?? n.sampleCount,
      dimension: r.dimension ?? n.dimension,
      format: r.format ?? Mf(n.format),
      usage: r.usage ?? n.usage,
      viewFormats: r.viewFormats ?? []
    };
    return new Se(e, n, a, i.owned ?? !1);
  }
  get size() {
    return { ...this.extent };
  }
  get disposed() {
    return this._disposed;
  }
  /** 当前 texture 是否仍然可用。 */
  get usable() {
    return !this._disposed && !this.device.disposed;
  }
  /** 按 subresource 选择创建（并缓存）view。 */
  createView(e = {}) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] Texture.createView: texture "${this.label}" has been destroyed.`
      );
    const n = xd(En(this, e)), r = this.viewCache.get(n);
    if (r) return r;
    const i = new Zn(this, e);
    return this.viewCache.set(n, i), this.viewList.push(i), i;
  }
  /** 目前已创建的 view；随 texture 一同释放。 */
  get views() {
    return this.viewList;
  }
  /** 销毁 texture（`owned` 为 false 时只标记包装对象失效）。幂等。 */
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.viewList) e.dispose();
      this.viewCache.clear(), this.owned && this.native.destroy();
    }
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
}
function xd(t) {
  return ai(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect
  );
}
function vd(t, e) {
  const { width: n, height: r, depthOrArrayLayers: i } = t.size;
  if (!Number.isInteger(n) || n <= 0 || !Number.isInteger(r) || r <= 0)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": width and height must be positive integers, got ${n}x${r}.`
    );
  if (!Number.isInteger(i) || i <= 0)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers must be a positive integer, got ${String(i)}.`
    );
  if (!Number.isInteger(t.mipLevelCount) || t.mipLevelCount <= 0)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount must be a positive integer.`
    );
  const s = ra(t.size);
  if (t.mipLevelCount > s)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount ${t.mipLevelCount} is more than the maximum ${s} for a ${n}x${r}x${i} texture.`
    );
  if (t.dimension === "1d" && r !== 1)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture must have height 1, got ${r}.`
    );
  if (t.dimension === "1d" && t.sampleCount > 1)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture cannot be multisampled.`
    );
  const a = t.dimension === "1d" ? e.limits.maxTextureDimension1D : t.dimension === "3d" ? e.limits.maxTextureDimension3D : e.limits.maxTextureDimension2D;
  if (n > a || r > a || i > a)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": ${n}x${r}x${i} exceeds the ${t.dimension} limit ${a}.`
    );
  if (t.dimension === "2d" && i > e.limits.maxTextureArrayLayers)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers ${i} exceeds maxTextureArrayLayers ${e.limits.maxTextureArrayLayers}.`
    );
  Uf(
    t.format,
    t.usage,
    {
      sampleCount: t.sampleCount,
      mipLevelCount: t.mipLevelCount,
      dimension: t.dimension,
      features: e.features
    },
    `Texture "${t.label}"`
  );
  for (const o of t.viewFormats) {
    if (o === t.format) continue;
    const l = (c) => c.replace("-srgb", "");
    if (l(o) !== l(t.format))
      throw new u(
        `[gpu-device-api] Texture "${t.label}": viewFormat "${o}" is not compatible with format "${t.format}" (WebGPU only allows srgb <-> non-srgb reinterpretation).`
      );
  }
}
function Er(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function bs(t, e) {
  if (t instanceof Se) return t.native;
  if (Er(t)) return t;
  const n = t?.native;
  if (n !== void 0 && Er(n)) return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${te(t)}.`
  );
}
class Qn {
  label;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, n = {}) {
    this.label = n.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const r = ti(n);
    if (!Number.isFinite(r.lodMinClamp) || !Number.isFinite(r.lodMaxClamp))
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp/lodMaxClamp must be finite numbers.`
      );
    if (r.lodMinClamp < 0)
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp must not be negative, got ${r.lodMinClamp}.`
      );
    if (r.lodMaxClamp < r.lodMinClamp)
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": lodMaxClamp (${r.lodMaxClamp}) must be >= lodMinClamp (${r.lodMinClamp}).`
      );
    if (!Number.isFinite(r.maxAnisotropy) || r.maxAnisotropy < 1)
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": maxAnisotropy must be >= 1, got ${String(r.maxAnisotropy)}.`
      );
    this.descriptor = r;
    const i = {
      label: this.label,
      addressModeU: tn(r.addressModeU),
      addressModeV: tn(r.addressModeV),
      addressModeW: tn(r.addressModeW),
      magFilter: Ar(r.magFilter),
      minFilter: Ar(r.minFilter),
      mipmapFilter: Jf(r.mipmapFilter),
      lodMinClamp: r.lodMinClamp,
      lodMaxClamp: r.lodMaxClamp,
      maxAnisotropy: r.maxAnisotropy
    };
    r.compare !== void 0 && (i.compare = Yn(r.compare)), this.native = e.native.createSampler(i);
  }
  get disposed() {
    return this._disposed;
  }
  /** 是否为用于阴影查找的比较 sampler。 */
  get isComparison() {
    return this.descriptor.compare !== void 0;
  }
  /** GPUSampler 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function yd(t) {
  return t instanceof Qn;
}
function $d(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function Td(t, e) {
  if (t instanceof Qn) return t.native;
  if ($d(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class ws {
  label;
  source;
  defines;
  device;
  modulesByStage = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, n) {
    if (this.device = e, this.label = n.label ?? `shader#${e.nextResourceId("shader")}`, this.source = ni(n.code), this.defines = { ...n.defines ?? {} }, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
      throw new u(
        `[gpu-device-api] ShaderModule "${this.label}" has no source code (expected \`wgsl\`, or \`vs\`/\`fs\`/\`cs\`).`
      );
  }
  get disposed() {
    return this._disposed;
  }
  /** 是否已经为某个 stage 编译过原生模块。 */
  get compiled() {
    return this.modulesByStage.size > 0;
  }
  /**
   * 原生 `GPUShaderModule`；尚未编译时为 `null`。
   *
   * 编译需要 stage（core 的 module 里可能同时含 vertex / fragment / compute 入口），
   * 所以这里不代劳；创建管线的路径会先调用 {@link WebGPUShaderModule.compile}。
   */
  get native() {
    const e = this.modulesByStage.values().next();
    return e.done ? null : e.value;
  }
  /** 按 stage 得到最终 WGSL 源码（补齐 `defines` 与防御性包装），不触发 GPU 编译。 */
  finalSource(e) {
    return xn({
      backend: "webgpu",
      source: this.source,
      stage: e,
      label: this.label,
      defines: this.defines
    }).code;
  }
  /**
   * 取得（必要时创建）原生 `GPUShaderModule`。
   *
   * WGSL 里含所有 entry point，因此不同 stage 复用同一个编译结果；缓存仍然按 stage 记录，
   * 以便 `finalSource()` 的报错信息与实际使用一致。
   */
  compile(e) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] ShaderModule "${this.label}" has been disposed; it can no longer be compiled.`
      );
    if (this.device.disposed)
      throw new u(
        `[gpu-device-api] ShaderModule "${this.label}" belongs to a disposed device.`
      );
    const n = this.modulesByStage.get(e);
    if (n) return n;
    const r = this.modulesByStage.values().next();
    if (!r.done)
      return this.modulesByStage.set(e, r.value), r.value;
    const i = this.finalSource(e), s = this.device.native.createShaderModule({ label: this.label, code: i });
    return this.modulesByStage.set(e, s), s;
  }
  /** GPUShaderModule 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0, this.modulesByStage.clear();
  }
}
function $n(t, e) {
  if (t instanceof ws) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${te(t)}.`
  );
}
const Lr = "timestamp-query";
class xs {
  label;
  type;
  count;
  native;
  _disposed = !1;
  constructor(e, n) {
    if (this.label = n.label ?? `querySet#${e.nextResourceId("querySet")}`, !Number.isInteger(n.count) || n.count <= 0)
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(n.count)}.`
      );
    if (n.type === pn.Timestamp && !e.features.has(Lr))
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${Lr}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    this.type = n.type, this.count = n.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: id(n.type),
      count: n.count
    });
  }
  get disposed() {
    return this._disposed;
  }
  /** 销毁 query set。幂等。 */
  destroy() {
    this._disposed || (this._disposed = !0, this.native.destroy());
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
}
function vs(t, e) {
  if (t instanceof xs) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const n = t;
    if (typeof n.destroy == "function" && typeof n.count == "number")
      return t;
  }
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
class ys {
  label;
  entries;
  sortedEntries;
  native;
  byBinding;
  _disposed = !1;
  constructor(e, n) {
    this.label = n.label ?? `bindGroupLayout#${e.nextResourceId("bindGroupLayout")}`;
    let r;
    try {
      r = ri(n.entries);
    } catch (s) {
      throw new u(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = r, this.entries = n.entries, this.byBinding = new Map(r.map((s) => [s.binding, s]));
    const i = r.map(
      (s) => Sd(s, e, this.label)
    );
    if (i.length > e.limits.maxBindingsPerBindGroup)
      throw new u(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${i.length} entries exceed maxBindingsPerBindGroup (${e.limits.maxBindingsPerBindGroup}).`
      );
    this.native = e.native.createBindGroupLayout({ label: this.label, entries: i });
  }
  entry(e) {
    return this.byBinding.get(e);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUBindGroupLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function Sd(t, e, n) {
  const r = `BindGroupLayout "${n}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: qf(t.visibility)
  };
  if (Jr(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new u(
        `[gpu-device-api] ${r}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: sd(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (ei(t.type)) {
    const s = t.sampler ?? {}, a = ad(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : ld(s.type)
    }, i;
  }
  if (t.type === R.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new u(
        `[gpu-device-api] ${r}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: od(a),
      viewDimension: yn(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === R.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new u(
        `[gpu-device-api] ${r}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return ls(s.format, e.features, r), i.storageTexture = {
      access: cd(s.access ?? "write-only"),
      format: K(s.format),
      viewDimension: yn(s.viewDimension ?? "2d")
    }, i;
  }
  throw new u(
    `[gpu-device-api] ${r}: unsupported BindingType "${String(t.type)}".`
  );
}
function $s(t, e) {
  if (t instanceof ys) return t.native;
  if (Ad(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function Ad(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class Ts {
  label;
  layout;
  entries;
  native;
  byBinding;
  _disposed = !1;
  constructor(e, n) {
    this.label = n.label ?? `bindGroup#${e.nextResourceId("bindGroup")}`, this.layout = n.layout, this.entries = n.entries, this.byBinding = new Map(n.entries.map((s) => [s.binding, s]));
    for (const s of n.entries)
      if (!this.layout.entry(s.binding))
        throw new u(
          `[gpu-device-api] BindGroup "${this.label}": binding ${s.binding} is not declared by layout "${this.layout.label}".`
        );
    const r = $s(this.layout, `BindGroup "${this.label}"`), i = n.entries.map(
      (s) => _d(s, this.layout, e, this.label)
    );
    this.native = e.native.createBindGroup({
      label: this.label,
      layout: r,
      entries: i
    });
  }
  entry(e) {
    return this.byBinding.get(e);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUBindGroup 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function _d(t, e, n, r) {
  const i = `BindGroup "${r}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new u(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (Jr(s.type)) {
    if (!("buffer" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${te(a)}.`
      );
    const o = I(a.buffer, i), l = a.offset ?? 0, c = a.size ?? a.buffer.size - l;
    if (!Number.isInteger(l) || l < 0)
      throw new u(`[gpu-device-api] ${i}: offset must be a non-negative integer.`);
    if (!Number.isInteger(c) || c < 0)
      throw new u(`[gpu-device-api] ${i}: size must be a non-negative integer.`);
    if (l + c > a.buffer.size)
      throw new u(
        `[gpu-device-api] ${i}: binding range [${l}, ${l + c}) exceeds the buffer size ${a.buffer.size}.`
      );
    const h = s.buffer?.minBindingSize ?? 0;
    if (h > 0 && c < h)
      throw new u(
        `[gpu-device-api] ${i}: layout requires minBindingSize ${h}, got ${c}.`
      );
    const d = { buffer: o, offset: l, size: c };
    return { binding: t.binding, resource: d };
  }
  if (ei(s.type)) {
    if (!("sampler" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${te(a)}.`
      );
    const o = a.sampler, l = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (yd(o)) {
      if (l && !o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!l && o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: Td(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${te(a)}.`
      );
    return Ed(a.view, s, n, i), { binding: t.binding, resource: qe(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${te(a)}.`
      );
    if (gs(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && K(a.view.format) !== K(o))
        throw new u(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: qe(a.view, i) };
  }
  if ("source" in a)
    return { binding: t.binding, resource: a.source };
  throw new u(
    `[gpu-device-api] ${i}: unsupported binding resource ${te(a)}.`
  );
}
function Ed(t, e, n, r) {
  if (!gs(t)) return;
  const i = e.texture ?? {}, s = t.format, a = Ae(s), o = i.sampleType ?? "float";
  if (o === "depth") {
    if (a.sampleScalar !== "depth")
      throw new u(
        `[gpu-device-api] ${r}: layout expects a depth texture, but the bound view has format "${s}".`
      );
  } else if (o === "uint" || o === "sint") {
    if (a.sampleScalar !== o)
      throw new u(
        `[gpu-device-api] ${r}: layout expects a "${o}" sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
  } else {
    if (a.sampleScalar !== "float")
      throw new u(
        `[gpu-device-api] ${r}: layout expects a float sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
    if (o === "float" && !Cf(s, n.features))
      throw new u(
        `[gpu-device-api] ${r}: layout declares sampleType "float" (filterable), but "${s}" is not filterable on this device; declare "unfilterable-float" or enable the required feature.`
      );
  }
  const l = t.texture.sampleCount > 1;
  if ((i.multisampled ?? !1) !== l)
    throw new u(
      `[gpu-device-api] ${r}: layout declares multisampled=${String(i.multisampled ?? !1)}, but the bound texture has sampleCount ${t.texture.sampleCount}.`
    );
  const c = i.viewDimension ?? "2d";
  if (c !== t.descriptor.dimension)
    throw new u(
      `[gpu-device-api] ${r}: layout declares viewDimension "${c}", but the bound view is "${t.descriptor.dimension}".`
    );
}
function Ss(t, e, n, r) {
  const i = t.layout.sortedEntries.filter((s) => s.buffer?.hasDynamicOffset === !0);
  if (i.length === 0) {
    if (e && e.length > 0)
      throw new u(
        `[gpu-device-api] ${r}: bind group "${t.label}" has no entry with hasDynamicOffset, but ${e.length} dynamic offset(s) were supplied.`
      );
    return;
  }
  if (!e || e.length !== i.length)
    throw new u(
      `[gpu-device-api] ${r}: bind group "${t.label}" needs ${i.length} dynamic offset(s) (declaration order of the entries with hasDynamicOffset), got ${e ? e.length : 0}.`
    );
  for (let s = 0; s < i.length; s++) {
    const a = i[s], o = e[s], l = a.type === "uniform" ? n.limits.minUniformBufferOffsetAlignment : n.limits.minStorageBufferOffsetAlignment;
    if (!Number.isInteger(o) || o < 0)
      throw new u(
        `[gpu-device-api] ${r}: dynamic offset #${s} must be a non-negative integer, got ${String(o)}.`
      );
    if (o % l !== 0)
      throw new u(
        `[gpu-device-api] ${r}: dynamic offset #${s} (${o}) must be a multiple of ${l} (${a.type === "uniform" ? "minUniformBufferOffsetAlignment" : "minStorageBufferOffsetAlignment"}).`
      );
  }
}
function As(t, e) {
  if (t instanceof Ts) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class He {
  label;
  bindGroupLayouts;
  /** `'auto'` 时为字符串 `'auto'`，否则为 `GPUPipelineLayout`。 */
  native;
  isAuto;
  _disposed = !1;
  constructor(e, n, r, i) {
    this.label = e, this.bindGroupLayouts = n, this.native = r, this.isAuto = i;
  }
  /** 创建显式 layout。 */
  static create(e, n) {
    const r = n.label ?? `pipelineLayout#${e.nextResourceId("pipelineLayout")}`;
    if (n.bindGroupLayouts.length > e.limits.maxBindGroups)
      throw new u(
        `[gpu-device-api] PipelineLayout "${r}": ${n.bindGroupLayouts.length} bind group layouts exceed maxBindGroups (${e.limits.maxBindGroups}).`
      );
    const i = e.native.createPipelineLayout({
      label: r,
      bindGroupLayouts: n.bindGroupLayouts.map(
        (s) => $s(s, `PipelineLayout "${r}"`)
      )
    });
    return new He(r, n.bindGroupLayouts, i, !1);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new He(e, [], "auto", !0);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function _s(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof He) return t.native;
  const n = t.native;
  if (n === "auto") return "auto";
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const Ld = "uint32";
class xe {
  primitive;
  depthStencil;
  multisample;
  blend;
  writeMask;
  colorFormats;
  constructor(e) {
    e && (e.primitive && (this.primitive = e.primitive), e.depthStencil && (this.depthStencil = e.depthStencil), e.multisample && (this.multisample = e.multisample), e.blend && (this.blend = e.blend), e.writeMask !== void 0 && (this.writeMask = e.writeMask), e.colorFormats && (this.colorFormats = e.colorFormats));
  }
  /** 把 core 的 `PrimitiveState` 翻译为 WebGPU 的 `GPUPrimitiveState`。 */
  static toGPUPrimitiveState(e, n) {
    const r = e?.topology ?? kt.topology, i = {
      topology: Zf(r),
      frontFace: td(e?.frontFace ?? kt.frontFace),
      cullMode: ed(e?.cullMode ?? kt.cullMode)
    };
    if (Qf(r))
      i.stripIndexFormat = fs(e?.stripIndexFormat ?? Ld);
    else if (e?.stripIndexFormat !== void 0)
      throw new u(
        `[gpu-device-api] PrimitiveState.stripIndexFormat is only valid for strip topologies, but the topology is "${r}".`
      );
    if (e?.unclippedDepth) {
      if (n && !n.has("depth-clip-control"))
        throw new u(
          '[gpu-device-api] PrimitiveState.unclippedDepth needs the "depth-clip-control" device feature.'
        );
      i.unclippedDepth = !0;
    }
    return i;
  }
  /**
   * 把 core 的 `DepthStencilState` 翻译为 WebGPU 的 `GPUDepthStencilState`。
   *
   * `format` 由调用方给出（core 允许省略，此时用 render target 的 depth 格式）。
   */
  static toGPUDepthStencilState(e, n) {
    const r = cs(e), i = Dt(e);
    if (!r && !i)
      throw new u(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: K(e) };
    return r && (s.depthWriteEnabled = n?.depthWriteEnabled ?? Jn.depthWriteEnabled, s.depthCompare = Yn(n?.depthCompare ?? Jn.depthCompare)), i && (s.stencilFront = Mr(n?.stencilFront), s.stencilBack = Mr(n?.stencilBack), s.stencilReadMask = n?.stencilReadMask ?? 4294967295, s.stencilWriteMask = n?.stencilWriteMask ?? 4294967295), n?.depthBias !== void 0 && (s.depthBias = n.depthBias), n?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = n.depthBiasSlopeScale), n?.depthBiasClamp !== void 0 && (s.depthBiasClamp = n.depthBiasClamp), s;
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, n) {
    const r = et(e?.count ?? n, "MultisampleState.count"), i = { count: r, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
    if (s && r === 1)
      throw new u(
        "[gpu-device-api] MultisampleState.alphaToCoverageEnabled requires sampleCount > 1."
      );
    return s && (i.alphaToCoverageEnabled = !0), i;
  }
  /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
  static toGPUBlendState(e) {
    if (e)
      return {
        color: Pr(e.color),
        alpha: Pr(e.alpha)
      };
  }
  /**
   * 组合出 `GPUFragmentState.targets`。
   *
   * `formats` 来自当前 variant（render target），`targets` 来自 pipeline descriptor；
   * 两者长度不一致时直接报错，因为那必然是用户的疏忽（WebGPU 的报错更难读）。
   */
  static toGPUColorTargets(e, n, r = {}) {
    if (n && n.length !== e.length)
      throw new u(
        `[gpu-device-api] RenderPipeline: fragment.targets has ${n.length} entries but the render target has ${e.length} color attachments.`
      );
    return e.map((i, s) => {
      const a = n ? n[s] : void 0;
      if (a === null) return null;
      const o = { format: K(a?.format ?? i) }, l = a?.blend ?? r.blend;
      l && (o.blend = xe.toGPUBlendState(l));
      const c = a?.writeMask ?? r.writeMask;
      return c !== void 0 && (o.writeMask = Xf(c)), o;
    });
  }
  /** 校验并翻译 vertex buffer layout 列表。 */
  static toGPUVertexBufferLayouts(e, n) {
    if (e.length > n.maxVertexBuffers)
      throw new u(
        `[gpu-device-api] RenderPipeline: ${e.length} vertex buffer layouts exceed maxVertexBuffers (${n.maxVertexBuffers}).`
      );
    return e.map((r) => {
      try {
        ii(r, n);
      } catch (i) {
        throw new u(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: r.arrayStride,
        stepMode: nd(r.stepMode ?? "vertex"),
        attributes: r.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: rd(i.format)
        }))
      };
    });
  }
}
function Pr(t) {
  const e = { ...sa, ...t };
  return {
    operation: Kf(e.operation ?? "add"),
    srcFactor: Sr(e.srcFactor),
    dstFactor: Sr(e.dstFactor)
  };
}
function Mr(t) {
  return {
    compare: Yn(t?.compare ?? st.compare),
    failOp: en(t?.failOp ?? st.failOp),
    depthFailOp: en(t?.depthFailOp ?? st.depthFailOp),
    passOp: en(t?.passOp ?? st.passOp)
  };
}
class Pd {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, n) {
    this.cache = oa(e, (r, i) => {
      this.created.delete(i), n?.(r, i);
    });
  }
  get size() {
    return this.cache.size;
  }
  get disposed() {
    return this._disposed;
  }
  has(e) {
    return this.cache.has(e);
  }
  get(e) {
    return this.cache.get(e);
  }
  set(e, n) {
    return this.created.add(e), this.cache.set(e, n);
  }
  delete(e) {
    return this.created.delete(e), this.cache.delete(e);
  }
  clear() {
    this.created.clear(), this.cache.clear();
  }
  /** 当前已缓存的值，最旧的在前。 */
  values() {
    return this.cache.values();
  }
  /** 当前缓存过的全部 key（含被 LRU 淘汰后不再持有的 key 会即时移除）。 */
  keys() {
    return [...this.created];
  }
  /**
   * 查 `key`；不存在则调用 `create` 建立并缓存。
   *
   * `create` 抛错时不会污染缓存（不会留下「半个」条目），错误原样向上抛。
   */
  resolve(e, n) {
    const r = this.cache.get(e);
    if (r !== void 0) return r;
    const i = n();
    return this.set(e, i), i;
  }
  /** 释放缓存本身（不负责销毁其中的对象，因为 WebGPU 的 pipeline 没有 destroy）。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.cache.clear(), this.created.clear());
  }
  /** 便于调试：缓存内容的 key 列表。 */
  toString() {
    return `PipelineCache(size=${this.cache.size}${this._disposed ? ", disposed" : ""})`;
  }
}
function Cr(t) {
  return ai(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    si(t.vertexLayouts)
  );
}
const Md = "vsMain", Cd = "fsMain";
class Es {
  label;
  descriptor;
  layout;
  vertexLayouts;
  device;
  cache;
  logger;
  _disposed = !1;
  warnedMissingVertexLayouts = !1;
  constructor(e, n) {
    this.device = e, this.descriptor = n, this.label = n.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`, this.layout = n.layout ?? "auto", this.vertexLayouts = n.vertex.buffers ?? null, this.logger = Ke(`webgpu:${this.label}`), this.cache = new Pd(64, (r, i) => {
      this.logger.debug(`evicted render pipeline variant ${i}`);
    });
  }
  /** 至少编译过一个 variant 时为 true（不触发编译）。 */
  get compiled() {
    return this.cache.size > 0;
  }
  /** 原生句柄；会按默认 variant 触发一次编译。 */
  get native() {
    return this.resolve();
  }
  /** 当前已编译的 variant 数量。 */
  get variantCount() {
    return this.cache.size;
  }
  get disposed() {
    return this._disposed;
  }
  /**
   * 解析（并缓存）某个 target/variant 对应的具体 pipeline。
   *
   * `variant` 里未给出的字段按以下顺序取值：pipeline descriptor → `render` 预设 → 默认值。
   */
  resolve(e = {}) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`
      );
    const n = this.resolveVariant(e);
    return this.cache.resolve(Cr(n), () => this.createNative(n));
  }
  /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
  get compiledVariants() {
    return this.cache.keys();
  }
  /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.cache.dispose());
  }
  resolveVariant(e) {
    const n = this.descriptor, r = e.colorFormats ?? this.defaultColorFormats(), i = et(
      e.sampleCount ?? n.multisample?.count ?? n.render?.multisample?.count ?? 1,
      `RenderPipeline "${this.label}": sampleCount`
    ), s = e.depthFormat !== void 0 ? e.depthFormat : n.depthStencil?.format ?? null, a = e.vertexLayouts ?? n.vertex.buffers ?? [];
    if (n.fragment && r.length === 0)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. Declare \`colorFormats\` on the descriptor, or pass them per target via resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.`
      );
    if (!n.fragment && !n.depthStencil?.format && s === null)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depth format; WebGPU cannot create a pipeline that writes to nothing.`
      );
    a.length === 0 && !this.warnedMissingVertexLayouts && (this.warnedMissingVertexLayouts = !0, this.logger.debug(
      "building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes"
    ));
    for (const o of r)
      K(o);
    return s !== null && K(s), { colorFormats: r, sampleCount: i, depthFormat: s, vertexLayouts: a };
  }
  defaultColorFormats() {
    const { descriptor: e } = this;
    if (e.colorFormats) return e.colorFormats;
    if (e.render?.colorFormats) return e.render.colorFormats;
    const n = e.fragment?.targets;
    if (!n) return [];
    const r = [];
    for (const i of n) {
      if (i?.format === void 0) return [];
      r.push(i.format);
    }
    return r;
  }
  createNative(e) {
    const n = this.toGPURenderPipelineDescriptor(e);
    return this.logger.debug(`creating render pipeline variant ${Cr(e)}`), this.device.native.createRenderPipeline(n);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const n = this.descriptor, r = this.device.limits, i = n.vertex, a = {
      module: $n(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(j.Vertex),
      entryPoint: i.entryPoint ?? Md,
      buffers: xe.toGPUVertexBufferLayouts(e.vertexLayouts, r)
    }, o = n.fragment;
    let l;
    o && (l = {
      module: $n(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(j.Fragment),
      entryPoint: o.entryPoint ?? Cd,
      targets: xe.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: n.render?.blend,
        writeMask: n.render?.writeMask
      })
    });
    const c = n.primitive ?? n.render?.primitive, h = n.depthStencil ?? n.render?.depthStencil, d = n.multisample ?? n.render?.multisample, f = e.depthFormat, p = {
      label: this.label,
      layout: _s(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: xe.toGPUPrimitiveState(c, this.device.features),
      multisample: xe.toGPUMultisampleState(d, e.sampleCount)
    };
    return l && (p.fragment = l), f !== null ? p.depthStencil = xe.toGPUDepthStencilState(f, h) : h && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), p;
  }
}
function Fd(t, e, n) {
  if (t instanceof Es) return t.resolve(n);
  const r = t?.native;
  if (r && typeof r == "object" && typeof r.getBindGroupLayout == "function")
    return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const Bd = "csMain";
class Ls {
  label;
  descriptor;
  layout;
  device;
  _native = null;
  _disposed = !1;
  constructor(e, n) {
    this.device = e, this.descriptor = n, this.label = n.label ?? `computePipeline#${e.nextResourceId("computePipeline")}`, this.layout = n.layout ?? "auto";
  }
  /** 已经编译出原生 pipeline 时为 true（不触发编译）。 */
  get compiled() {
    return this._native !== null;
  }
  /** 原生句柄；尚未编译时触发一次编译。 */
  get native() {
    return this.resolve();
  }
  get disposed() {
    return this._disposed;
  }
  /** 取得（必要时创建）原生 compute pipeline。 */
  resolve() {
    if (this._disposed)
      throw new u(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
    if (this._native) return this._native;
    const e = $n(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    );
    return this._native = this.device.native.createComputePipeline({
      label: this.label,
      layout: _s(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(j.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? Bd
      }
    }), this._native;
  }
  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose() {
    this._disposed || (this._disposed = !0, this._native = null);
  }
}
function Rd(t, e) {
  if (t instanceof Ls) return t.resolve();
  const n = t?.native;
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const Gd = [0, 0, 0, 1];
class Ps {
  label;
  device;
  colorFormatsList;
  depthFormatValue;
  sampleCountValue;
  mipLevelCountValue;
  baseUsage;
  sampled;
  _width;
  _height;
  colorTextures = [];
  colorViews = [];
  multisampleTextureList = [];
  multisampleViews = [];
  depthTexture = null;
  depthView = null;
  _disposed = !1;
  constructor(e, n) {
    this.device = e, this.label = n.label ?? `renderTarget#${e.nextResourceId("renderTarget")}`;
    const r = Ud(n.color);
    if (this.colorFormatsList = r, this.depthFormatValue = n.depth === void 0 || n.depth === !1 || n.depth === null ? null : n.depth === !0 ? "depth24plus" : n.depth, this.sampleCountValue = et(n.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = n.mipLevelCount ?? 1, this.baseUsage = n.usage ?? 0, this.sampled = n.sampled ?? !1, this._width = mt(n.width, "width", this.label), this._height = mt(n.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !Hs(this.depthFormatValue))
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}": depth format "${this.depthFormatValue}" is not a depth/stencil format.`
      );
    this.rebuild();
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get colorFormats() {
    return this.colorFormatsList;
  }
  get colorFormat() {
    return this.colorFormatsList[0] ?? "rgba8unorm";
  }
  get depthFormat() {
    return this.depthFormatValue;
  }
  get sampleCount() {
    return this.sampleCountValue;
  }
  get mipLevelCount() {
    return this.mipLevelCountValue;
  }
  /** 单采样 color texture（MSAA 时是 resolve 目标）；索引 0 为主 texture。 */
  get colors() {
    return this.colorTextures;
  }
  /** MSAA 时真正的 attachment texture；`sampleCount === 1` 时为空数组。 */
  get multisampleTextures() {
    return this.multisampleTextureList;
  }
  get depth() {
    return this.depthTexture;
  }
  /** 现成的 attachment 列表：默认 `clear` + `store`，可直接交给 `beginRenderPass`。 */
  get colorAttachments() {
    return this.buildAttachments(void 0, void 0, void 0);
  }
  get depthStencilAttachment() {
    return this.buildDepthAttachment(void 0, void 0);
  }
  get disposed() {
    return this._disposed;
  }
  /** 调整尺寸并重建 texture；尺寸不变时返回 false（不重建）。 */
  resize(e, n) {
    if (this._disposed)
      throw new u(`[gpu-device-api] RenderTarget "${this.label}" has been disposed.`);
    const r = mt(e, "width", this.label), i = mt(n, "height", this.label);
    return r === this._width && i === this._height ? !1 : (this._width = r, this._height = i, this.rebuild(), !0);
  }
  /** 按给定的清除行为创建 render pass descriptor 的两份 attachment 列表。 */
  createPassDescriptor(e = {}) {
    return {
      colorAttachments: this.buildAttachments(e.loadOp, e.storeOp, e.clearValue),
      depthStencilAttachment: this.buildDepthAttachment(e.depthLoadOp, e.depthClearValue)
    };
  }
  /** 销毁全部 texture。幂等。 */
  destroy() {
    this._disposed || (this._disposed = !0, this.releaseTextures());
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
  /* ------------------------------------------------------------------ 内部 -------------- */
  rebuild() {
    this.releaseTextures();
    const e = { width: this._width, height: this._height };
    this.colorTextures = this.colorFormatsList.map((n, r) => {
      const i = this.sampled ? y.TextureBinding : y.None;
      return this.device.createTexture({
        label: `${this.label}#color${r}`,
        size: e,
        format: n,
        usage: y.RenderAttachment | i | this.baseUsage,
        mipLevelCount: this.mipLevelCountValue
      });
    }), this.colorViews = this.colorTextures.map((n) => n.createView({ label: `${n.label}#view` })), this.sampleCountValue > 1 && (this.multisampleTextureList = this.colorFormatsList.map(
      (n, r) => this.device.createTexture({
        label: `${this.label}#msaa${r}`,
        size: e,
        format: n,
        usage: y.RenderAttachment,
        sampleCount: this.sampleCountValue
      })
    ), this.multisampleViews = this.multisampleTextureList.map(
      (n) => n.createView({ label: `${n.label}#view` })
    )), this.depthFormatValue !== null && (this.depthTexture = this.device.createTexture({
      label: `${this.label}#depth`,
      size: e,
      format: this.depthFormatValue,
      usage: y.RenderAttachment | this.baseUsage,
      sampleCount: this.sampleCountValue
    }), this.depthView = this.depthTexture.createView({ label: `${this.depthTexture.label}#view` }));
  }
  releaseTextures() {
    for (const e of this.colorTextures) e.destroy();
    for (const e of this.multisampleTextureList) e.destroy();
    this.depthTexture?.destroy(), this.colorTextures = [], this.colorViews = [], this.multisampleTextureList = [], this.multisampleViews = [], this.depthTexture = null, this.depthView = null;
  }
  buildAttachments(e, n, r) {
    const i = r === void 0 ? Gd : r;
    return this.colorFormatsList.map((s, a) => {
      const o = this.multisampleViews[a], l = this.colorViews[a], c = {
        view: o ?? l,
        loadOp: e ?? "clear",
        storeOp: n ?? "store",
        clearValue: i
      };
      return o && (c.resolveTarget = l), c;
    });
  }
  buildDepthAttachment(e, n) {
    if (!this.depthView || this.depthFormatValue === null) return null;
    const r = {
      view: this.depthView,
      depthLoadOp: e ?? "clear",
      depthStoreOp: "store",
      depthClearValue: n ?? 1,
      depthReadOnly: !1
    };
    return Dt(this.depthFormatValue) && (r.stencilLoadOp = e ?? "clear", r.stencilStoreOp = "store", r.stencilClearValue = 0, r.stencilReadOnly = !1), r;
  }
}
function Ud(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function mt(t, e, n) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] RenderTarget "${n}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function Od(t) {
  const e = t.label ?? "renderPass";
  let n, r;
  if (t.target) {
    if (!(t.target instanceof Ps))
      throw new u(
        `[gpu-device-api] ${e}: descriptor.target must be a WebGPURenderTarget created by a WebGPU device.`
      );
    const c = t.target.createPassDescriptor({
      clearValue: t.clearValue,
      depthClearValue: t.depthClearValue
    });
    n = c.colorAttachments, r = c.depthStencilAttachment;
  } else
    n = t.colorAttachments, r = t.depthStencilAttachment ?? null;
  const i = [], s = [], a = [];
  for (const c of n) {
    if (!c) {
      s.push(null);
      continue;
    }
    const h = qe(c.view, `${e}.colorAttachments`), d = c.view.texture;
    i.push(c.view.descriptor.format ?? d.format), a.push(d.sampleCount);
    const f = c.loadOp ?? "clear", p = c.storeOp ?? "store";
    if (d.sampleCount > 1 && !c.resolveTarget && p !== "discard")
      throw new u(
        `[gpu-device-api] ${e}: a multisampled color attachment (sampleCount ${d.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const m = {
      view: h,
      loadOp: nn(f),
      storeOp: rn(p)
    };
    c.resolveTarget && (m.resolveTarget = qe(c.resolveTarget, `${e}.resolveTarget`)), f === "clear" && (m.clearValue = ds(c.clearValue)), s.push(m);
  }
  const o = { label: e, colorAttachments: s };
  let l = null;
  if (r) {
    const c = qe(r.view, `${e}.depthStencilAttachment`), h = r.view.descriptor.format ?? r.view.texture.format;
    l = h, a.push(r.view.texture.sampleCount);
    const d = { view: c }, f = r.depthLoadOp ?? "clear", p = r.depthStoreOp ?? "store";
    if (d.depthLoadOp = nn(f), d.depthStoreOp = rn(p), f === "clear" && (d.depthClearValue = Dd(r.depthClearValue ?? 1, e)), r.depthReadOnly !== void 0 && (d.depthReadOnly = r.depthReadOnly), Dt(h)) {
      const m = r.stencilLoadOp ?? f;
      d.stencilLoadOp = nn(m), d.stencilStoreOp = rn(r.stencilStoreOp ?? "store"), m === "clear" && (d.stencilClearValue = r.stencilClearValue ?? 0), r.stencilReadOnly !== void 0 && (d.stencilReadOnly = r.stencilReadOnly);
    } else if (r.stencilLoadOp !== void 0 || r.stencilStoreOp !== void 0)
      throw new u(
        `[gpu-device-api] ${e}: depth format "${h}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    o.depthStencilAttachment = d;
  }
  return t.occlusionQuerySet && (o.occlusionQuerySet = vs(t.occlusionQuerySet, `${e}.occlusionQuerySet`)), {
    native: o,
    layout: {
      colorFormats: i,
      depthFormat: l,
      sampleCount: Id(a, e)
    }
  };
}
function Id(t, e) {
  if (t.length === 0) return 1;
  const n = t[0];
  for (const r of t)
    if (r !== n)
      throw new u(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return n;
}
function Dd(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new u(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class Vd {
  label;
  layout;
  native;
  device;
  onEnd;
  _ended = !1;
  constructor(e, n, r, i, s) {
    this.device = e, this.native = n, this.layout = r, this.label = i, this.onEnd = s;
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(
      Fd(e, `RenderPass "${this.label}".setPipeline`, {
        colorFormats: this.layout.colorFormats,
        sampleCount: this.layout.sampleCount,
        depthFormat: this.layout.depthFormat
      })
    );
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Ss(n, r, this.device, `RenderPass "${this.label}".setBindGroup`), this.native.setBindGroup(
        e,
        As(n, `RenderPass "${this.label}".setBindGroup`),
        r ?? []
      );
      return;
    }
    if (r && r.length > 0)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  setVertexBuffer(e, n, r, i) {
    if (this.assertOpen("setVertexBuffer"), n === null) {
      this.native.setVertexBuffer(e, null, r, i);
      return;
    }
    this.native.setVertexBuffer(e, I(n, `RenderPass "${this.label}".setVertexBuffer`), r, i);
  }
  setIndexBuffer(e, n, r, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      I(e, `RenderPass "${this.label}".setIndexBuffer`),
      fs(n),
      r,
      i
    );
  }
  setViewport(e, n, r, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), this.native.setViewport(e, n, r, i, s, a);
  }
  setScissorRect(e, n, r, i) {
    this.assertOpen("setScissorRect"), this.native.setScissorRect(e, n, r, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(ds(e));
  }
  setStencilReference(e) {
    this.assertOpen("setStencilReference"), this.native.setStencilReference(e);
  }
  draw(e) {
    this.assertOpen("draw"), this.native.draw(
      e.vertexCount,
      e.instanceCount ?? 1,
      e.firstVertex ?? 0,
      e.firstInstance ?? 0
    );
  }
  drawIndexed(e) {
    this.assertOpen("drawIndexed"), this.native.drawIndexed(
      e.indexCount,
      e.instanceCount ?? 1,
      e.firstIndex ?? 0,
      e.baseVertex ?? 0,
      e.firstInstance ?? 0
    );
  }
  drawIndirect(e, n = 0) {
    this.assertOpen("drawIndirect");
    const r = Fr(e, n, `RenderPass "${this.label}".drawIndirect`);
    this.native.drawIndirect(r.buffer, r.offset);
  }
  drawIndexedIndirect(e, n = 0) {
    this.assertOpen("drawIndexedIndirect");
    const r = Fr(e, n, `RenderPass "${this.label}".drawIndexedIndirect`);
    this.native.drawIndexedIndirect(r.buffer, r.offset);
  }
  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end() {
    this._ended || (this._ended = !0, this.native.end(), this.onEnd?.());
  }
  assertOpen(e) {
    if (this._ended)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
function Fr(t, e, n) {
  return "indirectBuffer" in t ? {
    buffer: I(t.indirectBuffer, n),
    offset: t.indirectOffset ?? 0
  } : { buffer: I(t, n), offset: e };
}
function Nd(t) {
  const e = t?.label ?? "computePass", n = { label: e };
  if (t?.timestampWrites) {
    const r = t.timestampWrites;
    n.timestampWrites = {
      querySet: vs(r.querySet, `${e}.timestampWrites.querySet`),
      beginningOfPassWriteIndex: r.beginningOfPassWriteIndex,
      endOfPassWriteIndex: r.endOfPassWriteIndex
    };
  }
  return n;
}
class zd {
  label;
  native;
  device;
  onEnd;
  _ended = !1;
  constructor(e, n, r, i) {
    this.device = e, this.native = n, this.label = r, this.onEnd = i;
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(Rd(e, `ComputePass "${this.label}".setPipeline`));
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Ss(n, r, this.device, `ComputePass "${this.label}".setBindGroup`), this.native.setBindGroup(
        e,
        As(n, `ComputePass "${this.label}".setBindGroup`),
        r ?? []
      );
      return;
    }
    if (r && r.length > 0)
      throw new u(
        `[gpu-device-api] ComputePass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  dispatchWorkgroups(e, n = 1, r = 1) {
    this.assertOpen("dispatchWorkgroups"), this.native.dispatchWorkgroups(e, n, r);
  }
  dispatchWorkgroupsIndirect(e, n = 0) {
    this.assertOpen("dispatchWorkgroupsIndirect");
    const r = `ComputePass "${this.label}".dispatchWorkgroupsIndirect`;
    if ("indirectBuffer" in e) {
      this.native.dispatchWorkgroupsIndirect(
        I(e.indirectBuffer, r),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(I(e, r), n);
  }
  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end() {
    this._ended || (this._ended = !0, this.native.end(), this.onEnd?.());
  }
  assertOpen(e) {
    if (this._ended)
      throw new u(
        `[gpu-device-api] ComputePass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
class kd {
  label;
  native;
  device;
  /** 唯一可能处于打开状态的 pass（render 或 compute）。 */
  openPass = null;
  _finished = !1;
  _disposed = !1;
  constructor(e, n = {}) {
    this.device = e, this.label = n.label ?? `commandEncoder#${e.nextResourceId("commandEncoder")}`, this.native = e.native.createCommandEncoder({ label: this.label });
  }
  get finished() {
    return this._finished;
  }
  get disposed() {
    return this._disposed;
  }
  /** 开始一个 render pass。同一时间只能有一个 pass 处于打开状态。 */
  beginRenderPass(e) {
    this.assertRecording("beginRenderPass"), this.closeOpenPass();
    const { native: n, layout: r } = Od(e), i = e.label ?? this.label, s = new Vd(
      this.device,
      this.native.beginRenderPass(n),
      r,
      i,
      () => {
        this.openPass === s && (this.openPass = null);
      }
    );
    return this.openPass = s, s;
  }
  /** 开始一个 compute pass。 */
  beginComputePass(e) {
    this.assertRecording("beginComputePass"), this.closeOpenPass();
    const n = Nd(e), r = e?.label ?? this.label, i = new zd(
      this.device,
      this.native.beginComputePass(n),
      r,
      () => {
        this.openPass === i && (this.openPass = null);
      }
    );
    return this.openPass = i, i;
  }
  copyBufferToBuffer(e, n, r, i, s) {
    this.assertRecording("copyBufferToBuffer"), this.native.copyBufferToBuffer(
      I(e, `${this.label}.copyBufferToBuffer(source)`),
      n,
      I(r, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, n, r) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: I(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      gt(n, `${this.label}.copyBufferToTexture(destination)`),
      Oe(r)
    );
  }
  copyTextureToBuffer(e, n, r) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      gt(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: I(n.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: n.offset ?? 0,
        bytesPerRow: n.bytesPerRow,
        rowsPerImage: n.rowsPerImage
      },
      Oe(r)
    );
  }
  copyTextureToTexture(e, n, r) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      gt(e, `${this.label}.copyTextureToTexture(source)`),
      gt(n, `${this.label}.copyTextureToTexture(destination)`),
      Oe(r)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, n = 0, r) {
    this.assertRecording("clearBuffer"), Mt(n, `${this.label}.clearBuffer offset`);
    const i = r ?? e.size - n;
    if (n % 4 !== 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${n}.`
      );
    if (i <= 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${i}.`
      );
    if (i % 4 !== 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${i}.`
      );
    if (n + i > e.size)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: range [${n}, ${n + i}) exceeds the buffer size ${e.size}.`
      );
    this.native.clearBuffer(
      I(e, `${this.label}.clearBuffer`),
      n,
      i
    );
  }
  /**
   * 结束录制并返回 command buffer。
   *
   * 如果有 pass 还开着，会先隐式 `end()` —— 与 WebGPU 原生的 `finish()` 行为一致
   * （否则留在录制中的 pass 会被静默丢弃）。
   */
  finish() {
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, new Ms(this.label, this.native.finish());
  }
  /** 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。 */
  dispose() {
    this._disposed = !0;
  }
  closeOpenPass() {
    this.openPass && !this.openPass.ended && this.openPass.end(), this.openPass = null;
  }
  assertRecording(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] CommandEncoder "${this.label}".${e}: already disposed.`);
    if (this._finished)
      throw new u(
        `[gpu-device-api] CommandEncoder "${this.label}".${e}: the encoder has already been finished.`
      );
  }
}
class Ms {
  label;
  native;
  _disposed = !1;
  constructor(e, n) {
    this.label = e, this.native = n;
  }
  get disposed() {
    return this._disposed;
  }
  /** `GPUCommandBuffer` 没有 destroy；释放只是标记本包装对象不可用（提交后本身就不可复用）。 */
  dispose() {
    this._disposed = !0;
  }
}
function gt(t, e) {
  const n = {
    texture: bs(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = ps(t.origin)), t.aspect !== void 0 && (n.aspect = Hn(t.aspect)), n;
}
function Wd(t, e) {
  if (t instanceof Ms) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${te(t)}.`
  );
}
class jd {
  canvas;
  options;
  gpuContext = null;
  currentDevice = null;
  formatValue;
  usageValue;
  alphaModeValue = "premultiplied";
  colorSpaceValue;
  sampleCountValue = 1;
  widthValue = 1;
  heightValue = 1;
  pixelRatioValue;
  configuredValue = !1;
  frameTexture = null;
  frameView = null;
  frameNative = null;
  frameTarget = null;
  multisampleTexture = null;
  multisampleViewValue = null;
  _disposed = !1;
  constructor(e, n = {}) {
    this.canvas = e, this.options = n, this.pixelRatioValue = n.pixelRatio ?? ci(), this.formatValue = $r(), this.usageValue = y.RenderAttachment | (n.copySrc ? y.CopySrc : y.None);
    const r = je(e);
    this.widthValue = Math.max(1, Math.round(r.width * this.pixelRatioValue)), this.heightValue = Math.max(1, Math.round(r.height * this.pixelRatioValue));
  }
  get width() {
    return this.widthValue;
  }
  get height() {
    return this.heightValue;
  }
  get pixelRatio() {
    return this.pixelRatioValue;
  }
  get format() {
    return this.formatValue;
  }
  get configured() {
    return this.configuredValue;
  }
  get device() {
    return this.currentDevice;
  }
  /** 原生 `GPUCanvasContext`；configure 之后才有值。 */
  get native() {
    return this.gpuContext;
  }
  /** 本上下文使用的 MSAA 采样数（1 或 4）。 */
  get sampleCount() {
    return this.sampleCountValue;
  }
  /** 当前帧 canvas 纹理的 view（MSAA 时是 resolve target）；未取帧时为 `null`。 */
  get frameTextureView() {
    return this.frameView;
  }
  /** 配置了 MSAA 且已取过一次帧时，当前帧的多重采样 view；否则为 `null`。 */
  get multisampleView() {
    return this.multisampleViewValue;
  }
  get disposed() {
    return this._disposed;
  }
  /** 把 context 配置到某个 device 上。会丢弃当前帧的缓存。 */
  configure(e) {
    if (this._disposed)
      throw new u("[gpu-device-api] CanvasContext.configure: the context has been disposed.");
    if (!(e.device instanceof Cs))
      throw new u(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const n = jf(this.canvas);
    if (!n)
      throw new u(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.gpuContext = n, this.currentDevice = e.device, this.formatValue = e.format ?? $r(), this.usageValue = y.RenderAttachment | (e.usage ?? y.None) | (this.options.copySrc ? y.CopySrc : y.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace, this.sampleCountValue = et(
      e.sampleCount ?? e.device.defaultSampleCount,
      "CanvasConfig.sampleCount"
    );
    const r = {
      device: e.device.native,
      format: Wf(this.formatValue),
      usage: hs(this.usageValue),
      alphaMode: this.alphaModeValue
    };
    this.colorSpaceValue !== void 0 && (r.colorSpace = this.colorSpaceValue), n.configure(r), this.configuredValue = !0, this.setSize(this.widthValue / this.pixelRatioValue, this.heightValue / this.pixelRatioValue, !1);
  }
  /** 解除配置；之后 `getCurrentFrameTarget()` 会抛错。 */
  unconfigure() {
    this.releaseFrame(), this.releaseMultisampleTarget();
    const e = this.gpuContext;
    e && typeof e.unconfigure == "function" && e.unconfigure(), this.configuredValue = !1, this.currentDevice = null, this.gpuContext = null;
  }
  /** 以 CSS 像素设置画布尺寸（内部会乘以 pixel ratio）。 */
  setSize(e, n, r = !0) {
    if (!Number.isFinite(e) || !Number.isFinite(n) || e <= 0 || n <= 0)
      throw new u(
        `[gpu-device-api] CanvasContext.setSize: width and height must be positive, got ${e}x${n}.`
      );
    const i = Math.max(1, Math.round(e * this.pixelRatioValue)), s = Math.max(1, Math.round(n * this.pixelRatioValue));
    if (this.canvas.width = i, this.canvas.height = s, r) {
      const a = this.canvas.style;
      a && (a.width = `${e}px`, a.height = `${n}px`);
    }
    (i !== this.widthValue || s !== this.heightValue) && (this.widthValue = i, this.heightValue = s, this.releaseFrame(), this.releaseMultisampleTarget());
  }
  /** 设置 CSS 像素与设备像素之间的比例。 */
  setPixelRatio(e) {
    if (!Number.isFinite(e) || e <= 0)
      throw new u(
        `[gpu-device-api] CanvasContext.setPixelRatio: ratio must be positive, got ${String(e)}.`
      );
    if (e === this.pixelRatioValue) return;
    const n = this.widthValue / this.pixelRatioValue, r = this.heightValue / this.pixelRatioValue;
    this.pixelRatioValue = e, this.setSize(n, r, !1);
  }
  /** 重新读取元素尺寸；back buffer 发生变化时返回 true。 */
  resize(e = !1) {
    const n = je(this.canvas), r = Math.max(1, Math.round(n.width * this.pixelRatioValue)), i = Math.max(1, Math.round(n.height * this.pixelRatioValue));
    return r === this.widthValue && i === this.heightValue ? !1 : (this.setSize(n.width, n.height, e), !0);
  }
  /**
   * 获取当前帧纹理。
   *
   * WebGPU 在 present 之前会一直返回同一个 `GPUTexture`，因此这里按原生对象身份缓存包装
   * 对象；present（提交了写 canvas 的 render pass）之后身份变化，包装对象会被自动重建。
   */
  getCurrentFrameTarget() {
    const e = this.currentDevice;
    if (!this.configuredValue || !this.gpuContext || !e)
      throw new u(
        "[gpu-device-api] CanvasContext.getCurrentFrameTarget: the context is not configured."
      );
    const n = this.gpuContext.getCurrentTexture();
    if (this.frameTarget && this.frameNative === n) return this.frameTarget;
    this.releaseFrame();
    const r = Se.adopt(
      e,
      n,
      {
        label: `${e.label}#canvasTexture`,
        format: this.formatValue,
        usage: this.usageValue,
        size: { width: n.width, height: n.height, depthOrArrayLayers: 1 }
      },
      { owned: !1 }
    ), i = r.createView({ label: `${r.label}#view` });
    return this.frameTexture = r, this.frameView = i, this.frameNative = n, this.frameTarget = {
      texture: r,
      view: i,
      width: r.width,
      height: r.height,
      format: this.formatValue,
      isDefaultFramebuffer: !0
    }, this.frameTarget;
  }
  /**
   * 生成可以直接交给 `beginRenderPass` 的 color attachment 列表。
   *
   * `sampleCount > 1` 时会创建/复用一个同尺寸的多重采样 texture，把它作为 `view`，
   * 而把 canvas 纹理作为 `resolveTarget`。
   */
  createPassDescriptor(e = {}) {
    const n = this.getCurrentFrameTarget(), r = e.loadOp ?? "clear", i = e.storeOp ?? "store", s = e.clearValue;
    return this.sampleCountValue > 1 ? {
      colorAttachments: [
        {
          view: this.ensureMultisampleTarget(n.width, n.height),
          resolveTarget: n.view,
          loadOp: r,
          storeOp: i,
          clearValue: s
        }
      ],
      depthStencilAttachment: null
    } : {
      colorAttachments: [{ view: n.view, loadOp: r, storeOp: i, clearValue: s }],
      depthStencilAttachment: null
    };
  }
  /** 释放 context 相关资源。幂等。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.unconfigure());
  }
  /* ------------------------------------------------------------------ 内部 -------------- */
  ensureMultisampleTarget(e, n) {
    const r = this.currentDevice;
    if (!r)
      throw new u("[gpu-device-api] CanvasContext: the context is not configured.");
    const i = this.multisampleTexture;
    if (i && i.width === e && i.height === n && this.multisampleViewValue)
      return this.multisampleViewValue;
    this.releaseMultisampleTarget();
    const s = Se.create(r, {
      label: `${r.label}#canvasMSAA`,
      size: { width: e, height: n },
      format: this.formatValue,
      usage: y.RenderAttachment,
      sampleCount: this.sampleCountValue
    });
    return this.multisampleTexture = s, this.multisampleViewValue = s.createView({ label: `${s.label}#view` }), this.multisampleViewValue;
  }
  releaseFrame() {
    this.frameTexture?.dispose(), this.frameTexture = null, this.frameView = null, this.frameNative = null, this.frameTarget = null;
  }
  releaseMultisampleTarget() {
    this.multisampleTexture?.destroy(), this.multisampleTexture = null, this.multisampleViewValue = null;
  }
}
class qd {
  native;
  device;
  constructor(e) {
    this.device = e, this.native = e.native.queue;
  }
  /**
   * 将主机端数据写入 buffer。
   *
   * **时序契约（WebGPU 原生语义）**：这次写入对**之后提交的所有命令**可见 —— 包括已经录制进
   * 当前打开的 encoder、但直到这次 `writeBuffer()` 之后才 `submit()` 的命令。也就是说
   * 「先写 buffer → 录制 draw → 再写同一个 buffer → 提交」时，**两次 draw 都会看到后写入的数据**。
   *
   * 这与 WebGL2 后端的立即模式语义不同（那边只有之后录制的命令能看到新数据），需要
   * 「改 uniform → draw → 再改 → 再 draw」时请使用 uniform arena + dynamic offset
   * （`setBindGroup(index, bindGroup, [dynamicOffset])`），两个后端的结果才一致。
   *
   * **单位换算（容易踩）**：core 的契约里 `dataOffset` / `size` 是**字节**
   * （WebGL2 后端就是这么实现的），而 WebGPU 原生接口在 `data` 是 TypedArray 时按**元素**计
   * （`Float32Array` 的 `size = 4` 表示 4 个 float = 16 字节）。这里统一换算成元素再下发，
   * 否则同一个调用在两个后端会写入不同的范围 —— 通常表现为
   * `Number of bytes to write is too large`。
   */
  writeBuffer(e, n, r, i = 0, s) {
    const a = r instanceof DataView ? 1 : r.BYTES_PER_ELEMENT ?? 1, o = s ?? r.byteLength - i;
    if (i % a !== 0 || o % a !== 0)
      throw new u(
        `[gpu-device-api] Queue.writeBuffer: dataOffset (${i}) and size (${o}) are measured in bytes, so both must be multiples of the element size (${a}) of the given ${r.constructor.name}.`
      );
    this.native.writeBuffer(
      I(e, "Queue.writeBuffer"),
      n,
      r,
      i / a,
      o / a
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, n, r, i) {
    this.native.writeTexture(
      an(e, "Queue.writeTexture"),
      n,
      gd(r),
      Oe(i)
    );
  }
  /**
   * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
   *
   * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
   * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
   */
  copyExternalImageToTexture(e, n, r, i = !1) {
    this.native.copyExternalImageToTexture(
      { source: e, flipY: i },
      an(n, "Queue.copyExternalImageToTexture"),
      Oe(r)
    );
  }
  /**
   * buffer → buffer 的拷贝。
   *
   * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
   * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
   */
  copyBufferToBuffer(e, n, r, i, s) {
    const a = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToBuffer" });
    a.copyBufferToBuffer(
      I(e, "Queue.copyBufferToBuffer(source)"),
      n,
      I(r, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, n, r) {
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: I(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      an(n, "Queue.copyBufferToTexture(destination)"),
      Oe(r)
    ), this.native.submit([i.finish()]);
  }
  /** 提交 command buffer；提交后这些 buffer 不可再次使用。 */
  submit(e) {
    this.native.submit(e.map((n) => Wd(n, "Queue.submit")));
  }
  /** 先前提交的全部工作都在 GPU 上完成后 resolve。 */
  async onSubmittedWorkDone() {
    await this.native.onSubmittedWorkDone();
  }
  /** 本队列所属设备，便于调试。 */
  get owner() {
    return this.device;
  }
}
function an(t, e) {
  const n = {
    texture: bs(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = ps(t.origin)), t.aspect !== void 0 && (n.aspect = Hn(t.aspect)), n;
}
class Cs {
  label;
  backend = "webgpu";
  native;
  features;
  limits;
  queue;
  debug;
  lost;
  /** 请求设备时实际启用的 feature 名（`DeviceDescriptor.requiredFeatures`）。 */
  enabledFeatures;
  /** 创建本设备的 adapter 信息，便于日志与调试。 */
  adapterInfo;
  /** `requiredLimits` 经校验后的完整 limits；`limits` 则来自实际创建出来的 device。 */
  requestedLimits;
  /** `DeviceDescriptor.defaultSampleCount` 的规范化结果（1 或 4）。 */
  defaultSampleCount;
  /** 请求设备时的原始 descriptor，便于诊断。 */
  descriptor;
  logger;
  resources = /* @__PURE__ */ new Set();
  canvasContexts = /* @__PURE__ */ new Map();
  errorCallbacks = /* @__PURE__ */ new Set();
  resolveLost;
  lostInfo = null;
  _disposed = !1;
  constructor(e, n) {
    this.native = e, this.descriptor = n.descriptor, this.label = n.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = n.adapterInfo, this.requestedLimits = n.resolvedLimits, this.debug = n.descriptor.debug ?? !1, this.enabledFeatures = [...n.descriptor.requiredFeatures ?? []], this.features = new kf(n.adapterFeatures), this.limits = us(e.limits), this.defaultSampleCount = et(
      n.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = Ke(`webgpu:${this.label}`);
    let r = () => {
    };
    this.lost = new Promise((i) => {
      r = i;
    }), this.resolveLost = r, this.queue = new qd(this), e.onuncapturederror = (i) => {
      this.reportError(Xd(i.error));
    }, e.lost.then((i) => this.handleDeviceLost(i)), this.logger.debug(
      `created device (${this.adapterInfo.device || this.adapterInfo.vendor || "unknown adapter"}, features: ${this.enabledFeatures.join(", ") || "none"})`
    );
  }
  get disposed() {
    return this._disposed;
  }
  /** 设备是否仍然可用。 */
  get usable() {
    return !this._disposed && this.lostInfo === null;
  }
  /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
  nextResourceId(e) {
    return G(e);
  }
  /* ---------------------------------------------------------------- 资源 */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(new ms(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(Se.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Qn(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new ws(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new xs(this, e));
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new ys(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Ts(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(He.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new Es(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new Ls(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new Ps(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new kd(this, e));
  }
  /**
   * 为一个 canvas 建立（或取回）本设备的 swap chain 表面。
   *
   * 同一个 canvas 只会有一个 `GPUCanvasContext`，因此这里按 canvas 元素缓存
   * {@link WebGPUCanvasContext}；重复调用返回同一个对象。给了 `config`（或该 canvas 尚未
   * configure）时会重新 configure —— 也就是可以用它切换格式 / alphaMode / sampleCount。
   */
  createCanvasContext(e, n) {
    if (this.assertUsable("createCanvasContext"), !e || typeof e.getContext != "function")
      throw new u(
        "[gpu-device-api] Device.createCanvasContext: expected an HTMLCanvasElement or OffscreenCanvas."
      );
    let r = this.canvasContexts.get(e);
    return (!r || r.disposed) && (r = this.track(new jd(e)), this.canvasContexts.set(e, r)), (n !== void 0 || !r.configured) && r.configure({ ...n, device: this }), r;
  }
  /* ---------------------------------------------------------------- 错误 */
  /**
   * 注册错误回调，返回取消订阅函数。
   *
   * 设备丢失也会通过这个通道上报（见 {@link WebGPUDevice.lost}），因此即使只关心
   * 「设备还能不能用」，也应该注册一次。
   */
  onError(e) {
    return this.errorCallbacks.add(e), () => {
      this.errorCallbacks.delete(e);
    };
  }
  /** 通过已注册的回调上报错误，不抛异常。回调自身抛错不会影响其它回调。 */
  reportError(e) {
    if (this.errorCallbacks.size === 0) {
      this.logger.error(e.toString());
      return;
    }
    for (const n of [...this.errorCallbacks])
      try {
        n(e);
      } catch (r) {
        this.logger.error(`error callback threw: ${String(r)}`);
      }
  }
  /** 释放设备创建的全部资源，然后销毁 device。幂等。 */
  dispose() {
    if (this._disposed) return;
    this._disposed = !0, this.native.onuncapturederror = null;
    const e = [...this.resources];
    this.resources.clear(), this.canvasContexts.clear();
    try {
      ui(e);
    } catch (n) {
      this.logger.error(`failed to dispose some resources: ${String(n)}`);
    }
    this.errorCallbacks.clear(), this.native.destroy();
  }
  /* ---------------------------------------------------------------- 内部 */
  track(e) {
    return this.resources.add(e), e;
  }
  assertUsable(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`);
    if (this.lostInfo)
      throw new dn(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfo.reason}): ` + this.lostInfo.message,
        { reason: this.lostInfo.reason }
      );
  }
  handleDeviceLost(e) {
    const n = e.reason === "destroyed" ? "destroyed" : "unknown", r = { reason: n, message: e.message };
    this.lostInfo = r, this.resolveLost(r), this._disposed || this.reportError(
      new dn(`[gpu-device-api] WebGPU device lost (${n}): ${e.message}`, { reason: n })
    );
  }
}
function Xd(t) {
  if (ta(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), n = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return on(t, "GPUValidationError") ? new u(n) : on(t, "GPUOutOfMemoryError") ? new na(n) : on(t, "GPUInternalError") ? new fe(n, { code: "INTERNAL_ERROR" }) : t instanceof Error ? new fe(n, { code: "GPU_ERROR", cause: t }) : new fe(n);
}
function on(t, e) {
  const n = globalThis[e];
  if (typeof n == "function") {
    const i = n;
    try {
      if (t instanceof i) return !0;
    } catch {
    }
  }
  return t?.constructor?.name === e;
}
class Lt {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, n) {
    this.native = e, this.options = n, this.info = Nf(e), this.features = Vf(e.features), this.limits = us(e.limits), this.featureNames = [...this.features].sort();
  }
  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions() {
    return this.options;
  }
  /** 当前环境是否暴露 WebGPU。 */
  static isSupported() {
    return yr();
  }
  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(e = {}) {
    const n = await Df(e);
    return n ? new Lt(n, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const n = await Lt.request(e);
    if (n) return n;
    throw yr() ? new u(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new u(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const n = oi(this.limits, e.requiredLimits, "webgpu"), r = zf(
      this.features,
      e.requiredFeatures,
      `WebGPUAdapter.requestDevice (${this.info.device || this.info.vendor || "unknown adapter"})`
    ), i = {};
    for (const [a, o] of Object.entries(e.requiredLimits ?? {}))
      typeof o == "number" && (i[a] = o);
    const s = await this.native.requestDevice({
      label: e.label,
      requiredFeatures: [...r],
      requiredLimits: i,
      defaultQueue: { label: e.label ? `${e.label}#queue` : void 0 }
    });
    return new Cs(s, {
      descriptor: e,
      resolvedLimits: n,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function Yd(t) {
  return t.canvas ? t.canvas : Fs();
}
function Hd() {
  return Fs();
}
function Fs() {
  if (typeof document < "u") {
    const t = document.createElement("canvas");
    return t.width = 1, t.height = 1, t;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
const Tn = Symbol("timeout");
async function Br(t, e) {
  let n;
  try {
    return await Promise.race([
      t,
      new Promise((r) => {
        n = setTimeout(() => r(Tn), e);
      })
    ]);
  } finally {
    n !== void 0 && clearTimeout(n);
  }
}
const bt = 3e3;
class Zd {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    try {
      const n = await Br(
        navigator.gpu.requestAdapter({
          powerPreference: e.powerPreference ?? "high-performance",
          forceFallbackAdapter: e.forceFallbackAdapter ?? !1
        }),
        bt
      );
      return n === Tn ? {
        ok: !1,
        reason: `requestAdapter() 超过 ${bt}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`
      } : n ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (n) {
      return { ok: !1, reason: `requestAdapter() 抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const n = await Br(
      Lt.create({
        powerPreference: e.powerPreference,
        forceFallbackAdapter: e.forceFallbackAdapter
      }),
      bt
    );
    if (n === Tn)
      throw new u(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${bt}ms 没有返回。这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。
可以稍后重试，或改用 WebGL2 后端。`
      );
    return n;
  }
}
class Qd {
  kind = "webgl2";
  async isAvailable(e) {
    const n = Hd();
    if (!n)
      return { ok: !1, reason: "没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）" };
    try {
      return n.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（浏览器不支持 WebGL2）" };
    } catch (r) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    const n = Yd(e);
    if (!n)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return jn.request({
      canvas: n,
      contextAttributes: e.contextAttributes
    });
  }
}
let cn = null;
function Kn() {
  return cn || (cn = new Ru().register(new Zd()).register(new Qd())), cn;
}
const Kd = ["webgpu", "webgl2"];
async function Jd(t = {}) {
  const e = t.registry ?? Kn(), n = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? Kd, r = await e.probeAll(n, t), i = r.find((s) => s.ok);
  if (i) {
    const s = r.slice(0, r.indexOf(i)).filter((a) => !a.ok);
    return {
      backend: i.backend,
      probes: r,
      reason: s.length === 0 ? `选用 ${i.backend}。` : `选用 ${i.backend}；更优先的后端不可用：${s.map((a) => `${a.backend}（${a.reason ?? "原因未知"}）`).join("；")}。`
    };
  }
  return {
    backend: null,
    probes: r,
    reason: "没有可用的渲染后端。各候选后端的探测结果：" + r.map((s) => `${s.backend} — ${s.reason ?? "不可用"}`).join("；") + "。"
  };
}
async function rg(t, e = {}) {
  const r = (e.registry ?? Kn()).get(t);
  return r ? (await r.isAvailable(e)).ok : !1;
}
async function ig(t = {}) {
  return (await Bs(t)).device;
}
async function Bs(t = {}) {
  const e = t.logger ?? Ke("gpu-device-api"), n = t.registry ?? Kn(), r = await Jd({
    backend: t.backend ?? "auto",
    order: t.order,
    canvas: t.canvas,
    contextAttributes: t.contextAttributes,
    powerPreference: t.powerPreference,
    forceFallbackAdapter: t.forceFallbackAdapter,
    registry: n
  });
  if (r.backend === null)
    throw new u(
      `[gpu-device-api] 无法创建渲染设备：${r.reason}
排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。`
    );
  if (t.strictBackend && t.backend && t.backend !== "auto" && t.backend !== r.backend)
    throw new u(
      `[gpu-device-api] 要求使用 ${t.backend} 后端，但它不可用：${r.reason}`
    );
  const i = !t.strictBackend, s = [
    r.backend,
    ...r.probes.filter((o) => o.ok && o.backend !== r.backend).map((o) => o.backend)
  ], a = [];
  for (const o of s) {
    const l = n.get(o);
    if (l)
      try {
        const c = await l.createAdapter({
          canvas: t.canvas,
          contextAttributes: t.contextAttributes,
          powerPreference: t.powerPreference,
          forceFallbackAdapter: t.forceFallbackAdapter
        }), h = await c.requestDevice({
          label: t.label,
          requiredFeatures: t.requiredFeatures,
          requiredLimits: t.requiredLimits,
          debug: t.debug
        }), d = t.canvas ? h.createCanvasContext(t.canvas) : null;
        return o !== r.backend ? e.warn(
          `后端 ${r.backend} 初始化失败，已改用 ${o}。失败原因：${a[a.length - 1] ?? "未知"}`
        ) : o === "webgl2" && t.backend !== "webgl2" && e.info(`已回退到 WebGL2 后端：${r.reason}`), { device: h, adapter: c, backend: o, probes: r.probes, context: d };
      } catch (c) {
        const h = c.message;
        if (a.push(`${o} — ${h}`), !i) throw c;
        e.warn(`后端 ${o} 初始化失败：${h}`);
      }
  }
  throw new u(
    `[gpu-device-api] 没有可用的渲染后端。逐个初始化的结果：
  ${a.join(`
  `)}
排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。
另一个常见原因：这张 canvas 已经被别的代码用 getContext() 绑定成了其它类型，一个 canvas 只能绑定一种 context —— 请为它新建一张 canvas，或换一个未被占用的 canvas。`
  );
}
const Rr = 16, ep = 12, Pt = {
  f32: { align: 4, size: 4, glsl: "float", wgsl: "f32", componentType: "f32", components: 1 },
  i32: { align: 4, size: 4, glsl: "int", wgsl: "i32", componentType: "i32", components: 1 },
  u32: { align: 4, size: 4, glsl: "uint", wgsl: "u32", componentType: "u32", components: 1 },
  vec2f: { align: 8, size: 8, glsl: "vec2", wgsl: "vec2f", componentType: "f32", components: 2 },
  vec3f: { align: 16, size: 12, glsl: "vec3", wgsl: "vec3f", componentType: "f32", components: 3 },
  vec4f: { align: 16, size: 16, glsl: "vec4", wgsl: "vec4f", componentType: "f32", components: 4 },
  vec2i: { align: 8, size: 8, glsl: "ivec2", wgsl: "vec2i", componentType: "i32", components: 2 },
  vec3i: { align: 16, size: 12, glsl: "ivec3", wgsl: "vec3i", componentType: "i32", components: 3 },
  vec4i: { align: 16, size: 16, glsl: "ivec4", wgsl: "vec4i", componentType: "i32", components: 4 },
  vec2u: { align: 8, size: 8, glsl: "uvec2", wgsl: "vec2u", componentType: "u32", components: 2 },
  vec3u: { align: 16, size: 12, glsl: "uvec3", wgsl: "vec3u", componentType: "u32", components: 3 },
  vec4u: { align: 16, size: 16, glsl: "uvec4", wgsl: "vec4u", componentType: "u32", components: 4 },
  mat3x3f: {
    align: 16,
    size: Rr * 3,
    glsl: "mat3",
    wgsl: "mat3x3f",
    componentType: "f32",
    components: 9,
    columnStride: Rr,
    columnSize: ep,
    columns: 3
  },
  mat4x4f: {
    align: 16,
    size: 64,
    glsl: "mat4",
    wgsl: "mat4x4f",
    componentType: "f32",
    components: 16,
    columnStride: 16,
    columnSize: 16,
    columns: 4
  }
}, Gr = Object.keys(Pt);
function ln(t, e) {
  return Math.ceil(t / e) * e;
}
function tp(t) {
  const e = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(t);
  if (e) {
    const r = e[1], i = Pt[r];
    if (!i)
      throw new u(
        `[gpu-device-api] 不支持的 uniform 元素类型「${r}」（出现在「${t}」里）。支持：${Gr.join("、")}。`
      );
    const s = Number(e[2]);
    if (s <= 0)
      throw new u(`[gpu-device-api] uniform 数组「${t}」的元素个数必须为正数。`);
    if (i.columns !== void 0 && i.columnStride !== i.columnSize)
      throw new u(
        `[gpu-device-api] 不支持 \`${t}\`：\`mat3x3f\` 的每列有 4 字节填充，无法表示成扁平数组。
请改用 \`mat4x4f[` + s + "]`（多出的第 4 个分量当作 0 即可），或者拆成多个独立的 mat3 字段。"
      );
    return { element: r, count: s };
  }
  if (t === "mat2x2f" || t === "mat2x3f" || t === "mat2x4f" || t === "mat3x2f" || t === "mat3x4f" || t === "mat4x2f" || t === "mat4x3f")
    throw new u(
      `[gpu-device-api] uniform 不支持 \`${t}\`：GLSL std140 与 WGSL uniform 对非 4 列的矩阵布局规则不一致（std140 会把列步长补齐到 16 字节）。
请改用 \`mat4x4f\`（把缺的列填单位向量或零），或拆成若干 \`vec4f\`。`
    );
  if (!Pt[t])
    throw new u(
      `[gpu-device-api] 不支持的 uniform 类型「${t}」。支持：${Gr.join("、")}，以及 \`类型[N]\` 形式的数组。`
    );
  return { element: t, count: 1 };
}
const np = /* @__PURE__ */ new Set([
  "alias",
  "break",
  "case",
  "const",
  "continue",
  "default",
  "discard",
  "else",
  "enable",
  "false",
  "fn",
  "for",
  "if",
  "let",
  "loop",
  "override",
  "return",
  "struct",
  "switch",
  "true",
  "var",
  "while",
  "array",
  "atomic",
  "bool",
  "f16",
  "f32",
  "i32",
  "u32",
  "mat2x2",
  "mat3x3",
  "mat4x4",
  "ptr",
  "sampler",
  "sampler_comparison",
  "texture_1d",
  "texture_2d",
  "texture_2d_array",
  "texture_3d",
  "texture_cube",
  "vec2",
  "vec3",
  "vec4"
]), rp = /^[A-Za-z_][A-Za-z0-9_]*$/;
class Vt {
  desc;
  fields;
  /** 块总字节数（16 的倍数）。 */
  byteLength;
  /** 内容指纹，用于缓存与校验「管线与数值是否匹配」。 */
  key;
  /** WGSL 结构体名；GLSL 的块名是 `${structName}Block` 之外，这里同时用作 GLSL 块名。 */
  structName;
  /** 着色器里的实例名；两种语言都是 `u`，所以成员访问写法一致。 */
  instanceName = "u";
  group;
  binding;
  constructor(e, n = {}) {
    this.desc = { ...e }, this.structName = n.structName ?? "Uniforms", this.group = n.group ?? 0, this.binding = n.binding ?? 0;
    const r = Object.keys(e);
    if (r.length === 0)
      throw new u("[gpu-device-api] uniform 布局至少要有一个字段。");
    const i = [];
    let s = 0, a = 16;
    for (const o of r) {
      if (!rp.test(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」不是合法标识符。`);
      if (np.has(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」是 WGSL 保留字，请换一个。`);
      const l = e[o], { element: c, count: h } = tp(l), d = Pt[c], f = ln(s, d.align), p = d.size, m = h > 1 ? ln(d.size, 16) : d.size, g = d.columnStride === void 0 || d.columnStride === d.columnSize, b = h > 1 ? m === d.size && g : g, w = h > 1 ? m * (h - 1) + d.size : d.size;
      i.push({ name: o, type: l, info: d, byteOffset: f, byteSize: p, byteStride: m, count: h, packed: b }), s = f + w, a = Math.max(a, d.align, h > 1 ? 16 : 0);
    }
    this.fields = i, this.byteLength = ln(s, a), this.key = `${this.structName}|${this.group}|${this.binding}|${r.map((o) => `${o}:${e[o]}`).join(",")}`;
  }
  field(e) {
    const n = this.fields.find((r) => r.name === e);
    if (!n)
      throw new u(
        `[gpu-device-api] uniform 布局里没有字段「${e}」。现有字段：${this.fields.map((r) => r.name).join("、")}。`
      );
    return n;
  }
  has(e) {
    return this.fields.some((n) => n.name === e);
  }
  /**
   * GLSL 里的元素类型（**不含数组后缀**）。
   * 注意 GLSL 的数组写法是 `mat4 bones[64];`（方括号跟在名字后面），
   * 与 WGSL 的 `array<mat4x4f, 64>` 不同，所以数组由 {@link glslDeclaration} 拼接。
   */
  glslMemberType(e) {
    return e.info.glsl;
  }
  /** WGSL 里的成员类型（数组写成 `array<T, N>`）。 */
  wgslMemberType(e) {
    return e.count > 1 ? `array<${e.info.wgsl}, ${e.count}>` : e.info.wgsl;
  }
  /**
   * GLSL 的 `std140` 块声明。块名用 {@link structName}，实例名 `u`。
   * 之所以块名不叫 `UniformsBlock`：WebGL2 后端要靠**块名**去 `gl.getUniformBlockIndex` 定位，
   * 而 WGSL 的结构体名也是这个 —— 两边同名可以让 `BindGroupLayoutEntry.name` 只写一次。
   */
  glslDeclaration() {
    const e = this.fields.map((n) => {
      const r = n.count > 1 ? `${n.name}[${n.count}]` : n.name;
      return `  ${this.glslMemberType(n)} ${r};`;
    }).join(`
`);
    return `layout(std140) uniform ${this.structName} {
${e}
} ${this.instanceName};`;
  }
  /** WGSL 的 struct + binding 声明。 */
  wgslDeclaration() {
    const e = this.fields.map((n) => `  ${n.name}: ${this.wgslMemberType(n)},`).join(`
`);
    return `struct ${this.structName} {
${e}
}
@group(${this.group}) @binding(${this.binding}) var<uniform> ${this.instanceName}: ${this.structName};`;
  }
  /** 调试用：逐字段打印偏移。 */
  describe() {
    const e = this.fields.map(
      (n) => `  +${String(n.byteOffset).padStart(4)}  ${n.name.padEnd(18)} ${n.type.padEnd(14)} size=${n.byteSize} stride=${n.byteStride} count=${n.count}`
    );
    return [`${this.structName}（共 ${this.byteLength} 字节）`, ...e].join(`
`);
  }
}
const Ur = /* @__PURE__ */ new Map();
function Rs(t, e) {
  const n = new Vt(t, e), r = Ur.get(n.key);
  return r || (Ur.set(n.key, n), n);
}
function Sn(t, e, n, r) {
  return t === "i32" ? new Int32Array(e, n, r) : t === "u32" ? new Uint32Array(e, n, r) : new Float32Array(e, n, r);
}
function Or(t, e, n, r, i) {
  const s = [];
  return {
    type: t.type,
    count: i,
    byteStride: n,
    at(a) {
      if (a < 0 || a >= i)
        throw new RangeError(
          `[gpu-device-api] uniform 字段「${t.name}」的下标 ${a} 越界（有效范围 0..${i - 1}）。`
        );
      let o = s[a];
      return o || (o = Sn(t.info.componentType, e, t.byteOffset + a * n, r), s[a] = o), o;
    },
    set(a) {
      let o = 0;
      for (let l = 0; l < i; l++) {
        const c = this.at(l);
        for (let h = 0; h < r && o < a.length; h++, o++)
          c[h] = a[o];
      }
    },
    get(a) {
      const o = i * r, l = a ?? Sn(t.info.componentType, new ArrayBuffer(o * 4), 0, o);
      let c = 0;
      for (let h = 0; h < i; h++) {
        const d = this.at(h);
        for (let f = 0; f < r; f++, c++)
          l[c] = d[f];
      }
      return l;
    }
  };
}
class Ir {
  layout;
  buffer;
  fieldValues;
  /** 每次修改自增；渲染器据此跳过没必要的上传。 */
  version = 1;
  constructor(e, n) {
    this.layout = e instanceof Vt ? e : Rs(e, n), this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16));
    const r = {};
    for (const i of this.layout.fields) r[i.name] = this.createFieldValue(i);
    this.fieldValues = r;
  }
  createFieldValue(e) {
    if (e.packed)
      return Sn(
        e.info.componentType,
        this.buffer,
        e.byteOffset,
        e.count * e.info.components
      );
    if (e.info.columnStride !== void 0) {
      const n = (e.info.columnSize ?? e.byteSize) / 4;
      return Or(
        e,
        this.buffer,
        e.info.columnStride,
        n,
        e.info.columns ?? 1
      );
    }
    return Or(e, this.buffer, e.byteStride, e.info.components, e.count);
  }
  /** 所有字段写入器。 */
  get fields() {
    return this.fieldValues;
  }
  has(e) {
    return this.layout.has(e);
  }
  /** 取单个字段的写入器。 */
  field(e) {
    return e in this.fieldValues || this.layout.field(e), this.fieldValues[e];
  }
  /** 写一个字段。标量收 `number`，其余收紧凑数组。 */
  set(e, n) {
    const r = this.fieldValues[e];
    if (r === void 0)
      return this.layout.field(e), this;
    if (typeof n == "number") {
      if (!ArrayBuffer.isView(r))
        throw new TypeError(
          `[gpu-device-api] uniform 字段「${e}」不是标量，请传数字数组而不是单个数字。`
        );
      r[0] = n;
    } else ArrayBuffer.isView(r), r.set(n);
    return this.version += 1, this;
  }
  /** 批量写：`u.assign({ time: 1, color: [1, 0, 0, 1] })`。 */
  assign(e) {
    for (const [n, r] of Object.entries(e))
      r !== void 0 && this.set(n, r);
    return this;
  }
  /** 读回字段的紧凑数据。 */
  get(e, n) {
    const r = this.field(e);
    return ArrayBuffer.isView(r) ? r : r.get(n);
  }
  /** 有效字节数的视图（上传时用，避免把尾部对齐填充也传上去）。 */
  get bytes() {
    return new Uint8Array(this.buffer, 0, this.layout.byteLength);
  }
  /** 复制一份紧凑的字节数据。 */
  toArrayBuffer() {
    return this.buffer.slice(0, this.layout.byteLength);
  }
}
const Dr = /* @__PURE__ */ new WeakMap();
function ip(t) {
  const e = Dr.get(t);
  if (e) return e;
  const n = new Proxy(t, {
    get(r, i, s) {
      return typeof i == "string" && r.has(i) ? r.field(i) : Reflect.get(r, i, s);
    },
    has(r, i) {
      return typeof i == "string" && r.has(i) ? !0 : Reflect.has(r, i);
    },
    set(r, i, s, a) {
      return typeof i == "string" && r.has(i) ? (r.set(i, s), !0) : Reflect.set(r, i, s, a);
    }
  });
  return Dr.set(t, n), n;
}
function sp(t, e) {
  const n = t instanceof Vt ? new Ir(t) : new Ir(t, e);
  return ip(n);
}
const un = "/*%uniforms%*/", Vr = "/*%attributes%*/", hn = "/*%textures%*/", ap = {
  alpha: {
    color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
  },
  premultiplied: {
    color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
  },
  additive: {
    color: { srcFactor: "src-alpha", dstFactor: "one", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one", operation: "add" }
  },
  multiply: {
    color: { srcFactor: "dst", dstFactor: "zero", operation: "add" },
    alpha: { srcFactor: "dst-alpha", dstFactor: "zero", operation: "add" }
  },
  screen: {
    color: { srcFactor: "one", dstFactor: "one-minus-src", operation: "add" },
    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
  }
};
function op(t, e, n) {
  const r = e === "cube" ? "samplerCube" : e === "3d" ? "sampler3D" : e === "2d-array" ? "sampler2DArray" : "sampler2D";
  return n ? r === "sampler2D" ? "sampler2DShadow" : r === "samplerCube" ? "samplerCubeShadow" : r === "sampler2DArray" ? "sampler2DArrayShadow" : r : t === "sint" ? `i${r}` : t === "uint" ? `u${r}` : r;
}
function cp(t, e) {
  return t === "depth" ? e === "cube" ? "texture_depth_cube" : e === "2d-array" ? "texture_depth_2d_array" : "texture_depth_2d" : `${e === "cube" ? "texture_cube" : e === "3d" ? "texture_3d" : e === "2d-array" ? "texture_2d_array" : "texture_2d"}<${t === "sint" ? "i32" : t === "uint" ? "u32" : "f32"}>`;
}
function fn(t, e) {
  let n = t;
  const r = [];
  for (const s of e)
    s.text && (n.includes(s.placeholder) ? n = n.split(s.placeholder).join(s.text) : r.push(s.text));
  return `${r.length > 0 ? `${r.join(`

`)}

` : ""}${n.trim()}
`;
}
class Nt {
  name;
  desc;
  /** 属性名 → 格式 / 步进模式，顺序即 shaderLocation。 */
  attributes;
  uniforms;
  textures;
  /** 注入声明后的 GLSL 源码。 */
  glsl;
  /** 注入声明后的 WGSL 模块。 */
  wgsl;
  constructor(e) {
    this.desc = e, this.name = e.name ?? "material";
    const n = Object.entries(e.attributes ?? {});
    if (n.length > 16)
      throw new u(
        `[gpu-device-api] 材质「${this.name}」声明了 ${n.length} 个顶点属性，超过 WebGL2/WebGPU 的 16 个上限。`
      );
    this.attributes = n.map(([f, p], m) => {
      const g = typeof p == "string" ? { format: p, stepMode: "vertex" } : p;
      return { name: f, format: g.format, location: m, stepMode: g.stepMode ?? "vertex" };
    }), e.uniforms instanceof Vt ? this.uniforms = e.uniforms : e.uniforms ? this.uniforms = Rs(e.uniforms) : this.uniforms = null;
    const r = (e.textures ?? []).map(
      (f) => typeof f == "string" ? { name: f } : f
    );
    this.textures = r.map((f, p) => {
      const m = f.binding ?? p * 2;
      return {
        name: f.name,
        sampleType: f.sampleType ?? "float",
        viewDimension: f.viewDimension ?? "2d",
        comparison: f.comparison ?? f.sampleType === "depth",
        binding: m,
        samplerName: `${f.name}_sampler`,
        samplerBinding: m + 1
      };
    });
    const i = this.uniforms ? 1 : 0, s = this.uniforms ? this.uniforms.glslDeclaration() : "", a = this.textures.map(
      (f) => `uniform ${op(f.sampleType, f.viewDimension, f.comparison)} ${f.name};`
    ).join(`
`), o = this.attributes.map((f) => `layout(location = ${f.location}) in ${Js(f.format)} ${f.name};`).join(`
`);
    if (this.glsl = {
      vs: fn(e.glsl.vs, [
        { placeholder: un, text: s },
        { placeholder: Vr, text: o },
        { placeholder: hn, text: a }
      ]),
      fs: fn(e.glsl.fs, [
        { placeholder: un, text: s },
        { placeholder: hn, text: a }
      ])
    }, e.fragmentOutput !== !1) {
      const f = e.fragmentOutput ?? "fragColor";
      new RegExp(
        `\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${f}\\b`
      ).test(this.glsl.fs) || (this.glsl.fs = `layout(location = 0) out vec4 ${f};
${this.glsl.fs}`);
    }
    const l = e.wgsl, c = this.uniforms ? this.uniforms.wgslDeclaration() : "", h = this.textures.map((f) => {
      const p = f.comparison && f.sampleType === "depth" ? "sampler_comparison" : "sampler";
      return `@group(${i}) @binding(${f.binding}) var ${f.name}: ${cp(f.sampleType, f.viewDimension)};
@group(${i}) @binding(${f.samplerBinding}) var ${f.samplerName}: ${p};`;
    }).join(`
`), d = this.attributes.length > 0 ? `struct VertexInput {
${this.attributes.map((f) => `  @location(${f.location}) ${f.name}: ${ea(f.format)},`).join(`
`)}
}` : "";
    this.wgsl = fn(l, [
      { placeholder: un, text: c },
      { placeholder: Vr, text: d },
      { placeholder: hn, text: h }
    ]);
  }
  /** 创建一个材质。 */
  static create(e) {
    return new Nt(e);
  }
  /**
   * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
   * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
   */
  vertexBufferLayouts() {
    return this.attributes.map((e) => ({
      arrayStride: ye(e.format).byteSize,
      stepMode: e.stepMode,
      attributes: [{ shaderLocation: e.location, offset: 0, format: e.format }]
    }));
  }
  /** 创建 core 的 shader module（vs/fs/wgsl 三份源码都在里面）。 */
  createShaderModule(e) {
    return e.createShaderModule({
      label: `${this.name}:shader`,
      code: { vs: this.glsl.vs, fs: this.glsl.fs, wgsl: this.wgsl },
      defines: this.desc.defines
    });
  }
  /** 按需创建 bind group layout（group 0 的 uniform 部分）；没有 uniform 块时返回 `null`。 */
  createUniformBindGroupLayout(e) {
    return this.cachedGroupLayout(e, 0);
  }
  /** 按需创建纹理所在的 bind group layout；材质没有纹理时返回 `null`。 */
  createTextureGroupLayout(e) {
    return this.textures.length === 0 ? null : this.cachedGroupLayout(e, this.textureGroup);
  }
  /**
   * 按 (device, group) 记忆化 bind group layout。
   *
   * 为什么必须缓存：`UniformArena.bindGroup(layout)` 是按 layout **对象身份**判断要不要重建
   * bind group 的 —— 如果每次 draw 都新建一个 layout 对象，缓存永不命中，
   * 于是每帧每个物体都会新建一个 bind group，白白产生大量对象。
   */
  cachedGroupLayout(e, n) {
    let r = this.groupLayoutCache.get(e);
    return r || (r = /* @__PURE__ */ new Map(), this.groupLayoutCache.set(e, r)), r.has(n) || r.set(n, this.createGroupLayout(e, n)), r.get(n) ?? null;
  }
  groupLayoutCache = /* @__PURE__ */ new WeakMap();
  /** 创建 pipeline layout（必要时带上纹理 group）。 */
  createPipelineLayout(e) {
    const n = this.uniforms ? this.cachedGroupLayout(e, 0) : null, r = this.textures.length > 0 ? this.cachedGroupLayout(e, this.textureGroup) : null;
    if (!n && !r) return "auto";
    const i = [];
    return n && i.push(n), r && i.push(r), e.createPipelineLayout({ label: `${this.name}:pipelineLayout`, bindGroupLayouts: i });
  }
  /** 材质声明的纹理所在的 group（有 uniform 块时是 1，否则是 0）。 */
  get textureGroup() {
    return this.uniforms ? 1 : 0;
  }
  /** 生成可以直接交给 `device.createRenderPipeline()` 的描述。 */
  createPipelineDescriptor(e) {
    const n = this.createPipelineLayout(e), r = this.createShaderModule(e), i = this.resolveBlend(), s = i ? [{ blend: i, writeMask: 15 }] : void 0, a = this.vertexBufferLayouts();
    if (a.length === 0)
      throw new u(
        `[gpu-device-api] 材质「${this.name}」没有声明任何顶点属性。两个后端都必须显式知道顶点布局，请至少声明一个 \`attributes\`（例如 \`{ position: 'float32x3' }\`）。`
      );
    const o = {
      label: `${this.name}:pipeline`,
      layout: n,
      vertex: {
        module: r,
        entryPoint: this.desc.vertexEntry ?? "vsMain",
        buffers: a
      },
      fragment: {
        module: r,
        entryPoint: this.desc.fragmentEntry ?? "fsMain",
        ...s ? { targets: s } : {}
      },
      primitive: {
        topology: this.desc.topology ?? "triangle-list",
        cullMode: this.desc.cullMode ?? "back",
        frontFace: this.desc.frontFace ?? "ccw"
      }
    };
    return this.desc.depthTest !== !1 ? o.depthStencil = {
      depthWriteEnabled: this.desc.depthWrite ?? !0,
      depthCompare: this.desc.depthCompare ?? "less"
    } : o.depthStencil = { format: null }, { descriptor: o, layout: n };
  }
  /** 为这个材质的 uniform 布局创建一套数值容器，并写入描述里的初始值。 */
  createUniforms() {
    if (!this.uniforms)
      throw new u(
        `[gpu-device-api] 材质「${this.name}」没有 uniform 布局，无法创建 uniform 数值容器。`
      );
    const e = sp(this.uniforms);
    if (this.desc.defaults)
      for (const [n, r] of Object.entries(this.desc.defaults)) {
        if (!e.has(n))
          throw new u(
            `[gpu-device-api] 材质「${this.name}」的 defaults 里出现了布局中不存在的字段「${n}」。布局字段：${this.uniforms.fields.map((i) => i.name).join("、")}。`
          );
        e.set(n, r);
      }
    return e;
  }
  /** 材质声明的纹理名列表。 */
  get textureNames() {
    return this.textures.map((e) => e.name);
  }
  resolveBlend() {
    const e = this.desc.blend;
    if (e === void 0 || e === "none") return null;
    if (typeof e == "string") {
      const n = ap[e];
      if (!n)
        throw new u(
          `[gpu-device-api] 材质「${this.name}」使用了未知的混合预设「${e}」。可用：none、alpha、premultiplied、additive、multiply、screen。`
        );
      return n;
    }
    return e;
  }
  /** 只为一个 group 生成 layout（内部用）。 */
  createGroupLayout(e, n) {
    const r = [];
    n === 0 && this.uniforms && r.push({
      binding: this.uniforms.binding,
      visibility: 3,
      type: R.Uniform,
      name: this.uniforms.structName,
      buffer: {
        type: "uniform",
        hasDynamicOffset: this.desc.dynamicUniforms !== !1,
        minBindingSize: this.uniforms.byteLength
      }
    });
    const s = this.uniforms ? 1 : 0;
    if (n === s)
      for (const a of this.textures)
        r.push({
          binding: a.binding,
          visibility: 3,
          type: R.Texture,
          name: a.name,
          texture: { sampleType: a.sampleType, viewDimension: a.viewDimension }
        }), r.push({
          binding: a.samplerBinding,
          visibility: 3,
          type: a.comparison && a.sampleType === "depth" ? R.ComparisonSampler : R.Sampler,
          name: a.samplerName,
          sampler: { type: a.comparison ? "comparison" : "filtering" }
        });
    return r.length === 0 ? null : e.createBindGroupLayout({ label: `${this.name}:group${n}`, entries: r });
  }
}
function lp(t) {
  return Nt.create(t);
}
const up = 72;
class hp {
  layout;
  label;
  device;
  align;
  slotSize;
  maxCapacity;
  bufferValue;
  capacityValue;
  head = 0;
  bindGroupValue = null;
  bindGroupLayoutValue = null;
  frameWrites = [];
  _disposed = !1;
  constructor(e, n, r = {}) {
    this.device = e, this.layout = n, this.label = r.label ?? `uniformArena:${n.structName}`, this.align = Math.max(1, e.limits.minUniformBufferOffsetAlignment), this.slotSize = Nr(Math.max(n.byteLength, 16), this.align), this.maxCapacity = r.maxCapacity ?? 16 * 1024 * 1024, this.capacityValue = Math.max(r.initialCapacity ?? 64 * 1024, this.slotSize), this.bufferValue = this.createBuffer(this.capacityValue);
  }
  get buffer() {
    return this.bufferValue;
  }
  get capacity() {
    return this.capacityValue;
  }
  /** 每段占用的字节数（已按对齐值取整）。 */
  get stride() {
    return this.slotSize;
  }
  get disposed() {
    return this._disposed;
  }
  /** 每帧开始前调用：把游标归零。 */
  beginFrame() {
    this.head = 0, this.frameWrites.length = 0;
  }
  /**
   * 分配一段并写入数据，返回供 `setBindGroup(..., [offset])` 使用的动态偏移。
   * 必须在 {@link UniformArena.beginFrame} 之后调用。
   */
  write(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] uniform arena「${this.label}」已释放。`);
    if (e.layout !== this.layout)
      throw new u(
        `[gpu-device-api] uniform arena「${this.label}」的布局是「${this.layout.structName}」，但收到的数值容器布局是「${e.layout.structName}」。两者必须由同一份描述创建。`
      );
    const n = this.allocate(), r = e.bytes;
    return this.device.queue.writeBuffer(this.bufferValue, n, r), this.frameWrites.push({ offset: n, data: r }), n;
  }
  /** 直接写入一段原始字节（高级用法：手写打包数据时）。 */
  writeBytes(e) {
    const n = this.allocate();
    return this.device.queue.writeBuffer(this.bufferValue, n, e), this.frameWrites.push({ offset: n, data: e }), n;
  }
  /**
   * 取得动态偏移用的 bind group。arena 扩容后会失效并按需重建。
   *
   * @param layout 材质创建的 bind group layout（必须与 arena 的布局一致）
   */
  bindGroup(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] uniform arena「${this.label}」已释放。`);
    if (this.bindGroupValue && this.bindGroupLayoutValue === e) return this.bindGroupValue;
    const n = this.device.createBindGroup({
      label: `${this.label}:bindGroup`,
      layout: e,
      entries: [
        {
          binding: this.layout.binding,
          resource: {
            buffer: this.bufferValue,
            offset: 0,
            // 动态偏移时，size 必须是单块的字节数，而不是整个 buffer。
            size: this.layout.byteLength
          }
        }
      ]
    });
    return this.bindGroupValue = n, this.bindGroupLayoutValue = e, n;
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.bindGroupValue?.dispose(), this.bindGroupValue = null, this.bufferValue.destroy());
  }
  allocate() {
    this.head + this.slotSize > this.capacityValue && this.grow();
    const e = this.head;
    return this.head += this.slotSize, e;
  }
  /**
   * 扩容并把本帧已写入的内容重放到新 buffer 上。
   * 这样做而不是「绕回旧区间」：绕回会让同一帧内前后两次 draw 读到彼此的数据，
   * 正是本模块要消除的问题。
   */
  grow() {
    const e = this.head + this.slotSize, n = Math.min(
      Math.max(this.capacityValue * 2, e),
      this.maxCapacity
    );
    if (n < e)
      throw new u(
        `[gpu-device-api] uniform arena「${this.label}」本帧需要的容量超过了上限 ${(this.maxCapacity / 1024 / 1024).toFixed(0)} MiB（需要 ${e} 字节）。
请改用「每个物体一套 UniformValues + 多个 bind group」，或减少同帧的 draw 数量。`
      );
    const r = [...this.frameWrites];
    this.bufferValue.destroy(), this.bindGroupValue?.dispose(), this.bindGroupValue = null, this.bindGroupLayoutValue = null, this.capacityValue = n, this.bufferValue = this.createBuffer(n);
    for (const i of r)
      this.device.queue.writeBuffer(this.bufferValue, i.offset, i.data);
  }
  createBuffer(e) {
    return this.device.createBuffer({
      label: `${this.label}:${e}`,
      size: Nr(e, 4),
      usage: up
    });
  }
}
class fp {
  device;
  arenas = /* @__PURE__ */ new Map();
  options;
  constructor(e, n = {}) {
    this.device = e, this.options = n;
  }
  /** 取得（或创建）某个布局的 arena。 */
  acquire(e) {
    let n = this.arenas.get(e.key);
    return n || (n = new hp(this.device, e, this.options), this.arenas.set(e.key, n)), n;
  }
  beginFrame() {
    for (const e of this.arenas.values()) e.beginFrame();
  }
  get size() {
    return this.arenas.size;
  }
  destroy() {
    for (const e of this.arenas.values()) e.destroy();
    this.arenas.clear();
  }
}
function Nr(t, e) {
  return Math.ceil(t / e) * e;
}
const dp = 40, pp = 24, mp = Object.freeze({
  position: "float32x3",
  normal: "float32x3",
  uv: "float32x2",
  uv1: "float32x2",
  color: "float32x4",
  tangent: "float32x4",
  joints: "uint16x4",
  weights: "float32x4"
});
class zt {
  label;
  topology;
  attributes;
  attributeNames;
  vertexCount;
  indexBuffer;
  indexFormat;
  indexCount;
  /**
   * 按实例步进的属性能提供多少个实例（取各实例属性里最少的那个）；没有实例属性时为 `null`。
   *
   * 它和 `vertexCount` 是两回事：实例属性的元素个数可以比顶点数少（典型情况：
   * 一个盒子的 36 个顶点 + 1000 份实例数据），所以两者分开推断、也分开校验。
   */
  instanceCount;
  _disposed = !1;
  constructor(e) {
    this.label = e.label, this.topology = e.topology, this.attributes = e.attributes, this.attributeNames = [...e.attributes.keys()], this.vertexCount = e.vertexCount, this.instanceCount = e.instanceCount, this.indexBuffer = e.indexBuffer, this.indexFormat = e.indexFormat, this.indexCount = e.indexCount;
  }
  /** 上传几何体数据到 GPU。 */
  static create(e, n) {
    const r = n.label ?? "geometry", i = /* @__PURE__ */ new Map(), s = [
      ["position", n.position],
      ["normal", n.normal],
      ["uv", n.uv],
      ["uv1", n.uv1],
      ["color", n.color],
      ["tangent", n.tangent]
    ];
    for (const [f, p] of s)
      p && i.set(f, { data: p });
    for (const [f, p] of Object.entries(n.attributes ?? {}))
      i.set(f, ArrayBuffer.isView(p) ? { data: p } : p);
    if (i.size === 0)
      throw new u(`[gpu-device-api] 几何体「${r}」至少要有一个顶点属性。`);
    let a = n.vertexCount ?? 0, o = null;
    for (const [f, p] of i) {
      const m = p.format ?? zr(f, p.data), g = Math.floor(p.data.byteLength / ye(m).byteSize);
      p.perInstance ? o = o === null ? g : Math.min(o, g) : g > a && (a = g);
    }
    if (a <= 0)
      throw new u(
        `[gpu-device-api] 几何体「${r}」无法推断顶点数：至少要有一个按顶点步进的属性（实例属性只描述实例，不决定顶点数），并检查属性数据是否为空。`
      );
    const l = /* @__PURE__ */ new Map();
    for (const [f, p] of i) {
      const m = p.format ?? zr(f, p.data), g = ye(m);
      if (p.data.byteLength % g.byteSize !== 0)
        throw new u(
          `[gpu-device-api] 几何体「${r}」的属性「${f}」数据长度 ${p.data.byteLength} 字节不是其格式 ${m}（${g.byteSize} 字节）的整数倍。`
        );
      const b = a * g.byteSize;
      if (!p.perInstance && p.data.byteLength < b)
        throw new u(
          `[gpu-device-api] 几何体「${r}」的属性「${f}」只有 ${p.data.byteLength} 字节，但按顶点数 ${a} 需要 ${b} 字节。所有属性必须提供同样多的顶点（只有 \`perInstance: true\` 的实例属性可以少于顶点数）。`
        );
      const w = e.createBuffer({
        label: `${r}:${f}`,
        // WebGPU 要求 buffer 大小是 4 的倍数，这里统一对齐。
        size: kr(p.data.byteLength, 4),
        usage: dp
      });
      e.queue.writeBuffer(w, 0, p.data), l.set(f, {
        name: f,
        format: m,
        byteStride: g.byteSize,
        components: g.components,
        perInstance: p.perInstance ?? !1,
        buffer: w
      });
    }
    let c = null, h = null, d = 0;
    if (n.indices && n.indices.length > 0) {
      const f = gp(n.indices, a, r);
      h = f instanceof Uint32Array ? "uint32" : "uint16", d = f.length, c = e.createBuffer({
        label: `${r}:indices`,
        size: kr(f.byteLength, 4),
        usage: pp
      }), e.queue.writeBuffer(c, 0, f);
    }
    return new zt({
      label: r,
      topology: n.topology ?? "triangle-list",
      attributes: l,
      vertexCount: a,
      instanceCount: o,
      indexBuffer: c,
      indexFormat: h,
      indexCount: d
    });
  }
  get disposed() {
    return this._disposed;
  }
  /** 实际的绘制顶点/索引数。 */
  get drawCount() {
    return this.indexBuffer ? this.indexCount : this.vertexCount;
  }
  /**
   * 检查几何体是否提供了材质需要的所有属性，格式与步进模式是否匹配。
   *
   * `stepMode` 必须与数据上传时的 `perInstance` 一致：步进模式对不上时，
   * 顶点缓冲会按错误的节奏被读取（画出来是乱码而不是报错），所以这里直接拦下。
   */
  validateAgainst(e, n) {
    for (const r of e) {
      const i = this.attributes.get(r.name);
      if (!i)
        throw new u(
          `[gpu-device-api] 几何体「${this.label}」缺少材质「${n}」需要的属性「${r.name}」。
几何体现有属性：${this.attributeNames.join("、")}。`
        );
      if (i.format !== r.format)
        throw new u(
          `[gpu-device-api] 几何体「${this.label}」的属性「${r.name}」格式是 ${i.format}，但材质「${n}」要求 ${r.format}。`
        );
      const s = (r.stepMode ?? "vertex") === "instance";
      if (i.perInstance !== s)
        throw new u(
          `[gpu-device-api] 几何体「${this.label}」的属性「${r.name}」是${i.perInstance ? "按实例" : "按顶点"}步进的，但材质「${n}」把它声明成了 ${s ? "'instance'" : "'vertex'"} 步进。
两边必须一致：实例化属性要在 Geometry 里写成 \`{ data, format, perInstance: true }\`，并在材质的 attributes 里写成 \`{ format, stepMode: 'instance' }\`。`
        );
    }
  }
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.attributes.values()) e.buffer.destroy();
      this.indexBuffer?.destroy();
    }
  }
}
function zr(t, e) {
  const n = mp[t];
  if (n && e instanceof Float32Array) return n;
  if (e instanceof Float32Array)
    return t === "position" || t === "normal" ? "float32x3" : "float32";
  if (e instanceof Uint32Array) return "uint32";
  if (e instanceof Int32Array) return "sint32";
  throw new u(
    `[gpu-device-api] 无法从 ${e.constructor.name} 推断属性「${t}」的顶点格式：\`uint8\` / \`uint16\` / \`sint8\` / \`sint16\` 只有 x2、x4 两种写法，无法从字节数反推分量个数。
请显式写明分量，例如 \`{ data, format: 'unorm8x4' }\` 或 \`format: 'uint16x2'\`。`
  );
}
function gp(t, e, n) {
  if (t instanceof Uint16Array || t instanceof Uint32Array) return t;
  const r = t;
  let i = 0;
  for (const a of r) {
    if (!Number.isInteger(a) || a < 0)
      throw new u(`[gpu-device-api] 几何体「${n}」的索引里出现了非法值 ${a}。`);
    a > i && (i = a);
  }
  if (i >= e)
    throw new u(
      `[gpu-device-api] 几何体「${n}」的索引最大值 ${i} 超过了顶点数 ${e}。`
    );
  return Qs(e) === "uint32" ? Uint32Array.from(r) : Uint16Array.from(r);
}
function kr(t, e) {
  return Math.ceil(t / e) * e;
}
function sg(t, e) {
  return zt.create(t, e);
}
class Ze {
  label;
  texture;
  view;
  sampler;
  width;
  height;
  format;
  mipLevelCount;
  /** 进程内唯一标识，用于构建 bind group 缓存键。 */
  id;
  _disposed = !1;
  constructor(e) {
    this.label = e.label, this.texture = e.texture, this.view = e.view, this.sampler = e.sampler, this.width = e.width, this.height = e.height, this.format = e.format, this.mipLevelCount = e.mipLevelCount, this.id = G("gfxTexture");
  }
  /** 创建纹理（含可选 mip 链）。 */
  static create(e, n) {
    const r = n.label ?? "texture", i = n.format ?? "rgba8unorm", s = n.flipY ?? An(n.data), a = n.mipmaps ?? (An(n.data) && i === "rgba8unorm");
    if (i !== "rgba8unorm")
      throw new u(
        `[gpu-device-api] 便捷层的纹理目前只支持 rgba8unorm（收到「${i}」）。需要其它格式请直接用 core 的 device.createTexture() + queue.writeTexture()。`
      );
    const o = bp(n.data, n.width, n.height, s), l = a ? wp(o.data, o.width, o.height) : [o], c = {
      label: r,
      size: { width: o.width, height: o.height },
      format: i,
      mipLevelCount: l.length,
      usage: ia(0) | y.CopyDst
    }, h = e.createTexture(c);
    for (let f = 0; f < l.length; f++) {
      const p = l[f];
      e.queue.writeTexture(
        { texture: h, mipLevel: f, origin: { x: 0, y: 0, z: 0 } },
        p.data,
        { offset: 0, bytesPerRow: p.width * 4, rowsPerImage: p.height },
        { width: p.width, height: p.height, depthOrArrayLayers: 1 }
      );
    }
    const d = e.createSampler({
      label: `${r}:sampler`,
      addressModeU: n.wrapS ?? n.wrap ?? "clamp-to-edge",
      addressModeV: n.wrapT ?? n.wrap ?? "clamp-to-edge",
      magFilter: n.magFilter ?? "linear",
      minFilter: n.minFilter ?? "linear",
      mipmapFilter: l.length > 1 ? "linear" : "nearest"
    });
    return new Ze({
      device: e,
      label: r,
      texture: h,
      view: h.createView(),
      sampler: d,
      width: o.width,
      height: o.height,
      format: i,
      mipLevelCount: l.length
    });
  }
  /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
  static solid(e, n) {
    return Ze.create(e, {
      label: "solid",
      data: new Uint8Array([
        Math.round(n[0] * 255),
        Math.round(n[1] * 255),
        Math.round(n[2] * 255),
        Math.round(n[3] * 255)
      ]),
      width: 1,
      height: 1,
      mipmaps: !1
    });
  }
  get disposed() {
    return this._disposed;
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.sampler.dispose(), this.texture.destroy());
  }
}
function An(t) {
  if (!t || typeof t != "object") return !1;
  const e = t.constructor?.name ?? "";
  return e === "ImageBitmap" || e === "HTMLImageElement" || e === "HTMLCanvasElement" || e === "OffscreenCanvas" || e === "ImageData" || e === "VideoFrame" || e === "HTMLVideoElement";
}
function bp(t, e, n, r) {
  if (!An(t)) {
    const d = t, f = new Uint8Array(d.buffer, d.byteOffset, d.byteLength), p = e ?? 0, m = n ?? 0;
    if (p <= 0 || m <= 0)
      throw new u(
        "[gpu-device-api] 用原始像素创建纹理时必须给出 width 与 height（无法从字节数推断）。"
      );
    if (f.byteLength < p * m * 4)
      throw new u(
        `[gpu-device-api] 纹理数据只有 ${f.byteLength} 字节，但 ${p}x${m} 的 RGBA8 需要 ${p * m * 4} 字节。`
      );
    return { data: r ? Wr(f.subarray(0, p * m * 4), p, m) : f.subarray(0, p * m * 4), width: p, height: m };
  }
  if (typeof document > "u" && typeof OffscreenCanvas > "u")
    throw new u(
      "[gpu-device-api] 当前环境没有 canvas，无法解码图片来源；请改用原始像素（并给出 width/height）。"
    );
  const i = t, s = e ?? i.naturalWidth ?? i.videoWidth ?? i.width ?? 0, a = n ?? t.naturalHeight ?? t.videoHeight ?? t.height ?? 0;
  if (s <= 0 || a <= 0)
    throw new u(
      "[gpu-device-api] 图像来源还没有尺寸（图片可能尚未加载完成）。请等 load 事件之后再创建纹理。"
    );
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(s, a) : document.createElement("canvas");
  o.width = s, o.height = a;
  const l = o.getContext("2d");
  if (!l)
    throw new u("[gpu-device-api] 无法取得 2D context，图片解码失败。");
  l.drawImage(t, 0, 0, s, a);
  const c = l.getImageData(0, 0, s, a), h = new Uint8Array(c.data.buffer.slice(0));
  return { data: r ? Wr(h, s, a) : h, width: s, height: a };
}
function Wr(t, e, n) {
  const r = e * 4, i = new Uint8Array(t.byteLength);
  for (let s = 0; s < n; s++) {
    const a = s * r, o = (n - 1 - s) * r;
    i.set(t.subarray(a, a + r), o);
  }
  return i;
}
function wp(t, e, n) {
  const r = [{ data: t, width: e, height: n }];
  let i = t, s = e, a = n;
  for (; s > 1 || a > 1; ) {
    const o = Math.max(1, s >> 1), l = Math.max(1, a >> 1), c = new Uint8Array(o * l * 4);
    for (let h = 0; h < l; h++) {
      const d = Math.min(h * 2, a - 1), f = Math.min(h * 2 + 1, a - 1);
      for (let p = 0; p < o; p++) {
        const m = Math.min(p * 2, s - 1), g = Math.min(p * 2 + 1, s - 1), b = (d * s + m) * 4, w = (d * s + g) * 4, $ = (f * s + m) * 4, S = (f * s + g) * 4, A = (h * o + p) * 4;
        for (let _ = 0; _ < 4; _++)
          c[A + _] = i[b + _] + i[w + _] + i[$ + _] + i[S + _] >> 2;
      }
    }
    r.push({ data: c, width: o, height: l }), i = c, s = o, a = l;
  }
  return r;
}
class Gs {
  backend;
  device;
  context;
  canvas;
  logger;
  camera;
  arenaPool;
  materials = /* @__PURE__ */ new Map();
  geometries = /* @__PURE__ */ new Set();
  textures = /* @__PURE__ */ new Set();
  bindGroups = /* @__PURE__ */ new Map();
  statsValue = {
    drawCalls: 0,
    triangles: 0,
    instances: 0,
    pipelineSwitches: 0,
    frameTime: 0
  };
  _clearColor;
  _pixelRatio;
  _width;
  _height;
  _inFrame = !1;
  encoder = null;
  pass = null;
  commandBuffers = [];
  currentMaterial = null;
  /** 上一次 draw 用的管线，用来统计真正的「管线切换」次数（每个通道开头清空）。 */
  currentPipeline = null;
  defaultTexture = null;
  frameStart = 0;
  /** 计算法线矩阵时复用的暂存区，避免每帧分配。 */
  normalMatrixScratch = gi();
  _disposed = !1;
  constructor(e) {
    this.backend = e.backend, this.device = e.device, this.context = e.context, this.canvas = e.canvas, this.logger = e.logger, this.camera = e.options.camera ?? null, this._clearColor = e.options.clearColor ?? "#0b0e13", this._pixelRatio = e.options.pixelRatio ?? e.context.pixelRatio, this._width = e.context.width, this._height = e.context.height, this.arenaPool = new fp(e.device);
  }
  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(e) {
    const n = e.logger ?? Ke("gpu-device-api/gfx"), r = await Bs({
      canvas: e.canvas,
      backend: e.backend ?? "auto",
      label: "gfx-renderer",
      contextAttributes: {
        antialias: e.antialias ?? !0,
        alpha: e.alpha ?? !1,
        depth: e.depth ?? !0,
        stencil: !1,
        premultipliedAlpha: !0,
        preserveDrawingBuffer: !1,
        powerPreference: e.powerPreference ?? "high-performance"
      }
    });
    if (!r.context)
      throw new u("[gpu-device-api] 创建 Renderer 必须提供 canvas。");
    const i = new Gs({
      backend: r.backend,
      device: r.device,
      context: r.context,
      canvas: e.canvas,
      logger: n,
      options: e
    });
    return e.pixelRatio && i.setPixelRatio(e.pixelRatio), i.resize(), i;
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
  setClearColor(e) {
    this._clearColor = e;
  }
  setPixelRatio(e) {
    this._pixelRatio = e, this.context.setPixelRatio(e), this.context.resize(), this.syncSize();
  }
  /** 按 CSS 尺寸重新设置后备缓冲大小。 */
  setSize(e, n, r = !0) {
    this.context.setSize(e, n, r), this.syncSize();
  }
  /** 重新读取 canvas 尺寸；返回是否发生变化。 */
  resize() {
    const e = this.context.resize();
    return this.syncSize(), e;
  }
  syncSize() {
    this._width = this.context.width, this._height = this.context.height;
  }
  /* ------------------------------------------------------------------ 相机 ------------------- */
  setCamera(e) {
    this.camera = e;
  }
  /* ------------------------------------------------------------------ 资源 ------------------- */
  createGeometry(e) {
    const n = zt.create(this.device, e);
    return this.geometries.add(n), n;
  }
  /** 创建（或直接登记）一个材质。 */
  createMaterial(e) {
    const n = e instanceof Nt ? e : lp(e);
    return this.materials.has(n) || this.materials.set(n, {
      material: n,
      layout: n.createPipelineLayout(this.device),
      pipeline: null,
      values: n.uniforms ? n.createUniforms() : null
    }), n;
  }
  createTexture(e) {
    const n = Ze.create(this.device, e);
    return this.textures.add(n), n;
  }
  /** 当前设置的材质（`draw()` 未显式指定时使用）。 */
  setMaterial(e) {
    this.currentMaterial = e, e && this.createMaterial(e);
  }
  get material() {
    return this.currentMaterial;
  }
  get stats() {
    return this.statsValue;
  }
  /* ------------------------------------------------------------------ 帧 --------------------- */
  beginFrame(e = {}) {
    this._inFrame && this.endFrame(), this.frameStart = typeof performance < "u" ? performance.now() : Date.now(), this.resize(), this.arenaPool.beginFrame(), this.encoder = this.device.createCommandEncoder({ label: "gfx-frame" });
    const n = e.color ?? this._clearColor;
    let r, i = null;
    if (e.target) {
      const s = e.target.createPassDescriptor({
        loadOp: e.load ? "load" : "clear",
        storeOp: "store",
        clearValue: n,
        depthLoadOp: e.load ? "load" : "clear",
        depthClearValue: e.depth ?? 1
      });
      r = s.colorAttachments[0]?.view, i = s.depthStencilAttachment;
    } else
      r = this.context.getCurrentFrameTarget().view;
    if (!r)
      throw new u("[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。");
    this.pass = this.encoder.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: [
        {
          view: r,
          loadOp: e.load ? "load" : "clear",
          storeOp: "store",
          clearValue: n
        }
      ],
      ...i ? { depthStencilAttachment: i } : {}
    }), this.commandBuffers = [], this.statsValue.drawCalls = 0, this.statsValue.triangles = 0, this.statsValue.instances = 0, this.statsValue.pipelineSwitches = 0, this.currentPipeline = null, this._inFrame = !0;
  }
  endFrame() {
    if (!this._inFrame) return;
    this.pass?.end(), this.encoder && this.commandBuffers.push(this.encoder.finish()), this.commandBuffers.length > 0 && this.device.queue.submit(this.commandBuffers);
    const e = typeof performance < "u" ? performance.now() : Date.now();
    this.statsValue.frameTime = e - this.frameStart, this.pass = null, this.encoder = null, this.commandBuffers = [], this._inFrame = !1;
  }
  get inFrame() {
    return this._inFrame;
  }
  /* ------------------------------------------------------------------ 绘制 ------------------- */
  /**
   * 在上一帧的基础上再开一个通道（画到另一个目标、或做后处理）。
   * 必须在 `beginFrame()` 之后调用。
   */
  beginPass(e = {}) {
    if (!this._inFrame)
      throw new u("[gpu-device-api] beginPass() 只能在 beginFrame() 之后调用。");
    this.pass?.end();
    const n = this.encoder;
    let r, i = null;
    if (e.target) {
      const s = e.target.createPassDescriptor({
        loadOp: e.load ? "load" : "clear",
        storeOp: "store",
        clearValue: e.color ?? this._clearColor,
        depthLoadOp: e.load ? "load" : "clear",
        depthClearValue: e.depth ?? 1
      });
      r = s.colorAttachments[0]?.view, i = s.depthStencilAttachment;
    } else
      r = this.context.getCurrentFrameTarget().view;
    if (!r)
      throw new u("[gpu-device-api] 当前通道没有颜色附件。");
    this.pass = n.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: [
        {
          view: r,
          loadOp: e.load ? "load" : "clear",
          storeOp: "store",
          clearValue: e.color ?? this._clearColor
        }
      ],
      ...i ? { depthStencilAttachment: i } : {}
    }), this.currentPipeline = null;
  }
  /** 绘制一个几何体。 */
  draw(e, n = {}) {
    if (!this._inFrame || !this.pass)
      throw new u(
        "[gpu-device-api] draw() 必须在 beginFrame() ... endFrame() 之间调用。"
      );
    const r = n.material ?? this.currentMaterial;
    if (!r)
      throw new u(
        "[gpu-device-api] draw() 之前必须先 setMaterial()，或在 draw() 里传 material。"
      );
    const i = this.materials.get(r) ?? (this.createMaterial(r), this.materials.get(r));
    e.validateAgainst(r.attributes, r.name), this.assertInstanceCount(e, n.instances);
    const s = this.acquirePipeline(i);
    if (this.pass.setPipeline(s), this.currentPipeline !== s && (this.currentPipeline = s, this.statsValue.pipelineSwitches += 1), r.uniforms && i.values) {
      if (this.applyCameraUniforms(i.values, r), n.model && this.setIfPresent(i.values, "model", n.model), this.updateNormalMatrix(i.values, r), n.uniforms)
        for (const [o, l] of Object.entries(n.uniforms))
          this.setIfPresent(i.values, o, l);
      const a = r.createUniformBindGroupLayout(this.device);
      if (a) {
        const o = this.arenaPool.acquire(r.uniforms), l = o.write(i.values);
        this.pass.setBindGroup(r.uniforms.group, o.bindGroup(a), [l]);
      }
    }
    if (r.textures.length > 0) {
      const a = this.acquireTextureBindGroup(r, n.textures ?? {});
      a && this.pass.setBindGroup(r.textureGroup, a);
    }
    for (const a of r.attributes) {
      const o = e.attributes.get(a.name);
      this.pass.setVertexBuffer(a.location, o.buffer, 0, o.buffer.size);
    }
    e.indexBuffer && e.indexFormat ? (this.pass.setIndexBuffer(e.indexBuffer, e.indexFormat, 0, e.indexBuffer.size), this.pass.drawIndexed({
      indexCount: n.count ?? e.indexCount,
      ...n.first !== void 0 ? { firstIndex: n.first } : {},
      ...n.instances !== void 0 ? { instanceCount: n.instances } : {}
    })) : this.pass.draw({
      vertexCount: n.count ?? e.vertexCount,
      ...n.first !== void 0 ? { firstVertex: n.first } : {},
      ...n.instances !== void 0 ? { instanceCount: n.instances } : {}
    }), this.statsValue.drawCalls += 1, this.statsValue.instances += n.instances ?? 1, this.statsValue.triangles += xp(e, n) * (n.instances ?? 1);
  }
  /** 一次画多个实例（需要材质配合 `perInstance` 属性）。 */
  drawInstanced(e, n, r = {}) {
    this.draw(e, { ...r, instances: n });
  }
  /**
   * 实例数与几何体提供的实例数据是否匹配。
   *
   * 实例属性的元素个数就是「最多能画多少个实例」：要多了，WebGL2 会静默地读到缓冲区之外的数据
   *（画面出错但不报错），WebGPU 会在 draw 时报校验错误 —— 两种都不好定位，所以这里提前拦下。
   */
  assertInstanceCount(e, n) {
    if (n === void 0) return;
    if (!Number.isInteger(n) || n < 1)
      throw new u(
        `[gpu-device-api] draw() 的 instances 必须是正整数，实际是 ${String(n)}。`
      );
    const r = e.instanceCount;
    if (r !== null && n > r)
      throw new u(
        `[gpu-device-api] 几何体「${e.label}」只提供了 ${r} 份实例数据，但要画 ${n} 个实例。请把实例属性（perInstance: true）的数据补足到 ${n} 份。`
      );
  }
  destroy() {
    if (!this._disposed) {
      this._disposed = !0, this._inFrame && this.endFrame();
      for (const e of this.materials.values())
        e.pipeline?.dispose(), e.values = null;
      this.materials.clear();
      for (const e of this.bindGroups.values()) e.dispose();
      this.bindGroups.clear();
      for (const e of this.geometries) e.destroy();
      this.geometries.clear();
      for (const e of this.textures) e.destroy();
      this.textures.clear(), this.defaultTexture?.destroy(), this.defaultTexture = null, this.arenaPool.destroy(), this.context.dispose(), this.device.dispose();
    }
  }
  get disposed() {
    return this._disposed;
  }
  /* ------------------------------------------------------------------ 内部 ------------------- */
  acquirePipeline(e) {
    if (e.pipeline) return e.pipeline;
    const { descriptor: n } = e.material.createPipelineDescriptor(this.device);
    return e.pipeline = this.device.createRenderPipeline(n), e.pipeline;
  }
  /** 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。 */
  applyCameraUniforms(e, n) {
    const r = this.camera;
    r && (r.aspect = this.aspect, r.depthRange = this.backend === "webgpu" ? "zo" : "gl", r.update(), n.uniforms?.has("projectionView") && e.set("projectionView", r.projectionViewMatrix), n.uniforms?.has("projection") && e.set("projection", r.projectionMatrix), n.uniforms?.has("view") && e.set("view", r.viewMatrix), n.uniforms?.has("cameraPosition") && e.set("cameraPosition", r.position), n.uniforms?.has("model") && e.set("model", ne()));
  }
  /**
   * 由当前 `model` 计算法线矩阵。
   *
   * 非等比缩放会破坏法线方向（法线不再垂直于表面），必须用「模型矩阵左上 3x3 的逆转置」。
   * 这里自动算好，材质只要声明了 `normalMatrix` 字段就能直接用。
   */
  updateNormalMatrix(e, n) {
    if (!n.uniforms?.has("normalMatrix") || !n.uniforms.has("model")) return;
    const r = e.get("model");
    Fn(this.normalMatrixScratch, r) || bi(this.normalMatrixScratch), e.set("normalMatrix", this.normalMatrixScratch);
  }
  setIfPresent(e, n, r) {
    e.has(n) && e.set(n, r);
  }
  /**
   * 取得（必要时创建）纹理的 bind group。
   *
   * 缓存键由「材质 + 每个槽位实际用的纹理 id」组成：同一个材质换纹理时才会重建，
   * 反复用同一组纹理绘制不会重复创建。没给纹理的槽位绑一张 1×1 的白色占位纹理，
   * 这样「忘了传纹理」的表现是白色而不是未定义数据。
   */
  acquireTextureBindGroup(e, n) {
    const r = e.createTextureGroupLayout(this.device);
    if (!r) return null;
    const i = e.textures.map((c) => n[c.name] ?? this.getDefaultTexture()), s = `${e.name}|${i.map((c) => c.id).join(",")}`, a = this.bindGroups.get(s);
    if (a) return a;
    const o = e.textures.flatMap((c, h) => {
      const d = i[h];
      return [
        { binding: c.binding, resource: { view: d.view } },
        { binding: c.samplerBinding, resource: { sampler: d.sampler } }
      ];
    }), l = this.device.createBindGroup({
      label: `${e.name}:textures`,
      layout: r,
      entries: o
    });
    return this.bindGroups.set(s, l), l;
  }
  /** 缺省纹理（材质声明了纹理但调用方没给时用，避免绑到未定义数据）。 */
  getDefaultTexture() {
    return this.defaultTexture || (this.defaultTexture = Ze.create(this.device, {
      label: "default-white",
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      mipmaps: !1
    })), this.defaultTexture;
  }
}
function xp(t, e) {
  const n = e.count ?? t.drawCount;
  switch (t.topology) {
    case "triangle-list":
      return Math.floor(n / 3);
    case "triangle-strip":
      return Math.max(0, n - 2);
    case "line-list":
      return 0;
    case "line-strip":
      return 0;
    case "point-list":
      return 0;
    default:
      return 0;
  }
}
const vp = 1e-6, jr = F(), qr = F();
function Ie(t, e, n, r, i) {
  if (e === void 0) return de(t, n, r, i);
  if (e.length < 3)
    throw new RangeError("[gpu-device-api] A vector option needs at least 3 components.");
  const s = e[0], a = e[1], o = e[2];
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(o))
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${s}, ${a}, ${o}).`);
  return de(t, s, a, o);
}
function Us(t) {
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function yp(t, e, n) {
  if (!(t > 0) || t >= 180)
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${t}.`);
  if (!(e > 0))
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${e}.`);
  if (Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${n}.`);
}
function $p(t, e, n) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${t}.`);
  if (!Number.isFinite(e) || Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${e}, far = ${n}.`);
}
function Os(t) {
  if (oe(jr, t.position, t.target), Ge(jr) < vp) {
    de(qr, t.target[0], t.target[1], t.target[2] + 1), bn(t.viewMatrix, qr, t.target, t.up);
    return;
  }
  bn(t.viewMatrix, t.position, t.target, t.up);
}
class ag {
  /** 相机位置（世界空间）。 */
  position;
  /** 视线落点（世界空间）。 */
  target;
  /** 上方向。 */
  up;
  /** 垂直视场角，角度制。 */
  fov;
  /** 近裁剪面距离。 */
  near;
  /** 远裁剪面距离。 */
  far;
  /** 宽高比 `width / height`。 */
  aspect;
  /** 使用哪一套深度范围约定，决定 `projectionMatrix` 指向两份矩阵中的哪一份。 */
  depthRange;
  viewMatrix = ne();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  projectionMatrixGL = ne();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  projectionMatrixZO = ne();
  projectionViewMatrix = ne();
  constructor(e = {}) {
    this.position = Ie(F(), e.position, 0, 0, 5), this.target = Ie(F(), e.target, 0, 0, 0), this.up = Ie(F(), e.up, 0, 1, 0), this.fov = e.fov ?? 60, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 按 `depthRange` 选出的那一套投影矩阵。
   * 返回的就是 {@link projectionMatrixGL} 或 {@link projectionMatrixZO} 本身（同一个对象），
   * 因此可以直接上传到 uniform buffer，不需要每帧拷贝。
   */
  get projectionMatrix() {
    return this.depthRange === "zo" ? this.projectionMatrixZO : this.projectionMatrixGL;
  }
  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update() {
    yp(this.fov, this.near, this.far), Os(this);
    const e = ts(this.fov), n = Us(this.aspect);
    Ei(this.projectionMatrixGL, e, n, this.near, this.far), Li(this.projectionMatrixZO, e, n, this.near, this.far), Q(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
class og {
  /** 相机位置（世界空间）。 */
  position;
  /** 视线落点（世界空间）。 */
  target;
  /** 上方向。 */
  up;
  /** 视口在垂直方向覆盖的世界高度。 */
  size;
  /** 近裁剪面距离。 */
  near;
  /** 远裁剪面距离。 */
  far;
  /** 宽高比 `width / height`。 */
  aspect;
  /** 使用哪一套深度范围约定，决定 `projectionMatrix` 指向两份矩阵中的哪一份。 */
  depthRange;
  viewMatrix = ne();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  projectionMatrixGL = ne();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  projectionMatrixZO = ne();
  projectionViewMatrix = ne();
  constructor(e = {}) {
    this.position = Ie(F(), e.position, 0, 0, 5), this.target = Ie(F(), e.target, 0, 0, 0), this.up = Ie(F(), e.up, 0, 1, 0), this.size = e.size ?? 2, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 按 `depthRange` 选出的那一套投影矩阵，返回的是另外两份矩阵之一本身（同一个对象）。
   */
  get projectionMatrix() {
    return this.depthRange === "zo" ? this.projectionMatrixZO : this.projectionMatrixGL;
  }
  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update() {
    $p(this.size, this.near, this.far), Os(this);
    const e = this.size / 2, n = e * Us(this.aspect);
    Pi(this.projectionMatrixGL, -n, n, -e, e, this.near, this.far), Mi(this.projectionMatrixZO, -n, n, -e, e, this.near, this.far), Q(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
const Xr = 1e-4, he = 1e-6, Tp = 0.95, H = F(), Yr = F(), Hr = F();
function be(t, e) {
  if (!Number.isFinite(t))
    throw new RangeError(`[gpu-device-api] ${e} must be a finite number, got ${t}.`);
  return t;
}
class cg {
  /** 是否响应输入；置为 false 时正在进行的拖拽会停止生效，但状态仍会正常清理。 */
  enabled;
  enableRotate;
  enableZoom;
  enablePan;
  /** 是否启用阻尼。开启时输入不会立刻全部生效，而是每帧消耗 `dampingFactor` 的比例。 */
  enableDamping;
  /** 每帧消耗的阻尼比例，0 表示不动、1 表示没有阻尼。 */
  dampingFactor;
  rotateSpeed;
  zoomSpeed;
  panSpeed;
  minDistance;
  maxDistance;
  /** 极角下限，内部会再夹到 [POLAR_EPSILON, PI - POLAR_EPSILON]。 */
  minPolarAngle;
  /** 极角上限，内部会再夹到 [POLAR_EPSILON, PI - POLAR_EPSILON]。 */
  maxPolarAngle;
  camera;
  /** 统一存成 HTMLElement（HTMLCanvasElement 也是它的子类），这样事件重载能正常解析。 */
  element;
  /** 当前球坐标（每帧从相机位置重新推导，保证外部直接改 position 也有效）。 */
  theta = 0;
  phi = Math.PI / 2;
  /** 本帧待消耗的旋转增量。 */
  deltaTheta = 0;
  deltaPhi = 0;
  /** 本帧待消耗的缩放比例（乘在 radius 上，小于 1 表示拉近）。 */
  scale = 1;
  /** 本帧待消耗的平移增量（世界空间）。 */
  panOffset = F();
  /** `reset()` 要恢复到的初始状态。 */
  initialPosition = F();
  initialTarget = F();
  previousPosition = F();
  previousTarget = F();
  pointers = /* @__PURE__ */ new Map();
  mode = "none";
  /** 双指捏合时，上一次两指之间的距离。 */
  pinchDistance = 0;
  disposed = !1;
  constructor(e, n, r = {}) {
    if (!n || typeof n.addEventListener != "function" || typeof n.removeEventListener != "function")
      throw new TypeError("[gpu-device-api] OrbitControls requires a DOM element with addEventListener/removeEventListener.");
    if (!e || !e.position || !e.target || typeof e.update != "function")
      throw new TypeError("[gpu-device-api] OrbitControls requires a PerspectiveCamera instance.");
    if (this.camera = e, this.element = n, this.enabled = r.enabled ?? !0, this.enableRotate = r.enableRotate ?? !0, this.enableZoom = r.enableZoom ?? !0, this.enablePan = r.enablePan ?? !0, this.enableDamping = r.enableDamping ?? !0, this.dampingFactor = Re(r.dampingFactor ?? 0.08, 0, 1), this.rotateSpeed = be(r.rotateSpeed ?? 1, "options.rotateSpeed"), this.zoomSpeed = be(r.zoomSpeed ?? 1, "options.zoomSpeed"), this.panSpeed = be(r.panSpeed ?? 1, "options.panSpeed"), this.minDistance = be(r.minDistance ?? 0.1, "options.minDistance"), this.maxDistance = be(r.maxDistance ?? 1e3, "options.maxDistance"), this.minPolarAngle = be(r.minPolarAngle ?? 0, "options.minPolarAngle"), this.maxPolarAngle = be(r.maxPolarAngle ?? Math.PI, "options.maxPolarAngle"), this.minDistance <= 0)
      throw new RangeError(`[gpu-device-api] minDistance must be positive, got ${this.minDistance}.`);
    if (this.maxDistance < this.minDistance)
      throw new RangeError(`[gpu-device-api] maxDistance must not be smaller than minDistance, got ${this.maxDistance}.`);
    if (this.minPolarAngle < 0 || this.maxPolarAngle > Math.PI || this.minPolarAngle > this.maxPolarAngle)
      throw new RangeError(
        `[gpu-device-api] polar angles must satisfy 0 <= minPolarAngle <= maxPolarAngle <= PI, got ${this.minPolarAngle} and ${this.maxPolarAngle}.`
      );
    if (this.rotateSpeed < 0 || this.zoomSpeed < 0 || this.panSpeed < 0)
      throw new RangeError("[gpu-device-api] Speed options must be non-negative.");
    se(this.initialPosition, e.position), se(this.initialTarget, e.target), se(this.previousPosition, e.position), se(this.previousTarget, e.target), this.readSpherical(), this.element.addEventListener("pointerdown", this.onPointerDown), this.element.addEventListener("pointermove", this.onPointerMove), this.element.addEventListener("pointerup", this.onPointerUp), this.element.addEventListener("pointercancel", this.onPointerUp), this.element.addEventListener("wheel", this.onWheel, { passive: !1 }), this.element.addEventListener("contextmenu", this.onContextMenu);
  }
  /** 是否已经释放。 */
  get isDisposed() {
    return this.disposed;
  }
  /**
   * 每帧调用一次：消化累积的输入并写回相机。
   *
   * @returns 相机的位置或 target 是否发生了变化（false 表示本帧不需要重绘）。
   */
  update() {
    if (this.disposed) return !1;
    const e = this.camera, n = e.target, r = e.position;
    se(this.previousPosition, r), se(this.previousTarget, n), oe(H, r, n);
    let i = Ge(H);
    i < he ? i = this.minDistance : (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(Re(H[1] / i, -1, 1)));
    const s = Math.abs(this.deltaTheta) > he || Math.abs(this.deltaPhi) > he, a = Math.abs(this.scale - 1) > he, o = Ge(this.panOffset) > he;
    if (!s && !a && !o)
      return !1;
    const l = this.enableDamping ? this.dampingFactor : 1;
    this.theta += this.deltaTheta * l, this.phi += this.deltaPhi * l, this.phi = Re(
      this.phi,
      Math.max(this.minPolarAngle, Xr),
      Math.min(this.maxPolarAngle, Math.PI - Xr)
    ), i = Re(i * this.scale, this.minDistance, this.maxDistance), xt(n, n, this.panOffset, l);
    const c = Math.sin(this.phi) * i;
    de(
      r,
      n[0] + c * Math.sin(this.theta),
      n[1] + Math.cos(this.phi) * i,
      n[2] + c * Math.cos(this.theta)
    ), this.enableDamping ? (this.deltaTheta *= 1 - this.dampingFactor, this.deltaPhi *= 1 - this.dampingFactor, Tt(this.panOffset, this.panOffset, 1 - this.dampingFactor)) : (this.deltaTheta = 0, this.deltaPhi = 0, mn(this.panOffset)), this.scale = 1, e.update();
    const h = !gn(r, this.previousPosition, he), d = !gn(n, this.previousTarget, he);
    return h || d;
  }
  /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
  reset() {
    this.disposed || (se(this.camera.position, this.initialPosition), se(this.camera.target, this.initialTarget), this.deltaTheta = 0, this.deltaPhi = 0, this.scale = 1, mn(this.panOffset), this.mode = "none", this.pinchDistance = 0, this.pointers.clear(), this.readSpherical(), this.camera.update());
  }
  /** 移除全部事件监听。可重复调用，第二次开始是空操作。 */
  dispose() {
    if (this.disposed) return;
    this.disposed = !0;
    const e = this.element;
    e.removeEventListener("pointerdown", this.onPointerDown), e.removeEventListener("pointermove", this.onPointerMove), e.removeEventListener("pointerup", this.onPointerUp), e.removeEventListener("pointercancel", this.onPointerUp), e.removeEventListener("wheel", this.onWheel), e.removeEventListener("contextmenu", this.onContextMenu), this.pointers.clear(), this.mode = "none", this.pinchDistance = 0;
  }
  /** 从相机当前位置反推 theta / phi；两者重合时保持原值。 */
  readSpherical() {
    oe(H, this.camera.position, this.camera.target);
    const e = Ge(H);
    e < he || (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(Re(H[1] / e, -1, 1)));
  }
  /** 元素的可视高度；取不到（例如无布局的测试替身）时退回 1，避免除零。 */
  clientHeight() {
    const e = this.element.clientHeight;
    return Number.isFinite(e) && e > 0 ? e : 1;
  }
  /** 当前两指之间的距离。 */
  currentPinchDistance() {
    const e = [...this.pointers.values()], n = e[0], r = e[1];
    return n === void 0 || r === void 0 ? 0 : Math.hypot(n.x - r.x, n.y - r.y);
  }
  /** 所有活动指针是否都是触摸。 */
  allPointersAreTouch() {
    for (const e of this.pointers.values())
      if (e.type !== "touch") return !1;
    return !0;
  }
  /** 旋转：把屏幕像素位移换算成 theta / phi 增量。 */
  rotateBy(e, n) {
    const r = 2 * Math.PI * this.rotateSpeed / this.clientHeight();
    this.deltaTheta -= e * r, this.deltaPhi -= n * r;
  }
  /**
   * 平移：沿**相机自身**的 right / up 轴移动。
   *
   * view 矩阵的第 0 / 1 行就是相机在世界空间的 right / up 轴；矩阵是列主序存储的，
   * 所以这两行分别是 (m[0], m[4], m[8]) 与 (m[1], m[5], m[9])。
   */
  panBy(e, n) {
    const r = this.camera, i = r.viewMatrix, s = this.clientHeight();
    oe(H, r.position, r.target);
    const o = 2 * (Ge(H) * Math.tan(ts(r.fov) / 2)) * this.panSpeed / s;
    de(Yr, i[0], i[4], i[8]), de(Hr, i[1], i[5], i[9]), xt(this.panOffset, this.panOffset, Yr, -e * o), xt(this.panOffset, this.panOffset, Hr, n * o);
  }
  onPointerDown = (e) => {
    if (!this.enabled) return;
    const n = this.element;
    typeof n.setPointerCapture == "function" && n.setPointerCapture(e.pointerId), this.pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
      button: e.button
    }), this.pointers.size === 1 ? (this.mode = e.pointerType === "touch" || e.button === 0 ? "rotate" : "pan", this.pinchDistance = 0) : this.pointers.size === 2 && this.allPointersAreTouch() && (this.mode = "pinch", this.pinchDistance = this.currentPinchDistance()), e.cancelable && e.preventDefault();
  };
  onPointerMove = (e) => {
    if (!this.enabled) return;
    const n = this.pointers.get(e.pointerId);
    if (n === void 0) return;
    const r = e.clientX - n.x, i = e.clientY - n.y;
    if (n.x = e.clientX, n.y = e.clientY, this.mode === "pinch" && this.pointers.size >= 2) {
      if (!this.enableZoom) return;
      const s = this.currentPinchDistance();
      s > 0 && this.pinchDistance > 0 && (this.scale *= this.pinchDistance / s), this.pinchDistance = s;
      return;
    }
    r === 0 && i === 0 || (this.mode === "rotate" && this.enableRotate ? this.rotateBy(r, i) : this.mode === "pan" && this.enablePan && this.panBy(r, i));
  };
  onPointerUp = (e) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    const n = this.element;
    if (typeof n.hasPointerCapture == "function" && typeof n.releasePointerCapture == "function" && n.hasPointerCapture(e.pointerId) && n.releasePointerCapture(e.pointerId), this.pointers.size === 1) {
      for (const r of this.pointers.values()) {
        this.mode = r.type === "touch" || r.button === 0 ? "rotate" : "pan";
        break;
      }
      this.pinchDistance = 0;
    } else this.pointers.size === 0 && (this.mode = "none", this.pinchDistance = 0);
  };
  onWheel = (e) => {
    if (!this.enabled || !this.enableZoom) return;
    e.cancelable && e.preventDefault();
    const n = Math.pow(Tp, this.zoomSpeed);
    e.deltaY < 0 ? this.scale *= n : e.deltaY > 0 && (this.scale /= n);
  };
  onContextMenu = (e) => {
    !this.enabled || !this.enablePan || e.cancelable && e.preventDefault();
  };
}
const Fe = F();
function Ve() {
  return { position: [], normal: [], uv: [], index: [] };
}
function Is() {
  return { position: [], color: [] };
}
function pe(t, e, n, r, i, s, a, o, l) {
  de(Fe, i, s, a), Mn(Fe, Fe), t.position.push(e, n, r), t.normal.push(Fe[0], Fe[1], Fe[2]), t.uv.push(o, l);
}
function C(t, e, n, r, i, s, a, o) {
  t.position.push(e, n, r), t.color.push(i, s, a, o);
}
function Ne(t) {
  return {
    position: Float32Array.from(t.position),
    normal: Float32Array.from(t.normal),
    uv: Float32Array.from(t.uv),
    indices: Uint32Array.from(t.index)
  };
}
function Ds(t) {
  return {
    position: Float32Array.from(t.position),
    color: Float32Array.from(t.color)
  };
}
function Vs(t) {
  return t.position.length / 3;
}
function q(t, e) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite positive number, got ${t}.`);
  return t;
}
function Zr(t, e) {
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite non-negative number, got ${t}.`);
  return t;
}
function Z(t, e, n) {
  if (!Number.isInteger(t) || t < e)
    throw new RangeError(`[gpu-device-api] ${n} must be an integer greater than or equal to ${e}, got ${t}.`);
  return t;
}
const Sp = [0.5, 0.5, 0.5, 1];
function Ap(t = {}) {
  const e = q(t.radius ?? 0.5, "options.radius"), n = Ve();
  for (let r = 0; r < 3; r++) {
    const i = Math.PI / 2 + r * 2 * Math.PI / 3, s = Math.cos(i) * e, a = Math.sin(i) * e;
    pe(n, s, a, 0, 0, 0, 1, s / (2 * e) + 0.5, a / (2 * e) + 0.5);
  }
  return n.index.push(0, 1, 2), Ne(n);
}
function _p(t = {}) {
  const e = q(t.width ?? 1, "options.width"), n = q(t.height ?? 1, "options.height"), r = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), i = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), s = Ve(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = -n / 2 + l * n;
    for (let h = 0; h <= r; h++) {
      const d = h / r, f = -e / 2 + d * e;
      pe(s, f, c, 0, 0, 0, 1, d, l);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < r; l++) {
      const c = o * a + l, h = c + 1, d = c + a + 1, f = c + a;
      s.index.push(c, h, d, c, d, f);
    }
  return Ne(s);
}
function Be(t, e, n, r, i, s, a) {
  const o = Vs(t), l = s + 1;
  for (let c = 0; c <= a; c++) {
    const h = c / a;
    for (let d = 0; d <= s; d++) {
      const f = d / s;
      pe(
        t,
        e[0] + n[0] * f + r[0] * h,
        e[1] + n[1] * f + r[1] * h,
        e[2] + n[2] * f + r[2] * h,
        i[0],
        i[1],
        i[2],
        f,
        h
      );
    }
  }
  for (let c = 0; c < a; c++)
    for (let h = 0; h < s; h++) {
      const d = o + c * l + h, f = d + 1, p = d + l + 1, m = d + l;
      t.index.push(d, f, p, d, p, m);
    }
}
function Ep(t = {}) {
  const e = q(t.width ?? 1, "options.width"), n = q(t.height ?? 1, "options.height"), r = q(t.depth ?? 1, "options.depth"), i = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = Z(t.depthSegments ?? 1, 1, "options.depthSegments"), o = e / 2, l = n / 2, c = r / 2, h = Ve();
  return Be(h, [o, -l, -c], [0, n, 0], [0, 0, r], [1, 0, 0], s, a), Be(h, [-o, -l, -c], [0, 0, r], [0, n, 0], [-1, 0, 0], a, s), Be(h, [-o, l, -c], [0, 0, r], [e, 0, 0], [0, 1, 0], a, i), Be(h, [-o, -l, -c], [e, 0, 0], [0, 0, r], [0, -1, 0], i, a), Be(h, [-o, -l, c], [e, 0, 0], [0, n, 0], [0, 0, 1], i, s), Be(h, [-o, -l, -c], [0, n, 0], [e, 0, 0], [0, 0, -1], s, i), Ne(h);
}
function Lp(t = {}) {
  const e = q(t.radius ?? 0.5, "options.radius"), n = Z(t.widthSegments ?? 32, 3, "options.widthSegments"), r = Z(t.heightSegments ?? 16, 2, "options.heightSegments"), i = Ve(), s = n + 1;
  for (let a = 0; a <= r; a++) {
    const o = a / r, l = o * Math.PI, c = Math.sin(l), h = Math.cos(l);
    for (let d = 0; d <= n; d++) {
      const f = d / n, p = f * Math.PI * 2, m = c * Math.cos(p), g = h, b = c * Math.sin(p);
      pe(i, m * e, g * e, b * e, m, g, b, f, 1 - o);
    }
  }
  for (let a = 0; a < r; a++)
    for (let o = 0; o < n; o++) {
      const l = a * s + o, c = l + 1, h = l + s + 1, d = l + s;
      i.index.push(l, c, h, l, h, d);
    }
  return Ne(i);
}
function Pp(t = {}) {
  const e = q(t.radius ?? 0.5, "options.radius"), n = q(t.tube ?? 0.2, "options.tube"), r = Z(t.radialSegments ?? 16, 3, "options.radialSegments"), i = Z(t.tubularSegments ?? 32, 3, "options.tubularSegments"), s = Ve(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = l * Math.PI * 2, h = Math.cos(c), d = Math.sin(c);
    for (let f = 0; f <= r; f++) {
      const p = f / r, m = p * Math.PI * 2, g = Math.cos(m), b = Math.sin(m), w = e + n * g, $ = g * h, S = b, A = g * d;
      pe(s, w * h, n * b, w * d, $, S, A, l, p);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < r; l++) {
      const c = o * a + l, h = c + 1, d = c + a + 1, f = c + a;
      s.index.push(c, h, d, c, d, f);
    }
  return Ne(s);
}
function Qr(t, e, n, r, i) {
  const s = Vs(t);
  pe(t, 0, e, 0, 0, r, 0, 0.5, 0.5);
  for (let a = 0; a <= i; a++) {
    const o = a / i * Math.PI * 2, l = Math.sin(o), c = Math.cos(o);
    pe(t, n * l, e, n * c, 0, r, 0, 0.5 + l * 0.5, 0.5 + c * 0.5);
  }
  for (let a = 0; a < i; a++) {
    const o = s + 1 + a, l = o + 1;
    r > 0 ? t.index.push(s, o, l) : t.index.push(s, l, o);
  }
}
function Ns(t = {}) {
  const e = Zr(t.radiusTop ?? 0.5, "options.radiusTop"), n = Zr(t.radiusBottom ?? 0.5, "options.radiusBottom"), r = q(t.height ?? 1, "options.height"), i = Z(t.radialSegments ?? 24, 3, "options.radialSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = t.caps ?? !0;
  if (e === 0 && n === 0)
    throw new RangeError("[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.");
  const o = Ve(), l = i + 1, c = Math.hypot(r, n - e), h = r / c, d = (n - e) / c;
  for (let f = 0; f <= s; f++) {
    const p = f / s, m = r / 2 - p * r, g = e + (n - e) * p;
    for (let b = 0; b <= i; b++) {
      const w = b / i, $ = w * Math.PI * 2, S = Math.sin($), A = Math.cos($);
      pe(o, g * S, m, g * A, h * S, d, h * A, w, 1 - p);
    }
  }
  for (let f = 0; f < s; f++)
    for (let p = 0; p < i; p++) {
      const m = f * l + p, g = m + 1, b = m + l + 1, w = m + l;
      o.index.push(m, w, b, m, b, g);
    }
  return a && (e > 0 && Qr(o, r / 2, e, 1, i), n > 0 && Qr(o, -r / 2, n, -1, i)), Ne(o);
}
function Mp(t = {}) {
  const e = q(t.radius ?? 0.5, "options.radius");
  return Ns({
    radiusTop: 0,
    radiusBottom: e,
    height: t.height ?? 1,
    radialSegments: t.radialSegments ?? 24,
    heightSegments: 1,
    caps: t.caps ?? !0
  });
}
function Cp(t = {}) {
  const e = q(t.size ?? 10, "options.size"), n = Z(t.divisions ?? 10, 1, "options.divisions"), r = t.plane ?? "xz", i = t.color ?? Sp, [s, a, o, l] = i, c = Is(), h = e / 2, d = e / n;
  for (let f = 0; f <= n; f++) {
    const p = -h + f * d;
    r === "xz" ? (C(c, -h, 0, p, s, a, o, l), C(c, h, 0, p, s, a, o, l), C(c, p, 0, -h, s, a, o, l), C(c, p, 0, h, s, a, o, l)) : r === "xy" ? (C(c, -h, p, 0, s, a, o, l), C(c, h, p, 0, s, a, o, l), C(c, p, -h, 0, s, a, o, l), C(c, p, h, 0, s, a, o, l)) : (C(c, 0, -h, p, s, a, o, l), C(c, 0, h, p, s, a, o, l), C(c, 0, p, -h, s, a, o, l), C(c, 0, p, h, s, a, o, l));
  }
  return Ds(c);
}
function Fp(t = {}) {
  const e = q(t.size ?? 1, "options.size"), n = Is();
  return C(n, 0, 0, 0, 1, 0, 0, 1), C(n, e, 0, 0, 1, 0, 0, 1), C(n, 0, 0, 0, 0, 1, 0, 1), C(n, 0, e, 0, 0, 1, 0, 1), C(n, 0, 0, 0, 0, 0, 1, 1), C(n, 0, 0, e, 0, 0, 1, 1), Ds(n);
}
const lg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createAxes: Fp,
  createBox: Ep,
  createCone: Mp,
  createCylinder: Ns,
  createGrid: Cp,
  createPlane: _p,
  createSphere: Lp,
  createTorus: Pp,
  createTriangle: Ap
}, Symbol.toStringTag, { value: "Module" }));
function Qe(t, e) {
  return t ? [t[0], t[1], t[2], t[3] ?? 1] : [...e];
}
const _e = {
  projectionView: "mat4x4f",
  model: "mat4x4f",
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它�?*/
  normalMatrix: "mat3x3f"
};
function zs(t = {}) {
  const e = Qe(t.color, [1, 1, 1, 1]);
  return {
    name: "unlit",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ..._e, baseColor: "vec4f" },
    glsl: {
      vs: `void main() {
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `void main() {
  fragColor = u.baseColor;
}`
    },
    wgsl: `@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f {
  return u.projectionView * u.model * vec4f(v.position, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.baseColor;
}`,
    defaults: { baseColor: e }
  };
}
function ks(t = {}) {
  const e = Ys(t.direction ?? [0.5, 1, 0.6]), n = Qe(t.color, [1, 1, 1, 1]);
  return {
    name: "lambert",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ..._e,
      baseColor: "vec4f",
      lightDirection: "vec3f",
      ambient: "f32"
    },
    glsl: {
      vs: `out vec3 vNormal;
void main() {
  vNormal = u.normalMatrix * normal;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  vec3 l = normalize(-u.lightDirection);
  float ndl = max(dot(n, l), 0.0);
  float lighting = u.ambient + (1.0 - u.ambient) * ndl;
  fragColor = vec4(u.baseColor.rgb * lighting, u.baseColor.a);
}`
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.normal = u.normalMatrix * v.normal;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let n = normalize(in.normal);
  let l = normalize(-u.lightDirection);
  let ndl = max(dot(n, l), 0.0);
  let lighting = u.ambient + (1.0 - u.ambient) * ndl;
  return vec4f(u.baseColor.rgb * lighting, u.baseColor.a);
}`,
    defaults: { baseColor: n, lightDirection: e, ambient: t.ambient ?? 0.18 }
  };
}
function Ws(t = {}) {
  const e = Ys(t.direction ?? [0.5, 1, 0.6]), n = Qe(t.color, [0.9, 0.9, 0.95, 1]), r = Qe(t.specular, [1, 1, 1, 1]);
  return {
    name: "phong",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ..._e,
      baseColor: "vec4f",
      specularColor: "vec4f",
      lightDirection: "vec3f",
      cameraPosition: "vec3f",
      ambient: "f32",
      shininess: "f32"
    },
    glsl: {
      vs: `out vec3 vNormal;
out vec3 vWorldPosition;
void main() {
  vec4 worldPosition = u.model * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = u.normalMatrix * normal;
  gl_Position = u.projectionView * worldPosition;
}`,
      fs: `in vec3 vNormal;
in vec3 vWorldPosition;
void main() {
  vec3 n = normalize(vNormal);
  vec3 l = normalize(-u.lightDirection);
  vec3 viewDir = normalize(u.cameraPosition - vWorldPosition);
  vec3 halfDir = normalize(l + viewDir);
  float ndl = max(dot(n, l), 0.0);
  float spec = pow(max(dot(n, halfDir), 0.0), u.shininess);
  vec3 diffuse = u.baseColor.rgb * (u.ambient + (1.0 - u.ambient) * ndl);
  vec3 result = diffuse + u.specularColor.rgb * spec * ndl;
  fragColor = vec4(result, u.baseColor.a);
}`
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) worldPosition: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let worldPosition = u.model * vec4f(v.position, 1.0);
  out.worldPosition = worldPosition.xyz;
  out.normal = u.normalMatrix * v.normal;
  out.position = u.projectionView * worldPosition;
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  let n = normalize(in.normal);
  let l = normalize(-u.lightDirection);
  let viewDir = normalize(u.cameraPosition - in.worldPosition);
  let halfDir = normalize(l + viewDir);
  let ndl = max(dot(n, l), 0.0);
  let spec = pow(max(dot(n, halfDir), 0.0), u.shininess);
  let diffuse = u.baseColor.rgb * (u.ambient + (1.0 - u.ambient) * ndl);
  return vec4f(diffuse + u.specularColor.rgb * spec * ndl, u.baseColor.a);
}`,
    defaults: {
      baseColor: n,
      specularColor: r,
      lightDirection: e,
      ambient: t.ambient ?? 0.16,
      shininess: t.shininess ?? 48
    }
  };
}
function js() {
  return {
    name: "normalDebug",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ..._e },
    glsl: {
      vs: `out vec3 vNormal;
void main() {
  vNormal = u.normalMatrix * normal;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec3 vNormal;
void main() {
  fragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
}`
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.normal = u.normalMatrix * v.normal;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return vec4f(normalize(in.normal) * 0.5 + 0.5, 1.0);
}`
  };
}
function qs(t = {}) {
  const e = Qe(t.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: "flatLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3" },
    uniforms: { ..._e, baseColor: "vec4f" },
    glsl: {
      vs: `void main() {
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `void main() {
  fragColor = u.baseColor;
}`
    },
    wgsl: `@vertex fn vsMain(v: VertexInput) -> @builtin(position) vec4f {
  return u.projectionView * u.model * vec4f(v.position, 1.0);
}

@fragment fn fsMain() -> @location(0) vec4f {
  return u.baseColor;
}`,
    defaults: { baseColor: e }
  };
}
function Xs() {
  return {
    name: "vertexColorLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3", color: "float32x4" },
    uniforms: { ..._e },
    glsl: {
      vs: `out vec4 vColor;
void main() {
  vColor = color;
  gl_Position = u.projectionView * u.model * vec4(position, 1.0);
}`,
      fs: `in vec4 vColor;
void main() {
  fragColor = vColor;
}`
    },
    wgsl: `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@vertex fn vsMain(v: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.color = v.color;
  out.position = u.projectionView * u.model * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  return in.color;
}`
  };
}
const Bp = {
  unlit: zs,
  lambert: ks,
  phong: Ws,
  normalDebug: js,
  flatLine: qs,
  vertexColorLine: Xs
};
function Rp(t) {
  return t.defaults ? { ...t.defaults } : {};
}
function Ys(t) {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}
const ug = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SCENE_UNIFORM_FIELDS: _e,
  defaultUniformsOf: Rp,
  flatLine: qs,
  lambert: ks,
  materials: Bp,
  normalDebug: js,
  phong: Ws,
  unlit: zs,
  vertexColorLine: Xs
}, Symbol.toStringTag, { value: "Module" }));
export {
  Vr as ATTRIBUTE_PLACEHOLDER,
  Zp as AddressMode,
  aa as BLEND_PRESETS,
  Ru as BackendRegistry,
  R as BindingType,
  jp as BlendFactor,
  qp as BlendOperation,
  O as BufferUsage,
  ae as ColorWriteMask,
  Wp as CompareFunction,
  Yp as CullMode,
  Kd as DEFAULT_BACKEND_ORDER,
  sa as DEFAULT_BLEND_COMPONENT,
  Jn as DEFAULT_DEPTH_STATE,
  kt as DEFAULT_PRIMITIVE_STATE,
  cu as DEG2RAD,
  Kr as DEPTH_STENCIL_FORMATS,
  dn as DeviceLostError,
  _m as DisposalScope,
  Vm as EPSILON,
  Qp as FilterMode,
  Hp as FrontFace,
  pu as GLSL_PREAMBLE,
  Mu as GLSL_SAMPLER_TYPES,
  Lu as GLSL_TYPE_NAMES,
  zt as Geometry,
  Ze as GfxTexture,
  fe as GpuError,
  Np as IndexFormat,
  $m as LOG_LEVEL_NAMES,
  ha as LOG_LEVEL_VALUES,
  zp as LoadOp,
  W as LogLevel,
  Vr as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  hn as MATERIAL_TEXTURE_PLACEHOLDER,
  un as MATERIAL_UNIFORM_PLACEHOLDER,
  Nt as Material,
  cg as OrbitControls,
  og as OrthographicCamera,
  na as OutOfMemoryError,
  ag as PerspectiveCamera,
  Ip as PrimitiveTopology,
  pn as QueryType,
  lu as RAD2DEG,
  Gp as RENDERABLE_FORMATS,
  Gs as Renderer,
  _e as SCENE_UNIFORM_FIELDS,
  Op as SHADER_STAGE_NAMES,
  mp as STANDARD_ATTRIBUTE_FORMATS,
  st as STENCIL_FACE_DEFAULT,
  j as ShaderStage,
  Xp as StencilOperation,
  kp as StoreOp,
  hn as TEXTURE_PLACEHOLDER,
  wt as TextureDimension,
  y as TextureUsage,
  Gr as UNIFORM_FIELD_TYPES,
  un as UNIFORM_PLACEHOLDER,
  hp as UniformArena,
  fp as UniformArenaPool,
  Vt as UniformLayout,
  Ir as UniformValues,
  Ks as VERTEX_FORMAT_INFO,
  u as ValidationError,
  Kp as VertexStepMode,
  li as alignTo,
  fm as alignTo4,
  Ln as assert,
  om as assertDefined,
  L as assertNever,
  Mt as assertNonNegativeInteger,
  Xe as assertPositiveInteger,
  cm as assertPowerOfTwo,
  Gm as box3,
  wp as buildMipChain,
  hm as byteLengthOf,
  ai as cacheKey,
  Re as clamp,
  Jm as clearShaders,
  Im as color,
  wm as combineFlags,
  xn as compileShaderStage,
  pm as concatTypedArrays,
  Fp as createAxes,
  Ep as createBox,
  Mp as createCone,
  Ns as createCylinder,
  Kn as createDefaultBackendRegistry,
  ig as createDevice,
  Bs as createDeviceWithAdapter,
  sg as createGeometry,
  Cp as createGrid,
  Ke as createLogger,
  oa as createPipelineCache,
  _p as createPlane,
  Lp as createSphere,
  Pp as createTorus,
  Ap as createTriangle,
  sp as createUniforms,
  vm as currentId,
  ci as defaultPixelRatio,
  ia as defaultTextureUsage,
  Rp as defaultUniformsOf,
  lp as defineMaterial,
  Rs as defineUniforms,
  ts as degToRad,
  am as describeAdapter,
  fu as describeShaderSource,
  Jd as detectBackend,
  ui as disposeAll,
  Bm as euler,
  tg as findWgslEntryPoint,
  qs as flatLine,
  xm as formatFlags,
  jm as formatShaderErrorLog,
  Om as frustum,
  ra as fullMipLevelCount,
  Sm as getGlobalLogLevel,
  Zm as getShader,
  gu as glslDefines,
  rs as glslFieldForStage,
  Pu as glslTypeName,
  bm as hasAllFlags,
  gm as hasAnyFlag,
  mm as hasFlag,
  Hm as hasShader,
  Zs as indexFormatByteSize,
  Bu as inferBindGroupLayoutEntries,
  uu as inverseLerp,
  um as isArrayBufferView,
  rg as isBackendAvailable,
  Jr as isBufferBinding,
  tm as isBufferBindingResource,
  Hs as isDepthStencilFormat,
  fa as isDisposable,
  ta as isGpuError,
  An as isImageSource,
  ei as isSamplerBinding,
  nm as isSamplerBindingResource,
  ss as isSamplerType,
  Up as isSrgbFormat,
  Jp as isTextureBinding,
  rm as isTextureBindingResource,
  Dp as isTriangleTopology,
  lm as isTypedArray,
  ks as lambert,
  ns as languageForBackend,
  zm as lerp,
  yu as listShaderKeys,
  Mm as mat3,
  Cm as mat4,
  ug as materials,
  je as measureCanvas,
  du as missingSourceMessage,
  Wm as nextAfter,
  G as nextId,
  js as normalDebug,
  ri as normalizeBindGroupLayoutEntries,
  Am as nullLogger,
  qm as numberLines,
  ua as paddedCopy,
  Ws as phong,
  Rm as plane,
  Vp as primitiveCount,
  Fm as quat,
  Nm as radToDeg,
  Um as ray,
  Dm as raycaster,
  Cu as reflectGlslProgram,
  Fu as reflectSamplerUniforms,
  eg as reflectWgslBindings,
  Eu as reflectWgslEntryPoints,
  vu as registerShader,
  Xm as registerShaders,
  Ym as replaceShader,
  Qm as requireShader,
  ym as resetIdCounter,
  im as resolveBindingLayoutEntry,
  sm as resolveBlendState,
  oi as resolveLimits,
  ti as resolveSamplerDescriptor,
  ni as resolveShaderSource,
  _n as resolveTextureSize,
  En as resolveTextureViewDescriptor,
  em as samplerKey,
  Tm as setGlobalLogLevel,
  lg as shapes,
  Qs as smallestIndexFormat,
  km as smoothstep,
  hu as stageSource,
  is as stripWgslComments,
  la as toUint8View,
  dm as typedArrayElementSize,
  zs as unlit,
  Km as unregisterShader,
  ii as validateVertexBufferLayout,
  Em as vec2,
  Lm as vec3,
  Pm as vec4,
  si as vertexBufferLayoutsKey,
  Xs as vertexColorLine,
  Js as vertexFormatGlslType,
  ye as vertexFormatInfo,
  ea as vertexFormatWgslType,
  ng as wgslBindingKeys,
  bu as wgslDefines,
  wu as wrapGlslSource,
  xu as wrapWgslSource
};
//# sourceMappingURL=gpu-device-api.js.map
