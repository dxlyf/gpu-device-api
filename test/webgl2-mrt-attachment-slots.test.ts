/**
 * 批 05 · `#11`：`colorAttachments` 里的 `null` 空位导致附件下标错位（WebGL2 内部自相矛盾）。
 *
 * ## 缺陷（改前实测）
 *
 * 同一个「原始附件」渲染通道里有**三处**各自使用下标，而它们改前并不一致：
 *
 * | 处 | 改前的下标 | 语义 |
 * | --- | --- | --- |
 * | `framebuffer-cache.ts` 挂附件 | **压缩后**的序号（`COLOR_ATTACHMENT0 + 非空计数`） | `view` 被挂到 attachment 0 |
 * | `framebuffer-cache.ts` 的 `drawBuffers` | 压缩后的连续列表 `[0, 1, ...]` | 无论空位在哪，位置都是 0 起 |
 * | `WebGL2RenderPassEncoder.clearRawAttachments` 清屏 | **原始数组下标** | 空位也占一个位置 |
 *
 * `colorAttachments: [null, view]` 于是变成：
 * - FBO 把 `view` 挂在 attachment **0**；
 * - 清屏去清 attachment **1**（没有附件，`clearBufferfv` 报 `INVALID_VALUE` / 空操作）；
 * - `drawBuffers` 是 `[COLOR_ATTACHMENT0]`，所以片元的 output **location 0** 写进 `view`。
 *
 * 而 WebGPU 的语义是「**数组下标就是 location**」：location 0 = 空位（丢弃输出）、
 * location 1 = `view`。两者完全不同，且改前**没有任何报错**。
 *
 * ## 选定语义：保持 WebGPU 的形状（下标即 location）
 *
 * core 层的定位是「显式镜像 WebGPU 形状」，`null` 在 WebGPU 的
 * `GPURenderPassDescriptor.colorAttachments` 里本来就是一个**有位置意义**的槽位
 * （该 location 的片元输出被丢弃）。所以修的是 WebGL2 的三个下标，而不是把 `null` 压缩掉：
 * 附件挂到 `COLOR_ATTACHMENT0 + 原始下标`，`drawBuffers[i]` 按位置给出
 * `COLOR_ATTACHMENT0 + i`（空位给 `NONE`），清屏用原始下标。
 *
 * ## 本文件断言的是「清屏位置」与「draw 落点」两件事
 *
 * GL 的定义就是：片元的 output `location = i` 写进 `drawBuffers[i]` 指向的附着点
 * （`NONE` 表示丢弃）。所以「`drawBuffers` 是逐位置给出的」**就是**「draw 落点正确」，
 * 断言不必去跑真实的 GPU 就能钉住这条映射；真实渲染验证见文件末尾的说明
 *（`.tmp-05/mrt-probe.html` 的两附件清屏 + draw + 读回，两后端逐像素比对）。
 */

import { describe, expect, it } from 'vitest';

import { WebGL2Device } from '../src/webgl2/WebGL2Device.js';
import { buildDeviceLimits } from '../src/webgl2/utils/glCapabilities.js';
import { GlStateCache } from '../src/webgl2/utils/glStateCache.js';
import { FramebufferCache } from '../src/webgl2/render/framebuffer-cache.js';
import { WebGL2RenderPassEncoder } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import { TextureUsage } from '../src/core/enums/TextureUsage.js';
import type { WebGL2RenderPassOptions } from '../src/webgl2/render/WebGL2RenderPassEncoder.js';
import type { WebGL2RenderTarget } from '../src/webgl2/render/WebGL2RenderTarget.js';
import type { WebGL2TextureView } from '../src/webgl2/resources/WebGL2TextureView.js';
import type { RenderPassDescriptor } from '../src/core/render/RenderPassEncoder.js';
import type { FakeWebGL2 } from './webgl2-fake-gl.js';
import { GL, createFakeCanvas, createFakeWebGL2 } from './webgl2-fake-gl.js';

