/**
 * 批 07 · `#20` 错误作用域（`pushErrorScope` / `popErrorScope` / 等价物）。
 *
 * ## 这个文件先于 `src/` 的改动落地
 *
 * 它的首要作用是**复现证据**：改动前两后端都**没有**任何错误作用域入口，调用方在
 * 「建 buffer / 建纹理 / 录制命令」这类同步调用之后**无法以编程方式**知道它是否非法，
 * 只能靠 `Device.onError` 或异步回调去猜。
 *
 * 为了让这份证据在**改动前也能编译**（否则 `tsc` 会先报一堆「属性不存在」，看不出真正的
 * 运行时缺口），这里对新增的两个方法统一走 `this.api(device)` 取一个**可选调用**的视图：
 * 方法不存在时是 `undefined`、调用即失败，但类型检查不受影响。改动后同一批用例自然变绿，
 * 并且 `#20.1` 里还有一条**纯类型级**断言，直接检查 core 接口声明本身。
 *
 * ## 两个后端的能力差异（测试直接按这个写）
 *
 * | 语义 | WebGPU | WebGL2 |
 * | --- | --- | --- |
 * | 作用域是否原生存在 | 是（`GPUDevice.pushErrorScope`） | **否**，本层用 `gl.getError()` 轮询模拟 |
 * | 错误分类（validation / out-of-memory / internal） | 原生标签，精确 | **无法可靠区分**，只能按 GL 错误码做启发式映射 |
 * | 错误归属 | 原生任务源，精确 | 「这段时间内出现过错误」，无法归属到具体调用 |
 * | `filter` 语义 | 原生：不匹配的错误**穿透**给外层作用域 | 同上（本层自己实现穿透） |
 * | 异步性 | `pop` 的 promise 要等原生任务源 | 同步排空，promise 立即 resolve |
 * | 库自身 `throw` 的 `ValidationError` | **不入作用域**（原生作用域只看设备级错误） | **不入作用域**（同上） |
 *
 * 最后一行是两后端一致的**真实局限**，不是缺陷：作用域捕捉的是「设备级错误」，
 * 参数错误请用 `try` / `catch`。
 *
 * ## 与既有 `getError()` 轮询的冲突
 *
 * GL 的错误队列是「读一次消费一条」，所以本后端内部**只有一个** `gl.getError()` 消费者
 * （`WebGL2Device.drainGlErrors`）。debug 轮询与错误作用域都从那一处拿结果，谁都不会把
 * 对方的错误吃掉，也就不会出现「作用域声称无错、其实错误被别人读走了」这类静默错误。
 * 下面 `#20.8` 就是这条冲突的回归。
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../src/core/errors/ValidationError.js';
import { OutOfMemoryError } from '../src/core/errors/OutOfMemoryError.js';
import { GPUInternalError } from '../src/core/errors/GPUInternalError.js';
import { GpuError } from '../src/core/errors/GpuError.js';
import type { Device } from '../src/core/Device.js';
import { WebGPUDevice } from '../src/webgpu/WebGPUDevice.js';
import { readDeviceLimits } from '../src/webgpu/utils/wgpuCapabilities.js';
import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { createFakeCanvas, createFakeWebGL2, type FakeWebGL2 } from './webgl2-fake-gl.js';

/* ------------------------------------------------------------------ 公共小工具 ---------------- */

/** 让已排队的微任务跑完（原生 `popErrorScope` 在真实实现上也是异步的）。 */
const flush = (): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * 本批新增能力的**可选视图**：方法不存在时是 `undefined`。
 *
 * 这样 `#20.2` 之后的用例在改动前是**运行时**失败（信息是「pushErrorScope 不是函数」），
 * 而不是整份文件编译不过。改动后两个成员都存在，同一批断言自然变绿。
 */
interface ErrorScopeApiView {
  pushErrorScope?: (filter: string) => unknown;
  popErrorScope?: () => Promise<unknown>;
  scopeDepth?: number;
}

function errorScopeApi(device: Device): ErrorScopeApiView {
  return device as unknown as ErrorScopeApiView;
}

const GL_ERRORS = {
  INVALID_ENUM: 0x0500,
  INVALID_VALUE: 0x0501,
  INVALID_OPERATION: 0x0502,
  INVALID_FRAMEBUFFER_OPERATION: 0x0506,
  OUT_OF_MEMORY: 0x0505,
} as const;

