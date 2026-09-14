/**
 * 声明式 uniform：**一份描述同时生成两种语言的内存布局与着色器代码**。
 *
 * 这是便捷层「很方便就能绘制」的关键。写一次：
 *
 * ```ts
 * const uniforms = defineUniforms({
 *   projectionView: 'mat4x4f',
 *   model: 'mat4x4f',
 *   baseColor: 'vec4f',
 *   lightDirection: 'vec3f',
 *   time: 'f32',
 *   bones: 'mat4x4f[64]',
 * });
 * ```
 *
 * 就能得到：
 * 1. **字节布局**（同时满足 GLSL `std140` 与 WGSL uniform 地址空间）；
 * 2. GLSL 的块声明与 WGSL 的 struct + binding 声明（**成员访问都是 `u.xxx`**）；
 * 3. JS 侧的类型化写入器（`uniforms.model.set(mat4)`、`uniforms.time[0] = t`）。
 *
 * ## 布局规则（取两种规范的**交集**）
 *
 * | 类型 | 对齐 | 大小 |
 * |---|---|---|
 * | `f32` / `i32` / `u32` | 4 | 4 |
 * | `vec2f` / `vec2i` / `vec2u` | 8 | 8 |
 * | `vec3f` / `vec3i` / `vec3u` | 16 | 12 |
 * | `vec4f` / `vec4i` / `vec4u` | 16 | 16 |
 * | `mat4x4f` | 16 | 64（4 列 × 16 字节） |
 * | `mat3x3f` | 16 | 48（**每列补齐到 16 字节**） |
 * | `T[N]` | 16 | 元素步长取整到 16 的倍数 |
 *
 * 块总大小取整到 16 的倍数。
 *
 * ## 两个刻意拒绝的类型
 *
 * - **`mat2x2f`**：std140 认为它是「align 16 / size 32」（矩阵按列数组处理，列步长取整到 16），
 *   而 WGSL uniform 认为它是「align 8 / size 16」。两者**不一致**，所以直接拒绝，
 *   并提示改用 `vec4f` 手工解包。
 * - **`mat3x3f[N]`**：每列有 4 字节填充，无法表示为扁平数组，拒绝并提示改用 `mat4x4f[N]`。
 */

import { ValidationError } from '../core/errors/ValidationError.js';

/* ------------------------------------------------------------------------------------------------ */
/* 类型                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export type UniformScalarType = 'f32' | 'i32' | 'u32';
export type UniformVectorType =
  | 'vec2f'
  | 'vec3f'
  | 'vec4f'
  | 'vec2i'
  | 'vec3i'
  | 'vec4i'
  | 'vec2u'
  | 'vec3u'
  | 'vec4u';
export type UniformMatrixType = 'mat3x3f' | 'mat4x4f';
export type UniformElementType = UniformScalarType | UniformVectorType | UniformMatrixType;
/** 数组写法：`'vec4f[8]'`、`'mat4x4f[64]'`。 */
export type UniformArrayType = `${UniformElementType}[${number}]`;
export type UniformFieldType = UniformElementType | UniformArrayType;
export type UniformLayoutDesc = Record<string, UniformFieldType>;

interface TypeInfo {
  readonly align: number;
  readonly size: number;
  readonly glsl: string;
  readonly wgsl: string;
  readonly componentType: 'f32' | 'i32' | 'u32';
  /** 一个元素里的标量个数（`mat3x3f` 是 9）。 */
  readonly components: number;
  /** 矩阵的列信息；非矩阵为 `undefined`。 */
  readonly columnStride?: number;
  readonly columnSize?: number;
  readonly columns?: number;
}

const MAT3_COLUMN_STRIDE = 16;
const MAT3_COLUMN_SIZE = 12;

