/**
 * WebGL2 的**异步管线预热**入口。
 *
 * WebGL2 的编译 + 链接发生在 `device.createRenderPipeline()` 里面（`ProgramCache.acquire()`），
 * 而那个路径是同步的：`gl.getProgramParameter(program, LINK_STATUS)` 会阻塞到链接完成。
 * 所以「让管线在后台编译好」这件事在 WebGL2 上必须**发生在创建管线之前** —— 这正是本函数做的事：
 *
 * 1. 按与 `WebGL2Device.createRenderPipeline()` **完全相同**的方式算出 vertex / fragment 的
 *    最终源码（同一个 `compileShaderStage` 调用，同一个 label）；
 * 2. 交给 `ProgramCache.compileAsync()`：有 `KHR_parallel_shader_compile` 时用
 *    `COMPLETION_STATUS_KHR` **非阻塞**轮询，每次轮询之间让出一轮事件循环；
 * 3. 链接结果写进与 `acquire()` 相同的缓存键，所以随后 `device.createRenderPipeline()`
 *    里的 `acquire()` **直接命中，一次 GL 编译/链接调用都不发生**。
 *
 * 之后 `pipeline.prewarm()` 会汇报 `mode: 'async'`，作为「确实没有在关键路径上编译」的证据。
 *
 * 扩展 `KHR_parallel_shader_compile` 不可用时**如实降级**：函数仍然可用，但内部是同步的，
 * 返回的 `result.mode` 为 `'sync'`、`result.reason` 说明缺扩展 —— 不会假装异步。
 *
 * 失败（着色器编译错误、链接错误、超时）不会抛错：`result.ok` 为 false，
 * `result.info` 里是带**真实行号**的诊断（来自 `getShaderInfoLog()` / `getProgramInfoLog()`），
 * `result.pipeline` 为 `null`。想直接抛错请传 `{ throwOnError: true }`。
 */
import type { Device } from '../../core/Device.js';
import type { PrewarmOptions, RenderPipelinePrewarmResult } from '../../core/pipeline/CompilationInfo.js';
import type { RenderPipelineDescriptor } from '../../core/pipeline/RenderPipeline.js';
import { ProgramCache } from './ProgramCache.js';
/**
 * 从一个 `Device` 上取出 WebGL2 后端的 program 缓存。
 *
 * 这里用的是**结构化**判断（`instanceof` + 字段探测）而不是「信任调用方」：
 * 传进来一个 WebGPU 设备时应当明确报错，而不是在 `undefined.acquire()` 上炸掉。
 */
export declare function programCacheOf(device: Device): ProgramCache;
/**
 * 异步预热一条 render pipeline，返回可以直接使用的管线。
 *
 * @param device 由本库创建的 WebGL2 设备（`device.programs` 就是它的 program 缓存）
 * @param descriptor 与传给 `device.createRenderPipeline()` 的完全相同的描述
 * @param options 超时与「有错是否抛」的开关
 */
export declare function prewarmWebGL2RenderPipeline(device: Device, descriptor: RenderPipelineDescriptor, options?: PrewarmOptions): Promise<RenderPipelinePrewarmResult>;
//# sourceMappingURL=Prewarm.d.ts.map