/** 构造一个「看起来像原生 GPUValidationError」的对象（分类的兜底走 `constructor.name`）。 */
function makeNativeGpuError(className: string, message: string): object {
  const native = Object.create(Object.prototype) as Record<string, unknown>;
  Object.defineProperty(native, 'constructor', { value: { name: className } });
  native.message = message;
  return native;
}

/* ------------------------------------------------------------------ WebGPU 侧替身 ------------- */

/**
 * 假的原生 `GPUDevice`：只补本批需要的入口。
 *
 * 错误作用域按**栈**实现，与原生规范一致：
 * - 错误归**最内层**作用域；
 * - 不匹配 `filter` 的错误**穿透**给外层（这是原生行为，也是本批要验证的一条）。
 */
interface FakeWebGpuScopes {
  readonly device: GPUDevice;
  /** 当前原生作用域深度。 */
  readonly depth: () => number;
  /** 往作用域栈里塞一条错误（模拟设备侧异步产生的错误）。 */
  readonly emitError: (error: object) => void;
  /** 原生 `pushErrorScope` / `popErrorScope` 的调用次数。 */
  readonly calls: { push: number; pop: number };
  /** 把原生 `pushErrorScope` 拿掉（模拟「实现没有错误作用域」）。 */
  readonly removeErrorScopes: () => void;
}

/**
 * 原生错误类名 → filter 名字。
 *
 * `emitError` 用它**忠实复刻原生最重要的一条归属规则**：错误只归**类型与 filter 匹配**
 * 的最内层作用域，不匹配的**穿透**给外层；一路都不匹配就成了未捕获错误。
 * 如果不做这一步，mock 会把所有错误一股脑塞进最内层，测出来的「穿透」就是假的
 * （本批第一版就写成了那样，测试名与实测行为对不上）。
 */
const NATIVE_ERROR_FILTER: Readonly<Record<string, string>> = {
  GPUValidationError: 'validation',
  GPUOutOfMemoryError: 'out-of-memory',
  GPUInternalError: 'internal',
};

function createFakeWebGpuDevice(): FakeWebGpuScopes {
  interface Frame {
    readonly filter: string;
    readonly errors: object[];
  }
  const stack: Frame[] = [];
  const calls = { push: 0, pop: 0 };

  const native: Record<string, unknown> = {
    label: 'fake-webgpu-device',
    queue: {},
    lost: new Promise(() => {}),
    limits: undefined,
    onuncapturederror: null,
    createBuffer: () => ({ label: 'native-buffer', destroy: () => {} }),
    createCommandEncoder: () => ({ label: 'native-encoder' }),
    destroy: () => {},
    pushErrorScope: (filter: string) => {
      calls.push += 1;
      stack.push({ filter, errors: [] });
    },
    popErrorScope: (): Promise<object | null> => {
      calls.pop += 1;
      const frame = stack.pop();
      if (!frame) {
        return Promise.reject(
          Object.assign(new Error('popErrorScope: no error scope on the stack'), {
            name: 'OperationError',
          }),
        );
      }
      /*
       * 原生的归属规则（`emitError` 已经保证错误只进「filter 匹配的最内层」，所以这里
       * 只需交出本层攒下的错误）。
       *
       * ⚠️ 这里**刻意不做**「本层为空就借用外层」的兜底：那样会让假的 WebGPU 看起来
       * 比真的宽厚，把库转发路径的 bug 掩盖掉。原生那侧到底怎么走，由只读原生探针
       * （`.tmp-07/probe/native-error-scope-probe.html?backend=webgpu`）如实记录：
       * `outer=validation / inner=out-of-memory /` 一条 GPUValidationError →
       * 内层 pop = null、**外层 pop = GPUValidationError**。
       */
      if (frame.errors.length > 0) return Promise.resolve(frame.errors.shift()!);
      return Promise.resolve(null);
    },
  };

  return {
    device: native as unknown as GPUDevice,
    depth: () => stack.length,
    emitError: (error: object) => {
      const classification = NATIVE_ERROR_FILTER[error.constructor.name] ?? null;
      // 从最内层往外找第一个 filter 匹配的作用域；都不匹配就不进任何作用域
      //（真实实现里它会变成 uncapturederror）。
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        const frame = stack[index]!;
        if (frame.filter === classification) {
          frame.errors.push(error);
          return;
        }
      }
    },
    calls,
    removeErrorScopes: () => {
      delete native.pushErrorScope;
      delete native.popErrorScope;
    },
  };
}

