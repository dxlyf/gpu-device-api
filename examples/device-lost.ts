/**
 * device-lost 的真实浏览器验证：**真的**把设备弄丢，然后验证本库的行为。
 *
 * 单测（`test/device-lost.test.ts`）用的是 mock 原生设备 / 假 canvas 事件，只能证明逻辑分支对。
 * 这一页在真实浏览器里做同一件事：
 *
 * - **WebGL2**：用 `WEBGL_lose_context` 扩展（规范提供的、唯一能主动丢上下文的手段）
 *   真的丢一次上下文，再 `restoreContext()` 恢复。验证：能检测到丢失、后续创建/提交明确报错、
 *   恢复事件如实上报、`usable` **不会**回到 true（本层无法重建已有资源），
 *   以及「丢掉旧设备、重新建一个设备就能继续用」这条恢复流程真的可行。
 * - **WebGPU**：用 escape hatch 调 `GPUDevice.destroy()` 触发一次真实的设备丢失
 *   （WebGPU 没有其它主动丢失的办法，而这条正是浏览器关闭页面 / 设备被移除时走的路径），
 *   验证：`lostInfo.reason === 'destroyed'`、`onError` 收到通知、`queue.submit()` 抛错
 *   （而不是被静默丢弃）、以及重新创建设备后能继续用。
 *
 * 结论写进 `<html data-device-lost-*>`，并打印到 `#out`。查询参数：`?backend=webgl2|webgpu|auto`。
 */

import { createDeviceWithAdapter } from '../src/factories/index.js';
import { BufferUsage } from '../src/core/enums/BufferUsage.js';
import type { Device } from '../src/core/Device.js';
import type { WebGL2Device } from '../src/webgl2/WebGL2Device.js';

const BYTES = 256;

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 「设备真的能用」的最小闭环：写一段数据进 buffer → 拷到可映射 buffer → 读回来逐字节比对。
 *
 * 之所以不用渲染 + 读回：canvas 的 `readPixels` / `drawImage` 在合成后不可信（见
 * `scripts/analyze-screenshot.mjs` 的文件头）。buffer 的往返同样依赖一个活的 GL 上下文 /
 * GPU 设备，作为「设备还能用吗」的判据既便宜又可靠。
 */
async function bufferRoundTrip(device: Device, label: string): Promise<string> {
  const source = device.createBuffer({
    label: `${label}:src`,
    size: BYTES,
    usage: BufferUsage.CopySrc | BufferUsage.CopyDst,
  });
  const readback = device.createBuffer({
    label: `${label}:readback`,
    size: BYTES,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const input = new Uint8Array(BYTES);
  for (let index = 0; index < BYTES; index++) input[index] = (index * 7) & 0xff;
  device.queue.writeBuffer(source, 0, input);

  const encoder = device.createCommandEncoder({ label: `${label}:copy` });
  encoder.copyBufferToBuffer(source, 0, readback, 0, BYTES);
  device.queue.submit([encoder.finish()]);

  await readback.mapAsync('read', 0, BYTES);
  const output = new Uint8Array(readback.getMappedRange(0, BYTES)).slice();
  readback.unmap();
  source.destroy();
  readback.destroy();

  let mismatches = 0;
  for (let index = 0; index < BYTES; index++) {
    if (output[index] !== input[index]) mismatches += 1;
  }
  return `${BYTES} 字节中 ${mismatches} 个不一致`;
}

/** 捕获一次调用的报错原文（不抛出去，交给调用方判断）。 */
function capture(action: () => void): string {
  try {
    action();
    return '(没有抛错)';
  } catch (error) {
    return `${(error as Error).name}: ${(error as Error).message.split('\n')[0]}`;
  }
}

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

/** 轮询等待某个条件成立；超时返回 false（比固定 sleep 稳）。 */
async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await sleep(50);
  }
  return predicate();
}

