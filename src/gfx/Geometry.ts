/**
 * 几何体：把「按属性名给出的顶点数据」变成可以直接绘制的 core buffer 集合。
 *
 * ## 为什么按属性拆成多个 buffer（de-interleaved）
 *
 * 交织存储看起来更省显存，但要求「材质需要的属性集合」与「几何体实际打包的布局」完全一致，
 * 否则步长就不同，管线得为每个几何体重建一次。便捷层选择**按属性分开存**：
 * 每个属性一个 buffer，步长就是它自己格式的字节数。
 * 于是顶点布局只由**材质**决定（见 `Material.vertexBufferLayouts()`），
 * 一个材质对应一条管线，几何体多带几个用不到的属性也完全无影响。
 *
 * 交织存储留作后续优化：等有了「按属性集合缓存布局」的机制再加。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { smallestIndexFormat, type IndexFormat } from '../core/enums/IndexFormat.js';
import { vertexFormatInfo, type VertexFormat } from '../core/enums/VertexFormat.js';
import type { VertexStepMode } from '../core/enums/VertexStepMode.js';
import type { PrimitiveTopology } from '../core/enums/PrimitiveTopology.js';
import type { Buffer } from '../core/resources/Buffer.js';
import type { Device } from '../core/Device.js';

/** 顶点缓冲需要的 usage 位（Vertex | CopyDst）。 */
const VERTEX_USAGE = 0x0020 | 0x0008;
/** 索引缓冲需要的 usage 位（Index | CopyDst）。 */
const INDEX_USAGE = 0x0010 | 0x0008;

/** 已知属性名的默认格式。自定义属性必须显式给 `format`。 */
export const STANDARD_ATTRIBUTE_FORMATS: Readonly<Record<string, VertexFormat>> = Object.freeze({
  position: 'float32x3',
  normal: 'float32x3',
  uv: 'float32x2',
  uv1: 'float32x2',
  color: 'float32x4',
  tangent: 'float32x4',
  joints: 'uint16x4',
  weights: 'float32x4',
});

/** 单个属性的输入。 */
export interface GeometryAttributeInput {
  data: ArrayBufferView;
  /** 省略时按属性名推断（见 {@link STANDARD_ATTRIBUTE_FORMATS}）。 */
  format?: VertexFormat;
  /** 每个实例步进一次（GPU instancing）。 */
  perInstance?: boolean;
}

export interface GeometryDesc {
  /** 常用属性的简写。 */
  position?: Float32Array;
  normal?: Float32Array;
  uv?: Float32Array;
  uv1?: Float32Array;
  color?: Float32Array;
  tangent?: Float32Array;
  /** 其它属性，或需要自定义格式的属性。 */
  attributes?: Record<string, ArrayBufferView | GeometryAttributeInput>;
  indices?: Uint16Array | Uint32Array | readonly number[];
  topology?: PrimitiveTopology;
  /** 显式指定顶点数；省略时按属性数据长度推断。 */
  vertexCount?: number;
  label?: string;
}

export interface GeometryAttribute {
  readonly name: string;
  readonly format: VertexFormat;
  /** 单个元素的字节数。 */
  readonly byteStride: number;
  readonly components: number;
  readonly perInstance: boolean;
  readonly buffer: Buffer;
}

/** 一份可以绘制的几何体。 */
export class Geometry {
  readonly label: string;
  readonly topology: PrimitiveTopology;
  readonly attributes: ReadonlyMap<string, GeometryAttribute>;
  readonly attributeNames: readonly string[];
  readonly vertexCount: number;
  readonly indexBuffer: Buffer | null;
  readonly indexFormat: IndexFormat | null;
  readonly indexCount: number;
  /**
   * 按实例步进的属性能提供多少个实例（取各实例属性里最少的那个）；没有实例属性时为 `null`。
   *
   * 它和 `vertexCount` 是两回事：实例属性的元素个数可以比顶点数少（典型情况：
   * 一个盒子的 36 个顶点 + 1000 份实例数据），所以两者分开推断、也分开校验。
   */
  readonly instanceCount: number | null;

  private _disposed = false;
  /**
   * 已经校验过的「材质属性声明」集合，键是 `Material.attributes` 这个数组对象本身。
   *
   * 校验结果只取决于 (几何体, 材质声明) 这一对，而两者在创建后都不再变 —— 所以每 draw
   * 重复校验是纯浪费（40k draw 的场景下每帧几毫秒）。用数组身份当键，既拿到了
   * 「按材质缓存」的效果，又不用在渲染器里维护 WeakMap。
   */
  private readonly validatedAgainst = new WeakSet<readonly object[]>();

