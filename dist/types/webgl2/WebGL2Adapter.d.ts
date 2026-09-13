/**
 * WebGL2 的 adapter。
 *
 * WebGPU 里 adapter 是「探测到的硬件」，device 由它派生；WebGL2 没有这一层，
 * 但为了让上层代码形状一致，这里把「canvas 上的 GL context + 能力查询结果」打包成 adapter。
 *
 * **重要限制**：GL context 是从 canvas 上取的，一个 adapter 只能产出一个 device，
 * 且该 device 只能服务这个 canvas。需要渲染到多个 canvas 时请为每个 canvas 各建一个 device。
 */
import { WebGL2Device } from './WebGL2Device.js';
import type { Adapter, AdapterInfo } from '../core/Adapter.js';
import type { Device, DeviceDescriptor, DeviceLimits } from '../core/Device.js';
import type { Logger } from '../utils/logger.js';
export interface WebGL2AdapterOptions {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    /**
     * 创建 GL context 时使用的属性。
     * 默认 `{ antialias: true, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' }`。
     * 抗锯齿只能在这里开 —— WebGL2 的离屏目标不支持 MSAA，默认帧缓冲的 MSAA 完全由这些属性决定。
     */
    contextAttributes?: WebGLContextAttributes;
    logger?: Logger;
}
/** WebGL2 的默认 context 属性。 */
export declare const DEFAULT_WEBGL2_CONTEXT_ATTRIBUTES: WebGLContextAttributes;
export declare class WebGL2Adapter implements Adapter {
    readonly info: AdapterInfo;
    readonly features: ReadonlySet<string>;
    readonly limits: DeviceLimits;
    private readonly gl;
    private readonly canvas;
    private readonly logger;
    private device;
    private constructor();
    /**
     * 在给定 canvas 上探测 WebGL2 并返回 adapter。
     * 拿不到 context 时抛错（而不是返回 null），错误信息里会说明常见原因。
     */
    static request(options: WebGL2AdapterOptions): Promise<WebGL2Adapter>;
    /** 已经为这个 canvas 创建过 GL context（用于避免重复初始化）。 */
    get context(): WebGL2RenderingContext;
    requestDevice(descriptor?: DeviceDescriptor): Promise<Device>;
    /** 该 adapter 已经创建出的 device（未创建时为 `null`）。 */
    get currentDevice(): WebGL2Device | null;
}
//# sourceMappingURL=WebGL2Adapter.d.ts.map