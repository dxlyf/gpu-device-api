/**
 * WebGL2 的 render pipeline。
 *
 * 与 WebGPU 不同，WebGL2 的管线**可以立即编译**：顶点属性位置由 GLSL 里的
 * `layout(location = N)` 写死，附件格式也不影响 program 的链接结果。
 * 所以这里在 `createRenderPipeline()` 时就编译好 program，错误能尽早暴露；
 * `resolve(variant)` 只负责「按渲染目标解析固定功能状态 + 校验顶点布局」，非常廉价。
 *
 * VAO（顶点数组对象）也放在这里缓存：它记录的是「program 的属性槽 + 具体顶点缓冲」的组合，
 * 所以生命周期跟着管线走最自然。缓存键包含顶点缓冲对象、偏移、步长与索引缓冲，
 * 因此同一个几何体反复绘制时只需要建一次 VAO。
 */

import { ValidationError } from '../../core/errors/ValidationError.js';
import { validateVertexBufferLayout, vertexBufferLayoutsKey } from '../../core/pipeline/VertexLayout.js';
import type { VertexBufferLayout } from '../../core/pipeline/VertexLayout.js';
import type {
  RenderPipeline,
  RenderPipelineDescriptor,
  RenderPipelineVariant,
} from '../../core/pipeline/RenderPipeline.js';
import type { PipelineLayout } from '../../core/binding/PipelineLayout.js';
import { assertNonNegativeInteger } from '../../utils/assert.js';
import { nextId } from '../../utils/id.js';
import { glVertexAttribute, GL_PRIMITIVE_MODES } from '../utils/glEnumMap.js';
import type { GlStateCache } from '../utils/glStateCache.js';
import type { WebGL2Buffer } from '../resources/WebGL2Buffer.js';
import type { WebGLBindingPlan } from '../binding/TextureUnitAllocator.js';
import type { WebGL2PipelineLayout } from '../binding/WebGL2PipelineLayout.js';
import { applyRenderState, resolveRenderState, type ResolvedRenderState } from './WebGL2RenderState.js';
import type { CompiledProgram } from './ProgramCache.js';

/** 某个渲染目标形态下解析出来的一份具体状态。 */
export interface ResolvedVariant {
  readonly key: string;
  readonly renderState: ResolvedRenderState;
  readonly depthFormat: string | null;
  readonly sampleCount: number;
  /**
   * 该形态使用的顶点布局。
   *
   * 之所以放进变体而不是只读描述里的：便捷层会为同一个材质服务多个几何体，
   * 属性集合不同则布局不同。放在变体里，`acquireVertexArray` 才会用**本次实际使用的**布局，
   * 否则会拿描述里的旧布局去建 VAO，属性指针就全错了。
   */
  readonly vertexLayouts: readonly VertexBufferLayout[];
  /** 该形态下已经建好的 VAO，键里含顶点缓冲组合。 */
  readonly vertexArrays: Map<string, WebGLVertexArrayObject>;
}

/** 一个顶点缓冲槽的绑定内容。 */
export interface VertexBufferBinding {
  buffer: WebGL2Buffer;
  offset: number;
  /** `-1` 表示一直到缓冲末尾。 */
  size: number;
}

export interface WebGL2RenderPipelineOptions {
  gl: WebGL2RenderingContext;
  state: GlStateCache;
  limits: { maxVertexAttributes: number; maxVertexBufferArrayStride: number };
}

export class WebGL2RenderPipeline implements RenderPipeline {
  readonly label: string;
  readonly descriptor: RenderPipelineDescriptor;
  readonly layout: PipelineLayout | 'auto';
  readonly vertexLayouts: readonly VertexBufferLayout[] | null;

  private readonly gl: WebGL2RenderingContext;
  private readonly state: GlStateCache;
  private readonly limits: WebGL2RenderPipelineOptions['limits'];
  private readonly program: CompiledProgram;
  private readonly plan: WebGLBindingPlan | null;
  private readonly topologyMode: number;
  private readonly variantCache = new Map<string, ResolvedVariant>();
  private _disposed = false;