function createDevice(fake: FakeWebGL2): WebGL2Device {
  return new WebGL2Device({
    gl: fake.gl,
    canvas: createFakeCanvas().canvas,
    descriptor: { label: 'mrt-slots-test' },
    adapterLimits: buildDeviceLimits(fake.gl),
    adapterFeatures: new Set<string>(),
  });
}

function createOptions(fake: FakeWebGL2, state: GlStateCache): WebGL2RenderPassOptions {
  return {
    gl: fake.gl,
    state,
    framebuffers: new FramebufferCache(fake.gl),
    getDefaultSize: () => ({ width: 8, height: 8 }),
  };
}

/** 一次通道建立期间「下标相关的三处」到底下发了什么。 */
interface SlotProbe {
  /** 挂到 FBO 上的颜色附着点（按发生顺序，只含颜色附件）。 */
  attachments: number[];
  /** 每一次 `drawBuffers` 的参数。 */
  drawBuffers: number[][];
  /** `clearBufferfv(COLOR, i, ...)` 的 `i`（清屏清到哪个附着点）。 */
  colorClearIndices: number[];
}

/**
 * 采集一次通道建立期间的记录。
 *
 * `clearBufferfv` 的 `buffer` 参数在假 GL 的枚举表里没有 `COLOR` / `DEPTH`
 * （真实 WebGL2 是 0x1800 / 0x1801），所以这里**包装**该方法的调用而不是去解析枚举；
 * 形状与 `webgl2-opt-2b.test.ts` 的 `captureClearValues` 一致。
 */
function setupProbe(fake: FakeWebGL2): SlotProbe {
  const probe: SlotProbe = { attachments: [], drawBuffers: [], colorClearIndices: [] };
  const target = fake.gl as unknown as {
    clearBufferfv: (buffer: number, drawbuffer: number, values: Float32Array) => void;
  };
  const original = target.clearBufferfv.bind(fake.gl);
  // `COLOR`（0x1800）只有清颜色时才出现；深度清屏用的是 `DEPTH`（0x1801）。
  target.clearBufferfv = (buffer: number, drawbuffer: number, values: Float32Array) => {
    if (buffer === GL_COLOR) probe.colorClearIndices.push(drawbuffer);
    original(buffer, drawbuffer, values);
  };
  return probe;
}

/**
 * 真实 WebGL2 上 `gl.COLOR` / `gl.DEPTH` 的枚举值（`WebGLRenderingContextBase` 的常量）。
 *
 * 假 GL 的枚举表里没有这两个（见 `webgl2-fake-gl.ts` 的 `GL`），所以这里显式补上：
 * 否则 `gl.COLOR` 是 `undefined`，`clearRawAttachments` 下发的清屏调用就无从与深度清屏区分。
 */
const GL_COLOR = 0x1800;
const GL_DEPTH = 0x1801;

/** 采集结束后，把这一次通道建立产生的调用翻译成 {@link SlotProbe}。 */
function collect(fake: FakeWebGL2, probe: SlotProbe): SlotProbe {
  probe.attachments = [];
  probe.drawBuffers = [];
  for (const call of fake.calls) {
    if (call.startsWith('framebufferTexture2D:')) {
      const [, , attachment] = call.split(':');
      probe.attachments.push(Number(attachment));
    } else if (call.startsWith('drawBuffers:')) {
      const list = call.slice('drawBuffers:'.length);
      probe.drawBuffers.push(list.split('|').map(Number));
    }
  }
  return probe;
}

/** `location` 处的片元输出实际写进哪个附着点（`NONE` 表示丢弃）。 */
function landingAttachment(probe: SlotProbe, location: number): number {
  const last = probe.drawBuffers[probe.drawBuffers.length - 1] ?? [];
  return last[location] ?? GL.NONE;
}

/**
 * 三处下标必须互相一致：
 * 1. 被清屏的每个下标 `i`，`drawBuffers[i]` 必须是 `COLOR_ATTACHMENT0 + i`；
 * 2. 该附着点必须真的挂在 FBO 上（否则清屏落在空气上，GL 会报 `INVALID_VALUE`）；
 * 3. `drawBuffers` 的长度必须等于原始附件数组长度（空位也占位置）。
 */
