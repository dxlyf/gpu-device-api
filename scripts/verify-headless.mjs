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
 * 临时 profile（Chrome 的 `--user-data-dir`）建在系统临时目录下，由 scripts/headless-chrome.mjs
 * 统一管理：启动时清扫陈旧残留、所有退出路径（正常 / exit / 信号 / 未捕获异常）都回收。
 * 历史事故见该文件头部说明 —— 被管道提前掐断时留下的 profile 曾堆到 34GB。
 *
 * 用法：
 *   node scripts/verify-headless.mjs --chrome "<chrome.exe>" --url <url> --wait <dataKey> \
 *     [--timeout 90000] [--port 9333] [--profile <dir>] [-- <额外的 chrome flags>]
 *
 * `--timeout` 既约束等 `data-*` 结论的时间，也约束「等 Chrome 暴露 page target」的总重试预算
 * （下限 30s、上限 120s）。等 page target 失败时会退避重试，详见 headless-chrome.mjs。
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

import {
  PROFILE_PREFIX_HEADLESS,
  createHeadlessSession,
  describeKeptProfile,
  formatSweepReport,
  installSessionCleanup,
  noteworthyKeptProfiles,
  sweepStaleProfiles,
} from './headless-chrome.mjs';

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
const label = '[gpu-device-api] verify-headless:';
// 诊断信息一律走 stderr：stdout 只留 `data-*` 结论，别打乱调用方的解析。
const log = (message) => console.error(message);

// 启动时先清扫：上一次被掐断（或删失败）的运行留下的 profile。
// 只认本工具自己的三个前缀；所有者进程还活着的目录一律跳过（并行运行的另一个调用）。
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
    // Node 的 WebSocket 会带 Origin 头，Chrome 默认只允许同源连接 DevTools。
    '--remote-allow-origins=*',
  ],
  flags: options.flags,
  url: options.url,
  port: options.port,
  profilePrefix: PROFILE_PREFIX_HEADLESS,
  // 显式传了 --profile 就原样用那个目录，且退出时不删（保持原有行为）。
  profileDir: options.profile,
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
  console.error(`${label} timed out waiting for data-${options.wait}.`);
  if (payload) console.error(JSON.stringify(payload.data, null, 2));
  await session.stop();
  process.exit(1);
}

console.log(`data-${options.wait}=${payload.result}`);
for (const [key, value] of Object.entries(payload.data)) console.log(`  data-${key}=${value}`);
if (payload.text.trim()) {
  console.log('--- page log ---');
  console.log(payload.text.trim());
}

const failed = payload.result === 'fail' || payload.result === 'false';
await session.stop();
process.exit(failed ? 1 : 0);