  constructor(
    descriptor: RenderPipelineDescriptor,
    program: CompiledProgram,
    layout: PipelineLayout | 'auto',
    options: WebGL2RenderPipelineOptions,
  ) {
    if (!descriptor.fragment) {
      throw new ValidationError(
        '[gpu-device-api] WebGL2 后端不支持只有深度、没有片元着色器的管线（GL 的 program 必须同时链接两个阶段）。\n' +
          '请提供一个写深度或写颜色的片元着色器；若只想写深度，可以在片元着色器里 `discard` 而不输出颜色。',
      );
    }

    this.label = descriptor.label ?? nextId('renderPipeline');
    this.descriptor = descriptor;
    this.layout = layout;
    this.vertexLayouts = descriptor.vertex.buffers ? [...descriptor.vertex.buffers] : null;
    this.gl = options.gl;
    this.state = options.state;
    this.limits = options.limits;
    this.program = program;
    this.plan = layout === 'auto' ? null : ((layout as WebGL2PipelineLayout).bindingPlan ?? null);
    this.topologyMode = GL_PRIMITIVE_MODES[descriptor.primitive?.topology ?? 'triangle-list'];
  }

  /** WebGL2 在创建时就完成了编译。 */
  get compiled(): boolean {
    return true;
  }

  /** 已链接好的 program 等内部信息（供渲染通道与调试使用）。 */
  get compiledProgram(): CompiledProgram {
    return this.program;
  }

  /** GL 图元模式。 */
  get mode(): number {
    return this.topologyMode;
  }