function assertThreeWayConsistent(probe: SlotProbe, slotCount: number, clearedIndices: number[]): void {
  const last = probe.drawBuffers[probe.drawBuffers.length - 1] ?? [];
  expect(last).toHaveLength(slotCount);
  expect(probe.colorClearIndices).toEqual(clearedIndices);
  for (const index of probe.colorClearIndices) {
    expect(last[index]).toBe(GL.COLOR_ATTACHMENT0 + index);
    expect(probe.attachments).toContain(GL.COLOR_ATTACHMENT0 + index);
  }
}

function colorView(device: WebGL2Device, label: string): WebGL2TextureView {
  return device.createTexture({
    label,
    format: 'rgba8unorm',
    size: { width: 8, height: 8 },
    usage: TextureUsage.RenderAttachment | TextureUsage.CopySrc,
  }).createView() as WebGL2TextureView;
}

/** 构造一次通道；返回这一期间的下标探针。 */
function createSetup(): {
  device: WebGL2Device;
  fake: FakeWebGL2;
  options: WebGL2RenderPassOptions;
} {
  const fake = createFakeWebGL2();
  // 补齐真实上下文有、假 GL 的枚举表里没有的两个常量（见 GL_COLOR / GL_DEPTH）。
  Object.assign(fake.gl as unknown as Record<string, number>, { COLOR: GL_COLOR, DEPTH: GL_DEPTH });
  const device = createDevice(fake);
  const state = new GlStateCache(fake.gl);
  return { device, fake, options: createOptions(fake, state) };
}

/** 一次 `runPass` 的结果：下标探针 + 这一次通道建立产生的全部调用。 */
interface PassRun {
  probe: SlotProbe;
  calls: string[];
}

function runPass(descriptor: RenderPassDescriptor, setup: {
  device: WebGL2Device;
  fake: FakeWebGL2;
  options: WebGL2RenderPassOptions;
}): PassRun {
  setup.fake.calls.length = 0;
  const probe = setupProbe(setup.fake);
  const pass = new WebGL2RenderPassEncoder(descriptor, setup.options);
  collect(setup.fake, probe);
  pass.end();
  return { probe, calls: [...setup.fake.calls] };
}

function countCalls(calls: readonly string[], prefix: string): number {
  return calls.filter((call) => call.startsWith(prefix)).length;
}

