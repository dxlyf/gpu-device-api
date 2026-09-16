/**
 * WebGPU 的查询结果回读：`QueryResult` 在「resolve 进 buffer → 拷进可映射 buffer → mapAsync」上的实现。
 *
 * 为什么要有两次 buffer（这一点经常被写错）：
 *
 * - `resolveQuerySet()` 要求目标 buffer 声明 `QUERY_RESOLVE`；
 * - 而 WebGPU 规定 `MAP_READ` 只能与 `COPY_DST` 组合，**不能**再叠加 `QUERY_RESOLVE`。
 *
 * 所以必须先解析进一个 `QUERY_RESOLVE | COPY_SRC` 的 buffer，再 `copyBufferToBuffer` 拷到
 * `MAP_READ | COPY_DST` 的 buffer 上才能 `mapAsync`。这不是多余的一步，而是规范要求的。
 *
 * `read()` 只能调用一次：读取后两个中转 buffer 会被销毁（`mapAsync` 的映射本身也只会给一次）。
 */
import { ValidationError } from '../../core/errors/ValidationError.js';
export class WebGPUQueryResult {
    type;
    count;
    timestampPeriod;
    staging;
    readback;
    _read = false;
    constructor(init) {
        this.type = init.type;
        this.count = init.count;
        this.timestampPeriod = init.timestampPeriod;
        this.staging = init.staging;
        this.readback = init.readback;
    }
    /**
     * 等 GPU 把结果写进读回 buffer，然后返回原始值。
     *
     * `mapAsync` 的 promise 在 GPU 侧写完时 resolve，**不会阻塞 CPU**（这正是 `Device.readQuerySet()`
     * 可以放进帧循环的原因）。
     */
    async read() {
        if (this._read) {
            throw new ValidationError('[gpu-device-api] QueryResult.read(): the result has already been read. WebGPU maps the readback ' +
                'buffer exactly once, so call Device.readQuerySet() again to get a fresh result.');
        }
        this._read = true;
        try {
            // mapAsync 返回的是映射范围的 ArrayBuffer（见 WebGPUBuffer.mapAsync）。
            const range = await this.readback.mapAsync('read');
            // 复制一份再交给 BigUint64Array：映射内存在 unmap() 之后不再有效。
            // 偏移量一定是 8 的倍数（中转 buffer 从 0 开始、长度是 count * 8），所以对齐安全。
            const values = new BigUint64Array(range.slice(0));
            this.readback.unmap();
            return values;
        }
        finally {
            // 读是一次性的：无论成功还是失败都释放中转资源（destroy 会通知设备 untrack）。
            this.readback.destroy();
            this.staging.destroy();
        }
    }
}
//# sourceMappingURL=WebGPUQueryResult.js.map