  get bindingPlan(): WebGLBindingPlan | null {
    return this.plan;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get native(): WebGLProgram {
    return this.program.program;
  }

  /**
   * 按渲染目标形态解析状态。同一形态只解析一次；顶点布局也在这里做一次校验。
   */
  resolveVariant(variant: Partial<RenderPipelineVariant> = {}): ResolvedVariant {
    const depthFormat = variant.depthFormat ?? null;
    const sampleCount = variant.sampleCount ?? 1;
    const vertexLayouts = variant.vertexLayouts ?? this.vertexLayouts ?? [];
    const key = `${depthFormat ?? 'none'}|${sampleCount}|${vertexBufferLayoutsKey(vertexLayouts)}`;

    const cached = this.variantCache.get(key);
    if (cached) return cached;

    if (vertexLayouts.length > 0) {
      for (const layout of vertexLayouts) validateVertexBufferLayout(layout, this.limits);
    }
    const declaredLocations = new Set(vertexLayouts.flatMap((layout) => layout.attributes.map((a) => a.shaderLocation)));
    const programLocations = new Set(this.program.reflection.attributes.map((attribute) => attribute.location));
    for (const location of programLocations) {
      if (!declaredLocations.has(location)) {
        throw new ValidationError(
          `[gpu-device-api] 管线「${this.label}」的顶点着色器声明了 location ${location}，` +
            '但 vertex.buffers 里没有对应的属性。请检查 VertexBufferLayout 的 shaderLocation。',
        );
      }
    }

    const resolved: ResolvedVariant = {
      key,
      renderState: resolveRenderState(this.descriptor, {
        depth: depthFormat !== null,
        stencil: depthFormat === 'depth24plus-stencil8',
      }),
      depthFormat,
      sampleCount,
      vertexLayouts,
      vertexArrays: new Map(),
    };
    this.variantCache.set(key, resolved);
    return resolved;
  }

  /** core 接口要求的 `resolve`；WebGL2 下它只做一次形态缓存查询。 */
  resolve(variant: Partial<RenderPipelineVariant> = {}): unknown {
    return this.resolveVariant(variant).renderState;
  }

  /** 把该管线的固定功能状态写入 GL 状态缓存。 */
  applyState(variant: ResolvedVariant, stencilReference = 0): void {
    this.state.useProgram(this.program.program);
    applyRenderState(this.state, variant.renderState, stencilReference);
  }

  /**
   * 取得（必要时创建）一个顶点数组对象。
   *
   * 返回 `null` 表示管线不读顶点属性（例如全屏三角形由 `gl_VertexID` 生成），
   * 此时调用方应绑定默认 VAO，以免上一次的顶点属性设置残留下来。
   */
  acquireVertexArray(
    variant: ResolvedVariant,
    bindings: readonly (VertexBufferBinding | null)[],
    indexBuffer: WebGLBuffer | null,
  ): WebGLVertexArrayObject | null {
    const layouts = variant.vertexLayouts;
    if (layouts.length === 0) return null;

    const key = buildVertexArrayKey(layouts, bindings, indexBuffer);
    const cached = variant.vertexArrays.get(key);
    if (cached) return cached;

    const gl = this.gl;
    const vertexArray = gl.createVertexArray();
    if (!vertexArray) {
      throw new ValidationError('[gpu-device-api] gl.createVertexArray() 返回 null，无法创建 VAO。');
    }

    // 通过状态缓存绑定，而不是直接调 GL：VAO 记录着「当前索引缓冲是谁」，
    // 而 `GlStateCache.withDefaultVertexArray()` 依赖缓存里的这个值来判断该恢复哪个 VAO。
    this.state.bindVertexArray(vertexArray);
    for (let slot = 0; slot < layouts.length; slot++) {
      const layout = layouts[slot];
      const binding = bindings[slot];
      if (!layout || !binding) continue;

      gl.bindBuffer(gl.ARRAY_BUFFER, binding.buffer.native);
      const divisor = layout.stepMode === 'instance' ? 1 : 0;
      for (const attribute of layout.attributes) {
        const info = glVertexAttribute(attribute.format);
        const offset = binding.offset + attribute.offset;
        gl.enableVertexAttribArray(attribute.shaderLocation);
        if (info.integer) {
          // 整数属性必须用 IPointer，否则 GL 会把整数值当作浮点解释（或者直接报错）。
          gl.vertexAttribIPointer(attribute.shaderLocation, info.size, info.type, layout.arrayStride, offset);
        } else {
          gl.vertexAttribPointer(
            attribute.shaderLocation,
            info.size,
            info.type,
            info.normalized,
            layout.arrayStride,
            offset,
          );
        }
        gl.vertexAttribDivisor(attribute.shaderLocation, divisor);
      }
    }
    if (indexBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // 这里绕过了状态缓存（ELEMENT_ARRAY_BUFFER 是 VAO 状态的一部分，必须在 VAO 内直接绑定），
    // 所以要把缓冲绑定缓存标记为失效，后续调用才会重新下发。
    this.state.invalidateBufferBindings();

    variant.vertexArrays.set(key, vertexArray);
    return vertexArray;
  }

  /** 当前缓存了多少个 VAO（跨全部形态）。 */
  get vertexArrayCount(): number {
    let total = 0;
    for (const variant of this.variantCache.values()) total += variant.vertexArrays.size;
    return total;
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    // program 由 ProgramCache 统一持有（可能被多条管线共享），这里只释放本管线独占的 VAO。
    for (const variant of this.variantCache.values()) {
      for (const vertexArray of variant.vertexArrays.values()) {
        this.gl.deleteVertexArray(vertexArray);
      }
      variant.vertexArrays.clear();
    }
    this.variantCache.clear();
  }
}

function buildVertexArrayKey(
  layouts: readonly VertexBufferLayout[],
  bindings: readonly (VertexBufferBinding | null)[],
  indexBuffer: WebGLBuffer | null,
): string {
  const parts: string[] = [];
  for (let slot = 0; slot < layouts.length; slot++) {
    const binding = bindings[slot];
    const layout = layouts[slot];
    if (!binding || !layout) {
      parts.push(`${slot}:-`);
      continue;
    }
    assertNonNegativeInteger(binding.offset, 'setVertexBuffer 的 offset');
    parts.push(`${slot}:${binding.buffer.id}:${binding.offset}:${binding.size}:${layout.arrayStride}:${layout.stepMode ?? 'vertex'}`);
  }
  // 索引缓冲也是 VAO 状态的一部分，必须进键，否则换索引缓冲会复用错误的 VAO。
  parts.push(`idx:${indexBuffer ? indexBufferId(indexBuffer) : '-'}`);
  return parts.join('|');
}

/** 给 GL 索引缓冲对象分配一个稳定 id（用 WeakMap 避免在对象上加属性）。 */
const indexBufferIds = new WeakMap<WebGLBuffer, number>();
let nextIndexBufferId = 1;
function indexBufferId(buffer: WebGLBuffer): number {
  let id = indexBufferIds.get(buffer);
  if (id === undefined) {
    id = nextIndexBufferId++;
    indexBufferIds.set(buffer, id);
  }
  return id;
}
