import { GpuError, type GpuErrorOptions } from './GpuError.js';

/**
 * GPU 内部错误：驱动/实现自己出了问题（原生 `GPUInternalError`）。
 *
 * 与另外两类错误的分工（这也是它值得有独立类型的原因）：
 *
 * - `ValidationError`：**调用方**用错了 API（参数非法、状态不合法）—— 改代码就能修；
 * - `OutOfMemoryError`：资源不够 —— 改小一点/少一点再试；
 * - `GPUInternalError`：**既不是参数问题也不是内存问题**，是实现侧（驱动、着色器编译器、
 *   甚至是硬件）失败了。调用方唯一能做的就是换一条路径、换一个后端或换个设备重试，
 *   按「参数错了」去改代码只会越改越偏。
 *
 * 在此之前它被折成基类 `GpuError{code:'INTERNAL_ERROR'}`：类型上分辨不出来，
 * 于是跨后端写 `instanceof OutOfMemoryError` 之外的分支逻辑时，只能去比字符串 code。
 */
export class GPUInternalError extends GpuError {
  constructor(message: string, options: Omit<GpuErrorOptions, 'code'> = {}) {
    super(message, { ...options, code: 'INTERNAL_ERROR' });
    this.name = 'GPUInternalError';
  }
}
