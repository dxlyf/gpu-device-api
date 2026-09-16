/**
 * WebGPU 外部纹理：`ExternalTexture` 接口在 `GPUExternalTexture` 上的实现。
 *
 * 这一层刻意做得很薄 —— 它是一个**一帧有效**的句柄，本层能替调用方做的事只有两件：
 *
 * 1. 把原生对象登记进设备的资源集合（这样 `device.dispose()` 不会漏掉它）；
 * 2. 提供一个**每次都向原生查询**的 `expired`，让「用过期句柄」这件事在能报错的地方
 *    报出带上下文的错误。
 *
 * 刻意**不**自己计时（例如 `setTimeout` 若干毫秒后标记过期）：原生把它绑定到一个自动过期的
 * 任务源，用 JS 定时器猜那个边界一定会猜错 —— 猜早了会拦住合法用法，猜晚了就是假装校验过。
 */
import type { ExternalTexture } from '../../core/resources/ExternalTexture.js';
import type { WebGPUDevice } from '../WebGPUDevice.js';
export declare class WebGPUExternalTexture implements ExternalTexture {
    readonly label: string;
    readonly native: GPUExternalTexture;
    private readonly device;
    private _disposed;
    constructor(device: WebGPUDevice, native: GPUExternalTexture, label: string);
    /**
     * 向原生查询是否过期（原生实现暴露 `expired` 时）。
     *
     * 拿不到这个字段时返回 `false`：这个值只用于提前给出更清楚的报错，不是功能闸门 ——
     * 「不知道」不应该拦住一次本来可能成功的绑定。
     */
    get expired(): boolean;
    get disposed(): boolean;
    /**
     * 标记本包装对象失效并通知设备取消追踪。
     *
     * 原生 `GPUExternalTexture` **没有** `destroy()`：它的生命周期由原生实现按帧管理
     * （见 `core/resources/ExternalTexture.ts` 的过期语义）。所以这里只做本层的记账，
     * 不假装调用了什么原生销毁接口。
     */
    dispose(): void;
}
/**
 * 该对象是否为 WebGPU 后端的外部纹理。
 *
 * 用 `native` 上有没有 `expired` 之外的形状特征来判：原生 `GPUExternalTexture` 没有任何
 * 自有方法（`@webgpu/types` 里它只有一个品牌字段），所以这里按 `@@toStringTag` 判断。
 */
export declare function isWebGPUExternalTexture(value: unknown): value is WebGPUExternalTexture;
/** 原生 `GPUExternalTexture` 的形状识别（它没有方法可鸭子类型判断，只能靠 `@@toStringTag`）。 */
export declare function isNativeGPUExternalTexture(value: unknown): value is GPUExternalTexture;
/**
 * 把任意外部纹理表示收窄为原生 `GPUExternalTexture`。
 *
 * 接受本库的包装对象，也接受 escape hatch 直接拿到的原生对象 —— 后者是导入能力引入之前的
 * 唯一用法（`{ source: nativeExternalTexture }`），**必须继续可用**。
 */
export declare function asGPUExternalTexture(value: unknown, context: string): GPUExternalTexture;
//# sourceMappingURL=WebGPUExternalTexture.d.ts.map