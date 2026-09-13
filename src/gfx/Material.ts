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
import {
  vertexFormatGlslType,
  vertexFormatInfo,
  vertexFormatWgslType,
  type VertexFormat,
} from '../core/enums/VertexFormat.js';
import type { BlendFactor } from '../core/enums/BlendFactor.js';
import type { BlendOperation } from '../core/enums/BlendOperation.js';
import type { CompareFunction } from '../core/enums/CompareFunction.js';
import type { CullMode } from '../core/enums/CullMode.js';
import type { FrontFace } from '../core/enums/FrontFace.js';
import type { PrimitiveTopology } from '../core/enums/PrimitiveTopology.js';
import type { BindGroupLayoutEntry, TextureSampleType } from '../core/binding/BindingTypes.js';
import type { BindGroupLayout } from '../core/binding/BindGroupLayout.js';
import type { PipelineLayout } from '../core/binding/PipelineLayout.js';
import type { BlendComponent, BlendState, ColorTargetState } from '../core/pipeline/RenderState.js';
import type { RenderPipelineDescriptor } from '../core/pipeline/RenderPipeline.js';
import type { VertexBufferLayout } from '../core/pipeline/VertexLayout.js';
import type { Device } from '../core/Device.js';
import type { ShaderModule } from '../core/resources/ShaderModule.js';
import type { TextureViewDimension } from '../core/resources/TextureView.js';
import {
  UniformLayout as UniformLayoutClass,
  createUniforms,
  defineUniforms,
  type UniformLayout,
  type UniformLayoutDesc,
  type Uniforms,
} from './Uniforms.js';

/** 着色器里的占位符；写上就按写的位置注入，不写则整体前置。 */
export const UNIFORM_PLACEHOLDER = '/*%uniforms%*/';
export const ATTRIBUTE_PLACEHOLDER = '/*%attributes%*/';
export const TEXTURE_PLACEHOLDER = '/*%textures%*/';

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

export interface MaterialDesc {
  name?: string;
  /**
   * 顶点属性：名字 → 格式。**声明顺序即 shaderLocation（从 0 开始）**，
   * 所以渲染器绑定顶点缓冲时也按这个顺序取槽位。
   */
  attributes?: Record<string, VertexFormat>;
  /** uniform 布局：描述对象或已定义好的 {@link UniformLayout}。 */
  uniforms?: UniformLayoutDesc | UniformLayout | null;
  /** 采样的纹理。 */
  textures?: readonly (string | MaterialTextureDesc)[];