const TYPE_INFO: Readonly<Record<UniformElementType, TypeInfo>> = {
  f32: { align: 4, size: 4, glsl: 'float', wgsl: 'f32', componentType: 'f32', components: 1 },
  i32: { align: 4, size: 4, glsl: 'int', wgsl: 'i32', componentType: 'i32', components: 1 },
  u32: { align: 4, size: 4, glsl: 'uint', wgsl: 'u32', componentType: 'u32', components: 1 },
  vec2f: { align: 8, size: 8, glsl: 'vec2', wgsl: 'vec2f', componentType: 'f32', components: 2 },
  vec3f: { align: 16, size: 12, glsl: 'vec3', wgsl: 'vec3f', componentType: 'f32', components: 3 },
  vec4f: { align: 16, size: 16, glsl: 'vec4', wgsl: 'vec4f', componentType: 'f32', components: 4 },
  vec2i: { align: 8, size: 8, glsl: 'ivec2', wgsl: 'vec2i', componentType: 'i32', components: 2 },
  vec3i: { align: 16, size: 12, glsl: 'ivec3', wgsl: 'vec3i', componentType: 'i32', components: 3 },
  vec4i: { align: 16, size: 16, glsl: 'ivec4', wgsl: 'vec4i', componentType: 'i32', components: 4 },
  vec2u: { align: 8, size: 8, glsl: 'uvec2', wgsl: 'vec2u', componentType: 'u32', components: 2 },
  vec3u: { align: 16, size: 12, glsl: 'uvec3', wgsl: 'vec3u', componentType: 'u32', components: 3 },
  vec4u: { align: 16, size: 16, glsl: 'uvec4', wgsl: 'vec4u', componentType: 'u32', components: 4 },
  mat3x3f: {
    align: 16,
    size: MAT3_COLUMN_STRIDE * 3,
    glsl: 'mat3',
    wgsl: 'mat3x3f',
    componentType: 'f32',
    components: 9,
    columnStride: MAT3_COLUMN_STRIDE,
    columnSize: MAT3_COLUMN_SIZE,
    columns: 3,
  },
  mat4x4f: {
    align: 16,
    size: 64,
    glsl: 'mat4',
    wgsl: 'mat4x4f',
    componentType: 'f32',
    components: 16,
    columnStride: 16,
    columnSize: 16,
    columns: 4,
  },
};

/** 支持的 uniform 字段类型名，用于错误提示。 */
export const UNIFORM_FIELD_TYPES: readonly UniformElementType[] = Object.keys(TYPE_INFO) as UniformElementType[];

/* ------------------------------------------------------------------------------------------------ */
/* 布局                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export interface UniformFieldLayout {
  readonly name: string;
  readonly type: UniformFieldType;
  readonly info: TypeInfo;
  readonly byteOffset: number;
  /** 单个元素占用的字节数（矩阵含列内填充）。 */
  readonly byteSize: number;
  /** 数组相邻元素的字节步长；非数组等于 `byteSize`。 */
  readonly byteStride: number;
  /** 元素个数；非数组为 1。 */
  readonly count: number;
  /** 内存是否连续无空洞 —— 是的话可以直接给一个扁平的 TypedArray 视图。 */
  readonly packed: boolean;
}

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

