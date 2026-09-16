/**
 * 材质：把「声明式描述」编译成 core 能直接用的着色器源码 + bind group layout + 管线描述。
 *
 * 写材质时只需要关心业务逻辑，声明全部自动生成：
 *
 * ```ts
 * const lambert = defineMaterial({
 *   name: 'lambert',
 *   attributes: { position: 'float32x3', normal: 'float32x3' },
 *   uniforms: { projectionView: 'mat4x4f', model: 'mat4x4f', baseColor: 'vec4f', lightDirection: 'vec3f' },
 *   glsl: {
 *     vs: `out vec3 vNormal;
 *          void main() {
 *            vNormal = mat3(u.model) * normal;                 // 属性名与 u.* 直接可用
 *            gl_Position = u.projectionView * u.model * vec4(position, 1.0);
 *          }`,
 *     fs: `in vec3 vNormal;
 *          void main() {
 *            float ndl = max(dot(normalize(vNormal), normalize(-u.lightDirection)), 0.0);
 *            fragColor = vec4(u.baseColor.rgb * (0.2 + 0.8 * ndl), u.baseColor.a);   // fragColor 自动声明
 *          }`,
 *   },
 *   wgsl: `struct Out { @builtin(position) position: vec4f, @location(0) normal: vec3f }
 *          @vertex fn vsMain(v: VertexInput) -> Out { ... }      // VertexInput 自动生成
 *          @fragment fn fsMain(in: Out) -> @location(0) vec4f { ... }`,
 * });
 * ```
 *
 * 注意 `wgsl` 是**一个模块字符串**（同时含顶点与片元入口），而 `glsl` 分成 `vs` / `fs`
 * —— 因为 WebGPU 的 `createShaderModule` 本来就只接受一份代码，WebGL2 则需要分别编译再链接。
 *
 * 注入的位置可以用占位符控制：`/*%uniforms%*​/`、`/*%attributes%*​/`、`/*%textures%*​/`；
 * 没写占位符时会自动前置（声明必须先于使用，前置总是安全的）。
 */