  /** GLSL ES 3.00 源码（WebGL2 后端用），顶点与片元分开。 */
  glsl: { vs: string; fs: string };
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

/** 混合预设表（与 core 的 `BLEND_PRESETS` 一致的取值，这里重新声明以便加类型名）。 */
const BLEND_PRESETS: Readonly<Record<Exclude<BlendPresetName, 'none'>, BlendState>> = {
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
function glslSamplerType(sampleType: TextureSampleType, dimension: TextureViewDimension, comparison: boolean): string {
  const base =
    dimension === 'cube'
      ? 'samplerCube'
      : dimension === '3d'
        ? 'sampler3D'
        : dimension === '2d-array'
          ? 'sampler2DArray'
          : 'sampler2D';
  if (comparison) {
    // 比较采样器只在 2D / Cube / 2D-array 上有影子版本。
    if (base === 'sampler2D') return 'sampler2DShadow';
    if (base === 'samplerCube') return 'samplerCubeShadow';
    if (base === 'sampler2DArray') return 'sampler2DArrayShadow';
    return base;
  }
  if (sampleType === 'sint') return `i${base}`;
  if (sampleType === 'uint') return `u${base}`;
  return base;
}

/** 名字 → WGSL texture 类型。 */
function wgslTextureType(sampleType: TextureSampleType, dimension: TextureViewDimension): string {
  if (sampleType === 'depth') {
    return dimension === 'cube'
      ? 'texture_depth_cube'
      : dimension === '2d-array'
        ? 'texture_depth_2d_array'
        : 'texture_depth_2d';
  }
  const scalar = sampleType === 'sint' ? 'i32' : sampleType === 'uint' ? 'u32' : 'f32';
  const base =
    dimension === 'cube'
      ? 'texture_cube'
      : dimension === '3d'
        ? 'texture_3d'
        : dimension === '2d-array'
          ? 'texture_2d_array'
          : 'texture_2d';
  return `${base}<${scalar}>`;
}

/** 把声明块注入源码：有占位符就替进去，否则前置。 */
function inject(source: string, blocks: readonly { placeholder: string; text: string }[]): string {
  let body = source;
  const pending: string[] = [];
  for (const block of blocks) {
    if (!block.text) continue;
    if (body.includes(block.placeholder)) {
      body = body.split(block.placeholder).join(block.text);
    } else {
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
  readonly name: string;
  readonly desc: MaterialDesc;
  /** 属性名 → 格式，顺序即 shaderLocation。 */
  readonly attributes: readonly { name: string; format: VertexFormat; location: number }[];
  readonly uniforms: UniformLayout | null;
  readonly textures: readonly ResolvedMaterialTexture[];

  /** 注入声明后的 GLSL 源码。 */
  readonly glsl: { vs: string; fs: string };  /** 注入声明后的 WGSL 模块。 */
  readonly wgsl: string;

  private constructor(desc: MaterialDesc) {
    this.desc = desc;
    this.name = desc.name ?? 'material';

    /* ---- 属性 ------------------------------------------------------------------------------ */
    const attributeEntries = Object.entries(desc.attributes ?? {});
    if (attributeEntries.length > 16) {
      throw new ValidationError(
        `[gpu-device-api] 材质「${this.name}」声明了 ${attributeEntries.length} 个顶点属性，超过 WebGL2/WebGPU 的 16 个上限。`,
      );
    }
    this.attributes = attributeEntries.map(([name, format], index) => ({ name, format, location: index }));

    /* ---- uniform --------------------------------------------------------------------------- */
    if (desc.uniforms instanceof UniformLayoutClass) {
      this.uniforms = desc.uniforms;
    } else if (desc.uniforms) {
      this.uniforms = defineUniforms(desc.uniforms as UniformLayoutDesc);
    } else {
      this.uniforms = null;
    }

    /* ---- 纹理 ------------------------------------------------------------------------------ */
    const rawTextures = (desc.textures ?? []).map((entry) =>
      typeof entry === 'string' ? ({ name: entry } as MaterialTextureDesc) : entry,
    );
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
      .map(
        (texture) =>
          `uniform ${glslSamplerType(texture.sampleType, texture.viewDimension, texture.comparison)} ${texture.name};`,
      )
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
      const declared = new RegExp(
        `\\bout\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?\\w+\\s+${outputName}\\b`,
      ).test(this.glsl.fs);
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
        return (
          `@group(${textureGroup}) @binding(${texture.binding}) var ${texture.name}: ${wgslTextureType(texture.sampleType, texture.viewDimension)};\n` +
          `@group(${textureGroup}) @binding(${texture.samplerBinding}) var ${texture.samplerName}: ${samplerType};`
        );
      })
      .join('\n');
    const wgslAttributes =
      this.attributes.length > 0
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
  static create(desc: MaterialDesc): Material {
    return new Material(desc);
  }

  /** 顶点缓冲布局：每个属性一个缓冲槽，步长就是该格式的字节数（几何体按属性分开存）。 */
  vertexBufferLayouts(): VertexBufferLayout[] {
    return this.attributes.map((attribute) => ({
      arrayStride: vertexFormatInfo(attribute.format).byteSize,
      stepMode: 'vertex' as const,
      attributes: [{ shaderLocation: attribute.location, offset: 0, format: attribute.format }],
    }));
  }

  /** 创建 core 的 shader module（vs/fs/wgsl 三份源码都在里面）。 */
  createShaderModule(device: Device): ShaderModule {
    return device.createShaderModule({
      label: `${this.name}:shader`,
      code: { vs: this.glsl.vs, fs: this.glsl.fs, wgsl: this.wgsl },
      defines: this.desc.defines,
    });
  }

  /** 按需创建 bind group layout（group 0 的 uniform 部分）；没有 uniform 块时返回 `null`。 */
  createUniformBindGroupLayout(device: Device): BindGroupLayout | null {
    return this.cachedGroupLayout(device, 0);
  }

  /** 按需创建纹理所在的 bind group layout；材质没有纹理时返回 `null`。 */
  createTextureGroupLayout(device: Device): BindGroupLayout | null {
    if (this.textures.length === 0) return null;
    return this.cachedGroupLayout(device, this.textureGroup);
  }

  /**
   * 按 (device, group) 记忆化 bind group layout。
   *
   * 为什么必须缓存：`UniformArena.bindGroup(layout)` 是按 layout **对象身份**判断要不要重建
   * bind group 的 —— 如果每次 draw 都新建一个 layout 对象，缓存永不命中，
   * 于是每帧每个物体都会新建一个 bind group，白白产生大量对象。
   */
  private cachedGroupLayout(device: Device, group: number): BindGroupLayout | null {
    let perDevice = this.groupLayoutCache.get(device);
    if (!perDevice) {
      perDevice = new Map();
      this.groupLayoutCache.set(device, perDevice);
    }
    if (!perDevice.has(group)) perDevice.set(group, this.createGroupLayout(device, group));
    return perDevice.get(group) ?? null;
  }

  private readonly groupLayoutCache = new WeakMap<Device, Map<number, BindGroupLayout | null>>();

  /** 创建 pipeline layout（必要时带上纹理 group）。 */
  createPipelineLayout(device: Device): PipelineLayout | 'auto' {
    const uniformLayout = this.uniforms ? this.cachedGroupLayout(device, 0) : null;
    const textureLayout =
      this.textures.length > 0 ? this.cachedGroupLayout(device, this.textureGroup) : null;
    if (!uniformLayout && !textureLayout) return 'auto';
    const layouts: BindGroupLayout[] = [];
    if (uniformLayout) layouts.push(uniformLayout);
    if (textureLayout) layouts.push(textureLayout);
    // 数组下标就是 group 序号，所以「uniform 在 group 0、纹理在 group 1」时顺序天然正确。
    return device.createPipelineLayout({ label: `${this.name}:pipelineLayout`, bindGroupLayouts: layouts });
  }

  /** 材质声明的纹理所在的 group（有 uniform 块时是 1，否则是 0）。 */
  get textureGroup(): number {
    return this.uniforms ? 1 : 0;
  }

  /** 生成可以直接交给 `device.createRenderPipeline()` 的描述。 */
  createPipelineDescriptor(device: Device): { descriptor: RenderPipelineDescriptor; layout: PipelineLayout | 'auto' } {
    const layout = this.createPipelineLayout(device);
    const module = this.createShaderModule(device);
    const blend = this.resolveBlend();

    const targets: ColorTargetState[] | undefined = blend
      ? [{ blend, writeMask: 0x0f }]
      : undefined;

    const vertexBuffers = this.vertexBufferLayouts();
    if (vertexBuffers.length === 0) {
      throw new ValidationError(
        `[gpu-device-api] 材质「${this.name}」没有声明任何顶点属性。` +
          '两个后端都必须显式知道顶点布局，请至少声明一个 `attributes`（例如 `{ position: \'float32x3\' }`）。',
      );
    }

    const descriptor: RenderPipelineDescriptor = {
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
    } else {
      descriptor.depthStencil = { format: null };
    }

    return { descriptor, layout };
  }

  /** 为这个材质的 uniform 布局创建一套数值容器，并写入描述里的初始值。 */
  createUniforms(): Uniforms<UniformLayoutDesc> {
    if (!this.uniforms) {
      throw new ValidationError(
        `[gpu-device-api] 材质「${this.name}」没有 uniform 布局，无法创建 uniform 数值容器。`,
      );
    }
    const values = createUniforms(this.uniforms) as Uniforms<UniformLayoutDesc>;
    if (this.desc.defaults) {
      for (const [name, value] of Object.entries(this.desc.defaults)) {
        if (!values.has(name)) {
          throw new ValidationError(
            `[gpu-device-api] 材质「${this.name}」的 defaults 里出现了布局中不存在的字段「${name}」。` +
              `布局字段：${this.uniforms.fields.map((field) => field.name).join('、')}。`,
          );
        }
        values.set(name as never, value as never);
      }
    }
    return values;
  }

  /** 材质声明的纹理名列表。 */
  get textureNames(): string[] {
    return this.textures.map((texture) => texture.name);
  }

  resolveBlend(): BlendState | null {
    const blend = this.desc.blend;
    if (blend === undefined || blend === 'none') return null;
    if (typeof blend === 'string') {
      const preset = BLEND_PRESETS[blend];
      if (!preset) {
        throw new ValidationError(
          `[gpu-device-api] 材质「${this.name}」使用了未知的混合预设「${blend}」。` +
            '可用：none、alpha、premultiplied、additive、multiply、screen。',
        );
      }
      return preset;
    }
    return blend;
  }

  /** 只为一个 group 生成 layout（内部用）。 */
  private createGroupLayout(device: Device, group: number): BindGroupLayout | null {
    const entries: BindGroupLayoutEntry[] = [];
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
          type:
            texture.comparison && texture.sampleType === 'depth'
              ? BindingType.ComparisonSampler
              : BindingType.Sampler,
          name: texture.samplerName,
          sampler: { type: texture.comparison ? 'comparison' : 'filtering' },
        });
      }
    }
    if (entries.length === 0) return null;
    return device.createBindGroupLayout({ label: `${this.name}:group${group}`, entries });
  }
}

/** 定义一个材质。 */
export function defineMaterial(desc: MaterialDesc): Material {
  return Material.create(desc);
}

/** 便于外部构造混合状态时复用类型。 */
export type { BlendComponent, BlendFactor, BlendOperation };
