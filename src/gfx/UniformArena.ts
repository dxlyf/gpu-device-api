/**
 * uniform 环形竞技场（uniform arena）。
 *
 * ## 为什么必须要有它
 *
 * 最自然的写法是「改一次 uniform → draw → 再改 → 再 draw」，复用同一个 uniform buffer。
 * 但这在 WebGPU 上是**错的**：`queue.writeBuffer` 在 `submit()` 时统一生效，
 * 所以一帧里对同一段内存的多次写入，最后只有最后一次生效 —— 前面所有 draw 都会读到最后一个物体的矩阵。
 * （WebGL2 是立即模式，同一个写法是对的。差异详见 `core/sync/Queue.ts` 的时序契约说明。）
 *
 * 解决办法是给每次 draw 分配**互不重叠**的一段内存，并用**动态偏移**绑定：
 * 这样无论写入何时落地，每个 draw 读到的都是自己那一段，两个后端的行为完全一致。
 *
 * ## 实现要点
 *
 * - 每段长度按 `minUniformBufferOffsetAlignment`（WebGPU/WebGL2 通常都是 256）对齐；
 * - 一帧内**不绕回**已经用过的区间，容量不够就直接扩容（绕回会让同一帧里的两次 draw 撞车）；
 * - 扩容时把本帧已经写过的内容重放到新 buffer 上，因此扩容对调用方完全透明；
 * - 每帧开始时把游标归零，所以容量只需覆盖「单帧最多同时使用的 uniform 总量」。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import { createPipelineCache, type PipelineCache } from '../core/pipeline/PipelineCache.js';
import type { BindGroup } from '../core/binding/BindGroup.js';
import type { BindGroupLayout } from '../core/binding/BindGroupLayout.js';
import type { Buffer } from '../core/resources/Buffer.js';
import type { Device } from '../core/Device.js';
import type { UniformLayout, UniformValues } from './Uniforms.js';

/** uniform buffer 需要的 usage 位（Uniform | CopyDst）。 */
const UNIFORM_USAGE = 0x0040 | 0x0008;

export interface UniformArenaOptions {
  /** 初始容量（字节）。默认 64 KiB，约合 256 次 draw。 */
  initialCapacity?: number;
  /** 容量上限（字节）；超过就抛错而不是无限增长。默认 16 MiB。 */
  maxCapacity?: number;
  label?: string;
}

interface ArenaWrite {
  offset: number;
  data: Uint8Array;
}

export class UniformArena {
  readonly layout: UniformLayout;
  readonly label: string;

  private readonly device: Device;
  private readonly align: number;
  private readonly slotSize: number;
  private readonly maxCapacity: number;

  private bufferValue: Buffer;
  private capacityValue: number;
  private head = 0;
  private bindGroupValue: BindGroup | null = null;
  private bindGroupLayoutValue: BindGroupLayout | null = null;
  private readonly frameWrites: ArenaWrite[] = [];
  private _disposed = false;

  constructor(device: Device, layout: UniformLayout, options: UniformArenaOptions = {}) {
    this.device = device;
    this.layout = layout;
    this.label = options.label ?? `uniformArena:${layout.structName}`;
    this.align = Math.max(1, device.limits.minUniformBufferOffsetAlignment);
    this.slotSize = alignTo(Math.max(layout.byteLength, 16), this.align);
    this.maxCapacity = options.maxCapacity ?? 16 * 1024 * 1024;
    this.capacityValue = Math.max(options.initialCapacity ?? 64 * 1024, this.slotSize);
    this.bufferValue = this.createBuffer(this.capacityValue);
  }

  get buffer(): Buffer {
    return this.bufferValue;
  }

  get capacity(): number {
    return this.capacityValue;
  }

