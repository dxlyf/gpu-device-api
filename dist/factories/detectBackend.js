/**
 * 后端探测：优先 WebGPU，不可用时回退 WebGL2，并把「为什么回退」讲清楚。
 *
 * 为什么不只用 `'webgpu' in navigator` 判断：`navigator.gpu` 存在但
 * `requestAdapter()` 返回 null 是很常见的情况（无头模式、显卡被禁用、驱动黑名单），
 * 只看 API 是否存在会导致「以为能用 WebGPU，结果一创建设备就失败」。
 * 所以这里**真的去请求一次 adapter**。
 */
import { createDefaultBackendRegistry } from './default-registry.js';
/** 默认的尝试顺序：WebGPU 优先。 */
export const DEFAULT_BACKEND_ORDER = ['webgpu', 'webgl2'];
/** 探测并选出可用后端。 */
export async function detectBackend(options = {}) {
    const registry = options.registry ?? createDefaultBackendRegistry();
    const order = options.backend && options.backend !== 'auto'
        ? [options.backend]
        : (options.order ?? DEFAULT_BACKEND_ORDER);
    const probes = await registry.probeAll(order, options);
    const selected = probes.find((probe) => probe.ok);
    if (selected) {
        const skipped = probes.slice(0, probes.indexOf(selected)).filter((probe) => !probe.ok);
        return {
            backend: selected.backend,
            probes,
            reason: skipped.length === 0
                ? `选用 ${selected.backend}。`
                : `选用 ${selected.backend}；更优先的后端不可用：${skipped
                    .map((probe) => `${probe.backend}（${probe.reason ?? '原因未知'}）`)
                    .join('；')}。`,
        };
    }
    return {
        backend: null,
        probes,
        reason: '没有可用的渲染后端。各候选后端的探测结果：' +
            probes.map((probe) => `${probe.backend} — ${probe.reason ?? '不可用'}`).join('；') +
            '。',
    };
}
/** 只判断某个后端是否可用。 */
export async function isBackendAvailable(backend, options = {}) {
    const registry = options.registry ?? createDefaultBackendRegistry();
    const factory = registry.get(backend);
    if (!factory)
        return false;
    return (await factory.isAvailable(options)).ok;
}
//# sourceMappingURL=detectBackend.js.map