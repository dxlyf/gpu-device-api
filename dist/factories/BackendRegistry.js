/**
 * 后端注册表：把「有哪些后端」与「怎么探测/创建它们」解耦。
 *
 * 内置注册了 `webgpu` 与 `webgl2`。要让 `createDevice({ backend: 'auto' })` 也认得自定义后端
 * （例如将来基于 WebGL1 + 扩展的实现），只需 `registry.register(factory)` 即可，
 * 不必改动 `detectBackend` / `createDevice` 的逻辑。
 */
export class BackendRegistry {
    factories = new Map();
    register(factory) {
        this.factories.set(factory.kind, factory);
        return this;
    }
    unregister(kind) {
        return this.factories.delete(kind);
    }
    get(kind) {
        return this.factories.get(kind);
    }
    has(kind) {
        return this.factories.has(kind);
    }
    /** 已注册的后端，按注册顺序。 */
    kinds() {
        return [...this.factories.keys()];
    }
    /** 按给定优先级逐个探测，返回第一个可用的后端。 */
    async firstAvailable(order, options) {
        for (const kind of order) {
            const factory = this.factories.get(kind);
            if (!factory)
                continue;
            const availability = await factory.isAvailable(options);
            if (availability.ok)
                return { factory, availability };
        }
        return null;
    }
    /** 逐个探测并记录每个后端的结果，用于生成「为什么回退了」的解释。 */
    async probeAll(order, options) {
        const results = [];
        for (const kind of order) {
            const factory = this.factories.get(kind);
            if (!factory) {
                results.push({ backend: kind, ok: false, reason: '该后端未注册。' });
                continue;
            }
            const availability = await factory.isAvailable(options);
            results.push({ backend: kind, ok: availability.ok, reason: availability.reason });
        }
        return results;
    }
}
//# sourceMappingURL=BackendRegistry.js.map