async function runWebGL2(canvas: HTMLCanvasElement): Promise<Check[]> {
  const checks: Check[] = [];
  const created = await createDeviceWithAdapter({
    canvas,
    backend: 'webgl2',
    strictBackend: true,
    label: 'lost-demo',
    contextAttributes: { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: false },
  });
  const device = created.device;
  const webgl2 = device as unknown as WebGL2Device;
  const gl = device.native as WebGL2RenderingContext;

  const before = await bufferRoundTrip(device, 'before');
  checks.push({
    name: '丢失前：buffer 往返读回一致（设备确实可用）',
    ok: before.endsWith('0 个不一致'),
    detail: before,
  });

  const extension = gl.getExtension('WEBGL_lose_context') as {
    loseContext(): void;
    restoreContext(): void;
  } | null;
  if (!extension) {
    checks.push({
      name: 'WEBGL_lose_context 扩展可用（没有它就无法主动丢上下文）',
      ok: false,
      detail: '当前浏览器没有暴露 WEBGL_lose_context，无法在真实环境里验证丢失路径',
    });
    return checks;
  }

  const restoredEvents: unknown[] = [];
  webgl2.onContextRestored((info) => restoredEvents.push(info));

  extension.loseContext();
  // `webglcontextlost` 是异步派发的（一个 task）。
  await waitFor(() => device.usable === false);
  const detected = await waitFor(() => gl.isContextLost());

  checks.push({
    name: '丢失被检测到：usable=false 且 lostInfo 可查询',
    ok: device.usable === false && device.lostInfo !== null && detected,
    detail: `usable=${device.usable} reason=${device.lostInfo?.reason} gl.isContextLost()=${gl.isContextLost()}`,
  });

  const createError = capture(() => device.createBuffer({ size: 16, usage: BufferUsage.CopyDst }));
  checks.push({
    name: '丢失后创建资源抛带前缀的 DeviceLostError',
    ok: createError.startsWith('DeviceLostError') && createError.includes('[gpu-device-api] '),
    detail: createError,
  });

  const submitError = capture(() => {
    const encoder = device.createCommandEncoder({ label: 'after-loss' });
    device.queue.submit([encoder.finish()]);
  });
  checks.push({
    name: '丢失后录制 / 提交也明确报错（不是静默丢弃）',
    ok: submitError.includes('[gpu-device-api] '),
    detail: submitError,
  });

  extension.restoreContext();
  await waitFor(() => webgl2.contextRestoredCount >= 1);

  checks.push({
    name: 'webglcontextrestored 如实上报（订阅回调 + 计数 + 上下文恢复）',
    ok: webgl2.contextRestoredCount >= 1 && restoredEvents.length >= 1 && !gl.isContextLost(),
    detail:
      `count=${webgl2.contextRestoredCount} callbacks=${restoredEvents.length} ` +
      `gl.isContextLost()=${gl.isContextLost()}`,
  });

  checks.push({
    name: '恢复后 usable 仍然是 false（本层无法重建已有资源，如实上报而不是假装可用）',
    ok: device.usable === false,
    detail: `usable=${device.usable} lostInfo.reason=${device.lostInfo?.reason}`,
  });

  // 恢复流程：丢弃旧设备 → 重新创建设备 → 一切从头开始。
  device.dispose();
  const recreated = await createDeviceWithAdapter({
    canvas,
    backend: 'webgl2',
    strictBackend: true,
    label: 'lost-demo#2',
  });
  const after = await bufferRoundTrip(recreated.device, 'after');
  checks.push({
    name: '重新创建设备后 buffer 往返依然一致（这就是恢复流程）',
    ok: after.endsWith('0 个不一致'),
    detail: after,
  });
  recreated.device.dispose();
  return checks;
}