  /** 每段占用的字节数（已按对齐值取整）。 */
  get stride(): number {
    return this.slotSize;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  /** 每帧开始前调用：把游标归零。 */
  beginFrame(): void {
    this.head = 0;
    this.frameWrites.length = 0;
  }

  /**
   * 分配一段并写入数据，返回供 `setBindGroup(..., [offset])` 使用的动态偏移。
   * 必须在 {@link UniformArena.beginFrame} 之后调用。
   */
  write(values: UniformValues): number {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] uniform arena「${this.label}」已释放。`);
    }
    if (values.layout !== this.layout) {
      throw new ValidationError(
        `[gpu-device-api] uniform arena「${this.label}」的布局是「${this.layout.structName}」，` +
          `但收到的数值容器布局是「${values.layout.structName}」。两者必须由同一份描述创建。`,
      );
    }

    const offset = this.allocate();
    const data = values.bytes;
    this.device.queue.writeBuffer(this.bufferValue, offset, data);
    this.frameWrites.push({ offset, data });
    return offset;
  }

  /** 直接写入一段原始字节（高级用法：手写打包数据时）。 */
  writeBytes(bytes: Uint8Array): number {
    const offset = this.allocate();
    this.device.queue.writeBuffer(this.bufferValue, offset, bytes);
    this.frameWrites.push({ offset, data: bytes });
    return offset;
  }

  /**
   * 取得动态偏移用的 bind group。arena 扩容后会失效并按需重建。
   *
   * @param layout 材质创建的 bind group layout（必须与 arena 的布局一致）
   */
  bindGroup(layout: BindGroupLayout): BindGroup {
    if (this._disposed) {
      throw new ValidationError(`[gpu-device-api] uniform arena「${this.label}」已释放。`);
    }
    if (this.bindGroupValue && this.bindGroupLayoutValue === layout) return this.bindGroupValue;
    const bindGroup = this.device.createBindGroup({
      label: `${this.label}:bindGroup`,
      layout,
      entries: [
        {
          binding: this.layout.binding,
          resource: {
            buffer: this.bufferValue,
            offset: 0,
            // 动态偏移时，size 必须是单块的字节数，而不是整个 buffer。
            size: this.layout.byteLength,
          },
        },
      ],
    });
    this.bindGroupValue = bindGroup;
    this.bindGroupLayoutValue = layout;
    return bindGroup;
  }

  destroy(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.bindGroupValue?.dispose();
    this.bindGroupValue = null;
    this.bufferValue.destroy();
  }

  private allocate(): number {
    if (this.head + this.slotSize > this.capacityValue) this.grow();
    const offset = this.head;
    this.head += this.slotSize;
    return offset;
  }

  /**
   * 扩容并把本帧已写入的内容重放到新 buffer 上。
   * 这样做而不是「绕回旧区间」：绕回会让同一帧内前后两次 draw 读到彼此的数据，
   * 正是本模块要消除的问题。
   */
  private grow(): void {
    const needed = this.head + this.slotSize;
    const next = Math.min(
      Math.max(this.capacityValue * 2, needed),
      this.maxCapacity,
    );
    if (next < needed) {
      throw new ValidationError(
        `[gpu-device-api] uniform arena「${this.label}」本帧需要的容量超过了上限 ` +
          `${(this.maxCapacity / 1024 / 1024).toFixed(0)} MiB（需要 ${needed} 字节）。\n` +
          '请改用「每个物体一套 UniformValues + 多个 bind group」，或减少同帧的 draw 数量。',
      );
    }

    const previousWrites = [...this.frameWrites];
    this.bufferValue.destroy();
    this.bindGroupValue?.dispose();
    this.bindGroupValue = null;
    this.bindGroupLayoutValue = null;
    this.capacityValue = next;
    this.bufferValue = this.createBuffer(next);

    // 重放已经写过的段，保证扩容对调用方透明。
    for (const entry of previousWrites) {
      this.device.queue.writeBuffer(this.bufferValue, entry.offset, entry.data);
    }
  }

  private createBuffer(size: number): Buffer {
    return this.device.createBuffer({
      label: `${this.label}:${size}`,
      size: alignTo(size, 4),
      usage: UNIFORM_USAGE,
    });
  }
}

/**
 * 按布局缓存 arena：同一个材质的多次绘制共用一个 arena，
 * 不同材质各有自己的 arena（因为布局不同，段长也不同）。
 */
export class UniformArenaPool {
  private readonly device: Device;
  private readonly arenas = new Map<string, UniformArena>();
  private readonly options: UniformArenaOptions;

  constructor(device: Device, options: UniformArenaOptions = {}) {
    this.device = device;
    this.options = options;
  }

  /** 取得（或创建）某个布局的 arena。 */
  acquire(layout: UniformLayout): UniformArena {
    let arena = this.arenas.get(layout.key);
    if (!arena) {
      arena = new UniformArena(this.device, layout, this.options);
      this.arenas.set(layout.key, arena);
    }
    return arena;
  }

  beginFrame(): void {
    for (const arena of this.arenas.values()) arena.beginFrame();
  }

  get size(): number {
    return this.arenas.size;
  }

  destroy(): void {
    for (const arena of this.arenas.values()) arena.destroy();
    this.arenas.clear();
  }
}

/** 管线/程序缓存的复用出口，便于上层按需缓存「材质 × 几何体」的组合。 */
export type { PipelineCache };
export { createPipelineCache };

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}