describe('#11 空位 null 的四个组合：清屏位置与 draw 落点', () => {
  it('[view]：唯一附件挂在 attachment 0，location 0 落在它上面', () => {
    const setup = createSetup();
    const { probe } = runPass(
      {
        label: 'one',
        colorAttachments: [{ view: colorView(setup.device, 'a'), clearValue: [1, 0, 0, 1] }],
      },
      setup,
    );

    expect(probe.attachments).toEqual([GL.COLOR_ATTACHMENT0]);
    expect(probe.drawBuffers[probe.drawBuffers.length - 1]).toEqual([GL.COLOR_ATTACHMENT0]);
    expect(landingAttachment(probe, 0)).toBe(GL.COLOR_ATTACHMENT0);
    assertThreeWayConsistent(probe, 1, [0]);
    setup.device.dispose();
  });

  it('[null, view]：view 挂在 attachment 1，清屏清 1，location 1 落在它上面', () => {
    const setup = createSetup();
    const { probe } = runPass(
      {
        label: 'hole-first',
        colorAttachments: [null, { view: colorView(setup.device, 'b'), clearValue: [0, 0, 1, 1] }],
      },
      setup,
    );

    // 改前：`attachments` 是 [COLOR_ATTACHMENT0]（被压缩到 0），而清屏去清 1 ——
    // 附件挂载与清屏下标指向两个不同的附着点。
    expect(probe.attachments).toEqual([GL.COLOR_ATTACHMENT0 + 1]);
    expect(probe.drawBuffers[probe.drawBuffers.length - 1]).toEqual([GL.NONE, GL.COLOR_ATTACHMENT0 + 1]);
    // draw 落点：location 0 是空位（丢弃），location 1 写进 view 所在的附着点。
    expect(landingAttachment(probe, 0)).toBe(GL.NONE);
    expect(landingAttachment(probe, 1)).toBe(GL.COLOR_ATTACHMENT0 + 1);
    assertThreeWayConsistent(probe, 2, [1]);
    setup.device.dispose();
  });

  it('[view, null]：空的尾槽不产生附件，但 drawBuffers 仍然占位', () => {
    const setup = createSetup();
    const { probe } = runPass(
      {
        label: 'hole-last',
        colorAttachments: [{ view: colorView(setup.device, 'c'), clearValue: [0, 1, 0, 1] }, null],
      },
      setup,
    );

    expect(probe.attachments).toEqual([GL.COLOR_ATTACHMENT0]);
    // 改前这里是 [COLOR_ATTACHMENT0]（长度 1）：尾部的空位被整个丢掉，
    // 一旦后面还有附件，所有位置就整体前移一位。
    expect(probe.drawBuffers[probe.drawBuffers.length - 1]).toEqual([GL.COLOR_ATTACHMENT0, GL.NONE]);
    expect(landingAttachment(probe, 0)).toBe(GL.COLOR_ATTACHMENT0);
    expect(landingAttachment(probe, 1)).toBe(GL.NONE);
    assertThreeWayConsistent(probe, 2, [0]);
    setup.device.dispose();
  });

  it('[null, null, view]：两个空位、view 在 attachment 2', () => {
    const setup = createSetup();
    const { probe } = runPass(
      {
        label: 'two-holes',
        colorAttachments: [null, null, { view: colorView(setup.device, 'd'), clearValue: [1, 1, 0, 1] }],
      },
      setup,
    );

    expect(probe.attachments).toEqual([GL.COLOR_ATTACHMENT0 + 2]);
    expect(probe.drawBuffers[probe.drawBuffers.length - 1]).toEqual([
      GL.NONE,
      GL.NONE,
      GL.COLOR_ATTACHMENT0 + 2,
    ]);
    expect(landingAttachment(probe, 2)).toBe(GL.COLOR_ATTACHMENT0 + 2);
    assertThreeWayConsistent(probe, 3, [2]);
    setup.device.dispose();
  });

  it('[viewA, null, viewC]：中间空位不能让第三个附件前移', () => {
    const setup = createSetup();
    const { probe } = runPass(
      {
        label: 'middle-hole',
        colorAttachments: [
          { view: colorView(setup.device, 'e0'), clearValue: [1, 0, 0, 1] },
          null,
          { view: colorView(setup.device, 'e2'), clearValue: [0, 0, 1, 1] },
        ],
      },
      setup,
    );

    expect(probe.attachments).toEqual([GL.COLOR_ATTACHMENT0, GL.COLOR_ATTACHMENT0 + 2]);
    expect(probe.drawBuffers[probe.drawBuffers.length - 1]).toEqual([
      GL.COLOR_ATTACHMENT0,
      GL.NONE,
      GL.COLOR_ATTACHMENT0 + 2,
    ]);
    // 中间空位处**不清屏**：那个 location 没有输出，清它是多余的。
    assertThreeWayConsistent(probe, 3, [0, 2]);
    setup.device.dispose();
  });

  it('深度清屏始终针对 DEPTH 附着点的 0 号（空位不影响它）', () => {
    const setup = createSetup();
    const depth = setup.device.createTexture({
      label: 'depth',
      format: 'depth24plus',
      size: { width: 8, height: 8 },
      usage: TextureUsage.RenderAttachment,
    });
    const { probe } = runPass(
      {
        label: 'with-depth',
        colorAttachments: [null, { view: colorView(setup.device, 'f'), clearValue: [0, 0, 0, 1] }],
        depthStencilAttachment: { view: depth.createView() as WebGL2TextureView, depthClearValue: 0.25 },
      },
      setup,
    );

    expect(probe.colorClearIndices).toEqual([1]);
    expect(setup.fake.calls.some((call) => call.startsWith(`clearBufferfv:${GL_DEPTH}:0`))).toBe(true);
    setup.device.dispose();
  });
});

