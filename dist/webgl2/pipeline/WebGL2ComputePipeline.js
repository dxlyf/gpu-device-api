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
import { ValidationError } from '../../core/errors/ValidationError.js';
export class WebGL2ComputePipeline {
    label;
    descriptor;
    layout = 'auto';
    constructor(descriptor) {
        this.label = descriptor.label ?? 'computePipeline';
        this.descriptor = descriptor;
        throw new ValidationError(`[gpu-device-api] WebGL2 后端不支持 compute pipeline（管线「${this.label}」）。\n` +
            '计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。可选方案：\n' +
            '  1) 切到 WebGPU 后端（createDevice({ backend: \'auto\' }) 会优先选它）；\n' +
            '  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算。');
    }
    get native() {
        throw new ValidationError('[gpu-device-api] WebGL2 没有 compute pipeline。');
    }
    get disposed() {
        return true;
    }
    resolve() {
        throw new ValidationError('[gpu-device-api] WebGL2 没有 compute pipeline。');
    }
    dispose() {
        // 构造阶段就已经抛错，这里不会被调用。
    }
}
//# sourceMappingURL=WebGL2ComputePipeline.js.map