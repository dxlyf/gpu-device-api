/** GPU buffer resource. Mirrors WebGPU's `GPUBuffer`. */

import type { BufferUsage } from '../enums/BufferUsage.js';
import type { Disposable } from '../../utils/Disposable.js';

export interface BufferDescriptor {
  label?: string;
  /** Size in bytes. Must be greater than zero. */
  size: number;
  usage: BufferUsage;
}

export type MapMode = 'read' | 'write';

export interface Buffer extends Disposable {
  readonly label: string;
  readonly size: number;
  readonly usage: BufferUsage;
  /** Native handle: `GPUBuffer` on WebGPU, `WebGLBuffer` on WebGL2. */
  readonly native: unknown;

  /**
   * Maps the buffer for CPU access. Resolves with the mapped range.
   * WebGL2 emulates `write` mapping with a CPU shadow buffer that is uploaded on `unmap()`.
   */
  mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>;
  /** The currently mapped range. Throws when the buffer is not mapped. */
  getMappedRange(offset?: number, size?: number): ArrayBuffer;
  /** Flushes (write) or releases (read) the mapping. */
  unmap(): void;
  readonly mapped: boolean;

  /** Frees the underlying allocation. */
  destroy(): void;
}