async function runWebGPU(): Promise<Check[]> {
  const checks: Check[] = [];
  const created = await createDeviceWithAdapter({
    backend: 'webgpu',
    strictBackend: true,
    label: 'lost-demo',
  });
  const device = created.device;

  const before = await bufferRoundTrip(device, 'before');
  checks.push({
    name: '丢失前：buffer 往返读回一致（设备确实可用）',
    ok: before.endsWith('0 个不一致'),
    detail: before,
  });

  const notifications: string[] = [];
  device.onError((error) => notifications.push(`${error.name}: ${error.message.split('\n')[0]}`));

  const lostPromise = device.lost;
  // WebGPU 没有「主动丢失」的公开 API；escape hatch 到原生 destroy() 是唯一办法
  // （它正是浏览器关闭页面 / 设备被移除时走的同一条路）。
  (device.native as GPUDevice).destroy();
  await waitFor(() => device.usable === false);

  const lost = await Promise.race([lostPromise, sleep(500).then(() => null)]);
  checks.push({
    name: '丢失被检测到：usable=false、lostInfo 与 lost promise 都带原因',
    ok: device.usable === false && device.lostInfo?.reason === 'destroyed' && lost !== null,
    detail:
      `usable=${device.usable} reason=${device.lostInfo?.reason} ` +
      `message=${JSON.stringify(device.lostInfo?.message)}`,
  });

  checks.push({
    name: 'onError 收到了 DeviceLostError 通知',
    ok: notifications.some((line) => line.startsWith('DeviceLostError')),
    detail: notifications.join(' | ') || '(没有收到)',
  });

  const submitError = capture(() => device.queue.submit([]));
  checks.push({
    name: '丢失后 queue.submit() 抛 DeviceLostError（不再被静默丢弃）',
    ok: submitError.startsWith('DeviceLostError') && submitError.includes('[gpu-device-api] '),
    detail: submitError,
  });

  const createError = capture(() => device.createBuffer({ size: 16, usage: BufferUsage.CopyDst }));
  checks.push({
    name: '丢失后 createBuffer() 也明确报错',
    ok: createError.startsWith('DeviceLostError'),
    detail: createError,
  });

  device.dispose();
  const recreated = await createDeviceWithAdapter({
    backend: 'webgpu',
    strictBackend: true,
    label: 'lost-demo#2',
  });
  const after = await bufferRoundTrip(recreated.device, 'after');
  checks.push({
    name: '重新创建设备后 buffer 往返依然一致（WebGPU 唯一的恢复方式）',
    ok: after.endsWith('0 个不一致'),
    detail: after,
  });
  recreated.device.dispose();
  return checks;
}

async function run(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const requested = params.get('backend') ?? 'auto';
  const canvas = document.getElementById('view') as HTMLCanvasElement;

  setData('deviceLostResult', 'running');
  const probe = await createDeviceWithAdapter({
    canvas: requested === 'webgl2' ? canvas : undefined,
    backend: requested === 'webgl2' || requested === 'webgpu' ? requested : 'auto',
    strictBackend: requested !== 'auto',
    label: 'probe',
  });
  const backend = probe.backend;
  probe.device.dispose();
  setData('deviceLostBackend', backend);

  const checks = backend === 'webgl2' ? await runWebGL2(canvas) : await runWebGPU();

  const failed = checks.filter((check) => !check.ok);
  setData('deviceLostResult', failed.length === 0 ? 'pass' : 'fail');
  setData('deviceLostChecks', String(checks.length));
  setData('deviceLostFailed', String(failed.length));
  if (failed.length > 0) setData('deviceLostError', failed.map((check) => check.name).join(' | '));

  const lines = [
    `backend=${backend}`,
    '',
    ...checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'}  ${check.name} — ${check.detail}`),
    '',
    '说明：**完整恢复（自动重建全部资源）做不到** —— 丢失后旧设备上的资源对象全部失效，',
    '本层没有 descriptor 可以重放它们。正确做法是 dispose() 后重新创建设备并重建资源，',
    '最后一条检查就是在验证这条恢复路径本身可用。',
  ];
  const out = document.getElementById('out')!;
  out.textContent = lines.join('\n');
  out.className = failed.length === 0 ? 'pass' : 'fail';
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  setData('deviceLostResult', 'fail');
  setData('deviceLostError', message.replace(/\s+/g, ' '));
  const out = document.getElementById('out');
  if (out) {
    out.textContent = `非预期异常：\n${message}`;
    out.className = 'fail';
  }
});