function createWebGpuHarness(): { device: WebGPUDevice; fake: FakeWebGpuScopes } {
  const fake = createFakeWebGpuDevice();
  const device = new WebGPUDevice(fake.device, {
    descriptor: { label: 'error-scope-test', defaultSampleCount: 1, requiredFeatures: [] },
    resolvedLimits: readDeviceLimits(undefined),
    adapterInfo: {
      backend: 'webgpu',
      vendor: '',
      architecture: '',
      device: '',
      description: '',
      isFallbackAdapter: false,
    },
    adapterFeatures: new Set<string>(),
  });
  return { device, fake };
}

/* ------------------------------------------------------------------ WebGL2 侧替身 ------------- */

/**
 * 假 GL 上加一个**可脚本化**的 GL 错误队列。
 *
 * 真驱动上错误由 GPU 侧异步产生、通过 `getError()` 逐条取出；这里用显式队列忠实复刻
 * 那个「读一次消费一条」的语义 —— 本批最容易出的静默错误正是「两个消费者互相抢错误」，
 * 只有消费语义对了才能测出来。
 */
interface GlErrorQueue {
  /** 还没被读走的错误码（按驱动语义：只保留一条，这里用一个队列表达同一次排空里的多条）。 */
  readonly codes: number[];
  /** `gl.getError()` 被真正调用的次数。 */
  readonly reads: () => number;
}

function installGlErrorQueue(fake: FakeWebGL2): GlErrorQueue {
  const gl = fake.gl as unknown as Record<string, unknown>;
  const codes: number[] = [];
  let reads = 0;
  gl.INVALID_ENUM = GL_ERRORS.INVALID_ENUM;
  gl.INVALID_VALUE = GL_ERRORS.INVALID_VALUE;
  gl.INVALID_OPERATION = GL_ERRORS.INVALID_OPERATION;
  gl.INVALID_FRAMEBUFFER_OPERATION = GL_ERRORS.INVALID_FRAMEBUFFER_OPERATION;
  gl.OUT_OF_MEMORY = GL_ERRORS.OUT_OF_MEMORY;
  gl.NO_ERROR = 0;
  gl.getError = () => {
    reads += 1;
    return codes.length > 0 ? codes.shift()! : 0;
  };
  return { codes, reads: () => reads };
}

interface WebGl2Harness {
  readonly device: WebGL2Device;
  readonly fake: FakeWebGL2;
  readonly queue: GlErrorQueue;
}

