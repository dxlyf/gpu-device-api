const F = {
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
}, ki = [
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "stencil8"
], Gg = [
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
  ...ki
];
function no(t) {
  return ki.includes(t);
}
function Og(t) {
  return t === "rgba8unorm-srgb" || t === "bgra8unorm-srgb";
}
const L = {
  None: 0,
  Vertex: 1,
  Fragment: 2,
  Compute: 4
}, ro = {
  [L.Vertex]: "vertex",
  [L.Fragment]: "fragment",
  [L.Compute]: "compute"
}, Ig = {
  PointList: "point-list",
  LineList: "line-list",
  LineStrip: "line-strip",
  TriangleList: "triangle-list",
  TriangleStrip: "triangle-strip"
};
function Ug(t) {
  return t === "triangle-list" || t === "triangle-strip";
}
function Dg(t, e) {
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
const Vg = {
  Uint16: "uint16",
  Uint32: "uint32"
};
function io(t) {
  return t === "uint16" ? 2 : 4;
}
function so(t) {
  return t > 65535 ? "uint32" : "uint16";
}
const kg = {
  Load: "load",
  Clear: "clear"
}, Ng = {
  Store: "store",
  Discard: "discard"
}, Wg = {
  Never: "never",
  Less: "less",
  Equal: "equal",
  LessEqual: "less-equal",
  Greater: "greater",
  NotEqual: "not-equal",
  GreaterEqual: "greater-equal",
  Always: "always"
}, zg = {
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
}, qg = {
  Add: "add",
  Subtract: "subtract",
  ReverseSubtract: "reverse-subtract",
  Min: "min",
  Max: "max"
}, jg = {
  Keep: "keep",
  Zero: "zero",
  Replace: "replace",
  Invert: "invert",
  IncrementClamp: "increment-clamp",
  DecrementClamp: "decrement-clamp",
  IncrementWrap: "increment-wrap",
  DecrementWrap: "decrement-wrap"
}, Qg = {
  None: "none",
  Front: "front",
  Back: "back"
}, Xg = {
  Ccw: "ccw",
  Cw: "cw"
}, Yg = {
  ClampToEdge: "clamp-to-edge",
  Repeat: "repeat",
  MirrorRepeat: "mirror-repeat"
}, Hg = {
  Nearest: "nearest",
  Linear: "linear"
};
function A(t, e, n, r = !1) {
  return { components: t, byteSize: e, kind: n, normalized: r };
}
const ao = Object.freeze({
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
function Ce(t) {
  const e = ao[t];
  if (!e) throw new Error(`[gpu-device-api] Unknown vertex format "${t}".`);
  return e;
}
function oo(t) {
  const e = Ce(t);
  return (e.kind === "float" ? ["float", "vec2", "vec3", "vec4"] : e.kind === "uint" ? ["uint", "uvec2", "uvec3", "uvec4"] : ["int", "ivec2", "ivec3", "ivec4"])[e.components - 1];
}
function lo(t) {
  const e = Ce(t);
  return (e.kind === "float" ? ["f32", "vec2f", "vec3f", "vec4f"] : e.kind === "uint" ? ["u32", "vec2u", "vec3u", "vec4u"] : ["i32", "vec2i", "vec3i", "vec4i"])[e.components - 1];
}
const Zg = {
  Vertex: "vertex",
  Instance: "instance"
}, D = {
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
function Ni(t) {
  return t === "uniform" || t === "storage" || t === "read-only-storage";
}
function Kg(t) {
  return t === "texture" || t === "storage-texture";
}
function Wi(t) {
  return t === "sampler" || t === "comparison-sampler";
}
class ee extends Error {
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
function co(t) {
  return t instanceof ee;
}
class u extends ee {
  constructor(e, n = {}) {
    super(e, { ...n, code: "VALIDATION_ERROR" }), this.name = "ValidationError";
  }
}
class uo extends ee {
  constructor(e, n = {}) {
    super(e, { ...n, code: "OUT_OF_MEMORY" }), this.name = "OutOfMemoryError";
  }
}
class nt extends ee {
  reason;
  constructor(e, n = {}) {
    super(e, { ...n, code: "DEVICE_LOST" }), this.name = "DeviceLostError", this.reason = n.reason ?? "unknown";
  }
  /** device 被主动销毁属于预期情况；`unknown` 的丢失通常意味着驱动重置。 */
  get isExpected() {
    return this.reason === "destroyed";
  }
}
const Ot = {
  D1: "1d",
  D2: "2d",
  D3: "3d"
};
function Zt(t) {
  return typeof t == "number" ? { width: t, height: t, depthOrArrayLayers: 1 } : {
    width: t.width,
    height: t.height ?? 1,
    depthOrArrayLayers: t.depthOrArrayLayers ?? 1
  };
}
function zi(t) {
  const e = Zt(t);
  return Math.floor(Math.log2(Math.max(e.width, e.height, e.depthOrArrayLayers))) + 1;
}
function Jg(t, e) {
  if (!Number.isInteger(e) || e < 0)
    throw new u(
      `[gpu-device-api] mipLevelExtent: level must be a non-negative integer, got ${String(e)}.`
    );
  const n = Zt(t), r = (i) => Math.max(1, Math.trunc(i / 2 ** e));
  return {
    width: r(n.width),
    height: r(n.height),
    depthOrArrayLayers: n.depthOrArrayLayers
  };
}
function ho(t = 0) {
  return v.CopyDst | v.TextureBinding | t;
}
function Vt(t, e = {}) {
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
function qi(t = {}) {
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
function eb(t) {
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
function ji(t) {
  return typeof t == "string" ? { wgsl: t } : { ...t };
}
const Xe = {
  Occlusion: "occlusion",
  Timestamp: "timestamp"
};
function Qi(t, e) {
  if (t.querySet.type !== Xe.Timestamp)
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
function tb(t) {
  return t.buffer !== void 0;
}
function nb(t) {
  return t.sampler !== void 0;
}
function rb(t) {
  return t.view !== void 0;
}
function ib(t) {
  return {
    ...t,
    binding: t.binding,
    visibility: t.visibility,
    type: t.type
  };
}
function Xi(t) {
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
function Yi(t, e) {
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
    const r = Ce(n.format);
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
const Ar = /* @__PURE__ */ new WeakMap();
function Hi(t) {
  const e = Ar.get(t);
  if (e !== void 0) return e;
  const n = t.map((r) => {
    const i = r.attributes.map((s) => `${s.shaderLocation}@${s.offset}:${s.format}`).join(",");
    return `${r.arrayStride}/${r.stepMode ?? "vertex"}[${i}]`;
  }).join(";");
  return Ar.set(t, n), n;
}
const ue = {
  None: 0,
  Red: 1,
  Green: 2,
  Blue: 4,
  Alpha: 8,
  All: 15
}, hn = {
  topology: "triangle-list",
  frontFace: "ccw",
  cullMode: "none"
}, _r = {
  depthWriteEnabled: !0,
  depthCompare: "less"
}, po = {
  srcFactor: "one",
  dstFactor: "zero",
  operation: "add"
}, vt = {
  compare: "always",
  failOp: "keep",
  depthFailOp: "keep",
  passOp: "keep"
}, fo = Object.freeze({
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
function sb(t) {
  if (t === !1 || t === void 0) return null;
  if (typeof t == "string") {
    const e = fo[t];
    if (!e) throw new Error(`[gpu-device-api] Unknown blend preset "${t}".`);
    return e;
  }
  return t;
}
function mo(t = 128, e) {
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
function Zi(...t) {
  let e = "";
  for (let n = 0; n < t.length; n += 1) {
    const r = t[n];
    r == null || r === "" || (e = e === "" ? `${r}` : `${e}|${r}`);
  }
  return e;
}
function ye(t) {
  const e = t.messages ?? [];
  return {
    label: t.label,
    backend: t.backend,
    messages: e,
    rawLogs: t.rawLogs ?? [],
    hasErrors: e.some((n) => n.type === "error")
  };
}
function go(t, e, n) {
  const r = [], i = [];
  for (const s of n)
    r.push(...s.messages), i.push(...s.rawLogs);
  return ye({ label: t, backend: e, messages: r, rawLogs: i });
}
function bo(t, e) {
  return ye({ label: t, backend: e });
}
function ve(t) {
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
function wo(t) {
  return t === null ? "program" : ro[t] ?? `stage${t}`;
}
function yo(t) {
  const e = `"${t.label}" (${t.backend}, ${wo(t.stage)})`;
  let n = "";
  return t.lineNum !== null && (n = ` ${t.lineNum}`, t.linePos !== null && (n += `:${t.linePos}`), n += ":"), `[gpu-device-api] shader ${e}${n} ${t.type}: ${t.message}`;
}
function Xn(t) {
  const e = t.messages.filter((r) => r.type === "error").length, n = `[gpu-device-api] compilation info for "${t.label}" (${t.backend}): ${t.messages.length} message(s), ${e} error(s)`;
  return t.messages.length === 0 ? n : [n, ...t.messages.map((r) => `  ${yo(r)}`)].join(`
`);
}
function ab(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return Array.isArray(e.messages) && typeof e.hasErrors == "boolean";
}
const vo = /^\s*(ERROR|WARNING|INFO)\s*:\s*\d+\s*:\s*(\d+)\s*:\s*(.*)$/, xo = /^\s*\d+\s*\(\s*(\d+)\s*\)\s*:\s*(error|warning|info)\b\s*:?\s*(.*)$/i, So = /:\s*(\d+)\s*:/;
function Er(t) {
  const e = t.toLowerCase();
  return e === "error" ? "error" : e === "warning" ? "warning" : "info";
}
function To(t, e, n, r) {
  const i = [];
  for (const s of t.split(`
`)) {
    const a = s.trim();
    if (a === "") continue;
    const o = vo.exec(a);
    if (o) {
      i.push(
        ve({
          type: Er(o[1]),
          message: o[3].trim(),
          lineNum: Number(o[2]),
          linePos: null,
          label: e,
          backend: n,
          stage: r
        })
      );
      continue;
    }
    const l = xo.exec(a);
    if (l) {
      i.push(
        ve({
          type: Er(l[2]),
          message: l[3].trim(),
          lineNum: Number(l[1]),
          linePos: null,
          label: e,
          backend: n,
          stage: r
        })
      );
      continue;
    }
    const c = So.exec(a);
    i.push(
      ve({
        // 没有前缀时按 error 处理：GL 的信息日志里真正值得注意的就是错误，
        // 而这条路径本来就是「编译/链接失败」才会走到。
        type: "error",
        message: a,
        lineNum: c ? Number(c[1]) : null,
        linePos: null,
        label: e,
        backend: n,
        stage: r
      })
    );
  }
  return i;
}
const Yn = 3e4;
function k() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
async function Ki(t, e, n) {
  if (!Number.isFinite(e) || e <= 0) return t;
  let r;
  try {
    return await Promise.race([
      t,
      new Promise((i, s) => {
        r = setTimeout(() => {
          s(new Error(`[gpu-device-api] ${n} did not finish within ${e}ms.`));
        }, e);
      })
    ]);
  } finally {
    r !== void 0 && clearTimeout(r);
  }
}
function $o() {
  return new Promise((t) => {
    setTimeout(t, 0);
  });
}
const Ji = {
  TopLeft: "topLeft",
  BottomUp: "bottomUp"
};
function Po(t, e, n = 1) {
  const r = e - t;
  return r <= 0n ? 0 : Number(r) * n / 1e6;
}
function ob(t) {
  const e = t.isFallbackAdapter ? " (fallback)" : "";
  return `${t.backend}: ${t.device || t.vendor || "unknown"}${e}`;
}
function es(t, e, n) {
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
const ts = "depth24plus";
function rt(t) {
  const e = t;
  return typeof e.clientWidth == "number" && typeof e.clientHeight == "number" ? { width: e.clientWidth || e.width || 1, height: e.clientHeight || e.height || 1 } : { width: t.width || 1, height: t.height || 1 };
}
function ns() {
  const t = typeof globalThis < "u" ? globalThis.devicePixelRatio : 1;
  return t && t > 0 ? Math.min(t, 4) : 1;
}
function Hn(t, e, n) {
  if (!t) throw new u(e, n ? { details: n } : {});
}
function lb(t, e, n) {
  if (t == null)
    throw new u(e, n ? { details: n } : {});
  return t;
}
function R(t, e) {
  throw new u(e ?? `[gpu-device-api] Unexpected value: ${String(t)}`);
}
function Ye(t, e) {
  Hn(
    Number.isSafeInteger(t) && t > 0,
    `[gpu-device-api] ${e} must be a positive integer, got ${String(t)}.`
  );
}
function Ee(t, e) {
  Hn(
    Number.isSafeInteger(t) && t >= 0,
    `[gpu-device-api] ${e} must be a non-negative integer, got ${String(t)}.`
  );
}
function cb(t, e) {
  Hn(
    Number.isSafeInteger(t) && t > 0 && (t & t - 1) === 0,
    `[gpu-device-api] ${e} must be a power of two, got ${String(t)}.`
  );
}
const Ao = [
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
function ub(t) {
  return Ao.some((e) => t instanceof e);
}
function hb(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function db(t) {
  return typeof t == "number" ? t : (t instanceof ArrayBuffer, t.byteLength);
}
function _o(t) {
  return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
function Eo(t, e) {
  return e <= 1 ? t : Math.ceil(t / e) * e;
}
function pb(t) {
  return t + 3 & -4;
}
function Co(t, e = 4) {
  const n = _o(t), r = Eo(n.byteLength, e);
  if (r === n.byteLength) return n;
  const i = new Uint8Array(r);
  return i.set(n), i;
}
function fb(t) {
  return t.BYTES_PER_ELEMENT ?? 1;
}
function mb(t) {
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
function gb(t, e) {
  return (t & e) === e;
}
function bb(t, e) {
  return (t & e) !== 0;
}
function wb(t, e) {
  return (t & e) === e;
}
function yb(...t) {
  let e = 0;
  for (const n of t) e |= n;
  return e;
}
function vb(t, e) {
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
let kt = 0;
function O(t) {
  return kt += 1, `${t}#${kt}`;
}
function xb() {
  return kt;
}
function Sb() {
  kt = 0;
}
const j = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5
}, Tb = {
  0: "silent",
  1: "error",
  2: "warn",
  3: "info",
  4: "debug",
  5: "trace"
}, Lo = {
  silent: j.Silent,
  error: j.Error,
  warn: j.Warn,
  info: j.Info,
  debug: j.Debug,
  trace: j.Trace
};
let Zn = j.Warn;
function $b(t) {
  Zn = typeof t == "string" ? Lo[t] : t;
}
function Pb() {
  return Zn;
}
function pt(t = "gpu-device-api", e) {
  const n = () => e ?? Zn, r = (i, s, a, o) => {
    n() < i || s(`[${t}] ${a}`, ...o);
  };
  return {
    get level() {
      return n();
    },
    error: (i, ...s) => r(j.Error, console.error, i, s),
    warn: (i, ...s) => r(j.Warn, console.warn, i, s),
    info: (i, ...s) => r(j.Info, console.info, i, s),
    debug: (i, ...s) => r(j.Debug, console.debug, i, s),
    trace: (i, ...s) => r(j.Trace, console.debug, i, s)
  };
}
const Ab = {
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
function Mo(t) {
  return !!t && typeof t == "object" && typeof t.dispose == "function";
}
function rs(t) {
  let e;
  for (const n of t)
    if (Mo(n))
      try {
        n.dispose();
      } catch (r) {
        e ??= r;
      }
  if (e !== void 0) throw e;
}
class _b {
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
    this.resources.clear(), rs(e);
  }
}
function Ro() {
  return new Float32Array(2);
}
function Fo(t) {
  const e = new Float32Array(2);
  return e[0] = t[0], e[1] = t[1], e;
}
function Bo(t, e) {
  const n = new Float32Array(2);
  return n[0] = t, n[1] = e, n;
}
function Go(t, e) {
  return t[0] = e[0], t[1] = e[1], t;
}
function Oo(t, e, n) {
  return t[0] = e, t[1] = n, t;
}
function Io(t) {
  return t[0] = 0, t[1] = 0, t;
}
function Uo(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t;
}
function Do(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t;
}
function Vo(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t;
}
function ko(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t;
}
function No(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t;
}
function Wo(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t;
}
function zo(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t;
}
function qo(t, e) {
  const n = e[0], r = e[1];
  let i = Math.hypot(n, r);
  return i > 0 && (i = 1 / i), t[0] = n * i, t[1] = r * i, t;
}
function jo(t) {
  return Math.hypot(t[0], t[1]);
}
function Qo(t) {
  return t[0] * t[0] + t[1] * t[1];
}
function Xo(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function Yo(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1];
  return n * n + r * r;
}
function Ho(t, e) {
  return t[0] * e[0] + t[1] * e[1];
}
function Zo(t, e) {
  return t[0] * e[1] - t[1] * e[0];
}
function Ko(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t;
}
function Jo(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t;
}
function el(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t;
}
function tl(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n;
}
function nl(t, e, n) {
  const r = e[0], i = e[1];
  return t[0] = n[0] * r + n[3] * i + n[6], t[1] = n[1] * r + n[4] * i + n[7], t;
}
function rl(t) {
  return [t[0], t[1]];
}
function il(t) {
  return `vec2(${t[0]}, ${t[1]})`;
}
const Eb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Uo,
  clone: Fo,
  copy: Go,
  create: Ro,
  cross: Zo,
  distance: Xo,
  div: ko,
  dot: Ho,
  equals: tl,
  fromValues: Bo,
  length: jo,
  lerp: Ko,
  max: el,
  min: Jo,
  mul: Vo,
  negate: zo,
  normalize: qo,
  scale: No,
  scaleAndAdd: Wo,
  set: Oo,
  squaredDistance: Yo,
  squaredLength: Qo,
  sub: Do,
  toArray: rl,
  toString: il,
  transformMat3: nl,
  zero: Io
}, Symbol.toStringTag, { value: "Module" }));
function M() {
  return new Float32Array(3);
}
function sl(t) {
  const e = new Float32Array(3);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e;
}
function is(t, e, n) {
  const r = new Float32Array(3);
  return r[0] = t, r[1] = e, r[2] = n, r;
}
function ie(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function he(t, e, n, r) {
  return t[0] = e, t[1] = n, t[2] = r, t;
}
function On(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t;
}
function lt(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t;
}
function de(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t;
}
function al(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t;
}
function ol(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t;
}
function Nt(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t;
}
function It(t, e, n, r) {
  return t[0] = e[0] + n[0] * r, t[1] = e[1] + n[1] * r, t[2] = e[2] + n[2] * r, t;
}
function ll(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function Kn(t, e) {
  const n = e[0], r = e[1], i = e[2];
  let s = Math.hypot(n, r, i);
  return s > 0 && (s = 1 / s), t[0] = n * s, t[1] = r * s, t[2] = i * s, t;
}
function We(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function ss(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
}
function as(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]);
}
function Kt(t, e) {
  const n = t[0] - e[0], r = t[1] - e[1], i = t[2] - e[2];
  return n * n + r * r + i * i;
}
function me(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function os(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], l = n[2];
  return t[0] = i * l - s * o, t[1] = s * a - r * l, t[2] = r * o - i * a, t;
}
function cl(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t;
}
function Jt(t, e, n) {
  return t[0] = Math.min(e[0], n[0]), t[1] = Math.min(e[1], n[1]), t[2] = Math.min(e[2], n[2]), t;
}
function en(t, e, n) {
  return t[0] = Math.max(e[0], n[0]), t[1] = Math.max(e[1], n[1]), t[2] = Math.max(e[2], n[2]), t;
}
function In(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n;
}
function ul(t, e, n) {
  const r = me(n, e) * 2;
  return t[0] = e[0] - n[0] * r, t[1] = e[1] - n[1] * r, t[2] = e[2] - n[2] * r, t;
}
function ls(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[3] * i + n[6] * s, t[1] = n[1] * r + n[4] * i + n[7] * s, t[2] = n[2] * r + n[5] * i + n[8] * s, t;
}
function Jn(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  let a = n[3] * r + n[7] * i + n[11] * s + n[15];
  return a = a || 1, t[0] = (n[0] * r + n[4] * i + n[8] * s + n[12]) / a, t[1] = (n[1] * r + n[5] * i + n[9] * s + n[13]) / a, t[2] = (n[2] * r + n[6] * i + n[10] * s + n[14]) / a, t;
}
function cs(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, t;
}
function hl(t) {
  return [t[0], t[1], t[2]];
}
function dl(t) {
  return `vec3(${t[0]}, ${t[1]}, ${t[2]})`;
}
const Cb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: lt,
  clone: sl,
  copy: ie,
  create: M,
  cross: os,
  distance: as,
  div: ol,
  dot: me,
  equals: In,
  fromValues: is,
  length: We,
  lerp: cl,
  max: en,
  min: Jt,
  mul: al,
  negate: ll,
  normalize: Kn,
  reflect: ul,
  scale: Nt,
  scaleAndAdd: It,
  set: he,
  squaredDistance: Kt,
  squaredLength: ss,
  sub: de,
  toArray: hl,
  toString: dl,
  transformDirection: cs,
  transformMat3: ls,
  transformMat4: Jn,
  zero: On
}, Symbol.toStringTag, { value: "Module" }));
function pl() {
  return new Float32Array(4);
}
function fl(t) {
  const e = new Float32Array(4);
  return e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], e;
}
function ml(t, e, n, r) {
  const i = new Float32Array(4);
  return i[0] = t, i[1] = e, i[2] = n, i[3] = r, i;
}
function gl(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function bl(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function wl(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 0, t;
}
function yl(t, e, n) {
  return t[0] = e[0] + n[0], t[1] = e[1] + n[1], t[2] = e[2] + n[2], t[3] = e[3] + n[3], t;
}
function vl(t, e, n) {
  return t[0] = e[0] - n[0], t[1] = e[1] - n[1], t[2] = e[2] - n[2], t[3] = e[3] - n[3], t;
}
function xl(t, e, n) {
  return t[0] = e[0] * n[0], t[1] = e[1] * n[1], t[2] = e[2] * n[2], t[3] = e[3] * n[3], t;
}
function Sl(t, e, n) {
  return t[0] = e[0] / n[0], t[1] = e[1] / n[1], t[2] = e[2] / n[2], t[3] = e[3] / n[3], t;
}
function Tl(t, e, n) {
  return t[0] = e[0] * n, t[1] = e[1] * n, t[2] = e[2] * n, t[3] = e[3] * n, t;
}
function $l(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t;
}
function Pl(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3];
  let a = Math.hypot(n, r, i, s);
  return a > 0 && (a = 1 / a), t[0] = n * a, t[1] = r * a, t[2] = i * a, t[3] = s * a, t;
}
function Al(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function _l(t) {
  return t[0] * t[0] + t[1] * t[1] + t[2] * t[2] + t[3] * t[3];
}
function El(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Cl(t, e, n, r) {
  return t[0] = e[0] + r * (n[0] - e[0]), t[1] = e[1] + r * (n[1] - e[1]), t[2] = e[2] + r * (n[2] - e[2]), t[3] = e[3] + r * (n[3] - e[3]), t;
}
function Ll(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function Ml(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3];
  return t[0] = n[0] * r + n[4] * i + n[8] * s + n[12] * a, t[1] = n[1] * r + n[5] * i + n[9] * s + n[13] * a, t[2] = n[2] * r + n[6] * i + n[10] * s + n[14] * a, t[3] = n[3] * r + n[7] * i + n[11] * s + n[15] * a, t;
}
function Rl(t) {
  return [t[0], t[1], t[2], t[3]];
}
function Fl(t) {
  return `vec4(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const Lb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: yl,
  clone: fl,
  copy: gl,
  create: pl,
  div: Sl,
  dot: El,
  equals: Ll,
  fromValues: ml,
  length: Al,
  lerp: Cl,
  mul: xl,
  negate: $l,
  normalize: Pl,
  scale: Tl,
  set: bl,
  squaredLength: _l,
  sub: vl,
  toArray: Rl,
  toString: Fl,
  transformMat4: Ml,
  zero: wl
}, Symbol.toStringTag, { value: "Module" }));
function us() {
  const t = new Float32Array(9);
  return t[0] = 1, t[4] = 1, t[8] = 1, t;
}
function hs(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 1, t[5] = 0, t[6] = 0, t[7] = 0, t[8] = 1, t;
}
function Bl(t) {
  const e = new Float32Array(9);
  return e.set(t), e;
}
function Gl(t, e, n, r, i, s, a, o, l) {
  const c = new Float32Array(9);
  return c[0] = t, c[1] = e, c[2] = n, c[3] = r, c[4] = i, c[5] = s, c[6] = a, c[7] = o, c[8] = l, c;
}
function Ol(t, e) {
  return t.set(e), t;
}
function Il(t, e, n, r, i, s, a, o, l, c) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t[4] = s, t[5] = a, t[6] = o, t[7] = l, t[8] = c, t;
}
function ds(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[4], t[4] = e[5], t[5] = e[6], t[6] = e[8], t[7] = e[9], t[8] = e[10], t;
}
function ps(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8];
  return t[0] = n, t[1] = s, t[2] = l, t[3] = r, t[4] = a, t[5] = c, t[6] = i, t[7] = o, t[8] = h, t;
}
function Ul(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = c * s - a * l, p = -c * i + a * o, d = l * i - s * o;
  return e * h + n * p + r * d;
}
function fs(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], p = h * a - o * c, d = -h * s + o * l, f = c * s - a * l;
  let m = n * p + r * d + i * f;
  return m ? (m = 1 / m, t[0] = p * m, t[1] = (-h * r + i * c) * m, t[2] = (o * r - i * a) * m, t[3] = d * m, t[4] = (h * n - i * l) * m, t[5] = (-o * n + i * s) * m, t[6] = f * m, t[7] = (-c * n + r * l) * m, t[8] = (a * n - r * s) * m, t) : null;
}
function Dl(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], p = e[8], d = n[0], f = n[1], m = n[2], g = n[3], b = n[4], w = n[5], y = n[6], S = n[7], $ = n[8];
  return t[0] = d * r + f * a + m * c, t[1] = d * i + f * o + m * h, t[2] = d * s + f * l + m * p, t[3] = g * r + b * a + w * c, t[4] = g * i + b * o + w * h, t[5] = g * s + b * l + w * p, t[6] = y * r + S * a + $ * c, t[7] = y * i + S * o + $ * h, t[8] = y * s + S * l + $ * p, t;
}
function Vl(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], p = e[8], d = n[0], f = n[1], m = n[2];
  return t[0] = d * r, t[1] = d * i, t[2] = d * s, t[3] = f * a, t[4] = f * o, t[5] = f * l, t[6] = m * c, t[7] = m * h, t[8] = m * p, t;
}
function kl(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], p = e[8], d = n[0], f = n[1];
  return t[0] = r, t[1] = i, t[2] = s, t[3] = a, t[4] = o, t[5] = l, t[6] = d * r + f * a + c, t[7] = d * i + f * o + h, t[8] = d * s + f * l + p, t;
}
function Nl(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], p = e[8], d = Math.sin(n), f = Math.cos(n);
  return t[0] = f * r + d * a, t[1] = f * i + d * o, t[2] = f * s + d * l, t[3] = f * a - d * r, t[4] = f * o - d * i, t[5] = f * l - d * s, t[6] = c, t[7] = h, t[8] = p, t;
}
function er(t, e) {
  return ds(t, e), fs(t, t) ? (ps(t, t), t) : null;
}
function Wl(t, e, n = 1e-6) {
  for (let r = 0; r < 9; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function zl(t) {
  return `mat3(${t[0]}, ${t[1]}, ${t[2]} | ${t[3]}, ${t[4]}, ${t[5]} | ${t[6]}, ${t[7]}, ${t[8]})`;
}
const Mb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: Bl,
  copy: Ol,
  create: us,
  determinant: Ul,
  equals: Wl,
  fromMat4: ds,
  fromValues: Gl,
  identity: hs,
  invert: fs,
  multiply: Dl,
  normalFromMat4: er,
  rotate: Nl,
  scale: Vl,
  set: Il,
  toString: zl,
  translate: kl,
  transpose: ps
}, Symbol.toStringTag, { value: "Module" })), Wt = 1e-6, ce = new Float32Array(16), ql = new Float32Array(3);
function le() {
  const t = new Float32Array(16);
  return t[0] = 1, t[5] = 1, t[10] = 1, t[15] = 1, t;
}
function X(t) {
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function jl(t) {
  const e = new Float32Array(16);
  return e.set(t), e;
}
function ms(t) {
  return t.fill(0), t;
}
function Ql(...t) {
  const e = new Float32Array(16);
  for (let n = 0; n < 16; n++) e[n] = t[n] ?? 0;
  return e;
}
function gs(t, e) {
  return t.set(e), t;
}
function Xl(t, ...e) {
  for (let n = 0; n < 16; n++) t[n] = e[n] ?? 0;
  return t;
}
function Yl(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], p = e[9], d = e[10], f = e[11], m = e[12], g = e[13], b = e[14], w = e[15];
  return t[0] = n, t[1] = a, t[2] = h, t[3] = m, t[4] = r, t[5] = o, t[6] = p, t[7] = g, t[8] = i, t[9] = l, t[10] = d, t[11] = b, t[12] = s, t[13] = c, t[14] = f, t[15] = w, t;
}
function bs(t) {
  const e = t[0], n = t[1], r = t[2], i = t[3], s = t[4], a = t[5], o = t[6], l = t[7], c = t[8], h = t[9], p = t[10], d = t[11], f = t[12], m = t[13], g = t[14], b = t[15], w = e * a - n * s, y = e * o - r * s, S = e * l - i * s, $ = n * o - r * a, P = n * l - i * a, _ = r * l - i * o, C = c * m - h * f, I = c * g - p * f, W = c * b - d * f, z = h * g - p * m, q = h * b - d * m, Y = p * b - d * g;
  return w * Y - y * q + S * z + $ * W - P * I + _ * C;
}
function tn(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = e[4], o = e[5], l = e[6], c = e[7], h = e[8], p = e[9], d = e[10], f = e[11], m = e[12], g = e[13], b = e[14], w = e[15], y = n * o - r * a, S = n * l - i * a, $ = n * c - s * a, P = r * l - i * o, _ = r * c - s * o, C = i * c - s * l, I = h * g - p * m, W = h * b - d * m, z = h * w - f * m, q = p * b - d * g, Y = p * w - f * g, ne = d * w - f * b;
  let E = y * ne - S * Y + $ * q + P * z - _ * W + C * I;
  return E ? (E = 1 / E, t[0] = (o * ne - l * Y + c * q) * E, t[1] = (i * Y - r * ne - s * q) * E, t[2] = (g * C - b * _ + w * P) * E, t[3] = (d * _ - p * C - f * P) * E, t[4] = (l * z - a * ne - c * W) * E, t[5] = (n * ne - i * z + s * W) * E, t[6] = (b * $ - m * C - w * S) * E, t[7] = (h * C - d * $ + f * S) * E, t[8] = (a * Y - o * z + c * I) * E, t[9] = (r * z - n * Y - s * I) * E, t[10] = (m * _ - g * $ + w * y) * E, t[11] = (p * $ - h * _ - f * y) * E, t[12] = (o * W - a * q - l * I) * E, t[13] = (n * q - r * W + i * I) * E, t[14] = (g * S - m * P - b * y) * E, t[15] = (h * P - p * S + d * y) * E, t) : null;
}
function K(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = e[4], l = e[5], c = e[6], h = e[7], p = e[8], d = e[9], f = e[10], m = e[11], g = e[12], b = e[13], w = e[14], y = e[15], S = n[0], $ = n[1], P = n[2], _ = n[3], C = n[4], I = n[5], W = n[6], z = n[7], q = n[8], Y = n[9], ne = n[10], E = n[11], gt = n[12], bt = n[13], wt = n[14], yt = n[15];
  return t[0] = S * r + $ * o + P * p + _ * g, t[1] = S * i + $ * l + P * d + _ * b, t[2] = S * s + $ * c + P * f + _ * w, t[3] = S * a + $ * h + P * m + _ * y, t[4] = C * r + I * o + W * p + z * g, t[5] = C * i + I * l + W * d + z * b, t[6] = C * s + I * c + W * f + z * w, t[7] = C * a + I * h + W * m + z * y, t[8] = q * r + Y * o + ne * p + E * g, t[9] = q * i + Y * l + ne * d + E * b, t[10] = q * s + Y * c + ne * f + E * w, t[11] = q * a + Y * h + ne * m + E * y, t[12] = gt * r + bt * o + wt * p + yt * g, t[13] = gt * i + bt * l + wt * d + yt * b, t[14] = gt * s + bt * c + wt * f + yt * w, t[15] = gt * a + bt * h + wt * m + yt * y, t;
}
function Hl(t, ...e) {
  if (e.length === 0) return X(t);
  gs(t, e[0]);
  for (let n = 1; n < e.length; n++) K(t, t, e[n]);
  return t;
}
function ws(t, e) {
  return X(t), t[12] = e[0], t[13] = e[1], t[14] = e[2], t;
}
function Zl(t, e) {
  return X(t), t[0] = e[0], t[5] = e[1], t[10] = e[2], t;
}
function ys(t, e, n) {
  let r = n[0], i = n[1], s = n[2], a = Math.hypot(r, i, s);
  if (a < Wt) return X(t);
  a = 1 / a, r *= a, i *= a, s *= a;
  const o = Math.sin(e), l = Math.cos(e), c = 1 - l, h = r * r * c + l, p = i * r * c + s * o, d = s * r * c - i * o, f = r * i * c - s * o, m = i * i * c + l, g = s * i * c + r * o, b = r * s * c + i * o, w = i * s * c - r * o, y = s * s * c + l;
  return t[0] = h, t[1] = p, t[2] = d, t[3] = 0, t[4] = f, t[5] = m, t[6] = g, t[7] = 0, t[8] = b, t[9] = w, t[10] = y, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function tr(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[5] = r, t[6] = n, t[9] = -n, t[10] = r, t;
}
function nr(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[0] = r, t[2] = -n, t[8] = n, t[10] = r, t;
}
function rr(t, e) {
  const n = Math.sin(e), r = Math.cos(e);
  return X(t), t[0] = r, t[1] = n, t[4] = -n, t[5] = r, t;
}
function Kl(t, e, n, r) {
  return ir(t, e, n, r, Jl);
}
const Jl = new Float32Array([1, 1, 1]);
function ir(t, e, n, r, i) {
  let s = n[0], a = n[1], o = n[2], l = Math.hypot(s, a, o);
  if (l < Wt)
    return X(t), t[12] = r[0], t[13] = r[1], t[14] = r[2], t;
  l = 1 / l, s *= l, a *= l, o *= l;
  const c = Math.sin(e), h = Math.cos(e), p = 1 - h, d = s * s * p + h, f = a * s * p + o * c, m = o * s * p - a * c, g = s * a * p - o * c, b = a * a * p + h, w = o * a * p + s * c, y = s * o * p + a * c, S = a * o * p - s * c, $ = o * o * p + h, P = i[0], _ = i[1], C = i[2];
  return t[0] = d * P, t[1] = f * P, t[2] = m * P, t[3] = 0, t[4] = g * _, t[5] = b * _, t[6] = w * _, t[7] = 0, t[8] = y * C, t[9] = S * C, t[10] = $ * C, t[11] = 0, t[12] = r[0], t[13] = r[1], t[14] = r[2], t[15] = 1, t;
}
function ec(t, e, n, r, i, s) {
  ir(t, e, n, r, i);
  const a = s[0], o = s[1], l = s[2];
  return t[12] = r[0] + a - (t[0] * a + t[4] * o + t[8] * l), t[13] = r[1] + o - (t[1] * a + t[5] * o + t[9] * l), t[14] = r[2] + l - (t[2] * a + t[6] * o + t[10] * l), t;
}
function tc(t, e, n) {
  return ws(ce, n), K(t, e, ce);
}
function nc(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t[4] = e[4] * i, t[5] = e[5] * i, t[6] = e[6] * i, t[7] = e[7] * i, t[8] = e[8] * s, t[9] = e[9] * s, t[10] = e[10] * s, t[11] = e[11] * s, t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function rc(t, e, n, r) {
  return ys(ce, n, r), K(t, e, ce);
}
function ic(t, e, n) {
  return tr(ce, n), K(t, e, ce);
}
function sc(t, e, n) {
  return nr(ce, n), K(t, e, ce);
}
function ac(t, e, n) {
  return rr(ce, n), K(t, e, ce);
}
function oc(t, e) {
  return t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function sr(t, e) {
  return t[0] = Math.hypot(e[0], e[1], e[2]), t[1] = Math.hypot(e[4], e[5], e[6]), t[2] = Math.hypot(e[8], e[9], e[10]), t;
}
function lc(t, e) {
  const n = sr(ql, e), r = bs(e) < 0 ? -1 : 1, i = n[0] * r, s = n[1], a = n[2];
  return t[0] = e[0] / i, t[1] = e[1] / i, t[2] = e[2] / i, t[3] = e[4] / s, t[4] = e[5] / s, t[5] = e[6] / s, t[6] = e[8] / a, t[7] = e[9] / a, t[8] = e[10] / a, t;
}
function vs(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  if (t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i)) {
    const a = 1 / (r - i);
    t[10] = (i + r) * a, t[14] = 2 * i * r * a;
  } else
    t[10] = -1, t[14] = -2 * r;
  return t;
}
function xs(t, e, n, r, i) {
  const s = 1 / Math.tan(e / 2);
  return t[0] = s / n, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[11] = -1, t[12] = 0, t[13] = 0, t[15] = 0, Number.isFinite(i) ? (t[10] = i / (r - i), t[14] = i * r / (r - i)) : (t[10] = -1, t[14] = -r), t;
}
function Un(t, e) {
  return t !== e && t.set(e), t[1] = -t[1], t[5] = -t[5], t[9] = -t[9], t[13] = -t[13], t;
}
function Ss(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), l = 1 / (r - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 2 * c, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * l, t[14] = (a + s) * c, t[15] = 1, t;
}
function Ts(t, e, n, r, i, s, a) {
  const o = 1 / (e - n), l = 1 / (r - i), c = 1 / (s - a);
  return t[0] = -2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = -2 * l, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = c, t[11] = 0, t[12] = (e + n) * o, t[13] = (i + r) * l, t[14] = s * c, t[15] = 1, t;
}
function cc(t, e, n, r, i, s, a) {
  const o = 1 / (n - e), l = 1 / (i - r), c = 1 / (s - a);
  return t[0] = s * 2 * o, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = s * 2 * l, t[6] = 0, t[7] = 0, t[8] = (n + e) * o, t[9] = (i + r) * l, t[10] = (a + s) * c, t[11] = -1, t[12] = 0, t[13] = 0, t[14] = 2 * a * s * c, t[15] = 0, t;
}
function Dn(t, e, n, r) {
  let i = e[0] - n[0], s = e[1] - n[1], a = e[2] - n[2], o = Math.hypot(i, s, a);
  if (o < Wt) return ms(t);
  o = 1 / o, i *= o, s *= o, a *= o;
  let l = r[1] * a - r[2] * s, c = r[2] * i - r[0] * a, h = r[0] * s - r[1] * i;
  o = Math.hypot(l, c, h), o < Wt ? (l = 0, c = 0, h = 0) : (o = 1 / o, l *= o, c *= o, h *= o);
  const p = s * h - a * c, d = a * l - i * h, f = i * c - s * l;
  return t[0] = l, t[1] = p, t[2] = i, t[3] = 0, t[4] = c, t[5] = d, t[6] = s, t[7] = 0, t[8] = h, t[9] = f, t[10] = a, t[11] = 0, t[12] = -(l * e[0] + c * e[1] + h * e[2]), t[13] = -(p * e[0] + d * e[1] + f * e[2]), t[14] = -(i * e[0] + s * e[1] + a * e[2]), t[15] = 1, t;
}
function ar(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  let a = e[3] * r + e[7] * i + e[11] * s + e[15];
  return a = a || 1, t[0] = (e[0] * r + e[4] * i + e[8] * s + e[12]) / a, t[1] = (e[1] * r + e[5] * i + e[9] * s + e[13]) / a, t[2] = (e[2] * r + e[6] * i + e[10] * s + e[14]) / a, t;
}
function uc(t, e, n) {
  const r = n[0], i = n[1], s = n[2];
  return t[0] = e[0] * r + e[4] * i + e[8] * s, t[1] = e[1] * r + e[5] * i + e[9] * s, t[2] = e[2] * r + e[6] * i + e[10] * s, t;
}
function hc(t, e, n = 1e-6) {
  for (let r = 0; r < 16; r++)
    if (Math.abs(t[r] - e[r]) > n) return !1;
  return !0;
}
function dc(t) {
  const e = [];
  for (let n = 0; n < 4; n++)
    e.push(
      `[${t[n]}, ${t[n + 4]}, ${t[n + 8]}, ${t[n + 12]}]`
    );
  return `mat4(${e.join(", ")})`;
}
const Rb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: jl,
  copy: gs,
  create: le,
  determinant: bs,
  equals: hc,
  flipClipY: Un,
  fromRotation: ys,
  fromRotationTranslation: Kl,
  fromRotationTranslationScale: ir,
  fromRotationTranslationScaleOrigin: ec,
  fromScaling: Zl,
  fromTranslation: ws,
  fromValues: Ql,
  fromXRotation: tr,
  fromYRotation: nr,
  fromZRotation: rr,
  frustum: cc,
  getRotation: lc,
  getScaling: sr,
  getTranslation: oc,
  identity: X,
  invert: tn,
  lookAt: Dn,
  multiply: K,
  multiplyAll: Hl,
  ortho: Ss,
  orthoZO: Ts,
  perspective: vs,
  perspectiveZO: xs,
  rotate: rc,
  rotateX: ic,
  rotateY: sc,
  rotateZ: ac,
  scale: nc,
  set: Xl,
  toString: dc,
  transformDirection: uc,
  transformPoint: ar,
  translate: tc,
  transpose: Yl,
  zero: ms
}, Symbol.toStringTag, { value: "Module" }));
function $s() {
  const t = new Float32Array(4);
  return t[3] = 1, t;
}
function pc(t) {
  const e = new Float32Array(4);
  return Ps(e, t);
}
function Ps(t, e) {
  return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t;
}
function ft(t, e, n, r, i) {
  return t[0] = e, t[1] = n, t[2] = r, t[3] = i, t;
}
function fc(t, e, n, r) {
  return ft(new Float32Array(4), t, e, n, r);
}
function nn(t) {
  return t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 1, t;
}
function or(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function lr(t) {
  return or(t, t);
}
function As(t) {
  return Math.sqrt(lr(t));
}
function He(t, e) {
  const n = As(e);
  if (n < 1e-8) return nn(t);
  const r = 1 / n;
  return t[0] = e[0] * r, t[1] = e[1] * r, t[2] = e[2] * r, t[3] = e[3] * r, t;
}
function mc(t, e) {
  return t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = e[3], t;
}
function gc(t, e) {
  const n = lr(e);
  if (n < 1e-12) return nn(t);
  const r = 1 / n;
  return t[0] = -e[0] * r, t[1] = -e[1] * r, t[2] = -e[2] * r, t[3] = e[3] * r, t;
}
function Le(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = e[3], o = n[0], l = n[1], c = n[2], h = n[3];
  return t[0] = r * h + a * o + i * c - s * l, t[1] = i * h + a * l + s * o - r * c, t[2] = s * h + a * c + r * l - i * o, t[3] = a * h - r * o - i * l - s * c, t;
}
function bc(t, e, n) {
  return Le(t, n, e);
}
function wc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return Le(t, e, ft(cr, i, 0, 0, s));
}
function yc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return Le(t, e, ft(cr, 0, i, 0, s));
}
function vc(t, e, n) {
  const r = n * 0.5, i = Math.sin(r), s = Math.cos(r);
  return Le(t, e, ft(cr, 0, 0, i, s));
}
const cr = $s();
function Ut(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]);
  if (r < 1e-8) return nn(t);
  const i = n * 0.5, s = Math.sin(i) / r;
  return t[0] = e[0] * s, t[1] = e[1] * s, t[2] = e[2] * s, t[3] = Math.cos(i), t;
}
function xc(t, e) {
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
  return He(t, t);
}
function Sc(t, e, n) {
  const r = e[0], i = e[1], s = e[2], a = n[0], o = n[1], l = n[2];
  let c = r * a + i * o + s * l + 1;
  return c < 1e-8 ? (c = 0, Math.abs(r) > Math.abs(s) ? (t[0] = -i, t[1] = r, t[2] = 0) : (t[0] = 0, t[1] = -s, t[2] = i), t[3] = c) : (t[0] = i * l - s * o, t[1] = s * a - r * l, t[2] = r * o - i * a, t[3] = c), He(t, t);
}
function Tc(t, e, n) {
  const r = n[0], i = n[1], s = n[2], a = e[0], o = e[1], l = e[2], c = e[3], h = 2 * (o * s - l * i), p = 2 * (l * r - a * s), d = 2 * (a * i - o * r);
  return t[0] = r + c * h + (o * d - l * p), t[1] = i + c * p + (l * h - a * d), t[2] = s + c * d + (a * p - o * h), t;
}
function $c(t, e, n, r) {
  let i = n[0], s = n[1], a = n[2], o = n[3], l = or(e, n);
  if (l < 0 && (l = -l, i = -i, s = -s, a = -a, o = -o), l > 0.9995)
    return t[0] = e[0] + (i - e[0]) * r, t[1] = e[1] + (s - e[1]) * r, t[2] = e[2] + (a - e[2]) * r, t[3] = e[3] + (o - e[3]) * r, He(t, t);
  const c = Math.acos(l), h = Math.sin(c), p = Math.sin((1 - r) * c) / h, d = Math.sin(r * c) / h;
  return t[0] = e[0] * p + i * d, t[1] = e[1] * p + s * d, t[2] = e[2] * p + a * d, t[3] = e[3] * p + o * d, He(t, t);
}
function Pc(t, e, n, r) {
  return t[0] = e[0] + (n[0] - e[0]) * r, t[1] = e[1] + (n[1] - e[1]) * r, t[2] = e[2] + (n[2] - e[2]) * r, t[3] = e[3] + (n[3] - e[3]) * r, He(t, t);
}
function _s(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[3], a = n + n, o = r + r, l = i + i, c = n * a, h = n * o, p = n * l, d = r * o, f = r * l, m = i * l, g = s * a, b = s * o, w = s * l;
  return t[0] = 1 - (d + m), t[1] = h + w, t[2] = p - b, t[3] = 0, t[4] = h - w, t[5] = 1 - (c + m), t[6] = f + g, t[7] = 0, t[8] = p + b, t[9] = f - g, t[10] = 1 - (c + d), t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function Ac(t, e, n = 1e-6) {
  return Math.abs(t[0] - e[0]) <= n && Math.abs(t[1] - e[1]) <= n && Math.abs(t[2] - e[2]) <= n && Math.abs(t[3] - e[3]) <= n;
}
function _c(t) {
  return `quat(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]})`;
}
const Fb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: pc,
  conjugate: mc,
  copy: Ps,
  create: $s,
  dot: or,
  equals: Ac,
  fromValues: fc,
  identity: nn,
  invert: gc,
  length: As,
  lerp: Pc,
  multiply: Le,
  normalize: He,
  premultiply: bc,
  rotateX: wc,
  rotateY: yc,
  rotateZ: vc,
  set: ft,
  setAxisAngle: Ut,
  setFromRotationMatrix: xc,
  setFromUnitVectors: Sc,
  slerp: $c,
  squaredLength: lr,
  toMat4: _s,
  toString: _c,
  transformVec3: Tc
}, Symbol.toStringTag, { value: "Module" })), Ec = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"];
function Es(t = 0, e = 0, n = 0, r = "XYZ") {
  return { x: t, y: e, z: n, order: r };
}
function Cc(t) {
  return Es(t.x, t.y, t.z, t.order);
}
function Lc(t, e) {
  return t.x = e.x, t.y = e.y, t.z = e.z, t.order = e.order, t;
}
function Mc(t, e, n, r, i = t.order) {
  return t.x = e, t.y = n, t.z = r, t.order = i, t;
}
function Rc(t, e, n = 1e-6) {
  return t.order === e.order && Math.abs(t.x - e.x) <= n && Math.abs(t.y - e.y) <= n && Math.abs(t.z - e.z) <= n;
}
const Cs = {
  XYZ: ["X", "Y", "Z"],
  YXZ: ["Y", "X", "Z"],
  ZXY: ["Z", "X", "Y"],
  ZYX: ["Z", "Y", "X"],
  YZX: ["Y", "Z", "X"],
  XZY: ["X", "Z", "Y"]
}, dn = {
  X: new Float32Array([1, 0, 0]),
  Y: new Float32Array([0, 1, 0]),
  Z: new Float32Array([0, 0, 1])
}, Fc = X(new Float32Array(16)), Bc = X(new Float32Array(16)), Gc = X(new Float32Array(16)), Vn = X(new Float32Array(16)), Oc = new Float32Array(4), Ic = new Float32Array(4), Uc = new Float32Array(4), Cr = new Float32Array(4);
function ze(t, e) {
  return e === "X" ? t.x : e === "Y" ? t.y : t.z;
}
function pn(t, e, n) {
  return t === "X" ? tr(n, e) : t === "Y" ? nr(n, e) : rr(n, e);
}
function Dc(t, e) {
  const n = Cs[e.order], r = pn(n[0], ze(e, n[0]), Fc), i = pn(n[1], ze(e, n[1]), Bc), s = pn(n[2], ze(e, n[2]), Gc);
  return K(Vn, r, i), K(t, Vn, s);
}
function Vc(t, e) {
  const n = Cs[e.order], r = Ut(Oc, dn[n[0]], ze(e, n[0])), i = Ut(Ic, dn[n[1]], ze(e, n[1])), s = Ut(Uc, dn[n[2]], ze(e, n[2]));
  return Le(Cr, r, i), Le(t, Cr, s);
}
function Ls(t, e) {
  const n = e[0], r = e[1], i = e[2], s = e[4], a = e[5], o = e[6], l = e[8], c = e[9], h = e[10], p = (f) => f < -1 ? -1 : f > 1 ? 1 : f, d = 0.9999999;
  switch (t.order) {
    case "XYZ":
      t.y = Math.asin(p(l)), Math.abs(l) < d ? (t.x = Math.atan2(-c, h), t.z = Math.atan2(-s, n)) : (t.x = Math.atan2(o, a), t.z = 0);
      break;
    case "YXZ":
      t.x = Math.asin(-p(c)), Math.abs(c) < d ? (t.y = Math.atan2(l, h), t.z = Math.atan2(r, a)) : (t.y = Math.atan2(-i, n), t.z = 0);
      break;
    case "ZXY":
      t.x = Math.asin(p(o)), Math.abs(o) < d ? (t.y = Math.atan2(-i, h), t.z = Math.atan2(-s, a)) : (t.y = 0, t.z = Math.atan2(r, n));
      break;
    case "ZYX":
      t.y = Math.asin(-p(i)), Math.abs(i) < d ? (t.x = Math.atan2(o, h), t.z = Math.atan2(r, n)) : (t.x = 0, t.z = Math.atan2(-s, a));
      break;
    case "YZX":
      t.z = Math.asin(p(r)), Math.abs(r) < d ? (t.x = Math.atan2(-c, a), t.y = Math.atan2(-i, n)) : (t.x = 0, t.y = Math.atan2(l, h));
      break;
    case "XZY":
      t.z = Math.asin(-p(s)), Math.abs(s) < d ? (t.x = Math.atan2(o, a), t.y = Math.atan2(l, n)) : (t.x = Math.atan2(-c, h), t.y = 0);
      break;
  }
  return t;
}
function kc(t, e) {
  return Ls(t, _s(Vn, e));
}
const Bb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EULER_ORDERS: Ec,
  clone: Cc,
  copy: Lc,
  create: Es,
  equals: Rc,
  fromQuaternion: kc,
  fromRotationMatrix: Ls,
  set: Mc,
  toMat4: Dc,
  toQuaternion: Vc
}, Symbol.toStringTag, { value: "Module" })), rn = 1e-12, xt = new Float32Array(3), Nc = new Float32Array(9);
function Ae(t = 0, e = 0, n = 1, r = 0) {
  return { normal: new Float32Array([t, e, n]), constant: r };
}
function Wc(t) {
  return { normal: new Float32Array([t.normal[0], t.normal[1], t.normal[2]]), constant: t.constant };
}
function ur(t, e) {
  return t.normal[0] = e.normal[0], t.normal[1] = e.normal[1], t.normal[2] = e.normal[2], t.constant = e.constant, t;
}
function zc(t, e, n) {
  return t.normal[0] = e[0], t.normal[1] = e[1], t.normal[2] = e[2], t.constant = n, t;
}
function Ms(t, e, n, r, i) {
  return t.normal[0] = e, t.normal[1] = n, t.normal[2] = r, t.constant = i, t;
}
function qc(t, e, n) {
  const r = Math.hypot(e[0], e[1], e[2]), i = r < rn ? 1 : 1 / r;
  return t.normal[0] = e[0] * i, t.normal[1] = e[1] * i, t.normal[2] = e[2] * i, t.constant = -me(t.normal, n), t;
}
function jc(t, e, n, r) {
  const i = new Float32Array([n[0] - e[0], n[1] - e[1], n[2] - e[2]]), s = new Float32Array([r[0] - e[0], r[1] - e[1], r[2] - e[2]]);
  os(t.normal, i, s);
  const a = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  return a < rn ? null : (t.normal[0] = t.normal[0] / a, t.normal[1] = t.normal[1] / a, t.normal[2] = t.normal[2] / a, t.constant = -me(t.normal, e), t);
}
function Rs(t, e) {
  const n = Math.hypot(e.normal[0], e.normal[1], e.normal[2]);
  if (n < rn) return null;
  const r = 1 / n;
  return t.normal[0] = e.normal[0] * r, t.normal[1] = e.normal[1] * r, t.normal[2] = e.normal[2] * r, t.constant = e.constant * r, t;
}
function Qc(t, e) {
  return t.normal[0] = -e.normal[0], t.normal[1] = -e.normal[1], t.normal[2] = -e.normal[2], t.constant = -e.constant, t;
}
function pe(t, e) {
  return me(t.normal, e) + t.constant;
}
function Xc(t, e, n) {
  const r = pe(e, n);
  return t[0] = n[0] - e.normal[0] * r, t[1] = n[1] - e.normal[1] * r, t[2] = n[2] - e.normal[2] * r, t;
}
function Fs(t, e) {
  return t[0] = e.normal[0] * -e.constant, t[1] = e.normal[1] * -e.constant, t[2] = e.normal[2] * -e.constant, t;
}
function Yc(t, e, n) {
  return ur(t, e), t.constant -= me(n, e.normal), t;
}
function Hc(t, e, n) {
  const r = pe(t, e), i = pe(t, n);
  return r === 0 ? 0 : i === 0 ? 1 : r > 0 == i > 0 ? null : r / (r - i);
}
function Zc(t, e, n) {
  const r = er(Nc, n);
  if (!r)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the matrix is singular, so the transformed plane is undefined."
    );
  Fs(xt, e), Jn(xt, xt, n), ls(t.normal, e.normal, r);
  const i = Math.hypot(t.normal[0], t.normal[1], t.normal[2]);
  if (i < rn)
    throw new RangeError(
      "[gpu-device-api] plane.applyMat4: the transformed normal is degenerate (the matrix collapses the plane)."
    );
  return t.normal[0] = t.normal[0] / i, t.normal[1] = t.normal[1] / i, t.normal[2] = t.normal[2] / i, t.constant = -me(t.normal, xt), t;
}
function Bs(t, e, n = 1e-6) {
  const r = Math.abs(t.normal[0] - e.normal[0]) <= n && Math.abs(t.normal[1] - e.normal[1]) <= n && Math.abs(t.normal[2] - e.normal[2]) <= n && Math.abs(t.constant - e.constant) <= n, i = Math.abs(t.normal[0] + e.normal[0]) <= n && Math.abs(t.normal[1] + e.normal[1]) <= n && Math.abs(t.normal[2] + e.normal[2]) <= n && Math.abs(t.constant + e.constant) <= n;
  return r || i;
}
function Kc(t) {
  return `plane(${t.normal[0]}, ${t.normal[1]}, ${t.normal[2]}, ${t.constant})`;
}
const Gb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Zc,
  clone: Wc,
  coplanarPoint: Fs,
  copy: ur,
  create: Ae,
  distanceToPoint: pe,
  equals: Bs,
  intersectLineSegment: Hc,
  negate: Qc,
  normalize: Rs,
  projectPoint: Xc,
  set: zc,
  setComponents: Ms,
  setFromCoplanarPoints: jc,
  setFromNormalAndCoplanarPoint: qc,
  toString: Kc,
  translate: Yc
}, Symbol.toStringTag, { value: "Module" })), oe = new Float32Array(3);
function Jc() {
  return Me({ min: new Float32Array(3), max: new Float32Array(3) });
}
function Me(t) {
  return t.min[0] = Number.POSITIVE_INFINITY, t.min[1] = Number.POSITIVE_INFINITY, t.min[2] = Number.POSITIVE_INFINITY, t.max[0] = Number.NEGATIVE_INFINITY, t.max[1] = Number.NEGATIVE_INFINITY, t.max[2] = Number.NEGATIVE_INFINITY, t;
}
function N(t) {
  return t.max[0] < t.min[0] || t.max[1] < t.min[1] || t.max[2] < t.min[2];
}
function eu(t) {
  return {
    min: new Float32Array([t.min[0], t.min[1], t.min[2]]),
    max: new Float32Array([t.max[0], t.max[1], t.max[2]])
  };
}
function zt(t, e) {
  return t.min[0] = e.min[0], t.min[1] = e.min[1], t.min[2] = e.min[2], t.max[0] = e.max[0], t.max[1] = e.max[1], t.max[2] = e.max[2], t;
}
function tu(t, e, n) {
  return t.min[0] = e[0], t.min[1] = e[1], t.min[2] = e[2], t.max[0] = n[0], t.max[1] = n[1], t.max[2] = n[2], t;
}
function nu(t, e, n) {
  const r = n[0] * 0.5, i = n[1] * 0.5, s = n[2] * 0.5;
  return t.min[0] = e[0] - r, t.min[1] = e[1] - i, t.min[2] = e[2] - s, t.max[0] = e[0] + r, t.max[1] = e[1] + i, t.max[2] = e[2] + s, t;
}
function ru(t, e) {
  Me(t);
  for (const n of e) hr(t, n);
  return t;
}
function iu(t, e, n = 3) {
  Me(t);
  const r = Math.max(1, Math.trunc(n));
  for (let i = 0; i + 2 < e.length; i += r)
    t.min[0] = Math.min(t.min[0], e[i]), t.min[1] = Math.min(t.min[1], e[i + 1]), t.min[2] = Math.min(t.min[2], e[i + 2]), t.max[0] = Math.max(t.max[0], e[i]), t.max[1] = Math.max(t.max[1], e[i + 1]), t.max[2] = Math.max(t.max[2], e[i + 2]);
  return t;
}
function Gs(t, e) {
  return N(e) || (t[0] = (e.min[0] + e.max[0]) * 0.5, t[1] = (e.min[1] + e.max[1]) * 0.5, t[2] = (e.min[2] + e.max[2]) * 0.5), t;
}
function su(t, e) {
  return N(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, t) : de(t, e.max, e.min);
}
function au(t, e) {
  return N(e) ? (t[0] = 0, t[1] = 0, t[2] = 0, -1) : (Gs(t, e), Math.hypot(e.max[0] - t[0], e.max[1] - t[1], e.max[2] - t[2]));
}
function hr(t, e) {
  return Jt(t.min, t.min, e), en(t.max, t.max, e), t;
}
function ou(t, e) {
  return lt(t.min, t.min, e), lt(t.max, t.max, e), t;
}
function lu(t, e) {
  return t.min[0] = t.min[0] - e, t.min[1] = t.min[1] - e, t.min[2] = t.min[2] - e, t.max[0] = t.max[0] + e, t.max[1] = t.max[1] + e, t.max[2] = t.max[2] + e, t;
}
function cu(t, e) {
  return e[0] >= t.min[0] && e[0] <= t.max[0] && e[1] >= t.min[1] && e[1] <= t.max[1] && e[2] >= t.min[2] && e[2] <= t.max[2];
}
function uu(t, e) {
  return t.min[0] <= e.min[0] && e.max[0] <= t.max[0] && t.min[1] <= e.min[1] && e.max[1] <= t.max[1] && t.min[2] <= e.min[2] && e.max[2] <= t.max[2];
}
function Os(t, e) {
  return N(t) || N(e) ? !1 : e.max[0] >= t.min[0] && e.min[0] <= t.max[0] && e.max[1] >= t.min[1] && e.min[1] <= t.max[1] && e.max[2] >= t.min[2] && e.min[2] <= t.max[2];
}
function hu(t, e, n) {
  return N(t) ? !1 : Kt(dr(oe, t, e), e) <= n * n;
}
function du(t, e) {
  if (N(t)) return !1;
  let n = Number.POSITIVE_INFINITY, r = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < 8; i++) {
    oe[0] = i & 1 ? t.max[0] : t.min[0], oe[1] = i & 2 ? t.max[1] : t.min[1], oe[2] = i & 4 ? t.max[2] : t.min[2];
    const s = pe(e, oe);
    n = Math.min(n, s), r = Math.max(r, s);
  }
  return n <= 0 && r >= 0;
}
function dr(t, e, n) {
  return N(e) || (t[0] = Math.min(Math.max(n[0], e.min[0]), e.max[0]), t[1] = Math.min(Math.max(n[1], e.min[1]), e.max[1]), t[2] = Math.min(Math.max(n[2], e.min[2]), e.max[2])), t;
}
function pu(t, e) {
  return N(t) ? 0 : Math.sqrt(Kt(dr(oe, t, e), e));
}
function fu(t, e, n) {
  return zt(t, e), lt(t.min, t.min, n), lt(t.max, t.max, n), t;
}
function mu(t, e, n) {
  return N(e) ? zt(t, n) : N(n) ? zt(t, e) : (Jt(t.min, e.min, n.min), en(t.max, e.max, n.max), t);
}
function gu(t, e, n) {
  return Os(e, n) ? (en(t.min, e.min, n.min), Jt(t.max, e.max, n.max), t) : Me(t);
}
function bu(t, e, n) {
  if (N(e)) return Me(t);
  const r = e.min[0], i = e.min[1], s = e.min[2], a = e.max[0], o = e.max[1], l = e.max[2];
  Me(t);
  for (let c = 0; c < 8; c++) {
    const h = c & 1 ? a : r, p = c & 2 ? o : i, d = c & 4 ? l : s, f = n[3] * h + n[7] * p + n[11] * d + n[15], m = f === 0 ? 1 : 1 / f;
    oe[0] = (n[0] * h + n[4] * p + n[8] * d + n[12]) * m, oe[1] = (n[1] * h + n[5] * p + n[9] * d + n[13]) * m, oe[2] = (n[2] * h + n[6] * p + n[10] * d + n[14]) * m, hr(t, oe);
  }
  return t;
}
function wu(t, e, n) {
  if (Nt(t.min, e.min, n), Nt(t.max, e.max, n), n < 0) {
    const r = t.min[0], i = t.min[1], s = t.min[2];
    t.min[0] = t.max[0], t.min[1] = t.max[1], t.min[2] = t.max[2], t.max[0] = r, t.max[1] = i, t.max[2] = s;
  }
  return t;
}
function yu(t, e, n = 1e-6) {
  const r = N(t), i = N(e);
  return r || i ? r === i : Math.abs(t.min[0] - e.min[0]) <= n && Math.abs(t.min[1] - e.min[1]) <= n && Math.abs(t.min[2] - e.min[2]) <= n && Math.abs(t.max[0] - e.max[0]) <= n && Math.abs(t.max[1] - e.max[1]) <= n && Math.abs(t.max[2] - e.max[2]) <= n;
}
function vu(t) {
  return N(t) ? "box3(empty)" : `box3(${t.min[0]}, ${t.min[1]}, ${t.min[2]}) - (${t.max[0]}, ${t.max[1]}, ${t.max[2]})`;
}
const Ob = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: bu,
  clampPoint: dr,
  clone: eu,
  containsBox: uu,
  containsPoint: cu,
  copy: zt,
  create: Jc,
  distanceToPoint: pu,
  equals: yu,
  expandByPoint: hr,
  expandByScalar: lu,
  expandByVector: ou,
  getBoundingSphere: au,
  getCenter: Gs,
  getSize: su,
  intersect: gu,
  intersectsBox: Os,
  intersectsPlane: du,
  intersectsSphere: hu,
  isEmpty: N,
  makeEmpty: Me,
  scaleBox: wu,
  set: tu,
  setFromArray: iu,
  setFromCenterAndSize: nu,
  setFromPoints: ru,
  toString: vu,
  translate: fu,
  union: mu
}, Symbol.toStringTag, { value: "Module" }));
function xu(t = 0, e = 0, n = 0, r = 0, i = 0, s = -1) {
  return {
    origin: new Float32Array([t, e, n]),
    direction: new Float32Array([r, i, s])
  };
}
function Su(t) {
  return {
    origin: new Float32Array([t.origin[0], t.origin[1], t.origin[2]]),
    direction: new Float32Array([t.direction[0], t.direction[1], t.direction[2]])
  };
}
function Tu(t, e) {
  return t.origin[0] = e.origin[0], t.origin[1] = e.origin[1], t.origin[2] = e.origin[2], t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t;
}
function sn(t, e, n) {
  t.origin[0] = e[0], t.origin[1] = e[1], t.origin[2] = e[2];
  const r = Math.hypot(n[0], n[1], n[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = n[0] * i, t.direction[1] = n[1] * i, t.direction[2] = n[2] * i, t;
}
function pr(t, e, n) {
  return t[0] = e.origin[0] + e.direction[0] * n, t[1] = e.origin[1] + e.direction[1] * n, t[2] = e.origin[2] + e.direction[2] * n, t;
}
function $u(t, e, n) {
  const r = e.origin[0], i = e.origin[1], s = e.origin[2];
  return t.direction[0] = e.direction[0], t.direction[1] = e.direction[1], t.direction[2] = e.direction[2], t.origin[0] = r + t.direction[0] * n, t.origin[1] = i + t.direction[1] * n, t.origin[2] = s + t.direction[2] * n, t;
}
function Is(t, e, n) {
  const r = Math.max(0, me(de(Ds, n, e.origin), e.direction));
  return pr(t, e, r);
}
function Pu(t, e) {
  return Math.sqrt(Us(t, e));
}
function Us(t, e) {
  return Kt(e, Is(Ds, t, e));
}
const Ds = new Float32Array(3);
function Au(t, e, n) {
  Jn(t.origin, e.origin, n), cs(t.direction, e.direction, n);
  const r = Math.hypot(t.direction[0], t.direction[1], t.direction[2]), i = r > 1e-12 ? 1 / r : 1;
  return t.direction[0] = t.direction[0] * i, t.direction[1] = t.direction[1] * i, t.direction[2] = t.direction[2] * i, t;
}
function Vs(t, e) {
  const n = me(e.normal, t.direction);
  if (Math.abs(n) < 1e-12) return null;
  const r = -pe(e, t.origin) / n;
  return r >= 0 ? r : null;
}
function ks(t, e, n) {
  const r = t.origin[0] - e[0], i = t.origin[1] - e[1], s = t.origin[2] - e[2], a = t.direction[0], o = t.direction[1], l = t.direction[2], c = r * a + i * o + s * l, h = r * r + i * i + s * s - n * n, p = c * c - h;
  if (p < 0) return null;
  const d = Math.sqrt(p), f = -c - d;
  if (f >= 0) return f;
  const m = -c + d;
  return m >= 0 ? m : null;
}
function Ns(t, e) {
  if (N(e)) return null;
  let n = 0, r = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 3; i++) {
    const s = t.origin[i], a = t.direction[i], o = e.min[i], l = e.max[i];
    if (Math.abs(a) < 1e-12) {
      if (s < o || s > l) return null;
      continue;
    }
    const c = 1 / a;
    let h = (o - s) * c, p = (l - s) * c;
    if (h > p) {
      const d = h;
      h = p, p = d;
    }
    if (h > n && (n = h), p < r && (r = p), n > r) return null;
  }
  return Number.isFinite(r) ? n : null;
}
function Ws(t, e, n, r, i = !1) {
  const s = n[0] - e[0], a = n[1] - e[1], o = n[2] - e[2], l = r[0] - e[0], c = r[1] - e[1], h = r[2] - e[2], p = t.direction[0], d = t.direction[1], f = t.direction[2], m = d * h - f * c, g = f * l - p * h, b = p * c - d * l, w = s * m + a * g + o * b;
  if (i ? w < 1e-12 : Math.abs(w) < 1e-12) return null;
  const y = 1 / w, S = t.origin[0] - e[0], $ = t.origin[1] - e[1], P = t.origin[2] - e[2], _ = (S * m + $ * g + P * b) * y;
  if (_ < 0 || _ > 1) return null;
  const C = $ * o - P * a, I = P * s - S * o, W = S * a - $ * s, z = (p * C + d * I + f * W) * y;
  if (z < 0 || _ + z > 1) return null;
  const q = (l * C + c * I + h * W) * y;
  return q >= 0 ? q : null;
}
function _u(t, e, n = 1e-6) {
  return Math.abs(t.origin[0] - e.origin[0]) <= n && Math.abs(t.origin[1] - e.origin[1]) <= n && Math.abs(t.origin[2] - e.origin[2]) <= n && Math.abs(t.direction[0] - e.direction[0]) <= n && Math.abs(t.direction[1] - e.direction[1]) <= n && Math.abs(t.direction[2] - e.direction[2]) <= n;
}
function Eu(t) {
  return `ray(origin: ${t.origin[0]}, ${t.origin[1]}, ${t.origin[2]}; direction: ${t.direction[0]}, ${t.direction[1]}, ${t.direction[2]})`;
}
function Cu(t) {
  return Number.isFinite(t.origin[0]) && Number.isFinite(t.origin[1]) && Number.isFinite(t.origin[2]) && Number.isFinite(t.direction[0]) && Number.isFinite(t.direction[1]) && Number.isFinite(t.direction[2]) && ss(t.direction) > 1e-24;
}
const Ib = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  applyMat4: Au,
  at: pr,
  clone: Su,
  closestPointToPoint: Is,
  copy: Tu,
  create: xu,
  distanceToPoint: Pu,
  equals: _u,
  intersectBox: Ns,
  intersectPlane: Vs,
  intersectSphere: ks,
  intersectTriangle: Ws,
  isWellFormed: Cu,
  recast: $u,
  set: sn,
  squaredDistanceToPoint: Us,
  toString: Eu
}, Symbol.toStringTag, { value: "Module" })), Lu = {
  Left: 0,
  Right: 1,
  Bottom: 2,
  Top: 3,
  Near: 4,
  Far: 5
};
function fr() {
  return {
    planes: [
      Ae(),
      Ae(),
      Ae(),
      Ae(),
      Ae(),
      Ae()
    ]
  };
}
function Mu(t) {
  const e = fr();
  return zs(e, t);
}
function zs(t, e) {
  for (let n = 0; n < 6; n++) ur(t.planes[n], e.planes[n]);
  return t;
}
function qs(t, e, n = "gl") {
  const r = [e[0], e[4], e[8], e[12]], i = [e[1], e[5], e[9], e[13]], s = [e[2], e[6], e[10], e[14]], a = [e[3], e[7], e[11], e[15]], o = (c, h, p) => [
    c[0] + p * h[0],
    c[1] + p * h[1],
    c[2] + p * h[2],
    c[3] + p * h[3]
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
    const [h, p, d, f] = l[c];
    Ms(t.planes[c], h, p, d, f), Rs(t.planes[c], t.planes[c]);
  }
  return t;
}
function Ru(t, e) {
  for (const n of t.planes)
    if (pe(n, e) < 0) return !1;
  return !0;
}
function js(t, e, n) {
  for (const r of t.planes)
    if (pe(r, e) < -n) return !1;
  return !0;
}
function Fu(t, e) {
  for (const n of t.planes) {
    const r = n.normal[0], i = n.normal[1], s = n.normal[2], a = r >= 0 ? e.max[0] : e.min[0], o = i >= 0 ? e.max[1] : e.min[1], l = s >= 0 ? e.max[2] : e.min[2];
    if (r * a + i * o + s * l + n.constant < 0) return !1;
  }
  return !0;
}
function Bu(t, e) {
  const n = Gu(t);
  if (!n) return !0;
  let r = !1, i = !1;
  for (const s of n) {
    const a = pe(e, s);
    if (a > 0 ? r = !0 : a < 0 && (i = !0), r && i) return !0;
  }
  return !1;
}
function Gu(t) {
  const [e, n, r, i, s, a] = t.planes, o = [];
  for (const l of [s, a])
    for (const c of [r, i])
      for (const h of [e, n]) {
        const p = Ou(h, c, l);
        if (!p) return null;
        o.push(p);
      }
  return o;
}
function Ou(t, e, n) {
  const r = t.normal[0], i = t.normal[1], s = t.normal[2], a = e.normal[0], o = e.normal[1], l = e.normal[2], c = n.normal[0], h = n.normal[1], p = n.normal[2], d = r * (o * p - l * h) - i * (a * p - l * c) + s * (a * h - o * c);
  if (Math.abs(d) < 1e-12) return null;
  const f = 1 / d, m = -t.constant, g = -e.constant, b = -n.constant;
  return new Float32Array([
    (m * (o * p - l * h) - i * (g * p - l * b) + s * (g * h - o * b)) * f,
    (r * (g * p - l * b) - m * (a * p - l * c) + s * (a * b - g * c)) * f,
    (r * (o * b - g * h) - i * (a * b - g * c) + m * (a * h - o * c)) * f
  ]);
}
function Iu(t, e, n = 1e-6) {
  for (let r = 0; r < 6; r++)
    if (!Bs(t.planes[r], e.planes[r], n)) return !1;
  return !0;
}
const Ub = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FRUSTUM_PLANE: Lu,
  clone: Mu,
  containsPoint: Ru,
  copy: zs,
  create: fr,
  equals: Iu,
  intersectsBox: Fu,
  intersectsPlane: Bu,
  intersectsSphere: js,
  setFromProjectionView: qs
}, Symbol.toStringTag, { value: "Module" })), Uu = {
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
function Du(t = 0, e = 0, n = 0, r = 1) {
  return { r: t, g: e, b: n, a: r };
}
function Vu(t) {
  return { r: t.r, g: t.g, b: t.b, a: t.a };
}
function ku(t, e) {
  return t.r = e.r, t.g = e.g, t.b = e.b, t.a = e.a, t;
}
function Nu(t, e, n, r, i = 1) {
  return t.r = e, t.g = n, t.b = r, t.a = i, t;
}
function Wu(t, e, n, r) {
  return t.r = e, t.g = n, t.b = r, t;
}
function zu(t, e, n) {
  const r = Math.trunc(e);
  return t.r = (r >> 16 & 255) / 255, t.g = (r >> 8 & 255) / 255, t.b = (r & 255) / 255, n !== void 0 && (t.a = n), t;
}
function qu(t) {
  const e = (n) => Math.round(Math.min(Math.max(n, 0), 1) * 255);
  return e(t.r) << 16 | e(t.g) << 8 | e(t.b);
}
function ju(t, e) {
  const n = e.trim().toLowerCase(), r = Uu[n];
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
function Qu(t, e = !1) {
  const n = (s) => Math.round(Math.min(Math.max(s, 0), 1) * 255), r = (s) => s.toString(16).padStart(2, "0"), i = `#${r(n(t.r))}${r(n(t.g))}${r(n(t.b))}`;
  return e ? `${i}${r(n(t.a))}` : i;
}
function Xu(t, e) {
  return t.r = Math.min(Math.max(e.r, 0), 1), t.g = Math.min(Math.max(e.g, 0), 1), t.b = Math.min(Math.max(e.b, 0), 1), t.a = Math.min(Math.max(e.a, 0), 1), t;
}
function Yu(t, e, n, r) {
  return t.r = e.r + (n.r - e.r) * r, t.g = e.g + (n.g - e.g) * r, t.b = e.b + (n.b - e.b) * r, t.a = e.a + (n.a - e.a) * r, t;
}
function Hu(t, e, n) {
  return t.r = e.r + n.r, t.g = e.g + n.g, t.b = e.b + n.b, t.a = e.a + n.a, t;
}
function Zu(t, e, n) {
  return t.r = e.r * n.r, t.g = e.g * n.g, t.b = e.b * n.b, t.a = e.a * n.a, t;
}
function Ku(t, e, n, r, i = t.a) {
  const s = (e % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), a = Math.min(Math.max(n, 0), 1), o = Math.min(Math.max(r, 0), 1);
  if (a === 0)
    return t.r = o, t.g = o, t.b = o, t.a = i, t;
  const l = o < 0.5 ? o * (1 + a) : o + a - o * a, c = 2 * o - l, h = (d) => {
    let f = d;
    return f < 0 && (f += 1), f > 1 && (f -= 1), f < 1 / 6 ? c + (l - c) * 6 * f : f < 1 / 2 ? l : f < 2 / 3 ? c + (l - c) * (2 / 3 - f) * 6 : c;
  }, p = s / (Math.PI * 2);
  return t.r = h(p + 1 / 3), t.g = h(p), t.b = h(p - 1 / 3), t.a = i, t;
}
function Ju(t, e) {
  const n = Math.max(e.r, e.g, e.b), r = Math.min(e.r, e.g, e.b), i = (r + n) / 2, s = n - r;
  if (s === 0)
    return t[0] = 0, t[1] = 0, t[2] = i, t;
  const a = i <= 0.5 ? s / (n + r) : s / (2 - n - r);
  let o;
  return n === e.r ? o = (e.g - e.b) / s + (e.g < e.b ? 6 : 0) : n === e.g ? o = (e.b - e.r) / s + 2 : o = (e.r - e.g) / s + 4, t[0] = o / 6 * Math.PI * 2, t[1] = a, t[2] = i, t;
}
function eh(t, e, n = !0) {
  const r = e ?? new Float32Array(n ? 4 : 3);
  return r[0] = t.r, r[1] = t.g, r[2] = t.b, n && r.length >= 4 && (r[3] = t.a), r;
}
function th(t, e, n = 0) {
  return t.r = e[n] ?? 0, t.g = e[n + 1] ?? 0, t.b = e[n + 2] ?? 0, e.length > n + 3 && (t.a = e[n + 3]), t;
}
function nh(t, e) {
  const n = (r) => r < 0.04045 ? r * 0.0773993808 : Math.pow(r * 0.9478672986 + 0.0521327014, 2.4);
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function rh(t, e) {
  const n = (r) => r <= 31308e-7 ? r * 12.92 : 1.055 * Math.pow(r, 0.41666) - 0.055;
  return t.r = n(e.r), t.g = n(e.g), t.b = n(e.b), t.a = e.a, t;
}
function ih(t, e = 1e-6) {
  return t.r >= -e && t.r <= 1 + e && t.g >= -e && t.g <= 1 + e && t.b >= -e && t.b <= 1 + e;
}
function sh(t, e, n = 1e-6) {
  return Math.abs(t.r - e.r) <= n && Math.abs(t.g - e.g) <= n && Math.abs(t.b - e.b) <= n && Math.abs(t.a - e.a) <= n;
}
function ah(t) {
  return `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
}
const Db = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Hu,
  clampColor: Xu,
  clone: Vu,
  convertLinearToSRGB: rh,
  convertSRGBToLinear: nh,
  copy: ku,
  create: Du,
  equals: sh,
  fromArray: th,
  getHSL: Ju,
  getHex: qu,
  getStyle: Qu,
  isInGamut: ih,
  lerp: Yu,
  multiply: Zu,
  set: Nu,
  setHSL: Ku,
  setHex: zu,
  setRGB: Wu,
  setStyle: ju,
  toArray: eh,
  toString: ah
}, Symbol.toStringTag, { value: "Module" })), oh = new Float32Array(16), Lr = new Float32Array(16), lh = { origin: new Float32Array(3), direction: new Float32Array(3) }, _e = new Float32Array(3), qt = new Float32Array(3), Mr = new Float32Array(3), Rr = new Float32Array(3), Qs = new Float32Array(3);
function ch(t = 0, e = 0, n = 0, r = -1) {
  return {
    ray: { origin: new Float32Array([t, e, n]), direction: new Float32Array([0, 0, r]) },
    near: 0,
    far: Number.POSITIVE_INFINITY,
    doubleSided: !0
  };
}
function uh(t) {
  return {
    ray: { origin: new Float32Array(t.ray.origin), direction: new Float32Array(t.ray.direction) },
    near: t.near,
    far: t.far,
    doubleSided: t.doubleSided
  };
}
function hh(t, e) {
  return sn(t.ray, e.ray.origin, e.ray.direction), t.near = e.near, t.far = e.far, t.doubleSided = e.doubleSided, t;
}
function mr(t, e, n) {
  return sn(t.ray, e, n), t;
}
function dh(t, e, n) {
  return mr(t, e, de(Qs, n, e));
}
function ph(t, e, n, r, i = "gl") {
  const s = i === "zo" ? 0 : -1, a = 1;
  return jt(_e, e, n, s, r), jt(qt, e, n, a, r), mr(t, _e, de(Qs, qt, _e));
}
function jt(t, e, n, r, i) {
  const s = i[3] * e + i[7] * n + i[11] * r + i[15], a = s === 0 ? 1 : 1 / s;
  return t[0] = (i[0] * e + i[4] * n + i[8] * r + i[12]) * a, t[1] = (i[1] * e + i[5] * n + i[9] * r + i[13]) * a, t[2] = (i[2] * e + i[6] * n + i[10] * r + i[14]) * a, t;
}
function fh(t, e, n) {
  const r = ks(t.ray, e, n);
  return r !== null && an(t, r) ? r : null;
}
function mh(t, e) {
  const n = Ns(t.ray, e);
  return n !== null && an(t, n) ? n : null;
}
function gh(t, e) {
  const n = Vs(t.ray, e);
  return n !== null && an(t, n) ? n : null;
}
function an(t, e) {
  return e >= t.near && e <= t.far;
}
function Xs(t, e, n, r, i = []) {
  i.length = 0;
  const s = r ? wh(lh, t.ray, r) : t.ray;
  if (!s) return i;
  const a = Math.floor(e.length / 3), o = Math.floor(n ? n.length / 3 : a / 3), l = !t.doubleSided;
  for (let c = 0; c < o; c++) {
    const h = n ? n[c * 3] ?? 0 : c * 3, p = n ? n[c * 3 + 1] ?? 0 : c * 3 + 1, d = n ? n[c * 3 + 2] ?? 0 : c * 3 + 2;
    if (h >= a || p >= a || d >= a) continue;
    fn(qt, e, h), fn(Mr, e, p), fn(Rr, e, d);
    const f = Ws(s, qt, Mr, Rr, l);
    if (f === null) continue;
    pr(_e, s, f);
    const m = new Float32Array([_e[0], _e[1], _e[2]]);
    r && jt(m, m[0], m[1], m[2], r);
    const g = as(t.ray.origin, m);
    an(t, g) && i.push({ distance: g, point: m, triangleIndex: c, vertexIndices: [h, p, d] });
  }
  return i.sort((c, h) => c.distance - h.distance), i;
}
function bh(t, e, n, r) {
  const i = Xs(t, e, n, r, []);
  return i.length > 0 ? i[0] : null;
}
function wh(t, e, n) {
  const r = tn(oh, n);
  if (!r) return null;
  const i = jt(
    new Float32Array(3),
    e.origin[0],
    e.origin[1],
    e.origin[2],
    r
  ), s = yh(new Float32Array(3), e.direction, r);
  return sn(t, i, s);
}
function yh(t, e, n) {
  const r = e[0], i = e[1], s = e[2];
  return t[0] = n[0] * r + n[4] * i + n[8] * s, t[1] = n[1] * r + n[5] * i + n[9] * s, t[2] = n[2] * r + n[6] * i + n[10] * s, Kn(t, t);
}
function fn(t, e, n) {
  return t[0] = e[n * 3] ?? 0, t[1] = e[n * 3 + 1] ?? 0, t[2] = e[n * 3 + 2] ?? 0, t;
}
function vh(t, e) {
  return tn(t, e);
}
function xh(t, e, n) {
  return K(Lr, e, n), tn(t, Lr);
}
const Vb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clone: uh,
  copy: hh,
  create: ch,
  intersectBox: mh,
  intersectPlane: gh,
  intersectSphere: fh,
  intersectTriangles: Xs,
  intersectTrianglesFirst: bh,
  inverseProjectionView: vh,
  inverseProjectionViewOf: xh,
  set: mr,
  setFromNdc: ph,
  setFromPoints: dh
}, Symbol.toStringTag, { value: "Module" })), kb = 1e-6, Sh = Math.PI / 180, Th = 180 / Math.PI;
function Ys(t) {
  return t * Sh;
}
function Nb(t) {
  return t * Th;
}
function Ne(t, e, n) {
  return t < e ? e : t > n ? n : t;
}
function $h(t, e, n) {
  return e === t ? 0 : Ne((n - t) / (e - t), 0, 1);
}
function Wb(t, e, n) {
  return t + (e - t) * n;
}
function zb(t, e, n) {
  const r = $h(t, e, n);
  return r * r * (3 - 2 * r);
}
function qb(t, e) {
  return Number.isNaN(t) || Number.isNaN(e) ? Number.NaN : t === e ? t : t === 0 ? e > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE : t + (e > t ? 1 : -1) * Math.abs(t) * Number.EPSILON;
}
function Hs(t) {
  return t === "webgl2" ? "glsl" : "wgsl";
}
function Zs(t) {
  return t === 1 ? "vs" : t === 2 ? "fs" : t === 4 ? "cs" : null;
}
function Ph(t, e, n) {
  if (e === "wgsl") return t.wgsl;
  const r = Zs(n);
  return r ? t[r] : void 0;
}
function Ah(t) {
  const e = [];
  return t.vs && e.push("vs（GLSL）"), t.fs && e.push("fs（GLSL）"), t.cs && e.push("cs（GLSL）"), t.wgsl && e.push("wgsl"), e.length > 0 ? e.join("、") : "空";
}
function _h(t, e, n, r) {
  const i = e === 1 ? "vertex" : e === 2 ? "fragment" : "compute", a = Hs(t) === "glsl" ? `请在 \`code\` 里提供 \`${Zs(e) ?? "vs/fs/cs"}\`（GLSL ES 3.00）` : "请在 `code` 里提供 `wgsl`（单个包含所有 entry point 的 WGSL 源码）", o = t === "webgl2" ? "WebGPU" : "WebGL2";
  return `[gpu-device-api] ShaderModule「${r}」缺少 ${t} 后端需要的 ${i} 阶段源码。
  ${a}；
  当前提供的源码：${Ah(n)}。
  （${o} 后端使用的语言与之不同，不能互相替代。）`;
}
const Ks = `#version 300 es
`, Js = `precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
`, jb = Ks + Js;
function ea(t) {
  const e = t?.preamble ?? !0, n = e === !0 ? Js : e === !1 || e === "" ? !1 : e;
  return { version: t?.version ?? !0, preamble: n };
}
const Eh = /^\s*#version[^\n]*\n?/, Ch = /^(\s*#version[^\n]*\n?)([\s\S]*)$/;
function Lh(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `#define ${e} ${n ? 1 : 0}` : `#define ${e} ${n}`).join(`
`) : "";
}
function Mh(t) {
  return t ? Object.entries(t).map(([e, n]) => typeof n == "boolean" ? `const ${e}: bool = ${n};` : typeof n == "number" ? Number.isInteger(n) ? `const ${e}: i32 = ${n};` : `const ${e}: f32 = ${n};` : `const ${e}: f32 = ${n};`).join(`
`) : "";
}
function Rh(t, e, n = "shader", r) {
  const { version: i, preamble: s } = ea(r), a = Lh(e);
  if (!i && !s && !a) return t;
  let o = "", l = t;
  if (i) {
    const h = /^\s*#version\s+([^\n]*)/.exec(t);
    if (h) {
      const p = h[1].trim();
      if (!/^300\s+es\b/.test(p))
        throw new u(
          `[gpu-device-api] ShaderModule「${n}」声明了 \`#version ${p}\`，但 WebGL2 后端只接受 GLSL ES 3.00（\`#version 300 es\`）。请删掉 \`#version\` 行，或改为 \`#version 300 es\`。
（要自己掌控 \`#version\`，可以在 createShaderModule 里传 \`glsl: { version: false }\`。）`
        );
    }
    o = Ks, l = t.replace(Eh, "");
  } else {
    const h = Ch.exec(t);
    h && (o = h[1], l = h[2]);
  }
  const c = [o];
  return s && c.push(s), a && c.push(`${a}
`), c.push(l.trim()), `${c.join("")}
`;
}
function Fh(t, e) {
  const n = Mh(e);
  return n ? `${n}

${t.trim()}
` : `${t.trim()}
`;
}
function ct(t) {
  const { backend: e, source: n, stage: r, label: i = "shader" } = t, s = Hs(e), a = Ph(n, s, r);
  if (a === void 0)
    throw new u(_h(e, r, n, i));
  return s === "glsl" ? {
    language: s,
    stage: r,
    code: Rh(a, t.defines, i, t.glsl),
    hasPreamble: ea(t.glsl).preamble !== !1
  } : {
    language: s,
    stage: r,
    code: Fh(a, t.defines),
    hasPreamble: !1
  };
}
function Qb(t, e, n) {
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
${kn(r)}
`;
  const l = [];
  for (const c of [...s].sort((h, p) => h - p)) {
    l.push(`----- 第 ${c} 行附近 -----`);
    const h = Math.max(1, c - 3), p = Math.min(r.length, c + 3);
    l.push(kn(r.slice(h - 1, p), h));
  }
  return `${i}
${l.join(`
`)}
`;
}
function kn(t, e = 1) {
  const n = String(e + t.length - 1).length;
  return t.map((r, i) => `${String(e + i).padStart(n, " ")} | ${r}`).join(`
`);
}
function Xb(t) {
  return kn(t.split(`
`));
}
const fe = /* @__PURE__ */ new Map();
function Bh(t, e) {
  if (fe.has(t))
    throw new u(
      `[gpu-device-api] 着色器 key「${t}」已经注册过了。如需替换请先调用 unregisterShader('${t}')。`
    );
  return fe.set(t, e), e;
}
function Yb(t) {
  for (const [e, n] of Object.entries(t)) Bh(e, n);
}
function Hb(t, e) {
  return fe.set(t, e), e;
}
function Zb(t) {
  return fe.has(t);
}
function Kb(t) {
  return fe.get(t);
}
function Jb(t) {
  const e = fe.get(t);
  if (!e) {
    const n = Gh();
    throw new u(
      `[gpu-device-api] 找不到 key 为「${t}」的着色器。` + (n.length > 0 ? `已注册：${n.join("、")}。` : "当前注册表为空。")
    );
  }
  return e;
}
function ew(t) {
  return fe.delete(t);
}
function Gh() {
  return [...fe.keys()].sort();
}
function tw() {
  fe.clear();
}
function ta(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}
const Oh = String.raw`@group\s*\(\s*(\d+)\s*\)\s*@binding\s*\(\s*(\d+)\s*\)`, Ih = String.raw`@binding\s*\(\s*(\d+)\s*\)\s*@group\s*\(\s*(\d+)\s*\)`, Fr = String.raw`var\s*(?:<\s*([^>]*)>)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);`;
function nw(t) {
  const e = ta(t), n = [], r = [
    { regex: new RegExp(`${Oh}\\s*${Fr}`, "g"), swapped: !1 },
    { regex: new RegExp(`${Ih}\\s*${Fr}`, "g"), swapped: !0 }
  ];
  for (const { regex: i, swapped: s } of r) {
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const o = Number(a[s ? 2 : 1]), l = Number(a[s ? 1 : 2]), c = (a[3] ?? "").trim(), h = a[4], p = a[5].trim().replace(/\s+/g, " ");
      n.some((d) => d.group === o && d.binding === l) || n.push(Uh(o, l, c, h, p));
    }
  }
  return n.sort((i, s) => i.group - s.group || i.binding - s.binding);
}
function Uh(t, e, n, r, i) {
  let s = "handle", a;
  if (n.startsWith("uniform"))
    s = "uniform";
  else if (n.startsWith("storage")) {
    s = "storage";
    const c = n.split(",").map((h) => h.trim())[1];
    c === "read" ? a = "read" : c === "read_write" ? a = "read_write" : c === "write" && (a = "write");
  }
  const o = Dh(s, i);
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
function Dh(t, e) {
  return t === "uniform" ? "uniform-buffer" : t === "storage" ? "storage-buffer" : e.startsWith("texture_storage_") ? "storage-texture" : e.startsWith("sampler_comparison") ? "comparison-sampler" : e.startsWith("sampler") ? "sampler" : (e.startsWith("texture_"), "texture");
}
const Br = /@(vertex|fragment|compute)\b([\s\S]{0,200}?)\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, Vh = /@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?(?:,\s*(\d+)\s*)?\)/;
function kh(t) {
  const e = ta(t), n = [];
  let r;
  for (Br.lastIndex = 0; (r = Br.exec(e)) !== null; ) {
    const i = r[1], s = r[2] ?? "", a = r[3];
    let o = null;
    if (i === "compute") {
      const l = Vh.exec(s);
      o = l ? [Number(l[1]), Number(l[2] ?? 1), Number(l[3] ?? 1)] : [1, 1, 1];
    }
    n.push({ stage: i, name: a, workgroupSize: o });
  }
  return n;
}
function rw(t, e, n) {
  return kh(t).find((r) => r.stage === e && r.name === n);
}
function iw(t) {
  return new Set(t.map((e) => `${e.group}:${e.binding}`));
}
const Nh = {
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
function Wh(t) {
  return Nh[t] ?? `0x${t.toString(16)}`;
}
const zh = [
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
function na(t) {
  return zh.includes(t);
}
function Gr(t, e) {
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
function qh(t) {
  return t.uniforms.filter((e) => na(e.glType));
}
function jh(t, e) {
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
  const r = qh(t).sort((i, s) => i.name.localeCompare(s.name));
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
class Qh {
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
const Te = Object.freeze({
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
function U(t, e, n) {
  const r = t.getParameter(e);
  return typeof r == "number" && r > 0 ? r : n;
}
const Xh = 16777215;
function Yh(t) {
  return {
    maxTextureSize: U(t, 3379, 2048),
    max3dTextureSize: U(t, 32883, 256),
    maxArrayTextureLayers: U(t, 35071, 256),
    maxSamples: U(t, 36183, 4),
    maxUniformBufferBindings: U(t, 35375, 12),
    maxUniformBlockSize: U(t, 35376, 16384),
    maxUniformBufferOffsetAlignment: U(t, 35380, 256),
    maxVertexAttribs: U(t, 34921, 16),
    maxVertexUniformVectors: U(t, 36347, 128),
    maxFragmentUniformVectors: U(t, 36349, 128),
    maxVaryingVectors: U(t, 36348, 8),
    maxTextureImageUnits: U(t, 34930, 16),
    maxCombinedTextureImageUnits: U(t, 35661, 32),
    maxCubeMapTextureSize: U(t, 34076, 2048),
    maxRenderbufferSize: U(t, 34024, 2048),
    maxElementIndex: Xh,
    maxElementsVertices: U(t, 33001, 2147483647),
    maxElementsIndices: U(t, 33e3, 2147483647)
  };
}
function Hh(t) {
  const e = Yh(t);
  return {
    // WebGL2 没有 1D 纹理，用 2D 上限代替，上层代码读到的是一个安全的正数。
    maxTextureDimension1D: e.maxTextureSize,
    maxTextureDimension2D: e.maxTextureSize,
    maxTextureDimension3D: e.max3dTextureSize,
    maxTextureArrayLayers: e.maxArrayTextureLayers,
    maxBindGroups: Te.maxBindGroups,
    maxBindGroupsPlusVertexBuffers: Te.maxBindGroupsPlusVertexBuffers,
    maxBindingsPerBindGroup: Te.maxBindingsPerBindGroup,
    maxDynamicUniformBuffersPerPipelineLayout: Math.min(
      Te.maxDynamicUniformBuffersPerPipelineLayout,
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
    minStorageBufferOffsetAlignment: Te.minStorageBufferOffsetAlignment,
    maxVertexBuffers: Math.min(Te.maxVertexBuffers, e.maxVertexAttribs),
    maxBufferSize: 2147483647,
    maxVertexAttributes: e.maxVertexAttribs,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: e.maxVaryingVectors,
    maxColorAttachments: 4,
    maxColorAttachmentBytesPerSample: Te.maxColorAttachmentBytesPerSample,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}
function Zh(t) {
  const e = /* @__PURE__ */ new Set();
  return t.getExtension("EXT_texture_filter_anisotropic") && e.add("texture-anisotropy"), t.getExtension("OES_texture_float_linear") && e.add("texture-float32-filterable"), t.getExtension("EXT_color_buffer_float") && e.add("color-buffer-float"), t.getExtension("WEBGL_debug_renderer_info") && e.add("debug-renderer-info"), t.getExtension("EXT_disjoint_timer_query_webgl2") && e.add("timestamp-query"), e;
}
function Kh(t) {
  const e = t.getExtension("WEBGL_debug_renderer_info");
  if (!e) return { vendor: "", device: "" };
  const n = t.getParameter(e.UNMASKED_VENDOR_WEBGL) ?? "", r = t.getParameter(e.UNMASKED_RENDERER_WEBGL) ?? "";
  return { vendor: n, device: r };
}
function Jh(t) {
  const e = t.getExtension("EXT_texture_filter_anisotropic");
  return e ? t.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) ?? 1 : 1;
}
function ed(t, e) {
  const n = t.getContext("webgl2", e);
  if (!n)
    throw new u(
      "[gpu-device-api] 无法创建 WebGL2 context。常见原因：浏览器不支持 WebGL2、该 canvas 已经用别的 context 类型初始化过（一个 canvas 只能绑定一种 context）、或上下文数量已达上限。"
    );
  return n;
}
class td {
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
    const l = e ? `1:${n}:${r}:${i}:${s}:${a}:${o}` : "0";
    if (this.blendSignature === l) return;
    const c = this.gl;
    e ? (c.enable(c.BLEND), c.blendFuncSeparate(n, r, s, a), c.blendEquationSeparate(i, o)) : c.disable(c.BLEND), this.blendSignature = l;
  }
  setBlendConstant(e) {
    mn(this.blendConstant, e) || (this.gl.blendColor(e[0], e[1], e[2], e[3]), this.blendConstant = [e[0], e[1], e[2], e[3]]);
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
    nd(this.depthBias, a) || (a[0] !== 0 || a[1] !== 0 || a[2] !== 0 ? (s.enable(s.POLYGON_OFFSET_FILL), s.polygonOffset(a[0], a[1])) : s.disable(s.POLYGON_OFFSET_FILL), this.depthBias = [a[0], a[1], a[2]]);
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
    mn(this.viewport, [e, n, r, i]) || (this.gl.viewport(e, n, r, i), this.viewport = [e, n, r, i]);
  }
  setScissor(e, n, r, i, s) {
    const a = this.gl;
    this.scissorEnabled !== e && (e ? a.enable(a.SCISSOR_TEST) : a.disable(a.SCISSOR_TEST), this.scissorEnabled = e), e && !mn(this.scissor, [n, r, i, s]) && (a.scissor(n, r, i, s), this.scissor = [n, r, i, s]);
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
function mn(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] : !1;
}
function nd(t, e) {
  return t ? t[0] === e[0] && t[1] === e[1] && t[2] === e[2] : !1;
}
const rd = [
  {
    flag: F.Storage,
    name: "Storage",
    reason: "shader storage buffer 需要 GLES 3.1，WebGL2 只有 GLES 3.0。请改用 uniform buffer 传数据。"
  },
  {
    flag: F.Indirect,
    name: "Indirect",
    reason: "WebGL2 没有 indirect draw。请改用一次性的 uniform 数据 + 普通 draw 调用。"
  },
  {
    flag: F.QueryResolve,
    name: "QueryResolve",
    reason: "WebGL2 的遮挡查询结果只能同步读回，没有查询结果缓冲区的概念。"
  }
];
class id {
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
    for (const a of rd)
      if (r.usage & a.flag)
        throw new u(
          `[gpu-device-api] BufferUsage.${a.name} 在 WebGL2 后端不可用：${a.reason}`
        );
    this.gl = e, this.state = n, this.onDestroy = i, this.label = r.label ?? O("buffer"), this.id = O("buf"), this.size = r.size, this.usage = r.usage, this.usages = r.usage, this.bindingTarget = r.usage & F.Index ? e.ELEMENT_ARRAY_BUFFER : e.COPY_WRITE_BUFFER;
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
    if (Ee(n, "mapAsync 的 offset"), Ye(r, "mapAsync 的 size"), n % 4 !== 0)
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
const St = 6403, Tt = 33319, sd = 6407, Be = 6408, Ge = 36244, Oe = 33320, Ie = 36249, gn = 6402, ad = 34041, $e = 5121, Ue = 5120, $t = 5123, bn = 5122, Je = 5125, wn = 5124, Pt = 5126, yn = 5131, od = 33640, ld = 34042, cd = 33321, ud = 36756, hd = 33330, dd = 33329, pd = 33332, fd = 33331, md = 33325, gd = 33323, bd = 36757, wd = 33336, yd = 33335, vd = 33334, xd = 33333, Sd = 33326, Td = 33338, $d = 33337, Pd = 33327, Ad = 32856, _d = 35907, Ed = 36759, Cd = 36220, Ld = 36222, Md = 32857, Rd = 35898, Fd = 33340, Bd = 33339, Gd = 33328, Od = 36214, Id = 36216, Ud = 34842, Dd = 36208, Vd = 36226, kd = 34836, Nd = 33189, Wd = 33190, zd = 35056, qd = 36012;
function T(t, e, n, r, i = {}) {
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
const jd = Object.freeze({
  r8unorm: T(cd, St, $e, 1, { uploadType: "Uint8Array" }),
  r8snorm: T(ud, St, Ue, 1, { attachment: !1, uploadType: "Int8Array" }),
  r8uint: T(hd, Ge, $e, 1, { sampleType: "uint", uploadType: "Uint8Array" }),
  r8sint: T(dd, Ge, Ue, 1, { sampleType: "sint", uploadType: "Int8Array" }),
  r16uint: T(pd, Ge, $t, 2, { sampleType: "uint", uploadType: "Uint16Array" }),
  r16sint: T(fd, Ge, bn, 2, { sampleType: "sint", uploadType: "Int16Array" }),
  r16float: T(md, St, yn, 2, { uploadType: "Uint16Array" }),
  rg8unorm: T(gd, Tt, $e, 2, { uploadType: "Uint8Array" }),
  rg8snorm: T(bd, Tt, Ue, 2, { attachment: !1, uploadType: "Int8Array" }),
  rg8uint: T(wd, Oe, $e, 2, { sampleType: "uint", uploadType: "Uint8Array" }),
  rg8sint: T(yd, Oe, Ue, 2, { sampleType: "sint", uploadType: "Int8Array" }),
  r32uint: T(vd, Ge, Je, 4, { sampleType: "uint", uploadType: "Uint32Array" }),
  r32sint: T(xd, Ge, wn, 4, { sampleType: "sint", uploadType: "Int32Array" }),
  r32float: T(Sd, St, Pt, 4, { attachment: !1, uploadType: "Float32Array" }),
  rg16uint: T(Td, Oe, $t, 4, { sampleType: "uint", uploadType: "Uint16Array" }),
  rg16sint: T($d, Oe, bn, 4, { sampleType: "sint", uploadType: "Int16Array" }),
  rg16float: T(Pd, Tt, yn, 4, { uploadType: "Uint16Array" }),
  rgba8unorm: T(Ad, Be, $e, 4, { uploadType: "Uint8Array" }),
  "rgba8unorm-srgb": T(_d, Be, $e, 4, { uploadType: "Uint8Array" }),
  rgba8snorm: T(Ed, Be, Ue, 4, { attachment: !1, uploadType: "Int8Array" }),
  rgba8uint: T(Cd, Ie, $e, 4, { sampleType: "uint", uploadType: "Uint8Array" }),
  rgba8sint: T(Ld, Ie, Ue, 4, { sampleType: "sint", uploadType: "Int8Array" }),
  rgb10a2unorm: T(Md, Be, od, 4, { uploadType: "Uint32Array" }),
  rg11b10ufloat: T(Rd, sd, Je, 4, { attachment: !1, uploadType: null }),
  rg32uint: T(Fd, Oe, Je, 8, { sampleType: "uint", uploadType: "Uint32Array" }),
  rg32sint: T(Bd, Oe, wn, 8, { sampleType: "sint", uploadType: "Int32Array" }),
  rg32float: T(Gd, Tt, Pt, 8, { attachment: !1, uploadType: "Float32Array" }),
  rgba16uint: T(Od, Ie, $t, 8, { sampleType: "uint", uploadType: "Uint16Array" }),
  rgba16sint: T(Id, Ie, bn, 8, { sampleType: "sint", uploadType: "Int16Array" }),
  rgba16float: T(Ud, Be, yn, 8, { uploadType: "Uint16Array" }),
  rgba32uint: T(Dd, Ie, Je, 16, { sampleType: "uint", uploadType: "Uint32Array" }),
  rgba32sint: T(Vd, Ie, wn, 16, { sampleType: "sint", uploadType: "Int32Array" }),
  rgba32float: T(kd, Be, Pt, 16, { uploadType: "Float32Array" }),
  depth16unorm: T(Nd, gn, $t, 2, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint16Array"
  }),
  depth24plus: T(Wd, gn, Je, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Uint32Array"
  }),
  "depth24plus-stencil8": T(zd, ad, ld, 4, {
    depth: !0,
    stencil: !0,
    sampleType: "depth",
    uploadType: null
  }),
  depth32float: T(qd, gn, Pt, 4, {
    depth: !0,
    sampleType: "depth",
    uploadType: "Float32Array"
  })
}), Qd = Object.freeze({
  bgra8unorm: "WebGL2 没有 bgra8unorm 纹理格式（BGRA 只是默认帧缓冲的隐含排布）。请改用 rgba8unorm。",
  "bgra8unorm-srgb": "WebGL2 没有 bgra8unorm-srgb 纹理格式。请改用 rgba8unorm-srgb。",
  rgb9e5ufloat: "WebGL2 不支持 rgb9e5ufloat（无法作为纹理存储格式，也不能从主机上传）。请改用 rg11b10ufloat 或 rgba16float。",
  stencil8: "WebGL2 的 STENCIL_INDEX8 只能用作 renderbuffer，不能作为纹理格式。请改用 depth24plus-stencil8。"
});
function B(t) {
  const e = Qd[t];
  if (e)
    throw new u(`[gpu-device-api] 纹理格式「${t}」在 WebGL2 后端不可用：${e}`);
  const n = jd[t];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识纹理格式「${t}」。`);
  return n;
}
function Xd(t) {
  return B(t).attachment;
}
function Yd(t, e) {
  const n = B(t);
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
class ra {
  label;
  texture;
  descriptor;
  _disposed = !1;
  constructor(e, n) {
    const r = Vt(e, n);
    if (r.baseMipLevel + r.mipLevelCount > e.mipLevelCount)
      throw new u(
        `[gpu-device-api] texture view 的 mip 范围 [${r.baseMipLevel}, ${r.baseMipLevel + r.mipLevelCount}) 超出了纹理「${e.label}」的 ${e.mipLevelCount} 层。`
      );
    if (r.baseArrayLayer + r.arrayLayerCount > e.depthOrArrayLayers)
      throw new u(
        `[gpu-device-api] texture view 的层范围 [${r.baseArrayLayer}, ${r.baseArrayLayer + r.arrayLayerCount}) 超出了纹理「${e.label}」的 ${e.depthOrArrayLayers} 层。`
      );
    this.texture = e, this.descriptor = r, this.label = n.label ?? O("textureView");
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
const Hd = /* @__PURE__ */ new Set(["r32float", "rg32float", "rgba32float"]);
function Zd(t, e) {
  if (t === "1d")
    throw new u(
      "[gpu-device-api] WebGL2 不支持 1D 纹理。请改用高度为 1 的 2D 纹理（`size: { width: n, height: 1 }`）。"
    );
  return t === "3d" ? 32879 : e > 1 ? 35866 : 3553;
}
class Or {
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
    const s = Zt(r.size);
    if (Ye(s.width, "TextureDescriptor.size.width"), s.height <= 0 || s.depthOrArrayLayers <= 0)
      throw new u(
        `[gpu-device-api] 纹理尺寸必须为正数，实际是 ${s.width}x${s.height}x${s.depthOrArrayLayers}。`
      );
    const a = B(r.format), o = r.dimension ?? Ot.D2, l = r.sampleCount ?? 1, c = r.mipLevelCount ?? 1;
    if (l > 1) {
      if (o !== Ot.D2 || s.depthOrArrayLayers > 1)
        throw new u(
          "[gpu-device-api] 多重采样纹理只能是单层 2D 纹理（`dimension: '2d'` 且 `depthOrArrayLayers: 1`）。"
        );
      if (c > 1)
        throw new u("[gpu-device-api] 多重采样纹理不能有 mipmap（`mipLevelCount` 必须为 1）。");
    }
    if (c > 1) {
      const p = Math.floor(Math.log2(Math.max(s.width, s.height))) + 1;
      if (c > p)
        throw new u(
          `[gpu-device-api] mipLevelCount=${c} 超过了 ${s.width}x${s.height} 能容纳的最大层数 ${p}。`
        );
    }
    this.label = r.label ?? O("texture"), this.dimension = o, this.format = r.format, this.usage = r.usage, this.width = s.width, this.height = s.height, this.depthOrArrayLayers = s.depthOrArrayLayers, this.mipLevelCount = c, this.sampleCount = l, this.glTarget = Zd(o, s.depthOrArrayLayers);
    const h = e.createTexture();
    if (!h) throw new u("[gpu-device-api] gl.createTexture() 返回 null，无法分配纹理。");
    this.native = h, e.bindTexture(this.glTarget, h), l > 1 ? e.texStorage2DMultisample(
      this.glTarget,
      l,
      a.internalFormat,
      s.width,
      s.height,
      !1
    ) : o === Ot.D3 ? e.texStorage3D(
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
    const n = new ra(this, e);
    return this.views.push(n), n;
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
    const e = B(this.format);
    if (!e.attachment || e.sampleType !== "float")
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" cannot be used with generateMipmap on WebGL2, which requires a color-renderable and filterable format (integer, snorm and pure depth/stencil formats are none of those). Use rgba8unorm, rgba8unorm-srgb, r8unorm or a float format instead.`
      );
    if (Hd.has(this.format) && !this.gl.getExtension("EXT_color_buffer_float"))
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
    const e = this.gl, n = this.glTarget;
    e.texParameteri(n, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(n, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(n, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(n, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(n, e.TEXTURE_WRAP_R, e.CLAMP_TO_EDGE), e.texParameteri(n, e.TEXTURE_BASE_LEVEL, 0), e.texParameteri(n, e.TEXTURE_MAX_LEVEL, this.mipLevelCount - 1);
  }
}
const Kd = {
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
}, ia = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
}, Jd = {
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
}, At = {
  add: 32774,
  subtract: 32778,
  "reverse-subtract": 32779,
  min: 32775,
  max: 32776
}, Ir = {
  front: 1028,
  back: 1029
}, ep = {
  ccw: 2305,
  cw: 2304
}, vn = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, tp = {
  nearest: 9728,
  linear: 9729
}, np = {
  uint16: 5123,
  // UNSIGNED_SHORT
  uint32: 5125
  // UNSIGNED_INT
}, Ur = 5121, Dr = 5120, Vr = 5123, kr = 5122, rp = 5125, ip = 5124, sp = 5126, ap = 5131, op = {
  float32: { type: sp, normalized: !1, integer: !1 },
  float16: { type: ap, normalized: !1, integer: !1 },
  unorm8: { type: Ur, normalized: !0, integer: !1 },
  snorm8: { type: Dr, normalized: !0, integer: !1 },
  uint8: { type: Ur, normalized: !1, integer: !0 },
  sint8: { type: Dr, normalized: !1, integer: !0 },
  unorm16: { type: Vr, normalized: !0, integer: !1 },
  snorm16: { type: kr, normalized: !0, integer: !1 },
  uint16: { type: Vr, normalized: !1, integer: !0 },
  sint16: { type: kr, normalized: !1, integer: !0 },
  uint32: { type: rp, normalized: !1, integer: !0 },
  sint32: { type: ip, normalized: !1, integer: !0 }
}, lp = /^(float16|float32|unorm8|snorm8|uint8|sint8|unorm16|snorm16|uint16|sint16|uint32|sint32)(?:x([1-4]))?$/;
function cp(t) {
  const e = lp.exec(t);
  if (!e)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  const n = op[e[1]];
  if (!n)
    throw new u(`[gpu-device-api] WebGL2 后端不认识顶点格式「${t}」。`);
  return {
    size: Ce(t).components,
    type: n.type,
    normalized: n.normalized,
    integer: n.integer
  };
}
function Dt(t) {
  if (t === void 0) return [0, 0, 0, 1];
  if (typeof t == "number")
    return [(t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255, 1];
  if (typeof t == "string") return hp(t);
  if (Array.isArray(t) || ArrayBuffer.isView(t)) {
    const n = t;
    return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
  }
  const e = t;
  return [e.r, e.g, e.b, e.a ?? 1];
}
const up = {
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
function hp(t) {
  const e = t.trim().toLowerCase(), n = up[e];
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
const dp = 9728, pp = 9729, fp = 9984, mp = 9985, gp = 9986, bp = 9987, Nr = Number.POSITIVE_INFINITY;
function wp(t, e, n) {
  return n <= 1 ? t === "linear" ? pp : dp : t === "linear" ? e === "linear" ? bp : mp : e === "linear" ? gp : fp;
}
class yp {
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
  mipLevelCount = Nr;
  constructor(e, n, r = {}, i = () => {
  }) {
    this.gl = e, this.state = n, this.onDispose = i, this.descriptor = qi(r), this.label = r.label ?? O("sampler");
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
    if (e.samplerParameteri(s, e.TEXTURE_MAG_FILTER, tp[a.magFilter]), this.applyMinFilter(), e.samplerParameteri(s, e.TEXTURE_WRAP_S, vn[a.addressModeU]), e.samplerParameteri(s, e.TEXTURE_WRAP_T, vn[a.addressModeV]), e.samplerParameteri(s, e.TEXTURE_WRAP_R, vn[a.addressModeW]), e.samplerParameterf(s, e.TEXTURE_MIN_LOD, a.lodMinClamp), e.samplerParameterf(s, e.TEXTURE_MAX_LOD, a.lodMaxClamp), a.compare !== void 0 ? (e.samplerParameteri(s, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.samplerParameteri(s, e.TEXTURE_COMPARE_FUNC, ia[a.compare])) : e.samplerParameteri(s, e.TEXTURE_COMPARE_MODE, e.NONE), a.maxAnisotropy > 1) {
      const o = e.getExtension("EXT_texture_filter_anisotropic");
      if (o) {
        const l = Jh(e);
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
    return wp(
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
    const n = e === null ? Nr : e;
    n !== this.mipLevelCount && (this.mipLevelCount = n, !this._disposed && this.applyMinFilter());
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
class vp {
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
  constructor(e, n = () => {
  }) {
    this.label = e.label ?? O("shaderModule"), this.source = ji(e.code), this.defines = e.defines ? { ...e.defines } : {}, this.glsl = e.glsl ? { ...e.glsl } : {}, this.onDispose = n;
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
const Qt = "EXT_disjoint_timer_query_webgl2", Nn = 35887;
function xp(t) {
  return t.getExtension(Qt) ?? null;
}
class sa {
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
    if (this.gl = e, this.onDestroy = r, this.label = n.label ?? O("querySet"), !Number.isInteger(n.count) || n.count <= 0)
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": count must be a positive integer, got ${String(n.count)}.`
      );
    if (n.type === Xe.Timestamp) {
      const s = xp(e);
      if (!s)
        throw new u(
          `[gpu-device-api] QuerySet "${this.label}": WebGL2 timestamp queries need the "${Qt}" extension, which this context does not expose. That extension is the only way to measure GPU time on WebGL2; without it, GPU timing is unavailable. Use the WebGPU backend (feature "timestamp-query") or a driver/browser build that implements it.`
        );
      this.timerExtension = s, this.target = s.TIME_ELAPSED_EXT;
    } else
      this.timerExtension = null, this.target = Nn;
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
function Wn(t, e) {
  if (t instanceof sa) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGL2 query set created by WebGL2Device.createQuerySet().`
  );
}
class Wr {
  label;
  entries;
  sortedEntries;
  onDispose;
  _disposed = !1;
  /**
   * @param onDispose 释放完成后的通知回调；`WebGL2Device` 用它把自己从资源追踪集合里摘掉
   *   （见 `WebGL2Device.untrack`）。不传时为空操作。
   */
  constructor(e, n = () => {
  }) {
    this.label = e.label ?? O("bindGroupLayout"), this.sortedEntries = Xi(e.entries), this.entries = this.sortedEntries, this.onDispose = n;
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
  /** 幂等：重复调用不会重复通知设备。 */
  dispose() {
    this._disposed || (this._disposed = !0, this.onDispose());
  }
}
class Sp {
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
  constructor(e, n = () => {
  }) {
    this.label = e.label ?? O("bindGroup"), this.layout = e.layout, this.entries = [...e.entries], this.byBinding = new Map(this.entries.map((r) => [r.binding, r])), this.onDispose = n, this.validate();
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
class zr {
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
  constructor(e, n, r, i = () => {
  }) {
    if (this.label = e.label ?? O("pipelineLayout"), this.bindGroupLayouts = [...e.bindGroupLayouts], this.isAuto = n, this.onDispose = i, this.bindGroupLayouts.length > 4)
      throw new u(
        `[gpu-device-api] pipeline layout 声明了 ${this.bindGroupLayouts.length} 个 bind group，WebGL2 后端最多支持 4 个（与 WebGPU 默认的 maxBindGroups 一致）。`
      );
    this.plan = r && this.bindGroupLayouts.length > 0 ? r.planCache.get(this.bindGroupLayouts.map((s) => s.sortedEntries)) : null;
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
function qr(t, e) {
  return `${t}:${e}`;
}
function Tp(t, e) {
  const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = [];
  let s = 0, a = 0;
  t.forEach((d, f) => {
    const m = [...d].sort((b, w) => b.binding - w.binding), g = m.filter((b) => b.type === D.Sampler || b.type === D.ComparisonSampler);
    for (const b of m)
      switch (i.push(`${f}:${b.binding}:${b.type}:${b.name ?? ""}:${b.buffer?.hasDynamicOffset ? "dyn" : ""}`), b.type) {
        case D.Uniform: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${f} 的 binding ${b.binding} 是 uniform buffer，但没有给 \`name\`。WebGL2 后端必须靠名字去 \`gl.getUniformBlockIndex\` 定位 GLSL 里的 uniform block，请在 BindGroupLayoutEntry 上填上着色器里使用的块名。`
            );
          if (s >= e.maxUniformBufferBindings)
            throw new u(
              `[gpu-device-api] uniform block 数量超出了 WebGL2 的 ${e.maxUniformBufferBindings} 个 binding 点。请合并 uniform block，或减少同时使用的 bind group。`
            );
          n.set(qr(f, b.binding), {
            group: f,
            binding: b.binding,
            name: b.name,
            blockBinding: s++,
            dynamic: b.buffer?.hasDynamicOffset ?? !1,
            minBindingSize: b.buffer?.minBindingSize ?? 0
          });
          break;
        }
        case D.Texture: {
          if (!b.name)
            throw new u(
              `[gpu-device-api] group ${f} 的 binding ${b.binding} 是纹理，但没有给 \`name\`。WebGL2 后端靠它给 GLSL 的 sampler uniform 赋纹理单元，请填上着色器里的变量名。`
            );
          if (a >= e.maxTextureUnits)
            throw new u(
              `[gpu-device-api] 纹理数量超出了 WebGL2 的 ${e.maxTextureUnits} 个纹理单元。请减少同时绑定的纹理，或把它们合并进纹理数组。`
            );
          const w = $p(b, g);
          r.set(qr(f, b.binding), {
            group: f,
            binding: b.binding,
            name: b.name,
            unit: a++,
            samplerBinding: w ? w.binding : null,
            samplerName: w ? w.name ?? null : null
          });
          break;
        }
        case D.Sampler:
        case D.ComparisonSampler:
          break;
        case D.Storage:
        case D.ReadOnlyStorage:
          throw new u(
            `[gpu-device-api] group ${f} 的 binding ${b.binding} 是 storage buffer，WebGL2 不支持（shader storage buffer 需要 GLES 3.1）。请改用 uniform buffer。`
          );
        case D.StorageTexture:
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
    [...r.values()].map((d) => d.samplerBinding).filter((d) => d !== null)
  );
  for (const [d, f] of t.entries())
    for (const m of f)
      if ((m.type === D.Sampler || m.type === D.ComparisonSampler) && !o.has(m.binding))
        throw new u(
          `[gpu-device-api] group ${d} 的 sampler binding ${m.binding}` + (m.name ? `（「${m.name}」）` : "") + " 找不到配对的纹理条目。请把纹理命名为 `<名字>` 并把 sampler 命名为 `<名字>_sampler`，或把 sampler 的 binding 设为「纹理 binding + 1」。"
        );
  const l = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Set();
  for (const d of n.values())
    De(l, d.group).push(d), d.dynamic && De(c, d.group).push(d), p.add(d.group);
  for (const d of r.values())
    De(h, d.group).push(d), p.add(d.group);
  for (const d of p)
    De(l, d), De(c, d), De(h, d);
  return {
    uniformBlocks: n,
    textures: r,
    uniformBlocksByGroup: l,
    dynamicBlocksByGroup: c,
    texturesByGroup: h,
    requiredGroups: [...p].sort((d, f) => d - f),
    key: i.join("|"),
    textureUnitCount: a,
    uniformBlockCount: s
  };
}
function De(t, e) {
  let n = t.get(e);
  return n || (n = [], t.set(e, n)), n;
}
function $p(t, e) {
  const n = t.name ?? "", r = e.find((i) => i.name === `${n}_sampler`);
  return r || e.find((i) => i.binding === t.binding + 1);
}
class Pp {
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
    const i = Tp(e, this.limits);
    return this.plans.set(n, i), i;
  }
  get size() {
    return this.plans.size;
  }
  clear() {
    this.plans.clear();
  }
}
const jr = "KHR_parallel_shader_compile is not available on this WebGL2 context; gl.linkProgram() cannot be awaited asynchronously because querying LINK_STATUS blocks until linking finishes", Ap = "the program was linked synchronously by ProgramCache.acquire() while the pipeline was created; call ProgramCache.compileAsync() (or prewarmWebGL2RenderPipeline) before createRenderPipeline() to move the compile and link cost off the critical path";
function Qr(t, e) {
  return `${t}\0${e}`;
}
class gr {
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
  acquire(e, n, r) {
    const i = Qr(n, r), s = this.programs.get(i);
    if (s) return s;
    const a = this.gl, o = [], l = [], c = this.compileShader(
      L.Vertex,
      a.VERTEX_SHADER,
      n,
      `${e} / vertex`,
      o,
      l
    ), h = this.compileShader(
      L.Fragment,
      a.FRAGMENT_SHADER,
      r,
      `${e} / fragment`,
      o,
      l
    ), p = a.createProgram();
    if (!p)
      throw a.deleteShader(c), a.deleteShader(h), new u("[gpu-device-api] gl.createProgram() 返回 null，无法创建 program。");
    if (a.attachShader(p, c), a.attachShader(p, h), a.linkProgram(p), a.detachShader(p, c), a.detachShader(p, h), a.deleteShader(c), a.deleteShader(h), et(a.getProgramInfoLog(p), e, null, o, l), !a.getProgramParameter(p, a.LINK_STATUS)) {
      const g = a.getProgramInfoLog(p) ?? "(无日志)";
      throw a.deleteProgram(p), new u(
        `[gpu-device-api] program「${e}」链接失败。vertex 与 fragment 的 varying（in/out）名字、
类型与数量必须完全对应。
GL 日志：${g}`
      );
    }
    const f = Gr(a, p), m = {
      program: p,
      reflection: f,
      blockBindings: /* @__PURE__ */ new Map(),
      samplerLocations: /* @__PURE__ */ new Map(),
      optimizedOutBlocks: [],
      label: e,
      boundPlanKey: null,
      linkMode: "sync",
      linkReason: Ap,
      compilationInfo: ye({ label: e, backend: "webgl2", messages: o, rawLogs: l })
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
  async compileAsync(e, n, r, i = {}) {
    const s = Qr(n, r), a = this.programs.get(s);
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
    const l = this.linkAsync(e, n, r, s, i);
    this.pending.set(s, l);
    try {
      return await l;
    } finally {
      this.pending.delete(s);
    }
  }
  /** 把一次预热结果转成通用的 {@link PrewarmResult}（供 pipeline / device 层转发）。 */
  static toPrewarmResult(e, n) {
    return {
      label: e,
      backend: "webgl2",
      ok: n.ok,
      mode: n.mode,
      reason: n.reason,
      durationMs: n.durationMs,
      info: n.info
    };
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
  async linkAsync(e, n, r, i, s) {
    const a = this.gl, o = k(), l = this.generation, c = s.timeoutMs ?? Yn, h = this.parallelCompile(), p = h ? "async" : "sync", d = [], f = [], m = (y) => ({
      compiled: null,
      ok: !1,
      mode: p,
      reason: y,
      durationMs: k() - o,
      info: ye({ label: e, backend: "webgl2", messages: d, rawLogs: f })
    });
    let g = null, b = null, w = null;
    try {
      if (g = this.createShaderObject(a.VERTEX_SHADER, n, `${e} / vertex`), b = this.createShaderObject(a.FRAGMENT_SHADER, r, `${e} / fragment`), h && !await this.waitFor(
        () => a.getShaderParameter(g, h.COMPLETION_STATUS_KHR) && a.getShaderParameter(b, h.COMPLETION_STATUS_KHR),
        c
      ))
        return m(
          `shader compilation for "${e}" did not finish within ${String(c)}ms (polling COMPLETION_STATUS_KHR)`
        );
      const y = a.getShaderParameter(g, a.COMPILE_STATUS) === !0;
      et(a.getShaderInfoLog(g), `${e} / vertex`, L.Vertex, d, f);
      const S = a.getShaderParameter(b, a.COMPILE_STATUS) === !0;
      if (et(a.getShaderInfoLog(b), `${e} / fragment`, L.Fragment, d, f), !y || !S) {
        const C = [y ? null : "vertex", S ? null : "fragment"].filter((I) => I !== null).join(" + ");
        return m(`shader compilation failed for "${e}" (${C} stage); see info.messages`);
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
      const $ = a.getProgramParameter(w, a.LINK_STATUS) === !0;
      if (et(a.getProgramInfoLog(w), e, null, d, f), !$)
        return m(`program linking failed for "${e}"; see info.messages`);
      const P = Gr(a, w), _ = {
        program: w,
        reflection: P,
        blockBindings: /* @__PURE__ */ new Map(),
        samplerLocations: /* @__PURE__ */ new Map(),
        optimizedOutBlocks: [],
        label: e,
        boundPlanKey: null,
        linkMode: p,
        linkReason: p === "sync" ? jr : null,
        compilationInfo: ye({ label: e, backend: "webgl2", messages: d, rawLogs: f })
      };
      return this.generation !== l ? (a.deleteProgram(w), m(`the program cache was cleared while prewarming "${e}"`)) : (w = null, this.programs.set(i, _), {
        compiled: _,
        ok: !0,
        mode: p,
        reason: p === "sync" ? jr : null,
        durationMs: k() - o,
        info: _.compilationInfo
      });
    } catch (y) {
      return m(y instanceof Error ? y.message : String(y));
    } finally {
      g && a.deleteShader(g), b && a.deleteShader(b), w && a.deleteProgram(w);
    }
  }
  /** 轮询 `check()` 直到返回 true 或超时；每次轮询之间让出一轮事件循环。 */
  async waitFor(e, n) {
    const r = k();
    for (; ; ) {
      if (e()) return !0;
      if (k() - r > n) return !1;
      await $o();
    }
  }
  createShaderObject(e, n, r) {
    const i = this.gl, s = i.createShader(e);
    if (!s)
      throw new u(`[gpu-device-api] gl.createShader() 返回 null（${r}）。`);
    return i.shaderSource(s, n), i.compileShader(s), s;
  }
  compileShader(e, n, r, i, s, a) {
    const o = this.gl, l = this.createShaderObject(n, r, i), c = o.getShaderInfoLog(l) ?? "";
    if (et(c, i, e, s, a), !o.getShaderParameter(l, o.COMPILE_STATUS))
      throw o.deleteShader(l), new u(
        `[gpu-device-api] 着色器编译失败（${i}）：
${c || "(无日志)"}

----- 源码 -----
${_p(r)}`
      );
    return l;
  }
  /**
   * 把计划里的 block binding 与纹理单元写进 program，并做交叉校验。
   */
  bindResources(e, n, r, i) {
    const s = this.gl, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), l = [], c = new Set(n.uniformBlocks.map((p) => p.name));
    if (r)
      for (const [p, d] of r.uniformBlocks) {
        if (!c.has(d.name)) {
          l.push(d.name);
          continue;
        }
        const f = s.getUniformBlockIndex(e, d.name);
        if (f === s.INVALID_INDEX) {
          l.push(d.name);
          continue;
        }
        s.uniformBlockBinding(e, f, d.blockBinding), a.set(p, d.blockBinding);
      }
    const h = n.uniforms.filter((p) => na(p.glType));
    if (r)
      for (const [, p] of r.textures) {
        const d = h.find((f) => f.name === p.name)?.location ?? s.getUniformLocation(e, p.name);
        d && (s.uniform1i(d, p.unit), o.set(p.name, d));
      }
    if (r) {
      const p = new Set([...r.uniformBlocks.values()].map((g) => g.name)), d = n.uniformBlocks.map((g) => g.name).filter((g) => !p.has(g));
      if (d.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 uniform block：${d.join("、")}。
布局里声明的块名：${[...p].join("、") || "(空)"}。
WebGL2 后端靠 \`BindGroupLayoutEntry.name\` 去定位 GLSL 的 uniform block，请检查两边的名字是否一致（注意 GLSL 里块名与实例名是两回事，这里要的是**块名**）。`
        );
      const f = new Set([...r.textures.values()].map((g) => g.name)), m = h.map((g) => g.name.replace(/\[0\]$/, "")).filter((g) => !f.has(g));
      if (m.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了未声明的 sampler：${m.join("、")}。
布局里声明的纹理名：${[...f].join("、") || "(空)"}。
请为每个 sampler 增加一个 \`type: 'texture'\` 的布局条目并填上 \`name\`。`
        );
    } else {
      if (n.uniformBlocks.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 uniform block（${n.uniformBlocks.map((p) => p.name).join("、")}），但管线没有声明任何 bind group layout。`
        );
      if (h.length > 0)
        throw new u(
          `[gpu-device-api] program「${i}」使用了 sampler（${h.map((p) => `${p.name}: ${Wh(p.glType)}`).join("、")}），但管线没有声明任何 bind group layout。`
        );
    }
    return { blockBindings: a, samplerLocations: o, optimizedOutBlocks: l };
  }
}
function et(t, e, n, r, i) {
  if (!t) return;
  const s = t.trim();
  s !== "" && (i.push(s), r.push(...To(s, e, "webgl2", n)));
}
function _p(t) {
  const e = t.split(`
`), n = String(e.length).length;
  return e.map((r, i) => `${String(i + 1).padStart(n, " ")} | ${r}`).join(`
`);
}
function Ep(t, e) {
  const n = t.depthStencil, r = n !== void 0 && n.format !== null, i = r && e.depth, s = t.render?.blend, a = t.fragment?.targets, l = a?.find((d) => d?.blend)?.blend ?? s;
  let c = null;
  l && (c = {
    colorSrc: _t(l.color.srcFactor, "color.srcFactor"),
    colorDst: _t(l.color.dstFactor, "color.dstFactor"),
    colorOp: l.color.operation ? At[l.color.operation] : At.add,
    alphaSrc: _t(l.alpha.srcFactor, "alpha.srcFactor"),
    alphaDst: _t(l.alpha.dstFactor, "alpha.dstFactor"),
    alphaOp: l.alpha.operation ? At[l.alpha.operation] : At.add
  });
  const h = a?.[0]?.writeMask ?? t.render?.writeMask ?? ue.All, p = t.primitive?.cullMode ?? "none";
  return {
    depthTest: i,
    // 不使用深度时给 `false`，而不是 `depthWriteEnabled ?? true`：GL 在 `DEPTH_TEST` 关闭时本来
    // 就不更新深度缓冲（关着测试写深度是无效操作），但把 `depthWrite` 留在 `true` 会让这份解析
    // 结果读起来像「深度是开着的」，误导后续维护。`depthCompare` 同理会停在默认的 `less`，
    // 它只在 `depthTest` 为 true 时才被 glStateCache 写入。
    depthWrite: r && (n?.depthWriteEnabled ?? !0),
    depthCompare: ia[n?.depthCompare ?? "less"],
    depthBias: [n?.depthBiasSlopeScale ?? 0, n?.depthBias ?? 0, n?.depthBiasClamp ?? 0],
    stencilEnabled: r && e.stencil,
    blend: c,
    writeMask: [
      (h & ue.Red) !== 0,
      (h & ue.Green) !== 0,
      (h & ue.Blue) !== 0,
      (h & ue.Alpha) !== 0
    ],
    cullEnabled: p !== "none",
    cullFace: p === "none" ? Ir.back : Ir[p],
    frontFace: ep[t.primitive?.frontFace ?? "ccw"]
  };
}
function Cp(t, e, n = 0) {
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
function _t(t, e) {
  const n = Jd[t];
  if (n === void 0)
    throw new u(`[gpu-device-api] 未知的混合因子「${t}」（${e}）。`);
  return n;
}
class Lp {
  label;
  descriptor;
  layout;
  vertexLayouts;
  gl;
  state;
  limits;
  onDispose;
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
    this.label = e.label ?? O("renderPipeline"), this.descriptor = e, this.layout = r, this.vertexLayouts = e.vertex.buffers ? [...e.vertex.buffers] : null, this.gl = i.gl, this.state = i.state, this.limits = i.limits, this.onDispose = i.onDispose ?? null, this.program = n, this.plan = r === "auto" ? null : r.bindingPlan ?? null, this.topologyMode = Kd[e.primitive?.topology ?? "triangle-list"];
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
    const n = e.depthFormat ?? null, r = e.sampleCount ?? 1, i = e.vertexLayouts ?? this.vertexLayouts ?? [], s = `${n ?? "none"}|${r}|${Hi(i)}`, a = this.variantCache.get(s);
    if (a) return a;
    if (i.length > 0)
      for (const h of i) Yi(h, this.limits);
    const o = new Set(i.flatMap((h) => h.attributes.map((p) => p.shaderLocation))), l = new Set(
      this.program.reflection.attributes.map((h) => h.location).filter((h) => h >= 0)
    );
    for (const h of l)
      if (!o.has(h))
        throw new u(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${h}，但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。`
        );
    const c = {
      key: s,
      renderState: Ep(this.descriptor, {
        depth: n !== null,
        stencil: n === "depth24plus-stencil8"
      }),
      depthFormat: n,
      sampleCount: r,
      vertexLayouts: i,
      vertexArrays: /* @__PURE__ */ new Map(),
      vertexArrayLookup: null
    };
    return this.variantCache.set(s, c), c;
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
  async prewarm(e = {}, n = {}) {
    const r = k();
    if (this._disposed)
      throw new u(`[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`);
    const i = this.program.compilationInfo, s = this.program.linkMode;
    return {
      label: this.label,
      backend: "webgl2",
      ok: !i.hasErrors,
      mode: s,
      reason: s === "async" ? null : this.program.linkReason,
      durationMs: k() - r,
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
  /** 把该管线的固定功能状态写入 GL 状态缓存。 */
  applyState(e, n = 0) {
    this.state.useProgram(this.program.program), Cp(this.state, e.renderState, n);
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
    const o = Mp(s, n, r), l = e.vertexArrays.get(o);
    if (l)
      return i > 0 && (e.vertexArrayLookup = { revision: i, vertexArray: l }), l;
    const c = this.gl, h = c.createVertexArray();
    if (!h)
      throw new u("[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。");
    this.state.bindVertexArray(h);
    for (let p = 0; p < s.length; p++) {
      const d = s[p], f = n[p];
      if (!d || !f) continue;
      c.bindBuffer(c.ARRAY_BUFFER, f.buffer.native);
      const m = d.stepMode === "instance" ? 1 : 0;
      for (const g of d.attributes) {
        const b = cp(g.format), w = f.offset + g.offset;
        c.enableVertexAttribArray(g.shaderLocation), b.integer ? c.vertexAttribIPointer(g.shaderLocation, b.size, b.type, d.arrayStride, w) : c.vertexAttribPointer(
          g.shaderLocation,
          b.size,
          b.type,
          b.normalized,
          d.arrayStride,
          w
        ), c.vertexAttribDivisor(g.shaderLocation, m);
      }
    }
    return r && c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, r), this.state.invalidateBufferBindings(), e.vertexArrays.set(o, h), i > 0 && (e.vertexArrayLookup = { revision: i, vertexArray: h }), h;
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
      this.variantCache.clear(), this.onDispose?.(this);
    }
  }
}
function Mp(t, e, n) {
  const r = [];
  for (let i = 0; i < t.length; i++) {
    const s = e[i], a = t[i];
    if (!s || !a) {
      r.push(`${i}:-`);
      continue;
    }
    Ee(s.offset, "setVertexBuffer 的 offset"), r.push(`${i}:${s.buffer.id}:${s.offset}:${s.size}:${a.arrayStride}:${a.stepMode ?? "vertex"}`);
  }
  return r.push(`idx:${n ? Fp(n) : "-"}`), r.join("|");
}
const Xr = /* @__PURE__ */ new WeakMap();
let Rp = 1;
function Fp(t) {
  let e = Xr.get(t);
  return e === void 0 && (e = Rp++, Xr.set(t, e)), e;
}
class Bp {
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
function Gp(t, e, n) {
  throw new u(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${t}（期望 ${n}，实际是 ${e?.constructor?.name ?? typeof e}）。
资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。`
  );
}
function Yr(t) {
  return t instanceof ra ? t : Gp("texture view", t, "WebGL2TextureView");
}
const zn = /* @__PURE__ */ new WeakMap();
function Hr(t) {
  if (!t || typeof t != "object") return null;
  const e = zn.get(t);
  return e && !e.disposed ? e : null;
}
class Op {
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
  rowOrder = Ji.BottomUp;
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
  constructor(e, n) {
    const r = n.gl, i = e.width ?? r.drawingBufferWidth, s = e.height ?? r.drawingBufferHeight;
    if (i <= 0 || s <= 0)
      throw new u(
        `[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${i}x${s}。未显式指定 width/height 时会取当前绘制缓冲大小，请确认 canvas 已经完成布局。`
      );
    const a = Ip(e.color);
    if (a.length > 4)
      throw new u(
        `[gpu-device-api] 渲染目标最多支持 4 个颜色附件，实际请求了 ${a.length} 个。`
      );
    for (const c of a)
      if (!B(c).attachment)
        throw new u(
          `[gpu-device-api] 纹理格式「${c}」在 WebGL2 下不能作为颜色附件。`
        );
    const o = Up(e.depth);
    if (o !== null && !B(o).depth)
      throw new u(`[gpu-device-api] 深度附件格式「${o}」不是深度格式。`);
    this.gl = r, this.state = n.state, this.options = n, this.label = e.label ?? O("renderTarget"), this._width = i, this._height = s, this.mipLevelCount = e.mipLevelCount ?? 1, this.colorFormats = a, this.depthFormat = o, this.sampleCount = Dp(
      r,
      e.sampleCount ?? 1,
      this.label,
      a,
      o
    );
    const l = r.createFramebuffer();
    if (!l)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建渲染目标。");
    if (this.framebuffer = l, this.sampleCount > 1) {
      const c = r.createFramebuffer();
      if (!c)
        throw r.deleteFramebuffer(this.framebuffer), new u(
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
   * 多重采样时绑定的是 draw FBO（renderbuffer 附件），内容要等到 {@link resolve} 才进纹理。
   *
   * 清屏时临时关闭 `SCISSOR_TEST`：GL 的 `clearBuffer*` 会受裁剪框影响，
   * 而这里的语义应该是「清整个附件」。
   *
   * 完整性（`checkFramebufferStatus`）不在这里查：附件只在构造与 resize() 时变，
   * 所以 attach 阶段已经查过了。原来每个渲染通道都做一次同步查询是白付的。
   */
  bind(e = {}) {
    const n = this.gl;
    if (n.bindFramebuffer(n.FRAMEBUFFER, this.drawFramebuffer), this.needsResolve = this.sampleCount > 1, e.loadOp !== "load" || this.depthTexture !== null && e.depthLoadOp !== "load") {
      if (this.state.setScissor(!1, 0, 0, this._width, this._height), e.loadOp !== "load") {
        const [i, s, a, o] = Dt(e.clearColor), l = new Float32Array([i, s, a, o]);
        for (let c = 0; c < this.colorTextures.length; c++)
          n.clearBufferfv(n.COLOR, c, l);
      }
      if (this.depthTexture && e.depthLoadOp !== "load") {
        const i = B(this.depthFormat);
        n.depthMask(!0), i.stencil ? n.clearBufferfi(n.DEPTH_STENCIL, 0, e.clearDepth ?? 1, e.clearStencil ?? 0) : n.clearBufferfv(n.DEPTH, 0, new Float32Array([e.clearDepth ?? 1])), this.state.invalidate();
      }
    }
    n.viewport(0, 0, this._width, this._height), this.state.setViewport(0, 0, this._width, this._height);
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
    const e = this.gl, n = e.getParameter(e.FRAMEBUFFER_BINDING);
    e.bindFramebuffer(e.READ_FRAMEBUFFER, this.drawFramebuffer), e.bindFramebuffer(e.DRAW_FRAMEBUFFER, this.framebuffer);
    const r = this.depthRenderbuffer === null ? e.COLOR_BUFFER_BIT : e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT;
    e.blitFramebuffer(
      0,
      0,
      this._width,
      this._height,
      0,
      0,
      this._width,
      this._height,
      r,
      e.NEAREST
    ), e.bindFramebuffer(e.FRAMEBUFFER, n), this.state.invalidate();
  }
  resize(e, n) {
    if (e === this._width && n === this._height) return !1;
    if (e <= 0 || n <= 0)
      throw new u(`[gpu-device-api] 渲染目标尺寸必须为正数，实际是 ${e}x${n}。`);
    this._width = e, this._height = n;
    for (const r of this.colorTextures) r.destroy();
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
  /**
   * 创建单采样附件纹理并挂到 resolve framebuffer 上。
   *
   * 多重采样时这一步仍然要做：绘制发生在 draw FBO 的 renderbuffer 上，但结果必须有
   * 一张**纹理**来接（可采样、可读回），`blitFramebuffer` 的目标就是它。
   */
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
    ), this.colorViews = this.colorTextures.map((r) => Yr(r.createView())), this.depthView = this.depthTexture ? Yr(this.depthTexture.createView()) : null;
    for (const r of this.colorViews) zn.set(r, this);
    this.depthView && zn.set(this.depthView, this), this.attachTextures();
  }
  /** 把纹理附件挂到 resolve framebuffer 上并校验完整性。 */
  attachTextures() {
    const e = this.gl, n = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.framebuffer), this.colorTextures.forEach((r, i) => {
      const s = e.COLOR_ATTACHMENT0 + i;
      r.dimension === "3d" || r.depthOrArrayLayers > 1 ? e.framebufferTextureLayer(e.FRAMEBUFFER, s, r.native, 0, 0) : e.framebufferTexture2D(e.FRAMEBUFFER, s, e.TEXTURE_2D, r.native, 0);
    }), e.drawBuffers(this.colorTextures.map((r, i) => e.COLOR_ATTACHMENT0 + i)), this.depthTexture) {
      const i = B(this.depthFormat).stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
      e.framebufferTexture2D(e.FRAMEBUFFER, i, e.TEXTURE_2D, this.depthTexture.native, 0);
    } else
      e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, null, 0), e.framebufferTexture2D(e.FRAMEBUFFER, e.STENCIL_ATTACHMENT, e.TEXTURE_2D, null, 0);
    this.checkComplete("framebuffer 不完整", n);
  }
  /**
   * 分配多重采样的 renderbuffer 并挂到 draw framebuffer 上。
   *
   * GL 的多重采样 renderbuffer 只能是 `renderbufferStorageMultisample` 创建的，之后再
   * `resolve()` 到纹理 —— 这就是 `sampleCount > 1` 的全部机制。
   */
  createMultisampleAttachments() {
    const e = this.gl, n = e.getParameter(e.FRAMEBUFFER_BINDING);
    if (e.bindFramebuffer(e.FRAMEBUFFER, this.drawFramebuffer), this.colorRenderbuffers = this.colorFormats.map((r) => {
      const i = e.createRenderbuffer();
      if (!i)
        throw new u(
          `[gpu-device-api] RenderTarget "${this.label}": gl.createRenderbuffer() returned null while allocating the multisampled colour attachment.`
        );
      return e.bindRenderbuffer(e.RENDERBUFFER, i), e.renderbufferStorageMultisample(
        e.RENDERBUFFER,
        this.sampleCount,
        B(r).internalFormat,
        this._width,
        this._height
      ), i;
    }), this.colorRenderbuffers.forEach((r, i) => {
      e.framebufferRenderbuffer(
        e.FRAMEBUFFER,
        e.COLOR_ATTACHMENT0 + i,
        e.RENDERBUFFER,
        r
      );
    }), e.drawBuffers(this.colorRenderbuffers.map((r, i) => e.COLOR_ATTACHMENT0 + i)), this.depthFormat !== null) {
      const r = B(this.depthFormat), i = e.createRenderbuffer();
      if (!i)
        throw new u(
          `[gpu-device-api] RenderTarget "${this.label}": gl.createRenderbuffer() returned null while allocating the multisampled depth attachment.`
        );
      e.bindRenderbuffer(e.RENDERBUFFER, i), e.renderbufferStorageMultisample(
        e.RENDERBUFFER,
        this.sampleCount,
        r.internalFormat,
        this._width,
        this._height
      ), e.framebufferRenderbuffer(
        e.FRAMEBUFFER,
        r.stencil ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT,
        e.RENDERBUFFER,
        i
      ), this.depthRenderbuffer = i;
    }
    this.checkComplete("多重采样的 framebuffer 不完整", n);
  }
  /** 校验当前绑定的 framebuffer，并把绑定恢复成 `previous`。 */
  checkComplete(e, n) {
    const r = this.gl, i = r.checkFramebufferStatus(r.FRAMEBUFFER);
    if (r.bindFramebuffer(r.FRAMEBUFFER, n), this.state.invalidate(), i !== r.FRAMEBUFFER_COMPLETE) {
      const s = this.sampleCount > 1 ? `
多重采样目标（sampleCount=${this.sampleCount}）最常见的原因是：这个采样数不被该格式组合支持，或者颜色/深度附件的采样数、尺寸不一致。请换一个采样数（常见可用值：2、4），或降到 1。` : "";
      throw new u(
        `[gpu-device-api] 渲染目标「${this.label}」的 ${e}（格式组合在 WebGL2 下不受支持）。颜色附件：${this.colorFormats.join("、")}；深度附件：${this.depthFormat ?? "无"}。GL 状态码：0x${i.toString(16)}。` + (i === r.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE ? s : "")
      );
    }
  }
  destroyRenderbuffers() {
    for (const e of this.colorRenderbuffers) this.gl.deleteRenderbuffer(e);
    this.colorRenderbuffers = [], this.depthRenderbuffer && (this.gl.deleteRenderbuffer(this.depthRenderbuffer), this.depthRenderbuffer = null);
  }
}
function Ip(t) {
  if (t === void 0) return ["rgba8unorm"];
  if (typeof t == "string") return [t];
  const e = [...t];
  if (e.length === 0)
    throw new u("[gpu-device-api] 渲染目标的 color 数组不能为空。");
  return e;
}
function Up(t) {
  return t == null || t === !1 ? null : t === !0 ? "depth24plus" : t;
}
function Dp(t, e, n, r, i) {
  if (!Number.isInteger(e) || e < 1)
    throw new u(
      `[gpu-device-api] RenderTarget "${n}": sampleCount must be a positive integer, got ${String(e)}.`
    );
  if (e === 1) return 1;
  const s = Number(t.getParameter(t.MAX_SAMPLES) ?? 0);
  if (!Number.isFinite(s) || s < e)
    throw new u(
      `[gpu-device-api] RenderTarget "${n}": sampleCount ${e} is not supported by this device (MAX_SAMPLES = ${String(s) || "unknown"}). WebGL2 has no fallback: the sample count of a render target is fixed at creation, so this library will not silently use 1. Use sampleCount 1, or a smaller supported sample count.`
    );
  const a = [
    ...r.map((o) => ({ kind: "colour", format: o })),
    ...i === null ? [] : [{ kind: "depth", format: i }]
  ];
  for (const { kind: o, format: l } of a) {
    const c = t.getInternalformatParameter(
      t.RENDERBUFFER,
      B(l).internalFormat,
      t.SAMPLES
    );
    if (!(!c || c.length === 0) && !Array.from(c).includes(e))
      throw new u(
        `[gpu-device-api] RenderTarget "${n}": the ${o} format "${l}" does not support sampleCount ${e} on this device (supported: ${Array.from(c).join(", ")}). WebGL2 cannot resolve an unsupported multisample format, and this library will not silently fall back to 1. Pick one of the supported sample counts, or use sampleCount 1.`
      );
  }
  return e;
}
const Zr = /* @__PURE__ */ new WeakMap();
function br(t) {
  let e = Zr.get(t);
  return e === void 0 && (e = t.getExtension("EXT_debug_marker") ?? null, Zr.set(t, e)), e;
}
function aa(t, e) {
  br(t)?.pushGroupMarkerEXT?.(e);
}
function oa(t) {
  br(t)?.popGroupMarkerEXT?.();
}
function la(t, e) {
  br(t)?.insertEventMarkerEXT?.(e);
}
function Kr(t) {
  return !!t && typeof t == "object" && t.isDefaultFramebuffer === !0;
}
class Jr {
  label;
  dimension = Ot.D2;
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
class Vp {
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
    const n = ns(), r = rt(e.canvas);
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
    if (e.format !== void 0 && !Xd(e.format))
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
    const n = rt(this.canvas);
    this._width = Math.max(1, Math.floor(n.width * e)), this._height = Math.max(1, Math.floor(n.height * e)), this.applyBackingSize();
  }
  resize() {
    const e = rt(this.canvas), n = Math.max(1, Math.floor(e.width * this._pixelRatio)), r = Math.max(1, Math.floor(e.height * this._pixelRatio));
    return n === this._width && r === this._height ? !1 : (this._width = n, this._height = r, this.applyBackingSize(), !0);
  }
  getCurrentFrameTarget() {
    if (!this._device)
      throw new u(
        "[gpu-device-api] canvas 还没有 configure()，无法获取帧目标。请先调用 device.createCanvasContext(canvas)（它会自动完成配置）。"
      );
    const e = this.sampleCount(), n = new Jr(
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
    const n = new Jr(
      this._width,
      this._height,
      ts,
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
const kp = [];
let Et = 1;
class Np {
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
  bindingRevision = Et++;
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
      }), this.state.invalidate(), this.state.setViewport(0, 0, r.width, r.height), this.renderTarget = r;
    } else {
      const i = e.colorAttachments.filter((o) => o !== null);
      if (i.length === 0 && !e.depthStencilAttachment)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」没有任何附件。请提供 target，或至少一个 colorAttachment / depthStencilAttachment。`
        );
      this.colorFormats = i.map((o) => o.view.texture.format), this.depthFormat = e.depthStencilAttachment?.view.texture.format ?? null;
      const s = i.some((o) => Kr(o.view)) || e.depthStencilAttachment !== void 0 && e.depthStencilAttachment !== null && Kr(e.depthStencilAttachment.view), a = this.multisampleTargetOf(e, i);
      if (a)
        this.beginMultisampleTargetPass(e, a);
      else if (s)
        this.beginDefaultFramebufferPass(e);
      else {
        const o = n.framebuffers.acquire(e);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, o), this.state.invalidate();
        const l = i[0], c = l.view.texture.width, h = l.view.texture.height;
        this.clearRawAttachments(e, o), this.gl.viewport(0, 0, c, h), this.state.setViewport(0, 0, c, h);
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
    const s = this.vertexBuffers[e];
    if (n === null) {
      if (!s) return;
      this.vertexBuffers[e] = null, this.bindingRevision = Et++;
      return;
    }
    if (s && s.buffer === n && s.offset === r && s.size === i) return;
    const a = s ?? { buffer: n, offset: r, size: i };
    a.buffer = n, a.offset = r, a.size = i, this.vertexBuffers[e] = a, this.bindingRevision = Et++;
  }
  setIndexBuffer(e, n, r = 0, i = -1) {
    if (this.assertOpen("setIndexBuffer"), !e.isIndexBuffer)
      throw new u(
        `[gpu-device-api] buffer「${e.label}」的 usage 里没有 \`BufferUsage.Index\`，而 WebGL2 的绑定目标在创建时就永久固定（索引缓冲必须一开始就按 Index 用途创建），它无法再绑到 ELEMENT_ARRAY_BUFFER。请在 createBuffer() 时加上 \`BufferUsage.Index\`。`
      );
    const s = this.indexBuffer;
    s && s.buffer === e && s.format === n && s.offset === r && s.size === i || (s ? (s.buffer = e, s.format = n, s.offset = r, s.size = i) : this.indexBuffer = { buffer: e, format: n, offset: r, size: i }, this.bindingRevision = Et++);
  }
  setViewport(e, n, r, i, s = 0, a = 1) {
    this.assertOpen("setViewport"), (s !== 0 || a !== 1) && this.gl.depthRange(s, a), this.state.setViewport(e, n, r, i);
  }
  setScissorRect(e, n, r, i) {
    this.assertOpen("setScissorRect"), this.state.setScissor(!0, e, n, r, i);
  }
  setBlendConstant(e) {
    this.assertOpen("setBlendConstant"), this.state.setBlendConstant(Dt(e));
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
    const i = e.instanceCount ?? 1, s = r.offset + (e.firstIndex ?? 0) * io(r.format);
    this.beginDraw(n, r), this.gl.drawElementsInstanced(
      n.mode,
      e.indexCount,
      np[r.format],
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
    this.gl.beginQuery(Nn, n.queryAt(e, `${this.label}.beginOcclusionQuery`)), this.occlusionQueryOpen = !0;
  }
  /** 结束最近一次 {@link beginOcclusionQuery}。 */
  endOcclusionQuery() {
    if (this.assertOpen("endOcclusionQuery"), !this.occlusionQueryOpen)
      throw new u(
        `[gpu-device-api] RenderPass "${this.label}".endOcclusionQuery: no occlusion query is open.`
      );
    this.gl.endQuery(Nn), this.occlusionQueryOpen = !1;
  }
  /**
   * 调试分组：WebGL2 靠 `EXT_debug_marker` 实现，扩展不可用时是空操作
   * （只影响抓帧工具的分组显示，不影响渲染结果）。
   */
  pushDebugGroup(e) {
    aa(this.gl, e);
  }
  popDebugGroup() {
    oa(this.gl);
  }
  insertDebugMarker(e) {
    la(this.gl, e);
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
  multisampleTargetOf(e, n) {
    const r = n.map((s) => s.view);
    e.depthStencilAttachment && r.push(e.depthStencilAttachment.view);
    let i = null;
    for (const s of r) {
      const a = Hr(s);
      if (a) {
        if (i === null) i = a;
        else if (i !== a)
          throw new u(
            `[gpu-device-api] 渲染通道「${this.label}」把多个渲染目标的附件混在了一起。一个渲染通道的附件必须来自同一个渲染目标（多重采样的附件是 renderbuffer，无法与别的 target 的纹理挂在同一个 framebuffer 上）。`
          );
      }
    }
    if (!i || i.sampleCount === 1) return null;
    for (const s of r)
      if (Hr(s) !== i)
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」把多重采样目标「${i.label}」的附件与其它附件混在了一起。多重采样目标的附件全部是 renderbuffer，只能整组使用；请传 \`target\`（或完整使用 \`target.createPassDescriptor()\` 的结果），或把该目标的 sampleCount 设为 1。`
        );
    return i;
  }
  /**
   * 用渲染目标自己的 framebuffer 开始通道（多重采样路径）。
   *
   * 清屏参数从附件列表归并而来：GL 的 `clearBuffer*` 对同一帧的所有颜色附件用同一个颜色
   * （见 `WebGL2RenderTarget.bind`），所以这里要求各附件的 `loadOp` / `clearValue` 一致，
   * 不一致就明确报错，而不是悄悄只按第一个附件清屏。
   */
  beginMultisampleTargetPass(e, n) {
    let r = "clear", i;
    for (const a of e.colorAttachments) {
      if (!a) continue;
      if ((a.loadOp ?? "clear") === "load") {
        r = "load";
        continue;
      }
      if (i === void 0) i = a.clearValue;
      else if (JSON.stringify(i) !== JSON.stringify(a.clearValue))
        throw new u(
          `[gpu-device-api] 渲染通道「${this.label}」给多个颜色附件指定了不同的 clearValue，而 WebGL2 的清屏对整帧只有一个颜色。请让它们一致（或改用 sampleCount = 1 的目标）。`
        );
    }
    if (r === "clear" && e.colorAttachments.some((a) => a?.loadOp === "load"))
      throw new u(
        `[gpu-device-api] 渲染通道「${this.label}」给一部分颜色附件用了 loadOp: 'load'、另一部分用了 'clear'，WebGL2 无法在一次清屏里表达这种组合。请统一 loadOp。`
      );
    const s = e.depthStencilAttachment;
    n.bind({
      clearColor: r === "load" ? void 0 : i,
      clearDepth: s?.depthClearValue,
      clearStencil: s?.stencilClearValue,
      loadOp: r,
      depthLoadOp: s?.depthLoadOp
    }), this.renderTarget = n, this.state.invalidate(), this.state.setViewport(0, 0, n.width, n.height);
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
    e.occlusionQuerySet && (this.occlusionQuerySet = Wn(
      e.occlusionQuerySet,
      `${this.label}.occlusionQuerySet`
    ));
    const n = e.timestampWrites;
    if (!n) return;
    const r = `${this.label}.timestampWrites`;
    Qi(n, r);
    const i = Wn(n.querySet, `${r}.querySet`), s = n.beginningOfPassWriteIndex ?? n.endOfPassWriteIndex;
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
          const o = n.dynamicBlocksByGroup.get(r) ?? kp, l = o.length > 0 ? this.dynamicOffsets.get(r) : void 0;
          if (o.length > 0 && (l === void 0 || l.length < o.length))
            throw new u(
              `[gpu-device-api] setBindGroup(${r}, ...) 缺少动态偏移：布局里有 ${o.length} 个带 hasDynamicOffset 的 uniform buffer，但只提供了 ${l?.length ?? 0} 个偏移值。`
            );
          let c = 0;
          for (const h of s) {
            const p = i.entry(h.binding);
            if (!p)
              throw new u(
                `[gpu-device-api] bind group「${i.label}」缺少 binding ${h.binding}（布局要求提供 uniform buffer）。`
              );
            const d = p.resource, f = d.buffer, m = d.offset ?? 0;
            if (h.dynamic) {
              const g = this.state.uniformBufferOffsetAlignment(), b = l[c++] ?? 0;
              if (g > 0 && b % g !== 0)
                throw new u(
                  `[gpu-device-api] 动态偏移 ${b} 不是 UNIFORM_BUFFER_OFFSET_ALIGNMENT（${g}）的倍数。uniform arena 的每段长度必须按这个对齐值取整。`
                );
              const w = m + b, y = d.size ?? f.size - w;
              this.state.bindUniformBuffer(h.blockBinding, f.native, w, y);
            } else
              this.state.bindUniformBuffer(h.blockBinding, f.native, 0, -1);
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
              const p = h.resource.sampler;
              this.state.bindSampler(o.unit, p.native);
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
      const [l, c, h, p] = Dt(a.clearValue);
      r.clearBufferfv(r.COLOR, o, new Float32Array([l, c, h, p]));
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
      const [o, l, c, h] = Dt(s.clearValue);
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
const ge = `[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。
可选方案：
  1) 切到 WebGPU 后端（createDevice({ backend: 'auto' }) 会优先选它）；
  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，用片元着色器当 kernel，结果渲染到另一张纹理。`;
class Wp {
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
  setBindGroup(e, n, r) {
    throw new u(ge);
  }
  dispatchWorkgroups(e, n, r) {
    throw new u(ge);
  }
  dispatchWorkgroupsIndirect(e, n) {
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
class zp {
  label;
  gl;
  state;
  passOptions;
  openPass = null;
  drawCalls = 0;
  passCount = 0;
  finished = !1;
  constructor(e, n, r, i) {
    this.label = e?.label ?? O("commandEncoder"), this.gl = n, this.state = r, this.passOptions = i;
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
    const n = new Np(e, this.passOptions);
    return this.openPass = n, this.passCount += 1, n;
  }
  beginComputePass() {
    return this.assertOpen("beginComputePass"), new Wp();
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
    const i = this.gl, s = e.buffer, a = n.texture.native, o = n.texture.format, l = B(o), { x: c, y: h, z: p } = Ct(n.origin), d = e.bytesPerRow ?? r.width * l.bytesPerPixel, f = r.height, m = new Uint8Array(d * f);
    s.download(e.offset ?? 0, m), i.bindTexture(n.texture.target, a), i.pixelStorei(i.UNPACK_ALIGNMENT, 1), d !== r.width * l.bytesPerPixel && i.pixelStorei(i.UNPACK_ROW_LENGTH, d / l.bytesPerPixel);
    const g = n.texture.target;
    g === i.TEXTURE_3D || g === i.TEXTURE_2D_ARRAY ? i.texSubImage3D(
      g,
      n.mipLevel ?? 0,
      c,
      h,
      p,
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
    ), i.pixelStorei(i.UNPACK_ROW_LENGTH, 0), i.pixelStorei(i.UNPACK_ALIGNMENT, 4), this.state.invalidateTextureUnits();
  }
  copyTextureToBuffer(e, n, r) {
    this.assertOpen("copyTextureToBuffer");
    const i = this.gl, s = e.texture, a = B(s.format), o = r.width * a.bytesPerPixel, l = n.bytesPerRow ?? o;
    if (!Number.isInteger(l) || l < o)
      throw new u(
        `[gpu-device-api] copyTextureToBuffer: bytesPerRow must be an integer >= ${o} (one row of ${r.width} "${s.format}" pixels), got ${String(l)}.`
      );
    const c = new Uint8Array(l * r.height), h = new Uint8Array(o * r.height), p = i.createFramebuffer();
    if (!p)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法读回纹理。");
    const d = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, p);
    const f = a.depth ? i.DEPTH_ATTACHMENT : i.COLOR_ATTACHMENT0;
    i.framebufferTexture2D(i.FRAMEBUFFER, f, i.TEXTURE_2D, s.native, e.mipLevel ?? 0);
    const m = i.checkFramebufferStatus(i.FRAMEBUFFER);
    if (m !== i.FRAMEBUFFER_COMPLETE)
      throw i.bindFramebuffer(i.FRAMEBUFFER, d), i.deleteFramebuffer(p), new u(
        `[gpu-device-api] 无法把纹理「${s.label}」作为附件读回（framebuffer 不完整，0x${m.toString(16)}）。请确认该纹理的 usage 里包含 RenderAttachment 或 CopySrc。`
      );
    i.pixelStorei(i.PACK_ALIGNMENT, 1);
    const { x: g, y: b } = Ct(e.origin);
    if (i.readPixels(g, b, r.width, r.height, a.format, a.type, h), i.pixelStorei(i.PACK_ALIGNMENT, 4), i.bindFramebuffer(i.FRAMEBUFFER, d), i.deleteFramebuffer(p), this.state.invalidate(), l === o)
      c.set(h);
    else
      for (let y = 0; y < r.height; y += 1)
        c.set(
          h.subarray(y * o, (y + 1) * o),
          y * l
        );
    n.buffer.upload(n.offset ?? 0, c);
  }
  copyTextureToTexture(e, n, r) {
    this.assertOpen("copyTextureToTexture");
    const i = this.gl, s = e.texture, a = n.texture, o = B(a.format), { x: l, y: c } = Ct(e.origin), { x: h, y: p } = Ct(n.origin), d = i.createFramebuffer(), f = i.createFramebuffer();
    if (!d || !f)
      throw new u("[gpu-device-api] 创建临时 framebuffer 失败，无法拷贝纹理。");
    const m = i.getParameter(i.FRAMEBUFFER_BINDING);
    if (i.bindFramebuffer(i.READ_FRAMEBUFFER, d), i.framebufferTexture2D(
      i.READ_FRAMEBUFFER,
      i.COLOR_ATTACHMENT0,
      i.TEXTURE_2D,
      s.native,
      e.mipLevel ?? 0
    ), i.bindFramebuffer(i.DRAW_FRAMEBUFFER, f), i.framebufferTexture2D(
      i.DRAW_FRAMEBUFFER,
      i.COLOR_ATTACHMENT0,
      i.TEXTURE_2D,
      a.native,
      n.mipLevel ?? 0
    ), B(s.format).internalFormat !== o.internalFormat)
      throw new u(
        `[gpu-device-api] copyTextureToTexture 要求源与目标格式一致：源是「${s.format}」，目标是「${a.format}」。WebGL2 的 blitFramebuffer 不做格式转换。`
      );
    i.blitFramebuffer(
      l,
      c,
      l + r.width,
      c + r.height,
      h,
      p,
      h + r.width,
      p + r.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, m), i.deleteFramebuffer(d), i.deleteFramebuffer(f), this.state.invalidate();
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
    aa(this.gl, e);
  }
  popDebugGroup() {
    oa(this.gl);
  }
  insertDebugMarker(e) {
    la(this.gl, e);
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
function Ct(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
function qp(t) {
  const e = t.colorAttachments.map((r) => r ? ei(r) : "-").join(","), n = t.depthStencilAttachment ? ei(t.depthStencilAttachment) : "-";
  return `${e}|${n}`;
}
function ei(t) {
  const e = t.view, n = e.texture;
  return `${e.label}@${n.label}#${n.width}x${n.height}`;
}
class jp {
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
    const n = qp(e), r = this.framebuffers.get(n);
    if (r) return r;
    const i = this.gl, s = i.createFramebuffer();
    if (!s)
      throw new u("[gpu-device-api] gl.createFramebuffer() 返回 null，无法创建 framebuffer。");
    const a = i.getParameter(i.FRAMEBUFFER_BINDING);
    i.bindFramebuffer(i.FRAMEBUFFER, s);
    let o = 0;
    for (const h of e.colorAttachments) {
      if (!h) continue;
      const p = h.view, d = p.target;
      d === i.TEXTURE_2D ? i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + o, d, p.glTexture, 0) : i.framebufferTextureLayer(
        i.FRAMEBUFFER,
        i.COLOR_ATTACHMENT0 + o,
        p.glTexture,
        p.descriptor.baseMipLevel,
        p.descriptor.baseArrayLayer
      ), o += 1;
    }
    o > 0 && i.drawBuffers(
      Array.from({ length: o }, (h, p) => i.COLOR_ATTACHMENT0 + p)
    );
    const l = e.depthStencilAttachment;
    if (l) {
      const h = l.view, d = B(h.texture.format).stencil ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
      i.framebufferTexture2D(i.FRAMEBUFFER, d, i.TEXTURE_2D, h.glTexture, 0);
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
class Qp {
  label = O("queue");
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
    a.upload(n, Co(l));
  }
  writeTexture(e, n, r, i) {
    const s = e.texture, a = B(s.format);
    Yd(s.format, n);
    const o = ti(e.origin), l = r.bytesPerRow ?? i.width * a.bytesPerPixel, c = this.gl;
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
    ), c.pixelStorei(c.UNPACK_ROW_LENGTH, 0), c.pixelStorei(c.UNPACK_ALIGNMENT, 4), this.state.invalidateTextureUnits();
  }
  copyExternalImageToTexture(e, n, r, i = !1) {
    const s = n.texture, a = B(s.format), o = this.gl, l = ti(n.origin);
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
    this.state.invalidateTextureUnits();
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
    const i = B(n.texture.format), s = e.bytesPerRow ?? r.width * i.bytesPerPixel, a = new Uint8Array(s * r.height);
    e.buffer.download(e.offset ?? 0, a), this.writeTexture(n, a, { offset: 0, bytesPerRow: s }, r);
  }
  submit(e) {
    this.submittedCount += e.length, e.length > 0 && this.gl.flush();
  }
  async onSubmittedWorkDone() {
    await this.pending, this.gl.finish();
  }
}
function ti(t) {
  return { x: t?.x ?? 0, y: t?.y ?? 0, z: t?.z ?? 0 };
}
class Xp {
  label = O("fence");
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
        await Yp();
      }
    }
  }
}
function Yp() {
  const t = globalThis.requestAnimationFrame;
  return typeof t == "function" ? new Promise((e) => t(() => e())) : new Promise((e) => setTimeout(e, 1));
}
const Hp = 1e4;
class Zp {
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
    this.gl = e.gl, this.querySet = e.querySet, this.type = e.type, this.first = e.first, this.count = e.count, this.timeoutMs = e.timeoutMs ?? Hp, this.yieldToEventLoop = e.yieldToEventLoop ?? (() => new Promise((n) => setTimeout(n, 0)));
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
        throw new ee(
          `[gpu-device-api] QueryResult.read(): query set "${this.querySet.label}" was destroyed while waiting for query ${n}. The result of that frame is simply dropped.`,
          { code: "QUERY_DISCARDED" }
        );
      if (Date.now() >= i)
        throw new ee(
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
      throw new ee(
        `[gpu-device-api] QueryResult.read(): GPU_DISJOINT_EXT is set, so the timer results of "${this.querySet.label}" (query ${e}) are undefined. A disjoint happens when the GPU is reset or preempted between the begin/end of the query; discard this sample instead of using it.`,
        { code: "QUERY_DISJOINT" }
      );
  }
}
class Kp {
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
    this.gl = e.gl, this.canvas = e.canvas, this.native = e.gl, this.debug = e.descriptor?.debug ?? !1, this.logger = e.logger ?? pt("gpu-device-api/webgl2"), this.label = e.descriptor?.label ?? O("webgl2Device"), this.limits = es(e.adapterLimits, e.descriptor?.requiredLimits, "webgl2");
    const n = [...e.adapterFeatures], r = new Set(n), i = (e.descriptor?.requiredFeatures ?? []).filter((a) => !r.has(a));
    if (i.length > 0)
      throw new u(
        `[gpu-device-api] WebGL2 适配器不支持以下必需特性：${i.join("、")}。
当前可用特性：${n.join("、") || "(无)"}。`
      );
    this.features = {
      has: (a) => r.has(a),
      names: n
    }, this.timing = Jp(e.gl), this.state = new td(e.gl), this.planCache = new Pp({
      maxTextureUnits: this.limits.maxSampledTexturesPerShaderStage,
      maxUniformBufferBindings: Math.min(this.limits.maxUniformBuffersPerShaderStage, 12)
    }), this.programs = new gr({ gl: e.gl, state: this.state }), this.framebuffers = new jp(e.gl), this.queue = new Qp(e.gl, this.state), this.lostPromise = new Promise((a) => {
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
      new id(this.gl, this.state, e, (n) => {
        this.untrack(n);
      })
    );
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(
      new Or(this.gl, this.state, e, (n) => {
        this.framebuffers.clear(), this.untrack(n);
      })
    );
  }
  /** 供渲染目标内部创建附件纹理（不重复登记，释放由渲染目标负责）。 */
  createAttachmentTexture(e, n, r, i, s) {
    const a = new Or(
      this.gl,
      this.state,
      { format: e, size: { width: n, height: r }, usage: i, label: s },
      (o) => {
        this.framebuffers.clear(), this.untrack(o);
      }
    );
    return this.track(a);
  }
  createSampler(e = {}) {
    this.assertUsable("createSampler");
    const n = new yp(
      this.gl,
      this.state,
      e,
      (r) => this.untrack(r)
    );
    return this.track(n);
  }
  createShaderModule(e) {
    this.assertUsable("createShaderModule");
    const n = new vp(e, () => this.untrack(n));
    return this.track(n);
  }
  /**
   * 创建 query set。
   *
   * - occlusion：`ANY_SAMPLES_PASSED` 是 WebGL2 核心功能，直接用；
   * - timestamp：需要 `EXT_disjoint_timer_query_webgl2`，扩展缺失时抛带 `[gpu-device-api] ` 前缀的
   *   英文错误说明缺哪个扩展（而不是静默返回 0）。
   */
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new sa(this.gl, e, (n) => this.untrack(n)));
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
    const r = Wn(e, `Device "${this.label}".readQuerySet(querySet)`), i = n.firstQuery ?? 0;
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
    return new Zp({
      gl: this.gl,
      querySet: r,
      type: r.type,
      first: i,
      count: s
    });
  }
  /* ------------------------------------------------------------------ 绑定 ------------------- */
  createBindGroupLayout(e) {
    this.assertUsable("createBindGroupLayout");
    const n = new Wr(e, () => this.untrack(n));
    return this.track(n);
  }
  createBindGroup(e) {
    this.assertUsable("createBindGroup");
    const n = new Sp(e, () => this.untrack(n));
    return this.track(n);
  }
  createPipelineLayout(e) {
    this.assertUsable("createPipelineLayout");
    const n = new zr(e, !1, this, () => this.untrack(n));
    return this.track(n);
  }
  /* ------------------------------------------------------------------ 管线 ------------------- */
  createRenderPipeline(e) {
    this.assertUsable("createRenderPipeline");
    const n = e.label ?? "renderPipeline", r = ct({
      backend: "webgl2",
      source: e.vertex.module.source,
      stage: L.Vertex,
      label: n,
      defines: e.vertex.module.defines,
      glsl: e.vertex.module.glsl
    }).code;
    if (!e.fragment)
      throw new u(
        "[gpu-device-api] WebGL2 后端要求管线同时提供顶点与片元着色器（GL 的 program 必须链接两个阶段）。\n只写深度时，可以在片元着色器里 `discard` 而不输出颜色。"
      );
    const i = ct({
      backend: "webgl2",
      source: e.fragment.module.source,
      stage: L.Fragment,
      label: n,
      defines: e.fragment.module.defines,
      glsl: e.fragment.module.glsl
    }).code, s = this.programs.acquire(n, r, i);
    let a;
    if (e.layout === void 0 || e.layout === "auto") {
      const l = jh(s.reflection, L.Vertex | L.Fragment);
      if (l.length === 0)
        a = "auto", this.programs.bindPlan(s, null);
      else {
        const c = new Wr(
          {
            label: `${n}:autoLayout`,
            entries: l
          },
          () => this.untrack(c)
        );
        this.track(c);
        const h = new zr(
          { label: `${n}:autoPipelineLayout`, bindGroupLayouts: [c] },
          !0,
          this,
          () => this.untrack(h)
        );
        a = this.track(h), this.programs.bindPlan(s, a.bindingPlan);
      }
    } else
      a = e.layout, this.programs.bindPlan(s, a.bindingPlan);
    const o = new Lp(e, s, a, {
      gl: this.gl,
      state: this.state,
      limits: {
        maxVertexAttributes: this.limits.maxVertexAttributes,
        maxVertexBufferArrayStride: this.limits.maxVertexBufferArrayStride
      },
      onDispose: (l) => this.untrack(l)
    });
    return this.track(o);
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), new Bp(e);
  }
  /* ------------------------------------------------------------------ 渲染 ------------------- */
  createRenderTarget(e = {}) {
    this.assertUsable("createRenderTarget");
    const n = new Op(e, {
      gl: this.gl,
      state: this.state,
      createTexture: (r, i, s, a, o) => this.createAttachmentTexture(r, i, s, a, o),
      onDispose: (r) => this.untrack(r)
    });
    return this.track(n);
  }
  createCommandEncoder(e) {
    return this.assertUsable("createCommandEncoder"), new zp(e, this.gl, this.state, {
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
    return r || (r = new Vp({ gl: this.gl, canvas: e, format: n?.format }), this.canvasContexts.set(e, r)), r.configure({ ...n, device: this }), this.state.invalidate(), r;
  }
  /** 创建一个进程内的同步点（fence）。 */
  createFence() {
    return new Xp(this.gl);
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
    this._disposed = !0, this.eventTarget && this.handleContextLost && this.eventTarget.removeEventListener("webglcontextlost", this.handleContextLost), this.eventTarget && this.handleContextRestored && this.eventTarget.removeEventListener("webglcontextrestored", this.handleContextRestored);
    const e = [...this.resources];
    this.resources.clear();
    for (const r of e)
      try {
        r.dispose();
      } catch (i) {
        this.logger.warn("释放资源时出错", i);
      }
    this.programs.dispose(), this.framebuffers.dispose(), this.planCache.clear();
    for (const r of this.canvasContexts.values()) r.dispose();
    this.canvasContexts.clear(), this.contextRestoredCallbacks.clear(), this.errorCallbacks.clear(), this.state.invalidate();
    const n = { reason: "destroyed", message: "Device.dispose() was called." };
    this.lostInfoValue = n, this.lostResolve(n);
  }
  /**
   * 在 debug 模式下轮询 `gl.getError()` 并转成统一错误。
   * 注意这会强制 CPU/GPU 同步，所以只在 debug 打开时调用。
   */
  checkGlError(e) {
    if (!this.debug) return;
    const n = this.gl.getError();
    n !== this.gl.NO_ERROR && this.reportError(
      new ee(`[gpu-device-api] GL 错误 0x${n.toString(16)}（发生在 ${e} 之后）。`, {
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
      throw new nt(
        `[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`,
        { reason: "destroyed" }
      );
    const n = this.lostInfoValue;
    if (n)
      throw new nt(
        `[gpu-device-api] Device.${e}: device "${this.label}" lost its WebGL2 context (${n.reason}): ${n.message}`,
        { reason: n.reason }
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
      new nt(
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
    for (const n of [...this.contextRestoredCallbacks])
      try {
        n(e);
      } catch (r) {
        this.logger.error(`context-restored callback threw: ${String(r)}`);
      }
  }
}
function Jp(t) {
  const e = typeof t.getExtension == "function" ? t.getExtension(Qt) : null, n = e != null;
  return {
    encoderTimestamps: !1,
    passTimestamps: n,
    unavailableReason: n ? null : `[gpu-device-api] this WebGL2 context does not expose the "${Qt}" extension, so GL timer queries are unavailable. Use the WebGPU backend (feature "timestamp-query") or a driver/browser build that exposes the extension.`
  };
}
const ef = {
  antialias: !0,
  alpha: !1,
  depth: !0,
  stencil: !1,
  premultipliedAlpha: !0,
  preserveDrawingBuffer: !1,
  powerPreference: "high-performance",
  desynchronized: !1
};
class wr {
  info;
  features;
  limits;
  gl;
  canvas;
  logger;
  device = null;
  constructor(e, n, r, i, s) {
    this.gl = e, this.canvas = n, this.limits = r, this.features = i, this.logger = s;
    const a = Kh(e);
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
    const n = { ...ef, ...e.contextAttributes }, r = ed(e.canvas, n), i = Hh(r), s = Zh(r);
    return new wr(r, e.canvas, i, s, e.logger);
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
    const n = new Kp({
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
const yr = Object.freeze({
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
    gpuFormat: yr[t],
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
const tf = Object.freeze({
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
function Re(t) {
  const e = tf[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}".`
    );
  return e;
}
function J(t) {
  const e = yr[t];
  if (!e)
    throw new u(
      `[gpu-device-api] Unknown or unsupported TextureFormat "${String(t)}"; the WebGPU backend only accepts formats declared by core.`
    );
  return e;
}
function nf(t) {
  for (const [e, n] of Object.entries(yr))
    if (n === t) return e;
  throw new u(
    `[gpu-device-api] GPU texture format "${t}" has no core TextureFormat counterpart (compressed formats and the extra WebGPU-only formats are not part of core).`
  );
}
function ca(t) {
  return t === "depth16unorm" || t === "depth24plus" || t === "depth24plus-stencil8" || t === "depth32float";
}
function on(t) {
  return t === "depth24plus-stencil8" || t === "stencil8";
}
function ua(t, e) {
  const n = Re(t);
  return n.filterable ? !0 : n.filterFeature && e ? e.has(n.filterFeature) : !1;
}
function ha(t, e, n) {
  const r = Re(t);
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
function rf(t, e, n = !1) {
  const r = Re(t);
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
function da(t, e, n) {
  const r = Re(t);
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
function sf(t, e) {
  if (!Re(t).copyable)
    throw new u(
      `[gpu-device-api] ${e}: "${t}" is not copy-compatible in WebGPU (its memory layout is implementation defined), so it cannot be used with CopySrc/CopyDst. Use "depth32float" for depth readback.`
    );
}
function af(t, e, n) {
  if (e !== "all") {
    if (e === "depth-only" && !ca(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "depth-only" is invalid for format "${t}", which has no depth aspect.`
      );
    if (e === "stencil-only" && !on(t))
      throw new u(
        `[gpu-device-api] ${n}: aspect "stencil-only" is invalid for format "${t}", which has no stencil aspect.`
      );
  }
}
function of(t, e, n, r) {
  Re(t);
  const i = n.sampleCount ?? 1;
  if (e & v.RenderAttachment && ha(t, n.features, r), e & v.TextureBinding && rf(t, r, i > 1), e & v.StorageBinding && da(t, n.features, r), e & (v.CopySrc | v.CopyDst) && sf(t, r), i > 1) {
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
const lf = [
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
], cf = Object.freeze({
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
function vr() {
  const e = globalThis.navigator?.gpu;
  return !e || typeof e.requestAdapter != "function" ? null : e;
}
function ni() {
  return vr() !== null;
}
async function uf(t = {}) {
  const e = vr();
  if (!e) return null;
  const n = {};
  return t.powerPreference !== void 0 && (n.powerPreference = t.powerPreference), t.forceFallbackAdapter !== void 0 && (n.forceFallbackAdapter = t.forceFallbackAdapter), t.featureLevel !== void 0 && (n.featureLevel = t.featureLevel), t.xrCompatible !== void 0 && (n.xrCompatible = t.xrCompatible), e.requestAdapter(n);
}
function pa(t) {
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
function fa(t) {
  const e = t ?? {}, n = {};
  for (const r of lf) {
    const i = e[r];
    n[r] = typeof i == "number" && Number.isFinite(i) ? i : cf[r];
  }
  return n;
}
function hf(t) {
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
function df(t, e, n) {
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
class pf {
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
function ri() {
  const t = vr();
  return t && t.getPreferredCanvasFormat() === "rgba8unorm" ? "rgba8unorm" : "bgra8unorm";
}
function ff(t) {
  const e = J(t);
  if (e !== "rgba8unorm" && e !== "bgra8unorm")
    throw new u(
      `[gpu-device-api] CanvasContext.configure: WebGPU only allows "rgba8unorm" or "bgra8unorm" as the canvas format, got "${t}".`
    );
  return e;
}
function mf(t) {
  const n = t.getContext.call(t, "webgpu");
  return !n || typeof n.getCurrentTexture != "function" ? null : n;
}
const it = {
  VERTEX: 1,
  FRAGMENT: 2,
  COMPUTE: 4
}, Lt = {
  RED: 1,
  GREEN: 2,
  BLUE: 4,
  ALPHA: 8
}, re = {
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
}, tt = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16
}, ii = {
  READ: 1,
  WRITE: 2
};
function gf(t) {
  if (!Number.isInteger(t))
    throw new u(
      `[gpu-device-api] ShaderStage visibility must be an integer bit mask, got ${String(t)}.`
    );
  if (t & -8)
    throw new u(
      `[gpu-device-api] ShaderStage visibility 0x${(t >>> 0).toString(16)} contains unknown bits; expected a combination of Vertex (0x1), Fragment (0x2) and Compute (0x4).`
    );
  let e = 0;
  if (t & L.Vertex && (e |= it.VERTEX), t & L.Fragment && (e |= it.FRAGMENT), t & L.Compute && (e |= it.COMPUTE), e === 0)
    throw new u(
      "[gpu-device-api] A BindGroupLayout entry must be visible from at least one shader stage."
    );
  return e;
}
function bf(t) {
  if (!Number.isInteger(t) || t & -16)
    throw new u(
      `[gpu-device-api] ColorWriteMask must be a combination of Red (0x1), Green (0x2), Blue (0x4) and Alpha (0x8); got ${String(t)}.`
    );
  let e = 0;
  return t & ue.Red && (e |= Lt.RED), t & ue.Green && (e |= Lt.GREEN), t & ue.Blue && (e |= Lt.BLUE), t & ue.Alpha && (e |= Lt.ALPHA), e;
}
function wf(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] BufferUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -1024)
    throw new u(
      `[gpu-device-api] BufferUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  if (t & F.MapRead && t & F.MapWrite)
    throw new u(
      "[gpu-device-api] BufferUsage cannot combine MapRead and MapWrite: WebGPU rejects a buffer that is both mappable for reading and for writing. Use two buffers (or CopyDst plus writeBuffer)."
    );
  let e = 0;
  return t & F.MapRead && (e |= re.MAP_READ), t & F.MapWrite && (e |= re.MAP_WRITE), t & F.CopySrc && (e |= re.COPY_SRC), t & F.CopyDst && (e |= re.COPY_DST), t & F.Index && (e |= re.INDEX), t & F.Vertex && (e |= re.VERTEX), t & F.Uniform && (e |= re.UNIFORM), t & F.Storage && (e |= re.STORAGE), t & F.Indirect && (e |= re.INDIRECT), t & F.QueryResolve && (e |= re.QUERY_RESOLVE), e;
}
function ma(t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] TextureUsage must be a non-empty combination of usage flags, got ${String(t)}.`
    );
  if (t & -32)
    throw new u(
      `[gpu-device-api] TextureUsage 0x${(t >>> 0).toString(16)} contains unknown bits.`
    );
  let e = 0;
  return t & v.CopySrc && (e |= tt.COPY_SRC), t & v.CopyDst && (e |= tt.COPY_DST), t & v.TextureBinding && (e |= tt.TEXTURE_BINDING), t & v.StorageBinding && (e |= tt.STORAGE_BINDING), t & v.RenderAttachment && (e |= tt.RENDER_ATTACHMENT), e;
}
function yf(t) {
  switch (t) {
    case "read":
      return ii.READ;
    case "write":
      return ii.WRITE;
    default:
      return R(t, `[gpu-device-api] Unknown MapMode "${String(t)}".`);
  }
}
function vf(t) {
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
function xf(t) {
  return t === "line-strip" || t === "triangle-strip";
}
function ga(t) {
  switch (t) {
    case "uint16":
      return "uint16";
    case "uint32":
      return "uint32";
    default:
      return R(t, `[gpu-device-api] Unknown IndexFormat "${String(t)}".`);
  }
}
function Xt(t) {
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
function xn(t) {
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
function si(t) {
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
function Sf(t) {
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
function Sn(t) {
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
function ai(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return R(t, `[gpu-device-api] Unknown FilterMode "${String(t)}".`);
  }
}
function Tf(t) {
  switch (t) {
    case "nearest":
      return "nearest";
    case "linear":
      return "linear";
    default:
      return R(t, `[gpu-device-api] Unknown mipmap filter mode "${String(t)}".`);
  }
}
function $f(t) {
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
function Pf(t) {
  switch (t) {
    case "ccw":
      return "ccw";
    case "cw":
      return "cw";
    default:
      return R(t, `[gpu-device-api] Unknown FrontFace "${String(t)}".`);
  }
}
function Tn(t) {
  switch (t) {
    case "load":
      return "load";
    case "clear":
      return "clear";
    default:
      return R(t, `[gpu-device-api] Unknown LoadOp "${String(t)}".`);
  }
}
function $n(t) {
  switch (t) {
    case "store":
      return "store";
    case "discard":
      return "discard";
    default:
      return R(t, `[gpu-device-api] Unknown StoreOp "${String(t)}".`);
  }
}
function qn(t) {
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
function xr(t) {
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
function Af(t) {
  switch (t) {
    case "vertex":
      return "vertex";
    case "instance":
      return "instance";
    default:
      return R(t, `[gpu-device-api] Unknown VertexStepMode "${String(t)}".`);
  }
}
function _f(t) {
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
function Ef(t) {
  switch (t) {
    case Xe.Occlusion:
      return "occlusion";
    case Xe.Timestamp:
      return "timestamp";
    default:
      return R(t, `[gpu-device-api] Unknown QueryType "${String(t)}".`);
  }
}
function Cf(t) {
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
function Lf(t) {
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
function Mf(t) {
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
function Rf(t) {
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
function Ff(t) {
  switch (t) {
    case "filtering":
    case "non-filtering":
    case "comparison":
      return t;
    default:
      return R(t, `[gpu-device-api] Unknown SamplerBindingType "${String(t)}".`);
  }
}
const Bf = {
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
}, Gf = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, Of = /^rgba?\(([^)]*)\)$/;
function ba(t) {
  if (t === void 0) return { r: 0, g: 0, b: 0, a: 1 };
  if (typeof t == "string") return Uf(t);
  if (typeof t == "number") return If(t);
  if (Array.isArray(t)) {
    const n = t;
    if (n.length !== 3 && n.length !== 4)
      throw new u(
        `[gpu-device-api] A clear color array needs 3 or 4 components, got ${n.length}.`
      );
    return oi(n[0], n[1], n[2], n.length === 4 ? n[3] : 1, t);
  }
  const e = t;
  if (typeof e.r != "number" || typeof e.g != "number" || typeof e.b != "number")
    throw new u(
      '[gpu-device-api] A clear color object needs numeric "r", "g" and "b" members.'
    );
  return oi(e.r, e.g, e.b, typeof e.a == "number" ? e.a : 1, t);
}
function oi(t, e, n, r, i) {
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
function If(t) {
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
function Uf(t) {
  const e = t.trim().toLowerCase(), n = Gf.exec(e);
  if (n) {
    const s = n[1];
    if (s.length === 3 || s.length === 4) {
      const h = parseInt(s[0] + s[0], 16) / 255, p = parseInt(s[1] + s[1], 16) / 255, d = parseInt(s[2] + s[2], 16) / 255, f = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
      return { r: h, g: p, b: d, a: f };
    }
    const a = parseInt(s.slice(0, 2), 16) / 255, o = parseInt(s.slice(2, 4), 16) / 255, l = parseInt(s.slice(4, 6), 16) / 255, c = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r: a, g: o, b: l, a: c };
  }
  const r = Bf[e];
  if (r) return { r: r[0], g: r[1], b: r[2], a: r[3] };
  const i = Of.exec(e);
  if (i) {
    const s = i[1].replace(/\//g, " ").split(/[\s,]+/).filter((h) => h.length > 0);
    if (s.length !== 3 && s.length !== 4)
      throw new u(
        `[gpu-device-api] Clear color "${t}" needs 3 or 4 components inside rgb()/rgba().`
      );
    const a = Pn(s[0], t), o = Pn(s[1], t), l = Pn(s[2], t), c = s.length === 4 ? Df(s[3], t) : 1;
    return { r: a, g: o, b: l, a: c };
  }
  throw new u(
    `[gpu-device-api] Unsupported clear color string "${t}". Expected "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", "rgb()/rgba()", a known color name, a 0xRRGGBB number, an array of 0..1 components, or an { r, g, b, a } object.`
  );
}
function Pn(t, e) {
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
function Df(t, e) {
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
function qe(t) {
  return {
    width: t.width,
    height: t.height,
    depthOrArrayLayers: t.depthOrArrayLayers
  };
}
function wa(t) {
  return {
    x: t?.x ?? 0,
    y: t?.y ?? 0,
    z: t?.z ?? 0
  };
}
function Vf(t) {
  return {
    offset: t.offset,
    bytesPerRow: t.bytesPerRow,
    rowsPerImage: t.rowsPerImage
  };
}
function mt(t, e) {
  if (t !== 1 && t !== 4)
    throw new u(
      `[gpu-device-api] ${e}: sampleCount must be 1 or 4, got ${String(t)} (WebGPU core only guarantees 1 and 4).`
    );
  return t;
}
class ya {
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
      usage: wf(n.usage)
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
    this.assertRange(n, i, "Buffer.mapAsync"), await this.native.mapAsync(yf(e), n, i), this._mapped = !0;
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
    if (Ee(e, `${r} offset`), Ye(n, `${r} size`), e + n > i) {
      const s = i === this.size ? `buffer "${this.label}" size ${this.size}` : `mapped range size ${i} of buffer "${this.label}"`;
      throw new u(
        `[gpu-device-api] ${r}: range [${e}, ${e + n}) exceeds ${s}.`
      );
    }
  }
}
function kf(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.mapAsync == "function" && typeof e.getMappedRange == "function" && typeof e.destroy == "function" && !("native" in e);
}
function V(t, e) {
  if (t instanceof ya) return t.native;
  if (kf(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU buffer (WebGPUBuffer or a native GPUBuffer), got ${ae(t)}.`
  );
}
function ae(t) {
  if (t === null) return "null";
  if (t === void 0) return "undefined";
  if (typeof t == "object") {
    const e = t.label;
    return typeof e == "string" && e.length > 0 ? `a resource labelled "${e}"` : `an instance of ${t.constructor?.name ?? "Object"}`;
  }
  return `${typeof t} ${String(t)}`;
}
class Sr {
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
    const i = r ?? Vt(e, n);
    this.label = n.label ?? `${e.label}#view`;
    const s = i.aspect;
    if (af(e.format, s, `Texture "${e.label}".createView`), i.baseMipLevel + i.mipLevelCount > e.mipLevelCount)
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
      dimension: qn(i.dimension),
      aspect: xr(i.aspect),
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
function va(t) {
  return t instanceof Sr;
}
function Nf(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return "native" in e || "createView" in e ? !1 : Object.prototype.toString.call(t) === "[object GPUTextureView]" ? !0 : !("texture" in e) && !("format" in e) && !("mapAsync" in e);
}
function st(t, e) {
  if (t instanceof Sr) return t.native;
  if (Nf(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture view (WebGPUTextureView or a native GPUTextureView), got ${ae(t)}.`
  );
}
class xe {
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
    const r = Zt(n.size), i = {
      label: n.label ?? `texture#${e.nextResourceId("texture")}`,
      size: r,
      mipLevelCount: n.mipLevelCount ?? 1,
      sampleCount: n.sampleCount ?? 1,
      dimension: n.dimension ?? "2d",
      format: n.format,
      usage: n.usage,
      viewFormats: n.viewFormats ?? []
    };
    qf(i, e);
    const s = e.native.createTexture({
      label: i.label,
      size: { width: r.width, height: r.height, depthOrArrayLayers: r.depthOrArrayLayers },
      mipLevelCount: i.mipLevelCount,
      sampleCount: i.sampleCount,
      dimension: i.dimension,
      format: J(i.format),
      usage: ma(i.usage),
      viewFormats: i.viewFormats.map((a) => J(a))
    });
    return new xe(e, s, i, !0);
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
      format: r.format ?? nf(n.format),
      usage: r.usage ?? n.usage,
      viewFormats: r.viewFormats ?? []
    };
    return new xe(e, n, a, i.owned ?? !1);
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
    e === void 0 ? (n = this.defaultViewResolved ?? (this.defaultViewResolved = Vt(this, {})), r = this.defaultViewKey ?? (this.defaultViewKey = li(n))) : (n = Vt(this, e), r = li(n));
    const i = this.viewCache.get(r);
    if (i) return i;
    const s = new Sr(this, e, n);
    return this.viewCache.set(r, s), this.viewList.push(s), s;
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
   * - 单采样、`mipLevelCount > 1`、`dimension: '2d'` 且只有一层（1d / 3d / 2d-array 尚未实现）；
   * - usage 必须带 `TextureUsage.RenderAttachment`，因为本方法要把它当颜色附件写；
   * - 格式必须**可渲染且可过滤**：`rgba8snorm`、`rgb9e5ufloat` 这类不可渲染的格式，以及整数
   *   格式（不能线性滤波）都走不了这条路径，需要改用 `rgba8unorm` 系列或自己上 compute。
   *
   * 这里刻意用**原生** WebGPU 对象（pipeline / bind group / encoder 都是临时的），
   * 而不是 core 的工厂：core 的 `create*` 会把资源登记到 `device` 上一直追踪到设备释放，
   * 为一次 mip 生成留下几个生命周期很长的包装对象并不划算。pipeline 按 (device, format)
   * 缓存在模块级 WeakMap 里，同一个格式只建一次。
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
    if (this.dimension !== "2d" || this.depthOrArrayLayers !== 1)
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: only single-layer 2d textures are supported, got dimension "${this.dimension}" with ${this.depthOrArrayLayers} layer(s). Generate the mip chain for each array layer separately (or use a compute shader).`
      );
    if (!(this.usage & v.RenderAttachment))
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: WebGPU has no generateMipmap, so the backend downsamples with render passes; this texture was created without the "RenderAttachment" usage. Add TextureUsage.RenderAttachment (the gfx layer does this automatically when mipmaps are requested).`
      );
    if (ha(this.format, this.device.features, `Texture "${this.label}".generateMipmaps`), !ua(this.format, this.device.features))
      throw new u(
        `[gpu-device-api] Texture "${this.label}".generateMipmaps: format "${this.format}" is not filterable on this device, so the downsampling pass cannot average 2x2 texels. Use a unorm/float format such as rgba8unorm(-srgb), bgra8unorm(-srgb), r8unorm or rg8unorm.`
      );
    const e = this.device.native, n = zf(e, this.format), r = e.createCommandEncoder({ label: `${this.label}:mipmap` });
    for (let i = 1; i < this.mipLevelCount; i++) {
      const s = this.native.createView({
        label: `${this.label}:mip${i - 1}`,
        dimension: "2d",
        baseMipLevel: i - 1,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1
      }), a = this.native.createView({
        label: `${this.label}:mip${i}`,
        dimension: "2d",
        baseMipLevel: i,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1
      }), o = e.createBindGroup({
        label: `${this.label}:mip${i}`,
        layout: n.bindGroupLayout,
        entries: [
          { binding: 0, resource: s },
          { binding: 1, resource: n.sampler }
        ]
      }), l = r.beginRenderPass({
        label: `${this.label}:mip${i}`,
        colorAttachments: [
          {
            view: a,
            // 目标级别会被完整覆盖（全屏三角形），clear 只是为了让 loadOp 合法。
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 0 }
          }
        ]
      });
      l.setPipeline(n.pipeline), l.setBindGroup(0, o), l.draw(3), l.end();
    }
    e.queue.submit([r.finish()]);
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
function li(t) {
  return Zi(
    t.format ?? "",
    t.dimension,
    t.baseMipLevel,
    t.mipLevelCount,
    t.baseArrayLayer,
    t.arrayLayerCount,
    t.aspect
  );
}
const Wf = `
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
`, ci = /* @__PURE__ */ new WeakMap(), ui = /* @__PURE__ */ new WeakMap();
function zf(t, e) {
  let n = ci.get(t);
  n || (n = /* @__PURE__ */ new Map(), ci.set(t, n));
  const r = n.get(e);
  if (r) return r;
  let i = ui.get(t);
  i || (i = t.createShaderModule({ label: "mipmap-downsample", code: Wf }), ui.set(t, i));
  const s = `mipmap-downsample:${e}`, a = t.createBindGroupLayout({
    label: s,
    entries: [
      {
        binding: 0,
        visibility: it.FRAGMENT,
        texture: { sampleType: "float", viewDimension: "2d" }
      },
      {
        binding: 1,
        visibility: it.FRAGMENT,
        sampler: { type: "filtering" }
      }
    ]
  }), o = t.createRenderPipeline({
    label: s,
    layout: t.createPipelineLayout({ label: s, bindGroupLayouts: [a] }),
    vertex: { module: i, entryPoint: "vsMain" },
    fragment: {
      module: i,
      entryPoint: "fsMain",
      targets: [{ format: J(e) }]
    },
    primitive: { topology: "triangle-list" }
  }), l = t.createSampler({
    label: "mipmap-downsample",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "nearest"
  }), c = { pipeline: o, bindGroupLayout: a, sampler: l };
  return n.set(e, c), c;
}
function qf(t, e) {
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
  const s = zi(t.size);
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
  of(
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
function hi(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.createView == "function" && typeof e.destroy == "function" && !("native" in e);
}
function xa(t, e) {
  if (t instanceof xe) return t.native;
  if (hi(t)) return t;
  const n = t?.native;
  if (n !== void 0 && hi(n)) return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU texture (WebGPUTexture or a native GPUTexture), got ${ae(t)}.`
  );
}
class Tr {
  label;
  descriptor;
  native;
  device;
  _disposed = !1;
  constructor(e, n = {}) {
    this.device = e, this.label = n.label ?? `sampler#${e.nextResourceId("sampler")}`;
    const r = qi(n);
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
      addressModeU: Sn(r.addressModeU),
      addressModeV: Sn(r.addressModeV),
      addressModeW: Sn(r.addressModeW),
      magFilter: ai(r.magFilter),
      minFilter: ai(r.minFilter),
      mipmapFilter: Tf(r.mipmapFilter),
      lodMinClamp: r.lodMinClamp,
      lodMaxClamp: r.lodMaxClamp,
      maxAnisotropy: r.maxAnisotropy
    };
    r.compare !== void 0 && (i.compare = Xt(r.compare)), this.native = e.native.createSampler(i);
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
function jf(t) {
  return t instanceof Tr;
}
function Qf(t) {
  return !t || typeof t != "object" || "native" in t ? !1 : Object.prototype.toString.call(t) === "[object GPUSampler]";
}
function Xf(t, e) {
  if (t instanceof Tr) return t.native;
  if (Qf(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU sampler (WebGPUSampler or a native GPUSampler).`
  );
}
class Sa {
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
  constructor(e, n) {
    if (this.device = e, this.label = n.label ?? `shader#${e.nextResourceId("shader")}`, this.source = ji(n.code), this.defines = { ...n.defines ?? {} }, this.glsl = n.glsl ? { ...n.glsl } : {}, this.source.wgsl === void 0 && this.source.vs === void 0 && this.source.fs === void 0 && this.source.cs === void 0)
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
    return ct({
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
  async getCompilationInfo(e = L.Vertex) {
    const n = this.compile(e), r = this.compilationInfos.get(n);
    if (r) return r;
    const i = n;
    if (typeof i.getCompilationInfo != "function") {
      const o = ye({
        label: this.label,
        backend: "webgpu",
        messages: [
          ve({
            type: "info",
            message: "this WebGPU implementation does not expose GPUShaderModule.getCompilationInfo(); shader diagnostics are unavailable on this backend",
            label: this.label,
            backend: "webgpu"
          })
        ]
      });
      return this.compilationInfos.set(n, o), o;
    }
    const s = await i.getCompilationInfo(), a = ye({
      label: this.label,
      backend: "webgpu",
      messages: s.messages.map(
        (o) => ve({
          type: Yf(o.type),
          message: o.message,
          lineNum: o.lineNum,
          linePos: o.linePos,
          label: this.label,
          backend: "webgpu",
          stage: e
        })
      )
    });
    return this.compilationInfos.set(n, a), a;
  }
}
function Yf(t) {
  return t === "error" || t === "warning" || t === "info" ? t : "info";
}
function at(t, e) {
  if (t instanceof Sa) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPUShaderModule created by this device, got ${ae(t)}.`
  );
}
const te = "timestamp-query", je = [
  "timestamp-query-inside-passes",
  "chromium-experimental-timestamp-query-inside-passes"
];
class Ta {
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
    if (n.type === Xe.Timestamp && !e.hasEnabledFeature(te))
      throw new u(
        `[gpu-device-api] QuerySet "${this.label}": timestamp queries need the "${te}" device feature, but it is not enabled on this device. Pass it in DeviceDescriptor.requiredFeatures (available on the adapter: ${e.features.has(te) ? "yes" : "no"}).`
      );
    this.type = n.type, this.count = n.count, this.native = e.native.createQuerySet({
      label: this.label,
      type: Ef(n.type),
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
function ut(t, e) {
  if (t instanceof Ta) return t.native;
  if (t && typeof t == "object" && !("native" in t)) {
    const n = t;
    if (typeof n.destroy == "function" && typeof n.count == "number")
      return t;
  }
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU query set (WebGPUQuerySet or a native GPUQuerySet).`
  );
}
function $a(t, e, n) {
  if (Qi(t, n), !e.hasEnabledFeature(te))
    throw new u(
      `[gpu-device-api] ${n}: writing timestamps inside a pass needs the "${te}" device feature, but it is not enabled on this device.`
    );
  if (je.find((s) => e.hasEnabledFeature(s)) === void 0)
    throw new u(
      `[gpu-device-api] ${n}: this WebGPU implementation does not enable "${je[0]}" (tried: ${je.join(", ")}), so timestamps cannot be written inside a pass. Use CommandEncoder.writeTimestamp() around the pass instead, which only needs "timestamp-query" (that is what gfx GPU timing does).`
    );
  const i = {
    querySet: ut(t.querySet, `${n}.querySet`)
  };
  return t.beginningOfPassWriteIndex !== void 0 && (i.beginningOfPassWriteIndex = t.beginningOfPassWriteIndex), t.endOfPassWriteIndex !== void 0 && (i.endOfPassWriteIndex = t.endOfPassWriteIndex), i;
}
class Hf {
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
class Pa {
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
      r = Xi(n.entries);
    } catch (s) {
      throw new u(
        `[gpu-device-api] BindGroupLayout "${this.label}": ${s instanceof Error ? s.message : String(s)}`
      );
    }
    this.sortedEntries = r, this.entries = n.entries, this.byBinding = new Map(r.map((s) => [s.binding, s]));
    const i = r.map(
      (s) => Zf(s, e, this.label)
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
function Zf(t, e, n) {
  const r = `BindGroupLayout "${n}" binding ${t.binding}`, i = {
    binding: t.binding,
    visibility: gf(t.visibility)
  };
  if (Ni(t.type)) {
    const s = t.buffer ?? {};
    if (s.type !== void 0 && s.type !== t.type)
      throw new u(
        `[gpu-device-api] ${r}: buffer.type "${s.type}" contradicts the entry type "${t.type}".`
      );
    return i.buffer = {
      type: Cf(t.type),
      hasDynamicOffset: s.hasDynamicOffset ?? !1,
      minBindingSize: s.minBindingSize ?? 0
    }, i;
  }
  if (Wi(t.type)) {
    const s = t.sampler ?? {}, a = Lf(t.type);
    return i.sampler = {
      type: s.type === void 0 ? a : Ff(s.type)
    }, i;
  }
  if (t.type === D.Texture) {
    const s = t.texture ?? {}, a = s.sampleType ?? "float", o = s.viewDimension ?? "2d";
    if (a === "depth" && (o === "1d" || o === "3d"))
      throw new u(
        `[gpu-device-api] ${r}: sampleType "depth" cannot be combined with viewDimension "${o}" (use "2d", "2d-array", "cube" or "cube-array").`
      );
    return i.texture = {
      sampleType: Mf(a),
      viewDimension: qn(o),
      multisampled: s.multisampled ?? !1
    }, i;
  }
  if (t.type === D.StorageTexture) {
    const s = t.storageTexture;
    if (!s || s.format === void 0)
      throw new u(
        `[gpu-device-api] ${r}: a storage-texture entry needs \`storageTexture.format\`.`
      );
    return da(s.format, e.features, r), i.storageTexture = {
      access: Rf(s.access ?? "write-only"),
      format: J(s.format),
      viewDimension: qn(s.viewDimension ?? "2d")
    }, i;
  }
  throw new u(
    `[gpu-device-api] ${r}: unsupported BindingType "${String(t.type)}".`
  );
}
function Aa(t, e) {
  if (t instanceof Pa) return t.native;
  if (Kf(t)) return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group layout (WebGPUBindGroupLayout or a native GPUBindGroupLayout).`
  );
}
function Kf(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  return typeof e.label == "string" && !("native" in e);
}
class _a {
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
    const r = Aa(this.layout, `BindGroup "${this.label}"`), i = n.entries.map(
      (s) => Jf(s, this.layout, e, this.label)
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
function Jf(t, e, n, r) {
  const i = `BindGroup "${r}" binding ${t.binding}`, s = e.entry(t.binding);
  if (!s)
    throw new u(`[gpu-device-api] ${i}: no matching layout entry.`);
  const a = t.resource;
  if (Ni(s.type)) {
    if (!("buffer" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" buffer binding, but the resource is ${ae(a)}.`
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
    const p = { buffer: o, offset: l, size: c };
    return { binding: t.binding, resource: p };
  }
  if (Wi(s.type)) {
    if (!("sampler" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "${s.type}" sampler binding, but the resource is ${ae(a)}.`
      );
    const o = a.sampler, l = (s.sampler?.type ?? (s.type === "comparison-sampler" ? "comparison" : "filtering")) === "comparison";
    if (jf(o)) {
      if (l && !o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a comparison sampler, but the bound sampler has no \`compare\` function.`
        );
      if (!l && o.isComparison)
        throw new u(
          `[gpu-device-api] ${i}: layout declares a filtering/non-filtering sampler, but the bound sampler is a comparison sampler (it has \`compare\`).`
        );
    }
    return { binding: t.binding, resource: Xf(o, i) };
  }
  if (s.type === "texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "texture" binding, but the resource is ${ae(a)}.`
      );
    return em(a.view, s, n, i), { binding: t.binding, resource: st(a.view, i) };
  }
  if (s.type === "storage-texture") {
    if (!("view" in a))
      throw new u(
        `[gpu-device-api] ${i}: layout declares a "storage-texture" binding, but the resource is ${ae(a)}.`
      );
    if (va(a.view)) {
      const o = s.storageTexture?.format;
      if (o !== void 0 && J(a.view.format) !== J(o))
        throw new u(
          `[gpu-device-api] ${i}: layout requires storage texture format "${o}", but the bound view has format "${a.view.format}".`
        );
    }
    return { binding: t.binding, resource: st(a.view, i) };
  }
  if ("source" in a)
    return { binding: t.binding, resource: a.source };
  throw new u(
    `[gpu-device-api] ${i}: unsupported binding resource ${ae(a)}.`
  );
}
function em(t, e, n, r) {
  if (!va(t)) return;
  const i = e.texture ?? {}, s = t.format, a = Re(s), o = i.sampleType ?? "float";
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
    if (o === "float" && !ua(s, n.features))
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
const Ea = Object.freeze([]), di = /* @__PURE__ */ new WeakMap();
function tm(t, e) {
  const n = di.get(t);
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
  return di.set(t, s), s;
}
function Ca(t, e, n, r) {
  const i = tm(t.layout, n);
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
function La(t, e) {
  if (t instanceof _a) return t.native;
  if (t && typeof t == "object" && !("native" in t) && typeof t.label == "string")
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU bind group (WebGPUBindGroup or a native GPUBindGroup).`
  );
}
class ht {
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
        (s) => Aa(s, `PipelineLayout "${r}"`)
      )
    });
    return new ht(r, n.bindGroupLayouts, i, !1, e);
  }
  /** `layout: 'auto'` 的替身：`native` 为字符串 `'auto'`，`isAuto` 为 true。 */
  static auto(e = "auto") {
    return new ht(e, [], "auto", !0, null);
  }
  get disposed() {
    return this._disposed;
  }
  /** GPUPipelineLayout 没有 destroy；释放只是把本包装对象标记为不可用。 */
  dispose() {
    this._disposed = !0, this.device?.untrack(this);
  }
}
function Ma(t, e) {
  if (t === void 0 || t === "auto") return "auto";
  if (t instanceof ht) return t.native;
  const n = t.native;
  if (n === "auto") return "auto";
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU pipeline layout (or 'auto'), got an unknown layout object.`
  );
}
const nm = "uint32";
class se {
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
    const r = e?.topology ?? hn.topology, i = {
      topology: vf(r),
      frontFace: Pf(e?.frontFace ?? hn.frontFace),
      cullMode: $f(e?.cullMode ?? hn.cullMode)
    };
    if (xf(r))
      i.stripIndexFormat = ga(e?.stripIndexFormat ?? nm);
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
  static toGPUDepthStencilState(e, n) {
    const r = ca(e), i = on(e);
    if (!r && !i)
      throw new u(
        `[gpu-device-api] DepthStencilState: "${e}" has neither a depth nor a stencil aspect.`
      );
    const s = { format: J(e) };
    return se.usesDepthStencil(n) ? (r && (s.depthWriteEnabled = n?.depthWriteEnabled ?? _r.depthWriteEnabled, s.depthCompare = Xt(n?.depthCompare ?? _r.depthCompare)), i && (s.stencilFront = Mt(n?.stencilFront), s.stencilBack = Mt(n?.stencilBack), s.stencilReadMask = n?.stencilReadMask ?? 4294967295, s.stencilWriteMask = n?.stencilWriteMask ?? 4294967295), n?.depthBias !== void 0 && (s.depthBias = n.depthBias), n?.depthBiasSlopeScale !== void 0 && (s.depthBiasSlopeScale = n.depthBiasSlopeScale), n?.depthBiasClamp !== void 0 && (s.depthBiasClamp = n.depthBiasClamp), s) : (r && (s.depthWriteEnabled = !1, s.depthCompare = Xt("always")), i && (s.stencilFront = Mt(void 0), s.stencilBack = Mt(void 0), s.stencilReadMask = 4294967295, s.stencilWriteMask = 0), s);
  }
  /** 把 core 的 `MultisampleState` 翻译为 WebGPU 的 `GPUMultisampleState`。 */
  static toGPUMultisampleState(e, n) {
    const r = mt(e?.count ?? n, "MultisampleState.count"), i = { count: r, mask: e?.mask ?? 4294967295 }, s = e?.alphaToCoverageEnabled ?? !1;
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
        color: pi(e.color),
        alpha: pi(e.alpha)
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
      const o = { format: J(a?.format ?? i) }, l = a?.blend ?? r.blend;
      l && (o.blend = se.toGPUBlendState(l));
      const c = a?.writeMask ?? r.writeMask;
      return c !== void 0 && (o.writeMask = bf(c)), o;
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
        Yi(r, n);
      } catch (i) {
        throw new u(
          `[gpu-device-api] RenderPipeline: ${i instanceof Error ? i.message : String(i)}`
        );
      }
      return {
        arrayStride: r.arrayStride,
        stepMode: Af(r.stepMode ?? "vertex"),
        attributes: r.attributes.map((i) => ({
          shaderLocation: i.shaderLocation,
          offset: i.offset,
          format: _f(i.format)
        }))
      };
    });
  }
}
function pi(t) {
  const e = { ...po, ...t };
  return {
    operation: Sf(e.operation ?? "add"),
    srcFactor: si(e.srcFactor),
    dstFactor: si(e.dstFactor)
  };
}
function Mt(t) {
  return {
    compare: Xt(t?.compare ?? vt.compare),
    failOp: xn(t?.failOp ?? vt.failOp),
    depthFailOp: xn(t?.depthFailOp ?? vt.depthFailOp),
    passOp: xn(t?.passOp ?? vt.passOp)
  };
}
class rm {
  cache;
  created = /* @__PURE__ */ new Set();
  _disposed = !1;
  constructor(e = 64, n) {
    this.cache = mo(e, (r, i) => {
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
function An(t) {
  return Zi(
    t.colorFormats.join(","),
    t.sampleCount,
    t.depthFormat ?? "none",
    Hi(t.vertexLayouts)
  );
}
const im = "vsMain", sm = "fsMain", _n = Object.freeze({}), am = [], om = [];
class $r {
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
    this.device = e, this.descriptor = n, this.label = n.label ?? `renderPipeline#${e.nextResourceId("renderPipeline")}`, this.layout = n.layout ?? "auto", this.vertexLayouts = n.vertex.buffers ?? null, this.logger = pt(`webgpu:${this.label}`), this.sampleCountContext = `RenderPipeline "${this.label}": sampleCount`, this.cache = new rm(64, (r, i) => {
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
  resolve(e = _n) {
    if (this._disposed)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`
      );
    let n, r;
    return e === this.lastVariantInput && e.colorFormats === this.lastVariantColorFormats && e.sampleCount === this.lastVariantSampleCount && e.depthFormat === this.lastVariantDepthFormat && e.vertexLayouts === this.lastVariantVertexLayouts && this.lastVariantResolved !== null && this.lastVariantKey !== null ? (n = this.lastVariantResolved, r = this.lastVariantKey) : (n = this.resolveVariant(e), r = An(n), this.lastVariantInput = e, this.lastVariantColorFormats = e.colorFormats, this.lastVariantSampleCount = e.sampleCount, this.lastVariantDepthFormat = e.depthFormat, this.lastVariantVertexLayouts = e.vertexLayouts, this.lastVariantResolved = n, this.lastVariantKey = r), this.cache.resolve(r, () => this.createNative(n));
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
  async prewarm(e = _n, n = {}) {
    const r = k();
    if (this._disposed)
      throw new u(`[gpu-device-api] RenderPipeline "${this.label}" has been disposed.`);
    const i = this.resolveVariant(e), s = An(i);
    if (this.cache.has(s)) {
      const b = await this.getCompilationInfo();
      return {
        label: this.label,
        backend: "webgpu",
        ok: !b.hasErrors,
        mode: "async",
        reason: null,
        durationMs: k() - r,
        info: b
      };
    }
    const a = this.toGPURenderPipelineDescriptor(i), o = this.device.native, l = o.createRenderPipelineAsync;
    let c = "async", h = null, p = null, d = null;
    typeof l != "function" && (c = "sync", h = "this WebGPU implementation does not expose GPUDevice.createRenderPipelineAsync(), so the pipeline was created synchronously and the compile cost stayed on the calling thread");
    try {
      typeof l == "function" ? p = await Ki(
        l.call(o, a),
        n.timeoutMs ?? Yn,
        `createRenderPipelineAsync("${this.label}")`
      ) : p = this.device.native.createRenderPipeline(a);
    } catch (b) {
      d = b instanceof Error ? b.message : String(b), h === null && (h = d);
    }
    p !== null && !this.cache.has(s) && this.cache.set(s, p);
    const f = await this.collectCompilationInfo(d), m = p !== null && d === null, g = {
      label: this.label,
      backend: "webgpu",
      ok: m,
      mode: c,
      // 成功且是真异步时没有需要解释的东西；退化路径与失败路径都必须给出原因。
      reason: m ? c === "sync" ? h : null : d ?? "shader compilation reported errors",
      durationMs: k() - r,
      info: f
    };
    if (!g.ok && n.throwOnError)
      throw new u(Xn(f));
    return g;
  }
  /**
   * 编译诊断：把 vertex / fragment 两个 `GPUShaderModule` 的 `getCompilationInfo()` 合起来。
   *
   * WGSL 一份源码包含所有 entry point，诊断内容与 variant 无关，所以这里不需要 variant 参数
   *（保留它只是为了与 `resolve()` / `prewarm()` 的签名对齐）。
   */
  async getCompilationInfo(e = _n) {
    return this.collectCompilationInfo(null);
  }
  /** 取两个阶段的诊断并合并；`failure` 是 `createRenderPipelineAsync` 抛出的原文。 */
  async collectCompilationInfo(e) {
    const n = [], r = /* @__PURE__ */ new Set(), i = async (o, l, c) => {
      if (r.has(o)) return;
      r.add(o);
      const h = at(o, c);
      typeof h.getCompilationInfo == "function" && n.push(await h.getCompilationInfo(l));
    };
    await i(this.descriptor.vertex.module, L.Vertex, `RenderPipeline "${this.label}".vertex.module`);
    const s = this.descriptor.fragment;
    s && await i(
      s.module,
      L.Fragment,
      `RenderPipeline "${this.label}".fragment.module`
    );
    const a = go(this.label, "webgpu", n);
    return e === null ? a : {
      ...a,
      messages: [
        ...a.messages,
        ve({
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
    this._disposed || (this._disposed = !0, this.cache.dispose(), this.device.untrack(this));
  }
  resolveVariant(e) {
    const n = this.descriptor, r = e.colorFormats ?? this.defaultColorFormats(), i = mt(
      e.sampleCount ?? n.multisample?.count ?? n.render?.multisample?.count ?? 1,
      this.sampleCountContext
    ), s = e.depthFormat !== void 0 ? e.depthFormat : n.depthStencil?.format ?? null, a = n.depthStencil ?? n.render?.depthStencil, o = e.vertexLayouts ?? this.vertexLayouts ?? am;
    if (n.fragment && r.length === 0)
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has a fragment stage but no color formats. Declare \`colorFormats\` on the descriptor, or pass them per target via resolve({ colorFormats }) — the WebGPU backend cannot guess attachment formats.`
      );
    if (!n.fragment && (s === null || !se.usesDepthStencil(a)))
      throw new u(
        `[gpu-device-api] RenderPipeline "${this.label}" has neither a fragment stage nor a depthStencil state, so WebGPU cannot create a pipeline that writes to nothing. Declare \`depthStencil\` (for a depth-only pipeline, e.g. { depthWriteEnabled: true } — its format comes from the render target) or add a fragment stage. Note that omitting \`depthStencil\` or passing \`{ format: null }\` means "this pipeline does not use depth", it does not enable depth testing.`
      );
    o.length === 0 && !this.warnedMissingVertexLayouts && (this.warnedMissingVertexLayouts = !0, this.logger.debug(
      "building with no vertex buffer layouts; declare `vertex.buffers` if the vertex shader reads attributes"
    ));
    for (const l of r)
      J(l);
    return s !== null && J(s), { colorFormats: r, sampleCount: i, depthFormat: s, vertexLayouts: o };
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
      r = i && s.length === i.length ? s : om;
    }
    return this.defaultColorFormatsCache = r, r;
  }
  createNative(e) {
    const n = this.toGPURenderPipelineDescriptor(e);
    return this.logger.debug(`creating render pipeline variant ${An(e)}`), this.device.native.createRenderPipeline(n);
  }
  /** 组装 `GPURenderPipelineDescriptor`；导出的目的是方便单测与调试。 */
  toGPURenderPipelineDescriptor(e) {
    const n = this.descriptor, r = this.device.limits, i = n.vertex, a = {
      module: at(i.module, `RenderPipeline "${this.label}".vertex.module`).compile(L.Vertex),
      entryPoint: i.entryPoint ?? im,
      buffers: se.toGPUVertexBufferLayouts(e.vertexLayouts, r)
    }, o = n.fragment;
    let l;
    o && (l = {
      module: at(
        o.module,
        `RenderPipeline "${this.label}".fragment.module`
      ).compile(L.Fragment),
      entryPoint: o.entryPoint ?? sm,
      targets: se.toGPUColorTargets(e.colorFormats, o.targets, {
        blend: n.render?.blend,
        writeMask: n.render?.writeMask
      })
    });
    const c = n.primitive ?? n.render?.primitive, h = n.depthStencil ?? n.render?.depthStencil, p = n.multisample ?? n.render?.multisample, d = e.depthFormat, f = {
      label: this.label,
      layout: Ma(this.layout, `RenderPipeline "${this.label}"`),
      vertex: a,
      primitive: se.toGPUPrimitiveState(c, this.device.features),
      multisample: se.toGPUMultisampleState(p, e.sampleCount)
    };
    return l && (f.fragment = l), d !== null ? (f.depthStencil = se.toGPUDepthStencilState(d, h), h && !se.usesDepthStencil(h) && this.logger.debug("depthStencil declared without a format; emitting an always-pass, no-write state")) : h && this.logger.debug("depthStencil state declared but the variant has no depth format; ignoring it"), f;
  }
}
function lm(t, e, n) {
  if (t instanceof $r) return t.resolve(n);
  const r = t?.native;
  if (r && typeof r == "object" && typeof r.getBindGroupLayout == "function")
    return r;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU render pipeline (WebGPURenderPipeline or a native GPURenderPipeline).`
  );
}
const cm = "csMain";
class Ra {
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
    const n = k();
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
        durationMs: k() - n,
        info: f
      };
    }
    const r = this.toGPUComputePipelineDescriptor(), i = this.device.native, s = i.createComputePipelineAsync;
    let a = "async", o = null, l = null, c = null;
    typeof s != "function" && (a = "sync", o = "this WebGPU implementation does not expose GPUDevice.createComputePipelineAsync(), so the pipeline was created synchronously and the compile cost stayed on the calling thread");
    try {
      typeof s == "function" ? l = await Ki(
        s.call(i, r),
        e.timeoutMs ?? Yn,
        `createComputePipelineAsync("${this.label}")`
      ) : l = this.device.native.createComputePipeline(r);
    } catch (f) {
      c = f instanceof Error ? f.message : String(f), o === null && (o = c);
    }
    l !== null && this._native === null && (this._native = l);
    const h = await this.collectCompilationInfo(c), p = l !== null && c === null, d = {
      label: this.label,
      backend: "webgpu",
      ok: p,
      mode: a,
      reason: p ? a === "sync" ? o : null : c ?? "shader compilation reported errors",
      durationMs: k() - n,
      info: h
    };
    if (!d.ok && e.throwOnError)
      throw new u(Xn(h));
    return d;
  }
  /** 编译诊断：转发 `GPUShaderModule.getCompilationInfo()`。 */
  async getCompilationInfo() {
    return this.collectCompilationInfo(null);
  }
  /** 组装 `GPUComputePipelineDescriptor`（预热与 `resolve()` 走同一份，避免两处漂移）。 */
  toGPUComputePipelineDescriptor() {
    const e = at(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    );
    return {
      label: this.label,
      layout: Ma(this.layout, `ComputePipeline "${this.label}"`),
      compute: {
        module: e.compile(L.Compute),
        entryPoint: this.descriptor.compute.entryPoint ?? cm
      }
    };
  }
  async collectCompilationInfo(e) {
    const n = at(
      this.descriptor.compute.module,
      `ComputePipeline "${this.label}".compute.module`
    ), r = typeof n.getCompilationInfo == "function" ? await n.getCompilationInfo(L.Compute) : bo(this.label, "webgpu");
    return e === null ? r : {
      ...r,
      messages: [
        ...r.messages,
        ve({
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
function um(t, e) {
  if (t instanceof Ra) return t.resolve();
  const n = t?.native;
  if (n && typeof n == "object") return n;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU compute pipeline (WebGPUComputePipeline or a native GPUComputePipeline).`
  );
}
const hm = [0, 0, 0, 1];
class Fa {
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
    const r = dm(n.color);
    if (this.colorFormatsList = r, this.depthFormatValue = n.depth === void 0 || n.depth === !1 || n.depth === null ? null : n.depth === !0 ? "depth24plus" : n.depth, this.sampleCountValue = mt(n.sampleCount ?? 1, `RenderTarget "${this.label}"`), this.mipLevelCountValue = n.mipLevelCount ?? 1, this.baseUsage = n.usage ?? 0, this.sampled = n.sampled ?? !1, this._width = Rt(n.width, "width", this.label), this._height = Rt(n.height, "height", this.label), this.colorFormatsList.length === 0 && this.depthFormatValue === null)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}" needs at least one color format or a depth format.`
      );
    if (this.sampleCountValue > 1 && this.mipLevelCountValue > 1)
      throw new u(
        `[gpu-device-api] RenderTarget "${this.label}": a multisampled target must have exactly one mip level.`
      );
    if (this.depthFormatValue !== null && !no(this.depthFormatValue))
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
  rowOrder = Ji.TopLeft;
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
    const r = Rt(e, "width", this.label), i = Rt(n, "height", this.label);
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
    const i = r === void 0 ? hm : r;
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
    return on(this.depthFormatValue) && (r.stencilLoadOp = e ?? "clear", r.stencilStoreOp = "store", r.stencilClearValue = 0, r.stencilReadOnly = !1), r;
  }
}
function dm(t) {
  return t === void 0 ? ["rgba8unorm"] : typeof t == "string" ? [t] : t.length === 0 ? [] : t;
}
function Rt(t, e, n) {
  if (t === void 0) return 1;
  if (!Number.isInteger(t) || t <= 0)
    throw new u(
      `[gpu-device-api] RenderTarget "${n}": ${e} must be a positive integer, got ${String(t)}.`
    );
  return t;
}
function pm(t, e) {
  const n = t.label ?? "renderPass";
  let r, i;
  if (t.target) {
    if (!(t.target instanceof Fa))
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
    const p = st(h.view, `${n}.colorAttachments`), d = h.view.texture;
    s.push(h.view.descriptor.format ?? d.format), o.push(d.sampleCount);
    const f = h.loadOp ?? "clear", m = h.storeOp ?? "store";
    if (d.sampleCount > 1 && !h.resolveTarget && m !== "discard")
      throw new u(
        `[gpu-device-api] ${n}: a multisampled color attachment (sampleCount ${d.sampleCount}) needs a resolveTarget, or storeOp must be "discard".`
      );
    const g = {
      view: p,
      loadOp: Tn(f),
      storeOp: $n(m)
    };
    h.resolveTarget && (g.resolveTarget = st(h.resolveTarget, `${n}.resolveTarget`)), f === "clear" && (g.clearValue = ba(h.clearValue)), a.push(g);
  }
  const l = { label: n, colorAttachments: a };
  let c = null;
  if (i) {
    const h = st(i.view, `${n}.depthStencilAttachment`), p = i.view.descriptor.format ?? i.view.texture.format;
    c = p, o.push(i.view.texture.sampleCount);
    const d = { view: h }, f = i.depthLoadOp ?? "clear", m = i.depthStoreOp ?? "store";
    if (d.depthLoadOp = Tn(f), d.depthStoreOp = $n(m), f === "clear" && (d.depthClearValue = mm(i.depthClearValue ?? 1, n)), i.depthReadOnly !== void 0 && (d.depthReadOnly = i.depthReadOnly), on(p)) {
      const g = i.stencilLoadOp ?? f;
      d.stencilLoadOp = Tn(g), d.stencilStoreOp = $n(i.stencilStoreOp ?? "store"), g === "clear" && (d.stencilClearValue = i.stencilClearValue ?? 0), i.stencilReadOnly !== void 0 && (d.stencilReadOnly = i.stencilReadOnly);
    } else if (i.stencilLoadOp !== void 0 || i.stencilStoreOp !== void 0)
      throw new u(
        `[gpu-device-api] ${n}: depth format "${p}" has no stencil aspect, so stencilLoadOp / stencilStoreOp must not be set.`
      );
    l.depthStencilAttachment = d;
  }
  return t.occlusionQuerySet && (l.occlusionQuerySet = ut(t.occlusionQuerySet, `${n}.occlusionQuerySet`)), t.timestampWrites && (l.timestampWrites = $a(
    t.timestampWrites,
    e,
    `${n}.timestampWrites`
  )), {
    native: l,
    hasOcclusionQuerySet: t.occlusionQuerySet !== void 0,
    layout: {
      colorFormats: s,
      depthFormat: c,
      sampleCount: fm(o, n)
    }
  };
}
function fm(t, e) {
  if (t.length === 0) return 1;
  const n = t[0];
  for (const r of t)
    if (r !== n)
      throw new u(
        `[gpu-device-api] ${e}: all attachments of a render pass must share the same sampleCount, got ${t.join(", ")}.`
      );
  return n;
}
function mm(t, e) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new u(
      `[gpu-device-api] ${e}: depthClearValue must be within [0, 1], got ${String(t)}.`
    );
  return t;
}
class gm {
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
    this.assertOpen("setPipeline"), this.native.setPipeline(lm(e, this.contextSetPipeline, this.variantRequest));
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Ca(n, r, this.device, this.contextSetBindGroup), this.native.setBindGroup(
        e,
        La(n, this.contextSetBindGroup),
        r ?? Ea
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
    this.native.setVertexBuffer(e, V(n, this.contextSetVertexBuffer), r, i);
  }
  setIndexBuffer(e, n, r, i) {
    this.assertOpen("setIndexBuffer"), this.native.setIndexBuffer(
      V(e, this.contextSetIndexBuffer),
      ga(n),
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
    this.assertOpen("setBlendConstant"), this.native.setBlendConstant(ba(e));
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
    const r = fi(e, n, this.contextDrawIndirect);
    this.native.drawIndirect(r.buffer, r.offset);
  }
  drawIndexedIndirect(e, n = 0) {
    this.assertOpen("drawIndexedIndirect");
    const r = fi(e, n, this.contextDrawIndexedIndirect);
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
function fi(t, e, n) {
  return "indirectBuffer" in t ? {
    buffer: V(t.indirectBuffer, n),
    offset: t.indirectOffset ?? 0
  } : { buffer: V(t, n), offset: e };
}
function bm(t, e) {
  const n = t?.label ?? "computePass", r = { label: n };
  return t?.timestampWrites && (r.timestampWrites = $a(
    t.timestampWrites,
    e,
    `${n}.timestampWrites`
  )), r;
}
class wm {
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
    this.assertOpen("setPipeline"), this.native.setPipeline(um(e, this.contextSetPipeline));
  }
  setBindGroup(e, n, r) {
    if (this.assertOpen("setBindGroup"), n) {
      Ca(n, r, this.device, this.contextSetBindGroup), this.native.setBindGroup(
        e,
        La(n, this.contextSetBindGroup),
        r ?? Ea
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
        V(e.indirectBuffer, r),
        e.indirectOffset ?? 0
      );
      return;
    }
    this.native.dispatchWorkgroupsIndirect(V(e, r), n);
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
class ym {
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
    const { native: n, layout: r, hasOcclusionQuerySet: i } = pm(e, this.device), s = e.label ?? this.label, a = new gm(
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
    const n = bm(e, this.device), r = e?.label ?? this.label, i = new wm(
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
      V(e, `${this.label}.copyBufferToBuffer(source)`),
      n,
      V(r, `${this.label}.copyBufferToBuffer(destination)`),
      i,
      s
    );
  }
  copyBufferToTexture(e, n, r) {
    this.assertRecording("copyBufferToTexture"), this.native.copyBufferToTexture(
      {
        buffer: V(e.buffer, `${this.label}.copyBufferToTexture(source)`),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      Ft(n, `${this.label}.copyBufferToTexture(destination)`),
      qe(r)
    );
  }
  copyTextureToBuffer(e, n, r) {
    this.assertRecording("copyTextureToBuffer"), this.native.copyTextureToBuffer(
      Ft(e, `${this.label}.copyTextureToBuffer(source)`),
      {
        buffer: V(n.buffer, `${this.label}.copyTextureToBuffer(destination)`),
        offset: n.offset ?? 0,
        bytesPerRow: n.bytesPerRow,
        rowsPerImage: n.rowsPerImage
      },
      qe(r)
    );
  }
  copyTextureToTexture(e, n, r) {
    this.assertRecording("copyTextureToTexture"), this.native.copyTextureToTexture(
      Ft(e, `${this.label}.copyTextureToTexture(source)`),
      Ft(n, `${this.label}.copyTextureToTexture(destination)`),
      qe(r)
    );
  }
  /** 将 buffer 的一段范围清零。`size` 省略时清到末尾，但必须是 4 的倍数。 */
  clearBuffer(e, n = 0, r) {
    this.assertRecording("clearBuffer"), Ee(n, `${this.label}.clearBuffer offset`);
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
      V(e, `${this.label}.clearBuffer`),
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
    Ee(n, `${a} firstQuery`), Ye(r, `${a} queryCount`), Ee(s, `${a} destinationOffset`), this.native.resolveQuerySet(
      ut(e, `${a}(querySet)`),
      n,
      r,
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
  writeTimestamp(e, n) {
    this.assertRecording("writeTimestamp");
    const r = `${this.label}.writeTimestamp`, i = this.native.writeTimestamp;
    if (typeof i != "function")
      throw new u(
        `[gpu-device-api] ${r}: this WebGPU implementation does not expose GPUCommandEncoder.writeTimestamp(). Use RenderPassDescriptor.timestampWrites instead (it needs "timestamp-query-inside-passes"), or read GPU time from the backend's own profiler.`
      );
    if (!this.device.hasEnabledFeature(te))
      throw new u(
        `[gpu-device-api] ${r}: timestamp queries need the "${te}" device feature; request it in DeviceDescriptor.requiredFeatures.`
      );
    if (this.openPass && !this.openPass.ended)
      throw new u(
        `[gpu-device-api] ${r}: a pass is still open. Call end() on it before writing a timestamp.`
      );
    if (!Number.isInteger(n) || n < 0 || n >= e.count)
      throw new u(
        `[gpu-device-api] ${r}: queryIndex ${String(n)} is outside the query set range [0, ${e.count}).`
      );
    i.call(this.native, ut(e, `${r}(querySet)`), n);
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
    return this.assertRecording("finish"), this.closeOpenPass(), this._finished = !0, new Ba(this.label, this.native.finish());
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
class Ba {
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
function Ft(t, e) {
  const n = {
    texture: xa(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = wa(t.origin)), t.aspect !== void 0 && (n.aspect = xr(t.aspect)), n;
}
function vm(t, e) {
  if (t instanceof Ba) return t.native;
  if (t && typeof t == "object" && !("native" in t))
    return t;
  throw new u(
    `[gpu-device-api] ${e}: expected a WebGPU command buffer (WebGPUCommandBuffer or a native GPUCommandBuffer), got ${ae(t)}.`
  );
}
class xm {
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
    this.canvas = e, this.options = n, this.pixelRatioValue = n.pixelRatio ?? ns(), this.formatValue = ri(), this.usageValue = v.RenderAttachment | (n.copySrc ? v.CopySrc : v.None);
    const r = rt(e);
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
    if (!(e.device instanceof Ga))
      throw new u(
        "[gpu-device-api] CanvasContext.configure: expected a WebGPU device (WebGPUDevice)."
      );
    const n = mf(this.canvas);
    if (!n)
      throw new u(
        '[gpu-device-api] CanvasContext.configure: this canvas cannot create a WebGPU context (getContext("webgpu") returned null).'
      );
    this.releaseFrame(), this.releaseMultisampleTarget(), this.releaseDepthTarget(), this.gpuContext = n, this.currentDevice = e.device, this.formatValue = e.format ?? ri(), this.usageValue = v.RenderAttachment | (e.usage ?? v.None) | (this.options.copySrc ? v.CopySrc : v.None), this.alphaModeValue = e.alphaMode ?? "premultiplied", this.colorSpaceValue = e.colorSpace;
    const r = e.sampleCount ?? (this.configuredValue ? this.sampleCountValue : e.device.defaultSampleCount);
    this.sampleCountValue = mt(r, "CanvasConfig.sampleCount"), this.depthRequestedValue = e.depth ?? !0;
    const i = {
      device: e.device.native,
      format: ff(this.formatValue),
      usage: ma(this.usageValue),
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
    const n = rt(this.canvas), r = Math.max(1, Math.round(n.width * this.pixelRatioValue)), i = Math.max(1, Math.round(n.height * this.pixelRatioValue));
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
    const r = xe.adopt(
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
    const s = xe.create(r, {
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
    const s = xe.create(r, {
      label: `${r.label}#canvasDepth`,
      size: { width: e, height: n },
      format: ts,
      usage: v.RenderAttachment,
      sampleCount: this.sampleCountValue
    });
    return this.depthTexture = s, this.depthViewValue = s.createView({ label: `${s.label}#view` }), this.depthViewValue;
  }
  releaseDepthTarget() {
    this.depthTexture?.destroy(), this.depthTexture = null, this.depthViewValue = null;
  }
}
class Sm {
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
    this.device.assertUsable("Queue.writeBuffer");
    const a = r instanceof DataView ? 1 : r.BYTES_PER_ELEMENT ?? 1, o = s ?? r.byteLength - i;
    if (i % a !== 0 || o % a !== 0)
      throw new u(
        `[gpu-device-api] Queue.writeBuffer: dataOffset (${i}) and size (${o}) are measured in bytes, so both must be multiples of the element size (${a}) of the given ${r.constructor.name}.`
      );
    this.native.writeBuffer(
      V(e, "Queue.writeBuffer"),
      n,
      r,
      i / a,
      o / a
    );
  }
  /** 将主机端像素上传到 texture。多行/多层拷贝必须给 `layout.bytesPerRow`（WebGPU 会校验）。 */
  writeTexture(e, n, r, i) {
    this.device.assertUsable("Queue.writeTexture"), this.native.writeTexture(
      En(e, "Queue.writeTexture"),
      n,
      Vf(r),
      qe(i)
    );
  }
  /**
   * 直接上传图像来源（`ImageBitmap`、`VideoFrame`、`HTMLCanvasElement` 等）。
   *
   * `flipY` 是 WebGPU 唯一能在拷贝阶段翻转垂直方向的地方（`writeTexture` 做不到），
   * 因此需要「图片坐标系 ↔ GPU 坐标系」转换时优先用它。
   */
  copyExternalImageToTexture(e, n, r, i = !1) {
    this.device.assertUsable("Queue.copyExternalImageToTexture"), this.native.copyExternalImageToTexture(
      { source: e, flipY: i },
      En(n, "Queue.copyExternalImageToTexture"),
      qe(r)
    );
  }
  /**
   * buffer → buffer 的拷贝。
   *
   * `GPUQueue` 本身没有这个接口，因此这里用一个临时 command encoder 录制后立即提交；
   * 从上层看仍然是一次「立即生效」的拷贝（与 WebGL2 后端的语义一致）。
   */
  copyBufferToBuffer(e, n, r, i, s) {
    this.device.assertUsable("Queue.copyBufferToBuffer");
    const a = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToBuffer" });
    a.copyBufferToBuffer(
      V(e, "Queue.copyBufferToBuffer(source)"),
      n,
      V(r, "Queue.copyBufferToBuffer(destination)"),
      i,
      s
    ), this.native.submit([a.finish()]);
  }
  /** buffer → texture 的拷贝；同样通过临时 command encoder 实现。 */
  copyBufferToTexture(e, n, r) {
    this.device.assertUsable("Queue.copyBufferToTexture");
    const i = this.device.native.createCommandEncoder({ label: "Queue.copyBufferToTexture" });
    i.copyBufferToTexture(
      {
        buffer: V(e.buffer, "Queue.copyBufferToTexture(source)"),
        offset: e.offset ?? 0,
        bytesPerRow: e.bytesPerRow,
        rowsPerImage: e.rowsPerImage
      },
      En(n, "Queue.copyBufferToTexture(destination)"),
      qe(r)
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
    this.device.assertUsable("Queue.submit"), this.native.submit(e.map((n) => vm(n, "Queue.submit")));
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
function En(t, e) {
  const n = {
    texture: xa(t.texture, e)
  };
  return t.mipLevel !== void 0 && (n.mipLevel = t.mipLevel), t.origin !== void 0 && (n.origin = wa(t.origin)), t.aspect !== void 0 && (n.aspect = xr(t.aspect)), n;
}
class Ga {
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
  resolveLost;
  lostInfoValue = null;
  _disposed = !1;
  constructor(e, n) {
    this.native = e, this.descriptor = n.descriptor, this.label = n.descriptor.label ?? (e.label.length > 0 ? e.label : "webgpu-device"), this.adapterInfo = n.adapterInfo, this.requestedLimits = n.resolvedLimits, this.debug = n.descriptor.debug ?? !1, this.enabledFeatures = [...n.descriptor.requiredFeatures ?? []], this.enabledFeatureSet = $m(e, this.enabledFeatures), this.features = new pf(n.adapterFeatures), this.limits = fa(e.limits), this.defaultSampleCount = mt(
      n.descriptor.defaultSampleCount ?? 1,
      "DeviceDescriptor.defaultSampleCount"
    ), this.logger = pt(`webgpu:${this.label}`);
    let r = () => {
    };
    this.lost = new Promise((i) => {
      r = i;
    }), this.resolveLost = r, this.queue = new Sm(this), e.onuncapturederror = (i) => {
      this.reportError(Tm(i.error));
    }, this.timing = Pm(e, this.enabledFeatureSet, n.adapterFeatures), e.lost.then((i) => this.handleDeviceLost(i)), this.logger.debug(
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
      const n = e.getTimestampPeriod();
      if (typeof n == "number" && Number.isFinite(n) && n > 0) return n;
    }
    return typeof e.timestampPeriod == "number" && Number.isFinite(e.timestampPeriod) && e.timestampPeriod > 0 ? e.timestampPeriod : 1;
  }
  /** 生成 `prefix#N` 形式的资源 id，供各资源的默认 label 使用。 */
  nextResourceId(e) {
    return O(e);
  }
  /* ---------------------------------------------------------------- 资源 */
  createBuffer(e) {
    return this.assertUsable("createBuffer"), this.track(new ya(this, e));
  }
  createTexture(e) {
    return this.assertUsable("createTexture"), this.track(xe.create(this, e));
  }
  createSampler(e = {}) {
    return this.assertUsable("createSampler"), this.track(new Tr(this, e));
  }
  createShaderModule(e) {
    return this.assertUsable("createShaderModule"), this.track(new Sa(this, e));
  }
  createQuerySet(e) {
    return this.assertUsable("createQuerySet"), this.track(new Ta(this, e));
  }
  /**
   * 读回 query set 的结果：`resolveQuerySet` → `copyBufferToBuffer` → `mapAsync`。
   *
   * 两个中转 buffer 都通过 `this.createBuffer()` 创建，因此被设备的资源追踪覆盖：
   * 正常路径由 `QueryResult.read()` 销毁，忘了读则在 `device.dispose()` 时统一释放。
   */
  readQuerySet(e, n = {}) {
    this.assertUsable("readQuerySet"), ut(e, `Device "${this.label}".readQuerySet(querySet)`);
    const r = n.firstQuery ?? 0;
    Ee(r, "QuerySetReadOptions.firstQuery");
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
      usage: F.QueryResolve | F.CopySrc
    }), l = this.createBuffer({
      label: `${s}#readback`,
      size: a,
      usage: F.MapRead | F.CopyDst
    }), c = this.createCommandEncoder({ label: s });
    try {
      c.resolveQuerySet(e, r, i, o, 0), c.copyBufferToBuffer(o, 0, l, 0, a), this.queue.submit([c.finish()]);
    } catch (h) {
      throw l.destroy(), o.destroy(), h;
    } finally {
      c.dispose();
    }
    return new Hf({
      type: e.type,
      count: i,
      timestampPeriod: this.timestampPeriod,
      staging: o,
      readback: l
    });
  }
  /* ---------------------------------------------------------------- 绑定 */
  createBindGroupLayout(e) {
    return this.assertUsable("createBindGroupLayout"), this.track(new Pa(this, e));
  }
  createBindGroup(e) {
    return this.assertUsable("createBindGroup"), this.track(new _a(this, e));
  }
  createPipelineLayout(e) {
    return this.assertUsable("createPipelineLayout"), this.track(ht.create(this, e));
  }
  /* ---------------------------------------------------------------- 管线 */
  createRenderPipeline(e) {
    return this.assertUsable("createRenderPipeline"), this.track(new $r(this, e));
  }
  createComputePipeline(e) {
    return this.assertUsable("createComputePipeline"), this.track(new Ra(this, e));
  }
  /* ---------------------------------------------------------------- 渲染 */
  createRenderTarget(e) {
    return this.assertUsable("createRenderTarget"), this.track(new Fa(this, e));
  }
  createCommandEncoder(e = {}) {
    return this.assertUsable("createCommandEncoder"), this.track(new ym(this, e));
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
    return (!r || r.disposed) && (r = this.track(new xm(e)), this.canvasContexts.set(e, r)), (n !== void 0 || !r.configured) && r.configure({ ...n, device: this }), r;
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
      rs(e);
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
  /**
   * 在任何会创建资源 / 提交工作之前检查设备仍可用。
   *
   * 丢失后 `GPUDevice` 上的所有调用都会被实现**静默丢弃**（命令不执行、也不报错），
   * 表现就是「画不出来但一切正常」；所以这里必须主动抛出带 `[gpu-device-api] ` 前缀的
   * {@link DeviceLostError}，并带上丢失原因。
   *
   * 公开（而不是 private）是因为 `WebGPUQueue` 的提交路径也要用它 —— 设备丢失后
   * `queue.submit()` 是唯一「静默无效」的提交入口，必须在那一层拦下。
   */
  assertUsable(e) {
    if (this._disposed)
      throw new u(`[gpu-device-api] Device.${e}: device "${this.label}" has been disposed.`);
    if (this.lostInfoValue)
      throw new nt(
        `[gpu-device-api] Device.${e}: device "${this.label}" was lost (${this.lostInfoValue.reason}): ` + this.lostInfoValue.message,
        { reason: this.lostInfoValue.reason }
      );
  }
  handleDeviceLost(e) {
    const n = e.reason === "destroyed" ? "destroyed" : "unknown", r = { reason: n, message: e.message };
    this.lostInfoValue = r, this.resolveLost(r), this._disposed || this.reportError(
      new nt(`[gpu-device-api] WebGPU device lost (${n}): ${e.message}`, { reason: n })
    );
  }
}
function Tm(t) {
  if (co(t)) return t;
  const e = typeof t?.message == "string" ? t.message : String(t), n = e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
  return Cn(t, "GPUValidationError") ? new u(n) : Cn(t, "GPUOutOfMemoryError") ? new uo(n) : Cn(t, "GPUInternalError") ? new ee(n, { code: "INTERNAL_ERROR" }) : t instanceof Error ? new ee(n, { code: "GPU_ERROR", cause: t }) : new ee(n);
}
function Cn(t, e) {
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
function $m(t, e) {
  const n = pa(t.features);
  return n.size > 0 ? n : new Set(e);
}
function Pm(t, e, n) {
  const r = e.has(te), i = je.some((o) => e.has(o)), s = r && _m(t), a = r && i;
  return {
    encoderTimestamps: s,
    passTimestamps: a,
    unavailableReason: s || a ? null : Am(r, n)
  };
}
function Am(t, e) {
  return t ? `[gpu-device-api] this WebGPU device enables "${te}", but this implementation does not expose GPUCommandEncoder.writeTimestamp() and does not enable "${je[0]}" (tried: ${je.join(", ")}), so there is no way to write a GPU timestamp. Read GPU time from the backend's own profiler instead.` : `[gpu-device-api] this WebGPU device does not have the "${te}" feature enabled, so no GPU timestamp can be written. Request it in DeviceDescriptor.requiredFeatures (the adapter supports it: ${e.has(te) ? "yes" : "no"}).`;
}
function _m(t) {
  try {
    if (typeof t.createCommandEncoder({ label: "gpu-device-api:timestamp-probe" }).writeTimestamp == "function") return !0;
  } catch {
  }
  return typeof globalThis.GPUCommandEncoder?.prototype?.writeTimestamp == "function";
}
class Yt {
  /** 原生 `GPUAdapter`，escape hatch。 */
  native;
  info;
  features;
  limits;
  options;
  /** 排序后的 feature 名，便于调试与错误信息。 */
  featureNames;
  constructor(e, n) {
    this.native = e, this.options = n, this.info = hf(e), this.features = pa(e.features), this.limits = fa(e.limits), this.featureNames = [...this.features].sort();
  }
  /** 请求本 adapter 时使用的选项（供诊断/日志）。 */
  get requestOptions() {
    return this.options;
  }
  /** 当前环境是否暴露 WebGPU。 */
  static isSupported() {
    return ni();
  }
  /** 请求 adapter；没有可用 adapter 时返回 `null`（供 auto 回退使用）。 */
  static async request(e = {}) {
    const n = await uf(e);
    return n ? new Yt(n, e) : null;
  }
  /** 请求 adapter；没有可用 adapter 时抛 {@link ValidationError}。 */
  static async create(e = {}) {
    const n = await Yt.request(e);
    if (n) return n;
    throw ni() ? new u(
      `[gpu-device-api] No WebGPU adapter is available for the requested options (${JSON.stringify(e)}).`
    ) : new u(
      "[gpu-device-api] WebGPU is not available in this environment (navigator.gpu is missing)."
    );
  }
  /** 创建逻辑设备。 */
  async requestDevice(e = {}) {
    const n = es(this.limits, e.requiredLimits, "webgpu"), r = df(
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
    return new Ga(s, {
      descriptor: e,
      resolvedLimits: n,
      adapterInfo: this.info,
      adapterFeatures: this.features,
      requestOptions: this.options
    });
  }
}
function Em(t) {
  return t.canvas ? t.canvas : Oa();
}
function Cm() {
  return Oa();
}
function Oa() {
  if (typeof document < "u") {
    const t = document.createElement("canvas");
    return t.width = 1, t.height = 1, t;
  }
  return typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : null;
}
const jn = Symbol("timeout");
async function mi(t, e) {
  let n;
  try {
    return await Promise.race([
      t,
      new Promise((r) => {
        n = setTimeout(() => r(jn), e);
      })
    ]);
  } finally {
    n !== void 0 && clearTimeout(n);
  }
}
const Bt = 3e3;
class Lm {
  kind = "webgpu";
  async isAvailable(e) {
    if (typeof navigator > "u" || !("gpu" in navigator) || !navigator.gpu)
      return { ok: !1, reason: "当前环境没有 navigator.gpu（浏览器不支持 WebGPU，或不在安全上下文里）" };
    try {
      const n = await mi(
        navigator.gpu.requestAdapter({
          powerPreference: e.powerPreference ?? "high-performance",
          forceFallbackAdapter: e.forceFallbackAdapter ?? !1
        }),
        Bt
      );
      return n === jn ? {
        ok: !1,
        reason: `requestAdapter() 超过 ${Bt}ms 没有返回（GPU 进程未就绪或驱动初始化卡住）`
      } : n ? { ok: !0 } : {
        ok: !1,
        reason: "requestAdapter() 返回 null（显卡被禁用、驱动在黑名单里，或无头环境没有 GPU）"
      };
    } catch (n) {
      return { ok: !1, reason: `requestAdapter() 抛错：${n.message}` };
    }
  }
  async createAdapter(e) {
    const n = await mi(
      Yt.create({
        powerPreference: e.powerPreference,
        forceFallbackAdapter: e.forceFallbackAdapter
      }),
      Bt
    );
    if (n === jn)
      throw new u(
        `[gpu-device-api] WebGPU 的 requestAdapter() 超过 ${Bt}ms 没有返回。这通常意味着 GPU 进程未就绪或驱动初始化卡住（无头/虚拟化环境里很常见）。
可以稍后重试，或改用 WebGL2 后端。`
      );
    return n;
  }
}
class Mm {
  kind = "webgl2";
  async isAvailable(e) {
    const n = Cm();
    if (!n)
      return { ok: !1, reason: "没有可用的 canvas（不在浏览器环境里，也没有 OffscreenCanvas）" };
    try {
      return n.getContext("webgl2", e.contextAttributes) ? { ok: !0 } : { ok: !1, reason: "canvas.getContext('webgl2') 返回 null（浏览器不支持 WebGL2）" };
    } catch (r) {
      return { ok: !1, reason: `创建 WebGL2 context 时抛错：${r.message}` };
    }
  }
  async createAdapter(e) {
    const n = Em(e);
    if (!n)
      throw new Error("[gpu-device-api] 创建 WebGL2 adapter 需要 canvas。");
    return wr.request({
      canvas: n,
      contextAttributes: e.contextAttributes
    });
  }
}
let Ln = null;
function Pr() {
  return Ln || (Ln = new Qh().register(new Lm()).register(new Mm())), Ln;
}
const Rm = ["webgpu", "webgl2"];
async function Fm(t = {}) {
  const e = t.registry ?? Pr(), n = t.backend && t.backend !== "auto" ? [t.backend] : t.order ?? Rm, r = await e.probeAll(n, t), i = r.find((s) => s.ok);
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
async function sw(t, e = {}) {
  const r = (e.registry ?? Pr()).get(t);
  return r ? (await r.isAvailable(e)).ok : !1;
}
async function aw(t = {}) {
  return (await Ia(t)).device;
}
async function Ia(t = {}) {
  const e = t.logger ?? pt("gpu-device-api"), n = t.registry ?? Pr(), r = await Fm({
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
          // 可选 feature 按 adapter 的实际能力过滤：不支持就不申请（而不是抛错）。
          requiredFeatures: Bm(t.requiredFeatures, t.optionalFeatures, c.features),
          requiredLimits: t.requiredLimits,
          debug: t.debug
        }), p = t.canvas ? h.createCanvasContext(t.canvas) : null;
        return o !== r.backend ? e.warn(
          `后端 ${r.backend} 初始化失败，已改用 ${o}。失败原因：${a[a.length - 1] ?? "未知"}`
        ) : o === "webgl2" && t.backend !== "webgl2" && e.info(`已回退到 WebGL2 后端：${r.reason}`), { device: h, adapter: c, backend: o, probes: r.probes, context: p };
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
function Bm(t, e, n) {
  if ((!t || t.length === 0) && (!e || e.length === 0)) return;
  const r = [];
  for (const i of t ?? [])
    r.includes(i) || r.push(i);
  for (const i of e ?? [])
    r.includes(i) || n.has(i) && r.push(i);
  return r;
}
const gi = 16, Gm = 12, Ht = {
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
    size: gi * 3,
    glsl: "mat3",
    wgsl: "mat3x3f",
    componentType: "f32",
    components: 9,
    columnStride: gi,
    columnSize: Gm,
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
}, bi = Object.keys(Ht);
function Mn(t, e) {
  return Math.ceil(t / e) * e;
}
function Om(t) {
  const e = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(t);
  if (e) {
    const r = e[1], i = Ht[r];
    if (!i)
      throw new u(
        `[gpu-device-api] 不支持的 uniform 元素类型「${r}」（出现在「${t}」里）。支持：${bi.join("、")}。`
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
  if (!Ht[t])
    throw new u(
      `[gpu-device-api] 不支持的 uniform 类型「${t}」。支持：${bi.join("、")}，以及 \`类型[N]\` 形式的数组。`
    );
  return { element: t, count: 1 };
}
const Im = /* @__PURE__ */ new Set([
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
]), Um = /^[A-Za-z_][A-Za-z0-9_]*$/;
class ln {
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
      if (!Um.test(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」不是合法标识符。`);
      if (Im.has(o))
        throw new u(`[gpu-device-api] uniform 字段名「${o}」是 WGSL 保留字，请换一个。`);
      const l = e[o], { element: c, count: h } = Om(l), p = Ht[c], d = Mn(s, p.align), f = p.size, m = h > 1 ? Mn(p.size, 16) : p.size, g = p.columnStride === void 0 || p.columnStride === p.columnSize, b = h > 1 ? m === p.size && g : g, w = h > 1 ? m * (h - 1) + p.size : p.size;
      i.push({ name: o, type: l, info: p, byteOffset: d, byteSize: f, byteStride: m, count: h, packed: b }), s = d + w, a = Math.max(a, p.align, h > 1 ? 16 : 0);
    }
    this.fields = i, this.fieldByName = new Map(i.map((o) => [o.name, o])), this.byteLength = Mn(s, a), this.key = `${this.structName}|${this.group}|${this.binding}|${r.map((o) => `${o}:${e[o]}`).join(",")}`;
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
const wi = /* @__PURE__ */ new Map();
function Ua(t, e) {
  const n = new ln(t, e), r = wi.get(n.key);
  return r || (wi.set(n.key, n), n);
}
function Qn(t, e, n, r) {
  return t === "i32" ? new Int32Array(e, n, r) : t === "u32" ? new Uint32Array(e, n, r) : new Float32Array(e, n, r);
}
function yi(t, e, n, r, i) {
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
      return o || (o = Qn(t.info.componentType, e, t.byteOffset + a * n, r), s[a] = o), o;
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
      const o = i * r, l = a ?? Qn(t.info.componentType, new ArrayBuffer(o * 4), 0, o);
      let c = 0;
      for (let h = 0; h < i; h++) {
        const p = this.at(h);
        for (let d = 0; d < r; d++, c++)
          l[c] = p[d];
      }
      return l;
    }
  };
}
class vi {
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
    this.layout = e instanceof ln ? e : Ua(e, n), this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16)), this.bytesView = new Uint8Array(this.buffer, 0, this.layout.byteLength);
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
      return Qn(
        e.info.componentType,
        this.buffer,
        e.byteOffset,
        e.count * e.info.components
      );
    if (e.info.columnStride !== void 0) {
      const n = (e.info.columnSize ?? e.byteSize) / 4;
      return yi(
        e,
        this.buffer,
        e.info.columnStride,
        n,
        e.info.columns ?? 1
      );
    }
    return yi(e, this.buffer, e.byteStride, e.info.components, e.count);
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
const xi = /* @__PURE__ */ new WeakMap(), Da = /* @__PURE__ */ new WeakMap();
function Dm(t) {
  return Da.get(t) ?? t;
}
function Vm(t) {
  const e = xi.get(t);
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
  return xi.set(t, r), Da.set(r, t), r;
}
function km(t, e) {
  const n = t instanceof ln ? new vi(t) : new vi(t, e);
  return Vm(n);
}
const Rn = "/*%uniforms%*/", Si = "/*%attributes%*/", Fn = "/*%textures%*/", Nm = {
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
function Wm(t, e, n) {
  const r = e === "cube" ? "samplerCube" : e === "3d" ? "sampler3D" : e === "2d-array" ? "sampler2DArray" : "sampler2D";
  return n ? r === "sampler2D" ? "sampler2DShadow" : r === "samplerCube" ? "samplerCubeShadow" : r === "sampler2DArray" ? "sampler2DArrayShadow" : r : t === "sint" ? `i${r}` : t === "uint" ? `u${r}` : r;
}
function zm(t, e) {
  return t === "depth" ? e === "cube" ? "texture_depth_cube" : e === "2d-array" ? "texture_depth_2d_array" : "texture_depth_2d" : `${e === "cube" ? "texture_cube" : e === "3d" ? "texture_3d" : e === "2d-array" ? "texture_2d_array" : "texture_2d"}<${t === "sint" ? "i32" : t === "uint" ? "u32" : "f32"}>`;
}
function Bn(t, e) {
  let n = t;
  const r = [];
  for (const s of e)
    s.text && (n.includes(s.placeholder) ? n = n.split(s.placeholder).join(s.text) : r.push(s.text));
  return `${r.length > 0 ? `${r.join(`

`)}

` : ""}${n.trim()}
`;
}
class cn {
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
    this.attributes = n.map(([d, f], m) => {
      const g = typeof f == "string" ? { format: f, stepMode: "vertex" } : f;
      return { name: d, format: g.format, location: m, stepMode: g.stepMode ?? "vertex" };
    }), e.uniforms instanceof ln ? this.uniforms = e.uniforms : e.uniforms ? this.uniforms = Ua(e.uniforms) : this.uniforms = null;
    const r = (e.textures ?? []).map(
      (d) => typeof d == "string" ? { name: d } : d
    );
    this.textures = r.map((d, f) => {
      const m = d.binding ?? f * 2;
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
      (d) => `uniform ${Wm(d.sampleType, d.viewDimension, d.comparison)} ${d.name};`
    ).join(`
`), o = this.attributes.map((d) => `layout(location = ${d.location}) in ${oo(d.format)} ${d.name};`).join(`
`);
    if (this.glsl = {
      vs: Bn(e.glsl.vs, [
        { placeholder: Rn, text: s },
        { placeholder: Si, text: o },
        { placeholder: Fn, text: a }
      ]),
      fs: Bn(e.glsl.fs, [
        { placeholder: Rn, text: s },
        { placeholder: Fn, text: a }
      ])
    }, e.fragmentOutput !== !1) {
      const d = e.fragmentOutput ?? "fragColor";
      new RegExp(
        `\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${d}\\b`
      ).test(this.glsl.fs) || (this.glsl.fs = `layout(location = 0) out vec4 ${d};
${this.glsl.fs}`);
    }
    const l = e.wgsl, c = this.uniforms ? this.uniforms.wgslDeclaration() : "", h = this.textures.map((d) => {
      const f = d.comparison && d.sampleType === "depth" ? "sampler_comparison" : "sampler";
      return `@group(${i}) @binding(${d.binding}) var ${d.name}: ${zm(d.sampleType, d.viewDimension)};
@group(${i}) @binding(${d.samplerBinding}) var ${d.samplerName}: ${f};`;
    }).join(`
`), p = this.attributes.length > 0 ? `struct VertexInput {
${this.attributes.map((d) => `  @location(${d.location}) ${d.name}: ${lo(d.format)},`).join(`
`)}
}` : "";
    this.wgsl = Bn(l, [
      { placeholder: Rn, text: c },
      { placeholder: Si, text: p },
      { placeholder: Fn, text: h }
    ]);
  }
  /** 创建一个材质。 */
  static create(e) {
    return new cn(e);
  }
  /**
   * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
   * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
   */
  vertexBufferLayouts() {
    return this.attributes.map((e) => ({
      arrayStride: Ce(e.format).byteSize,
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
    const e = km(this.uniforms);
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
      const n = Nm[e];
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
      type: D.Uniform,
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
          type: D.Texture,
          name: a.name,
          texture: { sampleType: a.sampleType, viewDimension: a.viewDimension }
        }), r.push({
          binding: a.samplerBinding,
          visibility: 3,
          type: a.comparison && a.sampleType === "depth" ? D.ComparisonSampler : D.Sampler,
          name: a.samplerName,
          sampler: { type: a.comparison ? "comparison" : "filtering" }
        });
    return r.length === 0 ? null : e.createBindGroupLayout({ label: `${this.name}:group${n}`, entries: r });
  }
}
function qm(t) {
  return cn.create(t);
}
const jm = 72;
class Qm {
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
    this.device = e, this.layout = n, this.label = r.label ?? `uniformArena:${n.structName}`, this.align = Math.max(1, e.limits.minUniformBufferOffsetAlignment), this.slotSize = Ti(Math.max(n.byteLength, 16), this.align), this.maxCapacity = r.maxCapacity ?? 16 * 1024 * 1024, this.capacityValue = Math.max(r.initialCapacity ?? 64 * 1024, this.slotSize), this.bufferValue = this.createBuffer(this.capacityValue);
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
      size: Ti(e, 4),
      usage: jm
    });
  }
}
class Xm {
  device;
  arenas = /* @__PURE__ */ new Map();
  options;
  constructor(e, n = {}) {
    this.device = e, this.options = n;
  }
  /** 取得（或创建）某个布局的 arena。 */
  acquire(e) {
    let n = this.arenas.get(e.key);
    return n || (n = new Qm(this.device, e, this.options), this.arenas.set(e.key, n)), n;
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
function Ti(t, e) {
  return Math.ceil(t / e) * e;
}
const Ym = 40, Hm = 24, Zm = Object.freeze({
  position: "float32x3",
  normal: "float32x3",
  uv: "float32x2",
  uv1: "float32x2",
  color: "float32x4",
  tangent: "float32x4",
  joints: "uint16x4",
  weights: "float32x4"
});
class un {
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
  static create(e, n) {
    const r = n.label ?? "geometry", i = /* @__PURE__ */ new Map(), s = [
      ["position", n.position],
      ["normal", n.normal],
      ["uv", n.uv],
      ["uv1", n.uv1],
      ["color", n.color],
      ["tangent", n.tangent]
    ];
    for (const [g, b] of s)
      b && i.set(g, { data: b });
    for (const [g, b] of Object.entries(n.attributes ?? {}))
      i.set(g, ArrayBuffer.isView(b) ? { data: b } : b);
    if (i.size === 0)
      throw new u(`[gpu-device-api] 几何体「${r}」至少要有一个顶点属性。`);
    let a = n.vertexCount ?? 0, o = null;
    for (const [g, b] of i) {
      const w = b.format ?? $i(g, b.data), y = Math.floor(b.data.byteLength / Ce(w).byteSize);
      b.perInstance ? o = o === null ? y : Math.min(o, y) : y > a && (a = y);
    }
    if (a <= 0)
      throw new u(
        `[gpu-device-api] 几何体「${r}」无法推断顶点数：至少要有一个按顶点步进的属性（实例属性只描述实例，不决定顶点数），并检查属性数据是否为空。`
      );
    const l = /* @__PURE__ */ new Map();
    for (const [g, b] of i) {
      const w = b.format ?? $i(g, b.data), y = Ce(w);
      if (b.data.byteLength % y.byteSize !== 0)
        throw new u(
          `[gpu-device-api] 几何体「${r}」的属性「${g}」数据长度 ${b.data.byteLength} 字节不是其格式 ${w}（${y.byteSize} 字节）的整数倍。`
        );
      const S = a * y.byteSize;
      if (!b.perInstance && b.data.byteLength < S)
        throw new u(
          `[gpu-device-api] 几何体「${r}」的属性「${g}」只有 ${b.data.byteLength} 字节，但按顶点数 ${a} 需要 ${S} 字节。所有属性必须提供同样多的顶点（只有 \`perInstance: true\` 的实例属性可以少于顶点数）。`
        );
      const $ = e.createBuffer({
        label: `${r}:${g}`,
        // WebGPU 要求 buffer 大小是 4 的倍数，这里统一对齐。
        size: Pi(b.data.byteLength, 4),
        usage: Ym
      });
      e.queue.writeBuffer($, 0, b.data), l.set(g, {
        name: g,
        format: w,
        byteStride: y.byteSize,
        components: y.components,
        perInstance: b.perInstance ?? !1,
        buffer: $
      });
    }
    const c = Km(n, l, i, a), h = [...i.values()].some((g) => g.perInstance === !0), p = c !== null && (n.boundingSphere !== void 0 || !h);
    let d = null, f = null, m = 0;
    if (n.indices && n.indices.length > 0) {
      const g = eg(n.indices, a, r);
      f = g instanceof Uint32Array ? "uint32" : "uint16", m = g.length, d = e.createBuffer({
        label: `${r}:indices`,
        size: Pi(g.byteLength, 4),
        usage: Hm
      }), e.queue.writeBuffer(d, 0, g);
    }
    return new un({
      label: r,
      topology: n.topology ?? "triangle-list",
      attributes: l,
      vertexCount: a,
      instanceCount: o,
      indexBuffer: d,
      indexFormat: f,
      indexCount: m,
      boundingSphere: c,
      cullable: p
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
function Km(t, e, n, r) {
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
      const h = c[0], p = c[1], d = c[2];
      if (!Number.isFinite(h) || !Number.isFinite(p) || !Number.isFinite(d))
        throw new u(
          `[gpu-device-api] 几何体「${t.label ?? "geometry"}」显式给出的包围球球心必须是有限数，实际是 (${h}, ${p}, ${d})。`
        );
      he(l, h, p, d);
    }
    return { center: l, radius: o };
  }
  const s = e.get("position"), a = n.get("position");
  return !s || !a || s.format !== "float32x3" || !(a.data instanceof Float32Array) ? null : Jm(a.data, r);
}
function Jm(t, e) {
  let n = 1 / 0, r = 1 / 0, i = 1 / 0, s = -1 / 0, a = -1 / 0, o = -1 / 0;
  for (let d = 0; d < e; d += 1) {
    const f = d * 3, m = t[f], g = t[f + 1], b = t[f + 2];
    m < n && (n = m), g < r && (r = g), b < i && (i = b), m > s && (s = m), g > a && (a = g), b > o && (o = b);
  }
  const l = (n + s) / 2, c = (r + a) / 2, h = (i + o) / 2;
  let p = 0;
  for (let d = 0; d < e; d += 1) {
    const f = d * 3, m = t[f] - l, g = t[f + 1] - c, b = t[f + 2] - h, w = m * m + g * g + b * b;
    w > p && (p = w);
  }
  return {
    center: is(l, c, h),
    radius: Math.sqrt(p)
  };
}
function $i(t, e) {
  const n = Zm[t];
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
function eg(t, e, n) {
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
  return so(e) === "uint32" ? Uint32Array.from(r) : Uint16Array.from(r);
}
function Pi(t, e) {
  return Math.ceil(t / e) * e;
}
function ow(t, e) {
  return un.create(t, e);
}
class tg {
  /** 是否已经由某个相机矩阵初始化过。 */
  ready = !1;
  planes = fr();
  worldCenter = M();
  scaling = M();
  /** 按 view-projection 矩阵与深度约定重建 6 个平面。 */
  update(e, n) {
    qs(this.planes, e, n), this.ready = !0;
  }
  /** 世界空间的球是否可能与视锥相交。 */
  intersectsSphere(e, n) {
    return js(this.planes, e, n > 0 ? n : 0);
  }
  /**
   * 局部空间的包围球经 `model` 变换后是否可能与视锥相交。
   *
   * `model` 为 `null` / `undefined` 表示单位矩阵，直接用局部球判定（省掉矩阵运算）。
   */
  intersectsLocalSphere(e, n) {
    if (!n) return this.intersectsSphere(e.center, e.radius);
    if (ar(this.worldCenter, n, e.center), e.radius <= 0) return this.intersectsSphere(this.worldCenter, 0);
    sr(this.scaling, n);
    const r = Math.max(this.scaling[0], this.scaling[1], this.scaling[2]);
    return this.intersectsSphere(this.worldCenter, e.radius * r);
  }
}
function Ai(t, e) {
  return t.pipeline !== e.pipeline ? t.pipeline - e.pipeline : t.bindings !== e.bindings ? t.bindings - e.bindings : t.depth !== e.depth ? t.depth - e.depth : t.order - e.order;
}
function ng(t, e) {
  return t.depth !== e.depth ? e.depth - t.depth : t.order - e.order;
}
function rg(t, e) {
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
      a - s > 1 && ig(t, s, a, Ai), s = a;
    }
    return;
  }
  const n = [], r = [];
  for (const s of t)
    s.transparent ? r.push(s) : n.push(s);
  n.sort(Ai), r.sort(ng);
  let i = 0;
  for (const s of n) t[i++] = s;
  for (const s of r) t[i++] = s;
}
function ig(t, e, n, r) {
  const i = t.slice(e, n);
  i.sort(r);
  for (let s = 0; s < i.length; s += 1) t[e + s] = i[s];
}
const Va = Object.freeze({
  rgba8unorm: { bytesPerPixel: 4, channels: 4 },
  "rgba8unorm-srgb": { bytesPerPixel: 4, channels: 4 },
  bgra8unorm: { bytesPerPixel: 4, channels: 4 },
  "bgra8unorm-srgb": { bytesPerPixel: 4, channels: 4 },
  r8unorm: { bytesPerPixel: 1, channels: 1 },
  rg8unorm: { bytesPerPixel: 2, channels: 2 }
}), sg = Object.freeze(
  Object.keys(Va)
), ag = /* @__PURE__ */ new Set(["bgra8unorm", "bgra8unorm-srgb"]);
function _i(t, e) {
  const n = Va[t];
  if (!n)
    throw new u(
      `[gpu-device-api] The gfx texture layer cannot upload "${t}" from host memory. Supported formats: ${sg.join(", ")}. Use device.createTexture() + queue.writeTexture() for any other format.`
    );
  if (e.backend === "webgl2" && ag.has(t))
    throw new u(
      `[gpu-device-api] Texture format "${t}" has no WebGL2 equivalent: BGRA exists there only as the implicit default framebuffer layout. Use "rgba8unorm" / "rgba8unorm-srgb" on WebGL2, or swizzle the channels before uploading.`
    );
  return n;
}
class we {
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
    this.label = e.label, this.texture = e.texture, this.view = e.view, this.sampler = e.sampler, this.width = e.width, this.height = e.height, this.format = e.format, this.mipLevelCount = e.mipLevelCount, this.id = O("gfxTexture");
  }
  /**
   * 同步创建纹理（含可选 mip 链，mip 由后端生成）。
   *
   * `data` 是原始像素时必须给出 `width` / `height`；是图像来源时尺寸从来源读取（图像还没
   * 加载完会抛错，需要等 `load` 事件）。图像来源会走一次 canvas + `getImageData()`，
   * 那是同步的、也只能拿到 sRGB 字节 —— 想要真正的异步解码请用 {@link GfxTexture.fromImage}。
   */
  static create(e, n) {
    const r = n.label ?? "texture", i = n.format ?? "rgba8unorm", s = _i(i, e), a = ka(n.data), o = n.flipY ?? a, l = n.mipmaps ?? a, c = Ei(n.data, n.width, n.height, o, i, s);
    return we.build(e, {
      label: r,
      format: i,
      width: c.width,
      height: c.height,
      mipmaps: l,
      magFilter: n.magFilter,
      minFilter: n.minFilter,
      wrapS: n.wrapS ?? n.wrap ?? "clamp-to-edge",
      wrapT: n.wrapT ?? n.wrap ?? "clamp-to-edge",
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
  static async fromImage(e, n) {
    const r = n.label ?? "texture", i = n.format ?? "rgba8unorm", s = _i(i, e), a = n.flipY ?? !0, o = n.mipmaps ?? !0, l = await cg(n.source, n.imageOptions);
    try {
      const c = l.width, h = l.height;
      if (c <= 0 || h <= 0)
        throw new u(
          `[gpu-device-api] GfxTexture.fromImage("${r}"): the decoded image is ${c}x${h}.`
        );
      if (n.width !== void 0 && n.width !== c || n.height !== void 0 && n.height !== h)
        throw new u(
          `[gpu-device-api] GfxTexture.fromImage("${r}"): width/height (${String(n.width)}x${String(n.height)}) do not match the decoded image (${c}x${h}); copyExternalImageToTexture does not scale, so resize the source (or draw it into a canvas) first.`
        );
      if (s.channels === 4)
        return we.build(e, {
          label: r,
          format: i,
          width: c,
          height: h,
          mipmaps: o,
          magFilter: n.magFilter,
          minFilter: n.minFilter,
          wrapS: n.wrapS ?? n.wrap ?? "clamp-to-edge",
          wrapT: n.wrapT ?? n.wrap ?? "clamp-to-edge",
          // WebGPU 规定 `copyExternalImageToTexture` 的目标纹理必须带 CopyDst **和**
          // RenderAttachment（实现内部可能用 render pass 完成这次拷贝），所以即使不生成 mip
          // 也要加上；WebGL2 忽略 usage，不受影响。
          extraUsage: v.RenderAttachment,
          upload: (d) => {
            e.queue.copyExternalImageToTexture(
              l,
              { texture: d, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
              { width: c, height: h, depthOrArrayLayers: 1 },
              a
            );
          }
        });
      const p = Ei(l, c, h, a, i, s);
      return we.build(e, {
        label: r,
        format: i,
        width: c,
        height: h,
        mipmaps: o,
        magFilter: n.magFilter,
        minFilter: n.minFilter,
        wrapS: n.wrapS ?? n.wrap ?? "clamp-to-edge",
        wrapT: n.wrapT ?? n.wrap ?? "clamp-to-edge",
        upload: (d) => {
          e.queue.writeTexture(
            { texture: d, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
            p.data,
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
  static solid(e, n) {
    return we.create(e, {
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
  /**
   * 两条创建路径的公共部分：分配纹理 → 上传第 0 级 → 让后端生成 mip → 建采样器。
   *
   * 中途任何一步抛错都会把已经创建的纹理销毁掉，不让半成品留在设备上。
   */
  static build(e, n) {
    const r = n.mipmaps ? zi({ width: n.width, height: n.height }) : 1, i = r > 1, s = n.extraUsage ?? v.None, a = {
      label: n.label,
      size: { width: n.width, height: n.height },
      format: n.format,
      mipLevelCount: r,
      // usage 的三点说明：
      // 1. `defaultTextureUsage()` 已经给了 `TextureBinding | CopyDst`，上传就靠它；
      // 2. **额外加 `CopySrc`**：WebGPU 上不带这个标志的纹理不能作为 `copyTextureToBuffer` 的源，
      //    而且失败方式很隐蔽 —— 整条 command buffer 判为 invalid，读回来全是 0。gfx 创建的纹理
      //    应当能直接读回（截图/自检/调试都要用），所以在便捷层默认带上；
      // 3. WebGPU 的 mip 生成走 render pass、`copyExternalImageToTexture` 也要求目标是
      //    render attachment，两者都会通过 `extraUsage` 或 `useRenderAttachment` 加上
      //    `RenderAttachment`；WebGL2 完全忽略 usage。
      usage: ho(0) | v.CopySrc | s | (i ? v.RenderAttachment : 0)
    }, o = e.createTexture(a);
    let l, c;
    try {
      n.upload(o), i && og(o, n.label, e.backend), l = o.createView(), c = e.createSampler({
        label: `${n.label}:sampler`,
        addressModeU: n.wrapS,
        addressModeV: n.wrapT,
        magFilter: n.magFilter ?? "linear",
        minFilter: n.minFilter ?? "linear",
        mipmapFilter: i ? "linear" : "nearest"
      });
    } catch (h) {
      throw o.destroy(), h;
    }
    return new we({
      label: n.label,
      texture: o,
      view: l,
      sampler: c,
      width: n.width,
      height: n.height,
      format: n.format,
      mipLevelCount: r
    });
  }
  get disposed() {
    return this._disposed;
  }
  destroy() {
    this._disposed || (this._disposed = !0, this.sampler.dispose(), this.texture.destroy());
  }
}
function og(t, e, n) {
  const r = t.generateMipmaps;
  if (typeof r != "function")
    throw new u(
      `[gpu-device-api] Texture "${e}": the ${n} backend does not implement Texture.generateMipmaps, so the gfx layer cannot build the mip chain on the GPU. Create the texture with { mipmaps: false } instead.`
    );
  r.call(t);
}
function ka(t) {
  if (!t || typeof t != "object") return !1;
  const e = t.constructor?.name ?? "";
  return e === "ImageBitmap" || e === "HTMLImageElement" || e === "HTMLCanvasElement" || e === "OffscreenCanvas" || e === "ImageData" || e === "VideoFrame" || e === "HTMLVideoElement";
}
function Ei(t, e, n, r, i, s) {
  if (!ka(t)) {
    const m = t, g = new Uint8Array(m.buffer, m.byteOffset, m.byteLength), b = e ?? 0, w = n ?? 0;
    if (b <= 0 || w <= 0)
      throw new u(
        "[gpu-device-api] Creating a texture from raw pixels requires explicit width and height (the byte length alone cannot tell them apart)."
      );
    const y = b * w * s.bytesPerPixel;
    if (g.byteLength < y)
      throw new u(
        `[gpu-device-api] Texture data has ${g.byteLength} bytes, but a ${b}x${w} ${i} texture needs ${y} bytes (${s.bytesPerPixel} per pixel).`
      );
    const S = g.subarray(0, y);
    return { data: r ? Gn(S, b, w, s.bytesPerPixel) : S, width: b, height: w };
  }
  if (lg(t)) {
    const m = e ?? t.width, g = n ?? t.height;
    if (m <= 0 || g <= 0)
      throw new u(
        "[gpu-device-api] The given ImageData has no size; pass width/height explicitly."
      );
    const b = new Uint8Array(t.data.buffer, t.data.byteOffset, t.data.byteLength), w = Ci(b, m, g, i, s);
    return { data: r ? Gn(w, m, g, s.bytesPerPixel) : w, width: m, height: g };
  }
  if (typeof document > "u" && typeof OffscreenCanvas > "u")
    throw new u(
      "[gpu-device-api] There is no canvas in this environment, so the image source cannot be decoded; pass raw pixels (with width/height) or use GfxTexture.fromImage()."
    );
  const a = t, o = e ?? a.naturalWidth ?? a.videoWidth ?? a.width ?? 0, l = n ?? t.naturalHeight ?? t.videoHeight ?? t.height ?? 0;
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
  const p = h.getImageData(0, 0, o, l), d = new Uint8Array(p.data.buffer, p.data.byteOffset, p.data.byteLength), f = Ci(d, o, l, i, s);
  return { data: r ? Gn(f, o, l, s.bytesPerPixel) : f, width: o, height: l };
}
function lg(t) {
  return t.constructor?.name === "ImageData";
}
function Ci(t, e, n, r, i) {
  const s = e * n;
  if (t.byteLength < s * 4)
    throw new u(
      `[gpu-device-api] Expected at least ${s * 4} RGBA bytes for a ${e}x${n} image, got ${t.byteLength}.`
    );
  if (i.channels === 4 && r !== "bgra8unorm" && r !== "bgra8unorm-srgb")
    return t.subarray(0, s * 4);
  const a = new Uint8Array(s * i.bytesPerPixel);
  if (r === "r8unorm") {
    for (let o = 0; o < s; o++) a[o] = t[o * 4];
    return a;
  }
  if (r === "rg8unorm") {
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
function Gn(t, e, n, r) {
  const i = e * r, s = new Uint8Array(t.byteLength);
  for (let a = 0; a < n; a++) {
    const o = a * i, l = (n - 1 - a) * i;
    s.set(t.subarray(o, o + i), l);
  }
  return s;
}
async function cg(t, e) {
  if (typeof createImageBitmap != "function")
    throw new u(
      "[gpu-device-api] GfxTexture.fromImage requires createImageBitmap, which this environment does not provide; use GfxTexture.create() with raw pixels or an ImageData source instead."
    );
  const n = {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
    ...e
  };
  if (typeof t == "string") {
    const r = await fetch(t);
    if (!r.ok)
      throw new u(
        `[gpu-device-api] GfxTexture.fromImage: fetching "${t}" failed with HTTP ${r.status}.`
      );
    return await createImageBitmap(await r.blob(), n);
  }
  return await createImageBitmap(t, n);
}
function lw(t, e, n) {
  const r = [{ data: t, width: e, height: n }];
  let i = t, s = e, a = n;
  for (; s > 1 || a > 1; ) {
    const o = Math.max(1, s >> 1), l = Math.max(1, a >> 1), c = new Uint8Array(o * l * 4);
    for (let h = 0; h < l; h++) {
      const p = Math.min(h * 2, a - 1), d = Math.min(h * 2 + 1, a - 1);
      for (let f = 0; f < o; f++) {
        const m = Math.min(f * 2, s - 1), g = Math.min(f * 2 + 1, s - 1), b = (p * s + m) * 4, w = (p * s + g) * 4, y = (d * s + m) * 4, S = (d * s + g) * 4, $ = (h * o + f) * 4;
        for (let P = 0; P < 4; P++)
          c[$ + P] = i[b + P] + i[w + P] + i[y + P] + i[S + P] >> 2;
      }
    }
    r.push({ data: c, width: o, height: l }), i = c, s = o, a = l;
  }
  return r;
}
function ug(t) {
  const e = t;
  if (e.programs instanceof gr) return e.programs;
  throw new u(
    "[gpu-device-api] prewarmWebGL2RenderPipeline: expected a WebGL2 device created by this library (its `programs` program cache was not found). Use the WebGPU helper for a WebGPU device."
  );
}
async function hg(t, e, n = {}) {
  const r = ug(t), i = e.label ?? "renderPipeline";
  if (!e.fragment)
    throw new u(
      `[gpu-device-api] prewarmWebGL2RenderPipeline: WebGL2 needs both a vertex and a fragment stage (GL links them into one program), but pipeline "${i}" has no fragment stage.`
    );
  const s = ct({
    backend: "webgl2",
    source: e.vertex.module.source,
    stage: L.Vertex,
    label: i,
    defines: e.vertex.module.defines,
    glsl: e.vertex.module.glsl
  }).code, a = ct({
    backend: "webgl2",
    source: e.fragment.module.source,
    stage: L.Fragment,
    label: i,
    defines: e.fragment.module.defines,
    glsl: e.fragment.module.glsl
  }).code, o = await r.compileAsync(i, s, a, n), l = gr.toPrewarmResult(i, o);
  if (!l.ok) {
    if (n.throwOnError) throw new u(Xn(l.info));
    return { ...l, pipeline: null };
  }
  const c = t.createRenderPipeline(e);
  return { ...l, pipeline: c };
}
function dg(t, e) {
  if (t.backend !== "webgpu")
    throw new u(
      `[gpu-device-api] ${e}: expected a WebGPU device, got backend "${t.backend}".`
    );
}
async function pg(t, e, n = {}, r = {}) {
  dg(t, "prewarmWebGPURenderPipeline");
  const i = t.createRenderPipeline(e);
  if (!(i instanceof $r))
    throw new u(
      "[gpu-device-api] prewarmWebGPURenderPipeline: createRenderPipeline() returned a pipeline that is not a WebGPURenderPipeline; this helper only works with the WebGPU backend."
    );
  const s = await i.prewarm(n, r);
  return { ...s, pipeline: s.ok ? i : null };
}
const fg = "timestamp-query";
function Li(t) {
  const e = t.timing;
  return e ? t.backend === "webgl2" ? e.passTimestamps ? "pass" : "none" : e.encoderTimestamps ? "encoder" : "none" : "none";
}
const Mi = 32, Ri = 8, mg = 4;
class ot {
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
    return Li(e) !== "none";
  }
  constructor(e, n = {}) {
    this.device = e, this.backend = e.backend, this.frames = Fi(n.frames ?? Mi, Mi, 4, 256), this.delay = Fi(n.delay ?? Ri, Ri, 1, this.frames - 1), this.recentSlots = new Array(this.frames).fill(null);
    const r = Li(e);
    if (r === "none")
      throw new u(gg(e));
    this.path = r, this.slotStride = r === "pass" ? 1 : 2, this.querySet = e.createQuerySet({
      label: "gfx-gpu-timing",
      type: Xe.Timestamp,
      count: this.frames * this.slotStride
    });
  }
  get disposed() {
    return this._disposed;
  }
  get stats() {
    return {
      enabled: !this._disposed,
      available: ot.isAvailable(this.device),
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
    if (this.path !== "encoder") return;
    const n = this.selectSlot();
    n !== null && e.writeTimestamp(this.querySet, n * this.slotStride + 1);
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
    const n = e - this.delay;
    if (n < 0) {
      this.skippedCount += 1;
      return;
    }
    if (this.inFlight >= mg) {
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
      const l = o[0] ?? 0n, c = this.slotStride === 2 ? o[1] ?? l : l, h = this.slotStride === 2 ? l : 0n;
      this.lastMs = Po(h, c, a), this.sampleCount += 1;
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
function Fi(t, e, n, r) {
  return Number.isFinite(t) ? Math.max(n, Math.min(Math.trunc(t), r)) : e;
}
function gg(t) {
  const e = t.timing?.unavailableReason;
  return e || `[gpu-device-api] gfx GPU timing: this device does not report a usable GPU timing path ("encoder" via CommandEncoder.writeTimestamp(), or "pass" via pass timestamp writes), so timing cannot be enabled. Read GPU time from the backend's own profiler instead.`;
}
function Gt(t) {
  const e = t instanceof Error ? t.message : String(t);
  return e.startsWith("[gpu-device-api]") ? e : `[gpu-device-api] ${e}`;
}
const bg = le(), wg = "the pipeline of this material was already built; prewarm skipped it so the compiled program is reused as-is";
class Na {
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
  normalMatrixScratch = us();
  /** 排序时算「包围球中心的世界坐标」用的暂存区。 */
  sortPointScratch = M();
  /** 视锥剔除器：`updateCamera()` 里按当帧矩阵刷新。 */
  culler = new tg();
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
    this.backend = e.backend, this.device = e.device, this.context = e.context, this.canvas = e.canvas, this.logger = e.logger, this.camera = e.options.camera ?? null, this._clearColor = e.options.clearColor ?? "#0b0e13", this._pixelRatio = e.options.pixelRatio ?? e.context.pixelRatio, this._width = e.context.width, this._height = e.context.height, this._culling = e.options.culling ?? !0, this._sortMode = e.options.sort ?? "none", this._rowOrder = e.options.rowOrder ?? "unified", this.arenaPool = new Xm(e.device);
  }
  /** 创建渲染器：自动探测后端、创建设备、配置 canvas。 */
  static async create(e) {
    const n = e.logger ?? pt("gpu-device-api/gfx"), r = {
      antialias: e.antialias ?? !0,
      alpha: e.alpha ?? !1,
      depth: e.depth ?? !0,
      stencil: !1,
      premultipliedAlpha: !0,
      preserveDrawingBuffer: !1,
      powerPreference: e.powerPreference ?? "high-performance",
      ...e.contextAttributes
    }, i = r.depth !== !1, s = await Ia({
      canvas: e.canvas,
      backend: e.backend ?? "auto",
      label: "gfx-renderer",
      contextAttributes: r,
      // GPU 计时需要 `timestamp-query`，而 WebGPU 只能在 requestDevice 时申请。
      // 用 optionalFeatures：后端不支持时忽略而不是让整个 Renderer.create 失败
      //（真正的失败原因由 enableGpuTiming() → createQuerySet() 给出）。
      ...e.requiredFeatures ? { requiredFeatures: e.requiredFeatures } : {},
      ...e.gpuTiming ? { optionalFeatures: [fg] } : {}
    });
    if (!s.context)
      throw new u("[gpu-device-api] 创建 Renderer 必须提供 canvas。");
    const a = e.sampleCount ?? (s.backend === "webgpu" && (e.antialias ?? !0) ? 4 : void 0);
    (a !== void 0 || !i) && s.device.createCanvasContext(e.canvas, {
      ...a !== void 0 ? { sampleCount: a } : {},
      ...i ? {} : { depth: !1 }
    });
    const o = new Na({
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
      } catch (l) {
        o.gpuTimingError = Gt(l), n.warn(`GPU 计时不可用：${o.gpuTimingError}`);
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
    const n = un.create(this.device, e);
    return this.geometries.add(n), n;
  }
  /** 创建（或直接登记）一个材质。 */
  createMaterial(e) {
    const n = e instanceof cn ? e : qm(e);
    return this.materials.has(n) || this.materials.set(n, {
      material: n,
      layout: n.createPipelineLayout(this.device),
      pipeline: null,
      pipelineFlipped: null,
      // 还原掉 createUniforms() 的 Proxy：渲染器的每 draw 写入路径直接操作原始对象，
      // 免得每次 set()/has() 都穿一遍 Proxy 陷阱（见 unwrapUniforms 的说明）。
      values: n.uniforms ? Dm(n.createUniforms()) : null,
      pipelineId: this.nextPipelineId++,
      // 半透明物不能被随意排序（见 DrawSort）：这里解析一次混合状态，之后只读这个布尔值。
      transparent: n.resolveBlend() !== null
    }), n;
  }
  createTexture(e) {
    const n = we.create(this.device, e);
    return this.textures.add(n), n;
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
    return ot.isAvailable(this.device);
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
      available: ot.isAvailable(this.device),
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
    const n = new ot(this.device, e);
    this.gpuTimingValue = n, this.gpuTimingError = null;
  }
  /** 关闭 GPU 计时并释放 query set。 */
  disableGpuTiming() {
    const e = this.gpuTimingValue;
    if (this.gpuTimingValue = null, this.statsValue.gpuFrameTime = null, !!e)
      try {
        e.destroy();
      } catch (n) {
        this.logger.warn(`释放 GPU 计时资源失败：${Gt(n)}`);
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
    const n = this.gpuTimingValue;
    if (n)
      try {
        e(n);
      } catch (r) {
        this.disableGpuTimingAfterFailure(n, r);
      }
  }
  /** 运行中失败后的降级收尾（见 {@link Renderer.runGpuTimingStep}）；绝不抛。 */
  disableGpuTimingAfterFailure(e, n) {
    this.gpuTimingValue = null, this.gpuTimingError = Gt(n), this.statsValue.gpuFrameTime = null;
    try {
      e.destroy();
    } catch (r) {
      this.logger.warn(`释放 GPU 计时资源时又失败了一次：${Gt(r)}`);
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
    const n = k(), r = e.materials ?? [...this.materials.keys()], i = e.target ? { target: e.target } : {}, s = this.flipsRowsFor(i), a = {
      ...e.timeoutMs !== void 0 ? { timeoutMs: e.timeoutMs } : {},
      ...e.throwOnError !== void 0 ? { throwOnError: e.throwOnError } : {}
    }, o = [];
    let l = null, c = 0, h = 0, p = 0;
    for (const d of r) {
      const f = this.materialState(d), m = s ? f.pipelineFlipped : f.pipeline;
      if (m) {
        h += 1, o.push(await this.skippedPrewarmResult(f, m));
        continue;
      }
      const g = this.pipelineDescriptorFor(f, s), b = this.pipelineVariantFor(g, i);
      l ??= b;
      const w = this.backend === "webgl2" ? await hg(this.device, g, a) : await pg(this.device, g, b, a);
      w.pipeline && (s ? f.pipelineFlipped = w.pipeline : f.pipeline = w.pipeline), w.ok ? c += 1 : p += 1, o.push({
        material: d,
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
      ...this.summarizePrewarm(o, c, h, p),
      durationMs: k() - n,
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
    const n = this.materialState(e), r = n.pipeline ?? n.pipelineFlipped;
    return r ? this.readCompilationInfo(r) : (await this.prewarm({ materials: [e] })).results[0].info;
  }
  /** 由逐条明细汇总出的整体结论（`mode` / `reason` / `ok` 的口径见各自的类型注释）。 */
  summarizePrewarm(e, n, r, i) {
    const s = e.filter((c) => !c.skipped);
    let a = null;
    s.length > 0 && (a = s.every((c) => c.mode === "async") ? "async" : "sync");
    const o = s.find((c) => !c.ok && c.reason !== null)?.reason ?? null, l = a === "sync" ? s.find((c) => c.mode === "sync")?.reason ?? null : null;
    return { mode: a, reason: o ?? l, ok: i === 0, prewarmed: n, skipped: r, failed: i };
  }
  /** 已建过管线时的结果：不重新预热，只把诊断读回来（结果形状与真预热一致）。 */
  async skippedPrewarmResult(e, n) {
    const r = k(), i = await this.readCompilationInfo(n);
    return {
      material: e.material,
      label: n.label,
      ok: !i.hasErrors,
      skipped: !0,
      mode: null,
      reason: wg,
      durationMs: k() - r,
      info: i,
      pipeline: n,
      variant: null
    };
  }
  /** 读一条管线的诊断；后端没提供这个能力时**如实说明**（而不是假装「编译干净」）。 */
  async readCompilationInfo(e) {
    return typeof e.getCompilationInfo == "function" ? e.getCompilationInfo() : ye({
      label: e.label,
      backend: this.backend,
      messages: [
        ve({
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
    const n = e.color ?? this._clearColor, r = this.createPassDescriptor(e, n);
    if (!r.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前帧没有颜色附件，无法开始渲染通道。");
    this.passFlipsRows = this.flipsRowsFor(e), this.pass = this.encoder.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: r.colorAttachments,
      ...r.depthStencilAttachment ? { depthStencilAttachment: r.depthStencilAttachment } : {},
      // GPU 计时只标在本帧第一个通道上：单通道帧（beginFrame 的默认形态）就是整帧；
      // 多通道时 beginPass() 开的通道不写时间戳，避免把不同通道混进同一个样本。
      ...this.timestampWritesForPass()
    }), this.commandBuffers = [], this.statsValue.drawCalls = 0, this.statsValue.triangles = 0, this.statsValue.instances = 0, this.statsValue.pipelineSwitches = 0, this.statsValue.culled = 0, this.statsValue.cullTested = 0, this.statsValue.cullSkipped = 0, this.statsValue.sorted = 0, this.currentPipeline = null, this._inFrame = !0;
  }
  endFrame() {
    if (!this._inFrame) return;
    this.flushPending(), this.pass?.end();
    const e = this.encoder;
    e && (this.runGpuTimingStep((r) => r.afterFrameEncoding(e)), this.commandBuffers.push(e.finish())), this.commandBuffers.length > 0 && this.device.queue.submit(this.commandBuffers);
    const n = typeof performance < "u" ? performance.now() : Date.now();
    this.statsValue.frameTime = n - this.frameStart, this.gpuTimingValue && (this.runGpuTimingStep((r) => r.onFrameSubmitted()), this.statsValue.gpuFrameTime = this.gpuTimingValue?.stats.gpuFrameTimeMs ?? null), this.pass = null, this.encoder = null, this.commandBuffers = [], this._inFrame = !1;
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
    const n = this.encoder, r = this.createPassDescriptor(e, e.color ?? this._clearColor);
    if (!r.colorAttachments[0]?.view)
      throw new u("[gpu-device-api] 当前通道没有颜色附件。");
    this.passFlipsRows = this.flipsRowsFor(e), this.pass = n.beginRenderPass({
      label: "gfx-pass",
      colorAttachments: r.colorAttachments,
      ...r.depthStencilAttachment ? { depthStencilAttachment: r.depthStencilAttachment } : {}
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
    return this.runGpuTimingStep((n) => {
      e = n.passTimestampWrites();
    }), e ? { timestampWrites: e } : {};
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
    const i = this.materialState(r);
    if (e.validateAgainst(r.attributes, r.name), this.assertInstanceCount(e, n.instances), !this.isCulled(e, n.model)) {
      if (this._sortMode === "none") {
        this.submitDraw(e, r, i, n);
        return;
      }
      this.enqueueDraw(e, r, i, n);
    }
  }
  /**
   * 视锥剔除判定。返回 `true` 表示「整体在视锥外，别画了」。
   *
   * 判定失败（没有相机、还没有视锥、几何体没有可用包围球）时一律返回 `false`
   * 并计入 `stats.cullSkipped` —— 剔除只能少画，绝不能多剔。
   */
  isCulled(e, n) {
    if (!this._culling) return !1;
    if (this.statsValue.cullTested += 1, !this.camera || !this.culler.ready)
      return this.statsValue.cullTested -= 1, this.statsValue.cullSkipped += 1, !1;
    const r = e.boundingSphere;
    return !r || !e.cullable ? (this.statsValue.cullTested -= 1, this.statsValue.cullSkipped += 1, !1) : this.culler.intersectsLocalSphere(r, n) ? !1 : (this.statsValue.culled += 1, !0);
  }
  /** 排序模式：把这次绘制存进队列，算好排序键。 */
  enqueueDraw(e, n, r, i) {
    const s = n.textures.length > 0 ? this.acquireTextureBindGroup(n, i.textures ?? {}) : null;
    this.pending.push({
      geometry: e,
      material: n,
      state: r,
      options: i,
      pipeline: r.pipelineId,
      bindings: s ? this.textureGroupId(s) : 0,
      depth: this.depthOf(e, i.model),
      transparent: r.transparent,
      order: this.pending.length
    }), this.statsValue.sorted += 1;
  }
  /** 把排队的绘制按当前模式排序后提交（`beginPass()` / `endFrame()` / 切模式时调用）。 */
  flushPending() {
    const e = this.pending;
    if (e.length !== 0)
      try {
        rg(e, this._sortMode);
        for (const n of e)
          this.submitDraw(n.geometry, n.material, n.state, n.options);
      } finally {
        e.length = 0;
      }
  }
  /** 真正把一次绘制写进命令缓冲。`draw()` 与排序队列的 flush 都走这里。 */
  submitDraw(e, n, r, i) {
    const s = this.acquirePipeline(r);
    if (this.pass.setPipeline(s), this.currentPipeline !== s && (this.currentPipeline = s, this.statsValue.pipelineSwitches += 1), n.uniforms && r.values) {
      if (this.applyCameraUniforms(r.values, n), n.uniforms.has("model") && r.values.set("model", i.model ?? bg), this.updateNormalMatrix(r.values, n), i.uniforms)
        for (const [o, l] of Object.entries(i.uniforms))
          this.setIfPresent(r.values, o, l);
      const a = n.createUniformBindGroupLayout(this.device);
      if (a) {
        const o = this.arenaPool.acquire(n.uniforms), l = o.write(r.values);
        this.pass.setBindGroup(n.uniforms.group, o.bindGroup(a), [l]);
      }
    }
    if (n.textures.length > 0) {
      const a = this.acquireTextureBindGroup(n, i.textures ?? {});
      a && this.pass.setBindGroup(n.textureGroup, a);
    }
    for (const a of n.attributes) {
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
    }), this.statsValue.drawCalls += 1, this.statsValue.instances += i.instances ?? 1, this.statsValue.triangles += yg(e, i) * (i.instances ?? 1);
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
    const n = this.materials.get(e);
    return n || (this.createMaterial(e), this.materials.get(e));
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
  pipelineDescriptorFor(e, n = !1) {
    const r = e.material.createPipelineDescriptor(this.device).descriptor;
    if (!n) return r;
    const i = (r.primitive?.frontFace ?? "ccw") === "ccw" ? "cw" : "ccw";
    return { ...r, primitive: { ...r.primitive, frontFace: i } };
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
  pipelineVariantFor(e, n) {
    const r = this.createPassDescriptor(n, this._clearColor), i = [];
    for (const a of r.colorAttachments)
      a && i.push(this.attachmentFormat(a.view));
    const s = r.depthStencilAttachment?.view ?? null;
    return {
      colorFormats: i,
      sampleCount: this.backend === "webgl2" ? this.webgl2SampleCountFor(n) : this.webgpuSampleCountFor(r),
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
    for (const n of e.colorAttachments)
      if (n) return n.view.texture.sampleCount;
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
  applyCameraUniforms(e, n) {
    const r = this.camera;
    if (!r) return;
    const i = this.passFlipsRows;
    n.uniforms?.has("projectionView") && e.set(
      "projectionView",
      i ? this.flippedProjectionViewMatrix : r.projectionViewMatrix
    ), n.uniforms?.has("projection") && e.set("projection", i ? this.flippedProjectionMatrix : r.projectionMatrix), n.uniforms?.has("view") && e.set("view", r.viewMatrix), n.uniforms?.has("cameraPosition") && e.set("cameraPosition", r.position);
  }
  /** 纹理 bind group 的排序序号（对象身份 → 小整数，只在第一次见到时分配）。 */
  textureGroupId(e) {
    let n = this.textureGroupIds.get(e);
    return n === void 0 && (n = this.nextTextureGroupId++, this.textureGroupIds.set(e, n)), n;
  }
  /**
   * 这次绘制离相机多远（视空间深度，越大越远），供半透明物按「从远到近」排序。
   *
   * 用包围球中心当代表值：单个物体内部的三角形顺序不归排序管（那是深度测试的事）。
   * 没有包围球或没有相机时返回 0 —— 排序仍然稳定，只是这一项不参与区分。
   */
  depthOf(e, n) {
    const r = e.boundingSphere, i = this.camera;
    if (!r || !i) return 0;
    const s = this.sortPointScratch;
    n ? ar(s, n, r.center) : ie(s, r.center);
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
    e.aspect = this.aspect, e.depthRange = this.backend === "webgpu" ? "zo" : "gl", e.update(), Un(this.flippedProjectionMatrix, e.projectionMatrix), Un(this.flippedProjectionViewMatrix, e.projectionViewMatrix), this._culling && this.culler.update(e.projectionViewMatrix, e.depthRange);
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
    er(this.normalMatrixScratch, r) || hs(this.normalMatrixScratch), e.set("normalMatrix", this.normalMatrixScratch);
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
      const p = i[h];
      return [
        { binding: c.binding, resource: { view: p.view } },
        { binding: c.samplerBinding, resource: { sampler: p.sampler } }
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
    return this.defaultTexture || (this.defaultTexture = we.create(this.device, {
      label: "default-white",
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      mipmaps: !1
    })), this.defaultTexture;
  }
}
function yg(t, e) {
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
const vg = 1e-6, Bi = M(), Gi = M();
function Qe(t, e, n, r, i) {
  if (e === void 0) return he(t, n, r, i);
  if (e.length < 3)
    throw new RangeError("[gpu-device-api] A vector option needs at least 3 components.");
  const s = e[0], a = e[1], o = e[2];
  if (!Number.isFinite(s) || !Number.isFinite(a) || !Number.isFinite(o))
    throw new RangeError(`[gpu-device-api] A vector option must be finite, got (${s}, ${a}, ${o}).`);
  return he(t, s, a, o);
}
function Wa(t) {
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function xg(t, e, n) {
  if (!(t > 0) || t >= 180)
    throw new RangeError(`[gpu-device-api] fov must be in (0, 180) degrees, got ${t}.`);
  if (!(e > 0))
    throw new RangeError(`[gpu-device-api] near must be a finite positive number, got ${e}.`);
  if (Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near (Infinity is allowed), got ${n}.`);
}
function Sg(t, e, n) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] size must be a finite positive number, got ${t}.`);
  if (!Number.isFinite(e) || Number.isNaN(n) || n <= e)
    throw new RangeError(`[gpu-device-api] far must be greater than near, got near = ${e}, far = ${n}.`);
}
function za(t) {
  if (de(Bi, t.position, t.target), We(Bi) < vg) {
    he(Gi, t.target[0], t.target[1], t.target[2] + 1), Dn(t.viewMatrix, Gi, t.target, t.up);
    return;
  }
  Dn(t.viewMatrix, t.position, t.target, t.up);
}
class cw {
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
    this.position = Qe(M(), e.position, 0, 0, 5), this.target = Qe(M(), e.target, 0, 0, 0), this.up = Qe(M(), e.up, 0, 1, 0), this.fov = e.fov ?? 60, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this._depthRange = e.depthRange ?? "gl", this.update();
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
    xg(this.fov, this.near, this.far), za(this), this.computeProjection();
  }
  /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
  computeProjection() {
    const e = Ys(this.fov), n = Wa(this.aspect);
    this._depthRange === "zo" ? xs(this.projectionBuffer, e, n, this.near, this.far) : vs(this.projectionBuffer, e, n, this.near, this.far), this.projectedDepthRange = this._depthRange, K(this.projectionViewBuffer, this.projectionBuffer, this.viewMatrix);
  }
  /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
  ensureProjection() {
    this.projectedDepthRange !== this._depthRange && this.computeProjection();
  }
}
class uw {
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
    this.position = Qe(M(), e.position, 0, 0, 5), this.target = Qe(M(), e.target, 0, 0, 0), this.up = Qe(M(), e.up, 0, 1, 0), this.size = e.size ?? 2, this.near = e.near ?? 0.1, this.far = e.far ?? 1e3, this.aspect = e.aspect ?? 1, this._depthRange = e.depthRange ?? "gl", this.update();
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
    Sg(this.size, this.near, this.far), za(this), this.computeProjection();
  }
  /** 按 `_depthRange` 选一套函数，算出唯一的那份投影矩阵，并刷新 projectionView。 */
  computeProjection() {
    const e = this.size / 2, n = e * Wa(this.aspect);
    this._depthRange === "zo" ? Ts(this.projectionBuffer, -n, n, -e, e, this.near, this.far) : Ss(this.projectionBuffer, -n, n, -e, e, this.near, this.far), this.projectedDepthRange = this._depthRange, K(this.projectionViewBuffer, this.projectionBuffer, this.viewMatrix);
  }
  /** 缓存失效（`depthRange` 换过）时按新约定重算一次；有效时什么都不做。 */
  ensureProjection() {
    this.projectedDepthRange !== this._depthRange && this.computeProjection();
  }
}
const Oi = 1e-4, be = 1e-6, Tg = 0.95, H = M(), Ii = M(), Ui = M();
function Pe(t, e) {
  if (!Number.isFinite(t))
    throw new RangeError(`[gpu-device-api] ${e} must be a finite number, got ${t}.`);
  return t;
}
class hw {
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
  constructor(e, n, r = {}) {
    if (!n || typeof n.addEventListener != "function" || typeof n.removeEventListener != "function")
      throw new TypeError("[gpu-device-api] OrbitControls requires a DOM element with addEventListener/removeEventListener.");
    if (!e || !e.position || !e.target || typeof e.update != "function")
      throw new TypeError("[gpu-device-api] OrbitControls requires a PerspectiveCamera instance.");
    if (this.camera = e, this.element = n, this.enabled = r.enabled ?? !0, this.enableRotate = r.enableRotate ?? !0, this.enableZoom = r.enableZoom ?? !0, this.enablePan = r.enablePan ?? !0, this.enableDamping = r.enableDamping ?? !0, this.dampingFactor = Ne(r.dampingFactor ?? 0.08, 0, 1), this.rotateSpeed = Pe(r.rotateSpeed ?? 1, "options.rotateSpeed"), this.zoomSpeed = Pe(r.zoomSpeed ?? 1, "options.zoomSpeed"), this.panSpeed = Pe(r.panSpeed ?? 1, "options.panSpeed"), this.minDistance = Pe(r.minDistance ?? 0.1, "options.minDistance"), this.maxDistance = Pe(r.maxDistance ?? 1e3, "options.maxDistance"), this.minPolarAngle = Pe(r.minPolarAngle ?? 0, "options.minPolarAngle"), this.maxPolarAngle = Pe(r.maxPolarAngle ?? Math.PI, "options.maxPolarAngle"), this.minDistance <= 0)
      throw new RangeError(`[gpu-device-api] minDistance must be positive, got ${this.minDistance}.`);
    if (this.maxDistance < this.minDistance)
      throw new RangeError(`[gpu-device-api] maxDistance must not be smaller than minDistance, got ${this.maxDistance}.`);
    if (this.minPolarAngle < 0 || this.maxPolarAngle > Math.PI || this.minPolarAngle > this.maxPolarAngle)
      throw new RangeError(
        `[gpu-device-api] polar angles must satisfy 0 <= minPolarAngle <= maxPolarAngle <= PI, got ${this.minPolarAngle} and ${this.maxPolarAngle}.`
      );
    if (this.rotateSpeed < 0 || this.zoomSpeed < 0 || this.panSpeed < 0)
      throw new RangeError("[gpu-device-api] Speed options must be non-negative.");
    ie(this.initialPosition, e.position), ie(this.initialTarget, e.target), ie(this.previousPosition, e.position), ie(this.previousTarget, e.target), this.readSpherical(), this.element.addEventListener("pointerdown", this.onPointerDown), this.element.addEventListener("pointermove", this.onPointerMove), this.element.addEventListener("pointerup", this.onPointerUp), this.element.addEventListener("pointercancel", this.onPointerUp), this.element.addEventListener("wheel", this.onWheel, { passive: !1 }), this.element.addEventListener("contextmenu", this.onContextMenu);
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
    ie(this.previousPosition, r), ie(this.previousTarget, n), de(H, r, n);
    let i = We(H);
    i < be ? i = this.minDistance : (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(Ne(H[1] / i, -1, 1)));
    const s = Math.abs(this.deltaTheta) > be || Math.abs(this.deltaPhi) > be, a = Math.abs(this.scale - 1) > be, o = We(this.panOffset) > be;
    if (!s && !a && !o)
      return !1;
    const l = this.enableDamping ? this.dampingFactor : 1;
    this.theta += this.deltaTheta * l, this.phi += this.deltaPhi * l, this.phi = Ne(
      this.phi,
      Math.max(this.minPolarAngle, Oi),
      Math.min(this.maxPolarAngle, Math.PI - Oi)
    ), i = Ne(i * this.scale, this.minDistance, this.maxDistance), It(n, n, this.panOffset, l);
    const c = Math.sin(this.phi) * i;
    he(
      r,
      n[0] + c * Math.sin(this.theta),
      n[1] + Math.cos(this.phi) * i,
      n[2] + c * Math.cos(this.theta)
    ), this.enableDamping ? (this.deltaTheta *= 1 - this.dampingFactor, this.deltaPhi *= 1 - this.dampingFactor, Nt(this.panOffset, this.panOffset, 1 - this.dampingFactor)) : (this.deltaTheta = 0, this.deltaPhi = 0, On(this.panOffset)), this.scale = 1, e.update();
    const h = !In(r, this.previousPosition, be), p = !In(n, this.previousTarget, be);
    return h || p;
  }
  /** 恢复构造函数时刻的相机位置、target 与内部状态。 */
  reset() {
    this.disposed || (ie(this.camera.position, this.initialPosition), ie(this.camera.target, this.initialTarget), this.deltaTheta = 0, this.deltaPhi = 0, this.scale = 1, On(this.panOffset), this.mode = "none", this.pinchDistance = 0, this.pointers.clear(), this.readSpherical(), this.camera.update());
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
    de(H, this.camera.position, this.camera.target);
    const e = We(H);
    e < be || (this.theta = Math.atan2(H[0], H[2]), this.phi = Math.acos(Ne(H[1] / e, -1, 1)));
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
    de(H, r.position, r.target);
    const o = 2 * (We(H) * Math.tan(Ys(r.fov) / 2)) * this.panSpeed / s;
    he(Ii, i[0], i[4], i[8]), he(Ui, i[1], i[5], i[9]), It(this.panOffset, this.panOffset, Ii, -e * o), It(this.panOffset, this.panOffset, Ui, n * o);
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
    const n = Math.pow(Tg, this.zoomSpeed);
    e.deltaY < 0 ? this.scale *= n : e.deltaY > 0 && (this.scale /= n);
  };
  onContextMenu = (e) => {
    !this.enabled || !this.enablePan || e.cancelable && e.preventDefault();
  };
}
const Ve = M();
function Ze() {
  return { position: [], normal: [], uv: [], index: [] };
}
function qa() {
  return { position: [], color: [] };
}
function Se(t, e, n, r, i, s, a, o, l) {
  he(Ve, i, s, a), Kn(Ve, Ve), t.position.push(e, n, r), t.normal.push(Ve[0], Ve[1], Ve[2]), t.uv.push(o, l);
}
function G(t, e, n, r, i, s, a, o) {
  t.position.push(e, n, r), t.color.push(i, s, a, o);
}
function Ke(t) {
  return {
    position: Float32Array.from(t.position),
    normal: Float32Array.from(t.normal),
    uv: Float32Array.from(t.uv),
    indices: Uint32Array.from(t.index)
  };
}
function ja(t) {
  return {
    position: Float32Array.from(t.position),
    color: Float32Array.from(t.color)
  };
}
function Qa(t) {
  return t.position.length / 3;
}
function Q(t, e) {
  if (!Number.isFinite(t) || t <= 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite positive number, got ${t}.`);
  return t;
}
function Di(t, e) {
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError(`[gpu-device-api] ${e} must be a finite non-negative number, got ${t}.`);
  return t;
}
function Z(t, e, n) {
  if (!Number.isInteger(t) || t < e)
    throw new RangeError(`[gpu-device-api] ${n} must be an integer greater than or equal to ${e}, got ${t}.`);
  return t;
}
const $g = [0.5, 0.5, 0.5, 1];
function Pg(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius"), n = Ze();
  for (let r = 0; r < 3; r++) {
    const i = Math.PI / 2 + r * 2 * Math.PI / 3, s = Math.cos(i) * e, a = Math.sin(i) * e;
    Se(n, s, a, 0, 0, 0, 1, s / (2 * e) + 0.5, a / (2 * e) + 0.5);
  }
  return n.index.push(0, 1, 2), Ke(n);
}
function Ag(t = {}) {
  const e = Q(t.width ?? 1, "options.width"), n = Q(t.height ?? 1, "options.height"), r = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), i = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), s = Ze(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = -n / 2 + l * n;
    for (let h = 0; h <= r; h++) {
      const p = h / r, d = -e / 2 + p * e;
      Se(s, d, c, 0, 0, 0, 1, p, l);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < r; l++) {
      const c = o * a + l, h = c + 1, p = c + a + 1, d = c + a;
      s.index.push(c, h, p, c, p, d);
    }
  return Ke(s);
}
function ke(t, e, n, r, i, s, a) {
  const o = Qa(t), l = s + 1;
  for (let c = 0; c <= a; c++) {
    const h = c / a;
    for (let p = 0; p <= s; p++) {
      const d = p / s;
      Se(
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
  for (let c = 0; c < a; c++)
    for (let h = 0; h < s; h++) {
      const p = o + c * l + h, d = p + 1, f = p + l + 1, m = p + l;
      t.index.push(p, d, f, p, f, m);
    }
}
function _g(t = {}) {
  const e = Q(t.width ?? 1, "options.width"), n = Q(t.height ?? 1, "options.height"), r = Q(t.depth ?? 1, "options.depth"), i = Z(t.widthSegments ?? 1, 1, "options.widthSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = Z(t.depthSegments ?? 1, 1, "options.depthSegments"), o = e / 2, l = n / 2, c = r / 2, h = Ze();
  return ke(h, [o, -l, -c], [0, n, 0], [0, 0, r], [1, 0, 0], s, a), ke(h, [-o, -l, -c], [0, 0, r], [0, n, 0], [-1, 0, 0], a, s), ke(h, [-o, l, -c], [0, 0, r], [e, 0, 0], [0, 1, 0], a, i), ke(h, [-o, -l, -c], [e, 0, 0], [0, 0, r], [0, -1, 0], i, a), ke(h, [-o, -l, c], [e, 0, 0], [0, n, 0], [0, 0, 1], i, s), ke(h, [-o, -l, -c], [0, n, 0], [e, 0, 0], [0, 0, -1], s, i), Ke(h);
}
function Eg(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius"), n = Z(t.widthSegments ?? 32, 3, "options.widthSegments"), r = Z(t.heightSegments ?? 16, 2, "options.heightSegments"), i = Ze(), s = n + 1;
  for (let a = 0; a <= r; a++) {
    const o = a / r, l = o * Math.PI, c = Math.sin(l), h = Math.cos(l);
    for (let p = 0; p <= n; p++) {
      const d = p / n, f = d * Math.PI * 2, m = c * Math.cos(f), g = h, b = c * Math.sin(f);
      Se(i, m * e, g * e, b * e, m, g, b, d, 1 - o);
    }
  }
  for (let a = 0; a < r; a++)
    for (let o = 0; o < n; o++) {
      const l = a * s + o, c = l + 1, h = l + s + 1, p = l + s;
      i.index.push(l, c, h, l, h, p);
    }
  return Ke(i);
}
function Cg(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius"), n = Q(t.tube ?? 0.2, "options.tube"), r = Z(t.radialSegments ?? 16, 3, "options.radialSegments"), i = Z(t.tubularSegments ?? 32, 3, "options.tubularSegments"), s = Ze(), a = r + 1;
  for (let o = 0; o <= i; o++) {
    const l = o / i, c = l * Math.PI * 2, h = Math.cos(c), p = Math.sin(c);
    for (let d = 0; d <= r; d++) {
      const f = d / r, m = f * Math.PI * 2, g = Math.cos(m), b = Math.sin(m), w = e + n * g, y = g * h, S = b, $ = g * p;
      Se(s, w * h, n * b, w * p, y, S, $, l, f);
    }
  }
  for (let o = 0; o < i; o++)
    for (let l = 0; l < r; l++) {
      const c = o * a + l, h = c + 1, p = c + a + 1, d = c + a;
      s.index.push(c, h, p, c, p, d);
    }
  return Ke(s);
}
function Vi(t, e, n, r, i) {
  const s = Qa(t);
  Se(t, 0, e, 0, 0, r, 0, 0.5, 0.5);
  for (let a = 0; a <= i; a++) {
    const o = a / i * Math.PI * 2, l = Math.sin(o), c = Math.cos(o);
    Se(t, n * l, e, n * c, 0, r, 0, 0.5 + l * 0.5, 0.5 + c * 0.5);
  }
  for (let a = 0; a < i; a++) {
    const o = s + 1 + a, l = o + 1;
    r > 0 ? t.index.push(s, o, l) : t.index.push(s, l, o);
  }
}
function Xa(t = {}) {
  const e = Di(t.radiusTop ?? 0.5, "options.radiusTop"), n = Di(t.radiusBottom ?? 0.5, "options.radiusBottom"), r = Q(t.height ?? 1, "options.height"), i = Z(t.radialSegments ?? 24, 3, "options.radialSegments"), s = Z(t.heightSegments ?? 1, 1, "options.heightSegments"), a = t.caps ?? !0;
  if (e === 0 && n === 0)
    throw new RangeError("[gpu-device-api] createCylinder requires radiusTop > 0 or radiusBottom > 0.");
  const o = Ze(), l = i + 1, c = Math.hypot(r, n - e), h = r / c, p = (n - e) / c;
  for (let d = 0; d <= s; d++) {
    const f = d / s, m = r / 2 - f * r, g = e + (n - e) * f;
    for (let b = 0; b <= i; b++) {
      const w = b / i, y = w * Math.PI * 2, S = Math.sin(y), $ = Math.cos(y);
      Se(o, g * S, m, g * $, h * S, p, h * $, w, 1 - f);
    }
  }
  for (let d = 0; d < s; d++)
    for (let f = 0; f < i; f++) {
      const m = d * l + f, g = m + 1, b = m + l + 1, w = m + l;
      o.index.push(m, w, b, m, b, g);
    }
  return a && (e > 0 && Vi(o, r / 2, e, 1, i), n > 0 && Vi(o, -r / 2, n, -1, i)), Ke(o);
}
function Lg(t = {}) {
  const e = Q(t.radius ?? 0.5, "options.radius");
  return Xa({
    radiusTop: 0,
    radiusBottom: e,
    height: t.height ?? 1,
    radialSegments: t.radialSegments ?? 24,
    heightSegments: 1,
    caps: t.caps ?? !0
  });
}
function Mg(t = {}) {
  const e = Q(t.size ?? 10, "options.size"), n = Z(t.divisions ?? 10, 1, "options.divisions"), r = t.plane ?? "xz", i = t.color ?? $g, [s, a, o, l] = i, c = qa(), h = e / 2, p = e / n;
  for (let d = 0; d <= n; d++) {
    const f = -h + d * p;
    r === "xz" ? (G(c, -h, 0, f, s, a, o, l), G(c, h, 0, f, s, a, o, l), G(c, f, 0, -h, s, a, o, l), G(c, f, 0, h, s, a, o, l)) : r === "xy" ? (G(c, -h, f, 0, s, a, o, l), G(c, h, f, 0, s, a, o, l), G(c, f, -h, 0, s, a, o, l), G(c, f, h, 0, s, a, o, l)) : (G(c, 0, -h, f, s, a, o, l), G(c, 0, h, f, s, a, o, l), G(c, 0, f, -h, s, a, o, l), G(c, 0, f, h, s, a, o, l));
  }
  return ja(c);
}
function Rg(t = {}) {
  const e = Q(t.size ?? 1, "options.size"), n = qa();
  return G(n, 0, 0, 0, 1, 0, 0, 1), G(n, e, 0, 0, 1, 0, 0, 1), G(n, 0, 0, 0, 0, 1, 0, 1), G(n, 0, e, 0, 0, 1, 0, 1), G(n, 0, 0, 0, 0, 0, 1, 1), G(n, 0, 0, e, 0, 0, 1, 1), ja(n);
}
const dw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createAxes: Rg,
  createBox: _g,
  createCone: Lg,
  createCylinder: Xa,
  createGrid: Mg,
  createPlane: Ag,
  createSphere: Eg,
  createTorus: Cg,
  createTriangle: Pg
}, Symbol.toStringTag, { value: "Module" }));
function dt(t, e) {
  return t ? [t[0], t[1], t[2], t[3] ?? 1] : [...e];
}
const Fe = {
  projectionView: "mat4x4f",
  model: "mat4x4f",
  /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它。 */
  normalMatrix: "mat3x3f"
};
function Ya(t = {}) {
  const e = dt(t.color, [1, 1, 1, 1]);
  return {
    name: "unlit",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Fe, baseColor: "vec4f" },
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
function Ha(t = {}) {
  const e = to(t.direction ?? [0.5, 1, 0.6]), n = dt(t.color, [1, 1, 1, 1]);
  return {
    name: "lambert",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Fe,
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
function Za(t = {}) {
  const e = to(t.direction ?? [0.5, 1, 0.6]), n = dt(t.color, [0.9, 0.9, 0.95, 1]), r = dt(t.specular, [1, 1, 1, 1]);
  return {
    name: "phong",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: {
      ...Fe,
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
function Ka() {
  return {
    name: "normalDebug",
    attributes: { position: "float32x3", normal: "float32x3", uv: "float32x2" },
    uniforms: { ...Fe },
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
function Ja(t = {}) {
  const e = dt(t.color, [0.5, 0.55, 0.62, 1]);
  return {
    name: "flatLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3" },
    uniforms: { ...Fe, baseColor: "vec4f" },
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
function eo() {
  return {
    name: "vertexColorLine",
    topology: "line-list",
    cullMode: "none",
    attributes: { position: "float32x3", color: "float32x4" },
    uniforms: { ...Fe },
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
const Fg = {
  unlit: Ya,
  lambert: Ha,
  phong: Za,
  normalDebug: Ka,
  flatLine: Ja,
  vertexColorLine: eo
};
function Bg(t) {
  return t.defaults ? { ...t.defaults } : {};
}
function to(t) {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}
const pw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SCENE_UNIFORM_FIELDS: Fe,
  defaultUniformsOf: Bg,
  flatLine: Ja,
  lambert: Ha,
  materials: Fg,
  normalDebug: Ka,
  phong: Za,
  unlit: Ya,
  vertexColorLine: eo
}, Symbol.toStringTag, { value: "Module" }));
export {
  Si as ATTRIBUTE_PLACEHOLDER,
  Yg as AddressMode,
  fo as BLEND_PRESETS,
  Qh as BackendRegistry,
  D as BindingType,
  zg as BlendFactor,
  qg as BlendOperation,
  F as BufferUsage,
  ts as CANVAS_DEPTH_FORMAT,
  ue as ColorWriteMask,
  Wg as CompareFunction,
  Qg as CullMode,
  Rm as DEFAULT_BACKEND_ORDER,
  po as DEFAULT_BLEND_COMPONENT,
  _r as DEFAULT_DEPTH_STATE,
  Ri as DEFAULT_GPU_TIMING_DELAY,
  Mi as DEFAULT_GPU_TIMING_FRAMES,
  Yn as DEFAULT_PREWARM_TIMEOUT_MS,
  hn as DEFAULT_PRIMITIVE_STATE,
  Sh as DEG2RAD,
  ki as DEPTH_STENCIL_FORMATS,
  nt as DeviceLostError,
  _b as DisposalScope,
  kb as EPSILON,
  Hg as FilterMode,
  Xg as FrontFace,
  tg as FrustumCuller,
  sg as GFX_UPLOAD_FORMATS,
  jb as GLSL_PREAMBLE,
  Js as GLSL_PRECISION_PREAMBLE,
  zh as GLSL_SAMPLER_TYPES,
  Nh as GLSL_TYPE_NAMES,
  Ks as GLSL_VERSION_DIRECTIVE,
  fg as GPU_TIMING_FEATURE,
  un as Geometry,
  we as GfxTexture,
  ee as GpuError,
  ot as GpuTiming,
  Vg as IndexFormat,
  Tb as LOG_LEVEL_NAMES,
  Lo as LOG_LEVEL_VALUES,
  kg as LoadOp,
  j as LogLevel,
  Si as MATERIAL_ATTRIBUTE_PLACEHOLDER,
  Fn as MATERIAL_TEXTURE_PLACEHOLDER,
  Rn as MATERIAL_UNIFORM_PLACEHOLDER,
  cn as Material,
  hw as OrbitControls,
  uw as OrthographicCamera,
  uo as OutOfMemoryError,
  cw as PerspectiveCamera,
  Ig as PrimitiveTopology,
  Xe as QueryType,
  Th as RAD2DEG,
  Gg as RENDERABLE_FORMATS,
  Na as Renderer,
  Ji as RowOrder,
  Fe as SCENE_UNIFORM_FIELDS,
  ro as SHADER_STAGE_NAMES,
  Zm as STANDARD_ATTRIBUTE_FORMATS,
  vt as STENCIL_FACE_DEFAULT,
  L as ShaderStage,
  jg as StencilOperation,
  Ng as StoreOp,
  Fn as TEXTURE_PLACEHOLDER,
  Ot as TextureDimension,
  v as TextureUsage,
  bi as UNIFORM_FIELD_TYPES,
  Rn as UNIFORM_PLACEHOLDER,
  Qm as UniformArena,
  Xm as UniformArenaPool,
  ln as UniformLayout,
  vi as UniformValues,
  ao as VERTEX_FORMAT_INFO,
  u as ValidationError,
  Zg as VertexStepMode,
  Eo as alignTo,
  pb as alignTo4,
  Hn as assert,
  lb as assertDefined,
  R as assertNever,
  Ee as assertNonNegativeInteger,
  Qi as assertPassTimestampWrites,
  Ye as assertPositiveInteger,
  cb as assertPowerOfTwo,
  Ob as box3,
  lw as buildMipChain,
  db as byteLengthOf,
  Zi as cacheKey,
  Ne as clamp,
  tw as clearShaders,
  Db as color,
  yb as combineFlags,
  Ai as compareOpaque,
  ng as compareTransparent,
  wo as compilationStageName,
  ct as compileShaderStage,
  mb as concatTypedArrays,
  Rg as createAxes,
  _g as createBox,
  ye as createCompilationInfo,
  ve as createCompilationMessage,
  Lg as createCone,
  Xa as createCylinder,
  Pr as createDefaultBackendRegistry,
  aw as createDevice,
  Ia as createDeviceWithAdapter,
  ow as createGeometry,
  Mg as createGrid,
  pt as createLogger,
  mo as createPipelineCache,
  Ag as createPlane,
  Eg as createSphere,
  Cg as createTorus,
  Pg as createTriangle,
  km as createUniforms,
  xb as currentId,
  ns as defaultPixelRatio,
  ho as defaultTextureUsage,
  Bg as defaultUniformsOf,
  qm as defineMaterial,
  Ua as defineUniforms,
  Ys as degToRad,
  ob as describeAdapter,
  Xn as describeCompilationInfo,
  Gt as describeGpuTimingFailure,
  gg as describeGpuTimingUnavailable,
  Ah as describeShaderSource,
  Fm as detectBackend,
  rs as disposeAll,
  bo as emptyCompilationInfo,
  Bb as euler,
  rw as findWgslEntryPoint,
  Ja as flatLine,
  yo as formatCompilationMessage,
  vb as formatFlags,
  Qb as formatShaderErrorLog,
  Ub as frustum,
  zi as fullMipLevelCount,
  Pb as getGlobalLogLevel,
  Kb as getShader,
  Lh as glslDefines,
  Zs as glslFieldForStage,
  Wh as glslTypeName,
  Li as gpuTimingPath,
  wb as hasAllFlags,
  bb as hasAnyFlag,
  gb as hasFlag,
  Zb as hasShader,
  io as indexFormatByteSize,
  jh as inferBindGroupLayoutEntries,
  $h as inverseLerp,
  hb as isArrayBufferView,
  sw as isBackendAvailable,
  Ni as isBufferBinding,
  tb as isBufferBindingResource,
  ab as isCompilationInfo,
  no as isDepthStencilFormat,
  Mo as isDisposable,
  co as isGpuError,
  ka as isImageSource,
  Wi as isSamplerBinding,
  nb as isSamplerBindingResource,
  na as isSamplerType,
  Og as isSrgbFormat,
  Kg as isTextureBinding,
  rb as isTextureBindingResource,
  Ug as isTriangleTopology,
  ub as isTypedArray,
  Ha as lambert,
  Hs as languageForBackend,
  Wb as lerp,
  Gh as listShaderKeys,
  Mb as mat3,
  Rb as mat4,
  pw as materials,
  rt as measureCanvas,
  go as mergeCompilationInfo,
  Jg as mipLevelExtent,
  _h as missingSourceMessage,
  qb as nextAfter,
  O as nextId,
  Ka as normalDebug,
  Xi as normalizeBindGroupLayoutEntries,
  k as nowMs,
  Ab as nullLogger,
  Xb as numberLines,
  Co as paddedCopy,
  To as parseGlCompilationLog,
  Za as phong,
  Gb as plane,
  Dg as primitiveCount,
  Fb as quat,
  Nb as radToDeg,
  Ib as ray,
  Vb as raycaster,
  Gr as reflectGlslProgram,
  qh as reflectSamplerUniforms,
  nw as reflectWgslBindings,
  kh as reflectWgslEntryPoints,
  Bh as registerShader,
  Yb as registerShaders,
  Hb as replaceShader,
  Jb as requireShader,
  Sb as resetIdCounter,
  ib as resolveBindingLayoutEntry,
  sb as resolveBlendState,
  ea as resolveGlslWrapOptions,
  es as resolveLimits,
  qi as resolveSamplerDescriptor,
  ji as resolveShaderSource,
  Zt as resolveTextureSize,
  Vt as resolveTextureViewDescriptor,
  eb as samplerKey,
  $b as setGlobalLogLevel,
  dw as shapes,
  so as smallestIndexFormat,
  zb as smoothstep,
  rg as sortDraws,
  Ph as stageSource,
  ta as stripWgslComments,
  Po as timestampDeltaToMilliseconds,
  _o as toUint8View,
  fb as typedArrayElementSize,
  Ya as unlit,
  ew as unregisterShader,
  Yi as validateVertexBufferLayout,
  Eb as vec2,
  Cb as vec3,
  Lb as vec4,
  Hi as vertexBufferLayoutsKey,
  eo as vertexColorLine,
  oo as vertexFormatGlslType,
  Ce as vertexFormatInfo,
  lo as vertexFormatWgslType,
  iw as wgslBindingKeys,
  Mh as wgslDefines,
  Ki as withTimeout,
  Rh as wrapGlslSource,
  Fh as wrapWgslSource,
  $o as yieldToEventLoop
};
//# sourceMappingURL=gpu-device-api.js.map
