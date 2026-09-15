#!/usr/bin/env node
/**
 * 跨后端像素一致性检查：同一个示例页分别在 WebGL2 与 WebGPU 上跑一遍，比对页面自己写进
 * `data-*` 的像素结论（`data-<prefix>-pixel` / `data-<prefix>-lit-pixels`）。
 *
 * 为什么需要它：本库的核心承诺是「换后端就能画」。同一份纹理数据在两个后端画出来必须落在同一个
 * 像素上 —— 一旦某个后端在纹理行序、UV 原点或读回行序上跑偏，中心像素会直接跳到相邻的格子上
 * （`examples/core-texture.html` 的棋盘格就是按这个思路设计的：相邻两格颜色差别极大，
 * 上下翻一行就会从 `51,100,184` 变成 `220,162,81`）。
 *
 * 为什么必须用 `?verify=1` 的离屏自检而不是页内 `drawImage`：示例的画布是
 * `preserveDrawingBuffer: false`，合成之后页内读回一律是黑的（见
 * `scripts/analyze-screenshot.mjs` 的说明）。`verifyOffscreen` 走的是
 * `copyTextureToBuffer` + `mapAsync`，是真实可读的那条路。
 *
 * 两个后端不能同时开（Chrome 的软件光栅化与 WebGPU 标志互斥），所以这里顺序起两次 Chrome。
 * 页面必须用 `spin=0` 固定动画角度，否则每个后端的自检时刻不同、画面本来就对不上。
 *
 * 用法：
 *   node scripts/verify-texture-parity.mjs --chrome "<chrome.exe>" \
 *     --url "http://localhost:5399/examples/core-texture.html" [--tolerance 8] [--timeout 90000]
 *
 * 退出码：0 = 两个后端的像素结论一致；1 = 不一致 / 某个后端没出结论 / 页面报错。
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const options = { timeout: 90000, tolerance: 8, wait: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--chrome') options.chrome = argv[(index += 1)];
    else if (arg === '--url') options.url = argv[(index += 1)];
    else if (arg === '--wait') options.wait = argv[(index += 1)];
    else if (arg === '--tolerance') options.tolerance = Number(argv[(index += 1)]);
    else if (arg === '--timeout') options.timeout = Number(argv[(index += 1)]);
    else throw new Error(`[gpu-device-api] verify-texture-parity: unknown argument "${arg}".`);
  }
  if (!options.chrome) throw new Error('[gpu-device-api] verify-texture-parity: --chrome is required.');
  if (!options.url) throw new Error('[gpu-device-api] verify-texture-parity: --url is required.');
  if (!Number.isFinite(options.tolerance) || options.tolerance < 0) {
    throw new Error('[gpu-device-api] verify-texture-parity: --tolerance must be a non-negative number.');
  }
  // 默认等 `<prefix>Pixel` 里最常用的那个：先探一次页面写了哪些 data-* 再决定也行，
  // 但固定成 texturePixel 更省事，示例页改名前只要传 --wait 就能复用。
  options.wait = options.wait ?? 'texturePixel';
  return options;
}

const options = parseArgs(process.argv.slice(2));

/** 两个后端的启动参数（互斥，所以分两次跑）。 */
const BACKENDS = [
  {
    backend: 'webgl2',
    flags: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
  { backend: 'webgpu', flags: ['--enable-unsafe-webgpu'] },
];

/** 把 `backend` / `verify` / `spin` 三个查询参数钉成检查需要的取值。 */
function buildUrl(url, backend) {
  const parsed = new URL(url);
  parsed.searchParams.set('backend', backend);
  parsed.searchParams.set('verify', '1');
  // 固定动画角度：两个后端的自检必须画同一帧，否则比较没有意义。
  parsed.searchParams.set('spin', '0');
  return parsed.toString();
}

/** 起一次无头 Chrome，等 `data-<wait>` 出现，返回整份 `data-*`。 */
async function collect(url, flags, port) {
  const profileDir = mkdtempSync(join(tmpdir(), 'gpu-device-api-parity-'));
  const chrome = spawn(
    options.chrome,
    [
      '--headless=new',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      `--remote-debugging-port=${port}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDir}`,
      ...flags,
      url,
    ],
    { stdio: 'ignore' },
  );

  let socket = null;
  const cleanup = () => {
    try {
      socket?.close();
    } catch {
      /* 关闭失败无所谓：进程马上退出 */
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
  };

  try {
    // 等 Chrome 暴露 page target。
    const deadline = Date.now() + 30000;
    let target = null;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`);
        const targets = await response.json();
        target = targets.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl) ?? null;
        if (target) break;
      } catch {
        /* Chrome 还没起来 */
      }
      await sleep(200);
    }
    if (!target) throw new Error('[gpu-device-api] verify-texture-parity: Chrome did not expose a page target.');

    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });

    let nextId = 0;
    const send = (method, params) =>
      new Promise((resolve, reject) => {
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

    const expression = 'JSON.stringify({ ...document.documentElement.dataset })';
    const waitDeadline = Date.now() + options.timeout;
    let data = {};
    while (Date.now() < waitDeadline) {
      const evaluated = await send('Runtime.evaluate', { expression, returnByValue: true });
      const value = evaluated?.result?.value;
      if (typeof value === 'string') {
        data = JSON.parse(value);
        const result = data[options.wait];
        if (result !== undefined && String(result).trim() !== '' && String(result).trim() !== 'running') break;
      }
      await sleep(400);
    }
    return data;
  } finally {
    cleanup();
  }
}

/** `data-*` 里以 `Pixel` 结尾的值按 `r,g,b` 解析。 */
function parsePixel(text) {
  const parts = String(text)
    .split(',')
    .map((piece) => Number(piece.trim()));
  return parts.length === 3 && parts.every((value) => Number.isFinite(value)) ? parts : null;
}

const results = [];
let failed = false;

for (let index = 0; index < BACKENDS.length; index += 1) {
  const entry = BACKENDS[index];
  const url = buildUrl(options.url, entry.backend);
  const data = await collect(url, entry.flags, 9500 + index);
  results.push({ backend: entry.backend, data });

  const reported = data.exampleBackend ?? '(none)';
  const lines = Object.entries(data)
    .map(([key, value]) => `    data-${key}=${value}`)
    .join('\n');
  console.log(`[verify-texture-parity] ${entry.backend} → 页面自报后端 ${reported}`);
  console.log(lines || '    (页面没有写任何 data-*)');
  if (data.exampleBackend !== entry.backend) {
    console.error(
      `[gpu-device-api] verify-texture-parity: ${entry.backend} 这一轮页面实际用的是 ` +
        `${String(reported)}，结论不可比。`,
    );
    failed = true;
  }
  if (data.exampleLastError !== undefined || data.textureError !== undefined) {
    console.error(
      `[gpu-device-api] verify-texture-parity: ${entry.backend} 报了错：` +
        `${String(data.textureError ?? data.exampleLastError)}`,
    );
    failed = true;
  }
}

/* ---- 比对 ---- */
const [gl, gpu] = results;
const pixelKeys = Object.keys(gl.data).filter((key) => key.endsWith('Pixel') && gpu.data[key] !== undefined);
if (pixelKeys.length === 0) {
  console.error('[gpu-device-api] verify-texture-parity: 两个后端没有共同的 `data-*Pixel` 键，无法比对。');
  failed = true;
}

console.log('');
for (const key of pixelKeys) {
  const a = parsePixel(gl.data[key]);
  const b = parsePixel(gpu.data[key]);
  if (!a || !b) {
    console.error(`[gpu-device-api] verify-texture-parity: data-${key} 不是 r,g,b（${gl.data[key]} / ${gpu.data[key]}）。`);
    failed = true;
    continue;
  }
  const diffs = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])];
  const worst = Math.max(...diffs);
  const ok = worst <= options.tolerance;
  if (!ok) failed = true;
  console.log(
    `${ok ? '  OK  ' : ' FAIL '} data-${key}: webgl2=${a.join(',')} webgpu=${b.join(',')} ` +
      `逐通道差 ${diffs.join(',')}（最大 ${worst}，容差 ${options.tolerance}）`,
  );
}

// 被点亮的像素数：两侧都不该是 0，且相对差不超过 2%（光栅化在两种驱动上可能差一两个像素）。
const litKeys = Object.keys(gl.data).filter((key) => key.endsWith('LitPixels') && gpu.data[key] !== undefined);
for (const key of litKeys) {
  const a = Number(gl.data[key]);
  const b = Number(gpu.data[key]);
  const relative = Math.abs(a - b) / Math.max(1, Math.max(a, b));
  const ok = a > 0 && b > 0 && relative <= 0.02;
  if (!ok) failed = true;
  console.log(
    `${ok ? '  OK  ' : ' FAIL '} data-${key}: webgl2=${a} webgpu=${b} 相对差 ${(relative * 100).toFixed(2)}%（上限 2%）`,
  );
}

if (failed) {
  console.error(
    '[gpu-device-api] verify-texture-parity: 两个后端的像素结论不一致 —— 这是「换后端就能画」的破坏性回归。',
  );
  process.exit(1);
}
console.log('[verify-texture-parity] 两个后端的像素结论一致。');
