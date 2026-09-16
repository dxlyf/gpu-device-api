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
}, gs = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], ew = [
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
  ...gs
];
function Io(t) {
  return gs.includes(t);
}
function tw(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const C = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, Do = {
  [C.Vertex]: "vertex",
  [C.Fragment]: "fragment",
  [C.Compute]: "compute"
}, rw = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function nw(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function iw(t, e) {
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
const sw = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function ko(t) {
  return t === "uint16" ? 2 : 4;
}
function Vo(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const aw = {
  Load: "load",
  Clear: "clear"
}, ow = {
  Store: "store",
  Discard: "discard"
}, lw = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, cw = {
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
}, uw = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, hw = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, pw = {
  None: "none",
  Front: "front",
  Back: "back"
}, dw = {
  Ccw: "ccw",
  Cw: "cw"
}, fw = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, mw = {
  Nearest: "nearest",
  Linear: "linear"
};
function A(t, e, r, n = !1) {
  return { components: t, byteSize: e, kind: r, normalized: n };
}
const No = Object.freeze({
  uint8x2: A(2, 2, "uint"),
  uint8x4: A(4, 4, "uint"),
  sint8x2: A(2, 2, "sint"),
  sint8x4: A(4, 4, "sint"),
  unorm8x2: A(2, 2, "float", !0),
  unorm8x4: A(4, 4, "float", !0),
  snorm8x2: A(2, 2, "float", !0),
  snorm8x4: A(4, 4, "float", !0),
  uint16x2: A(2, 4, "uint"),
  uint16x4: A(4, 8, "uint"),
  sint16x2: A(2, 4, "sint"),
  sint16x4: A(4, 8, "sint"),
  unorm16x2: A(2, 4, "float", !0),
  unorm16x4: A(4, 8, "float", !0),
  snorm16x2: A(2, 4, "float", !0),
  snorm16x4: A(4, 8, "float", !0),
  float16x2: A(2, 4, "float"),
  float16x4: A(4, 8, "float"),
  float32: A(1, 4, "float"),
  float32x2: A(2, 8, "float"),
  float32x3: A(3, 12, "float"),
  float32x4: A(4, 16, "float"),
  uint32: A(1, 4, "uint"),
  uint32x2: A(2, 8, "uint"),
  uint32x3: A(3, 12, "uint"),
  uint32x4: A(4, 16, "uint"),
  sint32: A(1, 4, "sint"),
  sint32x2: A(2, 8, "sint"),
  sint32x3: A(3, 12, "sint"),
  sint32x4: A(4, 16, "sint")
});
function Re(t) {
  const e = No[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function Wo(t) {
  const e = Re(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function zo(t) {
  const e = Re(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const gw = {
  Vertex: "vertex",
  Instance: "instance"
}, k = {
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
function bs(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function bw(t) {
  return t === "texture" || t === "storage-texture";
}
function ws(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class te extends Error {
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
function qo(t) {
  return t instanceof te;
}
class u extends te {
  constructor(e, r = {}) {
    super(e, { ...r, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class ar extends te {
  constructor(e, r = {}) {
    super(e, { ...r, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class ft extends te {
  constructor(e, r = {}) {
    super(e, { ...r, code: "INTERNAL_ERROR" }), this.name = "GPUInternalError";
  }
}
class Ye extends te {
  reason;
  constructor(e, r = {}) {
    super(e, { ...r, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = r.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const ww = [
  "validation",
  "out-of-memory",
  "internal"
];
function jo(t) {
  return t === "validation" || t === "out-of-memory" || t === "internal";
}
function ys(t, e) {
  if (!jo(t))
    throw new u(
      `${e}: expected one of "validation", "out-of-memory" or "internal", got ${JSON.stringify(t)}.`
    );
}
function yw(t) {
  return t instanceof Uint8Array ? t : new Uint8Array(t);
}
const zt = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function or(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function vs(t) {
  const e = or(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function vw(t, e) {
  if (!Number.isInteger(e) || e < 0)
    throw new u(
      `[gpu-device-api] mipLevelExtent: level must be a non-negative integer, got ${String(e)}.`
    );
  const r = or(t), n = (i) => Math.max(1, Math.trunc(i / 2 ** e));
  return {
    width: n(r.width),
    height: n(r.height),
    depthOrArrayLayers: r.depthOrArrayLayers
  };
}
function Qo(t = 0) {
  return x.CopyDst | x.TextureBinding | t;
}
const mt = "rgba";
function Yo(t, e) {
  if (typeof t != "string" || !/^[rgba01]{4}$/.test(t))
    throw new u(
      `[gpu-device-api] ${e}: swizzle must be a four-character string made of "r", "g", "b", "a", "0" and "1" (e.g. "rgba", "rrr1", "bgra"), got ${JSON.stringify(t)}.`
    );
}
function Yt(t, e = {}) {
  const r = e.dimension ?? (t.dimension === "1d" ? "1d" : t.dimension === "3d" ? "3d" : t.depthOrArrayLayers > 1 ? "2d-array" : "2d");
  return e.swizzle !== void 0 && Yo(e.swizzle, `Texture "${t.label}".createView`), {
    format: e.format,
    dimension: r,
    baseMipLevel: e.baseMipLevel ?? 0,
    mipLevelCount: e.mipLevelCount ?? t.mipLevelCount,
    baseArrayLayer: e.baseArrayLayer ?? 0,
    arrayLayerCount: e.arrayLayerCount ?? t.depthOrArrayLayers,
    aspect: e.aspect ?? "all",
    swizzle: e.swizzle
  };
}
function xs(t = {}) {
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
function xw(t) {
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
function Ss(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const Je = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function Ts(t, e) {
  if (t.querySet.type !== Je.Timestamp)
    throw new u(
      `[gpu-device-api] ${e}: timestampWrites.querySet must be a "timestamp" query set, got "${String(t.querySet.type)}".`
    );
  const r = t.beginningOfPassWriteIndex, n = t.endOfPassWriteIndex;
  if (r === void 0 && n === void 0)
    throw new u(
      `[gpu-device-api] ${e}: timestampWrites needs at least one of beginningOfPassWriteIndex / endOfPassWriteIndex.`
    );
  for (const [i, s] of [
    ["beginningOfPassWriteIndex", r],
    ["endOfPassWriteIndex", n]
  ])
    if (s !== void 0 && (!Number.isInteger(s) || s < 0 || s >= t.querySet.count))
      throw new u(
        `[gpu-device-api] ${e}: timestampWrites.${i} (${String(s)}) is outside the query set's range [0, ${t.querySet.count}).`
      );
  if (r !== void 0 && r === n)
    throw new u(
      `[gpu-device-api] ${e}: beginningOfPassWriteIndex and endOfPassWriteIndex must differ (they are two different instants), got both = ${r}.`
    );
}
function Sw(t) {
  return t.buffer !== void 0;
}
function Tw(t) {
  return t.sampler !== void 0;
}
function $w(t) {
  return t.view !== void 0;
}
function Ew(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function $s(t) {
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
function Es(t, e) {
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
    const n = Re(r.format);
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
const Nn = /* @__PURE__ */ new WeakMap();
function As(t) {
  const e = Nn.get(t);
  if (e !== void 0) return e;
  const r = t.map((n) => {
    const i = n.attributes.map((s) => `${s.shaderLocation}@${s.offset}:${s.format}`).join(",");
    return `${n.arrayStride}/${n.stepMode ?? "vertex"}[${i}]`;
  }).join(";");
  return Nn.set(t, r), r;
}
const ue = {
  None: 0,
  Red: 1,
  Green: 2,
  Blue: 4,
  Alpha: 8,
  All: 15
}, vr = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, Wn = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, Xo = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, ve = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, Ho = Object.freeze({
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
function Aw(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = Ho[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function ln(t = 128, e) {
  const r = /* @__PURE__ */ new Map();
  let n;
  const i = () => {
    for (; r.size > t; ) {
      const s = r.keys().next();
      if (s.done) return;
      const a = s.value, o = r.get(a);
      r.delete(a), e?.(o, a);
    }
  };
  return {
    get(s) {
      const a = r.get(s);
      if (a !== void 0)
        return n !== s && (r.delete(s), r.set(s, a), n = s), a;
    },
    set(s, a) {
      return r.get(s) !== void 0 && r.delete(s), r.set(s, a), n = s, i(), a;
    },
    has(s) {
      return r.has(s);
    },
    delete(s) {
      return n === s && (n = void 0), r.delete(s);
    },
    clear() {
      n = void 0, r.clear();
    },
    get size() {
      return r.size;
    },
    values() {
      return [...r.values()];
    }
  };
}
function Ps(...t) {
  let e = "";
  for (let r = 0; r < t.length; r += 1) {
    const n = t[r];
    n == null || n === "" || (e = e === "" ? `${n}` : `${e}|${n}`);
  }
  return e;
}
function xe(t) {
  const e = t.messages ?? [];
  return {
    label: t.label,
    backend: t.backend,
    messages: e,
    rawLogs: t.rawLogs ?? [],
    hasErrors: e.some((r) => r.type === "error")
  };
}
function Zo(t, e, r) {
  const n = [], i = [];
  for (const s of r)
    n.push(...s.messages), i.push(...s.rawLogs);
  return xe({ label: t, backend: e, messages: n, rawLogs: i });
}
function Ko(t, e) {
  return xe({ label: t, backend: e });
}
function Se(t) {
  return {
    type: t.type,
    message: t.message,
    // WebGPU 用 0 表示「不知道行号」，这里归一成 null，避免和「第 0 行」混淆。
    lineNum: t.lineNum === void 0 || t.lineNum === null || t.lineNum <= 0 ? null : t.lineNum,
    linePos: t.linePos === void 0 || t.linePos === null || t.linePos <= 0 ? null : t.linePos,
    stage: t.stage ?? null,
    label: t.label,
    backend: t.backend
  };
}
function Jo(t) {
  return t === null ? "program" : Do[t] ?? `stage${t}`;
}
function el(t) {
  const e = `"${t.label}" (${t.backend}, ${Jo(t.stage)})`;
  let r = "";
  return t.lineNum !== null && (r = ` ${t.lineNum}`, t.linePos !== null && (r += `:${t.linePos}`), r += ":"), `[gpu-device-api] shader ${e}${r} ${t.type}: ${t.message}`;
}
function cn(t) {
  const e = t.messages.filter((n) => n.type === "error").length, r = `[gpu-device-api] compilation info for "${t.label}" (${t.backend}): ${t.messages.length} message(s), ${e} error(s)`;
  return t.messages.length === 0 ? r : [r, ...t.messages.map((n) => `  ${el(n)}`)].join(`
`);
}
function Pw(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return Array.isArray(e.messages) && typeof e.hasErrors == "boolean";
}
const tl = /^\s*(ERROR|WARNING|INFO)\s*:\s*\d+\s*:\s*(\d+)\s*:\s*(.*)$/, rl = /^\s*\d+\s*\(\s*(\d+)\s*\)\s*:\s*(error|warning|info)\b\s*:?\s*(.*)$/i, nl = /:\s*(\d+)\s*:/;
function zn(t) {
  const e = t.toLowerCase();
  return e === "error" ? "error" : e === "warning" ? "warning" : "info";
}
function il(t, e, r, n) {
  const i = [];
  for (const s of t.split(`
`)) {
    const a = s.trim();
    if (a === "") continue;
    const o = tl.exec(a);
    if (o) {
      i.push(
        Se({
          type: zn(o[1]),
          message: o[3].trim(),
          lineNum: Number(o[2]),
          linePos: null,
          label: e,
          backend: r,
          stage: n
        })
      );
      continue;
    }
    const l = rl.exec(a);
    if (l) {
      i.push(
        Se({
          type: zn(l[2]),
          message: l[3].trim(),
          lineNum: Number(l[1]),
          linePos: null,
          label: e,
          backend: r,
          stage: n
        })
      );
      continue;
    }
    const c = nl.exec(a);
    i.push(
      Se({
        // 没有前缀时按 error 处理：GL 的信息日志里真正值得注意的就是错误，
        // 而这条路径本来就是「编译/链接失败」才会走到。
        type: "error",
        message: a,
        lineNum: c ? Number(c[1]) : null,
        linePos: null,
        label: e,
        backend: r,
        stage: n
      })
    );
  }
  return i;
}
const un = 3e4;
function N() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
async function Ls(t, e, r) {
  if (!Number.isFinite(e) || e <= 0) return t;
  let n;
  try {
    return await Promise.race([
      t,
      new Promise((i, s) => {
        n = setTimeout(() => {
          s(new Error(`[gpu-device-api] ${r} did not finish within ${e}ms.`));
        }, e);
      })
    ]);
  } finally {
    n !== void 0 && clearTimeout(n);
  }
}
function sl() {
  return new Promise((t) => {
    setTimeout(t, 0);
  });
}
function _s(t, e, r) {
  if (t === void 0 || t === "auto") return { layout: "auto", synthesized: null };
  if (Array.isArray(t)) {
    const n = t;
    if (n.length === 0)
      throw new u(
        `[gpu-device-api] ${r}: layout must not be an empty array; omit it (or pass 'auto') to let the backend infer the layout from the shader.`
      );
    const i = e(n);
    return { layout: i, synthesized: i };
  }
  if (al(t)) {
    const n = e([t]);
    return { layout: n, synthesized: n };
  }
  return { layout: t, synthesized: null };
}
function al(t) {
  const e = t;
  return typeof e.entry != "function" || !Array.isArray(e.sortedEntries) ? !1 : !Array.isArray(e.bindGroupLayouts);
}
const Cs = {
  TopLeft: "topLeft",
  BottomUp: "bottomUp"
};
function ol(t, e, r) {
  return {
    x: t.x,
    y: ll(t.y, t.height, e, r),
    width: t.width,
    height: t.height
  };
}
function Lw(t, e, r) {
  return ol(t, e, r);
}
function ll(t, e, r, n) {
  return n === "bottomLeft" ? r - (t + e) : t;
}
function cl(t, e, r = 1) {
  const n = e - t;
  return n <= 0n ? 0 : Number(n) * r / 1e6;
}
function _w(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function Ms(t, e, r) {
  if (!e) return { ...t };
  const n = { ...t };
  for (const [i, s] of Object.entries(e)) {
    if (typeof s != "number") continue;
    const a = t[i];
    if (typeof a != "number")
      throw new u(`[gpu-device-api] Unknown device limit "${String(i)}".`);
    if (s > a)
      throw new u(
        `[gpu-device-api] The ${r} adapter cannot satisfy ${String(i)} = ${s} (available: ${a}).`
      );
    n[i] = s;
  }
  return n;
}
const Rs = "depth24plus";
function ut(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function Fs() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function hn(t, e, r) {
  if (!t) throw new u(e, r ? { details: r } : {});
}
function Cw(t, e, r) {
  if (t == null)
    throw new u(e, r ? { details: r } : {});
  return t;
}
function R(t, e) {
  throw new u(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function et(t, e) {
  hn(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function Te(t, e) {
  hn(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function Mw(t, e) {
  hn(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const ul = [
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
function Rw(t) {
  return ul.some((e) => t instanceof e);
}
function Fw(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function Bw(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function hl(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function pl(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function Gw(t) {
  return t + 3 & -4;
}
function dl(t, e = 4) {
  const r = hl(t), n = pl(r.byteLength, e);
  if (n === r.byteLength) return r;
  const i = new Uint8Array(n);
  return i.set(r), i;
}
function fl(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function Ow(t) {
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
function Uw(t, e) {
  return (t & e) === e;
}
function Iw(t, e) {
  return (t & e) !== 0;
}
function Dw(t, e) {
  return (t & e) === e;
}
function kw(...t) {
  let e = 0;
  for (const r of t) e |= r;
  return e;
}
function Vw(t, e) {
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
let Xt = 0;
function U(t) {
  return Xt += 1, `${t}#${Xt}`;
}
function Nw() {
  return Xt;
}
function Ww() {
  Xt = 0;
}
const j = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, zw = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, ml = {
  silent: j.Silent,
  error: j.Error,
  warn: j.Warn,
  info: j.Info,
  debug: j.Debug,
  trace: j.Trace
};
let pn = j.Warn;
function qw(t) {
  pn = typeof t == "string" ? ml[t] : t;
}
function jw() {
  return pn;
}
function rt(t = "gpu-device-api", e) {
  const r = () => e ?? pn, n = (i, s, a, o) => {
    r() < i || s(`[${t}] ${a}`, ...o);
  };
  return {
    get level() {
      return r();
    },
    error: (i, ...s) => n(j.Error, console.error, i, s),
    warn: (i, ...s) => n(j.Warn, console.warn, i, s),
    info: (i, ...s) => n(j.Info, console.info, i, s),
    debug: (i, ...s) => n(j.Debug, console.debug, i, s),
    trace: (i, ...s) => n(j.Trace, console.debug, i, s)
  };
}
const Qw = {
  level: j.Silent,
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
function gl(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function Bs(t) {
  let e;
  for (const r of t)
    if (gl(r))
      try {
        r.dispose();
      } catch (n) {
        e ??= n;
      }
  if (e !== void 0) throw e;
}
class Yw {
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
    this.resources.clear(), Bs(e);
  }
}
function bl() {
  return new Float32Array(2);
}
function wl(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function yl(t, e) {
  const r = new Float32Array(2);
  return r[0] = t, r[1] = e, r;
}
function vl(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function xl(t, e, r) {
  return t[0] = e, t[1] = r, t;
}
function Sl(t) {
  return t[0] = 0, t[1] = 0, t;
}
function Tl(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t;
}
function $l(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t;
}
function El(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t;
}
function Al(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t;
}
function Pl(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t;
}
function Ll(t, e, r, n) {
  return t[0] = e[0] + r[0] * n, t[1] = e[1] + r[1] * n, t;
}
function _l(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function Cl(t, e) {
  const r = e[0], n = e[1];
  let i = Math.hypot(r, n);
  return i > 0 && (i = 1 / i), t[0] = r * i, t[1] = n * i, t;
}
function Ml(t) {
  return Math.hypot(t[0], t[1]);
}
function Rl(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function Fl(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function Bl(t, e) {
  const r = t[0] - e[0], n = t[1] - e[1];
  return r * r + n * n;
}
function Gl(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function Ol(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function Ul(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t;
}
function Il(t, e, r) {
  return t[0] = Math.min(e[0], r[0]), t[1] = Math.min(e[1], r[1]), t;
}
function Dl(t, e, r) {
  return t[0] = Math.max(e[0], r[0]), t[1] = Math.max(e[1], r[1]), t;
}
function kl(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r;
}
function Vl(t, e, r) {
  const n = e[0], i = e[1];
  return t[0] = r[0] * n + r[3] * i + r[6], t[1] = r[1] * n + r[4] * i + r[7], t;
}
function Nl(t) {
  return [t[0], t[1]];
}
function Wl(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const Xw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Tl,
  clone: wl,
  copy: vl,
  create: bl,
  cross: Ol,
  distance: Fl,
  div: Al,
  dot: Gl,
  equals: kl,
  fromValues: yl,
  length: Ml,
  lerp: Ul,
  max: Dl,
  min: Il,
  mul: El,
  negate: _l,
  normalize: Cl,
  scale: Pl,
  scaleAndAdd: Ll,
  set: xl,
  squaredDistance: Bl,
  squaredLength: Rl,
  sub: $l,
  toArray: Nl,
  toString: Wl,
  transformMat3: Vl,
  zero: Sl
}, Symbol.toStringTag, { value: "Module" }));
function M() {
  return new Float32Array(3);
}
function zl(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function Gs(t, e, r) {
  const n = new Float32Array(3);
  return n[0] = t, n[1] = e, n[2] = r, n;
}
function se(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function he(t, e, r, n) {
  return t[0] = e, t[1] = r, t[2] = n, t;
}
function jr(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function gt(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t[2] = e[2] + r[2], t;
}
function pe(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t[2] = e[2] - r[2], t;
}
function ql(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t[2] = e[2] * r[2], t;
}
function jl(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t[2] = e[2] / r[2], t;
}
function Ht(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t;
}
function qt(t, e, r, n) {
  return t[0] = e[0] + r[0] * n, t[1] = e[1] + r[1] * n, t[2] = e[2] + r[2] * n, t;
}
function Ql(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function dn(t, e) {
  const r = e[0], n = e[1], i = e[2];
  let s = Math.hypot(r, n, i);
  return s > 0 && (s = 1 / s), t[0] = r * s, t[1] = n * s, t[2] = i * s, t;
}
function Qe(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function Os(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function Us(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function lr(t, e) {
  const r = t[0] - e[0], n = t[1] - e[1], i = t[2] - e[2];
  return r * r + n * n + i * i;
}
function me(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Is(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = r[0], o = r[1], l = r[2];
  return t[0] = i * l - s * o, t[1] = s * a - n * l, t[2] = n * o - i * a, t;
}
function Yl(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t[2] = e[2] + n * (r[2] - e[2]), t;
}
function cr(t, e, r) {
  return t[0] = Math.min(e[0], r[0]), t[1] = Math.min(e[1], r[1]), t[2] = Math.min(e[2], r[2]), t;
}
function ur(t, e, r) {
  return t[0] = Math.max(e[0], r[0]), t[1] = Math.max(e[1], r[1]), t[2] = Math.max(e[2], r[2]), t;
}
function Qr(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r;
}
function Xl(t, e, r) {
  const n = me(r, e) * 2;
  return t[0] = e[0] - r[0] * n, t[1] = e[1] - r[1] * n, t[2] = e[2] - r[2] * n, t;
}
function Ds(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[3] * i + r[6] * s, t[1] = r[1] * n + r[4] * i + r[7] * s, t[2] = r[2] * n + r[5] * i + r[8] * s, t;
}
function fn(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  let a = r[3] * n + r[7] * i + r[11] * s + r[15];
  return a = a || 1, t[0] = (r[0] * n + r[4] * i + r[8] * s + r[12]) / a, t[1] = (r[1] * n + r[5] * i + r[9] * s + r[13]) / a, t[2] = (r[2] * n + r[6] * i + r[10] * s + r[14]) / a, t;
}
function ks(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[4] * i + r[8] * s, t[1] = r[1] * n + r[5] * i + r[9] * s, t[2] = r[2] * n + r[6] * i + r[10] * s, t;
}
function Hl(t) {
  return [t[0], t[1], t[2]];
}
function Zl(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const Hw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: gt,
  clone: zl,
  copy: se,
  create: M,
  cross: Is,
  distance: Us,
  div: jl,
  dot: me,
  equals: Qr,
  fromValues: Gs,
  length: Qe,
  lerp: Yl,
  max: ur,
  min: cr,
  mul: ql,
  negate: Ql,
  normalize: dn,
  reflect: Xl,
  scale: Ht,
  scaleAndAdd: qt,
  set: he,
  squaredDistance: lr,
  squaredLength: Os,
  sub: pe,
  toArray: Hl,
  toString: Zl,
  transformDirection: ks,
  transformMat3: Ds,
  transformMat4: fn,
  zero: jr
}, Symbol.toStringTag, { value: "Module" }));
function Kl() {
  return new Float32Array(4);
}
function Jl(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function ec(t, e, r, n) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = r, i[3] = n, i;
}
function tc(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function rc(t, e, r, n, i) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t;
}
function nc(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function ic(t, e, r) {
  return t[0] = e[0] + r[0], t[1] = e[1] + r[1], t[2] = e[2] + r[2], t[3] = e[3] + r[3], t;
}
function sc(t, e, r) {
  return t[0] = e[0] - r[0], t[1] = e[1] - r[1], t[2] = e[2] - r[2], t[3] = e[3] - r[3], t;
}
function ac(t, e, r) {
  return t[0] = e[0] * r[0], t[1] = e[1] * r[1], t[2] = e[2] * r[2], t[3] = e[3] * r[3], t;
}
function oc(t, e, r) {
  return t[0] = e[0] / r[0], t[1] = e[1] / r[1], t[2] = e[2] / r[2], t[3] = e[3] / r[3], t;
}
function lc(t, e, r) {
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function cc(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function uc(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3];
  let a = Math.hypot(r, n, i, s);
  return a > 0 && (a = 1 / a), t[0] = r * a, t[1] = n * a, t[2] = i * a, t[3] = s * a, t;
}
function hc(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function pc(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function dc(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function fc(t, e, r, n) {
  return t[0] = e[0] + n * (r[0] - e[0]), t[1] = e[1] + n * (r[1] - e[1]), t[2] = e[2] + n * (r[2] - e[2]), t[3] = e[3] + n * (r[3] - e[3]), t;
}
function mc(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r && Math.abs(t[3] - e[3]) <= r;
}
function gc(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = r[0] * n + r[4] * i + r[8] * s + r[12] * a, t[1] = r[1] * n + r[5] * i + r[9] * s + r[13] * a, t[2] = r[2] * n + r[6] * i + r[10] * s + r[14] * a, t[3] = r[3] * n + r[7] * i + r[11] * s + r[15] * a, t;
}
function bc(t) {
  return [t[0], t[1], t[2], t[3]];
}
function wc(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const Zw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: ic,
  clone: Jl,
  copy: tc,
  create: Kl,
  div: oc,
  dot: dc,
  equals: mc,
  fromValues: ec,
  length: hc,
  lerp: fc,
  mul: ac,
  negate: cc,
  normalize: uc,
  scale: lc,
  set: rc,
  squaredLength: pc,
  sub: sc,
  toArray: bc,
  toString: wc,
  transformMat4: gc,
  zero: nc
}, Symbol.toStringTag, { value: "Module" }));
function Vs() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function Ns(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function yc(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function vc(t, e, r, n, i, s, a, o, l) {
  const c = new Float32Array(9);
  return c[0] = t, c[1] = e, c[2] = r, c[3] = n, c[4] = i, c[5] = s, c[6] = a, c[7] = o, c[8] = l, c;
}
function xc(t, e) {
  return t.set(e), t;
}
function Sc(t, e, r, n, i, s, a, o, l, c) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = l, t[8] = c, t;
}
function Ws(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function zs(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8];
  return t[0] = r, t[1] = s, t[2] = l, t[3] = n, t[4] = a, t[5] = c, t[6] = i, t[7] = o, t[8] = h, t;
}
function Tc(t) {
  const e = t[0], r = t[1], n = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = c * s - a * l, d = -c * i + a * o, p = l * i - s * o;
  return e * h + r * d + n * p;
}
function qs(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = h * a - o * c, p = -h * s + o * l, f = c * s - a * l;
  let m = r * d + n * p + i * f;
  return m ? (m = 1 / m, t[0] = d * m, t[1] = (-h * n + i * c) * m, t[2] = (o * n - i * a) * m, t[3] = p * m, t[4] = (h * r - i * l) * m, t[5] = (-o * r + i * s) * m, t[6] = f * m, t[7] = (-c * r + n * l) * m, t[8] = (a * r - n * s) * m, t) : null;
}
function $c(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], p = r[0], f = r[1], m = r[2], g = r[3], b = r[4], w = r[5], y = r[6], v = r[7], T = r[8];
  return t[0] = p * n + f * a + m * c, t[1] = p * i + f * o + m * h, t[2] = p * s + f * l + m * d, t[3] = g * n + b * a + w * c, t[4] = g * i + b * o + w * h, t[5] = g * s + b * l + w * d, t[6] = y * n + v * a + T * c, t[7] = y * i + v * o + T * h, t[8] = y * s + v * l + T * d, t;
}
function Ec(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], p = r[0], f = r[1], m = r[2];
  return t[0] = p * n, t[1] = p * i, t[2] = p * s, t[3] = f * a, t[4] = f * o, t[5] = f * l, t[6] = m * c, t[7] = m * h, t[8] = m * d, t;
}
function Ac(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], p = r[0], f = r[1];
  return t[0] = n, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = l, t[6] = p * n + f * a + c, t[7] = p * i + f * o + h, t[8] = p * s + f * l + d, t;
}
function Pc(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], p = Math.sin(r), f = Math.cos(r);
  return t[0] = f * n + p * a, t[1] = f * i + p * o, t[2] = f * s + p * l, t[3] = f * a - p * n, t[4] = f * o - p * i, t[5] = f * l - p * s, t[6] = c, t[7] = h, t[8] = d, t;
}
function mn(t, e) {
  return Ws(t, e), qs(t, t) ? (zs(t, t), t) : null;
}
function Lc(t, e, r = 1e-6) {
  for (let n = 0; n < 9; n++)
    if (Math.abs(t[n] - e[n]) > r) return !1;
  return !0;
}
function _c(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const Kw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: yc,
  copy: xc,
  create: Vs,
  determinant: Tc,
  equals: Lc,
  fromMat4: Ws,
  fromValues: vc,
  identity: Ns,
  invert: qs,
  multiply: $c,
  normalFromMat4: mn,
  rotate: Pc,
  scale: Ec,
  set: Sc,
  toString: _c,
  translate: Ac,
  transpose: zs
}, Symbol.toStringTag, { value: "Module" })), Zt = 1e-6, ce = new Float32Array(16), Cc = new Float32Array(3);
function le() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function Y(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Mc(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function js(t) {
  return t.fill(0), t;
}
function Rc(...t) {
  const e = new Float32Array(16);
  for (let r = 0; r < 16; r++) e[r] = t[r] ?? 0;
  return e;
}
function Qs(t, e) {
  return t.set(e), t;
}
function Fc(t, ...e) {
  for (let r = 0; r < 16; r++) t[r] = e[r] ?? 0;
  return t;
}
function Bc(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = e[9], p = e[10], f = e[11], m = e[12], g = e[13], b = e[14], w = e[15];
  return t[0] = r, t[1] = a, t[2] = h, t[3] = m, t[4] = n, t[5] = o, t[6] = d, t[7] = g, t[8] = i, t[9] = l, t[10] = p, t[11] = b, t[12] = s, t[13] = c, t[14] = f, t[15] = w, t;
}
function Ys(t) {
  const e = t[0], r = t[1], n = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = t[9], d = t[10], p = t[11], f = t[12], m = t[13], g = t[14], b = t[15], w = e * a - r * s, y = e * o - n * s, v = e * l - i * s, T = r * o - n * a, E = r * l - i * a, P = n * l - i * o, L = c * m - h * f, B = c * g - d * f, G = c * b - p * f, z = h * g - d * m, q = h * b - p * m, X = d * b - p * g;
  return w * X - y * q + v * z + T * G - E * B + P * L;
}
function hr(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], d = e[9], p = e[10], f = e[11], m = e[12], g = e[13], b = e[14], w = e[15], y = r * o - n * a, v = r * l - i * a, T = r * c - s * a, E = n * l - i * o, P = n * c - s * o, L = i * c - s * l, B = h * g - d * m, G = h * b - p * m, z = h * w - f * m, q = d * b - p * g, X = d * w - f * g, ne = p * w - f * b;
  let _ = y * ne - v * X + T * q + E * z - P * G + L * B;
  return _ ? (_ = 1 / _, t[0] = (o * ne - l * X + c * q) * _, t[1] = (i * X - n * ne - s * q) * _, t[2] = (g * L - b * P + w * E) * _, t[3] = (p * P - d * L - f * E) * _, t[4] = (l * z - a * ne - c * G) * _, t[5] = (r * ne - i * z + s * G) * _, t[6] = (b * T - m * L - w * v) * _, t[7] = (h * L - p * T + f * v) * _, t[8] = (a * X - o * z + c * B) * _, t[9] = (n * z - r * X - s * B) * _, t[10] = (m * P - g * T + w * y) * _, t[11] = (d * T - h * P - f * y) * _, t[12] = (o * G - a * q - l * B) * _, t[13] = (r * q - n * G + i * B) * _, t[14] = (g * v - m * E - b * y) * _, t[15] = (h * E - d * v + p * y) * _, t) : null;
}
function K(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], d = e[8], p = e[9], f = e[10], m = e[11], g = e[12], b = e[13], w = e[14], y = e[15], v = r[0], T = r[1], E = r[2], P = r[3], L = r[4], B = r[5], G = r[6], z = r[7], q = r[8], X = r[9], ne = r[10], _ = r[11], Tt = r[12], $t = r[13], Et = r[14], At = r[15];
  return t[0] = v * n + T * o + E * d + P * g, t[1] = v * i + T * l + E * p + P * b, t[2] = v * s + T * c + E * f + P * w, t[3] = v * a + T * h + E * m + P * y, t[4] = L * n + B * o + G * d + z * g, t[5] = L * i + B * l + G * p + z * b, t[6] = L * s + B * c + G * f + z * w, t[7] = L * a + B * h + G * m + z * y, t[8] = q * n + X * o + ne * d + _ * g, t[9] = q * i + X * l + ne * p + _ * b, t[10] = q * s + X * c + ne * f + _ * w, t[11] = q * a + X * h + ne * m + _ * y, t[12] = Tt * n + $t * o + Et * d + At * g, t[13] = Tt * i + $t * l + Et * p + At * b, t[14] = Tt * s + $t * c + Et * f + At * w, t[15] = Tt * a + $t * h + Et * m + At * y, t;
}
function Gc(t, ...e) {
  if (e.length === 0) return Y(t);
  Qs(t, e[0]);
  for (let r = 1; r < e.length; r++) K(t, t, e[r]);
  return t;
}
function Xs(t, e) {
  return Y(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function Oc(t, e) {
  return Y(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function Hs(t, e, r) {
  let n = r[0], i = r[1], s = r[2], a = Math.hypot(n, i, s);
  if (a < Zt) return Y(t);
  a = 1 / a, n *= a, i *= a, s *= a;
  const o = Math.sin(e), l = Math.cos(e), c = 1 - l, h = n * n * c + l, d = i * n * c + s * o, p = s * n * c - i * o, f = n * i * c - s * o, m = i * i * c + l, g = s * i * c + n * o, b = n * s * c + i * o, w = i * s * c - n * o, y = s * s * c + l;
  return t[0] = h, t[1] = d, t[2] = p, t[3] = 0, t[4] = f, t[5] = m, t[6] = g, t[7] = 0, t[8] = b, t[9] = w, t[10] = y, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function gn(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return Y(t), t[5] = n, t[6] = r, t[9] = -r, t[10] = n, t;
}
function bn(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return Y(t), t[0] = n, t[2] = -r, t[8] = r, t[10] = n, t;
}
function wn(t, e) {
  const r = Math.sin(e), n = Math.cos(e);
  return Y(t), t[0] = n, t[1] = r, t[4] = -r, t[5] = n, t;
}
function Uc(t, e, r, n) {
  return yn(t, e, r, n, Ic);
}
const Ic = new Float32Array([1, 1, 1]);
function yn(t, e, r, n, i) {
  let s = r[0], a = r[1], o = r[2], l = Math.hypot(s, a, o);
  if (l < Zt)
    return Y(t), t[12] = n[0], t[13] = n[1], t[14] = n[2], t;
  l = 1 / l, s *= l, a *= l, o *= l;
  const c = Math.sin(e), h = Math.cos(e), d = 1 - h, p = s * s * d + h, f = a * s * d + o * c, m = o * s * d - a * c, g = s * a * d - o * c, b = a * a * d + h, w = o * a * d + s * c, y = s * o * d + a * c, v = a * o * d - s * c, T = o * o * d + h, E = i[0], P = i[1], L = i[2];
  return t[0] = p * E, t[1] = f * E, t[2] = m * E, t[3] = 0, t[4] = g * P, t[5] = b * P, t[6] = w * P, t[7] = 0, t[8] = y * L, t[9] = v * L, t[10] = T * L, t[11] = 0, t[12] = n[0], t[13] = n[1], t[14] = n[2], t[15] = 1, t;
}
function Dc(t, e, r, n, i, s) {
  yn(t, e, r, n, i);
  const a = s[0], o = s[1], l = s[2];
  return t[12] = n[0] + a - (t[0] * a + t[4] * o + t[8] * l), t[13] = n[1] + o - (t[1] * a + t[5] * o + t[9] * l), t[14] = n[2] + l - (t[2] * a + t[6] * o + t[10] * l), t;
}
function kc(t, e, r) {
  return Xs(ce, r), K(t, e, ce);
}
function Vc(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function Nc(t, e, r, n) {
  return Hs(ce, r, n), K(t, e, ce);
}
function Wc(t, e, r) {
  return gn(ce, r), K(t, e, ce);
}
function zc(t, e, r) {
  return bn(ce, r), K(t, e, ce);
}
function qc(t, e, r) {
  return wn(ce, r), K(t, e, ce);
}
function jc(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function vn(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function Qc(t, e) {
  const r = vn(Cc, e), n = Ys(e) < 0 ? -1 : 1, i = r[0] * n, s = r[1], a = r[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function Zs(t, e, r, n, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / r, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (n - i);
    t[10] = (i + n) * a, t[14] = 2 * i * n * a;
  } else
    t[10] = -1, t[14] = -2 * n;
  return t;
}
function Ks(t, e, r, n, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / r, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (n - i), t[14] = i * n / (n - i)) : (t[10] = -1, t[14] = -n), t;
}
function Yr(t, e) {
  return t !== e && t.set(e), t[1] = -t[1], t[5] = -t[5], t[9] = -t[9], t[13] = -t[13], t;
}
function Js(t, e, r, n, i, s, a) {
  const o = 1 / (e - r), l = 1 / (n - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * c, t[11] = 0, t[12] = (e + r) * o, t[13] = (i + n) * l, t[14] = (a + s) * c, t[15] = 1, t;
}
function ea(t, e, r, n, i, s, a) {
  const o = 1 / (e - r), l = 1 / (n - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = c, t[11] = 0, t[12] = (e + r) * o, t[13] = (i + n) * l, t[14] = s * c, t[15] = 1, t;
}
function Yc(t, e, r, n, i, s, a) {
  const o = 1 / (r - e), l = 1 / (i - n), c = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * l, t[6] = 0, t[7] = 0, t[8] = (r + e) * o, t[9] = (i + n) * l, t[10] = (a + s) * c, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * c, t[15] = 0, t;
}
function Xr(t, e, r, n) {
  let i = e[0] - r[0], s = e[1] - r[1], a = e[2] - r[2], o = Math.hypot(i, s, a);
  if (o < Zt) return js(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let l = n[1] * a - n[2] * s, c = n[2] * i - n[0] * a, h = n[0] * s - n[1] * i;
  o = Math.hypot(l, c, h), o < Zt ? (l = 0, c = 0, h = 0) : (o = 1 / o, l *= o, c *= o, h *= o);
  const d = s * h - a * c, p = a * l - i * h, f = i * c - s * l;
  return t[0] = l, t[1] = d, t[2] = i, t[3] = 0, t[4] = c, t[5] = p, t[6] = s, t[7] = 0, t[8] = h, t[9] = f, t[10] = a, t[11] = 0, t[12] = -(l * e[0] + c * e[1] + h * e[2]), t[13] = -(d * e[0] + p * e[1] + f * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function xn(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  let a = e[3] * n + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * n + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * n + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * n + e[6] * i + e[10] * s + e[14]) / a, t;
}
function Xc(t, e, r) {
  const n = r[0], i = r[1], s = r[2];
  return t[0] = e[0] * n + e[4] * i + e[8] * s, t[1] = e[1] * n + e[5] * i + e[9] * s, t[2] = e[2] * n + e[6] * i + e[10] * s, t;
}
function Hc(t, e, r = 1e-6) {
  for (let n = 0; n < 16; n++)
    if (Math.abs(t[n] - e[n]) > r) return !1;
  return !0;
}
function Zc(t) {
  const e = [];
  for (let r = 0; r < 4; r++)
    e.push(
      `[${t[r]}, ${t[r + 4]}, ${t[r + 8]}, ${t[r + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const Jw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Mc,
  copy: Qs,
  create: le,
  determinant: Ys,
  equals: Hc,
  flipClipY: Yr,
  fromRotation: Hs,
  fromRotationTranslation: Uc,
  fromRotationTranslationScale: yn,
  fromRotationTranslationScaleOrigin: Dc,
  fromScaling: Oc,
  fromTranslation: Xs,
  fromValues: Rc,
  fromXRotation: gn,
  fromYRotation: bn,
  fromZRotation: wn,
  frustum: Yc,
  getRotation: Qc,
  getScaling: vn,
  getTranslation: jc,
  identity: Y,
  invert: hr,
  lookAt: Xr,
  multiply: K,
  multiplyAll: Gc,
  ortho: Js,
  orthoZO: ea,
  perspective: Zs,
  perspectiveZO: Ks,
  rotate: Nc,
  rotateX: Wc,
  rotateY: zc,
  rotateZ: qc,
  scale: Vc,
  set: Fc,
  toString: Zc,
  transformDirection: Xc,
  transformPoint: xn,
  translate: kc,
  transpose: Bc,
  zero: js
}, Symbol.toStringTag, { value: "Module" }));
function ta() {
  const t = new Float32Array(4);
  return t[3] = 1, t;
}
function Kc(t) {
  const e = new Float32Array(4);
  return ra(e, t);
}
function ra(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function xt(t, e, r, n, i) {
  return t[0] = e, t[1] = r, t[2] = n, t[3] = i, t;
}
function Jc(t, e, r, n) {
  return xt(new Float32Array(4), t, e, r, n);
}
function pr(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 1, t;
}
function Sn(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Tn(t) {
  return Sn(t, t);
}
function na(t) {
  return Math.sqrt(Tn(t));
}
function tt(t, e) {
  const r = na(e);
  if (r < 1e-8) return pr(t);
  const n = 1 / r;
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t;
}
function eu(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = e[3], t;
}
function tu(t, e) {
  const r = Tn(e);
  if (r < 1e-12) return pr(t);
  const n = 1 / r;
  return t[0] = -e[0] * n, t[1] = -e[1] * n, t[2] = -e[2] * n, t[3] = e[3] * n, t;
}
function Fe(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = e[3], o = r[0], l = r[1], c = r[2], h = r[3];
  return t[0] = n * h + a * o + i * c - s * l, t[1] = i * h + a * l + s * o - n * c, t[2] = s * h + a * c + n * l - i * o, t[3] = a * h - n * o - i * l - s * c, t;
}
function ru(t, e, r) {
  return Fe(t, r, e);
}
function nu(t, e, r) {
  const n = r * 0.5, i = Math.sin(n), s = Math.cos(n);
  return Fe(t, e, xt($n, i, 0, 0, s));
}
function iu(t, e, r) {
  const n = r * 0.5, i = Math.sin(n), s = Math.cos(n);
  return Fe(t, e, xt($n, 0, i, 0, s));
}
function su(t, e, r) {
  const n = r * 0.5, i = Math.sin(n), s = Math.cos(n);
  return Fe(t, e, xt($n, 0, 0, i, s));
}
const $n = ta();
function jt(t, e, r) {
  const n = Math.hypot(e[0], e[1], e[2]);
  if (n < 1e-8) return pr(t);
  const i = r * 0.5, s = Math.sin(i) / n;
  return t[0] = e[0] * s, t[1] = e[1] * s, t[2] = e[2] * s, t[3] = Math.cos(i), t;
}
function au(t, e) {
  const r = e[0], n = e[5], i = e[10], s = r + n + i;
  if (s > 0) {
    const a = Math.sqrt(s + 1) * 2;
    t[3] = a * 0.25, t[0] = (e[6] - e[9]) / a, t[1] = (e[8] - e[2]) / a, t[2] = (e[1] - e[4]) / a;
  } else if (r > n && r > i) {
    const a = Math.sqrt(1 + r - n - i) * 2;
    t[3] = (e[6] - e[9]) / a, t[0] = a * 0.25, t[1] = (e[4] + e[1]) / a, t[2] = (e[8] + e[2]) / a;
  } else if (n > i) {
    const a = Math.sqrt(1 + n - r - i) * 2;
    t[3] = (e[8] - e[2]) / a, t[0] = (e[4] + e[1]) / a, t[1] = a * 0.25, t[2] = (e[9] + e[6]) / a;
  } else {
    const a = Math.sqrt(1 + i - r - n) * 2;
    t[3] = (e[1] - e[4]) / a, t[0] = (e[8] + e[2]) / a, t[1] = (e[9] + e[6]) / a, t[2] = a * 0.25;
  }
  return tt(t, t);
}
function ou(t, e, r) {
  const n = e[0], i = e[1], s = e[2], a = r[0], o = r[1], l = r[2];
  let c = n * a + i * o + s * l + 1;
  return c < 1e-8 ? (c = 0, Math.abs(n) > Math.abs(s) ? (t[0] = -i, t[1] = n, t[2] = 0) : (t[0] = 0, t[1] = -s, t[2] = i), t[3] = c) : (t[0] = i * l - s * o, t[1] = s * a - n * l, t[2] = n * o - i * a, t[3] = c), tt(t, t);
}
function lu(t, e, r) {
  const n = r[0], i = r[1], s = r[2], a = e[0], o = e[1], l = e[2], c = e[3], h = 2 * (o * s - l * i), d = 2 * (l * n - a * s), p = 2 * (a * i - o * n);
  return t[0] = n + c * h + (o * p - l * d), t[1] = i + c * d + (l * h - a * p), t[2] = s + c * p + (a * d - o * h), t;
}
function cu(t, e, r, n) {
  let i = r[0], s = r[1], a = r[2], o = r[3], l = Sn(e, r);
  if (l < 0 && (l = -l, i = -i, s = -s, a = -a, o = -o), l > 0.9995)
    return t[0] = e[0] + (i - e[0]) * n, t[1] = e[1] + (s - e[1]) * n, t[2] = e[2] + (a - e[2]) * n, t[3] = e[3] + (o - e[3]) * n, tt(t, t);
  const c = Math.acos(l), h = Math.sin(c), d = Math.sin((1 - n) * c) / h, p = Math.sin(n * c) / h;
  return t[0] = e[0] * d + i * p, t[1] = e[1] * d + s * p, t[2] = e[2] * d + a * p, t[3] = e[3] * d + o * p, tt(t, t);
}
function uu(t, e, r, n) {
  return t[0] = e[0] + (r[0] - e[0]) * n, t[1] = e[1] + (r[1] - e[1]) * n, t[2] = e[2] + (r[2] - e[2]) * n, t[3] = e[3] + (r[3] - e[3]) * n, tt(t, t);
}
function ia(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[3], a = r + r, o = n + n, l = i + i, c = r * a, h = r * o, d = r * l, p = n * o, f = n * l, m = i * l, g = s * a, b = s * o, w = s * l;
  return t[0] = 1 - (p + m), t[1] = h + w, t[2] = d - b, t[3] = 0, t[4] = h - w, t[5] = 1 - (c + m), t[6] = f + g, t[7] = 0, t[8] = d + b, t[9] = f - g, t[10] = 1 - (c + p), t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function hu(t, e, r = 1e-6) {
  return Math.abs(t[0] - e[0]) <= r && Math.abs(t[1] - e[1]) <= r && Math.abs(t[2] - e[2]) <= r && Math.abs(t[3] - e[3]) <= r;
}
function pu(t) {
  return `quat(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const ey = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Kc,
  conjugate: eu,
  copy: ra,
  create: ta,
  dot: Sn,
  equals: hu,
  fromValues: Jc,
  identity: pr,
  invert: tu,
  length: na,
  lerp: uu,
  multiply: Fe,
  normalize: tt,
  premultiply: ru,
  rotateX: nu,
  rotateY: iu,
  rotateZ: su,
  set: xt,
  setAxisAngle: jt,
  setFromRotationMatrix: au,
  setFromUnitVectors: ou,
  slerp: cu,
  squaredLength: Tn,
  toMat4: ia,
  toString: pu,
  transformVec3: lu
}, Symbol.toStringTag, { value: "Module" })), du = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"];
function sa(t = 0, e = 0, r = 0, n = "XYZ") {
  return { x: t, y: e, z: r, order: n };
}
function fu(t) {
  return sa(t.x, t.y, t.z, t.order);
}
function mu(t, e) {
  return t.x = e.x, t.y = e.y, t.z = e.z, t.order = e.order, t;
}
function gu(t, e, r, n, i = t.order) {
  return t.x = e, t.y = r, t.z = n, t.order = i, t;
}
function bu(t, e, r = 1e-6) {
  return t.order === e.order && Math.abs(t.x - e.x) <= r && Math.abs(t.y - e.y) <= r && Math.abs(t.z - e.z) <= r;
}
const aa = {
  XYZ: ["X", "Y", "Z"],
  YXZ: ["Y", "X", "Z"],
  ZXY: ["Z", "X", "Y"],
  ZYX: ["Z", "Y", "X"],
  YZX: ["Y", "Z", "X"],
  XZY: ["X", "Z", "Y"]
}, xr = {
  X: new Float32Array([1, 0, 0]),
  Y: new Float32Array([0, 1, 0]),
  Z: new Float32Array([0, 0, 1])
}, wu = Y(new Float32Array(16)), yu = Y(new Float32Array(16)), vu = Y(new Float32Array(16)), Hr = Y(new Float32Array(16)), xu = new Float32Array(4), Su = new Float32Array(4), Tu = new Float32Array(4), qn = new Float32Array(4);
function Xe(t, e) {
  return e === "X" ? t.x : e === "Y" ? t.y : t.z;
}
function Sr(t, e, r) {
  return t === "X" ? gn(r, e) : t === "Y" ? bn(r, e) : wn(r, e);
}
function $u(t, e) {
  const r = aa[e.order], n = Sr(r[0], Xe(e, r[0]), wu), i = Sr(r[1], Xe(e, r[1]), yu), s = Sr(r[2], Xe(e, r[2]), vu);
  return K(Hr, n, i), K(t, Hr, s);
}
function Eu(t, e) {
  const r = aa[e.order], n = jt(xu, xr[r[0]], Xe(e, r[0])), i = jt(Su, xr[r[1]], Xe(e, r[1])), s = jt(Tu, xr[r[2]], Xe(e, r[2]));
  return Fe(qn, n, i), Fe(t, qn, s);
}
function oa(t, e) {
  const r = e[0], n = e[1], i = e[2], s = e[4], a = e[5], o = e[6], l = e[8], c = e[9], h = e[10], d = (f) => f < -1 ? -1 : f > 1 ? 1 : f, p = 0.9999999;
  switch (t.order) {
    case "XYZ":
      t.y = Math.asin(d(l)), Math.abs(l) < p ? (t.x = Math.atan2(-c, h), t.z = Math.atan2(-s, r)) : (t.x = Math.atan2(o, a), t.z = 0);
      break;
    case "YXZ":
      t.x = Math.asin(-d(c)), Math.abs(c) < p ? (t.y = Math.atan2(l, h), t.z = Math.atan2(n, a)) : (t.y = Math.atan2(-i, r), t.z = 0);
      break;
    case "ZXY":
      t.x = Math.asin(d(o)), Math.abs(o) < p ? (t.y = Math.atan2(-i, h), t.z = Math.atan2(-s, a)) : (t.y = 0, t.z = Math.atan2(n, r));
      break;
    case "ZYX":
      t.y = Math.asin(-d(i)), Math.abs(i) < p ? (t.x = Math.atan2(o, h), t.z = Math.atan2(n, r)) : (t.x = 0, t.z = Math.atan2(-s, a));
      break;
    case "YZX":
      t.z = Math.asin(d(n)), Math.abs(n) < p ? (t.x = Math.atan2(-c, a), t.y = Math.atan2(-i, r)) : (t.x = 0, t.y = Math.atan2(l, h));
      break;
    case "XZY":
      t.z = Math.asin(-d(s)), Math.abs(s) < p ? (t.x = Math.atan2(o, a), t.y = Math.atan2(l, r)) : (t.x = Math.atan2(-c, h), t.y = 0);
      break;
  }
  return t;
}
function Au(t, e) {
  return oa(t, ia(Hr, e));
}
const ty = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EULER_ORDERS: du,
  clone: fu,
  copy: mu,
  create: sa,
  equals: bu,
  fromQuaternion: Au,
  fromRotationMatrix: oa,
  set: gu,
  toMat4: $u,
  toQuaternion: Eu
}, Symbol.toStringTag, { value: "Module" })), dr = 1e-12, Pt = new Float32Array(3), Pu = new Float32Array(9);
function _e(t = 0, e = 0, r = 1, n = 0) {
  return { normal: new Float32Array([t, e, r]), constant: n };
}
function Lu(t) {
  return { normal: new Float32Array([t.normal[0], t.normal[1], t.normal[2]]), constant: t.constant };
}
function En(t, e) {
  return t.normal[0] = e.normal[0], t.normal[1] = e.normal[1], t.normal[2] = e.normal[2], t.constant = e.constant, t;
}
function _u(t, e, r) {
  return t.normal[0] = e[0], t.normal[1] = e[1], t.normal[2] = e[2], t.constant = r, t;
}
function la(t, e, r, n, i) {
  return t.normal[0] = e, t.normal[1] = r, t.normal[2] = n, t.constant = i, t;
}
function Cu(t, e, r) {
  const n = Math.hypot(e[0], e[1], e[2]), i = n < dr ? 1 : 1 / n;
  return t.normal[0] = e[0] * i, t.normal[1] = e[1] * i, t.normal[2] = e[2] * i, t.constant = -me(t.normal, r), t;
}
function Mu(t, e, r, n) {
  const i = new Float32Array([r[0] - e[0], r[1] - e[1], r[2] - e[2]]), s = new Float32Array([n[0] - e[0], n[1] - e[1], n[2] - e[2]]);
  Is(t.normal, i, s);
  const a = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  return a < dr ? null : (t.normal[0] = t.normal[0] / a, t.normal[1] = t.normal[1] / a, t.normal[2] = t.normal[2] / a, t.constant = -me(t.normal, e), t);
}
function ca(t, e) {
  const r = Math.hypot(e.normal[0], e.normal[1], e.normal[2]);
  if (r < dr) return null;
  const n = 1 / r;
  return t.normal[0] = e.normal[0] * n, t.normal[1] = e.normal[1] * n, t.normal[2] = e.normal[2] * n, t.constant = e.constant * n, t;
}
function Ru(t, e) {
  return t.normal[0] = -e.normal[0], t.normal[1] = -e.normal[1], t.normal[2] = -e.normal[2], t.constant = -e.constant, t;
}
function de(t, e) {
  return me(t.normal, e) + t.constant;
}
function Fu(t, e, r) {
  const n = de(e, r);
  return t[0] = r[0] - e.normal[0] * n, t[1] = r[1] - e.normal[1] * n, t[2] = r[2] - e.normal[2] * n, t;
}
function ua(t, e) {
  return t[0] = e.normal[0] * -e.constant, t[1] = e.normal[1] * -e.constant, t[2] = e.normal[2] * -e.constant, t;
}
function Bu(t, e, r) {
  return En(t, e), t.constant -= me(r, e.normal), t;
}
function Gu(t, e, r) {
  const n = de(t, e), i = de(t, r);
  return n === 0 ? 0 : i === 0 ? 1 : n > 0 == i > 0 ? null : n / (n - i);
}
function Ou(t, e, r) {
  const n = mn(Pu, r);
  if (!n)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the matrix is singular, so the transformed plane is undefined."
    );
  ua(Pt, e), fn(Pt, Pt, r), Ds(t.normal, e.normal, n);
  const i = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  if (i < dr)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the transformed normal is degenerate (the matrix collapses the plane)."
    );
  return t.normal[0] = t.normal[0] / i, t.normal[1] = t.normal[1] / i, t.normal[2] = t.normal[2] / i, t.constant = -me(t.normal, Pt), t;
}
function ha(t, e, r = 1e-6) {
  const n = Math.abs(t.normal[0] - e.normal[0]) <= r && Math.abs(t.normal[1] - e.normal[1]) <= r && Math.abs(t.normal[2] - e.normal[2]) <= r && Math.abs(t.constant - e.constant) <= r, i = Math.abs(t.normal[0] + e.normal[0]) <= r && Math.abs(t.normal[1] + e.normal[1]) <= r && Math.abs(t.normal[2] + e.normal[2]) <= r && Math.abs(t.constant + e.constant) <= r;
  return n || i;
}
function Uu(t) {
  return `plane(${t.normal[0]}, ${t.normal[1]}, ${t.normal[2]}, ${t.constant})`;
}
const ry = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Ou,
  clone: Lu,
  coplanarPoint: ua,
  copy: En,
  create: _e,
  distanceToPoint: de,
  equals: ha,
  intersectLineSegment: Gu,
  negate: Ru,
  normalize: ca,
  projectPoint: Fu,
  set: _u,
  setComponents: la,
  setFromCoplanarPoints: Mu,
  setFromNormalAndCoplanarPoint: Cu,
  toString: Uu,
  translate: Bu
}, Symbol.toStringTag, { value: "Module" })), oe = new Float32Array(3);
function Iu() {
  return Be({ min: new Float32Array(3), max: new Float32Array(3) });
}
function Be(t) {
  return t.min[0] = Number.POSITIVE_INFINITY, t.min[1] = Number.POSITIVE_INFINITY, t.min[2] = Number.POSITIVE_INFINITY, t.max[0] = Number.NEGATIVE_INFINITY, t.max[1] = Number.NEGATIVE_INFINITY, t.max[2] = Number.NEGATIVE_INFINITY, t;
}
function W(t) {
  return t.max[0] < t.min[0] || t.max[1] < t.min[1] || t.max[2] < t.min[2];
}
function Du(t) {
  return {
    min: new Float32Array([t.min[0], t.min[1], t.min[2]]),
    max: new Float32Array([t.max[0], t.max[1], t.max[2]])
  };
}
function Kt(t, e) {
  return t.min[0] = e.min[0], t.min[1] = e.min[1], t.min[2] = e.min[2], t.max[0] = e.max[0], t.max[1] = e.max[1], t.max[2] = e.max[2], t;
}
function ku(t, e, r) {
  return t.min[0] = e[0], t.min[1] = e[1], t.min[2] = e[2], t.max[0] = r[0], t.max[1] = r[1], t.max[2] = r[2], t;
}
function Vu(t, e, r) {
  const n = r[0] * 0.5, i = r[1] * 0.5, s = r[2] * 0.5;
  return t.min[0] = e[0] - n, t.min[1] = e[1] - i, t.min[2] = e[2] - s, t.max[0] = e[0] + n, t.max[1] = e[1] + i, t.max[2] = e[2] + s, t;
}
function Nu(t, e) {
  Be(t);
  for (const r of e) An(t, r);
  return t;
}
function Wu(t, e, r = 3) {
  Be(t);
  const n = Math.max(1, Math.trunc(r));
  for (let i = 0; i + 2 < e.length; i += n)
    t.min[0] = Math.min(t.min[0], e[i]), t.min[1] = Math.min(t.min[1], e[i + 1]), t.min[2] = Math.min(t.min[2], e[i + 2]), t.max[0] = Math.max(t.max[0], e[i]), t.max[1] = Math.max(t.max[1], e[i + 1]), t.max[2] = Math.max(t.max[2], e[i + 2]);
  return t;
}
function pa(t, e) {
  return W(e) || (t[0] = (e.min[0] + e.max[0]) * 0.5, t[1] = (e.min[1] + e.max[1]) * 0.5, t[2] = (e.min[2] + e.max[2]) * 0.5), t;
}
function zu(t, e) {
  return W(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, t) : pe(t, e.max, e.min);
}
function qu(t, e) {
  return W(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, -1) : (pa(t, e), Math.hypot(e.max[0] - t[0], e.max[1] - t[1], e.max[2] - t[2]));
}
function An(t, e) {
  return cr(t.min, t.min, e), ur(t.max, t.max, e), t;
}
function ju(t, e) {
  return gt(t.min, t.min, e), gt(t.max, t.max, e), t;
}
function Qu(t, e) {
  return t.min[0] = t.min[0] - e, t.min[1] = t.min[1] - e, t.min[2] = t.min[2] - e, t.max[0] = t.max[0] + e, t.max[1] = t.max[1] + e, t.max[2] = t.max[2] + e, t;
}
function Yu(t, e) {
  return e[0] >= t.min[0] && e[0] <= t.max[0] && e[1] >= t.min[1] && e[1] <= t.max[1] && e[2] >= t.min[2] && e[2] <= t.max[2];
}
function Xu(t, e) {
  return t.min[0] <= e.min[0] && e.max[0] <= t.max[0] && t.min[1] <= e.min[1] && e.max[1] <= t.max[1] && t.min[2] <= e.min[2] && e.max[2] <= t.max[2];
}
function da(t, e) {
  return W(t) || W(e) ? !1 : e.max[0] >= t.min[0] && e.min[0] <= t.max[0] && e.max[1] >= t.min[1] && e.min[1] <= t.max[1] && e.max[2] >= t.min[2] && e.min[2] <= t.max[2];
}
function Hu(t, e, r) {
  return W(t) ? !1 : lr(Pn(oe, t, e), e) <= r * r;
}
function Zu(t, e) {
  if (W(t)) return !1;
  let r = Number.POSITIVE_INFINITY, n = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < 8; i++) {
    oe[0] = i & 1 ? t.max[0] : t.min[0], oe[1] = i & 2 ? t.max[1] : t.min[1], oe[2] = i & 4 ? t.max[2] : t.min[2];
    const s = de(e, oe);
    r = Math.min(r, s), n = Math.max(n, s);
  }
  return r <= 0 && n >= 0;
}
function Pn(t, e, r) {
  return W(e) || (t[0] = Math.min(Math.max(r[0], e.min[0]), e.max[0]), t[1] = Math.min(Math.max(r[1], e.min[1]), e.max[1]), t[2] = Math.min(Math.max(r[2], e.min[2]), e.max[2])), t;
}
function Ku(t, e) {
  return W(t) ? 0 : Math.sqrt(lr(Pn(oe, t, e), e));
}
function Ju(t, e, r) {
  return Kt(t, e), gt(t.min, t.min, r), gt(t.max, t.max, r), t;
}
function eh(t, e, r) {
  return W(e) ? Kt(t, r) : W(r) ? Kt(t, e) : (cr(t.min, e.min, r.min), ur(t.max, e.max, r.max), t);
}
function th(t, e, r) {
  return da(e, r) ? (ur(t.min, e.min, r.min), cr(t.max, e.max, r.max), t) : Be(t);
}
function rh(t, e, r) {
  if (W(e)) return Be(t);
  const n = e.min[0], i = e.min[1], s = e.min[2], a = e.max[0], o = e.max[1], l = e.max[2];
  Be(t);
  for (let c = 0; c < 8; c++) {
    const h = c & 1 ? a : n, d = c & 2 ? o : i, p = c & 4 ? l : s, f = r[3] * h + r[7] * d + r[11] * p + r[15], m = f === 0 ? 1 : 1 / f;
    oe[0] = (r[0] * h + r[4] * d + r[8] * p + r[12]) * m, oe[1] = (r[1] * h + r[5] * d + r[9] * p + r[13]) * m, oe[2] = (r[2] * h + r[6] * d + r[10] * p + r[14]) * m, An(t, oe);
  }
  return t;
}
function nh(t, e, r) {
  if (Ht(t.min, e.min, r), Ht(t.max, e.max, r), r < 0) {
    const n = t.min[0], i = t.min[1], s = t.min[2];
    t.min[0] = t.max[0], t.min[1] = t.max[1], t.min[2] = t.max[2], t.max[0] = n, t.max[1] = i, t.max[2] = s;
  }
  return t;
}
function ih(t, e, r = 1e-6) {
  const n = W(t), i = W(e);
  return n || i ? n === i : Math.abs(t.min[0] - e.min[0]) <= r && Math.abs(t.min[1] - e.min[1]) <= r && Math.abs(t.min[2] - e.min[2]) <= r && Math.abs(t.max[0] - e.max[0]) <= r && Math.abs(t.max[1] - e.max[1]) <= r && Math.abs(t.max[2] - e.max[2]) <= r;
}
function sh(t) {
  return W(t) ? "box3(empty)" : `box3(${t.min[0]}, ${t.min[1]}, ${t.min[2]}) - (${t.max[0]}, ${t.max[1]}, ${t.max[2]})`;
}
const ny = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: rh,
  clampPoint: Pn,
  clone: Du,
  containsBox: Xu,
  containsPoint: Yu,
  copy: Kt,
  create: Iu,
  distanceToPoint: Ku,
  equals: ih,
  expandByPoint: An,
  expandByScalar: Qu,
  expandByVector: ju,
  getBoundingSphere: qu,
  getCenter: pa,
  getSize: zu,
  intersect: th,
  intersectsBox: da,
  intersectsPlane: Zu,
  intersectsSphere: Hu,
  isEmpty: W,
  makeEmpty: Be,
  scaleBox: nh,
  set: ku,
  setFromArray: Wu,
  setFromCenterAndSize: Vu,
  setFromPoints: Nu,
  toString: sh,
  translate: Ju,
  union: eh
}, Symbol.toStringTag, { value: "Module" }));
function ah(t = 0, e = 0, r = 0, n = 0, i = 0, s = -1) {
  return {
    origin: new Float32Array([t, e, r]),
    direction: new Float32Array([n, i, s])
  };
}
function oh(t) {
  return {
    origin: new Float32Array([t.origin[0], t.origin[1], t.origin[2]]),
    direction: new Float32Array([t.direction[0], t.direction[1], t.direction[2]])
  };
}
function lh(t, e) {
  return t.origin[0] = e.origin[0], t.origin[1] = e.origin[1], t.origin[2] = e.origin[2], t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t;
}
function fr(t, e, r) {
  t.origin[0] = e[0], t.origin[1] = e[1], t.origin[2] = e[2];
  const n = Math.hypot(r[0], r[1], r[2]), i = n > 1e-12 ? 1 / n : 1;
  return t.direction[0] = r[0] * i, t.direction[1] = r[1] * i, t.direction[2] = r[2] * i, t;
}
function Ln(t, e, r) {
  return t[0] = e.origin[0] + e.direction[0] * r, t[1] = e.origin[1] + e.direction[1] * r, t[2] = e.origin[2] + e.direction[2] * r, t;
}
function ch(t, e, r) {
  const n = e.origin[0], i = e.origin[1], s = e.origin[2];
  return t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t.origin[0] = n + t.direction[0] * r, t.origin[1] = i + t.direction[1] * r, t.origin[2] = s + t.direction[2] * r, t;
}
function fa(t, e, r) {
  const n = Math.max(0, me(pe(ga, r, e.origin), e.direction));
  return Ln(t, e, n);
}
function uh(t, e) {
  return Math.sqrt(ma(t, e));
}
function ma(t, e) {
  return lr(e, fa(ga, t, e));
}
const ga = new Float32Array(3);
function hh(t, e, r) {
  fn(t.origin, e.origin, r), ks(t.direction, e.direction, r);
  const n = Math.hypot(t.direction[0], t.direction[1], t.direction[2]), i = n > 1e-12 ? 1 / n : 1;
  return t.direction[0] = t.direction[0] * i, t.direction[1] = t.direction[1] * i, t.direction[2] = t.direction[2] * i, t;
}
function ba(t, e) {
  const r = me(e.normal, t.direction);
  if (Math.abs(r) < 1e-12) return null;
  const n = -de(e, t.origin) / r;
  return n >= 0 ? n : null;
}
function wa(t, e, r) {
  const n = t.origin[0] - e[0], i = t.origin[1] - e[1], s = t.origin[2] - e[2], a = t.direction[0], o = t.direction[1], l = t.direction[2], c = n * a + i * o + s * l, h = n * n + i * i + s * s - r * r, d = c * c - h;
  if (d < 0) return null;
  const p = Math.sqrt(d), f = -c - p;
  if (f >= 0) return f;
  const m = -c + p;
  return m >= 0 ? m : null;
}
function ya(t, e) {
  if (W(e)) return null;
  let r = 0, n = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 3; i++) {
    const s = t.origin[i], a = t.direction[i], o = e.min[i], l = e.max[i];
    if (Math.abs(a) < 1e-12) {
      if (s < o || s > l) return null;
      continue;
    }
    const c = 1 / a;
    let h = (o - s) * c, d = (l - s) * c;
    if (h > d) {
      const p = h;
      h = d, d = p;
    }
    if (h > r && (r = h), d < n && (n = d), r > n) return null;
  }
  return Number.isFinite(n) ? r : null;
}
function va(t, e, r, n, i = !1) {
  const s = r[0] - e[0], a = r[1] - e[1], o = r[2] - e[2], l = n[0] - e[0], c = n[1] - e[1], h = n[2] - e[2], d = t.direction[0], p = t.direction[1], f = t.direction[2], m = p * h - f * c, g = f * l - d * h, b = d * c - p * l, w = s * m + a * g + o * b;
  if (i ? w < 1e-12 : Math.abs(w) < 1e-12) return null;
  const y = 1 / w, v = t.origin[0] - e[0], T = t.origin[1] - e[1], E = t.origin[2] - e[2], P = (v * m + T * g + E * b) * y;
  if (P < 0 || P > 1) return null;
  const L = T * o - E * a, B = E * s - v * o, G = v * a - T * s, z = (d * L + p * B + f * G) * y;
  if (z < 0 || P + z > 1) return null;
  const q = (l * L + c * B + h * G) * y;
  return q >= 0 ? q : null;
}
function ph(t, e, r = 1e-6) {
  return Math.abs(t.origin[0] - e.origin[0]) <= r && Math.abs(t.origin[1] - e.origin[1]) <= r && Math.abs(t.origin[2] - e.origin[2]) <= r && Math.abs(t.direction[0] - e.direction[0]) <= r && Math.abs(t.direction[1] - e.direction[1]) <= r && Math.abs(t.direction[2] - e.direction[2]) <= r;
}
function dh(t) {
  return `ray(origin: ${t.origin[0]}, ${t.origin[1]}, ${t.origin[2]}; direction: ${t.direction[0]}, ${t.direction[1]}, ${t.direction[2]})`;
}
function fh(t) {
  return Number.isFinite(t.origin[0]) && Number.isFinite(t.origin[1]) && Number.isFinite(t.origin[2]) && Number.isFinite(t.direction[0]) && Number.isFinite(t.direction[1]) && Number.isFinite(t.direction[2]) && Os(t.direction) > 1e-24;
}
const iy = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: hh,
  at: Ln,
  clone: oh,
  closestPointToPoint: fa,
  copy: lh,
  create: ah,
  distanceToPoint: uh,
  equals: ph,
  intersectBox: ya,
  intersectPlane: ba,
  intersectSphere: wa,
  intersectTriangle: va,
  isWellFormed: fh,
  recast: ch,
  set: fr,
  squaredDistanceToPoint: ma,
  toString: dh
}, Symbol.toStringTag, { value: "Module" })), mh = {
  Left: 0,
  Right: 1,
  Bottom: 2,
  Top: 3,
  Near: 4,
  Far: 5
};
function _n() {
  return {
    planes: [
      _e(),
      _e(),
      _e(),
      _e(),
      _e(),
      _e()
    ]
  };
}
function gh(t) {
  const e = _n();
  return xa(e, t);
}
function xa(t, e) {
  for (let r = 0; r < 6; r++) En(t.planes[r], e.planes[r]);
  return t;
}
function Sa(t, e, r = "gl") {
  const n = [e[0], e[4], e[8], e[12]], i = [e[1], e[5], e[9], e[13]], s = [e[2], e[6], e[10], e[14]], a = [e[3], e[7], e[11], e[15]], o = (c, h, d) => [
    c[0] + d * h[0],
    c[1] + d * h[1],
    c[2] + d * h[2],
    c[3] + d * h[3]
  ], l = [
    o(a, n, 1),
    // left：row3 + row0
    o(a, n, -1),
    // right
    o(a, i, 1),
    // bottom
    o(a, i, -1),
    // top
    // 近平面：GL 的 NDC 是 z ≥ -1（row3 + row2），ZO 的是 z ≥ 0（只看 row2）。
    r === "zo" ? [s[0], s[1], s[2], s[3]] : o(a, s, 1),
    o(a, s, -1)
    // far
  ];
  for (let c = 0; c < 6; c++) {
    const [h, d, p, f] = l[c];
    la(t.planes[c], h, d, p, f), ca(t.planes[c], t.planes[c]);
  }
  return t;
}
function bh(t, e) {
  for (const r of t.planes)
    if (de(r, e) < 0) return !1;
  return !0;
}
function Ta(t, e, r) {
  for (const n of t.planes)
    if (de(n, e) < -r) return !1;
  return !0;
}
function wh(t, e) {
  for (const r of t.planes) {
    const n = r.normal[0], i = r.normal[1], s = r.normal[2], a = n >= 0 ? e.max[0] : e.min[0], o = i >= 0 ? e.max[1] : e.min[1], l = s >= 0 ? e.max[2] : e.min[2];
    if (n * a + i * o + s * l + r.constant < 0) return !1;
  }
  return !0;
}
function yh(t, e) {
  const r = vh(t);
  if (!r) return !0;
  let n = !1, i = !1;
  for (const s of r) {
    const a = de(e, s);
    if (a > 0 ? n = !0 : a < 0 && (i = !0), n && i) return !0;
  }
  return !1;
}
function vh(t) {
  const [e, r, n, i, s, a] = t.planes, o = [];
  for (const l of [s, a])
    for (const c of [n, i])
      for (const h of [e, r]) {
        const d = xh(h, c, l);
        if (!d) return null;
        o.push(d);
      }
  return o;
}
function xh(t, e, r) {
  const n = t.normal[0], i = t.normal[1], s = t.normal[2], a = e.normal[0], o = e.normal[1], l = e.normal[2], c = r.normal[0], h = r.normal[1], d = r.normal[2], p = n * (o * d - l * h) - i * (a * d - l * c) + s * (a * h - o * c);
  if (Math.abs(p) < 1e-12) return null;
  const f = 1 / p, m = -t.constant, g = -e.constant, b = -r.constant;
  return new Float32Array([
    (m * (o * d - l * h) - i * (g * d - l * b) + s * (g * h - o * b)) * f,
    (n * (g * d - l * b) - m * (a * d - l * c) + s * (a * b - g * c)) * f,
    (n * (o * b - g * h) - i * (a * b - g * c) + m * (a * h - o * c)) * f
  ]);
}
function Sh(t, e, r = 1e-6) {
  for (let n = 0; n < 6; n++)
    if (!ha(t.planes[n], e.planes[n], r)) return !1;
  return !0;
}
const sy = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FRUSTUM_PLANE: mh,
  clone: gh,
  containsPoint: bh,
  copy: xa,
  create: _n,
  equals: Sh,
  intersectsBox: wh,
  intersectsPlane: yh,
  intersectsSphere: Ta,
  setFromProjectionView: Sa
}, Symbol.toStringTag, { value: "Module" })), Th = {
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
function $h(t = 0, e = 0, r = 0, n = 1) {
  return { r: t, g: e, b: r, a: n };
}
function Eh(t) {
  return { r: t.r, g: t.g, b: t.b, a: t.a };
}
function Ah(t, e) {
  return t.r = e.r, t.g = e.g, t.b = e.b, t.a = e.a, t;
}
function Ph(t, e, r, n, i = 1) {
  return t.r = e, t.g = r, t.b = n, t.a = i, t;
}
function Lh(t, e, r, n) {
  return t.r = e, t.g = r, t.b = n, t;
}
function _h(t, e, r) {
  const n = Math.trunc(e);
  return t.r = (n >> 16 & 255) / 255, t.g = (n >> 8 & 255) / 255, t.b = (n & 255) / 255, r !== void 0 && (t.a = r), t;
}
function Ch(t) {
  const e = (r) => Math.round(Math.min(Math.max(r, 0), 1) * 255);
  return e(t.r) << 16 | e(t.g) << 8 | e(t.b);
}
function Mh(t, e) {
  const r = e.trim().toLowerCase(), n = Th[r];
  if (n)
    return t.r = n[0], t.g = n[1], t.b = n[2], r === "transparent" && (t.a = 0), t;
  if (r.startsWith("#")) {
    const s = r.slice(1);
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
  const i = /^rgba?\(([^)]+)\)$/.exec(r);
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
function Rh(t, e = !1) {
  const r = (s) => Math.round(Math.min(Math.max(s, 0), 1) * 255), n = (s) => s.toString(16).padStart(2, "0"), i = `#${n(r(t.r))}${n(r(t.g))}${n(r(t.b))}`;
  return e ? `${i}${n(r(t.a))}` : i;
}
function Fh(t, e) {
  return t.r = Math.min(Math.max(e.r, 0), 1), t.g = Math.min(Math.max(e.g, 0), 1), t.b = Math.min(Math.max(e.b, 0), 1), t.a = Math.min(Math.max(e.a, 0), 1), t;
}
function Bh(t, e, r, n) {
  return t.r = e.r + (r.r - e.r) * n, t.g = e.g + (r.g - e.g) * n, t.b = e.b + (r.b - e.b) * n, t.a = e.a + (r.a - e.a) * n, t;
}
function Gh(t, e, r) {
  return t.r = e.r + r.r, t.g = e.g + r.g, t.b = e.b + r.b, t.a = e.a + r.a, t;
}
function Oh(t, e, r) {
  return t.r = e.r * r.r, t.g = e.g * r.g, t.b = e.b * r.b, t.a = e.a * r.a, t;
}
function Uh(t, e, r, n, i = t.a) {
  const s = (e % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), a = Math.min(Math.max(r, 0), 1), o = Math.min(Math.max(n, 0), 1);
  if (a === 0)
    return t.r = o, t.g = o, t.b = o, t.a = i, t;
  const l = o < 0.5 ? o * (1 + a) : o + a - o * a, c = 2 * o - l, h = (p) => {
    let f = p;
    return f < 0 && (f += 1), f > 1 && (f -= 1), f < 1 / 6 ? c + (l - c) * 6 * f : f < 1 / 2 ? l : f < 2 / 3 ? c + (l - c) * (2 / 3 - f) * 6 : c;
  }, d = s / (Math.PI * 2);
  return t.r = h(d + 1 / 3), t.g = h(d), t.b = h(d - 1 / 3), t.a = i, t;
}
function Ih(t, e) {
  const r = Math.max(e.r, e.g, e.b), n = Math.min(e.r, e.g, e.b), i = (n + r) / 2, s = r - n;
  if (s === 0)
    return t[0] = 0, t[1] = 0, t[2] = i, t;
  const a = i <= 0.5 ? s / (r + n) : s / (2 - r - n);
  let o;
  return r === e.r ? o = (e.g - e.b) / s + (e.g < e.b ? 6 : 0) : r === e.g ? o = (e.b - e.r) / s + 2 : o = (e.r - e.g) / s + 4, t[0] = o / 6 * Math.PI * 2, t[1] = a, t[2] = i, t;
}
function Dh(t, e, r = !0) {
  const n = e ?? new Float32Array(r ? 4 : 3);
  return n[0] = t.r, n[1] = t.g, n[2] = t.b, r && n.length >= 4 && (n[3] = t.a), n;
}
function kh(t, e, r = 0) {
  return t.r = e[r] ?? 0, t.g = e[r + 1] ?? 0, t.b = e[r + 2] ?? 0, e.length > r + 3 && (t.a = e[r + 3]), t;
}
function Vh(t, e) {
  const r = (n) => n < 0.04045 ? n * 0.0773993808 : Math.pow(n * 0.9478672986 + 0.0521327014, 2.4);
  return t.r = r(e.r), t.g = r(e.g), t.b = r(e.b), t.a = e.a, t;
}
function Nh(t, e) {
  const r = (n) => n <= 31308e-7 ? n * 12.92 : 1.055 * Math.pow(n, 0.41666) - 0.055;
  return t.r = r(e.r), t.g = r(e.g), t.b = r(e.b), t.a = e.a, t;
}
function Wh(t, e = 1e-6) {
  return t.r >= -e && t.r <= 1 + e && t.g >= -e && t.g <= 1 + e && t.b >= -e && t.b <= 1 + e;
}
function zh(t, e, r = 1e-6) {
  return Math.abs(t.r - e.r) <= r && Math.abs(t.g - e.g) <= r && Math.abs(t.b - e.b) <= r && Math.abs(t.a - e.a) <= r;
}
function qh(t) {
  return `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
}
const ay = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Gh,
  clampColor: Fh,
  clone: Eh,
  convertLinearToSRGB: Nh,
  convertSRGBToLinear: Vh,
  copy: Ah,
  create: $h,
  equals: zh,
  fromArray: kh,
  getHSL: Ih,
  getHex: Ch,
  getStyle: Rh,
  isInGamut: Wh,
  lerp: Bh,
  multiply: Oh,
  set: Ph,
  setHSL: Uh,
  setHex: _h,
  setRGB: Lh,
  setStyle: Mh,
  toArray: Dh,
  toString: qh
}, Symbol.toStringTag, { value: "Module" })), jh = new Float32Array(16), jn = new Float32Array(16), Qh = { origin: new Float32Array(3), direction: new Float32Array(3) }, Me = new Float32Array(3), Jt = new Float32Array(3), Qn = new Float32Array(3), Yn = new Float32Array(3), $a = new Float32Array(3);
function Yh(t = 0, e = 0, r = 0, n = -1) {
  return {
    ray: { origin: new Float32Array([t, e, r]), direction: new Float32Array([0, 0, n]) },
    near: 0,
    far: Number.POSITIVE_INFINITY,
    doubleSided: !0
  };
}
function Xh(t) {
  return {
    ray: { origin: new Float32Array(t.ray.origin), direction: new Float32Array(t.ray.direction) },
    near: t.near,
    far: t.far,
    doubleSided: t.doubleSided
  };
}
function Hh(t, e) {
  return fr(t.ray, e.ray.origin, e.ray.direction), t.near = e.near, t.far = e.far, t.doubleSided = e.doubleSided, t;
}
function Cn(t, e, r) {
  return fr(t.ray, e, r), t;
}
function Zh(t, e, r) {
  return Cn(t, e, pe($a, r, e));
}
function Kh(t, e, r, n, i = "gl") {
  const s = i === "zo" ? 0 : -1, a = 1;
  return er(Me, e, r, s, n), er(Jt, e, r, a, n), Cn(t, Me, pe($a, Jt, Me));
}
function er(t, e, r, n, i) {
  const s = i[3] * e + i[7] * r + i[11] * n + i[15], a = s === 0 ? 1 : 1 / s;
  return t[0] = (i[0] * e + i[4] * r + i[8] * n + i[12]) * a, t[1] = (i[1] * e + i[5] * r + i[9] * n + i[13]) * a, t[2] = (i[2] * e + i[6] * r + i[10] * n + i[14]) * a, t;
}
function Jh(t, e, r) {
  const n = wa(t.ray, e, r);
  return n !== null && mr(t, n) ? n : null;
}
function ep(t, e) {
  const r = ya(t.ray, e);
  return r !== null && mr(t, r) ? r : null;
}
function tp(t, e) {
  const r = ba(t.ray, e);
  return r !== null && mr(t, r) ? r : null;
}
function mr(t, e) {
  return e >= t.near && e <= t.far;
}
function Ea(t, e, r, n, i = []) {
  i.length = 0;
  const s = n ? np(Qh, t.ray, n) : t.ray;
  if (!s) return i;
  const a = Math.floor(e.length / 3), o = Math.floor(r ? r.length / 3 : a / 3), l = !t.doubleSided;
  for (let c = 0; c < o; c++) {
    const h = r ? r[c * 3] ?? 0 : c * 3, d = r ? r[c * 3 + 1] ?? 0 : c * 3 + 1, p = r ? r[c * 3 + 2] ?? 0 : c * 3 + 2;
    if (h >= a || d >= a || p >= a) continue;
    Tr(Jt, e, h), Tr(Qn, e, d), Tr(Yn, e, p);
    const f = va(s, Jt, Qn, Yn, l);
    if (f === null) continue;
    Ln(Me, s, f);
    const m = new Float32Array([Me[0], Me[1], Me[2]]);
    n && er(m, m[0], m[1], m[2], n);
    const g = Us(t.ray.origin, m);
    mr(t, g) && i.push({ distance: g, point: m, triangleIndex: c, vertexIndices: [h, d, p] });
  }
  return i.sort((c, h) => c.distance - h.distance), i;
}
function rp(t, e, r, n) {
  const i = Ea(t, e, r, n, []);
  return i.length > 0 ? i[0] : null;
}
function np(t, e, r) {
  const n = hr(jh, r);
  if (!n) return null;
  const i = er(
    new Float32Array(3),
    e.origin[0],
    e.origin[1],
    e.origin[2],
    n
  ), s = ip(new Float32Array(3), e.direction, n);
  return fr(t, i, s);
}
function ip(t, e, r) {
  const n = e[0], i = e[1], s = e[2];
  return t[0] = r[0] * n + r[4] * i + r[8] * s, t[1] = r[1] * n + r[5] * i + r[9] * s, t[2] = r[2] * n + r[6] * i + r[10] * s, dn(t, t);
}
function Tr(t, e, r) {
  return t[0] = e[r * 3] ?? 0, t[1] = e[r * 3 + 1] ?? 0, t[2] = e[r * 3 + 2] ?? 0, t;
}
function sp(t, e) {
  return hr(t, e);
}
function ap(t, e, r) {
  return K(jn, e, r), hr(t, jn);
}
const oy = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Xh,
  copy: Hh,
  create: Yh,
  intersectBox: ep,
  intersectPlane: tp,
  intersectSphere: Jh,
  intersectTriangles: Ea,
  intersectTrianglesFirst: rp,
  inverseProjectionView: sp,
  inverseProjectionViewOf: ap,
  set: Cn,
  setFromNdc: Kh,
  setFromPoints: Zh
}, Symbol.toStringTag, { value: "Module" })), ly = 1e-6, op = Math.PI / 180, lp = 180 / Math.PI;
function Aa(t) {
  return t * op;
}
function cy(t) {
  return t * lp;
}
function qe(t, e, r) {
  return t < e ? e : t > r ? r : t;
}
function cp(t, e, r) {
  return e === t ? 0 : qe((r - t) / (e - t), 0, 1);
}
function uy(t, e, r) {
  return t + (e - t) * r;
}
function hy(t, e, r) {
  const n = cp(t, e, r);
  return n * n * (3 - 2 * n);
}
function py(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function Pa(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function La(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function up(t, e, r) {
  if (e === "wgsl") return t.wgsl;
  const n = La(r);
  return n ? t[n] : void 0;
}
function hp(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function pp(t, e, r, n) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = Pa(t) === "glsl" ? `请在 \`code\` 里提供 \`${La(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${n}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${hp(r)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const _a = `#version 300 es
`, Ca = `precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, dy = _a + Ca;
function Ma(t) {
  const e = t?.preamble ?? !0, r = e === !0 ? Ca : e === !1 || e === "" ? !1 : e;
  return { version: t?.version ?? !0, preamble: r };
}
const dp = /^\s*#version[^\n]*\n?/, fp = /^(\s*#version[^\n]*\n?)([\s\S]*)$/;
function mp(t) {
  return t ? Object.entries(t).map(([e, r]) => typeof r == "boolean" ? `#define ${e} ${r ? 1 : 0}` : `#define ${e} ${r}`).join(`
`) : "";
}
function gp(t) {
  return t ? Object.entries(t).map(([e, r]) => typeof r == "boolean" ? `const ${e}: bool = ${r};` : typeof r == "number" ? Number.isInteger(r) ? `const ${e}: i32 = ${r};` : `const ${e}: f32 = ${r};` : `const ${e}: f32 = ${r};`).join(`
`) : "";
}
function bp(t, e, r = "shader", n) {
  const { version: i, preamble: s } = Ma(n), a = mp(e);
  if (!i && !s && !a) return t;
  let o = "", l = t;
  if (i) {
    const h = /^\s*#version\s+([^\n]*)/.exec(t);
    if (h) {
      const d = h[1].trim();
      if (!/^300\s+es\b/.test(d))
        throw new u(
          `[gpu-device-api] ShaderModule「${r}」声明了 \`#version ${d}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。
（要自己掌控 \`#version\`，可以在 createShaderModule 里传 \`glsl: { version: false }\`。）`
        );
    }
    o = _a, l = t.replace(dp, "");
  } else {
    const h = fp.exec(t);
    h && (o = h[1], l = h[2]);
  }
  const c = [o];
  return s && c.push(s), a && c.push(`${a}
`), c.push(l.trim()), `${c.join("")}
`;
}
function wp(t, e) {
  const r = gp(e);
  return r ? `${r}

${t.trim()}
` : `${t.trim()}
`;
}
function bt(t) {
  const { backend: e, source: r, stage: n, label: i = "shader" } = t, s = Pa(e), a = up(r, s, n);
  if (a === void 0)
    throw new u(pp(e, n, r, i));
  return s === "glsl" ? {
    language: s,
    stage: n,
    code: bp(a, t.defines, i, t.glsl),
    hasPreamble: Ma(t.glsl).preamble !== !1
  } : {
    language: s,
    stage: n,
    code: wp(a, t.defines),
    hasPreamble: !1
  };
}
function fy(t, e, r) {
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
${Zr(n)}
`;
  const l = [];
  for (const c of [...s].sort((h, d) => h - d)) {
    l.push(`----- 第 ${c} 行附近 -----`);
    const h = Math.max(1, c - 3), d = Math.min(n.length, c + 3);
    l.push(Zr(n.slice(h - 1, d), h));
  }
  return `${i}
${l.join(`
`)}
`;
}
function Zr(t, e = 1) {
  const r = String(e + t.length - 1).length;
  return t.map((n, i) => `${String(e + i).padStart(r, " ")} | ${n}`).join(`
`);
}
function my(t) {
  return Zr(t.split(`
`));
}
const fe = /* @__PURE__ */ new Map();
function yp(t, e) {
  if (fe.has(t))
    throw new u(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return fe.set(t, e), e;
}
function gy(t) {
  for (const [e, r] of Object.entries(t)) yp(e, r);
}
function by(t, e) {
  return fe.set(t, e), e;
}
function wy(t) {
  return fe.has(t);
}
function yy(t) {
  return fe.get(t);
}
function vy(t) {
  const e = fe.get(t);
  if (!e) {
    const r = vp();
    throw new u(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (r.length > 0 ? `已注册：${r.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function xy(t) {
  return fe.delete(t);
}
function vp() {
  return [...fe.keys()].sort();
}
function Sy() {
  fe.clear();
}
function Ra(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const xp = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, Sp = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, Xn = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function Ty(t) {
  const e = Ra(t), r = [], n = [
    { regex: new RegExp(`${xp}\\s*${Xn}`, "g"), swapped: !1 },
    { regex: new RegExp(`${Sp}\\s*${Xn}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of n) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), l = Number(a[s ? 1 : 2]), c = (a[3] ?? "").trim(), h = a[4], d = a[5].trim().replace(/\s+/g, " ");
      r.some((p) => p.group === o && p.binding === l) || r.push(Tp(o, l, c, h, d));
    }
  }
  return r.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function Tp(t, e, r, n, i) {
  let s = "handle", a;
  if (r.startsWith("uniform"))
    s = "uniform";
  else if (r.startsWith("storage")) {
    s = "storage";
    const c = r.split(",").map((h) => h.trim())[1];
    c === "read" ? a = "read" : c === "read_write" ? a = "read_write" : c === "write" && (a = "write");
  }
  const o = $p(s, i);
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
function $p(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const Hn = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, Ep = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function Ap(t) {
  const e = Ra(t), r = [];
  let n;
  for (Hn.lastIndex = 0; (n = Hn.exec(e)) !== null; ) {
    const i = n[1], s = n[2] ?? "", a = n[3];
    let o = null;
    if (i === "compute") {
      const l = Ep.exec(s);
      o = l ? [Number(l[1]), Number(l[2] ?? 1), Number(l[3] ?? 1)] : [1, 1, 1];
    }
    r.push({ stage: i, name: a, workgroupSize: o });
  }
  return r;
}
function $y(t, e, r) {
  return Ap(t).find((n) => n.stage === e && n.name === r);
}
function Ey(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const Pp = {
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
function Lp(t) {
  return Pp[t] ?? `0x${t.toString(16)}`;
}
const _p = [
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
function Fa(t) {
  return _p.includes(t);
}
function Zn(t, e) {
  const r = [], n = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
  for (let l = 0; l < n; l++) {
    const c = t.getActiveAttrib(e, l);
    c && r.push({
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
  return { attributes: r, uniforms: i, uniformBlocks: a };
}
function Cp(t) {
  return t.uniforms.filter((e) => Fa(e.glType));
}
function Mp(t, e) {
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
  const n = Cp(t).sort((i, s) => i.name.localeCompare(s.name));
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
class Rp {
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
const Ae = Object.freeze({
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
function D(t, e, r) {
  const n = t.getParameter(e);
  return typeof n == "number" && n > 0 ? n : r;
}
const Fp = 16777215;
function Bp(t) {
  return {
    maxTextureSize: D(t, 3379, 2048),
    max3dTextureSize: D(t, 32883, 256),
    maxArrayTextureLayers: D(t, 35071, 256),
    maxSamples: D(t, 36183, 4),
    maxUniformBufferBindings: D(t, 35375, 12),
    maxUniformBlockSize: D(t, 35376, 16384),
    maxUniformBufferOffsetAlignment: D(t, 35380, 256),
    maxVertexAttribs: D(t, 34921, 16),
    maxVertexUniformVectors: D(t, 36347, 128),
    maxFragmentUniformVectors: D(t, 36349, 128),
    maxVaryingVectors: D(t, 36348, 8),
    maxTextureImageUnits: D(t, 34930, 16),
    maxCombinedTextureImageUnits: D(t, 35661, 32),
    maxCubeMapTextureSize: D(t, 34076, 2048),
    maxRenderbufferSize: D(t, 34024, 2048),
    maxElementIndex: Fp,
    maxElementsVertices: D(t, 33001, 2147483647),
    maxElementsIndices: D(t, 33e3, 2147483647)
  };
}
function Gp(t) {
  const e = Bp(t);
  return {
    /*
     * `#18`：WebGL2 **没有** 1D 纹理，所以这个 limit 如实报 0。
     *
     * 改前报的是 `MAX_TEXTURE_SIZE`（本机实测 2048），而同一份能力探测的另一端
     *（`glTextureTarget()` / `WebGL2Texture` 构造）明确拒绝 `dimension: '1d'`。
     * 于是「先读 `device.limits` 再决定要不要用 1D 纹理」的调用方会读到 2048、
     * 据此做出「支持 1D」的决策，然后在 `createTexture()` 那里才吃到异常 ——
     * limits 撒谎属于本会话反复在修的那类「静默错误」（同一个事实有两个互相矛盾的来源）。
     *
     * 为什么不是「用 height = 1 的 2D 纹理模拟出来」：那确实能装下数据，但 `sampler2D` 与
     * `sampler1D` 是两个不同的着色器类型，本层没有「把 2D 纹理按 1D 采样」的表达方式，
     * 承诺一个做不到的 `dimension: '1d'` 会比报 0 更容易误导。
     *
     * 读数为 0 的统一含义（与 WebGPU 的 storage/compute 类 limit 在 WebGL2 上报 0 一致）：
     * **这个后端没有该能力**，请改用 `{ width: n, height: 1 }` 的 2D 纹理或切到 WebGPU。
     */
    maxTextureDimension1D: 0,
    maxTextureDimension2D: e.maxTextureSize,
    maxTextureDimension3D: e.max3dTextureSize,
    maxTextureArrayLayers: e.maxArrayTextureLayers,
    maxBindGroups: Ae.maxBindGroups,
    maxBindGroupsPlusVertexBuffers: Ae.maxBindGroupsPlusVertexBuffers,
    maxBindingsPerBindGroup: Ae.maxBindingsPerBindGroup,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      Ae.maxDynamicUniformBuffersPerPipelineLayout,
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
    minStorageBufferOffsetAlignment: Ae.minStorageBufferOffsetAlignment,
    maxVertexBuffers: Math.min(Ae.maxVertexBuffers, e.maxVertexAttribs),
    maxBufferSize: 2147483647,
    maxVertexAttributes: e.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: e.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: Ae.maxColorAttachmentBytesPerSample,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}
function Op(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), t.getExtension("EXT_disjoint_timer_query_webgl2") && e.add("timestamp-query"), e;
}
function Up(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const r = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", n = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: r, device: n };
}
function Ip(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function Dp(t, e) {
  const r = t.getContext("webgl2", e);
  if (!r)
    throw new u(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return r;
}
class kp {
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
  /**
   * 上一次真正下发的混合状态。
   *
   * `blendEnabled === null` 表示**未知**（从未下发过）；`false` 表示已下发 `disable(BLEND)`。
   * 关闭时下面六个分量**不再有意义**（GL 在 `BLEND` 关闭期间不会读它们），所以比较时跳过；
   * 重新打开时 `enabled` 一定与上一次不同，于是会完整重下发 `enable` + `blendFuncSeparate` +
   * `blendEquationSeparate` —— 与改前用 `'0'` / `'1:...'` 两条不同签名得到的语义完全一致。
   */
  blendEnabled = null;
  blendColorSrc = 0;
  blendColorDst = 0;
  blendColorOp = 0;
  blendAlphaSrc = 0;
  blendAlphaDst = 0;
  blendAlphaOp = 0;
  blendConstant = null;
  colorMask = null;
  depthEnabled = null;
  depthWrite = null;
  depthFunc = null;
  depthBias = null;
  stencil = null;
  cullEnabled = null;
  cullFace = null;
  frontFace = null;
  scissorEnabled = null;
  viewport = null;
  scissor = null;
  /**
   * 最近一次 {@link setScissor} 看到的「整个附件」的矩形（`0, 0, width, height`）。
   *
   * 存在的意义是让 {@link resetScissor} 能在**已经处于复位状态**时一次 GL 调用都不发：
   * 只要「开关已关」且「当前矩形就是这个尺寸的整个附件」，复位就是空操作。
   * 初值 `null` 表示还不知道 —— 那就老老实实下发。
   */
  scissorWholeBox = null;
  /** `UNIFORM_BUFFER_OFFSET_ALIGNMENT` 的记忆值（设备常量，见同名方法）。 */
  uniformAlignment = null;
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
  framebufferBinding = void 0;
  /**
   * 读回纹理时复用的 framebuffer（见 {@link readbackFramebuffer}）。
   *
   * 它不承载任何用户资源，也不属于 `FramebufferCache`（那是「附件组合」的缓存），
   * 所以由状态缓存代为持有、由 {@link dispose} 释放 —— 否则这个 GL 对象既不在设备资源表里，
   * 也没有任何一处会删它。
   */
  readbackFramebufferValue = null;
  /** 读回 framebuffer 上当前挂着哪个纹理、挂在哪个附着点（避免重复挂载同一个附件）。 */
  readbackAttachment = null;
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
    this.program = null, this.vertexArray = null, this.activeUnit = -1, this.textures.clear(), this.samplers.clear(), this.uniformBuffers.clear(), this.arrayBuffer = null, this.copyReadBuffer = null, this.copyWriteBuffer = null, this.indexBuffer = null, this.blendEnabled = null, this.blendColorSrc = 0, this.blendColorDst = 0, this.blendColorOp = 0, this.blendAlphaSrc = 0, this.blendAlphaDst = 0, this.blendAlphaOp = 0, this.blendConstant = null, this.colorMask = null, this.depthEnabled = null, this.depthWrite = null, this.depthFunc = null, this.depthBias = null, this.stencil = null, this.cullEnabled = null, this.cullFace = null, this.frontFace = null, this.scissorEnabled = null, this.viewport = null, this.scissor = null, this.framebufferBinding = void 0;
  }
  /**
   * 只把 framebuffer 绑定标记为未知，其它缓存全部保留。
   *
   * 用在「某段代码临时切了 framebuffer、之后已经恢复」的场合（例如读回纹理时的临时 framebuffer）。
   * 过去的做法是整体 `invalidate()`：那会把 program / blend / depth / cull / VAO / 纹理单元的
   * 记录一并丢掉，于是**紧随其后的那一次 draw 要把固定功能状态全部重下发一遍** ——
   * 在「每帧读回一次、之后照常画」的用法里，这笔开销是白付的（读回只动了 framebuffer 绑定）。
   */
  invalidateFramebufferBinding() {
    this.framebufferBinding = void 0;
  }
  /**
   * 记录「framebuffer 已经切到 `framebuffer`」（不调用 GL，只更新记忆值）。
   *
   * 用在已经**直接** `gl.bindFramebuffer()` 之后：调用方那次调用是必须的（要走 READ/DRAW
   * 这类缓存未覆盖的目标，或在默认 VAO 之类的前提下），这里把结果补记进缓存，
   * 免得之后被迫整体失效。
   */
  noteFramebufferBinding(e) {
    this.framebufferBinding = e;
  }
  /**
   * 绑定 `FRAMEBUFFER`（绑定目标同时作用于读/写两侧）；重复绑定同一个对象会被跳过。
   *
   * 与其它绑定一样，**帧缓冲相关的分帧状态**（`drawBuffers`、各附着点）不在这里检查 ——
   * 它们由 `FramebufferCache` 在创建时设置一次，同一个 framebuffer 对象不被别的路径改。
   */
  bindFramebuffer(e) {
    this.framebufferBinding !== void 0 && this.framebufferBinding === e || (this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, e), this.framebufferBinding = e);
  }
  /**
   * 当前生效的 framebuffer（未知时会同步问一次 GL 并记下来）。
   *
   * WebGL2 的 `FRAMEBUFFER_BINDING` 查询返回的是默认帧缓冲之外的绑定对象，默认帧缓冲是 `null`；
   * 这个查询是同步的，所以只在缓存未知时做一次（`device.native` 外部改过状态后的
   * {@link invalidate} 会让它变回未知）。
   */
  currentFramebuffer() {
    return this.framebufferBinding === void 0 && (this.framebufferBinding = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING)), this.framebufferBinding;
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
  readbackFramebuffer() {
    const e = this.readbackFramebufferValue;
    if (e) return e;
    const r = this.gl.createFramebuffer();
    if (!r)
      throw new u(
        "[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建读回用的 framebuffer。"
      );
    return this.readbackFramebufferValue = r, this.readbackAttachment = null, r;
  }
  /**
   * 把某个纹理挂到读回 framebuffer 的指定附着点上（需要时先摘掉上一个附件）。
   *
   * **必须先摘掉上一个附件**：同一个纹理同时挂在同一个 framebuffer 的两个附着点上会让
   * framebuffer 不完整；而且旧实现每次新建 FBO 所以从没遇到这个问题 —— 复用之后必须显式处理。
   * 摘掉（`framebufferTexture2D(..., null)`）不影响纹理本身，只是解除引用。
   */
  attachReadbackTexture(e, r, n) {
    const i = this.readbackFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, i), this.framebufferBinding = i;
    const s = this.readbackAttachment;
    s && s.texture === e && s.attachment === r || (s && s.texture !== e && this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, s.attachment, this.gl.TEXTURE_2D, null, 0), this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, r, this.gl.TEXTURE_2D, e, n), this.readbackAttachment = { texture: e, attachment: r });
  }
  /**
   * 忘掉「读回 framebuffer 上挂着什么」的记录，**不动 GL 状态**。
   *
   * 给直接操作附着点的调用方用：`WebGL2CommandEncoder.copyTextureToBuffer` 要逐层读回，
   * 于是自己用 `framebufferTextureLayer` 换层号（那条路径不走 {@link attachReadbackTexture}）。
   * 不遗忘的话，下一次 `attachReadbackTexture` 会以为附件还是老样子而跳过重新挂载 ——
   * 实际附着点上已经是另一层（甚至另一张）纹理了。
   */
  forgetReadbackTexture() {
    this.readbackAttachment = null;
  }
  /**
   * 释放状态缓存自己持有的 GL 对象（目前只有复用的读回 framebuffer）。
   *
   * 只应在 `Device.dispose()` / 上下文丢失后调用。幂等。
   */
  dispose() {
    const e = this.readbackFramebufferValue;
    this.readbackFramebufferValue = null, this.readbackAttachment = null, e && this.gl.deleteFramebuffer(e);
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
  setBlend(e, r, n, i, s, a, o) {
    if (this.blendEnabled === e && (!e || this.blendColorSrc === r && this.blendColorDst === n && this.blendColorOp === i && this.blendAlphaSrc === s && this.blendAlphaDst === a && this.blendAlphaOp === o))
      return;
    const l = this.gl;
    e ? (l.enable(l.BLEND), l.blendFuncSeparate(r, n, s, a), l.blendEquationSeparate(i, o)) : l.disable(l.BLEND), this.blendEnabled = e, this.blendColorSrc = r, this.blendColorDst = n, this.blendColorOp = i, this.blendAlphaSrc = s, this.blendAlphaDst = a, this.blendAlphaOp = o;
  }
  setBlendConstant(e) {
    st(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
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
    Vp(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
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
  prepareClear(e) {
    const r = this.gl;
    r.depthMask(!0), e && (r.stencilMaskSeparate(r.FRONT, 4294967295), r.stencilMaskSeparate(r.BACK, 4294967295), this.stencil = null), this.depthWrite = null;
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
  setStencilTest(e) {
    const r = this.gl, n = this.stencil;
    if (!(n !== null && Np(n, e))) {
      if ((n === null || n.enabled !== e.enabled) && (e.enabled ? r.enable(r.STENCIL_TEST) : r.disable(r.STENCIL_TEST)), e.enabled) {
        const i = n?.reference !== e.reference || n?.readMask !== e.readMask, s = e.front, a = e.back;
        (i || n?.front.compare !== s.compare) && r.stencilFuncSeparate(r.FRONT, s.compare, e.reference, e.readMask), (i || n?.back.compare !== a.compare) && r.stencilFuncSeparate(r.BACK, a.compare, e.reference, e.readMask), (n === null || n.front.failOp !== s.failOp || n.front.depthFailOp !== s.depthFailOp || n.front.passOp !== s.passOp) && r.stencilOpSeparate(r.FRONT, s.failOp, s.depthFailOp, s.passOp), (n === null || n.back.failOp !== a.failOp || n.back.depthFailOp !== a.depthFailOp || n.back.passOp !== a.passOp) && r.stencilOpSeparate(r.BACK, a.failOp, a.depthFailOp, a.passOp), n?.writeMask !== e.writeMask && (r.stencilMaskSeparate(r.FRONT, e.writeMask), r.stencilMaskSeparate(r.BACK, e.writeMask));
      }
      this.stencil = {
        enabled: e.enabled,
        reference: e.reference,
        front: { ...e.front },
        back: { ...e.back },
        readMask: e.readMask,
        writeMask: e.writeMask
      };
    }
  }
  setCull(e, r, n) {
    const i = this.gl;
    this.cullEnabled !== e && (e ? i.enable(i.CULL_FACE) : i.disable(i.CULL_FACE), this.cullEnabled = e), e && this.cullFace !== r && (i.cullFace(r), this.cullFace = r), this.frontFace !== n && (i.frontFace(n), this.frontFace = n);
  }
  setViewport(e, r, n, i) {
    st(this.viewport, [e, r, n, i]) || (this.gl.viewport(e, r, n, i), this.viewport = [e, r, n, i]);
  }
  /**
   * 设置 scissor 的开关与矩形（`setScissorRect` 与内部复位都走这里）。
   *
   * `enabled === false` 时只关开关、**不设矩形**（矩形交给 {@link resetScissor} 管理，
   * 因为 GL 的矩形只有在开关打开时才影响结果，而比较矩形也只在打开时才有意义）。
   */
  setScissor(e, r, n, i, s) {
    const a = this.gl;
    e && (this.scissorWholeBox = [0, 0, i, s]), this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !st(this.scissor, [r, n, i, s]) && (a.scissor(r, n, i, s), this.scissor = [r, n, i, s]);
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
  resetScissor(e, r) {
    const n = this.gl, i = [0, 0, e, r];
    this.scissorEnabled === !1 && st(this.scissor, i) && st(this.scissorWholeBox, i) || (n.disable(n.SCISSOR_TEST), n.scissor(0, 0, e, r), this.scissorEnabled = !1, this.scissor = i, this.scissorWholeBox = i);
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
function st(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function Vp(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
function Kn(t, e) {
  return t.compare === e.compare && t.failOp === e.failOp && t.depthFailOp === e.depthFailOp && t.passOp === e.passOp;
}
function Np(t, e) {
  return t.enabled === e.enabled && t.reference === e.reference && t.readMask === e.readMask && t.writeMask === e.writeMask && Kn(t.front, e.front) && Kn(t.back, e.back);
}
const Ce = {
  NO_ERROR: 0,
  INVALID_ENUM: 1280,
  INVALID_VALUE: 1281,
  INVALID_OPERATION: 1282,
  INVALID_FRAMEBUFFER_OPERATION: 1286,
  OUT_OF_MEMORY: 1285,
  CONTEXT_LOST_WEBGL: 37442
};
function Wp(t) {
  return `0x${t.toString(16)}`;
}
function zp(t) {
  return t instanceof ar ? "out-of-memory" : t instanceof ft ? "internal" : "validation";
}
function qp(t, e) {
  const r = Wp(t), n = { glError: t, context: e };
  return t === Ce.OUT_OF_MEMORY ? new ar(
    `[gpu-device-api] GL out of memory (${r}) observed during ${e}.`,
    { details: n }
  ) : t === Ce.INVALID_ENUM || t === Ce.INVALID_VALUE || t === Ce.INVALID_OPERATION || t === Ce.INVALID_FRAMEBUFFER_OPERATION ? new u(
    `[gpu-device-api] GL error ${r} observed during ${e}. This code means "the API was used incorrectly", but GL does not tell which call produced it, nor whether the real cause was validation, memory or the implementation itself.`,
    { details: n }
  ) : t === Ce.CONTEXT_LOST_WEBGL ? new ft(
    `[gpu-device-api] GL context lost (${r}) observed during ${e}. Every GL object created by this device is now invalid; recreate the device and its resources.`,
    { details: n }
  ) : new ft(
    `[gpu-device-api] unknown GL error ${r} observed during ${e}. GL does not define this code, so it comes from the driver or a vendor extension and cannot be classified.`,
    { details: n }
  );
}
class jp {
  filter;
  label;
  errorsSeen = [];
  settle;
  activeValue = !0;
  matched = !1;
  /**
   * 设备在它还没被 `pop` 的时候就被 `dispose()` 了。
   *
   * 此时 `pop()` **不能**返回 `null`：那等于说「这个作用域里没有错误」，而我们其实已经
   * 读不到 GL 错误队列了（设备已销毁）—— 这正是本库明令禁止的「状态撒谎」。
   * 所以单独记一个状态，让 `pop()` 如实拒绝（本批自测抓到的：早期实现返回 `null`）。
   */
  abandoned = !1;
  constructor(e, r, n) {
    this.filter = e, this.label = r, this.settle = n;
  }
  get active() {
    return this.activeValue;
  }
  /**
   * `filter` 是否**真的**命中了 `pop()` 返回的那条错误。
   *
   * GL 不区分那三类错误，所以这里只能回答「本层的 filter 是否等于那条错误的启发式分类」。
   * 为 false 时**不代表**「这条不是设备错误」——它一定是一条真实错误，只是没法把它归到
   * 调用方给的那一类里去。`pop()` 之前恒为 false。
   */
  get filterMatched() {
    return this.matched;
  }
  /**
   * 本作用域内读到的**全部**错误（按读取顺序）。
   *
   * 长度大于 1 说明排空 GL 队列时一次拿到了多条（驱动会合并 / 覆盖，本层读到多少记多少）。
   * 其中最多一条会被 `pop()` 返回，其余走 `onError` —— 没有一条被静默丢弃。
   */
  get errors() {
    return this.errorsSeen;
  }
  pop() {
    if (this.abandoned)
      return Promise.reject(
        new u(
          `[gpu-device-api] error scope "${this.label}" can no longer be settled: the device was disposed while this scope was still on the stack, so the GL error queue cannot be read any more. This is NOT "no error in scope" — resolving null here would be a lie.`
        )
      );
    if (!this.activeValue)
      return Promise.reject(
        new u(
          `[gpu-device-api] error scope "${this.label}" has already been popped; each pushErrorScope() must be popped at most once.`
        )
      );
    const e = this.settle(this);
    return Promise.resolve(e);
  }
  /** 记录一条本作用域期间读到的错误（由宿主设备在排空时调用）。 */
  record(e) {
    this.errorsSeen.push(e);
  }
  /** 宿主设备算出「这条错误留在本层」后把命中与否写回来。 */
  markFilterMatched(e) {
    this.matched = e;
  }
  /**
   * 设备销毁时，对**被遗弃的**（还没 `pop` 的）作用域调用。
   *
   * 与 {@link WebGL2ErrorScope.close} 刻意分开：`close()` 表示「正常出栈了」，
   * 而这里表示「设备没了，这个作用域永远不会被落定」。两者对 `pop()` 的答复完全不同
   * （一个说「已经 pop 过」、一个说「设备已销毁、无法落定」），混成一个状态就会给出
   * 误导性的消息 —— 本批自测就是这么抓到早期实现的 `pop()` 会静默 resolve 成 `null` 的。
   */
  abandon() {
    this.abandoned = !0, this.activeValue = !1;
  }
  /** 正常出栈后调用；幂等。 */
  close() {
    this.activeValue = !1;
  }
}
const Jn = rt("gpu-device-api"), Qp = [
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
function Yp(t) {
  const e = t.transfer;
  if (typeof e == "function")
    try {
      e.call(t, 0);
    } catch {
    }
}
class Xp {
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
  /**
   * 映射状态。GL 没有原生映射，本后端用影子缓冲模拟，所以只有 `'unmapped'` 与 `'mapped'`
   * 两个状态（没有「等待原生」的 `'pending'` 窗口）。
   *
   * 与 WebGPU 后端一样，状态是唯一真相：`mapping` 是它的实现细节，`mapped` 由它派生，
   * `getMappedRange()` 只看状态。
   */
  _mapState = "unmapped";
  _disposed = !1;
  constructor(e, r, n, i) {
    if (et(n.size, "BufferDescriptor.size"), n.size % 4 !== 0)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size 必须是 4 的倍数，实际是 ${n.size}。（WebGPU 也有同样的限制，这里提前拦下以免两个后端行为不一致。）`
      );
    for (const a of Qp)
      if (n.usage & a.flag)
        throw new u(
          `[gpu-device-api] BufferUsage.${a.name} 在 WebGL2 后端不可用：${a.reason}`
        );
    this.gl = e, this.state = r, this.onDestroy = i, this.label = n.label ?? U("buffer"), this.id = U("buf"), this.size = n.size, this.usage = n.usage, this.usages = n.usage, this.bindingTarget = n.usage & O.Index ? e.ELEMENT_ARRAY_BUFFER : e.COPY_WRITE_BUFFER;
    const s = e.createBuffer();
    if (!s) throw new u("[gpu-device-api] gl.createBuffer() 返回 null，无法分配 buffer。");
    if (this.native = s, this.withTarget(() => e.bufferData(this.bindingTarget, n.size, e.DYNAMIC_DRAW)), n.mappedAtCreation === !0) {
      const a = new ArrayBuffer(n.size);
      this.mapping = { mode: "write", offset: 0, size: n.size, data: a, dirty: !0 }, this._mapState = "mapped";
    }
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
  get mapState() {
    return this._mapState;
  }
  /** 由 {@link WebGL2Buffer.mapState} 派生，两者任何时候都一致。 */
  get mapped() {
    return this._mapState === "mapped";
  }
  async mapAsync(e, r = 0, n = this.size - r) {
    if (this.assertUsable("mapAsync"), this._mapState !== "unmapped")
      throw new u(
        `[gpu-device-api] buffer「${this.label}」已处于映射状态（mapState: "${this._mapState}"），请先 unmap()。`
      );
    if (Te(r, "mapAsync 的 offset"), et(n, "mapAsync 的 size"), r % 4 !== 0)
      throw new u(
        `[gpu-device-api] mapAsync 的 offset 必须是 4 的倍数，实际是 ${r}。（WebGPU 要求 8 的倍数，这里按更宽松的 4 处理。）`
      );
    if (r + n > this.size)
      throw new u(
        `[gpu-device-api] mapAsync 的范围 [${r}, ${r + n}) 超出了 buffer 大小 ${this.size}。`
      );
    if (e === "read") {
      const i = new ArrayBuffer(n);
      this.download(r, new Uint8Array(i)), this.mapping = { mode: e, offset: r, size: n, data: i, dirty: !1 };
    } else
      this.mapping = { mode: e, offset: r, size: n, data: new ArrayBuffer(n), dirty: !0 };
    return this._mapState = "mapped", this.mapping.data;
  }
  /**
   * 当前已映射范围里的一段（`offset` 相对映射起点，与 WebGPU 后端一致）。
   *
   * ## 返回的是影子内存上的视图，不是副本
   *
   * - 整段范围：直接返回 `mapAsync()` 给出去的那个影子 `ArrayBuffer`；
   * - 部分范围：返回**建在同一块影子内存上的 `Uint8Array` 视图**（等价于
   *   `new Uint8Array(mapping.data).subarray(offset, offset + length)`）。
   *
   * 之前这里用 `slice()` 返回副本，于是 `mapAsync('write')` → `getMappedRange(offset, size)` →
   * 写 → `unmap()` 的数据**上传的是零**（写进了临时副本），与 WebGPU 后端一致地错，
   * 任何后端对比都发现不了。现在两端都是视图语义。
   *
   * ## 生命周期
   *
   * `unmap()` 之后影子内存被 detach，视图随之失效（长度归零、读得到 `undefined`、写入被静默忽略，
   * `slice()` 之类的调用抛 `TypeError`），与 WebGPU 的 `unmap()` 一致。要在 `unmap()` **之前**
   * 把数据拷走（`range.slice()`）；之后再访问属于未定义行为。
   */
  getMappedRange(e = 0, r) {
    const n = this.mapping;
    if (this._mapState !== "mapped" || !n)
      throw new u(
        `[gpu-device-api] buffer「${this.label}」尚未映射（mapState: "${this._mapState}"），请先 await mapAsync()（或在创建时用 mappedAtCreation: true）。`
      );
    const i = r ?? n.size - e;
    if (e < 0 || i <= 0 || e + i > n.size)
      throw new u(
        `[gpu-device-api] getMappedRange(${e}, ${i}) 超出已映射范围 ${n.size}。`
      );
    return e === 0 && i === n.size ? n.data : new Uint8Array(n.data, e, i);
  }
  /**
   * 结束映射：`write` 映射在此把影子内存上传到 GL buffer，然后让映射视图失效。
   *
   * 上传必须在 detach **之前**做（detach 之后影子内存就不可读了）；未映射时是空操作。
   */
  unmap() {
    const e = this.mapping;
    if (!e) {
      const r = this._mapState;
      r !== "unmapped" && (this._mapState = "unmapped", Jn.warn(
        `buffer「${this.label}」的 mapState 是 "${r}" 但内部没有映射记录；状态已复位为 'unmapped'。`
      ));
      return;
    }
    this.mapping = null, this._mapState = "unmapped", e.mode === "write" && e.dirty && this.upload(e.offset, new Uint8Array(e.data)), Yp(e.data);
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
    this._disposed || (this.mapping !== null && this.mapping.mode === "write" && this.mapping.dirty && Jn.warn(
      `buffer「${this.label}」在被映射（mapState: "${this._mapState}"）的状态下被 destroy()，这次写入的内容没有上传到 GPU。请在 destroy() 之前调用 unmap()。`
    ), this._disposed = !0, this._mapState = "unmapped", this.mapping = null, this.state.forgetUniformBuffer(this.native), this.state.forgetIndexBuffer(this.native), this.gl.deleteBuffer(this.native), this.onDestroy(this));
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
const Lt = 6403, _t = 33319, Hp = 6407, Ue = 6408, Ie = 36244, De = 33320, ke = 36249, $r = 6402, Zp = 34041, Pe = 5121, Ve = 5120, Ct = 5123, Er = 5122, at = 5125, Ar = 5124, Mt = 5126, Pr = 5131, Kp = 33640, Jp = 34042, ed = 33321, td = 36756, rd = 33330, nd = 33329, id = 33332, sd = 33331, ad = 33325, od = 33323, ld = 36757, cd = 33336, ud = 33335, hd = 33334, pd = 33333, dd = 33326, fd = 33338, md = 33337, gd = 33327, bd = 32856, wd = 35907, yd = 36759, vd = 36220, xd = 36222, Sd = 32857, Td = 35898, $d = 33340, Ed = 33339, Ad = 33328, Pd = 36214, Ld = 36216, _d = 34842, Cd = 36208, Md = 36226, Rd = 34836, Fd = 33189, Bd = 33190, Gd = 35056, Od = 36012;
function $(t, e, r, n, i = {}) {
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
const Ud = Object.freeze({
  r8unorm: $(ed, Lt, Pe, 1, { uploadType: "Uint8Array" }),
  r8snorm: $(td, Lt, Ve, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: $(rd, Ie, Pe, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: $(nd, Ie, Ve, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: $(id, Ie, Ct, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: $(sd, Ie, Er, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: $(ad, Lt, Pr, 2, { uploadType: "Uint16Array" }),
  rg8unorm: $(od, _t, Pe, 2, { uploadType: "Uint8Array" }),
  rg8snorm: $(ld, _t, Ve, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: $(cd, De, Pe, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: $(ud, De, Ve, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: $(hd, Ie, at, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: $(pd, Ie, Ar, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: $(dd, Lt, Mt, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: $(fd, De, Ct, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: $(md, De, Er, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: $(gd, _t, Pr, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: $(bd, Ue, Pe, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": $(wd, Ue, Pe, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: $(yd, Ue, Ve, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: $(vd, ke, Pe, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: $(xd, ke, Ve, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: $(Sd, Ue, Kp, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: $(Td, Hp, at, 4, { attachment: !1, uploadType: null }),
  rg32uint: $($d, De, at, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: $(Ed, De, Ar, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: $(Ad, _t, Mt, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: $(Pd, ke, Ct, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: $(Ld, ke, Er, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: $(_d, Ue, Pr, 8, { uploadType: "Uint16Array" }),
  rgba32uint: $(Cd, ke, at, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: $(Md, ke, Ar, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: $(Rd, Ue, Mt, 16, { uploadType: "Float32Array" }),
  depth16unorm: $(Fd, $r, Ct, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: $(Bd, $r, at, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": $(Gd, Zp, Jp, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: $(Od, $r, Mt, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), Id = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function F(t) {
  const e = Id[t];
  if (e)
    throw new u(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const r = Ud[t];
  if (!r)
    throw new u(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return r;
}
function Dd(t) {
  return F(t).attachment;
}
function kd(t, e) {
  const r = F(t);
  if (r.uploadType === null)
    throw new u(
      `[gpu-device-api] 纹理格式「${t}」不支持从主机内存上传。`
    );
  const n = e.constructor.name;
  if (n !== r.uploadType) {
    const i = t === "rgba16float" || t === "r16float" || t === "rg16float" ? "（该格式是 half float，需要先把 Float32 转成 Uint16 位模式，可用 Float32Array 与 Uint16Array 共享同一段内存来做转换。）" : "";
    throw new u(
      `[gpu-device-api] 纹理格式「${t}」要求主机数据是 ${r.uploadType}，实际传入 ${n}。${i}`
    );
  }
}
class Ba {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, r) {
    const n = Yt(e, r);
    if (n.swizzle !== void 0 && n.swizzle !== mt)
      throw new u(
        `[gpu-device-api] texture view「${r.label ?? "(unnamed)"}」要求 swizzle「${n.swizzle}」，但 WebGL2 后端做不到：GLES 3.0 没有 view 对象，采样时各通道的取值由纹理内部格式决定，没有任何调用能在绑定点上重排通道（桌面 GL 的 GL_TEXTURE_SWIZZLE_* 是 GL 3.3 / GLES 3.1 的能力，WebGL2 不暴露这些枚举，相关扩展在本机实测也全部拿不到）。替代方案：在着色器里直接写通道选择（\`texture(...).rrr\` / \`vec4(t.r, t.r, t.r, 1.0)\`），或者先按需要的通道布局重建一张纹理再采样，或者切到 WebGPU 后端（它有真正的 \`swizzle\`）。`
      );
    if (n.format !== void 0 && n.format !== e.format)
      throw new u(
        `[gpu-device-api] texture view「${r.label ?? "(unnamed)"}」要求把纹理「${e.label}」重解释成「${n.format}」，但 WebGL2 后端做不到：GL 没有 view 对象，采样用的始终是源纹理自己的内部格式，于是着色器会按另一种格式去解释同一段内存（不报错，数值无意义）。请为需要的格式单独创建一张纹理，或把数据拷进一张「${n.format}」纹理后再采样。`
      );
    if (n.dimension === "cube" || n.dimension === "cube-array")
      throw new u(
        `[gpu-device-api] texture view「${r.label ?? "(unnamed)"}」要求 dimension「${n.dimension}」，但 WebGL2 后端不支持立方体贴图采样：GLES 3.0 的立方体贴图是独立的 TEXTURE_CUBE_MAP 纹理目标，而本后端的纹理按 TEXTURE_2D / TEXTURE_2D_ARRAY / TEXTURE_3D 分配（本后端的 TextureDescriptor 也没有 cube 维度），两者无法互相重解释。替代方案：用 2D array 纹理（\`size.depthOrArrayLayers = 6\`）承载 6 个面，在着色器里用\`sampler2DArray\` 手动按面选层（例如按主法线轴算层号），需要方向采样时自己做一次坐标到「层 + uv」的换算；或者切到 WebGPU 后端（它有真正的 \`cube\` / \`cube-array\` view）。`
      );
    if (n.dimension !== ei(e))
      throw new u(
        `[gpu-device-api] texture view 的 dimension「${n.dimension}」与纹理「${e.label}」的「${ei(e)}」不一致；WebGL2 没有 view 对象，维度的差别无法表达（GL 的纹理目标在分配时就定下了）。`
      );
    if (n.baseMipLevel + n.mipLevelCount > e.mipLevelCount)
      throw new u(
        `[gpu-device-api] texture view 的 mip 范围 [${n.baseMipLevel}, ${n.baseMipLevel + n.mipLevelCount}) 超出了纹理「${e.label}」的 ${e.mipLevelCount} 层。`
      );
    if (n.baseArrayLayer + n.arrayLayerCount > e.depthOrArrayLayers)
      throw new u(
        `[gpu-device-api] texture view 的层范围 [${n.baseArrayLayer}, ${n.baseArrayLayer + n.arrayLayerCount}) 超出了纹理「${e.label}」的 ${e.depthOrArrayLayers} 层。`
      );
    this.texture = e, this.descriptor = n, this.label = r.label ?? U("textureView");
  }
  /** WebGL2 里 view 就是纹理本身，所以直接返回 GL 纹理句柄。 */
  get native() {
    return this.texture.native;
  }
  /**
   * 实际生效的通道重排。
   *
   * WebGL2 上**唯一**能生效的值就是不重排（`'rgba'`）：构造函数已经拒绝了其它取值，
   * 所以这里恒为 `'rgba'`，与 WebGPU 后端的默认值一致。
   */
  get swizzle() {
    return mt;
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
function ei(t) {
  return t.dimension === "3d" ? "3d" : t.depthOrArrayLayers > 1 ? "2d-array" : "2d";
}
const Vd = /* @__PURE__ */ new Set(["r32float", "rg32float", "rgba32float"]);
function Nd(t, e) {
  if (t === "1d")
    throw new u(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class ti {
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
    const s = or(n.size);
    if (et(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new u(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = F(n.format), o = n.dimension ?? zt.D2, l = n.sampleCount ?? 1, c = n.mipLevelCount ?? 1;
    if (l > 1) {
      if (o !== zt.D2 || s.depthOrArrayLayers > 1)
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
    this.label = n.label ?? U("texture"), this.dimension = o, this.format = n.format, this.usage = n.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = c, this.sampleCount = l, this.glTarget = Nd(o, s.depthOrArrayLayers);
    const h = e.createTexture();
    if (!h) throw new u("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = h, e.bindTexture(this.glTarget, h), l > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === zt.D3 ? e.texStorage3D(
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
    const r = new Ba(this, e);
    return this.views.push(r), r;
  }
  /**
   * 用 GL 内置的 `generateMipmap` 生成 mip 链（第 1 级到第 `mipLevelCount - 1` 级）。
   *
   * 前提条件（不满足就抛 {@link ValidationError}，不做静默降级）：
   * - 单采样（多重采样纹理没有 mip 链）；
   * - `mipLevelCount > 1`（否则没有任何级别可生成）；
   * - 格式必须是「color-renderable 且可过滤」的 unorm / 浮点格式：`generateMipmap` 内部
   *   就是一次带滤波的降采样，整数格式（`*uint` / `*sint`）、snorm 与纯深度 / 模板格式在
   *   GL 里都不满足这个条件，硬调用只会在 `getError()` 里留下一条很难定位的
   *   `INVALID_OPERATION`。32 位浮点格式还需要 `EXT_color_buffer_float` 才是 color-renderable。
   *
   * **颜色空间（这里最容易写错）**：格式是 `rgba8unorm-srgb` 时，GL 会把纹素**先解码到线性
   * 空间**、在线性空间做盒式滤波，再把结果编码回 sRGB 写进各级 mip。这是唯一正确的做法：
   * 直接对 sRGB 编码字节求平均会系统性偏暗 —— 黑白棋盘的第 1 级，线性平均得到 sRGB 188，
   * 而对编码字节求平均只有 128。实测对比见 `examples/core-texture-mipmap.ts`。
   *
   * 调用后会 `invalidate()` 整个状态缓存：为了生成 mip 必须把这张纹理绑到当前活动单元，
   * 而状态缓存并不知道「当前活动单元」是哪一个，与其猜错不如整体作废。
   * 这是加载期的一次性操作，代价可以接受。
   */
  generateMipmaps() {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: the texture has been destroyed.`
      );
    if (this.sampleCount > 1)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: a multisampled texture (sampleCount=${this.sampleCount}) has no mip chain.`
      );
    if (this.mipLevelCount <= 1)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: mipLevelCount is 1, so there is no level to generate; allocate the texture with an explicit mipLevelCount (fullMipLevelCount(size)).`
      );
    const e = F(this.format);
    if (!e.attachment || e.sampleType !== "float")
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" cannot be used with generateMipmap on WebGL2, which requires a color-renderable and filterable format (integer, snorm and pure depth/stencil formats are none of those). Use rgba8unorm, rgba8unorm-srgb, r8unorm or a float format instead.`
      );
    if (Vd.has(this.format) && !this.gl.getExtension("EXT_color_buffer_float"))
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" is only color-renderable (and therefore a valid generateMipmap target) when the context exposes EXT_color_buffer_float, which it does not.`
      );
    this.gl.bindTexture(this.glTarget, this.native), this.gl.generateMipmap(this.glTarget), this.state.invalidate();
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
const Wd = {
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
}, Mn = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, zd = {
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
}, Rt = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, qd = {
  keep: 7680,
  zero: 0,
  replace: 7681,
  invert: 5386,
  "increment-clamp": 7682,
  "decrement-clamp": 7683,
  "increment-wrap": 34055,
  "decrement-wrap": 34056
}, ri = {
  front: 1028,
  back: 1029
}, jd = {
  ccw: 2305,
  cw: 2304
}, Lr = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, Qd = {
  nearest: 9728,
  linear: 9729
}, Yd = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, ni = 5121, ii = 5120, si = 5123, ai = 5122, Xd = 5125, Hd = 5124, Zd = 5126, Kd = 5131, Jd = {
  float32: { type: Zd, normalized: !1, integer: !1 },
  float16: { type: Kd, normalized: !1, integer: !1 },
  unorm8: { type: ni, normalized: !0, integer: !1 },
  snorm8: { type: ii, normalized: !0, integer: !1 },
  uint8: { type: ni, normalized: !1, integer: !0 },
  sint8: { type: ii, normalized: !1, integer: !0 },
  unorm16: { type: si, normalized: !0, integer: !1 },
  snorm16: { type: ai, normalized: !0, integer: !1 },
  uint16: { type: si, normalized: !1, integer: !0 },
  sint16: { type: ai, normalized: !1, integer: !0 },
  uint32: { type: Xd, normalized: !1, integer: !0 },
  sint32: { type: Hd, normalized: !1, integer: !0 }
}, ef = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function tf(t) {
  const e = ef.exec(t);
  if (!e)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const r = Jd[e[1]];
  if (!r)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: Re(t).components,
    type: r.type,
    normalized: r.normalized,
    integer: r.integer
  };
}
function je(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return nf(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const r = t;
    return [r[0] ?? 0, r[1] ?? 0, r[2] ?? 0, r[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const rf = {
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
function nf(t) {
  const e = t.trim().toLowerCase(), r = rf[e];
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
  throw new u(
    `[gpu-device-api] 无法解析颜色「${t}」。支持 CSS 十六进制、rgb()/rgba()、少量颜色名、0xRRGGBB、[r,g,b,a] 与 { r, g, b, a }。`
  );
}
const sf = 9728, af = 9729, of = 9984, lf = 9985, cf = 9986, uf = 9987, oi = Number.POSITIVE_INFINITY;
function hf(t, e, r) {
  return r <= 1 ? t === "linear" ? af : sf : t === "linear" ? e === "linear" ? uf : lf : e === "linear" ? cf : of;
}
class pf {
  label;
  descriptor;
  native;
  gl;
  state;
  /**
   * 释放完成后的通知回调。
   *
   * `WebGL2Device` 用它把自己从资源追踪集合里摘掉（见 `WebGL2Device.untrack`）——
   * 不做这一步，「每帧 create/destroy」的用法会让追踪集合一直强引用已经删掉的 sampler 对象
   * 与原生句柄，直到 `device.dispose()`。不传时为空操作，sampler 仍可独立使用。
   */
  onDispose;
  _disposed = !1;
  /** 当前按几级 mip 映射 `TEXTURE_MIN_FILTER`；`MIPS_ASSUMED` 表示假定有 mip。 */
  mipLevelCount = oi;
  constructor(e, r, n = {}, i = () => {
  }) {
    this.gl = e, this.state = r, this.onDispose = i, this.descriptor = xs(n), this.label = n.label ?? U("sampler");
    const s = e.createSampler();
    if (!s) throw new u("[gpu-device-api] gl.createSampler() 返回 null，无法分配 sampler。");
    this.native = s;
    const a = this.descriptor;
    if (a.magFilter !== "nearest" && a.magFilter !== "linear")
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": magFilter must be "nearest" or "linear" (WebGPU never uses mipmaps for magnification), got "${String(a.magFilter)}".`
      );
    if (a.minFilter !== "nearest" && a.minFilter !== "linear")
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": minFilter must be "nearest" or "linear", got "${String(a.minFilter)}".`
      );
    if (a.mipmapFilter !== "nearest" && a.mipmapFilter !== "linear")
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": mipmapFilter must be "nearest" or "linear", got "${String(a.mipmapFilter)}".`
      );
    if (e.samplerParameteri(s, e.TEXTURE_MAG_FILTER, Qd[a.magFilter]), this.applyMinFilter(), e.samplerParameteri(s, e.TEXTURE_WRAP_S, Lr[a.addressModeU]), e.samplerParameteri(s, e.TEXTURE_WRAP_T, Lr[a.addressModeV]), e.samplerParameteri(s, e.TEXTURE_WRAP_R, Lr[a.addressModeW]), e.samplerParameterf(s, e.TEXTURE_MIN_LOD, a.lodMinClamp), e.samplerParameterf(s, e.TEXTURE_MAX_LOD, a.lodMaxClamp), a.compare !== void 0 ? (e.samplerParameteri(s, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(s, e.TEXTURE_COMPARE_FUNC, Mn[a.compare])) : e.samplerParameteri(s, e.TEXTURE_COMPARE_MODE, e.NONE), a.maxAnisotropy > 1) {
      const o = e.getExtension("EXT_texture_filter_anisotropic");
      if (o) {
        const l = Ip(e);
        e.samplerParameterf(
          s,
          o.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(a.maxAnisotropy, l)
        );
      }
    }
  }
  /**
   * 当前映射出来的 GL `TEXTURE_MIN_FILTER`（供调试与单测断言）。
   *
   * 默认按「纹理有 mip」算 —— WebGPU 的语义就是「只要有 mip 就用 mip」，
   * 而 sampler 对象在 WebGL2 里是先于纹理创建的。
   */
  get minFilter() {
    return hf(
      this.descriptor.minFilter,
      this.descriptor.mipmapFilter,
      this.mipLevelCount
    );
  }
  /** 当前是按几级 mip 映射的；`Infinity` 表示「假定有 mip」。 */
  get assumedMipLevelCount() {
    return this.mipLevelCount;
  }
  /**
   * 告诉 sampler 它要被用来采样一张有几级 mip 的纹理。
   *
   * 传 `<= 1` 会把 `TEXTURE_MIN_FILTER` 降级成不带 mip 的 `NEAREST` / `LINEAR`：
   * 只有第 0 级的纹理配上 `*_MIPMAP_*` 在 GL 里得不到完整纹理。
   * 传 `null` 回到「假定有 mip」（构造时的默认值）。
   *
   * 这是一个**显式**接口而不是自动探测：WebGL2 / WebGPU 都把 sampler 与纹理解耦，
   * sampler 对象在任何时刻都拿不到「将要采样哪张纹理」，只有绑定层知道。
   */
  setMipLevelCount(e) {
    const r = e === null ? oi : e;
    r !== this.mipLevelCount && (this.mipLevelCount = r, !this._disposed && this.applyMinFilter());
  }
  applyMinFilter() {
    this.gl.samplerParameteri(this.native, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
  }
  get disposed() {
    return this._disposed;
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.gl.deleteSampler(this.native), this.state.invalidate(), this.onDispose(this));
  }
  dispose() {
    this.destroy();
  }
}
class df {
  label;
  source;
  defines;
  glsl;
  onDispose;
  _disposed = !1;
  /**
   * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   *   （见 `WebGL2Device.untrack`）。不传时为空操作，模块仍可独立使用。
   */
  constructor(e, r = () => {
  }) {
    this.label = e.label ?? U("shaderModule"), this.source = Ss(e.code), this.defines = e.defines ? { ...e.defines } : {}, this.glsl = e.glsl ? { ...e.glsl } : {}, this.onDispose = r;
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
   *
   * 幂等：重复调用不会重复通知设备。
   */
  dispose() {
    this._disposed || (this._disposed = !0, this.onDispose());
  }
}
const tr = "EXT_disjoint_timer_query_webgl2", Kr = 35887;
function ff(t) {
  return t.getExtension(tr) ?? null;
}
class Ga {
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
  constructor(e, r, n = () => {
  }) {
    if (this.gl = e, this.onDestroy = n, this.label = r.label ?? U("querySet"), !Number.isInteger(r.count) || r.count <= 0)
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(r.count)}.`
      );
    if (r.type === Je.Timestamp) {
      const s = ff(e);
      if (!s)
        throw new u(
          `[gpu-device-api] QuerySet "${this.label}": WebGL2 timestamp queries need the "${tr}" extension, which this context does not expose. That extension is the only way to measure GPU time on WebGL2; without it, GPU timing is unavailable. Use the WebGPU backend (feature "timestamp-query") or a driver/browser build that implements it.`
        );
      this.timerExtension = s, this.target = s.TIME_ELAPSED_EXT;
    } else
      this.timerExtension = null, this.target = Kr;
    const i = [];
    for (let s = 0; s < r.count; s++) {
      const a = e.createQuery();
      if (!a) {
        for (const o of i) e.deleteQuery(o);
        throw new u(
          `[gpu-device-api] QuerySet "${this.label}": gl.createQuery() returned null for entry ${s} (the context ran out of query objects or was lost).`
        );
      }
      i.push(a);
    }
    this.type = r.type, this.count = r.count, this.native = i;
  }
  get disposed() {
    return this._disposed;
  }
  /** 取第 index 条 GL query；越界时抛错。 */
  queryAt(e, r) {
    if (!Number.isInteger(e) || e < 0 || e >= this.count)
      throw new u(
        `[gpu-device-api] ${r}: query index ${String(e)} is outside the query set "${this.label}" range [0, ${this.count}).`
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
function Jr(t, e) {
  if (t instanceof Ga) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGL2 query set created by WebGL2Device.createQuerySet().`
  );
}
class li {
  label;
  entries;
  sortedEntries;
  onDispose;
  _disposed = !1;
  /**
   * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   *   （见 `WebGL2Device.untrack`）。不传时为空操作。
   */
  constructor(e, r = () => {
  }) {
    this.label = e.label ?? U("bindGroupLayout"), this.sortedEntries = $s(e.entries), this.entries = this.sortedEntries, this.onDispose = r;
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
  /** 幂等：重复调用不会重复通知设备。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.onDispose());
  }
}
class mf {
  label;
  layout;
  entries;
  byBinding;
  onDispose;
  _disposed = !1;
  /**
   * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   *   （见 `WebGL2Device.untrack`）。不传时为空操作。
   */
  constructor(e, r = () => {
  }) {
    this.label = e.label ?? U("bindGroup"), this.layout = e.layout, this.entries = [...e.entries], this.byBinding = new Map(this.entries.map((n) => [n.binding, n])), this.onDispose = r, this.validate();
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
  /**
   * GL 里没有 bind group 对象，释放只是把本包装对象标记为不可用并通知设备。
   * 幂等：重复调用不会重复通知设备。
   */
  dispose() {
    this._disposed || (this._disposed = !0, this.byBinding.clear(), this.onDispose());
  }
  /** 校验：每个条目都能在布局里找到，且类型对得上。 */
  validate() {
    const e = /* @__PURE__ */ new Set();
    for (const r of this.entries) {
      if (e.has(r.binding))
        throw new u(
          `[gpu-device-api] BindGroup「${this.label}」里 binding ${r.binding} 出现了多次。`
        );
      e.add(r.binding);
      const n = this.layout.entry(r.binding);
      if (!n)
        throw new u(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${r.binding} 在布局「${this.layout.label}」里没有声明。布局声明的 binding：${this.layout.sortedEntries.map((o) => o.binding).join("、")}。`
        );
      const i = r.resource, s = "buffer" in i ? "buffer" : "sampler" in i ? "sampler" : "view" in i ? "texture" : "unknown", a = n.type === "uniform" || n.type === "storage" || n.type === "read-only-storage" ? "buffer" : n.type === "texture" || n.type === "storage-texture" ? "texture" : "sampler";
      if (s !== a)
        throw new u(
          `[gpu-device-api] BindGroup「${this.label}」的 binding ${r.binding} 类型不匹配：布局要求 ${a}，实际给了 ${s}。`
        );
    }
  }
}
class _r {
  label;
  bindGroupLayouts;
  isAuto;
  plan;
  onDispose;
  _disposed = !1;
  /**
   * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   *   （见 `WebGL2Device.untrack`）。不传时为空操作。
   */
  constructor(e, r, n, i = () => {
  }) {
    if (this.label = e.label ?? U("pipelineLayout"), this.bindGroupLayouts = [...e.bindGroupLayouts], this.isAuto = r, this.onDispose = i, this.bindGroupLayouts.length > 4)
      throw new u(
        `[gpu-device-api] pipeline layout 声明了 ${this.bindGroupLayouts.length} 个 bind group，WebGL2 后端最多支持 4 个（与 WebGPU 默认的 maxBindGroups 一致）。`
      );
    this.plan = n && this.bindGroupLayouts.length > 0 ? n.planCache.get(this.bindGroupLayouts.map((s) => s.sortedEntries)) : null;
  }
  get native() {
    return this.plan;
  }
  /** 该布局对应的绑定计划；没有 bind group 时为 `null`。 */
  get bindingPlan() {
    return this.plan;
  }
  get disposed() {
    return this._disposed;
  }
  /**
   * 布局本身不持有 GL 资源，释放只是标记不可用并通知设备（绑定计划由设备级缓存管理）。
   * 幂等：重复调用不会重复通知设备。
   */
  dispose() {
    this._disposed || (this._disposed = !0, this.onDispose());
  }
}
function ci(t, e) {
  return `${t}:${e}`;
}
function gf(t, e) {
  const r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((p, f) => {
    const m = [...p].sort((b, w) => b.binding - w.binding), g = m.filter((b) => b.type === k.Sampler || b.type === k.ComparisonSampler);
    for (const b of m)
      switch (i.push(`${f}:${b.binding}:${b.type}:${b.name ?? ""}:${b.buffer?.hasDynamicOffset ? "dyn" : ""}`), b.type) {
        case k.Uniform: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${f} 的 binding ${b.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new u(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          r.set(ci(f, b.binding), {
            group: f,
            binding: b.binding,
            name: b.name,
            blockBinding: s++,
            dynamic: b.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: b.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case k.Texture: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${f} 的 binding ${b.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new u(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const w = bf(b, g);
          n.set(ci(f, b.binding), {
            group: f,
            binding: b.binding,
            name: b.name,
            unit: a++,
            samplerBinding: w ? w.binding : null,
            samplerName: w ? w.name ?? null : null,
            // WebGPU 的默认值是 `'float'`，这里保持一致。
            sampleType: b.texture?.sampleType ?? "float"
          });
          break;
        }
        case k.Sampler:
        case k.ComparisonSampler:
          break;
        case k.Storage:
        case k.ReadOnlyStorage:
          throw new u(
            `[gpu-device-api] group ${f} 的 binding ${b.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case k.StorageTexture:
          throw new u(
            `[gpu-device-api] group ${f} 的 binding ${b.binding} 是 storage texture，WebGL2 不支持。请改用「渲染到纹理 + 采样」的方式。`
          );
        default: {
          const w = b.type;
          throw new u(`[gpu-device-api] 未知的 binding 类型：${String(w)}`);
        }
      }
  });
  const o = new Set(
    [...n.values()].map((p) => p.samplerBinding).filter((p) => p !== null)
  );
  for (const [p, f] of t.entries())
    for (const m of f)
      if ((m.type === k.Sampler || m.type === k.ComparisonSampler) && !o.has(m.binding))
        throw new u(
          `[gpu-device-api] group ${p} 的 sampler binding ${m.binding}` + (m.name ? `（「${m.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  const l = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Set();
  for (const p of r.values())
    Ne(l, p.group).push(p), p.dynamic && Ne(c, p.group).push(p), d.add(p.group);
  for (const p of n.values())
    Ne(h, p.group).push(p), d.add(p.group);
  for (const p of d)
    Ne(l, p), Ne(c, p), Ne(h, p);
  return {
    uniformBlocks: r,
    textures: n,
    uniformBlocksByGroup: l,
    dynamicBlocksByGroup: c,
    texturesByGroup: h,
    requiredGroups: [...d].sort((p, f) => p - f),
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function Ne(t, e) {
  let r = t.get(e);
  return r || (r = [], t.set(e, r)), r;
}
function bf(t, e) {
  const r = t.name ?? "", n = e.find((i) => i.name === `${r}_sampler`);
  return n || e.find((i) => i.binding === t.binding + 1);
}
class wf {
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
    const i = gf(e, this.limits);
    return this.plans.set(r, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
const ui = "KHR_parallel_shader_compile is not available on this WebGL2 context; gl.linkProgram() cannot be awaited asynchronously because querying LINK_STATUS blocks until linking finishes", yf = "the program was linked synchronously by ProgramCache.acquire() while the pipeline was created; call ProgramCache.compileAsync() (or prewarmWebGL2RenderPipeline) before createRenderPipeline() to move the compile and link cost off the critical path";
function hi(t, e) {
  return `${t}\0${e}`;
}
class Rn {
  gl;
  state;
  programs = /* @__PURE__ */ new Map();
  /** 正在进行中的异步链接，按缓存键去重（同一对源码并发预热只会链接一次）。 */
  pending = /* @__PURE__ */ new Map();
  /** `KHR_parallel_shader_compile` 的探测结果；`undefined` 表示还没查过。 */
  parallelExtension = void 0;
  /** `clear()` 会自增它：异步链接完成时若代数变了就不再往缓存里写（否则会泄漏一个没人释放的 program）。 */
  generation = 0;
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
   * 这是**同步**路径：需要真正异步请用 {@link ProgramCache.compileAsync}。
   *
   * @param vertexSource 已包好 `#version` 与精度声明的顶点着色器源码
   * @param fragmentSource 已包好的片元着色器源码
   */
  acquire(e, r, n) {
    const i = hi(r, n), s = this.programs.get(i);
    if (s) return s;
    const a = this.gl, o = [], l = [], c = this.compileShader(
      C.Vertex,
      a.VERTEX_SHADER,
      r,
      `${e} / vertex`,
      o,
      l
    ), h = this.compileShader(
      C.Fragment,
      a.FRAGMENT_SHADER,
      n,
      `${e} / fragment`,
      o,
      l
    ), d = a.createProgram();
    if (!d)
      throw a.deleteShader(c), a.deleteShader(h), new u("[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。");
    if (a.attachShader(d, c), a.attachShader(d, h), a.linkProgram(d), a.detachShader(d, c), a.detachShader(d, h), a.deleteShader(c), a.deleteShader(h), ot(a.getProgramInfoLog(d), e, null, o, l), !a.getProgramParameter(d, a.LINK_STATUS)) {
      const g = a.getProgramInfoLog(d) ?? "(无日志)";
      throw a.deleteProgram(d), new u(
        `[gpu-device-api] program「${e}」链接失败。vertex 与 fragment 的 varying（in/out）名字、
类型与数量必须完全对应。
GL 日志：${g}`
      );
    }
    const f = Zn(a, d), m = {
      program: d,
      reflection: f,
      blockBindings: /* @__PURE__ */ new Map(),
      samplerLocations: /* @__PURE__ */ new Map(),
      optimizedOutBlocks: [],
      label: e,
      boundPlanKey: null,
      linkMode: "sync",
      linkReason: yf,
      compilationInfo: xe({ label: e, backend: "webgl2", messages: o, rawLogs: l })
    };
    return this.programs.set(i, m), m;
  }
  /**
   * **异步**编译 + 链接（管线预热的入口）。
   *
   * 与 `acquire()` 的语义完全一致（同一份缓存键、同一个 `CompiledProgram`），区别只在于等待方式：
   *
   * - 有 `KHR_parallel_shader_compile` 时用 `COMPLETION_STATUS_KHR` 轮询，**不阻塞**调用方
   *   （每次轮询之间让出一轮事件循环），`mode` 为 `'async'`；
   * - 没有该扩展时退化成同步，`mode` 为 `'sync'` 且 `reason` 说明原因；
   * - 超时（默认 30s）不算抛错：`ok` 为 false、`reason` 说明超时，资源会被清理。
   *
   * 编译/链接失败**不抛错**（预热不该让渲染挂掉）：`ok` 为 false，
   * 诊断（含真实行号）在 `info` 里；调用方想直接抛错可以看 `info.hasErrors` 自己决定。
   *
   * 成功时会写进与 `acquire()` 相同的缓存，所以随后 `device.createRenderPipeline()` 里的
   * `acquire()` 会直接命中 —— 这是「预热有效」的判据（可以数 GL 调用次数来验证）。
   */
  async compileAsync(e, r, n, i = {}) {
    const s = hi(r, n), a = this.programs.get(s);
    if (a)
      return {
        compiled: a,
        ok: !a.compilationInfo.hasErrors,
        mode: a.linkMode,
        reason: a.linkMode === "sync" ? a.linkReason : null,
        durationMs: 0,
        info: a.compilationInfo
      };
    const o = this.pending.get(s);
    if (o) return o;
    const l = this.linkAsync(e, r, n, s, i);
    this.pending.set(s, l);
    try {
      return await l;
    } finally {
      this.pending.delete(s);
    }
  }
  /** 把一次预热结果转成通用的 {@link PrewarmResult}（供 pipeline / device 层转发）。 */
  static toPrewarmResult(e, r) {
    return {
      label: e,
      backend: "webgl2",
      ok: r.ok,
      mode: r.mode,
      reason: r.reason,
      durationMs: r.durationMs,
      info: r.info
    };
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
    this.generation += 1;
    for (const e of this.programs.values())
      this.gl.deleteProgram(e.program);
    this.programs.clear(), this.state.useProgram(null);
  }
  dispose() {
    this.clear();
  }
  /* ------------------------------------------------------------------------------------------------ */
  /** 探测 `KHR_parallel_shader_compile`（按 context 只查一次）。 */
  parallelCompile() {
    if (this.parallelExtension !== void 0) return this.parallelExtension;
    const e = this.gl.getExtension(
      "KHR_parallel_shader_compile"
    );
    return this.parallelExtension = e && typeof e.COMPLETION_STATUS_KHR == "number" ? e : null, this.parallelExtension;
  }
  /** `compileAsync()` 的实际实现：编译 → 等 → 链接 → 等 → 反射。 */
  async linkAsync(e, r, n, i, s) {
    const a = this.gl, o = N(), l = this.generation, c = s.timeoutMs ?? un, h = this.parallelCompile(), d = h ? "async" : "sync", p = [], f = [], m = (y) => ({
      compiled: null,
      ok: !1,
      mode: d,
      reason: y,
      durationMs: N() - o,
      info: xe({ label: e, backend: "webgl2", messages: p, rawLogs: f })
    });
    let g = null, b = null, w = null;
    try {
      if (g = this.createShaderObject(a.VERTEX_SHADER, r, `${e} / vertex`), b = this.createShaderObject(a.FRAGMENT_SHADER, n, `${e} / fragment`), h && !await this.waitFor(
        () => a.getShaderParameter(g, h.COMPLETION_STATUS_KHR) && a.getShaderParameter(b, h.COMPLETION_STATUS_KHR),
        c
      ))
        return m(
          `shader compilation for "${e}" did not finish within ${String(c)}ms (polling COMPLETION_STATUS_KHR)`
        );
      const y = a.getShaderParameter(g, a.COMPILE_STATUS) === !0;
      ot(a.getShaderInfoLog(g), `${e} / vertex`, C.Vertex, p, f);
      const v = a.getShaderParameter(b, a.COMPILE_STATUS) === !0;
      if (ot(a.getShaderInfoLog(b), `${e} / fragment`, C.Fragment, p, f), !y || !v) {
        const L = [y ? null : "vertex", v ? null : "fragment"].filter((B) => B !== null).join(" + ");
        return m(`shader compilation failed for "${e}" (${L} stage); see info.messages`);
      }
      if (w = a.createProgram(), !w)
        return m(`gl.createProgram() returned null while prewarming "${e}"`);
      if (a.attachShader(w, g), a.attachShader(w, b), a.linkProgram(w), a.detachShader(w, g), a.detachShader(w, b), a.deleteShader(g), a.deleteShader(b), g = null, b = null, h && !await this.waitFor(
        () => a.getProgramParameter(w, h.COMPLETION_STATUS_KHR),
        c
      ))
        return m(
          `program linking for "${e}" did not finish within ${String(c)}ms (polling COMPLETION_STATUS_KHR)`
        );
      const T = a.getProgramParameter(w, a.LINK_STATUS) === !0;
      if (ot(a.getProgramInfoLog(w), e, null, p, f), !T)
        return m(`program linking failed for "${e}"; see info.messages`);
      const E = Zn(a, w), P = {
        program: w,
        reflection: E,
        blockBindings: /* @__PURE__ */ new Map(),
        samplerLocations: /* @__PURE__ */ new Map(),
        optimizedOutBlocks: [],
        label: e,
        boundPlanKey: null,
        linkMode: d,
        linkReason: d === "sync" ? ui : null,
        compilationInfo: xe({ label: e, backend: "webgl2", messages: p, rawLogs: f })
      };
      return this.generation !== l ? (a.deleteProgram(w), m(`the program cache was cleared while prewarming "${e}"`)) : (w = null, this.programs.set(i, P), {
        compiled: P,
        ok: !0,
        mode: d,
        reason: d === "sync" ? ui : null,
        durationMs: N() - o,
        info: P.compilationInfo
      });
    } catch (y) {
      return m(y instanceof Error ? y.message : String(y));
    } finally {
      g && a.deleteShader(g), b && a.deleteShader(b), w && a.deleteProgram(w);
    }
  }
  /** 轮询 `check()` 直到返回 true 或超时；每次轮询之间让出一轮事件循环。 */
  async waitFor(e, r) {
    const n = N();
    for (; ; ) {
      if (e()) return !0;
      if (N() - n > r) return !1;
      await sl();
    }
  }
  createShaderObject(e, r, n) {
    const i = this.gl, s = i.createShader(e);
    if (!s)
      throw new u(`[gpu-device-api] gl.createShader() 返回 null（${n}）。`);
    return i.shaderSource(s, r), i.compileShader(s), s;
  }
  compileShader(e, r, n, i, s, a) {
    const o = this.gl, l = this.createShaderObject(r, n, i), c = o.getShaderInfoLog(l) ?? "";
    if (ot(c, i, e, s, a), !o.getShaderParameter(l, o.COMPILE_STATUS))
      throw o.deleteShader(l), new u(
        `[gpu-device-api] 着色器编译失败（${i}）：
${c || "(无日志)"}

----- 源码 -----
${vf(n)}`
      );
    return l;
  }
  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  bindResources(e, r, n, i) {
    const s = this.gl, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), l = [], c = new Set(r.uniformBlocks.map((d) => d.name));
    if (n)
      for (const [d, p] of n.uniformBlocks) {
        if (!c.has(p.name)) {
          l.push(p.name);
          continue;
        }
        const f = s.getUniformBlockIndex(e, p.name);
        if (f === s.INVALID_INDEX) {
          l.push(p.name);
          continue;
        }
        s.uniformBlockBinding(e, f, p.blockBinding), a.set(d, p.blockBinding);
      }
    const h = r.uniforms.filter((d) => Fa(d.glType));
    if (n)
      for (const [, d] of n.textures) {
        const p = h.find((f) => f.name === d.name)?.location ?? s.getUniformLocation(e, d.name);
        p && (s.uniform1i(p, d.unit), o.set(d.name, p));
      }
    if (n) {
      const d = new Set([...n.uniformBlocks.values()].map((g) => g.name)), p = r.uniformBlocks.map((g) => g.name).filter((g) => !d.has(g));
      if (p.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 uniform block：${p.join("、")}。
布局里声明的块名：${[...d].join("、") || "(空)"}。
WebGL2 后端靠 \`BindGroupLayoutEntry.name\` 去定位 GLSL 的 uniform block，请检查两边的名字是否一致（注意 GLSL 里块名与实例名是两回事，这里要的是**块名**）。`
        );
      const f = new Set([...n.textures.values()].map((g) => g.name)), m = h.map((g) => g.name.replace(/\[0\]$/, "")).filter((g) => !f.has(g));
      if (m.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 sampler：${m.join("、")}。
布局里声明的纹理名：${[...f].join("、") || "(空)"}。
请为每个 sampler 增加一个 \`type: 'texture'\` 的布局条目并填上 \`name\`。`
        );
    } else {
      if (r.uniformBlocks.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 uniform block（${r.uniformBlocks.map((d) => d.name).join("、")}），但管线没有声明任何 bind group layout。`
        );
      if (h.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 sampler（${h.map((d) => `${d.name}: ${Lp(d.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: l };
  }
}
function ot(t, e, r, n, i) {
  if (!t) return;
  const s = t.trim();
  s !== "" && (i.push(s), n.push(...il(s, e, "webgl2", r)));
}
function vf(t) {
  const e = t.split(`
`), r = String(e.length).length;
  return e.map((n, i) => `${String(i + 1).padStart(r, " ")} | ${n}`).join(`
`);
}
function xf(t, e) {
  const r = t.depthStencil, n = r !== void 0 && r.format !== null, i = n && e.depth, s = n && e.stencil, a = t.render?.blend, o = t.fragment?.targets, l = Tf(
    t.label ?? "renderPipeline",
    o,
    a,
    t.render?.writeMask
  ), c = l.blend;
  let h = null;
  c && (h = {
    colorSrc: Bt(c.color.srcFactor, "color.srcFactor"),
    colorDst: Bt(c.color.dstFactor, "color.dstFactor"),
    colorOp: c.color.operation ? Rt[c.color.operation] : Rt.add,
    alphaSrc: Bt(c.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: Bt(c.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: c.alpha.operation ? Rt[c.alpha.operation] : Rt.add
  });
  const d = s ? {
    front: Ft(r?.stencilFront, "stencilFront"),
    back: Ft(r?.stencilBack, "stencilBack"),
    readMask: di(r?.stencilReadMask, "stencilReadMask", 4294967295),
    writeMask: di(r?.stencilWriteMask, "stencilWriteMask", 4294967295)
  } : {
    front: Ft(void 0, "stencilFront"),
    back: Ft(void 0, "stencilBack"),
    readMask: 4294967295,
    writeMask: 0
  }, p = l.writeMask, f = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    // 不使用深度时给 `false`，而不是 `depthWriteEnabled ?? true`：GL 在 `DEPTH_TEST` 关闭时本来
    // 就不更新深度缓冲（关着测试写深度是无效操作），但把 `depthWrite` 留在 `true` 会让这份解析
    // 结果读起来像「深度是开着的」，误导后续维护。`depthCompare` 同理会停在默认的 `less`，
    // 它只在 `depthTest` 为 true 时才被 glStateCache 写入。
    depthWrite: n && (r?.depthWriteEnabled ?? !0),
    depthCompare: Mn[r?.depthCompare ?? "less"],
    depthBias: [r?.depthBiasSlopeScale ?? 0, r?.depthBias ?? 0, r?.depthBiasClamp ?? 0],
    stencilEnabled: s,
    stencilFront: d.front,
    stencilBack: d.back,
    stencilReadMask: d.readMask,
    stencilWriteMask: d.writeMask,
    blend: h,
    writeMask: [
      (p & ue.Red) !== 0,
      (p & ue.Green) !== 0,
      (p & ue.Blue) !== 0,
      (p & ue.Alpha) !== 0
    ],
    cullEnabled: f !== "none",
    cullFace: f === "none" ? ri.back : ri[f],
    frontFace: jd[t.primitive?.frontFace ?? "ccw"]
  };
}
function Sf(t, e, r = 0) {
  e.blend ? t.setBlend(
    !0,
    e.blend.colorSrc,
    e.blend.colorDst,
    e.blend.colorOp,
    e.blend.alphaSrc,
    e.blend.alphaDst,
    e.blend.alphaOp
  ) : t.setBlend(!1, 0, 0, 0, 0, 0, 0), t.setColorMask(e.writeMask), t.setDepthTest(e.depthTest, e.depthWrite, e.depthCompare, e.depthBias), t.setStencilTest({
    enabled: e.stencilEnabled,
    reference: r,
    front: e.stencilFront,
    back: e.stencilBack,
    readMask: e.stencilReadMask,
    writeMask: e.stencilWriteMask
  }), t.setCull(e.cullEnabled, e.cullFace, e.frontFace);
}
function Tf(t, e, r, n) {
  const i = n ?? ue.All;
  if (!e) return { blend: r, writeMask: i };
  let s = r, a = i, o = -1;
  for (let l = 0; l < e.length; l += 1) {
    const c = e[l];
    if (!c) continue;
    const h = c.blend ?? r, d = c.writeMask ?? i;
    if (o < 0) {
      o = l, s = h, a = d;
      continue;
    }
    if (d !== a)
      throw new u(
        pi(
          t,
          `writeMask differs between fragment.targets[${o}] and fragment.targets[${l}] (0x${a.toString(16)} vs 0x${d.toString(16)})`
        )
      );
    if (!$f(s, h))
      throw new u(
        pi(
          t,
          `blend differs between fragment.targets[${o}] and fragment.targets[${l}]`
        )
      );
  }
  return { blend: s, writeMask: a };
}
function pi(t, e) {
  return `[gpu-device-api] RenderPipeline "${t}": ${e}. WebGL2 has only one global blend state and one global color write mask: GLES 3.0 has no blendFunci() / blendEquationSeparatei() / colorMaski(), so per-attachment blending and per-attachment write masks cannot be expressed at all. This library will not silently apply one target's state to every attachment. Give every non-null fragment target the same blend and writeMask, or move the differing attachment into a second render pass on the WebGL2 backend.`;
}
function $f(t, e) {
  return t === e ? !0 : !t || !e ? !1 : t.color.srcFactor === e.color.srcFactor && t.color.dstFactor === e.color.dstFactor && (t.color.operation ?? "add") === (e.color.operation ?? "add") && t.alpha.srcFactor === e.alpha.srcFactor && t.alpha.dstFactor === e.alpha.dstFactor && (t.alpha.operation ?? "add") === (e.alpha.operation ?? "add");
}
function Ft(t, e) {
  return {
    compare: Ef(t?.compare ?? ve.compare, `${e}.compare`),
    failOp: Cr(t?.failOp ?? ve.failOp, `${e}.failOp`),
    depthFailOp: Cr(t?.depthFailOp ?? ve.depthFailOp, `${e}.depthFailOp`),
    passOp: Cr(t?.passOp ?? ve.passOp, `${e}.passOp`)
  };
}
function Ef(t, e) {
  const r = Mn[t];
  if (r === void 0)
    throw new u(`[gpu-device-api] 未知的模板比较函数「${t}」（${e}）。`);
  return r;
}
function Cr(t, e) {
  const r = qd[t];
  if (r === void 0)
    throw new u(`[gpu-device-api] 未知的模板操作「${t}」（${e}）。`);
  return r;
}
function di(t, e, r) {
  if (t === void 0) return r;
  if (!Number.isInteger(t) || t < 0 || t > 4294967295)
    throw new u(
      `[gpu-device-api] 模板掩码 ${e} 必须是 0..0xffffffff 之间的整数，实际是 ${String(t)}。`
    );
  return t;
}
function Bt(t, e) {
  const r = zd[t];
  if (r === void 0)
    throw new u(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return r;
}
const Af = 64;
class Pf {
  label;
  descriptor;
  layout;
  vertexLayouts;
  gl;
  state;
  limits;
  /** 每个变体的 VAO 缓存上限（构造时校验过，一定 `>= 1`）。 */
  vertexArrayCacheLimit;
  onDispose;
  program;
  plan;
  topologyMode;
  /**
   * `MultisampleState.alphaToCoverageEnabled`（`#13`）。
   *
   * WebGPU 侧会把它翻成 `GPUMultisampleState.alphaToCoverageEnabled`，而 WebGL2 后端以前
   * **完全不读**这个字段 —— 于是「用 alpha 做覆盖率抗锯齿」的管线在 WebGL2 上静默地不生效
   * （画面上表现为边缘没有柔化，只有 MSAA 的普通效果）。GL 有 `SAMPLE_ALPHA_TO_COVERAGE`，
   * 能表达，所以这里**实现**它。
   */
  alphaToCoverage;
  /** 描述里声明的采样数（WebGPU 的默认值是 1）；`alphaToCoverage` 只能配 `> 1`。 */
  declaredSampleCount;
  variantCache = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, r, n, i) {
    if (!e.fragment)
      throw new u(
        "[gpu-device-api] WebGL2 后端不支持只有深度、没有片元着色器的管线（GL 的 program 必须同时链接两个阶段）。\n请提供一个写深度或写颜色的片元着色器；若只想写深度，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    this.label = e.label ?? U("renderPipeline");
    const s = i.vertexArrayCacheLimit ?? Af;
    if (!Number.isInteger(s) || s < 1)
      throw new u(
        `[gpu-device-api] vertexArrayCacheLimit 必须是 >= 1 的整数，实际是 ${String(s)}。`
      );
    this.vertexArrayCacheLimit = s, this.descriptor = e, this.layout = n, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.onDispose = i.onDispose ?? null, this.program = r, this.plan = n === "auto" ? null : n.bindingPlan ?? null, this.topologyMode = Wd[e.primitive?.topology ?? "triangle-list"], this.alphaToCoverage = e.multisample?.alphaToCoverageEnabled ?? !1, this.declaredSampleCount = e.multisample?.count ?? 1;
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
    const r = e.depthFormat ?? null, n = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${r ?? "none"}|${n}|${As(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const h of i) Es(h, this.limits);
    const o = new Set(i.flatMap((h) => h.attributes.map((d) => d.shaderLocation))), l = new Set(
      this.program.reflection.attributes.map((h) => h.location).filter((h) => h >= 0)
    );
    for (const h of l)
      if (!o.has(h))
        throw new u(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${h}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const c = {
      key: s,
      renderState: xf(this.descriptor, {
        depth: r !== null,
        stencil: r === "depth24plus-stencil8"
      }),
      depthFormat: r,
      sampleCount: n,
      vertexLayouts: i,
      /*
       * 带上限的 LRU（#33）：改前这里是裸 `Map`，只 `set` 从不淘汰。
       *
       * 回调里引用的 `resolved` 在对象字面量求值时还没绑定，但这个回调只可能在
       * `acquireVertexArray()` 之后触发（那时 `resolved` 早已初始化），所以是安全的。
       */
      vertexArrays: ln(this.vertexArrayCacheLimit, (h) => {
        this.evictVertexArray(c, h);
      }),
      vertexArrayLookup: null
    };
    return this.variantCache.set(s, c), c;
  }
  /**
   * LRU 淘汰一个 VAO 时的收尾（#33）。
   *
   * ## 为什么「淘汰一个正在使用的 VAO」不会让后续 draw 用错绑定点（安全性论证）
   *
   * 1. GLES 3.0 里 `deleteVertexArray` 删除**当前绑定**的 VAO 会把该绑定点复位
   *    （绑定变成「没有 VAO」，默认 VAO 生效）。所以真正的危险不是删除本身，
   *    而是「删除之后还有谁以为它还绑着」—— 那会让后续 draw 跳过重新绑定。
   * 2. 淘汰只发生在 `PipelineCache.set()` 里，而 `acquireVertexArray()` 的顺序一定是
   *    **先** `state.bindVertexArray(新建的 VAO)`（`gl.createVertexArray()` 之后立刻绑、
   *    再录属性和索引缓冲）、**后** `variant.vertexArrays.set(...)`。LRU 淘汰的是 `Map` 里
   *    最旧的那个，刚插入的排在队尾；在构造时已强制 `limit >= 1` 的前提下，
   *    被淘汰的**永远不是**当前绑定的那个。最坏情况只是「多建一个 VAO」。
   * 3. 会残留「以为还绑着」的地方只有两处，都在下面处理掉了：
   *    - {@link ResolvedVariant.vertexArrayLookup}：这条快速路径**绕过**缓存表直接返回上次的 VAO，
   *      被淘汰后它可能仍指着已删除的对象 —— 必须清掉，否则下一次同版本的 draw 会拿它去绑定。
   *    - `GlStateCache.vertexArray`：状态缓存里的「当前绑定」记录。GL 的删除已经解绑，
   *      缓存若不同步就会谎称「还绑着」，后续 draw 会跳过 `bindVertexArray`（不会报错，只是画错）。
   * 4. 被淘汰的键下次 `acquireVertexArray()` 会未命中并重建一个新对象，而 `bindVertexArray()`
   *    是按对象身份比较的，新旧不同 → 一定重新下发。所以「淘汰正在使用的 VAO」是安全的。
   */
  evictVertexArray(e, r) {
    const n = e.vertexArrayLookup;
    n !== null && n.vertexArray === r && (e.vertexArrayLookup = null), this.state.currentVertexArray === r && this.state.bindVertexArray(null), this.gl.deleteVertexArray(r);
  }
  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(e = {}) {
    return this.resolveVariant(e).renderState;
  }
  /**
   * 预热报告。
   *
   * WebGL2 的编译 + 链接发生在 `createRenderPipeline()` 里（`ProgramCache.acquire()`），
   * 所以**管线对象存在时 program 一定已经链接完了**，这里没有东西可以再等 —— 能做的是
   * 如实汇报它是怎么等出来的，以及带上诊断（真实行号）。
   *
   * | 情况 | `mode` | 说明 |
   * | --- | --- | --- |
   * | 事先调用过 `ProgramCache.compileAsync()`（`KHR_parallel_shader_compile` 可用） | `'async'` | 链接真异步完成，管线创建时零 GL 调用 |
   * | 扩展缺失，`compileAsync()` 退化成同步 | `'sync'` | `reason` 说明缺扩展 |
   * | 直接 `device.createRenderPipeline()`（没预热过） | `'sync'` | `reason` 提示先在创建管线前调 `compileAsync()` |
   *
   * **真想异步就调 `prewarmWebGL2RenderPipeline(device, descriptor)`**（`src/webgl2/pipeline/Prewarm.ts`）：
   * 它在创建管线**之前**先把 program 链接好，之后 `createRenderPipeline()` 的 `acquire()` 直接命中缓存。
   */
  async prewarm(e = {}, r = {}) {
    const n = N();
    if (this._disposed)
      throw new u(`[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`);
    const i = this.program.compilationInfo, s = this.program.linkMode;
    return {
      label: this.label,
      backend: "webgl2",
      ok: !i.hasErrors,
      mode: s,
      reason: s === "async" ? null : this.program.linkReason,
      durationMs: N() - n,
      info: i
    };
  }
  /**
   * 编译诊断：WebGL2 走的是 `getShaderInfoLog()` / `getProgramInfoLog()` 的原文，
   * 在 program 编译/链接的那一刻就解析好并挂在 `CompiledProgram.compilationInfo` 上。
   * `lineNum` 是真实的（从 GL 日志里解析出来的行号，指向**包好前言之后的最终源码**），
   * `linePos` 恒为 `null`（GL 的日志只有行号，没有列号）。
   */
  async getCompilationInfo() {
    return this.program.compilationInfo;
  }
  /**
   * 把该管线的固定功能状态写入 GL 状态缓存。
   *
   * `SAMPLE_ALPHA_TO_COVERAGE`（`#13`）是个**上下文级**开关（不是逐 draw 状态的一部分），
   * 所以直接在这里下发：每次 draw 多一次廉价的 `enable/disable` 是刻意选的 ——
   * 走 `GlStateCache` 需要一个新字段，而这条路径的调用者（渲染通道）已经知道本帧的采样数，
   * 在这里判断不会有歧义。采样数不合法时明确报错（与 WebGPU 的
   * `toGPUMultisampleState` 同形：`alphaToCoverageEnabled` 要求 `sampleCount > 1`）。
   */
  applyState(e, r = 0) {
    if (this.state.useProgram(this.program.program), Sf(this.state, e.renderState, r), this.alphaToCoverage) {
      if (this.declaredSampleCount <= 1 && e.sampleCount <= 1)
        throw new u(
          `[gpu-device-api] RenderPipeline "${this.label}": MultisampleState.alphaToCoverageEnabled requires sampleCount > 1, but both the pipeline descriptor and the current render target use sampleCount 1. WebGPU rejects this combination too. Create the render target with sampleCount 2 or 4 (WebGL2 cannot multisample a texture attachment, so use an offscreen RenderTarget).`
        );
      mi(this.gl, !0);
    } else
      mi(this.gl, !1);
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
  acquireVertexArray(e, r, n, i = 0) {
    const s = e.vertexLayouts;
    if (s.length === 0) return null;
    const a = e.vertexArrayLookup;
    if (i > 0 && a !== null && a.revision === i)
      return a.vertexArray;
    const o = Lf(s, r, n), l = e.vertexArrays.get(o);
    if (l)
      return i > 0 && (e.vertexArrayLookup = { revision: i, vertexArray: l }), l;
    const c = this.gl, h = c.createVertexArray();
    if (!h)
      throw new u("[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。");
    this.state.bindVertexArray(h);
    for (let d = 0; d < s.length; d++) {
      const p = s[d], f = r[d];
      if (!p || !f) continue;
      c.bindBuffer(c.ARRAY_BUFFER, f.buffer.native);
      const m = p.stepMode === "instance" ? 1 : 0;
      for (const g of p.attributes) {
        const b = tf(g.format), w = f.offset + g.offset;
        c.enableVertexAttribArray(g.shaderLocation), b.integer ? c.vertexAttribIPointer(g.shaderLocation, b.size, b.type, p.arrayStride, w) : c.vertexAttribPointer(
          g.shaderLocation,
          b.size,
          b.type,
          b.normalized,
          p.arrayStride,
          w
        ), c.vertexAttribDivisor(g.shaderLocation, m);
      }
    }
    return n && c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, n), this.state.invalidateBufferBindings(), e.vertexArrays.set(o, h), i > 0 && (e.vertexArrayLookup = { revision: i, vertexArray: h }), h;
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
          this.evictVertexArray(e, r);
        e.vertexArrays.clear(), e.vertexArrayLookup = null;
      }
      this.variantCache.clear(), this.onDispose?.(this);
    }
  }
}
const fi = 32926;
function mi(t, e) {
  e ? t.enable(fi) : typeof t.disable == "function" && t.disable(fi);
}
function Lf(t, e, r) {
  const n = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      n.push(`${i}:-`);
      continue;
    }
    Te(s.offset, "setVertexBuffer 的 offset"), n.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return n.push(`idx:${r ? Cf(r) : "-"}`), n.join("|");
}
const gi = /* @__PURE__ */ new WeakMap();
let _f = 1;
function Cf(t) {
  let e = gi.get(t);
  return e === void 0 && (e = _f++, gi.set(t, e)), e;
}
class Mf {
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
function Rf(t, e, r) {
  throw new u(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${r}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function bi(t) {
  return t instanceof Ba ? t : Rf("texture view", t, "WebGL2TextureView");
}
const lt = new Float32Array(4), rr = new Float32Array(1);
function Oa(t, e, r, n) {
  return lt[0] = t, lt[1] = e, lt[2] = r, lt[3] = n, lt;
}
const en = /* @__PURE__ */ new WeakMap();
function wi(t) {
  if (!t || typeof t != "object") return null;
  const e = en.get(t);
  return e && !e.disposed ? e : null;
}
class Ff {
  label;
  colorFormats;
  depthFormat;
  sampleCount;
  mipLevelCount;
  /**
   * GL 的原生行序：FBO 附着点的原点在左下，纹理自下而上存储，纹素第 0 行是画面底端。
   *
   * 本层如实上报，**不做翻转**（要统一请看 `RenderTarget.RowOrder` 的说明）。
   */
  rowOrder = Cs.BottomUp;
  gl;
  state;
  options;
  /** resolve 用的 framebuffer：附件是单采样纹理，`colors` / `depth` 就是它的附件。 */
  framebuffer;
  /**
   * 绘制用的 framebuffer。
   *
   * `sampleCount === 1` 时**就是** `framebuffer`（与从前完全一致）；
   * 多重采样时是另一个挂着 renderbuffer 的 FBO。
   */
  drawFramebuffer;
  colorTextures;
  depthTexture;
  colorViews = [];
  depthView = null;
  /** 多重采样的颜色附件；单采样时为空数组。 */
  colorRenderbuffers = [];
  /** 多重采样的深度附件；没有深度附件或单采样时为 null。 */
  depthRenderbuffer = null;
  /** 本帧的绘制内容还没解析到 resolve 附件里。 */
  needsResolve = !1;
  _width;
  _height;
  _disposed = !1;
  constructor(e, r) {
    const n = r.gl, i = e.width ?? n.drawingBufferWidth, s = e.height ?? n.drawingBufferHeight;
    if (i <= 0 || s <= 0)
      throw new u(
        `[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${i}x${s}。未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。`
      );
    const a = Bf(e.color);
    if (a.length > 4)
      throw new u(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${a.length} 个。`
      );
    for (const c of a)
      if (!F(c).attachment)
        throw new u(
          `[gpu-device-api] 纹理格式「${c}」在 WebGL2 下不能作为颜色附件。`
        );
    const o = Gf(e.depth);
    if (o !== null && !F(o).depth)
      throw new u(`[gpu-device-api] 深度附件格式「${o}」不是深度格式。`);
    if (this.gl = n, this.state = r.state, this.options = r, this.label = e.label ?? U("renderTarget"), this._width = i, this._height = s, e.mipLevelCount !== void 0 && e.mipLevelCount !== 1)
      throw new u(
        `[gpu-device-api] createRenderTarget: mipLevelCount ${String(e.mipLevelCount)} is not supported by the WebGL2 backend for render targets. A GL framebuffer attachment always addresses mip level 0, so a render target can never write into a higher mip level — the field would be silently ignored (and the attachments would still only have one level). Create a texture with an explicit mipLevelCount and call generateMipmaps() after rendering into level 0, or render into a single-level target and copy the result.`
      );
    if (e.sampled === !1)
      throw new u(
        '[gpu-device-api] createRenderTarget: sampled: false cannot be honoured on WebGL2. In GL, any texture can be bound to a texture unit and sampled — there is no per-texture "not sampleable" state, and this backend never validates TextureUsage. Leave the field out (sampled: true is already what WebGL2 does), or keep the render output in a texture you never bind.'
      );
    this.mipLevelCount = e.mipLevelCount ?? 1, this.colorFormats = a, this.depthFormat = o, this.sampleCount = Of(
      n,
      e.sampleCount ?? 1,
      this.label,
      a,
      o
    );
    const l = n.createFramebuffer();
    if (!l)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。");
    if (this.framebuffer = l, this.sampleCount > 1) {
      const c = n.createFramebuffer();
      if (!c)
        throw n.deleteFramebuffer(this.framebuffer), new u(
          "[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建多重采样的绘制 framebuffer。"
        );
      this.drawFramebuffer = c;
    } else
      this.drawFramebuffer = this.framebuffer;
    this.colorTextures = [], this.depthTexture = null, this.createAttachments(e.usage ?? 0), this.sampleCount > 1 && this.createMultisampleAttachments();
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
  /** resolve 用的 framebuffer（`colors` / `depth` 是它的附件）。 */
  get native() {
    return this.framebuffer;
  }
  /** 绘制用的 framebuffer：多重采样时挂着 renderbuffer，单采样时与 `native` 相同。 */
  get drawTarget() {
    return this.drawFramebuffer;
  }
  /** 是否真的做了多重采样（`sampleCount > 1`）。 */
  get multisampled() {
    return this.sampleCount > 1;
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
   * 多重采样时绑定的是 draw FBO（renderbuffer 附件），内容要等到 {@link resolve} 才进纹理。
   *
   * ## `#14`：每个 pass 开始时 scissor 都必须是「整个附件、关闭」的已知状态
   *
   * 改前这一句 `setScissor(false, ...)` 只在 `needsClear` 分支里下发。于是「上一个 pass 设过
   * `setScissorRect` → 本 pass 的颜色与深度**都是** `load`」这条缝里，`SCISSOR_TEST` 会保持
   * 上一个 pass 留下的「开着 + 旧矩形」状态：
   *
   * - `WebGL2RenderPassEncoder.end()` 会 `state.invalidate()`，缓存因此**声称** scissor 是关的，
   *   而 GL 里其实是开的 —— 缓存与驱动不一致；
   * - 后果是后续所有绘制被静默裁进上一个 pass 的矩形里（WebGPU 的行为是每个 pass 重置成整个附件）。
   *
   * 所以现在**无条件**下发（清屏与不清屏两条路都走），不再依赖别的分支的副作用。
   * 关闭 `SCISSOR_TEST` 之后再把它设成整个附件：`GlStateCache` 的去重键只记「关」这一位，
   * 不重设矩形的话，某个 pass 里第一次 `setScissorRect` 可能因为「缓存说矩形没变」而漏掉
   * `gl.scissor()`，于是拿着更早那个 pass 的矩形去裁剪。
   *
   * 完整性（`checkFramebufferStatus`）不在这里查：附件只在构造与 resize() 时变，
   * 所以 attach 阶段已经查过了。原来每个渲染通道都做一次同步查询是白付的。
   */
  bind(e = {}) {
    const r = this.gl;
    if (r.bindFramebuffer(r.FRAMEBUFFER, this.drawFramebuffer), this.needsResolve = this.sampleCount > 1, this.resetScissor(), e.loadOp !== "load" || this.depthTexture !== null && e.depthLoadOp !== "load") {
      if (e.loadOp !== "load") {
        const [i, s, a, o] = je(e.clearColor), l = Oa(i, s, a, o);
        for (let c = 0; c < this.colorTextures.length; c++)
          r.clearBufferfv(r.COLOR, c, l);
      }
      if (this.depthTexture && e.depthLoadOp !== "load") {
        const i = F(this.depthFormat);
        this.state.prepareClear(i.stencil), i.stencil ? r.clearBufferfi(r.DEPTH_STENCIL, 0, e.clearDepth ?? 1, e.clearStencil ?? 0) : (rr[0] = e.clearDepth ?? 1, r.clearBufferfv(r.DEPTH, 0, rr)), this.state.invalidate();
      }
    }
    r.viewport(0, 0, this._width, this._height), this.state.setViewport(0, 0, this._width, this._height);
  }
  /**
   * 把 scissor 状态复位成「关掉 + 整个附件」（`#14`）。
   *
   * 实现在 `GlStateCache.resetScissor()` 里（那里还能把「已经复位」的情况免掉 GL 调用），
   * 这里只是把本目标的尺寸传过去。
   */
  resetScissor() {
    this.state.resetScissor(this._width, this._height);
  }
  /**
   * 把多重采样的绘制结果解析（resolve）到 resolve 附件的纹理里。
   *
   * 渲染通道 `end()` 会调用它；单采样目标是空操作（`needsResolve` 恒为 false），
   * 所以不会给单采样路径加任何 GL 调用。
   *
   * `blitFramebuffer` 是 WebGL2 里唯一能把多重采样 renderbuffer 解析成单采样纹理的接口，
   * 且规范要求这种「多重采样 → 单采样」的 blit 必须用 `NEAREST`。
   */
  resolve() {
    if (!this.needsResolve || this._disposed) return;
    this.needsResolve = !1;
    const e = this.gl, r = e.getParameter(e.FRAMEBUFFER_BINDING);
    e.bindFramebuffer(e.READ_FRAMEBUFFER, this.drawFramebuffer), e.bindFramebuffer(e.DRAW_FRAMEBUFFER, this.framebuffer);
    const n = this.depthRenderbuffer === null ? e.COLOR_BUFFER_BIT : e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT;
    e.blitFramebuffer(
      0,
      0,
      this._width,
      this._height,
      0,
      0,
      this._width,
      this._height,
      n,
      e.NEAREST
    ), e.bindFramebuffer(e.FRAMEBUFFER, r), this.state.invalidate();
  }
  resize(e, r) {
    if (e === this._width && r === this._height) return !1;
    if (e <= 0 || r <= 0)
      throw new u(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${e}x${r}。`);
    this._width = e, this._height = r;
    for (const n of this.colorTextures) n.destroy();
    return this.depthTexture?.destroy(), this.colorTextures = [], this.depthTexture = null, this.colorViews = [], this.depthView = null, this.createAttachments(0), this.sampleCount > 1 && (this.destroyRenderbuffers(), this.createMultisampleAttachments()), !0;
  }
  /** 幂等：重复调用不会重复通知设备。 */
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.colorTextures) e.destroy();
      this.depthTexture?.destroy(), this.colorTextures = [], this.depthTexture = null, this.colorViews = [], this.depthView = null, this.destroyRenderbuffers(), this.gl.deleteFramebuffer(this.framebuffer), this.drawFramebuffer !== this.framebuffer && this.gl.deleteFramebuffer(this.drawFramebuffer), this.options.onDispose?.(this);
    }
  }
  /** `Disposable` 的别名；与 `destroy()` 等价。 */
  dispose() {
    this.destroy();
  }
  /** 取某个颜色附件的 view（后处理、调试读回时用）。 */
  colorView(e = 0) {
    const r = this.colorViews[e];
    if (!r)
      throw new u(
        `[gpu-device-api] 渲染目标「${this.label}」没有第 ${e} 个颜色附件（共 ${this.colorViews.length} 个）。`
      );
    return r;
  }
  /** 深度附件的 view；没有深度附件时抛错。 */
  depthStencilView() {
    if (!this.depthView)
      throw new u(`[gpu-device-api] 渲染目标「${this.label}」没有深度附件。`);
    return this.depthView;
  }
  /**
   * 创建单采样附件纹理并挂到 resolve framebuffer 上。
   *
   * 多重采样时这一步仍然要做：绘制发生在 draw FBO 的 renderbuffer 上，但结果必须有
   * 一张**纹理**来接（可采样、可读回），`blitFramebuffer` 的目标就是它。
   */
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
    ), this.colorViews = this.colorTextures.map((n) => bi(n.createView())), this.depthView = this.depthTexture ? bi(this.depthTexture.createView()) : null;
    for (const n of this.colorViews) en.set(n, this);
    this.depthView && en.set(this.depthView, this), this.attachTextures();
  }
  /** 把纹理附件挂到 resolve framebuffer 上并校验完整性。 */
  attachTextures() {
    const e = this.gl, r = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.framebuffer), this.colorTextures.forEach((n, i) => {
      const s = e.COLOR_ATTACHMENT0 + i;
      n.dimension === "3d" || n.depthOrArrayLayers > 1 ? e.framebufferTextureLayer(e.FRAMEBUFFER, s, n.native, 0, 0) : e.framebufferTexture2D(e.FRAMEBUFFER, s, e.TEXTURE_2D, n.native, 0);
    }), e.drawBuffers(this.colorTextures.map((n, i) => e.COLOR_ATTACHMENT0 + i)), this.depthTexture) {
      const i = F(this.depthFormat).stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
      e.framebufferTexture2D(e.FRAMEBUFFER, i, e.TEXTURE_2D, this.depthTexture.native, 0);
    } else
      e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, null, 0), e.framebufferTexture2D(e.FRAMEBUFFER, e.STENCIL_ATTACHMENT, e.TEXTURE_2D, null, 0);
    this.checkComplete("framebuffer 不完整", r);
  }
  /**
   * 分配多重采样的 renderbuffer 并挂到 draw framebuffer 上。
   *
   * GL 的多重采样 renderbuffer 只能是 `renderbufferStorageMultisample` 创建的，之后再
   * `resolve()` 到纹理 —— 这就是 `sampleCount > 1` 的全部机制。
   */
  createMultisampleAttachments() {
    const e = this.gl, r = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.drawFramebuffer), this.colorRenderbuffers = this.colorFormats.map((n) => {
      const i = e.createRenderbuffer();
      if (!i)
        throw new u(
          `[gpu-device-api] RenderTarget "${this.label}": gl.createRenderbuffer() returned null while allocating the multisampled colour attachment.`
        );
      return e.bindRenderbuffer(e.RENDERBUFFER, i), e.renderbufferStorageMultisample(
        e.RENDERBUFFER,
        this.sampleCount,
        F(n).internalFormat,
        this._width,
        this._height
      ), i;
    }), this.colorRenderbuffers.forEach((n, i) => {
      e.framebufferRenderbuffer(
        e.FRAMEBUFFER,
        e.COLOR_ATTACHMENT0 + i,
        e.RENDERBUFFER,
        n
      );
    }), e.drawBuffers(this.colorRenderbuffers.map((n, i) => e.COLOR_ATTACHMENT0 + i)), this.depthFormat !== null) {
      const n = F(this.depthFormat), i = e.createRenderbuffer();
      if (!i)
        throw new u(
          `[gpu-device-api] RenderTarget "${this.label}": gl.createRenderbuffer() returned null while allocating the multisampled depth attachment.`
        );
      e.bindRenderbuffer(e.RENDERBUFFER, i), e.renderbufferStorageMultisample(
        e.RENDERBUFFER,
        this.sampleCount,
        n.internalFormat,
        this._width,
        this._height
      ), e.framebufferRenderbuffer(
        e.FRAMEBUFFER,
        n.stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT,
        e.RENDERBUFFER,
        i
      ), this.depthRenderbuffer = i;
    }
    this.checkComplete("多重采样的 framebuffer 不完整", r);
  }
  /** 校验当前绑定的 framebuffer，并把绑定恢复成 `previous`。 */
  checkComplete(e, r) {
    const n = this.gl, i = n.checkFramebufferStatus(n.FRAMEBUFFER);
    if (n.bindFramebuffer(n.FRAMEBUFFER, r), this.state.invalidate(), i !== n.FRAMEBUFFER_COMPLETE) {
      const s = this.sampleCount > 1 ? `
多重采样目标（sampleCount=${this.sampleCount}）最常见的原因是：这个采样数不被该格式组合支持，或者颜色/深度附件的采样数、尺寸不一致。请换一个采样数（常见可用值：2、4），或降到 1。` : "";
      throw new u(
        `[gpu-device-api] 渲染目标「${this.label}」的 ${e}（格式组合在 WebGL2 下不受支持）。颜色附件：${this.colorFormats.join("、")}；深度附件：${this.depthFormat ?? "无"}。GL 状态码：0x${i.toString(16)}。` + (i === n.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE ? s : "")
      );
    }
  }
  destroyRenderbuffers() {
    for (const e of this.colorRenderbuffers) this.gl.deleteRenderbuffer(e);
    this.colorRenderbuffers = [], this.depthRenderbuffer && (this.gl.deleteRenderbuffer(this.depthRenderbuffer), this.depthRenderbuffer = null);
  }
}
function Bf(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new u("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function Gf(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
function Of(t, e, r, n, i) {
  if (!Number.isInteger(e) || e < 1)
    throw new u(
      `[gpu-device-api] RenderTarget "${r}": sampleCount must be a positive integer, got ${String(e)}.`
    );
  if (e === 1) return 1;
  const s = Number(t.getParameter(t.MAX_SAMPLES) ?? 0);
  if (!Number.isFinite(s) || s < e)
    throw new u(
      `[gpu-device-api] RenderTarget "${r}": sampleCount ${e} is not supported by this device (MAX_SAMPLES = ${String(s) || "unknown"}). WebGL2 has no fallback: the sample count of a render target is fixed at creation, so this library will not silently use 1. Use sampleCount 1, or a smaller supported sample count.`
    );
  const a = [
    ...n.map((o) => ({ kind: "colour", format: o })),
    ...i === null ? [] : [{ kind: "depth", format: i }]
  ];
  for (const { kind: o, format: l } of a) {
    const c = t.getInternalformatParameter(
      t.RENDERBUFFER,
      F(l).internalFormat,
      t.SAMPLES
    );
    if (!(!c || c.length === 0) && !Array.from(c).includes(e))
      throw new u(
        `[gpu-device-api] RenderTarget "${r}": the ${o} format "${l}" does not support sampleCount ${e} on this device (supported: ${Array.from(c).join(", ")}). WebGL2 cannot resolve an unsupported multisample format, and this library will not silently fall back to 1. Pick one of the supported sample counts, or use sampleCount 1.`
      );
  }
  return e;
}
const Uf = /* @__PURE__ */ new Map([
  [5121, 1],
  // UNSIGNED_BYTE
  [5120, 1],
  // BYTE
  [5123, 2],
  // UNSIGNED_SHORT
  [5122, 2],
  // SHORT
  [5125, 4],
  // UNSIGNED_INT
  [5124, 4],
  // INT
  [5126, 4],
  // FLOAT
  [5131, 2],
  // HALF_FLOAT
  [33640, 4],
  // UNSIGNED_INT_2_10_10_10_REV
  [34042, 4]
  // UNSIGNED_INT_24_8
]), If = /* @__PURE__ */ new Map([
  [5121, "Uint8Array"],
  [5120, "Int8Array"],
  [5123, "Uint16Array"],
  [5122, "Int16Array"],
  [5125, "Uint32Array"],
  [5124, "Int32Array"],
  [5126, "Float32Array"],
  [5131, "Uint16Array"],
  [33640, "Uint32Array"],
  [34042, "Uint32Array"]
]);
function Df(t) {
  const e = Uf.get(t);
  if (e === void 0)
    throw new u(
      `[gpu-device-api] 未知的 GL 像素类型 0x${t.toString(16)}，无法计算上传布局。`
    );
  return e;
}
function kf(t) {
  return If.get(t) ?? "TypedArray";
}
function Ua(t, e, r, n, i, s) {
  const a = r.bytesPerPixel, o = e.width * a, l = t?.bytesPerRow ?? o, c = s ? ` (texture "${s}")` : "";
  if (!Number.isInteger(l) || l < o)
    throw new u(
      `[gpu-device-api] ${n}: bytesPerRow must be an integer >= ${o} (one row of ${e.width} "${i}" pixels at ${a} bytes/pixel), got ${String(l)}.${c}`
    );
  const h = t?.rowsPerImage ?? e.height;
  if (!Number.isInteger(h) || h < e.height)
    throw new u(
      `[gpu-device-api] ${n}: rowsPerImage (${String(h)}) must be >= the copy height (${e.height}).${c}`
    );
  if (!Number.isInteger(e.depthOrArrayLayers) || e.depthOrArrayLayers < 1)
    throw new u(
      `[gpu-device-api] ${n}: depthOrArrayLayers must be a positive integer, got ${String(e.depthOrArrayLayers)}.`
    );
  return { bytesPerRow: l, rowsPerImage: h, bytesPerPixel: a, tightRowBytes: o, where: c };
}
function tn(t, e, r, n, i, s, a) {
  const { bytesPerRow: o, rowsPerImage: l, bytesPerPixel: c, tightRowBytes: h, where: d } = Ua(
    t,
    e,
    r,
    n,
    i,
    s
  ), p = o % c !== 0, f = p ? (
    // 逐行上传时只有「真的被上传的那些行」需要存在（行间填充不需要）。
    (l * (e.depthOrArrayLayers - 1) + e.height - 1) * o + h
  ) : o * l * e.depthOrArrayLayers;
  if (a !== void 0 && a < f)
    throw new u(
      `[gpu-device-api] ${n}: the source data is too small for ${e.width}x${e.height}x${e.depthOrArrayLayers} pixels with bytesPerRow=${o} and rowsPerImage=${l}: the last pixel ends at byte ${f}, but only ${a} bytes are available.${d}` + (p ? "" : " Note that WebGL2 uploads the whole image stack in one call, so the buffer must also cover the gaps between images (see TexelCopyBufferLayout.rowsPerImage).")
    );
  return {
    bytesPerRow: o,
    rowsPerImage: l,
    bytesPerPixel: c,
    requiredBytes: f,
    // 紧密布局时保持 GL 的默认值 0：这条路径不下发任何 pixelStorei。
    unpackRowLength: o === h || p ? 0 : o / c,
    unpackImageHeight: l === e.height ? 0 : l,
    perRowUpload: p
  };
}
function Vf(t, e, r, n, i, s) {
  const { bytesPerRow: a, rowsPerImage: o, bytesPerPixel: l } = Ua(
    t,
    e,
    r,
    n,
    i,
    s
  ), c = a * (o * (e.depthOrArrayLayers - 1) + e.height);
  return {
    bytesPerRow: a,
    rowsPerImage: o,
    bytesPerPixel: l,
    requiredBytes: c,
    unpackRowLength: 0,
    unpackImageHeight: o === e.height ? 0 : o,
    perRowUpload: !1
  };
}
function Nf(t, e, r, n, i) {
  const s = Df(e.type), a = kf(e.type), o = r;
  if (o.byteOffset % s === 0) {
    const h = o.byteLength - o.byteLength % s;
    return yi(e.type, o.buffer, o.byteOffset, h);
  }
  if (!i || i.byteLength < o.byteLength)
    throw new u(
      `[gpu-device-api] ${n}: the pixel data starts at byte offset ${o.byteOffset} of its ArrayBuffer, which is not a multiple of ${s} (the element size of "${a}" required by format "${t}"). Pass a view whose byteOffset is ${s}-aligned, or hand in a plain ArrayBufferView of the right length.`
    );
  new Uint8Array(i, 0, o.byteLength).set(new Uint8Array(o.buffer, o.byteOffset, o.byteLength));
  const c = o.byteLength - o.byteLength % s;
  return yi(e.type, i, 0, c);
}
function yi(t, e, r, n) {
  switch (t) {
    case 5121:
      return new Uint8Array(e, r, n);
    case 5120:
      return new Int8Array(e, r, n);
    case 5123:
    case 5131:
      return new Uint16Array(e, r, n / 2);
    case 5122:
      return new Int16Array(e, r, n / 2);
    case 5125:
    case 33640:
    case 34042:
      return new Uint32Array(e, r, n / 4);
    case 5124:
      return new Int32Array(e, r, n / 4);
    case 5126:
      return new Float32Array(e, r, n / 4);
    default:
      throw new u(
        `[gpu-device-api] 未知的 GL 像素类型 0x${t.toString(16)}，无法构造上传视图。`
      );
  }
}
function Ia(t, e, r, n, i, s, a, o, l, c, h, d = "writeTexture") {
  const p = e === t.TEXTURE_3D || e === t.TEXTURE_2D_ARRAY, f = (m, g) => Nf(
    o,
    a,
    new Uint8Array(l.buffer, l.byteOffset + m, g),
    d,
    h()
  );
  t.bindTexture(e, r), t.pixelStorei(t.UNPACK_ALIGNMENT, 1), c.unpackRowLength !== 0 && t.pixelStorei(vi, c.unpackRowLength), c.unpackImageHeight !== 0 && t.pixelStorei(xi, c.unpackImageHeight);
  try {
    if (c.perRowUpload) {
      const m = s.width * c.bytesPerPixel;
      for (let g = 0; g < s.depthOrArrayLayers; g += 1)
        for (let b = 0; b < s.height; b += 1) {
          const w = (g * c.rowsPerImage + b) * c.bytesPerRow, y = f(w, m);
          p ? t.texSubImage3D(
            e,
            n,
            i.x,
            i.y,
            i.z + g,
            s.width,
            1,
            1,
            a.format,
            a.type,
            y
          ) : t.texSubImage2D(
            e,
            n,
            i.x,
            i.y + b,
            s.width,
            1,
            a.format,
            a.type,
            y
          );
        }
    } else p ? t.texSubImage3D(
      e,
      n,
      i.x,
      i.y,
      i.z,
      s.width,
      s.height,
      s.depthOrArrayLayers,
      a.format,
      a.type,
      f(0, l.byteLength)
    ) : t.texSubImage2D(
      e,
      n,
      i.x,
      i.y,
      s.width,
      s.height,
      a.format,
      a.type,
      f(0, l.byteLength)
    );
  } finally {
    c.unpackRowLength !== 0 && t.pixelStorei(vi, 0), c.unpackImageHeight !== 0 && t.pixelStorei(xi, 0), t.pixelStorei(t.UNPACK_ALIGNMENT, 4);
  }
}
const vi = 3314, xi = 32878;
function Wf(t, e, r, n, i, s) {
  if (i === n) {
    e.set(t, r);
    return;
  }
  for (let a = 0; a < s; a += 1)
    e.set(t.subarray(a * n, (a + 1) * n), r + a * i);
}
const Si = /* @__PURE__ */ new WeakMap();
function Fn(t) {
  let e = Si.get(t);
  return e === void 0 && (e = t.getExtension("EXT_debug_marker") ?? null, Si.set(t, e)), e;
}
function Da(t, e) {
  Fn(t)?.pushGroupMarkerEXT?.(e);
}
function ka(t) {
  Fn(t)?.popGroupMarkerEXT?.();
}
function Va(t, e) {
  Fn(t)?.insertEventMarkerEXT?.(e);
}
function Ti(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class $i {
  label;
  dimension = zt.D2;
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
  constructor(e, r, n, i, s, a = "canvas:defaultFramebuffer", o = "all") {
    this.width = e, this.height = r, this.format = n, this.sampleCount = i, this.usage = s, this.label = a, this.aspect = o;
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
    if (e.swizzle !== void 0 && e.swizzle !== mt)
      throw new u(
        `[gpu-device-api] canvas 帧纹理的 view「${e.label ?? "(unnamed)"}」要求 swizzle「${e.swizzle}」，但 WebGL2 后端做不到：GLES 3.0 没有 view 对象，采样时各通道的取值由纹理内部格式决定，没有任何调用能在绑定点上重排通道。替代方案：在着色器里做通道选择（\`texture(...).rrr\`），或者先把画面画进一张普通纹理再按需要采样，或者切到 WebGPU 后端。`
      );
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
          aspect: this.aspect,
          swizzle: e.swizzle
        },
        swizzle: mt,
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
class zf {
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
  /**
   * GL context 的创建属性（`alpha` / `premultipliedAlpha` …）。
   *
   * 这些属性**在 context 创建之后改不了**，所以在 `configure()` 里只能读回来对照调用方
   * 要求的 `alphaMode` —— 对不上就明确报错，而不是让 alphaMode 静默失效（`#13`）。
   */
  attributes = null;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this._format = e.format ?? "rgba8unorm";
    const r = Fs(), n = ut(e.canvas);
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
      throw new u(
        "[gpu-device-api] WebGL2CanvasContext.configure: canvas MSAA is decided by the `antialias` attribute of the GL context, so sampleCount cannot be changed here. Create the device with createDevice({ contextAttributes: { antialias: true } }) instead, or use an offscreen RenderTarget (WebGL2 cannot multisample a texture attachment at all)."
      );
    if (e.format !== void 0 && !Dd(e.format))
      throw new u(
        `[gpu-device-api] canvas 格式「${e.format}」不能作为颜色附件。`
      );
    if (this.assertAlphaModeSupported(e.alphaMode), e.colorSpace !== void 0 && e.colorSpace !== "srgb")
      throw new u(
        `[gpu-device-api] canvas colorSpace "${e.colorSpace}" is not supported by WebGL2. The default framebuffer has exactly one 8-bit colour interpretation — WebGL2 has no swap-chain colour-space configuration (drawingBufferColorSpace changes how the browser interprets the buffer, not how this backend writes it, and the render pass has no place to carry that information). Use "srgb", or do the conversion in a shader while writing into an offscreen texture.`
      );
    const r = e.device;
    if (r.native !== this.gl)
      throw new u(
        `[gpu-device-api] 这个 canvas 的 WebGL2 context 不是该 device 持有的那一个。
WebGL2 的 context 是从 canvas 上取的，一个 device 只能服务创建它的那个 canvas；请用 createDevice({ canvas }) 传入同一个 canvas，或为另一个 canvas 单独创建 device。`
      );
    if (this.depthBits = Number(this.gl.getParameter(this.gl.DEPTH_BITS) ?? 0) || 0, this.depthRequested = e.depth, e.depth === !0 && this.depthBits === 0)
      throw new u(
        "[gpu-device-api] WebGL2CanvasContext.configure: depth was requested, but this canvas has no depth buffer (DEPTH_BITS is 0). The depth buffer comes from the GL context attributes, so create the device with createDevice({ contextAttributes: { depth: true } })."
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
    const r = ut(this.canvas);
    this._width = Math.max(1, Math.floor(r.width * e)), this._height = Math.max(1, Math.floor(r.height * e)), this.applyBackingSize();
  }
  resize() {
    const e = ut(this.canvas), r = Math.max(1, Math.floor(e.width * this._pixelRatio)), n = Math.max(1, Math.floor(e.height * this._pixelRatio));
    return r === this._width && n === this._height ? !1 : (this._width = r, this._height = n, this.applyBackingSize(), !0);
  }
  getCurrentFrameTarget() {
    if (!this._device)
      throw new u(
        "[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。"
      );
    const e = this.sampleCount(), r = new $i(
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
    const r = new $i(
      this._width,
      this._height,
      Rs,
      1,
      x.RenderAttachment,
      "canvas:defaultFramebufferDepth",
      "depth-only"
    );
    return {
      view: r.createView({ label: `${r.label}:view` }),
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
  /**
   * 把调用方要的 `alphaMode` 与 GL context 的**创建属性**对照。
   *
   * GL context 的属性在创建后就固定了，所以这里只有两种结果：一致（放行）或明确报错。
   * 以前这里什么都不查，于是 `alphaMode` 静默失效 —— 调用方以为画布是不透明的，
   * 实际合成结果带着 alpha（视觉上表现为「背景透出底下的东西」）。
   */
  assertAlphaModeSupported(e) {
    if (e === void 0) return;
    const r = this.contextAttributes(), n = "The alpha behaviour of a WebGL2 canvas comes from the GL context attributes, so it must be decided when the context is created: create the device with createDevice({ contextAttributes: { alpha: true, premultipliedAlpha: true } }).";
    if (r.alpha !== !0)
      throw new u(
        `[gpu-device-api] canvas alphaMode "${e}" cannot be honoured on WebGL2: this canvas was created with alpha: false, so the default framebuffer has no alpha channel at all. ` + n
      );
    if (e === "opaque")
      throw new u(
        '[gpu-device-api] canvas alphaMode "opaque" cannot be honoured on WebGL2. A GL default framebuffer always carries the alpha written by the shader / clear colour; there is no "ignore alpha while compositing" switch in the GL context attributes. Clear the canvas with alpha = 1 (or output alpha = 1 in the fragment shader) instead. ' + n
      );
    if (r.premultipliedAlpha !== !0)
      throw new u(
        '[gpu-device-api] canvas alphaMode "premultiplied" cannot be honoured on WebGL2: this canvas was created with premultipliedAlpha: false. ' + n
      );
  }
  /** 读（并缓存）GL context 的创建属性。 */
  contextAttributes() {
    return this.attributes === null && (this.attributes = this.gl.getContextAttributes() ?? {}), this.attributes;
  }
  applyBackingSize() {
    this.canvas.width = this._width, this.canvas.height = this._height, this._device?.invalidateState();
  }
}
function qf(t, e) {
  for (let r = 0; r < 4; r += 1) {
    const n = t[r], i = e[r];
    if (n !== i && !(Number.isNaN(n) && Number.isNaN(i))) return !1;
  }
  return !0;
}
const jf = [];
let Gt = 1;
class Qf {
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
  /**
   * 本通道画进的离屏渲染目标（没有就是 canvas 默认帧缓冲或临时拼的 FBO）。
   *
   * 它有两个用途：多重采样目标要在 `end()` 时做 resolve；以及决定 `variantShape.sampleCount`。
   */
  renderTarget = null;
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
  bindingRevision = Gt++;
  constructor(e, r) {
    this.label = e.label ?? "renderPass", this.gl = r.gl, this.state = r.state, this.options = r;
    const n = e.target;
    if (n) {
      if (e.colorAttachments && e.colorAttachments.length > 0)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」同时给了 target 与 colorAttachments。请只保留一种写法：用 target 表示「画进这个渲染目标」，或用 colorAttachments 明确指定附件。`
        );
      this.colorFormats = n.colorFormats, this.depthFormat = n.depthFormat, n.bind({
        clearColor: e.clearValue,
        clearDepth: e.depthClearValue,
        clearStencil: e.depthClearValue === void 0 ? void 0 : 0,
        loadOp: e.colorAttachments?.[0]?.loadOp,
        depthLoadOp: e.depthStencilAttachment?.depthLoadOp
      }), this.state.invalidate(), this.state.setViewport(0, 0, n.width, n.height), this.renderTarget = n;
    } else {
      const i = e.colorAttachments.filter((o) => o !== null);
      if (i.length === 0 && !e.depthStencilAttachment)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`
        );
      this.colorFormats = i.map((o) => o.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null;
      const s = i.some((o) => Ti(o.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && Ti(e.depthStencilAttachment.view), a = this.multisampleTargetOf(e, i);
      if (a)
        this.beginMultisampleTargetPass(e, a);
      else if (s)
        this.beginDefaultFramebufferPass(e);
      else {
        const o = r.framebuffers.acquire(e);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, o), this.state.invalidate();
        const l = i[0], c = l.view.texture.width, h = l.view.texture.height;
        this.clearRawAttachments(e, o, l.view), this.gl.viewport(0, 0, c, h), this.state.setViewport(0, 0, c, h);
      }
    }
    this.variantShape = {
      colorFormats: this.colorFormats,
      sampleCount: this.renderTarget?.sampleCount ?? 1,
      depthFormat: this.depthFormat
    }, this.beginQuerySetup(e);
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.pipeline = e, e.applyState(this.resolvedVariant(e), this.stencilReference);
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), e < 0 || e >= 4)
      throw new u(
        `[gpu-device-api] setBindGroup 的 index 必须在 0..3 之间（WebGL2 后端最多 4 个 bind group），实际是 ${e}。`
      );
    const i = this.pipeline;
    if (i && i.layout !== "auto" && r) {
      const s = i.layout.bindGroupLayouts[e];
      if (s && s !== r.layout && !(s.sortedEntries.length === r.layout.sortedEntries.length && s.sortedEntries.every((o, l) => {
        const c = r.layout.sortedEntries[l];
        return o.binding === c.binding && o.type === c.type && o.name === c.name;
      })))
        throw new u(
          `[gpu-device-api] setBindGroup(${e}, ...) 传入的 bind group 与管线「${i.label}」在该 group 上声明的布局不一致（传入「${r.layout.label}」，期望「${s.label}」）。`
        );
    }
    this.bindGroups.set(e, r), n ? this.dynamicOffsets.set(e, [...n]) : this.dynamicOffsets.delete(e);
  }
  setVertexBuffer(e, r, n = 0, i = -1) {
    if (this.assertOpen("setVertexBuffer"), e < 0 || e >= 16)
      throw new u(`[gpu-device-api] setVertexBuffer 的 slot 必须在 0..15 之间，实际是 ${e}。`);
    if (r && r.isIndexBuffer)
      throw new u(
        `[gpu-device-api] buffer「${r.label}」是以 \`BufferUsage.Index\` 创建的索引缓冲，WebGL2 里一个 buffer 的绑定目标在创建时就永久固定（索引缓冲只能用 ELEMENT_ARRAY_BUFFER），所以它不能再当顶点缓冲使用。请为顶点数据单独创建一个 buffer。`
      );
    const s = this.vertexBuffers[e];
    if (r === null) {
      if (!s) return;
      this.vertexBuffers[e] = null, this.bindingRevision = Gt++;
      return;
    }
    if (s && s.buffer === r && s.offset === n && s.size === i) return;
    const a = s ?? { buffer: r, offset: n, size: i };
    a.buffer = r, a.offset = n, a.size = i, this.vertexBuffers[e] = a, this.bindingRevision = Gt++;
  }
  setIndexBuffer(e, r, n = 0, i = -1) {
    if (this.assertOpen("setIndexBuffer"), !e.isIndexBuffer)
      throw new u(
        `[gpu-device-api] buffer「${e.label}」的 usage 里没有 \`BufferUsage.Index\`，而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 \`BufferUsage.Index\`。`
      );
    const s = this.indexBuffer;
    s && s.buffer === e && s.format === r && s.offset === n && s.size === i || (s ? (s.buffer = e, s.format = r, s.offset = n, s.size = i) : this.indexBuffer = { buffer: e, format: r, offset: n, size: i }, this.bindingRevision = Gt++);
  }
  setViewport(e, r, n, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), (s !== 0 || a !== 1) && this.gl.depthRange(s, a), this.state.setViewport(e, r, n, i);
  }
  setScissorRect(e, r, n, i) {
    this.assertOpen("setScissorRect"), this.state.setScissor(!0, e, r, n, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(je(e));
  }
  setStencilReference(e) {
    this.assertOpen("setStencilReference"), this.stencilReference = e, this.pipeline && this.pipeline.applyState(this.resolvedVariant(this.pipeline), e);
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
      throw new u(
        "[gpu-device-api] drawIndexed() 之前必须先调用 setIndexBuffer()。"
      );
    this.assertNoUnsupportedInstancing(e.firstInstance ?? 0, e.baseVertex ?? 0);
    const i = e.instanceCount ?? 1, s = n.offset + (e.firstIndex ?? 0) * ko(n.format);
    this.beginDraw(r, n), this.gl.drawElementsInstanced(
      r.mode,
      e.indexCount,
      Yd[n.format],
      s,
      i
    ), this.options.onDraw?.();
  }
  drawIndirect(e, r = 0) {
    throw this.assertOpen("drawIndirect"), new u(
      "[gpu-device-api] WebGL2 不支持 indirect draw。请把间接参数读回 CPU 后用普通的 draw() 提交，或改用 WebGPU 后端。"
    );
  }
  drawIndexedIndirect(e, r = 0) {
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
    const r = this.occlusionQuerySet;
    if (!r)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: the pass was created without RenderPassDescriptor.occlusionQuerySet, so there is nowhere to store the sample count.`
      );
    if (this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".beginOcclusionQuery: an occlusion query is already open; call endOcclusionQuery() first (GL allows only one active query per target).`
      );
    this.gl.beginQuery(Kr, r.queryAt(e, `${this.label}.beginOcclusionQuery`)), this.occlusionQueryOpen = !0;
  }
  /** 结束最近一次 {@link beginOcclusionQuery}。 */
  endOcclusionQuery() {
    if (this.assertOpen("endOcclusionQuery"), !this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".endOcclusionQuery: no occlusion query is open.`
      );
    this.gl.endQuery(Kr), this.occlusionQueryOpen = !1;
  }
  /**
   * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
   * （只影响抓帧工具的分组显示，不影响渲染结果）。
   */
  pushDebugGroup(e) {
    Da(this.gl, e);
  }
  popDebugGroup() {
    ka(this.gl);
  }
  insertDebugMarker(e) {
    Va(this.gl, e);
  }
  end() {
    if (!this._ended) {
      if (this.occlusionQueryOpen)
        throw new u(
          `[gpu-device-api] RenderPass "${this.label}".end: an occlusion query is still open; call endOcclusionQuery() before ending the pass.`
        );
      this.renderTarget?.resolve(), this.endTimerQuery(), this._ended = !0, this.state.invalidate();
    }
  }
  /* ------------------------------------------------------------------ 内部 ------------------- */
  /**
   * 判断这组原始附件是否**整体**来自同一个多重采样渲染目标。
   *
   * 为什么需要它：上层（`Renderer`）走的是 WebGPU 风格的写法 —— `target.createPassDescriptor()`
   * 拿到附件列表再交给 `beginRenderPass`，而不是把 `target` 直接传下来。没有这一步，
   * 多重采样目标会落到「按附件临时拼一个单采样 FBO」的分支，MSAA 被静默忽略。
   *
   * 返回值：
   * - `null`：不是多重采样目标（或者只是单采样目标的附件，此时行为与从前完全一致）；
   * - 目标：所有附件都属于同一个多重采样目标；
   * - 抛错：把一个多重采样目标的附件与别的目标的附件混在一起用 —— 这种组合本层无法正确
   *   表达（renderbuffer 与纹理不能挂在同一个 FBO 上），所以明确报错而不是画错。
   */
  multisampleTargetOf(e, r) {
    const n = r.map((o) => o.view);
    e.depthStencilAttachment && n.push(e.depthStencilAttachment.view);
    let i = null;
    for (const o of n) {
      const l = wi(o);
      if (l) {
        if (i === null) i = l;
        else if (i !== l)
          throw new u(
            `[gpu-device-api] 渲染通道「${this.label}」把多个渲染目标的附件混在了一起。一个渲染通道的附件必须来自同一个渲染目标（多重采样的附件是 renderbuffer，无法与别的 target 的纹理挂在同一个 framebuffer 上）。`
          );
      }
    }
    if (!i || i.sampleCount === 1) return null;
    for (const o of n)
      if (wi(o) !== i)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」把多重采样目标「${i.label}」的附件与其它附件混在了一起。多重采样目标的附件全部是 renderbuffer，只能整组使用；请传 \`target\`（或完整使用 \`target.createPassDescriptor()\` 的结果），或把该目标的 sampleCount 设为 1。`
        );
    const s = i.colorAttachments.map((o) => o.view);
    let a = -1;
    for (let o = 0; o < e.colorAttachments.length; o += 1) {
      const l = e.colorAttachments[o];
      if (!l) {
        a < 0 && (a = o);
        continue;
      }
      if (l.view !== s[o])
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」的第 ${o} 个颜色附件不是多重采样目标「${i.label}」的第 ${o} 个颜色附件。多重采样目标只能整组、按原顺序使用（draw FBO 的 drawBuffers 与 resolve 的 blitFramebuffer 都固定在目标自己的附件顺序上）。请传 \`target\`，或完整使用 \`target.createPassDescriptor()\` 的结果。`
        );
      if (a >= 0)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」的 colorAttachments[${a}] 是 null，但后面还有非空附件。多重采样目标只能整组使用，空位无法表达（draw 的 location 会按位置写进目标的第 i 个附件，而不是丢弃输出）。请传 \`target\`，或完整使用 \`target.createPassDescriptor()\` 的结果。`
        );
    }
    return i;
  }
  /**
   * 用渲染目标自己的 framebuffer 开始通道（多重采样路径）。
   *
   * 清屏参数从附件列表归并而来：GL 的 `clearBuffer*` 对同一帧的所有颜色附件用同一个颜色
   * （见 `WebGL2RenderTarget.bind`），所以这里要求各附件的 `loadOp` / `clearValue` 一致，
   * 不一致就明确报错，而不是悄悄只按第一个附件清屏。
   *
   * 比较用**解析后的 RGBA 分量**，不再拼 `JSON.stringify`（#35）：改前每次比较要构造两条
   * JSON 字符串，而且判据是「字面量形状」——`'#ff0000'` 与 `0xff0000`、`[1,0,0]` 这几种写法
   * 指向同一个颜色却会被判成「不一致」而报错。清屏真正用的值是 `resolveClearColor` 的结果，
   * 所以按那个结果逐分量比较才是正确的等价关系。
   *
   * 逐字段等价性（含 `undefined`）：
   * - 「第一个**有值**的附件说了算」这条改前的判据（`clearValue === undefined`）原样保留 ——
   *   前导的缺省值不会被当成一个待比较的颜色，而是继续看后面的附件。
   * - 缺省值解析出来是 `[0, 0, 0, 1]`（默认黑），所以「缺省 vs 显式黑色」不再报错，
   *   而「缺省 vs 显式红」照样报错。前者是有意的放宽（两者的清屏结果本来就相同），
   *   后者与改前一致。
   * - `NaN` 分量视为相等：改前的字符串比较里 `JSON.stringify(NaN)` 也是 `'null'`，
   *   两个 `NaN` 同样会被判成一致。
   */
  beginMultisampleTargetPass(e, r) {
    let n = "clear", i, s = null;
    for (const o of e.colorAttachments) {
      if (!o) continue;
      if ((o.loadOp ?? "clear") === "load") {
        n = "load";
        continue;
      }
      if (i === void 0) {
        i = o.clearValue, i !== void 0 && (s = je(i));
        continue;
      }
      const c = je(o.clearValue);
      if (s === null || !qf(s, c))
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」给多个颜色附件指定了不同的 clearValue，而 WebGL2 的清屏对整帧只有一个颜色。请让它们一致（或改用 sampleCount = 1 的目标）。`
        );
    }
    if (n === "clear" && e.colorAttachments.some((o) => o?.loadOp === "load"))
      throw new u(
        `[gpu-device-api] 渲染通道「${this.label}」给一部分颜色附件用了 loadOp: 'load'、另一部分用了 'clear'，WebGL2 无法在一次清屏里表达这种组合。请统一 loadOp。`
      );
    const a = e.depthStencilAttachment;
    r.bind({
      clearColor: n === "load" ? void 0 : i,
      clearDepth: a?.depthClearValue,
      clearStencil: a?.stencilClearValue,
      loadOp: n,
      depthLoadOp: a?.depthLoadOp
    }), this.renderTarget = r, this.state.invalidate(), this.state.setViewport(0, 0, r.width, r.height);
  }
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
    e.occlusionQuerySet && (this.occlusionQuerySet = Jr(
      e.occlusionQuerySet,
      `${this.label}.occlusionQuerySet`
    ));
    const r = e.timestampWrites;
    if (!r) return;
    const n = `${this.label}.timestampWrites`;
    Ts(r, n);
    const i = Jr(r.querySet, `${n}.querySet`), s = r.beginningOfPassWriteIndex ?? r.endOfPassWriteIndex;
    if (s === void 0)
      throw new u(`[gpu-device-api] ${n}: no write index was given.`);
    const a = i.queryAt(s, n);
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
  assertNoUnsupportedInstancing(e, r) {
    if (e !== 0)
      throw new u(
        "[gpu-device-api] WebGL2 不支持 `firstInstance`（缺少 drawArraysInstancedBaseInstance）。请把实例数据整体前移，或改用 WebGPU 后端。"
      );
    if (r !== 0)
      throw new u(
        "[gpu-device-api] WebGL2 不支持 `baseVertex`（缺少 drawElementsInstancedBaseVertex）。请把顶点偏移直接加到索引里，或改用 WebGPU 后端。"
      );
  }
  /** 一个 draw 之前必须完成的全部绑定工作。 */
  beginDraw(e, r) {
    const n = this.resolvedVariant(e);
    e.applyState(n, this.stencilReference);
    const i = e.acquireVertexArray(
      n,
      this.vertexBuffers,
      r ? r.buffer.native : null,
      this.bindingRevision
    );
    this.state.bindVertexArray(i), i === null && r && this.state.bindIndexBuffer(r.buffer.native), this.applyBindGroups(e);
  }
  applyBindGroups(e) {
    const r = e.bindingPlan;
    if (r) {
      for (const [n, i] of this.bindGroups) {
        if (!i) continue;
        const s = r.uniformBlocksByGroup.get(n);
        if (s) {
          const o = r.dynamicBlocksByGroup.get(n) ?? jf, l = o.length > 0 ? this.dynamicOffsets.get(n) : void 0;
          if (o.length > 0 && (l === void 0 || l.length < o.length))
            throw new u(
              `[gpu-device-api] setBindGroup(${n}, ...) 缺少动态偏移：布局里有 ${o.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${l?.length ?? 0} 个偏移值。`
            );
          let c = 0;
          for (const h of s) {
            const d = i.entry(h.binding);
            if (!d)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${h.binding}（布局要求提供 uniform buffer）。`
              );
            const p = d.resource, f = p.buffer, m = p.offset ?? 0;
            if (h.dynamic) {
              const g = this.state.uniformBufferOffsetAlignment(), b = l[c++] ?? 0;
              if (g > 0 && b % g !== 0)
                throw new u(
                  `[gpu-device-api] 动态偏移 ${b} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${g}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
                );
              const w = m + b, y = p.size ?? f.size - w;
              this.state.bindUniformBuffer(h.blockBinding, f.native, w, y);
            } else
              this.state.bindUniformBuffer(h.blockBinding, f.native, 0, -1);
          }
        }
        const a = r.texturesByGroup.get(n);
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
      this.assertAllGroupsBound(r);
    }
  }
  /** 布局要求了某个 group，但调用方一次都没 setBindGroup —— 早报错好过画面全黑。 */
  assertAllGroupsBound(e) {
    let r = null;
    for (const n of e.requiredGroups)
      this.bindGroups.get(n) || (r ??= []).push(n);
    if (r)
      throw new u(
        `[gpu-device-api] 管线需要 bind group ${r.join("、")}，但本次绘制前没有调用 setBindGroup()。缺少绑定会让着色器读到未定义的数据（画面通常全黑且没有任何报错），所以这里直接拦下。`
      );
  }
  /**
   * WebGL2 无法表达「同一个纹理的不同 mip 子范围视图」：mip 范围是纹理对象自身的参数，
   * 不是绑定点状态。为了避免同一张纹理被两个 view 以不同 mip 范围采样时结果错乱，这里直接报错。
   */
  assertViewRangeSupported(e) {
    const r = e.descriptor, n = e.texture;
    if (r.baseMipLevel !== 0 || r.mipLevelCount !== n.mipLevelCount)
      throw new u(
        `[gpu-device-api] WebGL2 后端不支持在绑定时指定 mip 子范围（纹理「${n.label}」的 view 指定了 baseMipLevel=${r.baseMipLevel}, mipLevelCount=${r.mipLevelCount}）。mip 范围是纹理对象自身的状态，不是绑定点状态。请为需要的 mip 范围单独创建一张纹理。`
      );
  }
  /**
   * 原始附件（不走 RenderTarget）路径下的清屏。
   *
   * ## 下标语义（`#11`）：`clearBufferfv(COLOR, i)` 的 `i` 是 **location 下标**，不是附着点枚举
   *
   * `clearBuffer*` 的 `drawbuffer` 参数是「第几个 draw buffer」，清的是 `drawBuffers[i]` 指向的
   * 附着点。`FramebufferCache` 现在按**逐位置**挂附件（`drawBuffers[i] = COLOR_ATTACHMENT0 + i`，
   * 空位为 `NONE`），所以这里用**原始数组下标**清屏才是对的，三处必须一致：
   *
   * | 处 | 语义 |
   * | --- | --- |
   * | `FramebufferCache.acquire` 挂附件 | `COLOR_ATTACHMENT0 + 原始下标` |
   * | `FramebufferCache.acquire` 的 `drawBuffers` | 逐位置，空位 `NONE` |
   * | 这里 | `clearBufferfv(COLOR, 原始下标)` |
   *
   * 任何一处改用「非空附件的压缩序号」，`colorAttachments: [null, view]` 这类组合就会
   * 静默地画错（改前正是如此：附件挂在 0、清屏清 1、draw 的 location 0 又写进 view）。
   * `null` 空位**不清屏**：那个 location 没有片元输出，清它没有意义。
   */
  clearRawAttachments(e, r, n) {
    const i = this.gl;
    this.state.resetScissor(n.texture.width, n.texture.height), e.colorAttachments.forEach((o, l) => {
      if (!o || o.loadOp === "load") return;
      const [c, h, d, p] = je(o.clearValue);
      i.clearBufferfv(i.COLOR, l, Oa(c, h, d, p));
    });
    const a = e.depthStencilAttachment;
    if (a && a.depthLoadOp !== "load") {
      const o = a.view.texture.format.includes("stencil");
      this.state.prepareClear(o);
      const l = a.depthClearValue ?? 1, c = a.stencilClearValue ?? 0;
      o ? i.clearBufferfi(i.DEPTH_STENCIL, 0, l, c) : (rr[0] = l, i.clearBufferfv(i.DEPTH, 0, rr));
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
      const [o, l, c, h] = je(s.clearValue);
      r.clearColor(o, l, c, h), r.clear(r.COLOR_BUFFER_BIT);
    }
    const a = e.depthStencilAttachment;
    a && a.depthLoadOp !== "load" && (r.depthMask(!0), r.clearDepth(a.depthClearValue ?? 1), r.clear(r.DEPTH_BUFFER_BIT)), r.viewport(0, 0, n, i), this.state.setViewport(0, 0, n, i);
  }
  assertOpen(e) {
    if (this._ended)
      throw new u(
        `[gpu-device-api] 渲染通道「${this.label}」已经 end()，不能再调用 ${e}()。`
      );
  }
}
const ge = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class Yf {
  label = "computePass";
  constructor(e) {
    throw new u(ge);
  }
  get ended() {
    return !0;
  }
  setPipeline(e) {
    throw new u(ge);
  }
  setBindGroup(e, r, n) {
    throw new u(ge);
  }
  dispatchWorkgroups(e, r, n) {
    throw new u(ge);
  }
  dispatchWorkgroupsIndirect(e, r) {
    throw new u(ge);
  }
  pushDebugGroup(e) {
    throw new u(ge);
  }
  popDebugGroup() {
    throw new u(ge);
  }
  insertDebugMarker(e) {
    throw new u(ge);
  }
  end() {
  }
}
const Xf = 64 * 1024;
class Hf {
  label;
  gl;
  state;
  passOptions;
  openPass = null;
  drawCalls = 0;
  passCount = 0;
  finished = !1;
  /** 见 {@link UPLOAD_SCRATCH_BYTES}。 */
  scratch = null;
  constructor(e, r, n, i) {
    this.label = e?.label ?? U("commandEncoder"), this.gl = r, this.state = n, this.passOptions = i;
  }
  /** 由渲染通道回调，用于统计。 */
  noteDrawCall() {
    this.drawCalls += 1;
  }
  /**
   * 开始一个 render pass。
   *
   * ## `#12`：上一个 pass 还开着时**隐式结束**它（对齐 WebGPU 原生语义）
   *
   * 改前这里抛 `ValidationError`，而 WebGPU 后端（以及原生 `GPUCommandEncoder.beginRenderPass()`）
   * 是**隐式结束**上一个 pass。于是「忘了 `pass.end()`」的调用方在 WebGPU 上正常出图、
   * 在 WebGL2 上直接抛错 —— 同一份上层代码一边正常一边崩，这是本批要消掉的那类不一致。
   *
   * 选「对齐 WebGPU」而不是「两边都抛错」的理由：
   * core 层的定位是**显式镜像 WebGPU 形状**（见 `core/Device.ts` 与 `core/render/CommandEncoder.ts`），
   * 而 WebGPU 规范里「一个 encoder 同时只能有一个打开的 pass」这条约束的**执行方式**就是
   * 「开始新 pass 时隐式结束旧的」，不是在 `end()` 之外再加一个人造错误；
   * 让 WebGL2 严格到比它镜像的对象更严，等于把 core 变成另一个 API。
   *
   * ⚠️ **这有隐藏 bug 的风险**：忘记 `pass.end()` **不会报错**，那个通道的收尾动作
   * （多重采样 resolve、时间查询 end、状态作废）只会因为这里调用了 `end()` 才发生。
   * 换句话说，写错了以后表现是「少了一次 resolve / 少了一次查询收尾」，而不是一条异常。
   * 这是 WebGPU 原生语义本身的代价，不是本后端的额外缺陷；要自查可以对着
   * `WebGL2CommandBuffer.passCount` 与预期通道数对账。
   */
  beginRenderPass(e) {
    this.assertOpen("beginRenderPass"), this.closeOpenPass();
    const r = new Qf(e, this.passOptions);
    return this.openPass = r, this.passCount += 1, r;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), this.closeOpenPass(), new Yf();
  }
  copyBufferToBuffer(e, r, n, i, s) {
    this.assertOpen("copyBufferToBuffer");
    const a = e, o = n;
    if (a.isIndexBuffer || o.isIndexBuffer) {
      const l = new Uint8Array(s);
      a.download(r, l), o.upload(i, l);
      return;
    }
    if (a === o && r < i + s && i < r + s) {
      const l = new Uint8Array(s);
      a.download(r, l), o.upload(i, l);
      return;
    }
    this.state.bindCopyWriteBuffer(o.native), this.state.bindCopyReadBuffer(a.native), this.gl.copyBufferSubData(
      this.gl.COPY_READ_BUFFER,
      this.gl.COPY_WRITE_BUFFER,
      r,
      i,
      s
    );
  }
  /**
   * buffer → texture。**一次 `texSubImage3D` 上传整叠 image**（3D / 数组纹理的全部层），
   * 而不是逐层调用 —— GL 的 `texSubImage3D` 本来就是这样消费主机内存的
   * （层距由 `UNPACK_IMAGE_HEIGHT` = `rowsPerImage` 决定）。
   *
   * 修复前的写法只按 `bytesPerRow * height` 分配源数据，却把 `copySize.depthOrArrayLayers`
   * 原样交给 `texSubImage3D`：GL 会按「层距 = height」去读第 1 层之后的数据，读到的是缓冲区
   * 之外的内容（实测报 `INVALID_OPERATION`，而本后端默认不查 GL 错误 → 静默）。
   */
  copyBufferToTexture(e, r, n) {
    this.assertOpen("copyBufferToTexture");
    const i = this.gl, s = r.texture, a = e.buffer, o = F(s.format);
    Qt("copyBufferToTexture", s, r.aspect);
    const { x: l, y: c, z: h } = Ot(r.origin), d = e.offset ?? 0, p = tn(
      e,
      n,
      o,
      "copyBufferToTexture",
      s.format,
      s.label
    );
    if (d + p.requiredBytes > a.size)
      throw new u(
        `[gpu-device-api] copyBufferToTexture: the source range [${d}, ${d + p.requiredBytes}) exceeds buffer「${a.label}」's ${a.size} bytes — ${n.width}x${n.height}x${n.depthOrArrayLayers} pixels need bytesPerRow=${p.bytesPerRow} and rowsPerImage=${p.rowsPerImage}.`
      );
    const f = new Uint8Array(p.requiredBytes);
    a.download(d, f), Ia(
      i,
      s.target,
      s.native,
      r.mipLevel ?? 0,
      { x: l, y: c, z: h },
      n,
      o,
      s.format,
      f,
      p,
      () => this.uploadScratch(),
      "copyBufferToTexture"
    ), this.state.invalidateTextureUnits();
  }
  /**
   * texture → buffer。
   *
   * 两个修复点：
   *
   * 1. **深度/模板纹理会明确报错**（`#9`）。WebGL2 的 `readPixels` 不支持任何深度组合：
   *    规范把 `format` 限制为 `RGBA`（`UNSIGNED_BYTE` / `FLOAT`）与 `RED`（`FLOAT`），
   *    而实现的「read format」对深度附件是 `DEPTH_COMPONENT`/`UNSIGNED_INT`，两者永远对不上。
   *    本机原生探针实测：4 种深度格式 × 5 种组合**全部** `0x500 INVALID_ENUM`
   *    （`WEBGL_depth_texture` 是 WebGL1 的扩展，WebGL2 没有它）。修复前的行为是
   *    「不查错误 → 缓冲里全是 0」，调用方拿到的是一份看起来正常的全 0 数据。
   *
   * 2. **按 `copySize.depthOrArrayLayers` 逐层读回**，层号真的落到附件上
   *    （`framebufferTextureLayer`），并按 `rowsPerImage` 决定每层在目标 buffer 里的起点。
   *    修复前只读第 0 层、`rowsPerImage` 被完全忽略。
   */
  copyTextureToBuffer(e, r, n) {
    this.assertOpen("copyTextureToBuffer");
    const i = this.gl, s = e.texture, a = F(s.format);
    Zf(s, e.aspect, n.depthOrArrayLayers);
    const o = Vf(
      r,
      n,
      a,
      "copyTextureToBuffer",
      s.format,
      s.label
    ), l = r.offset ?? 0, c = r.buffer;
    if (l + o.requiredBytes > c.size)
      throw new u(
        `[gpu-device-api] copyTextureToBuffer: the destination range [${l}, ${l + o.requiredBytes}) exceeds buffer「${c.label}」's ${c.size} bytes (${n.width}x${n.height}x${n.depthOrArrayLayers}, bytesPerRow=${o.bytesPerRow}, rowsPerImage=${o.rowsPerImage}).`
      );
    const h = n.width * a.bytesPerPixel, d = new Uint8Array(o.requiredBytes), p = this.state.currentFramebuffer(), f = a.depth ? i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0, m = e.mipLevel ?? 0, { x: g, y: b, z: w } = Ot(e.origin);
    i.pixelStorei(i.PACK_ALIGNMENT, 1);
    const y = new Uint8Array(h * n.height);
    for (let v = 0; v < n.depthOrArrayLayers; v += 1) {
      if (Kf(this.state, i, s, f, m, w + v), v === 0) {
        const T = i.checkFramebufferStatus(i.FRAMEBUFFER);
        if (T !== i.FRAMEBUFFER_COMPLETE)
          throw i.pixelStorei(i.PACK_ALIGNMENT, 4), this.state.bindFramebuffer(p), this.state.invalidateFramebufferBinding(), this.state.forgetReadbackTexture(), new u(
            `[gpu-device-api] 无法把纹理「${s.label}」的第 ${w} 层作为附件读回（framebuffer 不完整，0x${T.toString(16)}）。请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。`
          );
      }
      i.readPixels(g, b, n.width, n.height, a.format, a.type, y), Wf(y, d, v * o.rowsPerImage * o.bytesPerRow, h, o.bytesPerRow, n.height);
    }
    i.pixelStorei(i.PACK_ALIGNMENT, 4), this.state.bindFramebuffer(p), this.state.forgetReadbackTexture(), this.state.invalidateFramebufferBinding(), c.upload(l, d);
  }
  /**
   * texture → texture，用 `blitFramebuffer` 走 GPU 侧，避免绕 CPU 一圈。
   *
   * 修复了三个静默错误（`#8`）：
   *
   * 1. **`origin.z` 被丢弃**。修复前只解构 `x`/`y`，`z` 直接没了 —— 用数组/3D 纹理时
   *    「拷贝第 3 层」实际拷贝的是第 0 层。
   * 2. **数组/3D 纹理被挂到 `TEXTURE_2D` 附着点上**。修复前固定调
   *    `framebufferTexture2D(..., TEXTURE_2D, ...)`：这在本机实测**报错**
   *    （`0x502` + `FRAMEBUFFER_INCOMPLETE_DIMENSIONS`），而审计在另一台机器上实测
   *    「不报错、FBO 还完整」—— 两种实现的报错不同，所以「靠 GL 报错兜底」不可靠，
   *    必须在库内用 `framebufferTextureLayer` 说清楚层级。
   * 3. **深度/模板纹理被当成颜色附件**（`COLOR_ATTACHMENT0` + `COLOR_BUFFER_BIT`）。
   *    深度格式挂颜色附着点是不合法的组合，blit 请求颜色位也没有意义。
   */
  copyTextureToTexture(e, r, n) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = r.texture, o = F(a.format), l = F(s.format);
    if (l.internalFormat !== o.internalFormat)
      throw new u(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${s.format}」，目标是「${a.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`
      );
    if (s.dimension !== a.dimension)
      throw new u(
        `[gpu-device-api] copyTextureToTexture 要求源与目标维度一致：源是「${s.dimension}」，目标是「${a.dimension}」。WebGL2 的 blitFramebuffer 只能在同种目标之间搬纹素。`
      );
    const c = e.mipLevel ?? 0, h = r.mipLevel ?? 0;
    Qt("copyTextureToTexture(source)", s, e.aspect), Qt("copyTextureToTexture(destination)", a, r.aspect), Ei(s, c, e.origin), Ei(a, h, r.origin);
    const { x: d, y: p, z: f } = Ot(e.origin), { x: m, y: g, z: b } = Ot(r.origin), w = Na(i, s);
    if (!w && n.depthOrArrayLayers !== 1)
      throw new u(
        `[gpu-device-api] copyTextureToTexture: depthOrArrayLayers=${n.depthOrArrayLayers} 需要 3D 或数组纹理，但「${s.label}」是单层 2D 纹理。`
      );
    const y = l.depth, v = y ? l.stencil ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0, T = y ? i.DEPTH_BUFFER_BIT : i.COLOR_BUFFER_BIT, E = i.createFramebuffer(), P = i.createFramebuffer();
    if (!E || !P)
      throw new u("[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。");
    const L = i.getParameter(i.FRAMEBUFFER_BINDING);
    try {
      i.bindFramebuffer(i.READ_FRAMEBUFFER, E), Ut(i, i.READ_FRAMEBUFFER, s, v, c, f), i.bindFramebuffer(i.DRAW_FRAMEBUFFER, P), Ut(
        i,
        i.DRAW_FRAMEBUFFER,
        a,
        v,
        h,
        b
      );
      const B = w ? n.depthOrArrayLayers : 1;
      for (let G = 0; G < B; G += 1)
        B > 1 && (Ut(
          i,
          i.READ_FRAMEBUFFER,
          s,
          v,
          c,
          f + G
        ), Ut(
          i,
          i.DRAW_FRAMEBUFFER,
          a,
          v,
          h,
          b + G
        )), i.blitFramebuffer(
          d,
          p,
          d + n.width,
          p + n.height,
          m,
          g,
          m + n.width,
          g + n.height,
          T,
          i.NEAREST
        );
    } finally {
      i.bindFramebuffer(i.FRAMEBUFFER, L), i.deleteFramebuffer(E), i.deleteFramebuffer(P);
    }
    this.state.invalidate();
  }
  /**
   * 将 buffer 的一段范围清零。
   *
   * ## `#15`：校验与 WebGPU 逐条对齐（改前 WebGL2 完全没有）
   *
   * 改前这里直接把 `(offset, length)` 传给 `bufferSubData`：`offset` 随意、`length` 为 0 或负数
   * 时连一次调用都不发（静默），超范围时驱动记一条 `INVALID_VALUE` 而本后端默认不查 GL 错误。
   * 于是**同一段代码在 WebGL2 上「成功」、在 WebGPU 上抛错**，而且在 WebGL2 上留下的还是
   * 未定义结果。现在按 `WebGPUCommandEncoder.clearBuffer` 的**同一顺序**做同一组检查
   * （消息逐字相同），两个后端对同一批非法输入给出同一个 `ValidationError`。
   *
   * 放行的一侧也一并核对过：WebGPU 允许「`size` 省略时清到末尾」并要求结果仍满足 4 对齐，
   * 而 `WebGL2Buffer` 的大小本身就是 4 的倍数（见它的构造校验），所以省略 `size` 的
   * 合法用法不会被误杀。
   */
  clearBuffer(e, r = 0, n) {
    this.assertOpen("clearBuffer"), Te(r, `${this.label}.clearBuffer offset`);
    const i = n ?? e.size - r;
    if (r % 4 !== 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${r}.`
      );
    if (i <= 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${i}.`
      );
    if (i % 4 !== 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${i}.`
      );
    if (r + i > e.size)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: range [${r}, ${r + i}) exceeds the buffer size ${e.size}.`
      );
    const s = e;
    let a = r;
    for (const o of Jf(i))
      s.upload(a, o), a += o.length;
  }
  /**
   * WebGL2 没有对应能力：GL 的查询结果不能写进 buffer，只能 `getQueryParameter()` 读回。
   * 调用它明确报错，并指出替代方案（`Device.readQuerySet()`）。
   */
  resolveQuerySet(e, r, n, i, s) {
    throw this.assertOpen("resolveQuerySet"), new u(
      "[gpu-device-api] WebGL2 has no resolveQuerySet(): GL query results cannot be copied into a buffer, they can only be read back one by one with gl.getQueryParameter(). Use Device.readQuerySet() instead — it polls QUERY_RESULT_AVAILABLE and returns the same QueryResult shape as WebGPU."
    );
  }
  /**
   * WebGL2 没有「单个时刻的时间戳」：GL 的时间查询是 `beginQuery → endQuery` 的**区间**测量。
   * 请改用 `RenderPassDescriptor.timestampWrites`（后端会用 beginQuery/endQuery 包住整个通道）。
   */
  writeTimestamp(e, r) {
    throw this.assertOpen("writeTimestamp"), new u(
      "[gpu-device-api] WebGL2 has no CommandEncoder.writeTimestamp(): GL timer queries measure an interval (beginQuery → endQuery), not a single instant. Use RenderPassDescriptor.timestampWrites with an EXT_disjoint_timer_query_webgl2 query set instead."
    );
  }
  /** 调试分组：WebGL2 靠 `EXT_debug_marker`，扩展不可用时是空操作（见 utils/debugMarkers.ts）。 */
  pushDebugGroup(e) {
    Da(this.gl, e);
  }
  popDebugGroup() {
    ka(this.gl);
  }
  insertDebugMarker(e) {
    Va(this.gl, e);
  }
  /**
   * 结束记账并返回 command buffer。
   *
   * 不需要（也没有）从设备追踪集合里摘自己：本类从不被登记（见类注释），
   * 与 WebGPU 后端在 `finish()` 里 `untrack()` 的处理对应的是同一个生命周期终点 ——
   * finish 之后本对象的其它方法都会经 `assertOpen()` 抛错。
   *
   * `#12`：还有 pass 开着时**隐式结束**它（与 WebGPU 后端、以及原生
   * `GPUCommandEncoder.finish()` 一致），不再抛错。理由与风险见 {@link beginRenderPass}。
   */
  finish() {
    return this.assertOpen("finish"), this.closeOpenPass(), this.finished = !0, {
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
  /**
   * 隐式结束当前打开的渲染通道（`#12`，与 WebGPU 后端的 `closeOpenPass()` 同形）。
   *
   * 幂等：没有打开的通道、或它已经 `end()` 过，都是空操作。
   */
  closeOpenPass() {
    this.openPass && !this.openPass.ended && this.openPass.end(), this.openPass = null;
  }
  /** 取（必要时分配）零拷贝上传路径的兜底暂存区。 */
  uploadScratch() {
    return this.scratch ??= new ArrayBuffer(Xf), this.scratch;
  }
}
function Ot(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function Na(t, e) {
  return e.target === t.TEXTURE_3D || e.target === t.TEXTURE_2D_ARRAY;
}
function Qt(t, e, r) {
  const n = r ?? "all";
  if (n === "all") return;
  const i = F(e.format);
  if (!i.depth && !i.stencil)
    throw new u(
      `[gpu-device-api] ${t}: aspect "${n}" was requested for the non-depth format "${e.format}" (texture "${e.label}"). Use aspect "all" (or omit it).`
    );
  if (n === "stencil-only")
    throw new u(
      `[gpu-device-api] ${t}: aspect "stencil-only" is not supported by the WebGL2 backend. WebGL2 cannot address the stencil aspect on its own — the stencil is only reachable through the combined DEPTH_STENCIL attachment, and readPixels cannot read it at all. Workaround: write the stencil mask into a colour attachment in a shader and copy that.`
    );
}
function Ei(t, e, r) {
  if (e !== 0)
    throw new u(
      `[gpu-device-api] copyTextureToTexture: mipLevel=${e}（纹理「${t.label}」）无法表达 —— WebGL2 的 blitFramebuffer 只能搬纹理的基级。请为需要拷贝的 mip 级单独创建一张纹理，或改用「逐级 copyTextureToBuffer + copyBufferToTexture」。`
    );
}
function Ut(t, e, r, n, i, s) {
  if (Na(t, r)) {
    if (i !== 0)
      throw new u(
        `[gpu-device-api] copyTextureToTexture: framebufferTextureLayer 不接受非 0 的 mip 级（纹理「${r.label}」请求了 mipLevel=${i}）。`
      );
    t.framebufferTextureLayer(e, n, r.native, 0, s);
    return;
  }
  if (s !== 0)
    throw new u(
      `[gpu-device-api] copyTextureToTexture: 纹理「${r.label}」是单层 2D 纹理，无法寻址第 ${s} 层。`
    );
  t.framebufferTexture2D(e, n, t.TEXTURE_2D, r.native, i);
}
function Zf(t, e, r) {
  Qt("copyTextureToBuffer", t, e);
  const n = F(t.format);
  if (!(!n.depth && !n.stencil))
    throw new u(
      `[gpu-device-api] copyTextureToBuffer: the WebGL2 backend cannot read depth texture "${t.label}" (format "${t.format}") back into a buffer. WebGL2's readPixels has no legal depth format/type combination — the implementation-defined read format for a depth attachment (DEPTH_COMPONENT/UNSIGNED_INT) is never one of the accepted pairs (RGBA/UNSIGNED_BYTE, RGBA/FLOAT, RED/FLOAT), and WEBGL_depth_texture does not exist in WebGL2. Measured on ANGLE/SwiftShader: all 4 depth formats x 5 format/type combinations return 0x500 INVALID_ENUM, and the destination buffer stays all zeros. Workaround: write the depth into a colour attachment (output gl_FragCoord.z or a linearised depth in the fragment shader) and copy that colour texture instead.${n.stencil && (e ?? "all") === "all" ? ' Note: WebGPU treats aspect "all" on a depth-stencil format as depth-only, so this call would have returned the depth samples — never the stencil ones.' : ""}`
    );
}
function Kf(t, e, r, n, i, s) {
  t.forgetReadbackTexture();
  const a = t.readbackFramebuffer();
  if (e.bindFramebuffer(e.FRAMEBUFFER, a), t.noteFramebufferBinding(a), r.target === e.TEXTURE_3D || r.target === e.TEXTURE_2D_ARRAY) {
    if (i !== 0)
      throw new u(
        `[gpu-device-api] WebGL2 的 framebufferTextureLayer 不接受非 0 的 mip 级（纹理「${r.label}」请求了 mipLevel=${i}）。请为需要读回的 mip 级单独创建一张纹理。`
      );
    e.framebufferTextureLayer(e.FRAMEBUFFER, n, r.native, 0, s);
    return;
  }
  if (s !== 0)
    throw new u(
      `[gpu-device-api] copyTextureToBuffer: 纹理「${r.label}」只有一层，但 origin.z=${s} 指向了第 ${s} 层。`
    );
  e.framebufferTexture2D(e.FRAMEBUFFER, n, e.TEXTURE_2D, r.native, i);
}
const rn = 4096, Ai = new Uint8Array(rn);
function* Jf(t) {
  if (t <= 0)
    return;
  let e = t;
  for (; e > 0; ) {
    const r = Math.min(e, rn);
    yield r === rn ? Ai : Ai.subarray(0, r), e -= r;
  }
}
const Pi = /* @__PURE__ */ new WeakMap();
function em(t) {
  let e = Pi.get(t);
  return e === void 0 && (e = U("tex"), Pi.set(t, e)), e;
}
function Li(t) {
  const e = t.view, r = e.texture, n = e.descriptor;
  return `${em(r)}#${e.target}@${n.baseMipLevel}:${n.baseArrayLayer}`;
}
function tm(t) {
  let e = "";
  const r = t.colorAttachments;
  for (let i = 0; i < r.length; i += 1) {
    const s = r[i];
    e = `${e}|${s ? Li(s) : "-"}`;
  }
  const n = t.depthStencilAttachment;
  return n ? `${e}|d${Li(n)}` : `${e}|-`;
}
class rm {
  gl;
  framebuffers;
  /** 每个条目引用了哪些纹理，用于 `releaseTexture()` 的精准淘汰。 */
  references = /* @__PURE__ */ new Map();
  /**
   * `MAX_DRAW_BUFFERS` 的惰性查询结果。
   *
   * `drawBuffers` 的参数个数不能超过它（GLES 3.0 的下限是 4），而本层现在按**逐位置**下发，
   * 所以附件槽数一旦超限就是「必然无效」的组合 —— 明确报错好过让 GL 报 `INVALID_VALUE`。
   * 查询一次就记住（与 `GlStateCache.uniformBufferOffsetAlignment()` 同样的做法）。
   */
  maxDrawBuffersValue = null;
  constructor(e, r = {}) {
    this.gl = e, this.framebuffers = ln(r.limit ?? 64, (n, i) => {
      this.references.delete(i), e.deleteFramebuffer(n);
    });
  }
  get size() {
    return this.framebuffers.size;
  }
  /**
   * `MAX_DRAW_BUFFERS`：查询失败时退回 GLES 3.0 的下限 4。
   *
   * 退回而不是「放行」：一个实现没有暴露这个常量时，4 是**规范保证**的最小可用值，
   * 用 4 做上限不会误拒合法输入（超过 4 的组合在那种实现上本来就不保证成立）。
   */
  maxDrawBuffers() {
    const e = this.maxDrawBuffersValue;
    if (e !== null) return e;
    const r = Number(this.gl.getParameter(this.gl.MAX_DRAW_BUFFERS)), n = Number.isFinite(r) && r > 0 ? r : 4;
    return this.maxDrawBuffersValue = n, n;
  }
  /** 取得（必要时创建）与这组附件匹配的 framebuffer。 */
  acquire(e) {
    const r = tm(e), n = this.framebuffers.get(r);
    if (n) return n;
    const i = e.colorAttachments.length, s = this.maxDrawBuffers();
    if (i > s)
      throw new u(
        `[gpu-device-api] 这次渲染通道有 ${i} 个颜色附件槽位（含 null 空位），超过了本设备的 MAX_DRAW_BUFFERS（${s}）。WebGL2 的 drawBuffers 下标就是片元 output location，空位也必须占一项，所以超限的组合无法表达。请减少颜色附件数量。`
      );
    const a = this.gl, o = a.createFramebuffer();
    if (!o)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。");
    const l = a.getParameter(a.FRAMEBUFFER_BINDING);
    a.bindFramebuffer(a.FRAMEBUFFER, o);
    const c = [], h = [];
    for (let f = 0; f < i; f += 1) {
      const m = e.colorAttachments[f];
      if (!m) {
        h.push(a.NONE);
        continue;
      }
      const g = m.view, b = g.target;
      c.push(g.texture), b === a.TEXTURE_2D ? a.framebufferTexture2D(
        a.FRAMEBUFFER,
        a.COLOR_ATTACHMENT0 + f,
        b,
        g.glTexture,
        g.descriptor.baseMipLevel
      ) : a.framebufferTextureLayer(
        a.FRAMEBUFFER,
        a.COLOR_ATTACHMENT0 + f,
        g.glTexture,
        g.descriptor.baseMipLevel,
        g.descriptor.baseArrayLayer
      ), h.push(a.COLOR_ATTACHMENT0 + f);
    }
    h.length > 0 && a.drawBuffers(h);
    const d = e.depthStencilAttachment;
    if (d) {
      const f = d.view, g = F(f.texture.format).stencil ? a.DEPTH_STENCIL_ATTACHMENT : a.DEPTH_ATTACHMENT;
      c.push(f.texture), a.framebufferTexture2D(
        a.FRAMEBUFFER,
        g,
        a.TEXTURE_2D,
        f.glTexture,
        f.descriptor.baseMipLevel
      );
    }
    a.bindFramebuffer(a.FRAMEBUFFER, l), a.bindFramebuffer(a.FRAMEBUFFER, o);
    const p = a.checkFramebufferStatus(a.FRAMEBUFFER);
    if (a.bindFramebuffer(a.FRAMEBUFFER, l), p !== a.FRAMEBUFFER_COMPLETE)
      throw a.deleteFramebuffer(o), new u(
        `[gpu-device-api] 这组渲染附件在 WebGL2 下不构成完整的 framebuffer（GL 状态码 0x${p.toString(16)}）。
常见原因：颜色附件格式不可渲染、多个附件的尺寸/采样数不一致、深度附件与颜色附件不匹配。`
      );
    return this.framebuffers.set(r, o), this.references.set(r, c), o;
  }
  /**
   * 淘汰**引用了这张纹理**的条目（纹理销毁时调用）。
   *
   * 为什么不是整体 `clear()`：那会把与该纹理无关的附件组合也打回重建 —— 一张临时纹理的生死
   * 就能让整帧的 framebuffer 全部重建（抖动）。键里含纹理身份，所以只有真正引用它的条目会被摘掉。
   *
   * 被摘掉的条目对应的 framebuffer 会被 `deleteFramebuffer`：它引用的纹理已经删了，留着只会让
   * framebuffer 不完整（见类注释里「淘汰正在使用的条目」的安全性说明）。
   */
  releaseTexture(e) {
    const r = [];
    for (const [n, i] of this.references)
      i.includes(e) && r.push(n);
    for (const n of r) {
      const i = this.framebuffers.get(n);
      this.framebuffers.delete(n), this.references.delete(n), i && this.gl.deleteFramebuffer(i);
    }
  }
  clear() {
    const e = this.framebuffers.values();
    this.framebuffers.clear(), this.references.clear();
    for (const r of e) this.gl.deleteFramebuffer(r);
  }
  dispose() {
    this.clear();
  }
}
const nm = 64 * 1024;
class im {
  label = U("queue");
  gl;
  state;
  submittedCount = 0;
  pending = Promise.resolve();
  /**
   * 零拷贝路径的兜底暂存区（惰性分配）。
   *
   * 只在「传给 `writeTexture` 的视图起点不在元素边界上」时才需要搬一次内存
   * （例如 `Uint8Array` 的 `subarray(2, ...)` 交给 `rgba32float`）。正常情况下
   * `ArrayBufferView` → `TypedArray` 是零拷贝重解释，这块内存直到用上之前都不分配。
   */
  scratch = null;
  constructor(e, r) {
    this.gl = e, this.state = r;
  }
  /** 已提交的 command buffer 数量（用于测试与统计）。 */
  get submitted() {
    return this.submittedCount;
  }
  /**
   * 把主机端数据写进 buffer。
   *
   * ## `#15`：元素对齐校验与 WebGPU 对齐（改前 WebGL2 没有）
   *
   * core 的契约里 `dataOffset` / `size` 是**字节**，而 WebGPU 原生接口在 `data` 是 TypedArray 时
   * 按**元素**计，所以 `WebGPUQueue` 必须要求两者都是元素大小的倍数（否则换算出来的元素数
   * 不是整数，原生实现会直接抛）。改前 WebGL2 不检查这一条：`new Uint8Array(data.buffer,
   * byteOffset + 2)` 这种「起点落在元素中间」的视图照样能上传 —— 于是**同一段代码在 WebGL2 上
   * 通、在 WebGPU 上抛**，而在 WebGL2 上拿到的是一份半错位的重解释数据。
   *
   * 现在这里先做与 `WebGPUQueue.writeBuffer` **逐字相同**的检查（注意：报告的是**字节**数，
   * 因为 core 契约里这两个参数就是字节），再走本后端的补齐上传。
   */
  writeBuffer(e, r, n, i = 0, s) {
    const a = e, o = s ?? n.byteLength - i;
    if (r + o > a.size)
      throw new u(
        `[gpu-device-api] writeBuffer 越界：写入范围 [${r}, ${r + o}) 超出了 buffer「${a.label}」的 ${a.size} 字节。`
      );
    if (r % 4 !== 0)
      throw new u(
        `[gpu-device-api] Queue.writeBuffer: bufferOffset (${r}) must be a multiple of 4.`
      );
    const l = fl(n);
    if (i % l !== 0 || o % l !== 0)
      throw new u(
        `[gpu-device-api] Queue.writeBuffer: dataOffset (${i}) and size (${o}) are measured in bytes, so both must be multiples of the element size (${l}) of the given ${n.constructor.name}.`
      );
    const c = new Uint8Array(n.buffer, n.byteOffset + i, o);
    a.upload(r, dl(c));
  }
  writeTexture(e, r, n, i) {
    const s = e.texture, a = F(s.format);
    kd(s.format, r), sm(e, s);
    const o = _i(e.origin), l = this.gl, c = n.offset ?? 0, h = tn(
      n,
      i,
      a,
      "writeTexture",
      s.format,
      s.label,
      Math.max(0, r.byteLength - c)
    ), d = new Uint8Array(r.buffer, r.byteOffset + c, r.byteLength - c);
    Ia(
      l,
      s.target,
      s.native,
      e.mipLevel ?? 0,
      o,
      i,
      a,
      s.format,
      d,
      h,
      () => this.uploadScratch()
    ), this.state.invalidateTextureUnits();
  }
  copyExternalImageToTexture(e, r, n, i = !1, s) {
    const a = r.texture, o = F(a.format), l = this.gl, c = _i(r.origin), h = s?.colorSpace ?? "srgb";
    if (h !== "srgb")
      throw new u(
        `[gpu-device-api] Queue.copyExternalImageToTexture: colorSpace "${h}" is not supported by the WebGL2 backend (texture "${a.label}"). GL has no per-copy color space conversion: UNPACK_COLORSPACE_CONVERSION_WEBGL can only turn the browser default conversion on or off, and the destination encoding is decided by the texture internal format (the "-srgb" suffix), not by this option. Convert the source into sRGB beforehand (draw it into an OffscreenCanvas and use that), or use an "-srgb" texture format, or omit the option (the default is "srgb").`
      );
    l.bindTexture(a.target, a.native), l.pixelStorei(l.UNPACK_ALIGNMENT, 1), l.pixelStorei(l.UNPACK_FLIP_Y_WEBGL, i ? 1 : 0);
    const d = s?.premultipliedAlpha ?? !0;
    l.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL, d ? 1 : 0);
    try {
      a.target === l.TEXTURE_3D || a.target === l.TEXTURE_2D_ARRAY ? l.texSubImage3D(
        a.target,
        r.mipLevel ?? 0,
        c.x,
        c.y,
        c.z,
        n.width,
        n.height,
        n.depthOrArrayLayers,
        o.format,
        o.type,
        e
      ) : l.texSubImage2D(
        a.target,
        r.mipLevel ?? 0,
        c.x,
        c.y,
        n.width,
        n.height,
        o.format,
        o.type,
        e
      );
    } finally {
      l.pixelStorei(l.UNPACK_FLIP_Y_WEBGL, 0), l.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0), l.pixelStorei(l.UNPACK_ALIGNMENT, 4);
    }
    this.state.invalidateTextureUnits();
  }
  copyBufferToBuffer(e, r, n, i, s) {
    const a = this.gl, o = e, l = n, c = new Uint8Array(s);
    if (o.isIndexBuffer || l.isIndexBuffer) {
      o.download(r, c), l.upload(i, c);
      return;
    }
    this.state.bindCopyReadBuffer(o.native), a.getBufferSubData(a.COPY_READ_BUFFER, r, c), this.state.bindCopyWriteBuffer(l.native), a.bufferSubData(a.COPY_WRITE_BUFFER, i, c);
  }
  /**
   * `copyBufferToTexture`：先按**完整布局**（含 `rowsPerImage`）把源 buffer 读出来，
   * 再交给 {@link writeTexture} 上传。
   *
   * 为什么读这么多：`texSubImage3D` 一次要吃下整叠 image，层与层之间有 `rowsPerImage`
   * 这么大的间隔 —— 「每层各读一次、各上传一次」也可以，但那样每次 `texSubImage3D` 都得
   * 带上 `UNPACK_SKIP_IMAGES` 之类的状态，比一次读完更容易出错，而且 GPU 侧调用次数翻倍。
   */
  copyBufferToTexture(e, r, n) {
    const i = r.texture, s = F(i.format), a = e.buffer, o = e.offset ?? 0, l = tn(
      e,
      n,
      s,
      "copyBufferToTexture",
      i.format,
      i.label
    );
    if (o + l.requiredBytes > a.size)
      throw new u(
        `[gpu-device-api] copyBufferToTexture: the source range [${o}, ${o + l.requiredBytes}) exceeds buffer「${a.label}」's ${a.size} bytes (${n.width}x${n.height}x${n.depthOrArrayLayers}, bytesPerRow=${l.bytesPerRow}, rowsPerImage=${l.rowsPerImage}).`
      );
    const c = new Uint8Array(l.requiredBytes);
    a.download(o, c), this.writeTexture(r, c, { offset: 0, bytesPerRow: l.bytesPerRow, rowsPerImage: l.rowsPerImage }, n);
  }
  submit(e) {
    this.submittedCount += e.length, e.length > 0 && this.gl.flush();
  }
  async onSubmittedWorkDone() {
    await this.pending, this.gl.finish();
  }
  /**
   * 取（必要时分配）零拷贝路径的兜底暂存区。
   *
   * 惰性分配的理由：绝大多数上传的视图起点本来就是元素对齐的（`new Uint8Array(...)`、
   * `TypedArray` 的 `subarray` 也只按元素切），那条路径完全不需要这块内存。
   */
  uploadScratch() {
    return this.scratch ??= new ArrayBuffer(nm), this.scratch;
  }
}
function _i(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function sm(t, e) {
  const r = t.aspect ?? "all";
  if (r !== "all")
    throw new u(
      `[gpu-device-api] writeTexture: destination.aspect "${r}" is not supported by the WebGL2 backend (texture "${e.label}", format "${e.format}"). GL's texSubImage* entry points write whole texels, and a depth-stencil texture has a single combined attachment — there is no way to address one aspect on its own. Omit the aspect (or pass "all"), or keep depth and stencil in separate textures.`
    );
}
class am {
  label = U("fence");
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
        await om();
      }
    }
  }
}
function om() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
const lm = 1e4;
class cm {
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
    this.gl = e.gl, this.querySet = e.querySet, this.type = e.type, this.first = e.first, this.count = e.count, this.timeoutMs = e.timeoutMs ?? lm, this.yieldToEventLoop = e.yieldToEventLoop ?? (() => new Promise((r) => setTimeout(r, 0)));
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
    const r = new BigUint64Array(this.count);
    for (let n = 0; n < this.count; n++) {
      const i = this.querySet.queryAt(this.first + n, "QueryResult.read");
      await this.waitUntilAvailable(i, this.first + n), this.assertNotDisjoint(this.first + n);
      const s = e.getQueryParameter(i, e.QUERY_RESULT);
      r[n] = BigInt(Math.round(s ?? 0));
    }
    return r;
  }
  /** 轮询 `QUERY_RESULT_AVAILABLE`，每次询问之间让出一拍。 */
  async waitUntilAvailable(e, r) {
    const n = this.gl, i = Date.now() + this.timeoutMs;
    for (; ; ) {
      if (n.getQueryParameter(e, n.QUERY_RESULT_AVAILABLE) === !0) return;
      if (this.querySet.disposed)
        throw new te(
          `[gpu-device-api] QueryResult.read(): query set "${this.querySet.label}" was destroyed while waiting for query ${r}. The result of that frame is simply dropped.`,
          { code: "QUERY_DISCARDED" }
        );
      if (Date.now() >= i)
        throw new te(
          `[gpu-device-api] QueryResult.read(): query ${r} of "${this.querySet.label}" was still not available after ${this.timeoutMs} ms. The GL query is asynchronous; read it a few frames after the pass that wrote it (gfx GPU timing waits \`delay\` frames for exactly this reason).`,
          { code: "QUERY_TIMEOUT" }
        );
      await this.yieldToEventLoop();
    }
  }
  assertNotDisjoint(e) {
    const r = this.querySet.timerExtension;
    if (!r) return;
    if (this.gl.getParameter(r.GPU_DISJOINT_EXT) === !0)
      throw new te(
        `[gpu-device-api] QueryResult.read(): GPU_DISJOINT_EXT is set, so the timer results of "${this.querySet.label}" (query ${e}) are undefined. A disjoint happens when the GPU is reset or preempted between the begin/end of the query; discard this sample instead of using it.`,
        { code: "QUERY_DISJOINT" }
      );
  }
}
class um {
  label;
  backend = "webgl2";
  features;
  limits;
  queue;
  debug;
  native;
  /**
   * GPU 计时能力的真实探测结果（见 {@link DeviceTimingSupport}）。
   *
   * WebGL2 只有一条路：pass 级区间计时（`gl.beginQuery(TIME_ELAPSED_EXT)` → `endQuery`），
   * 而它依赖 `EXT_disjoint_timer_query_webgl2` 扩展 —— 这里在创建设备时**真的去问一次**
   * `gl.getExtension()`，而不是相信 adapter 阶段记下来的 feature 名。
   */
  timing;
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
  /**
   * `#20` 已压入、尚未弹出的错误作用域（栈顶即最内层）。
   *
   * ## 为什么默认完全零开销
   *
   * 只有这个数组非空时，{@link WebGL2Device.drainGlErrors} 才会把读到的错误往作用域里记账。
   * 不调用 `pushErrorScope` 的代码路径上，唯一的额外工作是一次 `length === 0` 判断 ——
   * 既不多一次 `gl.getError()`，也不改变既有 debug 轮询的读取次数。
   */
  scopeStack = [];
  /** `gl.getError()` 真正被调用的次数（诊断与测试用：用来证明「默认零开销」与「只有一个消费者」）。 */
  glErrorReads = 0;
  /** 上下文恢复事件的订阅者；与 `errorCallbacks` 一样在 `dispose()` 时清空。 */
  contextRestoredCallbacks = /* @__PURE__ */ new Set();
  canvasContexts = /* @__PURE__ */ new Map();
  lostResolve;
  lostPromise;
  /**
   * 设备丢失信息；未丢失（或只是 `dispose()`）时为 null。
   *
   * WebGL2 的「设备丢失」就是 GL context 丢失：`webglcontextlost` 一旦触发，
   * 本设备创建过的**每一个** GL 对象都已经失效，而且我们没有任何办法把它们重建
   * （包装对象里只有已经作废的句柄，没有可重放的 descriptor）—— 所以这里如实记录，
   * 让后续所有操作明确报错，而不是在失效句柄上静默地画不出东西。
   */
  lostInfoValue = null;
  /** `webglcontextrestored` 触发的次数（诊断与测试用）。 */
  contextRestoreCount = 0;
  /** 安装监听器的目标（canvas 或 OffscreenCanvas）；不支持事件时保持 null。 */
  eventTarget;
  handleContextLost;
  handleContextRestored;
  _disposed = !1;
  constructor(e) {
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? rt("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? U("webgl2Device"), this.limits = Ms(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const r = [...e.adapterFeatures], n = new Set(r), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !n.has(a));
    if (i.length > 0)
      throw new u(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${r.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => n.has(a),
      names: r
    }, this.timing = pm(e.gl), this.state = new kp(e.gl), this.planCache = new wf({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new Rn({ gl: e.gl, state: this.state }), this.framebuffers = new rm(e.gl), this.queue = new im(e.gl, this.state), this.lostPromise = new Promise((a) => {
      this.lostResolve = a;
    });
    const s = e.canvas;
    this.eventTarget = typeof s.addEventListener == "function" && typeof s.removeEventListener == "function" ? e.canvas : null, this.eventTarget ? (this.handleContextLost = (a) => {
      a.preventDefault(), this.handleContextLostEvent();
    }, this.handleContextRestored = () => this.handleContextRestoredEvent(), this.eventTarget.addEventListener("webglcontextlost", this.handleContextLost), this.eventTarget.addEventListener("webglcontextrestored", this.handleContextRestored)) : (this.handleContextLost = null, this.handleContextRestored = null, this.logger.debug("canvas 上没有 addEventListener，跳过 webglcontextlost/restored 监听。"));
  }
  get disposed() {
    return this._disposed;
  }
  get lost() {
    return this.lostPromise;
  }
  /**
   * 设备是否仍然可用：没有 `dispose()`，也没有丢失过 GL context。
   *
   * 注意「上下文恢复」**不会**把这里变回 true：restored 只说明这个 canvas 又能取到可用的
   * GL context，本设备已经创建过的资源全部失效且无法重建（见 {@link lostInfo}）。
   */
  get usable() {
    return !this._disposed && this.lostInfoValue === null;
  }
  /** 设备丢失信息；未丢失时为 null。与 `lost` promise 表达同一件事，但可以直接查询。 */
  get lostInfo() {
    return this.lostInfoValue;
  }
  /** 当前仍在追踪中的资源数量；仅供诊断与测试（core 的 `Device` 接口没有这个成员）。 */
  get trackedResourceCount() {
    return this.resources.size;
  }
  /** `webglcontextrestored` 已触发的次数；恢复只影响 canvas，不影响本设备持有的资源。 */
  get contextRestoredCount() {
    return this.contextRestoreCount;
  }
  /**
   * 订阅「GL context 被浏览器恢复」事件，返回取消订阅函数。
   *
   * 为什么需要它：`webglcontextlost` 会让 `device.lost` resolve（一次性的），而 restored 可能
   * 在其后任意时刻发生。恢复后 canvas 与 GL context 本身又能用了，但**本设备创建过的资源
   * 全部失效**（GL 对象随上下文一起消失，我们没有 descriptor 可以重建它们）。
   * 因此收到这个回调后应当：`device.dispose()` → 重新 `createDevice()` → 重建全部资源。
   */
  onContextRestored(e) {
    return this.contextRestoredCallbacks.add(e), () => {
      this.contextRestoredCallbacks.delete(e);
    };
  }
  /** 让 GL 状态缓存失效；外部通过 escape hatch 改动状态后必须调用。 */
  invalidateState() {
    this.state.invalidate();
  }
  /* ------------------------------------------------------------------ 资源 ------------------- */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(
      new Xp(this.gl, this.state, e, (r) => {
        this.untrack(r);
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new ti(this.gl, this.state, e, (r) => {
        this.framebuffers.releaseTexture(r), this.untrack(r);
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, r, n, i, s) {
    const a = new ti(
      this.gl,
      this.state,
      { format: e, size: { width: r, height: n }, usage: i, label: s },
      (o) => {
        this.framebuffers.releaseTexture(o), this.untrack(o);
      }
    );
    return this.track(a);
  }
  createSampler(e = {}) {
    this.assertUsable("createSampler");
    const r = new pf(
      this.gl,
      this.state,
      e,
      (n) => this.untrack(n)
    );
    return this.track(r);
  }
  createShaderModule(e) {
    this.assertUsable("createShaderModule");
    const r = new df(e, () => this.untrack(r));
    return this.track(r);
  }
  /**
   * 创建 query set。
   *
   * - occlusion：`ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，直接用；
   * - timestamp：需要 `EXT_disjoint_timer_query_webgl2`，扩展缺失时抛带 `[gpu-device-api] ` 前缀的
   *   英文错误说明缺哪个扩展（而不是静默返回 0）。
   */
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new Ga(this.gl, e, (r) => this.untrack(r)));
  }
  /**
   * `#22`：WebGL2 后端**做不到**导入外部纹理，这里明确报错并给出替代方案。
   *
   * 为什么做不到：GL 里没有「外部纹理」这个概念。`OES_EGL_image_external` 是
   * EGL / GLES 的扩展（把 EGLImage 包成 `GL_TEXTURE_EXTERNAL_OES`），浏览器端的
   * `WebGL2RenderingContext` **不暴露**它 —— 本机无头 Chrome + SwiftShader 实测：
   * `gl.importExternalTexture` 是 `undefined`，`OES_EGL_image_external` /
   * `OES_EGL_image_external_essl3` / `WEBGL_external_texture` 三个扩展名全部拿不到
   * （探针页 `.tmp-02/probe/api-surface.html?backend=webgl2`）。
   *
   * 也**不**退化成「把当前帧拷进一张普通纹理」：那个替代方案在语义上不等价
   * （每帧多一次全量上传、拿不到原生的平面/色彩空间处理，而且句柄不能跨帧复用），
   * 偷偷替调用方换实现正是本库明确拒绝的做法。想这么做的调用方可以自己调
   * `queue.copyExternalImageToTexture()`（两个后端都支持），差别是显式的。
   */
  importExternalTexture(e) {
    throw this.assertUsable("importExternalTexture"), e === void 0 || e.source === void 0 || e.source === null ? new u(
      '[gpu-device-api] Device.importExternalTexture: "source" is required (an HTMLVideoElement, VideoFrame or ImageBitmap).'
    ) : new u(
      "[gpu-device-api] Device.importExternalTexture is not supported by the WebGL2 backend: GL has no external-texture concept, and the extensions that could express it (OES_EGL_image_external / OES_EGL_image_external_essl3 / WEBGL_external_texture) are not exposed by WebGL2RenderingContext. Upload the frame into a regular texture instead (Queue.copyExternalImageToTexture, supported by both backends) and sample that; it costs one upload per frame but behaves identically on both backends."
    );
  }
  /**
   * 读回 query set 的结果：轮询 `QUERY_RESULT_AVAILABLE` 后逐条 `getQueryParameter`。
   *
   * 轮询本身是异步的（每轮让出一拍），不会像 `gl.finish()` 那样强制同步 GPU；
   * 但结果只有在 GPU 真正做完之后才可用，所以调用方应该**延迟若干帧**再读
   * （gfx 的 GPU 计时就是这么做的）。
   */
  readQuerySet(e, r = {}) {
    this.assertUsable("readQuerySet");
    const n = Jr(e, `Device "${this.label}".readQuerySet(querySet)`), i = r.firstQuery ?? 0;
    if (!Number.isInteger(i) || i < 0)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: firstQuery must be a non-negative integer, got ${String(i)}.`
      );
    const s = r.queryCount ?? n.count - i;
    if (!Number.isInteger(s) || s <= 0)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ${String(s)}.`
      );
    if (i + s > n.count)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: range [${i}, ${i + s}) exceeds the query set "${n.label}" count ${n.count}.`
      );
    return new cm({
      gl: this.gl,
      querySet: n,
      type: n.type,
      first: i,
      count: s
    });
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    this.assertUsable("createBindGroupLayout");
    const r = new li(e, () => this.untrack(r));
    return this.track(r);
  }
  createBindGroup(e) {
    this.assertUsable("createBindGroup");
    const r = new mf(e, () => this.untrack(r));
    return this.track(r);
  }
  createPipelineLayout(e) {
    this.assertUsable("createPipelineLayout");
    const r = new _r(e, !1, this, () => this.untrack(r));
    return this.track(r);
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const r = e.label ?? "renderPipeline", n = bt({
      backend: "webgl2",
      source: e.vertex.module.source,
      stage: C.Vertex,
      label: r,
      defines: e.vertex.module.defines,
      glsl: e.vertex.module.glsl
    }).code;
    if (!e.fragment)
      throw new u(
        "[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n只写深度时，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    const i = bt({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: C.Fragment,
      label: r,
      defines: e.fragment.module.defines,
      glsl: e.fragment.module.glsl
    }).code, s = this.programs.acquire(r, n, i);
    let a;
    const o = [];
    if (e.layout === void 0 || e.layout === "auto") {
      const c = Mp(s.reflection, C.Vertex | C.Fragment);
      if (c.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const h = new li(
          {
            label: `${r}:autoLayout`,
            entries: c
          },
          () => this.untrack(h)
        );
        this.track(h);
        const d = new _r(
          { label: `${r}:autoPipelineLayout`, bindGroupLayouts: [h] },
          !0,
          this,
          () => this.untrack(d)
        );
        a = this.track(d), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else {
      const c = _s(
        e.layout,
        (h) => {
          const d = new _r(
            { label: `${r}:inlinePipelineLayout`, bindGroupLayouts: h },
            !1,
            this,
            () => this.untrack(d)
          );
          return this.track(d);
        },
        `WebGL2Device.createRenderPipeline("${r}").layout`
      );
      a = c.layout, this.programs.bindPlan(s, a.bindingPlan), c.synthesized && o.push(c.synthesized);
    }
    const l = new Pf(e, s, a, {
      gl: this.gl,
      state: this.state,
      limits: {
        maxVertexAttributes: this.limits.maxVertexAttributes,
        maxVertexBufferArrayStride: this.limits.maxVertexBufferArrayStride
      },
      onDispose: (c) => {
        this.untrack(c);
        for (const h of o) h.dispose();
        o.length = 0;
      }
    });
    return this.track(l);
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), new Mf(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    this.assertUsable("createRenderTarget");
    const r = new Ff(e, {
      gl: this.gl,
      state: this.state,
      createTexture: (n, i, s, a, o) => this.createAttachmentTexture(n, i, s, a, o),
      onDispose: (n) => this.untrack(n)
    });
    return this.track(r);
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new Hf(e, this.gl, this.state, {
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
      throw new u(
        `[gpu-device-api] WebGL2 的 device 只能服务创建它的那个 canvas。
GL context 是从 canvas 上取的，一个 device 对应一个 canvas；如果确实需要渲染到多个 canvas，请为每个 canvas 单独 createDevice()。`
      );
    let n = this.canvasContexts.get(e);
    return n || (n = new zf({ gl: this.gl, canvas: e, format: r?.format }), this.canvasContexts.set(e, n)), n.configure({ ...r, device: this }), this.state.invalidate(), n;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new am(this.gl);
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
  /**
   * `#20` 压入错误作用域：WebGL2 **没有**这个概念，这里给出等价物。
   *
   * ## 与 WebGPU 侧的语义差异（先说清楚，不假装一样）
   *
   * - 作用域只覆盖「`getError()` 读到的错误」，而 GL 的错误是**异步**产生的：
   *   一次 `gl.getError()` 可能读到上一次无关调用留下的错误。所以这里回答的是
   *   「这段时间内出现过某类错误」，**不是**「就是那一行错了」；
   * - `filter` 无法真正筛选类型（GL 错误码分不出 validation / out-of-memory / internal），
   *   它只决定「这条错误留在这一层，还是穿透给外层作用域」；
   * - 每个作用域内 GL 只保留**一条**错误状态，所以 `errors` 的长度是下界而不是精确计数。
   *
   * 详见 `WebGL2ErrorScope` 与 `glErrorScope.ts` 的文件头。
   *
   * ## push 时先排空
   *
   * 入栈前把 GL 队列里**已有的**错误排掉（走既有的 `onError` 通道），否则上一段代码留下的
   * 错误会被算进新作用域，作用域就变成「永远有错」。这一步同时也是「不消费掉别人错误」的
   * 前提：排空走的是同一个消费者。
   */
  pushErrorScope(e) {
    this.assertUsable("pushErrorScope"), ys(e, `Device "${this.label}".pushErrorScope(filter)`), (this.debug || this.scopeStack.length > 0) && this.drainGlErrors("pushErrorScope");
    const r = new jp(
      e,
      `webgl2ErrorScope#${U("scope")}`,
      (n) => this.settleScope(n)
    );
    return this.scopeStack.push(r), this.logger.debug(`pushErrorScope("${e}")：栈深 ${this.scopeStack.length}`), r;
  }
  /**
   * `#20` 弹出错误作用域：同步排空 GL 错误队列，再按 filter 决定错误留在哪一层。
   *
   * 栈为空时**拒绝**（而不是 resolve 成 `null`）——「没有作用域」与「作用域里没有错误」
   * 是两件必须区分的事，后者才是 `null`。
   *
   * 出栈动作放在 {@link WebGL2Device.settleScope} 里，且**必须**在排空之后 —— 这一层要
   * 留在栈顶才能接收「最后一次 `checkGlError` 到 `pop` 之间」产生的错误。
   */
  popErrorScope() {
    const e = this.scopeStack[this.scopeStack.length - 1];
    return e ? e.pop() : Promise.reject(
      new u(
        `[gpu-device-api] Device "${this.label}".popErrorScope: there is no error scope on the stack (every popErrorScope() must be paired with a preceding pushErrorScope()).`
      )
    );
  }
  /** 当前仍在栈上的错误作用域层数（诊断与测试用）。 */
  get scopeDepth() {
    return this.scopeStack.length;
  }
  /**
   * `gl.getError()` 被调用的总次数。
   *
   * 暴露它是为了能**断言**「默认零开销」与「只有一个消费者」这两条契约：
   * 不 push 作用域时不比改动前多读一次；push 之后 debug 轮询不会再多读一遍（那正是
   * 「两个消费者互相抢错误」的形态）。
   */
  get glErrorReadCount() {
    return this.glErrorReads;
  }
  /**
   * GL 错误**唯一**的读取入口。`#20` 之后所有 `gl.getError()` 调用都必须走这里。
   *
   * ## 为什么必须收敛成一个消费者
   *
   * GL 的错误是「读一次消费一条」的状态位。改动前有两个潜在消费者：
   * debug 模式下的轮询（{@link WebGL2Device.checkGlError}）与（本批新增的）错误作用域。
   * 如果各自直接调 `gl.getError()`，先跑的那个会把错误读走，后跑的那个读到 `NO_ERROR` ——
   * 于是**作用域会误报「无错」**（或 debug 轮询漏报），而两边都不会有任何异常。
   * 这正是本批最容易出的静默错误。收敛成一个消费者之后，读到什么就同时给两边记账，
   * 谁都不会把对方的结果吃掉。
   *
   * ## 记账规则
   *
   * - 读到错误时：交给栈顶作用域记账（若有），**并且**走 debug 上报通道（若 debug 打开），
   *   两边拿到的是**同一条**错误；
   * - 作用域是否「命中」由 `pop` 时按 filter 判定（见 {@link WebGL2Device.settleScope}），
   *   这里只负责如实记账；
   * - **本函数不做「要不要读」的判断**，那是调用方的事（`checkGlError` 看 `debug`、
   *   `pushErrorScope` 看是否需要清残留）。这样职责单一：一读就必然两边都记账，
   *   不会出现「守卫条件写错 → 读了却没人收」这种静默漏报
   *   （本批第一次实现就踩了：`settleScope` 先把作用域出栈，导致这里的守卫以为无人关心）。
   *
   * 无限循环不会发生：读到 `NO_ERROR` 就停，而驱动对空队列恒返回 `NO_ERROR`。
   */
  drainGlErrors(e) {
    const r = this.debug;
    for (; ; ) {
      this.glErrorReads += 1;
      const n = this.gl.getError();
      if (n === Ce.NO_ERROR) return;
      const i = this.scopeStack[this.scopeStack.length - 1];
      i && i.record(qp(n, e)), r && this.reportError(hm(n, e));
    }
  }
  /**
   * 作用域出栈时的归属判定（原生语义：错误归最内层；filter 不匹配则向外层穿透）。
   *
   * 返回本层 `pop()` 要交出去的那条错误；`null` 表示这一层没有可交的错误。
   * 没有被交出去的错误不会被吞掉：它们要么留给外层（穿透），要么作为**未捕获错误**
   * 走 `onError`（与 WebGPU 的 `uncapturederror` 同义）。
   *
   * ## 为什么「穿透」这件事在 GL 上仍然要做
   *
   * GL 本身没有 filter，但调用方写的是跨后端代码。若这里把 filter 当空气，
   * `pushErrorScope('out-of-memory')` 内层就会把一条 validation 错误吃掉，
   * 外层 `pushErrorScope('validation')` 拿到 `null` —— 同一段代码在 WebGPU 上拿得到错误、
   * 在 WebGL2 上拿不到，那是最难查的一类不一致。
   */
  settleScope(e) {
    this.drainGlErrors("popErrorScope");
    const r = this.scopeStack.lastIndexOf(e);
    r >= 0 && this.scopeStack.splice(r, 1);
    const n = e.errors, i = n[0];
    if (!i)
      return e.close(), null;
    const s = zp(i);
    if (s === e.filter)
      return e.markFilterMatched(!0), e.close(), this.reportUnconsumed(n.slice(1)), i;
    let a = null;
    for (let o = this.scopeStack.length - 1; o >= 0; o -= 1) {
      const l = this.scopeStack[o];
      if (l.active && (a ??= l, l.filter === s))
        return l.record(i), e.markFilterMatched(!1), e.close(), this.reportUnconsumed(n.slice(1)), null;
    }
    return a ? (a.record(i), e.markFilterMatched(!1), e.close(), this.reportUnconsumed(n.slice(1)), null) : (e.markFilterMatched(!1), e.close(), this.reportUnconsumed(n), null);
  }
  /** 把作用域没有交出去的错误交给 `onError` 通道（与未捕获错误同一条路）。 */
  reportUnconsumed(e) {
    for (const r of e) this.reportError(r);
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = !0;
    for (const n of this.scopeStack) n.abandon();
    this.scopeStack.length = 0, this.eventTarget && this.handleContextLost && this.eventTarget.removeEventListener("webglcontextlost", this.handleContextLost), this.eventTarget && this.handleContextRestored && this.eventTarget.removeEventListener("webglcontextrestored", this.handleContextRestored);
    const e = [...this.resources];
    this.resources.clear();
    for (const n of e)
      try {
        n.dispose();
      } catch (i) {
        this.logger.warn("释放资源时出错", i);
      }
    this.programs.dispose(), this.framebuffers.dispose(), this.state.dispose(), this.planCache.clear();
    for (const n of this.canvasContexts.values()) n.dispose();
    this.canvasContexts.clear(), this.contextRestoredCallbacks.clear(), this.errorCallbacks.clear(), this.state.invalidate();
    const r = { reason: "destroyed", message: "Device.dispose() was called." };
    this.lostInfoValue = r, this.lostResolve(r);
  }
  /**
   * 在 debug 模式下轮询 `gl.getError()` 并转成统一错误。
   *
   * ## `#20`：这里不再直接调 `gl.getError()`
   *
   * 读取收敛到 {@link WebGL2Device.drainGlErrors} 一个消费者，否则它与错误作用域会互相
   * 抢错误（先跑的读到错误、后跑的读到 `NO_ERROR`，于是其中一边静默误报）。语义不变：
   * 关掉 debug 时依旧一次 GL 调用都不产生；开着 debug 时读到的错误依旧逐条走 `onError`。
   *
   * 注意它会强制 CPU/GPU 同步，所以只在 debug 打开（或显式排空）时调用。
   */
  checkGlError(e) {
    this.debug && this.drainGlErrors(e);
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
  /**
   * 在任何会创建资源 / 提交工作之前检查设备仍可用。
   *
   * 两条独立的失败路径，都给带 `[gpu-device-api] ` 前缀的英文错误：
   * - 已经 `dispose()`：消息说明设备已被释放；
   * - GL context 丢失：消息带上 `GPUDeviceLostInfo.reason` 与 message，说明「上下文丢失后
   *   GL 对象全部失效」，而不是让调用方在失效句柄上白画一帧。
   */
  assertUsable(e) {
    if (this._disposed)
      throw new Ye(
        `[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`,
        { reason: "destroyed" }
      );
    const r = this.lostInfoValue;
    if (r)
      throw new Ye(
        `[gpu-device-api] Device.${e}: device "${this.label}" lost its WebGL2 context (${r.reason}): ${r.message}`,
        { reason: r.reason }
      );
  }
  /**
   * `webglcontextlost` 的处理：记录丢失信息、resolve `lost`、并上报一个 `DeviceLostError`。
   *
   * 幂等：浏览器可能连续触发多次 lost（例如恢复流程里又丢一次），这里只处理第一次 ——
   * promise 只能 resolve 一次，丢失原因也应该保持最早的那一条。
   */
  handleContextLostEvent() {
    if (this.lostInfoValue) return;
    const e = {
      reason: "unknown",
      message: "the WebGL2 context was lost (webglcontextlost). Every GL object created by this device is now invalid; the device cannot rebuild them, so create a new device and recreate its resources."
    };
    this.lostInfoValue = e, this.lostResolve(e), this._disposed || this.reportError(
      new Ye(
        `[gpu-device-api] WebGL2 context lost: ${e.message}`,
        { reason: e.reason }
      )
    );
  }
  /**
   * `webglcontextrestored` 的处理：只如实上报，**不**重建任何资源。
   *
   * 恢复的是「canvas 上的 GL context 本身」，不是本设备创建过的对象 —— GL 的对象命名空间
   * 随上下文一起消失，而我们的包装对象里只有已经作废的句柄（没有可重放的 descriptor），
   * 因此本抽象层无法做到「完整恢复」。调用方收到通知后应丢弃本设备并重新创建。
   */
  handleContextRestoredEvent() {
    this.contextRestoreCount += 1;
    const e = this.lostInfoValue ?? {
      reason: "unknown",
      message: "the WebGL2 context was restored without a preceding loss event."
    };
    this.logger.warn(
      `WebGL2 context restored (第 ${this.contextRestoreCount} 次)：canvas 又能用了，但本设备创建过的资源全部失效且无法重建，请 dispose() 后重新 createDevice()。`
    );
    for (const r of [...this.contextRestoredCallbacks])
      try {
        r(e);
      } catch (n) {
        this.logger.error(`context-restored callback threw: ${String(n)}`);
      }
  }
}
function hm(t, e) {
  return new te(`[gpu-device-api] GL 错误 0x${t.toString(16)}（发生在 ${e} 之后）。`, {
    code: "GL_ERROR",
    details: { glError: t, context: e }
  });
}
function pm(t) {
  const e = typeof t.getExtension == "function" ? t.getExtension(tr) : null, r = e != null;
  return {
    encoderTimestamps: !1,
    passTimestamps: r,
    unavailableReason: r ? null : `[gpu-device-api] this WebGL2 context does not expose the "${tr}" extension, so GL timer queries are unavailable. Use the WebGPU backend (feature "timestamp-query") or a driver/browser build that exposes the extension.`
  };
}
const dm = {
  antialias: !0,
  alpha: !1,
  depth: !0,
  stencil: !1,
  premultipliedAlpha: !0,
  preserveDrawingBuffer: !1,
  powerPreference: "high-performance",
  desynchronized: !1
};
class Bn {
  info;
  features;
  limits;
  gl;
  canvas;
  logger;
  device = null;
  constructor(e, r, n, i, s) {
    this.gl = e, this.canvas = r, this.limits = n, this.features = i, this.logger = s;
    const a = Up(e);
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
    const r = { ...dm, ...e.contextAttributes }, n = Dp(e.canvas, r), i = Gp(n), s = Op(n);
    return new Bn(n, e.canvas, i, s, e.logger);
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
    const r = new um({
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
const Gn = Object.freeze({
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
function S(t, e, r, n = {}) {
  const i = e === "depth" || e === "stencil" ? "depth" : e === "uint" ? "uint" : e === "sint" ? "sint" : "float";
  return {
    gpuFormat: Gn[t],
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
const fm = Object.freeze({
  r8unorm: S("r8unorm", "unorm", 1, { renderable: !0, filterable: !0 }),
  r8snorm: S("r8snorm", "snorm", 1, { filterable: !1 }),
  r8uint: S("r8uint", "uint", 1, { renderable: !0 }),
  r8sint: S("r8sint", "sint", 1, { renderable: !0 }),
  r16uint: S("r16uint", "uint", 2, { renderable: !0 }),
  r16sint: S("r16sint", "sint", 2, { renderable: !0 }),
  r16float: S("r16float", "float", 2, { renderable: !0, filterable: !0 }),
  rg8unorm: S("rg8unorm", "unorm", 2, { renderable: !0, filterable: !0 }),
  rg8snorm: S("rg8snorm", "snorm", 2, {}),
  rg8uint: S("rg8uint", "uint", 2, { renderable: !0 }),
  rg8sint: S("rg8sint", "sint", 2, { renderable: !0 }),
  r32uint: S("r32uint", "uint", 4, { renderable: !0, storage: !0 }),
  r32sint: S("r32sint", "sint", 4, { renderable: !0, storage: !0 }),
  r32float: S("r32float", "float", 4, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rg16uint: S("rg16uint", "uint", 4, { renderable: !0 }),
  rg16sint: S("rg16sint", "sint", 4, { renderable: !0 }),
  rg16float: S("rg16float", "float", 4, { renderable: !0, filterable: !0 }),
  rgba8unorm: S("rgba8unorm", "unorm", 4, { renderable: !0, storage: !0, filterable: !0 }),
  "rgba8unorm-srgb": S("rgba8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgba8snorm: S("rgba8snorm", "snorm", 4, { storage: !0 }),
  rgba8uint: S("rgba8uint", "uint", 4, { renderable: !0, storage: !0 }),
  rgba8sint: S("rgba8sint", "sint", 4, { renderable: !0, storage: !0 }),
  bgra8unorm: S("bgra8unorm", "unorm", 4, {
    renderable: !0,
    filterable: !0,
    storageFeature: "bgra8unorm-storage"
  }),
  "bgra8unorm-srgb": S("bgra8unorm-srgb", "unorm", 4, { renderable: !0, filterable: !0 }),
  rgb9e5ufloat: S("rgb9e5ufloat", "float", 4, {}),
  rgb10a2unorm: S("rgb10a2unorm", "unorm", 4, { renderable: !0, filterable: !0 }),
  rg11b10ufloat: S("rg11b10ufloat", "float", 4, { renderFeature: "rg11b10ufloat-renderable" }),
  rg32uint: S("rg32uint", "uint", 8, { renderable: !0, storage: !0 }),
  rg32sint: S("rg32sint", "sint", 8, { renderable: !0, storage: !0 }),
  rg32float: S("rg32float", "float", 8, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  rgba16uint: S("rgba16uint", "uint", 8, { renderable: !0, storage: !0 }),
  rgba16sint: S("rgba16sint", "sint", 8, { renderable: !0, storage: !0 }),
  rgba16float: S("rgba16float", "float", 8, { renderable: !0, storage: !0, filterable: !0 }),
  rgba32uint: S("rgba32uint", "uint", 16, { renderable: !0, storage: !0 }),
  rgba32sint: S("rgba32sint", "sint", 16, { renderable: !0, storage: !0 }),
  rgba32float: S("rgba32float", "float", 16, {
    renderable: !0,
    storage: !0,
    filterFeature: "float32-filterable"
  }),
  depth16unorm: S("depth16unorm", "depth", 2, {
    depthStencilAttachment: !0,
    filterable: !0
  }),
  // depth24plus 的实际位数由实现决定（至少 24 位、通常按 4 字节存储），
  // 因此没有确定的内存布局：既不能采样，也不能拷贝。
  depth24plus: S("depth24plus", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  "depth24plus-stencil8": S("depth24plus-stencil8", "depth", 4, {
    depthStencilAttachment: !0,
    sampleable: !1,
    copyable: !1
  }),
  depth32float: S("depth32float", "depth", 4, {
    depthStencilAttachment: !0,
    filterFeature: "float32-filterable"
  }),
  stencil8: S("stencil8", "stencil", 1, {
    depthStencilAttachment: !0,
    sampleable: !1
  })
});
function Ge(t) {
  const e = fm[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function J(t) {
  const e = Gn[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function mm(t) {
  for (const [e, r] of Object.entries(Gn))
    if (r === t) return e;
  throw new u(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function Wa(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function gr(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function za(t, e) {
  const r = Ge(t);
  return r.filterable ? !0 : r.filterFeature && e ? e.has(r.filterFeature) : !1;
}
function qa(t, e, r) {
  const n = Ge(t);
  if (!(n.renderable || n.depthStencilAttachment)) {
    if (n.renderFeature) {
      if (e ? e.has(n.renderFeature) : !1) return;
      throw new u(
        `[gpu-device-api] ${r}: "${t}" requires the "${n.renderFeature}" device feature to be used as a render attachment (it is not enabled on this device).`
      );
    }
    throw new u(
      `[gpu-device-api] ${r}: "${t}" cannot be used as a render attachment in WebGPU (snorm color formats and rgb9e5ufloat have no renderable support).`
    );
  }
}
function gm(t, e, r = !1) {
  const n = Ge(t);
  if (r)
    throw new u(
      `[gpu-device-api] ${e}: a multisampled texture ("${t}", sampleCount > 1) cannot be used as a TextureBinding; WebGPU only allows multisampled textures as render attachments.`
    );
  if (!n.sampleable)
    throw n.kind === "stencil" ? new u(
      `[gpu-device-api] ${e}: "stencil8" has no sampleable aspect; bind a depth format instead.`
    ) : new u(
      `[gpu-device-api] ${e}: "${t}" can only be used as a depth/stencil attachment and cannot be sampled (its memory layout is implementation defined). Use "depth32float" or "depth16unorm" when the depth texture has to be read in a shader.`
    );
}
function ja(t, e, r) {
  const n = Ge(t);
  if (!n.storage) {
    if (n.storageFeature) {
      if (e?.has(n.storageFeature)) return;
      throw new u(
        `[gpu-device-api] ${r}: "${t}" requires the "${n.storageFeature}" device feature to be used as a storage texture (it is not enabled on this device).`
      );
    }
    throw new u(
      `[gpu-device-api] ${r}: "${t}" cannot be used as a storage texture. WebGPU only allows r32uint/r32sint/r32float, rg32*, rgba8unorm(-snorm/uint/sint), rgba16*, rgba32* and bgra8unorm (with the bgra8unorm-storage feature).`
    );
  }
}
function bm(t, e) {
  if (!Ge(t).copyable)
    throw new u(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function wm(t, e, r) {
  if (e !== "all") {
    if (e === "depth-only" && !Wa(t))
      throw new u(
        `[gpu-device-api] ${r}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !gr(t))
      throw new u(
        `[gpu-device-api] ${r}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function ym(t, e, r, n) {
  Ge(t);
  const i = r.sampleCount ?? 1;
  if (e & x.RenderAttachment && qa(t, r.features, n), e & x.TextureBinding && gm(t, n, i > 1), e & x.StorageBinding && ja(t, r.features, n), e & (x.CopySrc | x.CopyDst) && bm(t, n), i > 1) {
    if (i !== 4)
      throw new u(
        `[gpu-device-api] ${n}: sampleCount must be 1 or 4, got ${String(i)}.`
      );
    if ((r.mipLevelCount ?? 1) > 1)
      throw new u(
        `[gpu-device-api] ${n}: a multisampled texture must have exactly one mip level.`
      );
    if (r.dimension !== void 0 && r.dimension !== "2d")
      throw new u(
        `[gpu-device-api] ${n}: a multisampled texture must be "2d", got "${r.dimension}".`
      );
    if (e & (x.CopySrc | x.CopyDst))
      throw new u(
        `[gpu-device-api] ${n}: a multisampled texture cannot be a copy source or destination; resolve it into a single-sampled texture first.`
      );
    if (e & (x.TextureBinding | x.StorageBinding))
      throw new u(
        `[gpu-device-api] ${n}: a multisampled texture can only be used as a render attachment.`
      );
  }
}
const vm = [
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
], xm = Object.freeze({
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
function On() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function Ci() {
  return On() !== null;
}
async function Sm(t = {}) {
  const e = On();
  if (!e) return null;
  const r = {};
  return t.powerPreference !== void 0 && (r.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (r.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (r.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (r.xrCompatible = t.xrCompatible), e.requestAdapter(r);
}
function Qa(t) {
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
function Ya(t) {
  const e = t ?? {}, r = {};
  for (const n of vm) {
    const i = e[n];
    r[n] = typeof i == "number" && Number.isFinite(i) ? i : xm[n];
  }
  return r;
}
function Tm(t) {
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
function $m(t, e, r) {
  if (!e || e.length === 0) return [];
  const n = [];
  for (const i of e) {
    if (typeof i != "string" || i.length === 0)
      throw new u(`[gpu-device-api] ${r}: feature names must be non-empty strings.`);
    if (!n.includes(i) && (n.push(i), !t.has(i)))
      throw new u(
        `[gpu-device-api] ${r}: the adapter does not support the "${i}" feature. Available features: ${t.size > 0 ? [...t].sort().join(", ") : "(none)"}.`
      );
  }
  return n;
}
class Em {
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
function Mi() {
  const t = On();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function Am(t) {
  const e = J(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new u(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function Pm(t) {
  const r = t.getContext.call(t, "webgpu");
  return !r || typeof r.getCurrentTexture != "function" ? null : r;
}
const we = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, It = {
  RED: 1,
  GREEN: 2,
  BLUE: 4,
  ALPHA: 8
}, ie = {
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
}, ct = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, Ri = {
  READ: 1,
  WRITE: 2
};
function Lm(t) {
  if (!Number.isInteger(t))
    throw new u(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new u(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & C.Vertex && (e |= we.VERTEX), t & C.Fragment && (e |= we.FRAGMENT), t & C.Compute && (e |= we.COMPUTE), e === 0)
    throw new u(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function _m(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new u(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & ue.Red && (e |= It.RED), t & ue.Green && (e |= It.GREEN), t & ue.Blue && (e |= It.BLUE), t & ue.Alpha && (e |= It.ALPHA), e;
}
function Cm(t) {
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
  return t & O.MapRead && (e |= ie.MAP_READ), t & O.MapWrite && (e |= ie.MAP_WRITE), t & O.CopySrc && (e |= ie.COPY_SRC), t & O.CopyDst && (e |= ie.COPY_DST), t & O.Index && (e |= ie.INDEX), t & O.Vertex && (e |= ie.VERTEX), t & O.Uniform && (e |= ie.UNIFORM), t & O.Storage && (e |= ie.STORAGE), t & O.Indirect && (e |= ie.INDIRECT), t & O.QueryResolve && (e |= ie.QUERY_RESOLVE), e;
}
function Xa(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new u(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & x.CopySrc && (e |= ct.COPY_SRC), t & x.CopyDst && (e |= ct.COPY_DST), t & x.TextureBinding && (e |= ct.TEXTURE_BINDING), t & x.StorageBinding && (e |= ct.STORAGE_BINDING), t & x.RenderAttachment && (e |= ct.RENDER_ATTACHMENT), e;
}
function Mm(t) {
  switch (t) {
    case "read":
      return Ri.READ;
    case "write":
      return Ri.WRITE;
    default:
      return R(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function Rm(t) {
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
      return R(t, `[gpu-device-api] Unknown PrimitiveTopology "${String(t)}".`);
  }
}
function Fm(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function Ha(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return R(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
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
      return R(t, `[gpu-device-api] Unknown CompareFunction "${String(t)}".`);
  }
}
function Mr(t) {
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
      return R(t, `[gpu-device-api] Unknown StencilOperation "${String(t)}".`);
  }
}
function Fi(t) {
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
      return R(t, `[gpu-device-api] Unknown BlendFactor "${String(t)}".`);
  }
}
function Bm(t) {
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
      return R(t, `[gpu-device-api] Unknown BlendOperation "${String(t)}".`);
  }
}
function Rr(t) {
  switch (t) {
    case "clamp-to-edge":
      return "clamp-to-edge";
    case "repeat":
      return "repeat";
    case "mirror-repeat":
      return "mirror-repeat";
    default:
      return R(t, `[gpu-device-api] Unknown AddressMode "${String(t)}".`);
  }
}
function Bi(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return R(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function Gm(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return R(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function Om(t) {
  switch (t) {
    case "none":
      return "none";
    case "front":
      return "front";
    case "back":
      return "back";
    default:
      return R(t, `[gpu-device-api] Unknown CullMode "${String(t)}".`);
  }
}
function Um(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return R(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function Fr(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return R(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function Br(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return R(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function nn(t) {
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
      return R(t, `[gpu-device-api] Unknown TextureViewDimension "${String(t)}".`);
  }
}
function Un(t) {
  switch (t) {
    case "all":
      return "all";
    case "depth-only":
      return "depth-only";
    case "stencil-only":
      return "stencil-only";
    default:
      return R(t, `[gpu-device-api] Unknown TextureAspect "${String(t)}".`);
  }
}
function Im(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return R(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function Dm(t) {
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
      return R(t, `[gpu-device-api] Unknown VertexFormat "${String(t)}".`);
  }
}
function km(t) {
  switch (t) {
    case Je.Occlusion:
      return "occlusion";
    case Je.Timestamp:
      return "timestamp";
    default:
      return R(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function Vm(t) {
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
function Nm(t) {
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
function Wm(t) {
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
      return R(t, `[gpu-device-api] Unknown TextureSampleType "${String(t)}".`);
  }
}
function zm(t) {
  switch (t) {
    case "write-only":
      return "write-only";
    case "read-only":
      return "read-only";
    case "read-write":
      return "read-write";
    default:
      return R(t, `[gpu-device-api] Unknown StorageTextureAccess "${String(t)}".`);
  }
}
function qm(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return R(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const jm = {
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
}, Qm = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, Ym = /^rgba?\(([^)]*)\)$/;
function Za(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return Hm(t);
  if (typeof t == "number") return Xm(t);
  if (Array.isArray(t)) {
    const r = t;
    if (r.length !== 3 && r.length !== 4)
      throw new u(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${r.length}.`
      );
    return Gi(r[0], r[1], r[2], r.length === 4 ? r[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new u(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return Gi(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function Gi(t, e, r, n, i) {
  for (const [s, a] of [
    ["r", t],
    ["g", e],
    ["b", r],
    ["a", n]
  ])
    if (!Number.isFinite(a))
      throw new u(
        `[gpu-device-api] Clear color component "${s}" must be a finite number, got ${String(a)} (from ${JSON.stringify(i)}).`
      );
  return { r: t, g: e, b: r, a: n };
}
function Xm(t) {
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
function Hm(t) {
  const e = t.trim().toLowerCase(), r = Qm.exec(e);
  if (r) {
    const s = r[1];
    if (s.length === 3 || s.length === 4) {
      const h = parseInt(s[0] + s[0], 16) / 255, d = parseInt(s[1] + s[1], 16) / 255, p = parseInt(s[2] + s[2], 16) / 255, f = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: h, g: d, b: p, a: f };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, l = parseInt(s.slice(4, 6), 16) / 255, c = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: l, a: c };
  }
  const n = jm[e];
  if (n) return { r: n[0], g: n[1], b: n[2], a: n[3] };
  const i = Ym.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((h) => h.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new u(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = Gr(s[0], t), o = Gr(s[1], t), l = Gr(s[2], t), c = s.length === 4 ? Zm(s[3], t) : 1;
    return { r: a, g: o, b: l, a: c };
  }
  throw new u(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function Gr(t, e) {
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    if (!Number.isFinite(n))
      throw new u(`[gpu-device-api] Clear color "${e}" has an invalid percentage "${t}".`);
    return n / 100;
  }
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new u(`[gpu-device-api] Clear color "${e}" has an invalid component "${t}".`);
  return r / 255;
}
function Zm(t, e) {
  if (t.endsWith("%")) {
    const n = Number(t.slice(0, -1));
    if (!Number.isFinite(n))
      throw new u(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
    return n / 100;
  }
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new u(`[gpu-device-api] Clear color "${e}" has an invalid alpha "${t}".`);
  return r;
}
function He(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function Ka(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function Km(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function St(t, e) {
  if (t !== 1 && t !== 4)
    throw new u(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class Ja {
  label;
  size;
  usage;
  native;
  device;
  _disposed = !1;
  /**
   * 映射状态，与原生 `GPUBuffer.mapState` 同一套语义（`'unmapped' | 'pending' | 'mapped'`）。
   *
   * 用一个状态而不是 `mapped` 布尔，是为了**如实反映 `mapAsync()` 还没 settle 的那一段**：
   * 那时原生 `[[pending_map]]` 非 null、`[[mapping]]` 还是 null，`getMappedRange()` 必须报错。
   * 若只维护布尔，`mapAsync()` 一发出就可能被读成「已映射」，调用方就会在不该取范围的时候取
   * 范围 —— 那正是本会话反复修的「状态撒谎」。所以状态机是唯一真相，`mapped` 由它派生。
   */
  _mapState = "unmapped";
  /**
   * `mapAsync` 时向原生取到的**整段映射内存**（`GPUBuffer.getMappedRange()` 的返回值）。
   *
   * 必须记下来，两个原因：
   *
   * 1. WebGPU 规定同一个映射范围只能被原生 `getMappedRange()` 取一次，重复取（哪怕完全
   *    相同的范围）都会以「与已返回的范围重叠」报错，而 core 的 `Buffer` 契约是
   *    「`mapAsync` 以映射范围 resolve，`getMappedRange` 再取当前映射范围」——
   *    两个方法都要能用（WebGL2 后端就是这样）。所以这里自己记着已经交出去的那一块内存，
   *    后续一律在它上面建视图，不再往原生对象上问第二遍。
   * 2. 它是原生返回的、指向**映射内存**的 `ArrayBuffer`：在它上面建 TypedArray 视图就是
   *    「不拷贝地访问映射内存」，写入自然落到 buffer 上。
   *
   * `mappedAtCreation: true` 时这块内存同样在构造期拿到（原生创建完就已映射）。
   */
  mappedRange = null;
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? `buffer#${e.nextResourceId("buffer")}`, et(r.size, "BufferDescriptor.size"), r.size % 4 !== 0)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size must be a multiple of 4 (WebGPU requires 4-byte aligned buffer sizes), got ${r.size}. Use alignTo4()/paddedCopy() when uploading tightly packed data.`
      );
    if (r.size > e.limits.maxBufferSize)
      throw new u(
        `[gpu-device-api] BufferDescriptor.size ${r.size} exceeds maxBufferSize (${e.limits.maxBufferSize}).`
      );
    this.size = r.size, this.usage = r.usage;
    const n = r.mappedAtCreation === !0;
    if (this.native = e.native.createBuffer({
      label: this.label,
      size: r.size,
      usage: Cm(r.usage),
      // 只有为 true 时才把字段交给原生：原生 descriptor 的形状对 native 校验有影响，
      // 「多传一个恒为 false 的字段」没有必要。
      ...n ? { mappedAtCreation: !0 } : {}
    }), n) {
      const i = this.native.getMappedRange(0, r.size);
      this.mappedRange = { offset: 0, size: r.size, data: i }, this._mapState = "mapped";
    }
  }
  get disposed() {
    return this._disposed;
  }
  get mapState() {
    return this._mapState;
  }
  /** 由 {@link WebGPUBuffer.mapState} 派生，两者任何时候都一致。 */
  get mapped() {
    return this._mapState === "mapped";
  }
  /** 当前 buffer 是否仍然可用（未释放、device 未销毁）。 */
  get usable() {
    return !this._disposed && !this.device.disposed;
  }
  /**
   * 把 buffer 的某个范围映射给 CPU，并以该范围的 `ArrayBuffer` resolve。
   *
   * WebGPU 的 `mapAsync` 本身只 resolve 一个 `undefined`，因此这里在映射完成后立即调用原生
   * `getMappedRange()`，把它返回的**映射内存**交给上层 —— 那是视图而不是副本，写入会真正落到
   * buffer 上（`unmap()` 时刷给 GPU）。
   *
   * ## 传给原生的 `offset` 是**绝对偏移量**（这一点必须按实现实测，不能想当然）
   *
   * 规范的 `GPUBuffer.getMappedRange(offset, size)` 里 `offset` 是**相对 buffer 起点**的字节偏移
   * （2024 年规范原文：`Offset in bytes into the buffer to return buffer contents from`），
   * 且必须落在本次映射范围之内。Chrome 实测（无头 Chrome + `--enable-unsafe-webgpu`，Intel 适配器）：
   *
   * | 调用 | 结果 |
   * | --- | --- |
   * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(16, 32)` | OK |
   * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(0, 32)` | OperationError |
   * | `mapAsync(WRITE, 16, 32)` 后 `getMappedRange(8, 4)` | OperationError（8 在映射范围之前） |
   *
   * 所以这里传的是 `mapAsync()` 收到的那个绝对 `offset`（与旧实现一致），而不是 0；
   * 传 0 在 `offset > 0` 时会直接报错。本类对外的 `getMappedRange(offset, size)` 则采用
   * 「相对映射起点」的约定（与 WebGL2 后端一致，见 {@link WebGPUBuffer.getMappedRange}），
   * 两者之间的平移只发生在这一处。
   *
   * ## 状态机
   *
   * `mapState` 在调用后立即变成 `'pending'`（原生 `[[pending_map]]` 已设置），原生 Promise
   * settle 之后变成 `'mapped'`。如果原生 `mapAsync()` reject（设备丢失、范围非法等），
   * 状态**回退到 `'unmapped'`** 并把错误抛出去 —— 绝不留下一个卡在 `'pending'` 的对象
   * （那样 `getMappedRange()` 永远报「还没映射」，而调用方又再也不能重新映射）。
   */
  async mapAsync(e, r = 0, n) {
    if (this.assertUsable("Buffer.mapAsync"), this._mapState !== "unmapped") {
      const s = this._mapState === "pending" ? "a mapping is already pending; await the previous mapAsync() and call unmap() first." : "the buffer is already mapped (mappedAtCreation or a previous mapAsync); call unmap() first.";
      throw new u(`[gpu-device-api] Buffer "${this.label}": ${s}`);
    }
    const i = n ?? this.size - r;
    this.assertRange(r, i, "Buffer.mapAsync"), this._mapState = "pending";
    try {
      await this.native.mapAsync(Mm(e), r, i);
      const s = this.native.getMappedRange(r, i);
      if (this._mapState !== "pending") {
        try {
          this.native.unmap();
        } catch {
        }
        return s;
      }
      return this.mappedRange = { offset: r, size: i, data: s }, this._mapState = "mapped", s;
    } catch (s) {
      throw this._mapState === "pending" && (this._mapState = "unmapped", this.mappedRange = null), s;
    }
  }
  /**
   * 当前已映射的范围里的一段（`offset` 相对映射起点，与 WebGL2 后端一致）。
   *
   * ## 返回的是视图，不是副本
   *
   * - 整段范围：直接返回 `mapAsync()` 给出去的那个 `ArrayBuffer`（原生映射内存本身）；
   * - 部分范围：返回**建在同一块内存上的 `Uint8Array` 视图**（`new Uint8Array(data, offset, size)`）。
   *
   * 绝不使用 `slice()`：那是拷贝，写进去的数据在 `unmap()` 时不会被上传 —— 这正是本次修复
   * 掉的缺陷（`mapAsync('write')` → `getMappedRange(offset, size)` → 写 → `unmap()` 静默失效）。
   *
   * ## 为什么不去问原生要子范围
   *
   * 原生 `getMappedRange()` 的每一段范围只能取一次，与已返回的范围重叠即报错；而 `mapAsync()`
   * 已经取走了整段映射内存，再取任何子范围都与之重叠（原生还会拒绝映射范围以外的偏移量）。
   * 所以子范围一律在已取到的那块内存上建视图 —— `data` 就是映射内存本身，视图是它的别名，
   * 重复调用同一段范围（`getMappedRange(4, 4)` 两次）也一定拿到 `view.buffer` 相同的视图，
   * 而不是各拿一份副本。
   *
   * 注意本方法的 `offset` 与原生不同：**这里相对映射起点**（`mapAsync()` 的 `offset`），
   * 原生则相对 buffer 起点（见 {@link WebGPUBuffer.mapAsync} 的实测表格）。因为建视图不需要
   * 再调原生，这个平移只在 `mapAsync()` 里发生一次。
   *
   * ## 生命周期（与原生一致）
   *
   * `unmap()` 会让原生映射内存 detach，之前取出的 `ArrayBuffer` 与建在它上面的视图一起失效：
   * `byteLength` / `length` 变成 0，读元素得到 `undefined`，写元素被**静默忽略**
   * （越界写按规范就是空操作），只有真正触碰底层内存的调用（`slice()` 等）会抛 `TypeError`。
   * 因此调用方必须在 `unmap()` **之前**把要留下的数据拷出来（`range.slice()`）；
   * `unmap()` 之后再访问这些视图是未定义行为，本库不保证任何结果。
   */
  getMappedRange(e = 0, r) {
    this.assertUsable("Buffer.getMappedRange");
    const n = this.mappedRange;
    if (this._mapState !== "mapped" || !n)
      throw new u(
        `[gpu-device-api] Buffer "${this.label}" is not mapped (mapState: "${this._mapState}"); await mapAsync() (or create it with mappedAtCreation: true) before calling getMappedRange().`
      );
    const i = r ?? n.size - e;
    return this.assertRange(e, i, "Buffer.getMappedRange", n.size), e === 0 && i === n.size ? n.data : new Uint8Array(n.data, e, i);
  }
  /**
   * 结束映射：`'write'` 映射会在此把 CPU 侧的改动刷给 GPU，`'read'` 映射在此释放映射内存。
   *
   * 原生 `unmap()` 同时会 detach 掉之前 `getMappedRange()` 返回的映射内存，所以本类交出去的
   * `ArrayBuffer` 与它上面的视图在调用之后就失效了（见 {@link WebGPUBuffer.getMappedRange}）。
   *
   * 未映射时是空操作（WebGPU 的 `unmap()` 对未映射 buffer 同样是合法的空操作），
   * 这样清理路径里可以放心地无条件调用。
   *
   * ⚠️ `'pending'` 时**不**调用原生 `unmap()`：原生规定「映射请求还没 settle 时调用 unmap()
   * 会被忽略」（`[[pending_map]]` 还在，`[[mapping]]` 还是 null）。所以这里只把状态推回
   * `'unmapped'`；那次 `mapAsync()` settle 时会看到状态已经不是 `'pending'`，于是立刻把刚
   * 拿到的映射交还给原生，而不是把它泄漏成一块谁也不管的映射内存。这样 `mapState` 既不会停在
   * 一个用户已经放弃的 `'pending'` 上，底层资源也不会泄漏。
   */
  unmap() {
    if (this._disposed || this._mapState === "unmapped") return;
    const e = this._mapState === "pending";
    this._mapState = "unmapped", this.mappedRange = null, e || this.native.unmap();
  }
  /**
   * 释放底层分配。幂等；已映射的 buffer 会先被取消映射。
   *
   * 原生 `GPUBuffer.destroy()` 本身就会取消映射（并在创建时用了 `mappedAtCreation` 却没
   * `unmap()` 的情况下负责清理），所以这里**不**额外调 `native.unmap()`：那样会在 destroy
   * 之前把映射内存 detach 掉，而 destroy 的语义是「释放整个 buffer」，多余的一步只会让行为
   * 更难对齐。本类只负责把自己的状态推回 `'unmapped'`，保证 `mapState` / `mapped` 不撒谎。
   */
  destroy() {
    this._disposed || (this._disposed = !0, this._mapState = "unmapped", this.mappedRange = null, this.native.destroy(), this.device.untrack(this));
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
  assertRange(e, r, n, i = this.size) {
    if (Te(e, `${n} offset`), et(r, `${n} size`), e + r > i) {
      const s = i === this.size ? `buffer "${this.label}" size ${this.size}` : `mapped range size ${i} of buffer "${this.label}"`;
      throw new u(
        `[gpu-device-api] ${n}: range [${e}, ${e + r}) exceeds ${s}.`
      );
    }
  }
}
function Jm(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function V(t, e) {
  if (t instanceof Ja) return t.native;
  if (Jm(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), got ${ee(t)}.`
  );
}
function ee(t) {
  if (t === null) return "null";
  if (t === void 0) return "undefined";
  if (typeof t == "object") {
    const e = t.label;
    return typeof e == "string" && e.length > 0 ? `a resource labelled "${e}"` : `an instance of ${t.constructor?.name ?? "Object"}`;
  }
  return `${typeof t} ${String(t)}`;
}
class In {
  label;
  texture;
  descriptor;
  native;
  _disposed = !1;
  /**
   * `preResolved` 由 {@link WebGPUTexture.createView} 传入：它已经为查缓存解析过一次，
   * 这里不再重复解析（`resolveTextureViewDescriptor` 每次都会新建一个对象）。
   */
  constructor(e, r = {}, n) {
    this.texture = e;
    const i = n ?? Yt(e, r);
    this.label = r.label ?? `${e.label}#view`;
    const s = i.aspect;
    if (wm(e.format, s, `Texture "${e.label}".createView`), i.baseMipLevel + i.mipLevelCount > e.mipLevelCount)
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
      dimension: nn(i.dimension),
      aspect: Un(i.aspect),
      baseMipLevel: i.baseMipLevel,
      mipLevelCount: i.mipLevelCount,
      baseArrayLayer: i.baseArrayLayer,
      arrayLayerCount: i.arrayLayerCount,
      /*
       * `#23`：**只在调用方显式给了 swizzle 时才传这个字段**。
       *
       * 少传一个字段不是省事，而是「改动前后行为逐字段一致」的要求：原先的
       * `createView()` 调用参数里没有 swizzle，而填上默认值 `'rgba'` 会改变送给原生实现的
       * descriptor 形状（也会让所有既有调用多走一条校验路径）。默认值交给原生实现填，
       * 这里的 `resolved.swizzle === undefined` 就代表「没指定」。
       */
      ...i.swizzle === void 0 ? {} : { swizzle: i.swizzle }
    });
  }
  /** view 覆盖的格式（可能是重解释后的格式）。 */
  get format() {
    return this.descriptor.format ?? this.texture.format;
  }
  /** 实际生效的通道重排；未指定时为 `'rgba'`（与原生默认值一致）。 */
  get swizzle() {
    return this.descriptor.swizzle ?? mt;
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUTextureView 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0;
  }
}
function eo(t) {
  return t instanceof In;
}
function eg(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function ht(t, e) {
  if (t instanceof In) return t.native;
  if (eg(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${ee(t)}.`
  );
}
class $e {
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
  mipPassCache = /* @__PURE__ */ new Map();
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
    const n = or(r.size), i = {
      label: r.label ?? `texture#${e.nextResourceId("texture")}`,
      size: n,
      mipLevelCount: r.mipLevelCount ?? 1,
      sampleCount: r.sampleCount ?? 1,
      dimension: r.dimension ?? "2d",
      format: r.format,
      usage: r.usage,
      viewFormats: r.viewFormats ?? []
    };
    og(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: n.width, height: n.height, depthOrArrayLayers: n.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: J(i.format),
      usage: Xa(i.usage),
      viewFormats: i.viewFormats.map((a) => J(a))
    });
    return new $e(e, s, i, !0);
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
      format: n.format ?? mm(r.format),
      usage: n.usage ?? r.usage,
      viewFormats: n.viewFormats ?? []
    };
    return new $e(e, r, a, i.owned ?? !1);
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
    let r, n;
    e === void 0 ? (r = this.defaultViewResolved ?? (this.defaultViewResolved = Yt(this, {})), n = this.defaultViewKey ?? (this.defaultViewKey = Oi(r))) : (r = Yt(this, e), n = Oi(r));
    const i = this.viewCache.get(n);
    if (i) return i;
    const s = new In(this, e, r);
    return this.viewCache.set(n, s), this.viewList.push(s), s;
  }
  /** 目前已创建的 view；随 texture 一同释放。 */
  get views() {
    return this.viewList;
  }
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
  generateMipmaps() {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: the texture has been destroyed.`
      );
    if (!this.usable)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: the owning device is not usable.`
      );
    if (this.sampleCount > 1)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: a multisampled texture (sampleCount=${this.sampleCount}) has no mip chain.`
      );
    if (this.mipLevelCount <= 1)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: mipLevelCount is 1, so there is no level to generate; allocate the texture with an explicit mipLevelCount (fullMipLevelCount(size)).`
      );
    if (!(this.usage & x.RenderAttachment))
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: WebGPU has no generateMipmap, so the backend downsamples with render passes; this texture was created without the "RenderAttachment" usage. Add TextureUsage.RenderAttachment (the gfx layer does this automatically when mipmaps are requested).`
      );
    if (qa(this.format, this.device.features, `Texture "${this.label}".generateMipmaps`), !za(this.format, this.device.features))
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" is not filterable on this device, so the downsampling pass cannot average 2x2 texels. Use a unorm/float format such as rgba8unorm(-srgb), bgra8unorm(-srgb), r8unorm or rg8unorm.`
      );
    const e = this.device.native, r = ag(e, this.format), n = this.dimension === "3d" || this.depthOrArrayLayers > 1, i = e.createCommandEncoder({ label: `${this.label}:mipmap` });
    for (let s = 1; s < this.mipLevelCount; s++) {
      const a = n ? sg(this.dimension, this.depthOrArrayLayers, s) : 1;
      for (let o = 0; o < a; o++) {
        const l = this.acquireMipPass(e, r, s, o, n), c = i.beginRenderPass({
          label: `${this.label}:mip${s}`,
          colorAttachments: [
            {
              view: l.target,
              // 目标级别会被完整覆盖（全屏三角形），clear 只是为了让 loadOp 合法。
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 0 }
            }
          ]
        });
        c.setPipeline(l.pipeline), c.setBindGroup(0, l.bindGroup), c.draw(3), c.end();
      }
    }
    e.queue.submit([i.finish()]);
  }
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
  acquireMipPass(e, r, n, i, s) {
    const a = ng(n, i), o = this.mipPassCache.get(a);
    if (o !== void 0) return o;
    const l = this.dimension === "3d" ? i << 1 : i, c = this.native.createView({
      label: `${this.label}:mip${n - 1}`,
      dimension: "2d",
      baseMipLevel: n - 1,
      mipLevelCount: 1,
      baseArrayLayer: l,
      // 目标第 s 层对 `2d-array` 就是源第 s 层；对 `3d` 是源第 2s 片（两片里的一片）。
      arrayLayerCount: 1
    }), h = this.native.createView({
      label: `${this.label}:mip${n}`,
      dimension: "2d",
      baseMipLevel: n,
      mipLevelCount: 1,
      baseArrayLayer: i,
      arrayLayerCount: 1
    });
    if (!s) {
      const g = e.createBindGroup({
        label: `${this.label}:mip${n}`,
        layout: r.bindGroupLayout,
        entries: [
          { binding: 0, resource: c },
          { binding: 1, resource: r.sampler }
        ]
      }), b = { source: c, target: h, bindGroup: g, pipeline: r.pipeline };
      return this.mipPassCache.set(a, b), b;
    }
    const d = e.createBuffer({
      label: `${this.label}:mip${n}:layer`,
      size: 16,
      // uniform buffer 的最小绑定大小是 16 字节（我们只用前 4 个）。
      usage: ig
    });
    e.queue.writeBuffer(d, 0, new Float32Array([l, 0, 0, 0]));
    const p = r.layered(), f = e.createBindGroup({
      label: `${this.label}:mip${n}`,
      layout: p.bindGroupLayout,
      entries: [
        { binding: 0, resource: c },
        { binding: 1, resource: r.sampler },
        { binding: 2, resource: { buffer: d } }
      ]
    }), m = {
      source: c,
      target: h,
      bindGroup: f,
      pipeline: p.pipeline
    };
    return this.mipPassCache.set(a, m), m;
  }
  /** 销毁 texture（`owned` 为 false 时只标记包装对象失效）。幂等。 */
  destroy() {
    if (!this._disposed) {
      this._disposed = !0;
      for (const e of this.viewList) e.dispose();
      this.viewCache.clear(), this.defaultViewResolved = null, this.defaultViewKey = null, this.mipPassCache.clear(), this.owned && this.native.destroy(), this.device.untrack(this);
    }
  }
  /** `Disposable` 的别名。 */
  dispose() {
    this.destroy();
  }
}
function Oi(t) {
  return Ps(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect,
    // `#23`：swizzle 是 view 的一部分 —— 不把它算进 key 会让
    // `createView({ swizzle: 'rrr1' })` 直接命中此前 `createView()` 的缓存条目，
    // 于是「采样时重排通道」静默失效（拿到视图里的 descriptor 也不对）。
    t.swizzle ?? ""
  );
}
const tg = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var sourceTexture: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let uv = vec2f(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
  var out: VertexOutput;
  out.uv = uv;
  out.position = vec4f(uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), 0.0, 1.0);
  return out;
}

@fragment
fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  // 全屏三角形把 uv 线性映射到整个目标级别，因此目标像素中心落在源级别 2x2 纹素的正中时，
  // 一次双线性采样恰好是这 4 个纹素的平均值（sRGB 格式会在滤波前先解码到线性空间）。
  return textureSampleLevel(sourceTexture, sourceSampler, in.uv, 0.0);
}
`, rg = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

struct LayerParams {
  layer: vec3f,
}

@group(0) @binding(0) var sourceTexture: texture_2d_array<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
@group(0) @binding(2) var<uniform> params: LayerParams;

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let uv = vec2f(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
  var out: VertexOutput;
  out.uv = uv;
  out.position = vec4f(uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), 0.0, 1.0);
  return out;
}

@fragment
fn fsMain(in: VertexOutput) -> @location(0) vec4f {
  // 坐标是 vec2、层号是独立的 u32 参数（不是 vec3 坐标）。
  return textureSampleLevel(sourceTexture, sourceSampler, in.uv, u32(params.layer.x), 0.0);
}
`, Ui = /* @__PURE__ */ new WeakMap(), Ii = /* @__PURE__ */ new WeakMap();
function ng(t, e) {
  return `${t}:${e}`;
}
const ig = 72;
function sg(t, e, r) {
  return t === "3d" ? Math.max(1, e >> r) : e;
}
function ag(t, e) {
  let r = Ui.get(t);
  r || (r = /* @__PURE__ */ new Map(), Ui.set(t, r));
  const n = r.get(e);
  if (n) return n;
  let i = Ii.get(t);
  i || (i = {
    plain: t.createShaderModule({ label: "mipmap-downsample", code: tg }),
    layered: t.createShaderModule({
      label: "mipmap-downsample-layered",
      code: rg
    })
  }, Ii.set(t, i));
  const s = `mipmap-downsample:${e}`, a = t.createBindGroupLayout({
    label: s,
    entries: [
      {
        binding: 0,
        visibility: we.FRAGMENT,
        texture: { sampleType: "float", viewDimension: "2d" }
      },
      {
        binding: 1,
        visibility: we.FRAGMENT,
        sampler: { type: "filtering" }
      }
    ]
  }), o = J(e), l = t.createRenderPipeline({
    label: s,
    layout: t.createPipelineLayout({ label: s, bindGroupLayouts: [a] }),
    vertex: { module: i.plain, entryPoint: "vsMain" },
    fragment: {
      module: i.plain,
      entryPoint: "fsMain",
      targets: [{ format: o }]
    },
    primitive: { topology: "triangle-list" }
  }), c = t.createSampler({
    label: "mipmap-downsample",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "nearest"
  });
  let h = null;
  const d = {
    pipeline: l,
    bindGroupLayout: a,
    sampler: c,
    layered() {
      if (h) return h;
      const p = `${s}:layered`, f = t.createBindGroupLayout({
        label: p,
        entries: [
          {
            binding: 0,
            visibility: we.FRAGMENT,
            // 视图本身仍是单层的 2d view（逐层降采样），但绑定类型必须是 array ——
            // 这样着色器才能用层号索引，而不是被固定在第 0 层。
            texture: { sampleType: "float", viewDimension: "2d-array" }
          },
          {
            binding: 1,
            visibility: we.FRAGMENT,
            sampler: { type: "filtering" }
          },
          {
            binding: 2,
            visibility: we.FRAGMENT,
            buffer: { type: "uniform", minBindingSize: 16 }
          }
        ]
      });
      return h = { pipeline: t.createRenderPipeline({
        label: p,
        layout: t.createPipelineLayout({ label: p, bindGroupLayouts: [f] }),
        vertex: { module: i.layered, entryPoint: "vsMain" },
        fragment: {
          module: i.layered,
          entryPoint: "fsMain",
          targets: [{ format: o }]
        },
        primitive: { topology: "triangle-list" }
      }), bindGroupLayout: f }, h;
    }
  };
  return r.set(e, d), d;
}
function og(t, e) {
  const { width: r, height: n, depthOrArrayLayers: i } = t.size;
  if (!Number.isInteger(r) || r <= 0 || !Number.isInteger(n) || n <= 0)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": width and height must be positive integers, got ${r}x${n}.`
    );
  if (!Number.isInteger(i) || i <= 0)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers must be a positive integer, got ${String(i)}.`
    );
  if (!Number.isInteger(t.mipLevelCount) || t.mipLevelCount <= 0)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount must be a positive integer.`
    );
  const s = vs(t.size);
  if (t.mipLevelCount > s)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": mipLevelCount ${t.mipLevelCount} is more than the maximum ${s} for a ${r}x${n}x${i} texture.`
    );
  if (t.dimension === "1d" && n !== 1)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture must have height 1, got ${n}.`
    );
  if (t.dimension === "1d" && t.sampleCount > 1)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": a "1d" texture cannot be multisampled.`
    );
  const a = t.dimension === "1d" ? e.limits.maxTextureDimension1D : t.dimension === "3d" ? e.limits.maxTextureDimension3D : e.limits.maxTextureDimension2D;
  if (r > a || n > a || i > a)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": ${r}x${n}x${i} exceeds the ${t.dimension} limit ${a}.`
    );
  if (t.dimension === "2d" && i > e.limits.maxTextureArrayLayers)
    throw new u(
      `[gpu-device-api] Texture "${t.label}": depthOrArrayLayers ${i} exceeds maxTextureArrayLayers ${e.limits.maxTextureArrayLayers}.`
    );
  ym(
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
function Di(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function to(t, e) {
  if (t instanceof $e) return t.native;
  if (Di(t)) return t;
  const r = t?.native;
  if (r !== void 0 && Di(r)) return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${ee(t)}.`
  );
}
class ro {
  label;
  native;
  device;
  _disposed = !1;
  constructor(e, r, n) {
    this.device = e, this.native = r, this.label = n;
  }
  /**
   * 向原生查询是否过期（原生实现暴露 `expired` 时）。
   *
   * 拿不到这个字段时返回 `false`：这个值只用于提前给出更清楚的报错，不是功能闸门 ——
   * 「不知道」不应该拦住一次本来可能成功的绑定。
   */
  get expired() {
    return this.native.expired === !0;
  }
  get disposed() {
    return this._disposed;
  }
  /**
   * 标记本包装对象失效并通知设备取消追踪。
   *
   * 原生 `GPUExternalTexture` **没有** `destroy()`：它的生命周期由原生实现按帧管理
   * （见 `core/resources/ExternalTexture.ts` 的过期语义）。所以这里只做本层的记账，
   * 不假装调用了什么原生销毁接口。
   */
  dispose() {
    this._disposed = !0, this.device.untrack(this);
  }
}
function lg(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUExternalTexture]";
}
function cg(t, e) {
  if (t instanceof ro) return t.native;
  if (lg(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU external texture (WebGPUExternalTexture or a native GPUExternalTexture), got ${ee(t)}.`
  );
}
class Dn {
  label;
  descriptor;
  native;
  device;
  _disposed = !1;
  constructor(e, r = {}) {
    this.device = e, this.label = r.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const n = xs(r);
    if (!Number.isFinite(n.lodMinClamp) || !Number.isFinite(n.lodMaxClamp))
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp/lodMaxClamp must be finite numbers.`
      );
    if (n.lodMinClamp < 0)
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": lodMinClamp must not be negative, got ${n.lodMinClamp}.`
      );
    if (n.lodMaxClamp < n.lodMinClamp)
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": lodMaxClamp (${n.lodMaxClamp}) must be >= lodMinClamp (${n.lodMinClamp}).`
      );
    if (!Number.isFinite(n.maxAnisotropy) || n.maxAnisotropy < 1)
      throw new u(
        `[gpu-device-api] Sampler "${this.label}": maxAnisotropy must be >= 1, got ${String(n.maxAnisotropy)}.`
      );
    this.descriptor = n;
    const i = {
      label: this.label,
      addressModeU: Rr(n.addressModeU),
      addressModeV: Rr(n.addressModeV),
      addressModeW: Rr(n.addressModeW),
      magFilter: Bi(n.magFilter),
      minFilter: Bi(n.minFilter),
      mipmapFilter: Gm(n.mipmapFilter),
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
    this._disposed = !0, this.device.untrack(this);
  }
}
function ug(t) {
  return t instanceof Dn;
}
function hg(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function pg(t, e) {
  if (t instanceof Dn) return t.native;
  if (hg(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class no {
  label;
  source;
  defines;
  /** GLSL 自动包装开关：WGSL 没有版本指令与精度前言，这里只保存不生效。 */
  glsl;
  device;
  modulesByStage = /* @__PURE__ */ new Map();
  /** 原生模块 → 诊断。`getCompilationInfo()` 一次就够，编译结果不变，缓存下来避免重复查询。 */
  compilationInfos = /* @__PURE__ */ new Map();
  _disposed = !1;
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? `shader#${e.nextResourceId("shader")}`, this.source = Ss(r.code), this.defines = { ...r.defines ?? {} }, this.glsl = r.glsl ? { ...r.glsl } : {}, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
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
    return bt({
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
    this._disposed = !0, this.modulesByStage.clear(), this.compilationInfos.clear(), this.device.untrack(this);
  }
  /**
   * 编译诊断：直接转发 `GPUShaderModule.getCompilationInfo()`，并把 `GPUCompilationMessage`
   * 归一成后端无关的 {@link CompilationInfo}。
   *
   * 两条「如实说明」的规则：
   * 1. `GPUCompilationMessage.lineNum` / `linePos` 用 **0 表示未知**，这里归一成 `null`，
   *    免得和「第 0 行」混淆；
   * 2. 实现没有暴露 `getCompilationInfo()` 时返回一条 `info` 级 message 说明原因，
   *    而不是返回「0 条诊断」让人误以为编译干净。
   */
  async getCompilationInfo(e = C.Vertex) {
    const r = this.compile(e), n = this.compilationInfos.get(r);
    if (n) return n;
    const i = r;
    if (typeof i.getCompilationInfo != "function") {
      const o = xe({
        label: this.label,
        backend: "webgpu",
        messages: [
          Se({
            type: "info",
            message: "this WebGPU implementation does not expose GPUShaderModule.getCompilationInfo(); shader diagnostics are unavailable on this backend",
            label: this.label,
            backend: "webgpu"
          })
        ]
      });
      return this.compilationInfos.set(r, o), o;
    }
    const s = await i.getCompilationInfo(), a = xe({
      label: this.label,
      backend: "webgpu",
      messages: s.messages.map(
        (o) => Se({
          type: dg(o.type),
          message: o.message,
          lineNum: o.lineNum,
          linePos: o.linePos,
          label: this.label,
          backend: "webgpu",
          stage: e
        })
      )
    });
    return this.compilationInfos.set(r, a), a;
  }
}
function dg(t) {
  return t === "error" || t === "warning" || t === "info" ? t : "info";
}
function pt(t, e) {
  if (t instanceof no) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${ee(t)}.`
  );
}
const re = "timestamp-query", Ze = [
  "timestamp-query-inside-passes",
  "chromium-experimental-timestamp-query-inside-passes"
];
class io {
  label;
  type;
  count;
  native;
  device;
  _disposed = !1;
  constructor(e, r) {
    if (this.device = e, this.label = r.label ?? e.nextResourceId("querySet"), !Number.isInteger(r.count) || r.count <= 0)
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(r.count)}.`
      );
    if (r.type === Je.Timestamp && !e.hasEnabledFeature(re))
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${re}" device feature, but it is not enabled on this device. Pass it in DeviceDescriptor.requiredFeatures (available on the adapter: ${e.features.has(re) ? "yes" : "no"}).`
      );
    this.type = r.type, this.count = r.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: km(r.type),
      count: r.count
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
function wt(t, e) {
  if (t instanceof io) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const r = t;
    if (typeof r.destroy == "function" && typeof r.count == "number")
      return t;
  }
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
function so(t, e, r) {
  if (Ts(t, r), !e.hasEnabledFeature(re))
    throw new u(
      `[gpu-device-api] ${r}: writing timestamps inside a pass needs the "${re}" device feature, but it is not enabled on this device.`
    );
  if (Ze.find((s) => e.hasEnabledFeature(s)) === void 0)
    throw new u(
      `[gpu-device-api] ${r}: this WebGPU implementation does not enable "${Ze[0]}" (tried: ${Ze.join(", ")}), so timestamps cannot be written inside a pass. Use CommandEncoder.writeTimestamp() around the pass instead, which only needs "timestamp-query" (that is what gfx GPU timing does).`
    );
  const i = {
    querySet: wt(t.querySet, `${r}.querySet`)
  };
  return t.beginningOfPassWriteIndex !== void 0 && (i.beginningOfPassWriteIndex = t.beginningOfPassWriteIndex), t.endOfPassWriteIndex !== void 0 && (i.endOfPassWriteIndex = t.endOfPassWriteIndex), i;
}
class fg {
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
      const e = await this.readback.mapAsync("read"), r = new BigUint64Array(e.slice(0));
      return this.readback.unmap(), r;
    } finally {
      this.readback.destroy(), this.staging.destroy();
    }
  }
}
class ao {
  label;
  entries;
  sortedEntries;
  native;
  device;
  byBinding;
  _disposed = !1;
  constructor(e, r) {
    this.device = e, this.label = r.label ?? `bindGroupLayout#${e.nextResourceId("bindGroupLayout")}`;
    let n;
    try {
      n = $s(r.entries);
    } catch (s) {
      throw new u(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = n, this.entries = r.entries, this.byBinding = new Map(n.map((s) => [s.binding, s]));
    const i = n.map(
      (s) => mg(s, e, this.label)
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
function mg(t, e, r) {
  const n = `BindGroupLayout "${r}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: Lm(t.visibility)
  };
  if (bs(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new u(
        `[gpu-device-api] ${n}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: Vm(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (ws(t.type)) {
    const s = t.sampler ?? {}, a = Nm(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : qm(s.type)
    }, i;
  }
  if (t.type === k.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new u(
        `[gpu-device-api] ${n}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: Wm(a),
      viewDimension: nn(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === k.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new u(
        `[gpu-device-api] ${n}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return ja(s.format, e.features, n), i.storageTexture = {
      access: zm(s.access ?? "write-only"),
      format: J(s.format),
      viewDimension: nn(s.viewDimension ?? "2d")
    }, i;
  }
  throw new u(
    `[gpu-device-api] ${n}: unsupported BindingType "${String(t.type)}".`
  );
}
function oo(t, e) {
  if (t instanceof ao) return t.native;
  if (gg(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function gg(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class lo {
  label;
  layout;
  entries;
  native;
  device;
  byBinding;
  _disposed = !1;
  constructor(e, r) {
    this.device = e, this.label = r.label ?? `bindGroup#${e.nextResourceId("bindGroup")}`, this.layout = r.layout, this.entries = r.entries, this.byBinding = new Map(r.entries.map((s) => [s.binding, s]));
    for (const s of r.entries)
      if (!this.layout.entry(s.binding))
        throw new u(
          `[gpu-device-api] BindGroup "${this.label}": binding ${s.binding} is not declared by layout "${this.layout.label}".`
        );
    const n = oo(this.layout, `BindGroup "${this.label}"`), i = r.entries.map(
      (s) => bg(s, this.layout, e, this.label)
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
    this._disposed = !0, this.device.untrack(this);
  }
}
function bg(t, e, r, n) {
  const i = `BindGroup "${n}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new u(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (bs(s.type)) {
    if (!("buffer" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${ee(a)}.`
      );
    const o = V(a.buffer, i), l = a.offset ?? 0, c = a.size ?? a.buffer.size - l;
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
  if (ws(s.type)) {
    if (!("sampler" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${ee(a)}.`
      );
    const o = a.sampler, l = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (ug(o)) {
      if (l && !o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!l && o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: pg(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${ee(a)}.`
      );
    return wg(a.view, s, r, i), { binding: t.binding, resource: ht(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${ee(a)}.`
      );
    if (eo(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && J(a.view.format) !== J(o))
        throw new u(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: ht(a.view, i) };
  }
  if ("source" in a) {
    const o = a.source;
    if (o && typeof o == "object" && o.expired === !0)
      throw new u(
        `[gpu-device-api] ${i}: the external texture bound as { source } has expired. GPUExternalTexture is valid for a single frame — call device.importExternalTexture() again and create a new bind group for every frame (see ExternalTexture in the core docs).`
      );
    return { binding: t.binding, resource: cg(a.source, i) };
  }
  throw new u(
    `[gpu-device-api] ${i}: unsupported binding resource ${ee(a)}.`
  );
}
function wg(t, e, r, n) {
  if (!eo(t)) return;
  const i = e.texture ?? {}, s = t.format, a = Ge(s), o = i.sampleType ?? "float";
  if (o === "depth") {
    if (a.sampleScalar !== "depth")
      throw new u(
        `[gpu-device-api] ${n}: layout expects a depth texture, but the bound view has format "${s}".`
      );
  } else if (o === "uint" || o === "sint") {
    if (a.sampleScalar !== o)
      throw new u(
        `[gpu-device-api] ${n}: layout expects a "${o}" sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
  } else {
    if (a.sampleScalar !== "float")
      throw new u(
        `[gpu-device-api] ${n}: layout expects a float sample type, but the bound view has format "${s}" (${a.sampleScalar}).`
      );
    if (o === "float" && !za(s, r.features))
      throw new u(
        `[gpu-device-api] ${n}: layout declares sampleType "float" (filterable), but "${s}" is not filterable on this device; declare "unfilterable-float" or enable the required feature.`
      );
  }
  const l = t.texture.sampleCount > 1;
  if ((i.multisampled ?? !1) !== l)
    throw new u(
      `[gpu-device-api] ${n}: layout declares multisampled=${String(i.multisampled ?? !1)}, but the bound texture has sampleCount ${t.texture.sampleCount}.`
    );
  const c = i.viewDimension ?? "2d";
  if (c !== t.descriptor.dimension)
    throw new u(
      `[gpu-device-api] ${n}: layout declares viewDimension "${c}", but the bound view is "${t.descriptor.dimension}".`
    );
}
const co = Object.freeze([]), ki = /* @__PURE__ */ new WeakMap();
function yg(t, e) {
  const r = ki.get(t);
  if (r) return r;
  const n = [], i = [];
  for (const a of t.sortedEntries) {
    if (a.buffer?.hasDynamicOffset !== !0) continue;
    const o = a.type === "uniform";
    n.push(
      o ? e.limits.minUniformBufferOffsetAlignment : e.limits.minStorageBufferOffsetAlignment
    ), i.push(o ? "minUniformBufferOffsetAlignment" : "minStorageBufferOffsetAlignment");
  }
  const s = { count: n.length, alignments: n, limitNames: i };
  return ki.set(t, s), s;
}
function uo(t, e, r, n) {
  const i = yg(t.layout, r);
  if (i.count === 0) {
    if (e !== void 0 && e.length > 0)
      throw new u(
        `[gpu-device-api] ${n}: bind group "${t.label}" has no entry with hasDynamicOffset, but ${e.length} dynamic offset(s) were supplied.`
      );
    return;
  }
  if (e === void 0 || e.length !== i.count)
    throw new u(
      `[gpu-device-api] ${n}: bind group "${t.label}" needs ${i.count} dynamic offset(s) (declaration order of the entries with hasDynamicOffset), got ${e ? e.length : 0}.`
    );
  for (let s = 0; s < i.count; s++) {
    const a = e[s], o = i.alignments[s];
    if (!Number.isInteger(a) || a < 0)
      throw new u(
        `[gpu-device-api] ${n}: dynamic offset #${s} must be a non-negative integer, got ${String(a)}.`
      );
    if (a % o !== 0)
      throw new u(
        `[gpu-device-api] ${n}: dynamic offset #${s} (${a}) must be a multiple of ${o} (${i.limitNames[s]}).`
      );
  }
}
function ho(t, e) {
  if (t instanceof lo) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class yt {
  label;
  bindGroupLayouts;
  /** `'auto'` 时为字符串 `'auto'`，否则为 `GPUPipelineLayout`。 */
  native;
  isAuto;
  /** 由 `device.createPipelineLayout()` 创建时有值；`auto` 替身没有设备（也未被追踪）。 */
  device;
  _disposed = !1;
  constructor(e, r, n, i, s) {
    this.label = e, this.bindGroupLayouts = r, this.native = n, this.isAuto = i, this.device = s;
  }
  /** 创建显式 layout。 */
  static create(e, r) {
    const n = r.label ?? `pipelineLayout#${e.nextResourceId("pipelineLayout")}`;
    if (r.bindGroupLayouts.length > e.limits.maxBindGroups)
      throw new u(
        `[gpu-device-api] PipelineLayout "${n}": ${r.bindGroupLayouts.length} bind group layouts exceed maxBindGroups (${e.limits.maxBindGroups}).`
      );
    const i = e.native.createPipelineLayout({
      label: n,
      bindGroupLayouts: r.bindGroupLayouts.map(
        (s) => oo(s, `PipelineLayout "${n}"`)
      )
    });
    return new yt(n, r.bindGroupLayouts, i, !1, e);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new yt(e, [], "auto", !0, null);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0, this.device?.untrack(this);
  }
}
function po(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof yt) return t.native;
  const r = t.native;
  if (r === "auto") return "auto";
  if (r && typeof r == "object") return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const vg = "uint32";
class ae {
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
    const n = e?.topology ?? vr.topology, i = {
      topology: Rm(n),
      frontFace: Um(e?.frontFace ?? vr.frontFace),
      cullMode: Om(e?.cullMode ?? vr.cullMode)
    };
    if (Fm(n))
      i.stripIndexFormat = Ha(e?.stripIndexFormat ?? vg);
    else if (e?.stripIndexFormat !== void 0)
      throw new u(
        `[gpu-device-api] PrimitiveState.stripIndexFormat is only valid for strip topologies, but the topology is "${n}".`
      );
    if (e?.unclippedDepth) {
      if (r && !r.has("depth-clip-control"))
        throw new u(
          '[gpu-device-api] PrimitiveState.unclippedDepth needs the "depth-clip-control" device feature.'
        );
      i.unclippedDepth = !0;
    }
    return i;
  }
  /**
   * 这条管线**是否使用 depth / stencil**（WebGPU 侧唯一的判定入口）。
   *
   * 语义（两个后端必须一致，WebGL2 的对应实现在 `WebGL2RenderState.resolveRenderState()`）：
   *
   * - `depthStencil` **未声明**：这条管线不使用深度/模板；
   * - `depthStencil: { format: null }`：同上，**明确**不使用（例如纯 2D 叠加、画天空的全屏三角形）；
   * - `depthStencil` 已声明且 `format` 不是 `null`（含省略 `format` 的写法）：使用深度/模板，
   *   此时缺省字段才落到 `DEFAULT_DEPTH_STATE`，深度格式由当前 render target 提供。
   *
   * 为什么必须集中成一个判断：`WebGPURenderPipeline` 在**两个地方**都要用它 —— 解析 variant 时
   * 校验「这条管线至少写了点什么」，以及真正翻译 `GPUDepthStencilState` 时决定用哪套字段
   * （见 {@link toGPUDepthStencilState}）。两处给不同答案就会退化成「静默写深度」那种缺陷。
   *
   * 为什么不能按「variant 里有 depth 格式」来判断是否使用深度：variant 的 depth 格式来自**当前
   * render target**，画布路径几乎总是带深度附件 —— 一条明确不要深度的管线照样会拿到
   * `depth24plus`。历史缺陷正是从这里来的：`{ format: null }` 落到了
   * `depthWriteEnabled: true` + `depthCompare: 'less'`，于是画天空的全屏三角形
   * （`gl_Position` 深度为 0）把整个深度缓冲写成 0，其后所有几何体的 `less` 全部失败，
   * 画面上只剩那一个元素、且**没有任何报错**。
   */
  static usesDepthStencil(e) {
    return e !== void 0 && e.format !== null;
  }
  /**
   * 把 core 的 `DepthStencilState` 翻译为 WebGPU 的 `GPUDepthStencilState`。
   *
   * `format` 由调用方给出（core 允许省略，此时用 render target 的 depth 格式）。
   *
   * **这条管线不使用深度**时（见 {@link usesDepthStencil}）不会返回 `null`，而是返回一个
   * 「恒通过、不写」的状态，理由有两条：
   *
   * 1. WebGPU 的 **attachment state** 要求管线与 render pass 的深度附件格式**一致**：pass 里有
   *    `depthStencilAttachment` 时，一条没有 `depthStencil` 状态的管线会直接校验失败
   *    （实测原文：`Attachment state of [RenderPipeline ...] is not compatible with
   *    [RenderPassEncoder ...]`，而且整条 command buffer 作废 —— 画面全黑、只在设备错误里看得到）。
   *    画布路径几乎总是带深度附件，所以「干脆不挂」这条路走不通。
   * 2. `depthCompare: 'always'` + `depthWriteEnabled: false` 与 GL 里**关掉 `DEPTH_TEST`** 完全等价：
   *    片元恒通过、且不更新深度缓冲。这正是 `{ format: null }` / 未声明 `depthStencil` 的语义，
   *    也修正了历史上「回落成 `depthWriteEnabled: true` + `less`」的缺陷（画天空的全屏三角形
   *    `gl_Position` 深度为 0，会把整个深度缓冲写成 0，其后所有几何体的 `less` 全部失败，
   *    画面上只剩它自己而且没有任何报错）。
   *
   * 模板面同理：`always` + `keep`（{@link STENCIL_FACE_DEFAULT}）等价于 GL 关掉 `STENCIL_TEST`。
   */
  static toGPUDepthStencilState(e, r) {
    const n = Wa(e), i = gr(e);
    if (!n && !i)
      throw new u(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: J(e) };
    return ae.usesDepthStencil(r) ? (n && (s.depthWriteEnabled = r?.depthWriteEnabled ?? Wn.depthWriteEnabled, s.depthCompare = nr(r?.depthCompare ?? Wn.depthCompare)), i && (s.stencilFront = Dt(r?.stencilFront), s.stencilBack = Dt(r?.stencilBack), s.stencilReadMask = r?.stencilReadMask ?? 4294967295, s.stencilWriteMask = r?.stencilWriteMask ?? 4294967295), r?.depthBias !== void 0 && (s.depthBias = r.depthBias), r?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = r.depthBiasSlopeScale), r?.depthBiasClamp !== void 0 && (s.depthBiasClamp = r.depthBiasClamp), s) : (n && (s.depthWriteEnabled = !1, s.depthCompare = nr("always")), i && (s.stencilFront = Dt(void 0), s.stencilBack = Dt(void 0), s.stencilReadMask = 4294967295, s.stencilWriteMask = 0), s);
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, r) {
    const n = St(e?.count ?? r, "MultisampleState.count"), i = { count: n, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
    if (s && n === 1)
      throw new u(
        "[gpu-device-api] MultisampleState.alphaToCoverageEnabled requires sampleCount > 1."
      );
    return s && (i.alphaToCoverageEnabled = !0), i;
  }
  /** 把 core 的 `BlendState` 翻译为 WebGPU 的 `GPUBlendState`。 */
  static toGPUBlendState(e) {
    if (e)
      return {
        color: Vi(e.color),
        alpha: Vi(e.alpha)
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
      throw new u(
        `[gpu-device-api] RenderPipeline: fragment.targets has ${r.length} entries but the render target has ${e.length} color attachments.`
      );
    return e.map((i, s) => {
      const a = r ? r[s] : void 0;
      if (a === null) return null;
      const o = { format: J(a?.format ?? i) }, l = a?.blend ?? n.blend;
      l && (o.blend = ae.toGPUBlendState(l));
      const c = a?.writeMask ?? n.writeMask;
      return c !== void 0 && (o.writeMask = _m(c)), o;
    });
  }
  /** 校验并翻译 vertex buffer layout 列表。 */
  static toGPUVertexBufferLayouts(e, r) {
    if (e.length > r.maxVertexBuffers)
      throw new u(
        `[gpu-device-api] RenderPipeline: ${e.length} vertex buffer layouts exceed maxVertexBuffers (${r.maxVertexBuffers}).`
      );
    return e.map((n) => {
      try {
        Es(n, r);
      } catch (i) {
        throw new u(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: n.arrayStride,
        stepMode: Im(n.stepMode ?? "vertex"),
        attributes: n.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: Dm(i.format)
        }))
      };
    });
  }
}
function Vi(t) {
  const e = { ...Xo, ...t };
  return {
    operation: Bm(e.operation ?? "add"),
    srcFactor: Fi(e.srcFactor),
    dstFactor: Fi(e.dstFactor)
  };
}
function Dt(t) {
  return {
    compare: nr(t?.compare ?? ve.compare),
    failOp: Mr(t?.failOp ?? ve.failOp),
    depthFailOp: Mr(t?.depthFailOp ?? ve.depthFailOp),
    passOp: Mr(t?.passOp ?? ve.passOp)
  };
}
class xg {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, r) {
    this.cache = ln(e, (n, i) => {
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
function Or(t) {
  return Ps(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    As(t.vertexLayouts)
  );
}
const Sg = "vsMain", Tg = "fsMain", Ur = Object.freeze({}), $g = [], Eg = [], Ni = 4;
class kn {
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
  /** `#39`：构造时是否由本管线合成了 layout（合成的那份由本管线负责释放）。 */
  ownsLayout;
  /** `defaultColorFormats()` 的结果只依赖 readonly descriptor，缓存后避免每次解析都新建数组。 */
  defaultColorFormatsCache = null;
  /**
   * 变体解析结果的二级缓存，**最近使用优先**：下标 0 就是原来那条「上一次命中」快速路径。
   *
   * 为什么需要多于一条：同一个材质常常交替服务两个 target（画布通道 + 离屏通道，
   * colorFormats / sampleCount / depthFormat 都不同），而每个 render pass 各自持有一个
   * `variantRequest` 对象。只记一条的话，两个 pass 交替 draw 时**每一次**都要重新解析、
   * 重新拼 cache key；记住最近用过的几条即可覆盖这种模式。
   *
   * 容量固定为 {@link VARIANT_MEMO_LIMIT}：这是缓存而不是「记住所有变体」。真正的原生管线
   * 缓存是 `this.cache`（64 条 LRU）：即使某个变体被挤出这里，也不会重建 GPU 对象。
   */
  variantMemo = [];
  constructor(e, r) {
    this.device = e, this.descriptor = r, this.label = r.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`;
    const n = _s(
      r.layout,
      (i) => this.device.createPipelineLayout({
        label: `${this.label}:inlinePipelineLayout`,
        bindGroupLayouts: i
      }),
      `WebGPUDevice.createRenderPipeline("${this.label}").layout`
    );
    this.layout = n.layout, this.ownsLayout = n.synthesized !== null, this.vertexLayouts = r.vertex.buffers ?? null, this.logger = rt(`webgpu:${this.label}`), this.sampleCountContext = `RenderPipeline "${this.label}": sampleCount`, this.cache = new xg(64, (i, s) => {
      this.logger.debug(`evicted render pipeline variant ${s}`);
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
   *（见 `WebGPURenderPassEncoder` 的 `variantRequest`），因此这里按「入参身份 + 字段身份」
   * 复用已解析的结果与 cache key：命中时不再新建 resolved 对象、不再 `join` colorFormats、
   * 也不再重算 vertex layout key —— 这些原本都在每 draw 的路径上。
   *
   * 复用范围是最近用过的 {@link VARIANT_MEMO_LIMIT} 条（见 {@link variantMemo}），而不是只有
   * 上一次：两个 target 交替 draw 时，只记一条会让每一次 draw 都掉进解析路径。
   */
  resolve(e = Ur) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`
      );
    const r = this.findVariantMemo(e);
    let n, i;
    return r !== null ? (n = r.resolved, i = r.key) : (n = this.resolveVariant(e), i = Or(n), this.rememberVariant(e, n, i)), this.cache.resolve(i, () => this.createNative(n));
  }
  /**
   * 在二级缓存里找与 `variant` 等价的条目；命中时把它提到最前（最近使用优先）。
   *
   * 判定与原来的单条快速路径**逐字段相同**：入参对象身份 + colorFormats / sampleCount /
   * depthFormat / vertexLayouts 四个字段的对象身份。用身份而不是值比较是有意的（与改动前一致）：
   * 调用方在一个 pass 内复用同一个请求对象，这里每次只做几次身份比较，不算 key、不建对象。
   */
  findVariantMemo(e) {
    const r = this.variantMemo;
    for (let n = 0; n < r.length; n += 1) {
      const i = r[n];
      if (e === i.input && e.colorFormats === i.colorFormats && e.sampleCount === i.sampleCount && e.depthFormat === i.depthFormat && e.vertexLayouts === i.vertexLayouts)
        return n > 0 && (r.splice(n, 1), r.unshift(i)), i;
    }
    return null;
  }
  /**
   * 记住一次解析结果；超出容量时丢掉最久未使用的那条。
   *
   * 条目里保存的是调用方的入参对象引用（最多 4 个，且本来就是每个 pass 一个的小对象），
   * 不会拦住任何 render pass 的回收。
   */
  rememberVariant(e, r, n) {
    const i = this.variantMemo;
    i.unshift({
      input: e,
      colorFormats: e.colorFormats,
      sampleCount: e.sampleCount,
      depthFormat: e.depthFormat,
      vertexLayouts: e.vertexLayouts,
      resolved: r,
      key: n
    }), i.length > Ni && (i.length = Ni);
  }
  /** 已经被编译过的 variant 的 cache key；主要用于诊断。 */
  get compiledVariants() {
    return this.cache.keys();
  }
  /**
   * 异步预热一个 variant：优先 `createRenderPipelineAsync()`。
   *
   * 为什么这不只是「再调用一次 resolve()」：`createRenderPipeline` 是**同步**返回的，
   * 驱动在后台编译，第一次真正使用这条管线的那一帧要为编译付掉卡顿；
   * `createRenderPipelineAsync` 会等到编译完成才 resolve，于是这段等待落在预热调用里
   *（可以在加载界面、下一帧之前、甚至 `requestIdleCallback` 里做），而不是落在渲染循环里。
   *
   * 预热出来的原生管线会**写进与 `resolve()` 相同的 variant 缓存**，所以首次使用该 variant 时
   * `resolve()` 直接命中、不再产生任何 GPU 编译调用。
   *
   * 实现缺失 `createRenderPipelineAsync` 时退化成同步创建，`mode` 为 `'sync'` 且 `reason`
   * 说明原因 —— 不会假装异步。编译失败同样不抛错（除非 `throwOnError`），诊断在 `info` 里。
   */
  async prewarm(e = Ur, r = {}) {
    const n = N();
    if (this._disposed)
      throw new u(`[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`);
    const i = this.resolveVariant(e), s = Or(i);
    if (this.cache.has(s)) {
      const b = await this.getCompilationInfo();
      return {
        label: this.label,
        backend: "webgpu",
        ok: !b.hasErrors,
        mode: "async",
        reason: null,
        durationMs: N() - n,
        info: b
      };
    }
    const a = this.toGPURenderPipelineDescriptor(i), o = this.device.native, l = o.createRenderPipelineAsync;
    let c = "async", h = null, d = null, p = null;
    typeof l != "function" && (c = "sync", h = "this WebGPU implementation does not expose GPUDevice.createRenderPipelineAsync(), so the pipeline was created synchronously and the compile cost stayed on the calling thread");
    try {
      typeof l == "function" ? d = await Ls(
        l.call(o, a),
        r.timeoutMs ?? un,
        `createRenderPipelineAsync("${this.label}")`
      ) : d = this.device.native.createRenderPipeline(a);
    } catch (b) {
      p = b instanceof Error ? b.message : String(b), h === null && (h = p);
    }
    d !== null && !this.cache.has(s) && this.cache.set(s, d);
    const f = await this.collectCompilationInfo(p), m = d !== null && p === null, g = {
      label: this.label,
      backend: "webgpu",
      ok: m,
      mode: c,
      // 成功且是真异步时没有需要解释的东西；退化路径与失败路径都必须给出原因。
      reason: m ? c === "sync" ? h : null : p ?? "shader compilation reported errors",
      durationMs: N() - n,
      info: f
    };
    if (!g.ok && r.throwOnError)
      throw new u(cn(f));
    return g;
  }
  /**
   * 编译诊断：把 vertex / fragment 两个 `GPUShaderModule` 的 `getCompilationInfo()` 合起来。
   *
   * WGSL 一份源码包含所有 entry point，诊断内容与 variant 无关，所以这里不需要 variant 参数
   *（保留它只是为了与 `resolve()` / `prewarm()` 的签名对齐）。
   */
  async getCompilationInfo(e = Ur) {
    return this.collectCompilationInfo(null);
  }
  /** 取两个阶段的诊断并合并；`failure` 是 `createRenderPipelineAsync` 抛出的原文。 */
  async collectCompilationInfo(e) {
    const r = [], n = /* @__PURE__ */ new Set(), i = async (o, l, c) => {
      if (n.has(o)) return;
      n.add(o);
      const h = pt(o, c);
      typeof h.getCompilationInfo == "function" && r.push(await h.getCompilationInfo(l));
    };
    await i(this.descriptor.vertex.module, C.Vertex, `RenderPipeline "${this.label}".vertex.module`);
    const s = this.descriptor.fragment;
    s && await i(
      s.module,
      C.Fragment,
      `RenderPipeline "${this.label}".fragment.module`
    );
    const a = Zo(this.label, "webgpu", r);
    return e === null ? a : {
      ...a,
      messages: [
        ...a.messages,
        Se({
          type: "error",
          message: e,
          label: this.label,
          backend: "webgpu"
        })
      ],
      hasErrors: !0
    };
  }
  /** 释放缓存（`GPURenderPipeline` 没有 destroy）。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.cache.dispose(), this.variantMemo.length = 0, this.ownsLayout && this.layout !== "auto" && this.layout.dispose(), this.device.untrack(this));
  }
  resolveVariant(e) {
    const r = this.descriptor, n = e.colorFormats ?? this.defaultColorFormats(), i = St(
      e.sampleCount ?? r.multisample?.count ?? r.render?.multisample?.count ?? 1,
      this.sampleCountContext
    ), s = e.depthFormat !== void 0 ? e.depthFormat : r.depthStencil?.format ?? null, a = r.depthStencil ?? r.render?.depthStencil, o = e.vertexLayouts ?? this.vertexLayouts ?? $g;
    if (r.fragment && n.length === 0)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. Declare \`colorFormats\` on the descriptor, or pass them per target via resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.`
      );
    if (!r.fragment && (s === null || !ae.usesDepthStencil(a)))
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depthStencil state, so WebGPU cannot create a pipeline that writes to nothing. Declare \`depthStencil\` (for a depth-only pipeline, e.g. { depthWriteEnabled: true } — its format comes from the render target) or add a fragment stage. Note that omitting \`depthStencil\` or passing \`{ format: null }\` means "this pipeline does not use depth", it does not enable depth testing.`
      );
    o.length === 0 && !this.warnedMissingVertexLayouts && (this.warnedMissingVertexLayouts = !0, this.logger.debug(
      "building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes"
    ));
    for (const l of n)
      J(l);
    return s !== null && J(s), { colorFormats: n, sampleCount: i, depthFormat: s, vertexLayouts: o };
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
    const { descriptor: r } = this;
    let n;
    if (r.colorFormats)
      n = r.colorFormats;
    else if (r.render?.colorFormats)
      n = r.render.colorFormats;
    else {
      const i = r.fragment?.targets, s = [];
      if (i)
        for (const a of i) {
          if (a?.format === void 0) break;
          s.push(a.format);
        }
      n = i && s.length === i.length ? s : Eg;
    }
    return this.defaultColorFormatsCache = n, n;
  }
  createNative(e) {
    const r = this.toGPURenderPipelineDescriptor(e);
    return this.logger.debug(`creating render pipeline variant ${Or(e)}`), this.device.native.createRenderPipeline(r);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const r = this.descriptor, n = this.device.limits, i = r.vertex, a = {
      module: pt(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(C.Vertex),
      entryPoint: i.entryPoint ?? Sg,
      buffers: ae.toGPUVertexBufferLayouts(e.vertexLayouts, n)
    }, o = r.fragment;
    let l;
    o && (l = {
      module: pt(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(C.Fragment),
      entryPoint: o.entryPoint ?? Tg,
      targets: ae.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: r.render?.blend,
        writeMask: r.render?.writeMask
      })
    });
    const c = r.primitive ?? r.render?.primitive, h = r.depthStencil ?? r.render?.depthStencil, d = r.multisample ?? r.render?.multisample, p = e.depthFormat, f = {
      label: this.label,
      layout: po(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: ae.toGPUPrimitiveState(c, this.device.features),
      multisample: ae.toGPUMultisampleState(d, e.sampleCount)
    };
    return l && (f.fragment = l), p !== null ? (f.depthStencil = ae.toGPUDepthStencilState(p, h), h && !ae.usesDepthStencil(h) && this.logger.debug("depthStencil declared without a format; emitting an always-pass, no-write state")) : h && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), f;
  }
}
function Ag(t, e, r) {
  if (t instanceof kn) return t.resolve(r);
  const n = t?.native;
  if (n && typeof n == "object" && typeof n.getBindGroupLayout == "function")
    return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const Pg = "csMain";
class fo {
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
      throw new u(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
    return this._native ? this._native : (this._native = this.device.native.createComputePipeline(this.toGPUComputePipelineDescriptor()), this._native);
  }
  /** GPUComputePipeline 没有 destroy；释放只是清掉缓存并标记不可用。 */
  dispose() {
    this._disposed || (this._disposed = !0, this._native = null, this.device.untrack(this));
  }
  /**
   * 异步预热：优先 `createComputePipelineAsync()`。
   *
   * 预热结果写进与 `resolve()` 相同的 `_native` 字段，所以之后第一次真正使用这条 compute
   * 管线时不再触发 GPU 编译。实现缺失 `createComputePipelineAsync` 时退化成同步创建，
   * `mode` 为 `'sync'`、`reason` 说明原因。失败不抛错（除非 `throwOnError`），诊断在 `info` 里。
   */
  async prewarm(e = {}) {
    const r = N();
    if (this._disposed)
      throw new u(`[gpu-device-api] ComputePipeline "${this.label}" has been disposed.`);
    if (this._native !== null) {
      const f = await this.getCompilationInfo();
      return {
        label: this.label,
        backend: "webgpu",
        ok: !f.hasErrors,
        mode: "async",
        reason: null,
        durationMs: N() - r,
        info: f
      };
    }
    const n = this.toGPUComputePipelineDescriptor(), i = this.device.native, s = i.createComputePipelineAsync;
    let a = "async", o = null, l = null, c = null;
    typeof s != "function" && (a = "sync", o = "this WebGPU implementation does not expose GPUDevice.createComputePipelineAsync(), so the pipeline was created synchronously and the compile cost stayed on the calling thread");
    try {
      typeof s == "function" ? l = await Ls(
        s.call(i, n),
        e.timeoutMs ?? un,
        `createComputePipelineAsync("${this.label}")`
      ) : l = this.device.native.createComputePipeline(n);
    } catch (f) {
      c = f instanceof Error ? f.message : String(f), o === null && (o = c);
    }
    l !== null && this._native === null && (this._native = l);
    const h = await this.collectCompilationInfo(c), d = l !== null && c === null, p = {
      label: this.label,
      backend: "webgpu",
      ok: d,
      mode: a,
      reason: d ? a === "sync" ? o : null : c ?? "shader compilation reported errors",
      durationMs: N() - r,
      info: h
    };
    if (!p.ok && e.throwOnError)
      throw new u(cn(h));
    return p;
  }
  /** 编译诊断：转发 `GPUShaderModule.getCompilationInfo()`。 */
  async getCompilationInfo() {
    return this.collectCompilationInfo(null);
  }
  /** 组装 `GPUComputePipelineDescriptor`（预热与 `resolve()` 走同一份，避免两处漂移）。 */
  toGPUComputePipelineDescriptor() {
    const e = pt(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    );
    return {
      label: this.label,
      layout: po(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(C.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? Pg
      }
    };
  }
  async collectCompilationInfo(e) {
    const r = pt(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    ), n = typeof r.getCompilationInfo == "function" ? await r.getCompilationInfo(C.Compute) : Ko(this.label, "webgpu");
    return e === null ? n : {
      ...n,
      messages: [
        ...n.messages,
        Se({
          type: "error",
          message: e,
          label: this.label,
          backend: "webgpu"
        })
      ],
      hasErrors: !0
    };
  }
}
function Lg(t, e) {
  if (t instanceof fo) return t.resolve();
  const r = t?.native;
  if (r && typeof r == "object") return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const _g = [0, 0, 0, 1];
class mo {
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
    const n = Cg(r.color);
    if (this.colorFormatsList = n, this.depthFormatValue = r.depth === void 0 || r.depth === !1 || r.depth === null ? null : r.depth === !0 ? "depth24plus" : r.depth, this.sampleCountValue = St(r.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = r.mipLevelCount ?? 1, this.baseUsage = r.usage ?? 0, this.sampled = r.sampled ?? !1, this._width = kt(r.width, "width", this.label), this._height = kt(r.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !Io(this.depthFormatValue))
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
  /**
   * WebGPU 的原生行序：附件纹素 (0, 0) 在**左上角**，与 `Texture.ts` 的纹理约定天然一致。
   *
   * 所以这个后端不需要任何补偿；这个只读属性存在的意义是让跨后端代码能按
   * `target.rowOrder` 判断，而不是写 `backend === 'webgl2'`。
   */
  rowOrder = Cs.TopLeft;
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
      throw new u(`[gpu-device-api] RenderTarget "${this.label}" has been disposed.`);
    const n = kt(e, "width", this.label), i = kt(r, "height", this.label);
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
    const i = n === void 0 ? _g : n;
    return this.colorFormatsList.map((s, a) => {
      const o = this.multisampleViews[a], l = this.colorViews[a], c = {
        view: o ?? l,
        loadOp: e ?? "clear",
        storeOp: r ?? "store",
        clearValue: i
      };
      return o && (c.resolveTarget = l), c;
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
    return gr(this.depthFormatValue) && (n.stencilLoadOp = e ?? "clear", n.stencilStoreOp = "store", n.stencilClearValue = 0, n.stencilReadOnly = !1), n;
  }
}
function Cg(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function kt(t, e, r) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] RenderTarget "${r}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function Mg(t, e) {
  const r = t.label ?? "renderPass";
  let n, i;
  if (t.target) {
    if (!(t.target instanceof mo))
      throw new u(
        `[gpu-device-api] ${r}: descriptor.target must be a WebGPURenderTarget created by a WebGPU device.`
      );
    if (t.colorAttachments.length > 0)
      throw new u(
        `[gpu-device-api] ${r}: descriptor.target and a non-empty descriptor.colorAttachments were both given. Keep only one of them: use target to say "render into this render target", or use colorAttachments to name the attachments explicitly (pass an empty array alongside target).`
      );
    const p = t.target.createPassDescriptor({
      clearValue: t.clearValue,
      depthClearValue: t.depthClearValue
    });
    n = p.colorAttachments, i = p.depthStencilAttachment;
  } else
    n = t.colorAttachments, i = t.depthStencilAttachment ?? null;
  const s = [], a = [], o = [];
  let l = -1, c = -1;
  for (let p = 0; p < n.length; p += 1) {
    const f = n[p];
    if (!f) {
      a.push(null), c < 0 && (c = p);
      continue;
    }
    c >= 0 && l < 0 && (l = c);
    const m = ht(f.view, `${r}.colorAttachments`), g = f.view.texture;
    s.push(f.view.descriptor.format ?? g.format), o.push(g.sampleCount);
    const b = f.loadOp ?? "clear", w = f.storeOp ?? "store";
    if (g.sampleCount > 1 && !f.resolveTarget && w !== "discard")
      throw new u(
        `[gpu-device-api] ${r}: a multisampled color attachment (sampleCount ${g.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const y = {
      view: m,
      loadOp: Fr(b),
      storeOp: Br(w)
    };
    f.resolveTarget && (y.resolveTarget = ht(f.resolveTarget, `${r}.resolveTarget`)), b === "clear" && (y.clearValue = Za(f.clearValue)), a.push(y);
  }
  if (l >= 0)
    throw new u(
      `[gpu-device-api] ${r}: colorAttachments[${l}] is null, but a later entry is not null. The WebGPU backend builds pipeline variants from the dense list of non-null color formats (RenderPipelineVariant.colorFormats), so where a null slot sits cannot be expressed: the fragment targets of the following attachments would shift by one location, and e.g. [view, null] and [null, view] would resolve to the same GPURenderPipeline variant. Move the null slots to the end of colorAttachments (a trailing null maps correctly for every location that has an output), or give every slot a real attachment — for an unused location, render to a small throwaway texture instead.`
    );
  const h = { label: r, colorAttachments: a };
  let d = null;
  if (i) {
    const p = ht(i.view, `${r}.depthStencilAttachment`), f = i.view.descriptor.format ?? i.view.texture.format;
    d = f, o.push(i.view.texture.sampleCount);
    const m = { view: p }, g = i.depthLoadOp ?? "clear", b = i.depthStoreOp ?? "store";
    if (m.depthLoadOp = Fr(g), m.depthStoreOp = Br(b), g === "clear" && (m.depthClearValue = Fg(i.depthClearValue ?? 1, r)), i.depthReadOnly !== void 0 && (m.depthReadOnly = i.depthReadOnly), gr(f)) {
      const w = i.stencilLoadOp ?? g;
      m.stencilLoadOp = Fr(w), m.stencilStoreOp = Br(i.stencilStoreOp ?? "store"), w === "clear" && (m.stencilClearValue = i.stencilClearValue ?? 0), i.stencilReadOnly !== void 0 && (m.stencilReadOnly = i.stencilReadOnly);
    } else if (i.stencilLoadOp !== void 0 || i.stencilStoreOp !== void 0)
      throw new u(
        `[gpu-device-api] ${r}: depth format "${f}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    h.depthStencilAttachment = m;
  }
  return t.occlusionQuerySet && (h.occlusionQuerySet = wt(t.occlusionQuerySet, `${r}.occlusionQuerySet`)), t.timestampWrites && (h.timestampWrites = so(
    t.timestampWrites,
    e,
    `${r}.timestampWrites`
  )), {
    native: h,
    hasOcclusionQuerySet: t.occlusionQuerySet !== void 0,
    layout: {
      colorFormats: s,
      depthFormat: d,
      sampleCount: Rg(o, r)
    }
  };
}
function Rg(t, e) {
  if (t.length === 0) return 1;
  const r = t[0];
  for (const n of t)
    if (n !== r)
      throw new u(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return r;
}
function Fg(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new u(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class Bg {
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
  constructor(e, r, n, i, s, a) {
    this.device = e, this.native = r, this.layout = n, this.label = i, this.hasOcclusionQuerySet = s, this.onEnd = a;
    const o = `RenderPass "${i}"`;
    this.contextSetPipeline = `${o}.setPipeline`, this.contextSetBindGroup = `${o}.setBindGroup`, this.contextSetVertexBuffer = `${o}.setVertexBuffer`, this.contextSetIndexBuffer = `${o}.setIndexBuffer`, this.contextDrawIndirect = `${o}.drawIndirect`, this.contextDrawIndexedIndirect = `${o}.drawIndexedIndirect`, this.variantRequest = {
      colorFormats: n.colorFormats,
      sampleCount: n.sampleCount,
      depthFormat: n.depthFormat
    };
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(Ag(e, this.contextSetPipeline, this.variantRequest));
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), r) {
      uo(r, n, this.device, this.contextSetBindGroup), this.native.setBindGroup(
        e,
        ho(r, this.contextSetBindGroup),
        n ?? co
      );
      return;
    }
    if (n && n.length > 0)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  setVertexBuffer(e, r, n, i) {
    if (this.assertOpen("setVertexBuffer"), r === null) {
      this.native.setVertexBuffer(e, null, n, i);
      return;
    }
    this.native.setVertexBuffer(e, V(r, this.contextSetVertexBuffer), n, i);
  }
  setIndexBuffer(e, r, n, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      V(e, this.contextSetIndexBuffer),
      Ha(r),
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
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(Za(e));
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
    const n = Wi(e, r, this.contextDrawIndirect);
    this.native.drawIndirect(n.buffer, n.offset);
  }
  drawIndexedIndirect(e, r = 0) {
    this.assertOpen("drawIndexedIndirect");
    const n = Wi(e, r, this.contextDrawIndexedIndirect);
    this.native.drawIndexedIndirect(n.buffer, n.offset);
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
function Wi(t, e, r) {
  return "indirectBuffer" in t ? {
    buffer: V(t.indirectBuffer, r),
    offset: t.indirectOffset ?? 0
  } : { buffer: V(t, r), offset: e };
}
function Gg(t, e) {
  const r = t?.label ?? "computePass", n = { label: r };
  return t?.timestampWrites && (n.timestampWrites = so(
    t.timestampWrites,
    e,
    `${r}.timestampWrites`
  )), n;
}
class Og {
  label;
  native;
  device;
  onEnd;
  _ended = !1;
  /** 同 render pass：label 在生命周期内不变，报错用的 context 只建一次，避免每次调用现拼。 */
  contextSetPipeline;
  contextSetBindGroup;
  contextDispatchIndirect;
  constructor(e, r, n, i) {
    this.device = e, this.native = r, this.label = n, this.onEnd = i;
    const s = `ComputePass "${n}"`;
    this.contextSetPipeline = `${s}.setPipeline`, this.contextSetBindGroup = `${s}.setBindGroup`, this.contextDispatchIndirect = `${s}.dispatchWorkgroupsIndirect`;
  }
  get ended() {
    return this._ended;
  }
  setPipeline(e) {
    this.assertOpen("setPipeline"), this.native.setPipeline(Lg(e, this.contextSetPipeline));
  }
  setBindGroup(e, r, n) {
    if (this.assertOpen("setBindGroup"), r) {
      uo(r, n, this.device, this.contextSetBindGroup), this.native.setBindGroup(
        e,
        ho(r, this.contextSetBindGroup),
        n ?? co
      );
      return;
    }
    if (n && n.length > 0)
      throw new u(
        `[gpu-device-api] ComputePass "${this.label}".setBindGroup: dynamicOffsets were given without a bind group.`
      );
    this.native.setBindGroup(e, null);
  }
  dispatchWorkgroups(e, r = 1, n = 1) {
    this.assertOpen("dispatchWorkgroups"), this.native.dispatchWorkgroups(e, r, n);
  }
  dispatchWorkgroupsIndirect(e, r = 0) {
    this.assertOpen("dispatchWorkgroupsIndirect");
    const n = this.contextDispatchIndirect;
    if ("indirectBuffer" in e) {
      this.native.dispatchWorkgroupsIndirect(
        V(e.indirectBuffer, n),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(V(e, n), r);
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
class Ug {
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
    const { native: r, layout: n, hasOcclusionQuerySet: i } = Mg(e, this.device), s = e.label ?? this.label, a = new Bg(
      this.device,
      this.native.beginRenderPass(r),
      n,
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
    const r = Gg(e, this.device), n = e?.label ?? this.label, i = new Og(
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
      V(e, `${this.label}.copyBufferToBuffer(source)`),
      r,
      V(n, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, r, n) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: V(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      Vt(r, `${this.label}.copyBufferToTexture(destination)`),
      He(n)
    );
  }
  copyTextureToBuffer(e, r, n) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      Vt(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: V(r.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: r.offset ?? 0,
        bytesPerRow: r.bytesPerRow,
        rowsPerImage: r.rowsPerImage
      },
      He(n)
    );
  }
  copyTextureToTexture(e, r, n) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      Vt(e, `${this.label}.copyTextureToTexture(source)`),
      Vt(r, `${this.label}.copyTextureToTexture(destination)`),
      He(n)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, r = 0, n) {
    this.assertRecording("clearBuffer"), Te(r, `${this.label}.clearBuffer offset`);
    const i = n ?? e.size - r;
    if (r % 4 !== 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: offset must be a multiple of 4, got ${r}.`
      );
    if (i <= 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be positive, got ${i}.`
      );
    if (i % 4 !== 0)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: size must be a multiple of 4, got ${i}.`
      );
    if (r + i > e.size)
      throw new u(
        `[gpu-device-api] ${this.label}.clearBuffer: range [${r}, ${r + i}) exceeds the buffer size ${e.size}.`
      );
    this.native.clearBuffer(
      V(e, `${this.label}.clearBuffer`),
      r,
      i
    );
  }
  /**
   * 把 query set 的一段结果解析进 `destination`（需要 `BufferUsage.QueryResolve`）。
   *
   * 注意读回路径：`MAP_READ` 不能与 `QUERY_RESOLVE` 组合，所以想读回必须再
   * `copyBufferToBuffer` 到一个 `MAP_READ | COPY_DST` 的 buffer（`Device.readQuerySet()` 已经封装好）。
   */
  resolveQuerySet(e, r, n, i, s) {
    this.assertRecording("resolveQuerySet");
    const a = `${this.label}.resolveQuerySet`;
    Te(r, `${a} firstQuery`), et(n, `${a} queryCount`), Te(s, `${a} destinationOffset`), this.native.resolveQuerySet(
      wt(e, `${a}(querySet)`),
      r,
      n,
      V(i, `${a}(destination)`),
      s
    );
  }
  /**
   * 在命令流里写一个 GPU 时间戳（只需要 `timestamp-query`，不需要 `timestamp-query-inside-passes`）。
   *
   * 必须在任何 pass **之外**调用：WebGPU 规定 encoder 上写时间戳时不能有打开的 pass。
   * 未启用 feature、或实现没有暴露这个方法时明确报错（后者实测存在于部分实现里）。
   */
  writeTimestamp(e, r) {
    this.assertRecording("writeTimestamp");
    const n = `${this.label}.writeTimestamp`, i = this.native.writeTimestamp;
    if (typeof i != "function")
      throw new u(
        `[gpu-device-api] ${n}: this WebGPU implementation does not expose GPUCommandEncoder.writeTimestamp(). Use RenderPassDescriptor.timestampWrites instead (it needs "timestamp-query-inside-passes"), or read GPU time from the backend's own profiler.`
      );
    if (!this.device.hasEnabledFeature(re))
      throw new u(
        `[gpu-device-api] ${n}: timestamp queries need the "${re}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    if (this.openPass && !this.openPass.ended)
      throw new u(
        `[gpu-device-api] ${n}: a pass is still open. Call end() on it before writing a timestamp.`
      );
    if (!Number.isInteger(r) || r < 0 || r >= e.count)
      throw new u(
        `[gpu-device-api] ${n}: queryIndex ${String(r)} is outside the query set range [0, ${e.count}).`
      );
    i.call(this.native, wt(e, `${n}(querySet)`), r);
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
   *
   * ## 为什么在 finish() 里就 untrack
   *
   * 之前只有 `dispose()` 才把 encoder 从设备的资源追踪集合里摘掉，而 core 的 `CommandEncoder`
   * 接口**没有** `dispose()`（见 `core/render/CommandEncoder.ts`），于是「每帧建一个 encoder、
   * `finish()` 之后丢掉」这种最标准的用法会让 `WebGPUDevice.resources` 无上限增长：
   * 每个包装对象连同它的原生 `GPUCommandEncoder` 一直被强引用到 `device.dispose()`。
   * command encoder 是每帧都建的东西，这是一次实打实的每帧泄漏。
   *
   * **语义安全性**：`finish()` 之后本对象上的**每一个**方法都会先过 `assertRecording()` 抛错
   * （`beginRenderPass` / `beginComputePass` / 全部 copy / `clearBuffer` / `resolveQuerySet` /
   * `writeTimestamp` / 三个 debug marker 方法 / `finish` 自身），唯一还允许调用的是幂等的
   * `dispose()`；`beginRenderPass` / `beginComputePass` 返回的 pass 也会在 finish 之前被
   * `closeOpenPass()` 结束掉（pass 的 `end()` 之后同样不可再用）。也就是说 finish 之后这个
   * encoder 不可能再产生任何设备侧工作，设备追踪集合存在的唯一目的
   * （`device.dispose()` 时统一释放）对它已经没有意义，提前摘掉不会留下任何可用的悬空引用。
   */
  finish() {
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, this.device.untrack(this), new go(this.label, this.native.finish());
  }
  /**
   * 释放本 encoder 的包装对象（不影响已经 finish 出来的 command buffer）。
   *
   * 幂等：`finish()` 已经摘过一次追踪，这里再摘一次是空操作；重复调用也不会抛错。
   */
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
class go {
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
function Vt(t, e) {
  const r = {
    texture: to(t.texture, e)
  };
  return t.mipLevel !== void 0 && (r.mipLevel = t.mipLevel), t.origin !== void 0 && (r.origin = Ka(t.origin)), t.aspect !== void 0 && (r.aspect = Un(t.aspect)), r;
}
function Ig(t, e) {
  if (t instanceof go) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${ee(t)}.`
  );
}
class Dg {
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
  constructor(e, r = {}) {
    this.canvas = e, this.options = r, this.pixelRatioValue = r.pixelRatio ?? Fs(), this.formatValue = Mi(), this.usageValue = x.RenderAttachment | (r.copySrc ? x.CopySrc : x.None);
    const n = ut(e);
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
    if (!(e.device instanceof bo))
      throw new u(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const r = Pm(this.canvas);
    if (!r)
      throw new u(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget(), this.gpuContext = r, this.currentDevice = e.device, this.formatValue = e.format ?? Mi(), this.usageValue = x.RenderAttachment | (e.usage ?? x.None) | (this.options.copySrc ? x.CopySrc : x.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace;
    const n = e.sampleCount ?? (this.configuredValue ? this.sampleCountValue : e.device.defaultSampleCount);
    this.sampleCountValue = St(n, "CanvasConfig.sampleCount"), this.depthRequestedValue = e.depth ?? !0;
    const i = {
      device: e.device.native,
      format: Am(this.formatValue),
      usage: Xa(this.usageValue),
      alphaMode: this.alphaModeValue
    };
    this.colorSpaceValue !== void 0 && (i.colorSpace = this.colorSpaceValue), r.configure(i), this.configuredValue = !0, this.setSize(this.widthValue / this.pixelRatioValue, this.heightValue / this.pixelRatioValue, !1);
  }
  /** 解除配置；之后 `getCurrentFrameTarget()` 会抛错。 */
  unconfigure() {
    this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget();
    const e = this.gpuContext;
    e && typeof e.unconfigure == "function" && e.unconfigure(), this.configuredValue = !1, this.currentDevice = null, this.gpuContext = null;
  }
  /** 以 CSS 像素设置画布尺寸（内部会乘以 pixel ratio）。 */
  setSize(e, r, n = !0) {
    if (!Number.isFinite(e) || !Number.isFinite(r) || e <= 0 || r <= 0)
      throw new u(
        `[gpu-device-api] CanvasContext.setSize: width and height must be positive, got ${e}x${r}.`
      );
    const i = Math.max(1, Math.round(e * this.pixelRatioValue)), s = Math.max(1, Math.round(r * this.pixelRatioValue));
    if (this.canvas.width = i, this.canvas.height = s, n) {
      const a = this.canvas.style;
      a && (a.width = `${e}px`, a.height = `${r}px`);
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
    const r = this.widthValue / this.pixelRatioValue, n = this.heightValue / this.pixelRatioValue;
    this.pixelRatioValue = e, this.setSize(r, n, !1);
  }
  /** 重新读取元素尺寸；back buffer 发生变化时返回 true。 */
  resize(e = !1) {
    const r = ut(this.canvas), n = Math.max(1, Math.round(r.width * this.pixelRatioValue)), i = Math.max(1, Math.round(r.height * this.pixelRatioValue));
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
      throw new u(
        "[gpu-device-api] CanvasContext.getCurrentFrameTarget: the context is not configured."
      );
    const r = this.gpuContext.getCurrentTexture();
    if (this.frameTarget && this.frameNative === r) return this.frameTarget;
    this.releaseFrame();
    const n = $e.adopt(
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
    const r = this.getCurrentFrameTarget(), n = e.loadOp ?? "clear", i = e.storeOp ?? "store", s = e.clearValue;
    let a;
    this.sampleCountValue > 1 ? a = [
      {
        view: this.ensureMultisampleTarget(r.width, r.height),
        resolveTarget: r.view,
        loadOp: n,
        storeOp: i,
        clearValue: s
      }
    ] : a = [{ view: r.view, loadOp: n, storeOp: i, clearValue: s }];
    let o = null;
    return this.depthRequestedValue && (o = {
      view: this.ensureDepthTarget(r.width, r.height),
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
  ensureMultisampleTarget(e, r) {
    const n = this.currentDevice;
    if (!n)
      throw new u("[gpu-device-api] CanvasContext: the context is not configured.");
    const i = this.multisampleTexture;
    if (i && i.width === e && i.height === r && this.multisampleViewValue)
      return this.multisampleViewValue;
    this.releaseMultisampleTarget();
    const s = $e.create(n, {
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
  /**
   * 取得（必要时创建）canvas 深度的 view。
   *
   * canvas 纹理没有深度附件，所以深度由本库自己维护：按尺寸缓存，尺寸变化时重建
   *（`setSize()` / `configure()` 里已经先 release 掉了旧的）。sampleCount 与颜色附件一致，
   * 否则 WebGPU 会因为「附件采样数不一致」让整条 command buffer 失效。
   */
  ensureDepthTarget(e, r) {
    const n = this.currentDevice;
    if (!n)
      throw new u("[gpu-device-api] CanvasContext: the context is not configured.");
    const i = this.depthTexture;
    if (i && i.width === e && i.height === r && this.depthViewValue)
      return this.depthViewValue;
    this.releaseDepthTarget();
    const s = $e.create(n, {
      label: `${n.label}#canvasDepth`,
      size: { width: e, height: r },
      format: Rs,
      usage: x.RenderAttachment,
      sampleCount: this.sampleCountValue
    });
    return this.depthTexture = s, this.depthViewValue = s.createView({ label: `${s.label}#view` }), this.depthViewValue;
  }
  releaseDepthTarget() {
    this.depthTexture?.destroy(), this.depthTexture = null, this.depthViewValue = null;
  }
}
class kg {
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
  writeBuffer(e, r, n, i = 0, s) {
    this.device.assertUsable("Queue.writeBuffer");
    const a = s ?? n.byteLength - i;
    if (r < 0 || a < 0 || r + a > e.size)
      throw new u(
        `[gpu-device-api] writeBuffer 越界：写入范围 [${r}, ${r + a}) 超出了 buffer「${e.label}」的 ${e.size} 字节。`
      );
    if (r % 4 !== 0)
      throw new u(
        `[gpu-device-api] Queue.writeBuffer: bufferOffset (${r}) must be a multiple of 4.`
      );
    const o = n instanceof DataView ? 1 : n.BYTES_PER_ELEMENT ?? 1;
    if (i % o !== 0 || a % o !== 0)
      throw new u(
        `[gpu-device-api] Queue.writeBuffer: dataOffset (${i}) and size (${a}) are measured in bytes, so both must be multiples of the element size (${o}) of the given ${n.constructor.name}.`
      );
    this.native.writeBuffer(
      V(e, "Queue.writeBuffer"),
      r,
      n,
      i / o,
      a / o
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, r, n, i) {
    this.device.assertUsable("Queue.writeTexture"), this.native.writeTexture(
      Ir(e, "Queue.writeTexture"),
      r,
      Km(n),
      He(i)
    );
  }
  /**
   * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
   *
   * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
   * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
   *
   * ## `premultipliedAlpha` / `colorSpace`（`#25`）
   *
   * 两个参数都属于原生的 **destination**（`GPUCopyExternalImageDestInfo`），
   * 默认值与原生的 IDL 默认值逐字段一致：`premultipliedAlpha = true`、`colorSpace = 'srgb'`。
   *
   * **未指定时不下发这两个字段**：调用形状仍是改动前的 `{ source, flipY }`，
   * 于是「没写新参数」的行为与改动前逐字段相同（默认值由原生实现填，我们不去重复一遍
   * 再传回去）。只有在调用方显式给了值时，才把值原样放进 destination。
   */
  copyExternalImageToTexture(e, r, n, i = !1, s) {
    this.device.assertUsable("Queue.copyExternalImageToTexture");
    const a = Ir(
      r,
      "Queue.copyExternalImageToTexture"
    );
    s?.premultipliedAlpha !== void 0 && (a.premultipliedAlpha = s.premultipliedAlpha), s?.colorSpace !== void 0 && (a.colorSpace = s.colorSpace), this.native.copyExternalImageToTexture(
      { source: e, flipY: i },
      a,
      He(n)
    );
  }
  /**
   * buffer → buffer 的拷贝。
   *
   * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
   * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
   */
  copyBufferToBuffer(e, r, n, i, s) {
    this.device.assertUsable("Queue.copyBufferToBuffer");
    const a = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToBuffer" });
    a.copyBufferToBuffer(
      V(e, "Queue.copyBufferToBuffer(source)"),
      r,
      V(n, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, r, n) {
    this.device.assertUsable("Queue.copyBufferToTexture");
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: V(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      Ir(r, "Queue.copyBufferToTexture(destination)"),
      He(n)
    ), this.native.submit([i.finish()]);
  }
  /**
   * 提交 command buffer；提交后这些 buffer 不可再次使用。
   *
   * **设备丢失后会抛 `DeviceLostError`**：WebGPU 规定丢失设备上的提交被静默丢弃，
   * 不检查的话就是「每帧都在提交、画面永远不动、一行错误都没有」。这是本层唯一能
   * 把这件事变成明确错误的地方。
   */
  submit(e) {
    this.device.assertUsable("Queue.submit"), this.native.submit(e.map((r) => Ig(r, "Queue.submit")));
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
function Ir(t, e) {
  const r = {
    texture: to(t.texture, e)
  };
  return t.mipLevel !== void 0 && (r.mipLevel = t.mipLevel), t.origin !== void 0 && (r.origin = Ka(t.origin)), t.aspect !== void 0 && (r.aspect = Un(t.aspect)), r;
}
class bo {
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
  /**
   * GPU 计时能力的真实探测结果（见 {@link DeviceTimingSupport}）。
   *
   * 刻意在**创建设备时**算一次并缓存：能力判定必须落到真实的 API 表面（方法在不在），
   * 而不是 `features` 里的名字。探测结论在一台设备上不会变，所以不必每次问。
   */
  timing;
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
  /**
   * `#20` 已压入、尚未弹出的错误作用域（栈顶即最内层）。
   *
   * 与原生的 `[[errorScopeStack]]` **一一对应**：这里只在 push 成功、pop 成功时同步增删，
   * 任何原生调用失败都会把本地这一层回滚掉，因此 `scopeDepth` 永远不会与原生栈不一致
   * （「状态撒谎」是本库反复修过的一类问题）。
   */
  scopeStack = [];
  resolveLost;
  lostInfoValue = null;
  _disposed = !1;
  constructor(e, r) {
    this.native = e, this.descriptor = r.descriptor, this.label = r.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = r.adapterInfo, this.requestedLimits = r.resolvedLimits, this.debug = r.descriptor.debug ?? !1, this.enabledFeatures = [...r.descriptor.requiredFeatures ?? []], this.enabledFeatureSet = Wg(e, this.enabledFeatures), this.features = new Em(
      // 原生的 feature 名列表之外再补一个**纯调用面**的能力名：`importExternalTexture` 不是
      // WebGPU 的 feature（没有 `requiredFeatures` 要开），但它在部分实现上根本不存在，
      // 所以按「方法在不在」上报。上层就能用 `device.features.has('external-texture')`
      // 两个后端统一判断（WebGL2 上恒为 false），不必自己去看 `device.native`。
      typeof e.importExternalTexture == "function" ? [...r.adapterFeatures, "external-texture"] : r.adapterFeatures
    ), this.limits = Ya(e.limits), this.defaultSampleCount = St(
      r.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = rt(`webgpu:${this.label}`);
    let n = () => {
    };
    this.lost = new Promise((i) => {
      n = i;
    }), this.resolveLost = n, this.queue = new kg(this), e.onuncapturederror = (i) => {
      this.reportError(sn(i.error));
    }, this.timing = zg(e, this.enabledFeatureSet, r.adapterFeatures), e.lost.then((i) => this.handleDeviceLost(i)), this.logger.debug(
      `created device (${this.adapterInfo.device || this.adapterInfo.vendor || "unknown adapter"}, features: ${this.enabledFeatures.join(", ") || "none"})`
    );
  }
  get disposed() {
    return this._disposed;
  }
  /** 设备是否仍然可用。 */
  get usable() {
    return !this._disposed && this.lostInfoValue === null;
  }
  /**
   * 已丢失时的信息；未丢失时为 `null`。
   *
   * 与 `lost` promise 表达同一件事，但可以同步查询 —— 帧循环里「现在还能不能提交」需要它。
   * 丢失一旦发生就**不可撤销**：`GPUDevice` 失效后没有任何原生手段把它救回来，
   * 恢复只能重新 `requestDevice` 并重建全部资源（本层不做这件事，见类文档）。
   */
  get lostInfo() {
    return this.lostInfoValue;
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
      const r = e.getTimestampPeriod();
      if (typeof r == "number" && Number.isFinite(r) && r > 0) return r;
    }
    return typeof e.timestampPeriod == "number" && Number.isFinite(e.timestampPeriod) && e.timestampPeriod > 0 ? e.timestampPeriod : 1;
  }
  /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
  nextResourceId(e) {
    return U(e);
  }
  /* ---------------------------------------------------------------- 资源 */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(new Ja(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track($e.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Dn(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new no(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new io(this, e));
  }
  /**
   * 把一个图像来源导入成外部纹理（原生 `GPUDevice.importExternalTexture`）。
   *
   * ## 为什么先探测方法在不在，而不是无脑转发
   *
   * `GPUDevice.importExternalTexture` 在**部分实现上没有**（原生接口本身也是可选的：
   * Chrome 很早就有了，其它实现未必）。直接调用会得到一句 `is not a function`，而调用方
   * 完全没有上下文。这里显式探测并给出一条带替代方案的消息 —— 这也是本库对
   * 「能力可能在也可能不在」的一贯做法（对照 `readTimingSupport()`）。
   *
   * ## 过期语义
   *
   * 返回的对象是**一帧有效**的：原生把它绑到自动过期任务源，之后任何使用都会失败。
   * 本类只提供 {@link ExternalTexture.expired} 的透传查询，不自己计时（见
   * `WebGPUExternalTexture` 的说明）。**每帧重新导入**是调用方的契约。
   *
   * ## `colorSpace` 明确报错而不是静默忽略
   *
   * `ExternalTextureDescriptor.colorSpace` 是**本库刻意保留但未实现**的字段
   * （规范的 `GPUExternalTextureDescriptor` 现在只有 `source` / `label`）。既然它在
   * 类型里存在，传了却什么都不做就是本库最忌讳的静默忽略，所以这里直接报错并给出替代方案。
   */
  importExternalTexture(e) {
    if (this.assertUsable("importExternalTexture"), e.colorSpace !== void 0)
      throw new u(
        '[gpu-device-api] Device.importExternalTexture: "colorSpace" is not implemented by the WebGPU backend (the native GPUExternalTextureDescriptor has no such field, so forwarding it would be silently ignored). Convert the source into the wanted color space before importing it — for example draw it into an OffscreenCanvas and re-import that — or omit the option.'
      );
    const r = this.native.importExternalTexture;
    if (typeof r != "function")
      throw new u(
        "[gpu-device-api] Device.importExternalTexture: this WebGPU implementation does not expose GPUDevice.importExternalTexture, so external textures cannot be imported on this device. Upload the frame into a regular texture instead (Queue.copyExternalImageToTexture) and sample that; it needs no external-texture support and behaves the same on both backends."
      );
    const n = e.label ?? `externalTexture#${this.nextResourceId("externalTexture")}`, i = r.call(this.native, { source: e.source, label: n });
    return this.track(new ro(this, i, n));
  }
  /**
   * 读回 query set 的结果：`resolveQuerySet` → `copyBufferToBuffer` → `mapAsync`。
   *
   * 两个中转 buffer 都通过 `this.createBuffer()` 创建，因此被设备的资源追踪覆盖：
   * 正常路径由 `QueryResult.read()` 销毁，忘了读则在 `device.dispose()` 时统一释放。
   */
  readQuerySet(e, r = {}) {
    this.assertUsable("readQuerySet"), wt(e, `Device "${this.label}".readQuerySet(querySet)`);
    const n = r.firstQuery ?? 0;
    Te(n, "QuerySetReadOptions.firstQuery");
    const i = r.queryCount ?? e.count - n;
    if (!Number.isInteger(i) || i <= 0)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: queryCount must be a positive integer, got ${String(i)}.`
      );
    if (n + i > e.count)
      throw new u(
        `[gpu-device-api] Device "${this.label}".readQuerySet: range [${n}, ${n + i}) exceeds the query set "${e.label}" count ${e.count}.`
      );
    const s = r.label ?? `${e.label}:read`, a = i * 8, o = this.createBuffer({
      label: `${s}#resolve`,
      size: a,
      usage: O.QueryResolve | O.CopySrc
    }), l = this.createBuffer({
      label: `${s}#readback`,
      size: a,
      usage: O.MapRead | O.CopyDst
    }), c = this.createCommandEncoder({ label: s });
    try {
      c.resolveQuerySet(e, n, i, o, 0), c.copyBufferToBuffer(o, 0, l, 0, a), this.queue.submit([c.finish()]);
    } catch (h) {
      throw l.destroy(), o.destroy(), h;
    } finally {
      c.dispose();
    }
    return new fg({
      type: e.type,
      count: i,
      timestampPeriod: this.timestampPeriod,
      staging: o,
      readback: l
    });
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new ao(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new lo(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(yt.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new kn(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new fo(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new mo(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new Ug(this, e));
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
      throw new u(
        "[gpu-device-api] Device.createCanvasContext: expected an HTMLCanvasElement or OffscreenCanvas."
      );
    let n = this.canvasContexts.get(e);
    return (!n || n.disposed) && (n = this.track(new Dg(e)), this.canvasContexts.set(e, n)), (r !== void 0 || !n.configured) && n.configure({ ...r, device: this }), n;
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
  /**
   * `#20` 压入错误作用域：**原生转发** `GPUDevice.pushErrorScope(filter)`。
   *
   * ## 为什么这一侧可以直接转发
   *
   * WebGPU 的错误作用域本来就是为这个场景设计的，栈、filter 匹配、不匹配时向外层穿透、
   * `pop` 的异步性全部由实现保证。本层**不重新实现**那套语义（那只会引入偏差），
   * 只做两件原生不做的事：
   *
   * 1. 记住**入栈顺序**（{@link WebGPUDevice.scopeStack}），这样未配对的 `pop` 能在本地
   *    被明确拒绝，而不是把原生那句 `OperationError` 原样漏给调用方；
   * 2. 让 `dispose()` 能把被遗弃的作用域一起清掉（否则它们会一直挂在栈上，
   *    并且原生栈也只在设备销毁时才消失）。
   *
   * ## 能力缺失时如实报错
   *
   * `GPUDevice.pushErrorScope` 在**部分实现上没有**（原生接口本身也是可选的，
   * mock / 残缺实现同样如此）。直接调用会得到一句 `is not a function`，调用方没有任何上下文，
   * 所以这里显式探测并按本库惯例给出带替代方案的英文错误 —— **不假装记录**，
   * 也不会退化成「本地记一个长度、`pop` 恒返回 null」那种会撒谎的等价物。
   */
  pushErrorScope(e) {
    this.assertUsable("pushErrorScope"), ys(e, `Device "${this.label}".pushErrorScope(filter)`);
    const r = this.native;
    if (typeof r.pushErrorScope != "function")
      throw new u(
        `[gpu-device-api] Device "${this.label}".pushErrorScope: this WebGPU implementation does not expose GPUDevice.pushErrorScope, so device-level errors cannot be captured into a scope. Subscribe to Device.onError instead (it receives the native uncapturederror events, which is the same channel with coarser attribution), or run on an implementation that supports error scopes.`
      );
    r.pushErrorScope(e);
    const n = new Ng(e, this.scopeLabel(), () => this.popScope());
    return this.scopeStack.push(n), this.logger.debug(`pushed error scope "${e}" (depth ${this.scopeStack.length})`), n;
  }
  /**
   * `#20` 弹出错误作用域：原生 `popErrorScope()` 的结果映射成本库错误类型。
   *
   * 归属由原生保证（入栈时的那一层），所以这里只处理「没有作用域可弹」这一种本地错误：
   * 它**拒绝**，而不是 resolve 成 `null` —— 后者会让「忘了配对」看起来像「作用域里没有错误」。
   */
  popErrorScope() {
    return this.popScope();
  }
  /** 当前仍在栈上的错误作用域层数（诊断与测试用）。 */
  get scopeDepth() {
    return this.scopeStack.length;
  }
  /** 作用域句柄的默认 label（与其它资源一样走 `nextResourceId`，便于日志对照）。 */
  scopeLabel() {
    return `webgpuErrorScope#${this.nextResourceId("scope")}`;
  }
  /** {@link WebGPUDevice.popErrorScope} 与作用域句柄 `pop()` 共用的唯一实现。 */
  popScope() {
    const e = this.scopeStack.pop();
    if (!e)
      return Promise.reject(
        new u(
          `[gpu-device-api] Device "${this.label}".popErrorScope: there is no error scope on the stack (every popErrorScope() must be paired with a preceding pushErrorScope()).`
        )
      );
    const r = this.native;
    return typeof r.popErrorScope != "function" ? Promise.reject(
      new u(
        `[gpu-device-api] Device "${this.label}".popErrorScope: this WebGPU implementation does not expose GPUDevice.popErrorScope, so the scope cannot be settled.`
      )
    ) : (e.close(), r.popErrorScope().then((n) => {
      if (n === null) return null;
      const i = sn(n);
      return e.record(i), e.markFilterMatched(Vg(n, e.filter)), i;
    }));
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
    for (const r of this.scopeStack) r.abandon();
    this.scopeStack.length = 0;
    const e = [...this.resources];
    this.resources.clear(), this.canvasContexts.clear();
    try {
      Bs(e);
    } catch (r) {
      this.logger.error(`failed to dispose some resources: ${String(r)}`);
    }
    this.errorCallbacks.clear(), this.native.destroy(), this.lostInfoValue = { reason: "destroyed", message: "Device.dispose() was called." }, this.resolveLost(this.lostInfoValue);
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
  /**
   * 在任何会创建资源 / 提交工作之前检查设备仍可用。
   *
   * 丢失后 `GPUDevice` 上的所有调用都会被实现**静默丢弃**（命令不执行、也不报错），
   * 表现就是「画不出来但一切正常」；所以这里必须主动抛出带 `[gpu-device-api] ` 前缀的
   * {@link DeviceLostError}，并带上丢失原因。
   *
   * ## `#16`：「已 dispose」抛的也是 `DeviceLostError`，两个后端一致
   *
   * 改前这里对 `_disposed` 抛的是 `ValidationError`，而 WebGL2 后端抛 `DeviceLostError`
   * —— 同一段上层代码（例如「拿旧 device 的资源去创建东西」的错误恢复分支）在 WebGPU 上
   * 只会看到 `ValidationError`，跨后端写 `instanceof DeviceLostError` 的恢复逻辑就会漏掉这一支。
   *
   * 「已 dispose」与「设备丢失」是两件事，但**归类**是同一类：设备已经不能再用、
   * 调用方该做的是丢弃它并重建。所以这里也抛 `DeviceLostError`，用 `reason: 'destroyed'`
   * 表示「是调用方主动释放的、属于预期情形」（`isExpected === true`），
   * 而真正的丢失（`GPUDevice.lost` / `webglcontextlost`）仍然带它自己的 reason。
   *
   * 公开（而不是 private）是因为 `WebGPUQueue` 的提交路径也要用它 —— 设备丢失后
   * `queue.submit()` 是唯一「静默无效」的提交入口，必须在那一层拦下。
   */
  assertUsable(e) {
    if (this._disposed)
      throw new Ye(
        `[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`,
        { reason: "destroyed" }
      );
    if (this.lostInfoValue)
      throw new Ye(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfoValue.reason}): ` + this.lostInfoValue.message,
        { reason: this.lostInfoValue.reason }
      );
  }
  handleDeviceLost(e) {
    const r = e.reason === "destroyed" ? "destroyed" : "unknown", n = { reason: r, message: e.message };
    this.lostInfoValue = n, this.resolveLost(n), this._disposed || this.reportError(
      new Ye(`[gpu-device-api] WebGPU device lost (${r}): ${e.message}`, { reason: r })
    );
  }
}
function sn(t) {
  if (qo(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), r = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return Dr(t, "GPUValidationError") ? new u(r) : Dr(t, "GPUOutOfMemoryError") ? new ar(r) : Dr(t, "GPUInternalError") ? new ft(r) : t instanceof Error ? new te(r, { code: "GPU_ERROR", cause: t }) : new te(r);
}
function Vg(t, e) {
  const r = sn(t);
  return e === "out-of-memory" ? r instanceof ar : e === "internal" ? r instanceof ft : r instanceof u;
}
class Ng {
  label;
  filter;
  errorsSeen = [];
  settle;
  activeValue = !0;
  matched = !1;
  /**
   * 设备在它还没被 `pop` 的时候就被 `dispose()` 了。
   *
   * 与 {@link WebGPUErrorScope.close} 刻意分开：`close()` 表示「正常出栈了」，
   * 这里表示「设备没了，这个作用域永远不会被落定」。两者对 `pop()` 的答复不同
   *（一个说「已经 pop 过」、一个说「设备已销毁、无法落定」），混成一个状态会给出误导性的
   * 消息 —— WebGL2 侧就是被自测抓到这一点才分开的。
   */
  abandoned = !1;
  constructor(e, r, n) {
    this.filter = e, this.label = r, this.settle = n;
  }
  get active() {
    return this.activeValue;
  }
  /**
   * 返回的错误是否与这一层的 `filter` **同类**。
   *
   * 依据是**实测的原生行为**（本机无头 Chrome，见
   * `.tmp-07/probe/native-error-scope-probe.html?backend=webgpu` + `wgpuNested*` 那几行）：
   * 不匹配的错误会**继续交给外层作用域**，所以一个作用域可能拿到 filter 不同类的错误。
   * 那种情况下这里如实返回 false，而不是为了让调用方安心而报 true。
   *
   * 空作用域（`pop` 返回 `null`）时保持 false ——「没有错误」谈不上命中。
   */
  get filterMatched() {
    return this.matched;
  }
  get errors() {
    return this.errorsSeen;
  }
  pop() {
    return this.abandoned ? Promise.reject(
      new u(
        `[gpu-device-api] error scope "${this.label}" can no longer be settled: the device was disposed while this scope was still on the stack, so the native error scope is gone with it. This is NOT "no error in scope" — resolving null here would be a lie.`
      )
    ) : this.activeValue ? this.settle() : Promise.reject(
      new u(
        `[gpu-device-api] error scope "${this.label}" has already been popped; each pushErrorScope() must be popped at most once.`
      )
    );
  }
  /** 记录任务源交回来的那条错误（`pop` 时调用；`errors` 因此最多一条）。 */
  record(e) {
    this.errorsSeen.push(e);
  }
  /** 原生返回了非 null 的错误 → 这一层的 filter 命中了。 */
  markFilterMatched(e) {
    this.matched = e;
  }
  /** 设备销毁时对**被遗弃的**（还没 `pop` 的）作用域调用；语义见 `abandoned` 字段。 */
  abandon() {
    this.abandoned = !0, this.activeValue = !1;
  }
  /** 正常出栈后调用；幂等。 */
  close() {
    this.activeValue = !1;
  }
}
function Dr(t, e) {
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
function Wg(t, e) {
  const r = Qa(t.features);
  return r.size > 0 ? r : new Set(e);
}
function zg(t, e, r) {
  const n = e.has(re), i = Ze.some((o) => e.has(o)), s = n && jg(t), a = n && i;
  return {
    encoderTimestamps: s,
    passTimestamps: a,
    unavailableReason: s || a ? null : qg(n, r)
  };
}
function qg(t, e) {
  return t ? `[gpu-device-api] this WebGPU device enables "${re}", but this implementation does not expose GPUCommandEncoder.writeTimestamp() and does not enable "${Ze[0]}" (tried: ${Ze.join(", ")}), so there is no way to write a GPU timestamp. Read GPU time from the backend's own profiler instead.` : `[gpu-device-api] this WebGPU device does not have the "${re}" feature enabled, so no GPU timestamp can be written. Request it in DeviceDescriptor.requiredFeatures (the adapter supports it: ${e.has(re) ? "yes" : "no"}).`;
}
function jg(t) {
  try {
    if (typeof t.createCommandEncoder({ label: "gpu-device-api:timestamp-probe" }).writeTimestamp == "function") return !0;
  } catch {
  }
  return typeof globalThis.GPUCommandEncoder?.prototype?.writeTimestamp == "function";
}
class ir {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, r) {
    this.native = e, this.options = r, this.info = Tm(e), this.features = Qa(e.features), this.limits = Ya(e.limits), this.featureNames = [...this.features].sort();
  }
  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions() {
    return this.options;
  }
  /** 当前环境是否暴露 WebGPU。 */
  static isSupported() {
    return Ci();
  }
  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(e = {}) {
    const r = await Sm(e);
    return r ? new ir(r, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const r = await ir.request(e);
    if (r) return r;
    throw Ci() ? new u(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new u(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const r = Ms(this.limits, e.requiredLimits, "webgpu"), n = $m(
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
    return new bo(s, {
      descriptor: e,
      resolvedLimits: r,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function Qg(t) {
  return t.canvas ? t.canvas : wo();
}
function Yg() {
  return wo();
}
function wo() {
  if (typeof document < "u") {
    const t = document.createElement("canvas");
    return t.width = 1, t.height = 1, t;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
const an = Symbol("timeout");
async function zi(t, e) {
  let r;
  try {
    return await Promise.race([
      t,
      new Promise((n) => {
        r = setTimeout(() => n(an), e);
      })
    ]);
  } finally {
    r !== void 0 && clearTimeout(r);
  }
}
const Nt = 3e3;
class Xg {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    try {
      const r = await zi(
        navigator.gpu.requestAdapter({
          powerPreference: e.powerPreference ?? "high-performance",
          forceFallbackAdapter: e.forceFallbackAdapter ?? !1
        }),
        Nt
      );
      return r === an ? {
        ok: !1,
        reason: `requestAdapter() 超过 ${Nt}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`
      } : r ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (r) {
      return { ok: !1, reason: `requestAdapter() 抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    const r = await zi(
      ir.create({
        powerPreference: e.powerPreference,
        forceFallbackAdapter: e.forceFallbackAdapter
      }),
      Nt
    );
    if (r === an)
      throw new u(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${Nt}ms 没有返回。这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。
可以稍后重试，或改用 WebGL2 后端。`
      );
    return r;
  }
}
class Hg {
  kind = "webgl2";
  async isAvailable(e) {
    const r = Yg();
    if (!r)
      return { ok: !1, reason: "没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）" };
    try {
      return r.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（浏览器不支持 WebGL2）" };
    } catch (n) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const r = Qg(e);
    if (!r)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return Bn.request({
      canvas: r,
      contextAttributes: e.contextAttributes
    });
  }
}
let kr = null;
function Vn() {
  return kr || (kr = new Rp().register(new Xg()).register(new Hg())), kr;
}
const Zg = ["webgpu", "webgl2"];
async function Kg(t = {}) {
  const e = t.registry ?? Vn(), r = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? Zg, n = await e.probeAll(r, t), i = n.find((s) => s.ok);
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
async function Ay(t, e = {}) {
  const n = (e.registry ?? Vn()).get(t);
  return n ? (await n.isAvailable(e)).ok : !1;
}
async function Py(t = {}) {
  return (await yo(t)).device;
}
async function yo(t = {}) {
  const e = t.logger ?? rt("gpu-device-api"), r = t.registry ?? Vn(), n = await Kg({
    backend: t.backend ?? "auto",
    order: t.order,
    canvas: t.canvas,
    contextAttributes: t.contextAttributes,
    powerPreference: t.powerPreference,
    forceFallbackAdapter: t.forceFallbackAdapter,
    registry: r
  });
  if (n.backend === null)
    throw new u(
      `[gpu-device-api] 无法创建渲染设备：${n.reason}
排查建议：确认在 https 或 localhost 下运行（WebGPU 需要安全上下文）、浏览器版本支持 WebGPU/WebGL2、显卡未被禁用。`
    );
  if (t.strictBackend && t.backend && t.backend !== "auto" && t.backend !== n.backend)
    throw new u(
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
        const c = await l.createAdapter({
          canvas: t.canvas,
          contextAttributes: t.contextAttributes,
          powerPreference: t.powerPreference,
          forceFallbackAdapter: t.forceFallbackAdapter
        }), h = await c.requestDevice({
          label: t.label,
          // 可选 feature 按 adapter 的实际能力过滤：不支持就不申请（而不是抛错）。
          requiredFeatures: Jg(t.requiredFeatures, t.optionalFeatures, c.features),
          requiredLimits: t.requiredLimits,
          debug: t.debug
        }), d = t.canvas ? h.createCanvasContext(t.canvas) : null;
        return o !== n.backend ? e.warn(
          `后端 ${n.backend} 初始化失败，已改用 ${o}。失败原因：${a[a.length - 1] ?? "未知"}`
        ) : o === "webgl2" && t.backend !== "webgl2" && e.info(`已回退到 WebGL2 后端：${n.reason}`), { device: h, adapter: c, backend: o, probes: n.probes, context: d };
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
function Jg(t, e, r) {
  if ((!t || t.length === 0) && (!e || e.length === 0)) return;
  const n = [];
  for (const i of t ?? [])
    n.includes(i) || n.push(i);
  for (const i of e ?? [])
    n.includes(i) || r.has(i) && n.push(i);
  return n;
}
const qi = 16, eb = 12, sr = {
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
    size: qi * 3,
    glsl: "mat3",
    wgsl: "mat3x3f",
    componentType: "f32",
    components: 9,
    columnStride: qi,
    columnSize: eb,
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
}, ji = Object.keys(sr);
function Vr(t, e) {
  return Math.ceil(t / e) * e;
}
function tb(t) {
  const e = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(t);
  if (e) {
    const n = e[1], i = sr[n];
    if (!i)
      throw new u(
        `[gpu-device-api] 不支持的 uniform 元素类型「${n}」（出现在「${t}」里）。支持：${ji.join("、")}。`
      );
    const s = Number(e[2]);
    if (s <= 0)
      throw new u(`[gpu-device-api] uniform 数组「${t}」的元素个数必须为正数。`);
    if (i.columns !== void 0 && i.columnStride !== i.columnSize)
      throw new u(
        `[gpu-device-api] 不支持 \`${t}\`：\`mat3x3f\` 的每列有 4 字节填充，无法表示成扁平数组。
请改用 \`mat4x4f[` + s + "]`（多出的第 4 个分量当作 0 即可），或者拆成多个独立的 mat3 字段。"
      );
    return { element: n, count: s };
  }
  if (t === "mat2x2f" || t === "mat2x3f" || t === "mat2x4f" || t === "mat3x2f" || t === "mat3x4f" || t === "mat4x2f" || t === "mat4x3f")
    throw new u(
      `[gpu-device-api] uniform 不支持 \`${t}\`：GLSL std140 与 WGSL uniform 对非 4 列的矩阵布局规则不一致（std140 会把列步长补齐到 16 字节）。
请改用 \`mat4x4f\`（把缺的列填单位向量或零），或拆成若干 \`vec4f\`。`
    );
  if (!sr[t])
    throw new u(
      `[gpu-device-api] 不支持的 uniform 类型「${t}」。支持：${ji.join("、")}，以及 \`类型[N]\` 形式的数组。`
    );
  return { element: t, count: 1 };
}
const rb = /* @__PURE__ */ new Set([
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
]), nb = /^[A-Za-z_][A-Za-z0-9_]*$/;
class br {
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
  constructor(e, r = {}) {
    this.desc = { ...e }, this.structName = r.structName ?? "Uniforms", this.group = r.group ?? 0, this.binding = r.binding ?? 0;
    const n = Object.keys(e);
    if (n.length === 0)
      throw new u("[gpu-device-api] uniform 布局至少要有一个字段。");
    const i = [];
    let s = 0, a = 16;
    for (const o of n) {
      if (!nb.test(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」不是合法标识符。`);
      if (rb.has(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」是 WGSL 保留字，请换一个。`);
      const l = e[o], { element: c, count: h } = tb(l), d = sr[c], p = Vr(s, d.align), f = d.size, m = h > 1 ? Vr(d.size, 16) : d.size, g = d.columnStride === void 0 || d.columnStride === d.columnSize, b = h > 1 ? m === d.size && g : g, w = h > 1 ? m * (h - 1) + d.size : d.size;
      i.push({ name: o, type: l, info: d, byteOffset: p, byteSize: f, byteStride: m, count: h, packed: b }), s = p + w, a = Math.max(a, d.align, h > 1 ? 16 : 0);
    }
    this.fields = i, this.fieldByName = new Map(i.map((o) => [o.name, o])), this.byteLength = Vr(s, a), this.key = `${this.structName}|${this.group}|${this.binding}|${n.map((o) => `${o}:${e[o]}`).join(",")}`;
  }
  field(e) {
    const r = this.fieldByName.get(e);
    if (!r)
      throw new u(
        `[gpu-device-api] uniform 布局里没有字段「${e}」。现有字段：${this.fields.map((n) => n.name).join("、")}。`
      );
    return r;
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
const Qi = /* @__PURE__ */ new Map();
function vo(t, e) {
  const r = new br(t, e), n = Qi.get(r.key);
  return n || (Qi.set(r.key, r), r);
}
function on(t, e, r, n) {
  return t === "i32" ? new Int32Array(e, r, n) : t === "u32" ? new Uint32Array(e, r, n) : new Float32Array(e, r, n);
}
function Yi(t, e, r, n, i) {
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
      return o || (o = on(t.info.componentType, e, t.byteOffset + a * r, n), s[a] = o), o;
    },
    set(a) {
      let o = 0;
      for (let l = 0; l < i; l++) {
        const c = this.at(l);
        for (let h = 0; h < n && o < a.length; h++, o++)
          c[h] = a[o];
      }
    },
    get(a) {
      const o = i * n, l = a ?? on(t.info.componentType, new ArrayBuffer(o * 4), 0, o);
      let c = 0;
      for (let h = 0; h < i; h++) {
        const d = this.at(h);
        for (let p = 0; p < n; p++, c++)
          l[c] = d[p];
      }
      return l;
    }
  };
}
class Xi {
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
  constructor(e, r) {
    this.layout = e instanceof br ? e : vo(e, r), this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16)), this.bytesView = new Uint8Array(this.buffer, 0, this.layout.byteLength);
    const n = {};
    for (const i of this.layout.fields)
      n[i.name] = this.createFieldValue(i), this.writers.set(i.name, this.createFieldWriter(i, n[i.name]));
    this.fieldValues = n;
  }
  /** 为字段建一个形状统一的写入器（见 {@link writers} 的说明）。 */
  createFieldWriter(e, r) {
    const n = e.count * e.info.components;
    return e.packed ? { kind: e.info.componentType === "i32" ? 1 : e.info.componentType === "u32" ? 2 : 0, offset: e.byteOffset / 4, length: n, accessor: null } : {
      kind: 3,
      offset: 0,
      length: n,
      accessor: r
    };
  }
  createFieldValue(e) {
    if (e.packed)
      return on(
        e.info.componentType,
        this.buffer,
        e.byteOffset,
        e.count * e.info.components
      );
    if (e.info.columnStride !== void 0) {
      const r = (e.info.columnSize ?? e.byteSize) / 4;
      return Yi(
        e,
        this.buffer,
        e.info.columnStride,
        r,
        e.info.columns ?? 1
      );
    }
    return Yi(e, this.buffer, e.byteStride, e.info.components, e.count);
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
  set(e, r) {
    const n = this.writers.get(e);
    if (n === void 0)
      return this.layout.field(e), this;
    if (typeof r == "number") {
      if (n.kind === 3)
        throw new TypeError(
          `[gpu-device-api] uniform 字段「${e}」不是标量，请传数字数组而不是单个数字。`
        );
      n.kind === 0 ? (this.f32View ??= new Float32Array(this.buffer))[n.offset] = r : n.kind === 1 ? (this.i32View ??= new Int32Array(this.buffer))[n.offset] = r : (this.u32View ??= new Uint32Array(this.buffer))[n.offset] = r;
    } else {
      const i = r;
      if (i.length > n.length)
        throw new RangeError(
          `[gpu-device-api] uniform 字段「${e}」只接受 ${n.length} 个元素，收到 ${i.length} 个。写超长会覆盖后面的字段，所以这里直接拦下。`
        );
      n.kind === 0 ? (this.f32View ??= new Float32Array(this.buffer)).set(i, n.offset) : n.kind === 1 ? (this.i32View ??= new Int32Array(this.buffer)).set(i, n.offset) : n.kind === 2 ? (this.u32View ??= new Uint32Array(this.buffer)).set(i, n.offset) : n.accessor.set(i);
    }
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
  /** 有效字节数的视图（上传时用，避免把尾部对齐填充也传上去）。视图是复用的，不要保留它的引用。 */
  get bytes() {
    return this.bytesView;
  }
  /** 复制一份紧凑的字节数据。 */
  toArrayBuffer() {
    return this.buffer.slice(0, this.layout.byteLength);
  }
}
const Hi = /* @__PURE__ */ new WeakMap(), xo = /* @__PURE__ */ new WeakMap();
function ib(t) {
  return xo.get(t) ?? t;
}
function sb(t) {
  const e = Hi.get(t);
  if (e) return e;
  const r = /* @__PURE__ */ new Map(), n = new Proxy(t, {
    get(i, s, a) {
      if (typeof s == "string" && i.has(s))
        return i.field(s);
      const o = Reflect.get(i, s, i);
      if (typeof o == "function") {
        let l = r.get(s);
        return l === void 0 && (l = o.bind(i), r.set(s, l)), l;
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
  return Hi.set(t, n), xo.set(n, t), n;
}
function ab(t, e) {
  const r = t instanceof br ? new Xi(t) : new Xi(t, e);
  return sb(r);
}
const Nr = "/*%uniforms%*/", Zi = "/*%attributes%*/", Wr = "/*%textures%*/", ob = {
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
function lb(t, e, r) {
  const n = e === "cube" ? "samplerCube" : e === "3d" ? "sampler3D" : e === "2d-array" ? "sampler2DArray" : "sampler2D";
  return r ? n === "sampler2D" ? "sampler2DShadow" : n === "samplerCube" ? "samplerCubeShadow" : n === "sampler2DArray" ? "sampler2DArrayShadow" : n : t === "sint" ? `i${n}` : t === "uint" ? `u${n}` : n;
}
function cb(t, e) {
  return t === "depth" ? e === "cube" ? "texture_depth_cube" : e === "2d-array" ? "texture_depth_2d_array" : "texture_depth_2d" : `${e === "cube" ? "texture_cube" : e === "3d" ? "texture_3d" : e === "2d-array" ? "texture_2d_array" : "texture_2d"}<${t === "sint" ? "i32" : t === "uint" ? "u32" : "f32"}>`;
}
function zr(t, e) {
  let r = t;
  const n = [];
  for (const s of e)
    s.text && (r.includes(s.placeholder) ? r = r.split(s.placeholder).join(s.text) : n.push(s.text));
  return `${n.length > 0 ? `${n.join(`

`)}

` : ""}${r.trim()}
`;
}
class wr {
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
    const r = Object.entries(e.attributes ?? {});
    if (r.length > 16)
      throw new u(
        `[gpu-device-api] 材质「${this.name}」声明了 ${r.length} 个顶点属性，超过 WebGL2/WebGPU 的 16 个上限。`
      );
    this.attributes = r.map(([p, f], m) => {
      const g = typeof f == "string" ? { format: f, stepMode: "vertex" } : f;
      return { name: p, format: g.format, location: m, stepMode: g.stepMode ?? "vertex" };
    }), e.uniforms instanceof br ? this.uniforms = e.uniforms : e.uniforms ? this.uniforms = vo(e.uniforms) : this.uniforms = null;
    const n = (e.textures ?? []).map(
      (p) => typeof p == "string" ? { name: p } : p
    );
    this.textures = n.map((p, f) => {
      const m = p.binding ?? f * 2;
      return {
        name: p.name,
        sampleType: p.sampleType ?? "float",
        viewDimension: p.viewDimension ?? "2d",
        comparison: p.comparison ?? p.sampleType === "depth",
        binding: m,
        samplerName: `${p.name}_sampler`,
        samplerBinding: m + 1
      };
    });
    const i = this.uniforms ? 1 : 0, s = this.uniforms ? this.uniforms.glslDeclaration() : "", a = this.textures.map(
      (p) => `uniform ${lb(p.sampleType, p.viewDimension, p.comparison)} ${p.name};`
    ).join(`
`), o = this.attributes.map((p) => `layout(location = ${p.location}) in ${Wo(p.format)} ${p.name};`).join(`
`);
    if (this.glsl = {
      vs: zr(e.glsl.vs, [
        { placeholder: Nr, text: s },
        { placeholder: Zi, text: o },
        { placeholder: Wr, text: a }
      ]),
      fs: zr(e.glsl.fs, [
        { placeholder: Nr, text: s },
        { placeholder: Wr, text: a }
      ])
    }, e.fragmentOutput !== !1) {
      const p = e.fragmentOutput ?? "fragColor";
      new RegExp(
        `\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${p}\\b`
      ).test(this.glsl.fs) || (this.glsl.fs = `layout(location = 0) out vec4 ${p};
${this.glsl.fs}`);
    }
    const l = e.wgsl, c = this.uniforms ? this.uniforms.wgslDeclaration() : "", h = this.textures.map((p) => {
      const f = p.comparison && p.sampleType === "depth" ? "sampler_comparison" : "sampler";
      return `@group(${i}) @binding(${p.binding}) var ${p.name}: ${cb(p.sampleType, p.viewDimension)};
@group(${i}) @binding(${p.samplerBinding}) var ${p.samplerName}: ${f};`;
    }).join(`
`), d = this.attributes.length > 0 ? `struct VertexInput {
${this.attributes.map((p) => `  @location(${p.location}) ${p.name}: ${zo(p.format)},`).join(`
`)}
}` : "";
    this.wgsl = zr(l, [
      { placeholder: Nr, text: c },
      { placeholder: Zi, text: d },
      { placeholder: Wr, text: h }
    ]);
  }
  /** 创建一个材质。 */
  static create(e) {
    return new wr(e);
  }
  /**
   * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
   * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
   */
  vertexBufferLayouts() {
    return this.attributes.map((e) => ({
      arrayStride: Re(e.format).byteSize,
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
      throw new u(
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
      throw new u(
        `[gpu-device-api] 材质「${this.name}」没有 uniform 布局，无法创建 uniform 数值容器。`
      );
    const e = ab(this.uniforms);
    if (this.desc.defaults)
      for (const [r, n] of Object.entries(this.desc.defaults)) {
        if (!e.has(r))
          throw new u(
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
      const r = ob[e];
      if (!r)
        throw new u(
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
      type: k.Uniform,
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
          type: k.Texture,
          name: a.name,
          texture: { sampleType: a.sampleType, viewDimension: a.viewDimension }
        }), n.push({
          binding: a.samplerBinding,
          visibility: 3,
          type: a.comparison && a.sampleType === "depth" ? k.ComparisonSampler : k.Sampler,
          name: a.samplerName,
          sampler: { type: a.comparison ? "comparison" : "filtering" }
        });
    return n.length === 0 ? null : e.createBindGroupLayout({ label: `${this.name}:group${r}`, entries: n });
  }
}
function ub(t) {
  return wr.create(t);
}
const hb = 72;
class pb {
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
  constructor(e, r, n = {}) {
    this.device = e, this.layout = r, this.label = n.label ?? `uniformArena:${r.structName}`, this.align = Math.max(1, e.limits.minUniformBufferOffsetAlignment), this.slotSize = Ki(Math.max(r.byteLength, 16), this.align), this.maxCapacity = n.maxCapacity ?? 16 * 1024 * 1024, this.capacityValue = Math.max(n.initialCapacity ?? 64 * 1024, this.slotSize), this.bufferValue = this.createBuffer(this.capacityValue);
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
    const r = this.allocate(), n = e.bytes;
    return this.device.queue.writeBuffer(this.bufferValue, r, n), this.recordWrite(r, n), r;
  }
  /** 直接写入一段原始字节（高级用法：手写打包数据时）。 */
  writeBytes(e) {
    const r = this.allocate();
    return this.device.queue.writeBuffer(this.bufferValue, r, e), this.recordWrite(r, e), r;
  }
  /** 记下本帧的写入，供扩容重放（两个平行数组，不产生每 draw 的对象）。 */
  recordWrite(e, r) {
    this.frameOffsets.push(e), this.frameData.push(r);
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
    const e = this.head + this.slotSize, r = Math.min(
      Math.max(this.capacityValue * 2, e),
      this.maxCapacity
    );
    if (r < e)
      throw new u(
        `[gpu-device-api] uniform arena「${this.label}」本帧需要的容量超过了上限 ${(this.maxCapacity / 1024 / 1024).toFixed(0)} MiB（需要 ${e} 字节）。
请改用「每个物体一套 UniformValues + 多个 bind group」，或减少同帧的 draw 数量。`
      );
    this.retired.push({ buffer: this.bufferValue, bindGroup: this.bindGroupValue }), this.bindGroupValue = null, this.bindGroupLayoutValue = null, this.capacityValue = r, this.bufferValue = this.createBuffer(r);
    for (let n = 0; n < this.frameOffsets.length; n += 1)
      this.device.queue.writeBuffer(this.bufferValue, this.frameOffsets[n], this.frameData[n]);
  }
  createBuffer(e) {
    return this.device.createBuffer({
      label: `${this.label}:${e}`,
      size: Ki(e, 4),
      usage: hb
    });
  }
}
class db {
  device;
  arenas = /* @__PURE__ */ new Map();
  options;
  constructor(e, r = {}) {
    this.device = e, this.options = r;
  }
  /** 取得（或创建）某个布局的 arena。 */
  acquire(e) {
    let r = this.arenas.get(e.key);
    return r || (r = new pb(this.device, e, this.options), this.arenas.set(e.key, r)), r;
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
function Ki(t, e) {
  return Math.ceil(t / e) * e;
}
const fb = 40, mb = 24, gb = Object.freeze({
  position: "float32x3",
  normal: "float32x3",
  uv: "float32x2",
  uv1: "float32x2",
  color: "float32x4",
  tangent: "float32x4",
  joints: "uint16x4",
  weights: "float32x4"
});
class yr {
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
  /**
   * 局部空间的包围球；推断不出来时为 `null`（例如 `position` 不是 `float32x3` 且调用方也没给）。
   * 创建时算一次，之后不再变。
   */
  boundingSphere;
  /**
   * 这个几何体是否适合做视锥剔除。
   *
   * 有两种情况返回 `false`，都是为了让剔除**不会**画错：
   * - 没有包围球（见 {@link boundingSphere}）；
   * - 带按实例步进的属性、且包围球是**按基础顶点**算出来的：实例化绘制里每个实例的位置由
   *   实例属性决定，基础顶点的包围球完全盖不住它们（拿它剔除会把可见的实例整批丢掉）。
   *   显式传了 `boundingSphere` 时调用方已经对实例分布负责，这时仍然可剔除。
   */
  cullable;
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
    this.label = e.label, this.topology = e.topology, this.attributes = e.attributes, this.attributeNames = [...e.attributes.keys()], this.vertexCount = e.vertexCount, this.instanceCount = e.instanceCount, this.indexBuffer = e.indexBuffer, this.indexFormat = e.indexFormat, this.indexCount = e.indexCount, this.boundingSphere = e.boundingSphere, this.cullable = e.cullable;
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
    for (const [g, b] of s)
      b && i.set(g, { data: b });
    for (const [g, b] of Object.entries(r.attributes ?? {}))
      i.set(g, ArrayBuffer.isView(b) ? { data: b } : b);
    if (i.size === 0)
      throw new u(`[gpu-device-api] 几何体「${n}」至少要有一个顶点属性。`);
    let a = r.vertexCount ?? 0, o = null;
    for (const [g, b] of i) {
      const w = b.format ?? Ji(g, b.data), y = Math.floor(b.data.byteLength / Re(w).byteSize);
      b.perInstance ? o = o === null ? y : Math.min(o, y) : y > a && (a = y);
    }
    if (a <= 0)
      throw new u(
        `[gpu-device-api] 几何体「${n}」无法推断顶点数：至少要有一个按顶点步进的属性（实例属性只描述实例，不决定顶点数），并检查属性数据是否为空。`
      );
    const l = /* @__PURE__ */ new Map();
    for (const [g, b] of i) {
      const w = b.format ?? Ji(g, b.data), y = Re(w);
      if (b.data.byteLength % y.byteSize !== 0)
        throw new u(
          `[gpu-device-api] 几何体「${n}」的属性「${g}」数据长度 ${b.data.byteLength} 字节不是其格式 ${w}（${y.byteSize} 字节）的整数倍。`
        );
      const v = a * y.byteSize;
      if (!b.perInstance && b.data.byteLength < v)
        throw new u(
          `[gpu-device-api] 几何体「${n}」的属性「${g}」只有 ${b.data.byteLength} 字节，但按顶点数 ${a} 需要 ${v} 字节。所有属性必须提供同样多的顶点（只有 \`perInstance: true\` 的实例属性可以少于顶点数）。`
        );
      const T = e.createBuffer({
        label: `${n}:${g}`,
        // WebGPU 要求 buffer 大小是 4 的倍数，这里统一对齐。
        size: es(b.data.byteLength, 4),
        usage: fb
      });
      e.queue.writeBuffer(T, 0, b.data), l.set(g, {
        name: g,
        format: w,
        byteStride: y.byteSize,
        components: y.components,
        perInstance: b.perInstance ?? !1,
        buffer: T
      });
    }
    const c = bb(r, l, i, a), h = [...i.values()].some((g) => g.perInstance === !0), d = c !== null && (r.boundingSphere !== void 0 || !h);
    let p = null, f = null, m = 0;
    if (r.indices && r.indices.length > 0) {
      const g = yb(r.indices, a, n);
      f = g instanceof Uint32Array ? "uint32" : "uint16", m = g.length, p = e.createBuffer({
        label: `${n}:indices`,
        size: es(g.byteLength, 4),
        usage: mb
      }), e.queue.writeBuffer(p, 0, g);
    }
    return new yr({
      label: n,
      topology: r.topology ?? "triangle-list",
      attributes: l,
      vertexCount: a,
      instanceCount: o,
      indexBuffer: p,
      indexFormat: f,
      indexCount: m,
      boundingSphere: c,
      cullable: d
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
  validateAgainst(e, r) {
    if (!this.validatedAgainst.has(e)) {
      for (const n of e) {
        const i = this.attributes.get(n.name);
        if (!i)
          throw new u(
            `[gpu-device-api] 几何体「${this.label}」缺少材质「${r}」需要的属性「${n.name}」。
几何体现有属性：${this.attributeNames.join("、")}。`
          );
        if (i.format !== n.format)
          throw new u(
            `[gpu-device-api] 几何体「${this.label}」的属性「${n.name}」格式是 ${i.format}，但材质「${r}」要求 ${n.format}。`
          );
        const s = (n.stepMode ?? "vertex") === "instance";
        if (i.perInstance !== s)
          throw new u(
            `[gpu-device-api] 几何体「${this.label}」的属性「${n.name}」是${i.perInstance ? "按实例" : "按顶点"}步进的，但材质「${r}」把它声明成了 ${s ? "'instance'" : "'vertex'"} 步进。
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
function bb(t, e, r, n) {
  const i = t.boundingSphere;
  if (i) {
    const o = i.radius;
    if (!Number.isFinite(o) || o < 0)
      throw new u(
        `[gpu-device-api] 几何体「${t.label ?? "geometry"}」显式给出的包围球半径必须是有限的非负数，实际是 ${String(o)}。`
      );
    const l = M(), c = i.center;
    if (c !== void 0) {
      if (c.length < 3)
        throw new u(
          `[gpu-device-api] 几何体「${t.label ?? "geometry"}」显式给出的包围球球心至少要有 3 个分量，实际是 ${c.length} 个。`
        );
      const h = c[0], d = c[1], p = c[2];
      if (!Number.isFinite(h) || !Number.isFinite(d) || !Number.isFinite(p))
        throw new u(
          `[gpu-device-api] 几何体「${t.label ?? "geometry"}」显式给出的包围球球心必须是有限数，实际是 (${h}, ${d}, ${p})。`
        );
      he(l, h, d, p);
    }
    return { center: l, radius: o };
  }
  const s = e.get("position"), a = r.get("position");
  return !s || !a || s.format !== "float32x3" || !(a.data instanceof Float32Array) ? null : wb(a.data, n);
}
function wb(t, e) {
  let r = 1 / 0, n = 1 / 0, i = 1 / 0, s = -1 / 0, a = -1 / 0, o = -1 / 0;
  for (let p = 0; p < e; p += 1) {
    const f = p * 3, m = t[f], g = t[f + 1], b = t[f + 2];
    m < r && (r = m), g < n && (n = g), b < i && (i = b), m > s && (s = m), g > a && (a = g), b > o && (o = b);
  }
  const l = (r + s) / 2, c = (n + a) / 2, h = (i + o) / 2;
  let d = 0;
  for (let p = 0; p < e; p += 1) {
    const f = p * 3, m = t[f] - l, g = t[f + 1] - c, b = t[f + 2] - h, w = m * m + g * g + b * b;
    w > d && (d = w);
  }
  return {
    center: Gs(l, c, h),
    radius: Math.sqrt(d)
  };
}
function Ji(t, e) {
  const r = gb[t];
  if (r && e instanceof Float32Array) return r;
  if (e instanceof Float32Array)
    return t === "position" || t === "normal" ? "float32x3" : "float32";
  if (e instanceof Uint32Array) return "uint32";
  if (e instanceof Int32Array) return "sint32";
  throw new u(
    `[gpu-device-api] 无法从 ${e.constructor.name} 推断属性「${t}」的顶点格式：\`uint8\` / \`uint16\` / \`sint8\` / \`sint16\` 只有 x2、x4 两种写法，无法从字节数反推分量个数。
请显式写明分量，例如 \`{ data, format: 'unorm8x4' }\` 或 \`format: 'uint16x2'\`。`
  );
}
function yb(t, e, r) {
  if (t instanceof Uint16Array || t instanceof Uint32Array) return t;
  const n = t;
  let i = 0;
  for (const a of n) {
    if (!Number.isInteger(a) || a < 0)
      throw new u(`[gpu-device-api] 几何体「${r}」的索引里出现了非法值 ${a}。`);
    a > i && (i = a);
  }
  if (i >= e)
    throw new u(
      `[gpu-device-api] 几何体「${r}」的索引最大值 ${i} 超过了顶点数 ${e}。`
    );
  return Vo(e) === "uint32" ? Uint32Array.from(n) : Uint16Array.from(n);
}
function es(t, e) {
  return Math.ceil(t / e) * e;
}
function Ly(t, e) {
  return yr.create(t, e);
}
class vb {
  /** 是否已经由某个相机矩阵初始化过。 */
  ready = !1;
  planes = _n();
  worldCenter = M();
  scaling = M();
  /** 按 view-projection 矩阵与深度约定重建 6 个平面。 */
  update(e, r) {
    Sa(this.planes, e, r), this.ready = !0;
  }
  /** 世界空间的球是否可能与视锥相交。 */
  intersectsSphere(e, r) {
    return Ta(this.planes, e, r > 0 ? r : 0);
  }
  /**
   * 局部空间的包围球经 `model` 变换后是否可能与视锥相交。
   *
   * `model` 为 `null` / `undefined` 表示单位矩阵，直接用局部球判定（省掉矩阵运算）。
   */
  intersectsLocalSphere(e, r) {
    if (!r) return this.intersectsSphere(e.center, e.radius);
    if (xn(this.worldCenter, r, e.center), e.radius <= 0) return this.intersectsSphere(this.worldCenter, 0);
    vn(this.scaling, r);
    const n = Math.max(this.scaling[0], this.scaling[1], this.scaling[2]);
    return this.intersectsSphere(this.worldCenter, e.radius * n);
  }
}
function ts(t, e) {
  return t.pipeline !== e.pipeline ? t.pipeline - e.pipeline : t.bindings !== e.bindings ? t.bindings - e.bindings : t.depth !== e.depth ? t.depth - e.depth : t.order - e.order;
}
function xb(t, e) {
  return t.depth !== e.depth ? e.depth - t.depth : t.order - e.order;
}
function Sb(t, e) {
  if (e === "none" || t.length < 2) return;
  if (e === "opaque") {
    let s = 0;
    for (; s < t.length; ) {
      if (t[s].transparent) {
        s += 1;
        continue;
      }
      let a = s + 1;
      for (; a < t.length && !t[a].transparent; ) a += 1;
      a - s > 1 && Tb(t, s, a, ts), s = a;
    }
    return;
  }
  const r = [], n = [];
  for (const s of t)
    s.transparent ? n.push(s) : r.push(s);
  r.sort(ts), n.sort(xb);
  let i = 0;
  for (const s of r) t[i++] = s;
  for (const s of n) t[i++] = s;
}
function Tb(t, e, r, n) {
  const i = t.slice(e, r);
  i.sort(n);
  for (let s = 0; s < i.length; s += 1) t[e + s] = i[s];
}
const So = Object.freeze({
  rgba8unorm: { bytesPerPixel: 4, channels: 4 },
  "rgba8unorm-srgb": { bytesPerPixel: 4, channels: 4 },
  bgra8unorm: { bytesPerPixel: 4, channels: 4 },
  "bgra8unorm-srgb": { bytesPerPixel: 4, channels: 4 },
  r8unorm: { bytesPerPixel: 1, channels: 1 },
  rg8unorm: { bytesPerPixel: 2, channels: 2 }
}), $b = Object.freeze(
  Object.keys(So)
), Eb = /* @__PURE__ */ new Set(["bgra8unorm", "bgra8unorm-srgb"]);
function rs(t, e) {
  const r = So[t];
  if (!r)
    throw new u(
      `[gpu-device-api] The gfx texture layer cannot upload "${t}" from host memory. Supported formats: ${$b.join(", ")}. Use device.createTexture() + queue.writeTexture() for any other format.`
    );
  if (e.backend === "webgl2" && Eb.has(t))
    throw new u(
      `[gpu-device-api] Texture format "${t}" has no WebGL2 equivalent: BGRA exists there only as the implicit default framebuffer layout. Use "rgba8unorm" / "rgba8unorm-srgb" on WebGL2, or swizzle the channels before uploading.`
    );
  return r;
}
class ye {
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
    this.label = e.label, this.texture = e.texture, this.view = e.view, this.sampler = e.sampler, this.width = e.width, this.height = e.height, this.format = e.format, this.mipLevelCount = e.mipLevelCount, this.id = U("gfxTexture");
  }
  /**
   * 同步创建纹理（含可选 mip 链，mip 由后端生成）。
   *
   * `data` 是原始像素时必须给出 `width` / `height`；是图像来源时尺寸从来源读取（图像还没
   * 加载完会抛错，需要等 `load` 事件）。图像来源会走一次 canvas + `getImageData()`，
   * 那是同步的、也只能拿到 sRGB 字节 —— 想要真正的异步解码请用 {@link GfxTexture.fromImage}。
   */
  static create(e, r) {
    const n = r.label ?? "texture", i = r.format ?? "rgba8unorm", s = rs(i, e), a = To(r.data), o = r.flipY ?? a, l = r.mipmaps ?? a, c = ns(r.data, r.width, r.height, o, i, s);
    return ye.build(e, {
      label: n,
      format: i,
      width: c.width,
      height: c.height,
      mipmaps: l,
      magFilter: r.magFilter,
      minFilter: r.minFilter,
      wrapS: r.wrapS ?? r.wrap ?? "clamp-to-edge",
      wrapT: r.wrapT ?? r.wrap ?? "clamp-to-edge",
      upload: (h) => {
        e.queue.writeTexture(
          { texture: h, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
          c.data,
          { offset: 0, bytesPerRow: c.width * s.bytesPerPixel, rowsPerImage: c.height },
          { width: c.width, height: c.height, depthOrArrayLayers: 1 }
        );
      }
    });
  }
  /**
   * 异步创建纹理：用 `createImageBitmap` 解码，再直接把它拷进纹理。
   *
   * 相比 {@link GfxTexture.create}：
   * - 解码发生在**主线程之外**（`createImageBitmap` 是异步的），不会卡住渲染循环；
   * - 直接接受 URL / `Blob` / `File`，不需要先构造 `HTMLImageElement` 再等 `load`；
   * - 可以控制色彩空间转换与 alpha 预乘（见 {@link AsyncTextureDesc.imageOptions}）；
   * - 4 通道格式走 `queue.copyExternalImageToTexture`，**不经过主机内存**，没有 `getImageData`
   *   那一次「GPU → CPU → GPU」的往返；只有 `r8unorm` / `rg8unorm` 因为需要通道重排才会
   *   退回 canvas 中转。
   *
   * 由本方法创建的 `ImageBitmap` 一定会在结束前 `close()`（包括抛错路径），不会泄漏；
   * 即便 `source` 本身就是 `ImageBitmap`，`createImageBitmap` 也会先复制一份，
   * 因此关闭的始终是本方法自己的对象，调用方手里的 bitmap 不受影响。
   */
  static async fromImage(e, r) {
    const n = r.label ?? "texture", i = r.format ?? "rgba8unorm", s = rs(i, e), a = r.flipY ?? !0, o = r.mipmaps ?? !0, l = await Lb(r.source, r.imageOptions);
    try {
      const c = l.width, h = l.height;
      if (c <= 0 || h <= 0)
        throw new u(
          `[gpu-device-api] GfxTexture.fromImage("${n}"): the decoded image is ${c}x${h}.`
        );
      if (r.width !== void 0 && r.width !== c || r.height !== void 0 && r.height !== h)
        throw new u(
          `[gpu-device-api] GfxTexture.fromImage("${n}"): width/height (${String(r.width)}x${String(r.height)}) do not match the decoded image (${c}x${h}); copyExternalImageToTexture does not scale, so resize the source (or draw it into a canvas) first.`
        );
      if (s.channels === 4)
        return ye.build(e, {
          label: n,
          format: i,
          width: c,
          height: h,
          mipmaps: o,
          magFilter: r.magFilter,
          minFilter: r.minFilter,
          wrapS: r.wrapS ?? r.wrap ?? "clamp-to-edge",
          wrapT: r.wrapT ?? r.wrap ?? "clamp-to-edge",
          // WebGPU 规定 `copyExternalImageToTexture` 的目标纹理必须带 CopyDst **和**
          // RenderAttachment（实现内部可能用 render pass 完成这次拷贝），所以即使不生成 mip
          // 也要加上；WebGL2 忽略 usage，不受影响。
          extraUsage: x.RenderAttachment,
          upload: (p) => {
            e.queue.copyExternalImageToTexture(
              l,
              { texture: p, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
              { width: c, height: h, depthOrArrayLayers: 1 },
              a
            );
          }
        });
      const d = ns(l, c, h, a, i, s);
      return ye.build(e, {
        label: n,
        format: i,
        width: c,
        height: h,
        mipmaps: o,
        magFilter: r.magFilter,
        minFilter: r.minFilter,
        wrapS: r.wrapS ?? r.wrap ?? "clamp-to-edge",
        wrapT: r.wrapT ?? r.wrap ?? "clamp-to-edge",
        upload: (p) => {
          e.queue.writeTexture(
            { texture: p, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
            d.data,
            { offset: 0, bytesPerRow: c * s.bytesPerPixel, rowsPerImage: h },
            { width: c, height: h, depthOrArrayLayers: 1 }
          );
        }
      });
    } finally {
      l.close();
    }
  }
  /** 用一张 1×1 的纯色纹理占位（材质还没拿到真纹理时用，避免绑到未定义数据）。 */
  static solid(e, r) {
    return ye.create(e, {
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
  /**
   * 两条创建路径的公共部分：分配纹理 → 上传第 0 级 → 让后端生成 mip → 建采样器。
   *
   * 中途任何一步抛错都会把已经创建的纹理销毁掉，不让半成品留在设备上。
   */
  static build(e, r) {
    const n = r.mipmaps ? vs({ width: r.width, height: r.height }) : 1, i = n > 1, s = r.extraUsage ?? x.None, a = {
      label: r.label,
      size: { width: r.width, height: r.height },
      format: r.format,
      mipLevelCount: n,
      // usage 的三点说明：
      // 1. `defaultTextureUsage()` 已经给了 `TextureBinding | CopyDst`，上传就靠它；
      // 2. **额外加 `CopySrc`**：WebGPU 上不带这个标志的纹理不能作为 `copyTextureToBuffer` 的源，
      //    而且失败方式很隐蔽 —— 整条 command buffer 判为 invalid，读回来全是 0。gfx 创建的纹理
      //    应当能直接读回（截图/自检/调试都要用），所以在便捷层默认带上；
      // 3. WebGPU 的 mip 生成走 render pass、`copyExternalImageToTexture` 也要求目标是
      //    render attachment，两者都会通过 `extraUsage` 或 `useRenderAttachment` 加上
      //    `RenderAttachment`；WebGL2 完全忽略 usage。
      usage: Qo(0) | x.CopySrc | s | (i ? x.RenderAttachment : 0)
    }, o = e.createTexture(a);
    let l, c;
    try {
      r.upload(o), i && Ab(o, r.label, e.backend), l = o.createView(), c = e.createSampler({
        label: `${r.label}:sampler`,
        addressModeU: r.wrapS,
        addressModeV: r.wrapT,
        magFilter: r.magFilter ?? "linear",
        minFilter: r.minFilter ?? "linear",
        mipmapFilter: i ? "linear" : "nearest"
      });
    } catch (h) {
      throw o.destroy(), h;
    }
    return new ye({
      label: r.label,
      texture: o,
      view: l,
      sampler: c,
      width: r.width,
      height: r.height,
      format: r.format,
      mipLevelCount: n
    });
  }
  get disposed() {
    return this._disposed;
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.sampler.dispose(), this.texture.destroy());
  }
}
function Ab(t, e, r) {
  const n = t.generateMipmaps;
  if (typeof n != "function")
    throw new u(
      `[gpu-device-api] Texture "${e}": the ${r} backend does not implement Texture.generateMipmaps, so the gfx layer cannot build the mip chain on the GPU. Create the texture with { mipmaps: false } instead.`
    );
  n.call(t);
}
function To(t) {
  if (!t || typeof t != "object") return !1;
  const e = t.constructor?.name ?? "";
  return e === "ImageBitmap" || e === "HTMLImageElement" || e === "HTMLCanvasElement" || e === "OffscreenCanvas" || e === "ImageData" || e === "VideoFrame" || e === "HTMLVideoElement";
}
function ns(t, e, r, n, i, s) {
  if (!To(t)) {
    const m = t, g = new Uint8Array(m.buffer, m.byteOffset, m.byteLength), b = e ?? 0, w = r ?? 0;
    if (b <= 0 || w <= 0)
      throw new u(
        "[gpu-device-api] Creating a texture from raw pixels requires explicit width and height (the byte length alone cannot tell them apart)."
      );
    const y = b * w * s.bytesPerPixel;
    if (g.byteLength < y)
      throw new u(
        `[gpu-device-api] Texture data has ${g.byteLength} bytes, but a ${b}x${w} ${i} texture needs ${y} bytes (${s.bytesPerPixel} per pixel).`
      );
    const v = g.subarray(0, y);
    return { data: n ? qr(v, b, w, s.bytesPerPixel) : v, width: b, height: w };
  }
  if (Pb(t)) {
    const m = e ?? t.width, g = r ?? t.height;
    if (m <= 0 || g <= 0)
      throw new u(
        "[gpu-device-api] The given ImageData has no size; pass width/height explicitly."
      );
    const b = new Uint8Array(t.data.buffer, t.data.byteOffset, t.data.byteLength), w = is(b, m, g, i, s);
    return { data: n ? qr(w, m, g, s.bytesPerPixel) : w, width: m, height: g };
  }
  if (typeof document > "u" && typeof OffscreenCanvas > "u")
    throw new u(
      "[gpu-device-api] There is no canvas in this environment, so the image source cannot be decoded; pass raw pixels (with width/height) or use GfxTexture.fromImage()."
    );
  const a = t, o = e ?? a.naturalWidth ?? a.videoWidth ?? a.width ?? 0, l = r ?? t.naturalHeight ?? t.videoHeight ?? t.height ?? 0;
  if (o <= 0 || l <= 0)
    throw new u(
      "[gpu-device-api] The image source has no size yet (the image probably has not finished loading). Create the texture after the load event, or use GfxTexture.fromImage()."
    );
  const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(o, l) : document.createElement("canvas");
  c.width = o, c.height = l;
  const h = c.getContext("2d");
  if (!h)
    throw new u("[gpu-device-api] Could not acquire a 2D context to decode the image.");
  h.drawImage(t, 0, 0, o, l);
  const d = h.getImageData(0, 0, o, l), p = new Uint8Array(d.data.buffer, d.data.byteOffset, d.data.byteLength), f = is(p, o, l, i, s);
  return { data: n ? qr(f, o, l, s.bytesPerPixel) : f, width: o, height: l };
}
function Pb(t) {
  return t.constructor?.name === "ImageData";
}
function is(t, e, r, n, i) {
  const s = e * r;
  if (t.byteLength < s * 4)
    throw new u(
      `[gpu-device-api] Expected at least ${s * 4} RGBA bytes for a ${e}x${r} image, got ${t.byteLength}.`
    );
  if (i.channels === 4 && n !== "bgra8unorm" && n !== "bgra8unorm-srgb")
    return t.subarray(0, s * 4);
  const a = new Uint8Array(s * i.bytesPerPixel);
  if (n === "r8unorm") {
    for (let o = 0; o < s; o++) a[o] = t[o * 4];
    return a;
  }
  if (n === "rg8unorm") {
    for (let o = 0; o < s; o++)
      a[o * 2] = t[o * 4], a[o * 2 + 1] = t[o * 4 + 1];
    return a;
  }
  for (let o = 0; o < s; o++) {
    const l = o * 4;
    a[l] = t[l + 2], a[l + 1] = t[l + 1], a[l + 2] = t[l], a[l + 3] = t[l + 3];
  }
  return a;
}
function qr(t, e, r, n) {
  const i = e * n, s = new Uint8Array(t.byteLength);
  for (let a = 0; a < r; a++) {
    const o = a * i, l = (r - 1 - a) * i;
    s.set(t.subarray(o, o + i), l);
  }
  return s;
}
async function Lb(t, e) {
  if (typeof createImageBitmap != "function")
    throw new u(
      "[gpu-device-api] GfxTexture.fromImage requires createImageBitmap, which this environment does not provide; use GfxTexture.create() with raw pixels or an ImageData source instead."
    );
  const r = {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
    ...e
  };
  if (typeof t == "string") {
    const n = await fetch(t);
    if (!n.ok)
      throw new u(
        `[gpu-device-api] GfxTexture.fromImage: fetching "${t}" failed with HTTP ${n.status}.`
      );
    return await createImageBitmap(await n.blob(), r);
  }
  return await createImageBitmap(t, r);
}
function _y(t, e, r) {
  const n = [{ data: t, width: e, height: r }];
  let i = t, s = e, a = r;
  for (; s > 1 || a > 1; ) {
    const o = Math.max(1, s >> 1), l = Math.max(1, a >> 1), c = new Uint8Array(o * l * 4);
    for (let h = 0; h < l; h++) {
      const d = Math.min(h * 2, a - 1), p = Math.min(h * 2 + 1, a - 1);
      for (let f = 0; f < o; f++) {
        const m = Math.min(f * 2, s - 1), g = Math.min(f * 2 + 1, s - 1), b = (d * s + m) * 4, w = (d * s + g) * 4, y = (p * s + m) * 4, v = (p * s + g) * 4, T = (h * o + f) * 4;
        for (let E = 0; E < 4; E++)
          c[T + E] = i[b + E] + i[w + E] + i[y + E] + i[v + E] >> 2;
      }
    }
    n.push({ data: c, width: o, height: l }), i = c, s = o, a = l;
  }
  return n;
}
function _b(t) {
  const e = t;
  if (e.programs instanceof Rn) return e.programs;
  throw new u(
    "[gpu-device-api] prewarmWebGL2RenderPipeline: expected a WebGL2 device created by this library (its `programs` program cache was not found). Use the WebGPU helper for a WebGPU device."
  );
}
async function Cb(t, e, r = {}) {
  const n = _b(t), i = e.label ?? "renderPipeline";
  if (!e.fragment)
    throw new u(
      `[gpu-device-api] prewarmWebGL2RenderPipeline: WebGL2 needs both a vertex and a fragment stage (GL links them into one program), but pipeline "${i}" has no fragment stage.`
    );
  const s = bt({
    backend: "webgl2",
    source: e.vertex.module.source,
    stage: C.Vertex,
    label: i,
    defines: e.vertex.module.defines,
    glsl: e.vertex.module.glsl
  }).code, a = bt({
    backend: "webgl2",
    source: e.fragment.module.source,
    stage: C.Fragment,
    label: i,
    defines: e.fragment.module.defines,
    glsl: e.fragment.module.glsl
  }).code, o = await n.compileAsync(i, s, a, r), l = Rn.toPrewarmResult(i, o);
  if (!l.ok) {
    if (r.throwOnError) throw new u(cn(l.info));
    return { ...l, pipeline: null };
  }
  const c = t.createRenderPipeline(e);
  return { ...l, pipeline: c };
}
function Mb(t, e) {
  if (t.backend !== "webgpu")
    throw new u(
      `[gpu-device-api] ${e}: expected a WebGPU device, got backend "${t.backend}".`
    );
}
async function Rb(t, e, r = {}, n = {}) {
  Mb(t, "prewarmWebGPURenderPipeline");
  const i = t.createRenderPipeline(e);
  if (!(i instanceof kn))
    throw new u(
      "[gpu-device-api] prewarmWebGPURenderPipeline: createRenderPipeline() returned a pipeline that is not a WebGPURenderPipeline; this helper only works with the WebGPU backend."
    );
  const s = await i.prewarm(r, n);
  return { ...s, pipeline: s.ok ? i : null };
}
const Fb = "timestamp-query";
function ss(t) {
  const e = t.timing;
  return e ? t.backend === "webgl2" ? e.passTimestamps ? "pass" : "none" : e.encoderTimestamps ? "encoder" : "none" : "none";
}
const as = 32, os = 8, Bb = 4;
class dt {
  /** 每个环形槽占用几个 query 下标：WebGPU 需要「开始 + 结束」，WebGL2 只需要一个区间结果。 */
  slotStride;
  /** 本设备实际走的写入路径（见 {@link gpuTimingPath}）。构造成功后不可能是 `'none'`。 */
  path;
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
   * 读的是后端在创建设备时对**真实 API 表面**的探测结果（`Device.timing`），不是
   * `features.has('timestamp-query')` —— 两者的差别以及为什么必须这样，见 {@link gpuTimingPath}。
   */
  static isAvailable(e) {
    return ss(e) !== "none";
  }
  constructor(e, r = {}) {
    this.device = e, this.backend = e.backend, this.frames = ls(r.frames ?? as, as, 4, 256), this.delay = ls(r.delay ?? os, os, 1, this.frames - 1), this.recentSlots = new Array(this.frames).fill(null);
    const n = ss(e);
    if (n === "none")
      throw new u(Gb(e));
    this.path = n, this.slotStride = n === "pass" ? 1 : 2, this.querySet = e.createQuerySet({
      label: "gfx-gpu-timing",
      type: Je.Timestamp,
      count: this.frames * this.slotStride
    });
  }
  get disposed() {
    return this._disposed;
  }
  get stats() {
    return {
      enabled: !this._disposed,
      available: dt.isAvailable(this.device),
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
    if (this.path !== "encoder") return;
    const r = this.selectSlot();
    r !== null && e.writeTimestamp(this.querySet, r * this.slotStride);
  }
  /**
   * 本帧结束时的钩子：WebGPU 写「帧结束」时间戳。
   *
   * 必须在所有 pass 都 `end()` 之后、`finish()` 之前调用（WebGPU 规定 encoder 上写时间戳时
   * 不能有打开的 pass）。
   */
  afterFrameEncoding(e) {
    if (this.path !== "encoder") return;
    const r = this.selectSlot();
    r !== null && e.writeTimestamp(this.querySet, r * this.slotStride + 1);
  }
  /**
   * 给本帧的 render pass 用的 `timestampWrites`；WebGPU 不需要（它用 encoder 级时间戳），
   * 因此返回 undefined。
   */
  passTimestampWrites() {
    if (this.path !== "pass") return;
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
    const r = e - this.delay;
    if (r < 0) {
      this.skippedCount += 1;
      return;
    }
    if (this.inFlight >= Bb) {
      this.skippedCount += 1;
      return;
    }
    const n = this.recentSlots[r % this.frames];
    if (n == null) {
      this.skippedCount += 1;
      return;
    }
    if (this.busySlots.has(n)) {
      this.skippedCount += 1;
      return;
    }
    const i = n * this.slotStride, s = this.device.readQuerySet(this.querySet, {
      label: `gfx-gpu-timing:frame${r}`,
      firstQuery: i,
      queryCount: this.slotStride
    }), a = s.timestampPeriod;
    this.busySlots.add(n), this.inFlight += 1, s.read().then((o) => {
      const l = o[0] ?? 0n, c = this.slotStride === 2 ? o[1] ?? l : l, h = this.slotStride === 2 ? l : 0n;
      this.lastMs = cl(h, c, a), this.sampleCount += 1;
    }).catch((o) => {
      this.lastError = o instanceof Error ? o.message : String(o);
    }).finally(() => {
      this.busySlots.delete(n), this.inFlight -= 1;
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
      const r = (this.frameIndex + e) % this.frames;
      if (!this.busySlots.has(r)) {
        this.frameSlot = r;
        break;
      }
    }
    return this.frameSlot;
  }
}
function ls(t, e, r, n) {
  return Number.isFinite(t) ? Math.max(r, Math.min(Math.trunc(t), n)) : e;
}
function Gb(t) {
  const e = t.timing?.unavailableReason;
  return e || `[gpu-device-api] gfx GPU timing: this device does not report a usable GPU timing path ("encoder" via CommandEncoder.writeTimestamp(), or "pass" via pass timestamp writes), so timing cannot be enabled. Read GPU time from the backend's own profiler instead.`;
}
function Wt(t) {
  const e = t instanceof Error ? t.message : String(t);
  return e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
}
const Ob = le(), Ub = "the pipeline of this material was already built; prewarm skipped it so the compiled program is reused as-is";
class $o {
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
    gpuFrameTime: null,
    culled: 0,
    cullTested: 0,
    cullSkipped: 0,
    sorted: 0
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
  /** 渲染进纹理时的行序策略；见 {@link RendererOptions.rowOrder}。 */
  _rowOrder = "unified";
  /**
   * **当前通道**是否需要把相机投影在裁剪空间 Y 取反（并在同一通道内翻转 `frontFace`）。
   *
   * 由 `beginFrame()` / `beginPass()` 按该通道的附件决定：附件来自离屏目标且该目标原生行序是
   * `'bottomUp'`、同时 `rowOrder === 'unified'` 时为 true。它是**逐通道**的状态 ——
   * 切回画布通道时会被重新算成 false，于是下一个 draw 用的又是没翻过的那条管线。
   */
  passFlipsRows = !1;
  /** `passFlipsRows` 为 true 时用的翻转后投影矩阵（暂存，避免每 draw 分配）。 */
  flippedProjectionMatrix = le();
  /** `passFlipsRows` 为 true 时用的翻转后投影视图矩阵（暂存）。 */
  flippedProjectionViewMatrix = le();
  encoder = null;
  pass = null;
  commandBuffers = [];
  currentMaterial = null;
  /** 上一次 draw 用的管线，用来统计真正的「管线切换」次数（每个通道开头清空）。 */
  currentPipeline = null;
  defaultTexture = null;
  frameStart = 0;
  /** 计算法线矩阵时复用的暂存区，避免每帧分配。 */
  normalMatrixScratch = Vs();
  /** 排序时算「包围球中心的世界坐标」用的暂存区。 */
  sortPointScratch = M();
  /** 视锥剔除器：`updateCamera()` 里按当帧矩阵刷新。 */
  culler = new vb();
  _culling;
  _sortMode;
  /** 排序模式下本通道待提交的绘制。 */
  pending = [];
  nextPipelineId = 1;
  /**
   * 纹理 bind group → 排序序号。
   *
   * 用对象身份而不是拼字符串：排序键必须在每 draw 上是 O(1) 的，拼 `${name}|${id},${id}` 会
   * 在每个 draw 上产生一个短命字符串 —— 那正好是排序想省掉的开销。
   */
  textureGroupIds = /* @__PURE__ */ new Map();
  nextTextureGroupId = 1;
  _disposed = !1;
  constructor(e) {
    this.backend = e.backend, this.device = e.device, this.context = e.context, this.canvas = e.canvas, this.logger = e.logger, this.camera = e.options.camera ?? null, this._clearColor = e.options.clearColor ?? "#0b0e13", this._pixelRatio = e.options.pixelRatio ?? e.context.pixelRatio, this._width = e.context.width, this._height = e.context.height, this._culling = e.options.culling ?? !0, this._sortMode = e.options.sort ?? "none", this._rowOrder = e.options.rowOrder ?? "unified", this.arenaPool = new db(e.device);
  }
  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(e) {
    const r = e.logger ?? rt("gpu-device-api/gfx"), n = {
      antialias: e.antialias ?? !0,
      alpha: e.alpha ?? !1,
      depth: e.depth ?? !0,
      stencil: !1,
      premultipliedAlpha: !0,
      preserveDrawingBuffer: !1,
      powerPreference: e.powerPreference ?? "high-performance",
      ...e.contextAttributes
    }, i = n.depth !== !1, s = await yo({
      canvas: e.canvas,
      backend: e.backend ?? "auto",
      label: "gfx-renderer",
      contextAttributes: n,
      // GPU 计时需要 `timestamp-query`，而 WebGPU 只能在 requestDevice 时申请。
      // 用 optionalFeatures：后端不支持时忽略而不是让整个 Renderer.create 失败
      //（真正的失败原因由 enableGpuTiming() → createQuerySet() 给出）。
      ...e.requiredFeatures ? { requiredFeatures: e.requiredFeatures } : {},
      ...e.gpuTiming ? { optionalFeatures: [Fb] } : {}
    });
    if (!s.context)
      throw new u("[gpu-device-api] 创建 Renderer 必须提供 canvas。");
    const a = e.sampleCount ?? (s.backend === "webgpu" && (e.antialias ?? !0) ? 4 : void 0);
    (a !== void 0 || !i) && s.device.createCanvasContext(e.canvas, {
      ...a !== void 0 ? { sampleCount: a } : {},
      ...i ? {} : { depth: !1 }
    });
    const o = new $o({
      backend: s.backend,
      device: s.device,
      context: s.context,
      canvas: e.canvas,
      logger: r,
      options: e
    });
    if (e.pixelRatio && o.setPixelRatio(e.pixelRatio), o.resize(), e.gpuTiming)
      try {
        o.enableGpuTiming(typeof e.gpuTiming == "object" ? e.gpuTiming : {});
      } catch (l) {
        o.gpuTimingError = Wt(l), r.warn(`GPU 计时不可用：${o.gpuTimingError}`);
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
    this.camera = e, this.updateCamera();
  }
  /* ------------------------------------------------------------------ 资源 ------------------- */
  createGeometry(e) {
    const r = yr.create(this.device, e);
    return this.geometries.add(r), r;
  }
  /** 创建（或直接登记）一个材质。 */
  createMaterial(e) {
    const r = e instanceof wr ? e : ub(e);
    return this.materials.has(r) || this.materials.set(r, {
      material: r,
      layout: r.createPipelineLayout(this.device),
      pipeline: null,
      pipelineFlipped: null,
      // 还原掉 createUniforms() 的 Proxy：渲染器的每 draw 写入路径直接操作原始对象，
      // 免得每次 set()/has() 都穿一遍 Proxy 陷阱（见 unwrapUniforms 的说明）。
      values: r.uniforms ? ib(r.createUniforms()) : null,
      pipelineId: this.nextPipelineId++,
      // 半透明物不能被随意排序（见 DrawSort）：这里解析一次混合状态，之后只读这个布尔值。
      transparent: r.resolveBlend() !== null
    }), r;
  }
  createTexture(e) {
    const r = ye.create(this.device, e);
    return this.textures.add(r), r;
  }
  /** 当前设置的材质（`draw()` 未显式指定时使用）。 */
  setMaterial(e) {
    this.currentMaterial = e, e && this.createMaterial(e);
  }
  /**
   * 渲染进纹理时的行序策略；默认 `'unified'`（本层自动统一，见 {@link RendererOptions.rowOrder}）。
   *
   * 改完在**下一个通道**生效（`beginFrame()` / `beginPass()` 会重新判定），当前通道不受影响。
   */
  get rowOrder() {
    return this._rowOrder;
  }
  set rowOrder(e) {
    this._rowOrder = e;
  }
  get material() {
    return this.currentMaterial;
  }
  get stats() {
    return this.statsValue;
  }
  /* ------------------------------------------------------- 剔除 / 排序 ------------------------ */
  /** 是否开启视锥剔除（默认开）。打开时立刻按当前相机刷新一次视锥。 */
  get culling() {
    return this._culling;
  }
  set culling(e) {
    this._culling = e, e && this.updateCamera();
  }
  /** 是否已经有一个可用的视锥（相机存在、且剔除开着时才会是 true）。 */
  get cullingReady() {
    return this._culling && this.camera !== null && this.culler.ready;
  }
  /** 当前排序模式。 */
  get sortMode() {
    return this._sortMode;
  }
  set sortMode(e) {
    e !== this._sortMode && (this.flushPending(), this._sortMode = e);
  }
  /* ------------------------------------------------------------------ GPU 计时 --------------- */
  /** 当前后端 + 设备是否具备 GPU 计时能力（不创建设备资源，可先判断再决定要不要开）。 */
  get supportsGpuTiming() {
    return dt.isAvailable(this.device);
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
      available: dt.isAvailable(this.device),
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
   * 显式调用时**失败就抛错**，而且**在启用时就抛**（带 `[gpu-device-api] ` 前缀的英文消息，
   * 说明缺哪个 feature / 缺哪个方法 / 缺哪个扩展）—— 这正是本次修复的一个要点：以前的判定只看
   * 特性标志，会把「启用了 `timestamp-query` 但实现没暴露 `GPUCommandEncoder.writeTimestamp()`」
   * 的设备判成可用，于是异常拖到第一次记时间戳时才炸（那一炸在帧循环里，整页渲染跟着挂）。
   * 想让失败静默降级请用 `Renderer.create({ gpuTiming: true })`（它会把原因写进 `gpuTiming.error`）。
   *
   * 实现方式是环形 query set + 延迟若干帧的异步读回，**不会每帧阻塞等待 GPU**；
   * 详见 `GpuTiming` 的说明。
   */
  enableGpuTiming(e = {}) {
    if (this.gpuTimingValue) return;
    const r = new dt(this.device, e);
    this.gpuTimingValue = r, this.gpuTimingError = null;
  }
  /** 关闭 GPU 计时并释放 query set。 */
  disableGpuTiming() {
    const e = this.gpuTimingValue;
    if (this.gpuTimingValue = null, this.statsValue.gpuFrameTime = null, !!e)
      try {
        e.destroy();
      } catch (r) {
        this.logger.warn(`释放 GPU 计时资源失败：${Wt(r)}`);
      }
  }
  /**
   * 跑一步 GPU 计时调用；失败就**自动关掉计时、记下原因、渲染继续**。
   *
   * 为什么必须这样包：GPU 计时是**可选**的性能分析能力，它的任何失败都不该让渲染/页面失败。
   * 实测的事故正好相反 —— 设备启用了 `timestamp-query` 却没暴露 `writeTimestamp`，写时间戳抛出的
   * 异常逃进帧循环，`examples/gfx-benchmark.html` 整页 fail（连带 CPU 那几列也一起没了）。
   * 所以这里把失败降级成：`enabled: false` + `error`（可读）+ `stats.gpuFrameTime = null`，
   * 同时释放 query set；本帧与后续帧照常渲染，只是不再有 GPU 数据。
   */
  runGpuTimingStep(e) {
    const r = this.gpuTimingValue;
    if (r)
      try {
        e(r);
      } catch (n) {
        this.disableGpuTimingAfterFailure(r, n);
      }
  }
  /** 运行中失败后的降级收尾（见 {@link Renderer.runGpuTimingStep}）；绝不抛。 */
  disableGpuTimingAfterFailure(e, r) {
    this.gpuTimingValue = null, this.gpuTimingError = Wt(r), this.statsValue.gpuFrameTime = null;
    try {
      e.destroy();
    } catch (n) {
      this.logger.warn(`释放 GPU 计时资源时又失败了一次：${Wt(n)}`);
    }
    this.logger.warn(`GPU 计时在运行中失败，已自动关闭（渲染继续）：${this.gpuTimingError}`);
  }
  /* ------------------------------------------------------ 预热 / 编译诊断 ---------------------- */
  /**
   * 预编译一批材质的管线变体，把编译/链接开销挪出渲染循环。
   *
   * ```ts
   * const renderer = await Renderer.create({ canvas });
   * const lamberts = [...];                       // 一批材质
   * const report = await renderer.prewarm({ materials: lamberts });
   * if (!report.ok) console.warn(report.results.map((r) => r.reason));
   * // 之后第一帧用这些材质绘制时，管线已经好了
   * ```
   *
   * ## 两个后端同一段代码
   *
   * 调用方**不需要**写「`this.backend === 'webgl2' ? ... : ...`」的分支：这里按
   * {@link Renderer.backend} 分派到后端的设备级入口
   *（`prewarmWebGL2RenderPipeline` / `prewarmWebGPURenderPipeline`）。
   * 两个后端的**顺序差异**（WebGPU 先建管线对象再 `await prewarm(variant)`；
   * WebGL2 先把 program 链接好再建管线）封在 helper 里，这里只负责
   * 「算出与绘制时一致的 variant」和「把 helper 返回的管线交回给绘制路径」。
   *
   * ## 为什么预热到的就是绘制时用的那一条
   *
   * 两个后端的编译成果都挂在**管线对象自己**的缓存上（WebGPU 的 variant 缓存、
   * WebGL2 的 program 缓存）。所以预热成功后这里会把 helper 返回的管线存进该材质的状态，
   * 之后 `draw()` → `acquirePipeline()` 直接复用它 —— 另建一条等于白预热。
   *
   * variant 的推导见 {@link Renderer.pipelineVariantFor}：它复用绘制路径的
   * `createPipelineDescriptor()` 与 `createPassDescriptor()`，不另写一套。
   *
   * ## 不重复预热、也不会让渲染挂掉
   *
   * - 已经有管线的材质**直接跳过**（结果里 `skipped: true`，`reason` 说明原因），
   *   只把已有管线的诊断读回来；
   * - 预热失败（着色器编译错误、超时）**不抛错**：结果里 `ok: false`、`pipeline: null`、
   *   详细诊断在 `reason` / `info` 里。想直接抛错请显式传 `{ throwOnError: true }`；
   * - WebGL2 缺 `KHR_parallel_shader_compile` 时会退化成同步（`mode: 'sync'`）并**如实说明**
   *   —— 这时它仍然有价值：同一段同步工作被提前到了调用 `prewarm()` 的时候。
   *
   * 建议在帧外（加载阶段、切场景之前）调用；在 `beginFrame()` 与 `endFrame()` 之间调用也能跑，
   * 但 `await` 期间整帧会挂在那里。
   */
  async prewarm(e = {}) {
    const r = N(), n = e.materials ?? [...this.materials.keys()], i = e.target ? { target: e.target } : {}, s = this.flipsRowsFor(i), a = {
      ...e.timeoutMs !== void 0 ? { timeoutMs: e.timeoutMs } : {},
      ...e.throwOnError !== void 0 ? { throwOnError: e.throwOnError } : {}
    }, o = [];
    let l = null, c = 0, h = 0, d = 0;
    for (const p of n) {
      const f = this.materialState(p), m = s ? f.pipelineFlipped : f.pipeline;
      if (m) {
        h += 1, o.push(await this.skippedPrewarmResult(f, m));
        continue;
      }
      const g = this.pipelineDescriptorFor(f, s), b = this.pipelineVariantFor(g, i);
      l ??= b;
      const w = this.backend === "webgl2" ? await Cb(this.device, g, a) : await Rb(this.device, g, b, a);
      w.pipeline && (s ? f.pipelineFlipped = w.pipeline : f.pipeline = w.pipeline), w.ok ? c += 1 : d += 1, o.push({
        material: p,
        label: w.label,
        ok: w.ok,
        skipped: !1,
        mode: w.mode,
        reason: w.reason,
        durationMs: w.durationMs,
        info: w.info,
        pipeline: w.pipeline,
        variant: b
      });
    }
    return {
      backend: this.backend,
      variant: l,
      ...this.summarizePrewarm(o, c, h, d),
      durationMs: N() - r,
      results: o
    };
  }
  /**
   * 某个材质的管线编译诊断（每条 message 带 `type` / `lineNum` / `linePos` / `stage`）。
   *
   * `CompilationInfo` 是 core 的公共结构，这里原样透出 —— WebGL2 的 `lineNum` 来自
   * `getShaderInfoLog()` / `getProgramInfoLog()` 的原文解析（`linePos` 恒为 `null`），
   * WebGPU 来自 `GPUShaderModule.getCompilationInfo()`（行列都有）。
   *
   * 诊断挂在管线上，所以这条材质**还没建过管线**时这里会走一次 `prewarm()`
   *（等价于 `(await this.prewarm({ materials: [material] })).results[0].info`）：
   *
   * - 编译成功：管线被留下，之后 `draw()` 直接用它（不白跑）；
   * - 编译失败：**不抛错**，把带真实行号的诊断交回 —— 这正是「着色器写错了想知道错在哪一行」
   *   最需要的路径（WebGL2 上 program 链接失败时 `acquirePipeline()` 会抛，所以这里不能走它）。
   *
   * 想自己控制超时/抛错行为就直接调 `prewarm()`。
   */
  async compilationInfo(e) {
    const r = this.materialState(e), n = r.pipeline ?? r.pipelineFlipped;
    return n ? this.readCompilationInfo(n) : (await this.prewarm({ materials: [e] })).results[0].info;
  }
  /** 由逐条明细汇总出的整体结论（`mode` / `reason` / `ok` 的口径见各自的类型注释）。 */
  summarizePrewarm(e, r, n, i) {
    const s = e.filter((c) => !c.skipped);
    let a = null;
    s.length > 0 && (a = s.every((c) => c.mode === "async") ? "async" : "sync");
    const o = s.find((c) => !c.ok && c.reason !== null)?.reason ?? null, l = a === "sync" ? s.find((c) => c.mode === "sync")?.reason ?? null : null;
    return { mode: a, reason: o ?? l, ok: i === 0, prewarmed: r, skipped: n, failed: i };
  }
  /** 已建过管线时的结果：不重新预热，只把诊断读回来（结果形状与真预热一致）。 */
  async skippedPrewarmResult(e, r) {
    const n = N(), i = await this.readCompilationInfo(r);
    return {
      material: e.material,
      label: r.label,
      ok: !i.hasErrors,
      skipped: !0,
      mode: null,
      reason: Ub,
      durationMs: N() - n,
      info: i,
      pipeline: r,
      variant: null
    };
  }
  /** 读一条管线的诊断；后端没提供这个能力时**如实说明**（而不是假装「编译干净」）。 */
  async readCompilationInfo(e) {
    return typeof e.getCompilationInfo == "function" ? e.getCompilationInfo() : xe({
      label: e.label,
      backend: this.backend,
      messages: [
        Se({
          type: "info",
          label: e.label,
          backend: this.backend,
          message: "this pipeline does not expose getCompilationInfo(); no diagnostics are available"
        })
      ]
    });
  }
  /* ------------------------------------------------------------------ 帧 --------------------- */
  beginFrame(e = {}) {
    this._inFrame && this.endFrame(), this.frameStart = typeof performance < "u" ? performance.now() : Date.now(), this.resize(), this.arenaPool.beginFrame(), this.updateCamera(), this.encoder = this.device.createCommandEncoder({ label: "gfx-frame" }), this.runGpuTimingStep((i) => i.beforeFrame(this.encoder));
    const r = e.color ?? this._clearColor, n = this.createPassDescriptor(e, r);
    if (!n.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。");
    this.passFlipsRows = this.flipsRowsFor(e), this.pass = this.encoder.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: n.colorAttachments,
      ...n.depthStencilAttachment ? { depthStencilAttachment: n.depthStencilAttachment } : {},
      // GPU 计时只标在本帧第一个通道上：单通道帧（beginFrame 的默认形态）就是整帧；
      // 多通道时 beginPass() 开的通道不写时间戳，避免把不同通道混进同一个样本。
      ...this.timestampWritesForPass()
    }), this.commandBuffers = [], this.statsValue.drawCalls = 0, this.statsValue.triangles = 0, this.statsValue.instances = 0, this.statsValue.pipelineSwitches = 0, this.statsValue.culled = 0, this.statsValue.cullTested = 0, this.statsValue.cullSkipped = 0, this.statsValue.sorted = 0, this.currentPipeline = null, this._inFrame = !0;
  }
  endFrame() {
    if (!this._inFrame) return;
    this.flushPending(), this.pass?.end();
    const e = this.encoder;
    e && (this.runGpuTimingStep((n) => n.afterFrameEncoding(e)), this.commandBuffers.push(e.finish())), this.commandBuffers.length > 0 && this.device.queue.submit(this.commandBuffers);
    const r = typeof performance < "u" ? performance.now() : Date.now();
    this.statsValue.frameTime = r - this.frameStart, this.gpuTimingValue && (this.runGpuTimingStep((n) => n.onFrameSubmitted()), this.statsValue.gpuFrameTime = this.gpuTimingValue?.stats.gpuFrameTimeMs ?? null), this.pass = null, this.encoder = null, this.commandBuffers = [], this._inFrame = !1;
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
    this.flushPending(), this.pass?.end();
    const r = this.encoder, n = this.createPassDescriptor(e, e.color ?? this._clearColor);
    if (!n.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前通道没有颜色附件。");
    this.passFlipsRows = this.flipsRowsFor(e), this.pass = r.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: n.colorAttachments,
      ...n.depthStencilAttachment ? { depthStencilAttachment: n.depthStencilAttachment } : {}
    }), this.currentPipeline = null;
  }
  /**
   * 取出（必要时创建）本帧第一个 render pass 的 GPU 计时写入点。
   *
   * 取写入点这一步失败同样降级（见 {@link Renderer.runGpuTimingStep}），**通道照常开**：
   * 只是这一帧不带时间戳，绝不能让「拿不到计时」变成「这一帧画不出来」。
   */
  timestampWritesForPass() {
    let e;
    return this.runGpuTimingStep((r) => {
      e = r.passTimestampWrites();
    }), e ? { timestampWrites: e } : {};
  }
  /**
   * 「画到离屏 target」与「画到 canvas」走同一段代码，只是附件来源不同。
   *
   * 两条路径都返回同一形状的 {@link RenderPassDescriptor}（colorAttachments + depthStencilAttachment），
   * 所以深度附件不会被某一条路径漏掉 —— 之前的缺陷正是「画布路径自己拼 color attachment、
   * 从不传 depth attachment」，于是后端的状态解析器如实关掉了 DEPTH_TEST。
   */
  createPassDescriptor(e, r) {
    const n = {
      loadOp: e.load ? "load" : "clear",
      storeOp: "store",
      clearValue: r,
      depthLoadOp: e.load ? "load" : "clear",
      depthClearValue: e.depth ?? 1
    };
    return e.target ? e.target.createPassDescriptor(n) : this.context.createPassDescriptor(n);
  }
  /**
   * 一个通道要不要把相机投影在裁剪空间 Y 取反（并翻转 `frontFace`）。
   *
   * 两条判据，缺一不可：
   *
   * 1. **附件是纹理，不是 canvas 默认帧缓冲** —— 只有离屏目标才有「纹素行序」这件事，
   *    画布那一侧浏览器的合成路径本来就是对的（真实合成截图证明两个后端的画布原样一致率
   *    是 100%），翻了反而上下颠倒。判定用的就是「这个通道有没有传 `target`」。
   * 2. **该目标的后端原生行序不是 `'topLeft'`** —— 直接读 core 暴露的
   *    {@link RenderTarget.rowOrder}（WebGPU = `'topLeft'`、WebGL2 = `'bottomUp'`），
   *    而不是写 `backend === 'webgl2'`：这样后端多一种行序时这里自动跟上。
   *
   * `rowOrder: 'backend'` 时恒为 false（调用方明确要求保留原生行序）。
   */
  flipsRowsFor(e) {
    return this._rowOrder !== "unified" ? !1 : e.target?.rowOrder === "bottomUp";
  }
  /**
   * 绘制一个几何体。
   *
   * 三件事按顺序发生：
   * 1. **校验**（属性和实例数）永远立刻做，错了就当行抛；
   * 2. **视锥剔除**：开了 `culling` 且几何体有包围球时，整体在视锥外就直接返回
   *   （只累加 `stats.culled`，不进命令缓冲）；
   * 3. **提交或排队**：`sort: 'none'`（默认）立刻提交；开了排序就先入队，
   *   到 `endFrame()` / 下一个 `beginPass()` 才按排序结果提交 —— 那时
   *   `stats.drawCalls` 之类才完整。
   */
  draw(e, r = {}) {
    if (!this._inFrame || !this.pass)
      throw new u(
        "[gpu-device-api] draw() 必须在 beginFrame() ... endFrame() 之间调用。"
      );
    const n = r.material ?? this.currentMaterial;
    if (!n)
      throw new u(
        "[gpu-device-api] draw() 之前必须先 setMaterial()，或在 draw() 里传 material。"
      );
    const i = this.materialState(n);
    if (e.validateAgainst(n.attributes, n.name), this.assertInstanceCount(e, r.instances), !this.isCulled(e, r.model)) {
      if (this._sortMode === "none") {
        this.submitDraw(e, n, i, r);
        return;
      }
      this.enqueueDraw(e, n, i, r);
    }
  }
  /**
   * 视锥剔除判定。返回 `true` 表示「整体在视锥外，别画了」。
   *
   * 判定失败（没有相机、还没有视锥、几何体没有可用包围球）时一律返回 `false`
   * 并计入 `stats.cullSkipped` —— 剔除只能少画，绝不能多剔。
   */
  isCulled(e, r) {
    if (!this._culling) return !1;
    if (this.statsValue.cullTested += 1, !this.camera || !this.culler.ready)
      return this.statsValue.cullTested -= 1, this.statsValue.cullSkipped += 1, !1;
    const n = e.boundingSphere;
    return !n || !e.cullable ? (this.statsValue.cullTested -= 1, this.statsValue.cullSkipped += 1, !1) : this.culler.intersectsLocalSphere(n, r) ? !1 : (this.statsValue.culled += 1, !0);
  }
  /** 排序模式：把这次绘制存进队列，算好排序键。 */
  enqueueDraw(e, r, n, i) {
    const s = r.textures.length > 0 ? this.acquireTextureBindGroup(r, i.textures ?? {}) : null;
    this.pending.push({
      geometry: e,
      material: r,
      state: n,
      options: i,
      pipeline: n.pipelineId,
      bindings: s ? this.textureGroupId(s) : 0,
      depth: this.depthOf(e, i.model),
      transparent: n.transparent,
      order: this.pending.length
    }), this.statsValue.sorted += 1;
  }
  /** 把排队的绘制按当前模式排序后提交（`beginPass()` / `endFrame()` / 切模式时调用）。 */
  flushPending() {
    const e = this.pending;
    if (e.length !== 0)
      try {
        Sb(e, this._sortMode);
        for (const r of e)
          this.submitDraw(r.geometry, r.material, r.state, r.options);
      } finally {
        e.length = 0;
      }
  }
  /** 真正把一次绘制写进命令缓冲。`draw()` 与排序队列的 flush 都走这里。 */
  submitDraw(e, r, n, i) {
    const s = this.acquirePipeline(n);
    if (this.pass.setPipeline(s), this.currentPipeline !== s && (this.currentPipeline = s, this.statsValue.pipelineSwitches += 1), r.uniforms && n.values) {
      if (this.applyCameraUniforms(n.values, r), r.uniforms.has("model") && n.values.set("model", i.model ?? Ob), this.updateNormalMatrix(n.values, r), i.uniforms)
        for (const [o, l] of Object.entries(i.uniforms))
          this.setIfPresent(n.values, o, l);
      const a = r.createUniformBindGroupLayout(this.device);
      if (a) {
        const o = this.arenaPool.acquire(r.uniforms), l = o.write(n.values);
        this.pass.setBindGroup(r.uniforms.group, o.bindGroup(a), [l]);
      }
    }
    if (r.textures.length > 0) {
      const a = this.acquireTextureBindGroup(r, i.textures ?? {});
      a && this.pass.setBindGroup(r.textureGroup, a);
    }
    for (const a of r.attributes) {
      const o = e.attributes.get(a.name);
      this.pass.setVertexBuffer(a.location, o.buffer, 0, o.buffer.size);
    }
    e.indexBuffer && e.indexFormat ? (this.pass.setIndexBuffer(e.indexBuffer, e.indexFormat, 0, e.indexBuffer.size), this.pass.drawIndexed({
      indexCount: i.count ?? e.indexCount,
      ...i.first !== void 0 ? { firstIndex: i.first } : {},
      ...i.instances !== void 0 ? { instanceCount: i.instances } : {}
    })) : this.pass.draw({
      vertexCount: i.count ?? e.vertexCount,
      ...i.first !== void 0 ? { firstVertex: i.first } : {},
      ...i.instances !== void 0 ? { instanceCount: i.instances } : {}
    }), this.statsValue.drawCalls += 1, this.statsValue.instances += i.instances ?? 1, this.statsValue.triangles += Ib(e, i) * (i.instances ?? 1);
  }
  /** 一次画多个实例（需要材质配合 `perInstance` 属性）。 */
  drawInstanced(e, r, n = {}) {
    this.draw(e, { ...n, instances: r });
  }
  /**
   * 实例数与几何体提供的实例数据是否匹配。
   *
   * 实例属性的元素个数就是「最多能画多少个实例」：要多了，WebGL2 会静默地读到缓冲区之外的数据
   *（画面出错但不报错），WebGPU 会在 draw 时报校验错误 —— 两种都不好定位，所以这里提前拦下。
   */
  assertInstanceCount(e, r) {
    if (r === void 0) return;
    if (!Number.isInteger(r) || r < 1)
      throw new u(
        `[gpu-device-api] draw() 的 instances 必须是正整数，实际是 ${String(r)}。`
      );
    const n = e.instanceCount;
    if (n !== null && r > n)
      throw new u(
        `[gpu-device-api] 几何体「${e.label}」只提供了 ${n} 份实例数据，但要画 ${r} 个实例。请把实例属性（perInstance: true）的数据补足到 ${r} 份。`
      );
  }
  destroy() {
    if (!this._disposed) {
      this._disposed = !0, this._inFrame && this.endFrame(), this.gpuTimingValue?.destroy(), this.gpuTimingValue = null;
      for (const e of this.materials.values())
        e.pipeline?.dispose(), e.pipelineFlipped?.dispose(), e.values = null;
      this.materials.clear(), this.pending.length = 0, this.textureGroupIds.clear();
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
  /**
   * 登记（必要时）并取出一个材质的状态。
   *
   * `draw()` / `setMaterial()` / `prewarm()` / `compilationInfo()` 都走这里，
   * 「材质第一次出现时登记什么」只有一份实现。
   */
  materialState(e) {
    const r = this.materials.get(e);
    return r || (this.createMaterial(e), this.materials.get(e));
  }
  /**
   * 取得（必要时创建）本通道该用的管线。
   *
   * 画布通道与「绕序翻转」的离屏通道各有一条，选择只看**当前通道**的 {@link Renderer.passFlipsRows}
   * —— 于是切回画布通道后第一个 draw 就会用回没翻过的那条，`frontFace` 随之恢复正确
   * （每条管线的固定功能状态在每个 draw 上都会重新下发，见 `WebGL2RenderPipeline.applyState`）。
   */
  acquirePipeline(e) {
    return this.passFlipsRows ? (e.pipelineFlipped ??= this.device.createRenderPipeline(this.pipelineDescriptorFor(e, !0)), e.pipelineFlipped) : (e.pipeline ??= this.device.createRenderPipeline(this.pipelineDescriptorFor(e, !1)), e.pipeline);
  }
  /**
   * 一条材质要交给 `device.createRenderPipeline()` 的描述。
   *
   * `acquirePipeline()`（真正绘制时）与 `prewarm()` 走的是**同一个方法**，
   * 所以预热用的 `vertexLayouts` 就是从这份描述的 `vertex.buffers` 来的，
   * 不会出现「预热一套布局、绘制另一套」。
   *
   * `flipWinding` 为 true 时只改一个字段：把 `primitive.frontFace` 换到另一侧。
   * 渲染进「自下而上」的离屏目标时投影被 Y 取反、三角绕序跟着反了（见 `mat4.flipClipY`），
   * 所以背面剔除必须按反过来的正面判，否则会被剔除错面。**着色器一个字都不改** ——
   * 这也是为什么它可以和 `pipeline` 共用同一份 program，而不是第二条编译变体。
   */
  pipelineDescriptorFor(e, r = !1) {
    const n = e.material.createPipelineDescriptor(this.device).descriptor;
    if (!r) return n;
    const i = (n.primitive?.frontFace ?? "ccw") === "ccw" ? "cw" : "ccw";
    return { ...n, primitive: { ...n.primitive, frontFace: i } };
  }
  /**
   * 一条管线在**真正绘制时**会被解析出的 variant。
   *
   * 这里刻意不另写一套推导，每个字段都与绘制路径同源：
   *
   * - `vertexLayouts`：来自 {@link pipelineDescriptorFor}，也就是 `acquirePipeline()` 交给
   *   `createRenderPipeline()` 的那份描述（材质声明几个属性就是几个槽位，顺序也一样）；
   * - `colorFormats` / `depthFormat` / `sampleCount`：来自 {@link createPassDescriptor} 的
   *   附件列表 —— 与 `beginFrame()` 调用的是同一个方法，附件来源同样是 canvas
   *   或 `options.target`。
   *
   * `sampleCount` 两个后端的解析口径不同，这里照抄各自的渲染通道解析器，而不是取「看起来对」的值：
   * WebGPU 取附件纹理的采样数（画布 MSAA 会体现在这里），WebGL2 取渲染目标声明的采样数、
   * canvas 路径恒为 1（见 `WebGL2RenderPassEncoder` 的 `variantShape`）。
   *
   * 附件的 `colorFormats` / `depthFormat` 对 WebGPU 是「variant 描述 target 的附件」，与管线自己
   * 是否使用深度无关（那是 `descriptor.depthStencil` 的事）—— 两处都按这个语义传。
   */
  pipelineVariantFor(e, r) {
    const n = this.createPassDescriptor(r, this._clearColor), i = [];
    for (const a of n.colorAttachments)
      a && i.push(this.attachmentFormat(a.view));
    const s = n.depthStencilAttachment?.view ?? null;
    return {
      colorFormats: i,
      sampleCount: this.backend === "webgl2" ? this.webgl2SampleCountFor(r) : this.webgpuSampleCountFor(n),
      depthFormat: s ? this.attachmentFormat(s) : null,
      vertexLayouts: e.vertex.buffers ?? []
    };
  }
  /**
   * 附件的实际格式。
   *
   * 两个后端的口径不同（照抄各自的渲染通道解析器）：WebGPU 的 view 可以重解释格式，
   * 所以 `view.descriptor.format` 优先；WebGL2 的附件格式就是纹理格式。
   */
  attachmentFormat(e) {
    return this.backend === "webgpu" ? e.descriptor.format ?? e.texture.format : e.texture.format;
  }
  /** WebGPU 的 variant `sampleCount`：这个通道所有附件纹理的采样数（WebGPU 要求它们一致）。 */
  webgpuSampleCountFor(e) {
    for (const r of e.colorAttachments)
      if (r) return r.view.texture.sampleCount;
    return e.depthStencilAttachment?.view.texture.sampleCount ?? 1;
  }
  /**
   * WebGL2 的 variant `sampleCount`：只有**画进多重采样渲染目标**时才是目标的采样数，
   * 其余情况（含 canvas 默认帧缓冲）是 1 —— 与 `WebGL2RenderPassEncoder` 的
   * `this.renderTarget?.sampleCount ?? 1` 一致。
   */
  webgl2SampleCountFor(e) {
    return e.target ? e.target.sampleCount : 1;
  }
  /**
   * 把相机矩阵写进 uniform（字段名存在才写，材质可以不用相机）。
   *
   * 这里**不再**调用 `camera.update()`：相机矩阵每帧只需要算一次（见 {@link updateCamera}）。
   * 原先每 draw 都重算 lookAt + 两套 perspective + 一次乘法，40k draw 的场景下光这一步就是
   * 几十毫秒/帧的纯 CPU 开销，而且结果完全一样。
   *
   * **本通道要翻行序时**（{@link Renderer.passFlipsRows}）写入的是
   * {@link Renderer.flippedProjectionMatrix} / {@link Renderer.flippedProjectionViewMatrix}
   * —— 也就是把相机投影在裁剪空间 Y 取反的结果（`camera` 自己的矩阵**不被修改**，
   * 所以同一帧里画进画布的那部分照旧）。`view` 与 `cameraPosition` 与行序无关，原样写。
   * 顶点着色器不使用这两个 uniform 的材质不受影响 —— 这就是那条限制的来源。
   */
  applyCameraUniforms(e, r) {
    const n = this.camera;
    if (!n) return;
    const i = this.passFlipsRows;
    r.uniforms?.has("projectionView") && e.set(
      "projectionView",
      i ? this.flippedProjectionViewMatrix : n.projectionViewMatrix
    ), r.uniforms?.has("projection") && e.set("projection", i ? this.flippedProjectionMatrix : n.projectionMatrix), r.uniforms?.has("view") && e.set("view", n.viewMatrix), r.uniforms?.has("cameraPosition") && e.set("cameraPosition", n.position);
  }
  /** 纹理 bind group 的排序序号（对象身份 → 小整数，只在第一次见到时分配）。 */
  textureGroupId(e) {
    let r = this.textureGroupIds.get(e);
    return r === void 0 && (r = this.nextTextureGroupId++, this.textureGroupIds.set(e, r)), r;
  }
  /**
   * 这次绘制离相机多远（视空间深度，越大越远），供半透明物按「从远到近」排序。
   *
   * 用包围球中心当代表值：单个物体内部的三角形顺序不归排序管（那是深度测试的事）。
   * 没有包围球或没有相机时返回 0 —— 排序仍然稳定，只是这一项不参与区分。
   */
  depthOf(e, r) {
    const n = e.boundingSphere, i = this.camera;
    if (!n || !i) return 0;
    const s = this.sortPointScratch;
    r ? xn(s, r, n.center) : se(s, n.center);
    const a = i.viewMatrix;
    return -(a[2] * s[0] + a[6] * s[1] + a[10] * s[2] + a[14]);
  }
  /**
   * 按当前画布宽高比与后端深度约定刷新相机矩阵。
   *
   * `beginFrame()` 与 `setCamera()` 会自动调用；**在帧中间改了相机参数**（position/target/fov…）
   * 之后想立刻生效，就自己调一次这个方法 —— 否则改动会在下一帧的 `beginFrame()` 才反映出来。
   *
   * 这里同时刷新视锥（剔除要用 P × V）。
   */
  updateCamera() {
    const e = this.camera;
    if (!e) {
      this.culler.ready = !1;
      return;
    }
    e.aspect = this.aspect, e.depthRange = this.backend === "webgpu" ? "zo" : "gl", e.update(), Yr(this.flippedProjectionMatrix, e.projectionMatrix), Yr(this.flippedProjectionViewMatrix, e.projectionViewMatrix), this._culling && this.culler.update(e.projectionViewMatrix, e.depthRange);
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
    mn(this.normalMatrixScratch, n) || Ns(this.normalMatrixScratch), e.set("normalMatrix", this.normalMatrixScratch);
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
    const i = e.textures.map((c) => r[c.name] ?? this.getDefaultTexture()), s = `${e.name}|${i.map((c) => c.id).join(",")}`, a = this.bindGroups.get(s);
    if (a) return a;
    const o = e.textures.flatMap((c, h) => {
      const d = i[h];
      return [
        { binding: c.binding, resource: { view: d.view } },
        { binding: c.samplerBinding, resource: { sampler: d.sampler } }
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
    return this.defaultTexture || (this.defaultTexture = ye.create(this.device, {
      label: "default-white",
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      mipmaps: !1
    })), this.defaultTexture;
  }
}
function Ib(t, e) {
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
const Db = 1e-6, cs = M(), us = M();
function Ke(t, e, r, n, i) {
  if (e === void 0) return he(t, r, n, i);
  if (e.length < 3)
    throw new RangeError("[gpu-device-api] A vector option needs at least 3 components.");
  const s = e[0], a = e[1], o = e[2];
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(o))
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${s}, ${a}, ${o}).`);
  return he(t, s, a, o);
}
function Eo(t) {
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function kb(t, e, r) {
  if (!(t > 0) || t >= 180)
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${t}.`);
  if (!(e > 0))
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${e}.`);
  if (Number.isNaN(r) || r <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${r}.`);
}
function Vb(t, e, r) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${t}.`);
  if (!Number.isFinite(e) || Number.isNaN(r) || r <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${e}, far = ${r}.`);
}
function Ao(t) {
  if (pe(cs, t.position, t.target), Qe(cs) < Db) {
    he(us, t.target[0], t.target[1], t.target[2] + 1), Xr(t.viewMatrix, us, t.target, t.up);
    return;
  }
  Xr(t.viewMatrix, t.position, t.target, t.up);
}
class Cy {
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
  viewMatrix = le();
  /** 唯一的那份投影矩阵缓冲（对外通过 {@link projectionMatrix} 读取）。 */
  projectionBuffer = le();
  /** 唯一的那份投影视图矩阵缓冲（对外通过 {@link projectionViewMatrix} 读取）。 */
  projectionViewBuffer = le();
  /** `depthRange` 的实际存储；见 {@link PerspectiveCamera.depthRange} 的说明。 */
  _depthRange;
  /**
   * 上一次算投影矩阵用的是哪种深度约定；与 `_depthRange` 不一致就说明缓存失效
   * （读取时由 {@link PerspectiveCamera.ensureProjection} 重算，而不是把旧的读出去）。
   */
  projectedDepthRange = null;
  constructor(e = {}) {
    this.position = Ke(M(), e.position, 0, 0, 5), this.target = Ke(M(), e.target, 0, 0, 0), this.up = Ke(M(), e.up, 0, 1, 0), this.fov = e.fov ?? 60, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this._depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 使用哪一套深度范围约定。
   *
   * 换一个取值会让**缓存的那份投影矩阵立即失效**：下一次读取 {@link projectionMatrix} /
   * {@link projectionViewMatrix}（或下一次 `update()`）会按新的约定重算，所以不会出现
   * 「改了 `depthRange` 却还拿着上一种约定的矩阵」这种静默错误。
   */
  get depthRange() {
    return this._depthRange;
  }
  set depthRange(e) {
    e !== this._depthRange && (this._depthRange = e, this.projectedDepthRange = null);
  }
  /**
   * 按当前 `depthRange` 算出来的**那一份**投影矩阵（z ∈ [-1, 1] 或 z ∈ [0, 1]）。
   *
   * 返回的是相机内部那块缓冲**本身**（对象身份稳定，可直接上传 uniform、不需要每帧拷贝）。
   * 读取时如果 `depthRange` 换过而还没重算，会按新约定就地重算，所以它永远与 `depthRange` 一致。
   */
  get projectionMatrix() {
    return this.ensureProjection(), this.projectionBuffer;
  }
  /** `projectionMatrix × viewMatrix`，与 {@link projectionMatrix} 同源（同一份投影、同一个对象）。 */
  get projectionViewMatrix() {
    return this.ensureProjection(), this.projectionViewBuffer;
  }
  /** 重新计算 view / **一份** projection / projectionView 三组矩阵（按当前 `depthRange`）。 */
  update() {
    kb(this.fov, this.near, this.far), Ao(this), this.computeProjection();
  }
  /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
  computeProjection() {
    const e = Aa(this.fov), r = Eo(this.aspect);
    this._depthRange === "zo" ? Ks(this.projectionBuffer, e, r, this.near, this.far) : Zs(this.projectionBuffer, e, r, this.near, this.far), this.projectedDepthRange = this._depthRange, K(this.projectionViewBuffer, this.projectionBuffer, this.viewMatrix);
  }
  /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
  ensureProjection() {
    this.projectedDepthRange !== this._depthRange && this.computeProjection();
  }
}
class My {
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
  viewMatrix = le();
  /** 唯一的那份投影矩阵缓冲（对外通过 {@link projectionMatrix} 读取）。 */
  projectionBuffer = le();
  /** 唯一的那份投影视图矩阵缓冲（对外通过 {@link projectionViewMatrix} 读取）。 */
  projectionViewBuffer = le();
  /** `depthRange` 的实际存储；见 {@link OrthographicCamera.depthRange} 的说明。 */
  _depthRange;
  /** 上一次算投影矩阵用的是哪种深度约定；不一致就说明缓存失效（见 `ensureProjection`）。 */
  projectedDepthRange = null;
  constructor(e = {}) {
    this.position = Ke(M(), e.position, 0, 0, 5), this.target = Ke(M(), e.target, 0, 0, 0), this.up = Ke(M(), e.up, 0, 1, 0), this.size = e.size ?? 2, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this._depthRange = e.depthRange ?? "gl", this.update();
  }
  /**
   * 使用哪一套深度范围约定。
   *
   * 与 {@link PerspectiveCamera.depthRange} 完全同义：换取值会让缓存的那份投影矩阵失效，
   * 下次读取（或下一次 `update()`）按新约定重算。
   */
  get depthRange() {
    return this._depthRange;
  }
  set depthRange(e) {
    e !== this._depthRange && (this._depthRange = e, this.projectedDepthRange = null);
  }
  /**
   * 按当前 `depthRange` 算出来的**那一份**投影矩阵；返回内部缓冲本身（对象身份稳定）。
   * 读取时若 `depthRange` 换过而还没重算，会按新约定就地重算。
   */
  get projectionMatrix() {
    return this.ensureProjection(), this.projectionBuffer;
  }
  /** `projectionMatrix × viewMatrix`，与 {@link projectionMatrix} 同源。 */
  get projectionViewMatrix() {
    return this.ensureProjection(), this.projectionViewBuffer;
  }
  /** 重新计算 view / **一份** projection / projectionView 三组矩阵（按当前 `depthRange`）。 */
  update() {
    Vb(this.size, this.near, this.far), Ao(this), this.computeProjection();
  }
  /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
  computeProjection() {
    const e = this.size / 2, r = e * Eo(this.aspect);
    this._depthRange === "zo" ? ea(this.projectionBuffer, -r, r, -e, e, this.near, this.far) : Js(this.projectionBuffer, -r, r, -e, e, this.near, this.far), this.projectedDepthRange = this._depthRange, K(this.projectionViewBuffer, this.projectionBuffer, this.viewMatrix);
  }
  /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
  ensureProjection() {
    this.projectedDepthRange !== this._depthRange && this.computeProjection();
  }
}
const hs = 1e-4, be = 1e-6, Nb = 0.95, H = M(), ps = M(), ds = M();
function Le(t, e) {
  if (!Number.isFinite(t))
    throw new RangeError(`[gpu-device-api] ${e} must be a finite number, got ${t}.`);
  return t;
}
class Ry {
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
  panOffset = M();
  /** `reset()` 要恢复到的初始状态。 */
  initialPosition = M();
  initialTarget = M();
  previousPosition = M();
  previousTarget = M();
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
    if (this.camera = e, this.element = r, this.enabled = n.enabled ?? !0, this.enableRotate = n.enableRotate ?? !0, this.enableZoom = n.enableZoom ?? !0, this.enablePan = n.enablePan ?? !0, this.enableDamping = n.enableDamping ?? !0, this.dampingFactor = qe(n.dampingFactor ?? 0.08, 0, 1), this.rotateSpeed = Le(n.rotateSpeed ?? 1, "options.rotateSpeed"), this.zoomSpeed = Le(n.zoomSpeed ?? 1, "options.zoomSpeed"), this.panSpeed = Le(n.panSpeed ?? 1, "options.panSpeed"), this.minDistance = Le(n.minDistance ?? 0.1, "options.minDistance"), this.maxDistance = Le(n.maxDistance ?? 1e3, "options.maxDistance"), this.minPolarAngle = Le(n.minPolarAngle ?? 0, "options.minPolarAngle"), this.maxPolarAngle = Le(n.maxPolarAngle ?? Math.PI, "options.maxPolarAngle"), this.minDistance <= 0)
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
    const e = this.camera, r = e.target, n = e.position;
    se(this.previousPosition, n), se(this.previousTarget, r), pe(H, n, r);
    let i = Qe(H);
    i < be ? i = this.minDistance : (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(qe(H[1] / i, -1, 1)));
    const s = Math.abs(this.deltaTheta) > be || Math.abs(this.deltaPhi) > be, a = Math.abs(this.scale - 1) > be, o = Qe(this.panOffset) > be;
    if (!s && !a && !o)
      return !1;
    const l = this.enableDamping ? this.dampingFactor : 1;
    this.theta += this.deltaTheta * l, this.phi += this.deltaPhi * l, this.phi = qe(
      this.phi,
      Math.max(this.minPolarAngle, hs),
      Math.min(this.maxPolarAngle, Math.PI - hs)
    ), i = qe(i * this.scale, this.minDistance, this.maxDistance), qt(r, r, this.panOffset, l);
    const c = Math.sin(this.phi) * i;
    he(
      n,
      r[0] + c * Math.sin(this.theta),
      r[1] + Math.cos(this.phi) * i,
      r[2] + c * Math.cos(this.theta)
    ), this.enableDamping ? (this.deltaTheta *= 1 - this.dampingFactor, this.deltaPhi *= 1 - this.dampingFactor, Ht(this.panOffset, this.panOffset, 1 - this.dampingFactor)) : (this.deltaTheta = 0, this.deltaPhi = 0, jr(this.panOffset)), this.scale = 1, e.update();
    const h = !Qr(n, this.previousPosition, be), d = !Qr(r, this.previousTarget, be);
    return h || d;
  }
  /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
  reset() {
    this.disposed || (se(this.camera.position, this.initialPosition), se(this.camera.target, this.initialTarget), this.deltaTheta = 0, this.deltaPhi = 0, this.scale = 1, jr(this.panOffset), this.mode = "none", this.pinchDistance = 0, this.pointers.clear(), this.readSpherical(), this.camera.update());
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
    pe(H, this.camera.position, this.camera.target);
    const e = Qe(H);
    e < be || (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(qe(H[1] / e, -1, 1)));
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
    pe(H, n.position, n.target);
    const o = 2 * (Qe(H) * Math.tan(Aa(n.fov) / 2)) * this.panSpeed / s;
    he(ps, i[0], i[4], i[8]), he(ds, i[1], i[5], i[9]), qt(this.panOffset, this.panOffset, ps, -e * o), qt(this.panOffset, this.panOffset, ds, r * o);
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
    const r = Math.pow(Nb, this.zoomSpeed);
    e.deltaY < 0 ? this.scale *= r : e.deltaY > 0 && (this.scale /= r);
  };
  onContextMenu = (e) => {
    !this.enabled || !this.enablePan || e.cancelable && e.preventDefault();
  };
}
const We = M();
function nt() {
  return { position: [], normal: [], uv: [], index: [] };
}
function Po() {
  return { position: [], color: [] };
}
function Ee(t, e, r, n, i, s, a, o, l) {
  he(We, i, s, a), dn(We, We), t.position.push(e, r, n), t.normal.push(We[0], We[1], We[2]), t.uv.push(o, l);
}
function I(t, e, r, n, i, s, a, o) {
  t.position.push(e, r, n), t.color.push(i, s, a, o);
}
function it(t) {
  return {
    position: Float32Array.from(t.position),
    normal: Float32Array.from(t.normal),
    uv: Float32Array.from(t.uv),
    indices: Uint32Array.from(t.index)
  };
}
function Lo(t) {
  return {
    position: Float32Array.from(t.position),
    color: Float32Array.from(t.color)
  };
}
function _o(t) {
  return t.position.length / 3;
}
function Q(t, e) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite positive number, got ${t}.`);
  return t;
}
function fs(t, e) {
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite non-negative number, got ${t}.`);
  return t;
}
function Z(t, e, r) {
  if (!Number.isInteger(t) || t < e)
    throw new RangeError(`[gpu-device-api] ${r} must be an integer greater than or equal to ${e}, got ${t}.`);
  return t;
}
const Wb = [0.5, 0.5, 0.5, 1];
function zb(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius"), r = nt();
  for (let n = 0; n < 3; n++) {
    const i = Math.PI / 2 + n * 2 * Math.PI / 3, s = Math.cos(i) * e, a = Math.sin(i) * e;
    Ee(r, s, a, 0, 0, 0, 1, s / (2 * e) + 0.5, a / (2 * e) + 0.5);
  }
  return r.index.push(0, 1, 2), it(r);
}
function qb(t = {}) {
  const e = Q(t.width ?? 1, "options.width"), r = Q(t.height ?? 1, "options.height"), n = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), i = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), s = nt(), a = n + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = -r / 2 + l * r;
    for (let h = 0; h <= n; h++) {
      const d = h / n, p = -e / 2 + d * e;
      Ee(s, p, c, 0, 0, 0, 1, d, l);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < n; l++) {
      const c = o * a + l, h = c + 1, d = c + a + 1, p = c + a;
      s.index.push(c, h, d, c, d, p);
    }
  return it(s);
}
function ze(t, e, r, n, i, s, a) {
  const o = _o(t), l = s + 1;
  for (let c = 0; c <= a; c++) {
    const h = c / a;
    for (let d = 0; d <= s; d++) {
      const p = d / s;
      Ee(
        t,
        e[0] + r[0] * p + n[0] * h,
        e[1] + r[1] * p + n[1] * h,
        e[2] + r[2] * p + n[2] * h,
        i[0],
        i[1],
        i[2],
        p,
        h
      );
    }
  }
  for (let c = 0; c < a; c++)
    for (let h = 0; h < s; h++) {
      const d = o + c * l + h, p = d + 1, f = d + l + 1, m = d + l;
      t.index.push(d, p, f, d, f, m);
    }
}
function jb(t = {}) {
  const e = Q(t.width ?? 1, "options.width"), r = Q(t.height ?? 1, "options.height"), n = Q(t.depth ?? 1, "options.depth"), i = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = Z(t.depthSegments ?? 1, 1, "options.depthSegments"), o = e / 2, l = r / 2, c = n / 2, h = nt();
  return ze(h, [o, -l, -c], [0, r, 0], [0, 0, n], [1, 0, 0], s, a), ze(h, [-o, -l, -c], [0, 0, n], [0, r, 0], [-1, 0, 0], a, s), ze(h, [-o, l, -c], [0, 0, n], [e, 0, 0], [0, 1, 0], a, i), ze(h, [-o, -l, -c], [e, 0, 0], [0, 0, n], [0, -1, 0], i, a), ze(h, [-o, -l, c], [e, 0, 0], [0, r, 0], [0, 0, 1], i, s), ze(h, [-o, -l, -c], [0, r, 0], [e, 0, 0], [0, 0, -1], s, i), it(h);
}
function Qb(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius"), r = Z(t.widthSegments ?? 32, 3, "options.widthSegments"), n = Z(t.heightSegments ?? 16, 2, "options.heightSegments"), i = nt(), s = r + 1;
  for (let a = 0; a <= n; a++) {
    const o = a / n, l = o * Math.PI, c = Math.sin(l), h = Math.cos(l);
    for (let d = 0; d <= r; d++) {
      const p = d / r, f = p * Math.PI * 2, m = c * Math.cos(f), g = h, b = c * Math.sin(f);
      Ee(i, m * e, g * e, b * e, m, g, b, p, 1 - o);
    }
  }
  for (let a = 0; a < n; a++)
    for (let o = 0; o < r; o++) {
      const l = a * s + o, c = l + 1, h = l + s + 1, d = l + s;
      i.index.push(l, c, h, l, h, d);
    }
  return it(i);
}
function Yb(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius"), r = Q(t.tube ?? 0.2, "options.tube"), n = Z(t.radialSegments ?? 16, 3, "options.radialSegments"), i = Z(t.tubularSegments ?? 32, 3, "options.tubularSegments"), s = nt(), a = n + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = l * Math.PI * 2, h = Math.cos(c), d = Math.sin(c);
    for (let p = 0; p <= n; p++) {
      const f = p / n, m = f * Math.PI * 2, g = Math.cos(m), b = Math.sin(m), w = e + r * g, y = g * h, v = b, T = g * d;
      Ee(s, w * h, r * b, w * d, y, v, T, l, f);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < n; l++) {
      const c = o * a + l, h = c + 1, d = c + a + 1, p = c + a;
      s.index.push(c, h, d, c, d, p);
    }
  return it(s);
}
function ms(t, e, r, n, i) {
  const s = _o(t);
  Ee(t, 0, e, 0, 0, n, 0, 0.5, 0.5);
  for (let a = 0; a <= i; a++) {
    const o = a / i * Math.PI * 2, l = Math.sin(o), c = Math.cos(o);
    Ee(t, r * l, e, r * c, 0, n, 0, 0.5 + l * 0.5, 0.5 + c * 0.5);
  }
  for (let a = 0; a < i; a++) {
    const o = s + 1 + a, l = o + 1;
    n > 0 ? t.index.push(s, o, l) : t.index.push(s, l, o);
  }
}
function Co(t = {}) {
  const e = fs(t.radiusTop ?? 0.5, "options.radiusTop"), r = fs(t.radiusBottom ?? 0.5, "options.radiusBottom"), n = Q(t.height ?? 1, "options.height"), i = Z(t.radialSegments ?? 24, 3, "options.radialSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = t.caps ?? !0;
  if (e === 0 && r === 0)
    throw new RangeError("[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.");
  const o = nt(), l = i + 1, c = Math.hypot(n, r - e), h = n / c, d = (r - e) / c;
  for (let p = 0; p <= s; p++) {
    const f = p / s, m = n / 2 - f * n, g = e + (r - e) * f;
    for (let b = 0; b <= i; b++) {
      const w = b / i, y = w * Math.PI * 2, v = Math.sin(y), T = Math.cos(y);
      Ee(o, g * v, m, g * T, h * v, d, h * T, w, 1 - f);
    }
  }
  for (let p = 0; p < s; p++)
    for (let f = 0; f < i; f++) {
      const m = p * l + f, g = m + 1, b = m + l + 1, w = m + l;
      o.index.push(m, w, b, m, b, g);
    }
  return a && (e > 0 && ms(o, n / 2, e, 1, i), r > 0 && ms(o, -n / 2, r, -1, i)), it(o);
}
function Xb(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius");
  return Co({
    radiusTop: 0,
    radiusBottom: e,
    height: t.height ?? 1,
    radialSegments: t.radialSegments ?? 24,
    heightSegments: 1,
    caps: t.caps ?? !0
  });
}
function Hb(t = {}) {
  const e = Q(t.size ?? 10, "options.size"), r = Z(t.divisions ?? 10, 1, "options.divisions"), n = t.plane ?? "xz", i = t.color ?? Wb, [s, a, o, l] = i, c = Po(), h = e / 2, d = e / r;
  for (let p = 0; p <= r; p++) {
    const f = -h + p * d;
    n === "xz" ? (I(c, -h, 0, f, s, a, o, l), I(c, h, 0, f, s, a, o, l), I(c, f, 0, -h, s, a, o, l), I(c, f, 0, h, s, a, o, l)) : n === "xy" ? (I(c, -h, f, 0, s, a, o, l), I(c, h, f, 0, s, a, o, l), I(c, f, -h, 0, s, a, o, l), I(c, f, h, 0, s, a, o, l)) : (I(c, 0, -h, f, s, a, o, l), I(c, 0, h, f, s, a, o, l), I(c, 0, f, -h, s, a, o, l), I(c, 0, f, h, s, a, o, l));
  }
  return Lo(c);
}
function Zb(t = {}) {
  const e = Q(t.size ?? 1, "options.size"), r = Po();
  return I(r, 0, 0, 0, 1, 0, 0, 1), I(r, e, 0, 0, 1, 0, 0, 1), I(r, 0, 0, 0, 0, 1, 0, 1), I(r, 0, e, 0, 0, 1, 0, 1), I(r, 0, 0, 0, 0, 0, 1, 1), I(r, 0, 0, e, 0, 0, 1, 1), Lo(r);
}
const Fy = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createAxes: Zb,
  createBox: jb,
  createCone: Xb,
  createCylinder: Co,
  createGrid: Hb,
  createPlane: qb,
  createSphere: Qb,
  createTorus: Yb,
  createTriangle: zb
}, Symbol.toStringTag, { value: "Module" }));
function vt(t, e) {
  return t ? [t[0], t[1], t[2], t[3] ?? 1] : [...e];
}
const Oe = {
  projectionView: "mat4x4f",
  model: "mat4x4f",
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它。 */
  normalMatrix: "mat3x3f"
};
function Mo(t = {}) {
  const e = vt(t.color, [1, 1, 1, 1]);
  return {
    name: "unlit",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Oe, baseColor: "vec4f" },
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
function Ro(t = {}) {
  const e = Uo(t.direction ?? [0.5, 1, 0.6]), r = vt(t.color, [1, 1, 1, 1]);
  return {
    name: "lambert",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Oe,
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
function Fo(t = {}) {
  const e = Uo(t.direction ?? [0.5, 1, 0.6]), r = vt(t.color, [0.9, 0.9, 0.95, 1]), n = vt(t.specular, [1, 1, 1, 1]);
  return {
    name: "phong",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Oe,
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
function Bo() {
  return {
    name: "normalDebug",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Oe },
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
function Go(t = {}) {
  const e = vt(t.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: "flatLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3" },
    uniforms: { ...Oe, baseColor: "vec4f" },
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
function Oo() {
  return {
    name: "vertexColorLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3", color: "float32x4" },
    uniforms: { ...Oe },
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
const Kb = {
  unlit: Mo,
  lambert: Ro,
  phong: Fo,
  normalDebug: Bo,
  flatLine: Go,
  vertexColorLine: Oo
};
function Jb(t) {
  return t.defaults ? { ...t.defaults } : {};
}
function Uo(t) {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}
const By = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SCENE_UNIFORM_FIELDS: Oe,
  defaultUniformsOf: Jb,
  flatLine: Go,
  lambert: Ro,
  materials: Kb,
  normalDebug: Bo,
  phong: Fo,
  unlit: Mo,
  vertexColorLine: Oo
}, Symbol.toStringTag, { value: "Module" }));
export {
  Zi as ATTRIBUTE_PLACEHOLDER,
  fw as AddressMode,
  Ho as BLEND_PRESETS,
  Rp as BackendRegistry,
  k as BindingType,
  cw as BlendFactor,
  uw as BlendOperation,
  O as BufferUsage,
  Rs as CANVAS_DEPTH_FORMAT,
  ue as ColorWriteMask,
  lw as CompareFunction,
  pw as CullMode,
  Zg as DEFAULT_BACKEND_ORDER,
  Xo as DEFAULT_BLEND_COMPONENT,
  Wn as DEFAULT_DEPTH_STATE,
  os as DEFAULT_GPU_TIMING_DELAY,
  as as DEFAULT_GPU_TIMING_FRAMES,
  un as DEFAULT_PREWARM_TIMEOUT_MS,
  vr as DEFAULT_PRIMITIVE_STATE,
  mt as DEFAULT_TEXTURE_SWIZZLE,
  op as DEG2RAD,
  gs as DEPTH_STENCIL_FORMATS,
  Ye as DeviceLostError,
  Yw as DisposalScope,
  ly as EPSILON,
  ww as ERROR_SCOPE_FILTERS,
  mw as FilterMode,
  dw as FrontFace,
  vb as FrustumCuller,
  $b as GFX_UPLOAD_FORMATS,
  dy as GLSL_PREAMBLE,
  Ca as GLSL_PRECISION_PREAMBLE,
  _p as GLSL_SAMPLER_TYPES,
  Pp as GLSL_TYPE_NAMES,
  _a as GLSL_VERSION_DIRECTIVE,
  ft as GPUInternalError,
  Fb as GPU_TIMING_FEATURE,
  yr as Geometry,
  ye as GfxTexture,
  te as GpuError,
  dt as GpuTiming,
  sw as IndexFormat,
  zw as LOG_LEVEL_NAMES,
  ml as LOG_LEVEL_VALUES,
  aw as LoadOp,
  j as LogLevel,
  Zi as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  Wr as MATERIAL_TEXTURE_PLACEHOLDER,
  Nr as MATERIAL_UNIFORM_PLACEHOLDER,
  wr as Material,
  Ry as OrbitControls,
  My as OrthographicCamera,
  ar as OutOfMemoryError,
  Cy as PerspectiveCamera,
  rw as PrimitiveTopology,
  Je as QueryType,
  lp as RAD2DEG,
  ew as RENDERABLE_FORMATS,
  $o as Renderer,
  Cs as RowOrder,
  Oe as SCENE_UNIFORM_FIELDS,
  Do as SHADER_STAGE_NAMES,
  gb as STANDARD_ATTRIBUTE_FORMATS,
  ve as STENCIL_FACE_DEFAULT,
  C as ShaderStage,
  hw as StencilOperation,
  ow as StoreOp,
  Wr as TEXTURE_PLACEHOLDER,
  zt as TextureDimension,
  x as TextureUsage,
  ji as UNIFORM_FIELD_TYPES,
  Nr as UNIFORM_PLACEHOLDER,
  pb as UniformArena,
  db as UniformArenaPool,
  br as UniformLayout,
  Xi as UniformValues,
  No as VERTEX_FORMAT_INFO,
  u as ValidationError,
  gw as VertexStepMode,
  pl as alignTo,
  Gw as alignTo4,
  yw as asByteView,
  hn as assert,
  Cw as assertDefined,
  ys as assertErrorScopeFilter,
  R as assertNever,
  Te as assertNonNegativeInteger,
  Ts as assertPassTimestampWrites,
  et as assertPositiveInteger,
  Mw as assertPowerOfTwo,
  Yo as assertTextureSwizzle,
  ny as box3,
  _y as buildMipChain,
  Bw as byteLengthOf,
  Ps as cacheKey,
  qe as clamp,
  Sy as clearShaders,
  ay as color,
  kw as combineFlags,
  ts as compareOpaque,
  xb as compareTransparent,
  Jo as compilationStageName,
  bt as compileShaderStage,
  Ow as concatTypedArrays,
  Zb as createAxes,
  jb as createBox,
  xe as createCompilationInfo,
  Se as createCompilationMessage,
  Xb as createCone,
  Co as createCylinder,
  Vn as createDefaultBackendRegistry,
  Py as createDevice,
  yo as createDeviceWithAdapter,
  Ly as createGeometry,
  Hb as createGrid,
  rt as createLogger,
  ln as createPipelineCache,
  qb as createPlane,
  Qb as createSphere,
  Yb as createTorus,
  zb as createTriangle,
  ab as createUniforms,
  Nw as currentId,
  Fs as defaultPixelRatio,
  Qo as defaultTextureUsage,
  Jb as defaultUniformsOf,
  ub as defineMaterial,
  vo as defineUniforms,
  Aa as degToRad,
  _w as describeAdapter,
  cn as describeCompilationInfo,
  Wt as describeGpuTimingFailure,
  Gb as describeGpuTimingUnavailable,
  hp as describeShaderSource,
  Kg as detectBackend,
  Bs as disposeAll,
  Ko as emptyCompilationInfo,
  ty as euler,
  $y as findWgslEntryPoint,
  Go as flatLine,
  el as formatCompilationMessage,
  Vw as formatFlags,
  fy as formatShaderErrorLog,
  sy as frustum,
  vs as fullMipLevelCount,
  jw as getGlobalLogLevel,
  yy as getShader,
  mp as glslDefines,
  La as glslFieldForStage,
  Lp as glslTypeName,
  ss as gpuTimingPath,
  Dw as hasAllFlags,
  Iw as hasAnyFlag,
  Uw as hasFlag,
  wy as hasShader,
  ko as indexFormatByteSize,
  Mp as inferBindGroupLayoutEntries,
  cp as inverseLerp,
  Fw as isArrayBufferView,
  Ay as isBackendAvailable,
  bs as isBufferBinding,
  Sw as isBufferBindingResource,
  Pw as isCompilationInfo,
  Io as isDepthStencilFormat,
  gl as isDisposable,
  jo as isErrorScopeFilter,
  qo as isGpuError,
  To as isImageSource,
  ws as isSamplerBinding,
  Tw as isSamplerBindingResource,
  Fa as isSamplerType,
  tw as isSrgbFormat,
  bw as isTextureBinding,
  $w as isTextureBindingResource,
  nw as isTriangleTopology,
  Rw as isTypedArray,
  Ro as lambert,
  Pa as languageForBackend,
  uy as lerp,
  vp as listShaderKeys,
  Kw as mat3,
  Jw as mat4,
  By as materials,
  ut as measureCanvas,
  Zo as mergeCompilationInfo,
  vw as mipLevelExtent,
  pp as missingSourceMessage,
  py as nextAfter,
  U as nextId,
  Bo as normalDebug,
  $s as normalizeBindGroupLayoutEntries,
  N as nowMs,
  Qw as nullLogger,
  my as numberLines,
  dl as paddedCopy,
  il as parseGlCompilationLog,
  Fo as phong,
  ry as plane,
  iw as primitiveCount,
  ey as quat,
  cy as radToDeg,
  iy as ray,
  oy as raycaster,
  Zn as reflectGlslProgram,
  Cp as reflectSamplerUniforms,
  Ty as reflectWgslBindings,
  Ap as reflectWgslEntryPoints,
  yp as registerShader,
  gy as registerShaders,
  by as replaceShader,
  vy as requireShader,
  Ww as resetIdCounter,
  Ew as resolveBindingLayoutEntry,
  Aw as resolveBlendState,
  Ma as resolveGlslWrapOptions,
  Ms as resolveLimits,
  _s as resolvePipelineLayoutLike,
  xs as resolveSamplerDescriptor,
  Ss as resolveShaderSource,
  or as resolveTextureSize,
  Yt as resolveTextureViewDescriptor,
  xw as samplerKey,
  qw as setGlobalLogLevel,
  Fy as shapes,
  Vo as smallestIndexFormat,
  hy as smoothstep,
  Sb as sortDraws,
  up as stageSource,
  Ra as stripWgslComments,
  cl as timestampDeltaToMilliseconds,
  ol as toNativeScissorRect,
  Lw as toNativeViewportRect,
  hl as toUint8View,
  fl as typedArrayElementSize,
  Mo as unlit,
  xy as unregisterShader,
  Es as validateVertexBufferLayout,
  Xw as vec2,
  Hw as vec3,
  Zw as vec4,
  As as vertexBufferLayoutsKey,
  Oo as vertexColorLine,
  Wo as vertexFormatGlslType,
  Re as vertexFormatInfo,
  zo as vertexFormatWgslType,
  Ey as wgslBindingKeys,
  gp as wgslDefines,
  Ls as withTimeout,
  bp as wrapGlslSource,
  wp as wrapWgslSource,
  sl as yieldToEventLoop
};
//# sourceMappingURL=gpu-device-api.js.map
