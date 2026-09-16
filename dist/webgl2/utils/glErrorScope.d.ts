/**
 * `#20` WebGL2 侧的错误作用域实现，以及 GL 错误码到本库错误类型的**启发式**映射。
 *
 * ## GL 与 WebGPU 的错误模型差异（这是本文件存在的全部原因）
 *
 * | | WebGPU | WebGL2 |
 * | --- | --- | --- |
 * | 有没有作用域 | 有（原生 `pushErrorScope` / `popErrorScope`） | **没有**，任何形式都没有 |
 * | 错误是怎么来的 | 原生任务源异步派发，归属精确 | `gl.getError()` 逐条读出**一个状态位** |
 * | 错误分类 | 原生标签（validation / out-of-memory / internal） | 只有 GL 错误码，**分不出这三类** |
 * | 归属 | 入栈时的那一层，精确 | 「这段时间内出现过错误」，无法归属到具体调用 |
 * | 时间 | 真的异步 | 同步查询（`getError` 还会打断驱动的批处理） |
 *
 * 所以这里的等价物只能做到「**把一段代码期间出现的 GL 错误记账**」，做不到原生那三件事。
 * 本文件把「做不到什么」写在类型和字段上（{@link WebGL2ErrorScope.filterMatched}），
 * 而不是假装能做到 —— 那正是本库反复修过的一类「状态撒谎」。
 *
 * ## 错误码 → 类型 的映射是启发式，不是规范
 *
 * WebGL 规范把「错误码代表哪一类失败」明确留给了实现，优先级也是实现定义的。这里只做三种判断：
 *
 * - `OUT_OF_MEMORY`（0x0505）→ {@link OutOfMemoryError}：唯一一个名称与语义直接对应的码；
 * - 其余**已知**的 GL 错误码 → {@link ValidationError}：按规范它们都是「调用方用错了」；
 * - **未知**错误码 → {@link GPUInternalError}：不认识的东西不能当成「你的参数错了」，
 *   否则调用方会去改一段本来没问题的代码。
 *
 * `filter` 在 WebGL2 上因此**不代表分类**，只表示「这条错误留在哪一层作用域」，
 * 见 {@link WebGL2ErrorScope}。
 */
import { GpuError } from '../../core/errors/GpuError.js';
import type { ErrorScopeFilter, ErrorScopeHandle } from '../../core/errors/ErrorScope.js';
/** WebGL2 规范里 `getError()` 可能返回的错误码（0 是 `NO_ERROR`）。 */
export declare const GL_ERROR_CODES: {
    readonly NO_ERROR: 0;
    readonly INVALID_ENUM: 1280;
    readonly INVALID_VALUE: 1281;
    readonly INVALID_OPERATION: 1282;
    readonly INVALID_FRAMEBUFFER_OPERATION: 1286;
    readonly OUT_OF_MEMORY: 1285;
    readonly CONTEXT_LOST_WEBGL: 37442;
};
/**
 * 错误码的十六进制写法（`0x502`），供错误消息与 `details` 使用。
 *
 * 用 `0x` 前缀而不是十进制：调用方查 GL 文档、对照驱动日志时看到的都是十六进制。
 */
export declare function formatGlErrorCode(code: number): string;
/**
 * 把本库错误**反推**成它最可能对应的原生 filter 名字（供外层作用域判断能否接收）。
 *
 * 注意方向：GL 侧没有「错误带 filter 标签」这回事，所以这是从错误类型反推出来的启发式结果。
 * `OutOfMemoryError` / `GPUInternalError` 是构造时就定下来的类型，所以这两类可靠；
 * 其余一律当 `'validation'`。
 */
export declare function classifyGlError(error: GpuError): ErrorScopeFilter;
/**
 * 按 GL 错误码构造本库错误。
 *
 * 消息格式与既有的 `WebGL2Device.checkGlError()` 保持同一种风格（同样的 `0x` 十六进制写法、
 * 同样在 `details` 里记 `glError`），这样「debug 轮询报出来的错误」与「作用域里拿到的错误」
 * 在日志里长得一样，不会出现两套风格。
 *
 * 但有一处**刻意不同**：`context` 是**观测到**这个错误的动作（例如 `popErrorScope`），
 * 不是**产生**它的调用 —— GL 无法回答后者，这里也不假装能回答（消息里不写「发生在 X 之后」）。
 */
