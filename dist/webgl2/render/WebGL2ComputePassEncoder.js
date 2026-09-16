/**
 * WebGL2 的 compute pass：**不支持**。
 *
 * 与 `WebGL2ComputePipeline` 对应 —— 计算能力需要 GLES 3.1，WebGL2 只有 GLES 3.0。
 * 在 `beginComputePass()` 调用时立即报错，并给出可执行的替代方案。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
const MESSAGE = '[gpu-device-api] WebGL2 后端不支持 compute pass。计算着色器需要 GLES 3.1，而 WebGL2 只提供 GLES 3.0。\n' +
    '可选方案：\n' +
    '  1) 切到 WebGPU 后端（createDevice({ backend: \'auto\' }) 会优先选它）；\n' +
    '  2) 在 WebGL2 上用「全屏三角形 + 浮点纹理」模拟通用计算：把数据编码进纹理，' +
    '用片元着色器当 kernel，结果渲染到另一张纹理。';
export class WebGL2ComputePassEncoder {
    label = 'computePass';
    constructor(_descriptor) {
        throw new ValidationError(MESSAGE);
    }
    get ended() {
        return true;
    }
    setPipeline(_pipeline) {
        throw new ValidationError(MESSAGE);
    }
    setBindGroup(_index, _bindGroup, _dynamicOffsets) {
        throw new ValidationError(MESSAGE);
    }
    dispatchWorkgroups(_x, _y, _z) {
        throw new ValidationError(MESSAGE);
    }
    dispatchWorkgroupsIndirect(_indirect, _offset) {
        throw new ValidationError(MESSAGE);
    }
    pushDebugGroup(_label) {
        throw new ValidationError(MESSAGE);
    }
    popDebugGroup() {
        throw new ValidationError(MESSAGE);
    }
    insertDebugMarker(_label) {
        throw new ValidationError(MESSAGE);
    }
    end() {
        // 构造阶段已经抛错，这里不会被执行。
    }
}
//# sourceMappingURL=WebGL2ComputePassEncoder.js.map