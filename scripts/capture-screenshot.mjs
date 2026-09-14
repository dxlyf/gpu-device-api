#!/usr/bin/env node
/**
 * 真实合成截图的小工具：打开页面 → 等 `data-*` 结论 → 读 canvas rect 与页面自检 →
 * `Page.captureScreenshot` 存盘（供 scripts/analyze-screenshot.mjs 统计）。
 *
 * 用 CDP 而不是 `chrome --screenshot` 的理由：WebGPU 的异步（requestAdapter / mapAsync）在
 * 真实时间里才能跑完，而 `--virtual-time-budget` 会抢跑；CDP 里可以按真实时间轮询，
 * 等到页面自己给出结论再截图。WebGL2 也能用同一套流程，两边口径完全一致。
 *
 * 用法：
 *   node scripts/capture-screenshot.mjs --chrome <chrome.exe> --url <url> --wait <dataKey> \
 *     --out <png> [--width 966] [--height 678] [--timeout 90000] [--dpr 1] [-- <chrome flags>]
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
const profileDir = mkdtempSync(join(tmpdir(), 'gpu-device-api-shot-'));

const chrome = spawn(
  options.chrome,
  [
    '--headless=new',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    `--remote-debugging-port=${options.port}`,
    '--remote-allow-origins=*',
    '--hide-scrollbars',
    `--window-size=${options.width},${options.height}`,
    `--force-device-scale-factor=${options.dpr}`,
    `--user-data-dir=${profileDir}`,
    ...options.flags,
    options.url,
  ],
  { stdio: 'ignore' },
);

let socket = null;
function shutdown() {
  try {
    socket?.close();
  } catch {
    /* 关闭失败无所谓 */
  }
  try {
    chrome.kill();
  } catch {
    /* 同上 */
  }
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    /* 临时 profile 删不掉不影响结论 */
  }
}
process.on('exit', shutdown);

async function findPageTarget() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${options.port}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      /* Chrome 还没起来 */
    }
    await sleep(200);
  }
  throw new Error('[gpu-device-api] capture-screenshot: Chrome did not expose a page target.');
}

const target = await findPageTarget();
socket = new WebSocket(target.webSocketDebuggerUrl);
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
shutdown();
process.exit(0);
