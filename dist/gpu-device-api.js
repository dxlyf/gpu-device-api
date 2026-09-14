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
}, x = {
  None: 0,
  CopySrc: 1,
  CopyDst: 2,
  /** 可通过 {@link TextureView} 采样。 */
  TextureBinding: 4,
  /** 可绑定为 storage texture（仅 WebGPU）。 */
  StorageBinding: 8,
  /** 可用作 render pass 的 color/depth attachment。 */
  RenderAttachment: 16
}, ni = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], Hp = [
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
  ...ni
];
function oa(t) {
  return ni.includes(t);
}
function Zp(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const q = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, Qp = {
  [q.Vertex]: "vertex",
  [q.Fragment]: "fragment",
  [q.Compute]: "compute"
}, Kp = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function Jp(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function em(t, e) {
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
const tm = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function ca(t) {
  return t === "uint16" ? 2 : 4;
}
function la(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const nm = {
  Load: "load",
  Clear: "clear"
}, rm = {
  Store: "store",
  Discard: "discard"
}, im = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, sm = {
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
}, am = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, om = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, cm = {
  None: "none",
  Front: "front",
  Back: "back"
}, lm = {
  Ccw: "ccw",
  Cw: "cw"
}, um = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, hm = {
  Nearest: "nearest",
  Linear: "linear"
};
function $(t, e, n, r = !1) {
  return { components: t, byteSize: e, kind: n, normalized: r };
}
const ua = Object.freeze({
  uint8x2: $(2, 2, "uint"),
  uint8x4: $(4, 4, "uint"),
  sint8x2: $(2, 2, "sint"),
  sint8x4: $(4, 4, "sint"),
  unorm8x2: $(2, 2, "float", !0),
  unorm8x4: $(4, 4, "float", !0),
  snorm8x2: $(2, 2, "float", !0),
  snorm8x4: $(4, 4, "float", !0),
  uint16x2: $(2, 4, "uint"),
  uint16x4: $(4, 8, "uint"),
  sint16x2: $(2, 4, "sint"),
  sint16x4: $(4, 8, "sint"),
  unorm16x2: $(2, 4, "float", !0),
  unorm16x4: $(4, 8, "float", !0),
  snorm16x2: $(2, 4, "float", !0),
  snorm16x4: $(4, 8, "float", !0),
  float16x2: $(2, 4, "float"),
  float16x4: $(4, 8, "float"),
  float32: $(1, 4, "float"),
  float32x2: $(2, 8, "float"),
  float32x3: $(3, 12, "float"),
  float32x4: $(4, 16, "float"),
  uint32: $(1, 4, "uint"),
  uint32x2: $(2, 8, "uint"),
  uint32x3: $(3, 12, "uint"),
  uint32x4: $(4, 16, "uint"),
  sint32: $(1, 4, "sint"),
  sint32x2: $(2, 8, "sint"),
  sint32x3: $(3, 12, "sint"),
  sint32x4: $(4, 16, "sint")
});
function $e(t) {
  const e = ua[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function ha(t) {
  const e = $e(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function fa(t) {
  const e = $e(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const fm = {
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
function ri(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function dm(t) {
  return t === "texture" || t === "storage-texture";
}
function ii(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class de extends Error {
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
function da(t) {
  return t instanceof de;
}
class u extends de {
  constructor(e, n = {}) {
    super(e, { ...n, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class pa extends de {
  constructor(e, n = {}) {
    super(e, { ...n, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class pn extends de {
  reason;
  constructor(e, n = {}) {
    super(e, { ...n, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = n.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const vt = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function En(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function ma(t) {
  const e = En(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function ga(t = 0) {
  return x.CopyDst | x.TextureBinding | t;
}
function Ln(t, e = {}) {
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
function si(t = {}) {
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
function pm(t) {
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
function ai(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const mn = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function mm(t) {
  return t.buffer !== void 0;
}
function gm(t) {
  return t.sampler !== void 0;
}
function bm(t) {
  return t.view !== void 0;
}
function wm(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function oi(t) {
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
function ci(t, e) {
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
    const r = $e(n.format);
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
function li(t) {
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
}, Wt = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, tr = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, ba = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, at = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, wa = Object.freeze({
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
function vm(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = wa[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function va(t = 128, e) {
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
function ui(...t) {
  return t.filter((e) => e != null && e !== "").join("|");
}
function xm(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function hi(t, e, n) {
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
const fi = "depth24plus";
function je(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function di() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function Mn(t, e, n) {
  if (!t) throw new u(e, n ? { details: n } : {});
}
function ym(t, e, n) {
  if (t == null)
    throw new u(e, n ? { details: n } : {});
  return t;
}
function L(t, e) {
  throw new u(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function Ye(t, e) {
  Mn(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function Ct(t, e) {
  Mn(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function Tm(t, e) {
  Mn(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const xa = [
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
function $m(t) {
  return xa.some((e) => t instanceof e);
}
function Sm(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function Am(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function ya(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function pi(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function _m(t) {
  return t + 3 & -4;
}
function Ta(t, e = 4) {
  const n = ya(t), r = pi(n.byteLength, e);
  if (r === n.byteLength) return n;
  const i = new Uint8Array(r);
  return i.set(n), i;
}
function Em(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function Lm(t) {
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
function Mm(t, e) {
  return (t & e) === e;
}
function Pm(t, e) {
  return (t & e) !== 0;
}
function Cm(t, e) {
  return (t & e) === e;
}
function Fm(...t) {
  let e = 0;
  for (const n of t) e |= n;
  return e;
}
function Bm(t, e) {
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
function Rm() {
  return $t;
}
function Gm() {
  $t = 0;
}
const W = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, Um = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, $a = {
  silent: W.Silent,
  error: W.Error,
  warn: W.Warn,
  info: W.Info,
  debug: W.Debug,
  trace: W.Trace
};
let Pn = W.Warn;
function Om(t) {
  Pn = typeof t == "string" ? $a[t] : t;
}
function Dm() {
  return Pn;
}
function Je(t = "gpu-device-api", e) {
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
const Im = {
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
function Sa(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function mi(t) {
  let e;
  for (const n of t)
    if (Sa(n))
      try {
        n.dispose();
      } catch (r) {
        e ??= r;
      }
  if (e !== void 0) throw e;
}
class Vm {
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
    this.resources.clear(), mi(e);
  }
}
function Aa() {
  return new Float32Array(2);
}
function _a(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function Ea(t, e) {
  const n = new Float32Array(2);
  return n[0] = t, n[1] = e, n;
}
function La(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function Ma(t, e, n) {
  return t[0] = e, t[1] = n, t;
}
function Pa(t) {
  return t[0] = 0, t[1] = 0, t;
}
function Ca(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t;
}
function Fa(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t;
}
function Ba(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t;
}
function Ra(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t;
}
function Ga(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t;
}
function Ua(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t;
}
function Oa(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function Da(t, e) {
  const n = e[0], r = e[1];
  let i = Math.hypot(n, r);
  return i > 0 && (i = 1 / i), t[0] = n * i, t[1] = r * i, t;
}
function Ia(t) {
  return Math.hypot(t[0], t[1]);
}
function Va(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function Na(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function za(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1];
  return n * n + r * r;
}
function ka(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function Wa(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function qa(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t;
}
function ja(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t;
}
function Xa(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t;
}
function Ya(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n;
}
function Ha(t, e, n) {
  const r = e[0], i = e[1];
  return t[0] = n[0] * r + n[3] * i + n[6], t[1] = n[1] * r + n[4] * i + n[7], t;
}
function Za(t) {
  return [t[0], t[1]];
}
function Qa(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const Nm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ca,
  clone: _a,
  copy: La,
  create: Aa,
  cross: Wa,
  distance: Na,
  div: Ra,
  dot: ka,
  equals: Ya,
  fromValues: Ea,
  length: Ia,
  lerp: qa,
  max: Xa,
  min: ja,
  mul: Ba,
  negate: Oa,
  normalize: Da,
  scale: Ga,
  scaleAndAdd: Ua,
  set: Ma,
  squaredDistance: za,
  squaredLength: Va,
  sub: Fa,
  toArray: Za,
  toString: Qa,
  transformMat3: Ha,
  zero: Pa
}, Symbol.toStringTag, { value: "Module" }));
function F() {
  return new Float32Array(3);
}
function Ka(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function Ja(t, e, n) {
  const r = new Float32Array(3);
  return r[0] = t, r[1] = e, r[2] = n, r;
}
function se(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function pe(t, e, n, r) {
  return t[0] = e, t[1] = n, t[2] = r, t;
}
function gn(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function He(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t;
}
function oe(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t;
}
function eo(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t;
}
function to(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t;
}
function St(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t;
}
function xt(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t[2] = e[2] + n[2] * r, t;
}
function no(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function Cn(t, e) {
  const n = e[0], r = e[1], i = e[2];
  let s = Math.hypot(n, r, i);
  return s > 0 && (s = 1 / s), t[0] = n * s, t[1] = r * s, t[2] = i * s, t;
}
function Oe(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function gi(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function bi(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function Ft(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
  return n * n + r * r + i * i;
}
function ue(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function wi(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], l = n[2];
  return t[0] = i * l - s * o, t[1] = s * a - r * l, t[2] = r * o - i * a, t;
}
function ro(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t;
}
function Bt(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t[2] = Math.min(e[2], n[2]), t;
}
function Rt(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t[2] = Math.max(e[2], n[2]), t;
}
function bn(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n;
}
function io(t, e, n) {
  const r = ue(n, e) * 2;
  return t[0] = e[0] - n[0] * r, t[1] = e[1] - n[1] * r, t[2] = e[2] - n[2] * r, t;
}
function vi(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[3] * i + n[6] * s, t[1] = n[1] * r + n[4] * i + n[7] * s, t[2] = n[2] * r + n[5] * i + n[8] * s, t;
}
function Fn(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  let a = n[3] * r + n[7] * i + n[11] * s + n[15];
  return a = a || 1, t[0] = (n[0] * r + n[4] * i + n[8] * s + n[12]) / a, t[1] = (n[1] * r + n[5] * i + n[9] * s + n[13]) / a, t[2] = (n[2] * r + n[6] * i + n[10] * s + n[14]) / a, t;
}
function xi(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, t;
}
function so(t) {
  return [t[0], t[1], t[2]];
}
function ao(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const zm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: He,
  clone: Ka,
  copy: se,
  create: F,
  cross: wi,
  distance: bi,
  div: to,
  dot: ue,
  equals: bn,
  fromValues: Ja,
  length: Oe,
  lerp: ro,
  max: Rt,
  min: Bt,
  mul: eo,
  negate: no,
  normalize: Cn,
  reflect: io,
  scale: St,
  scaleAndAdd: xt,
  set: pe,
  squaredDistance: Ft,
  squaredLength: gi,
  sub: oe,
  toArray: so,
  toString: ao,
  transformDirection: xi,
  transformMat3: vi,
  transformMat4: Fn,
  zero: gn
}, Symbol.toStringTag, { value: "Module" }));
function oo() {
  return new Float32Array(4);
}
function co(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function lo(t, e, n, r) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = n, i[3] = r, i;
}
function uo(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function ho(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function fo(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function po(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t[3] = e[3] + n[3], t;
}
function mo(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t[3] = e[3] - n[3], t;
}
function go(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t[3] = e[3] * n[3], t;
}
function bo(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t[3] = e[3] / n[3], t;
}
function wo(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t;
}
function vo(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function xo(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3];
  let a = Math.hypot(n, r, i, s);
  return a > 0 && (a = 1 / a), t[0] = n * a, t[1] = r * a, t[2] = i * a, t[3] = s * a, t;
}
function yo(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function To(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function $o(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function So(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t[3] = e[3] + r * (n[3] - e[3]), t;
}
function Ao(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function _o(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = n[0] * r + n[4] * i + n[8] * s + n[12] * a, t[1] = n[1] * r + n[5] * i + n[9] * s + n[13] * a, t[2] = n[2] * r + n[6] * i + n[10] * s + n[14] * a, t[3] = n[3] * r + n[7] * i + n[11] * s + n[15] * a, t;
}
function Eo(t) {
  return [t[0], t[1], t[2], t[3]];
}
function Lo(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const km = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: po,
  clone: co,
  copy: uo,
  create: oo,
  div: bo,
  dot: $o,
  equals: Ao,
  fromValues: lo,
  length: yo,
  lerp: So,
  mul: go,
  negate: vo,
  normalize: xo,
  scale: wo,
  set: ho,
  squaredLength: To,
  sub: mo,
  toArray: Eo,
  toString: Lo,
  transformMat4: _o,
  zero: fo
}, Symbol.toStringTag, { value: "Module" }));
function yi() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function Ti(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function Mo(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function Po(t, e, n, r, i, s, a, o, l) {
  const c = new Float32Array(9);
  return c[0] = t, c[1] = e, c[2] = n, c[3] = r, c[4] = i, c[5] = s, c[6] = a, c[7] = o, c[8] = l, c;
}
function Co(t, e) {
  return t.set(e), t;
}
function Fo(t, e, n, r, i, s, a, o, l, c) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = l, t[8] = c, t;
}
function $i(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function Si(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8];
  return t[0] = n, t[1] = s, t[2] = l, t[3] = r, t[4] = a, t[5] = c, t[6] = i, t[7] = o, t[8] = h, t;
}
function Bo(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = c * s - a * l, d = -c * i + a * o, f = l * i - s * o;
  return e * h + n * d + r * f;
}
function Ai(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = h * a - o * c, f = -h * s + o * l, p = c * s - a * l;
  let m = n * d + r * f + i * p;
  return m ? (m = 1 / m, t[0] = d * m, t[1] = (-h * r + i * c) * m, t[2] = (o * r - i * a) * m, t[3] = f * m, t[4] = (h * n - i * l) * m, t[5] = (-o * n + i * s) * m, t[6] = p * m, t[7] = (-c * n + r * l) * m, t[8] = (a * n - r * s) * m, t) : null;
}
function Ro(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = n[0], p = n[1], m = n[2], g = n[3], b = n[4], w = n[5], T = n[6], S = n[7], A = n[8];
  return t[0] = f * r + p * a + m * c, t[1] = f * i + p * o + m * h, t[2] = f * s + p * l + m * d, t[3] = g * r + b * a + w * c, t[4] = g * i + b * o + w * h, t[5] = g * s + b * l + w * d, t[6] = T * r + S * a + A * c, t[7] = T * i + S * o + A * h, t[8] = T * s + S * l + A * d, t;
}
function Go(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = n[0], p = n[1], m = n[2];
  return t[0] = f * r, t[1] = f * i, t[2] = f * s, t[3] = p * a, t[4] = p * o, t[5] = p * l, t[6] = m * c, t[7] = m * h, t[8] = m * d, t;
}
function Uo(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = n[0], p = n[1];
  return t[0] = r, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = l, t[6] = f * r + p * a + c, t[7] = f * i + p * o + h, t[8] = f * s + p * l + d, t;
}
function Oo(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = Math.sin(n), p = Math.cos(n);
  return t[0] = p * r + f * a, t[1] = p * i + f * o, t[2] = p * s + f * l, t[3] = p * a - f * r, t[4] = p * o - f * i, t[5] = p * l - f * s, t[6] = c, t[7] = h, t[8] = d, t;
}
function Bn(t, e) {
  return $i(t, e), Ai(t, t) ? (Si(t, t), t) : null;
}
function Do(t, e, n = 1e-6) {
  for (let r = 0; r < 9; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function Io(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const Wm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Mo,
  copy: Co,
  create: yi,
  determinant: Bo,
  equals: Do,
  fromMat4: $i,
  fromValues: Po,
  identity: Ti,
  invert: Ai,
  multiply: Ro,
  normalFromMat4: Bn,
  rotate: Oo,
  scale: Go,
  set: Fo,
  toString: Io,
  translate: Uo,
  transpose: Si
}, Symbol.toStringTag, { value: "Module" })), At = 1e-6, ie = new Float32Array(16), Vo = new Float32Array(3);
function ne() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function X(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function No(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function _i(t) {
  return t.fill(0), t;
}
function zo(...t) {
  const e = new Float32Array(16);
  for (let n = 0; n < 16; n++) e[n] = t[n] ?? 0;
  return e;
}
function Ei(t, e) {
  return t.set(e), t;
}
function ko(t, ...e) {
  for (let n = 0; n < 16; n++) t[n] = e[n] ?? 0;
  return t;
}
function Wo(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = e[9], f = e[10], p = e[11], m = e[12], g = e[13], b = e[14], w = e[15];
  return t[0] = n, t[1] = a, t[2] = h, t[3] = m, t[4] = r, t[5] = o, t[6] = d, t[7] = g, t[8] = i, t[9] = l, t[10] = f, t[11] = b, t[12] = s, t[13] = c, t[14] = p, t[15] = w, t;
}
function Li(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = t[9], d = t[10], f = t[11], p = t[12], m = t[13], g = t[14], b = t[15], w = e * a - n * s, T = e * o - r * s, S = e * l - i * s, A = n * o - r * a, _ = n * l - i * a, M = r * l - i * o, P = c * m - h * p, I = c * g - d * p, V = c * b - f * p, N = h * g - d * m, z = h * b - f * m, Y = d * b - f * g;
  return w * Y - T * z + S * N + A * V - _ * I + M * P;
}
function Gt(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = e[9], f = e[10], p = e[11], m = e[12], g = e[13], b = e[14], w = e[15], T = n * o - r * a, S = n * l - i * a, A = n * c - s * a, _ = r * l - i * o, M = r * c - s * o, P = i * c - s * l, I = h * g - d * m, V = h * b - f * m, N = h * w - p * m, z = d * b - f * g, Y = d * w - p * g, J = f * w - p * b;
  let E = T * J - S * Y + A * z + _ * N - M * V + P * I;
  return E ? (E = 1 / E, t[0] = (o * J - l * Y + c * z) * E, t[1] = (i * Y - r * J - s * z) * E, t[2] = (g * P - b * M + w * _) * E, t[3] = (f * M - d * P - p * _) * E, t[4] = (l * N - a * J - c * V) * E, t[5] = (n * J - i * N + s * V) * E, t[6] = (b * A - m * P - w * S) * E, t[7] = (h * P - f * A + p * S) * E, t[8] = (a * Y - o * N + c * I) * E, t[9] = (r * N - n * Y - s * I) * E, t[10] = (m * M - g * A + w * T) * E, t[11] = (d * A - h * M - p * T) * E, t[12] = (o * V - a * z - l * I) * E, t[13] = (n * z - r * V + i * I) * E, t[14] = (g * S - m * _ - b * T) * E, t[15] = (h * _ - d * S + f * T) * E, t) : null;
}
function Q(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], f = e[9], p = e[10], m = e[11], g = e[12], b = e[13], w = e[14], T = e[15], S = n[0], A = n[1], _ = n[2], M = n[3], P = n[4], I = n[5], V = n[6], N = n[7], z = n[8], Y = n[9], J = n[10], E = n[11], nt = n[12], rt = n[13], it = n[14], st = n[15];
  return t[0] = S * r + A * o + _ * d + M * g, t[1] = S * i + A * l + _ * f + M * b, t[2] = S * s + A * c + _ * p + M * w, t[3] = S * a + A * h + _ * m + M * T, t[4] = P * r + I * o + V * d + N * g, t[5] = P * i + I * l + V * f + N * b, t[6] = P * s + I * c + V * p + N * w, t[7] = P * a + I * h + V * m + N * T, t[8] = z * r + Y * o + J * d + E * g, t[9] = z * i + Y * l + J * f + E * b, t[10] = z * s + Y * c + J * p + E * w, t[11] = z * a + Y * h + J * m + E * T, t[12] = nt * r + rt * o + it * d + st * g, t[13] = nt * i + rt * l + it * f + st * b, t[14] = nt * s + rt * c + it * p + st * w, t[15] = nt * a + rt * h + it * m + st * T, t;
}
function qo(t, ...e) {
  if (e.length === 0) return X(t);
  Ei(t, e[0]);
  for (let n = 1; n < e.length; n++) Q(t, t, e[n]);
  return t;
}
function Mi(t, e) {
  return X(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function jo(t, e) {
  return X(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function Pi(t, e, n) {
  let r = n[0], i = n[1], s = n[2], a = Math.hypot(r, i, s);
  if (a < At) return X(t);
  a = 1 / a, r *= a, i *= a, s *= a;
  const o = Math.sin(e), l = Math.cos(e), c = 1 - l, h = r * r * c + l, d = i * r * c + s * o, f = s * r * c - i * o, p = r * i * c - s * o, m = i * i * c + l, g = s * i * c + r * o, b = r * s * c + i * o, w = i * s * c - r * o, T = s * s * c + l;
  return t[0] = h, t[1] = d, t[2] = f, t[3] = 0, t[4] = p, t[5] = m, t[6] = g, t[7] = 0, t[8] = b, t[9] = w, t[10] = T, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Rn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[5] = r, t[6] = n, t[9] = -n, t[10] = r, t;
}
function Gn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[0] = r, t[2] = -n, t[8] = n, t[10] = r, t;
}
function Un(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[0] = r, t[1] = n, t[4] = -n, t[5] = r, t;
}
function Xo(t, e, n, r) {
  return On(t, e, n, r, Yo);
}
const Yo = new Float32Array([1, 1, 1]);
function On(t, e, n, r, i) {
  let s = n[0], a = n[1], o = n[2], l = Math.hypot(s, a, o);
  if (l < At)
    return X(t), t[12] = r[0], t[13] = r[1], t[14] = r[2], t;
  l = 1 / l, s *= l, a *= l, o *= l;
  const c = Math.sin(e), h = Math.cos(e), d = 1 - h, f = s * s * d + h, p = a * s * d + o * c, m = o * s * d - a * c, g = s * a * d - o * c, b = a * a * d + h, w = o * a * d + s * c, T = s * o * d + a * c, S = a * o * d - s * c, A = o * o * d + h, _ = i[0], M = i[1], P = i[2];
  return t[0] = f * _, t[1] = p * _, t[2] = m * _, t[3] = 0, t[4] = g * M, t[5] = b * M, t[6] = w * M, t[7] = 0, t[8] = T * P, t[9] = S * P, t[10] = A * P, t[11] = 0, t[12] = r[0], t[13] = r[1], t[14] = r[2], t[15] = 1, t;
}
function Ho(t, e, n, r, i, s) {
  On(t, e, n, r, i);
  const a = s[0], o = s[1], l = s[2];
  return t[12] = r[0] + a - (t[0] * a + t[4] * o + t[8] * l), t[13] = r[1] + o - (t[1] * a + t[5] * o + t[9] * l), t[14] = r[2] + l - (t[2] * a + t[6] * o + t[10] * l), t;
}
function Zo(t, e, n) {
  return Mi(ie, n), Q(t, e, ie);
}
function Qo(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function Ko(t, e, n, r) {
  return Pi(ie, n, r), Q(t, e, ie);
}
function Jo(t, e, n) {
  return Rn(ie, n), Q(t, e, ie);
}
function ec(t, e, n) {
  return Gn(ie, n), Q(t, e, ie);
}
function tc(t, e, n) {
  return Un(ie, n), Q(t, e, ie);
}
function nc(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function Ci(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function rc(t, e) {
  const n = Ci(Vo, e), r = Li(e) < 0 ? -1 : 1, i = n[0] * r, s = n[1], a = n[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function Fi(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (r - i);
    t[10] = (i + r) * a, t[14] = 2 * i * r * a;
  } else
    t[10] = -1, t[14] = -2 * r;
  return t;
}
function Bi(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (r - i), t[14] = i * r / (r - i)) : (t[10] = -1, t[14] = -r), t;
}
function Ri(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), l = 1 / (r - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * c, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * l, t[14] = (a + s) * c, t[15] = 1, t;
}
function Gi(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), l = 1 / (r - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = c, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * l, t[14] = s * c, t[15] = 1, t;
}
function ic(t, e, n, r, i, s, a) {
  const o = 1 / (n - e), l = 1 / (i - r), c = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * l, t[6] = 0, t[7] = 0, t[8] = (n + e) * o, t[9] = (i + r) * l, t[10] = (a + s) * c, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * c, t[15] = 0, t;
}
function wn(t, e, n, r) {
  let i = e[0] - n[0], s = e[1] - n[1], a = e[2] - n[2], o = Math.hypot(i, s, a);
  if (o < At) return _i(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let l = r[1] * a - r[2] * s, c = r[2] * i - r[0] * a, h = r[0] * s - r[1] * i;
  o = Math.hypot(l, c, h), o < At ? (l = 0, c = 0, h = 0) : (o = 1 / o, l *= o, c *= o, h *= o);
  const d = s * h - a * c, f = a * l - i * h, p = i * c - s * l;
  return t[0] = l, t[1] = d, t[2] = i, t[3] = 0, t[4] = c, t[5] = f, t[6] = s, t[7] = 0, t[8] = h, t[9] = p, t[10] = a, t[11] = 0, t[12] = -(l * e[0] + c * e[1] + h * e[2]), t[13] = -(d * e[0] + f * e[1] + p * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function sc(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  let a = e[3] * r + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * r + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * r + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * r + e[6] * i + e[10] * s + e[14]) / a, t;
}
function ac(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r + e[4] * i + e[8] * s, t[1] = e[1] * r + e[5] * i + e[9] * s, t[2] = e[2] * r + e[6] * i + e[10] * s, t;
}
function oc(t, e, n = 1e-6) {
  for (let r = 0; r < 16; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function cc(t) {
  const e = [];
  for (let n = 0; n < 4; n++)
    e.push(
      `[${t[n]}, ${t[n + 4]}, ${t[n + 8]}, ${t[n + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const qm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: No,
  copy: Ei,
  create: ne,
  determinant: Li,
  equals: oc,
  fromRotation: Pi,
  fromRotationTranslation: Xo,
  fromRotationTranslationScale: On,
  fromRotationTranslationScaleOrigin: Ho,
  fromScaling: jo,
  fromTranslation: Mi,
  fromValues: zo,
  fromXRotation: Rn,
  fromYRotation: Gn,
  fromZRotation: Un,
  frustum: ic,
  getRotation: rc,
  getScaling: Ci,
  getTranslation: nc,
  identity: X,
  invert: Gt,
  lookAt: wn,
  multiply: Q,
  multiplyAll: qo,
  ortho: Ri,
  orthoZO: Gi,
  perspective: Fi,
  perspectiveZO: Bi,
  rotate: Ko,
  rotateX: Jo,
  rotateY: ec,
  rotateZ: tc,
  scale: Qo,
  set: ko,
  toString: cc,
  transformDirection: ac,
  transformPoint: sc,
  translate: Zo,
  transpose: Wo,
  zero: _i
}, Symbol.toStringTag, { value: "Module" }));
function Ui() {
  const t = new Float32Array(4);
  return t[3] = 1, t;
}
function lc(t) {
  const e = new Float32Array(4);
  return Oi(e, t);
}
function Oi(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function et(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function uc(t, e, n, r) {
  return et(new Float32Array(4), t, e, n, r);
}
function Ut(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 1, t;
}
function Dn(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function In(t) {
  return Dn(t, t);
}
function Di(t) {
  return Math.sqrt(In(t));
}
function Ne(t, e) {
  const n = Di(e);
  if (n < 1e-8) return Ut(t);
  const r = 1 / n;
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function hc(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = e[3], t;
}
function fc(t, e) {
  const n = In(e);
  if (n < 1e-12) return Ut(t);
  const r = 1 / n;
  return t[0] = -e[0] * r, t[1] = -e[1] * r, t[2] = -e[2] * r, t[3] = e[3] * r, t;
}
function Se(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = n[0], l = n[1], c = n[2], h = n[3];
  return t[0] = r * h + a * o + i * c - s * l, t[1] = i * h + a * l + s * o - r * c, t[2] = s * h + a * c + r * l - i * o, t[3] = a * h - r * o - i * l - s * c, t;
}
function dc(t, e, n) {
  return Se(t, n, e);
}
function pc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return Se(t, e, et(Vn, i, 0, 0, s));
}
function mc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return Se(t, e, et(Vn, 0, i, 0, s));
}
function gc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return Se(t, e, et(Vn, 0, 0, i, s));
}
const Vn = Ui();
function yt(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]);
  if (r < 1e-8) return Ut(t);
  const i = n * 0.5, s = Math.sin(i) / r;
  return t[0] = e[0] * s, t[1] = e[1] * s, t[2] = e[2] * s, t[3] = Math.cos(i), t;
}
function bc(t, e) {
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
  return Ne(t, t);
}
function wc(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], l = n[2];
  let c = r * a + i * o + s * l + 1;
  return c < 1e-8 ? (c = 0, Math.abs(r) > Math.abs(s) ? (t[0] = -i, t[1] = r, t[2] = 0) : (t[0] = 0, t[1] = -s, t[2] = i), t[3] = c) : (t[0] = i * l - s * o, t[1] = s * a - r * l, t[2] = r * o - i * a, t[3] = c), Ne(t, t);
}
function vc(t, e, n) {
  const r = n[0], i = n[1], s = n[2], a = e[0], o = e[1], l = e[2], c = e[3], h = 2 * (o * s - l * i), d = 2 * (l * r - a * s), f = 2 * (a * i - o * r);
  return t[0] = r + c * h + (o * f - l * d), t[1] = i + c * d + (l * h - a * f), t[2] = s + c * f + (a * d - o * h), t;
}
function xc(t, e, n, r) {
  let i = n[0], s = n[1], a = n[2], o = n[3], l = Dn(e, n);
  if (l < 0 && (l = -l, i = -i, s = -s, a = -a, o = -o), l > 0.9995)
    return t[0] = e[0] + (i - e[0]) * r, t[1] = e[1] + (s - e[1]) * r, t[2] = e[2] + (a - e[2]) * r, t[3] = e[3] + (o - e[3]) * r, Ne(t, t);
  const c = Math.acos(l), h = Math.sin(c), d = Math.sin((1 - r) * c) / h, f = Math.sin(r * c) / h;
  return t[0] = e[0] * d + i * f, t[1] = e[1] * d + s * f, t[2] = e[2] * d + a * f, t[3] = e[3] * d + o * f, Ne(t, t);
}
function yc(t, e, n, r) {
  return t[0] = e[0] + (n[0] - e[0]) * r, t[1] = e[1] + (n[1] - e[1]) * r, t[2] = e[2] + (n[2] - e[2]) * r, t[3] = e[3] + (n[3] - e[3]) * r, Ne(t, t);
}
function Ii(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = n + n, o = r + r, l = i + i, c = n * a, h = n * o, d = n * l, f = r * o, p = r * l, m = i * l, g = s * a, b = s * o, w = s * l;
  return t[0] = 1 - (f + m), t[1] = h + w, t[2] = d - b, t[3] = 0, t[4] = h - w, t[5] = 1 - (c + m), t[6] = p + g, t[7] = 0, t[8] = d + b, t[9] = p - g, t[10] = 1 - (c + f), t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Tc(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function $c(t) {
  return `quat(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const jm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: lc,
  conjugate: hc,
  copy: Oi,
  create: Ui,
  dot: Dn,
  equals: Tc,
  fromValues: uc,
  identity: Ut,
  invert: fc,
  length: Di,
  lerp: yc,
  multiply: Se,
  normalize: Ne,
  premultiply: dc,
  rotateX: pc,
  rotateY: mc,
  rotateZ: gc,
  set: et,
  setAxisAngle: yt,
  setFromRotationMatrix: bc,
  setFromUnitVectors: wc,
  slerp: xc,
  squaredLength: In,
  toMat4: Ii,
  toString: $c,
  transformVec3: vc
}, Symbol.toStringTag, { value: "Module" })), Sc = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"];
function Vi(t = 0, e = 0, n = 0, r = "XYZ") {
  return { x: t, y: e, z: n, order: r };
}
function Ac(t) {
  return Vi(t.x, t.y, t.z, t.order);
}
function _c(t, e) {
  return t.x = e.x, t.y = e.y, t.z = e.z, t.order = e.order, t;
}
function Ec(t, e, n, r, i = t.order) {
  return t.x = e, t.y = n, t.z = r, t.order = i, t;
}
function Lc(t, e, n = 1e-6) {
  return t.order === e.order && Math.abs(t.x - e.x) <= n && Math.abs(t.y - e.y) <= n && Math.abs(t.z - e.z) <= n;
}
const Ni = {
  XYZ: ["X", "Y", "Z"],
  YXZ: ["Y", "X", "Z"],
  ZXY: ["Z", "X", "Y"],
  ZYX: ["Z", "Y", "X"],
  YZX: ["Y", "Z", "X"],
  XZY: ["X", "Z", "Y"]
}, qt = {
  X: new Float32Array([1, 0, 0]),
  Y: new Float32Array([0, 1, 0]),
  Z: new Float32Array([0, 0, 1])
}, Mc = X(new Float32Array(16)), Pc = X(new Float32Array(16)), Cc = X(new Float32Array(16)), vn = X(new Float32Array(16)), Fc = new Float32Array(4), Bc = new Float32Array(4), Rc = new Float32Array(4), nr = new Float32Array(4);
function De(t, e) {
  return e === "X" ? t.x : e === "Y" ? t.y : t.z;
}
function jt(t, e, n) {
  return t === "X" ? Rn(n, e) : t === "Y" ? Gn(n, e) : Un(n, e);
}
function Gc(t, e) {
  const n = Ni[e.order], r = jt(n[0], De(e, n[0]), Mc), i = jt(n[1], De(e, n[1]), Pc), s = jt(n[2], De(e, n[2]), Cc);
  return Q(vn, r, i), Q(t, vn, s);
}
function Uc(t, e) {
  const n = Ni[e.order], r = yt(Fc, qt[n[0]], De(e, n[0])), i = yt(Bc, qt[n[1]], De(e, n[1])), s = yt(Rc, qt[n[2]], De(e, n[2]));
  return Se(nr, r, i), Se(t, nr, s);
}
function zi(t, e) {
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
function Oc(t, e) {
  return zi(t, Ii(vn, e));
}
const Xm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EULER_ORDERS: Sc,
  clone: Ac,
  copy: _c,
  create: Vi,
  equals: Lc,
  fromQuaternion: Oc,
  fromRotationMatrix: zi,
  set: Ec,
  toMat4: Gc,
  toQuaternion: Uc
}, Symbol.toStringTag, { value: "Module" })), Ot = 1e-12, ot = new Float32Array(3), Dc = new Float32Array(9);
function xe(t = 0, e = 0, n = 1, r = 0) {
  return { normal: new Float32Array([t, e, n]), constant: r };
}
function Ic(t) {
  return { normal: new Float32Array([t.normal[0], t.normal[1], t.normal[2]]), constant: t.constant };
}
function Nn(t, e) {
  return t.normal[0] = e.normal[0], t.normal[1] = e.normal[1], t.normal[2] = e.normal[2], t.constant = e.constant, t;
}
function Vc(t, e, n) {
  return t.normal[0] = e[0], t.normal[1] = e[1], t.normal[2] = e[2], t.constant = n, t;
}
function ki(t, e, n, r, i) {
  return t.normal[0] = e, t.normal[1] = n, t.normal[2] = r, t.constant = i, t;
}
function Nc(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]), i = r < Ot ? 1 : 1 / r;
  return t.normal[0] = e[0] * i, t.normal[1] = e[1] * i, t.normal[2] = e[2] * i, t.constant = -ue(t.normal, n), t;
}
function zc(t, e, n, r) {
  const i = new Float32Array([n[0] - e[0], n[1] - e[1], n[2] - e[2]]), s = new Float32Array([r[0] - e[0], r[1] - e[1], r[2] - e[2]]);
  wi(t.normal, i, s);
  const a = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  return a < Ot ? null : (t.normal[0] = t.normal[0] / a, t.normal[1] = t.normal[1] / a, t.normal[2] = t.normal[2] / a, t.constant = -ue(t.normal, e), t);
}
function Wi(t, e) {
  const n = Math.hypot(e.normal[0], e.normal[1], e.normal[2]);
  if (n < Ot) return null;
  const r = 1 / n;
  return t.normal[0] = e.normal[0] * r, t.normal[1] = e.normal[1] * r, t.normal[2] = e.normal[2] * r, t.constant = e.constant * r, t;
}
function kc(t, e) {
  return t.normal[0] = -e.normal[0], t.normal[1] = -e.normal[1], t.normal[2] = -e.normal[2], t.constant = -e.constant, t;
}
function ce(t, e) {
  return ue(t.normal, e) + t.constant;
}
function Wc(t, e, n) {
  const r = ce(e, n);
  return t[0] = n[0] - e.normal[0] * r, t[1] = n[1] - e.normal[1] * r, t[2] = n[2] - e.normal[2] * r, t;
}
function qi(t, e) {
  return t[0] = e.normal[0] * -e.constant, t[1] = e.normal[1] * -e.constant, t[2] = e.normal[2] * -e.constant, t;
}
function qc(t, e, n) {
  return Nn(t, e), t.constant -= ue(n, e.normal), t;
}
function jc(t, e, n) {
  const r = ce(t, e), i = ce(t, n);
  return r === 0 ? 0 : i === 0 ? 1 : r > 0 == i > 0 ? null : r / (r - i);
}
function Xc(t, e, n) {
  const r = Bn(Dc, n);
  if (!r)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the matrix is singular, so the transformed plane is undefined."
    );
  qi(ot, e), Fn(ot, ot, n), vi(t.normal, e.normal, r);
  const i = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  if (i < Ot)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the transformed normal is degenerate (the matrix collapses the plane)."
    );
  return t.normal[0] = t.normal[0] / i, t.normal[1] = t.normal[1] / i, t.normal[2] = t.normal[2] / i, t.constant = -ue(t.normal, ot), t;
}
function ji(t, e, n = 1e-6) {
  const r = Math.abs(t.normal[0] - e.normal[0]) <= n && Math.abs(t.normal[1] - e.normal[1]) <= n && Math.abs(t.normal[2] - e.normal[2]) <= n && Math.abs(t.constant - e.constant) <= n, i = Math.abs(t.normal[0] + e.normal[0]) <= n && Math.abs(t.normal[1] + e.normal[1]) <= n && Math.abs(t.normal[2] + e.normal[2]) <= n && Math.abs(t.constant + e.constant) <= n;
  return r || i;
}
function Yc(t) {
  return `plane(${t.normal[0]}, ${t.normal[1]}, ${t.normal[2]}, ${t.constant})`;
}
const Ym = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Xc,
  clone: Ic,
  coplanarPoint: qi,
  copy: Nn,
  create: xe,
  distanceToPoint: ce,
  equals: ji,
  intersectLineSegment: jc,
  negate: kc,
  normalize: Wi,
  projectPoint: Wc,
  set: Vc,
  setComponents: ki,
  setFromCoplanarPoints: zc,
  setFromNormalAndCoplanarPoint: Nc,
  toString: Yc,
  translate: qc
}, Symbol.toStringTag, { value: "Module" })), re = new Float32Array(3);
function Hc() {
  return Ae({ min: new Float32Array(3), max: new Float32Array(3) });
}
function Ae(t) {
  return t.min[0] = Number.POSITIVE_INFINITY, t.min[1] = Number.POSITIVE_INFINITY, t.min[2] = Number.POSITIVE_INFINITY, t.max[0] = Number.NEGATIVE_INFINITY, t.max[1] = Number.NEGATIVE_INFINITY, t.max[2] = Number.NEGATIVE_INFINITY, t;
}
function U(t) {
  return t.max[0] < t.min[0] || t.max[1] < t.min[1] || t.max[2] < t.min[2];
}
function Zc(t) {
  return {
    min: new Float32Array([t.min[0], t.min[1], t.min[2]]),
    max: new Float32Array([t.max[0], t.max[1], t.max[2]])
  };
}
function _t(t, e) {
  return t.min[0] = e.min[0], t.min[1] = e.min[1], t.min[2] = e.min[2], t.max[0] = e.max[0], t.max[1] = e.max[1], t.max[2] = e.max[2], t;
}
function Qc(t, e, n) {
  return t.min[0] = e[0], t.min[1] = e[1], t.min[2] = e[2], t.max[0] = n[0], t.max[1] = n[1], t.max[2] = n[2], t;
}
function Kc(t, e, n) {
  const r = n[0] * 0.5, i = n[1] * 0.5, s = n[2] * 0.5;
  return t.min[0] = e[0] - r, t.min[1] = e[1] - i, t.min[2] = e[2] - s, t.max[0] = e[0] + r, t.max[1] = e[1] + i, t.max[2] = e[2] + s, t;
}
function Jc(t, e) {
  Ae(t);
  for (const n of e) zn(t, n);
  return t;
}
function el(t, e, n = 3) {
  Ae(t);
  const r = Math.max(1, Math.trunc(n));
  for (let i = 0; i + 2 < e.length; i += r)
    t.min[0] = Math.min(t.min[0], e[i]), t.min[1] = Math.min(t.min[1], e[i + 1]), t.min[2] = Math.min(t.min[2], e[i + 2]), t.max[0] = Math.max(t.max[0], e[i]), t.max[1] = Math.max(t.max[1], e[i + 1]), t.max[2] = Math.max(t.max[2], e[i + 2]);
  return t;
}
function Xi(t, e) {
  return U(e) || (t[0] = (e.min[0] + e.max[0]) * 0.5, t[1] = (e.min[1] + e.max[1]) * 0.5, t[2] = (e.min[2] + e.max[2]) * 0.5), t;
}
function tl(t, e) {
  return U(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, t) : oe(t, e.max, e.min);
}
function nl(t, e) {
  return U(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, -1) : (Xi(t, e), Math.hypot(e.max[0] - t[0], e.max[1] - t[1], e.max[2] - t[2]));
}
function zn(t, e) {
  return Bt(t.min, t.min, e), Rt(t.max, t.max, e), t;
}
function rl(t, e) {
  return He(t.min, t.min, e), He(t.max, t.max, e), t;
}
function il(t, e) {
  return t.min[0] = t.min[0] - e, t.min[1] = t.min[1] - e, t.min[2] = t.min[2] - e, t.max[0] = t.max[0] + e, t.max[1] = t.max[1] + e, t.max[2] = t.max[2] + e, t;
}
function sl(t, e) {
  return e[0] >= t.min[0] && e[0] <= t.max[0] && e[1] >= t.min[1] && e[1] <= t.max[1] && e[2] >= t.min[2] && e[2] <= t.max[2];
}
function al(t, e) {
  return t.min[0] <= e.min[0] && e.max[0] <= t.max[0] && t.min[1] <= e.min[1] && e.max[1] <= t.max[1] && t.min[2] <= e.min[2] && e.max[2] <= t.max[2];
}
function Yi(t, e) {
  return U(t) || U(e) ? !1 : e.max[0] >= t.min[0] && e.min[0] <= t.max[0] && e.max[1] >= t.min[1] && e.min[1] <= t.max[1] && e.max[2] >= t.min[2] && e.min[2] <= t.max[2];
}
function ol(t, e, n) {
  return U(t) ? !1 : Ft(kn(re, t, e), e) <= n * n;
}
function cl(t, e) {
  if (U(t)) return !1;
  let n = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < 8; i++) {
    re[0] = i & 1 ? t.max[0] : t.min[0], re[1] = i & 2 ? t.max[1] : t.min[1], re[2] = i & 4 ? t.max[2] : t.min[2];
    const s = ce(e, re);
    n = Math.min(n, s), r = Math.max(r, s);
  }
  return n <= 0 && r >= 0;
}
function kn(t, e, n) {
  return U(e) || (t[0] = Math.min(Math.max(n[0], e.min[0]), e.max[0]), t[1] = Math.min(Math.max(n[1], e.min[1]), e.max[1]), t[2] = Math.min(Math.max(n[2], e.min[2]), e.max[2])), t;
}
function ll(t, e) {
  return U(t) ? 0 : Math.sqrt(Ft(kn(re, t, e), e));
}
function ul(t, e, n) {
  return _t(t, e), He(t.min, t.min, n), He(t.max, t.max, n), t;
}
function hl(t, e, n) {
  return U(e) ? _t(t, n) : U(n) ? _t(t, e) : (Bt(t.min, e.min, n.min), Rt(t.max, e.max, n.max), t);
}
function fl(t, e, n) {
  return Yi(e, n) ? (Rt(t.min, e.min, n.min), Bt(t.max, e.max, n.max), t) : Ae(t);
}
function dl(t, e, n) {
  if (U(e)) return Ae(t);
  const r = e.min[0], i = e.min[1], s = e.min[2], a = e.max[0], o = e.max[1], l = e.max[2];
  Ae(t);
  for (let c = 0; c < 8; c++) {
    const h = c & 1 ? a : r, d = c & 2 ? o : i, f = c & 4 ? l : s, p = n[3] * h + n[7] * d + n[11] * f + n[15], m = p === 0 ? 1 : 1 / p;
    re[0] = (n[0] * h + n[4] * d + n[8] * f + n[12]) * m, re[1] = (n[1] * h + n[5] * d + n[9] * f + n[13]) * m, re[2] = (n[2] * h + n[6] * d + n[10] * f + n[14]) * m, zn(t, re);
  }
  return t;
}
function pl(t, e, n) {
  if (St(t.min, e.min, n), St(t.max, e.max, n), n < 0) {
    const r = t.min[0], i = t.min[1], s = t.min[2];
    t.min[0] = t.max[0], t.min[1] = t.max[1], t.min[2] = t.max[2], t.max[0] = r, t.max[1] = i, t.max[2] = s;
  }
  return t;
}
function ml(t, e, n = 1e-6) {
  const r = U(t), i = U(e);
  return r || i ? r === i : Math.abs(t.min[0] - e.min[0]) <= n && Math.abs(t.min[1] - e.min[1]) <= n && Math.abs(t.min[2] - e.min[2]) <= n && Math.abs(t.max[0] - e.max[0]) <= n && Math.abs(t.max[1] - e.max[1]) <= n && Math.abs(t.max[2] - e.max[2]) <= n;
}
function gl(t) {
  return U(t) ? "box3(empty)" : `box3(${t.min[0]}, ${t.min[1]}, ${t.min[2]}) - (${t.max[0]}, ${t.max[1]}, ${t.max[2]})`;
}
const Hm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: dl,
  clampPoint: kn,
  clone: Zc,
  containsBox: al,
  containsPoint: sl,
  copy: _t,
  create: Hc,
  distanceToPoint: ll,
  equals: ml,
  expandByPoint: zn,
  expandByScalar: il,
  expandByVector: rl,
  getBoundingSphere: nl,
  getCenter: Xi,
  getSize: tl,
  intersect: fl,
  intersectsBox: Yi,
  intersectsPlane: cl,
  intersectsSphere: ol,
  isEmpty: U,
  makeEmpty: Ae,
  scaleBox: pl,
  set: Qc,
  setFromArray: el,
  setFromCenterAndSize: Kc,
  setFromPoints: Jc,
  toString: gl,
  translate: ul,
  union: hl
}, Symbol.toStringTag, { value: "Module" }));
function bl(t = 0, e = 0, n = 0, r = 0, i = 0, s = -1) {
  return {
    origin: new Float32Array([t, e, n]),
    direction: new Float32Array([r, i, s])
  };
}
function wl(t) {
  return {
    origin: new Float32Array([t.origin[0], t.origin[1], t.origin[2]]),
    direction: new Float32Array([t.direction[0], t.direction[1], t.direction[2]])
  };
}
function vl(t, e) {
  return t.origin[0] = e.origin[0], t.origin[1] = e.origin[1], t.origin[2] = e.origin[2], t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t;
}
function Dt(t, e, n) {
  t.origin[0] = e[0], t.origin[1] = e[1], t.origin[2] = e[2];
  const r = Math.hypot(n[0], n[1], n[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = n[0] * i, t.direction[1] = n[1] * i, t.direction[2] = n[2] * i, t;
}
function Wn(t, e, n) {
  return t[0] = e.origin[0] + e.direction[0] * n, t[1] = e.origin[1] + e.direction[1] * n, t[2] = e.origin[2] + e.direction[2] * n, t;
}
function xl(t, e, n) {
  const r = e.origin[0], i = e.origin[1], s = e.origin[2];
  return t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t.origin[0] = r + t.direction[0] * n, t.origin[1] = i + t.direction[1] * n, t.origin[2] = s + t.direction[2] * n, t;
}
function Hi(t, e, n) {
  const r = Math.max(0, ue(oe(Qi, n, e.origin), e.direction));
  return Wn(t, e, r);
}
function yl(t, e) {
  return Math.sqrt(Zi(t, e));
}
function Zi(t, e) {
  return Ft(e, Hi(Qi, t, e));
}
const Qi = new Float32Array(3);
function Tl(t, e, n) {
  Fn(t.origin, e.origin, n), xi(t.direction, e.direction, n);
  const r = Math.hypot(t.direction[0], t.direction[1], t.direction[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = t.direction[0] * i, t.direction[1] = t.direction[1] * i, t.direction[2] = t.direction[2] * i, t;
}
function Ki(t, e) {
  const n = ue(e.normal, t.direction);
  if (Math.abs(n) < 1e-12) return null;
  const r = -ce(e, t.origin) / n;
  return r >= 0 ? r : null;
}
function Ji(t, e, n) {
  const r = t.origin[0] - e[0], i = t.origin[1] - e[1], s = t.origin[2] - e[2], a = t.direction[0], o = t.direction[1], l = t.direction[2], c = r * a + i * o + s * l, h = r * r + i * i + s * s - n * n, d = c * c - h;
  if (d < 0) return null;
  const f = Math.sqrt(d), p = -c - f;
  if (p >= 0) return p;
  const m = -c + f;
  return m >= 0 ? m : null;
}
function es(t, e) {
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
function ts(t, e, n, r, i = !1) {
  const s = n[0] - e[0], a = n[1] - e[1], o = n[2] - e[2], l = r[0] - e[0], c = r[1] - e[1], h = r[2] - e[2], d = t.direction[0], f = t.direction[1], p = t.direction[2], m = f * h - p * c, g = p * l - d * h, b = d * c - f * l, w = s * m + a * g + o * b;
  if (i ? w < 1e-12 : Math.abs(w) < 1e-12) return null;
  const T = 1 / w, S = t.origin[0] - e[0], A = t.origin[1] - e[1], _ = t.origin[2] - e[2], M = (S * m + A * g + _ * b) * T;
  if (M < 0 || M > 1) return null;
  const P = A * o - _ * a, I = _ * s - S * o, V = S * a - A * s, N = (d * P + f * I + p * V) * T;
  if (N < 0 || M + N > 1) return null;
  const z = (l * P + c * I + h * V) * T;
  return z >= 0 ? z : null;
}
function $l(t, e, n = 1e-6) {
  return Math.abs(t.origin[0] - e.origin[0]) <= n && Math.abs(t.origin[1] - e.origin[1]) <= n && Math.abs(t.origin[2] - e.origin[2]) <= n && Math.abs(t.direction[0] - e.direction[0]) <= n && Math.abs(t.direction[1] - e.direction[1]) <= n && Math.abs(t.direction[2] - e.direction[2]) <= n;
}
function Sl(t) {
  return `ray(origin: ${t.origin[0]}, ${t.origin[1]}, ${t.origin[2]}; direction: ${t.direction[0]}, ${t.direction[1]}, ${t.direction[2]})`;
}
function Al(t) {
  return Number.isFinite(t.origin[0]) && Number.isFinite(t.origin[1]) && Number.isFinite(t.origin[2]) && Number.isFinite(t.direction[0]) && Number.isFinite(t.direction[1]) && Number.isFinite(t.direction[2]) && gi(t.direction) > 1e-24;
}
const Zm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Tl,
  at: Wn,
  clone: wl,
  closestPointToPoint: Hi,
  copy: vl,
  create: bl,
  distanceToPoint: yl,
  equals: $l,
  intersectBox: es,
  intersectPlane: Ki,
  intersectSphere: Ji,
  intersectTriangle: ts,
  isWellFormed: Al,
  recast: xl,
  set: Dt,
  squaredDistanceToPoint: Zi,
  toString: Sl
}, Symbol.toStringTag, { value: "Module" })), _l = {
  Left: 0,
  Right: 1,
  Bottom: 2,
  Top: 3,
  Near: 4,
  Far: 5
};
function ns() {
  return {
    planes: [
      xe(),
      xe(),
      xe(),
      xe(),
      xe(),
      xe()
    ]
  };
}
function El(t) {
  const e = ns();
  return rs(e, t);
}
function rs(t, e) {
  for (let n = 0; n < 6; n++) Nn(t.planes[n], e.planes[n]);
  return t;
}
function Ll(t, e, n = "gl") {
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
    ki(t.planes[c], h, d, f, p), Wi(t.planes[c], t.planes[c]);
  }
  return t;
}
function Ml(t, e) {
  for (const n of t.planes)
    if (ce(n, e) < 0) return !1;
  return !0;
}
function Pl(t, e, n) {
  for (const r of t.planes)
    if (ce(r, e) < -n) return !1;
  return !0;
}
function Cl(t, e) {
  for (const n of t.planes) {
    const r = n.normal[0], i = n.normal[1], s = n.normal[2], a = r >= 0 ? e.max[0] : e.min[0], o = i >= 0 ? e.max[1] : e.min[1], l = s >= 0 ? e.max[2] : e.min[2];
    if (r * a + i * o + s * l + n.constant < 0) return !1;
  }
  return !0;
}
function Fl(t, e) {
  const n = Bl(t);
  if (!n) return !0;
  let r = !1, i = !1;
  for (const s of n) {
    const a = ce(e, s);
    if (a > 0 ? r = !0 : a < 0 && (i = !0), r && i) return !0;
  }
  return !1;
}
function Bl(t) {
  const [e, n, r, i, s, a] = t.planes, o = [];
  for (const l of [s, a])
    for (const c of [r, i])
      for (const h of [e, n]) {
        const d = Rl(h, c, l);
        if (!d) return null;
        o.push(d);
      }
  return o;
}
function Rl(t, e, n) {
  const r = t.normal[0], i = t.normal[1], s = t.normal[2], a = e.normal[0], o = e.normal[1], l = e.normal[2], c = n.normal[0], h = n.normal[1], d = n.normal[2], f = r * (o * d - l * h) - i * (a * d - l * c) + s * (a * h - o * c);
  if (Math.abs(f) < 1e-12) return null;
  const p = 1 / f, m = -t.constant, g = -e.constant, b = -n.constant;
  return new Float32Array([
    (m * (o * d - l * h) - i * (g * d - l * b) + s * (g * h - o * b)) * p,
    (r * (g * d - l * b) - m * (a * d - l * c) + s * (a * b - g * c)) * p,
    (r * (o * b - g * h) - i * (a * b - g * c) + m * (a * h - o * c)) * p
  ]);
}
function Gl(t, e, n = 1e-6) {
  for (let r = 0; r < 6; r++)
    if (!ji(t.planes[r], e.planes[r], n)) return !1;
  return !0;
}
const Qm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FRUSTUM_PLANE: _l,
  clone: El,
  containsPoint: Ml,
  copy: rs,
  create: ns,
  equals: Gl,
  intersectsBox: Cl,
  intersectsPlane: Fl,
  intersectsSphere: Pl,
  setFromProjectionView: Ll
}, Symbol.toStringTag, { value: "Module" })), Ul = {
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
function Ol(t = 0, e = 0, n = 0, r = 1) {
  return { r: t, g: e, b: n, a: r };
}
function Dl(t) {
  return { r: t.r, g: t.g, b: t.b, a: t.a };
}
function Il(t, e) {
  return t.r = e.r, t.g = e.g, t.b = e.b, t.a = e.a, t;
}
function Vl(t, e, n, r, i = 1) {
  return t.r = e, t.g = n, t.b = r, t.a = i, t;
}
function Nl(t, e, n, r) {
  return t.r = e, t.g = n, t.b = r, t;
}
function zl(t, e, n) {
  const r = Math.trunc(e);
  return t.r = (r >> 16 & 255) / 255, t.g = (r >> 8 & 255) / 255, t.b = (r & 255) / 255, n !== void 0 && (t.a = n), t;
}
function kl(t) {
  const e = (n) => Math.round(Math.min(Math.max(n, 0), 1) * 255);
  return e(t.r) << 16 | e(t.g) << 8 | e(t.b);
}
function Wl(t, e) {
  const n = e.trim().toLowerCase(), r = Ul[n];
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
function ql(t, e = !1) {
  const n = (s) => Math.round(Math.min(Math.max(s, 0), 1) * 255), r = (s) => s.toString(16).padStart(2, "0"), i = `#${r(n(t.r))}${r(n(t.g))}${r(n(t.b))}`;
  return e ? `${i}${r(n(t.a))}` : i;
}
function jl(t, e) {
  return t.r = Math.min(Math.max(e.r, 0), 1), t.g = Math.min(Math.max(e.g, 0), 1), t.b = Math.min(Math.max(e.b, 0), 1), t.a = Math.min(Math.max(e.a, 0), 1), t;
}
function Xl(t, e, n, r) {
  return t.r = e.r + (n.r - e.r) * r, t.g = e.g + (n.g - e.g) * r, t.b = e.b + (n.b - e.b) * r, t.a = e.a + (n.a - e.a) * r, t;
}
function Yl(t, e, n) {
  return t.r = e.r + n.r, t.g = e.g + n.g, t.b = e.b + n.b, t.a = e.a + n.a, t;
}
function Hl(t, e, n) {
  return t.r = e.r * n.r, t.g = e.g * n.g, t.b = e.b * n.b, t.a = e.a * n.a, t;
}
function Zl(t, e, n, r, i = t.a) {
  const s = (e % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), a = Math.min(Math.max(n, 0), 1), o = Math.min(Math.max(r, 0), 1);
  if (a === 0)
    return t.r = o, t.g = o, t.b = o, t.a = i, t;
  const l = o < 0.5 ? o * (1 + a) : o + a - o * a, c = 2 * o - l, h = (f) => {
    let p = f;
    return p < 0 && (p += 1), p > 1 && (p -= 1), p < 1 / 6 ? c + (l - c) * 6 * p : p < 1 / 2 ? l : p < 2 / 3 ? c + (l - c) * (2 / 3 - p) * 6 : c;
  }, d = s / (Math.PI * 2);
  return t.r = h(d + 1 / 3), t.g = h(d), t.b = h(d - 1 / 3), t.a = i, t;
}
function Ql(t, e) {
  const n = Math.max(e.r, e.g, e.b), r = Math.min(e.r, e.g, e.b), i = (r + n) / 2, s = n - r;
  if (s === 0)
    return t[0] = 0, t[1] = 0, t[2] = i, t;
  const a = i <= 0.5 ? s / (n + r) : s / (2 - n - r);
  let o;
  return n === e.r ? o = (e.g - e.b) / s + (e.g < e.b ? 6 : 0) : n === e.g ? o = (e.b - e.r) / s + 2 : o = (e.r - e.g) / s + 4, t[0] = o / 6 * Math.PI * 2, t[1] = a, t[2] = i, t;
}
function Kl(t, e, n = !0) {
  const r = e ?? new Float32Array(n ? 4 : 3);
  return r[0] = t.r, r[1] = t.g, r[2] = t.b, n && r.length >= 4 && (r[3] = t.a), r;
}
function Jl(t, e, n = 0) {
  return t.r = e[n] ?? 0, t.g = e[n + 1] ?? 0, t.b = e[n + 2] ?? 0, e.length > n + 3 && (t.a = e[n + 3]), t;
}
function eu(t, e) {
  const n = (r) => r < 0.04045 ? r * 0.0773993808 : Math.pow(r * 0.9478672986 + 0.0521327014, 2.4);
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function tu(t, e) {
  const n = (r) => r <= 31308e-7 ? r * 12.92 : 1.055 * Math.pow(r, 0.41666) - 0.055;
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function nu(t, e = 1e-6) {
  return t.r >= -e && t.r <= 1 + e && t.g >= -e && t.g <= 1 + e && t.b >= -e && t.b <= 1 + e;
}
function ru(t, e, n = 1e-6) {
  return Math.abs(t.r - e.r) <= n && Math.abs(t.g - e.g) <= n && Math.abs(t.b - e.b) <= n && Math.abs(t.a - e.a) <= n;
}
function iu(t) {
  return `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
}
const Km = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Yl,
  clampColor: jl,
  clone: Dl,
  convertLinearToSRGB: tu,
  convertSRGBToLinear: eu,
  copy: Il,
  create: Ol,
  equals: ru,
  fromArray: Jl,
  getHSL: Ql,
  getHex: kl,
  getStyle: ql,
  isInGamut: nu,
  lerp: Xl,
  multiply: Hl,
  set: Vl,
  setHSL: Zl,
  setHex: zl,
  setRGB: Nl,
  setStyle: Wl,
  toArray: Kl,
  toString: iu
}, Symbol.toStringTag, { value: "Module" })), su = new Float32Array(16), rr = new Float32Array(16), au = { origin: new Float32Array(3), direction: new Float32Array(3) }, Te = new Float32Array(3), Et = new Float32Array(3), ir = new Float32Array(3), sr = new Float32Array(3), is = new Float32Array(3);
function ou(t = 0, e = 0, n = 0, r = -1) {
  return {
    ray: { origin: new Float32Array([t, e, n]), direction: new Float32Array([0, 0, r]) },
    near: 0,
    far: Number.POSITIVE_INFINITY,
    doubleSided: !0
  };
}
function cu(t) {
  return {
    ray: { origin: new Float32Array(t.ray.origin), direction: new Float32Array(t.ray.direction) },
    near: t.near,
    far: t.far,
    doubleSided: t.doubleSided
  };
}
function lu(t, e) {
  return Dt(t.ray, e.ray.origin, e.ray.direction), t.near = e.near, t.far = e.far, t.doubleSided = e.doubleSided, t;
}
function qn(t, e, n) {
  return Dt(t.ray, e, n), t;
}
function uu(t, e, n) {
  return qn(t, e, oe(is, n, e));
}
function hu(t, e, n, r, i = "gl") {
  const s = i === "zo" ? 0 : -1, a = 1;
  return Lt(Te, e, n, s, r), Lt(Et, e, n, a, r), qn(t, Te, oe(is, Et, Te));
}
function Lt(t, e, n, r, i) {
  const s = i[3] * e + i[7] * n + i[11] * r + i[15], a = s === 0 ? 1 : 1 / s;
  return t[0] = (i[0] * e + i[4] * n + i[8] * r + i[12]) * a, t[1] = (i[1] * e + i[5] * n + i[9] * r + i[13]) * a, t[2] = (i[2] * e + i[6] * n + i[10] * r + i[14]) * a, t;
}
function fu(t, e, n) {
  const r = Ji(t.ray, e, n);
  return r !== null && It(t, r) ? r : null;
}
function du(t, e) {
  const n = es(t.ray, e);
  return n !== null && It(t, n) ? n : null;
}
function pu(t, e) {
  const n = Ki(t.ray, e);
  return n !== null && It(t, n) ? n : null;
}
function It(t, e) {
  return e >= t.near && e <= t.far;
}
function ss(t, e, n, r, i = []) {
  i.length = 0;
  const s = r ? gu(au, t.ray, r) : t.ray;
  if (!s) return i;
  const a = Math.floor(e.length / 3), o = Math.floor(n ? n.length / 3 : a / 3), l = !t.doubleSided;
  for (let c = 0; c < o; c++) {
    const h = n ? n[c * 3] ?? 0 : c * 3, d = n ? n[c * 3 + 1] ?? 0 : c * 3 + 1, f = n ? n[c * 3 + 2] ?? 0 : c * 3 + 2;
    if (h >= a || d >= a || f >= a) continue;
    Xt(Et, e, h), Xt(ir, e, d), Xt(sr, e, f);
    const p = ts(s, Et, ir, sr, l);
    if (p === null) continue;
    Wn(Te, s, p);
    const m = new Float32Array([Te[0], Te[1], Te[2]]);
    r && Lt(m, m[0], m[1], m[2], r);
    const g = bi(t.ray.origin, m);
    It(t, g) && i.push({ distance: g, point: m, triangleIndex: c, vertexIndices: [h, d, f] });
  }
  return i.sort((c, h) => c.distance - h.distance), i;
}
function mu(t, e, n, r) {
  const i = ss(t, e, n, r, []);
  return i.length > 0 ? i[0] : null;
}
function gu(t, e, n) {
  const r = Gt(su, n);
  if (!r) return null;
  const i = Lt(
    new Float32Array(3),
    e.origin[0],
    e.origin[1],
    e.origin[2],
    r
  ), s = bu(new Float32Array(3), e.direction, r);
  return Dt(t, i, s);
}
function bu(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, Cn(t, t);
}
function Xt(t, e, n) {
  return t[0] = e[n * 3] ?? 0, t[1] = e[n * 3 + 1] ?? 0, t[2] = e[n * 3 + 2] ?? 0, t;
}
function wu(t, e) {
  return Gt(t, e);
}
function vu(t, e, n) {
  return Q(rr, e, n), Gt(t, rr);
}
const Jm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: cu,
  copy: lu,
  create: ou,
  intersectBox: du,
  intersectPlane: pu,
  intersectSphere: fu,
  intersectTriangles: ss,
  intersectTrianglesFirst: mu,
  inverseProjectionView: wu,
  inverseProjectionViewOf: vu,
  set: qn,
  setFromNdc: hu,
  setFromPoints: uu
}, Symbol.toStringTag, { value: "Module" })), eg = 1e-6, xu = Math.PI / 180, yu = 180 / Math.PI;
function as(t) {
  return t * xu;
}
function tg(t) {
  return t * yu;
}
function Ue(t, e, n) {
  return t < e ? e : t > n ? n : t;
}
function Tu(t, e, n) {
  return e === t ? 0 : Ue((n - t) / (e - t), 0, 1);
}
function ng(t, e, n) {
  return t + (e - t) * n;
}
function rg(t, e, n) {
  const r = Tu(t, e, n);
  return r * r * (3 - 2 * r);
}
function ig(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function os(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function cs(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function $u(t, e, n) {
  if (e === "wgsl") return t.wgsl;
  const r = cs(n);
  return r ? t[r] : void 0;
}
function Su(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function Au(t, e, n, r) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = os(t) === "glsl" ? `请在 \`code\` 里提供 \`${cs(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${r}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${Su(n)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const ls = `#version 300 es
`, us = `precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, sg = ls + us;
function hs(t) {
  const e = t?.preamble ?? !0, n = e === !0 ? us : e === !1 || e === "" ? !1 : e;
  return { version: t?.version ?? !0, preamble: n };
}
const _u = /^\s*#version[^\n]*\n?/, Eu = /^(\s*#version[^\n]*\n?)([\s\S]*)$/;
function Lu(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `#define ${e} ${n ? 1 : 0}` : `#define ${e} ${n}`).join(`
`) : "";
}
function Mu(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `const ${e}: bool = ${n};` : typeof n == "number" ? Number.isInteger(n) ? `const ${e}: i32 = ${n};` : `const ${e}: f32 = ${n};` : `const ${e}: f32 = ${n};`).join(`
`) : "";
}
function Pu(t, e, n = "shader", r) {
  const { version: i, preamble: s } = hs(r), a = Lu(e);
  if (!i && !s && !a) return t;
  let o = "", l = t;
  if (i) {
    const h = /^\s*#version\s+([^\n]*)/.exec(t);
    if (h) {
      const d = h[1].trim();
      if (!/^300\s+es\b/.test(d))
        throw new u(
          `[gpu-device-api] ShaderModule「${n}」声明了 \`#version ${d}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。
（要自己掌控 \`#version\`，可以在 createShaderModule 里传 \`glsl: { version: false }\`。）`
        );
    }
    o = ls, l = t.replace(_u, "");
  } else {
    const h = Eu.exec(t);
    h && (o = h[1], l = h[2]);
  }
  const c = [o];
  return s && c.push(s), a && c.push(`${a}
`), c.push(l.trim()), `${c.join("")}
`;
}
function Cu(t, e) {
  const n = Mu(e);
  return n ? `${n}

${t.trim()}
` : `${t.trim()}
`;
}
function xn(t) {
  const { backend: e, source: n, stage: r, label: i = "shader" } = t, s = os(e), a = $u(n, s, r);
  if (a === void 0)
    throw new u(Au(e, r, n, i));
  return s === "glsl" ? {
    language: s,
    stage: r,
    code: Pu(a, t.defines, i, t.glsl),
    hasPreamble: hs(t.glsl).preamble !== !1
  } : {
    language: s,
    stage: r,
    code: Cu(a, t.defines),
    hasPreamble: !1
  };
}
function ag(t, e, n) {
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
${yn(r)}
`;
  const l = [];
  for (const c of [...s].sort((h, d) => h - d)) {
    l.push(`----- 第 ${c} 行附近 -----`);
    const h = Math.max(1, c - 3), d = Math.min(r.length, c + 3);
    l.push(yn(r.slice(h - 1, d), h));
  }
  return `${i}
${l.join(`
`)}
`;
}
function yn(t, e = 1) {
  const n = String(e + t.length - 1).length;
  return t.map((r, i) => `${String(e + i).padStart(n, " ")} | ${r}`).join(`
`);
}
function og(t) {
  return yn(t.split(`
`));
}
const le = /* @__PURE__ */ new Map();
function Fu(t, e) {
  if (le.has(t))
    throw new u(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return le.set(t, e), e;
}
function cg(t) {
  for (const [e, n] of Object.entries(t)) Fu(e, n);
}
function lg(t, e) {
  return le.set(t, e), e;
}
function ug(t) {
  return le.has(t);
}
function hg(t) {
  return le.get(t);
}
function fg(t) {
  const e = le.get(t);
  if (!e) {
    const n = Bu();
    throw new u(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (n.length > 0 ? `已注册：${n.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function dg(t) {
  return le.delete(t);
}
function Bu() {
  return [...le.keys()].sort();
}
function pg() {
  le.clear();
}
function fs(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const Ru = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, Gu = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, ar = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function mg(t) {
  const e = fs(t), n = [], r = [
    { regex: new RegExp(`${Ru}\\s*${ar}`, "g"), swapped: !1 },
    { regex: new RegExp(`${Gu}\\s*${ar}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of r) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), l = Number(a[s ? 1 : 2]), c = (a[3] ?? "").trim(), h = a[4], d = a[5].trim().replace(/\s+/g, " ");
      n.some((f) => f.group === o && f.binding === l) || n.push(Uu(o, l, c, h, d));
    }
  }
  return n.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function Uu(t, e, n, r, i) {
  let s = "handle", a;
  if (n.startsWith("uniform"))
    s = "uniform";
  else if (n.startsWith("storage")) {
    s = "storage";
    const c = n.split(",").map((h) => h.trim())[1];
    c === "read" ? a = "read" : c === "read_write" ? a = "read_write" : c === "write" && (a = "write");
  }
  const o = Ou(s, i);
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
function Ou(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const or = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, Du = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function Iu(t) {
  const e = fs(t), n = [];
  let r;
  for (or.lastIndex = 0; (r = or.exec(e)) !== null; ) {
    const i = r[1], s = r[2] ?? "", a = r[3];
    let o = null;
    if (i === "compute") {
      const l = Du.exec(s);
      o = l ? [Number(l[1]), Number(l[2] ?? 1), Number(l[3] ?? 1)] : [1, 1, 1];
    }
    n.push({ stage: i, name: a, workgroupSize: o });
  }
  return n;
}
function gg(t, e, n) {
  return Iu(t).find((r) => r.stage === e && r.name === n);
}
function bg(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const Vu = {
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
function Nu(t) {
  return Vu[t] ?? `0x${t.toString(16)}`;
}
const zu = [
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
function ds(t) {
  return zu.includes(t);
}
function ku(t, e) {
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
function Wu(t) {
  return t.uniforms.filter((e) => ds(e.glType));
}
function qu(t, e) {
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
  const r = Wu(t).sort((i, s) => i.name.localeCompare(s.name));
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
class ju {
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
const be = Object.freeze({
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
const Xu = 16777215;
function Yu(t) {
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
    maxElementIndex: Xu,
    maxElementsVertices: B(t, 33001, 2147483647),
    maxElementsIndices: B(t, 33e3, 2147483647)
  };
}
function Hu(t) {
  const e = Yu(t);
  return {
    // WebGL2 没有 1D 纹理，用 2D 上限代替，上层代码读到的是一个安全的正数。
    maxTextureDimension1D: e.maxTextureSize,
    maxTextureDimension2D: e.maxTextureSize,
    maxTextureDimension3D: e.max3dTextureSize,
    maxTextureArrayLayers: e.maxArrayTextureLayers,
    maxBindGroups: be.maxBindGroups,
    maxBindGroupsPlusVertexBuffers: be.maxBindGroupsPlusVertexBuffers,
    maxBindingsPerBindGroup: be.maxBindingsPerBindGroup,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      be.maxDynamicUniformBuffersPerPipelineLayout,
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
    minStorageBufferOffsetAlignment: be.minStorageBufferOffsetAlignment,
    maxVertexBuffers: Math.min(be.maxVertexBuffers, e.maxVertexAttribs),
    maxBufferSize: 2147483647,
    maxVertexAttributes: e.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: e.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: be.maxColorAttachmentBytesPerSample,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}
function Zu(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), e;
}
function Qu(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const n = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", r = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: n, device: r };
}
function Ku(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function Ju(t, e) {
  const n = t.getContext("webgl2", e);
  if (!n)
    throw new u(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return n;
}
class eh {
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
  /** `UNIFORM_BUFFER_OFFSET_ALIGNMENT` 的记忆值（设备常量，见同名方法）。 */
  uniformAlignment = null;
  constructor(e) {
    this.gl = e;
  }
  /** GL 上下文（便于调用方在需要时直接操作）。 */
  get context() {
    return this.gl;
  }
  /**
   * `UNIFORM_BUFFER_OFFSET_ALIGNMENT`（动态偏移的对齐要求）。
   *
   * 它是**设备常量**，但 `getParameter` 是一次同步的 GL 查询：每 draw 每个动态 uniform block
   * 都问一次，在几千 draw 的场景里就是几千次同步查询。这里按 context 记一次。
   */
  uniformBufferOffsetAlignment() {
    if (this.uniformAlignment === null) {
      const e = this.gl.getParameter(this.gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT);
      this.uniformAlignment = Number(e ?? 0) || 0;
    }
    return this.uniformAlignment;
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
    Yt(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
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
    th(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
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
    Yt(this.viewport, [e, n, r, i]) || (this.gl.viewport(e, n, r, i), this.viewport = [e, n, r, i]);
  }
  setScissor(e, n, r, i, s) {
    const a = this.gl;
    this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !Yt(this.scissor, [n, r, i, s]) && (a.scissor(n, r, i, s), this.scissor = [n, r, i, s]);
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
function Yt(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function th(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
const nh = [
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
class rh {
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
    if (Ye(r.size, "BufferDescriptor.size"), r.size % 4 !== 0)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${r.size}。（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）`
      );
    for (const a of nh)
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
    if (Ct(n, "mapAsync 的 offset"), Ye(r, "mapAsync 的 size"), n % 4 !== 0)
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
const ct = 6403, lt = 33319, ih = 6407, Le = 6408, Me = 36244, Pe = 33320, Ce = 36249, Ht = 6402, sh = 34041, we = 5121, Fe = 5120, ut = 5123, Zt = 5122, We = 5125, Qt = 5124, ht = 5126, Kt = 5131, ah = 33640, oh = 34042, ch = 33321, lh = 36756, uh = 33330, hh = 33329, fh = 33332, dh = 33331, ph = 33325, mh = 33323, gh = 36757, bh = 33336, wh = 33335, vh = 33334, xh = 33333, yh = 33326, Th = 33338, $h = 33337, Sh = 33327, Ah = 32856, _h = 35907, Eh = 36759, Lh = 36220, Mh = 36222, Ph = 32857, Ch = 35898, Fh = 33340, Bh = 33339, Rh = 33328, Gh = 36214, Uh = 36216, Oh = 34842, Dh = 36208, Ih = 36226, Vh = 34836, Nh = 33189, zh = 33190, kh = 35056, Wh = 36012;
function y(t, e, n, r, i = {}) {
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
const qh = Object.freeze({
  r8unorm: y(ch, ct, we, 1, { uploadType: "Uint8Array" }),
  r8snorm: y(lh, ct, Fe, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: y(uh, Me, we, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: y(hh, Me, Fe, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: y(fh, Me, ut, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: y(dh, Me, Zt, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: y(ph, ct, Kt, 2, { uploadType: "Uint16Array" }),
  rg8unorm: y(mh, lt, we, 2, { uploadType: "Uint8Array" }),
  rg8snorm: y(gh, lt, Fe, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: y(bh, Pe, we, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: y(wh, Pe, Fe, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: y(vh, Me, We, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: y(xh, Me, Qt, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: y(yh, ct, ht, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: y(Th, Pe, ut, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: y($h, Pe, Zt, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: y(Sh, lt, Kt, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: y(Ah, Le, we, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": y(_h, Le, we, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: y(Eh, Le, Fe, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: y(Lh, Ce, we, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: y(Mh, Ce, Fe, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: y(Ph, Le, ah, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: y(Ch, ih, We, 4, { attachment: !1, uploadType: null }),
  rg32uint: y(Fh, Pe, We, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: y(Bh, Pe, Qt, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: y(Rh, lt, ht, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: y(Gh, Ce, ut, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: y(Uh, Ce, Zt, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: y(Oh, Le, Kt, 8, { uploadType: "Uint16Array" }),
  rgba32uint: y(Dh, Ce, We, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: y(Ih, Ce, Qt, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: y(Vh, Le, ht, 16, { uploadType: "Float32Array" }),
  depth16unorm: y(Nh, Ht, ut, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: y(zh, Ht, We, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": y(kh, sh, oh, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: y(Wh, Ht, ht, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), jh = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function k(t) {
  const e = jh[t];
  if (e)
    throw new u(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const n = qh[t];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return n;
}
function Xh(t) {
  return k(t).attachment;
}
function Yh(t, e) {
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
class ps {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, n) {
    const r = Ln(e, n);
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
function Hh(t, e) {
  if (t === "1d")
    throw new u(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class cr {
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
    const s = En(r.size);
    if (Ye(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new u(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = k(r.format), o = r.dimension ?? vt.D2, l = r.sampleCount ?? 1, c = r.mipLevelCount ?? 1;
    if (l > 1) {
      if (o !== vt.D2 || s.depthOrArrayLayers > 1)
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
    this.label = r.label ?? G("texture"), this.dimension = o, this.format = r.format, this.usage = r.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = c, this.sampleCount = l, this.glTarget = Hh(o, s.depthOrArrayLayers);
    const h = e.createTexture();
    if (!h) throw new u("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = h, e.bindTexture(this.glTarget, h), l > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === vt.D3 ? e.texStorage3D(
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
    const n = new ps(this, e);
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
const Zh = {
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
}, ms = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, Qh = {
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
}, ft = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, lr = {
  front: 1028,
  back: 1029
}, Kh = {
  ccw: 2305,
  cw: 2304
}, Jt = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, ur = {
  nearest: 9728,
  linear: 9729
}, Jh = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, hr = 5121, fr = 5120, dr = 5123, pr = 5122, ef = 5125, tf = 5124, nf = 5126, rf = 5131, sf = {
  float32: { type: nf, normalized: !1, integer: !1 },
  float16: { type: rf, normalized: !1, integer: !1 },
  unorm8: { type: hr, normalized: !0, integer: !1 },
  snorm8: { type: fr, normalized: !0, integer: !1 },
  uint8: { type: hr, normalized: !1, integer: !0 },
  sint8: { type: fr, normalized: !1, integer: !0 },
  unorm16: { type: dr, normalized: !0, integer: !1 },
  snorm16: { type: pr, normalized: !0, integer: !1 },
  uint16: { type: dr, normalized: !1, integer: !0 },
  sint16: { type: pr, normalized: !1, integer: !0 },
  uint32: { type: ef, normalized: !1, integer: !0 },
  sint32: { type: tf, normalized: !1, integer: !0 }
}, af = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function of(t) {
  const e = af.exec(t);
  if (!e)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const n = sf[e[1]];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: $e(t).components,
    type: n.type,
    normalized: n.normalized,
    integer: n.integer
  };
}
function Tt(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return lf(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const n = t;
    return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const cf = {
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
function lf(t) {
  const e = t.trim().toLowerCase(), n = cf[e];
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
class uf {
  label;
  descriptor;
  native;
  gl;
  state;
  _disposed = !1;
  constructor(e, n, r = {}) {
    this.gl = e, this.state = n, this.descriptor = si(r), this.label = r.label ?? G("sampler");
    const i = e.createSampler();
    if (!i) throw new u("[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。");
    this.native = i;
    const s = this.descriptor;
    if (e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, ur[s.minFilter]), e.samplerParameteri(i, e.TEXTURE_MAG_FILTER, ur[s.magFilter]), s.minFilter === "linear" && s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR) : s.minFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_NEAREST) : s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_LINEAR) : e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST), e.samplerParameteri(i, e.TEXTURE_WRAP_S, Jt[s.addressModeU]), e.samplerParameteri(i, e.TEXTURE_WRAP_T, Jt[s.addressModeV]), e.samplerParameteri(i, e.TEXTURE_WRAP_R, Jt[s.addressModeW]), e.samplerParameterf(i, e.TEXTURE_MIN_LOD, s.lodMinClamp), e.samplerParameterf(i, e.TEXTURE_MAX_LOD, s.lodMaxClamp), s.compare !== void 0 ? (e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(i, e.TEXTURE_COMPARE_FUNC, ms[s.compare])) : e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.NONE), s.maxAnisotropy > 1) {
      const a = e.getExtension("EXT_texture_filter_anisotropic");
      if (a) {
        const o = Ku(e);
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
class hf {
  label;
  source;
  defines;
  glsl;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? G("shaderModule"), this.source = ai(e.code), this.defines = e.defines ? { ...e.defines } : {}, this.glsl = e.glsl ? { ...e.glsl } : {};
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
class mr {
  label;
  entries;
  sortedEntries;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? G("bindGroupLayout"), this.sortedEntries = oi(e.entries), this.entries = this.sortedEntries;
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
class ff {
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
class gr {
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
function br(t, e) {
  return `${t}:${e}`;
}
function df(t, e) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((f, p) => {
    const m = [...f].sort((b, w) => b.binding - w.binding), g = m.filter((b) => b.type === R.Sampler || b.type === R.ComparisonSampler);
    for (const b of m)
      switch (i.push(`${p}:${b.binding}:${b.type}:${b.name ?? ""}:${b.buffer?.hasDynamicOffset ? "dyn" : ""}`), b.type) {
        case R.Uniform: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${p} 的 binding ${b.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new u(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          n.set(br(p, b.binding), {
            group: p,
            binding: b.binding,
            name: b.name,
            blockBinding: s++,
            dynamic: b.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: b.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case R.Texture: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${p} 的 binding ${b.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new u(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const w = pf(b, g);
          r.set(br(p, b.binding), {
            group: p,
            binding: b.binding,
            name: b.name,
            unit: a++,
            samplerBinding: w ? w.binding : null,
            samplerName: w ? w.name ?? null : null
          });
          break;
        }
        case R.Sampler:
        case R.ComparisonSampler:
          break;
        case R.Storage:
        case R.ReadOnlyStorage:
          throw new u(
            `[gpu-device-api] group ${p} 的 binding ${b.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case R.StorageTexture:
          throw new u(
            `[gpu-device-api] group ${p} 的 binding ${b.binding} 是 storage texture，WebGL2 不支持。请改用「渲染到纹理 + 采样」的方式。`
          );
        default: {
          const w = b.type;
          throw new u(`[gpu-device-api] 未知的 binding 类型：${String(w)}`);
        }
      }
  });
  const o = new Set(
    [...r.values()].map((f) => f.samplerBinding).filter((f) => f !== null)
  );
  for (const [f, p] of t.entries())
    for (const m of p)
      if ((m.type === R.Sampler || m.type === R.ComparisonSampler) && !o.has(m.binding))
        throw new u(
          `[gpu-device-api] group ${f} 的 sampler binding ${m.binding}` + (m.name ? `（「${m.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  const l = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Set();
  for (const f of n.values())
    Be(l, f.group).push(f), f.dynamic && Be(c, f.group).push(f), d.add(f.group);
  for (const f of r.values())
    Be(h, f.group).push(f), d.add(f.group);
  for (const f of d)
    Be(l, f), Be(c, f), Be(h, f);
  return {
    uniformBlocks: n,
    textures: r,
    uniformBlocksByGroup: l,
    dynamicBlocksByGroup: c,
    texturesByGroup: h,
    requiredGroups: [...d].sort((f, p) => f - p),
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function Be(t, e) {
  let n = t.get(e);
  return n || (n = [], t.set(e, n)), n;
}
function pf(t, e) {
  const n = t.name ?? "", r = e.find((i) => i.name === `${n}_sampler`);
  return r || e.find((i) => i.binding === t.binding + 1);
}
class mf {
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
    const i = df(e, this.limits);
    return this.plans.set(n, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
class gf {
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
    const d = ku(a, c), f = {
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
${bf(n)}`);
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
    const h = n.uniforms.filter((d) => ds(d.glType));
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
          `[gpu-device-api] program「${i}」使用了 sampler（${h.map((d) => `${d.name}: ${Nu(d.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: l };
  }
}
function bf(t) {
  const e = t.split(`
`), n = String(e.length).length;
  return e.map((r, i) => `${String(i + 1).padStart(n, " ")} | ${r}`).join(`
`);
}
function wf(t, e) {
  const n = t.depthStencil, r = n !== void 0 && n.format !== null, i = r && e.depth, s = t.render?.blend, a = t.fragment?.targets, l = a?.find((f) => f?.blend)?.blend ?? s;
  let c = null;
  l && (c = {
    colorSrc: dt(l.color.srcFactor, "color.srcFactor"),
    colorDst: dt(l.color.dstFactor, "color.dstFactor"),
    colorOp: l.color.operation ? ft[l.color.operation] : ft.add,
    alphaSrc: dt(l.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: dt(l.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: l.alpha.operation ? ft[l.alpha.operation] : ft.add
  });
  const h = a?.[0]?.writeMask ?? t.render?.writeMask ?? ae.All, d = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    depthWrite: n?.depthWriteEnabled ?? !0,
    depthCompare: ms[n?.depthCompare ?? "less"],
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
    cullFace: d === "none" ? lr.back : lr[d],
    frontFace: Kh[t.primitive?.frontFace ?? "ccw"]
  };
}
function vf(t, e, n = 0) {
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
function dt(t, e) {
  const n = Qh[t];
  if (n === void 0)
    throw new u(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return n;
}
class xf {
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
    this.label = e.label ?? G("renderPipeline"), this.descriptor = e, this.layout = r, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.program = n, this.plan = r === "auto" ? null : r.bindingPlan ?? null, this.topologyMode = Zh[e.primitive?.topology ?? "triangle-list"];
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
    const n = e.depthFormat ?? null, r = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${n ?? "none"}|${r}|${li(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const h of i) ci(h, this.limits);
    const o = new Set(i.flatMap((h) => h.attributes.map((d) => d.shaderLocation))), l = new Set(this.program.reflection.attributes.map((h) => h.location));
    for (const h of l)
      if (!o.has(h))
        throw new u(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${h}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const c = {
      key: s,
      renderState: wf(this.descriptor, {
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
    this.state.useProgram(this.program.program), vf(this.state, e.renderState, n);
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
    const s = yf(i, n, r), a = e.vertexArrays.get(s);
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
        const m = of(p.format), g = d.offset + p.offset;
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
function yf(t, e, n) {
  const r = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      r.push(`${i}:-`);
      continue;
    }
    Ct(s.offset, "setVertexBuffer 的 offset"), r.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return r.push(`idx:${n ? $f(n) : "-"}`), r.join("|");
}
const wr = /* @__PURE__ */ new WeakMap();
let Tf = 1;
function $f(t) {
  let e = wr.get(t);
  return e === void 0 && (e = Tf++, wr.set(t, e)), e;
}
class Sf {
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
function Af(t, e, n) {
  throw new u(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${n}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function vr(t) {
  return t instanceof ps ? t : Af("texture view", t, "WebGL2TextureView");
}
class _f {
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
    const s = Ef(e.color);
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
    const a = Lf(e.depth);
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
        const [s, a, o, l] = Tt(e.clearColor), c = new Float32Array([s, a, o, l]);
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
    const n = x.RenderAttachment | x.TextureBinding | x.CopySrc | e;
    this.colorTextures = this.colorFormats.map(
      (r, i) => this.options.createTexture(r, this._width, this._height, n, `${this.label}:color${i}`)
    ), this.depthTexture = this.depthFormat === null ? null : this.options.createTexture(
      this.depthFormat,
      this._width,
      this._height,
      x.RenderAttachment | x.TextureBinding,
      `${this.label}:depth`
    ), this.colorViews = this.colorTextures.map((r) => vr(r.createView())), this.depthView = this.depthTexture ? vr(this.depthTexture.createView()) : null;
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
function Ef(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new u("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function Lf(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
const xr = /* @__PURE__ */ new WeakMap();
function jn(t) {
  let e = xr.get(t);
  return e === void 0 && (e = t.getExtension("EXT_debug_marker") ?? null, xr.set(t, e)), e;
}
function gs(t, e) {
  jn(t)?.pushGroupMarkerEXT?.(e);
}
function bs(t) {
  jn(t)?.popGroupMarkerEXT?.();
}
function ws(t, e) {
  jn(t)?.insertEventMarkerEXT?.(e);
}
function yr(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class Tr {
  label;
  dimension = vt.D2;
  format;
  usage;
  width;
  height;
  depthOrArrayLayers = 1;
  mipLevelCount = 1;
  sampleCount;
  native = null;
  aspect;
  destroyed = !1;
  cachedView = null;
  constructor(e, n, r, i, s, a = "canvas:defaultFramebuffer", o = "all") {
    this.width = e, this.height = n, this.format = r, this.sampleCount = i, this.usage = s, this.label = a, this.aspect = o;
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
          aspect: this.aspect
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
class Mf {
  canvas;
  gl;
  _device = null;
  _format;
  _pixelRatio;
  _width;
  _height;
  /** 默认帧缓冲的深度位数；0 表示这次 context 根本没有深度缓冲。 */
  depthBits = 0;
  /** `configure()` 里是否明确要求了深度；`undefined` 表示没表态（不校验）。 */
  depthRequested = void 0;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this._format = e.format ?? "rgba8unorm";
    const n = di(), r = je(e.canvas);
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
        "[gpu-device-api] WebGL2CanvasContext.configure: canvas MSAA is decided by the `antialias` attribute of the GL context, so sampleCount cannot be changed here. Create the device with createDevice({ contextAttributes: { antialias: true } }) instead, or use an offscreen RenderTarget (WebGL2 cannot multisample a texture attachment at all)."
      );
    if (e.format !== void 0 && !Xh(e.format))
      throw new u(
        `[gpu-device-api] canvas 格式「${e.format}」不能作为颜色附件。`
      );
    const n = e.device;
    if (n.native !== this.gl)
      throw new u(
        `[gpu-device-api] 这个 canvas 的 WebGL2 context 不是该 device 持有的那一个。
WebGL2 的 context 是从 canvas 上取的，一个 device 只能服务创建它的那个 canvas；请用 createDevice({ canvas }) 传入同一个 canvas，或为另一个 canvas 单独创建 device。`
      );
    if (this.depthBits = Number(this.gl.getParameter(this.gl.DEPTH_BITS) ?? 0) || 0, this.depthRequested = e.depth, e.depth === !0 && this.depthBits === 0)
      throw new u(
        "[gpu-device-api] WebGL2CanvasContext.configure: depth was requested, but this canvas has no depth buffer (DEPTH_BITS is 0). The depth buffer comes from the GL context attributes, so create the device with createDevice({ contextAttributes: { depth: true } })."
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
    const e = Number(this.gl.getParameter(this.gl.SAMPLES) ?? 1) || 1, n = new Tr(
      this._width,
      this._height,
      this._format,
      e,
      x.RenderAttachment
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
  /**
   * 生成画布渲染通道的附件列表。
   *
   * 默认帧缓冲**自带深度缓冲**（只要创建 context 时 `contextAttributes.depth` 没关掉），
   * 所以这里如实把深度附件报出去 —— 有了它，渲染通道的 `depthFormat` 才不是 `null`，
   * `resolveRenderState()` 才不会把 `DEPTH_TEST` 关掉（关掉之后画布渲染会退化成画家算法）。
   *
   * 深度附件是一张「虚拟深度纹理」：它没有 GL 对象，只表示「framebuffer 0 的深度缓冲」，
   * 渲染通道据此走 `beginDefaultFramebufferPass()` 并用 `gl.clear(DEPTH_BUFFER_BIT)` 清深度。
   */
  createPassDescriptor(e = {}) {
    return { colorAttachments: [
      {
        view: this.getCurrentFrameTarget().view,
        loadOp: e.loadOp ?? "clear",
        storeOp: e.storeOp ?? "store",
        clearValue: e.clearValue
      }
    ], depthStencilAttachment: this.createDepthAttachment(e) };
  }
  dispose() {
    this._device = null;
  }
  /**
   * 默认帧缓冲的深度附件。
   *
   * `depthRequested === false`（调用方明确不要深度）或这次 context 根本没有深度缓冲时返回 `null` ——
   * 上层会据此如实关掉深度测试，而不是让它「看起来开着」。
   */
  createDepthAttachment(e) {
    if (this.depthRequested === !1 || this.depthBits === 0) return null;
    const n = new Tr(
      this._width,
      this._height,
      fi,
      1,
      x.RenderAttachment,
      "canvas:defaultFramebufferDepth",
      "depth-only"
    );
    return {
      view: n.createView({ label: `${n.label}:view` }),
      depthLoadOp: e.depthLoadOp ?? "clear",
      depthStoreOp: e.depthStoreOp ?? "store",
      depthClearValue: e.depthClearValue ?? 1
    };
  }
  applyBackingSize() {
    this.canvas.width = this._width, this.canvas.height = this._height, this._device?.invalidateState();
  }
}
const Pf = [];
class Cf {
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
      if (this.colorFormats = i.map((a) => a.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null, i.some((a) => yr(a.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && yr(e.depthStencilAttachment.view))
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
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(Tt(e));
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
    const i = e.instanceCount ?? 1, s = r.offset + (e.firstIndex ?? 0) * ca(r.format);
    this.beginDraw(n, r), this.gl.drawElementsInstanced(
      n.mode,
      e.indexCount,
      Jh[r.format],
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
  /**
   * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
   * （只影响抓帧工具的分组显示，不影响渲染结果）。
   */
  pushDebugGroup(e) {
    gs(this.gl, e);
  }
  popDebugGroup() {
    bs(this.gl);
  }
  insertDebugMarker(e) {
    ws(this.gl, e);
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
        const s = n.uniformBlocksByGroup.get(r);
        if (s) {
          const o = n.dynamicBlocksByGroup.get(r) ?? Pf, l = o.length > 0 ? this.dynamicOffsets.get(r) : void 0;
          if (o.length > 0 && (l === void 0 || l.length < o.length))
            throw new u(
              `[gpu-device-api] setBindGroup(${r}, ...) 缺少动态偏移：布局里有 ${o.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${l?.length ?? 0} 个偏移值。`
            );
          let c = 0;
          for (const h of s) {
            const d = i.entry(h.binding);
            if (!d)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${h.binding}（布局要求提供 uniform buffer）。`
              );
            const f = d.resource, p = f.buffer, m = f.offset ?? 0;
            if (h.dynamic) {
              const g = this.state.uniformBufferOffsetAlignment(), b = l[c++] ?? 0;
              if (g > 0 && b % g !== 0)
                throw new u(
                  `[gpu-device-api] 动态偏移 ${b} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${g}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
                );
              const w = m + b, T = f.size ?? p.size - w;
              this.state.bindUniformBuffer(h.blockBinding, p.native, w, T);
            } else
              this.state.bindUniformBuffer(h.blockBinding, p.native, 0, -1);
          }
        }
        const a = n.texturesByGroup.get(r);
        if (a)
          for (const o of a) {
            const l = i.entry(o.binding);
            if (!l)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${o.binding}（布局要求提供纹理「${o.name}」）。`
              );
            const c = l.resource.view;
            if (this.assertViewRangeSupported(c), this.state.bindTexture(o.unit, c.target, c.glTexture), o.samplerBinding !== null) {
              const h = i.entry(o.samplerBinding);
              if (!h)
                throw new u(
                  `[gpu-device-api] bind group「${i.label}」缺少 binding ${o.samplerBinding}（纹理「${o.name}」配套的 sampler「${o.samplerName ?? "未命名"}」）。`
                );
              const d = h.resource.sampler;
              this.state.bindSampler(o.unit, d.native);
            }
          }
      }
      this.assertAllGroupsBound(n);
    }
  }
  /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
  assertAllGroupsBound(e) {
    let n = null;
    for (const r of e.requiredGroups)
      this.bindGroups.get(r) || (n ??= []).push(r);
    if (n)
      throw new u(
        `[gpu-device-api] 管线需要 bind group ${n.join("、")}，但本次绘制前没有调用 setBindGroup()。缺少绑定会让着色器读到未定义的数据（画面通常全黑且没有任何报错），所以这里直接拦下。`
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
      const [l, c, h, d] = Tt(a.clearValue);
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
      const [o, l, c, h] = Tt(s.clearValue);
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
const he = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class Ff {
  label = "computePass";
  constructor(e) {
    throw new u(he);
  }
  get ended() {
    return !0;
  }
  setPipeline(e) {
    throw new u(he);
  }
  setBindGroup(e, n, r) {
    throw new u(he);
  }
  dispatchWorkgroups(e, n, r) {
    throw new u(he);
  }
  dispatchWorkgroupsIndirect(e, n) {
    throw new u(he);
  }
  pushDebugGroup(e) {
    throw new u(he);
  }
  popDebugGroup() {
    throw new u(he);
  }
  insertDebugMarker(e) {
    throw new u(he);
  }
  end() {
  }
}
class Bf {
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
    const n = new Cf(e, this.passOptions);
    return this.openPass = n, this.passCount += 1, n;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), new Ff();
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
    const i = this.gl, s = e.buffer, a = n.texture.native, o = n.texture.format, l = k(o), { x: c, y: h, z: d } = pt(n.origin), f = e.bytesPerRow ?? r.width * l.bytesPerPixel, p = r.height, m = new Uint8Array(f * p);
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
    const i = this.gl, s = e.texture, a = k(s.format), o = pi(
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
    const { x: p, y: m } = pt(e.origin);
    i.readPixels(p, m, r.width, r.height, a.format, a.type, l), i.pixelStorei(i.PACK_ALIGNMENT, 4), i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(c), this.state.invalidate(), n.buffer.upload(n.offset ?? 0, l);
  }
  copyTextureToTexture(e, n, r) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = n.texture, o = k(a.format), { x: l, y: c } = pt(e.origin), { x: h, y: d } = pt(n.origin), f = i.createFramebuffer(), p = i.createFramebuffer();
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
  /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
  pushDebugGroup(e) {
    gs(this.gl, e);
  }
  popDebugGroup() {
    bs(this.gl);
  }
  insertDebugMarker(e) {
    ws(this.gl, e);
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
function pt(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function Rf(t) {
  const e = t.colorAttachments.map((r) => r ? $r(r) : "-").join(","), n = t.depthStencilAttachment ? $r(t.depthStencilAttachment) : "-";
  return `${e}|${n}`;
}
function $r(t) {
  const e = t.view, n = e.texture;
  return `${e.label}@${n.label}#${n.width}x${n.height}`;
}
class Gf {
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
    const n = Rf(e), r = this.framebuffers.get(n);
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
class Uf {
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
    a.upload(n, Ta(l));
  }
  writeTexture(e, n, r, i) {
    const s = e.texture, a = k(s.format);
    Yh(s.format, n);
    const o = Sr(e.origin), l = r.bytesPerRow ?? i.width * a.bytesPerPixel, c = this.gl;
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
    const s = n.texture, a = k(s.format), o = this.gl, l = Sr(n.origin);
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
function Sr(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
class Of {
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
        await Df();
      }
    }
  }
}
function Df() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
class If {
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
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? Je("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? G("webgl2Device"), this.limits = hi(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const n = [...e.adapterFeatures], r = new Set(n), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !r.has(a));
    if (i.length > 0)
      throw new u(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${n.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => r.has(a),
      names: n
    }, this.state = new eh(e.gl), this.planCache = new mf({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new gf({ gl: e.gl, state: this.state }), this.framebuffers = new Gf(e.gl), this.queue = new Uf(e.gl, this.state), this.lostPromise = new Promise((a) => {
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
      new rh(this.gl, this.state, e, (n) => {
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new cr(this.gl, this.state, e, () => {
        this.framebuffers.clear();
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, n, r, i, s) {
    return this.track(
      new cr(
        this.gl,
        this.state,
        { format: e, size: { width: n, height: r }, usage: i, label: s },
        () => this.framebuffers.clear()
      )
    );
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new uf(this.gl, this.state, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new hf(e));
  }
  createQuerySet(e) {
    throw this.assertUsable("createQuerySet"), new u(
      `[gpu-device-api] WebGL2 后端暂不支持 query set（「${e.label ?? e.type}」）。WebGL2 的遮挡查询只能同步读回单个样本数，没有查询结果缓冲区的概念。`
    );
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new mr(e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new ff(e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(new gr(e, !1, this));
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const n = e.label ?? "renderPipeline", r = xn({
      backend: "webgl2",
      source: e.vertex.module.source,
      stage: q.Vertex,
      label: n,
      defines: e.vertex.module.defines,
      glsl: e.vertex.module.glsl
    }).code;
    if (!e.fragment)
      throw new u(
        "[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n只写深度时，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    const i = xn({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: q.Fragment,
      label: n,
      defines: e.fragment.module.defines,
      glsl: e.fragment.module.glsl
    }).code, s = this.programs.acquire(n, r, i);
    let a;
    if (e.layout === void 0 || e.layout === "auto") {
      const l = qu(s.reflection, q.Vertex | q.Fragment);
      if (l.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const c = new mr({
          label: `${n}:autoLayout`,
          entries: l
        });
        this.track(c), a = this.track(
          new gr(
            { label: `${n}:autoPipelineLayout`, bindGroupLayouts: [c] },
            !0,
            this
          )
        ), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else
      a = e.layout, this.programs.bindPlan(s, a.bindingPlan);
    const o = new xf(e, s, a, {
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
    return this.assertUsable("createComputePipeline"), new Sf(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    return this.assertUsable("createRenderTarget"), this.track(
      new _f(e, {
        gl: this.gl,
        state: this.state,
        createTexture: (n, r, i, s, a) => this.createAttachmentTexture(n, r, i, s, a)
      })
    );
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new Bf(e, this.gl, this.state, {
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
    return r || (r = new Mf({ gl: this.gl, canvas: e, format: n?.format }), this.canvasContexts.set(e, r)), r.configure({ ...n, device: this }), this.state.invalidate(), r;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new Of(this.gl);
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
      new de(`[gpu-device-api] GL 错误 0x${n.toString(16)}（发生在 ${e} 之后）。`, {
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
      throw new pn(`[gpu-device-api] 设备已 dispose()，不能再调用 ${e}()。`, {
        reason: "destroyed"
      });
  }
}
const Vf = {
  antialias: !0,
  alpha: !1,
  depth: !0,
  stencil: !1,
  premultipliedAlpha: !0,
  preserveDrawingBuffer: !1,
  powerPreference: "high-performance",
  desynchronized: !1
};
class Xn {
  info;
  features;
  limits;
  gl;
  canvas;
  logger;
  device = null;
  constructor(e, n, r, i, s) {
    this.gl = e, this.canvas = n, this.limits = r, this.features = i, this.logger = s;
    const a = Qu(e);
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
    const n = { ...Vf, ...e.contextAttributes }, r = Ju(e.canvas, n), i = Hu(r), s = Zu(r);
    return new Xn(r, e.canvas, i, s, e.logger);
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
    const n = new If({
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
const Yn = Object.freeze({
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
function v(t, e, n, r = {}) {
  const i = e === "depth" || e === "stencil" ? "depth" : e === "uint" ? "uint" : e === "sint" ? "sint" : "float";
  return {
    gpuFormat: Yn[t],
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
const Nf = Object.freeze({
  r8unorm: v("r8unorm", "unorm", 1, { renderable: !0, filterable: !0 }),
  r8snorm: v("r8snorm", "snorm", 1, { filterable: !1 }),
  r8uint: v("r8uint", "uint", 1, { renderable: !0 }),
  r8sint: v("r8sint", "sint", 1, { renderable: !0 }),
  r16uint: v("r16uint", "uint", 2, { renderable: !0 }),
  r16sint: v("r16sint", "sint", 2, { renderable: !0 }),
  r16float: v("r16float", "float", 2, { renderable: !0, filterable: !0 }),
  rg8unorm: v("rg8unorm", "unorm", 2, { renderable: !0, filterable: !0 }),
  rg8snorm: v("rg8snorm", "snorm", 2, {}),
  rg8uint: v("rg8uint", "uint", 2, { renderable: !0 }),
  rg8sint: v("rg8sint", "sint", 2, { renderable: !0 }),
  r32uint: v("r32uint", "uint", 4, { renderable: !0, storage: !0 }),
  r32sint: v("r32sint", "sint", 4, { renderable: !0, storage: !0 }),
  r32float: v("r32float", "float", 4, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rg16uint: v("rg16uint", "uint", 4, { renderable: !0 }),
  rg16sint: v("rg16sint", "sint", 4, { renderable: !0 }),
  rg16float: v("rg16float", "float", 4, { renderable: !0, filterable: !0 }),
  rgba8unorm: v("rgba8unorm", "unorm", 4, { renderable: !0, storage: !0, filterable: !0 }),
  "rgba8unorm-srgb": v("rgba8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgba8snorm: v("rgba8snorm", "snorm", 4, { storage: !0 }),
  rgba8uint: v("rgba8uint", "uint", 4, { renderable: !0, storage: !0 }),
  rgba8sint: v("rgba8sint", "sint", 4, { renderable: !0, storage: !0 }),
  bgra8unorm: v("bgra8unorm", "unorm", 4, {
    renderable: !0,
    filterable: !0,
    storageFeature: "bgra8unorm-storage"
  }),
  "bgra8unorm-srgb": v("bgra8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgb9e5ufloat: v("rgb9e5ufloat", "float", 4, {}),
  rgb10a2unorm: v("rgb10a2unorm", "unorm", 4, { renderable: !0, filterable: !0 }),
  rg11b10ufloat: v("rg11b10ufloat", "float", 4, { renderFeature: "rg11b10ufloat-renderable" }),
  rg32uint: v("rg32uint", "uint", 8, { renderable: !0, storage: !0 }),
  rg32sint: v("rg32sint", "sint", 8, { renderable: !0, storage: !0 }),
  rg32float: v("rg32float", "float", 8, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rgba16uint: v("rgba16uint", "uint", 8, { renderable: !0, storage: !0 }),
  rgba16sint: v("rgba16sint", "sint", 8, { renderable: !0, storage: !0 }),
  rgba16float: v("rgba16float", "float", 8, { renderable: !0, storage: !0, filterable: !0 }),
  rgba32uint: v("rgba32uint", "uint", 16, { renderable: !0, storage: !0 }),
  rgba32sint: v("rgba32sint", "sint", 16, { renderable: !0, storage: !0 }),
  rgba32float: v("rgba32float", "float", 16, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  depth16unorm: v("depth16unorm", "depth", 2, {
    depthStencilAttachment: !0,
    filterable: !0
  }),
  // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
  // 因此没有确定的内存布局：既不能采样，也不能拷贝。
  depth24plus: v("depth24plus", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  "depth24plus-stencil8": v("depth24plus-stencil8", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  depth32float: v("depth32float", "depth", 4, {
    depthStencilAttachment: !0,
    filterFeature: "float32-filterable"
  }),
  stencil8: v("stencil8", "stencil", 1, {
    depthStencilAttachment: !0,
    sampleable: !1
  })
});
function _e(t) {
  const e = Nf[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function K(t) {
  const e = Yn[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function zf(t) {
  for (const [e, n] of Object.entries(Yn))
    if (n === t) return e;
  throw new u(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function vs(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function Vt(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function kf(t, e) {
  const n = _e(t);
  return n.filterable ? !0 : n.filterFeature && e ? e.has(n.filterFeature) : !1;
}
function Wf(t, e, n) {
  const r = _e(t);
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
function qf(t, e, n = !1) {
  const r = _e(t);
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
function xs(t, e, n) {
  const r = _e(t);
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
function jf(t, e) {
  if (!_e(t).copyable)
    throw new u(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function Xf(t, e, n) {
  if (e !== "all") {
    if (e === "depth-only" && !vs(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !Vt(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function Yf(t, e, n, r) {
  _e(t);
  const i = n.sampleCount ?? 1;
  if (e & x.RenderAttachment && Wf(t, n.features, r), e & x.TextureBinding && qf(t, r, i > 1), e & x.StorageBinding && xs(t, n.features, r), e & (x.CopySrc | x.CopyDst) && jf(t, r), i > 1) {
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
    if (e & (x.CopySrc | x.CopyDst))
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture cannot be a copy source or destination; resolve it into a single-sampled texture first.`
      );
    if (e & (x.TextureBinding | x.StorageBinding))
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture can only be used as a render attachment.`
      );
  }
}
const Hf = [
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
], Zf = Object.freeze({
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
function Hn() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function Ar() {
  return Hn() !== null;
}
async function Qf(t = {}) {
  const e = Hn();
  if (!e) return null;
  const n = {};
  return t.powerPreference !== void 0 && (n.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (n.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (n.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (n.xrCompatible = t.xrCompatible), e.requestAdapter(n);
}
function Kf(t) {
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
function ys(t) {
  const e = t ?? {}, n = {};
  for (const r of Hf) {
    const i = e[r];
    n[r] = typeof i == "number" && Number.isFinite(i) ? i : Zf[r];
  }
  return n;
}
function Jf(t) {
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
function ed(t, e, n) {
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
class td {
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
function _r() {
  const t = Hn();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function nd(t) {
  const e = K(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new u(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function rd(t) {
  const n = t.getContext.call(t, "webgpu");
  return !n || typeof n.getCurrentTexture != "function" ? null : n;
}
const en = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, mt = {
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
}, qe = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, Er = {
  READ: 1,
  WRITE: 2
};
function id(t) {
  if (!Number.isInteger(t))
    throw new u(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new u(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & q.Vertex && (e |= en.VERTEX), t & q.Fragment && (e |= en.FRAGMENT), t & q.Compute && (e |= en.COMPUTE), e === 0)
    throw new u(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function sd(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new u(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & ae.Red && (e |= mt.RED), t & ae.Green && (e |= mt.GREEN), t & ae.Blue && (e |= mt.BLUE), t & ae.Alpha && (e |= mt.ALPHA), e;
}
function ad(t) {
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
function Ts(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new u(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & x.CopySrc && (e |= qe.COPY_SRC), t & x.CopyDst && (e |= qe.COPY_DST), t & x.TextureBinding && (e |= qe.TEXTURE_BINDING), t & x.StorageBinding && (e |= qe.STORAGE_BINDING), t & x.RenderAttachment && (e |= qe.RENDER_ATTACHMENT), e;
}
function od(t) {
  switch (t) {
    case "read":
      return Er.READ;
    case "write":
      return Er.WRITE;
    default:
      return L(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function cd(t) {
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
function ld(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function $s(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return L(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
  }
}
function Zn(t) {
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
function tn(t) {
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
function Lr(t) {
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
function ud(t) {
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
function nn(t) {
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
function Mr(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return L(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function hd(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return L(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function fd(t) {
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
function dd(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return L(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function rn(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return L(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function sn(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return L(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function Tn(t) {
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
function Qn(t) {
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
function pd(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return L(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function md(t) {
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
function gd(t) {
  switch (t) {
    case mn.Occlusion:
      return "occlusion";
    case mn.Timestamp:
      return "timestamp";
    default:
      return L(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function bd(t) {
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
function wd(t) {
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
function vd(t) {
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
function xd(t) {
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
function yd(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return L(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const Td = {
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
}, $d = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, Sd = /^rgba?\(([^)]*)\)$/;
function Ss(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return _d(t);
  if (typeof t == "number") return Ad(t);
  if (Array.isArray(t)) {
    const n = t;
    if (n.length !== 3 && n.length !== 4)
      throw new u(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${n.length}.`
      );
    return Pr(n[0], n[1], n[2], n.length === 4 ? n[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new u(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return Pr(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function Pr(t, e, n, r, i) {
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
function Ad(t) {
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
function _d(t) {
  const e = t.trim().toLowerCase(), n = $d.exec(e);
  if (n) {
    const s = n[1];
    if (s.length === 3 || s.length === 4) {
      const h = parseInt(s[0] + s[0], 16) / 255, d = parseInt(s[1] + s[1], 16) / 255, f = parseInt(s[2] + s[2], 16) / 255, p = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: h, g: d, b: f, a: p };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, l = parseInt(s.slice(4, 6), 16) / 255, c = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: l, a: c };
  }
  const r = Td[e];
  if (r) return { r: r[0], g: r[1], b: r[2], a: r[3] };
  const i = Sd.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((h) => h.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new u(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = an(s[0], t), o = an(s[1], t), l = an(s[2], t), c = s.length === 4 ? Ed(s[3], t) : 1;
    return { r: a, g: o, b: l, a: c };
  }
  throw new u(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function an(t, e) {
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
function Ed(t, e) {
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
function Ie(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function As(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function Ld(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function tt(t, e) {
  if (t !== 1 && t !== 4)
    throw new u(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class _s {
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
    if (this.device = e, this.label = n.label ?? `buffer#${e.nextResourceId("buffer")}`, Ye(n.size, "BufferDescriptor.size"), n.size % 4 !== 0)
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
      usage: ad(n.usage)
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
    this.assertRange(n, i, "Buffer.mapAsync"), await this.native.mapAsync(od(e), n, i), this._mapped = !0;
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
    if (Ct(e, `${r} offset`), Ye(n, `${r} size`), e + n > i) {
      const s = i === this.size ? `buffer "${this.label}" size ${this.size}` : `mapped range size ${i} of buffer "${this.label}"`;
      throw new u(
        `[gpu-device-api] ${r}: range [${e}, ${e + n}) exceeds ${s}.`
      );
    }
  }
}
function Md(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function D(t, e) {
  if (t instanceof _s) return t.native;
  if (Md(t)) return t;
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
class Kn {
  label;
  texture;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, n = {}) {
    this.texture = e;
    const r = Ln(e, n);
    this.label = n.label ?? `${e.label}#view`;
    const i = r.aspect;
    if (Xf(e.format, i, `Texture "${e.label}".createView`), r.baseMipLevel + r.mipLevelCount > e.mipLevelCount)
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
      dimension: Tn(r.dimension),
      aspect: Qn(r.aspect),
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
function Es(t) {
  return t instanceof Kn;
}
function Pd(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function Xe(t, e) {
  if (t instanceof Kn) return t.native;
  if (Pd(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${te(t)}.`
  );
}
class me {
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
    const r = En(n.size), i = {
      label: n.label ?? `texture#${e.nextResourceId("texture")}`,
      size: r,
      mipLevelCount: n.mipLevelCount ?? 1,
      sampleCount: n.sampleCount ?? 1,
      dimension: n.dimension ?? "2d",
      format: n.format,
      usage: n.usage,
      viewFormats: n.viewFormats ?? []
    };
    Fd(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: r.width, height: r.height, depthOrArrayLayers: r.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: K(i.format),
      usage: Ts(i.usage),
      viewFormats: i.viewFormats.map((a) => K(a))
    });
    return new me(e, s, i, !0);
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
      format: r.format ?? zf(n.format),
      usage: r.usage ?? n.usage,
      viewFormats: r.viewFormats ?? []
    };
    return new me(e, n, a, i.owned ?? !1);
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
    const n = Cd(Ln(this, e)), r = this.viewCache.get(n);
    if (r) return r;
    const i = new Kn(this, e);
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
function Cd(t) {
  return ui(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect
  );
}
function Fd(t, e) {
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
  const s = ma(t.size);
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
  Yf(
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
function Cr(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function Ls(t, e) {
  if (t instanceof me) return t.native;
  if (Cr(t)) return t;
  const n = t?.native;
  if (n !== void 0 && Cr(n)) return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${te(t)}.`
  );
}
class Jn {
  label;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, n = {}) {
    this.label = n.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const r = si(n);
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
      addressModeU: nn(r.addressModeU),
      addressModeV: nn(r.addressModeV),
      addressModeW: nn(r.addressModeW),
      magFilter: Mr(r.magFilter),
      minFilter: Mr(r.minFilter),
      mipmapFilter: hd(r.mipmapFilter),
      lodMinClamp: r.lodMinClamp,
      lodMaxClamp: r.lodMaxClamp,
      maxAnisotropy: r.maxAnisotropy
    };
    r.compare !== void 0 && (i.compare = Zn(r.compare)), this.native = e.native.createSampler(i);
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
function Bd(t) {
  return t instanceof Jn;
}
function Rd(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function Gd(t, e) {
  if (t instanceof Jn) return t.native;
  if (Rd(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class Ms {
  label;
  source;
  defines;
  /** GLSL 自动包装开关：WGSL 没有版本指令与精度前言，这里只保存不生效。 */
  glsl;
  device;
  modulesByStage = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, n) {
    if (this.device = e, this.label = n.label ?? `shader#${e.nextResourceId("shader")}`, this.source = ai(n.code), this.defines = { ...n.defines ?? {} }, this.glsl = n.glsl ? { ...n.glsl } : {}, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
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
      defines: this.defines,
      glsl: this.glsl
      // WGSL 用不到，传下去只是让 request 与 module 保持一致
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
  if (t instanceof Ms) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${te(t)}.`
  );
}
const Fr = "timestamp-query";
class Ps {
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
    if (n.type === mn.Timestamp && !e.features.has(Fr))
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${Fr}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    this.type = n.type, this.count = n.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: gd(n.type),
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
function Cs(t, e) {
  if (t instanceof Ps) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const n = t;
    if (typeof n.destroy == "function" && typeof n.count == "number")
      return t;
  }
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
class Fs {
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
      r = oi(n.entries);
    } catch (s) {
      throw new u(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = r, this.entries = n.entries, this.byBinding = new Map(r.map((s) => [s.binding, s]));
    const i = r.map(
      (s) => Ud(s, e, this.label)
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
function Ud(t, e, n) {
  const r = `BindGroupLayout "${n}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: id(t.visibility)
  };
  if (ri(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new u(
        `[gpu-device-api] ${r}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: bd(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (ii(t.type)) {
    const s = t.sampler ?? {}, a = wd(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : yd(s.type)
    }, i;
  }
  if (t.type === R.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new u(
        `[gpu-device-api] ${r}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: vd(a),
      viewDimension: Tn(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === R.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new u(
        `[gpu-device-api] ${r}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return xs(s.format, e.features, r), i.storageTexture = {
      access: xd(s.access ?? "write-only"),
      format: K(s.format),
      viewDimension: Tn(s.viewDimension ?? "2d")
    }, i;
  }
  throw new u(
    `[gpu-device-api] ${r}: unsupported BindingType "${String(t.type)}".`
  );
}
function Bs(t, e) {
  if (t instanceof Fs) return t.native;
  if (Od(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function Od(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class Rs {
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
    const r = Bs(this.layout, `BindGroup "${this.label}"`), i = n.entries.map(
      (s) => Dd(s, this.layout, e, this.label)
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
function Dd(t, e, n, r) {
  const i = `BindGroup "${r}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new u(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (ri(s.type)) {
    if (!("buffer" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${te(a)}.`
      );
    const o = D(a.buffer, i), l = a.offset ?? 0, c = a.size ?? a.buffer.size - l;
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
  if (ii(s.type)) {
    if (!("sampler" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${te(a)}.`
      );
    const o = a.sampler, l = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (Bd(o)) {
      if (l && !o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!l && o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: Gd(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${te(a)}.`
      );
    return Id(a.view, s, n, i), { binding: t.binding, resource: Xe(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${te(a)}.`
      );
    if (Es(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && K(a.view.format) !== K(o))
        throw new u(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: Xe(a.view, i) };
  }
  if ("source" in a)
    return { binding: t.binding, resource: a.source };
  throw new u(
    `[gpu-device-api] ${i}: unsupported binding resource ${te(a)}.`
  );
}
function Id(t, e, n, r) {
  if (!Es(t)) return;
  const i = e.texture ?? {}, s = t.format, a = _e(s), o = i.sampleType ?? "float";
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
    if (o === "float" && !kf(s, n.features))
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
function Gs(t, e, n, r) {
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
function Us(t, e) {
  if (t instanceof Rs) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class Ze {
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
        (s) => Bs(s, `PipelineLayout "${r}"`)
      )
    });
    return new Ze(r, n.bindGroupLayouts, i, !1);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new Ze(e, [], "auto", !0);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function Os(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof Ze) return t.native;
  const n = t.native;
  if (n === "auto") return "auto";
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const Vd = "uint32";
class ye {
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
    const r = e?.topology ?? Wt.topology, i = {
      topology: cd(r),
      frontFace: dd(e?.frontFace ?? Wt.frontFace),
      cullMode: fd(e?.cullMode ?? Wt.cullMode)
    };
    if (ld(r))
      i.stripIndexFormat = $s(e?.stripIndexFormat ?? Vd);
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
    const r = vs(e), i = Vt(e);
    if (!r && !i)
      throw new u(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: K(e) };
    return r && (s.depthWriteEnabled = n?.depthWriteEnabled ?? tr.depthWriteEnabled, s.depthCompare = Zn(n?.depthCompare ?? tr.depthCompare)), i && (s.stencilFront = Rr(n?.stencilFront), s.stencilBack = Rr(n?.stencilBack), s.stencilReadMask = n?.stencilReadMask ?? 4294967295, s.stencilWriteMask = n?.stencilWriteMask ?? 4294967295), n?.depthBias !== void 0 && (s.depthBias = n.depthBias), n?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = n.depthBiasSlopeScale), n?.depthBiasClamp !== void 0 && (s.depthBiasClamp = n.depthBiasClamp), s;
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, n) {
    const r = tt(e?.count ?? n, "MultisampleState.count"), i = { count: r, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
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
        color: Br(e.color),
        alpha: Br(e.alpha)
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
      l && (o.blend = ye.toGPUBlendState(l));
      const c = a?.writeMask ?? r.writeMask;
      return c !== void 0 && (o.writeMask = sd(c)), o;
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
        ci(r, n);
      } catch (i) {
        throw new u(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: r.arrayStride,
        stepMode: pd(r.stepMode ?? "vertex"),
        attributes: r.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: md(i.format)
        }))
      };
    });
  }
}
function Br(t) {
  const e = { ...ba, ...t };
  return {
    operation: ud(e.operation ?? "add"),
    srcFactor: Lr(e.srcFactor),
    dstFactor: Lr(e.dstFactor)
  };
}
function Rr(t) {
  return {
    compare: Zn(t?.compare ?? at.compare),
    failOp: tn(t?.failOp ?? at.failOp),
    depthFailOp: tn(t?.depthFailOp ?? at.depthFailOp),
    passOp: tn(t?.passOp ?? at.passOp)
  };
}
class Nd {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, n) {
    this.cache = va(e, (r, i) => {
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
function Gr(t) {
  return ui(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    li(t.vertexLayouts)
  );
}
const zd = "vsMain", kd = "fsMain";
class Ds {
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
    this.device = e, this.descriptor = n, this.label = n.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`, this.layout = n.layout ?? "auto", this.vertexLayouts = n.vertex.buffers ?? null, this.logger = Je(`webgpu:${this.label}`), this.cache = new Nd(64, (r, i) => {
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
    return this.cache.resolve(Gr(n), () => this.createNative(n));
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
    const n = this.descriptor, r = e.colorFormats ?? this.defaultColorFormats(), i = tt(
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
    return this.logger.debug(`creating render pipeline variant ${Gr(e)}`), this.device.native.createRenderPipeline(n);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const n = this.descriptor, r = this.device.limits, i = n.vertex, a = {
      module: $n(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(q.Vertex),
      entryPoint: i.entryPoint ?? zd,
      buffers: ye.toGPUVertexBufferLayouts(e.vertexLayouts, r)
    }, o = n.fragment;
    let l;
    o && (l = {
      module: $n(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(q.Fragment),
      entryPoint: o.entryPoint ?? kd,
      targets: ye.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: n.render?.blend,
        writeMask: n.render?.writeMask
      })
    });
    const c = n.primitive ?? n.render?.primitive, h = n.depthStencil ?? n.render?.depthStencil, d = n.multisample ?? n.render?.multisample, f = e.depthFormat, p = {
      label: this.label,
      layout: Os(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: ye.toGPUPrimitiveState(c, this.device.features),
      multisample: ye.toGPUMultisampleState(d, e.sampleCount)
    };
    return l && (p.fragment = l), f !== null ? p.depthStencil = ye.toGPUDepthStencilState(f, h) : h && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), p;
  }
}
function Wd(t, e, n) {
  if (t instanceof Ds) return t.resolve(n);
  const r = t?.native;
  if (r && typeof r == "object" && typeof r.getBindGroupLayout == "function")
    return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const qd = "csMain";
class Is {
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
      layout: Os(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(q.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? qd
      }
    }), this._native;
  }
  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose() {
    this._disposed || (this._disposed = !0, this._native = null);
  }
}
function jd(t, e) {
  if (t instanceof Is) return t.resolve();
  const n = t?.native;
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const Xd = [0, 0, 0, 1];
class Vs {
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
    const r = Yd(n.color);
    if (this.colorFormatsList = r, this.depthFormatValue = n.depth === void 0 || n.depth === !1 || n.depth === null ? null : n.depth === !0 ? "depth24plus" : n.depth, this.sampleCountValue = tt(n.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = n.mipLevelCount ?? 1, this.baseUsage = n.usage ?? 0, this.sampled = n.sampled ?? !1, this._width = gt(n.width, "width", this.label), this._height = gt(n.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !oa(this.depthFormatValue))
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
    const r = gt(e, "width", this.label), i = gt(n, "height", this.label);
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
      const i = this.sampled ? x.TextureBinding : x.None;
      return this.device.createTexture({
        label: `${this.label}#color${r}`,
        size: e,
        format: n,
        usage: x.RenderAttachment | i | this.baseUsage,
        mipLevelCount: this.mipLevelCountValue
      });
    }), this.colorViews = this.colorTextures.map((n) => n.createView({ label: `${n.label}#view` })), this.sampleCountValue > 1 && (this.multisampleTextureList = this.colorFormatsList.map(
      (n, r) => this.device.createTexture({
        label: `${this.label}#msaa${r}`,
        size: e,
        format: n,
        usage: x.RenderAttachment,
        sampleCount: this.sampleCountValue
      })
    ), this.multisampleViews = this.multisampleTextureList.map(
      (n) => n.createView({ label: `${n.label}#view` })
    )), this.depthFormatValue !== null && (this.depthTexture = this.device.createTexture({
      label: `${this.label}#depth`,
      size: e,
      format: this.depthFormatValue,
      usage: x.RenderAttachment | this.baseUsage,
      sampleCount: this.sampleCountValue
    }), this.depthView = this.depthTexture.createView({ label: `${this.depthTexture.label}#view` }));
  }
  releaseTextures() {
    for (const e of this.colorTextures) e.destroy();
    for (const e of this.multisampleTextureList) e.destroy();
    this.depthTexture?.destroy(), this.colorTextures = [], this.colorViews = [], this.multisampleTextureList = [], this.multisampleViews = [], this.depthTexture = null, this.depthView = null;
  }
  buildAttachments(e, n, r) {
    const i = r === void 0 ? Xd : r;
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
    return Vt(this.depthFormatValue) && (r.stencilLoadOp = e ?? "clear", r.stencilStoreOp = "store", r.stencilClearValue = 0, r.stencilReadOnly = !1), r;
  }
}
function Yd(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function gt(t, e, n) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] RenderTarget "${n}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function Hd(t) {
  const e = t.label ?? "renderPass";
  let n, r;
  if (t.target) {
    if (!(t.target instanceof Vs))
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
    const h = Xe(c.view, `${e}.colorAttachments`), d = c.view.texture;
    i.push(c.view.descriptor.format ?? d.format), a.push(d.sampleCount);
    const f = c.loadOp ?? "clear", p = c.storeOp ?? "store";
    if (d.sampleCount > 1 && !c.resolveTarget && p !== "discard")
      throw new u(
        `[gpu-device-api] ${e}: a multisampled color attachment (sampleCount ${d.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const m = {
      view: h,
      loadOp: rn(f),
      storeOp: sn(p)
    };
    c.resolveTarget && (m.resolveTarget = Xe(c.resolveTarget, `${e}.resolveTarget`)), f === "clear" && (m.clearValue = Ss(c.clearValue)), s.push(m);
  }
  const o = { label: e, colorAttachments: s };
  let l = null;
  if (r) {
    const c = Xe(r.view, `${e}.depthStencilAttachment`), h = r.view.descriptor.format ?? r.view.texture.format;
    l = h, a.push(r.view.texture.sampleCount);
    const d = { view: c }, f = r.depthLoadOp ?? "clear", p = r.depthStoreOp ?? "store";
    if (d.depthLoadOp = rn(f), d.depthStoreOp = sn(p), f === "clear" && (d.depthClearValue = Qd(r.depthClearValue ?? 1, e)), r.depthReadOnly !== void 0 && (d.depthReadOnly = r.depthReadOnly), Vt(h)) {
      const m = r.stencilLoadOp ?? f;
      d.stencilLoadOp = rn(m), d.stencilStoreOp = sn(r.stencilStoreOp ?? "store"), m === "clear" && (d.stencilClearValue = r.stencilClearValue ?? 0), r.stencilReadOnly !== void 0 && (d.stencilReadOnly = r.stencilReadOnly);
    } else if (r.stencilLoadOp !== void 0 || r.stencilStoreOp !== void 0)
      throw new u(
        `[gpu-device-api] ${e}: depth format "${h}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    o.depthStencilAttachment = d;
  }
  return t.occlusionQuerySet && (o.occlusionQuerySet = Cs(t.occlusionQuerySet, `${e}.occlusionQuerySet`)), {
    native: o,
    layout: {
      colorFormats: i,
      depthFormat: l,
      sampleCount: Zd(a, e)
    }
  };
}
function Zd(t, e) {
  if (t.length === 0) return 1;
  const n = t[0];
  for (const r of t)
    if (r !== n)
      throw new u(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return n;
}
function Qd(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new u(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class Kd {
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
      Wd(e, `RenderPass "${this.label}".setPipeline`, {
        colorFormats: this.layout.colorFormats,
        sampleCount: this.layout.sampleCount,
        depthFormat: this.layout.depthFormat
      })
    );
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Gs(n, r, this.device, `RenderPass "${this.label}".setBindGroup`), this.native.setBindGroup(
        e,
        Us(n, `RenderPass "${this.label}".setBindGroup`),
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
    this.native.setVertexBuffer(e, D(n, `RenderPass "${this.label}".setVertexBuffer`), r, i);
  }
  setIndexBuffer(e, n, r, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      D(e, `RenderPass "${this.label}".setIndexBuffer`),
      $s(n),
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
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(Ss(e));
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
    const r = Ur(e, n, `RenderPass "${this.label}".drawIndirect`);
    this.native.drawIndirect(r.buffer, r.offset);
  }
  drawIndexedIndirect(e, n = 0) {
    this.assertOpen("drawIndexedIndirect");
    const r = Ur(e, n, `RenderPass "${this.label}".drawIndexedIndirect`);
    this.native.drawIndexedIndirect(r.buffer, r.offset);
  }
  /** 调试分组：直接转发给原生的 `GPURenderPassEncoder`（抓帧工具据此分组显示）。 */
  pushDebugGroup(e) {
    this.assertOpen("pushDebugGroup"), this.native.pushDebugGroup(e);
  }
  popDebugGroup() {
    this.assertOpen("popDebugGroup"), this.native.popDebugGroup();
  }
  insertDebugMarker(e) {
    this.assertOpen("insertDebugMarker"), this.native.insertDebugMarker(e);
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
function Ur(t, e, n) {
  return "indirectBuffer" in t ? {
    buffer: D(t.indirectBuffer, n),
    offset: t.indirectOffset ?? 0
  } : { buffer: D(t, n), offset: e };
}
function Jd(t) {
  const e = t?.label ?? "computePass", n = { label: e };
  if (t?.timestampWrites) {
    const r = t.timestampWrites;
    n.timestampWrites = {
      querySet: Cs(r.querySet, `${e}.timestampWrites.querySet`),
      beginningOfPassWriteIndex: r.beginningOfPassWriteIndex,
      endOfPassWriteIndex: r.endOfPassWriteIndex
    };
  }
  return n;
}
class ep {
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
    this.assertOpen("setPipeline"), this.native.setPipeline(jd(e, `ComputePass "${this.label}".setPipeline`));
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Gs(n, r, this.device, `ComputePass "${this.label}".setBindGroup`), this.native.setBindGroup(
        e,
        Us(n, `ComputePass "${this.label}".setBindGroup`),
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
        D(e.indirectBuffer, r),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(D(e, r), n);
  }
  /** 调试分组：直接转发给原生的 `GPUComputePassEncoder`。 */
  pushDebugGroup(e) {
    this.assertOpen("pushDebugGroup"), this.native.pushDebugGroup(e);
  }
  popDebugGroup() {
    this.assertOpen("popDebugGroup"), this.native.popDebugGroup();
  }
  insertDebugMarker(e) {
    this.assertOpen("insertDebugMarker"), this.native.insertDebugMarker(e);
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
class tp {
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
    const { native: n, layout: r } = Hd(e), i = e.label ?? this.label, s = new Kd(
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
    const n = Jd(e), r = e?.label ?? this.label, i = new ep(
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
      D(e, `${this.label}.copyBufferToBuffer(source)`),
      n,
      D(r, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, n, r) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: D(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      bt(n, `${this.label}.copyBufferToTexture(destination)`),
      Ie(r)
    );
  }
  copyTextureToBuffer(e, n, r) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      bt(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: D(n.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: n.offset ?? 0,
        bytesPerRow: n.bytesPerRow,
        rowsPerImage: n.rowsPerImage
      },
      Ie(r)
    );
  }
  copyTextureToTexture(e, n, r) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      bt(e, `${this.label}.copyTextureToTexture(source)`),
      bt(n, `${this.label}.copyTextureToTexture(destination)`),
      Ie(r)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, n = 0, r) {
    this.assertRecording("clearBuffer"), Ct(n, `${this.label}.clearBuffer offset`);
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
      D(e, `${this.label}.clearBuffer`),
      n,
      i
    );
  }
  /** 调试分组：直接转发给原生的 `GPUCommandEncoder`。 */
  pushDebugGroup(e) {
    this.assertRecording("pushDebugGroup"), this.native.pushDebugGroup(e);
  }
  popDebugGroup() {
    this.assertRecording("popDebugGroup"), this.native.popDebugGroup();
  }
  insertDebugMarker(e) {
    this.assertRecording("insertDebugMarker"), this.native.insertDebugMarker(e);
  }
  /**
   * 结束录制并返回 command buffer。
   *
   * 如果有 pass 还开着，会先隐式 `end()` —— 与 WebGPU 原生的 `finish()` 行为一致
   * （否则留在录制中的 pass 会被静默丢弃）。
   */
  finish() {
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, new Ns(this.label, this.native.finish());
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
class Ns {
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
function bt(t, e) {
  const n = {
    texture: Ls(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = As(t.origin)), t.aspect !== void 0 && (n.aspect = Qn(t.aspect)), n;
}
function np(t, e) {
  if (t instanceof Ns) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${te(t)}.`
  );
}
class rp {
  canvas;
  options;
  gpuContext = null;
  currentDevice = null;
  formatValue;
  usageValue;
  alphaModeValue = "premultiplied";
  colorSpaceValue;
  sampleCountValue = 1;
  depthRequestedValue = !0;
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
  depthTexture = null;
  depthViewValue = null;
  _disposed = !1;
  constructor(e, n = {}) {
    this.canvas = e, this.options = n, this.pixelRatioValue = n.pixelRatio ?? di(), this.formatValue = _r(), this.usageValue = x.RenderAttachment | (n.copySrc ? x.CopySrc : x.None);
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
  /** 已创建（且已取过一次帧）的 canvas 深度 view；没有深度附件时为 `null`。 */
  get depthStencilView() {
    return this.depthViewValue;
  }
  get disposed() {
    return this._disposed;
  }
  /** 把 context 配置到某个 device 上。会丢弃当前帧的缓存。 */
  configure(e) {
    if (this._disposed)
      throw new u("[gpu-device-api] CanvasContext.configure: the context has been disposed.");
    if (!(e.device instanceof zs))
      throw new u(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const n = rd(this.canvas);
    if (!n)
      throw new u(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget(), this.gpuContext = n, this.currentDevice = e.device, this.formatValue = e.format ?? _r(), this.usageValue = x.RenderAttachment | (e.usage ?? x.None) | (this.options.copySrc ? x.CopySrc : x.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace;
    const r = e.sampleCount ?? (this.configuredValue ? this.sampleCountValue : e.device.defaultSampleCount);
    this.sampleCountValue = tt(r, "CanvasConfig.sampleCount"), this.depthRequestedValue = e.depth ?? !0;
    const i = {
      device: e.device.native,
      format: nd(this.formatValue),
      usage: Ts(this.usageValue),
      alphaMode: this.alphaModeValue
    };
    this.colorSpaceValue !== void 0 && (i.colorSpace = this.colorSpaceValue), n.configure(i), this.configuredValue = !0, this.setSize(this.widthValue / this.pixelRatioValue, this.heightValue / this.pixelRatioValue, !1);
  }
  /** 解除配置；之后 `getCurrentFrameTarget()` 会抛错。 */
  unconfigure() {
    this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget();
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
    (i !== this.widthValue || s !== this.heightValue) && (this.widthValue = i, this.heightValue = s, this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget());
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
    const r = me.adopt(
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
   * 生成可以直接交给 `beginRenderPass` 的附件列表。
   *
   * - `sampleCount > 1` 时创建/复用一个同尺寸的多重采样 texture，把它作为 `view`，
   *   而把 canvas 纹理作为 `resolveTarget`；
   * - 需要深度时（`CanvasConfig.depth`，默认 `true`）创建/复用一个同尺寸的 `depth24plus`
   *   texture。**canvas 纹理本身没有深度附件**，不像 WebGL2 的默认帧缓冲那样自带深度缓冲，
   *   所以这里必须显式给出来，否则渲染通道的 `depthFormat` 会是 `null`，
   *   pipeline 会解析成「没有深度状态」的变体，深度测试被静默关掉。
   *   多重采样时深度 texture 的 sampleCount 必须与颜色附件一致，这里共用 `sampleCountValue`。
   */
  createPassDescriptor(e = {}) {
    const n = this.getCurrentFrameTarget(), r = e.loadOp ?? "clear", i = e.storeOp ?? "store", s = e.clearValue;
    let a;
    this.sampleCountValue > 1 ? a = [
      {
        view: this.ensureMultisampleTarget(n.width, n.height),
        resolveTarget: n.view,
        loadOp: r,
        storeOp: i,
        clearValue: s
      }
    ] : a = [{ view: n.view, loadOp: r, storeOp: i, clearValue: s }];
    let o = null;
    return this.depthRequestedValue && (o = {
      view: this.ensureDepthTarget(n.width, n.height),
      depthLoadOp: e.depthLoadOp ?? "clear",
      depthStoreOp: e.depthStoreOp ?? "store",
      depthClearValue: e.depthClearValue ?? 1
    }), { colorAttachments: a, depthStencilAttachment: o };
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
    const s = me.create(r, {
      label: `${r.label}#canvasMSAA`,
      size: { width: e, height: n },
      format: this.formatValue,
      usage: x.RenderAttachment,
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
  /**
   * 取得（必要时创建）canvas 深度的 view。
   *
   * canvas 纹理没有深度附件，所以深度由本库自己维护：按尺寸缓存，尺寸变化时重建
   *（`setSize()` / `configure()` 里已经先 release 掉了旧的）。sampleCount 与颜色附件一致，
   * 否则 WebGPU 会因为「附件采样数不一致」让整条 command buffer 失效。
   */
  ensureDepthTarget(e, n) {
    const r = this.currentDevice;
    if (!r)
      throw new u("[gpu-device-api] CanvasContext: the context is not configured.");
    const i = this.depthTexture;
    if (i && i.width === e && i.height === n && this.depthViewValue)
      return this.depthViewValue;
    this.releaseDepthTarget();
    const s = me.create(r, {
      label: `${r.label}#canvasDepth`,
      size: { width: e, height: n },
      format: fi,
      usage: x.RenderAttachment,
      sampleCount: this.sampleCountValue
    });
    return this.depthTexture = s, this.depthViewValue = s.createView({ label: `${s.label}#view` }), this.depthViewValue;
  }
  releaseDepthTarget() {
    this.depthTexture?.destroy(), this.depthTexture = null, this.depthViewValue = null;
  }
}
class ip {
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
      D(e, "Queue.writeBuffer"),
      n,
      r,
      i / a,
      o / a
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, n, r, i) {
    this.native.writeTexture(
      on(e, "Queue.writeTexture"),
      n,
      Ld(r),
      Ie(i)
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
      on(n, "Queue.copyExternalImageToTexture"),
      Ie(r)
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
      D(e, "Queue.copyBufferToBuffer(source)"),
      n,
      D(r, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, n, r) {
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: D(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      on(n, "Queue.copyBufferToTexture(destination)"),
      Ie(r)
    ), this.native.submit([i.finish()]);
  }
  /** 提交 command buffer；提交后这些 buffer 不可再次使用。 */
  submit(e) {
    this.native.submit(e.map((n) => np(n, "Queue.submit")));
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
function on(t, e) {
  const n = {
    texture: Ls(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = As(t.origin)), t.aspect !== void 0 && (n.aspect = Qn(t.aspect)), n;
}
class zs {
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
    this.native = e, this.descriptor = n.descriptor, this.label = n.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = n.adapterInfo, this.requestedLimits = n.resolvedLimits, this.debug = n.descriptor.debug ?? !1, this.enabledFeatures = [...n.descriptor.requiredFeatures ?? []], this.features = new td(n.adapterFeatures), this.limits = ys(e.limits), this.defaultSampleCount = tt(
      n.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = Je(`webgpu:${this.label}`);
    let r = () => {
    };
    this.lost = new Promise((i) => {
      r = i;
    }), this.resolveLost = r, this.queue = new ip(this), e.onuncapturederror = (i) => {
      this.reportError(sp(i.error));
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
    return this.assertUsable("createBuffer"), this.track(new _s(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(me.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Jn(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new Ms(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new Ps(this, e));
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new Fs(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Rs(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(Ze.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new Ds(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new Is(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new Vs(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new tp(this, e));
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
    return (!r || r.disposed) && (r = this.track(new rp(e)), this.canvasContexts.set(e, r)), (n !== void 0 || !r.configured) && r.configure({ ...n, device: this }), r;
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
      mi(e);
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
      throw new pn(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfo.reason}): ` + this.lostInfo.message,
        { reason: this.lostInfo.reason }
      );
  }
  handleDeviceLost(e) {
    const n = e.reason === "destroyed" ? "destroyed" : "unknown", r = { reason: n, message: e.message };
    this.lostInfo = r, this.resolveLost(r), this._disposed || this.reportError(
      new pn(`[gpu-device-api] WebGPU device lost (${n}): ${e.message}`, { reason: n })
    );
  }
}
function sp(t) {
  if (da(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), n = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return cn(t, "GPUValidationError") ? new u(n) : cn(t, "GPUOutOfMemoryError") ? new pa(n) : cn(t, "GPUInternalError") ? new de(n, { code: "INTERNAL_ERROR" }) : t instanceof Error ? new de(n, { code: "GPU_ERROR", cause: t }) : new de(n);
}
function cn(t, e) {
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
class Mt {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, n) {
    this.native = e, this.options = n, this.info = Jf(e), this.features = Kf(e.features), this.limits = ys(e.limits), this.featureNames = [...this.features].sort();
  }
  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions() {
    return this.options;
  }
  /** 当前环境是否暴露 WebGPU。 */
  static isSupported() {
    return Ar();
  }
  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(e = {}) {
    const n = await Qf(e);
    return n ? new Mt(n, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const n = await Mt.request(e);
    if (n) return n;
    throw Ar() ? new u(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new u(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const n = hi(this.limits, e.requiredLimits, "webgpu"), r = ed(
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
    return new zs(s, {
      descriptor: e,
      resolvedLimits: n,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function ap(t) {
  return t.canvas ? t.canvas : ks();
}
function op() {
  return ks();
}
function ks() {
  if (typeof document < "u") {
    const t = document.createElement("canvas");
    return t.width = 1, t.height = 1, t;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
const Sn = Symbol("timeout");
async function Or(t, e) {
  let n;
  try {
    return await Promise.race([
      t,
      new Promise((r) => {
        n = setTimeout(() => r(Sn), e);
      })
    ]);
  } finally {
    n !== void 0 && clearTimeout(n);
  }
}
const wt = 3e3;
class cp {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    try {
      const n = await Or(
        navigator.gpu.requestAdapter({
          powerPreference: e.powerPreference ?? "high-performance",
          forceFallbackAdapter: e.forceFallbackAdapter ?? !1
        }),
        wt
      );
      return n === Sn ? {
        ok: !1,
        reason: `requestAdapter() 超过 ${wt}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`
      } : n ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (n) {
      return { ok: !1, reason: `requestAdapter() 抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const n = await Or(
      Mt.create({
        powerPreference: e.powerPreference,
        forceFallbackAdapter: e.forceFallbackAdapter
      }),
      wt
    );
    if (n === Sn)
      throw new u(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${wt}ms 没有返回。这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。
可以稍后重试，或改用 WebGL2 后端。`
      );
    return n;
  }
}
class lp {
  kind = "webgl2";
  async isAvailable(e) {
    const n = op();
    if (!n)
      return { ok: !1, reason: "没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）" };
    try {
      return n.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（浏览器不支持 WebGL2）" };
    } catch (r) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    const n = ap(e);
    if (!n)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return Xn.request({
      canvas: n,
      contextAttributes: e.contextAttributes
    });
  }
}
let ln = null;
function er() {
  return ln || (ln = new ju().register(new cp()).register(new lp())), ln;
}
const up = ["webgpu", "webgl2"];
async function hp(t = {}) {
  const e = t.registry ?? er(), n = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? up, r = await e.probeAll(n, t), i = r.find((s) => s.ok);
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
async function wg(t, e = {}) {
  const r = (e.registry ?? er()).get(t);
  return r ? (await r.isAvailable(e)).ok : !1;
}
async function vg(t = {}) {
  return (await Ws(t)).device;
}
async function Ws(t = {}) {
  const e = t.logger ?? Je("gpu-device-api"), n = t.registry ?? er(), r = await hp({
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
const Dr = 16, fp = 12, Pt = {
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
    size: Dr * 3,
    glsl: "mat3",
    wgsl: "mat3x3f",
    componentType: "f32",
    components: 9,
    columnStride: Dr,
    columnSize: fp,
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
}, Ir = Object.keys(Pt);
function un(t, e) {
  return Math.ceil(t / e) * e;
}
function dp(t) {
  const e = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(t);
  if (e) {
    const r = e[1], i = Pt[r];
    if (!i)
      throw new u(
        `[gpu-device-api] 不支持的 uniform 元素类型「${r}」（出现在「${t}」里）。支持：${Ir.join("、")}。`
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
      `[gpu-device-api] 不支持的 uniform 类型「${t}」。支持：${Ir.join("、")}，以及 \`类型[N]\` 形式的数组。`
    );
  return { element: t, count: 1 };
}
const pp = /* @__PURE__ */ new Set([
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
]), mp = /^[A-Za-z_][A-Za-z0-9_]*$/;
class Nt {
  desc;
  fields;
  /**
   * 字段名 → 字段。构造时建一次，供 {@link has} / {@link field} 做 O(1) 查找。
   *
   * 为什么不用 `fields.some(...)`：`Renderer.draw()` 每 draw 要问 7 次「这个材质有没有
   * projectionView / model / normalMatrix…」，线性扫描 + 每次一个闭包会在 40k draw 的
   * 场景里变成几毫秒/帧的纯开销。
   */
  fieldByName;
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
      if (!mp.test(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」不是合法标识符。`);
      if (pp.has(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」是 WGSL 保留字，请换一个。`);
      const l = e[o], { element: c, count: h } = dp(l), d = Pt[c], f = un(s, d.align), p = d.size, m = h > 1 ? un(d.size, 16) : d.size, g = d.columnStride === void 0 || d.columnStride === d.columnSize, b = h > 1 ? m === d.size && g : g, w = h > 1 ? m * (h - 1) + d.size : d.size;
      i.push({ name: o, type: l, info: d, byteOffset: f, byteSize: p, byteStride: m, count: h, packed: b }), s = f + w, a = Math.max(a, d.align, h > 1 ? 16 : 0);
    }
    this.fields = i, this.fieldByName = new Map(i.map((o) => [o.name, o])), this.byteLength = un(s, a), this.key = `${this.structName}|${this.group}|${this.binding}|${r.map((o) => `${o}:${e[o]}`).join(",")}`;
  }
  field(e) {
    const n = this.fieldByName.get(e);
    if (!n)
      throw new u(
        `[gpu-device-api] uniform 布局里没有字段「${e}」。现有字段：${this.fields.map((r) => r.name).join("、")}。`
      );
    return n;
  }
  has(e) {
    return this.fieldByName.has(e);
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
const Vr = /* @__PURE__ */ new Map();
function qs(t, e) {
  const n = new Nt(t, e), r = Vr.get(n.key);
  return r || (Vr.set(n.key, n), n);
}
function An(t, e, n, r) {
  return t === "i32" ? new Int32Array(e, n, r) : t === "u32" ? new Uint32Array(e, n, r) : new Float32Array(e, n, r);
}
function Nr(t, e, n, r, i) {
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
      return o || (o = An(t.info.componentType, e, t.byteOffset + a * n, r), s[a] = o), o;
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
      const o = i * r, l = a ?? An(t.info.componentType, new ArrayBuffer(o * 4), 0, o);
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
class zr {
  layout;
  buffer;
  fieldValues;
  /** {@link bytes} 的缓存视图；`buffer` 终生不重新分配，所以视图可以一直复用。 */
  bytesView;
  /**
   * 字段名 → 写入器，供 {@link set} 走单态快路径。
   *
   * 为什么需要它：最直觉的写法（`fieldValues[name]` 查表后 `.set(value)`）会让同一个调用点
   * 看到 4 种以上的接收者形状（Float32Array / Int32Array / Uint32Array / 访问器对象），
   * V8 只能走 megamorphic 泛型路径。实测（Node 24）每次 `set` 约 0.9 µs，而等价的
   * 「单态 typed-array 拷贝 + 查表」只要 0.03 µs —— 40k draw 的场景下这就是每帧几百毫秒。
   *
   * 做法：按组件类型把「连续块」字段映射到**整块**视图（f32/i32/u32 各一个）加一个元素偏移，
   * 这样三个 `.set` 调用点各自只见到一种接收者；只有非连续的字段（mat3x3f、f32[4]…）
   * 才回退到访问器。
   */
  writers = /* @__PURE__ */ new Map();
  f32View = null;
  i32View = null;
  u32View = null;
  /** 每次修改自增；渲染器据此跳过没必要的上传。 */
  version = 1;
  constructor(e, n) {
    this.layout = e instanceof Nt ? e : qs(e, n), this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16)), this.bytesView = new Uint8Array(this.buffer, 0, this.layout.byteLength);
    const r = {};
    for (const i of this.layout.fields)
      r[i.name] = this.createFieldValue(i), this.writers.set(i.name, this.createFieldWriter(i, r[i.name]));
    this.fieldValues = r;
  }
  /** 为字段建一个形状统一的写入器（见 {@link writers} 的说明）。 */
  createFieldWriter(e, n) {
    const r = e.count * e.info.components;
    return e.packed ? { kind: e.info.componentType === "i32" ? 1 : e.info.componentType === "u32" ? 2 : 0, offset: e.byteOffset / 4, length: r, accessor: null } : {
      kind: 3,
      offset: 0,
      length: r,
      accessor: n
    };
  }
  createFieldValue(e) {
    if (e.packed)
      return An(
        e.info.componentType,
        this.buffer,
        e.byteOffset,
        e.count * e.info.components
      );
    if (e.info.columnStride !== void 0) {
      const n = (e.info.columnSize ?? e.byteSize) / 4;
      return Nr(
        e,
        this.buffer,
        e.info.columnStride,
        n,
        e.info.columns ?? 1
      );
    }
    return Nr(e, this.buffer, e.byteStride, e.info.components, e.count);
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
  /**
   * 写一个字段。标量收 `number`，其余收紧凑数组。
   *
   * 走 {@link writers} 里的单态快路径（见那里的实测数字），并且保留「数组写超长就报错」的行为：
   * 连续块现在是整块视图，写超长会溢到下一个字段，所以这里显式挡一下。
   */
  set(e, n) {
    const r = this.writers.get(e);
    if (r === void 0)
      return this.layout.field(e), this;
    if (typeof n == "number") {
      if (r.kind === 3)
        throw new TypeError(
          `[gpu-device-api] uniform 字段「${e}」不是标量，请传数字数组而不是单个数字。`
        );
      r.kind === 0 ? (this.f32View ??= new Float32Array(this.buffer))[r.offset] = n : r.kind === 1 ? (this.i32View ??= new Int32Array(this.buffer))[r.offset] = n : (this.u32View ??= new Uint32Array(this.buffer))[r.offset] = n;
    } else {
      const i = n;
      if (i.length > r.length)
        throw new RangeError(
          `[gpu-device-api] uniform 字段「${e}」只接受 ${r.length} 个元素，收到 ${i.length} 个。写超长会覆盖后面的字段，所以这里直接拦下。`
        );
      r.kind === 0 ? (this.f32View ??= new Float32Array(this.buffer)).set(i, r.offset) : r.kind === 1 ? (this.i32View ??= new Int32Array(this.buffer)).set(i, r.offset) : r.kind === 2 ? (this.u32View ??= new Uint32Array(this.buffer)).set(i, r.offset) : r.accessor.set(i);
    }
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
  /** 有效字节数的视图（上传时用，避免把尾部对齐填充也传上去）。视图是复用的，不要保留它的引用。 */
  get bytes() {
    return this.bytesView;
  }
  /** 复制一份紧凑的字节数据。 */
  toArrayBuffer() {
    return this.buffer.slice(0, this.layout.byteLength);
  }
}
const kr = /* @__PURE__ */ new WeakMap(), js = /* @__PURE__ */ new WeakMap();
function gp(t) {
  return js.get(t) ?? t;
}
function bp(t) {
  const e = kr.get(t);
  if (e) return e;
  const n = /* @__PURE__ */ new Map(), r = new Proxy(t, {
    get(i, s, a) {
      if (typeof s == "string" && i.has(s))
        return i.field(s);
      const o = Reflect.get(i, s, i);
      if (typeof o == "function") {
        let l = n.get(s);
        return l === void 0 && (l = o.bind(i), n.set(s, l)), l;
      }
      return o;
    },
    has(i, s) {
      return typeof s == "string" && i.has(s) ? !0 : Reflect.has(i, s);
    },
    set(i, s, a, o) {
      return typeof s == "string" && i.has(s) ? (i.set(s, a), !0) : Reflect.set(i, s, a, o);
    }
  });
  return kr.set(t, r), js.set(r, t), r;
}
function wp(t, e) {
  const n = t instanceof Nt ? new zr(t) : new zr(t, e);
  return bp(n);
}
const hn = "/*%uniforms%*/", Wr = "/*%attributes%*/", fn = "/*%textures%*/", vp = {
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
function xp(t, e, n) {
  const r = e === "cube" ? "samplerCube" : e === "3d" ? "sampler3D" : e === "2d-array" ? "sampler2DArray" : "sampler2D";
  return n ? r === "sampler2D" ? "sampler2DShadow" : r === "samplerCube" ? "samplerCubeShadow" : r === "sampler2DArray" ? "sampler2DArrayShadow" : r : t === "sint" ? `i${r}` : t === "uint" ? `u${r}` : r;
}
function yp(t, e) {
  return t === "depth" ? e === "cube" ? "texture_depth_cube" : e === "2d-array" ? "texture_depth_2d_array" : "texture_depth_2d" : `${e === "cube" ? "texture_cube" : e === "3d" ? "texture_3d" : e === "2d-array" ? "texture_2d_array" : "texture_2d"}<${t === "sint" ? "i32" : t === "uint" ? "u32" : "f32"}>`;
}
function dn(t, e) {
  let n = t;
  const r = [];
  for (const s of e)
    s.text && (n.includes(s.placeholder) ? n = n.split(s.placeholder).join(s.text) : r.push(s.text));
  return `${r.length > 0 ? `${r.join(`

`)}

` : ""}${n.trim()}
`;
}
class zt {
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
    }), e.uniforms instanceof Nt ? this.uniforms = e.uniforms : e.uniforms ? this.uniforms = qs(e.uniforms) : this.uniforms = null;
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
      (f) => `uniform ${xp(f.sampleType, f.viewDimension, f.comparison)} ${f.name};`
    ).join(`
`), o = this.attributes.map((f) => `layout(location = ${f.location}) in ${ha(f.format)} ${f.name};`).join(`
`);
    if (this.glsl = {
      vs: dn(e.glsl.vs, [
        { placeholder: hn, text: s },
        { placeholder: Wr, text: o },
        { placeholder: fn, text: a }
      ]),
      fs: dn(e.glsl.fs, [
        { placeholder: hn, text: s },
        { placeholder: fn, text: a }
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
      return `@group(${i}) @binding(${f.binding}) var ${f.name}: ${yp(f.sampleType, f.viewDimension)};
@group(${i}) @binding(${f.samplerBinding}) var ${f.samplerName}: ${p};`;
    }).join(`
`), d = this.attributes.length > 0 ? `struct VertexInput {
${this.attributes.map((f) => `  @location(${f.location}) ${f.name}: ${fa(f.format)},`).join(`
`)}
}` : "";
    this.wgsl = dn(l, [
      { placeholder: hn, text: c },
      { placeholder: Wr, text: d },
      { placeholder: fn, text: h }
    ]);
  }
  /** 创建一个材质。 */
  static create(e) {
    return new zt(e);
  }
  /**
   * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
   * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
   */
  vertexBufferLayouts() {
    return this.attributes.map((e) => ({
      arrayStride: $e(e.format).byteSize,
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
    const e = wp(this.uniforms);
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
      const n = vp[e];
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
function Tp(t) {
  return zt.create(t);
}
const $p = 72;
class Sp {
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
  /**
   * 本帧写入的 `(offset, data)` 对，只用于扩容时重放。
   *
   * 用两个平行数组而不是 `{offset, data}` 对象：这里每 draw 记录一次，40k draw 的场景下
   * 每帧 40k 个短命对象是白白送给 GC 的。
   */
  frameOffsets = [];
  frameData = [];
  /**
   * 扩容时退休的 buffer / bind group，等下一帧 `beginFrame()` 再销毁。
   *
   * 为什么不能立刻销毁：扩容发生在录制过程中，本帧已经录制了引用它们的 `setBindGroup`。
   * WebGPU 会因此在 `queue.submit` 时报「Buffer ... used in submit while destroyed」。
   */
  retired = [];
  _disposed = !1;
  constructor(e, n, r = {}) {
    this.device = e, this.layout = n, this.label = r.label ?? `uniformArena:${n.structName}`, this.align = Math.max(1, e.limits.minUniformBufferOffsetAlignment), this.slotSize = qr(Math.max(n.byteLength, 16), this.align), this.maxCapacity = r.maxCapacity ?? 16 * 1024 * 1024, this.capacityValue = Math.max(r.initialCapacity ?? 64 * 1024, this.slotSize), this.bufferValue = this.createBuffer(this.capacityValue);
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
    this.head = 0, this.frameOffsets.length = 0, this.frameData.length = 0, this.releaseRetired();
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
    return this.device.queue.writeBuffer(this.bufferValue, n, r), this.recordWrite(n, r), n;
  }
  /** 直接写入一段原始字节（高级用法：手写打包数据时）。 */
  writeBytes(e) {
    const n = this.allocate();
    return this.device.queue.writeBuffer(this.bufferValue, n, e), this.recordWrite(n, e), n;
  }
  /** 记下本帧的写入，供扩容重放（两个平行数组，不产生每 draw 的对象）。 */
  recordWrite(e, n) {
    this.frameOffsets.push(e), this.frameData.push(n);
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
    this._disposed || (this._disposed = !0, this.releaseRetired(), this.bindGroupValue?.dispose(), this.bindGroupValue = null, this.bufferValue.destroy());
  }
  allocate() {
    this.head + this.slotSize > this.capacityValue && this.grow();
    const e = this.head;
    return this.head += this.slotSize, e;
  }
  /**
   * 真正销毁已经退休的 buffer / bind group。
   *
   * 只能在**下一帧的 `beginFrame()`**（那时上一帧已经 submit）或 `destroy()` 里调用 ——
   * 原因见 {@link grow}。
   */
  releaseRetired() {
    if (this.retired.length !== 0) {
      for (const e of this.retired)
        e.bindGroup?.dispose(), e.buffer.destroy();
      this.retired.length = 0;
    }
  }
  /**
   * 扩容并把本帧已写入的内容重放到新 buffer 上。
   * 这样做而不是「绕回旧区间」：绕回会让同一帧内前后两次 draw 读到彼此的数据，
   * 正是本模块要消除的问题。
   *
   * **旧 buffer / bind group 不能在这里销毁**：扩容发生在录制过程中，此时本帧已经录制了
   * 引用它们的 `setBindGroup`，WebGPU 会在 `queue.submit` 时报
   * 「Buffer ... used in submit while destroyed」（WebGL2 只是悄悄用到已删除的对象）。
   * 所以先放进 {@link retired}，等下一帧 `beginFrame()` 时上一帧已经提交完，再真正销毁。
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
    this.retired.push({ buffer: this.bufferValue, bindGroup: this.bindGroupValue }), this.bindGroupValue = null, this.bindGroupLayoutValue = null, this.capacityValue = n, this.bufferValue = this.createBuffer(n);
    for (let r = 0; r < this.frameOffsets.length; r += 1)
      this.device.queue.writeBuffer(this.bufferValue, this.frameOffsets[r], this.frameData[r]);
  }
  createBuffer(e) {
    return this.device.createBuffer({
      label: `${this.label}:${e}`,
      size: qr(e, 4),
      usage: $p
    });
  }
}
class Ap {
  device;
  arenas = /* @__PURE__ */ new Map();
  options;
  constructor(e, n = {}) {
    this.device = e, this.options = n;
  }
  /** 取得（或创建）某个布局的 arena。 */
  acquire(e) {
    let n = this.arenas.get(e.key);
    return n || (n = new Sp(this.device, e, this.options), this.arenas.set(e.key, n)), n;
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
function qr(t, e) {
  return Math.ceil(t / e) * e;
}
const _p = 40, Ep = 24, Lp = Object.freeze({
  position: "float32x3",
  normal: "float32x3",
  uv: "float32x2",
  uv1: "float32x2",
  color: "float32x4",
  tangent: "float32x4",
  joints: "uint16x4",
  weights: "float32x4"
});
class kt {
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
  /**
   * 已经校验过的「材质属性声明」集合，键是 `Material.attributes` 这个数组对象本身。
   *
   * 校验结果只取决于 (几何体, 材质声明) 这一对，而两者在创建后都不再变 —— 所以每 draw
   * 重复校验是纯浪费（40k draw 的场景下每帧几毫秒）。用数组身份当键，既拿到了
   * 「按材质缓存」的效果，又不用在渲染器里维护 WeakMap。
   */
  validatedAgainst = /* @__PURE__ */ new WeakSet();
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
      const m = p.format ?? jr(f, p.data), g = Math.floor(p.data.byteLength / $e(m).byteSize);
      p.perInstance ? o = o === null ? g : Math.min(o, g) : g > a && (a = g);
    }
    if (a <= 0)
      throw new u(
        `[gpu-device-api] 几何体「${r}」无法推断顶点数：至少要有一个按顶点步进的属性（实例属性只描述实例，不决定顶点数），并检查属性数据是否为空。`
      );
    const l = /* @__PURE__ */ new Map();
    for (const [f, p] of i) {
      const m = p.format ?? jr(f, p.data), g = $e(m);
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
        size: Xr(p.data.byteLength, 4),
        usage: _p
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
      const f = Mp(n.indices, a, r);
      h = f instanceof Uint32Array ? "uint32" : "uint16", d = f.length, c = e.createBuffer({
        label: `${r}:indices`,
        size: Xr(f.byteLength, 4),
        usage: Ep
      }), e.queue.writeBuffer(c, 0, f);
    }
    return new kt({
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
    if (!this.validatedAgainst.has(e)) {
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
      this.validatedAgainst.add(e);
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
function jr(t, e) {
  const n = Lp[t];
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
function Mp(t, e, n) {
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
  return la(e) === "uint32" ? Uint32Array.from(r) : Uint16Array.from(r);
}
function Xr(t, e) {
  return Math.ceil(t / e) * e;
}
function xg(t, e) {
  return kt.create(t, e);
}
class Qe {
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
    const r = n.label ?? "texture", i = n.format ?? "rgba8unorm", s = n.flipY ?? _n(n.data), a = n.mipmaps ?? (_n(n.data) && i === "rgba8unorm");
    if (i !== "rgba8unorm")
      throw new u(
        `[gpu-device-api] 便捷层的纹理目前只支持 rgba8unorm（收到「${i}」）。需要其它格式请直接用 core 的 device.createTexture() + queue.writeTexture()。`
      );
    const o = Pp(n.data, n.width, n.height, s), l = a ? Cp(o.data, o.width, o.height) : [o], c = {
      label: r,
      size: { width: o.width, height: o.height },
      format: i,
      mipLevelCount: l.length,
      usage: ga(0) | x.CopyDst
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
    return new Qe({
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
    return Qe.create(e, {
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
function _n(t) {
  if (!t || typeof t != "object") return !1;
  const e = t.constructor?.name ?? "";
  return e === "ImageBitmap" || e === "HTMLImageElement" || e === "HTMLCanvasElement" || e === "OffscreenCanvas" || e === "ImageData" || e === "VideoFrame" || e === "HTMLVideoElement";
}
function Pp(t, e, n, r) {
  if (!_n(t)) {
    const d = t, f = new Uint8Array(d.buffer, d.byteOffset, d.byteLength), p = e ?? 0, m = n ?? 0;
    if (p <= 0 || m <= 0)
      throw new u(
        "[gpu-device-api] 用原始像素创建纹理时必须给出 width 与 height（无法从字节数推断）。"
      );
    if (f.byteLength < p * m * 4)
      throw new u(
        `[gpu-device-api] 纹理数据只有 ${f.byteLength} 字节，但 ${p}x${m} 的 RGBA8 需要 ${p * m * 4} 字节。`
      );
    return { data: r ? Yr(f.subarray(0, p * m * 4), p, m) : f.subarray(0, p * m * 4), width: p, height: m };
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
  return { data: r ? Yr(h, s, a) : h, width: s, height: a };
}
function Yr(t, e, n) {
  const r = e * 4, i = new Uint8Array(t.byteLength);
  for (let s = 0; s < n; s++) {
    const a = s * r, o = (n - 1 - s) * r;
    i.set(t.subarray(a, a + r), o);
  }
  return i;
}
function Cp(t, e, n) {
  const r = [{ data: t, width: e, height: n }];
  let i = t, s = e, a = n;
  for (; s > 1 || a > 1; ) {
    const o = Math.max(1, s >> 1), l = Math.max(1, a >> 1), c = new Uint8Array(o * l * 4);
    for (let h = 0; h < l; h++) {
      const d = Math.min(h * 2, a - 1), f = Math.min(h * 2 + 1, a - 1);
      for (let p = 0; p < o; p++) {
        const m = Math.min(p * 2, s - 1), g = Math.min(p * 2 + 1, s - 1), b = (d * s + m) * 4, w = (d * s + g) * 4, T = (f * s + m) * 4, S = (f * s + g) * 4, A = (h * o + p) * 4;
        for (let _ = 0; _ < 4; _++)
          c[A + _] = i[b + _] + i[w + _] + i[T + _] + i[S + _] >> 2;
      }
    }
    r.push({ data: c, width: o, height: l }), i = c, s = o, a = l;
  }
  return r;
}
const Fp = ne();
class Xs {
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
  normalMatrixScratch = yi();
  _disposed = !1;
  constructor(e) {
    this.backend = e.backend, this.device = e.device, this.context = e.context, this.canvas = e.canvas, this.logger = e.logger, this.camera = e.options.camera ?? null, this._clearColor = e.options.clearColor ?? "#0b0e13", this._pixelRatio = e.options.pixelRatio ?? e.context.pixelRatio, this._width = e.context.width, this._height = e.context.height, this.arenaPool = new Ap(e.device);
  }
  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(e) {
    const n = e.logger ?? Je("gpu-device-api/gfx"), r = {
      antialias: e.antialias ?? !0,
      alpha: e.alpha ?? !1,
      depth: e.depth ?? !0,
      stencil: !1,
      premultipliedAlpha: !0,
      preserveDrawingBuffer: !1,
      powerPreference: e.powerPreference ?? "high-performance",
      ...e.contextAttributes
    }, i = r.depth !== !1, s = await Ws({
      canvas: e.canvas,
      backend: e.backend ?? "auto",
      label: "gfx-renderer",
      contextAttributes: r
    });
    if (!s.context)
      throw new u("[gpu-device-api] 创建 Renderer 必须提供 canvas。");
    const a = e.sampleCount ?? (s.backend === "webgpu" && (e.antialias ?? !0) ? 4 : void 0);
    (a !== void 0 || !i) && s.device.createCanvasContext(e.canvas, {
      ...a !== void 0 ? { sampleCount: a } : {},
      ...i ? {} : { depth: !1 }
    });
    const o = new Xs({
      backend: s.backend,
      device: s.device,
      context: s.context,
      canvas: e.canvas,
      logger: n,
      options: e
    });
    return e.pixelRatio && o.setPixelRatio(e.pixelRatio), o.resize(), o;
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
    this.camera = e, this.updateCamera();
  }
  /* ------------------------------------------------------------------ 资源 ------------------- */
  createGeometry(e) {
    const n = kt.create(this.device, e);
    return this.geometries.add(n), n;
  }
  /** 创建（或直接登记）一个材质。 */
  createMaterial(e) {
    const n = e instanceof zt ? e : Tp(e);
    return this.materials.has(n) || this.materials.set(n, {
      material: n,
      layout: n.createPipelineLayout(this.device),
      pipeline: null,
      // 还原掉 createUniforms() 的 Proxy：渲染器的每 draw 写入路径直接操作原始对象，
      // 免得每次 set()/has() 都穿一遍 Proxy 陷阱（见 unwrapUniforms 的说明）。
      values: n.uniforms ? gp(n.createUniforms()) : null
    }), n;
  }
  createTexture(e) {
    const n = Qe.create(this.device, e);
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
    this._inFrame && this.endFrame(), this.frameStart = typeof performance < "u" ? performance.now() : Date.now(), this.resize(), this.arenaPool.beginFrame(), this.updateCamera(), this.encoder = this.device.createCommandEncoder({ label: "gfx-frame" });
    const n = e.color ?? this._clearColor, r = this.createPassDescriptor(e, n);
    if (!r.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。");
    this.pass = this.encoder.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: r.colorAttachments,
      ...r.depthStencilAttachment ? { depthStencilAttachment: r.depthStencilAttachment } : {}
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
    const n = this.encoder, r = this.createPassDescriptor(e, e.color ?? this._clearColor);
    if (!r.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前通道没有颜色附件。");
    this.pass = n.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: r.colorAttachments,
      ...r.depthStencilAttachment ? { depthStencilAttachment: r.depthStencilAttachment } : {}
    }), this.currentPipeline = null;
  }
  /**
   * 「画到离屏 target」与「画到 canvas」走同一段代码，只是附件来源不同。
   *
   * 两条路径都返回同一形状的 {@link RenderPassDescriptor}（colorAttachments + depthStencilAttachment），
   * 所以深度附件不会被某一条路径漏掉 —— 之前的缺陷正是「画布路径自己拼 color attachment、
   * 从不传 depth attachment」，于是后端的状态解析器如实关掉了 DEPTH_TEST。
   */
  createPassDescriptor(e, n) {
    const r = {
      loadOp: e.load ? "load" : "clear",
      storeOp: "store",
      clearValue: n,
      depthLoadOp: e.load ? "load" : "clear",
      depthClearValue: e.depth ?? 1
    };
    return e.target ? e.target.createPassDescriptor(r) : this.context.createPassDescriptor(r);
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
      if (this.applyCameraUniforms(i.values, r), r.uniforms.has("model") && i.values.set("model", n.model ?? Fp), this.updateNormalMatrix(i.values, r), n.uniforms)
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
    }), this.statsValue.drawCalls += 1, this.statsValue.instances += n.instances ?? 1, this.statsValue.triangles += Bp(e, n) * (n.instances ?? 1);
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
  /**
   * 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。
   *
   * 这里**不再**调用 `camera.update()`：相机矩阵每帧只需要算一次（见 {@link updateCamera}）。
   * 原先每 draw 都重算 lookAt + 两套 perspective + 一次乘法，40k draw 的场景下光这一步就是
   * 几十毫秒/帧的纯 CPU 开销，而且结果完全一样。
   */
  applyCameraUniforms(e, n) {
    const r = this.camera;
    r && (n.uniforms?.has("projectionView") && e.set("projectionView", r.projectionViewMatrix), n.uniforms?.has("projection") && e.set("projection", r.projectionMatrix), n.uniforms?.has("view") && e.set("view", r.viewMatrix), n.uniforms?.has("cameraPosition") && e.set("cameraPosition", r.position));
  }
  /**
   * 按当前画布宽高比与后端深度约定刷新相机矩阵。
   *
   * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
   * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
   */
  updateCamera() {
    const e = this.camera;
    e && (e.aspect = this.aspect, e.depthRange = this.backend === "webgpu" ? "zo" : "gl", e.update());
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
    Bn(this.normalMatrixScratch, r) || Ti(this.normalMatrixScratch), e.set("normalMatrix", this.normalMatrixScratch);
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
    return this.defaultTexture || (this.defaultTexture = Qe.create(this.device, {
      label: "default-white",
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      mipmaps: !1
    })), this.defaultTexture;
  }
}
function Bp(t, e) {
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
const Rp = 1e-6, Hr = F(), Zr = F();
function Ve(t, e, n, r, i) {
  if (e === void 0) return pe(t, n, r, i);
  if (e.length < 3)
    throw new RangeError("[gpu-device-api] A vector option needs at least 3 components.");
  const s = e[0], a = e[1], o = e[2];
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(o))
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${s}, ${a}, ${o}).`);
  return pe(t, s, a, o);
}
function Ys(t) {
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function Gp(t, e, n) {
  if (!(t > 0) || t >= 180)
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${t}.`);
  if (!(e > 0))
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${e}.`);
  if (Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${n}.`);
}
function Up(t, e, n) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${t}.`);
  if (!Number.isFinite(e) || Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${e}, far = ${n}.`);
}
function Hs(t) {
  if (oe(Hr, t.position, t.target), Oe(Hr) < Rp) {
    pe(Zr, t.target[0], t.target[1], t.target[2] + 1), wn(t.viewMatrix, Zr, t.target, t.up);
    return;
  }
  wn(t.viewMatrix, t.position, t.target, t.up);
}
class yg {
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
    this.position = Ve(F(), e.position, 0, 0, 5), this.target = Ve(F(), e.target, 0, 0, 0), this.up = Ve(F(), e.up, 0, 1, 0), this.fov = e.fov ?? 60, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
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
    Gp(this.fov, this.near, this.far), Hs(this);
    const e = as(this.fov), n = Ys(this.aspect);
    Fi(this.projectionMatrixGL, e, n, this.near, this.far), Bi(this.projectionMatrixZO, e, n, this.near, this.far), Q(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
class Tg {
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
    this.position = Ve(F(), e.position, 0, 0, 5), this.target = Ve(F(), e.target, 0, 0, 0), this.up = Ve(F(), e.up, 0, 1, 0), this.size = e.size ?? 2, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 按 `depthRange` 选出的那一套投影矩阵，返回的是另外两份矩阵之一本身（同一个对象）。
   */
  get projectionMatrix() {
    return this.depthRange === "zo" ? this.projectionMatrixZO : this.projectionMatrixGL;
  }
  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update() {
    Up(this.size, this.near, this.far), Hs(this);
    const e = this.size / 2, n = e * Ys(this.aspect);
    Ri(this.projectionMatrixGL, -n, n, -e, e, this.near, this.far), Gi(this.projectionMatrixZO, -n, n, -e, e, this.near, this.far), Q(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
const Qr = 1e-4, fe = 1e-6, Op = 0.95, H = F(), Kr = F(), Jr = F();
function ve(t, e) {
  if (!Number.isFinite(t))
    throw new RangeError(`[gpu-device-api] ${e} must be a finite number, got ${t}.`);
  return t;
}
class $g {
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
    if (this.camera = e, this.element = n, this.enabled = r.enabled ?? !0, this.enableRotate = r.enableRotate ?? !0, this.enableZoom = r.enableZoom ?? !0, this.enablePan = r.enablePan ?? !0, this.enableDamping = r.enableDamping ?? !0, this.dampingFactor = Ue(r.dampingFactor ?? 0.08, 0, 1), this.rotateSpeed = ve(r.rotateSpeed ?? 1, "options.rotateSpeed"), this.zoomSpeed = ve(r.zoomSpeed ?? 1, "options.zoomSpeed"), this.panSpeed = ve(r.panSpeed ?? 1, "options.panSpeed"), this.minDistance = ve(r.minDistance ?? 0.1, "options.minDistance"), this.maxDistance = ve(r.maxDistance ?? 1e3, "options.maxDistance"), this.minPolarAngle = ve(r.minPolarAngle ?? 0, "options.minPolarAngle"), this.maxPolarAngle = ve(r.maxPolarAngle ?? Math.PI, "options.maxPolarAngle"), this.minDistance <= 0)
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
    let i = Oe(H);
    i < fe ? i = this.minDistance : (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(Ue(H[1] / i, -1, 1)));
    const s = Math.abs(this.deltaTheta) > fe || Math.abs(this.deltaPhi) > fe, a = Math.abs(this.scale - 1) > fe, o = Oe(this.panOffset) > fe;
    if (!s && !a && !o)
      return !1;
    const l = this.enableDamping ? this.dampingFactor : 1;
    this.theta += this.deltaTheta * l, this.phi += this.deltaPhi * l, this.phi = Ue(
      this.phi,
      Math.max(this.minPolarAngle, Qr),
      Math.min(this.maxPolarAngle, Math.PI - Qr)
    ), i = Ue(i * this.scale, this.minDistance, this.maxDistance), xt(n, n, this.panOffset, l);
    const c = Math.sin(this.phi) * i;
    pe(
      r,
      n[0] + c * Math.sin(this.theta),
      n[1] + Math.cos(this.phi) * i,
      n[2] + c * Math.cos(this.theta)
    ), this.enableDamping ? (this.deltaTheta *= 1 - this.dampingFactor, this.deltaPhi *= 1 - this.dampingFactor, St(this.panOffset, this.panOffset, 1 - this.dampingFactor)) : (this.deltaTheta = 0, this.deltaPhi = 0, gn(this.panOffset)), this.scale = 1, e.update();
    const h = !bn(r, this.previousPosition, fe), d = !bn(n, this.previousTarget, fe);
    return h || d;
  }
  /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
  reset() {
    this.disposed || (se(this.camera.position, this.initialPosition), se(this.camera.target, this.initialTarget), this.deltaTheta = 0, this.deltaPhi = 0, this.scale = 1, gn(this.panOffset), this.mode = "none", this.pinchDistance = 0, this.pointers.clear(), this.readSpherical(), this.camera.update());
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
    const e = Oe(H);
    e < fe || (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(Ue(H[1] / e, -1, 1)));
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
    const o = 2 * (Oe(H) * Math.tan(as(r.fov) / 2)) * this.panSpeed / s;
    pe(Kr, i[0], i[4], i[8]), pe(Jr, i[1], i[5], i[9]), xt(this.panOffset, this.panOffset, Kr, -e * o), xt(this.panOffset, this.panOffset, Jr, n * o);
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
    const n = Math.pow(Op, this.zoomSpeed);
    e.deltaY < 0 ? this.scale *= n : e.deltaY > 0 && (this.scale /= n);
  };
  onContextMenu = (e) => {
    !this.enabled || !this.enablePan || e.cancelable && e.preventDefault();
  };
}
const Re = F();
function ze() {
  return { position: [], normal: [], uv: [], index: [] };
}
function Zs() {
  return { position: [], color: [] };
}
function ge(t, e, n, r, i, s, a, o, l) {
  pe(Re, i, s, a), Cn(Re, Re), t.position.push(e, n, r), t.normal.push(Re[0], Re[1], Re[2]), t.uv.push(o, l);
}
function C(t, e, n, r, i, s, a, o) {
  t.position.push(e, n, r), t.color.push(i, s, a, o);
}
function ke(t) {
  return {
    position: Float32Array.from(t.position),
    normal: Float32Array.from(t.normal),
    uv: Float32Array.from(t.uv),
    indices: Uint32Array.from(t.index)
  };
}
function Qs(t) {
  return {
    position: Float32Array.from(t.position),
    color: Float32Array.from(t.color)
  };
}
function Ks(t) {
  return t.position.length / 3;
}
function j(t, e) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite positive number, got ${t}.`);
  return t;
}
function ei(t, e) {
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite non-negative number, got ${t}.`);
  return t;
}
function Z(t, e, n) {
  if (!Number.isInteger(t) || t < e)
    throw new RangeError(`[gpu-device-api] ${n} must be an integer greater than or equal to ${e}, got ${t}.`);
  return t;
}
const Dp = [0.5, 0.5, 0.5, 1];
function Ip(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius"), n = ze();
  for (let r = 0; r < 3; r++) {
    const i = Math.PI / 2 + r * 2 * Math.PI / 3, s = Math.cos(i) * e, a = Math.sin(i) * e;
    ge(n, s, a, 0, 0, 0, 1, s / (2 * e) + 0.5, a / (2 * e) + 0.5);
  }
  return n.index.push(0, 1, 2), ke(n);
}
function Vp(t = {}) {
  const e = j(t.width ?? 1, "options.width"), n = j(t.height ?? 1, "options.height"), r = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), i = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), s = ze(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = -n / 2 + l * n;
    for (let h = 0; h <= r; h++) {
      const d = h / r, f = -e / 2 + d * e;
      ge(s, f, c, 0, 0, 0, 1, d, l);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < r; l++) {
      const c = o * a + l, h = c + 1, d = c + a + 1, f = c + a;
      s.index.push(c, h, d, c, d, f);
    }
  return ke(s);
}
function Ge(t, e, n, r, i, s, a) {
  const o = Ks(t), l = s + 1;
  for (let c = 0; c <= a; c++) {
    const h = c / a;
    for (let d = 0; d <= s; d++) {
      const f = d / s;
      ge(
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
function Np(t = {}) {
  const e = j(t.width ?? 1, "options.width"), n = j(t.height ?? 1, "options.height"), r = j(t.depth ?? 1, "options.depth"), i = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = Z(t.depthSegments ?? 1, 1, "options.depthSegments"), o = e / 2, l = n / 2, c = r / 2, h = ze();
  return Ge(h, [o, -l, -c], [0, n, 0], [0, 0, r], [1, 0, 0], s, a), Ge(h, [-o, -l, -c], [0, 0, r], [0, n, 0], [-1, 0, 0], a, s), Ge(h, [-o, l, -c], [0, 0, r], [e, 0, 0], [0, 1, 0], a, i), Ge(h, [-o, -l, -c], [e, 0, 0], [0, 0, r], [0, -1, 0], i, a), Ge(h, [-o, -l, c], [e, 0, 0], [0, n, 0], [0, 0, 1], i, s), Ge(h, [-o, -l, -c], [0, n, 0], [e, 0, 0], [0, 0, -1], s, i), ke(h);
}
function zp(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius"), n = Z(t.widthSegments ?? 32, 3, "options.widthSegments"), r = Z(t.heightSegments ?? 16, 2, "options.heightSegments"), i = ze(), s = n + 1;
  for (let a = 0; a <= r; a++) {
    const o = a / r, l = o * Math.PI, c = Math.sin(l), h = Math.cos(l);
    for (let d = 0; d <= n; d++) {
      const f = d / n, p = f * Math.PI * 2, m = c * Math.cos(p), g = h, b = c * Math.sin(p);
      ge(i, m * e, g * e, b * e, m, g, b, f, 1 - o);
    }
  }
  for (let a = 0; a < r; a++)
    for (let o = 0; o < n; o++) {
      const l = a * s + o, c = l + 1, h = l + s + 1, d = l + s;
      i.index.push(l, c, h, l, h, d);
    }
  return ke(i);
}
function kp(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius"), n = j(t.tube ?? 0.2, "options.tube"), r = Z(t.radialSegments ?? 16, 3, "options.radialSegments"), i = Z(t.tubularSegments ?? 32, 3, "options.tubularSegments"), s = ze(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = l * Math.PI * 2, h = Math.cos(c), d = Math.sin(c);
    for (let f = 0; f <= r; f++) {
      const p = f / r, m = p * Math.PI * 2, g = Math.cos(m), b = Math.sin(m), w = e + n * g, T = g * h, S = b, A = g * d;
      ge(s, w * h, n * b, w * d, T, S, A, l, p);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < r; l++) {
      const c = o * a + l, h = c + 1, d = c + a + 1, f = c + a;
      s.index.push(c, h, d, c, d, f);
    }
  return ke(s);
}
function ti(t, e, n, r, i) {
  const s = Ks(t);
  ge(t, 0, e, 0, 0, r, 0, 0.5, 0.5);
  for (let a = 0; a <= i; a++) {
    const o = a / i * Math.PI * 2, l = Math.sin(o), c = Math.cos(o);
    ge(t, n * l, e, n * c, 0, r, 0, 0.5 + l * 0.5, 0.5 + c * 0.5);
  }
  for (let a = 0; a < i; a++) {
    const o = s + 1 + a, l = o + 1;
    r > 0 ? t.index.push(s, o, l) : t.index.push(s, l, o);
  }
}
function Js(t = {}) {
  const e = ei(t.radiusTop ?? 0.5, "options.radiusTop"), n = ei(t.radiusBottom ?? 0.5, "options.radiusBottom"), r = j(t.height ?? 1, "options.height"), i = Z(t.radialSegments ?? 24, 3, "options.radialSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = t.caps ?? !0;
  if (e === 0 && n === 0)
    throw new RangeError("[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.");
  const o = ze(), l = i + 1, c = Math.hypot(r, n - e), h = r / c, d = (n - e) / c;
  for (let f = 0; f <= s; f++) {
    const p = f / s, m = r / 2 - p * r, g = e + (n - e) * p;
    for (let b = 0; b <= i; b++) {
      const w = b / i, T = w * Math.PI * 2, S = Math.sin(T), A = Math.cos(T);
      ge(o, g * S, m, g * A, h * S, d, h * A, w, 1 - p);
    }
  }
  for (let f = 0; f < s; f++)
    for (let p = 0; p < i; p++) {
      const m = f * l + p, g = m + 1, b = m + l + 1, w = m + l;
      o.index.push(m, w, b, m, b, g);
    }
  return a && (e > 0 && ti(o, r / 2, e, 1, i), n > 0 && ti(o, -r / 2, n, -1, i)), ke(o);
}
function Wp(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius");
  return Js({
    radiusTop: 0,
    radiusBottom: e,
    height: t.height ?? 1,
    radialSegments: t.radialSegments ?? 24,
    heightSegments: 1,
    caps: t.caps ?? !0
  });
}
function qp(t = {}) {
  const e = j(t.size ?? 10, "options.size"), n = Z(t.divisions ?? 10, 1, "options.divisions"), r = t.plane ?? "xz", i = t.color ?? Dp, [s, a, o, l] = i, c = Zs(), h = e / 2, d = e / n;
  for (let f = 0; f <= n; f++) {
    const p = -h + f * d;
    r === "xz" ? (C(c, -h, 0, p, s, a, o, l), C(c, h, 0, p, s, a, o, l), C(c, p, 0, -h, s, a, o, l), C(c, p, 0, h, s, a, o, l)) : r === "xy" ? (C(c, -h, p, 0, s, a, o, l), C(c, h, p, 0, s, a, o, l), C(c, p, -h, 0, s, a, o, l), C(c, p, h, 0, s, a, o, l)) : (C(c, 0, -h, p, s, a, o, l), C(c, 0, h, p, s, a, o, l), C(c, 0, p, -h, s, a, o, l), C(c, 0, p, h, s, a, o, l));
  }
  return Qs(c);
}
function jp(t = {}) {
  const e = j(t.size ?? 1, "options.size"), n = Zs();
  return C(n, 0, 0, 0, 1, 0, 0, 1), C(n, e, 0, 0, 1, 0, 0, 1), C(n, 0, 0, 0, 0, 1, 0, 1), C(n, 0, e, 0, 0, 1, 0, 1), C(n, 0, 0, 0, 0, 0, 1, 1), C(n, 0, 0, e, 0, 0, 1, 1), Qs(n);
}
const Sg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createAxes: jp,
  createBox: Np,
  createCone: Wp,
  createCylinder: Js,
  createGrid: qp,
  createPlane: Vp,
  createSphere: zp,
  createTorus: kp,
  createTriangle: Ip
}, Symbol.toStringTag, { value: "Module" }));
function Ke(t, e) {
  return t ? [t[0], t[1], t[2], t[3] ?? 1] : [...e];
}
const Ee = {
  projectionView: "mat4x4f",
  model: "mat4x4f",
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它。 */
  normalMatrix: "mat3x3f"
};
function ea(t = {}) {
  const e = Ke(t.color, [1, 1, 1, 1]);
  return {
    name: "unlit",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Ee, baseColor: "vec4f" },
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
function ta(t = {}) {
  const e = aa(t.direction ?? [0.5, 1, 0.6]), n = Ke(t.color, [1, 1, 1, 1]);
  return {
    name: "lambert",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Ee,
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
function na(t = {}) {
  const e = aa(t.direction ?? [0.5, 1, 0.6]), n = Ke(t.color, [0.9, 0.9, 0.95, 1]), r = Ke(t.specular, [1, 1, 1, 1]);
  return {
    name: "phong",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Ee,
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
function ra() {
  return {
    name: "normalDebug",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Ee },
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
function ia(t = {}) {
  const e = Ke(t.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: "flatLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3" },
    uniforms: { ...Ee, baseColor: "vec4f" },
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
function sa() {
  return {
    name: "vertexColorLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3", color: "float32x4" },
    uniforms: { ...Ee },
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
const Xp = {
  unlit: ea,
  lambert: ta,
  phong: na,
  normalDebug: ra,
  flatLine: ia,
  vertexColorLine: sa
};
function Yp(t) {
  return t.defaults ? { ...t.defaults } : {};
}
function aa(t) {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}
const Ag = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SCENE_UNIFORM_FIELDS: Ee,
  defaultUniformsOf: Yp,
  flatLine: ia,
  lambert: ta,
  materials: Xp,
  normalDebug: ra,
  phong: na,
  unlit: ea,
  vertexColorLine: sa
}, Symbol.toStringTag, { value: "Module" }));
export {
  Wr as ATTRIBUTE_PLACEHOLDER,
  um as AddressMode,
  wa as BLEND_PRESETS,
  ju as BackendRegistry,
  R as BindingType,
  sm as BlendFactor,
  am as BlendOperation,
  O as BufferUsage,
  fi as CANVAS_DEPTH_FORMAT,
  ae as ColorWriteMask,
  im as CompareFunction,
  cm as CullMode,
  up as DEFAULT_BACKEND_ORDER,
  ba as DEFAULT_BLEND_COMPONENT,
  tr as DEFAULT_DEPTH_STATE,
  Wt as DEFAULT_PRIMITIVE_STATE,
  xu as DEG2RAD,
  ni as DEPTH_STENCIL_FORMATS,
  pn as DeviceLostError,
  Vm as DisposalScope,
  eg as EPSILON,
  hm as FilterMode,
  lm as FrontFace,
  sg as GLSL_PREAMBLE,
  us as GLSL_PRECISION_PREAMBLE,
  zu as GLSL_SAMPLER_TYPES,
  Vu as GLSL_TYPE_NAMES,
  ls as GLSL_VERSION_DIRECTIVE,
  kt as Geometry,
  Qe as GfxTexture,
  de as GpuError,
  tm as IndexFormat,
  Um as LOG_LEVEL_NAMES,
  $a as LOG_LEVEL_VALUES,
  nm as LoadOp,
  W as LogLevel,
  Wr as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  fn as MATERIAL_TEXTURE_PLACEHOLDER,
  hn as MATERIAL_UNIFORM_PLACEHOLDER,
  zt as Material,
  $g as OrbitControls,
  Tg as OrthographicCamera,
  pa as OutOfMemoryError,
  yg as PerspectiveCamera,
  Kp as PrimitiveTopology,
  mn as QueryType,
  yu as RAD2DEG,
  Hp as RENDERABLE_FORMATS,
  Xs as Renderer,
  Ee as SCENE_UNIFORM_FIELDS,
  Qp as SHADER_STAGE_NAMES,
  Lp as STANDARD_ATTRIBUTE_FORMATS,
  at as STENCIL_FACE_DEFAULT,
  q as ShaderStage,
  om as StencilOperation,
  rm as StoreOp,
  fn as TEXTURE_PLACEHOLDER,
  vt as TextureDimension,
  x as TextureUsage,
  Ir as UNIFORM_FIELD_TYPES,
  hn as UNIFORM_PLACEHOLDER,
  Sp as UniformArena,
  Ap as UniformArenaPool,
  Nt as UniformLayout,
  zr as UniformValues,
  ua as VERTEX_FORMAT_INFO,
  u as ValidationError,
  fm as VertexStepMode,
  pi as alignTo,
  _m as alignTo4,
  Mn as assert,
  ym as assertDefined,
  L as assertNever,
  Ct as assertNonNegativeInteger,
  Ye as assertPositiveInteger,
  Tm as assertPowerOfTwo,
  Hm as box3,
  Cp as buildMipChain,
  Am as byteLengthOf,
  ui as cacheKey,
  Ue as clamp,
  pg as clearShaders,
  Km as color,
  Fm as combineFlags,
  xn as compileShaderStage,
  Lm as concatTypedArrays,
  jp as createAxes,
  Np as createBox,
  Wp as createCone,
  Js as createCylinder,
  er as createDefaultBackendRegistry,
  vg as createDevice,
  Ws as createDeviceWithAdapter,
  xg as createGeometry,
  qp as createGrid,
  Je as createLogger,
  va as createPipelineCache,
  Vp as createPlane,
  zp as createSphere,
  kp as createTorus,
  Ip as createTriangle,
  wp as createUniforms,
  Rm as currentId,
  di as defaultPixelRatio,
  ga as defaultTextureUsage,
  Yp as defaultUniformsOf,
  Tp as defineMaterial,
  qs as defineUniforms,
  as as degToRad,
  xm as describeAdapter,
  Su as describeShaderSource,
  hp as detectBackend,
  mi as disposeAll,
  Xm as euler,
  gg as findWgslEntryPoint,
  ia as flatLine,
  Bm as formatFlags,
  ag as formatShaderErrorLog,
  Qm as frustum,
  ma as fullMipLevelCount,
  Dm as getGlobalLogLevel,
  hg as getShader,
  Lu as glslDefines,
  cs as glslFieldForStage,
  Nu as glslTypeName,
  Cm as hasAllFlags,
  Pm as hasAnyFlag,
  Mm as hasFlag,
  ug as hasShader,
  ca as indexFormatByteSize,
  qu as inferBindGroupLayoutEntries,
  Tu as inverseLerp,
  Sm as isArrayBufferView,
  wg as isBackendAvailable,
  ri as isBufferBinding,
  mm as isBufferBindingResource,
  oa as isDepthStencilFormat,
  Sa as isDisposable,
  da as isGpuError,
  _n as isImageSource,
  ii as isSamplerBinding,
  gm as isSamplerBindingResource,
  ds as isSamplerType,
  Zp as isSrgbFormat,
  dm as isTextureBinding,
  bm as isTextureBindingResource,
  Jp as isTriangleTopology,
  $m as isTypedArray,
  ta as lambert,
  os as languageForBackend,
  ng as lerp,
  Bu as listShaderKeys,
  Wm as mat3,
  qm as mat4,
  Ag as materials,
  je as measureCanvas,
  Au as missingSourceMessage,
  ig as nextAfter,
  G as nextId,
  ra as normalDebug,
  oi as normalizeBindGroupLayoutEntries,
  Im as nullLogger,
  og as numberLines,
  Ta as paddedCopy,
  na as phong,
  Ym as plane,
  em as primitiveCount,
  jm as quat,
  tg as radToDeg,
  Zm as ray,
  Jm as raycaster,
  ku as reflectGlslProgram,
  Wu as reflectSamplerUniforms,
  mg as reflectWgslBindings,
  Iu as reflectWgslEntryPoints,
  Fu as registerShader,
  cg as registerShaders,
  lg as replaceShader,
  fg as requireShader,
  Gm as resetIdCounter,
  wm as resolveBindingLayoutEntry,
  vm as resolveBlendState,
  hs as resolveGlslWrapOptions,
  hi as resolveLimits,
  si as resolveSamplerDescriptor,
  ai as resolveShaderSource,
  En as resolveTextureSize,
  Ln as resolveTextureViewDescriptor,
  pm as samplerKey,
  Om as setGlobalLogLevel,
  Sg as shapes,
  la as smallestIndexFormat,
  rg as smoothstep,
  $u as stageSource,
  fs as stripWgslComments,
  ya as toUint8View,
  Em as typedArrayElementSize,
  ea as unlit,
  dg as unregisterShader,
  ci as validateVertexBufferLayout,
  Nm as vec2,
  zm as vec3,
  km as vec4,
  li as vertexBufferLayoutsKey,
  sa as vertexColorLine,
  ha as vertexFormatGlslType,
  $e as vertexFormatInfo,
  fa as vertexFormatWgslType,
  bg as wgslBindingKeys,
  Mu as wgslDefines,
  Pu as wrapGlslSource,
  Cu as wrapWgslSource
};
//# sourceMappingURL=gpu-device-api.js.map