function parseFieldType(type: string): { element: UniformElementType; count: number } {
  const match = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(type);
  if (match) {
    const element = match[1] as UniformElementType;
    const info = TYPE_INFO[element];
    if (!info) {
      throw new ValidationError(
        `[gpu-device-api] 不支持的 uniform 元素类型「${element}」（出现在「${type}」里）。支持：${UNIFORM_FIELD_TYPES.join('、')}。`,
      );
    }
    const count = Number(match[2]);
    if (count <= 0) {
      throw new ValidationError(`[gpu-device-api] uniform 数组「${type}」的元素个数必须为正数。`);
    }
    if (info.columns !== undefined && info.columnStride !== info.columnSize) {
      throw new ValidationError(
        `[gpu-device-api] 不支持 \`${type}\`：\`mat3x3f\` 的每列有 4 字节填充，无法表示成扁平数组。\n` +
          '请改用 `mat4x4f[' + count + ']`（多出的第 4 个分量当作 0 即可），或者拆成多个独立的 mat3 字段。',
      );
    }
    return { element, count };
  }

  if (type === 'mat2x2f' || type === 'mat2x3f' || type === 'mat2x4f' || type === 'mat3x2f' || type === 'mat3x4f' || type === 'mat4x2f' || type === 'mat4x3f') {
    throw new ValidationError(
      `[gpu-device-api] uniform 不支持 \`${type}\`：GLSL std140 与 WGSL uniform 对非 4 列的矩阵布局规则不一致` +
        '（std140 会把列步长补齐到 16 字节）。\n' +
        '请改用 `mat4x4f`（把缺的列填单位向量或零），或拆成若干 `vec4f`。',
    );
  }
  const info = TYPE_INFO[type as UniformElementType];
  if (!info) {
    throw new ValidationError(
      `[gpu-device-api] 不支持的 uniform 类型「${type}」。支持：${UNIFORM_FIELD_TYPES.join('、')}，以及 \`类型[N]\` 形式的数组。`,
    );
  }
  return { element: type as UniformElementType, count: 1 };
}

const RESERVED_WGSL = new Set([
  'alias', 'break', 'case', 'const', 'continue', 'default', 'discard', 'else', 'enable', 'false', 'fn',
  'for', 'if', 'let', 'loop', 'override', 'return', 'struct', 'switch', 'true', 'var', 'while', 'array',
  'atomic', 'bool', 'f16', 'f32', 'i32', 'u32', 'mat2x2', 'mat3x3', 'mat4x4', 'ptr', 'sampler',
  'sampler_comparison', 'texture_1d', 'texture_2d', 'texture_2d_array', 'texture_3d', 'texture_cube',
  'vec2', 'vec3', 'vec4',
]);

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * 一份 uniform 块的布局。同时供 GLSL 与 WGSL 使用，
 * 并对外暴露生成声明所需的一切信息。
 */
export class UniformLayout {
  readonly desc: UniformLayoutDesc;
  readonly fields: readonly UniformFieldLayout[];
  /**
   * 字段名 → 字段。构造时建一次，供 {@link has} / {@link field} 做 O(1) 查找。
   *
   * 为什么不用 `fields.some(...)`：`Renderer.draw()` 每 draw 要问 7 次「这个材质有没有
   * projectionView / model / normalMatrix…」，线性扫描 + 每次一个闭包会在 40k draw 的
   * 场景里变成几毫秒/帧的纯开销。
   */
  private readonly fieldByName: Map<string, UniformFieldLayout>;
  /** 块总字节数（16 的倍数）。 */
  readonly byteLength: number;
  /** 内容指纹，用于缓存与校验「管线与数值是否匹配」。 */
  readonly key: string;
  /** WGSL 结构体名；GLSL 的块名是 `${structName}Block` 之外，这里同时用作 GLSL 块名。 */
  readonly structName: string;
  /** 着色器里的实例名；两种语言都是 `u`，所以成员访问写法一致。 */
  readonly instanceName = 'u';
  readonly group: number;
  readonly binding: number;

