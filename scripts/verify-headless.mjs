#!/usr/bin/env node
/**
 * 无头浏览器里抓 `data-*` 结论的小工具。
 *
 * 为什么不能只用 `chrome --dump-dom`：它在 load 事件之后就 dump，而 WebGPU 的
 * `requestAdapter` / `requestDevice` / `mapAsync` 都是**真实**异步 —— `--virtual-time-budget`
 * 会抢在回调之前把虚拟时间耗尽（抓不到），模块里的顶层 await 也不会推迟 load 事件（实测）。
 * 于是 `--dump-dom` 拿到的往往还是「运行中…」。
 *
 * 这个脚本改用 CDP（DevTools 协议）在真实时间里轮询页面写好的 `data-*`：
 * 拿到结论再退出，并把全部 `data-*` 与页面里的 `#out` / `#progress` 文本打印出来。
 *
 * 用法：
 *   node scripts/verify-headless.mjs --chrome "<chrome.exe>" --url <url> --wait <dataKey> \
 *     [--timeout 90000] [--port 9333] [--profile <dir>] [-- <额外的 chrome flags>]
 *
 * 例（WebGL2 用软件光栅化，WebGPU 需要 --enable-unsafe-webgpu；两者不能同时开）：
 *   node scripts/verify-headless.mjs --chrome "$chrome" --wait depthResult \
 *     --url "http://localhost:5199/examples/depth.html?backend=webgl2" \
 *     -- --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
 *   node scripts/verify-headless.mjs --chrome "$chrome" --wait depthResult \
 *     --url "http://localhost:5199/examples/depth.html?backend=webgpu" -- --enable-unsafe-webgpu
 *
 * 退出码：0 = 拿到了结论且不是 `fail`；1 = 超时、结论是 `fail`、或页面抛了异常。
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function parseArgs(argv) {
  const options = { timeout: 90000, port: 9333, profile: null, flags: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      options.flags = argv.slice(index + 1);
      break;
    }
    if (arg === '--chrome') options.chrome = argv[(index += 1)];
    else if (arg === '--url') options.url = argv[(index += 1)];
    else if (arg === '--wait') options.wait = argv[(index += 1)];
    else if (arg === '--timeout') options.timeout = Number(argv[(index += 1)]);
    else if (arg === '--port') options.port = Number(argv[(index += 1)]);
    else if (arg === '--profile') options.profile = argv[(index += 1)];
    else throw new Error(`[gpu-device-api] verify-headless: unknown argument "${arg}".`);
  }
  if (!options.chrome) throw new Error('[gpu-device-api] verify-headless: --chrome is required.');
  if (!options.url) throw new Error('[gpu-device-api] verify-headless: --url is required.');
  if (!options.wait) throw new Error('[gpu-device-api] verify-headless: --wait is required.');
  return options;
}

const options = parseArgs(process.argv.slice(2));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profileDir = options.profile ?? mkdtempSync(join(tmpdir(), 'gpu-device-api-headless-'));

const chrome = spawn(
  options.chrome,
  [
    '--headless=new',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    `--remote-debugging-port=${options.port}`,
    // Node 的 WebSocket 会带 Origin 头，Chrome 默认只允许同源连接 DevTools。
    '--remote-allow-origins=*',
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
    // 关闭失败无所谓：进程马上就要退出了。
  }
  try {
    chrome.kill();
  } catch {
    // 同上。
  }
  if (!options.profile) {
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // 临时 profile 删不掉不影响结论。
    }
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
      // Chrome 还没起来，继续等。
    }
    await sleep(200);
  }
  throw new Error('[gpu-device-api] verify-headless: Chrome did not expose a page target.');
}

const target = await findPageTarget();
socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 0;
function send(method, params) {
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

const expression = `JSON.stringify({
  result: document.documentElement.dataset[${JSON.stringify(options.wait)}] ?? null,
  data: { ...document.documentElement.dataset },
  text: (document.getElementById('out') ?? document.getElementById('progress'))?.textContent ?? '',
})`;

/**
 * 页面上写进 `data-<key>` 的值算不算「已经有结论」。
 *
 * 不能只判真假：页面在开始时写的 `0` / `false`（字符串或数字）都是真值，
 * 会被误判成「已经跑完」（曾经把 WebGPU 的 benchmark 提前当成 done）。
 * `fail` 仍算结论 —— 失败也要立刻报出来，而不是等到超时。
 */
function isTerminalResult(result) {
  if (result === undefined || result === null) return false;
  const text = String(result).trim();
  return text !== '' && text !== '0' && text !== 'false' && text !== 'running';
}

const deadline = Date.now() + options.timeout;
let payload = null;
while (Date.now() < deadline) {
  const evaluated = await send('Runtime.evaluate', { expression, returnByValue: true });
  const value = evaluated?.result?.value;
  if (typeof value === 'string') {
    payload = JSON.parse(value);
    if (isTerminalResult(payload.result)) break;
  }
  await sleep(400);
}

if (!isTerminalResult(payload?.result)) {
  console.error(`[gpu-device-api] verify-headless: timed out waiting for data-${options.wait}.`);
  if (payload) console.error(JSON.stringify(payload.data, null, 2));
  shutdown();
  process.exit(1);
}

console.log(`data-${options.wait}=${payload.result}`);
for (const [key, value] of Object.entries(payload.data)) console.log(`  data-${key}=${value}`);
if (payload.text.trim()) {
  console.log('--- page log ---');
  console.log(payload.text.trim());
}

const failed = payload.result === 'fail' || payload.result === 'false';
shutdown();
process.exit(failed ? 1 : 0);