describe('#11 多重采样目标：只能整组、按原顺序使用（空位会被静默忽略，因此明确报错）', () => {
  /** 一个 2 颜色附件的多重采样目标（draw FBO 的 drawBuffers 固定为 [0, 1]）。 */
  function createMsaaTarget(setup: ReturnType<typeof createSetup>): WebGL2RenderTarget {
    return setup.device.createRenderTarget({
      label: 'msaa',
      width: 8,
      height: 8,
      color: ['rgba8unorm', 'rgba8unorm'],
      sampleCount: 4,
    }) as unknown as WebGL2RenderTarget;
  }

  it('整组、按原顺序（createPassDescriptor 的形状）继续放行', () => {
    const setup = createSetup();
    const target = createMsaaTarget(setup);
    const built = target.createPassDescriptor({ clearValue: [0, 0, 0, 1] });
    expect(() => new WebGL2RenderPassEncoder({
      label: 'msaa-ok',
      colorAttachments: built.colorAttachments,
      depthStencilAttachment: built.depthStencilAttachment,
    }, setup.options)).not.toThrow();
    setup.device.dispose();
  });

  it('前缀子集 [view0] 继续放行（location 0 落在目标的第 0 个附件上，映射是对的）', () => {
    const setup = createSetup();
    const target = createMsaaTarget(setup);
    expect(() => new WebGL2RenderPassEncoder({
      label: 'msaa-prefix',
      colorAttachments: [{ view: target.colorView(0), clearValue: [0, 0, 0, 1] }],
    }, setup.options)).not.toThrow();
    setup.device.dispose();
  });

  it('[null, view1] 报错：空位在这条路径里不会被忽略，draw 会按位置写进目标的第 0 个附件', () => {
    const setup = createSetup();
    const target = createMsaaTarget(setup);
    expect(() => new WebGL2RenderPassEncoder({
      label: 'msaa-hole',
      colorAttachments: [null, { view: target.colorView(1), clearValue: [0, 0, 0, 1] }],
    }, setup.options)).toThrowError(/空位无法表达/);
    setup.device.dispose();
  });

  it('[view1]（跳过了第 0 个附件）报错：location 0 会写进 attachment 0 而不是 view1', () => {
    const setup = createSetup();
    const target = createMsaaTarget(setup);
    expect(() => new WebGL2RenderPassEncoder({
      label: 'msaa-subset',
      colorAttachments: [{ view: target.colorView(1), clearValue: [0, 0, 0, 1] }],
    }, setup.options)).toThrowError(/不是多重采样目标.*的第 0 个颜色附件/);
    setup.device.dispose();
  });

  it('换序 [view1, view0] 报错（顺序就是 location 的对应关系）', () => {
    const setup = createSetup();
    const target = createMsaaTarget(setup);
    expect(() => new WebGL2RenderPassEncoder({
      label: 'msaa-swap',
      colorAttachments: [
        { view: target.colorView(1), clearValue: [0, 0, 0, 1] },
        { view: target.colorView(0), clearValue: [0, 0, 0, 1] },
      ],
    }, setup.options)).toThrowError(/第 0 个颜色附件不是多重采样目标/);
    setup.device.dispose();
  });

  it('同一组附件但目标是单采样时不受影响（走原始附件路径，空位按位置表达）', () => {
    const setup = createSetup();
    const target = setup.device.createRenderTarget({
      label: 'single',
      width: 8,
      height: 8,
      color: ['rgba8unorm', 'rgba8unorm'],
      sampleCount: 1,
    }) as unknown as WebGL2RenderTarget;
    const { probe } = runPass({
      label: 'single-hole',
      colorAttachments: [null, { view: target.colorView(1), clearValue: [0, 0, 0, 1] }],
    }, setup);

    expect(probe.attachments).toEqual([GL.COLOR_ATTACHMENT0 + 1]);
    expect(probe.colorClearIndices).toEqual([1]);
    setup.device.dispose();
  });
});

