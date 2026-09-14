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
import { type VertexFormat } from '../core/enums/VertexFormat.js';
import type { BlendFactor } from '../core/enums/BlendFactor.js';
import type { BlendOperation } from '../core/enums/BlendOperation.js';
import type { CompareFunction } from '../core/enums/CompareFunction.js';
import type { CullMode } from '../core/enums/CullMode.js';
import type { FrontFace } from '../core/enums/FrontFace.js';
import type { PrimitiveTopology } from '../core/enums/PrimitiveTopology.js';
import type { VertexStepMode } from '../core/enums/VertexStepMode.js';
import type { TextureSampleType } from '../core/binding/BindingTypes.js';
import type { BindGroupLayout } from '../core/binding/BindGroupLayout.js';
import type { PipelineLayout } from '../core/binding/PipelineLayout.js';
import type { BlendComponent, BlendState } from '../core/pipeline/RenderState.js';
import type { RenderPipelineDescriptor } from '../core/pipeline/RenderPipeline.js';
import type { VertexBufferLayout } from '../core/pipeline/VertexLayout.js';
import type { Device } from '../core/Device.js';
import type { ShaderModule } from '../core/resources/ShaderModule.js';
import type { TextureViewDimension } from '../core/resources/TextureView.js';
import { type UniformLayout, type UniformLayoutDesc, type Uniforms } from './Uniforms.js';
/** 着色器里的占位符；写上就按写的位置注入，不写则整体前置。 */
export declare const UNIFORM_PLACEHOLDER = "/*%uniforms%*/";
export declare const ATTRIBUTE_PLACEHOLDER = "/*%attributes%*/";
export declare const TEXTURE_PLACEHOLDER = "/*%textures%*/";
/** 纹理绑定的声明。 */
export interface MaterialTextureDesc {
    /** 着色器里的 sampler 变量名。 */
    name: string;
    /** 采样类型，决定 GLSL 的 sampler 类型与 WGSL 的 texture 类型。默认 `'float'`。 */
    sampleType?: TextureSampleType;
    /** 视图维度，默认 `'2d'`。 */
    viewDimension?: TextureViewDimension;
    /** WGSL 里是否声明成比较采样器（阴影贴图用）。默认 `false`。 */
    comparison?: boolean;
    /** 显式指定纹理的 binding；默认按声明顺序分配 `2i`，采样器用 `2i+1`。 */
    binding?: number;
}
export type BlendPresetName = 'none' | 'alpha' | 'premultiplied' | 'additive' | 'multiply' | 'screen';
/**
 * 单个顶点属性的声明。
 *
 * 直接给格式字符串（`'float32x3'`）表示「按顶点步进」；实例化属性写成
 * `{ format: 'float32x3', stepMode: 'instance' }` —— 这时它对每个实例读一次，
 * 而不是对每个顶点读一次（几何体那边对应的数据也要用 `perInstance: true` 上传）。
 */
export type MaterialAttributeInput = VertexFormat | {
    format: VertexFormat;
    stepMode?: VertexStepMode;
};
export interface MaterialDesc {
    name?: string;
    /**
     * 顶点属性：名字 → 格式（或 `{ format, stepMode }`）。**声明顺序即 shaderLocation（从 0 开始）**，
     * 所以渲染器绑定顶点缓冲时也按这个顺序取槽位。
     */
    attributes?: Record<string, MaterialAttributeInput>;
    /** uniform 布局：描述对象或已定义好的 {@link UniformLayout}。 */
    uniforms?: UniformLayoutDesc | UniformLayout | null;
    /** 采样的纹理。 */
    textures?: readonly (string | MaterialTextureDesc)[];
    /** GLSL ES 3.00 源码（WebGL2 后端用），顶点与片元分开。 */
    glsl: {
        vs: string;
        fs: string;
    };
    /**
     * WGSL 源码（WebGPU 后端用）：**一个模块**，里面同时包含 `@vertex` 与 `@fragment` 入口
     * —— 这与 WebGPU 的 `createShaderModule` 一致，它本来就只接受一份代码。
     */
    wgsl: string;
    topology?: PrimitiveTopology;
    cullMode?: CullMode;
    frontFace?: FrontFace;
    depthTest?: boolean;
    depthWrite?: boolean;
    depthCompare?: CompareFunction;
    /** 混合预设，或一份完整的混合状态。默认 `'none'`。 */
    blend?: BlendPresetName | BlendState;
    /** GLSL 里自动声明的片元输出名；`false` 表示自己声明。默认 `'fragColor'`。 */
    fragmentOutput?: string | false;
    /** WGSL 顶点/片元入口点名字。 */
    vertexEntry?: string;
    fragmentEntry?: string;
    defines?: Record<string, string | number | boolean>;
    /** uniform 块是否用动态偏移绑定（uniform arena）。默认 `true`。 */
    dynamicUniforms?: boolean;
    /**
     * uniform 的初始值。渲染器为这个材质创建数值容器时会写入它们，
     * 之后每次 `draw()` 只在需要时覆盖 —— 所以「材质的默认颜色」这种设定写在这里最合适。
     */
    defaults?: Record<string, number | ArrayLike<number>>;
}
export interface ResolvedMaterialTexture {
    name: string;
    sampleType: TextureSampleType;
    viewDimension: TextureViewDimension;
    comparison: boolean;
    binding: number;
    samplerName: string;
    samplerBinding: number;
}
/**
 * 一份材质。`createPipelineDescriptor()` 产出的描述可以直接交给
 * `device.createRenderPipeline()`，两种后端都吃同一份描述。
 */
