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
const MAT3_COLUMN_STRIDE = 16;
const MAT3_COLUMN_SIZE = 12;
const TYPE_INFO = {
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
export const UNIFORM_FIELD_TYPES = Object.keys(TYPE_INFO);
function alignTo(value, alignment) {
    return Math.ceil(value / alignment) * alignment;
}
function parseFieldType(type) {
    const match = /^([A-Za-z0-9]+)\[(\d+)\]$/.exec(type);
    if (match) {
        const element = match[1];
        const info = TYPE_INFO[element];
        if (!info) {
            throw new ValidationError(`[gpu-device-api] 不支持的 uniform 元素类型「${element}」（出现在「${type}」里）。支持：${UNIFORM_FIELD_TYPES.join('、')}。`);
        }
        const count = Number(match[2]);
        if (count <= 0) {
            throw new ValidationError(`[gpu-device-api] uniform 数组「${type}」的元素个数必须为正数。`);
        }
        if (info.columns !== undefined && info.columnStride !== info.columnSize) {
            throw new ValidationError(`[gpu-device-api] 不支持 \`${type}\`：\`mat3x3f\` 的每列有 4 字节填充，无法表示成扁平数组。\n` +
                '请改用 `mat4x4f[' + count + ']`（多出的第 4 个分量当作 0 即可），或者拆成多个独立的 mat3 字段。');
        }
        return { element, count };
    }
    if (type === 'mat2x2f' || type === 'mat2x3f' || type === 'mat2x4f' || type === 'mat3x2f' || type === 'mat3x4f' || type === 'mat4x2f' || type === 'mat4x3f') {
        throw new ValidationError(`[gpu-device-api] uniform 不支持 \`${type}\`：GLSL std140 与 WGSL uniform 对非 4 列的矩阵布局规则不一致` +
            '（std140 会把列步长补齐到 16 字节）。\n' +
            '请改用 `mat4x4f`（把缺的列填单位向量或零），或拆成若干 `vec4f`。');
    }
    const info = TYPE_INFO[type];
    if (!info) {
        throw new ValidationError(`[gpu-device-api] 不支持的 uniform 类型「${type}」。支持：${UNIFORM_FIELD_TYPES.join('、')}，以及 \`类型[N]\` 形式的数组。`);
    }
    return { element: type, count: 1 };
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
    instanceName = 'u';
    group;
    binding;
    constructor(desc, options = {}) {
        this.desc = { ...desc };
        this.structName = options.structName ?? 'Uniforms';
        this.group = options.group ?? 0;
        this.binding = options.binding ?? 0;
        const names = Object.keys(desc);
        if (names.length === 0) {
            throw new ValidationError('[gpu-device-api] uniform 布局至少要有一个字段。');
        }
        const fields = [];
        let cursor = 0;
        let maxAlign = 16;
        for (const name of names) {
            if (!IDENTIFIER.test(name)) {
                throw new ValidationError(`[gpu-device-api] uniform 字段名「${name}」不是合法标识符。`);
            }
            if (RESERVED_WGSL.has(name)) {
                throw new ValidationError(`[gpu-device-api] uniform 字段名「${name}」是 WGSL 保留字，请换一个。`);
            }
            const type = desc[name];
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
    field(name) {
        const field = this.fieldByName.get(name);
        if (!field) {
            throw new ValidationError(`[gpu-device-api] uniform 布局里没有字段「${name}」。现有字段：${this.fields.map((item) => item.name).join('、')}。`);
        }
        return field;
    }
    has(name) {
        return this.fieldByName.has(name);
    }
    /**
     * GLSL 里的元素类型（**不含数组后缀**）。
     * 注意 GLSL 的数组写法是 `mat4 bones[64];`（方括号跟在名字后面），
     * 与 WGSL 的 `array<mat4x4f, 64>` 不同，所以数组由 {@link glslDeclaration} 拼接。
     */
    glslMemberType(field) {
        return field.info.glsl;
    }
    /** WGSL 里的成员类型（数组写成 `array<T, N>`）。 */
    wgslMemberType(field) {
        return field.count > 1 ? `array<${field.info.wgsl}, ${field.count}>` : field.info.wgsl;
    }
    /**
     * GLSL 的 `std140` 块声明。块名用 {@link structName}，实例名 `u`。
     * 之所以块名不叫 `UniformsBlock`：WebGL2 后端要靠**块名**去 `gl.getUniformBlockIndex` 定位，
     * 而 WGSL 的结构体名也是这个 —— 两边同名可以让 `BindGroupLayoutEntry.name` 只写一次。
     */
    glslDeclaration() {
        const members = this.fields
            .map((field) => {
            const name = field.count > 1 ? `${field.name}[${field.count}]` : field.name;
            return `  ${this.glslMemberType(field)} ${name};`;
        })
            .join('\n');
        return `layout(std140) uniform ${this.structName} {\n${members}\n} ${this.instanceName};`;
    }
    /** WGSL 的 struct + binding 声明。 */
    wgslDeclaration() {
        const members = this.fields.map((field) => `  ${field.name}: ${this.wgslMemberType(field)},`).join('\n');
        return (`struct ${this.structName} {\n${members}\n}\n` +
            `@group(${this.group}) @binding(${this.binding}) var<uniform> ${this.instanceName}: ${this.structName};`);
    }
    /** 调试用：逐字段打印偏移。 */
    describe() {
        const rows = this.fields.map((field) => `  +${String(field.byteOffset).padStart(4)}  ${field.name.padEnd(18)} ${field.type.padEnd(14)} size=${field.byteSize} stride=${field.byteStride} count=${field.count}`);
        return [`${this.structName}（共 ${this.byteLength} 字节）`, ...rows].join('\n');
    }
}
const layoutCache = new Map();
/**
 * 定义一份 uniform 布局。相同描述会复用同一个 {@link UniformLayout} 实例，
 * 因此「管线与写入器是否匹配」可以直接比较对象或 `key`。
 */
export function defineUniforms(desc, options) {
    const probe = new UniformLayout(desc, options);
    const cached = layoutCache.get(probe.key);
    if (cached)
        return cached;
    layoutCache.set(probe.key, probe);
    return probe;
}
function typedArrayFor(componentType, buffer, byteOffset, length) {
    if (componentType === 'i32')
        return new Int32Array(buffer, byteOffset, length);
    if (componentType === 'u32')
        return new Uint32Array(buffer, byteOffset, length);
    return new Float32Array(buffer, byteOffset, length);
}
function makeAccessor(field, buffer, stride, elementLength, count) {
    const views = [];
    return {
        type: field.type,
        count,
        byteStride: stride,
        at(index) {
            if (index < 0 || index >= count) {
                throw new RangeError(`[gpu-device-api] uniform 字段「${field.name}」的下标 ${index} 越界（有效范围 0..${count - 1}）。`);
            }
            let view = views[index];
            if (!view) {
                view = typedArrayFor(field.info.componentType, buffer, field.byteOffset + index * stride, elementLength);
                views[index] = view;
            }
            return view;
        },
        set(value) {
            let cursor = 0;
            for (let index = 0; index < count; index++) {
                const target = this.at(index);
                for (let component = 0; component < elementLength && cursor < value.length; component++, cursor++) {
                    target[component] = value[cursor];
                }
            }
        },
        get(out) {
            const total = count * elementLength;
            const result = out ?? typedArrayFor(field.info.componentType, new ArrayBuffer(total * 4), 0, total);
            let cursor = 0;
            for (let index = 0; index < count; index++) {
                const source = this.at(index);
                for (let component = 0; component < elementLength; component++, cursor++) {
                    result[cursor] = source[component];
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
export class UniformValues {
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
    writers = new Map();
    f32View = null;
    i32View = null;
    u32View = null;
    /** 每次修改自增；渲染器据此跳过没必要的上传。 */
    version = 1;
    constructor(desc, options) {
        this.layout = desc instanceof UniformLayout ? desc : defineUniforms(desc, options);
        this.buffer = new ArrayBuffer(Math.max(this.layout.byteLength, 16));
        // 视图只建一次：`bytes` 在每次 draw 都会被读（arena 上传），每次 new 一个视图
        // 在 40k draw 的场景里就是 40k 个短命对象。
        this.bytesView = new Uint8Array(this.buffer, 0, this.layout.byteLength);
        const values = {};
        for (const field of this.layout.fields) {
            values[field.name] = this.createFieldValue(field);
            this.writers.set(field.name, this.createFieldWriter(field, values[field.name]));
        }
        this.fieldValues = values;
    }
    /** 为字段建一个形状统一的写入器（见 {@link writers} 的说明）。 */
    createFieldWriter(field, value) {
        const length = field.count * field.info.components;
        if (field.packed) {
            const kind = field.info.componentType === 'i32' ? 1 : field.info.componentType === 'u32' ? 2 : 0;
            return { kind, offset: field.byteOffset / 4, length, accessor: null };
        }
        void value;
        return {
            kind: 3,
            offset: 0,
            length,
            accessor: value,
        };
    }
    createFieldValue(field) {
        if (field.packed) {
            return typedArrayFor(field.info.componentType, this.buffer, field.byteOffset, field.count * field.info.components);
        }
        if (field.info.columnStride !== undefined) {
            const columnLength = (field.info.columnSize ?? field.byteSize) / 4;
            return makeAccessor(field, this.buffer, field.info.columnStride, columnLength, field.info.columns ?? 1);
        }
        return makeAccessor(field, this.buffer, field.byteStride, field.info.components, field.count);
    }
    /** 所有字段写入器。 */
    get fields() {
        return this.fieldValues;
    }
    has(name) {
        return this.layout.has(name);
    }
    /** 取单个字段的写入器。 */
    field(name) {
        if (!(name in this.fieldValues))
            this.layout.field(name);
        return this.fieldValues[name];
    }
    /**
     * 写一个字段。标量收 `number`，其余收紧凑数组。
     *
     * 走 {@link writers} 里的单态快路径（见那里的实测数字），并且保留「数组写超长就报错」的行为：
     * 连续块现在是整块视图，写超长会溢到下一个字段，所以这里显式挡一下。
     */
    set(name, value) {
        const writer = this.writers.get(name);
        if (writer === undefined) {
            this.layout.field(name); // 不存在的字段：抛出带「现有字段」列表的错误
            return this;
        }
        if (typeof value === 'number') {
            if (writer.kind === 3) {
                throw new TypeError(`[gpu-device-api] uniform 字段「${name}」不是标量，请传数字数组而不是单个数字。`);
            }
            if (writer.kind === 0) {
                (this.f32View ??= new Float32Array(this.buffer))[writer.offset] = value;
            }
            else if (writer.kind === 1) {
                (this.i32View ??= new Int32Array(this.buffer))[writer.offset] = value;
            }
            else {
                (this.u32View ??= new Uint32Array(this.buffer))[writer.offset] = value;
            }
        }
        else {
            const array = value;
            if (array.length > writer.length) {
                throw new RangeError(`[gpu-device-api] uniform 字段「${name}」只接受 ${writer.length} 个元素，` +
                    `收到 ${array.length} 个。写超长会覆盖后面的字段，所以这里直接拦下。`);
            }
            if (writer.kind === 0) {
                (this.f32View ??= new Float32Array(this.buffer)).set(array, writer.offset);
            }
            else if (writer.kind === 1) {
                (this.i32View ??= new Int32Array(this.buffer)).set(array, writer.offset);
            }
            else if (writer.kind === 2) {
                (this.u32View ??= new Uint32Array(this.buffer)).set(array, writer.offset);
            }
            else {
                writer.accessor.set(array);
            }
        }
        this.version += 1;
        return this;
    }
    /** 批量写：`u.assign({ time: 1, color: [1, 0, 0, 1] })`。 */
    assign(values) {
        for (const [name, value] of Object.entries(values)) {
            if (value === undefined)
                continue;
            this.set(name, value);
        }
        return this;
    }
    /** 读回字段的紧凑数据。 */
    get(name, out) {
        const target = this.field(name);
        if (ArrayBuffer.isView(target))
            return target;
        return target.get(out);
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
const proxyCache = new WeakMap();
/** 反向表：Proxy → 原始对象，供 {@link unwrapUniforms} 使用。 */
const rawCache = new WeakMap();
/**
 * 把 {@link createUniforms} 返回的 Proxy 还原成原始对象（不是 Proxy 时原样返回）。
 *
 * 渲染器的每 draw 写入路径用它：直接操作 raw 对象可以完全避开 Proxy 陷阱
 * （`has`/`field`/`set` 每次调用仍会多花 0.2–0.4 µs，40k draw 就是每帧十几毫秒）。
 * 字段式访问（`u.model.set(...)`）是给使用者写的代码用的，不在热路径上。
 */
export function unwrapUniforms(values) {
    return rawCache.get(values) ?? values;
}
function wrapWithFieldAccess(values) {
    const cached = proxyCache.get(values);
    if (cached)
        return cached;
    /*
     * 方法一律**预先绑定到 raw 对象**再交出去。
     *
     * 为什么必须这样：`proxy.set(...)` 的 `this` 是 Proxy，于是方法体里每一次 `this.xxx`
     * （writers / version / buffer / bytesView…）都要再走一遍 get 陷阱。实测每次 `set()` 因此
     * 多花约 1 µs —— 40k draw 的场景下就是每帧几十毫秒的纯开销。绑定之后方法体直接操作 raw
     * 对象，陷阱只在「按字段名取值」时触发（那正是这个 Proxy 存在的意义）。
     */
    const boundMethods = new Map();
    const proxy = new Proxy(values, {
        get(target, property, receiver) {
            if (typeof property === 'string' && target.has(property)) {
                return target.field(property);
            }
            // receiver 传 target：访问器（例如 `bytes`）也在 raw 对象上求值，不再穿一层陷阱。
            const value = Reflect.get(target, property, target);
            if (typeof value === 'function') {
                let bound = boundMethods.get(property);
                if (bound === undefined) {
                    bound = value.bind(target);
                    boundMethods.set(property, bound);
                }
                return bound;
            }
            void receiver;
            return value;
        },
        has(target, property) {
            if (typeof property === 'string' && target.has(property))
                return true;
            return Reflect.has(target, property);
        },
        set(target, property, value, receiver) {
            if (typeof property === 'string' && target.has(property)) {
                target.set(property, value);
                return true;
            }
            return Reflect.set(target, property, value, receiver);
        },
    });
    proxyCache.set(values, proxy);
    rawCache.set(proxy, values);
    return proxy;
}
/**
 * 创建 uniform 数值容器，字段可直接当属性访问。
 *
 * 传 {@link UniformLayout} 时会复用它（同一个布局可以创建多个数值容器，
 * 用于「每个物体一套 uniform」的写法）。
 */
export function createUniforms(desc, options) {
    const values = desc instanceof UniformLayout ? new UniformValues(desc) : new UniformValues(desc, options);
    return wrapWithFieldAccess(values);
}
//# sourceMappingURL=Uniforms.js.map