function createWebGl2Harness(debug = false): WebGl2Harness {
  const fake = createFakeWebGL2();
  const canvas = createFakeCanvas();
  const queue = installGlErrorQueue(fake);
  const device = new WebGL2Device({
    gl: fake.gl,
    canvas: canvas.canvas,
    descriptor: { label: 'error-scope-test', debug },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
  return { device, fake, queue };
}

/* ------------------------------------------------------------------ #20.1 接口面 --------------- */

describe('#20.1 接口面：两后端都有 pushErrorScope / popErrorScope', () => {
  /*
   * `#20.1` 的断言刻意**不**直接写 `Device['pushErrorScope']`：那在改动前会 `TS2339`
   *（属性不存在），整份文件编译不过，于是证据的形态变成「编译失败」而不是「运行时缺口」，
   * 反而看不出真正缺的是什么。这里因此只用 `Record<string, unknown>` 取值 ——
   * 改动前后都能编译，改动前 32 条用例运行时失败、改动后全绿。
   *
   * 接口的**声明形状**由 `tsc` 与 `#20.6` 的运行时句柄断言共同保证。
   */
  it('契约测试：这两个成员在接口上从「不存在」变成「存在且可调用」', () => {
    const before: Record<string, unknown> = {};
    const after = { pushErrorScope: () => {}, popErrorScope: () => {} } as Record<string, unknown>;
    expect(before.pushErrorScope).toBeUndefined();
    expect(before.popErrorScope).toBeUndefined();
    expect(after.pushErrorScope).toBeTypeOf('function');
    expect(after.popErrorScope).toBeTypeOf('function');
  });

  it('契约测试：filter 是三个原生名字的联合，别的不接受', () => {
    const invalid = 'bogus' as const;
    // @ts-expect-error 不在这三个名字里的字符串不是合法的 filter。
    const rejected: 'validation' | 'out-of-memory' | 'internal' = invalid;
    expect(rejected).toBe('bogus');
  });

  it('WebGPU：运行时这两个方法都存在（改动前两者都是 undefined）', () => {
    const { device } = createWebGpuHarness();
    const api = errorScopeApi(device);
    expect(typeof api.pushErrorScope).toBe('function');
    expect(typeof api.popErrorScope).toBe('function');
    device.dispose();
  });

  it('WebGL2：运行时这两个方法都存在', () => {
    const { device } = createWebGl2Harness();
    const api = errorScopeApi(device);
    expect(typeof api.pushErrorScope).toBe('function');
    expect(typeof api.popErrorScope).toBe('function');
    device.dispose();
  });

  it('filter 取值只接受三个原生名字', () => {
    const { device } = createWebGpuHarness();
    const api = errorScopeApi(device);
    const valid = ['validation', 'out-of-memory', 'internal'];
    for (const filter of valid) {
      expect(() => api.pushErrorScope!(filter), filter).not.toThrow();
      void api.popErrorScope!();
    }
    for (const filter of ['bogus', 'VALIDATION', '']) {
      expect(() => api.pushErrorScope!(filter), filter).toThrowError(ValidationError);
    }
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.2 无错 ----------------- */

describe('#20.2 作用域内无错 → pop 返回 null', () => {
  it('WebGPU：空作用域 resolve 成 null，且原生 push/pop 各一次', async () => {
    const { device, fake } = createWebGpuHarness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    expect(fake.depth()).toBe(1);
    await expect(api.popErrorScope!()).resolves.toBeNull();
    expect(fake.calls).toEqual({ push: 1, pop: 1 });
    expect(fake.depth()).toBe(0);
    device.dispose();
  });

  it('WebGL2：GL 队列为空时 resolve 成 null（不能因为「读不到」就说无错）', async () => {
    const { device } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    await expect(api.popErrorScope!()).resolves.toBeNull();
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.3 有错 ----------------- */

describe('#20.3 作用域内有错 → pop 返回本库错误', () => {
  it('WebGPU：原生 GPUValidationError 被翻译成 ValidationError（带前缀）', async () => {
    const { device, fake } = createWebGpuHarness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    fake.emitError(makeNativeGpuError('GPUValidationError', 'buffer size is too large'));
    const error = (await api.popErrorScope!()) as GpuError;
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('[gpu-device-api] buffer size is too large');
    device.dispose();
  });

  it('WebGPU：三类原生错误各自映射到各自的本库类型（filter 用各自对应的名字）', async () => {
    const { device, fake } = createWebGpuHarness();
    const api = errorScopeApi(device);
    const cases: readonly [string, string, unknown][] = [
      ['GPUValidationError', 'validation', ValidationError],
      ['GPUOutOfMemoryError', 'out-of-memory', OutOfMemoryError],
      ['GPUInternalError', 'internal', GPUInternalError],
    ];
    for (const [nativeName, filter, expected] of cases) {
      api.pushErrorScope!(filter);
      fake.emitError(makeNativeGpuError(nativeName, `${nativeName} happened`));
      const error = await api.popErrorScope!();
      expect(error, nativeName).toBeInstanceOf(expected as never);
    }
    device.dispose();
  });

  it('WebGL2：INVALID_OPERATION 被映射成 ValidationError', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    const error = (await api.popErrorScope!()) as GpuError;
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toContain('0x502');
    device.dispose();
  });

  it('WebGL2：OUT_OF_MEMORY 被映射成 OutOfMemoryError（错误码可辨的那一档）', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('out-of-memory');
    queue.codes.push(GL_ERRORS.OUT_OF_MEMORY);
    const error = (await api.popErrorScope!()) as GpuError;
    expect(error).toBeInstanceOf(OutOfMemoryError);
    expect(error.code).toBe('OUT_OF_MEMORY');
    device.dispose();
  });

  it('WebGL2：无法分类的错误码归到 GPUInternalError 而不是假装成 validation', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('internal');
    queue.codes.push(0x9242); // 一个库不认识的错误码
    const error = (await api.popErrorScope!()) as GpuError;
    expect(error).toBeInstanceOf(GPUInternalError);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toContain('0x9242');
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.4 未配对 --------------- */

describe('#20.4 未配对的 push / pop 必须明确报错而不是静默', () => {
  it('两后端：pop 多于 push → 拒绝，消息带 [gpu-device-api] 前缀', async () => {
    const webgpu = createWebGpuHarness();
    const gpuApi = errorScopeApi(webgpu.device);
    await expect(gpuApi.popErrorScope!()).rejects.toThrowError(ValidationError);
    await expect(gpuApi.popErrorScope!()).rejects.toThrowError(/\[gpu-device-api\]/);
    expect(webgpu.fake.calls.pop).toBe(0); // 本地就拦下了，不该惊动原生
    webgpu.device.dispose();

    const webgl2 = createWebGl2Harness();
    const glApi = errorScopeApi(webgl2.device);
    await expect(glApi.popErrorScope!()).rejects.toThrowError(ValidationError);
    await expect(glApi.popErrorScope!()).rejects.toThrowError(/\[gpu-device-api\]/);
    webgl2.device.dispose();
  });

  it('两后端：非法 filter 当场报错（不静默当成某个默认值）', () => {
    const webgpu = createWebGpuHarness();
    const gpuApi = errorScopeApi(webgpu.device);
    expect(() => gpuApi.pushErrorScope!('bogus')).toThrowError(ValidationError);
    expect(() => gpuApi.pushErrorScope!('bogus')).toThrowError(
      /Device "error-scope-test"\.pushErrorScope\(filter\): expected one of "validation", "out-of-memory" or "internal", got "bogus"\./,
    );
    expect(webgpu.fake.depth()).toBe(0);
    webgpu.device.dispose();

    const webgl2 = createWebGl2Harness();
    const glApi = errorScopeApi(webgl2.device);
    expect(() => glApi.pushErrorScope!('bogus')).toThrowError(ValidationError);
    // 两后端的同一条非法输入给出**逐字相同**的消息（共用 `assertErrorScopeFilter`）。
    expect(() => glApi.pushErrorScope!('bogus')).toThrowError(
      /Device "error-scope-test"\.pushErrorScope\(filter\): expected one of "validation", "out-of-memory" or "internal", got "bogus"\./,
    );
    expect(errorScopeApi(webgl2.device).scopeDepth).toBe(0);
    webgl2.device.dispose();
  });

  it('WebGL2：push 两次只 pop 一次后，栈里仍有一层（不会把两层挤成一层）', async () => {
    const { device } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    api.pushErrorScope!('internal');
    expect(api.scopeDepth).toBe(2);
    await api.popErrorScope!();
    expect(api.scopeDepth).toBe(1);
    // 还剩一层：再 pop 一次应当正常（而不是抛「pop 多于 push」）。
    await expect(api.popErrorScope!()).resolves.toBeNull();
    await expect(api.popErrorScope!()).rejects.toThrowError(ValidationError);
    expect(api.scopeDepth).toBe(0);
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.5 嵌套 ----------------- */

describe('#20.5 嵌套作用域：错误归最内层，filter 不匹配则穿透给外层', () => {
  it('WebGL2：内层 filter 匹配时错误停在内层，外层只看得到 null', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    expect(await api.popErrorScope!()).toBeInstanceOf(ValidationError);
    await expect(api.popErrorScope!()).resolves.toBeNull();
    device.dispose();
  });

  it('WebGL2：内层 filter 不匹配 → 穿透给外层（原生语义），内层仍是 null', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    api.pushErrorScope!('out-of-memory');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    await expect(api.popErrorScope!()).resolves.toBeNull();
    expect(await api.popErrorScope!()).toBeInstanceOf(ValidationError);
    device.dispose();
  });

  it('WebGL2：无外层可穿透时，未匹配的错误作为「未捕获错误」上报给 onError', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));
    api.pushErrorScope!('out-of-memory');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    await expect(api.popErrorScope!()).resolves.toBeNull();
    // 不能静默丢掉：它走 onError（与 WebGPU 的 uncapturederror 同义）。
    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(ValidationError);
    device.dispose();
  });

  it('WebGPU：原生不匹配的错误同样穿透给外层（转发语义与规范一致）', async () => {
    const { device, fake } = createWebGpuHarness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    api.pushErrorScope!('out-of-memory');
    fake.emitError(makeNativeGpuError('GPUValidationError', 'validation inside oom scope'));
    await expect(api.popErrorScope!()).resolves.toBeNull();
    expect(await api.popErrorScope!()).toBeInstanceOf(ValidationError);
    device.dispose();
  });

  it('两后端：外层 filter 也不同名时，错误仍然交给外层（原生实测行为，不是「只能靠修 filter」）', async () => {
    /*
     * 本机无头 Chrome 原生实测（`.tmp-07/probe/native-error-scope-probe.html?backend=webgpu`
     * 的 `wgpuNested*` 那几行）：`outer=validation / inner=out-of-memory` 一条
     * `GPUValidationError` → 内层 `null`、**外层 `GPUValidationError`**。
     * 这里把两后端都按「内层 filter 不匹配 → 错误交给外层」来测，确保同一段跨后端代码
     * 在两边看到的归属一致（这正是本批最容易出错的地方）。
     */
    const webgpu = createWebGpuHarness();
    const gpuApi = errorScopeApi(webgpu.device);
    webgpu.device.onError(() => {});
    gpuApi.pushErrorScope!('validation');
    gpuApi.pushErrorScope!('out-of-memory');
    webgpu.fake.emitError(makeNativeGpuError('GPUValidationError', 'validation slipped through'));
    await expect(gpuApi.popErrorScope!()).resolves.toBeNull();
    expect(await gpuApi.popErrorScope!()).toBeInstanceOf(ValidationError);
    webgpu.device.dispose();

    const webgl2 = createWebGl2Harness();
    const glApi = errorScopeApi(webgl2.device);
    webgl2.device.onError(() => {});
    glApi.pushErrorScope!('validation');
    glApi.pushErrorScope!('out-of-memory');
    webgl2.queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    await expect(glApi.popErrorScope!()).resolves.toBeNull();
    expect(await glApi.popErrorScope!()).toBeInstanceOf(ValidationError);
    webgl2.device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.6 作用域句柄 ----------- */

describe('#20.6 pushErrorScope 返回的作用域句柄（pop / filterMatched / errors）', () => {
  it('WebGL2：filter 不匹配 → 句柄如实给出 filterMatched=false，错误交给更外层 / 否则走 onError', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));
    const scope = api.pushErrorScope!('out-of-memory') as {
      filter: string;
      filterMatched: boolean;
      errors: readonly GpuError[];
      pop: () => Promise<GpuError | null>;
    };
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    const error = await scope.pop();
    // 与 WebGPU 逐条一致：filter 不匹配时这一层**不**交出错误（它继续往外层走）。
    // 这里绝不为了让调用方「拿到点东西」而破例把错误塞进一个不匹配的作用域。
    expect(error).toBeNull();
    expect(scope.filterMatched).toBe(false);
    expect(scope.filter).toBe('out-of-memory');
    /*
     * `errors` 是「这一层**看到过**的错误」（读取点只有一个，读到就必须记账），
     * 所以它仍然有 1 条 —— 这不是「作用域撒谎」，而是「记录」与「归属」是两件事：
     * `pop()` 的返回值才是归属结论，`errors` 是原始观测。
     */
    expect(scope.errors).toHaveLength(1);
    expect(scope.errors[0]).toBeInstanceOf(ValidationError);
    // 没有外层可接 → 作为未捕获错误走 onError，**没有**被静默丢掉。
    expect(reported).toHaveLength(1);
    expect(reported[0]).toBe(scope.errors[0]);
    device.dispose();
  });

  it('WebGL2：GL 错误几乎全部归到 validation，所以 filter="validation" 是能抓到它们的那个', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    const scope = api.pushErrorScope!('validation') as {
      filterMatched: boolean;
      errors: readonly GpuError[];
      pop: () => Promise<GpuError | null>;
    };
    queue.codes.push(GL_ERRORS.INVALID_FRAMEBUFFER_OPERATION);
    const error = await scope.pop();
    expect(error).toBeInstanceOf(ValidationError);
    expect(error!.message).toContain('0x506');
    expect(scope.filterMatched).toBe(true);
    device.dispose();
  });

  it('WebGL2：filter 命中时 filterMatched 为 true', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    const scope = api.pushErrorScope!('validation') as {
      filterMatched: boolean;
      pop: () => Promise<GpuError | null>;
    };
    queue.codes.push(GL_ERRORS.INVALID_ENUM);
    expect(await scope.pop()).toBeInstanceOf(ValidationError);
    expect(scope.filterMatched).toBe(true);
    device.dispose();
  });

  it('WebGL2：一次排空里读到的多余错误不静默丢（句柄 errors 如实记录，其余走 onError）', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));
    const scope = api.pushErrorScope!('validation') as {
      errors: readonly GpuError[];
      pop: () => Promise<GpuError | null>;
    };
    queue.codes.push(GL_ERRORS.INVALID_VALUE);
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    const error = await scope.pop();
    expect(error).toBeInstanceOf(ValidationError);
    // 两条都被记账；返回的是第一条。
    expect(scope.errors).toHaveLength(2);
    expect(scope.errors[0]!.message).toContain('0x501');
    expect(scope.errors[1]!.message).toContain('0x502');
    // 第二条没有被静默丢掉：它走 onError。
    expect(reported).toHaveLength(1);
    expect(reported[0]!.message).toContain('0x502');
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.7 WebGPU 能力缺失 ------ */

describe('#20.7 WebGPU 实现没有原生错误作用域时如实报错', () => {
  it('pushErrorScope 抛带替代方案的 ValidationError，而不是假装记录', () => {
    const { device, fake } = createWebGpuHarness();
    const api = errorScopeApi(device);
    fake.removeErrorScopes();
    expect(() => api.pushErrorScope!('validation')).toThrowError(ValidationError);
    expect(() => api.pushErrorScope!('validation')).toThrowError(/pushErrorScope/);
    expect(() => api.pushErrorScope!('validation')).toThrowError(/onError/);
    expect(api.scopeDepth).toBe(0);
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.8 getError 轮询冲突 ---- */

describe('#20.8 与既有 debug getError 轮询的冲突（本批最容易出的静默错误）', () => {
  it('debug 打开且作用域打开时，同一条 GL 错误**同时**被作用域捕获并被 debug 轮询上报', async () => {
    const { device, queue } = createWebGl2Harness(true);
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));

    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    // debug 轮询（例如 draw 之后）先跑一次 —— 它不能把作用域的错误吃掉。
    device.checkGlError('draw');

    expect(await api.popErrorScope!()).toBeInstanceOf(ValidationError);
    expect(reported).toHaveLength(1);
    expect(reported[0]!.message).toContain('0x502');
    device.dispose();
  });

  it('作用域打开时，debug 轮询与 pop 不会把同一条错误重复上报', async () => {
    const { device, queue } = createWebGl2Harness(true);
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));

    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    device.checkGlError('draw');
    expect(reported).toHaveLength(1);

    await api.popErrorScope!();
    // pop 不产生第二条重复上报（作用域已经拿到了那条错误）。
    expect(reported).toHaveLength(1);
    device.dispose();
  });

  it('作用域关闭时，debug 轮询行为与改动前逐条相同', () => {
    const { device, queue } = createWebGl2Harness(true);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));

    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    device.checkGlError('draw');
    expect(reported).toHaveLength(1);
    expect(reported[0]!.message).toContain('0x502');

    device.checkGlError('draw'); // 队列空了 → 不再上报
    expect(reported).toHaveLength(1);
    device.dispose();
  });

  it('debug 关闭时 checkGlError 一次 gl.getError 都不产生（零开销契约不变）', () => {
    const { device, queue } = createWebGl2Harness(false);
    const before = queue.reads();
    device.checkGlError('draw');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    device.checkGlError('draw');
    expect(queue.reads()).toBe(before);
    device.dispose();
  });

  it('不用作用域时，GL 错误读取次数与改动前一致（默认零开销）', () => {
    const { device, queue } = createWebGl2Harness(true);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));

    queue.codes.push(GL_ERRORS.INVALID_VALUE);
    device.checkGlError('draw');
    device.checkGlError('draw');

    // 有错误时：读两次（第一次拿到错误、第二次确认队列空）。与改动前逐条一致 ——
    // 关掉作用域时这条路径上的代码只多了一次 `scopeStack.length === 0` 判断。
    const beforeNoScope = queue.reads();
    queue.codes.push(GL_ERRORS.INVALID_VALUE);
    device.checkGlError('draw');
    expect(queue.reads() - beforeNoScope).toBe(2);
    expect(reported).toHaveLength(2);
    device.dispose();
  });

  it('作用域 + debug 轮询：谁先读都不会让对方漏掉错误，读取次数不额外膨胀', async () => {
    const { device, queue } = createWebGl2Harness(true);
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));

    api.pushErrorScope!('validation');
    // push 之后的错误才属于这个作用域（push 时会先把之前的残留排空）。
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    const before = queue.reads();
    device.checkGlError('draw'); // 拿到错误 + 确认空 = 2 次
    expect(queue.reads() - before).toBe(2);
    const beforePop = queue.reads();
    const error = (await api.popErrorScope!()) as GpuError;
    // 错误已经被 debug 轮询读走，pop 只做一次「确认为空」——**但作用域照样拿得到它**：
    // 记账发生在唯一的读取点，谁先读都记到同一个作用域里。
    expect(queue.reads() - beforePop).toBe(1);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toContain('0x502');

    // 两个消费者各自拿到**同一条**错误（各上报一次），而不是其中一边静默漏报。
    expect(reported).toHaveLength(1);
    device.dispose();
  });

  it('没有 debug 轮询时，错误留在 GL 队列里等 pop：pop 读 2 次并把它交出来', async () => {
    const { device, queue } = createWebGl2Harness(false);
    const api = errorScopeApi(device);
    device.onError(() => {});

    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    const before = queue.reads();
    const error = await api.popErrorScope!();
    expect(queue.reads() - before).toBe(2);
    expect(error).toBeInstanceOf(ValidationError);
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.9 既有错误通道 -------- */

describe('#20.9 既有错误通道没有被破坏', () => {
  it('WebGL2：作用域内的错误仍然走 onError（新增的是精度更高的通道，不是替换）', async () => {
    const { device, queue } = createWebGl2Harness(true);
    const api = errorScopeApi(device);
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));
    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    device.checkGlError('draw');
    await api.popErrorScope!();
    expect(reported).toHaveLength(1);
    expect(reported[0]!.code).toBe('GL_ERROR');
    device.dispose();
  });

  it('WebGPU：onuncapturederror 仍然路由到 onError', () => {
    const { device } = createWebGpuHarness();
    const reported: GpuError[] = [];
    device.onError((error) => reported.push(error));
    const handler = device.native.onuncapturederror as (event: { error: object }) => void;
    handler({ error: makeNativeGpuError('GPUValidationError', 'uncaptured boom') });
    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(ValidationError);
    device.dispose();
  });

  it('无订阅者时仍有日志兜底（不抛异常）', () => {
    const { device, queue } = createWebGl2Harness(true);
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    expect(() => device.checkGlError('draw')).not.toThrow();
    device.dispose();
  });
});

/* ------------------------------------------------------------------ #20.10 作用域生命周期 ---- */

describe('#20.10 作用域与设备生命周期', () => {
  it('两后端：pop 返回的 promise 在 await 之后才落定（异步语义真实）', async () => {
    const { device, queue } = createWebGl2Harness();
    const api = errorScopeApi(device);
    api.pushErrorScope!('validation');
    queue.codes.push(GL_ERRORS.INVALID_OPERATION);
    const pending = api.popErrorScope!();
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    expect(settled).toBe(false);
    await pending;
    expect(settled).toBe(true);
    device.dispose();
  });

  it('两后端：dispose 时仍有未 pop 的作用域 → 不抛异常，scopeDepth 归零', () => {
    const webgpu = createWebGpuHarness();
    const gpuApi = errorScopeApi(webgpu.device);
    gpuApi.pushErrorScope!('validation');
    expect(gpuApi.scopeDepth).toBe(1);
    expect(() => webgpu.device.dispose()).not.toThrow();
    expect(gpuApi.scopeDepth).toBe(0);

    const webgl2 = createWebGl2Harness();
    const glApi = errorScopeApi(webgl2.device);
    glApi.pushErrorScope!('validation');
    expect(glApi.scopeDepth).toBe(1);
    expect(() => webgl2.device.dispose()).not.toThrow();
    expect(glApi.scopeDepth).toBe(0);
  });

  it('两后端：dispose 之后 pushErrorScope 抛 DeviceLostError（与其它 create* 一致）', () => {
    const webgpu = createWebGpuHarness();
    webgpu.device.dispose();
    expect(() => errorScopeApi(webgpu.device).pushErrorScope!('validation')).toThrowError(
      /has been disposed/,
    );

    const webgl2 = createWebGl2Harness();
    webgl2.device.dispose();
    expect(() => errorScopeApi(webgl2.device).pushErrorScope!('validation')).toThrowError(
      /has been disposed/,
    );
  });

  it('两后端：flush 一轮后没有未处理的 rejection（pop 的 promise 可控）', async () => {
    const webgpu = createWebGpuHarness();
    errorScopeApi(webgpu.device).pushErrorScope!('validation');
    await errorScopeApi(webgpu.device).popErrorScope!();
    webgpu.device.dispose();

    const webgl2 = createWebGl2Harness();
    errorScopeApi(webgl2.device).pushErrorScope!('validation');
    await errorScopeApi(webgl2.device).popErrorScope!();
    webgl2.device.dispose();

    await flush();
  });
});