describe('#11 空位的位置是 framebuffer 缓存键的一部分（不会被复用串味）', () => {
  it('[view, null] 与 [null, view] 是两个不同的 framebuffer', () => {
    const setup = createSetup();
    const view = colorView(setup.device, 'g');
    const shared = { view, clearValue: [0, 0, 0, 1] } as const;

    // 两份布局的附件组合不同（同一张 view 分别挂在 0 与 1），绝不能共用同一个 FBO：
    // 「尾部的那一份」必须**新建**一个 FBO（若命中缓存说明键把空位的位置丢了）。
    const head = runPass({ label: 'head', colorAttachments: [shared, null] }, setup);
    expect(countCalls(head.calls, 'createFramebuffer:')).toBe(1);
    expect(head.probe.drawBuffers[head.probe.drawBuffers.length - 1]).toEqual([
      GL.COLOR_ATTACHMENT0,
      GL.NONE,
    ]);

    const tail = runPass({ label: 'tail', colorAttachments: [null, shared] }, setup);
    expect(countCalls(tail.calls, 'createFramebuffer:')).toBe(1);
    expect(tail.probe.attachments).toEqual([GL.COLOR_ATTACHMENT0 + 1]);

    // 同一份布局再来一次：命中缓存，不再新建 FBO；FBO 的 drawBuffers 是**对象自身的状态**，
    // 建立时下发过一次就一直在，所以复用时不重复下发也不会跑偏。
    const again = runPass({ label: 'tail-again', colorAttachments: [null, shared] }, setup);
    expect(countCalls(again.calls, 'createFramebuffer:')).toBe(0);
    expect(countCalls(again.calls, 'drawBuffers:')).toBe(0);
    expect(again.probe.colorClearIndices).toEqual([1]);
    setup.device.dispose();
  });
});

describe('#11 槽位数超过 MAX_DRAW_BUFFERS 时明确报错（drawBuffers 的下标即 location，空位也占一项）', () => {
  /**
   * 假 GL 的枚举表里没有 `MAX_DRAW_BUFFERS`（`getParameter` 对未知 pname 返回 0），
   * 于是 `FramebufferCache` 走的是「查询失败 → 退回 GLES 3.0 下限 4」的兜底分支 ——
   * 这里同时把「兜底值」与「超限报错」两条都钉住。
   * 真机实测该值是 8（见批 05 汇报里的浏览器探针）。
   */
  it('5 个颜色槽位（设备报告不出来 → 按下限 4）→ 报错，且不创建 framebuffer', () => {
    const setup = createSetup();
    const views = [0, 1, 2, 3, 4].map((index) => ({
      view: colorView(setup.device, `slots-${index}`),
      clearValue: [0, 0, 0, 1] as const,
    }));

    expect(() => runPass({ label: 'too-many', colorAttachments: views }, setup)).toThrowError(
      /MAX_DRAW_BUFFERS（4）/,
    );
    // 在创建任何 GL 对象之前就拦下了：不会留下一个没人引用的 framebuffer。
    expect(countCalls(setup.fake.calls, 'createFramebuffer:')).toBe(0);
    setup.device.dispose();
  });

  it('正好 4 个槽位（含一个空位）→ 放行', () => {
    const setup = createSetup();
    const { probe } = runPass(
      {
        label: 'four-slots',
        colorAttachments: [
          null,
          { view: colorView(setup.device, 's1'), clearValue: [0, 0, 0, 1] },
          null,
          { view: colorView(setup.device, 's3'), clearValue: [0, 0, 0, 1] },
        ],
      },
      setup,
    );

    expect(probe.drawBuffers[probe.drawBuffers.length - 1]).toEqual([
      GL.NONE,
      GL.COLOR_ATTACHMENT0 + 1,
      GL.NONE,
      GL.COLOR_ATTACHMENT0 + 3,
    ]);
    setup.device.dispose();
  });
});
