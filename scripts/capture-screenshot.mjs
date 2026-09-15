#!/usr/bin/env node
/**
 * 真实合成截图的小工具：打开页面 → 等 `data-*` 结论 → 读 canvas rect 与页面自检 →
 * `Page.captureScreenshot` 存盘（供 scripts/analyze-screenshot.mjs 统计）。
 *
 * 用 CDP 而不是 `chrome --screenshot` 的理由：WebGPU 的异步（requestAdapter / mapAsync）在
 * 真实时间里才能跑完，而 `--virtual-time-budget` 会抢跑；CDP 里可以按真实时间轮询，
 * 等到页面自己给出结论再截图。WebGL2 也能用同一套流程，两边口径完全一致。
 *
 * 临时 profile（Chrome 的 `--user-data-dir`）建在系统临时目录下，由 scripts/headless-chrome.mjs
 * 统一管理：启动时清扫陈旧残留、所有退出路径（正常 / exit / 信号 / 未捕获异常）都回收。
 * 历史事故见该文件头部说明 —— 被管道提前掐断时留下的 profile 曾堆到 34GB。
 *
 * 用法：
 *   node scripts/capture-screenshot.mjs --chrome <chrome.exe> --url <url> --wait <dataKey> \
 *     --out <png> [--width 966] [--height 678] [--timeout 90000] [--dpr 1] [-- <chrome flags>]
 *
 * `--timeout` 既约束等 `data-*` 结论的时间，也约束「等 Chrome 暴露 page target」的总重试预算
 * （下限 30s、上限 120s），详见 headless-chrome.mjs。
 */

import { writeFileSync } from 'node:fs';
import {
  PROFILE_PREFIX_SHOT,
  createHeadlessSession,
  describeKeptProfile,
  formatSweepReport,
  installSessionCleanup,
  noteworthyKeptProfiles,
  sweepStaleProfiles,
} from './headless-chrome.mjs';

function parseArgs(argv) {
  const options = { timeout: 90000, port: 0, width: 966, height: 678, dpr: 1, flags: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      options.flags = argv.slice(index + 1);
      break;
    }
    if (arg === '--chrome') options.chrome = argv[(index += 1)];
    else if (arg === '--url') options.url = argv[(index += 1)];
    else if (arg === '--wait') options.wait = argv[(index += 1)];
    else if (arg === '--out') options.out = argv[(index += 1)];
    else if (arg === '--width') options.width = Number(argv[(index += 1)]);
    else if (arg === '--height') options.height = Number(argv[(index += 1)]);
    else if (arg === '--timeout') options.timeout = Number(argv[(index += 1)]);
    else if (arg === '--dpr') options.dpr = Number(argv[(index += 1)]);
    else if (arg === '--port') options.port = Number(argv[(index += 1)]);
    else throw new Error(`[gpu-device-api] capture-screenshot: unknown argument "${arg}".`);
  }
  if (!options.chrome || !options.url || !options.out) {
    throw new Error('[gpu-device-api] capture-screenshot: --chrome / --url / --out are required.');
  }
  // 调试端口默认随机：并行跑多个抓取时不会互相抢端口。
  if (options.port === 0) options.port = 9400 + Math.floor(Math.random() * 400);
  return options;
}

const options = parseArgs(process.argv.slice(2));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const label = '[gpu-device-api] capture-screenshot:';
// 诊断信息一律走 stderr，stdout 留给截图结论。
const log = (message) => console.error(message);

// 启动时先清扫：上一次被掐断（或删失败）的运行留下的 profile。
// 只认本工具自己的两个前缀；所有者进程还活着的目录一律跳过（并行运行的另一个调用）。
const sweep = sweepStaleProfiles();
if (sweep.scanned > 0) log(`${label} 启动清扫：${formatSweepReport(sweep)}。`);
for (const kept of noteworthyKeptProfiles(sweep)) log(`${label} 清扫跳过 — ${describeKeptProfile(kept)}`);

const session = createHeadlessSession({
  label,
  chrome: options.chrome,
  args: [
    '--headless=new',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    `--remote-debugging-port=${options.port}`,
    '--remote-allow-origins=*',
    '--hide-scrollbars',
    `--window-size=${options.width},${options.height}`,
    `--force-device-scale-factor=${options.dpr}`,
  ],
  flags: options.flags,
  url: options.url,
  port: options.port,
  profilePrefix: PROFILE_PREFIX_SHOT,
  timeoutMs: options.timeout,
  log,
});

installSessionCleanup(session, { label, log });

const target = await session.start();
let socket = new WebSocket(target.webSocketDebuggerUrl);
process.on('exit', () => {
  try {
    socket?.close();
  } catch {
    // 关闭失败无所谓：进程马上就要退出了。
  }
});
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 0;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = (nextId += 1);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      socket.removeEventListener('message', onMessage);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    };
    socket.addEventListener('message', onMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(`[gpu-device-api] capture-screenshot: 页面求值抛异常 ${JSON.stringify(result.exceptionDetails)}`);
  }
  return result.result?.value;
}

// 注意：`Runtime.evaluate` 在文档还没建立时就会跑，`document.documentElement` 可能是 null，
// 所以表达式整体要做空值保护（首次求值抛异常会把整个抓取打断）。
const probe = `(() => {
  if (!document.documentElement) return null;
  return JSON.stringify({
    data: { ...document.documentElement.dataset },
    text: (document.getElementById('out') ?? document.getElementById('progress'))?.textContent ?? '',
    rect: (() => { const c = document.getElementById('view') ?? document.querySelector('canvas');
      if (!c) return null; const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, bw: c.width, bh: c.height }; })(),
    dpr: window.devicePixelRatio,
  });
})()`;

const deadline = Date.now() + options.timeout;
let payload = null;
while (Date.now() < deadline) {
  const text = await evaluate(probe);
  if (typeof text === 'string') {
    payload = JSON.parse(text);
    const value = payload.data[options.wait];
    if (value !== undefined && String(value).trim() !== '' && String(value) !== 'running') break;
  }
  await sleep(400);
}

// 载入后多等一拍，让 rAF 至少跑一帧；`spin=0` 时角度是固定值，多等不影响画面口径。
await sleep(1500);
const finalText = await evaluate(probe);
if (typeof finalText === 'string') payload = JSON.parse(finalText);

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(options.out, Buffer.from(shot.data, 'base64'));

console.log(`[capture-screenshot] ${options.out}`);
console.log(`  rect=${JSON.stringify(payload.rect)} dpr=${payload.dpr}`);
console.log(`  result(data-${options.wait})=${payload.data[options.wait] ?? null}`);
for (const [key, value] of Object.entries(payload.data)) {
  if (key === options.wait) continue;
  console.log(`    data-${key}=${value}`);
}
if (payload.text && payload.text.trim()) {
  console.log('--- page out ---');
  console.log(payload.text.trim());
}
await session.stop();
process.exit(0);
