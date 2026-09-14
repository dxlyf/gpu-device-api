const U = {
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
}, nn = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], wh = [
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
  ...nn
];
function Ri(t) {
  return nn.includes(t);
}
function vh(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const I = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, xh = {
  [I.Vertex]: "vertex",
  [I.Fragment]: "fragment",
  [I.Compute]: "compute"
}, yh = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function Th(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function Sh(t, e) {
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
const $h = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function Mi(t) {
  return t === "uint16" ? 2 : 4;
}
function Gi(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const Lh = {
  Load: "load",
  Clear: "clear"
}, Ah = {
  Store: "store",
  Discard: "discard"
}, _h = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, Eh = {
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
}, Ph = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, Ch = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, Bh = {
  None: "none",
  Front: "front",
  Back: "back"
}, Fh = {
  Ccw: "ccw",
  Cw: "cw"
}, Rh = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, Mh = {
  Nearest: "nearest",
  Linear: "linear"
};
function T(t, e, r, n = !1) {
  return { components: t, byteSize: e, kind: r, normalized: n };
}
const Ui = Object.freeze({
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
function pe(t) {
  const e = Ui[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function Oi(t) {
  const e = pe(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function Di(t) {
  const e = pe(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const Gh = {
  Vertex: "vertex",
  Instance: "instance"
}, F = {
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
function sn(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function Uh(t) {
  return t === "texture" || t === "storage-texture";
}
function an(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class oe extends Error {
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
function Vi(t) {
  return t instanceof oe;
}
class c extends oe {
  constructor(e, r = {}) {
    super(e, { ...r, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class Ii extends oe {
  constructor(e, r = {}) {
    super(e, { ...r, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class Ot extends oe {
  reason;
  constructor(e, r = {}) {
    super(e, { ...r, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = r.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const st = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function Yt(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function Ni(t) {
  const e = Yt(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function zi(t = 0) {
  return x.CopyDst | x.TextureBinding | t;
}
function Kt(t, e = {}) {
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
function on(t = {}) {
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
function Oh(t) {
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
function ln(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const Dt = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function Dh(t) {
  return t.buffer !== void 0;
}
function Vh(t) {
  return t.sampler !== void 0;
}
function Ih(t) {
  return t.view !== void 0;
}
function Nh(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function un(t) {
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
function cn(t, e) {
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
    const n = pe(r.format);
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
function hn(t) {
  return t.map((e) => {
    const r = e.attributes.map((n) => `${n.shaderLocation}@${n.offset}:${n.format}`).join(",");
    return `${e.arrayStride}/${e.stepMode ?? "vertex"}[${r}]`;
  }).join(";");
}
const re = {
  None: 0,
  Red: 1,
  Green: 2,
  Blue: 4,
  Alpha: 8,
  All: 15
}, bt = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, lr = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, ki = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, Xe = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, Wi = Object.freeze({
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
function zh(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = Wi[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function ji(t = 128, e) {
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
function dn(...t) {
  return t.filter((e) => e != null && e !== "").join("|");
}
function kh(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function fn(t, e, r) {
  if (!e) return { ...t };
  const n = { ...t };
  for (const [i, s] of Object.entries(e)) {
    if (typeof s != "number") continue;
    const a = t[i];
    if (typeof a != "number")
      throw new c(`[gpu-device-api] Unknown device limit "${String(i)}".`);
    if (s > a)
      throw new c(
        `[gpu-device-api] The ${r} adapter cannot satisfy ${String(i)} = ${s} (available: ${a}).`
      );
    n[i] = s;
  }
  return n;
}
function Me(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function pn() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function Qt(t, e, r) {
  if (!t) throw new c(e, r ? { details: r } : {});
}
function Wh(t, e, r) {
  if (t == null)
    throw new c(e, r ? { details: r } : {});
  return t;
}
function E(t, e) {
  throw new c(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function Oe(t, e) {
  Qt(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function dt(t, e) {
  Qt(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function jh(t, e) {
  Qt(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const qi = [
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
function qh(t) {
  return qi.some((e) => t instanceof e);
}
function Xh(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function Hh(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function Xi(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function mn(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function Yh(t) {
  return t + 3 & -4;
}
function Hi(t, e = 4) {
  const r = Xi(t), n = mn(r.byteLength, e);
  if (n === r.byteLength) return r;
  const i = new Uint8Array(n);
  return i.set(r), i;
}
function Kh(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function Qh(t) {
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
function Zh(t, e) {
  return (t & e) === e;
}
function Jh(t, e) {
  return (t & e) !== 0;
}
function ed(t, e) {
  return (t & e) === e;
}
function td(...t) {
  let e = 0;
  for (const r of t) e |= r;
  return e;
}
function rd(t, e) {
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
let lt = 0;
function R(t) {
  return lt += 1, `${t}#${lt}`;
}
function nd() {
  return lt;
}
function id() {
  lt = 0;
}
const V = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, sd = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, Yi = {
  silent: V.Silent,
  error: V.Error,
  warn: V.Warn,
  info: V.Info,
  debug: V.Debug,
  trace: V.Trace
};
let Zt = V.Warn;
function ad(t) {
  Zt = typeof t == "string" ? Yi[t] : t;
}
function od() {
  return Zt;
}
function Ne(t = "gpu-device-api", e) {
  const r = () => e ?? Zt, n = (i, s, a, o) => {
    r() < i || s(`[${t}] ${a}`, ...o);
  };
  return {
    get level() {
      return r();
    },
    error: (i, ...s) => n(V.Error, console.error, i, s),
    warn: (i, ...s) => n(V.Warn, console.warn, i, s),
    info: (i, ...s) => n(V.Info, console.info, i, s),
    debug: (i, ...s) => n(V.Debug, console.debug, i, s),
    trace: (i, ...s) => n(V.Trace, console.debug, i, s)
  };
}
const ld = {
  level: V.Silent,
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
function Ki(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function gn(t) {
  let e;
  for (const r of t)
    if (Ki(r))
      try {
        r.dispose();
      } catch (n) {
        e ??= n;
      }
  if (e !== void 0) throw e;
}
class ud {
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
    this.resources.clear(), gn(e);
  }
}
function Qi() {
  return new Float32Array(2);
}
function Zi(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function Ji(t, e) {
  const r = new Float32Array(2);
  return r[0] = t, r[1] = e, r;
}
function es(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function ts(t, e, r) {
  return t[0] = e, t[1] = r, t;
}
function rs(t) {
  return t[0] = 0, t[1] = 0, t;
}
function ns(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t;
}
function is(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t;
}
function ss(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t;
}
function as(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t;
}
function os(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t;
}
function ls(t, e, r, n) {
  return t[0] = e[0] + r[0] * n, t[1] = e[1] + r[1] * n, t;
}
function us(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function cs(t, e) {
  const r = e[0], n = e[1];
  let i = Math.hypot(r, n);
  return i > 0 && (i = 1 / i), t[0] = r * i, t[1] = n * i, t;
}
function hs(t) {
  return Math.hypot(t[0], t[1]);
}
function ds(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function fs(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function ps(t, e) {
  const r = t[0] - e[0], n = t[1] - e[1];
  return r * r + n * n;
}
function ms(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function gs(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function bs(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t;
}
function ws(t, e, r) {
  return t[0] = Math.min(e[0], r[0]), t[1] = Math.min(e[1], r[1]), t;
}
function vs(t, e, r) {
  return t[0] = Math.max(e[0], r[0]), t[1] = Math.max(e[1], r[1]), t;
}
function xs(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r;
}
function ys(t, e, r) {
  const n = e[0], i = e[1];
  return t[0] = r[0] * n + r[3] * i + r[6], t[1] = r[1] * n + r[4] * i + r[7], t;
}
function Ts(t) {
  return [t[0], t[1]];
}
function Ss(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const cd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: ns,
  clone: Zi,
  copy: es,
  create: Qi,
  cross: gs,
  distance: fs,
  div: as,
  dot: ms,
  equals: xs,
  fromValues: Ji,
  length: hs,
  lerp: bs,
  max: vs,
  min: ws,
  mul: ss,
  negate: us,
  normalize: cs,
  scale: os,
  scaleAndAdd: ls,
  set: ts,
  squaredDistance: ps,
  squaredLength: ds,
  sub: is,
  toArray: Ts,
  toString: Ss,
  transformMat3: ys,
  zero: rs
}, Symbol.toStringTag, { value: "Module" }));
function C() {
  return new Float32Array(3);
}
function $s(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function Ls(t, e, r) {
  const n = new Float32Array(3);
  return n[0] = t, n[1] = e, n[2] = r, n;
}
function te(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function le(t, e, r, n) {
  return t[0] = e, t[1] = r, t[2] = n, t;
}
function Vt(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function As(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t[2] = e[2] + r[2], t;
}
function Ge(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t[2] = e[2] - r[2], t;
}
function _s(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t[2] = e[2] * r[2], t;
}
function Es(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t[2] = e[2] / r[2], t;
}
function bn(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t;
}
function at(t, e, r, n) {
  return t[0] = e[0] + r[0] * n, t[1] = e[1] + r[1] * n, t[2] = e[2] + r[2] * n, t;
}
function Ps(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function wn(t, e) {
  const r = e[0], n = e[1], i = e[2];
  let s = Math.hypot(r, n, i);
  return s > 0 && (s = 1 / s), t[0] = r * s, t[1] = n * s, t[2] = i * s, t;
}
function Ae(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function Cs(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function Bs(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function Fs(t, e) {
  const r = t[0] - e[0], n = t[1] - e[1], i = t[2] - e[2];
  return r * r + n * n + i * i;
}
function vn(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Rs(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = r[0], o = r[1], l = r[2];
  return t[0] = i * l - s * o, t[1] = s * a - n * l, t[2] = n * o - i * a, t;
}
function Ms(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t[2] = e[2] + n * (r[2] - e[2]), t;
}
function Gs(t, e, r) {
  return t[0] = Math.min(e[0], r[0]), t[1] = Math.min(e[1], r[1]), t[2] = Math.min(e[2], r[2]), t;
}
function Us(t, e, r) {
  return t[0] = Math.max(e[0], r[0]), t[1] = Math.max(e[1], r[1]), t[2] = Math.max(e[2], r[2]), t;
}
function It(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r;
}
function Os(t, e, r) {
  const n = vn(r, e) * 2;
  return t[0] = e[0] - r[0] * n, t[1] = e[1] - r[1] * n, t[2] = e[2] - r[2] * n, t;
}
function Ds(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[3] * i + r[6] * s, t[1] = r[1] * n + r[4] * i + r[7] * s, t[2] = r[2] * n + r[5] * i + r[8] * s, t;
}
function Vs(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  let a = r[3] * n + r[7] * i + r[11] * s + r[15];
  return a = a || 1, t[0] = (r[0] * n + r[4] * i + r[8] * s + r[12]) / a, t[1] = (r[1] * n + r[5] * i + r[9] * s + r[13]) / a, t[2] = (r[2] * n + r[6] * i + r[10] * s + r[14]) / a, t;
}
function Is(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[4] * i + r[8] * s, t[1] = r[1] * n + r[5] * i + r[9] * s, t[2] = r[2] * n + r[6] * i + r[10] * s, t;
}
function Ns(t) {
  return [t[0], t[1], t[2]];
}
function zs(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const hd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: As,
  clone: $s,
  copy: te,
  create: C,
  cross: Rs,
  distance: Bs,
  div: Es,
  dot: vn,
  equals: It,
  fromValues: Ls,
  length: Ae,
  lerp: Ms,
  max: Us,
  min: Gs,
  mul: _s,
  negate: Ps,
  normalize: wn,
  reflect: Os,
  scale: bn,
  scaleAndAdd: at,
  set: le,
  squaredDistance: Fs,
  squaredLength: Cs,
  sub: Ge,
  toArray: Ns,
  toString: zs,
  transformDirection: Is,
  transformMat3: Ds,
  transformMat4: Vs,
  zero: Vt
}, Symbol.toStringTag, { value: "Module" }));
function ks() {
  return new Float32Array(4);
}
function Ws(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function js(t, e, r, n) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = r, i[3] = n, i;
}
function qs(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function Xs(t, e, r, n, i) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t;
}
function Hs(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function Ys(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t[2] = e[2] + r[2], t[3] = e[3] + r[3], t;
}
function Ks(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t[2] = e[2] - r[2], t[3] = e[3] - r[3], t;
}
function Qs(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t[2] = e[2] * r[2], t[3] = e[3] * r[3], t;
}
function Zs(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t[2] = e[2] / r[2], t[3] = e[3] / r[3], t;
}
function Js(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function ea(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function ta(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3];
  let a = Math.hypot(r, n, i, s);
  return a > 0 && (a = 1 / a), t[0] = r * a, t[1] = n * a, t[2] = i * a, t[3] = s * a, t;
}
function ra(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function na(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function ia(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function sa(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t[2] = e[2] + n * (r[2] - e[2]), t[3] = e[3] + n * (r[3] - e[3]), t;
}
function aa(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r && Math.abs(t[3] - e[3]) <= r;
}
function oa(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = r[0] * n + r[4] * i + r[8] * s + r[12] * a, t[1] = r[1] * n + r[5] * i + r[9] * s + r[13] * a, t[2] = r[2] * n + r[6] * i + r[10] * s + r[14] * a, t[3] = r[3] * n + r[7] * i + r[11] * s + r[15] * a, t;
}
function la(t) {
  return [t[0], t[1], t[2], t[3]];
}
function ua(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const dd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ys,
  clone: Ws,
  copy: qs,
  create: ks,
  div: Zs,
  dot: ia,
  equals: aa,
  fromValues: js,
  length: ra,
  lerp: sa,
  mul: Qs,
  negate: ea,
  normalize: ta,
  scale: Js,
  set: Xs,
  squaredLength: na,
  sub: Ks,
  toArray: la,
  toString: ua,
  transformMat4: oa,
  zero: Hs
}, Symbol.toStringTag, { value: "Module" }));
function xn() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function yn(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function ca(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function ha(t, e, r, n, i, s, a, o, l) {
  const u = new Float32Array(9);
  return u[0] = t, u[1] = e, u[2] = r, u[3] = n, u[4] = i, u[5] = s, u[6] = a, u[7] = o, u[8] = l, u;
}
function da(t, e) {
  return t.set(e), t;
}
function fa(t, e, r, n, i, s, a, o, l, u) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = l, t[8] = u, t;
}
function Tn(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function Sn(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], u = e[7], h = e[8];
  return t[0] = r, t[1] = s, t[2] = l, t[3] = n, t[4] = a, t[5] = u, t[6] = i, t[7] = o, t[8] = h, t;
}
function pa(t) {
  const e = t[0], r = t[1], n = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], u = t[8], h = u * s - a * l, f = -u * i + a * o, d = l * i - s * o;
  return e * h + r * f + n * d;
}
function $n(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], u = e[7], h = e[8], f = h * a - o * u, d = -h * s + o * l, p = u * s - a * l;
  let m = r * f + n * d + i * p;
  return m ? (m = 1 / m, t[0] = f * m, t[1] = (-h * n + i * u) * m, t[2] = (o * n - i * a) * m, t[3] = d * m, t[4] = (h * r - i * l) * m, t[5] = (-o * r + i * s) * m, t[6] = p * m, t[7] = (-u * r + n * l) * m, t[8] = (a * r - n * s) * m, t) : null;
}
function ma(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], u = e[6], h = e[7], f = e[8], d = r[0], p = r[1], m = r[2], g = r[3], b = r[4], y = r[5], S = r[6], $ = r[7], L = r[8];
  return t[0] = d * n + p * a + m * u, t[1] = d * i + p * o + m * h, t[2] = d * s + p * l + m * f, t[3] = g * n + b * a + y * u, t[4] = g * i + b * o + y * h, t[5] = g * s + b * l + y * f, t[6] = S * n + $ * a + L * u, t[7] = S * i + $ * o + L * h, t[8] = S * s + $ * l + L * f, t;
}
function ga(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], u = e[6], h = e[7], f = e[8], d = r[0], p = r[1], m = r[2];
  return t[0] = d * n, t[1] = d * i, t[2] = d * s, t[3] = p * a, t[4] = p * o, t[5] = p * l, t[6] = m * u, t[7] = m * h, t[8] = m * f, t;
}
function ba(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], u = e[6], h = e[7], f = e[8], d = r[0], p = r[1];
  return t[0] = n, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = l, t[6] = d * n + p * a + u, t[7] = d * i + p * o + h, t[8] = d * s + p * l + f, t;
}
function wa(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], u = e[6], h = e[7], f = e[8], d = Math.sin(r), p = Math.cos(r);
  return t[0] = p * n + d * a, t[1] = p * i + d * o, t[2] = p * s + d * l, t[3] = p * a - d * n, t[4] = p * o - d * i, t[5] = p * l - d * s, t[6] = u, t[7] = h, t[8] = f, t;
}
function Ln(t, e) {
  return Tn(t, e), $n(t, t) ? (Sn(t, t), t) : null;
}
function va(t, e, r = 1e-6) {
  for (let n = 0; n < 9; n++)
    if (Math.abs(t[n] - e[n]) > r) return !1;
  return !0;
}
function xa(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const fd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: ca,
  copy: da,
  create: xn,
  determinant: pa,
  equals: va,
  fromMat4: Tn,
  fromValues: ha,
  identity: yn,
  invert: $n,
  multiply: ma,
  normalFromMat4: Ln,
  rotate: wa,
  scale: ga,
  set: fa,
  toString: xa,
  translate: ba,
  transpose: Sn
}, Symbol.toStringTag, { value: "Module" })), ut = 1e-6, ee = new Float32Array(16), ya = new Float32Array(3);
function J() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function ie(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Ta(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function An(t) {
  return t.fill(0), t;
}
function Sa(...t) {
  const e = new Float32Array(16);
  for (let r = 0; r < 16; r++) e[r] = t[r] ?? 0;
  return e;
}
function _n(t, e) {
  return t.set(e), t;
}
function $a(t, ...e) {
  for (let r = 0; r < 16; r++) t[r] = e[r] ?? 0;
  return t;
}
function La(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], u = e[7], h = e[8], f = e[9], d = e[10], p = e[11], m = e[12], g = e[13], b = e[14], y = e[15];
  return t[0] = r, t[1] = a, t[2] = h, t[3] = m, t[4] = n, t[5] = o, t[6] = f, t[7] = g, t[8] = i, t[9] = l, t[10] = d, t[11] = b, t[12] = s, t[13] = u, t[14] = p, t[15] = y, t;
}
function En(t) {
  const e = t[0], r = t[1], n = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], u = t[8], h = t[9], f = t[10], d = t[11], p = t[12], m = t[13], g = t[14], b = t[15], y = e * a - r * s, S = e * o - n * s, $ = e * l - i * s, L = r * o - n * a, A = r * l - i * a, M = n * l - i * o, G = u * m - h * p, z = u * g - f * p, k = u * b - d * p, W = h * g - f * m, j = h * b - d * m, q = f * b - d * g;
  return y * q - S * j + $ * W + L * k - A * z + M * G;
}
function Aa(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], u = e[7], h = e[8], f = e[9], d = e[10], p = e[11], m = e[12], g = e[13], b = e[14], y = e[15], S = r * o - n * a, $ = r * l - i * a, L = r * u - s * a, A = n * l - i * o, M = n * u - s * o, G = i * u - s * l, z = h * g - f * m, k = h * b - d * m, W = h * y - p * m, j = f * b - d * g, q = f * y - p * g, K = d * y - p * b;
  let _ = S * K - $ * q + L * j + A * W - M * k + G * z;
  return _ ? (_ = 1 / _, t[0] = (o * K - l * q + u * j) * _, t[1] = (i * q - n * K - s * j) * _, t[2] = (g * G - b * M + y * A) * _, t[3] = (d * M - f * G - p * A) * _, t[4] = (l * W - a * K - u * k) * _, t[5] = (r * K - i * W + s * k) * _, t[6] = (b * L - m * G - y * $) * _, t[7] = (h * G - d * L + p * $) * _, t[8] = (a * q - o * W + u * z) * _, t[9] = (n * W - r * q - s * z) * _, t[10] = (m * M - g * L + y * S) * _, t[11] = (f * L - h * M - p * S) * _, t[12] = (o * k - a * j - l * z) * _, t[13] = (r * j - n * k + i * z) * _, t[14] = (g * $ - m * A - b * S) * _, t[15] = (h * A - f * $ + d * S) * _, t) : null;
}
function se(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], u = e[6], h = e[7], f = e[8], d = e[9], p = e[10], m = e[11], g = e[12], b = e[13], y = e[14], S = e[15], $ = r[0], L = r[1], A = r[2], M = r[3], G = r[4], z = r[5], k = r[6], W = r[7], j = r[8], q = r[9], K = r[10], _ = r[11], ke = r[12], We = r[13], je = r[14], qe = r[15];
  return t[0] = $ * n + L * o + A * f + M * g, t[1] = $ * i + L * l + A * d + M * b, t[2] = $ * s + L * u + A * p + M * y, t[3] = $ * a + L * h + A * m + M * S, t[4] = G * n + z * o + k * f + W * g, t[5] = G * i + z * l + k * d + W * b, t[6] = G * s + z * u + k * p + W * y, t[7] = G * a + z * h + k * m + W * S, t[8] = j * n + q * o + K * f + _ * g, t[9] = j * i + q * l + K * d + _ * b, t[10] = j * s + q * u + K * p + _ * y, t[11] = j * a + q * h + K * m + _ * S, t[12] = ke * n + We * o + je * f + qe * g, t[13] = ke * i + We * l + je * d + qe * b, t[14] = ke * s + We * u + je * p + qe * y, t[15] = ke * a + We * h + je * m + qe * S, t;
}
function _a(t, ...e) {
  if (e.length === 0) return ie(t);
  _n(t, e[0]);
  for (let r = 1; r < e.length; r++) se(t, t, e[r]);
  return t;
}
function Pn(t, e) {
  return ie(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function Ea(t, e) {
  return ie(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function Cn(t, e, r) {
  let n = r[0], i = r[1], s = r[2], a = Math.hypot(n, i, s);
  if (a < ut) return ie(t);
  a = 1 / a, n *= a, i *= a, s *= a;
  const o = Math.sin(e), l = Math.cos(e), u = 1 - l, h = n * n * u + l, f = i * n * u + s * o, d = s * n * u - i * o, p = n * i * u - s * o, m = i * i * u + l, g = s * i * u + n * o, b = n * s * u + i * o, y = i * s * u - n * o, S = s * s * u + l;
  return t[0] = h, t[1] = f, t[2] = d, t[3] = 0, t[4] = p, t[5] = m, t[6] = g, t[7] = 0, t[8] = b, t[9] = y, t[10] = S, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Bn(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return ie(t), t[5] = n, t[6] = r, t[9] = -r, t[10] = n, t;
}
function Fn(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return ie(t), t[0] = n, t[2] = -r, t[8] = r, t[10] = n, t;
}
function Rn(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return ie(t), t[0] = n, t[1] = r, t[4] = -r, t[5] = n, t;
}
function Pa(t, e, r, n) {
  return Jt(t, e, r, n, Ca);
}
const Ca = new Float32Array([1, 1, 1]);
function Jt(t, e, r, n, i) {
  let s = r[0], a = r[1], o = r[2], l = Math.hypot(s, a, o);
  if (l < ut)
    return ie(t), t[12] = n[0], t[13] = n[1], t[14] = n[2], t;
  l = 1 / l, s *= l, a *= l, o *= l;
  const u = Math.sin(e), h = Math.cos(e), f = 1 - h, d = s * s * f + h, p = a * s * f + o * u, m = o * s * f - a * u, g = s * a * f - o * u, b = a * a * f + h, y = o * a * f + s * u, S = s * o * f + a * u, $ = a * o * f - s * u, L = o * o * f + h, A = i[0], M = i[1], G = i[2];
  return t[0] = d * A, t[1] = p * A, t[2] = m * A, t[3] = 0, t[4] = g * M, t[5] = b * M, t[6] = y * M, t[7] = 0, t[8] = S * G, t[9] = $ * G, t[10] = L * G, t[11] = 0, t[12] = n[0], t[13] = n[1], t[14] = n[2], t[15] = 1, t;
}
function Ba(t, e, r, n, i, s) {
  Jt(t, e, r, n, i);
  const a = s[0], o = s[1], l = s[2];
  return t[12] = n[0] + a - (t[0] * a + t[4] * o + t[8] * l), t[13] = n[1] + o - (t[1] * a + t[5] * o + t[9] * l), t[14] = n[2] + l - (t[2] * a + t[6] * o + t[10] * l), t;
}
function Fa(t, e, r) {
  return Pn(ee, r), se(t, e, ee);
}
function Ra(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function Ma(t, e, r, n) {
  return Cn(ee, r, n), se(t, e, ee);
}
function Ga(t, e, r) {
  return Bn(ee, r), se(t, e, ee);
}
function Ua(t, e, r) {
  return Fn(ee, r), se(t, e, ee);
}
function Oa(t, e, r) {
  return Rn(ee, r), se(t, e, ee);
}
function Da(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function Mn(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function Va(t, e) {
  const r = Mn(ya, e), n = En(e) < 0 ? -1 : 1, i = r[0] * n, s = r[1], a = r[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function Gn(t, e, r, n, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / r, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (n - i);
    t[10] = (i + n) * a, t[14] = 2 * i * n * a;
  } else
    t[10] = -1, t[14] = -2 * n;
  return t;
}
function Un(t, e, r, n, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / r, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (n - i), t[14] = i * n / (n - i)) : (t[10] = -1, t[14] = -n), t;
}
function On(t, e, r, n, i, s, a) {
  const o = 1 / (e - r), l = 1 / (n - i), u = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * u, t[11] = 0, t[12] = (e + r) * o, t[13] = (i + n) * l, t[14] = (a + s) * u, t[15] = 1, t;
}
function Dn(t, e, r, n, i, s, a) {
  const o = 1 / (e - r), l = 1 / (n - i), u = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = u, t[11] = 0, t[12] = (e + r) * o, t[13] = (i + n) * l, t[14] = s * u, t[15] = 1, t;
}
function Ia(t, e, r, n, i, s, a) {
  const o = 1 / (r - e), l = 1 / (i - n), u = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * l, t[6] = 0, t[7] = 0, t[8] = (r + e) * o, t[9] = (i + n) * l, t[10] = (a + s) * u, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * u, t[15] = 0, t;
}
function Nt(t, e, r, n) {
  let i = e[0] - r[0], s = e[1] - r[1], a = e[2] - r[2], o = Math.hypot(i, s, a);
  if (o < ut) return An(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let l = n[1] * a - n[2] * s, u = n[2] * i - n[0] * a, h = n[0] * s - n[1] * i;
  o = Math.hypot(l, u, h), o < ut ? (l = 0, u = 0, h = 0) : (o = 1 / o, l *= o, u *= o, h *= o);
  const f = s * h - a * u, d = a * l - i * h, p = i * u - s * l;
  return t[0] = l, t[1] = f, t[2] = i, t[3] = 0, t[4] = u, t[5] = d, t[6] = s, t[7] = 0, t[8] = h, t[9] = p, t[10] = a, t[11] = 0, t[12] = -(l * e[0] + u * e[1] + h * e[2]), t[13] = -(f * e[0] + d * e[1] + p * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function Na(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  let a = e[3] * n + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * n + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * n + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * n + e[6] * i + e[10] * s + e[14]) / a, t;
}
function za(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  return t[0] = e[0] * n + e[4] * i + e[8] * s, t[1] = e[1] * n + e[5] * i + e[9] * s, t[2] = e[2] * n + e[6] * i + e[10] * s, t;
}
function ka(t, e, r = 1e-6) {
  for (let n = 0; n < 16; n++)
    if (Math.abs(t[n] - e[n]) > r) return !1;
  return !0;
}
function Wa(t) {
  const e = [];
  for (let r = 0; r < 4; r++)
    e.push(
      `[${t[r]}, ${t[r + 4]}, ${t[r + 8]}, ${t[r + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const pd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Ta,
  copy: _n,
  create: J,
  determinant: En,
  equals: ka,
  fromRotation: Cn,
  fromRotationTranslation: Pa,
  fromRotationTranslationScale: Jt,
  fromRotationTranslationScaleOrigin: Ba,
  fromScaling: Ea,
  fromTranslation: Pn,
  fromValues: Sa,
  fromXRotation: Bn,
  fromYRotation: Fn,
  fromZRotation: Rn,
  frustum: Ia,
  getRotation: Va,
  getScaling: Mn,
  getTranslation: Da,
  identity: ie,
  invert: Aa,
  lookAt: Nt,
  multiply: se,
  multiplyAll: _a,
  ortho: On,
  orthoZO: Dn,
  perspective: Gn,
  perspectiveZO: Un,
  rotate: Ma,
  rotateX: Ga,
  rotateY: Ua,
  rotateZ: Oa,
  scale: Ra,
  set: $a,
  toString: Wa,
  transformDirection: za,
  transformPoint: Na,
  translate: Fa,
  transpose: La,
  zero: An
}, Symbol.toStringTag, { value: "Module" })), md = 1e-6, ja = Math.PI / 180, qa = 180 / Math.PI;
function Vn(t) {
  return t * ja;
}
function gd(t) {
  return t * qa;
}
function Le(t, e, r) {
  return t < e ? e : t > r ? r : t;
}
function Xa(t, e, r) {
  return e === t ? 0 : Le((r - t) / (e - t), 0, 1);
}
function bd(t, e, r) {
  return t + (e - t) * r;
}
function wd(t, e, r) {
  const n = Xa(t, e, r);
  return n * n * (3 - 2 * n);
}
function vd(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function In(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function Nn(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function Ha(t, e, r) {
  if (e === "wgsl") return t.wgsl;
  const n = Nn(r);
  return n ? t[n] : void 0;
}
function Ya(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function Ka(t, e, r, n) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = In(t) === "glsl" ? `请在 \`code\` 里提供 \`${Nn(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${n}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${Ya(r)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const Qa = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, Za = /^\s*#version[^\n]*\n?/;
function Ja(t) {
  return t ? Object.entries(t).map(([e, r]) => typeof r == "boolean" ? `#define ${e} ${r ? 1 : 0}` : `#define ${e} ${r}`).join(`
`) : "";
}
function eo(t) {
  return t ? Object.entries(t).map(([e, r]) => typeof r == "boolean" ? `const ${e}: bool = ${r};` : typeof r == "number" ? Number.isInteger(r) ? `const ${e}: i32 = ${r};` : `const ${e}: f32 = ${r};` : `const ${e}: f32 = ${r};`).join(`
`) : "";
}
function to(t, e, r = "shader") {
  const n = /^\s*#version\s+([^\n]*)/.exec(t);
  if (n) {
    const a = n[1].trim();
    if (!/^300\s+es\b/.test(a))
      throw new c(
        `[gpu-device-api] ShaderModule「${r}」声明了 \`#version ${a}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。`
      );
  }
  const i = t.replace(Za, ""), s = Ja(e);
  return `${Qa}${s ? `${s}
` : ""}${i.trim()}
`;
}
function ro(t, e) {
  const r = eo(e);
  return r ? `${r}

${t.trim()}
` : `${t.trim()}
`;
}
function zt(t) {
  const { backend: e, source: r, stage: n, label: i = "shader" } = t, s = In(e), a = Ha(r, s, n);
  if (a === void 0)
    throw new c(Ka(e, n, r, i));
  const o = s === "glsl" ? to(a, t.defines, i) : ro(a, t.defines);
  return { language: s, stage: n, code: o, hasPreamble: s === "glsl" };
}
function xd(t, e, r) {
  const n = e.split(`
`), i = `[gpu-device-api] 着色器「${r}」编译失败：
${t.trim()}
`, s = /* @__PURE__ */ new Set(), a = /ERROR:\s*\d+:(\d+)/g;
  let o;
  for (; (o = a.exec(t)) !== null; ) {
    const u = Number(o[1]);
    u > 0 && s.add(u);
  }
  if (s.size === 0)
    return `${i}
----- 完整源码 -----
${kt(n)}
`;
  const l = [];
  for (const u of [...s].sort((h, f) => h - f)) {
    l.push(`----- 第 ${u} 行附近 -----`);
    const h = Math.max(1, u - 3), f = Math.min(n.length, u + 3);
    l.push(kt(n.slice(h - 1, f), h));
  }
  return `${i}
${l.join(`
`)}
`;
}
function kt(t, e = 1) {
  const r = String(e + t.length - 1).length;
  return t.map((n, i) => `${String(e + i).padStart(r, " ")} | ${n}`).join(`
`);
}
function yd(t) {
  return kt(t.split(`
`));
}
const ne = /* @__PURE__ */ new Map();
function no(t, e) {
  if (ne.has(t))
    throw new c(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return ne.set(t, e), e;
}
function Td(t) {
  for (const [e, r] of Object.entries(t)) no(e, r);
}
function Sd(t, e) {
  return ne.set(t, e), e;
}
function $d(t) {
  return ne.has(t);
}
function Ld(t) {
  return ne.get(t);
}
function Ad(t) {
  const e = ne.get(t);
  if (!e) {
    const r = io();
    throw new c(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (r.length > 0 ? `已注册：${r.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function _d(t) {
  return ne.delete(t);
}
function io() {
  return [...ne.keys()].sort();
}
function Ed() {
  ne.clear();
}
function zn(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const so = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, ao = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, ur = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function Pd(t) {
  const e = zn(t), r = [], n = [
    { regex: new RegExp(`${so}\\s*${ur}`, "g"), swapped: !1 },
    { regex: new RegExp(`${ao}\\s*${ur}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of n) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), l = Number(a[s ? 1 : 2]), u = (a[3] ?? "").trim(), h = a[4], f = a[5].trim().replace(/\s+/g, " ");
      r.some((d) => d.group === o && d.binding === l) || r.push(oo(o, l, u, h, f));
    }
  }
  return r.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function oo(t, e, r, n, i) {
  let s = "handle", a;
  if (r.startsWith("uniform"))
    s = "uniform";
  else if (r.startsWith("storage")) {
    s = "storage";
    const u = r.split(",").map((h) => h.trim())[1];
    u === "read" ? a = "read" : u === "read_write" ? a = "read_write" : u === "write" && (a = "write");
  }
  const o = lo(s, i);
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
function lo(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const cr = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, uo = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function co(t) {
  const e = zn(t), r = [];
  let n;
  for (cr.lastIndex = 0; (n = cr.exec(e)) !== null; ) {
    const i = n[1], s = n[2] ?? "", a = n[3];
    let o = null;
    if (i === "compute") {
      const l = uo.exec(s);
      o = l ? [Number(l[1]), Number(l[2] ?? 1), Number(l[3] ?? 1)] : [1, 1, 1];
    }
    r.push({ stage: i, name: a, workgroupSize: o });
  }
  return r;
}
function Cd(t, e, r) {
  return co(t).find((n) => n.stage === e && n.name === r);
}
function Bd(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const ho = {
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
function fo(t) {
  return ho[t] ?? `0x${t.toString(16)}`;
}
const po = [
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
function kn(t) {
  return po.includes(t);
}
function mo(t, e) {
  const r = [], n = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
  for (let l = 0; l < n; l++) {
    const u = t.getActiveAttrib(e, l);
    u && r.push({
      name: u.name,
      location: t.getAttribLocation(e, u.name),
      glType: u.type,
      size: u.size
    });
  }
  const i = [], s = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
  for (let l = 0; l < s; l++) {
    const u = t.getActiveUniform(e, l);
    u && i.push({
      name: u.name,
      location: t.getUniformLocation(e, u.name),
      glType: u.type,
      size: u.size,
      isArray: /\[\d+\]$/.test(u.name)
    });
  }
  const a = [], o = t.getProgramParameter(e, t.ACTIVE_UNIFORM_BLOCKS);
  for (let l = 0; l < o; l++) {
    const u = t.getActiveUniformBlockName(e, l) ?? `block${l}`;
    a.push({
      name: u,
      index: l,
      dataSize: t.getActiveUniformBlockParameter(e, l, t.UNIFORM_BLOCK_DATA_SIZE),
      activeUniforms: t.getActiveUniformBlockParameter(e, l, t.UNIFORM_BLOCK_ACTIVE_UNIFORMS)
    });
  }
  return { attributes: r, uniforms: i, uniformBlocks: a };
}
function go(t) {
  return t.uniforms.filter((e) => kn(e.glType));
}
function bo(t, e) {
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
  const n = go(t).sort((i, s) => i.name.localeCompare(s.name));
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
class wo {
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
const ce = Object.freeze({
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
function B(t, e, r) {
  const n = t.getParameter(e);
  return typeof n == "number" && n > 0 ? n : r;
}
const vo = 16777215;
function xo(t) {
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
    maxElementIndex: vo,
    maxElementsVertices: B(t, 33001, 2147483647),
    maxElementsIndices: B(t, 33e3, 2147483647)
  };
}
function yo(t) {
  const e = xo(t);
  return {
    // WebGL2 没有 1D 纹理，用 2D 上限代替，上层代码读到的是一个安全的正数。
    maxTextureDimension1D: e.maxTextureSize,
    maxTextureDimension2D: e.maxTextureSize,
    maxTextureDimension3D: e.max3dTextureSize,
    maxTextureArrayLayers: e.maxArrayTextureLayers,
    maxBindGroups: ce.maxBindGroups,
    maxBindGroupsPlusVertexBuffers: ce.maxBindGroupsPlusVertexBuffers,
    maxBindingsPerBindGroup: ce.maxBindingsPerBindGroup,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      ce.maxDynamicUniformBuffersPerPipelineLayout,
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
    minStorageBufferOffsetAlignment: ce.minStorageBufferOffsetAlignment,
    maxVertexBuffers: Math.min(ce.maxVertexBuffers, e.maxVertexAttribs),
    maxBufferSize: 2147483647,
    maxVertexAttributes: e.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: e.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: ce.maxColorAttachmentBytesPerSample,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}
function To(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), e;
}
function So(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const r = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", n = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: r, device: n };
}
function $o(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function Lo(t, e) {
  const r = t.getContext("webgl2", e);
  if (!r)
    throw new c(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return r;
}
class Ao {
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
    const r = this.vertexArray;
    if (r === null) return e();
    this.gl.bindVertexArray(null), this.vertexArray = null, this.invalidateBufferBindings();
    try {
      return e();
    } finally {
      this.gl.bindVertexArray(r), this.vertexArray = r, this.invalidateBufferBindings();
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
  /** 忘掉 `ELEMENT_ARRAY_BUFFER` 的记录（索引缓冲被销毁时调用）。 */
  forgetIndexBuffer(e) {
    this.indexBuffer === e && (this.indexBuffer = null);
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
    const l = e ? `1:${r}:${n}:${i}:${s}:${a}:${o}` : "0";
    if (this.blendSignature === l) return;
    const u = this.gl;
    e ? (u.enable(u.BLEND), u.blendFuncSeparate(r, n, s, a), u.blendEquationSeparate(i, o)) : u.disable(u.BLEND), this.blendSignature = l;
  }
  setBlendConstant(e) {
    wt(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
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
    _o(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
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
    wt(this.viewport, [e, r, n, i]) || (this.gl.viewport(e, r, n, i), this.viewport = [e, r, n, i]);
  }
  setScissor(e, r, n, i, s) {
    const a = this.gl;
    this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !wt(this.scissor, [r, n, i, s]) && (a.scissor(r, n, i, s), this.scissor = [r, n, i, s]);
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
function wt(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function _o(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
const Eo = [
  {
    flag: U.Storage,
    name: "Storage",
    reason: "shader storage buffer 需要 GLES 3.1，WebGL2 只有 GLES 3.0。请改用 uniform buffer 传数据。"
  },
  {
    flag: U.Indirect,
    name: "Indirect",
    reason: "WebGL2 没有 indirect draw。请改用一次性的 uniform 数据 + 普通 draw 调用。"
  },
  {
    flag: U.QueryResolve,
    name: "QueryResolve",
    reason: "WebGL2 的遮挡查询结果只能同步读回，没有查询结果缓冲区的概念。"
  }
];
class Po {
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
  constructor(e, r, n, i) {
    if (Oe(n.size, "BufferDescriptor.size"), n.size % 4 !== 0)
      throw new c(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${n.size}。（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）`
      );
    for (const a of Eo)
      if (n.usage & a.flag)
        throw new c(
          `[gpu-device-api] BufferUsage.${a.name} 在 WebGL2 后端不可用：${a.reason}`
        );
    this.gl = e, this.state = r, this.onDestroy = i, this.label = n.label ?? R("buffer"), this.id = R("buf"), this.size = n.size, this.usage = n.usage, this.usages = n.usage, this.bindingTarget = n.usage & U.Index ? e.ELEMENT_ARRAY_BUFFER : e.COPY_WRITE_BUFFER;
    const s = e.createBuffer();
    if (!s) throw new c("[gpu-device-api] gl.createBuffer() 返回 null，无法分配 buffer。");
    this.native = s, this.withTarget(() => e.bufferData(this.bindingTarget, n.size, e.DYNAMIC_DRAW));
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
  async mapAsync(e, r = 0, n = this.size - r) {
    if (this.assertUsable("mapAsync"), this.mapping)
      throw new c(`[gpu-device-api] buffer「${this.label}」已经处于映射状态，请先 unmap()。`);
    if (dt(r, "mapAsync 的 offset"), Oe(n, "mapAsync 的 size"), r % 4 !== 0)
      throw new c(
        `[gpu-device-api] mapAsync 的 offset 必须是 4 的倍数，实际是 ${r}。（WebGPU 要求 8 的倍数，这里按更宽松的 4 处理。）`
      );
    if (r + n > this.size)
      throw new c(
        `[gpu-device-api] mapAsync 的范围 [${r}, ${r + n}) 超出了 buffer 大小 ${this.size}。`
      );
    if (e === "read") {
      const i = new ArrayBuffer(n);
      this.download(r, new Uint8Array(i)), this.mapping = { mode: e, offset: r, size: n, data: i, dirty: !1 };
    } else
      this.mapping = { mode: e, offset: r, size: n, data: new ArrayBuffer(n), dirty: !0 };
    return this.mapping.data;
  }
  getMappedRange(e = 0, r) {
    const n = this.mapping;
    if (!n)
      throw new c(
        `[gpu-device-api] buffer「${this.label}」尚未映射，请先 await mapAsync()。`
      );
    if (e === 0 && r === void 0) return n.data;
    const i = r ?? n.size - e;
    if (e < 0 || i <= 0 || e + i > n.size)
      throw new c(
        `[gpu-device-api] getMappedRange(${e}, ${i}) 超出已映射范围 ${n.size}。`
      );
    return n.data.slice(e, e + i);
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
  upload(e, r) {
    this.withTarget(() => this.gl.bufferSubData(this.bindingTarget, e, r));
  }
  /**
   * 读回一段数据（`Queue` 的同步读回、拷贝与映射读取都走这里）。
   *
   * `getBufferSubData` 接受任意 buffer 绑定目标，所以索引缓冲也能用 `ELEMENT_ARRAY_BUFFER` 读回。
   */
  download(e, r) {
    this.withTarget(() => this.gl.getBufferSubData(this.bindingTarget, e, r));
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
      throw new c(
        `[gpu-device-api] buffer「${this.label}」已销毁，不能再调用 ${e}()。这种情况通常是资源在 device.dispose() 之后仍被使用。`
      );
  }
}
const He = 6403, Ye = 33319, Co = 6407, we = 6408, ve = 36244, xe = 33320, ye = 36249, vt = 6402, Bo = 34041, he = 5121, Te = 5120, Ke = 5123, xt = 5122, Be = 5125, yt = 5124, Qe = 5126, Tt = 5131, Fo = 33640, Ro = 34042, Mo = 33321, Go = 36756, Uo = 33330, Oo = 33329, Do = 33332, Vo = 33331, Io = 33325, No = 33323, zo = 36757, ko = 33336, Wo = 33335, jo = 33334, qo = 33333, Xo = 33326, Ho = 33338, Yo = 33337, Ko = 33327, Qo = 32856, Zo = 35907, Jo = 36759, el = 36220, tl = 36222, rl = 32857, nl = 35898, il = 33340, sl = 33339, al = 33328, ol = 36214, ll = 36216, ul = 34842, cl = 36208, hl = 36226, dl = 34836, fl = 33189, pl = 33190, ml = 35056, gl = 36012;
function v(t, e, r, n, i = {}) {
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
const bl = Object.freeze({
  r8unorm: v(Mo, He, he, 1, { uploadType: "Uint8Array" }),
  r8snorm: v(Go, He, Te, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: v(Uo, ve, he, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: v(Oo, ve, Te, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: v(Do, ve, Ke, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: v(Vo, ve, xt, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: v(Io, He, Tt, 2, { uploadType: "Uint16Array" }),
  rg8unorm: v(No, Ye, he, 2, { uploadType: "Uint8Array" }),
  rg8snorm: v(zo, Ye, Te, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: v(ko, xe, he, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: v(Wo, xe, Te, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: v(jo, ve, Be, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: v(qo, ve, yt, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: v(Xo, He, Qe, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: v(Ho, xe, Ke, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: v(Yo, xe, xt, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: v(Ko, Ye, Tt, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: v(Qo, we, he, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": v(Zo, we, he, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: v(Jo, we, Te, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: v(el, ye, he, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: v(tl, ye, Te, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: v(rl, we, Fo, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: v(nl, Co, Be, 4, { attachment: !1, uploadType: null }),
  rg32uint: v(il, xe, Be, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: v(sl, xe, yt, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: v(al, Ye, Qe, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: v(ol, ye, Ke, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: v(ll, ye, xt, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: v(ul, we, Tt, 8, { uploadType: "Uint16Array" }),
  rgba32uint: v(cl, ye, Be, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: v(hl, ye, yt, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: v(dl, we, Qe, 16, { uploadType: "Float32Array" }),
  depth16unorm: v(fl, vt, Ke, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: v(pl, vt, Be, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": v(ml, Bo, Ro, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: v(gl, vt, Qe, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), wl = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function D(t) {
  const e = wl[t];
  if (e)
    throw new c(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const r = bl[t];
  if (!r)
    throw new c(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return r;
}
function vl(t) {
  return D(t).attachment;
}
function xl(t, e) {
  const r = D(t);
  if (r.uploadType === null)
    throw new c(
      `[gpu-device-api] 纹理格式「${t}」不支持从主机内存上传。`
    );
  const n = e.constructor.name;
  if (n !== r.uploadType) {
    const i = t === "rgba16float" || t === "r16float" || t === "rg16float" ? "（该格式是 half float，需要先把 Float32 转成 Uint16 位模式，可用 Float32Array 与 Uint16Array 共享同一段内存来做转换。）" : "";
    throw new c(
      `[gpu-device-api] 纹理格式「${t}」要求主机数据是 ${r.uploadType}，实际传入 ${n}。${i}`
    );
  }
}
class Wn {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, r) {
    const n = Kt(e, r);
    if (n.baseMipLevel + n.mipLevelCount > e.mipLevelCount)
      throw new c(
        `[gpu-device-api] texture view 的 mip 范围 [${n.baseMipLevel}, ${n.baseMipLevel + n.mipLevelCount}) 超出了纹理「${e.label}」的 ${e.mipLevelCount} 层。`
      );
    if (n.baseArrayLayer + n.arrayLayerCount > e.depthOrArrayLayers)
      throw new c(
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
function yl(t, e) {
  if (t === "1d")
    throw new c(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class hr {
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
    const s = Yt(n.size);
    if (Oe(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new c(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = D(n.format), o = n.dimension ?? st.D2, l = n.sampleCount ?? 1, u = n.mipLevelCount ?? 1;
    if (l > 1) {
      if (o !== st.D2 || s.depthOrArrayLayers > 1)
        throw new c(
          "[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: '2d'` 且 `depthOrArrayLayers: 1`）。"
        );
      if (u > 1)
        throw new c("[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。");
    }
    if (u > 1) {
      const f = Math.floor(Math.log2(Math.max(s.width, s.height))) + 1;
      if (u > f)
        throw new c(
          `[gpu-device-api] mipLevelCount=${u} 超过了 ${s.width}x${s.height} 能容纳的最大层数 ${f}。`
        );
    }
    this.label = n.label ?? R("texture"), this.dimension = o, this.format = n.format, this.usage = n.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = u, this.sampleCount = l, this.glTarget = yl(o, s.depthOrArrayLayers);
    const h = e.createTexture();
    if (!h) throw new c("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = h, e.bindTexture(this.glTarget, h), l > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === st.D3 ? e.texStorage3D(
      this.glTarget,
      u,
      a.internalFormat,
      s.width,
      s.height,
      s.depthOrArrayLayers
    ) : s.depthOrArrayLayers > 1 ? e.texStorage3D(
      this.glTarget,
      u,
      a.internalFormat,
      s.width,
      s.height,
      s.depthOrArrayLayers
    ) : e.texStorage2D(this.glTarget, u, a.internalFormat, s.width, s.height), this.applyDefaultSamplerParameters();
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
      throw new c(`[gpu-device-api] 纹理「${this.label}」已销毁，不能再创建 view。`);
    const r = new Wn(this, e);
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
const Tl = {
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
}, jn = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, Sl = {
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
}, Ze = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, dr = {
  front: 1028,
  back: 1029
}, $l = {
  ccw: 2305,
  cw: 2304
}, St = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, fr = {
  nearest: 9728,
  linear: 9729
}, Ll = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, pr = 5121, mr = 5120, gr = 5123, br = 5122, Al = 5125, _l = 5124, El = 5126, Pl = 5131, Cl = {
  float32: { type: El, normalized: !1, integer: !1 },
  float16: { type: Pl, normalized: !1, integer: !1 },
  unorm8: { type: pr, normalized: !0, integer: !1 },
  snorm8: { type: mr, normalized: !0, integer: !1 },
  uint8: { type: pr, normalized: !1, integer: !0 },
  sint8: { type: mr, normalized: !1, integer: !0 },
  unorm16: { type: gr, normalized: !0, integer: !1 },
  snorm16: { type: br, normalized: !0, integer: !1 },
  uint16: { type: gr, normalized: !1, integer: !0 },
  sint16: { type: br, normalized: !1, integer: !0 },
  uint32: { type: Al, normalized: !1, integer: !0 },
  sint32: { type: _l, normalized: !1, integer: !0 }
}, Bl = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function Fl(t) {
  const e = Bl.exec(t);
  if (!e)
    throw new c(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const r = Cl[e[1]];
  if (!r)
    throw new c(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: pe(t).components,
    type: r.type,
    normalized: r.normalized,
    integer: r.integer
  };
}
function ot(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return Ml(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const r = t;
    return [r[0] ?? 0, r[1] ?? 0, r[2] ?? 0, r[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const Rl = {
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
function Ml(t) {
  const e = t.trim().toLowerCase(), r = Rl[e];
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
  throw new c(
    `[gpu-device-api] 无法解析颜色「${t}」。支持 CSS 十六进制、rgb()/rgba()、少量颜色名、0xRRGGBB、[r,g,b,a] 与 { r, g, b, a }。`
  );
}
class Gl {
  label;
  descriptor;
  native;
  gl;
  state;
  _disposed = !1;
  constructor(e, r, n = {}) {
    this.gl = e, this.state = r, this.descriptor = on(n), this.label = n.label ?? R("sampler");
    const i = e.createSampler();
    if (!i) throw new c("[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。");
    this.native = i;
    const s = this.descriptor;
    if (e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, fr[s.minFilter]), e.samplerParameteri(i, e.TEXTURE_MAG_FILTER, fr[s.magFilter]), s.minFilter === "linear" && s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR) : s.minFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_NEAREST) : s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_LINEAR) : e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST), e.samplerParameteri(i, e.TEXTURE_WRAP_S, St[s.addressModeU]), e.samplerParameteri(i, e.TEXTURE_WRAP_T, St[s.addressModeV]), e.samplerParameteri(i, e.TEXTURE_WRAP_R, St[s.addressModeW]), e.samplerParameterf(i, e.TEXTURE_MIN_LOD, s.lodMinClamp), e.samplerParameterf(i, e.TEXTURE_MAX_LOD, s.lodMaxClamp), s.compare !== void 0 ? (e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(i, e.TEXTURE_COMPARE_FUNC, jn[s.compare])) : e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.NONE), s.maxAnisotropy > 1) {
      const a = e.getExtension("EXT_texture_filter_anisotropic");
      if (a) {
        const o = $o(e);
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
class Ul {
  label;
  source;
  defines;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? R("shaderModule"), this.source = ln(e.code), this.defines = e.defines ? { ...e.defines } : {};
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
class wr {
  label;
  entries;
  sortedEntries;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? R("bindGroupLayout"), this.sortedEntries = un(e.entries), this.entries = this.sortedEntries;
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
class Ol {
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
        throw new c(
          `[gpu-device-api] BindGroup「${this.label}」里 binding ${r.binding} 出现了多次。`
        );
      e.add(r.binding);
      const n = this.layout.entry(r.binding);
      if (!n)
        throw new c(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${r.binding} 在布局「${this.layout.label}」里没有声明。布局声明的 binding：${this.layout.sortedEntries.map((o) => o.binding).join("、")}。`
        );
      const i = r.resource, s = "buffer" in i ? "buffer" : "sampler" in i ? "sampler" : "view" in i ? "texture" : "unknown", a = n.type === "uniform" || n.type === "storage" || n.type === "read-only-storage" ? "buffer" : n.type === "texture" || n.type === "storage-texture" ? "texture" : "sampler";
      if (s !== a)
        throw new c(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${r.binding} 类型不匹配：布局要求 ${a}，实际给了 ${s}。`
        );
    }
  }
}
class vr {
  label;
  bindGroupLayouts;
  isAuto;
  plan;
  constructor(e, r, n) {
    if (this.label = e.label ?? R("pipelineLayout"), this.bindGroupLayouts = [...e.bindGroupLayouts], this.isAuto = r, this.bindGroupLayouts.length > 4)
      throw new c(
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
function xr(t, e) {
  return `${t}:${e}`;
}
function Dl(t, e) {
  const r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((l, u) => {
    const h = [...l].sort((d, p) => d.binding - p.binding), f = h.filter((d) => d.type === F.Sampler || d.type === F.ComparisonSampler);
    for (const d of h)
      switch (i.push(`${u}:${d.binding}:${d.type}:${d.name ?? ""}:${d.buffer?.hasDynamicOffset ? "dyn" : ""}`), d.type) {
        case F.Uniform: {
          if (!d.name)
            throw new c(
              `[gpu-device-api] group ${u} 的 binding ${d.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new c(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          r.set(xr(u, d.binding), {
            group: u,
            binding: d.binding,
            name: d.name,
            blockBinding: s++,
            dynamic: d.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: d.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case F.Texture: {
          if (!d.name)
            throw new c(
              `[gpu-device-api] group ${u} 的 binding ${d.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new c(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const p = Vl(d, f);
          n.set(xr(u, d.binding), {
            group: u,
            binding: d.binding,
            name: d.name,
            unit: a++,
            samplerBinding: p ? p.binding : null,
            samplerName: p ? p.name ?? null : null
          });
          break;
        }
        case F.Sampler:
        case F.ComparisonSampler:
          break;
        case F.Storage:
        case F.ReadOnlyStorage:
          throw new c(
            `[gpu-device-api] group ${u} 的 binding ${d.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case F.StorageTexture:
          throw new c(
            `[gpu-device-api] group ${u} 的 binding ${d.binding} 是 storage texture，WebGL2 不支持。请改用「渲染到纹理 + 采样」的方式。`
          );
        default: {
          const p = d.type;
          throw new c(`[gpu-device-api] 未知的 binding 类型：${String(p)}`);
        }
      }
  });
  const o = new Set(
    [...n.values()].map((l) => l.samplerBinding).filter((l) => l !== null)
  );
  for (const [l, u] of t.entries())
    for (const h of u)
      if ((h.type === F.Sampler || h.type === F.ComparisonSampler) && !o.has(h.binding))
        throw new c(
          `[gpu-device-api] group ${l} 的 sampler binding ${h.binding}` + (h.name ? `（「${h.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  return {
    uniformBlocks: r,
    textures: n,
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function Vl(t, e) {
  const r = t.name ?? "", n = e.find((i) => i.name === `${r}_sampler`);
  return n || e.find((i) => i.binding === t.binding + 1);
}
class Il {
  plans = /* @__PURE__ */ new Map();
  limits;
  constructor(e) {
    this.limits = e;
  }
  /** 按布局内容取计划，未命中则构建。 */
  get(e) {
    const r = e.map(
      (s, a) => [...s].sort((o, l) => o.binding - l.binding).map((o) => `${a}:${o.binding}:${o.type}:${o.name ?? ""}:${o.buffer?.hasDynamicOffset ? "dyn" : ""}`).join(",")
    ).join(";"), n = this.plans.get(r);
    if (n) return n;
    const i = Dl(e, this.limits);
    return this.plans.set(r, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
class Nl {
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
    const a = this.gl, o = this.compileShader(a.VERTEX_SHADER, r, `${e} / vertex`), l = this.compileShader(a.FRAGMENT_SHADER, n, `${e} / fragment`), u = a.createProgram();
    if (!u)
      throw a.deleteShader(o), a.deleteShader(l), new c("[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。");
    if (a.attachShader(u, o), a.attachShader(u, l), a.linkProgram(u), a.detachShader(u, o), a.detachShader(u, l), a.deleteShader(o), a.deleteShader(l), !a.getProgramParameter(u, a.LINK_STATUS)) {
      const p = a.getProgramInfoLog(u) ?? "(无日志)";
      throw a.deleteProgram(u), new c(
        `[gpu-device-api] program「${e}」链接失败。vertex 与 fragment 的 varying（in/out）名字、
类型与数量必须完全对应。
GL 日志：${p}`
      );
    }
    const f = mo(a, u), d = {
      program: u,
      reflection: f,
      blockBindings: /* @__PURE__ */ new Map(),
      samplerLocations: /* @__PURE__ */ new Map(),
      optimizedOutBlocks: [],
      label: e,
      boundPlanKey: null
    };
    return this.programs.set(i, d), d;
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
      throw new c(`[gpu-device-api] gl.createShader() 返回 null（${n}）。`);
    if (i.shaderSource(s, r), i.compileShader(s), !i.getShaderParameter(s, i.COMPILE_STATUS)) {
      const a = i.getShaderInfoLog(s) ?? "(无日志)";
      throw i.deleteShader(s), new c(`[gpu-device-api] 着色器编译失败（${n}）：
${a}

----- 源码 -----
${zl(r)}`);
    }
    return s;
  }
  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  bindResources(e, r, n, i) {
    const s = this.gl, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), l = [], u = new Set(r.uniformBlocks.map((f) => f.name));
    if (n)
      for (const [f, d] of n.uniformBlocks) {
        if (!u.has(d.name)) {
          l.push(d.name);
          continue;
        }
        const p = s.getUniformBlockIndex(e, d.name);
        if (p === s.INVALID_INDEX) {
          l.push(d.name);
          continue;
        }
        s.uniformBlockBinding(e, p, d.blockBinding), a.set(f, d.blockBinding);
      }
    const h = r.uniforms.filter((f) => kn(f.glType));
    if (n)
      for (const [, f] of n.textures) {
        const d = h.find((p) => p.name === f.name)?.location ?? s.getUniformLocation(e, f.name);
        d && (s.uniform1i(d, f.unit), o.set(f.name, d));
      }
    if (n) {
      const f = new Set([...n.uniformBlocks.values()].map((g) => g.name)), d = r.uniformBlocks.map((g) => g.name).filter((g) => !f.has(g));
      if (d.length > 0)
        throw new c(
          `[gpu-device-api] program「${i}」使用了未声明的 uniform block：${d.join("、")}。
布局里声明的块名：${[...f].join("、") || "(空)"}。
WebGL2 后端靠 \`BindGroupLayoutEntry.name\` 去定位 GLSL 的 uniform block，请检查两边的名字是否一致（注意 GLSL 里块名与实例名是两回事，这里要的是**块名**）。`
        );
      const p = new Set([...n.textures.values()].map((g) => g.name)), m = h.map((g) => g.name.replace(/\[0\]$/, "")).filter((g) => !p.has(g));
      if (m.length > 0)
        throw new c(
          `[gpu-device-api] program「${i}」使用了未声明的 sampler：${m.join("、")}。
布局里声明的纹理名：${[...p].join("、") || "(空)"}。
请为每个 sampler 增加一个 \`type: 'texture'\` 的布局条目并填上 \`name\`。`
        );
    } else {
      if (r.uniformBlocks.length > 0)
        throw new c(
          `[gpu-device-api] program「${i}」使用了 uniform block（${r.uniformBlocks.map((f) => f.name).join("、")}），但管线没有声明任何 bind group layout。`
        );
      if (h.length > 0)
        throw new c(
          `[gpu-device-api] program「${i}」使用了 sampler（${h.map((f) => `${f.name}: ${fo(f.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: l };
  }
}
function zl(t) {
  const e = t.split(`
`), r = String(e.length).length;
  return e.map((n, i) => `${String(i + 1).padStart(r, " ")} | ${n}`).join(`
`);
}
function kl(t, e) {
  const r = t.depthStencil, n = r !== void 0 && r.format !== null, i = n && e.depth, s = t.render?.blend, a = t.fragment?.targets, l = a?.find((d) => d?.blend)?.blend ?? s;
  let u = null;
  l && (u = {
    colorSrc: Je(l.color.srcFactor, "color.srcFactor"),
    colorDst: Je(l.color.dstFactor, "color.dstFactor"),
    colorOp: l.color.operation ? Ze[l.color.operation] : Ze.add,
    alphaSrc: Je(l.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: Je(l.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: l.alpha.operation ? Ze[l.alpha.operation] : Ze.add
  });
  const h = a?.[0]?.writeMask ?? t.render?.writeMask ?? re.All, f = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    depthWrite: r?.depthWriteEnabled ?? !0,
    depthCompare: jn[r?.depthCompare ?? "less"],
    depthBias: [r?.depthBiasSlopeScale ?? 0, r?.depthBias ?? 0, r?.depthBiasClamp ?? 0],
    stencilEnabled: n && e.stencil,
    blend: u,
    writeMask: [
      (h & re.Red) !== 0,
      (h & re.Green) !== 0,
      (h & re.Blue) !== 0,
      (h & re.Alpha) !== 0
    ],
    cullEnabled: f !== "none",
    cullFace: f === "none" ? dr.back : dr[f],
    frontFace: $l[t.primitive?.frontFace ?? "ccw"]
  };
}
function Wl(t, e, r = 0) {
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
function Je(t, e) {
  const r = Sl[t];
  if (r === void 0)
    throw new c(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return r;
}
class jl {
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
      throw new c(
        "[gpu-device-api] WebGL2 后端不支持只有深度、没有片元着色器的管线（GL 的 program 必须同时链接两个阶段）。\n请提供一个写深度或写颜色的片元着色器；若只想写深度，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    this.label = e.label ?? R("renderPipeline"), this.descriptor = e, this.layout = n, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.program = r, this.plan = n === "auto" ? null : n.bindingPlan ?? null, this.topologyMode = Tl[e.primitive?.topology ?? "triangle-list"];
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
    const r = e.depthFormat ?? null, n = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${r ?? "none"}|${n}|${hn(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const h of i) cn(h, this.limits);
    const o = new Set(i.flatMap((h) => h.attributes.map((f) => f.shaderLocation))), l = new Set(this.program.reflection.attributes.map((h) => h.location));
    for (const h of l)
      if (!o.has(h))
        throw new c(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${h}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const u = {
      key: s,
      renderState: kl(this.descriptor, {
        depth: r !== null,
        stencil: r === "depth24plus-stencil8"
      }),
      depthFormat: r,
      sampleCount: n,
      vertexLayouts: i,
      vertexArrays: /* @__PURE__ */ new Map()
    };
    return this.variantCache.set(s, u), u;
  }
  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(e = {}) {
    return this.resolveVariant(e).renderState;
  }
  /** 把该管线的固定功能状态写入 GL 状态缓存。 */
  applyState(e, r = 0) {
    this.state.useProgram(this.program.program), Wl(this.state, e.renderState, r);
  }
  /**
   * 取得（必要时创建）一个顶点数组对象。
   *
   * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
   * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
   */
  acquireVertexArray(e, r, n) {
    const i = e.vertexLayouts;
    if (i.length === 0) return null;
    const s = ql(i, r, n), a = e.vertexArrays.get(s);
    if (a) return a;
    const o = this.gl, l = o.createVertexArray();
    if (!l)
      throw new c("[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。");
    this.state.bindVertexArray(l);
    for (let u = 0; u < i.length; u++) {
      const h = i[u], f = r[u];
      if (!h || !f) continue;
      o.bindBuffer(o.ARRAY_BUFFER, f.buffer.native);
      const d = h.stepMode === "instance" ? 1 : 0;
      for (const p of h.attributes) {
        const m = Fl(p.format), g = f.offset + p.offset;
        o.enableVertexAttribArray(p.shaderLocation), m.integer ? o.vertexAttribIPointer(p.shaderLocation, m.size, m.type, h.arrayStride, g) : o.vertexAttribPointer(
          p.shaderLocation,
          m.size,
          m.type,
          m.normalized,
          h.arrayStride,
          g
        ), o.vertexAttribDivisor(p.shaderLocation, d);
      }
    }
    return n && o.bindBuffer(o.ELEMENT_ARRAY_BUFFER, n), this.state.invalidateBufferBindings(), e.vertexArrays.set(s, l), l;
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
function ql(t, e, r) {
  const n = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      n.push(`${i}:-`);
      continue;
    }
    dt(s.offset, "setVertexBuffer 的 offset"), n.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return n.push(`idx:${r ? Hl(r) : "-"}`), n.join("|");
}
const yr = /* @__PURE__ */ new WeakMap();
let Xl = 1;
function Hl(t) {
  let e = yr.get(t);
  return e === void 0 && (e = Xl++, yr.set(t, e)), e;
}
class Yl {
  label;
  descriptor;
  layout = "auto";
  constructor(e) {
    throw this.label = e.label ?? "computePipeline", this.descriptor = e, new c(
      `[gpu-device-api] WebGL2 后端不支持 compute pipeline（管线「${this.label}」）。
计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算。`
    );
  }
  get native() {
    throw new c("[gpu-device-api] WebGL2 没有 compute pipeline。");
  }
  get disposed() {
    return !0;
  }
  resolve() {
    throw new c("[gpu-device-api] WebGL2 没有 compute pipeline。");
  }
  dispose() {
  }
}
function Kl(t, e, r) {
  throw new c(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${r}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function Tr(t) {
  return t instanceof Wn ? t : Kl("texture view", t, "WebGL2TextureView");
}
class Ql {
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
      throw new c(
        `[gpu-device-api] WebGL2 后端不支持多重采样的离屏渲染目标（GL 的多重采样只能渲染到 renderbuffer，无法 resolve 成纹理）。
请把 sampleCount 设为 1，并改用默认帧缓冲的 antialias，或加一层 FXAA / 超采样后处理。`
      );
    const n = e.width ?? r.gl.drawingBufferWidth, i = e.height ?? r.gl.drawingBufferHeight;
    if (n <= 0 || i <= 0)
      throw new c(
        `[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${n}x${i}。未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。`
      );
    this.gl = r.gl, this.state = r.state, this.options = r, this.label = e.label ?? R("renderTarget"), this._width = n, this._height = i, this.mipLevelCount = e.mipLevelCount ?? 1;
    const s = Zl(e.color);
    if (s.length > 4)
      throw new c(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${s.length} 个。`
      );
    for (const l of s)
      if (!D(l).attachment)
        throw new c(
          `[gpu-device-api] 纹理格式「${l}」在 WebGL2 下不能作为颜色附件。`
        );
    this.colorFormats = s;
    const a = Jl(e.depth);
    if (a !== null && !D(a).depth)
      throw new c(`[gpu-device-api] 深度附件格式「${a}」不是深度格式。`);
    this.depthFormat = a;
    const o = r.gl.createFramebuffer();
    if (!o)
      throw new c("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。");
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
      throw new c(
        `[gpu-device-api] 渲染目标「${this.label}」的 framebuffer 不完整（格式组合在 WebGL2 下不受支持）。颜色附件：${this.colorFormats.join("、")}；深度附件：${this.depthFormat ?? "无"}。GL 状态码：0x${n.toString(16)}。`
      );
    if (e.loadOp !== "load" || this.depthTexture !== null && e.depthLoadOp !== "load") {
      if (this.state.setScissor(!1, 0, 0, this._width, this._height), e.loadOp !== "load") {
        const [s, a, o, l] = ot(e.clearColor), u = new Float32Array([s, a, o, l]);
        for (let h = 0; h < this.colorTextures.length; h++)
          r.clearBufferfv(r.COLOR, h, u);
      }
      if (this.depthTexture && e.depthLoadOp !== "load") {
        const s = D(this.depthFormat);
        r.depthMask(!0), s.stencil ? r.clearBufferfi(r.DEPTH_STENCIL, 0, e.clearDepth ?? 1, e.clearStencil ?? 0) : r.clearBufferfv(r.DEPTH, 0, new Float32Array([e.clearDepth ?? 1])), this.state.invalidate();
      }
    }
    r.viewport(0, 0, this._width, this._height), this.state.setViewport(0, 0, this._width, this._height);
  }
  resize(e, r) {
    if (e === this._width && r === this._height) return !1;
    if (e <= 0 || r <= 0)
      throw new c(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${e}x${r}。`);
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
      throw new c(
        `[gpu-device-api] 渲染目标「${this.label}」没有第 ${e} 个颜色附件（共 ${this.colorViews.length} 个）。`
      );
    return r;
  }
  /** 深度附件的 view；没有深度附件时抛错。 */
  depthStencilView() {
    if (!this.depthView)
      throw new c(`[gpu-device-api] 渲染目标「${this.label}」没有深度附件。`);
    return this.depthView;
  }
  createAttachments(e) {
    const r = x.RenderAttachment | x.TextureBinding | x.CopySrc | e;
    this.colorTextures = this.colorFormats.map(
      (n, i) => this.options.createTexture(n, this._width, this._height, r, `${this.label}:color${i}`)
    ), this.depthTexture = this.depthFormat === null ? null : this.options.createTexture(
      this.depthFormat,
      this._width,
      this._height,
      x.RenderAttachment | x.TextureBinding,
      `${this.label}:depth`
    ), this.colorViews = this.colorTextures.map((n) => Tr(n.createView())), this.depthView = this.depthTexture ? Tr(this.depthTexture.createView()) : null;
  }
  attach() {
    const e = this.gl, r = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.framebuffer), this.colorTextures.forEach((n, i) => {
      const s = e.COLOR_ATTACHMENT0 + i;
      n.dimension === "3d" || n.depthOrArrayLayers > 1 ? e.framebufferTextureLayer(e.FRAMEBUFFER, s, n.native, 0, 0) : e.framebufferTexture2D(e.FRAMEBUFFER, s, e.TEXTURE_2D, n.native, 0);
    }), e.drawBuffers(this.colorTextures.map((n, i) => e.COLOR_ATTACHMENT0 + i)), this.depthTexture) {
      const i = D(this.depthFormat).stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
      e.framebufferTexture2D(e.FRAMEBUFFER, i, e.TEXTURE_2D, this.depthTexture.native, 0);
    } else
      e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, null, 0), e.framebufferTexture2D(e.FRAMEBUFFER, e.STENCIL_ATTACHMENT, e.TEXTURE_2D, null, 0);
    e.bindFramebuffer(e.FRAMEBUFFER, r), this.state.invalidate();
  }
}
function Zl(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new c("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function Jl(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
function Sr(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class eu {
  label = "canvas:defaultFramebuffer";
  dimension = st.D2;
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
class tu {
  canvas;
  gl;
  _device = null;
  _format;
  _pixelRatio;
  _width;
  _height;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this._format = e.format ?? "rgba8unorm";
    const r = pn(), n = Me(e.canvas);
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
      throw new c(
        "[gpu-device-api] WebGL2 的背景缓冲采样数由创建 context 时的 `antialias` 选项决定，不能在 configure() 里改。请在 createDevice({ contextAttributes: { antialias: true } }) 里设置。"
      );
    if (e.format !== void 0 && !vl(e.format))
      throw new c(
        `[gpu-device-api] canvas 格式「${e.format}」不能作为颜色附件。`
      );
    const r = e.device;
    if (r.native !== this.gl)
      throw new c(
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
    const r = Me(this.canvas);
    this._width = Math.max(1, Math.floor(r.width * e)), this._height = Math.max(1, Math.floor(r.height * e)), this.applyBackingSize();
  }
  resize() {
    const e = Me(this.canvas), r = Math.max(1, Math.floor(e.width * this._pixelRatio)), n = Math.max(1, Math.floor(e.height * this._pixelRatio));
    return r === this._width && n === this._height ? !1 : (this._width = r, this._height = n, this.applyBackingSize(), !0);
  }
  getCurrentFrameTarget() {
    if (!this._device)
      throw new c(
        "[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。"
      );
    const e = Number(this.gl.getParameter(this.gl.SAMPLES) ?? 1) || 1, r = new eu(
      this._width,
      this._height,
      this._format,
      e,
      x.RenderAttachment
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
class ru {
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
        throw new c(
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
        throw new c(
          `[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`
        );
      if (this.colorFormats = i.map((a) => a.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null, i.some((a) => Sr(a.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && Sr(e.depthStencilAttachment.view))
        this.beginDefaultFramebufferPass(e);
      else {
        const a = r.framebuffers.acquire(e);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, a), this.state.invalidate();
        const o = i[0], l = o.view.texture.width, u = o.view.texture.height;
        this.clearRawAttachments(e, a), this.gl.viewport(0, 0, l, u), this.state.setViewport(0, 0, l, u);
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
      throw new c(
        `[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${e}。`
      );
    const i = this.pipeline;
    if (i && i.layout !== "auto" && r) {
      const s = i.layout.bindGroupLayouts[e];
      if (s && s !== r.layout && !(s.sortedEntries.length === r.layout.sortedEntries.length && s.sortedEntries.every((o, l) => {
        const u = r.layout.sortedEntries[l];
        return o.binding === u.binding && o.type === u.type && o.name === u.name;
      })))
        throw new c(
          `[gpu-device-api] setBindGroup(${e}, ...) 传入的 bind group 与管线「${i.label}」在该 group 上声明的布局不一致（传入「${r.layout.label}」，期望「${s.label}」）。`
        );
    }
    this.bindGroups.set(e, r), n ? this.dynamicOffsets.set(e, [...n]) : this.dynamicOffsets.delete(e);
  }
  setVertexBuffer(e, r, n = 0, i = -1) {
    if (this.assertOpen("setVertexBuffer"), e < 0 || e >= 16)
      throw new c(`[gpu-device-api] setVertexBuffer 的 slot 必须在 0..15 之间，实际是 ${e}。`);
    if (r && r.isIndexBuffer)
      throw new c(
        `[gpu-device-api] buffer「${r.label}」是以 \`BufferUsage.Index\` 创建的索引缓冲，WebGL2 里一个 buffer 的绑定目标在创建时就永久固定（索引缓冲只能用 ELEMENT_ARRAY_BUFFER），所以它不能再当顶点缓冲使用。请为顶点数据单独创建一个 buffer。`
      );
    this.vertexBuffers[e] = r ? { buffer: r, offset: n, size: i } : null;
  }
  setIndexBuffer(e, r, n = 0, i = -1) {
    if (this.assertOpen("setIndexBuffer"), !e.isIndexBuffer)
      throw new c(
        `[gpu-device-api] buffer「${e.label}」的 usage 里没有 \`BufferUsage.Index\`，而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 \`BufferUsage.Index\`。`
      );
    this.indexBuffer = { buffer: e, format: r, offset: n, size: i };
  }
  setViewport(e, r, n, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), (s !== 0 || a !== 1) && this.gl.depthRange(s, a), this.state.setViewport(e, r, n, i);
  }
  setScissorRect(e, r, n, i) {
    this.assertOpen("setScissorRect"), this.state.setScissor(!0, e, r, n, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(ot(e));
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
      throw new c(
        "[gpu-device-api] drawIndexed() 之前必须先调用 setIndexBuffer()。"
      );
    this.assertNoUnsupportedInstancing(e.firstInstance ?? 0, e.baseVertex ?? 0);
    const i = e.instanceCount ?? 1, s = n.offset + (e.firstIndex ?? 0) * Mi(n.format);
    this.beginDraw(r, n), this.gl.drawElementsInstanced(
      r.mode,
      e.indexCount,
      Ll[n.format],
      s,
      i
    ), this.options.onDraw?.();
  }
  drawIndirect(e, r = 0) {
    throw this.assertOpen("drawIndirect"), new c(
      "[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 draw() 提交，或改用 WebGPU 后端。"
    );
  }
  drawIndexedIndirect(e, r = 0) {
    throw this.assertOpen("drawIndexedIndirect"), new c(
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
      throw new c(
        `[gpu-device-api] ${e}() 之前必须先调用 setPipeline()。`
      );
    return this.pipeline;
  }
  assertNoUnsupportedInstancing(e, r) {
    if (e !== 0)
      throw new c(
        "[gpu-device-api] WebGL2 不支持 `firstInstance`（缺少 drawArraysInstancedBaseInstance）。请把实例数据整体前移，或改用 WebGPU 后端。"
      );
    if (r !== 0)
      throw new c(
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
        const s = [...r.uniformBlocks.values()].filter((l) => l.group === n && l.dynamic).sort((l, u) => l.binding - u.binding), a = this.dynamicOffsets.get(n) ?? [];
        if (s.length > 0 && a.length < s.length)
          throw new c(
            `[gpu-device-api] setBindGroup(${n}, ...) 缺少动态偏移：布局里有 ${s.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${a.length} 个偏移值。`
          );
        let o = 0;
        for (const l of r.uniformBlocks.values()) {
          if (l.group !== n) continue;
          const u = i.entry(l.binding);
          if (!u)
            throw new c(
              `[gpu-device-api] bind group「${i.label}」缺少 binding ${l.binding}（布局要求提供 uniform buffer）。`
            );
          const h = u.resource, f = h.buffer, d = h.offset ?? 0;
          if (l.dynamic) {
            const p = this.state.context.getParameter(
              this.gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT
            ), m = a[o++] ?? 0;
            if (p > 0 && m % p !== 0)
              throw new c(
                `[gpu-device-api] 动态偏移 ${m} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${p}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
              );
            const g = d + m, b = h.size ?? f.size - g;
            this.state.bindUniformBuffer(l.blockBinding, f.native, g, b);
          } else
            this.state.bindUniformBuffer(l.blockBinding, f.native, 0, -1);
        }
        for (const l of r.textures.values()) {
          if (l.group !== n) continue;
          const u = i.entry(l.binding);
          if (!u)
            throw new c(
              `[gpu-device-api] bind group「${i.label}」缺少 binding ${l.binding}（布局要求提供纹理「${l.name}」）。`
            );
          const h = u.resource.view;
          if (this.assertViewRangeSupported(h), this.state.bindTexture(l.unit, h.target, h.glTexture), l.samplerBinding !== null) {
            const f = i.entry(l.samplerBinding);
            if (!f)
              throw new c(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${l.samplerBinding}（纹理「${l.name}」配套的 sampler「${l.samplerName ?? "未命名"}」）。`
              );
            const d = f.resource.sampler;
            this.state.bindSampler(l.unit, d.native);
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
      throw new c(
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
      throw new c(
        `[gpu-device-api] WebGL2 后端不支持在绑定时指定 mip 子范围（纹理「${n.label}」的 view 指定了 baseMipLevel=${r.baseMipLevel}, mipLevelCount=${r.mipLevelCount}）。mip 范围是纹理对象自身的状态，不是绑定点状态。请为需要的 mip 范围单独创建一张纹理。`
      );
  }
  /** 原始附件（不走 RenderTarget）路径下的清屏。 */
  clearRawAttachments(e, r) {
    const n = this.gl;
    this.state.setScissor(!1, 0, 0, n.drawingBufferWidth, n.drawingBufferHeight), e.colorAttachments.forEach((a, o) => {
      if (!a || a.loadOp === "load") return;
      const [l, u, h, f] = ot(a.clearValue);
      n.clearBufferfv(n.COLOR, o, new Float32Array([l, u, h, f]));
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
      const [o, l, u, h] = ot(s.clearValue);
      r.clearColor(o, l, u, h), r.clear(r.COLOR_BUFFER_BIT);
    }
    const a = e.depthStencilAttachment;
    a && a.depthLoadOp !== "load" && (r.depthMask(!0), r.clearDepth(a.depthClearValue ?? 1), r.clear(r.DEPTH_BUFFER_BIT)), r.viewport(0, 0, n, i), this.state.setViewport(0, 0, n, i);
  }
  assertOpen(e) {
    if (this._ended)
      throw new c(
        `[gpu-device-api] 渲染通道「${this.label}」已经 end()，不能再调用 ${e}()。`
      );
  }
}
const Fe = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class nu {
  label = "computePass";
  constructor(e) {
    throw new c(Fe);
  }
  get ended() {
    return !0;
  }
  setPipeline(e) {
    throw new c(Fe);
  }
  setBindGroup(e, r, n) {
    throw new c(Fe);
  }
  dispatchWorkgroups(e, r, n) {
    throw new c(Fe);
  }
  dispatchWorkgroupsIndirect(e, r) {
    throw new c(Fe);
  }
  end() {
  }
}
class iu {
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
      throw new c(
        `[gpu-device-api] encoder「${this.label}」里已经有打开的渲染通道了。WebGPU 也只允许同时打开一个通道，请先 end() 再开始下一个。`
      );
    const r = new ru(e, this.passOptions);
    return this.openPass = r, this.passCount += 1, r;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), new nu();
  }
  copyBufferToBuffer(e, r, n, i, s) {
    this.assertOpen("copyBufferToBuffer");
    const a = e, o = n, l = new Uint8Array(s);
    if (a.isIndexBuffer || o.isIndexBuffer) {
      a.download(r, l), o.upload(i, l);
      return;
    }
    this.state.bindCopyReadBuffer(a.native), this.gl.getBufferSubData(this.gl.COPY_READ_BUFFER, r, l), this.state.bindCopyWriteBuffer(o.native), this.gl.bufferSubData(this.gl.COPY_WRITE_BUFFER, i, l);
  }
  copyBufferToTexture(e, r, n) {
    this.assertOpen("copyBufferToTexture");
    const i = this.gl, s = e.buffer, a = r.texture.native, o = r.texture.format, l = D(o), { x: u, y: h, z: f } = et(r.origin), d = e.bytesPerRow ?? n.width * l.bytesPerPixel, p = n.height, m = new Uint8Array(d * p);
    s.download(e.offset ?? 0, m), i.bindTexture(r.texture.target, a), i.pixelStorei(i.UNPACK_ALIGNMENT, 1), d !== n.width * l.bytesPerPixel && i.pixelStorei(i.UNPACK_ROW_LENGTH, d / l.bytesPerPixel);
    const g = r.texture.target;
    g === i.TEXTURE_3D || g === i.TEXTURE_2D_ARRAY ? i.texSubImage3D(
      g,
      r.mipLevel ?? 0,
      u,
      h,
      f,
      n.width,
      n.height,
      n.depthOrArrayLayers,
      l.format,
      l.type,
      m
    ) : i.texSubImage2D(
      g,
      r.mipLevel ?? 0,
      u,
      h,
      n.width,
      n.height,
      l.format,
      l.type,
      m
    ), i.pixelStorei(i.UNPACK_ROW_LENGTH, 0), i.pixelStorei(i.UNPACK_ALIGNMENT, 4), this.state.invalidate();
  }
  copyTextureToBuffer(e, r, n) {
    this.assertOpen("copyTextureToBuffer");
    const i = this.gl, s = e.texture, a = D(s.format), o = mn(
      r.bytesPerRow ?? n.width * a.bytesPerPixel,
      4
    ), l = new Uint8Array(o * n.height), u = i.createFramebuffer();
    if (!u)
      throw new c("[gpu-device-api] gl.createFramebuffer() 返回 null，无法读回纹理。");
    const h = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, u);
    const f = a.depth ? i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0;
    i.framebufferTexture2D(i.FRAMEBUFFER, f, i.TEXTURE_2D, s.native, e.mipLevel ?? 0);
    const d = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (d !== i.FRAMEBUFFER_COMPLETE)
      throw i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(u), new c(
        `[gpu-device-api] 无法把纹理「${s.label}」作为附件读回（framebuffer 不完整，0x${d.toString(16)}）。请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。`
      );
    i.pixelStorei(i.PACK_ALIGNMENT, 1);
    const { x: p, y: m } = et(e.origin);
    i.readPixels(p, m, n.width, n.height, a.format, a.type, l), i.pixelStorei(i.PACK_ALIGNMENT, 4), i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(u), this.state.invalidate(), r.buffer.upload(r.offset ?? 0, l);
  }
  copyTextureToTexture(e, r, n) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = r.texture, o = D(a.format), { x: l, y: u } = et(e.origin), { x: h, y: f } = et(r.origin), d = i.createFramebuffer(), p = i.createFramebuffer();
    if (!d || !p)
      throw new c("[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。");
    const m = i.getParameter(i.FRAMEBUFFER_BINDING);
    if (i.bindFramebuffer(i.READ_FRAMEBUFFER, d), i.framebufferTexture2D(
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
    ), D(s.format).internalFormat !== o.internalFormat)
      throw new c(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${s.format}」，目标是「${a.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`
      );
    i.blitFramebuffer(
      l,
      u,
      l + n.width,
      u + n.height,
      h,
      f,
      h + n.width,
      f + n.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, m), i.deleteFramebuffer(d), i.deleteFramebuffer(p), this.state.invalidate();
  }
  clearBuffer(e, r = 0, n) {
    this.assertOpen("clearBuffer");
    const i = e, s = n ?? e.size - r, a = new Uint8Array(s);
    i.upload(r, a);
  }
  finish() {
    if (this.assertOpen("finish"), this.openPass && !this.openPass.ended)
      throw new c(
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
      throw new c(
        `[gpu-device-api] encoder「${this.label}」已经 finish()，不能再调用 ${e}()。`
      );
  }
}
function et(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function su(t) {
  const e = t.colorAttachments.map((n) => n ? $r(n) : "-").join(","), r = t.depthStencilAttachment ? $r(t.depthStencilAttachment) : "-";
  return `${e}|${r}`;
}
function $r(t) {
  const e = t.view, r = e.texture;
  return `${e.label}@${r.label}#${r.width}x${r.height}`;
}
class au {
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
    const r = su(e), n = this.framebuffers.get(r);
    if (n) return n;
    const i = this.gl, s = i.createFramebuffer();
    if (!s)
      throw new c("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。");
    const a = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, s);
    let o = 0;
    for (const h of e.colorAttachments) {
      if (!h) continue;
      const f = h.view, d = f.target;
      d === i.TEXTURE_2D ? i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + o, d, f.glTexture, 0) : i.framebufferTextureLayer(
        i.FRAMEBUFFER,
        i.COLOR_ATTACHMENT0 + o,
        f.glTexture,
        f.descriptor.baseMipLevel,
        f.descriptor.baseArrayLayer
      ), o += 1;
    }
    o > 0 && i.drawBuffers(
      Array.from({ length: o }, (h, f) => i.COLOR_ATTACHMENT0 + f)
    );
    const l = e.depthStencilAttachment;
    if (l) {
      const h = l.view, d = D(h.texture.format).stencil ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
      i.framebufferTexture2D(i.FRAMEBUFFER, d, i.TEXTURE_2D, h.glTexture, 0);
    }
    i.bindFramebuffer(i.FRAMEBUFFER, a), i.bindFramebuffer(i.FRAMEBUFFER, s);
    const u = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (i.bindFramebuffer(i.FRAMEBUFFER, a), u !== i.FRAMEBUFFER_COMPLETE)
      throw i.deleteFramebuffer(s), new c(
        `[gpu-device-api] 这组渲染附件在 WebGL2 下不构成完整的 framebuffer（GL 状态码 0x${u.toString(16)}）。
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
class ou {
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
      throw new c(
        `[gpu-device-api] writeBuffer 越界：写入范围 [${r}, ${r + o}) 超出了 buffer「${a.label}」的 ${a.size} 字节。`
      );
    const l = new Uint8Array(n.buffer, n.byteOffset + i, o);
    a.upload(r, Hi(l));
  }
  writeTexture(e, r, n, i) {
    const s = e.texture, a = D(s.format);
    xl(s.format, r);
    const o = Lr(e.origin), l = n.bytesPerRow ?? i.width * a.bytesPerPixel, u = this.gl;
    u.bindTexture(s.target, s.native), u.pixelStorei(u.UNPACK_ALIGNMENT, 1), l !== i.width * a.bytesPerPixel && u.pixelStorei(u.UNPACK_ROW_LENGTH, l / a.bytesPerPixel);
    const h = new Uint8Array(r.buffer, r.byteOffset + n.offset, r.byteLength - n.offset);
    s.target === u.TEXTURE_3D || s.target === u.TEXTURE_2D_ARRAY ? u.texSubImage3D(
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
    ) : u.texSubImage2D(
      s.target,
      e.mipLevel ?? 0,
      o.x,
      o.y,
      i.width,
      i.height,
      a.format,
      a.type,
      h
    ), u.pixelStorei(u.UNPACK_ROW_LENGTH, 0), u.pixelStorei(u.UNPACK_ALIGNMENT, 4), this.state.invalidate();
  }
  copyExternalImageToTexture(e, r, n, i = !1) {
    const s = r.texture, a = D(s.format), o = this.gl, l = Lr(r.origin);
    o.bindTexture(s.target, s.native), o.pixelStorei(o.UNPACK_ALIGNMENT, 1), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, i ? 1 : 0);
    try {
      s.target === o.TEXTURE_3D || s.target === o.TEXTURE_2D_ARRAY ? o.texSubImage3D(
        s.target,
        r.mipLevel ?? 0,
        l.x,
        l.y,
        l.z,
        n.width,
        n.height,
        n.depthOrArrayLayers,
        a.format,
        a.type,
        e
      ) : o.texSubImage2D(
        s.target,
        r.mipLevel ?? 0,
        l.x,
        l.y,
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
    const a = this.gl, o = e, l = n, u = new Uint8Array(s);
    if (o.isIndexBuffer || l.isIndexBuffer) {
      o.download(r, u), l.upload(i, u);
      return;
    }
    this.state.bindCopyReadBuffer(o.native), a.getBufferSubData(a.COPY_READ_BUFFER, r, u), this.state.bindCopyWriteBuffer(l.native), a.bufferSubData(a.COPY_WRITE_BUFFER, i, u);
  }
  copyBufferToTexture(e, r, n) {
    const i = D(r.texture.format), s = e.bytesPerRow ?? n.width * i.bytesPerPixel, a = new Uint8Array(s * n.height);
    e.buffer.download(e.offset ?? 0, a), this.writeTexture(r, a, { offset: 0, bytesPerRow: s }, n);
  }
  submit(e) {
    this.submittedCount += e.length, e.length > 0 && this.gl.flush();
  }
  async onSubmittedWorkDone() {
    await this.pending, this.gl.finish();
  }
}
function Lr(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
class lu {
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
        await uu();
      }
    }
  }
}
function uu() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
class cu {
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
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? Ne("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? R("webgl2Device"), this.limits = fn(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const r = [...e.adapterFeatures], n = new Set(r), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !n.has(a));
    if (i.length > 0)
      throw new c(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${r.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => n.has(a),
      names: r
    }, this.state = new Ao(e.gl), this.planCache = new Il({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new Nl({ gl: e.gl, state: this.state }), this.framebuffers = new au(e.gl), this.queue = new ou(e.gl, this.state), this.lostPromise = new Promise((a) => {
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
      new Po(this.gl, this.state, e, (r) => {
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new hr(this.gl, this.state, e, () => {
        this.framebuffers.clear();
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, r, n, i, s) {
    return this.track(
      new hr(
        this.gl,
        this.state,
        { format: e, size: { width: r, height: n }, usage: i, label: s },
        () => this.framebuffers.clear()
      )
    );
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Gl(this.gl, this.state, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new Ul(e));
  }
  createQuerySet(e) {
    throw this.assertUsable("createQuerySet"), new c(
      `[gpu-device-api] WebGL2 后端暂不支持 query set（「${e.label ?? e.type}」）。WebGL2 的遮挡查询只能同步读回单个样本数，没有查询结果缓冲区的概念。`
    );
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new wr(e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Ol(e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(new vr(e, !1, this));
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const r = e.label ?? "renderPipeline", n = zt({
      backend: "webgl2",
      source: e.vertex.module.source,
      stage: I.Vertex,
      label: r,
      defines: e.vertex.module.defines
    }).code;
    if (!e.fragment)
      throw new c(
        "[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n只写深度时，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    const i = zt({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: I.Fragment,
      label: r,
      defines: e.fragment.module.defines
    }).code, s = this.programs.acquire(r, n, i);
    let a;
    if (e.layout === void 0 || e.layout === "auto") {
      const l = bo(s.reflection, I.Vertex | I.Fragment);
      if (l.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const u = new wr({
          label: `${r}:autoLayout`,
          entries: l
        });
        this.track(u), a = this.track(
          new vr(
            { label: `${r}:autoPipelineLayout`, bindGroupLayouts: [u] },
            !0,
            this
          )
        ), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else
      a = e.layout, this.programs.bindPlan(s, a.bindingPlan);
    const o = new jl(e, s, a, {
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
    return this.assertUsable("createComputePipeline"), new Yl(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    return this.assertUsable("createRenderTarget"), this.track(
      new Ql(e, {
        gl: this.gl,
        state: this.state,
        createTexture: (r, n, i, s, a) => this.createAttachmentTexture(r, n, i, s, a)
      })
    );
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new iu(e, this.gl, this.state, {
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
      throw new c(
        `[gpu-device-api] WebGL2 的 device 只能服务创建它的那个 canvas。
GL context 是从 canvas 上取的，一个 device 对应一个 canvas；如果确实需要渲染到多个 canvas，请为每个 canvas 单独 createDevice()。`
      );
    let n = this.canvasContexts.get(e);
    return n || (n = new tu({ gl: this.gl, canvas: e, format: r?.format }), this.canvasContexts.set(e, n)), n.configure({ ...r, device: this }), this.state.invalidate(), n;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new lu(this.gl);
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
      new oe(`[gpu-device-api] GL 错误 0x${r.toString(16)}（发生在 ${e} 之后）。`, {
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
      throw new Ot(`[gpu-device-api] 设备已 dispose()，不能再调用 ${e}()。`, {
        reason: "destroyed"
      });
  }
}
const hu = {
  antialias: !0,
  alpha: !1,
  depth: !0,
  stencil: !1,
  premultipliedAlpha: !0,
  preserveDrawingBuffer: !1,
  powerPreference: "high-performance",
  desynchronized: !1
};
class er {
  info;
  features;
  limits;
  gl;
  canvas;
  logger;
  device = null;
  constructor(e, r, n, i, s) {
    this.gl = e, this.canvas = r, this.limits = n, this.features = i, this.logger = s;
    const a = So(e);
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
    const r = { ...hu, ...e.contextAttributes }, n = Lo(e.canvas, r), i = yo(n), s = To(n);
    return new er(n, e.canvas, i, s, e.logger);
  }
  /** 已经为这个 canvas 创建过 GL context（用于避免重复初始化）。 */
  get context() {
    return this.gl;
  }
  async requestDevice(e = {}) {
    if (this.device && !this.device.disposed)
      throw new c(
        `[gpu-device-api] 这个 WebGL2 adapter 已经创建过 device 了。
GL context 与 canvas 是一一对应的，一个 adapter 只能产出一个 device；请复用已有的 device，或为另一个 canvas 单独 requestAdapter()。`
      );
    const r = new cu({
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
const tr = Object.freeze({
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
function w(t, e, r, n = {}) {
  const i = e === "depth" || e === "stencil" ? "depth" : e === "uint" ? "uint" : e === "sint" ? "sint" : "float";
  return {
    gpuFormat: tr[t],
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
const du = Object.freeze({
  r8unorm: w("r8unorm", "unorm", 1, { renderable: !0, filterable: !0 }),
  r8snorm: w("r8snorm", "snorm", 1, { filterable: !1 }),
  r8uint: w("r8uint", "uint", 1, { renderable: !0 }),
  r8sint: w("r8sint", "sint", 1, { renderable: !0 }),
  r16uint: w("r16uint", "uint", 2, { renderable: !0 }),
  r16sint: w("r16sint", "sint", 2, { renderable: !0 }),
  r16float: w("r16float", "float", 2, { renderable: !0, filterable: !0 }),
  rg8unorm: w("rg8unorm", "unorm", 2, { renderable: !0, filterable: !0 }),
  rg8snorm: w("rg8snorm", "snorm", 2, {}),
  rg8uint: w("rg8uint", "uint", 2, { renderable: !0 }),
  rg8sint: w("rg8sint", "sint", 2, { renderable: !0 }),
  r32uint: w("r32uint", "uint", 4, { renderable: !0, storage: !0 }),
  r32sint: w("r32sint", "sint", 4, { renderable: !0, storage: !0 }),
  r32float: w("r32float", "float", 4, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rg16uint: w("rg16uint", "uint", 4, { renderable: !0 }),
  rg16sint: w("rg16sint", "sint", 4, { renderable: !0 }),
  rg16float: w("rg16float", "float", 4, { renderable: !0, filterable: !0 }),
  rgba8unorm: w("rgba8unorm", "unorm", 4, { renderable: !0, storage: !0, filterable: !0 }),
  "rgba8unorm-srgb": w("rgba8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgba8snorm: w("rgba8snorm", "snorm", 4, { storage: !0 }),
  rgba8uint: w("rgba8uint", "uint", 4, { renderable: !0, storage: !0 }),
  rgba8sint: w("rgba8sint", "sint", 4, { renderable: !0, storage: !0 }),
  bgra8unorm: w("bgra8unorm", "unorm", 4, {
    renderable: !0,
    filterable: !0,
    storageFeature: "bgra8unorm-storage"
  }),
  "bgra8unorm-srgb": w("bgra8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgb9e5ufloat: w("rgb9e5ufloat", "float", 4, {}),
  rgb10a2unorm: w("rgb10a2unorm", "unorm", 4, { renderable: !0, filterable: !0 }),
  rg11b10ufloat: w("rg11b10ufloat", "float", 4, { renderFeature: "rg11b10ufloat-renderable" }),
  rg32uint: w("rg32uint", "uint", 8, { renderable: !0, storage: !0 }),
  rg32sint: w("rg32sint", "sint", 8, { renderable: !0, storage: !0 }),
  rg32float: w("rg32float", "float", 8, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rgba16uint: w("rgba16uint", "uint", 8, { renderable: !0, storage: !0 }),
  rgba16sint: w("rgba16sint", "sint", 8, { renderable: !0, storage: !0 }),
  rgba16float: w("rgba16float", "float", 8, { renderable: !0, storage: !0, filterable: !0 }),
  rgba32uint: w("rgba32uint", "uint", 16, { renderable: !0, storage: !0 }),
  rgba32sint: w("rgba32sint", "sint", 16, { renderable: !0, storage: !0 }),
  rgba32float: w("rgba32float", "float", 16, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  depth16unorm: w("depth16unorm", "depth", 2, {
    depthStencilAttachment: !0,
    filterable: !0
  }),
  // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
  // 因此没有确定的内存布局：既不能采样，也不能拷贝。
  depth24plus: w("depth24plus", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  "depth24plus-stencil8": w("depth24plus-stencil8", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  depth32float: w("depth32float", "depth", 4, {
    depthStencilAttachment: !0,
    filterFeature: "float32-filterable"
  }),
  stencil8: w("stencil8", "stencil", 1, {
    depthStencilAttachment: !0,
    sampleable: !1
  })
});
function ge(t) {
  const e = du[t];
  if (!e)
    throw new c(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function Y(t) {
  const e = tr[t];
  if (!e)
    throw new c(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function fu(t) {
  for (const [e, r] of Object.entries(tr))
    if (r === t) return e;
  throw new c(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function qn(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function ft(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function pu(t, e) {
  const r = ge(t);
  return r.filterable ? !0 : r.filterFeature && e ? e.has(r.filterFeature) : !1;
}
function mu(t, e, r) {
  const n = ge(t);
  if (!(n.renderable || n.depthStencilAttachment)) {
    if (n.renderFeature) {
      if (e ? e.has(n.renderFeature) : !1) return;
      throw new c(
        `[gpu-device-api] ${r}: "${t}" requires the "${n.renderFeature}" device feature to be used as a render attachment (it is not enabled on this device).`
      );
    }
    throw new c(
      `[gpu-device-api] ${r}: "${t}" cannot be used as a render attachment in WebGPU (snorm color formats and rgb9e5ufloat have no renderable support).`
    );
  }
}
function gu(t, e, r = !1) {
  const n = ge(t);
  if (r)
    throw new c(
      `[gpu-device-api] ${e}: a multisampled texture ("${t}", sampleCount > 1) cannot be used as a TextureBinding; WebGPU only allows multisampled textures as render attachments.`
    );
  if (!n.sampleable)
    throw n.kind === "stencil" ? new c(
      `[gpu-device-api] ${e}: "stencil8" has no sampleable aspect; bind a depth format instead.`
    ) : new c(
      `[gpu-device-api] ${e}: "${t}" can only be used as a depth/stencil attachment and cannot be sampled (its memory layout is implementation defined). Use "depth32float" or "depth16unorm" when the depth texture has to be read in a shader.`
    );
}
function Xn(t, e, r) {
  const n = ge(t);
  if (!n.storage) {
    if (n.storageFeature) {
      if (e?.has(n.storageFeature)) return;
      throw new c(
        `[gpu-device-api] ${r}: "${t}" requires the "${n.storageFeature}" device feature to be used as a storage texture (it is not enabled on this device).`
      );
    }
    throw new c(
      `[gpu-device-api] ${r}: "${t}" cannot be used as a storage texture. WebGPU only allows r32uint/r32sint/r32float, rg32*, rgba8unorm(-snorm/uint/sint), rgba16*, rgba32* and bgra8unorm (with the bgra8unorm-storage feature).`
    );
  }
}
function bu(t, e) {
  if (!ge(t).copyable)
    throw new c(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function wu(t, e, r) {
  if (e !== "all") {
    if (e === "depth-only" && !qn(t))
      throw new c(
        `[gpu-device-api] ${r}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !ft(t))
      throw new c(
        `[gpu-device-api] ${r}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function vu(t, e, r, n) {
  ge(t);
  const i = r.sampleCount ?? 1;
  if (e & x.RenderAttachment && mu(t, r.features, n), e & x.TextureBinding && gu(t, n, i > 1), e & x.StorageBinding && Xn(t, r.features, n), e & (x.CopySrc | x.CopyDst) && bu(t, n), i > 1) {
    if (i !== 4)
      throw new c(
        `[gpu-device-api] ${n}: sampleCount must be 1 or 4, got ${String(i)}.`
      );
    if ((r.mipLevelCount ?? 1) > 1)
      throw new c(
        `[gpu-device-api] ${n}: a multisampled texture must have exactly one mip level.`
      );
    if (r.dimension !== void 0 && r.dimension !== "2d")
      throw new c(
        `[gpu-device-api] ${n}: a multisampled texture must be "2d", got "${r.dimension}".`
      );
    if (e & (x.CopySrc | x.CopyDst))
      throw new c(
        `[gpu-device-api] ${n}: a multisampled texture cannot be a copy source or destination; resolve it into a single-sampled texture first.`
      );
    if (e & (x.TextureBinding | x.StorageBinding))
      throw new c(
        `[gpu-device-api] ${n}: a multisampled texture can only be used as a render attachment.`
      );
  }
}
const xu = [
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
], yu = Object.freeze({
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
function rr() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function Ar() {
  return rr() !== null;
}
async function Tu(t = {}) {
  const e = rr();
  if (!e) return null;
  const r = {};
  return t.powerPreference !== void 0 && (r.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (r.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (r.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (r.xrCompatible = t.xrCompatible), e.requestAdapter(r);
}
function Su(t) {
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
function Hn(t) {
  const e = t ?? {}, r = {};
  for (const n of xu) {
    const i = e[n];
    r[n] = typeof i == "number" && Number.isFinite(i) ? i : yu[n];
  }
  return r;
}
function $u(t) {
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
function Lu(t, e, r) {
  if (!e || e.length === 0) return [];
  const n = [];
  for (const i of e) {
    if (typeof i != "string" || i.length === 0)
      throw new c(`[gpu-device-api] ${r}: feature names must be non-empty strings.`);
    if (!n.includes(i) && (n.push(i), !t.has(i)))
      throw new c(
        `[gpu-device-api] ${r}: the adapter does not support the "${i}" feature. Available features: ${t.size > 0 ? [...t].sort().join(", ") : "(none)"}.`
      );
  }
  return n;
}
class Au {
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
  const t = rr();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function _u(t) {
  const e = Y(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new c(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function Eu(t) {
  const r = t.getContext.call(t, "webgpu");
  return !r || typeof r.getCurrentTexture != "function" ? null : r;
}
const $t = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, tt = {
  RED: 1,
  GREEN: 2,
  BLUE: 4,
  ALPHA: 8
}, Q = {
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
}, Re = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, Er = {
  READ: 1,
  WRITE: 2
};
function Pu(t) {
  if (!Number.isInteger(t))
    throw new c(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new c(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & I.Vertex && (e |= $t.VERTEX), t & I.Fragment && (e |= $t.FRAGMENT), t & I.Compute && (e |= $t.COMPUTE), e === 0)
    throw new c(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function Cu(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new c(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & re.Red && (e |= tt.RED), t & re.Green && (e |= tt.GREEN), t & re.Blue && (e |= tt.BLUE), t & re.Alpha && (e |= tt.ALPHA), e;
}
function Bu(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new c(
      `[gpu-device-api] BufferUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -1024)
    throw new c(
      `[gpu-device-api] BufferUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  if (t & U.MapRead && t & U.MapWrite)
    throw new c(
      "[gpu-device-api] BufferUsage cannot combine MapRead and MapWrite: WebGPU rejects a buffer that is both mappable for reading and for writing. Use two buffers (or CopyDst plus writeBuffer)."
    );
  let e = 0;
  return t & U.MapRead && (e |= Q.MAP_READ), t & U.MapWrite && (e |= Q.MAP_WRITE), t & U.CopySrc && (e |= Q.COPY_SRC), t & U.CopyDst && (e |= Q.COPY_DST), t & U.Index && (e |= Q.INDEX), t & U.Vertex && (e |= Q.VERTEX), t & U.Uniform && (e |= Q.UNIFORM), t & U.Storage && (e |= Q.STORAGE), t & U.Indirect && (e |= Q.INDIRECT), t & U.QueryResolve && (e |= Q.QUERY_RESOLVE), e;
}
function Yn(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new c(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new c(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & x.CopySrc && (e |= Re.COPY_SRC), t & x.CopyDst && (e |= Re.COPY_DST), t & x.TextureBinding && (e |= Re.TEXTURE_BINDING), t & x.StorageBinding && (e |= Re.STORAGE_BINDING), t & x.RenderAttachment && (e |= Re.RENDER_ATTACHMENT), e;
}
function Fu(t) {
  switch (t) {
    case "read":
      return Er.READ;
    case "write":
      return Er.WRITE;
    default:
      return E(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function Ru(t) {
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
      return E(t, `[gpu-device-api] Unknown PrimitiveTopology "${String(t)}".`);
  }
}
function Mu(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function Kn(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return E(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
  }
}
function nr(t) {
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
      return E(t, `[gpu-device-api] Unknown CompareFunction "${String(t)}".`);
  }
}
function Lt(t) {
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
      return E(t, `[gpu-device-api] Unknown StencilOperation "${String(t)}".`);
  }
}
function Pr(t) {
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
      return E(t, `[gpu-device-api] Unknown BlendFactor "${String(t)}".`);
  }
}
function Gu(t) {
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
      return E(t, `[gpu-device-api] Unknown BlendOperation "${String(t)}".`);
  }
}
function At(t) {
  switch (t) {
    case "clamp-to-edge":
      return "clamp-to-edge";
    case "repeat":
      return "repeat";
    case "mirror-repeat":
      return "mirror-repeat";
    default:
      return E(t, `[gpu-device-api] Unknown AddressMode "${String(t)}".`);
  }
}
function Cr(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return E(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function Uu(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return E(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function Ou(t) {
  switch (t) {
    case "none":
      return "none";
    case "front":
      return "front";
    case "back":
      return "back";
    default:
      return E(t, `[gpu-device-api] Unknown CullMode "${String(t)}".`);
  }
}
function Du(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return E(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function _t(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return E(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function Et(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return E(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function Wt(t) {
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
      return E(t, `[gpu-device-api] Unknown TextureViewDimension "${String(t)}".`);
  }
}
function ir(t) {
  switch (t) {
    case "all":
      return "all";
    case "depth-only":
      return "depth-only";
    case "stencil-only":
      return "stencil-only";
    default:
      return E(t, `[gpu-device-api] Unknown TextureAspect "${String(t)}".`);
  }
}
function Vu(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return E(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function Iu(t) {
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
      return E(t, `[gpu-device-api] Unknown VertexFormat "${String(t)}".`);
  }
}
function Nu(t) {
  switch (t) {
    case Dt.Occlusion:
      return "occlusion";
    case Dt.Timestamp:
      return "timestamp";
    default:
      return E(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function zu(t) {
  switch (t) {
    case "uniform":
      return "uniform";
    case "storage":
      return "storage";
    case "read-only-storage":
      return "read-only-storage";
    default:
      throw new c(
        `[gpu-device-api] BindingType "${String(t)}" is not a buffer binding; expected "uniform", "storage" or "read-only-storage".`
      );
  }
}
function ku(t) {
  switch (t) {
    case "sampler":
      return "filtering";
    case "comparison-sampler":
      return "comparison";
    default:
      throw new c(
        `[gpu-device-api] BindingType "${String(t)}" is not a sampler binding; expected "sampler" or "comparison-sampler".`
      );
  }
}
function Wu(t) {
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
      return E(t, `[gpu-device-api] Unknown TextureSampleType "${String(t)}".`);
  }
}
function ju(t) {
  switch (t) {
    case "write-only":
      return "write-only";
    case "read-only":
      return "read-only";
    case "read-write":
      return "read-write";
    default:
      return E(t, `[gpu-device-api] Unknown StorageTextureAccess "${String(t)}".`);
  }
}
function qu(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return E(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const Xu = {
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
}, Hu = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, Yu = /^rgba?\(([^)]*)\)$/;
function Qn(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return Qu(t);
  if (typeof t == "number") return Ku(t);
  if (Array.isArray(t)) {
    const r = t;
    if (r.length !== 3 && r.length !== 4)
      throw new c(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${r.length}.`
      );
    return Br(r[0], r[1], r[2], r.length === 4 ? r[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new c(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return Br(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function Br(t, e, r, n, i) {
  for (const [s, a] of [
    ["r", t],
    ["g", e],
    ["b", r],
    ["a", n]
  ])
    if (!Number.isFinite(a))
      throw new c(
        `[gpu-device-api] Clear color component "${s}" must be a finite number, got ${String(a)} (from ${JSON.stringify(i)}).`
      );
  return { r: t, g: e, b: r, a: n };
}
function Ku(t) {
  if (!Number.isFinite(t) || !Number.isInteger(t) || t < 0 || t > 16777215)
    throw new c(
      `[gpu-device-api] A numeric clear color must be an integer in 0x000000..0xFFFFFF (0xRRGGBB), got ${String(t)}.`
    );
  return {
    r: (t >> 16 & 255) / 255,
    g: (t >> 8 & 255) / 255,
    b: (t & 255) / 255,
    a: 1
  };
}
function Qu(t) {
  const e = t.trim().toLowerCase(), r = Hu.exec(e);
  if (r) {
    const s = r[1];
    if (s.length === 3 || s.length === 4) {
      const h = parseInt(s[0] + s[0], 16) / 255, f = parseInt(s[1] + s[1], 16) / 255, d = parseInt(s[2] + s[2], 16) / 255, p = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: h, g: f, b: d, a: p };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, l = parseInt(s.slice(4, 6), 16) / 255, u = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: l, a: u };
  }
  const n = Xu[e];
  if (n) return { r: n[0], g: n[1], b: n[2], a: n[3] };
  const i = Yu.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((h) => h.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new c(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = Pt(s[0], t), o = Pt(s[1], t), l = Pt(s[2], t), u = s.length === 4 ? Zu(s[3], t) : 1;
    return { r: a, g: o, b: l, a: u };
  }
  throw new c(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function Pt(t, e) {
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    if (!Number.isFinite(n))
      throw new c(`[gpu-device-api] Clear color "${e}" has an invalid percentage "${t}".`);
    return n / 100;
  }
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new c(`[gpu-device-api] Clear color "${e}" has an invalid component "${t}".`);
  return r / 255;
}
function Zu(t, e) {
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    if (!Number.isFinite(n))
      throw new c(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
    return n / 100;
  }
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new c(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
  return r;
}
function _e(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function Zn(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function Ju(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function ze(t, e) {
  if (t !== 1 && t !== 4)
    throw new c(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class Jn {
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
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? `buffer#${e.nextResourceId("buffer")}`, Oe(r.size, "BufferDescriptor.size"), r.size % 4 !== 0)
      throw new c(
        `[gpu-device-api] BufferDescriptor.size must be a multiple of 4 (WebGPU requires 4-byte aligned buffer sizes), got ${r.size}. Use alignTo4()/paddedCopy() when uploading tightly packed data.`
      );
    if (r.size > e.limits.maxBufferSize)
      throw new c(
        `[gpu-device-api] BufferDescriptor.size ${r.size} exceeds maxBufferSize (${e.limits.maxBufferSize}).`
      );
    this.size = r.size, this.usage = r.usage, this.native = e.native.createBuffer({
      label: this.label,
      size: r.size,
      usage: Bu(r.usage)
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
      throw new c(
        `[gpu-device-api] Buffer "${this.label}" is already mapped; call unmap() before mapping it again.`
      );
    const i = n ?? this.size - r;
    this.assertRange(r, i, "Buffer.mapAsync"), await this.native.mapAsync(Fu(e), r, i), this._mapped = !0;
    const s = this.native.getMappedRange(r, i);
    return this.mappedRange = { offset: r, size: i, data: s }, s;
  }
  /**
   * 当前已映射的范围（偏移量相对于映射起点，与 WebGL2 后端一致）。
   *
   * 不再直接问原生 `GPUBuffer`：同一个范围只能被取一次，重复取会报
   * 「overlaps with previously returned range」。
   */
  getMappedRange(e = 0, r) {
    this.assertUsable("Buffer.getMappedRange");
    const n = this.mappedRange;
    if (!this._mapped || !n)
      throw new c(
        `[gpu-device-api] Buffer "${this.label}" is not mapped; await mapAsync() before calling getMappedRange().`
      );
    const i = r ?? n.size - e;
    return this.assertRange(e, i, "Buffer.getMappedRange", n.size), e === 0 && i === n.size ? n.data : n.data.slice(e, e + i);
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
      throw new c(`[gpu-device-api] ${e}: buffer "${this.label}" has been destroyed.`);
    if (this.device.disposed)
      throw new c(
        `[gpu-device-api] ${e}: buffer "${this.label}" belongs to a disposed device.`
      );
  }
  assertRange(e, r, n, i = this.size) {
    if (dt(e, `${n} offset`), Oe(r, `${n} size`), e + r > i) {
      const s = i === this.size ? `buffer "${this.label}" size ${this.size}` : `mapped range size ${i} of buffer "${this.label}"`;
      throw new c(
        `[gpu-device-api] ${n}: range [${e}, ${e + r}) exceeds ${s}.`
      );
    }
  }
}
function ec(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function O(t, e) {
  if (t instanceof Jn) return t.native;
  if (ec(t)) return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), got ${Z(t)}.`
  );
}
function Z(t) {
  if (t === null) return "null";
  if (t === void 0) return "undefined";
  if (typeof t == "object") {
    const e = t.label;
    return typeof e == "string" && e.length > 0 ? `a resource labelled "${e}"` : `an instance of ${t.constructor?.name ?? "Object"}`;
  }
  return `${typeof t} ${String(t)}`;
}
class sr {
  label;
  texture;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, r = {}) {
    this.texture = e;
    const n = Kt(e, r);
    this.label = r.label ?? `${e.label}#view`;
    const i = n.aspect;
    if (wu(e.format, i, `Texture "${e.label}".createView`), n.baseMipLevel + n.mipLevelCount > e.mipLevelCount)
      throw new c(
        `[gpu-device-api] Texture "${e.label}".createView: mip range [${n.baseMipLevel}, ${n.baseMipLevel + n.mipLevelCount}) exceeds mipLevelCount ${e.mipLevelCount}.`
      );
    if (n.baseArrayLayer + n.arrayLayerCount > e.depthOrArrayLayers)
      throw new c(
        `[gpu-device-api] Texture "${e.label}".createView: array layer range [${n.baseArrayLayer}, ${n.baseArrayLayer + n.arrayLayerCount}) exceeds depthOrArrayLayers ${e.depthOrArrayLayers}.`
      );
    if (n.dimension === "cube" || n.dimension === "cube-array") {
      if (n.arrayLayerCount % 6 !== 0)
        throw new c(
          `[gpu-device-api] Texture "${e.label}".createView: a "${n.dimension}" view needs a multiple of 6 array layers, got ${n.arrayLayerCount}.`
        );
      if (e.width !== e.height)
        throw new c(
          `[gpu-device-api] Texture "${e.label}".createView: a "${n.dimension}" view needs a square texture, got ${e.width}x${e.height}.`
        );
    }
    this.descriptor = n;
    let s;
    if (n.format !== void 0 && (s = Y(n.format), n.format !== e.format && !e.viewFormats.includes(n.format)))
      throw new c(
        `[gpu-device-api] Texture "${e.label}".createView: view format "${n.format}" was not listed in the texture's viewFormats (${e.viewFormats.join(", ") || "none"}).`
      );
    this.native = e.native.createView({
      label: this.label,
      format: s,
      dimension: Wt(n.dimension),
      aspect: ir(n.aspect),
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
function ei(t) {
  return t instanceof sr;
}
function tc(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function Ue(t, e) {
  if (t instanceof sr) return t.native;
  if (tc(t)) return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${Z(t)}.`
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
  constructor(e, r, n, i) {
    this.device = e, this.owned = i, this.native = r, this.label = n.label, this.extent = n.size, this.dimension = n.dimension, this.format = n.format, this.usage = n.usage, this.mipLevelCount = n.mipLevelCount, this.sampleCount = n.sampleCount, this.viewFormats = n.viewFormats, this.width = n.size.width, this.height = n.size.height, this.depthOrArrayLayers = n.size.depthOrArrayLayers;
  }
  /**
   * 按 descriptor 创建 texture，并在进入 WebGPU 之前完成自检。
   *
   * `label` 缺省时用 `nextId()` 生成，便于在 WebGPU 的 validation 信息里定位资源。
   */
  static create(e, r) {
    const n = Yt(r.size), i = {
      label: r.label ?? `texture#${e.nextResourceId("texture")}`,
      size: n,
      mipLevelCount: r.mipLevelCount ?? 1,
      sampleCount: r.sampleCount ?? 1,
      dimension: r.dimension ?? "2d",
      format: r.format,
      usage: r.usage,
      viewFormats: r.viewFormats ?? []
    };
    nc(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: n.width, height: n.height, depthOrArrayLayers: n.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: Y(i.format),
      usage: Yn(i.usage),
      viewFormats: i.viewFormats.map((a) => Y(a))
    });
    return new me(e, s, i, !0);
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
      format: n.format ?? fu(r.format),
      usage: n.usage ?? r.usage,
      viewFormats: n.viewFormats ?? []
    };
    return new me(e, r, a, i.owned ?? !1);
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
      throw new c(
        `[gpu-device-api] Texture.createView: texture "${this.label}" has been destroyed.`
      );
    const r = rc(Kt(this, e)), n = this.viewCache.get(r);
    if (n) return n;
    const i = new sr(this, e);
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
function rc(t) {
  return dn(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect
  );
}
function nc(t, e) {
  const { width: r, height: n, depthOrArrayLayers: i } = t.size;
  if (!Number.isInteger(r) || r <= 0 || !Number.isInteger(n) || n <= 0)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": width and height must be positive integers, got ${r}x${n}.`
    );
  if (!Number.isInteger(i) || i <= 0)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers must be a positive integer, got ${String(i)}.`
    );
  if (!Number.isInteger(t.mipLevelCount) || t.mipLevelCount <= 0)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount must be a positive integer.`
    );
  const s = Ni(t.size);
  if (t.mipLevelCount > s)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount ${t.mipLevelCount} is more than the maximum ${s} for a ${r}x${n}x${i} texture.`
    );
  if (t.dimension === "1d" && n !== 1)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture must have height 1, got ${n}.`
    );
  if (t.dimension === "1d" && t.sampleCount > 1)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture cannot be multisampled.`
    );
  const a = t.dimension === "1d" ? e.limits.maxTextureDimension1D : t.dimension === "3d" ? e.limits.maxTextureDimension3D : e.limits.maxTextureDimension2D;
  if (r > a || n > a || i > a)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": ${r}x${n}x${i} exceeds the ${t.dimension} limit ${a}.`
    );
  if (t.dimension === "2d" && i > e.limits.maxTextureArrayLayers)
    throw new c(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers ${i} exceeds maxTextureArrayLayers ${e.limits.maxTextureArrayLayers}.`
    );
  vu(
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
    const l = (u) => u.replace("-srgb", "");
    if (l(o) !== l(t.format))
      throw new c(
        `[gpu-device-api] Texture "${t.label}": viewFormat "${o}" is not compatible with format "${t.format}" (WebGPU only allows srgb <-> non-srgb reinterpretation).`
      );
  }
}
function Fr(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function ti(t, e) {
  if (t instanceof me) return t.native;
  if (Fr(t)) return t;
  const r = t?.native;
  if (r !== void 0 && Fr(r)) return r;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${Z(t)}.`
  );
}
class ar {
  label;
  descriptor;
  native;
  _disposed = !1;
  constructor(e, r = {}) {
    this.label = r.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const n = on(r);
    if (!Number.isFinite(n.lodMinClamp) || !Number.isFinite(n.lodMaxClamp))
      throw new c(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp/lodMaxClamp must be finite numbers.`
      );
    if (n.lodMinClamp < 0)
      throw new c(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp must not be negative, got ${n.lodMinClamp}.`
      );
    if (n.lodMaxClamp < n.lodMinClamp)
      throw new c(
        `[gpu-device-api] Sampler "${this.label}": lodMaxClamp (${n.lodMaxClamp}) must be >= lodMinClamp (${n.lodMinClamp}).`
      );
    if (!Number.isFinite(n.maxAnisotropy) || n.maxAnisotropy < 1)
      throw new c(
        `[gpu-device-api] Sampler "${this.label}": maxAnisotropy must be >= 1, got ${String(n.maxAnisotropy)}.`
      );
    this.descriptor = n;
    const i = {
      label: this.label,
      addressModeU: At(n.addressModeU),
      addressModeV: At(n.addressModeV),
      addressModeW: At(n.addressModeW),
      magFilter: Cr(n.magFilter),
      minFilter: Cr(n.minFilter),
      mipmapFilter: Uu(n.mipmapFilter),
      lodMinClamp: n.lodMinClamp,
      lodMaxClamp: n.lodMaxClamp,
      maxAnisotropy: n.maxAnisotropy
    };
    n.compare !== void 0 && (i.compare = nr(n.compare)), this.native = e.native.createSampler(i);
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
function ic(t) {
  return t instanceof ar;
}
function sc(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function ac(t, e) {
  if (t instanceof ar) return t.native;
  if (sc(t)) return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class ri {
  label;
  source;
  defines;
  device;
  modulesByStage = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? `shader#${e.nextResourceId("shader")}`, this.source = ln(r.code), this.defines = { ...r.defines ?? {} }, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
      throw new c(
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
    return zt({
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
      throw new c(
        `[gpu-device-api] ShaderModule "${this.label}" has been disposed; it can no longer be compiled.`
      );
    if (this.device.disposed)
      throw new c(
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
function jt(t, e) {
  if (t instanceof ri) return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${Z(t)}.`
  );
}
const Rr = "timestamp-query";
class ni {
  label;
  type;
  count;
  native;
  _disposed = !1;
  constructor(e, r) {
    if (this.label = r.label ?? `querySet#${e.nextResourceId("querySet")}`, !Number.isInteger(r.count) || r.count <= 0)
      throw new c(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(r.count)}.`
      );
    if (r.type === Dt.Timestamp && !e.features.has(Rr))
      throw new c(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${Rr}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    this.type = r.type, this.count = r.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: Nu(r.type),
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
function ii(t, e) {
  if (t instanceof ni) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const r = t;
    if (typeof r.destroy == "function" && typeof r.count == "number")
      return t;
  }
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
class si {
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
      n = un(r.entries);
    } catch (s) {
      throw new c(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = n, this.entries = r.entries, this.byBinding = new Map(n.map((s) => [s.binding, s]));
    const i = n.map(
      (s) => oc(s, e, this.label)
    );
    if (i.length > e.limits.maxBindingsPerBindGroup)
      throw new c(
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
function oc(t, e, r) {
  const n = `BindGroupLayout "${r}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: Pu(t.visibility)
  };
  if (sn(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new c(
        `[gpu-device-api] ${n}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: zu(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (an(t.type)) {
    const s = t.sampler ?? {}, a = ku(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : qu(s.type)
    }, i;
  }
  if (t.type === F.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new c(
        `[gpu-device-api] ${n}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: Wu(a),
      viewDimension: Wt(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === F.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new c(
        `[gpu-device-api] ${n}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return Xn(s.format, e.features, n), i.storageTexture = {
      access: ju(s.access ?? "write-only"),
      format: Y(s.format),
      viewDimension: Wt(s.viewDimension ?? "2d")
    }, i;
  }
  throw new c(
    `[gpu-device-api] ${n}: unsupported BindingType "${String(t.type)}".`
  );
}
function ai(t, e) {
  if (t instanceof si) return t.native;
  if (lc(t)) return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function lc(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class oi {
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
        throw new c(
          `[gpu-device-api] BindGroup "${this.label}": binding ${s.binding} is not declared by layout "${this.layout.label}".`
        );
    const n = ai(this.layout, `BindGroup "${this.label}"`), i = r.entries.map(
      (s) => uc(s, this.layout, e, this.label)
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
function uc(t, e, r, n) {
  const i = `BindGroup "${n}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new c(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (sn(s.type)) {
    if (!("buffer" in a))
      throw new c(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${Z(a)}.`
      );
    const o = O(a.buffer, i), l = a.offset ?? 0, u = a.size ?? a.buffer.size - l;
    if (!Number.isInteger(l) || l < 0)
      throw new c(`[gpu-device-api] ${i}: offset must be a non-negative integer.`);
    if (!Number.isInteger(u) || u < 0)
      throw new c(`[gpu-device-api] ${i}: size must be a non-negative integer.`);
    if (l + u > a.buffer.size)
      throw new c(
        `[gpu-device-api] ${i}: binding range [${l}, ${l + u}) exceeds the buffer size ${a.buffer.size}.`
      );
    const h = s.buffer?.minBindingSize ?? 0;
    if (h > 0 && u < h)
      throw new c(
        `[gpu-device-api] ${i}: layout requires minBindingSize ${h}, got ${u}.`
      );
    const f = { buffer: o, offset: l, size: u };
    return { binding: t.binding, resource: f };
  }
  if (an(s.type)) {
    if (!("sampler" in a))
      throw new c(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${Z(a)}.`
      );
    const o = a.sampler, l = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (ic(o)) {
      if (l && !o.isComparison)
        throw new c(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!l && o.isComparison)
        throw new c(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: ac(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new c(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${Z(a)}.`
      );
    return cc(a.view, s, r, i), { binding: t.binding, resource: Ue(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new c(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${Z(a)}.`
      );
    if (ei(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && Y(a.view.format) !== Y(o))
        throw new c(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: Ue(a.view, i) };
  }
  if ("source" in a)
    return { binding: t.binding, resource: a.source };
  throw new c(
    `[gpu-device-api] ${i}: unsupported binding resource ${Z(a)}.`
  );
}
function cc(t, e, r, n) {
  if (!ei(t)) return;
  const i = e.texture ?? {}, s = t.format, a = ge(s), o = i.sampleType ?? "float";
  if (o === "depth") {
    if (a.sampleScalar !== "depth")
      throw new c(
        `[gpu-device-api] ${n}: layout expects a depth texture, but the bound view has format "${s}".`
      );
  } else if (o === "uint" || o === "sint") {
    if (a.sampleScalar !== o)
      throw new c(
        `[gpu-device-api] ${n}: layout expects a "${o}" sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
  } else {
    if (a.sampleScalar !== "float")
      throw new c(
        `[gpu-device-api] ${n}: layout expects a float sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
    if (o === "float" && !pu(s, r.features))
      throw new c(
        `[gpu-device-api] ${n}: layout declares sampleType "float" (filterable), but "${s}" is not filterable on this device; declare "unfilterable-float" or enable the required feature.`
      );
  }
  const l = t.texture.sampleCount > 1;
  if ((i.multisampled ?? !1) !== l)
    throw new c(
      `[gpu-device-api] ${n}: layout declares multisampled=${String(i.multisampled ?? !1)}, but the bound texture has sampleCount ${t.texture.sampleCount}.`
    );
  const u = i.viewDimension ?? "2d";
  if (u !== t.descriptor.dimension)
    throw new c(
      `[gpu-device-api] ${n}: layout declares viewDimension "${u}", but the bound view is "${t.descriptor.dimension}".`
    );
}
function li(t, e, r, n) {
  const i = t.layout.sortedEntries.filter((s) => s.buffer?.hasDynamicOffset === !0);
  if (i.length === 0) {
    if (e && e.length > 0)
      throw new c(
        `[gpu-device-api] ${n}: bind group "${t.label}" has no entry with hasDynamicOffset, but ${e.length} dynamic offset(s) were supplied.`
      );
    return;
  }
  if (!e || e.length !== i.length)
    throw new c(
      `[gpu-device-api] ${n}: bind group "${t.label}" needs ${i.length} dynamic offset(s) (declaration order of the entries with hasDynamicOffset), got ${e ? e.length : 0}.`
    );
  for (let s = 0; s < i.length; s++) {
    const a = i[s], o = e[s], l = a.type === "uniform" ? r.limits.minUniformBufferOffsetAlignment : r.limits.minStorageBufferOffsetAlignment;
    if (!Number.isInteger(o) || o < 0)
      throw new c(
        `[gpu-device-api] ${n}: dynamic offset #${s} must be a non-negative integer, got ${String(o)}.`
      );
    if (o % l !== 0)
      throw new c(
        `[gpu-device-api] ${n}: dynamic offset #${s} (${o}) must be a multiple of ${l} (${a.type === "uniform" ? "minUniformBufferOffsetAlignment" : "minStorageBufferOffsetAlignment"}).`
      );
  }
}
function ui(t, e) {
  if (t instanceof oi) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class De {
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
      throw new c(
        `[gpu-device-api] PipelineLayout "${n}": ${r.bindGroupLayouts.length} bind group layouts exceed maxBindGroups (${e.limits.maxBindGroups}).`
      );
    const i = e.native.createPipelineLayout({
      label: n,
      bindGroupLayouts: r.bindGroupLayouts.map(
        (s) => ai(s, `PipelineLayout "${n}"`)
      )
    });
    return new De(n, r.bindGroupLayouts, i, !1);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new De(e, [], "auto", !0);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function ci(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof De) return t.native;
  const r = t.native;
  if (r === "auto") return "auto";
  if (r && typeof r == "object") return r;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const hc = "uint32";
class fe {
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
    const n = e?.topology ?? bt.topology, i = {
      topology: Ru(n),
      frontFace: Du(e?.frontFace ?? bt.frontFace),
      cullMode: Ou(e?.cullMode ?? bt.cullMode)
    };
    if (Mu(n))
      i.stripIndexFormat = Kn(e?.stripIndexFormat ?? hc);
    else if (e?.stripIndexFormat !== void 0)
      throw new c(
        `[gpu-device-api] PrimitiveState.stripIndexFormat is only valid for strip topologies, but the topology is "${n}".`
      );
    if (e?.unclippedDepth) {
      if (r && !r.has("depth-clip-control"))
        throw new c(
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
    const n = qn(e), i = ft(e);
    if (!n && !i)
      throw new c(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: Y(e) };
    return n && (s.depthWriteEnabled = r?.depthWriteEnabled ?? lr.depthWriteEnabled, s.depthCompare = nr(r?.depthCompare ?? lr.depthCompare)), i && (s.stencilFront = Gr(r?.stencilFront), s.stencilBack = Gr(r?.stencilBack), s.stencilReadMask = r?.stencilReadMask ?? 4294967295, s.stencilWriteMask = r?.stencilWriteMask ?? 4294967295), r?.depthBias !== void 0 && (s.depthBias = r.depthBias), r?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = r.depthBiasSlopeScale), r?.depthBiasClamp !== void 0 && (s.depthBiasClamp = r.depthBiasClamp), s;
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, r) {
    const n = ze(e?.count ?? r, "MultisampleState.count"), i = { count: n, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
    if (s && n === 1)
      throw new c(
        "[gpu-device-api] MultisampleState.alphaToCoverageEnabled requires sampleCount > 1."
      );
    return s && (i.alphaToCoverageEnabled = !0), i;
  }
  /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
  static toGPUBlendState(e) {
    if (e)
      return {
        color: Mr(e.color),
        alpha: Mr(e.alpha)
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
      throw new c(
        `[gpu-device-api] RenderPipeline: fragment.targets has ${r.length} entries but the render target has ${e.length} color attachments.`
      );
    return e.map((i, s) => {
      const a = r ? r[s] : void 0;
      if (a === null) return null;
      const o = { format: Y(a?.format ?? i) }, l = a?.blend ?? n.blend;
      l && (o.blend = fe.toGPUBlendState(l));
      const u = a?.writeMask ?? n.writeMask;
      return u !== void 0 && (o.writeMask = Cu(u)), o;
    });
  }
  /** 校验并翻译 vertex buffer layout 列表。 */
  static toGPUVertexBufferLayouts(e, r) {
    if (e.length > r.maxVertexBuffers)
      throw new c(
        `[gpu-device-api] RenderPipeline: ${e.length} vertex buffer layouts exceed maxVertexBuffers (${r.maxVertexBuffers}).`
      );
    return e.map((n) => {
      try {
        cn(n, r);
      } catch (i) {
        throw new c(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: n.arrayStride,
        stepMode: Vu(n.stepMode ?? "vertex"),
        attributes: n.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: Iu(i.format)
        }))
      };
    });
  }
}
function Mr(t) {
  const e = { ...ki, ...t };
  return {
    operation: Gu(e.operation ?? "add"),
    srcFactor: Pr(e.srcFactor),
    dstFactor: Pr(e.dstFactor)
  };
}
function Gr(t) {
  return {
    compare: nr(t?.compare ?? Xe.compare),
    failOp: Lt(t?.failOp ?? Xe.failOp),
    depthFailOp: Lt(t?.depthFailOp ?? Xe.depthFailOp),
    passOp: Lt(t?.passOp ?? Xe.passOp)
  };
}
class dc {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, r) {
    this.cache = ji(e, (n, i) => {
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
function Ur(t) {
  return dn(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    hn(t.vertexLayouts)
  );
}
const fc = "vsMain", pc = "fsMain";
class hi {
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
    this.device = e, this.descriptor = r, this.label = r.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`, this.layout = r.layout ?? "auto", this.vertexLayouts = r.vertex.buffers ?? null, this.logger = Ne(`webgpu:${this.label}`), this.cache = new dc(64, (n, i) => {
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
      throw new c(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`
      );
    const r = this.resolveVariant(e);
    return this.cache.resolve(Ur(r), () => this.createNative(r));
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
    const r = this.descriptor, n = e.colorFormats ?? this.defaultColorFormats(), i = ze(
      e.sampleCount ?? r.multisample?.count ?? r.render?.multisample?.count ?? 1,
      `RenderPipeline "${this.label}": sampleCount`
    ), s = e.depthFormat !== void 0 ? e.depthFormat : r.depthStencil?.format ?? null, a = e.vertexLayouts ?? r.vertex.buffers ?? [];
    if (r.fragment && n.length === 0)
      throw new c(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. Declare \`colorFormats\` on the descriptor, or pass them per target via resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.`
      );
    if (!r.fragment && !r.depthStencil?.format && s === null)
      throw new c(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depth format; WebGPU cannot create a pipeline that writes to nothing.`
      );
    a.length === 0 && !this.warnedMissingVertexLayouts && (this.warnedMissingVertexLayouts = !0, this.logger.debug(
      "building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes"
    ));
    for (const o of n)
      Y(o);
    return s !== null && Y(s), { colorFormats: n, sampleCount: i, depthFormat: s, vertexLayouts: a };
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
    return this.logger.debug(`creating render pipeline variant ${Ur(e)}`), this.device.native.createRenderPipeline(r);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const r = this.descriptor, n = this.device.limits, i = r.vertex, a = {
      module: jt(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(I.Vertex),
      entryPoint: i.entryPoint ?? fc,
      buffers: fe.toGPUVertexBufferLayouts(e.vertexLayouts, n)
    }, o = r.fragment;
    let l;
    o && (l = {
      module: jt(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(I.Fragment),
      entryPoint: o.entryPoint ?? pc,
      targets: fe.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: r.render?.blend,
        writeMask: r.render?.writeMask
      })
    });
    const u = r.primitive ?? r.render?.primitive, h = r.depthStencil ?? r.render?.depthStencil, f = r.multisample ?? r.render?.multisample, d = e.depthFormat, p = {
      label: this.label,
      layout: ci(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: fe.toGPUPrimitiveState(u, this.device.features),
      multisample: fe.toGPUMultisampleState(f, e.sampleCount)
    };
    return l && (p.fragment = l), d !== null ? p.depthStencil = fe.toGPUDepthStencilState(d, h) : h && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), p;
  }
}
function mc(t, e, r) {
  if (t instanceof hi) return t.resolve(r);
  const n = t?.native;
  if (n && typeof n == "object" && typeof n.getBindGroupLayout == "function")
    return n;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const gc = "csMain";
class di {
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
      throw new c(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
    if (this._native) return this._native;
    const e = jt(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    );
    return this._native = this.device.native.createComputePipeline({
      label: this.label,
      layout: ci(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(I.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? gc
      }
    }), this._native;
  }
  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose() {
    this._disposed || (this._disposed = !0, this._native = null);
  }
}
function bc(t, e) {
  if (t instanceof di) return t.resolve();
  const r = t?.native;
  if (r && typeof r == "object") return r;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const wc = [0, 0, 0, 1];
class fi {
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
    const n = vc(r.color);
    if (this.colorFormatsList = n, this.depthFormatValue = r.depth === void 0 || r.depth === !1 || r.depth === null ? null : r.depth === !0 ? "depth24plus" : r.depth, this.sampleCountValue = ze(r.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = r.mipLevelCount ?? 1, this.baseUsage = r.usage ?? 0, this.sampled = r.sampled ?? !1, this._width = rt(r.width, "width", this.label), this._height = rt(r.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new c(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new c(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !Ri(this.depthFormatValue))
      throw new c(
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
      throw new c(`[gpu-device-api] RenderTarget "${this.label}" has been disposed.`);
    const n = rt(e, "width", this.label), i = rt(r, "height", this.label);
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
      const i = this.sampled ? x.TextureBinding : x.None;
      return this.device.createTexture({
        label: `${this.label}#color${n}`,
        size: e,
        format: r,
        usage: x.RenderAttachment | i | this.baseUsage,
        mipLevelCount: this.mipLevelCountValue
      });
    }), this.colorViews = this.colorTextures.map((r) => r.createView({ label: `${r.label}#view` })), this.sampleCountValue > 1 && (this.multisampleTextureList = this.colorFormatsList.map(
      (r, n) => this.device.createTexture({
        label: `${this.label}#msaa${n}`,
        size: e,
        format: r,
        usage: x.RenderAttachment,
        sampleCount: this.sampleCountValue
      })
    ), this.multisampleViews = this.multisampleTextureList.map(
      (r) => r.createView({ label: `${r.label}#view` })
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
  buildAttachments(e, r, n) {
    const i = n === void 0 ? wc : n;
    return this.colorFormatsList.map((s, a) => {
      const o = this.multisampleViews[a], l = this.colorViews[a], u = {
        view: o ?? l,
        loadOp: e ?? "clear",
        storeOp: r ?? "store",
        clearValue: i
      };
      return o && (u.resolveTarget = l), u;
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
    return ft(this.depthFormatValue) && (n.stencilLoadOp = e ?? "clear", n.stencilStoreOp = "store", n.stencilClearValue = 0, n.stencilReadOnly = !1), n;
  }
}
function vc(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function rt(t, e, r) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new c(
      `[gpu-device-api] RenderTarget "${r}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function xc(t) {
  const e = t.label ?? "renderPass";
  let r, n;
  if (t.target) {
    if (!(t.target instanceof fi))
      throw new c(
        `[gpu-device-api] ${e}: descriptor.target must be a WebGPURenderTarget created by a WebGPU device.`
      );
    const u = t.target.createPassDescriptor({
      clearValue: t.clearValue,
      depthClearValue: t.depthClearValue
    });
    r = u.colorAttachments, n = u.depthStencilAttachment;
  } else
    r = t.colorAttachments, n = t.depthStencilAttachment ?? null;
  const i = [], s = [], a = [];
  for (const u of r) {
    if (!u) {
      s.push(null);
      continue;
    }
    const h = Ue(u.view, `${e}.colorAttachments`), f = u.view.texture;
    i.push(u.view.descriptor.format ?? f.format), a.push(f.sampleCount);
    const d = u.loadOp ?? "clear", p = u.storeOp ?? "store";
    if (f.sampleCount > 1 && !u.resolveTarget && p !== "discard")
      throw new c(
        `[gpu-device-api] ${e}: a multisampled color attachment (sampleCount ${f.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const m = {
      view: h,
      loadOp: _t(d),
      storeOp: Et(p)
    };
    u.resolveTarget && (m.resolveTarget = Ue(u.resolveTarget, `${e}.resolveTarget`)), d === "clear" && (m.clearValue = Qn(u.clearValue)), s.push(m);
  }
  const o = { label: e, colorAttachments: s };
  let l = null;
  if (n) {
    const u = Ue(n.view, `${e}.depthStencilAttachment`), h = n.view.descriptor.format ?? n.view.texture.format;
    l = h, a.push(n.view.texture.sampleCount);
    const f = { view: u }, d = n.depthLoadOp ?? "clear", p = n.depthStoreOp ?? "store";
    if (f.depthLoadOp = _t(d), f.depthStoreOp = Et(p), d === "clear" && (f.depthClearValue = Tc(n.depthClearValue ?? 1, e)), n.depthReadOnly !== void 0 && (f.depthReadOnly = n.depthReadOnly), ft(h)) {
      const m = n.stencilLoadOp ?? d;
      f.stencilLoadOp = _t(m), f.stencilStoreOp = Et(n.stencilStoreOp ?? "store"), m === "clear" && (f.stencilClearValue = n.stencilClearValue ?? 0), n.stencilReadOnly !== void 0 && (f.stencilReadOnly = n.stencilReadOnly);
    } else if (n.stencilLoadOp !== void 0 || n.stencilStoreOp !== void 0)
      throw new c(
        `[gpu-device-api] ${e}: depth format "${h}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    o.depthStencilAttachment = f;
  }
  return t.occlusionQuerySet && (o.occlusionQuerySet = ii(t.occlusionQuerySet, `${e}.occlusionQuerySet`)), {
    native: o,
    layout: {
      colorFormats: i,
      depthFormat: l,
      sampleCount: yc(a, e)
    }
  };
}
function yc(t, e) {
  if (t.length === 0) return 1;
  const r = t[0];
  for (const n of t)
    if (n !== r)
      throw new c(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return r;
}
function Tc(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new c(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class Sc {
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
      mc(e, `RenderPass "${this.label}".setPipeline`, {
        colorFormats: this.layout.colorFormats,
        sampleCount: this.layout.sampleCount,
        depthFormat: this.layout.depthFormat
      })
    );
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), r) {
      li(r, n, this.device, `RenderPass "${this.label}".setBindGroup`), this.native.setBindGroup(
        e,
        ui(r, `RenderPass "${this.label}".setBindGroup`),
        n ?? []
      );
      return;
    }
    if (n && n.length > 0)
      throw new c(
        `[gpu-device-api] RenderPass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  setVertexBuffer(e, r, n, i) {
    if (this.assertOpen("setVertexBuffer"), r === null) {
      this.native.setVertexBuffer(e, null, n, i);
      return;
    }
    this.native.setVertexBuffer(e, O(r, `RenderPass "${this.label}".setVertexBuffer`), n, i);
  }
  setIndexBuffer(e, r, n, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      O(e, `RenderPass "${this.label}".setIndexBuffer`),
      Kn(r),
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
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(Qn(e));
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
    const n = Or(e, r, `RenderPass "${this.label}".drawIndirect`);
    this.native.drawIndirect(n.buffer, n.offset);
  }
  drawIndexedIndirect(e, r = 0) {
    this.assertOpen("drawIndexedIndirect");
    const n = Or(e, r, `RenderPass "${this.label}".drawIndexedIndirect`);
    this.native.drawIndexedIndirect(n.buffer, n.offset);
  }
  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end() {
    this._ended || (this._ended = !0, this.native.end(), this.onEnd?.());
  }
  assertOpen(e) {
    if (this._ended)
      throw new c(
        `[gpu-device-api] RenderPass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
function Or(t, e, r) {
  return "indirectBuffer" in t ? {
    buffer: O(t.indirectBuffer, r),
    offset: t.indirectOffset ?? 0
  } : { buffer: O(t, r), offset: e };
}
function $c(t) {
  const e = t?.label ?? "computePass", r = { label: e };
  if (t?.timestampWrites) {
    const n = t.timestampWrites;
    r.timestampWrites = {
      querySet: ii(n.querySet, `${e}.timestampWrites.querySet`),
      beginningOfPassWriteIndex: n.beginningOfPassWriteIndex,
      endOfPassWriteIndex: n.endOfPassWriteIndex
    };
  }
  return r;
}
class Lc {
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
    this.assertOpen("setPipeline"), this.native.setPipeline(bc(e, `ComputePass "${this.label}".setPipeline`));
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), r) {
      li(r, n, this.device, `ComputePass "${this.label}".setBindGroup`), this.native.setBindGroup(
        e,
        ui(r, `ComputePass "${this.label}".setBindGroup`),
        n ?? []
      );
      return;
    }
    if (n && n.length > 0)
      throw new c(
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
        O(e.indirectBuffer, n),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(O(e, n), r);
  }
  /** 结束该 pass。幂等；此后再调用任何录制方法都会抛错。 */
  end() {
    this._ended || (this._ended = !0, this.native.end(), this.onEnd?.());
  }
  assertOpen(e) {
    if (this._ended)
      throw new c(
        `[gpu-device-api] ComputePass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
class Ac {
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
    const { native: r, layout: n } = xc(e), i = e.label ?? this.label, s = new Sc(
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
    const r = $c(e), n = e?.label ?? this.label, i = new Lc(
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
      O(e, `${this.label}.copyBufferToBuffer(source)`),
      r,
      O(n, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, r, n) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: O(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      nt(r, `${this.label}.copyBufferToTexture(destination)`),
      _e(n)
    );
  }
  copyTextureToBuffer(e, r, n) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      nt(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: O(r.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: r.offset ?? 0,
        bytesPerRow: r.bytesPerRow,
        rowsPerImage: r.rowsPerImage
      },
      _e(n)
    );
  }
  copyTextureToTexture(e, r, n) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      nt(e, `${this.label}.copyTextureToTexture(source)`),
      nt(r, `${this.label}.copyTextureToTexture(destination)`),
      _e(n)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, r = 0, n) {
    this.assertRecording("clearBuffer"), dt(r, `${this.label}.clearBuffer offset`);
    const i = n ?? e.size - r;
    if (r % 4 !== 0)
      throw new c(
        `[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${r}.`
      );
    if (i <= 0)
      throw new c(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${i}.`
      );
    if (i % 4 !== 0)
      throw new c(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${i}.`
      );
    if (r + i > e.size)
      throw new c(
        `[gpu-device-api] ${this.label}.clearBuffer: range [${r}, ${r + i}) exceeds the buffer size ${e.size}.`
      );
    this.native.clearBuffer(
      O(e, `${this.label}.clearBuffer`),
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
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, new pi(this.label, this.native.finish());
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
      throw new c(`[gpu-device-api] CommandEncoder "${this.label}".${e}: already disposed.`);
    if (this._finished)
      throw new c(
        `[gpu-device-api] CommandEncoder "${this.label}".${e}: the encoder has already been finished.`
      );
  }
}
class pi {
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
function nt(t, e) {
  const r = {
    texture: ti(t.texture, e)
  };
  return t.mipLevel !== void 0 && (r.mipLevel = t.mipLevel), t.origin !== void 0 && (r.origin = Zn(t.origin)), t.aspect !== void 0 && (r.aspect = ir(t.aspect)), r;
}
function _c(t, e) {
  if (t instanceof pi) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new c(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${Z(t)}.`
  );
}
class Ec {
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
    this.canvas = e, this.options = r, this.pixelRatioValue = r.pixelRatio ?? pn(), this.formatValue = _r(), this.usageValue = x.RenderAttachment | (r.copySrc ? x.CopySrc : x.None);
    const n = Me(e);
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
      throw new c("[gpu-device-api] CanvasContext.configure: the context has been disposed.");
    if (!(e.device instanceof mi))
      throw new c(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const r = Eu(this.canvas);
    if (!r)
      throw new c(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.gpuContext = r, this.currentDevice = e.device, this.formatValue = e.format ?? _r(), this.usageValue = x.RenderAttachment | (e.usage ?? x.None) | (this.options.copySrc ? x.CopySrc : x.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace, this.sampleCountValue = ze(
      e.sampleCount ?? e.device.defaultSampleCount,
      "CanvasConfig.sampleCount"
    );
    const n = {
      device: e.device.native,
      format: _u(this.formatValue),
      usage: Yn(this.usageValue),
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
      throw new c(
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
      throw new c(
        `[gpu-device-api] CanvasContext.setPixelRatio: ratio must be positive, got ${String(e)}.`
      );
    if (e === this.pixelRatioValue) return;
    const r = this.widthValue / this.pixelRatioValue, n = this.heightValue / this.pixelRatioValue;
    this.pixelRatioValue = e, this.setSize(r, n, !1);
  }
  /** 重新读取元素尺寸；back buffer 发生变化时返回 true。 */
  resize(e = !1) {
    const r = Me(this.canvas), n = Math.max(1, Math.round(r.width * this.pixelRatioValue)), i = Math.max(1, Math.round(r.height * this.pixelRatioValue));
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
      throw new c(
        "[gpu-device-api] CanvasContext.getCurrentFrameTarget: the context is not configured."
      );
    const r = this.gpuContext.getCurrentTexture();
    if (this.frameTarget && this.frameNative === r) return this.frameTarget;
    this.releaseFrame();
    const n = me.adopt(
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
      throw new c("[gpu-device-api] CanvasContext: the context is not configured.");
    const i = this.multisampleTexture;
    if (i && i.width === e && i.height === r && this.multisampleViewValue)
      return this.multisampleViewValue;
    this.releaseMultisampleTarget();
    const s = me.create(n, {
      label: `${n.label}#canvasMSAA`,
      size: { width: e, height: r },
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
}
class Pc {
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
      O(e, "Queue.writeBuffer"),
      r,
      n,
      i,
      s
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, r, n, i) {
    this.native.writeTexture(
      Ct(e, "Queue.writeTexture"),
      r,
      Ju(n),
      _e(i)
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
      Ct(r, "Queue.copyExternalImageToTexture"),
      _e(n)
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
      O(e, "Queue.copyBufferToBuffer(source)"),
      r,
      O(n, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, r, n) {
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: O(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      Ct(r, "Queue.copyBufferToTexture(destination)"),
      _e(n)
    ), this.native.submit([i.finish()]);
  }
  /** 提交 command buffer；提交后这些 buffer 不可再次使用。 */
  submit(e) {
    this.native.submit(e.map((r) => _c(r, "Queue.submit")));
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
function Ct(t, e) {
  const r = {
    texture: ti(t.texture, e)
  };
  return t.mipLevel !== void 0 && (r.mipLevel = t.mipLevel), t.origin !== void 0 && (r.origin = Zn(t.origin)), t.aspect !== void 0 && (r.aspect = ir(t.aspect)), r;
}
class mi {
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
    this.native = e, this.descriptor = r.descriptor, this.label = r.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = r.adapterInfo, this.requestedLimits = r.resolvedLimits, this.debug = r.descriptor.debug ?? !1, this.enabledFeatures = [...r.descriptor.requiredFeatures ?? []], this.features = new Au(r.adapterFeatures), this.limits = Hn(e.limits), this.defaultSampleCount = ze(
      r.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = Ne(`webgpu:${this.label}`);
    let n = () => {
    };
    this.lost = new Promise((i) => {
      n = i;
    }), this.resolveLost = n, this.queue = new Pc(this), e.onuncapturederror = (i) => {
      this.reportError(Cc(i.error));
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
    return this.assertUsable("createBuffer"), this.track(new Jn(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(me.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new ar(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new ri(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new ni(this, e));
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new si(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new oi(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(De.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new hi(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new di(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new fi(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new Ac(this, e));
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
      throw new c(
        "[gpu-device-api] Device.createCanvasContext: expected an HTMLCanvasElement or OffscreenCanvas."
      );
    let n = this.canvasContexts.get(e);
    return (!n || n.disposed) && (n = this.track(new Ec(e)), this.canvasContexts.set(e, n)), (r !== void 0 || !n.configured) && n.configure({ ...r, device: this }), n;
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
      gn(e);
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
      throw new c(`[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`);
    if (this.lostInfo)
      throw new Ot(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfo.reason}): ` + this.lostInfo.message,
        { reason: this.lostInfo.reason }
      );
  }
  handleDeviceLost(e) {
    const r = e.reason === "destroyed" ? "destroyed" : "unknown", n = { reason: r, message: e.message };
    this.lostInfo = n, this.resolveLost(n), this._disposed || this.reportError(
      new Ot(`[gpu-device-api] WebGPU device lost (${r}): ${e.message}`, { reason: r })
    );
  }
}
function Cc(t) {
  if (Vi(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), r = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return Bt(t, "GPUValidationError") ? new c(r) : Bt(t, "GPUOutOfMemoryError") ? new Ii(r) : Bt(t, "GPUInternalError") ? new oe(r, { code: "INTERNAL_ERROR" }) : t instanceof Error ? new oe(r, { code: "GPU_ERROR", cause: t }) : new oe(r);
}
function Bt(t, e) {
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
class ct {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, r) {
    this.native = e, this.options = r, this.info = $u(e), this.features = Su(e.features), this.limits = Hn(e.limits), this.featureNames = [...this.features].sort();
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
    const r = await Tu(e);
    return r ? new ct(r, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const r = await ct.request(e);
    if (r) return r;
    throw Ar() ? new c(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new c(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const r = fn(this.limits, e.requiredLimits, "webgpu"), n = Lu(
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
    return new mi(s, {
      descriptor: e,
      resolvedLimits: r,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function Bc(t) {
  return t.canvas ? t.canvas : gi();
}
function Fc() {
  return gi();
}
function gi() {
  if (typeof document < "u") {
    const t = document.createElement("canvas");
    return t.width = 1, t.height = 1, t;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
const qt = Symbol("timeout");
async function Dr(t, e) {
  let r;
  try {
    return await Promise.race([
      t,
      new Promise((n) => {
        r = setTimeout(() => n(qt), e);
      })
    ]);
  } finally {
    r !== void 0 && clearTimeout(r);
  }
}
const it = 3e3;
class Rc {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    try {
      const r = await Dr(
        navigator.gpu.requestAdapter({
          powerPreference: e.powerPreference ?? "high-performance",
          forceFallbackAdapter: e.forceFallbackAdapter ?? !1
        }),
        it
      );
      return r === qt ? {
        ok: !1,
        reason: `requestAdapter() 超过 ${it}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`
      } : r ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (r) {
      return { ok: !1, reason: `requestAdapter() 抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    const r = await Dr(
      ct.create({
        powerPreference: e.powerPreference,
        forceFallbackAdapter: e.forceFallbackAdapter
      }),
      it
    );
    if (r === qt)
      throw new c(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${it}ms 没有返回。这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。
可以稍后重试，或改用 WebGL2 后端。`
      );
    return r;
  }
}
class Mc {
  kind = "webgl2";
  async isAvailable(e) {
    const r = Fc();
    if (!r)
      return { ok: !1, reason: "没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）" };
    try {
      return r.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（浏览器不支持 WebGL2）" };
    } catch (n) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const r = Bc(e);
    if (!r)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return er.request({
      canvas: r,
      contextAttributes: e.contextAttributes
    });
  }
}
let Ft = null;
function or() {
  return Ft || (Ft = new wo().register(new Rc()).register(new Mc())), Ft;
}
const Gc = ["webgpu", "webgl2"];
async function Uc(t = {}) {
  const e = t.registry ?? or(), r = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? Gc, n = await e.probeAll(r, t), i = n.find((s) => s.ok);
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
async function Fd(t, e = {}) {
  const n = (e.registry ?? or()).get(t);
  return n ? (await n.isAvailable(e)).ok : !1;
}
async function Rd(t = {}) {
  return (await bi(t)).device;
}
async function bi(t = {}) {
  const e = t.logger ?? Ne("gpu-device-api"), r = t.registry ?? or(), n = await Uc({
    backend: t.backend ?? "auto",
    order: t.order,
    canvas: t.canvas,
    contextAttributes: t.contextAttributes,
    powerPreference: t.powerPreference,
    forceFallbackAdapter: t.forceFallbackAdapter,
    registry: r
  });
  if (n.backend === null)
    throw new c(
      `[gpu-device-api] 无法创建渲染设备：${n.reason}
排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。`
    );
  if (t.strictBackend && t.backend && t.backend !== "auto" && t.backend !== n.backend)
    throw new c(
      `[gpu-device-api] 要求使用 ${t.backend} 后端，但它不可用：${n.reason}`
    );
  const i = !t.strictBackend, s = [
    n.backend,
    ...n.probes.filter((o) => o.ok && o.backend !== n.backend).map((o) => o.backend)
  ], a = [];
  for (const o of s) {
    const l = r.get(o);
    if (l)
      try {
        const u = await l.createAdapter({
          canvas: t.canvas,
          contextAttributes: t.contextAttributes,
          powerPreference: t.powerPreference,
          forceFallbackAdapter: t.forceFallbackAdapter
        }), h = await u.requestDevice({
          label: t.label,
          requiredFeatures: t.requiredFeatures,
          requiredLimits: t.requiredLimits,
          debug: t.debug
        }), f = t.canvas ? h.createCanvasContext(t.canvas) : null;
        return o !== n.backend ? e.warn(
          `后端 ${n.backend} 初始化失败，已改用 ${o}。失败原因：${a[a.length - 1] ?? "未知"}`
        ) : o === "webgl2" && t.backend !== "webgl2" && e.info(`已回退到 WebGL2 后端：${n.reason}`), { device: h, adapter: u, backend: o, probes: n.probes, context: f };
      } catch (u) {
        const h = u.message;
        if (a.push(`${o} — ${h}`), !i) throw u;
        e.warn(`后端 ${o} 初始化失败：${h}`);
      }
  }
  throw new c(
    `[gpu-device-api] 没有可用的渲染后端。逐个初始化的结果：
  ${a.join(`
  `)}
排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。
另一个常见原因：这张 canvas 已经被别的代码用 getContext() 绑定成了其它类型，一个 canvas 只能绑定一种 context —— 请为它新建一张 canvas，或换一个未被占用的 canvas。`
  );
}
const Vr = 16, Oc = 12, ht = {
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
    size: Vr * 3,
    glsl: "mat3",
    wgsl: "mat3x3f",
    componentType: "f32",
    components: 9,
    columnStride: Vr,
    columnSize: Oc,
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
}, Ir = Object.keys(ht);
function Rt(t, e) {
  return Math.ceil(t / e) * e;
}
function Dc(t) {
  const e = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(t);
  if (e) {
    const n = e[1], i = ht[n];
    if (!i)
      throw new c(
        `[gpu-device-api] 不支持的 uniform 元素类型「${n}」（出现在「${t}」里）。支持：${Ir.join("、")}。`
      );
    const s = Number(e[2]);
    if (s <= 0)
      throw new c(`[gpu-device-api] uniform 数组「${t}」的元素个数必须为正数。`);
    if (i.columns !== void 0 && i.columnStride !== i.columnSize)
      throw new c(
        `[gpu-device-api] 不支持 \`${t}\`：\`mat3x3f\` 的每列有 4 字节填充，无法表示成扁平数组。
请改用 \`mat4x4f[` + s + "]`（多出的第 4 个分量当作 0 即可），或者拆成多个独立的 mat3 字段。"
      );
    return { element: n, count: s };
  }
  if (t === "mat2x2f" || t === "mat2x3f" || t === "mat2x4f" || t === "mat3x2f" || t === "mat3x4f" || t === "mat4x2f" || t === "mat4x3f")
    throw new c(
      `[gpu-device-api] uniform 不支持 \`${t}\`：GLSL std140 与 WGSL uniform 对非 4 列的矩阵布局规则不一致（std140 会把列步长补齐到 16 字节）。
请改用 \`mat4x4f\`（把缺的列填单位向量或零），或拆成若干 \`vec4f\`。`
    );
  if (!ht[t])
    throw new c(
      `[gpu-device-api] 不支持的 uniform 类型「${t}」。支持：${Ir.join("、")}，以及 \`类型[N]\` 形式的数组。`
    );
  return { element: t, count: 1 };
}
const Vc = /* @__PURE__ */ new Set([
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
]), Ic = /^[A-Za-z_][A-Za-z0-9_]*$/;
class pt {
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
  constructor(e, r = {}) {
    this.desc = { ...e }, this.structName = r.structName ?? "Uniforms", this.group = r.group ?? 0, this.binding = r.binding ?? 0;
    const n = Object.keys(e);
    if (n.length === 0)
      throw new c("[gpu-device-api] uniform 布局至少要有一个字段。");
    const i = [];
    let s = 0, a = 16;
    for (const o of n) {
      if (!Ic.test(o))
        throw new c(`[gpu-device-api] uniform 字段名「${o}」不是合法标识符。`);
      if (Vc.has(o))
        throw new c(`[gpu-device-api] uniform 字段名「${o}」是 WGSL 保留字，请换一个。`);
      const l = e[o], { element: u, count: h } = Dc(l), f = ht[u], d = Rt(s, f.align), p = f.size, m = h > 1 ? Rt(f.size, 16) : f.size, g = f.columnStride === void 0 || f.columnStride === f.columnSize, b = h > 1 ? m === f.size && g : g, y = h > 1 ? m * (h - 1) + f.size : f.size;
      i.push({ name: o, type: l, info: f, byteOffset: d, byteSize: p, byteStride: m, count: h, packed: b }), s = d + y, a = Math.max(a, f.align, h > 1 ? 16 : 0);
    }
    this.fields = i, this.byteLength = Rt(s, a), this.key = `${this.structName}|${this.group}|${this.binding}|${n.map((o) => `${o}:${e[o]}`).join(",")}`;
  }
  field(e) {
    const r = this.fields.find((n) => n.name === e);
    if (!r)
      throw new c(
        `[gpu-device-api] uniform 布局里没有字段「${e}」。现有字段：${this.fields.map((n) => n.name).join("、")}。`
      );
    return r;
  }
  has(e) {
    return this.fields.some((r) => r.name === e);
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
    const e = this.fields.map((r) => {
      const n = r.count > 1 ? `${r.name}[${r.count}]` : r.name;
      return `  ${this.glslMemberType(r)} ${n};`;
    }).join(`
`);
    return `layout(std140) uniform ${this.structName} {
${e}
} ${this.instanceName};`;
  }
  /** WGSL 的 struct + binding 声明。 */
  wgslDeclaration() {
    const e = this.fields.map((r) => `  ${r.name}: ${this.wgslMemberType(r)},`).join(`
`);
    return `struct ${this.structName} {
${e}
}
@group(${this.group}) @binding(${this.binding}) var<uniform> ${this.instanceName}: ${this.structName};`;
  }
  /** 调试用：逐字段打印偏移。 */
  describe() {
    const e = this.fields.map(
      (r) => `  +${String(r.byteOffset).padStart(4)}  ${r.name.padEnd(18)} ${r.type.padEnd(14)} size=${r.byteSize} stride=${r.byteStride} count=${r.count}`
    );
    return [`${this.structName}（共 ${this.byteLength} 字节）`, ...e].join(`
`);
  }
}
const Nr = /* @__PURE__ */ new Map();
function wi(t, e) {
  const r = new pt(t, e), n = Nr.get(r.key);
  return n || (Nr.set(r.key, r), r);
}
function Xt(t, e, r, n) {
  return t === "i32" ? new Int32Array(e, r, n) : t === "u32" ? new Uint32Array(e, r, n) : new Float32Array(e, r, n);
}
function zr(t, e, r, n, i) {
  const s = [];
  return {
    type: t.type,
    count: i,
    byteStride: r,
    at(a) {
      if (a < 0 || a >= i)
        throw new RangeError(
          `[gpu-device-api] uniform 字段「${t.name}」的下标 ${a} 越界（有效范围 0..${i - 1}）。`
        );
      let o = s[a];
      return o || (o = Xt(t.info.componentType, e, t.byteOffset + a * r, n), s[a] = o), o;
    },
    set(a) {
      let o = 0;
      for (let l = 0; l < i; l++) {
        const u = this.at(l);
        for (let h = 0; h < n && o < a.length; h++, o++)
          u[h] = a[o];
      }
    },
    get(a) {
      const o = i * n, l = a ?? Xt(t.info.componentType, new ArrayBuffer(o * 4), 0, o);
      let u = 0;
      for (let h = 0; h < i; h++) {
        const f = this.at(h);
        for (let d = 0; d < n; d++, u++)
          l[u] = f[d];
      }
      return l;
    }
  };
}
class kr {
  layout;
  buffer;
  fieldValues;
  /** 每次修改自增；渲染器据此跳过没必要的上传。 */
  version = 1;
  constructor(e, r) {
    this.layout = e instanceof pt ? e : wi(e, r), this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16));
    const n = {};
    for (const i of this.layout.fields) n[i.name] = this.createFieldValue(i);
    this.fieldValues = n;
  }
  createFieldValue(e) {
    if (e.packed)
      return Xt(
        e.info.componentType,
        this.buffer,
        e.byteOffset,
        e.count * e.info.components
      );
    if (e.info.columnStride !== void 0) {
      const r = (e.info.columnSize ?? e.byteSize) / 4;
      return zr(
        e,
        this.buffer,
        e.info.columnStride,
        r,
        e.info.columns ?? 1
      );
    }
    return zr(e, this.buffer, e.byteStride, e.info.components, e.count);
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
  set(e, r) {
    const n = this.fieldValues[e];
    if (n === void 0)
      return this.layout.field(e), this;
    if (typeof r == "number") {
      if (!ArrayBuffer.isView(n))
        throw new TypeError(
          `[gpu-device-api] uniform 字段「${e}」不是标量，请传数字数组而不是单个数字。`
        );
      n[0] = r;
    } else ArrayBuffer.isView(n), n.set(r);
    return this.version += 1, this;
  }
  /** 批量写：`u.assign({ time: 1, color: [1, 0, 0, 1] })`。 */
  assign(e) {
    for (const [r, n] of Object.entries(e))
      n !== void 0 && this.set(r, n);
    return this;
  }
  /** 读回字段的紧凑数据。 */
  get(e, r) {
    const n = this.field(e);
    return ArrayBuffer.isView(n) ? n : n.get(r);
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
const Wr = /* @__PURE__ */ new WeakMap();
function Nc(t) {
  const e = Wr.get(t);
  if (e) return e;
  const r = new Proxy(t, {
    get(n, i, s) {
      return typeof i == "string" && n.has(i) ? n.field(i) : Reflect.get(n, i, s);
    },
    has(n, i) {
      return typeof i == "string" && n.has(i) ? !0 : Reflect.has(n, i);
    },
    set(n, i, s, a) {
      return typeof i == "string" && n.has(i) ? (n.set(i, s), !0) : Reflect.set(n, i, s, a);
    }
  });
  return Wr.set(t, r), r;
}
function zc(t, e) {
  const r = t instanceof pt ? new kr(t) : new kr(t, e);
  return Nc(r);
}
const Mt = "/*%uniforms%*/", jr = "/*%attributes%*/", Gt = "/*%textures%*/", kc = {
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
function Wc(t, e, r) {
  const n = e === "cube" ? "samplerCube" : e === "3d" ? "sampler3D" : e === "2d-array" ? "sampler2DArray" : "sampler2D";
  return r ? n === "sampler2D" ? "sampler2DShadow" : n === "samplerCube" ? "samplerCubeShadow" : n === "sampler2DArray" ? "sampler2DArrayShadow" : n : t === "sint" ? `i${n}` : t === "uint" ? `u${n}` : n;
}
function jc(t, e) {
  return t === "depth" ? e === "cube" ? "texture_depth_cube" : e === "2d-array" ? "texture_depth_2d_array" : "texture_depth_2d" : `${e === "cube" ? "texture_cube" : e === "3d" ? "texture_3d" : e === "2d-array" ? "texture_2d_array" : "texture_2d"}<${t === "sint" ? "i32" : t === "uint" ? "u32" : "f32"}>`;
}
function Ut(t, e) {
  let r = t;
  const n = [];
  for (const s of e)
    s.text && (r.includes(s.placeholder) ? r = r.split(s.placeholder).join(s.text) : n.push(s.text));
  return `${n.length > 0 ? `${n.join(`

`)}

` : ""}${r.trim()}
`;
}
class mt {
  name;
  desc;
  /** 属性名 → 格式，顺序即 shaderLocation。 */
  attributes;
  uniforms;
  textures;
  /** 注入声明后的 GLSL 源码。 */
  glsl;
  /** 注入声明后的 WGSL 模块。 */
  wgsl;
  constructor(e) {
    this.desc = e, this.name = e.name ?? "material";
    const r = Object.entries(e.attributes ?? {});
    if (r.length > 16)
      throw new c(
        `[gpu-device-api] 材质「${this.name}」声明了 ${r.length} 个顶点属性，超过 WebGL2/WebGPU 的 16 个上限。`
      );
    this.attributes = r.map(([d, p], m) => ({ name: d, format: p, location: m })), e.uniforms instanceof pt ? this.uniforms = e.uniforms : e.uniforms ? this.uniforms = wi(e.uniforms) : this.uniforms = null;
    const n = (e.textures ?? []).map(
      (d) => typeof d == "string" ? { name: d } : d
    );
    this.textures = n.map((d, p) => {
      const m = d.binding ?? p * 2;
      return {
        name: d.name,
        sampleType: d.sampleType ?? "float",
        viewDimension: d.viewDimension ?? "2d",
        comparison: d.comparison ?? d.sampleType === "depth",
        binding: m,
        samplerName: `${d.name}_sampler`,
        samplerBinding: m + 1
      };
    });
    const i = this.uniforms ? 1 : 0, s = this.uniforms ? this.uniforms.glslDeclaration() : "", a = this.textures.map(
      (d) => `uniform ${Wc(d.sampleType, d.viewDimension, d.comparison)} ${d.name};`
    ).join(`
`), o = this.attributes.map((d) => `layout(location = ${d.location}) in ${Oi(d.format)} ${d.name};`).join(`
`);
    if (this.glsl = {
      vs: Ut(e.glsl.vs, [
        { placeholder: Mt, text: s },
        { placeholder: jr, text: o },
        { placeholder: Gt, text: a }
      ]),
      fs: Ut(e.glsl.fs, [
        { placeholder: Mt, text: s },
        { placeholder: Gt, text: a }
      ])
    }, e.fragmentOutput !== !1) {
      const d = e.fragmentOutput ?? "fragColor";
      new RegExp(
        `\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${d}\\b`
      ).test(this.glsl.fs) || (this.glsl.fs = `layout(location = 0) out vec4 ${d};
${this.glsl.fs}`);
    }
    const l = e.wgsl, u = this.uniforms ? this.uniforms.wgslDeclaration() : "", h = this.textures.map((d) => {
      const p = d.comparison && d.sampleType === "depth" ? "sampler_comparison" : "sampler";
      return `@group(${i}) @binding(${d.binding}) var ${d.name}: ${jc(d.sampleType, d.viewDimension)};
@group(${i}) @binding(${d.samplerBinding}) var ${d.samplerName}: ${p};`;
    }).join(`
`), f = this.attributes.length > 0 ? `struct VertexInput {
${this.attributes.map((d) => `  @location(${d.location}) ${d.name}: ${Di(d.format)},`).join(`
`)}
}` : "";
    this.wgsl = Ut(l, [
      { placeholder: Mt, text: u },
      { placeholder: jr, text: f },
      { placeholder: Gt, text: h }
    ]);
  }
  /** 创建一个材质。 */
  static create(e) {
    return new mt(e);
  }
  /** 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存）。 */
  vertexBufferLayouts() {
    return this.attributes.map((e) => ({
      arrayStride: pe(e.format).byteSize,
      stepMode: "vertex",
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
  cachedGroupLayout(e, r) {
    let n = this.groupLayoutCache.get(e);
    return n || (n = /* @__PURE__ */ new Map(), this.groupLayoutCache.set(e, n)), n.has(r) || n.set(r, this.createGroupLayout(e, r)), n.get(r) ?? null;
  }
  groupLayoutCache = /* @__PURE__ */ new WeakMap();
  /** 创建 pipeline layout（必要时带上纹理 group）。 */
  createPipelineLayout(e) {
    const r = this.uniforms ? this.cachedGroupLayout(e, 0) : null, n = this.textures.length > 0 ? this.cachedGroupLayout(e, this.textureGroup) : null;
    if (!r && !n) return "auto";
    const i = [];
    return r && i.push(r), n && i.push(n), e.createPipelineLayout({ label: `${this.name}:pipelineLayout`, bindGroupLayouts: i });
  }
  /** 材质声明的纹理所在的 group（有 uniform 块时是 1，否则是 0）。 */
  get textureGroup() {
    return this.uniforms ? 1 : 0;
  }
  /** 生成可以直接交给 `device.createRenderPipeline()` 的描述。 */
  createPipelineDescriptor(e) {
    const r = this.createPipelineLayout(e), n = this.createShaderModule(e), i = this.resolveBlend(), s = i ? [{ blend: i, writeMask: 15 }] : void 0, a = this.vertexBufferLayouts();
    if (a.length === 0)
      throw new c(
        `[gpu-device-api] 材质「${this.name}」没有声明任何顶点属性。两个后端都必须显式知道顶点布局，请至少声明一个 \`attributes\`（例如 \`{ position: 'float32x3' }\`）。`
      );
    const o = {
      label: `${this.name}:pipeline`,
      layout: r,
      vertex: {
        module: n,
        entryPoint: this.desc.vertexEntry ?? "vsMain",
        buffers: a
      },
      fragment: {
        module: n,
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
    } : o.depthStencil = { format: null }, { descriptor: o, layout: r };
  }
  /** 为这个材质的 uniform 布局创建一套数值容器，并写入描述里的初始值。 */
  createUniforms() {
    if (!this.uniforms)
      throw new c(
        `[gpu-device-api] 材质「${this.name}」没有 uniform 布局，无法创建 uniform 数值容器。`
      );
    const e = zc(this.uniforms);
    if (this.desc.defaults)
      for (const [r, n] of Object.entries(this.desc.defaults)) {
        if (!e.has(r))
          throw new c(
            `[gpu-device-api] 材质「${this.name}」的 defaults 里出现了布局中不存在的字段「${r}」。布局字段：${this.uniforms.fields.map((i) => i.name).join("、")}。`
          );
        e.set(r, n);
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
      const r = kc[e];
      if (!r)
        throw new c(
          `[gpu-device-api] 材质「${this.name}」使用了未知的混合预设「${e}」。可用：none、alpha、premultiplied、additive、multiply、screen。`
        );
      return r;
    }
    return e;
  }
  /** 只为一个 group 生成 layout（内部用）。 */
  createGroupLayout(e, r) {
    const n = [];
    r === 0 && this.uniforms && n.push({
      binding: this.uniforms.binding,
      visibility: 3,
      type: F.Uniform,
      name: this.uniforms.structName,
      buffer: {
        type: "uniform",
        hasDynamicOffset: this.desc.dynamicUniforms !== !1,
        minBindingSize: this.uniforms.byteLength
      }
    });
    const s = this.uniforms ? 1 : 0;
    if (r === s)
      for (const a of this.textures)
        n.push({
          binding: a.binding,
          visibility: 3,
          type: F.Texture,
          name: a.name,
          texture: { sampleType: a.sampleType, viewDimension: a.viewDimension }
        }), n.push({
          binding: a.samplerBinding,
          visibility: 3,
          type: a.comparison && a.sampleType === "depth" ? F.ComparisonSampler : F.Sampler,
          name: a.samplerName,
          sampler: { type: a.comparison ? "comparison" : "filtering" }
        });
    return n.length === 0 ? null : e.createBindGroupLayout({ label: `${this.name}:group${r}`, entries: n });
  }
}
function qc(t) {
  return mt.create(t);
}
const Xc = 72;
class Hc {
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
  constructor(e, r, n = {}) {
    this.device = e, this.layout = r, this.label = n.label ?? `uniformArena:${r.structName}`, this.align = Math.max(1, e.limits.minUniformBufferOffsetAlignment), this.slotSize = qr(Math.max(r.byteLength, 16), this.align), this.maxCapacity = n.maxCapacity ?? 16 * 1024 * 1024, this.capacityValue = Math.max(n.initialCapacity ?? 64 * 1024, this.slotSize), this.bufferValue = this.createBuffer(this.capacityValue);
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
      throw new c(`[gpu-device-api] uniform arena「${this.label}」已释放。`);
    if (e.layout !== this.layout)
      throw new c(
        `[gpu-device-api] uniform arena「${this.label}」的布局是「${this.layout.structName}」，但收到的数值容器布局是「${e.layout.structName}」。两者必须由同一份描述创建。`
      );
    const r = this.allocate(), n = e.bytes;
    return this.device.queue.writeBuffer(this.bufferValue, r, n), this.frameWrites.push({ offset: r, data: n }), r;
  }
  /** 直接写入一段原始字节（高级用法：手写打包数据时）。 */
  writeBytes(e) {
    const r = this.allocate();
    return this.device.queue.writeBuffer(this.bufferValue, r, e), this.frameWrites.push({ offset: r, data: e }), r;
  }
  /**
   * 取得动态偏移用的 bind group。arena 扩容后会失效并按需重建。
   *
   * @param layout 材质创建的 bind group layout（必须与 arena 的布局一致）
   */
  bindGroup(e) {
    if (this._disposed)
      throw new c(`[gpu-device-api] uniform arena「${this.label}」已释放。`);
    if (this.bindGroupValue && this.bindGroupLayoutValue === e) return this.bindGroupValue;
    const r = this.device.createBindGroup({
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
    return this.bindGroupValue = r, this.bindGroupLayoutValue = e, r;
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
    const e = this.head + this.slotSize, r = Math.min(
      Math.max(this.capacityValue * 2, e),
      this.maxCapacity
    );
    if (r < e)
      throw new c(
        `[gpu-device-api] uniform arena「${this.label}」本帧需要的容量超过了上限 ${(this.maxCapacity / 1024 / 1024).toFixed(0)} MiB（需要 ${e} 字节）。
请改用「每个物体一套 UniformValues + 多个 bind group」，或减少同帧的 draw 数量。`
      );
    const n = [...this.frameWrites];
    this.bufferValue.destroy(), this.bindGroupValue?.dispose(), this.bindGroupValue = null, this.bindGroupLayoutValue = null, this.capacityValue = r, this.bufferValue = this.createBuffer(r);
    for (const i of n)
      this.device.queue.writeBuffer(this.bufferValue, i.offset, i.data);
  }
  createBuffer(e) {
    return this.device.createBuffer({
      label: `${this.label}:${e}`,
      size: qr(e, 4),
      usage: Xc
    });
  }
}
class Yc {
  device;
  arenas = /* @__PURE__ */ new Map();
  options;
  constructor(e, r = {}) {
    this.device = e, this.options = r;
  }
  /** 取得（或创建）某个布局的 arena。 */
  acquire(e) {
    let r = this.arenas.get(e.key);
    return r || (r = new Hc(this.device, e, this.options), this.arenas.set(e.key, r)), r;
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
const Kc = 40, Qc = 24, Zc = Object.freeze({
  position: "float32x3",
  normal: "float32x3",
  uv: "float32x2",
  uv1: "float32x2",
  color: "float32x4",
  tangent: "float32x4",
  joints: "uint16x4",
  weights: "float32x4"
});
class gt {
  label;
  topology;
  attributes;
  attributeNames;
  vertexCount;
  indexBuffer;
  indexFormat;
  indexCount;
  _disposed = !1;
  constructor(e) {
    this.label = e.label, this.topology = e.topology, this.attributes = e.attributes, this.attributeNames = [...e.attributes.keys()], this.vertexCount = e.vertexCount, this.indexBuffer = e.indexBuffer, this.indexFormat = e.indexFormat, this.indexCount = e.indexCount;
  }
  /** 上传几何体数据到 GPU。 */
  static create(e, r) {
    const n = r.label ?? "geometry", i = /* @__PURE__ */ new Map(), s = [
      ["position", r.position],
      ["normal", r.normal],
      ["uv", r.uv],
      ["uv1", r.uv1],
      ["color", r.color],
      ["tangent", r.tangent]
    ];
    for (const [f, d] of s)
      d && i.set(f, { data: d });
    for (const [f, d] of Object.entries(r.attributes ?? {}))
      i.set(f, ArrayBuffer.isView(d) ? { data: d } : d);
    if (i.size === 0)
      throw new c(`[gpu-device-api] 几何体「${n}」至少要有一个顶点属性。`);
    let a = r.vertexCount ?? 0;
    for (const [f, d] of i) {
      const p = d.format ?? Xr(f, d.data), m = Math.floor(d.data.byteLength / pe(p).byteSize);
      m > a && (a = m);
    }
    if (a <= 0)
      throw new c(
        `[gpu-device-api] 几何体「${n}」无法推断顶点数，请检查属性数据是否为空。`
      );
    const o = /* @__PURE__ */ new Map();
    for (const [f, d] of i) {
      const p = d.format ?? Xr(f, d.data), m = pe(p);
      if (d.data.byteLength % m.byteSize !== 0)
        throw new c(
          `[gpu-device-api] 几何体「${n}」的属性「${f}」数据长度 ${d.data.byteLength} 字节不是其格式 ${p}（${m.byteSize} 字节）的整数倍。`
        );
      const g = a * m.byteSize;
      if (d.data.byteLength < g)
        throw new c(
          `[gpu-device-api] 几何体「${n}」的属性「${f}」只有 ${d.data.byteLength} 字节，但按顶点数 ${a} 需要 ${g} 字节。所有属性必须提供同样多的顶点。`
        );
      const b = e.createBuffer({
        label: `${n}:${f}`,
        // WebGPU 要求 buffer 大小是 4 的倍数，这里统一对齐。
        size: Hr(d.data.byteLength, 4),
        usage: Kc
      });
      e.queue.writeBuffer(b, 0, d.data), o.set(f, {
        name: f,
        format: p,
        byteStride: m.byteSize,
        components: m.components,
        perInstance: d.perInstance ?? !1,
        buffer: b
      });
    }
    let l = null, u = null, h = 0;
    if (r.indices && r.indices.length > 0) {
      const f = Jc(r.indices, a, n);
      u = f instanceof Uint32Array ? "uint32" : "uint16", h = f.length, l = e.createBuffer({
        label: `${n}:indices`,
        size: Hr(f.byteLength, 4),
        usage: Qc
      }), e.queue.writeBuffer(l, 0, f);
    }
    return new gt({
      label: n,
      topology: r.topology ?? "triangle-list",
      attributes: o,
      vertexCount: a,
      indexBuffer: l,
      indexFormat: u,
      indexCount: h
    });
  }
  get disposed() {
    return this._disposed;
  }
  /** 实际的绘制顶点/索引数。 */
  get drawCount() {
    return this.indexBuffer ? this.indexCount : this.vertexCount;
  }
  /** 检查几何体是否提供了材质需要的所有属性，格式是否匹配。 */
  validateAgainst(e, r) {
    for (const n of e) {
      const i = this.attributes.get(n.name);
      if (!i)
        throw new c(
          `[gpu-device-api] 几何体「${this.label}」缺少材质「${r}」需要的属性「${n.name}」。
几何体现有属性：${this.attributeNames.join("、")}。`
        );
      if (i.format !== n.format)
        throw new c(
          `[gpu-device-api] 几何体「${this.label}」的属性「${n.name}」格式是 ${i.format}，但材质「${r}」要求 ${n.format}。`
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
function Xr(t, e) {
  const r = Zc[t];
  if (r && e instanceof Float32Array) return r;
  if (e instanceof Float32Array)
    return t === "position" || t === "normal" ? "float32x3" : "float32";
  if (e instanceof Uint32Array) return "uint32";
  if (e instanceof Int32Array) return "sint32";
  throw new c(
    `[gpu-device-api] 无法从 ${e.constructor.name} 推断属性「${t}」的顶点格式：\`uint8\` / \`uint16\` / \`sint8\` / \`sint16\` 只有 x2、x4 两种写法，无法从字节数反推分量个数。
请显式写明分量，例如 \`{ data, format: 'unorm8x4' }\` 或 \`format: 'uint16x2'\`。`
  );
}
function Jc(t, e, r) {
  if (t instanceof Uint16Array || t instanceof Uint32Array) return t;
  const n = t;
  let i = 0;
  for (const a of n) {
    if (!Number.isInteger(a) || a < 0)
      throw new c(`[gpu-device-api] 几何体「${r}」的索引里出现了非法值 ${a}。`);
    a > i && (i = a);
  }
  if (i >= e)
    throw new c(
      `[gpu-device-api] 几何体「${r}」的索引最大值 ${i} 超过了顶点数 ${e}。`
    );
  return Gi(e) === "uint32" ? Uint32Array.from(n) : Uint16Array.from(n);
}
function Hr(t, e) {
  return Math.ceil(t / e) * e;
}
function Md(t, e) {
  return gt.create(t, e);
}
class Ve {
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
    this.label = e.label, this.texture = e.texture, this.view = e.view, this.sampler = e.sampler, this.width = e.width, this.height = e.height, this.format = e.format, this.mipLevelCount = e.mipLevelCount, this.id = R("gfxTexture");
  }
  /** 创建纹理（含可选 mip 链）。 */
  static create(e, r) {
    const n = r.label ?? "texture", i = r.format ?? "rgba8unorm", s = r.flipY ?? Ht(r.data), a = r.mipmaps ?? (Ht(r.data) && i === "rgba8unorm");
    if (i !== "rgba8unorm")
      throw new c(
        `[gpu-device-api] 便捷层的纹理目前只支持 rgba8unorm（收到「${i}」）。需要其它格式请直接用 core 的 device.createTexture() + queue.writeTexture()。`
      );
    const o = eh(r.data, r.width, r.height, s), l = a ? th(o.data, o.width, o.height) : [o], u = {
      label: n,
      size: { width: o.width, height: o.height },
      format: i,
      mipLevelCount: l.length,
      usage: zi(0) | x.CopyDst
    }, h = e.createTexture(u);
    for (let d = 0; d < l.length; d++) {
      const p = l[d];
      e.queue.writeTexture(
        { texture: h, mipLevel: d, origin: { x: 0, y: 0, z: 0 } },
        p.data,
        { offset: 0, bytesPerRow: p.width * 4, rowsPerImage: p.height },
        { width: p.width, height: p.height, depthOrArrayLayers: 1 }
      );
    }
    const f = e.createSampler({
      label: `${n}:sampler`,
      addressModeU: r.wrapS ?? r.wrap ?? "clamp-to-edge",
      addressModeV: r.wrapT ?? r.wrap ?? "clamp-to-edge",
      magFilter: r.magFilter ?? "linear",
      minFilter: r.minFilter ?? "linear",
      mipmapFilter: l.length > 1 ? "linear" : "nearest"
    });
    return new Ve({
      device: e,
      label: n,
      texture: h,
      view: h.createView(),
      sampler: f,
      width: o.width,
      height: o.height,
      format: i,
      mipLevelCount: l.length
    });
  }
  /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
  static solid(e, r) {
    return Ve.create(e, {
      label: "solid",
      data: new Uint8Array([
        Math.round(r[0] * 255),
        Math.round(r[1] * 255),
        Math.round(r[2] * 255),
        Math.round(r[3] * 255)
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
function Ht(t) {
  if (!t || typeof t != "object") return !1;
  const e = t.constructor?.name ?? "";
  return e === "ImageBitmap" || e === "HTMLImageElement" || e === "HTMLCanvasElement" || e === "OffscreenCanvas" || e === "ImageData" || e === "VideoFrame" || e === "HTMLVideoElement";
}
function eh(t, e, r, n) {
  if (!Ht(t)) {
    const f = t, d = new Uint8Array(f.buffer, f.byteOffset, f.byteLength), p = e ?? 0, m = r ?? 0;
    if (p <= 0 || m <= 0)
      throw new c(
        "[gpu-device-api] 用原始像素创建纹理时必须给出 width 与 height（无法从字节数推断）。"
      );
    if (d.byteLength < p * m * 4)
      throw new c(
        `[gpu-device-api] 纹理数据只有 ${d.byteLength} 字节，但 ${p}x${m} 的 RGBA8 需要 ${p * m * 4} 字节。`
      );
    return { data: n ? Yr(d.subarray(0, p * m * 4), p, m) : d.subarray(0, p * m * 4), width: p, height: m };
  }
  if (typeof document > "u" && typeof OffscreenCanvas > "u")
    throw new c(
      "[gpu-device-api] 当前环境没有 canvas，无法解码图片来源；请改用原始像素（并给出 width/height）。"
    );
  const i = t, s = e ?? i.naturalWidth ?? i.videoWidth ?? i.width ?? 0, a = r ?? t.naturalHeight ?? t.videoHeight ?? t.height ?? 0;
  if (s <= 0 || a <= 0)
    throw new c(
      "[gpu-device-api] 图像来源还没有尺寸（图片可能尚未加载完成）。请等 load 事件之后再创建纹理。"
    );
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(s, a) : document.createElement("canvas");
  o.width = s, o.height = a;
  const l = o.getContext("2d");
  if (!l)
    throw new c("[gpu-device-api] 无法取得 2D context，图片解码失败。");
  l.drawImage(t, 0, 0, s, a);
  const u = l.getImageData(0, 0, s, a), h = new Uint8Array(u.data.buffer.slice(0));
  return { data: n ? Yr(h, s, a) : h, width: s, height: a };
}
function Yr(t, e, r) {
  const n = e * 4, i = new Uint8Array(t.byteLength);
  for (let s = 0; s < r; s++) {
    const a = s * n, o = (r - 1 - s) * n;
    i.set(t.subarray(a, a + n), o);
  }
  return i;
}
function th(t, e, r) {
  const n = [{ data: t, width: e, height: r }];
  let i = t, s = e, a = r;
  for (; s > 1 || a > 1; ) {
    const o = Math.max(1, s >> 1), l = Math.max(1, a >> 1), u = new Uint8Array(o * l * 4);
    for (let h = 0; h < l; h++) {
      const f = Math.min(h * 2, a - 1), d = Math.min(h * 2 + 1, a - 1);
      for (let p = 0; p < o; p++) {
        const m = Math.min(p * 2, s - 1), g = Math.min(p * 2 + 1, s - 1), b = (f * s + m) * 4, y = (f * s + g) * 4, S = (d * s + m) * 4, $ = (d * s + g) * 4, L = (h * o + p) * 4;
        for (let A = 0; A < 4; A++)
          u[L + A] = i[b + A] + i[y + A] + i[S + A] + i[$ + A] >> 2;
      }
    }
    n.push({ data: u, width: o, height: l }), i = u, s = o, a = l;
  }
  return n;
}
class vi {
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
  defaultTexture = null;
  frameStart = 0;
  /** 计算法线矩阵时复用的暂存区，避免每帧分配。 */
  normalMatrixScratch = xn();
  _disposed = !1;
  constructor(e) {
    this.backend = e.backend, this.device = e.device, this.context = e.context, this.canvas = e.canvas, this.logger = e.logger, this.camera = e.options.camera ?? null, this._clearColor = e.options.clearColor ?? "#0b0e13", this._pixelRatio = e.options.pixelRatio ?? e.context.pixelRatio, this._width = e.context.width, this._height = e.context.height, this.arenaPool = new Yc(e.device);
  }
  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(e) {
    const r = e.logger ?? Ne("gpu-device-api/gfx"), n = await bi({
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
    if (!n.context)
      throw new c("[gpu-device-api] 创建 Renderer 必须提供 canvas。");
    const i = new vi({
      backend: n.backend,
      device: n.device,
      context: n.context,
      canvas: e.canvas,
      logger: r,
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
  setSize(e, r, n = !0) {
    this.context.setSize(e, r, n), this.syncSize();
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
    const r = gt.create(this.device, e);
    return this.geometries.add(r), r;
  }
  /** 创建（或直接登记）一个材质。 */
  createMaterial(e) {
    const r = e instanceof mt ? e : qc(e);
    return this.materials.has(r) || this.materials.set(r, {
      material: r,
      layout: r.createPipelineLayout(this.device),
      pipeline: null,
      values: r.uniforms ? r.createUniforms() : null
    }), r;
  }
  createTexture(e) {
    const r = Ve.create(this.device, e);
    return this.textures.add(r), r;
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
    const r = e.color ?? this._clearColor;
    let n, i = null;
    if (e.target) {
      const s = e.target.createPassDescriptor({
        loadOp: e.load ? "load" : "clear",
        storeOp: "store",
        clearValue: r,
        depthLoadOp: e.load ? "load" : "clear",
        depthClearValue: e.depth ?? 1
      });
      n = s.colorAttachments[0]?.view, i = s.depthStencilAttachment;
    } else
      n = this.context.getCurrentFrameTarget().view;
    if (!n)
      throw new c("[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。");
    this.pass = this.encoder.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: [
        {
          view: n,
          loadOp: e.load ? "load" : "clear",
          storeOp: "store",
          clearValue: r
        }
      ],
      ...i ? { depthStencilAttachment: i } : {}
    }), this.commandBuffers = [], this.statsValue.drawCalls = 0, this.statsValue.triangles = 0, this.statsValue.instances = 0, this.statsValue.pipelineSwitches = 0, this._inFrame = !0;
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
      throw new c("[gpu-device-api] beginPass() 只能在 beginFrame() 之后调用。");
    this.pass?.end();
    const r = this.encoder;
    let n, i = null;
    if (e.target) {
      const s = e.target.createPassDescriptor({
        loadOp: e.load ? "load" : "clear",
        storeOp: "store",
        clearValue: e.color ?? this._clearColor,
        depthLoadOp: e.load ? "load" : "clear",
        depthClearValue: e.depth ?? 1
      });
      n = s.colorAttachments[0]?.view, i = s.depthStencilAttachment;
    } else
      n = this.context.getCurrentFrameTarget().view;
    if (!n)
      throw new c("[gpu-device-api] 当前通道没有颜色附件。");
    this.pass = r.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: [
        {
          view: n,
          loadOp: e.load ? "load" : "clear",
          storeOp: "store",
          clearValue: e.color ?? this._clearColor
        }
      ],
      ...i ? { depthStencilAttachment: i } : {}
    });
  }
  /** 绘制一个几何体。 */
  draw(e, r = {}) {
    if (!this._inFrame || !this.pass)
      throw new c(
        "[gpu-device-api] draw() 必须在 beginFrame() ... endFrame() 之间调用。"
      );
    const n = r.material ?? this.currentMaterial;
    if (!n)
      throw new c(
        "[gpu-device-api] draw() 之前必须先 setMaterial()，或在 draw() 里传 material。"
      );
    const i = this.materials.get(n) ?? (this.createMaterial(n), this.materials.get(n));
    e.validateAgainst(n.attributes, n.name);
    const s = this.acquirePipeline(i);
    if (this.pass.setPipeline(s), this.statsValue.pipelineSwitches += 1, n.uniforms && i.values) {
      if (this.applyCameraUniforms(i.values, n), r.model && this.setIfPresent(i.values, "model", r.model), this.updateNormalMatrix(i.values, n), r.uniforms)
        for (const [o, l] of Object.entries(r.uniforms))
          this.setIfPresent(i.values, o, l);
      const a = n.createUniformBindGroupLayout(this.device);
      if (a) {
        const o = this.arenaPool.acquire(n.uniforms), l = o.write(i.values);
        this.pass.setBindGroup(n.uniforms.group, o.bindGroup(a), [l]);
      }
    }
    if (n.textures.length > 0) {
      const a = this.acquireTextureBindGroup(n, r.textures ?? {});
      a && this.pass.setBindGroup(n.textureGroup, a);
    }
    for (const a of n.attributes) {
      const o = e.attributes.get(a.name);
      this.pass.setVertexBuffer(a.location, o.buffer, 0, o.buffer.size);
    }
    e.indexBuffer && e.indexFormat ? (this.pass.setIndexBuffer(e.indexBuffer, e.indexFormat, 0, e.indexBuffer.size), this.pass.drawIndexed({
      indexCount: r.count ?? e.indexCount,
      ...r.first !== void 0 ? { firstIndex: r.first } : {},
      ...r.instances !== void 0 ? { instanceCount: r.instances } : {}
    })) : this.pass.draw({
      vertexCount: r.count ?? e.vertexCount,
      ...r.first !== void 0 ? { firstVertex: r.first } : {},
      ...r.instances !== void 0 ? { instanceCount: r.instances } : {}
    }), this.statsValue.drawCalls += 1, this.statsValue.instances += r.instances ?? 1, this.statsValue.triangles += rh(e, r) * (r.instances ?? 1);
  }
  /** 一次画多个实例（需要材质配合 `perInstance` 属性）。 */
  drawInstanced(e, r, n = {}) {
    this.draw(e, { ...n, instances: r });
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
    const { descriptor: r } = e.material.createPipelineDescriptor(this.device);
    return e.pipeline = this.device.createRenderPipeline(r), e.pipeline;
  }
  /** 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。 */
  applyCameraUniforms(e, r) {
    const n = this.camera;
    n && (n.aspect = this.aspect, n.depthRange = this.backend === "webgpu" ? "zo" : "gl", n.update(), r.uniforms?.has("projectionView") && e.set("projectionView", n.projectionViewMatrix), r.uniforms?.has("projection") && e.set("projection", n.projectionMatrix), r.uniforms?.has("view") && e.set("view", n.viewMatrix), r.uniforms?.has("cameraPosition") && e.set("cameraPosition", n.position), r.uniforms?.has("model") && e.set("model", J()));
  }
  /**
   * 由当前 `model` 计算法线矩阵。
   *
   * 非等比缩放会破坏法线方向（法线不再垂直于表面），必须用「模型矩阵左上 3x3 的逆转置」。
   * 这里自动算好，材质只要声明了 `normalMatrix` 字段就能直接用。
   */
  updateNormalMatrix(e, r) {
    if (!r.uniforms?.has("normalMatrix") || !r.uniforms.has("model")) return;
    const n = e.get("model");
    Ln(this.normalMatrixScratch, n) || yn(this.normalMatrixScratch), e.set("normalMatrix", this.normalMatrixScratch);
  }
  setIfPresent(e, r, n) {
    e.has(r) && e.set(r, n);
  }
  /**
   * 取得（必要时创建）纹理的 bind group。
   *
   * 缓存键由「材质 + 每个槽位实际用的纹理 id」组成：同一个材质换纹理时才会重建，
   * 反复用同一组纹理绘制不会重复创建。没给纹理的槽位绑一张 1×1 的白色占位纹理，
   * 这样「忘了传纹理」的表现是白色而不是未定义数据。
   */
  acquireTextureBindGroup(e, r) {
    const n = e.createTextureGroupLayout(this.device);
    if (!n) return null;
    const i = e.textures.map((u) => r[u.name] ?? this.getDefaultTexture()), s = `${e.name}|${i.map((u) => u.id).join(",")}`, a = this.bindGroups.get(s);
    if (a) return a;
    const o = e.textures.flatMap((u, h) => {
      const f = i[h];
      return [
        { binding: u.binding, resource: { view: f.view } },
        { binding: u.samplerBinding, resource: { sampler: f.sampler } }
      ];
    }), l = this.device.createBindGroup({
      label: `${e.name}:textures`,
      layout: n,
      entries: o
    });
    return this.bindGroups.set(s, l), l;
  }
  /** 缺省纹理（材质声明了纹理但调用方没给时用，避免绑到未定义数据）。 */
  getDefaultTexture() {
    return this.defaultTexture || (this.defaultTexture = Ve.create(this.device, {
      label: "default-white",
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      mipmaps: !1
    })), this.defaultTexture;
  }
}
function rh(t, e) {
  const r = e.count ?? t.drawCount;
  switch (t.topology) {
    case "triangle-list":
      return Math.floor(r / 3);
    case "triangle-strip":
      return Math.max(0, r - 2);
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
const nh = 1e-6, Kr = C(), Qr = C();
function Ee(t, e, r, n, i) {
  if (e === void 0) return le(t, r, n, i);
  if (e.length < 3)
    throw new RangeError("[gpu-device-api] A vector option needs at least 3 components.");
  const s = e[0], a = e[1], o = e[2];
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(o))
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${s}, ${a}, ${o}).`);
  return le(t, s, a, o);
}
function xi(t) {
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function ih(t, e, r) {
  if (!(t > 0) || t >= 180)
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${t}.`);
  if (!(e > 0))
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${e}.`);
  if (Number.isNaN(r) || r <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${r}.`);
}
function sh(t, e, r) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${t}.`);
  if (!Number.isFinite(e) || Number.isNaN(r) || r <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${e}, far = ${r}.`);
}
function yi(t) {
  if (Ge(Kr, t.position, t.target), Ae(Kr) < nh) {
    le(Qr, t.target[0], t.target[1], t.target[2] + 1), Nt(t.viewMatrix, Qr, t.target, t.up);
    return;
  }
  Nt(t.viewMatrix, t.position, t.target, t.up);
}
class Gd {
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
  viewMatrix = J();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  projectionMatrixGL = J();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  projectionMatrixZO = J();
  projectionViewMatrix = J();
  constructor(e = {}) {
    this.position = Ee(C(), e.position, 0, 0, 5), this.target = Ee(C(), e.target, 0, 0, 0), this.up = Ee(C(), e.up, 0, 1, 0), this.fov = e.fov ?? 60, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
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
    ih(this.fov, this.near, this.far), yi(this);
    const e = Vn(this.fov), r = xi(this.aspect);
    Gn(this.projectionMatrixGL, e, r, this.near, this.far), Un(this.projectionMatrixZO, e, r, this.near, this.far), se(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
class Ud {
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
  viewMatrix = J();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  projectionMatrixGL = J();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  projectionMatrixZO = J();
  projectionViewMatrix = J();
  constructor(e = {}) {
    this.position = Ee(C(), e.position, 0, 0, 5), this.target = Ee(C(), e.target, 0, 0, 0), this.up = Ee(C(), e.up, 0, 1, 0), this.size = e.size ?? 2, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 按 `depthRange` 选出的那一套投影矩阵，返回的是另外两份矩阵之一本身（同一个对象）。
   */
  get projectionMatrix() {
    return this.depthRange === "zo" ? this.projectionMatrixZO : this.projectionMatrixGL;
  }
  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update() {
    sh(this.size, this.near, this.far), yi(this);
    const e = this.size / 2, r = e * xi(this.aspect);
    On(this.projectionMatrixGL, -r, r, -e, e, this.near, this.far), Dn(this.projectionMatrixZO, -r, r, -e, e, this.near, this.far), se(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
const Zr = 1e-4, ae = 1e-6, ah = 0.95, X = C(), Jr = C(), en = C();
function de(t, e) {
  if (!Number.isFinite(t))
    throw new RangeError(`[gpu-device-api] ${e} must be a finite number, got ${t}.`);
  return t;
}
class Od {
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
  panOffset = C();
  /** `reset()` 要恢复到的初始状态。 */
  initialPosition = C();
  initialTarget = C();
  previousPosition = C();
  previousTarget = C();
  pointers = /* @__PURE__ */ new Map();
  mode = "none";
  /** 双指捏合时，上一次两指之间的距离。 */
  pinchDistance = 0;
  disposed = !1;
  constructor(e, r, n = {}) {
    if (!r || typeof r.addEventListener != "function" || typeof r.removeEventListener != "function")
      throw new TypeError("[gpu-device-api] OrbitControls requires a DOM element with addEventListener/removeEventListener.");
    if (!e || !e.position || !e.target || typeof e.update != "function")
      throw new TypeError("[gpu-device-api] OrbitControls requires a PerspectiveCamera instance.");
    if (this.camera = e, this.element = r, this.enabled = n.enabled ?? !0, this.enableRotate = n.enableRotate ?? !0, this.enableZoom = n.enableZoom ?? !0, this.enablePan = n.enablePan ?? !0, this.enableDamping = n.enableDamping ?? !0, this.dampingFactor = Le(n.dampingFactor ?? 0.08, 0, 1), this.rotateSpeed = de(n.rotateSpeed ?? 1, "options.rotateSpeed"), this.zoomSpeed = de(n.zoomSpeed ?? 1, "options.zoomSpeed"), this.panSpeed = de(n.panSpeed ?? 1, "options.panSpeed"), this.minDistance = de(n.minDistance ?? 0.1, "options.minDistance"), this.maxDistance = de(n.maxDistance ?? 1e3, "options.maxDistance"), this.minPolarAngle = de(n.minPolarAngle ?? 0, "options.minPolarAngle"), this.maxPolarAngle = de(n.maxPolarAngle ?? Math.PI, "options.maxPolarAngle"), this.minDistance <= 0)
      throw new RangeError(`[gpu-device-api] minDistance must be positive, got ${this.minDistance}.`);
    if (this.maxDistance < this.minDistance)
      throw new RangeError(`[gpu-device-api] maxDistance must not be smaller than minDistance, got ${this.maxDistance}.`);
    if (this.minPolarAngle < 0 || this.maxPolarAngle > Math.PI || this.minPolarAngle > this.maxPolarAngle)
      throw new RangeError(
        `[gpu-device-api] polar angles must satisfy 0 <= minPolarAngle <= maxPolarAngle <= PI, got ${this.minPolarAngle} and ${this.maxPolarAngle}.`
      );
    if (this.rotateSpeed < 0 || this.zoomSpeed < 0 || this.panSpeed < 0)
      throw new RangeError("[gpu-device-api] Speed options must be non-negative.");
    te(this.initialPosition, e.position), te(this.initialTarget, e.target), te(this.previousPosition, e.position), te(this.previousTarget, e.target), this.readSpherical(), this.element.addEventListener("pointerdown", this.onPointerDown), this.element.addEventListener("pointermove", this.onPointerMove), this.element.addEventListener("pointerup", this.onPointerUp), this.element.addEventListener("pointercancel", this.onPointerUp), this.element.addEventListener("wheel", this.onWheel, { passive: !1 }), this.element.addEventListener("contextmenu", this.onContextMenu);
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
    const e = this.camera, r = e.target, n = e.position;
    te(this.previousPosition, n), te(this.previousTarget, r), Ge(X, n, r);
    let i = Ae(X);
    i < ae ? i = this.minDistance : (this.theta = Math.atan2(X[0], X[2]), this.phi = Math.acos(Le(X[1] / i, -1, 1)));
    const s = Math.abs(this.deltaTheta) > ae || Math.abs(this.deltaPhi) > ae, a = Math.abs(this.scale - 1) > ae, o = Ae(this.panOffset) > ae;
    if (!s && !a && !o)
      return !1;
    const l = this.enableDamping ? this.dampingFactor : 1;
    this.theta += this.deltaTheta * l, this.phi += this.deltaPhi * l, this.phi = Le(
      this.phi,
      Math.max(this.minPolarAngle, Zr),
      Math.min(this.maxPolarAngle, Math.PI - Zr)
    ), i = Le(i * this.scale, this.minDistance, this.maxDistance), at(r, r, this.panOffset, l);
    const u = Math.sin(this.phi) * i;
    le(
      n,
      r[0] + u * Math.sin(this.theta),
      r[1] + Math.cos(this.phi) * i,
      r[2] + u * Math.cos(this.theta)
    ), this.enableDamping ? (this.deltaTheta *= 1 - this.dampingFactor, this.deltaPhi *= 1 - this.dampingFactor, bn(this.panOffset, this.panOffset, 1 - this.dampingFactor)) : (this.deltaTheta = 0, this.deltaPhi = 0, Vt(this.panOffset)), this.scale = 1, e.update();
    const h = !It(n, this.previousPosition, ae), f = !It(r, this.previousTarget, ae);
    return h || f;
  }
  /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
  reset() {
    this.disposed || (te(this.camera.position, this.initialPosition), te(this.camera.target, this.initialTarget), this.deltaTheta = 0, this.deltaPhi = 0, this.scale = 1, Vt(this.panOffset), this.mode = "none", this.pinchDistance = 0, this.pointers.clear(), this.readSpherical(), this.camera.update());
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
    Ge(X, this.camera.position, this.camera.target);
    const e = Ae(X);
    e < ae || (this.theta = Math.atan2(X[0], X[2]), this.phi = Math.acos(Le(X[1] / e, -1, 1)));
  }
  /** 元素的可视高度；取不到（例如无布局的测试替身）时退回 1，避免除零。 */
  clientHeight() {
    const e = this.element.clientHeight;
    return Number.isFinite(e) && e > 0 ? e : 1;
  }
  /** 当前两指之间的距离。 */
  currentPinchDistance() {
    const e = [...this.pointers.values()], r = e[0], n = e[1];
    return r === void 0 || n === void 0 ? 0 : Math.hypot(r.x - n.x, r.y - n.y);
  }
  /** 所有活动指针是否都是触摸。 */
  allPointersAreTouch() {
    for (const e of this.pointers.values())
      if (e.type !== "touch") return !1;
    return !0;
  }
  /** 旋转：把屏幕像素位移换算成 theta / phi 增量。 */
  rotateBy(e, r) {
    const n = 2 * Math.PI * this.rotateSpeed / this.clientHeight();
    this.deltaTheta -= e * n, this.deltaPhi -= r * n;
  }
  /**
   * 平移：沿**相机自身**的 right / up 轴移动。
   *
   * view 矩阵的第 0 / 1 行就是相机在世界空间的 right / up 轴；矩阵是列主序存储的，
   * 所以这两行分别是 (m[0], m[4], m[8]) 与 (m[1], m[5], m[9])。
   */
  panBy(e, r) {
    const n = this.camera, i = n.viewMatrix, s = this.clientHeight();
    Ge(X, n.position, n.target);
    const o = 2 * (Ae(X) * Math.tan(Vn(n.fov) / 2)) * this.panSpeed / s;
    le(Jr, i[0], i[4], i[8]), le(en, i[1], i[5], i[9]), at(this.panOffset, this.panOffset, Jr, -e * o), at(this.panOffset, this.panOffset, en, r * o);
  }
  onPointerDown = (e) => {
    if (!this.enabled) return;
    const r = this.element;
    typeof r.setPointerCapture == "function" && r.setPointerCapture(e.pointerId), this.pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
      button: e.button
    }), this.pointers.size === 1 ? (this.mode = e.pointerType === "touch" || e.button === 0 ? "rotate" : "pan", this.pinchDistance = 0) : this.pointers.size === 2 && this.allPointersAreTouch() && (this.mode = "pinch", this.pinchDistance = this.currentPinchDistance()), e.cancelable && e.preventDefault();
  };
  onPointerMove = (e) => {
    if (!this.enabled) return;
    const r = this.pointers.get(e.pointerId);
    if (r === void 0) return;
    const n = e.clientX - r.x, i = e.clientY - r.y;
    if (r.x = e.clientX, r.y = e.clientY, this.mode === "pinch" && this.pointers.size >= 2) {
      if (!this.enableZoom) return;
      const s = this.currentPinchDistance();
      s > 0 && this.pinchDistance > 0 && (this.scale *= this.pinchDistance / s), this.pinchDistance = s;
      return;
    }
    n === 0 && i === 0 || (this.mode === "rotate" && this.enableRotate ? this.rotateBy(n, i) : this.mode === "pan" && this.enablePan && this.panBy(n, i));
  };
  onPointerUp = (e) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    const r = this.element;
    if (typeof r.hasPointerCapture == "function" && typeof r.releasePointerCapture == "function" && r.hasPointerCapture(e.pointerId) && r.releasePointerCapture(e.pointerId), this.pointers.size === 1) {
      for (const n of this.pointers.values()) {
        this.mode = n.type === "touch" || n.button === 0 ? "rotate" : "pan";
        break;
      }
      this.pinchDistance = 0;
    } else this.pointers.size === 0 && (this.mode = "none", this.pinchDistance = 0);
  };
  onWheel = (e) => {
    if (!this.enabled || !this.enableZoom) return;
    e.cancelable && e.preventDefault();
    const r = Math.pow(ah, this.zoomSpeed);
    e.deltaY < 0 ? this.scale *= r : e.deltaY > 0 && (this.scale /= r);
  };
  onContextMenu = (e) => {
    !this.enabled || !this.enablePan || e.cancelable && e.preventDefault();
  };
}
const Se = C();
function Pe() {
  return { position: [], normal: [], uv: [], index: [] };
}
function Ti() {
  return { position: [], color: [] };
}
function ue(t, e, r, n, i, s, a, o, l) {
  le(Se, i, s, a), wn(Se, Se), t.position.push(e, r, n), t.normal.push(Se[0], Se[1], Se[2]), t.uv.push(o, l);
}
function P(t, e, r, n, i, s, a, o) {
  t.position.push(e, r, n), t.color.push(i, s, a, o);
}
function Ce(t) {
  return {
    position: Float32Array.from(t.position),
    normal: Float32Array.from(t.normal),
    uv: Float32Array.from(t.uv),
    indices: Uint32Array.from(t.index)
  };
}
function Si(t) {
  return {
    position: Float32Array.from(t.position),
    color: Float32Array.from(t.color)
  };
}
function $i(t) {
  return t.position.length / 3;
}
function N(t, e) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite positive number, got ${t}.`);
  return t;
}
function tn(t, e) {
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite non-negative number, got ${t}.`);
  return t;
}
function H(t, e, r) {
  if (!Number.isInteger(t) || t < e)
    throw new RangeError(`[gpu-device-api] ${r} must be an integer greater than or equal to ${e}, got ${t}.`);
  return t;
}
const oh = [0.5, 0.5, 0.5, 1];
function lh(t = {}) {
  const e = N(t.radius ?? 0.5, "options.radius"), r = Pe();
  for (let n = 0; n < 3; n++) {
    const i = Math.PI / 2 + n * 2 * Math.PI / 3, s = Math.cos(i) * e, a = Math.sin(i) * e;
    ue(r, s, a, 0, 0, 0, 1, s / (2 * e) + 0.5, a / (2 * e) + 0.5);
  }
  return r.index.push(0, 1, 2), Ce(r);
}
function uh(t = {}) {
  const e = N(t.width ?? 1, "options.width"), r = N(t.height ?? 1, "options.height"), n = H(t.widthSegments ?? 1, 1, "options.widthSegments"), i = H(t.heightSegments ?? 1, 1, "options.heightSegments"), s = Pe(), a = n + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, u = -r / 2 + l * r;
    for (let h = 0; h <= n; h++) {
      const f = h / n, d = -e / 2 + f * e;
      ue(s, d, u, 0, 0, 0, 1, f, l);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < n; l++) {
      const u = o * a + l, h = u + 1, f = u + a + 1, d = u + a;
      s.index.push(u, h, f, u, f, d);
    }
  return Ce(s);
}
function $e(t, e, r, n, i, s, a) {
  const o = $i(t), l = s + 1;
  for (let u = 0; u <= a; u++) {
    const h = u / a;
    for (let f = 0; f <= s; f++) {
      const d = f / s;
      ue(
        t,
        e[0] + r[0] * d + n[0] * h,
        e[1] + r[1] * d + n[1] * h,
        e[2] + r[2] * d + n[2] * h,
        i[0],
        i[1],
        i[2],
        d,
        h
      );
    }
  }
  for (let u = 0; u < a; u++)
    for (let h = 0; h < s; h++) {
      const f = o + u * l + h, d = f + 1, p = f + l + 1, m = f + l;
      t.index.push(f, d, p, f, p, m);
    }
}
function ch(t = {}) {
  const e = N(t.width ?? 1, "options.width"), r = N(t.height ?? 1, "options.height"), n = N(t.depth ?? 1, "options.depth"), i = H(t.widthSegments ?? 1, 1, "options.widthSegments"), s = H(t.heightSegments ?? 1, 1, "options.heightSegments"), a = H(t.depthSegments ?? 1, 1, "options.depthSegments"), o = e / 2, l = r / 2, u = n / 2, h = Pe();
  return $e(h, [o, -l, -u], [0, r, 0], [0, 0, n], [1, 0, 0], s, a), $e(h, [-o, -l, -u], [0, 0, n], [0, r, 0], [-1, 0, 0], a, s), $e(h, [-o, l, -u], [0, 0, n], [e, 0, 0], [0, 1, 0], a, i), $e(h, [-o, -l, -u], [e, 0, 0], [0, 0, n], [0, -1, 0], i, a), $e(h, [-o, -l, u], [e, 0, 0], [0, r, 0], [0, 0, 1], i, s), $e(h, [-o, -l, -u], [0, r, 0], [e, 0, 0], [0, 0, -1], s, i), Ce(h);
}
function hh(t = {}) {
  const e = N(t.radius ?? 0.5, "options.radius"), r = H(t.widthSegments ?? 32, 3, "options.widthSegments"), n = H(t.heightSegments ?? 16, 2, "options.heightSegments"), i = Pe(), s = r + 1;
  for (let a = 0; a <= n; a++) {
    const o = a / n, l = o * Math.PI, u = Math.sin(l), h = Math.cos(l);
    for (let f = 0; f <= r; f++) {
      const d = f / r, p = d * Math.PI * 2, m = u * Math.cos(p), g = h, b = u * Math.sin(p);
      ue(i, m * e, g * e, b * e, m, g, b, d, 1 - o);
    }
  }
  for (let a = 0; a < n; a++)
    for (let o = 0; o < r; o++) {
      const l = a * s + o, u = l + 1, h = l + s + 1, f = l + s;
      i.index.push(l, u, h, l, h, f);
    }
  return Ce(i);
}
function dh(t = {}) {
  const e = N(t.radius ?? 0.5, "options.radius"), r = N(t.tube ?? 0.2, "options.tube"), n = H(t.radialSegments ?? 16, 3, "options.radialSegments"), i = H(t.tubularSegments ?? 32, 3, "options.tubularSegments"), s = Pe(), a = n + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, u = l * Math.PI * 2, h = Math.cos(u), f = Math.sin(u);
    for (let d = 0; d <= n; d++) {
      const p = d / n, m = p * Math.PI * 2, g = Math.cos(m), b = Math.sin(m), y = e + r * g, S = g * h, $ = b, L = g * f;
      ue(s, y * h, r * b, y * f, S, $, L, l, p);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < n; l++) {
      const u = o * a + l, h = u + 1, f = u + a + 1, d = u + a;
      s.index.push(u, h, f, u, f, d);
    }
  return Ce(s);
}
function rn(t, e, r, n, i) {
  const s = $i(t);
  ue(t, 0, e, 0, 0, n, 0, 0.5, 0.5);
  for (let a = 0; a <= i; a++) {
    const o = a / i * Math.PI * 2, l = Math.sin(o), u = Math.cos(o);
    ue(t, r * l, e, r * u, 0, n, 0, 0.5 + l * 0.5, 0.5 + u * 0.5);
  }
  for (let a = 0; a < i; a++) {
    const o = s + 1 + a, l = o + 1;
    n > 0 ? t.index.push(s, o, l) : t.index.push(s, l, o);
  }
}
function Li(t = {}) {
  const e = tn(t.radiusTop ?? 0.5, "options.radiusTop"), r = tn(t.radiusBottom ?? 0.5, "options.radiusBottom"), n = N(t.height ?? 1, "options.height"), i = H(t.radialSegments ?? 24, 3, "options.radialSegments"), s = H(t.heightSegments ?? 1, 1, "options.heightSegments"), a = t.caps ?? !0;
  if (e === 0 && r === 0)
    throw new RangeError("[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.");
  const o = Pe(), l = i + 1, u = Math.hypot(n, r - e), h = n / u, f = (r - e) / u;
  for (let d = 0; d <= s; d++) {
    const p = d / s, m = n / 2 - p * n, g = e + (r - e) * p;
    for (let b = 0; b <= i; b++) {
      const y = b / i, S = y * Math.PI * 2, $ = Math.sin(S), L = Math.cos(S);
      ue(o, g * $, m, g * L, h * $, f, h * L, y, 1 - p);
    }
  }
  for (let d = 0; d < s; d++)
    for (let p = 0; p < i; p++) {
      const m = d * l + p, g = m + 1, b = m + l + 1, y = m + l;
      o.index.push(m, y, b, m, b, g);
    }
  return a && (e > 0 && rn(o, n / 2, e, 1, i), r > 0 && rn(o, -n / 2, r, -1, i)), Ce(o);
}
function fh(t = {}) {
  const e = N(t.radius ?? 0.5, "options.radius");
  return Li({
    radiusTop: 0,
    radiusBottom: e,
    height: t.height ?? 1,
    radialSegments: t.radialSegments ?? 24,
    heightSegments: 1,
    caps: t.caps ?? !0
  });
}
function ph(t = {}) {
  const e = N(t.size ?? 10, "options.size"), r = H(t.divisions ?? 10, 1, "options.divisions"), n = t.plane ?? "xz", i = t.color ?? oh, [s, a, o, l] = i, u = Ti(), h = e / 2, f = e / r;
  for (let d = 0; d <= r; d++) {
    const p = -h + d * f;
    n === "xz" ? (P(u, -h, 0, p, s, a, o, l), P(u, h, 0, p, s, a, o, l), P(u, p, 0, -h, s, a, o, l), P(u, p, 0, h, s, a, o, l)) : n === "xy" ? (P(u, -h, p, 0, s, a, o, l), P(u, h, p, 0, s, a, o, l), P(u, p, -h, 0, s, a, o, l), P(u, p, h, 0, s, a, o, l)) : (P(u, 0, -h, p, s, a, o, l), P(u, 0, h, p, s, a, o, l), P(u, 0, p, -h, s, a, o, l), P(u, 0, p, h, s, a, o, l));
  }
  return Si(u);
}
function mh(t = {}) {
  const e = N(t.size ?? 1, "options.size"), r = Ti();
  return P(r, 0, 0, 0, 1, 0, 0, 1), P(r, e, 0, 0, 1, 0, 0, 1), P(r, 0, 0, 0, 0, 1, 0, 1), P(r, 0, e, 0, 0, 1, 0, 1), P(r, 0, 0, 0, 0, 0, 1, 1), P(r, 0, 0, e, 0, 0, 1, 1), Si(r);
}
const Dd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createAxes: mh,
  createBox: ch,
  createCone: fh,
  createCylinder: Li,
  createGrid: ph,
  createPlane: uh,
  createSphere: hh,
  createTorus: dh,
  createTriangle: lh
}, Symbol.toStringTag, { value: "Module" }));
function Ie(t, e) {
  return t ? [t[0], t[1], t[2], t[3] ?? 1] : [...e];
}
const be = {
  projectionView: "mat4x4f",
  model: "mat4x4f",
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它�?*/
  normalMatrix: "mat3x3f"
};
function Ai(t = {}) {
  const e = Ie(t.color, [1, 1, 1, 1]);
  return {
    name: "unlit",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...be, baseColor: "vec4f" },
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
function _i(t = {}) {
  const e = Fi(t.direction ?? [0.5, 1, 0.6]), r = Ie(t.color, [1, 1, 1, 1]);
  return {
    name: "lambert",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...be,
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
    defaults: { baseColor: r, lightDirection: e, ambient: t.ambient ?? 0.18 }
  };
}
function Ei(t = {}) {
  const e = Fi(t.direction ?? [0.5, 1, 0.6]), r = Ie(t.color, [0.9, 0.9, 0.95, 1]), n = Ie(t.specular, [1, 1, 1, 1]);
  return {
    name: "phong",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...be,
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
      baseColor: r,
      specularColor: n,
      lightDirection: e,
      ambient: t.ambient ?? 0.16,
      shininess: t.shininess ?? 48
    }
  };
}
function Pi() {
  return {
    name: "normalDebug",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...be },
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
function Ci(t = {}) {
  const e = Ie(t.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: "flatLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3" },
    uniforms: { ...be, baseColor: "vec4f" },
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
function Bi() {
  return {
    name: "vertexColorLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3", color: "float32x4" },
    uniforms: { ...be },
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
const gh = {
  unlit: Ai,
  lambert: _i,
  phong: Ei,
  normalDebug: Pi,
  flatLine: Ci,
  vertexColorLine: Bi
};
function bh(t) {
  return t.defaults ? { ...t.defaults } : {};
}
function Fi(t) {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}
const Vd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SCENE_UNIFORM_FIELDS: be,
  defaultUniformsOf: bh,
  flatLine: Ci,
  lambert: _i,
  materials: gh,
  normalDebug: Pi,
  phong: Ei,
  unlit: Ai,
  vertexColorLine: Bi
}, Symbol.toStringTag, { value: "Module" }));
export {
  jr as ATTRIBUTE_PLACEHOLDER,
  Rh as AddressMode,
  Wi as BLEND_PRESETS,
  wo as BackendRegistry,
  F as BindingType,
  Eh as BlendFactor,
  Ph as BlendOperation,
  U as BufferUsage,
  re as ColorWriteMask,
  _h as CompareFunction,
  Bh as CullMode,
  Gc as DEFAULT_BACKEND_ORDER,
  ki as DEFAULT_BLEND_COMPONENT,
  lr as DEFAULT_DEPTH_STATE,
  bt as DEFAULT_PRIMITIVE_STATE,
  ja as DEG2RAD,
  nn as DEPTH_STENCIL_FORMATS,
  Ot as DeviceLostError,
  ud as DisposalScope,
  md as EPSILON,
  Mh as FilterMode,
  Fh as FrontFace,
  Qa as GLSL_PREAMBLE,
  po as GLSL_SAMPLER_TYPES,
  ho as GLSL_TYPE_NAMES,
  gt as Geometry,
  Ve as GfxTexture,
  oe as GpuError,
  $h as IndexFormat,
  sd as LOG_LEVEL_NAMES,
  Yi as LOG_LEVEL_VALUES,
  Lh as LoadOp,
  V as LogLevel,
  jr as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  Gt as MATERIAL_TEXTURE_PLACEHOLDER,
  Mt as MATERIAL_UNIFORM_PLACEHOLDER,
  mt as Material,
  Od as OrbitControls,
  Ud as OrthographicCamera,
  Ii as OutOfMemoryError,
  Gd as PerspectiveCamera,
  yh as PrimitiveTopology,
  Dt as QueryType,
  qa as RAD2DEG,
  wh as RENDERABLE_FORMATS,
  vi as Renderer,
  be as SCENE_UNIFORM_FIELDS,
  xh as SHADER_STAGE_NAMES,
  Zc as STANDARD_ATTRIBUTE_FORMATS,
  Xe as STENCIL_FACE_DEFAULT,
  I as ShaderStage,
  Ch as StencilOperation,
  Ah as StoreOp,
  Gt as TEXTURE_PLACEHOLDER,
  st as TextureDimension,
  x as TextureUsage,
  Ir as UNIFORM_FIELD_TYPES,
  Mt as UNIFORM_PLACEHOLDER,
  Hc as UniformArena,
  Yc as UniformArenaPool,
  pt as UniformLayout,
  kr as UniformValues,
  Ui as VERTEX_FORMAT_INFO,
  c as ValidationError,
  Gh as VertexStepMode,
  mn as alignTo,
  Yh as alignTo4,
  Qt as assert,
  Wh as assertDefined,
  E as assertNever,
  dt as assertNonNegativeInteger,
  Oe as assertPositiveInteger,
  jh as assertPowerOfTwo,
  th as buildMipChain,
  Hh as byteLengthOf,
  dn as cacheKey,
  Le as clamp,
  Ed as clearShaders,
  td as combineFlags,
  zt as compileShaderStage,
  Qh as concatTypedArrays,
  mh as createAxes,
  ch as createBox,
  fh as createCone,
  Li as createCylinder,
  or as createDefaultBackendRegistry,
  Rd as createDevice,
  bi as createDeviceWithAdapter,
  Md as createGeometry,
  ph as createGrid,
  Ne as createLogger,
  ji as createPipelineCache,
  uh as createPlane,
  hh as createSphere,
  dh as createTorus,
  lh as createTriangle,
  zc as createUniforms,
  nd as currentId,
  pn as defaultPixelRatio,
  zi as defaultTextureUsage,
  bh as defaultUniformsOf,
  qc as defineMaterial,
  wi as defineUniforms,
  Vn as degToRad,
  kh as describeAdapter,
  Ya as describeShaderSource,
  Uc as detectBackend,
  gn as disposeAll,
  Cd as findWgslEntryPoint,
  Ci as flatLine,
  rd as formatFlags,
  xd as formatShaderErrorLog,
  Ni as fullMipLevelCount,
  od as getGlobalLogLevel,
  Ld as getShader,
  Ja as glslDefines,
  Nn as glslFieldForStage,
  fo as glslTypeName,
  ed as hasAllFlags,
  Jh as hasAnyFlag,
  Zh as hasFlag,
  $d as hasShader,
  Mi as indexFormatByteSize,
  bo as inferBindGroupLayoutEntries,
  Xa as inverseLerp,
  Xh as isArrayBufferView,
  Fd as isBackendAvailable,
  sn as isBufferBinding,
  Dh as isBufferBindingResource,
  Ri as isDepthStencilFormat,
  Ki as isDisposable,
  Vi as isGpuError,
  Ht as isImageSource,
  an as isSamplerBinding,
  Vh as isSamplerBindingResource,
  kn as isSamplerType,
  vh as isSrgbFormat,
  Uh as isTextureBinding,
  Ih as isTextureBindingResource,
  Th as isTriangleTopology,
  qh as isTypedArray,
  _i as lambert,
  In as languageForBackend,
  bd as lerp,
  io as listShaderKeys,
  fd as mat3,
  pd as mat4,
  Vd as materials,
  Me as measureCanvas,
  Ka as missingSourceMessage,
  vd as nextAfter,
  R as nextId,
  Pi as normalDebug,
  un as normalizeBindGroupLayoutEntries,
  ld as nullLogger,
  yd as numberLines,
  Hi as paddedCopy,
  Ei as phong,
  Sh as primitiveCount,
  gd as radToDeg,
  mo as reflectGlslProgram,
  go as reflectSamplerUniforms,
  Pd as reflectWgslBindings,
  co as reflectWgslEntryPoints,
  no as registerShader,
  Td as registerShaders,
  Sd as replaceShader,
  Ad as requireShader,
  id as resetIdCounter,
  Nh as resolveBindingLayoutEntry,
  zh as resolveBlendState,
  fn as resolveLimits,
  on as resolveSamplerDescriptor,
  ln as resolveShaderSource,
  Yt as resolveTextureSize,
  Kt as resolveTextureViewDescriptor,
  Oh as samplerKey,
  ad as setGlobalLogLevel,
  Dd as shapes,
  Gi as smallestIndexFormat,
  wd as smoothstep,
  Ha as stageSource,
  zn as stripWgslComments,
  Xi as toUint8View,
  Kh as typedArrayElementSize,
  Ai as unlit,
  _d as unregisterShader,
  cn as validateVertexBufferLayout,
  cd as vec2,
  hd as vec3,
  dd as vec4,
  hn as vertexBufferLayoutsKey,
  Bi as vertexColorLine,
  Oi as vertexFormatGlslType,
  pe as vertexFormatInfo,
  Di as vertexFormatWgslType,
  Bd as wgslBindingKeys,
  eo as wgslDefines,
  to as wrapGlslSource,
  ro as wrapWgslSource
};
//# sourceMappingURL=gpu-device-api.js.map
