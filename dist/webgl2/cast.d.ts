/**
 * 把 core 的接口类型收窄回 WebGL2 的具体实现类。
 *
 * 为什么需要单独一个文件：接口类型转具体类需要**向下转型**，而具体类带有私有字段，
 * 结构性比较不满足，必须写成 `as unknown as X`。把这些转换集中在这里，
 * 一是避免 `as unknown as` 散落各处，二是可以在运行时校验 ——
 * 如果有人把 WebGPU 后端的资源传给了 WebGL2 设备，这里会给出明确的错误，
 * 而不是在后面某个 GL 调用处炸出一句看不懂的 `INVALID_OPERATION`。
 */
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
export declare function asWebGL2Buffer(value: Buffer): WebGL2Buffer;
export declare function asWebGL2Texture(value: Texture): WebGL2Texture;
export declare function asWebGL2TextureView(value: TextureView): WebGL2TextureView;
export declare function asWebGL2Sampler(value: Sampler): WebGL2Sampler;
export declare function asWebGL2BindGroup(value: BindGroup): WebGL2BindGroup;
export declare function asWebGL2PipelineLayout(value: PipelineLayout): WebGL2PipelineLayout;
export declare function asWebGL2RenderPipeline(value: RenderPipeline): WebGL2RenderPipeline;
/** 不做运行时不检查的宽松版本，用于「已知是回调传回来的自家对象」的场合。 */
export declare function unsafeAs<T>(value: unknown): T;
//# sourceMappingURL=cast.d.ts.map