  constructor(desc: UniformLayoutDesc, options: UniformOptions = {}) {
    this.desc = { ...desc };
    this.structName = options.structName ?? 'Uniforms';
    this.group = options.group ?? 0;
    this.binding = options.binding ?? 0;

    const names = Object.keys(desc);
    if (names.length === 0) {
      throw new ValidationError('[gpu-device-api] uniform 布局至少要有一个字段。');
    }

    const fields: UniformFieldLayout[] = [];
    let cursor = 0;
    let maxAlign = 16;

    for (const name of names) {
      if (!IDENTIFIER.test(name)) {
        throw new ValidationError(`[gpu-device-api] uniform 字段名「${name}」不是合法标识符。`);
      }
      if (RESERVED_WGSL.has(name)) {
        throw new ValidationError(`[gpu-device-api] uniform 字段名「${name}」是 WGSL 保留字，请换一个。`);
      }
      const type = desc[name]!;
      const { element, count } = parseFieldType(type);
      const info = TYPE_INFO[element];
      const byteOffset = alignTo(cursor, info.align);
      const byteSize = info.size;
      // 数组元素步长要取整到 16 的倍数 —— 这是 std140 与 WGSL uniform 的共同要求。
      const byteStride = count > 1 ? alignTo(info.size, 16) : info.size;
      const columnsPacked = info.columnStride === undefined || info.columnStride === info.columnSize;
      const packed = count > 1 ? byteStride === info.size && columnsPacked : columnsPacked;
      const total = count > 1 ? byteStride * (count - 1) + info.size : info.size;

      fields.push({ name, type, info, byteOffset, byteSize, byteStride, count, packed });
      cursor = byteOffset + total;
      maxAlign = Math.max(maxAlign, info.align, count > 1 ? 16 : 0);
    }

    this.fields = fields;
    this.fieldByName = new Map(fields.map((field) => [field.name, field]));
    this.byteLength = alignTo(cursor, maxAlign);
    this.key = `${this.structName}|${this.group}|${this.binding}|${names.map((name) => `${name}:${desc[name]}`).join(',')}`;
  }

  field(name: string): UniformFieldLayout {
    const field = this.fieldByName.get(name);
    if (!field) {
      throw new ValidationError(
        `[gpu-device-api] uniform 布局里没有字段「${name}」。现有字段：${this.fields.map((item) => item.name).join('、')}。`,
      );
    }
    return field;
  }

  has(name: string): boolean {
    return this.fieldByName.has(name);
  }

  /**
   * GLSL 里的元素类型（**不含数组后缀**）。
   * 注意 GLSL 的数组写法是 `mat4 bones[64];`（方括号跟在名字后面），
   * 与 WGSL 的 `array<mat4x4f, 64>` 不同，所以数组由 {@link glslDeclaration} 拼接。
   */
  glslMemberType(field: UniformFieldLayout): string {
    return field.info.glsl;
  }

  /** WGSL 里的成员类型（数组写成 `array<T, N>`）。 */
  wgslMemberType(field: UniformFieldLayout): string {
    return field.count > 1 ? `array<${field.info.wgsl}, ${field.count}>` : field.info.wgsl;
  }

  /**
   * GLSL 的 `std140` 块声明。块名用 {@link structName}，实例名 `u`。
   * 之所以块名不叫 `UniformsBlock`：WebGL2 后端要靠**块名**去 `gl.getUniformBlockIndex` 定位，
   * 而 WGSL 的结构体名也是这个 —— 两边同名可以让 `BindGroupLayoutEntry.name` 只写一次。
   */
  glslDeclaration(): string {
    const members = this.fields
      .map((field) => {
        const name = field.count > 1 ? `${field.name}[${field.count}]` : field.name;
        return `  ${this.glslMemberType(field)} ${name};`;
      })
      .join('\n');
    return `layout(std140) uniform ${this.structName} {\n${members}\n} ${this.instanceName};`;
  }

  /** WGSL 的 struct + binding 声明。 */
  wgslDeclaration(): string {
    const members = this.fields.map((field) => `  ${field.name}: ${this.wgslMemberType(field)},`).join('\n');
    return (
      `struct ${this.structName} {\n${members}\n}\n` +
      `@group(${this.group}) @binding(${this.binding}) var<uniform> ${this.instanceName}: ${this.structName};`
    );
  }

  /** 调试用：逐字段打印偏移。 */
  describe(): string {
    const rows = this.fields.map(
      (field) =>
        `  +${String(field.byteOffset).padStart(4)}  ${field.name.padEnd(18)} ${field.type.padEnd(14)} size=${field.byteSize} stride=${field.byteStride} count=${field.count}`,
    );
    return [`${this.structName}（共 ${this.byteLength} 字节）`, ...rows].join('\n');
  }
}