export declare function createGlError(code: number, context: string): GpuError;
/**
 * WebGL2 的错误作用域句柄。
 *
 * ## 语义能做到什么程度（做不到的也列在这里）
 *
 * 做到：
 * - 记录「从 push 到 pop 之间 `gl.getError()` 读到的每一条错误」，并按 **filter 是否匹配**
 *   决定它留在这一层还是**穿透**给外层（穿透是原生语义，本层照做）；
 * - 无错误时 `pop()` 返回 `null`；
 * - 一条都没被 `pop` 取走的错误**不会被吞掉**（走 `onError` 通道，与 WebGPU 的
 *   `uncapturederror` 同义）；
 * - 未配对的 push / pop 明确报错。
 *
 * **做不到**（这三条由 GL 的错误模型决定，不是实现取舍）：
 * 1. **无法分类**：GL 错误码分不出 validation / out-of-memory / internal。所以 `filter`
 *    在 WebGL2 上**不改变**错误是什么类型，只改变它留在哪一层
 *    （{@link WebGL2ErrorScope.filterMatched} 因此可能是 false 而 `pop()` 仍然有值）；
 * 2. **无法归属**：GL 的错误可能来自**上一次**无关调用，作用域只能回答「这段时间内出现过
 *    某类错误」，不能回答「就是那一行」；
 * 3. **只有一次机会**：GL 的错误队列只保留一条（同一次调用产生的多个错误会互相覆盖），
 *    所以「作用域内到底发生过几个错误」本身就无法从 GL 问出来。本层读到几条就记几条，
 *    {@link WebGL2ErrorScope.errors} 的长度是**下界**而不是精确值。
 *
 * ## 异步性
 *
 * `pop()` 同步排空 GL 队列，然后把结果包成一个**已经落定**的 promise。这不是「故意做成异步」，
 * 而是为了让两个后端的调用点写法一致（`await device.popErrorScope()`）。WebGL2 上没有
 * 「任务源」可等，调用点**不应该**假设 `await` 期间新产生的错误会归到这一层。
 */
export declare class WebGL2ErrorScope implements ErrorScopeHandle {
    readonly filter: ErrorScopeFilter;
    readonly label: string;
    private readonly errorsSeen;
    private readonly settle;
    private activeValue;
    private matched;
    /**
     * 设备在它还没被 `pop` 的时候就被 `dispose()` 了。
     *
     * 此时 `pop()` **不能**返回 `null`：那等于说「这个作用域里没有错误」，而我们其实已经
     * 读不到 GL 错误队列了（设备已销毁）—— 这正是本库明令禁止的「状态撒谎」。
     * 所以单独记一个状态，让 `pop()` 如实拒绝（本批自测抓到的：早期实现返回 `null`）。
     */
    private abandoned;
    constructor(filter: ErrorScopeFilter, label: string, settle: (scope: WebGL2ErrorScope) => GpuError | null);
    get active(): boolean;
    /**
     * `filter` 是否**真的**命中了 `pop()` 返回的那条错误。
     *
     * GL 不区分那三类错误，所以这里只能回答「本层的 filter 是否等于那条错误的启发式分类」。
     * 为 false 时**不代表**「这条不是设备错误」——它一定是一条真实错误，只是没法把它归到
     * 调用方给的那一类里去。`pop()` 之前恒为 false。
     */
    get filterMatched(): boolean;
    /**
     * 本作用域内读到的**全部**错误（按读取顺序）。
     *
     * 长度大于 1 说明排空 GL 队列时一次拿到了多条（驱动会合并 / 覆盖，本层读到多少记多少）。
     * 其中最多一条会被 `pop()` 返回，其余走 `onError` —— 没有一条被静默丢弃。
     */
    get errors(): readonly GpuError[];
    pop(): Promise<GpuError | null>;
    /** 记录一条本作用域期间读到的错误（由宿主设备在排空时调用）。 */
    record(error: GpuError): void;
    /** 宿主设备算出「这条错误留在本层」后把命中与否写回来。 */
    markFilterMatched(matched: boolean): void;
    /**
     * 设备销毁时，对**被遗弃的**（还没 `pop` 的）作用域调用。
     *
     * 与 {@link WebGL2ErrorScope.close} 刻意分开：`close()` 表示「正常出栈了」，
     * 而这里表示「设备没了，这个作用域永远不会被落定」。两者对 `pop()` 的答复完全不同
     * （一个说「已经 pop 过」、一个说「设备已销毁、无法落定」），混成一个状态就会给出
     * 误导性的消息 —— 本批自测就是这么抓到早期实现的 `pop()` 会静默 resolve 成 `null` 的。
     */
    abandon(): void;
    /** 正常出栈后调用；幂等。 */
    close(): void;
}
//# sourceMappingURL=glErrorScope.d.ts.map