export declare class Material {
    readonly name: string;
    readonly desc: MaterialDesc;
    /** 属性名 → 格式 / 步进模式，顺序即 shaderLocation。 */
    readonly attributes: readonly {
        name: string;
        format: VertexFormat;
        location: number;
        stepMode: VertexStepMode;
    }[];
    readonly uniforms: UniformLayout | null;
    readonly textures: readonly ResolvedMaterialTexture[];
    /** 注入声明后的 GLSL 源码。 */
    readonly glsl: {
        vs: string;
        fs: string;
    }; /** 注入声明后的 WGSL 模块。 */
    readonly wgsl: string;
    private constructor();
    /** 创建一个材质。 */
    static create(desc: MaterialDesc): Material;
    /**
     * 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存），
     * `stepMode` 取自声明 —— 实例化属性就是 `'instance'`。
     */
    vertexBufferLayouts(): VertexBufferLayout[];
    /** 创建 core 的 shader module（vs/fs/wgsl 三份源码都在里面）。 */
    createShaderModule(device: Device): ShaderModule;
    /** 按需创建 bind group layout（group 0 的 uniform 部分）；没有 uniform 块时返回 `null`。 */
    createUniformBindGroupLayout(device: Device): BindGroupLayout | null;
    /** 按需创建纹理所在的 bind group layout；材质没有纹理时返回 `null`。 */
    createTextureGroupLayout(device: Device): BindGroupLayout | null;
    /**
     * 按 (device, group) 记忆化 bind group layout。
     *
     * 为什么必须缓存：`UniformArena.bindGroup(layout)` 是按 layout **对象身份**判断要不要重建
     * bind group 的 —— 如果每次 draw 都新建一个 layout 对象，缓存永不命中，
     * 于是每帧每个物体都会新建一个 bind group，白白产生大量对象。
     */
    private cachedGroupLayout;
    private readonly groupLayoutCache;
    /** 创建 pipeline layout（必要时带上纹理 group）。 */
    createPipelineLayout(device: Device): PipelineLayout | 'auto';
    /** 材质声明的纹理所在的 group（有 uniform 块时是 1，否则是 0）。 */
    get textureGroup(): number;
    /** 生成可以直接交给 `device.createRenderPipeline()` 的描述。 */
    createPipelineDescriptor(device: Device): {
        descriptor: RenderPipelineDescriptor;
        layout: PipelineLayout | 'auto';
    };
    /** 为这个材质的 uniform 布局创建一套数值容器，并写入描述里的初始值。 */
    createUniforms(): Uniforms<UniformLayoutDesc>;
    /** 材质声明的纹理名列表。 */
    get textureNames(): string[];
    resolveBlend(): BlendState | null;
    /** 只为一个 group 生成 layout（内部用）。 */
    private createGroupLayout;
}
/** 定义一个材质。 */
export declare function defineMaterial(desc: MaterialDesc): Material;
/** 便于外部构造混合状态时复用类型。 */
export type { BlendComponent, BlendFactor, BlendOperation };
//# sourceMappingURL=Material.d.ts.map