export interface UniformOptions {
  /** WGSL 结构体名 / GLSL 块名，默认 `'Uniforms'`。 */
  structName?: string;
  group?: number;
  binding?: number;
}

const layoutCache = new Map<string, UniformLayout>();

/**
 * 定义一份 uniform 布局。相同描述会复用同一个 {@link UniformLayout} 实例，
 * 因此「管线与写入器是否匹配」可以直接比较对象或 `key`。
 */
export function defineUniforms(desc: UniformLayoutDesc, options?: UniformOptions): UniformLayout {
  const probe = new UniformLayout(desc, options);
  const cached = layoutCache.get(probe.key);
  if (cached) return cached;
  layoutCache.set(probe.key, probe);
  return probe;
}

/* ------------------------------------------------------------------------------------------------ */
/* 类型化写入器                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

type AnyTypedArray = Float32Array | Int32Array | Uint32Array;

/**
 * 字段内存**不连续**时（`mat3x3f`、`vec3f[N]`、`f32[N]`…）返回的访问器。
 * 用 `at(i)` 取元素视图，`set()/get()` 收发**紧凑打包**的数据。
 */
export interface UniformFieldAccessor<T extends AnyTypedArray = AnyTypedArray> {
  readonly type: UniformFieldType;
  /** 元素个数（数组长度，或矩阵的列数）。 */
  readonly count: number;
  /** 相邻元素的字节步长。 */
  readonly byteStride: number;
  at(index: number): T;
  set(value: ArrayLike<number>): void;
  get(out?: T): T;
}

/** 按字段类型推断写入器的具体类型，让 `u.model.set(...)` 有准确提示。 */
export type UniformFieldValue<T extends UniformFieldType> = T extends 'mat3x3f'
  ? UniformFieldAccessor<Float32Array>
  : T extends `${infer B}[${number}]`
    ? B extends 'vec4f' | 'mat4x4f'
      ? Float32Array
      : B extends 'vec4i'
        ? Int32Array
        : B extends 'vec4u'
          ? Uint32Array
          : B extends 'mat3x3f' | 'vec3f' | 'vec2f' | 'f32'
            ? UniformFieldAccessor<Float32Array>
            : B extends 'vec3i' | 'vec2i' | 'i32'
              ? UniformFieldAccessor<Int32Array>
              : B extends 'vec3u' | 'vec2u' | 'u32'
                ? UniformFieldAccessor<Uint32Array>
                : never
    : T extends 'f32' | 'vec2f' | 'vec3f' | 'vec4f' | 'mat4x4f'
      ? Float32Array
      : T extends 'i32' | 'vec2i' | 'vec3i' | 'vec4i'
        ? Int32Array
        : T extends 'u32' | 'vec2u' | 'vec3u' | 'vec4u'
          ? Uint32Array
          : never;

export type UniformFieldValues<D extends UniformLayoutDesc> = {
  readonly [K in keyof D]: UniformFieldValue<D[K]>;
};

/** 标量字段收 `number`，其余收紧凑的数字数组。 */
export type UniformInput<T extends UniformFieldType> = T extends UniformScalarType ? number : ArrayLike<number>;
export type UniformInputValues<D extends UniformLayoutDesc> = { readonly [K in keyof D]?: UniformInput<D[K]> };

function typedArrayFor(
  componentType: 'f32' | 'i32' | 'u32',
  buffer: ArrayBuffer,
  byteOffset: number,
  length: number,
): AnyTypedArray {
  if (componentType === 'i32') return new Int32Array(buffer, byteOffset, length);
  if (componentType === 'u32') return new Uint32Array(buffer, byteOffset, length);
  return new Float32Array(buffer, byteOffset, length);
}