import { ValidationError } from '../core/errors/ValidationError.js';
import { BindingType } from '../core/enums/BindingType.js';
import { vertexFormatGlslType, vertexFormatInfo, vertexFormatWgslType, } from '../core/enums/VertexFormat.js';
import { UniformLayout as UniformLayoutClass, createUniforms, defineUniforms, } from './Uniforms.js';
/** 着色器里的占位符；写上就按写的位置注入，不写则整体前置。 */
export const UNIFORM_PLACEHOLDER = '/*%uniforms%*/';
export const ATTRIBUTE_PLACEHOLDER = '/*%attributes%*/';
export const TEXTURE_PLACEHOLDER = '/*%textures%*/';
/** 混合预设表（与 core 的 `BLEND_PRESETS` 一致的取值，这里重新声明以便加类型名）。 */
const BLEND_PRESETS = {
    alpha: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
    premultiplied: {
        color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
    additive: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    },
    multiply: {
        color: { srcFactor: 'dst', dstFactor: 'zero', operation: 'add' },
        alpha: { srcFactor: 'dst-alpha', dstFactor: 'zero', operation: 'add' },
    },
    screen: {
        color: { srcFactor: 'one', dstFactor: 'one-minus-src', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
};
/** 名字 → GLSL sampler 类型。 */
function glslSamplerType(sampleType, dimension, comparison) {
    const base = dimension === 'cube'
        ? 'samplerCube'
        : dimension === '3d'
            ? 'sampler3D'
            : dimension === '2d-array'
                ? 'sampler2DArray'
                : 'sampler2D';
    if (comparison) {
        // 比较采样器只在 2D / Cube / 2D-array 上有影子版本。
        if (base === 'sampler2D')
            return 'sampler2DShadow';
        if (base === 'samplerCube')
            return 'samplerCubeShadow';
        if (base === 'sampler2DArray')
            return 'sampler2DArrayShadow';
        return base;
    }
    if (sampleType === 'sint')
        return `i${base}`;
    if (sampleType === 'uint')
        return `u${base}`;
    return base;
}
/** 名字 → WGSL texture 类型。 */
function wgslTextureType(sampleType, dimension) {
    if (sampleType === 'depth') {
        return dimension === 'cube'
            ? 'texture_depth_cube'
            : dimension === '2d-array'
                ? 'texture_depth_2d_array'
                : 'texture_depth_2d';
    }
    const scalar = sampleType === 'sint' ? 'i32' : sampleType === 'uint' ? 'u32' : 'f32';
    const base = dimension === 'cube'
        ? 'texture_cube'
        : dimension === '3d'
            ? 'texture_3d'
            : dimension === '2d-array'
                ? 'texture_2d_array'
                : 'texture_2d';
    return `${base}<${scalar}>`;
}
/** 把声明块注入源码：有占位符就替进去，否则前置。 */
function inject(source, blocks) {
    let body = source;
    const pending = [];
    for (const block of blocks) {
        if (!block.text)
            continue;
        if (body.includes(block.placeholder)) {
            body = body.split(block.placeholder).join(block.text);
        }
        else {
            pending.push(block.text);
        }
    }
    const head = pending.length > 0 ? `${pending.join('\n\n')}\n\n` : '';
    return `${head}${body.trim()}\n`;
}
/**
 * 一份材质。`createPipelineDescriptor()` 产出的描述可以直接交给
 * `device.createRenderPipeline()`，两种后端都吃同一份描述。
 */
export class Material {
    name;
    desc;
    /** 属性名 → 格式 / 步进模式，顺序即 shaderLocation。 */
    attributes;
    uniforms;
    textures;
    /** 注入声明后的 GLSL 源码。 */
    glsl; /** 注入声明后的 WGSL 模块。 */
    wgsl;
    constructor(desc) {
        this.desc = desc;
        this.name = desc.name ?? 'material';
        /* ---- 属性 ------------------------------------------------------------------------------ */
        const attributeEntries = Object.entries(desc.attributes ?? {});
        if (attributeEntries.length > 16) {
            throw new ValidationError(`[gpu-device-api] 材质「${this.name}」声明了 ${attributeEntries.length} 个顶点属性，超过 WebGL2/WebGPU 的 16 个上限。`);
        }
        this.attributes = attributeEntries.map(([name, input], index) => {
            const resolved = typeof input === 'string' ? { format: input, stepMode: 'vertex' } : input;
            return { name, format: resolved.format, location: index, stepMode: resolved.stepMode ?? 'vertex' };
        });
        /* ---- uniform --------------------------------------------------------------------------- */
        if (desc.uniforms instanceof UniformLayoutClass) {
            this.uniforms = desc.uniforms;
        }
        else if (desc.uniforms) {
            this.uniforms = defineUniforms(desc.uniforms);
        }
        else {
            this.uniforms = null;
        }
        /* ---- 纹理 ------------------------------------------------------------------------------ */
        const rawTextures = (desc.textures ?? []).map((entry) => typeof entry === 'string' ? { name: entry } : entry);
        this.textures = rawTextures.map((entry, index) => {
            const binding = entry.binding ?? index * 2;
            return {
                name: entry.name,
                sampleType: entry.sampleType ?? 'float',
                viewDimension: entry.viewDimension ?? '2d',
                comparison: entry.comparison ?? entry.sampleType === 'depth',
                binding,
                samplerName: `${entry.name}_sampler`,
                samplerBinding: binding + 1,
            };
        });
        // 纹理在 group 1；没有 uniform 块时纹理落到 group 0（group 不能跳号）。
        const textureGroup = this.uniforms ? 1 : 0;
        /* ---- GLSL 注入 ------------------------------------------------------------------------- */
        const glslUniforms = this.uniforms ? this.uniforms.glslDeclaration() : '';
        const glslTextures = this.textures
            .map((texture) => `uniform ${glslSamplerType(texture.sampleType, texture.viewDimension, texture.comparison)} ${texture.name};`)
            .join('\n');
        const glslAttributes = this.attributes
            .map((attribute) => `layout(location = ${attribute.location}) in ${vertexFormatGlslType(attribute.format)} ${attribute.name};`)
            .join('\n');
        this.glsl = {
            vs: inject(desc.glsl.vs, [
                { placeholder: UNIFORM_PLACEHOLDER, text: glslUniforms },
                { placeholder: ATTRIBUTE_PLACEHOLDER, text: glslAttributes },
                { placeholder: TEXTURE_PLACEHOLDER, text: glslTextures },
            ]),
            fs: inject(desc.glsl.fs, [
                { placeholder: UNIFORM_PLACEHOLDER, text: glslUniforms },
                { placeholder: TEXTURE_PLACEHOLDER, text: glslTextures },
            ]),
        };
        // 片元输出：GLSL ES 3.00 要求显式声明 `out` 变量，少了它编译会报
        // “'fragColor' : undeclared identifier”，而使用者往往意识不到这是必须的。
        // 所以默认自动补上，除非使用者自己声明了同名输出或显式关掉了它。
        if (desc.fragmentOutput !== false) {
            const outputName = desc.fragmentOutput ?? 'fragColor';
            const declared = new RegExp(`\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${outputName}\\b`).test(this.glsl.fs);
            if (!declared) {
                this.glsl.fs = `layout(location = 0) out vec4 ${outputName};\n${this.glsl.fs}`;
            }
        }
        /* ---- WGSL 注入 ------------------------------------------------------------------------- */
        const wgslSource = desc.wgsl;
        const wgslUniforms = this.uniforms ? this.uniforms.wgslDeclaration() : '';
        const wgslTextures = this.textures
            .map((texture) => {
            const samplerType = texture.comparison && texture.sampleType === 'depth' ? 'sampler_comparison' : 'sampler';
            return (`@group(${textureGroup}) @binding(${texture.binding}) var ${texture.name}: ${wgslTextureType(texture.sampleType, texture.viewDimension)};\n` +
                `@group(${textureGroup}) @binding(${texture.samplerBinding}) var ${texture.samplerName}: ${samplerType};`);
        })
            .join('\n');
        const wgslAttributes = this.attributes.length > 0
            ? `struct VertexInput {\n${this.attributes
                .map((attribute) => `  @location(${attribute.location}) ${attribute.name}: ${vertexFormatWgslType(attribute.format)},`)
                .join('\n')}\n}`
            : '';
        this.wgsl = inject(wgslSource, [
            { placeholder: UNIFORM_PLACEHOLDER, text: wgslUniforms },
            { placeholder: ATTRIBUTE_PLACEHOLDER, text: wgslAttributes },
            { placeholder: TEXTURE_PLACEHOLDER, text: wgslTextures },
        ]);
    }
    /** 创建一个材质。 */
    static create(desc) {
        return new Material(desc);
    }
    /**
     * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
     * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
     */
    vertexBufferLayouts() {
        return this.attributes.map((attribute) => ({
            arrayStride: vertexFormatInfo(attribute.format).byteSize,
            stepMode: attribute.stepMode,
            attributes: [{ shaderLocation: attribute.location, offset: 0, format: attribute.format }],
        }));
    }
    /** 创建 core 的 shader module（vs/fs/wgsl 三份源码都在里面）。 */
    createShaderModule(device) {
        return device.createShaderModule({
            label: `${this.name}:shader`,
            code: { vs: this.glsl.vs, fs: this.glsl.fs, wgsl: this.wgsl },
            defines: this.desc.defines,
        });
    }
    /** 按需创建 bind group layout（group 0 的 uniform 部分）；没有 uniform 块时返回 `null`。 */
    createUniformBindGroupLayout(device) {
        return this.cachedGroupLayout(device, 0);
    }
    /** 按需创建纹理所在的 bind group layout；材质没有纹理时返回 `null`。 */
    createTextureGroupLayout(device) {
        if (this.textures.length === 0)
            return null;
        return this.cachedGroupLayout(device, this.textureGroup);
    }
    /**
     * 按 (device, group) 记忆化 bind group layout。
     *
     * 为什么必须缓存：`UniformArena.bindGroup(layout)` 是按 layout **对象身份**判断要不要重建
     * bind group 的 —— 如果每次 draw 都新建一个 layout 对象，缓存永不命中，
     * 于是每帧每个物体都会新建一个 bind group，白白产生大量对象。
     */
    cachedGroupLayout(device, group) {
        let perDevice = this.groupLayoutCache.get(device);
        if (!perDevice) {
            perDevice = new Map();
            this.groupLayoutCache.set(device, perDevice);
        }
        if (!perDevice.has(group))
            perDevice.set(group, this.createGroupLayout(device, group));
        return perDevice.get(group) ?? null;
    }
    groupLayoutCache = new WeakMap();
    /** 创建 pipeline layout（必要时带上纹理 group）。 */
    createPipelineLayout(device) {
        const uniformLayout = this.uniforms ? this.cachedGroupLayout(device, 0) : null;
        const textureLayout = this.textures.length > 0 ? this.cachedGroupLayout(device, this.textureGroup) : null;
        if (!uniformLayout && !textureLayout)
            return 'auto';
        const layouts = [];
        if (uniformLayout)
            layouts.push(uniformLayout);
        if (textureLayout)
            layouts.push(textureLayout);
        // 数组下标就是 group 序号，所以「uniform 在 group 0、纹理在 group 1」时顺序天然正确。
        return device.createPipelineLayout({ label: `${this.name}:pipelineLayout`, bindGroupLayouts: layouts });
    }
    /** 材质声明的纹理所在的 group（有 uniform 块时是 1，否则是 0）。 */
    get textureGroup() {
        return this.uniforms ? 1 : 0;
    }
    /** 生成可以直接交给 `device.createRenderPipeline()` 的描述。 */
    createPipelineDescriptor(device) {
        const layout = this.createPipelineLayout(device);
        const module = this.createShaderModule(device);
        const blend = this.resolveBlend();
        const targets = blend
            ? [{ blend, writeMask: 0x0f }]
            : undefined;
        const vertexBuffers = this.vertexBufferLayouts();
        if (vertexBuffers.length === 0) {
            throw new ValidationError(`[gpu-device-api] 材质「${this.name}」没有声明任何顶点属性。` +
                '两个后端都必须显式知道顶点布局，请至少声明一个 `attributes`（例如 `{ position: \'float32x3\' }`）。');
        }
        const descriptor = {
            label: `${this.name}:pipeline`,
            layout,
            vertex: {
                module,
                entryPoint: this.desc.vertexEntry ?? 'vsMain',
                buffers: vertexBuffers,
            },
            fragment: {
                module,
                entryPoint: this.desc.fragmentEntry ?? 'fsMain',
                ...(targets ? { targets } : {}),
            },
            primitive: {
                topology: this.desc.topology ?? 'triangle-list',
                cullMode: this.desc.cullMode ?? 'back',
                frontFace: this.desc.frontFace ?? 'ccw',
            },
        };
        if (this.desc.depthTest !== false) {
            descriptor.depthStencil = {
                depthWriteEnabled: this.desc.depthWrite ?? true,
                depthCompare: this.desc.depthCompare ?? 'less',
            };
        }
        else {
            descriptor.depthStencil = { format: null };
        }
        return { descriptor, layout };
    }
    /** 为这个材质的 uniform 布局创建一套数值容器，并写入描述里的初始值。 */
    createUniforms() {
        if (!this.uniforms) {
            throw new ValidationError(`[gpu-device-api] 材质「${this.name}」没有 uniform 布局，无法创建 uniform 数值容器。`);
        }
        const values = createUniforms(this.uniforms);
        if (this.desc.defaults) {
            for (const [name, value] of Object.entries(this.desc.defaults)) {
                if (!values.has(name)) {
                    throw new ValidationError(`[gpu-device-api] 材质「${this.name}」的 defaults 里出现了布局中不存在的字段「${name}」。` +
                        `布局字段：${this.uniforms.fields.map((field) => field.name).join('、')}。`);
                }
                values.set(name, value);
            }
        }
        return values;
    }
    /** 材质声明的纹理名列表。 */
    get textureNames() {
        return this.textures.map((texture) => texture.name);
    }
    resolveBlend() {
        const blend = this.desc.blend;
        if (blend === undefined || blend === 'none')
            return null;
        if (typeof blend === 'string') {
            const preset = BLEND_PRESETS[blend];
            if (!preset) {
                throw new ValidationError(`[gpu-device-api] 材质「${this.name}」使用了未知的混合预设「${blend}」。` +
                    '可用：none、alpha、premultiplied、additive、multiply、screen。');
            }
            return preset;
        }
        return blend;
    }
    /** 只为一个 group 生成 layout（内部用）。 */
    createGroupLayout(device, group) {
        const entries = [];
        const visibility = 0x0003;
        if (group === 0 && this.uniforms) {
            entries.push({
                binding: this.uniforms.binding,
                visibility,
                type: BindingType.Uniform,
                name: this.uniforms.structName,
                buffer: {
                    type: 'uniform',
                    hasDynamicOffset: this.desc.dynamicUniforms !== false,
                    minBindingSize: this.uniforms.byteLength,
                },
            });
        }
        const textureGroup = this.uniforms ? 1 : 0;
        if (group === textureGroup) {
            for (const texture of this.textures) {
                entries.push({
                    binding: texture.binding,
                    visibility,
                    type: BindingType.Texture,
                    name: texture.name,
                    texture: { sampleType: texture.sampleType, viewDimension: texture.viewDimension },
                });
                entries.push({
                    binding: texture.samplerBinding,
                    visibility,
                    type: texture.comparison && texture.sampleType === 'depth'
                        ? BindingType.ComparisonSampler
                        : BindingType.Sampler,
                    name: texture.samplerName,
                    sampler: { type: texture.comparison ? 'comparison' : 'filtering' },
                });
            }
        }
        if (entries.length === 0)
            return null;
        return device.createBindGroupLayout({ label: `${this.name}:group${group}`, entries });
    }
}
/** 定义一个材质。 */
export function defineMaterial(desc) {
    return Material.create(desc);
}
//# sourceMappingURL=Material.js.map