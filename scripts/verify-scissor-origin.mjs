#!/usr/bin/env node
/**
 * `setScissorRect` / `setViewport` 的 **Y 原点双后端探针**的运行器。
 *
 * 它做三件事，串行做完就退出：
 *
 * 1. 在指定端口（默认 5941）拉起一个**本仓库自己的** vite dev server（不碰用户 5173 上那个）；
 * 2. 分别用 WebGL2（`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`）与
 *    WebGPU（`--enable-unsafe-webgpu`）跑一遍 `examples/scissor-origin.html` —— 两组 flag
 *    **不能同时加**，所以是两次独立的 Chrome 进程；
 * 3. 把 `data-*` 读数打印成对照表，并做跨后端断言，最后回收 dev server 与 Chrome 的临时 profile。
 *
 * 用法：
 *   node scripts/verify-scissor-origin.mjs [--chrome "<chrome.exe>"] [--port 5941] [--cwd <dir>]
 *
 * 退出码：0 = 两个后端都拿到结论且断言通过；1 = 任一环节失败。
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/* ------------------------------------------------------------------------------------------------ */
/* 参数                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const DEFAULTS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const options = { port: 5941, chrome: null, cwd: process.cwd() };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === '--chrome') options.chrome = argv[(index += 1)];
  else if (arg === '--port') options.port = Number(argv[(index += 1)]);
  else if (arg === '--cwd') options.cwd = argv[(index += 1)];
  else throw new Error(`[gpu-device-api] verify-scissor-origin: 未知参数 "${arg}"。`);
}
if (!options.chrome) options.chrome = DEFAULTS.find((candidate) => existsSync(candidate)) ?? null;
if (!options.chrome || !existsSync(options.chrome)) {
  throw new Error('[gpu-device-api] verify-scissor-origin: 找不到 Chrome，请用 --chrome 指定。');
}

const base = `http://localhost:${options.port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------------------------------------ */
/* 子进程小工具                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** 跑一个子进程并把 stdout/stderr 都收回来；非 0 退出不抛，交给调用方判定。 */
function run(command, args, { timeoutMs = 180000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      stderr += `\n[runner] 超时 ${timeoutMs}ms，kill。`;
      child.kill();
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* dev server                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

async function startDevServer() {
  const viteBin = path.join(options.cwd, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteBin)) {
    throw new Error(`[gpu-device-api] verify-scissor-origin: 找不到 ${viteBin}，先装依赖。`);
  }
  const child = spawn(
    process.execPath,
    [viteBin, '--port', String(options.port), '--strictPort', '--host', 'localhost'],
    { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let log = '';
  child.stdout.on('data', (chunk) => {
    log += chunk;
  });
  child.stderr.on('data', (chunk) => {
    log += chunk;
  });

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/examples/scissor-origin.html`, { method: 'GET' });
      if (response.ok) return { child, log: () => log };
    } catch {
      // 还没起来。
    }
    await sleep(300);
  }
  child.kill();
  throw new Error(`[gpu-device-api] verify-scissor-origin: dev server 没能在 60s 内起来。\n${log}`);
}

/* ------------------------------------------------------------------------------------------------ */
/* 探针                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

const BACKENDS = [
  {
    key: 'webgl2',
    flags: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    chromePort: options.port + 1,
  },
  { key: 'webgpu', flags: ['--enable-unsafe-webgpu'], chromePort: options.port + 2 },
];

/** 把 verify-headless 的 `data-*` 输出解析成对象。 */
function parseData(stdout) {
  const data = {};
  for (const line of stdout.split(/\r?\n/)) {
    const match = /^\s{2}data-([A-Za-z0-9-]+)=(.*)$/.exec(line);
    if (match) data[match[1]] = match[2];
  }
  return data;
}

async function runBackend(backend) {
  const script = path.join(options.cwd, 'scripts', 'verify-headless.mjs');
  const url = `${base}/examples/scissor-origin.html?backend=${backend.key}`;
  const result = await run(process.execPath, [
    script,
    '--chrome',
    options.chrome,
    '--url',
    url,
    '--wait',
    'scissorResult',
    '--timeout',
    '120000',
    '--port',
    String(backend.chromePort),
    '--',
    ...backend.flags,
  ]);
  return { backend: backend.key, code: result.code, data: parseData(result.stdout), stdout: result.stdout, stderr: result.stderr };
}

/* ------------------------------------------------------------------------------------------------ */
/* 打印与断言                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** 探针写出的三组测量（画布直接画 / 纹理不翻投影 / 纹理翻投影），每组都有 full、raw、helper。 */
const GROUPS = [
  { title: 'canvas 通道（默认帧缓冲，不翻投影）', prefix: 'canvas', canvas: true },
  { title: '离屏纹理（不翻投影）', prefix: 'texturePlain', canvas: false },
  { title: '离屏纹理（投影按 gfx 默认翻过 Y）', prefix: 'textureFlipped', canvas: false },
];
const MODES = [
  { key: 'Full', title: '全屏（不设 scissor）' },
  { key: 'Raw', title: '不转换 (0,0,64,32)' },
  { key: 'Helper', title: 'helper 转换后      ' },
];

function printBackend(run) {
  const d = run.data;
  console.log(`\n=== backend=${run.backend}（退出码 ${run.code}）===`);
  console.log(`  adapter: ${d.scissorAdapter ?? '(未知)'}`);
  for (const group of GROUPS) {
    console.log(`  --- ${group.title} ---`);
    for (const mode of MODES) {
      const prefix = `${group.prefix}${mode.key}`;
      if (d[`${prefix}Measured`] !== 'true') {
        console.log(`    ${mode.title}：(不可读回)`);
        continue;
      }
      const suffix = group.canvas
        ? ''
        : ` origin=${d[`${prefix}Origin`]} rowOrder=${d[`${prefix}RowOrder`]}　blit 到 canvas 后=${d[`${prefix}CanvasRows`]}`;
      console.log(
        `    ${mode.title}：scissor=${d[`${prefix}Scissor`]}　纹素行签名=${d[`${prefix}Rows`]}${suffix}`,
      );
    }
  }
}

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}

/**
 * 把一份行签名解析成「每一段颜色覆盖的行区间」。
 * 输入形如 `G32R32`（全屏）或 `R32K32`（scissor 之后）。
 */
function parseSegments(signature) {
  if (typeof signature !== 'string') return null;
  const segments = [];
  let at = 0;
  for (const match of signature.matchAll(/([A-Za-z?])(\d+)/g)) {
    const count = Number(match[2]);
    segments.push({ code: match[1], from: at, to: at + count });
    at += count;
  }
  return segments.length === 0 ? null : segments;
}

/** scissor 之后应当只剩「一个颜色段 + 一段黑」；返回那个颜色段（全屏签名没有黑，返回 null）。 */
function litSegment(signature) {
  const segments = parseSegments(signature);
  if (!segments) return null;
  const lit = segments.filter((segment) => segment.code !== 'K');
  const dark = segments.filter((segment) => segment.code === 'K');
  return lit.length === 1 && dark.length === 1 ? lit[0] : null;
}

/** 全屏基准里「离附件第 0 行近」与「远」的两个色段。 */
function endsOf(signature) {
  const segments = parseSegments(signature);
  if (!segments) return null;
  const colored = segments.filter((segment) => segment.code === 'R' || segment.code === 'G');
  if (colored.length !== 2) return null;
  const near = colored[0].from < colored[1].from ? colored[0] : colored[1];
  return { near, far: near === colored[0] ? colored[1] : colored[0] };
}

/**
 * 跨后端断言。
 *
 * 基准（由真实合成截图锚定，`?probe=split`）：**canvas 上半 = 红、下半 = 绿**。
 * 每条通道各自的全屏签名（`*FullRows`）给出「红占哪些行」，scissor 之后放行的是不是图像上半，
 * 就看放行的那一段是不是**红的那一段**。
 */
function crossCheck(runs) {
  const byBackend = new Map(runs.map((run) => [run.backend, run.data]));
  for (const run of runs) {
    check(
      run.code === 0 && run.data.scissorResult === 'ok',
      `${run.backend}: 页面没有给出 scissorResult=ok（${run.data.scissorError ?? '无错误信息'}）。`,
    );
    for (const group of GROUPS.filter((entry) => !entry.canvas)) {
      check(
        run.data[`${group.prefix}FullMeasured`] === 'true',
        `${run.backend}: ${group.title} 的全屏基准没有读回。`,
      );
    }
  }
  if (failures.length > 0) return;

  const gl = byBackend.get('webgl2');
  const gpu = byBackend.get('webgpu');

  /* 1. 纹素行序与「视觉上下」的关系：blit 只搬纹素，所以 canvas 读回必须与纹素行签名逐字相同。
   *    这一条同时说明行序归一化没有被重复应用。（WebGPU 读不回默认帧缓冲，跳过。） */
  for (const run of runs) {
    for (const group of GROUPS.filter((entry) => !entry.canvas)) {
      for (const mode of MODES) {
        const prefix = `${group.prefix}${mode.key}`;
        const onCanvas = run.data[`${prefix}CanvasRows`];
        if (typeof onCanvas !== 'string' || !/^[A-Za-z?]/.test(onCanvas)) continue;
        check(
          onCanvas === run.data[`${prefix}Rows`],
          `${run.backend} ${group.title} ${mode.title}：blit 后的行签名应当与纹素行序一致，` +
            `实测纹素=${run.data[`${prefix}Rows`]} canvas=${onCanvas}。`,
        );
      }
    }
  }

  /* 2. 每个通道两条结论，都用**该通道自己的全屏基准**当参照（不硬编码行号）：
   *    (a) 「不转换」放行的必须是**离附件第 0 行近的那一段**（`(0,0,W,H/2)` 选中的那一端）；
   *    (b) helper 之后放行的必须与 `imageOrigin` 自洽：`'bottomLeft'` 要翻到另一段，
   *        `'topLeft'` 是恒等、读数与 (a) 相同。
   *
   *    注：只有「附件坐标系相同」的通道之间才谈得上落在同一批纹素行（见第 5 条）——
   *    「图像空间」相对纹素行的朝向本身取决于投影有没有被翻。 */
  for (const run of runs) {
    const d = byBackend.get(run.backend);
    for (const group of GROUPS) {
      const ends = endsOf(d[`${group.prefix}FullRows`]);
      const raw = litSegment(d[`${group.prefix}RawRows`]);
      const helper = litSegment(d[`${group.prefix}HelperRows`]);
      const origin = d[`${group.prefix}HelperOrigin`];
      if (!ends || !raw || !helper) {
        check(
          false,
          `${run.backend} ${group.title}：读数不成形（基准=${d[`${group.prefix}FullRows`]} ` +
            `不转换=${d[`${group.prefix}RawRows`]} helper=${d[`${group.prefix}HelperRows`]}）。`,
        );
        continue;
      }
      check(
        raw.code === ends.near.code && raw.from === ends.near.from && raw.to === ends.near.to,
        `${run.backend} ${group.title} 不转换：应当落在离附件第 0 行近的那一段 ` +
          `${ends.near.code}@[${ends.near.from},${ends.near.to})，实测 ${raw.code}@[${raw.from},${raw.to})。`,
      );
      const target = origin === 'bottomLeft' ? ends.far : ends.near;
      check(
        helper.code === target.code && helper.from === target.from && helper.to === target.to,
        `${run.backend} ${group.title} helper 之后（imageOrigin=${origin}）：应当落在 ` +
          `${target.code}@[${target.from},${target.to})，实测 ${helper.code}@[${helper.from},${helper.to})。`,
      );
    }
  }

  /* 3. 同一条「不转换」，在 WebGL2 的两条离屏通道上落在**相反**的两半（这就是那条不自洽）；
   *    在 WebGPU 上两条通道落在**同一半**（WebGPU 没有「翻不翻投影」之外的变量，两种写法
   *    确实给出同一端 —— 这也是为什么「不转换」在 WebGPU 上看起来「一直是对的」）。 */
  const glPlain = litSegment(gl.texturePlainRawRows);
  const glFlipped = litSegment(gl.textureFlippedRawRows);
  const gpuPlain = litSegment(gpu.texturePlainRawRows);
  const gpuFlipped = litSegment(gpu.textureFlippedRawRows);
  check(
    glPlain && glFlipped && glPlain.from !== glFlipped.from,
    `WebGL2：不转换在「不翻投影 / 翻投影」两条离屏通道上应当落在相反的两半，` +
      `实测 ${gl.texturePlainRawRows} vs ${gl.textureFlippedRawRows}。`,
  );
  check(
    gpuPlain && gpuFlipped && gpuPlain.from === gpuFlipped.from,
    `WebGPU：不转换在两条离屏通道上应当落在同一半，` +
      `实测 ${gpu.texturePlainRawRows} vs ${gpu.textureFlippedRawRows}。`,
  );

  /* 4. helper 的矩形必须与 `imageOrigin` 自洽：topLeft = 恒等（y=0），bottomLeft = 翻到 y = H - h。
   *    这是「一处正确写法」的机械判据，与具体通道无关。 */
  for (const run of runs) {
    const d = byBackend.get(run.backend);
    for (const group of GROUPS) {
      const rect = d[`${group.prefix}HelperScissor`];
      const origin = d[`${group.prefix}HelperOrigin`];
      if (typeof rect !== 'string' || rect === 'full') continue;
      const [x, y, width, height] = rect.split(',').map(Number);
      check(x === 0 && width === 64 && height === 32, `${run.backend} ${group.title}：helper 矩形形状不对，实测 ${rect}。`);
      if (origin === 'topLeft') {
        check(y === 0, `${run.backend} ${group.title}：topLeft 应当是恒等（y=0），实测 ${rect}。`);
      } else if (origin === 'bottomLeft') {
        check(y === 32, `${run.backend} ${group.title}：bottomLeft 应当翻到 y=32，实测 ${rect}。`);
      } else {
        check(false, `${run.backend} ${group.title}：imageOrigin 取值异常 "${origin}"。`);
      }
    }
  }

  /* 5. 附件坐标系相同的通道之间，helper 必须给出**同一批纹素行**：
   *    · WebGL2 的 canvas 通道与「不翻投影」离屏通道都是 bottomLeft（同一套图像空间朝向）；
   *    · 两个后端的 canvas 语义同样是 bottomLeft（WebGPU 无法实测，但离屏已覆盖该取值）；
   *    · 「翻投影」的离屏通道是 topLeft。 */
  check(
    gl.canvasHelperRows === gl.texturePlainHelperRows,
    `WebGL2：canvas 与「不翻投影」离屏的 helper 读数应当相同，` +
      `实测 canvas=${gl.canvasHelperRows} 离屏=${gl.texturePlainHelperRows}。`,
  );
  check(
    gl.canvasHelperOrigin === gl.texturePlainHelperOrigin,
    `WebGL2：canvas 与「不翻投影」离屏的 imageOrigin 应当相同（都是 bottomLeft），` +
      `实测 ${gl.canvasHelperOrigin} / ${gl.texturePlainHelperOrigin}。`,
  );
  check(
    gpu.textureFlippedHelperRows !== gpu.texturePlainHelperRows,
    `WebGPU：不翻/翻投影两条离屏通道的 helper 落在**不同**的纹素行是对的（两套图像空间朝向），` +
      `实测 不翻=${gpu.texturePlainHelperRows} 翻过=${gpu.textureFlippedHelperRows}。`,
  );

  /* 6. canvas 通道（仅 WebGL2 可实测）：不转换与 helper 落在相反的两半。 */
  check(gl.canvasRawMeasured === 'true', 'WebGL2 应当报出 canvas 通道的实测读数。');

  /* 7. WebGPU 的 canvas 交换链读不回来，页面必须如实说不实测。 */
  check(gpu.gpuCanvasMeasured === 'false', 'WebGPU 的 canvas 不该被报告成实测。');
  check(gpu.canvasRawMeasured !== 'true', 'WebGPU 不该报出 canvas 通道的实测读数。');
}

/* ------------------------------------------------------------------------------------------------ */

const server = await startDevServer();
console.log(`[runner] dev server 就绪：${base}/examples/scissor-origin.html`);

const runs = [];
try {
  for (const backend of BACKENDS) {
    console.log(`\n[runner] 开跑 ${backend.key} …`);
    const run = await runBackend(backend);
    runs.push(run);
    printBackend(run);
    if (run.code !== 0 || run.data.scissorResult !== 'ok') {
      const tail = run.stdout.split(/\r?\n/).slice(-12).join('\n');
      console.error(`[runner] ${backend.key} 没有给出结论（退出码 ${run.code}）。stdout/stderr 末尾：`);
      console.error(tail);
      console.error(run.stderr.split(/\r?\n/).slice(-8).join('\n'));
    }
  }
} finally {
  server.child.kill();
}

crossCheck(runs);

if (failures.length > 0) {
  console.error('\n[runner] 断言失败：');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\n[runner] 全部断言通过。');
process.exit(0);