function makeAccessor(
  field: UniformFieldLayout,
  buffer: ArrayBuffer,
  stride: number,
  elementLength: number,
  count: number,
): UniformFieldAccessor<AnyTypedArray> {
  const views: AnyTypedArray[] = [];
  return {
    type: field.type,
    count,
    byteStride: stride,
    at(index: number): AnyTypedArray {
      if (index < 0 || index >= count) {
        throw new RangeError(
          `[gpu-device-api] uniform 字段「${field.name}」的下标 ${index} 越界（有效范围 0..${count - 1}）。`,
        );
      }
      let view = views[index];
      if (!view) {
        view = typedArrayFor(field.info.componentType, buffer, field.byteOffset + index * stride, elementLength);
        views[index] = view;
      }
      return view;
    },
    set(value: ArrayLike<number>): void {
      let cursor = 0;
      for (let index = 0; index < count; index++) {
        const target = this.at(index);
        for (let component = 0; component < elementLength && cursor < value.length; component++, cursor++) {
          target[component] = value[cursor]!;
        }
      }
    },
    get(out?: AnyTypedArray): AnyTypedArray {
      const total = count * elementLength;
      const result = out ?? typedArrayFor(field.info.componentType, new ArrayBuffer(total * 4), 0, total);
      let cursor = 0;
      for (let index = 0; index < count; index++) {
        const source = this.at(index);
        for (let component = 0; component < elementLength; component++, cursor++) {
          result[cursor] = source[component]!;
        }
      }
      return result;
    },
  };
}

/**
 * 一个 uniform 块的 CPU 侧数值容器。
 *
 * 用 {@link createUniforms} 创建，它会用 Proxy 把字段挂成直接可访问的属性：
 * ```ts
 * const u = createUniforms({ model: 'mat4x4f', color: 'vec4f', time: 'f32' });
 * u.model.set(modelMatrix);     // Float32Array(16)
 * u.color.set([1, 0, 0, 1]);
 * u.time[0] = performance.now() / 1000;
 * u.set('color', [0, 1, 0, 1]); // 也可以用 set()
 * ```
 */
export class UniformValues<D extends UniformLayoutDesc = UniformLayoutDesc> {
  readonly layout: UniformLayout;
  readonly buffer: ArrayBuffer;
  private readonly fieldValues: Record<string, UniformFieldValue<UniformFieldType>>;
  /** {@link bytes} 的缓存视图；`buffer` 终生不重新分配，所以视图可以一直复用。 */
  private readonly bytesView: Uint8Array;
  /** 每次修改自增；渲染器据此跳过没必要的上传。 */
  version = 1;

