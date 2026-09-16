/**
 * `#20` 错误作用域：调用方**以编程方式**知道「刚才那次调用非法吗」的入口。
 *
 * ## 为什么需要它
 *
 * 在此之前，`createBuffer` / `createTexture` / 命令录制这类**同步调用**是否被设备接受，
 * 调用方只能靠 `Device.onError` 或异步回调事后得知（作用域外的错误走那条通道）。
 * 而 WebGPU 原生的错误作用域本来就是为这个场景设计的：把一段调用夹在
 * push / pop 之间，`pop` 直接告诉你那段里有没有设备级错误。
 *
 * ## 两个后端的语义差异（务必读完再用）
 *
 * | 语义 | WebGPU | WebGL2 |
 * | --- | --- | --- |
 * | 作用域是否原生存在 | 是 | **否**，本层用 `gl.getError()` 轮询实现等价物 |
 * | 错误分类 | 原生标签，精确 | **无法可靠区分** validation / out-of-memory / internal |
 * | 错误归属 | 原生任务源，精确 | 「这段时间内出现过错误」，无法归属到具体调用 |
 * | `pop` 的异步性 | 真的异步（等原生任务源） | 同步排空 GL 错误队列，promise 立即 resolve |
 *
 * 因此**跨后端代码不要依赖 `filter` 做精确分类**：WebGL2 上的 `filter` 只决定
 * 「这条错误留在哪一层作用域」，不决定它是什么类型。要按类型分支时请判断返回的错误
 * 是不是 `OutOfMemoryError` 这类具体类型（WebGL2 上只有 `OUT_OF_MEMORY` 错误码能被
 * 可靠地分出来，见 {@link import('../errors/OutOfMemoryError.js').OutOfMemoryError}）。
 *
 * ## 作用域捕捉的是什么（两后端一致）
 *
 * **设备级错误**（原生校验失败、显存不足、实现内部失败），也就是 `Device.onError`
 * 那条通道上的东西。**本库自己在参数校验里 `throw` 出来的 `ValidationError` 不会进作用域**
 * —— 它在调用点就同步抛了，用 `try` / `catch` 接即可。两者是互补的，不是二选一。
 *
 * ## 嵌套与 filter 的穿透语义（照实测的原生行为写）
 *
 * 作用域是一个**栈**：
 *
 * - 错误归**最内层**作用域；
 * - 如果最内层作用域的 `filter` 与错误类型**不匹配**，错误会**继续交给外层作用域**
 *   —— 注意：**不要求外层的 filter 同名**。本机无头 Chrome 实测
 *   （`.tmp-07/probe/native-error-scope-probe.html?backend=webgpu`）：
 *   `outer=validation / inner=out-of-memory /` 一条 `GPUValidationError` →
 *   内层 `pop` = `null`、**外层 `pop` = `GPUValidationError`**；
 * - 因此一个作用域**可能**拿到与它自己 `filter` 不同类的错误，此时
 *   {@link ErrorScopeHandle.filterMatched} 为 false（本层不假装它命中了）；
 * - 一路都没有外层可接时，它作为**未捕获错误**走 `Device.onError`，绝不会被静默丢掉。
 *
 * 两后端都按这套规则实现，所以同一段跨后端代码在两边看到的作用域归属一致。
 */
import { ValidationError } from './ValidationError.js';
/** `filter` 的合法取值表（运行时校验用，顺序即文档里的分类顺序）。 */
export const ERROR_SCOPE_FILTERS = [
    'validation',
    'out-of-memory',
    'internal',
];
/**
 * 运行时校验 `filter`。**导出给两个后端共用**，避免两边各写一份、日后改一处漏一处。
 *
 * 为什么需要运行时校验：`ErrorScopeFilter` 只在 TypeScript 层面是联合类型，
 * 从 JS 或 `as any` 进来的调用不受它约束。原生的 `pushErrorScope()` 对非法 filter 会抛
 * `TypeError`；本层也必须当场报错，绝不静默当成某个默认值（那正是本库最忌讳的静默错误）。
 */
export function isErrorScopeFilter(value) {
    return value === 'validation' || value === 'out-of-memory' || value === 'internal';
}
/**
 * 校验 `filter`，非法就抛本库的 `ValidationError`。**两个后端共用**，保证同一份非法输入
 * 在 WebGPU / WebGL2 上得到**同一条**错误。
 *
 * 原生的 `pushErrorScope()` 对非法 filter 抛 `TypeError`；这里抛的是同一错误层级里的参数
 * 错误类，但**同样是当场报错**，绝不静默取默认值。`context` 由调用方给出，用来指明是哪个
 * 后端的哪次调用（例如 `Device "x".pushErrorScope(filter)`）。
 */
export function assertErrorScopeFilter(value, context) {
    if (isErrorScopeFilter(value))
        return;
    throw new ValidationError(`${context}: expected one of "validation", "out-of-memory" or "internal", got ${JSON.stringify(value)}.`);
}
//# sourceMappingURL=ErrorScope.js.map