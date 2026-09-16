/**
 * 实测消费方 C6：从真实子入口 `@dxyl/gpu-device-api/core` 导入 —— 只要 core 的枚举。
 *
 * 「完全不要后端」的极端使用方（例如自己写后端适配、或者只想拿枚举做比较）。
 * 用来量 `/core` 入口能省多少。
 */

import { BufferUsage, CompareFunction } from '@dxyl/gpu-device-api/core';

export function describe(): string {
  return `${BufferUsage.Vertex}/${CompareFunction.Less}`;
}

export function makeUsage(): number {
  return BufferUsage.Vertex | BufferUsage.Index | BufferUsage.Uniform;
}
