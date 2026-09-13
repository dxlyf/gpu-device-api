/**
 * WebGL2 的 compute pipeline：**不支持**，创建时立即报错。
 *
 * 计算着色器需要 GLES 3.1，而 WebGL2 对应的是 GLES 3.0。这里不做「静默降级成空操作」，
 * 因为那样只会让使用者在别处看到莫名其妙的结果。
 *
 * 需要计算能力时应当：
 * 1. 使用 WebGPU 后端（本库会自动优先选择它）；或
 * 2. 用「渲染到浮点纹理」的方式在 WebGL2 上模拟 —— 也就是拿一个全屏三角形当 kernel，
 *    输入输出都放纹理里（我们后面便捷层里的 GPGPU 示例会这么写）。
 */
import type { ComputePipeline, ComputePipelineDescriptor } from '../../core/pipeline/ComputePipeline.js';
export declare class WebGL2ComputePipeline implements ComputePipeline {
    readonly label: string;
    readonly descriptor: ComputePipelineDescriptor;
    readonly layout: "auto";
    constructor(descriptor: ComputePipelineDescriptor);
    get native(): never;
    get disposed(): boolean;
    resolve(): never;
    dispose(): void;
}
//# sourceMappingURL=WebGL2ComputePipeline.d.ts.map