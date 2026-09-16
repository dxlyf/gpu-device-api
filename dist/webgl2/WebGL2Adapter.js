/**
 * WebGL2 的 adapter。
 *
 * WebGPU 里 adapter 是「探测到的硬件」，device 由它派生；WebGL2 没有这一层，
 * 但为了让上层代码形状一致，这里把「canvas 上的 GL context + 能力查询结果」打包成 adapter。
 *
 * **重要限制**：GL context 是从 canvas 上取的，一个 adapter 只能产出一个 device，
 * 且该 device 只能服务这个 canvas。需要渲染到多个 canvas 时请为每个 canvas 各建一个 device。
 */
import { ValidationError } from '../core/errors/ValidationError.js';
import { buildDeviceLimits, queryGlFeatures, queryGlRendererInfo, requireWebGL2Context } from './utils/glCapabilities.js';
import { WebGL2Device } from './WebGL2Device.js';
/** WebGL2 的默认 context 属性。 */
export const DEFAULT_WEBGL2_CONTEXT_ATTRIBUTES = {
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    desynchronized: false,
};
export class WebGL2Adapter {
    info;
    features;
    limits;
    gl;
    canvas;
    logger;
    device = null;
    constructor(gl, canvas, limits, features, logger) {
        this.gl = gl;
        this.canvas = canvas;
        this.limits = limits;
        this.features = features;
        this.logger = logger;
        const rendererInfo = queryGlRendererInfo(gl);
        this.info = {
            backend: 'webgl2',
            vendor: rendererInfo.vendor,
            architecture: '',
            device: rendererInfo.device || 'WebGL2',
            description: rendererInfo.device || 'WebGL2 设备',
            // WebGL2 无法可靠判断是否为软件光栅化：SWIFTShader 之类通常也能通过 debug 扩展报出名字，
            // 但名字并不统一，所以这里保守地一律报 false，需要时可由使用方读取 info.device 自行判断。
            isFallbackAdapter: false,
        };
    }
    /**
     * 在给定 canvas 上探测 WebGL2 并返回 adapter。
     * 拿不到 context 时抛错（而不是返回 null），错误信息里会说明常见原因。
     */
    static async request(options) {
        const attributes = { ...DEFAULT_WEBGL2_CONTEXT_ATTRIBUTES, ...options.contextAttributes };
        const gl = requireWebGL2Context(options.canvas, attributes);
        const limits = buildDeviceLimits(gl);
        const features = queryGlFeatures(gl);
        return new WebGL2Adapter(gl, options.canvas, limits, features, options.logger);
    }
    /** 已经为这个 canvas 创建过 GL context（用于避免重复初始化）。 */
    get context() {
        return this.gl;
    }
    async requestDevice(descriptor = {}) {
        if (this.device && !this.device.disposed) {
            throw new ValidationError('[gpu-device-api] 这个 WebGL2 adapter 已经创建过 device 了。\n' +
                'GL context 与 canvas 是一一对应的，一个 adapter 只能产出一个 device；' +
                '请复用已有的 device，或为另一个 canvas 单独 requestAdapter()。');
        }
        const device = new WebGL2Device({
            gl: this.gl,
            canvas: this.canvas,
            descriptor,
            adapterLimits: this.limits,
            adapterFeatures: this.features,
            logger: this.logger,
        });
        this.device = device;
        return device;
    }
    /** 该 adapter 已经创建出的 device（未创建时为 `null`）。 */
    get currentDevice() {
        return this.device;
    }
}
//# sourceMappingURL=WebGL2Adapter.js.map