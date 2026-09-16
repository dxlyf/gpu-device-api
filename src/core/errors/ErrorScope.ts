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

import type { GpuError } from './GpuError.js';
import { ValidationError } from './ValidationError.js';

/**
 * 错误作用域的过滤器，取值与原生 `GPUErrorFilter` **完全一致**。
 *
 * - `'validation'`：调用方用错了 API（参数非法、状态不合法）—— 改代码就能修；
 * - `'out-of-memory'`：资源不够 —— 改小一点/少一点再试；
 * - `'internal'`：既不是参数问题也不是内存问题，是实现侧失败。
 *
 * 三个名字刻意保持英文原样（它们是原生接口的一部分，不是本库的新词汇）。
 */
export type ErrorScopeFilter = 'validation' | 'out-of-memory' | 'internal';

/**
 * `pushErrorScope()` 返回的句柄。
 *
 * ## 为什么返回句柄，而不是只有 `void` 加一个配对的 `popErrorScope()`
 *
 * 两个原因，都是形式所迫：
 *
 * 1. **GL 错误码无法可靠分类**，所以 WebGL2 侧必须能告诉调用方
 *    「我确实抓到了错误，但它的类型**没有**匹配你给的 `filter`」（{@link filterMatched}）。
 *    只看 `pop` 的返回值做不到这件事：返回非 null 却不匹配，和匹配是两回事。
 * 2. **一条 GL 错误只说明「队列里有过一条」**，被取走的那条之外的错误码本来会被丢弃。
 *    {@link errors} 把作用域内看到的**全部**错误如实交出来，不静默丢。
 *
 * 句柄是**一次性**的：`pop()` 之后 {@link errors} 不再增长（那只作用域已经出栈了）。
 * 直接 `await device.popErrorScope()` 仍然是最简写法，句柄只是精度更高的可选项。
 */
export interface ErrorScopeHandle {
  /** 本作用域的过滤器（构造时给出的那个）。 */
  readonly filter: ErrorScopeFilter;
  /** 本作用域新建时的 label，便于日志与调试。 */
  readonly label: string;
  /** 是否仍在栈上。`pop()` 之后为 false。 */
  readonly active: boolean;
  /**
   * `filter` 是否真的**命中**了返回的那条错误。
   *
   * - WebGPU：由原生交回来的错误类型与 `filter` 是否同类决定 —— **会是真的 false**，
   *   因为不匹配的错误会继续交给外层作用域，所以某一层完全可能收到不同类的错误
   *   （实测见 `nativeErrorMatchesFilter` 的注释）；
   * - WebGL2：由本库对 GL 错误码的**启发式映射**决定。GL 不区分 validation / out-of-memory /
   *   internal，所以这里为 false 只说明「没法把它归到你给的那一类」，**不**说明这条错误
   *   「不是设备错误」——它一定是一条真实错误。`pop()` 尚未完成时为 false。
   */
  readonly filterMatched: boolean;
  /**
   * 本作用域生命周期内观察到的**全部**错误（按时间顺序）。
   *
   * `pop()` 之前可以安全读取（只读快照的语义：它此时还在增长）。长度大于 1 是正常的：
   * GL 的错误队列只保留一条，驱动在处理一次调用时可能覆盖多次，但本层一旦读到就会记账。
   */
  readonly errors: readonly GpuError[];
  /**
   * 弹出本作用域，返回**第一条**（最内层语义下唯一会被返回的那条）错误；作用域内无错时返回 `null`。
   *
   * 与 `device.popErrorScope()` 完全等价 —— 内部走的是同一条路径，不存在「两套状态机」。
   * 弹出时，本作用域里**没有被返回**的错误（`errors` 的其余条目）会作为未捕获错误
   * 走 `Device.onError`，不会被静默吞掉。
   */
  pop(): Promise<GpuError | null>;
}

/** `filter` 的合法取值表（运行时校验用，顺序即文档里的分类顺序）。 */
export const ERROR_SCOPE_FILTERS: readonly ErrorScopeFilter[] = [
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
export function isErrorScopeFilter(value: unknown): value is ErrorScopeFilter {
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
export function assertErrorScopeFilter(
  value: unknown,
  context: string,
): asserts value is ErrorScopeFilter {
  if (isErrorScopeFilter(value)) return;
  throw new ValidationError(
    `${context}: expected one of "validation", "out-of-memory" or "internal", got ${JSON.stringify(value)}.`,
  );
}