  constructor(layout: UniformLayout);
  constructor(desc: D, options?: UniformOptions);
  constructor(desc: D | UniformLayout, options?: UniformOptions) {
    this.layout = desc instanceof UniformLayout ? desc : defineUniforms(desc, options);
    this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16));
    // 视图只建一次：`bytes` 在每次 draw 都会被读（arena 上传），每次 new 一个视图
    // 在 40k draw 的场景里就是 40k 个短命对象。
    this.bytesView = new Uint8Array(this.buffer, 0, this.layout.byteLength);
    const values: Record<string, UniformFieldValue<UniformFieldType>> = {};
    for (const field of this.layout.fields) values[field.name] = this.createFieldValue(field);
    this.fieldValues = values;
  }

  private createFieldValue(field: UniformFieldLayout): UniformFieldValue<UniformFieldType> {
    if (field.packed) {
      return typedArrayFor(
        field.info.componentType,
        this.buffer,
        field.byteOffset,
        field.count * field.info.components,
      ) as never;
    }
    if (field.info.columnStride !== undefined) {
      const columnLength = (field.info.columnSize ?? field.byteSize) / 4;
      return makeAccessor(
        field,
        this.buffer,
        field.info.columnStride,
        columnLength,
        field.info.columns ?? 1,
      ) as never;
    }
    return makeAccessor(field, this.buffer, field.byteStride, field.info.components, field.count) as never;
  }

  /** 所有字段写入器。 */
  get fields(): UniformFieldValues<D> {
    return this.fieldValues as unknown as UniformFieldValues<D>;
  }

  has(name: string): boolean {
    return this.layout.has(name);
  }

  /** 取单个字段的写入器。 */
  field<K extends keyof D & string>(name: K): UniformFieldValue<D[K]> {
    if (!(name in this.fieldValues)) this.layout.field(name);
    return this.fieldValues[name] as UniformFieldValue<D[K]>;
  }

  /** 写一个字段。标量收 `number`，其余收紧凑数组。 */
  set<K extends keyof D & string>(name: K, value: UniformInput<D[K]>): this {
    const target = this.fieldValues[name];
    if (target === undefined) {
      this.layout.field(name);
      return this;
    }
    if (typeof value === 'number') {
      if (!ArrayBuffer.isView(target)) {
        throw new TypeError(
          `[gpu-device-api] uniform 字段「${name}」不是标量，请传数字数组而不是单个数字。`,
        );
      }
      (target as AnyTypedArray)[0] = value;
    } else if (ArrayBuffer.isView(target)) {
      (target as AnyTypedArray).set(value as ArrayLike<number>);
    } else {
      (target as UniformFieldAccessor).set(value as ArrayLike<number>);
    }
    this.version += 1;
    return this;
  }

  /** 批量写：`u.assign({ time: 1, color: [1, 0, 0, 1] })`。 */
  assign(values: UniformInputValues<D>): this {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) continue;
      this.set(name as keyof D & string, value as never);
    }
    return this;
  }

  /** 读回字段的紧凑数据。 */
  get<K extends keyof D & string>(name: K, out?: AnyTypedArray): AnyTypedArray {
    const target = this.field(name) as UniformFieldValue<UniformFieldType>;
    if (ArrayBuffer.isView(target)) return target as AnyTypedArray;
    return (target as UniformFieldAccessor).get(out);
  }

  /** 有效字节数的视图（上传时用，避免把尾部对齐填充也传上去）。视图是复用的，不要保留它的引用。 */
  get bytes(): Uint8Array {
    return this.bytesView;
  }

  /** 复制一份紧凑的字节数据。 */
  toArrayBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.layout.byteLength);
  }
}

/** {@link createUniforms} 的返回类型：既有方法，也能直接按字段名取值。 */
export type Uniforms<D extends UniformLayoutDesc> = UniformValues<D> & UniformFieldValues<D>;

const proxyCache = new WeakMap<UniformValues, UniformValues>();

function wrapWithFieldAccess<D extends UniformLayoutDesc>(values: UniformValues<D>): Uniforms<D> {
  const cached = proxyCache.get(values);
  if (cached) return cached as Uniforms<D>;
  const proxy = new Proxy(values, {
    get(target, property, receiver) {
      if (typeof property === 'string' && target.has(property)) {
        return target.field(property as keyof D & string);
      }
      return Reflect.get(target, property, receiver);
    },
    has(target, property) {
      if (typeof property === 'string' && target.has(property)) return true;
      return Reflect.has(target, property);
    },
    set(target, property, value, receiver) {
      if (typeof property === 'string' && target.has(property)) {
        target.set(property as keyof D & string, value as never);
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    },
  });
  proxyCache.set(values, proxy);
  return proxy as Uniforms<D>;
}

/**
 * 创建 uniform 数值容器，字段可直接当属性访问。
 *
 * 传 {@link UniformLayout} 时会复用它（同一个布局可以创建多个数值容器，
 * 用于「每个物体一套 uniform」的写法）。
 */
export function createUniforms<D extends UniformLayoutDesc>(
  desc: D | UniformLayout,
  options?: UniformOptions,
): Uniforms<D> {
  const values = desc instanceof UniformLayout ? new UniformValues<D>(desc) : new UniformValues<D>(desc, options);
  return wrapWithFieldAccess(values);
}
