/**
 * 把 core 的接口类型收窄回 WebGL2 的具体实现类。
 *
 * 为什么需要单独一个文件：接口类型转具体类需要**向下转型**，而具体类带有私有字段，
 * 结构性比较不满足，必须写成 `as unknown as X`。把这些转换集中在这里，
 * 一是避免 `as unknown as` 散落各处，二是可以在运行时校验 ——
 * 如果有人把 WebGPU 后端的资源传给了 WebGL2 设备，这里会给出明确的错误，
 * 而不是在后面某个 GL 调用处炸出一句看不懂的 `INVALID_OPERATION`。
 */

import { ValidationError } from '../core/errors/ValidationError.js';
import type { Buffer } from '../core/resources/Buffer.js';
import type { Texture } from '../core/resources/Texture.js';
import type { TextureView } from '../core/resources/TextureView.js';
import type { Sampler } from '../core/resources/Sampler.js';
import type { BindGroup } from '../core/binding/BindGroup.js';
import type { PipelineLayout } from '../core/binding/PipelineLayout.js';
import type { RenderPipeline } from '../core/pipeline/RenderPipeline.js';
import { WebGL2Buffer } from './resources/WebGL2Buffer.js';
import { WebGL2Texture } from './resources/WebGL2Texture.js';
import { WebGL2TextureView } from './resources/WebGL2TextureView.js';
import { WebGL2Sampler } from './resources/WebGL2Sampler.js';
import { WebGL2BindGroup } from './binding/WebGL2BindGroup.js';
import { WebGL2PipelineLayout } from './binding/WebGL2PipelineLayout.js';
import { WebGL2RenderPipeline } from './pipeline/WebGL2RenderPipeline.js';

function mismatch(kind: string, value: unknown, expected: string): never {
  throw new ValidationError(
    `[gpu-device-api] 传入了不属于 WebGL2 后端的${kind}（期望 ${expected}，实际是 ${
      (value as { constructor?: { name?: string } })?.constructor?.name ?? typeof value
    }）。\n` +
      '资源不能跨后端混用：WebGPU 后端创建的资源只能交给 WebGPU 后端使用，反之亦然。',
  );
}

export function asWebGL2Buffer(value: Buffer): WebGL2Buffer {
  if (value instanceof WebGL2Buffer) return value;
  return mismatch('buffer', value, 'WebGL2Buffer');
}

export function asWebGL2Texture(value: Texture): WebGL2Texture {
  if (value instanceof WebGL2Texture) return value;
  return mismatch('texture', value, 'WebGL2Texture');
}

export function asWebGL2TextureView(value: TextureView): WebGL2TextureView {
  if (value instanceof WebGL2TextureView) return value;
  return mismatch('texture view', value, 'WebGL2TextureView');
}

export function asWebGL2Sampler(value: Sampler): WebGL2Sampler {
  if (value instanceof WebGL2Sampler) return value;
  return mismatch('sampler', value, 'WebGL2Sampler');
}

export function asWebGL2BindGroup(value: BindGroup): WebGL2BindGroup {
  if (value instanceof WebGL2BindGroup) return value;
  return mismatch('bind group', value, 'WebGL2BindGroup');
}

export function asWebGL2PipelineLayout(value: PipelineLayout): WebGL2PipelineLayout {
  if (value instanceof WebGL2PipelineLayout) return value;
  return mismatch('pipeline layout', value, 'WebGL2PipelineLayout');
}

export function asWebGL2RenderPipeline(value: RenderPipeline): WebGL2RenderPipeline {
  if (value instanceof WebGL2RenderPipeline) return value;
  return mismatch('render pipeline', value, 'WebGL2RenderPipeline');
}

/** 不做运行时不检查的宽松版本，用于「已知是回调传回来的自家对象」的场合。 */
export function unsafeAs<T>(value: unknown): T {
  return value as T;
}
