const C = {
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
}, pi = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], $m = [
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
  ...pi
];
function Aa(t) {
  return pi.includes(t);
}
function Am(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const q = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, _m = {
  [q.Vertex]: "vertex",
  [q.Fragment]: "fragment",
  [q.Compute]: "compute"
}, Em = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function Pm(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function Lm(t, e) {
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
const Cm = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function _a(t) {
  return t === "uint16" ? 2 : 4;
}
function Ea(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const Mm = {
  Load: "load",
  Clear: "clear"
}, Fm = {
  Store: "store",
  Discard: "discard"
}, Rm = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, Bm = {
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
}, Gm = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, Om = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, Um = {
  None: "none",
  Front: "front",
  Back: "back"
}, Dm = {
  Ccw: "ccw",
  Cw: "cw"
}, Im = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, Vm = {
  Nearest: "nearest",
  Linear: "linear"
};
function T(t, e, n, r = !1) {
  return { components: t, byteSize: e, kind: n, normalized: r };
}
const Pa = Object.freeze({
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
function Ae(t) {
  const e = Pa[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function La(t) {
  const e = Ae(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function Ca(t) {
  const e = Ae(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const Nm = {
  Vertex: "vertex",
  Instance: "instance"
}, O = {
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
function mi(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function km(t) {
  return t === "texture" || t === "storage-texture";
}
function gi(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class K extends Error {
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
function Ma(t) {
  return t instanceof K;
}
class u extends K {
  constructor(e, n = {}) {
    super(e, { ...n, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class Fa extends K {
  constructor(e, n = {}) {
    super(e, { ...n, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class xn extends K {
  reason;
  constructor(e, n = {}) {
    super(e, { ...n, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = n.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const At = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function Gn(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function Ra(t) {
  const e = Gn(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function Ba(t = 0) {
  return v.CopyDst | v.TextureBinding | t;
}
function Lt(t, e = {}) {
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
function bi(t = {}) {
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
function zm(t) {
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
function wi(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const ze = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function yi(t, e) {
  if (t.querySet.type !== ze.Timestamp)
    throw new u(
      `[gpu-device-api] ${e}: timestampWrites.querySet must be a "timestamp" query set, got "${String(t.querySet.type)}".`
    );
  const n = t.beginningOfPassWriteIndex, r = t.endOfPassWriteIndex;
  if (n === void 0 && r === void 0)
    throw new u(
      `[gpu-device-api] ${e}: timestampWrites needs at least one of beginningOfPassWriteIndex / endOfPassWriteIndex.`
    );
  for (const [i, s] of [
    ["beginningOfPassWriteIndex", n],
    ["endOfPassWriteIndex", r]
  ])
    if (s !== void 0 && (!Number.isInteger(s) || s < 0 || s >= t.querySet.count))
      throw new u(
        `[gpu-device-api] ${e}: timestampWrites.${i} (${String(s)}) is outside the query set's range [0, ${t.querySet.count}).`
      );
  if (n !== void 0 && n === r)
    throw new u(
      `[gpu-device-api] ${e}: beginningOfPassWriteIndex and endOfPassWriteIndex must differ (they are two different instants), got both = ${n}.`
    );
}
function Wm(t) {
  return t.buffer !== void 0;
}
function qm(t) {
  return t.sampler !== void 0;
}
function jm(t) {
  return t.view !== void 0;
}
function Qm(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function vi(t) {
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
function xi(t, e) {
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
    const r = Ae(n.format);
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
const lr = /* @__PURE__ */ new WeakMap();
function Si(t) {
  const e = lr.get(t);
  if (e !== void 0) return e;
  const n = t.map((r) => {
    const i = r.attributes.map((s) => `${s.shaderLocation}@${s.offset}:${s.format}`).join(",");
    return `${r.arrayStride}/${r.stepMode ?? "vertex"}[${i}]`;
  }).join(";");
  return lr.set(t, n), n;
}
const oe = {
  None: 0,
  Red: 1,
  Green: 2,
  Blue: 4,
  Alpha: 8,
  All: 15
}, Ht = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, cr = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, Ga = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, ht = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, Oa = Object.freeze({
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
function Xm(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = Oa[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function Ua(t = 128, e) {
  const n = /* @__PURE__ */ new Map();
  let r;
  const i = () => {
    for (; n.size > t; ) {
      const s = n.keys().next();
      if (s.done) return;
      const a = s.value, o = n.get(a);
      n.delete(a), e?.(o, a);
    }
  };
  return {
    get(s) {
      const a = n.get(s);
      if (a !== void 0)
        return r !== s && (n.delete(s), n.set(s, a), r = s), a;
    },
    set(s, a) {
      return n.get(s) !== void 0 && n.delete(s), n.set(s, a), r = s, i(), a;
    },
    has(s) {
      return n.has(s);
    },
    delete(s) {
      return r === s && (r = void 0), n.delete(s);
    },
    clear() {
      r = void 0, n.clear();
    },
    get size() {
      return n.size;
    },
    values() {
      return [...n.values()];
    }
  };
}
function Ti(...t) {
  let e = "";
  for (let n = 0; n < t.length; n += 1) {
    const r = t[n];
    r == null || r === "" || (e = e === "" ? `${r}` : `${e}|${r}`);
  }
  return e;
}
function Da(t, e, n = 1) {
  const r = e - t;
  return r <= 0n ? 0 : Number(r) * n / 1e6;
}
function Ym(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function $i(t, e, n) {
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
const Ai = "depth24plus";
function He(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function _i() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function On(t, e, n) {
  if (!t) throw new u(e, n ? { details: n } : {});
}
function Hm(t, e, n) {
  if (t == null)
    throw new u(e, n ? { details: n } : {});
  return t;
}
function P(t, e) {
  throw new u(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function We(t, e) {
  On(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function Te(t, e) {
  On(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function Zm(t, e) {
  On(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const Ia = [
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
function Km(t) {
  return Ia.some((e) => t instanceof e);
}
function Jm(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function eg(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function Va(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function Ei(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function tg(t) {
  return t + 3 & -4;
}
function Na(t, e = 4) {
  const n = Va(t), r = Ei(n.byteLength, e);
  if (r === n.byteLength) return n;
  const i = new Uint8Array(r);
  return i.set(n), i;
}
function ng(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function rg(t) {
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
function ig(t, e) {
  return (t & e) === e;
}
function sg(t, e) {
  return (t & e) !== 0;
}
function ag(t, e) {
  return (t & e) === e;
}
function og(...t) {
  let e = 0;
  for (const n of t) e |= n;
  return e;
}
function lg(t, e) {
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
let Ct = 0;
function B(t) {
  return Ct += 1, `${t}#${Ct}`;
}
function cg() {
  return Ct;
}
function ug() {
  Ct = 0;
}
const W = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, hg = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, ka = {
  silent: W.Silent,
  error: W.Error,
  warn: W.Warn,
  info: W.Info,
  debug: W.Debug,
  trace: W.Trace
};
let Un = W.Warn;
function dg(t) {
  Un = typeof t == "string" ? ka[t] : t;
}
function fg() {
  return Un;
}
function it(t = "gpu-device-api", e) {
  const n = () => e ?? Un, r = (i, s, a, o) => {
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
const pg = {
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
function za(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function Pi(t) {
  let e;
  for (const n of t)
    if (za(n))
      try {
        n.dispose();
      } catch (r) {
        e ??= r;
      }
  if (e !== void 0) throw e;
}
class mg {
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
    this.resources.clear(), Pi(e);
  }
}
function Wa() {
  return new Float32Array(2);
}
function qa(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function ja(t, e) {
  const n = new Float32Array(2);
  return n[0] = t, n[1] = e, n;
}
function Qa(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function Xa(t, e, n) {
  return t[0] = e, t[1] = n, t;
}
function Ya(t) {
  return t[0] = 0, t[1] = 0, t;
}
function Ha(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t;
}
function Za(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t;
}
function Ka(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t;
}
function Ja(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t;
}
function eo(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t;
}
function to(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t;
}
function no(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function ro(t, e) {
  const n = e[0], r = e[1];
  let i = Math.hypot(n, r);
  return i > 0 && (i = 1 / i), t[0] = n * i, t[1] = r * i, t;
}
function io(t) {
  return Math.hypot(t[0], t[1]);
}
function so(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function ao(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function oo(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1];
  return n * n + r * r;
}
function lo(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function co(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function uo(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t;
}
function ho(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t;
}
function fo(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t;
}
function po(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n;
}
function mo(t, e, n) {
  const r = e[0], i = e[1];
  return t[0] = n[0] * r + n[3] * i + n[6], t[1] = n[1] * r + n[4] * i + n[7], t;
}
function go(t) {
  return [t[0], t[1]];
}
function bo(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const gg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ha,
  clone: qa,
  copy: Qa,
  create: Wa,
  cross: co,
  distance: ao,
  div: Ja,
  dot: lo,
  equals: po,
  fromValues: ja,
  length: io,
  lerp: uo,
  max: fo,
  min: ho,
  mul: Ka,
  negate: no,
  normalize: ro,
  scale: eo,
  scaleAndAdd: to,
  set: Xa,
  squaredDistance: oo,
  squaredLength: so,
  sub: Za,
  toArray: go,
  toString: bo,
  transformMat3: mo,
  zero: Ya
}, Symbol.toStringTag, { value: "Module" }));
function R() {
  return new Float32Array(3);
}
function wo(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function yo(t, e, n) {
  const r = new Float32Array(3);
  return r[0] = t, r[1] = e, r[2] = n, r;
}
function ae(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function pe(t, e, n, r) {
  return t[0] = e, t[1] = n, t[2] = r, t;
}
function Sn(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function Je(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t;
}
function le(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t;
}
function vo(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t;
}
function xo(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t;
}
function Mt(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t;
}
function _t(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t[2] = e[2] + n[2] * r, t;
}
function So(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function Dn(t, e) {
  const n = e[0], r = e[1], i = e[2];
  let s = Math.hypot(n, r, i);
  return s > 0 && (s = 1 / s), t[0] = n * s, t[1] = r * s, t[2] = i * s, t;
}
function Ie(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function Li(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function Ci(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function Dt(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
  return n * n + r * r + i * i;
}
function he(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Mi(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], c = n[2];
  return t[0] = i * c - s * o, t[1] = s * a - r * c, t[2] = r * o - i * a, t;
}
function To(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t;
}
function It(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t[2] = Math.min(e[2], n[2]), t;
}
function Vt(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t[2] = Math.max(e[2], n[2]), t;
}
function Tn(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n;
}
function $o(t, e, n) {
  const r = he(n, e) * 2;
  return t[0] = e[0] - n[0] * r, t[1] = e[1] - n[1] * r, t[2] = e[2] - n[2] * r, t;
}
function Fi(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[3] * i + n[6] * s, t[1] = n[1] * r + n[4] * i + n[7] * s, t[2] = n[2] * r + n[5] * i + n[8] * s, t;
}
function In(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  let a = n[3] * r + n[7] * i + n[11] * s + n[15];
  return a = a || 1, t[0] = (n[0] * r + n[4] * i + n[8] * s + n[12]) / a, t[1] = (n[1] * r + n[5] * i + n[9] * s + n[13]) / a, t[2] = (n[2] * r + n[6] * i + n[10] * s + n[14]) / a, t;
}
function Ri(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, t;
}
function Ao(t) {
  return [t[0], t[1], t[2]];
}
function _o(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const bg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Je,
  clone: wo,
  copy: ae,
  create: R,
  cross: Mi,
  distance: Ci,
  div: xo,
  dot: he,
  equals: Tn,
  fromValues: yo,
  length: Ie,
  lerp: To,
  max: Vt,
  min: It,
  mul: vo,
  negate: So,
  normalize: Dn,
  reflect: $o,
  scale: Mt,
  scaleAndAdd: _t,
  set: pe,
  squaredDistance: Dt,
  squaredLength: Li,
  sub: le,
  toArray: Ao,
  toString: _o,
  transformDirection: Ri,
  transformMat3: Fi,
  transformMat4: In,
  zero: Sn
}, Symbol.toStringTag, { value: "Module" }));
function Eo() {
  return new Float32Array(4);
}
function Po(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function Lo(t, e, n, r) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = n, i[3] = r, i;
}
function Co(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function Mo(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function Fo(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function Ro(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t[3] = e[3] + n[3], t;
}
function Bo(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t[3] = e[3] - n[3], t;
}
function Go(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t[3] = e[3] * n[3], t;
}
function Oo(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t[3] = e[3] / n[3], t;
}
function Uo(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t;
}
function Do(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function Io(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3];
  let a = Math.hypot(n, r, i, s);
  return a > 0 && (a = 1 / a), t[0] = n * a, t[1] = r * a, t[2] = i * a, t[3] = s * a, t;
}
function Vo(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function No(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function ko(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function zo(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t[3] = e[3] + r * (n[3] - e[3]), t;
}
function Wo(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function qo(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = n[0] * r + n[4] * i + n[8] * s + n[12] * a, t[1] = n[1] * r + n[5] * i + n[9] * s + n[13] * a, t[2] = n[2] * r + n[6] * i + n[10] * s + n[14] * a, t[3] = n[3] * r + n[7] * i + n[11] * s + n[15] * a, t;
}
function jo(t) {
  return [t[0], t[1], t[2], t[3]];
}
function Qo(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const wg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ro,
  clone: Po,
  copy: Co,
  create: Eo,
  div: Oo,
  dot: ko,
  equals: Wo,
  fromValues: Lo,
  length: Vo,
  lerp: zo,
  mul: Go,
  negate: Do,
  normalize: Io,
  scale: Uo,
  set: Mo,
  squaredLength: No,
  sub: Bo,
  toArray: jo,
  toString: Qo,
  transformMat4: qo,
  zero: Fo
}, Symbol.toStringTag, { value: "Module" }));
function Bi() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function Gi(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function Xo(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function Yo(t, e, n, r, i, s, a, o, c) {
  const l = new Float32Array(9);
  return l[0] = t, l[1] = e, l[2] = n, l[3] = r, l[4] = i, l[5] = s, l[6] = a, l[7] = o, l[8] = c, l;
}
function Ho(t, e) {
  return t.set(e), t;
}
function Zo(t, e, n, r, i, s, a, o, c, l) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = c, t[8] = l, t;
}
function Oi(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function Ui(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], c = e[6], l = e[7], h = e[8];
  return t[0] = n, t[1] = s, t[2] = c, t[3] = r, t[4] = a, t[5] = l, t[6] = i, t[7] = o, t[8] = h, t;
}
function Ko(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], c = t[7], l = t[8], h = l * s - a * c, f = -l * i + a * o, d = c * i - s * o;
  return e * h + n * f + r * d;
}
function Di(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], c = e[6], l = e[7], h = e[8], f = h * a - o * l, d = -h * s + o * c, p = l * s - a * c;
  let m = n * f + r * d + i * p;
  return m ? (m = 1 / m, t[0] = f * m, t[1] = (-h * r + i * l) * m, t[2] = (o * r - i * a) * m, t[3] = d * m, t[4] = (h * n - i * c) * m, t[5] = (-o * n + i * s) * m, t[6] = p * m, t[7] = (-l * n + r * c) * m, t[8] = (a * n - r * s) * m, t) : null;
}
function Jo(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], c = e[5], l = e[6], h = e[7], f = e[8], d = n[0], p = n[1], m = n[2], g = n[3], b = n[4], w = n[5], S = n[6], $ = n[7], A = n[8];
  return t[0] = d * r + p * a + m * l, t[1] = d * i + p * o + m * h, t[2] = d * s + p * c + m * f, t[3] = g * r + b * a + w * l, t[4] = g * i + b * o + w * h, t[5] = g * s + b * c + w * f, t[6] = S * r + $ * a + A * l, t[7] = S * i + $ * o + A * h, t[8] = S * s + $ * c + A * f, t;
}
function el(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], c = e[5], l = e[6], h = e[7], f = e[8], d = n[0], p = n[1], m = n[2];
  return t[0] = d * r, t[1] = d * i, t[2] = d * s, t[3] = p * a, t[4] = p * o, t[5] = p * c, t[6] = m * l, t[7] = m * h, t[8] = m * f, t;
}
function tl(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], c = e[5], l = e[6], h = e[7], f = e[8], d = n[0], p = n[1];
  return t[0] = r, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = c, t[6] = d * r + p * a + l, t[7] = d * i + p * o + h, t[8] = d * s + p * c + f, t;
}
function nl(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], c = e[5], l = e[6], h = e[7], f = e[8], d = Math.sin(n), p = Math.cos(n);
  return t[0] = p * r + d * a, t[1] = p * i + d * o, t[2] = p * s + d * c, t[3] = p * a - d * r, t[4] = p * o - d * i, t[5] = p * c - d * s, t[6] = l, t[7] = h, t[8] = f, t;
}
function Vn(t, e) {
  return Oi(t, e), Di(t, t) ? (Ui(t, t), t) : null;
}
function rl(t, e, n = 1e-6) {
  for (let r = 0; r < 9; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function il(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const yg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Xo,
  copy: Ho,
  create: Bi,
  determinant: Ko,
  equals: rl,
  fromMat4: Oi,
  fromValues: Yo,
  identity: Gi,
  invert: Di,
  multiply: Jo,
  normalFromMat4: Vn,
  rotate: nl,
  scale: el,
  set: Zo,
  toString: il,
  translate: tl,
  transpose: Ui
}, Symbol.toStringTag, { value: "Module" })), Ft = 1e-6, se = new Float32Array(16), sl = new Float32Array(3);
function re() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function Q(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function al(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function Ii(t) {
  return t.fill(0), t;
}
function ol(...t) {
  const e = new Float32Array(16);
  for (let n = 0; n < 16; n++) e[n] = t[n] ?? 0;
  return e;
}
function Vi(t, e) {
  return t.set(e), t;
}
function ll(t, ...e) {
  for (let n = 0; n < 16; n++) t[n] = e[n] ?? 0;
  return t;
}
function cl(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], c = e[6], l = e[7], h = e[8], f = e[9], d = e[10], p = e[11], m = e[12], g = e[13], b = e[14], w = e[15];
  return t[0] = n, t[1] = a, t[2] = h, t[3] = m, t[4] = r, t[5] = o, t[6] = f, t[7] = g, t[8] = i, t[9] = c, t[10] = d, t[11] = b, t[12] = s, t[13] = l, t[14] = p, t[15] = w, t;
}
function Ni(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], c = t[7], l = t[8], h = t[9], f = t[10], d = t[11], p = t[12], m = t[13], g = t[14], b = t[15], w = e * a - n * s, S = e * o - r * s, $ = e * c - i * s, A = n * o - r * a, _ = n * c - i * a, L = r * c - i * o, M = l * m - h * p, I = l * g - f * p, V = l * b - d * p, N = h * g - f * m, k = h * b - d * m, X = f * b - d * g;
  return w * X - S * k + $ * N + A * V - _ * I + L * M;
}
function Nt(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], c = e[6], l = e[7], h = e[8], f = e[9], d = e[10], p = e[11], m = e[12], g = e[13], b = e[14], w = e[15], S = n * o - r * a, $ = n * c - i * a, A = n * l - s * a, _ = r * c - i * o, L = r * l - s * o, M = i * l - s * c, I = h * g - f * m, V = h * b - d * m, N = h * w - p * m, k = f * b - d * g, X = f * w - p * g, ee = d * w - p * b;
  let E = S * ee - $ * X + A * k + _ * N - L * V + M * I;
  return E ? (E = 1 / E, t[0] = (o * ee - c * X + l * k) * E, t[1] = (i * X - r * ee - s * k) * E, t[2] = (g * M - b * L + w * _) * E, t[3] = (d * L - f * M - p * _) * E, t[4] = (c * N - a * ee - l * V) * E, t[5] = (n * ee - i * N + s * V) * E, t[6] = (b * A - m * M - w * $) * E, t[7] = (h * M - d * A + p * $) * E, t[8] = (a * X - o * N + l * I) * E, t[9] = (r * N - n * X - s * I) * E, t[10] = (m * L - g * A + w * S) * E, t[11] = (f * A - h * L - p * S) * E, t[12] = (o * V - a * k - c * I) * E, t[13] = (n * k - r * V + i * I) * E, t[14] = (g * $ - m * _ - b * S) * E, t[15] = (h * _ - f * $ + d * S) * E, t) : null;
}
function Z(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], c = e[5], l = e[6], h = e[7], f = e[8], d = e[9], p = e[10], m = e[11], g = e[12], b = e[13], w = e[14], S = e[15], $ = n[0], A = n[1], _ = n[2], L = n[3], M = n[4], I = n[5], V = n[6], N = n[7], k = n[8], X = n[9], ee = n[10], E = n[11], ot = n[12], lt = n[13], ct = n[14], ut = n[15];
  return t[0] = $ * r + A * o + _ * f + L * g, t[1] = $ * i + A * c + _ * d + L * b, t[2] = $ * s + A * l + _ * p + L * w, t[3] = $ * a + A * h + _ * m + L * S, t[4] = M * r + I * o + V * f + N * g, t[5] = M * i + I * c + V * d + N * b, t[6] = M * s + I * l + V * p + N * w, t[7] = M * a + I * h + V * m + N * S, t[8] = k * r + X * o + ee * f + E * g, t[9] = k * i + X * c + ee * d + E * b, t[10] = k * s + X * l + ee * p + E * w, t[11] = k * a + X * h + ee * m + E * S, t[12] = ot * r + lt * o + ct * f + ut * g, t[13] = ot * i + lt * c + ct * d + ut * b, t[14] = ot * s + lt * l + ct * p + ut * w, t[15] = ot * a + lt * h + ct * m + ut * S, t;
}
function ul(t, ...e) {
  if (e.length === 0) return Q(t);
  Vi(t, e[0]);
  for (let n = 1; n < e.length; n++) Z(t, t, e[n]);
  return t;
}
function ki(t, e) {
  return Q(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function hl(t, e) {
  return Q(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function zi(t, e, n) {
  let r = n[0], i = n[1], s = n[2], a = Math.hypot(r, i, s);
  if (a < Ft) return Q(t);
  a = 1 / a, r *= a, i *= a, s *= a;
  const o = Math.sin(e), c = Math.cos(e), l = 1 - c, h = r * r * l + c, f = i * r * l + s * o, d = s * r * l - i * o, p = r * i * l - s * o, m = i * i * l + c, g = s * i * l + r * o, b = r * s * l + i * o, w = i * s * l - r * o, S = s * s * l + c;
  return t[0] = h, t[1] = f, t[2] = d, t[3] = 0, t[4] = p, t[5] = m, t[6] = g, t[7] = 0, t[8] = b, t[9] = w, t[10] = S, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Nn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return Q(t), t[5] = r, t[6] = n, t[9] = -n, t[10] = r, t;
}
function kn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return Q(t), t[0] = r, t[2] = -n, t[8] = n, t[10] = r, t;
}
function zn(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return Q(t), t[0] = r, t[1] = n, t[4] = -n, t[5] = r, t;
}
function dl(t, e, n, r) {
  return Wn(t, e, n, r, fl);
}
const fl = new Float32Array([1, 1, 1]);
function Wn(t, e, n, r, i) {
  let s = n[0], a = n[1], o = n[2], c = Math.hypot(s, a, o);
  if (c < Ft)
    return Q(t), t[12] = r[0], t[13] = r[1], t[14] = r[2], t;
  c = 1 / c, s *= c, a *= c, o *= c;
  const l = Math.sin(e), h = Math.cos(e), f = 1 - h, d = s * s * f + h, p = a * s * f + o * l, m = o * s * f - a * l, g = s * a * f - o * l, b = a * a * f + h, w = o * a * f + s * l, S = s * o * f + a * l, $ = a * o * f - s * l, A = o * o * f + h, _ = i[0], L = i[1], M = i[2];
  return t[0] = d * _, t[1] = p * _, t[2] = m * _, t[3] = 0, t[4] = g * L, t[5] = b * L, t[6] = w * L, t[7] = 0, t[8] = S * M, t[9] = $ * M, t[10] = A * M, t[11] = 0, t[12] = r[0], t[13] = r[1], t[14] = r[2], t[15] = 1, t;
}
function pl(t, e, n, r, i, s) {
  Wn(t, e, n, r, i);
  const a = s[0], o = s[1], c = s[2];
  return t[12] = r[0] + a - (t[0] * a + t[4] * o + t[8] * c), t[13] = r[1] + o - (t[1] * a + t[5] * o + t[9] * c), t[14] = r[2] + c - (t[2] * a + t[6] * o + t[10] * c), t;
}
function ml(t, e, n) {
  return ki(se, n), Z(t, e, se);
}
function gl(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function bl(t, e, n, r) {
  return zi(se, n, r), Z(t, e, se);
}
function wl(t, e, n) {
  return Nn(se, n), Z(t, e, se);
}
function yl(t, e, n) {
  return kn(se, n), Z(t, e, se);
}
function vl(t, e, n) {
  return zn(se, n), Z(t, e, se);
}
function xl(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function Wi(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function Sl(t, e) {
  const n = Wi(sl, e), r = Ni(e) < 0 ? -1 : 1, i = n[0] * r, s = n[1], a = n[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function qi(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (r - i);
    t[10] = (i + r) * a, t[14] = 2 * i * r * a;
  } else
    t[10] = -1, t[14] = -2 * r;
  return t;
}
function ji(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (r - i), t[14] = i * r / (r - i)) : (t[10] = -1, t[14] = -r), t;
}
function Qi(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), c = 1 / (r - i), l = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * c, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * l, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * c, t[14] = (a + s) * l, t[15] = 1, t;
}
function Xi(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), c = 1 / (r - i), l = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * c, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = l, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * c, t[14] = s * l, t[15] = 1, t;
}
function Tl(t, e, n, r, i, s, a) {
  const o = 1 / (n - e), c = 1 / (i - r), l = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * c, t[6] = 0, t[7] = 0, t[8] = (n + e) * o, t[9] = (i + r) * c, t[10] = (a + s) * l, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * l, t[15] = 0, t;
}
function $n(t, e, n, r) {
  let i = e[0] - n[0], s = e[1] - n[1], a = e[2] - n[2], o = Math.hypot(i, s, a);
  if (o < Ft) return Ii(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let c = r[1] * a - r[2] * s, l = r[2] * i - r[0] * a, h = r[0] * s - r[1] * i;
  o = Math.hypot(c, l, h), o < Ft ? (c = 0, l = 0, h = 0) : (o = 1 / o, c *= o, l *= o, h *= o);
  const f = s * h - a * l, d = a * c - i * h, p = i * l - s * c;
  return t[0] = c, t[1] = f, t[2] = i, t[3] = 0, t[4] = l, t[5] = d, t[6] = s, t[7] = 0, t[8] = h, t[9] = p, t[10] = a, t[11] = 0, t[12] = -(c * e[0] + l * e[1] + h * e[2]), t[13] = -(f * e[0] + d * e[1] + p * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function $l(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  let a = e[3] * r + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * r + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * r + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * r + e[6] * i + e[10] * s + e[14]) / a, t;
}
function Al(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r + e[4] * i + e[8] * s, t[1] = e[1] * r + e[5] * i + e[9] * s, t[2] = e[2] * r + e[6] * i + e[10] * s, t;
}
function _l(t, e, n = 1e-6) {
  for (let r = 0; r < 16; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function El(t) {
  const e = [];
  for (let n = 0; n < 4; n++)
    e.push(
      `[${t[n]}, ${t[n + 4]}, ${t[n + 8]}, ${t[n + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const vg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: al,
  copy: Vi,
  create: re,
  determinant: Ni,
  equals: _l,
  fromRotation: zi,
  fromRotationTranslation: dl,
  fromRotationTranslationScale: Wn,
  fromRotationTranslationScaleOrigin: pl,
  fromScaling: hl,
  fromTranslation: ki,
  fromValues: ol,
  fromXRotation: Nn,
  fromYRotation: kn,
  fromZRotation: zn,
  frustum: Tl,
  getRotation: Sl,
  getScaling: Wi,
  getTranslation: xl,
  identity: Q,
  invert: Nt,
  lookAt: $n,
  multiply: Z,
  multiplyAll: ul,
  ortho: Qi,
  orthoZO: Xi,
  perspective: qi,
  perspectiveZO: ji,
  rotate: bl,
  rotateX: wl,
  rotateY: yl,
  rotateZ: vl,
  scale: gl,
  set: ll,
  toString: El,
  transformDirection: Al,
  transformPoint: $l,
  translate: ml,
  transpose: cl,
  zero: Ii
}, Symbol.toStringTag, { value: "Module" }));
function Yi() {
  const t = new Float32Array(4);
  return t[3] = 1, t;
}
function Pl(t) {
  const e = new Float32Array(4);
  return Hi(e, t);
}
function Hi(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function st(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function Ll(t, e, n, r) {
  return st(new Float32Array(4), t, e, n, r);
}
function kt(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 1, t;
}
function qn(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function jn(t) {
  return qn(t, t);
}
function Zi(t) {
  return Math.sqrt(jn(t));
}
function qe(t, e) {
  const n = Zi(e);
  if (n < 1e-8) return kt(t);
  const r = 1 / n;
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function Cl(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = e[3], t;
}
function Ml(t, e) {
  const n = jn(e);
  if (n < 1e-12) return kt(t);
  const r = 1 / n;
  return t[0] = -e[0] * r, t[1] = -e[1] * r, t[2] = -e[2] * r, t[3] = e[3] * r, t;
}
function _e(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = n[0], c = n[1], l = n[2], h = n[3];
  return t[0] = r * h + a * o + i * l - s * c, t[1] = i * h + a * c + s * o - r * l, t[2] = s * h + a * l + r * c - i * o, t[3] = a * h - r * o - i * c - s * l, t;
}
function Fl(t, e, n) {
  return _e(t, n, e);
}
function Rl(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return _e(t, e, st(Qn, i, 0, 0, s));
}
function Bl(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return _e(t, e, st(Qn, 0, i, 0, s));
}
function Gl(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return _e(t, e, st(Qn, 0, 0, i, s));
}
const Qn = Yi();
function Et(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]);
  if (r < 1e-8) return kt(t);
  const i = n * 0.5, s = Math.sin(i) / r;
  return t[0] = e[0] * s, t[1] = e[1] * s, t[2] = e[2] * s, t[3] = Math.cos(i), t;
}
function Ol(t, e) {
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
  return qe(t, t);
}
function Ul(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], c = n[2];
  let l = r * a + i * o + s * c + 1;
  return l < 1e-8 ? (l = 0, Math.abs(r) > Math.abs(s) ? (t[0] = -i, t[1] = r, t[2] = 0) : (t[0] = 0, t[1] = -s, t[2] = i), t[3] = l) : (t[0] = i * c - s * o, t[1] = s * a - r * c, t[2] = r * o - i * a, t[3] = l), qe(t, t);
}
function Dl(t, e, n) {
  const r = n[0], i = n[1], s = n[2], a = e[0], o = e[1], c = e[2], l = e[3], h = 2 * (o * s - c * i), f = 2 * (c * r - a * s), d = 2 * (a * i - o * r);
  return t[0] = r + l * h + (o * d - c * f), t[1] = i + l * f + (c * h - a * d), t[2] = s + l * d + (a * f - o * h), t;
}
function Il(t, e, n, r) {
  let i = n[0], s = n[1], a = n[2], o = n[3], c = qn(e, n);
  if (c < 0 && (c = -c, i = -i, s = -s, a = -a, o = -o), c > 0.9995)
    return t[0] = e[0] + (i - e[0]) * r, t[1] = e[1] + (s - e[1]) * r, t[2] = e[2] + (a - e[2]) * r, t[3] = e[3] + (o - e[3]) * r, qe(t, t);
  const l = Math.acos(c), h = Math.sin(l), f = Math.sin((1 - r) * l) / h, d = Math.sin(r * l) / h;
  return t[0] = e[0] * f + i * d, t[1] = e[1] * f + s * d, t[2] = e[2] * f + a * d, t[3] = e[3] * f + o * d, qe(t, t);
}
function Vl(t, e, n, r) {
  return t[0] = e[0] + (n[0] - e[0]) * r, t[1] = e[1] + (n[1] - e[1]) * r, t[2] = e[2] + (n[2] - e[2]) * r, t[3] = e[3] + (n[3] - e[3]) * r, qe(t, t);
}
function Ki(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = n + n, o = r + r, c = i + i, l = n * a, h = n * o, f = n * c, d = r * o, p = r * c, m = i * c, g = s * a, b = s * o, w = s * c;
  return t[0] = 1 - (d + m), t[1] = h + w, t[2] = f - b, t[3] = 0, t[4] = h - w, t[5] = 1 - (l + m), t[6] = p + g, t[7] = 0, t[8] = f + b, t[9] = p - g, t[10] = 1 - (l + d), t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Nl(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function kl(t) {
  return `quat(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const xg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Pl,
  conjugate: Cl,
  copy: Hi,
  create: Yi,
  dot: qn,
  equals: Nl,
  fromValues: Ll,
  identity: kt,
  invert: Ml,
  length: Zi,
  lerp: Vl,
  multiply: _e,
  normalize: qe,
  premultiply: Fl,
  rotateX: Rl,
  rotateY: Bl,
  rotateZ: Gl,
  set: st,
  setAxisAngle: Et,
  setFromRotationMatrix: Ol,
  setFromUnitVectors: Ul,
  slerp: Il,
  squaredLength: jn,
  toMat4: Ki,
  toString: kl,
  transformVec3: Dl
}, Symbol.toStringTag, { value: "Module" })), zl = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"];
function Ji(t = 0, e = 0, n = 0, r = "XYZ") {
  return { x: t, y: e, z: n, order: r };
}
function Wl(t) {
  return Ji(t.x, t.y, t.z, t.order);
}
function ql(t, e) {
  return t.x = e.x, t.y = e.y, t.z = e.z, t.order = e.order, t;
}
function jl(t, e, n, r, i = t.order) {
  return t.x = e, t.y = n, t.z = r, t.order = i, t;
}
function Ql(t, e, n = 1e-6) {
  return t.order === e.order && Math.abs(t.x - e.x) <= n && Math.abs(t.y - e.y) <= n && Math.abs(t.z - e.z) <= n;
}
const es = {
  XYZ: ["X", "Y", "Z"],
  YXZ: ["Y", "X", "Z"],
  ZXY: ["Z", "X", "Y"],
  ZYX: ["Z", "Y", "X"],
  YZX: ["Y", "Z", "X"],
  XZY: ["X", "Z", "Y"]
}, Zt = {
  X: new Float32Array([1, 0, 0]),
  Y: new Float32Array([0, 1, 0]),
  Z: new Float32Array([0, 0, 1])
}, Xl = Q(new Float32Array(16)), Yl = Q(new Float32Array(16)), Hl = Q(new Float32Array(16)), An = Q(new Float32Array(16)), Zl = new Float32Array(4), Kl = new Float32Array(4), Jl = new Float32Array(4), ur = new Float32Array(4);
function Ve(t, e) {
  return e === "X" ? t.x : e === "Y" ? t.y : t.z;
}
function Kt(t, e, n) {
  return t === "X" ? Nn(n, e) : t === "Y" ? kn(n, e) : zn(n, e);
}
function ec(t, e) {
  const n = es[e.order], r = Kt(n[0], Ve(e, n[0]), Xl), i = Kt(n[1], Ve(e, n[1]), Yl), s = Kt(n[2], Ve(e, n[2]), Hl);
  return Z(An, r, i), Z(t, An, s);
}
function tc(t, e) {
  const n = es[e.order], r = Et(Zl, Zt[n[0]], Ve(e, n[0])), i = Et(Kl, Zt[n[1]], Ve(e, n[1])), s = Et(Jl, Zt[n[2]], Ve(e, n[2]));
  return _e(ur, r, i), _e(t, ur, s);
}
function ts(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[4], a = e[5], o = e[6], c = e[8], l = e[9], h = e[10], f = (p) => p < -1 ? -1 : p > 1 ? 1 : p, d = 0.9999999;
  switch (t.order) {
    case "XYZ":
      t.y = Math.asin(f(c)), Math.abs(c) < d ? (t.x = Math.atan2(-l, h), t.z = Math.atan2(-s, n)) : (t.x = Math.atan2(o, a), t.z = 0);
      break;
    case "YXZ":
      t.x = Math.asin(-f(l)), Math.abs(l) < d ? (t.y = Math.atan2(c, h), t.z = Math.atan2(r, a)) : (t.y = Math.atan2(-i, n), t.z = 0);
      break;
    case "ZXY":
      t.x = Math.asin(f(o)), Math.abs(o) < d ? (t.y = Math.atan2(-i, h), t.z = Math.atan2(-s, a)) : (t.y = 0, t.z = Math.atan2(r, n));
      break;
    case "ZYX":
      t.y = Math.asin(-f(i)), Math.abs(i) < d ? (t.x = Math.atan2(o, h), t.z = Math.atan2(r, n)) : (t.x = 0, t.z = Math.atan2(-s, a));
      break;
    case "YZX":
      t.z = Math.asin(f(r)), Math.abs(r) < d ? (t.x = Math.atan2(-l, a), t.y = Math.atan2(-i, n)) : (t.x = 0, t.y = Math.atan2(c, h));
      break;
    case "XZY":
      t.z = Math.asin(-f(s)), Math.abs(s) < d ? (t.x = Math.atan2(o, a), t.y = Math.atan2(c, n)) : (t.x = Math.atan2(-l, h), t.y = 0);
      break;
  }
  return t;
}
function nc(t, e) {
  return ts(t, Ki(An, e));
}
const Sg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EULER_ORDERS: zl,
  clone: Wl,
  copy: ql,
  create: Ji,
  equals: Ql,
  fromQuaternion: nc,
  fromRotationMatrix: ts,
  set: jl,
  toMat4: ec,
  toQuaternion: tc
}, Symbol.toStringTag, { value: "Module" })), zt = 1e-12, dt = new Float32Array(3), rc = new Float32Array(9);
function ve(t = 0, e = 0, n = 1, r = 0) {
  return { normal: new Float32Array([t, e, n]), constant: r };
}
function ic(t) {
  return { normal: new Float32Array([t.normal[0], t.normal[1], t.normal[2]]), constant: t.constant };
}
function Xn(t, e) {
  return t.normal[0] = e.normal[0], t.normal[1] = e.normal[1], t.normal[2] = e.normal[2], t.constant = e.constant, t;
}
function sc(t, e, n) {
  return t.normal[0] = e[0], t.normal[1] = e[1], t.normal[2] = e[2], t.constant = n, t;
}
function ns(t, e, n, r, i) {
  return t.normal[0] = e, t.normal[1] = n, t.normal[2] = r, t.constant = i, t;
}
function ac(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]), i = r < zt ? 1 : 1 / r;
  return t.normal[0] = e[0] * i, t.normal[1] = e[1] * i, t.normal[2] = e[2] * i, t.constant = -he(t.normal, n), t;
}
function oc(t, e, n, r) {
  const i = new Float32Array([n[0] - e[0], n[1] - e[1], n[2] - e[2]]), s = new Float32Array([r[0] - e[0], r[1] - e[1], r[2] - e[2]]);
  Mi(t.normal, i, s);
  const a = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  return a < zt ? null : (t.normal[0] = t.normal[0] / a, t.normal[1] = t.normal[1] / a, t.normal[2] = t.normal[2] / a, t.constant = -he(t.normal, e), t);
}
function rs(t, e) {
  const n = Math.hypot(e.normal[0], e.normal[1], e.normal[2]);
  if (n < zt) return null;
  const r = 1 / n;
  return t.normal[0] = e.normal[0] * r, t.normal[1] = e.normal[1] * r, t.normal[2] = e.normal[2] * r, t.constant = e.constant * r, t;
}
function lc(t, e) {
  return t.normal[0] = -e.normal[0], t.normal[1] = -e.normal[1], t.normal[2] = -e.normal[2], t.constant = -e.constant, t;
}
function ce(t, e) {
  return he(t.normal, e) + t.constant;
}
function cc(t, e, n) {
  const r = ce(e, n);
  return t[0] = n[0] - e.normal[0] * r, t[1] = n[1] - e.normal[1] * r, t[2] = n[2] - e.normal[2] * r, t;
}
function is(t, e) {
  return t[0] = e.normal[0] * -e.constant, t[1] = e.normal[1] * -e.constant, t[2] = e.normal[2] * -e.constant, t;
}
function uc(t, e, n) {
  return Xn(t, e), t.constant -= he(n, e.normal), t;
}
function hc(t, e, n) {
  const r = ce(t, e), i = ce(t, n);
  return r === 0 ? 0 : i === 0 ? 1 : r > 0 == i > 0 ? null : r / (r - i);
}
function dc(t, e, n) {
  const r = Vn(rc, n);
  if (!r)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the matrix is singular, so the transformed plane is undefined."
    );
  is(dt, e), In(dt, dt, n), Fi(t.normal, e.normal, r);
  const i = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  if (i < zt)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the transformed normal is degenerate (the matrix collapses the plane)."
    );
  return t.normal[0] = t.normal[0] / i, t.normal[1] = t.normal[1] / i, t.normal[2] = t.normal[2] / i, t.constant = -he(t.normal, dt), t;
}
function ss(t, e, n = 1e-6) {
  const r = Math.abs(t.normal[0] - e.normal[0]) <= n && Math.abs(t.normal[1] - e.normal[1]) <= n && Math.abs(t.normal[2] - e.normal[2]) <= n && Math.abs(t.constant - e.constant) <= n, i = Math.abs(t.normal[0] + e.normal[0]) <= n && Math.abs(t.normal[1] + e.normal[1]) <= n && Math.abs(t.normal[2] + e.normal[2]) <= n && Math.abs(t.constant + e.constant) <= n;
  return r || i;
}
function fc(t) {
  return `plane(${t.normal[0]}, ${t.normal[1]}, ${t.normal[2]}, ${t.constant})`;
}
const Tg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: dc,
  clone: ic,
  coplanarPoint: is,
  copy: Xn,
  create: ve,
  distanceToPoint: ce,
  equals: ss,
  intersectLineSegment: hc,
  negate: lc,
  normalize: rs,
  projectPoint: cc,
  set: sc,
  setComponents: ns,
  setFromCoplanarPoints: oc,
  setFromNormalAndCoplanarPoint: ac,
  toString: fc,
  translate: uc
}, Symbol.toStringTag, { value: "Module" })), ie = new Float32Array(3);
function pc() {
  return Ee({ min: new Float32Array(3), max: new Float32Array(3) });
}
function Ee(t) {
  return t.min[0] = Number.POSITIVE_INFINITY, t.min[1] = Number.POSITIVE_INFINITY, t.min[2] = Number.POSITIVE_INFINITY, t.max[0] = Number.NEGATIVE_INFINITY, t.max[1] = Number.NEGATIVE_INFINITY, t.max[2] = Number.NEGATIVE_INFINITY, t;
}
function D(t) {
  return t.max[0] < t.min[0] || t.max[1] < t.min[1] || t.max[2] < t.min[2];
}
function mc(t) {
  return {
    min: new Float32Array([t.min[0], t.min[1], t.min[2]]),
    max: new Float32Array([t.max[0], t.max[1], t.max[2]])
  };
}
function Rt(t, e) {
  return t.min[0] = e.min[0], t.min[1] = e.min[1], t.min[2] = e.min[2], t.max[0] = e.max[0], t.max[1] = e.max[1], t.max[2] = e.max[2], t;
}
function gc(t, e, n) {
  return t.min[0] = e[0], t.min[1] = e[1], t.min[2] = e[2], t.max[0] = n[0], t.max[1] = n[1], t.max[2] = n[2], t;
}
function bc(t, e, n) {
  const r = n[0] * 0.5, i = n[1] * 0.5, s = n[2] * 0.5;
  return t.min[0] = e[0] - r, t.min[1] = e[1] - i, t.min[2] = e[2] - s, t.max[0] = e[0] + r, t.max[1] = e[1] + i, t.max[2] = e[2] + s, t;
}
function wc(t, e) {
  Ee(t);
  for (const n of e) Yn(t, n);
  return t;
}
function yc(t, e, n = 3) {
  Ee(t);
  const r = Math.max(1, Math.trunc(n));
  for (let i = 0; i + 2 < e.length; i += r)
    t.min[0] = Math.min(t.min[0], e[i]), t.min[1] = Math.min(t.min[1], e[i + 1]), t.min[2] = Math.min(t.min[2], e[i + 2]), t.max[0] = Math.max(t.max[0], e[i]), t.max[1] = Math.max(t.max[1], e[i + 1]), t.max[2] = Math.max(t.max[2], e[i + 2]);
  return t;
}
function as(t, e) {
  return D(e) || (t[0] = (e.min[0] + e.max[0]) * 0.5, t[1] = (e.min[1] + e.max[1]) * 0.5, t[2] = (e.min[2] + e.max[2]) * 0.5), t;
}
function vc(t, e) {
  return D(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, t) : le(t, e.max, e.min);
}
function xc(t, e) {
  return D(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, -1) : (as(t, e), Math.hypot(e.max[0] - t[0], e.max[1] - t[1], e.max[2] - t[2]));
}
function Yn(t, e) {
  return It(t.min, t.min, e), Vt(t.max, t.max, e), t;
}
function Sc(t, e) {
  return Je(t.min, t.min, e), Je(t.max, t.max, e), t;
}
function Tc(t, e) {
  return t.min[0] = t.min[0] - e, t.min[1] = t.min[1] - e, t.min[2] = t.min[2] - e, t.max[0] = t.max[0] + e, t.max[1] = t.max[1] + e, t.max[2] = t.max[2] + e, t;
}
function $c(t, e) {
  return e[0] >= t.min[0] && e[0] <= t.max[0] && e[1] >= t.min[1] && e[1] <= t.max[1] && e[2] >= t.min[2] && e[2] <= t.max[2];
}
function Ac(t, e) {
  return t.min[0] <= e.min[0] && e.max[0] <= t.max[0] && t.min[1] <= e.min[1] && e.max[1] <= t.max[1] && t.min[2] <= e.min[2] && e.max[2] <= t.max[2];
}
function os(t, e) {
  return D(t) || D(e) ? !1 : e.max[0] >= t.min[0] && e.min[0] <= t.max[0] && e.max[1] >= t.min[1] && e.min[1] <= t.max[1] && e.max[2] >= t.min[2] && e.min[2] <= t.max[2];
}
function _c(t, e, n) {
  return D(t) ? !1 : Dt(Hn(ie, t, e), e) <= n * n;
}
function Ec(t, e) {
  if (D(t)) return !1;
  let n = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < 8; i++) {
    ie[0] = i & 1 ? t.max[0] : t.min[0], ie[1] = i & 2 ? t.max[1] : t.min[1], ie[2] = i & 4 ? t.max[2] : t.min[2];
    const s = ce(e, ie);
    n = Math.min(n, s), r = Math.max(r, s);
  }
  return n <= 0 && r >= 0;
}
function Hn(t, e, n) {
  return D(e) || (t[0] = Math.min(Math.max(n[0], e.min[0]), e.max[0]), t[1] = Math.min(Math.max(n[1], e.min[1]), e.max[1]), t[2] = Math.min(Math.max(n[2], e.min[2]), e.max[2])), t;
}
function Pc(t, e) {
  return D(t) ? 0 : Math.sqrt(Dt(Hn(ie, t, e), e));
}
function Lc(t, e, n) {
  return Rt(t, e), Je(t.min, t.min, n), Je(t.max, t.max, n), t;
}
function Cc(t, e, n) {
  return D(e) ? Rt(t, n) : D(n) ? Rt(t, e) : (It(t.min, e.min, n.min), Vt(t.max, e.max, n.max), t);
}
function Mc(t, e, n) {
  return os(e, n) ? (Vt(t.min, e.min, n.min), It(t.max, e.max, n.max), t) : Ee(t);
}
function Fc(t, e, n) {
  if (D(e)) return Ee(t);
  const r = e.min[0], i = e.min[1], s = e.min[2], a = e.max[0], o = e.max[1], c = e.max[2];
  Ee(t);
  for (let l = 0; l < 8; l++) {
    const h = l & 1 ? a : r, f = l & 2 ? o : i, d = l & 4 ? c : s, p = n[3] * h + n[7] * f + n[11] * d + n[15], m = p === 0 ? 1 : 1 / p;
    ie[0] = (n[0] * h + n[4] * f + n[8] * d + n[12]) * m, ie[1] = (n[1] * h + n[5] * f + n[9] * d + n[13]) * m, ie[2] = (n[2] * h + n[6] * f + n[10] * d + n[14]) * m, Yn(t, ie);
  }
  return t;
}
function Rc(t, e, n) {
  if (Mt(t.min, e.min, n), Mt(t.max, e.max, n), n < 0) {
    const r = t.min[0], i = t.min[1], s = t.min[2];
    t.min[0] = t.max[0], t.min[1] = t.max[1], t.min[2] = t.max[2], t.max[0] = r, t.max[1] = i, t.max[2] = s;
  }
  return t;
}
function Bc(t, e, n = 1e-6) {
  const r = D(t), i = D(e);
  return r || i ? r === i : Math.abs(t.min[0] - e.min[0]) <= n && Math.abs(t.min[1] - e.min[1]) <= n && Math.abs(t.min[2] - e.min[2]) <= n && Math.abs(t.max[0] - e.max[0]) <= n && Math.abs(t.max[1] - e.max[1]) <= n && Math.abs(t.max[2] - e.max[2]) <= n;
}
function Gc(t) {
  return D(t) ? "box3(empty)" : `box3(${t.min[0]}, ${t.min[1]}, ${t.min[2]}) - (${t.max[0]}, ${t.max[1]}, ${t.max[2]})`;
}
const $g = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Fc,
  clampPoint: Hn,
  clone: mc,
  containsBox: Ac,
  containsPoint: $c,
  copy: Rt,
  create: pc,
  distanceToPoint: Pc,
  equals: Bc,
  expandByPoint: Yn,
  expandByScalar: Tc,
  expandByVector: Sc,
  getBoundingSphere: xc,
  getCenter: as,
  getSize: vc,
  intersect: Mc,
  intersectsBox: os,
  intersectsPlane: Ec,
  intersectsSphere: _c,
  isEmpty: D,
  makeEmpty: Ee,
  scaleBox: Rc,
  set: gc,
  setFromArray: yc,
  setFromCenterAndSize: bc,
  setFromPoints: wc,
  toString: Gc,
  translate: Lc,
  union: Cc
}, Symbol.toStringTag, { value: "Module" }));
function Oc(t = 0, e = 0, n = 0, r = 0, i = 0, s = -1) {
  return {
    origin: new Float32Array([t, e, n]),
    direction: new Float32Array([r, i, s])
  };
}
function Uc(t) {
  return {
    origin: new Float32Array([t.origin[0], t.origin[1], t.origin[2]]),
    direction: new Float32Array([t.direction[0], t.direction[1], t.direction[2]])
  };
}
function Dc(t, e) {
  return t.origin[0] = e.origin[0], t.origin[1] = e.origin[1], t.origin[2] = e.origin[2], t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t;
}
function Wt(t, e, n) {
  t.origin[0] = e[0], t.origin[1] = e[1], t.origin[2] = e[2];
  const r = Math.hypot(n[0], n[1], n[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = n[0] * i, t.direction[1] = n[1] * i, t.direction[2] = n[2] * i, t;
}
function Zn(t, e, n) {
  return t[0] = e.origin[0] + e.direction[0] * n, t[1] = e.origin[1] + e.direction[1] * n, t[2] = e.origin[2] + e.direction[2] * n, t;
}
function Ic(t, e, n) {
  const r = e.origin[0], i = e.origin[1], s = e.origin[2];
  return t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t.origin[0] = r + t.direction[0] * n, t.origin[1] = i + t.direction[1] * n, t.origin[2] = s + t.direction[2] * n, t;
}
function ls(t, e, n) {
  const r = Math.max(0, he(le(us, n, e.origin), e.direction));
  return Zn(t, e, r);
}
function Vc(t, e) {
  return Math.sqrt(cs(t, e));
}
function cs(t, e) {
  return Dt(e, ls(us, t, e));
}
const us = new Float32Array(3);
function Nc(t, e, n) {
  In(t.origin, e.origin, n), Ri(t.direction, e.direction, n);
  const r = Math.hypot(t.direction[0], t.direction[1], t.direction[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = t.direction[0] * i, t.direction[1] = t.direction[1] * i, t.direction[2] = t.direction[2] * i, t;
}
function hs(t, e) {
  const n = he(e.normal, t.direction);
  if (Math.abs(n) < 1e-12) return null;
  const r = -ce(e, t.origin) / n;
  return r >= 0 ? r : null;
}
function ds(t, e, n) {
  const r = t.origin[0] - e[0], i = t.origin[1] - e[1], s = t.origin[2] - e[2], a = t.direction[0], o = t.direction[1], c = t.direction[2], l = r * a + i * o + s * c, h = r * r + i * i + s * s - n * n, f = l * l - h;
  if (f < 0) return null;
  const d = Math.sqrt(f), p = -l - d;
  if (p >= 0) return p;
  const m = -l + d;
  return m >= 0 ? m : null;
}
function fs(t, e) {
  if (D(e)) return null;
  let n = 0, r = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 3; i++) {
    const s = t.origin[i], a = t.direction[i], o = e.min[i], c = e.max[i];
    if (Math.abs(a) < 1e-12) {
      if (s < o || s > c) return null;
      continue;
    }
    const l = 1 / a;
    let h = (o - s) * l, f = (c - s) * l;
    if (h > f) {
      const d = h;
      h = f, f = d;
    }
    if (h > n && (n = h), f < r && (r = f), n > r) return null;
  }
  return Number.isFinite(r) ? n : null;
}
function ps(t, e, n, r, i = !1) {
  const s = n[0] - e[0], a = n[1] - e[1], o = n[2] - e[2], c = r[0] - e[0], l = r[1] - e[1], h = r[2] - e[2], f = t.direction[0], d = t.direction[1], p = t.direction[2], m = d * h - p * l, g = p * c - f * h, b = f * l - d * c, w = s * m + a * g + o * b;
  if (i ? w < 1e-12 : Math.abs(w) < 1e-12) return null;
  const S = 1 / w, $ = t.origin[0] - e[0], A = t.origin[1] - e[1], _ = t.origin[2] - e[2], L = ($ * m + A * g + _ * b) * S;
  if (L < 0 || L > 1) return null;
  const M = A * o - _ * a, I = _ * s - $ * o, V = $ * a - A * s, N = (f * M + d * I + p * V) * S;
  if (N < 0 || L + N > 1) return null;
  const k = (c * M + l * I + h * V) * S;
  return k >= 0 ? k : null;
}
function kc(t, e, n = 1e-6) {
  return Math.abs(t.origin[0] - e.origin[0]) <= n && Math.abs(t.origin[1] - e.origin[1]) <= n && Math.abs(t.origin[2] - e.origin[2]) <= n && Math.abs(t.direction[0] - e.direction[0]) <= n && Math.abs(t.direction[1] - e.direction[1]) <= n && Math.abs(t.direction[2] - e.direction[2]) <= n;
}
function zc(t) {
  return `ray(origin: ${t.origin[0]}, ${t.origin[1]}, ${t.origin[2]}; direction: ${t.direction[0]}, ${t.direction[1]}, ${t.direction[2]})`;
}
function Wc(t) {
  return Number.isFinite(t.origin[0]) && Number.isFinite(t.origin[1]) && Number.isFinite(t.origin[2]) && Number.isFinite(t.direction[0]) && Number.isFinite(t.direction[1]) && Number.isFinite(t.direction[2]) && Li(t.direction) > 1e-24;
}
const Ag = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Nc,
  at: Zn,
  clone: Uc,
  closestPointToPoint: ls,
  copy: Dc,
  create: Oc,
  distanceToPoint: Vc,
  equals: kc,
  intersectBox: fs,
  intersectPlane: hs,
  intersectSphere: ds,
  intersectTriangle: ps,
  isWellFormed: Wc,
  recast: Ic,
  set: Wt,
  squaredDistanceToPoint: cs,
  toString: zc
}, Symbol.toStringTag, { value: "Module" })), qc = {
  Left: 0,
  Right: 1,
  Bottom: 2,
  Top: 3,
  Near: 4,
  Far: 5
};
function ms() {
  return {
    planes: [
      ve(),
      ve(),
      ve(),
      ve(),
      ve(),
      ve()
    ]
  };
}
function jc(t) {
  const e = ms();
  return gs(e, t);
}
function gs(t, e) {
  for (let n = 0; n < 6; n++) Xn(t.planes[n], e.planes[n]);
  return t;
}
function Qc(t, e, n = "gl") {
  const r = [e[0], e[4], e[8], e[12]], i = [e[1], e[5], e[9], e[13]], s = [e[2], e[6], e[10], e[14]], a = [e[3], e[7], e[11], e[15]], o = (l, h, f) => [
    l[0] + f * h[0],
    l[1] + f * h[1],
    l[2] + f * h[2],
    l[3] + f * h[3]
  ], c = [
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
  for (let l = 0; l < 6; l++) {
    const [h, f, d, p] = c[l];
    ns(t.planes[l], h, f, d, p), rs(t.planes[l], t.planes[l]);
  }
  return t;
}
function Xc(t, e) {
  for (const n of t.planes)
    if (ce(n, e) < 0) return !1;
  return !0;
}
function Yc(t, e, n) {
  for (const r of t.planes)
    if (ce(r, e) < -n) return !1;
  return !0;
}
function Hc(t, e) {
  for (const n of t.planes) {
    const r = n.normal[0], i = n.normal[1], s = n.normal[2], a = r >= 0 ? e.max[0] : e.min[0], o = i >= 0 ? e.max[1] : e.min[1], c = s >= 0 ? e.max[2] : e.min[2];
    if (r * a + i * o + s * c + n.constant < 0) return !1;
  }
  return !0;
}
function Zc(t, e) {
  const n = Kc(t);
  if (!n) return !0;
  let r = !1, i = !1;
  for (const s of n) {
    const a = ce(e, s);
    if (a > 0 ? r = !0 : a < 0 && (i = !0), r && i) return !0;
  }
  return !1;
}
function Kc(t) {
  const [e, n, r, i, s, a] = t.planes, o = [];
  for (const c of [s, a])
    for (const l of [r, i])
      for (const h of [e, n]) {
        const f = Jc(h, l, c);
        if (!f) return null;
        o.push(f);
      }
  return o;
}
function Jc(t, e, n) {
  const r = t.normal[0], i = t.normal[1], s = t.normal[2], a = e.normal[0], o = e.normal[1], c = e.normal[2], l = n.normal[0], h = n.normal[1], f = n.normal[2], d = r * (o * f - c * h) - i * (a * f - c * l) + s * (a * h - o * l);
  if (Math.abs(d) < 1e-12) return null;
  const p = 1 / d, m = -t.constant, g = -e.constant, b = -n.constant;
  return new Float32Array([
    (m * (o * f - c * h) - i * (g * f - c * b) + s * (g * h - o * b)) * p,
    (r * (g * f - c * b) - m * (a * f - c * l) + s * (a * b - g * l)) * p,
    (r * (o * b - g * h) - i * (a * b - g * l) + m * (a * h - o * l)) * p
  ]);
}
function eu(t, e, n = 1e-6) {
  for (let r = 0; r < 6; r++)
    if (!ss(t.planes[r], e.planes[r], n)) return !1;
  return !0;
}
const _g = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FRUSTUM_PLANE: qc,
  clone: jc,
  containsPoint: Xc,
  copy: gs,
  create: ms,
  equals: eu,
  intersectsBox: Hc,
  intersectsPlane: Zc,
  intersectsSphere: Yc,
  setFromProjectionView: Qc
}, Symbol.toStringTag, { value: "Module" })), tu = {
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
function nu(t = 0, e = 0, n = 0, r = 1) {
  return { r: t, g: e, b: n, a: r };
}
function ru(t) {
  return { r: t.r, g: t.g, b: t.b, a: t.a };
}
function iu(t, e) {
  return t.r = e.r, t.g = e.g, t.b = e.b, t.a = e.a, t;
}
function su(t, e, n, r, i = 1) {
  return t.r = e, t.g = n, t.b = r, t.a = i, t;
}
function au(t, e, n, r) {
  return t.r = e, t.g = n, t.b = r, t;
}
function ou(t, e, n) {
  const r = Math.trunc(e);
  return t.r = (r >> 16 & 255) / 255, t.g = (r >> 8 & 255) / 255, t.b = (r & 255) / 255, n !== void 0 && (t.a = n), t;
}
function lu(t) {
  const e = (n) => Math.round(Math.min(Math.max(n, 0), 1) * 255);
  return e(t.r) << 16 | e(t.g) << 8 | e(t.b);
}
function cu(t, e) {
  const n = e.trim().toLowerCase(), r = tu[n];
  if (r)
    return t.r = r[0], t.g = r[1], t.b = r[2], n === "transparent" && (t.a = 0), t;
  if (n.startsWith("#")) {
    const s = n.slice(1);
    if (/^[0-9a-f]+$/.test(s)) {
      const a = (o) => parseInt(o + o, 16) / 255;
      if (s.length === 3 || s.length === 4)
        return t.r = a(s[0]), t.g = a(s[1]), t.b = a(s[2]), s.length === 4 && (t.a = a(s[3])), t;
      if (s.length === 6 || s.length === 8) {
        const o = (c) => parseInt(s.slice(c, c + 2), 16) / 255;
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
function uu(t, e = !1) {
  const n = (s) => Math.round(Math.min(Math.max(s, 0), 1) * 255), r = (s) => s.toString(16).padStart(2, "0"), i = `#${r(n(t.r))}${r(n(t.g))}${r(n(t.b))}`;
  return e ? `${i}${r(n(t.a))}` : i;
}
function hu(t, e) {
  return t.r = Math.min(Math.max(e.r, 0), 1), t.g = Math.min(Math.max(e.g, 0), 1), t.b = Math.min(Math.max(e.b, 0), 1), t.a = Math.min(Math.max(e.a, 0), 1), t;
}
function du(t, e, n, r) {
  return t.r = e.r + (n.r - e.r) * r, t.g = e.g + (n.g - e.g) * r, t.b = e.b + (n.b - e.b) * r, t.a = e.a + (n.a - e.a) * r, t;
}
function fu(t, e, n) {
  return t.r = e.r + n.r, t.g = e.g + n.g, t.b = e.b + n.b, t.a = e.a + n.a, t;
}
function pu(t, e, n) {
  return t.r = e.r * n.r, t.g = e.g * n.g, t.b = e.b * n.b, t.a = e.a * n.a, t;
}
function mu(t, e, n, r, i = t.a) {
  const s = (e % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), a = Math.min(Math.max(n, 0), 1), o = Math.min(Math.max(r, 0), 1);
  if (a === 0)
    return t.r = o, t.g = o, t.b = o, t.a = i, t;
  const c = o < 0.5 ? o * (1 + a) : o + a - o * a, l = 2 * o - c, h = (d) => {
    let p = d;
    return p < 0 && (p += 1), p > 1 && (p -= 1), p < 1 / 6 ? l + (c - l) * 6 * p : p < 1 / 2 ? c : p < 2 / 3 ? l + (c - l) * (2 / 3 - p) * 6 : l;
  }, f = s / (Math.PI * 2);
  return t.r = h(f + 1 / 3), t.g = h(f), t.b = h(f - 1 / 3), t.a = i, t;
}
function gu(t, e) {
  const n = Math.max(e.r, e.g, e.b), r = Math.min(e.r, e.g, e.b), i = (r + n) / 2, s = n - r;
  if (s === 0)
    return t[0] = 0, t[1] = 0, t[2] = i, t;
  const a = i <= 0.5 ? s / (n + r) : s / (2 - n - r);
  let o;
  return n === e.r ? o = (e.g - e.b) / s + (e.g < e.b ? 6 : 0) : n === e.g ? o = (e.b - e.r) / s + 2 : o = (e.r - e.g) / s + 4, t[0] = o / 6 * Math.PI * 2, t[1] = a, t[2] = i, t;
}
function bu(t, e, n = !0) {
  const r = e ?? new Float32Array(n ? 4 : 3);
  return r[0] = t.r, r[1] = t.g, r[2] = t.b, n && r.length >= 4 && (r[3] = t.a), r;
}
function wu(t, e, n = 0) {
  return t.r = e[n] ?? 0, t.g = e[n + 1] ?? 0, t.b = e[n + 2] ?? 0, e.length > n + 3 && (t.a = e[n + 3]), t;
}
function yu(t, e) {
  const n = (r) => r < 0.04045 ? r * 0.0773993808 : Math.pow(r * 0.9478672986 + 0.0521327014, 2.4);
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function vu(t, e) {
  const n = (r) => r <= 31308e-7 ? r * 12.92 : 1.055 * Math.pow(r, 0.41666) - 0.055;
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function xu(t, e = 1e-6) {
  return t.r >= -e && t.r <= 1 + e && t.g >= -e && t.g <= 1 + e && t.b >= -e && t.b <= 1 + e;
}
function Su(t, e, n = 1e-6) {
  return Math.abs(t.r - e.r) <= n && Math.abs(t.g - e.g) <= n && Math.abs(t.b - e.b) <= n && Math.abs(t.a - e.a) <= n;
}
function Tu(t) {
  return `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
}
const Eg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: fu,
  clampColor: hu,
  clone: ru,
  convertLinearToSRGB: vu,
  convertSRGBToLinear: yu,
  copy: iu,
  create: nu,
  equals: Su,
  fromArray: wu,
  getHSL: gu,
  getHex: lu,
  getStyle: uu,
  isInGamut: xu,
  lerp: du,
  multiply: pu,
  set: su,
  setHSL: mu,
  setHex: ou,
  setRGB: au,
  setStyle: cu,
  toArray: bu,
  toString: Tu
}, Symbol.toStringTag, { value: "Module" })), $u = new Float32Array(16), hr = new Float32Array(16), Au = { origin: new Float32Array(3), direction: new Float32Array(3) }, Se = new Float32Array(3), Bt = new Float32Array(3), dr = new Float32Array(3), fr = new Float32Array(3), bs = new Float32Array(3);
function _u(t = 0, e = 0, n = 0, r = -1) {
  return {
    ray: { origin: new Float32Array([t, e, n]), direction: new Float32Array([0, 0, r]) },
    near: 0,
    far: Number.POSITIVE_INFINITY,
    doubleSided: !0
  };
}
function Eu(t) {
  return {
    ray: { origin: new Float32Array(t.ray.origin), direction: new Float32Array(t.ray.direction) },
    near: t.near,
    far: t.far,
    doubleSided: t.doubleSided
  };
}
function Pu(t, e) {
  return Wt(t.ray, e.ray.origin, e.ray.direction), t.near = e.near, t.far = e.far, t.doubleSided = e.doubleSided, t;
}
function Kn(t, e, n) {
  return Wt(t.ray, e, n), t;
}
function Lu(t, e, n) {
  return Kn(t, e, le(bs, n, e));
}
function Cu(t, e, n, r, i = "gl") {
  const s = i === "zo" ? 0 : -1, a = 1;
  return Gt(Se, e, n, s, r), Gt(Bt, e, n, a, r), Kn(t, Se, le(bs, Bt, Se));
}
function Gt(t, e, n, r, i) {
  const s = i[3] * e + i[7] * n + i[11] * r + i[15], a = s === 0 ? 1 : 1 / s;
  return t[0] = (i[0] * e + i[4] * n + i[8] * r + i[12]) * a, t[1] = (i[1] * e + i[5] * n + i[9] * r + i[13]) * a, t[2] = (i[2] * e + i[6] * n + i[10] * r + i[14]) * a, t;
}
function Mu(t, e, n) {
  const r = ds(t.ray, e, n);
  return r !== null && qt(t, r) ? r : null;
}
function Fu(t, e) {
  const n = fs(t.ray, e);
  return n !== null && qt(t, n) ? n : null;
}
function Ru(t, e) {
  const n = hs(t.ray, e);
  return n !== null && qt(t, n) ? n : null;
}
function qt(t, e) {
  return e >= t.near && e <= t.far;
}
function ws(t, e, n, r, i = []) {
  i.length = 0;
  const s = r ? Gu(Au, t.ray, r) : t.ray;
  if (!s) return i;
  const a = Math.floor(e.length / 3), o = Math.floor(n ? n.length / 3 : a / 3), c = !t.doubleSided;
  for (let l = 0; l < o; l++) {
    const h = n ? n[l * 3] ?? 0 : l * 3, f = n ? n[l * 3 + 1] ?? 0 : l * 3 + 1, d = n ? n[l * 3 + 2] ?? 0 : l * 3 + 2;
    if (h >= a || f >= a || d >= a) continue;
    Jt(Bt, e, h), Jt(dr, e, f), Jt(fr, e, d);
    const p = ps(s, Bt, dr, fr, c);
    if (p === null) continue;
    Zn(Se, s, p);
    const m = new Float32Array([Se[0], Se[1], Se[2]]);
    r && Gt(m, m[0], m[1], m[2], r);
    const g = Ci(t.ray.origin, m);
    qt(t, g) && i.push({ distance: g, point: m, triangleIndex: l, vertexIndices: [h, f, d] });
  }
  return i.sort((l, h) => l.distance - h.distance), i;
}
function Bu(t, e, n, r) {
  const i = ws(t, e, n, r, []);
  return i.length > 0 ? i[0] : null;
}
function Gu(t, e, n) {
  const r = Nt($u, n);
  if (!r) return null;
  const i = Gt(
    new Float32Array(3),
    e.origin[0],
    e.origin[1],
    e.origin[2],
    r
  ), s = Ou(new Float32Array(3), e.direction, r);
  return Wt(t, i, s);
}
function Ou(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, Dn(t, t);
}
function Jt(t, e, n) {
  return t[0] = e[n * 3] ?? 0, t[1] = e[n * 3 + 1] ?? 0, t[2] = e[n * 3 + 2] ?? 0, t;
}
function Uu(t, e) {
  return Nt(t, e);
}
function Du(t, e, n) {
  return Z(hr, e, n), Nt(t, hr);
}
const Pg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Eu,
  copy: Pu,
  create: _u,
  intersectBox: Fu,
  intersectPlane: Ru,
  intersectSphere: Mu,
  intersectTriangles: ws,
  intersectTrianglesFirst: Bu,
  inverseProjectionView: Uu,
  inverseProjectionViewOf: Du,
  set: Kn,
  setFromNdc: Cu,
  setFromPoints: Lu
}, Symbol.toStringTag, { value: "Module" })), Lg = 1e-6, Iu = Math.PI / 180, Vu = 180 / Math.PI;
function ys(t) {
  return t * Iu;
}
function Cg(t) {
  return t * Vu;
}
function De(t, e, n) {
  return t < e ? e : t > n ? n : t;
}
function Nu(t, e, n) {
  return e === t ? 0 : De((n - t) / (e - t), 0, 1);
}
function Mg(t, e, n) {
  return t + (e - t) * n;
}
function Fg(t, e, n) {
  const r = Nu(t, e, n);
  return r * r * (3 - 2 * r);
}
function Rg(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function vs(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function xs(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function ku(t, e, n) {
  if (e === "wgsl") return t.wgsl;
  const r = xs(n);
  return r ? t[r] : void 0;
}
function zu(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function Wu(t, e, n, r) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = vs(t) === "glsl" ? `请在 \`code\` 里提供 \`${xs(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${r}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${zu(n)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const Ss = `#version 300 es
`, Ts = `precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, Bg = Ss + Ts;
function $s(t) {
  const e = t?.preamble ?? !0, n = e === !0 ? Ts : e === !1 || e === "" ? !1 : e;
  return { version: t?.version ?? !0, preamble: n };
}
const qu = /^\s*#version[^\n]*\n?/, ju = /^(\s*#version[^\n]*\n?)([\s\S]*)$/;
function Qu(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `#define ${e} ${n ? 1 : 0}` : `#define ${e} ${n}`).join(`
`) : "";
}
function Xu(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `const ${e}: bool = ${n};` : typeof n == "number" ? Number.isInteger(n) ? `const ${e}: i32 = ${n};` : `const ${e}: f32 = ${n};` : `const ${e}: f32 = ${n};`).join(`
`) : "";
}
function Yu(t, e, n = "shader", r) {
  const { version: i, preamble: s } = $s(r), a = Qu(e);
  if (!i && !s && !a) return t;
  let o = "", c = t;
  if (i) {
    const h = /^\s*#version\s+([^\n]*)/.exec(t);
    if (h) {
      const f = h[1].trim();
      if (!/^300\s+es\b/.test(f))
        throw new u(
          `[gpu-device-api] ShaderModule「${n}」声明了 \`#version ${f}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。
（要自己掌控 \`#version\`，可以在 createShaderModule 里传 \`glsl: { version: false }\`。）`
        );
    }
    o = Ss, c = t.replace(qu, "");
  } else {
    const h = ju.exec(t);
    h && (o = h[1], c = h[2]);
  }
  const l = [o];
  return s && l.push(s), a && l.push(`${a}
`), l.push(c.trim()), `${l.join("")}
`;
}
function Hu(t, e) {
  const n = Xu(e);
  return n ? `${n}

${t.trim()}
` : `${t.trim()}
`;
}
function _n(t) {
  const { backend: e, source: n, stage: r, label: i = "shader" } = t, s = vs(e), a = ku(n, s, r);
  if (a === void 0)
    throw new u(Wu(e, r, n, i));
  return s === "glsl" ? {
    language: s,
    stage: r,
    code: Yu(a, t.defines, i, t.glsl),
    hasPreamble: $s(t.glsl).preamble !== !1
  } : {
    language: s,
    stage: r,
    code: Hu(a, t.defines),
    hasPreamble: !1
  };
}
function Gg(t, e, n) {
  const r = e.split(`
`), i = `[gpu-device-api] 着色器「${n}」编译失败：
${t.trim()}
`, s = /* @__PURE__ */ new Set(), a = /ERROR:\s*\d+:(\d+)/g;
  let o;
  for (; (o = a.exec(t)) !== null; ) {
    const l = Number(o[1]);
    l > 0 && s.add(l);
  }
  if (s.size === 0)
    return `${i}
----- 完整源码 -----
${En(r)}
`;
  const c = [];
  for (const l of [...s].sort((h, f) => h - f)) {
    c.push(`----- 第 ${l} 行附近 -----`);
    const h = Math.max(1, l - 3), f = Math.min(r.length, l + 3);
    c.push(En(r.slice(h - 1, f), h));
  }
  return `${i}
${c.join(`
`)}
`;
}
function En(t, e = 1) {
  const n = String(e + t.length - 1).length;
  return t.map((r, i) => `${String(e + i).padStart(n, " ")} | ${r}`).join(`
`);
}
function Og(t) {
  return En(t.split(`
`));
}
const ue = /* @__PURE__ */ new Map();
function Zu(t, e) {
  if (ue.has(t))
    throw new u(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return ue.set(t, e), e;
}
function Ug(t) {
  for (const [e, n] of Object.entries(t)) Zu(e, n);
}
function Dg(t, e) {
  return ue.set(t, e), e;
}
function Ig(t) {
  return ue.has(t);
}
function Vg(t) {
  return ue.get(t);
}
function Ng(t) {
  const e = ue.get(t);
  if (!e) {
    const n = Ku();
    throw new u(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (n.length > 0 ? `已注册：${n.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function kg(t) {
  return ue.delete(t);
}
function Ku() {
  return [...ue.keys()].sort();
}
function zg() {
  ue.clear();
}
function As(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const Ju = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, eh = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, pr = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function Wg(t) {
  const e = As(t), n = [], r = [
    { regex: new RegExp(`${Ju}\\s*${pr}`, "g"), swapped: !1 },
    { regex: new RegExp(`${eh}\\s*${pr}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of r) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), c = Number(a[s ? 1 : 2]), l = (a[3] ?? "").trim(), h = a[4], f = a[5].trim().replace(/\s+/g, " ");
      n.some((d) => d.group === o && d.binding === c) || n.push(th(o, c, l, h, f));
    }
  }
  return n.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function th(t, e, n, r, i) {
  let s = "handle", a;
  if (n.startsWith("uniform"))
    s = "uniform";
  else if (n.startsWith("storage")) {
    s = "storage";
    const l = n.split(",").map((h) => h.trim())[1];
    l === "read" ? a = "read" : l === "read_write" ? a = "read_write" : l === "write" && (a = "write");
  }
  const o = nh(s, i);
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
function nh(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const mr = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, rh = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function ih(t) {
  const e = As(t), n = [];
  let r;
  for (mr.lastIndex = 0; (r = mr.exec(e)) !== null; ) {
    const i = r[1], s = r[2] ?? "", a = r[3];
    let o = null;
    if (i === "compute") {
      const c = rh.exec(s);
      o = c ? [Number(c[1]), Number(c[2] ?? 1), Number(c[3] ?? 1)] : [1, 1, 1];
    }
    n.push({ stage: i, name: a, workgroupSize: o });
  }
  return n;
}
function qg(t, e, n) {
  return ih(t).find((r) => r.stage === e && r.name === n);
}
function jg(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const sh = {
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
function ah(t) {
  return sh[t] ?? `0x${t.toString(16)}`;
}
const oh = [
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
function _s(t) {
  return oh.includes(t);
}
function lh(t, e) {
  const n = [], r = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
  for (let c = 0; c < r; c++) {
    const l = t.getActiveAttrib(e, c);
    l && n.push({
      name: l.name,
      location: t.getAttribLocation(e, l.name),
      glType: l.type,
      size: l.size
    });
  }
  const i = [], s = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
  for (let c = 0; c < s; c++) {
    const l = t.getActiveUniform(e, c);
    l && i.push({
      name: l.name,
      location: t.getUniformLocation(e, l.name),
      glType: l.type,
      size: l.size,
      isArray: /\[\d+\]$/.test(l.name)
    });
  }
  const a = [], o = t.getProgramParameter(e, t.ACTIVE_UNIFORM_BLOCKS);
  for (let c = 0; c < o; c++) {
    const l = t.getActiveUniformBlockName(e, c) ?? `block${c}`;
    a.push({
      name: l,
      index: c,
      dataSize: t.getActiveUniformBlockParameter(e, c, t.UNIFORM_BLOCK_DATA_SIZE),
      activeUniforms: t.getActiveUniformBlockParameter(e, c, t.UNIFORM_BLOCK_ACTIVE_UNIFORMS)
    });
  }
  return { attributes: n, uniforms: i, uniformBlocks: a };
}
function ch(t) {
  return t.uniforms.filter((e) => _s(e.glType));
}
function uh(t, e) {
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
  const r = ch(t).sort((i, s) => i.name.localeCompare(s.name));
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
class hh {
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
function G(t, e, n) {
  const r = t.getParameter(e);
  return typeof r == "number" && r > 0 ? r : n;
}
const dh = 16777215;
function fh(t) {
  return {
    maxTextureSize: G(t, 3379, 2048),
    max3dTextureSize: G(t, 32883, 256),
    maxArrayTextureLayers: G(t, 35071, 256),
    maxSamples: G(t, 36183, 4),
    maxUniformBufferBindings: G(t, 35375, 12),
    maxUniformBlockSize: G(t, 35376, 16384),
    maxUniformBufferOffsetAlignment: G(t, 35380, 256),
    maxVertexAttribs: G(t, 34921, 16),
    maxVertexUniformVectors: G(t, 36347, 128),
    maxFragmentUniformVectors: G(t, 36349, 128),
    maxVaryingVectors: G(t, 36348, 8),
    maxTextureImageUnits: G(t, 34930, 16),
    maxCombinedTextureImageUnits: G(t, 35661, 32),
    maxCubeMapTextureSize: G(t, 34076, 2048),
    maxRenderbufferSize: G(t, 34024, 2048),
    maxElementIndex: dh,
    maxElementsVertices: G(t, 33001, 2147483647),
    maxElementsIndices: G(t, 33e3, 2147483647)
  };
}
function ph(t) {
  const e = fh(t);
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
function mh(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), t.getExtension("EXT_disjoint_timer_query_webgl2") && e.add("timestamp-query"), e;
}
function gh(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const n = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", r = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: n, device: r };
}
function bh(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function wh(t, e) {
  const n = t.getContext("webgl2", e);
  if (!n)
    throw new u(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return n;
}
class yh {
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
  invalidateTextureUnits() {
    this.activeUnit >= 0 && this.textures.delete(this.activeUnit);
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
    const c = e ? `1:${n}:${r}:${i}:${s}:${a}:${o}` : "0";
    if (this.blendSignature === c) return;
    const l = this.gl;
    e ? (l.enable(l.BLEND), l.blendFuncSeparate(n, r, s, a), l.blendEquationSeparate(i, o)) : l.disable(l.BLEND), this.blendSignature = c;
  }
  setBlendConstant(e) {
    en(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
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
    vh(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
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
    en(this.viewport, [e, n, r, i]) || (this.gl.viewport(e, n, r, i), this.viewport = [e, n, r, i]);
  }
  setScissor(e, n, r, i, s) {
    const a = this.gl;
    this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !en(this.scissor, [n, r, i, s]) && (a.scissor(n, r, i, s), this.scissor = [n, r, i, s]);
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
function en(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function vh(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
const xh = [
  {
    flag: C.Storage,
    name: "Storage",
    reason: "shader storage buffer 需要 GLES 3.1，WebGL2 只有 GLES 3.0。请改用 uniform buffer 传数据。"
  },
  {
    flag: C.Indirect,
    name: "Indirect",
    reason: "WebGL2 没有 indirect draw。请改用一次性的 uniform 数据 + 普通 draw 调用。"
  },
  {
    flag: C.QueryResolve,
    name: "QueryResolve",
    reason: "WebGL2 的遮挡查询结果只能同步读回，没有查询结果缓冲区的概念。"
  }
];
class Sh {
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
    if (We(r.size, "BufferDescriptor.size"), r.size % 4 !== 0)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${r.size}。（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）`
      );
    for (const a of xh)
      if (r.usage & a.flag)
        throw new u(
          `[gpu-device-api] BufferUsage.${a.name} 在 WebGL2 后端不可用：${a.reason}`
        );
    this.gl = e, this.state = n, this.onDestroy = i, this.label = r.label ?? B("buffer"), this.id = B("buf"), this.size = r.size, this.usage = r.usage, this.usages = r.usage, this.bindingTarget = r.usage & C.Index ? e.ELEMENT_ARRAY_BUFFER : e.COPY_WRITE_BUFFER;
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
    if (Te(n, "mapAsync 的 offset"), We(r, "mapAsync 的 size"), n % 4 !== 0)
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
const ft = 6403, pt = 33319, Th = 6407, Ce = 6408, Me = 36244, Fe = 33320, Re = 36249, tn = 6402, $h = 34041, we = 5121, Be = 5120, mt = 5123, nn = 5122, Xe = 5125, rn = 5124, gt = 5126, sn = 5131, Ah = 33640, _h = 34042, Eh = 33321, Ph = 36756, Lh = 33330, Ch = 33329, Mh = 33332, Fh = 33331, Rh = 33325, Bh = 33323, Gh = 36757, Oh = 33336, Uh = 33335, Dh = 33334, Ih = 33333, Vh = 33326, Nh = 33338, kh = 33337, zh = 33327, Wh = 32856, qh = 35907, jh = 36759, Qh = 36220, Xh = 36222, Yh = 32857, Hh = 35898, Zh = 33340, Kh = 33339, Jh = 33328, ed = 36214, td = 36216, nd = 34842, rd = 36208, id = 36226, sd = 34836, ad = 33189, od = 33190, ld = 35056, cd = 36012;
function x(t, e, n, r, i = {}) {
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
const ud = Object.freeze({
  r8unorm: x(Eh, ft, we, 1, { uploadType: "Uint8Array" }),
  r8snorm: x(Ph, ft, Be, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: x(Lh, Me, we, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: x(Ch, Me, Be, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: x(Mh, Me, mt, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: x(Fh, Me, nn, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: x(Rh, ft, sn, 2, { uploadType: "Uint16Array" }),
  rg8unorm: x(Bh, pt, we, 2, { uploadType: "Uint8Array" }),
  rg8snorm: x(Gh, pt, Be, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: x(Oh, Fe, we, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: x(Uh, Fe, Be, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: x(Dh, Me, Xe, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: x(Ih, Me, rn, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: x(Vh, ft, gt, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: x(Nh, Fe, mt, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: x(kh, Fe, nn, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: x(zh, pt, sn, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: x(Wh, Ce, we, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": x(qh, Ce, we, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: x(jh, Ce, Be, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: x(Qh, Re, we, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: x(Xh, Re, Be, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: x(Yh, Ce, Ah, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: x(Hh, Th, Xe, 4, { attachment: !1, uploadType: null }),
  rg32uint: x(Zh, Fe, Xe, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: x(Kh, Fe, rn, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: x(Jh, pt, gt, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: x(ed, Re, mt, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: x(td, Re, nn, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: x(nd, Ce, sn, 8, { uploadType: "Uint16Array" }),
  rgba32uint: x(rd, Re, Xe, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: x(id, Re, rn, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: x(sd, Ce, gt, 16, { uploadType: "Float32Array" }),
  depth16unorm: x(ad, tn, mt, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: x(od, tn, Xe, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": x(ld, $h, _h, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: x(cd, tn, gt, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), hd = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function z(t) {
  const e = hd[t];
  if (e)
    throw new u(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const n = ud[t];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return n;
}
function dd(t) {
  return z(t).attachment;
}
function fd(t, e) {
  const n = z(t);
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
class Es {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, n) {
    const r = Lt(e, n);
    if (r.baseMipLevel + r.mipLevelCount > e.mipLevelCount)
      throw new u(
        `[gpu-device-api] texture view 的 mip 范围 [${r.baseMipLevel}, ${r.baseMipLevel + r.mipLevelCount}) 超出了纹理「${e.label}」的 ${e.mipLevelCount} 层。`
      );
    if (r.baseArrayLayer + r.arrayLayerCount > e.depthOrArrayLayers)
      throw new u(
        `[gpu-device-api] texture view 的层范围 [${r.baseArrayLayer}, ${r.baseArrayLayer + r.arrayLayerCount}) 超出了纹理「${e.label}」的 ${e.depthOrArrayLayers} 层。`
      );
    this.texture = e, this.descriptor = r, this.label = n.label ?? B("textureView");
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
function pd(t, e) {
  if (t === "1d")
    throw new u(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class gr {
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
    const s = Gn(r.size);
    if (We(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new u(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = z(r.format), o = r.dimension ?? At.D2, c = r.sampleCount ?? 1, l = r.mipLevelCount ?? 1;
    if (c > 1) {
      if (o !== At.D2 || s.depthOrArrayLayers > 1)
        throw new u(
          "[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: '2d'` 且 `depthOrArrayLayers: 1`）。"
        );
      if (l > 1)
        throw new u("[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。");
    }
    if (l > 1) {
      const f = Math.floor(Math.log2(Math.max(s.width, s.height))) + 1;
      if (l > f)
        throw new u(
          `[gpu-device-api] mipLevelCount=${l} 超过了 ${s.width}x${s.height} 能容纳的最大层数 ${f}。`
        );
    }
    this.label = r.label ?? B("texture"), this.dimension = o, this.format = r.format, this.usage = r.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = l, this.sampleCount = c, this.glTarget = pd(o, s.depthOrArrayLayers);
    const h = e.createTexture();
    if (!h) throw new u("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = h, e.bindTexture(this.glTarget, h), c > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      c,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === At.D3 ? e.texStorage3D(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      s.depthOrArrayLayers
    ) : s.depthOrArrayLayers > 1 ? e.texStorage3D(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      s.depthOrArrayLayers
    ) : e.texStorage2D(this.glTarget, l, a.internalFormat, s.width, s.height), this.applyDefaultSamplerParameters();
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
    const n = new Es(this, e);
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
const md = {
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
}, Ps = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, gd = {
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
}, bt = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, br = {
  front: 1028,
  back: 1029
}, bd = {
  ccw: 2305,
  cw: 2304
}, an = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, wr = {
  nearest: 9728,
  linear: 9729
}, wd = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, yr = 5121, vr = 5120, xr = 5123, Sr = 5122, yd = 5125, vd = 5124, xd = 5126, Sd = 5131, Td = {
  float32: { type: xd, normalized: !1, integer: !1 },
  float16: { type: Sd, normalized: !1, integer: !1 },
  unorm8: { type: yr, normalized: !0, integer: !1 },
  snorm8: { type: vr, normalized: !0, integer: !1 },
  uint8: { type: yr, normalized: !1, integer: !0 },
  sint8: { type: vr, normalized: !1, integer: !0 },
  unorm16: { type: xr, normalized: !0, integer: !1 },
  snorm16: { type: Sr, normalized: !0, integer: !1 },
  uint16: { type: xr, normalized: !1, integer: !0 },
  sint16: { type: Sr, normalized: !1, integer: !0 },
  uint32: { type: yd, normalized: !1, integer: !0 },
  sint32: { type: vd, normalized: !1, integer: !0 }
}, $d = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function Ad(t) {
  const e = $d.exec(t);
  if (!e)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const n = Td[e[1]];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: Ae(t).components,
    type: n.type,
    normalized: n.normalized,
    integer: n.integer
  };
}
function Pt(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return Ed(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const n = t;
    return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const _d = {
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
function Ed(t) {
  const e = t.trim().toLowerCase(), n = _d[e];
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
class Pd {
  label;
  descriptor;
  native;
  gl;
  state;
  _disposed = !1;
  constructor(e, n, r = {}) {
    this.gl = e, this.state = n, this.descriptor = bi(r), this.label = r.label ?? B("sampler");
    const i = e.createSampler();
    if (!i) throw new u("[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。");
    this.native = i;
    const s = this.descriptor;
    if (e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, wr[s.minFilter]), e.samplerParameteri(i, e.TEXTURE_MAG_FILTER, wr[s.magFilter]), s.minFilter === "linear" && s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR) : s.minFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_NEAREST) : s.mipmapFilter === "linear" ? e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_LINEAR) : e.samplerParameteri(i, e.TEXTURE_MIN_FILTER, e.NEAREST), e.samplerParameteri(i, e.TEXTURE_WRAP_S, an[s.addressModeU]), e.samplerParameteri(i, e.TEXTURE_WRAP_T, an[s.addressModeV]), e.samplerParameteri(i, e.TEXTURE_WRAP_R, an[s.addressModeW]), e.samplerParameterf(i, e.TEXTURE_MIN_LOD, s.lodMinClamp), e.samplerParameterf(i, e.TEXTURE_MAX_LOD, s.lodMaxClamp), s.compare !== void 0 ? (e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(i, e.TEXTURE_COMPARE_FUNC, Ps[s.compare])) : e.samplerParameteri(i, e.TEXTURE_COMPARE_MODE, e.NONE), s.maxAnisotropy > 1) {
      const a = e.getExtension("EXT_texture_filter_anisotropic");
      if (a) {
        const o = bh(e);
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
class Ld {
  label;
  source;
  defines;
  glsl;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? B("shaderModule"), this.source = wi(e.code), this.defines = e.defines ? { ...e.defines } : {}, this.glsl = e.glsl ? { ...e.glsl } : {};
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
const Ls = "EXT_disjoint_timer_query_webgl2", Pn = 35887;
function Cd(t) {
  return t.getExtension(Ls) ?? null;
}
class Cs {
  label;
  type;
  count;
  /** 原生表示：GL 的 query 对象数组（每条查询一个对象，见类注释）。 */
  native;
  /** 每条查询对应的 GL 目标（`TIME_ELAPSED_EXT` 或 `ANY_SAMPLES_PASSED`）。 */
  target;
  /** timestamp 查询用的扩展；occlusion 查询为 null。 */
  timerExtension;
  gl;
  onDestroy;
  _disposed = !1;
  constructor(e, n, r = () => {
  }) {
    if (this.gl = e, this.onDestroy = r, this.label = n.label ?? B("querySet"), !Number.isInteger(n.count) || n.count <= 0)
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(n.count)}.`
      );
    if (n.type === ze.Timestamp) {
      const s = Cd(e);
      if (!s)
        throw new u(
          `[gpu-device-api] QuerySet "${this.label}": WebGL2 timestamp queries need the "${Ls}" extension, which this context does not expose. That extension is the only way to measure GPU time on WebGL2; without it, GPU timing is unavailable. Use the WebGPU backend (feature "timestamp-query") or a driver/browser build that implements it.`
        );
      this.timerExtension = s, this.target = s.TIME_ELAPSED_EXT;
    } else
      this.timerExtension = null, this.target = Pn;
    const i = [];
    for (let s = 0; s < n.count; s++) {
      const a = e.createQuery();
      if (!a) {
        for (const o of i) e.deleteQuery(o);
        throw new u(
          `[gpu-device-api] QuerySet "${this.label}": gl.createQuery() returned null for entry ${s} (the context ran out of query objects or was lost).`
        );
      }
      i.push(a);
    }
    this.type = n.type, this.count = n.count, this.native = i;
  }
  get disposed() {
    return this._disposed;
  }
  /** 取第 index 条 GL query；越界时抛错。 */
  queryAt(e, n) {
    if (!Number.isInteger(e) || e < 0 || e >= this.count)
      throw new u(
        `[gpu-device-api] ${n}: query index ${String(e)} is outside the query set "${this.label}" range [0, ${this.count}).`
      );
    return this.native[e];
  }
  /** 销毁全部 GL query 对象。幂等。 */
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.native) this.gl.deleteQuery(e);
      this.onDestroy(this);
    }
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
}
function Ln(t, e) {
  if (t instanceof Cs) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGL2 query set created by WebGL2Device.createQuerySet().`
  );
}
class Tr {
  label;
  entries;
  sortedEntries;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? B("bindGroupLayout"), this.sortedEntries = vi(e.entries), this.entries = this.sortedEntries;
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
class Md {
  label;
  layout;
  entries;
  byBinding;
  _disposed = !1;
  constructor(e) {
    this.label = e.label ?? B("bindGroup"), this.layout = e.layout, this.entries = [...e.entries], this.byBinding = new Map(this.entries.map((n) => [n.binding, n])), this.validate();
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
class $r {
  label;
  bindGroupLayouts;
  isAuto;
  plan;
  constructor(e, n, r) {
    if (this.label = e.label ?? B("pipelineLayout"), this.bindGroupLayouts = [...e.bindGroupLayouts], this.isAuto = n, this.bindGroupLayouts.length > 4)
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
function Ar(t, e) {
  return `${t}:${e}`;
}
function Fd(t, e) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((d, p) => {
    const m = [...d].sort((b, w) => b.binding - w.binding), g = m.filter((b) => b.type === O.Sampler || b.type === O.ComparisonSampler);
    for (const b of m)
      switch (i.push(`${p}:${b.binding}:${b.type}:${b.name ?? ""}:${b.buffer?.hasDynamicOffset ? "dyn" : ""}`), b.type) {
        case O.Uniform: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${p} 的 binding ${b.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new u(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          n.set(Ar(p, b.binding), {
            group: p,
            binding: b.binding,
            name: b.name,
            blockBinding: s++,
            dynamic: b.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: b.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case O.Texture: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${p} 的 binding ${b.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new u(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const w = Rd(b, g);
          r.set(Ar(p, b.binding), {
            group: p,
            binding: b.binding,
            name: b.name,
            unit: a++,
            samplerBinding: w ? w.binding : null,
            samplerName: w ? w.name ?? null : null
          });
          break;
        }
        case O.Sampler:
        case O.ComparisonSampler:
          break;
        case O.Storage:
        case O.ReadOnlyStorage:
          throw new u(
            `[gpu-device-api] group ${p} 的 binding ${b.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case O.StorageTexture:
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
    [...r.values()].map((d) => d.samplerBinding).filter((d) => d !== null)
  );
  for (const [d, p] of t.entries())
    for (const m of p)
      if ((m.type === O.Sampler || m.type === O.ComparisonSampler) && !o.has(m.binding))
        throw new u(
          `[gpu-device-api] group ${d} 的 sampler binding ${m.binding}` + (m.name ? `（「${m.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  const c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Set();
  for (const d of n.values())
    Ge(c, d.group).push(d), d.dynamic && Ge(l, d.group).push(d), f.add(d.group);
  for (const d of r.values())
    Ge(h, d.group).push(d), f.add(d.group);
  for (const d of f)
    Ge(c, d), Ge(l, d), Ge(h, d);
  return {
    uniformBlocks: n,
    textures: r,
    uniformBlocksByGroup: c,
    dynamicBlocksByGroup: l,
    texturesByGroup: h,
    requiredGroups: [...f].sort((d, p) => d - p),
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function Ge(t, e) {
  let n = t.get(e);
  return n || (n = [], t.set(e, n)), n;
}
function Rd(t, e) {
  const n = t.name ?? "", r = e.find((i) => i.name === `${n}_sampler`);
  return r || e.find((i) => i.binding === t.binding + 1);
}
class Bd {
  plans = /* @__PURE__ */ new Map();
  limits;
  constructor(e) {
    this.limits = e;
  }
  /** 按布局内容取计划，未命中则构建。 */
  get(e) {
    const n = e.map(
      (s, a) => [...s].sort((o, c) => o.binding - c.binding).map((o) => `${a}:${o.binding}:${o.type}:${o.name ?? ""}:${o.buffer?.hasDynamicOffset ? "dyn" : ""}`).join(",")
    ).join(";"), r = this.plans.get(n);
    if (r) return r;
    const i = Fd(e, this.limits);
    return this.plans.set(n, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
class Gd {
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
    const a = this.gl, o = this.compileShader(a.VERTEX_SHADER, n, `${e} / vertex`), c = this.compileShader(a.FRAGMENT_SHADER, r, `${e} / fragment`), l = a.createProgram();
    if (!l)
      throw a.deleteShader(o), a.deleteShader(c), new u("[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。");
    if (a.attachShader(l, o), a.attachShader(l, c), a.linkProgram(l), a.detachShader(l, o), a.detachShader(l, c), a.deleteShader(o), a.deleteShader(c), !a.getProgramParameter(l, a.LINK_STATUS)) {
      const p = a.getProgramInfoLog(l) ?? "(无日志)";
      throw a.deleteProgram(l), new u(
        `[gpu-device-api] program「${e}」链接失败。vertex 与 fragment 的 varying（in/out）名字、
类型与数量必须完全对应。
GL 日志：${p}`
      );
    }
    const f = lh(a, l), d = {
      program: l,
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
${Od(n)}`);
    }
    return s;
  }
  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  bindResources(e, n, r, i) {
    const s = this.gl, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), c = [], l = new Set(n.uniformBlocks.map((f) => f.name));
    if (r)
      for (const [f, d] of r.uniformBlocks) {
        if (!l.has(d.name)) {
          c.push(d.name);
          continue;
        }
        const p = s.getUniformBlockIndex(e, d.name);
        if (p === s.INVALID_INDEX) {
          c.push(d.name);
          continue;
        }
        s.uniformBlockBinding(e, p, d.blockBinding), a.set(f, d.blockBinding);
      }
    const h = n.uniforms.filter((f) => _s(f.glType));
    if (r)
      for (const [, f] of r.textures) {
        const d = h.find((p) => p.name === f.name)?.location ?? s.getUniformLocation(e, f.name);
        d && (s.uniform1i(d, f.unit), o.set(f.name, d));
      }
    if (r) {
      const f = new Set([...r.uniformBlocks.values()].map((g) => g.name)), d = n.uniformBlocks.map((g) => g.name).filter((g) => !f.has(g));
      if (d.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 uniform block：${d.join("、")}。
布局里声明的块名：${[...f].join("、") || "(空)"}。
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
          `[gpu-device-api] program「${i}」使用了 uniform block（${n.uniformBlocks.map((f) => f.name).join("、")}），但管线没有声明任何 bind group layout。`
        );
      if (h.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 sampler（${h.map((f) => `${f.name}: ${ah(f.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: c };
  }
}
function Od(t) {
  const e = t.split(`
`), n = String(e.length).length;
  return e.map((r, i) => `${String(i + 1).padStart(n, " ")} | ${r}`).join(`
`);
}
function Ud(t, e) {
  const n = t.depthStencil, r = n !== void 0 && n.format !== null, i = r && e.depth, s = t.render?.blend, a = t.fragment?.targets, c = a?.find((d) => d?.blend)?.blend ?? s;
  let l = null;
  c && (l = {
    colorSrc: wt(c.color.srcFactor, "color.srcFactor"),
    colorDst: wt(c.color.dstFactor, "color.dstFactor"),
    colorOp: c.color.operation ? bt[c.color.operation] : bt.add,
    alphaSrc: wt(c.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: wt(c.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: c.alpha.operation ? bt[c.alpha.operation] : bt.add
  });
  const h = a?.[0]?.writeMask ?? t.render?.writeMask ?? oe.All, f = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    depthWrite: n?.depthWriteEnabled ?? !0,
    depthCompare: Ps[n?.depthCompare ?? "less"],
    depthBias: [n?.depthBiasSlopeScale ?? 0, n?.depthBias ?? 0, n?.depthBiasClamp ?? 0],
    stencilEnabled: r && e.stencil,
    blend: l,
    writeMask: [
      (h & oe.Red) !== 0,
      (h & oe.Green) !== 0,
      (h & oe.Blue) !== 0,
      (h & oe.Alpha) !== 0
    ],
    cullEnabled: f !== "none",
    cullFace: f === "none" ? br.back : br[f],
    frontFace: bd[t.primitive?.frontFace ?? "ccw"]
  };
}
function Dd(t, e, n = 0) {
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
function wt(t, e) {
  const n = gd[t];
  if (n === void 0)
    throw new u(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return n;
}
class Id {
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
    this.label = e.label ?? B("renderPipeline"), this.descriptor = e, this.layout = r, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.program = n, this.plan = r === "auto" ? null : r.bindingPlan ?? null, this.topologyMode = md[e.primitive?.topology ?? "triangle-list"];
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
    const n = e.depthFormat ?? null, r = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${n ?? "none"}|${r}|${Si(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const h of i) xi(h, this.limits);
    const o = new Set(i.flatMap((h) => h.attributes.map((f) => f.shaderLocation))), c = new Set(this.program.reflection.attributes.map((h) => h.location));
    for (const h of c)
      if (!o.has(h))
        throw new u(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${h}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const l = {
      key: s,
      renderState: Ud(this.descriptor, {
        depth: n !== null,
        stencil: n === "depth24plus-stencil8"
      }),
      depthFormat: n,
      sampleCount: r,
      vertexLayouts: i,
      vertexArrays: /* @__PURE__ */ new Map(),
      vertexArrayLookup: null
    };
    return this.variantCache.set(s, l), l;
  }
  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(e = {}) {
    return this.resolveVariant(e).renderState;
  }
  /** 把该管线的固定功能状态写入 GL 状态缓存。 */
  applyState(e, n = 0) {
    this.state.useProgram(this.program.program), Dd(this.state, e.renderState, n);
  }
  /**
   * 取得（必要时创建）一个顶点数组对象。
   *
   * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
   * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
   *
   * `bindingRevision` 由调用方（渲染通道）维护：同一个版本号必须对应同一份顶点/索引绑定内容。
   * 传 0 表示调用方不提供版本号，此时只走下面按内容构建的缓存键。
   */
  acquireVertexArray(e, n, r, i = 0) {
    const s = e.vertexLayouts;
    if (s.length === 0) return null;
    const a = e.vertexArrayLookup;
    if (i > 0 && a !== null && a.revision === i)
      return a.vertexArray;
    const o = Vd(s, n, r), c = e.vertexArrays.get(o);
    if (c)
      return i > 0 && (e.vertexArrayLookup = { revision: i, vertexArray: c }), c;
    const l = this.gl, h = l.createVertexArray();
    if (!h)
      throw new u("[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。");
    this.state.bindVertexArray(h);
    for (let f = 0; f < s.length; f++) {
      const d = s[f], p = n[f];
      if (!d || !p) continue;
      l.bindBuffer(l.ARRAY_BUFFER, p.buffer.native);
      const m = d.stepMode === "instance" ? 1 : 0;
      for (const g of d.attributes) {
        const b = Ad(g.format), w = p.offset + g.offset;
        l.enableVertexAttribArray(g.shaderLocation), b.integer ? l.vertexAttribIPointer(g.shaderLocation, b.size, b.type, d.arrayStride, w) : l.vertexAttribPointer(
          g.shaderLocation,
          b.size,
          b.type,
          b.normalized,
          d.arrayStride,
          w
        ), l.vertexAttribDivisor(g.shaderLocation, m);
      }
    }
    return r && l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, r), this.state.invalidateBufferBindings(), e.vertexArrays.set(o, h), i > 0 && (e.vertexArrayLookup = { revision: i, vertexArray: h }), h;
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
        e.vertexArrays.clear(), e.vertexArrayLookup = null;
      }
      this.variantCache.clear();
    }
  }
}
function Vd(t, e, n) {
  const r = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      r.push(`${i}:-`);
      continue;
    }
    Te(s.offset, "setVertexBuffer 的 offset"), r.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return r.push(`idx:${n ? kd(n) : "-"}`), r.join("|");
}
const _r = /* @__PURE__ */ new WeakMap();
let Nd = 1;
function kd(t) {
  let e = _r.get(t);
  return e === void 0 && (e = Nd++, _r.set(t, e)), e;
}
class zd {
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
function Wd(t, e, n) {
  throw new u(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${n}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function Er(t) {
  return t instanceof Es ? t : Wd("texture view", t, "WebGL2TextureView");
}
class qd {
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
    this.gl = n.gl, this.state = n.state, this.options = n, this.label = e.label ?? B("renderTarget"), this._width = r, this._height = i, this.mipLevelCount = e.mipLevelCount ?? 1;
    const s = jd(e.color);
    if (s.length > 4)
      throw new u(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${s.length} 个。`
      );
    for (const c of s)
      if (!z(c).attachment)
        throw new u(
          `[gpu-device-api] 纹理格式「${c}」在 WebGL2 下不能作为颜色附件。`
        );
    this.colorFormats = s;
    const a = Qd(e.depth);
    if (a !== null && !z(a).depth)
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
   *
   * 完整性（`checkFramebufferStatus`）不在这里查：附件只在构造与 resize() 时变，
   * 所以 {@link attach} 里已经查过了。原来每个渲染通道都做一次同步查询是白付的。
   */
  bind(e = {}) {
    const n = this.gl;
    if (n.bindFramebuffer(n.FRAMEBUFFER, this.framebuffer), e.loadOp !== "load" || this.depthTexture !== null && e.depthLoadOp !== "load") {
      if (this.state.setScissor(!1, 0, 0, this._width, this._height), e.loadOp !== "load") {
        const [i, s, a, o] = Pt(e.clearColor), c = new Float32Array([i, s, a, o]);
        for (let l = 0; l < this.colorTextures.length; l++)
          n.clearBufferfv(n.COLOR, l, c);
      }
      if (this.depthTexture && e.depthLoadOp !== "load") {
        const i = z(this.depthFormat);
        n.depthMask(!0), i.stencil ? n.clearBufferfi(n.DEPTH_STENCIL, 0, e.clearDepth ?? 1, e.clearStencil ?? 0) : n.clearBufferfv(n.DEPTH, 0, new Float32Array([e.clearDepth ?? 1])), this.state.invalidate();
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
    const n = v.RenderAttachment | v.TextureBinding | v.CopySrc | e;
    this.colorTextures = this.colorFormats.map(
      (r, i) => this.options.createTexture(r, this._width, this._height, n, `${this.label}:color${i}`)
    ), this.depthTexture = this.depthFormat === null ? null : this.options.createTexture(
      this.depthFormat,
      this._width,
      this._height,
      v.RenderAttachment | v.TextureBinding,
      `${this.label}:depth`
    ), this.colorViews = this.colorTextures.map((r) => Er(r.createView())), this.depthView = this.depthTexture ? Er(this.depthTexture.createView()) : null;
  }
  attach() {
    const e = this.gl, n = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.framebuffer), this.colorTextures.forEach((i, s) => {
      const a = e.COLOR_ATTACHMENT0 + s;
      i.dimension === "3d" || i.depthOrArrayLayers > 1 ? e.framebufferTextureLayer(e.FRAMEBUFFER, a, i.native, 0, 0) : e.framebufferTexture2D(e.FRAMEBUFFER, a, e.TEXTURE_2D, i.native, 0);
    }), e.drawBuffers(this.colorTextures.map((i, s) => e.COLOR_ATTACHMENT0 + s)), this.depthTexture) {
      const s = z(this.depthFormat).stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
      e.framebufferTexture2D(e.FRAMEBUFFER, s, e.TEXTURE_2D, this.depthTexture.native, 0);
    } else
      e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, null, 0), e.framebufferTexture2D(e.FRAMEBUFFER, e.STENCIL_ATTACHMENT, e.TEXTURE_2D, null, 0);
    const r = e.checkFramebufferStatus(e.FRAMEBUFFER);
    if (e.bindFramebuffer(e.FRAMEBUFFER, n), this.state.invalidate(), r !== e.FRAMEBUFFER_COMPLETE)
      throw new u(
        `[gpu-device-api] 渲染目标「${this.label}」的 framebuffer 不完整（格式组合在 WebGL2 下不受支持）。颜色附件：${this.colorFormats.join("、")}；深度附件：${this.depthFormat ?? "无"}。GL 状态码：0x${r.toString(16)}。`
      );
  }
}
function jd(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new u("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function Qd(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
const Pr = /* @__PURE__ */ new WeakMap();
function Jn(t) {
  let e = Pr.get(t);
  return e === void 0 && (e = t.getExtension("EXT_debug_marker") ?? null, Pr.set(t, e)), e;
}
function Ms(t, e) {
  Jn(t)?.pushGroupMarkerEXT?.(e);
}
function Fs(t) {
  Jn(t)?.popGroupMarkerEXT?.();
}
function Rs(t, e) {
  Jn(t)?.insertEventMarkerEXT?.(e);
}
function Lr(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class Cr {
  label;
  dimension = At.D2;
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
class Xd {
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
  /** 默认帧缓冲的采样数；`SAMPLES` 是 context 创建时定下的常量，查一次即可（见 sampleCount()）。 */
  samples = null;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this._format = e.format ?? "rgba8unorm";
    const n = _i(), r = He(e.canvas);
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
    if (e.format !== void 0 && !dd(e.format))
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
    const n = He(this.canvas);
    this._width = Math.max(1, Math.floor(n.width * e)), this._height = Math.max(1, Math.floor(n.height * e)), this.applyBackingSize();
  }
  resize() {
    const e = He(this.canvas), n = Math.max(1, Math.floor(e.width * this._pixelRatio)), r = Math.max(1, Math.floor(e.height * this._pixelRatio));
    return n === this._width && r === this._height ? !1 : (this._width = n, this._height = r, this.applyBackingSize(), !0);
  }
  getCurrentFrameTarget() {
    if (!this._device)
      throw new u(
        "[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。"
      );
    const e = this.sampleCount(), n = new Cr(
      this._width,
      this._height,
      this._format,
      e,
      v.RenderAttachment
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
    const n = new Cr(
      this._width,
      this._height,
      Ai,
      1,
      v.RenderAttachment,
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
  /**
   * 默认帧缓冲的采样数。
   *
   * `gl.getParameter(SAMPLES)` 是一次同步查询（要等 GL 命令队列），而它由创建 context 时的
   * `antialias` 决定、在 context 生命周期内不会变，所以这里只查一次并记住。
   */
  sampleCount() {
    return this.samples === null && (this.samples = Number(this.gl.getParameter(this.gl.SAMPLES) ?? 1) || 1), this.samples;
  }
  applyBackingSize() {
    this.canvas.width = this._width, this.canvas.height = this._height, this._device?.invalidateState();
  }
}
const Yd = [];
let yt = 1;
class Hd {
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
  /**
   * 本通道正在计时的时间查询（`beginQuery` 已在构造时下发，`end()` 时收尾）。
   *
   * GL 的时间查询是**区间**测量：`beginQuery(TIME_ELAPSED_EXT, q)` → `endQuery` 之间的 GPU
   * 时间会写进 q。所以它包住的是「通道开始清屏/绑定 framebuffer 之后到 end() 之前」这段，
   * 对单通道帧来说就是整个渲染阶段。
   */
  pendingTimerQueries = null;
  /** 是否有正在进行的遮挡查询（GL 要求 beginQuery/endQuery 严格配对）。 */
  occlusionQueryOpen = !1;
  /** 本通道声明了 occlusionQuerySet 时的 query set（决定 beginOcclusionQuery 是否可用）。 */
  occlusionQuerySet = null;
  /**
   * 变体请求对象：通道的颜色/深度格式在构造时就定了，生命周期内不会变，
   * 所以只分配一次（原来每次解析变体都要新建一个对象）。
   */
  variantShape;
  /** 变体解析结果的缓存：只跟当前管线对象走（见 {@link resolvedVariant}）。 */
  variantPipeline = null;
  variantValue = null;
  /** 当前顶点/索引绑定内容的版本号（见模块级 nextBindingRevision）。 */
  bindingRevision = yt++;
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
      if (this.colorFormats = i.map((a) => a.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null, i.some((a) => Lr(a.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && Lr(e.depthStencilAttachment.view))
        this.beginDefaultFramebufferPass(e);
      else {
        const a = n.framebuffers.acquire(e);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, a), this.state.invalidate();
        const o = i[0], c = o.view.texture.width, l = o.view.texture.height;
        this.clearRawAttachments(e, a), this.gl.viewport(0, 0, c, l), this.state.setViewport(0, 0, c, l);
      }
    }
    this.variantShape = { colorFormats: this.colorFormats, sampleCount: 1, depthFormat: this.depthFormat }, this.beginQuerySetup(e);
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.pipeline = e, e.applyState(this.resolvedVariant(e), this.stencilReference);
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), e < 0 || e >= 4)
      throw new u(
        `[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${e}。`
      );
    const i = this.pipeline;
    if (i && i.layout !== "auto" && n) {
      const s = i.layout.bindGroupLayouts[e];
      if (s && s !== n.layout && !(s.sortedEntries.length === n.layout.sortedEntries.length && s.sortedEntries.every((o, c) => {
        const l = n.layout.sortedEntries[c];
        return o.binding === l.binding && o.type === l.type && o.name === l.name;
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
    const s = this.vertexBuffers[e];
    if (n === null) {
      if (!s) return;
      this.vertexBuffers[e] = null, this.bindingRevision = yt++;
      return;
    }
    if (s && s.buffer === n && s.offset === r && s.size === i) return;
    const a = s ?? { buffer: n, offset: r, size: i };
    a.buffer = n, a.offset = r, a.size = i, this.vertexBuffers[e] = a, this.bindingRevision = yt++;
  }
  setIndexBuffer(e, n, r = 0, i = -1) {
    if (this.assertOpen("setIndexBuffer"), !e.isIndexBuffer)
      throw new u(
        `[gpu-device-api] buffer「${e.label}」的 usage 里没有 \`BufferUsage.Index\`，而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 \`BufferUsage.Index\`。`
      );
    const s = this.indexBuffer;
    s && s.buffer === e && s.format === n && s.offset === r && s.size === i || (s ? (s.buffer = e, s.format = n, s.offset = r, s.size = i) : this.indexBuffer = { buffer: e, format: n, offset: r, size: i }, this.bindingRevision = yt++);
  }
  setViewport(e, n, r, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), (s !== 0 || a !== 1) && this.gl.depthRange(s, a), this.state.setViewport(e, n, r, i);
  }
  setScissorRect(e, n, r, i) {
    this.assertOpen("setScissorRect"), this.state.setScissor(!0, e, n, r, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(Pt(e));
  }
  setStencilReference(e) {
    this.assertOpen("setStencilReference"), this.stencilReference = e, this.pipeline && this.pipeline.applyState(this.resolvedVariant(this.pipeline), e);
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
    const i = e.instanceCount ?? 1, s = r.offset + (e.firstIndex ?? 0) * _a(r.format);
    this.beginDraw(n, r), this.gl.drawElementsInstanced(
      n.mode,
      e.indexCount,
      wd[r.format],
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
   * 开始一条遮挡查询（对应 `gl.beginQuery(ANY_SAMPLES_PASSED, query)`）。
   *
   * `ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，不需要扩展；计数器记录的是「有多少个采样通过了
   * 深度/模板测试」（≥1 即表示「有东西可见」）。结果由 `Device.readQuerySet()` 读回。
   */
  beginOcclusionQuery(e) {
    this.assertOpen("beginOcclusionQuery");
    const n = this.occlusionQuerySet;
    if (!n)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: the pass was created without RenderPassDescriptor.occlusionQuerySet, so there is nowhere to store the sample count.`
      );
    if (this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: an occlusion query is already open; call endOcclusionQuery() first (GL allows only one active query per target).`
      );
    this.gl.beginQuery(Pn, n.queryAt(e, `${this.label}.beginOcclusionQuery`)), this.occlusionQueryOpen = !0;
  }
  /** 结束最近一次 {@link beginOcclusionQuery}。 */
  endOcclusionQuery() {
    if (this.assertOpen("endOcclusionQuery"), !this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".endOcclusionQuery: no occlusion query is open.`
      );
    this.gl.endQuery(Pn), this.occlusionQueryOpen = !1;
  }
  /**
   * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
   * （只影响抓帧工具的分组显示，不影响渲染结果）。
   */
  pushDebugGroup(e) {
    Ms(this.gl, e);
  }
  popDebugGroup() {
    Fs(this.gl);
  }
  insertDebugMarker(e) {
    Rs(this.gl, e);
  }
  end() {
    if (!this._ended) {
      if (this.occlusionQueryOpen)
        throw new u(
          `[gpu-device-api] RenderPass "${this.label}".end: an occlusion query is still open; call endOcclusionQuery() before ending the pass.`
        );
      this.endTimerQuery(), this._ended = !0, this.state.invalidate();
    }
  }
  /* ------------------------------------------------------------------ 内部 ------------------- */
  /**
   * 处理 `RenderPassDescriptor.timestampWrites` 与 `occlusionQuerySet`。
   *
   * **WebGL2 的 timestamp 语义与 WebGPU 不同**（这一点必须看清）：
   * GL 的 `TIME_ELAPSED_EXT` 测量的是 `beginQuery` → `endQuery` 之间的**区间耗时**，
   * 而 WebGPU 写的是「通道开始的时刻」与「通道结束的时刻」两个独立时间戳。
   * 所以这里把区间耗时写进 `beginningOfPassWriteIndex`（只给了 end 时用 end 那个下标），
   * 另一个下标保持 0；读回后的解释也相应不同（见 gfx 的 `GpuTiming`）。
   */
  beginQuerySetup(e) {
    e.occlusionQuerySet && (this.occlusionQuerySet = Ln(
      e.occlusionQuerySet,
      `${this.label}.occlusionQuerySet`
    ));
    const n = e.timestampWrites;
    if (!n) return;
    const r = `${this.label}.timestampWrites`;
    yi(n, r);
    const i = Ln(n.querySet, `${r}.querySet`), s = n.beginningOfPassWriteIndex ?? n.endOfPassWriteIndex;
    if (s === void 0)
      throw new u(`[gpu-device-api] ${r}: no write index was given.`);
    const a = i.queryAt(s, r);
    this.gl.beginQuery(i.target, a), this.pendingTimerQueries = { target: i.target, query: a };
  }
  /** 收尾时间查询；没有正在进行的查询时是空操作。 */
  endTimerQuery() {
    const e = this.pendingTimerQueries;
    e && (this.pendingTimerQueries = null, this.gl.endQuery(e.target));
  }
  /**
   * 取当前通道形态下已解析好的管线变体。
   *
   * 附件形态（颜色/深度格式、采样数）在通道生命周期内固定，变体只跟管线对象走，
   * 所以按管线记住解析结果就够了 —— 原先 `setPipeline` 与每个 `beginDraw` 都会重新解析一次，
   * 每次解析都要拼一遍含全部顶点布局的 O(属性数) 键字符串。
   * 管线被 dispose() 后变体缓存已被清空，这里重新解析以保持与原来一致的行为。
   */
  resolvedVariant(e) {
    return (this.variantPipeline !== e || e.disposed) && (this.variantValue = e.resolveVariant(this.variantShape), this.variantPipeline = e), this.variantValue;
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
    const r = this.resolvedVariant(e);
    e.applyState(r, this.stencilReference);
    const i = e.acquireVertexArray(
      r,
      this.vertexBuffers,
      n ? n.buffer.native : null,
      this.bindingRevision
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
          const o = n.dynamicBlocksByGroup.get(r) ?? Yd, c = o.length > 0 ? this.dynamicOffsets.get(r) : void 0;
          if (o.length > 0 && (c === void 0 || c.length < o.length))
            throw new u(
              `[gpu-device-api] setBindGroup(${r}, ...) 缺少动态偏移：布局里有 ${o.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${c?.length ?? 0} 个偏移值。`
            );
          let l = 0;
          for (const h of s) {
            const f = i.entry(h.binding);
            if (!f)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${h.binding}（布局要求提供 uniform buffer）。`
              );
            const d = f.resource, p = d.buffer, m = d.offset ?? 0;
            if (h.dynamic) {
              const g = this.state.uniformBufferOffsetAlignment(), b = c[l++] ?? 0;
              if (g > 0 && b % g !== 0)
                throw new u(
                  `[gpu-device-api] 动态偏移 ${b} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${g}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
                );
              const w = m + b, S = d.size ?? p.size - w;
              this.state.bindUniformBuffer(h.blockBinding, p.native, w, S);
            } else
              this.state.bindUniformBuffer(h.blockBinding, p.native, 0, -1);
          }
        }
        const a = n.texturesByGroup.get(r);
        if (a)
          for (const o of a) {
            const c = i.entry(o.binding);
            if (!c)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${o.binding}（布局要求提供纹理「${o.name}」）。`
              );
            const l = c.resource.view;
            if (this.assertViewRangeSupported(l), this.state.bindTexture(o.unit, l.target, l.glTexture), o.samplerBinding !== null) {
              const h = i.entry(o.samplerBinding);
              if (!h)
                throw new u(
                  `[gpu-device-api] bind group「${i.label}」缺少 binding ${o.samplerBinding}（纹理「${o.name}」配套的 sampler「${o.samplerName ?? "未命名"}」）。`
                );
              const f = h.resource.sampler;
              this.state.bindSampler(o.unit, f.native);
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
      const [c, l, h, f] = Pt(a.clearValue);
      r.clearBufferfv(r.COLOR, o, new Float32Array([c, l, h, f]));
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
      const [o, c, l, h] = Pt(s.clearValue);
      n.clearColor(o, c, l, h), n.clear(n.COLOR_BUFFER_BIT);
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
const de = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class Zd {
  label = "computePass";
  constructor(e) {
    throw new u(de);
  }
  get ended() {
    return !0;
  }
  setPipeline(e) {
    throw new u(de);
  }
  setBindGroup(e, n, r) {
    throw new u(de);
  }
  dispatchWorkgroups(e, n, r) {
    throw new u(de);
  }
  dispatchWorkgroupsIndirect(e, n) {
    throw new u(de);
  }
  pushDebugGroup(e) {
    throw new u(de);
  }
  popDebugGroup() {
    throw new u(de);
  }
  insertDebugMarker(e) {
    throw new u(de);
  }
  end() {
  }
}
class Kd {
  label;
  gl;
  state;
  passOptions;
  openPass = null;
  drawCalls = 0;
  passCount = 0;
  finished = !1;
  constructor(e, n, r, i) {
    this.label = e?.label ?? B("commandEncoder"), this.gl = n, this.state = r, this.passOptions = i;
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
    const n = new Hd(e, this.passOptions);
    return this.openPass = n, this.passCount += 1, n;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), new Zd();
  }
  copyBufferToBuffer(e, n, r, i, s) {
    this.assertOpen("copyBufferToBuffer");
    const a = e, o = r, c = new Uint8Array(s);
    if (a.isIndexBuffer || o.isIndexBuffer) {
      a.download(n, c), o.upload(i, c);
      return;
    }
    this.state.bindCopyReadBuffer(a.native), this.gl.getBufferSubData(this.gl.COPY_READ_BUFFER, n, c), this.state.bindCopyWriteBuffer(o.native), this.gl.bufferSubData(this.gl.COPY_WRITE_BUFFER, i, c);
  }
  copyBufferToTexture(e, n, r) {
    this.assertOpen("copyBufferToTexture");
    const i = this.gl, s = e.buffer, a = n.texture.native, o = n.texture.format, c = z(o), { x: l, y: h, z: f } = vt(n.origin), d = e.bytesPerRow ?? r.width * c.bytesPerPixel, p = r.height, m = new Uint8Array(d * p);
    s.download(e.offset ?? 0, m), i.bindTexture(n.texture.target, a), i.pixelStorei(i.UNPACK_ALIGNMENT, 1), d !== r.width * c.bytesPerPixel && i.pixelStorei(i.UNPACK_ROW_LENGTH, d / c.bytesPerPixel);
    const g = n.texture.target;
    g === i.TEXTURE_3D || g === i.TEXTURE_2D_ARRAY ? i.texSubImage3D(
      g,
      n.mipLevel ?? 0,
      l,
      h,
      f,
      r.width,
      r.height,
      r.depthOrArrayLayers,
      c.format,
      c.type,
      m
    ) : i.texSubImage2D(
      g,
      n.mipLevel ?? 0,
      l,
      h,
      r.width,
      r.height,
      c.format,
      c.type,
      m
    ), i.pixelStorei(i.UNPACK_ROW_LENGTH, 0), i.pixelStorei(i.UNPACK_ALIGNMENT, 4), this.state.invalidateTextureUnits();
  }
  copyTextureToBuffer(e, n, r) {
    this.assertOpen("copyTextureToBuffer");
    const i = this.gl, s = e.texture, a = z(s.format), o = Ei(
      n.bytesPerRow ?? r.width * a.bytesPerPixel,
      4
    ), c = new Uint8Array(o * r.height), l = i.createFramebuffer();
    if (!l)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法读回纹理。");
    const h = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, l);
    const f = a.depth ? i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0;
    i.framebufferTexture2D(i.FRAMEBUFFER, f, i.TEXTURE_2D, s.native, e.mipLevel ?? 0);
    const d = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (d !== i.FRAMEBUFFER_COMPLETE)
      throw i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(l), new u(
        `[gpu-device-api] 无法把纹理「${s.label}」作为附件读回（framebuffer 不完整，0x${d.toString(16)}）。请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。`
      );
    i.pixelStorei(i.PACK_ALIGNMENT, 1);
    const { x: p, y: m } = vt(e.origin);
    i.readPixels(p, m, r.width, r.height, a.format, a.type, c), i.pixelStorei(i.PACK_ALIGNMENT, 4), i.bindFramebuffer(i.FRAMEBUFFER, h), i.deleteFramebuffer(l), this.state.invalidate(), n.buffer.upload(n.offset ?? 0, c);
  }
  copyTextureToTexture(e, n, r) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = n.texture, o = z(a.format), { x: c, y: l } = vt(e.origin), { x: h, y: f } = vt(n.origin), d = i.createFramebuffer(), p = i.createFramebuffer();
    if (!d || !p)
      throw new u("[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。");
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
      n.mipLevel ?? 0
    ), z(s.format).internalFormat !== o.internalFormat)
      throw new u(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${s.format}」，目标是「${a.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`
      );
    i.blitFramebuffer(
      c,
      l,
      c + r.width,
      l + r.height,
      h,
      f,
      h + r.width,
      f + r.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, m), i.deleteFramebuffer(d), i.deleteFramebuffer(p), this.state.invalidate();
  }
  clearBuffer(e, n = 0, r) {
    this.assertOpen("clearBuffer");
    const i = e, s = r ?? e.size - n, a = new Uint8Array(s);
    i.upload(n, a);
  }
  /**
   * WebGL2 没有对应能力：GL 的查询结果不能写进 buffer，只能 `getQueryParameter()` 读回。
   * 调用它明确报错，并指出替代方案（`Device.readQuerySet()`）。
   */
  resolveQuerySet(e, n, r, i, s) {
    throw this.assertOpen("resolveQuerySet"), new u(
      "[gpu-device-api] WebGL2 has no resolveQuerySet(): GL query results cannot be copied into a buffer, they can only be read back one by one with gl.getQueryParameter(). Use Device.readQuerySet() instead — it polls QUERY_RESULT_AVAILABLE and returns the same QueryResult shape as WebGPU."
    );
  }
  /**
   * WebGL2 没有「单个时刻的时间戳」：GL 的时间查询是 `beginQuery → endQuery` 的**区间**测量。
   * 请改用 `RenderPassDescriptor.timestampWrites`（后端会用 beginQuery/endQuery 包住整个通道）。
   */
  writeTimestamp(e, n) {
    throw this.assertOpen("writeTimestamp"), new u(
      "[gpu-device-api] WebGL2 has no CommandEncoder.writeTimestamp(): GL timer queries measure an interval (beginQuery → endQuery), not a single instant. Use RenderPassDescriptor.timestampWrites with an EXT_disjoint_timer_query_webgl2 query set instead."
    );
  }
  /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
  pushDebugGroup(e) {
    Ms(this.gl, e);
  }
  popDebugGroup() {
    Fs(this.gl);
  }
  insertDebugMarker(e) {
    Rs(this.gl, e);
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
function vt(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function Jd(t) {
  const e = t.colorAttachments.map((r) => r ? Mr(r) : "-").join(","), n = t.depthStencilAttachment ? Mr(t.depthStencilAttachment) : "-";
  return `${e}|${n}`;
}
function Mr(t) {
  const e = t.view, n = e.texture;
  return `${e.label}@${n.label}#${n.width}x${n.height}`;
}
class ef {
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
    const n = Jd(e), r = this.framebuffers.get(n);
    if (r) return r;
    const i = this.gl, s = i.createFramebuffer();
    if (!s)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。");
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
    const c = e.depthStencilAttachment;
    if (c) {
      const h = c.view, d = z(h.texture.format).stencil ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
      i.framebufferTexture2D(i.FRAMEBUFFER, d, i.TEXTURE_2D, h.glTexture, 0);
    }
    i.bindFramebuffer(i.FRAMEBUFFER, a), i.bindFramebuffer(i.FRAMEBUFFER, s);
    const l = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (i.bindFramebuffer(i.FRAMEBUFFER, a), l !== i.FRAMEBUFFER_COMPLETE)
      throw i.deleteFramebuffer(s), new u(
        `[gpu-device-api] 这组渲染附件在 WebGL2 下不构成完整的 framebuffer（GL 状态码 0x${l.toString(16)}）。
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
class tf {
  label = B("queue");
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
    const c = new Uint8Array(r.buffer, r.byteOffset + i, o);
    a.upload(n, Na(c));
  }
  writeTexture(e, n, r, i) {
    const s = e.texture, a = z(s.format);
    fd(s.format, n);
    const o = Fr(e.origin), c = r.bytesPerRow ?? i.width * a.bytesPerPixel, l = this.gl;
    l.bindTexture(s.target, s.native), l.pixelStorei(l.UNPACK_ALIGNMENT, 1), c !== i.width * a.bytesPerPixel && l.pixelStorei(l.UNPACK_ROW_LENGTH, c / a.bytesPerPixel);
    const h = new Uint8Array(n.buffer, n.byteOffset + r.offset, n.byteLength - r.offset);
    s.target === l.TEXTURE_3D || s.target === l.TEXTURE_2D_ARRAY ? l.texSubImage3D(
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
    ) : l.texSubImage2D(
      s.target,
      e.mipLevel ?? 0,
      o.x,
      o.y,
      i.width,
      i.height,
      a.format,
      a.type,
      h
    ), l.pixelStorei(l.UNPACK_ROW_LENGTH, 0), l.pixelStorei(l.UNPACK_ALIGNMENT, 4), this.state.invalidateTextureUnits();
  }
  copyExternalImageToTexture(e, n, r, i = !1) {
    const s = n.texture, a = z(s.format), o = this.gl, c = Fr(n.origin);
    o.bindTexture(s.target, s.native), o.pixelStorei(o.UNPACK_ALIGNMENT, 1), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, i ? 1 : 0);
    try {
      s.target === o.TEXTURE_3D || s.target === o.TEXTURE_2D_ARRAY ? o.texSubImage3D(
        s.target,
        n.mipLevel ?? 0,
        c.x,
        c.y,
        c.z,
        r.width,
        r.height,
        r.depthOrArrayLayers,
        a.format,
        a.type,
        e
      ) : o.texSubImage2D(
        s.target,
        n.mipLevel ?? 0,
        c.x,
        c.y,
        r.width,
        r.height,
        a.format,
        a.type,
        e
      );
    } finally {
      o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, 0), o.pixelStorei(o.UNPACK_ALIGNMENT, 4);
    }
    this.state.invalidateTextureUnits();
  }
  copyBufferToBuffer(e, n, r, i, s) {
    const a = this.gl, o = e, c = r, l = new Uint8Array(s);
    if (o.isIndexBuffer || c.isIndexBuffer) {
      o.download(n, l), c.upload(i, l);
      return;
    }
    this.state.bindCopyReadBuffer(o.native), a.getBufferSubData(a.COPY_READ_BUFFER, n, l), this.state.bindCopyWriteBuffer(c.native), a.bufferSubData(a.COPY_WRITE_BUFFER, i, l);
  }
  copyBufferToTexture(e, n, r) {
    const i = z(n.texture.format), s = e.bytesPerRow ?? r.width * i.bytesPerPixel, a = new Uint8Array(s * r.height);
    e.buffer.download(e.offset ?? 0, a), this.writeTexture(n, a, { offset: 0, bytesPerRow: s }, r);
  }
  submit(e) {
    this.submittedCount += e.length, e.length > 0 && this.gl.flush();
  }
  async onSubmittedWorkDone() {
    await this.pending, this.gl.finish();
  }
}
function Fr(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
class nf {
  label = B("fence");
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
        await rf();
      }
    }
  }
}
function rf() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
const sf = 1e4;
class af {
  type;
  count;
  /** GL 的 `TIME_ELAPSED_EXT` 就是纳秒，因此恒为 1。 */
  timestampPeriod = 1;
  gl;
  querySet;
  first;
  timeoutMs;
  yieldToEventLoop;
  _read = !1;
  constructor(e) {
    this.gl = e.gl, this.querySet = e.querySet, this.type = e.type, this.first = e.first, this.count = e.count, this.timeoutMs = e.timeoutMs ?? sf, this.yieldToEventLoop = e.yieldToEventLoop ?? (() => new Promise((n) => setTimeout(n, 0)));
  }
  async read() {
    if (this._read)
      throw new u(
        "[gpu-device-api] QueryResult.read(): this result has already been read. Call Device.readQuerySet() again for a fresh result."
      );
    this._read = !0;
    const e = this.gl;
    if (this.querySet.disposed)
      throw new u(
        `[gpu-device-api] QueryResult.read(): query set "${this.querySet.label}" has been destroyed.`
      );
    const n = new BigUint64Array(this.count);
    for (let r = 0; r < this.count; r++) {
      const i = this.querySet.queryAt(this.first + r, "QueryResult.read");
      await this.waitUntilAvailable(i, this.first + r), this.assertNotDisjoint(this.first + r);
      const s = e.getQueryParameter(i, e.QUERY_RESULT);
      n[r] = BigInt(Math.round(s ?? 0));
    }
    return n;
  }
  /** 轮询 `QUERY_RESULT_AVAILABLE`，每次询问之间让出一拍。 */
  async waitUntilAvailable(e, n) {
    const r = this.gl, i = Date.now() + this.timeoutMs;
    for (; ; ) {
      if (r.getQueryParameter(e, r.QUERY_RESULT_AVAILABLE) === !0) return;
      if (this.querySet.disposed)
        throw new K(
          `[gpu-device-api] QueryResult.read(): query set "${this.querySet.label}" was destroyed while waiting for query ${n}. The result of that frame is simply dropped.`,
          { code: "QUERY_DISCARDED" }
        );
      if (Date.now() >= i)
        throw new K(
          `[gpu-device-api] QueryResult.read(): query ${n} of "${this.querySet.label}" was still not available after ${this.timeoutMs} ms. The GL query is asynchronous; read it a few frames after the pass that wrote it (gfx GPU timing waits \`delay\` frames for exactly this reason).`,
          { code: "QUERY_TIMEOUT" }
        );
      await this.yieldToEventLoop();
    }
  }
  assertNotDisjoint(e) {
    const n = this.querySet.timerExtension;
    if (!n) return;
    if (this.gl.getParameter(n.GPU_DISJOINT_EXT) === !0)
      throw new K(
        `[gpu-device-api] QueryResult.read(): GPU_DISJOINT_EXT is set, so the timer results of "${this.querySet.label}" (query ${e}) are undefined. A disjoint happens when the GPU is reset or preempted between the begin/end of the query; discard this sample instead of using it.`,
        { code: "QUERY_DISJOINT" }
      );
  }
}
class of {
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
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? it("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? B("webgl2Device"), this.limits = $i(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const n = [...e.adapterFeatures], r = new Set(n), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !r.has(a));
    if (i.length > 0)
      throw new u(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${n.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => r.has(a),
      names: n
    }, this.state = new yh(e.gl), this.planCache = new Bd({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new Gd({ gl: e.gl, state: this.state }), this.framebuffers = new ef(e.gl), this.queue = new tf(e.gl, this.state), this.lostPromise = new Promise((a) => {
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
      new Sh(this.gl, this.state, e, (n) => {
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new gr(this.gl, this.state, e, () => {
        this.framebuffers.clear();
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, n, r, i, s) {
    return this.track(
      new gr(
        this.gl,
        this.state,
        { format: e, size: { width: n, height: r }, usage: i, label: s },
        () => this.framebuffers.clear()
      )
    );
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Pd(this.gl, this.state, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new Ld(e));
  }
  /**
   * 创建 query set。
   *
   * - occlusion：`ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，直接用；
   * - timestamp：需要 `EXT_disjoint_timer_query_webgl2`，扩展缺失时抛带 `[gpu-device-api] ` 前缀的
   *   英文错误说明缺哪个扩展（而不是静默返回 0）。
   */
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new Cs(this.gl, e, (n) => this.untrack(n)));
  }
  /**
   * 读回 query set 的结果：轮询 `QUERY_RESULT_AVAILABLE` 后逐条 `getQueryParameter`。
   *
   * 轮询本身是异步的（每轮让出一拍），不会像 `gl.finish()` 那样强制同步 GPU；
   * 但结果只有在 GPU 真正做完之后才可用，所以调用方应该**延迟若干帧**再读
   * （gfx 的 GPU 计时就是这么做的）。
   */
  readQuerySet(e, n = {}) {
    this.assertUsable("readQuerySet");
    const r = Ln(e, `Device "${this.label}".readQuerySet(querySet)`), i = n.firstQuery ?? 0;
    if (!Number.isInteger(i) || i < 0)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: firstQuery must be a non-negative integer, got ${String(i)}.`
      );
    const s = n.queryCount ?? r.count - i;
    if (!Number.isInteger(s) || s <= 0)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ${String(s)}.`
      );
    if (i + s > r.count)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: range [${i}, ${i + s}) exceeds the query set "${r.label}" count ${r.count}.`
      );
    return new af({
      gl: this.gl,
      querySet: r,
      type: r.type,
      first: i,
      count: s
    });
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new Tr(e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Md(e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(new $r(e, !1, this));
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const n = e.label ?? "renderPipeline", r = _n({
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
    const i = _n({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: q.Fragment,
      label: n,
      defines: e.fragment.module.defines,
      glsl: e.fragment.module.glsl
    }).code, s = this.programs.acquire(n, r, i);
    let a;
    if (e.layout === void 0 || e.layout === "auto") {
      const c = uh(s.reflection, q.Vertex | q.Fragment);
      if (c.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const l = new Tr({
          label: `${n}:autoLayout`,
          entries: c
        });
        this.track(l), a = this.track(
          new $r(
            { label: `${n}:autoPipelineLayout`, bindGroupLayouts: [l] },
            !0,
            this
          )
        ), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else
      a = e.layout, this.programs.bindPlan(s, a.bindingPlan);
    const o = new Id(e, s, a, {
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
    return this.assertUsable("createComputePipeline"), new zd(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    return this.assertUsable("createRenderTarget"), this.track(
      new qd(e, {
        gl: this.gl,
        state: this.state,
        createTexture: (n, r, i, s, a) => this.createAttachmentTexture(n, r, i, s, a)
      })
    );
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new Kd(e, this.gl, this.state, {
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
    return r || (r = new Xd({ gl: this.gl, canvas: e, format: n?.format }), this.canvasContexts.set(e, r)), r.configure({ ...n, device: this }), this.state.invalidate(), r;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new nf(this.gl);
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
      new K(`[gpu-device-api] GL 错误 0x${n.toString(16)}（发生在 ${e} 之后）。`, {
        code: "GL_ERROR",
        details: { glError: n, context: e }
      })
    );
  }
  track(e) {
    return this.resources.add(e), e;
  }
  /**
   * 资源在 `destroy()` 时把自己从追踪集合里摘掉（与 WebGPU 后端同一套机制）。
   *
   * 不做这一步，「每帧 create/destroy」的用法（query set、临时 buffer……）会让 `resources`
   * 一直强引用已经释放的包装对象与原生句柄，直到 `device.dispose()`。幂等。
   */
  untrack(e) {
    this.resources.delete(e);
  }
  assertUsable(e) {
    if (this._disposed)
      throw new xn(`[gpu-device-api] 设备已 dispose()，不能再调用 ${e}()。`, {
        reason: "destroyed"
      });
  }
}
const lf = {
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
  constructor(e, n, r, i, s) {
    this.gl = e, this.canvas = n, this.limits = r, this.features = i, this.logger = s;
    const a = gh(e);
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
    const n = { ...lf, ...e.contextAttributes }, r = wh(e.canvas, n), i = ph(r), s = mh(r);
    return new er(r, e.canvas, i, s, e.logger);
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
    const n = new of({
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
function y(t, e, n, r = {}) {
  const i = e === "depth" || e === "stencil" ? "depth" : e === "uint" ? "uint" : e === "sint" ? "sint" : "float";
  return {
    gpuFormat: tr[t],
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
const cf = Object.freeze({
  r8unorm: y("r8unorm", "unorm", 1, { renderable: !0, filterable: !0 }),
  r8snorm: y("r8snorm", "snorm", 1, { filterable: !1 }),
  r8uint: y("r8uint", "uint", 1, { renderable: !0 }),
  r8sint: y("r8sint", "sint", 1, { renderable: !0 }),
  r16uint: y("r16uint", "uint", 2, { renderable: !0 }),
  r16sint: y("r16sint", "sint", 2, { renderable: !0 }),
  r16float: y("r16float", "float", 2, { renderable: !0, filterable: !0 }),
  rg8unorm: y("rg8unorm", "unorm", 2, { renderable: !0, filterable: !0 }),
  rg8snorm: y("rg8snorm", "snorm", 2, {}),
  rg8uint: y("rg8uint", "uint", 2, { renderable: !0 }),
  rg8sint: y("rg8sint", "sint", 2, { renderable: !0 }),
  r32uint: y("r32uint", "uint", 4, { renderable: !0, storage: !0 }),
  r32sint: y("r32sint", "sint", 4, { renderable: !0, storage: !0 }),
  r32float: y("r32float", "float", 4, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rg16uint: y("rg16uint", "uint", 4, { renderable: !0 }),
  rg16sint: y("rg16sint", "sint", 4, { renderable: !0 }),
  rg16float: y("rg16float", "float", 4, { renderable: !0, filterable: !0 }),
  rgba8unorm: y("rgba8unorm", "unorm", 4, { renderable: !0, storage: !0, filterable: !0 }),
  "rgba8unorm-srgb": y("rgba8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgba8snorm: y("rgba8snorm", "snorm", 4, { storage: !0 }),
  rgba8uint: y("rgba8uint", "uint", 4, { renderable: !0, storage: !0 }),
  rgba8sint: y("rgba8sint", "sint", 4, { renderable: !0, storage: !0 }),
  bgra8unorm: y("bgra8unorm", "unorm", 4, {
    renderable: !0,
    filterable: !0,
    storageFeature: "bgra8unorm-storage"
  }),
  "bgra8unorm-srgb": y("bgra8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgb9e5ufloat: y("rgb9e5ufloat", "float", 4, {}),
  rgb10a2unorm: y("rgb10a2unorm", "unorm", 4, { renderable: !0, filterable: !0 }),
  rg11b10ufloat: y("rg11b10ufloat", "float", 4, { renderFeature: "rg11b10ufloat-renderable" }),
  rg32uint: y("rg32uint", "uint", 8, { renderable: !0, storage: !0 }),
  rg32sint: y("rg32sint", "sint", 8, { renderable: !0, storage: !0 }),
  rg32float: y("rg32float", "float", 8, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rgba16uint: y("rgba16uint", "uint", 8, { renderable: !0, storage: !0 }),
  rgba16sint: y("rgba16sint", "sint", 8, { renderable: !0, storage: !0 }),
  rgba16float: y("rgba16float", "float", 8, { renderable: !0, storage: !0, filterable: !0 }),
  rgba32uint: y("rgba32uint", "uint", 16, { renderable: !0, storage: !0 }),
  rgba32sint: y("rgba32sint", "sint", 16, { renderable: !0, storage: !0 }),
  rgba32float: y("rgba32float", "float", 16, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  depth16unorm: y("depth16unorm", "depth", 2, {
    depthStencilAttachment: !0,
    filterable: !0
  }),
  // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
  // 因此没有确定的内存布局：既不能采样，也不能拷贝。
  depth24plus: y("depth24plus", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  "depth24plus-stencil8": y("depth24plus-stencil8", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  depth32float: y("depth32float", "depth", 4, {
    depthStencilAttachment: !0,
    filterFeature: "float32-filterable"
  }),
  stencil8: y("stencil8", "stencil", 1, {
    depthStencilAttachment: !0,
    sampleable: !1
  })
});
function Pe(t) {
  const e = cf[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function J(t) {
  const e = tr[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function uf(t) {
  for (const [e, n] of Object.entries(tr))
    if (n === t) return e;
  throw new u(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function Bs(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function jt(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function hf(t, e) {
  const n = Pe(t);
  return n.filterable ? !0 : n.filterFeature && e ? e.has(n.filterFeature) : !1;
}
function df(t, e, n) {
  const r = Pe(t);
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
function ff(t, e, n = !1) {
  const r = Pe(t);
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
function Gs(t, e, n) {
  const r = Pe(t);
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
function pf(t, e) {
  if (!Pe(t).copyable)
    throw new u(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function mf(t, e, n) {
  if (e !== "all") {
    if (e === "depth-only" && !Bs(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !jt(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function gf(t, e, n, r) {
  Pe(t);
  const i = n.sampleCount ?? 1;
  if (e & v.RenderAttachment && df(t, n.features, r), e & v.TextureBinding && ff(t, r, i > 1), e & v.StorageBinding && Gs(t, n.features, r), e & (v.CopySrc | v.CopyDst) && pf(t, r), i > 1) {
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
    if (e & (v.CopySrc | v.CopyDst))
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture cannot be a copy source or destination; resolve it into a single-sampled texture first.`
      );
    if (e & (v.TextureBinding | v.StorageBinding))
      throw new u(
        `[gpu-device-api] ${r}: a multisampled texture can only be used as a render attachment.`
      );
  }
}
const bf = [
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
], wf = Object.freeze({
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
function nr() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function Rr() {
  return nr() !== null;
}
async function yf(t = {}) {
  const e = nr();
  if (!e) return null;
  const n = {};
  return t.powerPreference !== void 0 && (n.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (n.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (n.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (n.xrCompatible = t.xrCompatible), e.requestAdapter(n);
}
function Os(t) {
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
function Us(t) {
  const e = t ?? {}, n = {};
  for (const r of bf) {
    const i = e[r];
    n[r] = typeof i == "number" && Number.isFinite(i) ? i : wf[r];
  }
  return n;
}
function vf(t) {
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
function xf(t, e, n) {
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
class Sf {
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
function Br() {
  const t = nr();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function Tf(t) {
  const e = J(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new u(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function $f(t) {
  const n = t.getContext.call(t, "webgpu");
  return !n || typeof n.getCurrentTexture != "function" ? null : n;
}
const on = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, xt = {
  RED: 1,
  GREEN: 2,
  BLUE: 4,
  ALPHA: 8
}, te = {
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
}, Ye = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, Gr = {
  READ: 1,
  WRITE: 2
};
function Af(t) {
  if (!Number.isInteger(t))
    throw new u(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new u(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & q.Vertex && (e |= on.VERTEX), t & q.Fragment && (e |= on.FRAGMENT), t & q.Compute && (e |= on.COMPUTE), e === 0)
    throw new u(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function _f(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new u(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & oe.Red && (e |= xt.RED), t & oe.Green && (e |= xt.GREEN), t & oe.Blue && (e |= xt.BLUE), t & oe.Alpha && (e |= xt.ALPHA), e;
}
function Ef(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] BufferUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -1024)
    throw new u(
      `[gpu-device-api] BufferUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  if (t & C.MapRead && t & C.MapWrite)
    throw new u(
      "[gpu-device-api] BufferUsage cannot combine MapRead and MapWrite: WebGPU rejects a buffer that is both mappable for reading and for writing. Use two buffers (or CopyDst plus writeBuffer)."
    );
  let e = 0;
  return t & C.MapRead && (e |= te.MAP_READ), t & C.MapWrite && (e |= te.MAP_WRITE), t & C.CopySrc && (e |= te.COPY_SRC), t & C.CopyDst && (e |= te.COPY_DST), t & C.Index && (e |= te.INDEX), t & C.Vertex && (e |= te.VERTEX), t & C.Uniform && (e |= te.UNIFORM), t & C.Storage && (e |= te.STORAGE), t & C.Indirect && (e |= te.INDIRECT), t & C.QueryResolve && (e |= te.QUERY_RESOLVE), e;
}
function Ds(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new u(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & v.CopySrc && (e |= Ye.COPY_SRC), t & v.CopyDst && (e |= Ye.COPY_DST), t & v.TextureBinding && (e |= Ye.TEXTURE_BINDING), t & v.StorageBinding && (e |= Ye.STORAGE_BINDING), t & v.RenderAttachment && (e |= Ye.RENDER_ATTACHMENT), e;
}
function Pf(t) {
  switch (t) {
    case "read":
      return Gr.READ;
    case "write":
      return Gr.WRITE;
    default:
      return P(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function Lf(t) {
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
      return P(t, `[gpu-device-api] Unknown PrimitiveTopology "${String(t)}".`);
  }
}
function Cf(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function Is(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return P(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
  }
}
function rr(t) {
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
      return P(t, `[gpu-device-api] Unknown CompareFunction "${String(t)}".`);
  }
}
function ln(t) {
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
      return P(t, `[gpu-device-api] Unknown StencilOperation "${String(t)}".`);
  }
}
function Or(t) {
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
      return P(t, `[gpu-device-api] Unknown BlendFactor "${String(t)}".`);
  }
}
function Mf(t) {
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
      return P(t, `[gpu-device-api] Unknown BlendOperation "${String(t)}".`);
  }
}
function cn(t) {
  switch (t) {
    case "clamp-to-edge":
      return "clamp-to-edge";
    case "repeat":
      return "repeat";
    case "mirror-repeat":
      return "mirror-repeat";
    default:
      return P(t, `[gpu-device-api] Unknown AddressMode "${String(t)}".`);
  }
}
function Ur(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return P(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function Ff(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return P(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function Rf(t) {
  switch (t) {
    case "none":
      return "none";
    case "front":
      return "front";
    case "back":
      return "back";
    default:
      return P(t, `[gpu-device-api] Unknown CullMode "${String(t)}".`);
  }
}
function Bf(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return P(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function un(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return P(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function hn(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return P(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function Cn(t) {
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
      return P(t, `[gpu-device-api] Unknown TextureViewDimension "${String(t)}".`);
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
      return P(t, `[gpu-device-api] Unknown TextureAspect "${String(t)}".`);
  }
}
function Gf(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return P(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function Of(t) {
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
      return P(t, `[gpu-device-api] Unknown VertexFormat "${String(t)}".`);
  }
}
function Uf(t) {
  switch (t) {
    case ze.Occlusion:
      return "occlusion";
    case ze.Timestamp:
      return "timestamp";
    default:
      return P(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function Df(t) {
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
function If(t) {
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
function Vf(t) {
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
      return P(t, `[gpu-device-api] Unknown TextureSampleType "${String(t)}".`);
  }
}
function Nf(t) {
  switch (t) {
    case "write-only":
      return "write-only";
    case "read-only":
      return "read-only";
    case "read-write":
      return "read-write";
    default:
      return P(t, `[gpu-device-api] Unknown StorageTextureAccess "${String(t)}".`);
  }
}
function kf(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return P(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const zf = {
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
}, Wf = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, qf = /^rgba?\(([^)]*)\)$/;
function Vs(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return Qf(t);
  if (typeof t == "number") return jf(t);
  if (Array.isArray(t)) {
    const n = t;
    if (n.length !== 3 && n.length !== 4)
      throw new u(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${n.length}.`
      );
    return Dr(n[0], n[1], n[2], n.length === 4 ? n[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new u(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return Dr(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function Dr(t, e, n, r, i) {
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
function jf(t) {
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
function Qf(t) {
  const e = t.trim().toLowerCase(), n = Wf.exec(e);
  if (n) {
    const s = n[1];
    if (s.length === 3 || s.length === 4) {
      const h = parseInt(s[0] + s[0], 16) / 255, f = parseInt(s[1] + s[1], 16) / 255, d = parseInt(s[2] + s[2], 16) / 255, p = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: h, g: f, b: d, a: p };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, c = parseInt(s.slice(4, 6), 16) / 255, l = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: c, a: l };
  }
  const r = zf[e];
  if (r) return { r: r[0], g: r[1], b: r[2], a: r[3] };
  const i = qf.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((h) => h.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new u(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = dn(s[0], t), o = dn(s[1], t), c = dn(s[2], t), l = s.length === 4 ? Xf(s[3], t) : 1;
    return { r: a, g: o, b: c, a: l };
  }
  throw new u(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function dn(t, e) {
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
function Xf(t, e) {
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
function Ne(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function Ns(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function Yf(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function at(t, e) {
  if (t !== 1 && t !== 4)
    throw new u(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class ks {
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
    if (this.device = e, this.label = n.label ?? `buffer#${e.nextResourceId("buffer")}`, We(n.size, "BufferDescriptor.size"), n.size % 4 !== 0)
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
      usage: Ef(n.usage)
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
    this.assertRange(n, i, "Buffer.mapAsync"), await this.native.mapAsync(Pf(e), n, i), this._mapped = !0;
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
    this._disposed || (this._disposed = !0, this._mapped = !1, this.mappedRange = null, this.native.destroy(), this.device.untrack(this));
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
    if (Te(e, `${r} offset`), We(n, `${r} size`), e + n > i) {
      const s = i === this.size ? `buffer "${this.label}" size ${this.size}` : `mapped range size ${i} of buffer "${this.label}"`;
      throw new u(
        `[gpu-device-api] ${r}: range [${e}, ${e + n}) exceeds ${s}.`
      );
    }
  }
}
function Hf(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function U(t, e) {
  if (t instanceof ks) return t.native;
  if (Hf(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), got ${ne(t)}.`
  );
}
function ne(t) {
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
  /**
   * `preResolved` 由 {@link WebGPUTexture.createView} 传入：它已经为查缓存解析过一次，
   * 这里不再重复解析（`resolveTextureViewDescriptor` 每次都会新建一个对象）。
   */
  constructor(e, n = {}, r) {
    this.texture = e;
    const i = r ?? Lt(e, n);
    this.label = n.label ?? `${e.label}#view`;
    const s = i.aspect;
    if (mf(e.format, s, `Texture "${e.label}".createView`), i.baseMipLevel + i.mipLevelCount > e.mipLevelCount)
      throw new u(
        `[gpu-device-api] Texture "${e.label}".createView: mip range [${i.baseMipLevel}, ${i.baseMipLevel + i.mipLevelCount}) exceeds mipLevelCount ${e.mipLevelCount}.`
      );
    if (i.baseArrayLayer + i.arrayLayerCount > e.depthOrArrayLayers)
      throw new u(
        `[gpu-device-api] Texture "${e.label}".createView: array layer range [${i.baseArrayLayer}, ${i.baseArrayLayer + i.arrayLayerCount}) exceeds depthOrArrayLayers ${e.depthOrArrayLayers}.`
      );
    if (i.dimension === "cube" || i.dimension === "cube-array") {
      if (i.arrayLayerCount % 6 !== 0)
        throw new u(
          `[gpu-device-api] Texture "${e.label}".createView: a "${i.dimension}" view needs a multiple of 6 array layers, got ${i.arrayLayerCount}.`
        );
      if (e.width !== e.height)
        throw new u(
          `[gpu-device-api] Texture "${e.label}".createView: a "${i.dimension}" view needs a square texture, got ${e.width}x${e.height}.`
        );
    }
    this.descriptor = i;
    let a;
    if (i.format !== void 0 && (a = J(i.format), i.format !== e.format && !e.viewFormats.includes(i.format)))
      throw new u(
        `[gpu-device-api] Texture "${e.label}".createView: view format "${i.format}" was not listed in the texture's viewFormats (${e.viewFormats.join(", ") || "none"}).`
      );
    this.native = e.native.createView({
      label: this.label,
      format: a,
      dimension: Cn(i.dimension),
      aspect: ir(i.aspect),
      baseMipLevel: i.baseMipLevel,
      mipLevelCount: i.mipLevelCount,
      baseArrayLayer: i.baseArrayLayer,
      arrayLayerCount: i.arrayLayerCount
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
function zs(t) {
  return t instanceof sr;
}
function Zf(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function Ze(t, e) {
  if (t instanceof sr) return t.native;
  if (Zf(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${ne(t)}.`
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
  /** 无参 `createView()` 的解析结果与 cache key：这是最常见的热路径，只需算一次。 */
  defaultViewResolved = null;
  defaultViewKey = null;
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
    const r = Gn(n.size), i = {
      label: n.label ?? `texture#${e.nextResourceId("texture")}`,
      size: r,
      mipLevelCount: n.mipLevelCount ?? 1,
      sampleCount: n.sampleCount ?? 1,
      dimension: n.dimension ?? "2d",
      format: n.format,
      usage: n.usage,
      viewFormats: n.viewFormats ?? []
    };
    Kf(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: r.width, height: r.height, depthOrArrayLayers: r.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: J(i.format),
      usage: Ds(i.usage),
      viewFormats: i.viewFormats.map((a) => J(a))
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
      format: r.format ?? uf(n.format),
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
  createView(e) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] Texture.createView: texture "${this.label}" has been destroyed.`
      );
    let n, r;
    e === void 0 ? (n = this.defaultViewResolved ?? (this.defaultViewResolved = Lt(this, {})), r = this.defaultViewKey ?? (this.defaultViewKey = Ir(n))) : (n = Lt(this, e), r = Ir(n));
    const i = this.viewCache.get(r);
    if (i) return i;
    const s = new sr(this, e, n);
    return this.viewCache.set(r, s), this.viewList.push(s), s;
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
      this.viewCache.clear(), this.defaultViewResolved = null, this.defaultViewKey = null, this.owned && this.native.destroy(), this.device.untrack(this);
    }
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
}
function Ir(t) {
  return Ti(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect
  );
}
function Kf(t, e) {
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
  const s = Ra(t.size);
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
  gf(
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
    const c = (l) => l.replace("-srgb", "");
    if (c(o) !== c(t.format))
      throw new u(
        `[gpu-device-api] Texture "${t.label}": viewFormat "${o}" is not compatible with format "${t.format}" (WebGPU only allows srgb <-> non-srgb reinterpretation).`
      );
  }
}
function Vr(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function Ws(t, e) {
  if (t instanceof me) return t.native;
  if (Vr(t)) return t;
  const n = t?.native;
  if (n !== void 0 && Vr(n)) return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${ne(t)}.`
  );
}
class ar {
  label;
  descriptor;
  native;
  device;
  _disposed = !1;
  constructor(e, n = {}) {
    this.device = e, this.label = n.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const r = bi(n);
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
      addressModeU: cn(r.addressModeU),
      addressModeV: cn(r.addressModeV),
      addressModeW: cn(r.addressModeW),
      magFilter: Ur(r.magFilter),
      minFilter: Ur(r.minFilter),
      mipmapFilter: Ff(r.mipmapFilter),
      lodMinClamp: r.lodMinClamp,
      lodMaxClamp: r.lodMaxClamp,
      maxAnisotropy: r.maxAnisotropy
    };
    r.compare !== void 0 && (i.compare = rr(r.compare)), this.native = e.native.createSampler(i);
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
    this._disposed = !0, this.device.untrack(this);
  }
}
function Jf(t) {
  return t instanceof ar;
}
function ep(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function tp(t, e) {
  if (t instanceof ar) return t.native;
  if (ep(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class qs {
  label;
  source;
  defines;
  /** GLSL 自动包装开关：WGSL 没有版本指令与精度前言，这里只保存不生效。 */
  glsl;
  device;
  modulesByStage = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, n) {
    if (this.device = e, this.label = n.label ?? `shader#${e.nextResourceId("shader")}`, this.source = wi(n.code), this.defines = { ...n.defines ?? {} }, this.glsl = n.glsl ? { ...n.glsl } : {}, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
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
    return _n({
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
    this._disposed = !0, this.modulesByStage.clear(), this.device.untrack(this);
  }
}
function Mn(t, e) {
  if (t instanceof qs) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${ne(t)}.`
  );
}
const $e = "timestamp-query", fn = [
  "timestamp-query-inside-passes",
  "chromium-experimental-timestamp-query-inside-passes"
];
class js {
  label;
  type;
  count;
  native;
  device;
  _disposed = !1;
  constructor(e, n) {
    if (this.device = e, this.label = n.label ?? e.nextResourceId("querySet"), !Number.isInteger(n.count) || n.count <= 0)
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(n.count)}.`
      );
    if (n.type === ze.Timestamp && !e.hasEnabledFeature($e))
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${$e}" device feature, but it is not enabled on this device. Pass it in DeviceDescriptor.requiredFeatures (available on the adapter: ${e.features.has($e) ? "yes" : "no"}).`
      );
    this.type = n.type, this.count = n.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: Uf(n.type),
      count: n.count
    });
  }
  get disposed() {
    return this._disposed;
  }
  /** 销毁 query set。幂等。 */
  destroy() {
    this._disposed || (this._disposed = !0, this.native.destroy(), this.device.untrack(this));
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
}
function et(t, e) {
  if (t instanceof js) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const n = t;
    if (typeof n.destroy == "function" && typeof n.count == "number")
      return t;
  }
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
function Qs(t, e, n) {
  if (yi(t, n), !e.hasEnabledFeature($e))
    throw new u(
      `[gpu-device-api] ${n}: writing timestamps inside a pass needs the "${$e}" device feature, but it is not enabled on this device.`
    );
  if (fn.find((s) => e.hasEnabledFeature(s)) === void 0)
    throw new u(
      `[gpu-device-api] ${n}: this WebGPU implementation does not enable "${fn[0]}" (tried: ${fn.join(", ")}), so timestamps cannot be written inside a pass. Use CommandEncoder.writeTimestamp() around the pass instead, which only needs "timestamp-query" (that is what gfx GPU timing does).`
    );
  const i = {
    querySet: et(t.querySet, `${n}.querySet`)
  };
  return t.beginningOfPassWriteIndex !== void 0 && (i.beginningOfPassWriteIndex = t.beginningOfPassWriteIndex), t.endOfPassWriteIndex !== void 0 && (i.endOfPassWriteIndex = t.endOfPassWriteIndex), i;
}
class np {
  type;
  count;
  timestampPeriod;
  staging;
  readback;
  _read = !1;
  constructor(e) {
    this.type = e.type, this.count = e.count, this.timestampPeriod = e.timestampPeriod, this.staging = e.staging, this.readback = e.readback;
  }
  /**
   * 等 GPU 把结果写进读回 buffer，然后返回原始值。
   *
   * `mapAsync` 的 promise 在 GPU 侧写完时 resolve，**不会阻塞 CPU**（这正是 `Device.readQuerySet()`
   * 可以放进帧循环的原因）。
   */
  async read() {
    if (this._read)
      throw new u(
        "[gpu-device-api] QueryResult.read(): the result has already been read. WebGPU maps the readback buffer exactly once, so call Device.readQuerySet() again to get a fresh result."
      );
    this._read = !0;
    try {
      const e = await this.readback.mapAsync("read"), n = new BigUint64Array(e.slice(0));
      return this.readback.unmap(), n;
    } finally {
      this.readback.destroy(), this.staging.destroy();
    }
  }
}
class Xs {
  label;
  entries;
  sortedEntries;
  native;
  device;
  byBinding;
  _disposed = !1;
  constructor(e, n) {
    this.device = e, this.label = n.label ?? `bindGroupLayout#${e.nextResourceId("bindGroupLayout")}`;
    let r;
    try {
      r = vi(n.entries);
    } catch (s) {
      throw new u(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = r, this.entries = n.entries, this.byBinding = new Map(r.map((s) => [s.binding, s]));
    const i = r.map(
      (s) => rp(s, e, this.label)
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
    this._disposed = !0, this.device.untrack(this);
  }
}
function rp(t, e, n) {
  const r = `BindGroupLayout "${n}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: Af(t.visibility)
  };
  if (mi(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new u(
        `[gpu-device-api] ${r}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: Df(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (gi(t.type)) {
    const s = t.sampler ?? {}, a = If(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : kf(s.type)
    }, i;
  }
  if (t.type === O.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new u(
        `[gpu-device-api] ${r}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: Vf(a),
      viewDimension: Cn(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === O.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new u(
        `[gpu-device-api] ${r}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return Gs(s.format, e.features, r), i.storageTexture = {
      access: Nf(s.access ?? "write-only"),
      format: J(s.format),
      viewDimension: Cn(s.viewDimension ?? "2d")
    }, i;
  }
  throw new u(
    `[gpu-device-api] ${r}: unsupported BindingType "${String(t.type)}".`
  );
}
function Ys(t, e) {
  if (t instanceof Xs) return t.native;
  if (ip(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function ip(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class Hs {
  label;
  layout;
  entries;
  native;
  device;
  byBinding;
  _disposed = !1;
  constructor(e, n) {
    this.device = e, this.label = n.label ?? `bindGroup#${e.nextResourceId("bindGroup")}`, this.layout = n.layout, this.entries = n.entries, this.byBinding = new Map(n.entries.map((s) => [s.binding, s]));
    for (const s of n.entries)
      if (!this.layout.entry(s.binding))
        throw new u(
          `[gpu-device-api] BindGroup "${this.label}": binding ${s.binding} is not declared by layout "${this.layout.label}".`
        );
    const r = Ys(this.layout, `BindGroup "${this.label}"`), i = n.entries.map(
      (s) => sp(s, this.layout, e, this.label)
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
    this._disposed = !0, this.device.untrack(this);
  }
}
function sp(t, e, n, r) {
  const i = `BindGroup "${r}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new u(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (mi(s.type)) {
    if (!("buffer" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${ne(a)}.`
      );
    const o = U(a.buffer, i), c = a.offset ?? 0, l = a.size ?? a.buffer.size - c;
    if (!Number.isInteger(c) || c < 0)
      throw new u(`[gpu-device-api] ${i}: offset must be a non-negative integer.`);
    if (!Number.isInteger(l) || l < 0)
      throw new u(`[gpu-device-api] ${i}: size must be a non-negative integer.`);
    if (c + l > a.buffer.size)
      throw new u(
        `[gpu-device-api] ${i}: binding range [${c}, ${c + l}) exceeds the buffer size ${a.buffer.size}.`
      );
    const h = s.buffer?.minBindingSize ?? 0;
    if (h > 0 && l < h)
      throw new u(
        `[gpu-device-api] ${i}: layout requires minBindingSize ${h}, got ${l}.`
      );
    const f = { buffer: o, offset: c, size: l };
    return { binding: t.binding, resource: f };
  }
  if (gi(s.type)) {
    if (!("sampler" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${ne(a)}.`
      );
    const o = a.sampler, c = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (Jf(o)) {
      if (c && !o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!c && o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: tp(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${ne(a)}.`
      );
    return ap(a.view, s, n, i), { binding: t.binding, resource: Ze(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${ne(a)}.`
      );
    if (zs(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && J(a.view.format) !== J(o))
        throw new u(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: Ze(a.view, i) };
  }
  if ("source" in a)
    return { binding: t.binding, resource: a.source };
  throw new u(
    `[gpu-device-api] ${i}: unsupported binding resource ${ne(a)}.`
  );
}
function ap(t, e, n, r) {
  if (!zs(t)) return;
  const i = e.texture ?? {}, s = t.format, a = Pe(s), o = i.sampleType ?? "float";
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
    if (o === "float" && !hf(s, n.features))
      throw new u(
        `[gpu-device-api] ${r}: layout declares sampleType "float" (filterable), but "${s}" is not filterable on this device; declare "unfilterable-float" or enable the required feature.`
      );
  }
  const c = t.texture.sampleCount > 1;
  if ((i.multisampled ?? !1) !== c)
    throw new u(
      `[gpu-device-api] ${r}: layout declares multisampled=${String(i.multisampled ?? !1)}, but the bound texture has sampleCount ${t.texture.sampleCount}.`
    );
  const l = i.viewDimension ?? "2d";
  if (l !== t.descriptor.dimension)
    throw new u(
      `[gpu-device-api] ${r}: layout declares viewDimension "${l}", but the bound view is "${t.descriptor.dimension}".`
    );
}
const Zs = Object.freeze([]), Nr = /* @__PURE__ */ new WeakMap();
function op(t, e) {
  const n = Nr.get(t);
  if (n) return n;
  const r = [], i = [];
  for (const a of t.sortedEntries) {
    if (a.buffer?.hasDynamicOffset !== !0) continue;
    const o = a.type === "uniform";
    r.push(
      o ? e.limits.minUniformBufferOffsetAlignment : e.limits.minStorageBufferOffsetAlignment
    ), i.push(o ? "minUniformBufferOffsetAlignment" : "minStorageBufferOffsetAlignment");
  }
  const s = { count: r.length, alignments: r, limitNames: i };
  return Nr.set(t, s), s;
}
function Ks(t, e, n, r) {
  const i = op(t.layout, n);
  if (i.count === 0) {
    if (e !== void 0 && e.length > 0)
      throw new u(
        `[gpu-device-api] ${r}: bind group "${t.label}" has no entry with hasDynamicOffset, but ${e.length} dynamic offset(s) were supplied.`
      );
    return;
  }
  if (e === void 0 || e.length !== i.count)
    throw new u(
      `[gpu-device-api] ${r}: bind group "${t.label}" needs ${i.count} dynamic offset(s) (declaration order of the entries with hasDynamicOffset), got ${e ? e.length : 0}.`
    );
  for (let s = 0; s < i.count; s++) {
    const a = e[s], o = i.alignments[s];
    if (!Number.isInteger(a) || a < 0)
      throw new u(
        `[gpu-device-api] ${r}: dynamic offset #${s} must be a non-negative integer, got ${String(a)}.`
      );
    if (a % o !== 0)
      throw new u(
        `[gpu-device-api] ${r}: dynamic offset #${s} (${a}) must be a multiple of ${o} (${i.limitNames[s]}).`
      );
  }
}
function Js(t, e) {
  if (t instanceof Hs) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class tt {
  label;
  bindGroupLayouts;
  /** `'auto'` 时为字符串 `'auto'`，否则为 `GPUPipelineLayout`。 */
  native;
  isAuto;
  /** 由 `device.createPipelineLayout()` 创建时有值；`auto` 替身没有设备（也未被追踪）。 */
  device;
  _disposed = !1;
  constructor(e, n, r, i, s) {
    this.label = e, this.bindGroupLayouts = n, this.native = r, this.isAuto = i, this.device = s;
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
        (s) => Ys(s, `PipelineLayout "${r}"`)
      )
    });
    return new tt(r, n.bindGroupLayouts, i, !1, e);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new tt(e, [], "auto", !0, null);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0, this.device?.untrack(this);
  }
}
function ea(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof tt) return t.native;
  const n = t.native;
  if (n === "auto") return "auto";
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const lp = "uint32";
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
    const r = e?.topology ?? Ht.topology, i = {
      topology: Lf(r),
      frontFace: Bf(e?.frontFace ?? Ht.frontFace),
      cullMode: Rf(e?.cullMode ?? Ht.cullMode)
    };
    if (Cf(r))
      i.stripIndexFormat = Is(e?.stripIndexFormat ?? lp);
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
    const r = Bs(e), i = jt(e);
    if (!r && !i)
      throw new u(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: J(e) };
    return r && (s.depthWriteEnabled = n?.depthWriteEnabled ?? cr.depthWriteEnabled, s.depthCompare = rr(n?.depthCompare ?? cr.depthCompare)), i && (s.stencilFront = zr(n?.stencilFront), s.stencilBack = zr(n?.stencilBack), s.stencilReadMask = n?.stencilReadMask ?? 4294967295, s.stencilWriteMask = n?.stencilWriteMask ?? 4294967295), n?.depthBias !== void 0 && (s.depthBias = n.depthBias), n?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = n.depthBiasSlopeScale), n?.depthBiasClamp !== void 0 && (s.depthBiasClamp = n.depthBiasClamp), s;
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, n) {
    const r = at(e?.count ?? n, "MultisampleState.count"), i = { count: r, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
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
        color: kr(e.color),
        alpha: kr(e.alpha)
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
      const o = { format: J(a?.format ?? i) }, c = a?.blend ?? r.blend;
      c && (o.blend = xe.toGPUBlendState(c));
      const l = a?.writeMask ?? r.writeMask;
      return l !== void 0 && (o.writeMask = _f(l)), o;
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
        xi(r, n);
      } catch (i) {
        throw new u(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: r.arrayStride,
        stepMode: Gf(r.stepMode ?? "vertex"),
        attributes: r.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: Of(i.format)
        }))
      };
    });
  }
}
function kr(t) {
  const e = { ...Ga, ...t };
  return {
    operation: Mf(e.operation ?? "add"),
    srcFactor: Or(e.srcFactor),
    dstFactor: Or(e.dstFactor)
  };
}
function zr(t) {
  return {
    compare: rr(t?.compare ?? ht.compare),
    failOp: ln(t?.failOp ?? ht.failOp),
    depthFailOp: ln(t?.depthFailOp ?? ht.depthFailOp),
    passOp: ln(t?.passOp ?? ht.passOp)
  };
}
class cp {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, n) {
    this.cache = Ua(e, (r, i) => {
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
function Wr(t) {
  return Ti(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    Si(t.vertexLayouts)
  );
}
const up = "vsMain", hp = "fsMain", dp = Object.freeze({}), fp = [], pp = [];
class ta {
  label;
  descriptor;
  layout;
  vertexLayouts;
  device;
  cache;
  logger;
  sampleCountContext;
  _disposed = !1;
  warnedMissingVertexLayouts = !1;
  /** `defaultColorFormats()` 的结果只依赖 readonly descriptor，缓存后避免每次解析都新建数组。 */
  defaultColorFormatsCache = null;
  /** 上一次 `resolve()` 的入参与结果，用于按身份快速命中（见 {@link WebGPURenderPipeline.resolve}）。 */
  lastVariantInput = null;
  lastVariantColorFormats;
  lastVariantSampleCount;
  lastVariantDepthFormat;
  lastVariantVertexLayouts;
  lastVariantResolved = null;
  lastVariantKey = null;
  constructor(e, n) {
    this.device = e, this.descriptor = n, this.label = n.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`, this.layout = n.layout ?? "auto", this.vertexLayouts = n.vertex.buffers ?? null, this.logger = it(`webgpu:${this.label}`), this.sampleCountContext = `RenderPipeline "${this.label}": sampleCount`, this.cache = new cp(64, (r, i) => {
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
   *
   * 同一个 render pass 内每次 `setPipeline` 传的都是同一个 variant 请求对象
   *（见 `WebGPURenderPassEncoder` 的 `variantRequest`），因此这里按「入参身份 + 字段值」
   * 复用上一次的解析结果与 cache key：命中时不再新建 resolved 对象、不再 `join` colorFormats、
   * 也不再重算 vertex layout key —— 这些原本都在每 draw 的路径上。
   */
  resolve(e = dp) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`
      );
    let n, r;
    return e === this.lastVariantInput && e.colorFormats === this.lastVariantColorFormats && e.sampleCount === this.lastVariantSampleCount && e.depthFormat === this.lastVariantDepthFormat && e.vertexLayouts === this.lastVariantVertexLayouts && this.lastVariantResolved !== null && this.lastVariantKey !== null ? (n = this.lastVariantResolved, r = this.lastVariantKey) : (n = this.resolveVariant(e), r = Wr(n), this.lastVariantInput = e, this.lastVariantColorFormats = e.colorFormats, this.lastVariantSampleCount = e.sampleCount, this.lastVariantDepthFormat = e.depthFormat, this.lastVariantVertexLayouts = e.vertexLayouts, this.lastVariantResolved = n, this.lastVariantKey = r), this.cache.resolve(r, () => this.createNative(n));
  }
  /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
  get compiledVariants() {
    return this.cache.keys();
  }
  /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.cache.dispose(), this.device.untrack(this));
  }
  resolveVariant(e) {
    const n = this.descriptor, r = e.colorFormats ?? this.defaultColorFormats(), i = at(
      e.sampleCount ?? n.multisample?.count ?? n.render?.multisample?.count ?? 1,
      this.sampleCountContext
    ), s = e.depthFormat !== void 0 ? e.depthFormat : n.depthStencil?.format ?? null, a = e.vertexLayouts ?? this.vertexLayouts ?? fp;
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
      J(o);
    return s !== null && J(s), { colorFormats: r, sampleCount: i, depthFormat: s, vertexLayouts: a };
  }
  /**
   * descriptor 里声明的（或从 fragment targets 推导出的）color format 列表。
   *
   * 推导路径原先每次调用都新建一个数组；descriptor 是 readonly 的，结果缓存到实例上，
   * 与「共享空数组」一起消掉每 draw 的数组分配。
   */
  defaultColorFormats() {
    const e = this.defaultColorFormatsCache;
    if (e !== null) return e;
    const { descriptor: n } = this;
    let r;
    if (n.colorFormats)
      r = n.colorFormats;
    else if (n.render?.colorFormats)
      r = n.render.colorFormats;
    else {
      const i = n.fragment?.targets, s = [];
      if (i)
        for (const a of i) {
          if (a?.format === void 0) break;
          s.push(a.format);
        }
      r = i && s.length === i.length ? s : pp;
    }
    return this.defaultColorFormatsCache = r, r;
  }
  createNative(e) {
    const n = this.toGPURenderPipelineDescriptor(e);
    return this.logger.debug(`creating render pipeline variant ${Wr(e)}`), this.device.native.createRenderPipeline(n);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const n = this.descriptor, r = this.device.limits, i = n.vertex, a = {
      module: Mn(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(q.Vertex),
      entryPoint: i.entryPoint ?? up,
      buffers: xe.toGPUVertexBufferLayouts(e.vertexLayouts, r)
    }, o = n.fragment;
    let c;
    o && (c = {
      module: Mn(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(q.Fragment),
      entryPoint: o.entryPoint ?? hp,
      targets: xe.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: n.render?.blend,
        writeMask: n.render?.writeMask
      })
    });
    const l = n.primitive ?? n.render?.primitive, h = n.depthStencil ?? n.render?.depthStencil, f = n.multisample ?? n.render?.multisample, d = e.depthFormat, p = {
      label: this.label,
      layout: ea(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: xe.toGPUPrimitiveState(l, this.device.features),
      multisample: xe.toGPUMultisampleState(f, e.sampleCount)
    };
    return c && (p.fragment = c), d !== null ? p.depthStencil = xe.toGPUDepthStencilState(d, h) : h && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), p;
  }
}
function mp(t, e, n) {
  if (t instanceof ta) return t.resolve(n);
  const r = t?.native;
  if (r && typeof r == "object" && typeof r.getBindGroupLayout == "function")
    return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const gp = "csMain";
class na {
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
    const e = Mn(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    );
    return this._native = this.device.native.createComputePipeline({
      label: this.label,
      layout: ea(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(q.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? gp
      }
    }), this._native;
  }
  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose() {
    this._disposed || (this._disposed = !0, this._native = null, this.device.untrack(this));
  }
}
function bp(t, e) {
  if (t instanceof na) return t.resolve();
  const n = t?.native;
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const wp = [0, 0, 0, 1];
class ra {
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
    const r = yp(n.color);
    if (this.colorFormatsList = r, this.depthFormatValue = n.depth === void 0 || n.depth === !1 || n.depth === null ? null : n.depth === !0 ? "depth24plus" : n.depth, this.sampleCountValue = at(n.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = n.mipLevelCount ?? 1, this.baseUsage = n.usage ?? 0, this.sampled = n.sampled ?? !1, this._width = St(n.width, "width", this.label), this._height = St(n.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !Aa(this.depthFormatValue))
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
    const r = St(e, "width", this.label), i = St(n, "height", this.label);
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
    this._disposed || (this._disposed = !0, this.releaseTextures(), this.device.untrack(this));
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
      const i = this.sampled ? v.TextureBinding : v.None;
      return this.device.createTexture({
        label: `${this.label}#color${r}`,
        size: e,
        format: n,
        usage: v.RenderAttachment | i | this.baseUsage,
        mipLevelCount: this.mipLevelCountValue
      });
    }), this.colorViews = this.colorTextures.map((n) => n.createView({ label: `${n.label}#view` })), this.sampleCountValue > 1 && (this.multisampleTextureList = this.colorFormatsList.map(
      (n, r) => this.device.createTexture({
        label: `${this.label}#msaa${r}`,
        size: e,
        format: n,
        usage: v.RenderAttachment,
        sampleCount: this.sampleCountValue
      })
    ), this.multisampleViews = this.multisampleTextureList.map(
      (n) => n.createView({ label: `${n.label}#view` })
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
  buildAttachments(e, n, r) {
    const i = r === void 0 ? wp : r;
    return this.colorFormatsList.map((s, a) => {
      const o = this.multisampleViews[a], c = this.colorViews[a], l = {
        view: o ?? c,
        loadOp: e ?? "clear",
        storeOp: n ?? "store",
        clearValue: i
      };
      return o && (l.resolveTarget = c), l;
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
    return jt(this.depthFormatValue) && (r.stencilLoadOp = e ?? "clear", r.stencilStoreOp = "store", r.stencilClearValue = 0, r.stencilReadOnly = !1), r;
  }
}
function yp(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function St(t, e, n) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] RenderTarget "${n}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function vp(t, e) {
  const n = t.label ?? "renderPass";
  let r, i;
  if (t.target) {
    if (!(t.target instanceof ra))
      throw new u(
        `[gpu-device-api] ${n}: descriptor.target must be a WebGPURenderTarget created by a WebGPU device.`
      );
    const h = t.target.createPassDescriptor({
      clearValue: t.clearValue,
      depthClearValue: t.depthClearValue
    });
    r = h.colorAttachments, i = h.depthStencilAttachment;
  } else
    r = t.colorAttachments, i = t.depthStencilAttachment ?? null;
  const s = [], a = [], o = [];
  for (const h of r) {
    if (!h) {
      a.push(null);
      continue;
    }
    const f = Ze(h.view, `${n}.colorAttachments`), d = h.view.texture;
    s.push(h.view.descriptor.format ?? d.format), o.push(d.sampleCount);
    const p = h.loadOp ?? "clear", m = h.storeOp ?? "store";
    if (d.sampleCount > 1 && !h.resolveTarget && m !== "discard")
      throw new u(
        `[gpu-device-api] ${n}: a multisampled color attachment (sampleCount ${d.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const g = {
      view: f,
      loadOp: un(p),
      storeOp: hn(m)
    };
    h.resolveTarget && (g.resolveTarget = Ze(h.resolveTarget, `${n}.resolveTarget`)), p === "clear" && (g.clearValue = Vs(h.clearValue)), a.push(g);
  }
  const c = { label: n, colorAttachments: a };
  let l = null;
  if (i) {
    const h = Ze(i.view, `${n}.depthStencilAttachment`), f = i.view.descriptor.format ?? i.view.texture.format;
    l = f, o.push(i.view.texture.sampleCount);
    const d = { view: h }, p = i.depthLoadOp ?? "clear", m = i.depthStoreOp ?? "store";
    if (d.depthLoadOp = un(p), d.depthStoreOp = hn(m), p === "clear" && (d.depthClearValue = Sp(i.depthClearValue ?? 1, n)), i.depthReadOnly !== void 0 && (d.depthReadOnly = i.depthReadOnly), jt(f)) {
      const g = i.stencilLoadOp ?? p;
      d.stencilLoadOp = un(g), d.stencilStoreOp = hn(i.stencilStoreOp ?? "store"), g === "clear" && (d.stencilClearValue = i.stencilClearValue ?? 0), i.stencilReadOnly !== void 0 && (d.stencilReadOnly = i.stencilReadOnly);
    } else if (i.stencilLoadOp !== void 0 || i.stencilStoreOp !== void 0)
      throw new u(
        `[gpu-device-api] ${n}: depth format "${f}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    c.depthStencilAttachment = d;
  }
  return t.occlusionQuerySet && (c.occlusionQuerySet = et(t.occlusionQuerySet, `${n}.occlusionQuerySet`)), t.timestampWrites && (c.timestampWrites = Qs(
    t.timestampWrites,
    e,
    `${n}.timestampWrites`
  )), {
    native: c,
    hasOcclusionQuerySet: t.occlusionQuerySet !== void 0,
    layout: {
      colorFormats: s,
      depthFormat: l,
      sampleCount: xp(o, n)
    }
  };
}
function xp(t, e) {
  if (t.length === 0) return 1;
  const n = t[0];
  for (const r of t)
    if (r !== n)
      throw new u(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return n;
}
function Sp(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new u(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class Tp {
  label;
  layout;
  native;
  device;
  onEnd;
  /** 该 pass 是否声明了 occlusionQuerySet；没声明时 beginOcclusionQuery 会明确报错。 */
  hasOcclusionQuerySet;
  _ended = !1;
  occlusionQueryOpen = !1;
  /**
   * 一个 pass 的 attachment 布局与 label 在生命周期内都不变，因此「pipeline variant 请求」
   * 与各处报错用的 context 字符串都在构造时建一次。
   *
   * 这些值原先每次 `setPipeline` / `setBindGroup` / `setVertexBuffer` 都会现拼：
   * 每 draw 一个对象 + 若干模板字符串，在几千个 draw 的帧里是纯浪费。
   */
  variantRequest;
  contextSetPipeline;
  contextSetBindGroup;
  contextSetVertexBuffer;
  contextSetIndexBuffer;
  contextDrawIndirect;
  contextDrawIndexedIndirect;
  constructor(e, n, r, i, s, a) {
    this.device = e, this.native = n, this.layout = r, this.label = i, this.hasOcclusionQuerySet = s, this.onEnd = a;
    const o = `RenderPass "${i}"`;
    this.contextSetPipeline = `${o}.setPipeline`, this.contextSetBindGroup = `${o}.setBindGroup`, this.contextSetVertexBuffer = `${o}.setVertexBuffer`, this.contextSetIndexBuffer = `${o}.setIndexBuffer`, this.contextDrawIndirect = `${o}.drawIndirect`, this.contextDrawIndexedIndirect = `${o}.drawIndexedIndirect`, this.variantRequest = {
      colorFormats: r.colorFormats,
      sampleCount: r.sampleCount,
      depthFormat: r.depthFormat
    };
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(mp(e, this.contextSetPipeline, this.variantRequest));
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Ks(n, r, this.device, this.contextSetBindGroup), this.native.setBindGroup(
        e,
        Js(n, this.contextSetBindGroup),
        r ?? Zs
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
    this.native.setVertexBuffer(e, U(n, this.contextSetVertexBuffer), r, i);
  }
  setIndexBuffer(e, n, r, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      U(e, this.contextSetIndexBuffer),
      Is(n),
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
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(Vs(e));
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
    const r = qr(e, n, this.contextDrawIndirect);
    this.native.drawIndirect(r.buffer, r.offset);
  }
  drawIndexedIndirect(e, n = 0) {
    this.assertOpen("drawIndexedIndirect");
    const r = qr(e, n, this.contextDrawIndexedIndirect);
    this.native.drawIndexedIndirect(r.buffer, r.offset);
  }
  /**
   * 开始一条遮挡查询：这一段里绘制的图元有多少采样通过深度/模板测试，就累加到
   * `descriptor.occlusionQuerySet` 的第 `index` 个计数器里。
   *
   * WebGPU 要求 pass 在创建时就声明 `occlusionQuerySet`，没声明就报错（原生也会报，
   * 但这里报得更早、说的更清楚）。
   */
  beginOcclusionQuery(e) {
    if (this.assertOpen("beginOcclusionQuery"), !this.hasOcclusionQuerySet)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: the pass was created without RenderPassDescriptor.occlusionQuerySet, so there is nowhere to store the sample count.`
      );
    if (this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: an occlusion query is already open; call endOcclusionQuery() first.`
      );
    this.native.beginOcclusionQuery(e), this.occlusionQueryOpen = !0;
  }
  /** 结束最近一次 {@link beginOcclusionQuery}。 */
  endOcclusionQuery() {
    if (this.assertOpen("endOcclusionQuery"), !this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".endOcclusionQuery: no occlusion query is open.`
      );
    this.occlusionQueryOpen = !1, this.native.endOcclusionQuery();
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
    if (!this._ended) {
      if (this.occlusionQueryOpen)
        throw new u(
          `[gpu-device-api] RenderPass "${this.label}".end: an occlusion query is still open; call endOcclusionQuery() before ending the pass.`
        );
      this._ended = !0, this.native.end(), this.onEnd?.();
    }
  }
  assertOpen(e) {
    if (this._ended)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".${e}: the pass has already ended.`
      );
  }
}
function qr(t, e, n) {
  return "indirectBuffer" in t ? {
    buffer: U(t.indirectBuffer, n),
    offset: t.indirectOffset ?? 0
  } : { buffer: U(t, n), offset: e };
}
function $p(t, e) {
  const n = t?.label ?? "computePass", r = { label: n };
  return t?.timestampWrites && (r.timestampWrites = Qs(
    t.timestampWrites,
    e,
    `${n}.timestampWrites`
  )), r;
}
class Ap {
  label;
  native;
  device;
  onEnd;
  _ended = !1;
  /** 同 render pass：label 在生命周期内不变，报错用的 context 只建一次，避免每次调用现拼。 */
  contextSetPipeline;
  contextSetBindGroup;
  contextDispatchIndirect;
  constructor(e, n, r, i) {
    this.device = e, this.native = n, this.label = r, this.onEnd = i;
    const s = `ComputePass "${r}"`;
    this.contextSetPipeline = `${s}.setPipeline`, this.contextSetBindGroup = `${s}.setBindGroup`, this.contextDispatchIndirect = `${s}.dispatchWorkgroupsIndirect`;
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(bp(e, this.contextSetPipeline));
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Ks(n, r, this.device, this.contextSetBindGroup), this.native.setBindGroup(
        e,
        Js(n, this.contextSetBindGroup),
        r ?? Zs
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
    const r = this.contextDispatchIndirect;
    if ("indirectBuffer" in e) {
      this.native.dispatchWorkgroupsIndirect(
        U(e.indirectBuffer, r),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(U(e, r), n);
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
class _p {
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
    const { native: n, layout: r, hasOcclusionQuerySet: i } = vp(e, this.device), s = e.label ?? this.label, a = new Tp(
      this.device,
      this.native.beginRenderPass(n),
      r,
      s,
      i,
      () => {
        this.openPass === a && (this.openPass = null);
      }
    );
    return this.openPass = a, a;
  }
  /** 开始一个 compute pass。 */
  beginComputePass(e) {
    this.assertRecording("beginComputePass"), this.closeOpenPass();
    const n = $p(e, this.device), r = e?.label ?? this.label, i = new Ap(
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
      U(e, `${this.label}.copyBufferToBuffer(source)`),
      n,
      U(r, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, n, r) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: U(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      Tt(n, `${this.label}.copyBufferToTexture(destination)`),
      Ne(r)
    );
  }
  copyTextureToBuffer(e, n, r) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      Tt(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: U(n.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: n.offset ?? 0,
        bytesPerRow: n.bytesPerRow,
        rowsPerImage: n.rowsPerImage
      },
      Ne(r)
    );
  }
  copyTextureToTexture(e, n, r) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      Tt(e, `${this.label}.copyTextureToTexture(source)`),
      Tt(n, `${this.label}.copyTextureToTexture(destination)`),
      Ne(r)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, n = 0, r) {
    this.assertRecording("clearBuffer"), Te(n, `${this.label}.clearBuffer offset`);
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
      U(e, `${this.label}.clearBuffer`),
      n,
      i
    );
  }
  /**
   * 把 query set 的一段结果解析进 `destination`（需要 `BufferUsage.QueryResolve`）。
   *
   * 注意读回路径：`MAP_READ` 不能与 `QUERY_RESOLVE` 组合，所以想读回必须再
   * `copyBufferToBuffer` 到一个 `MAP_READ | COPY_DST` 的 buffer（`Device.readQuerySet()` 已经封装好）。
   */
  resolveQuerySet(e, n, r, i, s) {
    this.assertRecording("resolveQuerySet");
    const a = `${this.label}.resolveQuerySet`;
    Te(n, `${a} firstQuery`), We(r, `${a} queryCount`), Te(s, `${a} destinationOffset`), this.native.resolveQuerySet(
      et(e, `${a}(querySet)`),
      n,
      r,
      U(i, `${a}(destination)`),
      s
    );
  }
  /**
   * 在命令流里写一个 GPU 时间戳（只需要 `timestamp-query`，不需要 `timestamp-query-inside-passes`）。
   *
   * 必须在任何 pass **之外**调用：WebGPU 规定 encoder 上写时间戳时不能有打开的 pass。
   * 未启用 feature、或实现没有暴露这个方法时明确报错（后者实测存在于部分实现里）。
   */
  writeTimestamp(e, n) {
    this.assertRecording("writeTimestamp");
    const r = `${this.label}.writeTimestamp`, i = this.native.writeTimestamp;
    if (typeof i != "function")
      throw new u(
        `[gpu-device-api] ${r}: this WebGPU implementation does not expose GPUCommandEncoder.writeTimestamp(). Use RenderPassDescriptor.timestampWrites instead (it needs "timestamp-query-inside-passes"), or read GPU time from the backend's own profiler.`
      );
    if (!this.device.hasEnabledFeature($e))
      throw new u(
        `[gpu-device-api] ${r}: timestamp queries need the "${$e}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    if (this.openPass && !this.openPass.ended)
      throw new u(
        `[gpu-device-api] ${r}: a pass is still open. Call end() on it before writing a timestamp.`
      );
    if (!Number.isInteger(n) || n < 0 || n >= e.count)
      throw new u(
        `[gpu-device-api] ${r}: queryIndex ${String(n)} is outside the query set range [0, ${e.count}).`
      );
    i.call(this.native, et(e, `${r}(querySet)`), n);
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
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, new ia(this.label, this.native.finish());
  }
  /** 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。 */
  dispose() {
    this._disposed = !0, this.device.untrack(this);
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
class ia {
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
function Tt(t, e) {
  const n = {
    texture: Ws(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = Ns(t.origin)), t.aspect !== void 0 && (n.aspect = ir(t.aspect)), n;
}
function Ep(t, e) {
  if (t instanceof ia) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${ne(t)}.`
  );
}
class Pp {
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
    this.canvas = e, this.options = n, this.pixelRatioValue = n.pixelRatio ?? _i(), this.formatValue = Br(), this.usageValue = v.RenderAttachment | (n.copySrc ? v.CopySrc : v.None);
    const r = He(e);
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
    if (!(e.device instanceof sa))
      throw new u(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const n = $f(this.canvas);
    if (!n)
      throw new u(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget(), this.gpuContext = n, this.currentDevice = e.device, this.formatValue = e.format ?? Br(), this.usageValue = v.RenderAttachment | (e.usage ?? v.None) | (this.options.copySrc ? v.CopySrc : v.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace;
    const r = e.sampleCount ?? (this.configuredValue ? this.sampleCountValue : e.device.defaultSampleCount);
    this.sampleCountValue = at(r, "CanvasConfig.sampleCount"), this.depthRequestedValue = e.depth ?? !0;
    const i = {
      device: e.device.native,
      format: Tf(this.formatValue),
      usage: Ds(this.usageValue),
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
    const n = He(this.canvas), r = Math.max(1, Math.round(n.width * this.pixelRatioValue)), i = Math.max(1, Math.round(n.height * this.pixelRatioValue));
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
    this._disposed || (this._disposed = !0, this.currentDevice?.untrack(this), this.unconfigure());
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
      format: Ai,
      usage: v.RenderAttachment,
      sampleCount: this.sampleCountValue
    });
    return this.depthTexture = s, this.depthViewValue = s.createView({ label: `${s.label}#view` }), this.depthViewValue;
  }
  releaseDepthTarget() {
    this.depthTexture?.destroy(), this.depthTexture = null, this.depthViewValue = null;
  }
}
class Lp {
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
      U(e, "Queue.writeBuffer"),
      n,
      r,
      i / a,
      o / a
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, n, r, i) {
    this.native.writeTexture(
      pn(e, "Queue.writeTexture"),
      n,
      Yf(r),
      Ne(i)
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
      pn(n, "Queue.copyExternalImageToTexture"),
      Ne(r)
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
      U(e, "Queue.copyBufferToBuffer(source)"),
      n,
      U(r, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, n, r) {
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: U(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      pn(n, "Queue.copyBufferToTexture(destination)"),
      Ne(r)
    ), this.native.submit([i.finish()]);
  }
  /** 提交 command buffer；提交后这些 buffer 不可再次使用。 */
  submit(e) {
    this.native.submit(e.map((n) => Ep(n, "Queue.submit")));
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
function pn(t, e) {
  const n = {
    texture: Ws(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = Ns(t.origin)), t.aspect !== void 0 && (n.aspect = ir(t.aspect)), n;
}
class sa {
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
  /**
   * 设备上**真正启用**的 feature 集合。
   *
   * 与 {@link WebGPUDevice.features}（adapter 支持什么）不是一回事：adapter 支持 `timestamp-query`
   * 但 `requiredFeatures` 里没写，设备上就没有这个能力。`native.features` 是权威来源；
   * 实现没有暴露它（或跑在 mock 上）时退回请求列表。
   */
  enabledFeatureSet;
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
    this.native = e, this.descriptor = n.descriptor, this.label = n.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = n.adapterInfo, this.requestedLimits = n.resolvedLimits, this.debug = n.descriptor.debug ?? !1, this.enabledFeatures = [...n.descriptor.requiredFeatures ?? []], this.enabledFeatureSet = Mp(e, this.enabledFeatures), this.features = new Sf(n.adapterFeatures), this.limits = Us(e.limits), this.defaultSampleCount = at(
      n.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = it(`webgpu:${this.label}`);
    let r = () => {
    };
    this.lost = new Promise((i) => {
      r = i;
    }), this.resolveLost = r, this.queue = new Lp(this), e.onuncapturederror = (i) => {
      this.reportError(Cp(i.error));
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
  /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
  get trackedResourceCount() {
    return this.resources.size;
  }
  /**
   * 该 feature 是否**已经在本设备上启用**（不只是 adapter 支持）。
   *
   * 需要 feature 的能力（timestamp 查询等）必须查这个而不是 `features.has()`，
   * 否则会出现「adapter 支持 → 我们以为能用 → 原生校验失败」的静默失效。
   */
  hasEnabledFeature(e) {
    return this.enabledFeatureSet.has(e);
  }
  /**
   * GPU 时间戳的「纳秒 / 刻度」换算系数。
   *
   * 优先读 `queue.getTimestampPeriod()`（规范接口），再退回 `queue.timestampPeriod` 属性。
   * 本仓库实测的 Chrome（2025 年的 Windows 版本）两者都没有暴露，此时按规范默认值 1 处理 ——
   * 也就是刻度本身就是纳秒。**绝不能**因为拿不到这个值就把刻度直接当纳秒用而不做说明：
   * 那样在其它实现（例如 period 是 83.33 的某些移动 GPU）上会得到系统性偏小的数字。
   */
  get timestampPeriod() {
    const e = this.native.queue;
    if (typeof e.getTimestampPeriod == "function") {
      const n = e.getTimestampPeriod();
      if (typeof n == "number" && Number.isFinite(n) && n > 0) return n;
    }
    return typeof e.timestampPeriod == "number" && Number.isFinite(e.timestampPeriod) && e.timestampPeriod > 0 ? e.timestampPeriod : 1;
  }
  /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
  nextResourceId(e) {
    return B(e);
  }
  /* ---------------------------------------------------------------- 资源 */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(new ks(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(me.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new ar(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new qs(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new js(this, e));
  }
  /**
   * 读回 query set 的结果：`resolveQuerySet` → `copyBufferToBuffer` → `mapAsync`。
   *
   * 两个中转 buffer 都通过 `this.createBuffer()` 创建，因此被设备的资源追踪覆盖：
   * 正常路径由 `QueryResult.read()` 销毁，忘了读则在 `device.dispose()` 时统一释放。
   */
  readQuerySet(e, n = {}) {
    this.assertUsable("readQuerySet"), et(e, `Device "${this.label}".readQuerySet(querySet)`);
    const r = n.firstQuery ?? 0;
    Te(r, "QuerySetReadOptions.firstQuery");
    const i = n.queryCount ?? e.count - r;
    if (!Number.isInteger(i) || i <= 0)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ${String(i)}.`
      );
    if (r + i > e.count)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: range [${r}, ${r + i}) exceeds the query set "${e.label}" count ${e.count}.`
      );
    const s = n.label ?? `${e.label}:read`, a = i * 8, o = this.createBuffer({
      label: `${s}#resolve`,
      size: a,
      usage: C.QueryResolve | C.CopySrc
    }), c = this.createBuffer({
      label: `${s}#readback`,
      size: a,
      usage: C.MapRead | C.CopyDst
    }), l = this.createCommandEncoder({ label: s });
    try {
      l.resolveQuerySet(e, r, i, o, 0), l.copyBufferToBuffer(o, 0, c, 0, a), this.queue.submit([l.finish()]);
    } catch (h) {
      throw c.destroy(), o.destroy(), h;
    } finally {
      l.dispose();
    }
    return new np({
      type: e.type,
      count: i,
      timestampPeriod: this.timestampPeriod,
      staging: o,
      readback: c
    });
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new Xs(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new Hs(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(tt.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new ta(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new na(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new ra(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new _p(this, e));
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
    return (!r || r.disposed) && (r = this.track(new Pp(e)), this.canvasContexts.set(e, r)), (n !== void 0 || !r.configured) && r.configure({ ...n, device: this }), r;
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
      Pi(e);
    } catch (n) {
      this.logger.error(`failed to dispose some resources: ${String(n)}`);
    }
    this.errorCallbacks.clear(), this.native.destroy();
  }
  /* ---------------------------------------------------------------- 内部 */
  track(e) {
    return this.resources.add(e), e;
  }
  /**
   * 资源在 `destroy()` / `dispose()` 时把自己从追踪集合里摘掉。
   *
   * 不做这一步的话，每帧 create/destroy 的工作负载（command encoder、buffer、texture、
   * bind group……）会让 `resources` 一直强引用这些已经释放的包装对象及其原生句柄，
   * 直到 `device.dispose()` 才释放 —— 这是实打实的泄漏。
   *
   * 幂等：对未追踪（或已摘掉）的资源调用是空操作。
   */
  untrack(e) {
    this.resources.delete(e);
  }
  assertUsable(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`);
    if (this.lostInfo)
      throw new xn(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfo.reason}): ` + this.lostInfo.message,
        { reason: this.lostInfo.reason }
      );
  }
  handleDeviceLost(e) {
    const n = e.reason === "destroyed" ? "destroyed" : "unknown", r = { reason: n, message: e.message };
    this.lostInfo = r, this.resolveLost(r), this._disposed || this.reportError(
      new xn(`[gpu-device-api] WebGPU device lost (${n}): ${e.message}`, { reason: n })
    );
  }
}
function Cp(t) {
  if (Ma(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), n = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return mn(t, "GPUValidationError") ? new u(n) : mn(t, "GPUOutOfMemoryError") ? new Fa(n) : mn(t, "GPUInternalError") ? new K(n, { code: "INTERNAL_ERROR" }) : t instanceof Error ? new K(n, { code: "GPU_ERROR", cause: t }) : new K(n);
}
function mn(t, e) {
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
function Mp(t, e) {
  const n = Os(t.features);
  return n.size > 0 ? n : new Set(e);
}
class Ot {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, n) {
    this.native = e, this.options = n, this.info = vf(e), this.features = Os(e.features), this.limits = Us(e.limits), this.featureNames = [...this.features].sort();
  }
  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions() {
    return this.options;
  }
  /** 当前环境是否暴露 WebGPU。 */
  static isSupported() {
    return Rr();
  }
  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(e = {}) {
    const n = await yf(e);
    return n ? new Ot(n, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const n = await Ot.request(e);
    if (n) return n;
    throw Rr() ? new u(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new u(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const n = $i(this.limits, e.requiredLimits, "webgpu"), r = xf(
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
    return new sa(s, {
      descriptor: e,
      resolvedLimits: n,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function Fp(t) {
  return t.canvas ? t.canvas : aa();
}
function Rp() {
  return aa();
}
function aa() {
  if (typeof document < "u") {
    const t = document.createElement("canvas");
    return t.width = 1, t.height = 1, t;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
const Fn = Symbol("timeout");
async function jr(t, e) {
  let n;
  try {
    return await Promise.race([
      t,
      new Promise((r) => {
        n = setTimeout(() => r(Fn), e);
      })
    ]);
  } finally {
    n !== void 0 && clearTimeout(n);
  }
}
const $t = 3e3;
class Bp {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    try {
      const n = await jr(
        navigator.gpu.requestAdapter({
          powerPreference: e.powerPreference ?? "high-performance",
          forceFallbackAdapter: e.forceFallbackAdapter ?? !1
        }),
        $t
      );
      return n === Fn ? {
        ok: !1,
        reason: `requestAdapter() 超过 ${$t}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`
      } : n ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (n) {
      return { ok: !1, reason: `requestAdapter() 抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const n = await jr(
      Ot.create({
        powerPreference: e.powerPreference,
        forceFallbackAdapter: e.forceFallbackAdapter
      }),
      $t
    );
    if (n === Fn)
      throw new u(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${$t}ms 没有返回。这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。
可以稍后重试，或改用 WebGL2 后端。`
      );
    return n;
  }
}
class Gp {
  kind = "webgl2";
  async isAvailable(e) {
    const n = Rp();
    if (!n)
      return { ok: !1, reason: "没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）" };
    try {
      return n.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（浏览器不支持 WebGL2）" };
    } catch (r) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    const n = Fp(e);
    if (!n)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return er.request({
      canvas: n,
      contextAttributes: e.contextAttributes
    });
  }
}
let gn = null;
function or() {
  return gn || (gn = new hh().register(new Bp()).register(new Gp())), gn;
}
const Op = ["webgpu", "webgl2"];
async function Up(t = {}) {
  const e = t.registry ?? or(), n = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? Op, r = await e.probeAll(n, t), i = r.find((s) => s.ok);
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
async function Qg(t, e = {}) {
  const r = (e.registry ?? or()).get(t);
  return r ? (await r.isAvailable(e)).ok : !1;
}
async function Xg(t = {}) {
  return (await oa(t)).device;
}
async function oa(t = {}) {
  const e = t.logger ?? it("gpu-device-api"), n = t.registry ?? or(), r = await Up({
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
    const c = n.get(o);
    if (c)
      try {
        const l = await c.createAdapter({
          canvas: t.canvas,
          contextAttributes: t.contextAttributes,
          powerPreference: t.powerPreference,
          forceFallbackAdapter: t.forceFallbackAdapter
        }), h = await l.requestDevice({
          label: t.label,
          // 可选 feature 按 adapter 的实际能力过滤：不支持就不申请（而不是抛错）。
          requiredFeatures: Dp(t.requiredFeatures, t.optionalFeatures, l.features),
          requiredLimits: t.requiredLimits,
          debug: t.debug
        }), f = t.canvas ? h.createCanvasContext(t.canvas) : null;
        return o !== r.backend ? e.warn(
          `后端 ${r.backend} 初始化失败，已改用 ${o}。失败原因：${a[a.length - 1] ?? "未知"}`
        ) : o === "webgl2" && t.backend !== "webgl2" && e.info(`已回退到 WebGL2 后端：${r.reason}`), { device: h, adapter: l, backend: o, probes: r.probes, context: f };
      } catch (l) {
        const h = l.message;
        if (a.push(`${o} — ${h}`), !i) throw l;
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
function Dp(t, e, n) {
  if ((!t || t.length === 0) && (!e || e.length === 0)) return;
  const r = [];
  for (const i of t ?? [])
    r.includes(i) || r.push(i);
  for (const i of e ?? [])
    r.includes(i) || n.has(i) && r.push(i);
  return r;
}
const Qr = 16, Ip = 12, Ut = {
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
    size: Qr * 3,
    glsl: "mat3",
    wgsl: "mat3x3f",
    componentType: "f32",
    components: 9,
    columnStride: Qr,
    columnSize: Ip,
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
}, Xr = Object.keys(Ut);
function bn(t, e) {
  return Math.ceil(t / e) * e;
}
function Vp(t) {
  const e = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(t);
  if (e) {
    const r = e[1], i = Ut[r];
    if (!i)
      throw new u(
        `[gpu-device-api] 不支持的 uniform 元素类型「${r}」（出现在「${t}」里）。支持：${Xr.join("、")}。`
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
  if (!Ut[t])
    throw new u(
      `[gpu-device-api] 不支持的 uniform 类型「${t}」。支持：${Xr.join("、")}，以及 \`类型[N]\` 形式的数组。`
    );
  return { element: t, count: 1 };
}
const Np = /* @__PURE__ */ new Set([
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
]), kp = /^[A-Za-z_][A-Za-z0-9_]*$/;
class Qt {
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
      if (!kp.test(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」不是合法标识符。`);
      if (Np.has(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」是 WGSL 保留字，请换一个。`);
      const c = e[o], { element: l, count: h } = Vp(c), f = Ut[l], d = bn(s, f.align), p = f.size, m = h > 1 ? bn(f.size, 16) : f.size, g = f.columnStride === void 0 || f.columnStride === f.columnSize, b = h > 1 ? m === f.size && g : g, w = h > 1 ? m * (h - 1) + f.size : f.size;
      i.push({ name: o, type: c, info: f, byteOffset: d, byteSize: p, byteStride: m, count: h, packed: b }), s = d + w, a = Math.max(a, f.align, h > 1 ? 16 : 0);
    }
    this.fields = i, this.fieldByName = new Map(i.map((o) => [o.name, o])), this.byteLength = bn(s, a), this.key = `${this.structName}|${this.group}|${this.binding}|${r.map((o) => `${o}:${e[o]}`).join(",")}`;
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
const Yr = /* @__PURE__ */ new Map();
function la(t, e) {
  const n = new Qt(t, e), r = Yr.get(n.key);
  return r || (Yr.set(n.key, n), n);
}
function Rn(t, e, n, r) {
  return t === "i32" ? new Int32Array(e, n, r) : t === "u32" ? new Uint32Array(e, n, r) : new Float32Array(e, n, r);
}
function Hr(t, e, n, r, i) {
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
      return o || (o = Rn(t.info.componentType, e, t.byteOffset + a * n, r), s[a] = o), o;
    },
    set(a) {
      let o = 0;
      for (let c = 0; c < i; c++) {
        const l = this.at(c);
        for (let h = 0; h < r && o < a.length; h++, o++)
          l[h] = a[o];
      }
    },
    get(a) {
      const o = i * r, c = a ?? Rn(t.info.componentType, new ArrayBuffer(o * 4), 0, o);
      let l = 0;
      for (let h = 0; h < i; h++) {
        const f = this.at(h);
        for (let d = 0; d < r; d++, l++)
          c[l] = f[d];
      }
      return c;
    }
  };
}
class Zr {
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
    this.layout = e instanceof Qt ? e : la(e, n), this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16)), this.bytesView = new Uint8Array(this.buffer, 0, this.layout.byteLength);
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
      return Rn(
        e.info.componentType,
        this.buffer,
        e.byteOffset,
        e.count * e.info.components
      );
    if (e.info.columnStride !== void 0) {
      const n = (e.info.columnSize ?? e.byteSize) / 4;
      return Hr(
        e,
        this.buffer,
        e.info.columnStride,
        n,
        e.info.columns ?? 1
      );
    }
    return Hr(e, this.buffer, e.byteStride, e.info.components, e.count);
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
const Kr = /* @__PURE__ */ new WeakMap(), ca = /* @__PURE__ */ new WeakMap();
function zp(t) {
  return ca.get(t) ?? t;
}
function Wp(t) {
  const e = Kr.get(t);
  if (e) return e;
  const n = /* @__PURE__ */ new Map(), r = new Proxy(t, {
    get(i, s, a) {
      if (typeof s == "string" && i.has(s))
        return i.field(s);
      const o = Reflect.get(i, s, i);
      if (typeof o == "function") {
        let c = n.get(s);
        return c === void 0 && (c = o.bind(i), n.set(s, c)), c;
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
  return Kr.set(t, r), ca.set(r, t), r;
}
function qp(t, e) {
  const n = t instanceof Qt ? new Zr(t) : new Zr(t, e);
  return Wp(n);
}
const wn = "/*%uniforms%*/", Jr = "/*%attributes%*/", yn = "/*%textures%*/", jp = {
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
function Qp(t, e, n) {
  const r = e === "cube" ? "samplerCube" : e === "3d" ? "sampler3D" : e === "2d-array" ? "sampler2DArray" : "sampler2D";
  return n ? r === "sampler2D" ? "sampler2DShadow" : r === "samplerCube" ? "samplerCubeShadow" : r === "sampler2DArray" ? "sampler2DArrayShadow" : r : t === "sint" ? `i${r}` : t === "uint" ? `u${r}` : r;
}
function Xp(t, e) {
  return t === "depth" ? e === "cube" ? "texture_depth_cube" : e === "2d-array" ? "texture_depth_2d_array" : "texture_depth_2d" : `${e === "cube" ? "texture_cube" : e === "3d" ? "texture_3d" : e === "2d-array" ? "texture_2d_array" : "texture_2d"}<${t === "sint" ? "i32" : t === "uint" ? "u32" : "f32"}>`;
}
function vn(t, e) {
  let n = t;
  const r = [];
  for (const s of e)
    s.text && (n.includes(s.placeholder) ? n = n.split(s.placeholder).join(s.text) : r.push(s.text));
  return `${r.length > 0 ? `${r.join(`

`)}

` : ""}${n.trim()}
`;
}
class Xt {
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
    this.attributes = n.map(([d, p], m) => {
      const g = typeof p == "string" ? { format: p, stepMode: "vertex" } : p;
      return { name: d, format: g.format, location: m, stepMode: g.stepMode ?? "vertex" };
    }), e.uniforms instanceof Qt ? this.uniforms = e.uniforms : e.uniforms ? this.uniforms = la(e.uniforms) : this.uniforms = null;
    const r = (e.textures ?? []).map(
      (d) => typeof d == "string" ? { name: d } : d
    );
    this.textures = r.map((d, p) => {
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
      (d) => `uniform ${Qp(d.sampleType, d.viewDimension, d.comparison)} ${d.name};`
    ).join(`
`), o = this.attributes.map((d) => `layout(location = ${d.location}) in ${La(d.format)} ${d.name};`).join(`
`);
    if (this.glsl = {
      vs: vn(e.glsl.vs, [
        { placeholder: wn, text: s },
        { placeholder: Jr, text: o },
        { placeholder: yn, text: a }
      ]),
      fs: vn(e.glsl.fs, [
        { placeholder: wn, text: s },
        { placeholder: yn, text: a }
      ])
    }, e.fragmentOutput !== !1) {
      const d = e.fragmentOutput ?? "fragColor";
      new RegExp(
        `\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${d}\\b`
      ).test(this.glsl.fs) || (this.glsl.fs = `layout(location = 0) out vec4 ${d};
${this.glsl.fs}`);
    }
    const c = e.wgsl, l = this.uniforms ? this.uniforms.wgslDeclaration() : "", h = this.textures.map((d) => {
      const p = d.comparison && d.sampleType === "depth" ? "sampler_comparison" : "sampler";
      return `@group(${i}) @binding(${d.binding}) var ${d.name}: ${Xp(d.sampleType, d.viewDimension)};
@group(${i}) @binding(${d.samplerBinding}) var ${d.samplerName}: ${p};`;
    }).join(`
`), f = this.attributes.length > 0 ? `struct VertexInput {
${this.attributes.map((d) => `  @location(${d.location}) ${d.name}: ${Ca(d.format)},`).join(`
`)}
}` : "";
    this.wgsl = vn(c, [
      { placeholder: wn, text: l },
      { placeholder: Jr, text: f },
      { placeholder: yn, text: h }
    ]);
  }
  /** 创建一个材质。 */
  static create(e) {
    return new Xt(e);
  }
  /**
   * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
   * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
   */
  vertexBufferLayouts() {
    return this.attributes.map((e) => ({
      arrayStride: Ae(e.format).byteSize,
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
    const e = qp(this.uniforms);
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
      const n = jp[e];
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
      type: O.Uniform,
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
          type: O.Texture,
          name: a.name,
          texture: { sampleType: a.sampleType, viewDimension: a.viewDimension }
        }), r.push({
          binding: a.samplerBinding,
          visibility: 3,
          type: a.comparison && a.sampleType === "depth" ? O.ComparisonSampler : O.Sampler,
          name: a.samplerName,
          sampler: { type: a.comparison ? "comparison" : "filtering" }
        });
    return r.length === 0 ? null : e.createBindGroupLayout({ label: `${this.name}:group${n}`, entries: r });
  }
}
function Yp(t) {
  return Xt.create(t);
}
const Hp = 72;
class Zp {
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
    this.device = e, this.layout = n, this.label = r.label ?? `uniformArena:${n.structName}`, this.align = Math.max(1, e.limits.minUniformBufferOffsetAlignment), this.slotSize = ei(Math.max(n.byteLength, 16), this.align), this.maxCapacity = r.maxCapacity ?? 16 * 1024 * 1024, this.capacityValue = Math.max(r.initialCapacity ?? 64 * 1024, this.slotSize), this.bufferValue = this.createBuffer(this.capacityValue);
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
      size: ei(e, 4),
      usage: Hp
    });
  }
}
class Kp {
  device;
  arenas = /* @__PURE__ */ new Map();
  options;
  constructor(e, n = {}) {
    this.device = e, this.options = n;
  }
  /** 取得（或创建）某个布局的 arena。 */
  acquire(e) {
    let n = this.arenas.get(e.key);
    return n || (n = new Zp(this.device, e, this.options), this.arenas.set(e.key, n)), n;
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
function ei(t, e) {
  return Math.ceil(t / e) * e;
}
const Jp = 40, em = 24, tm = Object.freeze({
  position: "float32x3",
  normal: "float32x3",
  uv: "float32x2",
  uv1: "float32x2",
  color: "float32x4",
  tangent: "float32x4",
  joints: "uint16x4",
  weights: "float32x4"
});
class Yt {
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
    for (const [d, p] of s)
      p && i.set(d, { data: p });
    for (const [d, p] of Object.entries(n.attributes ?? {}))
      i.set(d, ArrayBuffer.isView(p) ? { data: p } : p);
    if (i.size === 0)
      throw new u(`[gpu-device-api] 几何体「${r}」至少要有一个顶点属性。`);
    let a = n.vertexCount ?? 0, o = null;
    for (const [d, p] of i) {
      const m = p.format ?? ti(d, p.data), g = Math.floor(p.data.byteLength / Ae(m).byteSize);
      p.perInstance ? o = o === null ? g : Math.min(o, g) : g > a && (a = g);
    }
    if (a <= 0)
      throw new u(
        `[gpu-device-api] 几何体「${r}」无法推断顶点数：至少要有一个按顶点步进的属性（实例属性只描述实例，不决定顶点数），并检查属性数据是否为空。`
      );
    const c = /* @__PURE__ */ new Map();
    for (const [d, p] of i) {
      const m = p.format ?? ti(d, p.data), g = Ae(m);
      if (p.data.byteLength % g.byteSize !== 0)
        throw new u(
          `[gpu-device-api] 几何体「${r}」的属性「${d}」数据长度 ${p.data.byteLength} 字节不是其格式 ${m}（${g.byteSize} 字节）的整数倍。`
        );
      const b = a * g.byteSize;
      if (!p.perInstance && p.data.byteLength < b)
        throw new u(
          `[gpu-device-api] 几何体「${r}」的属性「${d}」只有 ${p.data.byteLength} 字节，但按顶点数 ${a} 需要 ${b} 字节。所有属性必须提供同样多的顶点（只有 \`perInstance: true\` 的实例属性可以少于顶点数）。`
        );
      const w = e.createBuffer({
        label: `${r}:${d}`,
        // WebGPU 要求 buffer 大小是 4 的倍数，这里统一对齐。
        size: ni(p.data.byteLength, 4),
        usage: Jp
      });
      e.queue.writeBuffer(w, 0, p.data), c.set(d, {
        name: d,
        format: m,
        byteStride: g.byteSize,
        components: g.components,
        perInstance: p.perInstance ?? !1,
        buffer: w
      });
    }
    let l = null, h = null, f = 0;
    if (n.indices && n.indices.length > 0) {
      const d = nm(n.indices, a, r);
      h = d instanceof Uint32Array ? "uint32" : "uint16", f = d.length, l = e.createBuffer({
        label: `${r}:indices`,
        size: ni(d.byteLength, 4),
        usage: em
      }), e.queue.writeBuffer(l, 0, d);
    }
    return new Yt({
      label: r,
      topology: n.topology ?? "triangle-list",
      attributes: c,
      vertexCount: a,
      instanceCount: o,
      indexBuffer: l,
      indexFormat: h,
      indexCount: f
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
function ti(t, e) {
  const n = tm[t];
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
function nm(t, e, n) {
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
  return Ea(e) === "uint32" ? Uint32Array.from(r) : Uint16Array.from(r);
}
function ni(t, e) {
  return Math.ceil(t / e) * e;
}
function Yg(t, e) {
  return Yt.create(t, e);
}
class nt {
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
    this.label = e.label, this.texture = e.texture, this.view = e.view, this.sampler = e.sampler, this.width = e.width, this.height = e.height, this.format = e.format, this.mipLevelCount = e.mipLevelCount, this.id = B("gfxTexture");
  }
  /** 创建纹理（含可选 mip 链）。 */
  static create(e, n) {
    const r = n.label ?? "texture", i = n.format ?? "rgba8unorm", s = n.flipY ?? Bn(n.data), a = n.mipmaps ?? (Bn(n.data) && i === "rgba8unorm");
    if (i !== "rgba8unorm")
      throw new u(
        `[gpu-device-api] 便捷层的纹理目前只支持 rgba8unorm（收到「${i}」）。需要其它格式请直接用 core 的 device.createTexture() + queue.writeTexture()。`
      );
    const o = rm(n.data, n.width, n.height, s), c = a ? im(o.data, o.width, o.height) : [o], l = {
      label: r,
      size: { width: o.width, height: o.height },
      format: i,
      mipLevelCount: c.length,
      usage: Ba(0) | v.CopyDst
    }, h = e.createTexture(l);
    for (let d = 0; d < c.length; d++) {
      const p = c[d];
      e.queue.writeTexture(
        { texture: h, mipLevel: d, origin: { x: 0, y: 0, z: 0 } },
        p.data,
        { offset: 0, bytesPerRow: p.width * 4, rowsPerImage: p.height },
        { width: p.width, height: p.height, depthOrArrayLayers: 1 }
      );
    }
    const f = e.createSampler({
      label: `${r}:sampler`,
      addressModeU: n.wrapS ?? n.wrap ?? "clamp-to-edge",
      addressModeV: n.wrapT ?? n.wrap ?? "clamp-to-edge",
      magFilter: n.magFilter ?? "linear",
      minFilter: n.minFilter ?? "linear",
      mipmapFilter: c.length > 1 ? "linear" : "nearest"
    });
    return new nt({
      device: e,
      label: r,
      texture: h,
      view: h.createView(),
      sampler: f,
      width: o.width,
      height: o.height,
      format: i,
      mipLevelCount: c.length
    });
  }
  /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
  static solid(e, n) {
    return nt.create(e, {
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
function Bn(t) {
  if (!t || typeof t != "object") return !1;
  const e = t.constructor?.name ?? "";
  return e === "ImageBitmap" || e === "HTMLImageElement" || e === "HTMLCanvasElement" || e === "OffscreenCanvas" || e === "ImageData" || e === "VideoFrame" || e === "HTMLVideoElement";
}
function rm(t, e, n, r) {
  if (!Bn(t)) {
    const f = t, d = new Uint8Array(f.buffer, f.byteOffset, f.byteLength), p = e ?? 0, m = n ?? 0;
    if (p <= 0 || m <= 0)
      throw new u(
        "[gpu-device-api] 用原始像素创建纹理时必须给出 width 与 height（无法从字节数推断）。"
      );
    if (d.byteLength < p * m * 4)
      throw new u(
        `[gpu-device-api] 纹理数据只有 ${d.byteLength} 字节，但 ${p}x${m} 的 RGBA8 需要 ${p * m * 4} 字节。`
      );
    return { data: r ? ri(d.subarray(0, p * m * 4), p, m) : d.subarray(0, p * m * 4), width: p, height: m };
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
  const c = o.getContext("2d");
  if (!c)
    throw new u("[gpu-device-api] 无法取得 2D context，图片解码失败。");
  c.drawImage(t, 0, 0, s, a);
  const l = c.getImageData(0, 0, s, a), h = new Uint8Array(l.data.buffer.slice(0));
  return { data: r ? ri(h, s, a) : h, width: s, height: a };
}
function ri(t, e, n) {
  const r = e * 4, i = new Uint8Array(t.byteLength);
  for (let s = 0; s < n; s++) {
    const a = s * r, o = (n - 1 - s) * r;
    i.set(t.subarray(a, a + r), o);
  }
  return i;
}
function im(t, e, n) {
  const r = [{ data: t, width: e, height: n }];
  let i = t, s = e, a = n;
  for (; s > 1 || a > 1; ) {
    const o = Math.max(1, s >> 1), c = Math.max(1, a >> 1), l = new Uint8Array(o * c * 4);
    for (let h = 0; h < c; h++) {
      const f = Math.min(h * 2, a - 1), d = Math.min(h * 2 + 1, a - 1);
      for (let p = 0; p < o; p++) {
        const m = Math.min(p * 2, s - 1), g = Math.min(p * 2 + 1, s - 1), b = (f * s + m) * 4, w = (f * s + g) * 4, S = (d * s + m) * 4, $ = (d * s + g) * 4, A = (h * o + p) * 4;
        for (let _ = 0; _ < 4; _++)
          l[A + _] = i[b + _] + i[w + _] + i[S + _] + i[$ + _] >> 2;
      }
    }
    r.push({ data: l, width: o, height: c }), i = l, s = o, a = c;
  }
  return r;
}
const ua = "timestamp-query", ii = 32, si = 8, sm = 4;
class Ke {
  /** 每个环形槽占用几个 query 下标：WebGPU 需要「开始 + 结束」，WebGL2 只需要一个区间结果。 */
  slotStride;
  frames;
  delay;
  backend;
  device;
  querySet;
  frameIndex = 0;
  /** 每个环形位置最近一次真正写入的槽位；null 表示那一帧没有写（见 {@link selectSlot}）。 */
  recentSlots;
  /** 正在被读回的槽位：既不重写，也不重复读。 */
  busySlots = /* @__PURE__ */ new Set();
  /** 本帧选定的槽位；{@link slotChosen} 区分「还没选」与「选了但没有空槽」。 */
  frameSlot = null;
  slotChosen = !1;
  inFlight = 0;
  lastMs = null;
  sampleCount = 0;
  skippedCount = 0;
  lastError = null;
  _disposed = !1;
  /**
   * 该设备是否具备 GPU 计时能力。
   *
   * WebGL2 后端把「拿到 `EXT_disjoint_timer_query_webgl2`」映射成同名 feature（见
   * `glCapabilities.queryGlFeatures`），所以两个后端可以同一句话判断。
   * WebGPU 上它只表示 adapter 支持 —— 设备是否真的启用了该 feature 由 `createQuerySet()` 决定，
   * 那正是 {@link GpuTiming} 构造函数会立刻失败并给出精确原因的地方。
   */
  static isAvailable(e) {
    return e.features.has(ua);
  }
  constructor(e, n = {}) {
    this.device = e, this.backend = e.backend, this.frames = ai(n.frames ?? ii, ii, 4, 256), this.delay = ai(n.delay ?? si, si, 1, this.frames - 1), this.slotStride = e.backend === "webgl2" ? 1 : 2, this.recentSlots = new Array(this.frames).fill(null), this.querySet = e.createQuerySet({
      label: "gfx-gpu-timing",
      type: ze.Timestamp,
      count: this.frames * this.slotStride
    });
  }
  get disposed() {
    return this._disposed;
  }
  get stats() {
    return {
      enabled: !this._disposed,
      available: Ke.isAvailable(this.device),
      frames: this.frames,
      delay: this.delay,
      gpuFrameTimeMs: this.lastMs,
      samples: this.sampleCount,
      skipped: this.skippedCount,
      inFlight: this.inFlight,
      error: this.lastError
    };
  }
  /**
   * 本帧开始时的钩子：WebGPU 在这里写「帧开始」时间戳。
   *
   * WebGL2 不用（它的计时由 pass 的 `timestampWrites` 包住整个通道）。
   * 本帧没有空闲槽位时是空操作 —— 那一帧就没有 GPU 样本，这是刻意的取舍：
   * 宁可少一个样本，也不要覆盖一个正在读的槽位而拿到错的数字。
   */
  beforeFrame(e) {
    if (this.slotStride < 2) return;
    const n = this.selectSlot();
    n !== null && e.writeTimestamp(this.querySet, n * this.slotStride);
  }
  /**
   * 本帧结束时的钩子：WebGPU 写「帧结束」时间戳。
   *
   * 必须在所有 pass 都 `end()` 之后、`finish()` 之前调用（WebGPU 规定 encoder 上写时间戳时
   * 不能有打开的 pass）。
   */
  afterFrameEncoding(e) {
    if (this.slotStride < 2) return;
    const n = this.selectSlot();
    n !== null && e.writeTimestamp(this.querySet, n * this.slotStride + 1);
  }
  /**
   * 给本帧的 render pass 用的 `timestampWrites`；WebGPU 不需要（它用 encoder 级时间戳），
   * 因此返回 undefined。
   */
  passTimestampWrites() {
    if (this.slotStride !== 1) return;
    const e = this.selectSlot();
    if (e !== null)
      return { querySet: this.querySet, beginningOfPassWriteIndex: e * this.slotStride };
  }
  /**
   * 帧提交之后调用：延迟 `delay` 帧读回一次（如果条件允许）。
   *
   * 注意调用时机必须在 `device.queue.submit()` 之后 —— 读回本身会再提交一个小 command buffer
   * （WebGPU）或轮询 GL 查询（WebGL2），队列顺序保证它看到的是已经写完的时间戳。
   */
  onFrameSubmitted() {
    if (this._disposed) return;
    const e = this.frameIndex;
    this.recentSlots[e % this.frames] = this.slotChosen ? this.frameSlot : null, this.frameIndex += 1, this.frameSlot = null, this.slotChosen = !1;
    const n = e - this.delay;
    if (n < 0) {
      this.skippedCount += 1;
      return;
    }
    if (this.inFlight >= sm) {
      this.skippedCount += 1;
      return;
    }
    const r = this.recentSlots[n % this.frames];
    if (r == null) {
      this.skippedCount += 1;
      return;
    }
    if (this.busySlots.has(r)) {
      this.skippedCount += 1;
      return;
    }
    const i = r * this.slotStride, s = this.device.readQuerySet(this.querySet, {
      label: `gfx-gpu-timing:frame${n}`,
      firstQuery: i,
      queryCount: this.slotStride
    }), a = s.timestampPeriod;
    this.busySlots.add(r), this.inFlight += 1, s.read().then((o) => {
      const c = o[0] ?? 0n, l = this.slotStride === 2 ? o[1] ?? c : c, h = this.slotStride === 2 ? c : 0n;
      this.lastMs = Da(h, l, a), this.sampleCount += 1;
    }).catch((o) => {
      this.lastError = o instanceof Error ? o.message : String(o);
    }).finally(() => {
      this.busySlots.delete(r), this.inFlight -= 1;
    });
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.querySet.destroy());
  }
  /**
   * 选定本帧要写的槽位：从环形位置开始往后找第一个空闲的；都忙则返回 null（本帧不写时间戳）。
   *
   * 同一帧里 `beforeFrame` / `afterFrameEncoding` / `passTimestampWrites` 可能各问一次，
   * 所以要记住本帧的选择，不能让它们算出不同的槽位。
   */
  selectSlot() {
    if (this.slotChosen) return this.frameSlot;
    this.slotChosen = !0, this.frameSlot = null;
    for (let e = 0; e < this.frames; e++) {
      const n = (this.frameIndex + e) % this.frames;
      if (!this.busySlots.has(n)) {
        this.frameSlot = n;
        break;
      }
    }
    return this.frameSlot;
  }
}
function ai(t, e, n, r) {
  return Number.isFinite(t) ? Math.max(n, Math.min(Math.trunc(t), r)) : e;
}
function am(t) {
  const e = t instanceof Error ? t.message : String(t);
  return e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
}
const om = re();
class ha {
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
    frameTime: 0,
    gpuFrameTime: null
  };
  /** GPU 计时；`enableGpuTiming()` 之前是 null（默认关闭：需要额外 feature、要读回、有开销）。 */
  gpuTimingValue = null;
  /** 打开 GPU 计时失败的原因；供 `gpuTiming.error` 与诊断使用。 */
  gpuTimingError = null;
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
  normalMatrixScratch = Bi();
  _disposed = !1;
  constructor(e) {
    this.backend = e.backend, this.device = e.device, this.context = e.context, this.canvas = e.canvas, this.logger = e.logger, this.camera = e.options.camera ?? null, this._clearColor = e.options.clearColor ?? "#0b0e13", this._pixelRatio = e.options.pixelRatio ?? e.context.pixelRatio, this._width = e.context.width, this._height = e.context.height, this.arenaPool = new Kp(e.device);
  }
  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(e) {
    const n = e.logger ?? it("gpu-device-api/gfx"), r = {
      antialias: e.antialias ?? !0,
      alpha: e.alpha ?? !1,
      depth: e.depth ?? !0,
      stencil: !1,
      premultipliedAlpha: !0,
      preserveDrawingBuffer: !1,
      powerPreference: e.powerPreference ?? "high-performance",
      ...e.contextAttributes
    }, i = r.depth !== !1, s = await oa({
      canvas: e.canvas,
      backend: e.backend ?? "auto",
      label: "gfx-renderer",
      contextAttributes: r,
      // GPU 计时需要 `timestamp-query`，而 WebGPU 只能在 requestDevice 时申请。
      // 用 optionalFeatures：后端不支持时忽略而不是让整个 Renderer.create 失败
      //（真正的失败原因由 enableGpuTiming() → createQuerySet() 给出）。
      ...e.requiredFeatures ? { requiredFeatures: e.requiredFeatures } : {},
      ...e.gpuTiming ? { optionalFeatures: [ua] } : {}
    });
    if (!s.context)
      throw new u("[gpu-device-api] 创建 Renderer 必须提供 canvas。");
    const a = e.sampleCount ?? (s.backend === "webgpu" && (e.antialias ?? !0) ? 4 : void 0);
    (a !== void 0 || !i) && s.device.createCanvasContext(e.canvas, {
      ...a !== void 0 ? { sampleCount: a } : {},
      ...i ? {} : { depth: !1 }
    });
    const o = new ha({
      backend: s.backend,
      device: s.device,
      context: s.context,
      canvas: e.canvas,
      logger: n,
      options: e
    });
    if (e.pixelRatio && o.setPixelRatio(e.pixelRatio), o.resize(), e.gpuTiming)
      try {
        o.enableGpuTiming(typeof e.gpuTiming == "object" ? e.gpuTiming : {});
      } catch (c) {
        o.gpuTimingError = am(c), n.warn(`GPU 计时不可用：${o.gpuTimingError}`);
      }
    return o;
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
    const n = Yt.create(this.device, e);
    return this.geometries.add(n), n;
  }
  /** 创建（或直接登记）一个材质。 */
  createMaterial(e) {
    const n = e instanceof Xt ? e : Yp(e);
    return this.materials.has(n) || this.materials.set(n, {
      material: n,
      layout: n.createPipelineLayout(this.device),
      pipeline: null,
      // 还原掉 createUniforms() 的 Proxy：渲染器的每 draw 写入路径直接操作原始对象，
      // 免得每次 set()/has() 都穿一遍 Proxy 陷阱（见 unwrapUniforms 的说明）。
      values: n.uniforms ? zp(n.createUniforms()) : null
    }), n;
  }
  createTexture(e) {
    const n = nt.create(this.device, e);
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
  /* ------------------------------------------------------------------ GPU 计时 --------------- */
  /** 当前后端 + 设备是否具备 GPU 计时能力（不创建设备资源，可先判断再决定要不要开）。 */
  get supportsGpuTiming() {
    return Ke.isAvailable(this.device);
  }
  /**
   * GPU 计时状态。默认 `enabled: false`。
   *
   * 读 `gpuFrameTimeMs` 拿到最近一次成功读回的 GPU 帧耗时（毫秒），`samples` / `skipped`
   * 说明样本数量与跳过的读回次数；失败原因在 `error` 里。
   */
  get gpuTiming() {
    return this.gpuTimingValue ? this.gpuTimingValue.stats : {
      enabled: !1,
      available: Ke.isAvailable(this.device),
      frames: 0,
      delay: 0,
      gpuFrameTimeMs: null,
      samples: 0,
      skipped: 0,
      inFlight: 0,
      error: this.gpuTimingError
    };
  }
  /**
   * 打开 GPU 计时。
   *
   * 显式调用时**失败就抛错**（带 `[gpu-device-api] ` 前缀的英文消息，说明缺哪个 feature/扩展）——
   * 例如 WebGL2 上没有 `EXT_disjoint_timer_query_webgl2`、或 WebGPU 设备没启用 `timestamp-query`。
   * 想让失败静默降级请用 `Renderer.create({ gpuTiming: true })`（它会把原因写进 `gpuTiming.error`）。
   *
   * 实现方式是环形 query set + 延迟若干帧的异步读回，**不会每帧阻塞等待 GPU**；
   * 详见 `GpuTiming` 的说明。
   */
  enableGpuTiming(e = {}) {
    if (this.gpuTimingValue) return;
    const n = new Ke(this.device, e);
    this.gpuTimingValue = n, this.gpuTimingError = null;
  }
  /** 关闭 GPU 计时并释放 query set。 */
  disableGpuTiming() {
    this.gpuTimingValue?.destroy(), this.gpuTimingValue = null, this.statsValue.gpuFrameTime = null;
  }
  /* ------------------------------------------------------------------ 帧 --------------------- */
  beginFrame(e = {}) {
    this._inFrame && this.endFrame(), this.frameStart = typeof performance < "u" ? performance.now() : Date.now(), this.resize(), this.arenaPool.beginFrame(), this.updateCamera(), this.encoder = this.device.createCommandEncoder({ label: "gfx-frame" }), this.gpuTimingValue?.beforeFrame(this.encoder);
    const n = e.color ?? this._clearColor, r = this.createPassDescriptor(e, n);
    if (!r.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。");
    this.pass = this.encoder.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: r.colorAttachments,
      ...r.depthStencilAttachment ? { depthStencilAttachment: r.depthStencilAttachment } : {},
      // GPU 计时只标在本帧第一个通道上：单通道帧（beginFrame 的默认形态）就是整帧；
      // 多通道时 beginPass() 开的通道不写时间戳，避免把不同通道混进同一个样本。
      ...this.timestampWritesForPass()
    }), this.commandBuffers = [], this.statsValue.drawCalls = 0, this.statsValue.triangles = 0, this.statsValue.instances = 0, this.statsValue.pipelineSwitches = 0, this.currentPipeline = null, this._inFrame = !0;
  }
  endFrame() {
    if (!this._inFrame) return;
    this.pass?.end();
    const e = this.encoder;
    e && (this.gpuTimingValue && this.gpuTimingValue.afterFrameEncoding(e), this.commandBuffers.push(e.finish())), this.commandBuffers.length > 0 && this.device.queue.submit(this.commandBuffers);
    const n = typeof performance < "u" ? performance.now() : Date.now();
    this.statsValue.frameTime = n - this.frameStart, this.gpuTimingValue && (this.gpuTimingValue.onFrameSubmitted(), this.statsValue.gpuFrameTime = this.gpuTimingValue.stats.gpuFrameTimeMs), this.pass = null, this.encoder = null, this.commandBuffers = [], this._inFrame = !1;
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
  /** 取出（必要时创建）本帧第一个 render pass 的 GPU 计时写入点。 */
  timestampWritesForPass() {
    const e = this.gpuTimingValue?.passTimestampWrites();
    return e ? { timestampWrites: e } : {};
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
      if (this.applyCameraUniforms(i.values, r), r.uniforms.has("model") && i.values.set("model", n.model ?? om), this.updateNormalMatrix(i.values, r), n.uniforms)
        for (const [o, c] of Object.entries(n.uniforms))
          this.setIfPresent(i.values, o, c);
      const a = r.createUniformBindGroupLayout(this.device);
      if (a) {
        const o = this.arenaPool.acquire(r.uniforms), c = o.write(i.values);
        this.pass.setBindGroup(r.uniforms.group, o.bindGroup(a), [c]);
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
    }), this.statsValue.drawCalls += 1, this.statsValue.instances += n.instances ?? 1, this.statsValue.triangles += lm(e, n) * (n.instances ?? 1);
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
      this._disposed = !0, this._inFrame && this.endFrame(), this.gpuTimingValue?.destroy(), this.gpuTimingValue = null;
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
    Vn(this.normalMatrixScratch, r) || Gi(this.normalMatrixScratch), e.set("normalMatrix", this.normalMatrixScratch);
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
    const i = e.textures.map((l) => n[l.name] ?? this.getDefaultTexture()), s = `${e.name}|${i.map((l) => l.id).join(",")}`, a = this.bindGroups.get(s);
    if (a) return a;
    const o = e.textures.flatMap((l, h) => {
      const f = i[h];
      return [
        { binding: l.binding, resource: { view: f.view } },
        { binding: l.samplerBinding, resource: { sampler: f.sampler } }
      ];
    }), c = this.device.createBindGroup({
      label: `${e.name}:textures`,
      layout: r,
      entries: o
    });
    return this.bindGroups.set(s, c), c;
  }
  /** 缺省纹理（材质声明了纹理但调用方没给时用，避免绑到未定义数据）。 */
  getDefaultTexture() {
    return this.defaultTexture || (this.defaultTexture = nt.create(this.device, {
      label: "default-white",
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      mipmaps: !1
    })), this.defaultTexture;
  }
}
function lm(t, e) {
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
const cm = 1e-6, oi = R(), li = R();
function ke(t, e, n, r, i) {
  if (e === void 0) return pe(t, n, r, i);
  if (e.length < 3)
    throw new RangeError("[gpu-device-api] A vector option needs at least 3 components.");
  const s = e[0], a = e[1], o = e[2];
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(o))
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${s}, ${a}, ${o}).`);
  return pe(t, s, a, o);
}
function da(t) {
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function um(t, e, n) {
  if (!(t > 0) || t >= 180)
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${t}.`);
  if (!(e > 0))
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${e}.`);
  if (Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${n}.`);
}
function hm(t, e, n) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${t}.`);
  if (!Number.isFinite(e) || Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${e}, far = ${n}.`);
}
function fa(t) {
  if (le(oi, t.position, t.target), Ie(oi) < cm) {
    pe(li, t.target[0], t.target[1], t.target[2] + 1), $n(t.viewMatrix, li, t.target, t.up);
    return;
  }
  $n(t.viewMatrix, t.position, t.target, t.up);
}
class Hg {
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
  viewMatrix = re();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  projectionMatrixGL = re();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  projectionMatrixZO = re();
  projectionViewMatrix = re();
  constructor(e = {}) {
    this.position = ke(R(), e.position, 0, 0, 5), this.target = ke(R(), e.target, 0, 0, 0), this.up = ke(R(), e.up, 0, 1, 0), this.fov = e.fov ?? 60, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
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
    um(this.fov, this.near, this.far), fa(this);
    const e = ys(this.fov), n = da(this.aspect);
    qi(this.projectionMatrixGL, e, n, this.near, this.far), ji(this.projectionMatrixZO, e, n, this.near, this.far), Z(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
class Zg {
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
  viewMatrix = re();
  /** 裁剪空间 z ∈ [-1, 1]（WebGL2）的投影矩阵。 */
  projectionMatrixGL = re();
  /** 裁剪空间 z ∈ [0, 1]（WebGPU）的投影矩阵。 */
  projectionMatrixZO = re();
  projectionViewMatrix = re();
  constructor(e = {}) {
    this.position = ke(R(), e.position, 0, 0, 5), this.target = ke(R(), e.target, 0, 0, 0), this.up = ke(R(), e.up, 0, 1, 0), this.size = e.size ?? 2, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this.depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 按 `depthRange` 选出的那一套投影矩阵，返回的是另外两份矩阵之一本身（同一个对象）。
   */
  get projectionMatrix() {
    return this.depthRange === "zo" ? this.projectionMatrixZO : this.projectionMatrixGL;
  }
  /** 重新计算 view / projection / projectionView 三组矩阵。 */
  update() {
    hm(this.size, this.near, this.far), fa(this);
    const e = this.size / 2, n = e * da(this.aspect);
    Qi(this.projectionMatrixGL, -n, n, -e, e, this.near, this.far), Xi(this.projectionMatrixZO, -n, n, -e, e, this.near, this.far), Z(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
const ci = 1e-4, fe = 1e-6, dm = 0.95, Y = R(), ui = R(), hi = R();
function ye(t, e) {
  if (!Number.isFinite(t))
    throw new RangeError(`[gpu-device-api] ${e} must be a finite number, got ${t}.`);
  return t;
}
class Kg {
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
  panOffset = R();
  /** `reset()` 要恢复到的初始状态。 */
  initialPosition = R();
  initialTarget = R();
  previousPosition = R();
  previousTarget = R();
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
    if (this.camera = e, this.element = n, this.enabled = r.enabled ?? !0, this.enableRotate = r.enableRotate ?? !0, this.enableZoom = r.enableZoom ?? !0, this.enablePan = r.enablePan ?? !0, this.enableDamping = r.enableDamping ?? !0, this.dampingFactor = De(r.dampingFactor ?? 0.08, 0, 1), this.rotateSpeed = ye(r.rotateSpeed ?? 1, "options.rotateSpeed"), this.zoomSpeed = ye(r.zoomSpeed ?? 1, "options.zoomSpeed"), this.panSpeed = ye(r.panSpeed ?? 1, "options.panSpeed"), this.minDistance = ye(r.minDistance ?? 0.1, "options.minDistance"), this.maxDistance = ye(r.maxDistance ?? 1e3, "options.maxDistance"), this.minPolarAngle = ye(r.minPolarAngle ?? 0, "options.minPolarAngle"), this.maxPolarAngle = ye(r.maxPolarAngle ?? Math.PI, "options.maxPolarAngle"), this.minDistance <= 0)
      throw new RangeError(`[gpu-device-api] minDistance must be positive, got ${this.minDistance}.`);
    if (this.maxDistance < this.minDistance)
      throw new RangeError(`[gpu-device-api] maxDistance must not be smaller than minDistance, got ${this.maxDistance}.`);
    if (this.minPolarAngle < 0 || this.maxPolarAngle > Math.PI || this.minPolarAngle > this.maxPolarAngle)
      throw new RangeError(
        `[gpu-device-api] polar angles must satisfy 0 <= minPolarAngle <= maxPolarAngle <= PI, got ${this.minPolarAngle} and ${this.maxPolarAngle}.`
      );
    if (this.rotateSpeed < 0 || this.zoomSpeed < 0 || this.panSpeed < 0)
      throw new RangeError("[gpu-device-api] Speed options must be non-negative.");
    ae(this.initialPosition, e.position), ae(this.initialTarget, e.target), ae(this.previousPosition, e.position), ae(this.previousTarget, e.target), this.readSpherical(), this.element.addEventListener("pointerdown", this.onPointerDown), this.element.addEventListener("pointermove", this.onPointerMove), this.element.addEventListener("pointerup", this.onPointerUp), this.element.addEventListener("pointercancel", this.onPointerUp), this.element.addEventListener("wheel", this.onWheel, { passive: !1 }), this.element.addEventListener("contextmenu", this.onContextMenu);
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
    ae(this.previousPosition, r), ae(this.previousTarget, n), le(Y, r, n);
    let i = Ie(Y);
    i < fe ? i = this.minDistance : (this.theta = Math.atan2(Y[0], Y[2]), this.phi = Math.acos(De(Y[1] / i, -1, 1)));
    const s = Math.abs(this.deltaTheta) > fe || Math.abs(this.deltaPhi) > fe, a = Math.abs(this.scale - 1) > fe, o = Ie(this.panOffset) > fe;
    if (!s && !a && !o)
      return !1;
    const c = this.enableDamping ? this.dampingFactor : 1;
    this.theta += this.deltaTheta * c, this.phi += this.deltaPhi * c, this.phi = De(
      this.phi,
      Math.max(this.minPolarAngle, ci),
      Math.min(this.maxPolarAngle, Math.PI - ci)
    ), i = De(i * this.scale, this.minDistance, this.maxDistance), _t(n, n, this.panOffset, c);
    const l = Math.sin(this.phi) * i;
    pe(
      r,
      n[0] + l * Math.sin(this.theta),
      n[1] + Math.cos(this.phi) * i,
      n[2] + l * Math.cos(this.theta)
    ), this.enableDamping ? (this.deltaTheta *= 1 - this.dampingFactor, this.deltaPhi *= 1 - this.dampingFactor, Mt(this.panOffset, this.panOffset, 1 - this.dampingFactor)) : (this.deltaTheta = 0, this.deltaPhi = 0, Sn(this.panOffset)), this.scale = 1, e.update();
    const h = !Tn(r, this.previousPosition, fe), f = !Tn(n, this.previousTarget, fe);
    return h || f;
  }
  /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
  reset() {
    this.disposed || (ae(this.camera.position, this.initialPosition), ae(this.camera.target, this.initialTarget), this.deltaTheta = 0, this.deltaPhi = 0, this.scale = 1, Sn(this.panOffset), this.mode = "none", this.pinchDistance = 0, this.pointers.clear(), this.readSpherical(), this.camera.update());
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
    le(Y, this.camera.position, this.camera.target);
    const e = Ie(Y);
    e < fe || (this.theta = Math.atan2(Y[0], Y[2]), this.phi = Math.acos(De(Y[1] / e, -1, 1)));
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
    le(Y, r.position, r.target);
    const o = 2 * (Ie(Y) * Math.tan(ys(r.fov) / 2)) * this.panSpeed / s;
    pe(ui, i[0], i[4], i[8]), pe(hi, i[1], i[5], i[9]), _t(this.panOffset, this.panOffset, ui, -e * o), _t(this.panOffset, this.panOffset, hi, n * o);
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
    const n = Math.pow(dm, this.zoomSpeed);
    e.deltaY < 0 ? this.scale *= n : e.deltaY > 0 && (this.scale /= n);
  };
  onContextMenu = (e) => {
    !this.enabled || !this.enablePan || e.cancelable && e.preventDefault();
  };
}
const Oe = R();
function je() {
  return { position: [], normal: [], uv: [], index: [] };
}
function pa() {
  return { position: [], color: [] };
}
function ge(t, e, n, r, i, s, a, o, c) {
  pe(Oe, i, s, a), Dn(Oe, Oe), t.position.push(e, n, r), t.normal.push(Oe[0], Oe[1], Oe[2]), t.uv.push(o, c);
}
function F(t, e, n, r, i, s, a, o) {
  t.position.push(e, n, r), t.color.push(i, s, a, o);
}
function Qe(t) {
  return {
    position: Float32Array.from(t.position),
    normal: Float32Array.from(t.normal),
    uv: Float32Array.from(t.uv),
    indices: Uint32Array.from(t.index)
  };
}
function ma(t) {
  return {
    position: Float32Array.from(t.position),
    color: Float32Array.from(t.color)
  };
}
function ga(t) {
  return t.position.length / 3;
}
function j(t, e) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite positive number, got ${t}.`);
  return t;
}
function di(t, e) {
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite non-negative number, got ${t}.`);
  return t;
}
function H(t, e, n) {
  if (!Number.isInteger(t) || t < e)
    throw new RangeError(`[gpu-device-api] ${n} must be an integer greater than or equal to ${e}, got ${t}.`);
  return t;
}
const fm = [0.5, 0.5, 0.5, 1];
function pm(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius"), n = je();
  for (let r = 0; r < 3; r++) {
    const i = Math.PI / 2 + r * 2 * Math.PI / 3, s = Math.cos(i) * e, a = Math.sin(i) * e;
    ge(n, s, a, 0, 0, 0, 1, s / (2 * e) + 0.5, a / (2 * e) + 0.5);
  }
  return n.index.push(0, 1, 2), Qe(n);
}
function mm(t = {}) {
  const e = j(t.width ?? 1, "options.width"), n = j(t.height ?? 1, "options.height"), r = H(t.widthSegments ?? 1, 1, "options.widthSegments"), i = H(t.heightSegments ?? 1, 1, "options.heightSegments"), s = je(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const c = o / i, l = -n / 2 + c * n;
    for (let h = 0; h <= r; h++) {
      const f = h / r, d = -e / 2 + f * e;
      ge(s, d, l, 0, 0, 0, 1, f, c);
    }
  }
  for (let o = 0; o < i; o++)
    for (let c = 0; c < r; c++) {
      const l = o * a + c, h = l + 1, f = l + a + 1, d = l + a;
      s.index.push(l, h, f, l, f, d);
    }
  return Qe(s);
}
function Ue(t, e, n, r, i, s, a) {
  const o = ga(t), c = s + 1;
  for (let l = 0; l <= a; l++) {
    const h = l / a;
    for (let f = 0; f <= s; f++) {
      const d = f / s;
      ge(
        t,
        e[0] + n[0] * d + r[0] * h,
        e[1] + n[1] * d + r[1] * h,
        e[2] + n[2] * d + r[2] * h,
        i[0],
        i[1],
        i[2],
        d,
        h
      );
    }
  }
  for (let l = 0; l < a; l++)
    for (let h = 0; h < s; h++) {
      const f = o + l * c + h, d = f + 1, p = f + c + 1, m = f + c;
      t.index.push(f, d, p, f, p, m);
    }
}
function gm(t = {}) {
  const e = j(t.width ?? 1, "options.width"), n = j(t.height ?? 1, "options.height"), r = j(t.depth ?? 1, "options.depth"), i = H(t.widthSegments ?? 1, 1, "options.widthSegments"), s = H(t.heightSegments ?? 1, 1, "options.heightSegments"), a = H(t.depthSegments ?? 1, 1, "options.depthSegments"), o = e / 2, c = n / 2, l = r / 2, h = je();
  return Ue(h, [o, -c, -l], [0, n, 0], [0, 0, r], [1, 0, 0], s, a), Ue(h, [-o, -c, -l], [0, 0, r], [0, n, 0], [-1, 0, 0], a, s), Ue(h, [-o, c, -l], [0, 0, r], [e, 0, 0], [0, 1, 0], a, i), Ue(h, [-o, -c, -l], [e, 0, 0], [0, 0, r], [0, -1, 0], i, a), Ue(h, [-o, -c, l], [e, 0, 0], [0, n, 0], [0, 0, 1], i, s), Ue(h, [-o, -c, -l], [0, n, 0], [e, 0, 0], [0, 0, -1], s, i), Qe(h);
}
function bm(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius"), n = H(t.widthSegments ?? 32, 3, "options.widthSegments"), r = H(t.heightSegments ?? 16, 2, "options.heightSegments"), i = je(), s = n + 1;
  for (let a = 0; a <= r; a++) {
    const o = a / r, c = o * Math.PI, l = Math.sin(c), h = Math.cos(c);
    for (let f = 0; f <= n; f++) {
      const d = f / n, p = d * Math.PI * 2, m = l * Math.cos(p), g = h, b = l * Math.sin(p);
      ge(i, m * e, g * e, b * e, m, g, b, d, 1 - o);
    }
  }
  for (let a = 0; a < r; a++)
    for (let o = 0; o < n; o++) {
      const c = a * s + o, l = c + 1, h = c + s + 1, f = c + s;
      i.index.push(c, l, h, c, h, f);
    }
  return Qe(i);
}
function wm(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius"), n = j(t.tube ?? 0.2, "options.tube"), r = H(t.radialSegments ?? 16, 3, "options.radialSegments"), i = H(t.tubularSegments ?? 32, 3, "options.tubularSegments"), s = je(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const c = o / i, l = c * Math.PI * 2, h = Math.cos(l), f = Math.sin(l);
    for (let d = 0; d <= r; d++) {
      const p = d / r, m = p * Math.PI * 2, g = Math.cos(m), b = Math.sin(m), w = e + n * g, S = g * h, $ = b, A = g * f;
      ge(s, w * h, n * b, w * f, S, $, A, c, p);
    }
  }
  for (let o = 0; o < i; o++)
    for (let c = 0; c < r; c++) {
      const l = o * a + c, h = l + 1, f = l + a + 1, d = l + a;
      s.index.push(l, h, f, l, f, d);
    }
  return Qe(s);
}
function fi(t, e, n, r, i) {
  const s = ga(t);
  ge(t, 0, e, 0, 0, r, 0, 0.5, 0.5);
  for (let a = 0; a <= i; a++) {
    const o = a / i * Math.PI * 2, c = Math.sin(o), l = Math.cos(o);
    ge(t, n * c, e, n * l, 0, r, 0, 0.5 + c * 0.5, 0.5 + l * 0.5);
  }
  for (let a = 0; a < i; a++) {
    const o = s + 1 + a, c = o + 1;
    r > 0 ? t.index.push(s, o, c) : t.index.push(s, c, o);
  }
}
function ba(t = {}) {
  const e = di(t.radiusTop ?? 0.5, "options.radiusTop"), n = di(t.radiusBottom ?? 0.5, "options.radiusBottom"), r = j(t.height ?? 1, "options.height"), i = H(t.radialSegments ?? 24, 3, "options.radialSegments"), s = H(t.heightSegments ?? 1, 1, "options.heightSegments"), a = t.caps ?? !0;
  if (e === 0 && n === 0)
    throw new RangeError("[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.");
  const o = je(), c = i + 1, l = Math.hypot(r, n - e), h = r / l, f = (n - e) / l;
  for (let d = 0; d <= s; d++) {
    const p = d / s, m = r / 2 - p * r, g = e + (n - e) * p;
    for (let b = 0; b <= i; b++) {
      const w = b / i, S = w * Math.PI * 2, $ = Math.sin(S), A = Math.cos(S);
      ge(o, g * $, m, g * A, h * $, f, h * A, w, 1 - p);
    }
  }
  for (let d = 0; d < s; d++)
    for (let p = 0; p < i; p++) {
      const m = d * c + p, g = m + 1, b = m + c + 1, w = m + c;
      o.index.push(m, w, b, m, b, g);
    }
  return a && (e > 0 && fi(o, r / 2, e, 1, i), n > 0 && fi(o, -r / 2, n, -1, i)), Qe(o);
}
function ym(t = {}) {
  const e = j(t.radius ?? 0.5, "options.radius");
  return ba({
    radiusTop: 0,
    radiusBottom: e,
    height: t.height ?? 1,
    radialSegments: t.radialSegments ?? 24,
    heightSegments: 1,
    caps: t.caps ?? !0
  });
}
function vm(t = {}) {
  const e = j(t.size ?? 10, "options.size"), n = H(t.divisions ?? 10, 1, "options.divisions"), r = t.plane ?? "xz", i = t.color ?? fm, [s, a, o, c] = i, l = pa(), h = e / 2, f = e / n;
  for (let d = 0; d <= n; d++) {
    const p = -h + d * f;
    r === "xz" ? (F(l, -h, 0, p, s, a, o, c), F(l, h, 0, p, s, a, o, c), F(l, p, 0, -h, s, a, o, c), F(l, p, 0, h, s, a, o, c)) : r === "xy" ? (F(l, -h, p, 0, s, a, o, c), F(l, h, p, 0, s, a, o, c), F(l, p, -h, 0, s, a, o, c), F(l, p, h, 0, s, a, o, c)) : (F(l, 0, -h, p, s, a, o, c), F(l, 0, h, p, s, a, o, c), F(l, 0, p, -h, s, a, o, c), F(l, 0, p, h, s, a, o, c));
  }
  return ma(l);
}
function xm(t = {}) {
  const e = j(t.size ?? 1, "options.size"), n = pa();
  return F(n, 0, 0, 0, 1, 0, 0, 1), F(n, e, 0, 0, 1, 0, 0, 1), F(n, 0, 0, 0, 0, 1, 0, 1), F(n, 0, e, 0, 0, 1, 0, 1), F(n, 0, 0, 0, 0, 0, 1, 1), F(n, 0, 0, e, 0, 0, 1, 1), ma(n);
}
const Jg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createAxes: xm,
  createBox: gm,
  createCone: ym,
  createCylinder: ba,
  createGrid: vm,
  createPlane: mm,
  createSphere: bm,
  createTorus: wm,
  createTriangle: pm
}, Symbol.toStringTag, { value: "Module" }));
function rt(t, e) {
  return t ? [t[0], t[1], t[2], t[3] ?? 1] : [...e];
}
const Le = {
  projectionView: "mat4x4f",
  model: "mat4x4f",
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它。 */
  normalMatrix: "mat3x3f"
};
function wa(t = {}) {
  const e = rt(t.color, [1, 1, 1, 1]);
  return {
    name: "unlit",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Le, baseColor: "vec4f" },
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
function ya(t = {}) {
  const e = $a(t.direction ?? [0.5, 1, 0.6]), n = rt(t.color, [1, 1, 1, 1]);
  return {
    name: "lambert",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Le,
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
function va(t = {}) {
  const e = $a(t.direction ?? [0.5, 1, 0.6]), n = rt(t.color, [0.9, 0.9, 0.95, 1]), r = rt(t.specular, [1, 1, 1, 1]);
  return {
    name: "phong",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Le,
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
function xa() {
  return {
    name: "normalDebug",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Le },
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
function Sa(t = {}) {
  const e = rt(t.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: "flatLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3" },
    uniforms: { ...Le, baseColor: "vec4f" },
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
function Ta() {
  return {
    name: "vertexColorLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3", color: "float32x4" },
    uniforms: { ...Le },
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
const Sm = {
  unlit: wa,
  lambert: ya,
  phong: va,
  normalDebug: xa,
  flatLine: Sa,
  vertexColorLine: Ta
};
function Tm(t) {
  return t.defaults ? { ...t.defaults } : {};
}
function $a(t) {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}
const eb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SCENE_UNIFORM_FIELDS: Le,
  defaultUniformsOf: Tm,
  flatLine: Sa,
  lambert: ya,
  materials: Sm,
  normalDebug: xa,
  phong: va,
  unlit: wa,
  vertexColorLine: Ta
}, Symbol.toStringTag, { value: "Module" }));
export {
  Jr as ATTRIBUTE_PLACEHOLDER,
  Im as AddressMode,
  Oa as BLEND_PRESETS,
  hh as BackendRegistry,
  O as BindingType,
  Bm as BlendFactor,
  Gm as BlendOperation,
  C as BufferUsage,
  Ai as CANVAS_DEPTH_FORMAT,
  oe as ColorWriteMask,
  Rm as CompareFunction,
  Um as CullMode,
  Op as DEFAULT_BACKEND_ORDER,
  Ga as DEFAULT_BLEND_COMPONENT,
  cr as DEFAULT_DEPTH_STATE,
  si as DEFAULT_GPU_TIMING_DELAY,
  ii as DEFAULT_GPU_TIMING_FRAMES,
  Ht as DEFAULT_PRIMITIVE_STATE,
  Iu as DEG2RAD,
  pi as DEPTH_STENCIL_FORMATS,
  xn as DeviceLostError,
  mg as DisposalScope,
  Lg as EPSILON,
  Vm as FilterMode,
  Dm as FrontFace,
  Bg as GLSL_PREAMBLE,
  Ts as GLSL_PRECISION_PREAMBLE,
  oh as GLSL_SAMPLER_TYPES,
  sh as GLSL_TYPE_NAMES,
  Ss as GLSL_VERSION_DIRECTIVE,
  ua as GPU_TIMING_FEATURE,
  Yt as Geometry,
  nt as GfxTexture,
  K as GpuError,
  Ke as GpuTiming,
  Cm as IndexFormat,
  hg as LOG_LEVEL_NAMES,
  ka as LOG_LEVEL_VALUES,
  Mm as LoadOp,
  W as LogLevel,
  Jr as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  yn as MATERIAL_TEXTURE_PLACEHOLDER,
  wn as MATERIAL_UNIFORM_PLACEHOLDER,
  Xt as Material,
  Kg as OrbitControls,
  Zg as OrthographicCamera,
  Fa as OutOfMemoryError,
  Hg as PerspectiveCamera,
  Em as PrimitiveTopology,
  ze as QueryType,
  Vu as RAD2DEG,
  $m as RENDERABLE_FORMATS,
  ha as Renderer,
  Le as SCENE_UNIFORM_FIELDS,
  _m as SHADER_STAGE_NAMES,
  tm as STANDARD_ATTRIBUTE_FORMATS,
  ht as STENCIL_FACE_DEFAULT,
  q as ShaderStage,
  Om as StencilOperation,
  Fm as StoreOp,
  yn as TEXTURE_PLACEHOLDER,
  At as TextureDimension,
  v as TextureUsage,
  Xr as UNIFORM_FIELD_TYPES,
  wn as UNIFORM_PLACEHOLDER,
  Zp as UniformArena,
  Kp as UniformArenaPool,
  Qt as UniformLayout,
  Zr as UniformValues,
  Pa as VERTEX_FORMAT_INFO,
  u as ValidationError,
  Nm as VertexStepMode,
  Ei as alignTo,
  tg as alignTo4,
  On as assert,
  Hm as assertDefined,
  P as assertNever,
  Te as assertNonNegativeInteger,
  yi as assertPassTimestampWrites,
  We as assertPositiveInteger,
  Zm as assertPowerOfTwo,
  $g as box3,
  im as buildMipChain,
  eg as byteLengthOf,
  Ti as cacheKey,
  De as clamp,
  zg as clearShaders,
  Eg as color,
  og as combineFlags,
  _n as compileShaderStage,
  rg as concatTypedArrays,
  xm as createAxes,
  gm as createBox,
  ym as createCone,
  ba as createCylinder,
  or as createDefaultBackendRegistry,
  Xg as createDevice,
  oa as createDeviceWithAdapter,
  Yg as createGeometry,
  vm as createGrid,
  it as createLogger,
  Ua as createPipelineCache,
  mm as createPlane,
  bm as createSphere,
  wm as createTorus,
  pm as createTriangle,
  qp as createUniforms,
  cg as currentId,
  _i as defaultPixelRatio,
  Ba as defaultTextureUsage,
  Tm as defaultUniformsOf,
  Yp as defineMaterial,
  la as defineUniforms,
  ys as degToRad,
  Ym as describeAdapter,
  am as describeGpuTimingFailure,
  zu as describeShaderSource,
  Up as detectBackend,
  Pi as disposeAll,
  Sg as euler,
  qg as findWgslEntryPoint,
  Sa as flatLine,
  lg as formatFlags,
  Gg as formatShaderErrorLog,
  _g as frustum,
  Ra as fullMipLevelCount,
  fg as getGlobalLogLevel,
  Vg as getShader,
  Qu as glslDefines,
  xs as glslFieldForStage,
  ah as glslTypeName,
  ag as hasAllFlags,
  sg as hasAnyFlag,
  ig as hasFlag,
  Ig as hasShader,
  _a as indexFormatByteSize,
  uh as inferBindGroupLayoutEntries,
  Nu as inverseLerp,
  Jm as isArrayBufferView,
  Qg as isBackendAvailable,
  mi as isBufferBinding,
  Wm as isBufferBindingResource,
  Aa as isDepthStencilFormat,
  za as isDisposable,
  Ma as isGpuError,
  Bn as isImageSource,
  gi as isSamplerBinding,
  qm as isSamplerBindingResource,
  _s as isSamplerType,
  Am as isSrgbFormat,
  km as isTextureBinding,
  jm as isTextureBindingResource,
  Pm as isTriangleTopology,
  Km as isTypedArray,
  ya as lambert,
  vs as languageForBackend,
  Mg as lerp,
  Ku as listShaderKeys,
  yg as mat3,
  vg as mat4,
  eb as materials,
  He as measureCanvas,
  Wu as missingSourceMessage,
  Rg as nextAfter,
  B as nextId,
  xa as normalDebug,
  vi as normalizeBindGroupLayoutEntries,
  pg as nullLogger,
  Og as numberLines,
  Na as paddedCopy,
  va as phong,
  Tg as plane,
  Lm as primitiveCount,
  xg as quat,
  Cg as radToDeg,
  Ag as ray,
  Pg as raycaster,
  lh as reflectGlslProgram,
  ch as reflectSamplerUniforms,
  Wg as reflectWgslBindings,
  ih as reflectWgslEntryPoints,
  Zu as registerShader,
  Ug as registerShaders,
  Dg as replaceShader,
  Ng as requireShader,
  ug as resetIdCounter,
  Qm as resolveBindingLayoutEntry,
  Xm as resolveBlendState,
  $s as resolveGlslWrapOptions,
  $i as resolveLimits,
  bi as resolveSamplerDescriptor,
  wi as resolveShaderSource,
  Gn as resolveTextureSize,
  Lt as resolveTextureViewDescriptor,
  zm as samplerKey,
  dg as setGlobalLogLevel,
  Jg as shapes,
  Ea as smallestIndexFormat,
  Fg as smoothstep,
  ku as stageSource,
  As as stripWgslComments,
  Da as timestampDeltaToMilliseconds,
  Va as toUint8View,
  ng as typedArrayElementSize,
  wa as unlit,
  kg as unregisterShader,
  xi as validateVertexBufferLayout,
  gg as vec2,
  bg as vec3,
  wg as vec4,
  Si as vertexBufferLayoutsKey,
  Ta as vertexColorLine,
  La as vertexFormatGlslType,
  Ae as vertexFormatInfo,
  Ca as vertexFormatWgslType,
  jg as wgslBindingKeys,
  Xu as wgslDefines,
  Yu as wrapGlslSource,
  Hu as wrapWgslSource
};
//# sourceMappingURL=gpu-device-api.js.map
