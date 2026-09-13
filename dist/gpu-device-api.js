const G = {
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
}, v = {
  None: 0,
  CopySrc: 1,
  CopyDst: 2,
  /** 可通过 {@link TextureView} 采样。 */
  TextureBinding: 4,
  /** 可绑定为 storage texture（仅 WebGPU）。 */
  StorageBinding: 8,
  /** 可用作 render pass 的 color/depth attachment。 */
  RenderAttachment: 16
}, tr = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], Tu = [
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
  ...tr
];
function nn(t) {
  return tr.includes(t);
}
function Su(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const D = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, $u = {
  [D.Vertex]: "vertex",
  [D.Fragment]: "fragment",
  [D.Compute]: "compute"
}, Au = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function Eu(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function Lu(t, e) {
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
const _u = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function sn(t) {
  return t === "uint16" ? 2 : 4;
}
function Bu(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const Cu = {
  Load: "load",
  Clear: "clear"
}, Pu = {
  Store: "store",
  Discard: "discard"
}, Fu = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, Ru = {
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
}, Gu = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, Uu = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, Mu = {
  None: "none",
  Front: "front",
  Back: "back"
}, Ou = {
  Ccw: "ccw",
  Cw: "cw"
}, Du = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, Iu = {
  Nearest: "nearest",
  Linear: "linear"
};
function y(t, e, r, n = !1) {
  return { components: t, byteSize: e, kind: r, normalized: n };
}
const an = Object.freeze({
  uint8x2: y(2, 2, "uint"),
  uint8x4: y(4, 4, "uint"),
  sint8x2: y(2, 2, "sint"),
  sint8x4: y(4, 4, "sint"),
  unorm8x2: y(2, 2, "float", !0),
  unorm8x4: y(4, 4, "float", !0),
  snorm8x2: y(2, 2, "float", !0),
  snorm8x4: y(4, 4, "float", !0),
  uint16x2: y(2, 4, "uint"),
  uint16x4: y(4, 8, "uint"),
  sint16x2: y(2, 4, "sint"),
  sint16x4: y(4, 8, "sint"),
  unorm16x2: y(2, 4, "float", !0),
  unorm16x4: y(4, 8, "float", !0),
  snorm16x2: y(2, 4, "float", !0),
  snorm16x4: y(4, 8, "float", !0),
  float16x2: y(2, 4, "float"),
  float16x4: y(4, 8, "float"),
  float32: y(1, 4, "float"),
  float32x2: y(2, 8, "float"),
  float32x3: y(3, 12, "float"),
  float32x4: y(4, 16, "float"),
  uint32: y(1, 4, "uint"),
  uint32x2: y(2, 8, "uint"),
  uint32x3: y(3, 12, "uint"),
  uint32x4: y(4, 16, "uint"),
  sint32: y(1, 4, "sint"),
  sint32x2: y(2, 8, "sint"),
  sint32x3: y(3, 12, "sint"),
  sint32x4: y(4, 16, "sint")
});
function Ie(t) {
  const e = an[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function Vu(t) {
  const e = Ie(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function Nu(t) {
  const e = Ie(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const ku = {
  Vertex: "vertex",
  Instance: "instance"
}, M = {
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
function rr(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function Wu(t) {
  return t === "texture" || t === "storage-texture";
}
function nr(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class Z extends Error {
  code;
  details;
  constructor(e, r = {}) {
    super(e, r.cause === void 0 ? void 0 : { cause: r.cause }), this.name = "GpuError", this.code = r.code ?? "GPU_ERROR", r.details && (this.details = r.details);
  }
  /** 包含错误码的单行描述，便于日志输出。 */
  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}
function on(t) {
  return t instanceof Z;
}
class l extends Z {
  constructor(e, r = {}) {
    super(e, { ...r, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class ln extends Z {
  constructor(e, r = {}) {
    super(e, { ...r, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class st extends Z {
  reason;
  constructor(e, r = {}) {
    super(e, { ...r, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = r.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const Ge = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function dt(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function un(t) {
  const e = dt(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function zu(t = 0) {
  return v.CopyDst | v.TextureBinding | t;
}
function ht(t, e = {}) {
  const r = e.dimension ?? (t.dimension === "1d" ? "1d" : t.dimension === "3d" ? "3d" : t.depthOrArrayLayers > 1 ? "2d-array" : "2d");
  return {
    format: e.format,
    dimension: r,
    baseMipLevel: e.baseMipLevel ?? 0,
    mipLevelCount: e.mipLevelCount ?? t.mipLevelCount,
    baseArrayLayer: e.baseArrayLayer ?? 0,
    arrayLayerCount: e.arrayLayerCount ?? t.depthOrArrayLayers,
    aspect: e.aspect ?? "all"
  };
}
function ir(t = {}) {
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
function qu(t) {
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
function sr(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const at = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function ju(t) {
  return t.buffer !== void 0;
}
function Xu(t) {
  return t.sampler !== void 0;
}
function Yu(t) {
  return t.view !== void 0;
}
function Hu(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function ar(t) {
  if (t.length === 0)
    throw new Error("[gpu-device-api] A BindGroupLayout needs at least one entry.");
  const e = [...t].sort((r, n) => r.binding - n.binding);
  for (let r = 0; r < e.length; r++) {
    const n = e[r];
    if (!Number.isInteger(n.binding) || n.binding < 0)
      throw new Error(`[gpu-device-api] BindGroupLayout entry #${r} has an invalid binding index ${n.binding}.`);
    if (r > 0 && e[r - 1].binding === n.binding)
      throw new Error(`[gpu-device-api] Duplicate binding index ${n.binding} in a BindGroupLayout.`);
  }
  return e;
}
function or(t, e) {
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
  for (const r of t.attributes) {
    const n = Ie(r.format);
    if (r.shaderLocation < 0 || r.shaderLocation >= e.maxVertexAttributes)
      throw new Error(
        `[gpu-device-api] VertexAttribute.shaderLocation ${r.shaderLocation} is outside [0, ${e.maxVertexAttributes - 1}].`
      );
    if (r.offset < 0 || r.offset % 4 !== 0)
      throw new Error(`[gpu-device-api] VertexAttribute.offset must be a non-negative multiple of 4, got ${r.offset}.`);
    if (r.offset + n.byteSize > t.arrayStride)
      throw new Error(
        `[gpu-device-api] VertexAttribute at location ${r.shaderLocation} reads ${n.byteSize} bytes from offset ${r.offset}, which overflows arrayStride ${t.arrayStride}.`
      );
  }
}
function lr(t) {
  return t.map((e) => {
    const r = e.attributes.map((n) => `${n.shaderLocation}@${n.offset}:${n.format}`).join(",");
    return `${e.arrayStride}/${e.stepMode ?? "vertex"}[${r}]`;
  }).join(";");
}
const H = {
  None: 0,
  Red: 1,
  Green: 2,
  Blue: 4,
  Alpha: 8,
  All: 15
}, We = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, $t = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, cn = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, Se = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, dn = Object.freeze({
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
function Ku(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = dn[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function hn(t = 128, e) {
  const r = /* @__PURE__ */ new Map(), n = () => {
    for (; r.size > t; ) {
      const i = r.keys().next();
      if (i.done) return;
      const s = i.value, a = r.get(s);
      r.delete(s), e?.(a, s);
    }
  };
  return {
    get(i) {
      const s = r.get(i);
      if (s !== void 0)
        return r.delete(i), r.set(i, s), s;
    },
    set(i, s) {
      return r.get(i) !== void 0 && r.delete(i), r.set(i, s), n(), s;
    },
    has(i) {
      return r.has(i);
    },
    delete(i) {
      return r.delete(i);
    },
    clear() {
      r.clear();
    },
    get size() {
      return r.size;
    },
    values() {
      return [...r.values()];
    }
  };
}
function ur(...t) {
  return t.filter((e) => e != null && e !== "").join("|");
}
function Qu(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function cr(t, e, r) {
  if (!e) return { ...t };
  const n = { ...t };
  for (const [i, s] of Object.entries(e)) {
    if (typeof s != "number") continue;
    const a = t[i];
    if (typeof a != "number")
      throw new l(`[gpu-device-api] Unknown device limit "${String(i)}".`);
    if (s > a)
      throw new l(
        `[gpu-device-api] The ${r} adapter cannot satisfy ${String(i)} = ${s} (available: ${a}).`
      );
    n[i] = s;
  }
  return n;
}
function pe(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function dr() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function ft(t, e, r) {
  if (!t) throw new l(e, r ? { details: r } : {});
}
function Zu(t, e, r) {
  if (t == null)
    throw new l(e, r ? { details: r } : {});
  return t;
}
function $(t, e) {
  throw new l(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function ge(t, e) {
  ft(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function Ve(t, e) {
  ft(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function Ju(t, e) {
  ft(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const fn = [
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
function ec(t) {
  return fn.some((e) => t instanceof e);
}
function tc(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function rc(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function pn(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function hr(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function nc(t) {
  return t + 3 & -4;
}
function mn(t, e = 4) {
  const r = pn(t), n = hr(r.byteLength, e);
  if (n === r.byteLength) return r;
  const i = new Uint8Array(n);
  return i.set(r), i;
}
function ic(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function sc(t) {
  if (t.length === 0) throw new RangeError("[gpu-device-api] concatTypedArrays() received no arrays.");
  const e = t[0];
  let r = 0;
  for (const a of t) r += a.length;
  const n = e.constructor, i = new n(r);
  let s = 0;
  for (const a of t)
    i.set(a, s), s += a.length;
  return i;
}
function ac(t, e) {
  return (t & e) === e;
}
function oc(t, e) {
  return (t & e) !== 0;
}
function lc(t, e) {
  return (t & e) === e;
}
function uc(...t) {
  let e = 0;
  for (const r of t) e |= r;
  return e;
}
function cc(t, e) {
  if (t === 0) return "None";
  const r = [];
  let n = 0;
  for (const [s, a] of Object.entries(e)) {
    const o = Number(s);
    o !== 0 && (t & o) === o && (r.push(a), n |= o);
  }
  const i = t & ~n;
  return i && r.push(`0x${i.toString(16)}`), r.join(" | ");
}
let Me = 0;
function R(t) {
  return Me += 1, `${t}#${Me}`;
}
function dc() {
  return Me;
}
function hc() {
  Me = 0;
}
const O = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, fc = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, gn = {
  silent: O.Silent,
  error: O.Error,
  warn: O.Warn,
  info: O.Info,
  debug: O.Debug,
  trace: O.Trace
};
let pt = O.Warn;
function pc(t) {
  pt = typeof t == "string" ? gn[t] : t;
}
function mc() {
  return pt;
}
function Ne(t = "gpu-device-api", e) {
  const r = () => e ?? pt, n = (i, s, a, o) => {
    r() < i || s(`[${t}] ${a}`, ...o);
  };
  return {
    get level() {
      return r();
    },
    error: (i, ...s) => n(O.Error, console.error, i, s),
    warn: (i, ...s) => n(O.Warn, console.warn, i, s),
    info: (i, ...s) => n(O.Info, console.info, i, s),
    debug: (i, ...s) => n(O.Debug, console.debug, i, s),
    trace: (i, ...s) => n(O.Trace, console.debug, i, s)
  };
}
const gc = {
  level: O.Silent,
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
function bn(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function fr(t) {
  let e;
  for (const r of t)
    if (bn(r))
      try {
        r.dispose();
      } catch (n) {
        e ??= n;
      }
  if (e !== void 0) throw e;
}
class bc {
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
    this.resources.clear(), fr(e);
  }
}
function wn() {
  return new Float32Array(2);
}
function vn(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function yn(t, e) {
  const r = new Float32Array(2);
  return r[0] = t, r[1] = e, r;
}
function xn(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function Tn(t, e, r) {
  return t[0] = e, t[1] = r, t;
}
function Sn(t) {
  return t[0] = 0, t[1] = 0, t;
}
function $n(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t;
}
function An(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t;
}
function En(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t;
}
function Ln(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t;
}
function _n(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t;
}
function Bn(t, e, r, n) {
  return t[0] = e[0] + r[0] * n, t[1] = e[1] + r[1] * n, t;
}
function Cn(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function Pn(t, e) {
  const r = e[0], n = e[1];
  let i = Math.hypot(r, n);
  return i > 0 && (i = 1 / i), t[0] = r * i, t[1] = n * i, t;
}
function Fn(t) {
  return Math.hypot(t[0], t[1]);
}
function Rn(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function Gn(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function Un(t, e) {
  const r = t[0] - e[0], n = t[1] - e[1];
  return r * r + n * n;
}
function Mn(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function On(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function Dn(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t;
}
function In(t, e, r) {
  return t[0] = Math.min(e[0], r[0]), t[1] = Math.min(e[1], r[1]), t;
}
function Vn(t, e, r) {
  return t[0] = Math.max(e[0], r[0]), t[1] = Math.max(e[1], r[1]), t;
}
function Nn(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r;
}
function kn(t, e, r) {
  const n = e[0], i = e[1];
  return t[0] = r[0] * n + r[3] * i + r[6], t[1] = r[1] * n + r[4] * i + r[7], t;
}
function Wn(t) {
  return [t[0], t[1]];
}
function zn(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const wc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: $n,
  clone: vn,
  copy: xn,
  create: wn,
  cross: On,
  distance: Gn,
  div: Ln,
  dot: Mn,
  equals: Nn,
  fromValues: yn,
  length: Fn,
  lerp: Dn,
  max: Vn,
  min: In,
  mul: En,
  negate: Cn,
  normalize: Pn,
  scale: _n,
  scaleAndAdd: Bn,
  set: Tn,
  squaredDistance: Un,
  squaredLength: Rn,
  sub: An,
  toArray: Wn,
  toString: zn,
  transformMat3: kn,
  zero: Sn
}, Symbol.toStringTag, { value: "Module" }));
function qn() {
  return new Float32Array(3);
}
function jn(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function Xn(t, e, r) {
  const n = new Float32Array(3);
  return n[0] = t, n[1] = e, n[2] = r, n;
}
function Yn(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function Hn(t, e, r, n) {
  return t[0] = e, t[1] = r, t[2] = n, t;
}
function Kn(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function Qn(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t[2] = e[2] + r[2], t;
}
function Zn(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t[2] = e[2] - r[2], t;
}
function Jn(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t[2] = e[2] * r[2], t;
}
function ei(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t[2] = e[2] / r[2], t;
}
function ti(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t;
}
function ri(t, e, r, n) {
  return t[0] = e[0] + r[0] * n, t[1] = e[1] + r[1] * n, t[2] = e[2] + r[2] * n, t;
}
function ni(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function ii(t, e) {
  const r = e[0], n = e[1], i = e[2];
  let s = Math.hypot(r, n, i);
  return s > 0 && (s = 1 / s), t[0] = r * s, t[1] = n * s, t[2] = i * s, t;
}
function si(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function ai(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function oi(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function li(t, e) {
  const r = t[0] - e[0], n = t[1] - e[1], i = t[2] - e[2];
  return r * r + n * n + i * i;
}
function pr(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function ui(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = r[0], o = r[1], u = r[2];
  return t[0] = i * u - s * o, t[1] = s * a - n * u, t[2] = n * o - i * a, t;
}
function ci(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t[2] = e[2] + n * (r[2] - e[2]), t;
}
function di(t, e, r) {
  return t[0] = Math.min(e[0], r[0]), t[1] = Math.min(e[1], r[1]), t[2] = Math.min(e[2], r[2]), t;
}
function hi(t, e, r) {
  return t[0] = Math.max(e[0], r[0]), t[1] = Math.max(e[1], r[1]), t[2] = Math.max(e[2], r[2]), t;
}
function fi(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r;
}
function pi(t, e, r) {
  const n = pr(r, e) * 2;
  return t[0] = e[0] - r[0] * n, t[1] = e[1] - r[1] * n, t[2] = e[2] - r[2] * n, t;
}
function mi(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[3] * i + r[6] * s, t[1] = r[1] * n + r[4] * i + r[7] * s, t[2] = r[2] * n + r[5] * i + r[8] * s, t;
}
function gi(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  let a = r[3] * n + r[7] * i + r[11] * s + r[15];
  return a = a || 1, t[0] = (r[0] * n + r[4] * i + r[8] * s + r[12]) / a, t[1] = (r[1] * n + r[5] * i + r[9] * s + r[13]) / a, t[2] = (r[2] * n + r[6] * i + r[10] * s + r[14]) / a, t;
}
function bi(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[4] * i + r[8] * s, t[1] = r[1] * n + r[5] * i + r[9] * s, t[2] = r[2] * n + r[6] * i + r[10] * s, t;
}
function wi(t) {
  return [t[0], t[1], t[2]];
}
function vi(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const vc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Qn,
  clone: jn,
  copy: Yn,
  create: qn,
  cross: ui,
  distance: oi,
  div: ei,
  dot: pr,
  equals: fi,
  fromValues: Xn,
  length: si,
  lerp: ci,
  max: hi,
  min: di,
  mul: Jn,
  negate: ni,
  normalize: ii,
  reflect: pi,
  scale: ti,
  scaleAndAdd: ri,
  set: Hn,
  squaredDistance: li,
  squaredLength: ai,
  sub: Zn,
  toArray: wi,
  toString: vi,
  transformDirection: bi,
  transformMat3: mi,
  transformMat4: gi,
  zero: Kn
}, Symbol.toStringTag, { value: "Module" }));
function yi() {
  return new Float32Array(4);
}
function xi(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function Ti(t, e, r, n) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = r, i[3] = n, i;
}
function Si(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function $i(t, e, r, n, i) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t;
}
function Ai(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function Ei(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t[2] = e[2] + r[2], t[3] = e[3] + r[3], t;
}
function Li(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t[2] = e[2] - r[2], t[3] = e[3] - r[3], t;
}
function _i(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t[2] = e[2] * r[2], t[3] = e[3] * r[3], t;
}
function Bi(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t[2] = e[2] / r[2], t[3] = e[3] / r[3], t;
}
function Ci(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function Pi(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function Fi(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3];
  let a = Math.hypot(r, n, i, s);
  return a > 0 && (a = 1 / a), t[0] = r * a, t[1] = n * a, t[2] = i * a, t[3] = s * a, t;
}
function Ri(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function Gi(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function Ui(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Mi(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t[2] = e[2] + n * (r[2] - e[2]), t[3] = e[3] + n * (r[3] - e[3]), t;
}
function Oi(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r && Math.abs(t[3] - e[3]) <= r;
}
function Di(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = r[0] * n + r[4] * i + r[8] * s + r[12] * a, t[1] = r[1] * n + r[5] * i + r[9] * s + r[13] * a, t[2] = r[2] * n + r[6] * i + r[10] * s + r[14] * a, t[3] = r[3] * n + r[7] * i + r[11] * s + r[15] * a, t;
}
function Ii(t) {
  return [t[0], t[1], t[2], t[3]];
}
function Vi(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const yc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ei,
  clone: xi,
  copy: Si,
  create: yi,
  div: Bi,
  dot: Ui,
  equals: Oi,
  fromValues: Ti,
  length: Ri,
  lerp: Mi,
  mul: _i,
  negate: Pi,
  normalize: Fi,
  scale: Ci,
  set: $i,
  squaredLength: Gi,
  sub: Li,
  toArray: Ii,
  toString: Vi,
  transformMat4: Di,
  zero: Ai
}, Symbol.toStringTag, { value: "Module" }));
function Ni() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function ki(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function Wi(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function zi(t, e, r, n, i, s, a, o, u) {
  const c = new Float32Array(9);
  return c[0] = t, c[1] = e, c[2] = r, c[3] = n, c[4] = i, c[5] = s, c[6] = a, c[7] = o, c[8] = u, c;
}
function qi(t, e) {
  return t.set(e), t;
}
function ji(t, e, r, n, i, s, a, o, u, c) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = u, t[8] = c, t;
}
function mr(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function gr(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], u = e[6], c = e[7], d = e[8];
  return t[0] = r, t[1] = s, t[2] = u, t[3] = n, t[4] = a, t[5] = c, t[6] = i, t[7] = o, t[8] = d, t;
}
function Xi(t) {
  const e = t[0], r = t[1], n = t[2], i = t[3], s = t[4], a = t[5], o = t[6], u = t[7], c = t[8], d = c * s - a * u, h = -c * i + a * o, f = u * i - s * o;
  return e * d + r * h + n * f;
}
function br(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], u = e[6], c = e[7], d = e[8], h = d * a - o * c, f = -d * s + o * u, p = c * s - a * u;
  let m = r * h + n * f + i * p;
  return m ? (m = 1 / m, t[0] = h * m, t[1] = (-d * n + i * c) * m, t[2] = (o * n - i * a) * m, t[3] = f * m, t[4] = (d * r - i * u) * m, t[5] = (-o * r + i * s) * m, t[6] = p * m, t[7] = (-c * r + n * u) * m, t[8] = (a * r - n * s) * m, t) : null;
}
function Yi(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], u = e[5], c = e[6], d = e[7], h = e[8], f = r[0], p = r[1], m = r[2], g = r[3], x = r[4], S = r[5], A = r[6], E = r[7], L = r[8];
  return t[0] = f * n + p * a + m * c, t[1] = f * i + p * o + m * d, t[2] = f * s + p * u + m * h, t[3] = g * n + x * a + S * c, t[4] = g * i + x * o + S * d, t[5] = g * s + x * u + S * h, t[6] = A * n + E * a + L * c, t[7] = A * i + E * o + L * d, t[8] = A * s + E * u + L * h, t;
}
function Hi(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], u = e[5], c = e[6], d = e[7], h = e[8], f = r[0], p = r[1], m = r[2];
  return t[0] = f * n, t[1] = f * i, t[2] = f * s, t[3] = p * a, t[4] = p * o, t[5] = p * u, t[6] = m * c, t[7] = m * d, t[8] = m * h, t;
}
function Ki(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], u = e[5], c = e[6], d = e[7], h = e[8], f = r[0], p = r[1];
  return t[0] = n, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = u, t[6] = f * n + p * a + c, t[7] = f * i + p * o + d, t[8] = f * s + p * u + h, t;
}
function Qi(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], u = e[5], c = e[6], d = e[7], h = e[8], f = Math.sin(r), p = Math.cos(r);
  return t[0] = p * n + f * a, t[1] = p * i + f * o, t[2] = p * s + f * u, t[3] = p * a - f * n, t[4] = p * o - f * i, t[5] = p * u - f * s, t[6] = c, t[7] = d, t[8] = h, t;
}
function Zi(t, e) {
  return mr(t, e), br(t, t) ? (gr(t, t), t) : null;
}
function Ji(t, e, r = 1e-6) {
  for (let n = 0; n < 9; n++)
    if (Math.abs(t[n] - e[n]) > r) return !1;
  return !0;
}
function es(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const xc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Wi,
  copy: qi,
  create: Ni,
  determinant: Xi,
  equals: Ji,
  fromMat4: mr,
  fromValues: zi,
  identity: ki,
  invert: br,
  multiply: Yi,
  normalFromMat4: Zi,
  rotate: Qi,
  scale: Hi,
  set: ji,
  toString: es,
  translate: Ki,
  transpose: gr
}, Symbol.toStringTag, { value: "Module" })), Oe = 1e-6, Y = new Float32Array(16), ts = new Float32Array(3);
function rs() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function Q(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function ns(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function wr(t) {
  return t.fill(0), t;
}
function is(...t) {
  const e = new Float32Array(16);
  for (let r = 0; r < 16; r++) e[r] = t[r] ?? 0;
  return e;
}
function vr(t, e) {
  return t.set(e), t;
}
function ss(t, ...e) {
  for (let r = 0; r < 16; r++) t[r] = e[r] ?? 0;
  return t;
}
function as(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], u = e[6], c = e[7], d = e[8], h = e[9], f = e[10], p = e[11], m = e[12], g = e[13], x = e[14], S = e[15];
  return t[0] = r, t[1] = a, t[2] = d, t[3] = m, t[4] = n, t[5] = o, t[6] = h, t[7] = g, t[8] = i, t[9] = u, t[10] = f, t[11] = x, t[12] = s, t[13] = c, t[14] = p, t[15] = S, t;
}
function yr(t) {
  const e = t[0], r = t[1], n = t[2], i = t[3], s = t[4], a = t[5], o = t[6], u = t[7], c = t[8], d = t[9], h = t[10], f = t[11], p = t[12], m = t[13], g = t[14], x = t[15], S = e * a - r * s, A = e * o - n * s, E = e * u - i * s, L = r * o - n * a, B = r * u - i * a, C = n * u - i * o, P = c * m - d * p, I = c * g - h * p, V = c * x - f * p, N = d * g - h * m, k = d * x - f * m, W = h * x - f * g;
  return S * W - A * k + E * N + L * V - B * I + C * P;
}
function os(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], u = e[6], c = e[7], d = e[8], h = e[9], f = e[10], p = e[11], m = e[12], g = e[13], x = e[14], S = e[15], A = r * o - n * a, E = r * u - i * a, L = r * c - s * a, B = n * u - i * o, C = n * c - s * o, P = i * c - s * u, I = d * g - h * m, V = d * x - f * m, N = d * S - p * m, k = h * x - f * g, W = h * S - p * g, q = f * S - p * x;
  let T = A * q - E * W + L * k + B * N - C * V + P * I;
  return T ? (T = 1 / T, t[0] = (o * q - u * W + c * k) * T, t[1] = (i * W - n * q - s * k) * T, t[2] = (g * P - x * C + S * B) * T, t[3] = (f * C - h * P - p * B) * T, t[4] = (u * N - a * q - c * V) * T, t[5] = (r * q - i * N + s * V) * T, t[6] = (x * L - m * P - S * E) * T, t[7] = (d * P - f * L + p * E) * T, t[8] = (a * W - o * N + c * I) * T, t[9] = (n * N - r * W - s * I) * T, t[10] = (m * C - g * L + S * A) * T, t[11] = (h * L - d * C - p * A) * T, t[12] = (o * V - a * k - u * I) * T, t[13] = (r * k - n * V + i * I) * T, t[14] = (g * E - m * B - x * A) * T, t[15] = (d * B - h * E + f * A) * T, t) : null;
}
function ne(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], u = e[5], c = e[6], d = e[7], h = e[8], f = e[9], p = e[10], m = e[11], g = e[12], x = e[13], S = e[14], A = e[15], E = r[0], L = r[1], B = r[2], C = r[3], P = r[4], I = r[5], V = r[6], N = r[7], k = r[8], W = r[9], q = r[10], T = r[11], ve = r[12], ye = r[13], xe = r[14], Te = r[15];
  return t[0] = E * n + L * o + B * h + C * g, t[1] = E * i + L * u + B * f + C * x, t[2] = E * s + L * c + B * p + C * S, t[3] = E * a + L * d + B * m + C * A, t[4] = P * n + I * o + V * h + N * g, t[5] = P * i + I * u + V * f + N * x, t[6] = P * s + I * c + V * p + N * S, t[7] = P * a + I * d + V * m + N * A, t[8] = k * n + W * o + q * h + T * g, t[9] = k * i + W * u + q * f + T * x, t[10] = k * s + W * c + q * p + T * S, t[11] = k * a + W * d + q * m + T * A, t[12] = ve * n + ye * o + xe * h + Te * g, t[13] = ve * i + ye * u + xe * f + Te * x, t[14] = ve * s + ye * c + xe * p + Te * S, t[15] = ve * a + ye * d + xe * m + Te * A, t;
}
function ls(t, ...e) {
  if (e.length === 0) return Q(t);
  vr(t, e[0]);
  for (let r = 1; r < e.length; r++) ne(t, t, e[r]);
  return t;
}
function xr(t, e) {
  return Q(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function us(t, e) {
  return Q(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function Tr(t, e, r) {
  let n = r[0], i = r[1], s = r[2], a = Math.hypot(n, i, s);
  if (a < Oe) return Q(t);
  a = 1 / a, n *= a, i *= a, s *= a;
  const o = Math.sin(e), u = Math.cos(e), c = 1 - u, d = n * n * c + u, h = i * n * c + s * o, f = s * n * c - i * o, p = n * i * c - s * o, m = i * i * c + u, g = s * i * c + n * o, x = n * s * c + i * o, S = i * s * c - n * o, A = s * s * c + u;
  return t[0] = d, t[1] = h, t[2] = f, t[3] = 0, t[4] = p, t[5] = m, t[6] = g, t[7] = 0, t[8] = x, t[9] = S, t[10] = A, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Sr(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return Q(t), t[5] = n, t[6] = r, t[9] = -r, t[10] = n, t;
}
function $r(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return Q(t), t[0] = n, t[2] = -r, t[8] = r, t[10] = n, t;
}
function Ar(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return Q(t), t[0] = n, t[1] = r, t[4] = -r, t[5] = n, t;
}
function cs(t, e, r, n) {
  return mt(t, e, r, n, ds);
}
const ds = new Float32Array([1, 1, 1]);
function mt(t, e, r, n, i) {
  let s = r[0], a = r[1], o = r[2], u = Math.hypot(s, a, o);
  if (u < Oe)
    return Q(t), t[12] = n[0], t[13] = n[1], t[14] = n[2], t;
  u = 1 / u, s *= u, a *= u, o *= u;
  const c = Math.sin(e), d = Math.cos(e), h = 1 - d, f = s * s * h + d, p = a * s * h + o * c, m = o * s * h - a * c, g = s * a * h - o * c, x = a * a * h + d, S = o * a * h + s * c, A = s * o * h + a * c, E = a * o * h - s * c, L = o * o * h + d, B = i[0], C = i[1], P = i[2];
  return t[0] = f * B, t[1] = p * B, t[2] = m * B, t[3] = 0, t[4] = g * C, t[5] = x * C, t[6] = S * C, t[7] = 0, t[8] = A * P, t[9] = E * P, t[10] = L * P, t[11] = 0, t[12] = n[0], t[13] = n[1], t[14] = n[2], t[15] = 1, t;
}
function hs(t, e, r, n, i, s) {
  mt(t, e, r, n, i);
  const a = s[0], o = s[1], u = s[2];
  return t[12] = n[0] + a - (t[0] * a + t[4] * o + t[8] * u), t[13] = n[1] + o - (t[1] * a + t[5] * o + t[9] * u), t[14] = n[2] + u - (t[2] * a + t[6] * o + t[10] * u), t;
}
function fs(t, e, r) {
  return xr(Y, r), ne(t, e, Y);
}
function ps(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function ms(t, e, r, n) {
  return Tr(Y, r, n), ne(t, e, Y);
}
function gs(t, e, r) {
  return Sr(Y, r), ne(t, e, Y);
}
function bs(t, e, r) {
  return $r(Y, r), ne(t, e, Y);
}
function ws(t, e, r) {
  return Ar(Y, r), ne(t, e, Y);
}
function vs(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function Er(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function ys(t, e) {
  const r = Er(ts, e), n = yr(e) < 0 ? -1 : 1, i = r[0] * n, s = r[1], a = r[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function xs(t, e, r, n, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / r, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (n - i);
    t[10] = (i + n) * a, t[14] = 2 * i * n * a;
  } else
    t[10] = -1, t[14] = -2 * n;
  return t;
}
function Ts(t, e, r, n, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / r, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (n - i), t[14] = i * n / (n - i)) : (t[10] = -1, t[14] = -n), t;
}
function Ss(t, e, r, n, i, s, a) {
  const o = 1 / (e - r), u = 1 / (n - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * u, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * c, t[11] = 0, t[12] = (e + r) * o, t[13] = (i + n) * u, t[14] = (a + s) * c, t[15] = 1, t;
}
function $s(t, e, r, n, i, s, a) {
  const o = 1 / (e - r), u = 1 / (n - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * u, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = c, t[11] = 0, t[12] = (e + r) * o, t[13] = (i + n) * u, t[14] = s * c, t[15] = 1, t;
}
function As(t, e, r, n, i, s, a) {
  const o = 1 / (r - e), u = 1 / (i - n), c = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * u, t[6] = 0, t[7] = 0, t[8] = (r + e) * o, t[9] = (i + n) * u, t[10] = (a + s) * c, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * c, t[15] = 0, t;
}
function Es(t, e, r, n) {
  let i = e[0] - r[0], s = e[1] - r[1], a = e[2] - r[2], o = Math.hypot(i, s, a);
  if (o < Oe) return wr(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let u = n[1] * a - n[2] * s, c = n[2] * i - n[0] * a, d = n[0] * s - n[1] * i;
  o = Math.hypot(u, c, d), o < Oe ? (u = 0, c = 0, d = 0) : (o = 1 / o, u *= o, c *= o, d *= o);
  const h = s * d - a * c, f = a * u - i * d, p = i * c - s * u;
  return t[0] = u, t[1] = h, t[2] = i, t[3] = 0, t[4] = c, t[5] = f, t[6] = s, t[7] = 0, t[8] = d, t[9] = p, t[10] = a, t[11] = 0, t[12] = -(u * e[0] + c * e[1] + d * e[2]), t[13] = -(h * e[0] + f * e[1] + p * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function Ls(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  let a = e[3] * n + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * n + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * n + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * n + e[6] * i + e[10] * s + e[14]) / a, t;
}
function _s(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  return t[0] = e[0] * n + e[4] * i + e[8] * s, t[1] = e[1] * n + e[5] * i + e[9] * s, t[2] = e[2] * n + e[6] * i + e[10] * s, t;
}
function Bs(t, e, r = 1e-6) {
  for (let n = 0; n < 16; n++)
    if (Math.abs(t[n] - e[n]) > r) return !1;
  return !0;
}
function Cs(t) {
  const e = [];
  for (let r = 0; r < 4; r++)
    e.push(
      `[${t[r]}, ${t[r + 4]}, ${t[r + 8]}, ${t[r + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const Tc = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: ns,
  copy: vr,
  create: rs,
  determinant: yr,
  equals: Bs,
  fromRotation: Tr,
  fromRotationTranslation: cs,
  fromRotationTranslationScale: mt,
  fromRotationTranslationScaleOrigin: hs,
  fromScaling: us,
  fromTranslation: xr,
  fromValues: is,
  fromXRotation: Sr,
  fromYRotation: $r,
  fromZRotation: Ar,
  frustum: As,
  getRotation: ys,
  getScaling: Er,
  getTranslation: vs,
  identity: Q,
  invert: os,
  lookAt: Es,
  multiply: ne,
  multiplyAll: ls,
  ortho: Ss,
  orthoZO: $s,
  perspective: xs,
  perspectiveZO: Ts,
  rotate: ms,
  rotateX: gs,
  rotateY: bs,
  rotateZ: ws,
  scale: ps,
  set: ss,
  toString: Cs,
  transformDirection: _s,
  transformPoint: Ls,
  translate: fs,
  transpose: as,
  zero: wr
}, Symbol.toStringTag, { value: "Module" })), Sc = 1e-6, Ps = Math.PI / 180, Fs = 180 / Math.PI;
function $c(t) {
  return t * Ps;
}
function Ac(t) {
  return t * Fs;
}
function Rs(t, e, r) {
  return t < e ? e : t > r ? r : t;
}
function Gs(t, e, r) {
  return e === t ? 0 : Rs((r - t) / (e - t), 0, 1);
}
function Ec(t, e, r) {
  return t + (e - t) * r;
}
function Lc(t, e, r) {
  const n = Gs(t, e, r);
  return n * n * (3 - 2 * n);
}
function _c(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function Lr(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function _r(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function Us(t, e, r) {
  if (e === "wgsl") return t.wgsl;
  const n = _r(r);
  return n ? t[n] : void 0;
}
function Ms(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function Os(t, e, r, n) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = Lr(t) === "glsl" ? `请在 \`code\` 里提供 \`${_r(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${n}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${Ms(r)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const Ds = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, Is = /^\s*#version[^\n]*\n?/;
function Vs(t) {
  return t ? Object.entries(t).map(([e, r]) => typeof r == "boolean" ? `#define ${e} ${r ? 1 : 0}` : `#define ${e} ${r}`).join(`
`) : "";
}
function Ns(t) {
  return t ? Object.entries(t).map(([e, r]) => typeof r == "boolean" ? `const ${e}: bool = ${r};` : typeof r == "number" ? Number.isInteger(r) ? `const ${e}: i32 = ${r};` : `const ${e}: f32 = ${r};` : `const ${e}: f32 = ${r};`).join(`
`) : "";
}
function ks(t, e, r = "shader") {
  const n = /^\s*#version\s+([^\n]*)/.exec(t);
  if (n) {
    const a = n[1].trim();
    if (!/^300\s+es\b/.test(a))
      throw new l(
        `[gpu-device-api] ShaderModule「${r}」声明了 \`#version ${a}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。`
      );
  }
  const i = t.replace(Is, ""), s = Vs(e);
  return `${Ds}${s ? `${s}
` : ""}${i.trim()}
`;
}
function Ws(t, e) {
  const r = Ns(e);
  return r ? `${r}

${t.trim()}
` : `${t.trim()}
`;
}
function ot(t) {
  const { backend: e, source: r, stage: n, label: i = "shader" } = t, s = Lr(e), a = Us(r, s, n);
  if (a === void 0)
    throw new l(Os(e, n, r, i));
  const o = s === "glsl" ? ks(a, t.defines, i) : Ws(a, t.defines);
  return { language: s, stage: n, code: o, hasPreamble: s === "glsl" };
}
function Bc(t, e, r) {
  const n = e.split(`
`), i = `[gpu-device-api] 着色器「${r}」编译失败：
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
${lt(n)}
`;
  const u = [];
  for (const c of [...s].sort((d, h) => d - h)) {
    u.push(`----- 第 ${c} 行附近 -----`);
    const d = Math.max(1, c - 3), h = Math.min(n.length, c + 3);
    u.push(lt(n.slice(d - 1, h), d));
  }
  return `${i}
${u.join(`
`)}
`;
}
function lt(t, e = 1) {
  const r = String(e + t.length - 1).length;
  return t.map((n, i) => `${String(e + i).padStart(r, " ")} | ${n}`).join(`
`);
}
function Cc(t) {
  return lt(t.split(`
`));
}
const K = /* @__PURE__ */ new Map();
function zs(t, e) {
  if (K.has(t))
    throw new l(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return K.set(t, e), e;
}
function Pc(t) {
  for (const [e, r] of Object.entries(t)) zs(e, r);
}
function Fc(t, e) {
  return K.set(t, e), e;
}
function Rc(t) {
  return K.has(t);
}
function Gc(t) {
  return K.get(t);
}
function Uc(t) {
  const e = K.get(t);
  if (!e) {
    const r = qs();
    throw new l(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (r.length > 0 ? `已注册：${r.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function Mc(t) {
  return K.delete(t);
}
function qs() {
  return [...K.keys()].sort();
}
function Oc() {
  K.clear();
}
function Br(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const js = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, Xs = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, At = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function Dc(t) {
  const e = Br(t), r = [], n = [
    { regex: new RegExp(`${js}\\s*${At}`, "g"), swapped: !1 },
    { regex: new RegExp(`${Xs}\\s*${At}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of n) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), u = Number(a[s ? 1 : 2]), c = (a[3] ?? "").trim(), d = a[4], h = a[5].trim().replace(/\s+/g, " ");
      r.some((f) => f.group === o && f.binding === u) || r.push(Ys(o, u, c, d, h));
    }
  }
  return r.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function Ys(t, e, r, n, i) {
  let s = "handle", a;
  if (r.startsWith("uniform"))
    s = "uniform";
  else if (r.startsWith("storage")) {
    s = "storage";
    const c = r.split(",").map((d) => d.trim())[1];
    c === "read" ? a = "read" : c === "read_write" ? a = "read_write" : c === "write" && (a = "write");
  }
  const o = Hs(s, i);
  return {
    group: t,
    binding: e,
    name: n,
    addressSpace: s,
    access: a,
    kind: o,
    type: i,
    depth: i.startsWith("texture_depth"),
    multisampled: i.startsWith("texture_multisampled")
  };
}
function Hs(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const Et = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, Ks = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function Qs(t) {
  const e = Br(t), r = [];
  let n;
  for (Et.lastIndex = 0; (n = Et.exec(e)) !== null; ) {
    const i = n[1], s = n[2] ?? "", a = n[3];
    let o = null;
    if (i === "compute") {
      const u = Ks.exec(s);
      o = u ? [Number(u[1]), Number(u[2] ?? 1), Number(u[3] ?? 1)] : [1, 1, 1];
    }
    r.push({ stage: i, name: a, workgroupSize: o });
  }
  return r;
}
function Ic(t, e, r) {
  return Qs(t).find((n) => n.stage === e && n.name === r);
}
function Vc(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const Zs = {
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
function Js(t) {
  return Zs[t] ?? `0x${t.toString(16)}`;
}
const ea = [
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
function Cr(t) {
  return ea.includes(t);
}
function ta(t, e) {
  const r = [], n = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
  for (let u = 0; u < n; u++) {
    const c = t.getActiveAttrib(e, u);
    c && r.push({
      name: c.name,
      location: t.getAttribLocation(e, c.name),
      glType: c.type,
      size: c.size
    });
  }
  const i = [], s = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
  for (let u = 0; u < s; u++) {
    const c = t.getActiveUniform(e, u);
    c && i.push({
      name: c.name,
      location: t.getUniformLocation(e, c.name),
      glType: c.type,
      size: c.size,
      isArray: /\[\d+\]$/.test(c.name)
    });
  }
  const a = [], o = t.getProgramParameter(e, t.ACTIVE_UNIFORM_BLOCKS);
  for (let u = 0; u < o; u++) {
    const c = t.getActiveUniformBlockName(e, u) ?? `block${u}`;
    a.push({
      name: c,
      index: u,
      dataSize: t.getActiveUniformBlockParameter(e, u, t.UNIFORM_BLOCK_DATA_SIZE),
      activeUniforms: t.getActiveUniformBlockParameter(e, u, t.UNIFORM_BLOCK_ACTIVE_UNIFORMS)
    });
  }
  return { attributes: r, uniforms: i, uniformBlocks: a };
}
function ra(t) {
  return t.uniforms.filter((e) => Cr(e.glType));
}
function na(t, e) {
  const r = [];
  t.uniformBlocks.slice().sort((i, s) => i.name.localeCompare(s.name)).forEach((i, s) => {
    r.push({
      binding: s,
      visibility: e,
      type: "uniform",
      name: i.name,
      buffer: { type: "uniform", minBindingSize: i.dataSize }
    });
  });
  const n = ra(t).sort((i, s) => i.name.localeCompare(s.name));
  return n.forEach((i, s) => {
    r.push({
      binding: t.uniformBlocks.length + s,
      visibility: e,
      type: "texture",
      name: i.name.replace(/\[\d+\]$/, ""),
      texture: { sampleType: "float", viewDimension: "2d" }
    }), r.push({
      binding: t.uniformBlocks.length + n.length + s,
      visibility: e,
      type: "sampler",
      name: `${i.name.replace(/\[\d+\]$/, "")}_sampler`,
      sampler: { type: "filtering" }
    });
  }), r;
}
class ia {
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
  async firstAvailable(e, r) {
    for (const n of e) {
      const i = this.factories.get(n);
      if (!i) continue;
      const s = await i.isAvailable(r);
      if (s.ok) return { factory: i, availability: s };
    }
    return null;
  }
  /** 逐个探测并记录每个后端的结果，用于生成「为什么回退了」的解释。 */
  async probeAll(e, r) {
    const n = [];
    for (const i of e) {
      const s = this.factories.get(i);
      if (!s) {
        n.push({ backend: i, ok: !1, reason: "该后端未注册。" });
        continue;
      }
      const a = await s.isAvailable(r);
      n.push({ backend: i, ok: a.ok, reason: a.reason });
    }
    return n;
  }
}
const J = Object.freeze({
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
function _(t, e, r) {
  const n = t.getParameter(e);
  return typeof n == "number" && n > 0 ? n : r;
}
function sa(t) {
  return {
    maxTextureSize: _(t, 3379, 2048),
    max3dTextureSize: _(t, 32883, 256),
    maxArrayTextureLayers: _(t, 35071, 256),
    maxSamples: _(t, 36183, 4),
    maxUniformBufferBindings: _(t, 35375, 12),
    maxUniformBlockSize: _(t, 35376, 16384),
    maxUniformBufferOffsetAlignment: _(t, 35380, 256),
    maxVertexAttribs: _(t, 34921, 16),
    maxVertexUniformVectors: _(t, 36347, 128),
    maxFragmentUniformVectors: _(t, 36349, 128),
    maxVaryingVectors: _(t, 36348, 8),
    maxTextureImageUnits: _(t, 34930, 16),
    maxCombinedTextureImageUnits: _(t, 35661, 32),
    maxCubeMapTextureSize: _(t, 34076, 2048),
    maxRenderbufferSize: _(t, 34024, 2048),
    maxElementIndex: _(t, 36351, 4294967295),
    maxElementsVertices: _(t, 33001, 2147483647),
    maxElementsIndices: _(t, 33e3, 2147483647)
  };
}
function aa(t) {
  const e = sa(t), r = Math.min(e.maxElementIndex, 2147483647);
  return {
    // WebGL2 没有 1D 纹理，用 2D 上限代替，上层代码读到的是一个安全的正数。
    maxTextureDimension1D: e.maxTextureSize,
    maxTextureDimension2D: e.maxTextureSize,
    maxTextureDimension3D: e.max3dTextureSize,
    maxTextureArrayLayers: e.maxArrayTextureLayers,
    maxBindGroups: J.maxBindGroups,
    maxBindGroupsPlusVertexBuffers: J.maxBindGroupsPlusVertexBuffers,
    maxBindingsPerBindGroup: J.maxBindingsPerBindGroup,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      J.maxDynamicUniformBuffersPerPipelineLayout,
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
    minStorageBufferOffsetAlignment: J.minStorageBufferOffsetAlignment,
    maxVertexBuffers: Math.min(J.maxVertexBuffers, e.maxVertexAttribs),
    maxBufferSize: r,
    maxVertexAttributes: e.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: e.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: J.maxColorAttachmentBytesPerSample,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}
function oa(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), e;
}
function la(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const r = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", n = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: r, device: n };
}
function ua(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function ca(t, e) {
  const r = t.getContext("webgl2", e);
  if (!r)
    throw new l(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return r;
}
class da {
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
  bindTexture(e, r, n) {
    this.activeTexture(e);
    const i = this.textures.get(e);
    i && i.target === r && i.texture === n || (this.gl.bindTexture(r, n), this.textures.set(e, { target: r, texture: n }));
  }
  /** 把 sampler 对象绑到指定单元（WebGL2 的 sampler 对象承载采样参数）。 */
  bindSampler(e, r) {
    this.samplers.get(e) !== r && (this.gl.bindSampler(e, r), this.samplers.set(e, r));
  }
  /** 绑定 uniform block：`size < 0` 用 `bindBufferBase`，否则用 `bindBufferRange`。 */
  bindUniformBuffer(e, r, n = 0, i = -1) {
    const s = this.uniformBuffers.get(e);
    s && s.buffer === r && s.offset === n && s.size === i || (i < 0 ? this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, e, r) : this.gl.bindBufferRange(this.gl.UNIFORM_BUFFER, e, r, n, i), this.uniformBuffers.set(e, { buffer: r, offset: n, size: i }));
  }
  /** 清掉某个 binding 点的 uniform buffer 记录（缓冲区被销毁时调用）。 */
  forgetUniformBuffer(e) {
    for (const [r, n] of this.uniformBuffers)
      n.buffer === e && this.uniformBuffers.delete(r);
  }
  /** 忘掉某个纹理的所有单元记录（纹理被销毁时调用）。 */
  forgetTexture(e) {
    for (const [r, n] of this.textures)
      n.texture === e && this.textures.delete(r);
  }
  /**
   * 设置混合状态。参数是 GL 枚举（由 `glEnumMap` 翻译得到）。
   * 用一条签名字符串做比较，避免为每个字段单独维护缓存。
   */
  setBlend(e, r, n, i, s, a, o) {
    const u = e ? `1:${r}:${n}:${i}:${s}:${a}:${o}` : "0";
    if (this.blendSignature === u) return;
    const c = this.gl;
    e ? (c.enable(c.BLEND), c.blendFuncSeparate(r, n, s, a), c.blendEquationSeparate(i, o)) : c.disable(c.BLEND), this.blendSignature = u;
  }
  setBlendConstant(e) {
    ze(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
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
  setDepthTest(e, r, n, i) {
    const s = this.gl;
    this.depthEnabled !== e && (e ? s.enable(s.DEPTH_TEST) : s.disable(s.DEPTH_TEST), this.depthEnabled = e), this.depthWrite !== r && (s.depthMask(r), this.depthWrite = r), this.depthFunc !== n && (s.depthFunc(n), this.depthFunc = n);
    const a = i ?? [0, 0, 0];
    ha(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
  }
  setStencilTest(e, r) {
    const n = this.gl;
    this.stencilEnabled !== e && (e ? n.enable(n.STENCIL_TEST) : n.disable(n.STENCIL_TEST), this.stencilEnabled = e), e && this.stencilReference !== r && (n.stencilFunc(n.ALWAYS, r, 255), this.stencilReference = r);
  }
  setCull(e, r, n) {
    const i = this.gl;
    this.cullEnabled !== e && (e ? i.enable(i.CULL_FACE) : i.disable(i.CULL_FACE), this.cullEnabled = e), e && this.cullFace !== r && (i.cullFace(r), this.cullFace = r), this.frontFace !== n && (i.frontFace(n), this.frontFace = n);
  }
  setViewport(e, r, n, i) {
    ze(this.viewport, [e, r, n, i]) || (this.gl.viewport(e, r, n, i), this.viewport = [e, r, n, i]);
  }
  setScissor(e, r, n, i, s) {
    const a = this.gl;
    this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !ze(this.scissor, [r, n, i, s]) && (a.scissor(r, n, i, s), this.scissor = [r, n, i, s]);
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
function ze(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function ha(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
const fa = [
  {
    flag: G.Storage,
    name: "Storage",
    reason: "shader storage buffer 需要 GLES 3.1，WebGL2 只有 GLES 3.0。请改用 uniform buffer 传数据。"
  },
  {
    flag: G.Indirect,
    name: "Indirect",
    reason: "WebGL2 没有 indirect draw。请改用一次性的 uniform 数据 + 普通 draw 调用。"
  },
  {
    flag: G.QueryResolve,
    name: "QueryResolve",
    reason: "WebGL2 的遮挡查询结果只能同步读回，没有查询结果缓冲区的概念。"
  }
];
class pa {
  label;
  size;
  usage;
  native;
  /** 进程内唯一标识，用于构建 VAO 缓存键（`label` 可能被使用者指定成重复值）。 */
  id;
  gl;
  state;
  onDestroy;
  /** 以 buffer 引用的形式登记 usage，便于调试时追踪（GL 本身不关心）。 */
  usages;
  mapping = null;
  _disposed = !1;
  constructor(e, r, n, i) {
    if (ge(n.size, "BufferDescriptor.size"), n.size % 4 !== 0)
      throw new l(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${n.size}。（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）`
      );
    for (const a of fa)
      if (n.usage & a.flag)
        throw new l(
          `[gpu-device-api] BufferUsage.${a.name} 在 WebGL2 后端不可用：${a.reason}`
        );
    this.gl = e, this.state = r, this.onDestroy = i, this.label = n.label ?? R("buffer"), this.id = R("buf"), this.size = n.size, this.usage = n.usage, this.usages = n.usage;
    const s = e.createBuffer();
    if (!s) throw new l("[gpu-device-api] gl.createBuffer() 返回 null，无法分配 buffer。");
    this.native = s, this.state.bindCopyWriteBuffer(s), e.bufferData(e.COPY_WRITE_BUFFER, n.size, e.DYNAMIC_DRAW);
  }
  get disposed() {
    return this._disposed;
  }
  /** 该 buffer 创建时声明的 usage（只读，便于调试）。 */
  get usageFlags() {
    return this.usages;
  }
  get mapped() {
    return this.mapping !== null;
  }
  async mapAsync(e, r = 0, n = this.size - r) {
    if (this.assertUsable("mapAsync"), this.mapping)
      throw new l(`[gpu-device-api] buffer「${this.label}」已经处于映射状态，请先 unmap()。`);
    if (Ve(r, "mapAsync 的 offset"), ge(n, "mapAsync 的 size"), r % 4 !== 0)
      throw new l(
        `[gpu-device-api] mapAsync 的 offset 必须是 4 的倍数，实际是 ${r}。（WebGPU 要求 8 的倍数，这里按更宽松的 4 处理。）`
      );
    if (r + n > this.size)
      throw new l(
        `[gpu-device-api] mapAsync 的范围 [${r}, ${r + n}) 超出了 buffer 大小 ${this.size}。`
      );
    if (e === "read") {
      const i = new ArrayBuffer(n);
      this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.native), this.state.bindCopyReadBuffer(this.native), this.gl.getBufferSubData(this.gl.COPY_READ_BUFFER, r, new Uint8Array(i)), this.mapping = { mode: e, offset: r, size: n, data: i, dirty: !1 };
    } else
      this.mapping = { mode: e, offset: r, size: n, data: new ArrayBuffer(n), dirty: !0 };
    return this.mapping.data;
  }
  getMappedRange(e = 0, r) {
    const n = this.mapping;
    if (!n)
      throw new l(
        `[gpu-device-api] buffer「${this.label}」尚未映射，请先 await mapAsync()。`
      );
    if (e === 0 && r === void 0) return n.data;
    const i = r ?? n.size - e;
    if (e < 0 || i <= 0 || e + i > n.size)
      throw new l(
        `[gpu-device-api] getMappedRange(${e}, ${i}) 超出已映射范围 ${n.size}。`
      );
    return n.data.slice(e, e + i);
  }
  unmap() {
    const e = this.mapping;
    e && (this.mapping = null, e.mode === "write" && e.dirty && (this.state.bindCopyWriteBuffer(this.native), this.gl.bufferSubData(this.gl.COPY_WRITE_BUFFER, e.offset, new Uint8Array(e.data))));
  }
  /** 直接上传一段数据（供 `Queue.writeBuffer` 使用，走同一个 binding point）。 */
  upload(e, r) {
    this.state.bindCopyWriteBuffer(this.native), this.gl.bufferSubData(this.gl.COPY_WRITE_BUFFER, e, r);
  }
  /** 读回一段数据（供 `Queue` 的同步读回路径使用）。 */
  download(e, r) {
    this.state.bindCopyReadBuffer(this.native), this.gl.getBufferSubData(this.gl.COPY_READ_BUFFER, e, r);
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.mapping = null, this.state.forgetUniformBuffer(this.native), this.gl.deleteBuffer(this.native), this.onDestroy(this));
  }
  dispose() {
    this.destroy();
  }
  assertUsable(e) {
    if (this._disposed)
      throw new l(
        `[gpu-device-api] buffer「${this.label}」已销毁，不能再调用 ${e}()。这种情况通常是资源在 device.dispose() 之后仍被使用。`
      );
  }
}
const $e = 6403, Ae = 33319, ma = 6407, se = 6408, ae = 36244, oe = 33320, le = 36249, qe = 6402, ga = 34041, ee = 5121, ue = 5120, Ee = 5123, je = 5122, de = 5125, Xe = 5124, Le = 5126, Ye = 5131, ba = 33640, wa = 34042, va = 33321, ya = 36756, xa = 33330, Ta = 33329, Sa = 33332, $a = 33331, Aa = 33325, Ea = 33323, La = 36757, _a = 33336, Ba = 33335, Ca = 33334, Pa = 33333, Fa = 33326, Ra = 33338, Ga = 33337, Ua = 33327, Ma = 32856, Oa = 35907, Da = 36759, Ia = 36220, Va = 36222, Na = 32857, ka = 35898, Wa = 33340, za = 33339, qa = 33328, ja = 36214, Xa = 36216, Ya = 34842, Ha = 36208, Ka = 36226, Qa = 34836, Za = 33189, Ja = 33190, eo = 35056, to = 36012;
function w(t, e, r, n, i = {}) {
  return {
    internalFormat: t,
    format: e,
    type: r,
    bytesPerPixel: n,
    attachment: i.attachment ?? !0,
    depth: i.depth ?? !1,
    stencil: i.stencil ?? !1,
    sampleType: i.sampleType ?? "float",
    uploadType: i.uploadType === void 0 ? "Uint8Array" : i.uploadType
  };
}
const ro = Object.freeze({
  r8unorm: w(va, $e, ee, 1, { uploadType: "Uint8Array" }),
  r8snorm: w(ya, $e, ue, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: w(xa, ae, ee, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: w(Ta, ae, ue, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: w(Sa, ae, Ee, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: w($a, ae, je, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: w(Aa, $e, Ye, 2, { uploadType: "Uint16Array" }),
  rg8unorm: w(Ea, Ae, ee, 2, { uploadType: "Uint8Array" }),
  rg8snorm: w(La, Ae, ue, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: w(_a, oe, ee, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: w(Ba, oe, ue, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: w(Ca, ae, de, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: w(Pa, ae, Xe, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: w(Fa, $e, Le, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: w(Ra, oe, Ee, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: w(Ga, oe, je, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: w(Ua, Ae, Ye, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: w(Ma, se, ee, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": w(Oa, se, ee, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: w(Da, se, ue, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: w(Ia, le, ee, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: w(Va, le, ue, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: w(Na, se, ba, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: w(ka, ma, de, 4, { attachment: !1, uploadType: null }),
  rg32uint: w(Wa, oe, de, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: w(za, oe, Xe, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: w(qa, Ae, Le, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: w(ja, le, Ee, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: w(Xa, le, je, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: w(Ya, se, Ye, 8, { uploadType: "Uint16Array" }),
  rgba32uint: w(Ha, le, de, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: w(Ka, le, Xe, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: w(Qa, se, Le, 16, { uploadType: "Float32Array" }),
  depth16unorm: w(Za, qe, Ee, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: w(Ja, qe, de, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": w(eo, ga, wa, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: w(to, qe, Le, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), no = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function U(t) {
  const e = no[t];
  if (e)
    throw new l(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const r = ro[t];
  if (!r)
    throw new l(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return r;
}
function io(t) {
  return U(t).attachment;
}
function so(t, e) {
  const r = U(t);
  if (r.uploadType === null)
    throw new l(
      `[gpu-device-api] 纹理格式「${t}」不支持从主机内存上传。`
    );
  const n = e.constructor.name;
  if (n !== r.uploadType) {
    const i = t === "rgba16float" || t === "r16float" || t === "rg16float" ? "（该格式是 half float，需要先把 Float32 转成 Uint16 位模式，可用 Float32Array 与 Uint16Array 共享同一段内存来做转换。）" : "";
    throw new l(
      `[gpu-device-api] 纹理格式「${t}」要求主机数据是 ${r.uploadType}，实际传入 ${n}。${i}`
    );
  }
}
class Pr {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, r) {
    const n = ht(e, r);
    if (n.baseMipLevel + n.mipLevelCount > e.mipLevelCount)
      throw new l(
        `[gpu-device-api] texture view 的 mip 范围 [${n.baseMipLevel}, ${n.baseMipLevel + n.mipLevelCount}) 超出了纹理「${e.label}」的 ${e.mipLevelCount} 层。`
      );
    if (n.baseArrayLayer + n.arrayLayerCount > e.depthOrArrayLayers)
      throw new l(
        `[gpu-device-api] texture view 的层范围 [${n.baseArrayLayer}, ${n.baseArrayLayer + n.arrayLayerCount}) 超出了纹理「${e.label}」的 ${e.depthOrArrayLayers} 层。`
      );
    this.texture = e, this.descriptor = n, this.label = r.label ?? R("textureView");
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
function ao(t, e) {
  if (t === "1d")
    throw new l(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class Lt {
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
  constructor(e, r, n, i) {
    this.gl = e, this.state = r, this.onDestroy = i;
    const s = dt(n.size);
    if (ge(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new l(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = U(n.format), o = n.dimension ?? Ge.D2, u = n.sampleCount ?? 1, c = n.mipLevelCount ?? 1;
    if (u > 1) {
      if (o !== Ge.D2 || s.depthOrArrayLayers > 1)
        throw new l(
          "[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: '2d'` 且 `depthOrArrayLayers: 1`）。"
        );
      if (c > 1)
        throw new l("[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。");
    }
    if (c > 1) {
      const h = Math.floor(Math.log2(Math.max(s.width, s.height))) + 1;
      if (c > h)
        throw new l(
          `[gpu-device-api] mipLevelCount=${c} 超过了 ${s.width}x${s.height} 能容纳的最大层数 ${h}。`
        );
    }
    this.label = n.label ?? R("texture"), this.dimension = o, this.format = n.format, this.usage = n.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = c, this.sampleCount = u, this.glTarget = ao(o, s.depthOrArrayLayers);
    const d = e.createTexture();
    if (!d) throw new l("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = d, e.bindTexture(this.glTarget, d), u > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      u,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === Ge.D3 ? e.texStorage3D(
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
      throw new l(`[gpu-device-api] 纹理「${this.label}」已销毁，不能再创建 view。`);
    const r = new Pr(this, e);
    return this.views.push(r), r;
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
    const e = this.gl, r = this.glTarget;
    e.texParameteri(r, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(r, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(r, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(r, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(r, e.TEXTURE_WRAP_R, e.CLAMP_TO_EDGE), e.texParameteri(r, e.TEXTURE_BASE_LEVEL, 0), e.texParameteri(r, e.TEXTURE_MAX_LEVEL, this.mipLevelCount - 1);
  }
}
const oo = {
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
}, Fr = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, lo = {
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
}, _e = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, _t = {
  front: 1028,
  back: 1029
}, uo = {
  ccw: 2305,
  cw: 2304
}, He = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, Bt = {
  nearest: 9728,
  linear: 9729
}, co = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, Ct = 5121, Pt = 5120, Ft = 5123, Rt = 5122, ho = 5125, fo = 5124, po = 5126, mo = 5131, go = {
  float32: { type: po, normalized: !1, integer: !1 },
  float16: { type: mo, normalized: !1, integer: !1 },
  unorm8: { type: Ct, normalized: !0, integer: !1 },
  snorm8: { type: Pt, normalized: !0, integer: !1 },
  uint8: { type: Ct, normalized: !1, integer: !0 },
  sint8: { type: Pt, normalized: !1, integer: !0 },
  unorm16: { type: Ft, normalized: !0, integer: !1 },
  snorm16: { type: Rt, normalized: !0, integer: !1 },
  uint16: { type: Ft, normalized: !1, integer: !0 },
  sint16: { type: Rt, normalized: !1, integer: !0 },
  uint32: { type: ho, normalized: !1, integer: !0 },
  sint32: { type: fo, normalized: !1, integer: !0 }
}, bo = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function wo(t) {
  const e = bo.exec(t);
  if (!e)
    throw new l(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const r = go[e[1]];
  if (!r)
    throw new l(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: Ie(t).components,
    type: r.type,
    normalized: r.normalized,
    integer: r.integer
  };
}
function Ue(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return yo(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const r = t;
    return [r[0] ?? 0, r[1] ?? 0, r[2] ?? 0, r[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const vo = {
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
function yo(t) {
  const e = t.trim().toLowerCase(), r = vo[e];
  if (r) return r;
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
  const n = /^rgba?\(([^)]+)\)$/.exec(e);
  if (n) {
    const i = n[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return [(i[0] ?? 0) / 255, (i[1] ?? 0) / 255, (i[2] ?? 0) / 255, i[3] ?? 1];
  }
  throw new l(
    `[gpu-device-api] 无法解析颜色「${t}」。支持 CSS 十六进制、rgb()/rgba()、少量颜色名、0xRRGGBB、[r,g,b,a] 与 { r, g, b, a }。`
  );
}
class xo {
  label;
  descriptor;
  native;
  gl;
  state;
  _disposed = !1;
  constructor(e, r, n = {}) {
    this.gl = e, this.state = r, this.descriptor = ir(n), this.label = n.label ?? R("sampler");
    const i = e.createSampler();
    if (!i) throw new l("[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。");
    this.native = i;
    const s = this.descriptor;
    if (e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, Bt[s.minFilter]), e.samplerParameteri(i, e.TEXTURE_MAG_FILTER, Bt[s.magFilter]), s.minFilter === "linear" && s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR) : s.minFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_NEAREST) : s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_LINEAR) : e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST), e.samplerParameteri(i, e.TEXTURE_WRAP_S, He[s.addressModeU]), e.samplerParameteri(i, e.TEXTURE_WRAP_T, He[s.addressModeV]), e.samplerParameteri(i, e.TEXTURE_WRAP_R, He[s.addressModeW]), e.samplerParameterf(i, e.TEXTURE_MIN_LOD, s.lodMinClamp), e.samplerParameterf(i, e.TEXTURE_MAX_LOD, s.lodMaxClamp), s.compare !== void 0 ? (e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(i, e.TEXTURE_COMPARE_FUNC, Fr[s.compare])) : e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.NONE), s.maxAnisotropy > 1) {
      const a = e.getExtension("EXT_texture_filter_anisotropic");
      if (a) {
        const o = ua(e);
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
class To {
  label;
  source;
  defines;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? R("shaderModule"), this.source = sr(e.code), this.defines = e.defines ? { ...e.defines } : {};
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
class Gt {
  label;
  entries;
  sortedEntries;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? R("bindGroupLayout"), this.sortedEntries = ar(e.entries), this.entries = this.sortedEntries;
  }
  /** GL 没有布局对象，这里把条目列表本身作为「原生句柄」暴露出来。 */
  get native() {
    return this.sortedEntries;
  }
  get disposed() {
    return this._disposed;
  }
  entry(e) {
    return this.sortedEntries.find((r) => r.binding === e);
  }
  dispose() {
    this._disposed = !0;
  }
}
class So {
  label;
  layout;
  entries;
  byBinding;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? R("bindGroup"), this.layout = e.layout, this.entries = [...e.entries], this.byBinding = new Map(this.entries.map((r) => [r.binding, r])), this.validate();
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
    for (const r of this.entries) {
      if (e.has(r.binding))
        throw new l(
          `[gpu-device-api] BindGroup「${this.label}」里 binding ${r.binding} 出现了多次。`
        );
      e.add(r.binding);
      const n = this.layout.entry(r.binding);
      if (!n)
        throw new l(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${r.binding} 在布局「${this.layout.label}」里没有声明。布局声明的 binding：${this.layout.sortedEntries.map((o) => o.binding).join("、")}。`
        );
      const i = r.resource, s = "buffer" in i ? "buffer" : "sampler" in i ? "sampler" : "view" in i ? "texture" : "unknown", a = n.type === "uniform" || n.type === "storage" || n.type === "read-only-storage" ? "buffer" : n.type === "texture" || n.type === "storage-texture" ? "texture" : "sampler";
      if (s !== a)
        throw new l(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${r.binding} 类型不匹配：布局要求 ${a}，实际给了 ${s}。`
        );
    }
  }
}
class Ut {
  label;
  bindGroupLayouts;
  isAuto;
  plan;
  constructor(e, r, n) {
    if (this.label = e.label ?? R("pipelineLayout"), this.bindGroupLayouts = [...e.bindGroupLayouts], this.isAuto = r, this.bindGroupLayouts.length > 4)
      throw new l(
        `[gpu-device-api] pipeline layout 声明了 ${this.bindGroupLayouts.length} 个 bind group，WebGL2 后端最多支持 4 个（与 WebGPU 默认的 maxBindGroups 一致）。`
      );
    this.plan = n && this.bindGroupLayouts.length > 0 ? n.planCache.get(this.bindGroupLayouts.map((i) => i.sortedEntries)) : null;
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
function Mt(t, e) {
  return `${t}:${e}`;
}
function $o(t, e) {
  const r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((u, c) => {
    const d = [...u].sort((f, p) => f.binding - p.binding), h = d.filter((f) => f.type === M.Sampler || f.type === M.ComparisonSampler);
    for (const f of d)
      switch (i.push(`${c}:${f.binding}:${f.type}:${f.name ?? ""}:${f.buffer?.hasDynamicOffset ? "dyn" : ""}`), f.type) {
        case M.Uniform: {
          if (!f.name)
            throw new l(
              `[gpu-device-api] group ${c} 的 binding ${f.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new l(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          r.set(Mt(c, f.binding), {
            group: c,
            binding: f.binding,
            name: f.name,
            blockBinding: s++,
            dynamic: f.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: f.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case M.Texture: {
          if (!f.name)
            throw new l(
              `[gpu-device-api] group ${c} 的 binding ${f.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new l(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const p = Ao(f, h);
          n.set(Mt(c, f.binding), {
            group: c,
            binding: f.binding,
            name: f.name,
            unit: a++,
            samplerBinding: p ? p.binding : null,
            samplerName: p ? p.name ?? null : null
          });
          break;
        }
        case M.Sampler:
        case M.ComparisonSampler:
          break;
        case M.Storage:
        case M.ReadOnlyStorage:
          throw new l(
            `[gpu-device-api] group ${c} 的 binding ${f.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case M.StorageTexture:
          throw new l(
            `[gpu-device-api] group ${c} 的 binding ${f.binding} 是 storage texture，WebGL2 不支持。请改用「渲染到纹理 + 采样」的方式。`
          );
        default: {
          const p = f.type;
          throw new l(`[gpu-device-api] 未知的 binding 类型：${String(p)}`);
        }
      }
  });
  const o = new Set(
    [...n.values()].map((u) => u.samplerBinding).filter((u) => u !== null)
  );
  for (const [u, c] of t.entries())
    for (const d of c)
      if ((d.type === M.Sampler || d.type === M.ComparisonSampler) && !o.has(d.binding))
        throw new l(
          `[gpu-device-api] group ${u} 的 sampler binding ${d.binding}` + (d.name ? `（「${d.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  return {
    uniformBlocks: r,
    textures: n,
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function Ao(t, e) {
  const r = t.name ?? "", n = e.find((i) => i.name === `${r}_sampler`);
  return n || e.find((i) => i.binding === t.binding + 1);
}
class Eo {
  plans = /* @__PURE__ */ new Map();
  limits;
  constructor(e) {
    this.limits = e;
  }
  /** 按布局内容取计划，未命中则构建。 */
  get(e) {
    const r = e.map(
      (s, a) => [...s].sort((o, u) => o.binding - u.binding).map((o) => `${a}:${o.binding}:${o.type}:${o.name ?? ""}:${o.buffer?.hasDynamicOffset ? "dyn" : ""}`).join(",")
    ).join(";"), n = this.plans.get(r);
    if (n) return n;
    const i = $o(e, this.limits);
    return this.plans.set(r, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
class Lo {
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
  acquire(e, r, n) {
    const i = `${r}\0${n}`, s = this.programs.get(i);
    if (s) return s;
    const a = this.gl, o = this.compileShader(a.VERTEX_SHADER, r, `${e} / vertex`), u = this.compileShader(a.FRAGMENT_SHADER, n, `${e} / fragment`), c = a.createProgram();
    if (!c)
      throw a.deleteShader(o), a.deleteShader(u), new l("[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。");
    if (a.attachShader(c, o), a.attachShader(c, u), a.linkProgram(c), a.detachShader(c, o), a.detachShader(c, u), a.deleteShader(o), a.deleteShader(u), !a.getProgramParameter(c, a.LINK_STATUS)) {
      const p = a.getProgramInfoLog(c) ?? "(无日志)";
      throw a.deleteProgram(c), new l(
        `[gpu-device-api] program「${e}」链接失败。vertex 与 fragment 的 varying（in/out）名字、
类型与数量必须完全对应。
GL 日志：${p}`
      );
    }
    const h = ta(a, c), f = {
      program: c,
      reflection: h,
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
  bindPlan(e, r) {
    if (e.boundPlanKey !== null) return;
    const { blockBindings: n, samplerLocations: i, optimizedOutBlocks: s } = this.bindResources(
      e.program,
      e.reflection,
      r,
      e.label
    );
    e.blockBindings = n, e.samplerLocations = i, e.optimizedOutBlocks = s, e.boundPlanKey = r ? r.key : "";
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
  compileShader(e, r, n) {
    const i = this.gl, s = i.createShader(e);
    if (!s)
      throw new l(`[gpu-device-api] gl.createShader() 返回 null（${n}）。`);
    if (i.shaderSource(s, r), i.compileShader(s), !i.getShaderParameter(s, i.COMPILE_STATUS)) {
      const a = i.getShaderInfoLog(s) ?? "(无日志)";
      throw i.deleteShader(s), new l(`[gpu-device-api] 着色器编译失败（${n}）：
${a}

----- 源码 -----
${_o(r)}`);
    }
    return s;
  }
  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  bindResources(e, r, n, i) {
    const s = this.gl, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), u = [], c = new Set(r.uniformBlocks.map((h) => h.name));
    if (n)
      for (const [h, f] of n.uniformBlocks) {
        if (!c.has(f.name)) {
          u.push(f.name);
          continue;
        }
        const p = s.getUniformBlockIndex(e, f.name);
        if (p === s.INVALID_INDEX) {
          u.push(f.name);
          continue;
        }
        s.uniformBlockBinding(e, p, f.blockBinding), a.set(h, f.blockBinding);
      }
    const d = r.uniforms.filter((h) => Cr(h.glType));
    if (n)
      for (const [, h] of n.textures) {
        const f = d.find((p) => p.name === h.name)?.location ?? s.getUniformLocation(e, h.name);
        f && (s.uniform1i(f, h.unit), o.set(h.name, f));
      }
    if (n) {
      const h = new Set([...n.uniformBlocks.values()].map((g) => g.name)), f = r.uniformBlocks.map((g) => g.name).filter((g) => !h.has(g));
      if (f.length > 0)
        throw new l(
          `[gpu-device-api] program「${i}」使用了未声明的 uniform block：${f.join("、")}。
布局里声明的块名：${[...h].join("、") || "(空)"}。
WebGL2 后端靠 \`BindGroupLayoutEntry.name\` 去定位 GLSL 的 uniform block，请检查两边的名字是否一致（注意 GLSL 里块名与实例名是两回事，这里要的是**块名**）。`
        );
      const p = new Set([...n.textures.values()].map((g) => g.name)), m = d.map((g) => g.name.replace(/\[0\]$/, "")).filter((g) => !p.has(g));
      if (m.length > 0)
        throw new l(
          `[gpu-device-api] program「${i}」使用了未声明的 sampler：${m.join("、")}。
布局里声明的纹理名：${[...p].join("、") || "(空)"}。
请为每个 sampler 增加一个 \`type: 'texture'\` 的布局条目并填上 \`name\`。`
        );
    } else {
      if (r.uniformBlocks.length > 0)
        throw new l(
          `[gpu-device-api] program「${i}」使用了 uniform block（${r.uniformBlocks.map((h) => h.name).join("、")}），但管线没有声明任何 bind group layout。`
        );
      if (d.length > 0)
        throw new l(
          `[gpu-device-api] program「${i}」使用了 sampler（${d.map((h) => `${h.name}: ${Js(h.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: u };
  }
}
function _o(t) {
  const e = t.split(`
`), r = String(e.length).length;
  return e.map((n, i) => `${String(i + 1).padStart(r, " ")} | ${n}`).join(`
`);
}
function Bo(t, e) {
  const r = t.depthStencil, n = r !== void 0 && r.format !== null, i = n && e.depth, s = t.render?.blend, a = t.fragment?.targets, u = a?.find((f) => f?.blend)?.blend ?? s;
  let c = null;
  u && (c = {
    colorSrc: Be(u.color.srcFactor, "color.srcFactor"),
    colorDst: Be(u.color.dstFactor, "color.dstFactor"),
    colorOp: u.color.operation ? _e[u.color.operation] : _e.add,
    alphaSrc: Be(u.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: Be(u.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: u.alpha.operation ? _e[u.alpha.operation] : _e.add
  });
  const d = a?.[0]?.writeMask ?? t.render?.writeMask ?? H.All, h = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    depthWrite: r?.depthWriteEnabled ?? !0,
    depthCompare: Fr[r?.depthCompare ?? "less"],
    depthBias: [r?.depthBiasSlopeScale ?? 0, r?.depthBias ?? 0, r?.depthBiasClamp ?? 0],
    stencilEnabled: n && e.stencil,
    blend: c,
    writeMask: [
      (d & H.Red) !== 0,
      (d & H.Green) !== 0,
      (d & H.Blue) !== 0,
      (d & H.Alpha) !== 0
    ],
    cullEnabled: h !== "none",
    cullFace: h === "none" ? _t.back : _t[h],
    frontFace: uo[t.primitive?.frontFace ?? "ccw"]
  };
}
function Co(t, e, r = 0) {
  e.blend ? t.setBlend(
    !0,
    e.blend.colorSrc,
    e.blend.colorDst,
    e.blend.colorOp,
    e.blend.alphaSrc,
    e.blend.alphaDst,
    e.blend.alphaOp
  ) : t.setBlend(!1, 0, 0, 0, 0, 0, 0), t.setColorMask(e.writeMask), t.setDepthTest(e.depthTest, e.depthWrite, e.depthCompare, e.depthBias), t.setStencilTest(e.stencilEnabled, r), t.setCull(e.cullEnabled, e.cullFace, e.frontFace);
}
function Be(t, e) {
  const r = lo[t];
  if (r === void 0)
    throw new l(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return r;
}
class Po {
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
  constructor(e, r, n, i) {
    if (!e.fragment)
      throw new l(
        "[gpu-device-api] WebGL2 后端不支持只有深度、没有片元着色器的管线（GL 的 program 必须同时链接两个阶段）。\n请提供一个写深度或写颜色的片元着色器；若只想写深度，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    this.label = e.label ?? R("renderPipeline"), this.descriptor = e, this.layout = n, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.program = r, this.plan = n === "auto" ? null : n.bindingPlan ?? null, this.topologyMode = oo[e.primitive?.topology ?? "triangle-list"];
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
    const r = e.depthFormat ?? null, n = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${r ?? "none"}|${n}|${lr(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const d of i) or(d, this.limits);
    const o = new Set(i.flatMap((d) => d.attributes.map((h) => h.shaderLocation))), u = new Set(this.program.reflection.attributes.map((d) => d.location));
    for (const d of u)
      if (!o.has(d))
        throw new l(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${d}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const c = {
      key: s,
      renderState: Bo(this.descriptor, {
        depth: r !== null,
        stencil: r === "depth24plus-stencil8"
      }),
      depthFormat: r,
      sampleCount: n,
      vertexArrays: /* @__PURE__ */ new Map()
    };
    return this.variantCache.set(s, c), c;
  }
  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(e = {}) {
    return this.resolveVariant(e).renderState;
  }
  /** 把该管线的固定功能状态写入 GL 状态缓存。 */
  applyState(e, r = 0) {
    this.state.useProgram(this.program.program), Co(this.state, e.renderState, r);
  }
  /**
   * 取得（必要时创建）一个顶点数组对象。
   *
   * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
   * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
   */
  acquireVertexArray(e, r, n) {
    const i = this.vertexLayouts;
    if (!i || i.length === 0) return null;
    const s = Fo(i, r, n), a = e.vertexArrays.get(s);
    if (a) return a;
    const o = this.gl, u = o.createVertexArray();
    if (!u)
      throw new l("[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。");
    o.bindVertexArray(u);
    for (let c = 0; c < i.length; c++) {
      const d = i[c], h = r[c];
      if (!d || !h) continue;
      o.bindBuffer(o.ARRAY_BUFFER, h.buffer.native);
      const f = d.stepMode === "instance" ? 1 : 0;
      for (const p of d.attributes) {
        const m = wo(p.format), g = h.offset + p.offset;
        o.enableVertexAttribArray(p.shaderLocation), m.integer ? o.vertexAttribIPointer(p.shaderLocation, m.size, m.type, d.arrayStride, g) : o.vertexAttribPointer(
          p.shaderLocation,
          m.size,
          m.type,
          m.normalized,
          d.arrayStride,
          g
        ), o.vertexAttribDivisor(p.shaderLocation, f);
      }
    }
    return n && o.bindBuffer(o.ELEMENT_ARRAY_BUFFER, n), this.state.invalidateBufferBindings(), e.vertexArrays.set(s, u), u;
  }
  /** 当前缓存了多少个 VAO（跨全部形态）。 */
  get vertexArrayCount() {
    let e = 0;
    for (const r of this.variantCache.values()) e += r.vertexArrays.size;
    return e;
  }
  dispose() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.variantCache.values()) {
        for (const r of e.vertexArrays.values())
          this.gl.deleteVertexArray(r);
        e.vertexArrays.clear();
      }
      this.variantCache.clear();
    }
  }
}
function Fo(t, e, r) {
  const n = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      n.push(`${i}:-`);
      continue;
    }
    Ve(s.offset, "setVertexBuffer 的 offset"), n.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return n.push(`idx:${r ? Go(r) : "-"}`), n.join("|");
}
const Ot = /* @__PURE__ */ new WeakMap();
let Ro = 1;
function Go(t) {
  let e = Ot.get(t);
  return e === void 0 && (e = Ro++, Ot.set(t, e)), e;
}
class Uo {
  label;
  descriptor;
  layout = "auto";
  constructor(e) {
    throw this.label = e.label ?? "computePipeline", this.descriptor = e, new l(
      `[gpu-device-api] WebGL2 后端不支持 compute pipeline（管线「${this.label}」）。
计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算。`
    );
  }
  get native() {
    throw new l("[gpu-device-api] WebGL2 没有 compute pipeline。");
  }
  get disposed() {
    return !0;
  }
  resolve() {
    throw new l("[gpu-device-api] WebGL2 没有 compute pipeline。");
  }
  dispose() {
  }
}
function Mo(t, e, r) {
  throw new l(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${r}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function Dt(t) {
  return t instanceof Pr ? t : Mo("texture view", t, "WebGL2TextureView");
}
class Oo {
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
  constructor(e, r) {
    if ((e.sampleCount ?? 1) > 1)
      throw new l(
        `[gpu-device-api] WebGL2 后端不支持多重采样的离屏渲染目标（GL 的多重采样只能渲染到 renderbuffer，无法 resolve 成纹理）。
请把 sampleCount 设为 1，并改用默认帧缓冲的 antialias，或加一层 FXAA / 超采样后处理。`
      );
    const n = e.width ?? r.gl.drawingBufferWidth, i = e.height ?? r.gl.drawingBufferHeight;
    if (n <= 0 || i <= 0)
      throw new l(
        `[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${n}x${i}。未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。`
      );
    this.gl = r.gl, this.state = r.state, this.options = r, this.label = e.label ?? R("renderTarget"), this._width = n, this._height = i, this.mipLevelCount = e.mipLevelCount ?? 1;
    const s = Do(e.color);
    if (s.length > 4)
      throw new l(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${s.length} 个。`
      );
    for (const u of s)
      if (!U(u).attachment)
        throw new l(
          `[gpu-device-api] 纹理格式「${u}」在 WebGL2 下不能作为颜色附件。`
        );
    this.colorFormats = s;
    const a = Io(e.depth);
    if (a !== null && !U(a).depth)
      throw new l(`[gpu-device-api] 深度附件格式「${a}」不是深度格式。`);
    this.depthFormat = a;
    const o = r.gl.createFramebuffer();
    if (!o)
      throw new l("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。");
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
    const r = this.colorViews.map((i) => ({
      view: i,
      loadOp: e.loadOp ?? "clear",
      storeOp: e.storeOp ?? "store",
      clearValue: e.clearValue
    })), n = this.depthView ? {
      view: this.depthView,
      depthLoadOp: e.depthLoadOp ?? "clear",
      depthStoreOp: "store",
      depthClearValue: e.depthClearValue ?? 1
    } : null;
    return { colorAttachments: r, depthStencilAttachment: n };
  }
  /**
   * 绑定 framebuffer 并按需清屏。渲染通道开始绘制前调用。
   *
   * 清屏时临时关闭 `SCISSOR_TEST`：GL 的 `clearBuffer*` 会受裁剪框影响，
   * 而这里的语义应该是「清整个附件」。
   */
  bind(e = {}) {
    const r = this.gl;
    r.bindFramebuffer(r.FRAMEBUFFER, this.framebuffer);
    const n = r.checkFramebufferStatus(r.FRAMEBUFFER);
    if (n !== r.FRAMEBUFFER_COMPLETE)
      throw new l(
        `[gpu-device-api] 渲染目标「${this.label}」的 framebuffer 不完整（格式组合在 WebGL2 下不受支持）。颜色附件：${this.colorFormats.join("、")}；深度附件：${this.depthFormat ?? "无"}。GL 状态码：0x${n.toString(16)}。`
      );
    if (e.loadOp !== "load" || this.depthTexture !== null && e.depthLoadOp !== "load") {
      if (this.state.setScissor(!1, 0, 0, this._width, this._height), e.loadOp !== "load") {
        const [s, a, o, u] = Ue(e.clearColor), c = new Float32Array([s, a, o, u]);
        for (let d = 0; d < this.colorTextures.length; d++)
          r.clearBufferfv(r.COLOR, d, c);
      }
      if (this.depthTexture && e.depthLoadOp !== "load") {
        const s = U(this.depthFormat);
        r.depthMask(!0), s.stencil ? r.clearBufferfi(r.DEPTH_STENCIL, 0, e.clearDepth ?? 1, e.clearStencil ?? 0) : r.clearBufferfv(r.DEPTH, 0, new Float32Array([e.clearDepth ?? 1])), this.state.invalidate();
      }
    }
    r.viewport(0, 0, this._width, this._height), this.state.setViewport(0, 0, this._width, this._height);
  }
  resize(e, r) {
    if (e === this._width && r === this._height) return !1;
    if (e <= 0 || r <= 0)
      throw new l(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${e}x${r}。`);
    this._width = e, this._height = r;
    for (const n of this.colorTextures) n.destroy();
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
    const r = this.colorViews[e];
    if (!r)
      throw new l(
        `[gpu-device-api] 渲染目标「${this.label}」没有第 ${e} 个颜色附件（共 ${this.colorViews.length} 个）。`
      );
    return r;
  }
  /** 深度附件的 view；没有深度附件时抛错。 */
  depthStencilView() {
    if (!this.depthView)
      throw new l(`[gpu-device-api] 渲染目标「${this.label}」没有深度附件。`);
    return this.depthView;
  }
  createAttachments(e) {
    const r = v.RenderAttachment | v.TextureBinding | v.CopySrc | e;
    this.colorTextures = this.colorFormats.map(
      (n, i) => this.options.createTexture(n, this._width, this._height, r, `${this.label}:color${i}`)
    ), this.depthTexture = this.depthFormat === null ? null : this.options.createTexture(
      this.depthFormat,
      this._width,
      this._height,
      v.RenderAttachment | v.TextureBinding,
      `${this.label}:depth`
    ), this.colorViews = this.colorTextures.map((n) => Dt(n.createView())), this.depthView = this.depthTexture ? Dt(this.depthTexture.createView()) : null;
  }
  attach() {
    const e = this.gl, r = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.framebuffer), this.colorTextures.forEach((n, i) => {
      const s = e.COLOR_ATTACHMENT0 + i;
      n.dimension === "3d" || n.depthOrArrayLayers > 1 ? e.framebufferTextureLayer(e.FRAMEBUFFER, s, n.native, 0, 0) : e.framebufferTexture2D(e.FRAMEBUFFER, s, e.TEXTURE_2D, n.native, 0);
    }), e.drawBuffers(this.colorTextures.map((n, i) => e.COLOR_ATTACHMENT0 + i)), this.depthTexture) {
      const i = U(this.depthFormat).stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
      e.framebufferTexture2D(e.FRAMEBUFFER, i, e.TEXTURE_2D, this.depthTexture.native, 0);
    } else
      e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, null, 0), e.framebufferTexture2D(e.FRAMEBUFFER, e.STENCIL_ATTACHMENT, e.TEXTURE_2D, null, 0);
    e.bindFramebuffer(e.FRAMEBUFFER, r), this.state.invalidate();
  }
}
function Do(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new l("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function Io(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
function It(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class Vo {
  label = "canvas:defaultFramebuffer";
  dimension = Ge.D2;
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
  constructor(e, r, n, i, s) {
    this.width = e, this.height = r, this.format = n, this.sampleCount = i, this.usage = s;
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
      const r = {
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
      this.cachedView = r;
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
class No {
  canvas;
  gl;
  _device = null;
  _format;
  _pixelRatio;
  _width;
  _height;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this._format = e.format ?? "rgba8unorm";
    const r = dr(), n = pe(e.canvas);
    this._pixelRatio = r, this._width = Math.max(1, Math.floor(n.width * r)), this._height = Math.max(1, Math.floor(n.height * r)), this.applyBackingSize();
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
      throw new l(
        "[gpu-device-api] WebGL2 的背景缓冲采样数由创建 context 时的 `antialias` 选项决定，不能在 configure() 里改。请在 createDevice({ contextAttributes: { antialias: true } }) 里设置。"
      );
    if (e.format !== void 0 && !io(e.format))
      throw new l(
        `[gpu-device-api] canvas 格式「${e.format}」不能作为颜色附件。`
      );
    const r = e.device;
    if (r.native !== this.gl)
      throw new l(
        `[gpu-device-api] 这个 canvas 的 WebGL2 context 不是该 device 持有的那一个。
WebGL2 的 context 是从 canvas 上取的，一个 device 只能服务创建它的那个 canvas；请用 createDevice({ canvas }) 传入同一个 canvas，或为另一个 canvas 单独创建 device。`
      );
    this._device = r, e.format && (this._format = e.format);
  }
  unconfigure() {
    this._device = null;
  }
  setSize(e, r, n = !0) {
    const i = Math.max(1, Math.round(e)), s = Math.max(1, Math.round(r)), a = this.canvas;
    n && typeof a.style < "u" && (a.style.width = `${i}px`, a.style.height = `${s}px`), this._width = Math.max(1, Math.floor(i * this._pixelRatio)), this._height = Math.max(1, Math.floor(s * this._pixelRatio)), this.applyBackingSize();
  }
  setPixelRatio(e) {
    if (!Number.isFinite(e) || e <= 0)
      throw new RangeError(`[gpu-device-api] setPixelRatio() 需要正数，实际是 ${e}。`);
    if (e === this._pixelRatio) return;
    this._pixelRatio = e;
    const r = pe(this.canvas);
    this._width = Math.max(1, Math.floor(r.width * e)), this._height = Math.max(1, Math.floor(r.height * e)), this.applyBackingSize();
  }
  resize() {
    const e = pe(this.canvas), r = Math.max(1, Math.floor(e.width * this._pixelRatio)), n = Math.max(1, Math.floor(e.height * this._pixelRatio));
    return r === this._width && n === this._height ? !1 : (this._width = r, this._height = n, this.applyBackingSize(), !0);
  }
  getCurrentFrameTarget() {
    if (!this._device)
      throw new l(
        "[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。"
      );
    const e = Number(this.gl.getParameter(this.gl.SAMPLES) ?? 1) || 1, r = new Vo(
      this._width,
      this._height,
      this._format,
      e,
      v.RenderAttachment
    );
    return {
      texture: r,
      view: r.createView(),
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
class ko {
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
  constructor(e, r) {
    this.label = e.label ?? "renderPass", this.gl = r.gl, this.state = r.state, this.options = r;
    const n = e.target;
    if (n) {
      if (e.colorAttachments && e.colorAttachments.length > 0)
        throw new l(
          `[gpu-device-api] 渲染通道「${this.label}」同时给了 target 与 colorAttachments。请只保留一种写法：用 target 表示「画进这个渲染目标」，或用 colorAttachments 明确指定附件。`
        );
      this.colorFormats = n.colorFormats, this.depthFormat = n.depthFormat, n.bind({
        clearColor: e.clearValue,
        clearDepth: e.depthClearValue,
        clearStencil: e.depthClearValue === void 0 ? void 0 : 0,
        loadOp: e.colorAttachments?.[0]?.loadOp,
        depthLoadOp: e.depthStencilAttachment?.depthLoadOp
      }), this.state.invalidate(), this.state.setViewport(0, 0, n.width, n.height);
    } else {
      const i = e.colorAttachments.filter((a) => a !== null);
      if (i.length === 0 && !e.depthStencilAttachment)
        throw new l(
          `[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`
        );
      if (this.colorFormats = i.map((a) => a.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null, i.some((a) => It(a.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && It(e.depthStencilAttachment.view))
        this.beginDefaultFramebufferPass(e);
      else {
        const a = r.framebuffers.acquire(e);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, a), this.state.invalidate();
        const o = i[0], u = o.view.texture.width, c = o.view.texture.height;
        this.clearRawAttachments(e, a), this.gl.viewport(0, 0, u, c), this.state.setViewport(0, 0, u, c);
      }
    }
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.pipeline = e, e.applyState(e.resolveVariant(this.variantRequest()), this.stencilReference);
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), e < 0 || e >= 4)
      throw new l(
        `[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${e}。`
      );
    const i = this.pipeline;
    if (i && i.layout !== "auto" && r) {
      const s = i.layout.bindGroupLayouts[e];
      if (s && s !== r.layout && !(s.sortedEntries.length === r.layout.sortedEntries.length && s.sortedEntries.every((o, u) => {
        const c = r.layout.sortedEntries[u];
        return o.binding === c.binding && o.type === c.type && o.name === c.name;
      })))
        throw new l(
          `[gpu-device-api] setBindGroup(${e}, ...) 传入的 bind group 与管线「${i.label}」在该 group 上声明的布局不一致（传入「${r.layout.label}」，期望「${s.label}」）。`
        );
    }
    this.bindGroups.set(e, r), n ? this.dynamicOffsets.set(e, [...n]) : this.dynamicOffsets.delete(e);
  }
  setVertexBuffer(e, r, n = 0, i = -1) {
    if (this.assertOpen("setVertexBuffer"), e < 0 || e >= 16)
      throw new l(`[gpu-device-api] setVertexBuffer 的 slot 必须在 0..15 之间，实际是 ${e}。`);
    this.vertexBuffers[e] = r ? { buffer: r, offset: n, size: i } : null;
  }
  setIndexBuffer(e, r, n = 0, i = -1) {
    this.assertOpen("setIndexBuffer"), this.indexBuffer = { buffer: e, format: r, offset: n, size: i };
  }
  setViewport(e, r, n, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), (s !== 0 || a !== 1) && this.gl.depthRange(s, a), this.state.setViewport(e, r, n, i);
  }
  setScissorRect(e, r, n, i) {
    this.assertOpen("setScissorRect"), this.state.setScissor(!0, e, r, n, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(Ue(e));
  }
  setStencilReference(e) {
    this.assertOpen("setStencilReference"), this.stencilReference = e, this.pipeline && this.pipeline.applyState(this.pipeline.resolveVariant(this.variantRequest()), e);
  }
  draw(e) {
    this.assertOpen("draw");
    const r = this.requirePipeline("draw");
    this.assertNoUnsupportedInstancing(e.firstInstance ?? 0, 0);
    const n = e.instanceCount ?? 1;
    this.beginDraw(r, null), this.gl.drawArraysInstanced(
      r.mode,
      e.firstVertex ?? 0,
      e.vertexCount,
      n
    ), this.options.onDraw?.();
  }
  drawIndexed(e) {
    this.assertOpen("drawIndexed");
    const r = this.requirePipeline("drawIndexed"), n = this.indexBuffer;
    if (!n)
      throw new l(
        "[gpu-device-api] drawIndexed() 之前必须先调用 setIndexBuffer()。"
      );
    this.assertNoUnsupportedInstancing(e.firstInstance ?? 0, e.baseVertex ?? 0);
    const i = e.instanceCount ?? 1, s = n.offset + (e.firstIndex ?? 0) * sn(n.format);
    this.beginDraw(r, n), this.gl.drawElementsInstanced(
      r.mode,
      e.indexCount,
      co[n.format],
      s,
      i
    ), this.options.onDraw?.();
  }
  drawIndirect(e, r = 0) {
    throw this.assertOpen("drawIndirect"), new l(
      "[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 draw() 提交，或改用 WebGPU 后端。"
    );
  }
  drawIndexedIndirect(e, r = 0) {
    throw this.assertOpen("drawIndexedIndirect"), new l(
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
      throw new l(
        `[gpu-device-api] ${e}() 之前必须先调用 setPipeline()。`
      );
    return this.pipeline;
  }
  assertNoUnsupportedInstancing(e, r) {
    if (e !== 0)
      throw new l(
        "[gpu-device-api] WebGL2 不支持 `firstInstance`（缺少 drawArraysInstancedBaseInstance）。请把实例数据整体前移，或改用 WebGPU 后端。"
      );
    if (r !== 0)
      throw new l(
        "[gpu-device-api] WebGL2 不支持 `baseVertex`（缺少 drawElementsInstancedBaseVertex）。请把顶点偏移直接加到索引里，或改用 WebGPU 后端。"
      );
  }
  /** 一个 draw 之前必须完成的全部绑定工作。 */
  beginDraw(e, r) {
    const n = e.resolveVariant(this.variantRequest());
    e.applyState(n, this.stencilReference);
    const i = e.acquireVertexArray(
      n,
      this.vertexBuffers,
      r ? r.buffer.native : null
    );
    this.state.bindVertexArray(i), i === null && r && this.state.bindIndexBuffer(r.buffer.native), this.applyBindGroups(e);
  }
  applyBindGroups(e) {
    const r = e.bindingPlan;
    if (r) {
      for (const [n, i] of this.bindGroups) {
        if (!i) continue;
        const s = [...r.uniformBlocks.values()].filter((u) => u.group === n && u.dynamic).sort((u, c) => u.binding - c.binding), a = this.dynamicOffsets.get(n) ?? [];
        if (s.length > 0 && a.length < s.length)
          throw new l(
            `[gpu-device-api] setBindGroup(${n}, ...) 缺少动态偏移：布局里有 ${s.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${a.length} 个偏移值。`
          );
        let o = 0;
        for (const u of r.uniformBlocks.values()) {
          if (u.group !== n) continue;
          const c = i.entry(u.binding);
          if (!c)
            throw new l(
              `[gpu-device-api] bind group「${i.label}」缺少 binding ${u.binding}（布局要求提供 uniform buffer）。`
            );
          const d = c.resource, h = d.buffer, f = d.offset ?? 0;
          if (u.dynamic) {
            const p = this.state.context.getParameter(
              this.gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT
            ), m = a[o++] ?? 0;
            if (p > 0 && m % p !== 0)
              throw new l(
                `[gpu-device-api] 动态偏移 ${m} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${p}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
              );
            const g = f + m, x = d.size ?? h.size - g;
            this.state.bindUniformBuffer(u.blockBinding, h.native, g, x);
          } else
            this.state.bindUniformBuffer(u.blockBinding, h.native, 0, -1);
        }
        for (const u of r.textures.values()) {
          if (u.group !== n) continue;
          const c = i.entry(u.binding);
          if (!c)
            throw new l(
              `[gpu-device-api] bind group「${i.label}」缺少 binding ${u.binding}（布局要求提供纹理「${u.name}」）。`
            );
          const d = c.resource.view;
          if (this.assertViewRangeSupported(d), this.state.bindTexture(u.unit, d.target, d.glTexture), u.samplerBinding !== null) {
            const h = i.entry(u.samplerBinding);
            if (!h)
              throw new l(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${u.samplerBinding}（纹理「${u.name}」配套的 sampler「${u.samplerName ?? "未命名"}」）。`
              );
            const f = h.resource.sampler;
            this.state.bindSampler(u.unit, f.native);
          }
        }
      }
      this.assertAllGroupsBound(r);
    }
  }
  /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
  assertAllGroupsBound(e) {
    const r = /* @__PURE__ */ new Set();
    for (const i of e.uniformBlocks.values()) r.add(i.group);
    for (const i of e.textures.values()) r.add(i.group);
    const n = [...r].filter((i) => !this.bindGroups.get(i));
    if (n.length > 0)
      throw new l(
        `[gpu-device-api] 管线需要 bind group ${n.join("、")}，但本次绘制前没有调用 setBindGroup()。缺少绑定会让着色器读到未定义的数据（画面通常全黑且没有任何报错），所以这里直接拦下。`
      );
  }
  /**
   * WebGL2 无法表达「同一个纹理的不同 mip 子范围视图」：mip 范围是纹理对象自身的参数，
   * 不是绑定点状态。为了避免同一张纹理被两个 view 以不同 mip 范围采样时结果错乱，这里直接报错。
   */
  assertViewRangeSupported(e) {
    const r = e.descriptor, n = e.texture;
    if (r.baseMipLevel !== 0 || r.mipLevelCount !== n.mipLevelCount)
      throw new l(
        `[gpu-device-api] WebGL2 后端不支持在绑定时指定 mip 子范围（纹理「${n.label}」的 view 指定了 baseMipLevel=${r.baseMipLevel}, mipLevelCount=${r.mipLevelCount}）。mip 范围是纹理对象自身的状态，不是绑定点状态。请为需要的 mip 范围单独创建一张纹理。`
      );
  }
  /** 原始附件（不走 RenderTarget）路径下的清屏。 */
  clearRawAttachments(e, r) {
    const n = this.gl;
    this.state.setScissor(!1, 0, 0, n.drawingBufferWidth, n.drawingBufferHeight), e.colorAttachments.forEach((a, o) => {
      if (!a || a.loadOp === "load") return;
      const [u, c, d, h] = Ue(a.clearValue);
      n.clearBufferfv(n.COLOR, o, new Float32Array([u, c, d, h]));
    });
    const s = e.depthStencilAttachment;
    if (s && s.depthLoadOp !== "load") {
      n.depthMask(!0);
      const a = s.depthClearValue ?? 1, o = s.stencilClearValue ?? 0;
      s.view.texture.format.includes("stencil") ? n.clearBufferfi(n.DEPTH_STENCIL, 0, a, o) : n.clearBufferfv(n.DEPTH, 0, new Float32Array([a]));
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
    const r = this.gl;
    r.bindFramebuffer(r.FRAMEBUFFER, null), this.state.invalidate();
    const n = r.drawingBufferWidth, i = r.drawingBufferHeight;
    this.state.setScissor(!1, 0, 0, n, i);
    const s = e.colorAttachments.find((o) => o !== null);
    if (s && s.loadOp !== "load") {
      const [o, u, c, d] = Ue(s.clearValue);
      r.clearColor(o, u, c, d), r.clear(r.COLOR_BUFFER_BIT);
    }
    const a = e.depthStencilAttachment;
    a && a.depthLoadOp !== "load" && (r.depthMask(!0), r.clearDepth(a.depthClearValue ?? 1), r.clear(r.DEPTH_BUFFER_BIT)), r.viewport(0, 0, n, i), this.state.setViewport(0, 0, n, i);
  }
  assertOpen(e) {
    if (this._ended)
      throw new l(
        `[gpu-device-api] 渲染通道「${this.label}」已经 end()，不能再调用 ${e}()。`
      );
  }
}
const he = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class Wo {
  label = "computePass";
  constructor(e) {
    throw new l(he);
  }
  get ended() {
    return !0;
  }
  setPipeline(e) {
    throw new l(he);
  }
  setBindGroup(e, r, n) {
    throw new l(he);
  }
  dispatchWorkgroups(e, r, n) {
    throw new l(he);
  }
  dispatchWorkgroupsIndirect(e, r) {
    throw new l(he);
  }
  end() {
  }
}
class zo {
  label;
  gl;
  state;
  passOptions;
  openPass = null;
  drawCalls = 0;
  passCount = 0;
  finished = !1;
  constructor(e, r, n, i) {
    this.label = e?.label ?? R("commandEncoder"), this.gl = r, this.state = n, this.passOptions = i;
  }
  /** 由渲染通道回调，用于统计。 */
  noteDrawCall() {
    this.drawCalls += 1;
  }
  beginRenderPass(e) {
    if (this.assertOpen("beginRenderPass"), this.openPass && !this.openPass.ended)
      throw new l(
        `[gpu-device-api] encoder「${this.label}」里已经有打开的渲染通道了。WebGPU 也只允许同时打开一个通道，请先 end() 再开始下一个。`
      );
    const r = new ko(e, this.passOptions);
    return this.openPass = r, this.passCount += 1, r;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), new Wo();
  }
  copyBufferToBuffer(e, r, n, i, s) {
    this.assertOpen("copyBufferToBuffer");
    const a = this.gl, o = e.native, u = n.native, c = new Uint8Array(s);
    this.state.bindCopyReadBuffer(o), a.getBufferSubData(a.COPY_READ_BUFFER, r, c), this.state.bindCopyWriteBuffer(u), a.bufferSubData(a.COPY_WRITE_BUFFER, i, c);
  }
  copyBufferToTexture(e, r, n) {
    this.assertOpen("copyBufferToTexture");
    const i = this.gl, s = e.buffer.native, a = r.texture.native, o = r.texture.format, u = U(o), { x: c, y: d, z: h } = Ce(r.origin), f = e.bytesPerRow ?? n.width * u.bytesPerPixel, p = n.height, m = new Uint8Array(f * p);
    this.state.bindCopyReadBuffer(s), i.getBufferSubData(i.COPY_READ_BUFFER, e.offset ?? 0, m), i.bindTexture(r.texture.target, a), i.pixelStorei(i.UNPACK_ALIGNMENT, 1), f !== n.width * u.bytesPerPixel && i.pixelStorei(i.UNPACK_ROW_LENGTH, f / u.bytesPerPixel);
    const g = r.texture.target;
    g === i.TEXTURE_3D || g === i.TEXTURE_2D_ARRAY ? i.texSubImage3D(
      g,
      r.mipLevel ?? 0,
      c,
      d,
      h,
      n.width,
      n.height,
      n.depthOrArrayLayers,
      u.format,
      u.type,
      m
    ) : i.texSubImage2D(
      g,
      r.mipLevel ?? 0,
      c,
      d,
      n.width,
      n.height,
      u.format,
      u.type,
      m
    ), i.pixelStorei(i.UNPACK_ROW_LENGTH, 0), i.pixelStorei(i.UNPACK_ALIGNMENT, 4), this.state.invalidate();
  }
  copyTextureToBuffer(e, r, n) {
    this.assertOpen("copyTextureToBuffer");
    const i = this.gl, s = e.texture, a = U(s.format), o = hr(
      r.bytesPerRow ?? n.width * a.bytesPerPixel,
      4
    ), u = new Uint8Array(o * n.height), c = i.createFramebuffer();
    if (!c)
      throw new l("[gpu-device-api] gl.createFramebuffer() 返回 null，无法读回纹理。");
    const d = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, c);
    const h = a.depth ? i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0;
    i.framebufferTexture2D(i.FRAMEBUFFER, h, i.TEXTURE_2D, s.native, e.mipLevel ?? 0);
    const f = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (f !== i.FRAMEBUFFER_COMPLETE)
      throw i.bindFramebuffer(i.FRAMEBUFFER, d), i.deleteFramebuffer(c), new l(
        `[gpu-device-api] 无法把纹理「${s.label}」作为附件读回（framebuffer 不完整，0x${f.toString(16)}）。请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。`
      );
    i.pixelStorei(i.PACK_ALIGNMENT, 1);
    const { x: p, y: m } = Ce(e.origin);
    i.readPixels(p, m, n.width, n.height, a.format, a.type, u), i.pixelStorei(i.PACK_ALIGNMENT, 4), i.bindFramebuffer(i.FRAMEBUFFER, d), i.deleteFramebuffer(c), this.state.invalidate();
    const g = r.buffer.native;
    this.state.bindCopyWriteBuffer(g), i.bufferSubData(i.COPY_WRITE_BUFFER, r.offset ?? 0, u);
  }
  copyTextureToTexture(e, r, n) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = r.texture, o = U(a.format), { x: u, y: c } = Ce(e.origin), { x: d, y: h } = Ce(r.origin), f = i.createFramebuffer(), p = i.createFramebuffer();
    if (!f || !p)
      throw new l("[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。");
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
      r.mipLevel ?? 0
    ), U(s.format).internalFormat !== o.internalFormat)
      throw new l(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${s.format}」，目标是「${a.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`
      );
    i.blitFramebuffer(
      u,
      c,
      u + n.width,
      c + n.height,
      d,
      h,
      d + n.width,
      h + n.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, m), i.deleteFramebuffer(f), i.deleteFramebuffer(p), this.state.invalidate();
  }
  clearBuffer(e, r = 0, n) {
    this.assertOpen("clearBuffer");
    const i = this.gl, s = e.native, a = n ?? e.size - r, o = new Uint8Array(a);
    this.state.bindCopyWriteBuffer(s), i.bufferSubData(i.COPY_WRITE_BUFFER, r, o);
  }
  finish() {
    if (this.assertOpen("finish"), this.openPass && !this.openPass.ended)
      throw new l(
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
      throw new l(
        `[gpu-device-api] encoder「${this.label}」已经 finish()，不能再调用 ${e}()。`
      );
  }
}
function Ce(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function qo(t) {
  const e = t.colorAttachments.map((n) => n ? Vt(n) : "-").join(","), r = t.depthStencilAttachment ? Vt(t.depthStencilAttachment) : "-";
  return `${e}|${r}`;
}
function Vt(t) {
  const e = t.view, r = e.texture;
  return `${e.label}@${r.label}#${r.width}x${r.height}`;
}
class jo {
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
    const r = qo(e), n = this.framebuffers.get(r);
    if (n) return n;
    const i = this.gl, s = i.createFramebuffer();
    if (!s)
      throw new l("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。");
    const a = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, s);
    let o = 0;
    for (const d of e.colorAttachments) {
      if (!d) continue;
      const h = d.view, f = h.target;
      f === i.TEXTURE_2D ? i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + o, f, h.glTexture, 0) : i.framebufferTextureLayer(
        i.FRAMEBUFFER,
        i.COLOR_ATTACHMENT0 + o,
        h.glTexture,
        h.descriptor.baseMipLevel,
        h.descriptor.baseArrayLayer
      ), o += 1;
    }
    o > 0 && i.drawBuffers(
      Array.from({ length: o }, (d, h) => i.COLOR_ATTACHMENT0 + h)
    );
    const u = e.depthStencilAttachment;
    if (u) {
      const d = u.view, f = U(d.texture.format).stencil ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
      i.framebufferTexture2D(i.FRAMEBUFFER, f, i.TEXTURE_2D, d.glTexture, 0);
    }
    i.bindFramebuffer(i.FRAMEBUFFER, a), i.bindFramebuffer(i.FRAMEBUFFER, s);
    const c = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (i.bindFramebuffer(i.FRAMEBUFFER, a), c !== i.FRAMEBUFFER_COMPLETE)
      throw i.deleteFramebuffer(s), new l(
        `[gpu-device-api] 这组渲染附件在 WebGL2 下不构成完整的 framebuffer（GL 状态码 0x${c.toString(16)}）。
常见原因：颜色附件格式不可渲染、多个附件的尺寸/采样数不一致、深度附件与颜色附件不匹配。`
      );
    return this.framebuffers.set(r, s), s;
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
class Xo {
  label = R("queue");
  gl;
  state;
  submittedCount = 0;
  pending = Promise.resolve();
  constructor(e, r) {
    this.gl = e, this.state = r;
  }
  /** 已提交的 command buffer 数量（用于测试与统计）。 */
  get submitted() {
    return this.submittedCount;
  }
  writeBuffer(e, r, n, i = 0, s) {
    const a = e, o = s ?? n.byteLength - i;
    if (r + o > a.size)
      throw new l(
        `[gpu-device-api] writeBuffer 越界：写入范围 [${r}, ${r + o}) 超出了 buffer「${a.label}」的 ${a.size} 字节。`
      );
    const u = new Uint8Array(n.buffer, n.byteOffset + i, o);
    a.upload(r, mn(u));
  }
  writeTexture(e, r, n, i) {
    const s = e.texture, a = U(s.format);
    so(s.format, r);
    const o = Nt(e.origin), u = n.bytesPerRow ?? i.width * a.bytesPerPixel, c = this.gl;
    c.bindTexture(s.target, s.native), c.pixelStorei(c.UNPACK_ALIGNMENT, 1), u !== i.width * a.bytesPerPixel && c.pixelStorei(c.UNPACK_ROW_LENGTH, u / a.bytesPerPixel);
    const d = new Uint8Array(r.buffer, r.byteOffset + n.offset, r.byteLength - n.offset);
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
      d
    ) : c.texSubImage2D(
      s.target,
      e.mipLevel ?? 0,
      o.x,
      o.y,
      i.width,
      i.height,
      a.format,
      a.type,
      d
    ), c.pixelStorei(c.UNPACK_ROW_LENGTH, 0), c.pixelStorei(c.UNPACK_ALIGNMENT, 4), this.state.invalidate();
  }
  copyExternalImageToTexture(e, r, n, i = !1) {
    const s = r.texture, a = U(s.format), o = this.gl, u = Nt(r.origin);
    o.bindTexture(s.target, s.native), o.pixelStorei(o.UNPACK_ALIGNMENT, 1), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, i ? 1 : 0);
    try {
      s.target === o.TEXTURE_3D || s.target === o.TEXTURE_2D_ARRAY ? o.texSubImage3D(
        s.target,
        r.mipLevel ?? 0,
        u.x,
        u.y,
        u.z,
        n.width,
        n.height,
        n.depthOrArrayLayers,
        a.format,
        a.type,
        e
      ) : o.texSubImage2D(
        s.target,
        r.mipLevel ?? 0,
        u.x,
        u.y,
        n.width,
        n.height,
        a.format,
        a.type,
        e
      );
    } finally {
      o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, 0), o.pixelStorei(o.UNPACK_ALIGNMENT, 4);
    }
    this.state.invalidate();
  }
  copyBufferToBuffer(e, r, n, i, s) {
    const a = this.gl, o = new Uint8Array(s);
    this.state.bindCopyReadBuffer(e.native), a.getBufferSubData(a.COPY_READ_BUFFER, r, o), this.state.bindCopyWriteBuffer(n.native), a.bufferSubData(a.COPY_WRITE_BUFFER, i, o);
  }
  copyBufferToTexture(e, r, n) {
    const i = this.gl, s = U(r.texture.format), a = e.bytesPerRow ?? n.width * s.bytesPerPixel, o = new Uint8Array(a * n.height);
    this.state.bindCopyReadBuffer(e.buffer.native), i.getBufferSubData(i.COPY_READ_BUFFER, e.offset ?? 0, o), this.writeTexture(r, o, { offset: 0, bytesPerRow: a }, n);
  }
  submit(e) {
    this.submittedCount += e.length, e.length > 0 && this.gl.flush();
  }
  async onSubmittedWorkDone() {
    await this.pending, this.gl.finish();
  }
}
function Nt(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
class Yo {
  label = R("fence");
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
        await Ho();
      }
    }
  }
}
function Ho() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
class Ko {
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
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? Ne("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? R("webgl2Device"), this.limits = cr(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const r = [...e.adapterFeatures], n = new Set(r), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !n.has(a));
    if (i.length > 0)
      throw new l(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${r.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => n.has(a),
      names: r
    }, this.state = new da(e.gl), this.planCache = new Eo({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new Lo({ gl: e.gl, state: this.state }), this.framebuffers = new jo(e.gl), this.queue = new Xo(e.gl, this.state), this.lostPromise = new Promise((a) => {
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
      new pa(this.gl, this.state, e, (r) => {
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new Lt(this.gl, this.state, e, () => {
        this.framebuffers.clear();
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, r, n, i, s) {
    return this.track(
      new Lt(
        this.gl,
        this.state,
        { format: e, size: { width: r, height: n }, usage: i, label: s },
        () => this.framebuffers.clear()
      )
    );
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new xo(this.gl, this.state, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new To(e));
  }
  createQuerySet(e) {
    throw this.assertUsable("createQuerySet"), new l(
      `[gpu-device-api] WebGL2 后端暂不支持 query set（「${e.label ?? e.type}」）。WebGL2 的遮挡查询只能同步读回单个样本数，没有查询结果缓冲区的概念。`
    );
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new Gt(e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new So(e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(new Ut(e, !1, this));
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const r = e.label ?? "renderPipeline", n = ot({
      backend: "webgl2",
      source: e.vertex.module.source,
      stage: D.Vertex,
      label: r,
      defines: e.vertex.module.defines
    }).code;
    if (!e.fragment)
      throw new l(
        "[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n只写深度时，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    const i = ot({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: D.Fragment,
      label: r,
      defines: e.fragment.module.defines
    }).code, s = this.programs.acquire(r, n, i);
    let a;
    if (e.layout === void 0 || e.layout === "auto") {
      const u = na(s.reflection, D.Vertex | D.Fragment);
      if (u.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const c = new Gt({
          label: `${r}:autoLayout`,
          entries: u
        });
        this.track(c), a = this.track(
          new Ut(
            { label: `${r}:autoPipelineLayout`, bindGroupLayouts: [c] },
            !0,
            this
          )
        ), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else
      a = e.layout, this.programs.bindPlan(s, a.bindingPlan);
    const o = new Po(e, s, a, {
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
    return this.assertUsable("createComputePipeline"), new Uo(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    return this.assertUsable("createRenderTarget"), this.track(
      new Oo(e, {
        gl: this.gl,
        state: this.state,
        createTexture: (r, n, i, s, a) => this.createAttachmentTexture(r, n, i, s, a)
      })
    );
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new zo(e, this.gl, this.state, {
      gl: this.gl,
      state: this.state,
      framebuffers: this.framebuffers,
      getDefaultSize: () => ({ width: this.gl.drawingBufferWidth, height: this.gl.drawingBufferHeight }),
      onDraw: () => {
        this.debug && this.checkGlError("draw");
      }
    });
  }
  createCanvasContext(e, r) {
    if (this.assertUsable("createCanvasContext"), e !== this.canvas)
      throw new l(
        `[gpu-device-api] WebGL2 的 device 只能服务创建它的那个 canvas。
GL context 是从 canvas 上取的，一个 device 对应一个 canvas；如果确实需要渲染到多个 canvas，请为每个 canvas 单独 createDevice()。`
      );
    let n = this.canvasContexts.get(e);
    return n || (n = new No({ gl: this.gl, canvas: e, format: r?.format }), this.canvasContexts.set(e, n)), n.configure({ ...r, device: this }), this.state.invalidate(), n;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new Yo(this.gl);
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
    for (const r of this.errorCallbacks) r(e);
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = !0;
    const e = [...this.resources];
    this.resources.clear();
    for (const r of e)
      try {
        r.dispose();
      } catch (n) {
        this.logger.warn("释放资源时出错", n);
      }
    this.programs.dispose(), this.framebuffers.dispose(), this.planCache.clear();
    for (const r of this.canvasContexts.values()) r.dispose();
    this.canvasContexts.clear(), this.state.invalidate(), this.lostResolve({ reason: "destroyed", message: "设备已调用 dispose()。" });
  }
  /**
   * 在 debug 模式下轮询 `gl.getError()` 并转成统一错误。
   * 注意这会强制 CPU/GPU 同步，所以只在 debug 打开时调用。
   */
  checkGlError(e) {
    if (!this.debug) return;
    const r = this.gl.getError();
    r !== this.gl.NO_ERROR && this.reportError(
      new Z(`[gpu-device-api] GL 错误 0x${r.toString(16)}（发生在 ${e} 之后）。`, {
        code: "GL_ERROR",
        details: { glError: r, context: e }
      })
    );
  }
  track(e) {
    return this.resources.add(e), e;
  }
  assertUsable(e) {
    if (this._disposed)
      throw new st(`[gpu-device-api] 设备已 dispose()，不能再调用 ${e}()。`, {
        reason: "destroyed"
      });
  }
}
const Qo = {
  antialias: !0,
  alpha: !1,
  depth: !0,
  stencil: !1,
  premultipliedAlpha: !0,
  preserveDrawingBuffer: !1,
  powerPreference: "high-performance",
  desynchronized: !1
};
class gt {
  info;
  features;
  limits;
  gl;
  canvas;
  logger;
  device = null;
  constructor(e, r, n, i, s) {
    this.gl = e, this.canvas = r, this.limits = n, this.features = i, this.logger = s;
    const a = la(e);
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
    const r = { ...Qo, ...e.contextAttributes }, n = ca(e.canvas, r), i = aa(n), s = oa(n);
    return new gt(n, e.canvas, i, s, e.logger);
  }
  /** 已经为这个 canvas 创建过 GL context（用于避免重复初始化）。 */
  get context() {
    return this.gl;
  }
  async requestDevice(e = {}) {
    if (this.device && !this.device.disposed)
      throw new l(
        `[gpu-device-api] 这个 WebGL2 adapter 已经创建过 device 了。
GL context 与 canvas 是一一对应的，一个 adapter 只能产出一个 device；请复用已有的 device，或为另一个 canvas 单独 requestAdapter()。`
      );
    const r = new Ko({
      gl: this.gl,
      canvas: this.canvas,
      descriptor: e,
      adapterLimits: this.limits,
      adapterFeatures: this.features,
      logger: this.logger
    });
    return this.device = r, r;
  }
  /** 该 adapter 已经创建出的 device（未创建时为 `null`）。 */
  get currentDevice() {
    return this.device;
  }
}
const bt = Object.freeze({
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
function b(t, e, r, n = {}) {
  const i = e === "depth" || e === "stencil" ? "depth" : e === "uint" ? "uint" : e === "sint" ? "sint" : "float";
  return {
    gpuFormat: bt[t],
    kind: e,
    bytesPerTexel: r,
    renderable: n.renderable ?? !1,
    depthStencilAttachment: n.depthStencilAttachment ?? !1,
    sampleable: n.sampleable ?? !0,
    storage: n.storage ?? !1,
    copyable: n.copyable ?? !0,
    filterable: n.filterable ?? !1,
    renderFeature: n.renderFeature,
    storageFeature: n.storageFeature,
    filterFeature: n.filterFeature,
    sampleScalar: i
  };
}
const Zo = Object.freeze({
  r8unorm: b("r8unorm", "unorm", 1, { renderable: !0, filterable: !0 }),
  r8snorm: b("r8snorm", "snorm", 1, { filterable: !1 }),
  r8uint: b("r8uint", "uint", 1, { renderable: !0 }),
  r8sint: b("r8sint", "sint", 1, { renderable: !0 }),
  r16uint: b("r16uint", "uint", 2, { renderable: !0 }),
  r16sint: b("r16sint", "sint", 2, { renderable: !0 }),
  r16float: b("r16float", "float", 2, { renderable: !0, filterable: !0 }),
  rg8unorm: b("rg8unorm", "unorm", 2, { renderable: !0, filterable: !0 }),
  rg8snorm: b("rg8snorm", "snorm", 2, {}),
  rg8uint: b("rg8uint", "uint", 2, { renderable: !0 }),
  rg8sint: b("rg8sint", "sint", 2, { renderable: !0 }),
  r32uint: b("r32uint", "uint", 4, { renderable: !0, storage: !0 }),
  r32sint: b("r32sint", "sint", 4, { renderable: !0, storage: !0 }),
  r32float: b("r32float", "float", 4, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rg16uint: b("rg16uint", "uint", 4, { renderable: !0 }),
  rg16sint: b("rg16sint", "sint", 4, { renderable: !0 }),
  rg16float: b("rg16float", "float", 4, { renderable: !0, filterable: !0 }),
  rgba8unorm: b("rgba8unorm", "unorm", 4, { renderable: !0, storage: !0, filterable: !0 }),
  "rgba8unorm-srgb": b("rgba8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgba8snorm: b("rgba8snorm", "snorm", 4, { storage: !0 }),
  rgba8uint: b("rgba8uint", "uint", 4, { renderable: !0, storage: !0 }),
  rgba8sint: b("rgba8sint", "sint", 4, { renderable: !0, storage: !0 }),
  bgra8unorm: b("bgra8unorm", "unorm", 4, {
    renderable: !0,
    filterable: !0,
    storageFeature: "bgra8unorm-storage"
  }),
  "bgra8unorm-srgb": b("bgra8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgb9e5ufloat: b("rgb9e5ufloat", "float", 4, {}),
  rgb10a2unorm: b("rgb10a2unorm", "unorm", 4, { renderable: !0, filterable: !0 }),
  rg11b10ufloat: b("rg11b10ufloat", "float", 4, { renderFeature: "rg11b10ufloat-renderable" }),
  rg32uint: b("rg32uint", "uint", 8, { renderable: !0, storage: !0 }),
  rg32sint: b("rg32sint", "sint", 8, { renderable: !0, storage: !0 }),
  rg32float: b("rg32float", "float", 8, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rgba16uint: b("rgba16uint", "uint", 8, { renderable: !0, storage: !0 }),
  rgba16sint: b("rgba16sint", "sint", 8, { renderable: !0, storage: !0 }),
  rgba16float: b("rgba16float", "float", 8, { renderable: !0, storage: !0, filterable: !0 }),
  rgba32uint: b("rgba32uint", "uint", 16, { renderable: !0, storage: !0 }),
  rgba32sint: b("rgba32sint", "sint", 16, { renderable: !0, storage: !0 }),
  rgba32float: b("rgba32float", "float", 16, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  depth16unorm: b("depth16unorm", "depth", 2, {
    depthStencilAttachment: !0,
    filterable: !0
  }),
  // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
  // 因此没有确定的内存布局：既不能采样，也不能拷贝。
  depth24plus: b("depth24plus", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  "depth24plus-stencil8": b("depth24plus-stencil8", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  depth32float: b("depth32float", "depth", 4, {
    depthStencilAttachment: !0,
    filterFeature: "float32-filterable"
  }),
  stencil8: b("stencil8", "stencil", 1, {
    depthStencilAttachment: !0,
    sampleable: !1
  })
});
function ie(t) {
  const e = Zo[t];
  if (!e)
    throw new l(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function z(t) {
  const e = bt[t];
  if (!e)
    throw new l(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function Jo(t) {
  for (const [e, r] of Object.entries(bt))
    if (r === t) return e;
  throw new l(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function Rr(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function ke(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function el(t, e) {
  const r = ie(t);
  return r.filterable ? !0 : r.filterFeature && e ? e.has(r.filterFeature) : !1;
}
function tl(t, e, r) {
  const n = ie(t);
  if (!(n.renderable || n.depthStencilAttachment)) {
    if (n.renderFeature) {
      if (e ? e.has(n.renderFeature) : !1) return;
      throw new l(
        `[gpu-device-api] ${r}: "${t}" requires the "${n.renderFeature}" device feature to be used as a render attachment (it is not enabled on this device).`
      );
    }
    throw new l(
      `[gpu-device-api] ${r}: "${t}" cannot be used as a render attachment in WebGPU (snorm color formats and rgb9e5ufloat have no renderable support).`
    );
  }
}
function rl(t, e, r = !1) {
  const n = ie(t);
  if (r)
    throw new l(
      `[gpu-device-api] ${e}: a multisampled texture ("${t}", sampleCount > 1) cannot be used as a TextureBinding; WebGPU only allows multisampled textures as render attachments.`
    );
  if (!n.sampleable)
    throw n.kind === "stencil" ? new l(
      `[gpu-device-api] ${e}: "stencil8" has no sampleable aspect; bind a depth format instead.`
    ) : new l(
      `[gpu-device-api] ${e}: "${t}" can only be used as a depth/stencil attachment and cannot be sampled (its memory layout is implementation defined). Use "depth32float" or "depth16unorm" when the depth texture has to be read in a shader.`
    );
}
function Gr(t, e, r) {
  const n = ie(t);
  if (!n.storage) {
    if (n.storageFeature) {
      if (e?.has(n.storageFeature)) return;
      throw new l(
        `[gpu-device-api] ${r}: "${t}" requires the "${n.storageFeature}" device feature to be used as a storage texture (it is not enabled on this device).`
      );
    }
    throw new l(
      `[gpu-device-api] ${r}: "${t}" cannot be used as a storage texture. WebGPU only allows r32uint/r32sint/r32float, rg32*, rgba8unorm(-snorm/uint/sint), rgba16*, rgba32* and bgra8unorm (with the bgra8unorm-storage feature).`
    );
  }
}
function nl(t, e) {
  if (!ie(t).copyable)
    throw new l(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function il(t, e, r) {
  if (e !== "all") {
    if (e === "depth-only" && !Rr(t))
      throw new l(
        `[gpu-device-api] ${r}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !ke(t))
      throw new l(
        `[gpu-device-api] ${r}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function sl(t, e, r, n) {
  ie(t);
  const i = r.sampleCount ?? 1;
  if (e & v.RenderAttachment && tl(t, r.features, n), e & v.TextureBinding && rl(t, n, i > 1), e & v.StorageBinding && Gr(t, r.features, n), e & (v.CopySrc | v.CopyDst) && nl(t, n), i > 1) {
    if (i !== 4)
      throw new l(
        `[gpu-device-api] ${n}: sampleCount must be 1 or 4, got ${String(i)}.`
      );
    if ((r.mipLevelCount ?? 1) > 1)
      throw new l(
        `[gpu-device-api] ${n}: a multisampled texture must have exactly one mip level.`
      );
    if (r.dimension !== void 0 && r.dimension !== "2d")
      throw new l(
        `[gpu-device-api] ${n}: a multisampled texture must be "2d", got "${r.dimension}".`
      );
    if (e & (v.CopySrc | v.CopyDst))
      throw new l(
        `[gpu-device-api] ${n}: a multisampled texture cannot be a copy source or destination; resolve it into a single-sampled texture first.`
      );
    if (e & (v.TextureBinding | v.StorageBinding))
      throw new l(
        `[gpu-device-api] ${n}: a multisampled texture can only be used as a render attachment.`
      );
  }
}
const al = [
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
], ol = Object.freeze({
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
function wt() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function kt() {
  return wt() !== null;
}
async function ll(t = {}) {
  const e = wt();
  if (!e) return null;
  const r = {};
  return t.powerPreference !== void 0 && (r.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (r.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (r.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (r.xrCompatible = t.xrCompatible), e.requestAdapter(r);
}
function ul(t) {
  const e = /* @__PURE__ */ new Set();
  if (!t) return e;
  if (typeof t[Symbol.iterator] == "function") {
    for (const s of t) e.add(s);
    return e;
  }
  const n = t.keys;
  if (typeof n == "function") {
    for (const s of n.call(t)) e.add(s);
    return e;
  }
  const i = t.forEach;
  return typeof i == "function" && i.call(t, (s) => e.add(s)), e;
}
function Ur(t) {
  const e = t ?? {}, r = {};
  for (const n of al) {
    const i = e[n];
    r[n] = typeof i == "number" && Number.isFinite(i) ? i : ol[n];
  }
  return r;
}
function cl(t) {
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
function dl(t, e, r) {
  if (!e || e.length === 0) return [];
  const n = [];
  for (const i of e) {
    if (typeof i != "string" || i.length === 0)
      throw new l(`[gpu-device-api] ${r}: feature names must be non-empty strings.`);
    if (!n.includes(i) && (n.push(i), !t.has(i)))
      throw new l(
        `[gpu-device-api] ${r}: the adapter does not support the "${i}" feature. Available features: ${t.size > 0 ? [...t].sort().join(", ") : "(none)"}.`
      );
  }
  return n;
}
class hl {
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
function Wt() {
  const t = wt();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function fl(t) {
  const e = z(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new l(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function pl(t) {
  const r = t.getContext.call(t, "webgpu");
  return !r || typeof r.getCurrentTexture != "function" ? null : r;
}
const Ke = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, Pe = {
  RED: 1,
  GREEN: 2,
  BLUE: 4,
  ALPHA: 8
}, j = {
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
}, fe = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, zt = {
  READ: 1,
  WRITE: 2
};
function ml(t) {
  if (!Number.isInteger(t))
    throw new l(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new l(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & D.Vertex && (e |= Ke.VERTEX), t & D.Fragment && (e |= Ke.FRAGMENT), t & D.Compute && (e |= Ke.COMPUTE), e === 0)
    throw new l(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function gl(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new l(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & H.Red && (e |= Pe.RED), t & H.Green && (e |= Pe.GREEN), t & H.Blue && (e |= Pe.BLUE), t & H.Alpha && (e |= Pe.ALPHA), e;
}
function bl(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new l(
      `[gpu-device-api] BufferUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -1024)
    throw new l(
      `[gpu-device-api] BufferUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  if (t & G.MapRead && t & G.MapWrite)
    throw new l(
      "[gpu-device-api] BufferUsage cannot combine MapRead and MapWrite: WebGPU rejects a buffer that is both mappable for reading and for writing. Use two buffers (or CopyDst plus writeBuffer)."
    );
  let e = 0;
  return t & G.MapRead && (e |= j.MAP_READ), t & G.MapWrite && (e |= j.MAP_WRITE), t & G.CopySrc && (e |= j.COPY_SRC), t & G.CopyDst && (e |= j.COPY_DST), t & G.Index && (e |= j.INDEX), t & G.Vertex && (e |= j.VERTEX), t & G.Uniform && (e |= j.UNIFORM), t & G.Storage && (e |= j.STORAGE), t & G.Indirect && (e |= j.INDIRECT), t & G.QueryResolve && (e |= j.QUERY_RESOLVE), e;
}
function Mr(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new l(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new l(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & v.CopySrc && (e |= fe.COPY_SRC), t & v.CopyDst && (e |= fe.COPY_DST), t & v.TextureBinding && (e |= fe.TEXTURE_BINDING), t & v.StorageBinding && (e |= fe.STORAGE_BINDING), t & v.RenderAttachment && (e |= fe.RENDER_ATTACHMENT), e;
}
function wl(t) {
  switch (t) {
    case "read":
      return zt.READ;
    case "write":
      return zt.WRITE;
    default:
      return $(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function vl(t) {
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
      return $(t, `[gpu-device-api] Unknown PrimitiveTopology "${String(t)}".`);
  }
}
function yl(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function Or(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return $(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
  }
}
function vt(t) {
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
      return $(t, `[gpu-device-api] Unknown CompareFunction "${String(t)}".`);
  }
}
function Qe(t) {
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
      return $(t, `[gpu-device-api] Unknown StencilOperation "${String(t)}".`);
  }
}
function qt(t) {
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
      return $(t, `[gpu-device-api] Unknown BlendFactor "${String(t)}".`);
  }
}
function xl(t) {
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
      return $(t, `[gpu-device-api] Unknown BlendOperation "${String(t)}".`);
  }
}
function Ze(t) {
  switch (t) {
    case "clamp-to-edge":
      return "clamp-to-edge";
    case "repeat":
      return "repeat";
    case "mirror-repeat":
      return "mirror-repeat";
    default:
      return $(t, `[gpu-device-api] Unknown AddressMode "${String(t)}".`);
  }
}
function jt(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return $(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function Tl(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return $(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function Sl(t) {
  switch (t) {
    case "none":
      return "none";
    case "front":
      return "front";
    case "back":
      return "back";
    default:
      return $(t, `[gpu-device-api] Unknown CullMode "${String(t)}".`);
  }
}
function $l(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return $(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function Je(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return $(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function et(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return $(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function ut(t) {
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
      return $(t, `[gpu-device-api] Unknown TextureViewDimension "${String(t)}".`);
  }
}
function yt(t) {
  switch (t) {
    case "all":
      return "all";
    case "depth-only":
      return "depth-only";
    case "stencil-only":
      return "stencil-only";
    default:
      return $(t, `[gpu-device-api] Unknown TextureAspect "${String(t)}".`);
  }
}
function Al(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return $(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function El(t) {
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
      return $(t, `[gpu-device-api] Unknown VertexFormat "${String(t)}".`);
  }
}
function Ll(t) {
  switch (t) {
    case at.Occlusion:
      return "occlusion";
    case at.Timestamp:
      return "timestamp";
    default:
      return $(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function _l(t) {
  switch (t) {
    case "uniform":
      return "uniform";
    case "storage":
      return "storage";
    case "read-only-storage":
      return "read-only-storage";
    default:
      throw new l(
        `[gpu-device-api] BindingType "${String(t)}" is not a buffer binding; expected "uniform", "storage" or "read-only-storage".`
      );
  }
}
function Bl(t) {
  switch (t) {
    case "sampler":
      return "filtering";
    case "comparison-sampler":
      return "comparison";
    default:
      throw new l(
        `[gpu-device-api] BindingType "${String(t)}" is not a sampler binding; expected "sampler" or "comparison-sampler".`
      );
  }
}
function Cl(t) {
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
      return $(t, `[gpu-device-api] Unknown TextureSampleType "${String(t)}".`);
  }
}
function Pl(t) {
  switch (t) {
    case "write-only":
      return "write-only";
    case "read-only":
      return "read-only";
    case "read-write":
      return "read-write";
    default:
      return $(t, `[gpu-device-api] Unknown StorageTextureAccess "${String(t)}".`);
  }
}
function Fl(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return $(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const Rl = {
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
}, Gl = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, Ul = /^rgba?\(([^)]*)\)$/;
function Dr(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return Ol(t);
  if (typeof t == "number") return Ml(t);
  if (Array.isArray(t)) {
    const r = t;
    if (r.length !== 3 && r.length !== 4)
      throw new l(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${r.length}.`
      );
    return Xt(r[0], r[1], r[2], r.length === 4 ? r[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new l(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return Xt(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function Xt(t, e, r, n, i) {
  for (const [s, a] of [
    ["r", t],
    ["g", e],
    ["b", r],
    ["a", n]
  ])
    if (!Number.isFinite(a))
      throw new l(
        `[gpu-device-api] Clear color component "${s}" must be a finite number, got ${String(a)} (from ${JSON.stringify(i)}).`
      );
  return { r: t, g: e, b: r, a: n };
}
function Ml(t) {
  if (!Number.isFinite(t) || !Number.isInteger(t) || t < 0 || t > 16777215)
    throw new l(
      `[gpu-device-api] A numeric clear color must be an integer in 0x000000..0xFFFFFF (0xRRGGBB), got ${String(t)}.`
    );
  return {
    r: (t >> 16 & 255) / 255,
    g: (t >> 8 & 255) / 255,
    b: (t & 255) / 255,
    a: 1
  };
}
function Ol(t) {
  const e = t.trim().toLowerCase(), r = Gl.exec(e);
  if (r) {
    const s = r[1];
    if (s.length === 3 || s.length === 4) {
      const d = parseInt(s[0] + s[0], 16) / 255, h = parseInt(s[1] + s[1], 16) / 255, f = parseInt(s[2] + s[2], 16) / 255, p = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: d, g: h, b: f, a: p };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, u = parseInt(s.slice(4, 6), 16) / 255, c = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: u, a: c };
  }
  const n = Rl[e];
  if (n) return { r: n[0], g: n[1], b: n[2], a: n[3] };
  const i = Ul.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((d) => d.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new l(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = tt(s[0], t), o = tt(s[1], t), u = tt(s[2], t), c = s.length === 4 ? Dl(s[3], t) : 1;
    return { r: a, g: o, b: u, a: c };
  }
  throw new l(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function tt(t, e) {
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    if (!Number.isFinite(n))
      throw new l(`[gpu-device-api] Clear color "${e}" has an invalid percentage "${t}".`);
    return n / 100;
  }
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new l(`[gpu-device-api] Clear color "${e}" has an invalid component "${t}".`);
  return r / 255;
}
function Dl(t, e) {
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    if (!Number.isFinite(n))
      throw new l(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
    return n / 100;
  }
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new l(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
  return r;
}
function ce(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function Ir(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function Il(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function we(t, e) {
  if (t !== 1 && t !== 4)
    throw new l(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class Vr {
  label;
  size;
  usage;
  native;
  device;
  _disposed = !1;
  _mapped = !1;
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? `buffer#${e.nextResourceId("buffer")}`, ge(r.size, "BufferDescriptor.size"), r.size % 4 !== 0)
      throw new l(
        `[gpu-device-api] BufferDescriptor.size must be a multiple of 4 (WebGPU requires 4-byte aligned buffer sizes), got ${r.size}. Use alignTo4()/paddedCopy() when uploading tightly packed data.`
      );
    if (r.size > e.limits.maxBufferSize)
      throw new l(
        `[gpu-device-api] BufferDescriptor.size ${r.size} exceeds maxBufferSize (${e.limits.maxBufferSize}).`
      );
    this.size = r.size, this.usage = r.usage, this.native = e.native.createBuffer({
      label: this.label,
      size: r.size,
      usage: bl(r.usage)
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
  async mapAsync(e, r = 0, n) {
    if (this.assertUsable("Buffer.mapAsync"), this._mapped)
      throw new l(
        `[gpu-device-api] Buffer "${this.label}" is already mapped; call unmap() before mapping it again.`
      );
    const i = n ?? this.size - r;
    return this.assertRange(r, i, "Buffer.mapAsync"), await this.native.mapAsync(wl(e), r, i), this._mapped = !0, this.native.getMappedRange(r, i);
  }
  /** 当前已映射的范围；buffer 未映射时抛错。 */
  getMappedRange(e = 0, r) {
    if (this.assertUsable("Buffer.getMappedRange"), !this._mapped)
      throw new l(
        `[gpu-device-api] Buffer "${this.label}" is not mapped; await mapAsync() before calling getMappedRange().`
      );
    const n = r ?? this.size - e;
    return this.assertRange(e, n, "Buffer.getMappedRange"), this.native.getMappedRange(e, n);
  }
  /**
   * 结束映射：`'write'` 映射会在此把 CPU 侧的改动刷给 GPU，`'read'` 映射在此释放映射内存。
   *
   * 未映射时是空操作（WebGPU 的 `unmap()` 对未映射 buffer 同样是合法的空操作），
   * 这样清理路径里可以放心地无条件调用。
   */
  unmap() {
    this._disposed || this._mapped && (this._mapped = !1, this.native.unmap());
  }
  /** 释放底层分配。幂等；已映射的 buffer 会先被取消映射。 */
  destroy() {
    this._disposed || (this._disposed = !0, this._mapped = !1, this.native.destroy());
  }
  /** `Disposable` 的别名，语义与 {@link WebGPUBuffer.destroy} 相同。 */
  dispose() {
    this.destroy();
  }
  assertUsable(e) {
    if (this._disposed)
      throw new l(`[gpu-device-api] ${e}: buffer "${this.label}" has been destroyed.`);
    if (this.device.disposed)
      throw new l(
        `[gpu-device-api] ${e}: buffer "${this.label}" belongs to a disposed device.`
      );
  }
  assertRange(e, r, n) {
    if (Ve(e, `${n} offset`), ge(r, `${n} size`), e + r > this.size)
      throw new l(
        `[gpu-device-api] ${n}: range [${e}, ${e + r}) exceeds buffer "${this.label}" size ${this.size}.`
      );
  }
}
function Vl(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function F(t, e) {
  if (t instanceof Vr) return t.native;
  if (Vl(t)) return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), got ${X(t)}.`
  );
}
function X(t) {
  if (t === null) return "null";
  if (t === void 0) return "undefined";
  if (typeof t == "object") {
    const e = t.label;
    return typeof e == "string" && e.length > 0 ? `a resource labelled "${e}"` : `an instance of ${t.constructor?.name ?? "Object"}`;
  }
  return `${typeof t} ${String(t)}`;
}
class xt {
  label;
  texture;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, r = {}) {
    this.texture = e;
    const n = ht(e, r);
    this.label = r.label ?? `${e.label}#view`;
    const i = n.aspect;
    if (il(e.format, i, `Texture "${e.label}".createView`), n.baseMipLevel + n.mipLevelCount > e.mipLevelCount)
      throw new l(
        `[gpu-device-api] Texture "${e.label}".createView: mip range [${n.baseMipLevel}, ${n.baseMipLevel + n.mipLevelCount}) exceeds mipLevelCount ${e.mipLevelCount}.`
      );
    if (n.baseArrayLayer + n.arrayLayerCount > e.depthOrArrayLayers)
      throw new l(
        `[gpu-device-api] Texture "${e.label}".createView: array layer range [${n.baseArrayLayer}, ${n.baseArrayLayer + n.arrayLayerCount}) exceeds depthOrArrayLayers ${e.depthOrArrayLayers}.`
      );
    if (n.dimension === "cube" || n.dimension === "cube-array") {
      if (n.arrayLayerCount % 6 !== 0)
        throw new l(
          `[gpu-device-api] Texture "${e.label}".createView: a "${n.dimension}" view needs a multiple of 6 array layers, got ${n.arrayLayerCount}.`
        );
      if (e.width !== e.height)
        throw new l(
          `[gpu-device-api] Texture "${e.label}".createView: a "${n.dimension}" view needs a square texture, got ${e.width}x${e.height}.`
        );
    }
    this.descriptor = n;
    let s;
    if (n.format !== void 0 && (s = z(n.format), n.format !== e.format && !e.viewFormats.includes(n.format)))
      throw new l(
        `[gpu-device-api] Texture "${e.label}".createView: view format "${n.format}" was not listed in the texture's viewFormats (${e.viewFormats.join(", ") || "none"}).`
      );
    this.native = e.native.createView({
      label: this.label,
      format: s,
      dimension: ut(n.dimension),
      aspect: yt(n.aspect),
      baseMipLevel: n.baseMipLevel,
      mipLevelCount: n.mipLevelCount,
      baseArrayLayer: n.baseArrayLayer,
      arrayLayerCount: n.arrayLayerCount
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
function Nr(t) {
  return t instanceof xt;
}
function Nl(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function me(t, e) {
  if (t instanceof xt) return t.native;
  if (Nl(t)) return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${X(t)}.`
  );
}
class re {
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
  constructor(e, r, n, i) {
    this.device = e, this.owned = i, this.native = r, this.label = n.label, this.extent = n.size, this.dimension = n.dimension, this.format = n.format, this.usage = n.usage, this.mipLevelCount = n.mipLevelCount, this.sampleCount = n.sampleCount, this.viewFormats = n.viewFormats, this.width = n.size.width, this.height = n.size.height, this.depthOrArrayLayers = n.size.depthOrArrayLayers;
  }
  /**
   * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
   *
   * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
   */
  static create(e, r) {
    const n = dt(r.size), i = {
      label: r.label ?? `texture#${e.nextResourceId("texture")}`,
      size: n,
      mipLevelCount: r.mipLevelCount ?? 1,
      sampleCount: r.sampleCount ?? 1,
      dimension: r.dimension ?? "2d",
      format: r.format,
      usage: r.usage,
      viewFormats: r.viewFormats ?? []
    };
    Wl(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: n.width, height: n.height, depthOrArrayLayers: n.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: z(i.format),
      usage: Mr(i.usage),
      viewFormats: i.viewFormats.map((a) => z(a))
    });
    return new re(e, s, i, !0);
  }
  /**
   * 包住一个已经存在的原生 `GPUTexture`（例如 canvas 的帧纹理）。
   *
   * `owned` 为 `false` 时 `destroy()` 只标记本包装对象失效，不会销毁底层 texture。
   * 未提供的字段会直接从原生对象读取（canvas 帧纹理的尺寸/格式只能这样拿到）。
   */
  static adopt(e, r, n = {}, i = {}) {
    const s = n.size ?? {
      width: r.width,
      height: r.height,
      depthOrArrayLayers: r.depthOrArrayLayers
    }, a = {
      label: n.label ?? (r.label.length > 0 ? r.label : "canvas-texture"),
      size: s,
      mipLevelCount: n.mipLevelCount ?? r.mipLevelCount,
      sampleCount: n.sampleCount ?? r.sampleCount,
      dimension: n.dimension ?? r.dimension,
      format: n.format ?? Jo(r.format),
      usage: n.usage ?? r.usage,
      viewFormats: n.viewFormats ?? []
    };
    return new re(e, r, a, i.owned ?? !1);
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
      throw new l(
        `[gpu-device-api] Texture.createView: texture "${this.label}" has been destroyed.`
      );
    const r = kl(ht(this, e)), n = this.viewCache.get(r);
    if (n) return n;
    const i = new xt(this, e);
    return this.viewCache.set(r, i), this.viewList.push(i), i;
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
function kl(t) {
  return ur(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect
  );
}
function Wl(t, e) {
  const { width: r, height: n, depthOrArrayLayers: i } = t.size;
  if (!Number.isInteger(r) || r <= 0 || !Number.isInteger(n) || n <= 0)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": width and height must be positive integers, got ${r}x${n}.`
    );
  if (!Number.isInteger(i) || i <= 0)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers must be a positive integer, got ${String(i)}.`
    );
  if (!Number.isInteger(t.mipLevelCount) || t.mipLevelCount <= 0)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount must be a positive integer.`
    );
  const s = un(t.size);
  if (t.mipLevelCount > s)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount ${t.mipLevelCount} is more than the maximum ${s} for a ${r}x${n}x${i} texture.`
    );
  if (t.dimension === "1d" && n !== 1)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture must have height 1, got ${n}.`
    );
  if (t.dimension === "1d" && t.sampleCount > 1)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture cannot be multisampled.`
    );
  const a = t.dimension === "1d" ? e.limits.maxTextureDimension1D : t.dimension === "3d" ? e.limits.maxTextureDimension3D : e.limits.maxTextureDimension2D;
  if (r > a || n > a || i > a)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": ${r}x${n}x${i} exceeds the ${t.dimension} limit ${a}.`
    );
  if (t.dimension === "2d" && i > e.limits.maxTextureArrayLayers)
    throw new l(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers ${i} exceeds maxTextureArrayLayers ${e.limits.maxTextureArrayLayers}.`
    );
  sl(
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
    const u = (c) => c.replace("-srgb", "");
    if (u(o) !== u(t.format))
      throw new l(
        `[gpu-device-api] Texture "${t.label}": viewFormat "${o}" is not compatible with format "${t.format}" (WebGPU only allows srgb <-> non-srgb reinterpretation).`
      );
  }
}
function Yt(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function kr(t, e) {
  if (t instanceof re) return t.native;
  if (Yt(t)) return t;
  const r = t?.native;
  if (r !== void 0 && Yt(r)) return r;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${X(t)}.`
  );
}
class Tt {
  label;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, r = {}) {
    this.label = r.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const n = ir(r);
    if (!Number.isFinite(n.lodMinClamp) || !Number.isFinite(n.lodMaxClamp))
      throw new l(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp/lodMaxClamp must be finite numbers.`
      );
    if (n.lodMinClamp < 0)
      throw new l(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp must not be negative, got ${n.lodMinClamp}.`
      );
    if (n.lodMaxClamp < n.lodMinClamp)
      throw new l(
        `[gpu-device-api] Sampler "${this.label}": lodMaxClamp (${n.lodMaxClamp}) must be >= lodMinClamp (${n.lodMinClamp}).`
      );
    if (!Number.isFinite(n.maxAnisotropy) || n.maxAnisotropy < 1)
      throw new l(
        `[gpu-device-api] Sampler "${this.label}": maxAnisotropy must be >= 1, got ${String(n.maxAnisotropy)}.`
      );
    this.descriptor = n;
    const i = {
      label: this.label,
      addressModeU: Ze(n.addressModeU),
      addressModeV: Ze(n.addressModeV),
      addressModeW: Ze(n.addressModeW),
      magFilter: jt(n.magFilter),
      minFilter: jt(n.minFilter),
      mipmapFilter: Tl(n.mipmapFilter),
      lodMinClamp: n.lodMinClamp,
      lodMaxClamp: n.lodMaxClamp,
      maxAnisotropy: n.maxAnisotropy
    };
    n.compare !== void 0 && (i.compare = vt(n.compare)), this.native = e.native.createSampler(i);
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
function zl(t) {
  return t instanceof Tt;
}
function ql(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function jl(t, e) {
  if (t instanceof Tt) return t.native;
  if (ql(t)) return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class Wr {
  label;
  source;
  defines;
  device;
  modulesByStage = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? `shader#${e.nextResourceId("shader")}`, this.source = sr(r.code), this.defines = { ...r.defines ?? {} }, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
      throw new l(
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
    return ot({
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
      throw new l(
        `[gpu-device-api] ShaderModule "${this.label}" has been disposed; it can no longer be compiled.`
      );
    if (this.device.disposed)
      throw new l(
        `[gpu-device-api] ShaderModule "${this.label}" belongs to a disposed device.`
      );
    const r = this.modulesByStage.get(e);
    if (r) return r;
    const n = this.modulesByStage.values().next();
    if (!n.done)
      return this.modulesByStage.set(e, n.value), n.value;
    const i = this.finalSource(e), s = this.device.native.createShaderModule({ label: this.label, code: i });
    return this.modulesByStage.set(e, s), s;
  }
  /** GPUShaderModule 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0, this.modulesByStage.clear();
  }
}
function ct(t, e) {
  if (t instanceof Wr) return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${X(t)}.`
  );
}
const Ht = "timestamp-query";
class zr {
  label;
  type;
  count;
  native;
  _disposed = !1;
  constructor(e, r) {
    if (this.label = r.label ?? `querySet#${e.nextResourceId("querySet")}`, !Number.isInteger(r.count) || r.count <= 0)
      throw new l(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(r.count)}.`
      );
    if (r.type === at.Timestamp && !e.features.has(Ht))
      throw new l(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${Ht}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    this.type = r.type, this.count = r.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: Ll(r.type),
      count: r.count
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
function qr(t, e) {
  if (t instanceof zr) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const r = t;
    if (typeof r.destroy == "function" && typeof r.count == "number")
      return t;
  }
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
class jr {
  label;
  entries;
  sortedEntries;
  native;
  byBinding;
  _disposed = !1;
  constructor(e, r) {
    this.label = r.label ?? `bindGroupLayout#${e.nextResourceId("bindGroupLayout")}`;
    let n;
    try {
      n = ar(r.entries);
    } catch (s) {
      throw new l(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = n, this.entries = r.entries, this.byBinding = new Map(n.map((s) => [s.binding, s]));
    const i = n.map(
      (s) => Xl(s, e, this.label)
    );
    if (i.length > e.limits.maxBindingsPerBindGroup)
      throw new l(
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
function Xl(t, e, r) {
  const n = `BindGroupLayout "${r}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: ml(t.visibility)
  };
  if (rr(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new l(
        `[gpu-device-api] ${n}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: _l(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (nr(t.type)) {
    const s = t.sampler ?? {}, a = Bl(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : Fl(s.type)
    }, i;
  }
  if (t.type === M.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new l(
        `[gpu-device-api] ${n}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: Cl(a),
      viewDimension: ut(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === M.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new l(
        `[gpu-device-api] ${n}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return Gr(s.format, e.features, n), i.storageTexture = {
      access: Pl(s.access ?? "write-only"),
      format: z(s.format),
      viewDimension: ut(s.viewDimension ?? "2d")
    }, i;
  }
  throw new l(
    `[gpu-device-api] ${n}: unsupported BindingType "${String(t.type)}".`
  );
}
function Xr(t, e) {
  if (t instanceof jr) return t.native;
  if (Yl(t)) return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function Yl(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class Yr {
  label;
  layout;
  entries;
  native;
  byBinding;
  _disposed = !1;
  constructor(e, r) {
    this.label = r.label ?? `bindGroup#${e.nextResourceId("bindGroup")}`, this.layout = r.layout, this.entries = r.entries, this.byBinding = new Map(r.entries.map((s) => [s.binding, s]));
    for (const s of r.entries)
      if (!this.layout.entry(s.binding))
        throw new l(
          `[gpu-device-api] BindGroup "${this.label}": binding ${s.binding} is not declared by layout "${this.layout.label}".`
        );
    const n = Xr(this.layout, `BindGroup "${this.label}"`), i = r.entries.map(
      (s) => Hl(s, this.layout, e, this.label)
    );
    this.native = e.native.createBindGroup({
      label: this.label,
      layout: n,
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
function Hl(t, e, r, n) {
  const i = `BindGroup "${n}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new l(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (rr(s.type)) {
    if (!("buffer" in a))
      throw new l(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${X(a)}.`
      );
    const o = F(a.buffer, i), u = a.offset ?? 0, c = a.size ?? a.buffer.size - u;
    if (!Number.isInteger(u) || u < 0)
      throw new l(`[gpu-device-api] ${i}: offset must be a non-negative integer.`);
    if (!Number.isInteger(c) || c < 0)
      throw new l(`[gpu-device-api] ${i}: size must be a non-negative integer.`);
    if (u + c > a.buffer.size)
      throw new l(
        `[gpu-device-api] ${i}: binding range [${u}, ${u + c}) exceeds the buffer size ${a.buffer.size}.`
      );
    const d = s.buffer?.minBindingSize ?? 0;
    if (d > 0 && c < d)
      throw new l(
        `[gpu-device-api] ${i}: layout requires minBindingSize ${d}, got ${c}.`
      );
    const h = { buffer: o, offset: u, size: c };
    return { binding: t.binding, resource: h };
  }
  if (nr(s.type)) {
    if (!("sampler" in a))
      throw new l(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${X(a)}.`
      );
    const o = a.sampler, u = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (zl(o)) {
      if (u && !o.isComparison)
        throw new l(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!u && o.isComparison)
        throw new l(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: jl(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new l(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${X(a)}.`
      );
    return Kl(a.view, s, r, i), { binding: t.binding, resource: me(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new l(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${X(a)}.`
      );
    if (Nr(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && z(a.view.format) !== z(o))
        throw new l(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: me(a.view, i) };
  }
  if ("source" in a)
    return { binding: t.binding, resource: a.source };
  throw new l(
    `[gpu-device-api] ${i}: unsupported binding resource ${X(a)}.`
  );
}
function Kl(t, e, r, n) {
  if (!Nr(t)) return;
  const i = e.texture ?? {}, s = t.format, a = ie(s), o = i.sampleType ?? "float";
  if (o === "depth") {
    if (a.sampleScalar !== "depth")
      throw new l(
        `[gpu-device-api] ${n}: layout expects a depth texture, but the bound view has format "${s}".`
      );
  } else if (o === "uint" || o === "sint") {
    if (a.sampleScalar !== o)
      throw new l(
        `[gpu-device-api] ${n}: layout expects a "${o}" sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
  } else {
    if (a.sampleScalar !== "float")
      throw new l(
        `[gpu-device-api] ${n}: layout expects a float sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
    if (o === "float" && !el(s, r.features))
      throw new l(
        `[gpu-device-api] ${n}: layout declares sampleType "float" (filterable), but "${s}" is not filterable on this device; declare "unfilterable-float" or enable the required feature.`
      );
  }
  const u = t.texture.sampleCount > 1;
  if ((i.multisampled ?? !1) !== u)
    throw new l(
      `[gpu-device-api] ${n}: layout declares multisampled=${String(i.multisampled ?? !1)}, but the bound texture has sampleCount ${t.texture.sampleCount}.`
    );
  const c = i.viewDimension ?? "2d";
  if (c !== t.descriptor.dimension)
    throw new l(
      `[gpu-device-api] ${n}: layout declares viewDimension "${c}", but the bound view is "${t.descriptor.dimension}".`
    );
}
function Hr(t, e, r, n) {
  const i = t.layout.sortedEntries.filter((s) => s.buffer?.hasDynamicOffset === !0);
  if (i.length === 0) {
    if (e && e.length > 0)
      throw new l(
        `[gpu-device-api] ${n}: bind group "${t.label}" has no entry with hasDynamicOffset, but ${e.length} dynamic offset(s) were supplied.`
      );
    return;
  }
  if (!e || e.length !== i.length)
    throw new l(
      `[gpu-device-api] ${n}: bind group "${t.label}" needs ${i.length} dynamic offset(s) (declaration order of the entries with hasDynamicOffset), got ${e ? e.length : 0}.`
    );
  for (let s = 0; s < i.length; s++) {
    const a = i[s], o = e[s], u = a.type === "uniform" ? r.limits.minUniformBufferOffsetAlignment : r.limits.minStorageBufferOffsetAlignment;
    if (!Number.isInteger(o) || o < 0)
      throw new l(
        `[gpu-device-api] ${n}: dynamic offset #${s} must be a non-negative integer, got ${String(o)}.`
      );
    if (o % u !== 0)
      throw new l(
        `[gpu-device-api] ${n}: dynamic offset #${s} (${o}) must be a multiple of ${u} (${a.type === "uniform" ? "minUniformBufferOffsetAlignment" : "minStorageBufferOffsetAlignment"}).`
      );
  }
}
function Kr(t, e) {
  if (t instanceof Yr) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class be {
  label;
  bindGroupLayouts;
  /** `'auto'` 时为字符串 `'auto'`，否则为 `GPUPipelineLayout`。 */
  native;
  isAuto;
  _disposed = !1;
  constructor(e, r, n, i) {
    this.label = e, this.bindGroupLayouts = r, this.native = n, this.isAuto = i;
  }
  /** 创建显式 layout。 */
  static create(e, r) {
    const n = r.label ?? `pipelineLayout#${e.nextResourceId("pipelineLayout")}`;
    if (r.bindGroupLayouts.length > e.limits.maxBindGroups)
      throw new l(
        `[gpu-device-api] PipelineLayout "${n}": ${r.bindGroupLayouts.length} bind group layouts exceed maxBindGroups (${e.limits.maxBindGroups}).`
      );
    const i = e.native.createPipelineLayout({
      label: n,
      bindGroupLayouts: r.bindGroupLayouts.map(
        (s) => Xr(s, `PipelineLayout "${n}"`)
      )
    });
    return new be(n, r.bindGroupLayouts, i, !1);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new be(e, [], "auto", !0);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function Qr(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof be) return t.native;
  const r = t.native;
  if (r === "auto") return "auto";
  if (r && typeof r == "object") return r;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const Ql = "uint32";
class te {
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
  static toGPUPrimitiveState(e, r) {
    const n = e?.topology ?? We.topology, i = {
      topology: vl(n),
      frontFace: $l(e?.frontFace ?? We.frontFace),
      cullMode: Sl(e?.cullMode ?? We.cullMode)
    };
    if (yl(n))
      i.stripIndexFormat = Or(e?.stripIndexFormat ?? Ql);
    else if (e?.stripIndexFormat !== void 0)
      throw new l(
        `[gpu-device-api] PrimitiveState.stripIndexFormat is only valid for strip topologies, but the topology is "${n}".`
      );
    if (e?.unclippedDepth) {
      if (r && !r.has("depth-clip-control"))
        throw new l(
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
  static toGPUDepthStencilState(e, r) {
    const n = Rr(e), i = ke(e);
    if (!n && !i)
      throw new l(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: z(e) };
    return n && (s.depthWriteEnabled = r?.depthWriteEnabled ?? $t.depthWriteEnabled, s.depthCompare = vt(r?.depthCompare ?? $t.depthCompare)), i && (s.stencilFront = Qt(r?.stencilFront), s.stencilBack = Qt(r?.stencilBack), s.stencilReadMask = r?.stencilReadMask ?? 4294967295, s.stencilWriteMask = r?.stencilWriteMask ?? 4294967295), r?.depthBias !== void 0 && (s.depthBias = r.depthBias), r?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = r.depthBiasSlopeScale), r?.depthBiasClamp !== void 0 && (s.depthBiasClamp = r.depthBiasClamp), s;
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, r) {
    const n = we(e?.count ?? r, "MultisampleState.count"), i = { count: n, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
    if (s && n === 1)
      throw new l(
        "[gpu-device-api] MultisampleState.alphaToCoverageEnabled requires sampleCount > 1."
      );
    return s && (i.alphaToCoverageEnabled = !0), i;
  }
  /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
  static toGPUBlendState(e) {
    if (e)
      return {
        color: Kt(e.color),
        alpha: Kt(e.alpha)
      };
  }
  /**
   * 组合出 `GPUFragmentState.targets`。
   *
   * `formats` 来自当前 variant（render target），`targets` 来自 pipeline descriptor；
   * 两者长度不一致时直接报错，因为那必然是用户的疏忽（WebGPU 的报错更难读）。
   */
  static toGPUColorTargets(e, r, n = {}) {
    if (r && r.length !== e.length)
      throw new l(
        `[gpu-device-api] RenderPipeline: fragment.targets has ${r.length} entries but the render target has ${e.length} color attachments.`
      );
    return e.map((i, s) => {
      const a = r ? r[s] : void 0;
      if (a === null) return null;
      const o = { format: z(a?.format ?? i) }, u = a?.blend ?? n.blend;
      u && (o.blend = te.toGPUBlendState(u));
      const c = a?.writeMask ?? n.writeMask;
      return c !== void 0 && (o.writeMask = gl(c)), o;
    });
  }
  /** 校验并翻译 vertex buffer layout 列表。 */
  static toGPUVertexBufferLayouts(e, r) {
    if (e.length > r.maxVertexBuffers)
      throw new l(
        `[gpu-device-api] RenderPipeline: ${e.length} vertex buffer layouts exceed maxVertexBuffers (${r.maxVertexBuffers}).`
      );
    return e.map((n) => {
      try {
        or(n, r);
      } catch (i) {
        throw new l(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: n.arrayStride,
        stepMode: Al(n.stepMode ?? "vertex"),
        attributes: n.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: El(i.format)
        }))
      };
    });
  }
}
function Kt(t) {
  const e = { ...cn, ...t };
  return {
    operation: xl(e.operation ?? "add"),
    srcFactor: qt(e.srcFactor),
    dstFactor: qt(e.dstFactor)
  };
}
function Qt(t) {
  return {
    compare: vt(t?.compare ?? Se.compare),
    failOp: Qe(t?.failOp ?? Se.failOp),
    depthFailOp: Qe(t?.depthFailOp ?? Se.depthFailOp),
    passOp: Qe(t?.passOp ?? Se.passOp)
  };
}
class Zl {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, r) {
    this.cache = hn(e, (n, i) => {
      this.created.delete(i), r?.(n, i);
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
  set(e, r) {
    return this.created.add(e), this.cache.set(e, r);
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
  resolve(e, r) {
    const n = this.cache.get(e);
    if (n !== void 0) return n;
    const i = r();
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
function Zt(t) {
  return ur(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    lr(t.vertexLayouts)
  );
}
const Jl = "vsMain", eu = "fsMain";
class Zr {
  label;
  descriptor;
  layout;
  vertexLayouts;
  device;
  cache;
  logger;
  _disposed = !1;
  warnedMissingVertexLayouts = !1;
  constructor(e, r) {
    this.device = e, this.descriptor = r, this.label = r.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`, this.layout = r.layout ?? "auto", this.vertexLayouts = r.vertex.buffers ?? null, this.logger = Ne(`webgpu:${this.label}`), this.cache = new Zl(64, (n, i) => {
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
      throw new l(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`
      );
    const r = this.resolveVariant(e);
    return this.cache.resolve(Zt(r), () => this.createNative(r));
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
    const r = this.descriptor, n = e.colorFormats ?? this.defaultColorFormats(), i = we(
      e.sampleCount ?? r.multisample?.count ?? r.render?.multisample?.count ?? 1,
      `RenderPipeline "${this.label}": sampleCount`
    ), s = e.depthFormat !== void 0 ? e.depthFormat : r.depthStencil?.format ?? null, a = e.vertexLayouts ?? r.vertex.buffers ?? [];
    if (r.fragment && n.length === 0)
      throw new l(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. Declare \`colorFormats\` on the descriptor, or pass them per target via resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.`
      );
    if (!r.fragment && !r.depthStencil?.format && s === null)
      throw new l(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depth format; WebGPU cannot create a pipeline that writes to nothing.`
      );
    a.length === 0 && !this.warnedMissingVertexLayouts && (this.warnedMissingVertexLayouts = !0, this.logger.debug(
      "building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes"
    ));
    for (const o of n)
      z(o);
    return s !== null && z(s), { colorFormats: n, sampleCount: i, depthFormat: s, vertexLayouts: a };
  }
  defaultColorFormats() {
    const { descriptor: e } = this;
    if (e.colorFormats) return e.colorFormats;
    if (e.render?.colorFormats) return e.render.colorFormats;
    const r = e.fragment?.targets;
    if (!r) return [];
    const n = [];
    for (const i of r) {
      if (i?.format === void 0) return [];
      n.push(i.format);
    }
    return n;
  }
  createNative(e) {
    const r = this.toGPURenderPipelineDescriptor(e);
    return this.logger.debug(`creating render pipeline variant ${Zt(e)}`), this.device.native.createRenderPipeline(r);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const r = this.descriptor, n = this.device.limits, i = r.vertex, a = {
      module: ct(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(D.Vertex),
      entryPoint: i.entryPoint ?? Jl,
      buffers: te.toGPUVertexBufferLayouts(e.vertexLayouts, n)
    }, o = r.fragment;
    let u;
    o && (u = {
      module: ct(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(D.Fragment),
      entryPoint: o.entryPoint ?? eu,
      targets: te.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: r.render?.blend,
        writeMask: r.render?.writeMask
      })
    });
    const c = r.primitive ?? r.render?.primitive, d = r.depthStencil ?? r.render?.depthStencil, h = r.multisample ?? r.render?.multisample, f = e.depthFormat, p = {
      label: this.label,
      layout: Qr(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: te.toGPUPrimitiveState(c, this.device.features),
      multisample: te.toGPUMultisampleState(h, e.sampleCount)
    };
    return u && (p.fragment = u), f !== null ? p.depthStencil = te.toGPUDepthStencilState(f, d) : d && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), p;
  }
}
function tu(t, e, r) {
  if (t instanceof Zr) return t.resolve(r);
  const n = t?.native;
  if (n && typeof n == "object" && typeof n.getBindGroupLayout == "function")
    return n;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const ru = "csMain";
class Jr {
  label;
  descriptor;
  layout;
  device;
  _native = null;
  _disposed = !1;
  constructor(e, r) {
    this.device = e, this.descriptor = r, this.label = r.label ?? `computePipeline#${e.nextResourceId("computePipeline")}`, this.layout = r.layout ?? "auto";
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
      throw new l(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
    if (this._native) return this._native;
    const e = ct(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    );
    return this._native = this.device.native.createComputePipeline({
      label: this.label,
      layout: Qr(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(D.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? ru
      }
    }), this._native;
  }
  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose() {
    this._disposed || (this._disposed = !0, this._native = null);
  }
}
function nu(t, e) {
  if (t instanceof Jr) return t.resolve();
  const r = t?.native;
  if (r && typeof r == "object") return r;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const iu = [0, 0, 0, 1];
class en {
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
  constructor(e, r) {
    this.device = e, this.label = r.label ?? `renderTarget#${e.nextResourceId("renderTarget")}`;
    const n = su(r.color);
    if (this.colorFormatsList = n, this.depthFormatValue = r.depth === void 0 || r.depth === !1 || r.depth === null ? null : r.depth === !0 ? "depth24plus" : r.depth, this.sampleCountValue = we(r.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = r.mipLevelCount ?? 1, this.baseUsage = r.usage ?? 0, this.sampled = r.sampled ?? !1, this._width = Fe(r.width, "width", this.label), this._height = Fe(r.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new l(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new l(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !nn(this.depthFormatValue))
      throw new l(
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
  resize(e, r) {
    if (this._disposed)
      throw new l(`[gpu-device-api] RenderTarget "${this.label}" has been disposed.`);
    const n = Fe(e, "width", this.label), i = Fe(r, "height", this.label);
    return n === this._width && i === this._height ? !1 : (this._width = n, this._height = i, this.rebuild(), !0);
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
    this.colorTextures = this.colorFormatsList.map((r, n) => {
      const i = this.sampled ? v.TextureBinding : v.None;
      return this.device.createTexture({
        label: `${this.label}#color${n}`,
        size: e,
        format: r,
        usage: v.RenderAttachment | i | this.baseUsage,
        mipLevelCount: this.mipLevelCountValue
      });
    }), this.colorViews = this.colorTextures.map((r) => r.createView({ label: `${r.label}#view` })), this.sampleCountValue > 1 && (this.multisampleTextureList = this.colorFormatsList.map(
      (r, n) => this.device.createTexture({
        label: `${this.label}#msaa${n}`,
        size: e,
        format: r,
        usage: v.RenderAttachment,
        sampleCount: this.sampleCountValue
      })
    ), this.multisampleViews = this.multisampleTextureList.map(
      (r) => r.createView({ label: `${r.label}#view` })
    )), this.depthFormatValue !== null && (this.depthTexture = this.device.createTexture({
      label: `${this.label}#depth`,
      size: e,
      format: this.depthFormatValue,
      usage: v.RenderAttachment | this.baseUsage,
      sampleCount: this.sampleCountValue
    }), this.depthView = this.depthTexture.createView({ label: `${this.depthTexture.label}#view` }));
  }
  releaseTextures() {
    for (const e of this.colorTextures) e.destroy();
    for (const e of this.multisampleTextureList) e.destroy();
    this.depthTexture?.destroy(), this.colorTextures = [], this.colorViews = [], this.multisampleTextureList = [], this.multisampleViews = [], this.depthTexture = null, this.depthView = null;
  }
  buildAttachments(e, r, n) {
    const i = n === void 0 ? iu : n;
    return this.colorFormatsList.map((s, a) => {
      const o = this.multisampleViews[a], u = this.colorViews[a], c = {
        view: o ?? u,
        loadOp: e ?? "clear",
        storeOp: r ?? "store",
        clearValue: i
      };
      return o && (c.resolveTarget = u), c;
    });
  }
  buildDepthAttachment(e, r) {
    if (!this.depthView || this.depthFormatValue === null) return null;
    const n = {
      view: this.depthView,
      depthLoadOp: e ?? "clear",
      depthStoreOp: "store",
      depthClearValue: r ?? 1,
      depthReadOnly: !1
    };
    return ke(this.depthFormatValue) && (n.stencilLoadOp = e ?? "clear", n.stencilStoreOp = "store", n.stencilClearValue = 0, n.stencilReadOnly = !1), n;
  }
}
function su(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function Fe(t, e, r) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new l(
      `[gpu-device-api] RenderTarget "${r}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function au(t) {
  const e = t.label ?? "renderPass";
  let r, n;
  if (t.target) {
    if (!(t.target instanceof en))
      throw new l(
        `[gpu-device-api] ${e}: descriptor.target must be a WebGPURenderTarget created by a WebGPU device.`
      );
    const c = t.target.createPassDescriptor({
      clearValue: t.clearValue,
      depthClearValue: t.depthClearValue
    });
    r = c.colorAttachments, n = c.depthStencilAttachment;
  } else
    r = t.colorAttachments, n = t.depthStencilAttachment ?? null;
  const i = [], s = [], a = [];
  for (const c of r) {
    if (!c) {
      s.push(null);
      continue;
    }
    const d = me(c.view, `${e}.colorAttachments`), h = c.view.texture;
    i.push(c.view.descriptor.format ?? h.format), a.push(h.sampleCount);
    const f = c.loadOp ?? "clear", p = c.storeOp ?? "store";
    if (h.sampleCount > 1 && !c.resolveTarget && p !== "discard")
      throw new l(
        `[gpu-device-api] ${e}: a multisampled color attachment (sampleCount ${h.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const m = {
      view: d,
      loadOp: Je(f),
      storeOp: et(p)
    };
    c.resolveTarget && (m.resolveTarget = me(c.resolveTarget, `${e}.resolveTarget`)), f === "clear" && (m.clearValue = Dr(c.clearValue)), s.push(m);
  }
  const o = { label: e, colorAttachments: s };
  let u = null;
  if (n) {
    const c = me(n.view, `${e}.depthStencilAttachment`), d = n.view.descriptor.format ?? n.view.texture.format;
    u = d, a.push(n.view.texture.sampleCount);
    const h = { view: c }, f = n.depthLoadOp ?? "clear", p = n.depthStoreOp ?? "store";
    if (h.depthLoadOp = Je(f), h.depthStoreOp = et(p), f === "clear" && (h.depthClearValue = lu(n.depthClearValue ?? 1, e)), n.depthReadOnly !== void 0 && (h.depthReadOnly = n.depthReadOnly), ke(d)) {
      const m = n.stencilLoadOp ?? f;
      h.stencilLoadOp = Je(m), h.stencilStoreOp = et(n.stencilStoreOp ?? "store"), m === "clear" && (h.stencilClearValue = n.stencilClearValue ?? 0), n.stencilReadOnly !== void 0 && (h.stencilReadOnly = n.stencilReadOnly);
    } else if (n.stencilLoadOp !== void 0 || n.stencilStoreOp !== void 0)
      throw new l(
        `[gpu-device-api] ${e}: depth format "${d}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    o.depthStencilAttachment = h;
  }
  return t.occlusionQuerySet && (o.occlusionQuerySet = qr(t.occlusionQuerySet, `${e}.occlusionQuerySet`)), {
    native: o,
    layout: {
      colorFormats: i,
      depthFormat: u,
      sampleCount: ou(a, e)
    }
  };
}
function ou(t, e) {
  if (t.length === 0) return 1;
  const r = t[0];
  for (const n of t)
    if (n !== r)
      throw new l(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return r;
}
function lu(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new l(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class uu {
  label;
  layout;
  native;
  device;
  onEnd;
  _ended = !1;
  constructor(e, r, n, i, s) {
    this.device = e, this.native = r, this.layout = n, this.label = i, this.onEnd = s;
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(
      tu(e, `RenderPass "${this.label}".setPipeline`, {
        colorFormats: this.layout.colorFormats,
        sampleCount: this.layout.sampleCount,
        depthFormat: this.layout.depthFormat
      })
    );
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), r) {
      Hr(r, n, this.device, `RenderPass "${this.label}".setBindGroup`), this.native.setBindGroup(e, Kr(r, `RenderPass "${this.label}".setBindGroup`));
      return;
    }
    if (n && n.length > 0)
      throw new l(
        `[gpu-device-api] RenderPass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  setVertexBuffer(e, r, n, i) {
    if (this.assertOpen("setVertexBuffer"), r === null) {
      this.native.setVertexBuffer(e, null, n, i);
      return;
    }
    this.native.setVertexBuffer(e, F(r, `RenderPass "${this.label}".setVertexBuffer`), n, i);
  }
  setIndexBuffer(e, r, n, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      F(e, `RenderPass "${this.label}".setIndexBuffer`),
      Or(r),
      n,
      i
    );
  }
  setViewport(e, r, n, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), this.native.setViewport(e, r, n, i, s, a);
  }
  setScissorRect(e, r, n, i) {
    this.assertOpen("setScissorRect"), this.native.setScissorRect(e, r, n, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(Dr(e));
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
  drawIndirect(e, r = 0) {
    this.assertOpen("drawIndirect");
    const n = Jt(e, r, `RenderPass "${this.label}".drawIndirect`);
    this.native.drawIndirect(n.buffer, n.offset);
  }
  drawIndexedIndirect(e, r = 0) {
    this.assertOpen("drawIndexedIndirect");
    const n = Jt(e, r, `RenderPass "${this.label}".drawIndexedIndirect`);
    this.native.drawIndexedIndirect(n.buffer, n.offset);
  }
  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end() {
    this._ended || (this._ended = !0, this.native.end(), this.onEnd?.());
  }
  assertOpen(e) {
    if (this._ended)
      throw new l(
        `[gpu-device-api] RenderPass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
function Jt(t, e, r) {
  return "indirectBuffer" in t ? {
    buffer: F(t.indirectBuffer, r),
    offset: t.indirectOffset ?? 0
  } : { buffer: F(t, r), offset: e };
}
function cu(t) {
  const e = t?.label ?? "computePass", r = { label: e };
  if (t?.timestampWrites) {
    const n = t.timestampWrites;
    r.timestampWrites = {
      querySet: qr(n.querySet, `${e}.timestampWrites.querySet`),
      beginningOfPassWriteIndex: n.beginningOfPassWriteIndex,
      endOfPassWriteIndex: n.endOfPassWriteIndex
    };
  }
  return r;
}
class du {
  label;
  native;
  device;
  onEnd;
  _ended = !1;
  constructor(e, r, n, i) {
    this.device = e, this.native = r, this.label = n, this.onEnd = i;
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(nu(e, `ComputePass "${this.label}".setPipeline`));
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), r) {
      Hr(r, n, this.device, `ComputePass "${this.label}".setBindGroup`), this.native.setBindGroup(e, Kr(r, `ComputePass "${this.label}".setBindGroup`));
      return;
    }
    if (n && n.length > 0)
      throw new l(
        `[gpu-device-api] ComputePass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  dispatchWorkgroups(e, r = 1, n = 1) {
    this.assertOpen("dispatchWorkgroups"), this.native.dispatchWorkgroups(e, r, n);
  }
  dispatchWorkgroupsIndirect(e, r = 0) {
    this.assertOpen("dispatchWorkgroupsIndirect");
    const n = `ComputePass "${this.label}".dispatchWorkgroupsIndirect`;
    if ("indirectBuffer" in e) {
      this.native.dispatchWorkgroupsIndirect(
        F(e.indirectBuffer, n),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(F(e, n), r);
  }
  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end() {
    this._ended || (this._ended = !0, this.native.end(), this.onEnd?.());
  }
  assertOpen(e) {
    if (this._ended)
      throw new l(
        `[gpu-device-api] ComputePass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
class hu {
  label;
  native;
  device;
  /** 唯一可能处于打开状态的 pass（render 或 compute）。 */
  openPass = null;
  _finished = !1;
  _disposed = !1;
  constructor(e, r = {}) {
    this.device = e, this.label = r.label ?? `commandEncoder#${e.nextResourceId("commandEncoder")}`, this.native = e.native.createCommandEncoder({ label: this.label });
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
    const { native: r, layout: n } = au(e), i = e.label ?? this.label, s = new uu(
      this.device,
      this.native.beginRenderPass(r),
      n,
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
    const r = cu(e), n = e?.label ?? this.label, i = new du(
      this.device,
      this.native.beginComputePass(r),
      n,
      () => {
        this.openPass === i && (this.openPass = null);
      }
    );
    return this.openPass = i, i;
  }
  copyBufferToBuffer(e, r, n, i, s) {
    this.assertRecording("copyBufferToBuffer"), this.native.copyBufferToBuffer(
      F(e, `${this.label}.copyBufferToBuffer(source)`),
      r,
      F(n, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, r, n) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: F(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      Re(r, `${this.label}.copyBufferToTexture(destination)`),
      ce(n)
    );
  }
  copyTextureToBuffer(e, r, n) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      Re(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: F(r.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: r.offset ?? 0,
        bytesPerRow: r.bytesPerRow,
        rowsPerImage: r.rowsPerImage
      },
      ce(n)
    );
  }
  copyTextureToTexture(e, r, n) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      Re(e, `${this.label}.copyTextureToTexture(source)`),
      Re(r, `${this.label}.copyTextureToTexture(destination)`),
      ce(n)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, r = 0, n) {
    this.assertRecording("clearBuffer"), Ve(r, `${this.label}.clearBuffer offset`);
    const i = n ?? e.size - r;
    if (r % 4 !== 0)
      throw new l(
        `[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${r}.`
      );
    if (i <= 0)
      throw new l(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${i}.`
      );
    if (i % 4 !== 0)
      throw new l(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${i}.`
      );
    if (r + i > e.size)
      throw new l(
        `[gpu-device-api] ${this.label}.clearBuffer: range [${r}, ${r + i}) exceeds the buffer size ${e.size}.`
      );
    this.native.clearBuffer(
      F(e, `${this.label}.clearBuffer`),
      r,
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
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, new tn(this.label, this.native.finish());
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
      throw new l(`[gpu-device-api] CommandEncoder "${this.label}".${e}: already disposed.`);
    if (this._finished)
      throw new l(
        `[gpu-device-api] CommandEncoder "${this.label}".${e}: the encoder has already been finished.`
      );
  }
}
class tn {
  label;
  native;
  _disposed = !1;
  constructor(e, r) {
    this.label = e, this.native = r;
  }
  get disposed() {
    return this._disposed;
  }
  /** `GPUCommandBuffer` 没有 destroy；释放只是标记本包装对象不可用（提交后本身就不可复用）。 */
  dispose() {
    this._disposed = !0;
  }
}
function Re(t, e) {
  const r = {
    texture: kr(t.texture, e)
  };
  return t.mipLevel !== void 0 && (r.mipLevel = t.mipLevel), t.origin !== void 0 && (r.origin = Ir(t.origin)), t.aspect !== void 0 && (r.aspect = yt(t.aspect)), r;
}
function fu(t, e) {
  if (t instanceof tn) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new l(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${X(t)}.`
  );
}
class pu {
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
  constructor(e, r = {}) {
    this.canvas = e, this.options = r, this.pixelRatioValue = r.pixelRatio ?? dr(), this.formatValue = Wt(), this.usageValue = v.RenderAttachment | (r.copySrc ? v.CopySrc : v.None);
    const n = pe(e);
    this.widthValue = Math.max(1, Math.round(n.width * this.pixelRatioValue)), this.heightValue = Math.max(1, Math.round(n.height * this.pixelRatioValue));
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
      throw new l("[gpu-device-api] CanvasContext.configure: the context has been disposed.");
    if (!(e.device instanceof rn))
      throw new l(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const r = pl(this.canvas);
    if (!r)
      throw new l(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.gpuContext = r, this.currentDevice = e.device, this.formatValue = e.format ?? Wt(), this.usageValue = v.RenderAttachment | (e.usage ?? v.None) | (this.options.copySrc ? v.CopySrc : v.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace, this.sampleCountValue = we(
      e.sampleCount ?? e.device.defaultSampleCount,
      "CanvasConfig.sampleCount"
    );
    const n = {
      device: e.device.native,
      format: fl(this.formatValue),
      usage: Mr(this.usageValue),
      alphaMode: this.alphaModeValue
    };
    this.colorSpaceValue !== void 0 && (n.colorSpace = this.colorSpaceValue), r.configure(n), this.configuredValue = !0, this.setSize(this.widthValue / this.pixelRatioValue, this.heightValue / this.pixelRatioValue, !1);
  }
  /** 解除配置；之后 `getCurrentFrameTarget()` 会抛错。 */
  unconfigure() {
    this.releaseFrame(), this.releaseMultisampleTarget();
    const e = this.gpuContext;
    e && typeof e.unconfigure == "function" && e.unconfigure(), this.configuredValue = !1, this.currentDevice = null, this.gpuContext = null;
  }
  /** 以 CSS 像素设置画布尺寸（内部会乘以 pixel ratio）。 */
  setSize(e, r, n = !0) {
    if (!Number.isFinite(e) || !Number.isFinite(r) || e <= 0 || r <= 0)
      throw new l(
        `[gpu-device-api] CanvasContext.setSize: width and height must be positive, got ${e}x${r}.`
      );
    const i = Math.max(1, Math.round(e * this.pixelRatioValue)), s = Math.max(1, Math.round(r * this.pixelRatioValue));
    if (this.canvas.width = i, this.canvas.height = s, n) {
      const a = this.canvas.style;
      a && (a.width = `${e}px`, a.height = `${r}px`);
    }
    (i !== this.widthValue || s !== this.heightValue) && (this.widthValue = i, this.heightValue = s, this.releaseFrame(), this.releaseMultisampleTarget());
  }
  /** 设置 CSS 像素与设备像素之间的比例。 */
  setPixelRatio(e) {
    if (!Number.isFinite(e) || e <= 0)
      throw new l(
        `[gpu-device-api] CanvasContext.setPixelRatio: ratio must be positive, got ${String(e)}.`
      );
    if (e === this.pixelRatioValue) return;
    const r = this.widthValue / this.pixelRatioValue, n = this.heightValue / this.pixelRatioValue;
    this.pixelRatioValue = e, this.setSize(r, n, !1);
  }
  /** 重新读取元素尺寸；back buffer 发生变化时返回 true。 */
  resize(e = !1) {
    const r = pe(this.canvas), n = Math.max(1, Math.round(r.width * this.pixelRatioValue)), i = Math.max(1, Math.round(r.height * this.pixelRatioValue));
    return n === this.widthValue && i === this.heightValue ? !1 : (this.setSize(r.width, r.height, e), !0);
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
      throw new l(
        "[gpu-device-api] CanvasContext.getCurrentFrameTarget: the context is not configured."
      );
    const r = this.gpuContext.getCurrentTexture();
    if (this.frameTarget && this.frameNative === r) return this.frameTarget;
    this.releaseFrame();
    const n = re.adopt(
      e,
      r,
      {
        label: `${e.label}#canvasTexture`,
        format: this.formatValue,
        usage: this.usageValue,
        size: { width: r.width, height: r.height, depthOrArrayLayers: 1 }
      },
      { owned: !1 }
    ), i = n.createView({ label: `${n.label}#view` });
    return this.frameTexture = n, this.frameView = i, this.frameNative = r, this.frameTarget = {
      texture: n,
      view: i,
      width: n.width,
      height: n.height,
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
    const r = this.getCurrentFrameTarget(), n = e.loadOp ?? "clear", i = e.storeOp ?? "store", s = e.clearValue;
    return this.sampleCountValue > 1 ? {
      colorAttachments: [
        {
          view: this.ensureMultisampleTarget(r.width, r.height),
          resolveTarget: r.view,
          loadOp: n,
          storeOp: i,
          clearValue: s
        }
      ],
      depthStencilAttachment: null
    } : {
      colorAttachments: [{ view: r.view, loadOp: n, storeOp: i, clearValue: s }],
      depthStencilAttachment: null
    };
  }
  /** 释放 context 相关资源。幂等。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.unconfigure());
  }
  /* ------------------------------------------------------------------ 内部 -------------- */
  ensureMultisampleTarget(e, r) {
    const n = this.currentDevice;
    if (!n)
      throw new l("[gpu-device-api] CanvasContext: the context is not configured.");
    const i = this.multisampleTexture;
    if (i && i.width === e && i.height === r && this.multisampleViewValue)
      return this.multisampleViewValue;
    this.releaseMultisampleTarget();
    const s = re.create(n, {
      label: `${n.label}#canvasMSAA`,
      size: { width: e, height: r },
      format: this.formatValue,
      usage: v.RenderAttachment,
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
class mu {
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
   */
  writeBuffer(e, r, n, i, s) {
    this.native.writeBuffer(
      F(e, "Queue.writeBuffer"),
      r,
      n,
      i,
      s
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, r, n, i) {
    this.native.writeTexture(
      rt(e, "Queue.writeTexture"),
      r,
      Il(n),
      ce(i)
    );
  }
  /**
   * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
   *
   * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
   * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
   */
  copyExternalImageToTexture(e, r, n, i = !1) {
    this.native.copyExternalImageToTexture(
      { source: e, flipY: i },
      rt(r, "Queue.copyExternalImageToTexture"),
      ce(n)
    );
  }
  /**
   * buffer → buffer 的拷贝。
   *
   * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
   * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
   */
  copyBufferToBuffer(e, r, n, i, s) {
    const a = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToBuffer" });
    a.copyBufferToBuffer(
      F(e, "Queue.copyBufferToBuffer(source)"),
      r,
      F(n, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, r, n) {
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: F(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      rt(r, "Queue.copyBufferToTexture(destination)"),
      ce(n)
    ), this.native.submit([i.finish()]);
  }
  /** 提交 command buffer；提交后这些 buffer 不可再次使用。 */
  submit(e) {
    this.native.submit(e.map((r) => fu(r, "Queue.submit")));
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
function rt(t, e) {
  const r = {
    texture: kr(t.texture, e)
  };
  return t.mipLevel !== void 0 && (r.mipLevel = t.mipLevel), t.origin !== void 0 && (r.origin = Ir(t.origin)), t.aspect !== void 0 && (r.aspect = yt(t.aspect)), r;
}
class rn {
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
  constructor(e, r) {
    this.native = e, this.descriptor = r.descriptor, this.label = r.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = r.adapterInfo, this.requestedLimits = r.resolvedLimits, this.debug = r.descriptor.debug ?? !1, this.enabledFeatures = [...r.descriptor.requiredFeatures ?? []], this.features = new hl(r.adapterFeatures), this.limits = Ur(e.limits), this.defaultSampleCount = we(
      r.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = Ne(`webgpu:${this.label}`);
    let n = () => {
    };
    this.lost = new Promise((i) => {
      n = i;
    }), this.resolveLost = n, this.queue = new mu(this), e.onuncapturederror = (i) => {
      this.reportError(gu(i.error));
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
    return R(e);
  }
  /* ---------------------------------------------------------------- 资源 */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(new Vr(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(re.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Tt(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new Wr(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new zr(this, e));
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new jr(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Yr(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(be.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new Zr(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new Jr(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new en(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new hu(this, e));
  }
  /**
   * 为一个 canvas 建立（或取回）本设备的 swap chain 表面。
   *
   * 同一个 canvas 只会有一个 `GPUCanvasContext`，因此这里按 canvas 元素缓存
   * {@link WebGPUCanvasContext}；重复调用返回同一个对象。给了 `config`（或该 canvas 尚未
   * configure）时会重新 configure —— 也就是可以用它切换格式 / alphaMode / sampleCount。
   */
  createCanvasContext(e, r) {
    if (this.assertUsable("createCanvasContext"), !e || typeof e.getContext != "function")
      throw new l(
        "[gpu-device-api] Device.createCanvasContext: expected an HTMLCanvasElement or OffscreenCanvas."
      );
    let n = this.canvasContexts.get(e);
    return (!n || n.disposed) && (n = this.track(new pu(e)), this.canvasContexts.set(e, n)), (r !== void 0 || !n.configured) && n.configure({ ...r, device: this }), n;
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
    for (const r of [...this.errorCallbacks])
      try {
        r(e);
      } catch (n) {
        this.logger.error(`error callback threw: ${String(n)}`);
      }
  }
  /** 释放设备创建的全部资源，然后销毁 device。幂等。 */
  dispose() {
    if (this._disposed) return;
    this._disposed = !0, this.native.onuncapturederror = null;
    const e = [...this.resources];
    this.resources.clear(), this.canvasContexts.clear();
    try {
      fr(e);
    } catch (r) {
      this.logger.error(`failed to dispose some resources: ${String(r)}`);
    }
    this.errorCallbacks.clear(), this.native.destroy();
  }
  /* ---------------------------------------------------------------- 内部 */
  track(e) {
    return this.resources.add(e), e;
  }
  assertUsable(e) {
    if (this._disposed)
      throw new l(`[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`);
    if (this.lostInfo)
      throw new st(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfo.reason}): ` + this.lostInfo.message,
        { reason: this.lostInfo.reason }
      );
  }
  handleDeviceLost(e) {
    const r = e.reason === "destroyed" ? "destroyed" : "unknown", n = { reason: r, message: e.message };
    this.lostInfo = n, this.resolveLost(n), this._disposed || this.reportError(
      new st(`[gpu-device-api] WebGPU device lost (${r}): ${e.message}`, { reason: r })
    );
  }
}
function gu(t) {
  if (on(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), r = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return nt(t, "GPUValidationError") ? new l(r) : nt(t, "GPUOutOfMemoryError") ? new ln(r) : nt(t, "GPUInternalError") ? new Z(r, { code: "INTERNAL_ERROR" }) : t instanceof Error ? new Z(r, { code: "GPU_ERROR", cause: t }) : new Z(r);
}
function nt(t, e) {
  const r = globalThis[e];
  if (typeof r == "function") {
    const i = r;
    try {
      if (t instanceof i) return !0;
    } catch {
    }
  }
  return t?.constructor?.name === e;
}
class De {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, r) {
    this.native = e, this.options = r, this.info = cl(e), this.features = ul(e.features), this.limits = Ur(e.limits), this.featureNames = [...this.features].sort();
  }
  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions() {
    return this.options;
  }
  /** 当前环境是否暴露 WebGPU。 */
  static isSupported() {
    return kt();
  }
  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(e = {}) {
    const r = await ll(e);
    return r ? new De(r, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const r = await De.request(e);
    if (r) return r;
    throw kt() ? new l(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new l(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const r = cr(this.limits, e.requiredLimits, "webgpu"), n = dl(
      this.features,
      e.requiredFeatures,
      `WebGPUAdapter.requestDevice (${this.info.device || this.info.vendor || "unknown adapter"})`
    ), i = {};
    for (const [a, o] of Object.entries(e.requiredLimits ?? {}))
      typeof o == "number" && (i[a] = o);
    const s = await this.native.requestDevice({
      label: e.label,
      requiredFeatures: [...n],
      requiredLimits: i,
      defaultQueue: { label: e.label ? `${e.label}#queue` : void 0 }
    });
    return new rn(s, {
      descriptor: e,
      resolvedLimits: r,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function er(t) {
  if (t.canvas) return t.canvas;
  if (typeof document < "u") {
    const e = document.createElement("canvas");
    return e.width = 1, e.height = 1, e;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
class bu {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    e.forceFallbackAdapter && "fallbackAdapter" in navigator.gpu;
    try {
      return await navigator.gpu.requestAdapter({
        powerPreference: e.powerPreference ?? "high-performance",
        forceFallbackAdapter: e.forceFallbackAdapter ?? !1
      }) ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (r) {
      return { ok: !1, reason: `requestAdapter() 抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    return De.create({
      powerPreference: e.powerPreference,
      forceFallbackAdapter: e.forceFallbackAdapter
    });
  }
}
class wu {
  kind = "webgl2";
  async isAvailable(e) {
    const r = er(e);
    if (!r)
      return { ok: !1, reason: "没有可用的 canvas（既没有传入 canvas，也不在浏览器环境里）" };
    try {
      return r.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（不支持 WebGL2 或 canvas 已被占用）" };
    } catch (n) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const r = er(e);
    if (!r)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return gt.request({
      canvas: r,
      contextAttributes: e.contextAttributes
    });
  }
}
let it = null;
function St() {
  return it || (it = new ia().register(new bu()).register(new wu())), it;
}
const vu = ["webgpu", "webgl2"];
async function yu(t = {}) {
  const e = t.registry ?? St(), r = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? vu, n = await e.probeAll(r, t), i = n.find((s) => s.ok);
  if (i) {
    const s = n.slice(0, n.indexOf(i)).filter((a) => !a.ok);
    return {
      backend: i.backend,
      probes: n,
      reason: s.length === 0 ? `选用 ${i.backend}。` : `选用 ${i.backend}；更优先的后端不可用：${s.map((a) => `${a.backend}（${a.reason ?? "原因未知"}）`).join("；")}。`
    };
  }
  return {
    backend: null,
    probes: n,
    reason: "没有可用的渲染后端。各候选后端的探测结果：" + n.map((s) => `${s.backend} — ${s.reason ?? "不可用"}`).join("；") + "。"
  };
}
async function Nc(t, e = {}) {
  const n = (e.registry ?? St()).get(t);
  return n ? (await n.isAvailable(e)).ok : !1;
}
async function kc(t = {}) {
  return (await xu(t)).device;
}
async function xu(t = {}) {
  const e = t.logger ?? Ne("gpu-device-api"), r = t.registry ?? St(), n = await yu({
    backend: t.backend ?? "auto",
    order: t.order,
    canvas: t.canvas,
    contextAttributes: t.contextAttributes,
    powerPreference: t.powerPreference,
    forceFallbackAdapter: t.forceFallbackAdapter,
    registry: r
  });
  if (n.backend === null)
    throw new l(
      `[gpu-device-api] 无法创建渲染设备：${n.reason}
排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。`
    );
  if (t.strictBackend && t.backend && t.backend !== "auto" && t.backend !== n.backend)
    throw new l(
      `[gpu-device-api] 要求使用 ${t.backend} 后端，但它不可用：${n.reason}`
    );
  const i = r.get(n.backend);
  if (!i)
    throw new l(`[gpu-device-api] 后端 ${n.backend} 未注册。`);
  const s = await i.createAdapter({
    canvas: t.canvas,
    contextAttributes: t.contextAttributes,
    powerPreference: t.powerPreference,
    forceFallbackAdapter: t.forceFallbackAdapter
  }), a = await s.requestDevice({
    label: t.label,
    requiredFeatures: t.requiredFeatures,
    requiredLimits: t.requiredLimits,
    debug: t.debug
  });
  n.backend === "webgl2" && t.backend !== "webgl2" && e.info(`已回退到 WebGL2 后端：${n.reason}`);
  const o = t.canvas ? a.createCanvasContext(t.canvas) : null;
  return { device: a, adapter: s, backend: n.backend, probes: n.probes, context: o };
}
export {
  Du as AddressMode,
  dn as BLEND_PRESETS,
  ia as BackendRegistry,
  M as BindingType,
  Ru as BlendFactor,
  Gu as BlendOperation,
  G as BufferUsage,
  H as ColorWriteMask,
  Fu as CompareFunction,
  Mu as CullMode,
  vu as DEFAULT_BACKEND_ORDER,
  cn as DEFAULT_BLEND_COMPONENT,
  $t as DEFAULT_DEPTH_STATE,
  We as DEFAULT_PRIMITIVE_STATE,
  Ps as DEG2RAD,
  tr as DEPTH_STENCIL_FORMATS,
  st as DeviceLostError,
  bc as DisposalScope,
  Sc as EPSILON,
  Iu as FilterMode,
  Ou as FrontFace,
  Ds as GLSL_PREAMBLE,
  ea as GLSL_SAMPLER_TYPES,
  Zs as GLSL_TYPE_NAMES,
  Z as GpuError,
  _u as IndexFormat,
  fc as LOG_LEVEL_NAMES,
  gn as LOG_LEVEL_VALUES,
  Cu as LoadOp,
  O as LogLevel,
  ln as OutOfMemoryError,
  Au as PrimitiveTopology,
  at as QueryType,
  Fs as RAD2DEG,
  Tu as RENDERABLE_FORMATS,
  $u as SHADER_STAGE_NAMES,
  Se as STENCIL_FACE_DEFAULT,
  D as ShaderStage,
  Uu as StencilOperation,
  Pu as StoreOp,
  Ge as TextureDimension,
  v as TextureUsage,
  an as VERTEX_FORMAT_INFO,
  l as ValidationError,
  ku as VertexStepMode,
  hr as alignTo,
  nc as alignTo4,
  ft as assert,
  Zu as assertDefined,
  $ as assertNever,
  Ve as assertNonNegativeInteger,
  ge as assertPositiveInteger,
  Ju as assertPowerOfTwo,
  rc as byteLengthOf,
  ur as cacheKey,
  Rs as clamp,
  Oc as clearShaders,
  uc as combineFlags,
  ot as compileShaderStage,
  sc as concatTypedArrays,
  St as createDefaultBackendRegistry,
  kc as createDevice,
  xu as createDeviceWithAdapter,
  Ne as createLogger,
  hn as createPipelineCache,
  dc as currentId,
  dr as defaultPixelRatio,
  zu as defaultTextureUsage,
  $c as degToRad,
  Qu as describeAdapter,
  Ms as describeShaderSource,
  yu as detectBackend,
  fr as disposeAll,
  Ic as findWgslEntryPoint,
  cc as formatFlags,
  Bc as formatShaderErrorLog,
  un as fullMipLevelCount,
  mc as getGlobalLogLevel,
  Gc as getShader,
  Vs as glslDefines,
  _r as glslFieldForStage,
  Js as glslTypeName,
  lc as hasAllFlags,
  oc as hasAnyFlag,
  ac as hasFlag,
  Rc as hasShader,
  sn as indexFormatByteSize,
  na as inferBindGroupLayoutEntries,
  Gs as inverseLerp,
  tc as isArrayBufferView,
  Nc as isBackendAvailable,
  rr as isBufferBinding,
  ju as isBufferBindingResource,
  nn as isDepthStencilFormat,
  bn as isDisposable,
  on as isGpuError,
  nr as isSamplerBinding,
  Xu as isSamplerBindingResource,
  Cr as isSamplerType,
  Su as isSrgbFormat,
  Wu as isTextureBinding,
  Yu as isTextureBindingResource,
  Eu as isTriangleTopology,
  ec as isTypedArray,
  Lr as languageForBackend,
  Ec as lerp,
  qs as listShaderKeys,
  xc as mat3,
  Tc as mat4,
  pe as measureCanvas,
  Os as missingSourceMessage,
  _c as nextAfter,
  R as nextId,
  ar as normalizeBindGroupLayoutEntries,
  gc as nullLogger,
  Cc as numberLines,
  mn as paddedCopy,
  Lu as primitiveCount,
  Ac as radToDeg,
  ta as reflectGlslProgram,
  ra as reflectSamplerUniforms,
  Dc as reflectWgslBindings,
  Qs as reflectWgslEntryPoints,
  zs as registerShader,
  Pc as registerShaders,
  Fc as replaceShader,
  Uc as requireShader,
  hc as resetIdCounter,
  Hu as resolveBindingLayoutEntry,
  Ku as resolveBlendState,
  cr as resolveLimits,
  ir as resolveSamplerDescriptor,
  sr as resolveShaderSource,
  dt as resolveTextureSize,
  ht as resolveTextureViewDescriptor,
  qu as samplerKey,
  pc as setGlobalLogLevel,
  Bu as smallestIndexFormat,
  Lc as smoothstep,
  Us as stageSource,
  Br as stripWgslComments,
  pn as toUint8View,
  ic as typedArrayElementSize,
  Mc as unregisterShader,
  or as validateVertexBufferLayout,
  wc as vec2,
  vc as vec3,
  yc as vec4,
  lr as vertexBufferLayoutsKey,
  Vu as vertexFormatGlslType,
  Ie as vertexFormatInfo,
  Nu as vertexFormatWgslType,
  Vc as wgslBindingKeys,
  Ns as wgslDefines,
  ks as wrapGlslSource,
  Ws as wrapWgslSource
};
//# sourceMappingURL=gpu-device-api.js.map