  private constructor(init: {
    label: string;
    topology: PrimitiveTopology;
    attributes: Map<string, GeometryAttribute>;
    vertexCount: number;
    instanceCount: number | null;
    indexBuffer: Buffer | null;
    indexFormat: IndexFormat | null;
    indexCount: number;
  }) {
    this.label = init.label;
    this.topology = init.topology;
    this.attributes = init.attributes;
    this.attributeNames = [...init.attributes.keys()];
    this.vertexCount = init.vertexCount;
    this.instanceCount = init.instanceCount;
    this.indexBuffer = init.indexBuffer;
    this.indexFormat = init.indexFormat;
    this.indexCount = init.indexCount;
  }

  /** 上传几何体数据到 GPU。 */
  static create(device: Device, desc: GeometryDesc): Geometry {
    const label = desc.label ?? 'geometry';
    const inputs = new Map<string, GeometryAttributeInput>();

    const shorthand: [string, Float32Array | undefined][] = [
      ['position', desc.position],
      ['normal', desc.normal],
      ['uv', desc.uv],
      ['uv1', desc.uv1],
      ['color', desc.color],
      ['tangent', desc.tangent],
    ];
    for (const [name, data] of shorthand) {
      if (data) inputs.set(name, { data });
    }
    for (const [name, value] of Object.entries(desc.attributes ?? {})) {
      inputs.set(name, ArrayBuffer.isView(value) ? { data: value } : (value as GeometryAttributeInput));
    }
    if (inputs.size === 0) {
      throw new ValidationError(`[gpu-device-api] 几何体「${label}」至少要有一个顶点属性。`);
    }

    /* ---- 顶点数与实例数 --------------------------------------------------------------------- */
    // 只有「按顶点步进」的属性参与顶点数推断；实例属性的元素个数是实例数，两者数量本来就可以不同。
    let vertexCount = desc.vertexCount ?? 0;
    let instanceCount: number | null = null;
    for (const [name, input] of inputs) {
      const format = input.format ?? inferFormat(name, input.data);
      const count = Math.floor(input.data.byteLength / vertexFormatInfo(format).byteSize);
      if (input.perInstance) {
        instanceCount = instanceCount === null ? count : Math.min(instanceCount, count);
      } else if (count > vertexCount) {
        vertexCount = count;
      }
    }
    if (vertexCount <= 0) {
      throw new ValidationError(
        `[gpu-device-api] 几何体「${label}」无法推断顶点数：至少要有一个按顶点步进的属性（实例属性只描述实例，` +
          '不决定顶点数），并检查属性数据是否为空。',
      );
    }

    /* ---- 上传属性 -------------------------------------------------------------------------- */
    const attributes = new Map<string, GeometryAttribute>();
    for (const [name, input] of inputs) {
      const format = input.format ?? inferFormat(name, input.data);
      const info = vertexFormatInfo(format);
      if (input.data.byteLength % info.byteSize !== 0) {
        throw new ValidationError(
          `[gpu-device-api] 几何体「${label}」的属性「${name}」数据长度 ${input.data.byteLength} 字节` +
            `不是其格式 ${format}（${info.byteSize} 字节）的整数倍。`,
        );
      }
      // 按顶点步进的属性必须覆盖全部顶点；实例属性只需要覆盖它自己的实例数（上面已单独推断）。
      const expected = vertexCount * info.byteSize;
      if (!input.perInstance && input.data.byteLength < expected) {
        throw new ValidationError(
          `[gpu-device-api] 几何体「${label}」的属性「${name}」只有 ${input.data.byteLength} 字节，` +
            `但按顶点数 ${vertexCount} 需要 ${expected} 字节。所有属性必须提供同样多的顶点` +
            '（只有 `perInstance: true` 的实例属性可以少于顶点数）。',
        );
      }

      const buffer = device.createBuffer({
        label: `${label}:${name}`,
        // WebGPU 要求 buffer 大小是 4 的倍数，这里统一对齐。
        size: alignTo(input.data.byteLength, 4),
        usage: VERTEX_USAGE,
      });
      device.queue.writeBuffer(buffer, 0, input.data);
      attributes.set(name, {
        name,
        format,
        byteStride: info.byteSize,
        components: info.components,
        perInstance: input.perInstance ?? false,
        buffer,
      });
    }

    /* ---- 索引 ------------------------------------------------------------------------------ */
    let indexBuffer: Buffer | null = null;
    let indexFormat: IndexFormat | null = null;
    let indexCount = 0;
    if (desc.indices && desc.indices.length > 0) {
      const view = normalizeIndices(desc.indices, vertexCount, label);
      indexFormat = view instanceof Uint32Array ? 'uint32' : 'uint16';
      indexCount = view.length;
      indexBuffer = device.createBuffer({
        label: `${label}:indices`,
        size: alignTo(view.byteLength, 4),
        usage: INDEX_USAGE,
      });
      device.queue.writeBuffer(indexBuffer, 0, view);
    }

    return new Geometry({
      label,
      topology: desc.topology ?? 'triangle-list',
      attributes,
      vertexCount,
      instanceCount,
      indexBuffer,
      indexFormat,
      indexCount,
    });
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 实际的绘制顶点/索引数。 */
  get drawCount(): number {
    return this.indexBuffer ? this.indexCount : this.vertexCount;
  }

  /**
   * 检查几何体是否提供了材质需要的所有属性，格式与步进模式是否匹配。
   *
   * `stepMode` 必须与数据上传时的 `perInstance` 一致：步进模式对不上时，
   * 顶点缓冲会按错误的节奏被读取（画出来是乱码而不是报错），所以这里直接拦下。
   */
  validateAgainst(
    required: readonly { name: string; format: VertexFormat; stepMode?: VertexStepMode }[],
    materialName: string,
  ): void {
    // 同一份材质声明 + 同一个几何体只需要校验一次（材质销毁后身份回收，不会泄漏）。
    if (this.validatedAgainst.has(required)) return;
    for (const attribute of required) {
      const provided = this.attributes.get(attribute.name);
      if (!provided) {
        throw new ValidationError(
          `[gpu-device-api] 几何体「${this.label}」缺少材质「${materialName}」需要的属性「${attribute.name}」。\n` +
            `几何体现有属性：${this.attributeNames.join('、')}。`,
        );
      }
      if (provided.format !== attribute.format) {
        throw new ValidationError(
          `[gpu-device-api] 几何体「${this.label}」的属性「${attribute.name}」格式是 ${provided.format}，` +
            `但材质「${materialName}」要求 ${attribute.format}。`,
        );
      }
      const wantsPerInstance = (attribute.stepMode ?? 'vertex') === 'instance';
      if (provided.perInstance !== wantsPerInstance) {
        throw new ValidationError(
          `[gpu-device-api] 几何体「${this.label}」的属性「${attribute.name}」是` +
            `${provided.perInstance ? '按实例' : '按顶点'}步进的，但材质「${materialName}」把它声明成了 ` +
            `${wantsPerInstance ? "'instance'" : "'vertex'"} 步进。\n` +
            '两边必须一致：实例化属性要在 Geometry 里写成 `{ data, format, perInstance: true }`，' +
            "并在材质的 attributes 里写成 `{ format, stepMode: 'instance' }`。",
        );
      }
    }
    this.validatedAgainst.add(required);
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const attribute of this.attributes.values()) attribute.buffer.destroy();
    this.indexBuffer?.destroy();
  }
}

