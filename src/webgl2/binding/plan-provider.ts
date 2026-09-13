/**
 * 一个极小的接口，用来打破 `WebGL2PipelineLayout` 与 `WebGL2Device` 之间的循环依赖：
 * 布局只需要「能拿到绑定计划缓存」这一个能力，不必知道设备的存在。
 */

import type { BindingPlanCache } from './TextureUnitAllocator.js';

export interface BindingPlanProvider {
  readonly planCache: BindingPlanCache;
}