function inferFormat(name: string, data: ArrayBufferView): VertexFormat {
  const standard = STANDARD_ATTRIBUTE_FORMATS[name];
  if (standard && data instanceof Float32Array) return standard;
  if (data instanceof Float32Array) {
    if (name === 'position' || name === 'normal') return 'float32x3';
    return 'float32';
  }
  if (data instanceof Uint32Array) return 'uint32';
  if (data instanceof Int32Array) return 'sint32';
  // uint8 / uint16 没有单分量格式（只有 x2 / x4），组件数无法从数据推断，必须显式指定。
  throw new ValidationError(
    `[gpu-device-api] 无法从 ${data.constructor.name} 推断属性「${name}」的顶点格式：` +
      '`uint8` / `uint16` / `sint8` / `sint16` 只有 x2、x4 两种写法，无法从字节数反推分量个数。\n' +
      '请显式写明分量，例如 `{ data, format: \'unorm8x4\' }` 或 `format: \'uint16x2\'`。',
  );
}

function normalizeIndices(
  indices: Uint16Array | Uint32Array | readonly number[],
  vertexCount: number,
  label: string,
): Uint16Array | Uint32Array {
  if (indices instanceof Uint16Array || indices instanceof Uint32Array) return indices;
  const values = indices as readonly number[];
  let max = 0;
  for (const value of values) {
    if (!Number.isInteger(value) || value < 0) {
      throw new ValidationError(`[gpu-device-api] 几何体「${label}」的索引里出现了非法值 ${value}。`);
    }
    if (value > max) max = value;
  }
  if (max >= vertexCount) {
    throw new ValidationError(
      `[gpu-device-api] 几何体「${label}」的索引最大值 ${max} 超过了顶点数 ${vertexCount}。`,
    );
  }
  const format = smallestIndexFormat(vertexCount);
  return format === 'uint32' ? Uint32Array.from(values) : Uint16Array.from(values);
}

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

/** 便捷入口。 */
export function createGeometry(device: Device, desc: GeometryDesc): Geometry {
  return Geometry.create(device, desc);
}
